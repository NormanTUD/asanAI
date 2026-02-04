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
if (strpos($contentType, 'text/html') !== false) {
    // HTML: Ressourcen auf absolute Remote-Pfade biegen (Bilder/Styles)
    $content = preg_replace('/src=["\'](?!http|https|data:)([^"\']+)["\']/', 'src="' . $remote_base . '$1"', $content);
    $content = preg_replace('/href=["\'](?!http|https|#)([^"\']+)["\']/', 'href="' . $remote_base . '$1"', $content);
} 
elseif (strpos($contentType, 'application/javascript') !== false) {
    // JS: Strings mit .txt, .jpg, .png auf diesen Proxy umleiten
    $content = preg_replace_callback(
        '/["\']([^"\'\s]+\.(json|txt|jpg|png|jpeg))["\']/',
        function ($matches) use ($proxy_name) {
            $found_path = $matches[1];
            // Wenn bereits absolut, nichts tun
            if (preg_match('/^http/', $found_path)) {
                return $matches[0];
            }
            // Lokal auf diesen Proxy umleiten
            return "'" . $proxy_name . "?" . $found_path . "'";
        },
        $content
    );
}

// 7. Ausgabe
echo $content;
?>
