<?php
/*
 * Anonymous blog analytics.
 *
 * Privacy design (see stats.php for the user-facing explanation):
 *   - no IP address, no user agent, no cookies, no localStorage/sessionStorage
 *   - no fingerprinting, no cross-site tracking, no cross-page identifier
 *   - one random per-pageview token, used only to join heartbeats and then
 *     erased from the database (finalized or after six hours)
 *   - timestamps are truncated to the hour; external referrers keep only the
 *     host (no path, no query), internal referrers keep only the previous slug
 *   - DNT / GPC are honoured server-side and client-side
 *
 * The database is a small SQLite file below blog/analytics_data/ which is
 * denied to the web by its own .htaccess. Nothing here uses remote IPs.
 */

function mn_analytics_disabled_file(): string {
	return dirname(__DIR__) . '/.analytics_disabled';
}

function mn_analytics_is_kill_switched(): bool {
	if (getenv('MN_ANALYTICS_TEST_MODE') === '1') {
		return false;
	}
	return is_file(mn_analytics_disabled_file());
}

function mn_analytics_disabled_reason(): string {
	$file = mn_analytics_disabled_file();
	if (!is_file($file) || !is_readable($file)) {
		return '';
	}
	$raw = @file_get_contents($file, false, null, 0, 512);
	if ($raw === false) {
		return '';
	}
	$lines = preg_split('/\R/', $raw);
	return trim((string)($lines[0] ?? ''));
}

function mn_analytics_is_disabled(): bool {
	if (getenv('MN_ANALYTICS_TEST_MODE') === '1') {
		return false;
	}
	if (mn_analytics_is_kill_switched()) {
		return true;
	}
	if (PHP_SAPI === 'cli' || PHP_SAPI === 'cli-server') {
		return true;
	}
	if (defined('MN_ANALYTICS_DISABLED') && MN_ANALYTICS_DISABLED) {
		return true;
	}
	if (getenv('MN_ANALYTICS_DISABLED') === '1') {
		return true;
	}
	return false;
}

function mn_analytics_is_opted_out(): bool {
	if (isset($_SERVER['HTTP_DNT']) && (string)$_SERVER['HTTP_DNT'] === '1') {
		return true;
	}
	if (isset($_SERVER['HTTP_SEC_GPC']) && (string)$_SERVER['HTTP_SEC_GPC'] === '1') {
		return true;
	}
	if (isset($_COOKIE['mn_stats_exclude']) && (string)$_COOKIE['mn_stats_exclude'] === '1') {
		return true;
	}
	return false;
}

function mn_analytics_is_prefetch(): bool {
	$purpose = '';
	if (isset($_SERVER['HTTP_SEC_PURPOSE'])) {
		$purpose = (string)$_SERVER['HTTP_SEC_PURPOSE'];
	} elseif (isset($_SERVER['HTTP_PURPOSE'])) {
		$purpose = (string)$_SERVER['HTTP_PURPOSE'];
	}
	$purpose = strtolower($purpose);
	return str_contains($purpose, 'prefetch') || str_contains($purpose, 'prerender');
}

function mn_analytics_data_dir(): string {
	return dirname(__DIR__) . '/analytics_data';
}

function mn_analytics_config(): array {
	static $config = null;
	static $loaded = false;
	if ($loaded) {
		return is_array($config) ? $config : [];
	}
	$loaded = true;
	$file = __DIR__ . '/analytics_config.php';
	if (!is_file($file)) {
		$config = [];
		return $config;
	}
	if (!is_readable($file)) {
		$GLOBALS['mn_analytics_config_error'] = 'The configuration file is not readable: ' . $file;
		$config = [];
		return $config;
	}
	try {
		$loadedConfig = require $file;
		if (is_array($loadedConfig)) {
			$config = $loadedConfig;
		} else {
			$GLOBALS['mn_analytics_config_error'] = 'The configuration file must return an array: ' . $file;
			$config = [];
		}
	} catch (Throwable $e) {
		$GLOBALS['mn_analytics_config_error'] = 'The configuration file could not be loaded: ' . $e->getMessage();
		$config = [];
	}
	return $config;
}

function mn_analytics_system_config_file(): string {
	return '/etc/asanai_blog_path';
}

function mn_analytics_system_path(): string {
	static $cached = null;
	if ($cached !== null) {
		return $cached;
	}
	$file = mn_analytics_system_config_file();
	if (!is_file($file)) {
		$cached = '';
		return '';
	}
	if (!is_readable($file)) {
		$GLOBALS['mn_analytics_system_path_error'] = 'The file exists but is not readable: ' . $file;
		$cached = '';
		return '';
	}
	$raw = @file_get_contents($file);
	if ($raw === false) {
		$GLOBALS['mn_analytics_system_path_error'] = 'The file could not be read: ' . $file;
		$cached = '';
		return '';
	}
	$lines = preg_split('/\R/', $raw);
	$line = trim((string)($lines[0] ?? ''));
	if ($line === '' || str_starts_with($line, '#')) {
		$GLOBALS['mn_analytics_system_path_error'] = 'The file does not contain a path: ' . $file;
		$cached = '';
		return '';
	}
	$cached = $line;
	return $line;
}

function mn_analytics_resolve_db_path(string $configured): string {
	$configured = trim($configured);
	if ($configured === '' || str_contains($configured, "\0")) {
		return '';
	}
	$configured = str_replace('\\', '/', $configured);
	if ($configured === '' || $configured[0] !== '/') {
		return '';
	}
	if (preg_match('/\.(?:sqlite3?|db)$/i', $configured) === 1) {
		return $configured;
	}
	return rtrim($configured, '/') . '/analytics.sqlite';
}

function mn_analytics_home_dir(): string {
	$home = '';
	if (function_exists('posix_geteuid') && function_exists('posix_getpwuid')) {
		$user = posix_getpwuid(posix_geteuid());
		if (is_array($user) && !empty($user['dir'])) {
			$home = (string)$user['dir'];
		}
	}
	if ($home === '' && !empty($_SERVER['HOME'])) {
		$home = (string)$_SERVER['HOME'];
	}
	if ($home === '') {
		$env = getenv('HOME');
		if (is_string($env) && $env !== '') {
			$home = $env;
		}
	}
	if ($home === '') {
		return '';
	}
	return rtrim(str_replace('\\', '/', $home), '/');
}

function mn_analytics_default_db_path(): string {
	$home = mn_analytics_home_dir();
	if ($home !== '') {
		return $home . '/.asanai-blog/analytics.sqlite';
	}
	return mn_analytics_data_dir() . '/analytics.sqlite';
}

function mn_analytics_is_default_home_path(string $path): bool {
	$home = mn_analytics_home_dir();
	return $home !== '' && $path === $home . '/.asanai-blog/analytics.sqlite';
}

function mn_analytics_db_path(): string {
	$custom = getenv('MN_ANALYTICS_DB');
	if (is_string($custom) && $custom !== '') {
		$resolved = mn_analytics_resolve_db_path($custom);
		if ($resolved !== '') {
			return $resolved;
		}
		$GLOBALS['mn_analytics_env_path_error'] = 'MN_ANALYTICS_DB must be an absolute path to a directory or .sqlite file.';
	}
	$system = mn_analytics_system_path();
	if ($system !== '') {
		$resolved = mn_analytics_resolve_db_path($system);
		if ($resolved !== '') {
			return $resolved;
		}
		$GLOBALS['mn_analytics_system_path_error'] = 'The path in /etc/asanai_blog_path must be absolute.';
	}
	$config = mn_analytics_config();
	$configured = $config['db_path'] ?? '';
	if (is_string($configured) && $configured !== '') {
		$resolved = mn_analytics_resolve_db_path($configured);
		if ($resolved !== '') {
			return $resolved;
		}
		$GLOBALS['mn_analytics_config_path_error'] = 'db_path in blog/lib/analytics_config.php must be an absolute path.';
	}
	return mn_analytics_default_db_path();
}

function mn_analytics_db_path_source(): string {
	$custom = getenv('MN_ANALYTICS_DB');
	if (is_string($custom) && $custom !== '' && mn_analytics_resolve_db_path($custom) !== '') {
		return 'Environment variable MN_ANALYTICS_DB';
	}
	$system = mn_analytics_system_path();
	if ($system !== '' && mn_analytics_resolve_db_path($system) !== '') {
		return '/etc/asanai_blog_path';
	}
	$config = mn_analytics_config();
	$configured = $config['db_path'] ?? '';
	if (is_string($configured) && $configured !== '' && mn_analytics_resolve_db_path($configured) !== '') {
		return 'blog/lib/analytics_config.php';
	}
	if (mn_analytics_home_dir() !== '') {
		return 'User home default (~/.asanai-blog/analytics.sqlite)';
	}
	return 'Fallback (blog/analytics_data/analytics.sqlite)';
}

function mn_analytics_normalize_path(string $path): string {
	$path = str_replace('\\', '/', $path);
	$real = @realpath($path);
	if (is_string($real) && $real !== '') {
		$path = $real;
	}
	return rtrim($path, '/');
}

function mn_analytics_path_inside_webroot(string $path): bool {
	$webroot = mn_analytics_normalize_path(dirname(__DIR__));
	$target = mn_analytics_normalize_path($path);
	return $target === $webroot || str_starts_with($target . '/', $webroot . '/');
}

function mn_analytics_ensure_data_dir(): bool {
	$dbPath = mn_analytics_db_path();
	$dir = dirname($dbPath);
	if (is_link($dir) || is_link($dbPath)) {
		return false;
	}
	if (file_exists($dbPath) && !is_file($dbPath)) {
		return false;
	}
	if (!is_dir($dir)) {
		@mkdir($dir, 0775, true);
	}
	if (!is_dir($dir) || !is_writable($dir)) {
		return false;
	}
	if (mn_analytics_path_inside_webroot($dir)) {
		$htaccess = $dir . '/.htaccess';
		if (!file_exists($htaccess)) {
			$rules = "<IfModule mod_authz_core.c>\n"
				. "  Require all denied\n"
				. "</IfModule>\n"
				. "<IfModule !mod_authz_core.c>\n"
				. "  Order allow,deny\n"
				. "  Deny from all\n"
				. "</IfModule>\n"
				. "Options -Indexes\n";
			@file_put_contents($htaccess, $rules);
		}
	}
	return true;
}

function mn_analytics_web_user(): string {
	if (function_exists('posix_geteuid') && function_exists('posix_getpwuid')) {
		$user = posix_getpwuid(posix_geteuid());
		if (is_array($user) && !empty($user['name'])) {
			return (string)$user['name'];
		}
	}
	return get_current_user();
}

function mn_analytics_password_file(): string {
	$file = getenv('BLOG_STATS_PASSWORD_FILE');
	if (is_string($file) && $file !== '') {
		return $file;
	}
	if (isset($_SERVER['BLOG_STATS_PASSWORD_FILE']) && is_string($_SERVER['BLOG_STATS_PASSWORD_FILE'])) {
		return $_SERVER['BLOG_STATS_PASSWORD_FILE'];
	}
	return '/etc/blogpassword';
}

function mn_analytics_password_line(): string {
	$file = mn_analytics_password_file();
	if (!is_readable($file)) {
		return '';
	}
	$raw = @file_get_contents($file);
	if ($raw === false) {
		return '';
	}
	$lines = preg_split('/\R/', $raw);
	$line = is_array($lines) && isset($lines[0]) ? (string)$lines[0] : '';
	if (str_starts_with($line, "\xEF\xBB\xBF")) {
		$line = substr($line, 3);
	}
	return $line;
}

function mn_analytics_admin_token(): string {
	$line = mn_analytics_password_line();
	if ($line === '') {
		return '';
	}
	return hash_hmac('sha256', 'mn-stats-admin-v1', $line);
}

function mn_analytics_is_admin_visitor(): bool {
	$cookie = $_COOKIE['mn_stats_admin'] ?? '';
	if (!is_string($cookie) || $cookie === '') {
		return false;
	}
	$token = mn_analytics_admin_token();
	return $token !== '' && hash_equals($token, $cookie);
}

function mn_analytics_stats_path(): string {
	$script = isset($_SERVER['SCRIPT_NAME']) ? (string)$_SERVER['SCRIPT_NAME'] : '';
	$dir = $script !== '' ? rtrim(str_replace('\\', '/', dirname($script)), '/') : '';
	return ($dir === '' ? '' : $dir) . '/stats';
}

function mn_analytics_h(mixed $value): string {
	return htmlspecialchars((string)$value, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
}

function mn_analytics_init_db(PDO $pdo): void {
	$pdo->exec("CREATE TABLE IF NOT EXISTS pageviews (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		ts INTEGER NOT NULL,
		day TEXT NOT NULL,
		hour INTEGER NOT NULL,
		path TEXT NOT NULL,
		ref_type TEXT NOT NULL DEFAULT 'direct',
		ref_source TEXT NOT NULL DEFAULT '',
		ref_host TEXT NOT NULL DEFAULT '',
		ref_path TEXT NOT NULL DEFAULT '',
		browser TEXT NOT NULL DEFAULT '',
		browser_major INTEGER,
		os TEXT NOT NULL DEFAULT '',
		os_version TEXT NOT NULL DEFAULT '',
		device TEXT NOT NULL DEFAULT '',
		is_bot INTEGER NOT NULL DEFAULT 0,
		bot_reason TEXT NOT NULL DEFAULT '',
		duration_sec INTEGER,
		scroll_pct INTEGER,
		completed INTEGER NOT NULL DEFAULT 0,
		token TEXT NOT NULL DEFAULT ''
	)");

	$columns = [
		'browser' => "TEXT NOT NULL DEFAULT ''",
		'browser_major' => 'INTEGER',
		'os' => "TEXT NOT NULL DEFAULT ''",
		'os_version' => "TEXT NOT NULL DEFAULT ''",
		'device' => "TEXT NOT NULL DEFAULT ''",
		'is_bot' => 'INTEGER NOT NULL DEFAULT 0',
		'bot_reason' => "TEXT NOT NULL DEFAULT ''",
	];
	$existing = [];
	foreach ($pdo->query('PRAGMA table_info(pageviews)') as $row) {
		if (isset($row['name'])) {
			$existing[(string)$row['name']] = true;
		}
	}
	foreach ($columns as $name => $definition) {
		if (!isset($existing[$name])) {
			$pdo->exec("ALTER TABLE pageviews ADD COLUMN $name $definition");
		}
	}
	$pdo->exec("UPDATE pageviews SET browser = 'Unknown' WHERE browser = ''");
	$pdo->exec("UPDATE pageviews SET os = 'Unknown' WHERE os = ''");
	$pdo->exec("UPDATE pageviews SET device = 'unknown' WHERE device = ''");

	$pdo->exec("CREATE INDEX IF NOT EXISTS idx_pv_ts ON pageviews(ts)");
	$pdo->exec("CREATE INDEX IF NOT EXISTS idx_pv_day ON pageviews(day)");
	$pdo->exec("CREATE INDEX IF NOT EXISTS idx_pv_path ON pageviews(path)");
	$pdo->exec("CREATE INDEX IF NOT EXISTS idx_pv_ref ON pageviews(ref_type, ref_source)");
	$pdo->exec("CREATE INDEX IF NOT EXISTS idx_pv_browser ON pageviews(browser, browser_major)");
	$pdo->exec("CREATE INDEX IF NOT EXISTS idx_pv_os ON pageviews(os, os_version)");
	$pdo->exec("CREATE INDEX IF NOT EXISTS idx_pv_device ON pageviews(device)");
	$pdo->exec("CREATE INDEX IF NOT EXISTS idx_pv_pending ON pageviews(completed, ts)");
	$pdo->exec("CREATE INDEX IF NOT EXISTS idx_pv_token ON pageviews(token) WHERE token <> ''");
	$pdo->exec("CREATE TABLE IF NOT EXISTS meta (key TEXT PRIMARY KEY, value TEXT NOT NULL)");
	$pdo->exec("CREATE TABLE IF NOT EXISTS pageview_sections (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		pageview_id INTEGER NOT NULL,
		path TEXT NOT NULL DEFAULT '',
		section_index INTEGER NOT NULL DEFAULT 0,
		section_key TEXT NOT NULL DEFAULT '',
		section_label TEXT NOT NULL DEFAULT '',
		visible_pct INTEGER NOT NULL DEFAULT 0,
		dwell_sec INTEGER NOT NULL DEFAULT 0,
		UNIQUE(pageview_id, section_index)
	)");
	$pdo->exec("CREATE INDEX IF NOT EXISTS idx_pvs_path ON pageview_sections(path, section_index)");
	$pdo->exec("CREATE INDEX IF NOT EXISTS idx_pvs_pageview ON pageview_sections(pageview_id)");
	$pdo->exec("CREATE TABLE IF NOT EXISTS pageview_events (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		pageview_id INTEGER NOT NULL,
		path TEXT NOT NULL DEFAULT '',
		kind TEXT NOT NULL DEFAULT '',
		target TEXT NOT NULL DEFAULT '',
		value INTEGER,
		UNIQUE(pageview_id, kind, target, value)
	)");
	$pdo->exec("CREATE INDEX IF NOT EXISTS idx_pve_path ON pageview_events(path, kind)");
	$pdo->exec("CREATE INDEX IF NOT EXISTS idx_pve_pageview ON pageview_events(pageview_id)");
}

function mn_analytics_maybe_migrate_legacy_db(string $path): void {
	$legacy = mn_analytics_data_dir() . '/analytics.sqlite';
	if (is_link($path) || (file_exists($path) && !is_file($path))) {
		return;
	}
	if ($path === $legacy || is_file($path) || !is_file($legacy)) {
		return;
	}
	$dir = dirname($path);
	if (!is_dir($dir) || !is_writable($dir)) {
		return;
	}
	if (@copy($legacy, $path)) {
		@chmod($path, 0660);
	}
}

function mn_analytics_open_db(bool $readOnly = false): ?PDO {
	static $pdo = null;
	static $tried = false;
	if ($tried) {
		return $pdo;
	}
	$tried = true;

	$dbPath = mn_analytics_db_path();
	if ($readOnly) {
		if (!is_file($dbPath) || is_link($dbPath)) {
			$GLOBALS['mn_analytics_db_error'] = 'The database file does not exist or is a symbolic link.';
			return null;
		}
	} else {
		if (!mn_analytics_ensure_data_dir()) {
			return null;
		}
		if (mn_analytics_is_default_home_path($dbPath)) {
			mn_analytics_maybe_migrate_legacy_db($dbPath);
		}
	}

	try {
		$options = [
			PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
			PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
			PDO::ATTR_EMULATE_PREPARES => false,
		];
		if ($readOnly && defined('PDO::SQLITE_ATTR_OPEN_FLAGS') && defined('PDO::SQLITE_OPEN_READONLY')) {
			$options[PDO::SQLITE_ATTR_OPEN_FLAGS] = PDO::SQLITE_OPEN_READONLY;
		}
		$pdo = new PDO('sqlite:' . $dbPath, null, null, $options);
		if ($readOnly) {
			$pdo->exec('PRAGMA query_only=ON');
			$pdo->exec('PRAGMA busy_timeout=5000');
			return $pdo;
		}
		@chmod($dbPath, 0660);
		$pdo->query('PRAGMA journal_mode=DELETE')->fetchColumn();
		$pdo->exec('PRAGMA synchronous=NORMAL');
		$pdo->exec('PRAGMA busy_timeout=5000');
		$version = (int)$pdo->query('PRAGMA user_version')->fetchColumn();
		if ($version < 6) {
			mn_analytics_init_db($pdo);
			$pdo->exec('PRAGMA user_version=6');
		}
		return $pdo;
	} catch (Throwable $e) {
		$GLOBALS['mn_analytics_db_error'] = $e->getMessage();
		$pdo = null;
		return null;
	}
}

function mn_analytics_slug_from_path(string $path): string {
	$path = (string)(parse_url($path, PHP_URL_PATH) ?? '');
	$trimmed = trim($path, '/');
	if ($trimmed === '') {
		return 'index';
	}
	$parts = explode('/', $trimmed);
	$last = (string)end($parts);
	$blog_dir = basename(dirname(__DIR__));
	if ($last === $blog_dir || $last === 'index' || $last === 'index.php') {
		return 'index';
	}
	if (str_ends_with($last, '.php')) {
		$last = substr($last, 0, -4);
	}
	$last = (string)preg_replace('/[^a-zA-Z0-9_-]/', '', $last);
	return $last !== '' ? $last : 'index';
}

function mn_analytics_current_slug(): ?string {
	$file = isset($_SERVER['SCRIPT_FILENAME']) ? (string)$_SERVER['SCRIPT_FILENAME'] : '';
	$base = $file !== '' ? basename($file, '.php') : '';
	if ($base === '') {
		$uri = isset($_SERVER['REQUEST_URI']) ? (string)$_SERVER['REQUEST_URI'] : '/';
		$base = mn_analytics_slug_from_path(strtok($uri, '?') ?: '/');
	}
	if (!preg_match('/^[a-zA-Z0-9_-]{1,80}$/', $base)) {
		return null;
	}
	$skip = [
		'functions', 'track', 'stats', 'search', 'search_lib', 'image',
		'mobile-prepend', 'mobile-loader', 'asanai_blog_proxy', 'headings',
	];
	if (in_array($base, $skip, true)) {
		return null;
	}
	return $base;
}

function mn_analytics_current_host(): string {
	$host = '';
	if (isset($_SERVER['HTTP_HOST'])) {
		$host = (string)$_SERVER['HTTP_HOST'];
	} elseif (isset($_SERVER['SERVER_NAME'])) {
		$host = (string)$_SERVER['SERVER_NAME'];
	}
	if ($host === '') {
		return '';
	}
	$parts = @parse_url('http://' . $host);
	if (is_array($parts) && !empty($parts['host'])) {
		return (string)$parts['host'];
	}
	return $host;
}

function mn_analytics_normalize_host(string $host): string {
	$host = strtolower(trim($host, " \t\n\r\0\x0B."));
	if (str_starts_with($host, 'www.')) {
		$host = substr($host, 4);
	}
	if (strlen($host) > 120) {
		$host = substr($host, 0, 120);
	}
	if (!preg_match('/^[a-z0-9.\-:\[\]]+$/', $host)) {
		return '';
	}
	return $host;
}

function mn_analytics_host_is(string $host, string $domain): bool {
	if ($host === $domain) {
		return true;
	}
	return str_ends_with($host, '.' . $domain);
}

function mn_analytics_classify_host(string $host): array {
	$h = strtolower($host);

	$domains = [
		'gemini.google.com' => ['search', 'Google Gemini'],
		'chat.openai.com' => ['search', 'ChatGPT'],
		'chatgpt.com' => ['search', 'ChatGPT'],
		'claude.ai' => ['search', 'Claude'],
		'perplexity.ai' => ['search', 'Perplexity'],
		'search.brave.com' => ['search', 'Brave Search'],
		'startpage.com' => ['search', 'Startpage'],
		'duckduckgo.com' => ['search', 'DuckDuckGo'],
		'bing.com' => ['search', 'Bing'],
		'ecosia.org' => ['search', 'Ecosia'],
		'qwant.com' => ['search', 'Qwant'],
		'mojeek.com' => ['search', 'Mojeek'],
		'kagi.com' => ['search', 'Kagi'],
		'baidu.com' => ['search', 'Baidu'],
		'search.yahoo.com' => ['search', 'Yahoo'],
		'yahoo.com' => ['search', 'Yahoo'],
		'ya.ru' => ['search', 'Yandex'],
		'yandex.com' => ['search', 'Yandex'],
		'yandex.ru' => ['search', 'Yandex'],
		'news.ycombinator.com' => ['social', 'Hacker News'],
		'mastodon.social' => ['social', 'Mastodon'],
		'x.com' => ['social', 'X / Twitter'],
		'twitter.com' => ['social', 'X / Twitter'],
		't.co' => ['social', 'X / Twitter'],
		'facebook.com' => ['social', 'Facebook'],
		'fb.com' => ['social', 'Facebook'],
		'linkedin.com' => ['social', 'LinkedIn'],
		'lnkd.in' => ['social', 'LinkedIn'],
		'reddit.com' => ['social', 'Reddit'],
		'redd.it' => ['social', 'Reddit'],
		'bsky.app' => ['social', 'Bluesky'],
		'threads.net' => ['social', 'Threads'],
		'instagram.com' => ['social', 'Instagram'],
		'youtube.com' => ['social', 'YouTube'],
		'youtu.be' => ['social', 'YouTube'],
		'tiktok.com' => ['social', 'TikTok'],
		'whatsapp.com' => ['social', 'WhatsApp'],
		'wa.me' => ['social', 'WhatsApp'],
		'telegram.org' => ['social', 'Telegram'],
		't.me' => ['social', 'Telegram'],
		'discord.com' => ['social', 'Discord'],
		'discord.gg' => ['social', 'Discord'],
		'weibo.com' => ['social', 'Weibo'],
		'zhihu.com' => ['social', 'Zhihu'],
		'douyin.com' => ['social', 'Douyin'],
		'bilibili.com' => ['social', 'Bilibili'],
		'vk.com' => ['social', 'VK'],
		'ok.ru' => ['social', 'OK.ru'],
	];

	foreach ($domains as $domain => $label) {
		if (mn_analytics_host_is($h, $domain)) {
			return ['type' => $label[0], 'source' => $label[1]];
		}
	}

	$patterns = [
		'/^(?:[a-z0-9-]+\.)*google\.[a-z.]+$/' => ['search', 'Google'],
		'/^(?:[a-z0-9-]+\.)*yandex\.[a-z.]+$/' => ['search', 'Yandex'],
		'/^(?:[a-z0-9-]+\.)*pinterest\.[a-z.]+$/' => ['social', 'Pinterest'],
		'/^(?:[a-z0-9-]+\.)*mastodon\.[a-z.]+$/' => ['social', 'Mastodon'],
		'/searx/' => ['search', 'SearXNG'],
		'/marginalia/' => ['search', 'Marginalia'],
	];
	foreach ($patterns as $pattern => $label) {
		if (preg_match($pattern, $h)) {
			return ['type' => $label[0], 'source' => $label[1]];
		}
	}

	return ['type' => 'external', 'source' => $host];
}

function mn_analytics_parse_referrer(string $ref): array {
	$out = ['type' => 'direct', 'source' => '', 'host' => '', 'path' => ''];
	$ref = trim($ref);
	if ($ref === '') {
		return $out;
	}
	$parts = @parse_url($ref);
	if (!is_array($parts) || empty($parts['scheme']) || empty($parts['host'])) {
		return $out;
	}
	$scheme = strtolower((string)$parts['scheme']);
	if ($scheme !== 'http' && $scheme !== 'https') {
		$out['type'] = 'external';
		$out['source'] = $scheme;
		return $out;
	}
	$host = mn_analytics_normalize_host((string)$parts['host']);
	if ($host === '') {
		return $out;
	}
	$out['host'] = $host;

	$current = mn_analytics_normalize_host(mn_analytics_current_host());
	if ($current !== '' && $host === $current) {
		$out['type'] = 'internal';
		$out['path'] = mn_analytics_slug_from_path((string)($parts['path'] ?? ''));
		return $out;
	}

	$class = mn_analytics_classify_host($host);
	$out['type'] = $class['type'];
	$out['source'] = $class['source'];
	// Deliberately no external path or query: only the host is retained.
	return $out;
}

/*
 * Coarse, non-identifying client categories.
 *
 * The raw User-Agent is read once per pageview and never stored. We keep only
 * the browser family, its major version, the OS family/version, a coarse
 * device class and a bot flag. These are the fields the dashboard aggregates;
 * they are not linked to a person or to a persistent identifier.
 */
function mn_analytics_bot_rules(): array {
	return [
		['label' => 'Googlebot', 'hint' => 'User-Agent contains “Googlebot”', 'regex' => '/googlebot/i'],
		['label' => 'Bingbot', 'hint' => 'User-Agent contains “bingbot”', 'regex' => '/bingbot/i'],
		['label' => 'BingPreview', 'hint' => 'User-Agent contains “BingPreview”', 'regex' => '/bingpreview/i'],
		['label' => 'YandexBot', 'hint' => 'User-Agent contains “YandexBot”', 'regex' => '/yandexbot/i'],
		['label' => 'DuckDuckBot', 'hint' => 'User-Agent contains “DuckDuckBot”', 'regex' => '/duckduckbot/i'],
		['label' => 'Applebot', 'hint' => 'User-Agent contains “Applebot”', 'regex' => '/applebot/i'],
		['label' => 'Baidu Spider', 'hint' => 'User-Agent contains “Baiduspider”', 'regex' => '/baiduspider/i'],
		['label' => 'PetalBot', 'hint' => 'User-Agent contains “PetalBot”', 'regex' => '/petalbot/i'],
		['label' => 'MJ12bot', 'hint' => 'User-Agent contains “MJ12bot”', 'regex' => '/mj12bot/i'],
		['label' => 'DotBot', 'hint' => 'User-Agent contains “DotBot”', 'regex' => '/dotbot/i'],
		['label' => 'AhrefsBot', 'hint' => 'User-Agent contains “AhrefsBot”', 'regex' => '/ahrefsbot/i'],
		['label' => 'SemrushBot', 'hint' => 'User-Agent contains “SemrushBot”', 'regex' => '/semrushbot/i'],
		['label' => 'Bytespider', 'hint' => 'User-Agent contains “Bytespider”', 'regex' => '/bytespider/i'],
		['label' => 'Amazonbot', 'hint' => 'User-Agent contains “Amazonbot”', 'regex' => '/amazonbot/i'],
		['label' => 'GPTBot', 'hint' => 'User-Agent contains “GPTBot”', 'regex' => '/gptbot/i'],
		['label' => 'CCBot', 'hint' => 'User-Agent contains “CCBot”', 'regex' => '/ccbot/i'],
		['label' => 'ClaudeBot', 'hint' => 'User-Agent contains “ClaudeBot”', 'regex' => '/claudebot/i'],
		['label' => 'PerplexityBot', 'hint' => 'User-Agent contains “PerplexityBot”', 'regex' => '/perplexitybot/i'],
		['label' => 'OAI SearchBot', 'hint' => 'User-Agent contains “OAI-SearchBot”', 'regex' => '/oai-searchbot/i'],
		['label' => 'ChatGPT-User', 'hint' => 'User-Agent contains “ChatGPT-User”', 'regex' => '/chatgpt-user/i'],
		['label' => 'Facebook preview', 'hint' => 'User-Agent contains “facebookexternalhit”', 'regex' => '/facebookexternalhit/i'],
		['label' => 'Twitterbot', 'hint' => 'User-Agent contains “Twitterbot”', 'regex' => '/twitterbot/i'],
		['label' => 'LinkedInBot', 'hint' => 'User-Agent contains “LinkedInBot”', 'regex' => '/linkedinbot/i'],
		['label' => 'Discordbot', 'hint' => 'User-Agent contains “Discordbot”', 'regex' => '/discordbot/i'],
		['label' => 'Slackbot', 'hint' => 'User-Agent contains “Slackbot”', 'regex' => '/slackbot/i'],
		['label' => 'TelegramBot', 'hint' => 'User-Agent contains “TelegramBot”', 'regex' => '/telegrambot/i'],
		['label' => 'Pinterest preview', 'hint' => 'User-Agent contains “Pinterest/”', 'regex' => '/pinterest\//i'],
		['label' => 'WhatsApp preview', 'hint' => 'User-Agent contains “WhatsApp/”', 'regex' => '/whatsapp\//i'],
		['label' => 'Headless Chrome', 'hint' => 'User-Agent contains “HeadlessChrome”', 'regex' => '/headlesschrome/i'],
		['label' => 'Lighthouse', 'hint' => 'User-Agent contains “Lighthouse”', 'regex' => '/lighthouse/i'],
		['label' => 'PageSpeed', 'hint' => 'User-Agent contains “PageSpeed”', 'regex' => '/pagespeed/i'],
		['label' => 'GTmetrix', 'hint' => 'User-Agent contains “GTmetrix”', 'regex' => '/gtmetrix/i'],
		['label' => 'Pingdom', 'hint' => 'User-Agent contains “Pingdom”', 'regex' => '/pingdom/i'],
		['label' => 'UptimeRobot', 'hint' => 'User-Agent contains “UptimeRobot”', 'regex' => '/uptimerobot/i'],
		['label' => 'curl', 'hint' => 'User-Agent contains “curl/” (command-line HTTP client)', 'regex' => '/curl\//i'],
		['label' => 'Wget', 'hint' => 'User-Agent contains “Wget/” (command-line downloader)', 'regex' => '/wget\//i'],
		['label' => 'python-requests', 'hint' => 'User-Agent contains “python-requests”', 'regex' => '/python-requests/i'],
		['label' => 'python-urllib', 'hint' => 'User-Agent contains “python-urllib”', 'regex' => '/python-urllib/i'],
		['label' => 'Go HTTP client', 'hint' => 'User-Agent contains “Go-http-client”', 'regex' => '/go-http-client/i'],
		['label' => 'Java HTTP client', 'hint' => 'User-Agent contains “Java/”', 'regex' => '/java\//i'],
		['label' => 'OkHttp', 'hint' => 'User-Agent contains “okhttp”', 'regex' => '/okhttp/i'],
		['label' => 'Axios', 'hint' => 'User-Agent contains “axios/”', 'regex' => '/axios\//i'],
		['label' => 'node-fetch', 'hint' => 'User-Agent contains “node-fetch”', 'regex' => '/node-fetch/i'],
		['label' => 'Postman', 'hint' => 'User-Agent contains “PostmanRuntime”', 'regex' => '/postmanruntime/i'],
		['label' => 'Scrapy', 'hint' => 'User-Agent contains “Scrapy”', 'regex' => '/scrapy/i'],
		['label' => 'HTTP client', 'hint' => 'User-Agent contains “httpclient”', 'regex' => '/httpclient/i'],
		['label' => 'libwww-perl', 'hint' => 'User-Agent contains “libwww-perl”', 'regex' => '/libwww-perl/i'],
		['label' => 'aiohttp', 'hint' => 'User-Agent contains “aiohttp”', 'regex' => '/aiohttp/i'],
		['label' => 'Internet Archive', 'hint' => 'User-Agent contains “ia_archiver”', 'regex' => '/ia_archiver/i'],
		['label' => 'Generic bot/crawler', 'hint' => 'User-Agent contains a generic bot, crawler, spider or slurp token', 'regex' => '/(?<![a-z])bot\b|crawler|spider|slurp/i'],
	];
}

function mn_analytics_parse_client(): array {
	$ua = isset($_SERVER['HTTP_USER_AGENT']) ? (string)$_SERVER['HTTP_USER_AGENT'] : '';
	$is_bot = 0;
	$bot_reason = '';
	if ($ua !== '') {
		foreach (mn_analytics_bot_rules() as $rule) {
			if (preg_match($rule['regex'], $ua)) {
				$is_bot = 1;
				$bot_reason = $rule['label'];
				break;
			}
		}
	}

	$browser = '';
	$browser_major = null;

	if (!$is_bot && $ua !== '') {
		$ch_ua = isset($_SERVER['HTTP_SEC_CH_UA']) ? (string)$_SERVER['HTTP_SEC_CH_UA'] : '';
		if ($ch_ua !== '' && preg_match_all('/"([^"]+)";v="([0-9]+)"/', $ch_ua, $matches, PREG_SET_ORDER)) {
			$brands = [];
			foreach ($matches as $match) {
				$brands[(string)$match[1]] = (int)$match[2];
			}
			$brand_map = [
				'Microsoft Edge' => 'Edge',
				'Google Chrome' => 'Chrome',
				'Opera' => 'Opera',
				'Brave' => 'Brave',
				'Vivaldi' => 'Vivaldi',
				'Samsung Internet' => 'Samsung Internet',
				'Yandex' => 'Yandex Browser',
				'DuckDuckGo' => 'DuckDuckGo',
				'UC Browser' => 'UC Browser',
				'QQ Browser' => 'QQ Browser',
				'Maxthon' => 'Maxthon',
				'Chromium' => 'Chromium',
			];
			foreach ($brand_map as $brand => $label) {
				if (isset($brands[$brand])) {
					$browser = $label;
					$browser_major = $brands[$brand];
					break;
				}
			}
		}

		if ($browser === '') {
			if (preg_match('/Edg(?:A|iOS)?\/(\d+)/i', $ua, $m)) {
				$browser = 'Edge';
				$browser_major = (int)$m[1];
			} elseif (preg_match('/(?:OPR|OPiOS|Opera)\/(\d+)/i', $ua, $m)) {
				$browser = 'Opera';
				$browser_major = (int)$m[1];
			} elseif (preg_match('/SamsungBrowser\/(\d+)/i', $ua, $m)) {
				$browser = 'Samsung Internet';
				$browser_major = (int)$m[1];
			} elseif (preg_match('/Vivaldi\/(\d+)/i', $ua, $m)) {
				$browser = 'Vivaldi';
				$browser_major = (int)$m[1];
			} elseif (preg_match('/YaBrowser\/(\d+)/i', $ua, $m)) {
				$browser = 'Yandex Browser';
				$browser_major = (int)$m[1];
			} elseif (preg_match('/UCBrowser\/(\d+)/i', $ua, $m)) {
				$browser = 'UC Browser';
				$browser_major = (int)$m[1];
			} elseif (preg_match('/MiuiBrowser\/(\d+)/i', $ua, $m)) {
				$browser = 'MIUI Browser';
				$browser_major = (int)$m[1];
			} elseif (preg_match('/HuaweiBrowser\/(\d+)/i', $ua, $m)) {
				$browser = 'Huawei Browser';
				$browser_major = (int)$m[1];
			} elseif (preg_match('/HeyTapBrowser\/(\d+)/i', $ua, $m)) {
				$browser = 'HeyTap Browser';
				$browser_major = (int)$m[1];
			} elseif (preg_match('/DuckDuckGo\/(\d+)/i', $ua, $m)) {
				$browser = 'DuckDuckGo';
				$browser_major = (int)$m[1];
			} elseif (preg_match('/QQBrowser\/(\d+)/i', $ua, $m)) {
				$browser = 'QQ Browser';
				$browser_major = (int)$m[1];
			} elseif (preg_match('/Maxthon\/(\d+)/i', $ua, $m)) {
				$browser = 'Maxthon';
				$browser_major = (int)$m[1];
			} elseif (preg_match('/PaleMoon\/(\d+)/i', $ua, $m)) {
				$browser = 'PaleMoon';
				$browser_major = (int)$m[1];
			} elseif (preg_match('/Waterfox\/(\d+)/i', $ua, $m)) {
				$browser = 'Waterfox';
				$browser_major = (int)$m[1];
			} elseif (preg_match('/SeaMonkey\/(\d+)/i', $ua, $m)) {
				$browser = 'SeaMonkey';
				$browser_major = (int)$m[1];
			} elseif (preg_match('/Falkon\/(\d+)/i', $ua, $m)) {
				$browser = 'Falkon';
				$browser_major = (int)$m[1];
			} elseif (preg_match('/Konqueror\/(\d+)/i', $ua, $m)) {
				$browser = 'Konqueror';
				$browser_major = (int)$m[1];
			} elseif (preg_match('/Epiphany\/(\d+)/i', $ua, $m)) {
				$browser = 'Epiphany';
				$browser_major = (int)$m[1];
			} elseif (preg_match('/FxiOS\/(\d+)/i', $ua, $m)) {
				$browser = 'Firefox';
				$browser_major = (int)$m[1];
			} elseif (preg_match('/Firefox\/(\d+)/i', $ua, $m)) {
				$browser = 'Firefox';
				$browser_major = (int)$m[1];
			} elseif (preg_match('/CriOS\/(\d+)/i', $ua, $m)) {
				$browser = 'Chrome';
				$browser_major = (int)$m[1];
			} elseif (preg_match('/Chromium\/(\d+)/i', $ua, $m)) {
				$browser = 'Chromium';
				$browser_major = (int)$m[1];
			} elseif (preg_match('/Chrome\/(\d+)/i', $ua, $m)) {
				$browser = 'Chrome';
				$browser_major = (int)$m[1];
			} elseif (preg_match('/Version\/(\d+).*Safari\//i', $ua, $m)) {
				$browser = 'Safari';
				$browser_major = (int)$m[1];
			} elseif (preg_match('/(?:MSIE |rv:)(\d+)/i', $ua, $m)) {
				$browser = 'Internet Explorer';
				$browser_major = (int)$m[1];
			} else {
				$browser = 'Other';
			}
		}
	} elseif ($is_bot) {
		$browser = 'Bot';
	} else {
		$browser = 'Unknown';
	}

	$os = 'Unknown';
	$os_version = '';
	if (!$is_bot && $ua !== '') {
		if (preg_match('/Windows NT (\d+\.\d+)/i', $ua, $m)) {
			$os = 'Windows';
			$versions = [
				'10.0' => '10/11',
				'6.3' => '8.1',
				'6.2' => '8',
				'6.1' => '7',
				'6.0' => 'Vista',
				'5.1' => 'XP',
			];
			$os_version = $versions[$m[1]] ?? $m[1];
		} elseif (preg_match('/(?:iPhone|iPad|iPod).*?OS (\d+)[._](\d+)/i', $ua, $m)) {
			$os = 'iOS';
			$os_version = (string)$m[1];
		} elseif (preg_match('/Android (\d+(?:\.\d+)?)/i', $ua, $m)) {
			$os = 'Android';
			$os_version = (string)$m[1];
		} elseif (preg_match('/Mac OS X (\d+)[._](\d+)/i', $ua, $m)) {
			$os = 'macOS';
			$os_version = $m[1] . '.' . $m[2];
			if ($m[1] === '10' && $m[2] === '15') {
				$os_version = '10.15+';
			}
		} elseif (stripos($ua, 'CrOS') !== false) {
			$os = 'ChromeOS';
		} elseif (stripos($ua, 'Linux') !== false) {
			$os = 'Linux';
		}

		if ($os === 'Unknown') {
			$hint = strtolower(trim((string)($_SERVER['HTTP_SEC_CH_UA_PLATFORM'] ?? ''), '"'));
			$hint_map = [
				'android' => 'Android',
				'ios' => 'iOS',
				'macos' => 'macOS',
				'windows' => 'Windows',
				'linux' => 'Linux',
				'chrome os' => 'ChromeOS',
			];
			if (isset($hint_map[$hint])) {
				$os = $hint_map[$hint];
			}
		}
	} elseif ($is_bot) {
		$os = 'Bot';
	}

	$device = 'unknown';
	if ($is_bot) {
		$device = 'bot';
	} elseif ($ua !== '') {
		if (preg_match('/iPad|Tablet|PlayBook|Silk/i', $ua)
			|| (stripos($ua, 'Android') !== false && stripos($ua, 'Mobile') === false)) {
			$device = 'tablet';
		} elseif (preg_match('/Mobi|iPhone|iPod|Windows Phone/i', $ua)
			|| stripos($ua, 'Android') !== false) {
			$device = 'mobile';
		} else {
			$device = 'desktop';
		}
		if ($device === 'desktop' && isset($_SERVER['HTTP_SEC_CH_UA_MOBILE'])
			&& (string)$_SERVER['HTTP_SEC_CH_UA_MOBILE'] === '?1') {
			$device = 'mobile';
		}
	}

	return [
		'browser' => substr($browser, 0, 32),
		'browser_major' => $browser_major,
		'os' => substr($os, 0, 16),
		'os_version' => substr($os_version, 0, 16),
		'device' => substr($device, 0, 16),
		'is_bot' => $is_bot,
		'bot_reason' => substr($bot_reason, 0, 64),
	];
}

function mn_analytics_endpoint_path(): string {
	$script = isset($_SERVER['SCRIPT_NAME']) ? (string)$_SERVER['SCRIPT_NAME'] : '';
	$dir = $script !== '' ? rtrim(str_replace('\\', '/', dirname($script)), '/') : '';
	return ($dir === '' ? '' : $dir) . '/track';
}

function mn_analytics_cleanup(PDO $pdo, bool $force = false): void {
	try {
		$last = 0;
		$row = $pdo->query("SELECT value FROM meta WHERE key = 'last_cleanup'")->fetch();
		if (is_array($row)) {
			$last = (int)($row['value'] ?? 0);
		}
		$now = time();
		if (!$force && $now - $last < 3600) {
			return;
		}
		$stmt = $pdo->prepare("INSERT OR REPLACE INTO meta (key, value) VALUES ('last_cleanup', ?)");
		$stmt->execute([(string)$now]);

		$stmt = $pdo->prepare("UPDATE pageviews SET completed = 1, token = '' WHERE completed = 0 AND ts < ?");
		$stmt->execute([$now - 6 * 3600]);
		$stmt = $pdo->prepare("DELETE FROM pageviews WHERE ts < ?");
		$stmt->execute([$now - 730 * 86400]);
		$pdo->exec('DELETE FROM pageview_sections WHERE pageview_id NOT IN (SELECT id FROM pageviews)');
		$pdo->exec('DELETE FROM pageview_events WHERE pageview_id NOT IN (SELECT id FROM pageviews)');
		$pdo->exec('PRAGMA optimize');
	} catch (Throwable $e) {
		// Analytics must never break the page.
	}
}

function mn_analytics_permission_bits(string $path): int {
	$perms = @fileperms($path);
	return $perms === false ? 0 : ($perms & 0777);
}

function mn_analytics_extension_issues(): array {
	$issues = [];
	$pdoAvailable = class_exists('PDO');
	$pdoSqlite = $pdoAvailable && extension_loaded('pdo_sqlite') && in_array('sqlite', PDO::getAvailableDrivers(), true);
	$sqlite3Available = class_exists('SQLite3');
	if (!$pdoSqlite) {
		$issues['pdo_sqlite_missing'] = [
			'id' => 'pdo_sqlite_missing',
			'title' => 'The PHP pdo_sqlite extension is missing.',
			'detail' => 'Analytics requires PDO SQLite. Without it, no pageviews can be stored.',
			'commands' => [
				'sudo apt-get update',
				'sudo apt-get install -y php-sqlite3',
				'sudo systemctl restart apache2   # or your PHP-FPM service',
				'Docker: rebuild the image with the SQLite extension enabled.',
			],
		];
	}
	if (!$sqlite3Available) {
		$issues['sqlite3_missing'] = [
			'id' => 'sqlite3_missing',
			'title' => 'The PHP SQLite3 extension is missing.',
			'detail' => 'Native SQLite backups fall back to VACUUM INTO; install php-sqlite3 for the primary backup path.',
			'commands' => [
				'sudo apt-get update',
				'sudo apt-get install -y php-sqlite3',
				'sudo systemctl restart apache2   # or your PHP-FPM service',
			],
		];
	}
	return $issues;
}

function mn_analytics_health_issues(): array {
	static $cached = null;
	if (is_array($cached)) {
		return $cached;
	}

	$issues = [];
	$add = function (string $id, string $title, string $detail, array $commands = []) use (&$issues): void {
		$issues[$id] = [
			'id' => $id,
			'title' => $title,
			'detail' => $detail,
			'commands' => array_values($commands),
		];
	};

	$dbPath = mn_analytics_db_path();
	$dbDir = dirname($dbPath);
	$user = mn_analytics_web_user();
	$userArg = escapeshellarg($user);
	$dbArg = escapeshellarg($dbPath);
	$dirArg = escapeshellarg($dbDir);

	$extensionIssues = mn_analytics_extension_issues();
	foreach ($extensionIssues as $extensionId => $extensionIssue) {
		$issues[$extensionId] = $extensionIssue;
	}
	$driverProblem = isset($extensionIssues['pdo_sqlite_missing']);

	if (!empty($GLOBALS['mn_analytics_config_error'])) {
		$add(
			'config_error',
			'The analytics configuration is invalid.',
			(string)$GLOBALS['mn_analytics_config_error'],
			[
				'Check the file: blog/lib/analytics_config.php',
				'It must return an array, e.g.:',
				'<?php',
				"return ['db_path' => '/var/lib/asanai-blog/analytics.sqlite'];",
			]
		);
	}
	if (!empty($GLOBALS['mn_analytics_system_path_error'])) {
		$add(
			'system_path_error',
			'The system analytics path file is invalid.',
			(string)$GLOBALS['mn_analytics_system_path_error'],
			[
				'Fix /etc/asanai_blog_path (one directory or .sqlite path):',
				'sudo sh -c \'printf "%s\\n" "/var/lib/asanai-blog" > /etc/asanai_blog_path\'',
				'sudo chmod 644 /etc/asanai_blog_path',
			]
		);
	}
	if (!empty($GLOBALS['mn_analytics_env_path_error'])) {
		$add(
			'env_path_error',
			'The MN_ANALYTICS_DB override is invalid.',
			(string)$GLOBALS['mn_analytics_env_path_error'],
			['Use an absolute path, e.g. /var/lib/asanai-blog/analytics.sqlite.']
		);
	}
	if (!empty($GLOBALS['mn_analytics_config_path_error'])) {
		$add(
			'config_path_error',
			'The analytics configuration path is invalid.',
			(string)$GLOBALS['mn_analytics_config_path_error'],
			['Use an absolute path in blog/lib/analytics_config.php.']
		);
	}
	$passwordFile = mn_analytics_password_file();
	if (is_file($passwordFile) && is_writable($passwordFile)) {
		$passwordArg = escapeshellarg($passwordFile);
		$add(
			'password_file_writable',
			'The analytics password file is writable by the web server.',
			"File: {$passwordFile}\nWeb server user: {$user}",
			[
				'sudo chown root:' . $user . ' ' . $passwordArg,
				'sudo chmod 640 ' . $passwordArg,
			]
		);
	}
	$systemFile = mn_analytics_system_config_file();
	if (is_file($systemFile) && is_writable($systemFile)) {
		$systemArg = escapeshellarg($systemFile);
		$add(
			'system_path_writable',
			'The system analytics path file is writable by the web server.',
			"File: {$systemFile}",
			[
				'sudo chown root:root ' . $systemArg,
				'sudo chmod 644 ' . $systemArg,
			]
		);
	}

	$trackerFile = dirname(__DIR__) . '/analytics.js';
	if (!is_file($trackerFile)) {
		$add(
			'client_tracker_missing',
			'The client tracker analytics.js is missing.',
			'Expected file: ' . $trackerFile,
			['Restore analytics.js in the blog directory.', 'Then reload the page.']
		);
	}
	$endpointFile = dirname(__DIR__) . '/track.php';
	if (!is_file($endpointFile)) {
		$add(
			'track_endpoint_missing',
			'The tracking endpoint track.php is missing.',
			'Expected file: ' . $endpointFile,
			['Restore track.php in the blog directory.', 'Then reload the page.']
		);
	}

	$dirProblem = false;
	if (is_link($dbDir)) {
		$add(
			'db_dir_symlink',
			'The database directory is a symbolic link.',
			"Directory: {$dbDir}",
			[
				'Use a real directory, not a symlink.',
				'Choose a real directory in /etc/asanai_blog_path or blog/lib/analytics_config.php.',
				'sudo mkdir -p ' . $dirArg,
				'sudo chown -R ' . $userArg . ':' . $userArg . ' ' . $dirArg,
				'sudo chmod 775 ' . $dirArg,
			]
		);
		$dirProblem = true;
	} elseif (!is_dir($dbDir)) {
		$add(
			'db_dir_missing',
			'The data directory does not exist.',
			"Directory: {$dbDir}\nWeb server user: {$user}",
			[
				'sudo mkdir -p ' . $dirArg,
				'sudo chown -R ' . $userArg . ':' . $userArg . ' ' . $dirArg,
				'sudo chmod 775 ' . $dirArg,
			]
		);
		$dirProblem = true;
	} else {
		if (!is_writable($dbDir)) {
			$add(
				'db_dir_unwritable',
				'The data directory is not writable by the web server.',
				"Directory: {$dbDir}\nWeb server user: {$user}",
				[
					'sudo chown -R ' . $userArg . ':' . $userArg . ' ' . $dirArg,
					'sudo chmod 775 ' . $dirArg,
				]
			);
			$dirProblem = true;
		}
		$dirPerms = mn_analytics_permission_bits($dbDir);
		if (!$dirProblem && ($dirPerms & 0002)) {
			$add(
				'db_dir_world_writable',
				'The data directory is world-writable.',
				"Directory: {$dbDir}\nPermissions: " . decoct($dirPerms),
				['sudo chmod 775 ' . $dirArg]
			);
		}
		$uid = function_exists('posix_geteuid') ? posix_geteuid() : null;
		$owner = @fileowner($dbDir);
		if ($uid !== null && $owner !== false && $owner !== $uid && $owner !== 0) {
			$add(
				'db_dir_owner',
				'The database directory is owned by another user.',
				"Directory: {$dbDir}\nOwner UID: {$owner}\nWeb server UID: {$uid}",
				[
					'sudo chown -R ' . $userArg . ':' . $userArg . ' ' . $dirArg,
					'sudo chmod 775 ' . $dirArg,
				]
			);
		}
	}

	if (is_link($dbPath)) {
		$add(
			'db_path_symlink',
			'The database file is a symbolic link.',
			"File: {$dbPath}",
			[
				'Do not use a symlink for the analytics database.',
				'Move it aside and let analytics create a regular file:',
				'sudo mv ' . $dbArg . ' ' . $dbArg . '.symlink-backup',
			]
		);
		$dirProblem = true;
	} elseif (file_exists($dbPath) && !is_file($dbPath)) {
		$add(
			'db_path_not_regular',
			'The database path exists but is not a regular file.',
			"File: {$dbPath}",
			[
				'The path is a directory, FIFO or device.',
				'Inspect it with: ls -l ' . $dbArg,
				'Choose another database path in /etc/asanai_blog_path or blog/lib/analytics_config.php.',
			]
		);
		$dirProblem = true;
	} elseif (is_file($dbPath)) {
		$perms = mn_analytics_permission_bits($dbPath);
		if (!is_readable($dbPath) || !is_writable($dbPath)) {
			$add(
				'db_file_permissions',
				'The database file is not readable/writable by the web server.',
				"File: {$dbPath}\nWeb server user: {$user}\nPermissions: " . decoct($perms),
				[
					'sudo chown ' . $userArg . ':' . $userArg . ' ' . $dbArg,
					'sudo chmod 660 ' . $dbArg,
				]
			);
			$dirProblem = true;
		} elseif (($perms & 0002) || ($perms & 0004)) {
			$add(
				'db_file_world_accessible',
				'The database file is world-readable or world-writable.',
				"File: {$dbPath}\nPermissions: " . decoct($perms),
				['sudo chmod 660 ' . $dbArg]
			);
		}
	}

	if (mn_analytics_path_inside_webroot($dbPath)) {
		$htaccess = $dbDir . '/.htaccess';
		$protected = false;
		if (is_file($htaccess) && is_readable($htaccess)) {
			$content = (string)@file_get_contents($htaccess);
			$protected = stripos($content, 'Require all denied') !== false
				|| stripos($content, 'Deny from all') !== false;
		}
		if (!$protected) {
			$add(
				'db_web_exposed',
				'The database is inside the web root and is not protected by .htaccess.',
				"File: {$dbPath}\nProtection file: {$htaccess}",
				[
					'Create the file ' . $htaccess . ' with the following content:',
					'<IfModule mod_authz_core.c>',
					'  Require all denied',
					'</IfModule>',
					'<IfModule !mod_authz_core.c>',
					'  Order allow,deny',
					'  Deny from all',
					'</IfModule>',
					'Options -Indexes',
					'',
					'Better: move the database outside the web root (Dashboard → Storage).',
				]
			);
		}
	}

	if (!$dirProblem && !$driverProblem) {
		$pdo = mn_analytics_open_db();
		if (!$pdo) {
			$detail = "File: {$dbPath}\nDirectory: {$dbDir}\nWeb server user: {$user}";
			if (!empty($GLOBALS['mn_analytics_db_error'])) {
				$detail .= "\nError: " . (string)$GLOBALS['mn_analytics_db_error'];
			}
			$openCommands = [
				'sudo mkdir -p ' . $dirArg,
				'sudo chown -R ' . $userArg . ':' . $userArg . ' ' . $dirArg,
				'sudo chmod 775 ' . $dirArg,
			];
			if (is_file($dbPath)) {
				$openCommands[] = 'sudo chown ' . $userArg . ':' . $userArg . ' ' . $dbArg;
				$openCommands[] = 'sudo chmod 660 ' . $dbArg;
			}
			$add(
				'db_open_failed',
				'The analytics database could not be opened.',
				$detail,
				$openCommands
			);
		} else {
			try {
				$pdo->query('SELECT 1');
			} catch (Throwable $e) {
				$add('db_query_failed', 'The database is open but not readable.', $e->getMessage());
			}
			$free = @disk_free_space($dbDir);
			if ($free !== false && $free < 10 * 1024 * 1024) {
				$add(
					'disk_low',
					'There is little free space on the data directory.',
					'Free: ' . number_format($free / 1024 / 1024, 1, '.', ',') . ' MB',
					['df -h ' . $dirArg]
				);
			}
		}
	}

	if (!empty($GLOBALS['mn_analytics_insert_error'])) {
		$add(
			'db_insert_failed',
			'The pageview could not be written to the database.',
			"Error: " . (string)$GLOBALS['mn_analytics_insert_error'] . "\nFile: {$dbPath}\nWeb server user: {$user}",
			[
				'sudo chown ' . $userArg . ':' . $userArg . ' ' . $dbArg,
				'sudo chmod 660 ' . $dbArg,
				'df -h ' . $dirArg,
			]
		);
	}

	$cached = $issues;
	return $issues;
}

function mn_analytics_setup_issue(): ?array {
	$file = mn_analytics_password_file();
	$user = mn_analytics_web_user();
	$reason = '';
	if (!file_exists($file)) {
		$reason = 'missing';
	} elseif (!is_readable($file)) {
		$reason = 'unreadable';
	} elseif (mn_analytics_password_line() === '') {
		$reason = 'empty';
	}
	if ($reason === '') {
		return null;
	}
	$titles = [
		'missing' => 'The analytics password file is missing.',
		'unreadable' => 'The analytics password file is not readable.',
		'empty' => 'The analytics password file is empty.',
	];
	$command = "sudo sh -c 'printf \"%s\\n\" \"YOUR_PASSWORD\" > " . $file . " && chown root:" . $user . " " . $file . " && chmod 640 " . $file . "'";
	$dbPath = mn_analytics_db_path();
	$dbDir = dirname($dbPath);
	$dbSource = mn_analytics_db_path_source();

	$details = [
		'Password file: ' . $file,
		'Web server user: ' . $user,
		'Database: ' . $dbPath,
		'Database source: ' . $dbSource,
	];

	$commands = [
		'Create or repair the password file (replace YOUR_PASSWORD with a long, random password):',
		$command,
	];

	if (!empty($GLOBALS['mn_analytics_system_path_error'])) {
		$details[] = 'System path file: ' . (string)$GLOBALS['mn_analytics_system_path_error'];
		$commands[] = '';
		$commands[] = 'Fix /etc/asanai_blog_path (one directory or .sqlite path):';
		$commands[] = 'sudo sh -c \'printf "%s\\n" "/var/lib/asanai-blog" > /etc/asanai_blog_path\'';
		$commands[] = 'sudo chmod 644 /etc/asanai_blog_path';
	}
	if (!empty($GLOBALS['mn_analytics_env_path_error'])) {
		$details[] = 'MN_ANALYTICS_DB: ' . (string)$GLOBALS['mn_analytics_env_path_error'];
		$commands[] = '';
		$commands[] = 'Use an absolute path in MN_ANALYTICS_DB, e.g. /var/lib/asanai-blog/analytics.sqlite.';
	}
	if (!empty($GLOBALS['mn_analytics_config_path_error'])) {
		$details[] = 'Config path: ' . (string)$GLOBALS['mn_analytics_config_path_error'];
		$commands[] = '';
		$commands[] = 'Use an absolute db_path in blog/lib/analytics_config.php.';
	}
	if (is_file($file) && is_writable($file)) {
		$details[] = 'The password file is writable by the web server.';
		$commands[] = '';
		$commands[] = 'Restrict the password file:';
		$commands[] = 'sudo chown root:' . $user . ' ' . escapeshellarg($file);
		$commands[] = 'sudo chmod 640 ' . escapeshellarg($file);
	}
	$systemFile = mn_analytics_system_config_file();
	if (is_file($systemFile) && is_writable($systemFile)) {
		$details[] = 'The system path file is writable by the web server.';
		$commands[] = '';
		$commands[] = 'Restrict the system path file:';
		$commands[] = 'sudo chown root:root ' . escapeshellarg($systemFile);
		$commands[] = 'sudo chmod 644 ' . escapeshellarg($systemFile);
	}

	if (is_link($dbDir)) {
		$details[] = 'The database directory is a symbolic link.';
		$commands[] = '';
		$commands[] = 'Use a real directory, not a symlink.';
		$commands[] = 'Choose a real directory in /etc/asanai_blog_path or blog/lib/analytics_config.php.';
	} elseif (!is_dir($dbDir)) {
		$commands[] = '';
		$commands[] = 'Create the database directory:';
		$commands[] = 'sudo mkdir -p ' . escapeshellarg($dbDir);
		$commands[] = 'sudo chown -R ' . escapeshellarg($user) . ':' . escapeshellarg($user) . ' ' . escapeshellarg($dbDir);
		$commands[] = 'sudo chmod 775 ' . escapeshellarg($dbDir);
	} elseif (!is_writable($dbDir)) {
		$commands[] = '';
		$commands[] = 'Make the database directory writable:';
		$commands[] = 'sudo chown -R ' . escapeshellarg($user) . ':' . escapeshellarg($user) . ' ' . escapeshellarg($dbDir);
		$commands[] = 'sudo chmod 775 ' . escapeshellarg($dbDir);
	}

	if (is_link($dbPath)) {
		$details[] = 'The database file is a symbolic link.';
		$commands[] = '';
		$commands[] = 'Do not use a symlink for the database.';
		$commands[] = 'sudo mv ' . escapeshellarg($dbPath) . ' ' . escapeshellarg($dbPath) . '.symlink-backup';
	} elseif (file_exists($dbPath) && !is_file($dbPath)) {
		$details[] = 'The database path exists but is not a regular file.';
		$commands[] = '';
		$commands[] = 'Inspect it with: ls -l ' . escapeshellarg($dbPath);
		$commands[] = 'Choose another database path in /etc/asanai_blog_path or blog/lib/analytics_config.php.';
	} elseif (is_file($dbPath) && (!is_readable($dbPath) || !is_writable($dbPath))) {
		$commands[] = '';
		$commands[] = 'Fix the database file permissions:';
		$commands[] = 'sudo chown ' . escapeshellarg($user) . ':' . escapeshellarg($user) . ' ' . escapeshellarg($dbPath);
		$commands[] = 'sudo chmod 660 ' . escapeshellarg($dbPath);
	}

	return [
		'title' => $titles[$reason],
		'detail' => implode("\n", $details),
		'commands' => $commands,
		'link' => [
			'href' => mn_analytics_stats_path(),
			'text' => 'Open the Analytics dashboard and sign in',
		],
	];
}

function mn_analytics_render_alert_html(array $issues, string $title, string $intro, string $linkText): string {
	$html = '<div role="alert" style="box-sizing:border-box;width:100%;margin:0;padding:18px 22px;background:#7f1d1d;color:#fff;border-bottom:3px solid #ef4444;font:14px/1.55 system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;position:relative;z-index:9999;text-align:left;">';
	$html .= '<div style="font-size:20px;font-weight:800;letter-spacing:-.01em;margin:0 0 6px;">⚠ ' . mn_analytics_h($title) . '</div>';
	$html .= '<div style="margin:0 0 12px;color:#fee2e2;">' . mn_analytics_h($intro) . '</div>';

	foreach ($issues as $issue) {
		$html .= '<div style="margin:10px 0;padding:11px 13px;background:rgba(0,0,0,.22);border:1px solid rgba(255,255,255,.18);border-radius:8px;">';
		$html .= '<div style="font-weight:700;font-size:15px;margin:0 0 4px;">' . mn_analytics_h($issue['title']) . '</div>';
		if ((string)$issue['detail'] !== '') {
			$html .= '<div style="color:#fecaca;white-space:normal;">' . nl2br(mn_analytics_h($issue['detail'])) . '</div>';
		}
		if (!empty($issue['commands'])) {
			$html .= '<pre style="white-space:pre-wrap;word-break:break-word;margin:8px 0 0;padding:10px 12px;background:rgba(0,0,0,.35);border-radius:6px;font:12px/1.55 ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;color:#fff;overflow-x:auto;">';
			$html .= mn_analytics_h(implode("\n", $issue['commands']));
			$html .= '</pre>';
		}
		if (!empty($issue['link']) && is_array($issue['link'])) {
			$href = (string)($issue['link']['href'] ?? '');
			$text = (string)($issue['link']['text'] ?? 'Open the Analytics dashboard');
			if ($href !== '') {
				$html .= '<div style="margin-top:8px;"><a href="' . mn_analytics_h($href) . '" style="color:#fff;text-decoration:underline;">' . mn_analytics_h($text) . '</a></div>';
			}
		}
		$html .= '</div>';
	}

	$html .= '<div style="margin-top:12px;color:#fee2e2;">Reload the page after fixing the problem. ' . mn_analytics_h($linkText) . ' <a href="' . mn_analytics_h(mn_analytics_stats_path()) . '" style="color:#fff;text-decoration:underline;">Analytics dashboard</a>.</div>';
	$html .= '</div>';
	return $html;
}

function mn_analytics_alert_html(): string {
	if (mn_analytics_is_kill_switched()) {
		return '';
	}
	$setup = mn_analytics_setup_issue();
	if ($setup !== null) {
		$setupIssues = [$setup];
		foreach (mn_analytics_extension_issues() as $extensionIssue) {
			$setupIssues[] = $extensionIssue;
		}
		return mn_analytics_render_alert_html(
			$setupIssues,
			'Analytics setup required',
			'The analytics password file is missing, unreadable or empty. The site owner must finish the one-time setup before the dashboard and health checks can work.',
			'Open the'
		);
	}

	if (!mn_analytics_is_admin_visitor()) {
		return '';
	}
	$issues = mn_analytics_health_issues();
	if (!$issues) {
		return '';
	}
	return mn_analytics_render_alert_html(
		$issues,
		'Analytics logging is not working',
		'Pageviews are not being stored correctly on this page, or the database is not configured securely. Please fix the problem, otherwise data will be lost.',
		'Details in the'
	);
}

function mn_analytics_backup_to(string $destination): bool {
	$sourcePath = mn_analytics_db_path();
	if (!is_file($sourcePath)) {
		return false;
	}
	if (class_exists('SQLite3')) {
		try {
			$source = new SQLite3($sourcePath, SQLITE3_OPEN_READONLY);
			$target = new SQLite3($destination, SQLITE3_OPEN_READWRITE | SQLITE3_OPEN_CREATE);
			$ok = $source->backup($target);
			$source->close();
			$target->close();
			if ($ok && is_file($destination)) {
				return true;
			}
		} catch (Throwable $e) {
			// Fall back to VACUUM INTO below.
		}
	}
	$pdo = mn_analytics_open_db();
	if (!$pdo) {
		return false;
	}
	try {
		if (is_file($destination)) {
			@unlink($destination);
		}
		$pdo->exec('VACUUM INTO ' . $pdo->quote($destination));
		return is_file($destination);
	} catch (Throwable $e) {
		return false;
	}
}

function mn_analytics_begin_page_view(): ?array {
	static $done = false;
	static $result = null;
	if ($done) {
		return $result;
	}
	$done = true;

	if (mn_analytics_is_disabled() || mn_analytics_is_opted_out() || mn_analytics_is_prefetch()) {
		return null;
	}
	$slug = mn_analytics_current_slug();
	if ($slug === null) {
		return null;
	}
	$pdo = mn_analytics_open_db();
	if (!$pdo) {
		return null;
	}

	try {
		$now = time();
		$ts = intdiv($now, 3600) * 3600;
		$dt = (new DateTimeImmutable('@' . $now))->setTimezone(new DateTimeZone('Europe/Berlin'));
		$day = $dt->format('Y-m-d');
		$hour = (int)$dt->format('G');
		$ref = mn_analytics_parse_referrer(isset($_SERVER['HTTP_REFERER']) ? (string)$_SERVER['HTTP_REFERER'] : '');
		$client = mn_analytics_parse_client();
		$token = bin2hex(random_bytes(16));

		$stmt = $pdo->prepare(
			"INSERT INTO pageviews
				(ts, day, hour, path, ref_type, ref_source, ref_host, ref_path,
				 browser, browser_major, os, os_version, device, is_bot, bot_reason,
				 duration_sec, scroll_pct, completed, token)
			 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL, NULL, 0, ?)"
		);
		$stmt->execute([
			$ts, $day, $hour, $slug,
			$ref['type'], $ref['source'], $ref['host'], $ref['path'],
			$client['browser'], $client['browser_major'], $client['os'], $client['os_version'],
			$client['device'], $client['is_bot'], $client['bot_reason'],
			$token,
		]);

		mn_analytics_cleanup($pdo);

		$result = [
			'enabled' => true,
			'token' => $token,
			'endpoint' => mn_analytics_endpoint_path(),
			'heartbeat' => 60000,
		];
		return $result;
	} catch (Throwable $e) {
		$GLOBALS['mn_analytics_insert_error'] = $e->getMessage();
		return null;
	}
}

function mn_analytics_print_config(): void {
	static $printed = false;
	if ($printed) {
		return;
	}
	$printed = true;

	$cfg = mn_analytics_begin_page_view();
	if (!$cfg) {
		return;
	}
	$json = json_encode(
		$cfg,
		JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE |
		JSON_HEX_TAG | JSON_HEX_AMP | JSON_HEX_APOS | JSON_HEX_QUOT
	);
	if (!is_string($json)) {
		return;
	}
	echo '<script>window.__MNAnalytics=' . $json . ';</script>' . "\n";
}

function mn_analytics_clean_client_text(string $value, int $maxLength): string {
	$value = preg_replace('/[\x00-\x1F\x7F]+/u', ' ', $value) ?? '';
	$value = trim(preg_replace('/\s+/u', ' ', $value) ?? '');
	if (function_exists('mb_substr')) {
		return mb_substr($value, 0, $maxLength, 'UTF-8');
	}
	return substr($value, 0, $maxLength);
}

function mn_analytics_store_pageview_details(PDO $pdo, int $pageviewId, string $path, array $sections, array $events): void {
	$sectionStmt = $pdo->prepare(
		"INSERT OR REPLACE INTO pageview_sections
			(pageview_id, path, section_index, section_key, section_label, visible_pct, dwell_sec)
		 VALUES (?, ?, ?, ?, ?, ?, ?)"
	);
	$count = 0;
	foreach ($sections as $section) {
		if (!is_array($section) || $count >= 10) {
			continue;
		}
		$index = isset($section['i']) && is_numeric($section['i']) ? (int)$section['i'] : -1;
		if ($index < 0 || $index > 99) {
			continue;
		}
		$key = isset($section['k']) && is_string($section['k']) ? strtolower(mn_analytics_clean_client_text($section['k'], 32)) : '';
		$key = preg_replace('/[^a-z0-9_-]/', '', $key) ?? '';
		$label = isset($section['l']) && is_string($section['l']) ? mn_analytics_clean_client_text($section['l'], 48) : '';
		$visible = isset($section['v']) && is_numeric($section['v']) ? max(0, min(100, (int)$section['v'])) : 0;
		$dwell = isset($section['d']) && is_numeric($section['d']) ? max(0, min(14400, (int)$section['d'])) : 0;
		if ($key === '' && $label === '') {
			continue;
		}
		$sectionStmt->execute([$pageviewId, $path, $index, $key, $label, $visible, $dwell]);
		$count++;
	}

	$allowedKinds = ['internal_link', 'external_link', 'citation', 'code_copy', 'search', 'search_result', 'quiz_answer', 'quiz_finish', 'download', 'media_play', 'lab_run'];
	$eventStmt = $pdo->prepare(
		"INSERT OR IGNORE INTO pageview_events (pageview_id, path, kind, target, value)
		 VALUES (?, ?, ?, ?, ?)"
	);
	$count = 0;
	foreach ($events as $event) {
		if (!is_array($event) || $count >= 14) {
			continue;
		}
		$kind = isset($event['type']) && is_string($event['type']) ? strtolower(trim($event['type'])) : '';
		if (!in_array($kind, $allowedKinds, true)) {
			continue;
		}
		$target = isset($event['target']) && is_string($event['target']) ? mn_analytics_clean_client_text($event['target'], 72) : '';
		$target = preg_replace('/[?#].*$/', '', $target) ?? '';
		if ($target === '') {
			continue;
		}
		$value = isset($event['value']) && is_numeric($event['value']) ? (int)$event['value'] : null;
		if ($value !== null) {
			$value = max(-1, min(100000, $value));
		}
		$eventStmt->execute([$pageviewId, $path, $kind, $target, $value]);
		$count++;
	}
}

function mn_analytics_update_token(string $token, int $duration, ?int $scroll, bool $final, array $sections = [], array $events = []): bool {
	if (!preg_match('/^[a-f0-9]{32}$/', $token)) {
		return false;
	}
	$pdo = mn_analytics_open_db();
	if (!$pdo) {
		return false;
	}
	$duration = max(0, min(14400, $duration));
	if ($scroll !== null) {
		$scroll = max(0, min(100, $scroll));
	}
	$oldest = time() - 6 * 3600;

	try {
		$find = $pdo->prepare("SELECT id, path FROM pageviews WHERE token = ? AND completed = 0 AND ts >= ?");
		$find->execute([$token, $oldest]);
		$row = $find->fetch();
		if (!is_array($row)) {
			return false;
		}
		$pageviewId = (int)$row['id'];
		$path = (string)$row['path'];

		$pdo->beginTransaction();
		if ($final) {
			$stmt = $pdo->prepare(
				"UPDATE pageviews
				 SET duration_sec = MAX(COALESCE(duration_sec, 0), ?),
				     scroll_pct = CASE WHEN ? IS NULL THEN scroll_pct ELSE MAX(COALESCE(scroll_pct, 0), ?) END,
				     completed = 1,
				     token = ''
				 WHERE id = ? AND completed = 0"
			);
			$stmt->execute([$duration, $scroll, $scroll, $pageviewId]);
		} else {
			$stmt = $pdo->prepare(
				"UPDATE pageviews
				 SET duration_sec = MAX(COALESCE(duration_sec, 0), ?),
				     scroll_pct = CASE WHEN ? IS NULL THEN scroll_pct ELSE MAX(COALESCE(scroll_pct, 0), ?) END
				 WHERE id = ? AND completed = 0"
			);
			$stmt->execute([$duration, $scroll, $scroll, $pageviewId]);
		}
		if ($stmt->rowCount() < 1) {
			$pdo->rollBack();
			return false;
		}
		if ($final) {
			mn_analytics_store_pageview_details($pdo, $pageviewId, $path, $sections, $events);
		}
		$pdo->commit();
		return true;
	} catch (Throwable $e) {
		if ($pdo->inTransaction()) {
			$pdo->rollBack();
		}
		return false;
	}
}

function mn_analytics_delete_token(string $token): bool {
	if (!preg_match('/^[a-f0-9]{32}$/', $token)) {
		return false;
	}
	$pdo = mn_analytics_open_db();
	if (!$pdo) {
		return false;
	}
	try {
		$pdo->beginTransaction();
		$find = $pdo->prepare("SELECT id FROM pageviews WHERE token = ? AND completed = 0");
		$find->execute([$token]);
		$ids = $find->fetchAll(PDO::FETCH_COLUMN);
		foreach ($ids as $id) {
			$pdo->prepare("DELETE FROM pageview_sections WHERE pageview_id = ?")->execute([(int)$id]);
			$pdo->prepare("DELETE FROM pageview_events WHERE pageview_id = ?")->execute([(int)$id]);
		}
		$stmt = $pdo->prepare("DELETE FROM pageviews WHERE token = ? AND completed = 0");
		$stmt->execute([$token]);
		$pdo->commit();
		return true;
	} catch (Throwable $e) {
		if ($pdo->inTransaction()) {
			$pdo->rollBack();
		}
		return false;
	}
}

function mn_analytics_lesson_titles(): array {
	static $titles = null;
	if (is_array($titles)) {
		return $titles;
	}
	$titles = [
		'index' => 'Course overview',
		'index_full' => 'Full course',
	];
	$files = glob(dirname(__DIR__) . '/*.php');
	if (!is_array($files)) {
		return $titles;
	}
	foreach ($files as $file) {
		$slug = basename($file, '.php');
		$src = @file_get_contents($file);
		if ($src === false) {
			continue;
		}
		$pattern = '/<!--\s*\n?\s*COURSE_METADATA:\s*\n((?:.*\n)*?)\s*-->/';
		if (!preg_match($pattern, $src, $m)) {
			continue;
		}
		if (preg_match('/^title:\s*(.+?)\s*$/m', $m[1], $t)) {
			$titles[$slug] = trim($t[1]);
		}
	}
	return $titles;
}

function mn_analytics_page_word_count(string $slug): ?int {
	static $cache = [];
	if (array_key_exists($slug, $cache)) {
		return $cache[$slug];
	}
	if (!preg_match('/^[a-zA-Z0-9_-]{1,80}$/', $slug)) {
		return $cache[$slug] = null;
	}
	$file = dirname(__DIR__) . '/' . $slug . '.php';
	if (!is_file($file)) {
		return $cache[$slug] = null;
	}
	$source = @file_get_contents($file);
	if ($source === false) {
		return $cache[$slug] = null;
	}
	$text = preg_replace('/<\?php.*?\?>/s', ' ', $source) ?? '';
	$text = preg_replace('/<!--.*?-->/s', ' ', $text) ?? '';
	$text = preg_replace('/<(script|style|pre|code)\b.*?<\/\1>/is', ' ', $text) ?? '';
	$text = strip_tags($text);
	$text = preg_replace('/[#*_>`~\[\](){}|]/', ' ', $text) ?? '';
	if (preg_match_all('/\p{L}[\p{L}\p{N}\x{2019}\x{0027}-]*/u', $text, $matches) === false) {
		return $cache[$slug] = null;
	}
	$count = count($matches[0] ?? []);
	return $cache[$slug] = $count >= 20 ? $count : null;
}

function mn_analytics_format_duration(?int $sec): string {
	if ($sec === null) {
		return '—';
	}
	$sec = max(0, $sec);
	if ($sec < 60) {
		return $sec . ' s';
	}
	$min = intdiv($sec, 60);
	$rest = $sec % 60;
	if ($min < 60) {
		return $min . ' min ' . str_pad((string)$rest, 2, '0', STR_PAD_LEFT) . ' s';
	}
	$h = intdiv($min, 60);
	$min = $min % 60;
	return $h . ' h ' . str_pad((string)$min, 2, '0', STR_PAD_LEFT) . ' min';
}

function mn_analytics_format_number(float|int $n): string {
	return number_format((float)$n, 0, '.', ',');
}

function mn_analytics_ref_type_label(string $type): string {
	return match ($type) {
		'direct' => 'Direct',
		'internal' => 'Internal',
		'search' => 'Search',
		'social' => 'Social',
		'external' => 'External',
		default => 'Unknown',
	};
}
