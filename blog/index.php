<?php
	function incl($headline, $file) {
		// Start the details wrapper
		print("<details class='auto_details'>\n");
		
		// The summary acts as the clickable heading
		print("  <summary class='auto_headline'>");
		print("    $headline (<tt>$file</tt>)");
		print("  </summary>\n");
		
		// The actual content is hidden until the summary is clicked
		print("  <div class='content_wrapper'>\n");
		include($file);
		print("  </div>\n");
		
		print("</details>\n");
	}
?>
<!DOCTYPE html>
<html lang="de">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Ultimate AI Lab</title>
    <script src="https://code.jquery.com/jquery-3.7.1.min.js"></script>
    <script>window.MathJax = { tex: { inlineMath: [['$', '$']], displayMath: [['$$', '$$']] } };</script>
    <script src="https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-mml-chtml.js"></script>
    <script src="https://cdn.plot.ly/plotly-2.24.1.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@4.10.0/dist/tf.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/marked/marked.min.js"></script>
    <script src="fcnn_visualization.js"></script>
    <script src="init.js"></script>
    <script src="helper.js"></script>
    <script src="visionlab.js"></script>
    <script src="tokenizerlab.js"></script>
    <script src="functionlab.js"></script>
    <script src="train.js"></script>
    <script src="datalab.js"></script>
    <script src="embeddinglab.js"></script>
    <script src="master_vis.js"></script>
    <script src="transformerlab.js"></script>
    <script src="derivativelab.js"></script>
    <script src="optimizerlab.js"></script>
    <script src="activationlab.js"></script>
    <link rel="stylesheet" href="style.css">
</head>
<body>

<h1>From $ f(x) = x + 1 $ to ChatGPT</h1>

<?php incl("Intro", "intro.php"); ?>
<?php incl("Images", "images.php"); ?>
<?php incl("Functions", "functions.php"); ?>
<?php incl("Derivatives", "derivatives.php"); ?>
<?php incl("Optimizer", "optimizer.php"); ?>
<?php incl("Minimal Neuron", "minimalneuron.php"); ?>
<?php incl("Activation Functions", "activations.php"); ?>
<?php incl("Deep Learning", "deeplearninglab.php"); ?>
<?php incl("Computer Vision", "computervision.php"); ?>
<?php incl("Tokenizer", "tokenizer.php"); ?>
<?php incl("Embeddings", "embeddings.php"); ?>
<?php incl("Attention", "attention.php"); ?>
<?php incl("Final", "finallab.php"); ?>
<?php incl("End", "end.php"); ?>

</body>
</html>
