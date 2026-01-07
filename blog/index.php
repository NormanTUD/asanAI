<?php
$GLOBALS["loaded_js"] = [];

function incl($headline, $js_file, $php_file) {
	if($js_file != "" && !file_exists($js_file)) {
		die("Invalid JS File: $js_file");
	}

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
	if(!file_exists($php_file)) {
		die("Invalid PHP File: $php_file");
	}
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
    <script src="train.js"></script>
    <link rel="stylesheet" href="style.css">
</head>
<body>

<h1>From $ f(x) = x + 1 $ to ChatGPT</h1>

<?php
	incl("Intro", "", "intro.php");
	incl("Images", "imagelab.js", "imagelab.php");
	incl("Functions", "functionlab.js", "functionlab.php");
	incl("Derivatives", "derivativelab.js", "derivativelab.php");
	incl("Optimizer", "optimizerlab.js", "optimizerlab.php");
	incl("Minimal Neuron", "", "minimalneuron.php");
	incl("Activation Functions", "activationlab.js", "activationlab.php");
	incl("Training", "", "traininglab.php");
	incl("Deep Learning", "", "deeplearninglab.php");
	incl("Computer Vision", "visionlab.js", "visionlab.php");
	incl("Tokenizer", "tokenizerlab.js", "tokenizerlab.php");
	incl("Embeddings", "embeddinglab.js", "embeddinglab.php");
	incl("Attention", "attentionlab.js", "attentionlab.php");
	incl("End", "attentionlab.js", "end.php");
?>

</body>
</html>
