<?php
/**
 * GET /api/feedback/admin/list.php
 *   Admin-only — full feedback list across all lessons, with filters
 *   and history attached. Used by the admin panel UI.
 */
require_once(__DIR__ . '/../_bootstrap.php');
feedback_require_method('GET');
feedback_admin_authed() or feedback_json_error('Not authenticated', 401);

$pdo = feedback_bootstrap();

$status   = $_GET['status'] ?? '';
$category = $_GET['category'] ?? '';
$approved = $_GET['approved'] ?? '';
$lesson   = $_GET['lesson'] ?? '';
$q        = trim($_GET['q'] ?? '');
$sort     = $_GET['sort'] ?? 'new';

$where = [];
$args  = [];
if ($status && in_array($status, ['open', 'in_progress', 'resolved', 'wontfix'], true)) {
	$where[] = 'status = ?'; $args[] = $status;
}
if ($category && in_array($category, ['bug', 'typo', 'suggestion', 'question', 'content', 'other'], true)) {
	$where[] = 'category = ?'; $args[] = $category;
}
if ($approved === '1') $where[] = 'approved = 1';
if ($approved === '0') $where[] = 'approved = 0';
if ($lesson && preg_match('/^[a-z0-9_\-]+$/', $lesson)) {
	$where[] = 'lesson_slug = ?'; $args[] = $lesson;
}
if ($q !== '') {
	$where[] = '(body LIKE ? OR suggestion_original LIKE ? OR suggestion_replacement LIKE ?)';
	$like = '%' . $q . '%';
	$args[] = $like; $args[] = $like; $args[] = $like;
}
$whereSql = $where ? 'WHERE ' . implode(' AND ', $where) : '';
$order = $sort === 'old' ? 'created_at ASC' : 'created_at DESC';

$stmt = $pdo->prepare("SELECT * FROM feedback $whereSql ORDER BY $order LIMIT 1000");
$stmt->execute($args);
$rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

$ids = array_map(fn($r) => (int)$r['id'], $rows);
$comments = [];
if ($ids) {
	$ph = implode(',', array_fill(0, count($ids), '?'));
	$c = $pdo->prepare("SELECT * FROM feedback_comments WHERE feedback_id IN ($ph) ORDER BY created_at ASC");
	$c->execute($ids);
	foreach ($c->fetchAll(PDO::FETCH_ASSOC) as $cm) {
		$comments[(int)$cm['feedback_id']][] = [
			'id'         => (int)$cm['id'],
			'body'       => $cm['body'],
			'handle'     => $cm['is_admin'] ? 'admin' : (string)($cm['author_handle'] ?? ''),
			'email'      => $cm['is_admin'] ? null : (string)($cm['author_email'] ?? ''),
			'is_admin'   => (bool)$cm['is_admin'],
			'is_resolve' => (bool)$cm['is_resolution_note'],
			'created_at' => $cm['created_at'],
		];
	}
}

$out = [];
foreach ($rows as $r) {
	$out[] = [
		'id'           => (int)$r['id'],
		'uuid'         => $r['uuid'],
		'lesson'       => $r['lesson_slug'],
		'category'     => $r['category'],
		'anchor_type'  => $r['anchor_type'],
		'body'         => $r['body'],
		'suggestion_original'    => $r['suggestion_original'],
		'suggestion_replacement' => $r['suggestion_replacement'],
		'author_handle' => $r['author_handle'],
		'author_email'  => $r['author_email'],
		'status'       => $r['status'],
		'approved'     => (bool)$r['approved'],
		'git_commit'   => $r['git_commit'],
		'git_branch'   => $r['git_branch'],
		'created_at'   => $r['created_at'],
		'updated_at'   => $r['updated_at'],
		'resolved_at'  => $r['resolved_at'],
		'user_agent'   => $r['user_agent'],
		'page_url'     => $r['page_url'],
		'upvotes'      => (int)$r['upvotes'],
		'downvotes'    => (int)$r['downvotes'],
		'aha_count'    => (int)$r['aha_count'],
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
			'status'        => $r['anchor_status'],
			'confidence'    => (float)$r['anchor_confidence'],
		],
		'comments'     => $comments[(int)$r['id']] ?? [],
	];
}

$stats = $pdo->query('
	SELECT
		COUNT(*) AS total,
		SUM(CASE WHEN approved = 0 THEN 1 ELSE 0 END) AS pending,
		SUM(CASE WHEN approved = 1 AND status = "open" THEN 1 ELSE 0 END) AS open,
		SUM(CASE WHEN status = "in_progress" THEN 1 ELSE 0 END) AS in_progress,
		SUM(CASE WHEN status = "resolved" THEN 1 ELSE 0 END) AS resolved,
		SUM(CASE WHEN status = "wontfix" THEN 1 ELSE 0 END) AS wontfix
	FROM feedback
')->fetch(PDO::FETCH_ASSOC);

$byLesson = $pdo->query('
	SELECT lesson_slug, COUNT(*) AS c, SUM(CASE WHEN status = "open" THEN 1 ELSE 0 END) AS open_c
	FROM feedback GROUP BY lesson_slug ORDER BY c DESC
')->fetchAll(PDO::FETCH_ASSOC);

$topAha = $pdo->query('
	SELECT lesson_slug, anchor_quote, anchor_prefix, anchor_suffix, SUM(count) AS total
	FROM text_aha GROUP BY lesson_slug, anchor_quote ORDER BY total DESC LIMIT 30
')->fetchAll(PDO::FETCH_ASSOC);

feedback_json_response([
	'feedback' => $out,
	'stats'    => $stats,
	'by_lesson'=> $byLesson,
	'top_aha'  => $topAha,
	'git'      => feedback_git_info(),
]);
