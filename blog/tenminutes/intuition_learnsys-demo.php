<?php
$scenes = [];
foreach (glob(__DIR__.'/demos/*.js') as $file) {
	$name = basename($file, '.js');
	if ($name[0] === '_') continue;
	$scenes[] = $name;
}
sort($scenes, SORT_NATURAL | SORT_FLAG_CASE);
$scene = isset($_GET['scene']) ? (string) $_GET['scene'] : 'embedding';
if (!in_array($scene, $scenes, true)) $scene = 'embedding';
$lang = (isset($_GET['lang']) && $_GET['lang'] === 'de') ? 'de' : 'en';
$deps = [
	'media' => ['phone', 'code'],
];
$load = array_values(array_unique(array_merge([$scene], $deps[$scene] ?? [])));
$labels = [
	'embedding' => 'Embedding', 'phone' => 'Telefon', 'code' => 'Code', 'media' => 'Medien',
	'loop' => 'Schleife',
	'tokenize' => 'Tokenize', 'position' => 'Position', 'attention' => 'Attention',
	'codesemantic' => 'Code + Semantik',
	'ffn' => 'FFN', 'residual' => 'Residual', 'meadow' => 'Wiese',
	'manifold' => 'Manifold', 'gauss' => 'Gauss', 'unembed' => 'Unembedding',
	'model' => 'Modell', 'blocks' => 'Bausteine', 'highdim' => 'Hochdimensional', 'mlp' => 'MLP',
	'activation' => 'Aktivierung', 'langdata' => 'Sprachdaten', 'agents' => 'Agent',
	'gradient' => 'Gradient', 'riskmap' => 'AI and society',
	'history' => 'Geschichte', 'chineseroom' => 'Chinese Room',
	'consciousness' => 'Bewusstsein',
	'hallucinationtypes' => 'Halluzinationsarten', 'hallucinationguard' => 'Halluzinationsschutz', 'takeaway' => 'Takeaway', 'inductionmatrix' => 'Induktions-Tabelle', 'weekday' => 'Wochentage', 'mindintro' => 'Bewusstseinsfrage', 'roadmap' => 'Roadmap', 'spacetime' => 'Raum und Zeit', 'worldmodel' => 'Weltmodell',
];
function h($s) { return htmlspecialchars((string) $s, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8'); }
?>
<!DOCTYPE html>
<html lang="<?php echo $lang; ?>" data-theme="light">
<head>
	<meta charset="UTF-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
	<meta name="theme-color" content="#ffffff">
	<title><?php echo h(($labels[$scene] ?? $scene).' · LearnSys demo'); ?></title>
	<link rel="stylesheet" href="assets/site.css?v=<?php echo filemtime(__DIR__.'/assets/site.css'); ?>">
	<link rel="stylesheet" href="learnsys.css?v=<?php echo filemtime(__DIR__.'/learnsys.css'); ?>">
	<link rel="stylesheet" href="../Temml-Local.min.css">
	<style>
		#tm-lang-switch { display: none !important; }
		.ls-preview-bar { display: flex; flex-wrap: wrap; align-items: center; gap: 10px; padding: 10px 16px; border-bottom: 1px solid var(--tm-line, #d7e0dd); background: #fff; position: relative; z-index: 20; }
		.ls-preview-bar label { display: inline-flex; align-items: center; gap: 6px; font: 600 13px/1.2 "Open Sans", sans-serif; color: var(--tm-petrol, #004b6f); }
		.ls-preview-bar select { max-width: 240px; padding: 5px 8px; border: 1px solid var(--tm-line, #d7e0dd); background: #fff; color: var(--tm-ink, #000); font: 13px/1.2 "Open Sans", sans-serif; }
		.ls-preview-bar a { font: 600 12px/1.2 "Open Sans", sans-serif; color: var(--tm-petrol, #004b6f); text-decoration: none; }
		.ls-preview-bar a:hover { text-decoration: underline; }
		.ls-preview-bar .spacer { flex: 1; }
	</style>
</head>
<body data-page="lesson" data-lesson="intuition" data-no-full-article data-tm-reload-lang="1">
	<div class="ls-preview-bar">
		<label><?php echo $lang === 'de' ? 'Demo' : 'Demo'; ?>
			<select onchange="location.href='intuition_learnsys-demo.php?scene='+encodeURIComponent(this.value)+'&amp;lang=<?php echo $lang; ?>'">
				<?php foreach ($scenes as $item): ?>
				<option value="<?php echo h($item); ?>"<?php echo $item === $scene ? ' selected' : ''; ?>><?php echo h($labels[$item] ?? $item); ?></option>
				<?php endforeach; ?>
			</select>
		</label>
		<span class="spacer"></span>
		<a href="?scene=<?php echo h($scene); ?>&amp;lang=<?php echo $lang === 'de' ? 'en' : 'de'; ?>"><?php echo $lang === 'de' ? 'EN' : 'DE'; ?></a>
		<a href="intuition_learnsys___DONT_USE_ANYMORE"><?php echo $lang === 'de' ? 'Ganze Lektion' : 'Full lesson'; ?></a>
	</div>
	<div id="learnsys" data-no-i18n></div>
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
	<?php foreach ($load as $item): ?>
	<script src="demos/<?php echo h($item); ?>.js?v=<?php echo filemtime(__DIR__.'/demos/'.$item.'.js'); ?>"></script>
	<?php endforeach; ?>
	<script>window.LS_PREVIEW_SCENE = <?php echo json_encode($scene, JSON_UNESCAPED_SLASHES); ?>; window.LS_PREVIEW_LANG = <?php echo json_encode($lang); ?>;</script>
	<script src="demos/_preview.js?v=<?php echo filemtime(__DIR__.'/demos/_preview.js'); ?>"></script>
</body>
</html>
