<?php include_once("functions.php"); ?>
<!DOCTYPE html>
<html lang="de">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Ultimate AI Lab</title>
    <?php load_base_js(); ?>
</head>

<h1>From $ f(x) = x + 1 $ to ChatGPT</h1>

<?php
	incl("Intro", "intro");
	incl("Images", "imagelab");
	incl("Functions", "functionlab");
	incl("Derivatives", "derivativelab");
	incl("Optimizer", "optimizerlab");
	incl("Minimal Neuron", "minimalneuron");
	incl("Activation Functions", "activationlab");
	incl("Training", "traininglab");
	incl("Deep Learning", "deeplearninglab");
	incl("Computer Vision", "visionlab");
	incl("Tokenizer", "tokenizerlab");
	incl("Embeddings", "embeddinglab");
	incl("Embeddings with BPE", "embeddingbpelab");
	incl("Attention", "attentionlab");
	incl("Next word", "predictionlab");
	incl("End", "end");
?>

</body>
</html>
