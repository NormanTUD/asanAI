<?php
/* Read-only admin view of logged course-assistant questions and answers.
 *
 * Uses the same mnstats session/password as /stats. The data lives in the
 * optional RAG service's SQLite log; no IP addresses or reader identities are
 * stored. Questions blocked by the safety filter are redacted.
 */
declare(strict_types=1);

define('MN_ANALYTICS_DISABLED', true);
require_once __DIR__ . '/lib/analytics.php';

header('Content-Type: text/html; charset=utf-8');
header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
header('Pragma: no-cache');
header('X-Content-Type-Options: nosniff');
header('X-Frame-Options: DENY');
header('Referrer-Policy: no-referrer');
header('X-Robots-Tag: noindex, nofollow, noarchive');
header("Content-Security-Policy: default-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; base-uri 'none'; form-action 'self'; frame-ancestors 'none'");

mn_admin_session_start();
$authed = mn_admin_is_authed();

function q_h(mixed $value): string {
	return htmlspecialchars((string)$value, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
}

function q_db_path(): string {
	$env = getenv('ASANAI_RAG_QUERIES_DB');
	if (is_string($env) && $env !== '') {
		return $env;
	}
	$file = __DIR__ . '/.rag_queries_db';
	if (is_readable($file)) {
		$path = trim((string)@file_get_contents($file));
		if ($path !== '') {
			return $path;
		}
	}
	return '/var/lib/asanai-rag/queries.sqlite';
}

function q_day(int $ts): string {
	return (new DateTimeImmutable('@' . $ts))->setTimezone(new DateTimeZone('Europe/Berlin'))->format('Y-m-d H:i');
}

function q_query(array $overrides = []): string {
	$keys = ['range', 'q', 'grounded', 'lang', 'page'];
	$out = [];
	foreach ($keys as $key) {
		$value = array_key_exists($key, $overrides) ? $overrides[$key] : ($_GET[$key] ?? null);
		if (!is_scalar($value)) {
			continue;
		}
		$value = (string)$value;
		if ($value === '' || ($key === 'page' && (int)$value <= 1)) {
			continue;
		}
		$out[$key] = $value;
	}
	return http_build_query($out);
}

$rangeRaw = $_GET['range'] ?? 30;
$range = is_scalar($rangeRaw) ? (int)$rangeRaw : 30;
if (!in_array($range, [7, 30, 90, 365, 0], true)) {
	$range = 30;
}
$searchRaw = $_GET['q'] ?? '';
$search = is_scalar($searchRaw) ? mb_substr(trim((string)$searchRaw), 0, 160) : '';
$groundedRaw = $_GET['grounded'] ?? '';
$grounded = is_scalar($groundedRaw) ? (string)$groundedRaw : '';
if (!in_array($grounded, ['', 'yes', 'no'], true)) {
	$grounded = '';
}
$langRaw = $_GET['lang'] ?? '';
$lang = is_scalar($langRaw) ? mb_substr(trim((string)$langRaw), 0, 8) : '';
$pageRaw = $_GET['page'] ?? 1;
$page = is_scalar($pageRaw) ? max(1, (int)$pageRaw) : 1;
$perPage = 50;

$dbPath = q_db_path();
$pdo = null;
$dbError = '';
$rows = [];
$total = 0;
$hasTable = false;
if (is_file($dbPath)) {
	try {
		$pdo = new PDO('sqlite:' . $dbPath, null, null, [
			PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
			PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
		]);
		$pdo->exec('PRAGMA query_only = ON');
		$hasTable = (bool)$pdo->query("SELECT 1 FROM sqlite_master WHERE type='table' AND name='rag_queries'")->fetchColumn();
	} catch (Throwable $e) {
		$dbError = 'The question log could not be opened.';
	}
}

if ($pdo && $hasTable) {
	$where = [];
	$params = [];
	if ($range > 0) {
		$where[] = 'ts >= ?';
		$params[] = time() - $range * 86400;
	}
	if ($search !== '') {
		$where[] = '(question LIKE ? OR answer LIKE ? OR query_en LIKE ?)';
		$like = '%' . $search . '%';
		array_push($params, $like, $like, $like);
	}
	if ($grounded !== '') {
		$where[] = 'grounded = ?';
		$params[] = $grounded === 'yes' ? 1 : 0;
	}
	if ($lang !== '') {
		$where[] = 'lang = ?';
		$params[] = strtolower($lang);
	}
	$sqlWhere = $where ? ' WHERE ' . implode(' AND ', $where) : '';
	try {
		$countStmt = $pdo->prepare('SELECT COUNT(*) FROM rag_queries' . $sqlWhere);
		$countStmt->execute($params);
		$total = (int)$countStmt->fetchColumn();
		$stmt = $pdo->prepare(
			'SELECT id, ts, question, answer, lang, grounded, cached, semantic, model, '
			. 'query_en, sources, queue_seconds, generation_seconds, error '
			. 'FROM rag_queries' . $sqlWhere . ' ORDER BY ts DESC LIMIT ' . $perPage
			. ' OFFSET ' . (($page - 1) * $perPage)
		);
		$stmt->execute($params);
		$rows = $stmt->fetchAll();
	} catch (Throwable $e) {
		$dbError = 'The question log could not be read.';
	}
}

$pages = max(1, (int)ceil($total / $perPage));
?>
<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Course questions · asanAI</title>
<style>
:root{--bg:#0b1120;--panel:#111c2e;--line:#26364d;--text:#dbe4f0;--muted:#8fa3bd;--accent:#93a4ff;--emerald:#34d399;--rose:#fb7185;--amber:#fbbf24}
*{box-sizing:border-box}
body{margin:0;background:var(--bg);color:var(--text);font:15px/1.5 system-ui,-apple-system,"Segoe UI",sans-serif}
a{color:var(--accent);text-decoration:none}
a:hover{text-decoration:underline}
header{position:sticky;top:0;z-index:2;background:rgba(11,17,32,.94);border-bottom:1px solid var(--line);backdrop-filter:blur(8px)}
.bar{max-width:1120px;margin:0 auto;padding:12px 18px;display:flex;gap:18px;align-items:center;flex-wrap:wrap}
.brand{font-weight:800;color:var(--text);letter-spacing:-.02em}
.nav{display:flex;gap:14px;font-size:14px;color:var(--muted);margin-left:auto;flex-wrap:wrap}
.nav a.active{color:var(--text);font-weight:700}
main{max-width:1120px;margin:0 auto;padding:24px 18px 60px}
h1{font-size:26px;margin:0 0 4px;letter-spacing:-.03em}
.sub{color:var(--muted);margin:0 0 18px;font-size:14px}
.filters{display:flex;gap:10px;flex-wrap:wrap;align-items:end;background:var(--panel);border:1px solid var(--line);border-radius:14px;padding:14px;margin-bottom:18px}
label{display:grid;gap:4px;font-size:11px;text-transform:uppercase;letter-spacing:.08em;color:var(--muted)}
input,select,button{font:inherit;color:var(--text);background:#0e1728;border:1px solid var(--line);border-radius:9px;padding:8px 10px}
button{background:var(--accent);color:#101425;font-weight:800;cursor:pointer;border:0;padding:9px 16px}
.count{color:var(--muted);font-size:13px;margin:0 0 12px}
.card{background:var(--panel);border:1px solid var(--line);border-radius:14px;padding:16px 18px;margin-bottom:12px}
.q{font-weight:700;font-size:15px;white-space:pre-wrap;word-break:break-word;margin:0 0 8px}
.a{white-space:pre-wrap;word-break:break-word;color:#c9d5e6;margin:0}
.meta{display:flex;gap:8px;flex-wrap:wrap;align-items:center;color:var(--muted);font-size:12px;margin-top:10px}
.tag{display:inline-flex;align-items:center;border:1px solid var(--line);border-radius:999px;padding:1px 8px;font-size:11px;font-weight:700}
.ok{color:var(--emerald);border-color:rgba(52,211,153,.35);background:rgba(52,211,153,.08)}
.warn{color:var(--amber);border-color:rgba(251,191,36,.35);background:rgba(251,191,36,.08)}
.bad{color:var(--rose);border-color:rgba(251,113,133,.35);background:rgba(251,113,133,.08)}
.sources{margin:8px 0 0;padding-left:18px;font-size:12px;color:var(--muted)}
.sources a{color:var(--accent)}
.empty{padding:40px 18px;text-align:center;color:var(--muted);border:1px dashed var(--line);border-radius:14px}
.pager{display:flex;gap:10px;align-items:center;justify-content:center;margin-top:18px;color:var(--muted);font-size:13px}
.login{max-width:520px;margin:12vh auto;background:var(--panel);border:1px solid var(--line);border-radius:16px;padding:26px}
.login h1{font-size:22px}
</style>
</head>
<body>
<header><div class="bar">
	<a class="brand" href="stats">asanAI · admin</a>
	<nav class="nav">
		<a href="stats?view=analytics">Analytics</a>
		<a href="stats?view=feedback">Reader feedback</a>
		<a class="active" href="questions">Course questions</a>
	</nav>
</div></header>
<main>
<?php if (!$authed): ?>
	<div class="login">
		<h1>Course questions</h1>
		<p class="sub">Sign in through the analytics dashboard first. The same administrator session is used here.</p>
		<p><a href="stats">Go to sign in →</a></p>
	</div>
<?php else: ?>
	<h1>Course questions</h1>
	<p class="sub">What readers ask the local course assistant, and what it answered. No IP addresses or identities are stored; blocked requests are redacted.</p>

	<form class="filters" method="get" action="questions">
		<label>Range
			<select name="range">
				<?php foreach ([7 => '7 days', 30 => '30 days', 90 => '90 days', 365 => '1 year', 0 => 'All'] as $value => $label): ?>
					<option value="<?php echo $value; ?>"<?php echo $range === $value ? ' selected' : ''; ?>><?php echo q_h($label); ?></option>
				<?php endforeach; ?>
			</select>
		</label>
		<label>Search
			<input type="search" name="q" value="<?php echo q_h($search); ?>" placeholder="question or answer…">
		</label>
		<label>Grounded
			<select name="grounded">
				<option value=""<?php echo $grounded === '' ? ' selected' : ''; ?>>All</option>
				<option value="yes"<?php echo $grounded === 'yes' ? ' selected' : ''; ?>>Grounded</option>
				<option value="no"<?php echo $grounded === 'no' ? ' selected' : ''; ?>>Not grounded</option>
			</select>
		</label>
		<label>Language
			<input type="text" name="lang" value="<?php echo q_h($lang); ?>" placeholder="de, en…" size="4">
		</label>
		<button type="submit">Filter</button>
		<a href="questions" class="sub" style="margin-left:4px">Reset</a>
	</form>

	<?php if ($dbError !== ''): ?>
		<div class="empty"><?php echo q_h($dbError); ?><br>Expected log: <code><?php echo q_h($dbPath); ?></code></div>
	<?php elseif (!$hasTable): ?>
		<div class="empty">No question log yet. It is created by the optional answer service (<code><?php echo q_h($dbPath); ?></code>).</div>
	<?php elseif ($total === 0): ?>
		<div class="empty">No questions match these filters.</div>
	<?php else: ?>
		<p class="count"><?php echo (int)$total; ?> question<?php echo $total === 1 ? '' : 's'; ?> · page <?php echo $page; ?> of <?php echo $pages; ?></p>
		<?php foreach ($rows as $row): ?>
			<?php
			$sources = json_decode((string)($row['sources'] ?? '[]'), true);
			if (!is_array($sources)) { $sources = []; }
			$blocked = (string)($row['error'] ?? '') === 'blocked';
			?>
			<article class="card">
				<p class="q"><?php echo q_h($row['question']); ?></p>
				<p class="a"><?php echo q_h($row['answer']); ?></p>
				<?php if (!empty($row['query_en']) && (string)$row['query_en'] !== (string)$row['question']): ?>
					<div class="meta"><span>English query: <?php echo q_h($row['query_en']); ?></span></div>
				<?php endif; ?>
				<?php if ($sources): ?>
					<ul class="sources">
						<?php foreach ($sources as $source): ?>
							<?php if (!is_array($source)) { continue; } ?>
							<li><a href="<?php echo q_h($source['url'] ?? ''); ?>"><?php echo q_h($source['title'] ?? ($source['url'] ?? '')); ?><?php echo !empty($source['heading']) ? ' — ' . q_h($source['heading']) : ''; ?></a></li>
						<?php endforeach; ?>
					</ul>
				<?php endif; ?>
				<div class="meta">
					<span><?php echo q_h(q_day((int)$row['ts'])); ?></span>
					<span class="tag <?php echo (int)$row['grounded'] ? 'ok' : 'bad'; ?>"><?php echo (int)$row['grounded'] ? 'grounded' : 'not grounded'; ?></span>
					<?php if ((int)$row['cached']): ?><span class="tag warn">cached<?php echo (int)$row['semantic'] ? ' · semantic' : ''; ?></span><?php endif; ?>
					<?php if ($blocked): ?><span class="tag bad">blocked</span><?php endif; ?>
					<?php if (!empty($row['lang'])): ?><span class="tag"><?php echo q_h($row['lang']); ?></span><?php endif; ?>
					<?php if (!empty($row['model'])): ?><span><?php echo q_h($row['model']); ?></span><?php endif; ?>
					<?php if ((float)$row['queue_seconds'] > 0): ?><span>queue <?php echo number_format((float)$row['queue_seconds'], 1); ?>s</span><?php endif; ?>
					<?php if ((float)$row['generation_seconds'] > 0): ?><span>generation <?php echo number_format((float)$row['generation_seconds'], 1); ?>s</span><?php endif; ?>
				</div>
			</article>
		<?php endforeach; ?>
		<?php if ($pages > 1): ?>
			<div class="pager">
				<?php if ($page > 1): ?><a href="questions?<?php echo q_h(q_query(['page' => $page - 1])); ?>">← Newer</a><?php endif; ?>
				<span>Page <?php echo $page; ?> / <?php echo $pages; ?></span>
				<?php if ($page < $pages): ?><a href="questions?<?php echo q_h(q_query(['page' => $page + 1])); ?>">Older →</a><?php endif; ?>
			</div>
		<?php endif; ?>
	<?php endif; ?>
<?php endif; ?>
</main>
</body>
</html>
