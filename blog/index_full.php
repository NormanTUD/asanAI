<?php include_once("functions.php"); ?>
<?php $themeClass = get_theme_class(); ?>
<!DOCTYPE html>
<html lang="en" class="<?php echo $themeClass; ?>">
<head>
	<meta charset="UTF-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<meta name="theme-color" content="<?php echo $themeClass === 'dark' ? '#0f172a' : '#FAF8F1'; ?>">
	<title>From Big Bang to ChatGPT</title>
	<script>
	function toggleTheme() {
		var html = document.documentElement;
		var isDark = !html.classList.contains('dark');
		if (isDark) { html.classList.add('dark'); } else { html.classList.remove('dark'); }
		var btn = document.getElementById('theme-toggle');
		var meta = document.querySelector('meta[name="theme-color"]');
		if (meta) meta.content = isDark ? '#0f172a' : '#FAF8F1';
		document.cookie = 'theme=' + (isDark ? 'dark' : 'light') + '; path=/; max-age=' + 60*60*24*365;
	}
	function toggleReaderMode() {
		var html = document.documentElement;
		var on = !html.classList.contains('reader-mode');
		if (on) html.classList.add('reader-mode');
		else html.classList.remove('reader-mode');
		try { localStorage.setItem('readerMode', on ? '1' : '0'); } catch (e) {}
		var meta = document.querySelector('meta[name="theme-color"]');
		if (meta && on) meta.content = html.classList.contains('dark') ? '#10172a' : '#F8F2E4';
	}
	(function() {
		if (document.cookie.indexOf('theme=') === -1) {
			var prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
			if (prefersDark) document.cookie = 'theme=dark; path=/; max-age=' + 60*60*24*365;
		}
		try {
			if (localStorage.getItem('readerMode') === '1') {
				document.documentElement.classList.add('reader-mode');
			}
		} catch (e) {}
	})();
	document.addEventListener('keydown', function (ev) {
		if (ev.ctrlKey || ev.metaKey || ev.altKey) return;
		var t = ev.target;
		if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return;
		if (ev.key === 'r' || ev.key === 'R') {
			ev.preventDefault();
			toggleReaderMode();
		}
	});
	</script>
	<?php load_base_js(); ?>
	<?php include_once("mobile-loader.php"); ?>
</head>
<body>
<button id="drawer-toggle" aria-label="Menu" title="Course modules">&#9776;</button>
<button id="search-trigger" class="search-trigger" aria-label="Search" title="Search (Ctrl+K or /)"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.35-4.35"/></svg></button>
<?php render_theme_toggle(); ?>
<?php render_reader_toggle(); ?>
<?php render_drawer(); ?>
<div id="loader" role="status" aria-live="polite" aria-label="Loading course content">
	<div class="spinner" aria-hidden="true"></div>
	<p id="loader-status">Initializing AI Course...</p>
	<div id="loader-checklist" aria-hidden="true"></div>
</div>

<!--
	TODO: Mathe I, II, III, Statistics I, II, depending on where you are, to lower the amount of it at once
-->

<div id="contents" style="display: none">
<?php
	incl("From Big Bang to ChatGPT: Beyond the Black Box", "intro");
	foreach (parse_course_metadata() as $part => $modules) {
		foreach ($modules as $module) {
			incl($module['title'], $module['slug']);
		}
	}
 ?>
</div>
</body>
</html>
