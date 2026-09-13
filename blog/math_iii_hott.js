/* ══════════════════════════════════════════════════════════════════
   HoTT interactive lab — woven into Math III ("Type Theory and
   Homotopy Type Theory (for the curious)").
   Ported (and translated to English) from test/hott_ai.html.

   Conventions followed from the rest of this blog:
   - Theme-aware:  isDarkMode() / themeColor() / __MN_DARK.onChange()
   - Math via the blog's own renderer (temml), not KaTeX.
   - Three.js + Plotly are already loaded globally by load_base_js().
   - Everything initialises on `blogPostLoadComplete`, i.e. AFTER
     initOptionalBlocks() has restructured the .optional.md block, so
     every element reference points at the final DOM node.
   - The demo lives inside a collapsed optional box, so 2D canvases use
     fixed intrinsic sizes (safe while hidden) and the WebGL (Three.js)
     + Plotly pieces init lazily the first time the box is expanded.
   ══════════════════════════════════════════════════════════════════ */
(function () {
	'use strict';

	// ── tiny utils ────────────────────────────────────────────────
	const $ = (id) => document.getElementById(id);
	const lerp = (a, b, t) => a + (b - a) * t;
	const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
	const TAU = Math.PI * 2;

	// Theme-aware palette. Light mode uses deeper, saturated fills so the
	// line work stays legible on the cream paper; dark mode uses the
	// original gl-on-navy look.
	function pal() {
		const dark = (typeof isDarkMode === 'function') ? isDarkMode() : true;
		return dark ? {
			dark: true,
			bg: '#060812', panel: '#151b2e',
			ink: '#e8ecf7', ink2: '#a0aec8',
			accent: '#7c9cff', accent2: '#c084fc',
			good: '#4ade80', warn: '#fbbf24', bad: '#f87171',
			line: '#2a3350', amber: '#fbbf24',
			glow: 'rgba(124,156,255,',
		} : {
			dark: false,
			bg: '#ffffff', panel: '#f4f1e9',
			ink: '#1e293b', ink2: '#5b6472',
			accent: '#4f46e5', accent2: '#9333ea',
			good: '#15803d', warn: '#b45309', bad: '#dc2626',
			line: '#d8cfc0', amber: '#b45309',
			glow: 'rgba(79,70,229,',
		};
	}

	// Render a LaTeX string with the blog's temml engine.
	function hottTex(el, s, display) {
		if (!el) return;
		try {
			if (window.temml && temml.renderToString) {
				el.innerHTML = temml.renderToString(s, { displayMode: !!display });
			} else {
				el.textContent = s;
			}
		} catch (e) {
			el.textContent = s;
		}
	}

	// ── component registry ────────────────────────────────────────
	// Each component pushes a redraw() (and, where applicable, an onTheme
	// hook) so we can repaint everything on a theme flip or an expand.
	const redraws = [];
	const lazyInits = [];

	// Is the whole lab currently visible (optional box expanded)?
	let wrap = null;
	function labVisible() {
		if (!wrap) return false;
		const oc = wrap.closest('.optional-content');
		if (oc && getComputedStyle(oc).display === 'none') return false;
		return wrap.clientWidth > 0;
	}

	// ══════════════════════════════════════════════════════════════
	// 0 · Motivation — the three core problems of today's AI
	// ══════════════════════════════════════════════════════════════
	function buildMotivation() {
		const c = $('hott-probCanvas'); if (!c) return;
		const ctx = c.getContext('2d');
		const txt = $('hott-probText');
		const steps = document.querySelectorAll('#hott-probSteps .hott-step');
		let active = 0;
		const stories = [
			'A neural network classifies images — but nobody knows why it reads this picture as "a cat". Millions of weights, no explanation.',
			'A tiny, human-invisible patch of pixel noise — and the self-driving AI suddenly reads the panda as a "gibbon". There is no safety net.',
			'For safety-critical systems (medicine, autonomous driving) "works on the 10,000 test cases" is not enough. We need mathematical proofs.'
		];
		steps.forEach(s => s.onclick = () => {
			steps.forEach(x => x.classList.remove('active'));
			s.classList.add('active');
			active = +s.dataset.p;
			if (txt) txt.textContent = stories[active];
			draw();
		});
		if (txt) txt.textContent = stories[0];

		let t = 0;
		function draw() {
			const P = pal();
			ctx.fillStyle = P.bg; ctx.fillRect(0, 0, c.width, c.height);
			const W = c.width, H = c.height;
			if (active === 0) {
				const cx = W / 2, cy = H / 2;
				for (let i = 0; i < 5; i++) {
					const y = cy - 120 + i * 60;
					ctx.fillStyle = P.accent; ctx.beginPath(); ctx.arc(cx - 320, y, 8, 0, TAU); ctx.fill();
					ctx.strokeStyle = P.glow + '0.3)';
					ctx.beginPath(); ctx.moveTo(cx - 312, y); ctx.lineTo(cx - 140, cy); ctx.stroke();
				}
				ctx.fillStyle = P.panel; ctx.strokeStyle = P.line;
				ctx.fillRect(cx - 140, cy - 90, 280, 180); ctx.strokeRect(cx - 140, cy - 90, 280, 180);
				for (let i = 0; i < 40; i++) {
					const x = cx - 130 + Math.random() * 260, y = cy - 80 + Math.random() * 160;
					ctx.fillStyle = `rgba(${Math.random() * 255},${Math.random() * 255},255,0.3)`;
					ctx.fillRect(x, y, 3, 3);
				}
				ctx.fillStyle = P.bad; ctx.font = 'bold 22px sans-serif'; ctx.textAlign = 'center';
				ctx.fillText('? ? ?', cx, cy + 8);
				ctx.fillStyle = P.ink2; ctx.font = '12px sans-serif';
				ctx.fillText('black box', cx, cy + 40);
				ctx.fillStyle = P.accent2; ctx.beginPath(); ctx.arc(cx + 280, cy, 14, 0, TAU); ctx.fill();
				ctx.strokeStyle = P.glow + '0.4)';
				ctx.beginPath(); ctx.moveTo(cx + 140, cy); ctx.lineTo(cx + 266, cy); ctx.stroke();
				ctx.fillStyle = P.ink; ctx.font = '14px sans-serif';
				ctx.fillText('"cat"', cx + 280, cy + 35);
			} else if (active === 1) {
				const cy = H / 2;
				ctx.fillStyle = P.panel;
				ctx.fillRect(80, cy - 90, 180, 180);
				ctx.fillStyle = P.ink; ctx.font = '60px sans-serif'; ctx.textAlign = 'center';
				ctx.fillText('\uD83D\uDC3C', 170, cy + 20);
				ctx.fillStyle = P.good; ctx.font = '14px sans-serif';
				ctx.fillText('\u2192 Panda \u2713', 170, cy + 120);
				ctx.fillStyle = P.ink; ctx.font = '40px sans-serif'; ctx.fillText('+', 310, cy + 15);
				ctx.fillStyle = P.panel; ctx.fillRect(360, cy - 90, 180, 180);
				for (let i = 0; i < 300; i++) {
					const shift = Math.sin(t * 2 + i) * 3;
					ctx.fillStyle = `rgba(${Math.random() * 255},${Math.random() * 255},${Math.random() * 255},0.5)`;
					ctx.fillRect(360 + Math.random() * 180 + shift, cy - 90 + Math.random() * 180, 2, 2);
				}
				ctx.fillStyle = P.ink2; ctx.font = '14px sans-serif';
				ctx.fillText('invisible noise', 450, cy + 120);
				ctx.fillStyle = P.ink; ctx.font = '40px sans-serif'; ctx.fillText('=', 590, cy + 15);
				ctx.fillStyle = P.panel; ctx.fillRect(640, cy - 90, 180, 180);
				ctx.fillStyle = P.ink; ctx.font = '60px sans-serif';
				ctx.fillText('\uD83D\uDC3C', 730, cy + 20);
				ctx.fillStyle = P.bad; ctx.font = '14px sans-serif';
				ctx.fillText('\u2192 Gibbon \u2717', 730, cy + 120);
			} else {
				ctx.fillStyle = P.ink; ctx.font = '16px sans-serif'; ctx.textAlign = 'center';
				ctx.fillText('Test universe of all possible inputs', W / 2, 40);
				const N = 400;
				for (let i = 0; i < N; i++) {
					const angle = i / N * TAU + t * 0.1;
					const r = 100 + Math.sin(i * 7.3) * 50;
					const x = W / 2 + Math.cos(angle) * r * 1.5;
					const y = H / 2 + Math.sin(angle) * r * 0.8;
					const tested = (i % 23 === 0);
					ctx.fillStyle = tested ? P.good : 'rgba(120,120,150,0.3)';
					ctx.beginPath(); ctx.arc(x, y, tested ? 3 : 1.5, 0, TAU); ctx.fill();
				}
				ctx.fillStyle = P.good; ctx.font = '13px sans-serif';
				ctx.fillText('\u25CF tested inputs (finitely many)', W / 2, H - 40);
				ctx.fillStyle = P.ink2;
				ctx.fillText('\u25CF untested (infinitely many) \u2014 what happens there?', W / 2, H - 20);
			}
		}
		redraws.push(draw);
		(function loop() {
			t += 0.015;
			if (labVisible()) draw();
			requestAnimationFrame(loop);
		})();
	}

	// ══════════════════════════════════════════════════════════════
	// 1 · Types — type checker + Curry-Howard
	// ══════════════════════════════════════════════════════════════
	function buildTypes() {
		const val = $('hott-tcVal'), fun = $('hott-tcFun'), res = $('hott-tcResult');
		if (val && fun && res) {
			const valTypes = { int: '\u2124', str: 'String', bool: 'Bool', img: 'Image' };
			const valLbls = { int: '42', str: '"hello"', bool: 'true', img: '\uD83D\uDDBC\uFE0F' };
			const funs = {
				succ: { inp: '\u2124', out: '\u2124', name: 'succ' },
				len: { inp: 'String', out: '\u2124', name: 'length' },
				not: { inp: 'Bool', out: 'Bool', name: 'not' },
				classify: { inp: 'Image', out: 'Label', name: 'classify' }
			};
			function upd() {
				const v = val.value, f = fun.value;
				const vt = valTypes[v], ft = funs[f];
				const ok = vt === ft.inp;
				if (ok) {
					res.innerHTML =
						`<span style="color:${pal().good}">\u2713 TYPE CHECK PASSED</span>\n\n` +
						`${ft.name}(${valLbls[v]})  :  ${ft.out}\n\n` +
						`<span style="color:${pal().ink2}">The function expects ${ft.inp}, gets ${vt}. It fits.</span>`;
				} else {
					res.innerHTML =
						`<span style="color:${pal().bad}">\u2717 TYPE ERROR</span>\n\n` +
						`${ft.name} expects <b>${ft.inp}</b>\ngot: <b>${vt}</b>\n\n` +
						`<span style="color:${pal().ink2}>The compiler refuses to run the program. The error is caught at compile time.</span>`;
				}
			}
			val.onchange = upd; fun.onchange = upd; upd();
			redraws.push(upd);
		}

		const s = $('hott-chSlider'), lab = $('hott-chVal'), logic = $('hott-chLogic'), type = $('hott-chType');
		if (s && logic && type) {
			const items = [
				{ name: 'A \u2227 B', logic: 'A \u2227 B (A and B)', type: 'A \u00D7 B  (product type)', desc: 'A proof of A\u2227B = a pair (a proof of A, a proof of B)' },
				{ name: 'A \u2228 B', logic: 'A \u2228 B (A or B)', type: 'A + B  (sum type)', desc: 'A proof of A\u2228B = either a proof of A or a proof of B' },
				{ name: 'A \u21D2 B', logic: 'A \u21D2 B (A implies B)', type: 'A \u2192 B  (function type)', desc: 'A proof of A\u21D2B = a function turning every proof of A into a proof of B' },
				{ name: '\u2200x. P(x)', logic: '\u2200x. P(x)', type: '\u03A0(x:X). P(x)  (dep. product)', desc: 'A proof of "for all x, P(x)" = a function giving, for each x, a proof of P(x)' }
			];
			function upd() {
				const it = items[+s.value];
				if (lab) lab.textContent = it.name;
				logic.innerHTML = it.logic + `<div style="color:${pal().ink2};font-size:.85rem;margin-top:.6rem">A statement of classical logic</div>`;
				type.innerHTML = it.type + `<div style="color:${pal().ink2};font-size:.85rem;margin-top:.6rem;font-family:sans-serif">` + it.desc + '</div>';
			}
			s.oninput = upd; upd();
			redraws.push(upd);
		}
	}

	// ══════════════════════════════════════════════════════════════
	// 2 · Homotopy — deform two paths + the hole that blocks it
	// ══════════════════════════════════════════════════════════════
	function buildHomotopy() {
		const c = $('hott-homoCanvas'); if (!c) return;
		const ctx = c.getContext('2d');
		const def = $('hott-def'), defV = $('hott-defVal'), shape = $('hott-shape'), shapeV = $('hott-shapeVal');
		const shapes = ['Arc', 'Zigzag', 'Wave'];
		function pathFn(x, kind) {
			if (kind === 0) return -Math.sin(x * Math.PI) * 100;
			if (kind === 1) return -Math.abs(((x * 4) % 1) - 0.5) * 160 + 40;
			return Math.sin(x * Math.PI * 3) * 70;
		}
		function draw() {
			const P = pal();
			ctx.fillStyle = P.bg; ctx.fillRect(0, 0, c.width, c.height);
			const W = c.width, H = c.height;
			const y0 = H / 2 + 80;
			const x0 = 100, x1 = W - 100;
			const t = +def.value; if (defV) defV.textContent = t.toFixed(2);
			const sh = +shape.value; if (shapeV) shapeV.textContent = shapes[sh];
			ctx.strokeStyle = P.accent; ctx.lineWidth = 3;
			ctx.beginPath();
			for (let i = 0; i <= 100; i++) {
				const u = i / 100, x = lerp(x0, x1, u), y = y0 + pathFn(u, 0);
				if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
			}
			ctx.stroke();
			ctx.strokeStyle = P.accent2; ctx.lineWidth = 3;
			ctx.beginPath();
			for (let i = 0; i <= 100; i++) {
				const u = i / 100, x = lerp(x0, x1, u), y = y0 + pathFn(u, sh);
				if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
			}
			ctx.stroke();
			for (let k = 1; k <= 6; k++) {
				const alpha = k / 7 * t;
				if (alpha < 0.02) continue;
				ctx.strokeStyle = `rgba(${P.dark ? '255,255,255' : '30,41,59'},${0.05 + alpha * 0.15})`; ctx.lineWidth = 1;
				ctx.beginPath();
				const tk = (k / 7);
				for (let i = 0; i <= 100; i++) {
					const u = i / 100, x = lerp(x0, x1, u), y = y0 + lerp(pathFn(u, 0), pathFn(u, sh), tk * t);
					if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
				}
				ctx.stroke();
			}
			ctx.strokeStyle = `rgba(${P.dark ? '255,255,255' : '30,41,59'},${0.4 + t * 0.5})`; ctx.lineWidth = 2.5;
			ctx.beginPath();
			for (let i = 0; i <= 100; i++) {
				const u = i / 100, x = lerp(x0, x1, u), y = y0 + lerp(pathFn(u, 0), pathFn(u, sh), t);
				if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
			}
			ctx.stroke();
			ctx.fillStyle = P.amber;
			ctx.beginPath(); ctx.arc(x0, y0, 9, 0, TAU); ctx.fill();
			ctx.beginPath(); ctx.arc(x1, y0, 9, 0, TAU); ctx.fill();
			ctx.fillStyle = P.ink; ctx.font = '14px sans-serif'; ctx.textAlign = 'center';
			ctx.fillText('a', x0, y0 + 30); ctx.fillText('b', x1, y0 + 30);
			ctx.textAlign = 'left'; ctx.font = '13px sans-serif';
			ctx.fillStyle = P.accent; ctx.fillText('\u2014 start path p', 20, 30);
			ctx.fillStyle = P.accent2; ctx.fillText('\u2014 target path q', 20, 50);
			ctx.fillStyle = P.ink2; ctx.fillText('\u2014 current deformation H(t)', 20, 70);
		}
		if (def) def.oninput = draw;
		if (shape) shape.oninput = draw;
		redraws.push(draw); draw();

		const hc = $('hott-holeCanvas');
		if (hc) {
			const hctx = hc.getContext('2d');
			const s = $('hott-hole'), v = $('hott-holeVal'), st = $('hott-holeStatus');
			function drawHole() {
				const P = pal();
				hctx.fillStyle = P.bg; hctx.fillRect(0, 0, hc.width, hc.height);
				const W = hc.width, H = hc.height;
				const cx = W / 2, cy = H / 2 + 10;
				const t = +s.value; if (v) v.textContent = t.toFixed(2);
				hctx.fillStyle = P.panel; hctx.strokeStyle = P.bad; hctx.lineWidth = 2;
				hctx.beginPath(); hctx.arc(cx, cy, 45, 0, TAU); hctx.fill(); hctx.stroke();
				hctx.fillStyle = P.bad; hctx.font = '11px sans-serif'; hctx.textAlign = 'center';
				hctx.fillText('HOLE', cx, cy + 4);
				const ax = cx - 140, ay = cy, bx = cx + 140, by = cy;
				hctx.strokeStyle = P.accent; hctx.lineWidth = 3;
				hctx.beginPath();
				for (let i = 0; i <= 100; i++) {
					const u = i / 100, x = lerp(ax, bx, u), y = ay - Math.sin(u * Math.PI) * 90;
					if (i === 0) hctx.moveTo(x, y); else hctx.lineTo(x, y);
				}
				hctx.stroke();
				hctx.strokeStyle = P.accent2; hctx.lineWidth = 3;
				hctx.beginPath();
				for (let i = 0; i <= 100; i++) {
					const u = i / 100, x = lerp(ax, bx, u), y = ay + Math.sin(u * Math.PI) * 90;
					if (i === 0) hctx.moveTo(x, y); else hctx.lineTo(x, y);
				}
				hctx.stroke();
				if (t > 0) {
					hctx.strokeStyle = `rgba(${P.dark ? '255,255,255' : '30,41,59'},${0.5 + t * 0.4})`; hctx.lineWidth = 2;
					hctx.beginPath();
					let hit = false;
					for (let i = 0; i <= 100; i++) {
						const u = i / 100, x = lerp(ax, bx, u);
						const y = ay + lerp(-Math.sin(u * Math.PI) * 90, Math.sin(u * Math.PI) * 90, t);
						if (Math.hypot(x - cx, y - cy) < 45) hit = true;
						if (i === 0) hctx.moveTo(x, y); else hctx.lineTo(x, y);
					}
					hctx.stroke();
					if (st) st.innerHTML = (hit && t > 0.15 && t < 0.85)
						? `<span style="color:${P.bad}">\u2717 Collision! The deformation attempt hits the hole \u2014 no homotopy.</span>`
						: `<span style="color:${P.ink2}">Trying to deform\u2026</span>`;
				} else if (st) {
					st.innerHTML = `<span style="color:${P.ink2}">Two paths around the same hole \u2014 top and bottom route. Are they homotopic?</span>`;
				}
				hctx.fillStyle = P.amber;
				hctx.beginPath(); hctx.arc(ax, ay, 7, 0, TAU); hctx.fill();
				hctx.beginPath(); hctx.arc(bx, by, 7, 0, TAU); hctx.fill();
			}
			if (s) s.oninput = drawHole;
			redraws.push(drawHole); drawHole();
		}
	}

	// ══════════════════════════════════════════════════════════════
	// 3 · Identity types — equality is a path
	// ══════════════════════════════════════════════════════════════
	function buildIdentity() {
		const c = $('hott-idCanvas'); if (!c) return;
		const ctx = c.getContext('2d');
		const nS = $('hott-idN'), nV = $('hott-idNVal'), math = $('hott-idMath'), anim = $('hott-idAnim');
		let anT = 0, running = false;
		function draw() {
			const P = pal();
			ctx.fillStyle = P.bg; ctx.fillRect(0, 0, c.width, c.height);
			const W = c.width, H = c.height;
			const n = +nS.value; if (nV) nV.textContent = n;
			const ax = 180, bx = W - 180, cy = H / 2;
			ctx.strokeStyle = P.glow + '0.25)'; ctx.lineWidth = 2;
			ctx.setLineDash([4, 4]);
			ctx.beginPath(); ctx.ellipse(W / 2, cy, W / 2 - 40, H / 2 - 30, 0, 0, TAU); ctx.stroke();
			ctx.setLineDash([]);
			ctx.fillStyle = P.accent; ctx.font = '14px sans-serif'; ctx.textAlign = 'left';
			ctx.fillText('Type A', 30, 30);
			for (let k = 0; k < n; k++) {
				const spread = n === 1 ? 0 : (k / (n - 1) - 0.5);
				const amp = spread * 110;
				ctx.strokeStyle = `hsla(${210 + k * 30},70%,${P.dark ? '65' : '45'}%,0.85)`;
				ctx.lineWidth = 2.5;
				ctx.beginPath();
				for (let i = 0; i <= 100; i++) {
					const u = i / 100, x = lerp(ax, bx, u), y = cy + Math.sin(u * Math.PI) * amp;
					if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
				}
				ctx.stroke();
				ctx.fillStyle = `hsla(${210 + k * 30},70%,${P.dark ? '75' : '40'}%,0.9)`;
				ctx.font = '12px monospace';
				const midX = (ax + bx) / 2, midY = cy + Math.sin(Math.PI / 2) * amp;
				const sub = ['', '\u2081', '\u2082', '\u2083', '\u2084'][k] || k;
				ctx.fillText('p' + sub, midX - 8, midY - (amp >= 0 ? 8 : -16));
				if (running) {
					const u = (anT + k * 0.15) % 1, x = lerp(ax, bx, u), y = cy + Math.sin(u * Math.PI) * amp;
					ctx.fillStyle = P.dark ? '#fff' : '#1e293b';
					ctx.beginPath(); ctx.arc(x, y, 5, 0, TAU); ctx.fill();
				}
			}
			ctx.fillStyle = P.amber;
			ctx.beginPath(); ctx.arc(ax, cy, 11, 0, TAU); ctx.fill();
			ctx.beginPath(); ctx.arc(bx, cy, 11, 0, TAU); ctx.fill();
			ctx.fillStyle = P.ink; ctx.font = 'bold 14px sans-serif'; ctx.textAlign = 'center';
			ctx.fillText('a', ax, cy + 5); ctx.fillText('b', bx, cy + 5);
			if (math) {
				const eq = n === 1
					? '\\text{Id}_A(a,b) \\ni p_0'
					: `\\text{Id}_A(a,b) \\ni p_0, p_1${n > 2 ? ', p_2' : ''}${n > 3 ? ', p_3' : ''}${n > 4 ? ', p_4' : ''}`;
				hottTex(math, eq + ' \\qquad \\text{each path is a "proof of equality"}', true);
			}
		}
		if (nS) nS.oninput = draw;
		if (anim) anim.onclick = () => {
			running = !running;
			anim.textContent = running ? 'Path animation \u23F8' : 'Path animation \u25B6';
		};
		redraws.push(draw);
		(function loop() {
			if (running && labVisible()) { anT = (anT + 0.006) % 1; draw(); }
			requestAnimationFrame(loop);
		})();
		draw();
	}

	// ══════════════════════════════════════════════════════════════
	// 4 · Higher dimensions — the tower of equalities (Three.js)
	// ══════════════════════════════════════════════════════════════
	function buildHigher() {
		const container = $('hott-higher3d'); if (!container || typeof THREE === 'undefined') return;
		const dimS = $('hott-dim'), rotS = $('hott-rot');
		let scene, camera, renderer, g0, g1, g2, g3, paths, rotx = 0.2, roty = 0.5, drag = false, lx = 0, ly = 0;

		function build() {
			scene = new THREE.Scene();
			scene.background = new THREE.Color(pal().dark ? 0x050710 : 0xf1f5f9);
			camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
			renderer = new THREE.WebGLRenderer({ antialias: true });
			container.appendChild(renderer.domElement);
			scene.add(new THREE.AmbientLight(0xffffff, 0.6));
			const l = new THREE.DirectionalLight(0xffffff, 0.8); l.position.set(3, 5, 4); scene.add(l);
			g0 = new THREE.Group(); g1 = new THREE.Group(); g2 = new THREE.Group(); g3 = new THREE.Group();
			scene.add(g0, g1, g2, g3);
			const pA = new THREE.Vector3(-1.5, 0, 0), pB = new THREE.Vector3(1.5, 0, 0);
			function ball(pos, color, r) {
				const m = new THREE.Mesh(new THREE.SphereGeometry(r, 24, 16),
					new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 0.4 }));
				m.position.copy(pos); return m;
			}
			g0.add(ball(pA, 0xfbbf24, 0.16)); g0.add(ball(pB, 0xfbbf24, 0.16));
			function pathCurve(by, bz) { return new THREE.QuadraticBezierCurve3(pA, new THREE.Vector3(0, by, bz), pB); }
			const params = [{ y: 0.9, z: 0, c: 0x7c9cff }, { y: -0.9, z: 0, c: 0xc084fc }, { y: 0, z: 0.9, c: 0x4ade80 }];
			paths = params.map(p => {
				const curve = pathCurve(p.y, p.z);
				const mesh = new THREE.Mesh(new THREE.TubeGeometry(curve, 60, 0.035, 8, false),
					new THREE.MeshStandardMaterial({ color: p.c, emissive: p.c, emissiveIntensity: 0.3 }));
				g1.add(mesh); return { curve, c: p.c };
			});
			function surface(c1, c2, color) {
				const N = 30, M = 12, verts = [], idx = [];
				for (let i = 0; i < N; i++) for (let j = 0; j < M; j++) {
					const u = i / (N - 1), v = j / (M - 1);
					const p = new THREE.Vector3().lerpVectors(c1.getPoint(u), c2.getPoint(u), v);
					verts.push(p.x, p.y, p.z);
				}
				for (let i = 0; i < N - 1; i++) for (let j = 0; j < M - 1; j++) {
					const a = i * M + j, b = i * M + j + 1, cc = (i + 1) * M + j, d = (i + 1) * M + j + 1;
					idx.push(a, b, cc, b, d, cc);
				}
				const geo = new THREE.BufferGeometry();
				geo.setAttribute('position', new THREE.Float32BufferAttribute(verts, 3));
				geo.setIndex(idx); geo.computeVertexNormals();
				return new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color, transparent: true, opacity: 0.35, side: THREE.DoubleSide, emissive: color, emissiveIntensity: 0.15 }));
			}
			g2.add(surface(paths[0].curve, paths[1].curve, 0xff80c0));
			g2.add(surface(paths[0].curve, paths[2].curve, 0x80f0ff));
			(function volume() {
				const c1 = paths[0].curve, c2 = paths[1].curve, c3 = paths[2].curve;
				const N = 20, M = 10, K = 6, verts = [], idx = [], pts = [];
				for (let k = 0; k < K; k++) for (let i = 0; i < N; i++) {
					const u = i / (N - 1), w = k / (K - 1);
					const p = new THREE.Vector3()
						.addScaledVector(c1.getPoint(u), (1 - w) * 0.5)
						.addScaledVector(c2.getPoint(u), (1 - w) * 0.5)
						.addScaledVector(c3.getPoint(u), w);
					p.y += Math.sin(u * Math.PI) * w * 0.3; pts.push(p);
				}
				pts.forEach(p => verts.push(p.x, p.y, p.z));
				for (let k = 0; k < K - 1; k++) for (let i = 0; i < N - 1; i++) {
					const a = k * N + i, b = k * N + i + 1, cc = (k + 1) * N + i, d = (k + 1) * N + i + 1;
					idx.push(a, b, cc, b, d, cc);
				}
				const geo = new THREE.BufferGeometry();
				geo.setAttribute('position', new THREE.Float32BufferAttribute(verts, 3));
				geo.setIndex(idx); geo.computeVertexNormals();
				g3.add(new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color: 0xffd580, transparent: true, opacity: 0.22, side: THREE.DoubleSide })));
			})();
			if (dimS) dimS.oninput = updateDim;
			updateDim();
			container.addEventListener('mousedown', (e) => { drag = true; lx = e.clientX; ly = e.clientY; container.style.cursor = 'grabbing'; });
			window.addEventListener('mouseup', () => { drag = false; container.style.cursor = 'grab'; });
			window.addEventListener('mousemove', (e) => {
				if (!drag) return;
				roty += (e.clientX - lx) * 0.01; rotx += (e.clientY - ly) * 0.01;
				rotx = clamp(rotx, -1.2, 1.2); lx = e.clientX; ly = e.clientY;
			});
			(function animate() {
				const auto = rotS ? +rotS.value : 0.3;
				if (rotS && $('hott-rotVal')) $('hott-rotVal').textContent = auto < 0.05 ? 'off' : auto.toFixed(2);
				roty += auto * 0.005;
				if (labVisible()) {
					const r = 6;
					camera.position.x = Math.cos(roty) * Math.cos(rotx) * r;
					camera.position.z = Math.sin(roty) * Math.cos(rotx) * r;
					camera.position.y = Math.sin(rotx) * r + 1;
					camera.lookAt(0, 0, 0);
					renderer.render(scene, camera);
				}
				requestAnimationFrame(animate);
			})();
		}
		function updateDim() {
			if (!g0) return;
			const d = +dimS.value; if (dimS && $('hott-dimVal')) $('hott-dimVal').textContent = d;
			g0.visible = true; g1.visible = d >= 1; g2.visible = d >= 2; g3.visible = d >= 3;
		}
		function resize() {
			const w = container.clientWidth, h = container.clientHeight;
			if (!w || !h) return;
			renderer.setSize(w, h); camera.aspect = w / h; camera.updateProjectionMatrix();
		}
		lazyInits.push(() => { build(); resize(); });
		redraws.push(() => { if (scene) { scene.background = new THREE.Color(pal().dark ? 0x050710 : 0xf1f5f9); resize(); } });
	}

	// ══════════════════════════════════════════════════════════════
	// 5 · Formal verification — three scenarios from the paper
	// ══════════════════════════════════════════════════════════════
	function buildVerify() {
		const steps = document.querySelectorAll('#hott-vSteps .hott-step');
		const c = $('hott-vCanvas'); if (!c) return;
		const ctx = c.getContext('2d');
		const title = $('hott-vTitle'), desc = $('hott-vDesc'), math = $('hott-vMath'), explain = $('hott-vExplain');
		let active = 0;
		const cases = [
			{
				title: '\uD83D\uDD12 Differential privacy',
				desc: 'An algorithm processes sensitive user data. We want to prove: even knowing the output, no single user can be identified.',
				math: "\\forall D,D'.\\; d(D,D')=1 \\Rightarrow \\text{Id}\\big(A(D),\\, A(D')\\big)_{\\approx_\\varepsilon}",
				explain: 'Two datasets differing in exactly one user produce outputs connected by an ε-close HoTT identity path. No single user shifts the answer noticeably.'
			},
			{
				title: '\u2696\uFE0F Fairness in loan decisions',
				desc: 'Two applicants, same financial situation, different gender. Prove: same decision.',
				math: '\\forall x,y.\\; \\text{FinIdent}(x,y) \\Rightarrow \\text{Id}\\big(M(x),\\, M(y)\\big)',
				explain: 'The identity type forces: for all financially-equivalent pairs the model provides a path connecting the outputs — i.e. they are equal. Formally checked, not a statistical hope.'
			},
			{
				title: '\uD83D\uDDBC\uFE0F Robustness vs adversarial attacks',
				desc: 'An image classifier should stay stable under small pixel perturbations.',
				math: '\\forall x,\\delta.\\; \\|\\delta\\|<\\varepsilon \\Rightarrow \\text{Id}\\big(C(x),\\, C(x+\\delta)\\big)',
				explain: 'For every perturbation δ inside an ε-ball a path exists connecting the classification outputs — i.e. the label does not change. HoTT gives a formal proof over an infinite input space.'
			}
		];
		function draw() {
			const P = pal();
			ctx.fillStyle = P.bg; ctx.fillRect(0, 0, c.width, c.height);
			const W = c.width, H = c.height;
			if (active === 0) {
				ctx.fillStyle = P.ink2; ctx.font = '13px sans-serif'; ctx.textAlign = 'center';
				ctx.fillText('Dataset D', 120, 30); ctx.fillText("Dataset D'", 380, 30);
				for (let i = 0; i < 8; i++) {
					ctx.fillStyle = P.panel; ctx.fillRect(60, 50 + i * 30, 120, 22); ctx.fillRect(320, 50 + i * 30, 120, 22);
					ctx.fillStyle = P.accent; ctx.font = '11px monospace'; ctx.textAlign = 'left';
					ctx.fillText('user_' + i + ': ' + Math.floor(Math.random() * 99), 68, 66 + i * 30);
					if (i === 3) { ctx.fillStyle = P.bad; ctx.fillText('user_3: \u2717', 328, 66 + i * 30); }
					else { ctx.fillStyle = P.accent; ctx.fillText('user_' + i + ': ' + Math.floor(Math.random() * 99), 328, 66 + i * 30); }
				}
				ctx.strokeStyle = P.good; ctx.lineWidth = 2;
				ctx.beginPath(); ctx.moveTo(120, 300); ctx.lineTo(120, 340); ctx.stroke();
				ctx.beginPath(); ctx.moveTo(380, 300); ctx.lineTo(380, 340); ctx.stroke();
				ctx.fillStyle = P.good; ctx.font = 'bold 14px monospace'; ctx.textAlign = 'center';
				ctx.fillText('A(D) = 42.7', 120, 340); ctx.fillText("A(D') = 42.8", 380, 340);
				ctx.strokeStyle = P.accent2; ctx.setLineDash([4, 4]); ctx.lineWidth = 2;
				ctx.beginPath(); ctx.moveTo(180, 335); ctx.quadraticCurveTo(250, 320, 320, 335); ctx.stroke(); ctx.setLineDash([]);
				ctx.fillStyle = P.accent2; ctx.font = '11px sans-serif';
				ctx.fillText('identity path (ε-close)', 250, 315);
			} else if (active === 1) {
				const cx = c.width / 2;
				ctx.fillStyle = P.ink2; ctx.font = '13px sans-serif'; ctx.textAlign = 'center';
				ctx.fillText('Applicant A', 120, 40); ctx.fillText('Applicant B', 380, 40);
				ctx.fillStyle = P.accent; ctx.font = '40px sans-serif';
				ctx.fillText('\uD83D\uDC68', 120, 90); ctx.fillText('\uD83D\uDC69', 380, 90);
				const stats = [['Income', '€65k'], ['Credit score', '740'], ['Age', '34'], ['Debt', '€12k']];
				ctx.font = '12px monospace';
				stats.forEach((s, i) => {
					ctx.fillStyle = P.ink2; ctx.textAlign = 'right'; ctx.fillText(s[0] + ':', 175, 130 + i * 22); ctx.fillText(s[0] + ':', 435, 130 + i * 22);
					ctx.fillStyle = P.ink; ctx.textAlign = 'left'; ctx.fillText(s[1], 185, 130 + i * 22); ctx.fillText(s[1], 445, 130 + i * 22);
				});
				ctx.fillStyle = P.panel; ctx.strokeStyle = P.accent; ctx.fillRect(cx - 60, 260, 120, 40); ctx.strokeRect(cx - 60, 260, 120, 40);
				ctx.fillStyle = P.accent; ctx.font = '13px sans-serif'; ctx.textAlign = 'center'; ctx.fillText('AI model M', cx, 285);
				ctx.strokeStyle = P.good; ctx.lineWidth = 2;
				ctx.beginPath(); ctx.moveTo(150, 230); ctx.lineTo(cx - 30, 265); ctx.stroke();
				ctx.beginPath(); ctx.moveTo(410, 230); ctx.lineTo(cx + 30, 265); ctx.stroke();
				ctx.beginPath(); ctx.moveTo(cx - 20, 300); ctx.lineTo(120, 340); ctx.stroke();
				ctx.beginPath(); ctx.moveTo(cx + 20, 300); ctx.lineTo(380, 340); ctx.stroke();
				ctx.fillStyle = P.good; ctx.font = 'bold 14px sans-serif';
				ctx.fillText('\u2713 APPROVED', 120, 345); ctx.fillText('\u2713 APPROVED', 380, 345);
				ctx.strokeStyle = P.accent2; ctx.setLineDash([4, 4]);
				ctx.beginPath(); ctx.moveTo(170, 340); ctx.quadraticCurveTo(250, 325, 330, 340); ctx.stroke(); ctx.setLineDash([]);
				ctx.fillStyle = P.accent2; ctx.font = '11px sans-serif'; ctx.fillText('Id(M(A), M(B))', 250, 320);
			} else {
				ctx.fillStyle = P.ink2; ctx.font = '13px sans-serif'; ctx.textAlign = 'center';
				ctx.fillText('Original x', 120, 30); ctx.fillText('x + δ (small)', 380, 30);
				function pixgrid(cx0, cy0, jitter) {
					for (let i = 0; i < 8; i++) for (let j = 0; j < 8; j++) {
						const v = 40 + ((i * j * 17) % 180) + (jitter ? (Math.random() - 0.5) * 30 : 0);
						ctx.fillStyle = `rgb(${v},${v * 0.8},${v * 0.6})`;
						ctx.fillRect(cx0 + j * 15, cy0 + i * 15, 14, 14);
					}
				}
				pixgrid(70, 50, false); pixgrid(330, 50, true);
				ctx.strokeStyle = P.accent2; ctx.setLineDash([3, 3]); ctx.beginPath(); ctx.arc(410, 110, 80, 0, TAU); ctx.stroke(); ctx.setLineDash([]);
				ctx.fillStyle = P.accent2; ctx.font = '11px sans-serif'; ctx.fillText('ε-ball', 470, 60);
				ctx.strokeStyle = P.good; ctx.lineWidth = 2;
				ctx.beginPath(); ctx.moveTo(130, 200); ctx.lineTo(130, 240); ctx.stroke();
				ctx.beginPath(); ctx.moveTo(390, 200); ctx.lineTo(390, 240); ctx.stroke();
				ctx.fillStyle = P.good; ctx.font = 'bold 15px sans-serif'; ctx.textAlign = 'center';
				ctx.fillText('\uD83D\uDC3C Panda', 130, 260); ctx.fillText('\uD83D\uDC3C Panda', 390, 260);
				ctx.strokeStyle = P.accent2; ctx.setLineDash([4, 4]);
				ctx.beginPath(); ctx.moveTo(180, 258); ctx.quadraticCurveTo(260, 240, 340, 258); ctx.stroke(); ctx.setLineDash([]);
				ctx.fillStyle = P.accent2; ctx.font = '11px sans-serif'; ctx.fillText('Id(C(x), C(x+δ)) — class invariant', 260, 235);
				ctx.fillStyle = P.ink2; ctx.font = '12px sans-serif'; ctx.fillText('HoTT proves: every δ with ‖δ‖<ε yields the same path to the label', 260, 320);
			}
		}
		function activate(i) {
			active = i;
			steps.forEach(s => s.classList.toggle('active', +s.dataset.v === i));
			const cs = cases[i];
			if (title) title.textContent = cs.title;
			if (desc) desc.textContent = cs.desc;
			if (math) hottTex(math, cs.math, true);
			if (explain) explain.textContent = cs.explain;
			draw();
		}
		steps.forEach(s => s.onclick = () => activate(+s.dataset.v));
		redraws.push(draw);
		activate(0);
	}

	// ══════════════════════════════════════════════════════════════
	// 6 · Uncertainty — probabilistic diagnosis + meta-uncertainty
	// ══════════════════════════════════════════════════════════════
	function buildUncertainty() {
		const s1 = $('hott-s1'), s2 = $('hott-s2'), s3 = $('hott-s3');
		const plotDiv = $('hott-uncertPlot');
		function upd() {
			if (!s1 || !s2 || !s3) return;
			if (s1 && $('hott-s1Val')) $('hott-s1Val').textContent = (+s1.value).toFixed(2);
			if (s2 && $('hott-s2Val')) $('hott-s2Val').textContent = (+s2.value).toFixed(2);
			if (s3 && $('hott-s3Val')) $('hott-s3Val').textContent = (+s3.value).toFixed(2);
			const symp = +s1.value, test = +s2.value, rel = +s3.value;
			const priors = [0.4, 0.25, 0.2, 0.15];
			const like = [
				symp * 0.7 + test * rel * 0.3 + 0.1,
				symp * 0.4 + test * rel * 0.5 + 0.1,
				symp * 0.2 + test * rel * 0.7 + 0.05,
				(1 - symp) * 0.6 + (1 - test) * 0.4 + 0.05
			];
			const post = priors.map((p, i) => p * like[i]);
			const Z = post.reduce((a, b) => a + b, 0);
			const norm = post.map(x => x / Z);
			if (!plotDiv || typeof Plotly === 'undefined') return;
			const P = pal();
			Plotly.react('hott-uncertPlot', [{
				x: ['Flu', 'Bronchitis', 'COVID-19', 'Healthy'], y: norm, type: 'bar',
				marker: { color: ['#7c9cff', '#c084fc', '#f472b6', '#4ade80'], line: { color: P.panel, width: 1 } },
				text: norm.map(x => (x * 100).toFixed(1) + '%'),
				textposition: 'outside', textfont: { color: P.ink2 }
			}], {
				paper_bgcolor: P.bg, plot_bgcolor: P.bg,
				font: { color: P.ink2 },
				margin: { t: 20, r: 20, b: 40, l: 50 },
				yaxis: { title: 'Probability', range: [0, 1], gridcolor: P.line },
				xaxis: { gridcolor: P.line }
			}, { displayModeBar: false, responsive: true });
		}
		if (s1) s1.oninput = upd;
		if (s2) s2.oninput = upd;
		if (s3) s3.oninput = upd;
		lazyInits.push(upd);
		redraws.push(upd);

		// meta-uncertainty canvas
		const mc = $('hott-metaUncert');
		if (mc) {
			const ctx = mc.getContext('2d');
			const mu = $('hott-mu'), mv = $('hott-muVal');
			function gauss(x, m, s) { return Math.exp(-0.5 * ((x - m) / s) ** 2) / (s * Math.sqrt(TAU)); }
			function draw() {
				const P = pal();
				ctx.fillStyle = P.bg; ctx.fillRect(0, 0, mc.width, mc.height);
				const W = mc.width, H = mc.height;
				const meta = +mu.value; if (mv) mv.textContent = meta.toFixed(2);
				const N = 12;
				for (let k = 0; k < N; k++) {
					const s = (k / N - 0.5) * meta * 4;
					const sig = 1 + Math.sin(k * 3.3) * meta * 0.6;
					ctx.strokeStyle = `hsla(${210 + k * 15},70%,${P.dark ? '65' : '45'}%,${0.15 + (1 - meta) * 0.15})`;
					ctx.lineWidth = 1;
					ctx.beginPath();
					for (let i = 0; i <= W; i += 2) {
						const x = (i / W - 0.5) * 10, y = gauss(x, s, Math.abs(sig) + 0.3), py = H - 30 - y * H * 0.7;
						if (i === 0) ctx.moveTo(i, py); else ctx.lineTo(i, py);
					}
					ctx.stroke();
				}
				ctx.strokeStyle = P.accent2; ctx.lineWidth = 2.5;
				ctx.beginPath();
				for (let i = 0; i <= W; i += 1) {
					const x = (i / W - 0.5) * 10, y = gauss(x, 0, 1 + meta), py = H - 30 - y * H * 0.7;
					if (i === 0) ctx.moveTo(i, py); else ctx.lineTo(i, py);
				}
				ctx.stroke();
				ctx.fillStyle = P.accent2; ctx.font = '12px sans-serif'; ctx.textAlign = 'left';
				ctx.fillText('\u2014 Bayes expectation (1st order)', 20, 25);
				ctx.fillStyle = P.accent;
				ctx.fillText('\u2014 HoTT: all plausible distributions (2nd order)', 20, 45);
				ctx.fillStyle = P.ink2; ctx.font = '11px sans-serif'; ctx.textAlign = 'center';
				ctx.fillText('probability axis', W / 2, H - 8);
			}
			if (mu) mu.oninput = draw;
			redraws.push(draw); draw();
		}
	}

	// ══════════════════════════════════════════════════════════════
	// 7 · Knowledge representation — ontology graph + identity paths
	// ══════════════════════════════════════════════════════════════
	function buildKnowledge() {
		const c = $('hott-ontoCanvas'); if (!c) return;
		const ctx = c.getContext('2d');
		const eq = $('hott-eq'), eqV = $('hott-eqVal'), ds = $('hott-ds'), dsV = $('hott-dsVal');
		const base = [
			{ id: 'd1', label: 'Flu', type: 'Disease', x: .3, y: .4, src: 1 },
			{ id: 's1', label: 'Fever', type: 'Symptom', x: .15, y: .15, src: 1 },
			{ id: 's2', label: 'Cough', type: 'Symptom', x: .15, y: .65, src: 1 },
			{ id: 't1', label: 'Rest', type: 'Treatment', x: .55, y: .2, src: 1 },
			{ id: 't2', label: 'Fluids', type: 'Treatment', x: .55, y: .6, src: 1 },
			{ id: 'd1b', label: 'Influenza', type: 'Disease', x: .75, y: .4, src: 2, alias: 'd1' },
			{ id: 's1b', label: 'High temp.', type: 'Symptom', x: .9, y: .2, src: 2, alias: 's1' },
			{ id: 't1b', label: 'Bed rest', type: 'Treatment', x: .9, y: .55, src: 2, alias: 't1' },
			{ id: 'd1c', label: 'Flu', type: 'Disease', x: .45, y: .85, src: 3, alias: 'd1' },
			{ id: 's2c', label: 'Dry cough', type: 'Symptom', x: .2, y: .9, src: 3, alias: 's2' }
		];
		const edges = [
			['d1', 's1'], ['d1', 's2'], ['d1', 't1'], ['d1', 't2'],
			['d1b', 's1b'], ['d1b', 't1b'], ['d1c', 's2c']
		];
		const colors = { Disease: '#e11d48', Symptom: '#d97706', Treatment: '#059669' };
		function draw() {
			const P = pal();
			ctx.fillStyle = P.bg; ctx.fillRect(0, 0, c.width, c.height);
			const W = c.width, H = c.height;
			const nSrc = +ds.value; if (dsV) dsV.textContent = nSrc;
			const showEq = +eq.value; if (eqV) eqV.textContent = showEq ? 'on' : 'off';
			const visible = base.filter(n => n.src <= nSrc);
			ctx.strokeStyle = P.line; ctx.lineWidth = 1.5;
			for (const [a, b] of edges) {
				const na = visible.find(n => n.id === a), nb = visible.find(n => n.id === b);
				if (!na || !nb) continue;
				ctx.beginPath(); ctx.moveTo(na.x * W, na.y * H); ctx.lineTo(nb.x * W, nb.y * H); ctx.stroke();
			}
			if (showEq) {
				for (const n of visible) {
					if (!n.alias) continue;
					const target = visible.find(m => m.id === n.alias);
					if (!target) continue;
					ctx.strokeStyle = P.accent2; ctx.lineWidth = 2; ctx.setLineDash([6, 4]);
					const x1 = n.x * W, y1 = n.y * H, x2 = target.x * W, y2 = target.y * H;
					ctx.beginPath(); ctx.moveTo(x1, y1); ctx.quadraticCurveTo((x1 + x2) / 2, (y1 + y2) / 2 - 30, x2, y2); ctx.stroke(); ctx.setLineDash([]);
				}
			}
			for (const n of visible) {
				const x = n.x * W, y = n.y * H;
				ctx.fillStyle = colors[n.type]; ctx.beginPath(); ctx.arc(x, y, 20, 0, TAU); ctx.fill();
				ctx.strokeStyle = P.bg; ctx.lineWidth = 2; ctx.stroke();
				ctx.fillStyle = P.ink; ctx.font = '11px sans-serif'; ctx.textAlign = 'center';
				ctx.fillText(n.label, x, y + 35);
				ctx.fillStyle = P.ink2; ctx.font = '9px sans-serif';
				ctx.fillText('source ' + n.src, x, y + 48);
			}
			ctx.textAlign = 'left';
			let lx = 20, ly = 25;
			for (const [k, cc] of Object.entries(colors)) {
				ctx.fillStyle = cc; ctx.beginPath(); ctx.arc(lx, ly, 7, 0, TAU); ctx.fill();
				ctx.fillStyle = P.ink; ctx.font = '12px sans-serif'; ctx.fillText(k, lx + 15, ly + 4);
				lx += 130;
			}
			if (showEq) {
				ctx.strokeStyle = P.accent2; ctx.setLineDash([6, 4]); ctx.lineWidth = 2;
				ctx.beginPath(); ctx.moveTo(W - 260, ly); ctx.lineTo(W - 230, ly); ctx.stroke(); ctx.setLineDash([]);
				ctx.fillStyle = P.accent2; ctx.font = '12px sans-serif';
				ctx.fillText('HoTT identity path', W - 220, ly + 4);
			}
		}
		if (eq) eq.oninput = draw;
		if (ds) ds.oninput = draw;
		redraws.push(draw); draw();
	}

	// ══════════════════════════════════════════════════════════════
	// 8 · Quantum AI — a qubit on the Bloch sphere (Three.js)
	// ══════════════════════════════════════════════════════════════
	function buildQuantum() {
		const container = $('hott-bloch3d'); if (!container || typeof THREE === 'undefined') return;
		const thS = $('hott-th'), phS = $('hott-ph'), thV = $('hott-thVal'), phV = $('hott-phVal');
		const qMath = $('hott-qMath'), qMeasure = $('hott-qMeasure'), qResult = $('hott-qResult');
		let scene, camera, renderer, state, arrow, rotx = 0.3, roty = 0.6, drag = false, lx = 0, ly = 0;

		function build() {
			scene = new THREE.Scene();
			scene.background = new THREE.Color(pal().dark ? 0x050710 : 0xf1f5f9);
			camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
			renderer = new THREE.WebGLRenderer({ antialias: true });
			container.appendChild(renderer.domElement);
			scene.add(new THREE.AmbientLight(0xffffff, 0.6));
			const l = new THREE.DirectionalLight(0xffffff, 0.7); l.position.set(3, 4, 3); scene.add(l);
			scene.add(new THREE.Mesh(new THREE.SphereGeometry(1, 32, 24),
				new THREE.MeshBasicMaterial({ color: 0x7c9cff, wireframe: true, transparent: true, opacity: 0.15 })));
			const ring = new THREE.Mesh(new THREE.TorusGeometry(1, 0.005, 8, 64),
				new THREE.MeshBasicMaterial({ color: 0xc084fc }));
			ring.rotation.x = Math.PI / 2; scene.add(ring);
			function axis(dir, color) {
				const g = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), dir.clone().multiplyScalar(1.3)]);
				return new THREE.Line(g, new THREE.LineBasicMaterial({ color }));
			}
			scene.add(axis(new THREE.Vector3(0, 1, 0), 0xfbbf24));
			scene.add(axis(new THREE.Vector3(0, -1, 0), 0xf87171));
			scene.add(axis(new THREE.Vector3(1, 0, 0), 0x4ade80));
			scene.add(axis(new THREE.Vector3(0, 0, 1), 0x60a5fa));
			function label(text, pos, color) {
				const cv = document.createElement('canvas'); cv.width = 128; cv.height = 64;
				const cx = cv.getContext('2d');
				cx.fillStyle = color; cx.font = 'bold 40px sans-serif'; cx.textAlign = 'center';
				cx.fillText(text, 64, 44);
				const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(cv), transparent: true }));
				sp.position.copy(pos); sp.scale.set(0.35, 0.18, 1); return sp;
			}
			scene.add(label('|0\u27E9', new THREE.Vector3(0, 1.5, 0), pal().dark ? '#fbbf24' : '#b45309'));
			scene.add(label('|1\u27E9', new THREE.Vector3(0, -1.5, 0), pal().dark ? '#f87171' : '#dc2626'));
			state = new THREE.Mesh(new THREE.SphereGeometry(0.07, 16, 12),
				new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xffffff, emissiveIntensity: 0.5 }));
			scene.add(state);
			arrow = new THREE.ArrowHelper(new THREE.Vector3(0, 1, 0), new THREE.Vector3(), 1, 0xffffff, 0.15, 0.08);
			scene.add(arrow);
			if (thS) thS.oninput = upd;
			if (phS) phS.oninput = upd;
			if (qMeasure) qMeasure.onclick = () => {
				const th = +thS.value, p0 = Math.cos(th / 2) ** 2;
				const outcome = Math.random() < p0 ? '|0\u27E9' : '|1\u27E9';
				if (qResult) qResult.innerHTML = `\u2192 outcome: <span style="color:${outcome === '|0\u27E9' ? '#fbbf24' : '#f87171'}">${outcome}</span>  (P(|0\u27E9)=${(p0 * 100).toFixed(1)}%)`;
			};
			container.addEventListener('mousedown', (e) => { drag = true; lx = e.clientX; ly = e.clientY; container.style.cursor = 'grabbing'; });
			window.addEventListener('mouseup', () => { drag = false; container.style.cursor = 'grab'; });
			window.addEventListener('mousemove', (e) => {
				if (!drag) return;
				roty += (e.clientX - lx) * 0.01; rotx += (e.clientY - ly) * 0.01;
				rotx = clamp(rotx, -1.2, 1.2); lx = e.clientX; ly = e.clientY;
			});
			(function anim() {
				if (labVisible()) {
					const r = 3.5;
					camera.position.x = Math.cos(roty) * Math.cos(rotx) * r;
					camera.position.z = Math.sin(roty) * Math.cos(rotx) * r;
					camera.position.y = Math.sin(rotx) * r;
					camera.lookAt(0, 0, 0);
					renderer.render(scene, camera);
				}
				requestAnimationFrame(anim);
			})();
		}
		function upd() {
			const th = +thS.value, ph = +phS.value;
			if (thV) thV.textContent = th.toFixed(2);
			if (phV) phV.textContent = ph.toFixed(2);
			if (state) {
				const x = Math.sin(th) * Math.cos(ph), z = Math.sin(th) * Math.sin(ph), y = Math.cos(th);
				state.position.set(x, y, z);
				arrow.setDirection(new THREE.Vector3(x, y, z).normalize());
				arrow.setLength(1, 0.15, 0.08);
			}
			if (qMath) hottTex(qMath, `|\\psi\\rangle = ${Math.cos(th / 2).toFixed(2)}\\,|0\\rangle + ${Math.sin(th / 2).toFixed(2)}e^{i\\cdot${ph.toFixed(2)}}\\,|1\\rangle`, true);
			if (qResult) qResult.textContent = '';
		}
		function resize() {
			const w = container.clientWidth, h = container.clientHeight;
			if (!w || !h) return;
			renderer.setSize(w, h); camera.aspect = w / h; camera.updateProjectionMatrix();
		}
		lazyInits.push(() => { build(); resize(); upd(); });
		redraws.push(() => { if (scene) scene.background = new THREE.Color(pal().dark ? 0x050710 : 0xf1f5f9); });
	}

	// ══════════════════════════════════════════════════════════════
	// 9 · Explainable AI — decision-path explorer
	// ══════════════════════════════════════════════════════════════
	function buildXai() {
		const c = $('hott-xaiCanvas'); if (!c) return;
		const ctx = c.getContext('2d');
		const eq = $('hott-xaiEq'), eqV = $('hott-xaiEqVal'), reset = $('hott-xaiReset'), info = $('hott-xaiInfo');
		const W = c.width, H = c.height;
		const layers = [4, 6, 6, 3];
		const layerX = layers.map((_, i) => 220 + i * 180);
		const nodes = layers.map((n, li) => Array.from({ length: n }, (_, i) => ({ x: layerX[li], y: 80 + (H - 160) * (i + 0.5) / n })));
		const colors = ['#7c9cff', '#c084fc', '#4ade80'];
		let clicks = [];
		function computePath(px, py) {
			const cls = py < H / 3 ? 0 : py < 2 * H / 3 ? 1 : 2;
			const path = [];
			for (let li = 0; li < layers.length; li++) {
				const chosen = new Set();
				const seed = (cls * 7 + Math.floor(py / 40)) % layers[li];
				chosen.add(seed); chosen.add((seed + 2) % layers[li]);
				path.push([...chosen]);
			}
			return { cls, path };
		}
		c.addEventListener('click', (e) => {
			const rect = c.getBoundingClientRect();
			const cx = (e.clientX - rect.left) * (c.width / rect.width);
			const cy = (e.clientY - rect.top) * (c.height / rect.height);
			if (cx < 200) {
				clicks.push({ x: cx, y: cy, ...computePath(cx, cy) });
				if (clicks.length > 6) clicks.shift();
				draw();
			}
		});
		if (reset) reset.onclick = () => { clicks = []; draw(); };
		function draw() {
			const P = pal();
			ctx.fillStyle = P.bg; ctx.fillRect(0, 0, W, H);
			ctx.fillStyle = P.dark ? '#0f1424' : '#eef2f7'; ctx.fillRect(20, 50, 180, H - 100);
			ctx.strokeStyle = P.line; ctx.strokeRect(20, 50, 180, H - 100);
			for (let i = 0; i < 3; i++) { ctx.fillStyle = colors[i] + (P.dark ? '22' : '33'); ctx.fillRect(20, 50 + i * (H - 100) / 3, 180, (H - 100) / 3); }
			ctx.fillStyle = P.ink2; ctx.font = '12px sans-serif'; ctx.textAlign = 'center';
			ctx.fillText('Input space', 110, 40); ctx.fillText('(click here)', 110, H - 20);
			nodes.forEach((layer, li) => {
				layer.forEach((n) => {
					ctx.fillStyle = P.panel; ctx.strokeStyle = P.line;
					ctx.beginPath(); ctx.arc(n.x, n.y, 14, 0, TAU); ctx.fill(); ctx.stroke();
				});
				ctx.fillStyle = P.ink2; ctx.font = '11px sans-serif'; ctx.textAlign = 'center';
				ctx.fillText(li === 0 ? 'Input' : li === layers.length - 1 ? 'Output' : 'Hidden ' + li, layerX[li], 40);
			});
			ctx.strokeStyle = P.dark ? 'rgba(60,80,120,0.15)' : 'rgba(100,116,139,0.18)'; ctx.lineWidth = 1;
			for (let li = 0; li < layers.length - 1; li++)
				for (const a of nodes[li]) for (const b of nodes[li + 1]) {
					ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
				}
			clicks.forEach((clk) => {
				const col = colors[clk.cls];
				ctx.fillStyle = col; ctx.beginPath(); ctx.arc(clk.x, clk.y, 7, 0, TAU); ctx.fill();
				ctx.strokeStyle = '#fff'; ctx.lineWidth = 1; ctx.stroke();
				ctx.strokeStyle = col; ctx.lineWidth = 2;
				const firstNode = nodes[0][clk.path[0][0]];
				ctx.beginPath(); ctx.moveTo(clk.x, clk.y); ctx.lineTo(firstNode.x, firstNode.y); ctx.stroke();
				for (let li = 0; li < layers.length - 1; li++)
					for (const a of clk.path[li]) for (const b of clk.path[li + 1]) {
						ctx.beginPath(); ctx.moveTo(nodes[li][a].x, nodes[li][a].y); ctx.lineTo(nodes[li + 1][b].x, nodes[li + 1][b].y); ctx.stroke();
					}
				for (let li = 0; li < layers.length; li++)
					for (const idx of clk.path[li]) {
						const n = nodes[li][idx];
						ctx.fillStyle = col; ctx.beginPath(); ctx.arc(n.x, n.y, 10, 0, TAU); ctx.fill();
					}
				const outNode = nodes[layers.length - 1][clk.path[layers.length - 1][0]];
				ctx.fillStyle = col; ctx.font = 'bold 12px sans-serif'; ctx.textAlign = 'left';
				ctx.fillText('\u2192 Class ' + 'ABC'[clk.cls], outNode.x + 20, outNode.y + 4);
			});
			const showEq = +eq.value; if (eqV) eqV.textContent = showEq ? 'yes' : 'no';
			if (showEq) {
				const groups = {};
				clicks.forEach(cc => { (groups[cc.cls] ||= []).push(cc); });
				Object.values(groups).forEach(arr => {
					if (arr.length < 2) return;
					ctx.strokeStyle = colors[arr[0].cls] + (P.dark ? 'aa' : '99'); ctx.setLineDash([5, 4]); ctx.lineWidth = 1.5;
					for (let i = 0; i < arr.length - 1; i++) {
						const a = arr[i], b = arr[i + 1];
						ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.quadraticCurveTo((a.x + b.x) / 2 - 30, (a.y + b.y) / 2, b.x, b.y); ctx.stroke();
					}
					ctx.setLineDash([]);
				});
			}
			if (clicks.length === 0) {
				ctx.fillStyle = P.ink2; ctx.font = '14px sans-serif'; ctx.textAlign = 'center';
				ctx.fillText('\u2191 Click inside the input space on the left \u2191', W / 2, H / 2);
			}
		}
		if (info) info.innerHTML = 'Each click shows a <b>decision path</b>. Inputs of the same class share similar paths — HoTT makes this path-equivalence formal: <code>Id(decision(x\u2081), decision(x\u2082))</code>.';
		if (eq) eq.oninput = draw;
		redraws.push(draw); draw();
	}

	// ══════════════════════════════════════════════════════════════
	// Bootstrap
	// ══════════════════════════════════════════════════════════════
	let inited = false;
	function initHottLab() {
		if (inited) return;
		inited = true;
		wrap = $('hott-wrap');
		if (!wrap) return;

		buildMotivation();
		buildTypes();
		buildHomotopy();
		buildIdentity();
		buildHigher();
		buildVerify();
		buildUncertainty();
		buildKnowledge();
		buildQuantum();
		buildXai();

		// Lazy WebGL / Plotly init the first time the box actually has size.
		let lazyDone = false;
		function doLazy() {
			if (lazyDone || !wrap || wrap.clientWidth === 0) return;
			lazyDone = true;
			lazyInits.forEach(fn => { try { fn(); } catch (e) { console.warn('[hott] lazy init failed:', e); } });
			lazyInits.length = 0;
		}
		doLazy();
		if (window.ResizeObserver) {
			new ResizeObserver(doLazy).observe(wrap);
		}

		// Repaint everything on a theme flip.
		if (window.__MN_DARK && __MN_DARK.onChange) {
			__MN_DARK.onChange(() => redraws.forEach(fn => { try { fn(); } catch (e) { /* ignore */ } }));
		}
	}

	if (document.readyState === 'complete') {
		initHottLab();
	} else {
		window.addEventListener('blogPostLoadComplete', initHottLab, { once: true });
		// Fallback in case the event is missed.
		window.addEventListener('load', () => setTimeout(initHottLab, 50), { once: true });
	}
})();
