<?php include_once("functions.php"); ?>
<?php $themeClass = get_theme_class(); ?>
<!DOCTYPE html>
<html lang="en" class="<?php echo $themeClass; ?>">
<head>
	<meta charset="UTF-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
	<meta name="theme-color" content="<?php echo $themeClass === 'dark' ? '#0f172a' : '#ffffff'; ?>">
	<title>From Stone Age Tools to ChatGPT</title>
	<script>
	function toggleTheme() {
		var html = document.documentElement;
		var isDark = !html.classList.contains('dark');
		if (isDark) { html.classList.add('dark'); } else { html.classList.remove('dark'); }
		var btn = document.getElementById('theme-toggle');
		if (btn) btn.innerHTML = isDark ? '&#9788;' : '&#9790;';
		var meta = document.querySelector('meta[name="theme-color"]');
		if (meta) meta.content = isDark ? '#0f172a' : '#ffffff';
		document.cookie = 'theme=' + (isDark ? 'dark' : 'light') + '; path=/; max-age=' + 60*60*24*365;
	}
	(function() {
		if (document.cookie.indexOf('theme=') === -1) {
			if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) toggleTheme();
		}
	})();
	</script>
	<?php load_base_js(); ?>
	<?php js("search"); ?>
</head>
<body>
<a class="cl-skip" href="#contents">Skip to content</a>
<button id="drawer-toggle" aria-label="Menu" title="Course modules">&#9776;</button>
<button id="search-trigger" class="search-trigger" aria-label="Search" title="Search (Ctrl+K or /)">&#128269;</button>
<?php render_theme_toggle(); ?>
<?php render_drawer(); ?>
<div id="loader" role="status" aria-live="polite" aria-label="Loading course content">
	<div class="spinner" aria-hidden="true"></div>
	<p id="loader-status">Initializing AI Course...</p>
	<div id="loader-checklist" aria-hidden="true"></div>
</div>

<div id="contents" style="display: none">

<div class="course-hero">
	<h1>From Stone Age Tools to ChatGPT</h1>
</div>

<?php incl("From Stone Age Tools to ChatGPT: Beyond the Black Box", "intro"); ?>

<div class="course-overview">

<?php
$partTitles = [
	1 => ['title' => 'Foundations', 'desc' => 'Where we came from, what language is, and the mathematical bedrock beneath AI.'],
	2 => ['title' => 'How Neural Networks Learn', 'desc' => 'The learning algorithm step by step, from loss functions to live training.'],
	3 => ['title' => 'Deep Learning & Vision', 'desc' => 'Stacking layers, seeing images, and the engineering that makes depth possible.'],
	4 => ['title' => 'The Transformer Revolution', 'desc' => 'The architecture that changed everything — attention, embeddings, multimodal, diffusion, and the post-transformer alternatives.'],
	5 => ['title' => 'Making AI Useful', 'desc' => 'Fine-tuning, retrieval, search, safety, and the practical craft of working with LLMs.'],
		6 => ['title' => 'Bigger Questions', 'desc' => 'The global AI ecosystem, the displaced prerequisites, and the open problems at the frontier of AI.'],
];

$parts = parse_course_metadata();

foreach ($parts as $partNum => $modules):
?>
<div class="course-part">
	<div class="course-part-header" style="--part-color: var(--mn-<?php echo htmlspecialchars($modules[0]['color']); ?>)">
		<h2><?php echo htmlspecialchars($partTitles[$partNum]['title']); ?></h2>
		<p><?php echo $partTitles[$partNum]['desc']; ?></p>
	</div>
	<div class="course-tiles">
		<?php foreach ($modules as $m) render_course_tile($m); ?>
	</div>
</div>
<?php endforeach; ?>

</div>

</div>
</body>
</html>
