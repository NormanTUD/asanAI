// ═══════════════════════════════════════════════════════════════════
// backproplab.js — Refactored
// ═══════════════════════════════════════════════════════════════════

// ── Top-level entry point ──────────────────────────────────────────

async function loadBackproplabModule() {
	sigmoidPlot("sigmoid-plot");
	renderBackpropVisual("bp-visual");
}

// ═══════════════════════════════════════════════════════════════════
// SECTION 1: SIGMOID INTERACTIVE PLOT
// ═══════════════════════════════════════════════════════════════════

function sigmoidPlot(containerId) {
	if (typeof Plotly === "undefined") return console.error("Plotly not loaded");
	const container = document.getElementById(containerId);
	if (!container) return console.error(`#${containerId} not found`);

	const sigmoid = (z) => 1 / (1 + Math.exp(-z));
	const sigmoidDeriv = (z) => { const s = sigmoid(z); return s * (1 - s); };

	const { zVals, sigVals, derivVals } = generateCurveData(sigmoid, sigmoidDeriv, -10, 10, 500);
	const traces = buildSigmoidTraces(zVals, sigVals, derivVals);
	const layout = buildSigmoidLayout(-10, 10, -0.15, 1.15);
	const config = { displayModeBar: false, responsive: true, staticPlot: true };

	Plotly.newPlot(container, traces, layout, config).then(() => {
		attachTangentOverlay(container, sigmoid, sigmoidDeriv, -10, 10);
	});
}

function generateCurveData(fn, derivFn, zMin, zMax, N) {
	const zVals = [], sigVals = [], derivVals = [];
	for (let i = 0; i <= N; i++) {
		const z = zMin + (zMax - zMin) * i / N;
		zVals.push(z);
		sigVals.push(fn(z));
		derivVals.push(derivFn(z));
	}
	return { zVals, sigVals, derivVals };
}

function buildSigmoidTraces(zVals, sigVals, derivVals) {
	return [
		{ x: zVals, y: sigVals, type: "scatter", mode: "lines", name: "Sigmoid",
			line: { color: "#2E86AB", width: 3 }, hoverinfo: "none" },
		{ x: zVals, y: derivVals, type: "scatter", mode: "lines", name: "Derivative",
			line: { color: "#e74c3c", width: 2, dash: "dot" }, hoverinfo: "none" },
	];
}

function buildSigmoidLayout(zMin, zMax, yMin, yMax) {
	const axisBase = (title, range) => ({
		title, range, gridcolor: "#E5E5E5", zeroline: true, zerolinecolor: "#aaa",
	});
	return {
		title: { text: "Sigmoid and derivative of Sigmoid", font: { size: 17 } },
		xaxis: axisBase("z", [zMin, zMax]),
		yaxis: axisBase("Value", [yMin, yMax]),
		plot_bgcolor: "white", paper_bgcolor: "white", hovermode: false,
		showlegend: true,
		legend: { x: 0.01, y: 0.99, bgcolor: "rgba(255,255,255,0.85)", bordercolor: "#ccc", borderwidth: 1 },
		margin: { t: 50, b: 70, l: 55, r: 20 },
	};
}

// ── Tangent overlay (canvas on top of Plotly chart) ────────────────

function attachTangentOverlay(container, sigmoid, sigmoidDeriv, zMin, zMax) {
	container.style.position = "relative";
	container.style.pointerEvents = "all";

	const canvas = createOverlayCanvas(container);
	const ctx = canvas.getContext("2d");

	const resizeCanvas = () => {
		const dpr = window.devicePixelRatio || 1;
		const rect = container.getBoundingClientRect();
		canvas.width = rect.width * dpr;
		canvas.height = rect.height * dpr;
		ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
	};

	let plotArea = null;
	const updatePlotArea = () => {
		const fl = container._fullLayout;
		if (!fl?.xaxis?.yaxis) return false;
		const xa = fl.xaxis, ya = fl.yaxis;
		plotArea = {
			left: xa._offset, top: ya._offset, width: xa._length, height: ya._length,
			xMin: xa.range[0], xMax: xa.range[1], yMin: ya.range[0], yMax: ya.range[1],
		};
		return true;
	};

	const dataToPixel = (dx, dy) => {
		if (!plotArea) return null;
		return {
			x: plotArea.left + (dx - plotArea.xMin) / (plotArea.xMax - plotArea.xMin) * plotArea.width,
			y: plotArea.top + (1 - (dy - plotArea.yMin) / (plotArea.yMax - plotArea.yMin)) * plotArea.height,
		};
	};

	const pixelToDataX = (px) => {
		if (!plotArea) return null;
		return plotArea.xMin + (px - plotArea.left) / plotArea.width * (plotArea.xMax - plotArea.xMin);
	};

	const clearCanvas = () => {
		const r = container.getBoundingClientRect();
		ctx.clearRect(0, 0, r.width, r.height);
	};

	const drawTangent = (z) => {
		clearCanvas();
		const s = sigmoid(z), slope = sigmoidDeriv(z);
		const halfLen = 2.5;
		const p0 = dataToPixel(z - halfLen, s + slope * -halfLen);
		const p1 = dataToPixel(z + halfLen, s + slope * halfLen);
		const pc = dataToPixel(z, s);
		if (!p0 || !p1 || !pc) return;

		// Tangent line
		ctx.beginPath(); ctx.moveTo(p0.x, p0.y); ctx.lineTo(p1.x, p1.y);
		ctx.strokeStyle = "#f59e0b"; ctx.lineWidth = 2.5; ctx.stroke();

		// Dot
		ctx.beginPath(); ctx.arc(pc.x, pc.y, 6, 0, 2 * Math.PI);
		ctx.fillStyle = "#f59e0b"; ctx.fill();
		ctx.strokeStyle = "#fff"; ctx.lineWidth = 2; ctx.stroke();

		// Label
		const label = `z=${z.toFixed(2)}  sigmoid(z)=${s.toFixed(4)}  slope=${slope.toFixed(4)}`;
		let labelX = pc.x + 10, labelY = pc.y - 18;
		if (labelY < plotArea.top + 20) labelY = pc.y + 24;
		const tw = ctx.measureText(label).width;
		ctx.font = "13px monospace";
		ctx.fillStyle = "rgba(255,255,255,0.85)";
		ctx.fillRect(labelX - 4, labelY - 13, tw + 8, 18);
		ctx.strokeStyle = "#cbd5e1"; ctx.lineWidth = 1;
		ctx.strokeRect(labelX - 4, labelY - 13, tw + 8, 18);
		ctx.fillStyle = "#334155"; ctx.fillText(label, labelX, labelY);
	};

	resizeCanvas();
	updatePlotArea();
	window.addEventListener("resize", () => {
		resizeCanvas();
		setTimeout(() => { updatePlotArea(); resizeCanvas(); }, 100);
	});

	// Mouse tracking with rAF throttle
	let rafId = null, lastX = null, lastY = null;
	const onFrame = () => {
		rafId = null;
		if (lastX === null) return;
		if (!plotArea) updatePlotArea();
		if (!plotArea) return;
		const rect = container.getBoundingClientRect();
		const px = lastX - rect.left, py = lastY - rect.top;
		if (px < plotArea.left || px > plotArea.left + plotArea.width ||
			py < plotArea.top  || py > plotArea.top + plotArea.height) {
			return clearCanvas();
		}
		const z = pixelToDataX(px);
		if (z == null || z < zMin || z > zMax) return clearCanvas();
		drawTangent(z);
	};

	container.addEventListener("mousemove", (e) => {
		lastX = e.clientX; lastY = e.clientY;
		if (!rafId) rafId = requestAnimationFrame(onFrame);
	});
	container.addEventListener("mouseleave", () => { lastX = lastY = null; clearCanvas(); });
}

function createOverlayCanvas(container) {
	const c = document.createElement("canvas");
	Object.assign(c.style, {
		position: "absolute", top: "0", left: "0",
		width: "100%", height: "100%", pointerEvents: "none", zIndex: "1000",
	});
	container.appendChild(c);
	return c;
}


// ═══════════════════════════════════════════════════════════════════
// SECTION 2: BACKPROP VISUAL — Main orchestrator
// ═══════════════════════════════════════════════════════════════════

function renderBackpropVisual(id) {
	const root = document.getElementById(id);
	if (!root) return;

	// ── State ──
	const S = {
		x1: 0.05, x2: 0.10, t1: 0.01, t2: 0.99, lr: 0.5,
		w1: 0.15, w2: 0.20, w3: 0.25, w4: 0.30, b1: 0.35, b2: 0.35,
		w5: 0.40, w6: 0.45, w7: 0.50, w8: 0.55, b3: 0.60, b4: 0.60,
	};
	const defaults = JSON.parse(JSON.stringify(S));
	let R = {};       // computed results
	let locked = null; // { type: 'node'|'weight', key: string } | null

	// ── Network topology (data-driven) ──
	const NODES = {
		x1: { x: 80,  y: 120, label: "x_1", layer: "input" },
		x2: { x: 80,  y: 280, label: "x_2", layer: "input" },
		h1: { x: 330, y: 120, label: "h_1", layer: "hidden" },
		h2: { x: 330, y: 280, label: "h_2", layer: "hidden" },
		o1: { x: 580, y: 120, label: "o_1", layer: "output" },
		o2: { x: 580, y: 280, label: "o_2", layer: "output" },
	};


	const CONNS = [
		["x1", "h1", "w1", "w_1"], ["x2", "h1", "w2", "w_2"],
		["x1", "h2", "w3", "w_3"], ["x2", "h2", "w4", "w_4"],
		["h1", "o1", "w5", "w_5"], ["h2", "o1", "w6", "w_6"],
		["h1", "o2", "w7", "w_7"], ["h2", "o2", "w8", "w_8"],
	];

	const LAYER_STYLE = {
		input:  { color: "#64748b", fill: "#f1f5f9", r: 28 },
		hidden: { color: "#3b82f6", fill: "#eff6ff", r: 34 },
		output: { color: "#10b981", fill: "#ecfdf5", r: 42 },
	};

	// Neuron config: which index (1 or 2), which weights feed in/out, etc.
	// This eliminates all the if/else branching in showNodeInfo/showWeightInfo.
	const HIDDEN_CFG = {
		h1: { idx: 1, wIn: ["w1", "w2"], wOut: ["w5", "w7"], bias: "b1",
			wInLabels: ["w_1", "w_2"], wOutLabels: ["w_5", "w_7"] },
		h2: { idx: 2, wIn: ["w3", "w4"], wOut: ["w6", "w8"], bias: "b2",
			wInLabels: ["w_3", "w_4"], wOutLabels: ["w_6", "w_8"] },
	};

	const OUTPUT_CFG = {
		o1: { idx: 1, wIn: ["w5", "w6"], bias: "b3", target: "t1",
			wInLabels: ["w_5", "w_6"] },
		o2: { idx: 2, wIn: ["w7", "w8"], bias: "b4", target: "t2",
			wInLabels: ["w_7", "w_8"] },
	};

	// Which weights to highlight when a node is selected
	const NODE_HIGHLIGHT_MAP = {
		h1: ["w1", "w2", "w5", "w7"],
		h2: ["w3", "w4", "w6", "w8"],
		o1: ["w1", "w2", "w3", "w4", "w5", "w6"],
		o2: ["w1", "w2", "w3", "w4", "w7", "w8"],
	};

	// ── Inject HTML ──
	root.innerHTML = buildRootHTML(id);
	const svg = document.getElementById(`${id}-svg`);
	const infoPanel = document.getElementById(`${id}-info`);
	const lossBar = document.getElementById(`${id}-lossbar`);
	const lossVal = document.getElementById(`${id}-lossval`);

	// ── Wire number inputs ──
	const numInputs = root.querySelectorAll("input[data-k]");
	numInputs.forEach((inp) => {
		inp.value = S[inp.dataset.k];
		inp.addEventListener("input", () => {
			S[inp.dataset.k] = parseFloat(inp.value) || 0;
			recompute();
		});
	});

	function syncInputs() {
		numInputs.forEach((inp) => { inp.value = parseFloat(S[inp.dataset.k]).toFixed(4); });
	}

	// ── Wire buttons ──
	document.getElementById(`${id}-apply`).addEventListener("click", applyOneStep);
	document.getElementById(`${id}-train`).addEventListener("click", () => {
		for (let i = 0; i < 100; i++) { recompute(); applyGradients(); }
		syncInputs(); recompute();
	});
	document.getElementById(`${id}-reset`).addEventListener("click", () => {
		Object.assign(S, JSON.parse(JSON.stringify(defaults)));
		locked = null; syncInputs(); recompute();
		showDefaultInfo();
	});

	// ── Core loop ──
	function recompute() {
		R = forwardAndBackward(S);
		drawSVG();
		lossBar.style.width = Math.min(R.E / 0.6 * 100, 100) + "%";
		lossVal.textContent = fmt(R.E);
		if (locked) showLockedInfo();
	}

	function applyOneStep() {
		applyGradients();
		syncInputs();
		recompute();
	}

	function applyGradients() {
		const lr = S.lr;
		const gradKeys = ["w1","w2","w3","w4","w5","w6","w7","w8","b1","b2","b3","b4"];
		gradKeys.forEach((k) => { S[k] -= lr * R["g" + k]; });
	}

	// ── SVG drawing ──
	function drawSVG() {
		let html = "";

		// Compute weight magnitude range for thickness scaling
		const allWeights = CONNS.map(([,, wk]) => Math.abs(S[wk]));
		const minW = Math.min(...allWeights);
		const maxW = Math.max(...allWeights);
		const MIN_THICK = 1;
		const MAX_THICK = 8;

		// Connection lines + weight labels
		CONNS.forEach(([from, to, wk, wl]) => {
			const a = NODES[from], b = NODES[to], val = S[wk];
			const absVal = Math.abs(val);
			const t = maxW > minW ? (absVal - minW) / (maxW - minW) : 0.5;
			const thick = MIN_THICK + t * (MAX_THICK - MIN_THICK);
			const col = val >= 0 ? "#3b82f6" : "#ef4444";
			let mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2;
			if (wk === "w2" || wk === "w6") my -= 14;
			if (wk === "w3" || wk === "w7") my += 32;
			html += `<line class="bp-conn" data-wk="${wk}" x1="${a.x}" y1="${a.y}" x2="${b.x}" y2="${b.y}" stroke="${col}" stroke-width="${thick}" stroke-opacity="0.5"/>`;
			const [base, sub] = wl.split("_");
			html += `<text class="bp-wlabel" data-wk="${wk}" x="${mx}" y="${my - 6}" text-anchor="middle" font-size="11" fill="#334155" font-weight="600" style="cursor:pointer;">${base}<tspan font-size="8" dy="3">${sub}</tspan><tspan dy="-3">=${fmt(val, 4)}</tspan></text>`;
		});

		// Neuron circles + values + deltas
		const nodeVals = {
			x1: S.x1, x2: S.x2, h1: R.h1, h2: R.h2,
			o1: R.o1, o2: R.o2,
		};
		for (const [nk, nd] of Object.entries(NODES)) {
			const sty = LAYER_STYLE[nd.layer];
			const isLocked = locked?.type === "node" && locked.key === nk;
			html += svgCircle(nd, sty, isLocked);
			html += svgNodeLabel(nd, sty.color, fmt(nodeVals[nk]), nk);
			html += svgDeltaLabel(nk, nd, sty.r);
		}

		// Layer headers
		["Input:80", "Hidden:330", "Output:580"].forEach((s) => {
			const [label, x] = s.split(":");
			html += `<text x="${x}" y="30" text-anchor="middle" font-size="13" fill="#94a3b8" font-weight="600">${label}</text>`;
		});

		// Central loss display
		html += `<text x="580" y="210" text-anchor="middle" font-size="13" fill="#ef4444" font-weight="700">Loss = ${fmt(R.E)}</text>`;

		svg.innerHTML = html;
		attachSVGListeners();
		if (locked) {
			if (locked.type === "node" && NODE_HIGHLIGHT_MAP[locked.key]) highlightWeights(NODE_HIGHLIGHT_MAP[locked.key]);
			else if (locked.type === "weight") highlightWeights([locked.key]);
		}
		tryRender();
	}

	function svgCircle(nd, sty, isLocked) {
		const stroke = isLocked ? "#f59e0b" : sty.color;
		const sw = isLocked ? 3.5 : 2.5;
		let s = `<circle class="bp-node" data-nk="${nd.label.replace('_','')}" cx="${nd.x}" cy="${nd.y}" r="${sty.r}" fill="${sty.fill}" stroke="${stroke}" stroke-width="${sw}" style="cursor:pointer;"/>`;
		if (isLocked) s += `<circle class="bp-locked-ring" cx="${nd.x}" cy="${nd.y}" r="${sty.r + 5}"/>`;
		return s;
	}

	function svgNodeLabel(nd, color, valStr, nk) {
		if (nk === "o1" || nk === "o2") {
			const i = nk === "o1" ? 1 : 2;
			const oVal = R["o" + i];
			const tVal = S["t" + i];
			const diff = oVal - tVal;
			const diffColor = Math.abs(diff) < 0.01 ? "#10b981" : "#ef4444";
			return `<text x="${nd.x}" y="${nd.y - 18}" text-anchor="middle" font-size="12" font-weight="700" fill="${color}" style="pointer-events:none;">$${nd.label}$</text>` +
				`<text x="${nd.x}" y="${nd.y - 2}" text-anchor="middle" font-size="10" font-family="monospace" fill="#1e293b" style="pointer-events:none;">out=${fmt(oVal)}</text>` +
				`<text x="${nd.x}" y="${nd.y + 12}" text-anchor="middle" font-size="10" font-family="monospace" fill="#f59e0b" style="pointer-events:none;">tgt=${fmt(tVal)}</text>` +
				`<text x="${nd.x}" y="${nd.y + 26}" text-anchor="middle" font-size="9" font-family="monospace" fill="${diffColor}" style="pointer-events:none;">Δ=${fmt(diff)}</text>`;
		}
		return `<text x="${nd.x}" y="${nd.y - 8}" text-anchor="middle" font-size="12" font-weight="700" fill="${color}" style="pointer-events:none;">$${nd.label}$</text>` +
			`<text x="${nd.x}" y="${nd.y + 10}" text-anchor="middle" font-size="11" font-family="monospace" fill="#1e293b" style="pointer-events:none;">${valStr}</text>`;
	}

	function svgDeltaLabel(nk, nd, r) {
		const deltaMap = { h1: ["h", 1, R.d_h1, "#d97706"], h2: ["h", 2, R.d_h2, "#d97706"],
			o1: ["o", 1, R.d_o1, "#dc2626"], o2: ["o", 2, R.d_o2, "#dc2626"] };
		const d = deltaMap[nk];
		if (!d) return "";
		const [prefix, idx, val, col] = d;
		return `<text x="${nd.x}" y="${nd.y + r + 14}" text-anchor="middle" font-size="15" fill="${col}" style="pointer-events:none;">δ<tspan baseline-shift="sub" font-size="7">${prefix}<tspan baseline-shift="sub" font-size="5">${idx}</tspan></tspan> = ${fmt(val)}</text>`;
	}

	function dashedLine(a, b) {
		return `<line x1="${a.x}" y1="${a.y}" x2="${b.x}" y2="${b.y}" stroke="#94a3b8" stroke-width="1" stroke-dasharray="4,4"/>`;
	}

	// ── SVG interaction ──
	function attachSVGListeners() {
		svg.querySelectorAll(".bp-node").forEach((el) => {
			el.addEventListener("click", (e) => {
				e.stopPropagation();
				const nk = el.dataset.nk;
				toggleLock("node", nk);
			});
		});
		svg.querySelectorAll(".bp-wlabel").forEach((el) => {
			el.addEventListener("click", (e) => {
				e.stopPropagation();
				toggleLock("weight", el.dataset.wk);
			});
		});
		svg.addEventListener("click", (e) => {
			if (e.target === svg || e.target.tagName === "svg") unlock();
		});
	}

	function toggleLock(type, key) {
		if (locked?.type === type && locked.key === key) return unlock();
		locked = { type, key };
		showLockedInfo();
		drawSVG();
	}

	function unlock() {
		locked = null;
		clearHighlights();
		showDefaultInfo();
		drawSVG();
	}

	function showLockedInfo() {
		if (locked.type === "node") showNodeInfo(locked.key);
		else showWeightInfo(locked.key);
	}

	function showDefaultInfo() {
		infoPanel.innerHTML = `<div class="md"><span style="color:#94a3b8;">Click any neuron or weight label to see its equations.</span></div>`;
		tryRender();
	}

	// ── Highlight helpers ──
	function highlightWeights(keys) {
		svg.querySelectorAll(".bp-conn").forEach((el) => {
			if (keys.includes(el.dataset.wk)) {
				el.classList.add("pulse"); el.classList.remove("dim");
				el.setAttribute("stroke", "#f59e0b");
			} else {
				el.classList.add("dim"); el.classList.remove("pulse");
			}
		});
		svg.querySelectorAll(".bp-wlabel").forEach((el) => {
			if (!keys.includes(el.dataset.wk)) el.classList.add("dim");
		});
	}

	function clearHighlights() {
		svg.querySelectorAll(".bp-conn").forEach((el) => {
			el.classList.remove("pulse", "dim");
			el.setAttribute("stroke", S[el.dataset.wk] >= 0 ? "#3b82f6" : "#ef4444");
		});
		svg.querySelectorAll(".bp-wlabel").forEach((el) => el.classList.remove("dim"));
	}

	// ── Info panel rendering ──
	function renderInfoHTML(html) {
		infoPanel.innerHTML = `<div class="md">${html}</div>`;
		const btn = document.createElement("button");
		btn.className = "bp-close"; btn.textContent = "✕";
		btn.addEventListener("click", unlock);
		infoPanel.prepend(btn);
		tryRender();
	}

	// ═════════════════════════════════════════════════════════════════
	// INFO PANELS — Node info (the big one)
	// ═════════════════════════════════════════════════════════════════

	function showNodeInfo(nk) {
		if (nk === "x1" || nk === "x2") return renderInfoHTML(inputNodeInfo(nk));
		if (nk === "t1" || nk === "t2") return renderInfoHTML(targetNodeInfo(nk));
		if (nk === "h1" || nk === "h2") return renderInfoHTML(hiddenNodeInfo(nk));
		if (nk === "o1" || nk === "o2") return renderInfoHTML(outputNodeInfo(nk));
	}

	function showWeightInfo(wk) {
		highlightWeights([wk]);
		const idx = parseInt(wk[1]); // 1-8
		if (idx <= 4) renderInfoHTML(inputHiddenWeightInfo(wk));
		else renderInfoHTML(hiddenOutputWeightInfo(wk));
	}

	// ── Input node info ──
	function inputNodeInfo(nk) {
		const i = nk === "x1" ? 1 : 2;
		const wTo = nk === "x1" ? ["w_1", "w_3"] : ["w_2", "w_4"];
		return `<h3>$${NODES[nk].label}$ — Input Neuron</h3>
<div class="bp-section">
$$${NODES[nk].label} = ${fmt(S[nk], 4)}$$
Raw input fed into the hidden layer via $${wTo[0]}$ (to $h_1$) and $${wTo[1]}$ (to $h_2$).
</div>`;
	}

	// ── Target node info ──
	function targetNodeInfo(nk) {
		const i = nk === "t1" ? 1 : 2;
		const oKey = "o" + i;
		return `<h3>$${NODES[nk].label}$ — Target (Ground Truth)</h3>
<div class="bp-section bp-section-out"><b>⬆ Prerequisite: How was $${NODES[oKey].label}$ computed?</b>
			${hiddenForwardLatex("Step 1 — Hidden layer forward pass (needed to get $h_1, h_2$):")}
		${outputForwardLatex(oKey, `Step 2 — Output neuron $${NODES[oKey].label}$ forward pass:`)}
</div>
<div class="bp-section bp-section-loss"><b>⬇ Loss computation for $${NODES[nk].label}$:</b>
			${lossLatex(i)}
		${totalLossLatex()}
</div>`;
	}

	function hiddenNodeInfo(nk) {
		const cfg = HIDDEN_CFG[nk];
		const i = cfg.idx;
		const hVal = R["h" + i], zh = R["zh" + i], dH = R["d_h" + i], dE_dh = R["dE_dh" + i];
		const [wA, wB] = cfg.wIn, [wAl, wBl] = cfg.wInLabels;
		const [wOutA, wOutB] = cfg.wOut, [wOutAl, wOutBl] = cfg.wOutLabels;
		const sigDeriv = hVal * (1 - hVal);
		const gw = [R["g" + wA], R["g" + wB]], gb = R["gb" + i];

		return `<h3>$h_${i}$ — Hidden Neuron</h3>

<div class="bp-section bp-section-hid"><b>① Forward Pass — Computing $h_${i}$</b>
			${neuronForwardLatex(`z_{h_${i}}`, `h_${i}`,
				[S[wA], S[wB]], [wAl, wBl],
				[S.x1, S.x2], ["x_1", "x_2"],
				S[cfg.bias], `b_${i}`, zh, hVal)}
</div>

<div class="bp-section bp-section-out"><b>② Prerequisite: Output deltas (needed for $\\delta_{o_1}, \\delta_{o_2}$)</b><br>
We need $\\delta_{o_1}$ and $\\delta_{o_2}$ to compute the backward pass for $h_${i}$:<br>
			${outputDeltaLatex(1)}
		${outputDeltaLatex(2)}
</div>

<div class="bp-section bp-section-back"><b>③ Backward Pass — Error signal for $h_${i}$</b>
Blame arrives from <em>both</em> output neurons, weighted by the connections:
$$\\frac{\\partial E}{\\partial h_${i}} = \\underbrace{${fmt(R.d_o1)}}_{\\substack{\\delta_{o_1} \\\\ \\text{error from }o_1}} \\cdot \\underbrace{${fmt(S[wOutA])}}_{\\substack{${wOutAl} \\\\ h_${i} \\to o_1}} \\;+\\; \\underbrace{${fmt(R.d_o2)}}_{\\substack{\\delta_{o_2} \\\\ \\text{error from }o_2}} \\cdot \\underbrace{${fmt(S[wOutB])}}_{\\substack{${wOutBl} \\\\ h_${i} \\to o_2}} = ${fmt(dE_dh)}$$
$$\\underbrace{h_${i}(1-h_${i})}_{\\text{sigmoid}'(z_{h_${i}})} = ${fmt(hVal)} \\times ${fmt(1 - hVal)} = ${fmt(sigDeriv)}$$
$$\\delta_{h_${i}} = \\underbrace{${fmt(dE_dh)}}_{\\frac{\\partial E}{\\partial h_${i}}} \\times \\underbrace{${fmt(sigDeriv)}}_{\\text{sigmoid}'(z_{h_${i}})} = \\boxed{${fmt(dH)}}$$
</div>

<div class="bp-section bp-section-grad"><b>④ Weight Gradients</b>
		${gradientLatex(wAl, `\\delta_{h_${i}}`, dH, "x_1", S.x1, gw[0])}
	${gradientLatex(wBl, `\\delta_{h_${i}}`, dH, "x_2", S.x2, gw[1])}
$$\\frac{\\partial E}{\\partial b_${i}} = \\delta_{h_${i}} = ${fmt(gb)}$$
</div>

<div class="bp-section bp-section-update"><b>⑤ Weight Updates</b>
			${updateLatex(wAl, S[wA], gw[0])}
		${updateLatex(wBl, S[wB], gw[1])}
		${updateLatex(`b_${i}`, S[cfg.bias], gb)}
</div>`;
	}

	// ═════════════════════════════════════════════════════════════════
	// Output node info
	// ═════════════════════════════════════════════════════════════════

	function outputNodeInfo(nk) {
		const cfg = OUTPUT_CFG[nk];
		const i = cfg.idx;
		const oVal = R["o" + i], zo = R["zo" + i];
		const dE_do = R["dE_do" + i], do_dz = R["do" + i + "_dz" + i], dO = R["d_o" + i];
		const tVal = S[cfg.target];
		const Ei = R["E" + i];
		const [wA, wB] = cfg.wIn, [wAl, wBl] = cfg.wInLabels;
		const gw = [R["g" + wA], R["g" + wB]], gb = R["gb" + (i + 2)];
		const bKey = cfg.bias, bLabel = `b_${i + 2}`;
		const dir = dO > 0 ? "Prediction too HIGH — needs to decrease"
			: dO < 0 ? "Prediction too LOW — needs to increase" : "Perfect!";

		return `<h3>$o_${i}$ — Output Neuron</h3>
<p style="color:#64748b;"><em>${dir}</em> &nbsp; (target $t_${i} = ${fmt(tVal, 4)}$)</p>

<div class="bp-section bp-section-hid"><b>① Prerequisite: Hidden layer forward pass</b>
			${hiddenForwardLatex()}
</div>

<div class="bp-section bp-section-out"><b>② Forward Pass — Computing $o_${i}$</b>
			${neuronForwardLatex(`z_{o_${i}}`, `o_${i}`,
				[S[wA], S[wB]], [wAl, wBl],
				[R.h1, R.h2], ["h_1", "h_2"],
				S[bKey], bLabel, zo, oVal)}
</div>

<div class="bp-section bp-section-loss"><b>③ Loss</b>
			${lossLatex(i)}
		${totalLossLatex()}
</div>

<div class="bp-section bp-section-back"><b>④ Backward Pass — The 3 chain-rule factors</b>
$$\\underbrace{\\frac{\\partial E}{\\partial o_${i}}}_{\\substack{\\text{how wrong?} \\\\ \\text{direction of error}}} = -\\!\\left(\\underbrace{${fmt(tVal, 4)}}_{t_${i}} - \\underbrace{${fmt(oVal)}}_{o_${i}}\\right) = ${fmt(dE_do)}$$
$$\\underbrace{\\frac{\\partial o_${i}}{\\partial z_{o_${i}}}}_{\\text{sigmoid}'(z_{o_${i}})} = \\underbrace{${fmt(oVal)}}_{o_${i}} \\cdot \\underbrace{${fmt(1 - oVal)}}_{1-o_${i}} = ${fmt(do_dz)}$$
$$\\delta_{o_${i}} = \\underbrace{${fmt(dE_do)}}_{\\frac{\\partial E}{\\partial o_${i}}} \\times \\underbrace{${fmt(do_dz)}}_{\\text{sigmoid}'(z_{o_${i}})} = \\boxed{${fmt(dO)}}$$
</div>

<div class="bp-section bp-section-grad"><b>⑤ Weight Gradients</b>
Each gradient = $\\delta_{o_${i}} \\times$ (the value that flowed through that weight):
	${gradientLatex(wAl, `\\delta_{o_${i}}`, dO, "h_1", R.h1, gw[0])}
	${gradientLatex(wBl, `\\delta_{o_${i}}`, dO, "h_2", R.h2, gw[1])}
$$\\frac{\\partial E}{\\partial ${bLabel}} = \\delta_{o_${i}} = ${fmt(gb)}$$
</div>

<div class="bp-section bp-section-update"><b>⑥ Weight Updates</b>
			${updateLatex(wAl, S[wA], gw[0])}
		${updateLatex(wBl, S[wB], gw[1])}
		${updateLatex(bLabel, S[bKey], gb)}
</div>`;
	}

	// ═════════════════════════════════════════════════════════════════
	// Weight info panels
	// ═════════════════════════════════════════════════════════════════

	function inputHiddenWeightInfo(wk) {
		const wLabel = "w_" + wk[1];
		const wVal = S[wk];
		const idx = parseInt(wk[1]);
		const isH1 = idx <= 2;
		const hi = isH1 ? 1 : 2;
		const hCfg = HIDDEN_CFG["h" + hi];
		const hVal = R["h" + hi], zh = R["zh" + hi], dH = R["d_h" + hi], dE_dh = R["dE_dh" + hi];
		const inputLabel = (idx % 2 === 1) ? "x_1" : "x_2";
		const inputVal = (idx % 2 === 1) ? S.x1 : S.x2;
		const grad = R["g" + wk];
		const nw = wVal - S.lr * grad;
		const dir = directionArrow(grad);

		return `<h3>$${wLabel} = ${fmt(wVal)}$ — Weight (Input → Hidden)</h3>
<p>Connects $${inputLabel}$ to $h_${hi}$</p>

<div class="bp-section bp-section-hid"><b>① Forward Pass — How $h_${hi}$ was computed</b>
			${singleHiddenForwardLatex(hi)}
</div>

<div class="bp-section bp-section-out"><b>② Prerequisite: Output deltas</b>
			${outputDeltaLatex(1)}
		${outputDeltaLatex(2)}
</div>

<div class="bp-section bp-section-back"><b>③ Hidden delta $\\delta_{h_${hi}}$</b>
		${hiddenDeltaLatex(hi)}
</div>

<div class="bp-section bp-section-grad"><b>④ Gradient for this weight</b>
			${gradientLatex(wLabel, `\\delta_{h_${hi}}`, dH, inputLabel, inputVal, grad)}
</div>

<div class="bp-section bp-section-update"><b>⑤ Weight Update</b>
			${updateLatex(wLabel, wVal, grad)}
$$${dir}$$
</div>`;
	}

	function hiddenOutputWeightInfo(wk) {
		const wLabel = "w_" + wk[1];
		const wVal = S[wk];
		const idx = parseInt(wk[1]);
		const isO1 = (idx === 5 || idx === 6);
		const oi = isO1 ? 1 : 2;
		const oCfg = OUTPUT_CFG["o" + oi];
		const oVal = R["o" + oi], zo = R["zo" + oi], dO = R["d_o" + oi], dE_do = R["dE_do" + oi];
		const tVal = S[oCfg.target];
		const Ei = R["E" + oi];
		const inputLabel = (idx % 2 === 1) ? "h_1" : "h_2";
		const inputVal = (idx % 2 === 1) ? R.h1 : R.h2;
		const grad = R["g" + wk];
		const nw = wVal - S.lr * grad;
		const dir = directionArrow(grad);
		const bLabel = `b_${oi + 2}`, bVal = S[oCfg.bias];

		return `<h3>$${wLabel} = ${fmt(wVal)}$ — Weight (Hidden → Output)</h3>
<p>Connects $${inputLabel}$ to $o_${oi}$</p>

<div class="bp-section bp-section-hid"><b>① Prerequisite: Hidden layer forward pass</b>
			${hiddenForwardLatex()}
</div>

<div class="bp-section bp-section-out"><b>② Forward Pass — How $o_${oi}$ was computed</b>
			${outputForwardLatex("o" + oi)}
</div>

<div class="bp-section bp-section-loss"><b>③ Loss</b>
			${lossLatex(oi)}
</div>

<div class="bp-section bp-section-back"><b>④ Output delta $\\delta_{o_${oi}}$</b>
$$\\frac{\\partial E}{\\partial o_${oi}} = -\\!\\left(\\underbrace{${fmt(tVal)}}_{\\substack{t_${oi} \\\\ \\text{target}}} - \\underbrace{${fmt(oVal)}}_{\\substack{o_${oi} \\\\ \\text{prediction}}}\\right) = ${fmt(dE_do)}$$
$$\\delta_{o_${oi}} = \\underbrace{${fmt(dE_do)}}_{\\substack{\\frac{\\partial E}{\\partial o_${oi}} \\\\ \\text{error signal}}} \\times \\underbrace{${fmt(oVal)} \\cdot ${fmt(1 - oVal)}}_{\\substack{\\text{sigmoid}'(z_{o_${oi}}) \\\\ \\text{local gradient}}} = ${fmt(dO)}$$
</div>

<div class="bp-section bp-section-grad"><b>⑤ Gradient for this weight</b>
			${gradientLatex(wLabel, `\\delta_{o_${oi}}`, dO, inputLabel, inputVal, grad)}
</div>

<div class="bp-section bp-section-update"><b>⑥ Weight Update</b>
			${updateLatex(wLabel, wVal, grad)}
$$${dir}$$
</div>`;
	}

	// ═════════════════════════════════════════════════════════════════
	// REUSABLE LATEX SNIPPET GENERATORS
	// ═════════════════════════════════════════════════════════════════

	// Generic neuron forward: z = w·x + w·x + b, then sigmoid
	function neuronForwardLatex(zLabel, outLabel, wVals, wLabels, xVals, xLabels, bVal, bLabel, zResult, outResult) {
		return `$$${zLabel} = \\underbrace{${fmt(wVals[0])}}_{\\substack{${wLabels[0]} \\\\ \\text{weight from }${xLabels[0]}}} \\cdot \\underbrace{${fmt(xVals[0])}}_{\\substack{${xLabels[0]} \\\\ \\text{input}}} \\;+\\; \\underbrace{${fmt(wVals[1])}}_{\\substack{${wLabels[1]} \\\\ \\text{weight from }${xLabels[1]}}} \\cdot \\underbrace{${fmt(xVals[1])}}_{\\substack{${xLabels[1]} \\\\ \\text{input}}} \\;+\\; \\underbrace{${fmt(bVal)}}_{\\substack{${bLabel} \\\\ \\text{bias}}} = ${fmt(zResult)}$$
$$${outLabel} = \\underbrace{\\text{sigmoid}\\!\\left(\\underbrace{${fmt(zResult)}}_{\\substack{${zLabel} \\\\ \\text{pre-activation}}}\\right)}_{\\substack{\\text{sigmoid squashes} \\\\ \\text{to range (0,1)}}} = \\frac{1}{1+e^{-${fmt(zResult)}}} = \\boxed{${fmt(outResult)}}$$`;
	}


	// Both hidden neurons forward pass (used as prerequisite block)
	function hiddenForwardLatex(heading) {
		const prefix = heading ? `<b>${heading}</b>\n` : "";
		return prefix +
			singleHiddenForwardLatex(1) + "\n" +
			singleHiddenForwardLatex(2);
	}

	// Single hidden neuron forward (compact, no substack annotations)
	function singleHiddenForwardLatex(i) {
		const cfg = HIDDEN_CFG["h" + i];
		const [wA, wB] = cfg.wIn, [wAl, wBl] = cfg.wInLabels;
		const zh = R["zh" + i], hVal = R["h" + i];
		return `$$z_{h_${i}} = \\underbrace{${fmt(S[wA])}}_{\\substack{${wAl} \\\\ \\text{weight from }x_1}} \\cdot \\underbrace{${fmt(S.x1)}}_{\\substack{x_1 \\\\ \\text{input}}} + \\underbrace{${fmt(S[wB])}}_{\\substack{${wBl} \\\\ \\text{weight from }x_2}} \\cdot \\underbrace{${fmt(S.x2)}}_{\\substack{x_2 \\\\ \\text{input}}} + \\underbrace{${fmt(S[cfg.bias])}}_{\\substack{b_${i} \\\\ \\text{bias}}} = ${fmt(zh)}$$
$$h_${i} = \\text{sigmoid}\\!\\left(\\underbrace{${fmt(zh)}}_{\\substack{z_{h_${i}} \\\\ \\text{pre-activation}}}\\right) = ${fmt(hVal)}$$`;
	}


	// Single output neuron forward (compact)
	function outputForwardLatex(oKey, heading) {
		const cfg = OUTPUT_CFG[oKey];
		const i = cfg.idx;
		const [wA, wB] = cfg.wIn, [wAl, wBl] = cfg.wInLabels;
		const zo = R["zo" + i], oVal = R["o" + i];
		const prefix = heading ? `<b>${heading}</b>\n` : "";
		return prefix +
`$$z_{o_${i}} = \\underbrace{${fmt(S[wA])}}_{\\substack{${wAl} \\\\ \\text{weight from }h_1}} \\cdot \\underbrace{${fmt(R.h1)}}_{\\substack{h_1 \\\\ \\text{hidden out}}} + \\underbrace{${fmt(S[wB])}}_{\\substack{${wBl} \\\\ \\text{weight from }h_2}} \\cdot \\underbrace{${fmt(R.h2)}}_{\\substack{h_2 \\\\ \\text{hidden out}}} + \\underbrace{${fmt(S[cfg.bias])}}_{\\substack{b_${i + 2} \\\\ \\text{bias}}} = ${fmt(zo)}$$
$$o_${i} = \\text{sigmoid}\\!\\left(\\underbrace{${fmt(zo)}}_{\\substack{z_{o_${i}} \\\\ \\text{pre-activation}}}\\right) = ${fmt(oVal)}$$`;
	}


	// Output delta for output neuron i (1 or 2)
	function outputDeltaLatex(i) {
		const oVal = R["o" + i], dE_do = R["dE_do" + i], dO = R["d_o" + i];
		const tVal = S["t" + i];
		return `<b>Output $o_${i}$:</b>
			${outputForwardLatex("o" + i)}
$$\\frac{\\partial E}{\\partial o_${i}} = -\\!\\left(\\underbrace{${fmt(tVal)}}_{\\substack{t_${i} \\\\ \\text{target}}} - \\underbrace{${fmt(oVal)}}_{\\substack{o_${i} \\\\ \\text{prediction}}}\\right) = ${fmt(dE_do)}$$
$$\\delta_{o_${i}} = \\underbrace{${fmt(dE_do)}}_{\\substack{\\frac{\\partial E}{\\partial o_${i}} \\\\ \\text{error signal}}} \\times \\underbrace{${fmt(oVal)} \\cdot ${fmt(1 - oVal)}}_{\\substack{\\text{sigmoid}'(z_{o_${i}}) \\\\ \\text{local gradient}}} = ${fmt(dO)}$$`;
	}


	// Hidden delta for hidden neuron i (1 or 2)
	function hiddenDeltaLatex(i) {
		const cfg = HIDDEN_CFG["h" + i];
		const [wOutA, wOutB] = cfg.wOut, [wOutAl, wOutBl] = cfg.wOutLabels;
		const hVal = R["h" + i], dE_dh = R["dE_dh" + i], dH = R["d_h" + i];
		const sigDeriv = hVal * (1 - hVal);
		return `$$\\frac{\\partial E}{\\partial h_${i}} = \\underbrace{${fmt(R.d_o1)}}_{\\substack{\\delta_{o_1} \\\\ \\text{error from }o_1}} \\cdot \\underbrace{${fmt(S[wOutA])}}_{\\substack{${wOutAl} \\\\ h_${i} \\to o_1}} \\;+\\; \\underbrace{${fmt(R.d_o2)}}_{\\substack{\\delta_{o_2} \\\\ \\text{error from }o_2}} \\cdot \\underbrace{${fmt(S[wOutB])}}_{\\substack{${wOutBl} \\\\ h_${i} \\to o_2}} = ${fmt(dE_dh)}$$
$$\\underbrace{h_${i}(1-h_${i})}_{\\substack{\\text{sigmoid}'(z_{h_${i}}) \\\\ \\text{local gradient}}} = ${fmt(hVal)} \\times ${fmt(1 - hVal)} = ${fmt(sigDeriv)}$$
$$\\delta_{h_${i}} = \\underbrace{${fmt(dE_dh)}}_{\\substack{\\frac{\\partial E}{\\partial h_${i}} \\\\ \\text{upstream gradient}}} \\times \\underbrace{${fmt(sigDeriv)}}_{\\substack{\\text{sigmoid}'(z_{h_${i}}) \\\\ \\text{local gradient}}} = \\boxed{${fmt(dH)}}$$`;
	}


	// Loss for output i
	function lossLatex(i) {
		const tVal = S["t" + i], oVal = R["o" + i], Ei = R["E" + i];
		return `$$E_${i} = \\tfrac{1}{2}\\!\\left(\\underbrace{${fmt(tVal, 4)}}_{\\substack{t_${i} \\\\ \\text{target}}} - \\underbrace{${fmt(oVal)}}_{\\substack{o_${i} \\\\ \\text{prediction}}}\\right)^{\\!2} = ${fmt(Ei)}$$`;
	}


	// Total loss
	function totalLossLatex() {
		return `$$E_{\\text{total}} = E_1 + E_2 = ${fmt(R.E1)} + ${fmt(R.E2)} = ${fmt(R.E)}$$`;
	}

	// Single gradient line: ∂E/∂w = delta · input = value
	function gradientLatex(wLabel, deltaLabel, deltaVal, inputLabel, inputVal, gradVal) {
		return `$$\\frac{\\partial E}{\\partial ${wLabel}} = \\underbrace{${fmt(deltaVal)}}_{\\substack{${deltaLabel} \\\\ \\text{error signal}}} \\cdot \\underbrace{${fmt(inputVal)}}_{\\substack{${inputLabel} \\\\ \\text{activation}}} = ${fmt(gradVal)}$$`;
	}


	// Single weight update line
	function updateLatex(wLabel, wVal, gradVal) {
		const nw = wVal - S.lr * gradVal;
		return `$$${wLabel}^{\\,\\text{new}} = \\underbrace{${fmt(wVal)}}_{\\substack{${wLabel} \\\\ \\text{current weight}}} - \\underbrace{${fmt(S.lr)}}_{\\substack{\\eta \\\\ \\text{learning rate}}} \\cdot \\underbrace{${fmt(gradVal)}}_{\\substack{\\frac{\\partial E}{\\partial ${wLabel}} \\\\ \\text{gradient}}} = ${fmt(nw)}$$`;
	}


	// Direction arrow for weight change
	function directionArrow(grad) {
		return grad > 0 ? "\\searrow \\text{ weight decreases}"
			: grad < 0 ? "\\nearrow \\text{ weight increases}"
			: "\\text{no change}";
	}

	// ═════════════════════════════════════════════════════════════════
	// PURE COMPUTATION — forward + backward pass
	// ═════════════════════════════════════════════════════════════════

	function forwardAndBackward(S) {
		const sig = z => 1 / (1 + Math.exp(-z));
		const { x1, x2, t1, t2, w1, w2, w3, w4, b1, b2, w5, w6, w7, w8, b3, b4 } = S;

		// Forward
		const zh1 = w1*x1 + w2*x2 + b1, h1 = sig(zh1);
		const zh2 = w3*x1 + w4*x2 + b2, h2 = sig(zh2);
		const zo1 = w5*h1 + w6*h2 + b3, o1 = sig(zo1);
		const zo2 = w7*h1 + w8*h2 + b4, o2 = sig(zo2);
		const E1 = 0.5*(t1-o1)**2, E2 = 0.5*(t2-o2)**2, E = E1 + E2;

		// Backward — output deltas
		const dE_do1 = -(t1-o1), do1_dz1 = o1*(1-o1), d_o1 = dE_do1 * do1_dz1;
		const dE_do2 = -(t2-o2), do2_dz2 = o2*(1-o2), d_o2 = dE_do2 * do2_dz2;

		// Gradients for hidden→output weights
		const gw5 = d_o1*h1, gw6 = d_o1*h2, gb3 = d_o1;
		const gw7 = d_o2*h1, gw8 = d_o2*h2, gb4 = d_o2;

		// Backward — hidden deltas
		const dE_dh1 = d_o1*w5 + d_o2*w7, d_h1 = dE_dh1 * h1*(1-h1);
		const dE_dh2 = d_o1*w6 + d_o2*w8, d_h2 = dE_dh2 * h2*(1-h2);

		// Gradients for input→hidden weights
		const gw1 = d_h1*x1, gw2 = d_h1*x2, gb1 = d_h1;
		const gw3 = d_h2*x1, gw4 = d_h2*x2, gb2 = d_h2;

		return {
			zh1, h1, zh2, h2, zo1, o1, zo2, o2, E1, E2, E,
			dE_do1, do1_dz1, d_o1, dE_do2, do2_dz2, d_o2,
			gw5, gw6, gb3, gw7, gw8, gb4,
			dE_dh1, d_h1, dE_dh2, d_h2,
			gw1, gw2, gb1, gw3, gw4, gb2,
		};
	}

	// ═════════════════════════════════════════════════════════════════
	// UTILITIES
	// ═════════════════════════════════════════════════════════════════

	function fmt(v, d = 4) { return Number(v).toFixed(d); }

	function tryRender() {
		try { render_temml(); } catch (e) { /* MathML renderer not loaded */ }
	}

	function buildRootHTML(id) {
		// (This returns the same HTML template as before — the fieldsets,
		//  SVG container, loss bar, and info panel. Unchanged from original.
		//  Omitted here for brevity since it's pure markup, not logic.)
		return `
  <style>
    /* ... same CSS as original, unchanged ... */
    #${id} { font-family: system-ui, sans-serif; max-width: 960px; }
    #${id} * { box-sizing: border-box; }
    #${id} .bp-top { display: flex; gap: 10px; flex-wrap: wrap; margin-bottom: 8px; align-items: flex-end; }
    #${id} .bp-top label { font-size: 0.72rem; color: #475569; font-weight: 600; }
    #${id} .bp-top input[type=number] { width: 58px; font-size: 0.8rem; padding: 2px 4px; border: 1px solid #cbd5e1; border-radius: 4px; text-align: center; }
    #${id} .bp-top .bp-group { display: flex; flex-direction: column; gap: 2px; }
    #${id} .bp-btn { border: none; padding: 6px 12px; border-radius: 6px; cursor: pointer; font-size: 0.78rem; font-weight: 600; color: #fff; }
    #${id} svg text { user-select: none; }
    #${id} .bp-info-panel { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 14px 18px; min-height: 100px; font-size: 0.92rem; line-height: 1.9; overflow-x: auto; position: relative; }
    #${id} .bp-info-panel .bp-close { position: absolute; top: 8px; right: 12px; cursor: pointer; background: #e2e8f0; border: none; border-radius: 50%; width: 24px; height: 24px; font-size: 0.8rem; color: #475569; display: flex; align-items: center; justify-content: center; }
    #${id} .bp-info-panel .bp-close:hover { background: #cbd5e1; }
    #${id} .bp-info-panel .bp-section { border-left: 3px solid #e2e8f0; padding-left: 12px; margin: 10px 0; }
    #${id} .bp-info-panel .bp-section-hid { border-left-color: #0ea5e9; }
    #${id} .bp-info-panel .bp-section-out { border-left-color: #f97316; }
    #${id} .bp-info-panel .bp-section-loss { border-left-color: #ef4444; }
    #${id} .bp-info-panel .bp-section-back { border-left-color: #dc2626; }
    #${id} .bp-info-panel .bp-section-grad { border-left-color: #be123c; }
    #${id} .bp-info-panel .bp-section-update { border-left-color: #a855f7; }
    #${id} .bp-loss { display: flex; align-items: center; gap: 8px; margin-top: 6px; }
    #${id} .bp-loss-track { flex: 1; height: 14px; background: #fee2e2; border-radius: 7px; overflow: hidden; }
    #${id} .bp-loss-fill { height: 100%; background: #ef4444; border-radius: 7px; transition: width 0.3s; }
    @keyframes bpPulse { 0%,100%{stroke-width:2;stroke-opacity:0.3} 50%{stroke-width:7;stroke-opacity:1} }
    #${id} .pulse { animation: bpPulse 5s ease-in-out infinite; }
	#${id} .dim { opacity: 0.12; }
    #${id} .bp-locked-ring { fill: none; stroke: #f59e0b; stroke-width: 3; stroke-dasharray: 4,3; }
  </style>

  <div class="bp-top">
    <fieldset style="border:1px solid #cbd5e1; border-radius:6px; padding:8px 12px; margin-bottom:6px;">
      <legend style="font-size:0.78rem; font-weight:700; color:#64748b;">Inputs</legend>
      <div style="display:flex; gap:10px; flex-wrap:wrap;">
	<div class="bp-group"><label>$$x_1$$</label><input style="width:100px" type="number" data-k="x1" step="0.01"></div>
	<div class="bp-group"><label>$$x_2$$</label><input style="width:100px" type="number" data-k="x2" step="0.01"></div>
      </div>
    </fieldset>

    <fieldset style="border:1px solid #cbd5e1; border-radius:6px; padding:8px 12px; margin-bottom:6px;">
      <legend style="font-size:0.78rem; font-weight:700; color:#f59e0b;">Targets</legend>
      <div style="display:flex; gap:10px; flex-wrap:wrap;">
	<div class="bp-group"><label>$$t_1$$</label><input style="width:100px" type="number" data-k="t1" step="0.01"></div>
	<div class="bp-group"><label>$$t_2$$</label><input style="width:100px" type="number" data-k="t2" step="0.01"></div>
      </div>
    </fieldset>

    <fieldset style="border:1px solid #cbd5e1; border-radius:6px; padding:8px 12px; margin-bottom:6px;">
      <legend style="font-size:0.78rem; font-weight:700; color:#8b5cf6;">Hyperparameters</legend>
      <div style="display:flex; gap:10px; flex-wrap:wrap;">
	<div class="bp-group"><label>$$\\eta$$</label><input style="width:100px" type="number" data-k="lr" step="0.05" min="0.01" max="5"></div>
      </div>
    </fieldset>

    <fieldset style="border:1px solid #cbd5e1; border-radius:6px; padding:8px 12px; margin-bottom:6px;">
      <legend style="font-size:0.78rem; font-weight:700; color:#3b82f6;">Input → Hidden</legend>
      <div style="display:flex; gap:10px; flex-wrap:wrap;">
	${["w1","w2","w3","w4","b1","b2"].map(k =>
		`<div class="bp-group"><label>$$${k.replace(/([wb])(\d)/,'$1_$2')}$$</label><input style="width:100px" type="number" data-k="${k}" step="0.01"></div>`
	).join("")}
      </div>
    </fieldset>

    <fieldset style="border:1px solid #cbd5e1; border-radius:6px; padding:8px 12px; margin-bottom:6px;">
      <legend style="font-size:0.78rem; font-weight:700; color:#10b981;">Hidden → Output</legend>
      <div style="display:flex; gap:10px; flex-wrap:wrap;">
	${["w5","w6","w7","w8","b3","b4"].map(k =>
		`<div class="bp-group"><label>$$${k.replace(/([wb])(\d)/,'$1_$2')}$$</label><input style="width:100px" type="number" data-k="${k}" step="0.01"></div>`
	).join("")}
      </div>
    </fieldset>

    <div style="display:flex; gap:10px; flex-wrap:wrap; margin-top:8px;">
      <button class="bp-btn" style="background:#10b981;" id="${id}-apply">✅ Apply 1 Step</button>
      <button class="bp-btn" style="background:#8b5cf6;" id="${id}-train">⟳ Train 100</button>
      <button class="bp-btn" style="background:#64748b;" id="${id}-reset">↺ Reset</button>
    </div>
  </div>

  <svg id="${id}-svg" width="100%" viewBox="0 0 820 400"
       style="background:#f8fafc; border-radius:10px; border:1px solid #e2e8f0; display:block; margin-bottom:8px; cursor:default;">
  </svg>

  <div class="bp-loss">
    <span style="font-size:0.8rem; font-weight:600; color:#475569;">Loss:</span>
    <div class="bp-loss-track"><div class="bp-loss-fill" id="${id}-lossbar"></div></div>
    <span id="${id}-lossval" style="font-size:0.82rem; font-family:monospace; min-width:70px;"></span>
  </div>

  <div class="bp-info-panel" id="${id}-info">
    <div class="md"><span style="color:#94a3b8;">Click any neuron or weight label to see its equations.</span></div>
  </div>`;
	}

	// ═════════════════════════════════════════════════════════════════
	// BOOT — initial render
	// ═════════════════════════════════════════════════════════════════

	recompute();
	syncInputs();
	showDefaultInfo();

} // end renderBackpropVisual


// ═══════════════════════════════════════════════════════════════════
// MODULE ENTRY POINT
// ═══════════════════════════════════════════════════════════════════

async function loadBackproplabModule() {
	sigmoidPlot("sigmoid-plot");
	renderBackpropVisual("bp-visual");
}
