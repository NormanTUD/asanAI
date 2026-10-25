/* ══════════════════════════════════════════════════════════════════
   HoTT geometry demos for Math III.

   Ported from the standalone page test/gleichheit_ist_ein_weg.html
   and translated to English. Everything here is Canvas 2D: the demos
   add no libraries (Three.js / Plotly are used by the other HoTT lab,
   not by this one).

   Conventions of the blog:
   - theme-aware through isDarkMode() and __MN_DARK.onChange();
   - initialised after the lesson DOM is final (blogPostLoadComplete).
   ══════════════════════════════════════════════════════════════════ */
(function () {
	'use strict';

	const $ = (id) => document.getElementById(id);
	const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
	const TAU = Math.PI * 2;
	const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
	const lerp = (a, b, t) => a + (b - a) * t;
	const smooth = (t) => t * t * (3 - 2 * t);
	const REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

	// ── palette ───────────────────────────────────────────────────
	// The standalone demos were dark-only. These two palettes keep the
	// same hues but switch the paper colour, so the canvases stay legible
	// on both blog themes.
	function hottDemoPalette() {
		const dark = (typeof isDarkMode === 'function')
			? isDarkMode()
			: document.documentElement.classList.contains('dark');
		return dark ? {
			dark: true,
			amber: '#fbbf24', teal: '#5bd6c4', violet: '#a78bfa',
			rose: '#fb7185', sky: '#7dd3fc', cream: '#f4ecdc',
			ink: '#e8ecf7', ink2: '#a0aec8', bg: '#060812'
		} : {
			dark: false,
			amber: '#b45309', teal: '#0f766e', violet: '#6d28d9',
			rose: '#be123c', sky: '#0369a1', cream: '#1f2937',
			ink: '#1e293b', ink2: '#5b6472', bg: '#faf8f1'
		};
	}

	let C = hottDemoPalette();

	function rgba(hex, a) {
		const n = Number.parseInt(hex.slice(1), 16);
		return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
	}

	function setRangeFill(input) {
		if (!input) return;
		const min = Number(input.min || 0);
		const max = Number(input.max || 100);
		const value = Number(input.value);
		const pct = max === min ? 0 : ((value - min) / (max - min)) * 100;
		input.style.setProperty('--val', `${pct}%`);
	}

	// ── canvas stage ──────────────────────────────────────────────
	// Each stage owns its rAF loop but renders only while visible.
	function makeStage(canvas, draw) {
		const ctx = canvas.getContext('2d');
		const state = {
			canvas, ctx, w: 1, h: 1, dpr: 1,
			time: 0, visible: false, raf: 0, last: 0, draw
		};
		const render = (time) => {
			ctx.setTransform(state.dpr, 0, 0, state.dpr, 0, 0);
			ctx.clearRect(0, 0, state.w, state.h);
			draw(ctx, state.w, state.h, time, state);
		};
		state.render = render;
		const resize = () => {
			const rect = canvas.getBoundingClientRect();
			state.w = Math.max(1, rect.width);
			state.h = Math.max(1, rect.height);
			state.dpr = Math.min(2, window.devicePixelRatio || 1);
			canvas.width = Math.round(state.w * state.dpr);
			canvas.height = Math.round(state.h * state.dpr);
			render(state.time);
		};
		state.resize = resize;
		const tick = (ts) => {
			state.raf = requestAnimationFrame(tick);
			if (!state.visible) { state.last = ts; return; }
			if (!state.last) state.last = ts;
			const dt = Math.min(64, ts - state.last);
			state.last = ts;
			state.time += dt;
			render(state.time);
		};
		if (window.ResizeObserver) new ResizeObserver(resize).observe(canvas.parentElement || canvas);
		else window.addEventListener('resize', resize, { passive: true });
		if (window.IntersectionObserver) {
			new IntersectionObserver((entries) => {
				state.visible = entries[0].isIntersecting;
				if (state.visible) state.last = 0;
			}, { rootMargin: '180px 0px' }).observe(canvas);
		} else {
			state.visible = true;
		}
		resize();
		state.raf = requestAnimationFrame(tick);
		return state;
	}

	function canvasPos(canvas, e) {
		const r = canvas.getBoundingClientRect();
		return { x: e.clientX - r.left, y: e.clientY - r.top };
	}

	function dotGrid(ctx, w, h, color, alpha = 0.06, gap = 34) {
		ctx.save();
		ctx.fillStyle = rgba(color, alpha);
		for (let x = gap / 2; x < w; x += gap) {
			for (let y = gap / 2; y < h; y += gap) {
				ctx.beginPath();
				ctx.arc(x, y, 0.9, 0, TAU);
				ctx.fill();
			}
		}
		ctx.restore();
	}

	function glowOrb(ctx, x, y, r, color, intensity = 1) {
		const g = ctx.createRadialGradient(x, y, 0, x, y, r * 5.2);
		g.addColorStop(0, rgba(color, 0.55 * intensity));
		g.addColorStop(0.28, rgba(color, 0.20 * intensity));
		g.addColorStop(1, rgba(color, 0));
		ctx.fillStyle = g;
		ctx.beginPath();
		ctx.arc(x, y, r * 5.2, 0, TAU);
		ctx.fill();
		ctx.fillStyle = C.cream;
		ctx.beginPath();
		ctx.arc(x, y, r, 0, TAU);
		ctx.fill();
		ctx.fillStyle = rgba(color, 0.9);
		ctx.beginPath();
		ctx.arc(x, y, r * 0.62, 0, TAU);
		ctx.fill();
	}

	function rotate3(x, y, z, ax, ay) {
		const cy = Math.cos(ay), sy = Math.sin(ay);
		const x1 = x * cy + z * sy;
		const z1 = -x * sy + z * cy;
		const cx = Math.cos(ax), sx = Math.sin(ax);
		const y1 = y * cx - z1 * sx;
		const z2 = y * sx + z1 * cx;
		return { x: x1, y: y1, z: z2 };
	}

	function project3(p, cx, cy, scale, cam) {
		const z = p.z + cam;
		const k = cam / Math.max(0.2, z);
		return { x: cx + p.x * scale * k, y: cy - p.y * scale * k, z, k };
	}

	function drawWireTorus(ctx, time, opts) {
		const { cx, cy, scale, color, alpha = 0.55, ax, ay, R = 1.35, r = 0.5, nu = 38, nv = 15 } = opts;
		const cam = 3.7;
		const baseAx = ax + Math.sin(time * 0.00014) * 0.05;
		const baseAy = ay + time * 0.00011;
		const point = (u, v) => {
			const cu = Math.cos(u), su = Math.sin(u), cv = Math.cos(v), sv = Math.sin(v);
			const p = rotate3((R + r * cv) * cu, r * sv, (R + r * cv) * su, baseAx, baseAy);
			return project3(p, cx, cy, scale, cam);
		};
		ctx.save();
		ctx.lineCap = 'round';
		for (let j = 0; j <= nv; j++) {
			const v = (j / nv) * TAU;
			for (let i = 0; i < nu; i++) {
				const a = point((i / nu) * TAU, v);
				const b = point(((i + 1) / nu) * TAU, v);
				const depth = clamp((1.9 - (a.z - cam)) / 3.8, 0, 1);
				ctx.strokeStyle = rgba(color, alpha * (0.16 + 0.84 * depth));
				ctx.lineWidth = 0.7 + depth * 0.5;
				ctx.beginPath();
				ctx.moveTo(a.x, a.y);
				ctx.lineTo(b.x, b.y);
				ctx.stroke();
			}
		}
		for (let i = 0; i < nu; i += 2) {
			const u = (i / nu) * TAU;
			for (let j = 0; j < nv; j++) {
				const a = point(u, (j / nv) * TAU);
				const b = point(u, ((j + 1) / nv) * TAU);
				const depth = clamp((1.9 - (a.z - cam)) / 3.8, 0, 1);
				ctx.strokeStyle = rgba(color, alpha * 0.55 * (0.2 + 0.8 * depth));
				ctx.lineWidth = 0.55;
				ctx.beginPath();
				ctx.moveTo(a.x, a.y);
				ctx.lineTo(b.x, b.y);
				ctx.stroke();
			}
		}
		ctx.restore();
		return { point };
	}

	function drawWireSphere(ctx, time, opts) {
		const { cx, cy, scale, color, alpha = 0.55, ax, ay, R = 1.45, nu = 26, nv = 15 } = opts;
		const cam = 3.6;
		const baseAx = ax + Math.sin(time * 0.00013) * 0.05;
		const baseAy = ay + time * 0.0001;
		const point = (theta, phi) => {
			const p = rotate3(
				R * Math.sin(theta) * Math.cos(phi),
				R * Math.cos(theta),
				R * Math.sin(theta) * Math.sin(phi),
				baseAx, baseAy
			);
			return project3(p, cx, cy, scale, cam);
		};
		ctx.save();
		ctx.lineCap = 'round';
		for (let j = 1; j < nv; j++) {
			const theta = (j / nv) * Math.PI;
			for (let i = 0; i < nu * 2; i++) {
				const a = point(theta, (i / (nu * 2)) * TAU);
				const b = point(theta, ((i + 1) / (nu * 2)) * TAU);
				const depth = clamp((1.5 - (a.z - cam)) / 3.2, 0, 1);
				ctx.strokeStyle = rgba(color, alpha * (0.14 + 0.8 * depth));
				ctx.lineWidth = 0.65;
				ctx.beginPath();
				ctx.moveTo(a.x, a.y);
				ctx.lineTo(b.x, b.y);
				ctx.stroke();
			}
		}
		for (let i = 0; i < nu; i++) {
			const phi = (i / nu) * TAU;
			for (let j = 0; j < nv * 2; j++) {
				const a = point((j / (nv * 2)) * Math.PI, phi);
				const b = point(((j + 1) / (nv * 2)) * Math.PI, phi);
				const depth = clamp((1.5 - (a.z - cam)) / 3.2, 0, 1);
				ctx.strokeStyle = rgba(color, alpha * 0.55 * (0.15 + 0.8 * depth));
				ctx.lineWidth = 0.55;
				ctx.beginPath();
				ctx.moveTo(a.x, a.y);
				ctx.lineTo(b.x, b.y);
				ctx.stroke();
			}
		}
		ctx.restore();
		return { point };
	}

	function cubicPoint(p0, p1, p2, p3, u) {
		const m = 1 - u;
		return {
			x: m * m * m * p0.x + 3 * m * m * u * p1.x + 3 * m * u * u * p2.x + u * u * u * p3.x,
			y: m * m * m * p0.y + 3 * m * m * u * p1.y + 3 * m * u * u * p2.y + u * u * u * p3.y
		};
	}

	function cubicTangent(p0, p1, p2, p3, u) {
		const m = 1 - u;
		return {
			x: 3 * m * m * (p1.x - p0.x) + 6 * m * u * (p2.x - p1.x) + 3 * u * u * (p3.x - p2.x),
			y: 3 * m * m * (p1.y - p0.y) + 6 * m * u * (p2.y - p1.y) + 3 * u * u * (p3.y - p2.y)
		};
	}

	function pathControls(A, B, t) {
		const dx = B.x - A.x, dy = B.y - A.y;
		const len = Math.hypot(dx, dy) || 1;
		const nx = -dy / len, ny = dx / len;
		const bend = lerp(0.045 * len, 0.34 * len, smooth(clamp(t, 0, 1)));
		const wobble = lerp(0.045 * len, -0.34 * len, smooth(clamp(t, 0, 1)));
		return {
			c1: { x: A.x + dx * 0.3 + nx * bend, y: A.y + dy * 0.3 + ny * bend },
			c2: { x: A.x + dx * 0.7 + nx * wobble, y: A.y + dy * 0.7 + ny * wobble }
		};
	}

	function arrowHead(ctx, x, y, ang, color, size = 6) {
		ctx.save();
		ctx.fillStyle = color;
		ctx.translate(x, y);
		ctx.rotate(ang);
		ctx.beginPath();
		ctx.moveTo(size, 0);
		ctx.lineTo(-size * 0.72, size * 0.55);
		ctx.lineTo(-size * 0.72, -size * 0.55);
		ctx.closePath();
		ctx.fill();
		ctx.restore();
	}

	function signed(n) {
		return n > 0 ? `+${n}` : `${n}`;
	}

	function loopPoint(n, u, cx, cy, R, offset = 0) {
		if (n === 0) return { x: cx, y: cy - R };
		const m = Math.abs(n);
		const dir = n < 0 ? -1 : 1;
		const ang = -Math.PI / 2 + dir * TAU * m * u;
		const dip = Math.min(22 * m, R * 0.44);
		const rad = R - dip * Math.sin(Math.PI * u) - offset * Math.sin(Math.PI * u);
		return { x: cx + rad * Math.cos(ang), y: cy + rad * Math.sin(ang) };
	}

	// ── 01 · types as spaces ─────────────────────────────────────
	const SPACE_DATA = {
		point: {
			name: 'Point', symbol: '•', points: '1', loops: 'none', holes: '0',
			level: 'contractible',
			note: 'A single point. Everything can be contracted to it.'
		},
		interval: {
			name: 'Interval', symbol: '[0,1]', points: 'infinitely many', loops: 'none', holes: '0',
			level: 'contractible',
			note: 'Two ends, but a path between them. The interval shrinks to a point.'
		},
		two: {
			name: 'Two points', symbol: 'Bool', points: '2', loops: 'none', holes: '—',
			level: 'discrete',
			note: 'Separated points: there is no path, so no equality.'
		},
		circle: {
			name: 'Circle', symbol: 'S¹', points: 'infinitely many', loops: 'ℤ', holes: '1',
			level: '1-type',
			note: 'A loop cannot be pulled to a point. That is the hole.'
		},
		sphere: {
			name: 'Sphere', symbol: 'S²', points: 'infinitely many', loops: 'none (π₁)', holes: '1 cavity',
			level: '2-type',
			note: 'No loops, but a hollow surface: π₂ = ℤ.'
		},
		torus: {
			name: 'Torus', symbol: 'T²', points: 'infinitely many', loops: 'ℤ × ℤ', holes: '1',
			level: '1-type',
			note: 'Two independent loops: one around, one through.'
		}
	};

	function initHottSpaceDemo() {
		const canvas = $('hott-spaceCanvas');
		if (!canvas) return;
		const tabs = $('hott-spaceTabs');
		const readout = $('hott-spaceReadout');
		const level = $('hott-spaceLevel');
		let mode = 'circle';

		const stage = makeStage(canvas, (ctx, w, h, time) => {
			const t = REDUCED ? 0 : time;
			const cx = w * 0.5;
			const cy = h * 0.52;
			const unit = Math.min(w, h);

			const bg = ctx.createRadialGradient(cx, cy, 0, cx, cy, unit * 0.7);
			bg.addColorStop(0, C.dark ? 'rgba(255,255,255,.035)' : 'rgba(0,0,0,.02)');
			bg.addColorStop(1, 'rgba(0,0,0,0)');
			ctx.fillStyle = bg;
			ctx.fillRect(0, 0, w, h);

			if (mode === 'point') {
				const pulse = 1 + 0.12 * Math.sin(t * 0.0022);
				for (let i = 0; i < 3; i++) {
					const rr = unit * (0.09 + i * 0.055) * pulse;
					ctx.strokeStyle = rgba(C.amber, 0.16 - i * 0.04);
					ctx.lineWidth = 1;
					ctx.beginPath();
					ctx.arc(cx, cy, rr, 0, TAU);
					ctx.stroke();
				}
				glowOrb(ctx, cx, cy, 5.5, C.amber, 1.1);
				ctx.font = 'italic 15px Georgia, serif';
				ctx.fillStyle = rgba(C.cream, 0.55);
				ctx.textAlign = 'center';
				ctx.fillText('•', cx, cy + unit * 0.16);
			} else if (mode === 'interval') {
				const x0 = w * 0.22, x1 = w * 0.78;
				const g = ctx.createLinearGradient(x0, cy, x1, cy);
				g.addColorStop(0, rgba(C.amber, 0.22));
				g.addColorStop(0.5, rgba(C.amber, 0.95));
				g.addColorStop(1, rgba(C.amber, 0.22));
				ctx.strokeStyle = g;
				ctx.lineWidth = 3;
				ctx.lineCap = 'round';
				ctx.shadowColor = rgba(C.amber, 0.6);
				ctx.shadowBlur = 18;
				ctx.beginPath();
				ctx.moveTo(x0, cy);
				ctx.lineTo(x1, cy);
				ctx.stroke();
				ctx.shadowBlur = 0;
				glowOrb(ctx, x0, cy, 3.5, C.amber, 0.7);
				glowOrb(ctx, x1, cy, 3.5, C.amber, 0.7);
				const mx = lerp(x0, x1, (Math.sin(t * 0.0011) + 1) / 2);
				glowOrb(ctx, mx, cy, 2.4, C.cream, 0.8);
				ctx.font = 'italic 16px Georgia, serif';
				ctx.fillStyle = rgba(C.cream, 0.6);
				ctx.textAlign = 'center';
				ctx.fillText('0', x0, cy + 34);
				ctx.fillText('1', x1, cy + 34);
				ctx.fillStyle = rgba(C.amber, 0.82);
				ctx.fillText('≈', lerp(x0, x1, 0.5), cy - 20);
			} else if (mode === 'two') {
				const x0 = w * 0.35, x1 = w * 0.65;
				glowOrb(ctx, x0, cy, 4, C.rose, 0.85);
				glowOrb(ctx, x1, cy, 4, C.teal, 0.85);
				ctx.save();
				ctx.strokeStyle = rgba(C.cream, 0.18);
				ctx.setLineDash([3, 10]);
				ctx.lineWidth = 1;
				ctx.beginPath();
				ctx.moveTo(x0 + 18, cy);
				ctx.lineTo(x1 - 18, cy);
				ctx.stroke();
				ctx.restore();
				ctx.font = 'italic 16px Georgia, serif';
				ctx.fillStyle = rgba(C.cream, 0.55);
				ctx.textAlign = 'center';
				ctx.fillText('true', x0, cy + 34);
				ctx.fillText('false', x1, cy + 34);
			} else if (mode === 'circle') {
				const R = unit * 0.28;
				ctx.strokeStyle = rgba(C.rose, 0.65);
				ctx.lineWidth = 2;
				ctx.shadowColor = rgba(C.rose, 0.45);
				ctx.shadowBlur = 16;
				ctx.beginPath();
				ctx.arc(cx, cy, R, 0, TAU);
				ctx.stroke();
				ctx.shadowBlur = 0;
				const u = (t * 0.00055) % TAU;
				const bx = cx + R * Math.cos(-Math.PI / 2 + u);
				const by = cy + R * Math.sin(-Math.PI / 2 + u);
				glowOrb(ctx, bx, by, 2.6, C.rose, 0.9);
				const baseX = cx, baseY = cy - R;
				glowOrb(ctx, baseX, baseY, 4.2, C.amber, 1);
				ctx.font = 'italic 15px Georgia, serif';
				ctx.fillStyle = rgba(C.cream, 0.6);
				ctx.textAlign = 'center';
				ctx.fillText('base', baseX, baseY - 18);
				ctx.fillStyle = rgba(C.rose, 0.85);
				ctx.fillText('S¹', cx, cy + R + 34);
			} else if (mode === 'sphere') {
				drawWireSphere(ctx, t, {
					cx, cy, scale: unit * 0.28, color: C.sky, alpha: 0.55,
					ax: -0.38, ay: 0.7, R: 1.42, nu: 24, nv: 14
				});
				const p = rotate3(0, 1.42, 0, -0.38, 0.7);
				const s = project3(p, cx, cy, unit * 0.28, 3.6);
				glowOrb(ctx, s.x, s.y, 2.8, C.amber, 0.9);
				ctx.font = 'italic 15px Georgia, serif';
				ctx.fillStyle = rgba(C.sky, 0.85);
				ctx.textAlign = 'center';
				ctx.fillText('S²', cx, cy + unit * 0.36);
			} else if (mode === 'torus') {
				drawWireTorus(ctx, t, {
					cx, cy, scale: unit * 0.245, color: C.amber, alpha: 0.5,
					ax: -0.62, ay: 0.45, R: 1.35, r: 0.5, nu: 38, nv: 15
				});
				const ax = -0.62 + Math.sin(t * 0.00014) * 0.05;
				const ay = 0.45 + t * 0.00011;
				const cam = 3.7;
				const scale = unit * 0.245;
				const drawLoop = (fixV, color) => {
					const pts = [];
					for (let i = 0; i <= 100; i++) {
						const u = (i / 100) * TAU;
						let p;
						if (fixV === 'u') {
							const cu = Math.cos(u), su = Math.sin(u), cv = Math.cos(0.55), sv = Math.sin(0.55);
							p = rotate3((1.35 + 0.5 * cv) * cu, 0.5 * sv, (1.35 + 0.5 * cv) * su, ax, ay);
						} else {
							const cu = Math.cos(0.4), su = Math.sin(0.4), cv = Math.cos(u), sv = Math.sin(u);
							p = rotate3((1.35 + 0.5 * cv) * cu, 0.5 * sv, (1.35 + 0.5 * cv) * su, ax, ay);
						}
						pts.push(project3(p, cx, cy, scale, cam));
					}
					ctx.save();
					ctx.strokeStyle = rgba(color, 0.9);
					ctx.lineWidth = 2;
					ctx.shadowColor = rgba(color, 0.7);
					ctx.shadowBlur = 12;
					ctx.beginPath();
					pts.forEach((p, i) => i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y));
					ctx.stroke();
					ctx.restore();
				};
				drawLoop('u', C.rose);
				drawLoop('v', C.teal);
				ctx.font = 'italic 15px Georgia, serif';
				ctx.fillStyle = rgba(C.amber, 0.85);
				ctx.textAlign = 'center';
				ctx.fillText('T²', cx, cy + unit * 0.36);
			}

			if (mode === 'point' || mode === 'interval' || mode === 'two') {
				ctx.strokeStyle = rgba(C.cream, 0.09);
				ctx.lineWidth = 1;
				ctx.beginPath();
				ctx.moveTo(w * 0.18, h * 0.2);
				ctx.lineTo(w * 0.82, h * 0.2);
				ctx.stroke();
			}
		});

		const update = () => {
			const d = SPACE_DATA[mode];
			level.textContent = d.level;
			readout.innerHTML = `
				<div class="hott-ro"><span class="k">Type</span><span class="v acc">${d.symbol} · ${d.name}</span></div>
				<div class="hott-ro"><span class="k">Points</span><span class="v">${d.points}</span></div>
				<div class="hott-ro"><span class="k">Loops</span><span class="v">${d.loops}</span></div>
				<div class="hott-ro"><span class="k">Holes</span><span class="v">${d.holes}</span></div>
				<div class="hott-ro" style="grid-column:span 2"><span class="k">What you see</span><span class="v">${d.note}</span></div>
			`;
		};

		tabs.addEventListener('click', (e) => {
			const btn = e.target.closest('button[data-space]');
			if (!btn) return;
			mode = btn.dataset.space;
			$$('button[data-space]', tabs).forEach((b) => {
				const on = b === btn;
				b.classList.toggle('active', on);
				b.setAttribute('aria-pressed', on ? 'true' : 'false');
			});
			update();
		});

		update();
		stage.render(0);
	}

	// ── 02 · path workshop ───────────────────────────────────────
	function initHottPathDemo() {
		const canvas = $('hott-pathCanvas');
		if (!canvas) return;
		const slider = $('hott-pathSlider');
		const sliderVal = $('hott-pathT');
		const autoBtn = $('hott-pathAuto');
		const revBtn = $('hott-pathReverse');
		const reflBtn = $('hott-pathRefl');
		const resetBtn = $('hott-pathReset');
		const readout = $('hott-pathReadout');

		const sim = {
			A: { x: 0.2, y: 0.58 },
			B: { x: 0.8, y: 0.58 },
			t: 0,
			auto: false,
			autoT0: 0,
			rev: false,
			drag: null,
			reflUntil: 0
		};

		const updatePathReadout = () => {
			const rect = canvas.getBoundingClientRect();
			const sw = Math.max(1, rect.width);
			const sh = Math.max(1, rect.height);
			const A = { x: sim.A.x * sw, y: sim.A.y * sh };
			const B = { x: sim.B.x * sw, y: sim.B.y * sh };
			const { c1, c2 } = pathControls(A, B, sim.t);
			let len = 0;
			let prev = A;
			for (let i = 1; i <= 30; i++) {
				const p = cubicPoint(A, c1, c2, B, i / 30);
				len += Math.hypot(p.x - prev.x, p.y - prev.y);
				prev = p;
			}
			const direct = Math.max(1, Math.hypot(B.x - A.x, B.y - A.y));
			readout.innerHTML = `
				<div class="hott-ro"><span class="k">Proof</span><span class="v acc">p : a ≡ b</span></div>
				<div class="hott-ro"><span class="k">Path shape</span><span class="v">${Math.round(sim.t * 100)}% bent</span></div>
				<div class="hott-ro"><span class="k">Direction</span><span class="v">${sim.rev ? 'p⁻¹ (backwards)' : 'forwards'}</span></div>
				<div class="hott-ro"><span class="k">Length</span><span class="v">${(len / direct).toFixed(2)} × direct</span></div>
				<div class="hott-ro"><span class="k">Separation</span><span class="v">${(direct / sw).toFixed(2)} × width</span></div>
			`;
		};

		let lastReadout = performance.now();
		const stage = makeStage(canvas, (ctx, w, h, time) => {
			const now = performance.now();
			if (sim.auto) {
				sim.t = 0.5 - 0.5 * Math.cos((now - sim.autoT0) * 0.00115);
				const v = Math.round(sim.t * 100);
				if (slider.value !== String(v)) {
					slider.value = String(v);
					setRangeFill(slider);
				}
			}
			sliderVal.textContent = `${Math.round(sim.t * 100)}%`;

			dotGrid(ctx, w, h, C.teal, 0.055, 34);

			const A = { x: sim.A.x * w, y: sim.A.y * h };
			const B = { x: sim.B.x * w, y: sim.B.y * h };
			const { c1, c2 } = pathControls(A, B, sim.t);

			const ghost = (tt, color, dash) => {
				const c = pathControls(A, B, tt);
				ctx.save();
				ctx.strokeStyle = rgba(color, 0.16);
				ctx.lineWidth = 1.2;
				ctx.setLineDash(dash);
				ctx.beginPath();
				ctx.moveTo(A.x, A.y);
				ctx.bezierCurveTo(c.c1.x, c.c1.y, c.c2.x, c.c2.y, B.x, B.y);
				ctx.stroke();
				ctx.restore();
			};
			ghost(0, C.amber, [3, 7]);
			ghost(1, C.violet, [3, 7]);

			const refl = now < sim.reflUntil;
			ctx.save();
			if (refl) ctx.globalAlpha = 0.16;

			const grad = ctx.createLinearGradient(A.x, A.y, B.x, B.y);
			grad.addColorStop(0, C.amber);
			grad.addColorStop(0.52, C.rose);
			grad.addColorStop(1, C.teal);
			ctx.strokeStyle = grad;
			ctx.lineWidth = 3.4;
			ctx.lineCap = 'round';
			ctx.shadowColor = rgba(C.amber, 0.55);
			ctx.shadowBlur = 16;
			ctx.beginPath();
			ctx.moveTo(A.x, A.y);
			ctx.bezierCurveTo(c1.x, c1.y, c2.x, c2.y, B.x, B.y);
			ctx.stroke();
			ctx.shadowBlur = 0;

			for (const u of [0.18, 0.5, 0.82]) {
				const p = cubicPoint(A, c1, c2, B, sim.rev ? 1 - u : u);
				const tan = cubicTangent(A, c1, c2, B, sim.rev ? 1 - u : u);
				const ang = Math.atan2(tan.y, tan.x) + (sim.rev ? Math.PI : 0);
				arrowHead(ctx, p.x, p.y, ang, rgba(C.cream, 0.75), 5.5);
			}

			const mu = REDUCED ? 0.5 : (sim.rev
				? 1 - ((time * 0.00009) % 1)
				: (time * 0.00009) % 1);
			const mp = cubicPoint(A, c1, c2, B, mu);
			glowOrb(ctx, mp.x, mp.y, 2.4, C.cream, 0.75);

			const mid = cubicPoint(A, c1, c2, B, 0.5);
			ctx.font = 'italic 17px Georgia, serif';
			ctx.fillStyle = rgba(C.cream, 0.7);
			ctx.textAlign = 'center';
			ctx.fillText(sim.rev ? 'p⁻¹' : 'p', mid.x, mid.y - 16);
			ctx.restore();

			if (refl) {
				const pulse = 0.5 + 0.5 * Math.sin(now * 0.008);
				ctx.strokeStyle = rgba(C.amber, 0.4 + pulse * 0.4);
				ctx.lineWidth = 1.4;
				ctx.beginPath();
				ctx.arc(A.x, A.y, 22 + pulse * 9, 0, TAU);
				ctx.stroke();
				ctx.font = 'italic 16px Georgia, serif';
				ctx.fillStyle = rgba(C.cream, 0.85);
				const right = A.x > w * 0.7;
				ctx.textAlign = right ? 'right' : 'left';
				ctx.fillText('refl : a ≡ a', A.x + (right ? -34 : 34), A.y - 20);
			}

			glowOrb(ctx, A.x, A.y, 5, C.amber, 1);
			glowOrb(ctx, B.x, B.y, 5, C.teal, 1);
			ctx.font = 'italic 19px Georgia, serif';
			ctx.fillStyle = rgba(C.cream, 0.82);
			ctx.textAlign = 'center';
			ctx.fillText('a', A.x, A.y + 36);
			ctx.fillText('b', B.x, B.y + 36);

			if (sim.drag) {
				const P = sim.drag === 'A' ? A : B;
				ctx.strokeStyle = rgba(C.cream, 0.24);
				ctx.lineWidth = 1;
				ctx.beginPath();
				ctx.arc(P.x, P.y, 16, 0, TAU);
				ctx.stroke();
			}

			if (now - lastReadout > 180) {
				lastReadout = now;
				updatePathReadout();
			}
		});

		slider.addEventListener('input', () => {
			sim.auto = false;
			autoBtn.classList.remove('is-active');
			autoBtn.setAttribute('aria-pressed', 'false');
			sim.t = Number(slider.value) / 100;
			setRangeFill(slider);
			sliderVal.textContent = `${slider.value}%`;
			updatePathReadout();
		});

		autoBtn.addEventListener('click', () => {
			sim.auto = !sim.auto;
			autoBtn.classList.toggle('is-active', sim.auto);
			autoBtn.setAttribute('aria-pressed', sim.auto ? 'true' : 'false');
			if (sim.auto) sim.autoT0 = performance.now() - Math.acos(1 - 2 * sim.t) / 0.00115;
		});

		revBtn.addEventListener('click', () => {
			sim.rev = !sim.rev;
			revBtn.classList.toggle('is-active', sim.rev);
			revBtn.setAttribute('aria-pressed', sim.rev ? 'true' : 'false');
			updatePathReadout();
		});

		reflBtn.addEventListener('click', () => {
			sim.reflUntil = performance.now() + 2300;
		});

		resetBtn.addEventListener('click', () => {
			sim.A = { x: 0.2, y: 0.58 };
			sim.B = { x: 0.8, y: 0.58 };
			sim.t = 0;
			sim.rev = false;
			sim.auto = false;
			sim.reflUntil = 0;
			slider.value = '0';
			setRangeFill(slider);
			sliderVal.textContent = '0%';
			autoBtn.classList.remove('is-active');
			autoBtn.setAttribute('aria-pressed', 'false');
			revBtn.classList.remove('is-active');
			revBtn.setAttribute('aria-pressed', 'false');
			updatePathReadout();
		});

		canvas.addEventListener('pointerdown', (e) => {
			const p = canvasPos(canvas, e);
			const A = { x: sim.A.x * stage.w, y: sim.A.y * stage.h };
			const B = { x: sim.B.x * stage.w, y: sim.B.y * stage.h };
			const dA = Math.hypot(p.x - A.x, p.y - A.y);
			const dB = Math.hypot(p.x - B.x, p.y - B.y);
			if (Math.min(dA, dB) < 38) {
				sim.drag = dA < dB ? 'A' : 'B';
				try { canvas.setPointerCapture(e.pointerId); } catch (_) { /* ignore */ }
				canvas.style.cursor = 'grabbing';
			}
		});

		canvas.addEventListener('pointermove', (e) => {
			const p = canvasPos(canvas, e);
			const A = { x: sim.A.x * stage.w, y: sim.A.y * stage.h };
			const B = { x: sim.B.x * stage.w, y: sim.B.y * stage.h };
			if (sim.drag) {
				sim[sim.drag] = {
					x: clamp(p.x / stage.w, 0.07, 0.93),
					y: clamp(p.y / stage.h, 0.16, 0.84)
				};
				updatePathReadout();
			} else {
				const near = Math.min(
					Math.hypot(p.x - A.x, p.y - A.y),
					Math.hypot(p.x - B.x, p.y - B.y)
				) < 38;
				canvas.style.cursor = near ? 'grab' : 'default';
			}
		});

		const endDrag = () => {
			sim.drag = null;
			canvas.style.cursor = 'default';
		};
		canvas.addEventListener('pointerup', endDrag);
		canvas.addEventListener('pointercancel', endDrag);

		setRangeFill(slider);
		updatePathReadout();
		stage.render(0);
	}

	// ── 03 · surface between proofs ─────────────────────────────
	function initHottSurfaceDemo() {
		const canvas = $('hott-surfaceCanvas');
		if (!canvas) return;
		const slider = $('hott-surfaceSlider');
		const sVal = $('hott-surfaceS');
		const autoBtn = $('hott-surfaceAuto');
		const resetBtn = $('hott-surfaceReset');
		const readout = $('hott-surfaceReadout');
		if (REDUCED) {
			autoBtn.classList.remove('is-active');
			autoBtn.setAttribute('aria-pressed', 'false');
		}

		const sim = {
			bulge: 0.55,
			s: 0.5,
			auto: !REDUCED,
			autoT0: performance.now(),
			drag: false
		};
		const update = () => {
			const depth = Math.round(20 + sim.bulge * 70);
			readout.innerHTML = `
				<div class="hott-ro"><span class="k">2-path</span><span class="v acc">α : p ≡ q</span></div>
				<div class="hott-ro"><span class="k">Intermediate path</span><span class="v">s = ${sim.s.toFixed(2)}</span></div>
				<div class="hott-ro"><span class="k">Surface</span><span class="v">homotopy</span></div>
				<div class="hott-ro"><span class="k">Level</span><span class="v">2 · ${depth}% bulged</span></div>
			`;
		};

		let lastRO = performance.now();

		const stage = makeStage(canvas, (ctx, w, h, time) => {
			const now = performance.now();
			if (sim.auto) {
				sim.s = 0.5 - 0.5 * Math.cos((now - sim.autoT0) * 0.00105);
				const v = Math.round(sim.s * 100);
				if (slider.value !== String(v)) {
					slider.value = String(v);
					setRangeFill(slider);
				}
			}
			sVal.textContent = `${Math.round(sim.s * 100)}%`;

			dotGrid(ctx, w, h, C.violet, 0.05, 36);

			const A = { x: w * 0.12, y: h * 0.76 };
			const B = { x: w * 0.88, y: h * 0.76 };
			const pB = h * 0.11;
			const qB = h * (0.16 + 0.32 * sim.bulge);
			const pY = (u) => A.y - Math.sin(Math.PI * u) * pB;
			const qY = (u) => A.y - Math.sin(Math.PI * u) * qB;

			ctx.beginPath();
			for (let i = 0; i <= 120; i++) {
				const u = i / 120;
				const x = lerp(A.x, B.x, u);
				const y = pY(u);
				if (i) ctx.lineTo(x, y); else ctx.moveTo(x, y);
			}
			for (let i = 120; i >= 0; i--) {
				const u = i / 120;
				ctx.lineTo(lerp(A.x, B.x, u), qY(u));
			}
			ctx.closePath();
			const fill = ctx.createLinearGradient(0, A.y, 0, qY(0.5));
			fill.addColorStop(0, rgba(C.violet, 0.045));
			fill.addColorStop(1, rgba(C.violet, 0.22));
			ctx.fillStyle = fill;
			ctx.fill();

			for (let k = 1; k < 12; k++) {
				const f = k / 12;
				ctx.beginPath();
				for (let i = 0; i <= 100; i++) {
					const u = i / 100;
					const x = lerp(A.x, B.x, u);
					const y = lerp(pY(u), qY(u), f);
					if (i) ctx.lineTo(x, y); else ctx.moveTo(x, y);
				}
				ctx.strokeStyle = rgba(C.violet, 0.15);
				ctx.lineWidth = 1;
				ctx.stroke();
			}

			ctx.save();
			ctx.beginPath();
			for (let i = 0; i <= 150; i++) {
				const u = i / 150;
				const x = lerp(A.x, B.x, u);
				const y = lerp(pY(u), qY(u), sim.s);
				if (i) ctx.lineTo(x, y); else ctx.moveTo(x, y);
			}
			ctx.strokeStyle = rgba(C.cream, 0.92);
			ctx.lineWidth = 2.3;
			ctx.shadowColor = rgba(C.violet, 0.9);
			ctx.shadowBlur = 16;
			ctx.stroke();
			ctx.restore();

			const mu = REDUCED ? 0.5 : (time * 0.00013) % 1;
			glowOrb(ctx, lerp(A.x, B.x, mu), lerp(pY(mu), qY(mu), sim.s), 2.2, C.cream, 0.7);

			const drawCurve = (fn, color, label, labelU) => {
				ctx.beginPath();
				for (let i = 0; i <= 140; i++) {
					const u = i / 140;
					const x = lerp(A.x, B.x, u);
					if (i) ctx.lineTo(x, fn(u)); else ctx.moveTo(x, fn(u));
				}
				ctx.strokeStyle = color;
				ctx.lineWidth = 2.2;
				ctx.shadowColor = color;
				ctx.shadowBlur = 11;
				ctx.stroke();
				ctx.shadowBlur = 0;
				ctx.font = 'italic 18px Georgia, serif';
				ctx.fillStyle = rgba(C.cream, 0.82);
				ctx.textAlign = 'center';
				ctx.fillText(label, lerp(A.x, B.x, labelU), fn(labelU) - 13);
			};
			drawCurve(pY, rgba(C.amber, 0.9), 'p', 0.1);
			drawCurve(qY, rgba(C.teal, 0.9), 'q', 0.9);

			glowOrb(ctx, A.x, A.y, 4, C.cream, 0.8);
			glowOrb(ctx, B.x, B.y, 4, C.cream, 0.8);
			ctx.font = 'italic 18px Georgia, serif';
			ctx.fillStyle = rgba(C.cream, 0.7);
			ctx.textAlign = 'center';
			ctx.fillText('a', A.x, A.y + 34);
			ctx.fillText('b', B.x, B.y + 34);

			const cx = lerp(A.x, B.x, 0.5);
			const yP = pY(0.5), yQ = qY(0.5);
			ctx.save();
			ctx.strokeStyle = rgba(C.violet, 0.55);
			ctx.lineWidth = 1.2;
			ctx.setLineDash([3, 4]);
			ctx.beginPath();
			ctx.moveTo(cx, yP - 9);
			ctx.lineTo(cx, yQ + 14);
			ctx.stroke();
			ctx.restore();
			arrowHead(ctx, cx, yQ + 8, -Math.PI / 2, rgba(C.violet, 0.82), 5);
			ctx.font = 'italic 17px Georgia, serif';
			ctx.fillStyle = rgba(C.violet, 0.95);
			ctx.textAlign = 'left';
			ctx.fillText('α', cx + 12, (yP + yQ) / 2);

			ctx.strokeStyle = rgba(C.teal, 0.5);
			ctx.lineWidth = 1.2;
			ctx.beginPath();
			ctx.arc(cx, yQ, 9, 0, TAU);
			ctx.stroke();
			ctx.fillStyle = rgba(C.teal, 0.9);
			ctx.beginPath();
			ctx.arc(cx, yQ, 3.2, 0, TAU);
			ctx.fill();

			if (now - lastRO > 170) {
				lastRO = now;
				update();
			}
		});

		slider.addEventListener('input', () => {
			sim.auto = false;
			autoBtn.classList.remove('is-active');
			autoBtn.setAttribute('aria-pressed', 'false');
			sim.s = Number(slider.value) / 100;
			setRangeFill(slider);
			sVal.textContent = `${slider.value}%`;
			update();
		});

		autoBtn.addEventListener('click', () => {
			sim.auto = !sim.auto;
			autoBtn.classList.toggle('is-active', sim.auto);
			autoBtn.setAttribute('aria-pressed', sim.auto ? 'true' : 'false');
			if (sim.auto) sim.autoT0 = performance.now() - Math.acos(1 - 2 * sim.s) / 0.00105;
		});

		resetBtn.addEventListener('click', () => {
			sim.bulge = 0.55;
			sim.s = 0.5;
			sim.auto = !REDUCED;
			sim.autoT0 = performance.now();
			slider.value = '50';
			setRangeFill(slider);
			sVal.textContent = '50%';
			autoBtn.classList.toggle('is-active', sim.auto);
			autoBtn.setAttribute('aria-pressed', sim.auto ? 'true' : 'false');
			update();
		});

		canvas.addEventListener('pointerdown', (e) => {
			const p = canvasPos(canvas, e);
			const A = { x: stage.w * 0.12, y: stage.h * 0.76 };
			const qB = stage.h * (0.16 + 0.32 * sim.bulge);
			const hx = stage.w * 0.5;
			const hy = A.y - qB;
			if (Math.hypot(p.x - hx, p.y - hy) < 32) {
				sim.drag = true;
				sim.auto = false;
				autoBtn.classList.remove('is-active');
				autoBtn.setAttribute('aria-pressed', 'false');
				try { canvas.setPointerCapture(e.pointerId); } catch (_) { /* ignore */ }
				canvas.style.cursor = 'grabbing';
			}
		});

		canvas.addEventListener('pointermove', (e) => {
			const p = canvasPos(canvas, e);
			const A = { x: stage.w * 0.12, y: stage.h * 0.76 };
			const qB = stage.h * (0.16 + 0.32 * sim.bulge);
			const hx = stage.w * 0.5;
			const hy = A.y - qB;
			if (sim.drag) {
				const raw = (A.y - p.y) / stage.h;
				sim.bulge = clamp((raw - 0.16) / 0.32, 0, 1);
				update();
			} else {
				canvas.style.cursor = Math.hypot(p.x - hx, p.y - hy) < 32 ? 'grab' : 'default';
			}
		});

		const end = () => {
			sim.drag = false;
			canvas.style.cursor = 'default';
		};
		canvas.addEventListener('pointerup', end);
		canvas.addEventListener('pointercancel', end);

		setRangeFill(slider);
		update();
		stage.render(0);
	}

	// ── 04 · loop laboratory ────────────────────────────────────
	function initHottLoopDemo() {
		const canvas = $('hott-loopCanvas');
		if (!canvas) return;
		const sliderA = $('hott-loopA');
		const sliderB = $('hott-loopB');
		const valA = $('hott-loopAVal');
		const valB = $('hott-loopBVal');
		const playBtn = $('hott-loopPlay');
		const resetBtn = $('hott-loopReset');
		const readout = $('hott-loopReadout');
		const liftDot = $('hott-liftDot');
		const liftValue = $('hott-liftValue');

		const sim = {
			a: 1,
			b: 1,
			playing: false,
			playT0: 0,
			didPlay: false
		};

		const update = () => {
			const sum = sim.a + sim.b;
			valA.textContent = signed(sim.a);
			valB.textContent = signed(sim.b);
			liftValue.textContent = signed(sum);
			liftDot.style.left = `${clamp(((sum + 6) / 12) * 100, 0, 100)}%`;
			let meaning;
			if (sum === 0) meaning = 'contractible · refl';
			else if (Math.abs(sum) === 1) meaning = sum > 0 ? 'once forwards' : 'once backwards';
			else meaning = `${Math.abs(sum)} turns ${sum > 0 ? 'forwards' : 'backwards'}`;
			const action = sim.playing ? 'composing…' : (sim.didPlay ? 'composed' : 'ready');
			readout.innerHTML = `
				<div class="hott-ro"><span class="k">Loop a</span><span class="v">${signed(sim.a)}</span></div>
				<div class="hott-ro"><span class="k">Loop b</span><span class="v">${signed(sim.b)}</span></div>
				<div class="hott-ro"><span class="k">a + b</span><span class="v acc">${signed(sum)}</span></div>
				<div class="hott-ro"><span class="k">Meaning</span><span class="v">${meaning}</span></div>
				<div class="hott-ro"><span class="k">Action</span><span class="v">${action}</span></div>
				<div class="hott-ro"><span class="k">Group</span><span class="v">π₁(S¹) ≅ ℤ</span></div>
			`;
		};

		const stage = makeStage(canvas, (ctx, w, h, time) => {
			const now = performance.now();
			const R = Math.min(w, h) * 0.28;
			const cx = w * 0.5;
			const cy = h * 0.53;
			const off = Math.min(w, h) * 0.055;

			const bg = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.min(w, h) * 0.66);
			bg.addColorStop(0, 'rgba(251,113,133,.05)');
			bg.addColorStop(1, 'rgba(251,113,133,0)');
			ctx.fillStyle = bg;
			ctx.fillRect(0, 0, w, h);

			ctx.save();
			ctx.strokeStyle = rgba(C.cream, 0.15);
			ctx.lineWidth = 1;
			ctx.setLineDash([2, 8]);
			ctx.beginPath();
			ctx.arc(cx, cy, R, 0, TAU);
			ctx.stroke();
			ctx.restore();

			let progA = 1, progB = 1, phase = 'idle';
			if (sim.playing) {
				const elapsed = now - sim.playT0;
				const durA = sim.a === 0 ? 380 : 720 + 260 * Math.abs(sim.a);
				const durB = sim.b === 0 ? 380 : 720 + 260 * Math.abs(sim.b);
				if (elapsed < durA) {
					phase = 'a';
					progA = clamp(elapsed / durA, 0, 1);
					progB = 0;
				} else if (elapsed < durA + durB) {
					phase = 'b';
					progA = 1;
					progB = clamp((elapsed - durA) / durB, 0, 1);
				} else {
					sim.playing = false;
					sim.didPlay = true;
					update();
				}
			}

			const drawLoop = (n, prog, color, offset, width) => {
				if (n === 0 || prog <= 0) return;
				const steps = Math.max(100, Math.round(180 * Math.abs(n)));
				ctx.save();
				ctx.beginPath();
				for (let i = 0; i <= steps; i++) {
					const u = (i / steps) * prog;
					const p = loopPoint(n, u, cx, cy, R, offset);
					if (i) ctx.lineTo(p.x, p.y); else ctx.moveTo(p.x, p.y);
				}
				ctx.strokeStyle = color;
				ctx.lineWidth = width;
				ctx.lineCap = 'round';
				ctx.shadowColor = color;
				ctx.shadowBlur = 18;
				ctx.stroke();
				ctx.restore();

				for (let k = 1; k <= 3; k++) {
					const u = (k / 4) * prog;
					const p1 = loopPoint(n, clamp(u - 0.004, 0, 1), cx, cy, R, offset);
					const p2 = loopPoint(n, clamp(u + 0.004, 0, 1), cx, cy, R, offset);
					arrowHead(ctx, p2.x, p2.y, Math.atan2(p2.y - p1.y, p2.x - p1.x), rgba(C.cream, 0.7), 5);
				}
			};

			drawLoop(sim.a, progA, C.amber, 0, 3.4);
			drawLoop(sim.b, progB, C.teal, off, 3.4);

			const labelLoop = (n, color, offset, text, u) => {
				if (n === 0) return;
				const p = loopPoint(n, u, cx, cy, R, offset);
				ctx.font = 'italic 19px Georgia, serif';
				ctx.fillStyle = color;
				ctx.textAlign = 'center';
				ctx.fillText(text, p.x, p.y - 13);
			};
			labelLoop(sim.a, rgba(C.amber, 0.95), 0, 'a', 0.3);
			labelLoop(sim.b, rgba(C.teal, 0.95), off, 'b', 0.3);

			glowOrb(ctx, cx, cy - R, 5, C.cream, 1);
			ctx.font = 'italic 14px Georgia, serif';
			ctx.fillStyle = rgba(C.cream, 0.55);
			ctx.textAlign = 'center';
			ctx.fillText('base', cx, cy - R - 20);

			if (sim.a === 0 && !sim.playing) {
				ctx.font = 'italic 14px Georgia, serif';
				ctx.fillStyle = rgba(C.amber, 0.85);
				ctx.textAlign = 'right';
				ctx.fillText('a = refl', cx - 14, cy - R + 24);
			}
			if (sim.b === 0 && !sim.playing) {
				ctx.font = 'italic 14px Georgia, serif';
				ctx.fillStyle = rgba(C.teal, 0.85);
				ctx.textAlign = 'left';
				ctx.fillText('b = refl', cx + 14, cy - R + 24);
			}

			if (sim.playing) {
				const n = phase === 'b' ? sim.b : sim.a;
				const prog = phase === 'b' ? progB : progA;
				const offset = phase === 'b' ? off : 0;
				const p = n === 0 ? { x: cx, y: cy - R } : loopPoint(n, prog, cx, cy, R, offset);
				glowOrb(ctx, p.x, p.y, 3.2, phase === 'b' ? C.teal : C.amber, 1);
			} else {
				const pulse = REDUCED ? 0.5 : 0.5 + 0.5 * Math.sin(time * 0.003);
				ctx.strokeStyle = rgba(C.cream, 0.12 + pulse * 0.1);
				ctx.lineWidth = 1;
				ctx.beginPath();
				ctx.arc(cx, cy - R, 11 + pulse * 3, 0, TAU);
				ctx.stroke();
			}

			if (sim.didPlay && !sim.playing) {
				const s = sim.a + sim.b;
				ctx.font = 'italic 16px Georgia, serif';
				ctx.fillStyle = rgba(C.cream, 0.82);
				ctx.textAlign = 'center';
				ctx.fillText(`a · b  ≃  ${signed(s)} turns`, cx, h - 22);
			}
		});

		sliderA.addEventListener('input', () => {
			sim.a = Number(sliderA.value);
			sim.playing = false;
			sim.didPlay = false;
			setRangeFill(sliderA);
			update();
		});
		sliderB.addEventListener('input', () => {
			sim.b = Number(sliderB.value);
			sim.playing = false;
			sim.didPlay = false;
			setRangeFill(sliderB);
			update();
		});

		playBtn.addEventListener('click', () => {
			sim.playing = true;
			sim.didPlay = false;
			sim.playT0 = performance.now();
			update();
		});

		resetBtn.addEventListener('click', () => {
			sim.a = 1;
			sim.b = 1;
			sim.playing = false;
			sim.didPlay = false;
			sliderA.value = '1';
			sliderB.value = '1';
			setRangeFill(sliderA);
			setRangeFill(sliderB);
			update();
		});

		setRangeFill(sliderA);
		setRangeFill(sliderB);
		update();
		stage.render(0);
	}

	// ── 05 · gluing the interval ────────────────────────────────
	function initHottGlueDemo() {
		const canvas = $('hott-glueCanvas');
		if (!canvas) return;
		const slider = $('hott-glueSlider');
		const tVal = $('hott-glueT');
		const playBtn = $('hott-gluePlay');
		const resetBtn = $('hott-glueReset');
		const readout = $('hott-glueReadout');
		const steps = $$('.hott-gstep', $('hott-glueSteps'));

		const sim = { t: 0, playing: false, t0: 0 };

		const update = () => {
			const t = sim.t;
			steps.forEach((el, i) => {
				const on = (i === 0 && t < 0.22) || (i === 1 && t >= 0.22 && t < 0.78) || (i === 2 && t >= 0.78);
				el.classList.toggle('is-on', on);
			});
			const merged = t >= 0.9;
			readout.innerHTML = `
				<div class="hott-ro"><span class="k">Type</span><span class="v acc">S¹ = [0,1] / (0 ~ 1)</span></div>
				<div class="hott-ro"><span class="k">Gluing</span><span class="v">${Math.round(t * 100)}%</span></div>
				<div class="hott-ro"><span class="k">Ends</span><span class="v">${merged ? 'identified' : 'separated'}</span></div>
				<div class="hott-ro"><span class="k">Loop</span><span class="v">${merged ? 'closed' : 'forming'}</span></div>
			`;
		};

		let lastRO = performance.now();

		const stage = makeStage(canvas, (ctx, w, h, time) => {
			const now = performance.now();
			if (sim.playing) {
				sim.t = clamp((now - sim.t0) / 2600, 0, 1);
				const v = Math.round(sim.t * 100);
				if (slider.value !== String(v)) {
					slider.value = String(v);
					setRangeFill(slider);
				}
				if (sim.t >= 1) sim.playing = false;
			}
			tVal.textContent = `${Math.round(sim.t * 100)}%`;

			dotGrid(ctx, w, h, C.sky, 0.05, 36);

			const L = Math.min(w * 0.64, 530);
			const y0 = h * 0.56;
			const R1 = L / TAU;
			const cx = w * 0.5;
			const theta = TAU * Math.max(sim.t, 0.0002);
			const R = L / theta;
			const pt = (s) => {
				if (sim.t < 1e-4) return { x: cx + L * (s - 0.5), y: y0 };
				const phi = theta * (s - 0.5);
				return {
					x: cx + R * Math.sin(phi),
					y: y0 + R * (1 - Math.cos(phi))
				};
			};

			ctx.save();
			ctx.strokeStyle = rgba(C.cream, 0.10);
			ctx.lineWidth = 1;
			ctx.beginPath();
			ctx.moveTo(cx - L * 0.55, y0);
			ctx.lineTo(cx + L * 0.55, y0);
			ctx.stroke();

			ctx.strokeStyle = rgba(C.sky, 0.18);
			ctx.setLineDash([3, 7]);
			ctx.beginPath();
			ctx.arc(cx, y0 + R1, R1, 0, TAU);
			ctx.stroke();
			ctx.restore();

			const pts = [];
			for (let i = 0; i <= 240; i++) pts.push(pt(i / 240));
			const grad = ctx.createLinearGradient(cx - L / 2, 0, cx + L / 2, 0);
			grad.addColorStop(0, C.amber);
			grad.addColorStop(0.48, C.rose);
			grad.addColorStop(1, C.teal);
			ctx.save();
			ctx.strokeStyle = grad;
			ctx.lineWidth = 3.4;
			ctx.lineCap = 'round';
			ctx.shadowColor = rgba(C.sky, 0.55);
			ctx.shadowBlur = 18;
			ctx.beginPath();
			pts.forEach((p, i) => i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y));
			ctx.stroke();
			ctx.restore();

			for (const s of [0.2, 0.5, 0.8]) {
				const a = pt(s - 0.003), b = pt(s + 0.003);
				if (Math.hypot(b.x - a.x, b.y - a.y) > 1) {
					arrowHead(ctx, b.x, b.y, Math.atan2(b.y - a.y, b.x - a.x), rgba(C.cream, 0.6), 4.5);
				}
			}

			const p0 = pt(0), p1 = pt(1);
			const dist = Math.hypot(p1.x - p0.x, p1.y - p0.y);
			if (dist < 16) {
				const mx = (p0.x + p1.x) / 2;
				const my = (p0.y + p1.y) / 2;
				const pulse = 0.5 + 0.5 * Math.sin(now * 0.006);
				ctx.strokeStyle = rgba(C.amber, 0.35 + pulse * 0.3);
				ctx.lineWidth = 1.4;
				ctx.beginPath();
				ctx.arc(mx, my, 16 + pulse * 6, 0, TAU);
				ctx.stroke();
				glowOrb(ctx, mx, my, 4.5, C.amber, 1);
				ctx.font = 'italic 16px Georgia, serif';
				ctx.fillStyle = rgba(C.cream, 0.85);
				ctx.textAlign = 'center';
				ctx.fillText('base', mx, my - 22);
			} else {
				glowOrb(ctx, p0.x, p0.y, 3.8, C.amber, 0.9);
				glowOrb(ctx, p1.x, p1.y, 3.8, C.teal, 0.9);
				ctx.font = 'italic 16px Georgia, serif';
				ctx.fillStyle = rgba(C.cream, 0.7);
				ctx.textAlign = 'center';
				ctx.fillText('0', p0.x, p0.y + 30);
				ctx.fillText('1', p1.x, p1.y + 30);
			}

			if (sim.t > 0.78) {
				const alpha = clamp((sim.t - 0.78) / 0.22, 0, 1);
				const q = pt(0.86);
				const q2 = pt(0.9);
				ctx.save();
				ctx.globalAlpha = alpha;
				arrowHead(ctx, q2.x, q2.y, Math.atan2(q2.y - q.y, q2.x - q.x), rgba(C.teal, 0.9), 6);
				ctx.font = 'italic 16px Georgia, serif';
				ctx.fillStyle = rgba(C.teal, 0.9);
				ctx.textAlign = 'left';
				ctx.fillText('loop', q2.x + 10, q2.y - 6);
				ctx.restore();
			}

			if (now - lastRO > 160) {
				lastRO = now;
				update();
			}
		});

		slider.addEventListener('input', () => {
			sim.playing = false;
			sim.t = Number(slider.value) / 100;
			setRangeFill(slider);
			tVal.textContent = `${slider.value}%`;
			update();
		});
		playBtn.addEventListener('click', () => {
			sim.t = 0;
			slider.value = '0';
			setRangeFill(slider);
			sim.playing = true;
			sim.t0 = performance.now();
			update();
		});
		resetBtn.addEventListener('click', () => {
			sim.playing = false;
			sim.t = 0;
			slider.value = '0';
			setRangeFill(slider);
			tVal.textContent = '0%';
			update();
		});

		setRangeFill(slider);
		update();
		stage.render(0);
	}

	// ── 06 · univalence ─────────────────────────────────────────
	function initHottUnivalenceDemo() {
		const wrap = $('hott-uvWrap');
		if (!wrap) return;
		const stateA = $('hott-uvStateA');
		const stateB = $('hott-uvStateB');
		const btnA = $('hott-uvBtnA');
		const btnB = $('hott-uvBtnB');
		const eq = $('hott-uvEq');
		const eqLabel = $('hott-uvEqLabel');
		const apply = $('hott-uvUnivalence');
		const reset = $('hott-uvReset');
		const banner = $('hott-uvBanner');
		const hint = $('hott-uvHint');
		const readout = $('hott-uvReadout');

		let on = false;
		let univalent = false;

		const render = () => {
			stateA.textContent = on ? 'ON' : 'OFF';
			stateB.textContent = on ? 'ODD' : 'EVEN';
			btnA.setAttribute('aria-pressed', on ? 'true' : 'false');
			btnB.setAttribute('aria-pressed', on ? 'true' : 'false');
			wrap.classList.toggle('is-univalent', univalent);
			banner.classList.toggle('show', univalent);
			eq.textContent = univalent ? '=' : '≃';
			eqLabel.textContent = univalent ? 'identity' : 'equivalence';
			apply.textContent = univalent ? 'Remove univalence' : 'Apply univalence';
			apply.setAttribute('aria-pressed', univalent ? 'true' : 'false');
			apply.classList.toggle('primary', !univalent);
			hint.innerHTML = univalent
				? 'The equivalence is now an identity. Both cards are two names for the same type — and because there is only one type, the state stays in sync.'
				: 'Both worlds have the same structure. Apply univalence to turn the equivalence into a path.';
			readout.innerHTML = `
				<div class="hott-ro"><span class="k">World A</span><span class="v">${on ? 'ON' : 'OFF'}</span></div>
				<div class="hott-ro"><span class="k">World B</span><span class="v">${on ? 'ODD' : 'EVEN'}</span></div>
				<div class="hott-ro"><span class="k">Relation</span><span class="v acc">${univalent ? 'A = B (ua)' : 'A ≃ B'}</span></div>
				<div class="hott-ro"><span class="k">Transport</span><span class="v">${univalent ? 'structure preserved' : 'bijection f'}</span></div>
			`;
		};

		const flip = () => {
			on = !on;
			render();
		};

		btnA.addEventListener('click', flip);
		btnB.addEventListener('click', flip);
		apply.addEventListener('click', () => {
			univalent = !univalent;
			render();
		});
		reset.addEventListener('click', () => {
			on = false;
			univalent = false;
			render();
		});

		render();
	}

	// ── 07 · transport on the Möbius strip ──────────────────────
	function initHottMobiusDemo() {
		const canvas = $('hott-mobiusCanvas');
		if (!canvas) return;
		const toggle = $('hott-mobiusToggle');
		const slider = $('hott-mobiusSlider');
		const tVal = $('hott-mobiusT');
		const playBtn = $('hott-mobiusPlay');
		const resetBtn = $('hott-mobiusReset');
		const dotEl = $('hott-mobiusDot');
		const gauge = $('hott-mobiusGauge');
		const readout = $('hott-mobiusReadout');

		const sim = {
			twist: true,
			u: 0,
			playing: false,
			t0: 0,
			drag: null,
			dragX: 0,
			dragY: 0
		};
		const R = 1.55;
		const WIDTH = 0.56;
		let lastRO = performance.now();

		const stage = makeStage(canvas, (ctx, w, h, time) => {
			const now = performance.now();
			if (sim.playing) {
				sim.u = clamp((now - sim.t0) / 6200, 0, 1);
				const v = Math.round(sim.u * 100);
				if (slider.value !== String(v)) {
					slider.value = String(v);
					setRangeFill(slider);
				}
				if (sim.u >= 1) sim.playing = false;
			}
			tVal.textContent = `${Math.round(sim.u * 100)}%`;

			const cx = w * 0.5;
			const cy = h * 0.5;
			const scale = Math.min(w, h) * 0.33;
			const cam = 4.35;
			const ax = -1.02 + sim.dragY;
			const ay = 0.35 + sim.dragX + (REDUCED ? 0 : time * 0.000045);

			const surf = (uu, vv) => {
				const a = uu * TAU;
				const half = sim.twist ? a / 2 : 0;
				const rr = R + vv * WIDTH * Math.cos(half);
				return rotate3(
					rr * Math.cos(a),
					rr * Math.sin(a),
					vv * WIDTH * Math.sin(half),
					ax, ay
				);
			};
			const proj = (p) => project3(p, cx, cy, scale, cam);

			const bg = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.min(w, h) * 0.72);
			bg.addColorStop(0, 'rgba(251,113,133,.07)');
			bg.addColorStop(0.5, 'rgba(167,139,250,.035)');
			bg.addColorStop(1, C.dark ? 'rgba(7,10,18,0)' : 'rgba(250,248,241,0)');
			ctx.fillStyle = bg;
			ctx.fillRect(0, 0, w, h);

			const NU = 122;
			const NV = 4;
			const grid = [];
			for (let i = 0; i <= NU; i++) {
				const row = [];
				for (let j = 0; j <= NV; j++) {
					const uu = i / NU;
					const vv = (j / NV) * 2 - 1;
					row.push({ p: surf(uu, vv), uu, vv });
				}
				grid.push(row);
			}
			const quads = [];
			for (let i = 0; i < NU; i++) {
				for (let j = 0; j < NV; j++) {
					const a = grid[i][j], b = grid[i + 1][j], c = grid[i + 1][j + 1], d = grid[i][j + 1];
					const pts = [a, b, c, d].map((q) => proj(q.p));
					const z = (pts[0].z + pts[1].z + pts[2].z + pts[3].z) / 4;
					quads.push({ pts, z, u: (i + 0.5) / NU, v: (j + 0.5) / NV });
				}
			}
			quads.sort((p, q) => q.z - p.z);

			for (const q of quads) {
				const depth = clamp(1.16 - (q.z - cam) * 0.16, 0.42, 1.12);
				const hue = 22 + q.u * 162;
				const light = clamp(43 + depth * 16, 38, 66);
				ctx.fillStyle = `hsla(${hue},70%,${light}%,.9)`;
				ctx.beginPath();
				ctx.moveTo(q.pts[0].x, q.pts[0].y);
				ctx.lineTo(q.pts[1].x, q.pts[1].y);
				ctx.lineTo(q.pts[2].x, q.pts[2].y);
				ctx.lineTo(q.pts[3].x, q.pts[3].y);
				ctx.closePath();
				ctx.fill();
				ctx.strokeStyle = `hsla(${hue},76%,${light + 9}%,.22)`;
				ctx.lineWidth = 0.55;
				ctx.stroke();
			}

			const edge = (vv, color, alpha, width) => {
				const list = [];
				for (let i = 0; i <= 180; i++) list.push(proj(surf(i / 180, vv)));
				ctx.save();
				ctx.strokeStyle = rgba(color, alpha);
				ctx.lineWidth = width;
				ctx.beginPath();
				list.forEach((p, i) => i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y));
				ctx.stroke();
				ctx.restore();
			};
			edge(-1, C.cream, 0.35, 1.2);
			edge(1, C.cream, 0.35, 1.2);
			edge(0, C.cream, 0.18, 0.8);

			const fiber = (uu, vv) => proj(surf(uu, vv));
			const drawFiber = (uu, color, alpha, dashed) => {
				const a = fiber(uu, -1.14);
				const b = fiber(uu, 1.14);
				const t0 = fiber(uu, 0);
				const t1 = fiber(uu, 0.88);
				ctx.save();
				ctx.strokeStyle = rgba(color, alpha);
				ctx.lineWidth = dashed ? 1.2 : 2.2;
				if (dashed) ctx.setLineDash([3, 5]);
				ctx.shadowColor = rgba(color, dashed ? 0 : 0.8);
				ctx.shadowBlur = dashed ? 0 : 14;
				ctx.beginPath();
				ctx.moveTo(a.x, a.y);
				ctx.lineTo(b.x, b.y);
				ctx.stroke();
				if (!dashed) {
					arrowHead(ctx, t1.x, t1.y, Math.atan2(t1.y - t0.y, t1.x - t0.x), rgba(color, 0.95), 6.5);
				}
				ctx.restore();
			};

			drawFiber(0, C.cream, 0.34, true);
			drawFiber(sim.u, C.amber, 0.95, false);
			const s0p = fiber(0, 0);
			const s1p = fiber(0, 0.88);
			arrowHead(ctx, s1p.x, s1p.y, Math.atan2(s1p.y - s0p.y, s1p.x - s0p.x), rgba(C.cream, 0.5), 5.5);

			const startP = fiber(0, 1.14);
			if (sim.u > 0.03) {
				ctx.font = 'italic 13px Georgia, serif';
				ctx.fillStyle = rgba(C.cream, 0.38);
				ctx.textAlign = 'center';
				ctx.fillText('start', startP.x, startP.y + 18);
			}
			const curP = fiber(sim.u, 1.18);
			ctx.font = 'italic 14px Georgia, serif';
			ctx.fillStyle = rgba(C.cream, 0.8);
			ctx.textAlign = 'center';
			ctx.fillText('fibre', curP.x, curP.y - 10);

			const vecAt = (uu) => {
				const a = surf(uu, 0);
				const b = surf(uu, 0.18);
				const dx = b.x - a.x, dy = b.y - a.y, dz = b.z - a.z;
				const len = Math.hypot(dx, dy, dz) || 1;
				return { x: dx / len, y: dy / len, z: dz / len };
			};
			const v0 = vecAt(0);
			const v1 = vecAt(sim.u);
			const dot = clamp(v0.x * v1.x + v0.y * v1.y + v0.z * v1.z, -1, 1);

			if (now - lastRO > 120) {
				lastRO = now;
				dotEl.textContent = `${dot >= 0 ? '+' : ''}${dot.toFixed(2)}`;
				gauge.style.left = `${50 + Math.min(0, dot) * 50}%`;
				gauge.style.width = `${Math.abs(dot) * 50}%`;
				const flipped = sim.twist && dot < -0.9;
				const status = flipped
					? 'mirrored'
					: (sim.twist ? (sim.u > 0.85 ? 'almost mirrored' : 'travelling') : 'unchanged');
				readout.innerHTML = `
					<div class="hott-ro"><span class="k">Surface</span><span class="v acc">${sim.twist ? 'Möbius strip' : 'cylinder'}</span></div>
					<div class="hott-ro"><span class="k">Position</span><span class="v">${Math.round(sim.u * 100)}%</span></div>
					<div class="hott-ro"><span class="k">Fibre · start</span><span class="v">${dot >= 0 ? '+' : ''}${dot.toFixed(2)}</span></div>
					<div class="hott-ro"><span class="k">Status</span><span class="v">${status}</span></div>
				`;
			}
		});

		const updateControls = () => {
			toggle.classList.toggle('is-active', sim.twist);
			toggle.textContent = sim.twist ? 'Möbius strip' : 'Cylinder';
			toggle.setAttribute('aria-pressed', sim.twist ? 'true' : 'false');
			tVal.textContent = `${Math.round(sim.u * 100)}%`;
		};

		toggle.addEventListener('click', () => {
			sim.twist = !sim.twist;
			updateControls();
		});

		slider.addEventListener('input', () => {
			sim.playing = false;
			sim.u = Number(slider.value) / 100;
			setRangeFill(slider);
			updateControls();
		});

		playBtn.addEventListener('click', () => {
			sim.u = 0;
			slider.value = '0';
			setRangeFill(slider);
			sim.playing = true;
			sim.t0 = performance.now();
			updateControls();
		});

		resetBtn.addEventListener('click', () => {
			sim.playing = false;
			sim.u = 0;
			sim.dragX = 0;
			sim.dragY = 0;
			slider.value = '0';
			setRangeFill(slider);
			updateControls();
		});

		canvas.addEventListener('pointerdown', (e) => {
			sim.drag = { x: e.clientX, y: e.clientY };
			try { canvas.setPointerCapture(e.pointerId); } catch (_) { /* ignore */ }
			canvas.style.cursor = 'grabbing';
		});
		canvas.addEventListener('pointermove', (e) => {
			if (!sim.drag) return;
			const dx = e.clientX - sim.drag.x;
			const dy = e.clientY - sim.drag.y;
			sim.drag.x = e.clientX;
			sim.drag.y = e.clientY;
			sim.dragX = clamp(sim.dragX + dx * 0.007, -1.2, 1.2);
			sim.dragY = clamp(sim.dragY + dy * 0.006, -0.55, 0.55);
		});
		const endDrag = () => {
			sim.drag = null;
			canvas.style.cursor = 'grab';
		};
		canvas.addEventListener('pointerup', endDrag);
		canvas.addEventListener('pointercancel', endDrag);
		canvas.style.cursor = 'grab';

		setRangeFill(slider);
		updateControls();
		stage.render(0);
	}

	// ── bootstrap ───────────────────────────────────────────────
	let inited = false;
	function initHottGeometryDemos() {
		if (inited) return;
		inited = true;

		initHottSpaceDemo();
		initHottPathDemo();
		initHottSurfaceDemo();
		initHottLoopDemo();
		initHottGlueDemo();
		initHottUnivalenceDemo();
		initHottMobiusDemo();

		if (window.__MN_DARK && window.__MN_DARK.onChange) {
			window.__MN_DARK.onChange(() => {
				C = hottDemoPalette();
			});
		}
	}

	if (document.readyState === 'complete') {
		initHottGeometryDemos();
	} else {
		window.addEventListener('blogPostLoadComplete', initHottGeometryDemos, { once: true });
		// Fallback in case the event is missed.
		window.addEventListener('load', () => setTimeout(initHottGeometryDemos, 60), { once: true });
	}
})();
