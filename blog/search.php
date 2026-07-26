<?php
header('Content-Type: application/json; charset=utf-8');
header('X-Robots-Tag: noindex');

$q = isset($_GET['q']) ? trim($_GET['q']) : '';
if (strlen($q) < 2) {
	echo json_encode(['results' => [], 'total' => 0, 'query' => $q]);
	exit;
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

	preg_match_all('/<h([1-6])([^>]*)>(.*?)<\/h\1>/i', $html, $hms, PREG_SET_ORDER);
	foreach ($hms as $hm) {
		$level = (int)$hm[1];
		$attrs = $hm[2];
		$text = trim(html_entity_decode(strip_tags($hm[3]), ENT_QUOTES | ENT_HTML5));
		$text = preg_replace('/\s+/', ' ', $text);
		if ($text === '') continue;
		$slug = slugify($text);
		$blocks[] = ['type' => 'heading', 'level' => $level, 'text' => $text, 'slug' => $slug];
	}

	preg_match_all('/<(p|li|blockquote|td|th)[^>]*>(.*?)<\/\1>/is', $html, $pms, PREG_SET_ORDER);
	foreach ($pms as $pm) {
		$text = trim(html_entity_decode(strip_tags($pm[2]), ENT_QUOTES | ENT_HTML5));
		$text = preg_replace('/\s+/', ' ', $text);
		if (strlen($text) < 40) continue;
		$blocks[] = ['type' => 'text', 'text' => $text];
	}

	preg_match_all('/<div[^>]*class="[^"]*\bmd\b[^"]*"[^>]*>(.*?)<\/div>/is', $html, $mdms, PREG_SET_ORDER);
	foreach ($mdms as $mdm) {
		$raw = $mdm[1];

		preg_match_all('/^#{1,6}\s+(.+)$/m', $raw, $mdHeadings, PREG_SET_ORDER);
		foreach ($mdHeadings as $mh) {
			$level = strlen(trim($mh[0])[0]);
			$text = trim(html_entity_decode(strip_tags($mh[1]), ENT_QUOTES | ENT_HTML5));
			$text = preg_replace('/\[([^\]]*)\]\([^)]*\)/', '$1', $text);
			$text = preg_replace('/[*_]{1,3}([^*_]+)[*_]{1,3}/', '$1', $text);
			$text = cleanCitations($text);
			$text = preg_replace('/\s+/', ' ', $text);
			if ($text === '' || mb_strlen($text) < 3) continue;
			$slug = slugify($text);
			$blocks[] = ['type' => 'heading', 'level' => $level, 'text' => $text, 'slug' => $slug];
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
		$paras = preg_split('/\n\s*\n/', $text);
		foreach ($paras as $p) {
			$p = trim(preg_replace('/\s+/', ' ', $p));
			if (strlen($p) > 50) {
				$blocks[] = ['type' => 'text', 'text' => $p];
			}
		}
	}

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
	$text = cleanCitations($text);
	$pos = mb_stripos($text, $query);
	if ($pos === false) return mb_substr($text, 0, 200);

	$start = max(0, $pos - 80);
	$length = 200;
	$snippet = mb_substr($text, $start, $length);

	if ($start > 0) $snippet = '…' . $snippet;
	if ($start + $length < mb_strlen($text)) $snippet .= '…';

	return $snippet;
}

function cleanCitations($text) {
	$text = preg_replace('/\\\\cite(author|title|year)?(\[([^\]]*)\])?\{([^}]+)\}/', '$4', $text);
	$text = preg_replace('/\\\\label\{([^}]+)\}/', '$1', $text);
	$text = preg_replace('/\\\\index\{([^}]+)\}/', '$1', $text);
	$text = preg_replace('/\\\\[a-zA-Z]+/', '', $text);
	return $text;
}

function findNearestHeading($blocks, $currentBlock) {
	$nearest = null;
	foreach ($blocks as $b) {
		if ($b === $currentBlock) break;
		if ($b['type'] === 'heading') $nearest = $b;
	}
	return $nearest;
}
