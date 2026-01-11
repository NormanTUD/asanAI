<?php include_once("functions.php"); ?>
<!DOCTYPE html>
<html lang="de">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Ultimate AI Lab</title>
    <?php load_base_js(); ?>
</head>

<h1>From $ 1 + 1 = 2 $ to ChatGPT</h1>

<?php
	incl("Intro", "intro");
	incl("Functions", "functionlab");
	incl("Images", "imagelab");
	incl("Derivatives", "derivativelab");
	incl("Optimizer", "optimizerlab");
	incl("Minimal Neuron", "minimalneuron");
	incl("Activation Functions", "activationlab");
	incl("Training", "traininglab");
	incl("Deep Learning", "deeplearninglab");
	incl("Computer Vision", "visionlab");
	incl("Features", "featurelab");
	incl("ResNet", "resnetlab");
	incl("Normalization", "normalizationlab");
	incl("Tokenizer", "tokenizerlab");
	incl("Embeddings", "embeddinglab");
	incl("Self-Attention", "selfattentionlab");
	incl("Attention", "attentionlab");
	incl("Next word", "predictionlab");
	incl("Transformer", "transformerlab");
?>

</body>
</html>
