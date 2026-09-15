/* ════════════════════════════════════════════════════════════
   ORGANIC NETWORK — Slow, fluid drift behind the hero.
   Barely-visible decoration that lives entirely inside
   .course-hero. Self-contained: no-ops if no canvas is found.

   Stability contract — the animation must never "change what it
   does" across scroll round-trips:
   • The constellation is seeded exactly ONCE (the first time the
     hero has a real size). Any later size change RESCALES the
     existing nodes proportionally and tops up / trims the count —
     it never re-randomises, so the network keeps its basic
     structure through resizes and font/layout shifts.
   • The RAF loop never stops. While the hero is scrolled past the
     fold the expensive canvas drawing is skipped (the last painted
     frame stays on the canvas so the CSS opacity fade has content
     to fade), but the simulation keeps ticking on a dt-clamped
     clock — so whenever the hero re-enters the viewport the drift
     is perfectly continuous: same nodes, same links, same motion.
   ════════════════════════════════════════════════════════════ */
(function () {
	'use strict';

	const canvas = document.querySelector('.course-hero .organic-network');
	if (!canvas) return;

	const ctx = canvas.getContext('2d', { alpha: true });
	if (!ctx) return;

	const reduceMotion = window.matchMedia &&
		window.matchMedia('(prefers-reduced-motion: reduce)').matches;

	// Tunables — small, slow, quiet.
	const TARGET_COUNT  = 36;     // upper bound on node count
	const MIN_COUNT     = 16;     // lower bound for tiny hero areas
	const DENSITY_DIVIS = 3200;   // area / this = node count (capped)
	const MAX_LINK_PX   = 170;    // max edge length to consider drawing
	const LINK_ALPHA    = 0.55;   // peak line opacity at distance = 0
	const NODE_ALPHA    = 0.85;   // peak node opacity at peak pulse
	const SPEED         = 0.045;  // base drift speed (px / frame @ 60fps)
	const WOBBLE        = 0.035;  // sinusoidal perturbation amplitude
	const BASE_FRAME_MS = 1000 / 60;
	const MAX_DT_MS     = 50;     // frame-delta clamp (tab switches, jank)
	const REAL_SIZE_MIN = 24;     // below this the hero is "unsized"
	                              // (#contents is display:none at boot)

	// Theme-aware stroke colour (rgb only — alpha is composed per-pixel).
	// Light = --mn-accent (#6366f1). Dark = a lighter indigo readable on #0f172a.
	const COLOR_LIGHT = [99, 102, 241];
	const COLOR_DARK  = [165, 180, 252];

	let hero = null;
	let w = 0, h = 0, dpr = 1;
	let nodes = [];
	let rafId = null;
	let lastT = null;
	let hasRealSize = false;
	let isPast = false;
	let initialized = false;

	function readTheme() {
		return document.documentElement.classList.contains('dark')
			? COLOR_DARK : COLOR_LIGHT;
	}

	function makeNode() {
		return {
			x:      Math.random() * w,
			y:      Math.random() * h,
			angle:  Math.random() * Math.PI * 2,
			phase:  Math.random() * Math.PI * 2,
			phaseY: Math.random() * Math.PI * 2,
			r:      1.4 + Math.random() * 1.6,
			speed:  SPEED * (0.6 + Math.random() * 0.9),
		};
	}

	function targetCount() {
		return Math.max(
			MIN_COUNT,
			Math.min(TARGET_COUNT, Math.round((w * h) / DENSITY_DIVIS))
		);
	}

	// One-time creation of the constellation.
	function seed() {
		nodes = [];
		const N = targetCount();
		for (let i = 0; i < N; i++) nodes.push(makeNode());
	}

	// Structure-preserving resize: existing nodes keep their relative
	// layout, only the count follows the new area.
	function rescaleNodes(oldW, oldH) {
		const sx = w / oldW;
		const sy = h / oldH;
		for (let i = 0; i < nodes.length; i++) {
			nodes[i].x *= sx;
			nodes[i].y *= sy;
		}
		const N = targetCount();
		while (nodes.length < N) nodes.push(makeNode());
		if (nodes.length > N) nodes.length = N;
	}

	// Applies a fresh measurement of the hero box. Driven by the
	// per-frame loop — polling each frame is the most robust way to
	// catch the #contents display:none → block flip without depending
	// on ResizeObserver firing reliably across all browsers.
	function applySize(rect) {
		const nw = Math.max(rect.width, 1);
		const nh = Math.max(rect.height, 1);
		if (nw === w && nh === h) return;
		const hadSize = hasRealSize;
		const oldW = w || 1;
		const oldH = h || 1;
		w = nw;
		h = nh;
		dpr = Math.min(window.devicePixelRatio || 1, 2);
		canvas.width  = Math.round(w * dpr);
		canvas.height = Math.round(h * dpr);
		canvas.style.width  = w + 'px';
		canvas.style.height = h + 'px';
		ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
		hasRealSize = w >= REAL_SIZE_MIN && h >= REAL_SIZE_MIN;
		if (hadSize) rescaleNodes(oldW, oldH);
		else seed();
	}

	function update(t, dt) {
		if (!nodes.length) return;
		// dt-scaled so drift speed is identical on 60 Hz and 120 Hz
		// screens, and a stalled frame (tab switch, jank) can never
		// teleport a node across the hero.
		const k = dt / BASE_FRAME_MS;
		for (let i = 0; i < nodes.length; i++) {
			const n = nodes[i];
			n.angle += Math.sin(t / 9000 + n.phase) * 0.0015 * k;
			const dx = Math.cos(n.angle) * n.speed + Math.sin(t / 4200 + n.phase)  * WOBBLE;
			const dy = Math.sin(n.angle) * n.speed + Math.cos(t / 5100 + n.phaseY) * WOBBLE;
			n.x += dx * k;
			n.y += dy * k;
			// Soft bounce off the hero edges so the network stays inside
			// the parent's box — no clipping at top/bottom by overflow:hidden.
			if (n.x < n.r) { n.x = n.r; n.angle = Math.PI - n.angle; }
			else if (n.x > w - n.r) { n.x = w - n.r; n.angle = Math.PI - n.angle; }
			if (n.y < n.r) { n.y = n.r; n.angle = -n.angle; }
			else if (n.y > h - n.r) { n.y = h - n.r; n.angle = -n.angle; }
		}
	}

	function draw(t) {
		const rgb = readTheme();
		ctx.clearRect(0, 0, w, h);

		// Edges first, nodes drawn on top.
		ctx.lineWidth = 0.6;
		const maxSq = MAX_LINK_PX * MAX_LINK_PX;
		for (let i = 0; i < nodes.length; i++) {
			const a = nodes[i];
			for (let j = i + 1; j < nodes.length; j++) {
				const b = nodes[j];
				const dx = a.x - b.x;
				const dy = a.y - b.y;
				const d2 = dx * dx + dy * dy;
				if (d2 < maxSq) {
					const d = Math.sqrt(d2);
					const alpha = (1 - d / MAX_LINK_PX) * LINK_ALPHA;
					ctx.strokeStyle = `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, ${alpha})`;
					ctx.beginPath();
					ctx.moveTo(a.x, a.y);
					ctx.lineTo(b.x, b.y);
					ctx.stroke();
				}
			}
		}

		for (let i = 0; i < nodes.length; i++) {
			const n = nodes[i];
			const pulse = 0.5 + 0.5 * Math.sin(t / 1800 + n.phase);
			const alpha = NODE_ALPHA * (0.45 + 0.55 * pulse);
			ctx.fillStyle = `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, ${alpha})`;
			ctx.beginPath();
			ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
			ctx.fill();
		}
	}

	// One tick: measure, toggle the CSS fade class, advance the
	// simulation, and paint only while the hero is at least partially
	// on screen. Fully off screen, the last painted frame is kept so
	// .is-scrolled-past's opacity fade transitions real content.
	function frame(t) {
		rafId = requestAnimationFrame(frame);

		if (!hero) hero = canvas.parentElement;
		const rect = hero.getBoundingClientRect();
		applySize(rect);

		const past = rect.bottom < 0 || rect.top > window.innerHeight;
		if (past !== isPast) {
			isPast = past;
			hero.classList.toggle('is-scrolled-past', past);
		}

		const dt = lastT === null
			? BASE_FRAME_MS
			: Math.min(MAX_DT_MS, Math.max(0.1, t - lastT));
		lastT = t;

		if (!hasRealSize) return;

		update(t, dt);
		if (!past) draw(t);
	}

	// Reduced-motion users get a single static frame, re-painted
	// whenever the layout state can have changed.
	function renderStatic() {
		if (!hero) hero = canvas.parentElement;
		const rect = hero.getBoundingClientRect();
		applySize(rect);
		if (hasRealSize) draw(0);
	}

	function init() {
		if (initialized) return;
		initialized = true;
		hero = canvas.parentElement;

		if (reduceMotion) {
			renderStatic();
			window.addEventListener('resize', renderStatic);
			window.addEventListener('load', renderStatic);
			window.addEventListener('blogPostLoadComplete', renderStatic);
		} else {
			rafId = requestAnimationFrame(frame);
		}
	}

	if (document.readyState === 'loading') {
		document.addEventListener('DOMContentLoaded', init);
	} else {
		init();
	}
})();
