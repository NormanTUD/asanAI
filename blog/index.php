<?php
$GLOBALS["loaded_from_index"] = 1;
$GLOBALS["loaded_js"] = [];
$GLOBALS["debug_mode"] = false; // Auf true setzen, um Fehler bei fehlenden Dateien zu sehen
include_once("functions.php");
?>
<!DOCTYPE html>
<html lang="de">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Ultimate AI Lab</title>


    <?php
        // Bibliotheken laden
        js("jquery-3.7.1.min");
        js("plotly-2.24.1.min");
        js("tf.min");
        js("marked.min");

        // Eigene Scripte laden
        js("fcnn_visualization");
        js("init");
        js("helper");
        js("master_vis");
        js("train");
    ?>
 
    <script>window.MathJax = { tex: { inlineMath: [['$', '$']], displayMath: [['$$', '$$']] } };</script>
    <script src="https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-mml-chtml.js"></script>   
    <link rel="stylesheet" href="style.css">
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
	incl("Attention", "attentionlab");
	incl("Next word", "predictionlab");
	incl("End", "end");
?>

</body>
</html>
