<?php
/*
 * Password-protected reader-feedback dashboard.
 *
 * Reads the same SQLite database as /stats and shares its session and
 * password file. Feedback rows are anonymous by default; an email is
 * present only when the reader chose to enter one. Bug context is
 * stored only after explicit consent.
 */
declare(strict_types=1);

require_once __DIR__ . '/lib/analytics.php';

header('Content-Type: text/html; charset=utf-8');
header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
header('Pragma: no-cache');
header('X-Content-Type-Options: nosniff');
header('X-Frame-Options: DENY');
header('Referrer-Policy: no-referrer');
header('X-Robots-Tag: noindex, nofollow, noarchive');
header("Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self'; base-uri 'none'; form-action 'self'; frame-ancestors 'none'");

mn_admin_session_start();

function feedback_h(mixed $value): string {
	return htmlspecialchars((string)$value, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
}

function feedback_current_url(): string {
	$uri = (string)($_SERVER['REQUEST_URI'] ?? '/');
	$uri = str_replace(["\r", "\n"], '', $uri);
	if ($uri === '' || $uri[0] !== '/' || str_starts_with($uri, '//')) {
		$uri = '/';
	}
	return $uri;
}

function feedback_redirect(): void {
	header('Location: ' . feedback_current_url(), true, 303);
	exit;
}

function feedback_range_options(): array {
	return [7 => '7 days', 30 => '30 days', 90 => '90 days', 365 => '1 year', 0 => 'All'];
}

function feedback_query(array $overrides = []): string {
	$allowed = ['range', 'path', 'reaction', 'status', 'has_comment', 'bug', 'q', 'page'];
	$q = [];
	foreach ($allowed as $key) {
		$value = array_key_exists($key, $overrides) ? $overrides[$key] : ($_GET[$key] ?? null);
		if (!is_scalar($value)) {
			continue;
		}
		$value = (string)$value;
		if ($value === '') {
			continue;
		}
		if ($key === 'page' && (int)$value <= 1) {
			continue;
		}
		$q[$key] = $value;
	}
	return http_build_query($q);
}

function feedback_where(int $range, string $path, string $reaction, string $status, bool $hasComment, bool $bugOnly, string $search, array &$params): string {
	$where = ['1=1'];
	if ($range > 0) {
		$where[] = 'f.ts >= ?';
		$params[] = time() - $range * 86400;
	}
	if ($path !== '') {
		$where[] = 'f.path = ?';
		$params[] = $path;
	}
	if ($reaction !== '') {
		$where[] = 'f.reaction = ?';
		$params[] = $reaction;
	}
	if ($status !== '') {
		$where[] = 'f.status = ?';
		$params[] = $status;
	}
	if ($hasComment) {
		$where[] = "f.comment <> ''";
	}
	if ($bugOnly) {
		$where[] = "f.reaction = 'bug'";
	}
	if ($search !== '') {
		$where[] = "(f.comment LIKE ? OR f.block_text LIKE ? OR s.selected_text LIKE ? OR f.email LIKE ? OR f.lesson_title LIKE ? OR f.section_title LIKE ?)";
		$like = '%' . $search . '%';
		array_push($params, $like, $like, $like, $like, $like, $like);
	}
	return implode(' AND ', $where);
}

function feedback_status_label(string $status): string {
	return match ($status) {
		'new' => 'New',
		'accepted' => 'Accepted',
		'rejected' => 'Rejected',
		'done' => 'Done',
		default => ucfirst($status),
	};
}

$actionRaw = $_POST['action'] ?? '';
$action = is_scalar($actionRaw) ? (string)$actionRaw : '';
$flash = '';
$flashType = 'ok';
$loginError = '';

if (($action === 'login') && ($_SERVER['REQUEST_METHOD'] ?? '') === 'POST') {
	if (!mn_admin_check_csrf()) {
		$loginError = 'The session has expired. Please reload the page.';
	} elseif (mn_admin_login_wait() > 0) {
		$loginError = 'Too many failed attempts. Please wait ' . mn_admin_login_wait() . ' seconds.';
	} else {
		$passwordRaw = $_POST['password'] ?? '';
		$password = is_scalar($passwordRaw) ? (string)$passwordRaw : '';
		if (mn_admin_attempt_login($password)) {
			$_SESSION['feedback_csrf'] = bin2hex(random_bytes(32));
			feedback_redirect();
		}
		$loginError = 'Wrong password.';
	}
}

if (($action === 'logout') && ($_SERVER['REQUEST_METHOD'] ?? '') === 'POST') {
	if (!mn_admin_check_csrf()) {
		$flash = 'The session has expired.';
		$flashType = 'error';
	} else {
		$_SESSION = [];
		if (ini_get('session.use_cookies')) {
			$p = session_get_cookie_params();
			setcookie(session_name(), '', [
				'expires' => time() - 42000,
				'path' => $p['path'],
				'domain' => $p['domain'],
				'secure' => (bool)$p['secure'],
				'httponly' => (bool)$p['httponly'],
				'samesite' => $p['samesite'] ?? 'Strict',
			]);
		}
		session_destroy();
		setcookie('mn_stats_admin', '', [
			'expires' => time() - 3600,
			'path' => mn_admin_cookie_path(),
			'secure' => mn_admin_is_secure(),
			'httponly' => true,
			'samesite' => 'Lax',
		]);
		header('Location: ' . feedback_current_url(), true, 303);
		exit;
	}
}

$authed = mn_admin_is_authed();

if ($authed && ($_SERVER['REQUEST_METHOD'] ?? '') === 'POST' && $action !== '' && $action !== 'login' && $action !== 'logout') {
	if (!mn_admin_check_csrf()) {
		$flash = 'The session has expired.';
		$flashType = 'error';
	} else {
		$idRaw = $_POST['id'] ?? 0;
		$id = is_scalar($idRaw) ? (int)$idRaw : 0;
		$pdoAction = mn_analytics_open_db();
		if (!$pdoAction) {
			$flash = 'The database could not be opened.';
			$flashType = 'error';
		} else {
			try {
				if ($action === 'accept' || $action === 'reject' || $action === 'done' || $action === 'reopen') {
					$status = match ($action) {
						'accept' => 'accepted',
						'reject' => 'rejected',
						'done' => 'done',
						default => 'new',
					};
					$stmt = $pdoAction->prepare('UPDATE block_feedback SET status = ?, decided_at = ?, updated_at = ? WHERE id = ?');
					$stmt->execute([$status, time(), time(), $id]);
					$flash = 'Feedback #' . $id . ' marked as ' . feedback_status_label($status) . '.';
				} elseif ($action === 'save_prompt') {
					$noteRaw = $_POST['admin_note'] ?? '';
					$note = is_scalar($noteRaw) ? mn_feedback_clean_html((string)$noteRaw, 8000) : '';
					$promptRaw = $_POST['admin_prompt'] ?? '';
					$prompt = is_scalar($promptRaw) ? mn_feedback_clean_html((string)$promptRaw, 40000) : '';
					$stmt = $pdoAction->prepare('UPDATE block_feedback SET admin_note = ?, admin_prompt = ?, status = ?, decided_at = COALESCE(decided_at, ?), updated_at = ? WHERE id = ?');
					$stmt->execute([$note, $prompt, 'accepted', time(), time(), $id]);
					$flash = 'Prompt saved for feedback #' . $id . '.';
				} elseif ($action === 'regenerate_prompt') {
					$row = mn_feedback_fetch($pdoAction, $id);
					if ($row) {
						$noteRaw = $_POST['admin_note'] ?? '';
						$note = is_scalar($noteRaw) ? mn_feedback_clean_html((string)$noteRaw, 8000) : '';
						$includeBug = !empty($_POST['include_bug']);
						$prompt = mn_feedback_build_prompt($row, $note, $includeBug);
						$stmt = $pdoAction->prepare('UPDATE block_feedback SET admin_note = ?, admin_prompt = ?, status = ?, decided_at = COALESCE(decided_at, ?), updated_at = ? WHERE id = ?');
						$stmt->execute([$note, $prompt, 'accepted', time(), time(), $id]);
						$flash = 'Prompt regenerated for feedback #' . $id . '.';
					}
				} elseif ($action === 'delete') {
					$pdoAction->beginTransaction();
					$pdoAction->prepare('DELETE FROM feedback_selections WHERE feedback_id = ?')->execute([$id]);
					$pdoAction->prepare('DELETE FROM feedback_bug_context WHERE feedback_id = ?')->execute([$id]);
					$pdoAction->prepare('DELETE FROM block_feedback WHERE id = ?')->execute([$id]);
					$pdoAction->commit();
					$flash = 'Feedback #' . $id . ' deleted.';
				}
				feedback_redirect();
			} catch (Throwable $e) {
				if ($pdoAction->inTransaction()) {
					$pdoAction->rollBack();
				}
				$flash = 'The action could not be completed.';
				$flashType = 'error';
			}
		}
	}
}

$rangeOptions = feedback_range_options();
$rangeRaw = $_GET['range'] ?? 30;
$range = is_scalar($rangeRaw) ? (int)$rangeRaw : 30;
if (!array_key_exists($range, $rangeOptions)) {
	$range = 30;
}
$pathRaw = $_GET['path'] ?? '';
$path = is_scalar($pathRaw) ? (string)$pathRaw : '';
if ($path !== '' && !preg_match('/^[a-zA-Z0-9_-]{1,80}$/', $path)) {
	$path = '';
}
$reactionRaw = $_GET['reaction'] ?? '';
$reaction = is_scalar($reactionRaw) ? (string)$reactionRaw : '';
if ($reaction !== '' && !isset(mn_feedback_reactions()[$reaction])) {
	$reaction = '';
}
$statusRaw = $_GET['status'] ?? '';
$status = is_scalar($statusRaw) ? (string)$statusRaw : '';
if (!in_array($status, ['', 'new', 'accepted', 'rejected', 'done'], true)) {
	$status = '';
}
$hasComment = isset($_GET['has_comment']) && (string)$_GET['has_comment'] === '1';
$bugOnly = isset($_GET['bug']) && (string)$_GET['bug'] === '1';
$searchRaw = $_GET['q'] ?? '';
$search = is_scalar($searchRaw) ? trim((string)$searchRaw) : '';
if (function_exists('mb_substr')) {
	$search = mb_substr($search, 0, 120, 'UTF-8');
} else {
	$search = substr($search, 0, 120);
}
$pageRaw = $_GET['page'] ?? 1;
$pageNum = is_scalar($pageRaw) ? max(1, (int)$pageRaw) : 1;
$perPage = 30;

$titles = mn_analytics_lesson_titles();
$reactions = mn_feedback_reactions();
$dbError = '';
$rows = [];
$total = 0;
$pageCount = 1;
$summary = ['total' => 0, 'with_comment' => 0, 'bugs' => 0, 'accepted' => 0, 'email' => 0];
$reactionCounts = array_fill_keys(array_keys($reactions), 0);
$pathOptions = [];
$pdo = null;

if ($authed) {
	$pdo = mn_analytics_open_db();
	if (!$pdo) {
		$dbError = 'The SQLite database could not be opened.';
	} else {
		$params = [];
		$where = feedback_where($range, $path, $reaction, $status, $hasComment, $bugOnly, $search, $params);
		$stmt = $pdo->prepare("SELECT COUNT(*) FROM block_feedback f LEFT JOIN feedback_selections s ON s.feedback_id = f.id WHERE $where");
		$stmt->execute($params);
		$total = (int)$stmt->fetchColumn();
		$pageCount = max(1, (int)ceil($total / $perPage));
		if ($pageNum > $pageCount) {
			$pageNum = $pageCount;
		}
		$offset = ($pageNum - 1) * $perPage;
		$stmt = $pdo->prepare(
			"SELECT f.*, s.selected_text, s.start_offset, s.end_offset, s.source_file,
			        b.consent AS bug_consent
			 FROM block_feedback f
			 LEFT JOIN feedback_selections s ON s.feedback_id = f.id
			 LEFT JOIN feedback_bug_context b ON b.feedback_id = f.id
			 WHERE $where
			 ORDER BY f.ts DESC, f.id DESC
			 LIMIT $perPage OFFSET $offset"
		);
		$stmt->execute($params);
		$rows = $stmt->fetchAll();

		$summaryStmt = $pdo->query(
			"SELECT COUNT(*) AS total,
			        SUM(CASE WHEN comment <> '' THEN 1 ELSE 0 END) AS with_comment,
			        SUM(CASE WHEN reaction = 'bug' THEN 1 ELSE 0 END) AS bugs,
			        SUM(CASE WHEN status = 'accepted' THEN 1 ELSE 0 END) AS accepted,
			        SUM(CASE WHEN email <> '' THEN 1 ELSE 0 END) AS email
			 FROM block_feedback"
		);
		$summaryRow = $summaryStmt ? $summaryStmt->fetch() : [];
		if (is_array($summaryRow)) {
			$summary = [
				'total' => (int)($summaryRow['total'] ?? 0),
				'with_comment' => (int)($summaryRow['with_comment'] ?? 0),
				'bugs' => (int)($summaryRow['bugs'] ?? 0),
				'accepted' => (int)($summaryRow['accepted'] ?? 0),
				'email' => (int)($summaryRow['email'] ?? 0),
			];
		}
		$countStmt = $pdo->query("SELECT reaction, COUNT(*) AS n FROM block_feedback GROUP BY reaction");
		if ($countStmt) {
			foreach ($countStmt->fetchAll() as $countRow) {
				$key = (string)$countRow['reaction'];
				if (isset($reactionCounts[$key])) {
					$reactionCounts[$key] = (int)$countRow['n'];
				}
			}
		}
		$pathStmt = $pdo->query("SELECT path, COUNT(*) AS n FROM block_feedback GROUP BY path ORDER BY n DESC, path");
		if ($pathStmt) {
			foreach ($pathStmt->fetchAll() as $pathRow) {
				$pathOptions[(string)$pathRow['path']] = (int)$pathRow['n'];
			}
		}
	}
}

$nowLabel = (new DateTimeImmutable('now', new DateTimeZone('Europe/Berlin')))->format('Y-m-d H:i');
?>
<!DOCTYPE html>
<html lang="en" class="dark" data-theme="dark">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Reader feedback · asanAI</title>
<style>
:root {
	--bg: #0f172a;
	--surface: #1e293b;
	--surface-2: #162033;
	--border: #334155;
	--text: #e2e8f0;
	--muted: #94a3b8;
	--heading: #f1f5f9;
	--accent: #818cf8;
	--coral: #fb923c;
	--emerald: #34d399;
	--rose: #fb7185;
	--sky: #38bdf8;
	--radius: 12px;
	--shadow: 0 10px 30px -18px rgba(0,0,0,.8);
}
html[data-theme="light"] {
	--bg: #f7f4eb;
	--surface: #fffdf7;
	--surface-2: #f1ecdf;
	--border: #d8cfb6;
	--text: #2a241b;
	--muted: #7a6d59;
	--heading: #1a140e;
	--accent: #4f46e5;
	--coral: #c2410c;
	--emerald: #047857;
	--rose: #be123c;
	--sky: #0369a1;
	--shadow: 0 10px 30px -20px rgba(50,40,20,.35);
}
* { box-sizing: border-box; }
html, body { margin: 0; padding: 0; }
body {
	background: var(--bg);
	color: var(--text);
	font: 14px/1.5 system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
}
a { color: var(--accent); text-decoration: none; }
a:hover { text-decoration: underline; }
.page { max-width: 1220px; margin: 0 auto; padding: 28px 20px 60px; }
.top { display: flex; align-items: flex-start; justify-content: space-between; gap: 18px; margin-bottom: 18px; }
h1 { margin: 0 0 4px; font-size: 30px; letter-spacing: -.02em; color: var(--heading); }
.sub { margin: 0; color: var(--muted); font-size: 13px; }
.top-actions { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
.btn, .btn-link {
	display: inline-flex; align-items: center; justify-content: center; gap: 6px;
	padding: 7px 11px; border: 1px solid var(--border); border-radius: 9px;
	background: var(--surface); color: var(--text); font: 600 12px system-ui, sans-serif;
	cursor: pointer; text-decoration: none;
}
.btn:hover, .btn-link:hover { border-color: var(--accent); text-decoration: none; }
.btn.primary { background: var(--accent); border-color: var(--accent); color: #fff; }
.btn.danger { color: var(--rose); }
.btn.small { padding: 5px 8px; font-size: 11px; }
.flash { margin: 0 0 16px; padding: 10px 13px; border-radius: 10px; border: 1px solid var(--border); background: var(--surface); }
.flash.error { border-color: color-mix(in srgb, var(--rose) 55%, var(--border)); color: var(--rose); }
.stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(130px, 1fr)); gap: 10px; margin: 0 0 18px; }
.stat { background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius); padding: 12px 14px; }
.stat b { display: block; font-size: 24px; line-height: 1.1; color: var(--heading); }
.stat span { color: var(--muted); font-size: 11px; letter-spacing: .05em; text-transform: uppercase; }
.toolbar { display: flex; flex-wrap: wrap; gap: 8px; align-items: center; margin: 0 0 18px; }
.toolbar form { display: flex; flex-wrap: wrap; gap: 8px; align-items: center; }
input, select, textarea {
	background: var(--surface); color: var(--text); border: 1px solid var(--border);
	border-radius: 8px; padding: 7px 9px; font: inherit;
}
input[type="search"] { min-width: 220px; }
input[type="checkbox"] { accent-color: var(--accent); }
textarea { width: 100%; resize: vertical; font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; font-size: 12px; line-height: 1.5; }
label.check { display: inline-flex; align-items: center; gap: 5px; color: var(--muted); font-size: 12px; cursor: pointer; }
.list { display: grid; gap: 10px; }
.item { background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius); box-shadow: var(--shadow); overflow: hidden; }
.item summary { list-style: none; cursor: pointer; padding: 13px 15px; display: grid; grid-template-columns: 1fr auto; gap: 14px; align-items: start; }
.item summary::-webkit-details-marker { display: none; }
.item-head { min-width: 0; }
.item-title { display: flex; flex-wrap: wrap; gap: 7px; align-items: center; margin-bottom: 4px; }
.item-title b { color: var(--heading); font-size: 14px; }
.item-meta { color: var(--muted); font-size: 11.5px; }
.item-quote { margin-top: 6px; color: var(--text); font-family: Georgia, "Times New Roman", serif; font-style: italic; font-size: 13px; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
.item-side { display: flex; flex-direction: column; align-items: flex-end; gap: 6px; flex: none; }
.badge { display: inline-flex; align-items: center; gap: 4px; padding: 3px 8px; border-radius: 999px; border: 1px solid var(--border); font-size: 10.5px; font-weight: 700; letter-spacing: .03em; text-transform: uppercase; color: var(--muted); }
.badge.helpful { color: var(--emerald); border-color: color-mix(in srgb, var(--emerald) 45%, var(--border)); }
.badge.unhelpful, .badge.bug { color: var(--rose); border-color: color-mix(in srgb, var(--rose) 45%, var(--border)); }
.badge.insight { color: var(--coral); border-color: color-mix(in srgb, var(--coral) 45%, var(--border)); }
.badge.confusing { color: var(--sky); border-color: color-mix(in srgb, var(--sky) 45%, var(--border)); }
.badge.status-new { color: var(--accent); border-color: color-mix(in srgb, var(--accent) 45%, var(--border)); }
.badge.status-accepted { color: var(--emerald); border-color: color-mix(in srgb, var(--emerald) 45%, var(--border)); }
.badge.status-rejected { color: var(--muted); }
.badge.status-done { color: var(--sky); border-color: color-mix(in srgb, var(--sky) 45%, var(--border)); }
.item-body { border-top: 1px solid var(--border); padding: 15px; display: grid; gap: 14px; background: var(--surface-2); }
.grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 12px; }
.kv { min-width: 0; }
.kv .k { color: var(--muted); font-size: 10.5px; font-weight: 700; letter-spacing: .06em; text-transform: uppercase; margin-bottom: 3px; }
.kv .v { color: var(--text); font-size: 12.5px; overflow-wrap: anywhere; }
pre.block { margin: 0; padding: 10px; border-radius: 8px; background: var(--bg); border: 1px solid var(--border); color: var(--text); white-space: pre-wrap; overflow-wrap: anywhere; font: 11.5px/1.5 ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; max-height: 260px; overflow: auto; }
.quote { padding: 10px 12px; border-left: 3px solid var(--accent); background: var(--bg); border-radius: 0 8px 8px 0; font-family: Georgia, "Times New Roman", serif; font-style: italic; white-space: pre-wrap; }
.actions { display: flex; flex-wrap: wrap; gap: 7px; align-items: center; }
.actions form { display: inline; }
.prompt { display: grid; gap: 9px; }
.prompt textarea { min-height: 260px; }
.prompt .row { display: flex; flex-wrap: wrap; gap: 8px; align-items: center; }
.prompt .hint { color: var(--muted); font-size: 11.5px; }
.empty { padding: 40px 16px; text-align: center; color: var(--muted); background: var(--surface); border: 1px dashed var(--border); border-radius: var(--radius); }
.pager { display: flex; justify-content: center; gap: 8px; margin-top: 18px; }
.login-card { max-width: 420px; margin: 10vh auto 0; background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius); padding: 22px; box-shadow: var(--shadow); }
.login-card h1 { font-size: 26px; }
.login-card label { display: block; margin: 14px 0 5px; color: var(--muted); font-size: 12px; }
.login-card input { width: 100%; }
.login-card button { width: 100%; margin-top: 14px; }
.login-note { color: var(--muted); font-size: 11.5px; line-height: 1.5; }
.error { color: var(--rose); font-size: 12.5px; margin: 10px 0; }
@media (max-width: 720px) {
	.page { padding: 18px 12px 44px; }
	h1 { font-size: 24px; }
	.top { flex-direction: column; }
	.item summary { grid-template-columns: 1fr; }
	.item-side { flex-direction: row; align-items: center; justify-content: flex-start; }
}
</style>
</head>
<body>
<div class="page">
<?php if (!$authed): ?>
	<div class="login-card">
		<h1>Reader feedback</h1>
		<p class="sub">The same password as the analytics dashboard.</p>
		<?php if ($loginError !== ''): ?><div class="error"><?php echo feedback_h($loginError); ?></div><?php endif; ?>
		<form method="post" action="" autocomplete="off">
			<input type="hidden" name="action" value="login">
			<input type="hidden" name="csrf" value="<?php echo feedback_h(mn_admin_csrf()); ?>">
			<label for="password">Password</label>
			<input id="password" name="password" type="password" autocomplete="current-password" required autofocus>
			<button type="submit" class="btn primary">Sign in</button>
		</form>
		<p class="login-note">Only technically necessary cookies are used (the shared dashboard session). No tracking cookies.</p>
	</div>
<?php else: ?>
	<header class="top">
		<div>
			<h1>Reader feedback</h1>
			<p class="sub">Selected passages, reactions, comments and optional bug context · as of <?php echo feedback_h($nowLabel); ?> (Berlin)</p>
		</div>
		<div class="top-actions">
			<a class="btn" href="stats">Analytics</a>
			<button type="button" id="theme-toggle" class="btn">Light</button>
			<form method="post" action="">
				<input type="hidden" name="action" value="logout">
				<input type="hidden" name="csrf" value="<?php echo feedback_h(mn_admin_csrf()); ?>">
				<button type="submit" class="btn">Sign out</button>
			</form>
		</div>
	</header>

	<?php if ($flash !== ''): ?><div class="flash <?php echo $flashType === 'error' ? 'error' : ''; ?>"><?php echo feedback_h($flash); ?></div><?php endif; ?>
	<?php if ($dbError !== ''): ?><div class="flash error"><?php echo feedback_h($dbError); ?></div><?php endif; ?>

	<?php if ($dbError === ''): ?>
	<div class="stats">
		<div class="stat"><b><?php echo feedback_h(number_format($summary['total'])); ?></b><span>Total</span></div>
		<div class="stat"><b><?php echo feedback_h(number_format($summary['with_comment'])); ?></b><span>With comment</span></div>
		<div class="stat"><b><?php echo feedback_h(number_format($summary['bugs'])); ?></b><span>Bugs</span></div>
		<div class="stat"><b><?php echo feedback_h(number_format($summary['accepted'])); ?></b><span>Accepted</span></div>
		<div class="stat"><b><?php echo feedback_h(number_format($summary['email'])); ?></b><span>Email left</span></div>
		<?php foreach ($reactionCounts as $key => $count): $meta = $reactions[$key]; ?>
			<div class="stat"><b><?php echo feedback_h(number_format($count)); ?></b><span><?php echo feedback_h($meta['icon'] . ' ' . $meta['label']); ?></span></div>
		<?php endforeach; ?>
	</div>

	<div class="toolbar">
		<form method="get" action="">
			<select name="range" aria-label="Time range">
				<?php foreach ($rangeOptions as $r => $label): ?>
					<option value="<?php echo $r; ?>"<?php echo $range === $r ? ' selected' : ''; ?>><?php echo feedback_h($label); ?></option>
				<?php endforeach; ?>
			</select>
			<select name="path" aria-label="Lesson">
				<option value="">All lessons</option>
				<?php foreach ($pathOptions as $slug => $count): ?>
					<option value="<?php echo feedback_h($slug); ?>"<?php echo $path === $slug ? ' selected' : ''; ?>><?php echo feedback_h($titles[$slug] ?? $slug); ?> (<?php echo (int)$count; ?>)</option>
				<?php endforeach; ?>
			</select>
			<select name="reaction" aria-label="Reaction">
				<option value="">All reactions</option>
				<?php foreach ($reactions as $key => $meta): ?>
					<option value="<?php echo feedback_h($key); ?>"<?php echo $reaction === $key ? ' selected' : ''; ?>><?php echo feedback_h($meta['icon'] . ' ' . $meta['label']); ?></option>
				<?php endforeach; ?>
			</select>
			<select name="status" aria-label="Status">
				<option value="">Any status</option>
				<?php foreach (['new', 'accepted', 'rejected', 'done'] as $st): ?>
					<option value="<?php echo $st; ?>"<?php echo $status === $st ? ' selected' : ''; ?>><?php echo feedback_h(feedback_status_label($st)); ?></option>
				<?php endforeach; ?>
			</select>
			<label class="check"><input type="checkbox" name="has_comment" value="1"<?php echo $hasComment ? ' checked' : ''; ?>> With comment</label>
			<label class="check"><input type="checkbox" name="bug" value="1"<?php echo $bugOnly ? ' checked' : ''; ?>> Bugs only</label>
			<input type="search" name="q" value="<?php echo feedback_h($search); ?>" placeholder="Search comments, passages, emails…" aria-label="Search feedback">
			<button type="submit" class="btn primary">Filter</button>
			<a class="btn" href="<?php echo feedback_h('?' . feedback_query(['range' => '', 'path' => '', 'reaction' => '', 'status' => '', 'has_comment' => '', 'bug' => '', 'q' => '', 'page' => ''])); ?>">Reset</a>
		</form>
	</div>

	<?php if (!$rows): ?>
		<div class="empty">No feedback matches these filters yet.</div>
	<?php else: ?>
		<div class="list">
		<?php foreach ($rows as $row): ?>
			<?php
				$id = (int)$row['id'];
				$reactionKey = (string)$row['reaction'];
				$meta = $reactions[$reactionKey] ?? ['icon' => '', 'label' => $reactionKey];
				$rowStatus = (string)$row['status'];
				$created = (int)$row['ts'];
				$createdLabel = (new DateTimeImmutable('@' . $created))->setTimezone(new DateTimeZone('Europe/Berlin'))->format('Y-m-d H:i');
				$selected = trim((string)($row['selected_text'] ?? ''));
				$comment = trim((string)($row['comment'] ?? ''));
				$lessonTitle = (string)($row['lesson_title'] ?: ($titles[$row['path']] ?? $row['path']));
				$full = mn_feedback_fetch($pdo, $id);
				$promptValue = (string)($row['admin_prompt'] ?? '');
				if ($full && $promptValue === '' && ($rowStatus === 'accepted' || $rowStatus === 'done')) {
					$promptValue = mn_feedback_build_prompt($full, (string)($row['admin_note'] ?? ''), false);
				}
			?>
			<details class="item">
				<summary>
					<div class="item-head">
						<div class="item-title">
							<b><?php echo feedback_h($lessonTitle); ?></b>
							<span class="badge <?php echo feedback_h($reactionKey); ?>"><?php echo feedback_h($meta['icon'] . ' ' . $meta['label']); ?></span>
							<span class="badge status-<?php echo feedback_h($rowStatus); ?>"><?php echo feedback_h(feedback_status_label($rowStatus)); ?></span>
							<?php if (!empty($row['bug_consent'])): ?><span class="badge bug">Log attached</span><?php endif; ?>
						</div>
						<div class="item-meta">
							#<?php echo $id; ?> · <?php echo feedback_h($createdLabel); ?>
							<?php if (!empty($row['section_title'])): ?> · <?php echo feedback_h($row['section_title']); ?><?php endif; ?>
							<?php if (!empty($row['email'])): ?> · <?php echo feedback_h($row['email']); ?><?php endif; ?>
						</div>
						<?php if ($selected !== ''): ?><div class="item-quote">“<?php echo feedback_h($selected); ?>”</div><?php endif; ?>
					</div>
					<div class="item-side">
						<span class="item-meta">#<?php echo $id; ?></span>
					</div>
				</summary>
				<div class="item-body">
					<div class="grid">
						<div class="kv"><div class="k">Page</div><div class="v"><a href="<?php echo feedback_h($row['path']); ?>">/<?php echo feedback_h($row['path']); ?></a></div></div>
						<div class="kv"><div class="k">Part</div><div class="v"><?php echo feedback_h($row['part'] > 0 ? $row['part'] . ' · ' . $row['part_title'] : '—'); ?></div></div>
						<div class="kv"><div class="k">Section</div><div class="v"><?php echo feedback_h($row['section_title'] ?: '—'); ?></div></div>
						<div class="kv"><div class="k">Block</div><div class="v">#<?php echo (int)$row['block_index']; ?><?php if (!empty($row['block_selector'])): ?> · <code><?php echo feedback_h($row['block_selector']); ?></code><?php endif; ?></div></div>
						<div class="kv"><div class="k">Source file</div><div class="v"><code><?php echo feedback_h($row['source_file'] ?: ('blog/' . $row['path'] . '.php')); ?></code></div></div>
						<div class="kv"><div class="k">Selection offsets</div><div class="v"><?php echo (int)($row['start_offset'] ?? 0); ?>–<?php echo (int)($row['end_offset'] ?? 0); ?></div></div>
					</div>

					<?php if ($selected !== ''): ?>
					<div class="kv"><div class="k">Selected passage</div><div class="quote"><?php echo feedback_h($selected); ?></div></div>
					<?php endif; ?>

					<?php if ($comment !== ''): ?>
					<div class="kv"><div class="k">Comment</div><div class="quote"><?php echo nl2br(feedback_h($comment)); ?></div></div>
					<?php endif; ?>

					<?php if ($full && !empty($full['block_text'])): ?>
					<div class="kv"><div class="k">Full block text</div><pre class="block"><?php echo feedback_h($full['block_text']); ?></pre></div>
					<?php endif; ?>

					<?php if ($full && !empty($full['bug_consent'])): ?>
					<details>
						<summary class="btn small" style="display:inline-flex;">Bug context</summary>
						<div class="grid" style="margin-top:10px;">
							<?php if (!empty($full['bug_url'])): ?><div class="kv"><div class="k">URL</div><div class="v"><?php echo feedback_h($full['bug_url']); ?></div></div><?php endif; ?>
							<?php if (!empty($full['bug_user_agent'])): ?><div class="kv"><div class="k">User-Agent</div><div class="v"><?php echo feedback_h($full['bug_user_agent']); ?></div></div><?php endif; ?>
							<?php if (!empty($full['bug_viewport'])): ?><div class="kv"><div class="k">Viewport</div><div class="v"><?php echo feedback_h($full['bug_viewport']); ?></div></div><?php endif; ?>
						</div>
						<?php if (!empty($full['bug_console_logs_json'])): ?><div class="kv" style="margin-top:10px;"><div class="k">Console log</div><pre class="block"><?php echo feedback_h($full['bug_console_logs_json']); ?></pre></div><?php endif; ?>
						<?php if (!empty($full['bug_last_clicks_json'])): ?><div class="kv" style="margin-top:10px;"><div class="k">Last interactions</div><pre class="block"><?php echo feedback_h($full['bug_last_clicks_json']); ?></pre></div><?php endif; ?>
						<?php if (!empty($full['bug_last_error_json'])): ?><div class="kv" style="margin-top:10px;"><div class="k">Last error</div><pre class="block"><?php echo feedback_h($full['bug_last_error_json']); ?></pre></div><?php endif; ?>
					</details>
					<?php endif; ?>

					<div class="actions">
						<?php if ($rowStatus !== 'accepted' && $rowStatus !== 'done'): ?>
							<form method="post" action="">
								<input type="hidden" name="action" value="accept">
								<input type="hidden" name="csrf" value="<?php echo feedback_h(mn_admin_csrf()); ?>">
								<input type="hidden" name="id" value="<?php echo $id; ?>">
								<button type="submit" class="btn primary">Accept &amp; prepare prompt</button>
							</form>
						<?php endif; ?>
						<?php if ($rowStatus !== 'rejected'): ?>
							<form method="post" action="">
								<input type="hidden" name="action" value="reject">
								<input type="hidden" name="csrf" value="<?php echo feedback_h(mn_admin_csrf()); ?>">
								<input type="hidden" name="id" value="<?php echo $id; ?>">
								<button type="submit" class="btn">Reject</button>
							</form>
						<?php endif; ?>
						<?php if ($rowStatus !== 'done'): ?>
							<form method="post" action="">
								<input type="hidden" name="action" value="done">
								<input type="hidden" name="csrf" value="<?php echo feedback_h(mn_admin_csrf()); ?>">
								<input type="hidden" name="id" value="<?php echo $id; ?>">
								<button type="submit" class="btn">Mark done</button>
							</form>
						<?php else: ?>
							<form method="post" action="">
								<input type="hidden" name="action" value="reopen">
								<input type="hidden" name="csrf" value="<?php echo feedback_h(mn_admin_csrf()); ?>">
								<input type="hidden" name="id" value="<?php echo $id; ?>">
								<button type="submit" class="btn">Reopen</button>
							</form>
						<?php endif; ?>
						<form method="post" action="" onsubmit="return confirm('Delete this feedback permanently?');">
							<input type="hidden" name="action" value="delete">
							<input type="hidden" name="csrf" value="<?php echo feedback_h(mn_admin_csrf()); ?>">
							<input type="hidden" name="id" value="<?php echo $id; ?>">
							<button type="submit" class="btn danger">Delete</button>
						</form>
						<?php if (!empty($row['email'])): ?>
							<a class="btn" href="mailto:<?php echo feedback_h($row['email']); ?>?subject=<?php echo rawurlencode('Reader feedback · /' . $row['path']); ?>">Reply by email</a>
						<?php endif; ?>
					</div>

					<?php if ($full && ($rowStatus === 'accepted' || $rowStatus === 'done')): ?>
					<form class="prompt" method="post" action="">
						<input type="hidden" name="csrf" value="<?php echo feedback_h(mn_admin_csrf()); ?>">
						<input type="hidden" name="id" value="<?php echo $id; ?>">
						<div class="kv"><div class="k">Editor note (feeds the prompt when regenerated)</div></div>
						<textarea name="admin_note" rows="2" placeholder="What should change, in your own words…"><?php echo feedback_h($row['admin_note'] ?? ''); ?></textarea>
						<div class="row">
							<label class="check"><input type="checkbox" name="include_bug" value="1"> Include bug context when regenerating</label>
							<button type="submit" class="btn small" name="action" value="regenerate_prompt">Regenerate prompt</button>
						</div>
						<div class="kv"><div class="k">AI prompt (editable)</div></div>
						<textarea name="admin_prompt" rows="16" spellcheck="false"><?php echo feedback_h($promptValue); ?></textarea>
						<div class="row">
							<button type="submit" class="btn primary" name="action" value="save_prompt">Save prompt</button>
							<button type="button" class="btn copy-prompt">Copy prompt</button>
							<span class="hint">Paste this into an agent. The prompt contains the file, lesson, section, selection and the reader's words.</span>
						</div>
					</form>
					<?php elseif ($full): ?>
						<p class="hint">Accept this feedback to prepare an editable AI prompt.</p>
					<?php endif; ?>
				</div>
			</details>
		<?php endforeach; ?>
		</div>

		<?php if ($pageCount > 1): ?>
		<nav class="pager" aria-label="Pages">
			<?php if ($pageNum > 1): ?><a class="btn" href="?<?php echo feedback_h(feedback_query(['page' => $pageNum - 1])); ?>">← Previous</a><?php endif; ?>
			<span class="item-meta">Page <?php echo $pageNum; ?> of <?php echo $pageCount; ?></span>
			<?php if ($pageNum < $pageCount): ?><a class="btn" href="?<?php echo feedback_h(feedback_query(['page' => $pageNum + 1])); ?>">Next →</a><?php endif; ?>
		</nav>
		<?php endif; ?>
	<?php endif; ?>
	<?php endif; ?>
<?php endif; ?>
</div>
<script>
(function () {
	var root = document.documentElement;
	var key = "mn_feedback_theme";
	try {
		var saved = localStorage.getItem(key);
		if (saved === "light" || saved === "dark") root.setAttribute("data-theme", saved);
	} catch (e) {}
	var btn = document.getElementById("theme-toggle");
	if (btn) {
		if (root.getAttribute("data-theme") === "light") btn.textContent = "Dark";
		btn.addEventListener("click", function () {
			var light = root.getAttribute("data-theme") !== "light";
			root.setAttribute("data-theme", light ? "light" : "dark");
			btn.textContent = light ? "Dark" : "Light";
			try { localStorage.setItem(key, light ? "light" : "dark"); } catch (e) {}
		});
	}
	document.addEventListener("click", function (event) {
		var btn = event.target.closest && event.target.closest(".copy-prompt");
		if (!btn) return;
		var form = btn.closest("form");
		var area = form ? form.querySelector('textarea[name="admin_prompt"]') : null;
		if (!area) return;
		var text = area.value;
		function done() {
			btn.textContent = "Copied";
			setTimeout(function () { btn.textContent = "Copy prompt"; }, 1600);
		}
		if (navigator.clipboard && navigator.clipboard.writeText) {
			navigator.clipboard.writeText(text).then(done).catch(function () {
				area.focus();
				area.select();
			});
		} else {
			area.focus();
			area.select();
			try { document.execCommand("copy"); done(); } catch (e) {}
		}
	});
})();
</script>
</body>
</html>
