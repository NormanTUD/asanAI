<?php
/**
 * POST /api/feedback/admin/login.php
 *   Verifies the supplied password against the bcrypt hash stored in
 *   FEEDBACK_ADMIN_PW_FILE (default: blog/adminpw). On success,
 *   issues a session token cookie.
 *
 * Body:
 *   password        required
 *
 * On missing/unreadable hash file, returns 503 with installation
 * instructions — never reveals whether the password was correct.
 */
require_once(__DIR__ . '/../_bootstrap.php');

if (feedback_method() === 'GET') {
	feedback_method_help(
		'Admin login',
		'🔐 Admin Login',
		'This URL logs the admin in by issuing a session cookie. Open the <a href="panel.php">admin panel</a> instead and use the form there.',
		"POST /api/feedback/admin/login.php\nContent-Type: application/json\n\n{ \"password\": \"<your bcrypt-verified password>\" }"
	);
}

feedback_require_method('POST');
$in = feedback_input();

$pwFile = FEEDBACK_ADMIN_PW_FILE;
$pw = (string)($in['password'] ?? '');

if ($pw === '' || !is_file($pwFile) || !is_readable($pwFile)) {
	header('Content-Type: application/json; charset=utf-8');
	http_response_code(503);
	$pwEsc    = escapeshellarg('YourSecretPassword');
	$fileEsc  = escapeshellarg($pwFile);
	$install  = 'php -r "echo password_hash(' . $pwEsc . ', PASSWORD_BCRYPT);" > ' . $fileEsc
		. ' && chmod 440 ' . $fileEsc;
	$installRooted = 'php -r "echo password_hash(' . $pwEsc . ', PASSWORD_BCRYPT);" | sudo tee /etc/adminpw && sudo chmod 440 /etc/adminpw';
	echo json_encode([
		'error' => 'Admin password file is not set up.',
		'install_command' => $install,
		'install_command_root' => $installRooted,
		'note' => 'The hash file is at ' . $pwFile . '. The php command prints a bcrypt hash; redirect to file. To use /etc/adminpw instead, edit api/feedback/config.php.',
	], JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES);
	exit;
}

$hash = trim((string)@file_get_contents($pwFile));
if ($hash === '' || !password_verify($pw, $hash)) {
	http_response_code(401);
	header('Content-Type: application/json; charset=utf-8');
	echo json_encode(['error' => 'Wrong password.']);
	exit;
}

if (password_needs_rehash($hash, PASSWORD_BCRYPT)) {
	@file_put_contents($pwFile, password_hash($pw, PASSWORD_BCRYPT));
}

$pdo = feedback_bootstrap();
$token = bin2hex(random_bytes(20));
$expires = date('Y-m-d H:i:s', time() + FEEDBACK_ADMIN_TTL);

$pdo->prepare('INSERT INTO admin_sessions (token, expires_at) VALUES (?, ?)')
	->execute([$token, $expires]);

setcookie(FEEDBACK_ADMIN_COOKIE, $token, [
	'expires'  => time() + FEEDBACK_ADMIN_TTL,
	'path'     => '/',
	'sameSite' => 'Strict',
	'httponly' => false,
]);

feedback_json_response([
	'ok' => true,
	'token' => $token,
	'expires_at' => $expires,
]);
