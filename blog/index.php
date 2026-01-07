<?php
$GLOBALS["loaded_js"] = [];

function incl($headline, $js_file, $php_file) {

	// Prüfen, ob eine JS-Datei angegeben wurde UND ob sie noch nicht geladen wurde
	if (!empty($js_file) && !in_array($js_file, $GLOBALS["loaded_js"])) {
		print("<script src='$js_file'></script>\n");

		// Datei als "geladen" markieren
		$GLOBALS["loaded_js"][] = $js_file;
	}

	print("<details class='auto_details'>\n");

	print("  <summary class='auto_headline'>");
	print("    $headline (<tt>$php_file</tt>)");
	print("  </summary>\n");

	print("  <div class='content_wrapper'>\n");
	include($php_file);
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
    <script src="master_vis.js"></script>
    <link rel="stylesheet" href="style.css">
</head>
<body>

<h1>From $ f(x) = x + 1 $ to ChatGPT</h1>

<?php
	incl("Intro", "", "intro.php");
	incl("Images", "datalab.js", "images.php");
	incl("Functions", "functionlab.js", "functions.php");
	incl("Derivatives", "derivativelab.js", "derivatives.php");
	incl("Optimizer", "optimizerlab.js", "optimizer.php");
	incl("Minimal Neuron", "train.js", "minimalneuron.php");
	incl("Activation Functions", "activationlab.js", "activations.php");
	incl("Deep Learning", "train.js", "deeplearninglab.php");
	incl("Training", "train.js", "training.php");
	incl("Computer Vision", "visionlab.js", "computervision.php");
	incl("Tokenizer", "tokenizerlab.js", "tokenizer.php");
	incl("Embeddings", "embeddinglab.js", "embeddings.php");
	incl("Attention", "transformerlab.js", "attention.php");
	incl("End", "transformerlab.js", "end.php");
?>

</body>
</html>
