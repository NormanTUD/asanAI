<?php
$GLOBALS["loaded_js"] = [];
$GLOBALS["debug_mode"] = false;

/**
 * Renders a group of tabs where only one can be active at a time.
 * * @param array  $tabs     Associative array: ["Tab Title" => "HTML Content"]
 * @param string $groupId  A unique string for this group (to prevent interference with others)
 */
function render_gem_tabs($tabs, $groupId = 'tabgroup') {
	if (empty($tabs)) return '';

	// Generate a unique suffix if multiple groups exist on one page
	$uniqueHash = substr(md5(serialize($tabs) . $groupId), 0, 12);

	echo '<div class="gem-tab-container">';

	$index = 0;
	foreach ($tabs as $title => $content) {
		$tabId = "tab-" . $uniqueHash . "-" . $index;
		$checked = ($index === 0) ? 'checked' : ''; // First tab open by default

		// 1. The Hidden Radio Button
		// The 'name' must be the same for all items in THIS group,
		// but different from other groups on the page.
		echo '<input type="radio"
			id="' . htmlspecialchars($tabId) . '"
			name="gem-group-' . $uniqueHash . '"
			class="gem-tab-state"
				' . $checked . '>';

		// 2. The Label (The clickable tab)
		echo '<label for="' . htmlspecialchars($tabId) . '" class="gem-tab-trigger">'
			. htmlspecialchars($title) .
			'</label>';

		// 3. The Content Panel
		echo '<div class="gem-tab-panel">' . $content . '</div>';

		$index++;
	}

	echo '</div>';
?>
	<script>
		window.addEventListener('load', async () => {
			addCopyButtons();
		});
	</script>
<?php
}

function js($file, $loaderLabel = null, $defer = false) {
	// 1. Normalize file extension
	if (!str_ends_with($file, '.js') && !str_starts_with($file, 'http')) {
		$file .= ".js";
	}

	// 2. Prevent double loading
	if (!in_array($file, $GLOBALS["loaded_js"])) {
		$should_load = false;
		$is_proxy = str_starts_with($file, 'asanai_blog_proxy');

		if ($is_proxy || file_exists($file)) {
			$should_load = true;
		}

		if ($should_load) {
			$deferAttr = $defer ? " defer" : "";
			print("<script src='$file'$deferAttr></script>\n");
			$GLOBALS["loaded_js"][] = $file;

			// 3. Check for module loader function pattern
			if (!$is_proxy && file_exists($file)) {
				$content = file_get_contents($file);
				if (preg_match('/(?:async\s+)?function\s+(load\w+Module)\s*\(/', $content, $matches)) {
					$functionName = $matches[1];

					// Use the headline passed from incl(), or extract from JS, or fallback to function name
					if ($loaderLabel === null) {
						if (preg_match('/updateLoadingStatus\s*\(\s*["\']Loading section about (.+?)\.\.\.["\']/', $content, $labelMatch)) {
							$loaderLabel = $labelMatch[1];
						} else {
							$loaderLabel = $functionName;
						}
					}

					// Strip any LaTeX ($...$) from the label for clean display
					$cleanLabel = preg_replace('/\$[^$]*\$/', '', $loaderLabel);
					$cleanLabel = trim($cleanLabel);

					$safeSectionLabel = htmlspecialchars(addslashes($cleanLabel), ENT_QUOTES);

					print("<script>
						if (!window.__moduleLoaderQueue) window.__moduleLoaderQueue = [];
					if (!window.__moduleLoaderNames) window.__moduleLoaderNames = [];
					window.__moduleLoaderQueue.push($functionName);
					window.__moduleLoaderNames.push('$safeSectionLabel');
					</script>\n");
				}
			}
		} elseif ($GLOBALS["debug_mode"]) {
			echo "\n";
		}
	}
}

function css($file) {
	// 1. Add .css extension if missing and not a URL
	if (!str_ends_with($file, '.css') && !str_starts_with($file, 'http')) {
		$file .= ".css";
	}

	// 2. Redirect logic
	#if (isset($_GET['load_from_asanai']) && !str_starts_with($file, 'http')) {
	#	$file = "asanai_blog_proxy.php?" . ltrim($file, '/');
	#}

	// 3. Output the tag
	print("<link rel='stylesheet' href='$file'>\n");
}

function incl($headline, $base_name) {
	$js_file  = $base_name . ".js";
	$php_file = $base_name . ".php";

	// Pass the headline so js() can use it as the loader label
	js($js_file, $headline);

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
	js("temml.min");
	js("bpe");
	css("Temml-Local.min");
	js("start");
	css("prism-tomorrow.min.css");
	css("style");
	js("echarts.min");
	js("prism.min");
	js("prism-python.min");
	js("literature");
	js("citation_graph");
	js("jquery-3.7.1.min");
	js("plotly-2.24.1.min", null, true);
	js("tf.min", null, true);
	js("marked.min");
	js("toc");
	js("fcnn_visualization");
	js("init");
	js("helper");
	js("master_vis");
	js("loader");

	$files = glob("modules/*.js");

	if ($files) {
		foreach ($files as $file) {
			$name = basename($file, ".js");
			js("modules/$name");
		}
	}
?>
	<script>
		const labelMap = <?php echo json_encode(get_ai_course_labels()); ?>;
		window.addEventListener('load', sendHeight);
		window.addEventListener('resize', sendHeight);

		// Coordination flags
		let _modulesLoaded = false;
		let _windowLoaded = false;
		let _postLoadDone = false;

		async function runPostLoad() {
			// Only run when BOTH conditions are met, and only once
			if (!_modulesLoaded || !_windowLoaded || _postLoadDone) return;
			_postLoadDone = true;

			try {
				await bibtexify();
				renderMarkdown();
				make_external_a_href_target_blank();
				postLoadInit();
				revealContent();
				sendHeight();
			} catch (error) {
				console.error("Initialization failed:", error);
				updateLoadingStatus(`Error loading page. Please refresh. ${error}`);
			}
		}

		window.addEventListener('DOMContentLoaded', loader_fn);

		window.addEventListener('load', async (event) => {
			_windowLoaded = true;
			runPostLoad();
		});

		(function() {
			const startObserving = () => {
				if (!document.body) return;

				if (window.ResizeObserver) {
					const ro = new ResizeObserver(() => {
						sendHeight();
					});
					ro.observe(document.body);
				} else {
					setInterval(sendHeight, 1000);
				}
			};

			if (document.readyState === 'loading') {
				document.addEventListener('DOMContentLoaded', startObserving);
			} else {
				startObserving();
			}
		})();
	</script>
<?php
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

function print_dynamic_title($tag = "title") {
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
			if($tag == "title") {
				$headline = str_replace('$', '', $headline);
			}

			echo "<$tag>$headline</$tag>\n";
		}
	}
}

function get_ai_course_labels($indexFile = 'index.php') {
	$labelsMap = [];
	$content = file_get_contents($indexFile);

	// 1. Extrahiere alle Dateinamen aus den incl() Aufrufen
	// Sucht nach: incl("Titel", "dateiname");
	preg_match_all('/incl\s*\(\s*["\'].*?["\']\s*,\s*["\'](.*?)["\']\s*\)/', $content, $matches);

	$files = $matches[1]; // Enthält z.B. ['intro', 'history', 'attentionlab', ...]

	foreach ($files as $fileName) {
		$fullPath = $fileName . ".php";

		if (file_exists($fullPath)) {
			$fileContent = file_get_contents($fullPath);

			// 2. Suche nach \label{name}
			// Erlaubt Buchstaben, Zahlen, Bindestriche und Unterstriche
			preg_match_all('/\\\\label\{([a-zA-Z0-9\-_:]+)\}/', $fileContent, $labelMatches);

			foreach ($labelMatches[1] as $label) {
				$labelsMap[$label] = $fileName;
			}
		}
	}

	return $labelsMap;
}

function get_string_of_file_or_die($file) {
	if(!file_exists($file)) {
		die(">$file< does not exist.");
	}

	if(!is_readable($file)) {
		die(">$file< is not readable");
	}

	return file_get_contents($file);
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
	</head>
	<body>
		<div id="loader" role="status" aria-live="polite" aria-label="Loading course content">
			<div class="spinner" aria-hidden="true"></div>
			<p id="loader-status">Initializing AI Course...</p>
			<div id="loader-checklist" aria-hidden="true"></div>
		</div>


		<div id="contents" style="display: none">
<?php
		print_dynamic_title("h1");
}
?>
