<?php
/**
 * GET /api/feedback/setup.php
 *   Idempotent setup helper. Safe to call repeatedly.
 *   1. Resolves the data directory (creates if possible).
 *   2. Touches the SQLite file.
 *   3. Creates the patches dir.
 *   4. Reports what was done + any remaining manual steps.
 *
 *   Visit this page in a browser once after deployment to verify the
 *   system is healthy. The same banner that appears on every page
 *   disappears automatically once issues are resolved.
 */
require_once(__DIR__ . '/_health.php');

header('Content-Type: text/html; charset=utf-8');
header('Cache-Control: no-store');

$log    = feedback_setup_run();
$issues = feedback_check_setup();
?><!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta name="robots" content="noindex,nofollow">
<title>Feedback Setup · asanAI</title>
<style>
body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; background: #0f172a; color: #f1f5f9; margin: 0; padding: 30px 18px; }
.box { max-width: 760px; margin: 0 auto; background: #1e293b; border-radius: 14px; padding: 24px 28px; border: 1px solid #334155; }
h1 { margin: 0 0 12px; font-size: 22px; }
h2 { margin: 24px 0 8px; font-size: 16px; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.06em; }
.path { background: #0f172a; padding: 4px 10px; border-radius: 4px; font-family: ui-monospace, Menlo, monospace; font-size: 13px; color: #38bdf8; word-break: break-all; }
pre  { background: #0f172a; padding: 10px 12px; border-radius: 6px; border-left: 3px solid #e8604c; font-size: 12px; white-space: pre-wrap; color: #f1f5f9; overflow-x: auto; }
.ok   { color: #10b981; }
.warn { color: #f59e0b; }
.err  { color: #f87171; }
ul    { padding-left: 18px; }
li    { margin-bottom: 6px; }
.fix { margin-top: 4px; }
hr   { border: none; border-top: 1px solid #334155; margin: 24px 0; }
small { color: #94a3b8; font-size: 12px; }
a { color: #38bdf8; }
</style>
</head>
<body>
<div class="box">
	<h1>🐛 Feedback System — Setup</h1>
	<p>This page runs every idempotent setup step and reports what's left to do by hand. Safe to re-run anytime.</p>

	<h2>Storage</h2>
	<p><b>Data dir:</b> <span class="path"><?php echo htmlspecialchars(FEEDBACK_DATA_DIR); ?></span></p>
	<p><b>SQLite:</b>  <span class="path"><?php echo htmlspecialchars(FEEDBACK_DB_PATH); ?></span></p>
	<p><b>Patches:</b> <span class="path"><?php echo htmlspecialchars(FEEDBACK_PATCHES_DIR); ?></span></p>
	<p><b>Admin pw:</b><span class="path"><?php echo htmlspecialchars(FEEDBACK_ADMIN_PW_FILE); ?></span></p>

	<h2>What I just did</h2>
	<?php if (empty($log)): ?>
		<p class="ok">✓ Nothing to do — already set up.</p>
	<?php else: ?>
		<ul>
		<?php foreach ($log as $line): ?>
			<li class="<?php echo strpos($line, 'ERROR') === 0 ? 'err' : (strpos($line, 'NOTE') === 0 ? 'warn' : 'ok'); ?>"><?php echo htmlspecialchars($line); ?></li>
		<?php endforeach; ?>
		</ul>
	<?php endif; ?>

	<h2>Remaining issues</h2>
	<?php if (empty($issues)): ?>
		<p class="ok">✓ All clear. The system is healthy.</p>
	<?php else: ?>
		<ol>
		<?php foreach ($issues as $i): ?>
			<li>
				<b>[<?php echo htmlspecialchars($i['severity']); ?>]</b>
				<?php echo htmlspecialchars($i['what']); ?><br>
				<code class="path"><?php echo htmlspecialchars($i['path']); ?></code>
				<pre class="fix"><?php echo htmlspecialchars($i['fix']); ?></pre>
				<?php if ($i['note']): ?><small><?php echo htmlspecialchars($i['note']); ?></small><?php endif; ?>
			</li>
		<?php endforeach; ?>
		</ol>
	<?php endif; ?>

	<hr>

	<h2>Move the data outside the web root (recommended for production)</h2>
	<p>By default the system uses <code><?php echo htmlspecialchars(FEEDBACK_DATA_DIR); ?></code>. To move it system-wide:</p>
	<pre>sudo mkdir -p /var/lib/asanai_feedback
sudo chown $USER:$USER /var/lib/asanai_feedback
sudo chmod 775 /var/lib/asanai_feedback</pre>
	<p>The first writable directory in the candidate list is used. Override with the <code>ASANAI_FEEDBACK_DIR</code> env var, or by editing <code>api/feedback/config.php</code>.</p>

	<h2>Admin password</h2>
	<p>The admin panel is at <a href="admin/panel.php">api/feedback/admin/panel.php</a>. The first time you visit, it'll show you the exact command to write the bcrypt hash:</p>
	<pre>php -r "echo password_hash('YourSecretPassword', PASSWORD_BCRYPT);" &gt; <?php echo htmlspecialchars(FEEDBACK_ADMIN_PW_FILE); ?> &amp;&amp; chmod 440 <?php echo htmlspecialchars(FEEDBACK_ADMIN_PW_FILE); ?></pre>
	<p>Or, for a system-wide file:</p>
	<pre>php -r "echo password_hash('YourSecretPassword', PASSWORD_BCRYPT);" | sudo tee /etc/adminpw &amp;&amp; sudo chmod 440 /etc/adminpw</pre>
	<p>The site <b>never sees your plain password</b> — bcrypt verifies against the hash only.</p>

	<hr>
	<p><small>Verification re-runs every page load. After fixing any issue, refresh — the banner disappears automatically.</small></p>
</div>
</body>
</html>
