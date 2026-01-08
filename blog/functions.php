<?php
$GLOBALS["loaded_js"] = [];
$GLOBALS["debug_mode"] = false;

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

function load_base_js () {
?>
	<script>window.MathJax = { tex: { inlineMath: [['$', '$']], displayMath: [['$$', '$$']] } };</script>
	<script src="https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-mml-chtml.js"></script>   
	<link rel="stylesheet" href="style.css">
<?php
	js("jquery-3.7.1.min");
	js("plotly-2.24.1.min");
	js("tf.min");
	js("marked.min");

	js("fcnn_visualization");
	js("init");
	js("helper");
	js("master_vis");
	js("train");
}

function server_php_self_ends_with_index_php() {
	if (!isset($_SERVER)) {
		return false;
	}

	if (!is_array($_SERVER)) {
		return false;
	}

	if (!array_key_exists('PHP_SELF', $_SERVER)) {
		return false;
	}

	$php_self = $_SERVER['PHP_SELF'];

	if (!is_string($php_self)) {
		return false;
	}

	$suffix = 'index.php';
	$suffix_length = strlen($suffix);

	if ($suffix_length === 0) {
		return false;
	}

	if (strlen($php_self) < $suffix_length) {
		return false;
	}

	return substr($php_self, -$suffix_length) === $suffix;
}

function call_js_if_matching_file_exists() {
	if (!isset($_SERVER)) {
		return false;
	}

	if (!is_array($_SERVER)) {
		return false;
	}

	if (!array_key_exists('SCRIPT_FILENAME', $_SERVER)) {
		return false;
	}

	$script_filename = $_SERVER['SCRIPT_FILENAME'];

	if (!is_string($script_filename)) {
		return false;
	}

	if (!file_exists($script_filename)) {
		return false;
	}

	$path_info = pathinfo($script_filename);

	if (!is_array($path_info)) {
		return false;
	}

	if (!array_key_exists('filename', $path_info)) {
		return false;
	}

	if (!array_key_exists('dirname', $path_info)) {
		return false;
	}

	$base_name = $path_info['filename'];
	$directory = $path_info['dirname'];

	if (!is_string($base_name) || $base_name === '') {
		return false;
	}

	if (!is_string($directory) || $directory === '') {
		return false;
	}

	$js_file = $directory . DIRECTORY_SEPARATOR . $base_name . '.js';

	if (!file_exists($js_file)) {
		return false;
	}

	if (!is_readable($js_file)) {
		return false;
	}

	js($base_name);

	return true;
}

if(!server_php_self_ends_with_index_php()) {
	load_base_js();
	call_js_if_matching_file_exists();
}
?>
