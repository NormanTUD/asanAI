<?php
/**
 * PHP Proxy für asanai.scads.ai/blog
 * Ursprung: Standard Web-Proxy Pattern mit Regex-Manipulation
 */

// Konfiguration
$remote_base = 'https://asanai.scads.ai/blog/';
$proxy_name  = 'asanai_blog_proxy.php'; // Der Name dieser Datei

// 1. Pfad aus Query String extrahieren
$query_string = $_SERVER['QUERY_STRING'];
$path = ltrim($query_string, '/');
$path = filter_var($path, FILTER_SANITIZE_URL);

// Standardmäßig index.php laden
if (empty($path)) {
	$path = 'index.php';
}

// 2. Ziel-URL bauen
$target_url = $remote_base . $path;

// Falls wir Parameter an die Remote-URL hängen müssen (z.B. für Tracking/Erkennung)
$connector = (strpos($target_url, '?') !== false) ? '&' : '?';
$final_url = $target_url; # . $connector . "load_from_asanai=1";

// 3. Sicherheit: SSRF Schutz
if (strpos($final_url, $remote_base) !== 0) {
	header("HTTP/1.1 403 Forbidden");
	exit("Unauthorized Target.");
}

// 4. Content abrufen (via cURL für bessere Header-Unterstützung)
$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $final_url);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
curl_setopt($ch, CURLOPT_USERAGENT, 'Mozilla/5.0 (PHP Proxy)');
$content = curl_exec($ch);
$http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$content_type_header = curl_getinfo($ch, CURLINFO_CONTENT_TYPE);
curl_close($ch);

if ($http_code !== 200 || $content === false) {
	header("HTTP/1.1 404 Not Found");
	exit("Resource not found or remote server error.");
}

// 5. Mime-Type Bestimmung
$extension = strtolower(pathinfo($path, PATHINFO_EXTENSION));
$mimes = [
	'js'   => 'application/javascript',
	'css'  => 'text/css',
	'png'  => 'image/png',
	'jpg'  => 'image/jpeg',
	'jpeg' => 'image/jpeg',
	'gif'  => 'image/gif',
	'txt'  => 'text/plain',
	'html' => 'text/html',
	'php'  => 'text/html'
];

// Content-Type Header setzen
$contentType = isset($mimes[$extension]) ? $mimes[$extension] : $content_type_header;
header("Content-Type: " . $contentType);

// 6. Content Manipulation
// 6. Content Manipulation
// 6. Content Manipulation
if (strpos($contentType, 'text/html') !== false) {
    // 6a. First, handle .js files to route them through the proxy
    $content = preg_replace_callback(
        '/src=(["\'])([^"\']+\.js)\1/',
        function ($matches) use ($proxy_name) {
            return 'src=' . $matches[1] . $proxy_name . '?' . $matches[2] . $matches[1];
        },
        $content
    );

    // 6b. Absolute paths for others, BUT ignore anything already pointing to the proxy
    // Added (?!http|https|data:|' . preg_quote($proxy_name) . ') to the exclusion list
    $exclude_pattern = '(?!http|https|data:|' . preg_quote($proxy_name) . ')';
    
    $content = preg_replace('/src=["\']' . $exclude_pattern . '([^"\']+)["\']/', 'src="' . $remote_base . '$1"', $content);
    $content = preg_replace('/href=["\']' . $exclude_pattern . '([^"\']+)["\']/', 'href="' . $remote_base . '$1"', $content);
} 
elseif (strpos($contentType, 'application/javascript') !== false) {
    // JS: Strings with extensions on this proxy (including .js)
    $content = preg_replace_callback(
        '/ (["\']) ([^"\'\s]+\.(json|txt|jpg|png|jpeg|js)) \1 /x',
        function ($matches) use ($proxy_name) {
            $quote = $matches[1];
            $path  = $matches[2];
            // Skip if already absolute or already proxied
            if (preg_match('/^http/', $path) || strpos($path, $proxy_name) !== false) {
                return $matches[0];
            }
            return $quote . $proxy_name . "?" . $path . $quote;
        },
        $content
    );
}

// 7. Ausgabe
echo $content;
?>
