<?php
/**
 * GET /api/feedback/admin/panel.php
 *   The admin panel page. Renders server-side so the user sees the
 *   dashboard as soon as they're authenticated (no JS round-trip
 *   needed). The JS layer still does live refresh + filter updates.
 *
 * POST: handles the login form natively — sets the admin cookie and
 *   redirects back to panel.php. This is the fallback path that
 *   works even if JS fails.
 */
require_once(__DIR__ . '/../_bootstrap.php');

if (feedback_method() === 'POST') {
	$pw = (string)($_POST['password'] ?? '');
	$pwFile = FEEDBACK_ADMIN_PW_FILE;
	$errCode = 1; // generic fallback

	if ($pw === '') {
		$errCode = 2; // empty password
	} elseif (!is_file($pwFile)) {
		$errCode = 3; // no password file
	} elseif (!is_readable($pwFile)) {
		$errCode = 4; // unreadable
	} else {
		$hash = trim((string)@file_get_contents($pwFile));
		if ($hash === '') {
			$errCode = 5; // empty hash file
		} elseif (!password_verify($pw, $hash)) {
			$errCode = 1; // wrong password
		} else {
			// Success — set cookie + redirect
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
			header('Location: ' . preg_replace('/\?.*$/', '', $_SERVER['REQUEST_URI']));
			exit;
		}
	}
	header('Location: ' . preg_replace('/\?.*$/', '', $_SERVER['REQUEST_URI']) . '?err=' . $errCode);
	exit;
}

$isAuthed = feedback_admin_authed();
$errCode = isset($_GET['err']) ? (int)$_GET['err'] : 0;

$errorMessages = [
	1 => ['Wrong password.',                                        'Try again, or set up a new password in the section below.'],
	2 => ['Please enter a password.',                               ''],
	3 => ['Admin password file is missing.',                        'Run the setup command in the section below. The page cannot log you in until the file exists.'],
	4 => ['Admin password file is not readable by the web server.', 'Run the chmod command shown in the section below to make it readable by the web user (usually www-data).'],
	5 => ['Admin password file is empty.',                          'Run the setup command in the section below to write a valid bcrypt hash.'],
];
$showError = $errCode > 0 && isset($errorMessages[$errCode]);

header('Content-Type: text/html; charset=utf-8');
header('Cache-Control: no-store');
?><!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta name="robots" content="noindex,nofollow">
<title>Feedback Admin · asanAI</title>
<link rel="stylesheet" href="../../../feedback/admin.css?v=<?php echo @filemtime(__DIR__ . '/../../../feedback/admin.css'); ?>">
</head>
<body class="fb-admin">
<div id="fb-admin-login" class="fb-admin-login"<?php echo $isAuthed ? ' hidden' : ''; ?>>
	<h1>🐛 Feedback Admin</h1>
	<p class="fb-admin-sub">Sign in to manage feedback across the course.</p>
	<form id="fb-login-form" method="post" action="">
		<input type="password" name="password" placeholder="Admin password" autofocus required>
		<button type="submit">Sign in</button>
	</form>
	<p class="fb-admin-err" id="fb-login-err"<?php echo $showError ? '' : ' hidden'; ?>>
		<?php if ($showError): ?>
			<b><?php echo htmlspecialchars($errorMessages[$errCode][0]); ?></b>
			<?php if (!empty($errorMessages[$errCode][1])): ?>
				<br><small style="display:block;margin-top:4px"><?php echo htmlspecialchars($errorMessages[$errCode][1]); ?></small>
			<?php endif; ?>
		<?php endif; ?>
	</p>
	<details class="fb-admin-setup">
		<summary>How do I create the admin password?</summary>
		<ol>
			<li>Run this command on the server to write a bcrypt hash to <code><?php echo htmlspecialchars(FEEDBACK_ADMIN_PW_FILE); ?></code>:<br>
				<pre>php -r "echo password_hash('YourPassword', PASSWORD_BCRYPT);" &gt; <?php echo htmlspecialchars(FEEDBACK_ADMIN_PW_FILE); ?> && chmod 440 <?php echo htmlspecialchars(FEEDBACK_ADMIN_PW_FILE); ?></pre>
			</li>
			<li>For a system-wide file at <code>/etc/adminpw</code>:<br>
				<pre>php -r "echo password_hash('YourPassword', PASSWORD_BCRYPT);" | sudo tee /etc/adminpw &amp;&amp; sudo chmod 440 /etc/adminpw</pre>
			</li>
			<li>Change the path in <code>api/feedback/config.php</code> if you use a different location.</li>
		</ol>
		<p>The hash file must be readable by the web user (www-data). The site never sees your plain password — bcrypt verifies against the hash.</p>
	</details>
</div>
<div id="fb-admin-app" class="fb-admin-app"<?php echo $isAuthed ? '' : ' hidden'; ?>>
	<header class="fb-admin-bar">
		<h1>🐛 Feedback</h1>
		<div class="fb-admin-stats" id="fb-admin-stats"></div>
		<div class="fb-admin-actions">
			<button id="fb-export" type="button">Export JSON</button>
			<button id="fb-logout" type="button">Sign out</button>
		</div>
	</header>
	<div class="fb-admin-body">
		<aside class="fb-admin-side">
			<div class="fb-admin-filters">
				<label>Status
					<select id="fb-f-status">
						<option value="">all</option>
						<option value="open">open</option>
						<option value="in_progress">in progress</option>
						<option value="resolved">resolved</option>
						<option value="wontfix">won't fix</option>
					</select>
				</label>
				<label>Category
					<select id="fb-f-cat">
						<option value="">all</option>
						<option value="bug">bug</option>
						<option value="typo">typo</option>
						<option value="suggestion">suggestion</option>
						<option value="question">question</option>
						<option value="content">content</option>
						<option value="other">other</option>
					</select>
				</label>
				<label>Approval
					<select id="fb-f-approved">
						<option value="">all</option>
						<option value="0">pending</option>
						<option value="1">approved</option>
					</select>
				</label>
				<label>Lesson
					<input id="fb-f-lesson" placeholder="(any)">
				</label>
				<label>Search
					<input id="fb-f-q" placeholder="text…">
				</label>
				<label>Sort
					<select id="fb-f-sort">
						<option value="new">newest first</option>
						<option value="old">oldest first</option>
					</select>
				</label>
				<button id="fb-f-apply" type="button">Apply filters</button>
			</div>
			<div class="fb-admin-aha">
				<h2>Top "aha" passages</h2>
				<ol id="fb-aha-list"><li class="fb-muted">loading…</li></ol>
			</div>
			<div class="fb-admin-by-lesson">
				<h2>By lesson</h2>
				<ol id="fb-lesson-list"><li class="fb-muted">loading…</li></ol>
			</div>
		</aside>
		<main class="fb-admin-list" id="fb-admin-list"></main>
	</div>
</div>
<script src="../../../feedback/admin.js?v=<?php echo @filemtime(__DIR__ . '/../../../feedback/admin.js'); ?>" defer></script>
</body>
</html>
