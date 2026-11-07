<?php
declare(strict_types=1);

/**
 * Test-only auto_prepend for the mobile layout audit.
 *
 * Production injects mobile.css + mobile.js through blog/.user.ini and
 * blog/.htaccess. The PHP built-in server used by tests ignores those
 * directives, and blog/mobile-prepend.php deliberately skips cli-server.
 * This file reproduces the production wiring for the test server only:
 *
 *   - top-level blog pages get mobile.css + mobile.js,
 *   - blog/tenminutes has its own bootstrap and styles, so it only gets
 *     its bootstrap (never the blog-wide mobile layer),
 *   - JSON, redirects and non-HTML responses pass through untouched.
 */

if (PHP_SAPI === 'cli') {
	return;
}

$script = str_replace('\\', '/', (string) ($_SERVER['SCRIPT_FILENAME'] ?? ''));

if (strpos($script, '/tenminutes/') !== false) {
	require_once __DIR__ . '/../tenminutes/bootstrap.php';
	return;
}

$css_file = dirname(__DIR__) . '/mobile.css';
$js_file  = dirname(__DIR__) . '/mobile.js';
$css_url  = '/mobile.css' . (is_file($css_file) ? '?v=' . filemtime($css_file) : '');
$js_url   = '/mobile.js' . (is_file($js_file) ? '?v=' . filemtime($js_file) : '');
$payload  = "\n"
	. "\t<link rel=\"stylesheet\" href=\"" . $css_url . "\" type=\"text/css\" media=\"all\">\n"
	. "\t<script src=\"" . $js_url . "\" defer></script>\n";

ob_start(static function (string $buffer) use ($payload): string {
	$is_html = stripos($buffer, '<!DOCTYPE') !== false
		|| stripos($buffer, '<html') !== false;
	if (!$is_html) {
		return $buffer;
	}
	if (stripos($buffer, '</head>') === false) {
		return $buffer;
	}
	if (stripos($buffer, 'mobile.css') !== false) {
		return $buffer;
	}
	if (strlen($buffer) < 200) {
		return $buffer;
	}
	return preg_replace('#</head>#i', $payload . '</head>', $buffer, 1) ?? $buffer;
});
