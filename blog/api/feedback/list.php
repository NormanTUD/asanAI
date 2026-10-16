<?php
/**
 * GET  /api/feedback/list.php?lesson=foo
 *   Public list of approved feedback for one lesson, PLUS the
 *   requesting visitor's own un-approved entries (so they can
 *   always see what they posted and which admin decisions came back).
 *
 *   Admin (when authed) gets all entries + unredacted author info.
 *
 * Response: { ok, feedback: [...], aha_top: [...], git: {...}, admin: bool }
 */
require_once(__DIR__ . '/_bootstrap.php');

feedback_require_method('GET');

$lesson = feedback_str($_GET['lesson'] ?? '', 80, 'lesson');
if ($lesson === '' || !preg_match('/^[a-z0-9_\-]+$/', $lesson)) {
	feedback_json_error('Invalid lesson slug. Expected a short slug like "intro" or "math_iv".', 400, 'lesson');
}

$pdo = feedback_bootstrap();
$isAdmin = feedback_admin_authed();
$visitorId = feedback_visitor_id();

if ($isAdmin) {
	$stmt = $pdo->prepare('SELECT * FROM feedback WHERE lesson_slug = ? ORDER BY created_at DESC LIMIT 500');
	$stmt->execute([$lesson]);
} elseif ($visitorId) {
		$stmt = $pdo->prepare('
			SELECT * FROM feedback
			WHERE lesson_slug = ?
			AND ((approved = 1 AND status NOT IN (\'wontfix\',\'spam\')) OR visitor_id = ?)
			ORDER BY created_at DESC LIMIT 500
		');
	$stmt->execute([$lesson, $visitorId]);
} else {
	$stmt = $pdo->prepare('SELECT * FROM feedback WHERE lesson_slug = ? AND approved = 1 AND status NOT IN (\'wontfix\',\'spam\') ORDER BY created_at DESC LIMIT 500');
	$stmt->execute([$lesson]);
}

$rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

$myVotes = [];
if ($visitorId && $rows) {
	$ids = array_column($rows, 'id');
	$ph  = implode(',', array_fill(0, count($ids), '?'));
	$v = $pdo->prepare("SELECT feedback_id, reaction FROM feedback_reactions WHERE visitor_id = ? AND target_type = 'feedback' AND feedback_id IN ($ph)");
	$v->execute(array_merge([$visitorId], $ids));
	foreach ($v->fetchAll(PDO::FETCH_ASSOC) as $r) {
		$myVotes[(int)$r['feedback_id']] = $r['reaction'];
	}
}

$ids = array_map(fn($r) => (int)$r['id'], $rows);
$commentsByFb = [];
if ($ids) {
	$ph = implode(',', array_fill(0, count($ids), '?'));
	// Include all comments if admin OR if any of the feedback items
	// belong to the visitor (so the visitor sees their own threads).
	if ($isAdmin) {
		$c = $pdo->prepare("SELECT * FROM feedback_comments WHERE feedback_id IN ($ph) ORDER BY created_at ASC");
		$c->execute($ids);
	} else {
		$c = $pdo->prepare("
			SELECT * FROM feedback_comments
			WHERE feedback_id IN ($ph) AND (is_admin = 1 OR visitor_id = ? OR visitor_id IS NULL)
			ORDER BY created_at ASC
		");
		$c->execute(array_merge($ids, [$visitorId ?: '']));
	}
	foreach ($c->fetchAll(PDO::FETCH_ASSOC) as $cm) {
		$fid = (int)$cm['feedback_id'];
		$cmVisitor = $cm['visitor_id'] ?? '';
		$isOwnCm   = $visitorId && $cmVisitor && hash_equals($visitorId, $cmVisitor);
		$commentsByFb[$fid][] = [
			'id'         => (int)$cm['id'],
			'body'       => $cm['body'],
			'handle'     => $cm['is_admin'] ? 'admin' : (string)($cm['author_handle'] ?? ''),
			'is_admin'   => (bool)$cm['is_admin'],
			'is_resolve' => (bool)$cm['is_resolution_note'],
			'is_own'     => $isOwnCm,
			'created_at' => $cm['created_at'],
		];
	}
}

$out = [];
foreach ($rows as $r) {
	$isOwnFb = $visitorId && !empty($r['visitor_id']) && hash_equals($visitorId, (string)$r['visitor_id']);
	$item = [
		'id'           => (int)$r['id'],
		'uuid'         => $r['uuid'],
		'lesson'       => $r['lesson_slug'],
		'category'     => $r['category'],
		'anchor_type'  => $r['anchor_type'],
		'body'         => $r['body'],
		'suggestion_original'    => $r['suggestion_original'],
		'suggestion_replacement' => $r['suggestion_replacement'],
		'status'       => $r['status'],
		'approved'     => (bool)$r['approved'],
		'is_own'       => $isOwnFb,
		'upvotes'      => (int)$r['upvotes'],
		'downvotes'    => (int)$r['downvotes'],
		'aha_count'    => (int)$r['aha_count'],
		'reply_count'  => (int)$r['reply_count'],
		'created_at'   => $r['created_at'],
		'git_commit'   => $r['git_commit'],
		'git_branch'   => $r['git_branch'],
		'anchor' => [
			'selector'      => $r['anchor_selector'],
			'xpath'         => $r['anchor_xpath'],
			'quote'         => $r['anchor_quote'],
			'prefix'        => $r['anchor_prefix'],
			'suffix'        => $r['anchor_suffix'],
			'offset'        => $r['anchor_offset'] !== null ? (int)$r['anchor_offset'] : null,
			'offset_end'    => $r['anchor_offset_end'] !== null ? (int)$r['anchor_offset_end'] : null,
			'section'       => $r['anchor_section'],
			'section_id'    => $r['anchor_section_id'],
			'chunks'        => $r['anchor_chunks'] ? json_decode($r['anchor_chunks'], true) : null,
			'section_title' => $r['anchor_section_title'],
			'text_hash'     => $r['anchor_text_hash'],
			'image_src'     => $r['anchor_image_src'],
			'image_alt'     => $r['anchor_image_alt'],
			'caption'       => $r['anchor_caption'],
			'viewport_x'    => $r['anchor_viewport_x'] !== null ? (int)$r['anchor_viewport_x'] : null,
			'viewport_y'    => $r['anchor_viewport_y'] !== null ? (int)$r['anchor_viewport_y'] : null,
			'status'        => $r['anchor_status'],
			'confidence'    => (float)$r['anchor_confidence'],
		],
		'my_reaction'  => $myVotes[(int)$r['id']] ?? null,
		'comments'     => $commentsByFb[(int)$r['id']] ?? [],
	];
	if ($isAdmin) {
		$item['author_handle'] = $r['author_handle'];
		$item['author_email']  = $r['author_email'];
		$item['visitor_id']    = $r['visitor_id'];
		$item['user_agent']    = $r['user_agent'];
		$item['page_url']      = $r['page_url'];
		$item['updated_at']    = $r['updated_at'];
		$item['resolved_at']   = $r['resolved_at'];
	}
	$out[] = $item;
}

$ahaStmt = $pdo->prepare('
	SELECT anchor_selector, anchor_prefix, anchor_quote, anchor_suffix, SUM(count) AS total
	FROM text_aha WHERE lesson_slug = ? GROUP BY anchor_quote ORDER BY total DESC LIMIT 8
');
$ahaStmt->execute([$lesson]);
$ahaTop = [];
foreach ($ahaStmt->fetchAll(PDO::FETCH_ASSOC) as $a) {
	$ahaTop[] = [
		'quote'    => $a['anchor_quote'],
		'prefix'   => $a['anchor_prefix'],
		'suffix'   => $a['anchor_suffix'],
		'selector' => $a['anchor_selector'],
		'count'    => (int)$a['total'],
	];
}

feedback_json_response([
	'feedback'    => $out,
	'aha_top'     => $ahaTop,
	'git'         => feedback_git_info(),
	'admin'       => $isAdmin,
	'visitor'     => (bool)$visitorId,
	'visitor_id'  => $visitorId,
	'pending_own' => count(array_filter($out, fn($i) => $i['is_own'] && !$i['approved'])),
]);
