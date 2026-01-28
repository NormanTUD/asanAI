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
				#print("<script>".file_get_contents($file)."</script>\n");
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

	$allOpen = isset($_GET['showall']);
	$thisOpen = (isset($_GET['open']) && $_GET['open'] == $base_name);

	$isOpen = ($allOpen || $thisOpen) ? " open" : "";

	print("<h1>$headline</h1>\n");
	include($php_file);
}

function load_base_js () {
?>
	<script src="https://cdn.jsdelivr.net/npm/temml@0.13.1/dist/temml.min.js"></script>
	<link href="https://cdn.jsdelivr.net/npm/temml@0.13.1/dist/Temml-Local.min.css" rel="stylesheet">

	<script>
	function render_temml() {
			temml.renderMathInElement(document.body, {
				delimiters: [
			{left: "$$", right: "$$", display: true},
			{left: "$", right: "$", display: false}
				]
			});
		}

		document.addEventListener("DOMContentLoaded", function() {
			// 1. Initiales Rendern beim Laden der Seite
			render_temml();

			// 2. Den Observer einrichten, um auf Änderungen zu reagieren
			const observer = new MutationObserver(function(mutations) {
				// Wir prüfen, ob neue Nodes hinzugefügt wurden
				let needsRender = false;
				mutations.forEach(mutation => {
				if (mutation.addedNodes.length > 0) needsRender = true;
				});

				if (needsRender) {
					// Optional: Ein kurzes "Debounce", damit bei vielen Änderungen
					// nicht 100x pro Sekunde gerendert wird
					render_temml();
				}
			});

			// Konfiguration des Observers: Überwachung von Kindelementen im gesamten Body
			observer.observe(document.body, {
			childList: true,
				subtree: true
			});
		});
	</script>

	<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/themes/prism-tomorrow.min.css">
	<script src="https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/prism.min.js"></script>
	<script src="https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/components/prism-python.min.js"></script>
	<link rel="stylesheet" href="style.css">
<?php
	js("jquery-3.7.1.min");
	js("plotly-2.24.1.min");
	js("tf.min");
	js("marked.min");
	js("toc");
	js("fcnn_visualization");
	js("init");
	js("helper");
	js("master_vis");
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

function print_dynamic_title() {
	// Determine the current filename without extension (e.g., 'optimizerlab')
	$script_filename = $_SERVER['SCRIPT_FILENAME'] ?? '';
	if (empty($script_filename)) return;

	$base_name = pathinfo($script_filename, PATHINFO_FILENAME);

	// Read the content of index.php
	$index_path = dirname(__FILE__) . DIRECTORY_SEPARATOR . 'index.php';
	$index_content = @file_get_contents($index_path);

	if ($index_content) {
		// Regex to find: incl("Headline", "base_name")
		// Supports both single and double quotes
		$pattern = '/incl\s*\(\s*["\'](.*?)["\']\s*,\s*["\']' . preg_quote($base_name) . '["\']\s*\)/';

		if (preg_match($pattern, $index_content, $matches)) {
			$headline = $matches[1];
			// Clean up LaTeX $ symbols for the browser tab title
			$headline = str_replace('$', '', $headline);
			echo "<title>$headline</title>\n";
		}
	}
}

if(!server_php_self_ends_with_index_php()) {
?>
<!DOCTYPE html>
<html lang="de">
	<head>
		<meta charset="UTF-8">
		<meta name="viewport" content="width=device-width, initial-scale=1.0">
<?php
		print_dynamic_title();
		load_base_js();
		call_js_if_matching_file_exists();
?>
		<script>
			window.addEventListener('load', (event) => {
				renderMarkdown();
				make_external_a_href_target_blank();
				smartquote();
			});
		</script>
	</head>
	<body>
		<div id="contents">
<?php
}
?>
