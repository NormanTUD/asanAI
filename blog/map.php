<?php include_once("functions.php"); ?>
<!--
COURSE_METADATA:
title: The Atlas
description: Every person, place, institution, author and event of this course as a living globe — zoom out from Earth, past the Moon and the solar system, to the Big Bang.
icon: &#128500;
part: 6
order: 13
color: sky
topics: history, philosophy, society
-->

<div class="md">
This is the map of everything. Every person, place, institution, artifact, event and cited author that appears anywhere in this course is a dot on this globe. The threads between them show who influenced whom, who traveled where, and which signals crossed which borders — and the time slider lets you watch the web of ideas grow, year by year.

**How to use it:** drag to look around, scroll (or pinch) to zoom, hover for a name, click for the full story with links back to the Chautauqua pages that mention it. When the whole planet feels small, keep zooming out — or press **Cosmic journey** and let the camera fly.
</div>

<style>
/* the one sanctioned full-width exception on this page: the Atlas
   stage spans the viewport (still in the normal vertical flow). */
.lg-widescroll.lg-widescroll--center { margin-left: calc(50% - 50vw); }
#atlas-stage {
	display: flex;
	width: 100%;
	height: clamp(520px, 78vh, 920px);
	min-height: 800px;
	border-radius: 14px;
	overflow: hidden;
	background: #05070d;
	--atlas-card: rgba(13,20,36,.86);
	--atlas-card-solid: #0d1424;
	--atlas-line: rgba(120,145,210,.16);
	--atlas-line-strong: rgba(150,170,230,.4);
	--atlas-ink: #e9eeff;
	--atlas-ink-soft: #aab6d8;
	--atlas-ink-mute: #6b7aa8;
	--atlas-accent: #8ab4ff;
	--atlas-shadow: 0 20px 60px rgba(0,0,0,.55);
}
html:not(.dark) #atlas-stage {
	--atlas-card: rgba(255,255,255,.92);
	--atlas-card-solid: #ffffff;
	--atlas-line: rgba(30,50,90,.14);
	--atlas-line-strong: rgba(60,90,160,.35);
	--atlas-ink: #14213d;
	--atlas-ink-soft: #41527a;
	--atlas-ink-mute: #7484a8;
	--atlas-accent: #2f62d9;
	--atlas-shadow: 0 20px 50px rgba(40,60,120,.18);
}
#atlas-stage * { box-sizing: border-box; }

/* ── left sidebar (never overlaps the globe) ── */
#atlas-side {
	flex: 0 0 300px;
	width: 300px;
	overflow-y: auto;
	border-right: 1px solid var(--atlas-line);
	background: var(--atlas-card);
	backdrop-filter: blur(12px);
	padding: 14px;
	color: var(--atlas-ink);
}
#atlas-side h3 {
	margin: 0 0 8px; font-size: .66rem; letter-spacing: .16em;
	text-transform: uppercase; color: var(--atlas-ink-mute); font-weight: 700;
}
#atlas-side .sect { margin-bottom: 16px; }
.atlas-search {
	width: 100%; background: var(--atlas-card-solid); color: var(--atlas-ink);
	border: 1px solid var(--atlas-line); border-radius: 10px;
	padding: 9px 11px; font-size: .85rem; outline: none;
}
.atlas-search:focus { border-color: var(--atlas-line-strong); }
.atlas-results {
	margin-top: 6px; max-height: 240px; overflow-y: auto;
	border: 1px solid var(--atlas-line); border-radius: 10px; background: var(--atlas-card-solid);
	display: none;
}
.atlas-results.open { display: block; }
.atlas-res {
	padding: 7px 10px; font-size: .8rem; cursor: pointer;
	border-bottom: 1px solid var(--atlas-line);
	display: flex; align-items: center; gap: 8px;
	color: var(--atlas-ink);
}
.atlas-res:last-child { border-bottom: none; }
.atlas-res:hover { background: rgba(138,180,255,.08); }
.atlas-res .sw { width: 8px; height: 8px; border-radius: 50%; flex: 0 0 auto; }
.atlas-res .rt { color: var(--atlas-ink-mute); font-size: .68rem; margin-left: auto; white-space: nowrap; }
.atlas-check {
	display: flex; align-items: center; gap: 8px;
	font-size: .8rem; color: var(--atlas-ink-soft); padding: 3px 0; cursor: pointer;
}
.atlas-check input { accent-color: var(--atlas-accent); }
.atlas-check .sw { width: 9px; height: 9px; border-radius: 50%; flex: 0 0 auto; }
.atlas-count { font-size: .72rem; color: var(--atlas-ink-mute); margin-top: 6px; }

.atlas-time { width: 100%; accent-color: var(--atlas-accent); }
.atlas-year {
	font-size: 1.05rem; font-weight: 700; letter-spacing: .02em;
	font-variant-numeric: tabular-nums; color: var(--atlas-ink);
}
.atlas-year small { font-size: .66rem; color: var(--atlas-ink-mute); font-weight: 500; display: block; letter-spacing: .1em; text-transform: uppercase; }

/* ── canvas area (globe is centered in THIS box) ── */
#atlas-canvas-wrap { position: relative; flex: 1 1 auto; min-width: 0; }
#atlas-canvas { position: absolute; inset: 0; display: block; cursor: grab; }
#atlas-canvas.dragging { cursor: grabbing; }

.atlas-top {
	position: absolute; top: 0; left: 0; right: 0; z-index: 20;
	display: flex; align-items: center; gap: 12px;
	padding: 10px 14px;
	background: linear-gradient(180deg, var(--atlas-card) 0%, rgba(0,0,0,0) 100%);
	pointer-events: none;
}
.atlas-top > * { pointer-events: auto; }
.atlas-title { font-size: .95rem; font-weight: 700; letter-spacing: .01em; color: var(--atlas-ink); }
.atlas-title small { display: block; font-size: .66rem; font-weight: 500; color: var(--atlas-ink-mute); letter-spacing: .14em; text-transform: uppercase; }
.atlas-spacer { flex: 1; }
.atlas-btn {
	background: var(--atlas-card); color: var(--atlas-ink-soft);
	border: 1px solid var(--atlas-line); border-radius: 10px;
	padding: 7px 12px; font-size: .8rem; cursor: pointer;
	backdrop-filter: blur(8px);
}
.atlas-btn:hover { color: var(--atlas-ink); border-color: var(--atlas-line-strong); }
.atlas-btn.primary { color: var(--atlas-ink); border-color: var(--atlas-line-strong); background: var(--atlas-card-solid); }

/* ── detail panel ── */
.atlas-detail {
	position: absolute; top: 58px; right: 12px; z-index: 15;
	width: 320px; max-height: calc(100% - 90px);
	overflow-y: auto;
	background: var(--atlas-card); border: 1px solid var(--atlas-line); border-radius: 14px;
	backdrop-filter: blur(12px); box-shadow: var(--atlas-shadow);
	padding: 16px; display: none;
}
.atlas-detail.open { display: block; }
.atlas-detail .d-close {
	position: absolute; top: 10px; right: 10px;
	background: none; border: none; color: var(--atlas-ink-mute);
	font-size: 1.1rem; cursor: pointer; line-height: 1;
}
.atlas-detail .d-close:hover { color: var(--atlas-ink); }
.atlas-detail h2 { margin: 0 0 4px; font-size: 1.15rem; letter-spacing: -.01em; padding-right: 20px; color: var(--atlas-ink); }
.atlas-detail .d-meta { font-size: .76rem; color: var(--atlas-ink-mute); margin-bottom: 10px; }
.atlas-detail .d-meta b { color: var(--atlas-ink-soft); font-weight: 600; }
.atlas-detail .d-blurb { font-size: .85rem; line-height: 1.55; color: var(--atlas-ink-soft); margin: 0 0 12px; }
.atlas-detail .d-label { font-size: .64rem; letter-spacing: .14em; text-transform: uppercase; color: var(--atlas-ink-mute); margin: 12px 0 6px; font-weight: 700; }
.atlas-detail .d-links { display: flex; flex-wrap: wrap; gap: 5px; }
.atlas-detail .d-link {
	font-size: .74rem; padding: 4px 9px; border-radius: 8px;
	background: var(--atlas-card-solid); border: 1px solid var(--atlas-line);
	color: var(--atlas-accent); text-decoration: none;
}
.atlas-detail .d-work { font-size: .78rem; line-height: 1.45; padding: 4px 0; border-bottom: 1px dashed var(--atlas-line); color: var(--atlas-ink-soft); }
.atlas-detail .d-work:last-child { border-bottom: none; }
.atlas-detail .d-work a { color: var(--atlas-accent); }
.atlas-detail .d-work .wy { color: var(--atlas-ink-mute); font-size: .7rem; }
.atlas-detail .d-none { font-size: .76rem; color: var(--atlas-ink-mute); font-style: italic; }
.atlas-detail .d-threadbtn { margin-top: 12px; width: 100%; }
.type-chip {
	display: inline-block; font-size: .64rem; font-weight: 700; letter-spacing: .1em;
	text-transform: uppercase; padding: 3px 8px; border-radius: 999px;
	border: 1px solid currentColor; margin-bottom: 8px;
}

/* ── tooltip ── */
.atlas-tip {
	position: fixed; z-index: 30; pointer-events: none;
	background: var(--atlas-card-solid); border: 1px solid var(--atlas-line-strong);
	border-radius: 9px; padding: 7px 10px; font-size: .76rem; color: var(--atlas-ink);
	box-shadow: var(--atlas-shadow); display: none; max-width: 260px;
}
.atlas-tip .t-name { font-weight: 700; }
.atlas-tip .t-sub { color: var(--atlas-ink-mute); font-size: .68rem; margin-top: 2px; }

/* ── journey (tour) UI ── */
.atlas-tour {
	position: absolute; left: 50%; bottom: 18px; transform: translateX(-50%);
	z-index: 18; width: min(620px, calc(100% - 32px));
	display: none;
}
.atlas-tour.open { display: block; }
.atlas-tour .tour-card {
	background: var(--atlas-card); border: 1px solid var(--atlas-line);
	border-radius: 16px 16px 0 0; padding: 14px 20px 16px;
	backdrop-filter: blur(14px); box-shadow: var(--atlas-shadow);
	text-align: center;
}
.atlas-tour .cap-era { font-size: .64rem; letter-spacing: .22em; text-transform: uppercase; color: var(--atlas-accent); font-weight: 700; }
.atlas-tour .cap-text { font-size: .9rem; line-height: 1.55; margin-top: 6px; color: var(--atlas-ink); }
.atlas-tour .cap-text a { color: var(--atlas-accent); text-decoration: underline; text-underline-offset: 2px; }
.atlas-tour .tour-img {
	display: block; margin: 10px auto 0;
	width: 210px; max-width: 62%; height: 120px;
	object-fit: cover; border-radius: 10px;
	border: 1px solid var(--atlas-line); box-shadow: var(--atlas-shadow);
}
.atlas-tour .tour-bar {
	display: flex; align-items: center; gap: 10px;
	background: var(--atlas-card-solid); border: 1px solid var(--atlas-line);
	border-top: none; border-radius: 0 0 16px 16px;
	padding: 10px 12px;
}
.tour-dots { display: flex; gap: 5px; align-items: center; }
.tour-dot {
	width: 8px; height: 8px; border-radius: 50%;
	background: var(--atlas-line-strong); border: none; padding: 0;
	cursor: pointer;
}
	.tour-dot.on { background: var(--atlas-accent); transform: scale(1.35); }
	.tour-dot:hover { background: var(--atlas-ink); transform: scale(1.5); }
	.tour-dot-tip {
		position: fixed; z-index: 60; transform: translate(-50%, calc(-100% - 8px));
		background: var(--atlas-card-solid); border: 1px solid var(--atlas-line-strong);
		color: var(--atlas-ink); font-size: .72rem; font-weight: 600;
		padding: 5px 9px; border-radius: 8px; white-space: nowrap;
		pointer-events: none; box-shadow: 0 4px 14px rgba(0,0,0,.25);
	}
.tour-timer {
	flex: 1; height: 4px; border-radius: 999px;
	background: var(--atlas-line); overflow: hidden;
}
.tour-timer-fill {
	height: 100%; width: 0%;
	background: var(--atlas-accent); border-radius: 999px;
}

/* ── loader ── */
.atlas-loader {
	position: absolute; inset: 0; z-index: 50;
	display: flex; flex-direction: column; align-items: center; justify-content: center;
	gap: 14px; background: #05070d;
	transition: opacity .6s ease;
}
.atlas-loader.hide { opacity: 0; pointer-events: none; }
.atlas-loader .spin {
	width: 34px; height: 34px; border-radius: 50%;
	border: 2px solid var(--atlas-line); border-top-color: var(--atlas-accent);
	animation: atlasSpin .9s linear infinite;
}
@keyframes atlasSpin { to { transform: rotate(360deg); } }
.atlas-loader p { font-size: .8rem; color: var(--atlas-ink-mute); letter-spacing: .06em; }

.atlas-easter {
	position: absolute; left: 50%; top: 64px; transform: translateX(-50%);
	max-width: 440px; padding: 10px 14px; border-radius: 10px;
	background: var(--atlas-card-solid); border: 1px solid var(--atlas-line-strong);
	color: var(--atlas-ink); font-size: .8rem; line-height: 1.45; text-align: center;
	display: none; z-index: 30; pointer-events: none;
}
	.atlas-easter-close {
		position: absolute; top: 2px; right: 5px;
		background: none; border: none; cursor: pointer; pointer-events: auto;
		color: var(--atlas-ink-mute); font-size: 1.1rem; line-height: 1; padding: 2px 4px;
	}
	.atlas-easter-close:hover { color: var(--atlas-ink); }

@media (max-width: 860px) {
	#atlas-stage { flex-direction: column; height: auto; }
	#atlas-side { flex: 0 0 auto; width: 100%; max-height: 36vh; border-right: none; border-bottom: 1px solid var(--atlas-line); }
	#atlas-canvas-wrap { height: 62vh; }
	.atlas-detail { width: calc(100% - 24px); right: 12px; left: 12px; max-height: 46%; }
}
</style>

<div class="lg-widescroll lg-widescroll--center">
<div id="atlas-stage">
	<aside id="atlas-side">
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
		<div class="sect" style="margin-bottom:0">
			<div class="atlas-count" id="atlas-count"></div>
		</div>
	</aside>

	<div id="atlas-canvas-wrap">
		<canvas id="atlas-canvas" aria-label="Interactive atlas of the history of AI"></canvas>

		<div class="atlas-top">
			<div class="atlas-title">The Atlas<small>From Big Bang to ChatGPT</small></div>
			<div class="atlas-spacer"></div>
			<button class="atlas-btn primary" id="atlas-journey" type="button">&#9656; Cosmic journey</button>
			<button class="atlas-btn" id="atlas-reset" type="button" title="Reset to Earth view">&#8982;</button>
		</div>

		<div class="atlas-detail" id="atlas-detail"></div>
		<div class="atlas-tip" id="atlas-tip"></div>

		<div class="atlas-tour" id="atlas-tour">
			<div class="tour-card">
				<div class="cap-era" id="tour-era"></div>
				<img class="tour-img" id="tour-img" alt="" style="display:none">
				<div class="cap-text" id="tour-text"></div>
			</div>
			<div class="tour-bar">
				<button class="atlas-btn" id="tour-earth" type="button" title="Back to Earth">&#8617; Earth</button>
				<button class="atlas-btn" id="tour-prev" type="button" title="Previous stop">&larr;</button>
				<div class="tour-dots" id="tour-dots"></div>
				<div class="tour-timer" aria-hidden="true"><div class="tour-timer-fill" id="tour-timer-fill"></div></div>
				<button class="atlas-btn primary" id="tour-next" type="button">Next &rarr;</button>
				<button class="atlas-btn" id="tour-close" type="button" title="Exit journey">&times;</button>
			</div>
		</div>
		<div class="tour-dot-tip" id="tour-dot-tip" role="tooltip" hidden></div>

		<div class="atlas-loader" id="atlas-loader">
			<div class="spin" aria-hidden="true"></div>
			<p>Charting the history of AI…</p>
		</div>
		<div class="atlas-easter" id="atlas-easter">
			<button class="atlas-easter-close" id="atlas-easter-close" type="button" aria-label="Close">&times;</button>
			<b>ASPARAGUS</b> &mdash; a blink-and-you'll-miss-it gag from <b>SB-129</b>, a <i>SpongeBob SquarePants</i> time-travel episode: as Squidward's time machine powers down, the word flashes on its screen.
		</div>
	</div>
</div>
</div>

<div class="md" style="margin-top:14px">
*Photographs in the deep-space view:* the cosmic foam — Volker Springel / Max-Planck-Institute for Astrophysics, CC BY-SA 4.0 ([file](https://commons.wikimedia.org/wiki/File:Cosmic_web.jpg)), from \cite[the MPA's movies of large-scale structure]{cosmic_web_foam_image}; the CMB sky — NASA/WMAP, public domain ([file](https://commons.wikimedia.org/wiki/File:WMAP_2010.png)).

*The transformer figure in the journey:* Figure 1 (the encoder–decoder architecture) from \cite[Vaswani et al., 2017]{transformer_attention_figure} — Ashish Vaswani and colleagues, Google, CC BY-SA 4.0 ([file](https://commons.wikimedia.org/wiki/File:Attention_Is_All_You_Need_-_Encoder-decoder_Architecture.png)).

*Starfield backdrop:* ESO's all-sky panorama of the Milky Way, \cite[ESO, 2009]{starfield_eso_image} — ESO / S. Brunier, CC BY 4.0 ([file](https://commons.wikimedia.org/wiki/File:ESO_-_Milky_Way.jpg)).

*Planet surfaces in the solar-system view:* equirectangular texture maps from \cite[Solar System Scope]{solsys_planet_textures} — Solar System Scope (based on NASA imagery), CC BY 4.0.

*Earth and Moon surfaces (the main globe):* equirectangular maps from \cite[Solar System Scope]{earth_moon_cc_textures} — Solar System Scope (based on NASA imagery), CC BY 4.0.
</div>
