<?php
/**
 * Feedback API — Integration Tests (PHP, CLI-runnable)
 * ----------------------------------------------------
 * Spins up an isolated test database + admin password file, runs the
 * real PHP API endpoints via curl, and asserts the responses.
 *
 * Usage:
 *   php blog/tests/feedback_api_test.php
 *
 * Exits 0 on success, 1 on any failure.
 *
 * No external test framework — uses plain PHP assertions.
 */

declare(strict_types=1);

$ROOT       = realpath(__DIR__ . '/../..');
$TEST_DIR   = sys_get_temp_dir() . '/fb_test_' . bin2hex(random_bytes(4));
$DB_PATH    = $TEST_DIR . '/feedback.sqlite';
$PATCH_DIR  = $TEST_DIR . '/patches';
$PW_FILE    = $TEST_DIR . '/adminpw';
$PORT       = 10100 + random_int(0, 999);
$BASE_URL   = "http://127.0.0.1:$PORT";
$ADMIN_PW   = 'unit-test-pass';

@mkdir($TEST_DIR, 0775, true);
@mkdir($PATCH_DIR, 0775, true);

file_put_contents($PW_FILE, password_hash($ADMIN_PW, PASSWORD_BCRYPT));
chmod($PW_FILE, 0440);

putenv("ASANAI_FEEDBACK_DIR=$TEST_DIR");

$logFile = $TEST_DIR . '/server.log';
$pidFile = $TEST_DIR . '/server.pid';
$descriptors = [
	0 => ['pipe', 'r'],
	1 => ['file', $logFile, 'w'],
	2 => ['file', $logFile, 'w'],
];
$server = proc_open(
	"php -S 127.0.0.1:$PORT -t $ROOT/blog",
	$descriptors,
	$pipes,
	$ROOT . '/blog'
);
if (!is_resource($server)) {
	fwrite(STDERR, "Failed to start PHP server\n");
	exit(1);
}
$serverPid = (int)(proc_get_status($server)['pid'] ?? 0);
file_put_contents($pidFile, (string)$serverPid);
register_shutdown_function(function () use ($server, $serverPid, $TEST_DIR) {
	if (is_resource($server)) {
		proc_terminate($server, 9);
		proc_close($server);
	}
	if ($serverPid > 0) {
		@posix_kill($serverPid, SIGKILL);
		// Also kill any orphans bound to the same port (defensive).
		@exec("ps -ef | awk '\$3=='$serverPid' {print \$2}' | xargs -r kill -9 2>/dev/null");
	}
	@exec("rm -rf " . escapeshellarg($TEST_DIR));
});

$ready = false;
for ($i = 0; $i < 40; $i++) {
	usleep(150000);
	$ch = curl_init("$BASE_URL/api/feedback/setup.php");
	curl_setopt_array($ch, [
		CURLOPT_RETURNTRANSFER => true,
		CURLOPT_CONNECTTIMEOUT => 1,
		CURLOPT_TIMEOUT => 2,
	]);
	$body = curl_exec($ch);
	$code = (int)curl_getinfo($ch, CURLINFO_HTTP_CODE);
	curl_close($ch);
	if ($code === 200) { $ready = true; break; }
}
if (!$ready) {
	fwrite(STDERR, "Server didn't come up. Log:\n" . @file_get_contents($logFile) . "\n");
	exit(1);
}

$pass = 0; $fail = 0; $errors = [];

function assert_eq($expected, $actual, string $msg): void {
	global $pass, $fail, $errors;
	if ($expected === $actual) { $pass++; return; }
	$fail++;
	$errors[] = $msg . "\n  expected: " . var_export($expected, true) . "\n  actual:   " . var_export($actual, true);
	// Auto-debug: print last response body if we have one
	if (isset($GLOBALS['__LAST_BODY__'])) {
		$errors[count($errors)-1] .= "\n  last body: " . substr($GLOBALS['__LAST_BODY__'], 0, 300);
	}
}

function assert_true(bool $cond, string $msg): void {
	global $pass, $fail, $errors;
	if ($cond) { $pass++; return; }
	$fail++;
	$errors[] = $msg;
}

function assert_contains(string $needle, string $hay, string $msg): void {
	global $pass, $fail, $errors;
	if ($hay !== null && strpos($hay, $needle) !== false) { $pass++; return; }
	$fail++;
	$errors[] = $msg . " (looking for '$needle')";
}

/**
 * Run an API request. Returns [status, body, json, cookies, headers].
 */
function api(string $method, string $path, ?array $body = null, array $cookies = []): array {
	global $BASE_URL;
	$ch = curl_init($BASE_URL . $path);
	$headers = [];
	curl_setopt_array($ch, [
		CURLOPT_RETURNTRANSFER => true,
		CURLOPT_CUSTOMREQUEST  => $method,
		CURLOPT_HEADERFUNCTION => function ($_, $h) use (&$headers) {
			$headers[] = trim($h);
			return strlen($h);
		},
	]);
	if ($body !== null) {
		$json = json_encode($body);
		curl_setopt($ch, CURLOPT_POSTFIELDS, $json);
		$headers[] = 'Content-Type: application/json';
		$headers[] = 'Content-Length: ' . strlen($json);
	}
	curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
	if ($cookies) {
		$pairs = [];
		foreach ($cookies as $k => $v) $pairs[] = rawurlencode($k) . '=' . rawurlencode($v);
		curl_setopt($ch, CURLOPT_COOKIE, implode('; ', $pairs));
	}

	$out = curl_exec($ch);
	$code = (int)curl_getinfo($ch, CURLINFO_HTTP_CODE);
	$GLOBALS['__LAST_BODY__'] = (string)$out;
	$GLOBALS['__LAST_CODE__'] = $code;
	curl_close($ch);

	$cookies = [];
	if (preg_match_all('/^Set-Cookie:\s*([^=]+)=([^;]+);/mi', implode("\n", $headers), $m)) {
		foreach ($m[1] as $i => $k) $cookies[$k] = $m[2][$i];
	}

	$json = null;
	if ($out && ($s = strpos($out, '{')) !== false && ($e = strrpos($out, '}')) !== false) {
		$json = json_decode(substr($out, $s, $e - $s + 1), true);
	}
	return ['status' => $code, 'body' => (string)$out, 'json' => $json, 'cookies' => $cookies, 'headers' => $headers];
}

function get_challenge(): array {
	// In production, the JS sets fb_challenge via document.cookie and
	// re-uses the same value as challenge_token in the body. The PHP
	// server doesn't set this cookie itself — it only validates that
	// the body value matches whatever the client sends.
	// Simulate that here by minting our own cookie + matching token.
	$ct = bin2hex(random_bytes(16));
	return [$ct, ['fb_challenge' => $ct]];
}

function with_challenge(array $extra = []): array {
	[$ct, $c] = get_challenge();
	return array_merge($c, $extra, ['fb_challenge' => $ct]);
}

function reset_rate_limit(): void {
	global $DB_PATH;
	try {
		$pdo = new PDO('sqlite:' . $DB_PATH);
		$pdo->exec('DELETE FROM rate_limits');
	} catch (Exception $e) { /* ignore */ }
}

function fresh_challenge(): string {
	global $BASE_URL;
	$ch = curl_init($BASE_URL . '/api/feedback/list.php?lesson=intro');
	$cookieJar = tempnam(sys_get_temp_dir(), 'fbcookie_');
	$h = [];
	curl_setopt_array($ch, [
		CURLOPT_RETURNTRANSFER => true,
		CURLOPT_COOKIEJAR => $cookieJar,
		CURLOPT_HEADERFUNCTION => function ($_, $hh) use (&$h) { $h[] = trim($hh); return strlen($hh); },
	]);
	curl_exec($ch);
	curl_close($ch);
	@unlink($cookieJar);
	foreach ($h as $line) {
		if (preg_match('/^Set-Cookie:\s*fb_challenge=([^;]+);/i', $line, $m)) return $m[1];
	}
	return '';
}

echo "=== Feedback API Integration Tests ===\n";
echo "Server: $BASE_URL\n";
echo "DB:     $DB_PATH\n\n";

// ── Setup health ──────────────────────────────────────────────────────
$r = api('GET', '/api/feedback/setup.php');
assert_eq(200, $r['status'], 'setup.php returns 200');
assert_contains('Data dir', $r['body'], 'setup.php shows data dir');
assert_contains('SQLite',   $r['body'], 'setup.php shows sqlite path');

// ── List (empty) ──────────────────────────────────────────────────────
$r = api('GET', '/api/feedback/list.php?lesson=intro');
assert_eq(200, $r['status'], 'list.php returns 200');
assert_eq(0, count($r['json']['feedback'] ?? []), 'empty list returns 0 items');
assert_eq('master', $r['json']['git']['branch'] ?? null, 'git info branch is master');
assert_eq(false, $r['json']['admin'] ?? null, 'admin=false when no session');

// ── git_info ──────────────────────────────────────────────────────────
$r = api('GET', '/api/feedback/git_info.php');
assert_eq(200, $r['status'], 'git_info.php returns 200');
assert_true(is_array($r['json']) && isset($r['json']['commit']), 'git_info has commit field');

// ── Submit: text feedback ─────────────────────────────────────────────
reset_rate_limit();
[$ct, $cookies] = get_challenge();
$r = api('POST', '/api/feedback/submit.php', [
	'lesson_slug' => 'intro', 'anchor_type' => 'text', 'category' => 'bug',
	'body' => 'Test text', 'anchor_quote' => 'two cultures',
	'anchor_prefix' => 'split', 'anchor_suffix' => 'problem',
	'challenge_token' => $ct,
], $cookies);
if ($r['status'] !== 201) echo "  [debug] submit text body: " . substr($r['body'], 0, 200) . "\n";
assert_eq(201, $r['status'], 'submit text returns 201');
assert_eq(true, $r['json']['ok'] ?? null, 'submit ok=true');
assert_true(isset($r['json']['id']) && $r['json']['id'] > 0, 'submit returns id');
assert_eq(false, $r['json']['approved'] ?? null, 'submit approved=false initially');
$textId = $r['json']['id'] ?? 0;
echo "  [textId=$textId]\n";

// ── Submit: image feedback ────────────────────────────────────────────
[$ct, $cookies] = get_challenge();
$r = api('POST', '/api/feedback/submit.php', [
	'lesson_slug' => 'intro', 'anchor_type' => 'image', 'category' => 'content',
	'body' => 'Image issue', 'anchor_quote' => 'cave hands',
	'anchor_image_src' => 'cave_hands.jpg', 'anchor_image_alt' => 'Hand stencils',
	'challenge_token' => $ct,
], $cookies);
assert_eq(201, $r['status'], 'submit image returns 201');
$imageId = $r['json']['id'] ?? 0;

// ── Submit: heading feedback ──────────────────────────────────────────
[$ct, $cookies] = get_challenge();
$r = api('POST', '/api/feedback/submit.php', [
	'lesson_slug' => 'intro', 'anchor_type' => 'heading', 'category' => 'suggestion',
	'body' => 'Heading comment', 'anchor_quote' => 'Disclaimer',
	'challenge_token' => $ct,
], $cookies);
assert_eq(201, $r['status'], 'submit heading returns 201');

// ── Submit: code feedback ─────────────────────────────────────────────
[$ct, $cookies] = get_challenge();
$r = api('POST', '/api/feedback/submit.php', [
	'lesson_slug' => 'intro', 'anchor_type' => 'code', 'category' => 'bug',
	'body' => 'Code bug', 'anchor_quote' => 'print()',
	'challenge_token' => $ct,
], $cookies);
assert_eq(201, $r['status'], 'submit code returns 201');

// ── Submit: suggestion ────────────────────────────────────────────────
[$ct, $cookies] = get_challenge();
$r = api('POST', '/api/feedback/submit.php', [
	'lesson_slug' => 'intro', 'anchor_type' => 'suggestion', 'category' => 'typo',
	'body' => 'Suggesting typo fix',
	'anchor_quote' => 'as to err is human',
	'suggestion_original' => 'as to err is human',
	'suggestion_replacement' => 'to err is human',
	'challenge_token' => $ct,
], $cookies);
assert_eq(201, $r['status'], 'submit suggestion returns 201');
$sugId = $r['json']['id'] ?? 0;
echo "  [sugId=$sugId]\n";

// ── Submit: validation errors ─────────────────────────────────────────
reset_rate_limit();
[$ct, $cookies] = get_challenge();
foreach ([
	[['anchor_type' => 'text', 'body' => 'x', 'challenge_token' => 'bad'], 400, 'no lesson_slug'],
	[['lesson_slug' => 'intro', 'body' => '', 'anchor_quote' => 'x', 'challenge_token' => $ct], 400, 'empty body'],
	[['lesson_slug' => 'intro', 'anchor_type' => 'foo', 'body' => 'x', 'challenge_token' => $ct], 400, 'invalid anchor_type'],
	[['lesson_slug' => 'intro', 'anchor_type' => 'suggestion', 'body' => 'x', 'challenge_token' => $ct], 400, 'suggestion missing replacement'],
	[['lesson_slug' => 'intro', 'anchor_type' => 'text', 'body' => 'x', 'challenge_token' => $ct, 'author_email' => 'bad'], 400, 'invalid email'],
] as $case) {
	[$body, $code, $name] = $case;
	$r = api('POST', '/api/feedback/submit.php', $body, $cookies);
	assert_eq($code, $r['status'], "validation: $name returns $code");
	assert_eq(false, $r['json']['ok'] ?? null, "validation: $name ok=false");
	assert_true(isset($r['json']['error']) && strlen($r['json']['error']) > 5, "validation: $name has error message");
	assert_contains('request_id', json_encode($r['json'] ?? []), "validation: $name includes request_id");
}

// ── Honeypot ───────────────────────────────────────────────────────────
[$ct, $cookies] = get_challenge();
$r = api('POST', '/api/feedback/submit.php', [
	'lesson_slug' => 'intro', 'anchor_type' => 'text', 'category' => 'bug',
	'body' => 'spam', 'anchor_quote' => 'x',
	'honeypot' => 'i-am-a-bot',
	'challenge_token' => $ct,
], $cookies);
assert_eq(400, $r['status'], 'honeypot triggers 400');
assert_contains('honeypot', $r['json']['error'] ?? '', 'honeypot error mentions honeypot');

// ── Rate limit (12 per hour per IP) ───────────────────────────────────
reset_rate_limit();
$rateFails = 0;
$lastR = null;
for ($i = 0; $i < 15; $i++) {
	[$ct, $cookies] = get_challenge();
	$lastR = api('POST', '/api/feedback/submit.php', [
		'lesson_slug' => 'intro', 'anchor_type' => 'text', 'category' => 'bug',
		'body' => "rate $i", 'anchor_quote' => 'x',
		'challenge_token' => $ct,
	], $cookies);
	if ($lastR['status'] === 429) $rateFails++;
}
assert_true($rateFails >= 3, 'rate limit triggers after 12 submissions');
assert_contains('Too many', $lastR['json']['error'] ?? '', 'rate limit error message clear');
assert_eq(429, $lastR['status'], 'last submission returns 429');

// ── Admin auth ────────────────────────────────────────────────────────
$r = api('POST', '/api/feedback/admin/login.php', ['password' => $ADMIN_PW]);
assert_eq(200, $r['status'], 'admin login with correct pw returns 200');
assert_true(!empty($r['json']['token'] ?? ''), 'admin login returns token');
$adminTok = $r['json']['token'];

$r = api('POST', '/api/feedback/admin/login.php', ['password' => 'wrong']);
assert_eq(401, $r['status'], 'admin login with wrong pw returns 401');

// ── Admin list ────────────────────────────────────────────────────────
$r = api('GET', '/api/feedback/admin/list.php?lesson=intro', null, ['fb_admin' => $adminTok]);
assert_eq(200, $r['status'], 'admin list returns 200');
assert_true(($r['json']['stats']['total'] ?? 0) >= 5, 'admin list shows ≥5 items (got ' . ($r['json']['stats']['total'] ?? 0) . ')');

// ── Admin update ───────────────────────────────────────────────────────
$r = api('POST', '/api/feedback/admin/update.php', [
	'id' => $textId, 'action' => 'approve',
], ['fb_admin' => $adminTok]);
assert_eq(200, $r['status'], 'admin approve returns 200 (got ' . $r['status'] . ' body=' . substr($r['body'], 0, 200) . ')');

$r = api('POST', '/api/feedback/admin/update.php', [
	'id' => $textId, 'action' => 'status', 'status' => 'in_progress',
], ['fb_admin' => $adminTok]);
assert_eq(200, $r['status'], 'admin status change returns 200');

$r = api('POST', '/api/feedback/admin/update.php', [
	'id' => $textId, 'action' => 'resolve', 'status_note' => 'fixed',
], ['fb_admin' => $adminTok]);
assert_eq(200, $r['status'], 'admin resolve returns 200');

$r = api('POST', '/api/feedback/admin/update.php', [
	'id' => $textId, 'action' => 'unresolve',
], ['fb_admin' => $adminTok]);
assert_eq(200, $r['status'], 'admin unresolve returns 200');

// ── Admin at_commit (git-aware historical anchor view) ────────────────
$r = api('GET', "/api/feedback/admin/at_commit.php?id=$textId", null, ['fb_admin' => $adminTok]);
assert_eq(200, $r['status'], 'admin at_commit returns 200');
$hStr = strtolower(implode(' | ', $r['headers'] ?? []));
assert_true(strpos($hStr, 'text/html') !== false, 'at_commit: returns HTML (Content-Type includes text/html)');
assert_contains('Annotation #' . $textId, $r['body'], 'at_commit: shows the annotation id in title');
assert_contains('Original quote', $r['body'], 'at_commit: shows the original quote section');
assert_contains('Stored anchor metadata', $r['body'], 'at_commit: dumps stored anchor metadata as JSON');
assert_contains('What does this tell us?', $r['body'], 'at_commit: includes a verdict paragraph');
assert_contains('anchor_chunks', $r['body'], 'at_commit: lists anchor_chunks in metadata dump');
assert_contains('anchor_section_title', $r['body'], 'at_commit: lists anchor_section_title in metadata dump');
assert_contains('anchor_text_hash', $r['body'], 'at_commit: lists anchor_text_hash in metadata dump');

$r = api('GET', '/api/feedback/admin/at_commit.php', null, ['fb_admin' => $adminTok]);
assert_eq(400, $r['status'], 'at_commit: missing id returns 400');

$r = api('GET', '/api/feedback/admin/at_commit.php?id=999999', null, ['fb_admin' => $adminTok]);
assert_eq(404, $r['status'], 'at_commit: unknown id returns 404');

$r = api('GET', "/api/feedback/admin/at_commit.php?id=$textId", null, []);
assert_eq(302, $r['status'], 'at_commit: not authenticated → 302 redirect to login');

$r = api('POST', "/api/feedback/admin/at_commit.php?id=$textId", null, ['fb_admin' => $adminTok]);
assert_eq(200, $r['status'], 'at_commit: POST returns friendly help page (200)');

// ── Multi-quote + section title + text_hash captured on submit ─────────
[$ct, $cookies] = get_challenge();
reset_rate_limit();
[$ct, $cookies] = get_challenge();
$r = api('POST', '/api/feedback/submit.php', [
	'lesson_slug' => 'intro', 'anchor_type' => 'text', 'category' => 'typo',
	'body' => 'multi-quote test',
	'anchor_quote' => 'this is the main selection text',
	'anchor_prefix' => 'before ', 'anchor_suffix' => ' after',
	'anchor_offset' => 100, 'anchor_offset_end' => 130,
	'anchor_chunks' => ['this is the head', 'middle selection chunk', 'main selection text'],
	'anchor_section_title' => 'A Great Section',
	'anchor_text_hash' => 'abc123def',
	'challenge_token' => $ct,
], $cookies);
assert_eq(201, $r['status'], 'submit with chunks/section_title/text_hash returns 201');
$multiId = $r['json']['id'] ?? 0;
assert_true($multiId > 0, 'submit: response has id');

$r = api('GET', '/api/feedback/admin/list.php?lesson=intro', null, ['fb_admin' => $adminTok]);
$multiItem = null;
foreach ($r['json']['feedback'] ?? [] as $f) {
	if ($f['id'] === $multiId) { $multiItem = $f; break; }
}
assert_true($multiItem !== null, 'admin list: multi-quote item present');
assert_eq('A Great Section', $multiItem['anchor']['section_title'] ?? null,
	'admin list: anchor.section_title persisted');
assert_eq('abc123def', $multiItem['anchor']['text_hash'] ?? null,
	'admin list: anchor.text_hash persisted');
assert_true(is_array($multiItem['anchor']['chunks'] ?? null),
	'admin list: anchor.chunks is array');
assert_eq('this is the head', $multiItem['anchor']['chunks'][0] ?? null,
	'admin list: anchor.chunks[0] persisted');
assert_eq('main selection text', $multiItem['anchor']['chunks'][2] ?? null,
	'admin list: anchor.chunks[2] persisted');

$r = api('GET', "/api/feedback/admin/at_commit.php?id=$multiId", null, ['fb_admin' => $adminTok]);
assert_eq(200, $r['status'], 'at_commit: multi-quote item renders');
assert_contains('this is the main selection text', $r['body'], 'at_commit: shows the original quote');

$r = api('POST', '/api/feedback/admin/update.php', [
	'id' => 999999, 'action' => 'approve',
], ['fb_admin' => $adminTok]);
assert_eq(404, $r['status'], 'admin update non-existent returns 404');

$r = api('POST', '/api/feedback/admin/update.php', ['id' => $textId, 'action' => 'status', 'status' => 'bogus'], ['fb_admin' => $adminTok]);
assert_eq(400, $r['status'], 'admin status invalid returns 400');

// ── Admin apply (suggestion) ───────────────────────────────────────────
$r = api('POST', '/api/feedback/admin/apply.php', ['id' => $sugId], ['fb_admin' => $adminTok]);
assert_eq(200, $r['status'], 'admin apply returns 200 (got ' . $r['status'] . ' body=' . substr($r['body'], 0, 200) . ')');
assert_eq(true, $r['json']['ok'] ?? null, 'admin apply ok=true');
assert_contains('--- a/intro.php', $r['json']['patch'] ?? '', 'patch contains unified-diff header');
assert_eq(1, $r['json']['matches'] ?? 0, 'patch reports 1 match');

$r = api('POST', '/api/feedback/admin/apply.php', ['id' => $textId], ['fb_admin' => $adminTok]);
assert_eq(400, $r['status'], 'admin apply on non-suggestion returns 400');

// ── Reactions ──────────────────────────────────────────────────────────
$r = api('POST', '/api/feedback/react.php', [
	'target_type' => 'feedback', 'target_key' => 'x',
	'feedback_id' => $textId, 'reaction' => 'up',
]);
assert_eq(200, $r['status'], 'react upvote returns 200');
assert_eq('up', $r['json']['my_reaction'] ?? null, 'react upvote my_reaction=up');
assert_eq(1, $r['json']['upvotes'] ?? 0, 'react upvote count=1');

$r = api('POST', '/api/feedback/react.php', [
	'target_type' => 'feedback', 'target_key' => 'x',
	'feedback_id' => $textId, 'reaction' => 'down',
]);
assert_eq('down', $r['json']['my_reaction'] ?? null, 'switching to down');

$r = api('POST', '/api/feedback/react.php', [
	'target_type' => 'feedback', 'target_key' => 'x',
	'feedback_id' => $textId, 'reaction' => 'remove',
]);
assert_eq(null, $r['json']['my_reaction'] ?? null, 'remove clears reaction');

$r = api('POST', '/api/feedback/react.php', [
	'target_type' => 'feedback', 'target_key' => 'x',
	'feedback_id' => 999999, 'reaction' => 'up',
]);
assert_eq(404, $r['status'], 'react non-existent feedback returns 404');

$r = api('POST', '/api/feedback/react.php', [
	'target_type' => 'foo', 'target_key' => 'x',
	'feedback_id' => $textId, 'reaction' => 'up',
]);
assert_eq(400, $r['status'], 'react bad target_type returns 400');

// ── Comments ───────────────────────────────────────────────────────────
reset_rate_limit();
[$ct, $cookies] = get_challenge();
$r = api('POST', '/api/feedback/comment.php', [
	'feedback_id' => $textId, 'body' => 'first comment',
	'challenge_token' => $ct,
], $cookies);
assert_eq(201, $r['status'], 'comment post returns 201');
assert_eq(true, $r['json']['ok'] ?? null, 'comment ok=true');

$r = api('POST', '/api/feedback/comment.php', [
	'feedback_id' => 999999, 'body' => 'orphan',
	'challenge_token' => $ct,
], $cookies);
assert_eq(404, $r['status'], 'comment on non-existent feedback returns 404');

$r = api('POST', '/api/feedback/comment.php', [
	'feedback_id' => $textId, 'body' => '',
	'challenge_token' => $ct,
], $cookies);
assert_eq(400, $r['status'], 'comment empty body returns 400');

$r = api('POST', '/api/feedback/comment.php', [
	'feedback_id' => $textId, 'body' => 'x',
], $cookies);
assert_eq(400, $r['status'], 'comment without challenge returns 400');

// ── Edit endpoint (user can edit own pending feedback) ────────────────
$VID = 'abcdef0123456789abcdef0123456789';
$VISITOR_COOKIES = ['fb_visitor' => $VID];

[$ct, $cookies] = get_challenge();
$ownCookies = array_merge($cookies, $VISITOR_COOKIES);

$r = api('POST', '/api/feedback/submit.php', [
	'lesson_slug' => 'intro', 'anchor_type' => 'text', 'category' => 'bug',
	'body' => 'Original body text', 'anchor_quote' => 'two cultures',
	'challenge_token' => $ct,
], $ownCookies);
assert_eq(201, $r['status'], 'edit-test: submit as visitor');
$ownId = $r['json']['id'] ?? 0;

// Edit as the same visitor → 200
[$ct, $cookies] = get_challenge();
$ownCookies = array_merge($cookies, $VISITOR_COOKIES);
$r = api('POST', '/api/feedback/edit.php', [
	'id' => $ownId, 'body' => 'Edited body', 'challenge_token' => $ct,
], $ownCookies);
assert_eq(200, $r['status'], 'edit as owner: 200');
assert_eq(true, $r['json']['ok'] ?? null, 'edit as owner: ok=true');

// Edit as different visitor → 403
[$ct, $cookies] = get_challenge();
$r = api('POST', '/api/feedback/edit.php', [
	'id' => $ownId, 'body' => 'Hijack', 'challenge_token' => $ct,
], array_merge($cookies, ['fb_visitor' => '00000000000000000000000000000001']));
assert_eq(403, $r['status'], 'edit as different visitor: 403');

// Edit empty body → 400
[$ct, $cookies] = get_challenge();
$ownCookies = array_merge($cookies, $VISITOR_COOKIES);
$r = api('POST', '/api/feedback/edit.php', [
	'id' => $ownId, 'body' => '', 'challenge_token' => $ct,
], $ownCookies);
assert_eq(400, $r['status'], 'edit empty body: 400');

// Edit non-existent → 404
[$ct, $cookies] = get_challenge();
$ownCookies = array_merge($cookies, $VISITOR_COOKIES);
$r = api('POST', '/api/feedback/edit.php', [
	'id' => 999999, 'body' => 'x', 'challenge_token' => $ct,
], $ownCookies);
assert_eq(404, $r['status'], 'edit non-existent: 404');

// Edit after approval → 403 (frozen)
api('POST', '/api/feedback/admin/update.php', [
	'id' => $ownId, 'action' => 'approve',
], ['fb_admin' => $adminTok]);
[$ct, $cookies] = get_challenge();
$ownCookies = array_merge($cookies, $VISITOR_COOKIES);
$r = api('POST', '/api/feedback/edit.php', [
	'id' => $ownId, 'body' => 'After approval', 'challenge_token' => $ct,
], $ownCookies);
assert_eq(403, $r['status'], 'edit after approval: 403 (frozen)');

// ── Self-feedback visibility (visitor_id matching) ────────────────────
$r = api('GET', '/api/feedback/list.php?lesson=intro', null, $VISITOR_COOKIES);
$items = $r['json']['feedback'] ?? [];
assert_true(count($items) >= 1, 'list as visitor shows own items');
$foundOwn = false;
foreach ($items as $it) {
	if (($it['id'] ?? 0) === $ownId) {
		$foundOwn = true;
		assert_true($it['is_own'] ?? false, 'own item has is_own=true');
	}
}
assert_true($foundOwn, 'visitor sees their own feedback in list');

// ── Aha reactions on text ─────────────────────────────────────────────
reset_rate_limit();
$ahaKey = 'intro|split|two cultures|problem';
$r = api('POST', '/api/feedback/react.php', [
	'target_type' => 'text_aha', 'target_key' => $ahaKey,
	'reaction' => 'aha',
	'lesson_slug' => 'intro',
	'anchor_selector' => '.md > p',
	'anchor_prefix' => 'split ', 'anchor_quote' => 'two cultures',
	'anchor_suffix' => ' problem',
	'body' => 'split [two cultures] problem',
], $VISITOR_COOKIES);
assert_eq(200, $r['status'], 'aha text reaction: 200');

// ── Public list (after approval) ──────────────────────────────────────
$r = api('GET', '/api/feedback/list.php?lesson=intro');
$items = $r['json']['feedback'] ?? [];
assert_true(count($items) >= 1, 'public list shows approved items (got ' . count($items) . ')');
if ($items) assert_true($items[0]['approved'] ?? false, 'public items are approved');

// ── X-Request-Id header ───────────────────────────────────────────────
$r = api('GET', '/api/feedback/list.php?lesson=intro');
$found = false;
foreach ($r['headers'] as $h) if (stripos($h, 'X-Request-Id') === 0) $found = true;
assert_true($found, 'list.php emits X-Request-Id header');

// ── Directory redirects ──────────────────────────────────────────────
function getLocationHeader($resp) {
	foreach ($resp['headers'] as $h) {
		if (stripos($h, 'Location:') === 0) return trim(substr($h, 9));
	}
	return '';
}
$r = api('GET', '/api/');
assert_eq(302, $r['status'], 'GET /api/ redirects');
assert_contains('panel.php', getLocationHeader($r), '/api/ redirect target');

$r = api('GET', '/api/feedback/');
assert_eq(302, $r['status'], 'GET /api/feedback/ redirects');
assert_contains('panel.php', getLocationHeader($r), '/api/feedback/ redirect target');

$r = api('GET', '/api/feedback/admin/');
assert_eq(302, $r['status'], 'GET /api/feedback/admin/ redirects');
assert_contains('panel.php', getLocationHeader($r), '/api/feedback/admin/ redirect target');

// ── File protection: the .htaccess files contain the rules ──────────
// (actual serving is enforced by Apache in production; the PHP built-in
// test server doesn't honor .htaccess, so we verify the configuration.)
$htaccess_files = [
	$ROOT . '/blog/.htaccess'    => ['search_cache', 'adminpw', 'feedback\.sqlite', 'Require all denied', 'Deny from all'],
	$ROOT . '/blog/api/.htaccess' => ['\\w+\.php', 'config\.php', 'Require all denied', 'Options -Indexes'],
];
foreach ($htaccess_files as $htFile => $needles) {
	$text = file_exists($htFile) ? file_get_contents($htFile) : '';
	foreach ($needles as $needle) {
		assert_contains($needle, (string)$text, "$htFile contains rule: $needle");
	}
}

// ── Done ──────────────────────────────────────────────────────────────
proc_terminate($server, 9);
proc_close($server);

echo "\nPassed: $pass\n";
echo "Failed: $fail\n";
if ($fail > 0) {
	echo "\n=== Failures ===\n";
	foreach ($errors as $e) echo "✗ $e\n";
	exit(1);
}
echo "\nAll tests passed ✓\n";
exit(0);
