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


<div id="contents" style="display: none">
<?php
	incl("From $ 1 + 1 = 2 $ to ChatGPT: Beyond the Black Box", "intro");
	incl("Brief History of AI", "history");
	incl("Basic math concepts", "math");
	incl("Statistical Foundations: The Language of AI", "statistics");
	incl("Loss: Teaching through Failure", "losslab");
	incl('Derivatives: How AI "Learns" to get better', "derivativelab");
	incl("Optimizer", "optimizerlab");
	incl("Smallest possible neural network", "minimalneuron");
	incl("Activation Functions: The Neural Decision Makers", "activationlab");
	incl("See the training of a Neural Network in action", "traininglab");
	incl("Computer Vision", "visionlab");
	incl("Over- and underfitting", "overandunderfittinglab");
	incl("Deep Learning Mechanics: ResNets & Vanishing Gradients", "resnetlab");
	incl("Understanding Layer Normalization", "normalizationlab");
	incl("Tokenization: How Words become Numbers", "tokenizerlab");
	incl("Embeddings: The Geometry of Meaning", "embeddinglab");
	incl("Transformers & Attention", "attentionlab");
	incl("Positional Embeddings", "positionalembeddingslab");
	incl("The Transformer Walkthrough", "transformerlab");
	incl("Top-\$k\$-Sampling: Temperature & Top-\$k\$ Explorer", "samplinglab");
	incl("Fine-Tuning: From Internet Scrape to Human Alignment", "finetuninglab");
	incl("Dangers of AI and How to use AI Safely", "hallucinations");
	incl("Prompt Engineering: How talk to LLMs", "promptengineering");
	incl("Philosophical implications, ethical usage and training of AI", "philosophy");
?>
<h1>Disclaimer</h1>
This tutorial was built with the help of Google Gemini. We've done our best to verify the code and info, but please double-check before using it in production.
</div>

<script>
	window.addEventListener('load', () => {
		renderGlossary();
		bibtexify();
		parseCategories();
		smartquote();
		toc();
		make_external_a_href_target_blank();

		setTimeout(() => {
			$("#contents").show();
		}, 500);

		const overlay = document.getElementById('loading-overlay');
		if (overlay) {
			overlay.style.opacity = '0';
			setTimeout(() => {
				overlay.style.display = 'none';
			}, 1000); // Matches the 0.5s transition
		}

		scrollToHash();
		toc();
	});

	(function() {
		function sendHeight() {
			try {
				// 1. Messen
				var h = Math.max(
					document.body ? document.body.scrollHeight : 0, 
					document.documentElement ? document.documentElement.scrollHeight : 0,
					document.body ? document.body.offsetHeight : 0
				);

				if (h === 0) return; // Nichts zu senden

				// 2. Debug-Anzeige (mit Null-Check gegen deinen TypeError)
				var monitor = document.getElementById('debug-child-monitor');
				if (monitor) {
					monitor.innerText = "Child H: " + h + "px";
				}

				// 3. Senden (Wichtig: Läuft unabhängig vom Monitor!)
				window.parent.postMessage({ 
				type: 'DEBUG_HEIGHT', 
					val: h 
				}, '*');

			} catch (err) {
				console.error("Error in sendHeight:", err);
			}
		}

		// Sofort und wiederholt triggern
		if (window.ResizeObserver && document.body) {
			new ResizeObserver(sendHeight).observe(document.body);
		}

		window.addEventListener('load', sendHeight);
		setInterval(sendHeight, 1000);
	})();
</script>
</body>
</html>
