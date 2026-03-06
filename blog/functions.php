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

function js($file) {
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
			// Print the main script include
			print("<script src='$file'></script>\n");
			$GLOBALS["loaded_js"][] = $file;

			// 3. Check for specific module loader function pattern
			if (!$is_proxy && file_exists($file)) {
				$content = file_get_contents($file);
				// Regex: match optional 'async', 'function', and capture 'load...Module'
				// Handles: function loadXModule, async function loadXModule
				if (preg_match('/(?:async\s+)?function\s+(load\w+Module)\s*\(/', $content, $matches)) {
					$functionName = $matches[1];
					print("<script>
						window.addEventListener('DOMContentLoaded', () => {
						if (typeof $functionName === 'function') {
							$functionName();
				}
				});
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
	<?php js("temml.min"); ?>
	<?php js("bpe"); ?>
	<?php css("Temml-Local.min"); ?>

	<script>
		const rootMargin = "800px";
		const subUnits = [
			// --- Deutsch (Häufige Endungen & Wortbestandteile) ---
			"ung", "heit", "keit", "schaft", "chen", "lein", "isch", "erl", "end", "est",
			"erei", "ler", "ner", "rich", "aus", "bau", "hof", "berg", "dorf", "stadt",
			"land", "fluss", "weg", "platz", "mann", "frau", "kind", "zeit", "tag", "jahr",
			"lich", "haft", "sam", "bar", "los", "voll", "reich", "arm", "wert", "würdig",
			"ieren", "elte", "erte", "igt", "icht", "ern", "eln", "st", "t", "en",

			// --- Englisch (Common Suffixes & Word Ends) ---
			"tion", "ing", "ly", "ment", "ness", "able", "ible", "al", "ial", "er",
			"or", "ist", "ism", "ship", "ance", "ence", "ity", "ty", "ive", "ous",
			"ful", "less", "ish", "ic", "ical", "ify", "ize", "ise", "en", "ed",
			"ward", "wise", "ways", "hood", "dom", "some", "th", "fold", "teen", "ty",
			"age", "ery", "ory", "ury", "ure", "ate", "ute", "ite", "ade", "ide",

			// --- Französisch (Suffixes et Terminaisons) ---
			"tion", "sion", "ment", "age", "ence", "ance", "esse", "eur", "euse", "iste",
			"isme", "té", "itée", "ière", "ier", "aire", "oire", "ure", "ude", "ade",
			"able", "ible", "uble", "ique", "iste", "esque", "âtre", "ard", "asse", "et",
			"ette", "ot", "otte", "on", "onne", "ais", "ait", "aient", "iez", "ons",
			"erie", "ie", "ail", "aille", "ille", "illeur", "ance", "ence", "onne", "ième",

			// --- Übergreifende / Lateinische & Griechische Wurzeln ---
			"logie", "graph", "gramm", "phon", "scope", "meter", "sphere", "path", "phil", "phob",
			"cracy", "arch", "onym", "the", "bio", "geo", "astro", "auto", "poly", "mono",
			"multi", "inter", "intra", "trans", "sub", "super", "pre", "post", "anti", "pro",
			"ex", "in", "re", "de", "dis", "un", "mis", "over", "under", "non",

			// --- Top 200 Ergänzungen (Häufige Wortausgänge) ---
			"land", "water", "world", "light", "night", "power", "work", "life", "form", "part",
			"point", "line", "side", "head", "back", "hand", "field", "room", "house", "book",
			"word", "name", "sound", "place", "thing", "case", "system", "group", "area", "state",
			"story", "study", "fact", "idea", "home", "way", "week", "month", "night", "day",
			"man", "woman", "child", "people", "school", "king", "queen", "law", "war", "peace"
		];

		const labelMap = <?php echo json_encode(get_ai_course_labels()); ?>;
		const isIndexPage = window.location.pathname.endsWith('index.php') || window.location.pathname === '/';

		function updateLoadingStatus(message) {
			console.info(message);
			const statusText = document.querySelector('#loader p');
			if (statusText) statusText.textContent = message;
		}

		function observeAndRenderMath(targetNode = document.body) {
			if (!targetNode) {
				console.warn("MutationObserver: Ziel-Element nicht gefunden.");
				return;
			}

			const config = { childList: true, subtree: true, characterData: true };

			const callback = function(mutationsList) {
				for (const mutation of mutationsList) {
					if (mutation.type === 'characterData' || mutation.type === 'childList') {
						const parent = mutation.target.parentElement;
						if (parent && parent.hasAttribute('data-math-rendered')) {
							parent.removeAttribute('data-math-rendered');
						}
					}
				}
				render_temml();
			};

			const observer = new MutationObserver(callback);
			observer.observe(targetNode, config);
		}

		// ── Place once, near your other observers ──
		const _temmlOpts = {
		    delimiters: [
			{ left: "$$", right: "$$", display: true },
			{ left: "$",  right: "$",  display: false }
		    ]
		};

		const _temmlObserver = new IntersectionObserver((entries) => {
		    entries.forEach(entry => {
			if (entry.isIntersecting) {
			    const el = entry.target;
			    // Guard: skip if already rendered, detached from DOM, or no math left
			    if (el.isConnected &&
				!el.hasAttribute('data-math-rendered') &&
				el.textContent.includes('$')) {
				temml.renderMathInElement(el, _temmlOpts);
				el.setAttribute('data-math-rendered', 'true');
			    }
			    _temmlObserver.unobserve(el);
			}
		    });
		}, {
		    threshold: 0,
		    rootMargin: rootMargin
		});

		function render_temml() {
			const elements = document.querySelectorAll(
				'p:not([data-math-rendered]), span:not([data-math-rendered]), div:not([data-math-rendered]), li:not([data-math-rendered])'
		    );

			elements.forEach(el => {
			if (!el.textContent.includes('$')) return;

			const rect = el.getBoundingClientRect();

			// ① FIX: Elements inside hidden tabs (display:none) have zero
			//    dimensions. IntersectionObserver will NEVER fire for them.
			//    Render immediately so they're ready when the tab is shown.
			if (rect.width === 0 && rect.height === 0) {
				temml.renderMathInElement(el, _temmlOpts);
				el.setAttribute('data-math-rendered', 'true');
				return;
			}

			// ② Elements in/near the viewport → render immediately
			if (rect.bottom > -300 && rect.top < window.innerHeight + 300) {
				temml.renderMathInElement(el, _temmlOpts);
				el.setAttribute('data-math-rendered', 'true');
			} else {
				// ③ Far off-screen → defer until scrolled into view
				_temmlObserver.observe(el);
			}
		    });
		}

		// ─── Shared post-load initialization ───
		// Called by both index.php and standalone subpages to avoid duplication.
		function sharedPostLoadInit() {
			addCopyButtons();
			smartquote();
			initOptionalBlocks();
			toc();
			addReadingProgress();
			addCuriosityScore();
			//addReturnVisitorWarmth();
			addKonamiEgg();
			addConsoleEasterEggs();
		}

		document.addEventListener("DOMContentLoaded", function() {
			render_temml();
			observeAndRenderMath(document.body);

			const observer = new MutationObserver(function(mutations) {
				let needsRender = false;
				mutations.forEach(mutation => {
				if (mutation.addedNodes.length > 0) needsRender = true;
				});

				if (needsRender) {
					render_temml();
				}
			});

			observer.observe(document.body, {
			childList: true,
				subtree: true
			});
		});

		function sendHeight() {
			var body = document.body,
				html = document.documentElement;

			var height = Math.max(
				body.scrollHeight, 
				body.offsetHeight, 
				html.clientHeight, 
				html.scrollHeight, 
				html.offsetHeight
			);

			if (window.parent && window.parent !== window) {
				window.parent.postMessage({
					type: 'height',
					val: height
				}, '*');
			}
		}


	</script>

<?php
	css("prism-tomorrow.min.css");
	css("style");
	js("echarts.min");
	js("prism.min");
	js("prism-python.min");
	js("literature");
	js("citation_graph");
	js("jquery-3.7.1.min");
	js("plotly-2.24.1.min");
	js("tf.min");
	js("marked.min");
	js("toc");
	js("fcnn_visualization");
	js("init");
	js("helper");
	js("master_vis");

	$files = glob("modules/*.js");

	if ($files) {
		foreach ($files as $file) {
			$name = basename($file, ".js");
			js("modules/$name");
		}
	}
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
		<script>
			window.addEventListener('load', async (event) => {
				try {
					updateLoadingStatus("Processing Citations...");
					await bibtexify();

					renderMarkdown();
					make_external_a_href_target_blank();

					revealContent();

					sharedPostLoadInit();
				} catch (error) {
					console.error("Initialization failed:", error);
					updateLoadingStatus("Error loading page. Please refresh. " + error);
				}
			});
		</script>
	</head>
	<body>

		<div id="loader">
			<div class="spinner"></div>
			<p>Initializing...</p>
		</div>

		<div id="contents" style="display: none">
<?php
		print_dynamic_title("h1");
}
?>
