<?php
/**
 * Mobile / Responsive Polish Loader
 * --------------------------------------------------------------------
 * Outputs <link> + <script> tags for mobile.css and mobile.js.
 *
 * This file is included from index.php and index_full.php (the only
 * entry points we can safely modify). On standalone module pages
 * that go through functions.php's auto-render path, mobile.js
 * self-injects mobile.css at runtime as a fallback — see the
 * ensureMobileCSS() function in mobile.js.
 *
 * Both files are loaded with:
 *   - <link>  before the closing </head> (no FOUC on pages we own)
 *   - <script src="mobile.js" defer> so it never blocks render
 *     and runs AFTER start.js / helper.js (which it complements).
 *
 * Filemtime() is appended as a cache-buster query string so
 * edits to the files invalidate browser caches immediately.
 */
$_mobile_css_v  = file_exists(__DIR__ . '/mobile.css') ? filemtime(__DIR__ . '/mobile.css') : '';
$_mobile_js_v   = file_exists(__DIR__ . '/mobile.js')  ? filemtime(__DIR__ . '/mobile.js')  : '';
$_mobile_css_q  = $_mobile_css_v ? '?v=' . $_mobile_css_v : '';
$_mobile_js_q   = $_mobile_js_v  ? '?v=' . $_mobile_js_v  : '';
?>
<link rel="stylesheet" href="mobile.css<?php echo $_mobile_css_q; ?>" type="text/css" media="all">
<script src="mobile.js<?php echo $_mobile_js_q; ?>" defer></script>
