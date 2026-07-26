<?php
header('Content-Type: application/json; charset=utf-8');
header('X-Robots-Tag: noindex');

$q = isset($_GET['q']) ? trim($_GET['q']) : '';
if (strlen($q) < 2) {
	echo json_encode(['results' => [], 'total' => 0, 'query' => $q]);
	exit;
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

function resolveCitations($text, $bibData) {
	$text = preg_replace_callback('/\\\\(footcite|cite|citeauthor|citeauthorlastnameand|citetitle|citeyear|citealternativetitle|citeurl)(?:\[([^\]]*)\])?\{([^}]+)\}/', function($m) use ($bibData) {
		$type = $m[1];
		$manual = isset($m[2]) && $m[2] !== '' ? $m[2] : null;
		$key = $m[3];
		$entry = isset($bibData[$key]) ? $bibData[$key] : null;

		if (!$entry) return $key;

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

$files = glob('*.php');
$exclude = ['index.php', 'index_full.php', 'functions.php', 'search.php', 'asanai_blog_proxy.php'];
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

	// HTML headings with position
	preg_match_all('/<h([1-6])([^>]*)>(.*?)<\/h\1>/i', $html, $hms, PREG_SET_ORDER | PREG_OFFSET_CAPTURE);
	foreach ($hms as $hm) {
		$pos = $hm[0][1];
		$level = (int)$hm[1][0];
		$text = trim(html_entity_decode(strip_tags($hm[3][0]), ENT_QUOTES | ENT_HTML5));
		$text = resolveCitations($text, $bibData);
		$text = preg_replace('/\s+/', ' ', $text);
		if ($text === '') continue;
		$slug = slugify($text);
		$blocks[] = ['type' => 'heading', 'level' => $level, 'text' => $text, 'slug' => $slug, 'pos' => $pos];
	}

	// HTML text blocks with position
	preg_match_all('/<(p|li|blockquote|td|th)[^>]*>(.*?)<\/\1>/is', $html, $pms, PREG_SET_ORDER | PREG_OFFSET_CAPTURE);
	foreach ($pms as $pm) {
		$pos = $pm[0][1];
		$text = trim(html_entity_decode(strip_tags($pm[2][0]), ENT_QUOTES | ENT_HTML5));
		$text = resolveCitations($text, $bibData);
		$text = preg_replace('/\s+/', ' ', $text);
		if (strlen($text) < 40) continue;
		$blocks[] = ['type' => 'text', 'text' => $text, 'pos' => $pos];
	}

	// .md divs (markdown content) with position
	preg_match_all('/<div[^>]*class="[^"]*\bmd\b[^"]*"[^>]*>(.*?)<\/div>/is', $html, $mdms, PREG_SET_ORDER | PREG_OFFSET_CAPTURE);
	foreach ($mdms as $mdm) {
		$mdPos = $mdm[0][1];
		$raw = $mdm[1][0];

		preg_match_all('/^#{1,6}\s+(.+)$/m', $raw, $mdHeadings, PREG_SET_ORDER);
		foreach ($mdHeadings as $mh) {
			$level = strlen(trim($mh[0][0])[0]);
			$text = trim(html_entity_decode(strip_tags($mh[1][0]), ENT_QUOTES | ENT_HTML5));
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
		$text = trim(html_entity_decode(strip_tags($raw), ENT_QUOTES | ENT_HTML5));
		$text = resolveCitations($text, $bibData);
		$paras = preg_split('/\n\s*\n/', $text);
		foreach ($paras as $p) {
			$p = trim(preg_replace('/\s+/', ' ', $p));
			if (strlen($p) > 50) {
				$blocks[] = ['type' => 'text', 'text' => $p, 'pos' => $mdPos];
			}
		}
	}

	// Figures & figcaptions with position
	preg_match_all('/<figure[^>]*>(.*?)<\/figure>/is', $html, $figs, PREG_SET_ORDER | PREG_OFFSET_CAPTURE);
	foreach ($figs as $fig) {
		$figPos = $fig[0][1];
		$figHtml = $fig[1][0];
		$imgUrl = '';

		if (preg_match('/<img[^>]*src="([^"]+)"/i', $figHtml, $img)) {
			$imgUrl = $img[1];
		}

		if (preg_match('/<figcaption[^>]*class="[^"]*\bmd\b[^"]*"[^>]*>(.*?)<\/figcaption>/is', $figHtml, $cap)) {
			$caption = trim(html_entity_decode(strip_tags($cap[1]), ENT_QUOTES | ENT_HTML5));
			$caption = resolveCitations($caption, $bibData);
			$caption = preg_replace('/\s+/', ' ', $caption);
			if (strlen($caption) > 15) {
				$blocks[] = ['type' => 'caption', 'text' => $caption, 'pos' => $figPos, 'img' => $imgUrl];
			}
		} elseif (preg_match('/<figcaption[^>]*>(.*?)<\/figcaption>/is', $figHtml, $cap)) {
			$caption = trim(html_entity_decode(strip_tags($cap[1]), ENT_QUOTES | ENT_HTML5));
			$caption = preg_replace('/\s+/', ' ', $caption);
			if (strlen($caption) > 15) {
				$blocks[] = ['type' => 'caption', 'text' => $caption, 'pos' => $figPos, 'img' => $imgUrl];
			}
		}

		if (preg_match('/<img[^>]*alt="([^"]*)"/i', $figHtml, $alt)) {
			$altText = trim(html_entity_decode($alt[1], ENT_QUOTES | ENT_HTML5));
			$altText = preg_replace('/\s+/', ' ', $altText);
			if (strlen($altText) > 10) {
				$blocks[] = ['type' => 'caption', 'text' => $altText, 'pos' => $figPos, 'img' => $imgUrl];
			}
		}
	}

	usort($blocks, fn($a, $b) => ($a['pos'] ?? 0) <=> ($b['pos'] ?? 0));

	$lowerQ = mb_strtolower($q);

	foreach ($blocks as $b) {
		$lowerText = mb_strtolower($b['text']);
		if (mb_strpos($lowerText, $lowerQ) === false) continue;

		$snippet = makeSnippet($b['text'], $q);
		$score = 0;

		if ($b['type'] === 'heading') {
			$exact = mb_strpos($lowerText, $lowerQ) !== false ? 50 : 0;
			$levelBonus = (6 - $b['level']) * 15;
			$score = 200 + $exact + $levelBonus;
			$results[] = [
				'page' => $name,
				'pageTitle' => $pageTitle,
				'type' => 'heading',
				'level' => $b['level'],
				'title' => $b['text'],
				'snippet' => $snippet,
				'url' => $name . '#' . $b['slug'],
				'score' => $score,
			];
		} elseif ($b['type'] === 'caption') {
			$score = 150 + substr_count($lowerText, $lowerQ) * 10;
			$heading = findNearestHeading($blocks, $b);
			$imgUrl = $b['img'] ?? '';
			$results[] = [
				'page' => $name,
				'pageTitle' => $pageTitle,
				'type' => 'caption',
				'level' => $heading ? $heading['level'] : 0,
				'title' => ($imgUrl ? '🖼 ' : '📷 ') . ($heading ? $heading['text'] : $pageTitle),
				'snippet' => $snippet,
				'url' => $name . ($heading ? '#' . $heading['slug'] : ''),
				'score' => $score,
				'img' => $imgUrl,
			];
		} else {
			$score = 50 + substr_count($lowerText, $lowerQ) * 5;
			$heading = findNearestHeading($blocks, $b);
			$results[] = [
				'page' => $name,
				'pageTitle' => $pageTitle,
				'type' => 'content',
				'level' => $heading ? $heading['level'] : 0,
				'title' => $heading ? $heading['text'] : $pageTitle,
				'snippet' => $snippet,
				'url' => $name . ($heading ? '#' . $heading['slug'] : ''),
				'score' => $score,
			];
		}
	}
}

usort($results, fn($a, $b) => $b['score'] <=> $a['score']);
$results = array_slice($results, 0, 50);

echo json_encode([
	'results' => $results,
	'total' => count($results),
	'query' => $q,
], JSON_UNESCAPED_UNICODE);

function slugify($text) {
	$text = preg_replace('/[^\w\s\p{L}]/u', '', $text);
	$text = preg_replace('/[-\s]+/u', '-', $text);
	$text = trim($text, '-');
	return mb_strtolower($text);
}

function makeSnippet($text, $query) {
	$pos = mb_stripos($text, $query);
	if ($pos === false) return mb_substr($text, 0, 200);

	$start = max(0, $pos - 80);
	$length = 200;
	$snippet = mb_substr($text, $start, $length);

	if ($start > 0) $snippet = '…' . $snippet;
	if ($start + $length < mb_strlen($text)) $snippet .= '…';

	return $snippet;
}

function findNearestHeading($blocks, $currentBlock) {
	$nearest = null;
	foreach ($blocks as $b) {
		if ($b === $currentBlock) break;
		if ($b['type'] === 'heading') $nearest = $b;
	}
	return $nearest;
}
