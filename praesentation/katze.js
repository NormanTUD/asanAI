// ============================================================
// katze.js — Framework "ASCII-Katze" (aus katze.html)
//
// Zwei Folien teilen sich dasselbe Gerüst: die 32×32-ASCII-Katze
// als Canvas-Raster + gestufter Ablauf (Kicker, Titel, Pill, Chips,
// Dots). Die Schritte laufen über die Pfeiltasten (DemoRegistry):
//   - ConvDemo     "Was sind Convolutions?" — Katze → 3 Kanäle →
//                  6×5-Filter in Augen-Form findet die Augen über
//                  756 Positionen → 8×8-Map
//   - FlattenDemo  "Was macht Flatten?" — Pixel → RGB → Grün →
//                  Grau → Schnur (1024 Zahlen) → Fazit
// ============================================================

const KatzeKit = (() => {
	'use strict';

	/* ═══════════ Daten: 32×32 ASCII-Katze ═══════════ */
	const P = {'.':'#B5B02B', k:'#141414', d:'#4A332A', b:'#7A5238', w:'#FBF4E6', W:'#FFFFFF',
	           y:'#E2C72E', n:'#F2A594', m:'#C98878', p:'#F0A08A'};
	const ART = [
		"................................",".........kk..........kk.........",
		"........kddk........kddk........",".......kdbbk.......kdbbk........",
		"......kdbbbdk.....kdbbbdk.......",".....kkdbbbdkkkkkkkdbbbdkk......",
		"....kkkdbbdkkkwkkkkdbbdkkk......","....kkkkddkkkkwkkkkkddkkkkk.....",
		"...kkkkkkkkkkwwwkkkkkkkkkkk.....","...kkkkkkkkkkwwwkkkkkkkkkkkk....",
		"..kkkyyykkkkkwwwkkkkyyykkkkk....","..kkyyyyykkkkwwwkkkyyyyykkkk....",
		"W.kkyykkykkkwwwwwkkyykkykkkk....",".Wkkyykkykkwwwwwwwkyykkykkkk.W..",
		"W.kkyyyyykkwwwwwwwkyyyyykkkk.W..",".WkkkyyykkkwwwwwwwkkyyykkkkkW...",
		"..kkkkkkkkwwwnnnwwwkkkkkkkkk....","...kkkkkkkwwmnnnmwwkkkkkkkk.W...",
		"....kkkkkkwwwmnmwwwkkkkkkkk.....","...W.kkkkkwwwwmwwwwwkkkkkkkkW...",
		"......kkkkwwwwwwwwwwkkkkkkkkk...",".......kkkbwwwwwwwwkkkkkkkkkkk..",
		"......W.kkbwwwwwwwkkkkkkkkkkkkk.","..........kbwwwwwkkkkkkkkkkkkkkk",
		"......wwwkkbwwwwkkkkkkkkkkkkkkkk",".....wwwwwkbwwwkkkkkkkkkkkkkkkkk",
		".....dwwwwdkkkkkkkkkkkkkkkkkkkkk","......dddkkkkkkkkkkkkkkkkkkkkkk.",
		"...wwwkkkkkkkkkkkkkkkkkkkkkkkk..","..wpwpwwkkkkkkkkkkkkkkkkkkkk....",
		"..dwpwpwdkkkkkkkkkkkkkkkk.......","...dwwwwd......................."
	];
	const N = 32;

	const hex = h => [parseInt(h.slice(1,3),16), parseInt(h.slice(3,5),16), parseInt(h.slice(5,7),16)];
	const RGB = [], YELLOW = [];
	for (let r = 0; r < N; r++) {
		const row = (ART[r] || '').padEnd(N, '.');
		for (let c = 0; c < N; c++) {
			const ch = row[c];
			RGB.push(hex(P[ch] || P['.']));
			YELLOW.push(ch === 'y' ? 1 : 0);
		}
	}
	const GREEN = RGB.map(v => v[1]);
	const PICK = 1; // Grün-Kanal

	/* ═══════════ Helpers ═══════════ */
	const lerp = (a, b, t) => a + (b - a) * t;
	const eInOut = t => t < .5 ? 4*t*t*t : 1 - Math.pow(-2*t+2, 3)/2;
	const tint = (v, i) => i === 0 ? [255, 255-v, 255-v] : i === 1 ? [255-v, 255, 255-v] : [255-v, 255-v, 255];

	function colorOf(i, ch, mix, gmix) {
		const [R, G, B] = RGB[i];
		const v = RGB[i][ch];
		const [tr, tg, tb] = tint(v, ch);
		let r = lerp(R, tr, mix), g = lerp(G, tg, mix), b = lerp(B, tb, mix);
		r = lerp(r, v, gmix); g = lerp(g, v, gmix); b = lerp(b, v, gmix);
		return `rgb(${r|0},${g|0},${b|0})`;
	}

	// Ein Raster (32×32) als gefüllte Blöcke — ceil auf ganze
	// Gerätepixel → garantiert keine Lücken zwischen den Zellen.
	function drawGrid(ctx, o, ch, grayMix) {
		if (o.a < 0.005) return;
		ctx.globalAlpha = o.a;
		const s = o.s;
		for (let r = 0; r < N; r++) {
			const y = o.y + r * s, yh = Math.ceil(y + s) - Math.floor(y);
			for (let c = 0; c < N; c++) {
				const x = o.x + c * s, xw = Math.ceil(x + s) - Math.floor(x);
				ctx.fillStyle = colorOf(r * N + c, ch, o.mix, ch === PICK ? grayMix : 0);
				ctx.fillRect(Math.floor(x), Math.floor(y), xw, yh);
			}
		}
		ctx.globalAlpha = 1;
	}

	function roundRect(ctx, x, y, w, h, r) {
		ctx.beginPath();
		ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r);
		ctx.arcTo(x + w, y + h, x, y + h, r);
		ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y + h, x, y, r);
		ctx.closePath();
	}

	const TAGS = [['ROT', '#f43f5e'], ['GRÜN', '#10b981'], ['BLAU', '#3b82f6']];

	function drawTags(ctx, S, tagA) {
		S.inst.forEach((o, i) => {
			if (tagA[i] < 0.01) return;
			const gray = i === PICK && S.grayMix > 0.5;
			const label = gray ? 'GRAUSTUFEN' : TAGS[i][0];
			const col = gray ? '#6b7280' : TAGS[i][1];
			ctx.globalAlpha = tagA[i];
			ctx.font = '800 10px -apple-system, system-ui, sans-serif';
			ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
			const tw = ctx.measureText(label).width + 24;
			const cx = o.x + N * o.s / 2, cy = o.y - 16;
			ctx.fillStyle = col;
			roundRect(ctx, cx - tw / 2, cy - 9, tw, 18, 9);
			ctx.fill();
			ctx.fillStyle = '#fff';
			ctx.fillText(label.split('').join('\u200a'), cx, cy + .5);
			ctx.globalAlpha = 1;
		});
	}

	/* ═══════════ Factory ═══════════ */
	// cfg: {
	//   slideId:   Folien-ID (z.B. 'slide-flatten')
	//   prefix:    Element-ID-Präfix ('flat' / 'conv'):
	//              <prefix>-cv/-kicker/-title/-pill/-chips/-tswap/-fswap/-dots/-insight
	//   steps:     [{k, t, p, c, i?}] — Kicker, Titel(HTML), Pill(HTML),
	//              Chips(HTML), optional Fazit-Box(HTML)
	//   layoutFor(step, S): Zielwerte der Instanzen + Demo-Ziele setzen
	//   onStep(step):       Hook pro Schrittwechsel
	//   tick(dt, k, S, setFoot): Pro-Frame-Update (dt in 60-FPS-Einheiten)
	//   draw(ctx, S):       Komplette Szene zeichnen (inkl. Hintergrund)
	// }
	// S = geteilter Zustand: { W, H, step, grayMix, tGrayMix,
	//                           inst: [3 × {x,y,s,a, tx,ty,ts,ta, mix,tmix}] }
	function create(cfg) {
		const els = {};
		let cv, ctx, stage, dots = [];
		let W = 0, H = 0, DPR = 1;
		let cur = -1, busy = false, rafId = null, last = 0;

		const S = {
			W: 0, H: 0, step: -1, grayMix: 0, tGrayMix: 0,
			inst: [0, 1, 2].map(i => ({
				x: 0, y: 0, s: 10, a: i === 0 ? 1 : 0,
				tx: 0, ty: 0, ts: 10, ta: i === 0 ? 1 : 0,
				mix: 0, tmix: 0
			}))
		};

		function resize() {
			if (!stage) return;
			DPR = Math.min(window.devicePixelRatio || 1, 2);
			W = stage.clientWidth; H = stage.clientHeight;
			cv.width = Math.round(W * DPR); cv.height = Math.round(H * DPR);
			ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
			ctx.imageSmoothingEnabled = false;
			S.W = W; S.H = H;
			if (cur >= 0) cfg.layoutFor(cur, S);
		}

		function setText(i) {
			const s = cfg.steps[i];
			els.kicker.textContent = s.k;
			els.title.innerHTML = s.t;
			els.pill.innerHTML = s.p;
			els.chips.innerHTML = s.c;
		}

		function updateInsight() {
			if (!els.insight) return;
			const s = cfg.steps[Math.max(0, cur)];
			if (s && s.i) {
				els.insight.innerHTML = s.i;
				els.insight.classList.add('on');
			} else {
				els.insight.classList.remove('on');
			}
		}

		// Text-Swap: Kopf nach oben raus / von unten rein, Fuß gegenläufig.
		function swapText(i) {
			els.tswap.style.transition = 'transform .4s cubic-bezier(.4,0,1,1),opacity .4s,filter .4s';
			els.tswap.style.transform = 'translateX(-50%) translateY(-14px)';
			els.tswap.style.opacity = '0'; els.tswap.style.filter = 'blur(3px)';
			els.fswap.style.transition = 'transform .4s cubic-bezier(.4,0,1,1),opacity .4s';
			els.fswap.style.transform = 'translateX(-50%) translateY(10px)';
			els.fswap.style.opacity = '0';

			setTimeout(() => {
				setText(i);

				els.tswap.style.transition = 'none';
				els.tswap.style.transform = 'translateX(-50%) translateY(16px)';
				els.tswap.style.filter = 'blur(4px)';
				els.fswap.style.transition = 'none';
				els.fswap.style.transform = 'translateX(-50%) translateY(-12px)';
				void els.tswap.offsetWidth; void els.fswap.offsetWidth;

				els.tswap.style.transition = 'transform .9s cubic-bezier(.16,1,.3,1),opacity .75s cubic-bezier(.16,1,.3,1),filter .75s cubic-bezier(.16,1,.3,1)';
				els.tswap.style.transform = 'translateX(-50%) translateY(0)';
				els.tswap.style.opacity = '1'; els.tswap.style.filter = 'blur(0px)';
				els.fswap.style.transition = 'transform .9s cubic-bezier(.16,1,.3,1) .06s,opacity .75s cubic-bezier(.16,1,.3,1) .06s';
				els.fswap.style.transform = 'translateX(-50%) translateY(0)';
				els.fswap.style.opacity = '1';
			}, 410);
		}

		function updateDots() {
			dots.forEach((d, j) => d.classList.toggle('act', j === cur));
		}

		function setFoot(p, c) {
			els.pill.innerHTML = p;
			els.chips.innerHTML = c;
		}

		function go(n, instant) {
			n = Math.max(0, Math.min(cfg.steps.length - 1, n));
			if (n === cur || (!instant && busy)) return;
			if (cfg.onStep) cfg.onStep(n);
			cfg.layoutFor(n, S);
			S.step = n;
			cur = n;
			if (instant) setText(n); else swapText(n);
			updateInsight();
			updateDots();
			if (!instant) {
				busy = true;
				setTimeout(() => { busy = false; }, 420);
			}
		}

		function frame(ts) {
			const dt = Math.min((ts - last) / 16.667, 3); last = ts;
			const k = 1 - Math.pow(1 - 0.085, dt); // framerate-unabhängiges Lerp
			S.inst.forEach(o => {
				o.x = lerp(o.x, o.tx, k); o.y = lerp(o.y, o.ty, k);
				o.s = lerp(o.s, o.ts, k); o.a = lerp(o.a, o.ta, k * 1.25);
				o.mix = lerp(o.mix, o.tmix, k);
			});
			S.grayMix = lerp(S.grayMix, S.tGrayMix, k);
			if (cfg.tick) cfg.tick(dt, k, S, setFoot);
			if (cfg.draw) cfg.draw(ctx, S);
			rafId = requestAnimationFrame(frame);
		}

		function startLoop() {
			if (rafId != null) return;
			last = performance.now();
			rafId = requestAnimationFrame(frame);
		}
		function stopLoop() {
			if (rafId != null) { cancelAnimationFrame(rafId); rafId = null; }
		}

		function isOnSlide() {
			const a = document.querySelector('.slide.active');
			return a && a.id === cfg.slideId;
		}

		function init() {
			cv = document.getElementById(cfg.prefix + '-cv');
			if (!cv) return;
			stage = cv.parentElement;
			ctx = cv.getContext('2d', { alpha: false });
			els.kicker = document.getElementById(cfg.prefix + '-kicker');
			els.title = document.getElementById(cfg.prefix + '-title');
			els.pill = document.getElementById(cfg.prefix + '-pill');
			els.chips = document.getElementById(cfg.prefix + '-chips');
			els.tswap = document.getElementById(cfg.prefix + '-tswap');
			els.fswap = document.getElementById(cfg.prefix + '-fswap');
			els.insight = document.getElementById(cfg.prefix + '-insight');

			dots = [];
			const dotsEl = document.getElementById(cfg.prefix + '-dots');
			if (dotsEl) {
				dotsEl.innerHTML = '';
				cfg.steps.forEach(() => {
					const d = document.createElement('div');
					d.className = 'kz-dot';
					dotsEl.appendChild(d);
					dots.push(d);
				});
			}

			resize();
			// Start-Animation: Pixel fahren aus der Mitte auf.
			S.inst.forEach(o => { o.s = 1; o.x = W / 2; o.y = H / 2; o.a = 0; });
			startLoop();
			go(0, true);
		}

		function reset() {
			stopLoop();
			cur = -1;
			busy = false;
			if (els.insight) els.insight.classList.remove('on');
		}

		function next() { if (canGoNext()) go(cur + 1, false); }
		function prev() { if (canGoPrev()) go(cur - 1, false); }
		function canGoNext() { return cur >= 0 && cur < cfg.steps.length - 1; }
		function canGoPrev() { return cur > 0; }

		// Zustand merken/wiederherstellen (siehe DemoRegistry.restoreState)
		function getState() { return { step: Math.max(0, cur) }; }
		function setState(st) {
			if (!st || typeof st.step !== 'number') return;
			if (rafId == null && ctx) startLoop();
			go(st.step, true);
		}

		let rsz = null;
		window.addEventListener('resize', () => {
			clearTimeout(rsz);
			rsz = setTimeout(() => { if (isOnSlide()) resize(); }, 110);
		});

		return { init, reset, next, prev, canGoNext, canGoPrev, getState, setState };
	}

	return { create, lerp, eInOut, roundRect, drawGrid, drawTags, N, PICK, GREEN, YELLOW };
})();

// ============================================================
// ConvDemo — "Was sind Convolutions?" (Einstieg nach der Intro)
//
// 32×32-Katze, 6 Schritte:
// 0: die Farb-Katze
// 1: das Bild spaltet in drei Kanal-Stapel (ROT/GRÜN/BLAU)
// 2: die Stapel faden zusammen + der Filter erscheint — 6×5,
//    so groß und in der Form wie ein Katzenauge (gelb, wo das
//    Auge gelb ist; Pupille und Rand bleiben weiß)
// 3: das Fenster wird auf das Bild gelegt
// 4: das Fenster fährt über alle 756 Positionen (27×28 fein)
// 5: die 8×8-Map — jedes Auge leuchtet als ein großer Pixel
// ============================================================
const ConvDemo = (() => {
	'use strict';

	// Der Filter ist so groß wie ein Auge: 6×5. Template = linkes
	// Auge (Zeilen 10–15, Spalten 4–8): 1, wo das Auge gelb ist.
	const KH = 6, KW = 5, ER = 10, EC = 4;
	const TPL = [];
	for (let dr = 0; dr < KH; dr++)
		for (let dc = 0; dc < KW; dc++)
			TPL.push(KatzeKit.YELLOW[(ER + dr) * KatzeKit.N + (EC + dc)]);
	const TMAX = TPL.reduce((a, b) => a + b, 0);
	const OH = KatzeKit.N - KH + 1, OW = KatzeKit.N - KW + 1;
	const OCELLS = OH * OW, TH = 20;
	const SCORES = new Array(OCELLS);
	for (let r = 0; r < OH; r++) for (let c = 0; c < OW; c++) {
		let s = 0;
		for (let dr = 0; dr < KH; dr++)
			for (let dc = 0; dc < KW; dc++)
				if (TPL[dr * KW + dc]) s += KatzeKit.YELLOW[(r + dr) * KatzeKit.N + (c + dc)];
		SCORES[r * OW + c] = s;
	}

	// Ausgabe: 8×8 (Pooling der feinen 27×28-Map). Jede Zelle
	// (R,C) deckt einen Block feiner Fenster ab; sie ist "voll",
	// wenn der Sweep den Block durchhat, und leuchtet, wenn dort
	// ein Fenster voll aufs Auge passt.
	const O8 = 8;
	const END8 = new Array(O8 * O8), LIT8 = new Array(O8 * O8).fill(-1);
	for (let R = 0; R < O8; R++) for (let C = 0; C < O8; C++) {
		const fr0 = Math.floor(R * OH / O8), fr1 = Math.floor((R + 1) * OH / O8) - 1;
		const fc0 = Math.floor(C * OW / O8), fc1 = Math.floor((C + 1) * OW / O8) - 1;
		END8[R * O8 + C] = fr1 * OW + fc1 + 1;
		for (let fr = fr0; fr <= fr1; fr++)
			for (let fc = fc0; fc <= fc1; fc++) {
				const i = fr * OW + fc;
				if (SCORES[i] >= TH && (LIT8[R * O8 + C] < 0 || i < LIT8[R * O8 + C]))
					LIT8[R * O8 + C] = i;
			}
	}

	let sweepP = 0, sweepDone = 0;
	let kerA = 0, tKerA = 0;
	let outA = 0, tOutA = 0;
	let tagA = [0, 0, 0], tTagA = [0, 0, 0];
	const KC = 24; // Filter-Panel: Zellgröße in px

	function drawOutput8(ctx, S) {
		if (outA < 0.01) return;
		const o = S.inst[0], s = o.s;
		const os = s * 4; // 8 Zellen = 32 Bildspalten → gleich groß wie die Katze
		const ox = o.x + KatzeKit.N * s + 60, oy = o.y;

		ctx.globalAlpha = outA * 0.9;
		ctx.fillStyle = '#fff';
		KatzeKit.roundRect(ctx, ox - 7, oy - 7, O8 * os + 14, O8 * os + 14, 11);
		ctx.fill();
		ctx.strokeStyle = '#eef0f4'; ctx.lineWidth = 1; ctx.stroke();
		ctx.globalAlpha = 1;
		if (S.step < 3) return;

		for (let i8 = 0; i8 < O8 * O8; i8++) {
			const R = (i8 / O8) | 0, C = i8 % O8;
			const x = Math.floor(ox + C * os), y = Math.floor(oy + R * os);
			const xw = Math.ceil(ox + (C + 1) * os) - x, yh = Math.ceil(oy + (R + 1) * os) - y;
			const lit = LIT8[i8];
			const isLit = lit >= 0 && (S.step >= 5 || (S.step === 4 && sweepP > lit));
			const isFull = !isLit && (S.step >= 5 || (S.step === 4 && sweepP >= END8[i8]));
			ctx.globalAlpha = outA;
			if (isLit) {
				ctx.fillStyle = 'rgba(76,175,80,.5)';
				ctx.fillRect(x, y, xw, yh);
				ctx.strokeStyle = '#4caf50'; ctx.lineWidth = 1.5;
				ctx.strokeRect(x + 1, y + 1, xw - 2, yh - 2);
			} else if (isFull) {
				ctx.fillStyle = '#f6f7f9';
				ctx.fillRect(x, y, xw, yh);
			}
			ctx.globalAlpha = 1;
		}

		// Weicher Glow um die leuchtenden Augen-Pixel (ab dem Moment,
		// in dem der Sweep das Auge findet).
		if (S.step >= 4) {
			for (let i8 = 0; i8 < O8 * O8; i8++) {
				const lit = LIT8[i8];
				if (lit < 0 || (S.step === 4 && sweepP <= lit)) continue;
				const R = (i8 / O8) | 0, C = i8 % O8;
				const cx = ox + (C + .5) * os, cy = oy + (R + .5) * os;
				const g = ctx.createRadialGradient(cx, cy, 1, cx, cy, os * 1.8);
				g.addColorStop(0, 'rgba(76,175,80,.32)');
				g.addColorStop(1, 'rgba(76,175,80,0)');
				ctx.fillStyle = g;
				ctx.fillRect(cx - os * 2, cy - os * 2, os * 4, os * 4);
			}
		}
	}

	function drawKernel(ctx, S) {
		if (kerA < 0.01) return;
		const o = S.inst[0], s = o.s;
		const kw = KW * KC, kh = KH * KC;
		const kx = Math.max(o.x - kw - 56, 4);
		const ky = o.y + (KatzeKit.N * s) / 2 - kh / 2;
		ctx.globalAlpha = kerA;
		ctx.fillStyle = '#fff';
		KatzeKit.roundRect(ctx, kx - 9, ky - 9, kw + 18, kh + 18, 10);
		ctx.fill();
		ctx.strokeStyle = '#cfe0ff'; ctx.lineWidth = 1.2; ctx.stroke();
		for (let r = 0; r < KH; r++) for (let c = 0; c < KW; c++) {
			// 0-Zellen (Pupille + Rand) bleiben weiß wie das Panel.
			if (!TPL[r * KW + c]) continue;
			ctx.fillStyle = '#E2C72E';
			ctx.fillRect(kx + c * KC + 3, ky + r * KC + 3, KC - 6, KC - 6);
		}
		ctx.globalAlpha = 1;
	}

	function drawWindow(ctx, S) {
		if (S.step < 3 || S.step > 4) return;
		const o = S.inst[0], s = o.s;
		const i = Math.min(Math.floor(S.step === 4 ? sweepP : 0), OCELLS - 1);
		const r = (i / OW) | 0, c = i % OW;
		const x = o.x + c * s, y = o.y + r * s;
		const sc = SCORES[i], hot = sc >= TH;

		ctx.fillStyle = hot ? 'rgba(76,175,80,.30)' : 'rgba(150,190,240,.30)';
		ctx.fillRect(x, y, KW * s, KH * s);
		ctx.strokeStyle = hot ? '#4caf50' : '#7aa8e0'; ctx.lineWidth = 2;
		ctx.strokeRect(x + 1, y + 1, KW * s - 2, KH * s - 2);

		const bw = 46, bh = 20, bx = x + KW * s / 2 - bw / 2, by = y - bh - 6;
		if (by > 0) {
			ctx.fillStyle = '#fff'; ctx.fillRect(bx, by, bw, bh);
			ctx.strokeStyle = hot ? '#4caf50' : '#7aa8e0'; ctx.lineWidth = 1.1;
			ctx.strokeRect(bx + .5, by + .5, bw - 1, bh - 1);
			ctx.fillStyle = hot ? '#2e7d32' : '#4a7fc0';
			ctx.font = '600 11.5px Inter, system-ui, sans-serif';
			ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
			ctx.fillText(sc + '', x + KW * s / 2, by + bh / 2);
		}
	}

	return KatzeKit.create({
		slideId: 'slide-convolution',
		prefix: 'conv',
		steps: [
			{ k: 'Schritt 1', t: 'Wir fangen bei<br>der <em>Katze</em> an.',
			  p: 'Das Originalbild · 32 × 32 Pixel',
			  c: '<span class="kz-chip">(32, 32, 3)</span>' },
			{ k: 'Schritt 2', t: 'Farbbilder haben<br><em>drei</em> Stapel.',
			  p: 'Rot, Grün und Blau — drei eigene Zahlen-Raster',
			  c: '<span class="kz-chip">(32, 32, 3)</span><span class="kz-arrow">=</span><span class="kz-chip">3 × (32, 32)</span>' },
			{ k: 'Schritt 3', t: 'Ein <em>Filter</em> ist ein Muster —<br>hier die Form des <em>Auges</em>.',
			  p: 'So groß wie ein Auge · gelb, wo das Auge gelb ist',
			  c: '<span class="kz-chip">(6, 5)</span>' },
			{ k: 'Schritt 4', t: 'Das Muster wird<br>auf das Bild <em>gelegt</em>.',
			  p: `Punkt <b>1</b> von ${OCELLS} · Treffer: <b>0</b> von ${TMAX}`,
			  c: '<span class="kz-chip">(32, 32)</span><span class="kz-arrow">×</span><span class="kz-chip">(6, 5)</span>' },
			{ k: 'Schritt 5', t: `… und über<br><em>alle ${OCELLS}</em> Positionen.`,
			  p: `Fenster <b>1</b> von ${OCELLS}`,
			  c: `<span class="kz-chip">(${OH}, ${OW})</span><span class="kz-arrow">→</span><span class="kz-chip g">(8, 8)</span>` },
			{ k: 'Schritt 6', t: 'Wo der Filter passt,<br>leuchten <em>die Augen</em>.',
			  p: `1024 Pixel → ${O8 * O8} Zahlen — und die Augen bleiben`,
			  c: `<span class="kz-chip g">(8, 8)</span>` }
		],

		layoutFor(step, S) {
			const { W, H, inst } = S;
			const s = Math.min(H / KatzeKit.N * .86, W / KatzeKit.N * .86, 13);
			const imgW = KatzeKit.N * s, gapOut = 60, outW = O8 * s * 4;
			if (step === 0) {
				// Farb-Katze, zentriert.
				inst.forEach((o, i) => {
					o.ts = s; o.tx = (W - imgW) / 2; o.ty = (H - imgW) / 2 + 6;
					o.tmix = i === 0 ? 0 : 1; o.ta = i === 0 ? 1 : 0;
				});
				tTagA = [0, 0, 0];
			} else if (step === 1) {
				// Drei Kanal-Stapel (wie Flatten, Schritt 1).
				const g = Math.min(W * .035, 46);
				const ss = Math.min((W - g * 2) / (KatzeKit.N * 3) * .96, H / KatzeKit.N * .82, 8);
				const bw = KatzeKit.N * ss, tot = bw * 3 + g * 2, ox = (W - tot) / 2, oy = (H - bw) / 2 + 8;
				inst.forEach((o, i) => {
					o.ts = ss; o.tx = ox + i * (bw + g); o.ty = oy;
					o.tmix = 1; o.ta = 1;
				});
				tTagA = [1, 1, 1];
			} else {
				inst.forEach((o, i) => {
					o.ts = s;
					o.tx = (W - (imgW + gapOut + outW)) / 2;
					o.ty = (H - imgW) / 2 + 6;
					o.tmix = i === 0 ? 0 : 1;
					o.ta = i === 0 ? (step >= 5 ? .22 : 1) : 0;
				});
				tTagA = [0, 0, 0];
			}
			tKerA = step <= 1 ? 0 : (step >= 5 ? .45 : 1);
			tOutA = step >= 3 ? 1 : 0;
		},

		onStep(step) {
			if (step === 4) { sweepP = 0; sweepDone = 0; }
		},

		tick(dt, k, S, setFoot) {
			kerA = KatzeKit.lerp(kerA, tKerA, k * 1.2);
			outA = KatzeKit.lerp(outA, tOutA, k * 1.2);
			for (let i = 0; i < 3; i++) tagA[i] = KatzeKit.lerp(tagA[i], tTagA[i], k * 1.2);
			if (S.step !== 4) return;
			// 756 Fenster in ~9 s
			sweepP = Math.min(sweepP + dt * (OCELLS / (9 * 60)), OCELLS);
			const i = Math.min(Math.floor(sweepP), OCELLS - 1);
			if (sweepP >= OCELLS) {
				if (!sweepDone) {
					sweepDone = 1;
					setFoot(`Fertig — <b>${OCELLS}</b> Fenster → <b>${O8 * O8}</b> Zahlen (8 × 8)`,
						'<span class="kz-chip g">(8, 8)</span>');
				}
			} else {
				setFoot(`Fenster <b>${i + 1}</b> von ${OCELLS} · Treffer: <b>${SCORES[i]}</b> von ${TMAX}`,
					'<span class="kz-chip g">(8, 8)</span>');
			}
		},

		draw(ctx, S) {
			ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, S.W, S.H);
			drawOutput8(ctx, S);
			const o = S.inst[0];
			if (S.step === 1) {
				KatzeKit.drawGrid(ctx, o, 0, 0);
				KatzeKit.drawGrid(ctx, S.inst[1], 1, 0);
				KatzeKit.drawGrid(ctx, S.inst[2], 2, 0);
				KatzeKit.drawTags(ctx, S, tagA);
			} else {
				KatzeKit.drawGrid(ctx, o, 0, 0);
				// Beim Zusammenfaden flackern die Kanäle kurz drüber.
				KatzeKit.drawGrid(ctx, S.inst[1], 1, 0);
				KatzeKit.drawGrid(ctx, S.inst[2], 2, 0);
			}
			if (S.step !== 1 && o.a > 0.02) {
				ctx.globalAlpha = o.a;
				ctx.strokeStyle = '#1b1f24'; ctx.lineWidth = 1.5;
				ctx.strokeRect(o.x + .5, o.y + .5, KatzeKit.N * o.s - 1, KatzeKit.N * o.s - 1);
				ctx.globalAlpha = 1;
			}
			drawKernel(ctx, S);
			drawWindow(ctx, S);
		}
	});
})();

// ============================================================
// FlattenDemo — "Was macht Flatten?"
//
// 32×32-Katze, 6 Schritte (wie in katze.html, plus Fazit):
// 0: Original · 1: drei Kanal-Stapel · 2: nur Grün ·
// 3: Grün = Grau · 4: Raster wird zur Schnur (1024 Zahlen) ·
// 5: Fazit (Dense-Layer).
// ============================================================
const FlattenDemo = (() => {
	'use strict';

	let railA = 0, tRailA = 0;
	let tagA = [0, 0, 0], tTagA = [0, 0, 0];
	let flatP = 0, flatMsg = 0;

	function drawRowInRail(ctx, r, rx, ry, rh, pw) {
		for (let c = 0; c < KatzeKit.N; c++) {
			const i = r * KatzeKit.N + c, v = KatzeKit.GREEN[i];
			const x = rx + i * pw;
			ctx.fillStyle = `rgb(${v},${v},${v})`;
			ctx.fillRect(Math.floor(x), Math.floor(ry), Math.ceil(x + pw) - Math.floor(x), Math.round(rh));
		}
	}

	// Flatten: zeilenweise. rowsDone = fertige Zeilen,
	// rowT = Fortschritt der gerade fliegenden Zeile (0..1).
	function drawFlat(ctx, S) {
		const o = S.inst[KatzeKit.PICK], s = o.s;
		const rowsDone = Math.floor(flatP), rowT = flatP - rowsDone;

		const railW = Math.min(S.W * .97, 1140);
		const pw = railW / (KatzeKit.N * KatzeKit.N);
		const rx = (S.W - railW) / 2;
		const ry = o.y + KatzeKit.N * s + 46;
		const rh = Math.min(S.H - ry - 4, 54);

		if (railA > 0.01) {
			ctx.globalAlpha = railA * 0.9;
			ctx.fillStyle = '#fff';
			ctx.strokeStyle = '#eef0f4'; ctx.lineWidth = 1;
			KatzeKit.roundRect(ctx, rx - 7, ry - 7, railW + 14, rh + 14, 11);
			ctx.fill(); ctx.stroke();
			ctx.globalAlpha = 1;
		}

		for (let r = 0; r < KatzeKit.N; r++) {
			const y = o.y + r * s, yh = Math.ceil(y + s) - Math.floor(y);
			if (r < rowsDone) ctx.globalAlpha = 0.10;
			else if (r === rowsDone) ctx.globalAlpha = 1 - rowT;
			else ctx.globalAlpha = 1;
			for (let c = 0; c < KatzeKit.N; c++) {
				const i = r * KatzeKit.N + c, v = KatzeKit.GREEN[i];
				const x = o.x + c * s, xw = Math.ceil(x + s) - Math.floor(x);
				ctx.fillStyle = `rgb(${v},${v},${v})`;
				ctx.fillRect(Math.floor(x), Math.floor(y), xw, yh);
			}
		}
		ctx.globalAlpha = 1;

		for (let r = 0; r < rowsDone; r++) drawRowInRail(ctx, r, rx, ry, rh, pw);

		if (rowsDone < KatzeKit.N && rowT > 0) {
			const t = KatzeKit.eInOut(rowT);
			const srcY = o.y + rowsDone * s;
			const y = KatzeKit.lerp(srcY, ry, t);
			const hh = KatzeKit.lerp(s, rh, t);
			for (let c = 0; c < KatzeKit.N; c++) {
				const i = rowsDone * KatzeKit.N + c, v = KatzeKit.GREEN[i];
				const srcX = o.x + c * s;
				const dstX = rx + (rowsDone * KatzeKit.N + c) * pw;
				const x = KatzeKit.lerp(srcX, dstX, t), w = KatzeKit.lerp(s, pw, t);
				ctx.fillStyle = `rgb(${v},${v},${v})`;
				ctx.fillRect(Math.floor(x), Math.floor(y),
					Math.ceil(x + w) - Math.floor(x), Math.ceil(y + hh) - Math.floor(y));
			}
			// Leuchtlinie unter der fliegenden Zeile
			ctx.globalAlpha = (1 - Math.abs(t * 2 - 1)) * 0.5;
			ctx.fillStyle = '#f43f5e';
			ctx.fillRect(Math.floor(KatzeKit.lerp(o.x, rx, t)), Math.floor(y + hh + 2),
				Math.ceil(KatzeKit.lerp(KatzeKit.N * s, KatzeKit.N * pw, t)), 2);
			ctx.globalAlpha = 1;
		}
	}

	return KatzeKit.create({
		slideId: 'slide-flatten',
		prefix: 'flat',
		steps: [
			{ k: 'Schritt 1', t: 'Jeder Pixel ist<br>nur eine <em>Zahl</em>.',
			  p: 'Das Originalbild · 32 × 32 Pixel',
			  c: '<span class="kz-chip">(32, 32, 3)</span>' },
			{ k: 'Schritt 2', t: 'Farbbilder haben<br><em>drei</em> Stapel.',
			  p: 'Rot, Grün und Blau — drei eigene Zahlen-Raster',
			  c: '<span class="kz-chip">(32, 32, 3)</span><span class="kz-arrow">=</span><span class="kz-chip">3 × (32, 32)</span>' },
			{ k: 'Schritt 3', t: 'Nimm einen davon:<br>den <em>Grün-Kanal</em>.',
			  p: 'Ein einzelner Kanal ist ein Raster aus 1024 Zahlen',
			  c: '<span class="kz-chip">(32, 32)</span>' },
			{ k: 'Schritt 4', t: 'Ein Kanal ist nur<br><em class="gray">Grau</em>.',
			  p: 'Die grüne Farbe war nur Deko — es sind reine Zahlen',
			  c: '<span class="kz-chip g">(32, 32)</span><span class="kz-arrow">·</span><span class="kz-chip g">0 – 255</span>' },
			{ k: 'Schritt 5', t: 'Flatten rollt das Raster<br>zu einer <em>Schnur</em> aus.',
			  p: 'Zeile <b>0</b> von 32 · <b>0</b> Zahlen',
			  c: '<span class="kz-chip g">(32, 32)</span><span class="kz-arrow">→</span><span class="kz-chip r">(1024,)</span>' },
			{ k: 'Schritt 6', t: 'Der <em>Trick</em>: Flatten verliert<br>die Bildstruktur.',
			  p: 'Ab hier ist jede Zahl nur noch eine Zahl',
			  c: '<span class="kz-chip r">(1024,)</span>',
			  i: 'Der Trick: Flatten verliert die Bildstruktur — ab hier ist jede Zahl nur noch eine Zahl. Dafür kann ein <b>Dense-Layer</b> darauf arbeiten und globale Entscheidungen treffen („Auto? Katze?").' }
		],

		layoutFor(step, S) {
			const { W, H, inst } = S;
			if (step === 0) {
				const s = Math.min(H / 32 * .95, W / 32 * .95, 13);
				inst.forEach((o, i) => {
					o.ts = s; o.tx = (W - 32 * s) / 2; o.ty = (H - 32 * s) / 2;
					o.ta = i === 0 ? 1 : 0; o.tmix = 0;
				});
				tTagA = [0, 0, 0]; tRailA = 0; S.tGrayMix = 0;
			} else if (step <= 3) {
				const gap = Math.min(W * .035, 46);
				const s = Math.min((W - gap * 2) / (32 * 3) * .96, H / 32 * .82, 8);
				const bw = 32 * s, tot = bw * 3 + gap * 2, ox = (W - tot) / 2, oy = (H - 32 * s) / 2 + 8;
				inst.forEach((o, i) => {
					o.ts = s; o.tx = ox + i * (bw + gap); o.ty = oy; o.tmix = 1;
					o.ta = (step === 1) ? 1 : (i === KatzeKit.PICK ? 1 : 0);
					tTagA[i] = o.ta;
				});
				tRailA = 0;
				S.tGrayMix = step === 3 ? 1 : 0;
			} else {
				const gs = Math.min(H * .50 / 32, W * .30 / 32, 9.5);
				inst.forEach((o, i) => {
					o.ts = gs; o.tx = (W - 32 * gs) / 2; o.ty = 6;
					o.tmix = 1; o.ta = i === KatzeKit.PICK ? 1 : 0;
				});
				tTagA = [0, 0, 0]; tRailA = 1; S.tGrayMix = 1;
			}
		},

		onStep(step) {
			if (step === 4) { flatP = 0; flatMsg = 0; }
		},

		tick(dt, k, S, setFoot) {
			for (let i = 0; i < 3; i++) tagA[i] = KatzeKit.lerp(tagA[i], tTagA[i], k * 1.2);
			railA = KatzeKit.lerp(railA, tRailA, k);
			if (S.step !== 4) return;
			// ~10,5 s für 32 Zeilen
			flatP = Math.min(flatP + dt * (32 / (10.5 * 60)), 32);
			if (flatP >= 32) {
				if (!flatMsg) {
					flatMsg = 1;
					setFoot('Fertig — <b>1024</b> Zahlen in einer einzigen Reihe',
						'<span class="kz-chip g">(32, 32)</span><span class="kz-arrow">→</span><span class="kz-chip r">(1024,)</span>');
				}
			} else {
				const done = Math.floor(flatP);
				setFoot(`Zeile <b>${done}</b> von 32 · <b>${done * 32}</b> Zahlen`,
					'<span class="kz-chip g">(32, 32)</span><span class="kz-arrow">→</span><span class="kz-chip r">(1024,)</span>');
			}
		},

		draw(ctx, S) {
			ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, S.W, S.H);
			if (S.step >= 4) {
				drawFlat(ctx, S);
			} else {
				S.inst.forEach((o, i) => KatzeKit.drawGrid(ctx, o, i, S.grayMix));
				KatzeKit.drawTags(ctx, S, tagA);
			}
		}
	});
})();

if (typeof window !== 'undefined') {
	window.KatzeKit = KatzeKit;
	window.ConvDemo = ConvDemo;
	window.FlattenDemo = FlattenDemo;
}
