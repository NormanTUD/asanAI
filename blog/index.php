<?php include_once("functions.php"); ?>
<!DOCTYPE html>
<html lang="en">
<head>
	<meta charset="UTF-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<title>From Stone Age Tools to ChatGPT</title>
	<?php load_base_js(); ?>
</head>
<body>
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
	4 => ['title' => 'The Transformer Revolution', 'desc' => 'The architecture that changed everything, attention, embeddings, and the circuits inside.'],
	5 => ['title' => 'Making AI Useful', 'desc' => 'Fine-tuning, retrieval, search, safety, and the practical craft of working with LLMs.'],
	6 => ['title' => 'Bigger Questions', 'desc' => 'Philosophy, ethics, and the open problems at the frontier of AI.'],
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
