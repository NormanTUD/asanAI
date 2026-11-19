<?php
if (!array_key_exists('eoyDay', get_defined_vars())) {
	http_response_code(404);
	exit;
}
$eoyDay = is_int($eoyDay) && $eoyDay >= 1 && $eoyDay <= 31 ? $eoyDay : null;

$simRaw = $_GET['date'] ?? $_GET['datum'] ?? null;
$today = new DateTimeImmutable('today');
if (is_string($simRaw) && trim($simRaw) !== '') {
	foreach (['!j.n.Y', '!j.n.y', '!Y-m-d', '!d.m.Y', '!d/m/Y', '!Y/m/d'] as $format) {
		$date = DateTimeImmutable::createFromFormat($format, trim($simRaw));
		if ($date instanceof DateTimeImmutable) {
			$errors = DateTimeImmutable::getLastErrors();
			if ($errors === false || ($errors['warning_count'] === 0 && $errors['error_count'] === 0)) {
				$today = $date;
				break;
			}
		}
	}
}
$monthDay = $today->format('m-d');
$showSnow = $monthDay === '12-24';
$showFireworks = in_array($monthDay, ['12-31', '01-01'], true);
$showSeasonal = $showSnow || $showFireworks;
$localEditor = is_file(__DIR__ . '/.local-editor');
$hideExpandAll = is_file(__DIR__ . '/.hide-expand-all');
$pageTitle = $eoyDay === null ? 'One Word at a Time | Ten Minutes' : 'One Word at a Time · Day ' . $eoyDay . ' | Ten Minutes';

$embedHeight = 0;
if (isset($_GET['height']) && is_numeric($_GET['height'])) {
	$embedHeight = (int) round((float) $_GET['height']);
	$embedHeight = max(0, min(50000, $embedHeight));
}
?>
<!DOCTYPE html>
<html lang="en" data-theme="light">
<head>
	<meta charset="UTF-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
	<meta name="description" content="A 31-day interactive introduction to how large language models work: data, tokens, embeddings, attention, training, agents, society, and consciousness.">
	<meta name="theme-color" content="#ffffff">
	<title><?php echo htmlspecialchars($pageTitle, ENT_QUOTES, 'UTF-8'); ?></title>
	<script>
		window.TM_LOCAL_EDITOR = <?php echo $localEditor ? 'true' : 'false'; ?>;
		window.TM_HIDE_EXPAND_ALL = <?php echo $hideExpandAll ? 'true' : 'false'; ?>;
		<?php if ($eoyDay !== null): ?>window.EOY_DAY = <?php echo $eoyDay; ?>;<?php endif; ?>
	</script>
	<link rel="stylesheet" href="assets/site.css?v=<?php echo filemtime(__DIR__.'/assets/site.css'); ?>">
	<link rel="stylesheet" href="learnsys.css?v=<?php echo filemtime(__DIR__.'/learnsys.css'); ?>">
	<link rel="stylesheet" href="../Temml-Local.min.css">
	<style>
		#tm-lang-switch { display: none !important; }
		.ls-lang-btn { min-width: 34px; font-weight: 600; letter-spacing: .04em; }
		<?php if ($eoyDay !== null): ?>
		.ls-top, .ls-navbar { display: none !important; }
		body[data-page="lesson"] .ls-app { grid-template-rows: minmax(0, 1fr); }
		body[data-page="lesson"] .ls-main { grid-row: 1; }
		<?php endif; ?>
		<?php if ($embedHeight > 0): ?>
		html, body { height: auto; min-height: <?php echo $embedHeight; ?>px; overflow: auto; }
		body[data-page="lesson"] .ls-app {
			position: relative;
			inset: auto;
			height: <?php echo $embedHeight; ?>px;
			min-height: <?php echo $embedHeight; ?>px;
		}
		<?php endif; ?>
	</style>
</head>
<body data-page="lesson" data-lesson="intuition" data-no-full-article data-tm-reload-lang="1">
	<div id="learnsys" data-no-i18n></div>
	<?php if ($showSnow): ?><canvas class="season-layer" id="season-snow" aria-hidden="true"></canvas><?php endif; ?>
	<?php if ($showFireworks): ?><canvas class="season-layer" id="season-fireworks" aria-hidden="true"></canvas><?php endif; ?>
	<script src="../temml.min.js"></script>
	<script src="assets/site.js?v=<?php echo filemtime(__DIR__.'/assets/site.js'); ?>"></script>
	<script src="assets/learnsys-visuals.js?v=<?php echo filemtime(__DIR__.'/assets/learnsys-visuals.js'); ?>"></script>
	<script src="assets/learnsys-scene-kit.js?v=<?php echo filemtime(__DIR__.'/assets/learnsys-scene-kit.js'); ?>"></script>
	<script src="learnsys.js?v=<?php echo filemtime(__DIR__.'/learnsys.js'); ?>"></script>
	<script src="../manifold_scenes.js?v=<?php echo filemtime(__DIR__.'/../manifold_scenes.js'); ?>"></script>
	<script src="assets/space-morph.js?v=<?php echo filemtime(__DIR__.'/assets/space-morph.js'); ?>"></script>
	<script src="intuition_gpt2_data.js?v=<?php echo filemtime(__DIR__.'/intuition_gpt2_data.js'); ?>"></script>
	<script src="assets/sinus-data.js?v=<?php echo filemtime(__DIR__.'/assets/sinus-data.js'); ?>"></script>
	<script src="assets/loss-landscape-scene.js?v=<?php echo filemtime(__DIR__.'/assets/loss-landscape-scene.js'); ?>"></script>
	<script src="assets/tf.min.js"></script>
	<script src="assets/tf-sinus-scene.js?v=<?php echo filemtime(__DIR__.'/assets/tf-sinus-scene.js'); ?>"></script>
	<script src="assets/learnsys-unembed-scene.js?v=<?php echo filemtime(__DIR__.'/assets/learnsys-unembed-scene.js'); ?>"></script>
	<script src="assets/learnsys-gauss-scene.js?v=<?php echo filemtime(__DIR__.'/assets/learnsys-gauss-scene.js'); ?>"></script>
	<script src="demos/_core.js?v=<?php echo filemtime(__DIR__.'/demos/_core.js'); ?>"></script>
	<?php foreach (glob(__DIR__.'/demos/*.js') as $demoFile): $demoName = basename($demoFile); if ($demoName[0] === '_') continue; ?>
	<script src="demos/<?php echo $demoName; ?>?v=<?php echo filemtime($demoFile); ?>"></script>
	<?php endforeach; ?>
	<script src="intuition_learnsys-demos.js?v=<?php echo filemtime(__DIR__.'/intuition_learnsys-demos.js'); ?>"></script>
	<script src="data.js?v=<?php echo filemtime(__DIR__.'/data.js'); ?>"></script>
	<script src="frame-height.js?v=<?php echo filemtime(__DIR__.'/frame-height.js'); ?>"></script>
	<?php if ($showSeasonal): ?><script src="assets/seasonal.js?v=<?php echo filemtime(__DIR__.'/assets/seasonal.js'); ?>"></script><?php endif; ?>
</body>
</html>
