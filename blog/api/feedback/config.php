<?php
/**
 * Blog Feedback System — Configuration
 * -------------------------------------
 * Paths are deliberately OUTSIDE the web root so the SQLite database,
 * admin password hash, and patch files are never served directly —
 * even if .htaccess protection fails.
 *
 * Storage location — picked automatically at first run:
 *   1. /var/lib/asanai_feedback       (production, system-wide)
 *   2. ~/.asanai_feedback             (default; no sudo needed)
 *   3. <repo>/.feedback_data          (last-resort fallback)
 *
 * To move the data to a system-wide location, run once:
 *   sudo mkdir -p /var/lib/asanai_feedback
 *   sudo chown $USER:$USER /var/lib/asanai_feedback
 *   sudo chmod 775 /var/lib/asanai_feedback
 * The first writable directory above is used; override by exporting
 * ASANAI_FEEDBACK_DIR before calling any endpoint.
 */

if (!defined('FEEDBACK_BOOTSTRAP_LOADED')) {
	define('FEEDBACK_BOOTSTRAP_LOADED', true);

	/** Pick the first existing-or-creatable writable directory. */
	function feedback_resolve_data_dir(): string {
		$override = getenv('ASANAI_FEEDBACK_DIR');
		if ($override) return rtrim($override, '/');

		// Note: $_SERVER['HOME'] is empty under some SAPIs (CLI server,
		// Apache + mod_php with stripped env). Use getenv() everywhere.
		$home = getenv('HOME') ?: (posix_getpwuid(posix_geteuid())['dir'] ?? null);
		$candidates = [
			'/var/lib/asanai_feedback',
			'/var/lib/asanai-blog',
			$home ? ($home . '/.asanai_feedback') : null,
			dirname(__DIR__, 2) . '/.feedback_data',
		];
		$candidates = array_values(array_filter($candidates, function ($c) { return $c && $c !== ''; }));

		foreach ($candidates as $c) {
			if (is_dir($c) && is_writable($c)) return $c;
		}
		foreach ($candidates as $c) {
			if (@mkdir($c, 0775, true) && is_writable($c)) return $c;
		}
		// Last resort — return the first even if creation failed,
		// the health check will surface the problem to the user.
		return $candidates[0] ?? '';
	}

	$DATA_DIR = feedback_resolve_data_dir();

	define('FEEDBACK_DATA_DIR',    $DATA_DIR);
	define('FEEDBACK_DB_PATH',     $DATA_DIR . '/feedback.sqlite');
	define('FEEDBACK_PATCHES_DIR', $DATA_DIR . '/patches');

	/** Admin password file: prefer /etc/adminpw, fall back to data dir. */
	$ADMIN_PW = is_readable('/etc/adminpw') ? '/etc/adminpw'
		: (is_dir($DATA_DIR) ? ($DATA_DIR . '/adminpw') : '/etc/adminpw');
	define('FEEDBACK_ADMIN_PW_FILE', $ADMIN_PW);

	/** Absolute repo root (used by git_info.php). */
	define('FEEDBACK_REPO_ROOT', dirname(dirname(dirname(__DIR__))));

	define('FEEDBACK_ADMIN_COOKIE', 'fb_admin');
	define('FEEDBACK_ADMIN_TTL',    60 * 60 * 24 * 30);
	define('FEEDBACK_RATE_LIMIT',   12);
	define('FEEDBACK_RATE_WINDOW',  3600);

	$proto = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') ? 'https' : 'http';
	$host  = $_SERVER['HTTP_HOST'] ?? 'localhost';
	define('FEEDBACK_SITE_ORIGIN', $proto . '://' . $host);
}
