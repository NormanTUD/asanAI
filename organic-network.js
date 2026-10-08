"use strict";

(function () {
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
			color: null,
			onBackground: null
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
		let initialized = false;
		let destroyed = false;
		let colorCache = null;

		window.addEventListener('asanai_theme_change', function () {
			colorCache = null;
			sprite = null;
			spriteKey = '';
		});

		function readColor() {
			if (!colorCache) {
				const c = typeof o.color === 'function' ? o.color() : o.color;
				colorCache = c || [120, 130, 160];
			}
			return colorCache;
		}

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

		function seed() {
			nodes = [];
			const N = targetCount();
			for (let i = 0; i < N; i++) nodes.push(makeNode());
		}

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

		function step(ts, k) {
			const margin = Math.min(70, Math.max(28, Math.min(w, h) * 0.1), w * 0.25, h * 0.25);
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

				if (n.x < n.r) n.x = n.r;
				else if (n.x > w - n.r) n.x = w - n.r;
				if (n.y < n.r) n.y = n.r;
				else if (n.y > h - n.r) n.y = h - n.r;
			}
		}

		function update(t, dt) {
			if (!nodes.length) return;
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

			if (t - lastMeasure >= MEASURE_INTERVAL_MS) {
				lastMeasure = t;
				rect = measure();
				applySize(rect);
			}
			if (!rect) return;

			const dt = lastT === null
				? BASE_FRAME_MS
				: Math.min(MAX_DT_MS, Math.max(0.1, t - lastT));
			lastT = t;

			if (!hasRealSize) return;

			update(t, dt);
			draw(t);
		}

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
			if (canvas && canvas.parentNode) {
				canvas.parentNode.removeChild(canvas);
			}
		}

		function init() {
			if (initialized || destroyed) return;
			initialized = true;
			host = canvas.parentElement;

			if (reduceMotion) {
				renderStatic();
				window.addEventListener('resize', renderStatic);
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
})();
