<?php include_once("functions.php"); ?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>From 1 + 1 = 2 to ChatGPT</title>
    <?php load_base_js(); ?>
</head>

<div id="loading-overlay">
	<div class="spinner"></div>
	<p>Initializing AI Course...</p>
</div>

<!--
	TODO: Mathe I, II, III, Statistics I, II, depending on where you are, to lower the amount of it at once
-->

<div id="contents" style="display: none">
<?php
	incl("From $ 1 + 1 = 2 $ to ChatGPT: Beyond the Black Box", "intro");
	incl("An Intuition of how Large Language Models (LLMs) work", "intuition");
	incl("Brief History of AI", "history");
	incl("Basic math concepts", "math");
	incl("Statistical Foundations: The Language of AI", "statistics");
	incl("Loss: Teaching through Failure", "losslab");
	/*
	incl('Derivatives: How AI "Learns" to get better', "derivativelab");
	 */
	incl('Differentiation', "differentiation");
	incl('Automatic Differentiation: How Machines Learn', "autodiff");
	incl("Backpropagation: How a Neural Network Learns From Its Mistakes", "backproplab");
	incl("Optimizer", "optimizerlab");
	incl("Smallest possible neural network", "minimalneuron");
	incl("Activation Functions: The Neural Decision Makers", "activationlab");
	incl("Live Training of a Neural Network", "traininglab");
	incl("Computer Vision", "visionlab");
	incl("Deep Learning", "deeplearninglab");
	incl("Over- and underfitting", "overandunderfittinglab");
	incl("Deep Learning Mechanics: ResNets & Vanishing Gradients", "resnetlab");
	incl("Understanding Layer Normalization", "normalizationlab");
	incl("Tokenization: How Words become Numbers", "tokenizerlab");
	incl("Embeddings: The Geometry of Meaning", "embeddinglab");
	incl("The Semantic Tug-of-War: How Transformers 'Think'", "attentionlab");
	incl("Positional Embeddings", "positionalembeddingslab");
	incl("Top-\$k\$-Sampling: Temperature & Top-\$k\$ Explorer", "samplinglab");
	incl("The Architecture of Meaning: A Deep Dive into Transformers", "transformerlab");
	incl("Fine-Tuning: From Internet Scrape to Human Alignment", "finetuninglab");
	incl("Hallucinations and Dangers of AI and How to use AI Safely", "hallucinations");
	incl("Prompt Engineering: How to talk to LLMs", "promptengineering");
	incl("Philosophical and societal implications, ethical usage of AI", "philosophy");
	incl("Appendix", "appendix");
?>
</div>

<script>
	window.addEventListener('load', async () => {
		try {
			// 1. Start sequence
			//updateLoadingStatus("Rendering Glossary...");
			//await renderGlossary();

			updateLoadingStatus("Processing Citations...");
			await bibtexify();

			updateLoadingStatus("Parsing Categories...");
			await parseCategories();

			updateLoadingStatus("Initializing Attention Labs...");
			// Call the functions from your other files here
			if (typeof SelfAttentionLab !== 'undefined') {
				SelfAttentionLab.init();
				initShiftExamples();
				runAttention();
				runUniverse();
			}

			updateLoadingStatus("Building Table of Contents...");
			await toc();

			// 2. Finalize
			$("#contents").show();

			// 3. Hide Overlay
			const overlay = document.getElementById('loading-overlay');
			if (overlay) {
				overlay.style.opacity = '0';
				setTimeout(() => {
				overlay.style.display = 'none';
				}, 1000);
			}

			sendHeight();

			smartquote();
			initOptionalBlocks();

			addCopyButtons();
		} catch (error) {
			console.error("Initialization failed:", error);
			updateLoadingStatus(`Error loading course. Please refresh. ${error}`);
		}
	});

	(function() {
		// 1. Sofort beim Laden
		window.addEventListener('load', sendHeight);

		// 2. Bei Fensteränderung
		window.addEventListener('resize', sendHeight);

		// 3. Dynamische Überwachung (wichtig für WordPress-Inhalte)
		if (window.ResizeObserver) {
			var ro = new ResizeObserver(function() {
				sendHeight();
			});
			ro.observe(document.body);
		} else {
			// Fallback für alte Browser
			setInterval(sendHeight, 1000);
		}

		addReadingProgress();
	})();
	</script>
</body>
</html>
