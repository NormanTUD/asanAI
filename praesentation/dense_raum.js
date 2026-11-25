// ============================================================
// DenseRaum, "Vom Bild zu Punkten" (dense_raum.js)
//
// 4 Schritte über die Pfeiltasten:
//   0: Aus Zahlen werden Punkte — jedes Bild ist EIN Punkt im
//      1024-dim. Raum (wir sehen nur einen 2D-Schatten): Katzen
//      (grün) füllen die Mitte, Hunde (rot) bilden den Ring —
//      ineinander verschachtelt, NICHT linear trennbar.
//   1: Der Layer wölbt den Raum — der flache Raum wird zu einer
//      Schüssel (z = x²+y²); der Hund-Ring klettert die Wände
//      hinauf, die Katzen bleiben im Grund.
//   2: Eine flache, HORIZONTALE Ebene (z = R0²) passt dazwischen:
//      alle Hunde darüber, alle Katzen darunter — trennt wirklich.
//   3: Rückprojektion auf eine Linie (Score) — links Katze,
//      rechts Hund; "unser Bild" = ein zufälliger Punkt aus dem Set.
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

	// NICHT linear trennbar in der flachen 2D-Ansicht: Katzen (c=0) füllen
	// die Mitte (Scheibe, r ≤ CAT_R), Hunde (c=1) bilden den Ring drumherum
	// (r ≥ DOG_R0) — der Ring umschließt die Scheibe, daher trennt KEINE
	// Gerade (auch nicht Horizontal/Vertikal/Diagonal) die beiden. Die
	// Schicht wölbt den Raum zu einer Schüssel z = r² = x²+y²; dann trennt
	// die HORIZONTALE EBENE z = R0² sauber: alle Hunde (großes r, hoch)
	// darüber, alle Katzen (kleines r, tief) darunter.
	const R0 = 0.7;                  // Trenn-Radius (Ebene liegt auf r = R0)
	const CAT_R = 0.5;                // Katzen: r ≤ CAT_R  (Scheibe)
	const DOG_R0 = 0.9, DOG_R1 = 1.25;  // Hunde: r ∈ [DOG_R0, DOG_R1] (Ring)
	const AMP = 0.55;                 // Schüssel-Tiefe
	const RMAX = 1.35;                // Gitter-/Ansichts-Radius
	const warp = (x, y) => x * x + y * y;   // Schüssel (Bowl)

	// Punkte: Katzen-Scheibe (Mitte) + Hund-Ring (außen), mit Lücke
	// (CAT_R < R0 < DOG_R0) → die Ebene z = R0² trennt garantiert.
	const PTS = [];
	const CAT_IDX = [], DOG_IDX = [];
	{
		const rnd = mulberry32(20240615);
		const PER = 92;
		for (let i = 0; i < PER; i++) {
			const r = CAT_R * Math.pow(rnd(), 0.7);
			const a = rnd() * Math.PI * 2;
			PTS.push({ x: r * Math.cos(a), y: r * Math.sin(a), c: 0 });
			CAT_IDX.push(PTS.length - 1);
		}
		for (let i = 0; i < PER; i++) {
			const r = DOG_R0 + (DOG_R1 - DOG_R0) * rnd();
			const a = rnd() * Math.PI * 2;
			PTS.push({ x: r * Math.cos(a), y: r * Math.sin(a), c: 1 });
			DOG_IDX.push(PTS.length - 1);
		}
	}

	// "Unser Bild" = ein zufälliger Katzen-Punkt, "Beispiel-Hund" = ein
	// zufälliger Hund-Punkt — bei jedem (Re-)Besuch neu gewählt.
	let imgIdx = -1, dogIdx = -1;
	function pickRandom() {
		imgIdx = CAT_IDX[(Math.random() * CAT_IDX.length) | 0];
		dogIdx = DOG_IDX[(Math.random() * DOG_IDX.length) | 0];
	}
	pickRandom();

	// ---------- Animationszustand ----------
	let ptsA = 0, lift = 0, planeA = 0, projA = 0, axisA = 0;
	let ptsT = 0;

	// ---------- Geometrie: fixe schräge Kamera, kein Drag ----------
	const G = { SX: 0, SY: 0, SZ: 0, CX: 0, CY: 0, AY: 0, AXL: 0, AXR: 0 };
	function layoutFor(step, S) {
		G.SX = Math.min(250, S.W * 0.21, S.H * 0.58);
		G.SY = G.SX * 0.36;
		G.SZ = G.SX * 0.42;
		G.CX = S.W * 0.5;
		G.CY = S.H * 0.52;
		G.AY = S.H - 38;
		G.AXL = S.W * 0.20;
		G.AXR = S.W * 0.80;
	}
	const proj3 = (x, y, z) => ({ X: G.CX + x * G.SX, Y: G.CY + y * G.SY - z * G.SZ });
	// Score auf der Achse: Höhe über/unter der trennenden Ebene (z = R0²).
	// Katze (r < R0) → negativ (links), Hund (r > R0) → positiv (rechts).
	const scoreOf = p => warp(p.x, p.y) - R0 * R0;
	const SEXT = 1.2;
	const axisX = s => {
		const t = Math.max(-SEXT, Math.min(SEXT, s)) / SEXT;   // −1..1
		return G.AXL + (G.AXR - G.AXL) * (t + 1) / 2;
	};

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

	// Kandidat-Gerade, die in der flachen Ansicht NICHT trennt (Schritt 0)
	const CAND_LINES = [
		[[-RMAX, 0], [RMAX, 0]],        // horizontal
		[[0, -RMAX], [0, RMAX]],        // vertikal
		[[-RMAX, -RMAX], [RMAX, RMAX]]  // diagonal
	];

	function drawScene(ctx, S) {
		// Feines Gitter auf der (mit lift) gewölbten Schüssel
		const gridA = ptsA * (1 - projA * 0.8);
		if (gridA > 0.01) {
			const GN = 18;
			ctx.lineWidth = 1;
			ctx.strokeStyle = 'rgba(148,163,184,' + (0.5 * gridA).toFixed(3) + ')';
			for (let i = 0; i <= GN; i++) {
				const u = -RMAX + 2 * RMAX * i / GN;
				for (const along of [0, 1]) {
					ctx.beginPath();
					for (let j = 0; j <= GN; j++) {
						const v = -RMAX + 2 * RMAX * j / GN;
						const x = along ? v : u, y = along ? u : v;
						const p = proj3(x, y, AMP * lift * warp(x, y));
						if (j === 0) ctx.moveTo(p.X, p.Y); else ctx.lineTo(p.X, p.Y);
					}
					ctx.stroke();
				}
			}
		}

		// Kandidat-Geraden, die in der flachen Ansicht nicht trennen
		const candA = ptsA * (1 - lift) * (1 - projA);
		if (candA > 0.02) {
			ctx.save();
			ctx.setLineDash([7, 7]);
			ctx.lineWidth = 1.6;
			ctx.globalAlpha = 0.55 * candA;
			ctx.strokeStyle = '#64748b';
			for (const ln of CAND_LINES) {
				const a = proj3(ln[0][0], ln[0][1], 0);
				const b = proj3(ln[1][0], ln[1][1], 0);
				ctx.beginPath(); ctx.moveTo(a.X, a.Y); ctx.lineTo(b.X, b.Y); ctx.stroke();
			}
			ctx.restore();
			drawLabel(ctx, 20, S.H - 22, 'keine Gerade trennt sie →', '#64748b', 0.9 * candA, 'left');
		}

		// Die trennende HORIZONTALE EBENE z = R0² (Schritt 2): alle Hunde
		// darüber, alle Katzen darunter.
		if (planeA > 0.01) {
			const Z0 = AMP * R0 * R0;
			const E = RMAX;
			const c1 = proj3(-E, -E, Z0), c2 = proj3(E, -E, Z0), c3 = proj3(E, E, Z0), c4 = proj3(-E, E, Z0);
			ctx.globalAlpha = planeA;
			ctx.fillStyle = 'rgba(217,119,6,0.16)';
			ctx.beginPath();
			ctx.moveTo(c1.X, c1.Y); ctx.lineTo(c2.X, c2.Y); ctx.lineTo(c3.X, c3.Y); ctx.lineTo(c4.X, c4.Y);
			ctx.closePath(); ctx.fill();
			ctx.strokeStyle = '#d97706'; ctx.lineWidth = 2;
			ctx.beginPath();
			ctx.moveTo(c1.X, c1.Y); ctx.lineTo(c2.X, c2.Y); ctx.lineTo(c3.X, c3.Y); ctx.lineTo(c4.X, c4.Y);
			ctx.closePath(); ctx.stroke();
			ctx.globalAlpha = 1;
			drawLabel(ctx, c4.X - 4, c4.Y + 16, 'trennende Ebene', '#b45309', planeA, 'left');
		}

		if (axisA > 0.01) drawAxis(ctx);

		// Punkte, fern (kleines y) → nah (großes y)
		const order = PTS.map((p, i) => i).sort((a, b) => PTS[a].y - PTS[b].y);
		for (const i of order) drawPoint(ctx, i);

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

		// Mitte: 0-Lücke (die Ebene)
		ctx.setLineDash([3, 5]);
		ctx.strokeStyle = '#94a3b8'; ctx.lineWidth = 1;
		ctx.beginPath(); ctx.moveTo(x0, G.AY - 30); ctx.lineTo(x0, G.AY + 8); ctx.stroke();
		ctx.setLineDash([]);

		drawLabel(ctx, G.AXL - 10, G.AY + 22, 'Katze', '#15803d', axisA, 'left');
		drawLabel(ctx, G.AXR + 10, G.AY + 22, 'Hund', '#e11d48', axisA, 'left');
		drawLabel(ctx, x0, G.AY + 22, '0', '#64748b', axisA, 'center');
		ctx.globalAlpha = axisA * 0.9;
		ctx.font = 'italic 600 14px Georgia'; ctx.fillStyle = '#64748b';
		ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
		ctx.fillText('Score (nach der Schicht)', G.AXR + 150, G.AY - 14);
		ctx.globalAlpha = 1;
	}

	function drawPoint(ctx, i) {
		const p = PTS[i];
		const t = Math.max(0, Math.min(1, (ptsT - i * 12) / 480));
		if (t <= 0) return;
		const e = ease(t);
		const z = AMP * lift * warp(p.x, p.y);
		const p3 = proj3(p.x, p.y, z);
		let X = p3.X;
		let Y = p3.Y;
		if (projA > 0.001) {
			const tp = ease(projA);
			X = K.lerp(X, axisX(scoreOf(p)), tp);
			Y = K.lerp(Y, G.AY, tp) - Math.sin(Math.PI * tp) * 44;
		}
		const a = Math.min(1, t * 1.5);
		const isImg = (i === imgIdx), isDog = (i === dogIdx);
		const special = isImg || isDog;

		if (special && projA > 0.5) {
			// Nach der Projektion als (großer) Punkt mit Label.
			const dot = isImg ? '#15803d' : '#e11d48';
			ctx.globalAlpha = a * 0.5;
			ctx.strokeStyle = dot; ctx.lineWidth = 1.5;
			ctx.beginPath(); ctx.arc(X, Y, 12, 0, 6.2832); ctx.stroke();
			ctx.globalAlpha = a;
			ctx.fillStyle = dot; ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 2;
			ctx.beginPath(); ctx.arc(X, Y, 8, 0, 6.2832); ctx.fill(); ctx.stroke();
			drawLabel(ctx, X + 14, Y - 12, isImg ? 'unser Bild' : 'Hund', dot, a * (1 - projA * 0.3));
			ctx.globalAlpha = 1;
			return;
		}

		ctx.globalAlpha = a;
		const r = special ? 6 * e : 4 * e;
		ctx.fillStyle = p.c === 0 ? '#15803d' : '#e11d48';
		ctx.strokeStyle = '#ffffff'; ctx.lineWidth = special ? 1.5 : 1;
		ctx.beginPath(); ctx.arc(X, Y, r, 0, 6.2832); ctx.fill(); ctx.stroke();
		if (isImg && projA < 0.5) drawLabel(ctx, X + 10, Y - 8, 'unser Bild', '#15803d', a * (1 - projA));
		ctx.globalAlpha = 1;
	}

	return KatzeKit.create({
		slideId: 'slide-dense-raum',
		prefix: 'dr',
		steps: [
			{ k: 'Schritt 1', t: 'Aus Zahlen werden<br><em>Punkte</em>.',
			  p: 'Jedes Bild = <b>1</b> Punkt',
			  c: '<span class="kz-chip g">1024 Zahlen</span><span class="kz-arrow">→</span><span class="kz-chip r">Punkt</span>',
			  i: 'Jedes Bild (1024 Zahlen) ist <b>ein Punkt</b> im 1024-dimensionalen Raum — wir sehen nur einen <b>2D-Schatten</b>. Katzen (grün) füllen die <b>Mitte</b>, Hunde (rot) bilden den <b>Ring</b> drumherum — ineinander verschachtelt. <b>Keine Gerade</b> trennt die beiden Klassen.' },
			{ k: 'Schritt 2', t: 'Der Layer <em>wölbt</em><br>den Raum.',
			  p: 'Flach → <b>Schüssel</b> (z = x²+y²)',
			  c: '<span class="kz-chip">z = x² + y²</span>',
			  i: 'Die Schicht wölbt den flachen Raum zu einer <b>Schüssel</b> (z = x²+y²). Der <b>Hund-Ring</b> klettert die Wände hinauf, die <b>Katzen</b> bleiben im Grund. Was in der flachen Ebene unmöglich war, wird in der Höhe <b>trennbar</b>.' },
			{ k: 'Schritt 3', t: 'Eine Ebene passt<br><em>dazwischen</em>.',
			  p: 'Hund <b>über</b>, Katze <b>unter</b>',
			  c: '<span class="kz-chip g" style="background:#ecfdf5;border-color:#a7f3d0;color:#15803d">Katze</span><span class="kz-arrow">·</span><span class="kz-chip r">Hund</span>',
			  i: 'Der <b>Payoff</b>: eine <b>flache Ebene</b> liegt exakt dazwischen — alle <b>Hunde darüber</b>, alle <b>Katzen darunter</b>, jeder Punkt auf der richtigen Seite. Genau das bringt das Wölben.' },
			{ k: 'Schritt 4', t: 'Alles fällt auf<br><em>eine Linie</em>.',
			  p: 'Links Katze, rechts Hund',
			  c: '<span class="kz-chip">Score</span>',
			  i: 'Jeder Punkt fällt auf <b>eine Zahl</b> (Score = Höhe über/unter der Ebene): links Katze, rechts Hund. <b>Unser Bild</b> — ein <b>zufälliger Punkt</b> aus dem Set — landet auf der <b>Katze-Seite</b>.' }
		],

		layoutFor,

		onStep(step) {
			if (step === 0) { pickRandom(); ptsT = 0; }
			// Nach einem Zurück-Navigieren/Re-Einstieg nicht von der
			// falschen Seite animieren: bei großer Abweichung snapen.
			const tgtLift = step >= 1 ? 1 : 0;
			const tgtProj = step >= 3 ? 1 : 0;
			if (Math.abs(lift - tgtLift) > 0.4 || Math.abs(projA - tgtProj) > 0.4) {
				lift = tgtLift;
				planeA = step === 2 ? 1 : 0;
				projA = tgtProj;
				axisA = tgtProj;
			}
		},

		tick(dt, k, S) {
			ptsA = K.lerp(ptsA, 1, k * 1.1);
			lift = K.lerp(lift, S.step >= 1 ? 1 : 0, k * 0.8);
			planeA = K.lerp(planeA, S.step === 2 ? 1 : 0, k);
			projA = K.lerp(projA, S.step >= 3 ? 1 : 0, k * 0.7);
			axisA = K.lerp(axisA, S.step >= 3 ? 1 : 0, k);
			ptsT = S.step >= 0 ? Math.min(ptsT + dt * 16.667, 6000) : 0;
		},

		draw(ctx, S) {
			ctx.fillStyle = '#ffffff';
			ctx.fillRect(0, 0, S.W, S.H);
			if (ptsA > 0.005) drawScene(ctx, S);
		}
	});
})();
