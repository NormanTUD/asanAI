<?php
/* Search engine core. Pure functions only, no output. Used by search.php and tests. */

if (!defined('SEARCH_LIB_LOADED')) {
	define('SEARCH_LIB_LOADED', true);
}

function search_excludes() {
	return [
		'index.php', 'index_full.php', 'functions.php', 'search.php', 'search_lib.php',
		'asanai_blog_proxy.php', 'graph.php', 'literature.php', 'knowledge_map.php',
		'_aurora_test.php',
	];
}

function normalizeSmartQuotes($text) {
	$quotes = [
		"\xC2\xAB" => '"', "\xC2\xBB" => '"',
		"\xE2\x80\x98" => "'", "\xE2\x80\x99" => "'",
		"\xE2\x80\x9A" => "'", "\xE2\x80\x9B" => "'",
		"\xE2\x80\x9C" => '"', "\xE2\x80\x9D" => '"',
		"\xE2\x80\x9E" => '"', "\xE2\x80\x9F" => '"',
	];
	return strtr($text, $quotes);
}

function foldDiacritics($text) {
	static $greekMap = null;
	if ($greekMap === null) {
		$greekMap = [
			'α'=>'alpha','β'=>'beta','γ'=>'gamma','δ'=>'delta','ε'=>'epsilon','ζ'=>'zeta',
			'η'=>'eta','θ'=>'theta','ι'=>'iota','κ'=>'kappa','λ'=>'lambda','μ'=>'mu','ν'=>'nu',
			'ξ'=>'xi','ο'=>'omicron','π'=>'pi','ρ'=>'rho','σ'=>'sigma','ς'=>'sigma','τ'=>'tau',
			'υ'=>'upsilon','φ'=>'phi','χ'=>'chi','ψ'=>'psi','ω'=>'omega',
			'Α'=>'alpha','Β'=>'beta','Γ'=>'gamma','Δ'=>'delta','Ε'=>'epsilon','Ζ'=>'zeta',
			'Η'=>'eta','Θ'=>'theta','Ι'=>'iota','Κ'=>'kappa','Λ'=>'lambda','Μ'=>'mu','Ν'=>'nu',
			'Ξ'=>'xi','Ο'=>'omicron','Π'=>'pi','Ρ'=>'rho','Σ'=>'sigma','Τ'=>'tau','Υ'=>'upsilon',
			'Φ'=>'phi','Χ'=>'chi','Ψ'=>'psi','Ω'=>'omega',
			'ά'=>'alpha','έ'=>'epsilon','ή'=>'eta','ί'=>'iota','ό'=>'omicron','ύ'=>'upsilon','ώ'=>'omega',
			'ϊ'=>'iota','ϋ'=>'upsilon','ΐ'=>'iota','ΰ'=>'upsilon',
		];
	}
	$text = strtr($text, $greekMap);
	$iconv = @iconv('UTF-8', 'ASCII//TRANSLIT', $text);
	if ($iconv !== false) $text = $iconv;
	$text = str_replace('?', '', $text);
	return $text;
}

function searchNormalize($text) {
	$text = mb_strtolower($text, 'UTF-8');
	$text = foldDiacritics($text);
	$text = preg_replace('/[^\w\s]+/u', ' ', $text);
	$text = preg_replace('/\s+/u', ' ', trim($text));
	return $text;
}

function charOffsetOf($text, $byteOffset) {
	return mb_strlen(substr($text, 0, max(0, min($byteOffset, strlen($text)))));
}

function detectSearchMode($q) {
	$raw = $q;
	if (mb_strlen($q) >= 2 && mb_substr($q, 0, 1) === '/' && mb_substr($q, -1) === '/') {
		$pattern = trim(mb_substr($q, 1, -1));
		if ($pattern === '') {
			return ['mode' => 'regex', 'query' => '', 'raw' => $raw, 'error' => 'Empty regex pattern'];
		}
		$compiled = buildRegex($pattern);
		if ($compiled === false || @preg_match($compiled, '') === false) {
			return ['mode' => 'regex', 'query' => $pattern, 'raw' => $raw, 'error' => 'Invalid regex pattern'];
		}
		return ['mode' => 'regex', 'query' => $pattern, 'raw' => $raw, 'compiled' => $compiled];
	}
	if (mb_substr($q, 0, 1) === '~') {
		$q = mb_substr($q, 1);
		if (mb_strlen($q) < 2) {
			return ['mode' => 'fuzzy', 'query' => $q, 'raw' => $raw, 'error' => 'Query too short'];
		}
		return ['mode' => 'fuzzy', 'query' => $q, 'raw' => $raw];
	}
	return ['mode' => 'normal', 'query' => $q, 'raw' => $raw];
}

/* Compile a user-supplied regex body (no delimiters) into a full PCRE string with a
 * delimiter that does not collide with the pattern content. Returns false on failure. */
function buildRegex($pattern) {
	$delims = ['~', '#', '%', '+', '=', '!'];
	foreach ($delims as $d) {
		if (mb_strpos($pattern, $d) === false) {
			return $d . $pattern . $d . 'ui';
		}
	}
	$d = '~';
	return $d . preg_quote($pattern, $d) . $d . 'ui';
}

function cleanMath($text) {
	$text = preg_replace_callback('/\$\$([^\$]*)\$\$/', function($m) { return renderLatex($m[1]); }, $text);
	$text = preg_replace_callback('/\$([^\$]*)\$/', function($m) { return renderLatex($m[1]); }, $text);
	return $text;
}

function renderLatex($expr) {
	$expr = trim($expr);

	$expr = preg_replace('/\\\\frac\{([^}]*)\}\{([^}]*)\}/', '$1/$2', $expr);
	$expr = preg_replace('/\\\\sqrt\[([^\]]*)\]\{([^}]*)\}/', '√[$1]$2', $expr);
	$expr = preg_replace('/\\\\sqrt\{([^}]*)\}/', '√$1', $expr);

	$expr = preg_replace('/\\\\text\{([^}]*)\}/', '$1', $expr);
	$expr = preg_replace('/\\\\mathbf\{([^}]*)\}/', '$1', $expr);
	$expr = preg_replace('/\\\\mathbb\{([^}]*)\}/', '$1', $expr);
	$expr = preg_replace('/\\\\mathrm\{([^}]*)\}/', '$1', $expr);
	$expr = preg_replace('/\\\\mathcal\{([^}]*)\}/', '$1', $expr);
	$expr = preg_replace('/\\\\hat\{([^}]*)\}/', '̂$1', $expr);
	$expr = preg_replace('/\\\\displaystyle/', '', $expr);
	$expr = preg_replace('/\\\\limits/', '', $expr);

	$expr = preg_replace('/\\\\begin\{[^}]*\}/', '', $expr);
	$expr = preg_replace('/\\\\end\{[^}]*\}/', '', $expr);
	$expr = str_replace('\\\\', ' ', $expr);
	$expr = str_replace('&', ' ', $expr);
	$expr = preg_replace('/\\\\hline/', '', $expr);

	$expr = preg_replace('/\\\\left\\\\?\(/', '(', $expr);
	$expr = preg_replace('/\\\\right\\\\?\)/', ')', $expr);
	$expr = preg_replace('/\\\\left\\\\?\[/', '[', $expr);
	$expr = preg_replace('/\\\\right\\\\?\]/', ']', $expr);
	$expr = preg_replace('/\\\\left\\\\?\\\\?\{/', '{', $expr);
	$expr = preg_replace('/\\\\right\\\\?\\\\?\}/', '}', $expr);
	$expr = preg_replace('/\\\\left/', '', $expr);
	$expr = preg_replace('/\\\\right/', '', $expr);
	$expr = preg_replace('/\\\\big[lr]?/', '', $expr);
	$expr = preg_replace('/\\\\Big[lr]?/', '', $expr);
	$expr = preg_replace('/\\\\bigg[lr]?/', '', $expr);
	$expr = preg_replace('/\\\\Bigg[lr]?/', '', $expr);
	$expr = preg_replace('/\\\\lvert/', '|', $expr);
	$expr = preg_replace('/\\\\rvert/', '|', $expr);

	$expr = preg_replace('/\\\\quad/', ' ', $expr);
	$expr = preg_replace('/\\\\qquad/', '  ', $expr);
	$expr = preg_replace(['/\\\\,/', '/\\\\;/'], ' ', $expr);

	$subscriptMap = [
		'0'=>'₀','1'=>'₁','2'=>'₂','3'=>'₃','4'=>'₄',
		'5'=>'₅','6'=>'₆','7'=>'₇','8'=>'₈','9'=>'₉',
		'i'=>'ᵢ','j'=>'ⱼ','k'=>'ₖ','l'=>'ₗ','m'=>'ₘ','n'=>'ₙ',
		'o'=>'ₒ','p'=>'ₚ','r'=>'ᵣ','s'=>'ₛ','t'=>'ₜ',
		'u'=>'ᵤ','v'=>'ᵥ','x'=>'ₓ',
		'+'=>'₊','-'=>'₋','('=>'₍',')'=>'₎',
	];
	$expr = preg_replace_callback('/_\{([^}]+)\}/', function($m) use ($subscriptMap) {
		return strtr($m[1], $subscriptMap);
	}, $expr);
	$expr = preg_replace_callback('/_([a-zA-Z0-9])/', function($m) use ($subscriptMap) {
		return strtr($m[1], $subscriptMap);
	}, $expr);

	$superscriptMap = [
		'0'=>'⁰','1'=>'¹','2'=>'²','3'=>'³','4'=>'⁴',
		'5'=>'⁵','6'=>'⁶','7'=>'⁷','8'=>'⁸','9'=>'⁹',
		'i'=>'ⁱ','n'=>'ⁿ',
		'+'=>'⁺','-'=>'⁻','('=>'⁽',')'=>'⁾',
		'T'=>'ᵀ','t'=>'ᵗ',
	];
	$expr = preg_replace_callback('/\^\{([^}]+)\}/', function($m) use ($superscriptMap) {
		return strtr($m[1], $superscriptMap);
	}, $expr);
	$expr = preg_replace_callback('/\^([a-zA-Z0-9])/', function($m) use ($superscriptMap) {
		return isset($superscriptMap[$m[1]]) ? $superscriptMap[$m[1]] : '^'.$m[1];
	}, $expr);

	$expr = preg_replace('/\{([^}]*)\}/', '$1', $expr);

	$expr = str_replace(['\\times','\\cdot','\\div'], ['×','·','÷'], $expr);
	$expr = str_replace(['\\to','\\rightarrow','\\leftarrow','\\Rightarrow','\\Leftarrow','\\mapsto'], ['→','→','←','⇒','⇐','↦'], $expr);
	$expr = str_replace(['\\approx','\\neq','\\equiv','\\le','\\ge','\\leq','\\geq'], ['≈','≠','≡','≤','≥','≤','≥'], $expr);
	$expr = str_replace(['\\ll','\\gg','\\infty','\\partial','\\nabla'], ['≪','≫','∞','∂','∇'], $expr);
	$expr = str_replace(['\\sum','\\prod','\\int','\\oint'], ['∑','∏','∫','∮'], $expr);
	$expr = str_replace(['\\cup','\\cap','\\subset','\\supset','\\subseteq','\\supseteq'], ['∪','∩','⊂','⊃','⊆','⊇'], $expr);
	$expr = str_replace(['\\forall','\\exists'], ['∀','∃'], $expr);
	$expr = str_replace(['\\alpha','\\beta','\\gamma','\\delta','\\epsilon','\\zeta','\\eta','\\theta'], ['α','β','γ','δ','ε','ζ','η','θ'], $expr);
	$expr = str_replace(['\\iota','\\kappa','\\lambda','\\mu','\\nu','\\xi','\\pi','\\rho','\\sigma','\\tau'], ['ι','κ','λ','μ','ν','ξ','π','ρ','σ','τ'], $expr);
	$expr = str_replace(['\\upsilon','\\phi','\\chi','\\psi','\\omega'], ['υ','φ','χ','ψ','ω'], $expr);
	$expr = str_replace(['\\varepsilon','\\varphi','\\vartheta'], ['ε','φ','ϑ'], $expr);
	$expr = str_replace(['\\Gamma','\\Delta','\\Theta','\\Lambda','\\Xi','\\Pi','\\Sigma','\\Phi','\\Psi','\\Omega'], ['Γ','Δ','Θ','Λ','Ξ','Π','Σ','Φ','Ψ','Ω'], $expr);

	$expr = preg_replace('/\s+/', ' ', $expr);
	return trim($expr);
}

function cleanMarkdown($text) {
	$text = preg_replace('/\[([^\]]*)\]\([^)]*\)/', '$1', $text);
	$text = preg_replace('/!\[([^\]]*)\]\([^)]*\)/', '$1', $text);
	$text = preg_replace('/[*_]{2,3}([^*_]+)[*_]{2,3}/', '$1', $text);
	$text = preg_replace('/[*_]([^*_]+)[*_]/', '$1', $text);
	$text = preg_replace('/~~(.*?)~~/', '$1', $text);
	$text = preg_replace('/`([^`]+)`/', '$1', $text);
	$text = preg_replace('/```[\s\S]*?```/', '', $text);
	$text = preg_replace('/^\s*[-*+]\s+/m', '', $text);
	$text = preg_replace('/^\s*\d+\.\s+/m', '', $text);
	$text = preg_replace('/\|.*?\|/', '', $text);
	$text = preg_replace('/^#{1,6}\s+/m', '', $text);
	$text = preg_replace('/~~(.*?)~~/', '$1', $text);
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
				$lastNames = array_map(function($n) { $parts = explode(' ', trim($n)); return end($parts); }, $authors);
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
	$text = cleanMarkdown($text);
	$text = resolveCitations($text, $bibData);
	$text = preg_replace('/\s+/', ' ', $text);
	return trim($text);
}

function loadLiterature($litFile) {
	$bibData = [];
	if (!file_exists($litFile)) return $bibData;
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
			'alternativetitle' => preg_match('/alternativetitle\s*:\s*"([^"]+)"/', $body, $at) ? $at[1] : '',
		];
	}
	return $bibData;
}

function pageTitleOf($content, $name) {
	if (preg_match('/COURSE_METADATA:\s*\n(?:.*\n)*?title:\s*(.+)\s*$/m', $content, $m)) {
		return trim($m[1]);
	}
	return $name;
}

/* Extract searchable blocks from a page's raw (PHP) source. */
function extractBlocks($content, $bibData) {
	$html = preg_replace('/<\?php.*?\?>/s', '', $content);
	$html = preg_replace('/<script[^>]*>.*?<\/script>/is', '', $html);
	$html = preg_replace('/<style[^>]*>.*?<\/style>/is', '', $html);

	$blocks = [];

	$figureRanges = [];
	preg_match_all('/<figure[^>]*>.*?<\/figure>/is', $html, $figRanges, PREG_OFFSET_CAPTURE);
	foreach ($figRanges[0] as $fr) {
		$figureRanges[] = [$fr[1], $fr[1] + strlen($fr[0])];
	}
	$inFigure = function($pos) use ($figureRanges) {
		foreach ($figureRanges as $r) {
			if ($pos >= $r[0] && $pos < $r[1]) return true;
		}
		return false;
	};

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
		if ($inFigure($pos)) continue;
		$text = cleanText(strip_tags($pm[2][0]), $bibData);
		if (mb_strlen($text) < 40) continue;
		$blocks[] = ['type' => 'text', 'text' => $text, 'pos' => $pos];
	}

	$mdms = [];
	$searchPos = 0;
	while (($mdStart = strpos($html, '<div', $searchPos)) !== false) {
		$tagEnd = strpos($html, '>', $mdStart);
		if ($tagEnd === false) break;
		$tag = substr($html, $mdStart, $tagEnd - $mdStart + 1);
		if (preg_match('/class="[^"]*\bmd\b[^"]*"/i', $tag)) {
			$depth = 1;
			$pos = $tagEnd + 1;
			while ($depth > 0 && $pos < strlen($html)) {
				$nextOpen = strpos($html, '<div', $pos);
				$nextClose = strpos($html, '</div>', $pos);
				if ($nextClose === false) break;
				if ($nextOpen !== false && $nextOpen < $nextClose) {
					$depth++;
					$pos = $nextOpen + 4;
				} else {
					$depth--;
					$pos = $nextClose + 6;
				}
			}
			$contentEnd = $pos;
			$raw = substr($html, $tagEnd + 1, $contentEnd - $tagEnd - 7);
			$mdms[] = [[$tag . $raw . '</div>', $mdStart], [$raw, $tagEnd + 1]];
			$searchPos = $contentEnd;
		} else {
			$searchPos = $tagEnd + 1;
		}
	}

	foreach ($mdms as $mdm) {
		$mdPos = $mdm[0][1];
		$mdAttrs = $mdm[0][0];
		$raw = $mdm[1][0];

		/* Figures are indexed separately as caption blocks; don't re-index
		 * their markup as paragraph text. */
		$raw = preg_replace('/<figure[^>]*>.*?<\/figure>/is', '', $raw);

		if (preg_match('/data-headline="([^"]+)"/i', $mdAttrs, $dh)) {
			$hlText = cleanText($dh[1], $bibData);
			if (mb_strlen($hlText) > 3) {
				$blocks[] = ['type' => 'heading', 'level' => 3, 'text' => $hlText, 'slug' => slugify($hlText), 'pos' => $mdPos];
			}
		}

		$lines = explode("\n", $raw);
		$paraBuf = '';
		$lastHeadingPos = $mdPos;
		$linePos = 0;
		foreach ($lines as $li) {
			$trimmed = trim($li);
			if (preg_match('/^(#{1,6})\s+(.+)$/', $li, $hm)) {
				if (strlen($paraBuf) > 50) {
					$paraText = cleanText(strip_tags($paraBuf), $bibData);
					if (mb_strlen($paraText) > 50) {
						$blocks[] = ['type' => 'text', 'text' => $paraText, 'pos' => $lastHeadingPos + 1];
					}
				}
				$paraBuf = '';
				$level = strlen($hm[1]);
				$text = cleanText($hm[2], $bibData);
				if ($text !== '' && mb_strlen($text) >= 3) {
					$blocks[] = ['type' => 'heading', 'level' => $level, 'text' => $text, 'slug' => slugify($text), 'pos' => $mdPos + $linePos];
				}
				$lastHeadingPos = $mdPos + $linePos;
			} elseif ($trimmed === '') {
				if (strlen($paraBuf) > 50) {
					$paraText = cleanText(strip_tags($paraBuf), $bibData);
					if (mb_strlen($paraText) > 50) {
						$blocks[] = ['type' => 'text', 'text' => $paraText, 'pos' => $lastHeadingPos + 1];
					}
				}
				$paraBuf = '';
			} else {
				$paraBuf .= ($paraBuf === '' ? '' : "\n") . $li;
			}
			$linePos += strlen($li) + 1;
		}
		if (strlen($paraBuf) > 50) {
			$paraText = cleanText(strip_tags($paraBuf), $bibData);
			if (mb_strlen($paraText) > 50) {
				$blocks[] = ['type' => 'text', 'text' => $paraText, 'pos' => $lastHeadingPos + 1];
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

		if (mb_strlen($captionText) > 15) {
			$norm = mb_strtolower(trim($captionText));
			if (!isset($seenCaptions[$norm])) {
				$seenCaptions[$norm] = true;
				$blocks[] = ['type' => 'caption', 'text' => $captionText, 'pos' => $figPos, 'img' => $imgUrl];
			}
		} elseif (preg_match('/<img[^>]*alt="([^"]*)"/i', $figHtml, $alt)) {
			$altText = cleanText($alt[1], $bibData);
			if (mb_strlen($altText) > 10) {
				$norm = mb_strtolower(trim($altText));
				if (!isset($seenCaptions[$norm])) {
					$seenCaptions[$norm] = true;
					$blocks[] = ['type' => 'caption', 'text' => $altText, 'pos' => $figPos, 'img' => $imgUrl];
				}
			}
		}
	}

	usort($blocks, fn($a, $b) => ($a['pos'] ?? 0) <=> ($b['pos'] ?? 0));
	return $blocks;
}

/* Build (and optionally cache) the search index for a directory of PHP pages. */
function buildIndex($dir, $exclude = null, $useCache = true) {
	if ($exclude === null) $exclude = search_excludes();
	$dir = rtrim($dir, '/');
	$files = glob($dir . '/*.php');

	$fingerprint = [];
	foreach ($files as $f) {
		$name = basename($f);
		if (in_array($name, $exclude, true)) continue;
		$mtime = @filemtime($f);
		if ($mtime === false) continue;
		$fingerprint[$name] = $mtime;
	}
	$litFile = $dir . '/literature.js';
	$fingerprint['__lit__'] = file_exists($litFile) ? @filemtime($litFile) : 0;
	$fingerprint['__lib__'] = @filemtime(__FILE__);
	ksort($fingerprint);
	$key = sha1(json_encode($fingerprint));

	$cacheFile = $dir . '/.search_cache.json';
	if ($useCache && file_exists($cacheFile)) {
		$cached = @json_decode(file_get_contents($cacheFile), true);
		if (is_array($cached) && ($cached['key'] ?? null) === $key && isset($cached['pages'])) {
			return $cached['pages'];
		}
	}

	$bibData = loadLiterature($litFile);
	$pages = [];
	foreach ($files as $f) {
		$name = basename($f, '.php');
		if (in_array(basename($f), $exclude, true)) continue;
		$content = @file_get_contents($f);
		if ($content === false) continue;
		$blocks = extractBlocks($content, $bibData);
		foreach ($blocks as $i => $b) {
			$blocks[$i]['norm'] = searchNormalize($b['text']);
			$blocks[$i]['fold'] = foldDiacritics(mb_strtolower($b['text'], 'UTF-8'));
		}
		$pages[$name] = [
			'name' => $name,
			'title' => pageTitleOf($content, $name),
			'blocks' => $blocks,
		];
	}

	if ($useCache) {
		$tmp = $cacheFile . '.tmp';
		if (@file_put_contents($tmp, json_encode(['key' => $key, 'pages' => $pages], JSON_UNESCAPED_UNICODE)) !== false) {
			@rename($tmp, $cacheFile);
		}
	}
	return $pages;
}

/* ---- matching ---- */

function findTokenHit($normText, $tok) {
	$wordRe = '/(?<![\p{L}\p{N}_])' . preg_quote($tok, '~') . '(?![\p{L}\p{N}_])/u';
	if (preg_match($wordRe, $normText)) return ['q' => 4];
	$prefixRe = '/(?<![\p{L}\p{N}_])' . preg_quote($tok, '~') . '/u';
	if (preg_match($prefixRe, $normText)) return ['q' => 3];
	if (mb_strpos($normText, $tok) !== false) return ['q' => 2];
	return false;
}

function matchQuery($normText, $normQuery) {
	$tokens = preg_split('/\s+/u', trim($normQuery), -1, PREG_SPLIT_NO_EMPTY);
	$meaningful = array_filter($tokens, fn($t) => mb_strlen($t) >= 2);
	if (!$meaningful) {
		if ($normQuery === '' || mb_strlen($normQuery) < 2) return false;
		return mb_strpos($normText, $normQuery) !== false
			? ['tokens' => [], 'all' => true, 'coverage' => 0, 'total' => 0, 'phrase' => true, 'quality' => 0, 'occ' => 0]
			: false;
	}
	$phrasePos = mb_strpos($normText, $normQuery);
	$hits = [];
	$occ = 0;
	$quality = 0;
	foreach ($tokens as $tok) {
		if (mb_strlen($tok) < 2) { $hits[] = null; continue; }
		$hit = findTokenHit($normText, $tok);
		if ($hit === false) { $hits[] = null; continue; }
		$hits[] = $hit;
		$quality += $hit['q'];
		$occ += min(5, substr_count($normText, $tok));
	}
	$matched = array_filter($hits, fn($h) => $h !== null);
	$total = count($matched);
	if ($total === 0) return false;
	$needed = count($meaningful);
	return [
		'tokens' => $hits,
		'all' => $total >= $needed,
		'coverage' => $total,
		'total' => count($tokens),
		'phrase' => $phrasePos !== false,
		'quality' => $quality,
		'occ' => $occ,
	];
}

function findRawPos($fold, $tokens, $phrase) {
	$foldPhrase = $phrase !== '' ? foldDiacritics(mb_strtolower($phrase, 'UTF-8')) : '';
	if ($foldPhrase !== '') {
		$p = mb_strpos($fold, $foldPhrase);
		if ($p !== false) return $p;
	}
	preg_match_all('/([\p{L}\p{N}]+)/u', $fold, $words, PREG_OFFSET_CAPTURE);
	$best = null;
	foreach ($tokens as $tok) {
		if (mb_strlen($tok) < 2) continue;
		foreach ($words[0] as $w) {
			if ($w[0] === $tok || strncmp($w[0], $tok, mb_strlen($tok)) === 0) {
				$charPos = charOffsetOf($fold, $w[1]);
				if ($best === null || $charPos < $best) $best = $charPos;
			}
		}
	}
	return $best === null ? 0 : $best;
}

function fuzzyMatchInfo($foldedText, $query) {
	$qTokens = preg_split('/\s+/u', trim($query), -1, PREG_SPLIT_NO_EMPTY);
	if (!$qTokens) return false;
	$matches = [];
	foreach ($qTokens as $qt) {
		$best = findBestFuzzyWord($foldedText, $qt);
		if ($best === null) return false;
		$matches[] = $best;
	}
	$pos = min(array_column($matches, 'pos'));
	$quality = array_sum(array_column($matches, 'q'));
	return ['pos' => $pos, 'quality' => $quality, 'count' => count($matches)];
}

function findBestFuzzyWord($foldedText, $queryWord) {
	$queryF = foldDiacritics(mb_strtolower($queryWord, 'UTF-8'));
	if ($queryF === '') return null;
	$qLen = mb_strlen($queryF);
	if (strlen($queryF) > 100) return null;
	preg_match_all('/([\p{L}\p{N}]+)/u', $foldedText, $words, PREG_OFFSET_CAPTURE);
	$best = null;
	foreach ($words[0] as $w) {
		$wordF = $w[0];
		if ($wordF === '') continue;
		$lenDiff = abs(mb_strlen($wordF) - $qLen);
		if ($wordF === $queryF) {
			$q = 9;
		} elseif ($lenDiff <= 4 && strncmp($wordF, $queryF, $qLen) === 0) {
			$q = 6;
		} elseif ($lenDiff <= 3 && strlen($wordF) <= 100) {
			$dist = levenshtein($wordF, $queryF);
			$threshold = max(1, intdiv(strlen($queryF), 4));
			if ($dist <= $threshold) {
				$q = 8 - $dist;
			} else {
				continue;
			}
		} else {
			continue;
		}
		if ($best === null || $q > $best['q'] || ($q === $best['q'] && $w[1] < $best['bytePos'])) {
			$best = ['pos' => charOffsetOf($foldedText, $w[1]), 'bytePos' => $w[1], 'q' => $q];
		}
	}
	return $best;
}

function makeSnippet($text, $query, $mode, $pos = null) {
	if ($pos === null || $pos === false) return mb_substr($text, 0, 200);
	$len = mb_strlen($text);
	if ($len === 0) return '';
	$pos = max(0, min($pos, $len - 1));

	$paraStart = mb_strrpos(mb_substr($text, 0, $pos), "\n\n");
	$paraEnd = mb_strpos($text, "\n\n", $pos);
	if ($paraStart === false) $paraStart = 0; else $paraStart += 2;
	if ($paraEnd === false) $paraEnd = $len;

	$paraLen = $paraEnd - $paraStart;
	if ($paraLen > 0 && $paraLen <= 400) {
		$snippet = mb_substr($text, $paraStart, $paraLen);
		if ($paraStart > 0) $snippet = '…' . $snippet;
		if ($paraEnd < $len) $snippet .= '…';
		return $snippet;
	}

	$start = max(0, $pos - 80);
	$snippet = mb_substr($text, $start, 200);
	if ($start > 0) $snippet = '…' . $snippet;
	if ($start + 200 < $len) $snippet .= '…';
	return $snippet;
}

function blockMatch($b, $mode, $q, $normQuery, $compiled) {
	$text = $b['text'];
	if ($mode === 'regex') {
		$n = preg_match_all($compiled, $text, $ms, PREG_OFFSET_CAPTURE);
		if ($n === false || $n === 0) return false;
		$pos = charOffsetOf($text, $ms[0][0][1]);
		return ['pos' => $pos, 'count' => $n, 'quality' => 0, 'tokens' => null, 'all' => true, 'occ' => 0];
	}
	if ($mode === 'fuzzy') {
		$qFold = foldDiacritics(mb_strtolower(trim($q), 'UTF-8'));
		$qFirst = $qFold === '' ? '' : mb_substr($qFold, 0, 1);
		if ($qFirst !== '' && mb_strpos($b['fold'], $qFirst) === false) return false;
		if (mb_strlen($qFold) >= 3) {
			$triCount = mb_strlen($qFold) - 2;
			$need = $triCount >= 3 ? 2 : 1;
			$found = 0;
			for ($i = 0; $i + 3 <= mb_strlen($qFold); $i++) {
				if (mb_strpos($b['fold'], mb_substr($qFold, $i, 3)) !== false) {
					if (++$found >= $need) break;
				}
			}
			if ($found < $need) return false;
		}
		$info = fuzzyMatchInfo($b['fold'], $q);
		if ($info === false) return false;
		return ['pos' => $info['pos'], 'count' => $info['count'], 'quality' => $info['quality'], 'tokens' => null, 'all' => true, 'occ' => 0];
	}
	$info = matchQuery($b['norm'], $normQuery);
	if ($info === false) return false;
	$tokens = preg_split('/\s+/u', trim($normQuery), -1, PREG_SPLIT_NO_EMPTY);
	$info['pos'] = findRawPos($b['fold'], $tokens, trim($q));
	return $info;
}

function blockScore($b, $info, $mode) {
	$base = ['heading' => 200, 'caption' => 150, 'content' => 50][$b['type']] ?? 50;
	$score = $base;
	if ($mode === 'normal') {
		$score += $info['quality'] * 8;
		if ($info['phrase']) $score += 30;
		if (!empty($info['all']) && ($info['coverage'] ?? 1) > 1) $score += 20;
		$score += min(20, $info['occ'] * 2);
		if ($b['type'] === 'heading') $score += (6 - $b['level']) * 15;
	} elseif ($mode === 'regex') {
		$score += min(30, $info['count'] * 5);
		if ($b['type'] === 'heading') $score += (6 - $b['level']) * 15;
	} else {
		$score += min(30, $info['quality'] * 3);
	}
	return $score;
}

function resultEntry($page, $b, $heading, $snippet, $score, $mode) {
	if ($b['type'] === 'caption') {
		return [
			'page' => $page['name'], 'pageTitle' => $page['title'], 'type' => 'caption', 'mode' => $mode,
			'title' => '🖼 ' . ($heading ? $heading['text'] : $page['title']),
			'snippet' => $snippet,
			'url' => $page['name'] . ($heading ? '#' . $heading['slug'] : ''),
			'score' => $score,
			'img' => $b['img'] ?? '',
		];
	}
	if ($b['type'] === 'heading') {
		return [
			'page' => $page['name'], 'pageTitle' => $page['title'], 'type' => 'heading', 'mode' => $mode,
			'title' => $b['text'], 'snippet' => $snippet,
			'url' => $page['name'] . '#' . $b['slug'], 'score' => $score,
		];
	}
	return [
		'page' => $page['name'], 'pageTitle' => $page['title'], 'type' => 'content', 'mode' => $mode,
		'title' => $heading ? $heading['text'] : $page['title'],
		'snippet' => $snippet,
		'url' => $page['name'] . ($heading ? '#' . $heading['slug'] : ''),
		'score' => $score,
	];
}

function findNearestHeading($blocks, $currentBlock) {
	$nearest = null;
	foreach ($blocks as $b) {
		if ($b === $currentBlock) break;
		if ($b['type'] === 'heading') $nearest = $b;
	}
	return $nearest;
}

function searchIndex($pages, $q, $mode, $compiled) {
	$results = [];
	$grouped = [];
	$normQuery = null;
	$qTokens = null;
	if ($mode === 'normal') {
		$normQuery = searchNormalize($q);
		$qTokens = preg_split('/\s+/u', $normQuery, -1, PREG_SPLIT_NO_EMPTY);
	}
	$neededTokens = $qTokens ? count(array_filter($qTokens, fn($t) => mb_strlen($t) >= 2)) : 1;

	foreach ($pages as $pageName => $page) {
		$blocks = $page['blocks'];
		$hits = [];
		$covered = [];
		foreach ($blocks as $b) {
			$info = blockMatch($b, $mode, $q, $normQuery, $compiled);
			if ($info === false) continue;
			if ($mode === 'normal' && is_array($info['tokens'])) {
				foreach ($info['tokens'] as $i => $t) {
					if ($t !== null) $covered[$i] = true;
				}
			}
			$snippet = makeSnippet($b['text'], $q, $mode, $info['pos']);
			$heading = findNearestHeading($blocks, $b);
			$hits[] = [
				'entry' => resultEntry($page, $b, $heading, $snippet, blockScore($b, $info, $mode), $mode),
				'info' => $info,
			];
		}
		if (!$hits) continue;

		if ($mode === 'normal' && $neededTokens > 1) {
			$anyFull = false;
			foreach ($hits as $h) { if ($h['info']['all']) { $anyFull = true; break; } }
			if (!$anyFull && count($covered) < $neededTokens) {
				continue;
			}
		}

		usort($hits, fn($a, $b) => $b['entry']['score'] <=> $a['entry']['score']);
		$best = $hits[0];
		$group = $best['entry'];
		$group['count'] = count($hits);
		$grouped[] = $group;

		foreach ($hits as $idx => $h) {
			if ($mode === 'normal' && $neededTokens > 1 && !$h['info']['all'] && $idx !== 0) {
				continue;
			}
			$results[] = $h['entry'];
		}
	}

	usort($results, fn($a, $b) => $b['score'] <=> $a['score']);
	usort($grouped, fn($a, $b) => $b['score'] <=> $a['score']);
	return [$results, $grouped];
}

function slugify($text) {
	$text = preg_replace('/[^\w\s\p{L}]/u', '', $text);
	$text = preg_replace('/[-\s]+/u', '-', $text);
	$text = trim($text, '-');
	return mb_strtolower($text);
}

function runSearch($rawQ, $dir, $exclude = null, $useCache = true) {
	$out = ['results' => [], 'grouped' => [], 'total' => 0, 'query' => (string)$rawQ, 'mode' => 'normal'];
	$rawQ = is_string($rawQ) ? trim($rawQ) : '';
	$out['query'] = $rawQ;
	if (mb_strlen($rawQ) < 2) return $out;

	$det = detectSearchMode($rawQ);
	$mode = $det['mode'];
	$q = $det['query'];
	$out['mode'] = $mode;
	if (isset($det['error'])) {
		$out['error'] = $det['error'];
		return $out;
	}

	$pages = buildIndex($dir, $exclude, $useCache);
	$compiled = $det['compiled'] ?? null;
	list($results, $grouped) = searchIndex($pages, $q, $mode, $compiled);

	$out['results'] = array_slice($results, 0, 50);
	$out['grouped'] = $grouped;
	$out['total'] = count($out['results']);
	return $out;
}
