"use strict";

/* =============================================================================
   Loss Landscape & Optimizer-Trajectories — Blog Module
   -----------------------------------------------------------------------------
   Adapted from the standalone loss_landscape.html so it works inside the
   blog lesson pipeline. Uses the blog's preloaded tf, Plotly, temml, and
   jQuery globals. A small local helper renders temml inside dynamically
   created equation containers (the blog's auto-renderer only walks the
   initial page DOM, not content added after start).
   ============================================================================= */

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
		} catch (err) {
			console.error("loss_landscape temml error:", err, "\n" + latex);
		}
	}
}

const PLOT_DENSITY_STEP = 0.1;
let currentActivation = "linear";

const OPTIMIZER_CONFIGS = {
	SGD: {
		factory: (params) => tf.train.sgd(params.learningRate),
		params: [{ name: "learningRate", label: "Lernrate (LR)", default: 0.01, min: 0.0001, max: 1, step: 0.001 }],
		defaults: { learningRate: 0.01 }
	},
	Momentum: {
		factory: (params) => tf.train.momentum(params.learningRate, params.momentum, params.useNesterov === "true"),
		params: [
			{ name: "learningRate", label: "Lernrate (LR)", default: 0.01, min: 0.0001, max: 1, step: 0.001 },
			{ name: "momentum", label: "Momentum", default: 0.9, min: 0.0, max: 1.0, step: 0.1 },
			{ name: "useNesterov", label: "Nesterov verwenden?", type: "select", options: [{ value: "false", text: "Nein" }, { value: "true", text: "Ja" }], default: "false" }
		],
		defaults: { learningRate: 0.01, momentum: 0.9, useNesterov: "false" }
	},
	Adagrad: {
		factory: (params) => tf.train.adagrad(params.learningRate, params.initialAccumulatorValue),
		params: [
			{ name: "learningRate", label: "Lernrate (LR)", default: 0.01, min: 0.0001, max: 1, step: 0.001 },
			{ name: "initialAccumulatorValue", label: "Init. Akku-Wert", default: 0.1, min: 0.0, max: 1.0, step: 0.01 }
		],
		defaults: { learningRate: 0.01, initialAccumulatorValue: 0.1 }
	},
	Adadelta: {
		factory: (params) => tf.train.adadelta(params.learningRate, params.rho, params.epsilon),
		params: [
			{ name: "learningRate", label: "Lernrate (LR)", default: 1.0, min: 0.0001, max: 10, step: 0.1 },
			{ name: "rho", label: "Rho (Verfall)", default: 0.95, min: 0.0, max: 1.0, step: 0.01 },
			{ name: "epsilon", label: "Epsilon", default: 1e-8, min: 1e-9, max: 1e-6, step: 1e-9 }
		],
		defaults: { learningRate: 1.0, rho: 0.95, epsilon: 1e-8 }
	},
	Adam: {
		factory: (params) => tf.train.adam(params.learningRate, params.beta1, params.beta2, params.epsilon),
		params: [
			{ name: "learningRate", label: "Lernrate (LR)", default: 0.01, min: 0.0001, max: 1, step: 0.0001 },
			{ name: "beta1", label: "Beta1", default: 0.9, min: 0.0, max: 1.0, step: 0.01 },
			{ name: "beta2", label: "Beta2", default: 0.999, min: 0.0, max: 1.0, step: 0.001 },
			{ name: "epsilon", label: "Epsilon", default: 1e-8, min: 1e-9, max: 1e-6, step: 1e-9 }
		],
		defaults: { learningRate: 0.01, beta1: 0.9, beta2: 0.999, epsilon: 1e-8 }
	},
	Adamax: {
		factory: (params) => tf.train.adamax(params.learningRate, params.beta1, params.beta2, params.epsilon, params.decay),
		params: [
			{ name: "learningRate", label: "Lernrate (LR)", default: 0.002, min: 0.0001, max: 1, step: 0.0001 },
			{ name: "beta1", label: "Beta1", default: 0.9, min: 0.0, max: 1.0, step: 0.01 },
			{ name: "beta2", label: "Beta2", default: 0.999, min: 0.0, max: 1.0, step: 0.001 },
			{ name: "epsilon", label: "Epsilon", default: 1e-8, min: 1e-9, max: 1e-6, step: 1e-9 },
			{ name: "decay", label: "Verfall", default: 0.0, min: 0.0, max: 0.1, step: 0.001 }
		],
		defaults: { learningRate: 0.002, beta1: 0.9, beta2: 0.999, epsilon: 1e-8, decay: 0.0 }
	},
	RMSProp: {
		factory: (params) => tf.train.rmsprop(params.learningRate, params.decay, params.momentum, params.epsilon, params.centered === "true"),
		params: [
			{ name: "learningRate", label: "Lernrate (LR)", default: 0.001, min: 0.0001, max: 1, step: 0.0001 },
			{ name: "decay", label: "Verfall", default: 0.9, min: 0.0, max: 1.0, step: 0.01 },
			{ name: "momentum", label: "Momentum", default: 0.0, min: 0.0, max: 1.0, step: 0.1 },
			{ name: "epsilon", label: "Epsilon", default: 1e-10, min: 1e-11, max: 1e-8, step: 1e-11 },
			{ name: "centered", label: "Zentriert?", type: "select", options: [{ value: "false", text: "Nein" }, { value: "true", text: "Ja" }], default: "false" }
		],
		defaults: { learningRate: 0.001, decay: 0.9, momentum: 0.0, epsilon: 1e-10, centered: "false" }
	}
};

let experimentRunning = false;
let stopRequested = false;

let lossCache = {};
let currentLandscapeBounds = { minW: 0, maxW: 0, minB: 0, maxB: 0 };
let currentLandscapeData = { W: [], B: [], L: [] };
let plotInstances = {};

let globalDataXMin = 0;
let globalDataXMax = 0;
let globalDataYMin = 0;
let globalDataYMax = 0;
let globalXsArray = [];
let globalYsArray = [];

let globalOptimizerIndex = 0;
let globalOptimizers = [];
let globalEpochTimestamps = [];
let globalStartTime = 0;
let lossHistory = {};
let lastTrainedModelWeights = {};

function loadExample(type) {
	const xInput = document.getElementById("dataInput");
	const yInput = document.getElementById("dataOutput");

	let xs, ys;

	const setParamDefault = (id, value) => {
		const el = document.getElementById(id);
		if (el) el.value = value;
	};

	switch (type) {
		case "linear":
			xs = Array.from({ length: 11 }, (_, i) => i - 5);
			ys = xs.map(x => 2 * x + 1);
			setParamDefault("epochs", "50");
			setParamDefault("steps", "3");
			setParamDefault("activation", "linear");
			break;
		case "linear_negative":
			xs = Array.from({ length: 11 }, (_, i) => i - 5);
			ys = xs.map(x => -0.5 * x + -0.8);
			setParamDefault("epochs", "50");
			setParamDefault("steps", "3");
			setParamDefault("activation", "linear");
			break;
		case "parabola":
			xs = Array.from({ length: 21 }, (_, i) => (i - 10) / 2.0);
			ys = xs.map(x => x * x + 5);
			setParamDefault("epochs", "100");
			setParamDefault("steps", "5");
			setParamDefault("activation", "relu");
			break;
		case "sinus":
			xs = Array.from({ length: 30 }, (_, i) => i * 0.4);
			ys = xs.map(x => Math.sin(x) * x + 5);
			setParamDefault("epochs", "200");
			setParamDefault("steps", "7");
			setParamDefault("activation", "tanh");
			break;
		default:
			return;
	}

	xInput.value = xs.map(n => n.toFixed(1)).join(", ");
	yInput.value = ys.map(n => n.toFixed(3)).join(", ");

	document.getElementById("status").innerText = `Beispieldaten für '${type}' geladen.`;
	updateOptimizerOptions();
}
window.loadExample = loadExample;

function parseData() {
	try {
		const xStr = document.getElementById("dataInput").value;
		const yStr = document.getElementById("dataOutput").value;

		const xsArray = xStr.split(",").map(s => parseFloat(s.trim())).filter(n => !isNaN(n));
		const ysArray = yStr.split(",").map(s => parseFloat(s.trim())).filter(n => !isNaN(n));

		if (xsArray.length !== ysArray.length || xsArray.length === 0) {
			throw new Error("X- und Y-Daten müssen die gleiche Anzahl gültiger Zahlen enthalten.");
		}

		globalDataXMin = Math.min(...xsArray);
		globalDataXMax = Math.max(...xsArray);
		globalDataYMin = Math.min(...ysArray);
		globalDataYMax = Math.max(...ysArray);
		globalXsArray = xsArray;
		globalYsArray = ysArray;

		const xs = tf.tensor2d(xsArray.map(x => [x]));
		const ys = tf.tensor2d(ysArray.map(y => [y]));

		return { xs, ys, N_DATA_POINTS: xsArray.length, xsArray, ysArray };
	} catch (error) {
		document.getElementById("status").innerText = `Fehler beim Parsen der Daten: ${error.message}`;
		throw error;
	}
}

function initializeOptimizerCheckboxes() {
	const container = document.getElementById("optimizer-checkboxes");
	if (!container) return;
	container.innerHTML = "";

	for (const name in OPTIMIZER_CONFIGS) {
		const id = `opt-${name}`;
		const label = document.createElement("label");

		const checkbox = document.createElement("input");
		checkbox.type = "checkbox";
		checkbox.id = id;
		checkbox.name = "optimizer";
		checkbox.value = name;
		checkbox.onchange = updateOptimizerOptions;

		if (["SGD", "Adam", "Momentum"].includes(name)) {
			checkbox.checked = true;
		}

		label.appendChild(checkbox);
		label.appendChild(document.createTextNode(name));
		container.appendChild(label);
	}
	updateOptimizerOptions();
}

function updateOptimizerOptions() {
	const container = document.getElementById("optimizer-options-container");
	if (!container) return;
	container.innerHTML = "";

	const selectedOptimizers = Array.from(document.querySelectorAll('input[name="optimizer"]:checked'))
		.map(checkbox => checkbox.value);

	if (selectedOptimizers.length === 0) {
		container.innerHTML = "Bitte wählen Sie mindestens einen Optimizer aus.";
		return;
	}

	const uniqueParams = {};
	for (const name of selectedOptimizers) {
		const config = OPTIMIZER_CONFIGS[name];
		for (const param of config.params) {
			if (!uniqueParams[param.name]) {
				uniqueParams[param.name] = { ...param, optimizers: [name] };
			} else {
				uniqueParams[param.name].optimizers.push(name);
			}
		}
	}

	const sortedParams = Object.values(uniqueParams).sort((a, b) => {
		if (a.name === "learningRate") return -1;
		if (b.name === "learningRate") return 1;
		return a.name.localeCompare(b.name);
	});

	for (const param of sortedParams) {
		const paramGroup = document.createElement("div");
		paramGroup.className = "param-group";

		const description = document.createElement("p");
		description.innerText = `${param.label} (${param.name}) für: ${param.optimizers.join(", ")}`;
		paramGroup.appendChild(description);

		const label = document.createElement("label");
		label.setAttribute("for", `param-${param.name}`);

		if (param.type === "select") {
			const select = document.createElement("select");
			select.id = `param-${param.name}`;
			select.name = `param-${param.name}`;
			select.dataset.default = param.default;

			for (const option of param.options) {
				const optEl = document.createElement("option");
				optEl.value = option.value;
				optEl.text = option.text;
				if (option.value.toString() === param.default.toString()) {
					optEl.selected = true;
				}
				select.appendChild(optEl);
			}
			label.appendChild(select);
		} else {
			const input = document.createElement("input");
			input.type = "number";
			input.id = `param-${param.name}`;
			input.name = `param-${param.name}`;
			input.value = param.default;
			input.min = param.min;
			input.max = param.max;
			input.step = param.step;
			input.dataset.default = param.default;
			label.appendChild(input);
		}

		paramGroup.appendChild(label);
		container.appendChild(paramGroup);
	}
}

function relayoutAllPlots() {
	const plotDivs = document.querySelectorAll(".plot-div");
	plotDivs.forEach(div => {
		if (div.offsetParent !== null) {
			Plotly.relayout(div.id, {
				width: div.clientWidth,
				height: div.clientHeight
			}).catch(e => console.log("Plotly relayout error:", e));
		}
	});
}

function computeLossForWeights(w, b, xs, ys, activation) {
	return tf.tidy(() => {
		const W = tf.tensor2d([[w]]);
		const B = tf.tensor1d([b]);
		let predictions = xs.matMul(W).add(B);

		switch (activation) {
			case "relu":
				predictions = predictions.relu();
				break;
			case "sigmoid":
				predictions = predictions.sigmoid();
				break;
			case "tanh":
				predictions = predictions.tanh();
				break;
		}

		const loss = predictions.sub(ys).square().mean();
		return loss.dataSync()[0];
	});
}

function createSimpleModel(initialW, initialB) {
	const model = tf.sequential();

	const initialWConstant = parseFloat(document.getElementById("initialWConstant").value) || 0.1;
	const initialBConstant = parseFloat(document.getElementById("initialBConstant").value) || 0.1;

	const isContinuing = initialW !== undefined && initialB !== undefined;

	const weightsInitializer = isContinuing
		? "zeros"
		: tf.initializers.constant({ value: initialWConstant });
	const biasInitializer = isContinuing
		? "zeros"
		: tf.initializers.constant({ value: initialBConstant });

	model.add(tf.layers.dense({
		units: 1,
		inputShape: [1],
		kernelInitializer: weightsInitializer,
		biasInitializer: biasInitializer,
		activation: currentActivation
	}));

	if (initialW !== undefined && initialB !== undefined) {
		const weights = [
			tf.tensor2d([[initialW]]),
			tf.tensor1d([initialB])
		];
		model.layers[0].setWeights(weights);
		weights.forEach(t => t.dispose());
	}

	return model;
}

function calculateLoss(w, b, xs, ys, N_DATA_POINTS) {
	const wKeyGrid = parseFloat(w.toFixed(1));
	const bKeyGrid = parseFloat(b.toFixed(1));

	const wKeyExact = w;
	const bKeyExact = b;
	const cacheKeyExact = `E${wKeyExact.toFixed(4)},${bKeyExact.toFixed(4)}`;

	if (lossCache.hasOwnProperty(cacheKeyExact)) {
		return lossCache[cacheKeyExact];
	}

	const rawResult = computeLossForWeights(w, b, xs, ys, currentActivation);
	const loss = Math.max(rawResult, 1e-8);
	lossCache[cacheKeyExact] = loss;

	const cacheKeyGrid = `${wKeyGrid},${bKeyGrid}`;
	lossCache[cacheKeyGrid] = loss;

	return loss;
}

function calculatePredictionLine(w, b, xMin, xMax, activation) {
	return tf.tidy(() => {
		const weights = tf.tensor2d([[w]]);
		const bias = tf.tensor1d([b]);

		const xs_line = [];
		for (let x = xMin - 1.0; x <= xMax + 1.0; x += 0.1) {
			xs_line.push(x);
		}
		const xsTensor = tf.tensor2d(xs_line.map(x => [x]));

		let predictions = xsTensor.matMul(weights).add(bias);

		switch (activation) {
			case "relu":
				predictions = predictions.relu();
				break;
			case "sigmoid":
				predictions = predictions.sigmoid();
				break;
			case "tanh":
				predictions = predictions.tanh();
				break;
		}

		const ys_line = predictions.dataSync();

		xsTensor.dispose();
		predictions.dispose();

		return { xs_line, ys_line };
	});
}

function computeNewLossPoints(newMinW, newMaxW, newMinB, newMaxB, data) {
	return new Promise(resolve => {
		if (stopRequested) return resolve();

		const W_START_GRID = parseFloat(Math.floor(newMinW / PLOT_DENSITY_STEP) * PLOT_DENSITY_STEP).toFixed(1);
		const W_END_GRID = parseFloat(Math.ceil(newMaxW / PLOT_DENSITY_STEP) * PLOT_DENSITY_STEP).toFixed(1);
		const B_START_GRID = parseFloat(Math.floor(newMinB / PLOT_DENSITY_STEP) * PLOT_DENSITY_STEP).toFixed(1);
		const B_END_GRID = parseFloat(Math.ceil(newMaxB / PLOT_DENSITY_STEP) * PLOT_DENSITY_STEP).toFixed(1);
		const STEP_SIZE = PLOT_DENSITY_STEP;

		const pointsToProcess = [];
		for (let b = parseFloat(B_START_GRID); b <= parseFloat(B_END_GRID); b = parseFloat((b + STEP_SIZE).toFixed(1))) {
			for (let w = parseFloat(W_START_GRID); w <= parseFloat(W_END_GRID); w = parseFloat((w + STEP_SIZE).toFixed(1))) {
				const cacheKey = `${w.toFixed(1)},${b.toFixed(1)}`;
				if (!lossCache.hasOwnProperty(cacheKey)) {
					pointsToProcess.push({ w, b });
				}
			}
		}

		const existingPointsKey = new Set(currentLandscapeData.W.map((w, i) => `${w.toFixed(1)},${currentLandscapeData.B[i].toFixed(1)}`));

		for (let b = parseFloat(B_START_GRID); b <= parseFloat(B_END_GRID); b = parseFloat((b + STEP_SIZE).toFixed(1))) {
			for (let w = parseFloat(W_START_GRID); w <= parseFloat(W_END_GRID); w = parseFloat((w + STEP_SIZE).toFixed(1))) {
				const wFixed = w.toFixed(1);
				const bFixed = b.toFixed(1);
				const cacheKey = `${wFixed},${bFixed}`;

				if (lossCache.hasOwnProperty(cacheKey) && !existingPointsKey.has(cacheKey)) {
					currentLandscapeData.W.push(w);
					currentLandscapeData.B.push(b);
					currentLandscapeData.L.push(lossCache[cacheKey]);
					existingPointsKey.add(cacheKey);
				}
			}
		}

		const totalPoints = pointsToProcess.length;
		let currentPointIndex = 0;
		const chunkSize = 50;

		currentLandscapeBounds.minW = Math.min(currentLandscapeBounds.minW, parseFloat(W_START_GRID));
		currentLandscapeBounds.maxW = Math.max(currentLandscapeBounds.maxW, parseFloat(W_END_GRID));
		currentLandscapeBounds.minB = Math.min(currentLandscapeBounds.minB, parseFloat(B_START_GRID));
		currentLandscapeBounds.maxB = Math.max(currentLandscapeBounds.maxB, parseFloat(B_END_GRID));

		const processChunk = () => {
			if (stopRequested) return resolve();

			const chunkEnd = Math.min(currentPointIndex + chunkSize, totalPoints);

			for (let i = currentPointIndex; i < chunkEnd; i++) {
				const { w, b } = pointsToProcess[i];
				const loss = calculateLoss(w, b, data.xs, data.ys, data.N_DATA_POINTS);

				const cacheKey = `${w.toFixed(1)},${b.toFixed(1)}`;
				if (!existingPointsKey.has(cacheKey)) {
					currentLandscapeData.W.push(w);
					currentLandscapeData.B.push(b);
					currentLandscapeData.L.push(loss);
					existingPointsKey.add(cacheKey);
				}
			}

			currentPointIndex = chunkEnd;

			if (currentPointIndex < totalPoints) {
				document.getElementById("status").innerText = `Berechne Loss-Landschaft: ${currentPointIndex}/${totalPoints} neue Punkte...`;
				setTimeout(processChunk, 10);
			} else {
				document.getElementById("status").innerText = "Loss-Landschaft erweitert. Fortsetzung des Trainings...";
				resolve();
			}
		};

		if (totalPoints > 0) {
			processChunk();
		} else {
			resolve();
		}
	});
}

function getColorForDeviation(error, maxAbsError) {
	const GREEN = { r: 0, g: 255, b: 0 };
	const RED = { r: 255, g: 0, b: 0 };

	if (maxAbsError === 0) {
		return `rgb(${GREEN.r}, ${GREEN.g}, ${GREEN.b})`;
	}

	const ratio = Math.min(Math.abs(error) / maxAbsError, 1);

	const r = Math.round(GREEN.r * (1 - ratio) + RED.r * ratio);
	const g = Math.round(GREEN.g * (1 - ratio) + RED.g * ratio);
	const b = Math.round(GREEN.b * (1 - ratio) + RED.b * ratio);

	return `rgb(${r}, ${g}, ${b})`;
}

function updateEquationDisplay(optimizerName, w, b) {
	const containerId = `equation-${optimizerName.toLowerCase().replace(/[^a-z0-9]/g, "-")}`;
	const container = document.getElementById(containerId);

	if (!container) return;

	const activation = currentActivation;

	let actFunc = "";
	let actDesc = "";
	const activationName = activation === "linear" ? "" : `\\operatorname{${activation}}`;

	switch (activation) {
		case "relu":
			actFunc = `\\operatorname{ReLU}(z)`;
			actDesc = `y = \\operatorname{ReLU}(\\mathbf{W}x + b) = \\max(0, \\mathbf{W}x + b)`;
			break;
		case "sigmoid":
			actFunc = `\\sigma(z)`;
			actDesc = `y = \\sigma(\\mathbf{W}x + b) = \\frac{1}{1 + e^{-(\\mathbf{W}x + b)}}`;
			break;
		case "tanh":
			actFunc = `\\tanh(z)`;
			actDesc = `y = \\tanh(\\mathbf{W}x + b)`;
			break;
		case "linear":
		default:
			actFunc = `z`;
			actDesc = `y = \\mathbf{W}x + b`;
			break;
	}

	if (container.children.length === 0) {
		container.innerHTML = `
			<h4>Netzwerk-Gleichung (Aktivierungsfunktion: ${activation})</h4>
			<div class="math-row">
				<div class="temml_me" data-display="1">${actDesc}</div>
			</div>
			<h4>Aktuelle Gewichte und Bias</h4>
			<div class="math-row" id="${containerId}-weights"></div>
			<h4>Approximation der Trainingsdaten</h4>
			<div id="${containerId}-approximation"></div>
		`;
		renderTemmlIn(container);
	}

	const weightsContainer = document.getElementById(`${containerId}-weights`);
	if (weightsContainer) {
		const weight_math = `
			<div class="temml_me" data-display="1">\\mathbf{W} = \\begin{pmatrix} ${w.toFixed(4)} \\end{pmatrix}, \\quad b = ${b.toFixed(4)}</div>
		`;
		weightsContainer.innerHTML = weight_math;
		renderTemmlIn(weightsContainer);
	}

	const approxContainer = document.getElementById(`${containerId}-approximation`);
	if (approxContainer) {
		const xsArray = globalXsArray;
		const ysArray = globalYsArray;

		let maxAbsError = 0;
		const predictions = [];
		const z_values = [];

		tf.tidy(() => {
			const W_tensor = tf.tensor2d([[w]]);
			const B_tensor = tf.tensor1d([b]);
			const X_tensor = tf.tensor2d(xsArray.map(x => [x]));

			let z_preds = X_tensor.matMul(W_tensor).add(B_tensor);
			z_values.push(...z_preds.dataSync());

			let preds = z_preds;
			switch (activation) {
				case "relu":
					preds = preds.relu();
					break;
				case "sigmoid":
					preds = preds.sigmoid();
					break;
				case "tanh":
					preds = preds.tanh();
					break;
			}

			predictions.push(...preds.dataSync());
		});

		for (let i = 0; i < predictions.length; i++) {
			const error = predictions[i] - ysArray[i];
			maxAbsError = Math.max(maxAbsError, Math.abs(error));
		}
		maxAbsError = Math.max(maxAbsError, 1e-4);

		let approxHtml = "";

		for (let i = 0; i < xsArray.length; i++) {
			const x = xsArray[i];
			const y_true = ysArray[i];
			const y_pred = predictions[i];
			const error = y_pred - y_true;
			const absError = Math.abs(error);

			let relativeErrorPercent = "N/A";
			if (Math.abs(y_true) > 1e-6) {
				const relError = absError / Math.abs(y_true);
				relativeErrorPercent = (relError * 100).toFixed(2) + "%";
			}

			const color = getColorForDeviation(error, maxAbsError);

			let equation = `
				<div class="deviation-row">
					<div class="deviation-indicator" style="background-color: ${color};" title="Abweichung: ${error.toFixed(4)}"></div>
					<span class="math-content">
						<div class="temml_me" data-display="1">
							y_{${i}} = ${y_true.toFixed(4)} \\approx \\hat{y}_{${i}} = ${y_pred.toFixed(4)}
							\\quad \\text{für } x_{${i}} = ${x.toFixed(4)}
						</div>
					</span>
					<span class="error-metrics" style="color: ${color};">
						Abs. Fehler: <span class="temml_me">|\\Delta y| = |${absError.toFixed(4)}|</span><br>
						Rel. Fehler: ${relativeErrorPercent}
					</span>
				</div>
			`;
			approxHtml += equation;
		}

		approxContainer.innerHTML = approxHtml;
		renderTemmlIn(approxContainer);
	}
}

async function checkAndExpandLandscape(w_val, b_val, N_buffer, data) {
	let expand = false;
	const bufferFactor = PLOT_DENSITY_STEP * N_buffer;

	if (w_val < currentLandscapeBounds.minW + bufferFactor || w_val > currentLandscapeBounds.maxW - bufferFactor ||
		b_val < currentLandscapeBounds.minB + bufferFactor || b_val > currentLandscapeBounds.maxB - bufferFactor) {
		expand = true;
	}

	if (expand) {
		const newMinW = Math.min(currentLandscapeBounds.minW, w_val - N_buffer * PLOT_DENSITY_STEP);
		const newMaxW = Math.max(currentLandscapeBounds.maxW, w_val + N_buffer * PLOT_DENSITY_STEP);
		const newMinB = Math.min(currentLandscapeBounds.minB, b_val - N_buffer * PLOT_DENSITY_STEP);
		const newMaxB = Math.max(currentLandscapeBounds.maxB, b_val + N_buffer * PLOT_DENSITY_STEP);

		await computeNewLossPoints(newMinW, newMaxW, newMinB, newMaxB, data);
		updateAllPlots(currentLandscapeData);
	}
}

function updateProgress(optimizerName, currentEpoch, totalEpochs, currentLoss) {
	setActiveOptimizerHighlight(optimizerName);
	const currentOptimizerNum = globalOptimizerIndex + 1;
	const totalOptimizers = globalOptimizers.length;

	globalEpochTimestamps.push(performance.now());
	let timeRemainingEstimate = "";
	if (globalEpochTimestamps.length > 1) {
		const timePerEpoch = (globalEpochTimestamps[globalEpochTimestamps.length - 1] - globalEpochTimestamps[0]) / (globalEpochTimestamps.length - 1);
		const epochsRemaining = (totalOptimizers - currentOptimizerNum) * totalEpochs + (totalEpochs - currentEpoch);
		const remainingMs = epochsRemaining * timePerEpoch;

		const remainingSeconds = Math.round(remainingMs / 1000);
		if (remainingSeconds > 0) {
			const minutes = Math.floor(remainingSeconds / 60);
			const seconds = remainingSeconds % 60;
			timeRemainingEstimate = ` (ca. verbleibend: ${minutes}m ${seconds}s)`;
		}
	}

	const statusText =
		`[${currentOptimizerNum}/${totalOptimizers}] ${optimizerName}: Epoche ${currentEpoch}/${totalEpochs} | Loss: ${currentLoss.toFixed(4)}` + timeRemainingEstimate;

	const totalProgressPercent = Math.round((currentOptimizerNum - 1) * 100 / totalOptimizers + currentEpoch * 100 / (totalOptimizers * totalEpochs));

	const statusEl = document.getElementById("status");
	if (statusEl) statusEl.innerText = statusText;
	document.title = `(${totalProgressPercent}%) ${statusText}`;
}

function updateDetailsSection(optimizerName) {
	const detailsContainerId = `details-${optimizerName.toLowerCase().replace(/[^a-z0-9]/g, "-")}`;
	const detailsContainer = document.getElementById(detailsContainerId);

	if (detailsContainer && detailsContainer.style.display === "grid") {
		const history = lossHistory[optimizerName] || [];
		const plotId = `loss-plot-${optimizerName.toLowerCase().replace(/[^a-z0-9]/g, "-")}`;
		const tableBody = detailsContainer.querySelector("table tbody");

		if (tableBody) {
			const existingRows = tableBody.children.length;
			for (let i = existingRows; i < history.length; i++) {
				const item = history[i];
				const row = tableBody.insertRow();
				row.insertCell().textContent = item.epoch;
				row.insertCell().textContent = item.loss.toFixed(6);
			}
			const tableDiv = detailsContainer.querySelector(".details-table");
			if (tableDiv) tableDiv.scrollTop = tableDiv.scrollHeight;
		}

		const epochs = history.map(item => item.epoch);
		const losses = history.map(item => item.loss);

		if (document.getElementById(plotId) && losses.length > 0) {
			Plotly.restyle(plotId, {
				x: [epochs],
				y: [losses]
			}, [0]);
		}
	}
}
window.updateDetailsSection = updateDetailsSection;

function renderDetailsSection(optimizerName) {
	const detailsContainerId = `details-${optimizerName.toLowerCase().replace(/[^a-z0-9]/g, "-")}`;
	const detailsContainer = document.getElementById(detailsContainerId);

	if (detailsContainer.style.display === "grid") {
		detailsContainer.style.display = "none";
		Plotly.purge(`loss-plot-${optimizerName.toLowerCase().replace(/[^a-z0-9]/g, "-")}`);
		return;
	}

	detailsContainer.innerHTML = "";
	detailsContainer.style.display = "grid";

	const history = lossHistory[optimizerName] || [];

	const tableDiv = document.createElement("div");
	tableDiv.className = "details-table";
	tableDiv.style.maxHeight = "400px";
	tableDiv.style.overflowY = "auto";

	const table = document.createElement("table");
	table.innerHTML = `
		<thead>
			<tr><th>Epoche</th><th>Loss (MSE)</th></tr>
		</thead>
		<tbody>
		</tbody>
	`;
	const tbody = table.querySelector("tbody");

	history.forEach(item => {
		const row = tbody.insertRow();
		row.insertCell().textContent = item.epoch;
		row.insertCell().textContent = item.loss.toFixed(6);
	});

	tableDiv.appendChild(table);
	detailsContainer.appendChild(tableDiv);

	const plotDiv = document.createElement("div");
	const plotId = `loss-plot-${optimizerName.toLowerCase().replace(/[^a-z0-9]/g, "-")}`;
	plotDiv.id = plotId;
	plotDiv.className = "plot-div";
	plotDiv.style.height = "400px";
	detailsContainer.appendChild(plotDiv);

	const epochs = history.map(item => item.epoch);
	const losses = history.map(item => item.loss);

	const trace = {
		x: epochs,
		y: losses,
		mode: "lines+markers",
		type: "scatter",
		name: "Loss-Verlauf",
		line: { color: "#00bcd4", width: 2 },
		marker: { size: 5 }
	};

	const layout = {
		title: {
			text: `${optimizerName}: Loss pro Epoche`,
			font: { color: "#d4d4d4" }
		},
		paper_bgcolor: "rgba(0,0,0,0)",
		plot_bgcolor: "rgba(0,0,0,0)",
		xaxis: { title: "Epoche", gridcolor: "#444", zerolinecolor: "#777", tickfont: { color: "#d4d4d4" }, titlefont: { color: "#d4d4d4" } },
		yaxis: { title: "Loss (MSE)", gridcolor: "#444", zerolinecolor: "#777", tickfont: { color: "#d4d4d4" }, titlefont: { color: "#d4d4d4" }, type: "log" },
		margin: { l: 60, r: 20, b: 60, t: 40 },
		showlegend: false
	};

	Plotly.newPlot(plotId, [trace], layout, { responsive: true }).then(relayoutAllPlots);

	tableDiv.scrollTop = tableDiv.scrollHeight;
}
window.renderDetailsSection = renderDetailsSection;

function initializeModelWithWeights(model, name) {
	if (lastTrainedModelWeights[name]) {
		const w = lastTrainedModelWeights[name].w;
		const b = lastTrainedModelWeights[name].b;
		tf.tidy(() => {
			const weights = [
				tf.tensor2d([[w]]),
				tf.tensor1d([b])
			];
			model.layers[0].setWeights(weights);
			weights.forEach(t => t.dispose());
		});
		return { W: w, B: b };
	} else {
		const initialWeights = model.layers[0].getWeights();
		const w = initialWeights[0].dataSync()[0];
		const b = initialWeights[1].dataSync()[0];
		return { W: w, B: b };
	}
}

async function trainAndRecordTrajectory(name, optimizer, epochs, N_buffer, data, isContinuing = false) {
	if (stopRequested) throw new Error("Experiment gestoppt.");

	if (!isContinuing) {
		lossHistory[name] = [];
	}
	globalEpochTimestamps = [performance.now()];

	let model = null;
	if (isContinuing && lastTrainedModelWeights[name]) {
		model = createSimpleModel(lastTrainedModelWeights[name].w, lastTrainedModelWeights[name].b);
	} else {
		model = createSimpleModel();
	}

	model.compile({ optimizer: optimizer, loss: "meanSquaredError" });

	let currentWeights = initializeModelWithWeights(model, name);
	let initialW = currentWeights.W;
	let initialB = currentWeights.B;

	const trajectory = { W: [], B: [], Loss: [] };

	const plotDiv3DId = `plot3d-${name.toLowerCase().replace(/[^a-z0-9]/g, "-")}`;
	if (isContinuing && plotInstances[plotDiv3DId]) {
		trajectory.W = [...plotInstances[plotDiv3DId].W];
		trajectory.B = [...plotInstances[plotDiv3DId].B];
		trajectory.Loss = [...plotInstances[plotDiv3DId].Loss];
	}

	if (trajectory.W.length === 0 || trajectory.W[trajectory.W.length - 1] !== initialW || trajectory.B[trajectory.B.length - 1] !== initialB) {
		const initialLoss = calculateLoss(initialW, initialB, data.xs, data.ys, data.N_DATA_POINTS);
		trajectory.W.push(initialW);
		trajectory.B.push(initialB);
		trajectory.Loss.push(initialLoss);
		updateEquationDisplay(name, initialW, initialB);
	}

	const plotDiv2DId = `plot2d-${name.toLowerCase().replace(/[^a-z0-9]/g, "-")}`;
	let batchCounter = 0;
	let lastW = initialW;
	let lastB = initialB;
	let startEpoch = isContinuing ? (lossHistory[name] ? lossHistory[name].length : 0) : 0;
	let totalEpochs = startEpoch + epochs;

	const customCallback = new tf.CustomCallback({
		onBatchEnd: async (batch, logs) => {
			if (stopRequested) {
				model.stopTraining = true;
				return;
			}

			if (batchCounter % 5 === 0) {
				await tf.nextFrame();
			}

			tf.tidy(() => {
				const layer = model.layers[0];
				const weights = layer.getWeights();

				const w_val = weights[0].dataSync()[0];
				const b_val = weights[1].dataSync()[0];

				const measuredLoss = calculateLoss(w_val, b_val, data.xs, data.ys, data.N_DATA_POINTS);

				trajectory.W.push(w_val);
				trajectory.B.push(b_val);
				trajectory.Loss.push(measuredLoss);

				if (w_val !== lastW || b_val !== lastB) {
					const logLoss = trajectory.Loss.map(l => Math.log10(l));

					Plotly.restyle(plotDiv3DId, {
						x: [trajectory.W],
						y: [trajectory.B],
						z: [logLoss]
					}, [1]);

					const { xs_line, ys_line } = calculatePredictionLine(w_val, b_val, globalDataXMin, globalDataXMax, currentActivation);
					Plotly.restyle(plotDiv2DId, {
						x: [xs_line],
						y: [Array.from(ys_line)]
					}, [1]);

					updateEquationDisplay(name, w_val, b_val);

					lastW = w_val;
					lastB = b_val;
				}

				batchCounter++;
				checkAndExpandLandscape(w_val, b_val, N_buffer, data);
			});
		},
		onEpochEnd: (epoch, logs) => {
			lossHistory[name].push({ epoch: startEpoch + epoch + 1, loss: logs.loss });

			updateProgress(name, startEpoch + epoch + 1, totalEpochs, logs.loss);

			updateDetailsSection(name);
		}
	});

	await model.fit(data.xs, data.ys, {
		epochs: epochs,
		callbacks: [customCallback],
		batchSize: data.N_DATA_POINTS,
		verbose: 0
	});

	if (stopRequested) {
		model.dispose();
		throw new Error("Experiment gestoppt.");
	}

	tf.tidy(() => {
		const layer = model.layers[0];
		const weights = layer.getWeights();

		const finalW = weights[0].dataSync()[0];
		const finalB = weights[1].dataSync()[0];

		lastTrainedModelWeights[name] = { w: finalW, b: finalB };

		const { xs_line, ys_line } = calculatePredictionLine(finalW, finalB, globalDataXMin, globalDataXMax, currentActivation);

		Plotly.restyle(plotDiv2DId, {
			x: [xs_line],
			y: [Array.from(ys_line)]
		}, [1]);

		updateEquationDisplay(name, finalW, finalB);
	});

	model.dispose();

	plotInstances[plotDiv3DId] = { W: trajectory.W, B: trajectory.B, Loss: trajectory.Loss };

	return trajectory;
}

function initialize2DPlot(optimizerName, data) {
	const plotDivId = `plot2d-${optimizerName.toLowerCase().replace(/[^a-z0-9]/g, "-")}`;
	const plotGroup = document.querySelector(`#plot-container > .plot-group[data-optimizer="${optimizerName}"]`);

	const plotDiv = document.createElement("div");
	plotDiv.id = plotDivId;
	plotDiv.className = "plot-div";
	plotDiv.setAttribute("data-plot-theme", "self");
	plotGroup.appendChild(plotDiv);

	const initialModel = createSimpleModel();
	const initialWeights = initialModel.layers[0].getWeights();
	let initialW = initialWeights[0].dataSync()[0];
	let initialB = initialWeights[1].dataSync()[0];
	initialModel.dispose();

	const { xs_line, ys_line } = calculatePredictionLine(initialW, initialB, globalDataXMin, globalDataXMax, currentActivation);

	const trainingDataTrace = {
		x: data.xsArray,
		y: data.ysArray,
		mode: "markers",
		type: "scatter",
		name: "Trainingsdaten",
		marker: { color: "white", size: 8 }
	};

	const predictionTrace = {
		x: xs_line,
		y: Array.from(ys_line),
		mode: "lines",
		type: "scatter",
		name: "NN-Funktion",
		line: { color: "#ff69b4", width: 3 }
	};

	const plotData = [trainingDataTrace, predictionTrace];

	const layout = {
		title: {
			text: `${optimizerName} - NN-Funktion vs. Daten`,
			font: { color: "#d4d4d4" }
		},
		paper_bgcolor: "rgba(0,0,0,0)",
		plot_bgcolor: "rgba(0,0,0,0)",
		xaxis: { title: "X", backgroundcolor: "#333", gridcolor: "#444", zerolinecolor: "#777", tickfont: { color: "#d4d4d4" }, titlefont: { color: "#d4d4d4" } },
		yaxis: { title: "Y", backgroundcolor: "#333", gridcolor: "#444", zerolinecolor: "#777", tickfont: { color: "#d4d4d4" }, titlefont: { color: "#d4d4d4" } },
		margin: { l: 40, r: 20, b: 40, t: 40 },
		showlegend: true
	};

	Plotly.newPlot(plotDivId, plotData, layout, { responsive: true });

	const detailsButtonContainer = document.createElement("div");
	detailsButtonContainer.className = "details-button-container";

	const detailsButton = document.createElement("button");
	detailsButton.textContent = ` Loss-Verlauf & Tabelle anzeigen`;
	detailsButton.onclick = () => renderDetailsSection(optimizerName);

	detailsButtonContainer.appendChild(detailsButton);
	plotGroup.appendChild(detailsButtonContainer);

	const detailsContainer = document.createElement("div");
	detailsContainer.id = `details-${optimizerName.toLowerCase().replace(/[^a-z0-9]/g, "-")}`;
	detailsContainer.className = "details-section";
	detailsContainer.style.display = "none";

	plotGroup.appendChild(detailsContainer);

	const equationContainer = document.createElement("div");
	equationContainer.id = `equation-${optimizerName.toLowerCase().replace(/[^a-z0-9]/g, "-")}`;
	equationContainer.className = "equation-display";
	plotGroup.appendChild(equationContainer);
}

function initialize3DPlot(optimizerName, initialLandscapeData, initialTrajectory, initialSurfaceData, data) {
	const plotDivId = `plot3d-${optimizerName.toLowerCase().replace(/[^a-z0-9]/g, "-")}`;

	const plotContainer = document.getElementById("plot-container");
	let plotGroup = document.querySelector(`.plot-group[data-optimizer="${optimizerName}"]`);
	if (!plotGroup) {
		plotGroup = document.createElement("div");
		plotGroup.className = "plot-group";
		plotGroup.dataset.optimizer = optimizerName;
		plotContainer.appendChild(plotGroup);
	}

	const plotDiv = document.createElement("div");
	plotDiv.id = plotDivId;
	plotDiv.className = "plot-div";
	plotDiv.setAttribute("data-plot-theme", "self");
	plotGroup.insertBefore(plotDiv, plotGroup.firstChild);

	const { W_GRID, B_GRID, L_MATRIX } = initialSurfaceData;
	const lossValues = L_MATRIX.flat().filter(l => l !== null).map(l => Math.pow(10, l));
	let minLossRaw = lossValues.length > 0 ? Math.min(...lossValues) : 0.1;
	minLossRaw = Math.max(minLossRaw, 1e-7);
	let maxLossRaw = lossValues.length > 0 ? Math.max(...lossValues) : 10;

	const logMin = Math.log10(minLossRaw);
	const logMax = Math.log10(maxLossRaw);
	const cminLogFinal = logMin - 1.0;
	const cmaxLogFinal = logMax + 0.1;

	const surfaceTrace = {
		type: "surface",
		x: W_GRID,
		y: B_GRID,
		z: L_MATRIX,
		name: "Loss-Landschaft",
		colorscale: "Jet",
		reversescale: true,
		cmin: cminLogFinal,
		cmax: cmaxLogFinal,
		showscale: true,
		opacity: 0.9,
		lighting: { ambient: 0.6, diffuse: 0.6, specular: 0.1, fresnel: 0.1, roughness: 0.5 },
		contours: { z: { show: false } }
	};

	const trajectoryTrace = {
		x: initialTrajectory.W,
		y: initialTrajectory.B,
		z: initialTrajectory.Loss.map(l => Math.log10(l)),
		type: "scatter3d",
		mode: "lines+markers",
		name: `${optimizerName} Trajektorie`,
		marker: { size: 4, color: "red", symbol: "circle" },
		line: { width: 5, color: "red" }
	};

	const plotData = [surfaceTrace, trajectoryTrace];

	const layout = {
		title: {
			text: `${optimizerName} (${currentActivation}) - Loss-Landschaft (Log10 Loss)`,
			font: { color: "#d4d4d4" }
		},
		paper_bgcolor: "rgba(0,0,0,0)",
		plot_bgcolor: "rgba(0,0,0,0)",
		scene: {
			xaxis: {
				title: { text: "Weight (w)" },
				backgroundcolor: "#333", gridcolor: "#444", zerolinecolor: "#777", tickfont: { color: "#d4d4d4" }, titlefont: { color: "#d4d4d4" }
			},
			yaxis: {
				title: { text: "Bias (b)" },
				backgroundcolor: "#333", gridcolor: "#444", zerolinecolor: "#777", tickfont: { color: "#d4d4d4" }, titlefont: { color: "#d4d4d4" }
			},
			zaxis: {
				title: { text: "Loss (Log10)" },
				type: "linear",
				backgroundcolor: "#333",
				gridcolor: "#444",
				zerolinecolor: "#777",
				tickfont: { color: "#d4d4d4" },
				titlefont: { color: "#d4d4d4" }
			},
			camera: {
				up: { x: 0, y: 0, z: 1 },
				center: { x: 0, y: 0, z: 0 },
				eye: { x: 1.25, y: 1.25, z: 1.3 }
			}
		},
		margin: { l: 50, r: 0, b: 20, t: 30 }
	};

	Plotly.newPlot(plotDivId, plotData, layout, { responsive: true });
	plotInstances[plotDivId] = { W: initialTrajectory.W, B: initialTrajectory.B, Loss: initialTrajectory.Loss };
}

function updateAllPlots(newLandscapeData) {
	const finalSurfaceData = convertScatterToSurfaceData(newLandscapeData);
	const rawLossValues = finalSurfaceData.L_MATRIX.flat().filter(l => l !== null).map(l => Math.pow(10, l));

	if (rawLossValues.length === 0 || finalSurfaceData.W_GRID.length === 0 || finalSurfaceData.B_GRID.length === 0) return;

	let minLossRaw = Math.min(...rawLossValues);
	let maxLossRaw = Math.max(...rawLossValues);

	minLossRaw = Math.max(minLossRaw, 1e-7);
	maxLossRaw = Math.max(maxLossRaw, minLossRaw * 10.0);

	const logMin = Math.log10(minLossRaw);
	const logMax = Math.log10(maxLossRaw);

	const cminLogFinal = logMin - 1.0;
	const cmaxLogFinal = logMax + 0.1;

	for (const id in plotInstances) {
		if (id.startsWith("plot3d-")) {
			Plotly.restyle(id, {
				x: [finalSurfaceData.W_GRID],
				y: [finalSurfaceData.B_GRID],
				z: [finalSurfaceData.L_MATRIX],
				cmin: [cminLogFinal],
				cmax: [cmaxLogFinal],
				"contours.z.show": [false]
			}, [0]);
		}
	}
}

function convertScatterToSurfaceData(landscapeData) {
	if (landscapeData.W.length === 0) return { W_GRID: [], B_GRID: [], L_MATRIX: [] };

	const uniqueW = Array.from(new Set(landscapeData.W.map(w => w.toFixed(1)))).map(s => parseFloat(s)).sort((a, b) => a - b);
	const uniqueB = Array.from(new Set(landscapeData.B.map(b => b.toFixed(1)))).map(s => parseFloat(s)).sort((a, b) => a - b);

	const wMap = new Map(uniqueW.map((w, i) => [w.toFixed(1), i]));
	const bMap = new Map(uniqueB.map((b, i) => [b.toFixed(1), i]));

	const W_LEN = uniqueW.length;
	const B_LEN = uniqueB.length;
	const L_MATRIX = new Array(B_LEN).fill(0).map(() => new Array(W_LEN).fill(null));

	for (let i = 0; i < landscapeData.W.length; i++) {
		const w = landscapeData.W[i];
		const b = landscapeData.B[i];
		const lossRaw = landscapeData.L[i];
		const wIndex = wMap.get(w.toFixed(1));
		const bIndex = bMap.get(b.toFixed(1));

		if (wIndex !== undefined && bIndex !== undefined) {
			L_MATRIX[bIndex][wIndex] = Math.log10(lossRaw);
		}
	}

	return { W_GRID: uniqueW, B_GRID: uniqueB, L_MATRIX: L_MATRIX };
}

function getOptimizerParameters(name) {
	const config = OPTIMIZER_CONFIGS[name];
	const params = {};

	for (const param of config.params) {
		const inputId = `param-${param.name}`;
		const inputElement = document.getElementById(inputId);

		if (inputElement) {
			if (param.type === "select") {
				params[param.name] = inputElement.value;
			} else {
				params[param.name] = parseFloat(inputElement.value);
			}
		} else {
			params[param.name] = config.defaults[param.name];
		}
	}
	return params;
}

function setUIState(running, allowContinue = false) {
	experimentRunning = running;
	const startBtn = document.getElementById("startButton");
	const stopBtn = document.getElementById("stopButton");
	const continueBtn = document.getElementById("continueButton");
	if (startBtn) startBtn.style.display = running ? "none" : "block";
	if (stopBtn) stopBtn.style.display = running ? "block" : "none";
	if (continueBtn) continueBtn.style.display = allowContinue && !running ? "block" : "none";

	document.querySelectorAll(".loss-landscape-lab .controls input, .loss-landscape-lab .controls select, .loss-landscape-lab .controls textarea, .loss-landscape-lab .controls button:not(#stopButton):not(#continueButton)").forEach(el => el.disabled = running);

	if (!running) {
		document.title = "The Loss Landscape — asanAI";
	}
}

function stopExperiment() {
	stopRequested = true;
	const status = document.getElementById("status");
	if (status) status.innerText = "Stopp-Anforderung gesendet. Warte auf Ende der aktuellen Operation...";
}
window.stopExperiment = stopExperiment;

function roundToGrid(value) {
	return Math.round(value / PLOT_DENSITY_STEP) * PLOT_DENSITY_STEP;
}

async function continueExperiment() {
	if (Object.keys(lastTrainedModelWeights).length === 0) {
		const status = document.getElementById("status");
		if (status) status.innerText = "Keine vorherigen Trainingsgewichte gefunden. Bitte 'Experiment starten'.";
		return;
	}

	if (experimentRunning) return;
	setUIState(true);
	stopRequested = false;

	globalOptimizerIndex = 0;
	globalEpochTimestamps = [];
	globalStartTime = performance.now();

	currentActivation = document.getElementById("activation").value;
	globalOptimizers = Array.from(document.querySelectorAll('.loss-landscape-lab input[name="optimizer"]:checked'))
		.map(checkbox => checkbox.value);

	let data = null;

	try {
		data = parseData();

		const N_buffer = parseInt(document.getElementById("steps").value);
		const EPOCHS = parseInt(document.getElementById("epochs").value);

		if (globalOptimizers.length === 0) {
			const status = document.getElementById("status");
			if (status) status.innerText = "Bitte wählen Sie mindestens einen Optimizer aus.";
			setUIState(false);
			return;
		}

		const status = document.getElementById("status");
		if (status) status.innerText = "Experiment wird fortgesetzt...";

		const firstOptimizerName = globalOptimizers[0];
		const initialW = lastTrainedModelWeights[firstOptimizerName] ? lastTrainedModelWeights[firstOptimizerName].w : 0.1;
		const initialB = lastTrainedModelWeights[firstOptimizerName] ? lastTrainedModelWeights[firstOptimizerName].b : 0.1;
		const initialLoss = calculateLoss(initialW, initialB, data.xs, data.ys, data.N_DATA_POINTS);

		await checkAndExpandLandscape(initialW, initialB, N_buffer, data);

		if (stopRequested) throw new Error("Experiment gestoppt.");

		updateAllPlots(currentLandscapeData);

		if (status) status.innerText = "Starte Trainingsläufe (Fortsetzung)...";
		document.title = "Starte Training (Fortsetzung)...";

		for (let i = 0; i < globalOptimizers.length; i++) {
			globalOptimizerIndex = i;
			const name = globalOptimizers[i];

			const currentTotalEpochs = (lossHistory[name] ? lossHistory[name].length : 0) + EPOCHS;

			if (stopRequested) throw new Error("Experiment gestoppt.");
			updateProgress(name, (lossHistory[name] ? lossHistory[name].length : 0), currentTotalEpochs, lossHistory[name] ? lossHistory[name][lossHistory[name].length - 1].loss : initialLoss);
			updateEquationDisplay(name, lastTrainedModelWeights[name].w, lastTrainedModelWeights[name].b);

			const params = getOptimizerParameters(name);
			const optimizer = OPTIMIZER_CONFIGS[name].factory(params);

			await trainAndRecordTrajectory(name, optimizer, EPOCHS, N_buffer, data, true);

			optimizer.dispose();
		}

		if (stopRequested) throw new Error("Experiment gestoppt.");
		const status2 = document.getElementById("status");
		if (status2) status2.innerText = "Training (Fortsetzung) abgeschlossen. Plots finalisiert.";
		document.title = "✅ Training abgeschlossen.";
		setUIState(false, true);

	} catch (error) {
		if (error.message === "Experiment gestoppt.") {
			const status = document.getElementById("status");
			if (status) status.innerText = "Experiment wurde erfolgreich gestoppt.";
			document.title = "⏸️ Experiment gestoppt.";
			setUIState(false, Object.keys(lastTrainedModelWeights).length > 0);
		} else {
			console.error(error);
			const status = document.getElementById("status");
			if (status) status.innerText = `FEHLER: ${error.message}`;
			document.title = `❌ FEHLER: ${error.message}`;
			setUIState(false, Object.keys(lastTrainedModelWeights).length > 0);
		}
	} finally {
		if (data && data.xs) {
			data.xs.dispose();
			data.ys.dispose();
		}
		clearActiveOptimizerHighlight();
	}
}
window.continueExperiment = continueExperiment;

async function startExperiment() {
	if (experimentRunning) return;

	setUIState(true);
	stopRequested = false;

	const plotContainer = document.getElementById("plot-container");
	if (plotContainer) plotContainer.innerHTML = "";
	plotInstances = {};
	lossCache = {};
	currentLandscapeData = { W: [], B: [], L: [] };
	globalOptimizerIndex = 0;
	globalEpochTimestamps = [];
	globalStartTime = performance.now();
	lossHistory = {};
	lastTrainedModelWeights = {};

	currentActivation = document.getElementById("activation").value;
	globalOptimizers = Array.from(document.querySelectorAll('.loss-landscape-lab input[name="optimizer"]:checked'))
		.map(checkbox => checkbox.value);

	let data = null;

	try {
		data = parseData();

		const N_buffer = parseInt(document.getElementById("steps").value);
		const EPOCHS = parseInt(document.getElementById("epochs").value);

		if (globalOptimizers.length === 0) {
			const status = document.getElementById("status");
			if (status) status.innerText = "Bitte wählen Sie mindestens einen Optimizer aus.";
			setUIState(false);
			return;
		}

		const status = document.getElementById("status");
		if (status) status.innerText = "Experiment wird vorbereitet... Initialisiere Startpunkt.";

		const initialModel = createSimpleModel();
		const initialWeights = initialModel.layers[0].getWeights();
		let initialW = initialWeights[0].dataSync()[0];
		let initialB = initialWeights[1].dataSync()[0];
		initialModel.dispose();

		initialW = roundToGrid(initialW);
		initialB = roundToGrid(initialB);

		const initialLoss = calculateLoss(initialW, initialB, data.xs, data.ys, data.N_DATA_POINTS);

		const initialMinW = initialW - N_buffer * PLOT_DENSITY_STEP;
		const initialMaxW = initialW + N_buffer * PLOT_DENSITY_STEP;
		const initialMinB = initialB - N_buffer * PLOT_DENSITY_STEP;
		const initialMaxB = initialB + N_buffer * PLOT_DENSITY_STEP;

		currentLandscapeBounds = { minW: initialMinW, maxW: initialMaxW, minB: initialMinB, maxB: initialMaxB };

		const status2 = document.getElementById("status");
		if (status2) status2.innerText = "Berechne initiale Loss-Landschaft... (Dies ist der schnellere Teil)";
		await computeNewLossPoints(initialMinW, initialMaxW, initialMinB, initialMaxB, data);

		if (stopRequested) throw new Error("Experiment gestoppt.");

		const initialSurfaceData = convertScatterToSurfaceData(currentLandscapeData);
		const { W_GRID, B_GRID, L_MATRIX } = initialSurfaceData;

		if (W_GRID.length === 0 || B_GRID.length === 0 || L_MATRIX.length === 0) {
			throw new Error("Fehler: Initiales Loss-Landschafts-Raster konnte nicht berechnet werden.");
		}

		for (const name of globalOptimizers) {
			initialize3DPlot(name, currentLandscapeData, { W: [initialW], B: [initialB], Loss: [initialLoss] }, initialSurfaceData, data);
			initialize2DPlot(name, data);
			lastTrainedModelWeights[name] = { w: initialW, b: initialB };
			updateEquationDisplay(name, initialW, initialB);
		}

		relayoutAllPlots();

		const status3 = document.getElementById("status");
		if (status3) status3.innerText = "Starte Trainingsläufe...";
		document.title = "Starte Training...";

		for (let i = 0; i < globalOptimizers.length; i++) {
			globalOptimizerIndex = i;
			const name = globalOptimizers[i];

			if (stopRequested) throw new Error("Experiment gestoppt.");
			updateProgress(name, 0, EPOCHS, initialLoss);

			const params = getOptimizerParameters(name);
			const optimizer = OPTIMIZER_CONFIGS[name].factory(params);

			await trainAndRecordTrajectory(name, optimizer, EPOCHS, N_buffer, data, false);

			optimizer.dispose();
		}

		if (stopRequested) throw new Error("Experiment gestoppt.");
		const status4 = document.getElementById("status");
		if (status4) status4.innerText = "Training abgeschlossen. Plots finalisiert.";
		document.title = "✅ Training abgeschlossen.";
		setUIState(false, true);

	} catch (error) {
		if (error.message === "Experiment gestoppt.") {
			const status = document.getElementById("status");
			if (status) status.innerText = "Experiment wurde erfolgreich gestoppt.";
			document.title = "⏸️ Experiment gestoppt.";
			setUIState(false, Object.keys(lastTrainedModelWeights).length > 0);
		} else {
			console.error(error);
			const status = document.getElementById("status");
			if (status) status.innerText = `FEHLER: ${error.message}`;
			document.title = `❌ FEHLER: ${error.message}`;
			setUIState(false, Object.keys(lastTrainedModelWeights).length > 0);
		}
	} finally {
		setUIState(false, Object.keys(lastTrainedModelWeights).length > 0);
		if (data && data.xs) {
			data.xs.dispose();
			data.ys.dispose();
		}
		clearActiveOptimizerHighlight();
	}
}
window.startExperiment = startExperiment;

function clearActiveOptimizerHighlight() {
	document.querySelectorAll(".loss-landscape-lab .optimizer-selection label").forEach(label => {
		label.classList.remove("is-active");
	});
	document.querySelectorAll(".plot-group").forEach(group => {
		group.classList.remove("is-active");
	});
}

function setActiveOptimizerHighlight(optimizerName) {
	clearActiveOptimizerHighlight();

	const checkboxId = `opt-${optimizerName}`;
	const checkbox = document.getElementById(checkboxId);
	if (checkbox) {
		let currentElement = checkbox;
		while (currentElement && currentElement.tagName !== "LABEL") {
			currentElement = currentElement.parentNode;
		}
		if (currentElement && currentElement.tagName === "LABEL") {
			currentElement.classList.add("is-active");
		}
	}

	const plotGroup = document.querySelector(`.plot-group[data-optimizer="${optimizerName}"]`);
	if (plotGroup) {
		plotGroup.classList.add("is-active");
	}
}

/* ─── Module entry point ─────────────────────────────────────────────────── */

async function loadLossLandscapeLabModule() {
	updateLoadingStatus("Loading section about the loss landscape lab...");

	initializeOptimizerCheckboxes();

	window.addEventListener("resize", relayoutAllPlots);

	if (window.__MN_DARK && typeof window.__MN_DARK.onChange === "function") {
		window.__MN_DARK.onChange(() => {
			try { relayoutAllPlots(); } catch (e) { /* ignore */ }
		});
	}

	return Promise.resolve();
}
