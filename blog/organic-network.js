/* ════════════════════════════════════════════════════════════
   ORGANIC NETWORK — Slow, fluid drift behind the hero.
   Barely-visible decoration that lives entirely inside
   .course-hero. Self-contained: no-ops if no canvas is found.
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

	// Theme-aware stroke colour (rgb only — alpha is composed per-pixel).
	// Light = --mn-accent (#6366f1). Dark = a lighter indigo readable on #0f172a.
	const COLOR_LIGHT = [99, 102, 241];
	const COLOR_DARK  = [165, 180, 252];

	let hero, w = 0, h = 0, dpr = 1;
	let nodes = [];
	let rafId = null;

	function readTheme() {
		return document.documentElement.classList.contains('dark')
			? COLOR_DARK : COLOR_LIGHT;
	}

	function sizeToHero() {
		if (!hero) hero = canvas.parentElement;
		const rect = hero.getBoundingClientRect();
		const nw = Math.max(rect.width,  1);
		const nh = Math.max(rect.height, 1);
		if (nw === w && nh === h) return false;
		w = nw;
		h = nh;
		dpr = Math.min(window.devicePixelRatio || 1, 2);
		canvas.width  = Math.round(w * dpr);
		canvas.height = Math.round(h * dpr);
		canvas.style.width  = w + 'px';
		canvas.style.height = h + 'px';
		ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
		return true;
	}

	function seed() {
		const area = w * h;
		const N = Math.max(
			MIN_COUNT,
			Math.min(TARGET_COUNT, Math.round(area / DENSITY_DIVIS))
		);
		nodes = [];
		for (let i = 0; i < N; i++) {
			nodes.push({
				x:      Math.random() * w,
				y:      Math.random() * h,
				angle:  Math.random() * Math.PI * 2,
				phase:  Math.random() * Math.PI * 2,
				phaseY: Math.random() * Math.PI * 2,
				r:      1.1 + Math.random() * 1.3,
				speed:  SPEED * (0.6 + Math.random() * 0.9),
			});
		}
	}

	function frame(t) {
		// Detect size changes inline — the canvas lives inside a parent
		// (#contents) that may be display:none at first, then becomes
		// visible after revealContent(). Polling each frame is the most
		// robust way to catch that flip without depending on
		// ResizeObserver firing reliably across all browsers.
		if (sizeToHero() && nodes.length > 0) seed();

		const rgb = readTheme();
		ctx.clearRect(0, 0, w, h);

		// Update positions — slow drift + tiny sinusoidal perturbation.
		// Each node has its own phases so neighbours never move in lockstep.
		for (let i = 0; i < nodes.length; i++) {
			const n = nodes[i];
			n.angle += Math.sin(t / 9000 + n.phase) * 0.0015;
			const dx = Math.cos(n.angle) * n.speed + Math.sin(t / 4200 + n.phase)  * WOBBLE;
			const dy = Math.sin(n.angle) * n.speed + Math.cos(t / 5100 + n.phaseY) * WOBBLE;
			n.x += dx;
			n.y += dy;
			// Soft wrap so the network feels infinite, not contained.
			if (n.x < -20) n.x = w + 20;
			else if (n.x > w + 20) n.x = -20;
			if (n.y < -20) n.y = h + 20;
			else if (n.y > h + 20) n.y = -20;
		}

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

		rafId = requestAnimationFrame(frame);
	}

	function start() {
		if (rafId !== null || reduceMotion) return;
		rafId = requestAnimationFrame(frame);
	}
	function stop() {
		if (rafId !== null) { cancelAnimationFrame(rafId); rafId = null; }
		ctx.clearRect(0, 0, w, h);
	}

	function init() {
		hero = canvas.parentElement;
		sizeToHero();
		seed();

		if (reduceMotion) {
			frame(0);
		} else {
			start();
		}

		// Backstop: catch any size flip ResizeObserver misses.
		if (window.ResizeObserver) {
			const ro = new ResizeObserver(() => {
				if (sizeToHero()) seed();
			});
			ro.observe(hero);
		}
		window.addEventListener('resize', () => {
			if (sizeToHero()) seed();
		});

		// Final backstop: when the rest of the page finishes loading,
		// #contents flips from display:none to display:block. Make sure
		// we re-measure exactly at that moment, even if neither the
		// observer nor the per-frame check caught it in time.
		window.addEventListener('blogPostLoadComplete', () => {
			if (sizeToHero()) seed();
			if (!reduceMotion) start();
		});

		// Pause when hero is past the fold — saves cycles on long pages.
		// Trigger only when the hero has actually scrolled above the
		// viewport, NOT just when its bottom is small relative to a tall
		// viewport (which would falsely flag the very first render).
		const checkScroll = () => {
			const rect = hero.getBoundingClientRect();
			const past = rect.bottom < 0 || rect.top > window.innerHeight;
			hero.classList.toggle('is-scrolled-past', past);
			if (past) stop();
			else start();
		};
		window.addEventListener('scroll', checkScroll, { passive: true });
		checkScroll();
	}

	if (document.readyState === 'loading') {
		document.addEventListener('DOMContentLoaded', init);
	} else {
		init();
	}
})();
