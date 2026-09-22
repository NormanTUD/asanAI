<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta name="theme-color" content="#070b14">
<title>The Atlas — From Big Bang to ChatGPT</title>
<script>
(function() {
	function apply(theme) {
		var t = theme === 'light' ? 'light' : 'dark';
		document.documentElement.classList.toggle('light', t === 'light');
		var meta = document.querySelector('meta[name="theme-color"]');
		if (meta) meta.content = t === 'light' ? '#eef2f8' : '#070b14';
	}
	apply(document.cookie.indexOf('theme=light') !== -1 ? 'light' : 'dark');
	window.__atlasSetTheme = function(t) {
		document.cookie = 'theme=' + t + '; path=/; max-age=' + 60*60*24*365;
		apply(t);
		if (window.__atlasOnTheme) window.__atlasOnTheme(t);
	};
})();
</script>
<style>
* { box-sizing: border-box; }
:root {
	--bg0: #070b14;
	--card: rgba(13,20,36,.86);
	--card-solid: #0d1424;
	--line: rgba(120,145,210,.16);
	--line-strong: rgba(150,170,230,.4);
	--ink: #e9eeff;
	--ink-soft: #aab6d8;
	--ink-mute: #6b7aa8;
	--accent: #8ab4ff;
	--coral: #ff7a6b;
	--emerald: #34d399;
	--rose: #f472b6;
	--sky: #38bdf8;
	--amber: #fbbf24;
	--violet: #c084fc;
	--shadow: 0 20px 60px rgba(0,0,0,.55);
	--r: 14px;
}
html.light {
	--bg0: #eef2f8;
	--card: rgba(255,255,255,.92);
	--card-solid: #ffffff;
	--line: rgba(30,50,90,.14);
	--line-strong: rgba(60,90,160,.35);
	--ink: #14213d;
	--ink-soft: #41527a;
	--ink-mute: #7484a8;
	--accent: #2f62d9;
	--shadow: 0 20px 50px rgba(40,60,120,.18);
}
html, body { margin: 0; padding: 0; height: 100%; }
body {
	background: var(--bg0); color: var(--ink);
	font-family: ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
	-webkit-font-smoothing: antialiased;
	overflow: hidden;
}
a { color: var(--accent); text-decoration: none; }
a:hover { text-decoration: underline; }
button { font-family: inherit; }

#atlas-canvas { position: fixed; inset: 0; display: block; cursor: grab; }
#atlas-canvas.dragging { cursor: grabbing; }

/* ── top bar ── */
.atlas-top {
	position: fixed; top: 0; left: 0; right: 0; z-index: 20;
	display: flex; align-items: center; gap: 12px;
	padding: 10px 16px;
	background: linear-gradient(180deg, var(--card) 0%, rgba(0,0,0,0) 100%);
	pointer-events: none;
}
.atlas-top > * { pointer-events: auto; }
.atlas-title { font-size: .95rem; font-weight: 700; letter-spacing: .01em; }
.atlas-title small { display: block; font-size: .68rem; font-weight: 500; color: var(--ink-mute); letter-spacing: .14em; text-transform: uppercase; }
.atlas-spacer { flex: 1; }
.atlas-btn {
	background: var(--card); color: var(--ink-soft);
	border: 1px solid var(--line); border-radius: 10px;
	padding: 7px 12px; font-size: .8rem; cursor: pointer;
	backdrop-filter: blur(8px);
}
.atlas-btn:hover { color: var(--ink); border-color: var(--line-strong); }
.atlas-btn.primary { color: var(--ink); border-color: var(--line-strong); background: var(--card-solid); }

/* ── left panel ── */
.atlas-panel {
	position: fixed; top: 64px; left: 14px; z-index: 15;
	width: 292px; max-height: calc(100vh - 140px);
	overflow-y: auto;
	background: var(--card); border: 1px solid var(--line); border-radius: var(--r);
	backdrop-filter: blur(12px);
	box-shadow: var(--shadow);
	padding: 14px;
}
.atlas-panel h3 {
	margin: 0 0 8px; font-size: .66rem; letter-spacing: .16em;
	text-transform: uppercase; color: var(--ink-mute); font-weight: 700;
}
.atlas-panel .sect { margin-bottom: 16px; }
.atlas-search {
	width: 100%; background: var(--card-solid); color: var(--ink);
	border: 1px solid var(--line); border-radius: 10px;
	padding: 9px 11px; font-size: .85rem; outline: none;
}
.atlas-search:focus { border-color: var(--line-strong); }
.atlas-results {
	margin-top: 6px; max-height: 240px; overflow-y: auto;
	border: 1px solid var(--line); border-radius: 10px; background: var(--card-solid);
	display: none;
}
.atlas-results.open { display: block; }
.atlas-res {
	padding: 7px 10px; font-size: .8rem; cursor: pointer;
	border-bottom: 1px solid var(--line);
	display: flex; align-items: center; gap: 8px;
}
.atlas-res:last-child { border-bottom: none; }
.atlas-res:hover { background: rgba(138,180,255,.08); }
.atlas-res .sw { width: 8px; height: 8px; border-radius: 50%; flex: 0 0 auto; }
.atlas-res .rt { color: var(--ink-mute); font-size: .68rem; margin-left: auto; white-space: nowrap; }
.atlas-check {
	display: flex; align-items: center; gap: 8px;
	font-size: .8rem; color: var(--ink-soft); padding: 3px 0; cursor: pointer;
}
.atlas-check input { accent-color: var(--accent); }
.atlas-check .sw { width: 9px; height: 9px; border-radius: 50%; flex: 0 0 auto; }
.atlas-count { font-size: .72rem; color: var(--ink-mute); margin-top: 6px; }

/* time slider */
.atlas-time { width: 100%; accent-color: var(--accent); }
.atlas-year {
	font-size: 1.05rem; font-weight: 700; letter-spacing: .02em;
	font-variant-numeric: tabular-nums; color: var(--ink);
}
.atlas-year small { font-size: .66rem; color: var(--ink-mute); font-weight: 500; display: block; letter-spacing: .1em; text-transform: uppercase; }

/* ── detail panel ── */
.atlas-detail {
	position: fixed; top: 64px; right: 14px; z-index: 15;
	width: 330px; max-height: calc(100vh - 120px);
	overflow-y: auto;
	background: var(--card); border: 1px solid var(--line); border-radius: var(--r);
	backdrop-filter: blur(12px); box-shadow: var(--shadow);
	padding: 16px; display: none;
}
.atlas-detail.open { display: block; }
.atlas-detail .d-close {
	position: absolute; top: 10px; right: 10px;
	background: none; border: none; color: var(--ink-mute);
	font-size: 1.1rem; cursor: pointer; line-height: 1;
}
.atlas-detail .d-close:hover { color: var(--ink); }
.atlas-detail h2 { margin: 0 0 4px; font-size: 1.15rem; letter-spacing: -.01em; padding-right: 20px; }
.atlas-detail .d-meta { font-size: .76rem; color: var(--ink-mute); margin-bottom: 10px; }
.atlas-detail .d-meta b { color: var(--ink-soft); font-weight: 600; }
.atlas-detail .d-blurb { font-size: .85rem; line-height: 1.55; color: var(--ink-soft); margin: 0 0 12px; }
.atlas-detail .d-label { font-size: .64rem; letter-spacing: .14em; text-transform: uppercase; color: var(--ink-mute); margin: 12px 0 6px; font-weight: 700; }
.atlas-detail .d-links { display: flex; flex-wrap: wrap; gap: 5px; }
.atlas-detail .d-link {
	font-size: .74rem; padding: 4px 9px; border-radius: 8px;
	background: var(--card-solid); border: 1px solid var(--line);
}
.atlas-detail .d-work { font-size: .78rem; line-height: 1.45; padding: 4px 0; border-bottom: 1px dashed var(--line); }
.atlas-detail .d-work:last-child { border-bottom: none; }
.atlas-detail .d-work .wy { color: var(--ink-mute); font-size: .7rem; }
.atlas-detail .d-none { font-size: .76rem; color: var(--ink-mute); font-style: italic; }
.atlas-detail .d-threadbtn { margin-top: 12px; width: 100%; }
.type-chip {
	display: inline-block; font-size: .64rem; font-weight: 700; letter-spacing: .1em;
	text-transform: uppercase; padding: 3px 8px; border-radius: 999px;
	border: 1px solid currentColor; margin-bottom: 8px;
}

/* ── tooltip ── */
.atlas-tip {
	position: fixed; z-index: 30; pointer-events: none;
	background: var(--card-solid); border: 1px solid var(--line-strong);
	border-radius: 9px; padding: 7px 10px; font-size: .76rem;
	box-shadow: var(--shadow); display: none; max-width: 260px;
}
.atlas-tip .t-name { font-weight: 700; }
.atlas-tip .t-sub { color: var(--ink-mute); font-size: .68rem; margin-top: 2px; }

/* ── journey caption ── */
.atlas-caption {
	position: fixed; left: 50%; bottom: 86px; transform: translateX(-50%);
	z-index: 18; width: min(680px, calc(100vw - 40px));
	text-align: center; pointer-events: none;
	opacity: 0; transition: opacity .8s ease;
}
.atlas-caption.show { opacity: 1; }
.atlas-caption .cap-card {
	background: var(--card); border: 1px solid var(--line);
	border-radius: 16px; padding: 16px 22px; backdrop-filter: blur(14px);
	box-shadow: var(--shadow);
}
.atlas-caption .cap-era { font-size: .64rem; letter-spacing: .22em; text-transform: uppercase; color: var(--accent); font-weight: 700; }
.atlas-caption .cap-text { font-size: .95rem; line-height: 1.6; margin-top: 6px; color: var(--ink); }

/* ── loader ── */
.atlas-loader {
	position: fixed; inset: 0; z-index: 50;
	display: flex; flex-direction: column; align-items: center; justify-content: center;
	gap: 14px; background: var(--bg0);
	transition: opacity .6s ease;
}
.atlas-loader.hide { opacity: 0; pointer-events: none; }
.atlas-loader .spin {
	width: 34px; height: 34px; border-radius: 50%;
	border: 2px solid var(--line); border-top-color: var(--accent);
	animation: atlasSpin .9s linear infinite;
}
@keyframes atlasSpin { to { transform: rotate(360deg); } }
.atlas-loader p { font-size: .8rem; color: var(--ink-mute); letter-spacing: .06em; }

/* ── mobile ── */
@media (max-width: 860px) {
	.atlas-panel { width: calc(100vw - 28px); max-height: 42vh; top: auto; bottom: 64px; }
	.atlas-detail { width: calc(100vw - 28px); right: 14px; left: 14px; max-height: 46vh; }
	.atlas-caption { bottom: auto; top: 64px; }
}
</style>
</head>
<body>
<canvas id="atlas-canvas" aria-label="Interactive atlas of the history of AI"></canvas>

<div class="atlas-top">
	<a class="atlas-btn" href="index.php" title="Back to the course">&larr; Course</a>
	<div class="atlas-title">The Atlas<small>From Big Bang to ChatGPT</small></div>
	<div class="atlas-spacer"></div>
	<button class="atlas-btn primary" id="atlas-journey" type="button">&#9656; Cosmic journey</button>
	<button class="atlas-btn" id="atlas-reset" type="button" title="Reset to Earth view">&#8982; Earth</button>
	<button class="atlas-btn" id="atlas-theme" type="button" title="Toggle theme">&#9788;</button>
</div>

<div class="atlas-panel" id="atlas-panel">
	<div class="sect">
		<h3>Find</h3>
		<input class="atlas-search" id="atlas-search" type="text"
			placeholder="Search people, places, institutions…" autocomplete="off">
		<div class="atlas-results" id="atlas-results"></div>
	</div>
	<div class="sect" id="atlas-filters"></div>
	<div class="sect">
		<h3>Time</h3>
		<div class="atlas-year" id="atlas-year">2026<small>all time</small></div>
		<input class="atlas-time" id="atlas-time" type="range" min="-5000" max="2026" step="1" value="2026">
	</div>
	<div class="sect">
		<h3>Legend</h3>
		<div id="atlas-legend"></div>
		<div class="atlas-count" id="atlas-count"></div>
	</div>
</div>

<div class="atlas-detail" id="atlas-detail"></div>
<div class="atlas-tip" id="atlas-tip"></div>

<div class="atlas-caption" id="atlas-caption">
	<div class="cap-card">
		<div class="cap-era" id="cap-era"></div>
		<div class="cap-text" id="cap-text"></div>
	</div>
</div>

<div class="atlas-loader" id="atlas-loader">
	<div class="spin" aria-hidden="true"></div>
	<p>Charting the history of AI…</p>
</div>

<script src="three.min.js"></script>
<script src="map.js"></script>
</body>
</html>
