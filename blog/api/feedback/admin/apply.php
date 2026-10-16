<?php
/**
 * POST /api/feedback/admin/apply.php
 *   Admin-only — turn a "suggestion" feedback into an actionable artifact.
 *
 *   The system NEVER auto-edits files. The endpoint returns a unified
 *   diff (and also the raw original/replacement text) so the admin can
 *   copy the patch and apply it in their editor. We also write a
 *   "patch" file under feedback_data/patches/ that is git-tracked, so
 *   there's a paper trail.
 *
 *   Optionally the admin can pass commit=1 to have the system write
 *   the patch file to disk; the admin then reviews it, runs
 *   `git apply` manually, and commits. (No auto-commit — that would
 *   require write access from the web user to the repo, which the
 *   project doesn't have, and would be a security footgun.)
 */
require_once(__DIR__ . '/../_bootstrap.php');
require_once(__DIR__ . '/../_diff.php');
feedback_require_method('POST');
feedback_admin_authed() or feedback_json_error('Not authenticated', 401);

$in  = feedback_input();
$id  = (int)($in['id'] ?? 0);
if ($id <= 0) feedback_json_error('id required', 400);

$pdo = feedback_bootstrap();
$row = $pdo->prepare('SELECT * FROM feedback WHERE id = ?');
$row->execute([$id]);
$fb = $row->fetch(PDO::FETCH_ASSOC);
if (!$fb) feedback_json_error('Not found', 404);
if ($fb['anchor_type'] !== 'suggestion' || !$fb['suggestion_original'] || !$fb['suggestion_replacement']) {
	feedback_json_error('This feedback is not a text suggestion.', 400);
}

$lessonSlug = $fb['lesson_slug'];
$orig  = $fb['suggestion_original'];
$repl  = $fb['suggestion_replacement'];

$candidates = [
	__DIR__ . '/../../../' . $lessonSlug . '.php',
	__DIR__ . '/../../../' . $lessonSlug . '.html',
];
$file = null;
foreach ($candidates as $c) { if (is_file($c)) { $file = $c; break; } }
if (!$file) feedback_json_error('Lesson file not found on disk.', 404);

$content = (string)@file_get_contents($file);
$count = substr_count($content, $orig);

if ($count === 0) {
	feedback_json_error('Original text not found in file — cannot generate patch. The text may have been edited since this suggestion was filed.', 409);
}

$replaced = str_replace($orig, $repl, $content);
$patch = feedback_make_unified_diff($content, $replaced, $lessonSlug . '.php');

$patchDir = dirname(FEEDBACK_DB_PATH) . '/patches';
@mkdir($patchDir, 0775, true);
$patchFile = $patchDir . '/' . $lessonSlug . '.' . $id . '.patch';
@file_put_contents($patchFile, $patch);

feedback_admin_log('patch_generated', $id, null, null,
	'patch file: ' . basename($patchFile) . ' (matches in file: ' . $count . ')');

feedback_json_response([
	'ok'         => true,
	'lesson'     => $lessonSlug,
	'file'       => basename($file),
	'matches'    => $count,
	'patch_file' => basename($patchFile),
	'patch'      => $patch,
	'note'       => $count > 1
		? 'The original text appears ' . $count . ' times in the file. The patch applies to ALL of them — review carefully before running `git apply`.'
		: 'Single match — patch is safe to apply.',
]);
