<?php
$GLOBALS["loaded_js"] = [];
$GLOBALS["debug_mode"] = false;

/**
 * Renders a group of tabs where only one can be active at a time.
  * @param  array  $tabs     Associative array: ["Tab Title" => "HTML Content"]
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
	if (!isset($GLOBALS['_gem_tabs_script_loaded'])) {
		$GLOBALS['_gem_tabs_script_loaded'] = true;
		echo '<script>
			window.addEventListener(\'load\', async () => {
				addCopyButtons();
			});
		</script>';
	}
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
	if (!str_ends_with($file, '.css') && !str_starts_with($file, 'http')) {
		$file .= ".css";
	}

	$v = "";
	if (file_exists($file)) {
		$v = "?v=" . filemtime($file);
	}

	print("<link rel='stylesheet' href='$file$v' type='text/css' media='all'>\n");
}

function incl($headline, $base_name) {
	$js_file  = $base_name . ".js";
	$php_file = $base_name . ".php";

	// Pass the headline so js() can use it as the loader label
	js($js_file, $headline);

	if (!file_exists($php_file)) {
		die("Error: PHP file '$php_file' for section '$headline' is missing!");
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
	js("effects");
	css("prism-tomorrow.min.css");
	css("style");
	js("echarts.min");
	js("echarts-gl.min.js");
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
	js("cluster");
	js("polish");
	js("helper");
	js("master_vis");
	js("loader");
	js("three.min");
	js("search");
	js("topics");
	js("progress_tracker");

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
				postLoadInit();
				make_external_a_href_target_blank();
				revealContent();
				sendHeight();
			} catch (error) {
				console.error("Initialization failed:", error);
				updateLoadingStatus(`Error loading page. Please refresh. ${error}`);
			}

			// Signal that the page is fully initialised. Listeners that
			// need to mount interactive content AFTER renderMarkdown() has
			// rewritten the .md innerHTML should hook in here, since the
			// canvas/element references they captured on DOMContentLoaded
			// point to detached nodes by now.
			window.dispatchEvent(new CustomEvent('blogPostLoadComplete'));
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
	if (!isset($_SERVER) || !is_array($_SERVER) || !array_key_exists('PHP_SELF', $_SERVER)) {
		return false;
	}

	$php_self = $_SERVER['PHP_SELF'];

	if (!is_string($php_self)) {
		return false;
	}

	$suffixes = ['index.php', 'index_full.php'];

	foreach ($suffixes as $suffix) {
		$suffix_length = strlen($suffix);
		if ($suffix_length > 0 && strlen($php_self) >= $suffix_length) {
			if (substr($php_self, -$suffix_length) === $suffix) {
				return true;
			}
		}
	}

	return false;
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
	// Title comes from this file's own <!-- COURSE_METADATA: ... --> block.
	$script_filename = $_SERVER['SCRIPT_FILENAME'] ?? '';
	if (empty($script_filename)) return;

	$content = @file_get_contents($script_filename);
	if (!$content) return;

	$pattern = '/<!--\s*\n?\s*COURSE_METADATA:\s*\n((?:.*\n)*?)\s*-->/';
	if (!preg_match($pattern, $content, $matches)) return;

	if (!preg_match('/^title:\s*(.+?)\s*$/m', $matches[1], $title_match)) return;

	$headline = $title_match[1];
	if ($tag == "title") {
		$headline = str_replace('$', '', $headline);
	}

	echo "<$tag>$headline</$tag>\n";
}

function get_ai_course_labels($indexFile = 'index_full.php') {
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

function parse_course_metadata() {
	$modules = glob("*.php");
	$results = [];

	foreach ($modules as $file) {
		$name = basename($file, ".php");
		$base_dir = basename(__DIR__);
		if ($name === "index" || $name === "index_full" || $name === "functions" || $name === "asanai_blog_proxy" || $name === "graph" || $name === "intro") continue;

		$content = file_get_contents($file);
		$pattern = '/<!--\s*\n?\s*COURSE_METADATA:\s*\n((?:.*\n)*?)\s*-->/';
		if (!preg_match($pattern, $content, $matches)) continue;

		$metaRaw = $matches[1];
		$meta = [];
		foreach (explode("\n", $metaRaw) as $line) {
			$line = trim($line);
			if (preg_match('/^(\w+):\s*(.+)$/', $line, $m)) {
				$key = $m[1];
				$meta[$key] = trim($m[2]);
			}
		}

		if (isset($meta['title']) && isset($meta['part'])) {
			$meta['slug'] = $name;
			$meta['part'] = (int)$meta['part'];
			$meta['order'] = isset($meta['order']) ? (int)$meta['order'] : 999;
			$meta['featured'] = isset($meta['featured']) && $meta['featured'] === 'true';
			$meta['url'] = ($base_dir === 'blog') ? $name : "blog/$name";
			$results[] = $meta;
		}
	}

	usort($results, fn($a, $b) => $a['order'] <=> $b['order']);

	$grouped = [];
	foreach ($results as $m) {
		$grouped[$m['part']][] = $m;
	}

	return $grouped;
}

function render_course_tile($m) {
	$classes = 'course-tile';
	if ($m['featured']) $classes .= ' course-tile-featured';
	$iconHtml = $m['icon'] ?? '&#128193;';
	$descHtml = $m['description'] ?? '';
	$topicsAttr = '';
	if (!empty($m['topics'])) {
		$topicsAttr = ' data-topics="' . htmlspecialchars($m['topics']) . '"';
	}
	echo '<a href="' . htmlspecialchars($m['url']) . '" class="' . $classes . '"'
		. ' style="--tile-accent: var(--mn-' . htmlspecialchars($m['color']) . ')"'
		. $topicsAttr . '>';
	echo '<div class="course-tile-icon">' . $iconHtml . '</div>';
	echo '<h3>' . htmlspecialchars($m['title']) . '</h3>';
	echo '<p>' . $descHtml . '</p>';
	echo '</a>';
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
	$themeClass = get_theme_class();
	$cookieTheme = $_COOKIE['theme'] ?? '';
?>
<!DOCTYPE html>
<html lang="en" class="<?php echo $themeClass; ?>">
	<head>
		<meta charset="UTF-8">
		<meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
		<meta name="theme-color" content="<?php echo $themeClass === 'dark' ? '#0f172a' : '#ffffff'; ?>">
		<script>
		function toggleTheme() {
			var html = document.documentElement;
			var isDark = !html.classList.contains('dark');
			if (isDark) {
				html.classList.add('dark');
			} else {
				html.classList.remove('dark');
			}
			var btn = document.getElementById('theme-toggle');
			var meta = document.querySelector('meta[name="theme-color"]');
			if (meta) meta.content = isDark ? '#0f172a' : '#ffffff';
			document.cookie = 'theme=' + (isDark ? 'dark' : 'light') + '; path=/; max-age=' + 60*60*24*365;
		}
		// Apply system preference on first load if no cookie
		(function() {
			if (document.cookie.indexOf('theme=') === -1) {
				var prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
				if (prefersDark) toggleTheme();
			}
		})();
		</script>
<?php
		print_dynamic_title();
		load_base_js();
		call_js_if_matching_file_exists();
?>
	</head>
	<body>
		<a class="cl-skip" href="#contents">Skip to content</a>
		<button id="drawer-toggle" aria-label="Menu" title="Course modules">&#9776;</button>
		<button id="search-trigger" class="search-trigger" aria-label="Search" title="Search (Ctrl+K or /)"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.35-4.35"/></svg></button>
		<?php render_theme_toggle(); ?>
		<?php render_topics_toggle(); ?>
		<?php render_drawer(); ?>
		<div id="loader" role="status" aria-live="polite" aria-label="Loading course content">
			<div class="spinner" aria-hidden="true"></div>
			<p id="loader-status">Initializing AI Course...</p>
			<div id="loader-checklist" aria-hidden="true"></div>
		</div>


		<div id="contents" style="display: none">
<?php
		print_dynamic_title("h1");
		$navData = get_module_nav_data();
		echo '<script>window.__moduleNavData = ' . json_encode($navData) . ';</script>';
}


function hide_email($email) {
	$character_set = '&#' . implode(';&#', array_map('ord', str_split($email))) . ';';
	return $character_set;
}

function isCli(): bool
{
    if (strpos(php_sapi_name(), 'cli') !== false) {
        return true;
    }
    return false;
}

function get_theme_class(): string {
	$theme = $_COOKIE['theme'] ?? '';
	return $theme === 'dark' ? 'dark' : '';
}

function get_module_nav_data(): array {
	$current = pathinfo($_SERVER['SCRIPT_FILENAME'] ?? '', PATHINFO_FILENAME);
	$grouped = parse_course_metadata();
	$linear = [];
	foreach ($grouped as $partNum => $modules) {
		foreach ($modules as $m) {
			$linear[] = $m;
		}
	}
	$idx = -1;
	foreach ($linear as $i => $m) {
		if ($m['slug'] === $current) { $idx = $i; break; }
	}
	return ['modules' => $linear, 'current' => $idx];
}

function render_module_nav(): void {
	$data = get_module_nav_data();
	if ($data['current'] < 0) return;
	$modules = $data['modules'];
	$idx = $data['current'];
	echo '<nav class="module-nav">';
	if ($idx > 0) {
		$prev = $modules[$idx - 1];
		echo '<a href="' . htmlspecialchars($prev['url']) . '" class="module-nav-link module-nav-prev">'
			. '<span class="module-nav-arrow" aria-hidden="true">←</span>'
			. '<span class="module-nav-body">'
			. '<span class="module-nav-label">Previous</span>'
			. '<span class="module-nav-title">' . htmlspecialchars($prev['title']) . '</span>'
			. '</span></a>';
	} else {
		echo '<span></span>';
	}
	if ($idx < count($modules) - 1) {
		$next = $modules[$idx + 1];
		echo '<a href="' . htmlspecialchars($next['url']) . '" class="module-nav-link module-nav-next">'
			. '<span class="module-nav-body">'
			. '<span class="module-nav-label">Next</span>'
			. '<span class="module-nav-title">' . htmlspecialchars($next['title']) . '</span>'
			. '</span>'
			. '<span class="module-nav-arrow" aria-hidden="true">→</span></a>';
	} else {
		echo '<span></span>';
	}
	echo '</nav>';
}

function render_drawer(): void {
	$grouped = parse_course_metadata();
	$current = pathinfo($_SERVER['SCRIPT_FILENAME'] ?? '', PATHINFO_FILENAME);
	echo '<div class="drawer-backdrop" id="drawer-backdrop"></div>';
	echo '<div class="drawer-panel" id="drawer-panel">';
	echo '<div class="drawer-header">';
	echo '<h2>Course Modules</h2>';
	echo '<button class="drawer-close" id="drawer-close" aria-label="Close drawer">&times;</button>';
	echo '</div>';
	echo '<div class="drawer-sections">';
	foreach ($grouped as $partNum => $modules) {
		echo '<div class="drawer-section">';
		echo '<div class="drawer-part-label">Part ' . $partNum . '</div>';
		foreach ($modules as $m) {
			$active = ($m['slug'] === $current) ? ' active' : '';
			echo '<a href="' . htmlspecialchars($m['url']) . '" class="drawer-module' . $active . '">'
				. htmlspecialchars($m['title']) . '</a>';
		}
		echo '</div>';
	}
	echo '</div></div>';
}

function render_theme_toggle(): void {
	echo '<button id="theme-toggle" aria-label="Toggle dark mode" title="Toggle dark mode" onclick="toggleTheme()">';
	echo '<span class="ti-sun" aria-hidden="true"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/></svg></span>';
	echo '<span class="ti-moon" aria-hidden="true"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg></span>';
	echo '</button>';
}

/**
 * 🎯 Top-right "pick your interests" toggle. The actual modal + badge
 * state is wired up by topics.js on DOMContentLoaded; this just
 * paints the button so it's visible immediately, before the heavy
 * modules finish loading.
 */
function render_topics_toggle(): void {
	echo '<button id="topics-toggle" type="button" aria-label="Choose your interests" title="Choose your interests" onclick="if(window.BlogTopics){window.BlogTopics.openOverlay()}">';
	echo '<span class="ti-target" aria-hidden="true">';
	echo '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">';
	echo '<circle cx="12" cy="12" r="9"/>';
	echo '<circle cx="12" cy="12" r="5"/>';
	echo '<circle cx="12" cy="12" r="1.6" fill="currentColor" stroke="none"/>';
	echo '</svg></span>';
	echo '</button>';
}

function render_constellation(int $seed = 42): void {
	// Deterministic pseudo-random nodes & edges for the hero background.
	mt_srand($seed);
	$nodes = [];
	for ($i = 0; $i < 34; $i++) {
		$nodes[] = [
			'x' => mt_rand(20, 1180),
			'y' => mt_rand(20, 380),
			'r' => mt_rand(14, 30) / 10,
			'd' => mt_rand(0, 5000) / 1000,
		];
	}
	$lines = [];
	$count = count($nodes);
	for ($i = 0; $i < $count; $i++) {
		for ($j = $i + 1; $j < $count; $j++) {
			$dx = $nodes[$i]['x'] - $nodes[$j]['x'];
			$dy = $nodes[$i]['y'] - $nodes[$j]['y'];
			$dist = sqrt($dx * $dx + $dy * $dy);
			if ($dist < 215) {
				$lines[] = [
					'a' => $i,
					'b' => $j,
					'd' => mt_rand(0, 6000) / 1000,
				];
			}
		}
	}
	echo '<svg class="constellation" viewBox="0 0 1200 400" '
		. 'preserveAspectRatio="xMidYMid slice" aria-hidden="true">';
	foreach ($lines as $line) {
		$a = $nodes[$line['a']];
		$b = $nodes[$line['b']];
		echo '<line class="cn-line cn-line-flow"'
			. ' x1="' . $a['x'] . '" y1="' . $a['y'] . '"'
			. ' x2="' . $b['x'] . '" y2="' . $b['y'] . '"'
			. ' style="animation-delay:' . $line['d'] . 's"/>';
	}
	foreach ($nodes as $node) {
		echo '<circle class="cn-node"'
			. ' cx="' . $node['x'] . '" cy="' . $node['y'] . '"'
			. ' r="' . $node['r'] . '"'
			. ' style="animation-delay:' . $node['d'] . 's"/>';
	}
	echo '</svg>';
}
?>
