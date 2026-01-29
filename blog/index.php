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
	<div id="toc"></div>
<?php
	incl("From $ 1 + 1 = 2 $ to ChatGPT: Basic math concepts", "intro");
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
	incl("Glossary", "glossary");
?>
</div>

<script>
	window.addEventListener('load', () => {
		bibtexify();
		smartquote();
		makebibliography();
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
	});
</script>
</body>
</html>
