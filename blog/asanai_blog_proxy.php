<?php
$remote_base = 'https://asanai.scads.ai/blog/';
$query_string = $_SERVER['QUERY_STRING'];
$path = ltrim($query_string, '/');
$path = filter_var($path, FILTER_SANITIZE_URL);

if (empty($path)) {
    $path = 'index.php';
}

$target_url = $remote_base . $path . (strpos($path, '?') !== false ? '&' : '?') . "load_from_asanai=1";

if (strpos($target_url, $remote_base) !== 0) {
    die("Unauthorized Target.");
}

$context = stream_context_create([
    "http" => ["header" => "User-Agent: Mozilla/5.0 (PHP Proxy)\r\n"]
]);

$content = @file_get_contents($target_url, false, $context);

if ($content === FALSE) {
    header("HTTP/1.1 404 Not Found");
    exit("File not found on remote server.");
}

$extension = pathinfo($path, PATHINFO_EXTENSION);
$mimes = [
    'js'   => 'application/javascript',
    'css'  => 'text/css',
    'png'  => 'image/png',
    'jpg'  => 'image/jpeg',
    'html' => 'text/html',
    'php'  => 'text/html'
];

$contentType = isset($mimes[$extension]) ? $mimes[$extension] : 'text/html';
header("Content-Type: " . $contentType);

// --- START DER PFAD-UMSCHREIBUNG ---
if ($contentType === 'text/html') {
    // 1. Ersetze src="..." durch absolute URLs, sofern sie nicht schon absolut sind (http/https/data:)
    $content = preg_replace(
        '/src=["\'](?!http|https|data:)([^"\']+)["\']/', 
        'src="' . $remote_base . '$1"', 
        $content
    );

    // 2. Ersetze href="..." für CSS oder andere Ressourcen (aber vorsicht bei Links!)
    // Hier werden nur Ressourcen umgeschrieben, die keine internen Anker oder absoluten Links sind
    $content = preg_replace(
        '/href=["\'](?!http|https|#)([^"\']+)["\']/', 
        'href="' . $remote_base . '$1"', 
        $content
    );
}
// --- ENDE DER PFAD-UMSCHREIBUNG ---

echo $content;
?>
