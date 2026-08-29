<?php
declare(strict_types=1);

/**
 * image.php — server-side image cropping and aspect-ratio fitting.
 *
 * Reads an image from disk, crops it according to GET parameters and
 * streams the result back. The original file is never modified.
 *
 * Parameters:
 *   f       filename, relative to this script's directory. Allowed chars:
 *           A–Z, a–z, 0–9, dot, dash, underscore.
 *   x1,y1   top-left of the crop rectangle.
 *   x2,y2   bottom-right of the crop rectangle.
 *   mode    "px" (default) for pixel values, "frac" for 0..1 fractions of
 *           width/height. Affects x1/x2/y1/y2 only.
 *   ar      target aspect ratio, either "w:h" (e.g. "16:9") or a float
 *           (e.g. "1.78"). The crop is the largest box with this ratio
 *           that fits in the source, anchored at (cx, cy).
 *   ar-base filename whose native aspect ratio is used (e.g. "cave_hands.jpg").
 *           Mutually exclusive with ar — takes precedence when both given.
 *   cx,cy   anchor of an ar-crop, 0..1. Default 0.5,0.5 (centred).
 *           Ignored when x1/y1/x2/y2 are supplied.
 *   w       output width in pixels. The crop is resampled to this width;
 *           height follows from the aspect ratio. Default = crop width
 *           (no resampling).
 *   q       jpeg / webp quality 1..100. Default 85. Ignored for png.
 *   fmt     output format: jpg | png | webp. Default = source format.
 *
 * Examples:
 *   image.php?f=FrankRosenblattWiringPerceptron.jpg&ar-base=cave_hands.jpg
 *     -> crop perceptron image to the aspect ratio of cave_hands.jpg.
 *   image.php?f=picture.jpg&x1=100&y1=50&x2=900&y2=600
 *     -> crop to the pixel rectangle (100,50)-(900,600).
 *   image.php?f=picture.jpg&x1=0&x2=1&y1=0.25&y2=0.75&mode=frac
 *     -> crop to a centred horizontal band, expressed as fractions.
 */

$baseDir = __DIR__;

function img_err(int $code, string $msg): void {
	http_response_code($code);
	header('Content-Type: text/plain; charset=utf-8');
	header('Cache-Control: no-store');
	echo $msg;
	exit;
}

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

// --- resolve & validate the source file ------------------------------------

$file = isset($_GET['f']) ? (string)$_GET['f'] : '';
if ($file === '' || !preg_match('/^[A-Za-z0-9._\-]+$/', $file)) {
	img_err(400, 'Missing or invalid "f" parameter');
}

$baseReal = realpath($baseDir);
$srcPath  = realpath($baseDir . DIRECTORY_SEPARATOR . $file);
if ($baseReal === false || $srcPath === false || !is_file($srcPath)
	|| strncmp($srcPath, $baseReal . DIRECTORY_SEPARATOR, strlen($baseReal) + 1) !== 0) {
	img_err(404, 'Image not found');
}

$info = @getimagesize($srcPath);
if ($info === false) {
	img_err(415, 'Unsupported image type');
}
[$srcW, $srcH] = $info;
$srcType = $info[2];

$loaders = [
	IMAGETYPE_JPEG => 'imagecreatefromjpeg',
	IMAGETYPE_PNG  => 'imagecreatefrompng',
	IMAGETYPE_WEBP => 'imagecreatefromwebp',
];
if (!isset($loaders[$srcType])) {
	img_err(415, 'Source format not supported');
}
$src = @$loaders[$srcType]($srcPath);
if ($src === false) {
	img_err(500, 'Failed to decode source image');
}

// --- determine output format ----------------------------------------------

$defaultFmt = [
	IMAGETYPE_JPEG => 'jpg',
	IMAGETYPE_PNG  => 'png',
	IMAGETYPE_WEBP => 'webp',
][$srcType] ?? 'jpg';

$fmt = strtolower((string)($_GET['fmt'] ?? $defaultFmt));
if (!in_array($fmt, ['jpg', 'jpeg', 'png', 'webp'], true)) {
	img_err(415, 'Unsupported output format');
}
$fmt = ($fmt === 'jpeg') ? 'jpg' : $fmt;

// --- resolve aspect ratio (if any) ----------------------------------------

$ar = null;
if (isset($_GET['ar-base']) && $_GET['ar-base'] !== '') {
	$baseFile = (string)$_GET['ar-base'];
	if (!preg_match('/^[A-Za-z0-9._\-]+$/', $baseFile)) {
		img_err(400, 'Invalid "ar-base" filename');
	}
	$basePath = realpath($baseDir . DIRECTORY_SEPARATOR . $baseFile);
	if ($basePath === false || !is_file($basePath)
		|| strncmp($basePath, $baseReal . DIRECTORY_SEPARATOR, strlen($baseReal) + 1) !== 0) {
		img_err(404, 'ar-base image not found');
	}
	$binfo = @getimagesize($basePath);
	if ($binfo === false || $binfo[1] <= 0 || $binfo[0] <= 0) {
		img_err(415, 'Cannot read ar-base');
	}
	$ar = (float)$binfo[0] / (float)$binfo[1];
} elseif (isset($_GET['ar']) && $_GET['ar'] !== '') {
	$ar = img_parse_ratio((string)$_GET['ar']);
	if ($ar === null) {
		img_err(400, 'Invalid "ar" value');
	}
}

// --- resolve explicit crop edges ------------------------------------------

$mode = strtolower((string)($_GET['mode'] ?? 'px'));
if ($mode !== 'px' && $mode !== 'frac') {
	img_err(400, 'Invalid "mode" value (px|frac)');
}

$expX1 = (isset($_GET['x1']) && is_numeric($_GET['x1'])) ? (float)$_GET['x1'] : null;
$expX2 = (isset($_GET['x2']) && is_numeric($_GET['x2'])) ? (float)$_GET['x2'] : null;
$expY1 = (isset($_GET['y1']) && is_numeric($_GET['y1'])) ? (float)$_GET['y1'] : null;
$expY2 = (isset($_GET['y2']) && is_numeric($_GET['y2'])) ? (float)$_GET['y2'] : null;
$hasExplicitCrop = $expX1 !== null || $expX2 !== null || $expY1 !== null || $expY2 !== null;

$cx = (isset($_GET['cx']) && is_numeric($_GET['cx'])) ? img_clamp01((float)$_GET['cx']) : 0.5;
$cy = (isset($_GET['cy']) && is_numeric($_GET['cy'])) ? img_clamp01((float)$_GET['cy']) : 0.5;

// --- compute the final crop rectangle -------------------------------------

$cropX = 0;
$cropY = 0;
$cropW = $srcW;
$cropH = $srcH;

if ($ar !== null && !$hasExplicitCrop) {
	// Largest box with the requested ratio that fits inside the source,
	// centred on (cx, cy).
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

// --- optional resize -------------------------------------------------------

$outW = $cropW;
if (isset($_GET['w']) && is_numeric($_GET['w']) && (int)$_GET['w'] > 0) {
	$outW = (int)$_GET['w'];
}
if ($outW < 1) $outW = 1;
$outH = (int)max(1, round($outW * $cropH / $cropW));

// --- copy / resample into the destination ---------------------------------

$dst = imagecreatetruecolor($outW, $outH);
if ($dst === false) {
	imagedestroy($src);
	img_err(500, 'Failed to create destination image');
}

if ($fmt === 'png' || $fmt === 'webp') {
	imagealphablending($dst, false);
	imagesavealpha($dst, true);
	$transparent = imagecolorallocatealpha($dst, 0, 0, 0, 127);
	imagefilledrectangle($dst, 0, 0, $outW, $outH, $transparent);
}

if (!imagecopyresampled($dst, $src, 0, 0, $cropX, $cropY, $outW, $outH, $cropW, $cropH)) {
	imagedestroy($src);
	imagedestroy($dst);
	img_err(500, 'Failed to crop image');
}

// --- caching & output -----------------------------------------------------

$stat = @stat($srcPath);
$mtime = $stat ? $stat['mtime'] : time();
$cacheKey = $file . '|' . $fmt . '|' . $outW . '|' . $cropX . ',' . $cropY . ',' . $cropW . ',' . $cropH . '|' . ($ar ?? '') . '|' . $cx . ',' . $cy;
$etag = '"img-' . $mtime . '-' . md5($cacheKey) . '"';

header('ETag: ' . $etag);
header('Cache-Control: public, max-age=86400');
header('X-Content-Type-Options: nosniff');

if (isset($_SERVER['HTTP_IF_NONE_MATCH']) && trim($_SERVER['HTTP_IF_NONE_MATCH']) === $etag) {
	imagedestroy($src);
	imagedestroy($dst);
	http_response_code(304);
	exit;
}

$mimeMap = ['jpg' => 'image/jpeg', 'png' => 'image/png', 'webp' => 'image/webp'];
header('Content-Type: ' . $mimeMap[$fmt]);

$quality = isset($_GET['q']) && is_numeric($_GET['q'])
	? max(1, min(100, (int)$_GET['q']))
	: 85;

$ok = false;
switch ($fmt) {
	case 'jpg':
		$ok = imagejpeg($dst, null, $quality);
		break;
	case 'png':
		$ok = imagepng($dst, null, (int)round((100 - $quality) / 11));
		break;
	case 'webp':
		$ok = imagewebp($dst, null, $quality);
		break;
}

imagedestroy($src);
imagedestroy($dst);

if (!$ok) {
	img_err(500, 'Failed to encode image');
}
