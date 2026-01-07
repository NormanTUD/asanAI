<?php
$GLOBALS["loaded_js"] = [];
$GLOBALS["debug_mode"] = false; // Auf true setzen, um Fehler bei fehlenden Dateien zu sehen

function incl($headline, $base_name) {
    // Dateinamen automatisch generieren
    $js_file  = $base_name . ".js";
    $php_file = $base_name . ".php";

    // JS-Logik: Nur einbinden, wenn Datei existiert UND noch nicht geladen wurde
    if (!in_array($js_file, $GLOBALS["loaded_js"])) {
        if (file_exists($js_file)) {
            print("<script src='$js_file'></script>\n");
            $GLOBALS["loaded_js"][] = $js_file;
        } elseif ($GLOBALS["debug_mode"]) {
            // Nur im Debug-Modus meckern, wenn JS fehlt
            print("\n");
        }
    }

    // PHP-Logik: Muss vorhanden sein, sonst stirbt das Skript (da Content-kritisch)
    if (!file_exists($php_file)) {
        die("Kritischer Fehler: PHP-Datei '$php_file' für Sektion '$headline' fehlt!");
    }

    // HTML Ausgabe
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
    <script src="jquery-3.7.1.min.js"></script>
    <script>window.MathJax = { tex: { inlineMath: [['$', '$']], displayMath: [['$$', '$$']] } };</script>
    <script src="https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-mml-chtml.js"></script>
    <script src="https://cdn.plot.ly/plotly-2.24.1.min.js"></script>
    <script src="tf.min.js"></script>
    <script src="marked.min.js"></script>

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
	incl("End", "end");
?>

</body>
</html>
