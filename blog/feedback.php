<?php
/*
 * Password-protected reader-feedback dashboard.
 *
 * Shares the session and password file with /stats. Feedback rows are
 * anonymous by default; an email is present only when the reader chose
 * to enter one. Bug context is stored only after explicit consent.
 */
declare(strict_types=1);

require_once __DIR__ . '/lib/analytics.php';

$embedRequest = isset($_GET['embed']) && (string)$_GET['embed'] === '1';
if (!$embedRequest && ($_SERVER['REQUEST_METHOD'] ?? '') === 'GET') {
	$dir = rtrim(str_replace('\\', '/', dirname((string)($_SERVER['SCRIPT_NAME'] ?? '/'))), '/');
	header('Location: ' . ($dir === '' || $dir === '.' ? '' : $dir) . '/stats?view=feedback', true, 302);
	exit;
}

header('Content-Type: text/html; charset=utf-8');
header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
header('Pragma: no-cache');
header('X-Content-Type-Options: nosniff');
header('X-Frame-Options: DENY');
header('Referrer-Policy: no-referrer');
header('X-Robots-Tag: noindex, nofollow, noarchive');
header("Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self'; base-uri 'none'; form-action 'self'; frame-ancestors 'none'");

mn_admin_session_start();

$embed = isset($_GET['embed']) && (string)$_GET['embed'] === '1';
$embedTheme = isset($_GET['theme']) && (string)$_GET['theme'] === 'light' ? 'light' : 'dark';

function feedback_h(mixed $value): string {
	return htmlspecialchars((string)$value, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
}

function feedback_current_url(): string {
	$uri = (string)($_SERVER['REQUEST_URI'] ?? '/');
	$uri = str_replace(["\r", "\n"], '', $uri);
	if ($uri === '' || $uri[0] !== '/' || str_starts_with($uri, '//')) {
		$uri = '/';
	}
	return $uri;
}

function feedback_redirect(): void {
	header('Location: ' . feedback_current_url(), true, 303);
	exit;
}

function feedback_redirect_open(int $id): void {
	$uri = feedback_current_url();
	$parts = parse_url($uri);
	$query = [];
	if (isset($parts['query']) && is_string($parts['query'])) {
		parse_str($parts['query'], $query);
	}
	unset($query['open']);
	$query['tab'] = 'all';
	$query['status'] = '';
	$query['reaction'] = '';
	$query['has_comment'] = '';
	$query['bug'] = '';
	$query['open'] = (string)$id;
	$path = isset($parts['path']) && $parts['path'] !== '' ? $parts['path'] : '/';
	header('Location: ' . $path . '?' . http_build_query($query) . '#feedback-' . $id, true, 303);
	exit;
}

function feedback_normalize_path(string $path): string {
	return in_array($path, ['blog', 'index.php'], true) ? 'index' : $path;
}

function feedback_lesson_href(string $path): string {
	$normalized = feedback_normalize_path($path);
	return $normalized === '' || $normalized === 'index' ? 'index' : $normalized;
}

function feedback_internal_href(array $overrides = []): string {
	return '?' . feedback_query($overrides);
}

function feedback_count_link(string $path, string $reaction, int $count, string $class = ''): string {
	$query = feedback_query([
		'tab' => 'all',
		'path' => feedback_normalize_path($path),
		'reaction' => $reaction,
		'page' => 1,
		'status' => '',
	]);
	$cls = $class !== '' ? ' class="' . feedback_h($class) . '"' : '';
	return '<a' . $cls . ' href="?' . feedback_h($query) . '">' . feedback_h(number_format($count)) . '</a>';
}

function feedback_flash(string $type, string $text): void {
	$_SESSION['feedback_flash'] = ['type' => $type, 'text' => $text];
}

function feedback_take_flash(): ?array {
	if (empty($_SESSION['feedback_flash']) || !is_array($_SESSION['feedback_flash'])) {
		return null;
	}
	$flash = $_SESSION['feedback_flash'];
	unset($_SESSION['feedback_flash']);
	return $flash;
}

function feedback_range_options(): array {
	return [7 => '7 days', 30 => '30 days', 90 => '90 days', 365 => '1 year', 0 => 'All'];
}

function feedback_tabs(): array {
	return [
		'overview' => 'Overview',
		'inbox' => 'Inbox',
		'accepted' => 'Accepted',
		'pages' => 'Pages',
		'resolved' => 'Resolved',
		'bugs' => 'Bugs',
		'all' => 'All feedback',
	];
}

function feedback_query(array $overrides = []): string {
	$allowed = ['range', 'path', 'reaction', 'status', 'has_comment', 'bug', 'q', 'tab', 'open', 'page'];
	$q = [];
	foreach ($allowed as $key) {
		$value = array_key_exists($key, $overrides) ? $overrides[$key] : ($_GET[$key] ?? null);
		if (!is_scalar($value)) {
			continue;
		}
		$value = (string)$value;
		if ($value === '') {
			continue;
		}
		if ($key === 'page' && (int)$value <= 1) {
			continue;
		}
		$q[$key] = $value;
	}
	return http_build_query($q);
}

function feedback_where(int $range, string $path, string $reaction, string $status, bool $hasComment, bool $bugOnly, string $search, array &$params): string {
	$where = ['1=1'];
	if ($range > 0) {
		$where[] = 'f.ts >= ?';
		$params[] = time() - $range * 86400;
	}
	if ($path !== '') {
		$where[] = 'f.path = ?';
		$params[] = $path;
	}
	if ($reaction !== '') {
		$where[] = 'f.reaction = ?';
		$params[] = $reaction;
	}
	if ($status !== '') {
		$where[] = 'f.status = ?';
		$params[] = $status;
	}
	if ($hasComment) {
		$where[] = "f.comment <> ''";
	}
	if ($bugOnly) {
		$where[] = "f.reaction = 'bug'";
	}
	if ($search !== '') {
		$where[] = "(f.comment LIKE ? OR f.block_text LIKE ? OR s.selected_text LIKE ? OR f.email LIKE ? OR f.lesson_title LIKE ? OR f.section_title LIKE ?)";
		$like = '%' . $search . '%';
		array_push($params, $like, $like, $like, $like, $like, $like);
	}
	return implode(' AND ', $where);
}

function feedback_status_label(string $status): string {
	return match ($status) {
		'new' => 'New',
		'accepted' => 'Accepted',
		'rejected' => 'Rejected',
		'done' => 'Done',
		default => ucfirst($status),
	};
}

function feedback_action_label(string $action): string {
	return match ($action) {
		'created' => 'Created',
		'edited' => 'Edited',
		'prompt_saved' => 'Prompt saved',
		'prompt_regenerated' => 'Prompt regenerated',
		'accept' => 'Accepted',
		'reject' => 'Rejected',
		'done' => 'Marked done',
		'reopen' => 'Reopened',
		default => ucfirst(str_replace('_', ' ', $action)),
	};
}

$actionRaw = $_POST['action'] ?? '';
$action = is_scalar($actionRaw) ? (string)$actionRaw : '';
$flash = '';
$flashType = 'ok';
$loginError = '';

if (($action === 'login') && ($_SERVER['REQUEST_METHOD'] ?? '') === 'POST') {
	if (!mn_admin_check_csrf()) {
		$loginError = 'The session has expired. Please reload the page.';
	} elseif (mn_admin_login_wait() > 0) {
		$loginError = 'Too many failed attempts. Please wait ' . mn_admin_login_wait() . ' seconds.';
	} else {
		$passwordRaw = $_POST['password'] ?? '';
		$password = is_scalar($passwordRaw) ? (string)$passwordRaw : '';
		if (mn_admin_attempt_login($password)) {
			$_SESSION['feedback_csrf'] = bin2hex(random_bytes(32));
			feedback_redirect();
		}
		$loginError = 'Wrong password.';
	}
}

if (($action === 'logout') && ($_SERVER['REQUEST_METHOD'] ?? '') === 'POST') {
	if (!mn_admin_check_csrf()) {
		$flash = 'The session has expired.';
		$flashType = 'error';
	} else {
		$_SESSION = [];
		if (ini_get('session.use_cookies')) {
			$p = session_get_cookie_params();
			setcookie(session_name(), '', [
				'expires' => time() - 42000,
				'path' => $p['path'],
				'domain' => $p['domain'],
				'secure' => (bool)$p['secure'],
				'httponly' => (bool)$p['httponly'],
				'samesite' => $p['samesite'] ?? 'Strict',
			]);
		}
		session_destroy();
		setcookie('mn_stats_admin', '', [
			'expires' => time() - 3600,
			'path' => mn_admin_cookie_path(),
			'secure' => mn_admin_is_secure(),
			'httponly' => true,
			'samesite' => 'Lax',
		]);
		header('Location: ' . feedback_current_url(), true, 303);
		exit;
	}
}

$authed = mn_admin_is_authed();
if ($authed) {
	$takenFlash = feedback_take_flash();
	if (is_array($takenFlash)) {
		$flash = (string)($takenFlash['text'] ?? '');
		$flashType = (string)($takenFlash['type'] ?? 'ok');
	}
}

if ($authed && ($_SERVER['REQUEST_METHOD'] ?? '') === 'POST' && $action !== '' && $action !== 'login' && $action !== 'logout') {
	if (!mn_admin_check_csrf()) {
		$flash = 'The session has expired.';
		$flashType = 'error';
	} else {
		$idRaw = $_POST['id'] ?? 0;
		$id = is_scalar($idRaw) ? (int)$idRaw : 0;
		$pdoAction = mn_analytics_open_db();
		if (!$pdoAction) {
			$flash = 'The database could not be opened.';
			$flashType = 'error';
		} else {
			try {
				$currentStmt = $pdoAction->prepare('SELECT status, reaction, comment, email FROM block_feedback WHERE id = ?');
				$currentStmt->execute([$id]);
				$current = $currentStmt->fetch();
				if (!is_array($current)) {
					feedback_flash('error', 'Feedback #' . $id . ' no longer exists.');
					feedback_redirect();
				}
				if ($action === 'accept' || $action === 'reject' || $action === 'done' || $action === 'reopen') {
					$fromStatus = (string)($current['status'] ?? '');
					$toStatus = match ($action) {
						'accept' => 'accepted',
						'reject' => 'rejected',
						'done' => 'done',
						default => 'new',
					};
					$stmt = $pdoAction->prepare('UPDATE block_feedback SET status = ?, decided_at = ?, updated_at = ? WHERE id = ?');
					$stmt->execute([$toStatus, time(), time(), $id]);
					if ($stmt->rowCount() > 0) {
						mn_feedback_history_add($pdoAction, $id, $action, $fromStatus, $toStatus, '');
					}
					feedback_flash('ok', 'Feedback #' . $id . ' marked as ' . feedback_status_label($toStatus) . '.');
					feedback_redirect_open($id);
				} elseif ($action === 'edit_feedback') {
					$reactionRaw = $_POST['reaction'] ?? '';
					$newReaction = is_scalar($reactionRaw) ? (string)$reactionRaw : '';
					if (!isset(mn_feedback_reactions()[$newReaction])) {
						$newReaction = (string)($current['reaction'] ?? '');
					}
					$commentRaw = $_POST['comment'] ?? '';
					$newComment = is_scalar($commentRaw) ? mn_feedback_clean_text((string)$commentRaw, 6000) : '';
					$emailRaw = $_POST['email'] ?? '';
					$newEmail = is_scalar($emailRaw) ? mn_feedback_clean_text((string)$emailRaw, 254, false) : '';
					if ($newEmail !== '' && filter_var($newEmail, FILTER_VALIDATE_EMAIL) === false) {
						feedback_flash('error', 'The email address is not valid.');
					} else {
						$noteParts = [];
						if ($newReaction !== (string)($current['reaction'] ?? '')) {
							$noteParts[] = 'reaction: ' . (string)($current['reaction'] ?? '') . ' -> ' . $newReaction;
						}
						if ($newComment !== (string)($current['comment'] ?? '')) {
							$noteParts[] = $newComment === '' ? 'comment cleared' : 'comment edited';
						}
						if ($newEmail !== (string)($current['email'] ?? '')) {
							$noteParts[] = $newEmail === '' ? 'email cleared' : 'email edited';
						}
						$stmt = $pdoAction->prepare('UPDATE block_feedback SET reaction = ?, comment = ?, email = ?, updated_at = ? WHERE id = ?');
						$stmt->execute([$newReaction, $newComment, $newEmail, time(), $id]);
						if ($stmt->rowCount() > 0) {
							mn_feedback_history_add($pdoAction, $id, 'edited', (string)$current['status'], (string)$current['status'], implode('; ', $noteParts));
						}
						feedback_flash('ok', 'Feedback #' . $id . ' updated.');
						feedback_redirect_open($id);
					}
				} elseif ($action === 'save_prompt') {
					$fromStatus = (string)($current['status'] ?? '');
					$noteRaw = $_POST['admin_note'] ?? '';
					$note = is_scalar($noteRaw) ? mn_feedback_clean_text((string)$noteRaw, 8000) : '';
					$promptRaw = $_POST['admin_prompt'] ?? '';
					$prompt = is_scalar($promptRaw) ? mn_feedback_clean_text((string)$promptRaw, 60000) : '';
					$stmt = $pdoAction->prepare('UPDATE block_feedback SET admin_note = ?, admin_prompt = ?, status = ?, decided_at = COALESCE(decided_at, ?), updated_at = ? WHERE id = ?');
					$stmt->execute([$note, $prompt, 'accepted', time(), time(), $id]);
					if ($stmt->rowCount() > 0) {
						mn_feedback_history_add($pdoAction, $id, 'prompt_saved', $fromStatus, 'accepted', substr($note, 0, 300));
					}
					feedback_flash('ok', 'Prompt saved for feedback #' . $id . '.');
					feedback_redirect_open($id);
				} elseif ($action === 'regenerate_prompt') {
					$row = mn_feedback_fetch($pdoAction, $id);
					if ($row) {
						$noteRaw = $_POST['admin_note'] ?? '';
						$note = is_scalar($noteRaw) ? mn_feedback_clean_text((string)$noteRaw, 8000) : '';
						$includeBug = !empty($_POST['include_bug']);
						$prompt = mn_feedback_build_prompt($row, $note, $includeBug);
						$fromStatus = (string)($row['status'] ?? '');
						$stmt = $pdoAction->prepare('UPDATE block_feedback SET admin_note = ?, admin_prompt = ?, status = ?, decided_at = COALESCE(decided_at, ?), updated_at = ? WHERE id = ?');
						$stmt->execute([$note, $prompt, 'accepted', time(), time(), $id]);
						if ($stmt->rowCount() > 0) {
							mn_feedback_history_add($pdoAction, $id, 'prompt_regenerated', $fromStatus, 'accepted', $includeBug ? 'with bug context' : 'without bug context');
						}
						feedback_flash('ok', 'Prompt regenerated for feedback #' . $id . '.');
						feedback_redirect_open($id);
					}
				} elseif ($action === 'delete') {
					$pdoAction->beginTransaction();
					$pdoAction->prepare('DELETE FROM feedback_history WHERE feedback_id = ?')->execute([$id]);
					$pdoAction->prepare('DELETE FROM feedback_selections WHERE feedback_id = ?')->execute([$id]);
					$pdoAction->prepare('DELETE FROM feedback_bug_context WHERE feedback_id = ?')->execute([$id]);
					$pdoAction->prepare('DELETE FROM block_feedback WHERE id = ?')->execute([$id]);
					$pdoAction->commit();
					feedback_flash('ok', 'Feedback #' . $id . ' deleted.');
					feedback_redirect();
				}
				feedback_redirect();
			} catch (Throwable $e) {
				if ($pdoAction->inTransaction()) {
					$pdoAction->rollBack();
				}
				$flash = 'The action could not be completed.';
				$flashType = 'error';
			}
		}
	}
}

$rangeOptions = feedback_range_options();
$tabs = feedback_tabs();
$tabRaw = $_GET['tab'] ?? 'overview';
$tab = is_scalar($tabRaw) ? (string)$tabRaw : 'overview';
if (!isset($tabs[$tab])) {
	$tab = 'overview';
}
$rangeRaw = $_GET['range'] ?? 30;
$range = is_scalar($rangeRaw) ? (int)$rangeRaw : 30;
if (!array_key_exists($range, $rangeOptions)) {
	$range = 30;
}
$pathRaw = $_GET['path'] ?? '';
$path = is_scalar($pathRaw) ? (string)$pathRaw : '';
if ($path !== '' && !preg_match('/^[a-zA-Z0-9_-]{1,80}$/', $path)) {
	$path = '';
}
$path = feedback_normalize_path($path);
$reactionRaw = $_GET['reaction'] ?? '';
$reaction = is_scalar($reactionRaw) ? (string)$reactionRaw : '';
if ($reaction !== '' && !isset(mn_feedback_reactions()[$reaction])) {
	$reaction = '';
}
$statusRaw = $_GET['status'] ?? '';
$status = is_scalar($statusRaw) ? (string)$statusRaw : '';
if (!in_array($status, ['', 'new', 'accepted', 'rejected', 'done'], true)) {
	$status = '';
}
$hasComment = isset($_GET['has_comment']) && (string)$_GET['has_comment'] === '1';
$bugOnly = isset($_GET['bug']) && (string)$_GET['bug'] === '1';
$searchRaw = $_GET['q'] ?? '';
$search = is_scalar($searchRaw) ? trim((string)$searchRaw) : '';
if (function_exists('mb_substr')) {
	$search = mb_substr($search, 0, 120, 'UTF-8');
} else {
	$search = substr($search, 0, 120);
}
$pageRaw = $_GET['page'] ?? 1;
$pageNum = is_scalar($pageRaw) ? max(1, (int)$pageRaw) : 1;
$openRaw = $_GET['open'] ?? 0;
$openId = is_scalar($openRaw) ? (int)$openRaw : 0;
$perPage = 30;

$listStatus = $tab === 'inbox' ? 'new' : ($tab === 'accepted' ? 'accepted' : ($tab === 'resolved' ? 'done' : $status));
$listReaction = $tab === 'bugs' ? 'bug' : $reaction;
$listBugOnly = $bugOnly || $tab === 'bugs';

$titles = mn_analytics_lesson_titles();
$reactions = mn_feedback_reactions();
$dbError = '';
$rows = [];
$total = 0;
$pageCount = 1;
$summary = ['total' => 0, 'with_comment' => 0, 'bugs' => 0, 'accepted' => 0, 'done' => 0, 'email' => 0];
$reactionCounts = array_fill_keys(array_keys($reactions), 0);
$statusCounts = ['new' => 0, 'accepted' => 0, 'rejected' => 0, 'done' => 0];
$pathOptions = [];
$pageStats = [];
$activity = [];
$latestFeedback = [];
$pdo = null;

if ($authed) {
	$pdo = mn_analytics_open_db();
	if (!$pdo) {
		$dbError = 'The SQLite database could not be opened.';
	} else {
		$baseParams = [];
		$baseWhere = feedback_where($range, $path, $reaction, $status, $hasComment, $bugOnly, $search, $baseParams);
		$listParams = [];
		$listWhere = feedback_where($range, $path, $listReaction, $listStatus, $hasComment, $listBugOnly, $search, $listParams);

		$summaryParams = [];
		$summaryWhere = feedback_where($range, $path, $listReaction, $listStatus, $hasComment, $listBugOnly, $search, $summaryParams);
		$summaryStmt = $pdo->prepare(
			"SELECT COUNT(*) AS total,
			        SUM(CASE WHEN f.comment <> '' THEN 1 ELSE 0 END) AS with_comment,
			        SUM(CASE WHEN f.reaction = 'bug' THEN 1 ELSE 0 END) AS bugs,
			        SUM(CASE WHEN f.status = 'accepted' THEN 1 ELSE 0 END) AS accepted,
			        SUM(CASE WHEN f.status = 'done' THEN 1 ELSE 0 END) AS done,
			        SUM(CASE WHEN f.email <> '' THEN 1 ELSE 0 END) AS email
			 FROM block_feedback f
			 LEFT JOIN feedback_selections s ON s.feedback_id = f.id
			 WHERE $summaryWhere"
		);
		$summaryStmt->execute($summaryParams);
		$summaryRow = $summaryStmt->fetch();
		if (is_array($summaryRow)) {
			$summary = [
				'total' => (int)($summaryRow['total'] ?? 0),
				'with_comment' => (int)($summaryRow['with_comment'] ?? 0),
				'bugs' => (int)($summaryRow['bugs'] ?? 0),
				'accepted' => (int)($summaryRow['accepted'] ?? 0),
				'done' => (int)($summaryRow['done'] ?? 0),
				'email' => (int)($summaryRow['email'] ?? 0),
			];
		}

		$countStmt = $pdo->prepare("SELECT f.reaction, COUNT(*) AS n FROM block_feedback f LEFT JOIN feedback_selections s ON s.feedback_id = f.id WHERE $summaryWhere GROUP BY f.reaction");
		$countStmt->execute($summaryParams);
		foreach ($countStmt->fetchAll() as $countRow) {
			$key = (string)$countRow['reaction'];
			if (isset($reactionCounts[$key])) {
				$reactionCounts[$key] = (int)$countRow['n'];
			}
		}
		$statusStmt = $pdo->prepare("SELECT f.status, COUNT(*) AS n FROM block_feedback f LEFT JOIN feedback_selections s ON s.feedback_id = f.id WHERE $baseWhere GROUP BY f.status");
		$statusStmt->execute($baseParams);
		foreach ($statusStmt->fetchAll() as $statusRow) {
			$key = (string)$statusRow['status'];
			if (isset($statusCounts[$key])) {
				$statusCounts[$key] = (int)$statusRow['n'];
			}
		}
		$pathParams = [];
		$pathWhere = feedback_where($range, '', $reaction, $status, $hasComment, $bugOnly, $search, $pathParams);
		$pathStmt = $pdo->prepare("SELECT f.path, COUNT(*) AS n FROM block_feedback f LEFT JOIN feedback_selections s ON s.feedback_id = f.id WHERE $pathWhere GROUP BY f.path ORDER BY n DESC, f.path");
		$pathStmt->execute($pathParams);
		foreach ($pathStmt->fetchAll() as $pathRow) {
			$pathKey = feedback_normalize_path((string)$pathRow['path']);
			$pathOptions[$pathKey] = ($pathOptions[$pathKey] ?? 0) + (int)$pathRow['n'];
		}

		$pageStmt = $pdo->prepare(
			"SELECT f.path,
			        COUNT(*) AS total,
			        SUM(CASE WHEN f.reaction = 'helpful' THEN 1 ELSE 0 END) AS helpful,
			        SUM(CASE WHEN f.reaction = 'unhelpful' THEN 1 ELSE 0 END) AS unhelpful,
			        SUM(CASE WHEN f.reaction = 'insight' THEN 1 ELSE 0 END) AS insight,
			        SUM(CASE WHEN f.reaction = 'confusing' THEN 1 ELSE 0 END) AS confusing,
			        SUM(CASE WHEN f.reaction = 'bug' THEN 1 ELSE 0 END) AS bug,
			        SUM(CASE WHEN f.comment <> '' THEN 1 ELSE 0 END) AS comments,
			        SUM(CASE WHEN f.status = 'new' THEN 1 ELSE 0 END) AS open_count,
			        SUM(CASE WHEN f.status = 'accepted' THEN 1 ELSE 0 END) AS accepted,
			        SUM(CASE WHEN f.status = 'done' THEN 1 ELSE 0 END) AS done_count,
			        MAX(f.ts) AS last_ts
			 FROM block_feedback f
			 LEFT JOIN feedback_selections s ON s.feedback_id = f.id
			 WHERE $baseWhere
			 GROUP BY f.path
			 ORDER BY total DESC, f.path"
		);
		$pageStmt->execute($baseParams);
		foreach ($pageStmt->fetchAll() as $pageRow) {
			$pageRow['path'] = feedback_normalize_path((string)$pageRow['path']);
			$pageRow['title'] = $titles[(string)$pageRow['path']] ?? (string)$pageRow['path'];
			$pageRow['attention'] = (int)$pageRow['unhelpful'] + (int)$pageRow['confusing'];
			$pageStats[] = $pageRow;
		}

		$activityStmt = $pdo->prepare(
			"SELECT h.*, f.path, f.lesson_title, f.reaction
			 FROM feedback_history h
			 JOIN block_feedback f ON f.id = h.feedback_id
			 LEFT JOIN feedback_selections s ON s.feedback_id = f.id
			 WHERE $baseWhere
			 ORDER BY h.ts DESC, h.id DESC
			 LIMIT 15"
		);
		$activityStmt->execute($baseParams);
		$activity = $activityStmt->fetchAll();

		$latestStmt = $pdo->prepare(
			"SELECT f.*, s.selected_text
			 FROM block_feedback f
			 LEFT JOIN feedback_selections s ON s.feedback_id = f.id
			 WHERE $baseWhere
			 ORDER BY f.ts DESC, f.id DESC
			 LIMIT 8"
		);
		$latestStmt->execute($baseParams);
		$latestFeedback = $latestStmt->fetchAll();

		if ($tab !== 'overview' && $tab !== 'pages') {
			$countStmt = $pdo->prepare("SELECT COUNT(*) FROM block_feedback f LEFT JOIN feedback_selections s ON s.feedback_id = f.id WHERE $listWhere");
			$countStmt->execute($listParams);
			$total = (int)$countStmt->fetchColumn();
			$pageCount = max(1, (int)ceil($total / $perPage));
			if ($pageNum > $pageCount) {
				$pageNum = $pageCount;
			}
			$offset = ($pageNum - 1) * $perPage;
			$stmt = $pdo->prepare(
				"SELECT f.*, s.selected_text, s.start_offset, s.end_offset, s.source_file,
				        b.consent AS bug_consent
				 FROM block_feedback f
				 LEFT JOIN feedback_selections s ON s.feedback_id = f.id
				 LEFT JOIN feedback_bug_context b ON b.feedback_id = f.id
				 WHERE $listWhere
				 ORDER BY f.ts DESC, f.id DESC
				 LIMIT $perPage OFFSET $offset"
			);
			$stmt->execute($listParams);
			$rows = $stmt->fetchAll();
		}
	}
}

$nowLabel = (new DateTimeImmutable('now', new DateTimeZone('Europe/Berlin')))->format('Y-m-d H:i');
$attentionPages = $pageStats;
usort($attentionPages, static function (array $a, array $b): int {
	return ((int)$b['attention'] <=> (int)$a['attention']) ?: ((int)$b['total'] <=> (int)$a['total']);
});
$attentionPages = array_slice(array_values(array_filter($attentionPages, static function (array $row): bool {
	return (int)$row['attention'] > 0;
})), 0, 6);
$helpfulPages = $pageStats;
usort($helpfulPages, static function (array $a, array $b): int {
	return ((int)$b['helpful'] <=> (int)$a['helpful']) ?: ((int)$b['total'] <=> (int)$a['total']);
});
$helpfulPages = array_slice(array_values(array_filter($helpfulPages, static function (array $row): bool {
	return (int)$row['helpful'] > 0;
})), 0, 6);
$recentPages = array_slice($pageStats, 0, 6);
?>
<!DOCTYPE html>
<html lang="en" class="<?php echo $embedTheme === 'light' ? '' : 'dark'; ?>" data-theme="<?php echo $embedTheme; ?>"<?php echo $embed ? ' data-embed="1"' : ''; ?>>
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Reader feedback · asanAI</title>
<style>
:root {
	--bg: #0f172a;
	--surface: #1e293b;
	--surface-2: #162033;
	--border: #334155;
	--text: #e2e8f0;
	--muted: #94a3b8;
	--heading: #f1f5f9;
	--accent: #818cf8;
	--coral: #fb923c;
	--emerald: #34d399;
	--rose: #fb7185;
	--sky: #38bdf8;
	--radius: 12px;
	--shadow: 0 10px 30px -18px rgba(0,0,0,.8);
}
html[data-theme="light"] {
	--bg: #f7f4eb;
	--surface: #fffdf7;
	--surface-2: #f1ecdf;
	--border: #d8cfb6;
	--text: #2a241b;
	--muted: #7a6d59;
	--heading: #1a140e;
	--accent: #4f46e5;
	--coral: #c2410c;
	--emerald: #047857;
	--rose: #be123c;
	--sky: #0369a1;
	--shadow: 0 10px 30px -20px rgba(50,40,20,.35);
}
* { box-sizing: border-box; }
html, body { margin: 0; padding: 0; }
body { background: var(--bg); color: var(--text); font: 14px/1.5 system-ui, -apple-system, "Segoe UI", Roboto, sans-serif; }
a { color: var(--accent); text-decoration: none; }
a:hover { text-decoration: underline; }
.page { max-width: 1280px; margin: 0 auto; padding: 28px 20px 60px; }
.top { display: flex; align-items: flex-start; justify-content: space-between; gap: 18px; margin-bottom: 16px; }
.brand { color: inherit; text-decoration: none; }
.brand:hover { text-decoration: none; color: var(--accent); }
h1 { margin: 0 0 4px; font-size: 30px; letter-spacing: -.02em; color: var(--heading); }
h2 { margin: 0 0 10px; font-size: 17px; letter-spacing: -.01em; color: var(--heading); }
.sub { margin: 0; color: var(--muted); font-size: 13px; }
.top-actions { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
.btn, .btn-link {
	display: inline-flex; align-items: center; justify-content: center; gap: 6px;
	padding: 7px 11px; border: 1px solid var(--border); border-radius: 9px;
	background: var(--surface); color: var(--text); font: 600 12px system-ui, sans-serif;
	cursor: pointer; text-decoration: none;
}
.btn:hover, .btn-link:hover { border-color: var(--accent); text-decoration: none; }
.btn.primary { background: var(--accent); border-color: var(--accent); color: #fff; }
.btn.danger { color: var(--rose); }
.btn.small { padding: 5px 8px; font-size: 11px; }
.flash { margin: 0 0 16px; padding: 10px 13px; border-radius: 10px; border: 1px solid var(--border); background: var(--surface); }
.flash.error { border-color: color-mix(in srgb, var(--rose) 55%, var(--border)); color: var(--rose); }
.admin-nav { display: flex; gap: 6px; overflow-x: auto; margin: 0 0 16px; padding: 0 0 6px; border-bottom: 1px solid var(--border); }
.admin-nav a { flex: none; padding: 7px 12px; border: 1px solid transparent; border-radius: 999px; color: var(--muted); font-size: 12px; font-weight: 600; text-decoration: none; white-space: nowrap; }
.admin-nav a:hover { color: var(--text); background: var(--surface); text-decoration: none; }
.admin-nav a.active { color: var(--heading); background: var(--surface); border-color: var(--border); box-shadow: var(--shadow); }
.tabs { display: flex; gap: 6px; overflow-x: auto; margin: 0 0 18px; padding: 0 0 7px; border-bottom: 1px solid var(--border); scrollbar-width: thin; }
.tabs a { flex: none; padding: 7px 11px; border: 1px solid transparent; border-radius: 999px; color: var(--muted); font: 600 12px system-ui, sans-serif; white-space: nowrap; }
.tabs a:hover { color: var(--text); background: var(--surface); text-decoration: none; }
.tabs a.active { color: var(--heading); background: var(--surface); border-color: var(--border); box-shadow: var(--shadow); }
.tabs .count { margin-left: 5px; color: var(--muted); font-size: 10.5px; }
.stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(135px, 1fr)); gap: 10px; margin: 0 0 18px; }
.stat { background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius); padding: 12px 14px; }
.stat b { display: block; font-size: 24px; line-height: 1.1; color: var(--heading); }
.stat span { color: var(--muted); font-size: 11px; letter-spacing: .05em; text-transform: uppercase; }
.toolbar { display: flex; flex-wrap: wrap; gap: 8px; align-items: center; margin: 0 0 18px; }
.toolbar form { display: flex; flex-wrap: wrap; gap: 8px; align-items: center; }
input, select, textarea { background: var(--surface); color: var(--text); border: 1px solid var(--border); border-radius: 8px; padding: 7px 9px; font: inherit; }
input[type="search"] { min-width: 240px; }
input[type="checkbox"] { accent-color: var(--accent); }
textarea { width: 100%; resize: vertical; }
label.check { display: inline-flex; align-items: center; gap: 5px; color: var(--muted); font-size: 12px; cursor: pointer; }
.overview-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
.card { background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius); padding: 15px; box-shadow: var(--shadow); min-width: 0; }
.card.wide { grid-column: 1 / -1; }
.leader { display: grid; gap: 7px; }
.leader-row { display: grid; grid-template-columns: minmax(0, 1fr) auto auto; gap: 8px; align-items: center; padding: 7px 8px; border-radius: 8px; background: var(--surface-2); }
.leader-row:hover { background: color-mix(in srgb, var(--accent) 8%, var(--surface-2)); text-decoration: none; }
.leader-title { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; color: var(--text); font-size: 12.5px; }
.leader-num { color: var(--heading); font: 700 13px/1 ui-monospace, monospace; }
.leader-tag { color: var(--muted); font-size: 10.5px; white-space: nowrap; }
.timeline { display: grid; gap: 8px; }
.timeline-row { display: grid; grid-template-columns: 118px minmax(0, 1fr) auto; gap: 9px; align-items: baseline; padding: 7px 8px; border-radius: 8px; background: var(--surface-2); }
.timeline-when { color: var(--muted); font-size: 10.5px; white-space: nowrap; }
.timeline-what { min-width: 0; color: var(--text); font-size: 12px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.timeline-what b { color: var(--heading); }
.timeline-action { color: var(--accent); font-size: 10.5px; font-weight: 700; white-space: nowrap; }
.table-wrap { overflow-x: auto; border: 1px solid var(--border); border-radius: var(--radius); background: var(--surface); box-shadow: var(--shadow); }
table.stats-table { width: 100%; border-collapse: collapse; min-width: 770px; }
.stats-table th, .stats-table td { padding: 9px 10px; border-bottom: 1px solid var(--border); text-align: right; font-size: 12px; white-space: nowrap; }
.stats-table th:first-child, .stats-table td:first-child { text-align: left; white-space: normal; min-width: 190px; }
.stats-table th { color: var(--muted); font-size: 10.5px; text-transform: uppercase; letter-spacing: .05em; font-weight: 700; }
.stats-table tbody tr:last-child td { border-bottom: 0; }
.stats-table tbody tr:hover { background: var(--surface-2); }
.stats-table .good { color: var(--emerald); }
.stats-table .bad { color: var(--rose); }
.list { display: grid; gap: 10px; }
.item { background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius); box-shadow: var(--shadow); overflow: hidden; scroll-margin-top: 84px; }
.item summary { list-style: none; cursor: pointer; padding: 13px 15px; display: grid; grid-template-columns: 1fr auto; gap: 14px; align-items: start; }
.item summary::-webkit-details-marker { display: none; }
.item-head { min-width: 0; }
.item-title { display: flex; flex-wrap: wrap; gap: 7px; align-items: center; margin-bottom: 4px; }
.item-title b { color: var(--heading); font-size: 14px; }
.item-meta { color: var(--muted); font-size: 11.5px; }
.item-quote { margin-top: 6px; color: var(--text); font-family: Georgia, "Times New Roman", serif; font-style: italic; font-size: 13px; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
.item-side { display: flex; flex-direction: column; align-items: flex-end; gap: 6px; flex: none; }
.badge { display: inline-flex; align-items: center; gap: 4px; padding: 3px 8px; border-radius: 999px; border: 1px solid var(--border); font-size: 10.5px; font-weight: 700; letter-spacing: .03em; text-transform: uppercase; color: var(--muted); }
.badge.helpful { color: var(--emerald); border-color: color-mix(in srgb, var(--emerald) 45%, var(--border)); }
.badge.unhelpful, .badge.bug { color: var(--rose); border-color: color-mix(in srgb, var(--rose) 45%, var(--border)); }
.badge.insight { color: var(--coral); border-color: color-mix(in srgb, var(--coral) 45%, var(--border)); }
.badge.confusing { color: var(--sky); border-color: color-mix(in srgb, var(--sky) 45%, var(--border)); }
.badge.status-new { color: var(--accent); border-color: color-mix(in srgb, var(--accent) 45%, var(--border)); }
.badge.status-accepted { color: var(--emerald); border-color: color-mix(in srgb, var(--emerald) 45%, var(--border)); }
.badge.status-rejected { color: var(--muted); }
.badge.status-done { color: var(--sky); border-color: color-mix(in srgb, var(--sky) 45%, var(--border)); }
.item-body { border-top: 1px solid var(--border); padding: 15px; display: grid; gap: 14px; background: var(--surface-2); }
.grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 12px; }
.kv { min-width: 0; }
.kv .k { color: var(--muted); font-size: 10.5px; font-weight: 700; letter-spacing: .06em; text-transform: uppercase; margin-bottom: 3px; }
.kv .v { color: var(--text); font-size: 12.5px; overflow-wrap: anywhere; }
pre.block { margin: 0; padding: 10px; border-radius: 8px; background: var(--bg); border: 1px solid var(--border); color: var(--text); white-space: pre-wrap; overflow-wrap: anywhere; font: 11.5px/1.5 ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; max-height: 260px; overflow: auto; }
.quote { padding: 10px 12px; border-left: 3px solid var(--accent); background: var(--bg); border-radius: 0 8px 8px 0; font-family: Georgia, "Times New Roman", serif; font-style: italic; white-space: pre-wrap; }
.actions { display: flex; flex-wrap: wrap; gap: 7px; align-items: center; }
.actions form { display: inline; }
.edit-form { display: grid; gap: 8px; padding: 12px; border: 1px solid var(--border); border-radius: 10px; background: var(--bg); }
.edit-form textarea { font: 12.5px/1.5 system-ui, sans-serif; min-height: 70px; }
.edit-row { display: flex; flex-wrap: wrap; gap: 8px; align-items: center; }
.prompt { display: grid; gap: 9px; }
.prompt textarea { min-height: 260px; font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; font-size: 12px; line-height: 1.5; }
.prompt .row { display: flex; flex-wrap: wrap; gap: 8px; align-items: center; }
.prompt .hint, .hint { color: var(--muted); font-size: 11.5px; }
.history { display: grid; gap: 5px; }
.history-row { display: flex; flex-wrap: wrap; gap: 8px; align-items: baseline; color: var(--muted); font-size: 11.5px; }
.history-row b { color: var(--text); font-weight: 600; }
.empty { padding: 40px 16px; text-align: center; color: var(--muted); background: var(--surface); border: 1px dashed var(--border); border-radius: var(--radius); }
.pager { display: flex; justify-content: center; gap: 8px; margin-top: 18px; }
.muted { color: var(--muted); }
.pill { display: inline-flex; align-items: center; gap: 5px; padding: 2px 8px; border-radius: 999px; background: var(--surface-2); color: var(--muted); font-size: 11px; }
.login-card { max-width: 420px; margin: 10vh auto 0; background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius); padding: 22px; box-shadow: var(--shadow); }
.login-card h1 { font-size: 26px; }
.login-card label { display: block; margin: 14px 0 5px; color: var(--muted); font-size: 12px; }
.login-card input { width: 100%; }
.login-card button { width: 100%; margin-top: 14px; }
.login-note { color: var(--muted); font-size: 11.5px; line-height: 1.5; }
.error { color: var(--rose); font-size: 12.5px; margin: 10px 0; }
@media (max-width: 900px) {
	.overview-grid { grid-template-columns: 1fr; }
}
html[data-embed="1"],
html[data-embed="1"] body {
	background: transparent;
}
html[data-embed="1"] .page {
	max-width: none;
	padding: 0;
}
html[data-embed="1"] .top,
html[data-embed="1"] .admin-nav {
	display: none !important;
}
html[data-embed="1"] .feedback-embed {
	display: none !important;
}

@media (max-width: 720px) {
	.page { padding: 18px 12px 44px; }
	h1 { font-size: 24px; }
	.top { flex-direction: column; }
	.item summary { grid-template-columns: 1fr; }
	.item-side { flex-direction: row; align-items: center; justify-content: flex-start; }
	.timeline-row { grid-template-columns: 1fr; gap: 2px; }
	.toolbar form { width: 100%; }
	input[type="search"] { min-width: 0; width: 100%; }
}
</style>
</head>
<body<?php echo $embed ? ' data-embed="1"' : ''; ?>>
<div class="page">
<?php if (!$authed): ?>
	<div class="login-card">
		<h1><a class="brand" href="index">Reader feedback</a></h1>
		<p class="sub">The same password as the analytics dashboard.</p>
		<?php if ($loginError !== ''): ?><div class="error"><?php echo feedback_h($loginError); ?></div><?php endif; ?>
		<form method="post" action="" autocomplete="off">
			<input type="hidden" name="action" value="login">
			<input type="hidden" name="csrf" value="<?php echo feedback_h(mn_admin_csrf()); ?>">
			<label for="password">Password</label>
			<input id="password" name="password" type="password" autocomplete="current-password" required autofocus>
			<button type="submit" class="btn primary">Sign in</button>
		</form>
		<p class="login-note">Only technically necessary cookies are used (the shared dashboard session). No tracking cookies.</p>
	</div>
<?php else: ?>
	<header class="top">
		<div>
			<h1><a class="brand" href="index">Reader feedback</a></h1>
			<p class="sub">Selected passages, reactions, comments and optional bug context · as of <?php echo feedback_h($nowLabel); ?> (Berlin)</p>
		</div>
		<div class="top-actions">
			<a class="btn" href="<?php echo feedback_h(feedback_current_url()); ?>" title="Reload feedback">Refresh</a>
			<button type="button" id="theme-toggle" class="btn">Light</button>
			<form method="post" action="">
				<input type="hidden" name="action" value="logout">
				<input type="hidden" name="csrf" value="<?php echo feedback_h(mn_admin_csrf()); ?>">
				<button type="submit" class="btn">Sign out</button>
			</form>
		</div>
	</header>

	<nav class="admin-nav" aria-label="Admin areas">
		<a href="stats">Analytics</a>
		<a class="active" href="feedback">Reader feedback</a>
		<a href="index">Course</a>
	</nav>

	<?php if ($flash !== ''): ?><div class="flash <?php echo $flashType === 'error' ? 'error' : ''; ?>"><?php echo feedback_h($flash); ?></div><?php endif; ?>
	<?php if ($dbError !== ''): ?><div class="flash error"><?php echo feedback_h($dbError); ?></div><?php endif; ?>

	<?php if ($dbError === ''): ?>
	<nav class="tabs" aria-label="Feedback sections">
		<?php foreach ($tabs as $key => $label): ?>
			<a class="<?php echo $tab === $key ? 'active' : ''; ?>" href="?<?php echo feedback_h(feedback_query(['tab' => $key, 'page' => 1, 'status' => ''])); ?>">
				<?php echo feedback_h($label); ?>
				<?php if ($key === 'inbox'): ?><span class="count"><?php echo (int)$statusCounts['new']; ?></span><?php endif; ?>
				<?php if ($key === 'accepted'): ?><span class="count"><?php echo (int)$statusCounts['accepted']; ?></span><?php endif; ?>
				<?php if ($key === 'resolved'): ?><span class="count"><?php echo (int)$statusCounts['done']; ?></span><?php endif; ?>
				<?php if ($key === 'bugs'): ?><span class="count"><?php echo (int)$reactionCounts['bug']; ?></span><?php endif; ?>
			</a>
		<?php endforeach; ?>
	</nav>

	<div class="stats">
		<div class="stat"><b><?php echo feedback_h(number_format($summary['total'])); ?></b><span>In view</span></div>
		<div class="stat"><b><?php echo feedback_h(number_format($summary['with_comment'])); ?></b><span>With comment</span></div>
		<div class="stat"><b><?php echo feedback_h(number_format($summary['bugs'])); ?></b><span>Bugs</span></div>
		<div class="stat"><b><?php echo feedback_h(number_format($summary['accepted'])); ?></b><span>Accepted</span></div>
		<div class="stat"><b><?php echo feedback_h(number_format($summary['done'])); ?></b><span>Done</span></div>
		<div class="stat"><b><?php echo feedback_h(number_format($summary['email'])); ?></b><span>Email left</span></div>
		<?php foreach ($reactionCounts as $key => $count): $meta = $reactions[$key]; ?>
			<div class="stat"><b><?php echo feedback_h(number_format($count)); ?></b><span><?php echo feedback_h($meta['icon'] . ' ' . $meta['label']); ?></span></div>
		<?php endforeach; ?>
	</div>

	<?php if ($tab === 'overview'): ?>
		<div class="overview-grid">
			<div class="card wide">
				<h2>Latest suggestions &amp; bugs</h2>
				<?php if (!$latestFeedback): ?><p class="muted">No feedback yet.</p><?php else: ?>
				<div class="timeline">
					<?php foreach ($latestFeedback as $l): ?>
						<?php
							$lMeta = $reactions[(string)$l['reaction']] ?? ['icon' => '', 'label' => (string)$l['reaction']];
							$lText = trim((string)($l['comment'] ?? ''));
							if ($lText === '') {
								$lText = trim((string)($l['selected_text'] ?? ''));
							}
							$lText = preg_replace('/\s+/u', ' ', $lText) ?? '';
							$lLink = feedback_internal_href(['tab' => 'all', 'path' => $l['path'], 'page' => 1, 'status' => '', 'open' => (int)$l['id']]);
						?>
						<a class="timeline-row" href="<?php echo feedback_h($lLink); ?>">
							<span class="timeline-when"><?php echo feedback_h((new DateTimeImmutable('@' . (int)$l['ts']))->setTimezone(new DateTimeZone('Europe/Berlin'))->format('M j, H:i')); ?></span>
							<span class="timeline-what"><b><?php echo feedback_h($lMeta['icon'] . ' ' . $lMeta['label']); ?></b> · <?php echo feedback_h($titles[$l['path']] ?? $l['path']); ?><?php if ($lText !== ''): ?> — <?php echo feedback_h(mb_substr($lText, 0, 120, 'UTF-8')); ?><?php endif; ?></span>
							<span class="timeline-action"><?php echo !empty($l['bug_consent']) ? 'Log attached' : feedback_h(feedback_status_label((string)$l['status'])); ?></span>
						</a>
					<?php endforeach; ?>
				</div>
				<?php endif; ?>
			</div>
			<div class="card">
				<h2>Most feedback</h2>
				<?php if (!$recentPages): ?><p class="muted">No pages yet.</p><?php else: ?>
				<div class="leader">
					<?php foreach ($recentPages as $p): ?>
						<a class="leader-row" href="?<?php echo feedback_h(feedback_query(['tab' => 'all', 'path' => $p['path'], 'page' => 1, 'status' => ''])); ?>">
							<span class="leader-title"><?php echo feedback_h($p['title']); ?></span>
							<span class="leader-num"><?php echo (int)$p['total']; ?></span>
							<span class="leader-tag">total</span>
						</a>
					<?php endforeach; ?>
				</div>
				<?php endif; ?>
			</div>
			<div class="card">
				<h2>Needs attention</h2>
				<?php if (!$attentionPages): ?><p class="muted">Nothing flagged as unhelpful or confusing in this view.</p><?php else: ?>
				<div class="leader">
					<?php foreach ($attentionPages as $p): ?>
						<a class="leader-row" href="?<?php echo feedback_h(feedback_query(['tab' => 'all', 'path' => $p['path'], 'page' => 1, 'status' => ''])); ?>">
							<span class="leader-title"><?php echo feedback_h($p['title']); ?></span>
							<span class="leader-num"><?php echo (int)$p['attention']; ?></span>
							<span class="leader-tag">👎 + ❓</span>
						</a>
					<?php endforeach; ?>
				</div>
				<?php endif; ?>
			</div>
			<div class="card">
				<h2>Most helpful</h2>
				<?php if (!$helpfulPages): ?><p class="muted">No “helpful” reactions in this view yet.</p><?php else: ?>
				<div class="leader">
					<?php foreach ($helpfulPages as $p): ?>
						<a class="leader-row" href="?<?php echo feedback_h(feedback_query(['tab' => 'all', 'path' => $p['path'], 'page' => 1, 'status' => ''])); ?>">
							<span class="leader-title"><?php echo feedback_h($p['title']); ?></span>
							<span class="leader-num"><?php echo (int)$p['helpful']; ?></span>
							<span class="leader-tag">👍</span>
						</a>
					<?php endforeach; ?>
				</div>
				<?php endif; ?>
			</div>
			<div class="card">
				<h2>Recent movements</h2>
				<?php if (!$activity): ?><p class="muted">No activity yet.</p><?php else: ?>
				<div class="timeline">
					<?php foreach ($activity as $a): ?>
						<div class="timeline-row">
							<span class="timeline-when"><?php echo feedback_h((new DateTimeImmutable('@' . (int)$a['ts']))->setTimezone(new DateTimeZone('Europe/Berlin'))->format('M j, H:i')); ?></span>
							<span class="timeline-what"><b>#<?php echo (int)$a['feedback_id']; ?></b> <?php echo feedback_h($titles[$a['path']] ?? $a['path']); ?><?php if (!empty($a['note'])): ?> · <?php echo feedback_h($a['note']); ?><?php endif; ?></span>
							<span class="timeline-action"><?php echo feedback_h(feedback_action_label((string)$a['action'])); ?></span>
						</div>
					<?php endforeach; ?>
				</div>
				<?php endif; ?>
			</div>
			<div class="card wide">
				<h2>Helpful vs. not helpful, per page</h2>
				<?php if (!$pageStats): ?><p class="muted">No feedback yet.</p><?php else: ?>
				<div class="table-wrap">
					<table class="stats-table">
						<thead><tr><th>Page</th><th>Total</th><th>👍</th><th>👎</th><th>👍 rate</th><th>💡</th><th>❓</th><th>🐞</th><th>Comments</th></tr></thead>
						<tbody>
						<?php foreach ($pageStats as $p): ?>
							<tr>
								<td><a href="<?php echo feedback_h(feedback_internal_href(['tab' => 'all', 'path' => $p['path'], 'page' => 1, 'status' => ''])); ?>"><?php echo feedback_h($p['title']); ?></a> <a class="muted" href="<?php echo feedback_h(feedback_lesson_href($p['path'])); ?>" title="Open lesson">↗</a></td>
								<td><?php echo feedback_count_link($p['path'], '', (int)$p['total']); ?></td>
								<td class="good"><?php echo feedback_count_link($p['path'], 'helpful', (int)$p['helpful'], 'good'); ?></td>
								<td class="bad"><?php echo feedback_count_link($p['path'], 'unhelpful', (int)$p['unhelpful'], 'bad'); ?></td>
								<?php $rate = ((int)$p['helpful'] + (int)$p['unhelpful']) > 0 ? (int)round(100 * (int)$p['helpful'] / ((int)$p['helpful'] + (int)$p['unhelpful'])) : null; ?>
								<td><?php echo $rate === null ? '—' : feedback_h($rate . ' %'); ?></td>
								<td><?php echo feedback_count_link($p['path'], 'insight', (int)$p['insight']); ?></td>
								<td><?php echo feedback_count_link($p['path'], 'confusing', (int)$p['confusing']); ?></td>
								<td><?php echo feedback_count_link($p['path'], 'bug', (int)$p['bug']); ?></td>
								<td><?php echo (int)$p['comments']; ?></td>
							</tr>
						<?php endforeach; ?>
						</tbody>
					</table>
				</div>
				<?php endif; ?>
			</div>
		</div>
	<?php elseif ($tab === 'pages'): ?>
		<div class="toolbar">
			<form method="get" action="">
				<input type="hidden" name="tab" value="pages">
				<select name="range" aria-label="Time range">
					<?php foreach ($rangeOptions as $r => $label): ?>
						<option value="<?php echo $r; ?>"<?php echo $range === $r ? ' selected' : ''; ?>><?php echo feedback_h($label); ?></option>
					<?php endforeach; ?>
				</select>
				<select name="path" aria-label="Lesson">
					<option value="">All lessons</option>
					<?php foreach ($pathOptions as $slug => $count): ?>
						<option value="<?php echo feedback_h($slug); ?>"<?php echo $path === $slug ? ' selected' : ''; ?>><?php echo feedback_h($titles[$slug] ?? $slug); ?> (<?php echo (int)$count; ?>)</option>
					<?php endforeach; ?>
				</select>
				<input type="search" name="q" value="<?php echo feedback_h($search); ?>" placeholder="Search comments, passages, emails…" aria-label="Search feedback">
				<button type="submit" class="btn primary">Filter</button>
				<a class="btn" href="?<?php echo feedback_h(feedback_query(['tab' => 'pages', 'range' => '', 'path' => '', 'q' => ''])); ?>">Reset</a>
			</form>
		</div>
		<?php if (!$pageStats): ?>
			<div class="empty">No feedback matches these filters yet.</div>
		<?php else: ?>
			<div class="table-wrap">
				<table class="stats-table">
					<thead><tr><th>Page</th><th>Total</th><th>👍 Helpful</th><th>👎 Not helpful</th><th>👍 rate</th><th>💡 Insight</th><th>❓ Confusing</th><th>🐞 Bug</th><th>Comments</th><th>Open</th><th>Accepted</th><th>Done</th><th>Last</th></tr></thead>
					<tbody>
					<?php foreach ($pageStats as $p): ?>
						<?php $lastTs = (int)($p['last_ts'] ?? 0); ?>
						<tr>
							<td><a href="<?php echo feedback_h(feedback_internal_href(['tab' => 'all', 'path' => $p['path'], 'page' => 1, 'status' => ''])); ?>"><?php echo feedback_h($p['title']); ?></a> <a class="muted" href="<?php echo feedback_h(feedback_lesson_href($p['path'])); ?>" title="Open lesson">↗</a><div class="leader-tag">/<?php echo feedback_h(feedback_normalize_path($p['path'])); ?></div></td>
							<td><?php echo feedback_count_link($p['path'], '', (int)$p['total']); ?></td>
							<td class="good"><?php echo feedback_count_link($p['path'], 'helpful', (int)$p['helpful'], 'good'); ?></td>
							<td class="bad"><?php echo feedback_count_link($p['path'], 'unhelpful', (int)$p['unhelpful'], 'bad'); ?></td>
							<?php $rate = ((int)$p['helpful'] + (int)$p['unhelpful']) > 0 ? (int)round(100 * (int)$p['helpful'] / ((int)$p['helpful'] + (int)$p['unhelpful'])) : null; ?>
							<td><?php echo $rate === null ? '—' : feedback_h($rate . ' %'); ?></td>
							<td><?php echo feedback_count_link($p['path'], 'insight', (int)$p['insight']); ?></td>
							<td><?php echo feedback_count_link($p['path'], 'confusing', (int)$p['confusing']); ?></td>
							<td><?php echo feedback_count_link($p['path'], 'bug', (int)$p['bug']); ?></td>
							<td><?php echo (int)$p['comments']; ?></td>
							<td><a href="?<?php echo feedback_h(feedback_query(['tab' => 'inbox', 'path' => $p['path'], 'page' => 1, 'status' => '', 'reaction' => ''])); ?>"><?php echo (int)$p['open_count']; ?></a></td>
							<td><a href="?<?php echo feedback_h(feedback_query(['tab' => 'accepted', 'path' => $p['path'], 'page' => 1, 'status' => '', 'reaction' => ''])); ?>"><?php echo (int)$p['accepted']; ?></a></td>
							<td><a href="?<?php echo feedback_h(feedback_query(['tab' => 'resolved', 'path' => $p['path'], 'page' => 1, 'status' => '', 'reaction' => ''])); ?>"><?php echo (int)$p['done_count']; ?></a></td>
							<td class="leader-tag"><?php echo $lastTs > 0 ? feedback_h((new DateTimeImmutable('@' . $lastTs))->setTimezone(new DateTimeZone('Europe/Berlin'))->format('M j, H:i')) : '—'; ?></td>
						</tr>
					<?php endforeach; ?>
					</tbody>
				</table>
			</div>
		<?php endif; ?>
	<?php else: ?>
		<div class="toolbar">
			<form method="get" action="">
				<input type="hidden" name="tab" value="<?php echo feedback_h($tab); ?>">
				<select name="range" aria-label="Time range">
					<?php foreach ($rangeOptions as $r => $label): ?>
						<option value="<?php echo $r; ?>"<?php echo $range === $r ? ' selected' : ''; ?>><?php echo feedback_h($label); ?></option>
					<?php endforeach; ?>
				</select>
				<select name="path" aria-label="Lesson">
					<option value="">All lessons</option>
					<?php foreach ($pathOptions as $slug => $count): ?>
						<option value="<?php echo feedback_h($slug); ?>"<?php echo $path === $slug ? ' selected' : ''; ?>><?php echo feedback_h($titles[$slug] ?? $slug); ?> (<?php echo (int)$count; ?>)</option>
					<?php endforeach; ?>
				</select>
				<?php if ($tab !== 'bugs'): ?>
					<select name="reaction" aria-label="Reaction">
						<option value="">All reactions</option>
						<?php foreach ($reactions as $key => $meta): ?>
							<option value="<?php echo feedback_h($key); ?>"<?php echo $reaction === $key ? ' selected' : ''; ?>><?php echo feedback_h($meta['icon'] . ' ' . $meta['label']); ?></option>
						<?php endforeach; ?>
					</select>
				<?php endif; ?>
				<?php if ($tab === 'all'): ?>
					<select name="status" aria-label="Status">
						<option value="">Any status</option>
						<?php foreach (['new', 'accepted', 'rejected', 'done'] as $st): ?>
							<option value="<?php echo $st; ?>"<?php echo $status === $st ? ' selected' : ''; ?>><?php echo feedback_h(feedback_status_label($st)); ?></option>
						<?php endforeach; ?>
					</select>
				<?php endif; ?>
				<label class="check"><input type="checkbox" name="has_comment" value="1"<?php echo $hasComment ? ' checked' : ''; ?>> With comment</label>
				<?php if ($tab !== 'bugs'): ?><label class="check"><input type="checkbox" name="bug" value="1"<?php echo $bugOnly ? ' checked' : ''; ?>> Bugs only</label><?php endif; ?>
				<input type="search" name="q" value="<?php echo feedback_h($search); ?>" placeholder="Search comments, passages, emails…" aria-label="Search feedback">
				<button type="submit" class="btn primary">Filter</button>
				<a class="btn" href="?<?php echo feedback_h(feedback_query(['tab' => $tab, 'range' => '', 'path' => '', 'reaction' => '', 'status' => '', 'has_comment' => '', 'bug' => '', 'q' => '', 'page' => ''])); ?>">Reset</a>
			</form>
		</div>

		<?php if (!$rows): ?>
			<div class="empty">No feedback matches this view yet.</div>
		<?php else: ?>
			<div class="list">
			<?php foreach ($rows as $row): ?>
				<?php
					$id = (int)$row['id'];
					$reactionKey = (string)$row['reaction'];
					$meta = $reactions[$reactionKey] ?? ['icon' => '', 'label' => $reactionKey];
					$rowStatus = (string)$row['status'];
					$created = (int)$row['ts'];
					$createdLabel = (new DateTimeImmutable('@' . $created))->setTimezone(new DateTimeZone('Europe/Berlin'))->format('Y-m-d H:i');
					$selected = trim((string)($row['selected_text'] ?? ''));
					$comment = trim((string)($row['comment'] ?? ''));
					$lessonTitle = (string)($row['lesson_title'] ?: ($titles[$row['path']] ?? $row['path']));
					$full = mn_feedback_fetch($pdo, $id);
					$history = mn_feedback_history($pdo, $id);
					$promptValue = (string)($row['admin_prompt'] ?? '');
					if ($full && $promptValue === '' && ($rowStatus === 'accepted' || $rowStatus === 'done')) {
						$promptValue = mn_feedback_build_prompt($full, (string)($row['admin_note'] ?? ''), false);
					}
				?>
				<details class="item" id="feedback-<?php echo $id; ?>"<?php echo $openId === $id ? ' open' : ''; ?>>
					<summary>
						<div class="item-head">
							<div class="item-title">
								<b><?php echo feedback_h($lessonTitle); ?></b>
								<span class="badge <?php echo feedback_h($reactionKey); ?>"><?php echo feedback_h($meta['icon'] . ' ' . $meta['label']); ?></span>
								<span class="badge status-<?php echo feedback_h($rowStatus); ?>"><?php echo feedback_h(feedback_status_label($rowStatus)); ?></span>
								<?php if (!empty($row['bug_consent'])): ?><span class="badge bug">Log attached</span><?php endif; ?>
							</div>
							<div class="item-meta">
								#<?php echo $id; ?> · <?php echo feedback_h($createdLabel); ?>
								<?php if (!empty($row['section_title'])): ?> · <?php echo feedback_h($row['section_title']); ?><?php endif; ?>
								<?php if (!empty($row['email'])): ?> · <?php echo feedback_h($row['email']); ?><?php endif; ?>
							</div>
							<?php if ($selected !== ''): ?><div class="item-quote">“<?php echo feedback_h($selected); ?>”</div><?php endif; ?>
						</div>
						<div class="item-side"><span class="item-meta">#<?php echo $id; ?></span></div>
					</summary>
					<div class="item-body">
						<div class="grid">
							<div class="kv"><div class="k">Page</div><div class="v"><a href="<?php echo feedback_h(feedback_internal_href(['tab' => 'all', 'path' => $row['path'], 'page' => 1, 'status' => ''])); ?>">/<?php echo feedback_h(feedback_normalize_path($row['path'])); ?></a> · <a href="<?php echo feedback_h(feedback_lesson_href($row['path'])); ?>">open lesson</a></div></div>
							<div class="kv"><div class="k">Part</div><div class="v"><?php echo feedback_h($row['part'] > 0 ? $row['part'] . ' · ' . $row['part_title'] : '—'); ?></div></div>
							<div class="kv"><div class="k">Section</div><div class="v"><?php echo feedback_h($row['section_title'] ?: '—'); ?></div></div>
							<div class="kv"><div class="k">Block</div><div class="v">#<?php echo (int)$row['block_index']; ?><?php if (!empty($row['block_selector'])): ?> · <code><?php echo feedback_h($row['block_selector']); ?></code><?php endif; ?></div></div>
							<div class="kv"><div class="k">Source file</div><div class="v"><code><?php echo feedback_h($row['source_file'] ?: ('blog/' . feedback_normalize_path($row['path']) . '.php')); ?></code></div></div>
							<div class="kv"><div class="k">Context</div><div class="v"><?php echo feedback_h($row['context_kind'] ?: 'prose'); ?><?php if (!empty($row['container_label'])): ?> · <?php echo feedback_h($row['container_label']); ?><?php endif; ?><?php if (!empty($row['container_selector'])): ?><div class="leader-tag"><code><?php echo feedback_h($row['container_selector']); ?></code></div><?php endif; ?></div></div>
							<div class="kv"><div class="k">Selection offsets</div><div class="v"><?php echo (int)($row['start_offset'] ?? 0); ?>–<?php echo (int)($row['end_offset'] ?? 0); ?></div></div>
						</div>

						<?php if ($selected !== ''): ?><div class="kv"><div class="k">Selected passage</div><div class="quote"><?php echo feedback_h($selected); ?></div></div><?php endif; ?>
						<?php if ($comment !== ''): ?><div class="kv"><div class="k">Comment</div><div class="quote"><?php echo nl2br(feedback_h($comment)); ?></div></div><?php endif; ?>
						<?php if ($full && !empty($full['block_text'])): ?><div class="kv"><div class="k">Full block text</div><pre class="block"><?php echo feedback_h($full['block_text']); ?></pre></div><?php endif; ?>

						<?php if ($full && !empty($full['bug_consent'])): ?>
						<details>
							<summary class="btn small" style="display:inline-flex;">Bug context</summary>
							<div class="grid" style="margin-top:10px;">
								<?php if (!empty($full['bug_url'])): ?><div class="kv"><div class="k">URL</div><div class="v"><?php echo feedback_h($full['bug_url']); ?></div></div><?php endif; ?>
								<?php if (!empty($full['bug_user_agent'])): ?><div class="kv"><div class="k">User-Agent</div><div class="v"><?php echo feedback_h($full['bug_user_agent']); ?></div></div><?php endif; ?>
								<?php if (!empty($full['bug_viewport'])): ?><div class="kv"><div class="k">Viewport</div><div class="v"><?php echo feedback_h($full['bug_viewport']); ?></div></div><?php endif; ?>
							</div>
							<?php if (!empty($full['bug_console_logs_json'])): ?><div class="kv" style="margin-top:10px;"><div class="k">Console log</div><pre class="block"><?php echo feedback_h($full['bug_console_logs_json']); ?></pre></div><?php endif; ?>
							<?php if (!empty($full['bug_last_clicks_json'])): ?><div class="kv" style="margin-top:10px;"><div class="k">Last interactions</div><pre class="block"><?php echo feedback_h($full['bug_last_clicks_json']); ?></pre></div><?php endif; ?>
							<?php if (!empty($full['bug_last_error_json'])): ?><div class="kv" style="margin-top:10px;"><div class="k">Last error</div><pre class="block"><?php echo feedback_h($full['bug_last_error_json']); ?></pre></div><?php endif; ?>
						</details>
						<?php endif; ?>

						<div class="actions">
							<?php if ($rowStatus !== 'accepted' && $rowStatus !== 'done'): ?>
								<form method="post" action="">
									<input type="hidden" name="action" value="accept">
									<input type="hidden" name="csrf" value="<?php echo feedback_h(mn_admin_csrf()); ?>">
									<input type="hidden" name="id" value="<?php echo $id; ?>">
									<button type="submit" class="btn primary">Accept &amp; prepare prompt</button>
								</form>
							<?php endif; ?>
							<?php if ($rowStatus !== 'rejected'): ?>
								<form method="post" action="">
									<input type="hidden" name="action" value="reject">
									<input type="hidden" name="csrf" value="<?php echo feedback_h(mn_admin_csrf()); ?>">
									<input type="hidden" name="id" value="<?php echo $id; ?>">
									<button type="submit" class="btn">Reject</button>
								</form>
							<?php endif; ?>
							<?php if ($rowStatus !== 'done'): ?>
								<form method="post" action="">
									<input type="hidden" name="action" value="done">
									<input type="hidden" name="csrf" value="<?php echo feedback_h(mn_admin_csrf()); ?>">
									<input type="hidden" name="id" value="<?php echo $id; ?>">
									<button type="submit" class="btn">Mark done</button>
								</form>
							<?php else: ?>
								<form method="post" action="">
									<input type="hidden" name="action" value="reopen">
									<input type="hidden" name="csrf" value="<?php echo feedback_h(mn_admin_csrf()); ?>">
									<input type="hidden" name="id" value="<?php echo $id; ?>">
									<button type="submit" class="btn">Reopen</button>
								</form>
							<?php endif; ?>
							<form method="post" action="" onsubmit="return confirm('Delete this feedback permanently?');">
								<input type="hidden" name="action" value="delete">
								<input type="hidden" name="csrf" value="<?php echo feedback_h(mn_admin_csrf()); ?>">
								<input type="hidden" name="id" value="<?php echo $id; ?>">
								<button type="submit" class="btn danger">Delete</button>
							</form>
							<?php if (!empty($row['email'])): ?>
								<a class="btn" href="mailto:<?php echo feedback_h($row['email']); ?>?subject=<?php echo rawurlencode('Reader feedback · /' . $row['path']); ?>">Reply by email</a>
							<?php endif; ?>
						</div>

						<form class="edit-form" method="post" action="">
							<input type="hidden" name="action" value="edit_feedback">
							<input type="hidden" name="csrf" value="<?php echo feedback_h(mn_admin_csrf()); ?>">
							<input type="hidden" name="id" value="<?php echo $id; ?>">
							<div class="kv"><div class="k">Edit this suggestion</div></div>
							<div class="edit-row">
								<select name="reaction" aria-label="Reaction">
									<?php foreach ($reactions as $key => $r): ?>
										<option value="<?php echo feedback_h($key); ?>"<?php echo $reactionKey === $key ? ' selected' : ''; ?>><?php echo feedback_h($r['icon'] . ' ' . $r['label']); ?></option>
									<?php endforeach; ?>
								</select>
								<input type="email" name="email" value="<?php echo feedback_h($row['email']); ?>" placeholder="Email (optional)" aria-label="Email">
							</div>
							<textarea name="comment" placeholder="Comment" aria-label="Comment"><?php echo feedback_h($row['comment']); ?></textarea>
							<div class="edit-row"><button type="submit" class="btn">Save changes</button><span class="hint">Clear the comment and save to remove it. Use Delete to remove the whole suggestion.</span></div>
						</form>

						<?php if ($full && ($rowStatus === 'accepted' || $rowStatus === 'done')): ?>
						<form class="prompt" method="post" action="">
							<input type="hidden" name="csrf" value="<?php echo feedback_h(mn_admin_csrf()); ?>">
							<input type="hidden" name="id" value="<?php echo $id; ?>">
							<div class="kv"><div class="k">Editor note (feeds the prompt when regenerated)</div></div>
							<textarea name="admin_note" rows="2" placeholder="What should change, in your own words…"><?php echo feedback_h($row['admin_note'] ?? ''); ?></textarea>
							<div class="row">
								<?php if (!empty($full['bug_consent'])): ?><label class="check"><input type="checkbox" name="include_bug" value="1"> Include bug context when regenerating</label><?php endif; ?>
								<button type="submit" class="btn small" name="action" value="regenerate_prompt">Regenerate prompt</button>
							</div>
							<div class="kv"><div class="k">AI prompt (editable)</div></div>
							<textarea name="admin_prompt" rows="16" spellcheck="false"><?php echo feedback_h($promptValue); ?></textarea>
							<div class="row">
								<button type="submit" class="btn primary" name="action" value="save_prompt">Save prompt</button>
								<button type="button" class="btn copy-prompt">Copy prompt</button>
								<span class="hint">Paste this into an agent. The prompt contains the file, lesson, section, selection and the reader's words.</span>
							</div>
						</form>
						<?php elseif ($full): ?>
							<p class="hint">Accept this feedback to prepare an editable AI prompt.</p>
						<?php endif; ?>

						<?php if ($history): ?>
						<details>
							<summary class="btn small" style="display:inline-flex;">History (<?php echo count($history); ?>)</summary>
							<div class="history" style="margin-top:9px;">
								<?php foreach ($history as $h): ?>
									<div class="history-row">
										<span><?php echo feedback_h((new DateTimeImmutable('@' . (int)$h['ts']))->setTimezone(new DateTimeZone('Europe/Berlin'))->format('Y-m-d H:i')); ?></span>
										<b><?php echo feedback_h(feedback_action_label((string)$h['action'])); ?></b>
										<?php if ((string)$h['from_status'] !== '' || (string)$h['to_status'] !== ''): ?><span><?php echo feedback_h($h['from_status']); ?> → <?php echo feedback_h($h['to_status']); ?></span><?php endif; ?>
										<?php if (!empty($h['note'])): ?><span>· <?php echo feedback_h($h['note']); ?></span><?php endif; ?>
									</div>
								<?php endforeach; ?>
							</div>
						</details>
						<?php endif; ?>
					</div>
				</details>
			<?php endforeach; ?>
			</div>

			<?php if ($pageCount > 1): ?>
			<nav class="pager" aria-label="Pages">
				<?php if ($pageNum > 1): ?><a class="btn" href="?<?php echo feedback_h(feedback_query(['page' => $pageNum - 1])); ?>">← Previous</a><?php endif; ?>
				<span class="item-meta">Page <?php echo $pageNum; ?> of <?php echo $pageCount; ?></span>
				<?php if ($pageNum < $pageCount): ?><a class="btn" href="?<?php echo feedback_h(feedback_query(['page' => $pageNum + 1])); ?>">Next →</a><?php endif; ?>
			</nav>
			<?php endif; ?>
		<?php endif; ?>
	<?php endif; ?>
	<?php endif; ?>
<?php endif; ?>
</div>
<script>
(function () {
	var root = document.documentElement;
	var key = "mn_feedback_theme";
	var embed = root.getAttribute("data-embed") === "1";
	if (!embed) {
		try {
			var saved = localStorage.getItem(key);
			if (saved === "light" || saved === "dark") root.setAttribute("data-theme", saved);
		} catch (e) {}
	}
	var btn = document.getElementById("theme-toggle");
	if (btn) {
		if (root.getAttribute("data-theme") === "light") btn.textContent = "Dark";
		btn.addEventListener("click", function () {
			var light = root.getAttribute("data-theme") !== "light";
			root.setAttribute("data-theme", light ? "light" : "dark");
			btn.textContent = light ? "Dark" : "Light";
			try { localStorage.setItem(key, light ? "light" : "dark"); } catch (e) {}
		});
	}
	function revealHashRow() {
		if (!location.hash || !/^#feedback-\d+$/.test(location.hash)) return;
		var el = document.getElementById(location.hash.slice(1));
		if (!el) return;
		if (el.tagName === "DETAILS") el.open = true;
		setTimeout(function () { el.scrollIntoView({ block: "start", behavior: "smooth" }); }, 40);
	}
	revealHashRow();

	document.addEventListener("click", function (event) {
		var btn = event.target.closest && event.target.closest(".copy-prompt");
		if (!btn) return;
		var form = btn.closest("form");
		var area = form ? form.querySelector('textarea[name="admin_prompt"]') : null;
		if (!area) return;
		var text = area.value;
		function done() {
			btn.textContent = "Copied";
			setTimeout(function () { btn.textContent = "Copy prompt"; }, 1600);
		}
		if (navigator.clipboard && navigator.clipboard.writeText) {
			navigator.clipboard.writeText(text).then(done).catch(function () {
				area.focus();
				area.select();
			});
		} else {
			area.focus();
			area.select();
			try { document.execCommand("copy"); done(); } catch (e) {}
		}
	});
})();
</script>
</body>
</html>
