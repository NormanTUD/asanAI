const TrainLab = {
	configs: {
		traininglab: {
			inputs: ["x₁", "x₂"],
			outputs: ["y"],
			layers: [{ nodes: 4, act: 'relu' }],
			data: [[0, 0, 0], [0, 1, 1], [1, 0, 1], [1, 1, 0]],
			model: null,
			loss: [],
			isTraining: false,
			currentEpoch: 0
		}
	},

	// =========================================================================
	// LEVEL 0 — TOP-LEVEL PUBLIC API (most abstract)
	// =========================================================================

	init: function (id) {
		const c = this.configs[id];
		if (!c) return;

		this._resetState(c);
		this._buildModel(id, c);
		this._compileModel(id, c);
		this._renderFullUI(id);
	},

	toggleTraining: async function (id) {
		const c = this.configs[id];

		if (c.isTraining) {
			this._stopTraining(id, c);
			return;
		}

		await this._runTrainingLoop(id, c);
	},

	addRow: function (id) {
		this.configs[id].data.push([0.5, 0.5, 0]);
		this.renderUI(id);
	},

	removeRow: function (id, index) {
		this.configs[id].data.splice(index, 1);
		this.renderUI(id);
		this.updateVisuals(id);
	},

	manualUpdate: function (id, layerIdx, wIdx, val) {
		this._setLayerWeight(id, layerIdx, wIdx, parseFloat(val));
		this._updateWeightLabel(wIdx, parseFloat(val));
		this.updateVisuals(id);
		this.updateLivePrediction();
	},

	updateLivePrediction: function () {
		const model = this.configs.traininglab.model;
		if (!model) return;

		const { x1, x2 } = this._readPredictionInputs();
		const val = this._predictSingle(model, x1, x2);
		this._displayPrediction(val);
	},

	// =========================================================================
	// LEVEL 1 — ORCHESTRATORS (coordinate smaller tasks)
	// =========================================================================

	_resetState: function (c) {
		c.loss = [];
		c.isTraining = false;
		c.currentEpoch = 0;
		if (c.model) c.model.dispose();
	},

	_buildModel: function (id, c) {
		c.model = tf.sequential();
		this._addHiddenLayers(c);
		this._addOutputLayer(c);
	},

	_compileModel: function (id, c) {
		const lr = this._readLearningRate(id);
		c.model.compile({ optimizer: tf.train.adam(lr), loss: 'meanSquaredError' });
	},

	_renderFullUI: function (id) {
		this.renderUI(id);
		this.createWeightSliders(id);
		this.updateVisuals(id);
		this.updateButtonState(id, "START");
	},

	_stopTraining: function (id, c) {
		c.isTraining = false;
		this.updateButtonState(id, "CONTINUE");
	},

	_runTrainingLoop: async function (id, c) {
		c.isTraining = true;
		this.updateButtonState(id, "STOP");

		this._recompileOptimizer(id, c);
		const { xs, ys } = this._buildTensorsFromData(c);
		const totalEpochs = this._readTotalEpochs(id);

		while (c.currentEpoch < totalEpochs && c.isTraining) {
			await this._trainOneEpoch(c, xs, ys);
			if (c.currentEpoch % 10 === 0) {
				this._refreshAfterEpoch(id);
				await tf.nextFrame();
			}
		}

		if (c.currentEpoch >= totalEpochs) {
			this._finishTraining(id, c);
		}
	},

	updateVisuals: function (id) {
		const c = this.configs[id];
		this._plotDecisionBoundary();
		this._plotLossHistory(c);
		this._updatePredictionTable(id, c);
		this._renderHeatmaps(id, c);
		this._renderMathMonitor(id, c);
	},

	renderUI: function (id) {
		const c = this.configs[id];
		this._renderTableHeader(id);
		this._renderTableBody(id, c);
	},

	createWeightSliders: function (id) {
		const container = document.getElementById('manual-weight-sliders');
		if (!container) return;
		container.innerHTML = "";

		const weights = this.configs[id].model.layers[0].getWeights()[0].dataSync();
		weights.forEach((w, i) => {
			this._appendSlider(container, id, i, w);
		});
	},

	syncSliders: function (id) {
		const weights = this.configs[id].model.layers[0].getWeights()[0].dataSync();
		weights.forEach((w, i) => {
			this._syncSingleSlider(i, w);
		});
	},

	// =========================================================================
	// LEVEL 2 — CONCRETE TASKS (smaller, focused operations)
	// =========================================================================

	// --- Model building ---

	_addHiddenLayers: function (c) {
		c.layers.forEach((l, i) => {
			c.model.add(tf.layers.dense({
				units: parseInt(l.nodes),
				activation: l.act,
				inputShape: i === 0 ? [c.inputs.length] : undefined
			}));
		});
	},

	_addOutputLayer: function (c) {
		c.model.add(tf.layers.dense({ units: c.outputs.length, activation: 'sigmoid' }));
	},

	// --- Training helpers ---

	_recompileOptimizer: function (id, c) {
		const lr = this._readLearningRate(id);
		c.model.optimizer = tf.train.adam(lr);
	},

	_buildTensorsFromData: function (c) {
		const xs = tf.tensor2d(c.data.map(r => r.slice(0, c.inputs.length)));
		const ys = tf.tensor2d(c.data.map(r => r.slice(c.inputs.length)));
		return { xs, ys };
	},

	_trainOneEpoch: async function (c, xs, ys) {
		const h = await c.model.fit(xs, ys, { epochs: 1, verbose: 0 });
		c.loss.push(h.history.loss[0]);
		c.currentEpoch++;
	},

	_refreshAfterEpoch: function (id) {
		this.updateVisuals(id);
		this.syncSliders(id);
		this.updateLivePrediction();
	},

	_finishTraining: function (id, c) {
		c.isTraining = false;
		this.updateButtonState(id, "START");
		c.currentEpoch = 0;
	},

	// --- Visualization: Decision Boundary ---

	_plotDecisionBoundary: function () {
		const c = this.configs.traininglab;
		const { gridX, gridY } = this._buildGrid(25);

		tf.tidy(() => {
			const preds = this._predictGrid(c.model, gridX, gridY);
			const traces = this._buildBoundaryTraces(c, gridX, gridY, preds);
			Plotly.react('traininglab-data-chart', traces, this._boundaryLayout());
		});
	},

	_buildGrid: function (steps) {
		const gridX = [], gridY = [];
		for (let i = 0; i <= steps; i++) {
			for (let j = 0; j <= steps; j++) {
				gridX.push(i / steps);
				gridY.push(j / steps);
			}
		}
		return { gridX, gridY };
	},

	_predictGrid: function (model, gridX, gridY) {
		const input = tf.tensor2d(gridX.map((v, i) => [v, gridY[i]]));
		return model.predict(input).dataSync();
	},

	_buildBoundaryTraces: function (c, gridX, gridY, preds) {
		return [
			this._contourTrace(gridX, gridY, preds),
			this._dataPointsTrace(c)
		];
	},

	_contourTrace: function (gridX, gridY, preds) {
		return {
			x: gridX, y: gridY, z: Array.from(preds),
			type: 'contour',
			colorscale: [
				[0, '#dc2626'],
				[0.2, '#f87171'],
				[0.4, '#fca5a5'],
				[0.5, '#f5f5f5'],
				[0.6, '#93c5fd'],
				[0.8, '#60a5fa'],
				[1, '#2563eb']
			],
			showscale: false,
			opacity: 0.85,
			contours: { coloring: 'heatmap' },
			reversescale: false
		};
	},

	_dataPointsTrace: function (c) {
		return {
			x: c.data.map(r => r[0]),
			y: c.data.map(r => r[1]),
			mode: 'markers',
			marker: {
				color: c.data.map(r => r[2] === 0 ? '#ef4444' : '#3b82f6'),
				size: 14,
				line: { width: 2.5, color: 'white' },
				opacity: 0.9
			}
		};
	},

	_boundaryLayout: function () {
		return {
			margin: { t: 10, b: 30, l: 30, r: 10 },
			height: 250,
			paper_bgcolor: 'transparent',
			plot_bgcolor: '#fafbfc',
			font: { family: '-apple-system, BlinkMacSystemFont, sans-serif', size: 11, color: '#64748b' },
			xaxis: { gridcolor: '#f1f5f9', zerolinecolor: '#e2e8f0' },
			yaxis: { gridcolor: '#f1f5f9', zerolinecolor: '#e2e8f0' }
		};
	},

	// --- Visualization: Loss History ---

	_plotLossHistory: function (c) {
		Plotly.react('master-loss-landscape', [this._lossTrace(c)], this._lossLayout());
	},

	_lossTrace: function (c) {
		return {
			y: [...c.loss],
			type: 'scatter',
			fill: 'tozeroy',
			fillcolor: 'rgba(239,68,68,0.08)',
			line: { color: '#ef4444', width: 2, shape: 'spline' }
		};
	},

	_lossLayout: function () {
		return {
			margin: { t: 10, b: 30, l: 40, r: 10 },
			height: 180,
			paper_bgcolor: 'transparent',
			plot_bgcolor: '#fafbfc',
			font: { family: '-apple-system, BlinkMacSystemFont, sans-serif', size: 11, color: '#64748b' },
			yaxis: { type: 'log', title: 'Error', gridcolor: '#f1f5f9', zerolinecolor: '#e2e8f0' },
			xaxis: { title: 'Epochs', gridcolor: '#f1f5f9', zerolinecolor: '#e2e8f0' }
		};
	},

	// --- Visualization: Prediction Table ---

	_updatePredictionTable: function (id, c) {
		if (!c.model) return;

		tf.tidy(() => {
			const inputData = c.data.map(r => r.slice(0, c.inputs.length));
			const preds = c.model.predict(tf.tensor2d(inputData)).dataSync();

			c.data.forEach((row, ri) => {
				const targetVal = row[c.inputs.length];
				const predVal = preds[ri];
				const error = Math.abs(predVal - targetVal);
				this._updatePredictionRow(id, ri, predVal, error);
			});
		});
	},

	_updatePredictionRow: function (id, ri, predVal, error) {
		const predCell = document.getElementById(`pred-${id}-${ri}`);
		const errCell = document.getElementById(`err-${id}-${ri}`);

		if (predCell && errCell) {
			predCell.innerText = predVal.toFixed(3);
			predCell.style.fontFamily = "'SF Mono', 'Fira Code', monospace";
			predCell.style.fontSize = "0.9em";
			errCell.innerText = error.toFixed(3);
			errCell.style.fontFamily = "'SF Mono', 'Fira Code', monospace";
			errCell.style.fontSize = "0.9em";
			errCell.style.fontWeight = "600";
			errCell.style.transition = "color 0.3s ease";
			errCell.style.color = error > 0.3 ? '#ef4444' : error > 0.1 ? '#f59e0b' : '#22c55e';
		}
	},

	// --- Visualization: Heatmaps ---

	_renderHeatmaps: function (id, c) {
		const vizContainer = document.getElementById(id + '-tensor-viz');
		if (!vizContainer) return;

		c.model.layers.forEach((l, idx) => {
			if (l.getWeights().length === 0) return;
			const cvs = this._ensureHeatmapCanvas(vizContainer, l, idx);
			if (cvs) this._drawHeatmap(l, cvs);
		});
	},

	_ensureHeatmapCanvas: function (container, layer, idx) {
		let cvs = document.getElementById(`cvs-${idx}`);
		if (!cvs) {
			this._appendHeatmapLabel(container, layer, idx);
			cvs = document.createElement('canvas');
			cvs.id = `cvs-${idx}`;
			cvs.className = "heatmap-canvas";
			container.appendChild(cvs);
		}
		return cvs;
	},

	_appendHeatmapLabel: function (container, layer, idx) {
		const lbl = document.createElement('div');
		lbl.className = "heatmap-label";
		const actName = layer.activation.constructor.name.replace('Activation', '');
		lbl.innerText = `Layer ${idx + 1} (${actName})`;
		container.appendChild(lbl);
	},

	_drawHeatmap: function (layer, cvs) {
		tf.tidy(() => {
			const w = layer.getWeights()[0];
			const norm = w.sub(w.min()).div(w.max().sub(w.min()).add(0.0001));
			const smallW = w.shape[0];
			const smallH = w.shape[1] || 1;
			tf.browser.toPixels(norm.reshape([smallW, smallH, 1]), cvs);
		});
	},

	// --- Visualization: Math Monitor ---

	_renderMathMonitor: function (id, c) {
		const mon = document.getElementById(id + '-math-monitor');
		if (!mon) return;

		let h = "";
		c.model.layers.forEach((l, idx) => {
			const weights = l.getWeights();
			if (weights.length < 2) return;
			h += this._buildLayerFormula(l, idx, c.model.layers.length);
		});
		mon.innerHTML = h;
		render_temml();
	},

	_buildLayerFormula: function (layer, idx, totalLayers) {
		const [W, B] = [layer.getWeights()[0].arraySync(), layer.getWeights()[1].arraySync()];
		const actDisplay = idx === totalLayers - 1 ? "Sigmoid" : "ReLU";
		const texW = this._weightsToTex(W);

		return `<div class="formula-block">
		    <b>Layer ${idx + 1}:</b><br>
		    $ \\text{out} = \\text{${actDisplay}}\\left( X \\cdot ${texW} + ${B[0].toFixed(3)} \\right) $
		</div>`;
	},

	_weightsToTex: function (W) {
		const inner = Array.isArray(W[0])
			? W.map(r => r.map(v => v.toFixed(3)).join(" & ")).join(" \\\\ ")
			: W.map(v => v.toFixed(3)).join(" & ");
		return "\\begin{pmatrix} " + inner + " \\end{pmatrix}";
	},

	// --- UI: Table rendering ---

	_renderTableHeader: function (id) {
		document.getElementById(id + '-thr').innerHTML =
			`<th style="width:18%">x₁</th><th style="width:18%">x₂</th><th style="width:18%">Tgt</th><th style="width:18%">Prd</th><th style="width:18%">Err</th><th style="width:10%"></th>`;
	},

	_renderTableBody: function (id, c) {
		const tbody = document.querySelector(`#${id}-train-table tbody`);
		tbody.innerHTML = "";

		c.data.forEach((row, ri) => {
			const tr = tbody.insertRow();
			this._renderDataCells(tr, id, c, row, ri);
			this._renderPredErrCells(tr, id, ri);
			this._renderDeleteCell(tr, id, ri);
		});
	},

	_renderDataCells: function (tr, id, c, row, ri) {
		row.forEach((v, ci) => {
			const td = tr.insertCell();
			const inp = document.createElement('input');
			inp.type = "number"; inp.value = v; inp.step = "0.1";
			inp.oninput = (e) => { c.data[ri][ci] = parseFloat(e.target.value) || 0; this.updateVisuals(id); };
			td.appendChild(inp);
		});
	},

	_renderPredErrCells: function (tr, id, ri) {
		const predCell = tr.insertCell(); predCell.id = `pred-${id}-${ri}`;
		const errCell = tr.insertCell(); errCell.id = `err-${id}-${ri}`;
	},

	_renderDeleteCell: function (tr, id, ri) {
		const delCell = tr.insertCell();
		const delBtn = document.createElement('button');
		delBtn.innerHTML = "×";
		delBtn.className = "btn-delete";
		delBtn.onclick = () => this.removeRow(id, ri);
		delCell.appendChild(delBtn);
	},

	// --- UI: Button state ---

	updateButtonState: function (id, text) {
		const btn = document.getElementById(`${id}-train-btn`);
		const dashboard = document.querySelector('.lab-dashboard');
		if (btn) {
			if (text === "STOP") {
				btn.innerHTML = '<span class="btn-icon">⏸</span> STOP';
				btn.style.background = 'linear-gradient(135deg, #ef4444, #dc2626)';
				btn.style.boxShadow = '0 2px 8px rgba(239,68,68,0.3)';
				btn.className = 'btn btn-start';
				if (dashboard) dashboard.classList.add('is-training');
			} else if (text === "CONTINUE") {
				btn.innerHTML = '<span class="btn-icon">▶</span> CONTINUE';
				btn.style.background = 'linear-gradient(135deg, #f59e0b, #d97706)';
				btn.style.boxShadow = '0 2px 8px rgba(245,158,11,0.3)';
				btn.className = 'btn btn-start';
				if (dashboard) dashboard.classList.remove('is-training');
			} else {
				btn.innerHTML = '<span class="btn-icon">▶</span> START';
				btn.style.background = 'linear-gradient(135deg, #22c55e, #16a34a)';
				btn.style.boxShadow = '0 2px 8px rgba(34,197,94,0.3)';
				btn.className = 'btn btn-start';
				if (dashboard) dashboard.classList.remove('is-training');
			}
		}
	},

	// --- UI: Weight sliders ---

	_appendSlider: function (container, id, i, w) {
		const div = document.createElement('div');
		div.className = "manual-weight-item";
		div.innerHTML = `
		    <div style="display:flex; justify-content:space-between; align-items:center;">
			<label>W${i + 1}</label>
			<b id="w-val-${i}" style="font-family:monospace;">${w.toFixed(4)}</b>
		    </div>
		    <input type="range" class="w-slider" data-idx="${i}" min="-3" max="3" step="0.01" value="${w}" 
		    style="width:100%;" oninput="TrainLab.manualUpdate('${id}', 0, ${i}, this.value)">`;
		container.appendChild(div);
	},

	_syncSingleSlider: function (i, w) {
		const s = document.querySelector(`.w-slider[data-idx="${i}"]`);
		if (s) {
			s.value = w;
			document.getElementById(`w-val-${i}`).innerText = w.toFixed(5);
		}
	},

	// =========================================================================
	// LEVEL 3 — ATOMIC HELPERS (lowest level, "real work")
	// =========================================================================

	_readLearningRate: function (id) {
		return parseFloat(document.getElementById(`${id}-lr`).value);
	},

	_readTotalEpochs: function (id) {
		return parseInt(document.getElementById(`${id}-epochs`).value);
	},

	_readPredictionInputs: function () {
		const x1 = parseFloat(document.getElementById('pred-x1').value) || 0;
		const x2 = parseFloat(document.getElementById('pred-x2').value) || 0;
		return { x1, x2 };
	},

	_predictSingle: function (model, x1, x2) {
		let val;
		tf.tidy(() => {
			const out = model.predict(tf.tensor2d([[x1, x2]]));
			val = out.dataSync()[0];
		});
		return val;
	},

	_displayPrediction: function (val) {
		const el = document.getElementById('pred-output');
		el.innerText = val.toFixed(4);
		el.style.color = val > 0.5 ? '#3b82f6' : '#ef4444';
	},

	_setLayerWeight: function (id, layerIdx, wIdx, val) {
		const layer = this.configs[id].model.layers[layerIdx];
		let [W, B] = layer.getWeights();
		let wData = W.dataSync();
		wData[wIdx] = val;
		layer.setWeights([tf.tensor(wData, W.shape), B]);
	},

	_updateWeightLabel: function (wIdx, val) {
		const label = document.getElementById(`w-val-${wIdx}`);
		if (label) label.innerText = val.toFixed(5);
	}
};

// =========================================================================
// MODULE LOADER (unchanged)
// =========================================================================

function initTrainingModule() {
	const traininglab_observer = new IntersectionObserver((entries, obs) => {
		entries.forEach(entry => {
			if (entry.isIntersecting) {
				TrainLab.init('traininglab');
				obs.unobserve(entry.target);
			}
		});
	}, {
		threshold: 0.1
	});

	const target = document.querySelector('.lab-dashboard');

	if (target) {
		traininglab_observer.observe(target);
	} else {
		TrainLab.init('traininglab');
	}
}

async function loadTrainingModule() {
	updateLoadingStatus("Loading section about Training...");
	initTrainingModule();
	return Promise.resolve();
}
