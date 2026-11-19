<?php
if (!headers_sent()) {
	header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
	header('Pragma: no-cache');
	header('Expires: 0');
	header('Surrogate-Control: no-store');
	header('CDN-Cache-Control: no-store');
}
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
	<meta http-equiv="Cache-Control" content="no-cache, no-store, must-revalidate">
	<meta http-equiv="Pragma" content="no-cache">
	<meta http-equiv="Expires" content="0">
	<title><?php echo htmlspecialchars($pageTitle, ENT_QUOTES, 'UTF-8'); ?></title>
	<script>
		window.TM_LOCAL_EDITOR = <?php echo $localEditor ? 'true' : 'false'; ?>;
		window.TM_HIDE_EXPAND_ALL = <?php echo $hideExpandAll ? 'true' : 'false'; ?>;
		<?php if ($eoyDay !== null): ?>window.EOY_DAY = <?php echo $eoyDay; ?>;<?php endif; ?>
		(function () {
			if (typeof window.EOY_DAY === "number") return;
			var m = (location.pathname + location.search + location.hash).match(/eoy(?:%2F|\/)(\d+)/i);
			if (m) window.EOY_DAY = parseInt(m[1], 10);
		})();
	</script>
	<link rel="stylesheet" href="assets/site.css?v=<?php echo filemtime(__DIR__.'/assets/site.css'); ?>">
	<link rel="stylesheet" href="learnsys.css?v=<?php echo filemtime(__DIR__.'/learnsys.css'); ?>">
	<link rel="stylesheet" href="eoy-nav.css?v=<?php echo filemtime(__DIR__.'/eoy-nav.css'); ?>">
	<link rel="stylesheet" href="nav-fix.css?v=<?php echo filemtime(__DIR__.'/nav-fix.css'); ?>">
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
			grid-template-rows: minmax(0, 1fr);
		}
		body[data-page="lesson"] .ls-main { grid-row: 1; }
		body[data-page="lesson"] .ls-top,
		body[data-page="lesson"] .ls-navbar { display: none !important; }
		body[data-page="lesson"] .ls-title { max-width: 36ch; }
		@media (max-width: 980px) {
			body[data-page="lesson"] .ls-main { grid-template-rows: auto minmax(0, 1fr); }
		}
		<?php endif; ?>
		#eoy-embed-nav { position: fixed; left: 0; right: 0; bottom: 0; z-index: 2147483000; pointer-events: none; }
		#eoy-embed-nav button {
			position: fixed; bottom: 14px; display: inline-flex; align-items: center; justify-content: center;
			min-width: 120px; min-height: 44px; padding: 0 16px; pointer-events: auto;
			border: 1px solid #4f8b3c; background: #63a44b; color: #fff;
			font: 600 15px/1 "Open Sans", system-ui, sans-serif; cursor: pointer;
			box-shadow: 0 3px 14px rgba(0,20,30,.18);
		}
		#eoy-embed-nav button:hover { background: #558c3f; }
		#eoy-embed-nav button[hidden] { display: none !important; }
		#eoy-embed-nav [data-eoy-prev] { left: 14px; }
		#eoy-embed-nav [data-eoy-next] { right: 14px; }
		body[data-page="lesson"] .ls-bottom-nav { display: none !important; }
		body[data-page="lesson"] .ls-main { padding-bottom: 72px; }
	</style>
</head>
<body data-page="lesson" data-lesson="intuition" data-eoy-day="<?php echo $eoyDay !== null ? $eoyDay : ''; ?>" data-eoy-resolved="<?php echo $eoyDay !== null ? $eoyDay : 0; ?>" data-no-full-article data-tm-reload-lang="1">
	<div id="ls-page-loader" role="status" aria-live="polite" aria-label="Lädt …"
		style="position:fixed;inset:0;z-index:2147483646;display:flex;align-items:center;justify-content:center;background:#fff">
		<div class="ls-page-loader-spinner" aria-hidden="true"
			style="width:38px;height:38px;border:3px solid #dbe3e0;border-top-color:#63a44b;border-radius:50%;animation:ls-page-spin .8s linear infinite"></div>
	</div>
	<script>
		/* Inline bootstrap: runs before the lesson scripts and cannot be cached
		   away. Creates/styles the loader and hides every nav until loaded. */
		(function(){
			var NAV="#ls-quick-prev,#ls-quick-next,#navfix-prev,#navfix-next,#eoy-embed-nav,.eoy-nav,.ls-bottom-nav";
			function css(){
				if(document.getElementById("ls-boot-style"))return;
				var st=document.createElement("style");st.id="ls-boot-style";
				st.textContent="#ls-page-loader{position:fixed!important;inset:0!important;width:100vw!important;height:100vh!important;z-index:2147483647!important;background:#fff!important;display:flex!important;align-items:center!important;justify-content:center!important}"+
					"#ls-page-loader .ls-page-loader-spinner{width:40px!important;height:40px!important;border:3px solid #dbe3e0!important;border-top-color:#63a44b!important;border-radius:50%!important;animation:lsBootSpin .8s linear infinite!important}"+
					"body:not(.ls-loaded) "+NAV.split(",").join(",body:not(.ls-loaded) ")+"{display:none!important}"+
					"@keyframes lsBootSpin{to{transform:rotate(360deg)}}";
				(document.head||document.documentElement).appendChild(st);
			}
			function ensure(){
				var l=document.getElementById("ls-page-loader");
				if(!l){l=document.createElement("div");l.id="ls-page-loader";var sp=document.createElement("div");sp.className="ls-page-loader-spinner";l.appendChild(sp);document.body.insertBefore(l,document.body.firstChild);}
				if(!l.querySelector(".ls-page-loader-spinner")){var sp2=document.createElement("div");sp2.className="ls-page-loader-spinner";l.appendChild(sp2);}
			}
			function hideNavs(){
				var els=document.querySelectorAll(NAV);
				for(var i=0;i<els.length;i++)els[i].style.setProperty("display","none","important");
			}
			function showNavs(){
				var els=document.querySelectorAll(NAV);
				for(var i=0;i<els.length;i++)els[i].style.removeProperty("display");
			}
			function reveal(){
				window.__lsPageReady=true;
				if(document.body)document.body.classList.add("ls-loaded");
				var l=document.getElementById("ls-page-loader");
				if(l&&l.parentNode)l.parentNode.removeChild(l);
				showNavs();
			}
			css();ensure();hideNavs();
			var timer=setInterval(hideNavs,60);
			window.addEventListener("load",function(){setTimeout(function(){clearInterval(timer);reveal();},120);});
			window.addEventListener("pageshow",function(e){if(e.persisted)reveal();});
			setTimeout(function(){clearInterval(timer);reveal();},12000);
		})();
	</script>
	<div id="learnsys" data-no-i18n></div>
	<div id="eoy-embed-nav" style="position:fixed;left:0;right:0;bottom:0;z-index:2147483000;pointer-events:none">
		<button type="button" class="eoy-prev" data-eoy-prev style="position:fixed;left:14px;bottom:14px;z-index:2147483000;display:inline-flex;align-items:center;justify-content:center;min-width:120px;min-height:44px;padding:0 16px;border:1px solid #4f8b3c;background:#63a44b;color:#fff;font:600 15px/1 &quot;Open Sans&quot;,system-ui,sans-serif;cursor:pointer;box-shadow:0 3px 14px rgba(0,20,30,.18);pointer-events:auto">← Zurück</button>
		<button type="button" class="eoy-next" data-eoy-next style="position:fixed;right:14px;bottom:14px;z-index:2147483000;display:inline-flex;align-items:center;justify-content:center;min-width:120px;min-height:44px;padding:0 16px;border:1px solid #4f8b3c;background:#63a44b;color:#fff;font:600 15px/1 &quot;Open Sans&quot;,system-ui,sans-serif;cursor:pointer;box-shadow:0 3px 14px rgba(0,20,30,.18);pointer-events:auto">Weiter →</button>
	</div>
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
	<script src="eoy-embed-nav.js?v=<?php echo filemtime(__DIR__.'/eoy-embed-nav.js'); ?>"></script>
	<script src="nav-fix.js?v=<?php echo filemtime(__DIR__.'/nav-fix.js'); ?>"></script>
	<script src="frame-height.js?v=<?php echo filemtime(__DIR__.'/frame-height.js'); ?>"></script>
	<?php if ($showSeasonal): ?><script src="assets/seasonal.js?v=<?php echo filemtime(__DIR__.'/assets/seasonal.js'); ?>"></script><?php endif; ?>
</body>
</html>
