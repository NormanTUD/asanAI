/* ══════════════════════════════════════════════════════════════════
   Phase Space interactive demos — woven into "Phase Space: The Shape
   of Meaningful Language".

   Ported (and translated to English) from test/geometry_of_meaning_test.html.

   Conventions followed from the rest of this blog (see math_iii_hott.js):
   - Theme-aware:  isDarkMode() / themeColor()
   - Three.js + Plotly are already loaded globally by load_base_js().
   - Everything initialises on `blogPostLoadComplete`, i.e. AFTER
     renderMarkdown() has rewritten the .md innerHTML, so every element
     reference points at the final DOM node.
   - Each demo is a self-contained `register(fn)` component. A demo is
     only mounted when its DOM node is present, so adding or removing a
     section in the PHP never breaks the others.
   ══════════════════════════════════════════════════════════════════ */
(function () {
	'use strict';

	// ── tiny utils ────────────────────────────────────────────────
	const $ = (id) => document.getElementById(id);
	const TAU = Math.PI * 2;

	// Deterministic PRNG (mulberry32) — reused by the canvas demos so the
	// "cosmic web" is stable across redraws and theme flips.
	function rng(seed) {
		return function () {
			seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
			let t = seed;
			t = Math.imul(t ^ (t >>> 15), t | 1);
			t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
			return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
		};
	}

	// Theme-aware palette. The four accent hues (blue / pink / green /
	// amber) match the original test page and are used consistently:
	//   accent  = structure / clusters / syntax
	//   accent2 = transitions / filaments / metaphor
	//   accent3 = persistent / grounded / "survives"
	//   accent4 = boundaries / warnings / phase transition
	function pal() {
		let dark = true;
		try { dark = (typeof isDarkMode === 'function') ? isDarkMode() : true; }
		catch (e) { dark = true; }
		return dark ? {
			dark: true,
			bg: '#050510', panel: '#12121f',
			ink: '#e8e8f5', ink2: '#8888a8',
			accent: '#7ac8ff', accent2: '#ff7ad9', accent3: '#b8ff7a', accent4: '#ffd07a',
			grid: 'rgba(255,255,255,0.06)',
			void: 'rgba(140,140,165,0.4)',
		} : {
			dark: false,
			bg: '#ffffff', panel: '#f6f3ea',
			ink: '#1e293b', ink2: '#5b6472',
			accent: '#2563eb', accent2: '#db2777', accent3: '#15803d', accent4: '#b45309',
			grid: 'rgba(0,0,0,0.07)',
			void: 'rgba(90,90,110,0.4)',
		};
	}

	// '#rrggbb' + alpha -> 'rgba(r,g,b,a)'. Lets the canvas demos tint the
	// theme-aware palette colours with transparency for glows / gradients.
	function rgba(hex, a) {
		const h = hex.replace('#', '');
		const full = h.length === 3 ? h.split('').map((c) => c + c).join('') : h;
		const n = parseInt(full, 16);
		const r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
		return `rgba(${r},${g},${b},${a})`;
	}

	// ── component registry ────────────────────────────────────────
	// Every demo registers an init function. We run them all once the
	// post is fully loaded. Each guards on its own DOM nodes existing.
	const inits = [];
	function register(fn) { inits.push(fn); }

	function initPhaseSpace() {
		inits.forEach((fn) => {
			try { fn(); }
			catch (e) { console.error('phase_space demo failed:', e); }
		});
	}
	window.addEventListener('blogPostLoadComplete', initPhaseSpace, { once: true });

	// Shared Plotly chrome so every plot matches the theme.
	function plotLayout(extra) {
		const P = pal();
		const base = {
			paper_bgcolor: 'transparent',
			plot_bgcolor: 'transparent',
			font: { color: P.ink, size: 12 },
			margin: { l: 60, r: 24, t: 36, b: 48 },
		};
		return Object.assign(base, extra || {});
	}

	/* ══════════════════════════════════════════════════════════════
	   1 · The combinatorial explosion of X_N
	   ══════════════════════════════════════════════════════════════ */
	register(function combExplosion() {
		const V = $('ps-comb-V'), N = $('ps-comb-N');
		if (!V || !N) return;
		const vL = $('ps-comb-vLabel'), nL = $('ps-comb-nLabel');
		const ro = $('ps-comb-readout');

		function sup(n) {
			const map = { '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴', '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹', '-': '⁻' };
			return String(n).split('').map((c) => map[c] || c).join('');
		}
		function fmt(x) {
			if (!isFinite(x)) return '∞';
			if (x < 1e6) return Math.round(x).toLocaleString('en-US');
			const e = Math.floor(Math.log10(x));
			return (x / Math.pow(10, e)).toFixed(2) + ' × 10' + sup(e);
		}
		// sum_{k=1..n} v^k = v(v^n - 1)/(v - 1)
		function total(v, n) {
			if (v <= 1) return n;
			return v * (Math.pow(v, n) - 1) / (v - 1);
		}

		function render() {
			const v = +V.value, n = +N.value;
			const P = pal();
			if (vL) vL.textContent = v.toLocaleString('en-US');
			if (nL) nL.textContent = n;

			const tot = total(v, n);
			const atoms = 1e80;
			let msg = '|V| = ' + v.toLocaleString('en-US') + ',   N = ' + n + '\n';
			msg += '|X_N| = ' + fmt(tot);
			if (tot > atoms) msg += '\nThat is ' + fmt(tot / atoms) + '× more sequences than there are atoms in the observable universe (~10⁸⁰).';
			else if (tot > 1e12) msg += '\nFor comparison: the world population is about 10¹⁰.';
			if (ro) ro.textContent = msg;

			const xs = [], ys = [];
			for (let k = 1; k <= Math.min(n, 60); k++) { xs.push(k); ys.push(Math.pow(v, k)); }

			Plotly.react('ps-comb-plot', [{
				x: xs, y: ys, type: 'scatter', mode: 'lines+markers',
				line: { color: P.accent, width: 3 },
				marker: { color: P.accent2, size: 6 },
				hovertemplate: 'length %{x}: %{y:.3e} sequences<extra></extra>'
			}], plotLayout({
				xaxis: { title: 'sequence length n', gridcolor: P.grid },
				yaxis: { title: '|Vⁿ|', type: 'log', gridcolor: P.grid }
			}), { displayModeBar: false });
		}

		V.oninput = render;
		N.oninput = render;

		const presets = [
			['ps-comb-p1', 2, 10],
			['ps-comb-p2', 26, 5],
			['ps-comb-p3', 50000, 20]
		];
		presets.forEach(([id, v, n]) => {
			const b = $(id);
			if (b) b.onclick = () => { V.value = v; N.value = n; render(); };
		});

		render();
	});

	/* ══════════════════════════════════════════════════════════════
	   7 · Metaphor as a filament — a path between two clusters
	   ══════════════════════════════════════════════════════════════ */
	register(function metaphorFilament() {
		const cv = $('ps-meta-canvas');
		if (!cv) return;
		const ctx = cv.getContext('2d');
		const btns = $('ps-meta-btns');
		const ro = $('ps-meta-readout');

		const metaphors = [
			{ n: 'Time is a river.', a: 'TIME', b: 'RIVER', map: ['flows', 'currents', 'depth', 'banks', 'source', 'mouth'] },
			{ n: 'Arguments are wars.', a: 'ARGUMENT', b: 'WAR', map: ['attack', 'defend', 'position', 'front', 'victory', 'defeat'] },
			{ n: 'Life is a journey.', a: 'LIFE', b: 'JOURNEY', map: ['crossroads', 'destination', 'detour', 'arrival', 'luggage', 'route'] },
			{ n: 'Ideas are food.', a: 'IDEA', b: 'FOOD', map: ['digest', 'nutritious', 'tasty', 'swallow', 'greedy', 'satisfy'] }
		];
		let current = 0, animFrame, animProg = 0;

		if (btns) {
			metaphors.forEach((m, i) => {
				const b = document.createElement('button');
				b.className = 'ps-btn ghost';
				b.textContent = m.n;
				b.onclick = () => { current = i; setActive(); animProg = 0; animate(); };
				btns.appendChild(b);
			});
		}
		function setActive() {
			if (btns) [...btns.children].forEach((b, i) => b.classList.toggle('active', i === current));
		}
		setActive();

		function drawCluster(cx, cy, label, color) {
			const P = pal();
			const r = rng(label.charCodeAt(0) * 97 + label.length);
			const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, 120);
			grad.addColorStop(0, rgba(color, 0.35));
			grad.addColorStop(1, rgba(color, 0));
			ctx.fillStyle = grad;
			ctx.beginPath(); ctx.arc(cx, cy, 120, 0, TAU); ctx.fill();
			for (let i = 0; i < 60; i++) {
				const ang = r() * TAU, rr = r() * 100 * Math.sqrt(r());
				ctx.fillStyle = rgba(color, 0.5 + r() * 0.5);
				ctx.beginPath(); ctx.arc(cx + Math.cos(ang) * rr, cy + Math.sin(ang) * rr, 1.4, 0, TAU); ctx.fill();
			}
			ctx.fillStyle = P.ink;
			ctx.font = 'bold 20px sans-serif'; ctx.textAlign = 'center';
			ctx.fillText(label, cx, cy + 150);
		}

		function draw(progress) {
			const P = pal();
			ctx.fillStyle = P.bg; ctx.fillRect(0, 0, cv.width, cv.height);
			const rr = rng(11);
			ctx.fillStyle = P.void;
			for (let i = 0; i < 200; i++) { ctx.beginPath(); ctx.arc(rr() * cv.width, rr() * cv.height, 0.8, 0, TAU); ctx.fill(); }
			const m = metaphors[current];
			const ax = 220, ay = cv.height / 2, bx = cv.width - 220, by = cv.height / 2;
			drawCluster(ax, ay, m.a, P.accent);
			drawCluster(bx, by, m.b, P.accent2);

			if (progress > 0) {
				const steps = 60;
				for (let s = 0; s < steps * progress; s++) {
					const t = s / steps;
					const x = ax + (bx - ax) * t;
					const y = ay + (by - ay) * t + Math.sin(t * Math.PI * 2) * 30;
					const alpha = (1 - Math.abs(t - 0.5) * 1.5) * progress;
					ctx.fillStyle = rgba(P.accent2, alpha * 0.9);
					ctx.beginPath(); ctx.arc(x, y, 2.2, 0, TAU); ctx.fill();
					ctx.fillStyle = rgba(P.accent4, alpha * 0.4);
					ctx.beginPath(); ctx.arc(x, y, 5, 0, TAU); ctx.fill();
				}
				ctx.fillStyle = P.accent2; ctx.font = '11px monospace'; ctx.textAlign = 'center';
				m.map.forEach((word, i) => {
					const t = (i + 1) / (m.map.length + 1);
					if (t <= progress) {
						const x = ax + (bx - ax) * t;
						const y = ay + (by - ay) * t + Math.sin(t * Math.PI * 2) * 30 - 15;
						ctx.fillText(word, x, y);
					}
				});
			}
			if (ro) ro.textContent = progress < 1
				? `Building the metaphorical filament between \u201C${m.a}\u201D and \u201C${m.b}\u201D \u2026 ${Math.round(progress * 100)}%`
				: `Filament active: ${m.map.length} concepts mapped between \u201C${m.a}\u201D and \u201C${m.b}\u201D. Metaphor = a long-range path that carries structure across the void.`;
		}

		function animate() {
			cancelAnimationFrame(animFrame);
			animProg = 0;
			function step() {
				animProg += 0.015;
				if (animProg >= 1) { animProg = 1; draw(1); return; }
				draw(animProg);
				animFrame = requestAnimationFrame(step);
			}
			step();
		}
		animate();
	});

	/* ══════════════════════════════════════════════════════════════
	   2 · Four coherence fields + radar — try different sentences
	   ══════════════════════════════════════════════════════════════ */
	register(function coherenceRadar() {
		const btns = $('ps-rad-btns');
		const sentenceEl = $('ps-rad-sentence');
		const radarEl = $('ps-rad-radar');
		if (!btns || !radarEl) return;
		const els = {
			C: $('ps-rad-C'), S: $('ps-rad-S'), G: $('ps-rad-G'), E: $('ps-rad-E'),
			Cb: $('ps-rad-Cbar'), Sb: $('ps-rad-Sbar'), Gb: $('ps-rad-Gbar'), Eb: $('ps-rad-Ebar')
		};
		const examples = [
			{ t: 'The dog runs in the park.', C: 1.00, S: 0.98, G: 0.95, E: 0.90, note: 'Ideal sentence: all dimensions high.' },
			{ t: 'The thought drinks the square Tuesday.', C: 0.95, S: 0.10, G: 0.05, E: 0.20, note: 'Syntax perfect, semantics collapse: SEMANTIC VOID.' },
			{ t: 'asdf qwer seven blue because table tomorrow', C: 0.05, S: 0.05, G: 0.05, E: 0.05, note: 'Pure noise: SYNTACTIC VOID.' },
			{ t: 'For every prime p, p mod 6 is in {1,5}.', C: 1.00, S: 1.00, G: 0.30, E: 0.95, note: 'Formal-mathematical: internally coherent, little physically grounded.' },
			{ t: 'Maybe it will rain in Vaduz tomorrow.', C: 1.00, S: 0.95, G: 0.80, E: 0.30, note: 'Meaningful, but epistemically undetermined.' },
			{ t: 'Time is a river.', C: 1.00, S: 0.75, G: 0.60, E: 0.85, note: 'Metaphor: semantically borderline, yet interpretable.' },
			{ t: 'Colorless green ideas sleep furiously.', C: 1.00, S: 0.15, G: 0.05, E: 0.25, note: "Chomsky's classic: syntax without semantics." },
			{ t: 'Snow is white.', C: 1.00, S: 1.00, G: 1.00, E: 1.00, note: "Tarski's standard example: grounded, checkable." }
		];
		const colors = { C: 'accent', S: 'accent3', G: 'accent4', E: 'accent2' };

		examples.forEach((e, i) => {
			const b = document.createElement('button');
			b.className = 'ps-btn ghost';
			b.textContent = e.t.length > 30 ? e.t.slice(0, 28) + '\u2026' : e.t;
			b.title = e.t;
			b.onclick = () => select(i);
			btns.appendChild(b);
		});

		function select(i) {
			const e = examples[i], P = pal();
			[...btns.children].forEach((b, j) => b.classList.toggle('active', j === i));
			if (sentenceEl) sentenceEl.innerHTML = '\u201C' + e.t + '\u201D<br><span style="font-size:.85rem;color:var(--mn-text-muted);font-style:normal">' + e.note + '</span>';
			['C', 'S', 'G', 'E'].forEach((k) => {
				if (els[k]) els[k].textContent = e[k].toFixed(2);
				if (els[k + 'b']) { els[k + 'b'].style.width = (e[k] * 100) + '%'; els[k + 'b'].style.background = P[colors[k]]; }
			});
			Plotly.react(radarEl, [{
				type: 'scatterpolar',
				r: [e.C, e.S, e.G, e.E, e.C],
				theta: ['Syntax C', 'Semantics S', 'Grounding G', 'Epistemic E', 'Syntax C'],
				fill: 'toself', fillcolor: rgba(P.accent, 0.25),
				line: { color: P.accent, width: 3 },
				marker: { color: P.accent2, size: 8 }
			}], {
				paper_bgcolor: 'transparent',
				font: { color: P.ink, size: 11 },
				polar: {
					bgcolor: 'transparent',
					radialaxis: { range: [0, 1], gridcolor: P.grid, tickfont: { color: P.ink2 } },
					angularaxis: { gridcolor: P.grid, tickfont: { color: P.ink } }
				},
				margin: { l: 60, r: 60, t: 40, b: 40 },
				showlegend: false
			}, { displayModeBar: false });
		}
		select(0);
	});

	/* ══════════════════════════════════════════════════════════════
	   5 · Which kind of void? — classify a sentence's void profile
	   ══════════════════════════════════════════════════════════════ */
	register(function voidClassifier() {
		const btns = $('ps-void-btns');
		const sentenceEl = $('ps-void-sentence');
		const barsEl = $('ps-void-bars');
		const diagEl = $('ps-void-diag');
		const scatterEl = $('ps-void-scatter');
		if (!btns || !scatterEl) return;
		const examples = [
			{ t: 'asdf qwer seven blue because table tomorrow', vs: 0.95, vm: 0.95, vg: 0.95, ve: 0.90, diag: 'SYNTACTIC VOID: every level is missing. A pure random arrangement.' },
			{ t: 'The thought drinks the square Tuesday.', vs: 0.05, vm: 0.90, vg: 0.95, ve: 0.80, diag: 'SEMANTIC VOID: syntax is perfect, but no coherent meaning can be formed.' },
			{ t: 'For every prime p, p mod 6 is in {1,5}.', vs: 0.02, vm: 0.05, vg: 0.70, ve: 0.05, diag: 'GROUNDING VOID: internally perfect, yet no anchor in the physical world.' },
			{ t: 'Maybe it will rain in Vaduz tomorrow.', vs: 0.05, vm: 0.10, vg: 0.20, ve: 0.70, diag: 'EPISTEMIC VOID: meaning is clear, but truth is undetermined.' },
			{ t: 'The dog runs in the park.', vs: 0.02, vm: 0.05, vg: 0.10, ve: 0.10, diag: 'STRUCTURE-RICH: no significant voids — fully grounded.' },
			{ t: 'Colorless green ideas sleep furiously.', vs: 0.02, vm: 0.85, vg: 0.95, ve: 0.75, diag: 'CHOMSKY CLASSIC: purely syntactic; no semantic cluster is reachable.' },
			{ t: 'Time is a river.', vs: 0.05, vm: 0.25, vg: 0.40, ve: 0.15, diag: 'METAPHOR BORDERLINE: a filament between two distant meaning clusters.' }
		];
		const dims = [
			{ n: 'V_syn  (syntax void)', k: 'vs', c: 'accent' },
			{ n: 'V_sem  (semantics void)', k: 'vm', c: 'accent3' },
			{ n: 'V_ground  (grounding void)', k: 'vg', c: 'accent4' },
			{ n: 'V_epi  (epistemic void)', k: 've', c: 'accent2' }
		];

		examples.forEach((e, i) => {
			const b = document.createElement('button');
			b.className = 'ps-btn ghost';
			b.textContent = e.t.length > 26 ? e.t.slice(0, 24) + '\u2026' : e.t;
			b.title = e.t;
			b.onclick = () => show(i);
			btns.appendChild(b);
		});

		function show(i) {
			const e = examples[i], P = pal();
			[...btns.children].forEach((b, j) => b.classList.toggle('active', j === i));
			if (sentenceEl) sentenceEl.textContent = '\u201C' + e.t + '\u201D';
			if (barsEl) barsEl.innerHTML = dims.map((d) => (
				'<div style="margin:.5rem 0">' +
				'<div style="display:flex;justify-content:space-between;font-size:.85rem;color:var(--mn-text-secondary)">' +
				'<span>' + d.n + '</span><span style="color:' + P[d.c] + ';font-family:var(--mn-font-mono)">' + e[d.k].toFixed(2) + '</span></div>' +
				'<div class="ps-bar"><div class="ps-bar-fill" style="width:' + (e[d.k] * 100) + '%;background:' + P[d.c] + '"></div></div></div>'
			)).join('');
			if (diagEl) diagEl.textContent = 'Diagnosis: ' + e.diag;
			Plotly.react(scatterEl, [{
				type: 'scatter3d', mode: 'markers',
				x: examples.map((x) => x.vs), y: examples.map((x) => x.vm), z: examples.map((x) => x.vg),
				marker: {
					size: examples.map((_, j) => j === i ? 14 : 8),
					color: examples.map((_, j) => j === i ? P.accent2 : P.accent),
					opacity: examples.map((_, j) => j === i ? 1 : 0.5)
				},
				hovertext: examples.map((x) => x.t), hoverinfo: 'text'
			}], {
				paper_bgcolor: 'transparent',
				font: { color: P.ink, size: 10 },
				scene: {
					xaxis: { title: 'V_syn', range: [0, 1], gridcolor: P.grid, backgroundcolor: 'rgba(0,0,0,0)' },
					yaxis: { title: 'V_sem', range: [0, 1], gridcolor: P.grid, backgroundcolor: 'rgba(0,0,0,0)' },
					zaxis: { title: 'V_ground', range: [0, 1], gridcolor: P.grid, backgroundcolor: 'rgba(0,0,0,0)' },
					bgcolor: 'rgba(0,0,0,0)'
				},
				margin: { l: 0, r: 0, t: 20, b: 0 },
				showlegend: false
			}, { displayModeBar: false });
		}
		show(0);
	});

	/* ══════════════════════════════════════════════════════════════
	   3 · Simulated cosmic web of language (canvas + mouse zoom)
	   ══════════════════════════════════════════════════════════════ */
	register(function cosmicWeb() {
		const cv = $('ps-web-canvas');
		if (!cv) return;
		const ctx = cv.getContext('2d');
		const kI = $('ps-web-k'), dI = $('ps-web-d'), fI = $('ps-web-f'), nI = $('ps-web-n');
		const kL = $('ps-web-kL'), dL = $('ps-web-dL'), fL = $('ps-web-fL'), nL = $('ps-web-nL');
		const legendEl = $('ps-web-legend');
		const legendDots = legendEl ? legendEl.querySelectorAll('.ps-legend-dot') : [];
		let mouse = { x: -999, y: -999 };
		let clusters = [];

		function seedClusters(k) {
			clusters = [];
			const r = rng(42);
			for (let i = 0; i < k; i++) {
				clusters.push({ x: 100 + r() * (cv.width - 200), y: 80 + r() * (cv.height - 160), r: 40 + r() * 70 });
			}
		}

		function draw() {
			const P = pal();
			if (legendDots.length === 3) {
				legendDots[0].style.background = P.accent;
				legendDots[1].style.background = P.accent2;
				legendDots[2].style.background = P.void;
			}
			const k = +kI.value, d = +dI.value, f = +fI.value, n = +nI.value;
			kL.textContent = k; dL.textContent = d.toFixed(2); fL.textContent = f.toFixed(2); nL.textContent = n;
			if (clusters.length !== k) seedClusters(k);

			ctx.fillStyle = P.bg; ctx.fillRect(0, 0, cv.width, cv.height);

			const rNoise = rng(7);
			ctx.fillStyle = P.void;
			for (let i = 0; i < n; i++) {
				const x = rNoise() * cv.width, y = rNoise() * cv.height;
				ctx.beginPath(); ctx.arc(x, y, 0.8, 0, TAU); ctx.fill();
			}

			ctx.lineWidth = 1;
			for (let i = 0; i < clusters.length; i++) {
				for (let j = i + 1; j < clusters.length; j++) {
					const a = clusters[i], b = clusters[j];
					const dist = Math.hypot(a.x - b.x, a.y - b.y);
					const strength = Math.max(0, 1 - dist / 500) * f;
					if (strength > 0.05) {
						const steps = 40;
						for (let s = 0; s < steps; s++) {
							const t = s / steps;
							const x = a.x + (b.x - a.x) * t + Math.sin(t * Math.PI * 3) * 15 * strength;
							const y = a.y + (b.y - a.y) * t + Math.cos(t * Math.PI * 3) * 15 * strength;
							ctx.fillStyle = rgba(P.accent2, strength * 0.4 * (1 - Math.abs(t - 0.5) * 1.5));
							ctx.beginPath(); ctx.arc(x, y, 1.2, 0, TAU); ctx.fill();
						}
					}
				}
			}

			const rC = rng(99);
			clusters.forEach((c) => {
				const grad = ctx.createRadialGradient(c.x, c.y, 0, c.x, c.y, c.r);
				grad.addColorStop(0, rgba(P.accent, 0.35 * d));
				grad.addColorStop(0.5, rgba(P.accent, 0.15 * d));
				grad.addColorStop(1, rgba(P.accent, 0));
				ctx.fillStyle = grad;
				ctx.beginPath(); ctx.arc(c.x, c.y, c.r, 0, TAU); ctx.fill();
				const cnt = Math.floor(30 + 80 * d);
				for (let i = 0; i < cnt; i++) {
					const ang = rC() * TAU, rr = rC() * c.r * Math.sqrt(rC());
					const x = c.x + Math.cos(ang) * rr, y = c.y + Math.sin(ang) * rr;
					ctx.fillStyle = rgba(P.accent, 0.5 + rC() * 0.5);
					ctx.beginPath(); ctx.arc(x, y, 1.1, 0, TAU); ctx.fill();
				}
			});

			if (mouse.x > 0) {
				const R = 120;
				ctx.save();
				ctx.beginPath(); ctx.arc(mouse.x, mouse.y, R, 0, TAU); ctx.clip();
				ctx.fillStyle = P.dark ? 'rgba(0,0,0,0.4)' : 'rgba(255,255,255,0.5)';
				ctx.fillRect(mouse.x - R, mouse.y - R, R * 2, R * 2);
				const rZ = rng(Math.floor(mouse.x * mouse.y) + 1);
				for (let i = 0; i < 300; i++) {
					const ang = rZ() * TAU, rr = rZ() * R * Math.sqrt(rZ());
					const x = mouse.x + Math.cos(ang) * rr, y = mouse.y + Math.sin(ang) * rr;
					ctx.fillStyle = rZ() < 0.5 ? rgba(P.accent, 0.7) : rgba(P.accent2, 0.5);
					ctx.beginPath(); ctx.arc(x, y, 1.3, 0, TAU); ctx.fill();
				}
				ctx.restore();
				ctx.strokeStyle = rgba(P.accent4, 0.8); ctx.lineWidth = 2;
				ctx.beginPath(); ctx.arc(mouse.x, mouse.y, R, 0, TAU); ctx.stroke();
				ctx.fillStyle = P.accent4; ctx.font = '12px monospace';
				ctx.fillText('ZOOM: same structure at a finer scale', mouse.x - R, mouse.y - R - 8);
			}
		}

		cv.addEventListener('mousemove', (e) => {
			const r = cv.getBoundingClientRect();
			mouse.x = (e.clientX - r.left) * (cv.width / r.width);
			mouse.y = (e.clientY - r.top) * (cv.height / r.height);
			draw();
		});
		cv.addEventListener('mouseleave', () => { mouse.x = -999; draw(); });
		[kI, dI, fI, nI].forEach((x) => x.oninput = () => { if (x === kI) seedClusters(+kI.value); draw(); });
		draw();
	});

	/* ══════════════════════════════════════════════════════════════
	   4 · Hierarchical self-similarity — zoom cascade
	   ══════════════════════════════════════════════════════════════ */
	register(function zoomCascade() {
		const cv = $('ps-zoom-canvas');
		if (!cv) return;
		const ctx = cv.getContext('2d');
		const zI = $('ps-zoom-z'), zL = $('ps-zoom-zL');
		const ro = $('ps-zoom-readout');
		const labels = [
			'Scale 1 — discourse level: each blob is a whole topic area (science, cooking, politics\u2026).',
			'Scale 2 — paragraph level: within a topic we see sub-topics and their connections.',
			'Scale 3 — sentence level: individual statements with local semantic neighbours.',
			'Scale 4 — phrase level: noun and verb phrases as their own clusters.',
			'Scale 5 — token level: individual words with lexical neighbourhoods.'
		];

		function drawLevel(level) {
			const P = pal();
			ctx.fillStyle = P.bg; ctx.fillRect(0, 0, cv.width, cv.height);
			const r = rng(1000 + level * 17);
			function recur(cx, cy, rad, depth, hue) {
				if (depth <= 0) {
					ctx.fillStyle = `hsla(${hue},80%,${P.dark ? 70 : 45}%,0.9)`;
					ctx.beginPath(); ctx.arc(cx, cy, 1.4, 0, TAU); ctx.fill();
					return;
				}
				const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, rad);
				g.addColorStop(0, `hsla(${hue},80%,${P.dark ? 60 : 45}%,${0.15 + 0.05 * depth})`);
				g.addColorStop(1, `hsla(${hue},80%,${P.dark ? 60 : 45}%,0)`);
				ctx.fillStyle = g; ctx.beginPath(); ctx.arc(cx, cy, rad, 0, TAU); ctx.fill();
				const subs = 3 + Math.floor(r() * 4);
				for (let i = 0; i < subs; i++) {
					const ang = r() * TAU, rr = rad * (0.35 + r() * 0.45);
					const nx = cx + Math.cos(ang) * rr, ny = cy + Math.sin(ang) * rr;
					ctx.strokeStyle = `hsla(${(hue + 30) % 360},60%,${P.dark ? 60 : 45}%,${0.08 * depth})`;
					ctx.lineWidth = 1;
					ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(nx, ny); ctx.stroke();
					recur(nx, ny, rad * 0.4, depth - 1, (hue + 30 + r() * 60) % 360);
				}
			}
			const topClusters = 4 + level;
			const R = rng(2000 + level * 11);
			for (let i = 0; i < topClusters; i++) {
				const cx = 120 + R() * (cv.width - 240);
				const cy = 80 + R() * (cv.height - 160);
				recur(cx, cy, 60 + R() * 40, Math.min(4, level + 1), 200 + R() * 160);
			}
			ctx.strokeStyle = rgba(P.accent4, 0.5);
			ctx.setLineDash([4, 4]); ctx.lineWidth = 1.5;
			if (level < 4) {
				const boxW = cv.width / (level + 2), boxH = cv.height / (level + 2);
				ctx.strokeRect(cv.width / 2 - boxW / 2, cv.height / 2 - boxH / 2, boxW, boxH);
				ctx.fillStyle = rgba(P.accent4, 0.8);
				ctx.font = '11px monospace';
				ctx.fillText('\u2192 crop for the next scale', cv.width / 2 - boxW / 2, cv.height / 2 - boxH / 2 - 6);
			}
			ctx.setLineDash([]);
		}

		function update() {
			const z = +zI.value;
			if (zL) zL.textContent = z + 1;
			if (ro) ro.textContent = labels[z];
			drawLevel(z);
		}
		zI.oninput = update;
		update();
	});

	/* ══════════════════════════════════════════════════════════════
	   6 · Linguistic degradation as a phase transition
	   ══════════════════════════════════════════════════════════════ */
	register(function phaseTransition() {
		const tI = $('ps-phase-t'), tL = $('ps-phase-tL');
		const se = $('ps-phase-sentence'), plotEl = $('ps-phase-plot');
		if (!tI || !plotEl) return;
		const stages = [
			{ t: 0.00, s: 'The dog sleeps.', C: 1.00 },
			{ t: 0.20, s: 'The dog sleeps quickly.', C: 0.85 },
			{ t: 0.45, s: 'The dog sleeps quadratically.', C: 0.50 },
			{ t: 0.70, s: 'The dog quadratically seven.', C: 0.15 },
			{ t: 1.00, s: 'quadratically dog seven sleeps.', C: 0.03 }
		];
		function interp(t) {
			for (let i = 0; i < stages.length - 1; i++) {
				if (t >= stages[i].t && t <= stages[i + 1].t) {
					const a = (t - stages[i].t) / (stages[i + 1].t - stages[i].t);
					return { s: a < 0.5 ? stages[i].s : stages[i + 1].s, C: stages[i].C * (1 - a) + stages[i + 1].C * a };
				}
			}
			return stages[stages.length - 1];
		}
		function sigmoid(t) { return 1 / (1 + Math.exp((t - 0.5) * 12)); }
		const xs = [], ys = [];
		for (let i = 0; i <= 100; i++) { const t = i / 100; xs.push(t); ys.push(sigmoid(t)); }

		function update() {
			const P = pal();
			const t = +tI.value;
			if (tL) tL.textContent = t.toFixed(2);
			const cur = interp(t);
			if (se) se.textContent = '\u201C' + cur.s + '\u201D';
			Plotly.react(plotEl, [
				{ x: xs, y: ys, type: 'scatter', mode: 'lines', line: { color: P.accent, width: 3 }, name: 'C(t)' },
				{ x: [t], y: [sigmoid(t)], type: 'scatter', mode: 'markers', marker: { color: P.accent2, size: 16, line: { color: '#fff', width: 2 } }, name: 'current' },
				{ x: [0.5, 0.5], y: [0, 1], type: 'scatter', mode: 'lines', line: { color: rgba(P.accent4, 0.6), width: 2, dash: 'dash' }, name: 'critical threshold' }
			], {
				paper_bgcolor: 'transparent', plot_bgcolor: 'transparent',
				font: { color: P.ink, size: 11 },
				xaxis: { title: 'degradation parameter t', gridcolor: P.grid, range: [0, 1] },
				yaxis: { title: 'coherence C', gridcolor: P.grid, range: [-0.05, 1.05] },
				margin: { l: 60, r: 24, t: 24, b: 50 },
				showlegend: true, legend: { bgcolor: 'rgba(0,0,0,0)', bordercolor: 'transparent' },
				annotations: [{ x: 0.5, y: 0.5, xref: 'x', yref: 'y', text: '\u2202M \u2014 phase transition', showarrow: true, arrowcolor: P.accent4, font: { color: P.accent4 } }]
			}, { displayModeBar: false });
		}
		tI.oninput = update;
		update();
	});

	/* ══════════════════════════════════════════════════════════════
	   11 · Scaling laws: Zipf, Heaps, multifractal D(q)
	   ══════════════════════════════════════════════════════════════ */
	register(function scalingLaws() {
		const aI = $('ps-scale-a'), bI = $('ps-scale-b');
		const aL = $('ps-scale-aL'), bL = $('ps-scale-bL');
		const zipfEl = $('ps-scale-zipf'), heapsEl = $('ps-scale-heaps'), dqEl = $('ps-scale-dq');
		if (!aI || !bI || !zipfEl) return;

		function render() {
			const P = pal();
			const a = +aI.value, b = +bI.value;
			if (aL) aL.textContent = a.toFixed(2);
			if (bL) bL.textContent = b.toFixed(2);

			const rs = [], fs = [];
			for (let r = 1; r <= 10000; r *= 1.15) { rs.push(r); fs.push(Math.pow(r, -a)); }
			Plotly.react(zipfEl, [{
				x: rs, y: fs, type: 'scatter', mode: 'lines',
				line: { color: P.accent, width: 3 },
				name: 'f(r) \u221D r^-' + a.toFixed(2)
			}], plotLayout({
				title: { text: 'Zipf: log\u2013log', font: { color: P.accent, size: 13 } },
				xaxis: { title: 'rank r (log)', type: 'log', gridcolor: P.grid },
				yaxis: { title: 'frequency f (log)', type: 'log', gridcolor: P.grid }
			}), { displayModeBar: false });

			const ns = [], vs = [];
			for (let n = 1; n <= 1e6; n *= 1.3) { ns.push(n); vs.push(Math.pow(n, b)); }
			Plotly.react(heapsEl, [{
				x: ns, y: vs, type: 'scatter', mode: 'lines',
				line: { color: P.accent2, width: 3 },
				name: 'V \u221D N^' + b.toFixed(2)
			}], plotLayout({
				title: { text: 'Heaps: vocabulary growth', font: { color: P.accent2, size: 13 } },
				xaxis: { title: 'text length N (log)', type: 'log', gridcolor: P.grid },
				yaxis: { title: 'vocabulary V(N) (log)', type: 'log', gridcolor: P.grid }
			}), { displayModeBar: false });

			const qs = [], mono = [], multi = [];
			for (let q = -5; q <= 5.001; q += 0.1) {
				qs.push(q);
				mono.push(1.5);
				multi.push(1.5 - 0.15 * Math.tanh(q * 0.8) + 0.05 * Math.exp(-q * q / 8));
			}
			Plotly.react(dqEl, [
				{ x: qs, y: mono, type: 'scatter', mode: 'lines', name: 'Monofractal (flat)', line: { color: P.ink2, width: 2, dash: 'dash' } },
				{ x: qs, y: multi, type: 'scatter', mode: 'lines', name: 'Multifractal (curved)', line: { color: P.accent3, width: 3 } }
			], plotLayout({
				title: { text: 'Multifractal spectrum D(q)', font: { color: P.accent3, size: 13 } },
				xaxis: { title: 'q (moment order)', gridcolor: P.grid },
				yaxis: { title: 'generalised dimension D(q)', gridcolor: P.grid },
				legend: { bgcolor: 'rgba(0,0,0,0)', bordercolor: 'transparent', x: 0.02, y: 0.98 }
			}), { displayModeBar: false });
		}
		aI.oninput = render;
		bI.oninput = render;
		render();
	});

	/* ══════════════════════════════════════════════════════════════
	   8 · Persistent homology — Vietoris–Rips filtration + barcode
	   ══════════════════════════════════════════════════════════════ */
	register(function persistentHomology() {
		const cvP = $('ps-ph-pts'), cvB = $('ps-ph-bar');
		if (!cvP || !cvB) return;
		const ctxP = cvP.getContext('2d'), ctxB = cvB.getContext('2d');
		const eI = $('ps-ph-e'), eL = $('ps-ph-eL'), conf = $('ps-ph-conf');
		const ro = $('ps-ph-readout');

		function uf(n) {
			const p = [...Array(n).keys()];
			return {
				f(x) { while (p[x] !== x) { p[x] = p[p[x]]; x = p[x]; } return x; },
				u(a, b) { a = this.f(a); b = this.f(b); if (a !== b) { p[a] = b; return true; } return false; }
			};
		}
		function generate(kind) {
			const r = rng(42);
			const pts = [];
			if (kind === 'two') {
				for (let i = 0; i < 15; i++) pts.push([0.28 + r() * 0.15, 0.4 + r() * 0.2]);
				for (let i = 0; i < 15; i++) pts.push([0.6 + r() * 0.15, 0.4 + r() * 0.2]);
			} else if (kind === 'ring') {
				for (let i = 0; i < 24; i++) { const a = i / 24 * TAU + r() * 0.15; pts.push([0.5 + Math.cos(a) * 0.28, 0.5 + Math.sin(a) * 0.28]); }
			} else if (kind === 'three') {
				for (let i = 0; i < 12; i++) pts.push([0.22 + r() * 0.12, 0.28 + r() * 0.12]);
				for (let i = 0; i < 12; i++) pts.push([0.72 + r() * 0.12, 0.28 + r() * 0.12]);
				for (let i = 0; i < 12; i++) pts.push([0.5 + r() * 0.12, 0.72 + r() * 0.12]);
				for (let i = 0; i < 4; i++) { const t = (i + 1) / 6; pts.push([0.28 + t * 0.5 + r() * 0.02, 0.34 + r() * 0.02]); }
			} else {
				for (let c = 0; c < 4; c++) {
					const cx = 0.25 + (c % 2) * 0.5, cy = 0.25 + Math.floor(c / 2) * 0.5;
					for (let s = 0; s < 3; s++) { const sx = cx + (s - 1) * 0.06, sy = cy + (s - 1) * 0.05; for (let i = 0; i < 5; i++) pts.push([sx + r() * 0.04, sy + r() * 0.04]); }
				}
			}
			return pts;
		}
		function computeH0(pts) {
			const n = pts.length; const edges = [];
			for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) edges.push([Math.hypot(pts[i][0] - pts[j][0], pts[i][1] - pts[j][1]), i, j]);
			edges.sort((a, b) => a[0] - b[0]);
			const u = uf(n); const deaths = Array(n).fill(Infinity);
			for (const [d, i, j] of edges) { const ri = u.f(i), rj = u.f(j); if (ri !== rj) { deaths[Math.max(ri, rj)] = d; u.u(i, j); } }
			const bars = []; for (let i = 0; i < n; i++) bars.push([0, deaths[i]]);
			bars.sort((a, b) => a[1] - b[1]); return bars;
		}
		function computeH1(pts, eps) {
			const n = pts.length; const adj = Array.from({ length: n }, () => []);
			for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) { const d = Math.hypot(pts[i][0] - pts[j][0], pts[i][1] - pts[j][1]); if (d <= eps) { adj[i].push(j); adj[j].push(i); } }
			let E = 0; for (let i = 0; i < n; i++) E += adj[i].length; E /= 2;
			const u = uf(n); for (let i = 0; i < n; i++) for (const j of adj[i]) if (j > i) u.u(i, j);
			const comps = new Set(); for (let i = 0; i < n; i++) comps.add(u.f(i));
			return Math.max(0, E - n + comps.size);
		}
		function drawPts(pts, eps) {
			const P = pal(); const W = cvP.width, H = cvP.height;
			ctxP.fillStyle = P.bg; ctxP.fillRect(0, 0, W, H);
			for (const [x, y] of pts) {
				const g = ctxP.createRadialGradient(x * W, y * H, 0, x * W, y * H, eps * W);
				g.addColorStop(0, rgba(P.accent, 0.15)); g.addColorStop(1, rgba(P.accent, 0));
				ctxP.fillStyle = g; ctxP.beginPath(); ctxP.arc(x * W, y * H, eps * W, 0, TAU); ctxP.fill();
			}
			ctxP.strokeStyle = rgba(P.accent4, 0.5); ctxP.lineWidth = 1;
			for (let i = 0; i < pts.length; i++) for (let j = i + 1; j < pts.length; j++) {
				if (Math.hypot(pts[i][0] - pts[j][0], pts[i][1] - pts[j][1]) <= eps) {
					ctxP.beginPath(); ctxP.moveTo(pts[i][0] * W, pts[i][1] * H); ctxP.lineTo(pts[j][0] * W, pts[j][1] * H); ctxP.stroke();
				}
			}
			ctxP.fillStyle = rgba(P.accent2, 0.15);
			for (let i = 0; i < pts.length; i++) for (let j = i + 1; j < pts.length; j++) for (let k = j + 1; k < pts.length; k++) {
				const d1 = Math.hypot(pts[i][0] - pts[j][0], pts[i][1] - pts[j][1]);
				const d2 = Math.hypot(pts[j][0] - pts[k][0], pts[j][1] - pts[k][1]);
				const d3 = Math.hypot(pts[i][0] - pts[k][0], pts[i][1] - pts[k][1]);
				if (d1 <= eps && d2 <= eps && d3 <= eps) {
					ctxP.beginPath(); ctxP.moveTo(pts[i][0] * W, pts[i][1] * H); ctxP.lineTo(pts[j][0] * W, pts[j][1] * H); ctxP.lineTo(pts[k][0] * W, pts[k][1] * H); ctxP.closePath(); ctxP.fill();
				}
			}
			for (const [x, y] of pts) {
				ctxP.fillStyle = P.accent; ctxP.beginPath(); ctxP.arc(x * W, y * H, 4, 0, TAU); ctxP.fill();
				ctxP.strokeStyle = P.ink; ctxP.lineWidth = 1; ctxP.stroke();
			}
			ctxP.fillStyle = rgba(P.ink, 0.7); ctxP.font = '12px monospace';
			ctxP.fillText('\u03B5 = ' + eps.toFixed(3), 12, 22);
		}
		function drawBar(bars, eps, h1) {
			const P = pal(); const W = cvB.width, H = cvB.height; const pad = 40;
			ctxB.fillStyle = P.bg; ctxB.fillRect(0, 0, W, H);
			ctxB.strokeStyle = rgba(P.ink, 0.25); ctxB.beginPath();
			ctxB.moveTo(pad, 10); ctxB.lineTo(pad, H - pad); ctxB.lineTo(W - 10, H - pad); ctxB.stroke();
			ctxB.fillStyle = rgba(P.ink, 0.6); ctxB.font = '11px monospace';
			ctxB.fillText('\u03B5 \u2192', W - 30, H - pad + 18);
			ctxB.fillText('Features', 8, 20);
			ctxB.fillText('H\u2080 barcode (connected components)', pad + 10, 24);
			const maxEps = 0.5;
			const barH = Math.min(14, (H - pad - 40) / Math.max(bars.length, 1));
			bars.forEach((b, i) => {
				const y = 40 + i * barH;
				const x0 = pad + (b[0] / maxEps) * (W - pad - 20);
				const x1 = pad + (Math.min(b[1], maxEps) / maxEps) * (W - pad - 20);
				const persist = (b[1] === Infinity ? maxEps : b[1]) - b[0];
				ctxB.fillStyle = persist > 0.15 ? P.accent3 : (persist > 0.06 ? P.accent4 : P.ink2);
				ctxB.fillRect(x0, y, Math.max(1, x1 - x0), barH - 2);
				if (b[1] === Infinity) { ctxB.fillStyle = P.accent2; ctxB.fillRect(W - 15, y, 4, barH - 2); }
			});
			const cx = pad + (eps / maxEps) * (W - pad - 20);
			ctxB.strokeStyle = P.accent2; ctxB.lineWidth = 2;
			ctxB.beginPath(); ctxB.moveTo(cx, 10); ctxB.lineTo(cx, H - pad); ctxB.stroke();
			ctxB.fillStyle = P.accent2; ctxB.fillText('current \u03B5', cx + 4, H - pad - 4);
			ctxB.fillStyle = rgba(P.ink, 0.75); ctxB.font = '12px monospace';
			ctxB.fillText('H\u2081 (loops) at current \u03B5: ' + h1, pad + 10, H - 8);
		}
		let curPts = [];
		function refresh() {
			const P = pal();
			curPts = generate(conf.value);
			const eps = +eI.value;
			if (eL) eL.textContent = eps.toFixed(3);
			const bars = computeH0(curPts);
			const h1 = computeH1(curPts, eps);
			drawPts(curPts, eps);
			drawBar(bars, eps, h1);
			const alive = bars.filter((b) => b[1] > eps).length;
			if (ro) ro.textContent = 'At \u03B5=' + eps.toFixed(3) + ': ' + alive + ' connected component(s), ' + h1 + ' independent loop(s) (H\u2081). Green = persistent (real structure), grey = short-lived (noise), magenta tick = immortal.';
		}
		eI.oninput = refresh;
		conf.onchange = refresh;
		refresh();
	});

	/* ══════════════════════════════════════════════════════════════
	   9 · Fiber bundle in 3D (three.js): X over S
	   ══════════════════════════════════════════════════════════════ */
	register(function fiberBundle3D() {
		const container = $('ps-fib-3d');
		if (!container || typeof THREE === 'undefined') return;
		const ro = $('ps-fib-readout');
		const w = container.clientWidth || 800, h = 460;
		const P = pal();

		const scene = new THREE.Scene();
		scene.background = new THREE.Color(P.dark ? 0x020208 : 0xf6f3ea);
		const camera = new THREE.PerspectiveCamera(50, w / h, 0.1, 100);
		camera.position.set(5, 4, 7);
		camera.lookAt(0, 1, 0);
		const renderer = new THREE.WebGLRenderer({ antialias: true });
		renderer.setSize(w, h);
		container.appendChild(renderer.domElement);

		const plane = new THREE.Mesh(
			new THREE.PlaneGeometry(6, 6, 20, 20),
			new THREE.MeshBasicMaterial({ color: P.dark ? 0x1a2a4a : 0x9aa7c7, wireframe: true, transparent: true, opacity: 0.5 })
		);
		plane.rotation.x = -Math.PI / 2;
		scene.add(plane);

		const meanings = [
			{ id: 'chase', pos: [-1.5, -1], label: 'CHASE(X,Y)', color: 0xff7ad9 },
			{ id: 'sleep', pos: [1.5, -1], label: 'SLEEP(X)', color: 0x7ac8ff },
			{ id: 'love', pos: [-1.5, 1.5], label: 'LOVE(X,Y)', color: 0x4ade80 },
			{ id: 'eat', pos: [1.5, 1.5], label: 'EAT(X,Y)', color: 0xffd07a }
		];
		const fibers = {};
		meanings.forEach((m) => {
			const sph = new THREE.Mesh(new THREE.SphereGeometry(0.12, 16, 16), new THREE.MeshBasicMaterial({ color: m.color }));
			sph.position.set(m.pos[0], 0.05, m.pos[1]);
			scene.add(sph);
			const group = new THREE.Group();
			for (let i = 0; i < 25; i++) {
				const p = new THREE.Mesh(new THREE.SphereGeometry(0.05, 8, 8), new THREE.MeshBasicMaterial({ color: m.color, transparent: true, opacity: 0.7 }));
				p.position.set(m.pos[0] + (Math.random() - 0.5) * 0.35, 0.3 + i * 0.15, m.pos[1] + (Math.random() - 0.5) * 0.35);
				group.add(p);
			}
			const line = new THREE.Line(
				new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(m.pos[0], 0, m.pos[1]), new THREE.Vector3(m.pos[0], 4, m.pos[1])]),
				new THREE.LineDashedMaterial({ color: m.color, dashSize: 0.1, gapSize: 0.08, opacity: 0.5, transparent: true })
			);
			line.computeLineDistances();
			group.add(line);
			scene.add(group);
			fibers[m.id] = group;
		});

		function makeLabel(text, color) {
			const canvas = document.createElement('canvas');
			canvas.width = 256; canvas.height = 64;
			const c = canvas.getContext('2d');
			c.clearRect(0, 0, 256, 64);
			c.font = 'bold 24px monospace';
			c.fillStyle = '#' + color.toString(16).padStart(6, '0');
			c.textAlign = 'center';
			c.fillText(text, 128, 40);
			const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(canvas), transparent: true }));
			sp.scale.set(1.4, 0.35, 1);
			return sp;
		}
		meanings.forEach((m) => { const lab = makeLabel(m.label, m.color); lab.position.set(m.pos[0], -0.25, m.pos[1]); scene.add(lab); });
		const baseLab = makeLabel('S (meanings)', 0x7ac8ff); baseLab.position.set(2.5, -0.2, 2.5); baseLab.scale.set(1.8, 0.45, 1); scene.add(baseLab);
		const topLab = makeLabel('X (sentences) — fibers \u03C0\u207B\u00B9(s)', 0xff7ad9); topLab.position.set(0, 4.5, 0); topLab.scale.set(2.2, 0.55, 1); scene.add(topLab);

		let rotX = 0.2, rotY = 0.6, dragging = false, lx = 0, ly = 0;
		const el = renderer.domElement;
		el.addEventListener('mousedown', (e) => { dragging = true; lx = e.clientX; ly = e.clientY; });
		window.addEventListener('mouseup', () => dragging = false);
		window.addEventListener('mousemove', (e) => {
			if (!dragging) return;
			rotY += (e.clientX - lx) * 0.008;
			rotX += (e.clientY - ly) * 0.008;
			rotX = Math.max(-0.8, Math.min(1.2, rotX));
			lx = e.clientX; ly = e.clientY;
		});
		el.addEventListener('wheel', (e) => { e.preventDefault(); camera.position.multiplyScalar(e.deltaY > 0 ? 1.1 : 0.9); }, { passive: false });

		(function animate() {
			requestAnimationFrame(animate);
			const R = Math.sqrt(camera.position.x ** 2 + camera.position.z ** 2 + camera.position.y ** 2);
			camera.position.x = R * Math.cos(rotX) * Math.sin(rotY);
			camera.position.z = R * Math.cos(rotX) * Math.cos(rotY);
			camera.position.y = R * Math.sin(rotX) + 1.5;
			camera.lookAt(0, 1.5, 0);
			renderer.render(scene, camera);
		})();

		function highlight(which) {
			Object.entries(fibers).forEach(([id, g]) => {
				g.children.forEach((c) => { if (c.material) c.material.opacity = (which === 'all' || id === which) ? 0.9 : 0.1; });
			});
			const map = {
				chase: 'Fiber over CHASE(X,Y) \u2014 e.g. \u201CThe dog chases the cat.\u201D, \u201CThe cat is chased by the dog.\u201D, \u201CA dog chases a cat\u201D\u2026',
				sleep: 'Fiber over SLEEP(X) \u2014 e.g. \u201CThe dog sleeps.\u201D, \u201CA sleeping dog\u201D, \u201CEl perro duerme\u201D\u2026',
				all: 'All fibers visible. Each vertical column = one meaning class with many linguistic realisations.'
			};
			if (ro) ro.textContent = map[which] || map.all;
		}
		['ps-fib-chase', 'ps-fib-sleep', 'ps-fib-all'].forEach((id) => {
			const b = $(id);
			if (b) b.onclick = () => highlight(id.replace('ps-fib-', ''));
		});
		highlight('all');
	});

	/* ══════════════════════════════════════════════════════════════
	   10a · Interactive commutative square
	   ══════════════════════════════════════════════════════════════ */
	register(function commutativeSquare() {
		const cv = $('ps-comm-canvas');
		if (!cv) return;
		const ctx = cv.getContext('2d');
		const ro = $('ps-comm-readout');
		const nodes = {
			X: { x: 200, y: 120, label: 'X: \u201CThe dog chases the cat.\u201D', c: 'accent' },
			Xp: { x: 800, y: 120, label: "X': \u201CThe cat is chased by the dog.\u201D", c: 'accent' },
			S: { x: 200, y: 340, label: 'S: CHASE(dog,cat)', c: 'accent2' },
			Sp: { x: 800, y: 340, label: "S': CHASE(dog,cat)", c: 'accent2' }
		};
		let path1 = false, path2 = false, anim = 0;

		function arrow(x1, y1, x2, y2, color, active, label, off) {
			const P = pal();
			const col = active ? P[color] : rgba(P.ink, 0.2);
			ctx.strokeStyle = col; ctx.lineWidth = active ? 3 : 1.5;
			ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
			const ang = Math.atan2(y2 - y1, x2 - x1), ah = 12;
			ctx.beginPath();
			ctx.moveTo(x2, y2);
			ctx.lineTo(x2 - ah * Math.cos(ang - 0.4), y2 - ah * Math.sin(ang - 0.4));
			ctx.lineTo(x2 - ah * Math.cos(ang + 0.4), y2 - ah * Math.sin(ang + 0.4));
			ctx.closePath(); ctx.fillStyle = active ? P[color] : rgba(P.ink, 0.3); ctx.fill();
			ctx.fillStyle = active ? P[color] : rgba(P.ink, 0.45); ctx.font = 'bold 13px monospace';
			ctx.fillText(label, (x1 + x2) / 2 + (off || 0), (y1 + y2) / 2 - 8);
		}

		function draw() {
			const P = pal();
			ctx.fillStyle = P.bg; ctx.fillRect(0, 0, cv.width, cv.height);
			Object.values(nodes).forEach((n) => {
				ctx.fillStyle = rgba(P[n.c], 0.25);
				ctx.beginPath(); ctx.arc(n.x, n.y, 42, 0, TAU); ctx.fill();
				ctx.fillStyle = P[n.c];
				ctx.beginPath(); ctx.arc(n.x, n.y, 10, 0, TAU); ctx.fill();
				ctx.fillStyle = P.ink; ctx.font = '12px sans-serif'; ctx.textAlign = 'center';
				ctx.fillText(n.label, n.x, n.y < 200 ? n.y - 58 : n.y + 70);
			});
			arrow(nodes.X.x + 42, nodes.X.y, nodes.Xp.x - 42, nodes.Xp.y, 'accent4', path1 || anim === 1, 'f (passivise)', 0);
			arrow(nodes.X.x, nodes.X.y + 42, nodes.S.x, nodes.S.y - 42, 'accent', path2 || anim === 2, '\u03C0 (interpret)', -70);
			arrow(nodes.Xp.x, nodes.Xp.y + 42, nodes.Sp.x, nodes.Sp.y - 42, 'accent', path1 || path2 || anim, "\u03C0'", 20);
			arrow(nodes.S.x + 42, nodes.S.y, nodes.Sp.x - 42, nodes.Sp.y, 'accent4', path2 || anim === 2, 'g', 0);
			if (path1 && path2) {
				ctx.fillStyle = rgba(P.accent3, 0.15);
				ctx.beginPath(); ctx.arc(nodes.Sp.x, nodes.Sp.y, 60, 0, TAU); ctx.fill();
				ctx.strokeStyle = P.accent3; ctx.lineWidth = 3;
				ctx.beginPath(); ctx.arc(nodes.Sp.x, nodes.Sp.y, 60, 0, TAU); ctx.stroke();
				ctx.fillStyle = P.accent3; ctx.font = 'bold 16px sans-serif'; ctx.textAlign = 'center';
				ctx.fillText('\u2713 Diagram commutes', nodes.Sp.x, nodes.Sp.y + 95);
				ctx.font = '11px monospace';
				ctx.fillText("\u03C0'\u2218f = g\u2218\u03C0", nodes.Sp.x, nodes.Sp.y + 112);
			}
		}

		const p1 = $('ps-comm-p1'), p2 = $('ps-comm-p2'), rs = $('ps-comm-reset');
		if (p1) p1.onclick = () => { path1 = true; anim = 1; draw(); setTimeout(() => { anim = 0; draw(); }, 600); if (ro) ro.textContent = 'Path 1 \u2014 transform the form (f), then interpret (\u03C0\'): \u201CThe cat is chased by the dog.\u201D \u2192 CHASE(dog,cat).'; };
		if (p2) p2.onclick = () => { path2 = true; anim = 2; draw(); setTimeout(() => { anim = 0; draw(); }, 600); if (ro) ro.textContent = 'Path 2 \u2014 interpret (\u03C0), then transform the meaning (g): \u201CThe dog chases the cat.\u201D \u2192 CHASE(dog,cat) \u2192 CHASE(dog,cat).'; };
		if (rs) rs.onclick = () => { path1 = false; path2 = false; anim = 0; draw(); if (ro) ro.textContent = 'Example: x = \u201CThe dog chases the cat.\u201D, f = passivisation, \u03C0 = meaning extraction. Press the two paths to see they meet at the same meaning.'; };
		if (ro) ro.textContent = 'Example: x = \u201CThe dog chases the cat.\u201D, f = passivisation, \u03C0 = meaning extraction. Press the two paths to see they meet at the same meaning.';
		draw();
	});

	/* ══════════════════════════════════════════════════════════════
	   10b · The Tarskian truth chain: meaning meets the world
	   ══════════════════════════════════════════════════════════════ */
	register(function tarskiChain() {
		const wI = $('ps-tars-w'), wL = $('ps-tars-wL'), plotEl = $('ps-tars-plot');
		if (!wI || !plotEl) return;
		const worlds = [
			{ name: 'World 1: snow white, dog runs', facts: { snow_white: true, dog_runs: true, rain: false, cat_sleeps: true } },
			{ name: 'World 2: snow green, dog runs', facts: { snow_white: false, dog_runs: true, rain: false, cat_sleeps: true } },
			{ name: 'World 3: rain, snow white', facts: { snow_white: true, dog_runs: false, rain: true, cat_sleeps: false } },
			{ name: 'World 4: all false', facts: { snow_white: false, dog_runs: false, rain: false, cat_sleeps: false } },
			{ name: 'World 5: all true', facts: { snow_white: true, dog_runs: true, rain: true, cat_sleeps: true } }
		];
		const sentences = [
			{ t: '\u201CSnow is white.\u201D', k: 'snow_white' },
			{ t: '\u201CThe dog runs.\u201D', k: 'dog_runs' },
			{ t: '\u201CIt is raining.\u201D', k: 'rain' },
			{ t: '\u201CThe cat sleeps.\u201D', k: 'cat_sleeps' }
		];
		function render() {
			const P = pal();
			const w = +wI.value;
			if (wL) wL.textContent = worlds[w].name;
			const colors = sentences.map((s) => worlds[w].facts[s.k] ? P.accent : P.ink2);
			const truth = sentences.map((s) => worlds[w].facts[s.k] ? 'TRUE' : 'FALSE');
			Plotly.react(plotEl, [{
				type: 'bar', orientation: 'h',
				x: sentences.map(() => 1),
				y: sentences.map((s) => s.t),
				marker: { color: colors, line: { color: P.ink, width: 1 } },
				text: truth, textposition: 'inside',
				textfont: { color: P.dark ? '#000' : '#fff', size: 13 },
				hovertemplate: '%{y}<br>%{text}<extra></extra>'
			}], {
				paper_bgcolor: 'transparent', plot_bgcolor: 'transparent',
				font: { color: P.ink, size: 12 },
				xaxis: { showticklabels: false, range: [0, 1.1], gridcolor: P.grid },
				yaxis: { gridcolor: P.grid, automargin: true },
				margin: { l: 190, r: 40, t: 36, b: 30 },
				showlegend: false,
				title: { text: worlds[w].name, font: { color: P.accent, size: 13 } }
			}, { displayModeBar: false });
		}
		wI.oninput = render;
		render();
	});

	/* ══════════════════════════════════════════════════════════════
	   12 · Renormalisation group: coarse-graining a multi-scale space
	   ══════════════════════════════════════════════════════════════ */
	register(function renormGroup() {
		const cv = $('ps-rg-canvas'), sI = $('ps-rg-scale'), sL = $('ps-rg-scaleL'), plotEl = $('ps-rg-plot');
		if (!cv || !sI) return;
		const ctx = cv.getContext('2d');
		const scaleNames = ['tokens', 'phrases', 'sentences', 'discourse'];
		const r = rng(7);

		function makeClusters(parents, spread, count) {
			return parents.map((c, ci) => {
				const clusters = [];
				for (let i = 0; i < count; i++) {
					const cx = c[0] + (r() - 0.5) * spread * 0.4;
					const cy = c[1] + (r() - 0.5) * spread * 0.4;
					const pts = [];
					for (let k = 0; k < 4; k++) pts.push([cx + (r() - 0.5) * spread * 0.5, cy + (r() - 0.5) * spread * 0.5]);
					clusters.push({ center: [cx, cy], pts });
				}
				return { center: c, clusters, id: ci };
			});
		}
		const l0 = makeClusters([[0.2, 0.3], [0.8, 0.3], [0.3, 0.75], [0.7, 0.75]], 0.12, 5);
		const l1 = makeClusters(l0.map((c) => c.center), 0.05, 3);
		const l2 = makeClusters(l1.map((c) => c.center), 0.03, 2);
		const l3 = makeClusters(l2.map((c) => c.center), 0.015, 1);
		const scales = [
			{ pts: l0.flatMap((c) => c.pts.flatMap((p) => p.pts)), centers: l0.flatMap((c) => c.clusters.map((p) => p.center)), n: l0.length * 5 },
			{ pts: l1.flatMap((c) => c.pts.flatMap((p) => p.pts)), centers: l1.flatMap((c) => c.clusters.map((p) => p.center)), n: l0.length * 3 },
			{ pts: l2.flatMap((c) => c.pts.flatMap((p) => p.pts)), centers: l2.flatMap((c) => c.clusters.map((p) => p.center)), n: l0.length * 2 },
			{ pts: l3.flatMap((c) => c.pts), centers: l3.flatMap((c) => c.center), n: l0.length }
		];

		function draw(scale) {
			const P = pal(); const W = cv.width, H = cv.height;
			ctx.fillStyle = P.bg; ctx.fillRect(0, 0, W, H);
			const fine = scales[scale];
			const ghost = scale < 3 ? scales[scale + 1] : null;
			const clColors = [P.accent, P.accent2, P.accent3, P.accent4];
			fine.centers.forEach((c, i) => {
				const col = clColors[i % clColors.length];
				if (ghost) {
					ctx.fillStyle = rgba(P.ink, 0.12);
					ghost.pts.forEach((p) => { ctx.beginPath(); ctx.arc(p[0] * W, p[1] * H, 2, 0, TAU); ctx.fill(); });
				}
				ctx.fillStyle = rgba(col, 0.2);
				ctx.beginPath(); ctx.arc(c[0] * W, c[1] * H, 26, 0, TAU); ctx.fill();
				fine.pts.forEach((p) => {
					ctx.fillStyle = col;
					ctx.beginPath(); ctx.arc(p[0] * W, p[1] * H, 4, 0, TAU); ctx.fill();
					ctx.strokeStyle = P.ink; ctx.lineWidth = 1; ctx.stroke();
				});
			});
			ctx.fillStyle = rgba(P.ink, 0.8); ctx.font = 'bold 13px monospace';
			ctx.fillText('scale: ' + scaleNames[scale], 14, 26);
			ctx.font = '11px monospace';
			if (ghost) ctx.fillText('(finer scale shown as grey ghosts)', 14, 44);
		}
		function updatePlot(scale) {
			const P = pal();
			const nClusters = [20, 12, 8, 4][scale];
			const nVoids = [6, 4, 3, 2][scale];
			Plotly.react(plotEl, [{
				type: 'bar',
				x: ['clusters visible', 'voids visible', 'effective degrees of freedom'],
				y: [nClusters, nVoids, [80, 36, 16, 4][scale]],
				marker: { color: [P.accent, P.accent2, P.accent3] }
			}], {
				paper_bgcolor: 'transparent', plot_bgcolor: 'transparent',
				font: { color: P.ink, size: 11 },
				xaxis: { gridcolor: P.grid }, yaxis: { gridcolor: P.grid },
				margin: { l: 40, r: 20, t: 10, b: 40 }, showlegend: false,
				title: { text: 'At the ' + scaleNames[scale] + ' scale, only ' + nClusters + ' clusters and ' + nVoids + ' voids survive coarse-graining', font: { color: P.accent, size: 12 } }
			}, { displayModeBar: false });
		}
		function refresh() {
			const s = +sI.value;
			if (sL) sL.textContent = s + ' (' + scaleNames[s] + ')';
			draw(s);
			updatePlot(s);
		}
		sI.oninput = refresh;
		refresh();
	});

	/* ══════════════════════════════════════════════════════════════
	   13 · Grand synthesis: one control drives four views
	   ══════════════════════════════════════════════════════════════ */
	register(function grandSynthesis() {
		const cvP = $('ps-final-pts'), cvR = $('ps-final-radar'), cvT = $('ps-final-topo'), cvS = $('ps-final-scale');
		if (!cvP || !cvR || !cvT || !cvS) return;
		const ctxP = cvP.getContext('2d'), ctxR = cvR.getContext('2d'), ctxT = cvT.getContext('2d'), ctxS = cvS.getContext('2d');
		const tI = $('ps-final-t'), tL = $('ps-final-tL'), ro = $('ps-final-readout');
		const r = rng(99);
		const centers = [[0.25, 0.3], [0.75, 0.3], [0.3, 0.7], [0.7, 0.7], [0.5, 0.5]];
		const clusterPts = [];
		for (let c = 0; c < 5; c++) for (let i = 0; i < 14; i++) clusterPts.push([centers[c][0] + (r() - 0.5) * 0.12, centers[c][1] + (r() - 0.5) * 0.12, c]);
		const bgPts = [];
		for (let i = 0; i < 120; i++) bgPts.push([r(), r()]);

		function drawPts(t) {
			const P = pal(); const W = cvP.width, H = cvP.height;
			ctxP.fillStyle = P.bg; ctxP.fillRect(0, 0, W, H);
			ctxP.fillStyle = rgba(P.ink2, 0.15 + 0.5 * t);
			bgPts.forEach((p) => { ctxP.beginPath(); ctxP.arc(p[0] * W, p[1] * H, 2.5, 0, TAU); ctxP.fill(); });
			const spread = 1 + 2.5 * t;
			const clCols = [P.accent, P.accent2, P.accent3, P.accent4, P.accent];
			clusterPts.forEach((p) => {
				const x = p[0] + (p[0] - centers[p[2]][0]) * (spread - 1);
				const y = p[1] + (p[1] - centers[p[2]][1]) * (spread - 1);
				ctxP.fillStyle = rgba(clCols[p[2]], 0.9);
				ctxP.beginPath(); ctxP.arc(x * W, y * H, 3.5, 0, TAU); ctxP.fill();
			});
			ctxP.fillStyle = rgba(P.ink, 0.7); ctxP.font = '12px monospace'; ctxP.textAlign = 'left';
			ctxP.fillText('point cloud in X', 12, 22);
		}
		function drawRadar(t) {
			const P = pal(); const W = cvR.width, H = cvR.height, cx = W / 2, cy = H / 2, R = Math.min(W, H) / 2 - 34;
			ctxR.fillStyle = P.bg; ctxR.fillRect(0, 0, W, H);
			const axes = ['Composition', 'Commutativity', 'Zipf', 'Multiscale', 'Voids', 'Topo-stable'];
			const base = [0.9, 0.85, 0.8, 0.85, 0.7, 0.8];
			const vals = base.map((v) => v * (1 - 0.7 * t) + 0.1 * t);
			ctxR.strokeStyle = rgba(P.ink, 0.15);
			for (let g = 1; g <= 4; g++) { ctxR.beginPath(); for (let i = 0; i <= 6; i++) { const a = -Math.PI / 2 + i / 6 * TAU, rr = R * g / 4; ctxR[i ? 'lineTo' : 'moveTo'](cx + rr * Math.cos(a), cy + rr * Math.sin(a)); } ctxR.stroke(); }
			ctxR.strokeStyle = rgba(P.ink, 0.2);
			for (let i = 0; i < 6; i++) { const a = -Math.PI / 2 + i / 6 * TAU; ctxR.beginPath(); ctxR.moveTo(cx, cy); ctxR.lineTo(cx + R * Math.cos(a), cy + R * Math.sin(a)); ctxR.stroke(); }
			ctxR.beginPath();
			for (let i = 0; i <= 6; i++) { const idx = i % 6, a = -Math.PI / 2 + idx / 6 * TAU, rr = R * vals[idx]; ctxR[i ? 'lineTo' : 'moveTo'](cx + rr * Math.cos(a), cy + rr * Math.sin(a)); }
			ctxR.closePath();
			ctxR.fillStyle = rgba(P.accent, 0.25); ctxR.fill();
			ctxR.strokeStyle = P.accent; ctxR.lineWidth = 2; ctxR.stroke();
			ctxR.fillStyle = P.ink; ctxR.font = '10px sans-serif'; ctxR.textAlign = 'center';
			for (let i = 0; i < 6; i++) { const a = -Math.PI / 2 + i / 6 * TAU; ctxR.fillText(axes[i], cx + (R + 20) * Math.cos(a), cy + (R + 20) * Math.sin(a) + 3); }
			ctxR.textAlign = 'left'; ctxR.fillStyle = rgba(P.ink, 0.7); ctxR.font = '12px monospace';
			ctxR.fillText('coherence profile', 12, 22);
		}
		function drawTopo(t) {
			const P = pal(); const W = cvT.width, H = cvT.height, pad = 36;
			ctxT.fillStyle = P.bg; ctxT.fillRect(0, 0, W, H);
			ctxT.strokeStyle = rgba(P.ink, 0.25); ctxT.beginPath(); ctxT.moveTo(pad, 30); ctxT.lineTo(pad, H - pad); ctxT.lineTo(W - 12, H - pad); ctxT.stroke();
			const beta0 = (tt) => 30 * Math.exp(-4 * tt) + 2;
			const beta1 = (tt) => 9 * tt * Math.exp(-2.2 * tt);
			function plotLine(fn, col) {
				ctxT.strokeStyle = col; ctxT.lineWidth = 2; ctxT.beginPath();
				for (let i = 0; i <= 40; i++) { const tt = i / 40, x = pad + tt * (W - pad - 16), y = H - pad - (fn(tt) / 32) * (H - pad - 40); ctxT[i ? 'lineTo' : 'moveTo'](x, y); }
				ctxT.stroke();
			}
			plotLine(beta0, P.accent); plotLine(beta1, P.accent2);
			const mx = pad + t * (W - pad - 16);
			ctxT.strokeStyle = P.accent3; ctxT.lineWidth = 2; ctxT.beginPath(); ctxT.moveTo(mx, 30); ctxT.lineTo(mx, H - pad); ctxT.stroke();
			ctxT.fillStyle = P.accent; ctxT.font = '12px monospace'; ctxT.fillText('\u03B2\u2080', pad + 6, H - 10);
			ctxT.fillStyle = P.accent2; ctxT.fillText('\u03B2\u2081', pad + 34, H - 10);
			ctxT.fillStyle = rgba(P.ink, 0.7); ctxT.fillText('topological signature \u03C6(t)', 12, 22);
		}
		function drawScale(t) {
			const P = pal(); const W = cvS.width, H = cvS.height;
			ctxS.fillStyle = P.bg; ctxS.fillRect(0, 0, W, H);
			const scales = ['token', 'phrase', 'sentence', 'discourse'];
			const bh = (H - 50) / 4;
			scales.forEach((s, i) => {
				const y = 34 + i * bh;
				const strength = 1 - 0.5 * t;
				ctxS.fillStyle = rgba(P.accent3, 0.12 + 0.45 * strength);
				ctxS.fillRect(70, y, W - 90, bh - 10);
				ctxS.fillStyle = P.ink; ctxS.font = '11px monospace'; ctxS.textAlign = 'left';
				ctxS.fillText(s, 10, y + bh / 2);
				ctxS.textAlign = 'right';
				ctxS.fillText((0.3 + 0.7 * strength).toFixed(2), W - 12, y + bh / 2);
			});
			ctxS.textAlign = 'left'; ctxS.fillStyle = rgba(P.ink, 0.7); ctxS.fillText('scale invariance (per level)', 12, 22);
		}
		function refresh() {
			const t = +tI.value;
			if (tL) tL.textContent = t.toFixed(2);
			drawPts(t); drawRadar(t); drawTopo(t); drawScale(t);
			if (ro) {
				if (t < 0.25) ro.textContent = 'Semantic structure: tight clusters, high coherence, a stable topological signature, and strong scale-invariance. The "ideal" end of the space.';
				else if (t < 0.6) ro.textContent = 'Pragmatic layer: clusters persist but coherence is partially context-dependent. The structure is real yet modulated by use.';
				else ro.textContent = 'Noise end: clusters dissolve, coherence collapses, the topological signature degenerates, scale-invariance is lost. The geometric structure is gone.';
			}
		}
		tI.oninput = refresh;
		[['ps-final-sem', '0'], ['ps-final-prag', '0.5'], ['ps-final-noise', '1']].forEach(([id, v]) => {
			const b = $(id);
			if (b) b.onclick = () => { tI.value = v; refresh(); };
		});
		refresh();
	});

})();
