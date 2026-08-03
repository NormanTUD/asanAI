<?php
/* PHP test suite for the search engine (search_lib.php).
 * Run with:  php tests/search_test.php
 */

error_reporting(E_ALL);
ini_set('display_errors', '1');

require_once __DIR__ . '/../search_lib.php';

$GLOBALS['pass'] = 0;
$GLOBALS['fail'] = 0;
$GLOBALS['failures'] = [];

function check($cond, $msg) {
	if ($cond) {
		$GLOBALS['pass']++;
	} else {
		$GLOBALS['fail']++;
		$GLOBALS['failures'][] = $msg;
		echo "  FAIL: $msg\n";
	}
}

/* ---------- fixture ---------- */

$fixtureDir = sys_get_temp_dir() . '/asanai_search_test_' . getmypid();
mkdir($fixtureDir, 0777, true);

function fixtureFile($dir, $name, $content) {
	file_put_contents($dir . '/' . $name, $content);
}

fixtureFile($fixtureDir, 'math_i.php', <<<'PHP'
<?php include_once("functions.php");
<!--
COURSE_METADATA:
title: Mathematics I: Foundations
-->
<h1>Calculus and Linear Algebra</h1>
<p>This page introduces the derivative and the gradient descent algorithm used to train neural networks. It covers differentiation of polynomials and the chain rule.</p>
<div class="md">
## Backpropagation Intuition
The backpropagation algorithm computes gradients efficiently via the chain rule.

Multi-head attention is central to modern transformers.
</div>
<div class="md" data-headline="Special Optional Topic">
Some optional deeper material about \cite{key}. With math $\frac{a}{b}$ and $\sqrt{x}$.
</div>
<figure>
  <img src="img.jpg" alt="Graph of gradient descent">
  <figcaption>Figure: Gradient descent on a convex function.</figcaption>
</figure>
PHP);

fixtureFile($fixtureDir, 'attention.php', <<<'PHP'
<?php include_once("functions.php");
<!--
COURSE_METADATA:
title: Attention Mechanism
-->
<h1>Attention Mechanisms</h1>
<p>Self-attention computes weighted sums. Multi-head attention uses several heads.</p>
<h2>Version 2</h2>
PHP);

fixtureFile($fixtureDir, 'math_ii.php', <<<'PHP'
<?php include_once("functions.php");
<!--
COURSE_METADATA:
title: Mathematics II: More
-->
<h1>Calculus II</h1>
<p>Integration techniques and Taylor series in 2024. Die Ableitung von "äquivalent" Funktionen und die π-Konstante.</p>
PHP);

fixtureFile($fixtureDir, 'zz_secret.php', <<<'PHP'
<?php include_once("functions.php");
<h1>Secret Page</h1>
<p>secrettermxyz appears only here and nowhere else.</p>
PHP);

fixtureFile($fixtureDir, 'literature.js', <<<'JS'
var literature = {
  "key": {title: "Sketch of the Analytical Engine", author: "Ada Lovelace", year: 1843, url: "http://example.com"},
};
JS);

/* ---------- helpers ---------- */

function q($query, $exclude = null) {
	if ($exclude === null) $exclude = ['index.php', 'zz_secret.php'];
	return runSearch($query, $GLOBALS['fixtureDir'], $exclude, false);
}
$GLOBALS['fixtureDir'] = $fixtureDir;

function groupedPages($data) {
	return array_map(fn($g) => $g['page'], $data['grouped']);
}
function pagesHave($data, $page) {
	return in_array($page, groupedPages($data), true);
}

/* ---------- unit tests: text helpers ---------- */

check(searchNormalize('Äquivalent') === 'aquivalent', 'searchNormalize folds umlauts');
check(searchNormalize('Multi-head Attention') === 'multi head attention', 'searchNormalize splits hyphenated words');
check(foldDiacritics('αβγ') === 'alphabetagamma', 'foldDiacritics maps greek letters');
check(slugify('Multi-Head Attention') === 'multihead-attention', 'slugify works');
check(searchNormalize("He said \xE2\x80\x9Chello\xE2\x80\x9D") === 'he said hello', 'smart quotes are stripped');

/* ---------- unit tests: regex compilation ---------- */

$re = buildRegex('a/b');
check(preg_match($re, 'x a/b y') === 1, 'buildRegex with unescaped slash compiles and matches');
check(preg_match($re, 'x ay y') === 0, 'buildRegex slash pattern does not overmatch');

$re2 = buildRegex('multi-head');
check(preg_match($re2, 'Multi-Head Attention') === 1, 'buildRegex is case-insensitive');

$re3 = buildRegex('[a-');
check($re3 === false || @preg_match($re3, '') === false, 'buildRegex rejects invalid pattern');

$re4 = buildRegex('\\d+');
check(preg_match($re4, 'in 2024') === 1, 'buildRegex handles \\d+');

/* ---------- unit tests: mode detection ---------- */

$m = detectSearchMode('/foo/');
check($m['mode'] === 'regex' && $m['query'] === 'foo', 'detectSearchMode: /foo/ is regex');
$m = detectSearchMode('/a/b/');
check($m['mode'] === 'regex' && $m['query'] === 'a/b', 'detectSearchMode: /a/b/ pattern a/b');
$m = detectSearchMode('//');
check(isset($m['error']), 'detectSearchMode: empty pattern rejected');
$m = detectSearchMode('~attension');
check($m['mode'] === 'fuzzy' && $m['query'] === 'attension', 'detectSearchMode: ~term is fuzzy');
$m = detectSearchMode('~a');
check(isset($m['error']), 'detectSearchMode: too-short fuzzy rejected');
$m = detectSearchMode('attention');
check($m['mode'] === 'normal', 'detectSearchMode: default is normal');

/* ---------- snippet robustness (regression for mb_strpos crash) ---------- */

check(makeSnippet('This is a block ending with Attention', 'attention', 'normal', 32) !== '', 'makeSnippet does not crash when match is at the very end');
check(makeSnippet('Attention', 'attention', 'normal', 0) !== '', 'makeSnippet handles tiny block');

/* ---------- end-to-end: normal mode ---------- */

$d = q('attention');
check(pagesHave($d, 'attention'), 'attention: matches attention.php page');
check(pagesHave($d, 'math_i'), 'attention: matches math_i page');
check(($d['grouped'][0]['page'] ?? '') === 'attention', 'attention: heading result ranks first');

$d = q('backpropagation');
check(pagesHave($d, 'math_i'), 'backpropagation: matches math_i');
check(($d['grouped'][0]['title'] ?? '') === 'Backpropagation Intuition', 'backpropagation: best block is the heading');
check($d['grouped'][0]['url'] === 'math_i#backpropagation-intuition', 'backpropagation: url uses heading slug');

$d = q('chain rule');
check(pagesHave($d, 'math_i'), 'chain rule: multi-word phrase within one block matches');

$d = q('derivative attention');
check(pagesHave($d, 'math_i'), 'derivative attention: multi-word across blocks on same page matches');
check(count($d['grouped']) === 1, 'derivative attention: only math_i qualifies');
check($d['grouped'][0]['count'] === 2, 'derivative attention: two blocks matched on the page');

$d = q('backpropagation self-attention');
check(count($d['grouped']) === 0, 'multi-word across different pages yields nothing');

$d = q('gradient');
check(($d['grouped'][0]['page'] ?? '') === 'math_i', 'gradient: grouped by page');
check(($d['grouped'][0]['count'] ?? 0) === 3, 'gradient: paragraph + md + caption all match');
check(($d['grouped'][0]['type'] ?? '') === 'caption', 'gradient: caption ranks above content');
check(($d['grouped'][0]['img'] ?? '') === 'img.jpg', 'gradient: caption carries image url');
check(($d['results'][0]['pageTitle'] ?? '') === 'Mathematics I: Foundations', 'gradient: results carry pageTitle for display grouping');
check(count($d['results']) === 3, 'gradient: all three matching blocks appear in results');

$d = q('calculus');
check(count($d['grouped']) >= 2, 'calculus: matches both math pages');

/* ---------- end-to-end: diacritics ---------- */

$d = q('aquivalent');
check(pagesHave($d, 'math_ii'), 'aquivalent (folded) matches äquivalent text');
$d = q('äquivalent');
check(pagesHave($d, 'math_ii'), 'äquivalent matches itself');
$d = q('pi konstant');
check(pagesHave($d, 'math_ii'), 'greek pi folds to "pi"');

/* ---------- end-to-end: regex mode ---------- */

$d = q('/attention/');
check($d['mode'] === 'regex', 'regex: mode is regex');
check(pagesHave($d, 'attention'), 'regex /attention/ matches');
check(pagesHave($d, 'math_i'), 'regex /attention/ matches math_i too');

$d = q('/Multi-Head/');
check(pagesHave($d, 'attention'), 'regex /Multi-Head/ is case-insensitive');

$d = q('/transformers\.$/');
check(pagesHave($d, 'math_i'), 'regex /transformers\\.$/ matches at end of block');

$d = q('/a\/b/');
check(pagesHave($d, 'math_i'), 'regex /a\\/b/ matches "a/b" text');
$d = q('/a/b/');
check(pagesHave($d, 'math_i'), 'regex /a/b/ (unescaped) matches "a/b" text');

$d = q('/\d+/');
check(pagesHave($d, 'math_ii'), 'regex /\d+/ finds digits without crashing');

$d = q('/Konstante\.$/');
check(pagesHave($d, 'math_ii'), 'regex /Konstante\\.$/ matches at end of paragraph');

$d = q('/2$/');
check(pagesHave($d, 'attention'), 'regex /2$/ matches the "Version 2" heading without crashing');

$d = q('/[a-/');
check(isset($d['error']), 'regex invalid pattern returns error');
check(count($d['grouped']) === 0, 'regex invalid pattern returns no results');

$d = q('//');
check(isset($d['error']), 'regex empty pattern returns error');

/* ---------- end-to-end: fuzzy mode ---------- */

$d = q('~attension');
check($d['mode'] === 'fuzzy', 'fuzzy: mode is fuzzy');
check(pagesHave($d, 'attention'), 'fuzzy ~attension matches attention');
check(pagesHave($d, 'math_i'), 'fuzzy ~attension matches math_i too');

$d = q('~attent');
check(pagesHave($d, 'attention'), 'fuzzy ~attent matches by prefix');

$d = q('~zzqplx');
check(count($d['grouped']) === 0, 'fuzzy ~zzqplx does not match everything');

$d = q('~backpropagation');
check(pagesHave($d, 'math_i'), 'fuzzy ~backpropagation matches backpropagation');

/* ---------- citations / literature ---------- */

$d = q('lovelace');
check(pagesHave($d, 'math_i'), 'citation author is searchable');
check(($d['grouped'][0]['page'] ?? '') === 'math_i', 'citation author found in math_i');

/* ---------- exclusion / limits ---------- */

$d = q('secrettermxyz');
check(count($d['grouped']) === 0, 'excluded file is not searched by default');

$d = q('secrettermxyz', ['index.php']);
check(pagesHave($d, 'zz_secret'), 'non-excluded file is searched');

$d = q('x');
check(count($d['grouped']) === 0, 'single character query returns nothing');
$d = q('');
check(count($d['grouped']) === 0, 'empty query returns nothing');

$d = q('C++');
check(count($d['grouped']) === 0, 'punctuation-only query normalizes away and returns nothing');

/* ---------- cache: built once and invalidated on change ---------- */

$cacheDir = $fixtureDir . '/cachepage';
mkdir($cacheDir, 0777, true);
fixtureFile($cacheDir, 'cache.php', "<h1>Cache Test</h1><p>termalpha appears here in this long enough paragraph about search caching.</p>");
$excl = ['index.php', 'zz_secret.php'];

$p1 = buildIndex($cacheDir, $excl, true);
check(count($p1['cache']['blocks'] ?? []) > 0, 'cache: index built on first run');

$p2 = buildIndex($cacheDir, $excl, true);
check($p1 === $p2, 'cache: second build is identical (no rebuild)');

usleep(1100000); /* ensure a distinct mtime for cache invalidation */
fixtureFile($cacheDir, 'cache.php', "<h1>Cache Test</h1><p>termbeta appears here in this long enough paragraph about search caching.</p>");
$p3 = buildIndex($cacheDir, $excl, true);
check($p1 !== $p3, 'cache: index rebuilt when file changes');

$d = runSearch('termbeta', $cacheDir, $excl, true);
check(pagesHave($d, 'cache'), 'cache: fresh content is searchable after change');

/* ---------- summary ---------- */

unlink($fixtureDir . '/math_i.php');
unlink($fixtureDir . '/attention.php');
unlink($fixtureDir . '/math_ii.php');
unlink($fixtureDir . '/zz_secret.php');
unlink($fixtureDir . '/literature.js');
unlink($cacheDir . '/cache.php');
unlink($cacheDir . '/.search_cache.json');
rmdir($cacheDir);
rmdir($fixtureDir);

echo "\n" . $GLOBALS['pass'] . ' passed, ' . $GLOBALS['fail'] . ' failed' . "\n";
if ($GLOBALS['fail'] > 0) {
	exit(1);
}
