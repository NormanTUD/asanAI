<?php
// headings.php — JSON outline of a lesson's headings (## … ######).
//
// Feeds the chapter switcher's expandable sub-sections for non-current
// lessons. Standalone endpoint: it does NOT include functions.php (which would emit the
// page shell). mobile-prepend passes JSON through untouched.
//
// The id for each heading is produced by a faithful port of blog/toc.js's
// slugify(), so that a `chapter#id` deep link from the switcher lands on the
// same element toc.js assigns on the target page.

declare(strict_types=1);

$base = __DIR__;
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-cache');
if (!headers_sent()) { header('X-Content-Type-Options: nosniff'); }

$slug = isset($_GET['lesson']) ? (string)$_GET['lesson'] : '';
// Allow only [a-z0-9_] up to 64 chars: blocks path traversal (no '.', '/',
// null bytes) and caps the string before any file join.
if (!preg_match('/^[a-z0-9_]{1,64}$/i', $slug)) {
    http_response_code(400);
    echo json_encode(['slug' => '', 'headings' => []]);
    exit;
}

$file = $base . '/' . $slug . '.php';
if (!is_file($file) || !is_readable($file)) {
    echo json_encode(['slug' => $slug, 'headings' => []], JSON_UNESCAPED_UNICODE);
    exit;
}

// Exact port of blog/toc.js slugify(). Empty base → "" (not deduped), matching
// the JS `if (!usedIds || !base) return base;` short-circuit.
function chsw_slugify(string $text, array &$used): string
{
    $b = function_exists('mb_strtolower') ? mb_strtolower($text, 'UTF-8') : strtolower($text);
    $b = str_replace(["\u{2018}", "\u{2019}"], "'", $b);
    $b = preg_replace('/[^\p{L}\p{N}\s\-\x{00B7}]+/u', '', $b);
    $b = preg_replace('/[\s\x{00B7}]+/u', '-', $b);
    $b = trim($b, '-');
    $b = function_exists('mb_substr') ? mb_substr($b, 0, 80, 'UTF-8') : substr($b, 0, 80);
    if ($b === '') return '';
    $candidate = $b;
    $n = 2;
    while (isset($used[$candidate])) {
        $candidate = $b . '-' . $n;
        $n++;
    }
    $used[$candidate] = true;
    return $candidate;
}

// Minimal inline-math text render: good enough that $e$, Greek letters and
// common operators produce the same slug as the front-end temml render.
function chsw_math(string $inner): string
{
    static $map = null;
    if ($map === null) {
        $pairs = [
            '\mathbb{R}' => "\u{211D}", '\mathbb{N}' => "\u{2115}", '\mathbb{Z}' => "\u{2124}",
            '\mathbb{Q}' => "\u{211A}", '\mathbb{C}' => "\u{2102}",
            '\alpha' => "\u{03B1}", '\beta' => "\u{03B2}", '\gamma' => "\u{03B3}", '\delta' => "\u{03B4}",
            '\epsilon' => "\u{03B5}", '\varepsilon' => "\u{03B5}", '\zeta' => "\u{03B6}", '\eta' => "\u{03B7}",
            '\theta' => "\u{03B8}", '\vartheta' => "\u{03D1}", '\iota' => "\u{03B9}", '\kappa' => "\u{03BA}",
            '\lambda' => "\u{03BB}", '\mu' => "\u{03BC}", '\nu' => "\u{03BD}", '\xi' => "\u{03BE}",
            '\pi' => "\u{03C0}", '\rho' => "\u{03C1}", '\sigma' => "\u{03C3}", '\tau' => "\u{03C4}",
            '\phi' => "\u{03C6}", '\varphi' => "\u{03D5}", '\chi' => "\u{03C7}", '\psi' => "\u{03C8}", '\omega' => "\u{03C9}",
            '\Gamma' => "\u{0393}", '\Delta' => "\u{0394}", '\Theta' => "\u{0398}", '\Lambda' => "\u{039B}",
            '\Xi' => "\u{039E}", '\Pi' => "\u{03A0}", '\Sigma' => "\u{03A3}", '\Upsilon' => "\u{03A5}",
            '\Phi' => "\u{03A6}", '\Psi' => "\u{03A8}", '\Omega' => "\u{03A9}",
            '\partial' => "\u{2202}", '\infty' => "\u{221E}", '\pm' => "\u{00B1}", '\times' => "\u{00D7}",
            '\div' => "\u{00F7}", '\le' => "\u{2264}", '\leq' => "\u{2264}", '\ge' => "\u{2265}", '\geq' => "\u{2265}",
            '\ne' => "\u{2260}", '\neq' => "\u{2260}", '\approx' => "\u{2248}", '\propto' => "\u{221D}",
            '\to' => "\u{2192}", '\rightarrow' => "\u{2192}", '\leftarrow' => "\u{2190}", '\in' => "\u{2208}",
            '\subset' => "\u{2282}", '\supset' => "\u{2283}", '\cup' => "\u{222A}", '\cap' => "\u{2229}",
            '\forall' => "\u{2200}", '\exists' => "\u{2203}", '\sum' => "\u{2211}", '\prod' => "\u{220F}",
            '\int' => "\u{222B}", '\sqrt' => "\u{221A}", '\nabla' => "\u{2207}", '\hbar' => "\u{210F}",
            '\cdot' => "\u{00B7}", '\cdots' => "\u{22EF}", '\ldots' => "\u{2026}",
            '\log' => 'log', '\ln' => 'ln', '\sin' => 'sin', '\cos' => 'cos', '\tan' => 'tan', '\exp' => 'exp',
        ];
        $keys = array_keys($pairs);
        usort($keys, static function ($a, $b) use ($pairs) { return strlen($b) - strlen($a); });
        $map = [];
        foreach ($keys as $k) { $map[$k] = $pairs[$k]; }
    }

    $t = $inner;
    foreach ($map as $cmd => $uni) { $t = str_replace($cmd, $uni, $t); }
    $t = preg_replace('/\\\\[a-zA-Z]+/', '', $t);
    $t = str_replace(['_', '^', '{', '}'], '', $t);
    $t = preg_replace('/\s+/', ' ', trim($t));
    return $t;
}

// Strip inline Markdown + custom macros down to the visible label text.
function chsw_clean(string $raw): string
{
    $t = $raw;
    $t = preg_replace('/\s+#+\s*$/', '', $t);
    $t = preg_replace('/!\[[^\]]*\]\([^)]*\)/', '', $t);
    $t = preg_replace('/\[([^\]]+)\]\([^)]*\)/', '$1', $t);
    $t = preg_replace_callback('/\\\\cite\[([^\]]*)\]\{[^}]*\}/', static function ($m) { return $m[1]; }, $t);
    $t = preg_replace('/\\\\(?:citeauthor|citeyear|citetitle|citeurl|cite|footcite)\{[^}]*\}/', '', $t);
    $t = preg_replace('/\\\\(?:sidenote|marginfig|sideimage|index|label)\{[^}]*\}(?:\s*\{[^}]*\})?/s', '', $t);
    $t = preg_replace('/`([^`]*)`/', '$1', $t);
    $t = preg_replace('/(\*\*|__)(.+?)\1/s', '$2', $t);
    $t = preg_replace('/(?<![\w*])(\*|_)(.+?)\1(?![\w*])/s', '$2', $t);
    $t = preg_replace_callback('/\$([^$\n]+?)\$/s', static function ($m) { return chsw_math($m[1]); }, $t);
    $t = preg_replace('/\s+/', ' ', $t);
    return trim($t);
}

$content = file_get_contents($file);
// Remove code, scripts and comments so only real Markdown headings remain
$text = preg_replace('#<pre[^>]*>.*?</pre>#is', "\n", $content);
$text = preg_replace('#<script[^>]*>.*?</script>#is', "\n", $text);
$text = preg_replace('#<!--.*?-->#s', "\n", $text);

$headings = [];
$used = [];
foreach (preg_split('/\r\n|\r|\n/', $text) as $line) {
    if (!preg_match('/^(\s{0,3})(#{2,6})\s+(.+?)\s*#*\s*$/', $line, $m)) continue;
    $level = strlen($m[2]);
    $id = chsw_slugify(chsw_clean($m[3]), $used);
    if ($level >= 2 && $level <= 3) {
        $headings[] = ['level' => $level, 'text' => chsw_clean($m[3]), 'id' => $id];
    }
}

echo json_encode(['slug' => $slug, 'headings' => $headings], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
