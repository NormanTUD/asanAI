"use strict";

/* =============================================================================
   Loss Landscape & Optimizer Trajectories — Blog module
   -----------------------------------------------------------------------------
   Single-neuron regression (one weight, one bias) so the loss surface
   $\mathcal{L}(w, b)$ fits in a 3-D plot. Four optimizers (SGD, Momentum,
   Adam, RMSProp), three activations (Linear, ReLU, Tanh), one learning
   rate. The widget renders:
     - a 3-D loss surface per optimizer with the trajectory drawn on top
     - a 2-D "fit vs. data" plot per optimizer
     - a single combined loss-vs-epoch curve with one line per optimizer
   All Plotly colours come from the blog's CSS variables (--mn-*) so the
   charts switch cleanly between light and dark mode.
   ============================================================================= */

const PLOT_DENSITY_STEP = 0.1;

const OPTIMIZER_INFO = {
	SGD:      { factory: (lr) => tf.train.sgd(lr),                  color: "#f43f5e", defaultLr: 0.05, dash: "solid",   symbol: "circle",      line3Dash: "solid",    marker3Symbol: "circle" },
	Momentum: { factory: (lr) => tf.train.momentum(lr, 0.9, false), color: "#84cc16", defaultLr: 0.05, dash: "dashdot", symbol: "diamond",     line3Dash: "dashdot", marker3Symbol: "diamond" },
	Adam:     { factory: (lr) => tf.train.adam(lr),                color: "#fb923c", defaultLr: 0.05, dash: "dash",    symbol: "square",      line3Dash: "dash",    marker3Symbol: "square" },
	RMSProp:  { factory: (lr) => tf.train.rmsprop(lr),             color: "#22d3ee", defaultLr: 0.01, dash: "dot",     symbol: "triangle-up", line3Dash: "dot",     marker3Symbol: "triangle-up" }
};

const state = {
	experimentRunning: false,
	stopRequested:     false,
	activation:        "linear",
	xs:                [],
	ys:                [],
	xMin:              0,
	xMax:              0,
	landscape:         { W: [], B: [], L: [] },
	lossHistory:       {},
	currentOptimizers: [],
	model:             { w: 0.1, b: 0.1, loss: null }
};

/* ── Theme helpers ───────────────────────────────────────────────────────── */

function llCssVar(name) {
	if (window.__MN_DARK && window.__MN_DARK.themeVar) {
		return window.__MN_DARK.themeVar(name);
	}
	return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

function tText()   { return llCssVar("--mn-text")          || "#3A2F25"; }
function tSubtle() { return llCssVar("--mn-text-secondary")|| "#5C5043"; }
function tGrid()   { return llCssVar("--mn-border")        || "#D8CFB6"; }
function tSurface(){ return llCssVar("--mn-surface")       || "#FDFAF1"; }
function tBg()     { return llCssVar("--mn-bg")            || "#FAF8F1"; }

function relayoutForTheme(plotId) {
	if (!document.getElementById(plotId)) return;
	const tc = tText(), gc = tGrid(), bg = tBg();
	Plotly.relayout(plotId, {
		"title.font.color":    tc,
		"paper_bgcolor":       "rgba(0,0,0,0)",
		"plot_bgcolor":        "rgba(0,0,0,0)",
		"xaxis.gridcolor":     gc,
		"xaxis.tickfont.color":tc,
		"xaxis.titlefont.color":tc,
		"yaxis.gridcolor":     gc,
		"yaxis.tickfont.color":tc,
		"yaxis.titlefont.color":tc,
		"legend.font.color":   tc
	}).catch(() => {});
	const el = document.getElementById(plotId);
	if (el && el.querySelector(".scene")) {
		Plotly.relayout(plotId, {
			"scene.xaxis.backgroundcolor": bg,
			"scene.xaxis.gridcolor":       gc,
			"scene.xaxis.tickfont.color":  tc,
			"scene.xaxis.titlefont.color": tc,
			"scene.yaxis.backgroundcolor": bg,
			"scene.yaxis.gridcolor":       gc,
			"scene.yaxis.tickfont.color":  tc,
			"scene.yaxis.titlefont.color": tc,
			"scene.zaxis.backgroundcolor": bg,
			"scene.zaxis.gridcolor":       gc,
			"scene.zaxis.tickfont.color":  tc,
			"scene.zaxis.titlefont.color": tc
		}).catch(() => {});
	}
}

/* ── Number / equation helpers ────────────────────────────────────────────── */

function formatNumber(n) {
	if (!isFinite(n)) return String(n);
	const a = Math.abs(n);
	if (a !== 0 && (a >= 1e6 || a < 1e-3)) return n.toExponential(2);
	const rounded = Math.round(n);
	if (Math.abs(n - rounded) < 1e-9) return String(rounded);
	const fixed = n.toFixed(4);
	return fixed.replace(/\.?0+$/, "");
}

function renderTemmlIn(root) {
	if (!window.temml || !root) return;
	const els = root.querySelectorAll(".temml_me:not([data-rendered='1'])");
	for (let i = 0; i < els.length; i++) {
		const e = els[i];
		const latex = (e.textContent || "").trim();
		if (!latex) continue;
		try {
			const displayMode = e.dataset.display === "1";
			e.innerHTML = window.temml.renderToString(latex, { displayMode });
			e.dataset.rendered = "1";
		} catch (err) { /* ignore render failure */ }
	}
}

function buildEquationLatex(activation, w, b) {
	const ws = formatNumber(w), bs = formatNumber(b);
	switch (activation) {
		case "relu":    return `\\hat{y} = \\max(0,\\, ${ws}\\,x + ${bs})`;
		case "tanh":    return `\\hat{y} = \\tanh(${ws}\\,x + ${bs})`;
		case "sigmoid": return `\\hat{y} = \\sigma(${ws}\\,x + ${bs})`;
		default:        return `\\hat{y} = ${ws}\\,x + ${bs}`;
	}
}

function renderModelReadout() {
	const el = document.getElementById("ll-equation");
	if (!el) return;
	const w = state.model.w, b = state.model.b, loss = state.model.loss;
	const latex = buildEquationLatex(state.activation, w, b);
	const lossLabel = loss !== null ? `loss = ${formatNumber(loss)}` : "loss = —";
	el.innerHTML = `
		<div class="ll-eq-row">
			<span class="temml_me" data-display="1">${latex}</span>
		</div>
		<div class="ll-eq-meta">w = ${formatNumber(w)},&nbsp; b = ${formatNumber(b)},&nbsp; ${lossLabel}</div>
	`;
	renderTemmlIn(el);
}

/* ── Example presets ─────────────────────────────────────────────────────── */

function loadExample(type) {
	const xEl = document.getElementById("ll-x");
	const yEl = document.getElementById("ll-y");
	const setV = (id, v) => { const e = document.getElementById(id); if (e) e.value = v; };
	let xs, ys;
	switch (type) {
		case "linear":
			xs = Array.from({ length: 11 }, (_, i) => i - 5);
			ys = xs.map(x => 2 * x + 1);
			setV("ll-epochs", "100");
			break;
		case "linear_negative":
			xs = Array.from({ length: 11 }, (_, i) => i - 5);
			ys = xs.map(x => -0.5 * x - 0.8);
			setV("ll-epochs", "100");
			break;
		case "parabola":
			xs = Array.from({ length: 21 }, (_, i) => (i - 10) / 2);
			ys = xs.map(x => x * x + 5);
			setV("ll-epochs", "200");
			break;
		case "sine":
			xs = Array.from({ length: 30 }, (_, i) => i * 0.4);
			ys = xs.map(x => Math.sin(x) * x + 5);
			setV("ll-epochs", "300");
			break;
		default: return;
	}
	xEl.value = xs.map(n => n.toFixed(1)).join(", ");
	yEl.value = ys.map(n => n.toFixed(3)).join(", ");
	state.xs = xs;
	state.ys = ys;
	state.xMin = Math.min(...xs);
	state.xMax = Math.max(...xs);
	setStatus(`Loaded "${type}" example.`);
}
window.loadExample = loadExample;

/* ── DOM helpers ─────────────────────────────────────────────────────────── */

function setStatus(text) {
	const el = document.getElementById("ll-status");
	if (el) el.textContent = text;
}

function setRunningUI(running) {
	state.experimentRunning = running;
	const start = document.getElementById("ll-start");
	const stop  = document.getElementById("ll-stop");
	if (start) { start.disabled = running; start.style.display = running ? "none" : "block"; }
	if (stop)  { stop.style.display = running ? "block" : "none"; }
}

/* ── Math primitives ────────────────────────────────────────────────────── */

function applyActivation(p, name) {
	if (name === "relu")    return p.relu();
	if (name === "sigmoid") return p.sigmoid();
	if (name === "tanh")    return p.tanh();
	return p;
}

function computeLossForWeights(w, b, xsT, ysT, activation) {
	return tf.tidy(() => {
		const W = tf.tensor2d([[w]]);
		const B = tf.tensor1d([b]);
		const p = applyActivation(xsT.matMul(W).add(B), activation);
		return p.sub(ysT).square().mean().dataSync()[0];
	});
}

function calculateLoss(w, b, xsT, ysT) {
	const cacheKey = `${w.toFixed(4)},${b.toFixed(4)}`;
	if (state.landscape.cache && state.landscape.cache[cacheKey] !== undefined) {
		return state.landscape.cache[cacheKey];
	}
	const raw = computeLossForWeights(w, b, xsT, ysT, state.activation);
	const loss = Math.max(raw, 1e-8);
	if (!state.landscape.cache) state.landscape.cache = {};
	state.landscape.cache[cacheKey] = loss;
	return loss;
}

function createModel(initW, initB) {
	const model = tf.sequential();
	model.add(tf.layers.dense({
		units: 1,
		inputShape: [1],
		kernelInitializer: tf.initializers.constant({ value: initW }),
		biasInitializer:  tf.initializers.constant({ value: initB }),
		activation: state.activation
	}));
	return model;
}

function calculatePredictionLine(w, b) {
	return tf.tidy(() => {
		const xs = [];
		for (let x = state.xMin - 1; x <= state.xMax + 1; x += 0.1) xs.push(x);
		const xt = tf.tensor2d(xs.map(x => [x]));
		const W = tf.tensor2d([[w]]);
		const B = tf.tensor1d([b]);
		const p = applyActivation(xt.matMul(W).add(B), state.activation);
		return { xs, ys: Array.from(p.dataSync()) };
	});
}

/* ── Landscape sampling ──────────────────────────────────────────────────── */

async function sampleLandscapeAround(w0, b0, buffer, xsT, ysT) {
	const minW = w0 - buffer, maxW = w0 + buffer;
	const minB = b0 - buffer, maxB = b0 + buffer;
	const Ws = [], Bs = [], Ls = [];
	const losses = [];
	for (let b = Math.floor(minB * 10) / 10; b <= Math.ceil(maxB * 10) / 10 + 1e-9; b = Math.round((b + 0.1) * 10) / 10) {
		for (let w = Math.floor(minW * 10) / 10; w <= Math.ceil(maxW * 10) / 10 + 1e-9; w = Math.round((w + 0.1) * 10) / 10) {
			Ws.push(w);
			Bs.push(b);
			losses.push(calculateLoss(w, b, xsT, ysT));
		}
	}
	state.landscape.W.push(...Ws);
	state.landscape.B.push(...Bs);
	state.landscape.L.push(...losses);
	for (let i = 50; i < losses.length; i += 50) {
		setStatus(`Sampling loss surface: ${i}/${losses.length}`);
		await tf.nextFrame();
	}
	setStatus(`Sampled ${losses.length} points.`);
}

function buildSurfaceGrid() {
	const Ws = Array.from(new Set(state.landscape.W.map(w => w.toFixed(1)))).map(parseFloat).sort((a, b) => a - b);
	const Bs = Array.from(new Set(state.landscape.B.map(b => b.toFixed(1)))).map(parseFloat).sort((a, b) => a - b);
	const wIdx = new Map(Ws.map((w, i) => [w.toFixed(1), i]));
	const bIdx = new Map(Bs.map((b, i) => [b.toFixed(1), i]));
	const Z = Array.from({ length: Bs.length }, () => Array(Ws.length).fill(null));
	for (let i = 0; i < state.landscape.W.length; i++) {
		const wi = wIdx.get(state.landscape.W[i].toFixed(1));
		const bi = bIdx.get(state.landscape.B[i].toFixed(1));
		if (wi !== undefined && bi !== undefined) Z[bi][wi] = Math.log10(state.landscape.L[i]);
	}
	return { Ws, Bs, Z };
}

/* ── Plot construction ───────────────────────────────────────────────────── */

function commonAxis(title, opts) {
	const base = {
		title: { text: title, font: { color: tText() } },
		backgroundcolor: tBg(),
		gridcolor: tGrid(),
		tickfont: { color: tText() },
		titlefont: { color: tText() },
		zerolinecolor: tGrid(),
		tickformat: ".0f"
	};
	if (!opts) return base;
	return Object.assign(base, opts);
}

/* ─── 3-D plot: trajectory + surface clipping ────────────────────────────── */

function init3DPlot(optimizers, surfaceGrid, w0, b0, initLoss) {
	const { Ws, Bs, Z } = surfaceGrid;
	const losses = Z.flat().filter(z => z !== null).map(z => Math.pow(10, z));
	const minL = losses.length > 0 ? Math.max(Math.min(...losses), 1e-7) : 1e-7;
	const maxL = losses.length > 0 ? Math.max(...losses, minL * 10) : 1;
	const cmin = Math.log10(minL) - 1;
	const cmax = Math.log10(maxL) + 0.1;
	const zMax = Math.log10(maxL);

	const surfaceTrace = {
		type: "surface", x: Ws, y: Bs, z: Z,
		colorscale: "Viridis", reversescale: false,
		cmin, cmax, showscale: true, opacity: 0.92,
		lighting: { ambient: 0.7, diffuse: 0.7, roughness: 0.3 },
		contours: { z: { show: false } },
		name: "loss surface",
		hoverinfo: "skip"
	};
	const trajTraces = optimizers.map(name => {
		const info = OPTIMIZER_INFO[name];
		return {
			type: "scatter3d", mode: "lines+markers",
			x: [w0], y: [b0], z: [Math.log10(initLoss)],
			marker: { size: 4, color: info.color, symbol: info.marker3Symbol, line: { width: 1, color: info.color } },
			line:   { width: 5, color: info.color, dash: info.line3Dash },
			name,
			legendgroup: name,
			hovertemplate: "<b>" + name + "</b><br>w = %{x:.3g}<br>b = %{y:.3g}<br>log₁₀(loss) = %{z:.3g}<extra></extra>"
		};
	});

	const initZ = Math.min(Math.log10(initLoss), zMax);

	Plotly.newPlot("ll-3d-plot", [surfaceTrace, ...trajTraces], {
		title: { text: "3-D Loss Landscape & Optimizer Trajectories", font: { color: tText() } },
		paper_bgcolor: "rgba(0,0,0,0)",
		plot_bgcolor:  "rgba(0,0,0,0)",
		scene: {
			xaxis: Object.assign(commonAxis("weight w"), { range: [Ws[0], Ws[Ws.length - 1]], autorange: false }),
			yaxis: Object.assign(commonAxis("bias b"),  { range: [Bs[0], Bs[Bs.length - 1]], autorange: false }),
			zaxis: Object.assign(commonAxis("loss (log₁₀)"), { range: [cmin, cmax], autorange: false }),
			camera: { up: { x: 0, y: 0, z: 1 }, center: { x: 0, y: 0, z: 0 }, eye: { x: 1.3, y: 1.3, z: 1.2 } },
			dragmode: "orbit"
		},
		legend: { font: { color: tText() }, x: 0, y: 1 },
		margin: { l: 0, r: 0, b: 0, t: 40 },
		showlegend: true
	}, { responsive: true }).then(() => {
		Plotly.restyle("ll-3d-plot", { z: [[initZ]] }, trajTraces.map((_, i) => i + 1)).catch(() => {});
	});
}

function initFitPlot(optimizers) {
	const initModel = createModel(0.1, 0.1);
	const wInit = initModel.layers[0].getWeights()[0].dataSync()[0];
	const bInit = initModel.layers[0].getWeights()[1].dataSync()[0];
	initModel.dispose();
	const pl = calculatePredictionLine(wInit, bInit);

	const dataTrace = {
		x: state.xs, y: state.ys, mode: "markers", type: "scatter",
		name: "data",
		marker: { color: tText(), size: 9, line: { color: tText(), width: 1 } },
		hovertemplate: "<b>data point</b><br>x = %{x:.3g}<br>y = %{y:.3g}<extra></extra>"
	};
	const fitTraces = optimizers.map(name => {
		const info = OPTIMIZER_INFO[name];
		return {
			x: pl.xs, y: pl.ys, mode: "lines", type: "scatter",
			name,
			legendgroup: name,
			line: { color: info.color, width: 3, dash: info.dash },
			hovertemplate: "<b>" + name + "</b> fit<br>x = %{x:.3g}<br>ŷ = %{y:.3g}<extra></extra>"
		};
	});

	Plotly.newPlot("ll-fit-plot", [dataTrace, ...fitTraces], {
		title: { text: "Fit vs. Data — All Optimizers", font: { color: tText() } },
		paper_bgcolor: "rgba(0,0,0,0)",
		plot_bgcolor:  "rgba(0,0,0,0)",
		xaxis: commonAxis("x"),
		yaxis: commonAxis("y"),
		legend: { font: { color: tText() } },
		margin: { l: 50, r: 20, b: 40, t: 40 }
	}, { responsive: true });
}

function initLossCurvePlot(optimizers, initLoss) {
	const traces = optimizers.map(name => {
		const info = OPTIMIZER_INFO[name];
		return {
			x: [0], y: [initLoss], mode: "lines+markers", type: "scatter",
			name,
			line:   { color: info.color, width: 2, dash: info.dash },
			marker: { size: 5, color: info.color, symbol: info.symbol, line: { width: 1, color: info.color } },
			hovertemplate: "<b>" + name + "</b><br>epoch = %{x}<br>loss = %{y:.4g}<extra></extra>"
		};
	});
	Plotly.newPlot("ll-loss-plot", traces, {
		title: { text: "Loss vs. Epoch", font: { color: tText() } },
		paper_bgcolor: "rgba(0,0,0,0)",
		plot_bgcolor:  "rgba(0,0,0,0)",
		xaxis: commonAxis("epoch"),
		yaxis: commonAxis("loss (MSE)", { type: "log", tickformat: ".0~e" }),
		legend: { font: { color: tText() } },
		margin: { l: 60, r: 20, b: 40, t: 40 }
	}, { responsive: true });
}

/* ── Training loop ───────────────────────────────────────────────────────── */

function setProgress(fraction) {
	const bar = document.getElementById("ll-progress");
	if (bar) bar.style.width = Math.max(0, Math.min(100, fraction * 100)).toFixed(1) + "%";
}

async function trainOne(name, lr, epochs, xsT, ysT) {
	const initModel = createModel(0.1, 0.1);
	const wInit = initModel.layers[0].getWeights()[0].dataSync()[0];
	const bInit = initModel.layers[0].getWeights()[1].dataSync()[0];
	initModel.dispose();

	const optimizer = OPTIMIZER_INFO[name].factory(lr);
	const model = createModel(wInit, bInit);
	model.compile({ optimizer, loss: "meanSquaredError" });

	const trajW = [wInit], trajB = [bInit], trajLoss = [];
	const losses = [];

	const trajIdx  = state.currentOptimizers.indexOf(name) + 1;
	const fitIdx   = state.currentOptimizers.indexOf(name) + 1;
	const lossIdx  = state.currentOptimizers.indexOf(name);

	const zMin = state.surfaceZMin;
	const zMax = state.surfaceZMax;

	await model.fit(xsT, ysT, {
		epochs, batchSize: state.xs.length, verbose: 0,
		callbacks: {
			onBatchEnd: async () => { await tf.nextFrame(); },
			onEpochEnd: (epoch, logs) => {
				if (state.stopRequested) { model.stopTraining = true; return; }
				losses.push(logs.loss);
				const layer = model.layers[0];
				const ws = layer.getWeights();
				const w = ws[0].dataSync()[0], b = ws[1].dataSync()[0];
				trajW.push(w); trajB.push(b); trajLoss.push(logs.loss);

				const trajZ = trajLoss.map(l => {
					let z = Math.log10(Math.max(l, 1e-12));
					if (z > zMax) z = zMax;
					if (z < zMin) z = zMin;
					return z;
				});

				Plotly.restyle("ll-3d-plot", {
					x: [trajW], y: [trajB], z: [trajZ]
				}, [trajIdx]);

				const pl = calculatePredictionLine(w, b);
				Plotly.restyle("ll-fit-plot", { x: [pl.xs], y: [pl.ys] }, [fitIdx]);

				Plotly.restyle("ll-loss-plot", {
					x: [losses.map((_, k) => k + 1)],
					y: [losses]
				}, [lossIdx]);

				setProgress((epoch + 1) / epochs);
			}
		}
	});

	optimizer.dispose();
	model.dispose();
	state.lossHistory[name] = losses;

	const finalW = trajW[trajW.length - 1];
	const finalB = trajB[trajB.length - 1];
	const finalLoss = trajLoss[trajLoss.length - 1];
	state.model.w = finalW;
	state.model.b = finalB;
	state.model.loss = finalLoss;
	state.model.activeOptimizer = name;
	state.model.finals = state.model.finals || {};
	state.model.finals[name] = { w: finalW, b: finalB, loss: finalLoss };
	renderModelReadout();

	return { trajW, trajB, trajLoss };
}

/* ── Experiment driver ───────────────────────────────────────────────────── */

function parseData() {
	try {
		const xs = document.getElementById("ll-x").value.split(",").map(s => parseFloat(s.trim())).filter(n => !isNaN(n));
		const ys = document.getElementById("ll-y").value.split(",").map(s => parseFloat(s.trim())).filter(n => !isNaN(n));
		if (xs.length !== ys.length || xs.length === 0) throw new Error("x and y must have the same number of valid numbers.");
		state.xs = xs;
		state.ys = ys;
		state.xMin = Math.min(...xs);
		state.xMax = Math.max(...xs);
		return {
			xsT: tf.tensor2d(xs.map(x => [x])),
			ysT: tf.tensor2d(ys.map(y => [y]))
		};
	} catch (e) {
		setStatus("Error: " + e.message);
		throw e;
	}
}

function getSelectedOptimizers() {
	return Array.from(document.querySelectorAll(".ll-opt:checked")).map(c => c.value);
}

async function startExperiment() {
	if (state.experimentRunning) return;
	setRunningUI(true);
	setProgress(0);
	state.stopRequested = false;
	state.landscape = { W: [], B: [], L: [], cache: {} };
	state.lossHistory = {};
	state.model = { w: 0.1, b: 0.1, loss: null };
	state.surfaceLookup = null;
	state.surfaceZMin = 0;
	state.surfaceZMax = 0;

	const optimizers = getSelectedOptimizers();
	if (optimizers.length === 0) {
		setStatus("Pick at least one optimizer.");
		setRunningUI(false);
		return;
	}
	state.currentOptimizers = optimizers;
	const lr = parseFloat(document.getElementById("ll-lr").value) || 0.01;
	const epochs = parseInt(document.getElementById("ll-epochs").value) || 100;
	state.activation = document.getElementById("ll-act").value;

	let data;
	try {
		setStatus("Reading data...");
		data = parseData();
		await tf.nextFrame();

		setStatus("Sampling loss surface...");
		await sampleLandscapeAround(0.1, 0.1, 4, data.xsT, data.ysT);

		state.model.loss = calculateLoss(0.1, 0.1, data.xsT, data.ysT);

		const surfaceGrid = buildSurfaceGrid();
		const surfaceZ = surfaceGrid.Z.flat().filter(v => v !== null && isFinite(v));
		state.surfaceZMin = surfaceZ.length > 0 ? Math.min.apply(null, surfaceZ) : 0;
		state.surfaceZMax = surfaceZ.length > 0 ? Math.max.apply(null, surfaceZ) : 0;
		state.surfaceLookup = null;

		init3DPlot(optimizers, surfaceGrid, 0.1, 0.1, state.model.loss);
		initFitPlot(optimizers);
		initLossCurvePlot(optimizers, state.model.loss);
		renderModelReadout();
		resizeAllPlots();

		setStatus(`Training ${optimizers.join(", ")} in parallel ...`);
		await Promise.all(optimizers.map(name => trainOne(name, lr, epochs, data.xsT, data.ysT)));

		setStatus(state.stopRequested ? "Stopped." : "Done.");
		setProgress(1);
		renderModelReadout();
	} catch (e) {
		console.error(e);
		setStatus("Error: " + (e.message || String(e)));
	} finally {
		if (data) { data.xsT.dispose(); data.ysT.dispose(); }
		setRunningUI(false);
	}
}
window.startExperiment = startExperiment;

function stopExperiment() {
	state.stopRequested = true;
	setStatus("Stopping ...");
}
window.stopExperiment = stopExperiment;

function resizeAllPlots() {
	document.querySelectorAll(".ll-lab .js-plotly-plot").forEach(div => {
		if (div.offsetParent !== null) {
			Plotly.relayout(div.id, { width: div.clientWidth, height: div.clientHeight }).catch(() => {});
		}
	});
}

function setupResizeObserver() {
	const lab = document.querySelector(".ll-lab");
	if (!lab || typeof ResizeObserver === "undefined") return;
	const ro = new ResizeObserver(() => {
		resizeAllPlots();
	});
	ro.observe(lab);
}

/* ── Module entry point ──────────────────────────────────────────────────── */

async function loadLossLandscapeLabModule() {
	updateLoadingStatus("Loading section about the loss landscape lab ...");

	loadExample("linear");
	if (state.xs.length > 0) {
		const opts = getSelectedOptimizers();
		const xsT = tf.tensor2d(state.xs.map(x => [x]));
		const ysT = tf.tensor2d(state.ys.map(y => [y]));
		state.model.loss = computeLossForWeights(state.model.w, state.model.b, xsT, ysT, state.activation);

		state.landscape = { W: [], B: [], L: [], cache: {} };
		await sampleLandscapeAround(state.model.w, state.model.b, 4, xsT, ysT);
		const surface = buildSurfaceGrid();

		init3DPlot(opts, surface, state.model.w, state.model.b, state.model.loss);
		initFitPlot(opts);
		initLossCurvePlot(opts, state.model.loss);
		renderModelReadout();
		resizeAllPlots();

		xsT.dispose();
		ysT.dispose();
	}

	const actEl = document.getElementById("ll-act");
	if (actEl) actEl.addEventListener("change", () => {
		state.activation = actEl.value;
		renderModelReadout();
	});

	window.addEventListener("resize", resizeAllPlots);
	setupResizeObserver();

	// Resize once after layout settles so Plotly picks up the container width
	setTimeout(resizeAllPlots, 100);
	setTimeout(resizeAllPlots, 500);

	if (window.__MN_DARK && typeof window.__MN_DARK.onChange === "function") {
		window.__MN_DARK.onChange(() => {
			try {
				const ids = [];
				document.querySelectorAll(".ll-lab .js-plotly-plot").forEach(el => ids.push(el.id));
				ids.forEach(relayoutForTheme);
				renderModelReadout();
			} catch (e) { /* ignore */ }
		});
	}

	return Promise.resolve();
}
