<?php
/**
 * POST /api/feedback/comment.php
 *   Public — add a comment on an existing feedback item.
 *   Comments are anonymous (handle optional), always visible once
 *   the parent feedback is approved.
 *
 *   Users can always see their own comments even if the parent
 *   feedback is not yet approved — the visitor_id cookie identifies
 *   the author reliably across reloads.
 *
 * Admin can post with is_admin=1 (when their session cookie is set)
 * — those comments are tagged "from admin".
 *
 * Accepts JSON or form-encoded:
 *   feedback_id        required, int
 *   body               required, max 2000
 *   author_handle      optional, max 60
 *   author_email       optional, must validate as email
 *   honeypot           must be empty
 *   challenge_token    must equal server cookie
 */
require_once(__DIR__ . '/_bootstrap.php');

if (feedback_method() === 'GET') {
	feedback_method_help(
		'Post comment',
		'💬 Feedback Comment',
		'This URL lets visitors and the admin post threaded comments on a feedback item. It is called by the reply field inside each post-it.',
		"POST /api/feedback/comment.php\nContent-Type: application/json\n\n{\n  \"feedback_id\": 42,\n  \"body\":        \"The reply text.\",\n  \"author_handle\": \"Anna\",\n  \"author_email\":  \"anna@example.com\"\n}"
	);
}

feedback_require_method('POST');
$in = feedback_input();

$fbId = (int)($in['feedback_id'] ?? 0);
$body = feedback_clean(feedback_str($in['body'] ?? '', 2000, 'body'));
if ($fbId <= 0) {
	feedback_json_error('Missing feedback_id.', 400, 'feedback_id');
}
if ($body === '') {
	feedback_json_error('Comment body is empty.', 400, 'body');
}
if (mb_strlen($body) < 2) {
	feedback_json_error('Comment is too short.', 400, 'body');
}

$handle = feedback_clean(feedback_str($in['author_handle'] ?? '', 60, 'author_handle'));
$email  = feedback_clean(feedback_str($in['author_email']  ?? '', 200, 'author_email'));
if ($email !== '' && !filter_var($email, FILTER_VALIDATE_EMAIL)) {
	feedback_json_error(
		'Email is not a valid address. Leave it empty to stay anonymous.',
		400, 'author_email'
	);
}

if (($in['honeypot'] ?? '') !== '') {
	feedback_json_error('Spam detected — honeypot field was filled.', 400, 'honeypot');
}

$expected = $_COOKIE['fb_challenge'] ?? '';
$given    = $in['challenge_token'] ?? '';
if (!$expected || !$given || !hash_equals($expected, $given)) {
	feedback_json_error(
		'Missing or invalid challenge token. Reload the page and try again.',
		400, 'challenge_token'
	);
}

$visitorId = feedback_visitor_id();

feedback_rate_limit('comment:' . feedback_client_ip());
feedback_rate_limit('comment_v:' . ($visitorId ?: feedback_client_ip()));

$pdo = feedback_bootstrap();
$row = $pdo->prepare('SELECT id, approved, status, visitor_id FROM feedback WHERE id = ?');
$row->execute([$fbId]);
$fb = $row->fetch(PDO::FETCH_ASSOC);
if (!$fb) {
	feedback_json_error('Feedback #' . $fbId . ' does not exist (it may have been deleted).', 404);
}

$isAdmin = feedback_admin_authed();
$isOwn   = $visitorId && !empty($fb['visitor_id']) && hash_equals((string)$fb['visitor_id'], $visitorId);

if (!$fb['approved'] && !$isAdmin && !$isOwn) {
	feedback_json_error(
		'This feedback is not yet visible — only the original author and the admin can comment on it until it is approved.',
		403
	);
}

try {
	$pdo->prepare('INSERT INTO feedback_comments (feedback_id, body, author_handle, author_email, visitor_id, is_admin) VALUES (?, ?, ?, ?, ?, ?)')
		->execute([
			$fbId,
			$body,
			$handle !== '' ? $handle : null,
			$email  !== '' ? $email  : null,
			$visitorId ?: null,
			$isAdmin ? 1 : 0,
		]);
} catch (Exception $e) {
	feedback_json_error('Database write failed: ' . $e->getMessage(), 500);
}

$commentId = (int)$pdo->lastInsertId();
$pdo->prepare('UPDATE feedback SET reply_count = reply_count + 1, updated_at = datetime("now") WHERE id = ?')
	->execute([$fbId]);

feedback_admin_log('commented', $fbId, null, null,
	($isAdmin ? 'admin' : 'user') . ' reply (' . mb_strlen($body) . ' chars) visitor=' . substr($visitorId ?: '-', 0, 8));

feedback_json_response([
	'ok'         => true,
	'id'         => $commentId,
	'is_admin'   => $isAdmin,
	'handle'     => $isAdmin ? 'admin' : ($handle ?: ''),
	'body'       => $body,
	'created_at' => date('Y-m-d H:i:s'),
	'is_own'     => !$isAdmin,
	'toast'      => 'Reply posted.',
], 201);
