<?php
/**
 * POST /api/feedback/edit.php
 *   Public — let a user edit their OWN pending feedback.
 *
 *   Rules:
 *   - Must come from the same browser (visitor_id cookie matches
 *     the feedback's visitor_id).
 *   - Can only edit feedback that's still `approved = 0` (pending
 *     admin review). Once approved, the post is "frozen" — admin
 *     must edit via the admin panel.
 *   - Can only edit while status is one of: open, in_progress, wontfix.
 *     (Resolved items are frozen.)
 *
 * Body:
 *   id          required, int
 *   body        optional, max 4000
 *   category    optional
 *   challenge_token
 *   honeypot    must be empty
 */
require_once(__DIR__ . '/_bootstrap.php');

if (feedback_method() === 'GET') {
	feedback_method_help(
		'Edit feedback',
		'✏️ Edit Own Feedback',
		'This URL lets a visitor edit their OWN pending feedback — once the admin has approved it, the post is frozen. It is called by the ✏️ Edit button inside a post-it (only shown for posts you wrote).',
		"POST /api/feedback/edit.php\nContent-Type: application/json\n\n{\n  \"id\":   42,\n  \"body\": \"The corrected body text.\"\n}"
	);
}

feedback_require_method('POST');
$in = feedback_input();

if (($in['honeypot'] ?? '') !== '') {
	feedback_json_error('Spam detected — honeypot field was filled.', 400, 'honeypot');
}

$expected = $_COOKIE['fb_challenge'] ?? '';
$given    = $in['challenge_token'] ?? '';
if (!$expected || !$given || !hash_equals($expected, $given)) {
	feedback_json_error(
		'Missing or invalid challenge token. The page sets this cookie automatically — if you see this error, try reloading.',
		400, 'challenge_token'
	);
}

$id = (int)($in['id'] ?? 0);
if ($id <= 0) feedback_json_error('id is required.', 400, 'id');

$visitorId = feedback_visitor_id();
if (!$visitorId) {
	feedback_json_error(
		'Missing visitor identity. Reload the page — your browser needs a stable id so we can show you your own feedback.',
		400, 'visitor_id'
	);
}

$pdo = feedback_bootstrap();
$row = $pdo->prepare('SELECT id, visitor_id, status, approved, body, category FROM feedback WHERE id = ?');
$row->execute([$id]);
$fb = $row->fetch(PDO::FETCH_ASSOC);
if (!$fb) feedback_json_error('Feedback #' . $id . ' does not exist.', 404);

if (empty($fb['visitor_id']) || !hash_equals((string)$fb['visitor_id'], $visitorId)) {
	feedback_json_error(
		'You can only edit your own feedback.',
		403
	);
}

if ((int)$fb['approved'] === 1) {
	feedback_json_error(
		'This feedback has been approved and is now frozen. Open the admin panel if changes are needed.',
		403
	);
}

if (!in_array($fb['status'], ['open', 'in_progress', 'wontfix'], true)) {
	feedback_json_error(
		'This feedback is resolved and can no longer be edited.',
		403
	);
}

$updates = [];
$params  = [];

if (isset($in['body'])) {
	$body = feedback_clean(feedback_str($in['body'], 4000, 'body'));
	if ($body === '') feedback_json_error('body cannot be empty.', 400, 'body');
	$updates[] = 'body = ?'; $params[] = $body;
}

if (isset($in['category'])) {
	$cat = $in['category'];
	if (!in_array($cat, ['bug', 'typo', 'suggestion', 'question', 'content', 'other'], true)) {
		feedback_json_error('Invalid category.', 400, 'category');
	}
	$updates[] = 'category = ?'; $params[] = $cat;
}

if (!$updates) feedback_json_error('Nothing to update.', 400);

$updates[] = 'updated_at = datetime("now")';
$params[] = $id;

$sql = 'UPDATE feedback SET ' . implode(', ', $updates) . ' WHERE id = ?';
try {
	$pdo->prepare($sql)->execute($params);
} catch (Exception $e) {
	feedback_json_error('Database write failed: ' . $e->getMessage(), 500);
}

feedback_admin_log('edited', $id, null, null,
	'visitor-edit (' . count($updates) . ' fields) visitor=' . substr($visitorId, 0, 8));

feedback_json_response([
	'ok'         => true,
	'id'         => $id,
	'toast'      => 'Feedback updated.',
]);
