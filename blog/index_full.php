<?php include_once("functions.php"); ?>
<?php $themeClass = get_theme_class(); ?>
<!DOCTYPE html>
<html lang="en" class="<?php echo $themeClass; ?>">
<head>
	<meta charset="UTF-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<meta name="theme-color" content="<?php echo $themeClass === 'dark' ? '#0f172a' : '#ffffff'; ?>">
	<title>From Big Bang to ChatGPT</title>
	<script>
	function toggleTheme() {
		var html = document.documentElement;
		var isDark = !html.classList.contains('dark');
		if (isDark) { html.classList.add('dark'); } else { html.classList.remove('dark'); }
		var btn = document.getElementById('theme-toggle');
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
	<?php include_once("mobile-loader.php"); ?>
</head>
<body>
<button id="drawer-toggle" aria-label="Menu" title="Course modules">&#9776;</button>
<button id="search-trigger" class="search-trigger" aria-label="Search" title="Search (Ctrl+K or /)"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.35-4.35"/></svg></button>
<?php render_theme_toggle(); ?>
<?php render_drawer(); ?>
<div id="loader" role="status" aria-live="polite" aria-label="Loading course content">
	<div class="spinner" aria-hidden="true"></div>
	<p id="loader-status">Initializing AI Course...</p>
	<div id="loader-checklist" aria-hidden="true"></div>
</div>

<!--
	TODO: Mathe I, II, III, Statistics I, II, depending on where you are, to lower the amount of it at once
-->

<div id="contents" style="display: none">
<?php
	incl("From Big Bang to ChatGPT: Beyond the Black Box", "intro");
	incl("An Intuition of how Large Language Models (LLMs) work", "intuition");
	incl("Brief History of AI", "history");
	incl("Basic Math Concepts I — The Numerical Foundations", "math_i");
	incl("Basic Math Concepts II — Linear Algebra for AI", "math_ii");
	incl("Basic Math Concepts III — Approximation & The Geometry of High Dimensions", "math_iii");
	incl("The History of Language: From Sanskrit to LLMs", "language");
	incl("Statistics I — Distributions and Inference", "statistics_i");
	incl("Statistics II — Inference and Information", "statistics_ii");
	incl("Loss: Teaching through Failure", "losslab");
	incl('Derivatives: How AI "Learns" to get better', "derivativelab");
	incl('Differentiation: The Mathematics of Change', "differentiation");
	incl('Automatic Differentiation: How Machines Learn', "autodiff");
	incl("Backpropagation: How a Neural Network Learns From Its Mistakes", "backproplab");
	incl("The Optimizer: Navigating the Loss Landscape", "optimizerlab");
	incl("Smallest possible neural network", "minimalneuron");
	incl("Activation Functions: The Neural Decision Makers", "activationlab");
	incl("Live Training of a Neural Network", "traininglab");
	incl("Convolutions: How a Computer Learns to See", "visionlab");
	incl("Deep Learning", "deeplearninglab");
	incl("Over- and underfitting", "overandunderfittinglab");
	incl("Deep Learning Mechanics: ResNets & Vanishing Gradients", "resnetlab");
	incl("Understanding Layer Normalization", "normalizationlab");
	incl("Reinforcement Learning", "reinforcement_learning");
	incl("Tokenization: How Words become Numbers", "tokenizerlab");
	incl("Embeddings: The Geometry of Meaning", "embeddinglab");
	incl("The Semantic Tug-of-War: How Transformers 'Think'", "attentionlab");
	incl("Positional Embeddings", "positionalembeddingslab");
	incl("Temperature & Sampling", "samplinglab");
	incl("The Architecture of Meaning: A Deep Dive into Transformers", "transformer");
	incl("Mechanistic Interpretability", "mechanistic_interpretability");
	incl("How Transformers Execute Algorithms", "algorithms");
	incl("Multimodal & Vision-Language Models", "multimodal");
	incl("Diffusion Models", "diffusion");
	incl("Speech & Audio Models", "speech_audio");
	incl("Beyond Transformers (Mamba, RWKV, RetNet)", "alternative_architectures");
	#incl("Topology and the Geometry of Thought", "topology");
	incl("Fine-Tuning & Post-Training", "finetuninglab");
	incl("Hallucinations and Dangers of AI and How to use AI Safely", "hallucinations");
	incl("Retrieval-Augmented Generation: Giving LLMs a Search Engine", "rag");
	incl("How LLMs Search the Web", "websearch");
	incl("AI Agents: Autonomous Reasoning and Tool Use", "agents");
	incl("Semantic Search & Vector Databases: Finding Needles in Haystacks", "vectorsearch");
	incl("Context Windows & Memory: What LLMs Can Hold in Mind", "contextwindows");
	incl("Security & Adversarial Attacks", "security_inference");
	incl("Inference Optimization", "inference_optimization");
	incl("Running Models Locally", "running_locally");
	incl("Symbolic AI, Knowledge Graphs & Neuro-Symbolic AI", "symbolic_ai");
	incl("Training Data Curation", "training_data");
	incl("Training Infrastructure", "training_infrastructure");
	incl("Production Serving & Inference", "production_serving");
	incl("Reasoning & Test-Time Compute", "reasoning");
	incl("Evaluation & Benchmarks", "evaluation");
	incl("Prompt Engineering: How to talk to LLMs", "promptengineering");
	incl("The Global AI Ecosystem", "global_ai_ecosystem");
	incl("The Untold History of AI", "untold_history");
	incl("Frontier Topics", "frontier");
	incl("AI Law & Regulation", "law_regulation");
	incl("Philosophical and societal implications, ethical usage of AI", "philosophy");
	incl("Appendix", "appendix");
?>
</div>
</body>
</html>
