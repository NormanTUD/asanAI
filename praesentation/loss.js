// ============================================================
// LossDemo, "Loss: Was kostet der Fehler?" (Folie 12)
//
// Vier Schritte, gleiche Leserichtung (links → rechts):
// 0 · Die Idee: drei Antworten auf einer linearen Loss-Achse.
//     Sicher richtig (Katze 95 % → 0,05), am Anfang (50:50 → 0,69),
//     komplett falsch (Hund 95 % statt Katze → 3,00, rund 60× höher).
//     Der blaue Trainingspfeil zeigt 0,69 → 0,05.
// 1 · MSE: eine Tabelle. Links Ziel/Antwort auf der Zahlengerade,
//     rechts die Strafe = Fehler². 0 · 1 · 9 · 25 zeigen sichtbar,
//     dass ein großer Fehler überproportional teuer wird.
// 2 · CCE: eine Tabelle. Links die Wahrscheinlichkeit für die
//     richtige Klasse (Katze), rechts der Loss. 95 % → 0,05,
//     60 % → 0,51, 5 % → 3,00: falsche Sicherheit wird riesig.
// 3 · Die Wahl: drei gleich große Karten — Zahl/MSE, Klasse/CCE,
//     Ja-Nein/BCE — mit derselben Innenstruktur.
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
		line: '#e2e8f0', rule: '#eef2f7', track: '#f1f5f9', group: '#f8fafc',
		blue: '#2563eb', blueSoft: '#eff5ff', blueLine: '#cfe0ff',
		green: '#10b981', greenDark: '#15803d', greenSoft: '#ecfdf5', greenLine: '#a7f3d0',
		amber: '#f59e0b', amberDark: '#b45309', amberSoft: '#fffbeb', amberLine: '#fde68a',
		rose: '#f43f5e', roseDark: '#be123c', roseSoft: '#fff1f3', roseLine: '#ffd4dc'
	};

	let reveal = 0;

	const clamp01 = t => Math.max(0, Math.min(1, t));
	const easeOut = t => 1 - Math.pow(1 - t, 3);
	const de = n => String(n).replace('.', ',');

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

	function panel(ctx, x, y, w, h, r) {
		ctx.fillStyle = '#fff';
		KatzeKit.roundRect(ctx, x, y, w, h, r);
		ctx.fill();
		ctx.strokeStyle = C.line;
		ctx.lineWidth = 1.2;
		ctx.stroke();
	}

	function groupPanel(ctx, x, y, w, h) {
		ctx.fillStyle = C.group;
		KatzeKit.roundRect(ctx, x, y, w, h, 14);
		ctx.fill();
	}

	function bar(ctx, x, y, w, h, r, fill) {
		if (w <= 0) return;
		ctx.fillStyle = fill;
		KatzeKit.roundRect(ctx, x, y, Math.max(w, 2), h, Math.min(r, h / 2, Math.max(w, 2) / 2));
		ctx.fill();
	}

	function pill(ctx, text, x, y, o) {
		o = o || {};
		const size = o.size || 13;
		ctx.font = (o.weight || 700) + ' ' + size + 'px ' + FONT;
		const pw = ctx.measureText(text).width + (o.padX || 24);
		const ph = o.h || 28;
		ctx.fillStyle = o.fill || C.blueSoft;
		KatzeKit.roundRect(ctx, x, y - ph / 2, pw, ph, ph / 2);
		ctx.fill();
		if (o.stroke) {
			ctx.strokeStyle = o.stroke;
			ctx.lineWidth = 1;
			ctx.stroke();
		}
		label(ctx, text, x + pw / 2, y + .5,
			{ size, color: o.color || C.blue, weight: o.weight || 700, align: 'center' });
		return pw;
	}

	function columnHeader(ctx, text, x, y, align) {
		label(ctx, text, x, y, { size: 11, color: C.muted, weight: 800, align: align || 'left' });
	}

	function legendItem(ctx, x, y, color, text) {
		ctx.fillStyle = color;
		KatzeKit.roundRect(ctx, x, y - 6, 12, 12, 3);
		ctx.fill();
		label(ctx, text, x + 19, y, { size: 11, color: C.muted, weight: 700 });
	}

	// Gemeinsamer Wahrscheinlichkeitsbalken: links die richtige
	// Klasse (blau), rechts die andere (grau). Ist ein Segment zu
	// schmal für eine Innenbeschriftung, rutscht sie darunter.
	function drawProbBar(ctx, x, y, w, h, p, left, right, size) {
		const sz = size || 12;
		ctx.save();
		KatzeKit.roundRect(ctx, x, y, w, h, h / 2);
		ctx.clip();
		ctx.fillStyle = '#e9eef5';
		ctx.fillRect(x, y, w, h);
		ctx.fillStyle = C.blue;
		ctx.fillRect(x, y, w * p, h);
		ctx.restore();
		ctx.strokeStyle = '#cfd8e3';
		ctx.lineWidth = 1;
		KatzeKit.roundRect(ctx, x + .5, y + .5, w - 1, h - 1, h / 2);
		ctx.stroke();

		const paw = w * p;
		const pctL = Math.round(p * 100);
		const pctR = 100 - pctL;
		if (paw > 60) {
			label(ctx, left + ' ' + pctL + ' %', x + paw / 2, y + h / 2,
				{ size: sz, color: '#fff', weight: 800, align: 'center' });
		} else {
			label(ctx, left + ' ' + pctL + ' %', x, y + h + 20,
				{ size: sz, color: C.blue, weight: 800 });
		}
		if (w - paw > 60) {
			label(ctx, right + ' ' + pctR + ' %', x + paw + (w - paw) / 2, y + h / 2,
				{ size: sz, color: C.body, weight: 800, align: 'center' });
		} else {
			label(ctx, right + ' ' + pctR + ' %', x + w, y + h + 20,
				{ size: sz, color: C.muted, weight: 800, align: 'right' });
		}
	}

	// ── Schritt 0: hoch → runter, und falsch → sehr hoch ────────
	function drawStepIdea(ctx) {
		const a = easeOut(clamp01(reveal));
		ctx.save();
		ctx.globalAlpha = a;

		const cards = [
			{
				x: 40, y: 50, w: 300, h: 150,
				head: 'SICHER RICHTIG', headCol: C.greenDark,
				answer: 'Katze 95 %', ansCol: C.blue,
				loss: '0,05', lossCol: C.greenDark, mark: .05, markCol: C.green
			},
			{
				x: 400, y: 50, w: 300, h: 150,
				head: 'AM ANFANG', headCol: C.amberDark,
				answer: '50 : 50', ansCol: C.ink,
				loss: '0,69', lossCol: C.amberDark, mark: .69, markCol: C.amber
			},
			{
				x: 760, y: 50, w: 300, h: 150,
				head: 'KOMPLETT FALSCH', headCol: C.roseDark,
				answer: 'Hund 95 %', ansCol: C.rose,
				loss: '3,00', lossCol: C.roseDark, mark: 3.00, markCol: C.rose
			}
		];
		const axisX = 80, axisW = 940, axisY = 300, maxLoss = 3.2;
		const lx = loss => axisX + (loss / maxLoss) * axisW;

		cards.forEach(card => {
			panel(ctx, card.x, card.y, card.w, card.h, 16);
			label(ctx, card.head, card.x + 20, card.y + 20,
				{ size: 11, color: card.headCol, weight: 800 });
			label(ctx, 'Wahrheit: Katze', card.x + 20, card.y + 42,
				{ size: 11, color: C.greenDark, weight: 700 });
			label(ctx, card.answer, card.x + 20, card.y + 76,
				{ size: 22, color: card.ansCol, weight: 800 });
			label(ctx, 'LOSS', card.x + 20, card.y + 104,
				{ size: 10, color: C.muted, weight: 800 });
			label(ctx, card.loss, card.x + 20, card.y + 128,
				{ size: 26, color: card.lossCol, weight: 800 });
			// Führungslinie vom Kartenboden zum Punkt auf der Loss-Achse.
			ctx.save();
			ctx.globalAlpha = .35;
			line(ctx, card.x + card.w / 2, card.y + card.h, lx(card.mark), axisY,
				card.markCol, 1.5, [4, 4]);
			ctx.restore();
		});

		// Loss-Achse (linear 0 … 3,2): 0,05 und 0,69 liegen links,
		// 3,00 ganz rechts — der Abstand ist der Punkt.
		line(ctx, axisX, axisY, axisX + axisW, axisY, '#cbd5e1', 2);
		[0, 1, 2, 3].forEach(v => {
			const x = lx(v);
			line(ctx, x, axisY - 6, x, axisY + 6, '#cbd5e1', 1.5);
			label(ctx, String(v), x, axisY + 22,
				{ size: 11, color: C.muted, weight: 700, align: 'center' });
		});
		label(ctx, 'Loss', axisX - 10, axisY,
			{ size: 12, color: C.muted, weight: 800, align: 'right' });

		// Training: 0,69 → 0,05 (Pfeil nach links).
		const fromX = lx(.69), toX = lx(.05);
		line(ctx, fromX, axisY, toX + 10, axisY, C.blue, 4);
		ctx.fillStyle = C.blue;
		ctx.beginPath();
		ctx.moveTo(toX, axisY);
		ctx.lineTo(toX + 12, axisY - 6);
		ctx.lineTo(toX + 12, axisY + 6);
		ctx.closePath();
		ctx.fill();
		label(ctx, 'Training: Loss sinkt', (fromX + toX) / 2, axisY - 20,
			{ size: 12, color: C.blue, weight: 800, align: 'center' });

		// Marker auf der Achse (über dem Trainingspfeil).
		cards.forEach(card => {
			ctx.fillStyle = card.markCol;
			ctx.beginPath();
			ctx.arc(lx(card.mark), axisY, 7, 0, Math.PI * 2);
			ctx.fill();
			ctx.strokeStyle = '#fff';
			ctx.lineWidth = 2;
			ctx.stroke();
		});

		// Der falsche Fall ist nicht nur etwas schlechter, sondern
		// rund 60× so teuer wie der sichere Treffer.
		label(ctx, 'rund 60× höher als 0,05', lx(3), axisY + 50,
			{ size: 11, color: C.roseDark, weight: 800, align: 'center' });

		ctx.restore();
	}

	// ── Schritt 1: MSE als Tabelle ──────────────────────────────
	function drawStepMSE(ctx) {
		const x0 = 40, x1 = 470, rangeMax = 12;
		const X = v => x0 + (v / rangeMax) * (x1 - x0);
		const target = 10, targetX = X(target);
		const barX = 600, barMaxW = 420, maxBar = 25;
		const rows = [
			{ y: 105, pred: 10, err: 0, bar: 0, tag: 'getroffen',
			  col: C.greenDark, barCol: C.green },
			{ y: 185, pred: 9, err: 1, bar: 1, tag: '1 daneben',
			  col: C.blue, barCol: C.blue },
			{ y: 265, pred: 7, err: 3, bar: 9, tag: '3 daneben',
			  col: C.amberDark, barCol: C.amber },
			{ y: 345, pred: 5, err: 5, bar: 25, tag: '5 daneben',
			  col: C.roseDark, barCol: C.rose }
		];

		groupPanel(ctx, 580, 62, 480, 330);
		columnHeader(ctx, 'ABSTAND ZUM ZIEL (10)', x0, 42);
		columnHeader(ctx, 'STRAFE = FEHLER²', barX, 42);
		[65, 145, 225, 305, 385].forEach(y =>
			line(ctx, 40, y, 1060, y, C.rule, 1));

		rows.forEach((row, i) => {
			const a = easeOut(clamp01((reveal - i * .1) / .62));
			if (a < .01) return;
			ctx.save();
			ctx.globalAlpha = a;

			const y = row.y;
			line(ctx, x0, y, x1, y, C.line, 2.5);
			// Ziel
			line(ctx, targetX, y - 18, targetX, y + 18, C.green, 3);
			ctx.fillStyle = C.green;
			ctx.beginPath();
			ctx.arc(targetX, y, 6, 0, Math.PI * 2);
			ctx.fill();
			label(ctx, 'Ziel 10', targetX, y - 28,
				{ size: 11, color: C.greenDark, weight: 800, align: 'center' });

			// Antwort
			const px = X(row.pred);
			if (row.err > 0) {
				line(ctx, px, y, targetX, y, C.rose, 5);
				label(ctx, String(row.err), (px + targetX) / 2, y + 18,
					{ size: 13, color: C.roseDark, weight: 800, align: 'center' });
			}
			ctx.fillStyle = row.err === 0 ? C.green : C.blue;
			ctx.beginPath();
			ctx.arc(px, y, 6.5, 0, Math.PI * 2);
			ctx.fill();
			ctx.strokeStyle = '#fff';
			ctx.lineWidth = 2;
			ctx.stroke();

			label(ctx, row.err === 0 ? 'Ziel = Antwort' : 'Antwort ' + row.pred,
				x0, y + 24, { size: 12, color: row.err === 0 ? C.greenDark : C.blue, weight: 800 });
			label(ctx, row.tag, x1, y + 24,
				{ size: 12, color: row.col, weight: 800, align: 'right' });

			// Strafe
			bar(ctx, barX, y - 14, barMaxW, 28, 14, C.track);
			const bw = row.bar / maxBar * barMaxW;
			if (row.bar > 0) {
				bar(ctx, barX, y - 14, Math.max(bw, 3), 28, 14, row.barCol);
			} else {
				ctx.strokeStyle = C.green;
				ctx.lineWidth = 2;
				KatzeKit.roundRect(ctx, barX + .5, y - 13.5, barMaxW - 1, 27, 13.5);
				ctx.stroke();
			}
			label(ctx, 'Strafe ' + row.bar, barX + barMaxW, y - 28,
				{ size: 13, color: row.col, weight: 800, align: 'right' });

			ctx.restore();
		});

		label(ctx, 'MSE = Mean Squared Error', 40, 407,
			{ size: 12, color: C.muted, weight: 700 });
	}

	// ── Schritt 2: CCE als Tabelle ──────────────────────────────
	function drawStepCCE(ctx) {
		const x0 = 40, x1 = 470, probW = 430;
		const barX = 600, barMaxW = 420, maxLoss = 3.2;
		const rows = [
			{ y: 125, p: .95, loss: .05, tag: 'sicher richtig',
			  col: C.greenDark, barCol: C.green,
			  fill: C.greenSoft, stroke: C.greenLine },
			{ y: 225, p: .60, loss: .51, tag: 'unsicher',
			  col: C.amberDark, barCol: C.amber,
			  fill: C.amberSoft, stroke: C.amberLine },
			{ y: 325, p: .05, loss: 3.00, tag: 'sicher falsch',
			  col: C.roseDark, barCol: C.rose,
			  fill: C.roseSoft, stroke: C.roseLine }
		];

		groupPanel(ctx, 580, 62, 480, 330);
		columnHeader(ctx, 'WAS DAS NETZ SAGT', x0, 38);
		columnHeader(ctx, 'LOSS', barX, 38);
		legendItem(ctx, x0, 64, C.blue, 'Katze (richtig)');
		legendItem(ctx, x0 + 170, 64, '#cfd8e3', 'Hund');
		[171, 271, 371].forEach(y =>
			line(ctx, 40, y, 1060, y, C.rule, 1));

		rows.forEach((row, i) => {
			const a = easeOut(clamp01((reveal - i * .12) / .62));
			if (a < .01) return;
			ctx.save();
			ctx.globalAlpha = a;

			const y = row.y;
			label(ctx, 'Wahrheit: Katze', x0, y - 38,
				{ size: 12, color: C.greenDark, weight: 800 });
			label(ctx, row.tag, x1, y - 38,
				{ size: 12, color: row.col, weight: 800, align: 'right' });

			drawProbBar(ctx, x0, y - 15, probW, 30, row.p, 'Katze', 'Hund', 13);

			bar(ctx, barX, y - 14, barMaxW, 28, 14, C.track);
			const bw = row.loss / maxLoss * barMaxW;
			bar(ctx, barX, y - 14, Math.max(bw, 3), 28, 14, row.barCol);
			const pillX = Math.min(barX + bw + 10, barX + barMaxW + 4);
			pill(ctx, de(row.loss.toFixed(2)), pillX, y,
				{ fill: row.fill, color: row.col, stroke: row.stroke, size: 15, padX: 16, h: 30 });

			ctx.restore();
		});

		label(ctx, 'CCE = Categorical Cross Entropy', 40, 407,
			{ size: 12, color: C.muted, weight: 700 });
	}

	// ── Schritt 3: Aufgabe → Loss ───────────────────────────────
	function drawMiniMSE(ctx, x, y, a) {
		ctx.save();
		ctx.globalAlpha = a;
		const x1 = x + 250;
		line(ctx, x, y, x1, y, C.line, 2.5);
		const tx = x + 210, px = x + 150;
		line(ctx, tx, y - 17, tx, y + 17, C.green, 3);
		ctx.fillStyle = C.green;
		ctx.beginPath(); ctx.arc(tx, y, 5, 0, Math.PI * 2); ctx.fill();
		line(ctx, px, y, tx, y, C.rose, 4);
		ctx.fillStyle = C.blue;
		ctx.beginPath(); ctx.arc(px, y, 5, 0, Math.PI * 2); ctx.fill();
		bar(ctx, x, y + 30, 250, 12, 6, C.track);
		bar(ctx, x, y + 30, 250 * (9 / 25), 12, 6, C.rose);
		label(ctx, '10', tx, y + 48, { size: 11, color: C.greenDark, weight: 800, align: 'center' });
		label(ctx, '7', px, y + 48, { size: 11, color: C.blue, weight: 800, align: 'center' });
		ctx.restore();
	}

	function drawMiniCCE(ctx, x, y, a) {
		ctx.save();
		ctx.globalAlpha = a;
		const w = 250;
		ctx.save();
		KatzeKit.roundRect(ctx, x, y - 12, w, 24, 12);
		ctx.clip();
		ctx.fillStyle = '#e9eef5';
		ctx.fillRect(x, y - 12, w, 24);
		ctx.fillStyle = C.blue;
		ctx.fillRect(x, y - 12, w * .6, 24);
		ctx.restore();
		ctx.strokeStyle = '#cfd8e3';
		ctx.lineWidth = 1;
		KatzeKit.roundRect(ctx, x + .5, y - 11.5, w - 1, 23, 11.5);
		ctx.stroke();
		label(ctx, 'Katze 60 %', x + w * .3, y,
			{ size: 11, color: '#fff', weight: 800, align: 'center' });
		label(ctx, 'Hund 40 %', x + w * .8, y,
			{ size: 11, color: C.body, weight: 800, align: 'center' });
		bar(ctx, x, y + 30, w, 12, 6, C.track);
		bar(ctx, x, y + 30, w * (.51 / 3.2), 12, 6, C.amber);
		label(ctx, '0,51', x + w * (.51 / 3.2) + 7, y + 36,
			{ size: 11, color: C.amberDark, weight: 800 });
		ctx.restore();
	}

	function drawMiniBCE(ctx, x, y, a) {
		ctx.save();
		ctx.globalAlpha = a;
		const w = 250, h = 30, p = .65;
		ctx.save();
		KatzeKit.roundRect(ctx, x, y - h / 2, w, h, h / 2);
		ctx.clip();
		ctx.fillStyle = '#e9eef5';
		ctx.fillRect(x, y - h / 2, w, h);
		ctx.fillStyle = C.blue;
		ctx.fillRect(x, y - h / 2, w * p, h);
		ctx.restore();
		ctx.strokeStyle = '#cfd8e3';
		ctx.lineWidth = 1;
		KatzeKit.roundRect(ctx, x + .5, y - h / 2 + .5, w - 1, h - 1, h / 2);
		ctx.stroke();
		ctx.fillStyle = '#fff';
		ctx.beginPath();
		ctx.arc(x + w * p, y, 11, 0, Math.PI * 2);
		ctx.fill();
		ctx.strokeStyle = C.blue;
		ctx.lineWidth = 2;
		ctx.stroke();
		label(ctx, 'JA', x + w * .32, y, { size: 11, color: '#fff', weight: 800, align: 'center' });
		label(ctx, 'NEIN', x + w * .86, y, { size: 11, color: C.body, weight: 800, align: 'center' });
		bar(ctx, x, y + 30, w, 12, 6, C.track);
		bar(ctx, x, y + 30, w * p, 12, 6, C.amber);
		label(ctx, '0,43', x + w * p + 7, y + 36,
			{ size: 11, color: C.amberDark, weight: 800 });
		ctx.restore();
	}

	function drawStepChoice(ctx) {
		const cards = [
			{
				x: 40, accent: C.blue, title: 'Zahl vorhersagen', loss: 'MSE',
				rule: 'bestraft den Abstand', examples: 'Preis · Temperatur · Alter',
				mini: drawMiniMSE
			},
			{
				x: 390, accent: C.green, title: 'Klasse wählen', loss: 'CCE',
				rule: 'bestraft falsche Sicherheit', examples: 'Katze/Hund · Auto/Flugzeug',
				mini: drawMiniCCE
			},
			{
				x: 740, accent: C.amber, title: 'Ja / Nein entscheiden', loss: 'BCE',
				rule: 'bestraft falsche Sicherheit', examples: 'Spam? · krank?',
				mini: drawMiniBCE
			}
		];

		cards.forEach((card, i) => {
			const a = easeOut(clamp01((reveal - i * .12) / .62));
			if (a < .01) return;
			ctx.save();
			ctx.globalAlpha = a;
			ctx.translate(0, (1 - a) * 14);

			const y = 52, w = 320, h = 320;
			panel(ctx, card.x, y, w, h, 18);
			bar(ctx, card.x + 24, y + 18, 48, 6, 3, card.accent);

			columnHeader(ctx, 'AUFGABE', card.x + 24, y + 42);
			label(ctx, card.title, card.x + 24, y + 68,
				{ size: 20, color: C.ink, weight: 800 });

			card.mini(ctx, card.x + 24, y + 120, a);

			line(ctx, card.x + 24, y + 190, card.x + 24, y + 205, C.line, 2);
			pill(ctx, card.loss, card.x + 24, y + 222,
				{ fill: C.blueSoft, color: C.blue, stroke: C.blueLine, size: 16, padX: 24, h: 34 });
			label(ctx, card.rule, card.x + 24, y + 260,
				{ size: 14, color: C.roseDark, weight: 800 });
			label(ctx, card.examples, card.x + 24, y + 288,
				{ size: 11, color: C.muted, weight: 600 });

			ctx.restore();
		});
	}

	return KatzeKit.create({
		slideId: 'slide-loss',
		prefix: 'loss',
		steps: [
			{
				k: 'Schritt 1 · Die Idee',
				t: 'Loss ist die <em>Strafe</em><br>für eine falsche Antwort.',
				p: 'Richtig <b>0,05</b> · Anfang <b>0,69</b> · Hund statt Katze <b>3,00</b>',
				c: '<span class="kz-chip">richtig 0,05</span><span class="kz-arrow">·</span><span class="kz-chip r">falsch 3,00</span>'
			},
			{
				k: 'Schritt 2 · MSE',
				t: 'Bei Zahlen wird der Abstand<br><em>quadriert</em>.',
				p: 'Klein daneben: <b>1</b> · weit daneben: <b>25</b>',
				c: '<span class="kz-chip">MSE</span>'
			},
			{
				k: 'Schritt 3 · CCE',
				t: 'Bei Klassen wird <em>falsche<br>Sicherheit</em> bestraft.',
				p: 'Richtig 95 %: <b>0,05</b> · falsch 5 %: <b>3,00</b>',
				c: '<span class="kz-chip">CCE</span>'
			},
			{
				k: 'Schritt 4 · Die Wahl',
				t: 'Die Aufgabe entscheidet,<br>welcher Loss <em>passt</em>.',
				p: 'Zahl → MSE · Klasse → CCE · Ja/Nein → BCE',
				c: '<span class="kz-chip g">Aufgabe → Loss</span>',
				i: 'Der Loss passt zur Aufgabe: Zahlen brauchen einen Abstand, Klassen eine Strafe für falsche Sicherheit.'
			}
		],

		layoutFor(step, S) {
			S.inst.forEach(o => { o.ta = 0; o.a = 0; });
		},

		onStep() {
			reveal = 0;
		},

		tick(dt) {
			reveal = Math.min(1, reveal + dt / 42);
		},

		draw(ctx, S) {
			ctx.save();
			ctx.fillStyle = '#fff';
			ctx.fillRect(0, 0, S.W, S.H);
			const sc = Math.min(S.W / VW, S.H / VH);
			ctx.translate((S.W - VW * sc) / 2, (S.H - VH * sc) / 2);
			ctx.scale(sc, sc);
			if (S.step === 0) drawStepIdea(ctx);
			else if (S.step === 1) drawStepMSE(ctx);
			else if (S.step === 2) drawStepCCE(ctx);
			else drawStepChoice(ctx);
			ctx.restore();
		}
	});
})();

if (typeof window !== 'undefined') {
	window.LossDemo = LossDemo;
}
