<?php
/**
 * Cache-Key-Helfer für asanai_blog_proxy.php
 *
 * In den Proxy übernehmen: Build-ID aus den Lesson-Dateien bilden und in den
 * Transient-/Cache-Key aufnehmen. Dadurch invalidiert jeder Deploy den Cache
 * automatisch, ohne manuelles Purge.
 */

function asanai_lesson_build($lessonDir) {
	$files = ['learnsys.js', 'learnsys.css', 'data.js', 'frame-height.js', 'nav-fix.js', '_page.php'];
	$build = 0;
	foreach ($files as $f) {
		$build = max($build, (int) @filemtime(rtrim($lessonDir, '/') . '/' . $f));
	}
	return $build;
}

/**
 * Beispiel für den Fetch im Proxy:
 *
 * $lessonDir = __DIR__ . '/eoy';                 // Pfad zu dieser Lesson
 * $target    = $lessonDir . '/1.php';            // gewünschte Datei
 * $build     = asanai_lesson_build($lessonDir);  // ändert sich bei jedem Deploy
 * $cacheKey  = 'asanai_proxy_' . md5($target) . '_' . $build;
 *
 * $html = get_transient($cacheKey);
 * if ($html === false) {
 *     $url  = 'http://localhost/asanai/blog/eoy/1?lang=de&build=' . $build;
 *     $resp = wp_remote_get($url, ['timeout' => 20]);
 *     $html = is_wp_error($resp) ? '' : wp_remote_retrieve_body($resp);
 *     set_transient($cacheKey, $html, HOUR_IN_SECONDS);
 * }
 * echo $html;
 *
 * Wichtig: Der Cache-Key MUSS die Build-ID enthalten. Dann wird nach jedem
 * Deploy automatisch ein neuer Key benutzt und der alte Eintrag läuft aus.
 * Zusätzlich beim Deploy:
 *   wp transient delete --all
 *   wp cache flush
 */
