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
	SGD:      { factory: (lr) => tf.train.sgd(lr),                  color: "#ef4444", defaultLr: 0.01, dash: "solid",   symbol: "circle",      line3Dash: "solid",    marker3Symbol: "circle" },
	Momentum: { factory: (lr) => tf.train.momentum(lr, 0.9, false), color: "#a855f7", defaultLr: 0.01, dash: "dashdot", symbol: "diamond",     line3Dash: "dashdot", marker3Symbol: "diamond" },
	Adam:     { factory: (lr) => tf.train.adam(lr),                color: "#ec4899", defaultLr: 0.01, dash: "dash",    symbol: "square",      line3Dash: "dash",    marker3Symbol: "square" },
	RMSProp:  { factory: (lr) => tf.train.rmsprop(lr),             color: "#22d3ee", defaultLr: 0.005, dash: "dot",     symbol: "triangle-up", line3Dash: "dot",     marker3Symbol: "triangle-up" }
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
	model:             { w: 0.1, b: 0.1, loss: null },
	trajW:             {},
	trajB:             {},
	scale3D:           "log"
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

/* ── Assertion helper ──────────────────────────────────────────────────────── */

function ll_assert(cond, msg, ctx) {
	if (cond) return;
	const tail = ctx ? " (" + JSON.stringify(ctx) + ")" : "";
	console.error("[loss_landscape ASSERT FAIL] " + msg + tail);
}

function ll_assert_close(actual, expected, tol, msg, ctx) {
	if (typeof actual !== "number" || typeof expected !== "number") {
		ll_assert(false, msg + ": non-numeric value", Object.assign({}, ctx || {}, { actual: actual, expected: expected }));
		return;
	}
	if (!isFinite(actual) || !isFinite(expected)) {
		ll_assert(false, msg + ": non-finite value", Object.assign({}, ctx || {}, { actual: actual, expected: expected }));
		return;
	}
	if (Math.abs(actual - expected) > tol) {
		ll_assert(false, msg + ": |" + actual + " - " + expected + "| = " + Math.abs(actual - expected) + " > " + tol, Object.assign({}, ctx || {}, { actual: actual, expected: expected, tol: tol }));
	}
}

/* ── Number / equation helpers ────────────────────────────────────────────── */

function formatNumber(n) {
	if (!isFinite(n)) return String(n);
	const a = Math.abs(n);
	if (a === 0) return "0";
	if (a < 1e-4) {
		const s = n.toFixed(10);
		return s.replace(/(\.\d*?)0+$/, "$1").replace(/\.$/, "");
	}
	if (a < 1) {
		const s = n.toFixed(6);
		return s.replace(/(\.\d*?)0+$/, "$1").replace(/\.$/, "");
	}
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
	const finals = state.model && state.model.finals;
	const names = Object.keys(finals || {});

	const origEl = document.getElementById("ll-original-eq");
	if (origEl) {
		const showOrig = state.dataMatchesPreset && state.exampleType && EXAMPLE_EQUATIONS[state.exampleType];
		origEl.textContent = showOrig ? "Original (data): " + EXAMPLE_EQUATIONS[state.exampleType] : "";
		origEl.style.display = showOrig ? "" : "none";
	}

	if (names.length === 0) {
		const w = state.model.w, b = state.model.b;
		const latex = buildEquationLatex(state.activation, w, b);
		el.innerHTML = `
			<div class="ll-eq-row">
				<span class="temml_me" data-display="1">${latex}</span>
			</div>
			<div class="ll-eq-meta">w = ${formatNumber(w)}, b = ${formatNumber(b)}</div>
		`;
		renderTemmlIn(el);
		return;
	}
	const rows = names.map(name => {
		const f = finals[name];
		const info = OPTIMIZER_INFO[name];
		const latex = buildEquationLatex(state.activation, f.w, f.b);
		const lossLabel = f.loss !== null && f.loss !== undefined
			? `loss = ${formatNumber(f.loss)}`
			: "loss = —";
		const escapedName = name.replace(/&/g, "&amp;").replace(/</g, "&lt;");
		return `
			<div class="ll-eq-row">
				<span class="ll-eq-name" style="color:${info.color}">${escapedName}</span>
				<span class="temml_me" data-display="1">${latex}</span>
				<span class="ll-eq-meta">w = ${formatNumber(f.w)}, b = ${formatNumber(f.b)}, ${lossLabel}</span>
			</div>
		`;
	}).join("");
	el.innerHTML = rows;
	renderTemmlIn(el);
}

/* ── Example presets ─────────────────────────────────────────────────────── */

const EXAMPLE_EQUATIONS = {
	"linear":         "y = 2x + 1",
	"linear_negative": "y = -0.5x - 0.8",
	"parabola":       "y = x²",
	"sine":           "y = x·sin(x)"
};

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
	state.exampleType = type;
	state.presetXs = xs.slice();
	state.presetYs = ys.slice();
	state.dataMatchesPreset = true;
	renderModelReadout();
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
	const w = (typeof initW === "number" && isFinite(initW)) ? initW : 0.1;
	const b = (typeof initB === "number" && isFinite(initB)) ? initB : 0.1;
	if (initW !== w) console.error("[loss_landscape] guard: initW fallback from", initW, "to", w);
	if (initB !== b) console.error("[loss_landscape] guard: initB fallback from", initB, "to", b);
	const activation = (typeof state.activation === "string" && state.activation.length > 0) ? state.activation : "linear";
	if (state.activation !== activation) console.error("[loss_landscape] guard: activation fallback from", state.activation, "to", activation);
	const model = tf.sequential();
	model.add(tf.layers.dense({
		units: 1,
		inputShape: [1],
		kernelInitializer: tf.initializers.constant({ value: w }),
		biasInitializer:  tf.initializers.constant({ value: b }),
		activation
	}));
	return model;
}

function ensureSurfaceCoversTrajectories(xsT, ysT) {
	const optimizers = state.currentOptimizers || [];
	if (optimizers.length === 0) return;

	// Collect every snapped trajectory grid point across all optimizers.
	const gridPoints = new Map();
	optimizers.forEach(name => {
		const w = state.trajW && state.trajW[name];
		const b = state.trajB && state.trajB[name];
		if (!Array.isArray(w) || !Array.isArray(b)) return;
		for (let i = 0; i < w.length; i++) {
			const wSnap = Math.round(w[i] * 10) / 10;
			const bSnap = Math.round(b[i] * 10) / 10;
			const key = wSnap.toFixed(1) + "|" + bSnap.toFixed(1);
			gridPoints.set(key, { w: wSnap, b: bSnap });
		}
	});

	// For each unique grid point, compute the EXACT loss from the model and write it
	// to state.landscape. This is the single source of truth: the surface L at the
	// trajectory's snapped (w, b) IS the model's loss at that exact grid point.
	gridPoints.forEach(({ w, b }) => {
		const loss = calculateLoss(w, b, xsT, ysT);
		ll_assert(isFinite(loss) && loss > 0, "ensureSurfaceCoversTrajectories: calculateLoss returned non-positive", { w: w, b: b, loss: loss });

		const wKey = w.toFixed(1);
		const bKey = b.toFixed(1);

		let foundIdx = -1;
		for (let k = 0; k < state.landscape.W.length; k++) {
			if (state.landscape.W[k].toFixed(1) === wKey && state.landscape.B[k].toFixed(1) === bKey) {
				state.landscape.L[k] = loss;
				foundIdx = k;
				break;
			}
		}
		if (foundIdx < 0) {
			state.landscape.W.push(w);
			state.landscape.B.push(b);
			state.landscape.L.push(loss);
			foundIdx = state.landscape.W.length - 1;
		}

		ll_assert_close(state.landscape.L[foundIdx], loss, 1e-9,
			"ensureSurfaceCoversTrajectories: state.landscape.L must equal calculateLoss",
			{ w: w, b: b, actualL: state.landscape.L[foundIdx], expectedLoss: loss });
	});

	// DEDUP: keep only the LAST entry per (wKey, bKey) so buildSurfaceGrid's
	// "last-write-wins" loop in Z[bi][wi] = ... picks the right one.
	{
		const seen = new Map();
		for (let k = 0; k < state.landscape.W.length; k++) {
			const key = state.landscape.W[k].toFixed(1) + "|" + state.landscape.B[k].toFixed(1);
			seen.set(key, k);
		}
		const keep = new Set(seen.values());
		const newW = [], newB = [], newL = [];
		for (let k = 0; k < state.landscape.W.length; k++) {
			if (keep.has(k)) {
				newW.push(state.landscape.W[k]);
				newB.push(state.landscape.B[k]);
				newL.push(state.landscape.L[k]);
			}
		}
		state.landscape.W = newW;
		state.landscape.B = newB;
		state.landscape.L = newL;
	}

	// Assert: buildSurfaceGrid's Z at every trajectory's snapped (w, b) must equal
	// the loss that was just written. After dedup, the trajectory's loss is at that vertex.
	const sg = buildSurfaceGrid();
	const wIdxMap = new Map(sg.Ws.map((w, idx) => [w.toFixed(1), idx]));
	const bIdxMap = new Map(sg.Bs.map((b, idx) => [b.toFixed(1), idx]));
	optimizers.forEach(name => {
		const w = state.trajW && state.trajW[name];
		const b = state.trajB && state.trajB[name];
		if (!Array.isArray(w) || !Array.isArray(b)) return;
		for (let i = 0; i < w.length; i++) {
			const wSnap = Math.round(w[i] * 10) / 10;
			const bSnap = Math.round(b[i] * 10) / 10;
			const wi = wIdxMap.get(wSnap.toFixed(1));
			const bi = bIdxMap.get(bSnap.toFixed(1));
			if (wi === undefined || bi === undefined) continue;
			const expected = Math.log10(calculateLoss(wSnap, bSnap, xsT, ysT));
			ll_assert_close(sg.Z[bi][wi], expected, 0.005,
				"ensureSurfaceCoversTrajectories: buildSurfaceGrid Z must equal log10(calculateLoss(snap))",
				{ name: name, i: i, wSnap: wSnap, bSnap: bSnap, sz: sg.Z[bi][wi], expected: expected });
		}
	});
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
	const Ws = [], Bs = [];
	const step = 0.1;
	for (let b = Math.floor(minB / step) * step; b <= Math.ceil(maxB / step) * step + 1e-9; b = Math.round((b + step) * 10) / 10) {
		for (let w = Math.floor(minW / step) * step; w <= Math.ceil(maxW / step) * step + 1e-9; w = Math.round((w + step) * 10) / 10) {
			Ws.push(w);
			Bs.push(b);
		}
	}
	setStatus(`Sampling loss surface (${Ws.length} points) ...`);
	await tf.nextFrame();

	const losses = tf.tidy(() => {
		const WsT = tf.tensor1d(Ws);
		const BsT = tf.tensor1d(Bs);
		const N = Ws.length;
		const WsCol = WsT.reshape([N, 1]);
		const BsCol = BsT.reshape([N, 1]);
		const Wt = WsCol.expandDims(2);
		const Bt = BsCol.expandDims(2);
		const xsB = xsT.reshape([1, xsT.shape[0], xsT.shape[1]]);
		const Wb = Wt;
		const Bb = Bt;
		const p = xsB.matMul(Wb).add(Bb);
		const ysB = ysT.reshape([1, ysT.shape[0], ysT.shape[1]]);
		const sq = p.sub(ysB).square();
		const sqFlat = sq.reshape([N, xsT.shape[0]]);
		return Array.from(sqFlat.mean(1).dataSync());
	});

	state.landscape.W.push(...Ws);
	state.landscape.B.push(...Bs);
	state.landscape.L.push(...losses);
	setStatus(`Sampled ${losses.length} points.`);
}

function buildSurfaceGrid() {
	return buildSurfaceGridFor(state.scale3D || "log");
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

function setCam3D(preset) {
	const cams = {
		iso:   { eye: { x: 1.3, y: 1.3, z: 1.2 }, center: { x: 0, y: 0, z: 0 }, up: { x: 0, y: 0, z: 1 } },
		top:   { eye: { x: 0.01, y: 0.01, z: 2.0 }, center: { x: 0, y: 0, z: 0 }, up: { x: 0, y: 1, z: 0 } },
		front: { eye: { x: 0, y: 2.0, z: 0.3 }, center: { x: 0, y: 0, z: 0 }, up: { x: 0, y: 0, z: 1 } },
		side:  { eye: { x: 2.0, y: 0, z: 0.3 }, center: { x: 0, y: 0, z: 0 }, up: { x: 0, y: 0, z: 1 } },
		reset: { eye: { x: 1.3, y: 1.3, z: 1.2 }, center: { x: 0, y: 0, z: 0 }, up: { x: 0, y: 0, z: 1 } }
	};
	const c = cams[preset] || cams.iso;
	Plotly.relayout("ll-3d-plot", {
		"scene.camera.eye.x":    c.eye.x,
		"scene.camera.eye.y":    c.eye.y,
		"scene.camera.eye.z":    c.eye.z,
		"scene.camera.center.x": c.center.x,
		"scene.camera.center.y": c.center.y,
		"scene.camera.center.z": c.center.z,
		"scene.camera.up.x":     c.up.x,
		"scene.camera.up.y":     c.up.y,
		"scene.camera.up.z":     c.up.z
	}).catch(() => {});
}
window.setCam3D = setCam3D;

function buildSurfaceGridFor(scale) {
	const Ws = Array.from(new Set(state.landscape.W.map(w => w.toFixed(1)))).map(parseFloat).sort((a, b) => a - b);
	const Bs = Array.from(new Set(state.landscape.B.map(b => b.toFixed(1)))).map(parseFloat).sort((a, b) => a - b);
	const wIdx = new Map(Ws.map((w, i) => [w.toFixed(1), i]));
	const bIdx = new Map(Bs.map((b, i) => [b.toFixed(1), i]));
	const Z = Array.from({ length: Bs.length }, () => Array(Ws.length).fill(null));
	for (let i = 0; i < state.landscape.W.length; i++) {
		const wi = wIdx.get(state.landscape.W[i].toFixed(1));
		const bi = bIdx.get(state.landscape.B[i].toFixed(1));
		if (wi !== undefined && bi !== undefined) {
			let z = state.landscape.L[i];
			if (z < 1e-12) z = 1e-12;
			if (scale === "log") z = Math.log10(z);
			Z[bi][wi] = z;
		}
	}
	return { Ws, Bs, Z };
}

function updateTrajectoryZ3D(name, trajIdx) {
	redraw3DTrajectories();
}

function redraw3DTrajectories() {
	const plotEl = document.getElementById("ll-3d-plot");
	if (!plotEl) { console.error("[loss_landscape] guard: #ll-3d-plot not in DOM"); return; }
	if (!plotEl.data || plotEl.data.length === 0) { console.error("[loss_landscape] guard: plotEl.data empty"); return; }

	const scale = state.scale3D || "log";
	const optimizers = state.currentOptimizers || [];
	if (optimizers.length === 0) { console.error("[loss_landscape] guard: currentOptimizers empty"); return; }

	const xArrays = [];
	const yArrays = [];
	const zArrays = [];
	const traceIndices = [];

	const surfaceGrid = buildSurfaceGrid();
	const wIdxMap = new Map(surfaceGrid.Ws.map((w, idx) => [w.toFixed(1), idx]));
	const bIdxMap = new Map(surfaceGrid.Bs.map((b, idx) => [b.toFixed(1), idx]));
	const fallback = scale === "log" ? Math.log10(1e-12) : 0;

	optimizers.forEach((name, i) => {
		const trajIdx = i + 1;
		if (!plotEl.data[trajIdx]) { console.error("[loss_landscape] guard: trace " + trajIdx + " missing for " + name); return; }

		const trajW = state.trajW && state.trajW[name];
		const trajB = state.trajB && state.trajB[name];
		if (!Array.isArray(trajW) || !Array.isArray(trajB) || trajW.length === 0 || trajB.length === 0) { console.error("[loss_landscape] guard: trajW/B empty for " + name); return; }

		const targetLen = Math.min(trajW.length, trajB.length);
		if (targetLen === 0) return;

		const safeX = [];
		const safeY = [];
		const safeZ = [];
		for (let k = 0; k < targetLen; k++) {
			const wSnap = Math.round(trajW[k] * 10) / 10;
			const bSnap = Math.round(trajB[k] * 10) / 10;
			const wi = wIdxMap.get(wSnap.toFixed(1));
			const bi = bIdxMap.get(bSnap.toFixed(1));
			// Single source of truth: trajectory z = surface z at the snapped (w, b)
			let sz = (wi !== undefined && bi !== undefined && surfaceGrid.Z[bi] && surfaceGrid.Z[bi][wi] !== null && surfaceGrid.Z[bi][wi] !== undefined)
				? surfaceGrid.Z[bi][wi]
				: fallback;
			if (!isFinite(sz)) sz = fallback;
			safeX.push(wSnap);
			safeY.push(bSnap);
			safeZ.push(sz);
		}

		xArrays.push(safeX);
		yArrays.push(safeY);
		zArrays.push(safeZ);
		traceIndices.push(trajIdx);
	});

	if (traceIndices.length === 0) { console.error("[loss_landscape] guard: no traces to update"); return; }

	Plotly.restyle("ll-3d-plot", {
		x: xArrays,
		y: yArrays,
		z: zArrays,
		visible: traceIndices.map(() => true)
	}, traceIndices).catch(err => console.error("[loss_landscape] guard: Plotly.restyle failed:", err));
}
window.redraw3DTrajectories = redraw3DTrajectories;

function setScale3D(scale) {
	// ── Guard 1: validate scale argument ──────────────────────────────────────
	if (scale !== "log" && scale !== "linear") {
		console.warn("[loss_landscape] setScale3D: invalid scale", scale, "— defaulting to log");
		scale = "log";
	}

	state.scale3D = scale;
	const logBtn = document.getElementById("ll-scale-log");
	const linBtn = document.getElementById("ll-scale-linear");
	if (logBtn) logBtn.classList.toggle("is-active", scale === "log");
	if (linBtn) linBtn.classList.toggle("is-active", scale === "linear");

	const surfaceGrid = buildSurfaceGridFor(scale);

	// ── Guard 2: sanitize surface Z (drop NaN/Infinity, keep nulls) ───────────
	const cleanZ = surfaceGrid.Z.map(row =>
		row.map(v => (v === null || isFinite(v)) ? v : null)
	);
	const validZ = cleanZ.flat().filter(v => v !== null);

	if (validZ.length === 0) {
		console.warn("[loss_landscape] setScale3D: no valid surface data — aborting toggle");
		return;
	}

	let zMin = Math.min.apply(null, validZ);
	let zMax = Math.max.apply(null, validZ);

	// ── Guard 3: enforce minimum z range width so the axis never collapses ────
	const minWidth = scale === "log" ? 0.5 : 0.01;
	if (!isFinite(zMin) || !isFinite(zMax) || (zMax - zMin) < minWidth) {
		const mid = (isFinite(zMin) && isFinite(zMax)) ? (zMin + zMax) / 2 : (scale === "log" ? 0 : 1);
		zMin = mid - minWidth / 2;
		zMax = mid + minWidth / 2;
	}

	const cmin = scale === "log" ? zMin - 1 : Math.max(0, zMin - (zMax - zMin) * 0.05);
	const cmax = scale === "log" ? zMax + 0.5 : zMax * 1.1;

	// ── Guard 4: validate final axis range before touching Plotly ─────────────
	if (!isFinite(cmin) || !isFinite(cmax) || cmax <= cmin) {
		console.warn("[loss_landscape] setScale3D: invalid axis range", cmin, cmax, "— aborting");
		return;
	}

	const intFmt = (v) => String(Math.round(v));
	const axisTitle = scale === "log" ? "loss (log₁₀)" : "loss (linear)";

	const surfaceZUpdate = [cleanZ];

	Promise.resolve().then(() => {
		const plotEl = document.getElementById("ll-3d-plot");
		if (!plotEl || !plotEl.data || plotEl.data.length === 0) {
			console.warn("[loss_landscape] setScale3D: plot not ready — aborting restyle");
			return;
		}

		Plotly.restyle("ll-3d-plot", {
			z: surfaceZUpdate,
			cmin: [cmin],
			cmax: [cmax]
		}, [0]).catch(err => console.warn("[loss_landscape] surface restyle failed:", err));

		redraw3DTrajectories();

		Plotly.relayout("ll-3d-plot", {
			"scene.zaxis.range": [cmin, cmax],
			"scene.zaxis.autorange": false,
			"scene.zaxis.tickformat": intFmt,
			"scene.zaxis.title.text": axisTitle
		}).then(() => {
			const bar = document.querySelector("#ll-3d-plot .colorbar");
			if (bar) {
				const titleEl = bar.querySelector(".colorbar-title");
				if (titleEl) titleEl.textContent = axisTitle;
			}
		}).catch(err => console.warn("[loss_landscape] relayout failed:", err));
	});
}
window.setScale3D = setScale3D;

async function redrawSurfaceAndTrajectories() {
	const plotEl = document.getElementById("ll-3d-plot");
	if (!plotEl || !plotEl.data || plotEl.data.length === 0) return;
	const surfaceGrid = buildSurfaceGrid();
	const flatZ = surfaceGrid.Z.flat().filter(v => v !== null && isFinite(v));
	if (flatZ.length === 0) return;
	const scale = state.scale3D || "log";
	let zMin = Math.min.apply(null, flatZ);
	let zMax = Math.max.apply(null, flatZ);
	if (zMax - zMin < 0.5) { const mid = (zMax + zMin) / 2; zMin = mid - 0.25; zMax = mid + 0.25; }
	const newCmin = scale === "log" ? zMin - 1 : Math.max(0, zMin - (zMax - zMin) * 0.05);
	const newCmax = scale === "log" ? zMax + 0.5 : zMax * 1.1;

	// Assert: every trajectory point's snapped (w, b) must have a valid surface Z
	const wIdxMap = new Map(surfaceGrid.Ws.map((w, idx) => [w.toFixed(1), idx]));
	const bIdxMap = new Map(surfaceGrid.Bs.map((b, idx) => [b.toFixed(1), idx]));
	(state.currentOptimizers || []).forEach(name => {
		const wArr = state.trajW && state.trajW[name] || [];
		const bArr = state.trajB && state.trajB[name] || [];
		const n = Math.min(wArr.length, bArr.length);
		for (let k = 0; k < n; k++) {
			const wSnap = Math.round(wArr[k] * 10) / 10;
			const bSnap = Math.round(bArr[k] * 10) / 10;
			const wi = wIdxMap.get(wSnap.toFixed(1));
			const bi = bIdxMap.get(bSnap.toFixed(1));
			ll_assert(wi !== undefined, "surface missing w grid vertex for trajectory point", { name: name, k: k, wSnap: wSnap });
			ll_assert(bi !== undefined, "surface missing b grid vertex for trajectory point", { name: name, k: k, bSnap: bSnap });
			if (wi === undefined || bi === undefined) continue;
			const sz = surfaceGrid.Z[bi][wi];
			ll_assert(sz !== null && sz !== undefined && isFinite(sz), "surface Z at trajectory point is null/undefined/NaN",
				{ name: name, k: k, wSnap: wSnap, bSnap: bSnap, sz: sz });
		}
	});

	// Assert: trajectory trace z must equal surface z at the same snapped (w, b)
	plotEl.data.forEach((tr, ti) => {
		if (ti === 0) return;  // skip surface trace
		if (!tr.x || !tr.y || !tr.z) return;
		const len = Math.min(tr.x.length, tr.y.length, tr.z.length);
		for (let k = 0; k < len; k++) {
			const wKey = tr.x[k].toFixed(1);
			const bKey = tr.y[k].toFixed(1);
			const wi = wIdxMap.get(wKey);
			const bi = bIdxMap.get(bKey);
			if (wi === undefined || bi === undefined) continue;
			const sz = surfaceGrid.Z[bi][wi];
			ll_assert_close(tr.z[k], sz, 0.0001, "trajectory point z must equal surface z (single source of truth)",
				{ name: tr.name, k: k, wKey: wKey, bKey: bKey, trajZ: tr.z[k], surfZ: sz });
		}
	});

	try {
		await Plotly.restyle("ll-3d-plot", { z: [surfaceGrid.Z], cmin: [newCmin], cmax: [newCmax] }, [0]);
		await Plotly.relayout("ll-3d-plot", {
			"scene.zaxis.range": [newCmin, newCmax],
			"scene.zaxis.autorange": false
		});
	} catch (e) { /* ignore */ }
	redraw3DTrajectories();
}

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
		colorscale: "Viridis",
		reversescale: true,
		cmin, cmax, showscale: true, opacity: 0.7,
		lighting: { ambient: 0.85, diffuse: 0.3, roughness: 0.9, fresnel: 0.05 },
		contours: { z: { show: false } },
		name: "loss surface",
		hoverinfo: "skip",
		connectgaps: true
	};
	const trajTraces = optimizers.map(name => {
		const info = OPTIMIZER_INFO[name];
		return {
			type: "scatter3d", mode: "lines+markers",
			x: [w0], y: [b0], z: [Math.log10(initLoss)],
			marker: {
				size: 8, color: info.color, symbol: info.marker3Symbol,
				line: { width: 2, color: "#ffffff" }
			},
			line:   { width: 5, color: info.color, dash: info.line3Dash, shape: "linear" },
			name,
			legendgroup: name,
			hovertemplate: "<b>" + name + "</b><br>w = %{x:.3g}<br>b = %{y:.3g}<br>log₁₀(loss) = %{z:.3g}<extra></extra>"
		};
	});

	const initZ = Math.log10(initLoss);

	Plotly.newPlot("ll-3d-plot", [surfaceTrace, ...trajTraces], {
		title: { text: "3-D Loss Landscape & Optimizer Trajectories", font: { color: tText() } },
		paper_bgcolor: "rgba(0,0,0,0)",
		plot_bgcolor:  "rgba(0,0,0,0)",
		transition: { duration: 0 },
		scene: {
			xaxis: Object.assign(commonAxis("weight w"), { range: [Ws[0], Ws[Ws.length - 1]], autorange: false }),
			yaxis: Object.assign(commonAxis("bias b"),  { range: [Bs[0], Bs[Bs.length - 1]], autorange: false }),
			zaxis: Object.assign(commonAxis("loss (log₁₀)"), { range: [cmin, cmax], autorange: false }),
			camera: { up: { x: 0, y: 0, z: 1 }, center: { x: 0, y: 0, z: 0 }, eye: { x: 1.3, y: 1.3, z: 1.2 } },
			dragmode: "turntable"
		},
		legend: { font: { color: tText() }, x: 0, y: 1 },
		margin: { l: 0, r: 0, b: 0, t: 40 },
		showlegend: true
	}, { responsive: true, displaylogo: false, modebar: { orientation: "h" }, displayModeBar: true });
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
		yaxis: commonAxis("loss (MSE)", { type: "log", tickformat: ".2~g" }),
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
	// ── Guard: optimizer must be in registry ─────────────────────────────────
	if (!OPTIMIZER_INFO[name]) { console.error("[loss_landscape] guard: unknown optimizer " + name); return; }

	const initModel = createModel(0.1, 0.1);
	const wInit = initModel.layers[0].getWeights()[0].dataSync()[0];
	const bInit = initModel.layers[0].getWeights()[1].dataSync()[0];
	// ── Guard: initial weights must be valid numbers ────────────────────────
	if (!isFinite(wInit) || !isFinite(bInit)) { console.error("[loss_landscape] guard: init weights invalid", wInit, bInit); return; }
	initModel.dispose();

	const optimizer = OPTIMIZER_INFO[name].factory(lr);
	const model = createModel(wInit, bInit);
	model.compile({ optimizer, loss: "meanSquaredError" });

	const trajW = [wInit], trajB = [bInit], trajLoss = [];
	const losses = [];

	state.trajW = state.trajW || {};
	state.trajB = state.trajB || {};
	state.trajW[name] = trajW.slice();
	state.trajB[name] = trajB.slice();

	const trajIdx  = state.currentOptimizers.indexOf(name) + 1;
	const fitIdx   = state.currentOptimizers.indexOf(name) + 1;
	const lossIdx  = state.currentOptimizers.indexOf(name);

	function scheduleRestyle(targetId, update, indices) {
		requestAnimationFrame(() => {
			Plotly.restyle(targetId, update, indices).catch(() => {});
		});
	}

	await model.fit(xsT, ysT, {
		epochs, batchSize: state.xs.length, verbose: 0,
		callbacks: {
			onBatchEnd: async () => { await tf.nextFrame(); },
			onEpochEnd: (epoch, logs) => {
				if (state.stopRequested) { model.stopTraining = true; return; }
				if (!logs || typeof logs.loss !== "number" || !isFinite(logs.loss)) {
					console.error("[loss_landscape] guard: invalid loss at epoch " + epoch + " for " + name, logs);
					return;
				}
				losses.push(logs.loss);
				const layer = model.layers[0];
				const ws = layer.getWeights();
				const w = ws[0].dataSync()[0], b = ws[1].dataSync()[0];
				if (!isFinite(w) || !isFinite(b)) {
					console.error("[loss_landscape] guard: NaN weights at epoch " + epoch + " for " + name, w, b);
					model.stopTraining = true;
					return;
				}
				trajW.push(w); trajB.push(b);

				state.model.finals = state.model.finals || {};
				state.model.finals[name] = { w: w, b: b, loss: logs.loss };
				renderModelReadout();

				scheduleRestyle("ll-loss-plot", {
					x: [losses.map((_, k) => k + 1)],
					y: [losses]
				}, [lossIdx]);

				const pl = calculatePredictionLine(w, b);
				scheduleRestyle("ll-fit-plot", { x: [pl.xs], y: [pl.ys] }, [fitIdx]);

				state.trajW[name] = trajW.slice();
				state.trajB[name] = trajB.slice();
				state.lossHistory[name] = losses.slice();
				ensureSurfaceCoversTrajectories(xsT, ysT);
				if (epoch % 5 === 0 || epoch === epochs - 1) {
					const surfaceGrid = buildSurfaceGrid();
					const plotEl = document.getElementById("ll-3d-plot");
					if (plotEl && plotEl.data && plotEl.data[0]) {
						const scale = state.scale3D || "log";
						const flatZ = surfaceGrid.Z.flat().filter(v => v !== null && isFinite(v));
						let newMin = flatZ.length > 0 ? Math.min.apply(null, flatZ) : 0;
						let newMax = flatZ.length > 0 ? Math.max.apply(null, flatZ) : 1;
						if (newMax - newMin < 0.5) { const mid = (newMax + newMin) / 2; newMin = mid - 0.25; newMax = mid + 0.25; }
						const newCmin = scale === "log" ? newMin - 1 : Math.max(0, newMin - (newMax - newMin) * 0.05);
						const newCmax = scale === "log" ? newMax + 0.5 : newMax * 1.1;
						Plotly.restyle("ll-3d-plot", {
							z: [surfaceGrid.Z],
							cmin: [newCmin],
							cmax: [newCmax]
						}, [0]).catch(err => console.error("[loss_landscape] guard: surface restyle failed:", err));
						Plotly.relayout("ll-3d-plot", {
							"scene.zaxis.range": [newCmin, newCmax],
							"scene.zaxis.autorange": false
						}).catch(() => {});
					}
				}
				redraw3DTrajectories();

				setProgress((epoch + 1) / epochs);
			}
		}
	});

	optimizer.dispose();
	model.dispose();
	state.lossHistory[name] = losses;
	state.trajW[name] = trajW.slice();
	state.trajB[name] = trajB.slice();
	redraw3DTrajectories();

	const finalW = trajW[trajW.length - 1];
	const finalB = trajB[trajB.length - 1];
	const finalLoss = trajLoss[trajLoss.length - 1];
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
	if (state.experimentRunning) { console.error("[loss_landscape] guard: experiment already running, ignoring click"); return; }
	if (!window.tf) { console.error("[loss_landscape] guard: tf.js not loaded"); return; }
	if (!window.Plotly) { console.error("[loss_landscape] guard: Plotly not loaded"); return; }
	setRunningUI(true);
	setProgress(0);
	state.stopRequested = false;
	state.landscape = { W: [], B: [], L: [], cache: {} };
	state.lossHistory = {};
	state.model = { w: 0.1, b: 0.1, loss: null, finals: {} };
	state.surfaceLookup = null;
	state.surfaceZMin = 0;
	state.surfaceZMax = 0;
	state.scale3D = "log";

	const optimizers = getSelectedOptimizers();
	if (optimizers.length === 0) {
		setStatus("Pick at least one optimizer.");
		setRunningUI(false);
		return;
	}
	state.currentOptimizers = optimizers;
	state.trajW = {};
	state.trajB = {};
	const lr = parseFloat(document.getElementById("ll-lr").value) || 0.01;
	const epochs = parseInt(document.getElementById("ll-epochs").value) || 100;
	if (!isFinite(lr) || lr <= 0) console.error("[loss_landscape] guard: invalid lr", lr);
	if (!isFinite(epochs) || epochs <= 0) console.error("[loss_landscape] guard: invalid epochs", epochs);
	state.activation = document.getElementById("ll-act").value;

	let data;
	try {
		setStatus("Reading data...");
		data = parseData();
		await tf.nextFrame();

		setStatus("Sampling loss surface...");
		await sampleLandscapeAround(0.1, 0.1, 3, data.xsT, data.ysT);

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

		setStatus("Re-sampling surface to cover trajectory ...");
		ensureSurfaceCoversTrajectories(data.xsT, data.ysT);
		await redrawSurfaceAndTrajectories();

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

	const xEl = document.getElementById("ll-x");
	const yEl = document.getElementById("ll-y");
	const checkDataMatchesPreset = () => {
		if (!state.presetXs || !state.presetYs) { state.dataMatchesPreset = false; return; }
		const curX = xEl.value.split(",").map(s => parseFloat(s.trim())).filter(n => !isNaN(n));
		const curY = yEl.value.split(",").map(s => parseFloat(s.trim())).filter(n => !isNaN(n));
		const same = curX.length === state.presetXs.length && curY.length === state.presetYs.length &&
			curX.every((v, i) => Math.abs(v - state.presetXs[i]) < 1e-9) &&
			curY.every((v, i) => Math.abs(v - state.presetYs[i]) < 1e-9);
		state.dataMatchesPreset = same;
		renderModelReadout();
	};
	if (xEl) xEl.addEventListener("input", checkDataMatchesPreset);
	if (yEl) yEl.addEventListener("input", checkDataMatchesPreset);

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
