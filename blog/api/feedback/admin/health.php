<?php
/**
 * GET /api/feedback/admin/health.php
 *   Admin-only — top-level lesson health overview, used by the admin
 *   dashboard. Returns per-lesson open-feedback counts and aha totals.
 */
require_once(__DIR__ . '/../_bootstrap.php');
feedback_require_method('GET');
feedback_admin_authed() or feedback_json_error('Not authenticated', 401);

$pdo = feedback_bootstrap();

$rows = $pdo->query('
	SELECT
		lesson_slug,
		COUNT(*) AS total,
		SUM(CASE WHEN status = "open"        THEN 1 ELSE 0 END) AS open_c,
		SUM(CASE WHEN status = "in_progress" THEN 1 ELSE 0 END) AS progress_c,
		SUM(CASE WHEN status = "resolved"    THEN 1 ELSE 0 END) AS resolved_c,
		SUM(CASE WHEN status = "wontfix"     THEN 1 ELSE 0 END) AS wontfix_c,
		SUM(CASE WHEN approved = 0           THEN 1 ELSE 0 END) AS pending_c,
		MAX(created_at) AS last_at
	FROM feedback
	GROUP BY lesson_slug
	ORDER BY last_at DESC
')->fetchAll(PDO::FETCH_ASSOC);

$aha = $pdo->query('
	SELECT lesson_slug, SUM(count) AS total, MAX(last_at) AS last_at
	FROM text_aha GROUP BY lesson_slug ORDER BY total DESC
')->fetchAll(PDO::FETCH_ASSOC);

feedback_json_response([
	'by_lesson' => $rows,
	'aha'       => $aha,
	'git'       => feedback_git_info(),
]);
