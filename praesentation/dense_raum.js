// ============================================================
// DenseRaum, "Vom Bild zu Punkten" (dense_raum.js)
//
// 5 Schritte über die Pfeiltasten:
//   0: Panel — die Katze zerfällt nach den Convolutions in
//      1024 Zahlen (wie in der Flatten-Folie weitergedacht)
//   1: Aus Zahlen werden Punkte — jedes Bild ist EIN Punkt im
//      1024-dim. Raum (wir sehen nur einen 2D-Schatten): zwei
//      Klassen (Katze/Hund) als ein LÄNGLICHER Haufen mit Overlap,
//      wie PCA über 1000 Bildern (kein sauberes XOR mehr).
//   2: Der Layer wölbt den Raum — die WELLE der Grenze wird durch
//      das Wölben gerade (z = y − b(x)); eine Ebene kann trennen.
//   3: Eine Ebene (z = 0) passt dazwischen.
//   4: Rückprojektion auf eine Linie — links Hund, rechts Katze;
//      "unser Bild" (Mini-Katze) landet auf der Katze-Seite,
//      daneben ein Beispiel-Hund (Mini-Hund).
//
// Dem Netz ist es egal, ob Ei-Form oder Katze: Es sind Zahlen,
// und Zahlen sind Punkte.
// ============================================================
const DenseRaum = (() => {
	'use strict';

	const K = KatzeKit;
	const ease = t => t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;

	function mulberry32(a) {
		return function () {
			a |= 0; a = a + 0x6D2B79F5 | 0;
			let t = Math.imul(a ^ a >>> 15, 1 | a);
			t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
			return ((t ^ t >>> 14) >>> 0) / 4294967296;
		};
	}

	// Die "komplexe" Entscheidungsgrenze: eine Welle b(x). In der
	// flachen 2D-Ansicht trennt sie Katze (unterhalb) von Hund
	// (oberhalb) — aber keine GERADE folgt ihr. Die Schicht "lernt"
	// genau diese Welle und wölbt den Raum: z = y − b(x). Nach dem
	// Wölben liegt die Grenze auf der flachen Ebene z = 0 — alle
	// Hunde drüber, alle Katzen drunter.
	const BOUND = x => 0.45 * Math.sin(2.1 * x);
	const warp = (x, y) => (y - BOUND(x));
	const AMP = 1.0;

	// Punkte: länglicher Haufen. Hunde (c=1, rot) oben, Katzen
	// (c=0, grün) unten, mit Overlap in der Mitte (die Klasse folgt
	// der Wellenlinie). "Unser Bild" (img) ist ein Katze-Punkt,
	// "Beispiel-Hund" (imgDog) ein Hund-Punkt.
	const PTS = [];
	{
		const rnd = mulberry32(20240615);
		const PER = 92;
		for (let i = 0; i < PER * 2; i++) {
			const x = (rnd() * 2 - 1) * 1.05;
			const y = (rnd() * 2 - 1) * 0.72;
			PTS.push({ x, y, c: y > BOUND(x) ? 1 : 0 });
		}
		// "Unser Bild": klarer Katze-Punkt (unterhalb der Grenze).
		PTS.push({ x: 0.30, y: -0.52, c: 0, img: true });
		// Beispiel-Hund: klarer Hund-Punkt (oberhalb der Grenze).
		PTS.push({ x: -0.55, y: 0.58, c: 1, imgDog: true });
	}

	// ---------- Animationszustand ----------
	let panelA = 0, ptsA = 0, lift = 0, planeA = 0, projA = 0, axisA = 0;
	let cpT = 0, ptsT = 0;

	// Panel (Zahlen-Flug), wie zuvor
	const CP_W = 448, CP_H = 232;
	const CP_CELL = 4.25;
	const CP_S = 32 * CP_CELL;
	const CP_FLY = 640;
	const CP_DISS_A = 450, CP_DISS_B = 3050;
	const SLOTS = 72, PERCOL = 8;
	let cpSpawned = 0;
	const cpBorn = [], cpFrom = [];

	// ---------- Geometrie: fixe schräge Kamera, kein Drag ----------
	const G = { SX: 0, SY: 0, SZ: 0, CX: 0, CY: 0, AY: 0, AXL: 0, AXR: 0 };
	function layoutFor(step, S) {
		G.SX = Math.min(250, S.W * 0.21, S.H * 0.58);
		G.SY = G.SX * 0.42;
		G.SZ = G.SX * 0.50;
		G.CX = S.W * 0.5;
		G.CY = S.H * 0.45;
		G.AY = S.H - 38;
		G.AXL = S.W * 0.20;
		G.AXR = S.W * 0.80;
	}
	const proj3 = (x, y, z) => ({ X: G.CX + x * G.SX, Y: G.CY + y * G.SY - z * G.SZ });
	// Score auf der Achse: Katze (z<0) → rechts, Hund (z>0) → links.
	const scoreOf = p => BOUND(p.x) - p.y;
	const SEXT = 1.25;
	const axisX = s => {
		const t = Math.max(-SEXT, Math.min(SEXT, s)) / SEXT;   // −1..1
		return G.AXL + (G.AXR - G.AXL) * (t + 1) / 2;
	};

	function panelGeom(S) {
		const sc = Math.min(1, (S.W - 80) / CP_W, (S.H - 30) / CP_H);
		const px = (S.W - CP_W * sc) / 2, py = (S.H - CP_H * sc) / 2 - 8;
		// Dense-Box-Mitte im Stage-Koordinatensystem (Start der Punkte)
		const bx = (4 + CP_S + 44) + 44, bw = 214, bh = 136;
		const by = 34;
		return {
			px, py, sc,
			bxc: px + (bx + bw / 2) * sc,
			byc: py + (by + bh / 2) * sc
		};
	}

	function drawLabel(ctx, x, y, text, color, a, align) {
		if (a <= 0.01) return;
		ctx.globalAlpha = a;
		ctx.font = '700 13px system-ui,sans-serif';
		ctx.textAlign = align || 'left';
		ctx.textBaseline = 'middle';
		ctx.lineWidth = 3.5; ctx.strokeStyle = 'rgba(255,255,255,0.9)';
		ctx.strokeText(text, x, y);
		ctx.fillStyle = color;
		ctx.fillText(text, x, y);
		ctx.globalAlpha = 1;
	}

	// ---------- Schritt 0: Katze → 1024 Zahlen (Panel) ----------
	function drawPanel(ctx, S, a, pg) {
		const N = K.N, TOTAL = N * N;
		const cx = 4, cy = 34;
		const dx = cx + CP_S + 44;
		const bx = dx + 44, by = cy, bw = 214, bh = 136;

		const front = Math.floor(
			Math.max(0, Math.min(1, (cpT - CP_DISS_A) / (CP_DISS_B - CP_DISS_A))) * TOTAL);
		while (cpSpawned < SLOTS && front >= Math.floor(cpSpawned * TOTAL / SLOTS)) {
			const k = cpSpawned++, ci = Math.floor(k * TOTAL / SLOTS);
			const r = (ci / N) | 0, c = ci % N;
			cpFrom[k] = { x: cx + c * CP_CELL + CP_CELL / 2, y: cy + r * CP_CELL + CP_CELL / 2 };
			cpBorn[k] = cpT;
		}

		ctx.save();
		ctx.translate(pg.px, pg.py); ctx.scale(pg.sc, pg.sc);
		ctx.globalAlpha = a;
		ctx.fillStyle = '#ffffff'; ctx.strokeStyle = '#e2e8f0'; ctx.lineWidth = 1;
		K.roundRect(ctx, 0, 0, CP_W, CP_H, 14); ctx.fill(); ctx.stroke();

		ctx.textBaseline = 'alphabetic'; ctx.textAlign = 'left';
		ctx.fillStyle = '#0f172a'; ctx.font = '700 13px system-ui,sans-serif';
		ctx.fillText('Nach den Convolutions', 16, 24);
		ctx.fillStyle = '#334155'; ctx.font = '700 12px system-ui,sans-serif';
		ctx.fillText('Dense Layer', bx, 24);

		for (let i = 0; i < TOTAL; i++) {
			const r = (i / N) | 0, c = i % N;
			const x = cx + c * CP_CELL, y = cy + r * CP_CELL;
			const col = K.RGB[i];
			ctx.fillStyle = 'rgb(' + col[0] + ',' + col[1] + ',' + col[2] + ')';
			ctx.fillRect(x, y, CP_CELL + 0.6, CP_CELL + 0.6);
			if (i < front) {
				ctx.fillStyle = 'rgba(255,255,255,.80)';
				ctx.fillRect(x, y, CP_CELL + 0.6, CP_CELL + 0.6);
			}
		}
		ctx.strokeStyle = '#cbd5e1'; ctx.lineWidth = 1;
		ctx.strokeRect(cx + .5, cy + .5, CP_S - 1, CP_S - 1);

		ctx.save(); ctx.setLineDash([6, 6]);
		ctx.strokeStyle = '#94a3b8'; ctx.lineWidth = 1.4;
		ctx.beginPath(); ctx.moveTo(dx, cy - 8); ctx.lineTo(dx, cy + CP_S + 8); ctx.stroke();
		ctx.restore();

		ctx.fillStyle = '#f8fafc'; ctx.strokeStyle = '#cbd5e1';
		K.roundRect(ctx, bx, by, bw, bh, 6); ctx.fill(); ctx.stroke();

		ctx.font = '10px ui-monospace,SFMono-Regular,Menlo,monospace';
		ctx.textBaseline = 'middle';
		for (let k = 0; k < cpSpawned; k++) {
			const sx0 = bx + 10 + (k % PERCOL) * 24, sy0 = by + 12 + ((k / PERCOL) | 0) * 13;
			const v = K.GREEN[Math.floor(k * TOTAL / SLOTS)];
			const g = 40 + Math.round(v * 0.55);
			const col = 'rgb(' + g + ',' + g + ',' + g + ')';
			const age = cpT - cpBorn[k];
			if (age >= CP_FLY) {
				ctx.textAlign = 'left'; ctx.fillStyle = col;
				ctx.fillText(String(v), sx0, sy0);
			} else {
				const t = age / CP_FLY, e = ease(t);
				const f = cpFrom[k];
				const x = K.lerp(f.x, sx0, e), y = K.lerp(f.y, sy0, e) - Math.sin(Math.PI * t) * 22;
				ctx.globalAlpha = a * (t < 0.15 ? t / 0.15 : (t > 0.8 ? (1 - t) / 0.2 : 1));
				ctx.textAlign = 'center'; ctx.fillStyle = col;
				ctx.fillText(String(v), x, y);
				ctx.globalAlpha = a;
			}
		}

		ctx.textAlign = 'center'; ctx.fillStyle = '#64748b';
		ctx.font = '600 11px system-ui,sans-serif'; ctx.textBaseline = 'alphabetic';
		ctx.fillText('Bild', cx + CP_S / 2, cy + CP_S + 20);
		ctx.fillText('Trennung', dx, cy + CP_S + 20);
		ctx.fillText('1024 Zahlen', bx + bw / 2, by + bh + 20);
		ctx.textAlign = 'left'; ctx.fillStyle = '#94a3b8'; ctx.font = '11px system-ui,sans-serif';
		ctx.fillText('Die Bildstruktur bleibt links — der Dense Layer sieht nur noch Zahlen.',
			16, CP_H - 16);

		ctx.globalAlpha = 1;
		ctx.restore();
	}

	// ---------- Schritte 1–4: Punkte, Wölbung, Ebene, Achse ----------
	function drawScene(ctx, S, pg) {
		// Feines Gitter auf der (mit lift) gewölbten Fläche
		const gridA = ptsA * (1 - projA * 0.8);
		if (gridA > 0.01) {
			const GN = 18, EX = 1.15;
			ctx.lineWidth = 1;
			ctx.strokeStyle = 'rgba(148,163,184,' + (0.5 * gridA).toFixed(3) + ')';
			for (let i = 0; i <= GN; i++) {
				const u = -EX + 2 * EX * i / GN;
				for (const along of [0, 1]) {
					ctx.beginPath();
					for (let j = 0; j <= GN; j++) {
						const v = -EX + 2 * EX * j / GN;
						const x = along ? v : u, y = along ? u : v;
						const p = proj3(x, y, AMP * lift * warp(x, y));
						if (j === 0) ctx.moveTo(p.X, p.Y); else ctx.lineTo(p.X, p.Y);
					}
					ctx.stroke();
				}
			}
		}

		// Trennung bei z = 0 — in dieser Ansicht reicht eine Linie
		// (die Mitte), keine große Ebene über alles.
		if (planeA > 0.01) {
			const a = proj3(-1.15, 0, 0), b = proj3(1.15, 0, 0);
			ctx.globalAlpha = planeA;
			ctx.strokeStyle = '#d97706'; ctx.lineWidth = 2;
			ctx.beginPath(); ctx.moveTo(a.X, a.Y); ctx.lineTo(b.X, b.Y); ctx.stroke();
			ctx.globalAlpha = 1;
		}

		if (axisA > 0.01) drawAxis(ctx);

		// Punkte, fern (kleines y) → nah (großes y)
		const order = PTS.map((p, i) => i).sort((a, b) => PTS[a].y - PTS[b].y);
		for (const i of order) drawPoint(ctx, pg, i);

		// Legende oben links
		const legA = ptsA * (1 - projA);
		if (legA > 0.02) {
			ctx.globalAlpha = legA;
			ctx.fillStyle = '#15803d';
			ctx.beginPath(); ctx.arc(28, 28, 6, 0, 6.2832); ctx.fill();
			ctx.fillStyle = '#e11d48';
			ctx.beginPath(); ctx.arc(28, 52, 6, 0, 6.2832); ctx.fill();
			ctx.globalAlpha = 1;
			drawLabel(ctx, 42, 28, 'Katze', '#15803d', legA);
			drawLabel(ctx, 42, 52, 'Hund', '#e11d48', legA);
		}
	}

	function drawAxis(ctx) {
		const x0 = axisX(0);
		ctx.globalAlpha = axisA;
		ctx.strokeStyle = '#475569'; ctx.lineWidth = 1.5;
		ctx.beginPath(); ctx.moveTo(G.AXL - 30, G.AY); ctx.lineTo(G.AXR + 30, G.AY); ctx.stroke();
		ctx.fillStyle = '#475569';
		ctx.beginPath();
		ctx.moveTo(G.AXR + 30, G.AY); ctx.lineTo(G.AXR + 20, G.AY - 5); ctx.lineTo(G.AXR + 20, G.AY + 5);
		ctx.closePath(); ctx.fill();
		ctx.beginPath();
		ctx.moveTo(G.AXL - 30, G.AY); ctx.lineTo(G.AXL - 20, G.AY - 5); ctx.lineTo(G.AXL - 20, G.AY + 5);
		ctx.closePath(); ctx.fill();

		// Mitte: 0-Lücke
		ctx.setLineDash([3, 5]);
		ctx.strokeStyle = '#94a3b8'; ctx.lineWidth = 1;
		ctx.beginPath(); ctx.moveTo(x0, G.AY - 30); ctx.lineTo(x0, G.AY + 8); ctx.stroke();
		ctx.setLineDash([]);

		drawLabel(ctx, G.AXL - 10, G.AY + 22, 'Hund', '#e11d48', axisA, 'left');
		drawLabel(ctx, G.AXR + 10, G.AY + 22, 'Katze', '#15803d', axisA, 'left');
		drawLabel(ctx, x0, G.AY + 22, '0', '#64748b', axisA, 'center');
		ctx.globalAlpha = axisA * 0.9;
		ctx.font = 'italic 600 14px Georgia'; ctx.fillStyle = '#64748b';
		ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
		ctx.fillText('Score (nach der Schicht)', G.AXR + 150, G.AY - 14);
		ctx.globalAlpha = 1;
	}

	function drawPoint(ctx, pg, i) {
		const p = PTS[i];
		const t = Math.max(0, Math.min(1, (ptsT - i * 14) / 480));
		if (t <= 0) return;
		const e = ease(t);
		const z = AMP * lift * warp(p.x, p.y);
		const p3 = proj3(p.x, p.y, z);
		let X = K.lerp(pg.bxc, p3.X, e);
		let Y = K.lerp(pg.byc, p3.Y, e);
		if (projA > 0.001) {
			const tp = ease(projA);
			X = K.lerp(X, axisX(scoreOf(p)), tp);
			Y = K.lerp(Y, G.AY, tp) - Math.sin(Math.PI * tp) * 44;
		}
		const a = Math.min(1, t * 1.5);

		if (p.img || p.imgDog) {
			// Beispiel-Punkt: Mini-Bild im Ring (Katze = "unser Bild",
			// Hund = Beispiel). Nach der Projektion als Punkt gezeichnet.
			if (projA > 0.5) {
				ctx.globalAlpha = a;
				const dot = p.img ? '#15803d' : '#e11d48';
				ctx.fillStyle = dot; ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 1.5;
				ctx.beginPath(); ctx.arc(X, Y, 7, 0, 6.2832); ctx.fill(); ctx.stroke();
				drawLabel(ctx, X + 12, Y - 8, p.img ? 'unser Bild' : 'Hund', dot, a * (1 - projA * 0.3));
				ctx.globalAlpha = 1;
				return;
			}
			const s = 22 * e;
			const cat = !p.imgDog;
			ctx.globalAlpha = a;
			ctx.fillStyle = '#ffffff';
			ctx.strokeStyle = cat ? '#15803d' : '#e11d48'; ctx.lineWidth = 2;
			K.roundRect(ctx, X - s / 2, Y - s / 2, s, s, 3);
			ctx.fill(); ctx.stroke();
			const cs = s / 32;
			const RGB = cat ? K.RGB : K.HUND_RGB;
			for (let r = 0; r < 32; r++) {
				for (let c = 0; c < 32; c++) {
					const col = RGB[r * 32 + c];
					ctx.fillStyle = 'rgb(' + col[0] + ',' + col[1] + ',' + col[2] + ')';
					ctx.fillRect(X - s / 2 + c * cs, Y - s / 2 + r * cs, cs + 0.3, cs + 0.3);
				}
			}
			ctx.globalAlpha = 1;
			drawLabel(ctx, X + s / 2 + 8, Y - s / 2 + 2, cat ? 'unser Bild' : 'Hund', cat ? '#15803d' : '#e11d48',
				a * (1 - projA * 0.35));
			return;
		}

		ctx.globalAlpha = a;
		ctx.fillStyle = p.c === 0 ? '#15803d' : '#e11d48';
		ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 1;
		ctx.beginPath(); ctx.arc(X, Y, 4 * e, 0, 6.2832); ctx.fill(); ctx.stroke();
		ctx.globalAlpha = 1;
	}

	return KatzeKit.create({
		slideId: 'slide-dense-raum',
		prefix: 'dr',
		steps: [
			{ k: 'Schritt 1', t: 'Ein Bild ist schon<br><em>Zahlen</em>.',
			  p: 'Dense Layer: <b>1024</b> Zahlen',
			  c: '<span class="kz-chip g">Bild 32×32</span><span class="kz-arrow">→</span><span class="kz-chip r">1024 Zahlen</span>' },
			{ k: 'Schritt 2', t: 'Aus Zahlen werden<br><em>Punkte</em>.',
			  p: 'Jedes Bild = <b>1</b> Punkt',
			  c: '<span class="kz-chip g">1024 Zahlen</span><span class="kz-arrow">→</span><span class="kz-chip r">Punkt</span>',
			  i: 'Jedes Bild (1024 Zahlen) ist <b>ein Punkt</b> im 1024-dimensionalen Raum — wir sehen nur einen <b>2D-Schatten</b> davon. Der Haufen wirkt wie <b>PCA über 1000 Katze-/Hund-Bilder</b>: zwei Farben, die sich <b>überlappen</b>. Keine Gerade trennt sie sauber.' },
			{ k: 'Schritt 3', t: 'Der Layer <em>wölbt</em><br>den Raum.',
			  p: 'Die <b>wellige</b> Grenze wird <b>gerade</b>',
			  c: '<span class="kz-chip">z = y − b(x)</span>',
			  i: 'Die Grenze zwischen Katze und Hund ist <b>wellig</b> — für eine Gerade in der flachen Ansicht unmöglich. Die Schicht wölbt den Raum genau so, dass diese Welle <b>gerade</b> wird: dann liegen alle Hunde auf der einen, alle Katzen auf der anderen Seite.' },
			{ k: 'Schritt 4', t: 'Eine Ebene passt<br><em>dazwischen</em>.',
			  p: 'Hund <b>über</b>, Katze <b>unter</b>',
			  c: '<span class="kz-chip g" style="background:#ecfdf5;border-color:#a7f3d0;color:#15803d">Katze</span><span class="kz-arrow">·</span><span class="kz-chip r">Hund</span>',
			  i: 'Das ist der <b>Payoff</b>: nach dem Wölben sind Katze & Hund <b>klar trennbar</b>. Eine <b>flache Ebene</b> (in 2D: eine Gerade) liegt genau dazwischen — <b>genau das</b> ist, wozu die Schicht den Raum wölbt.' },
			{ k: 'Schritt 5', t: 'Alles fällt auf<br><em>eine Linie</em>.',
			  p: 'Links Hund, rechts Katze',
			  c: '<span class="kz-chip">Score</span>',
			  i: 'Die Rückprojektion wirft jeden Punkt auf <b>eine Zahl</b> (den Score): links der Hund, rechts die Katze. <b>Unser Bild</b> (Mini-Katze) landet auf der <b>Katze-Seite</b>; daneben ein Beispiel-<b>Hund</b>.' }
		],

		layoutFor,

		onStep(step) {
			if (step === 0) {
				cpT = 0; cpSpawned = 0;
				cpBorn.length = 0; cpFrom.length = 0;
			}
			if (step < 1) ptsT = 0;
			// Nach einem Zurück-Navigieren/Re-Einstieg nicht von der
			// falschen Seite animieren: bei großer Abweichung snapen.
			const tgt = {
				panelA: step === 0 ? 1 : 0,
				ptsA: step >= 1 ? 1 : 0,
				lift: step >= 2 ? 1 : 0,
				planeA: step === 3 ? 1 : 0,
				projA: step >= 4 ? 1 : 0,
				axisA: step >= 4 ? 1 : 0
			};
			if (Math.abs(projA - tgt.projA) > 0.4 ||
				Math.abs(lift - tgt.lift) > 0.4 ||
				Math.abs(ptsA - tgt.ptsA) > 0.4) {
				panelA = tgt.panelA; ptsA = tgt.ptsA; lift = tgt.lift;
				planeA = tgt.planeA; projA = tgt.projA; axisA = tgt.axisA;
			}
		},

		tick(dt, k, S) {
			panelA = K.lerp(panelA, S.step === 0 ? 1 : 0, k * 1.4);
			ptsA = K.lerp(ptsA, S.step >= 1 ? 1 : 0, k * 1.1);
			lift = K.lerp(lift, S.step >= 2 ? 1 : 0, k * 0.8);
			planeA = K.lerp(planeA, S.step === 3 ? 1 : 0, k);
			projA = K.lerp(projA, S.step >= 4 ? 1 : 0, k * 0.7);
			axisA = K.lerp(axisA, S.step >= 4 ? 1 : 0, k);
			if (S.step === 0) {
				cpT = Math.min(cpT + dt * 16.667, CP_DISS_B + CP_FLY);
			} else {
				cpT = 0;
			}
			if (S.step >= 1) ptsT = Math.min(ptsT + dt * 16.667, 6000);
			else ptsT = 0;
		},

		draw(ctx, S) {
			ctx.fillStyle = '#ffffff';
			ctx.fillRect(0, 0, S.W, S.H);
			const pg = panelGeom(S);
			if (panelA > 0.01) drawPanel(ctx, S, panelA, pg);
			if (ptsA > 0.005) drawScene(ctx, S, pg);
		}
	});
})();
