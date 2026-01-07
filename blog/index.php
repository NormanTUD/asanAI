<?php
$GLOBALS["loaded_js"] = [];
$GLOBALS["debug_mode"] = false; // Auf true setzen, um Fehler bei fehlenden Dateien zu sehen

function js($file) {
	// Falls kein .js am Ende steht, fügen wir es hinzu
	if (!str_ends_with($file, '.js') && !str_starts_with($file, 'http')) {
		$file .= ".js";
	}

	// Prüfen, ob die Datei bereits geladen wurde (verhindert Duplikate)
	if (!in_array($file, $GLOBALS["loaded_js"])) {

		// Lokale Datei? Dann prüfen ob sie existiert
		if (!str_starts_with($file, 'http')) {
			if (file_exists($file)) {
				print("<script src='$file'></script>\n");
				$GLOBALS["loaded_js"][] = $file;
			} elseif ($GLOBALS["debug_mode"]) {
				echo "\n";
			}
		} else {
			// Externes CDN (immer laden, falls nicht in loaded_js)
			print("<script src='$file'></script>\n");
			$GLOBALS["loaded_js"][] = $file;
		}
	}
}

function incl($headline, $base_name) {
	// Dateinamen automatisch generieren
	$js_file  = $base_name . ".js";
	$php_file = $base_name . ".php";

	js($js_file);

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
	incl("End", "end");
?>

</body>
</html>
