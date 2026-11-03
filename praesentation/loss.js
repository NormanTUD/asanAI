// ============================================================
// LossDemo, "Loss: Wie falsch liegt das Netz?" (Folie 11)
//
// Vier Schritte. Loss ist ein Baustein wie Convolution, Flatten
// und Dense: er sagt dem Netz, wie falsch es liegt. Niedriger
// Loss = weniger falsch.
// 0 · Ein Katzenbild, Ausgabe Katze 60 % / Hund 40 %: richtige
//     Kategorie, aber unsicher → Loss ≈ 0,5.
// 1 · Katze 95 % / Hund 5 %: richtige Kategorie mit hoher
//     Wahrscheinlichkeit → Loss ≈ 0,05.
// 2 · Katze 5 % / Hund 95 %: falsche Kategorie → Loss ≈ 3,0.
// 3 · Die Loss-Kurve über das Training: eine einzige Linie, die
//     sinkt. Nicht der einzelne Wert zählt, sondern der Verlauf.
//
// Der Loss ist CCE = −ln(p_katze). Die Wahrscheinlichkeiten
// gleiten zwischen den Schritten, der Loss folgt dabei
// logarithmisch.
//
// Die Szene zeichnet in einem festen 1100×420-Raster und wird auf
// die Canvas-Größe skaliert; so bleibt das Layout auf jedem Beamer
// identisch.
// ============================================================
const LossDemo = (() => {
	'use strict';

	const VW = 1100, VH = 420;
	const FONT = 'Inter, system-ui, -apple-system, sans-serif';
	const C = {
		ink: '#0f172a', body: '#334155', muted: '#64748b',
		line: '#e2e8f0', track: '#f1f5f9', axis: '#cbd5e1',
		green: '#10b981', greenDark: '#15803d', greenSoft: '#ecfdf5', greenLine: '#a7f3d0',
		amber: '#f59e0b', amberDark: '#b45309', amberSoft: '#fffbeb', amberLine: '#fde68a',
		rose: '#f43f5e', roseDark: '#be123c', roseSoft: '#fff1f3', roseLine: '#ffd4dc'
	};

	const PLOT = { x0: 92, x1: 600, yTop: 64, yBot: 330, lmax: 0.75 };
	const START_LOSS = -Math.log(0.5);

	const ASSESS = [
		{
			cat: 0.60, dog: 0.40,
			verdict: 'richtig, aber unsicher',
			col: C.amberDark, soft: C.amberSoft, line: C.amberLine
		},
		{
			cat: 0.95, dog: 0.05,
			verdict: 'richtig und sicher',
			col: C.greenDark, soft: C.greenSoft, line: C.greenLine
		},
		{
			cat: 0.05, dog: 0.95,
			verdict: 'falsch erkannt',
			col: C.roseDark, soft: C.roseSoft, line: C.roseLine
		}
	];

	const IMG = { cat: new Image(), dog: new Image() };
	IMG.cat.src = 'cat.jpg';
	IMG.dog.src = 'dog.jpg';

	let reveal = 0;
	let trainT = 0;
	const anim = { cat: 0.5, dog: 0.5 };

	const clamp01 = t => Math.max(0, Math.min(1, t));
	const easeOut = t => 1 - Math.pow(1 - t, 3);
	const fmtLoss = v => (v >= 0.095 ? v.toFixed(1) : v.toFixed(2)).replace('.', ',');

	function label(ctx, s, x, y, o) {
		o = o || {};
		ctx.fillStyle = o.color || C.body;
		ctx.font = (o.weight || 600) + ' ' + (o.size || 14) + 'px ' + FONT;
		ctx.textAlign = o.align || 'left';
		ctx.textBaseline = o.baseline || 'middle';
		ctx.fillText(s, x, y);
	}

	function line(ctx, x1, y1, x2, y2, color, width, dash) {
		ctx.save();
		ctx.strokeStyle = color || C.line;
		ctx.lineWidth = width || 1;
		ctx.lineCap = 'round';
		if (dash) ctx.setLineDash(dash);
		ctx.beginPath();
		ctx.moveTo(x1, y1);
		ctx.lineTo(x2, y2);
		ctx.stroke();
		ctx.restore();
	}

	function bar(ctx, x, y, w, h, fill, r) {
		if (w <= 0) return;
		ctx.fillStyle = fill;
		KatzeKit.roundRect(ctx, x, y, Math.max(w, 2), h, Math.min(r || h / 2, h / 2));
		ctx.fill();
	}

	// Foto füllend in einen runden Rahmen legen (object-fit: cover).
	function drawPhoto(ctx, img, x, y, w, h, r) {
		ctx.save();
		KatzeKit.roundRect(ctx, x, y, w, h, r);
		ctx.clip();
		if (img && img.complete && img.naturalWidth) {
			const ar = img.naturalWidth / img.naturalHeight;
			const tar = w / h;
			let sw, sh, sx, sy;
			if (ar > tar) {
				sh = img.naturalHeight; sw = sh * tar;
				sx = (img.naturalWidth - sw) / 2; sy = 0;
			} else {
				sw = img.naturalWidth; sh = sw / tar;
				sx = 0; sy = (img.naturalHeight - sh) / 2;
			}
			ctx.drawImage(img, sx, sy, sw, sh, x, y, w, h);
		} else {
			ctx.fillStyle = C.track;
			ctx.fillRect(x, y, w, h);
		}
		ctx.restore();
	}

	const catColorFor = p =>
		p >= 0.8 ? C.green : p >= 0.5 ? C.amber : C.axis;
	const dogColorFor = p => p >= 0.8 ? C.rose : C.axis;

	function drawProbRow(ctx, name, p, color, y, wrong, fade, opts) {
		const L = Object.assign({
			xLabel: 285, xBar: 395, barW: 360, bh: 14, xPct: 785, size: 17
		}, opts || {});
		const neutral = color === C.axis;
		const ta = easeOut(clamp01((fade - 0.15) / 0.5));

		ctx.save();
		ctx.globalAlpha = ta;
		label(ctx, name, L.xLabel, y,
			{ size: L.size, color: wrong ? C.roseDark : C.ink, weight: 800 });
		label(ctx, Math.round(p * 100) + ' %', L.xPct, y,
			{ size: L.size + 3, color: neutral ? C.muted : color, weight: 800 });
		ctx.restore();

		bar(ctx, L.xBar, y - L.bh / 2, L.barW, L.bh, C.track, L.bh / 2);
		bar(ctx, L.xBar, y - L.bh / 2, L.barW * p, L.bh, color, L.bh / 2);
	}

	function drawVerdict(ctx, d, lossText, a) {
		if (a < 0.01) return;
		ctx.save();
		ctx.globalAlpha = a;
		const text = 'Loss ≈ ' + lossText + '  ·  ' + d.verdict;
		// Feste Pillenbreite: der Live-Wert zählt während des Übergangs
		// hoch/runter und darf die Kapsel nicht zittern lassen.
		const widthText = 'Loss ≈ 0,00  ·  ' + d.verdict;
		ctx.font = '800 15px ' + FONT;
		const pw = ctx.measureText(widthText).width + 44;
		const ph = 36, x = VW / 2 - pw / 2, y = 392 - ph / 2;
		ctx.fillStyle = d.soft;
		KatzeKit.roundRect(ctx, x, y, pw, ph, ph / 2);
		ctx.fill();
		ctx.strokeStyle = d.line;
		ctx.lineWidth = 1.2;
		ctx.stroke();
		label(ctx, text, VW / 2, 392.5,
			{ size: 15, color: d.col, weight: 800, align: 'center' });
		ctx.restore();
	}

	// ── Schritte 0–2: eine Katze, zwei Ausgaben ────────────────
	function drawAssess(ctx, step) {
		const d = ASSESS[step];
		const fade = easeOut(clamp01(reveal / 0.55));
		const loss = -Math.log(Math.max(anim.cat, 1e-9));
		const iw = 320, ih = 214;
		const ix = (VW - iw) / 2, iy = 44;

		label(ctx, 'Das Netz sieht: Katze', VW / 2, 24,
			{ size: 13, color: C.muted, weight: 800, align: 'center' });

		// Ein einziges Bild: die Katze. Darunter die beiden Ausgaben.
		ctx.fillStyle = '#fff';
		KatzeKit.roundRect(ctx, ix - 10, iy - 10, iw + 20, ih + 20, 16);
		ctx.fill();
		ctx.strokeStyle = C.line;
		ctx.lineWidth = 1.2;
		ctx.stroke();
		drawPhoto(ctx, IMG.cat, ix, iy, iw, ih, 12);

		drawProbRow(ctx, 'Katze', anim.cat, catColorFor(anim.cat), 290, false, fade);
		drawProbRow(ctx, 'Hund', anim.dog, dogColorFor(anim.dog), 342, d.dog >= 0.8, fade);

		drawVerdict(ctx, d, fmtLoss(loss),
			easeOut(clamp01((reveal - 0.35) / 0.45)));
	}

	// ── Schritt 3: 20-s-Training, Loss und Ausgabe live ────────
	const cx = tau => PLOT.x0 + tau * (PLOT.x1 - PLOT.x0);
	const plotY = loss => PLOT.yBot -
		clamp01(loss / PLOT.lmax) * (PLOT.yBot - PLOT.yTop);
	const pCatAt = tau => 0.5 + 0.45 * (1 - Math.pow(1 - tau, 3));
	const lossAt = tau => -Math.log(Math.max(pCatAt(tau), 1e-9));

	function drawTrainFrame(ctx) {
		const { x0, x1, yTop, yBot } = PLOT;
		const yStart = plotY(START_LOSS);

		line(ctx, x0, yStart, x1, yStart, '#dbe3ec', 1.5, [7, 7]);
		label(ctx, 'Start: 50 : 50', x0 + 14, yStart - 15,
			{ size: 11, color: C.muted, weight: 700 });

		line(ctx, x0, yTop, x0, yBot, C.axis, 2);
		line(ctx, x0, yBot, x1, yBot, C.axis, 2);

		ctx.fillStyle = C.axis;
		ctx.beginPath();
		ctx.moveTo(x1 + 14, yBot);
		ctx.lineTo(x1 + 2, yBot - 6);
		ctx.lineTo(x1 + 2, yBot + 6);
		ctx.closePath();
		ctx.fill();
		ctx.beginPath();
		ctx.moveTo(x0, yTop - 14);
		ctx.lineTo(x0 - 6, yTop - 2);
		ctx.lineTo(x0 + 6, yTop - 2);
		ctx.closePath();
		ctx.fill();

		label(ctx, 'Loss', x0 - 14, yTop + 4,
			{ size: 12, color: C.muted, weight: 800, align: 'right' });
		label(ctx, 'Training', (x0 + x1) / 2, yBot + 36,
			{ size: 12, color: C.muted, weight: 800, align: 'center' });
	}

	function drawDotLabel(ctx, x, y, text) {
		ctx.font = '800 12px ' + FONT;
		const tw = ctx.measureText(text).width + 20;
		let lx = x + 14;
		if (lx + tw > PLOT.x1 + 40) lx = x - tw - 14;
		let ly = y - 22;
		if (ly < PLOT.yTop + 10) ly = y + 22;
		ctx.fillStyle = '#fff';
		KatzeKit.roundRect(ctx, lx, ly - 11, tw, 22, 11);
		ctx.fill();
		ctx.strokeStyle = C.greenLine;
		ctx.lineWidth = 1.2;
		ctx.stroke();
		label(ctx, text, lx + tw / 2, ly,
			{ size: 12, color: C.greenDark, weight: 800, align: 'center' });
	}

	function drawTrainCurve(ctx, t) {
		if (t > 0.001) {
			const N = Math.max(2, Math.ceil(160 * t));
			ctx.save();
			ctx.lineJoin = 'round';
			ctx.lineCap = 'round';
			ctx.beginPath();
			for (let i = 0; i <= N; i++) {
				const tau = (i / N) * t;
				const x = cx(tau), y = plotY(lossAt(tau));
				if (i === 0) ctx.moveTo(x, y);
				else ctx.lineTo(x, y);
			}
			ctx.strokeStyle = C.green;
			ctx.lineWidth = 4.5;
			ctx.stroke();
			ctx.restore();
		}

		const ex = cx(t), ey = plotY(lossAt(t));
		ctx.fillStyle = C.green;
		ctx.beginPath();
		ctx.arc(ex, ey, 7, 0, Math.PI * 2);
		ctx.fill();
		ctx.strokeStyle = '#fff';
		ctx.lineWidth = 2.5;
		ctx.stroke();
		drawDotLabel(ctx, ex, ey, 'Loss ≈ ' + fmtLoss(lossAt(t)));
	}

	function trainStatus(p) {
		if (p < 0.6) return 'richtig, aber unsicher';
		if (p < 0.85) return 'wird sicherer';
		return 'richtig und sicher';
	}

	function drawTrainCard(ctx, img, x, y, w, name, p, color) {
		const neutral = color === C.axis;
		ctx.fillStyle = '#fff';
		KatzeKit.roundRect(ctx, x, y, w, 214, 14);
		ctx.fill();
		ctx.strokeStyle = C.line;
		ctx.lineWidth = 1.2;
		ctx.stroke();

		drawPhoto(ctx, img, x + 10, y + 10, w - 20, 100, 10);

		label(ctx, name, x + 14, y + 136,
			{ size: 15, color: C.ink, weight: 800 });
		label(ctx, Math.round(p * 100) + ' %', x + w - 14, y + 136,
			{ size: 18, color: neutral ? C.muted : color, weight: 800, align: 'right' });

		const bh = 12;
		bar(ctx, x + 14, y + 158, w - 28, bh, C.track, bh / 2);
		bar(ctx, x + 14, y + 158, (w - 28) * p, bh, color, bh / 2);
	}

	function drawTrainPanel(ctx, p) {
		const px = 636, py = 40, pw = 432, ph = 350;
		ctx.fillStyle = '#fff';
		KatzeKit.roundRect(ctx, px, py, pw, ph, 18);
		ctx.fill();
		ctx.strokeStyle = C.line;
		ctx.lineWidth = 1.2;
		ctx.stroke();

		label(ctx, 'Das Netz sieht: Katze', px + pw / 2, py + 22,
			{ size: 13, color: C.muted, weight: 800, align: 'center' });

		const cw = 180, cy = py + 40;
		drawTrainCard(ctx, IMG.cat, px + 24, cy, cw,
			'Katze', p, catColorFor(p));
		drawTrainCard(ctx, IMG.dog, px + pw - 24 - cw, cy, cw,
			'Hund', 1 - p, dogColorFor(1 - p));

		const safe = p >= 0.85;
		label(ctx, trainStatus(p), px + pw / 2, py + 300,
			{ size: 14, color: safe ? C.greenDark : C.amberDark, weight: 800, align: 'center' });
	}

	function drawTraining(ctx) {
		drawTrainFrame(ctx);
		drawTrainCurve(ctx, trainT);
		drawTrainPanel(ctx, pCatAt(trainT));
	}

	return KatzeKit.create({
		slideId: 'slide-loss',
		prefix: 'loss',
		steps: [
			{
				k: 'Schritt 1 · Richtig, aber unsicher',
				t: 'Richtig erkannt:<br>der Loss ist <em>gut</em>.',
				p: 'Katze 60 % · Hund 40 %',
				c: '<span class="kz-chip g">richtig, aber unsicher</span>',
				i: 'Der Loss sagt dem Netz, wie falsch es liegt: niedriger Loss = weniger falsch.'
			},
			{
				k: 'Schritt 2 · Richtig und sicher',
				t: 'Richtig und sicher:<br>der Loss ist <em>noch besser</em>.',
				p: 'Katze 95 % · Hund 5 %',
				c: '<span class="kz-chip g">richtig und sicher</span>'
			},
			{
				k: 'Schritt 3 · Falsche Kategorie',
				t: 'Falsch erkannt:<br>der Loss ist <em>hoch</em>.',
				p: 'Katze 5 % · Hund 95 %',
				c: '<span class="kz-chip r">falsch erkannt</span>'
			},
			{
				k: 'Schritt 4 · Training · 20 s',
				t: 'Im Training sinkt der Loss:<br>das Netz liegt <em>immer weniger falsch</em>.',
				p: 'Loss sinkt · Katze wird sicherer',
				c: '<span class="kz-chip g">Loss ↔ Wahrscheinlichkeit</span>',
				i: 'Je niedriger der Loss, desto sicherer die richtige Kategorie. Loss ist ein weiterer Baustein: Convolution, Flatten und Dense bauen das Netz, der Loss sagt beim Training, wie falsch es liegt.'
			}
		],

		layoutFor() {},

		onStep(n) {
			reveal = 0;
			if (n === 3) trainT = 0;
		},

		tick(dt, k, S) {
			reveal = Math.min(1, reveal + dt / 55);
			if (S.step === 3) {
				trainT = Math.min(1, trainT + dt / 1200);
				return;
			}
			const T = ASSESS[S.step];
			const a = Math.min(1, k * 1.3);
			anim.cat += (T.cat - anim.cat) * a;
			anim.dog += (T.dog - anim.dog) * a;
		},

		draw(ctx, S) {
			ctx.save();
			ctx.fillStyle = '#fff';
			ctx.fillRect(0, 0, S.W, S.H);
			const sc = Math.min(S.W / VW, S.H / VH);
			ctx.translate((S.W - VW * sc) / 2, (S.H - VH * sc) / 2);
			ctx.scale(sc, sc);

			if (S.step === 3) {
				drawTraining(ctx);
			} else {
				drawAssess(ctx, S.step);
			}
			ctx.restore();
		}
	});
})();

if (typeof window !== 'undefined') {
	window.LossDemo = LossDemo;
}
