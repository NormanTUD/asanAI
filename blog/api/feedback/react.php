<?php
/**
 * POST /api/feedback/react.php
 *   Public — upvote/downvote a feedback item OR register an "aha" on a
 *   passage of text. Visitor identity comes from a random cookie
 *   (fb_visitor) so the same browser can toggle its own vote later.
 *
 * Body:
 *   target_type  "feedback" | "text_aha"
 *   target_key   feedback.uuid OR "lesson_slug|prefix|quote|suffix"
 *   feedback_id  int (required when target_type=feedback)
 *   reaction     "up" | "down" | "aha" | "remove"
 *   body         optional — for text_aha, a short note
 */
require_once(__DIR__ . '/_bootstrap.php');

if (feedback_method() === 'GET') {
	feedback_method_help(
		'React / Aha',
		'👍 Feedback Reactions',
		'This URL lets visitors upvote/downvote feedback items or mark text passages as illuminating. It is called by the feedback widget when the reader clicks the vote or ★ buttons inside a post-it.',
		"POST /api/feedback/react.php\nContent-Type: application/json\n\n// upvote a feedback item\n{\n  \"target_type\": \"feedback\",\n  \"target_key\":  \"<feedback-uuid>\",\n  \"feedback_id\": 42,\n  \"reaction\":    \"up\"\n}\n\n// mark a text passage as illuminating\n{\n  \"target_type\": \"text_aha\",\n  \"target_key\":  \"<lesson>|<prefix>|<quote>|<suffix>\",\n  \"reaction\":    \"aha\",\n  \"lesson_slug\": \"intro\",\n  \"anchor_quote\": \"the text\",\n  \"body\": \"<prefix> [<quote>] <suffix>\"\n}"
	);
}

feedback_require_method('POST');

$in = feedback_input();
$type     = $in['target_type'] ?? '';
$key      = feedback_str($in['target_key'] ?? '', 1200, 'target_key');
$reaction = $in['reaction'] ?? '';
$fbId     = isset($in['feedback_id']) ? (int)$in['feedback_id'] : 0;

if (!in_array($type, ['feedback', 'text_aha'], true)) {
	feedback_json_error(
		'Invalid target_type. Expected "feedback" or "text_aha".',
		400, 'target_type'
	);
}
if (!in_array($reaction, ['up', 'down', 'aha', 'remove'], true)) {
	feedback_json_error(
		'Invalid reaction. Expected "up", "down", "aha", or "remove".',
		400, 'reaction'
	);
}
if ($type === 'feedback' && $fbId <= 0) {
	feedback_json_error('feedback_id is required when target_type is "feedback".', 400, 'feedback_id');
}
if ($type === 'text_aha' && $key === '') {
	feedback_json_error('target_key is required when target_type is "text_aha".', 400, 'target_key');
}

$visitor = feedback_visitor_id();
if (!$visitor) {
	$visitor = bin2hex(random_bytes(16));
	setcookie('fb_visitor', $visitor, [
		'expires'  => time() + 60 * 60 * 24 * 365,
		'path'     => '/',
		'sameSite' => 'Lax',
	]);
	$_COOKIE['fb_visitor'] = $visitor;
}

feedback_rate_limit('react:' . feedback_client_ip());
feedback_rate_limit('react_v:' . $visitor);

$pdo = feedback_bootstrap();
$pdo->beginTransaction();

try {
	if ($type === 'feedback') {
		$exists = $pdo->prepare('SELECT id, upvotes, downvotes FROM feedback WHERE id = ?');
		$exists->execute([$fbId]);
		$row = $exists->fetch(PDO::FETCH_ASSOC);
		if (!$row) {
			$pdo->rollBack();
			feedback_json_error('Feedback #' . $fbId . ' does not exist (it may have been deleted).', 404);
		}

		$cur = $pdo->prepare('SELECT id, reaction FROM feedback_reactions WHERE visitor_id = ? AND target_type = \'feedback\' AND feedback_id = ?');
		$cur->execute([$visitor, $fbId]);
		$prev = $cur->fetch(PDO::FETCH_ASSOC);

		$op = $reaction;
		if ($reaction === 'remove') {
			if ($prev) {
				$pdo->prepare('DELETE FROM feedback_reactions WHERE id = ?')->execute([$prev['id']]);
				if ($prev['reaction'] === 'up')   $pdo->prepare('UPDATE feedback SET upvotes   = upvotes   - 1 WHERE id = ?')->execute([$fbId]);
				if ($prev['reaction'] === 'down') $pdo->prepare('UPDATE feedback SET downvotes = downvotes - 1 WHERE id = ?')->execute([$fbId]);
			}
		} else {
			if ($prev && $prev['reaction'] === $reaction) {
				$pdo->prepare('DELETE FROM feedback_reactions WHERE id = ?')->execute([$prev['id']]);
				if ($reaction === 'up')   $pdo->prepare('UPDATE feedback SET upvotes   = upvotes   - 1 WHERE id = ?')->execute([$fbId]);
				if ($reaction === 'down') $pdo->prepare('UPDATE feedback SET downvotes = downvotes - 1 WHERE id = ?')->execute([$fbId]);
				$op = 'remove';
			} else {
				if ($prev) {
					if ($prev['reaction'] === 'up')   $pdo->prepare('UPDATE feedback SET upvotes   = upvotes   - 1 WHERE id = ?')->execute([$fbId]);
					if ($prev['reaction'] === 'down') $pdo->prepare('UPDATE feedback SET downvotes = downvotes - 1 WHERE id = ?')->execute([$fbId]);
					$pdo->prepare('UPDATE feedback_reactions SET reaction = ? WHERE id = ?')->execute([$reaction, $prev['id']]);
				} else {
					$pdo->prepare('INSERT INTO feedback_reactions (feedback_id, target_type, target_key, reaction, visitor_id) VALUES (?, ?, ?, ?, ?)')
						->execute([$fbId, 'feedback', $key, $reaction, $visitor]);
				}
				if ($reaction === 'up')   $pdo->prepare('UPDATE feedback SET upvotes   = upvotes   + 1 WHERE id = ?')->execute([$fbId]);
				if ($reaction === 'down') $pdo->prepare('UPDATE feedback SET downvotes = downvotes + 1 WHERE id = ?')->execute([$fbId]);
			}
		}

		$after = $pdo->prepare('SELECT upvotes, downvotes FROM feedback WHERE id = ?');
		$after->execute([$fbId]);
		$counts = $after->fetch(PDO::FETCH_ASSOC);
		$pdo->commit();

		$toast = 'Reaction recorded';
		if ($op === 'up')   $toast = '▲ Thanks — counted as agree';
		if ($op === 'down') $toast = '▼ Thanks — counted as disagree';
		if ($op === 'remove') $toast = 'Reaction removed';

		feedback_json_response([
			'ok'          => true,
			'my_reaction' => $op === 'remove' ? null : $op,
			'upvotes'     => (int)$counts['upvotes'],
			'downvotes'   => (int)$counts['downvotes'],
			'toast'       => $toast,
		]);
	}

	if ($type === 'text_aha') {
		$body = feedback_clean(feedback_str($in['body'] ?? '', 200, 'body'));
		if ($body === '') {
			$pdo->rollBack();
			feedback_json_error('A short body describing the passage is required for "aha" reactions.', 400, 'body');
		}
		$lesson = feedback_clean(feedback_str($in['lesson_slug'] ?? '', 80, 'lesson_slug'));
		$sel    = feedback_clean(feedback_str($in['anchor_selector'] ?? '', 1000, 'anchor_selector'));
		$quote  = feedback_clean(feedback_str($in['anchor_quote']    ?? '', 800, 'anchor_quote'));
		$prefix = feedback_clean(feedback_str($in['anchor_prefix']   ?? '', 120, 'anchor_prefix'));
		$suffix = feedback_clean(feedback_str($in['anchor_suffix']   ?? '', 120, 'anchor_suffix'));

		$cur = $pdo->prepare('SELECT id FROM feedback_reactions WHERE visitor_id = ? AND target_type = \'text_aha\' AND target_key = ?');
		$cur->execute([$visitor, $key]);
		$prev = $cur->fetch(PDO::FETCH_ASSOC);

		if ($reaction === 'aha' && !$prev) {
			$pdo->prepare('INSERT INTO feedback_reactions (target_type, target_key, reaction, visitor_id) VALUES (\'text_aha\', ?, \'aha\', ?)')
				->execute([$key, $visitor]);

			$existing = $pdo->prepare('SELECT id, count FROM text_aha WHERE anchor_quote = ? AND lesson_slug = ?');
			$existing->execute([$quote, $lesson]);
			$row = $existing->fetch(PDO::FETCH_ASSOC);
			if ($row) {
				$pdo->prepare('UPDATE text_aha SET count = count + 1, last_at = datetime("now") WHERE id = ?')
					->execute([$row['id']]);
			} else {
				$git = feedback_git_info();
				$pdo->prepare('INSERT INTO text_aha (lesson_slug, anchor_selector, anchor_quote, anchor_prefix, anchor_suffix, git_commit, count) VALUES (?, ?, ?, ?, ?, ?, 1)')
					->execute([$lesson, $sel, $quote, $prefix, $suffix, $git['commit'] ?: null]);
			}
		} elseif ($reaction === 'remove' && $prev) {
			$pdo->prepare('DELETE FROM feedback_reactions WHERE id = ?')->execute([$prev['id']]);
			$row = $pdo->prepare('SELECT id, count FROM text_aha WHERE anchor_quote = ? AND lesson_slug = ?');
			$row->execute([$quote, $lesson]);
			$r = $row->fetch(PDO::FETCH_ASSOC);
			if ($r && (int)$r['count'] > 1) {
				$pdo->prepare('UPDATE text_aha SET count = count - 1, last_at = datetime("now") WHERE id = ?')
					->execute([$r['id']]);
			} elseif ($r) {
				$pdo->prepare('DELETE FROM text_aha WHERE id = ?')->execute([$r['id']]);
			}
		}
		$pdo->commit();
		feedback_json_response([
			'ok'    => true,
			'toast' => $reaction === 'aha' ? '★ Marked as illuminating' : 'Aha removed',
		]);
	}
} catch (Exception $e) {
	$pdo->rollBack();
	feedback_json_error('Server error: ' . $e->getMessage(), 500);
}
