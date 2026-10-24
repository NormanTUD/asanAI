<?php
declare(strict_types=1);

$remote_base = getenv('ASANAI_BLOG_PROXY_REMOTE') ?: 'https://asanai.scads.ai/blog/';
if (!str_ends_with($remote_base, '/')) {
	$remote_base .= '/';
}
$proxy_name = basename(__FILE__);

function asanai_proxy_abort(int $code, string $message): void {
	http_response_code($code);
	header('Content-Type: text/plain; charset=utf-8');
	echo $message;
	exit;
}

function asanai_proxy_rewrite_url(string $url, string $remote_base, string $proxy_name, string $current_path): string {
	$url = trim(html_entity_decode($url, ENT_QUOTES | ENT_HTML5, 'UTF-8'));
	if ($url === '' || str_starts_with($url, '#')) {
		return $url;
	}
	$lower = strtolower($url);
	foreach (['mailto:', 'tel:', 'javascript:', 'data:', 'blob:', 'about:'] as $scheme) {
		if (str_starts_with($lower, $scheme)) {
			return $url;
		}
	}
	if (str_starts_with($url, '//')) {
		return $url;
	}

	$base_path = rtrim((string)(parse_url($remote_base, PHP_URL_PATH) ?: '/'), '/') . '/';
	$target = '';
	if (str_starts_with($lower, 'http://') || str_starts_with($lower, 'https://')) {
		if (!str_starts_with($url, $remote_base)) {
			if (rtrim($url, '/') === rtrim($remote_base, '/')) {
				$target = 'index.php';
			} else {
				return $url;
			}
		} else {
			$target = substr($url, strlen($remote_base));
		}
	} elseif (str_starts_with($url, '/')) {
		if (rtrim($url, '/') === rtrim($base_path, '/')) {
			$target = 'index.php';
		} elseif (str_starts_with($url, $base_path)) {
			$target = substr($url, strlen($base_path));
		} else {
			return $url;
		}
	} elseif (str_starts_with($url, '?')) {
		$target = ($current_path === '' ? 'index.php' : $current_path) . $url;
	} else {
		$target = $url;
	}

	$fragment = '';
	$hash_pos = strpos($target, '#');
	if ($hash_pos !== false) {
		$fragment = substr($target, $hash_pos);
		$target = substr($target, 0, $hash_pos);
	}
	$target = ltrim($target, '/');
	if ($target === '' || $target === '?') {
		$target = 'index.php';
	}
	return $proxy_name . '?' . $target . $fragment;
}

function asanai_proxy_rewrite_html(string $content, string $remote_base, string $proxy_name, string $current_path): string {
	$proxy_feedback = $proxy_name . '?feedback_track.php';
	$content = preg_replace('/"endpoint"\s*:\s*"[^"]*feedback_track"/i', '"endpoint":"' . $proxy_feedback . '"', $content) ?? $content;
	$proxy_track = $proxy_name . '?track.php';
	$content = preg_replace('/"endpoint"\s*:\s*"[^"]*track"/i', '"endpoint":"' . $proxy_track . '"', $content) ?? $content;

	$is_stats = (bool)preg_match('~^/?stats(?:\.php)?$~', $current_path);
	if ($is_stats) {
		$proxy_base = $proxy_name . '?' . $current_path;
		$content = str_replace('__MN_STATS_BASE__', $proxy_base, $content);
		$content = str_replace('__MN_STATS_BASE_PATH__', $current_path, $content);
	}

	// The proxy keeps the browser on asanai_blog_proxy?index, so a remote
	// toc.js that only inspects the URL would still build a TOC there. Hide
	// it for the course index (and the linear index_full) as a safety net;
	// toc.js also recognises the proxy URL directly.
	if (preg_match('~^/?(?:index|index_full)(?:\.php)?$~', $current_path)) {
		$no_toc = '<style id="mn-proxy-index-no-toc">#toc{display:none!important}</style>';
		if (stripos($content, '</head>') !== false) {
			$content = preg_replace('~</head>~i', $no_toc . '</head>', $content, 1) ?? $content;
		} else {
			$content = $no_toc . $content;
		}
	}

	$content = preg_replace_callback(
		'/<a\b([^>]*?)\bhref\s*=\s*(["\'])(.*?)\2([^>]*)>/is',
		static function (array $match) use ($remote_base, $proxy_name, $current_path): string {
			$new = asanai_proxy_rewrite_url($match[3], $remote_base, $proxy_name, $current_path);
			if ($new === $match[3]) {
				return $match[0];
			}
			return '<a' . $match[1] . 'href=' . $match[2] . htmlspecialchars($new, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8') . $match[2] . $match[4] . '>';
		},
		$content
	) ?? $content;

	$content = preg_replace_callback(
		'/<iframe\b([^>]*?)\bsrc\s*=\s*(["\'])(.*?)\2([^>]*)>/is',
		static function (array $match) use ($remote_base, $proxy_name, $current_path): string {
			$new = asanai_proxy_rewrite_url($match[3], $remote_base, $proxy_name, $current_path);
			if ($new === $match[3]) {
				return $match[0];
			}
			return '<iframe' . $match[1] . 'src=' . $match[2] . htmlspecialchars($new, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8') . $match[2] . $match[4] . '>';
		},
		$content
	) ?? $content;

	$content = preg_replace_callback(
		'/<form\b([^>]*?)\baction\s*=\s*(["\'])(.*?)\2([^>]*)>/is',
		static function (array $match) use ($remote_base, $proxy_name, $current_path): string {
			$action = trim(html_entity_decode($match[3], ENT_QUOTES | ENT_HTML5, 'UTF-8'));
			if ($action === '' || $action === '#') {
				return $match[0];
			}
			$new = asanai_proxy_rewrite_url($action, $remote_base, $proxy_name, $current_path);
			if ($new === $match[3]) {
				return $match[0];
			}
			return '<form' . $match[1] . 'action=' . $match[2] . htmlspecialchars($new, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8') . $match[2] . $match[4] . '>';
		},
		$content
	) ?? $content;

	$content = preg_replace_callback(
		'/<link\b([^>]*?)\bhref\s*=\s*(["\'])(.*?)\2([^>]*)>/is',
		static function (array $match) use ($remote_base, $proxy_name, $current_path): string {
			$tag = $match[1] . ' ' . $match[4];
			if (!preg_match('/\brel\s*=\s*(["\'])(.*?)\1/i', $tag, $rel) || !preg_match('/(?:stylesheet|preload|icon|manifest|apple-touch-icon)/i', $rel[2])) {
				return $match[0];
			}
			$new = asanai_proxy_rewrite_url($match[3], $remote_base, $proxy_name, $current_path);
			if ($new === $match[3]) {
				return $match[0];
			}
			return '<link' . $match[1] . 'href=' . $match[2] . htmlspecialchars($new, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8') . $match[2] . $match[4] . '>';
		},
		$content
	) ?? $content;

	$content = preg_replace_callback(
		'/\bsrc=(["\'])(?!(?:https?:\/\/|\/\/|data:))([^"\']+\.(?:js|jpg|jpeg|png|gif|json)(?:\?[^"\']*)?)\1/i',
		static function (array $match) use ($proxy_name): string {
			if (str_starts_with($match[2], $proxy_name)) {
				return $match[0];
			}
			return 'src=' . $match[1] . $proxy_name . '?' . $match[2] . $match[1];
		},
		$content
	) ?? $content;

	$exclude = '(?!(?:https?:\/\/|\/\/|data:|#|mailto:|tel:|javascript:|' . preg_quote($proxy_name, '/') . '))';
	$content = preg_replace('/\bsrc=(["\'])' . $exclude . '([^"\']+)\1/i', 'src=$1' . $remote_base . '$2$1', $content) ?? $content;
	$content = preg_replace('/\bhref=(["\'])' . $exclude . '([^"\']+)\1/i', 'href=$1' . $remote_base . '$2$1', $content) ?? $content;

	return $content;
}

function asanai_proxy_normalize_path(string $path): string {
	$parts = [];
	foreach (explode('/', $path) as $part) {
		if ($part === '' || $part === '.') {
			continue;
		}
		if ($part === '..') {
			array_pop($parts);
			continue;
		}
		$parts[] = $part;
	}
	return implode('/', $parts);
}

function asanai_proxy_rewrite_css_url(string $url, string $remote_base, string $proxy_name, string $css_path): string {
	$url = trim(html_entity_decode($url, ENT_QUOTES | ENT_HTML5, 'UTF-8'));
	if ($url === '' || str_starts_with($url, '#') || str_starts_with(strtolower($url), 'data:')) {
		return $url;
	}
	$lower = strtolower($url);
	if (str_starts_with($url, '//') || (str_starts_with($lower, 'http://') && !str_starts_with($url, $remote_base)) || (str_starts_with($lower, 'https://') && !str_starts_with($url, $remote_base))) {
		return $url;
	}
	$base_path = rtrim((string)(parse_url($remote_base, PHP_URL_PATH) ?: '/'), '/') . '/';
	if (str_starts_with($lower, 'http://') || str_starts_with($lower, 'https://')) {
		$target = substr($url, strlen($remote_base));
	} elseif (str_starts_with($url, '/')) {
		if (!str_starts_with($url, $base_path)) {
			return $url;
		}
		$target = substr($url, strlen($base_path));
	} else {
		$dir = dirname($css_path);
		$target = ($dir === '.' || $dir === '/' ? '' : $dir . '/') . $url;
	}
	$target = asanai_proxy_normalize_path($target);
	if ($target === '') {
		return $url;
	}
	return $proxy_name . '?' . $target;
}

function asanai_proxy_rewrite_css(string $content, string $remote_base, string $proxy_name, string $css_path): string {
	$content = preg_replace_callback(
		'/url\(\s*([\'"]?)(.*?)\1\s*\)/is',
		static function (array $match) use ($remote_base, $proxy_name, $css_path): string {
			$new = asanai_proxy_rewrite_css_url($match[2], $remote_base, $proxy_name, $css_path);
			if ($new === $match[2]) {
				return $match[0];
			}
			$escaped = str_replace(['"', "'", ')'], ['%22', '%27', '%29'], $new);
			return 'url("' . $escaped . '")';
		},
		$content
	) ?? $content;
	$content = preg_replace_callback(
		'/@import\s+(?:url\(\s*)?([\'"])(.*?)\1\s*\)?/is',
		static function (array $match) use ($remote_base, $proxy_name, $css_path): string {
			$new = asanai_proxy_rewrite_css_url($match[2], $remote_base, $proxy_name, $css_path);
			if ($new === $match[2]) {
				return $match[0];
			}
			return '@import url("' . str_replace('"', '%22', $new) . '")';
		},
		$content
	) ?? $content;
	return $content;
}

function asanai_proxy_rewrite_cookie(string $cookie, bool $secure): string {
	$parts = explode(';', $cookie);
	$name = trim((string)array_shift($parts));
	if ($name === '') {
		return '';
	}
	$out = [$name];
	$has_path = false;
	foreach ($parts as $part) {
		$part = trim($part);
		if ($part === '') {
			continue;
		}
		$lower = strtolower($part);
		if (str_starts_with($lower, 'domain=')) {
			continue;
		}
		if (str_starts_with($lower, 'path=')) {
			$out[] = 'Path=/';
			$has_path = true;
			continue;
		}
		if (!$secure && str_starts_with($lower, 'secure')) {
			continue;
		}
		if (!$secure && str_starts_with($lower, 'samesite=none')) {
			$out[] = 'SameSite=Lax';
			continue;
		}
		$out[] = $part;
	}
	if (!$has_path) {
		$out[] = 'Path=/';
	}
	return implode('; ', $out);
}

$proxy_path_param = $_GET['__proxy_path'] ?? '';
if (is_array($proxy_path_param)) {
	asanai_proxy_abort(400, 'Invalid proxy path.');
}
if (is_string($proxy_path_param) && $proxy_path_param !== '') {
	$path = ltrim($proxy_path_param, '/');
	$extra = $_GET;
	unset($extra['__proxy_path']);
	$query = http_build_query($extra);
	if ($query !== '') {
		$path .= '?' . $query;
	}
} else {
	$path = ltrim((string)($_SERVER['QUERY_STRING'] ?? ''), '/');
}

$path = str_replace(["\r", "\n", "\0"], '', $path);
if ($path === '') {
	$path = 'index.php';
}
if (preg_match('~\.\.|\\\\|://~', $path)) {
	asanai_proxy_abort(400, 'Invalid path.');
}

$target_url = $remote_base . $path;
if (!str_starts_with($target_url, $remote_base)) {
	asanai_proxy_abort(403, 'Unauthorized target.');
}

// HTML and CSS are rewritten (URLs, index TOC suppression), so the remote
// validators no longer describe the bytes we send. Do not let the browser
// reuse a cached transformed response via a remote 304.
$remote_ext = strtolower(pathinfo((string)parse_url($path, PHP_URL_PATH), PATHINFO_EXTENSION));
$is_transformable = in_array($remote_ext, ['', 'php', 'html', 'css'], true);

$method = strtoupper((string)($_SERVER['REQUEST_METHOD'] ?? 'GET'));
$body = in_array($method, ['POST', 'PUT', 'PATCH'], true) ? file_get_contents('php://input') : null;
$headers = [];
$forward_headers = [
	'CONTENT_TYPE' => 'Content-Type',
	'HTTP_ACCEPT' => 'Accept',
	'HTTP_ACCEPT_LANGUAGE' => 'Accept-Language',
	'HTTP_REFERER' => 'Referer',
	'HTTP_USER_AGENT' => 'User-Agent',
	'HTTP_COOKIE' => 'Cookie',
	'HTTP_DNT' => 'DNT',
	'HTTP_SEC_GPC' => 'Sec-GPC',
	'HTTP_SEC_FETCH_SITE' => 'Sec-Fetch-Site',
	'HTTP_SEC_FETCH_MODE' => 'Sec-Fetch-Mode',
	'HTTP_SEC_FETCH_DEST' => 'Sec-Fetch-Dest',
	'HTTP_SEC_FETCH_USER' => 'Sec-Fetch-User',
	'HTTP_ORIGIN' => 'Origin',
	'HTTP_X_REQUESTED_WITH' => 'X-Requested-With',
	'HTTP_RANGE' => 'Range',
	'HTTP_IF_NONE_MATCH' => 'If-None-Match',
	'HTTP_IF_MODIFIED_SINCE' => 'If-Modified-Since',
];
foreach ($forward_headers as $server_key => $header_name) {
	if ($header_name === 'Cookie') {
		continue;
	}
	if ($is_transformable && ($header_name === 'If-None-Match' || $header_name === 'If-Modified-Since')) {
		continue;
	}
	$value = (string)($_SERVER[$server_key] ?? '');
	if ($value !== '') {
		$headers[] = $header_name . ': ' . $value;
	}
}
$allowed_cookies = ['theme', 'topics_pref', 'mnstats', 'mn_stats_admin', 'mn_stats_exclude'];
$forward_cookies = [];
foreach (explode(';', (string)($_SERVER['HTTP_COOKIE'] ?? '')) as $cookie) {
	$cookie = trim($cookie);
	if ($cookie === '') {
		continue;
	}
	$name = trim(explode('=', $cookie, 2)[0]);
	if (in_array($name, $allowed_cookies, true)) {
		$forward_cookies[] = $cookie;
	}
}
if ($forward_cookies) {
	$headers[] = 'Cookie: ' . implode('; ', $forward_cookies);
}
if (empty($_SERVER['HTTP_USER_AGENT'])) {
	$headers[] = 'User-Agent: Mozilla/5.0 (PHP blog proxy)';
}

$response_headers = [];
$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $target_url);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_FOLLOWLOCATION, false);
curl_setopt($ch, CURLOPT_MAXREDIRS, 0);
curl_setopt($ch, CURLOPT_CONNECTTIMEOUT, 10);
curl_setopt($ch, CURLOPT_TIMEOUT, 30);
curl_setopt($ch, CURLOPT_ENCODING, '');
curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
curl_setopt($ch, CURLOPT_HEADERFUNCTION, static function ($curl, string $line) use (&$response_headers): int {
	$trimmed = trim($line);
	if ($trimmed !== '') {
		$response_headers[] = $trimmed;
	}
	return strlen($line);
});
if ($body !== null) {
	curl_setopt($ch, CURLOPT_POSTFIELDS, $body);
	curl_setopt($ch, CURLOPT_CUSTOMREQUEST, $method);
} elseif ($method !== 'GET') {
	curl_setopt($ch, CURLOPT_CUSTOMREQUEST, $method);
}
if ($method === 'HEAD') {
	curl_setopt($ch, CURLOPT_NOBODY, true);
}

$content = curl_exec($ch);
$curl_error = curl_error($ch);
$status = (int)curl_getinfo($ch, CURLINFO_HTTP_CODE);
$curl_type = (string)(curl_getinfo($ch, CURLINFO_CONTENT_TYPE) ?: '');
curl_close($ch);

if ($content === false || $status === 0) {
	asanai_proxy_abort(502, 'Remote server error.' . ($curl_error !== '' ? ' ' . $curl_error : ''));
}

$header_map = [];
foreach ($response_headers as $line) {
	if (stripos($line, 'HTTP/') === 0) {
		continue;
	}
	$pair = explode(':', $line, 2);
	if (count($pair) !== 2) {
		continue;
	}
	$key = strtolower(trim($pair[0]));
	$value = trim($pair[1]);
	$header_map[$key][] = $value;
}

$content_type = $header_map['content-type'][0] ?? $curl_type;
if ($content_type === '') {
	$extension = strtolower(pathinfo((string)parse_url($path, PHP_URL_PATH), PATHINFO_EXTENSION));
	$mimes = [
		'js' => 'application/javascript',
		'css' => 'text/css',
		'png' => 'image/png',
		'jpg' => 'image/jpeg',
		'jpeg' => 'image/jpeg',
		'gif' => 'image/gif',
		'json' => 'application/json',
		'txt' => 'text/plain',
		'html' => 'text/html; charset=utf-8',
		'php' => 'text/html; charset=utf-8',
	];
	$content_type = $mimes[$extension] ?? 'application/octet-stream';
}

$current_remote_path = (string)explode('?', $path, 2)[0];
if (str_contains(strtolower($content_type), 'text/html') && $status !== 204 && $status !== 304) {
	$content = asanai_proxy_rewrite_html((string)$content, $remote_base, $proxy_name, $current_remote_path);
} elseif (str_contains(strtolower($content_type), 'text/css') && $status !== 204 && $status !== 304) {
	$content = asanai_proxy_rewrite_css((string)$content, $remote_base, $proxy_name, $current_remote_path);
}

http_response_code($status);
if ($content_type !== '') {
	header('Content-Type: ' . $content_type);
}
$forward_header_names = [
	'content-disposition' => 'Content-Disposition',
	'cache-control' => 'Cache-Control',
	'pragma' => 'Pragma',
	'expires' => 'Expires',
	'etag' => 'ETag',
	'last-modified' => 'Last-Modified',
	'x-robots-tag' => 'X-Robots-Tag',
	'referrer-policy' => 'Referrer-Policy',
	'x-content-type-options' => 'X-Content-Type-Options',
	'vary' => 'Vary',
	'permissions-policy' => 'Permissions-Policy',
	'access-control-allow-origin' => 'Access-Control-Allow-Origin',
	'access-control-allow-methods' => 'Access-Control-Allow-Methods',
	'access-control-allow-headers' => 'Access-Control-Allow-Headers',
];
foreach ($forward_header_names as $forward => $header_name) {
	if ($is_transformable && in_array($forward, ['cache-control', 'etag', 'last-modified', 'expires'], true)) {
		continue;
	}
	foreach ($header_map[$forward] ?? [] as $value) {
		header($header_name . ': ' . $value, false);
	}
}
if ($is_transformable) {
	header('Cache-Control: no-cache, must-revalidate', true);
}

$is_secure = (!empty($_SERVER['HTTPS']) && (string)$_SERVER['HTTPS'] !== 'off')
	|| strtolower((string)($_SERVER['HTTP_X_FORWARDED_PROTO'] ?? '')) === 'https';
foreach ($header_map['set-cookie'] ?? [] as $cookie) {
	$cookie = asanai_proxy_rewrite_cookie($cookie, $is_secure);
	if ($cookie !== '') {
		header('Set-Cookie: ' . $cookie, false);
	}
}

$location = $header_map['location'][0] ?? '';
if ($location !== '') {
	$location = asanai_proxy_rewrite_url($location, $remote_base, $proxy_name, $current_remote_path);
	header('Location: ' . $location, true, $status);
}

if ($status !== 204 && $status !== 304 && $method !== 'HEAD') {
	echo $content;
}
