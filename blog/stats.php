<?php
/*
 * Password-protected anonymous analytics dashboard.
 *
 * Password source: /etc/blogpassword (override for tests with
 * BLOG_STATS_PASSWORD_FILE). A plaintext password or a PHP password_hash()
 * value is accepted. The page itself sets no tracking cookies; the only
 * cookies are the login session and the optional "exclude my own visits"
 * preference used by the analytics library.
 */
declare(strict_types=1);

define('MN_ANALYTICS_DISABLED', true);
require_once __DIR__ . '/lib/analytics.php';

header('Content-Type: text/html; charset=utf-8');
header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
header('Pragma: no-cache');
header('X-Content-Type-Options: nosniff');
header('X-Frame-Options: DENY');
header('Referrer-Policy: no-referrer');
header('X-Robots-Tag: noindex, nofollow, noarchive');
header("Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self'; base-uri 'none'; form-action 'self'; frame-ancestors 'none'");

$analyticsKillSwitch = mn_analytics_is_kill_switched();
$analyticsDisabledReason = mn_analytics_disabled_reason();

function stats_h(mixed $value): string {
	return htmlspecialchars((string)$value, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
}

function stats_is_secure(): bool {
	if (!empty($_SERVER['HTTPS']) && (string)$_SERVER['HTTPS'] !== 'off') {
		return true;
	}
	return strtolower((string)($_SERVER['HTTP_X_FORWARDED_PROTO'] ?? '')) === 'https';
}

function stats_cookie_path(): string {
	$script = (string)($_SERVER['SCRIPT_NAME'] ?? '/');
	$dir = rtrim(str_replace('\\', '/', dirname($script)), '/');
	return $dir === '' ? '/' : $dir . '/';
}

function stats_current_url(): string {
	$uri = (string)($_SERVER['REQUEST_URI'] ?? '/');
	$uri = str_replace(["\r", "\n"], '', $uri);
	if ($uri === '' || $uri[0] !== '/' || str_starts_with($uri, '//')) {
		$uri = '/';
	}
	return $uri;
}

function stats_redirect(): void {
	header('Location: ' . stats_current_url(), true, 303);
	exit;
}

function stats_query(array $overrides = []): string {
	$allowed = ['range', 'path', 'ref_type', 'source', 'ref_path', 'browser', 'os', 'device', 'bot_reason', 'day', 'weekday', 'hour', 'humans', 'view', 'cmp_mode', 'cmp_kind', 'cmp_a', 'cmp_b', 'cmp_from_a', 'cmp_to_a', 'cmp_from_b', 'cmp_to_b', 'page'];
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

function stats_csrf(): string {
	if (empty($_SESSION['stats_csrf']) || !is_string($_SESSION['stats_csrf'])) {
		$_SESSION['stats_csrf'] = bin2hex(random_bytes(32));
	}
	return $_SESSION['stats_csrf'];
}

function stats_check_csrf(): bool {
	$token = $_POST['csrf'] ?? '';
	if (!is_string($token) || $token === '') {
		return false;
	}
	$known = $_SESSION['stats_csrf'] ?? '';
	return is_string($known) && $known !== '' && hash_equals($known, $token);
}

function stats_password_file(): string {
	return mn_analytics_password_file();
}

function stats_password_line(): string {
	return mn_analytics_password_line();
}

function stats_password_status(): array {
	$file = stats_password_file();
	if (!file_exists($file)) {
		return ['ok' => false, 'reason' => 'missing', 'file' => $file];
	}
	if (!is_readable($file)) {
		return ['ok' => false, 'reason' => 'unreadable', 'file' => $file];
	}
	if (stats_password_line() === '') {
		return ['ok' => false, 'reason' => 'empty', 'file' => $file];
	}
	return ['ok' => true, 'file' => $file];
}

function stats_verify_password(string $input): bool {
	$line = stats_password_line();
	if ($line === '') {
		return false;
	}
	if (preg_match('/^\$(?:2[aby]|argon2|6)\$/', $line)) {
		return password_verify($input, $line);
	}
	return hash_equals($line, $input);
}

function stats_is_authed(): bool {
	return !empty($_SESSION['stats_auth']);
}

function stats_login_wait(): int {
	$until = (int)($_SESSION['stats_lock_until'] ?? 0);
	return max(0, $until - time());
}

function stats_web_user(): string {
	return mn_analytics_web_user();
}

function stats_set_admin_indicator_cookie(): void {
	$token = mn_analytics_admin_token();
	if ($token === '') {
		return;
	}
	setcookie('mn_stats_admin', $token, [
		'expires' => 0,
		'path' => stats_cookie_path(),
		'secure' => stats_is_secure(),
		'httponly' => true,
		'samesite' => 'Lax',
	]);
	$_COOKIE['mn_stats_admin'] = $token;
}

function stats_clear_admin_indicator_cookie(): void {
	setcookie('mn_stats_admin', '', [
		'expires' => time() - 3600,
		'path' => stats_cookie_path(),
		'secure' => stats_is_secure(),
		'httponly' => true,
		'samesite' => 'Lax',
	]);
	unset($_COOKIE['mn_stats_admin']);
}

function stats_set_exclude_cookie(bool $on): void {
	$opts = [
		'expires' => $on ? time() + 365 * 86400 : time() - 3600,
		'path' => stats_cookie_path(),
		'secure' => stats_is_secure(),
		'httponly' => true,
		'samesite' => 'Lax',
	];
	setcookie('mn_stats_exclude', $on ? '1' : '', $opts);
	if ($on) {
		$_COOKIE['mn_stats_exclude'] = '1';
	} else {
		unset($_COOKIE['mn_stats_exclude']);
	}
}

function stats_flash(string $type, string $text): void {
	$_SESSION['stats_flash'] = ['type' => $type, 'text' => $text];
}

function stats_take_flash(): ?array {
	if (empty($_SESSION['stats_flash']) || !is_array($_SESSION['stats_flash'])) {
		return null;
	}
	$flash = $_SESSION['stats_flash'];
	unset($_SESSION['stats_flash']);
	return $flash;
}

function stats_one(PDO $pdo, string $sql, array $params): array {
	$stmt = $pdo->prepare($sql);
	$stmt->execute($params);
	$row = $stmt->fetch();
	return is_array($row) ? $row : [];
}

function stats_all(PDO $pdo, string $sql, array $params): array {
	$stmt = $pdo->prepare($sql);
	$stmt->execute($params);
	$rows = $stmt->fetchAll();
	return is_array($rows) ? $rows : [];
}

function stats_search_terms(string $raw): array {
	$raw = trim((string)preg_replace('/\s+/u', ' ', $raw));
	if ($raw === '') {
		return [];
	}
	preg_match_all('/"([^"]+)"|(\S+)/u', $raw, $matches, PREG_SET_ORDER);
	$terms = [];
	foreach ($matches as $match) {
		$term = trim((string)(($match[1] ?? '') !== '' ? $match[1] : ($match[2] ?? '')));
		if ($term === '') {
			continue;
		}
		$terms[] = mb_substr($term, 0, 80);
	}
	return array_slice(array_values(array_unique($terms)), 0, 8);
}

function stats_search_like(string $value): string {
	return str_replace(['\\', '%', '_'], ['\\\\', '\\%', '\\_'], $value);
}

function stats_search_where(array $terms, array $columns, array &$params): string {
	$clauses = [];
	foreach ($terms as $term) {
		$ors = [];
		$like = '%' . stats_search_like($term) . '%';
		foreach ($columns as $column) {
			$ors[] = $column . " LIKE ? ESCAPE '\\'";
			$params[] = $like;
		}
		if ($ors) {
			$clauses[] = '(' . implode(' OR ', $ors) . ')';
		}
	}
	return $clauses ? implode(' AND ', $clauses) : '1=0';
}

function stats_search_snippet(string $text, array $terms, int $max = 220): string {
	$text = trim((string)preg_replace('/\s+/u', ' ', strip_tags($text)));
	if ($text === '') {
		return '';
	}
	$pos = false;
	foreach ($terms as $term) {
		$found = mb_stripos($text, $term);
		if ($found !== false) {
			$pos = $found;
			break;
		}
	}
	if ($pos === false) {
		return mb_strlen($text) > $max ? mb_substr($text, 0, $max) . '…' : $text;
	}
	$start = max(0, $pos - intdiv($max, 3));
	$snippet = mb_substr($text, $start, $max);
	if ($start > 0) {
		$snippet = '…' . $snippet;
	}
	if ($start + $max < mb_strlen($text)) {
		$snippet .= '…';
	}
	return $snippet;
}

function stats_search_mark(string $text, array $terms): string {
	if ($text === '' || !$terms) {
		return stats_h($text);
	}
	$quoted = array_map(static fn(string $term): string => preg_quote($term, '/'), $terms);
	$parts = preg_split('/(' . implode('|', $quoted) . ')/iu', $text, -1, PREG_SPLIT_DELIM_CAPTURE);
	if (!is_array($parts)) {
		return stats_h($text);
	}
	$out = '';
	foreach ($parts as $index => $part) {
		$out .= $index % 2 === 1 ? '<mark>' . stats_h($part) . '</mark>' : stats_h($part);
	}
	return $out;
}

function stats_search_one(PDO $pdo, string $sql, array $params): int {
	try {
		$row = stats_one($pdo, $sql, $params);
		return (int)($row['n'] ?? 0);
	} catch (Throwable $e) {
		return 0;
	}
}

function stats_search_all(PDO $pdo, string $sql, array $params): array {
	try {
		return stats_all($pdo, $sql, $params);
	} catch (Throwable $e) {
		return [];
	}
}

function stats_search_date(int $ts): string {
	return (new DateTimeImmutable('@' . $ts))->setTimezone(new DateTimeZone('Europe/Berlin'))->format('Y-m-d H:i');
}

function stats_search_feedback_url(int $id, string $path = ''): string {
	$params = ['tab' => 'all', 'open' => $id, 'range' => 0, 'page' => 1, 'status' => ''];
	if ($path !== '') {
		$params['path'] = $path;
	}
	return 'stats?view=feedback&' . http_build_query($params);
}

function stats_search_run(PDO $pdo, array $terms, array $titles): array {
	$groups = [];
	$total = 0;
	if (!$terms) {
		return ['groups' => [], 'total' => 0];
	}

	$pageItems = [];
	foreach ($titles as $slug => $title) {
		$haystack = (string)$slug . ' ' . (string)$title;
		$matches = true;
		foreach ($terms as $term) {
			if (mb_stripos($haystack, $term) === false) {
				$matches = false;
				break;
			}
		}
		if (!$matches) {
			continue;
		}
		$pageItems[] = [
			'title' => (string)$title,
			'meta' => 'Lesson · ' . (string)$slug,
			'snippet' => 'Course page and lesson metadata.',
			'href' => '?' . stats_query(['path' => (string)$slug, 'page' => 1]) . '#pages',
			'badge' => 'PAGE',
		];
		if (count($pageItems) >= 30) {
			break;
		}
	}
	$groups['pages'] = ['label' => 'Pages & lessons', 'items' => $pageItems, 'total' => count($pageItems)];

	$params = [];
	$where = stats_search_where($terms, ['p.path', 'p.ref_type', 'p.ref_source', 'p.ref_host', 'p.ref_path', 'p.browser', 'p.os', 'p.device', 'p.bot_reason', 'p.day'], $params);
	$count = stats_search_one($pdo, "SELECT COUNT(*) AS n FROM pageviews p WHERE $where", $params);
	$rows = stats_search_all($pdo, "SELECT p.id, p.ts, p.day, p.hour, p.path, p.ref_type, p.ref_source, p.ref_host, p.ref_path, p.browser, p.os, p.device, p.is_bot, p.bot_reason FROM pageviews p WHERE $where ORDER BY p.ts DESC LIMIT 40", $params);
	$items = [];
	foreach ($rows as $row) {
		$slug = (string)$row['path'];
		$bits = [stats_search_date((int)$row['ts']), mn_analytics_ref_type_label((string)$row['ref_type'])];
		if ((string)$row['ref_source'] !== '') {
			$bits[] = (string)$row['ref_source'];
		}
		$bits[] = trim((string)$row['browser'] . ' / ' . (string)$row['os'], ' /');
		$bits[] = stats_device_label((string)$row['device']);
		if ((int)$row['is_bot'] === 1) {
			$bits[] = 'bot';
		}
		$items[] = [
			'title' => $titles[$slug] ?? $slug,
			'meta' => implode(' · ', array_filter($bits)),
			'snippet' => 'Pageview #' . (int)$row['id'] . ' · ' . $slug . ((string)$row['ref_path'] !== '' ? ' · from ' . (string)$row['ref_path'] : ''),
			'href' => '?' . stats_query(['path' => $slug, 'page' => 1]) . '#raw-data',
			'badge' => 'VIEW',
		];
	}
	$groups['pageviews'] = ['label' => 'Pageviews', 'items' => $items, 'total' => $count];

	$params = [];
	$where = stats_search_where($terms, ['s.path', 's.section_key', 's.section_label'], $params);
	$count = stats_search_one($pdo, "SELECT COUNT(*) AS n FROM pageview_sections s WHERE $where", $params);
	$rows = stats_search_all($pdo, "SELECT s.path, s.section_key, s.section_label, COUNT(*) AS n, MAX(p.ts) AS last_ts FROM pageview_sections s LEFT JOIN pageviews p ON p.id = s.pageview_id WHERE $where GROUP BY s.path, s.section_key, s.section_label ORDER BY n DESC LIMIT 30", $params);
	$items = [];
	foreach ($rows as $row) {
		$slug = (string)$row['path'];
		$items[] = [
			'title' => ($titles[$slug] ?? $slug) . ' · ' . (string)$row['section_label'],
			'meta' => (int)$row['n'] . ' pageviews' . ($row['last_ts'] !== null ? ' · last ' . stats_search_date((int)$row['last_ts']) : ''),
			'snippet' => 'Section key: ' . (string)$row['section_key'],
			'href' => '?' . stats_query(['path' => $slug, 'page' => 1]) . '#health',
			'badge' => 'SECTION',
		];
	}
	$groups['sections'] = ['label' => 'Sections', 'items' => $items, 'total' => $count];

	$params = [];
	$where = stats_search_where($terms, ['e.path', 'e.kind', 'e.target', 'CAST(e.value AS TEXT)'], $params);
	$count = stats_search_one($pdo, "SELECT COUNT(*) AS n FROM pageview_events e WHERE $where", $params);
	$rows = stats_search_all($pdo, "SELECT e.path, e.kind, e.target, e.value, COUNT(*) AS n, MAX(p.ts) AS last_ts FROM pageview_events e LEFT JOIN pageviews p ON p.id = e.pageview_id WHERE $where GROUP BY e.path, e.kind, e.target, e.value ORDER BY n DESC LIMIT 40", $params);
	$items = [];
	foreach ($rows as $row) {
		$slug = (string)$row['path'];
		$items[] = [
			'title' => (string)$row['kind'] . ' · ' . (string)$row['target'],
			'meta' => ($titles[$slug] ?? $slug) . ' · ' . (int)$row['n'] . ' events' . ($row['last_ts'] !== null ? ' · last ' . stats_search_date((int)$row['last_ts']) : ''),
			'snippet' => $row['value'] !== null ? 'Value: ' . (string)$row['value'] : 'Interaction event on ' . $slug,
			'href' => '?' . stats_query(['path' => $slug, 'page' => 1]) . '#signals',
			'badge' => 'EVENT',
		];
	}
	$groups['events'] = ['label' => 'Interaction events', 'items' => $items, 'total' => $count];

	$params = [];
	$where = stats_search_where($terms, ['f.path', 'f.lesson_title', 'f.part_title', 'f.section_title', 'f.block_key', 'f.block_text', 'f.comment', 'f.email', 'f.admin_note', 'f.admin_prompt', 'f.reaction', 'f.status'], $params);
	$count = stats_search_one($pdo, "SELECT COUNT(*) AS n FROM block_feedback f WHERE $where", $params);
	$rows = stats_search_all($pdo, "SELECT f.id, f.ts, f.path, f.lesson_title, f.section_title, f.reaction, f.status, f.comment, f.block_text FROM block_feedback f WHERE $where ORDER BY f.ts DESC LIMIT 40", $params);
	$items = [];
	foreach ($rows as $row) {
		$slug = (string)$row['path'];
		$title = trim((string)$row['lesson_title']) !== '' ? (string)$row['lesson_title'] : $slug;
		if ((string)$row['section_title'] !== '') {
			$title .= ' · ' . (string)$row['section_title'];
		}
		$items[] = [
			'title' => $title,
			'meta' => '#' . (int)$row['id'] . ' · ' . stats_search_date((int)$row['ts']) . ' · ' . (string)$row['reaction'] . ' / ' . (string)$row['status'],
			'snippet' => stats_search_snippet((string)($row['comment'] !== '' ? $row['comment'] : $row['block_text']), $terms),
			'href' => stats_search_feedback_url((int)$row['id'], $slug),
			'badge' => 'FEEDBACK',
		];
	}
	$groups['feedback'] = ['label' => 'Reader feedback', 'items' => $items, 'total' => $count];

	$params = [];
	$where = stats_search_where($terms, ['s.selected_text', 's.selected_html', 's.prefix', 's.suffix', 's.source_file'], $params);
	$count = stats_search_one($pdo, "SELECT COUNT(*) AS n FROM feedback_selections s WHERE $where", $params);
	$rows = stats_search_all($pdo, "SELECT f.id, f.ts, f.path, f.lesson_title, s.selected_text, s.source_file FROM feedback_selections s JOIN block_feedback f ON f.id = s.feedback_id WHERE $where ORDER BY f.ts DESC LIMIT 25", $params);
	$items = [];
	foreach ($rows as $row) {
		$slug = (string)$row['path'];
		$items[] = [
			'title' => 'Selected passage · ' . (trim((string)$row['lesson_title']) !== '' ? (string)$row['lesson_title'] : $slug),
			'meta' => '#' . (int)$row['id'] . ' · ' . stats_search_date((int)$row['ts']) . ((string)$row['source_file'] !== '' ? ' · ' . (string)$row['source_file'] : ''),
			'snippet' => stats_search_snippet((string)$row['selected_text'], $terms),
			'href' => stats_search_feedback_url((int)$row['id'], $slug),
			'badge' => 'PASSAGE',
		];
	}
	$groups['selections'] = ['label' => 'Selected passages', 'items' => $items, 'total' => $count];

	$params = [];
	$where = stats_search_where($terms, ['b.url', 'b.user_agent', 'b.viewport', 'b.console_logs_json', 'b.last_clicks_json', 'b.last_error_json'], $params);
	$count = stats_search_one($pdo, "SELECT COUNT(*) AS n FROM feedback_bug_context b WHERE b.consent = 1 AND $where", $params);
	$rows = stats_search_all($pdo, "SELECT f.id, f.ts, f.path, f.lesson_title, b.url, b.last_error_json FROM feedback_bug_context b JOIN block_feedback f ON f.id = b.feedback_id WHERE b.consent = 1 AND $where ORDER BY f.ts DESC LIMIT 20", $params);
	$items = [];
	foreach ($rows as $row) {
		$slug = (string)$row['path'];
		$items[] = [
			'title' => 'Bug report · ' . (trim((string)$row['lesson_title']) !== '' ? (string)$row['lesson_title'] : $slug),
			'meta' => '#' . (int)$row['id'] . ' · ' . stats_search_date((int)$row['ts']),
			'snippet' => stats_search_snippet((string)(($row['last_error_json'] ?? '') !== '' ? $row['last_error_json'] : $row['url']), $terms),
			'href' => stats_search_feedback_url((int)$row['id'], $slug),
			'badge' => 'BUG',
		];
	}
	$groups['bugs'] = ['label' => 'Bug reports', 'items' => $items, 'total' => $count];

	$params = [];
	$where = stats_search_where($terms, ['h.action', 'h.from_status', 'h.to_status', 'h.note'], $params);
	$count = stats_search_one($pdo, "SELECT COUNT(*) AS n FROM feedback_history h WHERE $where", $params);
	$rows = stats_search_all($pdo, "SELECT h.id, h.feedback_id, h.ts, h.action, h.from_status, h.to_status, h.note, f.path, f.lesson_title FROM feedback_history h JOIN block_feedback f ON f.id = h.feedback_id WHERE $where ORDER BY h.ts DESC LIMIT 25", $params);
	$items = [];
	foreach ($rows as $row) {
		$slug = (string)$row['path'];
		$items[] = [
			'title' => 'Feedback history · ' . (string)$row['action'],
			'meta' => '#' . (int)$row['feedback_id'] . ' · ' . stats_search_date((int)$row['ts']) . ' · ' . (string)$row['from_status'] . ' → ' . (string)$row['to_status'],
			'snippet' => stats_search_snippet((string)$row['note'], $terms),
			'href' => stats_search_feedback_url((int)$row['feedback_id'], $slug),
			'badge' => 'HISTORY',
		];
	}
	$groups['history'] = ['label' => 'Feedback history', 'items' => $items, 'total' => $count];

	foreach ($groups as $group) {
		$total += (int)$group['total'];
	}
	return ['groups' => $groups, 'total' => $total];
}

function stats_where(int $range, string $path, string $refType, string $source, string $refPath, string $browser, string $os, string $device, bool $previous = false, string $day = '', int $weekday = 0, int $hour = -1, bool $humansOnly = false, string $botReason = ''): array {
	$where = ['1=1'];
	$params = [];
	if ($range > 0) {
		$now = time();
		if ($previous) {
			$where[] = 'ts >= ?';
			$params[] = $now - 2 * $range * 86400;
			$where[] = 'ts < ?';
			$params[] = $now - $range * 86400;
		} else {
			$where[] = 'ts >= ?';
			$params[] = $now - $range * 86400;
		}
	}
	if ($path !== '') {
		$where[] = 'path = ?';
		$params[] = $path;
	}
	if ($refType !== '') {
		$where[] = 'ref_type = ?';
		$params[] = $refType;
	}
	if ($source !== '') {
		$where[] = 'ref_source = ?';
		$params[] = $source;
	}
	if ($refPath !== '') {
		$where[] = 'ref_path = ?';
		$params[] = $refPath;
	}
	if ($browser !== '') {
		$where[] = 'browser = ?';
		$params[] = $browser;
	}
	if ($os !== '') {
		$where[] = 'os = ?';
		$params[] = $os;
	}
	if ($device !== '') {
		$where[] = 'device = ?';
		$params[] = $device;
	}
	if ($day !== '') {
		$where[] = 'day = ?';
		$params[] = $day;
	}
	if ($weekday > 0) {
		$where[] = "CAST(strftime('%w', day) AS INTEGER) = ?";
		$params[] = $weekday === 7 ? 0 : $weekday;
	}
	if ($hour >= 0) {
		$where[] = 'hour = ?';
		$params[] = $hour;
	}
	if ($humansOnly) {
		$where[] = 'is_bot = 0';
	}
	if ($botReason !== '') {
		$where[] = 'bot_reason = ?';
		$params[] = $botReason;
	}
	return [implode(' AND ', $where), $params];
}

function stats_valid_date(string $value): bool {
	if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $value)) {
		return false;
	}
	[$year, $month, $day] = array_map('intval', explode('-', $value));
	return checkdate($month, $day, $year);
}

function stats_where_between(string $from, string $to, string $path, string $refType, string $source, string $refPath, string $browser, string $os, string $device, bool $humansOnly = false): array {
	[$filterSql, $filterParams] = stats_where(0, $path, $refType, $source, $refPath, $browser, $os, $device, false, '', 0, -1, $humansOnly, '');
	return ['day >= ? AND day <= ? AND ' . $filterSql, array_merge([$from, $to], $filterParams)];
}

function stats_compare_snapshot(PDO $pdo, string $whereSql, array $params): array {
	$row = stats_one($pdo, "SELECT
			COUNT(*) AS views,
			SUM(CASE WHEN ref_type <> 'internal' THEN 1 ELSE 0 END) AS entries,
			AVG(duration_sec) AS avg_duration,
			AVG(scroll_pct) AS avg_scroll,
			SUM(CASE WHEN duration_sec IS NOT NULL THEN 1 ELSE 0 END) AS known,
			SUM(CASE WHEN duration_sec IS NOT NULL AND duration_sec < 10 THEN 1 ELSE 0 END) AS bounces
		FROM pageviews WHERE $whereSql", $params);
	$known = (int)($row['known'] ?? 0);
	$bounces = (int)($row['bounces'] ?? 0);
	return [
		'views' => (int)($row['views'] ?? 0),
		'entries' => (int)($row['entries'] ?? 0),
		'avg_duration' => isset($row['avg_duration']) && $row['avg_duration'] !== null ? (float)$row['avg_duration'] : null,
		'avg_scroll' => isset($row['avg_scroll']) && $row['avg_scroll'] !== null ? (float)$row['avg_scroll'] : null,
		'bounce_rate' => $known > 0 ? 100 * $bounces / $known : null,
	];
}

function stats_time_label(int $ts): string {
	$dt = (new DateTimeImmutable('@' . $ts))->setTimezone(new DateTimeZone('Europe/Berlin'));
	return $dt->format('Y-m-d H:i');
}

function stats_relative_time(?int $ts): string {
	if ($ts === null) {
		return '—';
	}
	$diff = max(0, time() - $ts);
	if ($diff < 60) {
		return $diff <= 1 ? 'just now' : $diff . ' sec ago';
	}
	if ($diff < 3600) {
		return (string)intdiv($diff, 60) . ' min ago';
	}
	if ($diff < 86400) {
		return (string)intdiv($diff, 3600) . ' h ago';
	}
	return (string)intdiv($diff, 86400) . ' d ago';
}

function stats_scroll_color(?float $scroll): string {
	if ($scroll === null) {
		return '#64748b';
	}
	if ($scroll >= 75) {
		return '#34d399';
	}
	if ($scroll >= 50) {
		return '#38bdf8';
	}
	if ($scroll >= 25) {
		return '#e9aa60';
	}
	return '#fb7185';
}

function stats_ref_color(string $type): string {
	return match ($type) {
		'search' => '#34d399',
		'social' => '#fb7185',
		'external' => '#e9aa60',
		'internal' => '#38bdf8',
		default => '#94a3b8',
	};
}

function stats_browser_label(array $row): string {
	$browser = isset($row['browser']) ? (string)$row['browser'] : '';
	if ($browser === '' || $browser === 'Unknown') {
		return 'Unknown';
	}
	$major = $row['browser_major'] ?? null;
	if ($major !== null && $major !== '') {
		$browser .= ' ' . (int)$major;
	}
	return $browser;
}

function stats_os_label(array $row): string {
	$os = isset($row['os']) ? (string)$row['os'] : '';
	if ($os === '' || $os === 'Unknown') {
		return 'Unknown';
	}
	$version = isset($row['os_version']) ? (string)$row['os_version'] : '';
	if ($version !== '') {
		$os .= ' ' . $version;
	}
	return $os;
}

function stats_bounce_class(?float $rate): string {
	if ($rate === null) {
		return '';
	}
	if ($rate >= 60.0) {
		return 'bad';
	}
	if ($rate <= 20.0) {
		return 'good';
	}
	return '';
}

function stats_sparkline(array $values, int $width = 96, int $height = 24): string {
	$count = count($values);
	if ($count === 0) {
		return '—';
	}
	$max = 0;
	foreach ($values as $value) {
		$max = max($max, (int)$value);
	}
	if ($max <= 0) {
		return '—';
	}
	$points = [];
	foreach ($values as $index => $value) {
		$x = $count > 1 ? ($index / ($count - 1)) * $width : $width / 2;
		$y = $height - 2 - (((int)$value / $max) * ($height - 4));
		$points[] = number_format((float)$x, 1, '.', '') . ',' . number_format((float)$y, 1, '.', '');
	}
	return '<svg class="spark" width="' . $width . '" height="' . $height . '" viewBox="0 0 ' . $width . ' ' . $height . '" role="img" aria-label="Page trend over the selected period"><polyline points="' . implode(' ', $points) . '" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>';
}

function stats_presentation_line_svg(array $values, int $width = 1000, int $height = 260): string {
	$count = count($values);
	if ($count === 0) {
		return '';
	}
	$max = max($values);
	if ($max <= 0) {
		return '';
	}
	$points = [];
	foreach ($values as $index => $value) {
		$x = $count > 1 ? ($index / ($count - 1)) * $width : $width / 2;
		$y = $height - 12 - (((int)$value / $max) * ($height - 34));
		$points[] = number_format((float)$x, 1, '.', '') . ',' . number_format((float)$y, 1, '.', '');
	}
	$area = 'M0,' . $height . ' L' . implode(' L', $points) . ' L' . $width . ',' . $height . ' Z';
	$grid = '';
	foreach ([0.25, 0.5, 0.75] as $fraction) {
		$y = number_format($height - 12 - ($fraction * ($height - 34)), 1, '.', '');
		$grid .= '<line x1="0" y1="' . $y . '" x2="' . $width . '" y2="' . $y . '" stroke="currentColor" stroke-opacity=".12" stroke-width="1"/>';
	}
	$peakIndex = array_search($max, $values, true);
	$peakPoint = $peakIndex !== false && isset($points[$peakIndex]) ? explode(',', $points[$peakIndex]) : null;
	$peakMark = '';
	if ($peakPoint) {
		$peakMark = '<circle cx="' . $peakPoint[0] . '" cy="' . $peakPoint[1] . '" r="6" fill="currentColor" opacity=".9"/><circle cx="' . $peakPoint[0] . '" cy="' . $peakPoint[1] . '" r="13" fill="currentColor" opacity=".12"/>';
	}
	return '<svg viewBox="0 0 ' . $width . ' ' . $height . '" preserveAspectRatio="none" role="img" aria-label="Views over time">'
		. '<defs><linearGradient id="mn-pres-traffic-fill" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="currentColor" stop-opacity=".38"/><stop offset="1" stop-color="currentColor" stop-opacity="0"/></linearGradient></defs>'
		. $grid
		. '<path d="' . $area . '" fill="url(#mn-pres-traffic-fill)"/>'
		. '<polyline points="' . implode(' ', $points) . '" fill="none" stroke="currentColor" stroke-width="3" stroke-linejoin="round" stroke-linecap="round"/>'
		. $peakMark
		. '</svg>';
}

function stats_graph_has_path(array $adj, string $from, string $to): bool {
	if ($from === $to) {
		return true;
	}
	$stack = [$from];
	$seen = [];
	while ($stack) {
		$node = array_pop($stack);
		if (isset($seen[$node])) {
			continue;
		}
		$seen[$node] = true;
		foreach (array_keys($adj[$node] ?? []) as $next) {
			if ($next === $to) {
				return true;
			}
			if (!isset($seen[$next])) {
				$stack[] = $next;
			}
		}
	}
	return false;
}

function stats_mix_data(array $rows, callable $labelFn, int $limit = 6): array {
	$total = 0;
	foreach ($rows as $row) {
		$total += (int)$row['views'];
	}
	$data = [];
	$shown = 0;
	foreach (array_slice($rows, 0, $limit) as $row) {
		$value = (int)$row['views'];
		if ($value <= 0) {
			continue;
		}
		$shown += $value;
		$data[] = ['name' => $labelFn($row), 'value' => $value];
	}
	if ($total > $shown) {
		$data[] = ['name' => 'Other', 'value' => $total - $shown];
	}
	return $data;
}

function stats_device_label(string $device): string {
	return match ($device) {
		'desktop' => 'Desktop',
		'mobile' => 'Mobile',
		'tablet' => 'Tablet',
		'bot' => 'Bot',
		'unknown' => 'Unknown',
		default => 'Unknown',
	};
}

function stats_client_subline(array $row): string {
	$os = stats_os_label($row);
	$device = stats_device_label((string)($row['device'] ?? ''));
	if ($os === 'Unknown' && $device === 'Unknown') {
		return '';
	}
	return $os . ' · ' . $device;
}

function stats_day_label(string $day): string {
	$dt = DateTimeImmutable::createFromFormat('!Y-m-d', $day, new DateTimeZone('Europe/Berlin'));
	if (!$dt) {
		return $day;
	}
	return $dt->format('D, M j');
}

if (session_status() !== PHP_SESSION_ACTIVE) {
	ini_set('session.use_strict_mode', '1');
	ini_set('session.use_only_cookies', '1');
	ini_set('session.cookie_httponly', '1');
	session_name('mnstats');
	session_set_cookie_params([
		'lifetime' => 0,
		'path' => stats_cookie_path(),
		'secure' => stats_is_secure(),
		'httponly' => true,
		'samesite' => 'Strict',
	]);
	session_start();
}

$viewRaw = $_GET['view'] ?? 'analytics';
$view = is_scalar($viewRaw) && (string)$viewRaw === 'feedback' ? 'feedback' : 'analytics';
$statsScriptDir = rtrim(str_replace('\\', '/', dirname((string)($_SERVER['SCRIPT_NAME'] ?? '/'))), '/');
$feedbackEmbedParams = ['embed' => '1'];
foreach (['tab', 'path', 'reaction', 'status', 'has_comment', 'bug', 'q', 'open', 'page', 'range'] as $feedbackKey) {
	if (isset($_GET[$feedbackKey]) && is_scalar($_GET[$feedbackKey])) {
		$feedbackEmbedParams[$feedbackKey] = (string)$_GET[$feedbackKey];
	}
}
$feedbackEmbedUrl = ($statsScriptDir === '' || $statsScriptDir === '.' ? '' : $statsScriptDir) . '/feedback?' . http_build_query($feedbackEmbedParams);

$rangeOptions = [7 => '7 days', 30 => '30 days', 90 => '90 days', 365 => '1 year', 0 => 'All'];

$rangeRaw = $_GET['range'] ?? 30;
$range = is_scalar($rangeRaw) ? (int)$rangeRaw : 30;
if (!array_key_exists($range, $rangeOptions)) {
	$range = 30;
}

$dayRaw = $_GET['day'] ?? '';
$day = is_scalar($dayRaw) ? (string)$dayRaw : '';
if ($day !== '' && !preg_match('/^\d{4}-\d{2}-\d{2}$/', $day)) {
	$day = '';
}

$weekdayRaw = $_GET['weekday'] ?? '';
$weekday = is_scalar($weekdayRaw) ? (int)$weekdayRaw : 0;
if ($weekday < 1 || $weekday > 7) {
	$weekday = 0;
}
$hourRaw = $_GET['hour'] ?? '';
$hour = -1;
if ($hourRaw !== '' && is_scalar($hourRaw)) {
	$hourCandidate = (int)$hourRaw;
	if ($hourCandidate >= 0 && $hourCandidate <= 23) {
		$hour = $hourCandidate;
	}
}
$humansOnly = isset($_GET['humans']) && (string)$_GET['humans'] === '1';

$compareModeRaw = $_GET['cmp_mode'] ?? 'previous';
$compareMode = is_scalar($compareModeRaw) ? (string)$compareModeRaw : 'previous';
if (!in_array($compareMode, ['previous', 'entity', 'range'], true)) {
	$compareMode = 'previous';
}
$compareKindRaw = $_GET['cmp_kind'] ?? 'path';
$compareKind = is_scalar($compareKindRaw) ? (string)$compareKindRaw : 'path';
if (!in_array($compareKind, ['path', 'source', 'device'], true)) {
	$compareKind = 'path';
}
$compareARaw = $_GET['cmp_a'] ?? '';
$compareBRaw = $_GET['cmp_b'] ?? '';
$compareA = is_scalar($compareARaw) ? mb_substr((string)$compareARaw, 0, 120) : '';
$compareB = is_scalar($compareBRaw) ? mb_substr((string)$compareBRaw, 0, 120) : '';
$compareFromARaw = $_GET['cmp_from_a'] ?? '';
$compareToARaw = $_GET['cmp_to_a'] ?? '';
$compareFromBRaw = $_GET['cmp_from_b'] ?? '';
$compareToBRaw = $_GET['cmp_to_b'] ?? '';
$compareFromA = is_scalar($compareFromARaw) && stats_valid_date((string)$compareFromARaw) ? (string)$compareFromARaw : '';
$compareToA = is_scalar($compareToARaw) && stats_valid_date((string)$compareToARaw) ? (string)$compareToARaw : '';
$compareFromB = is_scalar($compareFromBRaw) && stats_valid_date((string)$compareFromBRaw) ? (string)$compareFromBRaw : '';
$compareToB = is_scalar($compareToBRaw) && stats_valid_date((string)$compareToBRaw) ? (string)$compareToBRaw : '';
if ($compareMode === 'range') {
	$compareToA = $compareToA !== '' ? $compareToA : (new DateTimeImmutable('now', new DateTimeZone('Europe/Berlin')))->format('Y-m-d');
	$compareFromA = $compareFromA !== '' ? $compareFromA : (new DateTimeImmutable($compareToA))->modify('-29 days')->format('Y-m-d');
	$compareToB = $compareToB !== '' ? $compareToB : (new DateTimeImmutable($compareFromA))->modify('-1 day')->format('Y-m-d');
	$compareFromB = $compareFromB !== '' ? $compareFromB : (new DateTimeImmutable($compareToB))->modify('-29 days')->format('Y-m-d');
}

$pathRaw = $_GET['path'] ?? '';
$path = is_scalar($pathRaw) ? (string)$pathRaw : '';
if ($path !== '' && !preg_match('/^[a-zA-Z0-9_-]{1,80}$/', $path)) {
	$path = '';
}

$refTypeRaw = $_GET['ref_type'] ?? '';
$refType = is_scalar($refTypeRaw) ? (string)$refTypeRaw : '';
if (!in_array($refType, ['', 'direct', 'internal', 'search', 'social', 'external'], true)) {
	$refType = '';
}

$sourceRaw = $_GET['source'] ?? '';
$source = is_scalar($sourceRaw) ? (string)$sourceRaw : '';
if ($source !== '') {
	$source = mb_substr($source, 0, 120);
}

$refPathRaw = $_GET['ref_path'] ?? '';
$refPath = is_scalar($refPathRaw) ? (string)$refPathRaw : '';
if ($refPath !== '' && !preg_match('/^[a-zA-Z0-9_-]{1,80}$/', $refPath)) {
	$refPath = '';
}

$browserRaw = $_GET['browser'] ?? '';
$browser = is_scalar($browserRaw) ? (string)$browserRaw : '';
if ($browser !== '' && !preg_match('/^[a-zA-Z0-9 ._+\-]{1,32}$/', $browser)) {
	$browser = '';
}

$osRaw = $_GET['os'] ?? '';
$os = is_scalar($osRaw) ? (string)$osRaw : '';
if ($os !== '' && !preg_match('/^[a-zA-Z0-9 ._+\-]{1,16}$/', $os)) {
	$os = '';
}

$deviceRaw = $_GET['device'] ?? '';
$device = is_scalar($deviceRaw) ? (string)$deviceRaw : '';
if (!in_array($device, ['', 'desktop', 'mobile', 'tablet', 'bot', 'unknown'], true)) {
	$device = '';
}
$botReasonRaw = $_GET['bot_reason'] ?? '';
$botReason = is_scalar($botReasonRaw) ? trim((string)$botReasonRaw) : '';
if ($botReason !== '' && !preg_match('/^[a-zA-Z0-9 ._+\-]{1,64}$/', $botReason)) {
	$botReason = '';
}

$searchRaw = $_GET['q'] ?? '';
$search = is_scalar($searchRaw) ? trim((string)$searchRaw) : '';
if ($search !== '') {
	$search = mb_substr($search, 0, 160);
}
$searchTerms = stats_search_terms($search);

$pageRaw = $_GET['page'] ?? 1;
$pageNum = is_scalar($pageRaw) ? max(1, (int)$pageRaw) : 1;
$perPage = 100;

$actionRaw = $_POST['action'] ?? '';
$action = is_scalar($actionRaw) ? (string)$actionRaw : '';
$loginError = '';
$flash = null;

if (($_SERVER['REQUEST_METHOD'] ?? '') === 'POST') {
	if ($action === 'login') {
		if (!stats_check_csrf()) {
			$loginError = 'The session has expired. Please reload the page.';
		} elseif (stats_login_wait() > 0) {
			$loginError = 'Too many failed attempts. Please wait ' . stats_login_wait() . ' seconds.';
		} else {
			$passwordRaw = $_POST['password'] ?? '';
			$password = is_scalar($passwordRaw) ? (string)$passwordRaw : '';
			if (stats_verify_password($password)) {
				session_regenerate_id(true);
				$_SESSION['stats_auth'] = true;
				$_SESSION['stats_fail'] = 0;
				$_SESSION['stats_lock_until'] = 0;
				$_SESSION['stats_csrf'] = bin2hex(random_bytes(32));
				stats_set_admin_indicator_cookie();
				stats_set_exclude_cookie(true);
				stats_flash('ok', 'Signed in. Your own visits are excluded by default.');
				stats_redirect();
			}
			usleep(500000);
			$_SESSION['stats_fail'] = (int)($_SESSION['stats_fail'] ?? 0) + 1;
			if ($_SESSION['stats_fail'] >= 5) {
				$_SESSION['stats_lock_until'] = time() + 300;
				$_SESSION['stats_fail'] = 0;
			}
			$loginError = 'Wrong password.';
		}
	} elseif ($action === 'logout') {
		if (!stats_check_csrf()) {
			$flash = ['type' => 'error', 'text' => 'The session has expired.'];
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
			stats_clear_admin_indicator_cookie();
			header('Location: ' . stats_current_url(), true, 303);
			exit;
		}
	} elseif ($action === 'admin_cookie') {
		if (!stats_is_authed()) {
			http_response_code(403);
			exit;
		}
		if (!stats_check_csrf()) {
			$flash = ['type' => 'error', 'text' => 'The session has expired.'];
		} else {
			$on = !empty($_POST['exclude_self']);
			stats_set_exclude_cookie($on);
			stats_flash('ok', $on ? 'Your own visits are no longer counted.' : 'Your own visits are counted again.');
			stats_redirect();
		}
	} elseif ($action === 'backup') {
		if (!stats_is_authed()) {
			http_response_code(403);
			exit;
		}
		if (!stats_check_csrf()) {
			http_response_code(403);
			exit;
		}
		$backupDir = sys_get_temp_dir() . '/mn-analytics-backup-' . bin2hex(random_bytes(8));
		if (!@mkdir($backupDir, 0700, true)) {
			http_response_code(500);
			exit;
		}
		@chmod($backupDir, 0700);
		$tmp = $backupDir . '/backup.sqlite';
		if (!mn_analytics_backup_to($tmp)) {
			@unlink($tmp);
			@rmdir($backupDir);
			http_response_code(503);
			exit;
		}
		@chmod($tmp, 0600);
		$size = @filesize($tmp);
		header('Content-Type: application/vnd.sqlite3');
		header('Content-Disposition: attachment; filename="blog-analytics-' . date('Y-m-d-His') . '.sqlite"');
		header('Content-Length: ' . (int)$size);
		header('Cache-Control: no-store');
		header('X-Content-Type-Options: nosniff');
		readfile($tmp);
		@unlink($tmp);
		@rmdir($backupDir);
		exit;
	} elseif ($action === 'export') {
		if (!stats_is_authed()) {
			http_response_code(403);
			exit;
		}
		if (!stats_check_csrf()) {
			http_response_code(403);
			exit;
		}
		$pdoExport = mn_analytics_open_db($analyticsKillSwitch);
		if (!$pdoExport) {
			http_response_code(503);
			exit;
		}
		[$whereSql, $params] = stats_where($range, $path, $refType, $source, $refPath, $browser, $os, $device, false, $day, $weekday, $hour, $humansOnly, $botReason);
		$stmt = $pdoExport->prepare(
			"SELECT ts, day, hour, path, ref_type, ref_source, ref_host, ref_path,
			        browser, browser_major, os, os_version, device, is_bot, bot_reason,
			        duration_sec, scroll_pct, completed
			 FROM pageviews WHERE $whereSql ORDER BY ts DESC, id DESC LIMIT 200000"
		);
		$stmt->execute($params);
		header('Content-Type: text/csv; charset=utf-8');
		header('Content-Disposition: attachment; filename="blog-analytics-' . date('Y-m-d') . '.csv"');
		header('Cache-Control: no-store');
		$out = fopen('php://output', 'w');
		if ($out === false) {
			exit;
		}
		fwrite($out, "\xEF\xBB\xBF");
		fputcsv($out, ['Date', 'Hour', 'Page', 'Referrer type', 'Referrer source', 'Referrer host', 'Previous page', 'Browser', 'Browser version', 'OS', 'OS version', 'Device', 'Bot', 'Bot reason', 'Duration (s)', 'Scroll (%)', 'Status'], ';', '"', '\\');
		while ($row = $stmt->fetch()) {
			fputcsv($out, [
				(string)$row['day'],
				str_pad((string)$row['hour'], 2, '0', STR_PAD_LEFT),
				(string)$row['path'],
				mn_analytics_ref_type_label((string)$row['ref_type']),
				(string)$row['ref_source'],
				(string)$row['ref_host'],
				(string)$row['ref_path'],
				(string)$row['browser'],
				$row['browser_major'] === null ? '' : (string)$row['browser_major'],
				(string)$row['os'],
				(string)$row['os_version'],
				(string)$row['device'],
				((int)$row['is_bot'] === 1 ? 'yes' : 'no'),
				(string)$row['bot_reason'],
				$row['duration_sec'] === null ? '' : (string)$row['duration_sec'],
				$row['scroll_pct'] === null ? '' : (string)$row['scroll_pct'],
				((int)$row['completed'] === 1 ? 'completed' : 'open'),
			], ';', '"', '\\');
		}
		fclose($out);
		exit;
	}
}

if ($flash === null) {
	$flash = stats_take_flash();
}

$authed = stats_is_authed();
$passwordStatus = stats_password_status();
$excludeSelf = isset($_COOKIE['mn_stats_exclude']) && (string)$_COOKIE['mn_stats_exclude'] === '1';
$nowLabel = (new DateTimeImmutable('now', new DateTimeZone('Europe/Berlin')))->format('Y-m-d H:i');
$titles = mn_analytics_lesson_titles();
$rangeLabel = $rangeOptions[$range];

$dbError = null;
$views = 0;
$known = 0;
$scrollKnown = 0;
$bounces = 0;
$entries = 0;
$internal = 0;
$bots = 0;
$pending = 0;
$avgDuration = null;
$medianDuration = null;
$avgScroll = null;
$oldest = null;
$newest = null;
$distinctPages = 0;
$distinctSources = 0;
$prevViews = 0;
$todayViews = 0;
$hourViews = 0;
$rowsTotal = 0;
$dbSize = 0;
$bounceRate = 0.0;
$knownPct = 0.0;
$entryShare = 0.0;
$deltaHtml = '<span class="delta flat">—</span>';
$seriesLabels = [];
$seriesDayKeys = [];
$seriesCurrent = [];
$seriesPrev = [];
$seriesEntries = [];
$seriesAnomalies = [];
$activeDays = 0;
$periodDays = 1;
$viewsPerDay = 0.0;
$entriesPerDay = 0.0;
$todayEntries = 0;
$todayPrevEntries = 0;
$todayPrevViews = 0;
$todayLabel = '';
$todayPrevLabel = '';
$todayDeltaHtml = '<span class="delta flat">—</span>';
$todaySparkline = '—';
$headlineInsights = [];
$lastSeen = null;
$lastSeenAge = '—';
$heroHourViews = 0;
$currentHour = (int)(new DateTimeImmutable('now', new DateTimeZone('Europe/Berlin')))->format('G');
$calendarData = [];
$calendarMax = 1;
$calendarStart = '';
$calendarEnd = '';
$botHumanLabels = [];
$botHumanHumans = [];
$botHumanBots = [];
$funnelData = [];
$attentionData = [];
$topMovers = ['up' => [], 'down' => []];
$prevPageMap = [];
$pageSourceData = [];
$pageSourcePages = [];
$pageSourceSources = [];
$pageSourcePageKeys = [];
$pageSourceSourceFilters = [];
$contentTreemap = [];
$sourceTreemap = [];
$clockLabels = [];
$clockViews = [];
$clockEntries = [];
$confidenceDuration = 0.0;
$confidenceScroll = 0.0;
$confidenceBots = 0.0;
$peakDayKey = null;
$peakDayViews = 0;
$peakDayLabel = '—';
$hourProfile = [];
$hourMax = 0;
$peakHour = null;
$peakHourViews = 0;
$peakHourEntries = 0;
$weekdayLabels = [1 => 'Mon', 2 => 'Tue', 3 => 'Wed', 4 => 'Thu', 5 => 'Fri', 6 => 'Sat', 7 => 'Sun'];
$weekdayProfile = [];
$weekdayMax = 0;
$peakWeekdayIndex = null;
$peakWeekdayViews = 0;
$peakWeekdayEntries = 0;
$weekHourMap = [];
$weekHourMax = 0;
$weekHourEntriesMap = [];
$weekHourEntriesMax = 0;
$entryPages = [];
$engagementBuckets = [];
$engagementMax = 1;
$sectionPath = '';
$sectionPages = [];
$sectionMap = [];
$sectionPageviews = 0;
$sectionCoverage = 0.0;
$interactionRows = [];
$interactionGroups = [];
$interactionPageviews = 0;
$interactionCoverage = 0.0;
$quizDifficulty = [];
$searchUsage = 0;
$searchAvgResults = null;
$searchGroups = [];
$searchTotal = 0;
$searchError = null;
$contentHealth = [];
$comparisonRows = [];
$cohortRows = [];
$prevKpi = [];
$compareALabel = 'Current';
$compareBLabel = 'Previous period';
$compareRows = [];
$storyTop = null;
$storyHealth = null;
$storyTopSlug = '';
$detailsEnabled = false;
$refCounts = ['direct' => 0, 'internal' => 0, 'search' => 0, 'social' => 0, 'external' => 0];
$topPages = [];
$pageRows = [];
$chartPages = [];
$pageTrendMap = [];
$pageSparklines = [];
$pageShareData = [];
$zeroPages = 0;
$referrers = [];
$externalReferrers = [];
$internalRefs = [];
$sankeyLinks = [];
$sankeyNodes = [];
$sankeyOmitted = 0;
$transitionSources = [];
$transitionTargets = [];
$transitionSourceSlugs = [];
$transitionTargetSlugs = [];
$transitionMatrixData = [];
$browsers = [];
$osRows = [];
$deviceRows = [];
$botReasons = [];
$botHints = [];
$botRules = [];
$botTotal = 0;
$browserMix = [];
$osMix = [];
$deviceMix = [];
$browserOptions = [];
$osOptions = [];
$bucketData = [];
$bucketMax = 1;
$scrollBuckets = [];
$scrollBucketMax = 1;
$heatDays = [];
$heatSpan = 28;
$heatMax = 0;
$insights = [];
$raw = [];
$feedbackSummary = ['total' => 0, 'with_comment' => 0, 'bugs' => 0, 'accepted' => 0, 'done' => 0];
$feedbackReactionCounts = [];
$feedbackLatest = [];
$presentationFeedbackDaily = ['labels' => [], 'series' => []];
$presentationFeedbackPages = [];
$pageCount = 1;
$sourceOptions = [];
$dbPath = mn_analytics_db_path();
$dbDir = dirname($dbPath);
$dbDirWritable = is_dir($dbDir) && is_writable($dbDir);
$dbInsideWebroot = mn_analytics_path_inside_webroot($dbPath);
$dbFileExists = is_file($dbPath);
$dbFileWritable = !$dbFileExists || is_writable($dbPath);
$dbSource = mn_analytics_db_path_source();
$dbProtectionFile = $dbDir . '/.htaccess';
$dbProtected = false;
if ($dbInsideWebroot && is_file($dbProtectionFile) && is_readable($dbProtectionFile)) {
	$protectionContent = (string)@file_get_contents($dbProtectionFile);
	$dbProtected = stripos($protectionContent, 'Require all denied') !== false
		|| stripos($protectionContent, 'Deny from all') !== false;
}
$webUser = mn_analytics_web_user();
$moveDir = '/var/lib/asanai-blog';
$moveDb = $moveDir . '/analytics.sqlite';
$moveCommands = [
	'sudo install -d -o ' . escapeshellarg($webUser) . ' -g ' . escapeshellarg($webUser) . ' -m 775 ' . escapeshellarg($moveDir),
	'sudo mv ' . escapeshellarg($dbPath) . ' ' . escapeshellarg($moveDb),
	'sudo chown ' . escapeshellarg($webUser) . ':' . escapeshellarg($webUser) . ' ' . escapeshellarg($moveDb),
	'sudo chmod 660 ' . escapeshellarg($moveDb),
	'',
	'Then set this in blog/lib/analytics_config.php:',
	"return ['db_path' => '" . $moveDb . "'];",
];

if ($authed) {
	$pdo = mn_analytics_open_db($analyticsKillSwitch);
	if (!$pdo) {
		$dbError = 'The SQLite database could not be opened.';
	} else {
		if ($search !== '' && $searchTerms) {
			try {
				$searchRun = stats_search_run($pdo, $searchTerms, $titles);
				$searchGroups = $searchRun['groups'];
				$searchTotal = (int)$searchRun['total'];
			} catch (Throwable $e) {
				$searchError = 'Search could not be completed.';
			}
		}
		try {
			$detailsEnabled = (int)$pdo->query('PRAGMA user_version')->fetchColumn() >= 6;
		} catch (Throwable $e) {
			$detailsEnabled = false;
		}
		if (!$analyticsKillSwitch) {
			mn_analytics_cleanup($pdo, true);
		}
		[$whereSql, $params] = stats_where($range, $path, $refType, $source, $refPath, $browser, $os, $device, false, $day, $weekday, $hour, $humansOnly, $botReason);
		[$prevWhereSql, $prevParams] = stats_where($range, $path, $refType, $source, $refPath, $browser, $os, $device, true, $day, $weekday, $hour, $humansOnly, $botReason);

		$kpi = stats_one($pdo, "SELECT
			COUNT(*) AS views,
			SUM(CASE WHEN duration_sec IS NOT NULL THEN 1 ELSE 0 END) AS known,
			AVG(duration_sec) AS avg_duration,
			SUM(CASE WHEN duration_sec IS NOT NULL AND duration_sec < 10 THEN 1 ELSE 0 END) AS bounces,
			AVG(scroll_pct) AS avg_scroll,
			SUM(CASE WHEN scroll_pct IS NOT NULL THEN 1 ELSE 0 END) AS scroll_known,
		SUM(CASE WHEN ref_type <> 'internal' THEN 1 ELSE 0 END) AS entries,
		SUM(CASE WHEN ref_type = 'internal' THEN 1 ELSE 0 END) AS internal,
		SUM(CASE WHEN is_bot = 1 THEN 1 ELSE 0 END) AS bots,
		SUM(CASE WHEN completed = 0 THEN 1 ELSE 0 END) AS pending,
			MIN(ts) AS oldest,
			MAX(ts) AS newest,
			COUNT(DISTINCT path) AS distinct_pages,
			COUNT(DISTINCT CASE WHEN ref_source <> '' THEN ref_source END) AS distinct_sources,
			COUNT(DISTINCT day) AS active_days
			FROM pageviews WHERE $whereSql", $params);

		$views = (int)($kpi['views'] ?? 0);
		$known = (int)($kpi['known'] ?? 0);
		$bounces = (int)($kpi['bounces'] ?? 0);
		$scrollKnown = (int)($kpi['scroll_known'] ?? 0);
		$entries = (int)($kpi['entries'] ?? 0);
		$internal = (int)($kpi['internal'] ?? 0);
		$bots = (int)($kpi['bots'] ?? 0);
		$pending = (int)($kpi['pending'] ?? 0);
		$distinctPages = (int)($kpi['distinct_pages'] ?? 0);
		$distinctSources = (int)($kpi['distinct_sources'] ?? 0);
		$activeDays = (int)($kpi['active_days'] ?? 0);
		$avgDuration = isset($kpi['avg_duration']) && $kpi['avg_duration'] !== null ? (float)$kpi['avg_duration'] : null;
		$avgScroll = isset($kpi['avg_scroll']) && $kpi['avg_scroll'] !== null ? (float)$kpi['avg_scroll'] : null;
		$oldest = isset($kpi['oldest']) && $kpi['oldest'] !== null ? (int)$kpi['oldest'] : null;
		$newest = isset($kpi['newest']) && $kpi['newest'] !== null ? (int)$kpi['newest'] : null;
		$bounceRate = $known > 0 ? 100 * $bounces / $known : 0.0;
		$knownPct = $views > 0 ? 100 * $known / $views : 0.0;
		$entryShare = $views > 0 ? 100 * $entries / $views : 0.0;
		if ($range > 0) {
			$periodDays = max(1, $range);
		} elseif ($oldest !== null && $newest !== null) {
			$periodDays = max(1, (int)ceil(($newest - $oldest + 1) / 86400));
		} else {
			$periodDays = max(1, $activeDays);
		}
		$viewsPerDay = $views / $periodDays;
		$entriesPerDay = $entries / $periodDays;

		if ($known > 0) {
			$offset = (int)floor($known / 2);
			$medRow = stats_one(
				$pdo,
				"SELECT duration_sec FROM pageviews WHERE $whereSql AND duration_sec IS NOT NULL ORDER BY duration_sec LIMIT 1 OFFSET " . $offset,
				$params
			);
			$medianDuration = isset($medRow['duration_sec']) ? (int)$medRow['duration_sec'] : null;
		}

		if ($range > 0) {
			$prevRow = stats_one($pdo, "SELECT COUNT(*) AS views FROM pageviews WHERE $prevWhereSql", $prevParams);
			$prevViews = (int)($prevRow['views'] ?? 0);
			if ($prevViews > 0) {
				$delta = ($views - $prevViews) / $prevViews * 100;
				$cls = $delta > 0.05 ? 'up' : ($delta < -0.05 ? 'down' : 'flat');
				$sign = $delta > 0 ? '+' : '';
				$deltaHtml = '<span class="delta ' . $cls . '">' . $sign . number_format($delta, 1, '.', ',') . ' % vs. previous period</span>';
			} elseif ($views > 0) {
				$deltaHtml = '<span class="delta up">new vs. previous period</span>';
			} else {
				$deltaHtml = '<span class="delta flat">Previous period: 0</span>';
			}
		} else {
			$deltaHtml = '<span class="delta flat">entire period</span>';
		}

		$today = (new DateTimeImmutable('now', new DateTimeZone('Europe/Berlin')))->format('Y-m-d');
		$todayLabel = (new DateTimeImmutable($today))->format('D, M j');
		$todayPrevDay = (new DateTimeImmutable($today))->modify('-7 days')->format('Y-m-d');
		$todayPrevLabel = (new DateTimeImmutable($todayPrevDay))->format('D');
		[$allWhereSql, $allParams] = stats_where(0, $path, $refType, $source, $refPath, $browser, $os, $device, false, '', 0, -1, $humansOnly, $botReason);
		$todayStats = stats_one($pdo, "SELECT
				SUM(CASE WHEN day = ? THEN 1 ELSE 0 END) AS views,
				SUM(CASE WHEN day = ? AND ref_type <> 'internal' THEN 1 ELSE 0 END) AS entries,
				MAX(ts) AS last_seen
			FROM pageviews WHERE $allWhereSql", array_merge([$today, $today], $allParams));
		$todayViews = (int)($todayStats['views'] ?? 0);
		$todayEntries = (int)($todayStats['entries'] ?? 0);
		$lastSeen = isset($todayStats['last_seen']) && $todayStats['last_seen'] !== null ? (int)$todayStats['last_seen'] : null;
		$lastSeenAge = stats_relative_time($lastSeen);
		$todayPrevRow = stats_one($pdo, "SELECT
				COUNT(*) AS views,
				SUM(CASE WHEN ref_type <> 'internal' THEN 1 ELSE 0 END) AS entries
			FROM pageviews WHERE $allWhereSql AND day = ?", array_merge($allParams, [$todayPrevDay]));
		$todayPrevViews = (int)($todayPrevRow['views'] ?? 0);
		$todayPrevEntries = (int)($todayPrevRow['entries'] ?? 0);
		if ($todayPrevEntries > 0) {
			$todayDelta = 100 * ($todayEntries - $todayPrevEntries) / $todayPrevEntries;
			$todayDeltaClass = $todayDelta > 0.05 ? 'up' : ($todayDelta < -0.05 ? 'down' : 'flat');
			$todayDeltaSign = $todayDelta > 0 ? '+' : '';
			$todayDeltaHtml = '<span class="delta ' . $todayDeltaClass . '">' . $todayDeltaSign . number_format($todayDelta, 1, '.', ',') . ' % vs last ' . $todayPrevLabel . '</span>';
		} elseif ($todayEntries > 0) {
			$todayDeltaHtml = '<span class="delta up">new vs last ' . $todayPrevLabel . '</span>';
		} else {
			$todayDeltaHtml = '<span class="delta flat">no estimated visits yet today</span>';
		}
		$hourStart = intdiv(time(), 3600) * 3600;
		$hourRow = stats_one($pdo, "SELECT COUNT(*) AS n FROM pageviews WHERE $whereSql AND ts >= ?", array_merge($params, [$hourStart]));
		$hourViews = (int)($hourRow['n'] ?? 0);
		$heroHourRow = stats_one($pdo, "SELECT COUNT(*) AS n FROM pageviews WHERE $allWhereSql AND ts >= ?", array_merge($allParams, [$hourStart]));
		$heroHourViews = (int)($heroHourRow['n'] ?? 0);
		$sparkStart = (new DateTimeImmutable('now', new DateTimeZone('Europe/Berlin')))->setTime(0, 0, 0)->modify('-6 days');
		$sparkRows = stats_all($pdo, "SELECT day, SUM(CASE WHEN ref_type <> 'internal' THEN 1 ELSE 0 END) AS entries
			FROM pageviews WHERE $allWhereSql AND day >= ? GROUP BY day", array_merge($allParams, [$sparkStart->format('Y-m-d')]));
		$sparkMap = [];
		foreach ($sparkRows as $sparkRow) {
			$sparkMap[(string)$sparkRow['day']] = (int)$sparkRow['entries'];
		}
		$sparkValues = [];
		for ($i = 0; $i < 7; $i++) {
			$sparkValues[] = (int)($sparkMap[$sparkStart->modify('+' . $i . ' days')->format('Y-m-d')] ?? 0);
		}
		$todaySparkline = stats_sparkline($sparkValues, 168, 40);

		$rowsRow = stats_one($pdo, "SELECT COUNT(*) AS n FROM pageviews", []);
		$rowsTotal = (int)($rowsRow['n'] ?? 0);
		$dbSize = is_file($dbPath) ? (int)@filesize($dbPath) : 0;

		$seriesRows = stats_all($pdo, "SELECT day,
				COUNT(*) AS views,
				SUM(CASE WHEN ref_type <> 'internal' THEN 1 ELSE 0 END) AS entries
			FROM pageviews WHERE $whereSql GROUP BY day ORDER BY day", $params);
		$currMap = [];
		$currEntriesMap = [];
		foreach ($seriesRows as $row) {
			$currMap[(string)$row['day']] = (int)$row['views'];
			$currEntriesMap[(string)$row['day']] = (int)$row['entries'];
		}
		foreach ($currMap as $dayKey => $dayViews) {
			if ($dayViews > $peakDayViews) {
				$peakDayViews = $dayViews;
				$peakDayKey = (string)$dayKey;
			}
		}
		if ($peakDayKey !== null) {
			$peakDayLabel = stats_day_label($peakDayKey);
		}

		$prevMap = [];
		if ($range > 0) {
			$prevSeriesRows = stats_all($pdo, "SELECT day, COUNT(*) AS views FROM pageviews WHERE $prevWhereSql GROUP BY day", $prevParams);
			foreach ($prevSeriesRows as $row) {
				$prevMap[(string)$row['day']] = (int)$row['views'];
			}
		}

		$tz = new DateTimeZone('Europe/Berlin');
		if ($range > 0) {
			$end = (new DateTimeImmutable('now', $tz))->setTime(0, 0, 0);
			$start = $end->modify('-' . ($range - 1) . ' days');
			for ($i = 0; $i < $range; $i++) {
				$d = $start->modify('+' . $i . ' days');
				$key = $d->format('Y-m-d');
				$seriesDayKeys[] = $key;
				$seriesLabels[] = $d->format('M j');
				$seriesCurrent[] = (int)($currMap[$key] ?? 0);
				$seriesEntries[] = (int)($currEntriesMap[$key] ?? 0);
				$pkey = $d->modify('-' . $range . ' days')->format('Y-m-d');
				$seriesPrev[] = (int)($prevMap[$pkey] ?? 0);
			}
		} else {
			$keys = array_keys($currMap);
			sort($keys);
			if ($keys) {
				$first = DateTimeImmutable::createFromFormat('!Y-m-d', (string)$keys[0], $tz);
				$last = DateTimeImmutable::createFromFormat('!Y-m-d', (string)$keys[count($keys) - 1], $tz);
				if ($first && $last) {
					if ((int)$first->diff($last)->days > 730) {
						$first = $last->modify('-730 days');
					}
					for ($d = $first; $d <= $last; $d = $d->modify('+1 day')) {
						$key = $d->format('Y-m-d');
						$seriesDayKeys[] = $key;
						$seriesLabels[] = $d->format('M j');
						$seriesCurrent[] = (int)($currMap[$key] ?? 0);
						$seriesEntries[] = (int)($currEntriesMap[$key] ?? 0);
					}
				}
			}
			if (!$seriesLabels) {
				$seriesLabels[] = (new DateTimeImmutable('now', $tz))->format('M j');
				$seriesCurrent[] = 0;
				$seriesEntries[] = 0;
			}
		}

		$calendarData = [];
		$calendarMax = 1;
		for ($i = 0; $i < count($seriesDayKeys); $i++) {
			$dayKey = (string)$seriesDayKeys[$i];
			$dayValue = (int)($seriesCurrent[$i] ?? 0);
			if ($dayKey === '') {
				continue;
			}
			$calendarData[] = [$dayKey, $dayValue];
			if ($dayValue > $calendarMax) {
				$calendarMax = $dayValue;
			}
		}

		$calendarStart = (string)($seriesDayKeys[0] ?? $today);
		$calendarEnd = (string)($seriesDayKeys[count($seriesDayKeys) - 1] ?? $today);
		if ($calendarStart === '') {
			$calendarStart = $today;
		}
		if ($calendarEnd === '') {
			$calendarEnd = $today;
		}

		$seriesAnomalies = [];
		for ($i = 0; $i < count($seriesCurrent); $i++) {
			$history = array_slice($seriesCurrent, max(0, $i - 7), min(7, $i));
			if (count($history) < 3) {
				continue;
			}
			$avg = array_sum($history) / count($history);
			if ($avg <= 0) {
				continue;
			}
			$value = (int)$seriesCurrent[$i];
			$ratio = $value / $avg;
			if ($value >= 5 && $ratio >= 1.6) {
				$seriesAnomalies[] = ['index' => $i, 'type' => 'spike', 'value' => $value, 'avg' => $avg];
			} elseif ($avg >= 5 && $ratio <= 0.4) {
				$seriesAnomalies[] = ['index' => $i, 'type' => 'dip', 'value' => $value, 'avg' => $avg];
			}
		}

		$botHumanRows = stats_all($pdo, "SELECT day,
				SUM(CASE WHEN is_bot = 0 THEN 1 ELSE 0 END) AS humans,
				SUM(CASE WHEN is_bot = 1 THEN 1 ELSE 0 END) AS bots
			FROM pageviews WHERE $whereSql GROUP BY day", $params);
		$botHumanMap = [];
		foreach ($botHumanRows as $row) {
			$botHumanMap[(string)$row['day']] = ['humans' => (int)$row['humans'], 'bots' => (int)$row['bots']];
		}
		$botHumanLabels = [];
		$botHumanHumans = [];
		$botHumanBots = [];
		foreach ($seriesDayKeys as $i => $dayKey) {
			$botHumanLabels[] = $seriesLabels[$i] ?? $dayKey;
			$botHumanHumans[] = (int)($botHumanMap[$dayKey]['humans'] ?? 0);
			$botHumanBots[] = (int)($botHumanMap[$dayKey]['bots'] ?? 0);
		}

		$funnelRow = stats_one($pdo, "SELECT
				COUNT(*) AS total,
				SUM(CASE WHEN duration_sec >= 10 THEN 1 ELSE 0 END) AS ten,
				SUM(CASE WHEN duration_sec >= 10 AND scroll_pct >= 50 THEN 1 ELSE 0 END) AS ten50,
				SUM(CASE WHEN duration_sec >= 10 AND scroll_pct >= 75 THEN 1 ELSE 0 END) AS ten75
			FROM pageviews WHERE $whereSql", $params);
		$funnelData = [
			['name' => 'All pageviews', 'value' => (int)($funnelRow['total'] ?? 0)],
			['name' => '10 seconds or more', 'value' => (int)($funnelRow['ten'] ?? 0)],
			['name' => '10 s + 50 % scroll', 'value' => (int)($funnelRow['ten50'] ?? 0)],
			['name' => '10 s + 75 % scroll', 'value' => (int)($funnelRow['ten75'] ?? 0)],
		];

		$confidenceDuration = $knownPct;
		$confidenceScroll = $views > 0 ? 100 * $scrollKnown / $views : 0.0;
		$confidenceBots = $views > 0 ? 100 * $bots / $views : 0.0;

		$prevPageMap = [];
		if ($range > 0) {
			$prevPageRows = stats_all($pdo, "SELECT path, COUNT(*) AS views FROM pageviews WHERE $prevWhereSql GROUP BY path", $prevParams);
			foreach ($prevPageRows as $row) {
				$prevPageMap[(string)$row['path']] = (int)$row['views'];
			}
			$prevKpi = stats_one($pdo, "SELECT
					COUNT(*) AS views,
					SUM(CASE WHEN ref_type <> 'internal' THEN 1 ELSE 0 END) AS entries,
					AVG(duration_sec) AS avg_duration,
					AVG(scroll_pct) AS avg_scroll,
					SUM(CASE WHEN duration_sec IS NOT NULL THEN 1 ELSE 0 END) AS known,
					SUM(CASE WHEN duration_sec IS NOT NULL AND duration_sec < 10 THEN 1 ELSE 0 END) AS bounces
				FROM pageviews WHERE $prevWhereSql", $prevParams);
			$prevEntries = (int)($prevKpi['entries'] ?? 0);
			$prevKnown = (int)($prevKpi['known'] ?? 0);
			$prevBounces = (int)($prevKpi['bounces'] ?? 0);
			$prevAvgDuration = isset($prevKpi['avg_duration']) && $prevKpi['avg_duration'] !== null ? (float)$prevKpi['avg_duration'] : null;
			$prevAvgScroll = isset($prevKpi['avg_scroll']) && $prevKpi['avg_scroll'] !== null ? (float)$prevKpi['avg_scroll'] : null;
			$prevBounceRate = $prevKnown > 0 ? 100 * $prevBounces / $prevKnown : null;
			$comparisonRows = [
				['label' => 'Views', 'kind' => 'int', 'current' => $views, 'previous' => $prevViews],
				['label' => 'Estimated visits', 'kind' => 'int', 'current' => $entries, 'previous' => $prevEntries],
				['label' => 'Avg. time', 'kind' => 'duration', 'current' => $avgDuration, 'previous' => $prevAvgDuration],
				['label' => 'Bounce rate', 'kind' => 'percent', 'current' => $bounceRate, 'previous' => $prevBounceRate],
				['label' => 'Avg. scroll', 'kind' => 'percent', 'current' => $avgScroll, 'previous' => $prevAvgScroll],
			];
		}

		if ($compareMode === 'previous' && $range > 0) {
			$compareRows = [
				['label' => 'Views', 'kind' => 'int', 'a' => $views, 'b' => $prevViews],
				['label' => 'Estimated visits', 'kind' => 'int', 'a' => $entries, 'b' => $prevEntries],
				['label' => 'Avg. time', 'kind' => 'duration', 'a' => $avgDuration, 'b' => $prevAvgDuration],
				['label' => 'Bounce rate', 'kind' => 'percent', 'a' => $bounceRate, 'b' => $prevBounceRate],
				['label' => 'Avg. scroll', 'kind' => 'percent', 'a' => $avgScroll, 'b' => $prevAvgScroll],
			];
		} elseif ($compareMode === 'entity') {
			$aPath = $path;
			$aSource = $source;
			$aDevice = $device;
			$bPath = $path;
			$bSource = $source;
			$bDevice = $device;
			$compareValid = false;
			if ($compareKind === 'path') {
				$aPath = preg_match('/^[a-zA-Z0-9_-]{1,80}$/', $compareA) ? $compareA : '';
				$bPath = preg_match('/^[a-zA-Z0-9_-]{1,80}$/', $compareB) ? $compareB : '';
				$compareValid = $aPath !== '' && $bPath !== '';
				$compareALabel = $aPath !== '' ? ($titles[$aPath] ?? $aPath) : 'Choose page A';
				$compareBLabel = $bPath !== '' ? ($titles[$bPath] ?? $bPath) : 'Choose page B';
			} elseif ($compareKind === 'source') {
				$aSource = $compareA;
				$bSource = $compareB;
				$compareValid = $aSource !== '' && $bSource !== '';
				$compareALabel = $aSource !== '' ? $aSource : 'Choose source A';
				$compareBLabel = $bSource !== '' ? $bSource : 'Choose source B';
			} else {
				$aDevice = in_array($compareA, ['desktop', 'mobile', 'tablet', 'bot', 'unknown'], true) ? $compareA : '';
				$bDevice = in_array($compareB, ['desktop', 'mobile', 'tablet', 'bot', 'unknown'], true) ? $compareB : '';
				$compareValid = $aDevice !== '' && $bDevice !== '';
				$compareALabel = $aDevice !== '' ? stats_device_label($aDevice) : 'Choose device A';
				$compareBLabel = $bDevice !== '' ? stats_device_label($bDevice) : 'Choose device B';
			}
			if ($compareValid) {
				[$whereA, $paramsA] = stats_where($range, $aPath, $refType, $aSource, $refPath, $browser, $os, $aDevice, false, $day, $weekday, $hour, $humansOnly, $botReason);
				[$whereB, $paramsB] = stats_where($range, $bPath, $refType, $bSource, $refPath, $browser, $os, $bDevice, false, $day, $weekday, $hour, $humansOnly, $botReason);
				$snapA = stats_compare_snapshot($pdo, $whereA, $paramsA);
				$snapB = stats_compare_snapshot($pdo, $whereB, $paramsB);
				$compareRows = [
					['label' => 'Views', 'kind' => 'int', 'a' => $snapA['views'], 'b' => $snapB['views']],
					['label' => 'Estimated visits', 'kind' => 'int', 'a' => $snapA['entries'], 'b' => $snapB['entries']],
					['label' => 'Avg. time', 'kind' => 'duration', 'a' => $snapA['avg_duration'], 'b' => $snapB['avg_duration']],
					['label' => 'Bounce rate', 'kind' => 'percent', 'a' => $snapA['bounce_rate'], 'b' => $snapB['bounce_rate']],
					['label' => 'Avg. scroll', 'kind' => 'percent', 'a' => $snapA['avg_scroll'], 'b' => $snapB['avg_scroll']],
				];
			}
		} elseif ($compareMode === 'range') {
			$compareALabel = $compareFromA . ' – ' . $compareToA;
			$compareBLabel = $compareFromB . ' – ' . $compareToB;
			[$whereA, $paramsA] = stats_where_between($compareFromA, $compareToA, $path, $refType, $source, $refPath, $browser, $os, $device, $humansOnly);
			[$whereB, $paramsB] = stats_where_between($compareFromB, $compareToB, $path, $refType, $source, $refPath, $browser, $os, $device, $humansOnly);
			$snapA = stats_compare_snapshot($pdo, $whereA, $paramsA);
			$snapB = stats_compare_snapshot($pdo, $whereB, $paramsB);
			$compareRows = [
				['label' => 'Views', 'kind' => 'int', 'a' => $snapA['views'], 'b' => $snapB['views']],
				['label' => 'Estimated visits', 'kind' => 'int', 'a' => $snapA['entries'], 'b' => $snapB['entries']],
				['label' => 'Avg. time', 'kind' => 'duration', 'a' => $snapA['avg_duration'], 'b' => $snapB['avg_duration']],
				['label' => 'Bounce rate', 'kind' => 'percent', 'a' => $snapA['bounce_rate'], 'b' => $snapB['bounce_rate']],
				['label' => 'Avg. scroll', 'kind' => 'percent', 'a' => $snapA['avg_scroll'], 'b' => $snapB['avg_scroll']],
			];
		}

		$refRows = stats_all($pdo, "SELECT ref_type, COUNT(*) AS views FROM pageviews WHERE $whereSql GROUP BY ref_type", $params);
		foreach ($refRows as $row) {
			$type = (string)$row['ref_type'];
			if (array_key_exists($type, $refCounts)) {
				$refCounts[$type] = (int)$row['views'];
			}
		}

		$topPages = stats_all($pdo, "SELECT path,
				COUNT(*) AS views,
				AVG(duration_sec) AS avg_duration,
				AVG(scroll_pct) AS avg_scroll,
				SUM(CASE WHEN ref_type <> 'internal' THEN 1 ELSE 0 END) AS entries,
				SUM(CASE WHEN ref_type = 'internal' THEN 1 ELSE 0 END) AS internal,
				SUM(CASE WHEN duration_sec IS NOT NULL AND duration_sec < 10 THEN 1 ELSE 0 END) AS bounces,
				SUM(CASE WHEN duration_sec IS NOT NULL THEN 1 ELSE 0 END) AS known,
				MAX(ts) AS last_ts
			FROM pageviews WHERE $whereSql
			GROUP BY path ORDER BY views DESC LIMIT 500", $params);

		$entryPages = stats_all($pdo, "SELECT path, COUNT(*) AS entries
			FROM pageviews WHERE $whereSql AND ref_type <> 'internal'
			GROUP BY path ORDER BY entries DESC LIMIT 5", $params);

		$pageMap = [];
		foreach ($topPages as $page) {
			$pageMap[(string)$page['path']] = $page;
		}

		$topMovers = ['up' => [], 'down' => []];
		if ($range > 0) {
			$moverSlugs = array_unique(array_merge(array_keys($pageMap), array_keys($prevPageMap)));
			$moverRows = [];
			foreach ($moverSlugs as $moverSlug) {
				$current = (int)($pageMap[$moverSlug]['views'] ?? 0);
				$previous = (int)($prevPageMap[$moverSlug] ?? 0);
				if ($current === 0 && $previous === 0) {
					continue;
				}
				$delta = $current - $previous;
				$moverRows[] = [
					'slug' => (string)$moverSlug,
					'current' => $current,
					'previous' => $previous,
					'delta' => $delta,
					'pct' => $previous > 0 ? 100 * $delta / $previous : null,
				];
			}
			usort($moverRows, static function (array $a, array $b): int {
				return $b['delta'] <=> $a['delta'];
			});
			$topMovers['up'] = array_slice(array_values(array_filter($moverRows, static function (array $row): bool {
				return $row['delta'] > 0;
			})), 0, 3);
			$negative = array_values(array_filter($moverRows, static function (array $row): bool {
				return $row['delta'] < 0;
			}));
			usort($negative, static function (array $a, array $b): int {
				return $a['delta'] <=> $b['delta'];
			});
			$topMovers['down'] = array_slice($negative, 0, 3);
		}

		$pageSlugs = [];
		if ($path === '') {
			$pageSlugs = array_keys($titles);
		}
		foreach ($pageMap as $slug => $page) {
			if (!in_array($slug, $pageSlugs, true)) {
				$pageSlugs[] = $slug;
			}
		}
		foreach ($pageSlugs as $slug) {
			$pageRows[] = $pageMap[$slug] ?? [
				'path' => $slug,
				'views' => 0,
				'avg_duration' => null,
				'avg_scroll' => null,
				'entries' => 0,
				'internal' => 0,
				'bounces' => 0,
				'known' => 0,
				'last_ts' => null,
			];
		}
		usort($pageRows, function (array $a, array $b) use ($titles): int {
			$views = (int)$b['views'] <=> (int)$a['views'];
			if ($views !== 0) {
				return $views;
			}
			$entries = (int)($b['entries'] ?? 0) <=> (int)($a['entries'] ?? 0);
			if ($entries !== 0) {
				return $entries;
			}
			$titleA = $titles[$a['path']] ?? (string)$a['path'];
			$titleB = $titles[$b['path']] ?? (string)$b['path'];
			return strcasecmp($titleA, $titleB);
		});
		$portfolioPages = [];
		foreach ($pageRows as $page) {
			if ((int)$page['views'] === 0) {
				$zeroPages++;
				continue;
			}
			if (count($portfolioPages) < 8) {
				$portfolioPages[] = $page;
			}
		}
		$sectionPath = $path !== '' ? $path : (string)($topPages[0]['path'] ?? '');
		$sectionPages = array_slice($topPages, 0, 10);
		$sectionPageViewTotal = $path !== '' ? $views : (int)($topPages[0]['views'] ?? 0);
		if ($detailsEnabled && $sectionPath !== '') {
			$sectionRows = stats_all($pdo, "SELECT s.section_index, s.section_key, s.section_label,
					SUM(CASE WHEN s.visible_pct >= 25 THEN 1 ELSE 0 END) AS reached,
					AVG(s.visible_pct) AS avg_visible,
					AVG(s.dwell_sec) AS avg_dwell
				FROM pageview_sections s
				JOIN pageviews p ON p.id = s.pageview_id
				WHERE p.id IN (SELECT id FROM pageviews WHERE $whereSql) AND s.path = ?
				GROUP BY s.section_index, s.section_key, s.section_label
				ORDER BY s.section_index LIMIT 40", array_merge($params, [$sectionPath]));
			$sectionPageviewsRow = stats_one($pdo, "SELECT COUNT(DISTINCT s.pageview_id) AS n
				FROM pageview_sections s
				JOIN pageviews p ON p.id = s.pageview_id
				WHERE p.id IN (SELECT id FROM pageviews WHERE $whereSql) AND s.path = ?", array_merge($params, [$sectionPath]));
			$sectionPageviews = (int)($sectionPageviewsRow['n'] ?? 0);
			$sectionCoverage = $sectionPageViewTotal > 0 ? 100 * $sectionPageviews / $sectionPageViewTotal : 0.0;
			foreach ($sectionRows as $sectionRow) {
				$reached = (int)$sectionRow['reached'];
				if ($reached <= 0) {
					continue;
				}
				$sectionMap[] = [
					'index' => (int)$sectionRow['section_index'],
					'key' => (string)$sectionRow['section_key'],
					'label' => (string)$sectionRow['section_label'],
					'reached' => $reached,
					'reach_pct' => $sectionPageviews > 0 ? 100 * $reached / $sectionPageviews : 0.0,
					'avg_visible' => $sectionRow['avg_visible'] !== null ? (float)$sectionRow['avg_visible'] : 0.0,
					'avg_dwell' => $sectionRow['avg_dwell'] !== null ? (float)$sectionRow['avg_dwell'] : 0.0,
				];
			}
		}

		if ($detailsEnabled) {
		$interactionRows = stats_all($pdo, "SELECT e.kind, e.target, COUNT(*) AS n,
				SUM(CASE WHEN e.value = 1 THEN 1 ELSE 0 END) AS positives,
				AVG(e.value) AS avg_value
			FROM pageview_events e
			JOIN pageviews p ON p.id = e.pageview_id
			WHERE p.id IN (SELECT id FROM pageviews WHERE $whereSql)
			GROUP BY e.kind, e.target
			ORDER BY n DESC LIMIT 160", $params);
		$interactionPageviewsRow = stats_one($pdo, "SELECT COUNT(DISTINCT e.pageview_id) AS n
			FROM pageview_events e
			JOIN pageviews p ON p.id = e.pageview_id
			WHERE p.id IN (SELECT id FROM pageviews WHERE $whereSql)", $params);
		$interactionPageviews = (int)($interactionPageviewsRow['n'] ?? 0);
		$interactionCoverage = $views > 0 ? 100 * $interactionPageviews / $views : 0.0;
		$interactionGroups = [
			'internal_link' => [], 'external_link' => [], 'citation' => [],
			'code_copy' => [], 'search_result' => [], 'download' => [],
			'media_play' => [], 'lab_run' => [], 'quiz_answer' => [],
		];
		foreach ($interactionRows as $interactionRow) {
			$kind = (string)$interactionRow['kind'];
			$n = (int)$interactionRow['n'];
			if ($kind === 'search') {
				$searchUsage += $n;
				$avg = $interactionRow['avg_value'] !== null ? (float)$interactionRow['avg_value'] : 0.0;
				$searchAvgResults = $searchAvgResults === null ? $avg : (($searchAvgResults * ($searchUsage - $n)) + ($avg * $n)) / max(1, $searchUsage);
				continue;
			}
			if ($kind === 'quiz_answer') {
				$accuracy = $n > 0 ? 100 * (int)$interactionRow['positives'] / $n : 0.0;
				$quizDifficulty[] = [
					'target' => (string)$interactionRow['target'],
					'n' => $n,
					'accuracy' => $accuracy,
				];
			}
			if (isset($interactionGroups[$kind]) && count($interactionGroups[$kind]) < 8) {
				$interactionGroups[$kind][] = $interactionRow;
			}
		}
		usort($quizDifficulty, static function (array $a, array $b): int {
			return $a['accuracy'] <=> $b['accuracy'];
		});
		$quizDifficulty = array_slice(array_values(array_filter($quizDifficulty, static function (array $row): bool {
			return $row['n'] >= 3;
		})), 0, 5);
		}

		$maxPageViews = 0;
		foreach ($topPages as $page) {
			$maxPageViews = max($maxPageViews, (int)$page['views']);
		}
		$contentHealth = [];
		foreach (array_slice($topPages, 0, 8) as $page) {
			$healthSlug = (string)$page['path'];
			$healthViews = (int)$page['views'];
			if ($healthViews <= 0) {
				continue;
			}
			$healthKnown = (int)($page['known'] ?? 0);
			$healthBounces = (int)($page['bounces'] ?? 0);
			$healthBounceRate = $healthKnown > 0 ? 100 * $healthBounces / $healthKnown : null;
			$healthDuration = $page['avg_duration'] !== null ? (float)$page['avg_duration'] : null;
			$healthScroll = $page['avg_scroll'] !== null ? (float)$page['avg_scroll'] : null;
			$healthWords = mn_analytics_page_word_count($healthSlug);
			$healthSpeed = null;
			if ($healthWords !== null && $healthDuration !== null && $healthDuration >= 45) {
				$healthSpeed = $healthWords / ($healthDuration / 60);
				if ($healthSpeed < 40 || $healthSpeed > 1200) {
					$healthSpeed = null;
				}
			}
			$healthPrev = (int)($prevPageMap[$healthSlug] ?? 0);
			$healthMomentum = $healthPrev > 0 ? 100 * ($healthViews - $healthPrev) / $healthPrev : null;
			$healthFlags = [];
			if ((int)($page['entries'] ?? 0) >= 3 && ($healthScroll === null || $healthScroll < 50)) {
				$healthFlags[] = 'content gap';
			}
			if ($healthViews >= 5 && $healthDuration !== null && $healthDuration < 45) {
				$healthFlags[] = 'skimmed';
			}
			if ($healthMomentum !== null && $healthMomentum >= 25) {
				$healthFlags[] = 'rising';
			} elseif ($healthMomentum !== null && $healthMomentum <= -25) {
				$healthFlags[] = 'falling';
			}
			$contentHealth[] = [
				'slug' => $healthSlug,
				'label' => $titles[$healthSlug] ?? $healthSlug,
				'views' => $healthViews,
				'share' => $views > 0 ? 100 * $healthViews / $views : 0.0,
				'duration' => $healthDuration,
				'scroll' => $healthScroll,
				'bounce' => $healthBounceRate,
				'words' => $healthWords,
				'speed' => $healthSpeed,
				'momentum' => $healthMomentum,
				'flags' => $healthFlags,
				'scores' => [
					'reach' => $maxPageViews > 0 ? 100 * $healthViews / $maxPageViews : 0.0,
					'depth' => $healthScroll ?? 0.0,
					'stickiness' => $healthBounceRate !== null ? max(0, 100 - $healthBounceRate) : 0.0,
					'momentum' => $healthMomentum === null ? 50.0 : max(0, min(100, 50 + $healthMomentum / 2)),
				],
			];
		}

		$storyTop = $topPages[0] ?? null;
		$storyTopSlug = $storyTop ? (string)$storyTop['path'] : '';
		$storyHealth = $contentHealth[0] ?? null;

		$chartPages = array_slice($topPages, 0, 12);
		$chartPages = array_reverse($chartPages);
		$chartPages = array_map(function (array $page) use ($titles): array {
			return [
				'name' => $titles[$page['path']] ?? (string)$page['path'],
				'value' => (int)$page['views'],
				'slug' => (string)$page['path'],
			];
		}, $chartPages);

		$pageTrendRows = stats_all($pdo, "SELECT path, day, COUNT(*) AS views
			FROM pageviews WHERE $whereSql
			GROUP BY path, day", $params);
		foreach ($pageTrendRows as $row) {
			$pageTrendMap[(string)$row['path']][(string)$row['day']] = (int)$row['views'];
		}
		foreach ($pageRows as $page) {
			$slug = (string)$page['path'];
			$values = [];
			foreach ($seriesDayKeys as $dayKey) {
				$values[] = (int)($pageTrendMap[$slug][$dayKey] ?? 0);
			}
			$pageSparklines[$slug] = stats_sparkline($values);
		}

		$contentTreemap = [];
		$attentionData = [];
		foreach (array_slice($topPages, 0, 20) as $page) {
			$pageSlug = (string)$page['path'];
			$pageViews = (int)$page['views'];
			if ($pageViews <= 0) {
				continue;
			}
			$pageTitle = $titles[$pageSlug] ?? $pageSlug;
			$pageScroll = $page['avg_scroll'] !== null ? (float)$page['avg_scroll'] : null;
			$pageDuration = $page['avg_duration'] !== null ? (float)$page['avg_duration'] : null;
			if (count($contentTreemap) < 12) {
				$contentTreemap[] = [
					'name' => $pageTitle,
					'value' => $pageViews,
					'slug' => $pageSlug,
					'scroll' => $pageScroll,
					'duration' => $pageDuration,
					'itemStyle' => ['color' => stats_scroll_color($pageScroll)],
				];
			}
			if ($pageDuration !== null && $pageScroll !== null) {
				$attentionData[] = [
					'name' => $pageTitle,
					'slug' => $pageSlug,
					'value' => [(int)round($pageDuration), (int)round($pageScroll), $pageViews],
				];
			}
		}

		$shareTotal = 0;
		foreach ($topPages as $page) {
			$shareTotal += (int)$page['views'];
		}
		$shareShown = 0;
		foreach (array_slice($topPages, 0, 6) as $page) {
			$value = (int)$page['views'];
			if ($value <= 0) {
				continue;
			}
			$shareShown += $value;
			$pageShareData[] = [
				'name' => $titles[$page['path']] ?? (string)$page['path'],
				'value' => $value,
			];
		}
		if ($shareTotal > $shareShown) {
			$pageShareData[] = ['name' => 'Other pages', 'value' => $shareTotal - $shareShown];
		}

		$referrers = stats_all($pdo, "SELECT ref_type, ref_source, ref_host,
				COUNT(*) AS views,
				AVG(duration_sec) AS avg_duration,
				SUM(CASE WHEN duration_sec IS NOT NULL AND duration_sec < 10 THEN 1 ELSE 0 END) AS bounces,
				SUM(CASE WHEN duration_sec IS NOT NULL THEN 1 ELSE 0 END) AS known
			FROM pageviews WHERE $whereSql AND ref_type <> 'internal'
			GROUP BY ref_type, ref_source, ref_host ORDER BY views DESC LIMIT 50", $params);
		$externalReferrers = array_values(array_filter($referrers, static function (array $row): bool {
			return (string)($row['ref_type'] ?? '') === 'external';
		}));

		foreach ($referrers as $row) {
			$s = (string)$row['ref_source'];
			if ($s !== '') {
				$sourceOptions[$s] = true;
			}
		}
		$sourceOptions = array_keys($sourceOptions);
		sort($sourceOptions);

		$sourceTreemap = [];
		foreach (array_slice($referrers, 0, 10) as $ref) {
			$refTypeLabel = mn_analytics_ref_type_label((string)$ref['ref_type']);
			$refName = trim((string)$ref['ref_source']);
			if ($refName === '') {
				$refName = $refTypeLabel;
			}
			$sourceTreemap[] = [
				'name' => $refName,
				'value' => (int)$ref['views'],
				'ref_type' => (string)$ref['ref_type'],
				'source' => (string)$ref['ref_source'],
				'host' => (string)$ref['ref_host'],
				'itemStyle' => ['color' => stats_ref_color((string)$ref['ref_type'])],
			];
		}

		$pageSourceRaw = stats_all($pdo, "SELECT path,
				CASE WHEN ref_source <> '' THEN ref_source ELSE ref_type END AS source,
				COUNT(*) AS views
			FROM pageviews WHERE $whereSql AND ref_type <> 'internal'
			GROUP BY path, source ORDER BY views DESC LIMIT 160", $params);
		$pageSourcePageTotals = [];
		$pageSourceSourceTotals = [];
		foreach ($pageSourceRaw as $row) {
			$pageSourcePageTotals[(string)$row['path']] = ($pageSourcePageTotals[(string)$row['path']] ?? 0) + (int)$row['views'];
			$pageSourceSourceTotals[(string)$row['source']] = ($pageSourceSourceTotals[(string)$row['source']] ?? 0) + (int)$row['views'];
		}
		arsort($pageSourcePageTotals);
		arsort($pageSourceSourceTotals);
		$pageSourcePageKeys = array_slice(array_keys($pageSourcePageTotals), 0, 8);
		$pageSourceSourceKeys = array_slice(array_keys($pageSourceSourceTotals), 0, 8);
		$pageSourcePages = array_map(static function (string $slug) use ($titles): string {
			return $titles[$slug] ?? $slug;
		}, $pageSourcePageKeys);
		$pageSourceSources = $pageSourceSourceKeys;
		$pageSourceSourceFilters = [];
		foreach ($pageSourceSourceKeys as $pageSourceSourceKey) {
			$pageSourceSourceFilters[] = in_array($pageSourceSourceKey, ['direct', 'search', 'social', 'external'], true)
				? ['ref_type' => $pageSourceSourceKey]
				: ['source' => $pageSourceSourceKey];
		}
		$pageSourcePageIndex = array_flip($pageSourcePageKeys);
		$pageSourceSourceIndex = array_flip($pageSourceSourceKeys);
		$pageSourceData = [];
		foreach ($pageSourceRaw as $row) {
			$pageKey = (string)$row['path'];
			$sourceKey = (string)$row['source'];
			if (!isset($pageSourcePageIndex[$pageKey]) || !isset($pageSourceSourceIndex[$sourceKey])) {
				continue;
			}
			$pageSourceData[] = [$pageSourceSourceIndex[$sourceKey], $pageSourcePageIndex[$pageKey], (int)$row['views']];
		}

		$internalRefs = stats_all($pdo, "SELECT ref_path,
				COUNT(*) AS views,
				AVG(duration_sec) AS avg_duration
			FROM pageviews WHERE $whereSql AND ref_type = 'internal'
			GROUP BY ref_path ORDER BY views DESC LIMIT 30", $params);

		$sankeyRows = stats_all($pdo, "SELECT ref_path AS source, path AS target, COUNT(*) AS views
			FROM pageviews WHERE $whereSql AND ref_type = 'internal'
				AND ref_path <> '' AND path <> '' AND ref_path <> path
			GROUP BY ref_path, path ORDER BY views DESC LIMIT 80", $params);
		$transitionSourceTotals = [];
		$transitionTargetTotals = [];
		foreach ($sankeyRows as $transitionRow) {
			$transitionSource = (string)$transitionRow['source'];
			$transitionTarget = (string)$transitionRow['target'];
			$transitionValue = (int)$transitionRow['views'];
			$transitionSourceTotals[$transitionSource] = ($transitionSourceTotals[$transitionSource] ?? 0) + $transitionValue;
			$transitionTargetTotals[$transitionTarget] = ($transitionTargetTotals[$transitionTarget] ?? 0) + $transitionValue;
		}
		arsort($transitionSourceTotals);
		arsort($transitionTargetTotals);
		$transitionSourceSlugs = array_slice(array_keys($transitionSourceTotals), 0, 8);
		$transitionTargetSlugs = array_slice(array_keys($transitionTargetTotals), 0, 8);
		$transitionSources = array_map(static function (string $slug) use ($titles): string {
			return $titles[$slug] ?? $slug;
		}, $transitionSourceSlugs);
		$transitionTargets = array_map(static function (string $slug) use ($titles): string {
			return $titles[$slug] ?? $slug;
		}, $transitionTargetSlugs);
		$transitionSourceIndex = array_flip($transitionSourceSlugs);
		$transitionTargetIndex = array_flip($transitionTargetSlugs);
		$transitionMatrixData = [];
		foreach ($sankeyRows as $transitionRow) {
			$transitionSource = (string)$transitionRow['source'];
			$transitionTarget = (string)$transitionRow['target'];
			if (!isset($transitionSourceIndex[$transitionSource]) || !isset($transitionTargetIndex[$transitionTarget])) {
				continue;
			}
			$transitionMatrixData[] = [$transitionTargetIndex[$transitionTarget], $transitionSourceIndex[$transitionSource], (int)$transitionRow['views']];
		}
		$sankeyNodeMap = [];
		$sankeyAdj = [];
		foreach ($sankeyRows as $sankeyRow) {
			$sankeySource = (string)$sankeyRow['source'];
			$sankeyTarget = (string)$sankeyRow['target'];
			$sankeyValue = (int)$sankeyRow['views'];
			if ($sankeyValue <= 0 || $sankeySource === '' || $sankeyTarget === '' || $sankeySource === $sankeyTarget) {
				continue;
			}
			if (stats_graph_has_path($sankeyAdj, $sankeyTarget, $sankeySource)) {
				$sankeyOmitted++;
				continue;
			}
			$sankeyAdj[$sankeySource][$sankeyTarget] = true;
			$sankeyNodeMap[$sankeySource] = true;
			$sankeyNodeMap[$sankeyTarget] = true;
			$sankeyLinks[] = ['source' => $sankeySource, 'target' => $sankeyTarget, 'value' => $sankeyValue];
		}
		foreach (array_keys($sankeyNodeMap) as $sankeySlug) {
			$sankeyNodes[] = ['name' => $sankeySlug];
		}

		$browsers = stats_all($pdo, "SELECT browser, browser_major,
				COUNT(*) AS views,
				AVG(duration_sec) AS avg_duration,
				SUM(CASE WHEN duration_sec IS NOT NULL AND duration_sec < 10 THEN 1 ELSE 0 END) AS bounces,
				SUM(CASE WHEN duration_sec IS NOT NULL THEN 1 ELSE 0 END) AS known
			FROM pageviews WHERE $whereSql
			GROUP BY browser, browser_major ORDER BY views DESC LIMIT 30", $params);

		$osRows = stats_all($pdo, "SELECT os, os_version,
				COUNT(*) AS views,
				AVG(duration_sec) AS avg_duration,
				SUM(CASE WHEN duration_sec IS NOT NULL AND duration_sec < 10 THEN 1 ELSE 0 END) AS bounces,
				SUM(CASE WHEN duration_sec IS NOT NULL THEN 1 ELSE 0 END) AS known
			FROM pageviews WHERE $whereSql
			GROUP BY os, os_version ORDER BY views DESC LIMIT 30", $params);

		$deviceRows = stats_all($pdo, "SELECT device,
				COUNT(*) AS views,
				AVG(duration_sec) AS avg_duration,
				AVG(scroll_pct) AS avg_scroll,
				SUM(CASE WHEN duration_sec IS NOT NULL AND duration_sec < 10 THEN 1 ELSE 0 END) AS bounces,
				SUM(CASE WHEN duration_sec IS NOT NULL THEN 1 ELSE 0 END) AS known
			FROM pageviews WHERE $whereSql
			GROUP BY device ORDER BY views DESC", $params);

		$sourceCohorts = stats_all($pdo, "SELECT ref_type,
				COUNT(*) AS views,
				AVG(duration_sec) AS avg_duration,
				AVG(scroll_pct) AS avg_scroll,
				SUM(CASE WHEN duration_sec IS NOT NULL AND duration_sec < 10 THEN 1 ELSE 0 END) AS bounces,
				SUM(CASE WHEN duration_sec IS NOT NULL THEN 1 ELSE 0 END) AS known
			FROM pageviews WHERE $whereSql AND ref_type <> 'internal'
			GROUP BY ref_type ORDER BY views DESC", $params);
		$cohortRows = ['source' => [], 'device' => []];
		foreach ($sourceCohorts as $row) {
			$known = (int)($row['known'] ?? 0);
			$cohortRows['source'][] = [
				'label' => mn_analytics_ref_type_label((string)$row['ref_type']),
				'filter_kind' => 'ref_type',
				'filter_value' => (string)$row['ref_type'],
				'views' => (int)$row['views'],
				'duration' => $row['avg_duration'] !== null ? (float)$row['avg_duration'] : null,
				'scroll' => $row['avg_scroll'] !== null ? (float)$row['avg_scroll'] : null,
				'bounce' => $known > 0 ? 100 * (int)$row['bounces'] / $known : null,
			];
		}
		foreach ($deviceRows as $row) {
			$known = (int)($row['known'] ?? 0);
			$cohortRows['device'][] = [
				'label' => stats_device_label((string)$row['device']),
				'filter_kind' => 'device',
				'filter_value' => (string)$row['device'],
				'views' => (int)$row['views'],
				'duration' => $row['avg_duration'] !== null ? (float)$row['avg_duration'] : null,
				'scroll' => $row['avg_scroll'] !== null ? (float)$row['avg_scroll'] : null,
				'bounce' => $known > 0 ? 100 * (int)$row['bounces'] / $known : null,
			];
		}

		$botRules = mn_analytics_bot_rules();
		$botHints = [];
		foreach ($botRules as $rule) {
			$botHints[$rule['label']] = $rule['hint'];
		}
		$botReasons = stats_all($pdo, "SELECT bot_reason,
				COUNT(*) AS views,
				AVG(duration_sec) AS avg_duration
			FROM pageviews WHERE $whereSql AND is_bot = 1
			GROUP BY bot_reason ORDER BY views DESC LIMIT 30", $params);
		foreach ($botReasons as $botRow) {
			$botTotal += (int)$botRow['views'];
		}

		$browserMix = stats_mix_data($browsers, 'stats_browser_label');
		$osMix = stats_mix_data($osRows, 'stats_os_label');
		$deviceMix = stats_mix_data($deviceRows, static function (array $row): string {
			return stats_device_label((string)$row['device']);
		});

		$browserOptions = ['Chrome', 'Safari', 'Firefox', 'Edge', 'Opera', 'Samsung Internet', 'Vivaldi', 'Chromium', 'Brave', 'Internet Explorer', 'Yandex Browser', 'UC Browser', 'MIUI Browser', 'Huawei Browser', 'HeyTap Browser', 'DuckDuckGo', 'QQ Browser', 'Maxthon', 'PaleMoon', 'Waterfox', 'SeaMonkey', 'Falkon', 'Konqueror', 'Epiphany', 'Bot', 'Other', 'Unknown'];
		foreach ($browsers as $row) {
			if ((string)$row['browser'] !== '') {
				$browserOptions[] = (string)$row['browser'];
			}
		}
		$browserOptions = array_values(array_unique($browserOptions));
		sort($browserOptions);

		$osOptions = ['Windows', 'macOS', 'iOS', 'Android', 'Linux', 'ChromeOS', 'Bot', 'Unknown'];
		foreach ($osRows as $row) {
			if ((string)$row['os'] !== '') {
				$osOptions[] = (string)$row['os'];
			}
		}
		$osOptions = array_values(array_unique($osOptions));
		sort($osOptions);

		$bucketRows = stats_all($pdo, "SELECT CASE
				WHEN duration_sec IS NULL THEN 'unknown'
				WHEN duration_sec < 5 THEN '0-4'
				WHEN duration_sec < 10 THEN '5-9'
				WHEN duration_sec < 30 THEN '10-29'
				WHEN duration_sec < 60 THEN '30-59'
				WHEN duration_sec < 120 THEN '1-2m'
				WHEN duration_sec < 300 THEN '2-5m'
				WHEN duration_sec < 600 THEN '5-10m'
				WHEN duration_sec < 1800 THEN '10-30m'
				ELSE '30m+' END AS bucket,
				COUNT(*) AS views
			FROM pageviews WHERE $whereSql GROUP BY bucket", $params);
		$bucketMap = [];
		foreach ($bucketRows as $row) {
			$bucketMap[(string)$row['bucket']] = (int)$row['views'];
		}
		$bucketOrder = [
			'0-4' => '0–4 s',
			'5-9' => '5–9 s',
			'10-29' => '10–29 s',
			'30-59' => '30–59 s',
			'1-2m' => '1–2 min',
			'2-5m' => '2–5 min',
			'5-10m' => '5–10 min',
			'10-30m' => '10–30 min',
			'30m+' => '30 min+',
			'unknown' => 'unknown',
		];
		foreach ($bucketOrder as $key => $label) {
			$bucketData[$key] = ['label' => $label, 'views' => $bucketMap[$key] ?? 0];
			if ($bucketData[$key]['views'] > $bucketMax) {
				$bucketMax = $bucketData[$key]['views'];
			}
		}

		$scrollRows = stats_all($pdo, "SELECT CASE
				WHEN scroll_pct IS NULL THEN 'unknown'
				WHEN scroll_pct < 25 THEN '0-24'
				WHEN scroll_pct < 50 THEN '25-49'
				WHEN scroll_pct < 75 THEN '50-74'
				ELSE '75-100' END AS bucket,
				COUNT(*) AS views
			FROM pageviews WHERE $whereSql GROUP BY bucket", $params);
		$scrollMap = [];
		foreach ($scrollRows as $row) {
			$scrollMap[(string)$row['bucket']] = (int)$row['views'];
		}
		$scrollOrder = [
			'0-24' => '0–24 %',
			'25-49' => '25–49 %',
			'50-74' => '50–74 %',
			'75-100' => '75–100 %',
			'unknown' => 'unknown',
		];
		foreach ($scrollOrder as $key => $label) {
			$viewsForBucket = $scrollMap[$key] ?? 0;
			$scrollBuckets[$key] = ['label' => $label, 'views' => $viewsForBucket];
			if ($viewsForBucket > $scrollBucketMax) {
				$scrollBucketMax = $viewsForBucket;
			}
		}

		$engagementBuckets = [
			['label' => '< 10 s', 'views' => (int)($bucketData['0-4']['views'] ?? 0) + (int)($bucketData['5-9']['views'] ?? 0)],
			['label' => '10–59 s', 'views' => (int)($bucketData['10-29']['views'] ?? 0) + (int)($bucketData['30-59']['views'] ?? 0)],
			['label' => '1–5 min', 'views' => (int)($bucketData['1-2m']['views'] ?? 0) + (int)($bucketData['2-5m']['views'] ?? 0)],
			['label' => '5 min+', 'views' => (int)($bucketData['5-10m']['views'] ?? 0) + (int)($bucketData['10-30m']['views'] ?? 0) + (int)($bucketData['30m+']['views'] ?? 0)],
			['label' => 'unknown', 'views' => (int)($bucketData['unknown']['views'] ?? 0)],
		];
		$engagementMax = 1;
		foreach ($engagementBuckets as $bucket) {
			if ($bucket['views'] > $engagementMax) {
				$engagementMax = $bucket['views'];
			}
		}

		$heatSpan = $range > 0 ? min($range, 28) : 28;
		$heatStart = (new DateTimeImmutable('now', $tz))->setTime(0, 0, 0)->modify('-' . ($heatSpan - 1) . ' days');
		$heatRows = stats_all($pdo, "SELECT day, hour, COUNT(*) AS views FROM pageviews WHERE $whereSql AND ts >= ? GROUP BY day, hour", array_merge($params, [$heatStart->getTimestamp()]));
		$heatMap = [];
		foreach ($heatRows as $row) {
			$d = (string)$row['day'];
			$h = (int)$row['hour'];
			$v = (int)$row['views'];
			$heatMap[$d][$h] = $v;
			if ($v > $heatMax) {
				$heatMax = $v;
			}
		}
		for ($i = 0; $i < $heatSpan; $i++) {
			$d = $heatStart->modify('+' . $i . ' days');
			$key = $d->format('Y-m-d');
			$heatDays[$key] = $heatMap[$key] ?? [];
		}

		for ($h = 0; $h < 24; $h++) {
			$hourProfile[$h] = ['views' => 0, 'entries' => 0];
		}
		$hourRows = stats_all($pdo, "SELECT hour,
				COUNT(*) AS views,
				SUM(CASE WHEN ref_type <> 'internal' THEN 1 ELSE 0 END) AS entries
			FROM pageviews WHERE $whereSql GROUP BY hour", $params);
		foreach ($hourRows as $row) {
			$h = (int)$row['hour'];
			if ($h < 0 || $h > 23) {
				continue;
			}
			$hourProfile[$h] = ['views' => (int)$row['views'], 'entries' => (int)$row['entries']];
			if ((int)$row['views'] > $hourMax) {
				$hourMax = (int)$row['views'];
			}
			if ($peakHour === null || (int)$row['views'] > $peakHourViews) {
				$peakHour = $h;
				$peakHourViews = (int)$row['views'];
				$peakHourEntries = (int)$row['entries'];
			}
		}
		$clockLabels = [];
		$clockViews = [];
		$clockEntries = [];
		for ($h = 0; $h < 24; $h++) {
			$clockLabels[] = sprintf('%02d', $h);
			$clockViews[] = (int)($hourProfile[$h]['views'] ?? 0);
			$clockEntries[] = (int)($hourProfile[$h]['entries'] ?? 0);
		}

		$weekdayProfile = [];
		foreach ($weekdayLabels as $weekdayIndex => $weekdayLabel) {
			$weekdayProfile[$weekdayIndex] = ['views' => 0, 'entries' => 0];
		}
		$weekdayRows = stats_all($pdo, "SELECT strftime('%w', day) AS dow,
				COUNT(*) AS views,
				SUM(CASE WHEN ref_type <> 'internal' THEN 1 ELSE 0 END) AS entries
			FROM pageviews WHERE $whereSql GROUP BY dow", $params);
		foreach ($weekdayRows as $row) {
			$dow = (int)$row['dow'];
			$weekdayIndex = $dow === 0 ? 7 : $dow;
			if (!isset($weekdayProfile[$weekdayIndex])) {
				continue;
			}
			$weekdayProfile[$weekdayIndex] = ['views' => (int)$row['views'], 'entries' => (int)$row['entries']];
			if ((int)$row['views'] > $weekdayMax) {
				$weekdayMax = (int)$row['views'];
			}
			if ($peakWeekdayIndex === null || (int)$row['views'] > $peakWeekdayViews) {
				$peakWeekdayIndex = $weekdayIndex;
				$peakWeekdayViews = (int)$row['views'];
				$peakWeekdayEntries = (int)$row['entries'];
			}
		}

		$weekHourMap = [];
		for ($weekdayIndex = 1; $weekdayIndex <= 7; $weekdayIndex++) {
			$weekHourMap[$weekdayIndex] = array_fill(0, 24, 0);
		}
		$weekHourEntriesMap = [];
		for ($weekdayIndex = 1; $weekdayIndex <= 7; $weekdayIndex++) {
			$weekHourEntriesMap[$weekdayIndex] = array_fill(0, 24, 0);
		}
		$weekHourRows = stats_all($pdo, "SELECT strftime('%w', day) AS dow, hour,
				COUNT(*) AS views,
				SUM(CASE WHEN ref_type <> 'internal' THEN 1 ELSE 0 END) AS entries
			FROM pageviews WHERE $whereSql GROUP BY dow, hour", $params);
		foreach ($weekHourRows as $row) {
			$dow = (int)$row['dow'];
			$weekdayIndex = $dow === 0 ? 7 : $dow;
			$weekHourValue = (int)$row['hour'];
			if (!isset($weekHourMap[$weekdayIndex]) || $weekHourValue < 0 || $weekHourValue > 23) {
				continue;
			}
			$weekHourMap[$weekdayIndex][$weekHourValue] = (int)$row['views'];
			$weekHourEntriesMap[$weekdayIndex][$weekHourValue] = (int)$row['entries'];
			if ((int)$row['views'] > $weekHourMax) {
				$weekHourMax = (int)$row['views'];
			}
			if ((int)$row['entries'] > $weekHourEntriesMax) {
				$weekHourEntriesMax = (int)$row['entries'];
			}
		}

		$insights = [];
		if ($views > 0) {
			$viewsLabel = $views === 1 ? '1 view' : mn_analytics_format_number($views) . ' views';
			$visitsLabel = $entries === 1 ? '1 estimated visit' : mn_analytics_format_number($entries) . ' estimated visits';
			$pagesLabel = $distinctPages === 1 ? '1 page' : mn_analytics_format_number($distinctPages) . ' pages';
			$sourcesLabel = $distinctSources === 1 ? '1 source' : mn_analytics_format_number($distinctSources) . ' sources';
			$activeDaysLabel = $activeDays === 1 ? '1 active day' : mn_analytics_format_number($activeDays) . ' active days';
			$insights[] = 'Audience: ' . $viewsLabel . ' and ' . $visitsLabel . ' across ' . $pagesLabel . ' from ' . $sourcesLabel . '.';
			$insights[] = 'Average activity: ' . number_format($viewsPerDay, 1, '.', ',') . ' views/day and ' . number_format($entriesPerDay, 1, '.', ',') . ' estimated visits/day across ' . $activeDaysLabel . '.';

			$topPage = $topPages[0] ?? null;
			if ($topPage) {
				$topSlug = (string)$topPage['path'];
				$topShare = 100 * (int)$topPage['views'] / $views;
				$insights[] = 'Most viewed: ' . ($titles[$topSlug] ?? $topSlug) . ' — ' . mn_analytics_format_number((int)$topPage['views']) . ' views (' . number_format($topShare, 1, '.', ',') . '%).';
			}

			if ($range > 0 && $prevViews > 0) {
				$delta = 100 * ($views - $prevViews) / $prevViews;
				if ($delta > 0.05) {
					$insights[] = 'Traffic is up ' . number_format($delta, 1, '.', ',') . '% versus the previous period (' . mn_analytics_format_number($prevViews) . ' views).';
				} elseif ($delta < -0.05) {
					$insights[] = 'Traffic is down ' . number_format(abs($delta), 1, '.', ',') . '% versus the previous period (' . mn_analytics_format_number($prevViews) . ' views).';
				} else {
					$insights[] = 'Traffic is flat versus the previous period (' . mn_analytics_format_number($prevViews) . ' views).';
				}
			} elseif ($range > 0) {
				$insights[] = 'Traffic is new: no views in the previous comparable period.';
			}

			if ($peakHour !== null) {
				$insights[] = 'Peak hour: ' . sprintf('%02d:00–%02d:59', $peakHour, $peakHour) . ' — ' . mn_analytics_format_number($peakHourViews) . ' views / ' . mn_analytics_format_number($peakHourEntries) . ' estimated visits.';
			}
			if ($peakWeekdayIndex !== null) {
				$insights[] = 'Peak weekday: ' . $weekdayLabels[$peakWeekdayIndex] . ' — ' . mn_analytics_format_number($peakWeekdayViews) . ' views / ' . mn_analytics_format_number($peakWeekdayEntries) . ' estimated visits.';
			}

			$topRef = $referrers[0] ?? null;
			if ($topRef) {
				$refTypeLabel = mn_analytics_ref_type_label((string)$topRef['ref_type']);
				$refName = trim((string)$topRef['ref_source']);
				if ($refName === '') {
					$refName = $refTypeLabel;
				}
				$refShare = 100 * (int)$topRef['views'] / $views;
				$refSuffix = $refName === $refTypeLabel ? '' : ', ' . $refTypeLabel;
				$insights[] = 'Top source: ' . $refName . ' — ' . mn_analytics_format_number((int)$topRef['views']) . ' views (' . number_format($refShare, 1, '.', ',') . '%' . $refSuffix . ').';
			}

			$bestPage = null;
			$bestDuration = 0.0;
			$worstPage = null;
			$worstBounce = -1.0;
			foreach ($topPages as $page) {
				$knownForPage = (int)($page['known'] ?? 0);
				if ($knownForPage < 5) {
					continue;
				}
				$duration = $page['avg_duration'] !== null ? (float)$page['avg_duration'] : 0.0;
				if ($duration > $bestDuration) {
					$bestDuration = $duration;
					$bestPage = $page;
				}
				$bounce = 100 * (int)$page['bounces'] / $knownForPage;
				if ($bounce > $worstBounce) {
					$worstBounce = $bounce;
					$worstPage = $page;
				}
			}
			if ($bestPage) {
				$slug = (string)$bestPage['path'];
				$insights[] = 'Longest average read: ' . ($titles[$slug] ?? $slug) . ' — ' . mn_analytics_format_duration((int)round($bestDuration)) . ' across ' . mn_analytics_format_number((int)$bestPage['known']) . ' timed views.';
			}
			if ($worstPage && $worstBounce > 0) {
				$slug = (string)$worstPage['path'];
				$insights[] = 'Highest bounce: ' . ($titles[$slug] ?? $slug) . ' — ' . number_format($worstBounce, 1, '.', ',') . '% left before 10 seconds (' . mn_analytics_format_number((int)$worstPage['known']) . ' timed views).';
			}

			$clientParts = [];
			if ($browsers) {
				$label = stats_browser_label($browsers[0]);
				if ($label !== 'Unknown') {
					$clientParts[] = $label;
				}
			}
			if ($osRows) {
				$label = stats_os_label($osRows[0]);
				if ($label !== 'Unknown') {
					$clientParts[] = $label;
				}
			}
			if ($deviceRows) {
				$label = stats_device_label((string)$deviceRows[0]['device']);
				if ($label !== 'Unknown') {
					$clientParts[] = $label;
				}
			}
			if ($clientParts) {
				$insights[] = 'Most common client: ' . implode(' · ', $clientParts) . '.';
			}

			if ($sankeyLinks) {
				$flow = $sankeyLinks[0];
				$from = $titles[$flow['source']] ?? (string)$flow['source'];
				$to = $titles[$flow['target']] ?? (string)$flow['target'];
				$insights[] = 'Strongest internal path: ' . $from . ' → ' . $to . ' (' . mn_analytics_format_number((int)$flow['value']) . ' transitions).';
			}

			if ($scrollKnown > 0) {
				$deep = (int)($scrollBuckets['75-100']['views'] ?? 0);
				$insights[] = 'Deep reads: ' . number_format(100 * $deep / $scrollKnown, 1, '.', ',') . '% of measured visits reached 75–100% scroll depth.';
			}

			if ($bots > 0) {
				$insights[] = 'Bots: ' . mn_analytics_format_number($bots) . ' pageviews (' . number_format(100 * $bots / $views, 1, '.', ',') . '%); click a bot reason in Tech to see the rule.';
			} else {
				$insights[] = 'Bots: none detected in this range.';
			}

			if ($seriesAnomalies) {
				$spikeCount = 0;
				$dipCount = 0;
				foreach ($seriesAnomalies as $anomaly) {
					if ($anomaly['type'] === 'spike') {
						$spikeCount++;
					} else {
						$dipCount++;
					}
				}
				$insights[] = 'Anomalies: ' . $spikeCount . ' spike(s) and ' . $dipCount . ' dip(s) vs the trailing 7-day average; marked on the daily chart.';
			}
		} else {
			$insights[] = 'No views match the selected range and filters yet.';
		}

		$headlineInsights = [];
		if ($views > 0) {
			$headlinePage = $topPages[0] ?? null;
			if ($headlinePage) {
				$headlineSlug = (string)$headlinePage['path'];
				$headlineInsights[] = 'Most read: ' . ($titles[$headlineSlug] ?? $headlineSlug) . ' (' . mn_analytics_format_number((int)$headlinePage['views']) . ' views).';
			}
			$headlineRef = $referrers[0] ?? null;
			if ($headlineRef) {
				$headlineType = mn_analytics_ref_type_label((string)$headlineRef['ref_type']);
				$headlineName = trim((string)$headlineRef['ref_source']);
				if ($headlineName === '') {
					$headlineName = $headlineType;
				}
				$headlineInsights[] = 'Top source: ' . $headlineName . ' (' . mn_analytics_format_number((int)$headlineRef['views']) . ' views).';
			}
			if ($peakHour !== null) {
				$headlineInsights[] = 'Peak hour: ' . sprintf('%02d:00–%02d:59', $peakHour, $peakHour) . ' (' . mn_analytics_format_number($peakHourViews) . ' views / ' . mn_analytics_format_number($peakHourEntries) . ' est. visits).';
			}
		} else {
			$headlineInsights[] = 'No views in the selected range yet.';
		}
		$headlineInsights = array_slice($headlineInsights, 0, 3);

		$pageCount = max(1, (int)ceil($views / $perPage));
		if ($pageNum > $pageCount) {
			$pageNum = $pageCount;
		}
		$offsetRaw = ($pageNum - 1) * $perPage;
		$raw = stats_all($pdo, "SELECT ts, day, hour, path, ref_type, ref_source, ref_host, ref_path,
			        browser, browser_major, os, os_version, device, is_bot, bot_reason,
			        duration_sec, scroll_pct, completed
			FROM pageviews WHERE $whereSql
			ORDER BY ts DESC, id DESC LIMIT $perPage OFFSET $offsetRaw", $params);

		try {
			$feedbackSummaryRow = stats_one($pdo, "SELECT COUNT(*) AS total,
				SUM(CASE WHEN comment <> '' THEN 1 ELSE 0 END) AS with_comment,
				SUM(CASE WHEN reaction = 'bug' THEN 1 ELSE 0 END) AS bugs,
				SUM(CASE WHEN status = 'accepted' THEN 1 ELSE 0 END) AS accepted,
				SUM(CASE WHEN status = 'done' THEN 1 ELSE 0 END) AS done
				FROM block_feedback", []);
			$feedbackSummary = [
				'total' => (int)($feedbackSummaryRow['total'] ?? 0),
				'with_comment' => (int)($feedbackSummaryRow['with_comment'] ?? 0),
				'bugs' => (int)($feedbackSummaryRow['bugs'] ?? 0),
				'accepted' => (int)($feedbackSummaryRow['accepted'] ?? 0),
				'done' => (int)($feedbackSummaryRow['done'] ?? 0),
			];
			$feedbackReactionRows = stats_all($pdo, "SELECT reaction, COUNT(*) AS n FROM block_feedback GROUP BY reaction", []);
			foreach (mn_feedback_reactions() as $key => $meta) {
				$feedbackReactionCounts[$key] = 0;
			}
			foreach ($feedbackReactionRows as $feedbackReactionRow) {
				$key = (string)$feedbackReactionRow['reaction'];
				if (isset($feedbackReactionCounts[$key])) {
					$feedbackReactionCounts[$key] = (int)$feedbackReactionRow['n'];
				}
			}
			$feedbackLatest = stats_all($pdo, "SELECT f.id, f.ts, f.path, f.reaction, f.comment, f.status, s.selected_text
				FROM block_feedback f
				LEFT JOIN feedback_selections s ON s.feedback_id = f.id
				ORDER BY f.ts DESC, f.id DESC LIMIT 8", []);

			$feedbackStart = (new DateTimeImmutable('now', new DateTimeZone('Europe/Berlin')))->setTime(0, 0, 0)->modify('-29 days');
			$feedbackDailyRows = stats_all($pdo, "SELECT day, reaction, COUNT(*) AS n
				FROM block_feedback WHERE day >= ? GROUP BY day, reaction", [$feedbackStart->format('Y-m-d')]);
			$feedbackDailyMap = [];
			foreach ($feedbackDailyRows as $feedbackDailyRow) {
				$feedbackDailyMap[(string)$feedbackDailyRow['day']][(string)$feedbackDailyRow['reaction']] = (int)$feedbackDailyRow['n'];
			}
			$presentationFeedbackDaily = ['labels' => [], 'series' => []];
			foreach (mn_feedback_reactions() as $feedbackKey => $feedbackMeta) {
				$presentationFeedbackDaily['series'][$feedbackKey] = [
					'label' => $feedbackMeta['label'],
					'icon' => $feedbackMeta['icon'],
					'data' => [],
				];
			}
			for ($feedbackIndex = 0; $feedbackIndex < 30; $feedbackIndex++) {
				$feedbackDay = $feedbackStart->modify('+' . $feedbackIndex . ' days');
				$feedbackKey = $feedbackDay->format('Y-m-d');
				$presentationFeedbackDaily['labels'][] = $feedbackDay->format('M j');
				foreach ($presentationFeedbackDaily['series'] as $feedbackSeriesKey => $feedbackSeriesRow) {
					$presentationFeedbackDaily['series'][$feedbackSeriesKey]['data'][] = (int)($feedbackDailyMap[$feedbackKey][$feedbackSeriesKey] ?? 0);
				}
			}

			$presentationFeedbackPages = stats_all($pdo, "SELECT path,
				COUNT(*) AS total,
				SUM(CASE WHEN reaction = 'helpful' THEN 1 ELSE 0 END) AS helpful,
				SUM(CASE WHEN reaction = 'unhelpful' THEN 1 ELSE 0 END) AS unhelpful,
				SUM(CASE WHEN reaction = 'confusing' THEN 1 ELSE 0 END) AS confusing,
				SUM(CASE WHEN reaction = 'bug' THEN 1 ELSE 0 END) AS bug,
				SUM(CASE WHEN comment <> '' THEN 1 ELSE 0 END) AS comments
				FROM block_feedback
				GROUP BY path
				ORDER BY (SUM(CASE WHEN reaction = 'unhelpful' THEN 1 ELSE 0 END) + SUM(CASE WHEN reaction = 'confusing' THEN 1 ELSE 0 END) + SUM(CASE WHEN reaction = 'bug' THEN 1 ELSE 0 END)) DESC, total DESC
				LIMIT 8", []);
			foreach ($presentationFeedbackPages as &$presentationFeedbackPage) {
				$presentationFeedbackPage['title'] = $titles[(string)$presentationFeedbackPage['path']] ?? (string)$presentationFeedbackPage['path'];
				$presentationFeedbackPage['negative'] = (int)$presentationFeedbackPage['unhelpful'] + (int)$presentationFeedbackPage['confusing'] + (int)$presentationFeedbackPage['bug'];
			}
			unset($presentationFeedbackPage);
		} catch (Throwable $e) {
			$feedbackSummary = ['total' => 0, 'with_comment' => 0, 'bugs' => 0, 'accepted' => 0, 'done' => 0];
			$feedbackReactionCounts = [];
			$feedbackLatest = [];
			$presentationFeedbackDaily = ['labels' => [], 'series' => []];
			$presentationFeedbackPages = [];
		}
	}
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex,nofollow,noarchive">
<meta name="color-scheme" content="dark">
<script>window.__MNStatsBase = "__MN_STATS_BASE__";</script>
<title>Blog-Analytics</title>
<link rel="icon" type="image/x-icon" href="favicon.ico">
<style>
:root {
	color-scheme: dark;
	--bg: #0b1220;
	--panel: #111c31;
	--panel2: #16233b;
	--line: #243047;
	--text: #e2e8f0;
	--muted: #94a3b8;
	--dim: #64748b;
	--accent: #e9aa60;
	--accent2: #f4c98a;
	--emerald: #34d399;
	--rose: #fb7185;
	--sky: #38bdf8;
	--radius: 14px;
	--shadow: 0 18px 50px rgba(0,0,0,.28);
}
* { box-sizing: border-box; }
html, body { margin: 0; padding: 0; }
body {
	background:
		radial-gradient(1000px 600px at 12% -10%, rgba(233,170,96,.10), transparent 60%),
		radial-gradient(900px 500px at 100% 0%, rgba(56,189,248,.08), transparent 55%),
		var(--bg);
	color: var(--text);
	font: 14px/1.5 system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
	min-height: 100vh;
}
a { color: var(--sky); text-decoration: none; }
a:hover { text-decoration: underline; }
code { font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; }
.page { max-width: 1240px; margin: 0 auto; padding: 28px 22px 60px; }
.login-page { min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 22px; }
.login-card { width: min(480px, 100%); background: var(--panel); border: 1px solid var(--line); border-radius: 18px; padding: 30px; box-shadow: var(--shadow); }
.login-card h1 { margin: 0 0 6px; font-size: 24px; letter-spacing: -.02em; }
.login-card p { color: var(--muted); margin: 0 0 20px; }
.login-card label { display: block; font-size: 11px; text-transform: uppercase; letter-spacing: .09em; color: var(--muted); margin-bottom: 8px; }
.login-card input[type=password] { width: 100%; padding: 12px 14px; border-radius: 10px; border: 1px solid var(--line); background: var(--bg); color: var(--text); font-size: 16px; }
.login-card button { width: 100%; margin-top: 16px; padding: 12px 14px; border-radius: 10px; border: 0; background: var(--accent); color: #1a1207; font-weight: 700; cursor: pointer; font: inherit; }
.login-card button:hover { background: var(--accent2); }
.login-note { margin-top: 18px; font-size: 12px; color: var(--dim); }
.login-error { margin: 0 0 16px; padding: 10px 12px; border-radius: 10px; border: 1px solid rgba(251,113,133,.4); background: rgba(251,113,133,.1); color: #fecdd3; }
.setup { margin-top: 16px; padding: 14px; border-radius: 10px; border: 1px solid var(--line); background: var(--bg); }
.setup p { margin: 8px 0; }
.setup pre { margin: 8px 0; white-space: pre-wrap; word-break: break-word; }
.setup code { color: var(--accent2); font-size: 12px; line-height: 1.6; }
.top { display: flex; gap: 18px; align-items: flex-start; justify-content: space-between; margin-bottom: 20px; flex-wrap: wrap; }
.top h1 { margin: 0; font-size: 30px; letter-spacing: -.03em; }
.brand { color: inherit; text-decoration: none; }
.brand:hover { color: var(--accent); text-decoration: none; }
.sub { margin: 4px 0 0; color: var(--muted); }
.top-actions { display: flex; gap: 12px; align-items: center; flex-wrap: wrap; }
.admin-nav { display: flex; gap: 6px; overflow-x: auto; margin: 0 0 16px; padding: 0 0 6px; border-bottom: 1px solid var(--line); }
.admin-nav a { flex: none; padding: 7px 12px; border: 1px solid transparent; border-radius: 999px; color: var(--muted); font-size: 12px; font-weight: 600; text-decoration: none; white-space: nowrap; }
.admin-nav a:hover { color: var(--text); background: var(--panel); text-decoration: none; }
.admin-nav a.active { color: #1a1207; background: var(--accent); border-color: transparent; }
body.feedback-view .analytics-alert { display: none !important; }
body.feedback-view .analytics-only-inline { visibility: hidden !important; pointer-events: none; }
.feedback-bridge { margin: 14px 0 0; }
.feedback-bridge .fb-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(100px, 1fr)); gap: 8px; margin: 10px 0 12px; }
.feedback-bridge .fb-stat { padding: 9px 10px; border: 1px solid var(--line); border-radius: 9px; background: var(--panel2); }
.feedback-bridge .fb-stat b { display: block; font-size: 19px; color: var(--text); }
.feedback-bridge .fb-stat span { color: var(--muted); font-size: 10px; text-transform: uppercase; letter-spacing: .05em; }
.feedback-bridge .fb-latest { display: grid; gap: 5px; }
.feedback-bridge .fb-latest a { display: grid; grid-template-columns: 84px minmax(0,1fr) auto; gap: 8px; align-items: baseline; padding: 6px 8px; border-radius: 7px; background: var(--panel2); color: var(--text); text-decoration: none; font-size: 11.5px; }
.feedback-bridge .fb-latest a:hover { background: var(--panel); text-decoration: none; }
.feedback-bridge .fb-latest .when { color: var(--muted); font-size: 10px; }
.feedback-bridge .fb-latest .what { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.feedback-bridge .fb-latest .tag { color: var(--accent); font-size: 10px; font-weight: 700; white-space: nowrap; }
.feedback-embed { margin: 0; }
.feedback-embed { position: relative; }
.feedback-embed iframe { display: block; width: 100%; height: 600px; min-height: 400px; border: 0; border-radius: 12px; background: transparent; opacity: 0; transition: opacity .2s ease; }
.feedback-embed.is-loaded iframe { opacity: 1; }
.feedback-embed-loader { display: flex; align-items: center; justify-content: center; height: 600px; min-height: 400px; border: 1px solid var(--line); border-radius: 12px; background: var(--panel); color: var(--muted); font-size: 12px; }
.feedback-embed.is-loaded .feedback-embed-loader { display: none; }
@keyframes mn-feedback-in { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: none; } }
.feedback-embed.is-loaded { animation: mn-feedback-in .2s ease; }
::view-transition-old(root), ::view-transition-new(root) { animation-duration: .18s; animation-timing-function: ease; }
.inline { display: inline-flex; align-items: center; gap: 8px; margin: 0; }
.switch { display: inline-flex; gap: 8px; align-items: center; color: var(--muted); font-size: 12px; cursor: pointer; }
.btn, button.btn { border: 1px solid var(--line); background: var(--panel); color: var(--text); padding: 8px 12px; border-radius: 9px; cursor: pointer; font: inherit; display: inline-block; }
.btn:hover { border-color: var(--accent); text-decoration: none; }
a:focus-visible, button:focus-visible, input:focus-visible, select:focus-visible, summary:focus-visible {
	outline: 2px solid var(--accent);
	outline-offset: 2px;
}
.btn-primary { background: var(--accent); color: #1a1207; border-color: transparent; font-weight: 700; }
.flash { margin: 0 0 18px; padding: 11px 14px; border-radius: 10px; border: 1px solid var(--line); background: var(--panel); }
.flash.ok { border-color: rgba(52,211,153,.4); background: rgba(52,211,153,.08); color: #bbf7d0; }
.flash.error { border-color: rgba(251,113,133,.4); background: rgba(251,113,133,.08); color: #fecdd3; }
.flash.disabled { border-color: rgba(148,163,184,.4); background: rgba(148,163,184,.08); color: #cbd5e1; }
.toolbar { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; margin: 0 0 16px; }
.ranges { display: flex; gap: 6px; flex-wrap: wrap; background: var(--panel); border: 1px solid var(--line); padding: 5px; border-radius: 11px; }
.ranges a { padding: 7px 11px; border-radius: 8px; color: var(--muted); font-size: 12px; font-weight: 600; }
.ranges a:hover { color: var(--text); background: var(--panel2); text-decoration: none; }
.ranges a.active { background: var(--accent); color: #1a1207; }
.chips { display: flex; gap: 8px; flex-wrap: wrap; margin: 0 0 16px; }
.chip { display: inline-flex; align-items: center; gap: 7px; padding: 6px 10px; border-radius: 999px; background: var(--panel); border: 1px solid var(--line); color: var(--muted); font-size: 12px; }
.chip a { color: var(--rose); font-weight: 700; }
.tabs { display: flex; flex: 1 1 100%; gap: 6px; flex-wrap: wrap; background: var(--panel); border: 1px solid var(--line); padding: 5px; border-radius: 11px; margin: 0; position: sticky; top: 0; z-index: 50; }
.tab { border: 0; background: transparent; color: var(--muted); padding: 8px 12px; border-radius: 8px; cursor: pointer; font: inherit; font-size: 12px; font-weight: 600; }
.tab:hover { color: var(--text); background: var(--panel2); }
.tab.active { background: var(--accent); color: #1a1207; }
[data-tab-group][hidden] { display: none !important; }
[data-tab-group] { scroll-margin-top: 64px; }
.chart.mini { height: 210px; }
.bot-reason { background: none; border: 0; padding: 0; color: var(--accent); font: inherit; cursor: pointer; text-decoration: underline dotted; text-underline-offset: 2px; text-align: left; }
.bot-reason:hover { color: var(--accent2); }
.bot-dialog { max-width: 560px; border: 1px solid var(--line); border-radius: 14px; background: var(--panel); color: var(--text); padding: 20px; box-shadow: var(--shadow); }
.bot-dialog::backdrop { background: rgba(2,6,23,.7); }
.bot-dialog h3 { margin: 0 0 10px; font-size: 17px; }
.bot-dialog p { margin: 0; color: var(--muted); line-height: 1.65; }
.grid-kpi { display: grid; grid-template-columns: repeat(auto-fit, minmax(168px, 1fr)); gap: 12px; margin-bottom: 18px; }
.kpi { background: linear-gradient(180deg, rgba(255,255,255,.025), transparent 70%), var(--panel); border: 1px solid var(--line); border-radius: var(--radius); padding: 15px 16px; min-height: 92px; }
.kpi .k { color: var(--muted); font-size: 11px; text-transform: uppercase; letter-spacing: .09em; }
.kpi .v { font-size: 26px; font-weight: 700; letter-spacing: -.03em; margin-top: 7px; }
.kpi .s { color: var(--dim); font-size: 11px; margin-top: 4px; }
.kpi .v.small { font-size: 18px; line-height: 1.25; letter-spacing: -.02em; }
.rhythm-grid { display: grid; grid-template-columns: minmax(0, 1.5fr) minmax(0, 1fr); gap: 20px; align-items: start; }
.rhythm-facts { display: flex; gap: 16px; flex-wrap: wrap; margin: 0 0 14px; }
.fact { color: var(--muted); font-size: 12px; }
.fact strong { color: var(--text); }
.histogram { display: grid; grid-template-columns: repeat(24, minmax(0, 1fr)); gap: 3px; align-items: end; height: 150px; padding: 8px 0 0; }
.hist-col { display: flex; flex-direction: column; justify-content: flex-end; height: 100%; min-width: 0; }
.hist-pair { display: flex; align-items: flex-end; gap: 1px; width: 100%; height: calc(100% - 14px); }
.hist-bar { width: auto; flex: 1 1 0; min-height: 2px; border-radius: 3px 3px 1px 1px; background: linear-gradient(180deg, var(--accent2), var(--accent)); opacity: .88; transition: opacity .15s ease; }
.hist-bar--visits { background: linear-gradient(180deg, #7dd3fc, var(--sky)); }
.hist-col:hover .hist-bar { opacity: 1; }
.hist-label { height: 14px; line-height: 14px; text-align: center; color: var(--dim); font-size: 8px; white-space: nowrap; overflow: hidden; }
.hist-legend { display: flex; gap: 12px; align-items: center; color: var(--dim); font-size: 10px; margin-top: 6px; }
.weekday-bars { display: grid; gap: 7px; }
.weekday-row { display: grid; grid-template-columns: 34px minmax(0, 1fr) 42px; gap: 8px; align-items: center; }
.weekday-label { color: var(--muted); font-size: 11px; }
.weekday-track { height: 11px; border-radius: 99px; background: var(--bg); border: 1px solid var(--line); overflow: hidden; }
.weekday-fill { height: 100%; border-radius: 99px; background: linear-gradient(90deg, var(--accent), var(--accent2)); min-width: 2px; }
.weekday-num { text-align: right; color: var(--muted); font-size: 11px; font-variant-numeric: tabular-nums; }
.mini-list { display: grid; gap: 2px; }
.mini-row { display: grid; grid-template-columns: minmax(0, 1fr) auto auto; gap: 12px; align-items: center; padding: 8px 6px; border-radius: 8px; color: var(--text); text-decoration: none; border-bottom: 1px solid rgba(36,48,71,.55); }
.mini-row:last-child { border-bottom: 0; }
a.mini-row:hover { background: rgba(255,255,255,.035); text-decoration: none; }
.mini-main { min-width: 0; }
.mini-main .title { display: block; overflow-wrap: anywhere; line-height: 1.35; }
.mini-main .slug { overflow-wrap: anywhere; }
.mini-metric { text-align: right; white-space: nowrap; }
.mini-metric strong { display: block; font-size: 15px; font-variant-numeric: tabular-nums; }
.mini-metric span { display: block; color: var(--dim); font-size: 10px; text-transform: uppercase; letter-spacing: .06em; }
.mini-share { min-width: 48px; text-align: right; color: var(--accent2); font-size: 12px; font-variant-numeric: tabular-nums; white-space: nowrap; }
.mini-list--compact .mini-row { grid-template-columns: minmax(0, 1fr) auto; padding: 5px 6px; }
.audience-block + .audience-block { margin-top: 14px; }
.audience-block .chart-cap { margin-bottom: 5px; }
.rhythm-note { margin-top: 12px; }
.card.insight-card { position: relative; overflow: hidden; background: linear-gradient(135deg, rgba(233,170,96,.16), rgba(56,189,248,.07) 42%, var(--panel) 72%); border-color: rgba(233,170,96,.32); }
.card.insight-card::after { content: ''; position: absolute; right: -40px; bottom: -80px; width: 220px; height: 220px; border-radius: 50%; background: radial-gradient(circle, rgba(233,170,96,.16), transparent 65%); pointer-events: none; }
.insight-head { display: flex; justify-content: space-between; align-items: flex-start; gap: 12px; flex-wrap: wrap; position: relative; z-index: 1; }
.insight-head h2 { margin-bottom: 4px; }
.insight-head .ref { margin: 0; }
.insight-list { list-style: none; margin: 14px 0 0; padding: 0; display: grid; gap: 9px; position: relative; z-index: 1; }
.insight-list li { position: relative; padding-left: 20px; line-height: 1.55; }
.insight-list li::before { content: '◆'; position: absolute; left: 2px; top: 4px; color: var(--accent); font-size: 9px; }
.delta.up { color: var(--emerald); }
.delta.down { color: var(--rose); }
.delta.flat { color: var(--muted); }
.grid-2 { display: grid; grid-template-columns: minmax(0, 1.35fr) minmax(0, 1fr); gap: 16px; margin-bottom: 18px; }
.grid-2even { display: grid; grid-template-columns: repeat(2, minmax(0,1fr)); gap: 16px; margin-bottom: 18px; }
.grid-3 { display: grid; grid-template-columns: repeat(3, minmax(0,1fr)); gap: 16px; margin-bottom: 18px; }
.grid-2 > *, .grid-2even > *, .grid-3 > * { min-width: 0; }
.card { background: var(--panel); border: 1px solid var(--line); border-radius: var(--radius); padding: 16px; min-width: 0; margin-bottom: 16px; }
.card-full { grid-column: 1 / -1; }
.grid-2 .card, .grid-2even .card, .grid-3 .card { margin-bottom: 0; }
tr.zero-row td { color: var(--dim); }
.filter-row { cursor: pointer; }
tbody tr:hover td { background: rgba(255,255,255,.025); }
.good { color: var(--emerald); }
.bad { color: var(--rose); }
.card h2, .card h3 { margin: 0 0 12px; font-size: 14px; letter-spacing: .01em; }
.card h2 .hint, .card h3 .hint { color: var(--dim); font-weight: 400; }
.chart { width: 100%; height: 320px; }
.chart.small { height: 280px; }
.chart-cap { color: var(--dim); font-size: 10.5px; text-transform: uppercase; letter-spacing: .08em; margin-bottom: 6px; }
.spark { color: var(--accent); vertical-align: middle; }
.spark-cell { width: 104px; }
.empty { color: var(--dim); padding: 28px 8px; text-align: center; }
table { width: 100%; border-collapse: collapse; font-size: 12.5px; }
th, td { text-align: left; padding: 8px 8px; border-bottom: 1px solid rgba(36,48,71,.7); vertical-align: top; }
th { color: var(--dim); font-size: 10.5px; text-transform: uppercase; letter-spacing: .08em; font-weight: 600; }
tr:last-child td { border-bottom: 0; }
td.num, th.num { text-align: right; font-variant-numeric: tabular-nums; white-space: nowrap; }
td.path { max-width: 340px; }
td.path .title { color: var(--text); }
td.path .slug, .slug { color: var(--dim); font-size: 11px; }
.ref { color: var(--muted); }
.badge { display: inline-block; padding: 2px 7px; border-radius: 999px; font-size: 10px; font-weight: 700; letter-spacing: .03em; border: 1px solid var(--line); background: var(--panel2); color: var(--muted); }
.badge.direct { color: #cbd5e1; }
.badge.internal { color: var(--sky); border-color: rgba(56,189,248,.35); }
.badge.search { color: var(--emerald); border-color: rgba(52,211,153,.35); }
.badge.social { color: var(--rose); border-color: rgba(251,113,133,.35); }
.badge.external { color: var(--accent); border-color: rgba(233,170,96,.35); }
.badge.ok { color: var(--emerald); border-color: rgba(52,211,153,.35); }
.badge.warn { color: var(--rose); border-color: rgba(251,113,133,.35); }
.bars { display: grid; gap: 8px; }
.bar-row { display: grid; grid-template-columns: 88px minmax(0,1fr) 54px; gap: 10px; align-items: center; }
.bar-label { color: var(--muted); font-size: 11.5px; }
.bar-track { height: 9px; border-radius: 99px; background: var(--bg); overflow: hidden; border: 1px solid var(--line); }
.bar-fill { height: 100%; border-radius: 99px; background: linear-gradient(90deg, var(--accent), var(--accent2)); min-width: 2px; }
.bar-fill--sky { background: linear-gradient(90deg, var(--sky), #7dd3fc); }
.bar-fill--emerald { background: linear-gradient(90deg, var(--emerald), #6ee7b7); }
.bar-num { text-align: right; color: var(--muted); font-variant-numeric: tabular-nums; font-size: 11.5px; }
.heat-wrap { overflow-x: auto; padding-bottom: 4px; }
table.heat { min-width: 800px; table-layout: fixed; }
table.heat th, table.heat td { padding: 2px; border: 1px solid rgba(36,48,71,.55); text-align: center; }
table.heat th { font-size: 9px; color: var(--dim); }
table.heat th:first-child, table.heat td:first-child { width: 82px; }
table.heat td { height: 18px; font-size: 9px; }
table.heat td span { opacity: .85; }
table.heat--compact { min-width: 620px; }
table.heat--compact th:first-child, table.heat--compact td:first-child { width: 40px; }
table.heat--compact td { height: 16px; font-size: 8px; }
.heat-legend { display: flex; align-items: center; gap: 8px; color: var(--dim); font-size: 11px; margin-top: 10px; }
.heat-swatch { width: 14px; height: 10px; border-radius: 2px; border: 1px solid var(--line); }
.heat-cell { cursor: pointer; }
.heat-cell:focus-visible { outline: 2px solid var(--accent); outline-offset: -2px; }
.filters { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 10px; align-items: end; margin: 0 0 14px; }
.filters label { display: grid; gap: 5px; color: var(--dim); font-size: 10.5px; text-transform: uppercase; letter-spacing: .07em; }
.filters input, .filters select { width: 100%; padding: 9px 10px; border-radius: 9px; border: 1px solid var(--line); background: var(--bg); color: var(--text); font: inherit; }
.filters .actions { display: flex; gap: 8px; align-items: center; }
.stats-search { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
.stats-search input[type="search"] { min-width: min(320px, 70vw); padding: 9px 11px; border-radius: 9px; border: 1px solid var(--line); background: var(--bg); color: var(--text); font: inherit; }
.stats-search .search-hint { color: var(--dim); font-size: 11px; }
.search-results .search-group { border-top: 1px solid var(--line); padding-top: 10px; margin-top: 14px; }
.search-results .search-group:first-of-type { border-top: 0; padding-top: 0; }
.search-results summary { cursor: pointer; color: var(--text); font-weight: 600; }
.search-results summary span { color: var(--dim); font-weight: 400; }
.search-list { display: grid; gap: 8px; margin-top: 10px; }
.search-hit { display: flex; gap: 10px; align-items: flex-start; padding: 10px 12px; border: 1px solid var(--line); border-radius: 10px; background: var(--panel2); color: var(--text); text-decoration: none; }
.search-hit:hover { border-color: var(--accent); text-decoration: none; }
.search-hit .badge { flex: 0 0 auto; margin-top: 2px; }
.search-hit-body { display: grid; gap: 2px; min-width: 0; }
.search-hit-title { font-weight: 600; overflow-wrap: anywhere; }
.search-hit-snippet { color: var(--muted); font-size: 12px; overflow-wrap: anywhere; }
.search-hit-meta { color: var(--dim); font-size: 11px; font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; overflow-wrap: anywhere; }
.search-terms { display: flex; gap: 6px; flex-wrap: wrap; margin: 0 0 10px; }
.search-terms .badge { color: var(--accent2); border-color: rgba(244,201,138,.3); }
mark { background: rgba(233,170,96,.32); color: inherit; border-radius: 3px; padding: 0 2px; }
.table-wrap { overflow-x: auto; }
.table-scroll { max-height: 620px; overflow: auto; }
.table-scroll thead th { position: sticky; top: 0; z-index: 1; background: var(--panel); }
.pager { display: flex; gap: 8px; align-items: center; justify-content: flex-end; margin-top: 12px; color: var(--muted); font-size: 12px; flex-wrap: wrap; }
.pager a, .pager span { padding: 6px 10px; border: 1px solid var(--line); border-radius: 8px; background: var(--panel2); color: var(--muted); }
.pager a:hover { color: var(--text); text-decoration: none; border-color: var(--accent); }
.pager .current { color: var(--text); border-color: var(--accent); }
.details { margin: 18px 0; border: 1px solid var(--line); border-radius: var(--radius); background: var(--panel); padding: 14px 16px; }
.details summary { cursor: pointer; color: var(--muted); font-weight: 600; }
.details summary:hover { color: var(--text); }
.details .body { margin-top: 14px; color: var(--muted); font-size: 12.5px; line-height: 1.7; }
.details h3 { color: var(--text); font-size: 13px; margin: 16px 0 6px; }
.details p { margin: 0 0 8px; }
.details ul { margin: 0 0 10px 18px; padding: 0; }
.details li { margin: 2px 0; }
.details code { color: var(--accent2); }
.details pre { white-space: pre-wrap; word-break: break-word; background: var(--bg); border: 1px solid var(--line); border-radius: 9px; padding: 10px 12px; color: var(--accent2); font-size: 11.5px; overflow-x: auto; }
.footer { margin-top: 28px; color: var(--dim); font-size: 11px; text-align: center; }
.mono { font-variant-numeric: tabular-nums; }
[hidden] { display: none !important; }
.card { position: relative; }
.subnav { position: sticky; top: 0; z-index: 40; display: flex; gap: 6px; overflow-x: auto; padding: 6px 0 8px; margin: 0 0 12px; border-bottom: 1px solid var(--line); background: linear-gradient(180deg, var(--bg) 70%, transparent); }
.subnav a { color: var(--muted); font-size: 11px; padding: 4px 8px; border-radius: 999px; white-space: nowrap; text-decoration: none; }
.subnav a:hover, .subnav a.active { color: var(--text); background: var(--panel2); text-decoration: none; }
.subnav a.active { color: var(--accent2); }
.hero { display: grid; grid-template-columns: minmax(0, 1.15fr) minmax(0, .85fr) minmax(0, .9fr) minmax(0, 1.1fr); gap: 16px; align-items: stretch; padding: 20px; margin: 0 0 18px; border: 1px solid rgba(233,170,96,.3); border-radius: 18px; background: radial-gradient(900px 400px at 0% 0%, rgba(233,170,96,.16), transparent 60%), radial-gradient(700px 400px at 100% 100%, rgba(56,189,248,.09), transparent 55%), var(--panel); box-shadow: var(--shadow); position: relative; overflow: hidden; }
.hero::after { content: ''; position: absolute; right: -80px; top: -120px; width: 320px; height: 320px; border-radius: 50%; background: radial-gradient(circle, rgba(233,170,96,.14), transparent 65%); pointer-events: none; }
.hero > * { position: relative; z-index: 1; }
.eyebrow { text-transform: uppercase; letter-spacing: .12em; font-size: 10px; color: var(--dim); }
.hero-number { font-size: 64px; line-height: 1; font-weight: 800; letter-spacing: -.06em; margin: 12px 0 4px; color: var(--accent2); font-variant-numeric: tabular-nums; }
.hero-label { color: var(--muted); font-size: 13px; }
.hero-meta { margin-top: 10px; color: var(--muted); font-size: 12px; line-height: 1.5; }
.hero-secondary { display: grid; gap: 9px; align-content: center; }
.hero-stat { padding: 9px 10px; border-left: 2px solid var(--line); }
.hero-stat .k { display: block; color: var(--dim); font-size: 10px; text-transform: uppercase; letter-spacing: .08em; }
.hero-stat strong { display: block; font-size: 20px; letter-spacing: -.02em; margin-top: 3px; font-variant-numeric: tabular-nums; }
.hero-spark { display: flex; flex-direction: column; justify-content: center; gap: 6px; padding: 12px; border-radius: 12px; background: rgba(0,0,0,.12); }
.hero-spark svg { width: 100%; height: auto; color: var(--accent); }
.hero-brief { padding: 12px 12px 12px 14px; border-left: 1px solid var(--line); }
.hero-brief ul { margin: 10px 0 0; padding-left: 16px; display: grid; gap: 6px; color: var(--text); font-size: 12px; line-height: 1.45; }
.hero-brief li::marker { color: var(--accent); }
.card-head { display: flex; justify-content: space-between; align-items: flex-start; gap: 12px; flex-wrap: wrap; margin-bottom: 10px; padding-right: 56px; }
.card-head h2 { margin: 0; }
.segmented { display: inline-flex; gap: 3px; padding: 3px; border: 1px solid var(--line); border-radius: 9px; background: var(--bg); }
.segmented button { border: 0; background: transparent; color: var(--muted); padding: 5px 8px; border-radius: 6px; font: inherit; font-size: 10.5px; font-weight: 600; cursor: pointer; }
.segmented button:hover { color: var(--text); }
.segmented button.active { background: var(--accent); color: #1a1207; }
.view-pane { min-width: 0; }
.portfolio-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(190px, 1fr)); gap: 10px; }
.portfolio-card { display: block; padding: 12px; border: 1px solid var(--line); border-radius: 12px; background: linear-gradient(180deg, rgba(255,255,255,.025), transparent 70%), var(--panel2); color: var(--text); text-decoration: none; min-width: 0; }
.portfolio-card:hover { border-color: var(--accent); text-decoration: none; }
.portfolio-head { display: flex; justify-content: space-between; gap: 8px; align-items: flex-start; }
.portfolio-head .title { font-weight: 600; line-height: 1.3; overflow-wrap: anywhere; }
.portfolio-number { margin-top: 8px; font-size: 24px; font-weight: 700; letter-spacing: -.03em; }
.portfolio-number span { color: var(--dim); font-size: 11px; font-weight: 400; }
.portfolio-spark { margin: 6px 0; color: var(--accent); }
.portfolio-spark svg { width: 100%; height: auto; }
.portfolio-meta { color: var(--muted); font-size: 11px; }
.portfolio-track { height: 5px; border-radius: 99px; background: var(--bg); overflow: hidden; margin-top: 8px; }
.portfolio-track span { display: block; height: 100%; background: linear-gradient(90deg, var(--accent), var(--accent2)); border-radius: 99px; }
.confidence { display: grid; gap: 8px; margin: 10px 0 14px; }
.conf-row { display: grid; grid-template-columns: 100px minmax(0, 1fr) 46px; gap: 8px; align-items: center; color: var(--muted); font-size: 11px; }
.conf-track { height: 8px; border-radius: 99px; background: var(--bg); border: 1px solid var(--line); overflow: hidden; }
.conf-fill { height: 100%; border-radius: 99px; background: linear-gradient(90deg, var(--accent), var(--accent2)); min-width: 2px; }
.conf-row > span:last-child { text-align: right; font-variant-numeric: tabular-nums; }
.bar-fill--rose { background: linear-gradient(90deg, var(--rose), #fda4af); }
.chart-actions { position: absolute; top: 10px; right: 10px; display: flex; gap: 4px; z-index: 5; }
.chart-export { border: 1px solid var(--line); background: rgba(11,18,32,.65); color: var(--muted); font: inherit; font-size: 9px; letter-spacing: .06em; padding: 3px 5px; border-radius: 5px; cursor: pointer; opacity: 0; transition: opacity .15s ease; }
.card:hover .chart-export, .chart-export:focus-visible { opacity: 1; }
.insight-more summary { cursor: pointer; color: var(--accent2); font-size: 12px; font-weight: 600; margin-top: 10px; }
.insight-more[open] summary { margin-bottom: 10px; }
.present-bar { position: fixed; left: 50%; bottom: 18px; transform: translateX(-50%); z-index: 200; display: flex; gap: 8px; align-items: center; padding: 8px 10px; border: 1px solid var(--line); border-radius: 12px; background: rgba(11,18,32,.94); box-shadow: var(--shadow); color: var(--muted); font-size: 12px; }
.present-bar span { min-width: 170px; text-align: center; color: var(--text); font-weight: 600; }
body.present .subnav, body.present .toolbar, body.present .filters, body.present .chips, body.present .top-actions, body.present .footer, body.present .flash, body.present .details, body.present .chart-actions { display: none !important; }
body.present [data-tab-group]:not([data-tab-group="overview"]) { display: none !important; }
body.present [data-tab-group="overview"][data-slide]:not(.present-current) { display: none !important; }
body.present .page { max-width: none; padding: 22px 34px 70px; }
body.present .top h1 { font-size: 38px; }
body.present .hero-number { font-size: 78px; }
body.present .kpi .v { font-size: 32px; }
body.present .card h2 { font-size: 18px; }
body.present .chart { height: 360px; }
body.present .present-bar { display: flex; }
.humans-toggle.active { background: var(--accent); color: #1a1207; border-color: transparent; font-weight: 700; }
.compare-list { display: grid; gap: 6px; }
.compare-row { display: grid; grid-template-columns: 130px minmax(0, 1fr) 76px; gap: 12px; align-items: center; padding: 7px 8px; border-bottom: 1px solid rgba(36,48,71,.5); }
.compare-row:last-child { border-bottom: 0; }
.compare-form { display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 10px; align-items: end; margin: 0 0 16px; padding: 12px; border: 1px solid var(--line); border-radius: 10px; background: var(--bg); }
.compare-form label { display: grid; gap: 5px; color: var(--dim); font-size: 10.5px; text-transform: uppercase; letter-spacing: .07em; }
.compare-form input, .compare-form select { width: 100%; padding: 8px 9px; border-radius: 8px; border: 1px solid var(--line); background: var(--panel); color: var(--text); font: inherit; }
.compare-form .actions { display: flex; align-items: end; }
.compare-form .btn { width: 100%; }
.compare-head { display: flex; justify-content: space-between; gap: 12px; color: var(--muted); font-size: 11px; margin: 0 0 6px 130px; }
.compare-row--detail { grid-template-columns: 130px minmax(0, 1fr) 160px; }
.compare-bars { display: grid; gap: 3px; }
.compare-bars i { display: block; height: 5px; min-width: 2px; border-radius: 99px; background: linear-gradient(90deg, var(--accent), var(--accent2)); }
.compare-bars i + i { background: linear-gradient(90deg, var(--sky), #7dd3fc); }
.compare-label { color: var(--muted); font-size: 12px; }
.compare-values { display: flex; align-items: baseline; gap: 10px; flex-wrap: wrap; }
.compare-values strong { font-size: 18px; font-variant-numeric: tabular-nums; }
.compare-values span { color: var(--dim); font-size: 11px; }
.compare-delta { text-align: right; font-size: 11px; font-weight: 700; white-space: nowrap; }
.compare-delta.up { color: var(--emerald); }
.compare-delta.down { color: var(--rose); }
.compare-delta.flat { color: var(--muted); }
.health-list { display: grid; grid-template-columns: repeat(auto-fit, minmax(210px, 1fr)); gap: 10px; }
.health-card { display: block; padding: 12px; border: 1px solid var(--line); border-radius: 12px; background: linear-gradient(180deg, rgba(255,255,255,.025), transparent 70%), var(--panel2); color: var(--text); text-decoration: none; min-width: 0; }
.health-card:hover { border-color: var(--accent); text-decoration: none; }
.health-head { display: flex; justify-content: space-between; gap: 8px; align-items: flex-start; }
.health-head .title { font-weight: 600; line-height: 1.3; overflow-wrap: anywhere; }
.health-meta { color: var(--muted); font-size: 10.5px; margin-top: 6px; line-height: 1.45; }
.health-flags { display: flex; gap: 4px; flex-wrap: wrap; margin-top: 6px; }
.health-bars { display: grid; gap: 4px; margin-top: 9px; }
.health-bar { display: grid; grid-template-columns: 62px minmax(0, 1fr) 24px; gap: 6px; align-items: center; color: var(--dim); font-size: 9px; }
.health-track { height: 5px; border-radius: 99px; background: var(--bg); overflow: hidden; }
.health-track i { display: block; height: 100%; background: linear-gradient(90deg, var(--accent), var(--accent2)); border-radius: 99px; }
.health-bar b { text-align: right; color: var(--muted); font-weight: 500; font-variant-numeric: tabular-nums; }
.section-list { display: grid; gap: 8px; }
.section-row { display: grid; grid-template-columns: minmax(0, 1fr) 84px 50px; gap: 10px; align-items: center; }
.section-title { min-width: 0; font-size: 11.5px; line-height: 1.35; overflow-wrap: anywhere; }
.section-index { display: inline-block; min-width: 22px; color: var(--dim); font-size: 9px; letter-spacing: .06em; }
.section-track { height: 9px; border-radius: 99px; background: var(--bg); border: 1px solid var(--line); overflow: hidden; }
.section-track i { display: block; height: 100%; border-radius: 99px; background: linear-gradient(90deg, var(--sky), #7dd3fc); }
.section-num { text-align: right; color: var(--muted); font-size: 10.5px; font-variant-numeric: tabular-nums; }
.section-meta { grid-column: 1 / -1; color: var(--dim); font-size: 9.5px; margin-top: -5px; }
.page-select { max-width: 190px; padding: 5px 7px; border-radius: 8px; border: 1px solid var(--line); background: var(--bg); color: var(--text); font: inherit; font-size: 11px; }
.saved-views { display: inline-flex; gap: 6px; align-items: center; }
.saved-views select { padding: 7px 8px; border-radius: 8px; border: 1px solid var(--line); background: var(--panel); color: var(--text); font: inherit; font-size: 11px; }
.saved-views .btn { padding: 7px 9px; }
.saved-view-row { display: grid; grid-template-columns: minmax(0,1fr) auto auto auto; gap: 6px; align-items: center; margin: 8px 0; }
.saved-view-row input { min-width: 0; padding: 7px 8px; border-radius: 8px; border: 1px solid var(--line); background: var(--bg); color: var(--text); font: inherit; }
.saved-view-row .btn { padding: 7px 8px; }
.overview-switch { display: flex; align-items: center; gap: 6px; margin: 0 0 12px; flex-wrap: wrap; }
.overview-switch .eyebrow { margin-right: 4px; }
.overview-switch button { border: 1px solid var(--line); background: var(--panel); color: var(--muted); border-radius: 999px; padding: 5px 10px; cursor: pointer; font: inherit; font-size: 11px; font-weight: 600; }
.overview-switch button.active { background: var(--accent); color: #1a1207; border-color: transparent; }
.overview-story-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 12px; margin-bottom: 16px; }
.overview-story-card { display: flex; flex-direction: column; min-width: 0; padding: 14px 15px; border: 1px solid var(--line); border-radius: var(--radius); background: linear-gradient(150deg, rgba(233,170,96,.12), rgba(56,189,248,.05) 60%, var(--panel) 100%); color: var(--text); text-decoration: none; transition: border-color .15s ease, transform .15s ease; }
.overview-story-card:hover { border-color: var(--accent); text-decoration: none; transform: translateY(-1px); }
.story-value { font-size: 28px; font-weight: 800; letter-spacing: -.04em; line-height: 1.1; margin: 8px 0 4px; font-variant-numeric: tabular-nums; }
.story-value--text { font-size: 18px; line-height: 1.25; font-weight: 700; letter-spacing: -.01em; }
.story-label { color: var(--muted); font-size: 11px; line-height: 1.45; }
.story-delta { color: var(--muted); font-size: 11px; margin-top: 8px; }
.story-flags { display: flex; gap: 4px; flex-wrap: wrap; margin-top: 8px; }
.story-spark { margin-top: auto; padding-top: 10px; color: var(--accent); }
.story-spark svg { width: 100%; height: auto; }
body.overview-briefing #overview,
body.overview-briefing #attention,
body.overview-briefing #rhythm,
body.overview-briefing #compare,
body.overview-briefing #content,
body.overview-briefing #health,
body.overview-briefing #sections,
body.overview-briefing #movers,
body.overview-briefing #portfolio,
body.overview-briefing #audience,
body.overview-briefing #cohorts,
body.overview-briefing #signals,
body.overview-briefing #calendar,
body.overview-briefing #bot-human,
body.overview-briefing #page-source,
body.overview-briefing #navigation,
body.overview-briefing #quality { display: none !important; }
body.overview-briefing .subnav { display: none !important; }
body.overview-explore #story-cards { display: none !important; }
body.present .overview-switch { display: none !important; }
body.present #overview { display: none !important; }
@media (max-width: 860px) {
	.overview-story-grid { grid-template-columns: 1fr; }
}
body.light {
	color-scheme: light;
	--bg: #f6f1e7;
	--panel: #fffdf8;
	--panel2: #f1eadf;
	--line: #d8cfc0;
	--text: #1e293b;
	--muted: #5b6472;
	--dim: #7b8492;
	--accent: #b7791f;
	--accent2: #d69e2e;
	--emerald: #0f9d6e;
	--rose: #d6455d;
	--sky: #0284c7;
	--shadow: 0 18px 50px rgba(60,50,30,.12);
}
body.light .hero { border-color: rgba(183,121,31,.3); background: radial-gradient(900px 400px at 0% 0%, rgba(233,170,96,.12), transparent 60%), radial-gradient(700px 400px at 100% 100%, rgba(56,189,248,.07), transparent 55%), var(--panel); }
body.light .hero-spark { background: rgba(255,255,255,.55); }
body.light .card.insight-card { background: linear-gradient(135deg, rgba(233,170,96,.12), rgba(56,189,248,.05) 42%, var(--panel) 72%); }
body.light .chart-export { background: rgba(255,253,248,.88); color: var(--muted); }
body.light .present-bar { background: rgba(255,253,248,.96); }
body.light table.heat td, body.light table.heat td span { color: #1e293b !important; }
body.light .login-card, body.light .bot-dialog { box-shadow: var(--shadow); }
@media (max-width: 1000px) {
	.grid-3 { grid-template-columns: 1fr; }
}
@media (max-width: 860px) {
	.grid-2, .grid-2even { grid-template-columns: 1fr; }
	.rhythm-grid { grid-template-columns: 1fr; }
	.chart { height: 280px; }
}
@media (max-width: 1180px) {
	.hero { grid-template-columns: 1fr 1fr; }
	.hero-brief { border-left: 0; border-top: 1px solid var(--line); padding-left: 0; }
}
@media (max-width: 860px) {
	.hero { grid-template-columns: 1fr; }
	.hero-secondary { grid-template-columns: repeat(3, minmax(0,1fr)); }
	.hero-spark { min-height: 90px; }
}
@media (max-width: 560px) {
	.page { padding: 18px 12px 44px; }
	.top h1 { font-size: 24px; }
	.kpi .v { font-size: 22px; }
	.kpi .v.small { font-size: 16px; }
	.bar-row { grid-template-columns: 74px minmax(0,1fr) 44px; }
	.histogram { height: 120px; gap: 2px; }
	.hist-label { font-size: 7px; }
	.mini-row { gap: 8px; }
	.mini-share { min-width: 42px; }
	.hero { padding: 15px; border-radius: 14px; }
	.hero-number { font-size: 46px; }
	.hero-secondary { grid-template-columns: 1fr 1fr; }
	.hero-stat:last-child { grid-column: 1 / -1; }
	.hero-brief ul { font-size: 11px; }
	.conf-row { grid-template-columns: 84px minmax(0,1fr) 42px; }
	.present-bar { left: 10px; right: 10px; bottom: 10px; transform: none; justify-content: center; flex-wrap: wrap; }
	.present-bar span { min-width: 120px; }
	.compare-row--detail { grid-template-columns: 82px minmax(0,1fr) 92px; }
	.compare-head { margin-left: 82px; }
	.compare-values { gap: 5px; }
}
@media (hover: none) {
	.chart-export { opacity: 1; }
}
</style>
<link rel="stylesheet" href="admin_presentation.css?v=<?php echo (int)@filemtime(__DIR__ . '/admin_presentation.css'); ?>">
</head>
<body class="<?php echo $view === 'feedback' ? 'feedback-view' : ''; ?>">
<div class="page<?php echo $authed ? '' : ' login-page'; ?>" id="top">
<?php if (!$authed): ?>
	<div class="login-card">
		<h1><a class="brand" href="index">Blog-Analytics</a></h1>
		<p>Anonymous analytics. Access only with the administrator password.</p>
		<?php if ($loginError !== ''): ?>
			<div class="login-error"><?php echo stats_h($loginError); ?></div>
		<?php endif; ?>
		<?php if ($passwordStatus['ok']): ?>
			<form method="post" action="" autocomplete="off">
				<input type="hidden" name="action" value="login">
				<input type="hidden" name="csrf" value="<?php echo stats_h(stats_csrf()); ?>">
				<label for="password">Password</label>
				<input id="password" name="password" type="password" autocomplete="new-password" autocapitalize="off" autocorrect="off" spellcheck="false" data-lpignore="true" data-1p-ignore="true" data-bwignore="true" autofocus required>
				<button type="submit">Sign in</button>
			</form>
			<p class="login-note">The password is checked server-side; this page does not write it to browser storage. Only technically necessary cookies are used (session, signed admin indicator, optional visit exclusion). No tracking cookies.</p>
		<?php else: ?>
			<div class="setup">
				<strong>Login is not configured yet.</strong>
				<?php if ($passwordStatus['reason'] === 'missing'): ?>
					<p>The file <code><?php echo stats_h($passwordStatus['file']); ?></code> is missing.</p>
				<?php elseif ($passwordStatus['reason'] === 'unreadable'): ?>
					<p>The file <code><?php echo stats_h($passwordStatus['file']); ?></code> exists but is not readable by the web server user <code><?php echo stats_h(stats_web_user()); ?></code>.</p>
				<?php else: ?>
					<p>The file <code><?php echo stats_h($passwordStatus['file']); ?></code> is empty.</p>
				<?php endif; ?>
				<p>Create or repair it (replace the password; use a long, random password):</p>
				<pre><code><?php echo stats_h("sudo sh -c 'printf \"%s\\n\" \"YOUR_PASSWORD\" > /etc/blogpassword && chown root:" . stats_web_user() . " /etc/blogpassword && chmod 640 /etc/blogpassword'"); ?></code></pre>
				<p class="login-note">On this server Apache runs as <code><?php echo stats_h(stats_web_user()); ?></code>. On other servers, adjust the user accordingly.</p>
			</div>
		<?php endif; ?>
	</div>
<?php else: ?>
	<div class="analytics-alert"><?php echo mn_analytics_alert_html(); ?></div>
	<header class="top">
		<div>
			<h1><a class="brand" href="stats">Blog-Analytics</a></h1>
			<p class="sub">Anonymous · no IPs · no visitor cookies · UA read transiently · as of <?php echo stats_h($nowLabel); ?> (Berlin) <?php if ($analyticsKillSwitch): ?><span class="badge" style="margin-left:8px;">analytics disabled</span><?php else: $healthIssues = mn_analytics_health_issues(); $healthOk = $healthIssues === []; ?><span class="badge <?php echo $healthOk ? 'ok' : 'warn'; ?>" style="margin-left:8px;"><?php echo $healthOk ? 'analytics healthy' : count($healthIssues) . ' issue(s)'; ?></span><?php endif; ?></p>
		</div>
		<div class="top-actions">
			<button type="button" class="btn" id="theme-toggle">Light</button>
			<button type="button" class="btn" id="present-toggle">Present</button>
			<form method="post" action="" class="inline">
				<input type="hidden" name="action" value="admin_cookie">
				<input type="hidden" name="csrf" value="<?php echo stats_h(stats_csrf()); ?>">
				<label class="switch"><input type="checkbox" name="exclude_self" value="1"<?php echo $excludeSelf ? ' checked' : ''; ?> onchange="this.form.submit()"> Exclude my own visits</label>
				<noscript><button type="submit" class="btn">Save</button></noscript>
			</form>
			<form method="post" action="" class="inline">
				<input type="hidden" name="action" value="logout">
				<input type="hidden" name="csrf" value="<?php echo stats_h(stats_csrf()); ?>">
				<button type="submit" class="btn">Sign out</button>
			</form>
		</div>
	</header>

	<nav class="admin-nav" aria-label="Admin areas">
		<a class="<?php echo $view === 'analytics' ? 'active' : ''; ?>" href="stats?view=analytics" data-admin-view="analytics">Analytics</a>
		<a class="<?php echo $view === 'feedback' ? 'active' : ''; ?>" href="stats?view=feedback" data-admin-view="feedback">Reader feedback</a>
	</nav>

	<div class="feedback-embed" id="feedback-embed"<?php echo $view === 'feedback' ? '' : ' hidden'; ?>>
		<div class="feedback-embed-loader" aria-live="polite">Loading reader feedback…</div>
		<iframe id="feedback-frame" src="<?php echo $view === 'feedback' ? stats_h($feedbackEmbedUrl) : ''; ?>" data-src="<?php echo stats_h($feedbackEmbedUrl); ?>" title="Reader feedback" loading="lazy"></iframe>
	</div>

	<div id="analytics-view"<?php echo $view === 'feedback' ? ' style="display:none"' : ''; ?>>

	<?php if (is_array($flash)): ?>
		<div class="flash <?php echo stats_h($flash['type'] ?? ''); ?>"><?php echo stats_h($flash['text'] ?? ''); ?></div>
	<?php endif; ?>

	<?php if ($analyticsKillSwitch): ?>
		<div class="flash disabled">
			<strong>Analytics is disabled.</strong> The file <code><?php echo stats_h(mn_analytics_disabled_file()); ?></code> exists. Tracking, health warnings and automatic cleanup are off; existing data stays readable. Delete the file to re-enable.
			<?php if ($analyticsDisabledReason !== ''): ?><div class="slug" style="margin-top: 4px;">Reason: <?php echo stats_h($analyticsDisabledReason); ?></div><?php endif; ?>
		</div>
	<?php endif; ?>

	<?php if ($dbError !== null): ?>
		<div class="card">
			<h2>Database not available</h2>
			<p class="ref"><?php echo $analyticsKillSwitch ? 'Analytics is disabled; the existing database could not be opened.' : 'The database is not available. The red warning above contains the path, cause and repair commands.'; ?></p>
		</div>
	<?php else: ?>
		<div class="toolbar">
			<nav class="ranges" aria-label="Time range">
				<?php foreach ($rangeOptions as $r => $label): ?>
					<a class="<?php echo $range === $r ? 'active' : ''; ?>" href="?<?php echo stats_h(stats_query(['range' => $r, 'page' => 1])); ?>"><?php echo stats_h($label); ?></a>
				<?php endforeach; ?>
			</nav>
			<a class="btn humans-toggle <?php echo $humansOnly ? 'active' : ''; ?>" href="?<?php echo stats_h(stats_query(['humans' => $humansOnly ? '' : '1', 'page' => 1])); ?>" title="Exclude bot pageviews">Humans only</a>
			<div class="saved-views">
				<select id="saved-view-select" aria-label="Saved views">
					<option value="">Saved views…</option>
					<option value="range=7">Last 7 days</option>
					<option value="range=30">Last 30 days</option>
					<option value="device=mobile">Mobile</option>
					<option value="ref_type=search">Search</option>
					<option value="humans=1">Humans only</option>
					<option value="device=bot">Bots</option>
				</select>
				<button type="button" class="btn" id="save-view">Save view</button>
				<button type="button" class="btn" id="manage-views">Manage</button>
			</div>
			<form class="stats-search" method="get" action="" role="search">
				<input type="hidden" name="__proxy_path" value="__MN_STATS_BASE_PATH__">
				<input type="hidden" name="view" value="analytics">
				<input type="hidden" name="range" value="<?php echo (int)$range; ?>">
				<input type="hidden" name="day" value="<?php echo stats_h($day); ?>">
				<input type="hidden" name="weekday" value="<?php echo (int)$weekday; ?>">
				<input type="hidden" name="hour" value="<?php echo $hour >= 0 ? (int)$hour : ''; ?>">
				<input type="hidden" name="humans" value="<?php echo $humansOnly ? '1' : ''; ?>">
				<input type="hidden" name="bot_reason" value="<?php echo stats_h($botReason); ?>">
				<input type="hidden" name="path" value="<?php echo stats_h($path); ?>">
				<input type="hidden" name="ref_type" value="<?php echo stats_h($refType); ?>">
				<input type="hidden" name="source" value="<?php echo stats_h($source); ?>">
				<input type="hidden" name="ref_path" value="<?php echo stats_h($refPath); ?>">
				<input type="hidden" name="browser" value="<?php echo stats_h($browser); ?>">
				<input type="hidden" name="os" value="<?php echo stats_h($os); ?>">
				<input type="hidden" name="device" value="<?php echo stats_h($device); ?>">
				<input type="search" name="q" value="<?php echo stats_h($search); ?>" placeholder="Search everything: page, source, event, feedback…" aria-label="Search all analytics and feedback">
				<button type="submit" class="btn btn-primary">Search</button>
				<?php if ($search !== ''): ?><a class="btn" href="?<?php echo stats_h(stats_query([])); ?>#search-results">Clear</a><?php endif; ?>
				<span class="search-hint">all time · all tabs</span>
			</form>
			<div class="tabs" role="tablist" aria-label="Analytics sections">
				<button type="button" class="tab active" role="tab" aria-selected="true" data-tab="overview">Overview</button>
				<button type="button" class="tab" role="tab" aria-selected="false" data-tab="pages">Pages</button>
				<button type="button" class="tab" role="tab" aria-selected="false" data-tab="compare">Compare</button>
				<button type="button" class="tab" role="tab" aria-selected="false" data-tab="referrers">Referrers &amp; engagement</button>
				<button type="button" class="tab" role="tab" aria-selected="false" data-tab="tech">Tech</button>
				<button type="button" class="tab" role="tab" aria-selected="false" data-tab="storage">Storage</button>
				<button type="button" class="tab" role="tab" aria-selected="false" data-tab="raw">Raw data</button>
				<button type="button" class="tab" role="tab" aria-selected="false" data-tab="privacy">Privacy</button>
			</div>
		</div>

		<?php if ($path !== '' || $refType !== '' || $source !== '' || $refPath !== '' || $browser !== '' || $os !== '' || $device !== '' || $botReason !== '' || $day !== '' || $weekday > 0 || $hour >= 0 || $humansOnly): ?>
			<div class="chips">
				<?php if ($day !== ''): ?>
					<span class="chip">Day: <?php echo stats_h($day); ?> <a href="?<?php echo stats_h(stats_query(['day' => '', 'page' => 1])); ?>" aria-label="Remove day filter">×</a></span>
				<?php endif; ?>
				<?php if ($weekday > 0): ?>
					<span class="chip">Weekday: <?php echo stats_h($weekdayLabels[$weekday] ?? (string)$weekday); ?> <a href="?<?php echo stats_h(stats_query(['weekday' => '', 'page' => 1])); ?>" aria-label="Remove weekday filter">×</a></span>
				<?php endif; ?>
				<?php if ($hour >= 0): ?>
					<span class="chip">Hour: <?php echo stats_h(sprintf('%02d:00–%02d:59', $hour, $hour)); ?> <a href="?<?php echo stats_h(stats_query(['hour' => '', 'page' => 1])); ?>" aria-label="Remove hour filter">×</a></span>
				<?php endif; ?>
				<?php if ($humansOnly): ?>
					<span class="chip">Humans only <a href="?<?php echo stats_h(stats_query(['humans' => '', 'page' => 1])); ?>" aria-label="Include bots again">×</a></span>
				<?php endif; ?>
				<?php if ($botReason !== ''): ?>
					<span class="chip">Bot: <?php echo stats_h($botReason); ?> <a href="?<?php echo stats_h(stats_query(['bot_reason' => '', 'page' => 1])); ?>" aria-label="Remove bot filter">×</a></span>
				<?php endif; ?>
				<?php if ($path !== ''): ?>
					<span class="chip">Page: <?php echo stats_h($titles[$path] ?? $path); ?> <a href="?<?php echo stats_h(stats_query(['path' => '', 'page' => 1])); ?>" aria-label="Remove page filter">×</a></span>
				<?php endif; ?>
				<?php if ($refType !== ''): ?>
					<span class="chip">Type: <?php echo stats_h(mn_analytics_ref_type_label($refType)); ?> <a href="?<?php echo stats_h(stats_query(['ref_type' => '', 'page' => 1])); ?>" aria-label="Remove type filter">×</a></span>
				<?php endif; ?>
				<?php if ($source !== ''): ?>
					<span class="chip">Source: <?php echo stats_h($source); ?> <a href="?<?php echo stats_h(stats_query(['source' => '', 'page' => 1])); ?>" aria-label="Remove source filter">×</a></span>
				<?php endif; ?>
				<?php if ($refPath !== ''): ?>
					<span class="chip">Previous: <?php echo stats_h($titles[$refPath] ?? $refPath); ?> <a href="?<?php echo stats_h(stats_query(['ref_path' => '', 'page' => 1])); ?>" aria-label="Remove previous-page filter">×</a></span>
				<?php endif; ?>
				<?php if ($browser !== ''): ?>
					<span class="chip">Browser: <?php echo stats_h($browser); ?> <a href="?<?php echo stats_h(stats_query(['browser' => '', 'page' => 1])); ?>" aria-label="Remove browser filter">×</a></span>
				<?php endif; ?>
				<?php if ($os !== ''): ?>
					<span class="chip">OS: <?php echo stats_h($os); ?> <a href="?<?php echo stats_h(stats_query(['os' => '', 'page' => 1])); ?>" aria-label="Remove OS filter">×</a></span>
				<?php endif; ?>
				<?php if ($device !== ''): ?>
					<span class="chip">Device: <?php echo stats_h(stats_device_label($device)); ?> <a href="?<?php echo stats_h(stats_query(['device' => '', 'page' => 1])); ?>" aria-label="Remove device filter">×</a></span>
				<?php endif; ?>
				<a class="chip" href="?range=<?php echo (int)$range; ?>" data-reset-filters>Reset all filters</a>
			</div>
		<?php endif; ?>

		<?php if ($search !== ''): ?>
			<div class="card search-results" id="search-results">
				<div class="card-head">
					<h2>Search results <span class="hint">· all stored analytics and feedback, all time</span></h2>
					<a class="btn" href="?<?php echo stats_h(stats_query([])); ?>#search-results">Clear search</a>
				</div>
				<div class="search-terms">
					<?php foreach ($searchTerms as $term): ?><span class="badge"><?php echo stats_h($term); ?></span><?php endforeach; ?>
					<span class="badge <?php echo $searchTotal > 0 ? 'ok' : 'warn'; ?>"><?php echo stats_h(mn_analytics_format_number($searchTotal)); ?> matches</span>
				</div>
				<p class="ref">Separate keywords with spaces — every keyword must match somewhere. Use <code>"quoted phrases"</code> for an exact phrase. The search covers pages and lessons, pageviews, sections, interaction events, reader feedback, selected passages, bug reports and feedback history.</p>
				<?php if ($searchError !== null): ?>
					<div class="empty"><?php echo stats_h($searchError); ?></div>
				<?php elseif ($searchTotal === 0): ?>
					<div class="empty">No stored data matches <?php echo stats_h($search); ?>. Try fewer or broader keywords.</div>
				<?php else: ?>
					<?php foreach ($searchGroups as $group): ?>
						<?php if (empty($group['items']) && (int)$group['total'] <= 0) { continue; } ?>
						<details class="search-group" open>
							<summary><?php echo stats_h($group['label']); ?> <span>· <?php echo stats_h(mn_analytics_format_number((int)$group['total'])); ?> matches, showing <?php echo count($group['items']); ?></span></summary>
							<div class="search-list">
								<?php foreach ($group['items'] as $item): ?>
									<a class="search-hit" href="<?php echo stats_h($item['href']); ?>">
										<span class="badge"><?php echo stats_h($item['badge']); ?></span>
										<span class="search-hit-body">
											<span class="search-hit-title"><?php echo stats_search_mark((string)$item['title'], $searchTerms); ?></span>
											<?php if ((string)$item['snippet'] !== ''): ?><span class="search-hit-snippet"><?php echo stats_search_mark((string)$item['snippet'], $searchTerms); ?></span><?php endif; ?>
											<span class="search-hit-meta"><?php echo stats_search_mark((string)$item['meta'], $searchTerms); ?></span>
										</span>
									</a>
								<?php endforeach; ?>
							</div>
						</details>
					<?php endforeach; ?>
				<?php endif; ?>
			</div>
		<?php endif; ?>

		<form class="filters" method="get" action="">
			<input type="hidden" name="__proxy_path" value="__MN_STATS_BASE_PATH__">
			<input type="hidden" name="range" value="<?php echo (int)$range; ?>">
			<input type="hidden" name="day" value="<?php echo stats_h($day); ?>">
			<input type="hidden" name="weekday" value="<?php echo (int)$weekday; ?>">
			<input type="hidden" name="hour" value="<?php echo $hour >= 0 ? (int)$hour : ''; ?>">
			<input type="hidden" name="humans" value="<?php echo $humansOnly ? '1' : ''; ?>">
			<input type="hidden" name="view" value="<?php echo stats_h((string)($_GET['view'] ?? '')); ?>">
			<label>Page
				<input name="path" list="path-list" value="<?php echo stats_h($path); ?>" placeholder="e.g. history">
			</label>
			<label>Referrer type
				<select name="ref_type">
					<?php foreach (['' => 'All', 'direct' => 'Direct', 'internal' => 'Internal', 'search' => 'Search', 'social' => 'Social', 'external' => 'External'] as $val => $lbl): ?>
						<option value="<?php echo stats_h($val); ?>"<?php echo $refType === $val ? ' selected' : ''; ?>><?php echo stats_h($lbl); ?></option>
					<?php endforeach; ?>
				</select>
			</label>
			<label>Source / host
				<input name="source" list="source-list" value="<?php echo stats_h($source); ?>" placeholder="e.g. Google">
			</label>
			<label>Previous page
				<input name="ref_path" list="path-list" value="<?php echo stats_h($refPath); ?>" placeholder="e.g. intro">
			</label>
			<label>Browser
				<input name="browser" list="browser-list" value="<?php echo stats_h($browser); ?>" placeholder="e.g. Chrome">
			</label>
			<label>Operating system
				<input name="os" list="os-list" value="<?php echo stats_h($os); ?>" placeholder="e.g. Windows">
			</label>
			<label>Device
				<select name="device">
					<?php foreach (['' => 'All', 'desktop' => 'Desktop', 'mobile' => 'Mobile', 'tablet' => 'Tablet', 'bot' => 'Bot', 'unknown' => 'Unknown'] as $val => $lbl): ?>
						<option value="<?php echo stats_h($val); ?>"<?php echo $device === $val ? ' selected' : ''; ?>><?php echo stats_h($lbl); ?></option>
					<?php endforeach; ?>
				</select>
			</label>
			<div class="actions">
				<button type="submit" class="btn btn-primary">Filter</button>
				<a class="btn" href="?range=<?php echo (int)$range; ?>">Reset</a>
			</div>
		</form>
		<datalist id="path-list">
			<?php foreach ($titles as $slug => $title): ?>
				<option value="<?php echo stats_h($slug); ?>"><?php echo stats_h($title); ?></option>
			<?php endforeach; ?>
		</datalist>
		<datalist id="source-list">
			<?php foreach ($sourceOptions as $sourceOption): ?>
				<option value="<?php echo stats_h($sourceOption); ?>"></option>
			<?php endforeach; ?>
		</datalist>
		<datalist id="browser-list">
			<?php foreach ($browserOptions as $browserOption): ?>
				<option value="<?php echo stats_h($browserOption); ?>"></option>
			<?php endforeach; ?>
		</datalist>
		<datalist id="os-list">
			<?php foreach ($osOptions as $osOption): ?>
				<option value="<?php echo stats_h($osOption); ?>"></option>
			<?php endforeach; ?>
		</datalist>

		<nav class="subnav" data-tab-group="overview" data-slide="1" aria-label="Overview sections">
			<a href="#hero">Today</a>
			<a href="#traffic">Traffic</a>
			<a href="#attention">Attention</a>
			<a href="#rhythm">Rhythm</a>
			<a href="#compare">Compare</a>
			<a href="#content">Content</a>
			<a href="#health">Health</a>
			<a href="#sections">Sections</a>
			<a href="#movers">Movers</a>
			<a href="#portfolio">Portfolio</a>
			<a href="#audience">Audience</a>
			<a href="#cohorts">Cohorts</a>
			<a href="#signals">Signals</a>
			<a href="#calendar">Calendar</a>
			<a href="#page-source">Page × source</a>
			<a href="#navigation">Navigation</a>
			<a href="#quality">Quality</a>
		</nav>

		<section class="hero" data-tab-group="overview" data-slide="1" id="hero">
			<div class="hero-primary">
				<div class="eyebrow">Today · <?php echo stats_h($todayLabel); ?></div>
				<div class="hero-number" data-countup="<?php echo (int)$todayEntries; ?>"><?php echo mn_analytics_format_number($todayEntries); ?></div>
				<div class="hero-label">estimated visits</div>
				<div class="hero-meta"><?php echo mn_analytics_format_number($todayViews); ?> views today · <?php echo $todayDeltaHtml; ?></div>
			</div>
			<div class="hero-secondary">
				<div class="hero-stat"><span class="k">Views today</span><strong data-countup="<?php echo (int)$todayViews; ?>"><?php echo mn_analytics_format_number($todayViews); ?></strong><span class="slug">last <?php echo stats_h($todayPrevLabel); ?>: <?php echo mn_analytics_format_number($todayPrevViews); ?></span></div>
				<div class="hero-stat"><span class="k">This hour</span><strong data-countup="<?php echo (int)$heroHourViews; ?>"><?php echo mn_analytics_format_number($heroHourViews); ?></strong><span class="slug"><?php echo stats_h(sprintf('%02d:00', $currentHour)); ?> Berlin</span></div>
				<div class="hero-stat"><span class="k">Last data</span><strong><?php echo stats_h($lastSeenAge); ?></strong><span class="slug"><?php echo $lastSeen !== null ? stats_h(stats_time_label($lastSeen)) : '—'; ?></span></div>
			</div>
			<div class="hero-spark">
				<div class="eyebrow">Last 7 days</div>
				<?php echo $todaySparkline; ?>
				<div class="slug">Estimated visits per day · current filters</div>
			</div>
			<div class="hero-brief">
				<div class="eyebrow">Briefing</div>
				<ul>
					<?php foreach ($headlineInsights as $headline): ?><li><?php echo stats_h($headline); ?></li><?php endforeach; ?>
				</ul>
			</div>
		</section>

		<div class="overview-switch" data-tab-group="overview" data-slide="1">
			<span class="eyebrow">View</span>
			<button type="button" class="active" data-overview-mode="briefing">Briefing</button>
			<button type="button" data-overview-mode="explore">Explore all</button>
		</div>

		<div class="overview-story-grid" id="story-cards" data-tab-group="overview" data-slide="1">
			<a class="overview-story-card" href="#traffic" data-explore-target="traffic">
				<div class="eyebrow">Traffic</div>
				<div class="story-value"><?php echo mn_analytics_format_number($views); ?></div>
				<div class="story-label">views · <?php echo mn_analytics_format_number($entries); ?> estimated visits</div>
				<div class="story-delta"><?php echo $deltaHtml; ?></div>
				<div class="story-spark"><?php echo $todaySparkline; ?></div>
			</a>
			<a class="overview-story-card" href="#content" data-explore-target="content">
				<div class="eyebrow">Content</div>
				<?php if ($storyTop): ?>
					<div class="story-value story-value--text"><?php echo stats_h($titles[$storyTopSlug] ?? $storyTopSlug); ?></div>
					<div class="story-label"><?php echo mn_analytics_format_number((int)$storyTop['views']); ?> views<?php if ($storyHealth && $storyHealth['scroll'] !== null): ?> · <?php echo stats_h(number_format($storyHealth['scroll'], 0, '.', ',')); ?> % scroll<?php endif; ?></div>
					<?php if ($storyHealth && $storyHealth['flags']): ?><div class="story-flags"><?php foreach ($storyHealth['flags'] as $flag): ?><span class="badge warn"><?php echo stats_h($flag); ?></span><?php endforeach; ?></div><?php endif; ?>
				<?php else: ?>
					<div class="story-value story-value--text">No data yet</div>
					<div class="story-label">Share the blog to fill this card.</div>
				<?php endif; ?>
			</a>
			<a class="overview-story-card" href="#quality" data-explore-target="quality">
				<div class="eyebrow">Quality</div>
				<div class="story-value"><?php echo stats_h(number_format($knownPct, 1, '.', ',')); ?> %</div>
				<div class="story-label">duration known · <?php echo stats_h(number_format($confidenceScroll, 1, '.', ',')); ?> % scroll known</div>
				<div class="story-delta"><?php echo mn_analytics_format_number($bots); ?> bots · last data <?php echo stats_h($lastSeenAge); ?></div>
			</a>
		</div>

		<?php if ($feedbackSummary['total'] > 0): ?>
		<div class="card feedback-bridge" data-tab-group="overview" data-slide="1">
			<div style="display:flex;align-items:baseline;justify-content:space-between;gap:10px;flex-wrap:wrap;">
				<div><h2 style="margin:0">Reader feedback</h2><p class="ref" style="margin:3px 0 0;">What readers flag in the lessons — comments, insights, confusion and bugs.</p></div>
				<a class="btn" href="stats?view=feedback">Open feedback dashboard →</a>
			</div>
			<div class="fb-grid">
				<div class="fb-stat"><b><?php echo stats_h(number_format($feedbackSummary['total'])); ?></b><span>Total</span></div>
				<div class="fb-stat"><b><?php echo stats_h(number_format($feedbackSummary['with_comment'])); ?></b><span>Comments</span></div>
				<div class="fb-stat"><b><?php echo stats_h(number_format($feedbackSummary['bugs'])); ?></b><span>Bugs</span></div>
				<div class="fb-stat"><b><?php echo stats_h(number_format($feedbackSummary['accepted'])); ?></b><span>Accepted</span></div>
				<div class="fb-stat"><b><?php echo stats_h(number_format($feedbackSummary['done'])); ?></b><span>Done</span></div>
				<?php foreach (mn_feedback_reactions() as $fbKey => $fbMeta): ?>
					<div class="fb-stat"><b><?php echo stats_h(number_format($feedbackReactionCounts[$fbKey] ?? 0)); ?></b><span><?php echo stats_h($fbMeta['icon'] . ' ' . $fbMeta['label']); ?></span></div>
				<?php endforeach; ?>
			</div>
			<?php if ($feedbackLatest): ?>
			<div class="fb-latest">
				<?php foreach ($feedbackLatest as $fbItem): $fbRead = trim((string)($fbItem['comment'] ?? '')); if ($fbRead === '') { $fbRead = trim((string)($fbItem['selected_text'] ?? '')); } ?>
					<?php $fbUrl = 'stats?view=feedback&' . http_build_query(['tab' => 'all', 'path' => $fbItem['path'], 'open' => (int)$fbItem['id'], 'range' => 0, 'page' => 1, 'status' => '']); ?>
					<a href="<?php echo stats_h($fbUrl); ?>">
						<span class="when"><?php echo stats_h(stats_time_label((int)$fbItem['ts'])); ?></span>
						<span class="what"><?php echo stats_h($titles[$fbItem['path']] ?? $fbItem['path']); ?><?php if ($fbRead !== ''): ?> — <?php echo stats_h(mb_substr(preg_replace('/\s+/u', ' ', $fbRead) ?? $fbRead, 0, 90, 'UTF-8')); ?><?php endif; ?></span>
						<span class="tag"><?php echo stats_h(mn_feedback_reactions()[$fbItem['reaction']]['icon'] ?? ''); ?></span>
					</a>
				<?php endforeach; ?>
			</div>
			<?php endif; ?>
		</div>
		<?php endif; ?>

		<div class="grid-kpi" id="overview" data-tab-group="overview" data-slide="1">
			<div class="kpi">
				<div class="k">Views</div>
				<div class="v" data-countup="<?php echo (int)$views; ?>"><?php echo mn_analytics_format_number($views); ?></div>
				<div class="s"><?php echo $deltaHtml; ?></div>
			</div>
			<div class="kpi">
				<div class="k">Views / day</div>
				<div class="v" data-countup="<?php echo stats_h(number_format($viewsPerDay, 3, '.', '')); ?>" data-decimals="1"><?php echo stats_h(number_format($viewsPerDay, 1, '.', ',')); ?></div>
				<div class="s"><?php echo $activeDays === 1 ? '1 active day' : mn_analytics_format_number($activeDays) . ' active days'; ?> · <?php echo mn_analytics_format_number($periodDays); ?> days in range</div>
			</div>
			<div class="kpi">
				<div class="k">Estimated visits</div>
				<div class="v" data-countup="<?php echo (int)$entries; ?>"><?php echo mn_analytics_format_number($entries); ?></div>
				<div class="s"><?php echo stats_h(number_format($entriesPerDay, 1, '.', ',')); ?> / day · <?php echo stats_h(number_format($entryShare, 1, '.', ',')); ?> % of views</div>
			</div>
			<div class="kpi">
				<div class="k">Avg. time on page</div>
				<div class="v"><?php echo stats_h(mn_analytics_format_duration($avgDuration !== null ? (int)round($avgDuration) : null)); ?></div>
				<div class="s">Median <?php echo stats_h(mn_analytics_format_duration($medianDuration)); ?></div>
			</div>
			<div class="kpi">
				<div class="k">Bounce &lt; 10 s</div>
				<div class="v <?php echo $known > 0 ? stats_bounce_class($bounceRate) : ''; ?>"><?php echo stats_h(number_format($bounceRate, 1, '.', ',')); ?> %</div>
				<div class="s"><?php echo mn_analytics_format_number($bounces); ?> of <?php echo mn_analytics_format_number($known); ?> with duration</div>
			</div>
			<div class="kpi">
				<div class="k">Avg. scroll depth</div>
				<div class="v"><?php echo $avgScroll !== null ? stats_h(number_format($avgScroll, 0, '.', ',')) . ' %' : '—'; ?></div>
				<div class="s"><?php echo mn_analytics_format_number($scrollKnown); ?> measurements</div>
			</div>
			<div class="kpi">
				<div class="k">Peak hour</div>
				<div class="v"><?php echo $peakHour !== null ? stats_h(sprintf('%02d:00', $peakHour)) : '—'; ?></div>
				<div class="s"><?php echo mn_analytics_format_number($peakHourViews); ?> views · <?php echo mn_analytics_format_number($peakHourEntries); ?> est. visits</div>
			</div>
			<div class="kpi">
				<div class="k">Peak day</div>
				<div class="v small"><?php echo stats_h($peakDayLabel); ?></div>
				<div class="s"><?php echo mn_analytics_format_number($peakDayViews); ?> views</div>
			</div>
			<div class="kpi">
				<div class="k">Pages / sources</div>
				<div class="v"><?php echo mn_analytics_format_number($distinctPages); ?> / <?php echo mn_analytics_format_number($distinctSources); ?></div>
				<div class="s"><?php echo mn_analytics_format_number($internal); ?> internal navigations</div>
			</div>
		</div>
		<div class="card insight-card" data-tab-group="overview" data-slide="1" id="briefing">
			<div class="insight-head">
				<div>
					<h2>Full briefing <span class="hint">· <?php echo count($insights); ?> insights</span></h2>
					<p class="ref">The three headline items sit in the hero; open this for the complete briefing.</p>
				</div>
				<button type="button" class="btn" id="copy-insights">Copy summary</button>
			</div>
			<details class="insight-more">
				<summary>Show all <?php echo count($insights); ?> insights</summary>
				<ul class="insight-list">
					<?php foreach ($insights as $insight): ?>
						<li><?php echo stats_h($insight); ?></li>
					<?php endforeach; ?>
				</ul>
			</details>
		</div>

		<div class="grid-2" data-tab-group="overview" data-slide="1" id="traffic">
			<div class="card">
				<h2>Views over time <span class="hint">· <?php echo stats_h($rangeLabel); ?></span></h2>
				<?php if ($views > 0): ?>
					<div id="chart-daily" class="chart" role="img" aria-label="Daily views and estimated visits chart"></div>
				<?php else: ?>
					<div class="empty">No data in the selected period.</div>
				<?php endif; ?>
			</div>
			<div class="card">
				<h2>Traffic clock <span class="hint">· all days, Berlin time</span></h2>
				<?php if ($views > 0): ?>
					<div id="chart-clock" class="chart" role="img" aria-label="Traffic by hour of day"></div>
				<?php else: ?>
					<div class="empty">No data.</div>
				<?php endif; ?>
			</div>
		</div>


		<div class="grid-2" data-tab-group="overview" data-slide="2" id="attention">
			<div class="card">
				<h2>Page attention matrix <span class="hint">· read or skim?</span></h2>
				<?php if ($attentionData): ?>
					<p class="ref" style="margin: -4px 0 8px;">Each bubble is a page: x = average time, y = average scroll depth, size = views. Click a bubble to filter the dashboard.</p>
					<div id="chart-attention" class="chart" role="img" aria-label="Page attention scatter plot"></div>
				<?php else: ?>
					<div class="empty">No pages with measured duration and scroll depth in this range.</div>
				<?php endif; ?>
			</div>
			<div class="card">
				<h2>Reading funnel <span class="hint">· pageviews, not people</span></h2>
				<?php if ($funnelData && (int)$funnelData[0]['value'] > 0): ?>
					<p class="ref" style="margin: -4px 0 8px;">How many pageviews reach 10 seconds and meaningful scroll depth. Each step is stricter than the one above.</p>
					<div id="chart-funnel" class="chart" role="img" aria-label="Reading funnel"></div>
				<?php else: ?>
					<div class="empty">No data in the selected period.</div>
				<?php endif; ?>
			</div>
		</div>

		<div class="card" data-tab-group="overview" data-slide="1" id="rhythm">
			<h2>Traffic rhythm <span class="hint">· Berlin time, <?php echo stats_h($rangeLabel); ?></span></h2>
			<?php if ($views > 0): ?>
				<div class="rhythm-facts">
					<span class="fact"><strong>Peak hour</strong> <?php echo $peakHour !== null ? stats_h(sprintf('%02d:00–%02d:59', $peakHour, $peakHour)) : '—'; ?> · <?php echo mn_analytics_format_number($peakHourViews); ?> views / <?php echo mn_analytics_format_number($peakHourEntries); ?> est. visits</span>
					<span class="fact"><strong>Peak day</strong> <?php echo stats_h($peakDayLabel); ?> · <?php echo mn_analytics_format_number($peakDayViews); ?> views</span>
					<span class="fact"><strong>Active</strong> <?php echo mn_analytics_format_number($activeDays); ?> of <?php echo mn_analytics_format_number($periodDays); ?> days</span>
				</div>
				<div class="rhythm-grid">
					<div>
						<div class="chart-cap">Pageviews by hour <span class="hint">· all days · hover for estimated visits</span></div>
						<div class="histogram" role="img" aria-label="Pageviews and estimated visits by hour of day, Berlin time">
							<?php foreach ($hourProfile as $h => $row): $w = $hourMax > 0 ? max(2, 100 * (int)$row['views'] / $hourMax) : 2; ?>
								<?php $entriesPct = $hourMax > 0 && (int)$row['entries'] > 0 ? max(2, 100 * (int)$row['entries'] / $hourMax) : 0; ?>
								<div class="hist-col" title="<?php echo stats_h(sprintf('%02d:00–%02d:59', $h, $h) . ' — ' . mn_analytics_format_number((int)$row['views']) . ' views / ' . mn_analytics_format_number((int)$row['entries']) . ' estimated visits'); ?>">
									<div class="hist-pair">
										<div class="hist-bar" style="height: <?php echo stats_h(number_format($w, 1, '.', '')); ?>%"></div>
										<div class="hist-bar hist-bar--visits" style="height: <?php echo stats_h(number_format($entriesPct, 1, '.', '')); ?>%; min-height: 0;"></div>
									</div>
									<div class="hist-label"><?php echo $h % 3 === 0 ? stats_h(sprintf('%02d', $h)) : ''; ?></div>
								</div>
							<?php endforeach; ?>
						</div>
						<div class="hist-legend"><span class="heat-swatch" style="background: linear-gradient(180deg, var(--accent2), var(--accent));"></span> Views <span class="heat-swatch" style="background: linear-gradient(180deg, #7dd3fc, var(--sky));"></span> Estimated visits</div>
					</div>
					<div>
						<div class="chart-cap">Pageviews by weekday <span class="hint">· all days</span></div>
						<div class="weekday-bars" role="img" aria-label="Pageviews and estimated visits by weekday">
							<?php foreach ($weekdayLabels as $weekdayIndex => $weekdayLabel): $row = $weekdayProfile[$weekdayIndex] ?? ['views' => 0, 'entries' => 0]; $w = $weekdayMax > 0 ? max(2, 100 * (int)$row['views'] / $weekdayMax) : 0; ?>
								<div class="weekday-row" title="<?php echo stats_h($weekdayLabel . ' — ' . mn_analytics_format_number((int)$row['views']) . ' views / ' . mn_analytics_format_number((int)$row['entries']) . ' estimated visits'); ?>">
									<div class="weekday-label"><?php echo stats_h($weekdayLabel); ?></div>
									<div class="weekday-track"><div class="weekday-fill" style="width: <?php echo stats_h(number_format($w, 1, '.', '')); ?>%"></div></div>
									<div class="weekday-num"><?php echo mn_analytics_format_number((int)$row['views']); ?></div>
								</div>
							<?php endforeach; ?>
						</div>
					</div>
				</div>
				<div class="card-head" style="margin-top: 16px;">
					<div class="chart-cap" style="margin: 0;">Weekday × hour <span class="hint">· all days · intensity = selected metric</span></div>
					<div class="segmented" data-heatmap-toggle="weekhour">
						<button type="button" class="active" data-heatmap-view="views">Views</button>
						<button type="button" data-heatmap-view="entries">Estimated visits</button>
					</div>
				</div>
				<div class="view-pane" data-heatmap-pane="weekhour" data-heatmap-view="views">
					<div class="heat-wrap">
						<table class="heat heat--compact" aria-label="Pageviews by weekday and hour, Berlin time">
							<thead>
								<tr>
									<th></th>
									<?php for ($h = 0; $h < 24; $h++): ?><th><?php echo str_pad((string)$h, 2, '0', STR_PAD_LEFT); ?></th><?php endfor; ?>
								</tr>
							</thead>
							<tbody>
							<?php foreach ($weekdayLabels as $weekdayIndex => $weekdayLabel): ?>
								<tr>
									<th><?php echo stats_h($weekdayLabel); ?></th>
									<?php for ($h = 0; $h < 24; $h++): $c = (int)($weekHourMap[$weekdayIndex][$h] ?? 0); $alpha = $weekHourMax > 0 ? 0.05 + 0.95 * ($c / $weekHourMax) : 0.05; $bg = 'rgba(233,170,96,' . number_format($alpha, 3, '.', '') . ')'; $txt = $c === 0 ? 'transparent' : ($alpha > 0.6 ? '#0b1220' : 'rgba(226,232,240,.9)'); ?>
										<td class="heat-cell" data-weekday="<?php echo (int)$weekdayIndex; ?>" data-hour="<?php echo (int)$h; ?>" role="button" tabindex="0" style="background: <?php echo stats_h($bg); ?>; color: <?php echo stats_h($txt); ?>;" title="<?php echo stats_h($weekdayLabel . ' ' . str_pad((string)$h, 2, '0', STR_PAD_LEFT) . ':00 — ' . $c . ' views · click to filter'); ?>"><span><?php echo $c; ?></span></td>
									<?php endfor; ?>
								</tr>
							<?php endforeach; ?>
							</tbody>
						</table>
					</div>
					<div class="heat-legend">
						<span class="heat-swatch" style="background: rgba(233,170,96,0.05)"></span> 0
						<span class="heat-swatch" style="background: rgba(233,170,96,0.55)"></span> <?php echo mn_analytics_format_number((int)ceil($weekHourMax / 2)); ?>
						<span class="heat-swatch" style="background: rgba(233,170,96,1)"></span> <?php echo mn_analytics_format_number($weekHourMax); ?>
					</div>
				</div>
				<div class="view-pane" data-heatmap-pane="weekhour" data-heatmap-view="entries" hidden>
					<div class="heat-wrap">
						<table class="heat heat--compact" aria-label="Estimated visits by weekday and hour, Berlin time">
							<thead>
								<tr>
									<th></th>
									<?php for ($h = 0; $h < 24; $h++): ?><th><?php echo str_pad((string)$h, 2, '0', STR_PAD_LEFT); ?></th><?php endfor; ?>
								</tr>
							</thead>
							<tbody>
							<?php foreach ($weekdayLabels as $weekdayIndex => $weekdayLabel): ?>
								<tr>
									<th><?php echo stats_h($weekdayLabel); ?></th>
									<?php for ($h = 0; $h < 24; $h++): $c = (int)($weekHourEntriesMap[$weekdayIndex][$h] ?? 0); $alpha = $weekHourEntriesMax > 0 ? 0.05 + 0.95 * ($c / $weekHourEntriesMax) : 0.05; $bg = 'rgba(56,189,248,' . number_format($alpha, 3, '.', '') . ')'; $txt = $c === 0 ? 'transparent' : ($alpha > 0.6 ? '#0b1220' : 'rgba(226,232,240,.9)'); ?>
										<td class="heat-cell" data-weekday="<?php echo (int)$weekdayIndex; ?>" data-hour="<?php echo (int)$h; ?>" role="button" tabindex="0" style="background: <?php echo stats_h($bg); ?>; color: <?php echo stats_h($txt); ?>;" title="<?php echo stats_h($weekdayLabel . ' ' . str_pad((string)$h, 2, '0', STR_PAD_LEFT) . ':00 — ' . $c . ' estimated visits · click to filter'); ?>"><span><?php echo $c; ?></span></td>
									<?php endfor; ?>
								</tr>
							<?php endforeach; ?>
							</tbody>
						</table>
					</div>
					<div class="heat-legend">
						<span class="heat-swatch" style="background: rgba(56,189,248,0.05)"></span> 0
						<span class="heat-swatch" style="background: rgba(56,189,248,0.55)"></span> <?php echo mn_analytics_format_number((int)ceil($weekHourEntriesMax / 2)); ?>
						<span class="heat-swatch" style="background: rgba(56,189,248,1)"></span> <?php echo mn_analytics_format_number($weekHourEntriesMax); ?>
					</div>
				</div>

				<p class="ref rhythm-note">Bars and heatmap are totals across the selected range; the full date × hour heatmap is in Referrers &amp; engagement. <strong>Estimated visits</strong> count entry pageviews (non-internal referrers) and are the privacy-safe proxy for visits. Unique visitors, sessions and returning visitors are intentionally not available because they would require a persistent identifier.</p>
			<?php else: ?>
				<div class="empty">No data in the selected period.</div>
			<?php endif; ?>
		</div>

		<div class="card" data-tab-group="overview" data-slide="1" id="compare">
			<h2>Period comparison <span class="hint">· current vs previous</span></h2>
			<?php if ($comparisonRows): ?>
				<div class="compare-list">
					<?php foreach ($comparisonRows as $row): $kind = (string)$row['kind']; $current = $row['current']; $previous = $row['previous']; $delta = null; if (is_numeric($current) && is_numeric($previous) && (float)$previous != 0.0) { $delta = 100 * ((float)$current - (float)$previous) / (float)$previous; } $fmt = static function ($value) use ($kind): string { if ($value === null) { return '—'; } if ($kind === 'duration') { return mn_analytics_format_duration((int)round((float)$value)); } if ($kind === 'percent') { return number_format((float)$value, 1, '.', ',') . ' %'; } return mn_analytics_format_number((int)$value); }; $deltaClass = $delta === null ? 'flat' : ($delta > 0.05 ? 'up' : ($delta < -0.05 ? 'down' : 'flat')); ?>
						<div class="compare-row">
							<div class="compare-label"><?php echo stats_h($row['label']); ?></div>
							<div class="compare-values"><strong><?php echo stats_h($fmt($current)); ?></strong><span>prev. <?php echo stats_h($fmt($previous)); ?></span></div>
							<div class="compare-delta <?php echo stats_h($deltaClass); ?>"><?php echo $delta === null ? 'new' : ($delta > 0 ? '+' : '') . stats_h(number_format($delta, 1, '.', ',')) . ' %'; ?></div>
						</div>
					<?php endforeach; ?>
				</div>
				<p class="ref" style="margin-bottom: 0;">Same filters and previous equal-length period. Range “All” has no previous period.</p>
			<?php else: ?>
				<div class="ref">Choose a finite range (7, 30, 90 or 365 days) to compare against the previous period.</div>
			<?php endif; ?>
		</div>

		<div class="grid-2even" data-tab-group="overview" data-slide="2" id="content">
			<div class="card">
				<div class="card-head">
					<h2>Top content <span class="hint">· top 12</span></h2>
					<div class="segmented" data-view-toggle="content-view">
						<button type="button" class="active" data-view="treemap">Treemap</button>
						<button type="button" data-view="list">List</button>
					</div>
				</div>
				<div class="view-pane" data-view-pane="content-view" data-view="treemap">
					<?php if ($contentTreemap): ?>
						<div id="chart-content-treemap" class="chart small" role="img" aria-label="Top content treemap"></div>
					<?php else: ?>
						<div class="empty">No data in the selected period.</div>
					<?php endif; ?>
				</div>
				<div class="view-pane" data-view-pane="content-view" data-view="list" hidden>
					<?php if ($topPages): ?>
						<div class="mini-list">
							<?php foreach (array_slice($topPages, 0, 5) as $page): $pv = (int)$page['views']; $share = $views > 0 ? 100 * $pv / $views : 0; $pageSlug = (string)$page['path']; $pageDuration = $page['avg_duration'] !== null ? (int)round((float)$page['avg_duration']) : null; ?>
								<a class="mini-row" href="?<?php echo stats_h(stats_query(['path' => $pageSlug, 'page' => 1])); ?>">
									<div class="mini-main">
										<span class="title"><?php echo stats_h($titles[$pageSlug] ?? $pageSlug); ?></span>
										<div class="slug"><?php echo stats_h($pageSlug); ?> · <?php echo stats_h(mn_analytics_format_duration($pageDuration)); ?> avg.</div>
									</div>
									<div class="mini-metric"><strong><?php echo mn_analytics_format_number($pv); ?></strong><span>views</span></div>
									<div class="mini-share"><?php echo stats_h(number_format($share, 1, '.', ',')); ?> %</div>
								</a>
							<?php endforeach; ?>
						</div>
					<?php else: ?>
						<div class="empty">No data in the selected period.</div>
					<?php endif; ?>
				</div>
				<?php if ($entryPages): ?>
					<div class="chart-cap" style="margin-top: 14px;">Most common entry pages</div>
					<div class="mini-list mini-list--compact">
						<?php foreach ($entryPages as $entry): $entrySlug = (string)$entry['path']; ?>
							<a class="mini-row" href="?<?php echo stats_h(stats_query(['path' => $entrySlug, 'page' => 1])); ?>">
								<div class="mini-main"><span class="title"><?php echo stats_h($titles[$entrySlug] ?? $entrySlug); ?></span></div>
								<div class="mini-metric"><strong><?php echo mn_analytics_format_number((int)$entry['entries']); ?></strong><span>entries</span></div>
							</a>
						<?php endforeach; ?>
					</div>
				<?php endif; ?>
			</div>
			<div class="card">
				<div class="card-head">
					<h2>Top sources <span class="hint">· top 10</span></h2>
					<div class="segmented" data-view-toggle="source-view">
						<button type="button" class="active" data-view="donut">Donut</button>
						<button type="button" data-view="treemap">Treemap</button>
						<button type="button" data-view="list">List</button>
					</div>
				</div>
				<div class="view-pane" data-view-pane="source-view" data-view="donut">
					<?php if ($referrers): ?>
						<div id="chart-refs" class="chart small" role="img" aria-label="Referrer source distribution"></div>
					<?php else: ?>
						<div class="empty">No referrer data in the selected period.</div>
					<?php endif; ?>
				</div>
				<div class="view-pane" data-view-pane="source-view" data-view="treemap" hidden>
					<?php if ($sourceTreemap): ?>
						<div id="chart-source-treemap" class="chart small" role="img" aria-label="Top sources treemap"></div>
					<?php else: ?>
						<div class="empty">No referrer data in the selected period.</div>
					<?php endif; ?>
				</div>
				<div class="view-pane" data-view-pane="source-view" data-view="list" hidden>
					<?php if ($referrers): ?>
						<div class="mini-list">
							<?php foreach (array_slice($referrers, 0, 5) as $ref): $refViews = (int)$ref['views']; $refShare = $views > 0 ? 100 * $refViews / $views : 0; $refTypeLabel = mn_analytics_ref_type_label((string)$ref['ref_type']); $refName = trim((string)$ref['ref_source']); if ($refName === '') { $refName = $refTypeLabel; } ?>
								<a class="mini-row" href="?<?php echo stats_h(stats_query(['ref_type' => $ref['ref_type'], 'source' => $ref['ref_source'], 'page' => 1])); ?>">
									<div class="mini-main">
										<span class="badge <?php echo stats_h($ref['ref_type']); ?>"><?php echo stats_h($refTypeLabel); ?></span>
										<span class="title" style="display:inline;"><?php echo stats_h($refName); ?></span>
										<?php if ($ref['ref_host'] !== '' && $ref['ref_host'] !== $ref['ref_source']): ?><div class="slug"><?php echo stats_h($ref['ref_host']); ?></div><?php endif; ?>
									</div>
									<div class="mini-metric"><strong><?php echo mn_analytics_format_number($refViews); ?></strong><span>views</span></div>
									<div class="mini-share"><?php echo stats_h(number_format($refShare, 1, '.', ',')); ?> %</div>
								</a>
							<?php endforeach; ?>
						</div>
					<?php else: ?>
						<div class="empty">No referrer data in the selected period.</div>
					<?php endif; ?>
				</div>
				<p class="ref" style="margin-bottom: 0;">Only referrer type, source and host are stored — never external paths, queries or search terms.</p>
			</div>
		</div>


		<div class="grid-2even" data-tab-group="overview" data-slide="2" id="health">
			<div class="card">
				<h2>Content health <span class="hint">· top 8 by views</span></h2>
				<p class="ref" style="margin: -4px 0 10px;">Transparent sub-scores, not a black-box ranking. Reading speed is approximate (words ÷ active time).</p>
				<?php if ($contentHealth): ?>
					<div class="health-list">
						<?php foreach ($contentHealth as $health): ?>
							<a class="health-card" href="?<?php echo stats_h(stats_query(['path' => $health['slug'], 'page' => 1])); ?>">
								<div class="health-head"><span class="title"><?php echo stats_h($health['label']); ?></span><span class="mini-share"><?php echo stats_h(number_format($health['share'], 1, '.', ',')); ?> %</span></div>
								<div class="health-meta"><?php echo mn_analytics_format_number($health['views']); ?> views · <?php echo stats_h(mn_analytics_format_duration($health['duration'] !== null ? (int)round($health['duration']) : null)); ?> · <?php echo $health['scroll'] !== null ? stats_h(number_format($health['scroll'], 0, '.', ',')) . ' % scroll' : 'scroll —'; ?><?php if ($health['words'] !== null): ?> · <?php echo mn_analytics_format_number($health['words']); ?> words<?php endif; ?><?php if ($health['speed'] !== null): ?> · <?php echo stats_h(number_format($health['speed'], 0, '.', ',')); ?> wpm<?php endif; ?></div>
								<?php if ($health['flags']): ?><div class="health-flags"><?php foreach ($health['flags'] as $flag): ?><span class="badge warn"><?php echo stats_h($flag); ?></span><?php endforeach; ?></div><?php endif; ?>
								<div class="health-bars">
									<?php foreach (['reach' => 'Reach', 'depth' => 'Depth', 'stickiness' => 'Stickiness', 'momentum' => 'Momentum'] as $scoreKey => $scoreLabel): $scoreValue = (float)($health['scores'][$scoreKey] ?? 0); ?>
										<div class="health-bar"><span><?php echo stats_h($scoreLabel); ?></span><div class="health-track"><i style="width: <?php echo stats_h(number_format($scoreValue, 1, '.', '')); ?>%"></i></div><b><?php echo stats_h(number_format($scoreValue, 0, '.', ',')); ?></b></div>
									<?php endforeach; ?>
								</div>
							</a>
						<?php endforeach; ?>
					</div>
				<?php else: ?>
					<div class="empty">No page data in the selected period.</div>
				<?php endif; ?>
			</div>
			<div class="card">
				<div class="card-head">
					<h2>Section reading map <span class="hint">· where readers stop</span></h2>
					<?php if ($sectionPages): ?>
						<select id="section-page-select" class="page-select" aria-label="Page for section reading map">
							<?php foreach ($sectionPages as $sectionPage): $sectionSlug = (string)$sectionPage['path']; ?>
								<option value="<?php echo stats_h($sectionSlug); ?>"<?php echo $sectionSlug === $sectionPath ? ' selected' : ''; ?>><?php echo stats_h($titles[$sectionSlug] ?? $sectionSlug); ?></option>
							<?php endforeach; ?>
						</select>
					<?php endif; ?>
				</div>
				<?php if ($sectionMap): ?>
					<p class="ref" style="margin: -4px 0 10px;">Based on <?php echo mn_analytics_format_number($sectionPageviews); ?> pageviews with section data (<?php echo stats_h(number_format($sectionCoverage, 1, '.', ',')); ?> % of this page). Headings count as reached when at least a quarter of the heading is visible.</p>
					<div class="section-list">
						<?php foreach ($sectionMap as $section): ?>
							<div class="section-row">
								<div class="section-title"><span class="section-index"><?php echo str_pad((string)((int)$section['index'] + 1), 2, '0', STR_PAD_LEFT); ?></span><?php echo stats_h($section['label']); ?></div>
								<div class="section-track"><i style="width: <?php echo stats_h(number_format(min(100, (float)$section['reach_pct']), 1, '.', '')); ?>%"></i></div>
								<div class="section-num"><?php echo stats_h(number_format($section['reach_pct'], 1, '.', ',')); ?> %</div>
								<div class="section-meta"><?php echo stats_h(mn_analytics_format_duration((int)round($section['avg_dwell']))); ?> avg. visible · <?php echo stats_h(number_format($section['avg_visible'], 0, '.', ',')); ?> % avg. visibility</div>
							</div>
						<?php endforeach; ?>
					</div>
					<p class="ref" style="margin-bottom: 0;">Section logging uses the same ephemeral pageview token; no visitor ID is created. Older pageviews have no section data.</p>
				<?php else: ?>
					<div class="empty">No section data yet for this page. It starts with the next rendered lesson and is stored only as anonymous aggregate events.</div>
				<?php endif; ?>
			</div>
		</div>

		<div class="card" data-tab-group="overview" data-slide="2" id="movers">
			<h2>Top movers <span class="hint">· vs previous period</span></h2>
			<?php if ($range > 0): ?>
				<div class="grid-2even" style="margin-bottom: 0;">
					<div>
						<div class="chart-cap">Rising pages</div>
						<?php if ($topMovers['up']): ?>
							<div class="mini-list mini-list--compact">
								<?php foreach ($topMovers['up'] as $mover): $moverTitle = $titles[$mover['slug']] ?? $mover['slug']; ?>
									<a class="mini-row" href="?<?php echo stats_h(stats_query(['path' => $mover['slug'], 'page' => 1])); ?>">
										<div class="mini-main"><span class="title"><?php echo stats_h($moverTitle); ?></span><div class="slug"><?php echo mn_analytics_format_number($mover['current']); ?> vs <?php echo mn_analytics_format_number($mover['previous']); ?> views</div></div>
										<div class="mini-metric"><strong class="good">+<?php echo mn_analytics_format_number($mover['delta']); ?></strong><span><?php echo $mover['pct'] !== null ? '+' . stats_h(number_format($mover['pct'], 1, '.', ',')) . ' %' : 'new'; ?></span></div>
									</a>
								<?php endforeach; ?>
							</div>
						<?php else: ?>
							<div class="ref">No rising pages in this comparison.</div>
						<?php endif; ?>
					</div>
					<div>
						<div class="chart-cap">Falling pages</div>
						<?php if ($topMovers['down']): ?>
							<div class="mini-list mini-list--compact">
								<?php foreach ($topMovers['down'] as $mover): $moverTitle = $titles[$mover['slug']] ?? $mover['slug']; ?>
									<a class="mini-row" href="?<?php echo stats_h(stats_query(['path' => $mover['slug'], 'page' => 1])); ?>">
										<div class="mini-main"><span class="title"><?php echo stats_h($moverTitle); ?></span><div class="slug"><?php echo mn_analytics_format_number($mover['current']); ?> vs <?php echo mn_analytics_format_number($mover['previous']); ?> views</div></div>
										<div class="mini-metric"><strong class="bad"><?php echo mn_analytics_format_number($mover['delta']); ?></strong><span><?php echo $mover['pct'] !== null ? stats_h(number_format($mover['pct'], 1, '.', ',')) . ' %' : '—'; ?></span></div>
									</a>
								<?php endforeach; ?>
							</div>
						<?php else: ?>
							<div class="ref">No falling pages in this comparison.</div>
						<?php endif; ?>
					</div>
				</div>
			<?php else: ?>
				<div class="ref">Choose a finite range (7, 30, 90 or 365 days) to compare against the previous period.</div>
			<?php endif; ?>
		</div>

		<div class="card" data-tab-group="overview" data-slide="2" id="portfolio">
			<h2>Page portfolio <span class="hint">· top 8 by views</span></h2>
			<?php if ($portfolioPages): ?>
				<div class="portfolio-grid">
					<?php foreach ($portfolioPages as $page): $pageSlug = (string)$page['path']; $pageViews = (int)$page['views']; $pageShare = $views > 0 ? 100 * $pageViews / $views : 0; $pageDuration = $page['avg_duration'] !== null ? (int)round((float)$page['avg_duration']) : null; $pageScroll = $page['avg_scroll'] !== null ? (int)round((float)$page['avg_scroll']) : null; ?>
						<a class="portfolio-card" href="?<?php echo stats_h(stats_query(['path' => $pageSlug, 'page' => 1])); ?>">
							<div class="portfolio-head"><span class="title"><?php echo stats_h($titles[$pageSlug] ?? $pageSlug); ?></span><span class="mini-share"><?php echo stats_h(number_format($pageShare, 1, '.', ',')); ?> %</span></div>
							<div class="portfolio-number"><?php echo mn_analytics_format_number($pageViews); ?> <span>views</span></div>
							<div class="portfolio-spark"><?php echo $pageSparklines[$pageSlug] ?? '—'; ?></div>
							<div class="portfolio-meta"><?php echo stats_h(mn_analytics_format_duration($pageDuration)); ?> avg. · <?php echo $pageScroll !== null ? $pageScroll . ' % scroll' : 'scroll —'; ?></div>
							<div class="portfolio-track"><span style="width: <?php echo stats_h(number_format($pageShare, 1, '.', '')); ?>%"></span></div>
						</a>
					<?php endforeach; ?>
				</div>
			<?php else: ?>
				<div class="empty">No pages with views in the selected period.</div>
			<?php endif; ?>
		</div>

		<div class="grid-2even" data-tab-group="overview" data-slide="3" id="audience">
			<div class="card">
				<h2>Audience &amp; bots</h2>
				<?php if ($views > 0): ?>
					<div class="audience-block">
						<div class="chart-cap">Devices <span class="hint">· top 4</span></div>
						<div class="bars">
							<?php foreach (array_slice($deviceMix, 0, 4) as $mix): $share = 100 * (int)$mix['value'] / $views; $deviceFilter = strtolower($mix['name']); ?>
								<div class="bar-row filter-row" data-filter-kind="device" data-filter-value="<?php echo stats_h($deviceFilter); ?>"><div class="bar-label"><?php echo stats_h($mix['name']); ?></div><div class="bar-track"><div class="bar-fill" style="width: <?php echo stats_h(number_format($share, 1, '.', '')); ?>%"></div></div><div class="bar-num"><?php echo stats_h(number_format($share, 1, '.', ',')); ?> %</div></div>
							<?php endforeach; ?>
						</div>
					</div>
					<div class="audience-block">
						<div class="chart-cap">Browsers <span class="hint">· top 4</span></div>
						<div class="bars">
							<?php foreach (array_slice($browserMix, 0, 4) as $mix): $share = 100 * (int)$mix['value'] / $views; $browserFilter = preg_replace('/\s+\d+.*$/', '', (string)$mix['name']); ?>
								<div class="bar-row filter-row" data-filter-kind="browser" data-filter-value="<?php echo stats_h($browserFilter); ?>"><div class="bar-label"><?php echo stats_h($mix['name']); ?></div><div class="bar-track"><div class="bar-fill bar-fill--sky" style="width: <?php echo stats_h(number_format($share, 1, '.', '')); ?>%"></div></div><div class="bar-num"><?php echo stats_h(number_format($share, 1, '.', ',')); ?> %</div></div>
							<?php endforeach; ?>
						</div>
					</div>
					<div class="audience-block">
						<div class="chart-cap">Operating systems <span class="hint">· top 4</span></div>
						<div class="bars">
							<?php foreach (array_slice($osMix, 0, 4) as $mix): $share = 100 * (int)$mix['value'] / $views; $osFilter = preg_replace('/\s+\d.*$/', '', (string)$mix['name']); ?>
								<div class="bar-row filter-row" data-filter-kind="os" data-filter-value="<?php echo stats_h($osFilter); ?>"><div class="bar-label"><?php echo stats_h($mix['name']); ?></div><div class="bar-track"><div class="bar-fill bar-fill--emerald" style="width: <?php echo stats_h(number_format($share, 1, '.', '')); ?>%"></div></div><div class="bar-num"><?php echo stats_h(number_format($share, 1, '.', ',')); ?> %</div></div>
							<?php endforeach; ?>
						</div>
					</div>
					<div class="audience-block">
						<div class="chart-cap">Bots <span class="hint">· top 3 · <?php echo mn_analytics_format_number($bots); ?> views / <?php echo stats_h(number_format($views > 0 ? 100 * $bots / $views : 0, 1, '.', ',')); ?> %</span></div>
						<?php if ($botReasons): ?>
							<div class="mini-list mini-list--compact">
								<?php foreach (array_slice($botReasons, 0, 3) as $bot): $reason = trim((string)($bot['bot_reason'] ?? '')); $reasonLabel = $reason !== '' ? $reason : 'Unknown bot'; ?>
									<div class="mini-row">
										<div class="mini-main"><button type="button" class="bot-reason" data-reason="<?php echo stats_h($reasonLabel); ?>"><?php echo stats_h($reasonLabel); ?></button></div>
										<div class="mini-metric"><strong><?php echo mn_analytics_format_number((int)$bot['views']); ?></strong><span>views</span></div>
									</div>
								<?php endforeach; ?>
							</div>
						<?php else: ?>
							<div class="ref">No bots detected in this range.</div>
						<?php endif; ?>
					</div>
				<?php else: ?>
					<div class="empty">No data in the selected period.</div>
				<?php endif; ?>
			</div>
			<div class="card">
				<h2>Reading behaviour</h2>
				<?php if ($views > 0): ?>
					<div class="chart-cap">Time on page <span class="hint">· <?php echo mn_analytics_format_number($known); ?> timed views</span></div>
					<div class="bars">
						<?php foreach ($engagementBuckets as $bucket): $w = $bucket['views'] > 0 ? max(2, 100 * $bucket['views'] / $engagementMax) : 0; ?>
							<div class="bar-row"><div class="bar-label"><?php echo stats_h($bucket['label']); ?></div><div class="bar-track"><div class="bar-fill" style="width: <?php echo stats_h(number_format($w, 1, '.', '')); ?>%"></div></div><div class="bar-num"><?php echo mn_analytics_format_number($bucket['views']); ?></div></div>
						<?php endforeach; ?>
					</div>
					<div class="chart-cap" style="margin-top: 14px;">Scroll depth <span class="hint">· <?php echo mn_analytics_format_number($scrollKnown); ?> measurements</span></div>
					<div class="bars">
						<?php foreach ($scrollBuckets as $bucket): $w = $bucket['views'] > 0 ? max(2, 100 * $bucket['views'] / $scrollBucketMax) : 0; ?>
							<div class="bar-row"><div class="bar-label"><?php echo stats_h($bucket['label']); ?></div><div class="bar-track"><div class="bar-fill bar-fill--sky" style="width: <?php echo stats_h(number_format($w, 1, '.', '')); ?>%"></div></div><div class="bar-num"><?php echo mn_analytics_format_number($bucket['views']); ?></div></div>
						<?php endforeach; ?>
					</div>
					<p class="ref" style="margin-bottom: 0;">Rows show pageviews. Unknown means the browser did not send a completion signal; open tokens are closed after at most 6 hours.</p>
				<?php else: ?>
					<div class="empty">No data in the selected period.</div>
				<?php endif; ?>
			</div>
		</div>

		<div class="card" data-tab-group="overview" data-slide="3" id="cohorts">
			<h2>Cohort profiles <span class="hint">· aggregate, not people</span></h2>
			<?php if (!empty($cohortRows['source']) || !empty($cohortRows['device'])): ?>
				<div class="grid-2even" style="margin-bottom: 0;">
					<div>
						<div class="chart-cap">By source</div>
						<div class="table-wrap">
							<table aria-label="Source cohort profiles">
								<thead><tr><th>Source</th><th class="num">Views</th><th class="num">Avg. time</th><th class="num">Scroll</th><th class="num">Bounce</th></tr></thead>
								<tbody>
								<?php foreach ($cohortRows['source'] as $cohort): ?>
									<tr class="filter-row" data-filter-kind="<?php echo stats_h($cohort['filter_kind']); ?>" data-filter-value="<?php echo stats_h($cohort['filter_value']); ?>"><td><?php echo stats_h($cohort['label']); ?></td><td class="num"><?php echo mn_analytics_format_number($cohort['views']); ?></td><td class="num"><?php echo stats_h(mn_analytics_format_duration($cohort['duration'] !== null ? (int)round($cohort['duration']) : null)); ?></td><td class="num"><?php echo $cohort['scroll'] !== null ? stats_h(number_format($cohort['scroll'], 0, '.', ',')) . ' %' : '—'; ?></td><td class="num <?php echo stats_bounce_class($cohort['bounce']); ?>"><?php echo $cohort['bounce'] !== null ? stats_h(number_format($cohort['bounce'], 1, '.', ',')) . ' %' : '—'; ?></td></tr>
								<?php endforeach; ?>
								</tbody>
							</table>
						</div>
					</div>
					<div>
						<div class="chart-cap">By device</div>
						<div class="table-wrap">
							<table aria-label="Device cohort profiles">
								<thead><tr><th>Device</th><th class="num">Views</th><th class="num">Avg. time</th><th class="num">Scroll</th><th class="num">Bounce</th></tr></thead>
								<tbody>
								<?php foreach ($cohortRows['device'] as $cohort): ?>
									<tr class="filter-row" data-filter-kind="<?php echo stats_h($cohort['filter_kind']); ?>" data-filter-value="<?php echo stats_h($cohort['filter_value']); ?>"><td><?php echo stats_h($cohort['label']); ?></td><td class="num"><?php echo mn_analytics_format_number($cohort['views']); ?></td><td class="num"><?php echo stats_h(mn_analytics_format_duration($cohort['duration'] !== null ? (int)round($cohort['duration']) : null)); ?></td><td class="num"><?php echo $cohort['scroll'] !== null ? stats_h(number_format($cohort['scroll'], 0, '.', ',')) . ' %' : '—'; ?></td><td class="num <?php echo stats_bounce_class($cohort['bounce']); ?>"><?php echo $cohort['bounce'] !== null ? stats_h(number_format($cohort['bounce'], 1, '.', ',')) . ' %' : '—'; ?></td></tr>
								<?php endforeach; ?>
								</tbody>
							</table>
						</div>
					</div>
				</div>
				<p class="ref" style="margin: 8px 0 0;">Source and device cohorts are aggregate profiles, not individual readers.</p>
			<?php else: ?>
				<div class="empty">No cohort data in the selected period.</div>
			<?php endif; ?>
		</div>

		<div class="grid-2even" data-tab-group="overview" data-slide="3" id="signals">
			<div class="card">
				<h2>What readers do next <span class="hint">· aggregate events</span></h2>
				<?php if ($interactionRows): ?>
					<?php foreach (['internal_link' => 'Internal links', 'external_link' => 'External domains', 'citation' => 'Citations', 'code_copy' => 'Code copies'] as $kind => $label): ?>
						<?php if (!empty($interactionGroups[$kind])): ?>
							<div class="chart-cap" style="margin-top: 12px;"><?php echo stats_h($label); ?></div>
							<div class="mini-list mini-list--compact">
								<?php foreach (array_slice($interactionGroups[$kind], 0, 5) as $row): $target = (string)$row['target']; $targetLabel = $kind === 'internal_link' ? ($titles[$target] ?? $target) : $target; ?>
									<div class="mini-row"><div class="mini-main"><span class="title"><?php echo stats_h($targetLabel); ?></span></div><div class="mini-metric"><strong><?php echo mn_analytics_format_number((int)$row['n']); ?></strong><span>events</span></div></div>
								<?php endforeach; ?>
							</div>
						<?php endif; ?>
					<?php endforeach; ?>
					<p class="ref" style="margin: 10px 0 0;">Based on <?php echo mn_analytics_format_number($interactionPageviews); ?> pageviews with events (<?php echo stats_h(number_format($interactionCoverage, 1, '.', ',')); ?> % of views). Logged only as event counts with the ephemeral pageview token: no visitor ID, no full external URL, no search query.</p>
				<?php else: ?>
					<div class="empty">No interaction events yet. Logging starts with the next rendered page.</div>
				<?php endif; ?>
			</div>
			<div class="card">
				<h2>Search &amp; learning <span class="hint">· no query text</span></h2>
				<?php if ($interactionRows): ?>
					<div class="chart-cap">Search</div>
					<div class="mini-list mini-list--compact">
						<div class="mini-row"><div class="mini-main"><span class="title">Searches used</span></div><div class="mini-metric"><strong><?php echo mn_analytics_format_number($searchUsage); ?></strong><span>events</span></div></div>
						<?php if ($searchAvgResults !== null): ?><div class="mini-row"><div class="mini-main"><span class="title">Average results</span></div><div class="mini-metric"><strong><?php echo stats_h(number_format($searchAvgResults, 1, '.', ',')); ?></strong><span>per search</span></div></div><?php endif; ?>
					</div>
					<?php if (!empty($interactionGroups['search_result'])): ?>
						<div class="chart-cap" style="margin-top: 12px;">Clicked search results</div>
						<div class="mini-list mini-list--compact">
							<?php foreach (array_slice($interactionGroups['search_result'], 0, 5) as $row): $target = (string)$row['target']; ?>
								<div class="mini-row"><div class="mini-main"><span class="title"><?php echo stats_h($titles[$target] ?? $target); ?></span></div><div class="mini-metric"><strong><?php echo mn_analytics_format_number((int)$row['n']); ?></strong><span>clicks</span></div></div>
							<?php endforeach; ?>
						</div>
					<?php endif; ?>
					<?php if ($quizDifficulty): ?>
						<div class="chart-cap" style="margin-top: 12px;">Hardest quiz questions</div>
						<div class="mini-list mini-list--compact">
							<?php foreach ($quizDifficulty as $quiz): ?>
								<div class="mini-row"><div class="mini-main"><span class="title"><?php echo stats_h($quiz['target']); ?></span><div class="slug"><?php echo mn_analytics_format_number((int)$quiz['n']); ?> answers</div></div><div class="mini-metric"><strong><?php echo stats_h(number_format($quiz['accuracy'], 0, '.', ',')); ?> %</strong><span>correct</span></div></div>
							<?php endforeach; ?>
						</div>
					<?php endif; ?>
					<?php foreach (['lab_run' => 'Lab runs', 'download' => 'Downloads', 'media_play' => 'Media plays'] as $kind => $label): ?>
						<?php if (!empty($interactionGroups[$kind])): ?>
							<div class="chart-cap" style="margin-top: 12px;"><?php echo stats_h($label); ?></div>
							<div class="mini-list mini-list--compact">
								<?php foreach (array_slice($interactionGroups[$kind], 0, 4) as $row): ?><div class="mini-row"><div class="mini-main"><span class="title"><?php echo stats_h($row['target']); ?></span></div><div class="mini-metric"><strong><?php echo mn_analytics_format_number((int)$row['n']); ?></strong><span>events</span></div></div><?php endforeach; ?>
							</div>
						<?php endif; ?>
					<?php endforeach; ?>
				<?php else: ?>
					<div class="empty">No learning or search events yet.</div>
				<?php endif; ?>
			</div>
		</div>

		<div class="card" data-tab-group="overview" data-slide="3" id="calendar">
			<h2>Calendar heatmap <span class="hint">· click a day to filter</span></h2>
			<?php if ($views > 0 && $calendarData): ?>
				<div id="chart-calendar" class="chart" role="img" aria-label="Calendar heatmap of daily views"></div>
				<p class="ref" style="margin-bottom: 0;">Each cell is a day; color intensity is pageviews. Click a day to filter the dashboard, then use the filter chip to remove it.</p>
			<?php else: ?>
				<div class="empty">No data in the selected period.</div>
			<?php endif; ?>
		</div>

		<div class="card" data-tab-group="overview" data-slide="3" id="bot-human">
			<h2>Humans vs bots <span class="hint">· pageviews per day</span></h2>
			<?php if ($views > 0 && $botHumanLabels): ?>
				<div id="chart-bots-human" class="chart small" role="img" aria-label="Human and bot pageviews per day"></div>
				<p class="ref" style="margin-bottom: 0;">A spike that is mostly rose is likely crawler traffic, not readers.</p>
			<?php else: ?>
				<div class="empty">No data in the selected period.</div>
			<?php endif; ?>
		</div>

		<div class="card" data-tab-group="overview" data-slide="3" id="page-source">
			<h2>Page × source <span class="hint">· non-internal pageviews</span></h2>
			<?php if ($pageSourceData): ?>
				<div id="chart-page-source" class="chart" role="img" aria-label="Page by source heatmap"></div>
				<p class="ref" style="margin-bottom: 0;">Which sources bring readers to which pages. Internal navigation is shown separately.</p>
			<?php else: ?>
				<div class="empty">No non-internal source data in the selected period.</div>
			<?php endif; ?>
		</div>

		<div class="card" data-tab-group="overview" data-slide="3" id="navigation">
			<h2>Page transitions <span class="hint">· top 6 · immediate next page</span></h2>
			<?php if ($sankeyLinks): ?>
				<p class="ref"><?php echo mn_analytics_format_number($internal); ?> internal transitions (<?php echo stats_h(number_format($views > 0 ? 100 * $internal / $views : 0, 1, '.', ',')); ?> % of views). These are immediate transitions, not visitor journeys — a page can be first simply because it was the previous page. The transition matrix and entry pages are in Referrers &amp; engagement.</p>
				<div class="mini-list mini-list--compact">
					<?php foreach (array_slice($sankeyLinks, 0, 6) as $flow): $from = $titles[$flow['source']] ?? (string)$flow['source']; $to = $titles[$flow['target']] ?? (string)$flow['target']; ?>
						<div class="mini-row">
							<div class="mini-main"><span class="title"><?php echo stats_h($from); ?></span><div class="slug">→ <?php echo stats_h($to); ?></div></div>
							<div class="mini-metric"><strong><?php echo mn_analytics_format_number((int)$flow['value']); ?></strong><span>transitions</span></div>
						</div>
					<?php endforeach; ?>
				</div>
			<?php else: ?>
				<div class="empty">No internal page-to-page transitions in the selected period.</div>
			<?php endif; ?>
		</div>

		<div class="grid-2even">
			<div class="card card-full" id="pages" data-tab-group="pages">
				<h2>Page performance <span class="hint">· by views</span></h2>
				<?php if ($path === ''): ?>
					<p class="ref" style="margin:-4px 0 6px"><?php echo mn_analytics_format_number($zeroPages); ?> of <?php echo mn_analytics_format_number(count($pageRows)); ?> pages without views in the period.</p>
				<?php endif; ?>
				<p class="ref" style="margin:0 0 12px">Click a page to filter the whole dashboard to that page — the trend, referrers and tech tables follow. All pages are listed; scroll horizontally if needed.</p>
				<?php if ($views > 0 && $chartPages): ?>
					<div class="grid-2" style="margin-bottom:12px;">
						<div>
							<div class="chart-cap">Top pages by views</div>
							<div id="chart-pages" class="chart" style="height:360px;" role="img" aria-label="Top pages by views"></div>
						</div>
						<div>
							<div class="chart-cap">Page share · top 6 + other</div>
							<div id="chart-page-share" class="chart small" role="img" aria-label="Page share of views"></div>
						</div>
					</div>
				<?php else: ?>
					<div class="empty">No views in the selected period.</div>
				<?php endif; ?>
				<?php if ($pageRows): ?>
					<div class="table-wrap">
						<table aria-label="Page performance by views">
							<thead><tr><th>Page</th><th class="num">Views</th><th>Trend</th><th class="num">Share</th><th class="num">Entries</th><th class="num">Internal</th><th class="num">Avg. duration</th><th class="num">Avg. scroll</th><th class="num">Bounce</th><th class="num">Last seen</th></tr></thead>
							<tbody>
							<?php foreach ($pageRows as $page): $pv = (int)$page['views']; $pk = (int)($page['known'] ?? 0); $pb = (int)($page['bounces'] ?? 0); $pbr = $pk > 0 ? 100 * $pb / $pk : null; $share = $views > 0 ? 100 * $pv / $views : 0; $last = isset($page['last_ts']) && $page['last_ts'] !== null ? (int)$page['last_ts'] : null; ?>
								<tr class="<?php echo $pv === 0 ? 'zero-row' : ''; ?>">
									<td class="path">
										<a href="?<?php echo stats_h(stats_query(['path' => $page['path'], 'page' => 1])); ?>"><span class="title"><?php echo stats_h($titles[$page['path']] ?? $page['path']); ?></span></a>
										<div class="slug"><?php echo stats_h($page['path']); ?></div>
									</td>
									<td class="num"><?php echo mn_analytics_format_number($pv); ?></td>
									<td class="spark-cell"><?php echo $pageSparklines[$page['path']] ?? '—'; ?></td>
									<td class="num"><?php echo stats_h(number_format($share, 1, '.', ',')); ?> %</td>
									<td class="num"><?php echo mn_analytics_format_number((int)($page['entries'] ?? 0)); ?></td>
									<td class="num"><?php echo mn_analytics_format_number((int)($page['internal'] ?? 0)); ?></td>
									<td class="num"><?php echo stats_h(mn_analytics_format_duration($page['avg_duration'] !== null ? (int)round((float)$page['avg_duration']) : null)); ?></td>
									<td class="num"><?php echo $page['avg_scroll'] !== null ? stats_h(number_format((float)$page['avg_scroll'], 0, '.', ',')) . ' %' : '—'; ?></td>
									<td class="num <?php echo stats_bounce_class($pbr); ?>"><?php echo $pbr !== null ? stats_h(number_format($pbr, 1, '.', ',')) . ' %' : '—'; ?></td>
									<td class="num"><?php echo $last !== null ? stats_h(stats_time_label($last)) : '—'; ?></td>
								</tr>
							<?php endforeach; ?>
							</tbody>
						</table>
					</div>
				<?php else: ?>
					<div class="empty">No data.</div>
				<?php endif; ?>
			</div>
			<div class="card card-full" data-tab-group="referrers">
				<h2>Referrer</h2>
				<?php if ($referrers): ?>
					<div class="table-wrap">
						<table aria-label="Referrer sources">
							<thead><tr><th>Type</th><th>Source</th><th class="num">Views</th><th class="num">Share</th><th class="num">Avg. duration</th><th class="num">Bounce</th></tr></thead>
							<tbody>
							<?php foreach ($referrers as $ref): $refViews = (int)$ref['views']; $refShare = $views > 0 ? 100 * $refViews / $views : 0; $refKnown = (int)($ref['known'] ?? 0); $refBounces = (int)($ref['bounces'] ?? 0); $refBounceRate = $refKnown > 0 ? 100 * $refBounces / $refKnown : null; ?>
								<tr>
									<td><span class="badge <?php echo stats_h($ref['ref_type']); ?>"><?php echo stats_h(mn_analytics_ref_type_label($ref['ref_type'])); ?></span></td>
									<td class="ref">
										<a href="?<?php echo stats_h(stats_query(['ref_type' => $ref['ref_type'], 'source' => $ref['ref_source'], 'page' => 1])); ?>"><?php echo stats_h($ref['ref_source'] !== '' ? $ref['ref_source'] : 'Direct'); ?></a>
										<?php if ($ref['ref_host'] !== '' && $ref['ref_host'] !== $ref['ref_source']): ?><div class="slug"><?php echo stats_h($ref['ref_host']); ?></div><?php endif; ?>
									</td>
									<td class="num"><?php echo mn_analytics_format_number($refViews); ?></td>
									<td class="num"><?php echo stats_h(number_format($refShare, 1, '.', ',')); ?> %</td>
									<td class="num"><?php echo stats_h(mn_analytics_format_duration($ref['avg_duration'] !== null ? (int)round((float)$ref['avg_duration']) : null)); ?></td>
									<td class="num <?php echo stats_bounce_class($refBounceRate); ?>"><?php echo $refBounceRate !== null ? stats_h(number_format($refBounceRate, 1, '.', ',')) . ' %' : '—'; ?></td>
								</tr>
							<?php endforeach; ?>
							</tbody>
						</table>
					</div>
				<?php else: ?>
					<div class="empty">No data.</div>
				<?php endif; ?>
			</div>
			<div class="card card-full" data-tab-group="referrers">
				<h2>External referrers</h2>
				<?php if ($externalReferrers): ?>
					<div class="table-wrap">
						<table aria-label="External referrers">
							<thead><tr><th>Site</th><th>Host</th><th class="num">Views</th><th class="num">Share</th></tr></thead>
							<tbody>
							<?php foreach ($externalReferrers as $ext): $extViews = (int)$ext['views']; $extShare = $views > 0 ? 100 * $extViews / $views : 0; ?>
								<tr>
									<td class="ref"><a href="?<?php echo stats_h(stats_query(['ref_type' => 'external', 'source' => $ext['ref_source'], 'page' => 1])); ?>"><?php echo stats_h($ext['ref_source'] !== '' ? $ext['ref_source'] : $ext['ref_host']); ?></a></td>
									<td class="ref"><?php echo stats_h($ext['ref_host'] !== '' ? $ext['ref_host'] : '—'); ?></td>
									<td class="num"><?php echo mn_analytics_format_number($extViews); ?></td>
									<td class="num"><?php echo stats_h(number_format($extShare, 1, '.', ',')); ?> %</td>
								</tr>
							<?php endforeach; ?>
							</tbody>
						</table>
					</div>
					<p class="ref" style="margin-bottom:0;">External referrers keep only the hostname — never the external path, query or search term.</p>
				<?php else: ?>
					<div class="empty">No external referrers in the selected period.</div>
				<?php endif; ?>
			</div>
		</div>

		<div class="card" data-tab-group="compare" id="compare-tab">
			<h2>Compare <span class="hint">· previous, two entities, or two date ranges</span></h2>
			<form class="compare-form" method="get" action="">
				<input type="hidden" name="__proxy_path" value="__MN_STATS_BASE_PATH__">
				<input type="hidden" name="range" value="<?php echo (int)$range; ?>">
				<input type="hidden" name="day" value="<?php echo stats_h($day); ?>">
				<input type="hidden" name="weekday" value="<?php echo (int)$weekday; ?>">
				<input type="hidden" name="hour" value="<?php echo $hour >= 0 ? (int)$hour : ''; ?>">
				<input type="hidden" name="humans" value="<?php echo $humansOnly ? '1' : ''; ?>">
				<input type="hidden" name="path" value="<?php echo stats_h($path); ?>">
				<input type="hidden" name="ref_type" value="<?php echo stats_h($refType); ?>">
				<input type="hidden" name="source" value="<?php echo stats_h($source); ?>">
				<input type="hidden" name="ref_path" value="<?php echo stats_h($refPath); ?>">
				<input type="hidden" name="browser" value="<?php echo stats_h($browser); ?>">
				<input type="hidden" name="os" value="<?php echo stats_h($os); ?>">
				<input type="hidden" name="device" value="<?php echo stats_h($device); ?>">
				<label>Mode
					<select name="cmp_mode">
						<option value="previous"<?php echo $compareMode === 'previous' ? ' selected' : ''; ?>>Current vs previous period</option>
						<option value="entity"<?php echo $compareMode === 'entity' ? ' selected' : ''; ?>>Entity A vs B</option>
						<option value="range"<?php echo $compareMode === 'range' ? ' selected' : ''; ?>>Date range A vs B</option>
					</select>
				</label>
				<label>Entity type
					<select name="cmp_kind">
						<option value="path"<?php echo $compareKind === 'path' ? ' selected' : ''; ?>>Page</option>
						<option value="source"<?php echo $compareKind === 'source' ? ' selected' : ''; ?>>Source</option>
						<option value="device"<?php echo $compareKind === 'device' ? ' selected' : ''; ?>>Device</option>
					</select>
				</label>
				<label>A
					<input name="cmp_a" list="compare-path-list" value="<?php echo stats_h($compareA); ?>" placeholder="A">
				</label>
				<label>B
					<input name="cmp_b" list="compare-path-list" value="<?php echo stats_h($compareB); ?>" placeholder="B">
				</label>
				<label>From A
					<input type="date" name="cmp_from_a" value="<?php echo stats_h($compareFromA); ?>">
				</label>
				<label>To A
					<input type="date" name="cmp_to_a" value="<?php echo stats_h($compareToA); ?>">
				</label>
				<label>From B
					<input type="date" name="cmp_from_b" value="<?php echo stats_h($compareFromB); ?>">
				</label>
				<label>To B
					<input type="date" name="cmp_to_b" value="<?php echo stats_h($compareToB); ?>">
				</label>
				<div class="actions"><button type="submit" class="btn btn-primary">Compare</button></div>
			</form>
			<datalist id="compare-path-list">
				<?php foreach ($titles as $compareSlug => $compareTitle): ?><option value="<?php echo stats_h($compareSlug); ?>"><?php echo stats_h($compareTitle); ?></option><?php endforeach; ?>
			</datalist>
			<?php if ($compareRows): $compareFmt = static function ($value, string $kind): string { if ($value === null) { return '—'; } if ($kind === 'duration') { return mn_analytics_format_duration((int)round((float)$value)); } if ($kind === 'percent') { return number_format((float)$value, 1, '.', ',') . ' %'; } return mn_analytics_format_number((int)$value); }; ?>
				<div class="compare-head"><span><?php echo stats_h($compareALabel); ?></span><span><?php echo stats_h($compareBLabel); ?></span></div>
				<div class="compare-table">
					<?php foreach ($compareRows as $compareRow): $a = $compareRow['a']; $b = $compareRow['b']; $kind = (string)$compareRow['kind']; $rowMax = max((float)($a ?? 0), (float)($b ?? 0)); $aw = $rowMax > 0 ? 100 * (float)($a ?? 0) / $rowMax : 0; $bw = $rowMax > 0 ? 100 * (float)($b ?? 0) / $rowMax : 0; ?>
						<div class="compare-row compare-row--detail">
							<div class="compare-label"><?php echo stats_h($compareRow['label']); ?></div>
							<div class="compare-values"><strong><?php echo stats_h($compareFmt($a, $kind)); ?></strong><span><?php echo stats_h($compareFmt($b, $kind)); ?></span></div>
							<div class="compare-bars"><i style="width: <?php echo stats_h(number_format($aw, 1, '.', '')); ?>%"></i><i style="width: <?php echo stats_h(number_format($bw, 1, '.', '')); ?>%"></i></div>
						</div>
					<?php endforeach; ?>
				</div>
			<?php else: ?>
				<div class="empty">Choose two entities or two date ranges, or use the previous-period mode.</div>
			<?php endif; ?>
		</div>

		<div class="card card-full" data-tab-group="referrers">
			<div class="card-head">
				<h2>Page transitions <span class="hint">· immediate next page, not a full journey</span></h2>
				<?php if ($transitionMatrixData): ?>
					<div class="segmented" data-view-toggle="transition-view">
						<button type="button" class="active" data-view="matrix">Matrix</button>
						<button type="button" data-view="flow">Flow</button>
					</div>
				<?php endif; ?>
			</div>
			<p class="ref" style="margin: -4px 0 12px;"><strong>This is a transition map, not a start-to-end visitor path.</strong> A page can appear on the left simply because it is often the previous page, not because visits started there. Exact paths would require a persistent session identifier, which this analytics deliberately does not store.</p>
			<?php if ($transitionMatrixData): ?>
				<div class="view-pane" data-view-pane="transition-view" data-view="matrix">
					<p class="ref" style="margin: 0 0 8px;">Rows = previous page, columns = next page. This matrix includes all immediate transitions, including cycles.</p>
					<div id="chart-transition-matrix" class="chart" style="height: 400px;" role="img" aria-label="Page transition matrix"></div>
				</div>
				<div class="view-pane" data-view-pane="transition-view" data-view="flow" hidden>
					<p class="ref" style="margin: 0 0 8px;">Top <?php echo count($sankeyLinks); ?> immediate transitions as a flow. Hover a flow to see the full page titles.<?php if ($sankeyOmitted > 0): ?> <?php echo (int)$sankeyOmitted; ?> weaker cycle-closing transitions were omitted to keep the Sankey acyclic.<?php endif; ?></p>
					<div id="chart-sankey" class="chart" style="height: 440px;" role="img" aria-label="Page transition flow"></div>
				</div>
			<?php else: ?>
				<div class="empty">No internal page-to-page transitions in the selected period.</div>
			<?php endif; ?>
			<?php if ($entryPages): ?>
				<div class="chart-cap" style="margin-top: 16px;">Where visits start <span class="hint">· entry pageviews</span></div>
				<div class="mini-list mini-list--compact">
					<?php foreach ($entryPages as $entry): $entrySlug = (string)$entry['path']; $entryCount = (int)$entry['entries']; $entryPageShare = $entries > 0 ? 100 * $entryCount / $entries : 0; ?>
						<a class="mini-row" href="?<?php echo stats_h(stats_query(['path' => $entrySlug, 'page' => 1])); ?>">
							<div class="mini-main"><span class="title"><?php echo stats_h($titles[$entrySlug] ?? $entrySlug); ?></span><div class="slug">entry pageview</div></div>
							<div class="mini-metric"><strong><?php echo mn_analytics_format_number($entryCount); ?></strong><span><?php echo stats_h(number_format($entryPageShare, 1, '.', ',')); ?> % of entries</span></div>
						</a>
					<?php endforeach; ?>
				</div>
				<p class="ref" style="margin-bottom: 0;">Entry pageviews are the privacy-safe proxy for where visits start; they are not unique people.</p>
			<?php endif; ?>
		</div>

		<div class="grid-3" data-tab-group="referrers">
			<div class="card">
				<h2>Internal navigation <span class="hint">· previous page</span></h2>
				<?php if ($internalRefs): ?>
					<div class="table-wrap">
						<table aria-label="Internal navigation">
							<thead><tr><th>Previous page</th><th class="num">Navigations</th><th class="num">Avg. duration after</th></tr></thead>
							<tbody>
							<?php foreach ($internalRefs as $ref): ?>
								<tr>
									<td class="path">
										<a href="?<?php echo stats_h(stats_query(['ref_type' => 'internal', 'ref_path' => $ref['ref_path'], 'page' => 1])); ?>"><span class="title"><?php echo stats_h($titles[$ref['ref_path']] ?? $ref['ref_path']); ?></span></a>
										<div class="slug"><?php echo stats_h($ref['ref_path']); ?></div>
									</td>
									<td class="num"><?php echo mn_analytics_format_number((int)$ref['views']); ?></td>
									<td class="num"><?php echo stats_h(mn_analytics_format_duration($ref['avg_duration'] !== null ? (int)round((float)$ref['avg_duration']) : null)); ?></td>
								</tr>
							<?php endforeach; ?>
							</tbody>
						</table>
					</div>
				<?php else: ?>
					<div class="empty">No data.</div>
				<?php endif; ?>
			</div>
			<div class="card">
				<h2>Time on page</h2>
				<div class="bars">
					<?php foreach ($bucketData as $bucket): $w = $bucket['views'] > 0 ? max(2, 100 * $bucket['views'] / $bucketMax) : 0; ?>
						<div class="bar-row">
							<div class="bar-label"><?php echo stats_h($bucket['label']); ?></div>
							<div class="bar-track"><div class="bar-fill" style="width: <?php echo stats_h(number_format($w, 1, '.', '')); ?>%"></div></div>
							<div class="bar-num"><?php echo mn_analytics_format_number($bucket['views']); ?></div>
						</div>
					<?php endforeach; ?>
				</div>
			</div>
			<div class="card">
				<h2>Scroll depth</h2>
				<div class="bars">
					<?php foreach ($scrollBuckets as $bucket): $w = $bucket['views'] > 0 ? max(2, 100 * $bucket['views'] / $scrollBucketMax) : 0; ?>
						<div class="bar-row">
							<div class="bar-label"><?php echo stats_h($bucket['label']); ?></div>
							<div class="bar-track"><div class="bar-fill bar-fill--sky" style="width: <?php echo stats_h(number_format($w, 1, '.', '')); ?>%"></div></div>
							<div class="bar-num"><?php echo mn_analytics_format_number($bucket['views']); ?></div>
						</div>
					<?php endforeach; ?>
				</div>
			</div>
		</div>

		<div class="grid-3" id="tech" data-tab-group="tech">
			<div class="card">
				<h2>Browser</h2>
				<div class="chart-cap">Share</div>
				<div id="chart-browser-mix" class="chart mini" role="img" aria-label="Browser share"></div>
				<?php if ($browsers): ?>
					<div class="table-wrap">
						<table aria-label="Browser breakdown">
							<thead><tr><th>Browser</th><th class="num">Views</th><th class="num">Share</th><th class="num">Avg. duration</th><th class="num">Bounce</th></tr></thead>
							<tbody>
							<?php foreach ($browsers as $row): $share = $views > 0 ? 100 * (int)$row['views'] / $views : 0; $k = (int)$row['known']; $br = $k > 0 ? 100 * (int)$row['bounces'] / $k : null; $brClass = stats_bounce_class($br); ?>
								<tr>
									<td><a href="?<?php echo stats_h(stats_query(['browser' => $row['browser'], 'page' => 1])); ?>"><?php echo stats_h(stats_browser_label($row)); ?></a></td>
									<td class="num"><?php echo mn_analytics_format_number((int)$row['views']); ?></td>
									<td class="num"><?php echo stats_h(number_format($share, 1, '.', ',')); ?> %</td>
									<td class="num"><?php echo stats_h(mn_analytics_format_duration($row['avg_duration'] !== null ? (int)round((float)$row['avg_duration']) : null)); ?></td>
									<td class="num <?php echo $brClass; ?>"><?php echo $br !== null ? stats_h(number_format($br, 1, '.', ',')) . ' %' : '—'; ?></td>
								</tr>
							<?php endforeach; ?>
							</tbody>
						</table>
					</div>
				<?php else: ?>
					<div class="empty">No data.</div>
				<?php endif; ?>
			</div>
			<div class="card">
				<h2>Operating system</h2>
				<div class="chart-cap">Share</div>
				<div id="chart-os-mix" class="chart mini" role="img" aria-label="Operating system share"></div>
				<?php if ($osRows): ?>
					<div class="table-wrap">
						<table aria-label="Operating system breakdown">
							<thead><tr><th>OS</th><th class="num">Views</th><th class="num">Share</th><th class="num">Avg. duration</th><th class="num">Bounce</th></tr></thead>
							<tbody>
							<?php foreach ($osRows as $row): $share = $views > 0 ? 100 * (int)$row['views'] / $views : 0; $k = (int)$row['known']; $br = $k > 0 ? 100 * (int)$row['bounces'] / $k : null; $brClass = stats_bounce_class($br); ?>
								<tr>
									<td><a href="?<?php echo stats_h(stats_query(['os' => $row['os'], 'page' => 1])); ?>"><?php echo stats_h(stats_os_label($row)); ?></a></td>
									<td class="num"><?php echo mn_analytics_format_number((int)$row['views']); ?></td>
									<td class="num"><?php echo stats_h(number_format($share, 1, '.', ',')); ?> %</td>
									<td class="num"><?php echo stats_h(mn_analytics_format_duration($row['avg_duration'] !== null ? (int)round((float)$row['avg_duration']) : null)); ?></td>
									<td class="num <?php echo $brClass; ?>"><?php echo $br !== null ? stats_h(number_format($br, 1, '.', ',')) . ' %' : '—'; ?></td>
								</tr>
							<?php endforeach; ?>
							</tbody>
						</table>
					</div>
				<?php else: ?>
					<div class="empty">No data.</div>
				<?php endif; ?>
			</div>
			<div class="card">
				<h2>Devices</h2>
				<div class="chart-cap">Share</div>
				<div id="chart-device-mix" class="chart mini" role="img" aria-label="Device share"></div>
				<?php if ($deviceRows): ?>
					<div class="table-wrap">
						<table aria-label="Device breakdown">
							<thead><tr><th>Device</th><th class="num">Views</th><th class="num">Share</th><th class="num">Avg. duration</th><th class="num">Bounce</th></tr></thead>
							<tbody>
							<?php foreach ($deviceRows as $row): $share = $views > 0 ? 100 * (int)$row['views'] / $views : 0; $k = (int)$row['known']; $br = $k > 0 ? 100 * (int)$row['bounces'] / $k : null; $brClass = stats_bounce_class($br); ?>
								<tr>
									<td><a href="?<?php echo stats_h(stats_query(['device' => $row['device'], 'page' => 1])); ?>"><?php echo stats_h(stats_device_label((string)$row['device'])); ?></a></td>
									<td class="num"><?php echo mn_analytics_format_number((int)$row['views']); ?></td>
									<td class="num"><?php echo stats_h(number_format($share, 1, '.', ',')); ?> %</td>
									<td class="num"><?php echo stats_h(mn_analytics_format_duration($row['avg_duration'] !== null ? (int)round((float)$row['avg_duration']) : null)); ?></td>
									<td class="num <?php echo $brClass; ?>"><?php echo $br !== null ? stats_h(number_format($br, 1, '.', ',')) . ' %' : '—'; ?></td>
								</tr>
							<?php endforeach; ?>
							</tbody>
						</table>
					</div>
				<?php else: ?>
					<div class="empty">No data.</div>
				<?php endif; ?>
			</div>
		</div>

		<div class="grid-2even" data-tab-group="tech">
			<div class="card">
				<h2>Bots detected <span class="hint">· click a reason</span></h2>
				<?php if ($botReasons): ?>
					<p class="ref"><?php echo mn_analytics_format_number($botTotal); ?> bot pageviews in the selected period. Click a reason to see the matching rule.</p>
					<div class="table-wrap">
						<table aria-label="Bot reasons">
							<thead><tr><th>Detected as</th><th class="num">Views</th><th class="num">Share of bots</th></tr></thead>
							<tbody>
							<?php foreach ($botReasons as $bot): $reason = trim((string)($bot['bot_reason'] ?? '')); $reasonLabel = $reason !== '' ? $reason : 'Unknown bot'; $botViews = (int)$bot['views']; $botShare = $botTotal > 0 ? 100 * $botViews / $botTotal : 0; ?>
								<tr>
									<td><button type="button" class="bot-reason" data-reason="<?php echo stats_h($reasonLabel); ?>"><?php echo stats_h($reasonLabel); ?></button> <a class="slug" href="?<?php echo stats_h(stats_query(['bot_reason' => $reason, 'page' => 1])); ?>">filter</a></td>
									<td class="num"><?php echo mn_analytics_format_number($botViews); ?></td>
									<td class="num"><?php echo stats_h(number_format($botShare, 1, '.', ',')); ?> %</td>
								</tr>
							<?php endforeach; ?>
							</tbody>
						</table>
					</div>
				<?php else: ?>
					<div class="empty">No bot traffic in the selected period.</div>
				<?php endif; ?>
			</div>
			<div class="card">
				<h2>How bot detection works</h2>
				<p class="ref">Bots are classified at page render time from the User-Agent. Only the coarse reason is stored; the raw User-Agent is never stored. Click a reason in the table or a raw row to see the matching rule.</p>
				<details class="details" style="margin:0;background:var(--bg);">
					<summary>Show all <?php echo count($botRules); ?> bot rules</summary>
					<div class="body">
						<div class="table-wrap">
							<table aria-label="Bot detection rules">
								<thead><tr><th>Reason</th><th>Rule</th></tr></thead>
								<tbody>
								<?php foreach ($botRules as $rule): ?>
									<tr><td><?php echo stats_h($rule['label']); ?></td><td><?php echo stats_h($rule['hint']); ?></td></tr>
								<?php endforeach; ?>
								</tbody>
							</table>
						</div>
					</div>
				</details>
			</div>
		</div>

		<div class="card" id="storage" data-tab-group="storage">
			<h2>Storage &amp; backup</h2>
			<div class="grid-2even" style="margin-bottom:0">
				<div>
					<table aria-label="Analytics storage">
						<tbody>
							<tr><td>Database file</td><td class="mono"><code style="word-break:break-all;"><?php echo stats_h($dbPath); ?></code></td></tr>
							<tr><td>Directory</td><td class="mono"><code style="word-break:break-all;"><?php echo stats_h($dbDir); ?></code></td></tr>
							<tr><td>Source</td><td class="mono"><?php echo stats_h($dbSource); ?></td></tr>
							<tr><td>Web server user</td><td class="mono"><code><?php echo stats_h($webUser); ?></code></td></tr>
							<tr><td>Web root</td><td class="mono"><?php if ($dbInsideWebroot): ?><span class="badge <?php echo $dbProtected ? 'ok' : 'warn'; ?>"><?php echo $dbProtected ? 'inside / protected' : 'inside / unprotected'; ?></span><?php else: ?><span class="badge ok">outside</span><?php endif; ?></td></tr>
							<tr><td>Writable</td><td class="mono"><?php if ($dbDirWritable && $dbFileWritable): ?><span class="badge ok">yes</span><?php else: ?><span class="badge warn">no</span><?php endif; ?></td></tr>
							<tr><td>Journal mode</td><td class="mono">DELETE (single file)</td></tr>
							<tr><td>Retention</td><td class="mono">730 days</td></tr>
						</tbody>
					</table>
				</div>
				<div>
					<p class="ref">The SQLite file is self-contained. The backup button creates a consistent copy. Pending random tokens may be included in a snapshot, but they are not linked to a person. To move it: copy the file, set <code>db_path</code> in <code>blog/lib/analytics_config.php</code>, and set the permissions. To reset analytics, stop writes and delete the SQLite file at the path above; the next request recreates an empty database.</p>
					<p class="ref" style="margin-top:10px">To stop tracking immediately, create <code style="word-break:break-all;"><?php echo stats_h(mn_analytics_disabled_file()); ?></code> (gitignored and denied by <code>.htaccess</code>). Tracking, health warnings and cleanup stop; existing data is opened read-only. Delete the file to re-enable.</p>
					<form method="post" action="" class="inline" style="margin-top:10px">
						<input type="hidden" name="action" value="backup">
						<input type="hidden" name="csrf" value="<?php echo stats_h(stats_csrf()); ?>">
						<button type="submit" class="btn btn-primary">Download SQLite backup</button>
					</form>
					<details class="details" style="margin:14px 0 0;background:var(--bg);">
						<summary>Move the database to another directory</summary>
						<div class="body">
							<p>Run these commands, then update <code>blog/lib/analytics_config.php</code>:</p>
							<pre><code><?php echo stats_h(implode("\n", $moveCommands)); ?></code></pre>
						</div>
					</details>
				</div>
			</div>
		</div>

		<div class="card" data-tab-group="referrers">
			<h2>When people read <span class="hint">· Berlin time, last <?php echo (int)$heatSpan; ?> days</span></h2>
			<?php if ($views > 0): ?>
				<div class="heat-wrap">
					<table class="heat" aria-label="Views by day and hour, Berlin time">
						<thead>
							<tr>
								<th></th>
								<?php for ($h = 0; $h < 24; $h++): ?><th><?php echo str_pad((string)$h, 2, '0', STR_PAD_LEFT); ?></th><?php endfor; ?>
							</tr>
						</thead>
						<tbody>
						<?php foreach ($heatDays as $heatDay => $cells): ?>
							<tr>
								<th><?php echo stats_h(stats_day_label((string)$heatDay)); ?></th>
								<?php for ($h = 0; $h < 24; $h++): $c = (int)($cells[$h] ?? 0); $alpha = $heatMax > 0 ? 0.05 + 0.95 * ($c / $heatMax) : 0.05; $bg = 'rgba(233,170,96,' . number_format($alpha, 3, '.', '') . ')'; $txt = $c === 0 ? 'transparent' : ($alpha > 0.6 ? '#0b1220' : 'rgba(226,232,240,.9)'); ?>
									<td style="background: <?php echo stats_h($bg); ?>; color: <?php echo stats_h($txt); ?>;" title="<?php echo stats_h((string)$heatDay . ', ' . str_pad((string)$h, 2, '0', STR_PAD_LEFT) . ':00 — ' . $c . ' views'); ?>"><span><?php echo $c; ?></span></td>
								<?php endfor; ?>
							</tr>
						<?php endforeach; ?>
						</tbody>
					</table>
				</div>
				<div class="heat-legend">
					<span class="heat-swatch" style="background: rgba(233,170,96,0.05)"></span> 0
					<span class="heat-swatch" style="background: rgba(233,170,96,0.55)"></span> <?php echo mn_analytics_format_number((int)ceil($heatMax / 2)); ?>
					<span class="heat-swatch" style="background: rgba(233,170,96,1)"></span> <?php echo mn_analytics_format_number($heatMax); ?>
				</div>
			<?php else: ?>
				<div class="empty">No data.</div>
			<?php endif; ?>
		</div>

		<div class="grid-2even" data-tab-group="overview" data-slide="3" id="quality">
			<div class="card">
				<h2>Data confidence</h2>
				<div class="confidence">
					<div class="conf-row"><span>Duration known</span><div class="conf-track"><div class="conf-fill" style="width: <?php echo stats_h(number_format($confidenceDuration, 1, '.', '')); ?>%"></div></div><span><?php echo stats_h(number_format($confidenceDuration, 1, '.', ',')); ?> %</span></div>
					<div class="conf-row"><span>Scroll known</span><div class="conf-track"><div class="conf-fill bar-fill--sky" style="width: <?php echo stats_h(number_format($confidenceScroll, 1, '.', '')); ?>%"></div></div><span><?php echo stats_h(number_format($confidenceScroll, 1, '.', ',')); ?> %</span></div>
					<div class="conf-row"><span>Bot share</span><div class="conf-track"><div class="conf-fill bar-fill--rose" style="width: <?php echo stats_h(number_format($confidenceBots, 1, '.', '')); ?>%"></div></div><span><?php echo stats_h(number_format($confidenceBots, 1, '.', ',')); ?> %</span></div>
				</div>
				<p class="ref" style="margin: 10px 0 14px;"><?php echo mn_analytics_format_number($pending); ?> open tokens are still waiting for a completion signal; they close after at most 6 hours.</p>
				<table aria-label="Data quality">
					<tbody>
						<tr><td>Total rows</td><td class="num mono"><?php echo mn_analytics_format_number($rowsTotal); ?></td></tr>
						<tr><td>In filter</td><td class="num mono"><?php echo mn_analytics_format_number($views); ?></td></tr>
						<tr><td>Duration known</td><td class="num mono"><?php echo mn_analytics_format_number($known); ?></td></tr>
						<tr><td>Scroll known</td><td class="num mono"><?php echo mn_analytics_format_number($scrollKnown); ?></td></tr>
						<tr><td>Active days</td><td class="num mono"><?php echo mn_analytics_format_number($activeDays); ?> / <?php echo mn_analytics_format_number($periodDays); ?></td></tr>
						<tr><td>Estimated visits</td><td class="num mono"><?php echo mn_analytics_format_number($entries); ?></td></tr>
						<tr><td>Open tokens</td><td class="num mono"><?php echo mn_analytics_format_number($pending); ?></td></tr>
						<tr><td>Bots</td><td class="num mono"><?php echo mn_analytics_format_number($bots); ?></td></tr>
						<tr><td>Oldest entry</td><td class="num mono"><?php echo $oldest !== null ? stats_h(stats_time_label($oldest)) : '—'; ?></td></tr>
						<tr><td>Newest entry</td><td class="num mono"><?php echo $newest !== null ? stats_h(stats_time_label($newest)) : '—'; ?></td></tr>
						<tr><td>DB size</td><td class="num mono"><?php echo stats_h(number_format($dbSize / 1024, 1, '.', ',')); ?> KB</td></tr>
						<tr><td>Retention</td><td class="num mono">730 days</td></tr>
					</tbody>
				</table>
			</div>
			<div class="card">
				<h2>What these numbers mean</h2>
				<ul class="ref">
					<li><strong>Views</strong> = every rendered page (including without JavaScript).</li>
					<li><strong>Estimated visits</strong> = views with a direct, external, search or social referrer (entry pageviews). This is the most honest consent-free proxy for visits; it is not a unique-person count.</li>
					<li><strong>Views / day, peak hour, peak weekday</strong> = aggregates over the selected range in Berlin time. “Peak” means the hour/weekday with the most pageviews. Hover the rhythm bars for both pageviews and estimated visits.</li>
					<li><strong>Page performance</strong> = views, share, entries, internal navigation, duration, scroll, bounce and last activity per page. Pages without views stay visible with 0 so you can see what nobody reads.</li>
					<li><strong>Page transitions</strong> = a view whose previous page was another blog page. The matrix shows immediate from → to transitions (including cycles); the flow view omits weaker cycle-closing edges. These are not complete visitor journeys: a page can be a source simply because it was the previous page. Entry pages show where visits actually start.</li>
					<li><strong>Duration</strong> = visible time in the tab, measured in milliseconds in the browser and transmitted in seconds. No cross-page tracking.</li>
					<li><strong>Scroll depth</strong> = the maximum share of the page height a reader reached. Useful to see whether people get to the end.</li>
					<li><strong>Section reading map</strong> = share of pageviews that made each heading visible, plus average visible dwell. It is based only on pageviews with section data; older rows predate this logging.</li>
					<li><strong>Interaction signals</strong> = aggregate counts of internal link targets, external domains (not full URLs), citation keys, code languages, search use/result positions, quiz question IDs + correctness, lab runs, downloads and media. They are not per-person journeys.</li>
					<li><strong>Reading speed</strong> = approximate words per minute from the lesson word count divided by active time. Treat it as a comparative signal, not an exact measurement.</li>
					<li><strong>Content health / cohorts</strong> = transparent sub-scores and aggregate source/device profiles derived from existing pageviews. “Humans only” excludes rows whose User-Agent matched a bot.</li>
					<li><strong>Bots</strong> = pageviews whose User-Agent matched a known bot or automation signature. Only the coarse reason label is stored. Click a reason in Tech or a raw row to see the matching rule.</li>
					<li><strong>Open tokens</strong> = pageviews whose completion signal has not arrived yet. They are closed after at most 6 hours and the token is deleted.</li>
					<li><strong>Browser/OS/device</strong> = coarse categories from the User-Agent (read transiently, never stored): browser family + major version, operating system + version, desktop/mobile/tablet/bot. No minor/patch versions, no device IDs, no fingerprint.</li>
					<li><strong>No unique visitors:</strong> that would require a persistent identifier (cookie/storage) and therefore consent. This analytics deliberately does not do that.</li>
				</ul>
			</div>
		</div>

		<div class="card" id="raw-data" data-tab-group="raw">
			<h2>Raw data <span class="hint">· <?php echo (int)$perPage; ?> per page, without tokens</span></h2>
			<div class="table-wrap table-scroll">
				<table aria-label="Raw pageviews">
					<thead><tr><th>Time</th><th>Page</th><th>Browser / OS</th><th>Source</th><th>Previous</th><th class="num">Duration</th><th class="num">Scroll</th><th>Status</th></tr></thead>
					<tbody>
					<?php if ($raw): ?>
						<?php foreach ($raw as $row): ?>
							<tr>
								<td class="mono"><?php echo stats_h($row['day'] . ', ' . str_pad((string)$row['hour'], 2, '0', STR_PAD_LEFT) . ':00'); ?></td>
								<td class="path">
									<span class="title"><?php echo stats_h($titles[$row['path']] ?? $row['path']); ?></span>
									<div class="slug"><?php echo stats_h($row['path']); ?></div>
								</td>
								<td>
									<?php if ((int)$row['is_bot'] === 1): ?>
										<?php $reason = trim((string)($row['bot_reason'] ?? '')); $reasonLabel = $reason !== '' ? $reason : 'Unknown bot'; ?>
											<button type="button" class="bot-reason" data-reason="<?php echo stats_h($reasonLabel); ?>"><?php echo stats_h($reasonLabel); ?></button>
											<div class="slug">bot</div>
									<?php else: ?>
										<span class="title"><?php echo stats_h(stats_browser_label($row)); ?></span>
										<div class="slug"><?php echo stats_h(stats_client_subline($row)); ?></div>
									<?php endif; ?>
								</td>
								<td><?php echo stats_h(mn_analytics_ref_type_label($row['ref_type'])); ?><?php if ($row['ref_source'] !== ''): ?><div class="slug"><?php echo stats_h($row['ref_source']); ?></div><?php endif; ?></td>
								<td><?php echo $row['ref_path'] !== '' ? stats_h($titles[$row['ref_path']] ?? $row['ref_path']) : '—'; ?></td>
								<td class="num"><?php echo stats_h(mn_analytics_format_duration($row['duration_sec'] !== null ? (int)$row['duration_sec'] : null)); ?></td>
								<td class="num"><?php echo $row['scroll_pct'] !== null ? (int)$row['scroll_pct'] . ' %' : '—'; ?></td>
								<td><?php echo ((int)$row['completed'] === 1) ? '<span class="badge">ok</span>' : '<span class="badge external">open</span>'; ?></td>
							</tr>
						<?php endforeach; ?>
					<?php else: ?>
						<tr><td colspan="8"><div class="empty">No data in the selected period.</div></td></tr>
					<?php endif; ?>
					</tbody>
				</table>
			</div>
			<?php if ($pageCount > 1): ?>
				<div class="pager">
					<span>Page <?php echo (int)$pageNum; ?> of <?php echo (int)$pageCount; ?></span>
					<?php if ($pageNum > 1): ?><a href="?<?php echo stats_h(stats_query(['page' => $pageNum - 1])); ?>#raw-data">← Previous</a><?php endif; ?>
					<?php if ($pageNum < $pageCount): ?><a href="?<?php echo stats_h(stats_query(['page' => $pageNum + 1])); ?>#raw-data">Next →</a><?php endif; ?>
				</div>
			<?php endif; ?>
			<form method="post" action="" class="inline" style="margin-top:12px">
				<input type="hidden" name="action" value="export">
				<input type="hidden" name="csrf" value="<?php echo stats_h(stats_csrf()); ?>">
				<button type="submit" class="btn">Export CSV (current filter)</button>
			</form>
		</div>

		<details class="details" id="privacy" data-tab-group="privacy">
			<summary>Privacy &amp; technology</summary>
			<div class="body">
				<h3>What is stored</h3>
				<ul>
					<li>Timestamp rounded to the hour (stored in UTC, displayed in Berlin time).</li>
					<li>Page slug (e.g. <code>history</code>), without query parameters.</li>
					<li>Referrer type and source: direct, internal (previous lesson), search, social or external. For external referrers only the host, never the path or search term.</li>
					<li>Active visible time on page in seconds and maximum scroll depth in percent.</li>
					<li>Coarse client categories: browser family + major version, operating system + version, device class (desktop/mobile/tablet/bot), bot flag and a coarse bot reason label (e.g. Googlebot, curl, Headless Chrome). The User-Agent is read only transiently for this and never stored.</li>
					<li>Section-level reading: section index, a short heading key/label, maximum heading visibility and dwell time. No scroll pixels, no text body and no visitor identity.</li>
					<li>Aggregate interaction events: internal-link target slug, external domain (not full URL), citation key, code language, search used/result count/clicked result position, quiz question ID + correctness, lab ID, download type and media type. Targets are bounded and stripped of query strings.</li>
					<li>A transient random token per pageview that joins heartbeats and the page's section/event details; it is deleted on completion or after at most 6 hours.</li>
				</ul>
				<h3>What is not stored</h3>
				<ul>
					<li>No IP addresses, no full User-Agent strings, no device or browser fingerprints, no exact minor/patch versions.</li>
					<li>Visitor analytics sets no cookies, no localStorage, no sessionStorage and no persistent IDs.</li>
					<li>No external paths, queries, search terms, raw search queries, full external URLs or campaign parameters.</li>
					<li>No free-text form contents, no per-person quiz answers and no cross-page recognition or profiling. Quiz data is only question ID + aggregate correctness.</li>
				</ul>
				<p>The login page sets a technically necessary session cookie, a signed admin-indicator cookie (only to show the health warning to the operator), and optionally the exclusion cookie for the owner’s own visits. The dashboard stores only the active tab, the light/dark theme preference and named filter views in localStorage; they are operator-only UI state, not analytics. These concern only the operator and are never sent to visitors.</p>
				<h3>Why this works without consent</h3>
				<p>§ 25 TDDDG requires consent for storing information on the device or accessing it. This analytics sets no cookies and no web storage, reads no stored information and uses only transient runtime data. The User-Agent is part of the normal HTTP request and is processed only transiently; only coarse, non-personal categories are stored. No personal data within the meaning of Art. 4 GDPR is processed: no IP, no identifier, no identifiability (see Recital 26 GDPR). DNT and Global Privacy Control are respected.</p>
				<p>The counting itself is a pure pageview count; duration and scroll depth are anonymous aggregate attributes. A cross-page “unique visitor” identifier is deliberately omitted because it would require a persistent identifier and therefore consent.</p>
				<h3>Limits</h3>
				<p>Apache access logs may contain IP addresses. That is independent of this analytics. For complete IP freedom, server logs must be anonymized or disabled. Example of a LogFormat without IP in the Apache configuration:</p>
				<pre><code>LogFormat "%t \"%r\" %>s %b" noip
CustomLog ${APACHE_LOG_DIR}/access.log noip</code></pre>
				<h3>Existing blog features</h3>
				<p>Theme, interests, progress, quests and reader mode already use their own cookies or localStorage. This analytics does not add any further cookies or storage entries.</p>
				<h3>Sources</h3>
				<ul>
					<li><a href="https://www.gesetze-im-internet.de/ttdsg/__25.html" target="_blank" rel="noopener noreferrer">§ 25 TDDDG</a></li>
					<li><a href="https://gdpr-info.eu/recitals/no-26/" target="_blank" rel="noopener noreferrer">GDPR, Recital 26 (anonymous data)</a></li>
					<li><a href="https://www.datenschutzkonferenz-online.de/media/oh/20211220_oh_telemedien.pdf" target="_blank" rel="noopener noreferrer">DSK, Telemedia Guidance (2021)</a></li>
				</ul>
			</div>
		</details>

		<dialog id="bot-dialog" class="bot-dialog" aria-labelledby="bot-dialog-title">
			<form method="dialog"><button type="submit" class="btn" style="float:right;margin-left:12px;">Close</button></form>
			<h3 id="bot-dialog-title">Bot detection</h3>
			<p id="bot-dialog-text"></p>
		</dialog>

<dialog id="saved-views-dialog" class="bot-dialog" aria-labelledby="saved-views-title">
			<form method="dialog"><button type="submit" class="btn" style="float:right;margin-left:12px;">Close</button></form>
			<h3 id="saved-views-title">Saved views</h3>
			<div id="saved-views-list"></div>
		</dialog>
<div class="footer"><a href="#top">Back to top ↑</a> · Anonymous visitor analytics · no IPs · no visitor cookies · no persistent IDs · UA read transiently · DNT/GPC respected</div>
	<?php endif; ?>

<?php endif; ?>
</div><!-- /#analytics-view -->
</div>
<?php if ($authed): ?>
<?php
$presentationReactions = mn_feedback_reactions();
$presentationReactionColors = [
	'helpful' => 'var(--emerald)',
	'unhelpful' => 'var(--rose)',
	'insight' => 'var(--coral)',
	'confusing' => 'var(--sky)',
	'bug' => '#c084fc',
];
$presentationFeedbackTotal = array_sum($feedbackReactionCounts);
$presentationHasFeedback = $presentationFeedbackTotal > 0;
$presentationHasAnalytics = $views > 0;
$presentationTrafficValues = array_values(array_map('intval', array_slice($seriesCurrent, -30)));
$presentationTrafficLabels = array_values(array_slice($seriesLabels, -30));
$presentationTrafficSvg = stats_presentation_line_svg($presentationTrafficValues);
$presentationTrafficMax = $presentationTrafficValues ? max($presentationTrafficValues) : 0;
$presentationTrafficPeakLabel = '';
if ($presentationTrafficValues) {
	$presentationTrafficPeakIndex = array_search($presentationTrafficMax, $presentationTrafficValues, true);
	if ($presentationTrafficPeakIndex !== false && isset($presentationTrafficLabels[$presentationTrafficPeakIndex])) {
		$presentationTrafficPeakLabel = (string)$presentationTrafficLabels[$presentationTrafficPeakIndex];
	}
}
$presentationTopPages = array_slice($topPages, 0, 6);
$presentationTopPageMax = 1;
foreach ($presentationTopPages as $presentationTopPage) {
	$presentationTopPageMax = max($presentationTopPageMax, (int)$presentationTopPage['views']);
}
$presentationExternalReferrers = array_slice($externalReferrers, 0, 8);
$presentationHasSources = $presentationExternalReferrers !== [] || array_sum($refCounts) > 0;
$presentationFeedbackTrendTotal = 0;
$presentationFeedbackDayTotals = [];
foreach ($presentationFeedbackDaily['labels'] as $presentationDayIndex => $presentationDayLabel) {
	$presentationDayTotal = 0;
	foreach ($presentationFeedbackDaily['series'] as $presentationSeries) {
		$presentationDayTotal += (int)($presentationSeries['data'][$presentationDayIndex] ?? 0);
	}
	$presentationFeedbackDayTotals[$presentationDayIndex] = $presentationDayTotal;
	$presentationFeedbackTrendTotal += $presentationDayTotal;
}
$presentationFeedbackTrendMax = $presentationFeedbackDayTotals ? max($presentationFeedbackDayTotals) : 0;
$presentationLast7 = array_sum(array_slice($presentationTrafficValues, -7));
$presentationPrev7 = array_sum(array_slice($presentationTrafficValues, -14, 7));
$presentationTrafficDelta = $presentationPrev7 > 0 ? 100 * ($presentationLast7 - $presentationPrev7) / $presentationPrev7 : null;
$presentationTrafficDeltaClass = $presentationTrafficDelta === null ? 'flat' : ($presentationTrafficDelta > 0.5 ? 'up' : ($presentationTrafficDelta < -0.5 ? 'down' : 'flat'));
$presentationTrafficDeltaLabel = $presentationTrafficDelta === null ? ($presentationLast7 > 0 ? 'first 7-day window' : 'no views yet') : ($presentationTrafficDelta > 0 ? '+' : '') . number_format($presentationTrafficDelta, 1, '.', ',') . ' % vs previous 7 days';
$presentationFeedbackLast7 = array_sum(array_slice($presentationFeedbackDayTotals, -7));
$presentationFeedbackPrev7 = array_sum(array_slice($presentationFeedbackDayTotals, -14, 7));
$presentationFeedbackDelta = $presentationFeedbackPrev7 > 0 ? 100 * ($presentationFeedbackLast7 - $presentationFeedbackPrev7) / $presentationFeedbackPrev7 : null;
$presentationFeedbackDeltaClass = $presentationFeedbackDelta === null ? 'flat' : ($presentationFeedbackDelta > 0.5 ? 'up' : ($presentationFeedbackDelta < -0.5 ? 'down' : 'flat'));
$presentationFeedbackDeltaLabel = $presentationFeedbackDelta === null ? ($presentationFeedbackLast7 > 0 ? 'first 7-day window' : 'no reactions yet') : ($presentationFeedbackDelta > 0 ? '+' : '') . number_format($presentationFeedbackDelta, 1, '.', ',') . ' % vs previous 7 days';
$presentationTopPage = $presentationTopPages[0] ?? null;
$presentationTopPageShare = ($presentationTopPage && $views > 0) ? 100 * (int)$presentationTopPage['views'] / $views : 0;
$presentationTopPageDuration = ($presentationTopPage && $presentationTopPage['avg_duration'] !== null) ? (float)$presentationTopPage['avg_duration'] : null;
$presentationTopPageDurationRatio = ($presentationTopPageDuration !== null && $avgDuration !== null && $avgDuration > 0) ? $presentationTopPageDuration / $avgDuration : null;
$presentationDeepRead = 0.0;
if ($views > 0 && isset($funnelData[3]['value'])) {
	$presentationDeepRead = 100 * (int)$funnelData[3]['value'] / $views;
}
$presentationHelpful = (int)($feedbackReactionCounts['helpful'] ?? 0);
$presentationUnhelpful = (int)($feedbackReactionCounts['unhelpful'] ?? 0);
$presentationHelpfulSample = $presentationHelpful + $presentationUnhelpful;
$presentationHelpfulRate = $presentationHelpfulSample > 0 ? 100 * $presentationHelpful / $presentationHelpfulSample : null;
$presentationTopNegativePage = null;
$presentationTopHelpfulPage = null;
foreach ($presentationFeedbackPages as $presentationPageRow) {
	if ($presentationTopNegativePage === null && (int)$presentationPageRow['negative'] > 0) {
		$presentationTopNegativePage = $presentationPageRow;
	}
	if ($presentationTopHelpfulPage === null || (int)$presentationPageRow['helpful'] > (int)$presentationTopHelpfulPage['helpful']) {
		$presentationTopHelpfulPage = $presentationPageRow;
	}
}
$presentationSearchShare = $views > 0 ? 100 * (int)($refCounts['search'] ?? 0) / $views : 0;
$presentationSocialShare = $views > 0 ? 100 * (int)($refCounts['social'] ?? 0) / $views : 0;
$presentationExternalShare = $views > 0 ? 100 * (int)($refCounts['external'] ?? 0) / $views : 0;
$presentationDirectShare = $views > 0 ? 100 * (int)($refCounts['direct'] ?? 0) / $views : 0;
$presentationInsightTraffic = 'Last 7 days: ' . mn_analytics_format_number($presentationLast7) . ' views · ' . $presentationTrafficDeltaLabel . '.';
if ($presentationTrafficPeakLabel !== '') {
	$presentationInsightTraffic .= ' Peak: ' . $presentationTrafficPeakLabel . ' (' . mn_analytics_format_number($presentationTrafficMax) . ').';
}
$presentationFunnel = [];
foreach ($funnelData as $presentationFunnelRow) {
	$presentationFunnel[] = [
		'label' => (string)($presentationFunnelRow['name'] ?? ''),
		'value' => (int)($presentationFunnelRow['value'] ?? 0),
	];
}
$presentationFunnelMax = 1;
foreach ($presentationFunnel as $presentationFunnelRow) {
	$presentationFunnelMax = max($presentationFunnelMax, $presentationFunnelRow['value']);
}
$presentationFunnelBase = $presentationFunnel ? max(1, $presentationFunnel[0]['value']) : 0;
$presentationInsightFunnel = '';
foreach ($presentationFunnel as $presentationFunnelIndex => $presentationFunnelRow) {
	$presentationShare = $presentationFunnelBase > 0 ? 100 * $presentationFunnelRow['value'] / $presentationFunnelBase : 0;
	if ($presentationFunnelIndex === 0) {
		$presentationInsightFunnel .= mn_analytics_format_number($presentationFunnelRow['value']) . ' pageviews';
	} elseif ($presentationFunnelIndex === 1) {
		$presentationInsightFunnel .= ' → ' . number_format($presentationShare, 1, '.', ',') . ' % stay at least 10 s';
	} elseif ($presentationFunnelIndex === 2) {
		$presentationInsightFunnel .= ' → ' . number_format($presentationShare, 1, '.', ',') . ' % also reach 50 % scroll';
	} else {
		$presentationInsightFunnel .= ' → ' . number_format($presentationShare, 1, '.', ',') . ' % reach 75 % scroll';
	}
}
$presentationInsightAudience = 'Average time on page ' . mn_analytics_format_duration($avgDuration !== null ? (int)round($avgDuration) : null)
	. ' · ' . number_format($presentationDeepRead, 1, '.', ',') . ' % reach 75% scroll'
	. ' · bounce rate ' . number_format($bounceRate, 1, '.', ',') . ' %.';
$presentationInsightPages = $presentationTopPage
	? ($titles[$presentationTopPage['path']] ?? $presentationTopPage['path']) . ' accounts for ' . number_format($presentationTopPageShare, 1, '.', ',') . ' % of views and '
		. ($presentationTopPageDurationRatio !== null ? number_format($presentationTopPageDurationRatio, 2, '.', ',') . '× the site average reading time.' : 'is the most-read page.')
	: 'No page-level traffic yet.';
$presentationInternalShare = $views > 0 ? 100 * (int)$internal / $views : 0;
$presentationInsightDiscovery = 'Search ' . number_format($presentationSearchShare, 1, '.', ',') . ' %, social ' . number_format($presentationSocialShare, 1, '.', ',')
	. ' %, external ' . number_format($presentationExternalShare, 1, '.', ',') . ' %, direct ' . number_format($presentationDirectShare, 1, '.', ',')
	. ' %, internal lesson-to-lesson ' . number_format($presentationInternalShare, 1, '.', ',') . ' %.'
	. ($presentationExternalReferrers ? ' Top external: ' . (($presentationExternalReferrers[0]['ref_host'] !== '') ? $presentationExternalReferrers[0]['ref_host'] : $presentationExternalReferrers[0]['ref_source']) . '.' : '');
$presentationInsightFeedback = $presentationHelpfulRate !== null
	? 'Helpful rate ' . number_format($presentationHelpfulRate, 0, '.', ',') . ' % (' . $presentationHelpful . ' 👍 / ' . $presentationUnhelpful . ' 👎' . ($presentationHelpfulSample < 5 ? ', small sample' : '') . ')'
		. ($presentationTopNegativePage ? ' · most friction: ' . $presentationTopNegativePage['title'] . '.' : '.')
	: 'Reader reactions are still sparse.';
$presentationInsightFeedbackTrend = 'Last 7 days: ' . mn_analytics_format_number($presentationFeedbackLast7) . ' reactions · ' . $presentationFeedbackDeltaLabel . '.';
$presentationInsightImprove = $presentationTopNegativePage
	? $presentationTopNegativePage['title'] . ' is the clearest revision target: ' . (int)$presentationTopNegativePage['negative'] . ' negative reactions.'
	: 'No negative-feedback hotspot detected yet.';
$presentationMixStops = [];
if ($presentationFeedbackTotal > 0) {
	$presentationMixAccum = 0.0;
	foreach ($presentationReactions as $presentationKey => $presentationMeta) {
		$presentationCount = (int)($feedbackReactionCounts[$presentationKey] ?? 0);
		if ($presentationCount <= 0) {
			continue;
		}
		$presentationStart = $presentationMixAccum;
		$presentationMixAccum += 100 * $presentationCount / $presentationFeedbackTotal;
		$presentationMixStops[] = $presentationReactionColors[$presentationKey] . ' ' . number_format($presentationStart, 2, '.', '') . '% ' . number_format($presentationMixAccum, 2, '.', '') . '%';
	}
}
$presentationInsights = [];
foreach ($feedbackLatest as $presentationLatest) {
	$presentationText = trim((string)($presentationLatest['comment'] ?? ''));
	if ($presentationText === '') {
		$presentationText = trim((string)($presentationLatest['selected_text'] ?? ''));
	}
	$presentationText = preg_replace('/\s+/u', ' ', $presentationText) ?? '';
	if ($presentationText === '') {
		continue;
	}
	$presentationInsights[] = [
		'text' => mb_substr($presentationText, 0, 320, 'UTF-8'),
		'reaction' => (string)($presentationLatest['reaction'] ?? ''),
		'path' => (string)($presentationLatest['path'] ?? ''),
		'ts' => (int)($presentationLatest['ts'] ?? 0),
	];
	if (count($presentationInsights) >= 6) {
		break;
	}
}
$presentationSignals = [];
foreach ($headlineInsights as $presentationHeadline) {
	$presentationSignals[] = ['label' => 'Pattern', 'text' => (string)$presentationHeadline];
}
foreach (($topMovers['up'] ?? []) as $presentationMover) {
	$presentationSignals[] = [
		'label' => 'Rising',
		'text' => ($titles[$presentationMover['slug']] ?? $presentationMover['slug']) . ': +' . mn_analytics_format_number((int)$presentationMover['delta']) . ' views vs previous period.',
	];
}
foreach (($topMovers['down'] ?? []) as $presentationMover) {
	$presentationSignals[] = [
		'label' => 'Falling',
		'text' => ($titles[$presentationMover['slug']] ?? $presentationMover['slug']) . ': ' . mn_analytics_format_number((int)$presentationMover['delta']) . ' views vs previous period.',
	];
}
foreach ($contentHealth as $presentationHealth) {
	if (empty($presentationHealth['flags'])) {
		continue;
	}
	$presentationSignals[] = [
		'label' => 'Content health',
		'text' => $presentationHealth['label'] . ': ' . implode(', ', array_map('strval', $presentationHealth['flags'])) . '.',
	];
}
$presentationSignals = array_slice($presentationSignals, 0, 6);
$presentationTakeaways = [];
if ($presentationFeedbackPages) {
	$presentationNegativePage = $presentationFeedbackPages[0];
	if ((int)$presentationNegativePage['negative'] > 0) {
		$presentationTakeaways[] = [
			'label' => 'Needs attention',
			'text' => $presentationNegativePage['title'] . ' has ' . (int)$presentationNegativePage['negative'] . ' unhelpful, confusing or bug reactions.',
		];
	}
	$presentationHelpfulPage = $presentationFeedbackPages[0];
	foreach ($presentationFeedbackPages as $presentationPageRow) {
		if ((int)$presentationPageRow['helpful'] > (int)$presentationHelpfulPage['helpful']) {
			$presentationHelpfulPage = $presentationPageRow;
		}
	}
	if ((int)$presentationHelpfulPage['helpful'] > 0) {
		$presentationTakeaways[] = [
			'label' => 'Working well',
			'text' => $presentationHelpfulPage['title'] . ' has ' . (int)$presentationHelpfulPage['helpful'] . ' “helpful” reactions.',
		];
	}
}
if ((int)$feedbackSummary['bugs'] > 0) {
	$presentationTakeaways[] = [
		'label' => 'Bugs',
		'text' => (int)$feedbackSummary['bugs'] . ' reader bug reports are waiting in the Bugs tab.',
	];
}
if ($avgDuration !== null) {
	$presentationTakeaways[] = [
		'label' => 'Reading time',
		'text' => 'Readers spend an average of ' . mn_analytics_format_duration((int)round($avgDuration)) . ' on a page.',
	];
}
if ($presentationExternalReferrers) {
	$presentationTakeaways[] = [
		'label' => 'Discovery',
		'text' => 'Top external referrer: ' . ($presentationExternalReferrers[0]['ref_host'] !== '' ? $presentationExternalReferrers[0]['ref_host'] : $presentationExternalReferrers[0]['ref_source']) . ' (' . mn_analytics_format_number((int)$presentationExternalReferrers[0]['views']) . ' views).',
	];
}
$presentationTakeaways = array_slice($presentationTakeaways, 0, 4);
$presentationTitleInsight = mn_analytics_format_number($views) . ' views across ' . mn_analytics_format_number($distinctPages) . ' pages'
	. ($presentationFeedbackTotal > 0 ? ' · ' . mn_analytics_format_number($presentationFeedbackTotal) . ' reader reactions' : '')
	. ($presentationTopPage ? ' · most-read: ' . ($titles[$presentationTopPage['path']] ?? $presentationTopPage['path']) . '.' : '.');
?>
<div id="mn-present" class="mn-pres" hidden aria-hidden="true" tabindex="-1" role="dialog" aria-label="Analytics and reader feedback presentation">
	<div class="mn-pres-progress"></div>
	<div class="mn-pres-stage">
		<section class="mn-pres-slide" data-title="Title" style="--slide-accent: var(--accent);">
			<div class="mn-pres-kicker">asanAI · From Nothing to ChatGPT</div>
			<h1>What readers do — and <em>what they tell us</em></h1>
			<p class="mn-pres-lead">Live course analytics and reader feedback: reach, reading time, discovery, reactions, and the ideas that should shape the next revision.</p>
			<div class="mn-pres-meta"><?php echo stats_h($nowLabel); ?> · Berlin · anonymous, no visitor profiles</div>
			<div class="mn-pres-hero-stats">
				<div class="mn-pres-stat"><b><?php echo stats_h(mn_analytics_format_number($views)); ?></b><span>views</span></div>
				<div class="mn-pres-stat"><b><?php echo stats_h(mn_analytics_format_number($entries)); ?></b><span>estimated visits</span></div>
				<div class="mn-pres-stat"><b><?php echo stats_h(mn_analytics_format_number($presentationFeedbackTotal)); ?></b><span>reader reactions</span></div>
			</div>
			<div class="mn-pres-agenda"><span>Reach</span><span>Attention</span><span>Discovery</span><span>Reader voice</span></div>
			<div class="mn-pres-insight"><span>In one sentence</span><div><?php echo stats_h($presentationTitleInsight); ?></div></div>
		</section>

		<?php if ($presentationHasAnalytics): ?>
		<section class="mn-pres-slide" data-title="Audience" style="--slide-accent: var(--sky);">
			<h2>Audience <small>· selected period</small></h2>
			<div class="mn-pres-kpis">
				<div class="mn-pres-kpi"><b><?php echo stats_h(mn_analytics_format_number($views)); ?></b><span>views</span><small><?php echo stats_h(number_format($viewsPerDay, 1, '.', ',')); ?> per day</small></div>
				<div class="mn-pres-kpi"><b><?php echo stats_h(mn_analytics_format_number($entries)); ?></b><span>estimated visits</span><small><?php echo stats_h(number_format($entryShare, 1, '.', ',')); ?> % of views</small></div>
				<div class="mn-pres-kpi"><b><?php echo stats_h(mn_analytics_format_number($todayViews)); ?></b><span>views today</span><small><?php echo stats_h($todayDeltaHtml); ?></small></div>
				<div class="mn-pres-kpi"><b><?php echo stats_h(mn_analytics_format_duration($avgDuration !== null ? (int)round($avgDuration) : null)); ?></b><span>average time on page</span><small>median <?php echo stats_h(mn_analytics_format_duration($medianDuration)); ?></small></div>
				<div class="mn-pres-kpi"><b><?php echo $avgScroll !== null ? stats_h(number_format($avgScroll, 0, '.', ',')) . ' %' : '—'; ?></b><span>average scroll depth</span><small><?php echo stats_h(mn_analytics_format_number($scrollKnown)); ?> measurements</small></div>
				<div class="mn-pres-kpi"><b><?php echo stats_h(mn_analytics_format_number($activeDays)); ?></b><span>active days</span><small><?php echo stats_h(mn_analytics_format_number($periodDays)); ?> days in range</small></div>
				<div class="mn-pres-kpi"><b><?php echo stats_h(mn_analytics_format_number($bots)); ?></b><span>bot pageviews</span><small><?php echo stats_h(number_format($views > 0 ? 100 * $bots / $views : 0, 1, '.', ',')); ?> % of traffic</small></div>
			</div>
			<div class="mn-pres-insight"><span>Reading</span><div><?php echo stats_h($presentationInsightAudience); ?></div></div>
		</section>
		<?php endif; ?>

		<?php if ($presentationTrafficSvg !== ''): ?>
		<section class="mn-pres-slide" data-title="Views over time" style="--slide-accent: var(--accent);">
			<h2>Views over time <small>· last 30 days</small> <span class="mn-pres-delta <?php echo stats_h($presentationTrafficDeltaClass); ?>"><?php echo stats_h($presentationTrafficDeltaLabel); ?></span></h2>
			<div class="mn-pres-line"><?php echo $presentationTrafficSvg; ?></div>
			<div class="mn-pres-axis"><span><?php echo stats_h($presentationTrafficLabels[0] ?? ''); ?></span><span><?php echo stats_h($presentationTrafficLabels[(int)floor((count($presentationTrafficLabels) - 1) / 2)] ?? ''); ?></span><span><?php echo stats_h($presentationTrafficLabels[count($presentationTrafficLabels) - 1] ?? ''); ?></span></div>
			<div class="mn-pres-insight"><span>Trend</span><div><?php echo stats_h($presentationInsightTraffic); ?></div></div>
		</section>
		<?php endif; ?>

		<?php if ($presentationFunnelBase > 0): ?>
		<section class="mn-pres-slide" data-title="Reading depth" style="--slide-accent: var(--emerald);">
			<h2>How deeply people read <small>· selected period</small></h2>
			<div class="mn-pres-funnel">
				<?php foreach ($presentationFunnel as $presentationFunnelIndex => $presentationFunnelRow): $presentationFunnelShare = 100 * $presentationFunnelRow['value'] / $presentationFunnelBase; ?>
					<div class="mn-pres-funnel-row">
						<span><?php echo stats_h($presentationFunnelRow['label']); ?></span>
						<div class="mn-pres-funnel-track"><div class="mn-pres-funnel-fill" style="width: <?php echo stats_h(number_format(100 * $presentationFunnelRow['value'] / $presentationFunnelMax, 2, '.', '')); ?>%"></div></div>
						<b><?php echo stats_h(number_format($presentationFunnelShare, 1, '.', ',')); ?> %</b>
					</div>
				<?php endforeach; ?>
			</div>
			<div class="mn-pres-insight"><span>Attention</span><div><?php echo stats_h($presentationInsightFunnel); ?></div></div>
		</section>
		<?php endif; ?>

		<?php if ($presentationTopPages): ?>
		<section class="mn-pres-slide" data-title="Time on page" style="--slide-accent: var(--emerald);">
			<h2>Where readers spend time</h2>
			<table class="mn-pres-table">
				<thead><tr><th>Page</th><th>Views</th><th>Avg. time</th><th>Scroll</th><th class="mn-pres-bar-cell">Reach</th></tr></thead>
				<tbody>
				<?php foreach ($presentationTopPages as $presentationPage): $presentationPagePath = (string)$presentationPage['path']; $presentationPageViews = (int)$presentationPage['views']; ?>
					<tr>
						<td class="mn-pres-page-title"><?php echo stats_h($titles[$presentationPagePath] ?? $presentationPagePath); ?></td>
						<td><?php echo stats_h(mn_analytics_format_number($presentationPageViews)); ?></td>
						<td><?php echo stats_h(mn_analytics_format_duration($presentationPage['avg_duration'] !== null ? (int)round((float)$presentationPage['avg_duration']) : null)); ?></td>
						<td><?php echo $presentationPage['avg_scroll'] !== null ? stats_h(number_format((float)$presentationPage['avg_scroll'], 0, '.', ',')) . ' %' : '—'; ?></td>
						<td class="mn-pres-bar-cell"><div class="mn-pres-mini-bar"><i style="width: <?php echo stats_h(number_format(100 * $presentationPageViews / max(1, $presentationTopPageMax), 1, '.', '')); ?>%"></i></div></td>
					</tr>
				<?php endforeach; ?>
				</tbody>
			</table>
			<div class="mn-pres-insight"><span>Concentration</span><div><?php echo stats_h($presentationInsightPages); ?></div></div>
		</section>
		<?php endif; ?>

		<?php if ($presentationHasSources): ?>
		<section class="mn-pres-slide" data-title="Discovery" style="--slide-accent: var(--coral);">
			<h2>Where readers come from</h2>
			<div class="mn-pres-kpis">
				<div class="mn-pres-kpi"><b><?php echo stats_h(mn_analytics_format_number((int)($refCounts['direct'] ?? 0))); ?></b><span>direct</span></div>
				<div class="mn-pres-kpi"><b><?php echo stats_h(mn_analytics_format_number((int)($refCounts['search'] ?? 0))); ?></b><span>search</span></div>
				<div class="mn-pres-kpi"><b><?php echo stats_h(mn_analytics_format_number((int)($refCounts['social'] ?? 0))); ?></b><span>social</span></div>
				<div class="mn-pres-kpi"><b><?php echo stats_h(mn_analytics_format_number((int)($refCounts['external'] ?? 0))); ?></b><span>external sites</span></div>
			</div>
			<?php if ($presentationExternalReferrers): ?>
			<div class="mn-pres-list">
				<?php foreach ($presentationExternalReferrers as $presentationRef): $presentationRefName = (string)($presentationRef['ref_host'] !== '' ? $presentationRef['ref_host'] : $presentationRef['ref_source']); ?>
					<div class="mn-pres-list-row"><span><?php echo stats_h($presentationRefName); ?></span><strong><?php echo stats_h(mn_analytics_format_number((int)$presentationRef['views'])); ?></strong></div>
				<?php endforeach; ?>
			</div>
			<?php endif; ?>
			<div class="mn-pres-insight"><span>Mix</span><div><?php echo stats_h($presentationInsightDiscovery); ?></div></div>
		</section>
		<?php endif; ?>

		<?php if ($presentationSignals): ?>
		<section class="mn-pres-slide" data-title="Signals" style="--slide-accent: var(--sky);">
			<h2>Signals worth a closer look</h2>
			<div class="mn-pres-takeaways">
				<?php foreach ($presentationSignals as $presentationSignal): ?>
					<div class="mn-pres-takeaway"><b><?php echo stats_h($presentationSignal['label']); ?></b><?php echo stats_h($presentationSignal['text']); ?></div>
				<?php endforeach; ?>
			</div>
		</section>
		<?php endif; ?>

		<?php if ($presentationHasFeedback): ?>
		<section class="mn-pres-slide" data-title="Reader feedback" style="--slide-accent: var(--rose);">
			<h2>Reader feedback <small>· all time · how readers experienced the course</small></h2>
			<div class="mn-pres-split">
				<div class="mn-pres-mix">
					<div class="mn-pres-donut" style="background: conic-gradient(<?php echo stats_h(implode(', ', $presentationMixStops)); ?>)">
						<div class="mn-pres-donut-center"><b><?php echo stats_h(mn_analytics_format_number($presentationFeedbackTotal)); ?></b><span>reactions</span></div>
					</div>
					<div class="mn-pres-legend">
						<?php foreach ($presentationReactions as $presentationKey => $presentationMeta): $presentationCount = (int)($feedbackReactionCounts[$presentationKey] ?? 0); ?>
							<div class="mn-pres-legend-row"><span class="mn-pres-dot" style="--dot: <?php echo stats_h($presentationReactionColors[$presentationKey]); ?>"></span><span><?php echo stats_h($presentationMeta['icon'] . ' ' . $presentationMeta['label']); ?></span><b><?php echo stats_h(mn_analytics_format_number($presentationCount)); ?></b></div>
						<?php endforeach; ?>
					</div>
				</div>
				<div class="mn-pres-side">
					<div class="mn-pres-kpis mn-pres-kpis--two">
						<div class="mn-pres-kpi"><b><?php echo stats_h(mn_analytics_format_number((int)$feedbackSummary['with_comment'])); ?></b><span>with comment</span></div>
						<div class="mn-pres-kpi"><b><?php echo stats_h(mn_analytics_format_number((int)$feedbackSummary['bugs'])); ?></b><span>bug reports</span></div>
						<div class="mn-pres-kpi"><b><?php echo stats_h(mn_analytics_format_number((int)$feedbackSummary['accepted'])); ?></b><span>accepted</span></div>
						<div class="mn-pres-kpi"><b><?php echo stats_h(mn_analytics_format_number((int)$feedbackSummary['done'])); ?></b><span>done</span></div>
					</div>
				</div>
			</div>
			<div class="mn-pres-insight"><span>What it means</span><div><?php echo stats_h($presentationInsightFeedback); ?></div></div>
		</section>
		<?php endif; ?>

		<?php if ($presentationFeedbackTrendTotal > 0 && $presentationFeedbackTrendMax > 0): ?>
		<section class="mn-pres-slide" data-title="Feedback over time" style="--slide-accent: var(--sky);">
			<h2>Feedback over time <small>· last 30 days</small> <span class="mn-pres-delta <?php echo stats_h($presentationFeedbackDeltaClass); ?>"><?php echo stats_h($presentationFeedbackDeltaLabel); ?></span></h2>
			<div class="mn-pres-stacked-wrap">
				<div class="mn-pres-stacked">
					<?php foreach ($presentationFeedbackDaily['labels'] as $presentationDayIndex => $presentationDayLabel): $presentationDayTotal = (int)($presentationFeedbackDayTotals[$presentationDayIndex] ?? 0); ?>
						<div class="mn-pres-bar-col" style="height: <?php echo stats_h(number_format(100 * $presentationDayTotal / $presentationFeedbackTrendMax, 2, '.', '')); ?>%" title="<?php echo stats_h($presentationDayLabel . ': ' . $presentationDayTotal); ?>">
							<?php foreach ($presentationFeedbackDaily['series'] as $presentationSeriesKey => $presentationSeries): $presentationSeriesCount = (int)($presentationSeries['data'][$presentationDayIndex] ?? 0); if ($presentationSeriesCount <= 0) continue; ?>
								<span class="mn-pres-seg" style="flex: <?php echo $presentationSeriesCount; ?> 1 0; --seg: <?php echo stats_h($presentationReactionColors[$presentationSeriesKey]); ?>"></span>
							<?php endforeach; ?>
						</div>
					<?php endforeach; ?>
				</div>
				<div class="mn-pres-stacked-axis"><span><?php echo stats_h($presentationFeedbackDaily['labels'][0] ?? ''); ?></span><span><?php echo stats_h($presentationFeedbackDaily['labels'][14] ?? ''); ?></span><span><?php echo stats_h($presentationFeedbackDaily['labels'][29] ?? ''); ?></span></div>
			</div>
			<div class="mn-pres-legend mn-pres-legend--inline">
				<?php foreach ($presentationReactions as $presentationKey => $presentationMeta): ?>
					<div class="mn-pres-legend-row"><span class="mn-pres-dot" style="--dot: <?php echo stats_h($presentationReactionColors[$presentationKey]); ?>"></span><span><?php echo stats_h($presentationMeta['icon'] . ' ' . $presentationMeta['label']); ?></span></div>
				<?php endforeach; ?>
			</div>
			<div class="mn-pres-insight"><span>Signal</span><div><?php echo stats_h($presentationInsightFeedbackTrend); ?></div></div>
		</section>
		<?php endif; ?>

		<?php if ($presentationInsights): ?>
		<section class="mn-pres-slide" data-title="What readers say" style="--slide-accent: var(--coral);">
			<h2>What readers say <small>· <?php echo count($presentationInsights); ?> recent comments</small></h2>
			<div class="mn-pres-quotes">
				<?php foreach ($presentationInsights as $presentationInsight): $presentationMeta = $presentationReactions[$presentationInsight['reaction']] ?? ['icon' => '', 'label' => $presentationInsight['reaction']]; ?>
					<figure class="mn-pres-quote">
						<blockquote>“<?php echo stats_h($presentationInsight['text']); ?>”</blockquote>
						<figcaption><b><?php echo stats_h($presentationMeta['icon'] . ' ' . $presentationMeta['label']); ?></b> · <?php echo stats_h($titles[$presentationInsight['path']] ?? $presentationInsight['path']); ?> · <?php echo stats_h(stats_time_label($presentationInsight['ts'])); ?></figcaption>
					</figure>
				<?php endforeach; ?>
			</div>
		</section>
		<?php endif; ?>

		<?php if ($presentationFeedbackPages): ?>
		<section class="mn-pres-slide" data-title="Where to improve" style="--slide-accent: var(--rose);">
			<h2>Where readers need help <small>· all time</small></h2>
			<table class="mn-pres-table">
				<thead><tr><th>Page</th><th>Total</th><th>👍</th><th>👎</th><th>❓</th><th>🐞</th><th>Negative</th></tr></thead>
				<tbody>
				<?php foreach ($presentationFeedbackPages as $presentationFeedbackPage): ?>
					<tr>
						<td class="mn-pres-page-title"><?php echo stats_h($presentationFeedbackPage['title']); ?></td>
						<td><?php echo (int)$presentationFeedbackPage['total']; ?></td>
						<td><?php echo (int)$presentationFeedbackPage['helpful']; ?></td>
						<td><?php echo (int)$presentationFeedbackPage['unhelpful']; ?></td>
						<td><?php echo (int)$presentationFeedbackPage['confusing']; ?></td>
						<td><?php echo (int)$presentationFeedbackPage['bug']; ?></td>
						<td><?php echo (int)$presentationFeedbackPage['negative']; ?></td>
					</tr>
				<?php endforeach; ?>
				</tbody>
			</table>
			<div class="mn-pres-insight"><span>Priority</span><div><?php echo stats_h($presentationInsightImprove); ?></div></div>
		</section>
		<?php endif; ?>

		<?php if ($presentationTakeaways): ?>
		<section class="mn-pres-slide" data-title="Takeaways" style="--slide-accent: var(--accent);">
			<h2>Takeaways</h2>
			<div class="mn-pres-takeaways">
				<?php foreach ($presentationTakeaways as $presentationTakeaway): ?>
					<div class="mn-pres-takeaway"><b><?php echo stats_h($presentationTakeaway['label']); ?></b><?php echo stats_h($presentationTakeaway['text']); ?></div>
				<?php endforeach; ?>
			</div>
		</section>
		<?php endif; ?>

		<section class="mn-pres-slide" data-title="Thank you" style="--slide-accent: var(--sky);">
			<div class="mn-pres-kicker">Thank you</div>
			<h1>Questions, ideas, next revisions.</h1>
			<p class="mn-pres-lead">The full dashboard is behind this presentation. Use the arrow keys or space to move, <b>O</b> for the overview, <b>F</b> for fullscreen and <b>Esc</b> to close.</p>
		</section>
	</div>

	<div class="mn-pres-controls">
		<button type="button" class="mn-pres-btn" data-present-prev aria-label="Previous slide">←</button>
		<span class="mn-pres-counter">1 / 1</span>
		<span class="mn-pres-slide-title"></span>
		<button type="button" class="mn-pres-btn" data-present-overview>Overview</button>
		<button type="button" class="mn-pres-btn" data-present-fullscreen>Fullscreen</button>
		<button type="button" class="mn-pres-btn" data-present-next aria-label="Next slide">→</button>
		<button type="button" class="mn-pres-btn" data-present-exit>Exit</button>
	</div>
	<div class="mn-pres-hint">← → / Space · O overview · F fullscreen · Esc close</div>
	<div class="mn-pres-overview" role="dialog" aria-label="Slide overview">
		<h2>Slides</h2>
		<div class="mn-pres-overview-grid"></div>
	</div>
</div>

<script>
(function () {
	'use strict';
	var button = document.getElementById('copy-insights');
	if (!button) {
		return;
	}
	button.addEventListener('click', function () {
		var text = Array.prototype.map.call(document.querySelectorAll('.insight-list li'), function (item) {
			return '• ' + item.textContent;
		}).join('\n');
		if (!text) {
			return;
		}
		var done = function () {
			button.textContent = 'Copied';
			setTimeout(function () { button.textContent = 'Copy summary'; }, 1600);
		};
		var fallback = function () {
			var area = document.createElement('textarea');
			area.value = text;
			area.setAttribute('readonly', '');
			area.style.position = 'fixed';
			area.style.opacity = '0';
			document.body.appendChild(area);
			area.select();
			try {
				document.execCommand('copy');
				done();
			} catch (ignored) {}
			document.body.removeChild(area);
		};
		if (navigator.clipboard && navigator.clipboard.writeText) {
			navigator.clipboard.writeText(text).then(done, fallback);
		} else {
			fallback();
		}
	});
})();
</script>
<script src="echarts.min.js?v=<?php echo (int)@filemtime(__DIR__ . '/echarts.min.js'); ?>"></script>
<script>
(function () {
	'use strict';
	if (!window.echarts) {
		return;
	}
	var labels = <?php echo json_encode($seriesLabels, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_HEX_TAG | JSON_HEX_AMP | JSON_HEX_APOS | JSON_HEX_QUOT); ?>;
	var current = <?php echo json_encode($seriesCurrent, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_HEX_TAG | JSON_HEX_AMP | JSON_HEX_APOS | JSON_HEX_QUOT); ?>;
	var entries = <?php echo json_encode($seriesEntries, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_HEX_TAG | JSON_HEX_AMP | JSON_HEX_APOS | JSON_HEX_QUOT); ?>;
	var previous = <?php echo json_encode($seriesPrev, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_HEX_TAG | JSON_HEX_AMP | JSON_HEX_APOS | JSON_HEX_QUOT); ?>;
	var refs = <?php echo json_encode([
		['name' => 'Direct', 'value' => $refCounts['direct']],
		['name' => 'Internal', 'value' => $refCounts['internal']],
		['name' => 'Search', 'value' => $refCounts['search']],
		['name' => 'Social', 'value' => $refCounts['social']],
		['name' => 'External', 'value' => $refCounts['external']],
	], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_HEX_TAG | JSON_HEX_AMP | JSON_HEX_APOS | JSON_HEX_QUOT); ?>;
	var pages = <?php echo json_encode($chartPages, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_HEX_TAG | JSON_HEX_AMP | JSON_HEX_APOS | JSON_HEX_QUOT); ?>;
	var pageShare = <?php echo json_encode($pageShareData, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_HEX_TAG | JSON_HEX_AMP | JSON_HEX_APOS | JSON_HEX_QUOT); ?>;
	var sankeyLinks = <?php echo json_encode($sankeyLinks, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_HEX_TAG | JSON_HEX_AMP | JSON_HEX_APOS | JSON_HEX_QUOT); ?>;
	var sankeyNodes = <?php echo json_encode($sankeyNodes, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_HEX_TAG | JSON_HEX_AMP | JSON_HEX_APOS | JSON_HEX_QUOT); ?>;
	var sankeyTitles = <?php echo json_encode($titles, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_HEX_TAG | JSON_HEX_AMP | JSON_HEX_APOS | JSON_HEX_QUOT); ?>;
	var transitionSources = <?php echo json_encode($transitionSources, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_HEX_TAG | JSON_HEX_AMP | JSON_HEX_APOS | JSON_HEX_QUOT); ?>;
	var transitionTargets = <?php echo json_encode($transitionTargets, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_HEX_TAG | JSON_HEX_AMP | JSON_HEX_APOS | JSON_HEX_QUOT); ?>;
	var transitionSourceSlugs = <?php echo json_encode($transitionSourceSlugs, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_HEX_TAG | JSON_HEX_AMP | JSON_HEX_APOS | JSON_HEX_QUOT); ?>;
	var transitionTargetSlugs = <?php echo json_encode($transitionTargetSlugs, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_HEX_TAG | JSON_HEX_AMP | JSON_HEX_APOS | JSON_HEX_QUOT); ?>;
	var transitionMatrixData = <?php echo json_encode($transitionMatrixData, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_HEX_TAG | JSON_HEX_AMP | JSON_HEX_APOS | JSON_HEX_QUOT); ?>;
	var botHints = <?php echo json_encode($botHints, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_HEX_TAG | JSON_HEX_AMP | JSON_HEX_APOS | JSON_HEX_QUOT); ?>;
	var browserMix = <?php echo json_encode($browserMix, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_HEX_TAG | JSON_HEX_AMP | JSON_HEX_APOS | JSON_HEX_QUOT); ?>;
	var osMix = <?php echo json_encode($osMix, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_HEX_TAG | JSON_HEX_AMP | JSON_HEX_APOS | JSON_HEX_QUOT); ?>;
	var deviceMix = <?php echo json_encode($deviceMix, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_HEX_TAG | JSON_HEX_AMP | JSON_HEX_APOS | JSON_HEX_QUOT); ?>;
	var clockLabels = <?php echo json_encode($clockLabels, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_HEX_TAG | JSON_HEX_AMP | JSON_HEX_APOS | JSON_HEX_QUOT); ?>;
	var clockViews = <?php echo json_encode($clockViews, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_HEX_TAG | JSON_HEX_AMP | JSON_HEX_APOS | JSON_HEX_QUOT); ?>;
	var clockEntries = <?php echo json_encode($clockEntries, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_HEX_TAG | JSON_HEX_AMP | JSON_HEX_APOS | JSON_HEX_QUOT); ?>;
	var clockCurrentHour = <?php echo (int)$currentHour; ?>;
	var clockPeakHour = <?php echo $peakHour !== null ? (int)$peakHour : 'null'; ?>;
	var attention = <?php echo json_encode($attentionData, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_HEX_TAG | JSON_HEX_AMP | JSON_HEX_APOS | JSON_HEX_QUOT); ?>;
	var funnel = <?php echo json_encode($funnelData, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_HEX_TAG | JSON_HEX_AMP | JSON_HEX_APOS | JSON_HEX_QUOT); ?>;
	var contentTreemapData = <?php echo json_encode($contentTreemap, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_HEX_TAG | JSON_HEX_AMP | JSON_HEX_APOS | JSON_HEX_QUOT); ?>;
	var sourceTreemapData = <?php echo json_encode($sourceTreemap, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_HEX_TAG | JSON_HEX_AMP | JSON_HEX_APOS | JSON_HEX_QUOT); ?>;
	var calendarData = <?php echo json_encode($calendarData, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_HEX_TAG | JSON_HEX_AMP | JSON_HEX_APOS | JSON_HEX_QUOT); ?>;
	var calendarStart = <?php echo json_encode($calendarStart, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_HEX_TAG | JSON_HEX_AMP | JSON_HEX_APOS | JSON_HEX_QUOT); ?>;
	var calendarEnd = <?php echo json_encode($calendarEnd, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_HEX_TAG | JSON_HEX_AMP | JSON_HEX_APOS | JSON_HEX_QUOT); ?>;
	var calendarMax = <?php echo (int)$calendarMax; ?>;
	var botHumanLabels = <?php echo json_encode($botHumanLabels, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_HEX_TAG | JSON_HEX_AMP | JSON_HEX_APOS | JSON_HEX_QUOT); ?>;
	var botHumanHumans = <?php echo json_encode($botHumanHumans, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_HEX_TAG | JSON_HEX_AMP | JSON_HEX_APOS | JSON_HEX_QUOT); ?>;
	var botHumanBots = <?php echo json_encode($botHumanBots, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_HEX_TAG | JSON_HEX_AMP | JSON_HEX_APOS | JSON_HEX_QUOT); ?>;
	var pageSourceData = <?php echo json_encode($pageSourceData, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_HEX_TAG | JSON_HEX_AMP | JSON_HEX_APOS | JSON_HEX_QUOT); ?>;
	var pageSourcePages = <?php echo json_encode($pageSourcePages, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_HEX_TAG | JSON_HEX_AMP | JSON_HEX_APOS | JSON_HEX_QUOT); ?>;
	var pageSourceSources = <?php echo json_encode($pageSourceSources, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_HEX_TAG | JSON_HEX_AMP | JSON_HEX_APOS | JSON_HEX_QUOT); ?>;
	var pageSourceSlugs = <?php echo json_encode($pageSourcePageKeys, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_HEX_TAG | JSON_HEX_AMP | JSON_HEX_APOS | JSON_HEX_QUOT); ?>;
	var pageSourceSourceFilters = <?php echo json_encode($pageSourceSourceFilters, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_HEX_TAG | JSON_HEX_AMP | JSON_HEX_APOS | JSON_HEX_QUOT); ?>;
	var seriesDayKeys = <?php echo json_encode($seriesDayKeys, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_HEX_TAG | JSON_HEX_AMP | JSON_HEX_APOS | JSON_HEX_QUOT); ?>;
	var anomalies = <?php echo json_encode($seriesAnomalies, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_HEX_TAG | JSON_HEX_AMP | JSON_HEX_APOS | JSON_HEX_QUOT); ?>;
	var currentQuery = <?php echo json_encode(stats_query(['page' => 1]), JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_HEX_TAG | JSON_HEX_AMP | JSON_HEX_APOS | JSON_HEX_QUOT); ?>;
	var statsBase = window.__MNStatsBase;
	if (!statsBase || statsBase.indexOf('__MN_STATS_') === 0) {
		statsBase = 'stats.php';
	}

	function truncateLabel(value, maxLength) {
		if (value.length <= maxLength) {
			return value;
		}
		return value.slice(0, maxLength - 1) + '…';
	}

	function htmlEscape(value) {
		return String(value).replace(/[&<>"']/g, function (character) {
			return {
				'&': '&amp;',
				'<': '&lt;',
				'>': '&gt;',
				'"': '&quot;',
				"'": '&#39;'
			}[character];
		});
	}

	function pieOption(data, colors) {
		return {
			backgroundColor: 'transparent',
			color: colors,
			tooltip: {
				trigger: 'item',
				formatter: function (params) {
					return htmlEscape(params.name) + ': ' + params.value + ' (' + params.percent + '%)';
				},
				backgroundColor: '#0b1220',
				borderColor: '#243047',
				textStyle: { color: '#e2e8f0' }
			},
			legend: {
				type: 'scroll',
				orient: 'horizontal',
				bottom: 0,
				left: 'center',
				textStyle: { color: '#94a3b8', fontSize: 10 },
				itemWidth: 9,
				itemHeight: 9
			},
			series: [{
				type: 'pie',
				radius: ['40%', '62%'],
				center: ['50%', '42%'],
				avoidLabelOverlap: true,
				itemStyle: { borderColor: '#111c31', borderWidth: 2 },
				label: { show: false },
				emphasis: {
					label: {
						show: true,
						color: '#e2e8f0',
						fontWeight: 'bold',
						formatter: '{b}\n{d}%'
					}
				},
				data: data
			}]
		};
	}

	function movingAverage(values, windowSize) {
		var out = [];
		for (var i = 0; i < values.length; i++) {
			var from = Math.max(0, i - windowSize + 1);
			var sum = 0;
			var n = 0;
			for (var j = from; j <= i; j++) {
				sum += values[j];
				n++;
			}
			out.push(n ? Math.round(sum / n * 10) / 10 : 0);
		}
		return out;
	}

	var series = [{
		name: 'Views',
		type: 'line',
		smooth: true,
		symbol: 'none',
		data: current,
		lineStyle: { width: 2, color: '#e9aa60' },
		areaStyle: { color: 'rgba(233,170,96,0.16)' },
		itemStyle: { color: '#e9aa60' }
	}];
	var legend = ['Views'];

	if (previous.length && previous.some(function (v) { return v > 0; })) {
		series.push({
			name: 'Previous period',
			type: 'line',
			smooth: true,
			symbol: 'none',
			data: previous,
			lineStyle: { width: 1.5, type: 'dashed', color: '#64748b' },
			itemStyle: { color: '#64748b' }
		});
		legend.push('Previous period');
	}

	series.push({
		name: 'Estimated visits',
		type: 'line',
		smooth: true,
		symbol: 'none',
		data: entries,
		lineStyle: { width: 1.5, type: 'dashed', color: '#38bdf8' },
		itemStyle: { color: '#38bdf8' }
	});
	legend.push('Estimated visits');

	series.push({
		name: '7-day average',
		type: 'line',
		smooth: true,
		symbol: 'none',
		data: movingAverage(current, 7),
		lineStyle: { width: 1.5, type: 'dotted', color: '#34d399' },
		itemStyle: { color: '#34d399' }
	});
	legend.push('7-day average');

	if (anomalies.length && labels.length) {
		series[0].markPoint = {
			symbol: 'circle',
			symbolSize: 25,
			itemStyle: { borderWidth: 0 },
			label: {
				show: true,
				color: '#0b1220',
				fontSize: 11,
				fontWeight: 'bold',
				formatter: function (params) {
					return params.data.labelText;
				}
			},
			data: anomalies.map(function (anomaly) {
				var spike = anomaly.type === 'spike';
				return {
					coord: [labels[anomaly.index], anomaly.value],
					value: anomaly.value,
					labelText: spike ? '▲' : '▼',
					itemStyle: { color: spike ? '#34d399' : '#fb7185' }
				};
			})
		};
	}

	var chartsReady = false;
	var overviewMode = 'briefing';
	var daily = null;
	var refsChart = null;
	var pagesChart = null;
	var pageShareChart = null;
	var sankeyChart = null;
	var transitionMatrixChart = null;
	var browserMixChart = null;
	var osMixChart = null;
	var deviceMixChart = null;
	var clockChart = null;
	var attentionChart = null;
	var funnelChart = null;
	var contentTreemapChart = null;
	var sourceTreemapChart = null;
	var calendarChart = null;
	var botHumanChart = null;
	var pageSourceChart = null;

	function ensureChart(id) {
		var element = document.getElementById(id);
		if (!element) {
			return null;
		}
		var existing = echarts.getInstanceByDom(element);
		if (existing) {
			return existing;
		}
		if (element.offsetParent === null || element.offsetWidth < 2 || element.offsetHeight < 2) {
			return null;
		}
		return echarts.init(element);
	}

	function bindChartOnce(chart, eventName, handler) {
		if (!chart) {
			return;
		}
		var flag = '__mnBound' + eventName;
		if (chart[flag]) {
			return;
		}
		chart[flag] = true;
		chart.on(eventName, handler);
	}

	function formatSeconds(value) {
		value = Math.max(0, Math.round(Number(value) || 0));
		if (value < 60) {
			return value + ' s';
		}
		var minutes = Math.floor(value / 60);
		var seconds = value % 60;
		return minutes + ' m' + (seconds ? ' ' + seconds + ' s' : '');
	}

	function urlWith(overrides, hash) {
		var params = new URLSearchParams(currentQuery);
		Object.keys(overrides || {}).forEach(function (key) {
			var value = overrides[key];
			if (value === '' || value === null || value === undefined) {
				params.delete(key);
			} else {
				params.set(key, value);
			}
		});
		params.set('view', 'analytics');
		var query = params.toString();
		return statsBase + (query ? '?' + query : '') + '#' + (hash || 'overview');
	}

	function goWith(overrides, hash) {
		window.location.href = urlWith(overrides, hash);
	}

	function applyFilter(kind, value) {
		if (!kind) {
			return;
		}
		if (kind === 'os' && String(value).toLowerCase() === 'bot') {
			goWith({ os: '', device: 'bot' }, 'tech');
			return;
		}
		if (kind === 'device' && String(value).toLowerCase() === 'bot') {
			goWith({ device: 'bot' }, 'tech');
			return;
		}
		var overrides = {};
		overrides[kind] = value;
		goWith(overrides);
	}

	function resetFilters() {
		var params = new URLSearchParams();
		var current = new URLSearchParams(currentQuery);
		params.set('range', current.get('range') || '30');
		if (current.get('view')) {
			params.set('view', current.get('view'));
		}
		params.set('view', 'analytics');
		window.location.href = statsBase + '?' + params.toString() + '#overview';
	}

	document.addEventListener('click', function (event) {
		var reset = event.target.closest('[data-reset-filters]');
		if (reset) {
			event.preventDefault();
			resetFilters();
			return;
		}
		var target = event.target.closest('[data-filter-kind]');
		if (!target) {
			return;
		}
		event.preventDefault();
		applyFilter(target.getAttribute('data-filter-kind'), target.getAttribute('data-filter-value') || '');
	}, true);

	document.querySelectorAll('.heat-cell').forEach(function (cell) {
		function activate() {
			goWith({
				weekday: cell.getAttribute('data-weekday'),
				hour: cell.getAttribute('data-hour')
			});
		}
		cell.addEventListener('click', activate);
		cell.addEventListener('keydown', function (event) {
			if (event.key === 'Enter' || event.key === ' ') {
				event.preventDefault();
				activate();
			}
		});
	});

	var sectionPageSelect = document.getElementById('section-page-select');
	if (sectionPageSelect) {
		sectionPageSelect.addEventListener('change', function () {
			if (this.value) {
				goWith({ path: this.value });
			}
		});
	}

	(function () {
		var select = document.getElementById('saved-view-select');
		var saveButton = document.getElementById('save-view');
		var manageButton = document.getElementById('manage-views');
		var dialog = document.getElementById('saved-views-dialog');
		var list = document.getElementById('saved-views-list');
		if (!select) {
			return;
		}
		var saved = [];
		try {
			var raw = localStorage.getItem('mn_stats_views');
			var parsed = raw ? JSON.parse(raw) : [];
			if (Array.isArray(parsed)) {
				saved = parsed.map(function (view) {
					if (view && typeof view.name === 'string' && typeof view.query === 'string') {
						return { name: view.name.slice(0, 40), query: view.query };
					}
					if (view && typeof view.n === 'string' && typeof view.q === 'string') {
						return { name: view.n.slice(0, 40), query: view.q };
					}
					return null;
				}).filter(function (view) { return view !== null; }).slice(0, 20);
			}
		} catch (ignored) {
			saved = [];
		}
		function persist() {
			try {
				localStorage.setItem('mn_stats_views', JSON.stringify(saved));
			} catch (ignored) {}
		}
		function applyView(query) {
			if (query) {
				window.location.href = statsBase + '?' + query + '#overview';
			}
		}
		function renderSaved() {
			Array.prototype.slice.call(select.querySelectorAll('option[data-saved]')).forEach(function (option) {
				option.remove();
			});
			saved.forEach(function (view, index) {
				var option = document.createElement('option');
				option.value = view.query;
				option.textContent = 'Saved: ' + view.name;
				option.setAttribute('data-saved', String(index));
				select.appendChild(option);
			});
			if (saved.some(function (view) { return view.query === currentQuery; })) {
				select.value = currentQuery;
			}
		}
		function renderManager() {
			if (!list) {
				return;
			}
			list.innerHTML = '';
			if (!saved.length) {
				var empty = document.createElement('p');
				empty.className = 'ref';
				empty.textContent = 'No saved views yet.';
				list.appendChild(empty);
				return;
			}
			saved.forEach(function (view, index) {
				var row = document.createElement('div');
				row.className = 'saved-view-row';
				var input = document.createElement('input');
				input.type = 'text';
				input.value = view.name;
				input.maxLength = 40;
				input.setAttribute('aria-label', 'View name');
				var apply = document.createElement('button');
				apply.type = 'button';
				apply.className = 'btn btn-primary';
				apply.textContent = 'Apply';
				apply.addEventListener('click', function () { applyView(view.query); });
				var rename = document.createElement('button');
				rename.type = 'button';
				rename.className = 'btn';
				rename.textContent = 'Rename';
				rename.addEventListener('click', function () {
					var name = input.value.trim();
					if (!name) {
						return;
					}
					view.name = name.slice(0, 40);
					persist();
					renderSaved();
					renderManager();
				});
				var remove = document.createElement('button');
				remove.type = 'button';
				remove.className = 'btn';
				remove.textContent = 'Delete';
				remove.addEventListener('click', function () {
					saved.splice(index, 1);
					persist();
					renderSaved();
					renderManager();
				});
				row.appendChild(input);
				row.appendChild(apply);
				row.appendChild(rename);
				row.appendChild(remove);
				list.appendChild(row);
			});
		}
		renderSaved();
		select.addEventListener('change', function () {
			applyView(this.value);
		});
		if (saveButton) {
			saveButton.addEventListener('click', function () {
				var name = window.prompt('Name this view');
				if (!name) {
					return;
				}
				if (saved.length >= 20) {
					saved.shift();
				}
				saved.push({ name: name.trim().slice(0, 40), query: currentQuery });
				persist();
				renderSaved();
				renderManager();
				select.value = currentQuery;
			});
		}
		if (manageButton && dialog) {
			manageButton.addEventListener('click', function () {
				renderManager();
				if (typeof dialog.showModal === 'function') {
					dialog.showModal();
				} else {
					dialog.setAttribute('open', '');
				}
			});
		}
	})();

	function renderCharts() {
		daily = ensureChart('chart-daily');
		refsChart = ensureChart('chart-refs');
		pagesChart = ensureChart('chart-pages');
		pageShareChart = ensureChart('chart-page-share');
		sankeyChart = ensureChart('chart-sankey');
		transitionMatrixChart = ensureChart('chart-transition-matrix');
		browserMixChart = ensureChart('chart-browser-mix');
		osMixChart = ensureChart('chart-os-mix');
		deviceMixChart = ensureChart('chart-device-mix');
		clockChart = ensureChart('chart-clock');
		attentionChart = ensureChart('chart-attention');
		funnelChart = ensureChart('chart-funnel');
		contentTreemapChart = ensureChart('chart-content-treemap');
		sourceTreemapChart = ensureChart('chart-source-treemap');
		calendarChart = ensureChart('chart-calendar');
		botHumanChart = ensureChart('chart-bots-human');
		pageSourceChart = ensureChart('chart-page-source');

	if (daily) {
		daily.setOption({
			backgroundColor: 'transparent',
			color: ['#e9aa60', '#64748b', '#38bdf8', '#34d399'],
			tooltip: {
				trigger: 'axis',
				backgroundColor: '#0b1220',
				borderColor: '#243047',
				textStyle: { color: '#e2e8f0' }
			},
			legend: { data: legend, top: 0, right: 0, textStyle: { color: '#94a3b8', fontSize: 11 } },
			grid: { left: 42, right: 16, top: 42, bottom: 28 },
			xAxis: {
				type: 'category',
				data: labels,
				boundaryGap: false,
				axisLine: { lineStyle: { color: '#243047' } },
				axisTick: { show: false },
				axisLabel: { color: '#94a3b8', fontSize: 10, hideOverlap: true }
			},
			yAxis: {
				type: 'value',
				minInterval: 1,
				splitLine: { lineStyle: { color: 'rgba(36,48,71,0.65)' } },
				axisLabel: { color: '#94a3b8', fontSize: 10 }
			},
			series: series
		});
	}

	if (daily) {
		bindChartOnce(daily, 'click', function (params) {
			if (typeof params.dataIndex === 'number' && seriesDayKeys[params.dataIndex]) {
				goWith({ day: seriesDayKeys[params.dataIndex] });
			}
		});
	}

	if (refsChart) {
		var refData = refs.filter(function (d) { return d.value > 0; });
		refsChart.setOption({
			backgroundColor: 'transparent',
			color: ['#64748b', '#38bdf8', '#34d399', '#fb7185', '#e9aa60'],
			tooltip: {
				trigger: 'item',
				formatter: function (params) { return htmlEscape(params.name) + ': ' + params.value + ' (' + params.percent + '%)'; },
				backgroundColor: '#0b1220',
				borderColor: '#243047',
				textStyle: { color: '#e2e8f0' }
			},
			legend: {
				type: 'scroll',
				orient: 'horizontal',
				bottom: 0,
				left: 'center',
				textStyle: { color: '#94a3b8', fontSize: 10 },
				itemWidth: 9,
				itemHeight: 9
			},
			series: [{
				type: 'pie',
				radius: ['40%', '62%'],
				center: ['50%', '42%'],
				avoidLabelOverlap: true,
				itemStyle: { borderColor: '#111c31', borderWidth: 2 },
				label: { show: false },
				emphasis: {
					label: {
						show: true,
						color: '#e2e8f0',
						fontWeight: 'bold',
						formatter: '{b}\n{d}%'
					}
				},
				data: refData
			}]
		});
		bindChartOnce(refsChart, 'click', function (params) {
			var refTypes = { Direct: 'direct', Internal: 'internal', Search: 'search', Social: 'social', External: 'external' };
			if (refTypes[params.name]) {
				goWith({ ref_type: refTypes[params.name] });
			}
		});
	}

	if (pagesChart && pages.length) {
		pagesChart.setOption({
			backgroundColor: 'transparent',
			tooltip: {
				trigger: 'axis',
				axisPointer: { type: 'shadow' },
				backgroundColor: '#0b1220',
				borderColor: '#243047',
				textStyle: { color: '#e2e8f0' },
				formatter: function (params) {
					var p = params[0];
					var fullName = pages[p.dataIndex] ? pages[p.dataIndex].name : p.name;
					return htmlEscape(fullName) + ': ' + p.value + ' views';
				}
			},
			grid: { left: 190, right: 30, top: 10, bottom: 20 },
			xAxis: {
				type: 'value',
				minInterval: 1,
				splitLine: { lineStyle: { color: 'rgba(36,48,71,0.65)' } },
				axisLabel: { color: '#94a3b8', fontSize: 10 }
			},
			yAxis: {
				type: 'category',
				data: pages.map(function (p) { return truncateLabel(p.name, 30); }),
				axisLine: { lineStyle: { color: '#243047' } },
				axisTick: { show: false },
				axisLabel: { color: '#cbd5e1', fontSize: 11 }
			},
			series: [{
				type: 'bar',
				data: pages.map(function (p) { return p.value; }),
				barMaxWidth: 18,
				itemStyle: { color: '#e9aa60', borderRadius: [0, 4, 4, 0] },
				emphasis: { itemStyle: { color: '#f4c98a' } }
			}]
		});
	}

	if (pagesChart) {
		bindChartOnce(pagesChart, 'click', function (params) {
			if (pages[params.dataIndex] && pages[params.dataIndex].slug) {
				goWith({ path: pages[params.dataIndex].slug });
			}
		});
	}

	if (pageShareChart && pageShare.length) {
		pageShareChart.setOption({
			backgroundColor: 'transparent',
			color: ['#e9aa60', '#38bdf8', '#34d399', '#fb7185', '#a78bfa', '#f472b6', '#94a3b8'],
			tooltip: {
				trigger: 'item',
				formatter: function (params) { return htmlEscape(params.name) + ': ' + params.value + ' (' + params.percent + '%)'; },
				backgroundColor: '#0b1220',
				borderColor: '#243047',
				textStyle: { color: '#e2e8f0' }
			},
			legend: {
				type: 'scroll',
				orient: 'horizontal',
				bottom: 0,
				left: 'center',
				textStyle: { color: '#94a3b8', fontSize: 10 },
				itemWidth: 9,
				itemHeight: 9
			},
			series: [{
				type: 'pie',
				radius: ['40%', '62%'],
				center: ['50%', '42%'],
				avoidLabelOverlap: true,
				itemStyle: { borderColor: '#111c31', borderWidth: 2 },
				label: { show: false },
				emphasis: {
					label: {
						show: true,
						color: '#e2e8f0',
						fontWeight: 'bold',
						formatter: '{b}\n{d}%'
					}
				},
				data: pageShare
			}]
		});
	}

	if (sankeyChart && sankeyLinks.length) {
		sankeyChart.setOption({
			backgroundColor: 'transparent',
			tooltip: {
				trigger: 'item',
				backgroundColor: '#0b1220',
				borderColor: '#243047',
				textStyle: { color: '#e2e8f0' },
				formatter: function (params) {
					if (params.dataType === 'edge') {
						var source = sankeyTitles[params.data.source] || params.data.source;
						var target = sankeyTitles[params.data.target] || params.data.target;
						return htmlEscape(source) + ' → ' + htmlEscape(target) + ': ' + params.data.value + ' navigations';
					}
					return htmlEscape(sankeyTitles[params.name] || params.name);
				}
			},
			series: [{
				type: 'sankey',
				data: sankeyNodes,
				links: sankeyLinks,
				left: 10,
				right: 140,
				top: 10,
				bottom: 10,
				nodeWidth: 12,
				nodeGap: 10,
				nodeAlign: 'justify',
				layoutIterations: 32,
				emphasis: { focus: 'adjacency' },
				lineStyle: { color: 'gradient', curveness: 0.5, opacity: 0.35 },
				label: {
					color: '#cbd5e1',
					fontSize: 10,
					formatter: function (params) {
						return truncateLabel(sankeyTitles[params.name] || params.name, 24);
					}
				},
				itemStyle: { borderWidth: 0 },
				levels: [
					{ depth: 0, itemStyle: { color: '#e9aa60' }, lineStyle: { color: 'source', opacity: 0.25 } },
					{ depth: 1, itemStyle: { color: '#38bdf8' }, lineStyle: { color: 'source', opacity: 0.25 } },
					{ depth: 2, itemStyle: { color: '#34d399' }, lineStyle: { color: 'source', opacity: 0.25 } },
					{ depth: 3, itemStyle: { color: '#fb7185' }, lineStyle: { color: 'source', opacity: 0.25 } }
				]
			}]
		});
	}

	if (transitionMatrixChart && transitionMatrixData.length) {
		var transitionMax = 1;
		transitionMatrixData.forEach(function (row) { transitionMax = Math.max(transitionMax, row[2]); });
		transitionMatrixChart.setOption({
			backgroundColor: 'transparent',
			tooltip: {
				backgroundColor: '#0b1220',
				borderColor: '#243047',
				textStyle: { color: '#e2e8f0' },
				formatter: function (params) {
					var value = params.value;
					return htmlEscape(transitionSources[value[1]]) + ' → ' + htmlEscape(transitionTargets[value[0]]) + ': ' + value[2] + ' transitions';
				}
			},
			grid: { left: 160, right: 20, top: 20, bottom: 76 },
			xAxis: {
				type: 'category',
				data: transitionTargets,
				axisLine: { lineStyle: { color: '#243047' } },
				axisTick: { show: false },
				axisLabel: { color: '#94a3b8', fontSize: 9, rotate: 28, interval: 0 }
			},
			yAxis: {
				type: 'category',
				data: transitionSources.map(function (name) { return truncateLabel(name, 24); }),
				axisLine: { lineStyle: { color: '#243047' } },
				axisTick: { show: false },
				axisLabel: { color: '#cbd5e1', fontSize: 9 }
			},
			visualMap: {
				min: 0,
				max: transitionMax,
				calculable: false,
				orient: 'horizontal',
				left: 'center',
				bottom: 0,
				itemWidth: 11,
				itemHeight: 80,
				textStyle: { color: '#94a3b8', fontSize: 10 },
				inRange: { color: ['#1f2937', '#7c5a2a', '#e9aa60', '#f4c98a'] }
			},
			series: [{
				type: 'heatmap',
				data: transitionMatrixData,
				itemStyle: { borderColor: '#0b1220', borderWidth: 2 },
				emphasis: { itemStyle: { shadowBlur: 8, shadowColor: 'rgba(0,0,0,.35)' } }
			}]
		});
		bindChartOnce(transitionMatrixChart, 'click', function (params) {
			if (!params.value) {
				return;
			}
			var value = params.value;
			var sourceSlug = transitionSourceSlugs[value[1]] || '';
			var targetSlug = transitionTargetSlugs[value[0]] || '';
			if (sourceSlug && targetSlug) {
				goWith({ ref_path: sourceSlug, path: targetSlug });
			}
		});
	}

	if (browserMixChart && browserMix.length) {
		browserMixChart.setOption(pieOption(browserMix, ['#e9aa60', '#38bdf8', '#34d399', '#fb7185', '#a78bfa', '#f472b6', '#94a3b8']));
	}
	if (browserMixChart) {
		bindChartOnce(browserMixChart, 'click', function (params) {
			var value = String(params.name || '').replace(/\s+\d+.*$/, '');
			if (value) {
				goWith({ browser: value });
			}
		});
	}
	if (osMixChart && osMix.length) {
		osMixChart.setOption(pieOption(osMix, ['#38bdf8', '#e9aa60', '#34d399', '#fb7185', '#a78bfa', '#f472b6', '#94a3b8']));
	}
	if (osMixChart) {
		bindChartOnce(osMixChart, 'click', function (params) {
			var value = String(params.name || '').replace(/\s+\d.*$/, '');
			if (value) {
				goWith({ os: value });
			}
		});
	}
	if (deviceMixChart && deviceMix.length) {
		deviceMixChart.setOption(pieOption(deviceMix, ['#e9aa60', '#38bdf8', '#34d399', '#fb7185', '#a78bfa', '#f472b6', '#94a3b8']));
	}

	if (deviceMixChart) {
		bindChartOnce(deviceMixChart, 'click', function (params) {
			var value = String(params.name || '').toLowerCase();
			if (value) {
				goWith({ device: value });
			}
		});
	}

	if (clockChart && clockViews.length) {
		var clockPeakText = clockPeakHour !== null ? String(clockPeakHour).padStart(2, '0') + ':00' : '—';
		clockChart.setOption({
			backgroundColor: 'transparent',
			title: {
				text: clockPeakText,
				subtext: 'peak hour',
				left: 'center',
				top: '38%',
				textAlign: 'center',
				textStyle: { color: '#e2e8f0', fontSize: 24, fontWeight: 700 },
				subtextStyle: { color: '#64748b', fontSize: 10 }
			},
			tooltip: {
				trigger: 'item',
				backgroundColor: '#0b1220',
				borderColor: '#243047',
				textStyle: { color: '#e2e8f0' },
				formatter: function (params) {
					var i = params.dataIndex;
					return htmlEscape(clockLabels[i]) + ':00 — ' + clockViews[i] + ' views / ' + clockEntries[i] + ' estimated visits';
				}
			},
			legend: {
				data: ['Views', 'Estimated visits'],
				bottom: 0,
				left: 'center',
				textStyle: { color: '#94a3b8', fontSize: 10 },
				itemWidth: 9,
				itemHeight: 9
			},
			polar: { radius: ['28%', '70%'], center: ['50%', '48%'] },
			angleAxis: {
				type: 'category',
				data: clockLabels,
				startAngle: 90,
				axisLine: { lineStyle: { color: '#243047' } },
				axisTick: { show: false },
				axisLabel: { color: '#94a3b8', fontSize: 9, interval: 2 }
			},
			radiusAxis: { type: 'value', show: false },
			series: [{
				name: 'Views',
				type: 'line',
				coordinateSystem: 'polar',
				smooth: true,
				symbol: 'circle',
				data: clockViews.map(function (value, index) {
					return {
						value: value,
						itemStyle: { color: index === clockCurrentHour ? '#f4c98a' : '#e9aa60' },
						symbolSize: index === clockCurrentHour ? 9 : 4
					};
				}),
				lineStyle: { width: 2, color: '#e9aa60' },
				areaStyle: { color: 'rgba(233,170,96,0.12)' },
				itemStyle: { color: '#e9aa60' }
			}, {
				name: 'Estimated visits',
				type: 'line',
				coordinateSystem: 'polar',
				smooth: true,
				symbol: 'circle',
				symbolSize: 3,
				data: clockEntries,
				lineStyle: { width: 1.5, type: 'dashed', color: '#38bdf8' },
				itemStyle: { color: '#38bdf8' }
			}]
		});
	}

	if (clockChart) {
		bindChartOnce(clockChart, 'click', function (params) {
			if (typeof params.dataIndex === 'number') {
				goWith({ hour: String(params.dataIndex) });
			}
		});
	}

	if (attentionChart && attention.length) {
		attentionChart.setOption({
			backgroundColor: 'transparent',
			tooltip: {
				trigger: 'item',
				backgroundColor: '#0b1220',
				borderColor: '#243047',
				textStyle: { color: '#e2e8f0' },
				formatter: function (params) {
					var values = params.data.value;
					return '<strong>' + htmlEscape(params.data.name) + '</strong><br>' + values[2] + ' views · ' + formatSeconds(values[0]) + ' · ' + values[1] + ' % scroll';
				}
			},
			grid: { left: 52, right: 20, top: 22, bottom: 48 },
			xAxis: {
				type: 'value',
				name: 'Avg. time',
				nameTextStyle: { color: '#64748b', fontSize: 10 },
				axisLine: { lineStyle: { color: '#243047' } },
				axisTick: { show: false },
				axisLabel: { color: '#94a3b8', fontSize: 10, formatter: function (value) { return formatSeconds(value); } },
				splitLine: { lineStyle: { color: 'rgba(36,48,71,0.65)' } }
			},
			yAxis: {
				type: 'value',
				name: 'Scroll %',
				min: 0,
				max: 100,
				nameTextStyle: { color: '#64748b', fontSize: 10 },
				axisLine: { lineStyle: { color: '#243047' } },
				axisTick: { show: false },
				axisLabel: { color: '#94a3b8', fontSize: 10 },
				splitLine: { lineStyle: { color: 'rgba(36,48,71,0.65)' } }
			},
			series: [{
				type: 'scatter',
				data: attention.map(function (row, index) {
					return {
						name: row.name,
						value: row.value,
						slug: row.slug,
						label: { show: index < 6 }
					};
				}),
				symbolSize: function (value) {
					return Math.max(10, Math.min(58, Math.sqrt(value[2]) * 7));
				},
				itemStyle: { color: '#38bdf8', opacity: 0.82, borderColor: '#0b1220', borderWidth: 1 },
				label: {
					show: false,
					position: 'top',
					color: '#cbd5e1',
					fontSize: 9,
					formatter: function (params) { return truncateLabel(params.data.name, 24); }
				},
				emphasis: { itemStyle: { color: '#e9aa60' } }
			}]
		});
		bindChartOnce(attentionChart, 'click', function (params) {
			if (params.data && params.data.slug) {
				goWith({ path: params.data.slug });
			}
		});
	}

	if (funnelChart && funnel.length && funnel[0].value > 0) {
		funnelChart.setOption({
			backgroundColor: 'transparent',
			tooltip: {
				trigger: 'item',
				backgroundColor: '#0b1220',
				borderColor: '#243047',
				textStyle: { color: '#e2e8f0' },
				formatter: function (params) {
					return htmlEscape(params.name) + ': ' + params.value + ' pageviews (' + params.percent + '%)';
				}
			},
			series: [{
				type: 'funnel',
				left: '8%',
				width: '84%',
				top: 12,
				bottom: 12,
				minSize: '20%',
				maxSize: '100%',
				sort: 'none',
				gap: 2,
				label: {
					show: true,
					position: 'inside',
					color: '#0b1220',
					fontSize: 11,
					fontWeight: 600,
					formatter: function (params) { return params.name + ' · ' + params.value; }
				},
				itemStyle: { borderColor: '#0b1220', borderWidth: 2 },
				data: funnel.map(function (row, index) {
					return {
						name: row.name,
						value: row.value,
						itemStyle: { color: ['#e9aa60', '#38bdf8', '#34d399', '#a78bfa'][index] }
					};
				})
			}]
		});
	}

	if (contentTreemapChart && contentTreemapData.length) {
		contentTreemapChart.setOption({
			backgroundColor: 'transparent',
			tooltip: {
				backgroundColor: '#0b1220',
				borderColor: '#243047',
				textStyle: { color: '#e2e8f0' },
				formatter: function (params) {
					var row = params.data;
					var extra = '';
					if (row.scroll !== null && row.scroll !== undefined) {
						extra += ' · ' + Math.round(row.scroll) + ' % scroll';
					}
					if (row.duration !== null && row.duration !== undefined) {
						extra += ' · ' + formatSeconds(row.duration);
					}
					return '<strong>' + htmlEscape(row.name) + '</strong><br>' + row.value + ' views' + extra;
				}
			},
			series: [{
				type: 'treemap',
				data: contentTreemapData,
				left: 0,
				right: 0,
				top: 0,
				bottom: 0,
				roam: false,
				nodeClick: false,
				breadcrumb: { show: false },
				label: {
					show: true,
					color: '#0b1220',
					fontSize: 10,
					formatter: function (params) { return truncateLabel(params.name, 16) + '\n' + params.value; }
				},
				upperLabel: { show: false },
				itemStyle: { borderColor: '#0b1220', borderWidth: 2, gapWidth: 2 },
				emphasis: { itemStyle: { shadowBlur: 12, shadowColor: 'rgba(0,0,0,.35)' } }
			}]
		});
		bindChartOnce(contentTreemapChart, 'click', function (params) {
			if (params.data && params.data.slug) {
				goWith({ path: params.data.slug });
			}
		});
	}

	if (sourceTreemapChart && sourceTreemapData.length) {
		sourceTreemapChart.setOption({
			backgroundColor: 'transparent',
			tooltip: {
				backgroundColor: '#0b1220',
				borderColor: '#243047',
				textStyle: { color: '#e2e8f0' },
				formatter: function (params) {
					var row = params.data;
					return '<strong>' + htmlEscape(row.name) + '</strong><br>' + row.value + ' views<br>' + htmlEscape(row.host || row.source || 'No host');
				}
			},
			series: [{
				type: 'treemap',
				data: sourceTreemapData,
				left: 0,
				right: 0,
				top: 0,
				bottom: 0,
				roam: false,
				nodeClick: false,
				breadcrumb: { show: false },
				label: {
					show: true,
					color: '#0b1220',
					fontSize: 10,
					formatter: function (params) { return truncateLabel(params.name, 18) + '\n' + params.value; }
				},
				upperLabel: { show: false },
				itemStyle: { borderColor: '#0b1220', borderWidth: 2, gapWidth: 2 },
				emphasis: { itemStyle: { shadowBlur: 12, shadowColor: 'rgba(0,0,0,.35)' } }
			}]
		});
		bindChartOnce(sourceTreemapChart, 'click', function (params) {
			if (params.data) {
				goWith({ ref_type: params.data.ref_type, source: params.data.source });
			}
		});
	}

	if (calendarChart && calendarData.length) {
		calendarChart.setOption({
			backgroundColor: 'transparent',
			tooltip: {
				backgroundColor: '#0b1220',
				borderColor: '#243047',
				textStyle: { color: '#e2e8f0' },
				formatter: function (params) {
					return htmlEscape(params.value[0]) + ': ' + params.value[1] + ' views';
				}
			},
			visualMap: {
				min: 0,
				max: calendarMax,
				calculable: false,
				orient: 'horizontal',
				left: 'center',
				bottom: 0,
				itemWidth: 11,
				itemHeight: 90,
				textStyle: { color: '#94a3b8', fontSize: 10 },
				inRange: { color: ['#1f2937', '#7c5a2a', '#e9aa60', '#f4c98a'] }
			},
			calendar: {
				range: [calendarStart, calendarEnd],
				cellSize: ['auto', 14],
				left: 40,
				right: 20,
				top: 28,
				bottom: 52,
				orient: 'horizontal',
				dayLabel: { color: '#94a3b8', fontSize: 9, firstDay: 1 },
				monthLabel: { color: '#94a3b8', fontSize: 10 },
				yearLabel: { show: false },
				splitLine: { lineStyle: { color: 'rgba(36,48,71,0.55)' } },
				itemStyle: { color: 'transparent', borderColor: 'rgba(36,48,71,0.6)' }
			},
			series: [{
				type: 'heatmap',
				coordinateSystem: 'calendar',
				data: calendarData,
				itemStyle: { borderColor: '#0b1220', borderWidth: 1 }
			}]
		});
		bindChartOnce(calendarChart, 'click', function (params) {
			if (params.value && params.value[0]) {
				goWith({ day: params.value[0] });
			}
		});
	}

	if (botHumanChart && botHumanLabels.length) {
		botHumanChart.setOption({
			backgroundColor: 'transparent',
			tooltip: {
				trigger: 'axis',
				backgroundColor: '#0b1220',
				borderColor: '#243047',
				textStyle: { color: '#e2e8f0' }
			},
			legend: { data: ['Humans', 'Bots'], top: 0, right: 0, textStyle: { color: '#94a3b8', fontSize: 11 } },
			grid: { left: 42, right: 16, top: 34, bottom: 28 },
			xAxis: {
				type: 'category',
				data: botHumanLabels,
				boundaryGap: false,
				axisLine: { lineStyle: { color: '#243047' } },
				axisTick: { show: false },
				axisLabel: { color: '#94a3b8', fontSize: 10, hideOverlap: true }
			},
			yAxis: {
				type: 'value',
				minInterval: 1,
				splitLine: { lineStyle: { color: 'rgba(36,48,71,0.65)' } },
				axisLabel: { color: '#94a3b8', fontSize: 10 }
			},
			series: [{
				name: 'Humans',
				type: 'line',
				stack: 'total',
				smooth: true,
				symbol: 'none',
				data: botHumanHumans,
				lineStyle: { width: 1.5, color: '#34d399' },
				areaStyle: { color: 'rgba(52,211,153,0.22)' },
				itemStyle: { color: '#34d399' }
			}, {
				name: 'Bots',
				type: 'line',
				stack: 'total',
				smooth: true,
				symbol: 'none',
				data: botHumanBots,
				lineStyle: { width: 1.5, color: '#fb7185' },
				areaStyle: { color: 'rgba(251,113,133,0.22)' },
				itemStyle: { color: '#fb7185' }
			}]
		});
	}

	if (botHumanChart) {
		bindChartOnce(botHumanChart, 'click', function (params) {
			if (typeof params.dataIndex === 'number' && seriesDayKeys[params.dataIndex]) {
				goWith({ day: seriesDayKeys[params.dataIndex] });
			}
		});
	}

	if (pageSourceChart && pageSourceData.length) {
		var pageSourceMax = 1;
		pageSourceData.forEach(function (row) { pageSourceMax = Math.max(pageSourceMax, row[2]); });
		pageSourceChart.setOption({
			backgroundColor: 'transparent',
			tooltip: {
				backgroundColor: '#0b1220',
				borderColor: '#243047',
				textStyle: { color: '#e2e8f0' },
				formatter: function (params) {
					var value = params.value;
					return '<strong>' + htmlEscape(pageSourcePages[value[1]]) + '</strong><br>' + htmlEscape(pageSourceSources[value[0]]) + ': ' + value[2] + ' views';
				}
			},
			grid: { left: 160, right: 20, top: 20, bottom: 68 },
			xAxis: {
				type: 'category',
				data: pageSourceSources,
				axisLine: { lineStyle: { color: '#243047' } },
				axisTick: { show: false },
				axisLabel: { color: '#94a3b8', fontSize: 9, rotate: 28, interval: 0 }
			},
			yAxis: {
				type: 'category',
				data: pageSourcePages.map(function (name) { return truncateLabel(name, 24); }),
				axisLine: { lineStyle: { color: '#243047' } },
				axisTick: { show: false },
				axisLabel: { color: '#cbd5e1', fontSize: 9 }
			},
			visualMap: {
				min: 0,
				max: pageSourceMax,
				calculable: false,
				orient: 'horizontal',
				left: 'center',
				bottom: 0,
				itemWidth: 11,
				itemHeight: 80,
				textStyle: { color: '#94a3b8', fontSize: 10 },
				inRange: { color: ['#1f2937', '#7c5a2a', '#e9aa60', '#f4c98a'] }
			},
			series: [{
				type: 'heatmap',
				data: pageSourceData,
				itemStyle: { borderColor: '#0b1220', borderWidth: 2 },
				emphasis: { itemStyle: { shadowBlur: 8, shadowColor: 'rgba(0,0,0,.35)' } }
			}]
		});
		bindChartOnce(pageSourceChart, 'click', function (params) {
			if (!params.value) {
				return;
			}
			var sourceFilter = pageSourceSourceFilters[params.value[0]] || {};
			sourceFilter.path = pageSourceSlugs[params.value[1]] || '';
			if (sourceFilter.path) {
				goWith(sourceFilter);
			}
		});
	}

		chartsReady = true;
		addPngButtons();
		applyChartTheme();
	}

	window.__mnRenderStatsCharts = renderCharts;

	function applyChartTheme() {
		var light = document.body.classList.contains('light');
		var t = light ? {
			text: '#1e293b',
			muted: '#5b6472',
			dim: '#7b8492',
			line: '#d8cfc0',
			split: 'rgba(216,207,192,.85)',
			tooltipBg: '#fffdf8',
			tooltipBorder: '#d8cfc0',
			itemBorder: '#fffdf8',
			heatColors: ['#efe7d8', '#d9b36a', '#b7791f', '#8a5a12']
		} : {
			text: '#e2e8f0',
			muted: '#94a3b8',
			dim: '#64748b',
			line: '#243047',
			split: 'rgba(36,48,71,.65)',
			tooltipBg: '#0b1220',
			tooltipBorder: '#243047',
			itemBorder: '#0b1220',
			heatColors: ['#1f2937', '#7c5a2a', '#e9aa60', '#f4c98a']
		};
		var allCharts = [daily, refsChart, pagesChart, pageShareChart, sankeyChart, browserMixChart, osMixChart, deviceMixChart, clockChart, attentionChart, funnelChart, contentTreemapChart, sourceTreemapChart, calendarChart, botHumanChart, pageSourceChart, transitionMatrixChart];
		var generic = {
			backgroundColor: 'transparent',
			textStyle: { color: t.text },
			tooltip: {
				backgroundColor: t.tooltipBg,
				borderColor: t.tooltipBorder,
				textStyle: { color: t.text }
			}
		};
		allCharts.forEach(function (chart) {
			if (chart) {
				chart.setOption(generic);
			}
		});
		[daily, refsChart, pageShareChart, browserMixChart, osMixChart, deviceMixChart, clockChart, botHumanChart].forEach(function (chart) {
			if (chart) {
				chart.setOption({ legend: { textStyle: { color: t.muted } } });
			}
		});
		[daily, pagesChart, attentionChart, botHumanChart, pageSourceChart, transitionMatrixChart].forEach(function (chart) {
			if (chart) {
				chart.setOption({
					xAxis: {
						axisLine: { lineStyle: { color: t.line } },
						axisTick: { lineStyle: { color: t.line } },
						axisLabel: { color: t.muted },
						nameTextStyle: { color: t.dim },
						splitLine: { lineStyle: { color: t.split } }
					},
					yAxis: {
						axisLine: { lineStyle: { color: t.line } },
						axisTick: { lineStyle: { color: t.line } },
						axisLabel: { color: t.muted },
						nameTextStyle: { color: t.dim },
						splitLine: { lineStyle: { color: t.split } }
					}
				});
			}
		});
		if (clockChart) {
			clockChart.setOption({
				title: {
					textStyle: { color: t.text },
					subtextStyle: { color: t.dim }
				},
				angleAxis: {
					axisLine: { lineStyle: { color: t.line } },
					axisLabel: { color: t.muted }
				},
				radiusAxis: {
					axisLine: { lineStyle: { color: t.line } },
					axisLabel: { color: t.muted }
				}
			});
		}
		if (calendarChart) {
			calendarChart.setOption({
				calendar: {
					dayLabel: { color: t.muted },
					monthLabel: { color: t.muted },
					splitLine: { lineStyle: { color: t.line } },
					itemStyle: { borderColor: t.line }
				},
				visualMap: { textStyle: { color: t.muted }, inRange: { color: t.heatColors } }
			});
		}
		[refsChart, pageShareChart, browserMixChart, osMixChart, deviceMixChart].forEach(function (chart) {
			if (chart) {
				chart.setOption({
					series: [{
						label: { color: t.text },
						emphasis: { label: { color: t.text } },
						itemStyle: { borderColor: t.itemBorder }
					}]
				});
			}
		});
		[contentTreemapChart, sourceTreemapChart].forEach(function (chart) {
			if (chart) {
				chart.setOption({
					series: [{
						label: { color: '#0b1220' },
						itemStyle: { borderColor: t.itemBorder }
					}]
				});
			}
		});
		if (sankeyChart) {
			sankeyChart.setOption({ series: [{ label: { color: t.muted } }] });
		}
		if (attentionChart) {
			attentionChart.setOption({ series: [{ label: { color: t.muted } }] });
		}
		[pageSourceChart, transitionMatrixChart].forEach(function (chart) {
			if (chart) {
				chart.setOption({ visualMap: { textStyle: { color: t.muted }, inRange: { color: t.heatColors } } });
			}
		});
	}

	(function () {
		var toggle = document.getElementById('theme-toggle');
		var body = document.body;
		function syncFeedbackFrame() {
			var frame = document.getElementById('feedback-frame');
			if (!frame) return;
			var theme = body.classList.contains('light') ? 'light' : 'dark';
			try {
				frame.contentWindow.postMessage({ type: 'mn-admin-theme', theme: theme }, window.location.origin);
			} catch (ignored) {}
		}
		function setTheme(light) {
			body.classList.toggle('light', light);
			try {
				localStorage.setItem('mn_stats_theme', light ? 'light' : 'dark');
			} catch (ignored) {}
			if (toggle) {
				toggle.textContent = light ? 'Dark' : 'Light';
			}
			applyChartTheme();
			syncFeedbackFrame();
		}
		var saved = '';
		try {
			saved = localStorage.getItem('mn_stats_theme') || '';
		} catch (ignored) {}
		var frame = document.getElementById('feedback-frame');
		if (frame) {
			frame.addEventListener('load', syncFeedbackFrame);
		}
		setTheme(saved === 'light');
		if (toggle) {
			toggle.addEventListener('click', function () {
				setTheme(!body.classList.contains('light'));
			});
		}
	})();

	(function () {
		var analytics = document.getElementById('analytics-view');
		var embed = document.getElementById('feedback-embed');
		var frame = document.getElementById('feedback-frame');
		var links = Array.prototype.slice.call(document.querySelectorAll('.admin-nav a[data-admin-view]'));
		function applyView(view, updateUrl) {
			var feedback = view === 'feedback';
			document.body.classList.toggle('feedback-view', feedback);
			if (analytics) analytics.style.display = feedback ? 'none' : '';
			if (embed) embed.hidden = !feedback;
			links.forEach(function (link) {
				link.classList.toggle('active', link.getAttribute('data-admin-view') === view);
			});
			if (feedback && frame && !frame.getAttribute('src')) {
				frame.src = frame.getAttribute('data-src') || '';
			}
			if (updateUrl) {
				try {
					var url = new URL(window.location.href);
					url.searchParams.set('view', view);
					window.history.replaceState(null, '', url.toString());
				} catch (ignored) {}
			}
			if (feedback) {
				if (frame) {
					try { frame.contentWindow.postMessage({ type: 'mn-feedback-measure' }, window.location.origin); } catch (ignored) {}
				}
				requestAnimationFrame(measureFeedbackFrame);
				setTimeout(measureFeedbackFrame, 200);
			} else {
				setTimeout(function () {
					if (window.__mnRenderStatsCharts) window.__mnRenderStatsCharts();
					window.dispatchEvent(new Event('resize'));
				}, 60);
			}
		}
		function showView(view, updateUrl, animate) {
			if (animate && document.startViewTransition) {
				document.startViewTransition(function () { applyView(view, updateUrl); });
				return;
			}
			applyView(view, updateUrl);
		}
		function measureFeedbackFrame() {
			if (!frame || !embed || embed.hidden) return;
			var doc = null;
			try { doc = frame.contentDocument; } catch (ignored) {}
			if (!doc || !doc.body) return;
			var page = doc.querySelector('.page');
			var height = Math.max(doc.body.scrollHeight, page ? page.getBoundingClientRect().height : 0);
			if (!isFinite(height) || height <= 0) return;
			height = Math.max(400, Math.min(100000, Math.ceil(height)));
			frame.style.height = height + 'px';
			embed.style.height = height + 'px';
		}
		window.addEventListener('message', function (event) {
			if (event.origin !== window.location.origin) return;
			var data = event.data || {};
			if (data.type !== 'mn-feedback-height') return;
			setTimeout(measureFeedbackFrame, 30);
		});
		if (frame) {
			frame.addEventListener('load', function () {
				if (embed) embed.classList.add('is-loaded');
				try { frame.contentWindow.postMessage({ type: 'mn-feedback-measure' }, window.location.origin); } catch (ignored) {}
				measureFeedbackFrame();
				setTimeout(measureFeedbackFrame, 200);
			});
			try {
				if (frame.contentDocument && frame.contentDocument.readyState === 'complete' && frame.contentDocument.body) {
					embed.classList.add('is-loaded');
				}
			} catch (ignored) {}
		}
		links.forEach(function (link) {
			link.addEventListener('click', function (event) {
				if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) return;
				event.preventDefault();
				showView(link.getAttribute('data-admin-view'), true, true);
			});
		});
		if (document.body.classList.contains('feedback-view')) {
			showView('feedback', false);
		}
	})();

	window.addEventListener('resize', function () {
		if (daily) {
			daily.resize();
		}
		if (refsChart) {
			refsChart.resize();
		}
		if (pagesChart) {
			pagesChart.resize();
		}
		if (pageShareChart) {
			pageShareChart.resize();
		}
		if (sankeyChart) {
			sankeyChart.resize();
		}
		if (transitionMatrixChart) {
			transitionMatrixChart.resize();
		}
		if (browserMixChart) {
			browserMixChart.resize();
		}
		if (osMixChart) {
			osMixChart.resize();
		}
		if (deviceMixChart) {
			deviceMixChart.resize();
		}
		if (clockChart) {
			clockChart.resize();
		}
		if (attentionChart) {
			attentionChart.resize();
		}
		if (funnelChart) {
			funnelChart.resize();
		}
		if (contentTreemapChart) {
			contentTreemapChart.resize();
		}
		if (sourceTreemapChart) {
			sourceTreemapChart.resize();
		}
		if (calendarChart) {
			calendarChart.resize();
		}
		if (botHumanChart) {
			botHumanChart.resize();
		}
		if (pageSourceChart) {
			pageSourceChart.resize();
		}
	});

	(function () {
		function resizeCharts(container) {
			if (!container) {
				return;
			}
			container.querySelectorAll('.chart').forEach(function (element) {
				var chart = echarts.getInstanceByDom(element);
				if (chart) {
					chart.resize();
				}
			});
		}

		document.querySelectorAll('[data-view-toggle]').forEach(function (toggle) {
			var name = toggle.getAttribute('data-view-toggle');
			var buttons = Array.prototype.slice.call(toggle.querySelectorAll('[data-view]'));
			var panes = Array.prototype.slice.call(document.querySelectorAll('[data-view-pane="' + name + '"]'));
			if (!buttons.length || !panes.length) {
				return;
			}
			function activate(view) {
				buttons.forEach(function (button) {
					button.classList.toggle('active', button.getAttribute('data-view') === view);
				});
				panes.forEach(function (pane) {
					var on = pane.getAttribute('data-view') === view;
					pane.hidden = !on;
					if (on) {
						renderCharts();
						requestAnimationFrame(function () { resizeCharts(pane); });
					}
				});
			}
			buttons.forEach(function (button) {
				button.addEventListener('click', function () { activate(button.getAttribute('data-view')); });
			});
		});

		document.querySelectorAll('[data-heatmap-toggle]').forEach(function (toggle) {
			var name = toggle.getAttribute('data-heatmap-toggle');
			var buttons = Array.prototype.slice.call(toggle.querySelectorAll('[data-heatmap-view]'));
			var panes = Array.prototype.slice.call(document.querySelectorAll('[data-heatmap-pane="' + name + '"]'));
			if (!buttons.length || !panes.length) {
				return;
			}
			function activate(view) {
				buttons.forEach(function (button) {
					button.classList.toggle('active', button.getAttribute('data-heatmap-view') === view);
				});
				panes.forEach(function (pane) {
					pane.hidden = pane.getAttribute('data-heatmap-view') !== view;
				});
			}
			buttons.forEach(function (button) {
				button.addEventListener('click', function () { activate(button.getAttribute('data-heatmap-view')); });
			});
		});
	})();

	(function () {
		var nav = document.querySelector('.subnav');
		if (!nav) {
			return;
		}
		var links = Array.prototype.slice.call(nav.querySelectorAll('a[href^="#"]'));
		var sections = links.map(function (link) { return document.querySelector(link.getAttribute('href')); });
		var ticking = false;
		function update() {
			ticking = false;
			var y = window.scrollY + 180;
			var active = 0;
			for (var i = 0; i < sections.length; i++) {
				var section = sections[i];
				if (!section || section.hidden) {
					continue;
				}
				var top = section.getBoundingClientRect().top + window.scrollY;
				if (top <= y) {
					active = i;
				}
			}
			links.forEach(function (link, index) {
				link.classList.toggle('active', index === active);
			});
		}
		window.addEventListener('scroll', function () {
			if (!ticking) {
				ticking = true;
				requestAnimationFrame(update);
			}
		}, { passive: true });
		update();
	})();

	(function () {
		var toggle = document.getElementById('present-toggle');
		var bar = document.getElementById('present-bar');
		var label = document.getElementById('present-label');
		var body = document.body;
		var slide = 1;
		var labels = { 1: 'Traffic & rhythm', 2: 'Content & attention', 3: 'Sources & confidence' };
		function resizeVisible() {
			document.querySelectorAll('.present-current .chart').forEach(function (element) {
				var chart = echarts.getInstanceByDom(element);
				if (chart) {
					chart.resize();
				}
			});
		}
		function show(n) {
			slide = Math.max(1, Math.min(3, n));
			body.classList.add('present');
			body.classList.remove('overview-briefing', 'overview-explore');
			body.setAttribute('data-present-slide', String(slide));
			if (bar) {
				bar.hidden = false;
			}
			document.querySelectorAll('[data-tab-group="overview"][data-slide]').forEach(function (element) {
				element.classList.toggle('present-current', element.getAttribute('data-slide') === String(slide));
			});
			if (label) {
				label.textContent = labels[slide];
			}
			window.scrollTo(0, 0);
			renderCharts();
			requestAnimationFrame(resizeVisible);
		}
		function exit() {
			body.classList.remove('present');
			body.removeAttribute('data-present-slide');
			body.classList.toggle('overview-briefing', overviewMode === 'briefing');
			body.classList.toggle('overview-explore', overviewMode === 'explore');
			if (bar) {
				bar.hidden = true;
			}
			document.querySelectorAll('.present-current').forEach(function (element) {
				element.classList.remove('present-current');
			});
			requestAnimationFrame(resizeVisible);
		}
		if (toggle) {
			toggle.addEventListener('click', function () {
				var overview = document.querySelector('[data-tab="overview"]');
				if (overview) {
					overview.click();
				}
				show(1);
			});
		}
		if (bar) {
			var prev = bar.querySelector('[data-present-prev]');
			var next = bar.querySelector('[data-present-next]');
			var close = bar.querySelector('[data-present-exit]');
			if (prev) {
				prev.addEventListener('click', function () { show(slide - 1); });
			}
			if (next) {
				next.addEventListener('click', function () { show(slide + 1); });
			}
			if (close) {
				close.addEventListener('click', exit);
			}
		}
		document.addEventListener('keydown', function (event) {
			if (!body.classList.contains('present')) {
				return;
			}
			if (event.key === 'ArrowRight') {
				event.preventDefault();
				show(slide + 1);
			} else if (event.key === 'ArrowLeft') {
				event.preventDefault();
				show(slide - 1);
			} else if (event.key === 'Escape') {
				event.preventDefault();
				exit();
			}
		});
	})();

	(function () {
		if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
			return;
		}
		document.querySelectorAll('[data-countup]').forEach(function (element) {
			var target = parseFloat(element.getAttribute('data-countup'));
			if (!isFinite(target)) {
				return;
			}
			var decimals = parseInt(element.getAttribute('data-decimals') || '0', 10);
			if (!isFinite(decimals)) {
				decimals = 0;
			}
			var start = null;
			var duration = 720;
			function frame(now) {
				if (start === null) {
					start = now;
				}
				var t = Math.min(1, (now - start) / duration);
				var eased = 1 - Math.pow(1 - t, 3);
				var value = target * eased;
				element.textContent = value.toFixed(decimals).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
				if (t < 1) {
					requestAnimationFrame(frame);
				}
			}
			requestAnimationFrame(frame);
		});
	})();

	function addPngButtons() {
		document.querySelectorAll('.chart').forEach(function (element) {
			var chart = echarts.getInstanceByDom(element);
			if (!chart || chart.__pngAdded) {
				return;
			}
			chart.__pngAdded = true;
			var card = element.closest('.card');
			if (!card) {
				return;
			}
			var actions = card.querySelector('.chart-actions');
			if (!actions) {
				actions = document.createElement('div');
				actions.className = 'chart-actions';
				card.appendChild(actions);
			}
			var button = document.createElement('button');
			button.type = 'button';
			button.className = 'chart-export';
			button.textContent = 'PNG';
			button.title = 'Download chart as PNG';
			button.setAttribute('aria-label', 'Download chart as PNG');
			button.addEventListener('click', function () {
				var url = chart.getDataURL({
					pixelRatio: 2,
					backgroundColor: document.body.classList.contains('light') ? '#fffdf8' : '#0b1220'
				});
				var link = document.createElement('a');
				link.href = url;
				link.download = 'blog-analytics-chart-' + Date.now() + '.png';
				document.body.appendChild(link);
				link.click();
				link.remove();
			});
			actions.appendChild(button);
		});
	}

	(function () {
		function apply(mode, save) {
			overviewMode = mode === 'explore' ? 'explore' : 'briefing';
			var body = document.body;
			if (!body.classList.contains('present')) {
				body.classList.toggle('overview-briefing', overviewMode === 'briefing');
				body.classList.toggle('overview-explore', overviewMode === 'explore');
			}
			document.querySelectorAll('[data-overview-mode]').forEach(function (button) {
				button.classList.toggle('active', button.getAttribute('data-overview-mode') === overviewMode);
			});
			if (save) {
				try {
					localStorage.setItem('mn_stats_overview_view', overviewMode);
				} catch (ignored) {}
				try {
					var url = new URL(window.location.href);
					url.searchParams.set('view', overviewMode);
					history.replaceState(null, '', url.pathname + url.search + url.hash);
				} catch (ignored) {}
			}
			if (chartsReady && !body.classList.contains('present')) {
				renderCharts();
			}
		}

		var initial = '';
		try {
			initial = new URLSearchParams(window.location.search).get('view') || '';
		} catch (ignored) {}
		if (initial !== 'briefing' && initial !== 'explore') {
			var hash = (window.location.hash || '').replace('#', '');
			var exploreIds = ['attention', 'rhythm', 'compare', 'content', 'health', 'sections', 'movers', 'portfolio', 'audience', 'cohorts', 'signals', 'calendar', 'bot-human', 'page-source', 'navigation', 'quality'];
			if (exploreIds.indexOf(hash) >= 0) {
				initial = 'explore';
			} else {
				try {
					initial = localStorage.getItem('mn_stats_overview_view') || '';
				} catch (ignored) {}
			}
		}
		apply(initial === 'explore' ? 'explore' : 'briefing', false);

		document.querySelectorAll('[data-overview-mode]').forEach(function (button) {
			button.addEventListener('click', function () {
				apply(button.getAttribute('data-overview-mode'), true);
			});
		});
		document.querySelectorAll('[data-explore-target]').forEach(function (link) {
			link.addEventListener('click', function (event) {
				if (overviewMode !== 'explore' && !document.body.classList.contains('present')) {
					event.preventDefault();
					apply('explore', true);
					var target = document.getElementById(link.getAttribute('data-explore-target'));
					if (target) {
						setTimeout(function () { target.scrollIntoView({ behavior: 'smooth', block: 'start' }); }, 40);
					}
				}
			});
		});
	})();

	(function () {
		var tabs = Array.prototype.slice.call(document.querySelectorAll('[data-tab]'));
		var groups = Array.prototype.slice.call(document.querySelectorAll('[data-tab-group]'));
		if (!tabs.length || !groups.length) {
			return;
		}
		function activate(name, save) {
			groups.forEach(function (element) {
				element.hidden = element.getAttribute('data-tab-group') !== name;
			});
			tabs.forEach(function (tab) {
				var on = tab.getAttribute('data-tab') === name;
				tab.classList.toggle('active', on);
				tab.setAttribute('aria-selected', on ? 'true' : 'false');
				tab.tabIndex = on ? 0 : -1;
			});
			renderCharts();
			document.querySelectorAll('[data-tab-group="' + name + '"] .chart').forEach(function (element) {
				var chart = echarts.getInstanceByDom(element);
				if (chart) {
					chart.resize();
				}
			});
			if (save) {
				try {
					localStorage.setItem('mn_stats_tab', name);
				} catch (e) {
					// Private mode or storage disabled.
				}
				if (window.history && history.replaceState) {
					history.replaceState(null, '', window.location.pathname + window.location.search + '#' + name);
				}
			}
		}
		var known = tabs.map(function (tab) { return tab.getAttribute('data-tab'); });
		var initial = '';
		try {
			initial = localStorage.getItem('mn_stats_tab') || '';
		} catch (e) {
			initial = '';
		}
		var hash = (location.hash || '').replace('#', '');
		if (hash === 'raw-data') {
			hash = 'raw';
		}
		if (known.indexOf(hash) >= 0) {
			initial = hash;
		}
		if (known.indexOf(initial) < 0) {
			initial = 'overview';
		}
		activate(initial, false);
		tabs.forEach(function (tab, index) {
			tab.addEventListener('click', function () {
				activate(tab.getAttribute('data-tab'), true);
			});
			tab.addEventListener('keydown', function (event) {
				var next = null;
				if (event.key === 'ArrowRight') {
					next = tabs[(index + 1) % tabs.length];
				} else if (event.key === 'ArrowLeft') {
					next = tabs[(index - 1 + tabs.length) % tabs.length];
				} else if (event.key === 'Home') {
					next = tabs[0];
				} else if (event.key === 'End') {
					next = tabs[tabs.length - 1];
				}
				if (next) {
					event.preventDefault();
					next.focus();
					activate(next.getAttribute('data-tab'), true);
				}
			});
		});
	})();

	(function () {
		var dialog = document.getElementById('bot-dialog');
		var title = document.getElementById('bot-dialog-title');
		var text = document.getElementById('bot-dialog-text');
		if (!dialog || !title || !text) {
			return;
		}
		document.querySelectorAll('.bot-reason').forEach(function (button) {
			button.addEventListener('click', function () {
				var reason = button.getAttribute('data-reason') || 'Unknown bot';
				var hint = botHints[reason] || 'The User-Agent matched a known bot or automation pattern.';
				title.textContent = 'Detected as: ' + reason;
				text.textContent = 'Rule: ' + hint + ' Only this coarse reason is stored; the raw User-Agent is never stored.';
				if (typeof dialog.showModal === 'function') {
					dialog.showModal();
				} else {
					dialog.setAttribute('open', '');
				}
			});
		});
	})();
})();
</script>
<?php endif; ?>
<script>
(function () {
	'use strict';
	function hideEmptyCards() {
		document.querySelectorAll('.card').forEach(function (card) {
			var empty = card.querySelector('.empty');
			if (!empty || !empty.textContent.trim()) return;
			if (card.querySelector('canvas, svg, tbody tr')) return;
			card.style.display = 'none';
		});
	}
	if (document.readyState === 'loading') {
		document.addEventListener('DOMContentLoaded', hideEmptyCards);
	} else {
		hideEmptyCards();
	}
})();
</script>
<script src="admin_presentation.js?v=<?php echo (int)@filemtime(__DIR__ . '/admin_presentation.js'); ?>"></script>
</body>
</html>

