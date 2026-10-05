// ============================================================
// flatten.js — Folie "Was macht Flatten?"
//
// EIGENSTÄNDIG: keine Abhängigkeit zu anderen Folien oder Modulen.
// Wer die Folie ändern will, ändert den CONFIG-Block unten —
// Größe der Feature Maps, Anzahl Kanäle, Dense-Ausgabe. Sonst nichts.
//
// Register: FlattenDemo (DemoRegistry-Eintrag in presentation.js).
// ============================================================

const FlattenDemo = (() => {
	// ╔═══════════════════════════════════════════════════════════╗
	// ║  CONFIG — HIER ÄNDERN                                     ║
	// ╚═══════════════════════════════════════════════════════════╝

	// Anzahl Feature Maps (Kanäle) nach der Convolution.
	const CHANNELS = 3;

	// Kantenlänge jeder Feature Map. Zusammen mit CHANNELS ergibt
	// sich die Länge des flachgemachten Vektors: C × H × W.
	const MAP_H = 3;
	const MAP_W = 3;

	// Wie viele Neuronen hat der Dense-Layer am Ende?
	const DENSE_UNITS = 2;

	// Werte der Feature Maps. Wenn DU_NONE, werden prozedural erzeugt
	// (gut für den Vortrag: sieht nach echten Aktivierungen aus,
	// bleibt aber exakt reproduzierbar).
	const DU_NONE = null;

	// ╔═══════════════════════════════════════════════════════════╗
	// ║  ENDE CONFIG — darunter nur noch Zeichencode              ║
	// ╚═══════════════════════════════════════════════════════════╝

	const VEC_LEN = CHANNELS * MAP_H * MAP_W;

	// Schritte: 0 = nichts passiert, 1..VEC_LEN = so viele Zahlen
	// sind bereits aus den Maps in den Vektor "gewandert",
	// VEC_LEN+1 = der Dense-Layer ist aktiv.
	const LAST_STEP = VEC_LEN + 1;

	let step = 0;

	// ── Daten ──────────────────────────────────────────────────
	// Deterministischer Zufall (fester Seed) — jede Folie zeigt
	// exakt dieselben Zahlen.
	function pseudoRandom(i) {
		const x = Math.sin(i * 12.9898) * 43758.5453;
		return x - Math.floor(x);
	}

	function maps() {
		if (DU_NONE) return DU_NONE;
		const out = [];
		for (let c = 0; c < CHANNELS; c++) {
			const m = [];
			for (let r = 0; r < MAP_H; r++) {
				const row = [];
				for (let col = 0; col < MAP_W; col++) {
					row.push(Math.round(pseudoRandom(c * 97 + r * 13 + col) * 90) / 100);
				}
				m.push(row);
			}
			out.push(m);
		}
		return out;
	}

	// Reihenfolge des Flatten: Kanal für Kanal, Zeile für Zeile,
	// Spalte für Spalte. Das ist die Keras-TensorReihenfolge.
	function flatVector() {
		const data = maps();
		const vec = [];
		for (let c = 0; c < CHANNELS; c++)
			for (let r = 0; r < MAP_H; r++)
				for (let col = 0; col < MAP_W; col++)
					vec.push(data[c][r][col]);
		return vec;
	}

	// Index der Zahl, die gerade in den Vektor wandert (0-basiert).
	function flatIndexOf(channel, row, col) {
		return channel * MAP_H * MAP_W + row * MAP_W + col;
	}

	function fmt(v) {
		return v.toFixed(2);
	}

	// ── Zeichnen ───────────────────────────────────────────────
	function renderMaps() {
		const host = document.getElementById('flat-maps');
		if (!host) return;
		const data = maps();

		host.innerHTML = '';
		for (let c = 0; c < CHANNELS; c++) {
			const wrap = document.createElement('div');
			wrap.className = 'flat-map';

			const label = document.createElement('div');
			label.className = 'flat-map-label';
			label.textContent = 'Kanal ' + (c + 1);
			wrap.appendChild(label);

			const grid = document.createElement('div');
			grid.className = 'flat-map-grid';
			grid.style.gridTemplateColumns = `repeat(${MAP_W}, 1fr)`;

			for (let r = 0; r < MAP_H; r++) {
				for (let col = 0; col < MAP_W; col++) {
					const cell = document.createElement('div');
					cell.className = 'flat-cell';
					const v = data[c][r][col];
					cell.textContent = fmt(v);
					cell.style.background = `rgba(99,102,241,${0.10 + v * 0.75})`;
					cell.style.color = v > 0.55 ? '#ffffff' : '#1e293b';

					// Noch nicht "geflattet" → abgedunkelt
					const idx = flatIndexOf(c, r, col);
					if (idx >= step) cell.classList.add('pending');

					grid.appendChild(cell);
				}
			}
			wrap.appendChild(grid);
			host.appendChild(wrap);
		}
	}

	function renderVector() {
		const host = document.getElementById('flat-vector');
		if (!host) return;
		const vec = flatVector();

		host.innerHTML = '';
		host.style.gridTemplateColumns = `repeat(${Math.min(VEC_LEN, 9)}, 1fr)`;
		const visible = Math.min(step, VEC_LEN);
		for (let i = 0; i < VEC_LEN; i++) {
			const cell = document.createElement('div');
			cell.className = 'flat-vec-cell';
			if (i < visible) {
				cell.classList.add('placed');
				cell.textContent = fmt(vec[i]);
			} else {
				cell.textContent = '·';
			}
			host.appendChild(cell);
		}

		const count = document.getElementById('flat-count');
		if (count) {
			count.innerHTML = step >= VEC_LEN
				? `<b>${CHANNELS} × ${MAP_H} × ${MAP_W} = ${VEC_LEN}</b> Zahlen in einer Zeile.`
				: `${visible} / ${VEC_LEN} Zahlen umgewandelt.`;
		}

		// Der erste Pfeil leuchtet, sobald der Vektor gefüllt ist.
		const arrow = document.getElementById('flat-arrow');
		if (arrow) arrow.classList.toggle('on', step > 0);
	}

	function renderDense() {
		const host = document.getElementById('flat-dense');
		if (!host) return;
		const active = step > VEC_LEN;
		host.classList.toggle('active', active);
		host.innerHTML = '';

		for (let u = 0; u < DENSE_UNITS; u++) {
			const row = document.createElement('div');
			row.className = 'flat-dense-row';

			for (let i = 0; i < VEC_LEN; i++) {
				const w = document.createElement('span');
				w.className = 'flat-dense-weight';
				w.title = 'Gewicht w' + (u + 1) + ',' + (i + 1);
				row.appendChild(w);
			}

			const out = document.createElement('span');
			out.className = 'flat-dense-out';
			out.textContent = 'y' + (u + 1);
			row.appendChild(out);

			host.appendChild(row);
		}

		const params = document.getElementById('flat-params');
		if (params) {
			// Dense(VEC_LEN -> DENSE_UNITS): VEC_LEN × DENSE_UNITS Gewichte
			// plus DENSE_UNITS Biases.
			const w = VEC_LEN * DENSE_UNITS;
			params.innerHTML = active
				? `<b>${w} + ${DENSE_UNITS} = ${w + DENSE_UNITS}</b> lernbare Parameter.`
				: `wartet auf den Vektor …`;
		}

		// Der zweite Pfeil leuchtet, sobald der Dense-Layer arbeitet.
		const arrow2 = document.getElementById('flat-arrow2');
		if (arrow2) arrow2.classList.toggle('on', active);
	}

	function renderReadout() {
		const el = document.getElementById('flat-readout');
		if (!el) return;
		if (step === 0) {
			el.textContent = `${CHANNELS} Feature Maps à ${MAP_H}×${MAP_W}. Noch nichts verbunden.`;
		} else if (step < VEC_LEN) {
			el.textContent = `Zahl ${step} / ${VEC_LEN} wandert in den Vektor.`;
		} else if (step === VEC_LEN) {
			el.textContent = `Fertig: ein Vektor mit ${VEC_LEN} Zahlen.`;
		} else {
			el.textContent = `Der Dense-Layer sieht jetzt alle ${VEC_LEN} Zahlen auf einmal.`;
		}
	}

	function draw() {
		renderMaps();
		renderVector();
		renderDense();
		renderReadout();
	}

	// ── Schrittlogik (Pfeiltasten) ─────────────────────────────
	let bound = false;

	function init() {
		step = 0;
		draw();

		// init() läuft bei JEDEM Folienbesuch – sonst stapeln sich die
		// Klick-Handler und ein Klick springt mehrere Schritte weiter.
		if (bound) return;
		bound = true;

		const next = document.getElementById('flat-next');
		const prev = document.getElementById('flat-prev');
		if (next) next.addEventListener('click', () => setStep(step + 1));
		if (prev) prev.addEventListener('click', () => setStep(step - 1));
	}

	function setStep(s) {
		step = Math.max(0, Math.min(LAST_STEP, s));
		draw();
	}

	function isOnSlide() {
		const a = document.querySelector('.slide.active');
		return a && a.id === 'slide-flatten';
	}

	function canGoNext() { return isOnSlide() && step < LAST_STEP; }
	function canGoPrev() { return isOnSlide() && step > 0; }
	function nextStep() { if (canGoNext()) setStep(step + 1); }
	function prevStep() { if (canGoPrev()) setStep(step - 1); }
	function reset() { step = 0; draw(); }

	// Zustand merken/wiederherstellen (siehe convolution.js)
	function getState() { return { step }; }
	function setState(st) { if (st && typeof st.step === 'number') setStep(st.step); }

	return { init, reset, canGoNext, canGoPrev, next: nextStep, prev: prevStep, isOnSlide, draw, getState, setState };
})();