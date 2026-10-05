// ============================================================
// convolution.js — Folie "Was sind Convolutions?"
//
// Diese Datei ist bewusst EIGENSTÄNDIG: sie kennt weder andere
// Folien noch andere Module. Wer die Folie ändern will, ändert
// nur den CONFIG-Block unten (Zahlen, Filter, Beschriftung) oder
// den Zeichencode darunter — sonst nichts.
//
// Register: ConvDemo (wird in presentation.js als DemoRegistry-
// Eintrag geführt, damit die Pfeiltasten das Fenster verschieben).
// ============================================================

const ConvDemo = (() => {
	// ╔═══════════════════════════════════════════════════════════╗
	// ║  CONFIG — HIER ÄNDERN                                     ║
	// ╚═══════════════════════════════════════════════════════════╝

	// Eingabebild: quadratische Matrix, Werte 0…1 (0 = schwarz, 1 = weiß).
	// Ein Pfeil nach rechts = hell, ein Pfeil nach unten = hell.
	// (Ein echtes Foto kann hier jederzeit als Matrix eingetragen werden.)
	const INPUT = [
		[0, 0, 0, 0, 0, 0],
		[0, 0, 1, 1, 0, 0],
		[0, 0, 1, 1, 0, 0],
		[0, 0, 1, 1, 0, 0],
		[0, 0, 0, 0, 0, 0],
		[0, 0, 0, 0, 0, 0],
	];

	// Die Kernel, zwischen denen umgeschaltet werden kann.
	// Jeder Eintrag: name (Beschriftung) + weights (Matrix, 3×3).
	const KERNELS = [
		{
			name: 'Vertikaler Kantenfilter',
			weights: [[-1, 0, 1], [-1, 0, 1], [-1, 0, 1]],
		},
		{
			name: 'Horizontaler Kantenfilter',
			weights: [[-1, -1, -1], [0, 0, 0], [1, 1, 1]],
		},
		{
			name: 'Weichzeichnen (Mittelwert)',
			weights: [[1, 1, 1], [1, 1, 1], [1, 1, 1]],
		},
	];

	// Fensterposition, auf der die Animation startet: [zeile, spalte].
	const START_POS = [1, 0];

	const STRIDE = 1;

	// ╔═══════════════════════════════════════════════════════════╗
	// ║  ENDE CONFIG — darunter nur noch Zeichencode              ║
	// ╚═══════════════════════════════════════════════════════════╝

	const K = KERNELS[0].weights.length; // 3
	const H = INPUT.length;
	const W = INPUT[0].length;
	const OUT_H = Math.floor((H - K) / STRIDE) + 1;
	const OUT_W = Math.floor((W - K) / STRIDE) + 1;

	let pos = START_POS.slice();
	let kernelIdx = 0;

	// ── Rechnen ────────────────────────────────────────────────
	// Eine Convolution an einer Position: elementweise multiplizieren,
	// aufsummieren, Bias (hier 0) dazu. Genau das, was ein Dense-Layer
	// tut — nur dass er seine Gewichte überall wiederverwendet.
	function convolveAt(row, col, weights) {
		let sum = 0;
		const terms = [];
		for (let i = 0; i < K; i++) {
			for (let j = 0; j < K; j++) {
				const a = INPUT[row + i][col + j];
				const w = weights[i][j];
				terms.push({ a, w });
				sum += a * w;
			}
		}
		return { sum, terms };
	}

	function fullMap(weights) {
		const out = [];
		for (let r = 0; r < OUT_H; r++) {
			const row = [];
			for (let c = 0; c < OUT_W; c++) row.push(convolveAt(r * STRIDE, c * STRIDE, weights).sum);
			out.push(row);
		}
		return out;
	}

	// ── Zeichnen ───────────────────────────────────────────────
	// Wert → Farbe. Blau = negativ, weiß = 0, orange = positiv.
	function heatColor(v, max) {
		const t = max === 0 ? 0 : Math.min(1, Math.abs(v) / max);
		if (v >= 0) {
			// 0 → #ffffff, max → #f97316
			const g = Math.round(255 + (249 - 255) * t);
			const b = Math.round(255 + (22 - 255) * t);
			return `rgb(255,${g},${b})`;
		}
		// 0 → #ffffff, -max → #2563eb
		const r = Math.round(255 + (37 - 255) * t);
		const g2 = Math.round(255 + (99 - 255) * t);
		return `rgb(${r},${g2},255)`;
	}

	function drawGrid(canvas, matrix, opts) {
		const rows = matrix.length;
		const cols = matrix[0].length;
		const cell = canvas.width / cols;
		const ctx = canvas.getContext('2d');

		let max = 0;
		matrix.forEach(row => row.forEach(v => { max = Math.max(max, Math.abs(v)); }));
		if (opts && opts.max) max = opts.max;

		ctx.clearRect(0, 0, canvas.width, canvas.height);
		ctx.fillStyle = '#ffffff';
		ctx.fillRect(0, 0, canvas.width, canvas.height);

		for (let r = 0; r < rows; r++) {
			for (let c = 0; c < cols; c++) {
				const x = c * cell;
				const y = r * cell;
				const v = matrix[r][c];

				if (opts && opts.windowAt && opts.windowAt[0] === r && opts.windowAt[1] === c) {
					ctx.fillStyle = 'rgba(99,102,241,0.16)';
				} else {
					ctx.fillStyle = heatColor(v, max);
				}
				ctx.fillRect(x, y, cell, cell);
				ctx.strokeStyle = 'rgba(148,163,184,0.55)';
				ctx.lineWidth = 1;
				ctx.strokeRect(x + 0.5, y + 0.5, cell - 1, cell - 1);

				ctx.fillStyle = Math.abs(v) > max * 0.55 ? '#ffffff' : '#334155';
				ctx.font = `${Math.round(cell * 0.30)}px ui-monospace, monospace`;
				ctx.textAlign = 'center';
				ctx.textBaseline = 'middle';
				ctx.fillText(opts && opts.raw ? String(v) : fmt(v), x + cell / 2, y + cell / 2);
			}
		}
		return cell;
	}

	function fmt(v) {
		if (v === 0) return '0';
		if (Math.abs(v) >= 100) return Math.round(v).toString();
		const r = Math.round(v * 10) / 10;
		return Number.isInteger(r) ? String(r) : r.toFixed(1);
	}

	function drawInput() {
		const canvas = document.getElementById('conv-input');
		if (!canvas) return null;
		const cell = drawGrid(canvas, INPUT, {
			windowAt: pos,
			max: 1,
			raw: false,
		});
		// Rahmen um das aktive Fenster
		const ctx = canvas.getContext('2d');
		ctx.strokeStyle = '#4f46e5';
		ctx.lineWidth = 3;
		ctx.strokeRect(pos[1] * cell + 1.5, pos[0] * cell + 1.5, K * cell - 3, K * cell - 3);
		return cell;
	}

	function drawKernel() {
		const canvas = document.getElementById('conv-kernel');
		if (!canvas) return;
		const w = KERNELS[kernelIdx].weights;
		drawGrid(canvas, w, { max: 1, raw: true });

		// Das Kernel-Muster liegt deckungsgleich über dem aktiven Fenster —
		// sichtbar machen, dass es 1:1 passt.
		const cell = canvas.width / K;
		const ctx = canvas.getContext('2d');
		ctx.fillStyle = 'rgba(15,23,42,0.78)';
		ctx.font = `${Math.round(cell * 0.26)}px ui-monospace, monospace`;
		ctx.textAlign = 'center';
		ctx.textBaseline = 'middle';
		for (let r = 0; r < K; r++) {
			for (let c = 0; c < K; c++) {
				const v = w[r][c];
				ctx.fillStyle = v === 0 ? 'rgba(15,23,42,0.35)' : 'rgba(15,23,42,0.85)';
				ctx.fillText(v > 0 ? `+${v}` : String(v), c * cell + cell / 2, r * cell + cell / 2);
			}
		}
	}

	function drawOutput() {
		const canvas = document.getElementById('conv-output');
		if (!canvas) return;
		const map = fullMap(KERNELS[kernelIdx].weights);
		// Noch nicht berechnete Positionen (rechts/unten vom Fenster) ausgrauen
		const pending = [];
		for (let r = 0; r < OUT_H; r++) {
			for (let c = 0; c < OUT_W; c++) {
				if (r > pos[0] || (r === pos[0] && c > pos[1])) {
					pending.push([r, c, map[r][c]]);
				}
			}
		}
		drawGrid(canvas, map, {});
		const cell = canvas.width / OUT_W;
		const ctx = canvas.getContext('2d');
		ctx.fillStyle = 'rgba(248,250,252,0.82)';
		pending.forEach(([r, c]) => {
			ctx.fillRect(c * cell + 1, r * cell + 1, cell - 2, cell - 2);
		});
		// Rahmen auf der gerade berechneten Position
		ctx.strokeStyle = '#4f46e5';
		ctx.lineWidth = 3;
		ctx.strokeRect(pos[1] * cell + 1.5, pos[0] * cell + 1.5, cell - 3, cell - 3);
	}

	function drawReadout() {
		const el = document.getElementById('conv-readout');
		if (!el) return;
		const { sum, terms } = convolveAt(pos[0], pos[1], KERNELS[kernelIdx].weights);
		const products = terms
			.map(t => `${fmt(t.a)}·${t.w > 0 ? '+' + t.w : t.w}`)
			.join(' + ');
		el.innerHTML =
			`Zeile ${pos[0]}, Spalte ${pos[1]} &nbsp;→&nbsp; ` +
			`<b>${products} = ${fmt(sum)}</b> &nbsp;·&nbsp; ` +
			`Feature Map ${OUT_W}×${OUT_H} (aus ${W}×${H}, „valid", stride ${STRIDE})`;
	}

	function draw() {
		const nameEl = document.getElementById('conv-kernel-name');
		if (nameEl) nameEl.textContent = `(${KERNELS[kernelIdx].name})`;
		drawInput();
		drawKernel();
		drawOutput();
		drawReadout();
	}

	// ── Schrittlogik (Pfeiltasten) ─────────────────────────────
	function maxSteps() {
		return OUT_W * OUT_H;
	}

	function stepIndex() {
		return pos[0] * OUT_W + pos[1];
	}

	function setStep(idx) {
		const clamped = Math.max(0, Math.min(maxSteps() - 1, idx));
		pos = [Math.floor(clamped / OUT_W), clamped % OUT_W];
		draw();
	}

	let bound = false;

	function init() {
		pos = START_POS.slice();
		draw();

		// init() läuft bei JEDEM Folienbesuch – sonst stapeln sich die
		// Handler und ein Klick springt mehrere Schritte weiter.
		if (bound) return;
		bound = true;

		const next = document.getElementById('conv-next');
		const prev = document.getElementById('conv-prev');
		if (next) next.addEventListener('click', () => setStep(stepIndex() + 1));
		if (prev) prev.addEventListener('click', () => setStep(stepIndex() - 1));

		// Klick aufs Eingabebild springt direkt zur Position
		const input = document.getElementById('conv-input');
		if (input) {
			input.addEventListener('click', ev => {
				const rect = input.getBoundingClientRect();
				const cell = input.width / INPUT[0].length;
				const c = Math.floor(((ev.clientX - rect.left) / rect.width) * INPUT[0].length);
				const r = Math.floor(((ev.clientY - rect.top) / rect.height) * INPUT.length);
				setStep(Math.max(0, Math.min(maxSteps() - 1, r * OUT_W + c)));
			});
		}
	}

	function isOnSlide() {
		const a = document.querySelector('.slide.active');
		return a && a.id === 'slide-convolution';
	}

	function canGoNext() { return isOnSlide() && stepIndex() < maxSteps() - 1; }
	function canGoPrev() { return isOnSlide() && stepIndex() > 0; }
	function nextStep() { if (canGoNext()) setStep(stepIndex() + 1); }
	function prevStep() { if (canGoPrev()) setStep(stepIndex() - 1); }
	function reset() { pos = START_POS.slice(); draw(); }
	function cycleKernel() {
		kernelIdx = (kernelIdx + 1) % KERNELS.length;
		draw();
	}

	return { init, reset, canGoNext, canGoPrev, next: nextStep, prev: prevStep, isOnSlide, cycleKernel, draw };
})();