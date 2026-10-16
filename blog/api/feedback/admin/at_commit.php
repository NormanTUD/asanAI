<?php
require_once __DIR__ . '/../_bootstrap.php';

if (feedback_method() !== 'GET') {
	feedback_method_help(
		'POST not allowed',
		'This endpoint is GET-only',
		'Use a regular browser GET request to /api/feedback/admin/at_commit.php?id=&lt;id&gt; (admins only). POST is not supported here.',
		'GET /api/feedback/admin/at_commit.php?id=42 HTTP/1.1\nCookie: fb_admin=&lt;token&gt;'
	);
}

if (!feedback_admin_authed()) {
	header('Location: /api/feedback/admin/login.php', true, 302);
	exit;
}

$id     = isset($_GET['id'])     ? (int)$_GET['id']    : 0;
$commit = isset($_GET['commit']) ? substr(trim($_GET['commit']), 0, 40) : '';

if (!$id) {
	feedback_json_error('Missing id parameter.', 400, 'id');
}

$pdo = feedback_bootstrap();
$stmt = $pdo->prepare('SELECT * FROM feedback WHERE id = ?');
$stmt->execute([$id]);
$row = $stmt->fetch(PDO::FETCH_ASSOC);
if (!$row) feedback_json_error('Feedback not found.', 404, 'id');

if (!$commit) $commit = $row['git_commit'] ?: '';
if (!$commit) {
	feedback_json_error('No git_commit stored on this feedback item. Cannot show historical anchor context.', 400, 'commit');
}

$slug    = $row['lesson_slug'];
$relPath = $slug . '.php';
$absPath = dirname(__DIR__, 2) . '/' . $relPath;

$fileAtCommit = '';
$fileCurrent  = '';
$gitError     = '';

$gitDir = dirname($absPath) . '/.git';
if (is_dir($gitDir)) {
	$cmd = sprintf(
		'cd %s && git show %s:%s 2>/dev/null',
		escapeshellarg(dirname($absPath)),
		escapeshellarg($commit),
		escapeshellarg($relPath)
	);
	$out = shell_exec($cmd);
	if (is_string($out) && $out !== '') $fileAtCommit = $out;
	if (!is_string($out) || $out === '') {
		$gitError = 'git show returned no content (commit not in repo? lesson path not tracked?).';
	}
	if (is_file($absPath)) $fileCurrent = file_get_contents($absPath);
} else {
	$gitError = 'No .git directory at ' . dirname($absPath);
}

function fb_extract_quote_context(string $file, string $quote, int $context = 800): ?array {
	if ($quote === '' || $file === '') return null;
	$idx = mb_strpos($file, $quote);
	if ($idx === false) {
		// try whitespace-normalized search
		$norm = preg_replace('/\s+/', ' ', mb_strtolower($file));
		$needle = preg_replace('/\s+/', ' ', mb_strtolower($quote));
		$idx2 = mb_strpos($norm, $needle);
		if ($idx2 === false) return null;
		return [
			'found'    => false,
			'normalized_match' => true,
			'preview'  => mb_substr($file, max(0, $idx2 - $context), 2 * $context),
			'offset'   => $idx2,
			'length'   => mb_strlen($quote),
		];
	}
	return [
		'found'   => true,
		'preview' => mb_substr($file, max(0, $idx - $context), 2 * $context),
		'offset'  => $idx,
		'length'  => mb_strlen($quote),
	];
}

$ctxOld = fb_extract_quote_context($fileAtCommit, $row['anchor_quote'] ?? '');
$ctxNew = fb_extract_quote_context($fileCurrent,  $row['anchor_quote'] ?? '');

$branchInfo = '';
if (is_dir($gitDir)) {
	$branchCmd = sprintf('cd %s && git rev-parse --abbrev-ref HEAD 2>/dev/null',
		escapeshellarg(dirname($absPath)));
	$b = shell_exec($branchCmd);
	if (is_string($b)) $branchInfo = trim($b);
	$logCmd = sprintf(
		'cd %s && git log --oneline --pretty=format:"%%h %%ad %%s" --date=short -n 5 %s 2>/dev/null',
		escapeshellarg(dirname($absPath)),
		escapeshellarg($commit . '^..' . $commit . ' 2>/dev/null')
	);
	$log = shell_exec($logCmd);
}

$pageTitle = 'Annotation #' . $id . ' at commit ' . substr($commit, 0, 7);
header('Content-Type: text/html; charset=utf-8');
header('Cache-Control: no-store');
?>
<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title><?php echo htmlspecialchars($pageTitle); ?></title>
<style>
	body { font: 14px/1.5 system-ui, sans-serif; max-width: 1100px; margin: 24px auto; padding: 0 16px; color: #1e293b; background: #faf8f1; }
	h1 { font-size: 18px; margin: 0 0 12px; }
	.meta { color: #64748b; font-size: 12px; margin-bottom: 16px; }
	.meta code { background: #f1f5f9; padding: 1px 5px; border-radius: 3px; font-size: 11px; }
	.section { margin: 18px 0; }
	.section h2 { font-size: 13px; text-transform: uppercase; letter-spacing: .04em; color: #64748b; margin: 0 0 8px; }
	pre { background: #fff; border: 1px solid #e2e8f0; border-radius: 6px; padding: 12px; overflow-x: auto;
		font: 12px/1.4 ui-monospace, "SF Mono", Consolas, monospace; white-space: pre-wrap; word-break: break-word; }
	mark.quote { background: #fef08a; padding: 0 2px; border-radius: 2px; }
	mark.match  { background: #bbf7d0; padding: 0 2px; border-radius: 2px; }
	.status { display: inline-block; padding: 2px 8px; border-radius: 3px; font-size: 11px; font-weight: 600; }
	.status.found    { background: #d1fae5; color: #064e3b; }
	.status.missing  { background: #fee2e2; color: #7f1d1d; }
	.status.warn     { background: #fef3c7; color: #78350f; }
	.warnbox { background: #fef3c7; border-left: 3px solid #f59e0b; padding: 8px 12px; border-radius: 3px; margin: 12px 0; }
	pre.diff { background: #f8fafc; }
	.del { background: #fee2e2; text-decoration: line-through; }
	.add { background: #d1fae5; }
</style>
</head>
<body>
<h1>📌 Annotation #<?php echo $id; ?> at commit <?php echo htmlspecialchars(substr($commit, 0, 7)); ?></h1>
<div class="meta">
	<strong>Lesson:</strong> <code><?php echo htmlspecialchars($slug); ?></code>
	&nbsp;·&nbsp; <strong>Branch:</strong> <code><?php echo htmlspecialchars($branchInfo ?: '?'); ?></code>
	&nbsp;·&nbsp; <strong>Submitted:</strong> <?php echo htmlspecialchars($row['created_at']); ?>
	&nbsp;·&nbsp; <strong>Stored commit:</strong> <code><?php echo htmlspecialchars($commit); ?></code>
	&nbsp;·&nbsp; <a href="/api/feedback/admin/panel.php">← back to admin</a>
</div>

<?php if ($gitError): ?>
	<div class="warnbox"><strong>⚠</strong> <?php echo htmlspecialchars($gitError); ?></div>
<?php endif; ?>

<div class="section">
	<h2>Original quote (what user selected)</h2>
	<pre><?php echo htmlspecialchars($row['anchor_quote'] ?? '(empty)'); ?></pre>
</div>

<div class="section">
	<h2>
		Quote at commit <?php echo htmlspecialchars(substr($commit, 0, 7)); ?> —
		<?php if ($ctxOld && $ctxOld['found']): ?>
			<span class="status found">FOUND</span>
		<?php elseif ($ctxOld && !empty($ctxOld['normalized_match'])): ?>
			<span class="status warn">FOUND (whitespace-normalized)</span>
		<?php else: ?>
			<span class="status missing">NOT FOUND</span>
		<?php endif; ?>
	</h2>
	<?php if ($ctxOld): ?>
		<pre>...<?php echo htmlspecialchars($ctxOld['preview']); ?>...</pre>
	<?php else: ?>
		<pre class="diff">(quote not present in <?php echo htmlspecialchars($relPath); ?> at this commit)</pre>
	<?php endif; ?>
</div>

<div class="section">
	<h2>
		Quote in current working file —
		<?php if ($ctxNew && $ctxNew['found']): ?>
			<span class="status found">FOUND</span>
		<?php elseif ($ctxNew && !empty($ctxNew['normalized_match'])): ?>
			<span class="status warn">FOUND (whitespace-normalized)</span>
		<?php else: ?>
			<span class="status missing">NOT FOUND</span>
		<?php endif; ?>
	</h2>
	<?php if ($ctxNew): ?>
		<pre>...<?php echo htmlspecialchars($ctxNew['preview']); ?>...</pre>
	<?php else: ?>
		<pre class="diff">(quote not present in current <?php echo htmlspecialchars($relPath); ?>)</pre>
	<?php endif; ?>
</div>

<div class="section">
	<h2>What does this tell us?</h2>
	<ul>
		<?php if ($ctxOld && $ctxOld['found'] && $ctxNew && $ctxNew['found']): ?>
			<li>✅ Quote is present at both the original commit and the current file → annotation <strong>can still be anchored</strong> (probably 'fresh' or 'moved' on the lesson page).</li>
		<?php elseif ($ctxOld && $ctxOld['found'] && (!$ctxNew || !$ctxNew['found'])): ?>
			<li>🟡 Quote existed at the original commit but is <strong>gone from the current file</strong> → annotation is <strong>orphan</strong>. Either the passage was rewritten or deleted.</li>
		<?php elseif ((!$ctxOld || !$ctxOld['found']) && $ctxNew && $ctxNew['found']): ?>
			<li>🟠 Quote was not at the original commit but is in the current file → the user <strong>selected a passage that wasn't rendered yet</strong> at submission time (e.g., draft, marked.js hadn't run).</li>
		<?php else: ?>
			<li>🔴 Quote is absent from both → <strong>fully orphaned</strong>. Resolve or close the item.</li>
		<?php endif; ?>
		<?php if ($ctxOld && $ctxOld['normalized_match']): ?>
			<li>⚠ Found via whitespace-normalized search only — formatting has changed since the commit.</li>
		<?php endif; ?>
		<li>Multi-quote / fuzzy anchor on the lesson page still has a chance to find it via chunks (<code>anchor_chunks</code>) even when the main quote doesn't match exactly.</li>
	</ul>
</div>

<div class="section">
	<h2>Stored anchor metadata</h2>
	<pre><?php echo htmlspecialchars(json_encode([
		'anchor_selector'     => $row['anchor_selector'],
		'anchor_offset'       => $row['anchor_offset'],
		'anchor_offset_end'   => $row['anchor_offset_end'],
		'anchor_prefix'       => $row['anchor_prefix'],
		'anchor_suffix'       => $row['anchor_suffix'],
		'anchor_chunks'       => $row['anchor_chunks'] ? json_decode($row['anchor_chunks'], true) : null,
		'anchor_section'      => $row['anchor_section'],
		'anchor_section_id'   => $row['anchor_section_id'],
		'anchor_section_title'=> $row['anchor_section_title'],
		'anchor_text_hash'    => $row['anchor_text_hash'],
		'anchor_status'       => $row['anchor_status'],
		'anchor_confidence'   => $row['anchor_confidence'],
		'last_reanchor_at'    => $row['last_reanchor_at'],
		'git_commit'          => $row['git_commit'],
		'git_branch'          => $row['git_branch'],
		'git_dirty'           => $row['git_dirty'],
	], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES)); ?></pre>
</div>

</body>
</html>
