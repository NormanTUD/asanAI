<?php include_once("functions.php"); ?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>From 1 + 1 = 2 to ChatGPT</title>
    <?php load_base_js(); ?>
</head>

<div id="loading-overlay" style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: #fff; display: flex; flex-direction: column; align-items: center; justify-content: center; z-index: 9999; transition: opacity 0.5s ease;">
	<div class="spinner" style="width: 50px; height: 50px; border: 5px solid #f3f3f3; border-top: 5px solid #3b82f6; border-radius: 50%; animation: spin 1s linear infinite;"></div>
	<p style="margin-top: 15px; font-family: sans-serif; color: #555;">Initializing AI Course...</p>
</div>

<div id="toc"></div>

<div id="contents">
<?php
	incl("From $ 1 + 1 = 2 $ to ChatGPT: Basic math concepts", "intro");
	incl("Loss: Teaching through Failure", "losslab");
	incl('Derivatives: How AI "Learns" to get better', "derivativelab");
	incl("Optimizer", "optimizerlab");
	incl("Minimal Neuron", "minimalneuron");
	incl("Activation Functions: The Neural Decision Makers", "activationlab");
	incl("Training", "traininglab");
	incl("Computer Vision", "visionlab");
	incl("Over- and underfitting", "overandunderfittinglab");
	incl("Deep Learning Mechanics: ResNets & Vanishing Gradients", "resnetlab");
	incl("Understanding Layer Normalization", "normalizationlab");
	incl("Tokenizer", "tokenizerlab");
	incl("Embeddings: The Geometry of Meaning", "embeddinglab");
	incl("Transformers & Attention", "attentionlab");
	incl("Positional Embeddings", "positionalembeddingslab");
	incl("The Transformer Walkthrough", "transformerlab");
	incl("Top-\$k\$-Sampling: Temperature & Top-\$k\$ Explorer", "samplinglab");
	incl("Fine-Tuning: From Internet Scrape to Human Alignment", "finetuninglab");
	incl("Dangers of AI and How to use AI Safely", "hallucinations");
	incl("Philosophical implications, ethical usage and training of AI", "ethics");
?>
</div>

<script>
	window.addEventListener('load', () => {
		toc();

		const overlay = document.getElementById('loading-overlay');
		if (overlay) {
			overlay.style.opacity = '0';
			setTimeout(() => {
			overlay.style.display = 'none';
			}, 500); // Matches the 0.5s transition
		}
	});
</script>
</body>
</html>
