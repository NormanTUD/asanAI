<?php
/**
 * Blog Feedback System — Bootstrap
 * ---------------------------------
 * Initializes the SQLite schema, opens the connection, and exposes
 * small helpers used by every API endpoint.
 *
 * The DB is auto-created on first call. If the directory is not
 * writable by the web user (www-data), the bootstrap returns a
 * clear JSON error pointing at the setup command.
 */

require_once(__DIR__ . '/config.php');

function feedback_bootstrap(): PDO {
	static $pdo = null;
	if ($pdo !== null) return $pdo;

	$dir = dirname(FEEDBACK_DB_PATH);
	if (!is_dir($dir)) {
		@mkdir($dir, 0775, true);
	}
	if (!is_dir($dir) || !is_writable($dir)) {
		feedback_json_error(
			"Feedback data directory is not writable by the web user.\n" .
			"Path: " . FEEDBACK_DATA_DIR . "\n" .
			"Run:  sudo chown -R \$USER:\$USER " . FEEDBACK_DATA_DIR . " && sudo chmod -R 775 " . FEEDBACK_DATA_DIR . "\n" .
			"Or change FEEDBACK_DATA_DIR in api/feedback/config.php to a writable location.",
			500, 'data_dir'
		);
	}

	if (!file_exists(FEEDBACK_DB_PATH)) {
		@touch(FEEDBACK_DB_PATH);
		@chmod(FEEDBACK_DB_PATH, 0664);
	}
	if (!is_writable(FEEDBACK_DB_PATH) || !is_readable(FEEDBACK_DB_PATH)) {
		feedback_json_error(
			"SQLite database file is not readable+writable by the web user.\n" .
			"Path: " . FEEDBACK_DB_PATH . "\n" .
			"Run:  sudo chown \$USER:\$USER " . FEEDBACK_DB_PATH . " && sudo chmod 664 " . FEEDBACK_DB_PATH,
			500, 'sqlite_file'
		);
	}

	try {
		$pdo = new PDO('sqlite:' . FEEDBACK_DB_PATH);
		$pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
		$pdo->exec('PRAGMA journal_mode = WAL');
		$pdo->exec('PRAGMA foreign_keys = ON');
	} catch (Exception $e) {
		feedback_json_error('Could not open SQLite DB: ' . $e->getMessage() .
			' (path: ' . FEEDBACK_DB_PATH . ')', 500, 'sqlite_open');
	}

	feedback_init_schema($pdo);
	return $pdo;
}

function feedback_init_schema(PDO $pdo): void {
	$pdo->exec("
		CREATE TABLE IF NOT EXISTS feedback (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			uuid TEXT UNIQUE NOT NULL,
			lesson_slug TEXT NOT NULL,
			category TEXT DEFAULT 'bug',
			anchor_type TEXT NOT NULL,
			anchor_selector TEXT,
			anchor_xpath TEXT,
			anchor_quote TEXT,
			anchor_prefix TEXT,
			anchor_suffix TEXT,
			anchor_offset INTEGER,
			anchor_offset_end INTEGER,
			anchor_section TEXT,
			anchor_section_id TEXT,
			anchor_viewport_x INTEGER,
			anchor_viewport_y INTEGER,
			anchor_image_src TEXT,
			anchor_image_alt TEXT,
			anchor_caption TEXT,
			body TEXT NOT NULL,
			suggestion_original TEXT,
			suggestion_replacement TEXT,
			author_handle TEXT,
			author_email TEXT,
			visitor_id TEXT,
			status TEXT DEFAULT 'open',
			approved INTEGER DEFAULT 0,
			git_commit TEXT,
			git_branch TEXT,
			git_dirty INTEGER DEFAULT 0,
			upvotes INTEGER DEFAULT 0,
			downvotes INTEGER DEFAULT 0,
			aha_count INTEGER DEFAULT 0,
			reply_count INTEGER DEFAULT 0,
			created_at TEXT DEFAULT (datetime('now')),
			updated_at TEXT DEFAULT (datetime('now')),
			resolved_at TEXT,
			user_agent TEXT,
			page_url TEXT,
			viewport TEXT,
			anchor_status TEXT DEFAULT 'fresh',
			anchor_confidence REAL DEFAULT 1.0,
			last_reanchor_at TEXT
		)
	");
	$pdo->exec("CREATE INDEX IF NOT EXISTS idx_fb_lesson ON feedback(lesson_slug)");
	$pdo->exec("CREATE INDEX IF NOT EXISTS idx_fb_status ON feedback(status)");
	$pdo->exec("CREATE INDEX IF NOT EXISTS idx_fb_approved ON feedback(approved)");
	$pdo->exec("CREATE INDEX IF NOT EXISTS idx_fb_selector ON feedback(anchor_selector)");
	$pdo->exec("CREATE INDEX IF NOT EXISTS idx_fb_visitor ON feedback(visitor_id)");

	$pdo->exec("
		CREATE TABLE IF NOT EXISTS feedback_comments (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			feedback_id INTEGER NOT NULL,
			body TEXT NOT NULL,
			author_handle TEXT,
			author_email TEXT,
			visitor_id TEXT,
			is_admin INTEGER DEFAULT 0,
			is_resolution_note INTEGER DEFAULT 0,
			created_at TEXT DEFAULT (datetime('now')),
			FOREIGN KEY (feedback_id) REFERENCES feedback(id) ON DELETE CASCADE
		)
	");
	$pdo->exec("CREATE INDEX IF NOT EXISTS idx_fbc_fid ON feedback_comments(feedback_id)");
	$pdo->exec("CREATE INDEX IF NOT EXISTS idx_fbc_visitor ON feedback_comments(visitor_id)");

	$pdo->exec("
		CREATE TABLE IF NOT EXISTS feedback_reactions (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			feedback_id INTEGER,
			target_type TEXT NOT NULL,
			target_key TEXT NOT NULL,
			reaction TEXT NOT NULL,
			visitor_id TEXT NOT NULL,
			created_at TEXT DEFAULT (datetime('now')),
			FOREIGN KEY (feedback_id) REFERENCES feedback(id) ON DELETE CASCADE
		)
	");
	$pdo->exec("CREATE INDEX IF NOT EXISTS idx_fbr_target ON feedback_reactions(target_type, target_key)");
	$pdo->exec("CREATE INDEX IF NOT EXISTS idx_fbr_visitor ON feedback_reactions(visitor_id)");

	$pdo->exec("
		CREATE TABLE IF NOT EXISTS text_aha (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			lesson_slug TEXT NOT NULL,
			anchor_selector TEXT,
			anchor_quote TEXT,
			anchor_prefix TEXT,
			anchor_suffix TEXT,
			git_commit TEXT,
			count INTEGER DEFAULT 1,
			last_at TEXT DEFAULT (datetime('now'))
		)
	");
	$pdo->exec("CREATE INDEX IF NOT EXISTS idx_aha_slug ON text_aha(lesson_slug)");
	$pdo->exec("CREATE INDEX IF NOT EXISTS idx_aha_count ON text_aha(count DESC)");

	$pdo->exec("
		CREATE TABLE IF NOT EXISTS feedback_history (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			feedback_id INTEGER NOT NULL,
			action TEXT NOT NULL,
			actor TEXT,
			from_value TEXT,
			to_value TEXT,
			note TEXT,
			created_at TEXT DEFAULT (datetime('now')),
			FOREIGN KEY (feedback_id) REFERENCES feedback(id) ON DELETE CASCADE
		)
	");

	$pdo->exec("
		CREATE TABLE IF NOT EXISTS admin_sessions (
			token TEXT PRIMARY KEY,
			created_at TEXT DEFAULT (datetime('now')),
			expires_at TEXT NOT NULL,
			last_seen_at TEXT DEFAULT (datetime('now'))
		)
	");

	$pdo->exec("
		CREATE TABLE IF NOT EXISTS rate_limits (
			key TEXT PRIMARY KEY,
			count INTEGER DEFAULT 1,
			reset_at TEXT NOT NULL
		)
	");

	// Idempotent migrations for existing tables (adds columns if missing).
	feedback_migrate($pdo);
}

function feedback_migrate(PDO $pdo): void {
	$cols = [];
	foreach ($pdo->query("PRAGMA table_info(feedback)") as $r) $cols[$r['name']] = true;
	$adds = [
		'anchor_image_src'     => 'TEXT',
		'anchor_image_alt'     => 'TEXT',
		'anchor_caption'       => 'TEXT',
		'visitor_id'           => 'TEXT',
		'anchor_chunks'        => 'TEXT',
		'anchor_section_title' => 'TEXT',
		'anchor_text_hash'     => 'TEXT',
	];
	foreach ($adds as $col => $type) {
		if (empty($cols[$col])) {
			try { $pdo->exec("ALTER TABLE feedback ADD COLUMN $col $type"); } catch (Exception $e) { /* ignore */ }
		}
	}
	$cols = [];
	foreach ($pdo->query("PRAGMA table_info(feedback_comments)") as $r) $cols[$r['name']] = true;
	$adds = [
		'author_email' => 'TEXT',
		'visitor_id'   => 'TEXT',
	];
	foreach ($adds as $col => $type) {
		if (empty($cols[$col])) {
			try { $pdo->exec("ALTER TABLE feedback_comments ADD COLUMN $col $type"); } catch (Exception $e) { /* ignore */ }
		}
	}
}

function feedback_json_error(string $msg, int $code = 400, string $field = ''): void {
	http_response_code($code);
	header('Content-Type: application/json; charset=utf-8');
	header('Cache-Control: no-store');
	if ($code === 405) header('Allow: POST');
	$rid = feedback_request_id();
	header('X-Request-Id: ' . $rid);
	$payload = [
		'ok'         => false,
		'error'      => $msg,
		'code'       => $code,
		'request_id' => $rid,
	];
	if ($field !== '') $payload['field'] = $field;
	echo json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
	exit;
}

function feedback_json_response($data, int $code = 200): void {
	http_response_code($code);
	header('Content-Type: application/json; charset=utf-8');
	header('Cache-Control: no-store');
	header('X-Request-Id: ' . feedback_request_id());
	if (is_array($data)) $data['ok'] = $data['ok'] ?? true;
	echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
	exit;
}

function feedback_request_id(): string {
	static $rid = null;
	if ($rid !== null) return $rid;
	$rid = bin2hex(random_bytes(8));
	return $rid;
}

function feedback_visitor_id(): string {
	$v = $_COOKIE['fb_visitor'] ?? '';
	if ($v && preg_match('/^[a-f0-9]{32}$/', $v)) return $v;
	return '';
}

function feedback_assert_visitor(): string {
	$v = feedback_visitor_id();
	if (!$v) {
		feedback_json_error(
			'Missing visitor identity. Reload the page — your browser needs a stable id so we can show you your own feedback and comments.',
			400, 'visitor_id'
		);
	}
	return $v;
}

/**
 * Friendly HTML landing page for GET requests to POST-only endpoints.
 * Helps users who accidentally navigate to the URL see how to use it.
 *
 * @param string $title       Short <title> text
 * @param string $heading     H1 text (e.g. "🐛 Feedback Submit Endpoint")
 * @param string $description One-sentence description of what this endpoint does
 * @param string $exampleBody Example JSON body (shown in a <pre>)
 */
function feedback_method_help(string $title, string $heading, string $description, string $exampleBody = ''): void {
	header('Content-Type: text/html; charset=utf-8');
	header('Allow: POST');
	$home = (strpos($_SERVER['SCRIPT_NAME'] ?? '', '/blog/') !== false ? '/blog/' : '/asanai/blog/');
	$titleEsc    = htmlspecialchars($title, ENT_QUOTES);
	$headingEsc  = htmlspecialchars($heading, ENT_QUOTES);
	$descEsc     = htmlspecialchars($description, ENT_QUOTES);
	$exampleEsc  = htmlspecialchars($exampleBody, ENT_QUOTES);
	echo <<<HTML
<!doctype html><html lang="en"><head>
<meta charset="utf-8"><title>{$titleEsc}</title>
<style>
body { font-family: -apple-system, system-ui, sans-serif; background: #faf8f3; color: #1f2937;
       max-width: 560px; margin: 60px auto; padding: 0 20px; line-height: 1.55; }
h1 { font-family: Georgia, serif; margin: 0 0 12px; font-size: 22px; }
.box { background: white; border: 1px solid rgba(0,0,0,0.08); border-radius: 12px; padding: 24px;
       box-shadow: 0 4px 20px rgba(0,0,0,0.06); }
code { background: #f4f0e8; padding: 1px 6px; border-radius: 3px; font-size: 13px; font-family: ui-monospace, Menlo, monospace; }
pre { background: #1f2937; color: #f1f5f9; padding: 12px 14px; border-radius: 8px;
      font-family: ui-monospace, Menlo, monospace; font-size: 12px; white-space: pre-wrap;
      word-break: break-all; overflow-x: auto; }
.btn { display: inline-block; margin-top: 14px; padding: 10px 18px; background: #e8604c;
       color: white; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 14px; }
.btn:hover { background: #c5483a; }
.note { background: #fef3c7; border-left: 3px solid #d4a017; padding: 10px 14px;
        border-radius: 0 6px 6px 0; margin: 14px 0; font-size: 13px; }
h3 { margin: 18px 0 6px; font-size: 13px; text-transform: uppercase;
     letter-spacing: 0.05em; color: #6b7280; }
</style></head><body>
<div class="box">
<h1>{$headingEsc}</h1>
<p>{$descEsc}</p>
<div class="note">This endpoint accepts <strong>POST</strong> requests with a JSON body. GET requests are not supported (that's the <code>405</code> you saw).</div>
HTML;
	if ($exampleBody !== '') {
		echo "<h3>Example request</h3>\n<pre>" . $exampleEsc . "</pre>\n";
	}
	echo <<<HTML
<h3>To use the feedback widget</h3>
<ol>
  <li>Open any lesson page (e.g. <a href="{$home}intro">{$home}intro</a>)</li>
  <li>Click the 🐛 button in the top-right corner</li>
  <li>Select some text, an image, a heading, or a code block</li>
  <li>Type your note (Markdown + \$LaTeX\$ supported) and hit Enter</li>
</ol>
<a class="btn" href="{$home}intro">→ Try it on a lesson page</a>
<p style="margin-top:20px;font-size:12px;color:#9ca3af">
Admin? <a href="{$home}api/feedback/admin/panel.php">Open the admin panel</a>.</p>
</div>
</body></html>
HTML;
	exit;
}

function feedback_method(): string {
	return strtoupper($_SERVER['REQUEST_METHOD'] ?? 'GET');
}

function feedback_input(): array {
	$method = feedback_method();
	if ($method === 'GET')  return $_GET;
	if ($method === 'POST') {
		if (!empty($_POST)) return $_POST;
		$raw = file_get_contents('php://input');
		if (!$raw) return [];
		$ct = $_SERVER['CONTENT_TYPE'] ?? '';
		if (stripos($ct, 'application/json') !== false) {
			$j = json_decode($raw, true);
			return is_array($j) ? $j : [];
		}
		parse_str($raw, $parsed);
		return is_array($parsed) ? $parsed : [];
	}
	$raw = file_get_contents('php://input');
	if (!$raw) return [];
	$j = json_decode($raw, true);
	if (is_array($j)) return $j;
	parse_str($raw, $parsed);
	return is_array($parsed) ? $parsed : [];
}

function feedback_require_method(string ...$allowed): void {
	if (!in_array(feedback_method(), $allowed, true)) {
		feedback_json_error('Method not allowed', 405);
	}
}

function feedback_str($v, int $max = 0, string $field = ''): string {
	if ($v === null) return '';
	$s = is_string($v) ? $v : (string)$v;
	$s = trim($s);
	if ($max > 0 && mb_strlen($s) > $max) {
		feedback_json_error(($field ?: 'field') . " too long (max $max chars)", 400);
	}
	return $s;
}

function feedback_clean($s): string {
	if (!is_string($s)) return '';
	return strip_tags($s);
}

function feedback_client_ip(): string {
	foreach (['HTTP_CF_CONNECTING_IP', 'HTTP_X_FORWARDED_FOR', 'REMOTE_ADDR'] as $k) {
		if (!empty($_SERVER[$k])) {
			$ip = trim(explode(',', $_SERVER[$k])[0]);
			if (filter_var($ip, FILTER_VALIDATE_IP)) return $ip;
		}
	}
	return '0.0.0.0';
}

function feedback_rate_limit(string $key): void {
	$pdo = feedback_bootstrap();
	$now = time();
	$resetAt = $now + FEEDBACK_RATE_WINDOW;
	$row = $pdo->prepare('SELECT count, reset_at FROM rate_limits WHERE key = ?');
	$row->execute([$key]);
	$r = $row->fetch(PDO::FETCH_ASSOC);
	if (!$r) {
		$pdo->prepare('INSERT INTO rate_limits (key, count, reset_at) VALUES (?, 1, ?)')
			->execute([$key, date('Y-m-d H:i:s', $resetAt)]);
		return;
	}
	$resetTs = strtotime($r['reset_at']);
	if ($resetTs < $now) {
		$pdo->prepare('UPDATE rate_limits SET count = 1, reset_at = ? WHERE key = ?')
			->execute([date('Y-m-d H:i:s', $resetAt), $key]);
		return;
	}
	if ((int)$r['count'] >= FEEDBACK_RATE_LIMIT) {
		feedback_json_error('Too many submissions — please wait a bit.', 429);
	}
	$pdo->prepare('UPDATE rate_limits SET count = count + 1 WHERE key = ?')
		->execute([$key]);
}

function feedback_uuid(): string {
	$b = random_bytes(16);
	$b[6] = chr((ord($b[6]) & 0x0f) | 0x40);
	$b[8] = chr((ord($b[8]) & 0x3f) | 0x80);
	return vsprintf('%s%s-%s-%s-%s-%s%s%s', str_split(bin2hex($b), 4));
}

function feedback_git_info(): array {
	$root = FEEDBACK_REPO_ROOT;
	$commit = @chdir($root) ? trim((string)@shell_exec('git rev-parse HEAD 2>/dev/null')) : '';
	$branch = @chdir($root) ? trim((string)@shell_exec('git rev-parse --abbrev-ref HEAD 2>/dev/null')) : '';
	$dirty  = @chdir($root) ? trim((string)@shell_exec('git status --porcelain 2>/dev/null | head -1')) : '';
	chdir($root);
	return [
		'commit' => $commit ?: '',
		'branch' => $branch ?: '',
		'dirty'  => $dirty !== '' ? 1 : 0,
	];
}

function feedback_admin_authed(): bool {
	$tok = $_COOKIE[FEEDBACK_ADMIN_COOKIE] ?? '';
	if (!$tok || !preg_match('/^[a-f0-9]{40}$/', $tok)) return false;
	$pdo = feedback_bootstrap();
	$row = $pdo->prepare('SELECT expires_at FROM admin_sessions WHERE token = ?');
	$row->execute([$tok]);
	$r = $row->fetch(PDO::FETCH_ASSOC);
	if (!$r) return false;
	if (strtotime($r['expires_at']) < time()) {
		$pdo->prepare('DELETE FROM admin_sessions WHERE token = ?')->execute([$tok]);
		return false;
	}
	$pdo->prepare('UPDATE admin_sessions SET last_seen_at = datetime("now") WHERE token = ?')
		->execute([$tok]);
	return true;
}

function feedback_admin_log(string $action, ?int $feedbackId, ?string $from, ?string $to, ?string $note = null): void {
	try {
		$pdo = feedback_bootstrap();
		$pdo->prepare('INSERT INTO feedback_history (feedback_id, action, actor, from_value, to_value, note) VALUES (?, ?, ?, ?, ?, ?)')
			->execute([
				$feedbackId,
				$action,
				'admin',
				$from,
				$to,
				$note,
			]);
	} catch (PDOException $e) {
		// The history log is best-effort — never let a logging failure
		// kill the main action. (In particular a FK violation when the
		// parent row was just deleted would 500 the whole request.)
		error_log('[feedback_admin_log] ' . $e->getMessage() . ' — action=' . $action . ' feedback_id=' . ($feedbackId ?? 'null'));
	}
}

function feedback_log($action, ?int $feedbackId, ?string $from, ?string $to, ?string $note = null): void {
	feedback_admin_log($action, $feedbackId, $from, $to, $note);
}
