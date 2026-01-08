<?php
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
