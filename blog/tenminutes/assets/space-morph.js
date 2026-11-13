(function () {
	"use strict";

	const DE = TM.lang && TM.lang() === "de";
	const DUR = 1000;
	const TAU = Math.PI * 2;

	let wrap = null;
	let canvas = null;
	let ctx = null;
	let W = 0, H = 0, DPR = 1;
	let visible = false;
	let rafId = 0;
	let inited = false;
	let cur = 0, prevIdx = 0, t0 = 0;
	let viewA = 0, viewB = -Math.PI / 2;
	let dragA = 0, dragB = 0, dragging = false, lastX = 0, lastY = 0;
	let FIT = 1, YOFF = 0;

	let rng = 42;
	const rnd = () => (rng = (rng * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff;
	const PTS = [];
	for (let i = 0; i < 140; i++) {
		const a = rnd() * TAU, r = Math.sqrt(rnd()) * 0.40;
		PTS.push({ x: Math.cos(a) * r, y: Math.sin(a) * r, c: 0 });
	}
	for (let i = 0; i < 220; i++) {
		const a = rnd() * TAU, r = 0.82 + Math.sqrt(rnd()) * 0.26;
		PTS.push({ x: Math.cos(a) * r, y: Math.sin(a) * r, c: 1 });
	}

	const KZ = 1.15, KB = 0.40, PLANE_Z = 0.18;
	const SCORE = (x, y) => (x * x + y * y) * KZ - KB - PLANE_Z;
	const SMIN = -0.62, SMAX = 1.05;
	const LIFT = (x, y, t) => {
		const r2 = x * x + y * y;
		return {
			x: x * (1 - 0.12 * t * r2),
			y: y * (1 - 0.12 * t * r2),
			z: (r2 * KZ - KB) * t
		};
	};

	const SCENES = [
		{
			title: "Two classes, no straight line",
			titleDe: "Zwei Klassen, keine gerade Linie",
			body: "An inner core of red points sits inside a blue ring. No straight line separates them: any line drawn across the plane has to cut through the ring.",
			bodyDe: "Ein innerer Kern roter Punkte sitzt in einem blauen Ring. Keine gerade Linie trennt sie: Jede Linie quer durch die Ebene muss den Ring schneiden.",
			lift: 0, camA: 0, camB: -Math.PI / 2, persp: 0, plane: 0, squash: 0, fail: 0, labels: 0, project: 0, box: 0
		},
		{
			title: "Every straight cut fails",
			titleDe: "Jeder gerade Schnitt scheitert",
			body: "A linear classifier draws a straight line. Around a closed ring, every line leaves points of both classes on both sides. The obstruction is topological, not a matter of finding a better angle.",
			bodyDe: "Ein linearer Klassifikator zieht eine gerade Linie. Rund um einen geschlossenen Ring lässt jede Linie Punkte beider Klassen auf beiden Seiten. Das Hindernis ist topologisch, keine Frage eines besseren Winkels.",
			lift: 0, camA: 0, camB: -Math.PI / 2, persp: 0, plane: 0, squash: 0, fail: 1, labels: 0, project: 0, box: 0
		},
		{
			title: "One more dimension of room",
			titleDe: "Eine Dimension mehr Raum",
			body: "Keep the old plane as a floor and open a third axis above it. The data has not changed; the space it lives in has. That extra room is the raw material every layer works with.",
			bodyDe: "Behalte die alte Ebene als Boden und öffne eine dritte Achse darüber. Die Daten haben sich nicht geändert; der Raum, in dem sie leben, hat sich geändert. Dieser zusätzliche Raum ist der Rohstoff, mit dem jede Schicht arbeitet.",
			lift: 0, camA: 0.38, camB: -0.62, persp: 1, plane: 0, squash: 0, fail: 0, labels: 0, project: 0, box: 1
		},
		{
			title: "The layer bends space",
			titleDe: "Die Schicht biegt den Raum",
			body: "The layer lifts the grid into a bowl: z = r². Inside the ring sinks, outside it rises. The bend is smooth and reversible. It stretches the space without tearing it or gluing distinct points together.",
			bodyDe: "Die Schicht hebt das Gitter in eine Schale: z = r². Innerhalb des Rings sinkt es, außerhalb steigt es. Die Biegung ist glatt und umkehrbar. Sie dehnt den Raum, ohne ihn zu zerreißen oder verschiedene Punkte zu verkleben.",
			lift: 1, camA: 0, camB: 0, persp: 1, plane: 0, squash: 0, fail: 0, labels: 0, project: 0, box: 0
		},
		{
			title: "A flat plane fits between",
			titleDe: "Eine flache Ebene passt dazwischen",
			body: "Nothing was added to the data and no class was moved. The curved space now has a gap, and one flat plane slides cleanly between the two classes.",
			bodyDe: "Den Daten wurde nichts hinzugefügt und keine Klasse bewegt. Der gekrümmte Raum hat jetzt eine Lücke, und eine flache Ebene gleitet sauber zwischen die beiden Klassen.",
			lift: 1, camA: 0, camB: 0, persp: 1, plane: 1, squash: 0, fail: 0, labels: 0, project: 0, box: 0
		},
		{
			title: "The plane becomes a line",
			titleDe: "Die Ebene wird zu einer Linie",
			body: "Look edge-on and squeeze the separating plane along the view direction. The sheet collapses to a line without changing which points lie on which side.",
			bodyDe: "Schau von der Kante und drücke die trennende Ebene entlang der Blickrichtung zusammen. Das Blatt kollabiert zu einer Linie, ohne zu ändern, welche Punkte auf welcher Seite liegen.",
			lift: 1, camA: 0, camB: 0, persp: 1, plane: 1, squash: 1, fail: 0, labels: 1, project: 0, box: 0
		},
		{
			title: "Space collapses to a line",
			titleDe: "Der Raum kollabiert zu einer Linie",
			body: "Now collapse the whole space the same way. Every point keeps its side of the boundary, and the classifier becomes one threshold on a one-dimensional score: s = 0.",
			bodyDe: "Kollabiere jetzt den ganzen Raum auf dieselbe Weise. Jeder Punkt behält seine Seite der Grenze, und der Klassifikator wird zu einer Schwelle auf einem eindimensionalen Score: s = 0.",
			lift: 1, camA: 0, camB: 0, persp: 1, plane: 0, squash: 1, fail: 0, labels: 0, project: 1, box: 0
		},
		{
			title: "The dense layer in numbers",
			titleDe: "Die Dense-Schicht in Zahlen",
			body: "The lift is a small dense layer. It expands the two input coordinates into n hidden values, bends each with an activation, and projects them back to one height. Change n, the weight scale or the bias and watch the surface change. One neuron gives one smooth ridge; more neurons can carve a bowl.",
			bodyDe: "Die Anhebung ist eine kleine Dense-Schicht. Sie dehnt die beiden Eingabekoordinaten auf n verborgene Werte aus, biegt jeden mit einer Aktivierung und projiziert sie zurück auf eine Höhe. Ändere n, die Gewichtsskala oder den Bias und beobachte, wie sich die Fläche verändert. Ein Neuron ergibt einen glatten Grat; mehr Neuronen können eine Schüssel formen.",
			formula: "\\underbrace{x=\\begin{pmatrix}x_1\\\\x_2\\end{pmatrix}}_{\\text{input point}} \\quad \\underbrace{h=\\operatorname{act}(W_1x+b_1)}_{n\\text{ hidden neurons}} \\quad \\underbrace{z=W_2h+b_2}_{\\text{one height}}",
			formulaDe: "\\underbrace{x=\\begin{pmatrix}x_1\\\\x_2\\end{pmatrix}}_{\\text{Eingabepunkt}} \\quad \\underbrace{h=\\operatorname{act}(W_1x+b_1)}_{n\\text{ versteckte Neuronen}} \\quad \\underbrace{z=W_2h+b_2}_{\\text{eine Höhe}}",
			lift: 0, dense: 1, camA: 0, camB: 0, persp: 1, plane: 0, squash: 0, fail: 0, labels: 0, project: 0, box: 0
		},
		{
			title: "Back to one dimension",
			titleDe: "Zurück auf eine Dimension",
			body: "The dense layer assigns a score to every point. Project every point onto that score. If the core and the ring end up on opposite sides of s = 0, one threshold separates them. If not, this slide says so; change the weights and try again.",
			bodyDe: "Die Dense-Schicht ordnet jedem Punkt einen Score zu. Projiziere jeden Punkt auf diesen Score. Wenn Kern und Ring auf verschiedenen Seiten von s = 0 landen, trennt sie eine einzelne Schwelle. Wenn nicht, sagt dir die Folie das; ändere die Gewichte und versuche es erneut.",
			lift: 0, dense: 1, denseProject: 1, camA: 0, camB: 0, persp: 1, plane: 0, squash: 0, fail: 0, labels: 0, project: 1, box: 0
		}
	];

	let denseState = { neurons: 2, scale: 1.2, bias: 0, activation: "relu", w2Scale: 1.25, b2: 0 };
	let denseSeed = 7;
	let denseWeights = null;
	let denseMix = 0;
	let denseProjectMix = 0;
	let denseScoreMin = -1;
	let denseScoreMax = 1;
	let denseFormulaTimer = 0;
	let denseContour = [];

	function buildDenseWeights() {
		let seed = denseSeed || 1;
		const next = () => (seed = (seed * 1664525 + 1013904223) & 0x7fffffff) / 0x7fffffff;
		const n = Math.max(1, denseState.neurons);
		const W1 = [], b1 = [], W2 = [];
		for (let i = 0; i < n; i++) {
			const angle = (i / n) * TAU + (next() - 0.5) * 0.35;
			W1.push([Math.cos(angle) * denseState.scale, Math.sin(angle) * denseState.scale]);
			b1.push(denseState.bias + (next() - 0.5) * 0.12);
			W2.push((denseState.w2Scale || 1.25) / n);
		}
		denseWeights = { W1: W1, b1: b1, W2: W2, b2: denseState.b2 || 0 };
		rebuildDenseContour();
	}

	function rebuildDenseContour() {
		denseContour = [];
		if (!denseWeights) return;
		const N = 44, EXT = 1.12, step = (2 * EXT) / N;
		const sign = function (v) { return v >= 0 ? 1 : -1; };
		const edge = function (ax, ay, av, bx, by, bv) {
			const t = av / (av - bv);
			return { x: ax + (bx - ax) * t, y: ay + (by - ay) * t };
		};
		for (let i = 0; i < N; i++) {
			const x0 = -EXT + i * step, x1 = x0 + step;
			for (let j = 0; j < N; j++) {
				const y0 = -EXT + j * step, y1 = y0 + step;
				const v00 = denseHeight(x0, y0), v10 = denseHeight(x1, y0);
				const v11 = denseHeight(x1, y1), v01 = denseHeight(x0, y1);
				const pts = [];
				if (sign(v00) !== sign(v10)) pts.push(edge(x0, y0, v00, x1, y0, v10));
				if (sign(v10) !== sign(v11)) pts.push(edge(x1, y0, v10, x1, y1, v11));
				if (sign(v11) !== sign(v01)) pts.push(edge(x1, y1, v11, x0, y1, v01));
				if (sign(v01) !== sign(v00)) pts.push(edge(x0, y1, v01, x0, y0, v00));
				if (pts.length === 2) denseContour.push([pts[0], pts[1]]);
				else if (pts.length === 4) {
					const center = denseHeight((x0 + x1) / 2, (y0 + y1) / 2);
					if (sign(center) === sign(v00)) {
						denseContour.push([pts[0], pts[3]]);
						denseContour.push([pts[1], pts[2]]);
					} else {
						denseContour.push([pts[0], pts[1]]);
						denseContour.push([pts[2], pts[3]]);
					}
				}
			}
		}
	}

	function drawDenseContour(C, project, alpha) {
		if (alpha <= 0.01 || !denseContour.length || !separationInfo().separated) return;
		ctx.save();
		ctx.strokeStyle = C.axisZero;
		ctx.lineWidth = 2.4;
		ctx.globalAlpha = alpha;
		denseContour.forEach(function (seg) {
			const a = warp(seg[0].x, seg[0].y, 0, project);
			const b = warp(seg[1].x, seg[1].y, 0, project);
			ctx.beginPath();
			ctx.moveTo(a.X, a.Y);
			ctx.lineTo(b.X, b.Y);
			ctx.stroke();
		});
		ctx.restore();
	}

	function denseHeight(x, y) {
		if (!denseWeights) return 0;
		let z = denseWeights.b2;
		for (let i = 0; i < denseWeights.W1.length; i++) {
			const pre = denseWeights.W1[i][0] * x + denseWeights.W1[i][1] * y + denseWeights.b1[i];
			const h = denseState.activation === "relu" ? Math.max(0, pre) : (denseState.activation === "sigmoid" ? 1 / (1 + Math.exp(-pre)) : Math.tanh(pre));
			z += denseWeights.W2[i] * h;
		}
		return z;
	}

	function updateDenseScoreRange() {
		let min = Infinity, max = -Infinity;
		PTS.forEach(function (p) {
			const v = denseHeight(p.x, p.y);
			if (v < min) min = v;
			if (v > max) max = v;
		});
		if (!isFinite(min) || !isFinite(max)) { min = -1; max = 1; }
		if (Math.abs(max - min) < 1e-6) { min -= 1; max += 1; }
		denseScoreMin = min;
		denseScoreMax = max;
	}

	function axisScoreX(score) {
		if (denseProjectMix <= 0.001) return sx(score);
		const min = lerp(SMIN, denseScoreMin, denseProjectMix);
		const max = lerp(SMAX, denseScoreMax, denseProjectMix);
		return AX_L + (AX_R - AX_L) * clamp((score - min) / (max - min || 1), 0, 1);
	}

	function separationInfo() {
		if (!denseWeights) buildDenseWeights();
		const scored = PTS.map(function (p) { return { v: denseHeight(p.x, p.y), c: p.c }; })
			.sort(function (a, b) { return a.v - b.v; });
		const first = scored[0].c;
		const last = scored[scored.length - 1].c;
		let split = 0;
		while (split < scored.length && scored[split].c === first) split++;
		const monotone = first !== last && scored.slice(split).every(function (o) { return o.c === last; });
		let best = -1, bestThreshold = 0;
		for (let i = 1; i < scored.length; i++) {
			const threshold = (scored[i - 1].v + scored[i].v) / 2;
			let correct = 0;
			scored.forEach(function (o) {
				const predicted = o.v <= threshold ? first : last;
				if (predicted === o.c) correct++;
			});
			if (correct > best) { best = correct; bestThreshold = threshold; }
		}
		const threshold = monotone && split > 0 ? (scored[split - 1].v + scored[split].v) / 2 : bestThreshold;
		return {
			separated: monotone && split > 0,
			threshold: threshold,
			wrong: scored.length - best,
			total: scored.length
		};
	}

	function separationStatusLines() {
		const info = separationInfo();
		const threshold = info.threshold.toFixed(2);
		if (info.separated) {
			return DE
				? ["Linear trennbar: ja (s = " + threshold + ")."]
				: ["Linearly separable: yes (s = " + threshold + ")."];
		}
		return DE
			? ["Noch nicht linear trennbar: " + info.wrong + "/" + info.total + " falsch.", "Spiele mit den Reglern."]
			: ["Not linearly separable yet: " + info.wrong + "/" + info.total + " wrong.", "Play with the controls."];
	}

	function updateSeparationBox() {
		const info = separationInfo();
		const lines = separationStatusLines();
		const fallback = info.separated
			? (DE ? "Linear trennbar: ja." : "Linearly separable: yes.")
			: (DE ? "Noch nicht linear trennbar." : "Not linearly separable yet.");
		const body = lines && lines.length ? lines.join(" ") : fallback;
		const text = (info.separated ? "✓ " : "") + body;
		const el = document.getElementById("ism-separation-box");
		if (el) {
			el.textContent = text;
			el.classList.toggle("is-ok", info.separated);
		}
		let overlay = document.getElementById("ism-canvas-status");
		if (!overlay && wrap) {
			overlay = document.createElement("div");
			overlay.id = "ism-canvas-status";
			overlay.className = "ism-canvas-status";
			overlay.setAttribute("aria-live", "polite");
			wrap.appendChild(overlay);
		}
		if (overlay) {
			const visible = cur === 7 || cur === 8;
			overlay.hidden = !visible;
			overlay.textContent = text;
			overlay.classList.toggle("is-ok", info.separated);
			overlay.setAttribute("data-separation", info.separated ? "ok" : "fail");
		}
		if (wrap) wrap.setAttribute("data-separation", info.separated ? "ok" : "fail");
		updateNextButtonGate();
	}

	function updateNextButtonGate() {
		const nextBtn = copyEl("ism-next");
		if (!nextBtn) return;
		const blocked = (cur === 7 && !separationInfo().separated);
		nextBtn.disabled = blocked;
		nextBtn.setAttribute("aria-disabled", String(blocked));
		if (cur === 7 && !separationInfo().separated) {
			nextBtn.title = DE ? "Erst wenn linear trennbar" : "Only when linearly separable";
			nextBtn.textContent = DE ? "Weiter →" : "Next →";
		} else if (cur === SCENES.length - 1) {
			nextBtn.removeAttribute("title");
			nextBtn.textContent = DE ? "Nächste Folie →" : "Next slide →";
		} else {
			nextBtn.removeAttribute("title");
			nextBtn.textContent = DE ? "Weiter →" : "Next →";
		}
	}

	function updateCanvasStatusAttributes() {
		if (!(cur >= 7 || prevIdx >= 7)) return;
		const lines = separationStatusLines();
		const info = separationInfo();
		const canvasEl = document.getElementById("ism-canvas");
		if (!canvasEl) return;
		canvasEl.setAttribute("data-separation", info.separated ? "ok" : "fail");
		canvasEl.setAttribute("data-separation-message", lines.join(" "));
	}
	function liftPoint(x, y, lift) {
		const p = LIFT(x, y, lift);
		if (denseMix > 0.0001) p.z += denseMix * denseHeight(x, y);
		return p;
	}

	const PRESET_ORDER = ["bowl", "ridge", "saddle", "smooth", "separator"];
	const DENSE_PRESETS = {
		bowl: { neurons: 2, scale: 1.2, bias: 0, activation: "relu", seed: 7, w2Scale: 1.25, b2: 0 },
		ridge: { neurons: 1, scale: 1.6, bias: -0.2, activation: "relu", seed: 3, w2Scale: 1.25, b2: 0 },
		saddle: { neurons: 4, scale: 1.5, bias: 0.1, activation: "relu", seed: 11, w2Scale: 1.25, b2: 0 },
		smooth: { neurons: 2, scale: 1.2, bias: 0, activation: "tanh", seed: 7, w2Scale: 1.25, b2: 0 },
		separator: { neurons: 8, scale: 1.4, bias: -0.84, activation: "relu", seed: 7, w2Scale: 8, b2: -0.2 }
	};

	function denseFormulas() {
		if (!denseWeights) buildDenseWeights();
		const n = denseWeights.W1.length;
		const act = denseState.activation === "relu" ? "\\operatorname{ReLU}" : (denseState.activation === "sigmoid" ? "\\operatorname{sigmoid}" : "\\tanh");
		const xvec = "\\begin{pmatrix}x_1\\\\x_2\\end{pmatrix}";
		const layer = DE
			? "\\underbrace{\\begin{aligned} a &= \\underbrace{W_1 " + xvec + " + b_1}_{\\text{Schicht 1}} \\\\ h &= \\underbrace{" + act + "(a)}_{\\text{Aktivierung}} \\\\ z &= \\underbrace{W_2 h + b_2}_{\\text{Schicht 2, eine Dimension}} \\end{aligned}}_{\\text{das MLP macht aus einem Punkt eine Höhe}}"
			: "\\underbrace{\\begin{aligned} a &= \\underbrace{W_1 " + xvec + " + b_1}_{\\text{layer 1}} \\\\ h &= \\underbrace{" + act + "(a)}_{\\text{activation}} \\\\ z &= \\underbrace{W_2 h + b_2}_{\\text{layer 2, one dimension}} \\end{aligned}}_{\\text{the MLP maps a point to one height}}";
		const back = "\\underbrace{s(x,y) = b_2 + \\sum_{i=1}^{" + n + "} \\underbrace{W_{2i}\\,\\," + act + "\\!\\left(W_{1i,1}\\,x + W_{1i,2}\\,y + b_{1i}\\right)}_{\\text{" + (DE ? "Einheit" : "unit") + " } i}}_{\\text{" + (DE ? "Rückprojektion auf einen Score" : "back-projection to one score") + "}}";
		return [layer, back];
	}

	function weightInput(kind, i, j, value, label) {
		const data = 'data-w="' + kind + '" data-i="' + i + '" data-j="' + j + '"';
		const aria = DE ? ("Gewicht " + label) : label;
		const sliderValue = Math.max(-5, Math.min(5, value)).toFixed(2);
		return '<span class="ism-weight-cell">' +
			'<input class="ism-weight-input" type="number" step="0.0001" ' + data +
			'" value="' + value.toFixed(4) + '" aria-label="' + aria + '">' +
			'<input class="ism-weight-slider" type="range" min="-5" max="5" step="0.01" ' + data +
			'" value="' + sliderValue + '" aria-label="' + aria + '">' +
			'</span>';
	}

	function weightEditorHtml() {
		if (!denseWeights) buildDenseWeights();
		const n = denseWeights.W1.length;
		let w1 = '<span class="ism-matrix-grid" style="grid-template-columns:repeat(2,auto)">';
		for (let i = 0; i < n; i++) {
			w1 += weightInput("W1", i, 0, denseWeights.W1[i][0], "W1 row " + (i + 1) + " column 1");
			w1 += weightInput("W1", i, 1, denseWeights.W1[i][1], "W1 row " + (i + 1) + " column 2");
		}
		w1 += "</span>";
		let b1 = '<span class="ism-matrix-grid" style="grid-template-columns:repeat(1,auto)">';
		for (let i = 0; i < n; i++) b1 += weightInput("b1", i, 0, denseWeights.b1[i], "b1 row " + (i + 1));
		b1 += "</span>";
		let w2 = '<span class="ism-matrix-grid" style="grid-template-columns:repeat(' + n + ',auto)">';
		for (let i = 0; i < n; i++) w2 += weightInput("W2", i, 0, denseWeights.W2[i], "W2 column " + (i + 1));
		w2 += "</span>";
		const b2 = weightInput("b2", 0, 0, denseWeights.b2, "b2");
		const paren = (inner) => '<span class="ism-matrix-paren" aria-hidden="true">(</span>' + inner + '<span class="ism-matrix-paren" aria-hidden="true">)</span>';
		return '<div class="ism-weight-block"><span class="ism-weight-label">W₁ =</span>' + paren(w1) + '</div>' +
			'<div class="ism-weight-block"><span class="ism-weight-label">b₁ =</span>' + paren(b1) + '</div>' +
			'<div class="ism-weight-block"><span class="ism-weight-label">W₂ =</span>' + paren(w2) + '</div>' +
			'<div class="ism-weight-block"><span class="ism-weight-label">b₂ =</span>' + paren('<span class="ism-matrix-grid" style="grid-template-columns:repeat(1,auto)">' + b2 + '</span>') + '</div>';
	}

	function bindWeightEditor(host) {
		host.querySelectorAll("input[data-w]").forEach(function (input) {
			input.addEventListener("input", function () {
				const value = parseFloat(input.value);
				if (!isFinite(value)) return;
				const kind = input.dataset.w;
				const i = parseInt(input.dataset.i, 10) || 0;
				const j = parseInt(input.dataset.j, 10) || 0;
				if (kind === "W1") denseWeights.W1[i][j] = value;
				else if (kind === "b1") denseWeights.b1[i] = value;
				else if (kind === "W2") denseWeights.W2[i] = value;
				else if (kind === "b2") denseWeights.b2 = value;
				const cell = input.closest(".ism-weight-cell");
				const number = cell ? cell.querySelector(".ism-weight-input") : null;
				const slider = cell ? cell.querySelector(".ism-weight-slider") : null;
				if (input === number && slider) slider.value = String(Math.max(-5, Math.min(5, value)));
				if (input === slider && number) number.value = value.toFixed(4);
				const preset = document.getElementById("ism-dense-preset");
				if (preset) preset.value = "custom";
				updateSeparationBox();
				requestDraw();
			});
		});
	}

	function scheduleDenseFormulas() {
		clearTimeout(denseFormulaTimer);
		denseFormulaTimer = setTimeout(renderDenseFormulas, 80);
	}

	function renderDenseFormulas() {
		const host = document.getElementById("ism-formulas");
		if (!host) return;
		const formulas = denseFormulas();
		host.innerHTML = "";
		const addFormula = function (tex) {
			const el = document.createElement("div");
			el.className = "ism-formula prose-math";
			el.setAttribute("data-tex", tex);
			el.setAttribute("data-tex-display", "true");
			host.appendChild(el);
		};
		addFormula(formulas[0]);
		const status = document.createElement("p");
		status.className = "ism-separation-box";
		status.id = "ism-separation-box";
		host.appendChild(status);
		const editor = document.createElement("div");
		editor.className = "ism-weight-editor";
		editor.innerHTML = weightEditorHtml();
		host.appendChild(editor);
		addFormula(formulas[1]);
		bindWeightEditor(editor);
		if (window.TM && typeof TM.typesetMath === "function") TM.typesetMath(host);
		updateSeparationBox();
	}

	const ease = u => u * u * u * (u * (u * 6 - 15) + 10);
	const lerp = (a, b, u) => a + (b - a) * u;
	const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
	const sub = (t, a, b) => ease(clamp((t - a) / (b - a), 0, 1));

	function palette() {
		const c = TM.colors();
		return {
			text: c.ink,
			sub: c.inkSoft,
			muted: c.muted,
			border: c.lineStrong,
			grid: c.muted,
			inner: c.dark ? "#d58a8a" : "#b23a48",
			outer: c.blue,
			plane: c.gold,
			planeStrong: c.petrol,
			axis: c.faint,
			axisZero: c.petrol
		};
	}

	function copyEl(id) {
		return document.getElementById(id);
	}

	function buildSceneStack() {
		const copy = copyEl("ism-copy");
		if (!copy) return;
		copy.innerHTML = "";
		SCENES.forEach(function (scene, i) {
			const item = document.createElement("div");
			item.className = "ism-scene" + (i === 0 ? " is-active" : "");
			const title = document.createElement("div");
			title.className = "ism-title";
			title.textContent = DE && scene.titleDe ? scene.titleDe : scene.title;
			const body = document.createElement("div");
			body.className = "ism-body";
			body.textContent = DE && scene.bodyDe ? scene.bodyDe : scene.body;
			item.appendChild(title);
			item.appendChild(body);
			if (scene.formula) {
				const formula = document.createElement("div");
				formula.className = "ism-formula prose-math";
				formula.setAttribute("data-tex", DE && scene.formulaDe ? scene.formulaDe : scene.formula);
				if (scene.formulaDe) formula.setAttribute("data-tex-de", scene.formulaDe);
				formula.setAttribute("data-tex-display", "true");
				item.appendChild(formula);
			}
			copy.appendChild(item);
		});
		if (window.TM && typeof TM.typesetMath === "function") TM.typesetMath(copy);
	}

	function fitCopyHeight() {
		const copy = copyEl("ism-copy");
		if (!copy) return;
		const scenes = Array.prototype.slice.call(copy.querySelectorAll(".ism-scene"));
		if (!scenes.length) return;
		const previous = copy.style.minHeight;
		copy.style.minHeight = "0px";
		const height = Math.max.apply(null, scenes.map(function (el) { return el.getBoundingClientRect().height; }));
		copy.style.minHeight = height ? (Math.ceil(height) + 1) + "px" : previous;
	}

	function renderCopy() {
		const counter = copyEl("ism-counter");
		if (counter) counter.textContent = (cur + 1) + " / " + SCENES.length;

		const copy = copyEl("ism-copy");
		if (copy) {
			copy.querySelectorAll(".ism-scene").forEach(function (el, i) {
				el.classList.toggle("is-active", i === cur);
			});
		}
		const denseControls = document.getElementById("ism-dense-controls");
		if (denseControls) denseControls.hidden = cur !== 7 && cur !== 8;
		const stage = document.getElementById("ism-stage");
		if (stage) stage.classList.toggle("is-dense", cur === 7 || cur === 8);
		if (cur === 7) renderDenseFormulas();
		updateSeparationBox();

		const dots = copyEl("ism-dots");
		if (!dots) return;
		Array.prototype.forEach.call(dots.children, (dot, i) => {
			dot.classList.toggle("is-active", i === cur);
			dot.setAttribute("aria-current", i === cur ? "step" : "false");
		});
	}

	function setStep(n) {
		n = clamp(n, 0, SCENES.length - 1);
		if (n === cur) return;
		prevIdx = cur;
		cur = n;
		t0 = performance.now();
		renderCopy();
		setTimeout(fitCopyHeight, 0);
		requestDraw();
	}

	function next() {
		if (cur === 7 || cur === 8) {
			const presetEl = document.getElementById("ism-dense-preset");
			if (presetEl) {
				const at = PRESET_ORDER.indexOf(presetEl.value);
				const nextPreset = at < 0 ? "separator" : PRESET_ORDER[at + 1];
				if (nextPreset) {
					presetEl.value = nextPreset;
					presetEl.dispatchEvent(new Event("change", { bubbles: true }));
					return;
				}
			}
		}
		if (cur === 7 && !separationInfo().separated) return;
		if (cur === SCENES.length - 1) {
			if (window.LearnSys && window.LearnSys.state && window.LearnSys.go) {
				const st = window.LearnSys.state();
				window.LearnSys.go(st.day, st.step + 1);
			}
			return;
		}
		setStep(cur + 1);
	}

	function prev() {
		setStep(cur - 1);
	}

	function buildDots() {
		const dots = copyEl("ism-dots");
		if (!dots) return;
		SCENES.forEach((scene, i) => {
			const dot = document.createElement("button");
			dot.type = "button";
			dot.className = "ism-dot";
			const label = (DE && scene.titleDe) ? scene.titleDe : scene.title;
			dot.title = label;
			dot.setAttribute("aria-label", (DE ? "Folie " : "Slide ") + (i + 1) + ": " + label);
			dot.addEventListener("click", function () { setStep(i); });
			dots.appendChild(dot);
		});
	}

	function base() {
		return Math.min(W, H) * 0.30;
	}

	function proj(p) {
		const A = viewA + dragA;
		const B = viewB + dragB;
		const scale = base() * FIT;
		const x = p.x * Math.cos(A) - p.y * Math.sin(A);
		const y = p.x * Math.sin(A) + p.y * Math.cos(A);
		const y2 = -y * Math.sin(B) + p.z * Math.cos(B);
		const z2 = y * Math.cos(B) + p.z * Math.sin(B);
		const d = 4.6;
		const k = persp < 0.02 ? 1 : d / (d + z2 * 0.80 * persp);
		return { X: W / 2 + x * scale * k, Y: H / 2 - y2 * scale * k + YOFF, d: z2, k: k };
	}

	let persp = 1;
	let AX_Y = 0, AX_L = 0, AX_R = 0;

	function axisGeom() {
		AX_Y = H * 0.80;
		const scale = base();
		AX_L = W / 2 - scale * 1.5;
		AX_R = W / 2 + scale * 1.5;
	}

	const sx = score => AX_L + (AX_R - AX_L) * clamp((score - SMIN) / (SMAX - SMIN), 0, 1);

	function warp(x, y, lift, project) {
		const p = proj(liftPoint(x, y, lift));
		if (project < 0.0005) return { X: p.X, Y: p.Y, k: p.k };
		const score = lerp(SCORE(x, y), denseHeight(x, y), denseProjectMix);
		const tx = axisScoreX(score);
		const ty = AX_Y - 46 * (1 - project);
		const arc = Math.sin(project * Math.PI) * 34;
		return {
			X: lerp(p.X, tx, project),
			Y: lerp(p.Y, ty, project) - arc,
			k: lerp(p.k, 1, project)
		};
	}

	function drawBox(alpha, C) {
		if (alpha < 0.01) return;
		const E = 1.12, ZT = 1.35, G = 10;

		ctx.globalAlpha = alpha * 0.40;
		ctx.strokeStyle = C.axis;
		ctx.lineWidth = 0.9;
		for (let i = 0; i <= G; i++) {
			const v = -E + 2 * E * i / G;
			let p = proj({ x: -E, y: v, z: 0 });
			let q = proj({ x: E, y: v, z: 0 });
			ctx.beginPath();
			ctx.moveTo(p.X, p.Y);
			ctx.lineTo(q.X, q.Y);
			ctx.stroke();
			p = proj({ x: v, y: -E, z: 0 });
			q = proj({ x: v, y: E, z: 0 });
			ctx.beginPath();
			ctx.moveTo(p.X, p.Y);
			ctx.lineTo(q.X, q.Y);
			ctx.stroke();
		}

		ctx.globalAlpha = alpha * 0.35;
		ctx.strokeStyle = C.axis;
		ctx.setLineDash([2, 6]);
		[0.45, 0.90].forEach(zv => {
			const s = 0.42;
			const r = [
				proj({ x: -s, y: -s, z: zv }),
				proj({ x: s, y: -s, z: zv }),
				proj({ x: s, y: s, z: zv }),
				proj({ x: -s, y: s, z: zv })
			];
			ctx.beginPath();
			ctx.moveTo(r[0].X, r[0].Y);
			for (let i = 1; i < 4; i++) ctx.lineTo(r[i].X, r[i].Y);
			ctx.closePath();
			ctx.stroke();
		});
		ctx.setLineDash([]);

		ctx.globalAlpha = alpha * 0.85;
		ctx.strokeStyle = C.sub;
		ctx.lineWidth = 1.6;
		const o = proj({ x: 0, y: 0, z: 0 });
		const tp = proj({ x: 0, y: 0, z: ZT });
		ctx.beginPath();
		ctx.moveTo(o.X, o.Y);
		ctx.lineTo(tp.X, tp.Y);
		ctx.stroke();

		ctx.fillStyle = C.sub;
		ctx.beginPath();
		ctx.moveTo(tp.X, tp.Y - 1);
		ctx.lineTo(tp.X - 4.5, tp.Y + 11);
		ctx.lineTo(tp.X + 4.5, tp.Y + 11);
		ctx.closePath();
		ctx.fill();

		ctx.lineWidth = 1.2;
		[0.45, 0.90].forEach(zv => {
			const m = proj({ x: 0, y: 0, z: zv });
			ctx.beginPath();
			ctx.moveTo(m.X - 5, m.Y);
			ctx.lineTo(m.X + 5, m.Y);
			ctx.stroke();
		});
		ctx.font = "italic 16px Georgia, serif";
		ctx.fillStyle = C.sub;
		ctx.fillText("z", tp.X + 12, tp.Y + 5);
		ctx.globalAlpha = 1;
	}

	function drawAxis(alpha, C) {
		if (alpha < 0.01) return;
		ctx.globalAlpha = alpha;
		ctx.strokeStyle = C.axis;
		ctx.lineWidth = 1.6;
		ctx.beginPath();
		ctx.moveTo(AX_L, AX_Y);
		ctx.lineTo(AX_R, AX_Y);
		ctx.stroke();
		for (let i = 0; i <= 10; i++) {
			const X = lerp(AX_L, AX_R, i / 10);
			ctx.beginPath();
			ctx.moveTo(X, AX_Y - 4);
			ctx.lineTo(X, AX_Y + 4);
			ctx.stroke();
		}
		const denseAxis = denseProjectMix > 0.5;
		const threshold = denseAxis ? separationInfo().threshold : 0;
		const TX = axisScoreX(threshold);
		ctx.strokeStyle = C.axisZero;
		ctx.lineWidth = 2.6;
		ctx.beginPath();
		ctx.moveTo(TX, AX_Y - 36);
		ctx.lineTo(TX, AX_Y + 36);
		ctx.stroke();

		const narrow = (AX_R - AX_L) < 380;
		ctx.textAlign = "center";
		ctx.fillStyle = C.planeStrong;
		ctx.font = "13px Georgia, serif";
		ctx.fillText("s = " + threshold.toFixed(2), TX, AX_Y + 58);
		ctx.font = "600 13px system-ui, sans-serif";
		if (denseAxis) {
			const info = separationInfo();
			const coreLeft = info.coreMin < threshold;
			ctx.fillStyle = C.inner;
			ctx.fillText(DE ? "Kern" : "core", coreLeft ? lerp(AX_L, TX, 0.40) : lerp(TX, AX_R, 0.55), AX_Y + 58);
			ctx.fillStyle = C.outer;
			ctx.fillText(DE ? "Ring" : "ring", coreLeft ? lerp(TX, AX_R, 0.55) : lerp(AX_L, TX, 0.40), AX_Y + 58);
		} else {
			ctx.fillStyle = C.inner;
			ctx.fillText(DE ? (narrow ? "s < 0   Kern" : "s < 0   innerer Kern") : (narrow ? "s < 0   core" : "s < 0   inner core"), lerp(AX_L, TX, 0.40), AX_Y + 58);
			ctx.fillStyle = C.outer;
			ctx.fillText(DE ? (narrow ? "s > 0   Ring" : "s > 0   äußerer Ring") : (narrow ? "s > 0   ring" : "s > 0   outer ring"), lerp(TX, AX_R, 0.55), AX_Y + 58);
		}
		ctx.textAlign = "left";
		ctx.globalAlpha = 1;
	}

	function gridSegments(lift, project) {
		const N = 14, EXT = 1.12, RES = 64;
		const out = [];
		for (let i = 0; i <= N; i++) {
			const v = -EXT + 2 * EXT * i / N;
			for (const swap of [0, 1]) {
				const pts = [];
				for (let j = 0; j <= RES; j++) {
					const u = -EXT + 2 * EXT * j / RES;
					pts.push(warp(swap ? v : u, swap ? u : v, lift, project));
				}
				out.push(pts);
			}
		}
		return out;
	}

	function drawFailedLines(alpha, C) {
		if (alpha < 0.01) return;
		ctx.globalAlpha = alpha * 0.7;
		ctx.lineWidth = 1.6;
		ctx.strokeStyle = C.muted;
		ctx.setLineDash([5, 5]);
		for (let k = 0; k < 5; k++) {
			const t = k * 0.63 + 0.2;
			const p = proj({ x: Math.cos(t) * -1.2, y: Math.sin(t) * -1.2, z: 0 });
			const q = proj({ x: Math.cos(t) * 1.2, y: Math.sin(t) * 1.2, z: 0 });
			ctx.beginPath();
			ctx.moveTo(p.X, p.Y);
			ctx.lineTo(q.X, q.Y);
			ctx.stroke();
		}
		ctx.setLineDash([]);
		ctx.globalAlpha = 1;
	}

	function drawShadow(alpha, C) {
		if (alpha < 0.01) return;
		ctx.globalAlpha = alpha * 0.30;
		ctx.fillStyle = C.text;
		PTS.forEach(p => {
			const s = proj({ x: p.x, y: p.y, z: 0 });
			ctx.beginPath();
			ctx.ellipse(s.X, s.Y, 3.2 * s.k, 1.5 * s.k, 0, 0, TAU);
			ctx.fill();
		});
		ctx.globalAlpha = 1;
	}

	function planeRows(plane, squash) {
		const E = 0.92, M = 7, rows = [];
		for (let i = 0; i <= M; i++) {
			const yv = (-E + 2 * E * i / M) * (1 - squash);
			const row = [];
			for (let j = 0; j <= M; j++) {
				row.push(proj({ x: -E + 2 * E * j / M, y: yv, z: PLANE_Z }));
			}
			rows.push(row);
		}
		return rows;
	}

	function drawPlane(it, C) {
		const R = it.rows;
		const M = R.length - 1;

		ctx.globalAlpha = it.a * 0.17 * (1 - it.squash);
		ctx.fillStyle = C.plane;
		ctx.beginPath();
		ctx.moveTo(R[0][0].X, R[0][0].Y);
		for (let j = 1; j <= M; j++) ctx.lineTo(R[0][j].X, R[0][j].Y);
		for (let j = M; j >= 0; j--) ctx.lineTo(R[M][j].X, R[M][j].Y);
		ctx.closePath();
		ctx.fill();

		ctx.globalAlpha = it.a * 0.42 * (1 - it.squash);
		ctx.strokeStyle = C.plane;
		ctx.lineWidth = 1;
		for (let i = 0; i <= M; i++) {
			ctx.beginPath();
			R[i].forEach((p, j) => j ? ctx.lineTo(p.X, p.Y) : ctx.moveTo(p.X, p.Y));
			ctx.stroke();
		}
		for (let j = 0; j <= M; j++) {
			ctx.beginPath();
			for (let i = 0; i <= M; i++) {
				const p = R[i][j];
				i ? ctx.lineTo(p.X, p.Y) : ctx.moveTo(p.X, p.Y);
			}
			ctx.stroke();
		}

		const mid = R[Math.floor(M / 2)];
		ctx.globalAlpha = it.a * (0.45 + 0.55 * it.squash);
		ctx.lineWidth = 1.4 + 2.4 * it.squash;
		ctx.strokeStyle = C.planeStrong;
		ctx.beginPath();
		mid.forEach((p, j) => j ? ctx.lineTo(p.X, p.Y) : ctx.moveTo(p.X, p.Y));
		ctx.stroke();
		ctx.globalAlpha = 1;
	}

	function drawClassLabels(alpha, C) {
		if (alpha < 0.01) return;
		const c0 = proj({ x: 0, y: 0, z: PLANE_Z });
		const LX = W - 18;
		ctx.globalAlpha = alpha;
		ctx.textAlign = "right";
		ctx.font = "600 14px system-ui, sans-serif";
		ctx.fillStyle = C.outer;
		ctx.fillText(DE ? "Klasse B — äußerer Ring" : "Class B — outer ring", LX, c0.Y - 58);
		ctx.fillStyle = C.inner;
		ctx.fillText(DE ? "Klasse A — innerer Kern" : "Class A — inner core", LX, c0.Y + 66);
		ctx.fillStyle = C.planeStrong;
		ctx.font = "13px Georgia, serif";
		ctx.fillText(DE ? "Trennebene" : "separating plane", LX, c0.Y + 4);
		ctx.textAlign = "left";
		ctx.globalAlpha = 1;
	}

	function draw(raw) {
		if (!ctx || !W || !H) return;

		const a = SCENES[prevIdx];
		const b = SCENES[cur];
		const u = ease(raw);

		const lift = lerp(a.lift, b.lift, u);
		denseMix = lerp(a.dense || 0, b.dense || 0, u);
		denseProjectMix = lerp(a.denseProject || 0, b.denseProject || 0, u);
		if (denseProjectMix > 0.001) updateDenseScoreRange();
		persp = lerp(a.persp, b.persp, u);
		viewA = lerp(a.camA, b.camA, u);
		viewB = lerp(a.camB, b.camB, u);

		const flat = 1 - clamp(Math.abs(viewB + dragB) / (Math.PI / 2), 0, 1);
		FIT = lerp(1, 0.34, flat);
		YOFF = lerp(0, H * 0.10, flat);

		const planeAlpha = lerp(a.plane, b.plane, u);
		const squash = lerp(a.squash, b.squash, u);
		const fail = lerp(a.fail, b.fail, u);
		const labels = lerp(a.labels, b.labels, u);
		const box = lerp(a.box, b.box, u);

		const projectRaw = lerp(a.project, b.project, raw);
		const forward = b.project > a.project;
		const project = forward ? sub(projectRaw, 0, 1) : 1 - sub(1 - projectRaw, 0, 1);
		const axisAlpha = forward ? sub(projectRaw, 0.05, 0.5) : 1 - sub(1 - projectRaw, 0.05, 0.5);

		const C = palette();
		ctx.clearRect(0, 0, W, H);
		axisGeom();

		drawBox(box, C);
		drawAxis(axisAlpha, C);

		const gridAlpha = (0.22 + 0.24 * lift) * (1 - project * 0.35);
		ctx.lineWidth = 1;
		ctx.strokeStyle = C.grid;
		ctx.globalAlpha = gridAlpha;
		gridSegments(lift, project).forEach(segment => {
			ctx.beginPath();
			segment.forEach((p, i) => i ? ctx.lineTo(p.X, p.Y) : ctx.moveTo(p.X, p.Y));
			ctx.stroke();
		});
		ctx.globalAlpha = 1;

		drawFailedLines(fail, C);
		if (box > 0.01 && lift < 0.5) drawShadow(box, C);

		const items = [];
		PTS.forEach(p => {
			const P = warp(p.x, p.y, lift, project);
			const depth = proj(liftPoint(p.x, p.y, lift)).d;
			items.push({ type: "point", depth: depth, at: P, c: p.c });
		});

		if (planeAlpha > 0.01) {
			items.push({
				type: "plane",
				depth: PLANE_Z,
				rows: planeRows(planeAlpha, squash),
				a: planeAlpha,
				squash: squash
			});
		}

		items.sort((p, q) => p.depth - q.depth);
		items.forEach(item => {
			if (item.type === "plane") {
				drawPlane(item, C);
				return;
			}
			const r = (2.8 + 0.7 * item.at.k) * item.at.k;
			ctx.beginPath();
			ctx.arc(item.at.X, item.at.Y, r, 0, TAU);
			ctx.fillStyle = item.c ? C.outer : C.inner;
			ctx.globalAlpha = 0.55 + 0.45 * item.at.k;
			ctx.fill();
			ctx.globalAlpha = 1;
		});

		drawClassLabels(labels, C);
		drawDenseContour(C, project, clamp(denseMix, 0, 1));
		updateCanvasStatusAttributes();
	}

	function resizeCanvas() {
		if (!wrap || !canvas) return;
		const rect = wrap.getBoundingClientRect();
		if (rect.width < 40 || rect.height < 40) return;
		const dpr = Math.min(window.devicePixelRatio || 1, 2);
		if (Math.abs(rect.width - W) < 0.5 && Math.abs(rect.height - H) < 0.5 && dpr === DPR) return;
		W = rect.width;
		H = rect.height;
		DPR = dpr;
		canvas.width = Math.round(W * DPR);
		canvas.height = Math.round(H * DPR);
		ctx = canvas.getContext("2d");
		if (ctx) ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
	}

	function frame(now) {
		rafId = 0;
		if (!visible) return;
		resizeCanvas();
		const raw = clamp((now - t0) / DUR, 0, 1);
		draw(raw);
		if (raw < 1) requestDraw();
	}

	function requestDraw() {
		if (!visible || rafId) return;
		rafId = requestAnimationFrame(frame);
	}

	function endDrag(event) {
		if (!dragging) return;
		dragging = false;
		if (canvas) {
			canvas.classList.remove("is-dragging");
			if (canvas.hasPointerCapture && canvas.hasPointerCapture(event.pointerId)) {
				canvas.releasePointerCapture(event.pointerId);
			}
		}
		requestDraw();
	}

	function bindDrag() {
		if (!canvas) return;
		canvas.addEventListener("pointerdown", event => {
			dragging = true;
			lastX = event.clientX;
			lastY = event.clientY;
			canvas.classList.add("is-dragging");
			if (canvas.setPointerCapture) canvas.setPointerCapture(event.pointerId);
		});
		canvas.addEventListener("pointermove", event => {
			if (!dragging) return;
			dragA += (event.clientX - lastX) * 0.006;
			dragB += (event.clientY - lastY) * 0.005;
			lastX = event.clientX;
			lastY = event.clientY;
			requestDraw();
		});
		canvas.addEventListener("pointerup", endDrag);
		canvas.addEventListener("pointercancel", endDrag);
	}

	function observe() {
		visible = true;
		t0 = performance.now();
		requestDraw();
		if (!("IntersectionObserver" in window) || !wrap) {
			return;
		}
		const observer = new IntersectionObserver(entries => {
			visible = entries.some(entry => entry.isIntersecting);
			if (visible) {
				prevIdx = cur;
				t0 = performance.now();
				requestDraw();
			} else {
				if (rafId) {
					cancelAnimationFrame(rafId);
					rafId = 0;
				}
			}
		}, { rootMargin: "200px", threshold: 0.05 });
		observer.observe(wrap);
	}

	function buildDenseControls() {
		const box = document.getElementById("ism-dense-controls");
		if (!box || box.dataset.built) return;
		box.dataset.built = "1";
		box.innerHTML = (DE ? `
			<label>Preset <select id="ism-dense-preset">
				<option value="bowl" selected>Schüssel · 2 ReLU</option>
				<option value="ridge">Grat · 1 ReLU</option>
				<option value="saddle">Sattel · 4 ReLU</option>
				<option value="smooth">Weich · 2 tanh</option>
				<option value="separator">Trenner · 8 ReLU</option>
				<option value="custom">Eigene</option>
			</select></label>
			<label>n <input id="ism-dense-neurons" type="range" min="1" max="8" step="1" value="2"><output>2</output></label>
			<label>Skala <input id="ism-dense-scale" type="range" min="0.2" max="3" step="0.1" value="1.2"><output>1.2</output></label>
			<label>Bias <input id="ism-dense-bias" type="range" min="-2" max="2" step="0.1" value="0"><output>0.0</output></label>
			<label>Aktivierung <select id="ism-dense-activation"><option value="relu" selected>ReLU</option><option value="tanh">tanh</option><option value="sigmoid">sigmoid</option></select></label>
			<button type="button" id="ism-dense-resample">Neu</button>
			<span class="ism-dense-hint">Die Rückprojektion s(x,y) macht aus jedem Punkt einen Score. Eine Schwelle bei s=0 trennt die Klassen.</span>
		` : `
			<label>Preset <select id="ism-dense-preset">
				<option value="bowl" selected>Bowl · 2 ReLU</option>
				<option value="ridge">Ridge · 1 ReLU</option>
				<option value="saddle">Saddle · 4 ReLU</option>
				<option value="smooth">Smooth · 2 tanh</option>
				<option value="separator">Separator · 8 ReLU</option>
				<option value="custom">Custom</option>
			</select></label>
			<label>n <input id="ism-dense-neurons" type="range" min="1" max="8" step="1" value="2"><output>2</output></label>
			<label>Scale <input id="ism-dense-scale" type="range" min="0.2" max="3" step="0.1" value="1.2"><output>1.2</output></label>
			<label>Bias <input id="ism-dense-bias" type="range" min="-2" max="2" step="0.1" value="0"><output>0.0</output></label>
			<label>Activation <select id="ism-dense-activation"><option value="relu" selected>ReLU</option><option value="tanh">tanh</option><option value="sigmoid">sigmoid</option></select></label>
			<button type="button" id="ism-dense-resample">New</button>
			<span class="ism-dense-hint">The back-projection s(x,y) turns every point into one score. A threshold at s=0 separates the classes.</span>
		`);
		const neurons = box.querySelector("#ism-dense-neurons");
		const scale = box.querySelector("#ism-dense-scale");
		const bias = box.querySelector("#ism-dense-bias");
		const activation = box.querySelector("#ism-dense-activation");
		const preset = box.querySelector("#ism-dense-preset");
		const sync = function () {
			denseState.neurons = parseInt(neurons.value, 10) || 1;
			denseState.scale = parseFloat(scale.value) || 1;
			denseState.bias = parseFloat(bias.value) || 0;
			denseState.activation = activation.value;
			buildDenseWeights();
			neurons.nextElementSibling.textContent = String(denseState.neurons);
			scale.nextElementSibling.textContent = denseState.scale.toFixed(1);
			bias.nextElementSibling.textContent = denseState.bias.toFixed(1);
			scheduleDenseFormulas();
			updateSeparationBox();
			requestDraw();
		};
		const markCustom = function () { preset.value = "custom"; };
		neurons.addEventListener("input", function () { markCustom(); sync(); });
		scale.addEventListener("input", function () { markCustom(); sync(); });
		bias.addEventListener("input", function () { markCustom(); sync(); });
		activation.addEventListener("change", function () { markCustom(); sync(); });
		preset.addEventListener("change", function () {
			const p = DENSE_PRESETS[preset.value];
			if (!p) { sync(); return; }
			denseState.neurons = p.neurons;
			denseState.scale = p.scale;
			denseState.bias = p.bias;
			denseState.activation = p.activation;
			denseState.w2Scale = p.w2Scale == null ? 1.25 : p.w2Scale;
			denseState.b2 = p.b2 == null ? 0 : p.b2;
			denseSeed = p.seed;
			neurons.value = String(p.neurons);
			scale.value = String(p.scale);
			bias.value = String(p.bias);
			activation.value = p.activation;
			sync();
		});
		box.querySelector("#ism-dense-resample").addEventListener("click", function () {
			denseSeed = (denseSeed * 1664525 + 1013904223) & 0x7fffffff;
			preset.value = "custom";
			sync();
		});
		sync();
	}

	function init() {
		if (inited) return;
		wrap = document.getElementById("ism-wrap");
		canvas = document.getElementById("ism-canvas");
		if (!wrap || !canvas) return;
		inited = true;
		ctx = canvas.getContext("2d");
		buildDots();
		buildSceneStack();
		buildDenseControls();
		const panel = document.querySelector(".ism-panel");
		const denseBox = document.getElementById("ism-dense-controls");
		if (panel && denseBox && denseBox.parentNode !== panel) panel.appendChild(denseBox);
		renderCopy();
		fitCopyHeight();
		bindDrag();

		const nextBtn = copyEl("ism-next");
		const prevBtn = copyEl("ism-prev");
		if (nextBtn) {
			nextBtn.textContent = DE ? "Weiter →" : "Next →";
			nextBtn.setAttribute("aria-label", DE ? "Nächster Schritt" : "Next step");
			nextBtn.addEventListener("click", next);
		}
		if (prevBtn) {
			prevBtn.textContent = DE ? "← Zurück" : "← Back";
			prevBtn.setAttribute("aria-label", DE ? "Vorheriger Schritt" : "Previous step");
			prevBtn.addEventListener("click", prev);
		}
		const resetCamera = copyEl("ism-reset-camera");
		if (resetCamera) resetCamera.addEventListener("click", function () { dragA = 0; dragB = 0; requestDraw(); });
		window.addEventListener("tm:resetcamera", function () { dragA = 0; dragB = 0; requestDraw(); });

		window.addEventListener("resize", fitCopyHeight);
		window.addEventListener("resize", function () { updateSeparationBox(); requestDraw(); });
		window.addEventListener("tm:theme", requestDraw);
		window.addEventListener("tm:theme", updateSeparationBox);
		window.addEventListener("tm:resetcamera", updateSeparationBox);
		setInterval(function () {
			if (cur === 7 || cur === 8) {
				const overlay = document.getElementById("ism-canvas-status");
				if (!overlay || !overlay.textContent || !overlay.textContent.trim()) updateSeparationBox();
			}
		}, 700);
		if (document.fonts && document.fonts.ready) document.fonts.ready.then(fitCopyHeight);
		if (window.ResizeObserver) new ResizeObserver(requestDraw).observe(wrap);
		observe();
	}

	window.IntuitionSpaceMorph = {
		init: init,
		next: next,
		prev: prev,
		resize: function () {
			if (!inited) return;
			fitCopyHeight();
			requestDraw();
		},
		reset: () => setStep(0),
		state: () => ({ cur: cur, count: SCENES.length })
	};
	if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
	else init();
})();
