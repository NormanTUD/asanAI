<?php
declare(strict_types=1);

/**
 * image.php — server-side image cropping and aspect-ratio fitting.
 *
 * Same logic as before. This revision surfaces every failure mode as a
 * plain-text HTTP response with a Debian-specific mitigation hint, so
 * "500 Internal Server Error" with no body should no longer occur.
 *
 * Parameters: see original header (unchanged).
 */

$baseDir = __DIR__;

// ---------------------------------------------------------------------------
// Global error surfacing. Anything that would otherwise produce a blank 500
// (fatal errors, uncaught exceptions, missing extensions, out-of-memory, ...)
// is caught here and returned as a readable message.
// ---------------------------------------------------------------------------

ini_set('display_errors', '0');   // never leak HTML/notices into image output
ini_set('log_errors',    '1');

function img_send(int $code, string $msg, string $hint = ''): void {
	if (!headers_sent()) {
		// Remove any partial image headers a previous step might have set.
		header_remove('Content-Type');
		header_remove('ETag');
		header_remove('Cache-Control');
		http_response_code($code);
		header('Content-Type: text/plain; charset=utf-8');
		header('Cache-Control: no-store');
	}
	echo "HTTP {$code}: {$msg}\n";
	if ($hint !== '') {
		echo "\nHow to fix on Debian:\n{$hint}\n";
	}
	exit;
}

function img_err(int $code, string $msg, string $hint = ''): void {
	img_send($code, $msg, $hint);
}

set_error_handler(function (int $severity, string $message, string $file, int $line): bool {
	// Only convert errors that are part of the active error_reporting mask.
	if (!(error_reporting() & $severity)) {
		return false;
	}
	img_send(500, "PHP error: {$message} at {$file}:{$line}",
		"Check the web server error log:\n" .
		"  sudo tail -n 100 /var/log/apache2/error.log      # Apache\n" .
		"  sudo journalctl -u php*-fpm -n 100 --no-pager    # PHP-FPM\n" .
		"  sudo tail -n 100 /var/log/nginx/error.log        # nginx");
});

set_exception_handler(function (\Throwable $e): void {
	img_send(500, 'Uncaught ' . get_class($e) . ': ' . $e->getMessage()
			  . ' at ' . $e->getFile() . ':' . $e->getLine(),
		"Check the web server error log (see paths above).\n" .
		"Stack trace has been written to the PHP error log.");
});

register_shutdown_function(function (): void {
	$e = error_get_last();
	if ($e === null) return;
	$fatal = E_ERROR | E_PARSE | E_CORE_ERROR | E_COMPILE_ERROR | E_USER_ERROR | E_RECOVERABLE_ERROR;
	if (($e['type'] & $fatal) === 0) return;

	$msg  = $e['message'];
	$hint = '';

	if (stripos($msg, 'allowed memory size') !== false) {
		$hint = "PHP ran out of memory while decoding/resizing the image.\n" .
				"  1) Raise the limit in /etc/php/*/fpm/php.ini (or apache2/php.ini):\n" .
				"       memory_limit = 512M\n" .
				"  2) Restart PHP:\n" .
				"       sudo systemctl restart php*-fpm    # or apache2\n" .
				"  3) Or request a smaller output width via ?w=...";
	} elseif (stripos($msg, 'maximum execution time') !== false) {
		$hint = "The script exceeded max_execution_time.\n" .
				"  Edit /etc/php/*/fpm/php.ini and set:\n" .
				"    max_execution_time = 60\n" .
				"  Then: sudo systemctl restart php*-fpm";
	} elseif (stripos($msg, 'undefined function') !== false
		   && stripos($msg, 'imagecreate') !== false) {
		$hint = "The GD extension is not loaded.\n" .
				"  sudo apt update\n" .
				"  sudo apt install php-gd\n" .
				"  sudo systemctl restart php*-fpm   # or apache2";
	} else {
		$hint = "Check the PHP/web-server error logs for the full trace:\n" .
				"  sudo tail -n 100 /var/log/apache2/error.log\n" .
				"  sudo tail -n 100 /var/log/nginx/error.log\n" .
				"  sudo journalctl -u php*-fpm -n 100 --no-pager";
	}

	img_send(500, "Fatal PHP error: {$msg} at {$e['file']}:{$e['line']}", $hint);
});

// ---------------------------------------------------------------------------
// Environment checks. These are the two most common reasons a script that
// "works on my machine" 500s on a fresh Debian box.
// ---------------------------------------------------------------------------

if (!extension_loaded('gd')) {
	img_err(500,
		'PHP GD extension is not installed or not enabled.',
		"Install it and restart PHP:\n" .
		"  sudo apt update\n" .
		"  sudo apt install php-gd\n" .
		"  sudo systemctl restart php*-fpm      # for PHP-FPM (nginx)\n" .
		"  sudo systemctl restart apache2       # for mod_php\n" .
		"Verify with: php -m | grep -i gd");
}

if (!function_exists('imagecreatetruecolor')) {
	img_err(500,
		'GD is loaded but core functions are missing (broken build?).',
		"Reinstall the GD package:\n" .
		"  sudo apt install --reinstall php-gd\n" .
		"  sudo systemctl restart php*-fpm");
}

$gdInfo = function_exists('gd_info') ? gd_info() : [];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function img_parse_ratio(string $s): ?float {
	$s = trim($s);
	if ($s === '') return null;
	if (strpos($s, ':') !== false) {
		$parts = explode(':', $s, 2);
		$a = (float)trim($parts[0]);
		$b = (float)trim($parts[1]);
		if ($a <= 0.0 || $b <= 0.0) return null;
		return $a / $b;
	}
	$v = (float)$s;
	return $v > 0.0 ? $v : null;
}

function img_clamp01(float $v): float {
	if ($v < 0.0) return 0.0;
	if ($v > 1.0) return 1.0;
	return $v;
}

// ---------------------------------------------------------------------------
// Resolve & validate the source file
// ---------------------------------------------------------------------------

$file = isset($_GET['f']) ? (string)$_GET['f'] : '';
if ($file === '') {
	img_err(400, 'Missing "f" parameter.',
		'Pass a filename: image.php?f=picture.jpg');
}
if (!preg_match('/^[A-Za-z0-9._\-]+$/', $file)) {
	img_err(400, 'Invalid "f" parameter (allowed: A-Z a-z 0-9 . _ -).',
		'Rename the file or URL-encode a compliant name. No directories are allowed.');
}

$baseReal = realpath($baseDir);
if ($baseReal === false) {
	img_err(500, "Base directory could not be resolved: {$baseDir}",
		"Check that the directory exists and is readable by the web-server user:\n" .
		"  sudo ls -ld " . escapeshellarg($baseDir) . "\n" .
		"  sudo chown -R www-data:www-data " . escapeshellarg($baseDir));
}

$candidate = $baseDir . DIRECTORY_SEPARATOR . $file;
$srcPath   = realpath($candidate);

if ($srcPath === false) {
	img_err(404, "Image not found: {$file}",
		"Verify the file exists and is readable by www-data:\n" .
		"  sudo ls -l " . escapeshellarg($candidate) . "\n" .
		"  sudo -u www-data test -r " . escapeshellarg($candidate) . " && echo OK || echo UNREADABLE\n" .
		"If it is unreadable:\n" .
		"  sudo chown www-data:www-data " . escapeshellarg($candidate) . "\n" .
		"  sudo chmod 644 " . escapeshellarg($candidate));
}
if (!is_file($srcPath)) {
	img_err(404, "Not a regular file: {$file}");
}
if (strncmp($srcPath, $baseReal . DIRECTORY_SEPARATOR, strlen($baseReal) + 1) !== 0) {
	img_err(403, 'Refusing to read outside the script directory (symlink escape).',
		'Move the file inside the script directory, or resolve the symlink target so it points inside it.');
}
if (!is_readable($srcPath)) {
	img_err(403, "Source image not readable: {$file}",
		"Fix ownership/permissions:\n" .
		"  sudo chown www-data:www-data " . escapeshellarg($srcPath) . "\n" .
		"  sudo chmod 644 " . escapeshellarg($srcPath));
}

$info = @getimagesize($srcPath);
if ($info === false) {
	img_err(415, "Cannot read image header: {$file}",
		"The file is either corrupt or not a real image.\n" .
		"  file " . escapeshellarg($srcPath) . "\n" .
		"  identify " . escapeshellarg($srcPath) . "   # from 'imagemagick' package");
}
[$srcW, $srcH] = $info;
$srcType = $info[2];

$loaders = [
	IMAGETYPE_JPEG => ['imagecreatefromjpeg', 'JPEG', 'JPEG Support'],
	IMAGETYPE_PNG  => ['imagecreatefrompng',  'PNG',  'PNG Support'],
	IMAGETYPE_WEBP => ['imagecreatefromwebp', 'WebP', 'WebP Support'],
];
if (!isset($loaders[$srcType])) {
	img_err(415, "Source format not supported (image type id {$srcType}).",
		"This script handles JPEG, PNG and WebP. Convert the source with:\n" .
		"  sudo apt install imagemagick\n" .
		"  convert " . escapeshellarg($srcPath) . " " . escapeshellarg($srcPath . '.jpg'));
}

[$loaderFn, $fmtName, $gdKey] = $loaders[$srcType];

if (!function_exists($loaderFn)) {
	img_err(500,
		"GD is missing {$fmtName} support (function {$loaderFn} not available).",
		"Install the format library and rebuild php-gd:\n" .
		"  sudo apt install php-gd libjpeg-dev libpng-dev libwebp-dev\n" .
		"  sudo apt install --reinstall php-gd\n" .
		"  sudo systemctl restart php*-fpm\n" .
		"Verify with: php -r 'print_r(gd_info());'");
}
if (isset($gdInfo[$gdKey]) && $gdInfo[$gdKey] === false) {
	img_err(500,
		"GD reports {$fmtName} support is disabled.",
		"Reinstall php-gd with format libraries:\n" .
		"  sudo apt install --reinstall php-gd\n" .
		"  sudo systemctl restart php*-fpm");
}

$src = @$loaderFn($srcPath);
if ($src === false) {
	img_err(500, "Failed to decode source image ({$fmtName}): {$file}",
		"The file may be corrupt or truncated. Try:\n" .
		"  identify -verbose " . escapeshellarg($srcPath) . "\n" .
		"If the file is very large, PHP may be out of memory — raise\n" .
		"memory_limit in /etc/php/*/fpm/php.ini and restart php-fpm.");
}

// ---------------------------------------------------------------------------
// Determine output format
// ---------------------------------------------------------------------------

$defaultFmt = [
	IMAGETYPE_JPEG => 'jpg',
	IMAGETYPE_PNG  => 'png',
	IMAGETYPE_WEBP => 'webp',
][$srcType] ?? 'jpg';

$fmt = strtolower((string)($_GET['fmt'] ?? $defaultFmt));
if (!in_array($fmt, ['jpg', 'jpeg', 'png', 'webp'], true)) {
	imagedestroy($src);
	img_err(400, "Unsupported output format: {$fmt}",
		'Use one of: jpg, png, webp. Example: &fmt=webp');
}
$fmt = ($fmt === 'jpeg') ? 'jpg' : $fmt;

$encoders = [
	'jpg'  => ['imagejpeg', 'JPEG', 'JPEG Support'],
	'png'  => ['imagepng',  'PNG',  'PNG Support'],
	'webp' => ['imagewebp', 'WebP', 'WebP Support'],
];
[$encFn, $encName, $encGdKey] = $encoders[$fmt];
if (!function_exists($encFn) || (isset($gdInfo[$encGdKey]) && $gdInfo[$encGdKey] === false)) {
	imagedestroy($src);
	img_err(500,
		"GD cannot output {$encName} on this server.",
		"Install the required libraries and reinstall php-gd:\n" .
		"  sudo apt install libjpeg-dev libpng-dev libwebp-dev\n" .
		"  sudo apt install --reinstall php-gd\n" .
		"  sudo systemctl restart php*-fpm");
}

// ---------------------------------------------------------------------------
// Resolve aspect ratio (if any)
// ---------------------------------------------------------------------------

$ar = null;
if (isset($_GET['ar-base']) && $_GET['ar-base'] !== '') {
	$baseFile = (string)$_GET['ar-base'];
	if (!preg_match('/^[A-Za-z0-9._\-]+$/', $baseFile)) {
		imagedestroy($src);
		img_err(400, 'Invalid "ar-base" filename (allowed: A-Z a-z 0-9 . _ -).');
	}
	$basePath = realpath($baseDir . DIRECTORY_SEPARATOR . $baseFile);
	if ($basePath === false || !is_file($basePath)) {
		imagedestroy($src);
		img_err(404, "ar-base image not found: {$baseFile}",
			"Check that the reference file exists in " . escapeshellarg($baseDir) . '.');
	}
	if (strncmp($basePath, $baseReal . DIRECTORY_SEPARATOR, strlen($baseReal) + 1) !== 0) {
		imagedestroy($src);
		img_err(403, 'ar-base resolves outside the script directory.');
	}
	if (!is_readable($basePath)) {
		imagedestroy($src);
		img_err(403, "ar-base not readable: {$baseFile}",
			"  sudo chown www-data:www-data " . escapeshellarg($basePath) . "\n" .
			"  sudo chmod 644 " . escapeshellarg($basePath));
	}
	$binfo = @getimagesize($basePath);
	if ($binfo === false || $binfo[0] <= 0 || $binfo[1] <= 0) {
		imagedestroy($src);
		img_err(415, "Cannot read ar-base header: {$baseFile}",
			"The file may be corrupt: file " . escapeshellarg($basePath));
	}
	$ar = (float)$binfo[0] / (float)$binfo[1];
} elseif (isset($_GET['ar']) && $_GET['ar'] !== '') {
	$ar = img_parse_ratio((string)$_GET['ar']);
	if ($ar === null) {
		imagedestroy($src);
		img_err(400, 'Invalid "ar" value.',
			'Use "W:H" (e.g. 16:9) or a positive float (e.g. 1.78).');
	}
}

// ---------------------------------------------------------------------------
// Resolve explicit crop edges
// ---------------------------------------------------------------------------

$mode = strtolower((string)($_GET['mode'] ?? 'px'));
if ($mode !== 'px' && $mode !== 'frac') {
	imagedestroy($src);
	img_err(400, "Invalid \"mode\" value: {$mode}",
		'Use mode=px (pixels) or mode=frac (fractions 0..1).');
}

$expX1 = (isset($_GET['x1']) && is_numeric($_GET['x1'])) ? (float)$_GET['x1'] : null;
$expX2 = (isset($_GET['x2']) && is_numeric($_GET['x2'])) ? (float)$_GET['x2'] : null;
$expY1 = (isset($_GET['y1']) && is_numeric($_GET['y1'])) ? (float)$_GET['y1'] : null;
$expY2 = (isset($_GET['y2']) && is_numeric($_GET['y2'])) ? (float)$_GET['y2'] : null;
$hasExplicitCrop = $expX1 !== null || $expX2 !== null || $expY1 !== null || $expY2 !== null;

$cx = (isset($_GET['cx']) && is_numeric($_GET['cx'])) ? img_clamp01((float)$_GET['cx']) : 0.5;
$cy = (isset($_GET['cy']) && is_numeric($_GET['cy'])) ? img_clamp01((float)$_GET['cy']) : 0.5;

// ---------------------------------------------------------------------------
// Compute the final crop rectangle
// ---------------------------------------------------------------------------

$cropX = 0;
$cropY = 0;
$cropW = $srcW;
$cropH = $srcH;

if ($ar !== null && !$hasExplicitCrop) {
	$srcAr = $srcW / $srcH;
	if ($srcAr > $ar) {
		$newH = $srcH;
		$newW = (int)floor($srcH * $ar);
	} else {
		$newW = $srcW;
		$newH = (int)floor($srcW / $ar);
	}
	if ($newW < 1) $newW = 1;
	if ($newH < 1) $newH = 1;
	$cropW = $newW;
	$cropH = $newH;
	$cropX = (int)round(($srcW - $newW) * $cx);
	$cropY = (int)round(($srcH - $newH) * $cy);
} else {
	$x1 = $expX1 ?? 0.0;
	$x2 = $expX2 ?? ($mode === 'frac' ? 1.0 : (float)$srcW);
	$y1 = $expY1 ?? 0.0;
	$y2 = $expY2 ?? ($mode === 'frac' ? 1.0 : (float)$srcH);

	if ($mode === 'frac') {
		$x1 *= $srcW; $x2 *= $srcW;
		$y1 *= $srcH; $y2 *= $srcH;
	}

	if ($x2 < $x1) { $t = $x1; $x1 = $x2; $x2 = $t; }
	if ($y2 < $y1) { $t = $y1; $y1 = $y2; $y2 = $t; }

	if ($ar !== null && $x2 - $x1 > 0 && $y2 - $y1 > 0) {
		$boxAr = ($x2 - $x1) / ($y2 - $y1);
		if ($boxAr > $ar) {
			$newW = ($y2 - $y1) * $ar;
			$cxAbs = ($x1 + $x2) * 0.5 + ($cx - 0.5) * (($x2 - $x1) - $newW);
			$x1 = $cxAbs - $newW * 0.5;
			$x2 = $x1 + $newW;
		} else {
			$newH = ($x2 - $x1) / $ar;
			$cyAbs = ($y1 + $y2) * 0.5 + ($cy - 0.5) * (($y2 - $y1) - $newH);
			$y1 = $cyAbs - $newH * 0.5;
			$y2 = $y1 + $newH;
		}
	}

	$cropX = (int)max(0, min($srcW, floor($x1)));
	$cropY = (int)max(0, min($srcH, floor($y1)));
	$cropW = (int)max(1, min($srcW - $cropX, (int)round($x2) - $cropX));
	$cropH = (int)max(1, min($srcH - $cropY, (int)round($y2) - $cropY));
}

if ($cropW < 1 || $cropH < 1) {
	imagedestroy($src);
	img_err(400, "Computed crop is empty ({$cropW}x{$cropH}).",
		'Check x1/y1/x2/y2 values — they must produce a non-empty rectangle inside the source.');
}

// ---------------------------------------------------------------------------
// Optional resize
// ---------------------------------------------------------------------------

$outW = $cropW;
if (isset($_GET['w'])) {
	if (!is_numeric($_GET['w']) || (int)$_GET['w'] <= 0) {
		imagedestroy($src);
		img_err(400, 'Invalid "w" parameter.',
			'Pass a positive integer, e.g. &w=800');
	}
	$outW = (int)$_GET['w'];
}
if ($outW < 1) $outW = 1;
$outH = (int)max(1, round($outW * $cropH / $cropW));

// ---------------------------------------------------------------------------
// Allocate destination
// ---------------------------------------------------------------------------

$dst = @imagecreatetruecolor($outW, $outH);
if ($dst === false) {
	imagedestroy($src);
	img_err(500, "Failed to allocate destination image ({$outW}x{$outH}).",
		"This usually means PHP ran out of memory.\n" .
		"  Raise memory_limit in /etc/php/*/fpm/php.ini (e.g. 512M),\n" .
		"  then: sudo systemctl restart php*-fpm\n" .
		"  Or request a smaller output width via ?w=...");
}

if ($fmt === 'png' || $fmt === 'webp') {
	imagealphablending($dst, false);
	imagesavealpha($dst, true);
	$transparent = imagecolorallocatealpha($dst, 0, 0, 0, 127);
	if ($transparent !== false) {
		imagefilledrectangle($dst, 0, 0, $outW, $outH, $transparent);
	}
}

if (!imagecopyresampled($dst, $src, 0, 0, $cropX, $cropY, $outW, $outH, $cropW, $cropH)) {
	imagedestroy($src);
	imagedestroy($dst);
	img_err(500, 'imagecopyresampled() failed while cropping/resizing.',
		"This normally indicates broken GD or out-of-memory:\n" .
		"  1) Check available memory:  free -h\n" .
		"  2) Raise memory_limit in /etc/php/*/fpm/php.ini (e.g. 512M),\n" .
		"     then: sudo systemctl restart php*-fpm\n" .
		"  3) Reinstall GD:  sudo apt install --reinstall php-gd");
}

// Source bitmap is no longer needed.
imagedestroy($src);

// ---------------------------------------------------------------------------
// Caching & output
// ---------------------------------------------------------------------------

$stat = @stat($srcPath);
if ($stat === false) {
	imagedestroy($dst);
	img_err(500, "Could not stat source file: {$file}",
		"Check permissions for the web-server user:\n" .
		"  sudo -u www-data stat " . escapeshellarg($srcPath) . "\n" .
		"  sudo chown www-data:www-data " . escapeshellarg($srcPath) . "\n" .
		"  sudo chmod 644 " . escapeshellarg($srcPath));
}
$mtime = $stat['mtime'];

$cacheKey = $file . '|' . $fmt . '|' . $outW
		  . '|' . $cropX . ',' . $cropY . ',' . $cropW . ',' . $cropH
		  . '|' . ($ar ?? '') . '|' . $cx . ',' . $cy;
$etag = '"img-' . $mtime . '-' . md5($cacheKey) . '"';

if (headers_sent($hsFile, $hsLine)) {
	imagedestroy($dst);
	img_err(500, "Headers already sent at {$hsFile}:{$hsLine}; cannot stream image.",
		"Something printed output before this script produced headers.\n" .
		"Common causes on Debian:\n" .
		"  * A UTF-8 BOM at the start of the PHP file. Remove it:\n" .
		"      sudo apt install moreutils\n" .
		"      sed -i '1s/^\\xEF\\xBB\\xBF//' " . escapeshellarg(__FILE__) . "\n" .
		"  * Whitespace before <?php or after ?> in an included file.\n" .
		"  * A stray var_dump()/echo elsewhere in the codebase.");
}

header('ETag: ' . $etag);
header('Cache-Control: public, max-age=86400');
header('X-Content-Type-Options: nosniff');
header('Last-Modified: ' . gmdate('D, d M Y H:i:s', $mtime) . ' GMT');

if (isset($_SERVER['HTTP_IF_NONE_MATCH']) && trim($_SERVER['HTTP_IF_NONE_MATCH']) === $etag) {
	imagedestroy($dst);
	http_response_code(304);
	exit;
}

$mimeMap = ['jpg' => 'image/jpeg', 'png' => 'image/png', 'webp' => 'image/webp'];
header('Content-Type: ' . $mimeMap[$fmt]);

$quality = 85;
if (isset($_GET['q'])) {
	if (!is_numeric($_GET['q'])) {
		imagedestroy($dst);
		img_err(400, 'Invalid "q" parameter (must be numeric 1..100).');
	}
	$quality = max(1, min(100, (int)$_GET['q']));
}

// Any warning that GD emits during encoding (e.g. "gd-jpeg: JPEG library
// reports unrecoverable error") is turned into a readable message instead
// of a corrupt binary stream.
$encodeWarning = null;
set_error_handler(function (int $s, string $m) use (&$encodeWarning): bool {
	$encodeWarning = $m;
	return true; // swallow — we will report via img_err below
}, E_WARNING | E_NOTICE);

$ok = false;
try {
	switch ($fmt) {
		case 'jpg':
			$ok = imagejpeg($dst, null, $quality);
			break;
		case 'png':
			// PNG compression level is 0..9; map from quality (100 => 0, 1 => 9).
			$pngLevel = (int)round((100 - $quality) / 11);
			if ($pngLevel < 0) $pngLevel = 0;
			if ($pngLevel > 9) $pngLevel = 9;
			$ok = imagepng($dst, null, $pngLevel);
			break;
		case 'webp':
			$ok = imagewebp($dst, null, $quality);
			break;
	}
} finally {
	restore_error_handler();
}

imagedestroy($dst);

if (!$ok) {
	$hint = "GD failed to encode the output as {$fmt}.\n";
	if ($encodeWarning !== null) {
		$hint .= "GD said: {$encodeWarning}\n\n";
	}
	if ($fmt === 'webp') {
		$hint .= "WebP output requires libwebp. On Debian:\n" .
				 "  sudo apt install libwebp-dev\n" .
				 "  sudo apt install --reinstall php-gd\n" .
				 "  sudo systemctl restart php*-fpm";
	} elseif ($fmt === 'jpg') {
		$hint .= "JPEG output requires libjpeg. On Debian:\n" .
				 "  sudo apt install libjpeg-dev\n" .
				 "  sudo apt install --reinstall php-gd\n" .
				 "  sudo systemctl restart php*-fpm";
	} else {
		$hint .= "PNG output requires libpng. On Debian:\n" .
				 "  sudo apt install libpng-dev\n" .
				 "  sudo apt install --reinstall php-gd\n" .
				 "  sudo systemctl restart php*-fpm";
	}
	img_err(500, "Failed to encode image as {$fmt}.", $hint);
}
