<?php
/**
 * POST /api/feedback/admin/update.php
 *   Admin-only — PATCH-like updates: status, approval, comment, delete.
 *
 * Body:
 *   id          required, int
 *   action      required, one of:
 *                 approve | unapprove | resolve | unresolve |
 *                 status | delete | comment | reply | reanchor | edit
 *   status      for action=status, one of open|in_progress|resolved|wontfix
 *   body        for action=comment|reply (admin reply visible publicly)
 *   status_note for action=resolve (logged into history + comment thread)
 *   confidence  for action=reanchor, new anchor_confidence
 *   anchor_status for action=reanchor, fresh|moved|orphan
 */
require_once(__DIR__ . '/../_bootstrap.php');
feedback_require_method('POST');
feedback_admin_authed() or feedback_json_error('Not authenticated. Please sign in again.', 401);

$in = feedback_input();
$id = (int)($in['id'] ?? 0);
$action = $in['action'] ?? '';
if ($id <= 0) feedback_json_error('id is required.', 400, 'id');
if ($action === '') feedback_json_error('action is required.', 400, 'action');

$pdo = feedback_bootstrap();
$row = $pdo->prepare('SELECT * FROM feedback WHERE id = ?');
$row->execute([$id]);
$fb = $row->fetch(PDO::FETCH_ASSOC);
if (!$fb) feedback_json_error('Not found', 404);

switch ($action) {
	case 'approve':
		$pdo->prepare('UPDATE feedback SET approved = 1, updated_at = datetime("now") WHERE id = ?')
			->execute([$id]);
		feedback_admin_log('approved', $id, '0', '1', null);
		break;

	case 'unapprove':
		$pdo->prepare('UPDATE feedback SET approved = 0, updated_at = datetime("now") WHERE id = ?')
			->execute([$id]);
		feedback_admin_log('unapproved', $id, '1', '0', null);
		break;

	case 'status':
		$new = $in['status'] ?? '';
		if (!in_array($new, ['open', 'in_progress', 'resolved', 'wontfix', 'spam'], true)) {
			feedback_json_error('Invalid status', 400);
		}
		$old = $fb['status'];
		$resolvedAt = ($new === 'resolved' || $new === 'wontfix' || $new === 'spam') ? ', resolved_at = datetime("now")' : '';
		$pdo->prepare("UPDATE feedback SET status = ? $resolvedAt, updated_at = datetime('now') WHERE id = ?")
			->execute([$new, $id]);
		feedback_admin_log('status_change', $id, $old, $new, null);
		break;

	case 'resolve':
		$new = 'resolved';
		$old = $fb['status'];
		$pdo->prepare("UPDATE feedback SET status = ?, resolved_at = datetime('now'), updated_at = datetime('now') WHERE id = ?")
			->execute([$new, $id]);
		$note = feedback_clean(feedback_str($in['status_note'] ?? '', 1000, 'status_note'));
		if ($note !== '') {
			$pdo->prepare('INSERT INTO feedback_comments (feedback_id, body, is_admin, is_resolution_note) VALUES (?, ?, 1, 1)')
				->execute([$id, "Marked as resolved:\n\n" . $note]);
			$pdo->prepare('UPDATE feedback SET reply_count = reply_count + 1 WHERE id = ?')->execute([$id]);
		}
		feedback_admin_log('resolved', $id, $old, $new, $note ?: null);
		break;

	case 'unresolve':
		$old = $fb['status'];
		$pdo->prepare("UPDATE feedback SET status = 'open', resolved_at = NULL, updated_at = datetime('now') WHERE id = ?")
			->execute([$id]);
		feedback_admin_log('reopened', $id, $old, 'open', null);
		break;

	case 'comment':
	case 'reply':
		$body = feedback_clean(feedback_str($in['body'] ?? '', 2000, 'body'));
		if ($body === '') feedback_json_error('body required', 400);
		$pdo->prepare('INSERT INTO feedback_comments (feedback_id, body, is_admin) VALUES (?, ?, 1)')
			->execute([$id, $body]);
		$pdo->prepare('UPDATE feedback SET reply_count = reply_count + 1, updated_at = datetime("now") WHERE id = ?')
			->execute([$id]);
		feedback_admin_log('replied', $id, null, null, mb_substr($body, 0, 80));
		break;

	case 'delete':
		// Log BEFORE deleting — feedback_history.feedback_id has a FK to
		// feedback.id, so inserting after the DELETE would violate the
		// constraint and 500 the whole request.
		feedback_admin_log('deleted', $id, $fb['status'], null, null);
		$pdo->prepare('DELETE FROM feedback WHERE id = ?')->execute([$id]);
		break;

	case 'reanchor':
		$stat = $in['anchor_status'] ?? 'fresh';
		$conf = (float)($in['confidence'] ?? 1.0);
		if (!in_array($stat, ['fresh', 'moved', 'orphan'], true)) $stat = 'fresh';
		$pdo->prepare('UPDATE feedback SET anchor_status = ?, anchor_confidence = ?, last_reanchor_at = datetime("now") WHERE id = ?')
			->execute([$stat, max(0, min(1, $conf)), $id]);
		feedback_admin_log('reanchored', $id, $fb['anchor_status'], $stat, null);
		break;

	case 'edit':
		$body = feedback_clean(feedback_str($in['body'] ?? '', 4000, 'body'));
		if ($body === '') feedback_json_error('body required', 400);
		$pdo->prepare('UPDATE feedback SET body = ?, updated_at = datetime("now") WHERE id = ?')
			->execute([$body, $id]);
		feedback_admin_log('edited', $id, mb_substr($fb['body'], 0, 80), mb_substr($body, 0, 80), null);
		break;

	default:
		feedback_json_error('Unknown action', 400);
}

feedback_json_response(['ok' => true, 'id' => $id]);
