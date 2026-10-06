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
// ConvDemo — "Jeder Pixel ist nur eine Zahl" (Einstieg)
//
// 32×32-Katze, 6 Schritte:
// 0: Graustufen-Katze — ein Pixel vergrößert (Wert 0–255)
// 1: das Farbbild spaltet in drei Kanal-Stapel (ROT/GRÜN/BLAU)
// 2: die Stapel faden zusammen + der Filter erscheint — 6×5,
//    so groß und in der Form wie ein Katzenauge (schwarz = 0,
//    gelb = 255 — der Filter ist selbst nur Zahlen)
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
	let grayA = 0, tGrayA = 0, zoomA = 0, tZoomA = 0;
	const KC = 24; // Filter-Panel: Zellgröße in px

	// Schritt 1: Beispiel-Pixel — oberes linkes Auge (Zeile 10, Spalte 4).
	const ZR = 10, ZC = 4;
	const ZVAL = KatzeKit.GREEN[ZR * KatzeKit.N + ZC];

	// Graustufen-Katze (Grün-Kanal als Grauwert, wie im Flatten-Schritt)
	// mit Rahmen. Gezeichnet an der Geometrie von inst[0].
	function drawGrayCat(ctx, S) {
		const o = S.inst[0];
		if (grayA < 0.01 || o.a < 0.005) return;
		ctx.globalAlpha = grayA * o.a;
		const N = KatzeKit.N, s = o.s;
		for (let r = 0; r < N; r++) {
			const y = o.y + r * s, yh = Math.ceil(y + s) - Math.floor(y);
			for (let c = 0; c < N; c++) {
				const v = KatzeKit.GREEN[r * N + c];
				const x = o.x + c * s, xw = Math.ceil(x + s) - Math.floor(x);
				ctx.fillStyle = `rgb(${v},${v},${v})`;
				ctx.fillRect(Math.floor(x), Math.floor(y), xw, yh);
			}
		}
		ctx.strokeStyle = '#1b1f24'; ctx.lineWidth = 1.5;
		ctx.strokeRect(o.x + .5, o.y + .5, N * o.s - 1, N * o.s - 1);
		ctx.globalAlpha = 1;
	}

	// Zoom-Panel: das Beispiel-Pixel vergrößert + Wert + 0–255-Skala.
	function drawPixelZoom(ctx, S) {
		const o = S.inst[0];
		if (zoomA < 0.01 || S.zoomX == null) return;
		const N = KatzeKit.N, zw = 230, zh = 250;
		const zx = S.zoomX, zy = S.zoomY;

		if (o.a > 0.02) {
			const px = o.x + ZC * o.s, py = o.y + ZR * o.s;
			ctx.globalAlpha = zoomA;
			ctx.strokeStyle = '#2563eb'; ctx.lineWidth = 2.5;
			ctx.strokeRect(px - 2, py - 2, o.s + 4, o.s + 4);
			ctx.globalAlpha = 1;
		}

		ctx.globalAlpha = zoomA;
		ctx.fillStyle = '#fff';
		KatzeKit.roundRect(ctx, zx, zy, zw, zh, 14);
		ctx.fill();
		ctx.strokeStyle = '#e2e8f0'; ctx.lineWidth = 1.2; ctx.stroke();

		const sq = 110, sx = zx + (zw - sq) / 2, sy = zy + 24;
		ctx.fillStyle = `rgb(${ZVAL},${ZVAL},${ZVAL})`;
		ctx.fillRect(sx, sy, sq, sq);
		ctx.strokeStyle = '#94a3b8'; ctx.lineWidth = 1.5;
		ctx.strokeRect(sx + .5, sy + .5, sq - 1, sq - 1);

		ctx.fillStyle = '#0f172a';
		ctx.font = '800 34px Inter, system-ui, sans-serif';
		ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
		ctx.fillText(ZVAL + '', zx + zw / 2, sy + sq + 34);

		const bw = 170, bx = zx + (zw - bw) / 2, by = zy + zh - 36;
		const g = ctx.createLinearGradient(bx, 0, bx + bw, 0);
		g.addColorStop(0, '#000'); g.addColorStop(1, '#fff');
		ctx.fillStyle = g;
		ctx.fillRect(bx, by, bw, 10);
		ctx.strokeStyle = '#94a3b8'; ctx.lineWidth = 1;
		ctx.strokeRect(bx + .5, by + .5, bw - 1, 9);
		ctx.fillStyle = '#64748b';
		ctx.font = '600 11px Inter, system-ui, sans-serif';
		ctx.fillText('0', bx, by + 21);
		ctx.fillText('255', bx + bw, by + 21);

		// Verbindungslinie Pixel → Quadrat
		if (o.a > 0.3) {
			const px = o.x + (ZC + .5) * o.s, py = o.y + (ZR + .5) * o.s;
			ctx.strokeStyle = '#94a3b8'; ctx.lineWidth = 2;
			ctx.beginPath();
			ctx.moveTo(px + o.s / 2 + 4, py);
			ctx.lineTo(sx - 4, sy + sq / 2);
			ctx.stroke();
		}
		ctx.globalAlpha = 1;
	}

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
		if (S.step < 4) return;

		for (let i8 = 0; i8 < O8 * O8; i8++) {
			const R = (i8 / O8) | 0, C = i8 % O8;
			const x = Math.floor(ox + C * os), y = Math.floor(oy + R * os);
			const xw = Math.ceil(ox + (C + 1) * os) - x, yh = Math.ceil(oy + (R + 1) * os) - y;
			const lit = LIT8[i8];
			const isLit = lit >= 0 && (S.step >= 6 || (S.step === 5 && sweepP > lit));
			const isFull = !isLit && (S.step >= 6 || (S.step === 5 && sweepP >= END8[i8]));
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
		if (S.step >= 5) {
			for (let i8 = 0; i8 < O8 * O8; i8++) {
				const lit = LIT8[i8];
				if (lit < 0 || (S.step === 5 && sweepP <= lit)) continue;
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
		ctx.fillStyle = '#111';
		KatzeKit.roundRect(ctx, kx - 9, ky - 9, kw + 18, kh + 18, 10);
		ctx.fill();
		ctx.strokeStyle = '#333'; ctx.lineWidth = 1.2; ctx.stroke();
		for (let r = 0; r < KH; r++) for (let c = 0; c < KW; c++) {
			// 0‑Zellen (Pupille + Rand) bleiben schwarz.
			if (!TPL[r * KW + c]) continue;
			ctx.fillStyle = '#E2C72E';
			ctx.fillRect(kx + c * KC + 3, ky + r * KC + 3, KC - 6, KC - 6);
			// draw numeric value inside the cell
			ctx.fillStyle = '#000';
			ctx.font = '10px Inter, system-ui, sans-serif';
			ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
			ctx.fillText('255', kx + c * KC + KC/2, ky + r * KC + KC/2);
		}
		// draw 0‑Zellen numbers
		for (let r = 0; r < KH; r++) for (let c = 0; c < KW; c++) {
			if (TPL[r * KW + c]) continue;
			ctx.fillStyle = '#888';
			ctx.font = '10px Inter, system-ui, sans-serif';
			ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
			ctx.fillText('0', kx + c * KC + KC/2, ky + r * KC + KC/2);
		}
		ctx.globalAlpha = 1;
	}

	function drawWindow(ctx, S) {
		if (S.step < 4 || S.step > 5) return;
		const o = S.inst[0], s = o.s;
		const i = Math.min(Math.floor(S.step === 5 ? sweepP : 0), OCELLS - 1);
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
			{ k: 'Schritt 1', t: 'Jeder Pixel ist<br>nur eine <em>Zahl</em>.',
			  p: 'Graustufen · 0 = Schwarz, 255 = Weiß',
			  c: '<span class="kz-chip">(32, 32, 3)</span><span class="kz-arrow">→</span><span class="kz-chip g">0–255</span>' },
			{ k: 'Schritt 2', t: 'Farbbilder haben<br><em>drei</em> Stapel.',
			  p: 'Rot, Grün und Blau — drei eigene Zahlen-Raster',
			  c: '<span class="kz-chip">(32, 32, 3)</span><span class="kz-arrow">=</span><span class="kz-chip">3 × (32, 32)</span>' },
			{ k: 'Schritt 3', t: 'Ein Kanal ist nur<br><em class="gray">Grau</em>.',
			  p: 'Die grüne Farbe war nur Deko — es sind reine Zahlen',
			  c: '<span class="kz-chip g">(32, 32)</span><span class="kz-arrow">·</span><span class="kz-chip g">0 – 255</span>' },
			{ k: 'Schritt 4', t: 'Ein <em>Filter</em> ist ein Muster —<br>hier die Form des <em>Auges</em>.',
			  p: 'Schwarz = 0 · Gelb = 255 — auch der Filter ist nur Zahlen',
			  c: '<span class="kz-chip">(6, 5)</span>' },
			{ k: 'Schritt 5', t: 'Das Muster wird<br>auf das Bild <em>gelegt</em>.',
			  p: `Punkt <b>1</b> von ${OCELLS} · Treffer: <b>0</b> von ${TMAX}`,
			  c: '<span class="kz-chip">(32, 32)</span><span class="kz-arrow">×</span><span class="kz-chip">(6, 5)</span>' },
			{ k: 'Schritt 6', t: `… und über<br><em>alle ${OCELLS}</em> Positionen.`,
			  p: `Fenster <b>1</b> von ${OCELLS}`,
			  c: `<span class="kz-chip">(${OH}, ${OW})</span><span class="kz-arrow">→</span><span class="kz-chip g">(8, 8)</span>` },
			{ k: 'Schritt 7', t: 'Wo der Filter passt,<br>leuchten <em>die Augen</em>.',
			  p: `1024 Pixel → ${O8 * O8} Zahlen — und die Augen bleiben`,
			  c: `<span class="kz-chip g">(8, 8)</span>` }
		],

		layoutFor(step, S) {
			const { W, H, inst } = S;
			const s = Math.min(H / KatzeKit.N * .86, W / KatzeKit.N * .86, 13);
			const imgW = KatzeKit.N * s, gapOut = 60, outW = O8 * s * 4;
			if (step === 0) {
				// Graustufen-Katze links, Zoom-Pixel rechts.
				const cs = Math.min(H / KatzeKit.N * .8, W / KatzeKit.N * .5, 10);
				const zw = 230, zh = 250, gap = 90;
				const x0 = (W - (KatzeKit.N * cs + gap + zw)) / 2;
				inst.forEach((o, i) => {
					o.ts = cs; o.tx = x0; o.ty = (H - KatzeKit.N * cs) / 2 + 6;
					o.tmix = i === 0 ? 0 : 1; o.ta = i === 0 ? 1 : 0;
				});
				tTagA = [0, 0, 0];
				S.zoomX = x0 + KatzeKit.N * cs + gap;
				S.zoomY = (H - zh) / 2;
			} else if (step <= 2) {
				// Drei Kanal-Stapel; ab Schritt 3 nur der Grün-Kanal (graustufen).
				const g = Math.min(W * .035, 46);
				const ss = Math.min((W - g * 2) / (KatzeKit.N * 3) * .96, H / KatzeKit.N * .82, 8);
				const bw = KatzeKit.N * ss, tot = bw * 3 + g * 2, ox = (W - tot) / 2, oy = (H - bw) / 2 + 8;
				inst.forEach((o, i) => {
					o.ts = ss; o.tx = ox + i * (bw + g); o.ty = oy;
					o.tmix = 1; o.ta = step === 1 ? 1 : (i === KatzeKit.PICK ? 1 : 0);
				});
				tTagA = step === 1 ? [1, 1, 1] : [0, 1, 0];
				S.tGrayMix = step === 2 ? 1 : 0;
			} else {
				S.tGrayMix = 0;
				inst.forEach((o, i) => {
					o.ts = s;
					o.tx = (W - (imgW + gapOut + outW)) / 2;
					o.ty = (H - imgW) / 2 + 6;
					o.tmix = i === 0 ? 0 : 1;
					o.ta = i === 0 ? (step >= 6 ? .22 : 1) : 0;
				});
				tTagA = [0, 0, 0];
			}
			tKerA = step <= 2 ? 0 : (step >= 6 ? .45 : 1);
			tOutA = step >= 4 ? 1 : 0;
			tGrayA = step === 0 ? 1 : 0;
			tZoomA = step === 0 ? 1 : 0;
		},

		onStep(step) {
			if (step === 5) { sweepP = 0; sweepDone = 0; }
		},

		tick(dt, k, S, setFoot) {
			kerA = KatzeKit.lerp(kerA, tKerA, k * 1.2);
			outA = KatzeKit.lerp(outA, tOutA, k * 1.2);
			grayA = KatzeKit.lerp(grayA, tGrayA, k * 1.2);
			zoomA = KatzeKit.lerp(zoomA, tZoomA, k * 1.2);
			for (let i = 0; i < 3; i++) tagA[i] = KatzeKit.lerp(tagA[i], tTagA[i], k * 1.2);
			if (S.step !== 5) return;
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
			if (S.step === 0) {
				drawGrayCat(ctx, S);
				drawPixelZoom(ctx, S);
			} else if (S.step <= 2) {
				// Kanal-Stapel; Schritt 3: nur der Grün-Kanal, fadet in Grau.
				S.inst.forEach((gi, i) => KatzeKit.drawGrid(ctx, gi, i, S.grayMix));
				KatzeKit.drawTags(ctx, S, tagA);
				if (S.step === 1) drawGrayCat(ctx, S); // Crossfade von den Graustufen
			} else {
				KatzeKit.drawGrid(ctx, o, 0, 0);
				// Beim Zusammenfaden flackern die Kanäle kurz drüber.
				KatzeKit.drawGrid(ctx, S.inst[1], 1, 0);
				KatzeKit.drawGrid(ctx, S.inst[2], 2, 0);
			}
			if (S.step >= 3 && o.a > 0.02) {
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
// (Pixel/Kanäle/Grau hat die Katze-Folie — hier nur der Flatten-
// Teil.) Graues Raster → Schnur (1024 Zahlen) → Fazit.
// 2 Schritte: 0: Raster wird zur Schnur · 1: Fazit (Dense-Layer).
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
			{ k: 'Schritt 1', t: 'Flatten rollt das Raster<br>zu einer <em>Schnur</em> aus.',
			  p: 'Zeile <b>0</b> von 32 · <b>0</b> Zahlen',
			  c: '<span class="kz-chip g">(32, 32)</span><span class="kz-arrow">→</span><span class="kz-chip r">(1024,)</span>' },
			{ k: 'Schritt 2', t: 'Der <em>Trick</em>: Flatten verliert<br>die Bildstruktur.',
			  p: 'Ab hier ist jede Zahl nur noch eine Zahl',
			  c: '<span class="kz-chip r">(1024,)</span>',
			  i: 'Der Trick: Flatten verliert die Bildstruktur — ab hier ist jede Zahl nur noch eine Zahl. Dafür kann ein <b>Dense-Layer</b> darauf arbeiten und globale Entscheidungen treffen („Auto? Katze?").' }
		],

		layoutFor(step, S) {
			const { W, H, inst } = S;
			const gs = Math.min(H * .50 / 32, W * .30 / 32, 9.5);
			inst.forEach((o, i) => {
				o.ts = gs; o.tx = (W - 32 * gs) / 2; o.ty = 6;
				o.tmix = 1; o.ta = i === KatzeKit.PICK ? 1 : 0;
			});
			tTagA = [0, 0, 0]; tRailA = 1; S.tGrayMix = 1;
		},

		onStep(step) {
			if (step === 0) { flatP = 0; flatMsg = 0; }
		},

		tick(dt, k, S, setFoot) {
			for (let i = 0; i < 3; i++) tagA[i] = KatzeKit.lerp(tagA[i], tTagA[i], k * 1.2);
			railA = KatzeKit.lerp(railA, tRailA, k);
			if (S.step !== 0) return;
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
			drawFlat(ctx, S);
		}
	});
})();

// ============================================================
// PipelineDemo — "Der gesamte Prozess" (am Ende der Deck)
//
// Bild → Convolutions (Augen/Nase/Mund-Maps) → Dense-Layer →
// zwei Ausgabe-Neuronen (Katze 95 % / Hund 5 %).
// 4 Schritte: Bild · Convolutions · Dense · Antwort.
// ============================================================
const PipelineDemo = (() => {
	'use strict';

	// Augen-Filter (wie bei der Conv-Folie: Zeilen 10–15, Spalten 4–8).
	const KH = 6, KW = 5, ER = 10, EC = 4;
	const TPL = [];
	for (let dr = 0; dr < KH; dr++)
		for (let dc = 0; dc < KW; dc++)
			TPL.push(KatzeKit.YELLOW[(ER + dr) * KatzeKit.N + (EC + dc)]);

	// Leuchtende Zellen der drei 8×8-Karten (Augen/Nase/Mund).
	const MAPS = [
		{ label: 'Augen', lit: [3 * 8 + 1, 3 * 8 + 5] },
		{ label: 'Nase', lit: [4 * 8 + 3] },
		{ label: 'Mund', lit: [5 * 8 + 3] }
	];

	let aCat = 0, tCatA = 0;
	let aConv = 0, tConvA = 0;
	let aDense = 0, tDenseA = 0;
	let aOut = 0, tOutA = 0;

	function arrow(ctx, x1, y1, x2, y2, a) {
		if (a < 0.02) return;
		ctx.globalAlpha = a;
		ctx.strokeStyle = '#94a3b8'; ctx.lineWidth = 2.5;
		ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
		const ang = Math.atan2(y2 - y1, x2 - x1);
		ctx.fillStyle = '#94a3b8';
		ctx.beginPath();
		ctx.moveTo(x2, y2);
		ctx.lineTo(x2 - 11 * Math.cos(ang - .42), y2 - 11 * Math.sin(ang - .42));
		ctx.lineTo(x2 - 11 * Math.cos(ang + .42), y2 - 11 * Math.sin(ang + .42));
		ctx.closePath(); ctx.fill();
		ctx.globalAlpha = 1;
	}

	function drawMap(ctx, x, y, ms, label, lit, a) {
		if (a < 0.01) return;
		ctx.globalAlpha = a;
		ctx.fillStyle = '#475569';
		ctx.font = '700 13px Inter, system-ui, sans-serif';
		ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
		ctx.fillText(label, x + 4 * ms, y - 8);
		ctx.fillStyle = '#fff';
		KatzeKit.roundRect(ctx, x - 5, y - 5, 8 * ms + 10, 8 * ms + 10, 8);
		ctx.fill();
		ctx.strokeStyle = '#e2e8f0'; ctx.lineWidth = 1; ctx.stroke();
		for (let R = 0; R < 8; R++) for (let C = 0; C < 8; C++) {
			const cx = x + C * ms, cy = y + R * ms;
			if (lit.indexOf(R * 8 + C) >= 0) {
				ctx.fillStyle = 'rgba(76,175,80,.55)';
				ctx.fillRect(cx + 1, cy + 1, ms - 2, ms - 2);
				ctx.strokeStyle = '#4caf50'; ctx.lineWidth = 1.5;
				ctx.strokeRect(cx + 1.5, cy + 1.5, ms - 3, ms - 3);
			} else {
				ctx.fillStyle = '#f6f7f9';
				ctx.fillRect(cx + 1, cy + 1, ms - 2, ms - 2);
			}
		}
		ctx.globalAlpha = 1;
	}

	function drawMiniKernel(ctx, cat, a) {
		if (a < 0.01) return;
		const s = cat.s;
		const x = cat.x + EC * s, y = cat.y + ER * s, kw = KW * s, kh = KH * s;
		ctx.globalAlpha = a;
		ctx.fillStyle = '#111';
		ctx.fillRect(x, y, kw, kh);
		for (let r = 0; r < KH; r++) for (let c = 0; c < KW; c++) {
			if (!TPL[r * KW + c]) continue;
			ctx.fillStyle = '#E2C72E';
			ctx.fillRect(x + c * s + 1, y + r * s + 1, s - 2, s - 2);
		}
		ctx.strokeStyle = '#111'; ctx.lineWidth = 2;
		ctx.strokeRect(x + 1, y + 1, kw - 2, kh - 2);
		ctx.globalAlpha = 1;
	}

	function drawDense(ctx, x, y, w, h, a) {
		if (a < 0.01) return;
		ctx.globalAlpha = a;
		ctx.fillStyle = '#f8fafc';
		KatzeKit.roundRect(ctx, x, y, w, h, 12);
		ctx.fill();
		ctx.strokeStyle = '#cbd5e1'; ctx.lineWidth = 1.2; ctx.stroke();
		const cols = 5, rows = 9;
		const dx0 = x + 20, dy0 = y + 22;
		const ddx = (w - 40) / (cols - 1), ddy = (h - 62) / (rows - 1);
		ctx.fillStyle = '#94a3b8';
		for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
			ctx.beginPath();
			ctx.arc(dx0 + c * ddx, dy0 + r * ddy, 3.5, 0, Math.PI * 2);
			ctx.fill();
		}
		ctx.fillStyle = '#475569';
		ctx.font = '700 15px Inter, system-ui, sans-serif';
		ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
		ctx.fillText('Dense', x + w / 2, y + h - 16);
		ctx.globalAlpha = 1;
	}

	function drawNeuron(ctx, cx, cy, r, label, pct, hot, a) {
		if (a < 0.01) return;
		ctx.globalAlpha = a;
		if (hot) {
			const g = ctx.createRadialGradient(cx, cy, r * .2, cx, cy, r);
			g.addColorStop(0, 'rgba(76,175,80,.55)');
			g.addColorStop(1, 'rgba(76,175,80,.16)');
			ctx.fillStyle = g;
		} else {
			ctx.fillStyle = '#f1f5f9';
		}
		ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fill();
		ctx.strokeStyle = hot ? '#4caf50' : '#cbd5e1';
		ctx.lineWidth = hot ? 3.5 : 2;
		ctx.stroke();
		ctx.fillStyle = hot ? '#14532d' : '#94a3b8';
		ctx.font = '800 24px Inter, system-ui, sans-serif';
		ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
		ctx.fillText(pct, cx, cy);
		ctx.font = '700 16px Inter, system-ui, sans-serif';
		ctx.fillStyle = hot ? '#166534' : '#94a3b8';
		ctx.fillText(label, cx, cy + r + 22);
		ctx.globalAlpha = 1;
	}

	return KatzeKit.create({
		slideId: 'slide-pipeline',
		prefix: 'pipe',
		steps: [
			{ k: 'Schritt 1', t: 'Wir starten mit<br><em>einem Bild</em>.',
			  p: '32 × 32 Pixel — die Katze',
			  c: '<span class="kz-chip">(32, 32, 3)</span>' },
			{ k: 'Schritt 2', t: 'Convolutions finden<br><em>Augen, Nase, Mund</em>.',
			  p: '3 Filter → 3 Karten mit je 64 Zahlen',
			  c: '<span class="kz-chip">(6, 5)</span><span class="kz-arrow">→</span><span class="kz-chip g">3 × (8, 8)</span>' },
			{ k: 'Schritt 3', t: 'Die Karten gehen<br>in <em>Dense-Layer</em>.',
			  p: '64 Zahlen pro Karte — dicht verdrahtet',
			  c: '<span class="kz-chip g">3 × (8, 8)</span><span class="kz-arrow">→</span><span class="kz-chip r">Dense</span>' },
			{ k: 'Schritt 4', t: 'Zwei Neuronen —<br>die <em>Antwort</em>.',
			  p: 'Katze: 95 % · Hund: 5 %',
			  c: '<span class="kz-chip g">Katze 95 %</span>',
			  i: 'Vom Bild zur Antwort: <b>Convolutions</b> finden lokale Strukturen (Augen, Nase, Mund), die <b>Dense-Layer</b> kombinieren — am Ende steht eine Zahl pro Antwort. 95 % = „fast sicher Katze".' }
		],

		layoutFor(step, S) {
			const { W, H, inst } = S;
			const cs = Math.min(H / 32 * .75, W / 32 * .25, 8.5);
			inst.forEach((o, i) => {
				o.ts = cs; o.tx = 30; o.ty = (H - 32 * cs) / 2;
				o.tmix = 0; o.ta = i === 0 ? 1 : 0;
			});
			tCatA = 1;
			tConvA = step >= 1 ? 1 : 0;
			tDenseA = step >= 2 ? 1 : 0;
			tOutA = step >= 3 ? 1 : 0;
		},

		tick(dt, k, S, setFoot) {
			aCat = KatzeKit.lerp(aCat, tCatA, k * 1.5);
			aConv = KatzeKit.lerp(aConv, tConvA, k * 1.5);
			aDense = KatzeKit.lerp(aDense, tDenseA, k * 1.5);
			aOut = KatzeKit.lerp(aOut, tOutA, k * 1.5);
		},

		draw(ctx, S) {
			ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, S.W, S.H);
			const { W, H } = S;
			const cat = S.inst[0];
			const ch = 32 * cat.s;

			const ms = 12;
			const mapX = 30 + ch + 70;
			const mapY0 = (H - (3 * 8 * ms + 2 * 22)) / 2;
			const mapYs = [mapY0, mapY0 + 8 * ms + 22, mapY0 + 2 * (8 * ms + 22)];
			const denseX = mapX + 8 * ms + 70;
			const denseW = 120, denseH = H * .62, denseY = (H - denseH) / 2;
			const nCx = denseX + denseW + 130;
			const rN = Math.min(H * .16, 56);

			const cyMid = H / 2;

			// Pfeile (mit dem Stage, das sie „anschalten")
			MAPS.forEach((m, i) => {
				arrow(ctx, 30 + ch + 6, cyMid, mapX - 10, mapYs[i] + 4 * ms, aConv);
			});
			arrow(ctx, mapX + 8 * ms + 10, cyMid, denseX - 10, cyMid, aDense);
			arrow(ctx, denseX + denseW + 10, cyMid, nCx - rN - 10, H * .32, aOut);
			arrow(ctx, denseX + denseW + 10, cyMid, nCx - rN - 10, H * .74, aOut);

			// Eingang: Farb-Katze
			if (aCat > 0.01) {
				ctx.globalAlpha = aCat;
				KatzeKit.drawGrid(ctx, cat, 0, 0);
				ctx.strokeStyle = '#1b1f24'; ctx.lineWidth = 1.5;
				ctx.strokeRect(cat.x + .5, cat.y + .5, ch - 1, ch - 1);
				ctx.globalAlpha = 1;
				drawMiniKernel(ctx, cat, aConv);
			}

			// Feature-Maps
			MAPS.forEach((m, i) => drawMap(ctx, mapX, mapYs[i], ms, m.label, m.lit, aConv));

			// Dense
			drawDense(ctx, denseX, denseY, denseW, denseH, aDense);

			// Ausgabe
			drawNeuron(ctx, nCx, H * .32, rN, 'Katze', '95 %', true, aOut);
			drawNeuron(ctx, nCx, H * .74, rN, 'Hund', '5 %', false, aOut);
		}
	});
})();

if (typeof window !== 'undefined') {
	window.KatzeKit = KatzeKit;
	window.ConvDemo = ConvDemo;
	window.FlattenDemo = FlattenDemo;
	window.PipelineDemo = PipelineDemo;
}
