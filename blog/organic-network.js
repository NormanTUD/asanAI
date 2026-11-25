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
   • Position advances in fixed substeps of the real elapsed dt
     (each ≤ one 60 Hz frame, dt clamped at 250 ms): a janky frame
     fast-forwards the drift along its true path instead of freezing
     (old 50 ms clamp) or teleporting (uncapped single step).
   • Box edges use a curved, persistent deflection instead of a hard
      reflection: while inside the margin the wall's normal is blended
      into the heading (signed cube of proximity) and the result is
      written back to the node's angle. At the wall the heading is
     fully mirrored — a soft bounce — and because the deflection is
     state, the node leaves with the turned heading. No sharp V, no
     sticking to the edge, and no band of parked nodes: the drift
     keeps circulating through the whole box.
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

		// Pre-rendered glow sprite (rebuilt only when the colour changes):
		// a bright core with a soft halo. Far calmer than hard dots, and a
		// single drawImage per node is cheaper than fillStyle + arc.
		let sprite = null;
		let spriteKey = '';
		function ensureSprite(rgb) {
			const key = rgb[0] + ',' + rgb[1] + ',' + rgb[2];
			if (sprite && spriteKey === key) return sprite;
			spriteKey = key;
			sprite = document.createElement('canvas');
			sprite.width = 64;
			sprite.height = 64;
			const sctx = sprite.getContext('2d');
			const g = sctx.createRadialGradient(32, 32, 0, 32, 32, 32);
			g.addColorStop(0, 'rgba(' + key + ',0.95)');
			g.addColorStop(0.22, 'rgba(' + key + ',0.45)');
			g.addColorStop(0.5, 'rgba(' + key + ',0.10)');
			g.addColorStop(1, 'rgba(' + key + ',0)');
			sctx.fillStyle = g;
			sctx.fillRect(0, 0, 64, 64);
			return sprite;
		}

		function makeNode() {
			return {
				x: Math.random() * w,
				y: Math.random() * h,
				angle: Math.random() * Math.PI * 2,
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
			// deflection zones never overlap.
			const margin = Math.min(70, Math.max(28, Math.min(w, h) * 0.1), w * 0.25, h * 0.25);
			// Max normal pushed into the unit heading at the wall. > 1 so
			// that at the wall every outward-pointing heading is mirrored
			// (soft bounce). The push is the SIGNED cube of the proximity
			// (sign = away from the wall, cube = smooth ramp), which makes
			// the turn a smooth arc. Being state, the deflection persists
			// after the node leaves the margin — which is what keeps the
			// distribution even instead of parking nodes in a band at the
			// edge.
			const turn = 1.5;
			for (let i = 0; i < nodes.length; i++) {
				const n = nodes[i];
				n.angle += Math.sin(ts / 9000 + n.phase) * 0.0015 * k;

				let dx = Math.cos(n.angle);
				let dy = Math.sin(n.angle);
				let px = 0, py = 0;
				if (n.x < margin) px = 1 - n.x / margin;
				else if (n.x > w - margin) px = -(1 - (w - n.x) / margin);
				if (n.y < margin) py = 1 - n.y / margin;
				else if (n.y > h - margin) py = -(1 - (h - n.y) / margin);
				if (px !== 0 || py !== 0) {
					dx += px * px * px * turn;
					dy += py * py * py * turn;
					n.angle = Math.atan2(dy, dx);
				}

				n.x += (Math.cos(n.angle) * n.speed + Math.sin(ts / 4200 + n.phase) * o.wobble) * k;
				n.y += (Math.sin(n.angle) * n.speed + Math.cos(ts / 5100 + n.phaseY) * o.wobble) * k;

				// Last-resort containment; the deflection keeps this from
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

			// Nodes are drawn from the shared glow sprite. Bigger nodes sit
			// "closer": brighter, with a wider halo — a quiet depth cue.
			const spr = ensureSprite(rgb);
			for (let i = 0; i < nodes.length; i++) {
				const n = nodes[i];
				const pulse = 0.5 + 0.5 * Math.sin(t / 1800 + n.phase);
				const depth = 0.55 + 0.45 * ((n.r - 1.4) / 1.6);
				ctx.globalAlpha = o.nodeAlpha * (0.45 + 0.55 * pulse) * depth;
				const s = n.r * 5;
				ctx.drawImage(spr, n.x - s / 2, n.y - s / 2, s, s);
			}
			ctx.globalAlpha = 1;
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
