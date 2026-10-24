<?php
/*
 * Standalone tests for the anonymous analytics library.
 *
 * Run with: php blog/tests/analytics_test.php
 * The test uses a temporary SQLite database and never touches production data.
 */
declare(strict_types=1);

$tmpDir = sys_get_temp_dir() . '/asanai-analytics-test-' . bin2hex(random_bytes(6));
if (!mkdir($tmpDir, 0700, true) && !is_dir($tmpDir)) {
	fwrite(STDERR, "cannot create temp directory\n");
	exit(2);
}
$dbPath = $tmpDir . '/analytics.sqlite';
$passwordFile = $tmpDir . '/blogpassword';
file_put_contents($passwordFile, "test-password\n");
chmod($passwordFile, 0400);

putenv('MN_ANALYTICS_TEST_MODE=1');
putenv('MN_ANALYTICS_DB=' . $dbPath);
putenv('BLOG_STATS_PASSWORD_FILE=' . $passwordFile);

require_once __DIR__ . '/../lib/analytics.php';

$checks = 0;
$failures = 0;

function check(bool $condition, string $label, string $detail = ''): void {
	global $checks, $failures;
	$checks++;
	if ($condition) {
		echo "ok   {$label}\n";
		return;
	}
	$failures++;
	echo "FAIL {$label}";
	if ($detail !== '') {
		echo " — {$detail}";
	}
	echo "\n";
}

function check_same(mixed $expected, mixed $actual, string $label): void {
	check($expected === $actual, $label, 'expected ' . var_export($expected, true) . ', got ' . var_export($actual, true));
}

function clean_client_hints(): void {
	unset(
		$_SERVER['HTTP_SEC_CH_UA'],
		$_SERVER['HTTP_SEC_CH_UA_PLATFORM'],
		$_SERVER['HTTP_SEC_CH_UA_MOBILE']
	);
}

// ---------------------------------------------------------------------------
// Client category parser
// ---------------------------------------------------------------------------
$_SERVER['HTTP_USER_AGENT'] = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36';
clean_client_hints();
$client = mn_analytics_parse_client();
check_same('Chrome', $client['browser'], 'Chrome family');
check_same(131, $client['browser_major'], 'Chrome major version');
check_same('Windows', $client['os'], 'Windows OS');
check_same('10/11', $client['os_version'], 'Windows version');
check_same('desktop', $client['device'], 'Chrome desktop');
check_same(0, $client['is_bot'], 'Chrome is not a bot');

$_SERVER['HTTP_USER_AGENT'] = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1';
clean_client_hints();
$client = mn_analytics_parse_client();
check_same('Safari', $client['browser'], 'Safari family');
check_same(17, $client['browser_major'], 'Safari major version');
check_same('iOS', $client['os'], 'iOS OS');
check_same('mobile', $client['device'], 'iPhone is mobile');

$_SERVER['HTTP_USER_AGENT'] = 'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Mobile Safari/537.36';
clean_client_hints();
$client = mn_analytics_parse_client();
check_same('Android', $client['os'], 'Android OS');
check_same('14', $client['os_version'], 'Android version');
check_same('mobile', $client['device'], 'Android phone is mobile');

$_SERVER['HTTP_USER_AGENT'] = 'Mozilla/5.0 (Linux; Android 12; SM-X700) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36';
clean_client_hints();
$client = mn_analytics_parse_client();
check_same('tablet', $client['device'], 'Android tablet is tablet');

$_SERVER['HTTP_USER_AGENT'] = 'Mozilla/5.0 (X11; Linux x86_64; rv:131.0) Gecko/20100101 Firefox/131.0';
clean_client_hints();
$client = mn_analytics_parse_client();
check_same('Firefox', $client['browser'], 'Firefox family');
check_same('Linux', $client['os'], 'Linux OS');

$_SERVER['HTTP_USER_AGENT'] = 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)';
clean_client_hints();
$client = mn_analytics_parse_client();
check_same(1, $client['is_bot'], 'Googlebot is a bot');
check_same('Bot', $client['browser'], 'bot browser label');
check_same('bot', $client['device'], 'bot device label');
check_same('Googlebot', $client['bot_reason'], 'Googlebot reason');

$_SERVER['HTTP_USER_AGENT'] = 'curl/8.5.0';
clean_client_hints();
$client = mn_analytics_parse_client();
check_same(1, $client['is_bot'], 'curl is a bot');
check_same('curl', $client['bot_reason'], 'curl reason');

$_SERVER['HTTP_USER_AGENT'] = '';
clean_client_hints();
$client = mn_analytics_parse_client();
check_same('Unknown', $client['browser'], 'empty UA browser');
check_same('Unknown', $client['os'], 'empty UA OS');
check_same('unknown', $client['device'], 'empty UA device');
check_same(0, $client['is_bot'], 'empty UA is not a bot');

$_SERVER['HTTP_USER_AGENT'] = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36 Edg/131.0.0.0';
$_SERVER['HTTP_SEC_CH_UA'] = '"Microsoft Edge";v="131", "Chromium";v="131", "Not_A Brand";v="24"';
$_SERVER['HTTP_SEC_CH_UA_PLATFORM'] = '"Windows"';
$_SERVER['HTTP_SEC_CH_UA_MOBILE'] = '?0';
$client = mn_analytics_parse_client();
check_same('Edge', $client['browser'], 'client hints Edge family');
check_same(131, $client['browser_major'], 'client hints Edge version');
clean_client_hints();

// ---------------------------------------------------------------------------
// Referrer parser
// ---------------------------------------------------------------------------
$_SERVER['HTTP_HOST'] = 'example.test';
$ref = mn_analytics_parse_referrer('');
check_same('direct', $ref['type'], 'empty referrer is direct');
check_same('', $ref['host'], 'direct referrer has no host');

$ref = mn_analytics_parse_referrer('https://www.google.com/search?q=secret');
check_same('search', $ref['type'], 'Google is search');
check_same('Google', $ref['source'], 'Google source label');
check_same('google.com', $ref['host'], 'Google host normalized');
check_same('', $ref['path'], 'external path is not stored');

$ref = mn_analytics_parse_referrer('http://example.test/blog/intro?x=1');
check_same('internal', $ref['type'], 'same host is internal');
check_same('intro', $ref['path'], 'internal previous slug');
check_same('example.test', $ref['host'], 'internal host');

$ref = mn_analytics_parse_referrer('https://www.reddit.com/r/example');
check_same('social', $ref['type'], 'Reddit is social');
check_same('Reddit', $ref['source'], 'Reddit source label');
check_same('', $ref['path'], 'social path is not stored');

$ref = mn_analytics_parse_referrer('https://example.org/a?b=c');
check_same('external', $ref['type'], 'example.org is external');
check_same('example.org', $ref['source'], 'external source is host');
check_same('', $ref['path'], 'external path is not stored');

$ref = mn_analytics_parse_referrer('android-app://com.example');
check_same('external', $ref['type'], 'non-http referrer is external');
check_same('android-app', $ref['source'], 'non-http referrer source');

// ---------------------------------------------------------------------------
// Consent / prefetch helpers
// ---------------------------------------------------------------------------
$_SERVER['HTTP_DNT'] = '1';
check(mn_analytics_is_opted_out(), 'DNT opts out');
unset($_SERVER['HTTP_DNT']);
$_SERVER['HTTP_SEC_GPC'] = '1';
check(mn_analytics_is_opted_out(), 'GPC opts out');
unset($_SERVER['HTTP_SEC_GPC']);
$_SERVER['HTTP_SEC_PURPOSE'] = 'prefetch';
check(mn_analytics_is_prefetch(), 'prefetch is detected');
unset($_SERVER['HTTP_SEC_PURPOSE']);

// ---------------------------------------------------------------------------
// Database / pageview lifecycle
// ---------------------------------------------------------------------------
$_SERVER['SCRIPT_FILENAME'] = __DIR__ . '/../history.php';
$_SERVER['REQUEST_URI'] = '/history';
$_SERVER['HTTP_HOST'] = 'example.test';
$_SERVER['HTTP_REFERER'] = 'https://www.google.com/search?q=secret';
$_SERVER['HTTP_USER_AGENT'] = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36';
unset($_SERVER['HTTP_DNT'], $_SERVER['HTTP_SEC_GPC'], $_SERVER['HTTP_SEC_PURPOSE']);
clean_client_hints();
$_COOKIE = [];

$pageview = mn_analytics_begin_page_view();
check(is_array($pageview) && !empty($pageview['token']), 'pageview inserted');
$token = is_array($pageview) ? (string)$pageview['token'] : '';
check(preg_match('/^[a-f0-9]{32}$/', $token) === 1, 'pageview token shape');

$pdo = mn_analytics_open_db();
check($pdo instanceof PDO, 'database opens');
if ($pdo instanceof PDO) {
	check_same(7, (int)$pdo->query('PRAGMA user_version')->fetchColumn(), 'schema version 7');
	$row = $pdo->query('SELECT * FROM pageviews ORDER BY id LIMIT 1')->fetch();
	check_same('history', $row['path'], 'page slug stored');
	check_same('search', $row['ref_type'], 'referrer type stored');
	check_same('Google', $row['ref_source'], 'referrer source stored');
	check_same('', $row['ref_path'], 'external referrer path not stored');
	check_same('Chrome', $row['browser'], 'browser stored');
	check_same('Windows', $row['os'], 'OS stored');
	check_same('desktop', $row['device'], 'device stored');
	check_same(0, (int)$row['completed'], 'pageview pending');
	check_same($token, $row['token'], 'pending token stored');

	check(mn_analytics_update_token($token, 42, 55, false), 'heartbeat updates the row');
	$row = $pdo->query('SELECT * FROM pageviews ORDER BY id LIMIT 1')->fetch();
	check_same(42, (int)$row['duration_sec'], 'heartbeat duration stored');
	check_same(55, (int)$row['scroll_pct'], 'heartbeat scroll stored');
	check_same(0, (int)$row['completed'], 'heartbeat keeps row pending');
	check_same($token, $row['token'], 'heartbeat keeps token');

	$sections = [['i' => 0, 'k' => 'intro', 'l' => 'Introduction', 'v' => 100, 'd' => 12]];
	$events = [['type' => 'internal_link', 'target' => 'history', 'value' => 1], ['type' => 'quiz_answer', 'target' => 'quiz:1', 'value' => 0]];
	check(mn_analytics_update_token($token, 99, 80, true, $sections, $events), 'leave finalizes the row');
	$row = $pdo->query('SELECT * FROM pageviews ORDER BY id LIMIT 1')->fetch();
	check_same(99, (int)$row['duration_sec'], 'final duration stored');
	check_same(80, (int)$row['scroll_pct'], 'final scroll stored');
	check_same(1, (int)$row['completed'], 'row completed');
	check_same('', $row['token'], 'token erased on completion');
	$count = (int)$pdo->query('SELECT COUNT(*) FROM pageviews')->fetchColumn();
	check_same(1, $count, 'one row only (no duplicate)');
	check_same(1, (int)$pdo->query('SELECT COUNT(*) FROM pageview_sections')->fetchColumn(), 'section detail stored');
	check_same(2, (int)$pdo->query('SELECT COUNT(*) FROM pageview_events')->fetchColumn(), 'interaction events stored');
	check(!mn_analytics_update_token($token, 200, 90, true), 'replayed leave is a no-op');

	$fallbackToken = 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';
	$pdo->exec("INSERT INTO pageviews (ts, day, hour, path, ref_type, ref_source, ref_host, ref_path, browser, browser_major, os, os_version, device, is_bot, duration_sec, scroll_pct, completed, token) VALUES (" . time() . ", '2026-01-01', 0, 'history', 'direct', '', '', '', 'Chrome', 131, 'Windows', '10/11', 'desktop', 0, NULL, NULL, 0, '{$fallbackToken}')");
	check(mn_analytics_delete_token($fallbackToken), 'opt-out deletes a pending row');
	$count = (int)$pdo->query("SELECT COUNT(*) FROM pageviews WHERE token = '{$fallbackToken}'")->fetchColumn();
	check_same(0, $count, 'pending row deleted');

	$staleToken = 'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb';
	$staleTs = time() - 7 * 3600;
	$pdo->exec("INSERT INTO pageviews (ts, day, hour, path, ref_type, ref_source, ref_host, ref_path, browser, browser_major, os, os_version, device, is_bot, duration_sec, scroll_pct, completed, token) VALUES ({$staleTs}, '2026-01-01', 0, 'stale', 'direct', '', '', '', 'Chrome', 131, 'Windows', '10/11', 'desktop', 0, NULL, NULL, 0, '{$staleToken}')");
	mn_analytics_cleanup($pdo, true);
	$row = $pdo->query("SELECT completed, token FROM pageviews WHERE path = 'stale'")->fetch();
	check_same(1, (int)$row['completed'], 'cleanup completes stale pending row');
	check_same('', $row['token'], 'cleanup erases stale token');

	$pdo->exec("INSERT INTO pageviews (ts, day, hour, path, ref_type, ref_source, ref_host, ref_path, browser, browser_major, os, os_version, device, is_bot, duration_sec, scroll_pct, completed, token) VALUES (1, '2000-01-01', 0, 'too-old', 'direct', '', '', '', 'Chrome', 131, 'Windows', '10/11', 'desktop', 0, NULL, NULL, 1, '')");
	mn_analytics_cleanup($pdo, true);
	$count = (int)$pdo->query("SELECT COUNT(*) FROM pageviews WHERE path = 'too-old'")->fetchColumn();
	check_same(0, $count, 'retention deletes rows older than 730 days');

	// Reader feedback: storage, validation, selection, prompt, consent.
	$reactionKeys = array_keys(mn_feedback_reactions());
	check($reactionKeys === ['helpful', 'unhelpful', 'insight', 'confusing', 'bug'], 'feedback reaction set');
	$feedbackToken = mn_feedback_issue_token();
	check(mn_feedback_verify_token($feedbackToken), 'feedback token verifies');
	check(!mn_feedback_verify_token($feedbackToken . 'x'), 'tampered feedback token is rejected');

	$selection = [
		'text' => 'A selected passage about history.',
		'html' => '<em>A selected passage</em> about history.<script>alert(1)</script>',
		'start' => 10,
		'end' => 42,
		'prefix' => 'Before the passage',
		'suffix' => 'After the passage',
		'block_length' => 120,
		'range_count' => 1,
		'direction' => 'forward',
		'rect' => ['x' => 10, 'y' => 20, 'width' => 100, 'height' => 20],
		'block_rect' => ['x' => 10, 'y' => 10, 'width' => 400, 'height' => 120],
		'scroll_y' => 120,
		'viewport_w' => 1280,
		'viewport_h' => 800,
	];
	$requestId = 'abcdefabcdefabcdefabcdefabcdef12';
	$stored = mn_feedback_store([
		'request_id' => $requestId,
		'path' => 'history',
		'lesson_title' => 'A History Lesson',
		'part' => 1,
		'part_title' => 'Foundations',
		'block_index' => 3,
		'block_key' => 'history:section:3',
		'block_selector' => 'div.md > p:nth-of-type(2)',
		'section_title' => 'A Section',
		'section_anchor' => 'a-section',
		'block_text' => 'A selected passage about history. More context follows here.',
		'block_html' => '<p>A selected passage about history. More context follows here.</p>',
		'reaction' => 'insight',
		'comment' => 'This point helped me understand the timeline.',
		'email' => 'reader@example.test',
		'selection' => $selection,
	]);
	check(!empty($stored['ok']) && !empty($stored['id']), 'feedback stored');
	$feedbackId = (int)($stored['id'] ?? 0);
	$feedbackRow = mn_feedback_fetch($pdo, $feedbackId);
	check(is_array($feedbackRow), 'feedback row can be fetched');
	check_same('insight', $feedbackRow['reaction'] ?? '', 'feedback reaction stored');
	check_same('reader@example.test', $feedbackRow['email'] ?? '', 'feedback email stored when supplied');
	check_same(10, (int)($feedbackRow['start_offset'] ?? -1), 'selection start offset stored');
	check_same(42, (int)($feedbackRow['end_offset'] ?? -1), 'selection end offset stored');
	check_same('A selected passage about history.', $feedbackRow['selection_text'] ?? '', 'selected text stored');
	check(!str_contains((string)($feedbackRow['selection_html'] ?? ''), '<script'), 'script stripped from selected HTML');
	check_same('blog/history.php', $feedbackRow['source_file'] ?? '', 'source file recorded');
	check_same($requestId, $feedbackRow['request_id'] ?? '', 'request id stored');

	$duplicate = mn_feedback_store([
		'request_id' => $requestId,
		'path' => 'history',
		'reaction' => 'insight',
		'comment' => 'Second submission should be ignored.',
	]);
	check(!empty($duplicate['ok']) && !empty($duplicate['duplicate']), 'duplicate request id is idempotent');
	check_same($feedbackId, (int)($duplicate['id'] ?? 0), 'duplicate returns the original id');

	$badReaction = mn_feedback_store(['path' => 'history', 'reaction' => 'nope']);
	check(empty($badReaction['ok']), 'invalid reaction is rejected');
	$badEmail = mn_feedback_store(['path' => 'history', 'reaction' => 'helpful', 'email' => 'not-an-email']);
	check(empty($badEmail['ok']), 'invalid email is rejected');
	$badPath = mn_feedback_store(['path' => '../etc/passwd', 'reaction' => 'helpful']);
	check(empty($badPath['ok']), 'invalid path is rejected');

	$bugStored = mn_feedback_store([
		'request_id' => 'abcdefabcdefabcdefabcdefabcdef99',
		'path' => 'history',
		'reaction' => 'bug',
		'comment' => 'The demo throws an error.',
		'selection' => $selection,
		'bug' => ['consent' => false, 'console' => [['text' => 'secret']]],
	]);
	$bugId = (int)($bugStored['id'] ?? 0);
	$bugRow = mn_feedback_fetch($pdo, $bugId);
	check_same(0, (int)($bugRow['bug_consent'] ?? 0), 'bug context is not stored without consent');
	check_same('', (string)($bugRow['bug_console_logs_json'] ?? ''), 'console log is not stored without consent');

	$consentStored = mn_feedback_store([
		'request_id' => 'abcdefabcdefabcdefabcdefabcdef98',
		'path' => 'history',
		'reaction' => 'bug',
		'comment' => 'The demo throws an error with logs.',
		'selection' => $selection,
		'bug' => [
			'consent' => true,
			'console' => [['level' => 'error', 'text' => 'boom']],
			'clicks' => [['tag' => 'button', 'text' => 'Run']],
			'last_error' => ['message' => 'boom'],
			'user_agent' => 'test-agent',
			'url' => 'http://example.test/history',
			'viewport' => '1280x800',
		],
	]);
	$consentId = (int)($consentStored['id'] ?? 0);
	$consentRow = mn_feedback_fetch($pdo, $consentId);
	check_same(1, (int)($consentRow['bug_consent'] ?? 0), 'bug context stored with consent');
	check(str_contains((string)($consentRow['bug_console_logs_json'] ?? ''), 'boom'), 'console log stored with consent');
	check(str_contains((string)($consentRow['bug_last_clicks_json'] ?? ''), 'Run'), 'last click stored with consent');

	$prompt = mn_feedback_build_prompt($feedbackRow, 'Clarify the example and keep the citation.');
	check(str_contains($prompt, 'File: blog/history.php'), 'prompt includes the source file');
	check(str_contains($prompt, 'A selected passage about history.'), 'prompt includes the selected text');
	check(str_contains($prompt, 'This point helped me understand the timeline.'), 'prompt includes the reader comment');
	check(str_contains($prompt, 'Clarify the example and keep the citation.'), 'prompt includes the editor instruction');
	check(str_contains($prompt, 'WHAT THE READER WANTS'), 'prompt has the reader-wants section');
	check(str_contains($prompt, 'DELIVERABLE'), 'prompt has a deliverable section');
	check(!str_contains($prompt, 'reader@example.test'), 'prompt omits the email by default');

	mn_analytics_cleanup($pdo, true);
	$feedbackCount = (int)$pdo->query('SELECT COUNT(*) FROM block_feedback')->fetchColumn();
	check($feedbackCount >= 3, 'cleanup keeps reader feedback');

	$backup = $tmpDir . '/backup.sqlite';
	@unlink($backup);
	check(mn_analytics_backup_to($backup), 'SQLite backup succeeds');
	check(is_file($backup), 'backup file exists');
	if (is_file($backup)) {
		$backupDb = new PDO('sqlite:' . $backup);
		$backupDb->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
		$count = (int)$backupDb->query('SELECT COUNT(*) FROM pageviews')->fetchColumn();
		check($count >= 1, 'backup contains rows');
		$feedbackBackup = (int)$backupDb->query('SELECT COUNT(*) FROM block_feedback')->fetchColumn();
		check($feedbackBackup >= 3, 'backup contains reader feedback');
		$backupDb = null;
	}
}

// ---------------------------------------------------------------------------
// Health check / admin token / alert visibility
// ---------------------------------------------------------------------------
$issues = mn_analytics_health_issues();
$criticalIds = ['config_error', 'system_path_error', 'env_path_error', 'config_path_error', 'pdo_sqlite_missing', 'sqlite3_missing', 'client_tracker_missing', 'track_endpoint_missing', 'password_file_writable', 'system_path_writable', 'db_dir_missing', 'db_dir_unwritable', 'db_dir_symlink', 'db_dir_owner', 'db_dir_world_writable', 'db_file_permissions', 'db_file_world_accessible', 'db_path_symlink', 'db_path_not_regular', 'db_open_failed', 'db_insert_failed', 'db_web_exposed'];
$foundCritical = array_values(array_intersect($criticalIds, array_keys($issues)));
check($foundCritical === [], 'healthy temp database has no critical health issues', implode(', ', $foundCritical));

check(mn_analytics_resolve_db_path('/var/lib/asanai-blog') === '/var/lib/asanai-blog/analytics.sqlite', 'directory path resolves to analytics.sqlite');
check(mn_analytics_resolve_db_path('/tmp/custom.sqlite') === '/tmp/custom.sqlite', 'file path is kept as-is');
check(mn_analytics_resolve_db_path('relative/analytics.sqlite') === '', 'relative database paths are rejected');
$homeDir = mn_analytics_home_dir();
if ($homeDir !== '') {
	check(str_ends_with(mn_analytics_default_db_path(), '/.asanai-blog/analytics.sqlite'), 'default DB path is in the user home');
}

$_SERVER['SCRIPT_NAME'] = '/asanai/blog/history.php';
$missingPassword = $tmpDir . '/missing-password';
putenv('BLOG_STATS_PASSWORD_FILE=' . $missingPassword);
$setupIssue = mn_analytics_setup_issue();
check(is_array($setupIssue), 'missing password file is a setup issue');
check(is_array($setupIssue) && str_contains(implode("\n", $setupIssue['commands']), 'YOUR_PASSWORD'), 'setup issue contains the setup command');
check(is_array($setupIssue) && str_contains($setupIssue['detail'], $dbPath), 'setup issue shows the resolved database path');
check(is_array($setupIssue) && isset($setupIssue['link']['href']) && str_contains($setupIssue['link']['href'], '/stats'), 'setup issue has a real dashboard link');
check(str_contains(mn_analytics_alert_html(), 'Analytics setup required'), 'public setup banner is visible without admin login');
$missingDbDir = $tmpDir . '/missing-db/analytics.sqlite';
putenv('MN_ANALYTICS_DB=' . $missingDbDir);
$setupWithMissingDir = mn_analytics_setup_issue();
check(is_array($setupWithMissingDir) && str_contains(implode("\n", $setupWithMissingDir['commands']), 'mkdir -p') && str_contains(implode("\n", $setupWithMissingDir['commands']), 'missing-db'), 'setup issue commands are customized for the missing database directory');
$symlinkDb = $tmpDir . '/symlink.sqlite';
if (function_exists('symlink') && @symlink($dbPath, $symlinkDb)) {
	putenv('MN_ANALYTICS_DB=' . $symlinkDb);
	$symlinkSetup = mn_analytics_setup_issue();
	check(is_array($symlinkSetup) && (str_contains($symlinkSetup['detail'], 'symbolic link') || str_contains(implode("\n", $symlinkSetup['commands']), 'symlink')), 'symlinked database paths are refused');
	@unlink($symlinkDb);
}
putenv('MN_ANALYTICS_DB=' . $dbPath);
putenv('BLOG_STATS_PASSWORD_FILE=' . $passwordFile);
check(mn_analytics_setup_issue() === null, 'configured password file clears the setup issue');

$adminToken = mn_analytics_admin_token();
check(preg_match('/^[a-f0-9]{64}$/', $adminToken) === 1, 'admin token shape');
$_COOKIE['mn_stats_admin'] = $adminToken;
check(mn_analytics_is_admin_visitor(), 'valid admin cookie is accepted');
$_COOKIE['mn_stats_admin'] = str_repeat('0', 64);
check(!mn_analytics_is_admin_visitor(), 'wrong admin cookie is rejected');
unset($_COOKIE['mn_stats_admin']);
check(!mn_analytics_is_admin_visitor(), 'missing admin cookie is rejected');
check(mn_analytics_alert_html() === '', 'non-admin gets no alert HTML');

// ---------------------------------------------------------------------------
// Cleanup
// ---------------------------------------------------------------------------
if (is_array(glob($tmpDir . '/*'))) {
	foreach (glob($tmpDir . '/*') as $file) {
		@unlink($file);
	}
}
@rmdir($tmpDir);
putenv('MN_ANALYTICS_TEST_MODE');
putenv('MN_ANALYTICS_DB');
putenv('BLOG_STATS_PASSWORD_FILE');

echo "\n{$checks} checks, {$failures} failure(s)\n";
exit($failures === 0 ? 0 : 1);
