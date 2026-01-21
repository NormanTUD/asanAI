<?php include_once("functions.php"); ?>
<!DOCTYPE html>
<html lang="de">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Ultimate AI Lab</title>
    <?php load_base_js(); ?>
</head>

<div id="toc"></div>

<div id="contents">
<?php
	incl("From $ 1 + 1 = 2 $ to ChatGPT: Basic math concepts", "intro");
	incl("What is the Loss?", "losslab");
	incl('Derivatives: How AI "Learns" to get better', "derivativelab");
	incl("Optimizer", "optimizerlab");
	incl("Minimal Neuron", "minimalneuron");
	incl("Activation Functions", "activationlab");
	incl("Training", "traininglab");
	//incl("Deep Learning", "deeplearninglab");
	incl("Computer Vision", "visionlab");
	incl("Features", "featurelab");
	incl("ResNet", "resnetlab");
	incl("Understanding Layer Normalization", "normalizationlab");
	incl("Tokenizer", "tokenizerlab");
	incl("Embeddings: The Geometry of Meaning", "embeddinglab");
	incl("Self-Attention", "selfattentionlab");
	incl("Attention", "attentionlab");
	incl("Transformer", "transformerlab");
	incl("Sampling", "samplinglab");
	incl("Fine-Tuning: From Internet Scrape to Human Alignment", "finetuninglab");
?>
</div>

<script>
	window.addEventListener('load', () => {
		toc();
	});
</script>
</body>
</html>
