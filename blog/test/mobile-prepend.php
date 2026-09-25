<?php
/**
 * Mobile / Responsive Auto-Prepend
 * --------------------------------------------------------------------
 * Registered via `.user.ini`'s `auto_prepend_file` directive so it
 * runs at the top of EVERY PHP script in this directory — including
 * standalone module pages that go through functions.php's auto-render
 * path (which we can't modify directly).
 *
 * What it does:
 *   1. Starts output buffering with a callback.
 *   2. The callback scans the buffered output for `</head>`.
 *   3. If found, injects <link> + <script> tags for mobile.css and
 *      mobile.js JUST BEFORE `</head>`, so they load on every page
 *      without disturbing the rest of the HTML.
 *   4. If mobile.css is already present in the buffer (e.g. because
 *      index.php / index_full.php include it explicitly), the
 *      injection is skipped to avoid duplicate <link> tags.
 *   5. For pages without an HTML <head> (e.g. pure JSON / redirects),
 *      the buffer is returned unchanged.
 *
 * Performance:
 *   - ob_start() with a callback is cheap; the callback only fires
 *     once per request when output is flushed.
 *   - The regex for </head> runs on the full buffer, but mobile.css
 *     injection is at most a 200-byte string append.
 *
 * Caching:
 *   - We append `?v=<filemtime>` to the CSS / JS URLs so browsers
 *     re-fetch the moment we edit either file.
 */

(function () {
	// Only run if we can actually emit HTML (skip CLI / no-server contexts).
	if (PHP_SAPI === 'cli' || PHP_SAPI === 'cli-server') {
		return;
	}

	// Already in a buffer started by us? Bail out (defensive against
	// future code that might also call ob_start).
	if (ob_get_level() > 0) {
		// We still try to attach our callback at the outermost level.
		// We'll register a different strategy: hook into shutdown.
		// For simplicity we just no-op here and rely on subsequent calls.
	}

	$_mobile_root     = __DIR__;
	$_mobile_css_file = $_mobile_root . DIRECTORY_SEPARATOR . 'mobile.css';
	$_mobile_js_file  = $_mobile_root . DIRECTORY_SEPARATOR . 'mobile.js';

	// Build cache-busted URLs.
	$_mobile_css_url  = 'mobile.css';
	$_mobile_js_url   = 'mobile.js';
	if (file_exists($_mobile_css_file)) {
		$_mobile_css_url .= '?v=' . filemtime($_mobile_css_file);
	}
	if (file_exists($_mobile_js_file)) {
		$_mobile_js_url  .= '?v=' . filemtime($_mobile_js_file);
	}

	$_mobile_payload  = "\n"
		. "\t<link rel=\"stylesheet\" href=\"" . $_mobile_css_url . "\" type=\"text/css\" media=\"all\">\n"
		. "\t<script src=\"" . $_mobile_js_url . "\" defer></script>\n";

	$_mobile_already_loaded = false;

	$_mobile_callback = function ($buffer) use ($_mobile_payload, &$_mobile_already_loaded) {
		// No <head>? Pass through (probably a redirect, JSON, or empty).
		if (stripos($buffer, '</head>') === false) {
			return $buffer;
		}
		// Already loaded (e.g. index.php included mobile-loader.php explicitly)?
		if (stripos($buffer, 'mobile.css') !== false) {
			return $buffer;
		}
		// Skip if the page is intentionally tiny (e.g. an error page < 200 bytes).
		if (strlen($buffer) < 200) {
			return $buffer;
		}
		// Inject just before </head>.
		return preg_replace(
			'#</head>#i',
			$_mobile_payload . '</head>',
			$buffer,
			1
		);
	};

	// Start the buffer at the outermost nesting level.
	// Using a unique flag so we don't double-register if this file is
	// somehow included again (shouldn't happen, but defensive).
	if (!defined('MOBILE_PREPEND_ACTIVE')) {
		define('MOBILE_PREPEND_ACTIVE', true);
		ob_start($_mobile_callback);
	}
})();
