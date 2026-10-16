<?php
/**
 * POST /api/feedback/submit.php
 *   Public endpoint — anyone can submit feedback.
 *
 * Accepts JSON or form-encoded data:
 *   lesson_slug         required, string
 *   anchor_type         required, "text" | "general" | "suggestion" |
 *                                 "image" | "heading" | "code" | "table"
 *   body                required, the feedback text (max 4000)
 *   category            optional, default "bug"
 *   author_handle       optional, max 60
 *   author_email        optional, max 200, validated
 *   anchor_selector     optional, CSS path
 *   anchor_xpath        optional, XPath
 *   anchor_quote        optional, max 800
 *   anchor_prefix       optional, max 120
 *   anchor_suffix       optional, max 120
 *   anchor_offset       optional, int
 *   anchor_offset_end   optional, int
 *   anchor_section      optional, free-form section label
 *   anchor_section_id   optional, nearest heading id
 *   anchor_image_src    optional, image URL (image anchors)
 *   anchor_image_alt    optional, image alt text
 *   anchor_caption      optional, figcaption text
 *   anchor_viewport_x   optional, int
 *   anchor_viewport_y   optional, int
 *   suggestion_original   optional, max 1000
 *   suggestion_replacement optional, max 2000
 *   honeypot            must be empty (anti-bot)
 *   challenge_token     must equal the server-issued token
 */
require_once(__DIR__ . '/_bootstrap.php');

if (feedback_method() === 'GET') {
	feedback_method_help(
		'Submit feedback',
		'🐛 Feedback Submit Endpoint',
		'This URL is the JSON API the feedback widget calls when you submit feedback via the 🐛 button on a lesson page.',
		"POST /api/feedback/submit.php\nContent-Type: application/json\n\n{\n  \"lesson_slug\": \"intro\",\n  \"anchor_type\":  \"text\",\n  \"category\":     \"bug\",\n  \"body\":         \"What I want to say…\",\n  \"anchor_quote\": \"the selected text\"\n}"
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

$lesson = feedback_str($in['lesson_slug'] ?? '', 80, 'lesson_slug');
if ($lesson === '' || !preg_match('/^[a-z0-9_\-]+$/', $lesson)) {
	feedback_json_error(
		'Invalid lesson_slug. Expected a short slug like "intro" or "math_iv".',
		400, 'lesson_slug'
	);
}

$allowedTypes = ['text', 'general', 'suggestion', 'image', 'heading', 'code', 'table'];
$anchorType = $in['anchor_type'] ?? 'general';
if (!in_array($anchorType, $allowedTypes, true)) {
	feedback_json_error(
		'Invalid anchor_type "' . $anchorType . '". Allowed: ' . implode(', ', $allowedTypes) . '.',
		400, 'anchor_type'
	);
}

$body = feedback_clean(feedback_str($in['body'] ?? '', 4000, 'body'));
// For suggestions, the replacement carries the actual content; body is optional.
// For everything else, body is required.
if ($body === '' && $anchorType !== 'suggestion') {
	feedback_json_error('A body (your note) is required.', 400, 'body');
}

$cat = $in['category'] ?? 'bug';
$allowedCats = ['bug', 'typo', 'suggestion', 'question', 'content', 'other'];
if (!in_array($cat, $allowedCats, true)) {
	feedback_json_error(
		'Invalid category "' . $cat . '". Allowed: ' . implode(', ', $allowedCats) . '.',
		400, 'category'
	);
}

$handle = feedback_clean(feedback_str($in['author_handle'] ?? '', 60, 'author_handle'));
$email  = feedback_clean(feedback_str($in['author_email']  ?? '', 200, 'author_email'));
if ($email !== '' && !filter_var($email, FILTER_VALIDATE_EMAIL)) {
	feedback_json_error(
		'Email is not a valid address. Leave it empty to stay anonymous.',
		400, 'author_email'
	);
}

$git = feedback_git_info();

$quote  = feedback_clean(feedback_str($in['anchor_quote']  ?? '', 800,  'anchor_quote'));
$prefix = feedback_clean(feedback_str($in['anchor_prefix'] ?? '', 120,  'anchor_prefix'));
$suffix = feedback_clean(feedback_str($in['anchor_suffix'] ?? '', 120,  'anchor_suffix'));
$sel    = feedback_clean(feedback_str($in['anchor_selector'] ?? '', 1000, 'anchor_selector'));
$xpath  = feedback_clean(feedback_str($in['anchor_xpath']    ?? '', 1000, 'anchor_xpath'));

$chunksJson = '';
if (isset($in['anchor_chunks']) && is_array($in['anchor_chunks'])) {
	$cleanChunks = [];
	foreach (array_slice($in['anchor_chunks'], 0, 4) as $c) {
		$c = feedback_clean(feedback_str((string)$c, 300, 'anchor_chunks'));
		if ($c !== '') $cleanChunks[] = $c;
	}
	if ($cleanChunks) $chunksJson = json_encode($cleanChunks, JSON_UNESCAPED_UNICODE);
}
$sectionTitle = feedback_clean(feedback_str($in['anchor_section_title'] ?? '', 200, 'anchor_section_title'));
$textHash     = feedback_clean(feedback_str($in['anchor_text_hash']     ?? '',  64, 'anchor_text_hash'));

$imgSrc = feedback_clean(feedback_str($in['anchor_image_src'] ?? '', 500, 'anchor_image_src'));
$imgAlt = feedback_clean(feedback_str($in['anchor_image_alt'] ?? '', 300, 'anchor_image_alt'));
$cap    = feedback_clean(feedback_str($in['anchor_caption']    ?? '', 500, 'anchor_caption'));

$sugOrig = feedback_clean(feedback_str($in['suggestion_original']    ?? '', 1000, 'suggestion_original'));
$sugNew  = feedback_clean(feedback_str($in['suggestion_replacement'] ?? '', 2000, 'suggestion_replacement'));
if ($anchorType === 'suggestion') {
	if ($sugOrig === '' || $sugNew === '') {
		feedback_json_error(
			'A suggestion needs both the original text and your replacement. Select the passage first, then type the new wording.',
			400, 'suggestion_replacement'
		);
	}
	if (mb_strlen($sugOrig) < 2 || mb_strlen($sugNew) < 2) {
		feedback_json_error('Suggestion text is too short to be useful.', 400, 'suggestion_replacement');
	}
}

$visitorId = feedback_visitor_id();

feedback_rate_limit('submit:' . feedback_client_ip());
feedback_rate_limit('submit_v:' . ($visitorId ?: feedback_client_ip()));

$pdo = feedback_bootstrap();
$uuid = feedback_uuid();

try {
	$stmt = $pdo->prepare('
		INSERT INTO feedback (
			uuid, lesson_slug, category, anchor_type,
			anchor_selector, anchor_xpath,
			anchor_quote, anchor_prefix, anchor_suffix,
			anchor_offset, anchor_offset_end,
			anchor_section, anchor_section_id,
			anchor_chunks, anchor_section_title, anchor_text_hash,
			anchor_image_src, anchor_image_alt, anchor_caption,
			anchor_viewport_x, anchor_viewport_y,
			body, suggestion_original, suggestion_replacement,
			author_handle, author_email, visitor_id,
			git_commit, git_branch, git_dirty,
			user_agent, page_url, viewport,
			approved
		) VALUES (
			?, ?, ?, ?,
			?, ?,
			?, ?, ?,
			?, ?,
			?, ?,
			?, ?, ?,
			?, ?, ?,
			?, ?,
			?, ?, ?,
			?, ?, ?,
			?, ?, ?,
			?, ?, ?,
			0
		)
	');
	$stmt->execute([
		$uuid, $lesson, $cat, $anchorType,
		$sel, $xpath,
		$quote, $prefix, $suffix,
		isset($in['anchor_offset'])     ? (int)$in['anchor_offset']     : null,
		isset($in['anchor_offset_end']) ? (int)$in['anchor_offset_end'] : null,
		feedback_clean(feedback_str($in['anchor_section']    ?? '', 200, 'anchor_section')),
		feedback_clean(feedback_str($in['anchor_section_id'] ?? '', 200, 'anchor_section_id')),
		$chunksJson ?: null,
		$sectionTitle !== '' ? $sectionTitle : null,
		$textHash     !== '' ? $textHash     : null,
		$imgSrc ?: null, $imgAlt ?: null, $cap ?: null,
		isset($in['anchor_viewport_x']) ? (int)$in['anchor_viewport_x'] : null,
		isset($in['anchor_viewport_y']) ? (int)$in['anchor_viewport_y'] : null,
		$body, $sugOrig, $sugNew,
		$handle !== '' ? $handle : null,
		$email  !== '' ? $email  : null,
		$visitorId ?: null,
		$git['commit'] ?: null,
		$git['branch'] ?: null,
		$git['dirty'],
		substr($_SERVER['HTTP_USER_AGENT'] ?? '', 0, 500),
		feedback_clean(feedback_str($in['page_url'] ?? '', 500, 'page_url')),
		feedback_clean(feedback_str($in['viewport']  ?? '', 50,  'viewport')),
	]);
} catch (Exception $e) {
	feedback_json_error('Database write failed: ' . $e->getMessage(), 500);
}

$id = (int)$pdo->lastInsertId();
feedback_admin_log('created', $id, null, null,
	'Anonymous submission (' . $cat . ')' . ($email ? ' [email stored]' : '') . ' visitor=' . substr($visitorId ?: '-', 0, 8));

feedback_json_response([
	'ok'          => true,
	'id'          => $id,
	'uuid'        => $uuid,
	'approved'    => false,
	'visitor_id'  => $visitorId,
	'category'    => $cat,
	'anchor_type' => $anchorType,
	'body'        => $body,
	'created_at'  => date('Y-m-d H:i:s'),
	'toast'       => 'Thanks! Your feedback is awaiting admin approval.',
	'pending'     => true,
	'message'     => 'Thanks! Your feedback is awaiting admin approval.',
], 201);
