<?php
header('Content-Type: application/json; charset=utf-8');
header('X-Robots-Tag: noindex');

$q = isset($_GET['q']) ? trim($_GET['q']) : '';
if (strlen($q) < 2) {
	echo json_encode(['results' => [], 'total' => 0, 'query' => $q]);
	exit;
}

$mode = 'normal';
$rawQ = $q;

if (preg_match('/^\/.+\/$/u', $q)) {
	$mode = 'regex';
	$q = substr($q, 1, -1);
	if (@preg_match('/' . $q . '/u', '') === false) {
		echo json_encode(['results' => [], 'total' => 0, 'query' => $rawQ, 'mode' => $mode, 'error' => 'Invalid regex pattern']);
		exit;
	}
} elseif (mb_substr($q, 0, 1) === '~') {
	$mode = 'fuzzy';
	$q = mb_substr($q, 1);
	if (strlen($q) < 2) {
		echo json_encode(['results' => [], 'total' => 0, 'query' => $rawQ]);
		exit;
	}
}

$bibData = [];
$litFile = __DIR__ . '/literature.js';
if (file_exists($litFile)) {
	$litContent = file_get_contents($litFile);
	preg_match_all('/"([^"]+)"\s*:\s*\{([^}]+)\}/s', $litContent, $matches, PREG_SET_ORDER);
	foreach ($matches as $m) {
		$id = $m[1];
		$body = $m[2];
		$bibData[$id] = [
			'title'  => preg_match('/title\s*:\s*"([^"]+)"/', $body, $t) ? $t[1] : '',
			'author' => preg_match('/author\s*:\s*"([^"]+)"/', $body, $a) ? $a[1] : '',
			'year'   => preg_match('/year\s*:\s*"?(\d{4}|c\.\s\d+\sBCE)"?/', $body, $y) ? $y[1] : '',
			'url'    => preg_match('/url\s*:\s*"([^"]+)"/', $body, $u) ? $u[1] : '',
		];
	}
}

function cleanMath($text) {
	$text = preg_replace('/\$\$[^\$]*\$\$/', '', $text);
	$text = preg_replace('/\$([^\$]*)\$/', '$1', $text);
	return $text;
}

function resolveCitations($text, $bibData) {
	$text = preg_replace_callback('/\\\\(footcite|cite|citeauthor|citeauthorlastnameand|citetitle|citeyear|citealternativetitle|citeurl)(?:\[([^\]]*)\])?\{([^}]+)\}/', function($m) use ($bibData) {
		$type = $m[1];
		$manual = isset($m[2]) && $m[2] !== '' ? $m[2] : null;
		$key = $m[3];
		$entry = isset($bibData[$key]) ? $bibData[$key] : null;

		if (!$entry) return '[' . $key . ']';
		if ($manual) return $manual;

		switch ($type) {
			case 'citeauthor': return $entry['author'];
			case 'citeauthorlastnameand':
				$authors = preg_split('/, | and /', $entry['author']);
				$lastNames = array_map(function($n) { return trim(explode(' ', trim($n))[0]); }, $authors);
				if (count($lastNames) === 1) return $lastNames[0];
				if (count($lastNames) === 2) return implode(' and ', $lastNames);
				$last = array_pop($lastNames);
				return implode(', ', $lastNames) . ' and ' . $last;
			case 'citetitle': return $entry['title'];
			case 'citealternativetitle': return !empty($entry['alternativetitle']) ? $entry['alternativetitle'] : $entry['title'];
			case 'citeyear': return $entry['year'];
			case 'citeurl': return $entry['title'];
			case 'footcite': return $entry['author'] . ($entry['year'] ? ', ' . $entry['year'] : '');
			default: return $entry['author'] . ($entry['year'] ? ', ' . $entry['year'] : '');
		}
	}, $text);

	$text = preg_replace('/\\\\label\{([^}]+)\}/', '$1', $text);
	$text = preg_replace('/\\\\index\{([^}]+)\}/', '$1', $text);
	$text = preg_replace('/\\\\[a-zA-Z]+/', '', $text);
	return $text;
}

function cleanText($text, $bibData) {
	$text = cleanMath($text);
	$text = resolveCitations($text, $bibData);
	$text = preg_replace('/\s+/', ' ', $text);
	return trim($text);
}

$files = glob('*.php');
$exclude = ['index.php', 'index_full.php', 'functions.php', 'search.php', 'asanai_blog_proxy.php', 'graph.php', 'literature.php'];
$results = [];

foreach ($files as $file) {
	$name = basename($file, '.php');
	if (in_array($file, $exclude) || in_array($name, $exclude)) continue;

	$content = file_get_contents($file);

	$pageTitle = $name;
	if (preg_match('/COURSE_METADATA:\s*\n(?:.*\n)*?title:\s*(.+)\s*$/m', $content, $m)) {
		$pageTitle = trim($m[1]);
	}

	$html = preg_replace('/<\?php.*?\?>/s', '', $content);
	$html = preg_replace('/<script[^>]*>.*?<\/script>/is', '', $html);
	$html = preg_replace('/<style[^>]*>.*?<\/style>/is', '', $html);

	$blocks = [];

	preg_match_all('/<h([1-6])([^>]*)>(.*?)<\/h\1>/i', $html, $hms, PREG_SET_ORDER | PREG_OFFSET_CAPTURE);
	foreach ($hms as $hm) {
		$pos = $hm[0][1];
		$level = (int)$hm[1][0];
		$text = cleanText(strip_tags($hm[3][0]), $bibData);
		if ($text === '') continue;
		$slug = slugify($text);
		$blocks[] = ['type' => 'heading', 'level' => $level, 'text' => $text, 'slug' => $slug, 'pos' => $pos];
	}

	preg_match_all('/<(p|li|blockquote|td|th|figcaption)[^>]*>(.*?)<\/\1>/is', $html, $pms, PREG_SET_ORDER | PREG_OFFSET_CAPTURE);
	foreach ($pms as $pm) {
		$pos = $pm[0][1];
		$text = cleanText(strip_tags($pm[2][0]), $bibData);
		if (strlen($text) < 40) continue;
		$blocks[] = ['type' => 'text', 'text' => $text, 'pos' => $pos];
	}

	preg_match_all('/<div[^>]*class="[^"]*\bmd\b[^"]*"[^>]*>(.*?)<\/div>/is', $html, $mdms, PREG_SET_ORDER | PREG_OFFSET_CAPTURE);
	foreach ($mdms as $mdm) {
		$mdPos = $mdm[0][1];
		$raw = $mdm[1][0];

		preg_match_all('/^#{1,6}\s+(.+)$/m', $raw, $mdHeadings, PREG_SET_ORDER);
		foreach ($mdHeadings as $mh) {
			$level = strlen(trim($mh[0][0])[0]);
			$text = cleanText($mh[1][0], $bibData);
			$text = preg_replace('/\[([^\]]*)\]\([^)]*\)/', '$1', $text);
			$text = preg_replace('/[*_]{1,3}([^*_]+)[*_]{1,3}/', '$1', $text);
			$text = resolveCitations($text, $bibData);
			$text = preg_replace('/\s+/', ' ', $text);
			if ($text === '' || mb_strlen($text) < 3) continue;
			$slug = slugify($text);
			$blocks[] = ['type' => 'heading', 'level' => $level, 'text' => $text, 'slug' => $slug, 'pos' => $mdPos];
		}

		$raw = preg_replace('/^#{1,6}\s+/m', '', $raw);
		$raw = preg_replace('/\[([^\]]*)\]\([^)]*\)/', '$1', $raw);
		$raw = preg_replace('/[*_]{1,3}([^*_]+)[*_]{1,3}/', '$1', $raw);
		$raw = preg_replace('/```[\s\S]*?```/', '', $raw);
		$raw = preg_replace('/`([^`]+)`/', '$1', $raw);
		$raw = preg_replace('/~~(.*?)~~/', '$1', $raw);
		$raw = preg_replace('/^\s*[-*+]\s+/m', '', $raw);
		$raw = preg_replace('/^\s*\d+\.\s+/m', '', $raw);
		$raw = preg_replace('/\|.*?\|/', '', $raw);
		$text = cleanText(strip_tags($raw), $bibData);
		$paras = preg_split('/\n\s*\n/', $text);
		foreach ($paras as $p) {
			$p = trim(preg_replace('/\s+/', ' ', $p));
			if (strlen($p) > 50) {
				$blocks[] = ['type' => 'text', 'text' => $p, 'pos' => $mdPos];
			}
		}
	}

	$seenCaptions = [];
	preg_match_all('/<figure[^>]*>(.*?)<\/figure>/is', $html, $figs, PREG_SET_ORDER | PREG_OFFSET_CAPTURE);
	foreach ($figs as $fig) {
		$figPos = $fig[0][1];
		$figHtml = $fig[1][0];
		$imgUrl = '';
		if (preg_match('/<img[^>]*src="([^"]+)"/i', $figHtml, $img)) {
			$imgUrl = $img[1];
		}

		$captionText = '';
		if (preg_match('/<figcaption[^>]*>(.*?)<\/figcaption>/is', $figHtml, $cap)) {
			$captionText = cleanText(strip_tags($cap[1]), $bibData);
		}

		if (strlen($captionText) > 15) {
			$norm = mb_strtolower(trim($captionText));
			if (!isset($seenCaptions[$norm])) {
				$seenCaptions[$norm] = true;
				$blocks[] = ['type' => 'caption', 'text' => $captionText, 'pos' => $figPos, 'img' => $imgUrl];
			}
		} elseif (preg_match('/<img[^>]*alt="([^"]*)"/i', $figHtml, $alt)) {
			$altText = cleanText($alt[1], $bibData);
			if (strlen($altText) > 10) {
				$norm = mb_strtolower(trim($altText));
				if (!isset($seenCaptions[$norm])) {
					$seenCaptions[$norm] = true;
					$blocks[] = ['type' => 'caption', 'text' => $altText, 'pos' => $figPos, 'img' => $imgUrl];
				}
			}
		}
	}

	usort($blocks, fn($a, $b) => ($a['pos'] ?? 0) <=> ($b['pos'] ?? 0));

	$lowerQ = mb_strtolower($q);

	foreach ($blocks as $b) {
		$text = $b['text'];
		$lowerText = mb_strtolower($text);
		$matches = false;

		if ($mode === 'regex') {
			$matches = preg_match('/' . $q . '/ui', $text);
		} elseif ($mode === 'fuzzy') {
			$matches = fuzzyMatch($lowerText, mb_strtolower($q));
		} else {
			$matches = (mb_strpos($lowerText, $lowerQ) !== false);
		}

		if (!$matches) continue;

		$snippet = makeSnippet($text, $q, $mode);
		$score = 0;

		if ($b['type'] === 'heading') {
			$exact = $matches ? 50 : 0;
			$levelBonus = (6 - $b['level']) * 15;
			$score = 200 + $exact + $levelBonus;
			$results[] = [
				'page' => $name,
				'type' => 'heading',
				'mode' => $mode,
				'title' => $b['text'],
				'snippet' => $snippet,
				'url' => $name . '#' . $b['slug'],
				'score' => $score,
			];
		} elseif ($b['type'] === 'caption') {
			$score = 150 + substr_count($lowerText, mb_strtolower($q)) * 10;
			$heading = findNearestHeading($blocks, $b);
			$imgUrl = $b['img'] ?? '';
			$results[] = [
				'page' => $name,
				'type' => 'caption',
				'mode' => $mode,
				'title' => '🖼 ' . ($heading ? $heading['text'] : $pageTitle),
				'snippet' => $snippet,
				'url' => $name . ($heading ? '#' . $heading['slug'] : ''),
				'score' => $score,
				'img' => $imgUrl,
			];
		} else {
			$score = 50 + substr_count($lowerText, mb_strtolower($q)) * 5;
			$heading = findNearestHeading($blocks, $b);
			$results[] = [
				'page' => $name,
				'type' => 'content',
				'mode' => $mode,
				'title' => $heading ? $heading['text'] : $pageTitle,
				'snippet' => $snippet,
				'url' => $name . ($heading ? '#' . $heading['slug'] : ''),
				'score' => $score,
			];
		}
	}
}

usort($results, fn($a, $b) => $b['score'] <=> $a['score']);

$grouped = [];
foreach ($results as $r) {
	$page = $r['page'];
	if (!isset($grouped[$page])) {
		$grouped[$page] = $r;
		$grouped[$page]['count'] = 1;
	} else {
		$grouped[$page]['count']++;
		if ($r['score'] > $grouped[$page]['score']) {
			$grouped[$page]['snippet'] = $r['snippet'];
			$grouped[$page]['type'] = $r['type'];
			if (isset($r['img'])) $grouped[$page]['img'] = $r['img'];
			$grouped[$page]['url'] = $r['url'];
		}
	}
}

$results = array_slice($results, 0, 50);
$grouped = array_values($grouped);
usort($grouped, fn($a, $b) => $b['score'] <=> $a['score']);

echo json_encode([
	'results' => $results,
	'grouped' => $grouped,
	'total' => count($results),
	'query' => $rawQ,
	'mode' => $mode,
], JSON_UNESCAPED_UNICODE);

function slugify($text) {
	$text = preg_replace('/[^\w\s\p{L}]/u', '', $text);
	$text = preg_replace('/[-\s]+/u', '-', $text);
	$text = trim($text, '-');
	return mb_strtolower($text);
}

function makeSnippet($text, $query, $mode = 'normal') {
	$pos = false;

	if ($mode === 'regex') {
		if (preg_match('/' . $query . '/u', $text, $m, PREG_OFFSET_CAPTURE)) {
			$pos = $m[0][1];
		}
	} elseif ($mode === 'fuzzy') {
		$pos = findFuzzyPos($text, $query);
		if ($pos === false) $pos = 0;
	} else {
		$pos = mb_stripos($text, $query);
	}

	if ($pos === false) return mb_substr($text, 0, 200);

	$start = max(0, $pos - 80);
	$length = 200;
	$snippet = mb_substr($text, $start, $length);

	if ($start > 0) $snippet = '…' . $snippet;
	if ($start + $length < mb_strlen($text)) $snippet .= '…';

	return $snippet;
}

function fuzzyMatch($text, $query) {
	$threshold = max(1, intdiv(strlen($query), 4));
	$words = preg_split('/\s+/', $text);
	foreach ($words as $word) {
		$word = trim($word);
		if (strlen($word) < 2) continue;
		if (levenshtein($word, $query) <= $threshold) return true;
	}
	$qi = 0;
	for ($i = 0; $i < strlen($text) && $qi < strlen($query); $i++) {
		if ($text[$i] === $query[$qi]) $qi++;
	}
	return $qi === strlen($query);
}

function findFuzzyPos($text, $query) {
	$threshold = max(1, intdiv(strlen($query), 4));
	$words = preg_split('/\s+/', $text);
	$running = 0;
	foreach ($words as $word) {
		$word = trim($word);
		if (strlen($word) < 2) { $running += strlen($word) + 1; continue; }
		if (levenshtein($word, $query) <= $threshold) return $running;
		$running += strlen($word) + 1;
	}
	$pos = mb_stripos($text, $query);
	return $pos !== false ? $pos : 0;
}

function findNearestHeading($blocks, $currentBlock) {
	$nearest = null;
	foreach ($blocks as $b) {
		if ($b === $currentBlock) break;
		if ($b['type'] === 'heading') $nearest = $b;
	}
	return $nearest;
}
