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
	if (PHP_SAPI === 'cli') {
		return;
	}
	$_mobile_is_cli_server = (PHP_SAPI === 'cli-server');

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

	// Endpoints and the private dashboard must not receive blog chrome CSS/JS.
	$_mobile_script = basename((string)($_SERVER['SCRIPT_FILENAME'] ?? ''));
	$_mobile_skip = in_array($_mobile_script, ['stats.php', 'track.php'], true);

	$_mobile_callback = function ($buffer) use ($_mobile_payload, &$_mobile_already_loaded, $_mobile_skip, $_mobile_is_cli_server) {
		if ($_mobile_skip) {
			return $buffer;
		}
		// Never touch JSON, CSV, images or other binary responses.
		$isHtml = preg_match('/^\s*<!DOCTYPE\s+html/i', $buffer) === 1
			|| preg_match('/^\s*<html/i', $buffer) === 1;
		if (!$isHtml) {
			return $buffer;
		}
		// Admin-only analytics health banner (injected right after <body>).
		if (function_exists('mn_analytics_alert_html')) {
			try {
				$alert = mn_analytics_alert_html();
				if ($alert !== '') {
					// Keep the admin/setup banner out of the boot screen. It is
					// revealed only after #loader has been removed by revealContent().
					$alert = str_replace(
						'<div role="alert" style="',
						'<div role="alert" id="mn-analytics-alert" style="display:none;',
						$alert
					);
					$alert .= '<script>(function(){var el=document.getElementById("mn-analytics-alert");if(!el)return;function show(){el.style.display="";}function wait(){var loader=document.getElementById("loader");if(!loader){show();return;}var obs=new MutationObserver(function(){if(!document.getElementById("loader")){obs.disconnect();show();}});obs.observe(document.body,{childList:true,subtree:true});}if(document.readyState==="loading"){document.addEventListener("DOMContentLoaded",wait,{once:true});}else{wait();}})();</script>';
					$withAlert = preg_replace_callback(
						'#<body([^>]*)>#i',
						static function (array $match) use ($alert): string {
							return '<body' . $match[1] . '>' . $alert;
						},
						$buffer,
						1
					);
					if (is_string($withAlert)) {
						$buffer = $withAlert;
					}
				}
			} catch (Throwable $e) {
				// Never break the page because of the health banner.
			}
		}
		// The test server skips the mobile CSS/JS injection, but the alert above
		// must still be testable there.
		if ($_mobile_is_cli_server) {
			return $buffer;
		}
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
