/* ════════════════════════════════════════════════════════════
   ORGANIC NETWORK — Slow, fluid drift of a node & edge graph.
   Driven by a small factory (window.OrganicNetwork.create) that
   can be attached to any canvas. The page hero keeps its original
   behaviour: a barely-visible decoration inside .course-hero that
   self-fades when scrolled past.

   Stability contract (hero) — the animation must never "change what
   it does" across scroll round-trips:
   • The constellation is seeded exactly ONCE (the first time the
     hero has a real size). Any later size change RESCALES the
     existing nodes proportionally and tops up / trims the count —
     it never re-randomises, so the network keeps its basic
     structure through resizes and font/layout shifts.
   • The RAF loop never stops. While the hero is scrolled past the
     fold the expensive canvas drawing is skipped (the last painted
     frame stays on the canvas so the CSS opacity fade has content
     to fade), but the simulation keeps ticking — so whenever the
     hero re-enters the viewport the drift is perfectly continuous:
     same nodes, same links, same motion.

   Smoothness contract:
   • Heading is a pure function of wall-clock time (a slow sway
     around a fixed base angle — analytically the same wander the
     old per-frame angle integration produced), so a stalled frame
     can never desynchronise direction from real time.
   • Position advances in fixed substeps of the real elapsed dt
     (each ≤ one 60 Hz frame, dt clamped at 250 ms): a janky frame
     fast-forwards the drift along its true path instead of freezing
     (old 50 ms clamp) or teleporting (uncapped single step).
   • Box edges use a continuous cubic steering force, not a hard
     reflection — nodes curve away from the walls and never
     visibly bounce or stick.
   • Box measurement is throttled (a getBoundingClientRect every
     frame forces a synchronous layout while the page is loading)
     and the theme colour is cached through __MN_DARK.onChange.
   ════════════════════════════════════════════════════════════ */
(function () {
	'use strict';

	const BASE_FRAME_MS = 1000 / 60;
	const MAX_DT_MS = 250;
	const MAX_SUBSTEPS = 16;
	const MEASURE_INTERVAL_MS = 250;

	function createNetwork(canvas, opts) {
		const o = Object.assign({
			targetCount: 36,
			minCount: 16,
			densityDivis: 3200,
			maxLinkPx: 170,
			linkAlpha: 0.55,
			nodeAlpha: 0.85,
			speed: 0.045,
			wobble: 0.035,
			realSizeMin: 24,
			sizeFromParent: true,
			scrollFade: false,
			scrollFadeClass: 'is-scrolled-past',
			color: null,        // array [r,g,b] or function() -> [r,g,b]
			onBackground: null  // (ctx, t, w, h) => void, painted after clear
		}, opts || {});

		const ctx = canvas.getContext('2d', { alpha: true });
		if (!ctx) return null;

		const reduceMotion = window.matchMedia &&
			window.matchMedia('(prefers-reduced-motion: reduce)').matches;

		let host = canvas.parentElement;
		let w = 0, h = 0, dpr = 1;
		let nodes = [];
		let rafId = null;
		let lastT = null;
		let lastMeasure = -Infinity;
		let rect = null;
		let hasRealSize = false;
		let isPast = false;
		let initialized = false;
		let destroyed = false;
		let colorCache = null;

		if (window.__MN_DARK && typeof window.__MN_DARK.onChange === 'function') {
			window.__MN_DARK.onChange(function () { colorCache = null; });
		}

		function readColor() {
			if (!colorCache) {
				const c = typeof o.color === 'function' ? o.color() : o.color;
				colorCache = c || [120, 130, 160];
			}
			return colorCache;
		}

		function makeNode() {
			return {
				x: Math.random() * w,
				y: Math.random() * h,
				baseAngle: Math.random() * Math.PI * 2,
				// Sway reproduces the old integrated angle drift
				// (0.0015·sin(t/9000+φ) per 60 Hz frame integrates to
				// ±0.81 rad around the base heading) as a closed form.
				swayAmp: 0.5 + Math.random() * 0.6,
				swayPeriod: 7000 + Math.random() * 8000,
				phase: Math.random() * Math.PI * 2,
				phaseY: Math.random() * Math.PI * 2,
				r: 1.4 + Math.random() * 1.6,
				speed: o.speed * (0.6 + Math.random() * 0.9),
			};
		}

		function targetCount() {
			return Math.max(
				o.minCount,
				Math.min(o.targetCount, Math.round((w * h) / o.densityDivis))
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

		// Applies a fresh measurement of the box.
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
			hasRealSize = w >= o.realSizeMin && h >= o.realSizeMin;
			if (hadSize) rescaleNodes(oldW, oldH);
			else seed();
		}

		function measure() {
			return (o.sizeFromParent ? (host || canvas) : canvas).getBoundingClientRect();
		}

		// One substep of the drift, evaluated at simulation time ts and
		// advancing k base frames (k ≤ 1).
		function step(ts, k) {
			// margin ≤ w/4 and ≤ h/4 so the left/right (top/bottom)
			// steering zones never overlap.
			const margin = Math.min(70, Math.max(28, Math.min(w, h) * 0.1), w * 0.25, h * 0.25);
			// Cubic edge steering, saturating at a push that always
			// outruns the fastest possible outward velocity of any node.
			const pushMax = o.speed * 1.5 + o.wobble + 0.01;
			for (let i = 0; i < nodes.length; i++) {
				const n = nodes[i];
				const a = n.baseAngle + n.swayAmp * Math.cos(ts / n.swayPeriod + n.phase);
				let vx = Math.cos(a) * n.speed + Math.sin(ts / 4200 + n.phase) * o.wobble;
				let vy = Math.sin(a) * n.speed + Math.cos(ts / 5100 + n.phaseY) * o.wobble;

				let fx = 0, fy = 0;
				if (n.x < margin) fx = 1 - n.x / margin;
				else if (n.x > w - margin) fx = -(1 - (w - n.x) / margin);
				if (n.y < margin) fy = 1 - n.y / margin;
				else if (n.y > h - margin) fy = -(1 - (h - n.y) / margin);
				if (fx !== 0) vx += fx * fx * fx * pushMax;
				if (fy !== 0) vy += fy * fy * fy * pushMax;

				n.x += vx * k;
				n.y += vy * k;

				// Last-resort containment; the steering keeps this from
				// ever biting in practice.
				if (n.x < n.r) n.x = n.r;
				else if (n.x > w - n.r) n.x = w - n.r;
				if (n.y < n.r) n.y = n.r;
				else if (n.y > h - n.r) n.y = h - n.r;
			}
		}

		function update(t, dt) {
			if (!nodes.length) return;
			// Fixed substeps (≤ one 60 Hz frame each) keep the trajectory
			// identical on 60 Hz and 120 Hz screens, and let a stalled
			// frame catch up along the true path instead of freezing.
			const steps = Math.max(1, Math.min(MAX_SUBSTEPS, Math.ceil(dt / BASE_FRAME_MS)));
			const sub = dt / steps;
			for (let s = 1; s <= steps; s++) {
				step(t - dt + sub * s, sub / BASE_FRAME_MS);
			}
		}

		function draw(t) {
			const rgb = readColor();
			ctx.clearRect(0, 0, w, h);
			if (o.onBackground) o.onBackground(ctx, t, w, h);

			// Edges first, nodes drawn on top.
			ctx.lineWidth = 0.6;
			const maxSq = o.maxLinkPx * o.maxLinkPx;
			for (let i = 0; i < nodes.length; i++) {
				const a = nodes[i];
				for (let j = i + 1; j < nodes.length; j++) {
					const b = nodes[j];
					const dx = a.x - b.x;
					const dy = a.y - b.y;
					const d2 = dx * dx + dy * dy;
					if (d2 < maxSq) {
						const d = Math.sqrt(d2);
						const alpha = (1 - d / o.maxLinkPx) * o.linkAlpha;
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
				const alpha = o.nodeAlpha * (0.45 + 0.55 * pulse);
				ctx.fillStyle = `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, ${alpha})`;
				ctx.beginPath();
				ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
				ctx.fill();
			}
		}

		function frame(t) {
			if (destroyed) return;
			rafId = requestAnimationFrame(frame);

			if (!host) host = canvas.parentElement;

			// Throttled measurement: reading the box every frame forces a
			// synchronous layout while the page is still loading; 250 ms
			// is far below perception for a full-viewport box, and
			// viewport resizes are caught immediately by onResize.
			if (t - lastMeasure >= MEASURE_INTERVAL_MS) {
				lastMeasure = t;
				rect = measure();
				applySize(rect);
			}
			if (!rect) return;

			const past = rect.bottom < 0 || rect.top > window.innerHeight;
			if (o.scrollFade && past !== isPast) {
				isPast = past;
				host.classList.toggle(o.scrollFadeClass, past);
			}

			const dt = lastT === null
				? BASE_FRAME_MS
				: Math.min(MAX_DT_MS, Math.max(0.1, t - lastT));
			lastT = t;

			if (!hasRealSize) return;

			update(t, dt);
			if (!o.scrollFade || !past) draw(t);
		}

		// Reduced-motion users get a single static frame, re-painted
		// whenever the layout state can have changed.
		function renderStatic() {
			if (!host) host = canvas.parentElement;
			rect = measure();
			applySize(rect);
			if (hasRealSize) draw(0);
		}

		const onResize = function () {
			if (!destroyed) lastMeasure = -Infinity;
		};

		function destroy() {
			destroyed = true;
			if (rafId) { cancelAnimationFrame(rafId); rafId = null; }
			window.removeEventListener('resize', onResize);
		}

		function init() {
			if (initialized || destroyed) return;
			initialized = true;
			host = canvas.parentElement;

			if (reduceMotion) {
				renderStatic();
				window.addEventListener('resize', renderStatic);
				window.addEventListener('load', renderStatic);
				window.addEventListener('blogPostLoadComplete', renderStatic);
			} else {
				window.addEventListener('resize', onResize);
				rafId = requestAnimationFrame(frame);
			}
		}

		if (document.readyState === 'loading') {
			document.addEventListener('DOMContentLoaded', init);
		} else {
			init();
		}

		return { destroy: destroy };
	}

	window.OrganicNetwork = { create: createNetwork };

	// Page hero — the original, unchanged decoration. Deferred to DCL so
	// the hero canvas (emitted in the body) exists, even though this file
	// now loads from <head> as a base module.
	function heroInit() {
		const canvas = document.querySelector('.course-hero .organic-network');
		if (!canvas) return;
		createNetwork(canvas, {
			color: function () {
				return document.documentElement.classList.contains('dark')
					? [165, 180, 252] : [99, 102, 241];
			},
			scrollFade: true
		});
	}
	if (document.readyState === 'loading') {
		document.addEventListener('DOMContentLoaded', heroInit);
	} else {
		heroInit();
	}
})();
