// ============================================================
// katze.js, Framework "ASCII-Katze" (aus katze.html)
//
// Drei Folien teilen sich dasselbe Gerüst: die 32×32-ASCII-Katze
// als Canvas-Raster + gestufter Ablauf (Kicker, Titel, Pill, Chips,
// Dots). Die Schritte laufen über die Pfeiltasten (DemoRegistry):
//   - ConvDemo     "Jeder Pixel ist nur eine Zahl", Farbbild →
//                  3 Kanäle → ein Kanal (Grau) → Pixel = Zahl
//                  (Zoom) → 6×5-Filter in Augen-Form → blockweiser
//                  Sweep (hält auf jedem Pixel-Block) → 8×8-Map,
//                  Augen leuchten
//   - FlattenDemo  "Was macht Flatten?", Raster → Schnur
//                  (1024 Zahlen) → Fazit
//   - PipelineDemo "Der gesamte Prozess", Bild → Convolutions →
//                  Dense → 2 Neuronen (Start 50:50, Loss 0,693)
//                  → Training (Loss sinkt) → Katze 95 %
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
		"....kkkkkkwwwmnmwwwkkkkkkkk.....","...W.kkkkkwwkwmwkwwwkkkkkkkkW...",
		"......kkkkwwwkkkwwwwkkkkkkkkk...",".......kkkbwwwwwwwwkkkkkkkkkkk..",
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
	// Kanal-Tönung mit Kontrastkurve: Mitteltöne (der olivfarbene
	// Hintergrund, ~181/176/43) verblassen Richtung Weiß, helle
	// Pixel (weiße Schnurrhaare, cremefarbenes Fell) leuchten im
	// Kanal → in allen drei Stapeln deutlich sichtbar.
	const tint = (v, i) => {
		const u = Math.pow(Math.min(Math.max((v - 90) / 165, 0), 1), 1.35) * 255;
		const ink = 255 - u;
		return i === 0 ? [255, ink, ink] : i === 1 ? [ink, 255, ink] : [ink, ink, 255];
	};

	function colorOf(i, ch, mix, gmix) {
		const [R, G, B] = RGB[i];
		const v = RGB[i][ch];
		const [tr, tg, tb] = tint(v, ch);
		let r = lerp(R, tr, mix), g = lerp(G, tg, mix), b = lerp(B, tb, mix);
		r = lerp(r, v, gmix); g = lerp(g, v, gmix); b = lerp(b, v, gmix);
		return `rgb(${r|0},${g|0},${b|0})`;
	}

	// Ein Raster (32×32) als gefüllte Blöcke, ceil auf ganze
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
		ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + r, y, r);
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
	//   steps:     [{k, t, p, c, i?}], Kicker, Titel(HTML), Pill(HTML),
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
			if (els.kicker) els.kicker.textContent = s.k;
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

		// Fazit-Box: Slot einmalig auf den längsten Fazittext reservieren.
		// .kz-insight-slot ist das einzige Element im Layout-Fluss, dessen
		// Höhe vom Text abhängt, und fitSlides skaliert die ganze Folie
		// anhand ihrer Höhe → sonst springt die Folie beim Wechsel zwischen
		// kurzem und langem Fazit (siehe _reserveCaptionHeight in hierarchy.js).
		function reserveInsight() {
			if (!els.insight) return;
			const slot = els.insight.closest('.kz-insight-slot');
			if (!slot) return;
			const prev = els.insight.innerHTML;
			let max = 0;
			cfg.steps.forEach(s => {
				els.insight.innerHTML = (s && s.i) || '';
				const h = els.insight.offsetHeight;
				if (h > max) max = h;
			});
			els.insight.innerHTML = prev;
			if (max > 0) slot.style.minHeight = Math.max(96, Math.ceil(max)) + 'px';
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

			reserveInsight();
			if (typeof window.fitSlides === 'function') window.fitSlides();
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
			rsz = setTimeout(() => {
				reserveInsight();
				if (typeof window.fitSlides === 'function') window.fitSlides();
				if (isOnSlide()) resize();
			}, 110);
		});

		return { init, reset, next, prev, canGoNext, canGoPrev, getState, setState };
	}

	return { create, lerp, eInOut, roundRect, drawGrid, drawTags, N, PICK, GREEN, YELLOW };
})();

// ============================================================
// ConvDemo, "Jeder Pixel ist nur eine Zahl" (Einstieg)
//
// 32×32-Katze, 8 Schritte:
// 0: Farbbild, die farbige Katze (Rot/Grün/Blau kombiniert)
// 1: das Farbbild spaltet in drei Kanal-Stapel (ROT/GRÜN/BLAU)
// 2: die Stapel faden zusammen, bleibt nur der Grün-Kanal (Grau)
// 3: Graustufen-Katze, ein Pixel vergrößert (Wert 0–255)
// 4: der Filter erscheint, 6×5, so groß und in der Form wie
//    ein Katzenauge (schwarz = 0, gelb = 255, nur die Form,
//    keine Zahlen)
// 5: das Fenster wird auf das Bild gelegt
// 6: das Fenster geht blockweise über das Bild: hält an jeder
//    Anker-Position (ganzzahlig → sitzt exakt auf dem Pixel-
//    Raster), gleitet dann weich zur nächsten (Serpentine)
// 7: die 8×8-Map, jedes Auge leuchtet als ein großer Pixel
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
	// (R,C) deckt einen Block feiner Fenster ab; sie leuchtet,
	// wenn dort ein Fenster voll aufs Auge passt.
	const O8 = 8;
	const LIT8 = new Array(O8 * O8).fill(-1);
	for (let R = 0; R < O8; R++) for (let C = 0; C < O8; C++) {
		const fr0 = Math.floor(R * OH / O8), fr1 = Math.floor((R + 1) * OH / O8) - 1;
		const fc0 = Math.floor(C * OW / O8), fc1 = Math.floor((C + 1) * OW / O8) - 1;
		for (let fr = fr0; fr <= fr1; fr++)
			for (let fc = fc0; fc <= fc1; fc++) {
				const i = fr * OW + fc;
				if (SCORES[i] >= TH && (LIT8[R * O8 + C] < 0 || i < LIT8[R * O8 + C]))
					LIT8[R * O8 + C] = i;
			}
	}

	// Blockweiser Sweep: das Fenster hält an jeder Anker-Position
	// (DWELL), dann gleitet es weich zur nächsten (MOVE, Serpentine).
	// Alle Anker sind GANZZAHLIG, in der Haltephase sitzt das
	// Fenster exakt auf dem Pixel-Raster ("wirklich passen").
	// Die Abstände sind so gewählt, dass JEDES feine Fenster und
	// JEDE 8×8-Zelle von mindestens einem Anker überdeckt wird:
	//   Abdeckung von (lfr, lfc) gilt für Anker (afr, afc) mit
	//   afr ≤ lfr ≤ afr+KH-1 und afc ≤ lfc ≤ afc+KW-1.
	// Die Anker umfassen exakt (fr=10, fc=4) und (fr=10, fc=19):
	// dort deckt das 6×5-Fenster die Augen (Zeilen 10–15) pixelgenau ab.
	const ANCH_ROW = [0, 5, 10, 16, 21, 26];
	const ANCH_COL = [0, 4, 9, 14, 18, 19, 23, 27];
	const ANCHORS = [];
	for (let ar = 0; ar < ANCH_ROW.length; ar++)
		for (let ac = 0; ac < ANCH_COL.length; ac++) {
			const col = ar % 2 === 0 ? ac : ANCH_COL.length - 1 - ac;
			ANCHORS.push({ fr: ANCH_ROW[ar], fc: ANCH_COL[col] });
		}
	const ANCH = ANCHORS.length; // 48
	const SW_DWELL = 5, SW_MOVE = 6; // 60-FPS-Einheiten (~0.08 s / ~0.10 s)

	// Segment-Zeitleiste: Segment 2i = Halten an Anker i,
	// Segment 2i+1 = Fahrt Anker i → i+1.
	const SEG_T = [];
	let SW_TOTAL = 0;
	{
		for (let i = 0; i < ANCH; i++) {
			SEG_T.push(SW_TOTAL); SW_TOTAL += SW_DWELL;
			if (i < ANCH - 1) { SEG_T.push(SW_TOTAL); SW_TOTAL += SW_MOVE; }
		}
	}

	function sweepPos(t) {
		t = Math.max(0, Math.min(t, SW_TOTAL));
		for (let i = SEG_T.length - 1; i >= 0; i--) {
			if (t < SEG_T[i]) continue;
			const a0 = (i / 2) | 0;
			if (i % 2 === 0)
				return { fr: ANCHORS[a0].fr, fc: ANCHORS[a0].fc, anchor: a0, moving: false };
			const e = KatzeKit.eInOut((t - SEG_T[i]) / SW_MOVE);
			return {
				fr: KatzeKit.lerp(ANCHORS[a0].fr, ANCHORS[a0 + 1].fr, e),
				fc: KatzeKit.lerp(ANCHORS[a0].fc, ANCHORS[a0 + 1].fc, e),
				anchor: a0 + 1, moving: true
			};
		}
		return { fr: ANCHORS[ANCH - 1].fr, fc: ANCHORS[ANCH - 1].fc, anchor: ANCH - 1, moving: false };
	}

	// Wann leuchtet/füllt sich jede 8×8-Zelle? Vorberechnet auf der
	// Zeitleiste: die Zeit der ersten Anker-Halte, in der das Fenster
	// den Zellen-Leuchtpunkt (lit) bzw. Zellen-Mittelpunkt (full)
	// überdeckt. -1 = nie überdeckt (darf nicht passieren, die
	// Guardrails prüfen es).
	const tLit8 = new Array(O8 * O8).fill(-1);
	const tFull8 = new Array(O8 * O8).fill(-1);
	{
		const covers = (pfr, pfc, tfr, tfc, kh, kw) =>
			pfr <= tfr && pfr + kh - 1 >= tfr && pfc <= tfc && pfc + kw - 1 >= tfc;
		for (let R = 0; R < O8; R++) for (let C = 0; C < O8; C++) {
			const i8 = R * O8 + C;
			const fr0 = Math.floor(R * OH / O8), fr1 = Math.floor((R + 1) * OH / O8) - 1;
			const fc0 = Math.floor(C * OW / O8), fc1 = Math.floor((C + 1) * OW / O8) - 1;
			let cfr = 0, cfc = 0, n = 0;
			for (let fr = fr0; fr <= fr1; fr++)
				for (let fc = fc0; fc <= fc1; fc++) { cfr += fr; cfc += fc; n++; }
			cfr /= n; cfc /= n;
			const lit = LIT8[i8];
			const lfr = lit >= 0 ? (lit / OW) | 0 : null;
			const lfc = lit >= 0 ? lit % OW : null;
			for (let ai = 0; ai < ANCH; ai++) {
				const a = ANCHORS[ai];
				const t = SEG_T[2 * ai] + SW_DWELL * 0.5;
				// Leuchten erst, wenn das Fenster selbst voll auf der Form
				// passt (Score ≥ TH) UND den Leuchtpunkt überdeckt, nicht
				// schon beim bloßen Berühren.
				const strong = SCORES[a.fr * OW + a.fc] >= TH;
				if (tLit8[i8] < 0 && lfr !== null && strong && covers(a.fr, a.fc, lfr, lfc, KH, KW))
					tLit8[i8] = t;
				if (tFull8[i8] < 0 && covers(a.fr, a.fc, cfr, cfc, KH, KW))
					tFull8[i8] = t;
			}
		}
	}

	// ────────────────────────────────────────────────────────────
	// 5 SWEEP-GUARDRAILS, prüfen ohne DOM, rein rechnerisch, dass
	// der Sweep perfekt passt und flüssig läuft:
	//   G1 Gitter     : an jedem Anker überdeckt das Fenster exakt
	//                  ein KW×KH-Block Pixel (Rand == Zellrand)
	//   G2 Grenzen    : über die gesamte Zeit bleibt das Fenster im
	//                  Bild (0 ≤ fr ≤ OH-1, 0 ≤ fc ≤ OW-1)
	//   G3 Flüssig    : keine Sprünge (Lipschitz-Begrenzung),
	//                  exakter Halt an jedem Anker, Geschwindigkeit
	//                  0 an den Segmentenden
	//   G4 Map         : jede Zelle leuchtet genau, wenn das Fenster
	//                  über ihrem Leuchtpunkt hält; jede Zelle wird
	//                  irgendwann gefüllt (Abdeckung vollständig)
	//   G5 Abschluss  : der Sweep endet exakt am letzten Anker, die
	//                  Gesamtdauer ist plausibel, "Fertig" wird
	//                  genau einmal am Ende gemeldet
	// Aufruf im Browser: window.ConvSweepGuardrails()
	// ────────────────────────────────────────────────────────────
	function sweepGuardrails() {
		const res = [];
		const N = KatzeKit.N;
		// Standard-Stage-Geometrie (1180×430, wie bei 1080p):
		// die Checks sind für jede Stage-Größe identisch, hier wird
		// mit der Referenzgröße gerechnet.
		const W = 1180, H = 430;
		const s = Math.min(H / N * .86, W / N * .86, 13);
		const ox = (W - (N * s + 60 + N * s)) / 2, oy = (H - N * s) / 2 + 6;
		// Pixelränder, exakt wie drawGrid()/drawWindow() gezeichnet.
		const edge = (i) => ox + i * s;
		const rectOf = (fr, fc) => ({
			x0: Math.floor(edge(fc)), x1: Math.ceil(edge(fc + KW)),
			y0: Math.floor(edge(fr)), y1: Math.ceil(edge(fr + KH))
		});
		const blockOf = (fr, fc) => {
			const cells = [];
			for (let r = fr; r < fr + KH; r++)
				for (let c = fc; c < fc + KW; c++)
					cells.push({ x0: Math.floor(edge(c)), x1: Math.ceil(edge(c + 1)),
					             y0: Math.floor(edge(r)), y1: Math.ceil(edge(r + 1)) });
			return {
				x0: Math.min(...cells.map(q => q.x0)), x1: Math.max(...cells.map(q => q.x1)),
				y0: Math.min(...cells.map(q => q.y0)), y1: Math.max(...cells.map(q => q.y1))
			};
		};

		// G1: Gitter
		{
			let ok = true, why = '';
			for (const a of ANCHORS) {
				if (!Number.isInteger(a.fr) || !Number.isInteger(a.fc)) { ok = false; why = 'Anker nicht ganzzahlig'; break; }
				const w = rectOf(a.fr, a.fc), b = blockOf(a.fr, a.fc);
				if (w.x0 !== b.x0 || w.x1 !== b.x1 || w.y0 !== b.y0 || w.y1 !== b.y1) {
					ok = false; why = `Fenster ≠ Pixelblock an (${a.fr}, ${a.fc})`; break;
				}
			}
			res.push({ name: 'G1 Gitter: Fenster sitzt exakt auf KW×KH Pixeln an allen Ankern', pass: ok, detail: why || ANCH + '/' + ANCH + ' Anker pixelgenau' });
		}

		// G2: Grenzen
		{
			let ok = true, why = '';
			const NS = 4000;
			// Das komplette Bild (32×32), nicht das Fenster selbst.
			const imgRect = {
				x0: Math.floor(edge(0)), x1: Math.ceil(edge(N)),
				y0: Math.floor(edge(0)), y1: Math.ceil(edge(N))
			};
			for (let i = 0; i <= NS; i++) {
				const t = i / NS * SW_TOTAL;
				const p = sweepPos(t);
				if (p.fr < 0 || p.fr > OH - 1 || p.fc < 0 || p.fc > OW - 1) {
					ok = false; why = `Position (${p.fr.toFixed(3)}, ${p.fc.toFixed(3)}) außerhalb`; break;
				}
				// Exakt das Fenster-Rechteck, wie drawWindow() es zeichnet.
				const w = {
					x0: Math.floor(edge(p.fc)), x1: Math.ceil(edge(p.fc + KW)),
					y0: Math.floor(edge(p.fr)), y1: Math.ceil(edge(p.fr + KH))
				};
				if (w.x0 < imgRect.x0 || w.x1 > imgRect.x1 || w.y0 < imgRect.y0 || w.y1 > imgRect.y1) {
					ok = false; why = `Fenster ragt bei t=${t.toFixed(2)} über den Bildrand`; break;
				}
			}
			res.push({ name: 'G2 Grenzen: Fenster bleibt zu jeder Zeit im Bild', pass: ok, detail: why || '4001 Abtastungen, keine Randverletzung' });
		}

		// G3: Flüssig
		{
			let ok = true, why = '';
			// Lipschitz: eInOut hat die 3-fache Durchschnittsgeschw.
			// im Mittel → max. = 3 · längste Strecke / MOVE.
			let maxSpeed = 0;
			for (let i = 0; i < ANCH - 1; i++)
				maxSpeed = Math.max(maxSpeed,
					Math.hypot(ANCHORS[i + 1].fr - ANCHORS[i].fr, ANCHORS[i + 1].fc - ANCHORS[i].fc) / SW_MOVE);
			maxSpeed *= 3;
			const NS = 8000, dt = SW_TOTAL / NS;
			for (let i = 0; i < NS; i++) {
				const a = sweepPos(i * dt), b = sweepPos((i + 1) * dt);
				if (Math.hypot(b.fr - a.fr, b.fc - a.fc) > maxSpeed * dt + 1e-9) {
					ok = false; why = `Sprung bei t≈${(i * dt).toFixed(1)}`; break;
				}
			}
			// Geschwindigkeit 0 an allen Segmentenden (weich starten,
			// weich stoppen) + Halte-Segmente bleiben exakt still.
			const d = 0.05;
			for (let i = 0; i < SEG_T.length; i++) {
				const t0 = SEG_T[i], t1 = (i === SEG_T.length - 1 ? SW_TOTAL : SEG_T[i + 1]);
				const d0 = Math.hypot(sweepPos(t0 + d).fr - sweepPos(t0).fr, sweepPos(t0 + d).fc - sweepPos(t0).fc);
				const d1 = Math.hypot(sweepPos(t1).fr - sweepPos(t1 - d).fr, sweepPos(t1).fc - sweepPos(t1 - d).fc);
				if (d0 > maxSpeed * d + 1e-6 || d1 > maxSpeed * d + 1e-6) {
					ok = false; why = `Segment ${i} startet/stopp nicht weich`; break;
				}
				if (i % 2 === 0) {
					const a = sweepPos(t0), b = sweepPos(t1);
					if (a.fr !== b.fr || a.fc !== b.fc) { ok = false; why = `Halte-Segment ${i} bewegt sich`; break; }
				}
			}
			res.push({ name: 'G3 Flüssig: keine Sprünge, weiche Fahrt, exakter Halt an jedem Block', pass: ok, detail: why || `Lipschitz ≤ ${maxSpeed.toFixed(3)} Zellen/Einheit, 8000 Abtastungen` });
		}

		// G4: Map-Konsistenz
		{
			let ok = true, why = '';
			const covers = (pfr, pfc, tfr, tfc) =>
				pfr <= tfr && pfr + KH - 1 >= tfr && pfc <= tfc && pfc + KW - 1 >= tfc;
			for (let R = 0; R < O8; R++) for (let C = 0; C < O8; C++) {
				const i8 = R * O8 + C;
				const fr0 = Math.floor(R * OH / O8), fr1 = Math.floor((R + 1) * OH / O8) - 1;
				const fc0 = Math.floor(C * OW / O8), fc1 = Math.floor((C + 1) * OW / O8) - 1;
				let maxScore = -1;
				for (let fr = fr0; fr <= fr1; fr++)
					for (let fc = fc0; fc <= fc1; fc++)
						maxScore = Math.max(maxScore, SCORES[fr * OW + fc]);
				const shouldLit = maxScore >= TH;
				if (shouldLit !== (LIT8[i8] >= 0)) { ok = false; why = `Zelle (${R},${C}): Leuchtpunkt ≠ Max-Score`; break; }
				if (shouldLit && tLit8[i8] < 0) { ok = false; why = `Zelle (${R},${C}) wird nie überdeckt`; break; }
				if (tFull8[i8] < 0) { ok = false; why = `Zelle (${R},${C}) wird nie gefüllt`; break; }
				// Zeit = erste Anker-Halte mit vollem Treffer und Abdeckung
				// (unabhängig nachrechnen)
				if (shouldLit) {
					const lit = LIT8[i8], lfr = (lit / OW) | 0, lfc = lit % OW;
					let first = -1;
					for (let ai = 0; ai < ANCH; ai++) {
						const a = ANCHORS[ai];
						if (SCORES[a.fr * OW + a.fc] >= TH && covers(a.fr, a.fc, lfr, lfc)) {
							first = SEG_T[2 * ai] + SW_DWELL * 0.5;
							break;
						}
					}
					if (Math.abs(tLit8[i8] - first) > 1e-9) { ok = false; why = `Zelle (${R},${C}): Leuchtzeit weicht ab`; break; }
				}
			}
			if (ok) res.push({ name: 'G4 Map: Leuchten/Füllen stimmt exakt mit Fenster-Abdeckung überein', pass: true, detail: '64/64 Zellen konsistent, alle überdeckt' });
			else res.push({ name: 'G4 Map: Leuchten/Füllen stimmt exakt mit Fenster-Abdeckung überein', pass: false, detail: why });
		}

		// G5: Abschluss
		{
			let ok = true, why = '';
			const end = sweepPos(SW_TOTAL);
			const last = ANCHORS[ANCH - 1];
			if (end.fr !== last.fr || end.fc !== last.fc) { ok = false; why = 'Ende ≠ letzter Anker'; }
			const secs = SW_TOTAL / 60;
			if (secs < 7 || secs > 12) { ok = false; why = ok ? why : ''; if (!why) why = `Dauer ${secs.toFixed(1)} s unplausibel`; }
			// Tick-Simulation: "Fertig" wird genau einmal am Ende gemeldet.
			let t = 0, doneMsgs = 0, wasDone = 0;
			while (t < SW_TOTAL + 3) {
				const done = t >= SW_TOTAL;
				if (done && !wasDone) doneMsgs++;
				wasDone = done;
				t += 1; // dt = 1 (60-FPS-Einheit), wie im tick
			}
			if (doneMsgs !== 1) { ok = false; why = why ? why + '; ' : ''; why += `"Fertig" ${doneMsgs}× gemeldet`; }
			if (ok) res.push({ name: 'G5 Abschluss: exaktes Ende am letzten Anker, 1× "Fertig", plausible Dauer', pass: true, detail: `Ende (${last.fr}, ${last.fc}) nach ${secs.toFixed(1)} s` });
			else res.push({ name: 'G5 Abschluss: exaktes Ende am letzten Anker, 1× "Fertig", plausible Dauer', pass: false, detail: why });
		}
		return res;
	}

	let sweepT = 0, sweepDone = 0;
	let kerA = 0, tKerA = 0;
	let outA = 0, tOutA = 0;
	let tagA = [0, 0, 0], tTagA = [0, 0, 0];
	let zoomA = 0, tZoomA = 0;
	const KC = 24; // Filter-Panel: Zellgröße in px

	// Schritt 2: Beispiel-Pixel, oberes linkes Auge (Zeile 10, Spalte 4).
	const ZR = 10, ZC = 4;
	const ZVAL = KatzeKit.GREEN[ZR * KatzeKit.N + ZC];

	// Rahmen der Graustufen-Katze. Die Katze selbst ist der Grün-Kanal
	// (inst[PICK]), der ab Schritt 2 grau gemischt wird und in Schritt 3
	// an diese Position fliegt, gezeichnet an seiner Geometrie.
	function drawGrayCat(ctx, S) {
		const o = S.inst[KatzeKit.PICK];
		if (o.a < 0.005) return;
		ctx.globalAlpha = o.a;
		ctx.strokeStyle = '#1b1f24'; ctx.lineWidth = 1.5;
		ctx.strokeRect(o.x + .5, o.y + .5, KatzeKit.N * o.s - 1, KatzeKit.N * o.s - 1);
		ctx.globalAlpha = 1;
	}

	// Zoom-Panel: das Beispiel-Pixel vergrößert + Wert + 0–255-Skala.
	function drawPixelZoom(ctx, S) {
		const o = S.inst[KatzeKit.PICK];
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
		if (S.step < 5) return;

		for (let i8 = 0; i8 < O8 * O8; i8++) {
			const R = (i8 / O8) | 0, C = i8 % O8;
			const x = Math.floor(ox + C * os), y = Math.floor(oy + R * os);
			const xw = Math.ceil(ox + (C + 1) * os) - x, yh = Math.ceil(oy + (R + 1) * os) - y;
			const lit = LIT8[i8];
			const isLit = lit >= 0 && (S.step >= 7 || (S.step === 6 && sweepT >= tLit8[i8]));
			const isFull = !isLit && (S.step >= 7 || (S.step === 6 && sweepT >= tFull8[i8]));
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
		if (S.step >= 6) {
			for (let i8 = 0; i8 < O8 * O8; i8++) {
				const lit = LIT8[i8];
				if (lit < 0 || (S.step === 6 && sweepT < tLit8[i8])) continue;
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
		// Nur die Form (gelb = Auge, schwarz = Pupille/Rand), keine Zahlen.
		for (let r = 0; r < KH; r++) for (let c = 0; c < KW; c++) {
			if (!TPL[r * KW + c]) continue;
			ctx.fillStyle = '#E2C72E';
			KatzeKit.roundRect(ctx, kx + c * KC + 3, ky + r * KC + 3, KC - 6, KC - 6, 3);
			ctx.fill();
		}
		ctx.globalAlpha = 1;
	}

	function drawWindow(ctx, S) {
		if (S.step < 5 || S.step > 6) return;
		const o = S.inst[0], s = o.s;
		// Schritt 6: Fenster auf der Startposition; Schritt 7:
		// blockweiser Sweep, an den Ankern ganzzahlig, und das
		// Fenster wird exakt auf den Pixel-Block gesnapt (G1).
		const pos = S.step === 6 ? sweepPos(sweepT) : { fr: 0, fc: 0 };
		const x = Math.floor(o.x + pos.fc * s), y = Math.floor(o.y + pos.fr * s);
		const x1 = Math.ceil(o.x + (pos.fc + KW) * s), y1 = Math.ceil(o.y + (pos.fr + KH) * s);
		const ri = Math.max(0, Math.min(OH - 1, Math.round(pos.fr)));
		const ci = Math.max(0, Math.min(OW - 1, Math.round(pos.fc)));
		const sc = SCORES[ri * OW + ci], hot = sc >= 4;

		ctx.fillStyle = hot ? 'rgba(76,175,80,.30)' : 'rgba(150,190,240,.30)';
		ctx.fillRect(x, y, x1 - x, y1 - y);
		ctx.strokeStyle = hot ? '#4caf50' : '#7aa8e0'; ctx.lineWidth = 2;
		ctx.strokeRect(x + 1, y + 1, x1 - x - 2, y1 - y - 2);

		const bw = 46, bh = 20, bx = (x + x1) / 2 - bw / 2, by = y - bh - 6;
		if (by > 0) {
			ctx.fillStyle = '#fff'; ctx.fillRect(bx, by, bw, bh);
			ctx.strokeStyle = hot ? '#4caf50' : '#7aa8e0'; ctx.lineWidth = 1.1;
			ctx.strokeRect(bx + .5, by + .5, bw - 1, bh - 1);
			ctx.fillStyle = hot ? '#2e7d32' : '#4a7fc0';
			ctx.font = '600 11.5px Inter, system-ui, sans-serif';
			ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
			ctx.fillText(sc + '', (x + x1) / 2, by + bh / 2);
		}
	}

	if (typeof window !== 'undefined')
		window.ConvSweepGuardrails = sweepGuardrails;

	return KatzeKit.create({
		slideId: 'slide-convolution',
		prefix: 'conv',
		steps: [
			{ k: 'Schritt 1', t: 'Nehmen wir ein<br><em>Farbbild</em> einer Katze.',
			  p: 'Jedes Pixel besteht aus Werten für Rot, Grün und Blau',
			  c: '<span class="kz-chip">(32, 32, 3)</span>' },
			{ k: 'Schritt 2', t: 'Farbbilder haben<br><em>drei</em> Stapel.',
			  p: 'Rot, Grün und Blau, drei eigene Zahlen-Raster',
			  c: '<span class="kz-chip">(32, 32, 3)</span><span class="kz-arrow">=</span><span class="kz-chip">3 × (32, 32)</span>' },
			{ k: 'Schritt 3', t: 'Ein Kanal ist nur<br><em class="gray">Grau</em>.',
			  p: 'Wie hell der Pixel ist, sagt, wie stark die jeweilige Farbe aktiviert ist',
			  c: '<span class="kz-chip g">(32, 32)</span><span class="kz-arrow">·</span><span class="kz-chip g">0 – 255</span>' },
			{ k: 'Schritt 4', t: 'Jeder Pixel ist<br>nur eine <em>Zahl</em>.',
			  p: 'Graustufen · 0 = Schwarz, 255 = Weiß',
			  c: '<span class="kz-chip g">(32, 32)</span><span class="kz-arrow">→</span><span class="kz-chip g">0–255</span>' },
			{ k: 'Schritt 5', t: 'Ein <em>Filter</em> ist ein Muster:<br>hier die Form des <em>Auges</em>.',
			  p: 'Die Form des Auges, als Muster aus 6 × 5 Werten',
			  c: '<span class="kz-chip">(6, 5)</span>' },
			{ k: 'Schritt 6', t: 'Das Muster wird<br>auf das Bild <em>gelegt</em>.',
			  p: `Punkt <b>1</b> von ${ANCH} · Treffer: <b>0</b> von ${TMAX}`,
			  c: '<span class="kz-chip">(32, 32)</span><span class="kz-arrow">×</span><span class="kz-chip">(6, 5)</span>' },
			{ k: 'Schritt 7', t: '… und <em>fließt</em> über<br>das ganze Bild.',
			  p: `Block <b>1</b> von ${ANCH} · das Fenster hält auf jedem Pixel-Block`,
			  c: `<span class="kz-chip">(${OH}, ${OW})</span><span class="kz-arrow">→</span><span class="kz-chip g">(8, 8)</span>`,
			  i: 'An jedem Platz <b>misst</b> der Filter, wie gut sein kleines Fenster zum <b>darunterliegenden</b> Bildstück passt: gleiche Werte = hohe Zahl, kaum Übereinstimmung = nahe 0.' },
			{ k: 'Schritt 8', t: 'Wo der Filter passt,<br>leuchten <em>die Augen</em>.',
			  p: `1024 Pixel → ${O8 * O8} Zahlen, und die Augen bleiben`,
			  c: '<span class="kz-chip g">(8, 8)</span>',
			  i: 'Die Augen-Form ist nur <b>unser Beispiel</b>. Im echten Training bringt sich der Computer die Filter <b>selbst bei</b>, anhand der Trainingsdaten.' }
		],

		layoutFor(step, S) {
			const { W, H, inst } = S;
			const s = Math.min(H / KatzeKit.N * .86, W / KatzeKit.N * .86, 13);
			const imgW = KatzeKit.N * s, gapOut = 60, outW = O8 * s * 4;
			if (step === 0) {
				// Farbbild: eine große farbige Katze in der Mitte.
				const cs = Math.min(H / KatzeKit.N * .86, W / KatzeKit.N * .6, 13);
				inst.forEach((o, i) => {
					o.ts = cs; o.tx = (W - KatzeKit.N * cs) / 2; o.ty = (H - KatzeKit.N * cs) / 2;
					o.tmix = 0; o.ta = i === 0 ? 1 : 0;
				});
				tTagA = [0, 0, 0];
				S.zoomX = null;
			} else if (step === 1 || step === 2) {
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
			} else if (step === 3) {
				// Der Grün-Kanal (aus Schritt 2, bereits grau gemischt)
				// fliegt aus der Mitte nach links, Bewegung statt
				// Fade-Out. Zoom-Pixel rechts.
				const cs = Math.min(H / KatzeKit.N * .8, W / KatzeKit.N * .5, 10);
				const zw = 230, zh = 250, gap = 90;
				const x0 = (W - (KatzeKit.N * cs + gap + zw)) / 2;
				inst.forEach((o, i) => {
					o.ts = cs; o.tx = x0; o.ty = (H - KatzeKit.N * cs) / 2 + 6;
					o.tmix = i === KatzeKit.PICK ? 1 : 0;
					o.ta = i === KatzeKit.PICK ? 1 : 0;
				});
				tTagA = [0, 0, 0];
				S.tGrayMix = 1;
				S.zoomX = x0 + KatzeKit.N * cs + gap;
				S.zoomY = (H - zh) / 2;
			} else {
				S.tGrayMix = 0;
				inst.forEach((o, i) => {
					o.ts = s;
					o.tx = (W - (imgW + gapOut + outW)) / 2;
					o.ty = (H - imgW) / 2 + 6;
					o.tmix = i === 0 ? 0 : 1;
					o.ta = i === 0 ? (step >= 7 ? .22 : 1) : 0;
				});
				tTagA = [0, 0, 0];
			}
			tKerA = step <= 3 ? 0 : (step >= 7 ? .45 : 1);
			tOutA = step >= 5 ? 1 : 0;
			tZoomA = step === 3 ? 1 : 0;
		},

		onStep(step) {
			if (step === 6) { sweepT = 0; sweepDone = 0; }
		},

		tick(dt, k, S, setFoot) {
			kerA = KatzeKit.lerp(kerA, tKerA, k * 1.2);
			outA = KatzeKit.lerp(outA, tOutA, k * 1.2);
			zoomA = KatzeKit.lerp(zoomA, tZoomA, k * 1.2);
			for (let i = 0; i < 3; i++) tagA[i] = KatzeKit.lerp(tagA[i], tTagA[i], k * 1.2);
			if (S.step !== 6) return;
			// Blockweiser Sweep: Halten (DWELL) + weiche Fahrt (MOVE)
			sweepT = Math.min(sweepT + dt, SW_TOTAL);
			if (sweepT >= SW_TOTAL) {
				if (!sweepDone) {
					sweepDone = 1;
					setFoot(`Fertig, <b>${ANCH}</b> Positionen → <b>${O8 * O8}</b> Zahlen (8 × 8)`,
						'<span class="kz-chip g">(8, 8)</span>');
				}
			} else {
				const pos = sweepPos(sweepT);
				const ri = Math.max(0, Math.min(OH - 1, Math.round(pos.fr)));
				const ci = Math.max(0, Math.min(OW - 1, Math.round(pos.fc)));
				setFoot(`Block <b>${pos.anchor + 1}</b> von ${ANCH} · Treffer: <b>${SCORES[ri * OW + ci]}</b> von ${TMAX}`,
					'<span class="kz-chip g">(8, 8)</span>');
			}
		},

		draw(ctx, S) {
			ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, S.W, S.H);
			drawOutput8(ctx, S);
			const o = S.inst[0];
			if (S.step === 0) {
				// Farbbild: farbiges Raster.
				KatzeKit.drawGrid(ctx, o, 0, 0);
				if (o.a > 0.02) {
					ctx.globalAlpha = o.a;
					ctx.strokeStyle = '#1b1f24'; ctx.lineWidth = 1.5;
					ctx.strokeRect(o.x + .5, o.y + .5, KatzeKit.N * o.s - 1, KatzeKit.N * o.s - 1);
					ctx.globalAlpha = 1;
				}
			} else if (S.step === 1 || S.step === 2) {
				// Kanal-Stapel; Schritt 3: nur der Grün-Kanal, fadet in Grau.
				S.inst.forEach((gi, i) => KatzeKit.drawGrid(ctx, gi, i, S.grayMix));
				KatzeKit.drawTags(ctx, S, tagA);
			} else if (S.step === 3) {
				// Der Grün-Kanal (inst[PICK], bereits grau gemischt)
				// fliegt aus der Kanal-Mitte nach links, nicht ausblenden.
				S.inst.forEach((gi, i) => KatzeKit.drawGrid(ctx, gi, i, S.grayMix));
				drawGrayCat(ctx, S);
				drawPixelZoom(ctx, S);
			} else {
				KatzeKit.drawGrid(ctx, o, 0, 0);
				// Beim Zusammenfaden flackern die Kanäle kurz drüber.
				KatzeKit.drawGrid(ctx, S.inst[1], 1, 0);
				KatzeKit.drawGrid(ctx, S.inst[2], 2, 0);
			}
			if (S.step >= 4 && o.a > 0.02) {
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
// FlattenDemo, "Was macht Flatten?"
//
// (Pixel/Kanäle/Grau hat die Katze-Folie, hier nur der Flatten-
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
			const t = rowT;   // linear: Zeilen fließen gleichmäßig (flüssig), kein Puls
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
			  p: '<b>1024</b> Zahlen, eine flache Schnur',
			  c: '<span class="kz-chip r">(1024,)</span>',
			  i: 'Der Trick: Flatten verliert die Bildstruktur. Convolutions arbeiten nur <b>lokal</b>, dafür kann ein <b>Dense-Layer</b> darauf arbeiten und die lokalen Entscheidungen zu einer <b>globalen Entscheidung</b> nutzen, z. B. zwischen Labels wie „Hund? Katze?" oder „Auto? Katze?".' }
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
			else { flatP = 32; flatMsg = 1; } // kein Warten: alles flach
		},

		tick(dt, k, S, setFoot) {
			for (let i = 0; i < 3; i++) tagA[i] = KatzeKit.lerp(tagA[i], tTagA[i], k * 1.2);
			railA = KatzeKit.lerp(railA, tRailA, k);
			if (S.step !== 0) return;
			// ~5,25 s für 32 Zeilen (ca. 2× schneller)
			flatP = Math.min(flatP + dt * (32 / (5.25 * 60)), 32);
			if (flatP >= 32) {
				if (!flatMsg) {
					flatMsg = 1;
					setFoot('Fertig, <b>1024</b> Zahlen in einer einzigen Reihe',
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
// PipelineDemo, "Der gesamte Prozess" (am Ende der Deck)
//
// Bild → Layer 1 (Verläufe) → Layer 2 (Augen/Nase/Mund-Maps)
// → Dense-Layer (farbig, Feature-Punkte) → zwei
// Ausgabe-Neuronen. Layer 1 bleibt sichtbar, wenn Layer 2
// erscheint, die Daten fließen sichtbar von Layer 1 in
// Layer 2 (Punkte auf den Pfeilen). Jeder Layer reduziert
// die Information des Bilds stück für stück auf das
// Wesentliche (Katze/Hund). Das Netz startet blind
// (50:50, Loss 0,693, es RÄT blind); im Training sinkt der
// Loss (Ziel: niedriger, nicht 0) und das Katzen-Neuron wird
// am aktivsten (95 %).
// 7 Schritte: Bild ("Und jetzt alles zusammen") · Layer 1
// (Verläufe) · Layer 2 (Augen/Nase/Mund, Layer 1 bleibt) ·
// Dense · 50:50 (Loss) · Training (Loss sinkt) · Antwort
// (95 %).
// ============================================================
const PipelineDemo = (() => {
	'use strict';

	// Stufe 1 der Convolutions: die ersten Filter finden Verläufe
	// (Kanten), waagerecht, senkrecht, diagonal.
	const EDGE_MAPS = [
		{ label: 'Waagerecht', lit: [1 * 8 + 2, 1 * 8 + 3, 1 * 8 + 4, 1 * 8 + 5,
		                             5 * 8 + 2, 5 * 8 + 3, 5 * 8 + 4, 5 * 8 + 5] },
		{ label: 'Senkrecht', lit: [2 * 8 + 2, 3 * 8 + 2, 4 * 8 + 2,
		                            2 * 8 + 5, 3 * 8 + 5, 4 * 8 + 5] },
		{ label: 'Diagonal', lit: [1 * 8 + 2, 2 * 8 + 3, 3 * 8 + 4, 4 * 8 + 5,
		                           1 * 8 + 5, 2 * 8 + 4, 3 * 8 + 3, 4 * 8 + 2] }
	];
	// Stufe 2: daraus entstehen die Teile (Augen/Nase/Mund).
	const MAPS = [
		{ label: 'Augen', lit: [3 * 8 + 1, 3 * 8 + 5] },
		{ label: 'Nase', lit: [4 * 8 + 3] },
		{ label: 'Mund', lit: [5 * 8 + 3] }
	];

	let aCat = 0, tCatA = 0;
	let aConv = 0, tConvA = 0;
	let aEdge = 0, tEdgeA = 0;
	let aPart = 0, tPartA = 0;
	let aDense = 0, tDenseA = 0;
	let aOut = 0, tOutA = 0;
	let aLoss = 0, tLossA = 0;
	let aLabel = 0, tLabelA = 0;
	let trainP = 0, trainMsg = 0;
	let entrancePending = false;
	let entrancePlayed = false;   // Einstieg nur einmal, sonst Flash bei jedem Wiederauftauchen

	// Lernkurve: Katzen-Anteil startet bei 50 % (blindes Raten,
	// der schlechtmögliche uninformierte Loss) und trainiert sich
	// auf 95 %. Das Idealziel (Schritt 5) bleibt 100 %, deshalb
	// zusätzlich CURVE_GOAL. Loss = −ln(p).
	const P0 = 50, P1 = 95, P_GOAL = 100;
	const easeInCubic = t => t * t * t;
	const trainPct = (t, p1) => {
		const target = p1 == null ? P1 : p1;
		const base = P0 + (target - P0) * easeInCubic(t);   // erst langsam, dann steil Richtung Ziel
		const explore = Math.sin(t * 26) * 8 * (1 - t); // am Anfang: etwas ausprobieren (Auf & Ab)
		return Math.max(1, Math.min(100, base + explore));
	};
	const lossOf = p => -Math.log(Math.max(p, 1e-9) / 100);
	const fmtLoss = n => n.toFixed(3).replace('.', ',');
	const lossColor = L => {
		const t = Math.min(L / 0.7, 1);
		return t > 0.66 ? '#dc2626' : (t > 0.33 ? '#d97706' : '#16a34a');
	};
	const CURVE = [], CURVE_GOAL = [];
	for (let i = 0; i <= 60; i++) {
		const t = i / 60;
		CURVE.push({ t, l: lossOf(trainPct(t)) });
		CURVE_GOAL.push({ t, l: lossOf(trainPct(t, P_GOAL)) });
	}

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

	// Karten-Rahmen + leere Zellen (einmal pro Slot, mit dem
	// stärkeren Alpha der beiden Stufen, kein Doppel-Weiß beim
	// Crossfade).
	function drawMapSlot(ctx, x, y, ms, label, a) {
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
			ctx.fillStyle = '#f6f7f9';
			ctx.fillRect(x + C * ms + 1, y + R * ms + 1, ms - 2, ms - 2);
		}
		ctx.globalAlpha = 1;
	}

	// Deterministisches Rauschen pro Zelle (0..1), stabil, kein
	// Frame-zu-Frame-Flackern. Für den untrainierten Zustand.
	function prand(i, seed) {
		const x = Math.sin(i * 12.9898 + (seed + 1) * 78.233) * 43758.5453;
		return x - Math.floor(x);
	}

	// Die leuchtenden Zellen einer Karte. clarity 0 = zufällig
	// (nur Rauschen), 1 = trainiert (sauberes Muster). Dazwischen
	// mischt sich das saubere Muster ins Rauschen hinein. flick 1..0
	// (Training, erste ~60 %): die Zellen flackern unruhig, bis das
	// Netz "gefunden" hat, welche aufleuchten sollen.
	function drawMapLit(ctx, x, y, ms, lit, a, clarity, seed, f) {
		if (a < 0.01) return;
		const litSet = new Set(lit);
		const cl = Math.max(0, Math.min(1, clarity == null ? 1 : clarity));
		const flick = f || 0;
		for (let i = 0; i < 64; i++) {
			let b;
			if (litSet.has(i)) {
				if (flick > 0.02) {
					// Suche: erst flackert auch die richtige Zelle mit,
					// ab ~60 % Training ist sie gefunden und wird stark.
					b = cl + flick * (0.25 + 0.75 * Math.random());
				} else {
					b = cl;                                  // trainiert: wird mit dem Training sichtbar
				}
			} else {
				const nv = prand(i, seed);
				let noise = nv > 0.82 ? nv * 0.8 : 0;
				if (flick > 0.02 && nv > 0.55) {
					// Suche: auch die falschen Kandidaten blitzen kurz auf
					noise = Math.max(noise, nv * flick * Math.random());
				}
				b = (1 - cl) * noise;   // untrainiert: wenig, dezent verrauscht
			}
			if (b < 0.06) continue;
			const R = (i / 8) | 0, C = i % 8;
			const cx = x + C * ms, cy = y + R * ms;
			ctx.globalAlpha = a * b;
			ctx.fillStyle = 'rgba(76,175,80,.55)';
			ctx.fillRect(cx + 1, cy + 1, ms - 2, ms - 2);
			ctx.strokeStyle = '#4caf50'; ctx.lineWidth = 1.5;
			ctx.strokeRect(cx + 1.5, cy + 1.5, ms - 3, ms - 3);
		}
		ctx.globalAlpha = 1;
	}

	// Loss-Panel rechts neben den Neuronen: Formel, aktueller Wert
	// und die Lernkurve, die sich beim Training einzeichnet.
	function drawLossPanel(ctx, geo, S) {
		if (aLoss < 0.01) return;
		const { px, py, pw, ph } = geo;
		const goal = S.step === 4;
		const t = (S.step === 4 || S.step === 7) ? 1 : (S.step === 5 ? 0 : (S.step === 6 ? trainP : 0));
		const L = goal ? lossOf(P_GOAL) : lossOf(trainPct(t));
		const col = lossColor(L);

		ctx.globalAlpha = aLoss;
		ctx.fillStyle = '#fff';
		KatzeKit.roundRect(ctx, px, py, pw, ph, 12);
		ctx.fill();
		ctx.strokeStyle = '#e2e8f0'; ctx.lineWidth = 1.2; ctx.stroke();

		ctx.fillStyle = '#64748b';
		ctx.font = '700 11px Inter, system-ui, sans-serif';
		ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
		ctx.fillText('Loss = −ln(p)', px + 14, py + 22);
		ctx.fillStyle = col;
		ctx.font = '800 21px Inter, system-ui, sans-serif';
		ctx.textAlign = 'right';
		ctx.fillText(fmtLoss(L), px + pw - 14, py + 24);

		// Mini-Plot: Loss über den Trainingsfortschritt.
		const gx = px + 16, gy = py + 38, gw = pw - 32, gh = ph - 78;
		ctx.strokeStyle = '#eef0f4'; ctx.lineWidth = 1;
		ctx.beginPath();
		ctx.moveTo(gx, gy); ctx.lineTo(gx, gy + gh); ctx.lineTo(gx + gw, gy + gh);
		ctx.stroke();
		const X = tt => gx + tt * gw;
		const Y = ll => gy + gh - (ll / 0.75) * gh;
		if (t > 0.004) {
			ctx.strokeStyle = col; ctx.lineWidth = 2;
			ctx.beginPath();
			let started = false;
			for (const c of (goal ? CURVE_GOAL : CURVE)) {
				if (c.t > t + 1e-9) break;
				if (!started) { ctx.moveTo(X(c.t), Y(c.l)); started = true; }
				else ctx.lineTo(X(c.t), Y(c.l));
			}
			ctx.stroke();
		}
		ctx.fillStyle = col;
		ctx.beginPath(); ctx.arc(X(t), Y(L), 3.5, 0, Math.PI * 2); ctx.fill();

		ctx.fillStyle = '#94a3b8';
		ctx.font = '600 10px Inter, system-ui, sans-serif';
		ctx.textAlign = 'right';
		ctx.fillText('Training →', gx + gw, py + ph - 10);
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
		// Farbiges Punktraster (Blau → Violett), nicht grau.
		for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
			const hue = 205 + ((r * cols + c) / (rows * cols - 1)) * 110;
			ctx.fillStyle = `hsl(${hue}, 42%, 72%)`;
			ctx.beginPath();
			ctx.arc(dx0 + c * ddx, dy0 + r * ddy, 3.5, 0, Math.PI * 2);
			ctx.fill();
		}
		// Hervorgehobene Punkte: dort, wo Augen, Nase und Mund
		// (die Layer-2-Strukturen) in den Dense-Layer fließen.
		const feat = [[1, 1], [1, 3], [4, 2], [6, 2]];
		for (const [r, c] of feat) {
			const cx = dx0 + c * ddx, cy = dy0 + r * ddy;
			const g = ctx.createRadialGradient(cx, cy, 1, cx, cy, 9);
			g.addColorStop(0, 'rgba(76,175,80,.5)');
			g.addColorStop(1, 'rgba(76,175,80,0)');
			ctx.fillStyle = g;
			ctx.beginPath(); ctx.arc(cx, cy, 9, 0, Math.PI * 2); ctx.fill();
			ctx.fillStyle = '#4caf50';
			ctx.beginPath(); ctx.arc(cx, cy, 4.5, 0, Math.PI * 2); ctx.fill();
			ctx.strokeStyle = '#2e7d32'; ctx.lineWidth = 1.5;
			ctx.stroke();
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

	// Label-Check (Schritt 8): kleine Kapsel unter dem Katzen-Neuron:
	// supervised Learning: die Antwort des Netzes stimmt mit dem Label.
	function drawLabelBadge(ctx, cx, cy, a) {
		if (a < 0.01) return;
		const w = 150, h = 26, x = cx - w / 2, y = cy;
		ctx.globalAlpha = a;
		ctx.fillStyle = '#f0fdf4';
		KatzeKit.roundRect(ctx, x, y, w, h, 13);
		ctx.fill();
		ctx.strokeStyle = '#86efac'; ctx.lineWidth = 1.2; ctx.stroke();
		ctx.fillStyle = '#15803d';
		ctx.font = '700 12px Inter, system-ui, sans-serif';
		ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
		ctx.fillText('Label: Katze  ✓', cx, y + h / 2);
		ctx.globalAlpha = 1;
	}

	return KatzeKit.create({
		slideId: 'slide-pipeline',
		prefix: 'pipe',
		steps: [
			{ k: 'Schritt 1', t: 'Und jetzt<br><em>alles zusammen</em>.',
			  p: '32 × 32 Pixel, die Katze',
			  c: '<span class="kz-chip">(32, 32, 3)</span>' },
			{ k: 'Schritt 2', t: 'Layer 1: Filter finden<br><em>Verläufe</em>.',
			  p: 'Waagerecht, senkrecht, diagonal: Kanten',
			  c: '<span class="kz-chip">(6, 5)</span><span class="kz-arrow">→</span><span class="kz-chip g">3 × (8, 8)</span>',
			  i: 'Im Bild steckt die Antwort <b>Katze/Hund</b> schon, versteckt unter tausend Details (kleiner Hund, schwarz-weiße, orange Katze …). Wir wollen nur <b>das eine</b>. <b>Layer 1</b> sucht nach Mustern im Bild, <b>Layer 2</b> sucht nach Mustern in dem, was Layer 1 gefunden hat, usw., so dass jede Schicht immer größere Muster erkennen kann.' },
			{ k: 'Schritt 3', t: 'Layer 2: Daraus entstehen<br><em>Augen, Nase, Mund</em>.',
			  p: 'Filter kombinieren Verläufe zu Formen',
			  c: '<span class="kz-chip">(6, 5)</span><span class="kz-arrow">→</span><span class="kz-chip g">3 × (8, 8)</span>',
			  i: '<b>Layer 2</b> reduziert weiter: aus Verläufen werden Formen. Was wir hier sehen (Augen, Nase, Mund), ist das <b>Ziel</b>, so soll es am Ende aussehen. Das Netz kann das aber noch gar nicht, es muss es sich erst antrainieren.' },
			{ k: 'Schritt 4', t: 'Die Karten gehen<br>in <em>Dense-Layer</em>.',
			  p: '64 Zahlen pro Karte, dicht verdrahtet',
			  c: '<span class="kz-chip g">3 × (8, 8)</span><span class="kz-arrow">→</span><span class="kz-chip r">Dense</span>' },
			{ k: 'Schritt 5', t: 'Das <em>Ziel</em>:<br>Katze = <b>100 %</b>.',
			  p: 'So soll es am Ende sein',
			  c: '<span class="kz-chip g">Katze 100 %</span><span class="kz-arrow">·</span><span class="kz-chip g">Loss 0,000</span>',
			  i: 'Das ist das <b>gewünschte Ergebnis</b>: Das Netz sagt mit großer Sicherheit „Katze" (wenn eine Katze auf dem Bild ist). Genau dorthin soll das Training es bringen.' },
			{ k: 'Schritt 6', t: 'Am Anfang:<br>reiner <em>Zufall</em>.',
			  p: 'Anfang: <b>50 : 50</b> · Loss <b>0,693</b>',
			  c: '<span class="kz-chip r">50 : 50</span><span class="kz-arrow">·</span><span class="kz-chip r">Loss 0,693</span>',
			  i: 'Aber am Anfang weiß das Netz <b>gar nicht</b>, was es tun soll. Die Gewichte sind <b>zufällig initialisiert</b>, es rät blind, die Karten sehen noch nicht nach Augen, Nase, Mund aus.' },
			{ k: 'Schritt 7', t: 'Lernen: die Daten<br>immer wieder <em>angucken</em>.',
			  p: 'Training … · Katze <b>50 %</b> · Loss <b>0,693</b>',
			  c: '<span class="kz-chip g">Loss ↓</span>',
			  i: 'Das Netz lernt, indem es die <b>Trainingsdaten immer und immer wieder anschaut</b>. Bei jedem Durchgang (einer „Epoche") justiert es die Gewichte ein Stück nach dem anderen, so wird die Antwort immer besser.' },
			{ k: 'Schritt 8', t: 'Ergebnis:<br><b>Katze ≈ 95 %</b>.',
			  p: 'Katze: <b>95 %</b> · Loss <b>0,051</b>',
			  c: '<span class="kz-chip g">Katze 95 %</span>',
			  i: 'Nach dem Training ist das Netz fast so sicher wie das Ziel: Es erkennt die <b>Katze</b>. Das <b>Label</b> lautete „Katze", die Antwort des Netzes stimmt damit <b>überein</b>, deshalb ist der Loss so <b>niedrig</b>.' }
		],

		layoutFor(step, S) {
			const { W, H, inst } = S;
			const cs = Math.min(H / 32 * .75, W / 32 * .25, 8.5);
			inst.forEach((o, i) => {
				o.ts = cs; o.tx = 30; o.ty = (H - 32 * cs) / 2;
				o.tmix = 0; o.ta = i === 0 ? 1 : 0;
			});
			// Einstieg (nur beim allerersten Mal): die Katze fährt aus
			// dem linken Rand hinein und blendet gleichzeitig ein.
			// Bei jedem erneuten Betreten der Folie würde sonst der alte
			// Frame (Katze sichtbar) geblitzt → Teleport weg → zurück:
			// deshalb ab dem zweiten Mal einfach an ihrem Platz bleiben.
			if (step === 0 && entrancePending) {
				entrancePending = false;
				entrancePlayed = true;
				aCat = 0;
				const o = inst[0];
				o.s = cs;
				o.x = o.tx - 32 * cs - 24;
				o.y = o.ty;
			} else if (step === 0 && entrancePlayed) {
				const o = inst[0];
				o.x = o.tx; o.y = o.ty; o.s = cs;
			}
			tCatA = 1;
			tConvA = step >= 1 ? 1 : 0;
			// Layer 1 bleibt sichtbar, wenn Layer 2 erscheint, die
			// Daten fließen von Layer 1 in Layer 2.
			tEdgeA = step >= 1 ? 1 : 0;
			tPartA = step >= 2 ? 1 : 0;
			tDenseA = step >= 3 ? 1 : 0;
			tOutA = step >= 4 ? 1 : 0;
			tLossA = step >= 4 ? 1 : 0;
			tLabelA = step >= 7 ? 1 : 0;
		},

		onStep(step) {
			if (step === 6) { trainP = 0; trainMsg = 0; }
			if (step === 0 && !entrancePlayed) entrancePending = true;
		},

		tick(dt, k, S, setFoot) {
			aCat = KatzeKit.lerp(aCat, tCatA, k * 1.0);
			aConv = KatzeKit.lerp(aConv, tConvA, k * 1.5);
			aEdge = KatzeKit.lerp(aEdge, tEdgeA, k * 1.5);
			aPart = KatzeKit.lerp(aPart, tPartA, k * 1.5);
			aDense = KatzeKit.lerp(aDense, tDenseA, k * 1.5);
			aOut = KatzeKit.lerp(aOut, tOutA, k * 1.5);
			aLoss = KatzeKit.lerp(aLoss, tLossA, k * 1.5);
			aLabel = KatzeKit.lerp(aLabel, tLabelA, k * 1.5);
			if (S.step !== 6) return;
			// ~7 s Training: 50 → 95 %, Loss 0,693 → 0,051
			trainP = Math.min(trainP + dt / (7 * 60), 1);
			if (trainP >= 1) {
				if (!trainMsg) {
					trainMsg = 1;
					setFoot('Katze: <b>95 %</b> · Loss <b>0,051</b>, fast sicher Katze',
						'<span class="kz-chip g">Katze 95 %</span>');
				}
			} else {
				const p = Math.round(trainPct(trainP));
				setFoot(`Training … · Katze <b>${p} %</b> · Loss <b>${fmtLoss(lossOf(p))}</b>`,
					'<span class="kz-chip g">Loss ↓</span>');
			}
		},

		draw(ctx, S) {
			ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, S.W, S.H);
			const { W, H } = S;
			const cat = S.inst[0];
			const clarity = S.step <= 4 ? 1 : (S.step === 5 ? 0 : (S.step === 6 ? trainP : 1));
			// Training: erste ~60 % sucht das Netz, die Zellen
			// flackern → danach ist die Entscheidung gefallen.
			const flick = S.step === 6 ? Math.max(0, (0.6 - trainP) / 0.6) : 0;
			const ch = 32 * cat.s;

			const ms = 12;
			const mapW = 8 * ms;
			const mapX1 = 30 + ch + 48;
			const mapY0 = (H - (3 * mapW + 2 * 22)) / 2;
			const mapYs = [mapY0, mapY0 + mapW + 22, mapY0 + 2 * (mapW + 22)];
			const mapX2 = mapX1 + mapW + 64;
			const denseX = mapX2 + mapW + 48;
			const denseW = 120, denseH = H * .62, denseY = (H - denseH) / 2;
			const nCx = denseX + denseW + 80;
			const rN = Math.min(H * .14, 44);

			const cyMid = H / 2;

			// Pfeile: Katze → Layer 1, Layer 1 → Layer 2 (pro Reihe),
			// Layer 2 → Dense, Dense → Neuronen.
			MAPS.forEach((m, i) => {
				arrow(ctx, 30 + ch + 6, cyMid, mapX1 - 10, mapYs[i] + 4 * ms, aConv);
			});
			MAPS.forEach((m, i) => {
				arrow(ctx, mapX1 + mapW + 10, mapYs[i] + 4 * ms, mapX2 - 10, mapYs[i] + 4 * ms, aPart);
			});
			arrow(ctx, mapX2 + mapW + 10, cyMid, denseX - 10, cyMid, aDense);
			arrow(ctx, denseX + denseW + 10, cyMid, nCx - rN - 10, H * .32, aOut);
			arrow(ctx, denseX + denseW + 10, cyMid, nCx - rN - 10, H * .74, aOut);

			// Eingang: Farb-Katze
			if (aCat > 0.01) {
				ctx.globalAlpha = aCat;
				KatzeKit.drawGrid(ctx, cat, 0, 0);
				ctx.strokeStyle = '#1b1f24'; ctx.lineWidth = 1.5;
				ctx.strokeRect(cat.x + .5, cat.y + .5, ch - 1, ch - 1);
				ctx.globalAlpha = 1;
			}

			// Layer 1 = Verläufe (Schritt 2), bleibt stehen, wenn
			// Layer 2 erscheint.
			if (aConv > 0.01) {
				ctx.globalAlpha = aConv;
				ctx.fillStyle = '#64748b';
				ctx.font = '800 13px Inter, system-ui, sans-serif';
				ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
				ctx.fillText('Layer 1 · Verläufe', mapX1 - 5, mapY0 - 22);
				ctx.globalAlpha = 1;
				for (let i = 0; i < 3; i++) {
					drawMapSlot(ctx, mapX1, mapYs[i], ms, EDGE_MAPS[i].label, aConv);
					drawMapLit(ctx, mapX1, mapYs[i], ms, EDGE_MAPS[i].lit, aEdge, clarity, i, flick);
				}
			}

			// Layer 2 = zusammengesetzte Strukturen (Schritt 3+): die
			// Daten von Layer 1 fließen hinein.
			if (aPart > 0.01) {
				ctx.globalAlpha = aPart;
				ctx.fillStyle = '#64748b';
				ctx.font = '800 13px Inter, system-ui, sans-serif';
				ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
				ctx.fillText('Layer 2 · Augen, Nase, Mund', mapX2 - 5, mapY0 - 22);
				ctx.globalAlpha = 1;
				for (let i = 0; i < 3; i++) {
					drawMapSlot(ctx, mapX2, mapYs[i], ms, MAPS[i].label, aPart);
					drawMapLit(ctx, mapX2, mapYs[i], ms, MAPS[i].lit, aPart, clarity, 3 + i, flick);
				}
			}

			// Dense
			drawDense(ctx, denseX, denseY, denseW, denseH, aDense);

			// Ausgabe: Ziel (4) = 100 %, Ergebnis (7) = 95 %, am
			// Anfang (5) 50:50, im Training (6) rutscht es Richtung 95 %.
			let pCat = 100, pDog = 0, hotCat = true;
			if (S.step === 5) { pCat = 50; pDog = 50; hotCat = false; }
			else if (S.step === 6) {
				const p = Math.round(trainPct(trainP));
				pCat = p; pDog = 100 - p; hotCat = pCat >= 90;
			}
			else if (S.step === 7) { pCat = 95; pDog = 5; }
			drawNeuron(ctx, nCx, H * .32, rN, 'Katze', pCat + ' %', hotCat, aOut);
			drawNeuron(ctx, nCx, H * .74, rN, 'Hund', pDog + ' %', false, aOut);

			// Loss-Panel rechts neben den Neuronen
			const pwP = 175, phP = 130;
			drawLossPanel(ctx, { px: Math.min(nCx + rN + 34, W - pwP - 8), py: (H - phP) / 2, pw: pwP, ph: phP }, S);

			// Label-Check unter dem Katzen-Neuron (Schritt 7)
			drawLabelBadge(ctx, nCx, H * .32 + rN + 44, aLabel);
		}
	});
})();

if (typeof window !== 'undefined') {
	window.KatzeKit = KatzeKit;
	window.ConvDemo = ConvDemo;
	window.FlattenDemo = FlattenDemo;
	window.PipelineDemo = PipelineDemo;
}
