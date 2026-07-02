"use strict";

// ============================================================
// GRADIENT FLOW HEATMAP - Visualizes gradient magnitudes
// flowing backward through each layer during training.
// Reveals vanishing/exploding gradients at a glance.
// ============================================================

var GradientFlowHeatmap = (function () {

	var _SINGLETON_ID = "gradient_flow_singleton";
	var _state = {
		container: null,
		history: [],
		maxHistory: 200,
		isComputing: false,
		lastRenderTime: 0,
		animationFrame: null,
		initialized: false,
		heatCanvas: null,
		legendCanvas: null,
		lastValidRecord: null,
		hasEverRendered: false,
		lastValidHistory: [],
		renderLock: false,
		skeletonBuiltOnce: false,
		suppressEmptyUntil: 0,
		consecutiveFailures: 0,
		maxConsecutiveFailures: 100,
		minRenderInterval: 300,
		isTraining: false,
		visibilityState: "empty",
		contentShownOnce: false,
		lastLayerCount: -1,
		offscreenCanvas: null,
		offscreenCtx: null,
		pendingRender: null,
		frozenDuringCompute: false,
		lastContainerId: null  // NEW: remember where we render
	};

	// ============================================================
	// TRANSLATION HELPER
	// ============================================================

	function _t(key, fallback) {
		if (typeof language !== "undefined" && typeof lang !== "undefined" && language[lang] && language[lang][key]) {
			return language[lang][key];
		}
		return fallback || key;
	}

	// ============================================================
	// STYLES
	// ============================================================

	function _injectStyles() {
		if (document.getElementById("gradient_flow_styles")) return;
		var style = document.createElement("style");
		style.id = "gradient_flow_styles";
		style.textContent = [
			".gflow_container { padding: 16px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }",
			".gflow_header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }",
			".gflow_header h2 { margin: 0; font-size: 1.3em; font-weight: 700; }",
			".gflow_header_meta { font-size: 0.75em; opacity: 0.5; transition: opacity 0.3s ease; }",
			".gflow_subtitle { opacity: 0.55; margin: 0 0 14px 0; font-size: 0.82em; line-height: 1.5; }",
			".gflow_canvas_wrap { position: relative; border-radius: 10px; overflow: hidden; border: 1px solid rgba(128,128,128,0.15); background: rgba(0,0,0,0.02); margin-bottom: 14px; min-height: 60px; }",
			".gflow_canvas { display: block; width: 100%; height: auto; image-rendering: pixelated; border-radius: 8px; }",
			".gflow_legend { display: flex; align-items: center; gap: 6px; font-size: 0.75em; opacity: 0.7; margin-bottom: 12px; flex-wrap: wrap; }",
			".gflow_legend_bar { width: 120px; height: 10px; border-radius: 3px; border: 1px solid rgba(128,128,128,0.2); }",
			".gflow_stats_grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 10px; margin-bottom: 14px; }",
			".gflow_stat_card { padding: 10px 12px; border-radius: 8px; border: 1px solid rgba(128,128,128,0.12); background: rgba(128,128,128,0.03); transition: border-color 0.3s ease; }",
			".gflow_stat_card .gflow_stat_label { font-size: 0.72em; opacity: 0.55; text-transform: uppercase; letter-spacing: 0.4px; margin-bottom: 3px; }",
			".gflow_stat_card .gflow_stat_value { font-size: 1.1em; font-weight: 600; font-variant-numeric: tabular-nums; font-family: 'SF Mono', 'Fira Code', monospace; transition: color 0.3s ease; }",
			".gflow_layer_bars { margin-bottom: 14px; }",
			".gflow_layer_row { display: flex; align-items: center; gap: 8px; margin-bottom: 4px; font-size: 0.8em; }",
			".gflow_layer_name { min-width: 120px; max-width: 160px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; opacity: 0.7; }",
			".gflow_layer_bar_outer { flex: 1; height: 14px; background: rgba(128,128,128,0.1); border-radius: 4px; overflow: hidden; position: relative; }",
			".gflow_layer_bar_inner { height: 100%; border-radius: 4px; transition: width 0.6s ease, background-color 0.6s ease; }",
			".gflow_layer_val { min-width: 70px; text-align: right; font-family: 'SF Mono', 'Fira Code', monospace; font-size: 0.85em; opacity: 0.7; transition: opacity 0.3s ease; }",
			".gflow_warning { padding: 10px 14px; border-radius: 8px; margin-bottom: 12px; font-size: 0.85em; display: flex; align-items: center; gap: 8px; transition: background 0.4s ease, border-color 0.4s ease, color 0.4s ease; }",
			".gflow_warning_vanishing { background: rgba(243,156,18,0.08); border: 1px solid rgba(243,156,18,0.3); color: #e67e22; }",
			".gflow_warning_exploding { background: rgba(231,76,60,0.08); border: 1px solid rgba(231,76,60,0.3); color: #c0392b; }",
			".gflow_warning_healthy { background: rgba(46,204,113,0.08); border: 1px solid rgba(46,204,113,0.3); color: #27ae60; }",
			".gflow_empty { padding: 40px; text-align: center; opacity: 0.5; font-size: 1em; transition: opacity 0.4s ease; }",
			".gflow_time_axis { display: flex; justify-content: space-between; font-size: 0.65em; opacity: 0.4; margin-top: 2px; padding: 0 2px; }",
			".gflow_label_overlay { position: absolute; top: 0; left: 0; height: 100%; display: flex; flex-direction: column; justify-content: space-around; padding: 2px 6px; pointer-events: none; }",
			".gflow_label_overlay span { font-size: 0.65em; color: rgba(255,255,255,0.85); text-shadow: 0 1px 3px rgba(0,0,0,0.8); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 100px; }",
			"@keyframes gflow_fadein { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: translateY(0); } }",
			".gflow_fade_in { animation: gflow_fadein 0.3s ease-out; }",
		].join("\n");
		document.head.appendChild(style);
	}

	// ============================================================
	// CONTAINER
	// ============================================================

	function _getOrCreateContainer(divOrId) {
		if (typeof divOrId === "string" && divOrId !== "") {
			_state.lastContainerId = divOrId;
			var el = document.getElementById(divOrId);
			if (el) { _state.container = el; return el; }
		} else if (divOrId instanceof HTMLElement) {
			_state.container = divOrId;
			return divOrId;
		}

		var existing = document.getElementById(_SINGLETON_ID);
		if (existing) { _state.container = existing; return existing; }

		var container = document.createElement("div");
		container.id = _SINGLETON_ID;
		document.body.appendChild(container);
		_state.container = container;
		return container;
	}

	// ============================================================
	// DOM INTEGRITY CHECK — checks if our root still exists in DOM
	// ============================================================

	function _isDomIntact(container) {
		if (!container) return false;
		if (!_state.initialized) return false;
		// Check the root is still a child of the container AND in the document
		var root = container.querySelector("[data-gflow-root]");
		if (!root) return false;
		if (!document.body.contains(root)) return false;
		return true;
	}

	// ============================================================
	// BUILD SKELETON — only builds if truly needed
	// ============================================================

	function _buildSkeleton(container) {
		// If root exists in this container, just repair
		var existingRoot = container.querySelector("[data-gflow-root]");
		if (existingRoot && document.body.contains(existingRoot)) {
			_attemptMinimalRepair(container);
			_state.initialized = true;
			return;
		}

		// Clear any orphaned content in the container before building
		// (the container was likely wiped externally, so it's empty or has stale content)

		var root = document.createElement("div");
		root.className = "gflow_container";
		root.setAttribute("data-gflow-root", "1");

		// CRITICAL: If we have data, build skeleton with content visible, empty hidden
		var showContent = (_state.history.length > 0 || _state.lastValidHistory.length > 0);

		root.innerHTML = [
			"<div class='gflow_header'>",
			"  <h2><span class='TRANSLATEME_gflow_title'></span></h2>",
			"  <span class='gflow_header_meta' data-gflow='meta'></span>",
			"</div>",
			"<p class='gflow_subtitle'><span class='TRANSLATEME_gflow_subtitle'></span></p>",
			"<div class='gflow_warning gflow_warning_healthy' data-gflow='warning' style='display:none;'></div>",
			"<div class='gflow_stats_grid' data-gflow='stats' style='" + (showContent ? "" : "display:none;") + "'></div>",
			"<div class='gflow_canvas_wrap' data-gflow='heatmap_wrap' style='" + (showContent ? "" : "display:none;") + "'></div>",
			"<div class='gflow_time_axis' data-gflow='time_axis' style='" + (showContent ? "" : "display:none;") + "'><span data-gflow='time_start'></span><span class='TRANSLATEME_gflow_time_arrow'></span><span data-gflow='time_end'></span></div>",
			"<div class='gflow_legend' data-gflow='legend' style='" + (showContent ? "" : "display:none;") + "'>",
			"  <span class='TRANSLATEME_gflow_low_gradient'></span>",
			"  <canvas data-gflow='legend_bar' width='120' height='10' class='gflow_legend_bar'></canvas>",
			"  <span class='TRANSLATEME_gflow_high_gradient'></span>",
			"  <span style='margin-left:12px;opacity:0.5;' class='TRANSLATEME_gflow_log_scale'></span>",
			"</div>",
			"<div class='gflow_layer_bars' data-gflow='layer_bars' style='" + (showContent ? "" : "display:none;") + "'></div>",
			"<div class='gflow_empty' data-gflow='empty' style='" + (showContent ? "display:none;" : "") + "'><span class='TRANSLATEME_gflow_waiting'></span><br><small><span class='TRANSLATEME_gflow_waiting_sub'></span></small></div>",
		].join("\n");

		container.appendChild(root);

		_renderLegendBar(root);

		// Reset canvas references since we rebuilt
		_state.heatCanvas = null;
		_state.legendCanvas = null;
		_state.offscreenCanvas = null;
		_state.offscreenCtx = null;
		_state.initialized = true;
		_state.skeletonBuiltOnce = true;

		// If we have data, set visibility state to content immediately
		if (showContent) {
			_state.visibilityState = "content";
		}
	}

	// ============================================================
	// MINIMAL REPAIR
	// ============================================================

	function _attemptMinimalRepair(container) {
		var root = container.querySelector("[data-gflow-root]");
		if (!root) return false;

		var showContent = (_state.history.length > 0 || _state.lastValidHistory.length > 0 || _state.contentShownOnce);

		var criticalElements = [
			{ attr: "heatmap_wrap", tag: "div", cls: "gflow_canvas_wrap" },
			{ attr: "stats", tag: "div", cls: "gflow_stats_grid" },
			{ attr: "layer_bars", tag: "div", cls: "gflow_layer_bars" },
			{ attr: "warning", tag: "div", cls: "gflow_warning gflow_warning_healthy" },
			{ attr: "legend", tag: "div", cls: "gflow_legend" },
			{ attr: "empty", tag: "div", cls: "gflow_empty" },
			{ attr: "meta", tag: "span", cls: "gflow_header_meta" },
			{ attr: "time_axis", tag: "div", cls: "gflow_time_axis" }
		];

		for (var i = 0; i < criticalElements.length; i++) {
			var spec = criticalElements[i];
			if (!root.querySelector("[data-gflow='" + spec.attr + "']")) {
				var el = document.createElement(spec.tag);
				el.className = spec.cls;
				el.setAttribute("data-gflow", spec.attr);
				if (showContent) {
					el.style.display = (spec.attr === "empty") ? "none" : "";
				} else {
					el.style.display = (spec.attr !== "empty") ? "none" : "";
				}
				root.appendChild(el);
			}
		}

		// Ensure legend bar canvas exists
		var legendEl = root.querySelector("[data-gflow='legend']");
		if (legendEl && !legendEl.querySelector("[data-gflow='legend_bar']")) {
			var lc = document.createElement("canvas");
			lc.setAttribute("data-gflow", "legend_bar");
			lc.className = "gflow_legend_bar";
			lc.width = 120;
			lc.height = 10;
			legendEl.appendChild(lc);
			_renderLegendBar(root);
		}

		// Only null out heatCanvas if it's truly gone from the document
		if (_state.heatCanvas && !document.body.contains(_state.heatCanvas)) {
			_state.heatCanvas = null;
			_state.offscreenCanvas = null;
			_state.offscreenCtx = null;
		}

		_state.initialized = true;
		return true;
	}

	function _renderLegendBar(root) {
		var legendCanvas = root.querySelector("[data-gflow='legend_bar']");
		if (!legendCanvas) return;
		var lctx = legendCanvas.getContext("2d");
		for (var x = 0; x < 120; x++) {
			lctx.fillStyle = _viridisColor(x / 119);
			lctx.fillRect(x, 0, 1, 10);
		}
		_state.legendCanvas = legendCanvas;
	}

	// ============================================================
	// SAFE MODEL & DATA CHECKS
	// ============================================================

	function _isModelAvailable() {
		try {
			if (typeof model === "undefined" || !model) return false;
			if (!model.layers || model.layers.length === 0) return false;
			for (var i = 0; i < model.layers.length; i++) {
				var layerWeights = model.layers[i].trainableWeights;
				if (layerWeights && layerWeights.length > 0) {
					for (var w = 0; w < layerWeights.length; w++) {
						if (layerWeights[w] && layerWeights[w].val && !layerWeights[w].val.isDisposed) {
							return true;
						}
					}
				}
			}
			return false;
		} catch (e) {
			return false;
		}
	}

	function _isDataAvailable() {
		try {
			if (typeof xy_data_global === "undefined") return false;
			if (!xy_data_global) return false;
			if (!xy_data_global.x || !xy_data_global.y) return false;
			if (xy_data_global.x.isDisposed || xy_data_global.y.isDisposed) return false;
			if (!xy_data_global.x.shape || xy_data_global.x.shape[0] === 0) return false;
			if (!xy_data_global.y.shape || xy_data_global.y.shape[0] === 0) return false;
			return true;
		} catch (e) {
			return false;
		}
	}

	function _canComputeGradients() {
		return _isModelAvailable() && _isDataAvailable() && !_state.isComputing;
	}

	// ============================================================
	// GRADIENT COMPUTATION
	// ============================================================

	function _getTrainableWeights() {
		var trainableWeights = [];
		var weightMeta = [];

		try {
			for (var li = 0; li < model.layers.length; li++) {
				var layer = model.layers[li];
				if (!layer.trainableWeights || layer.trainableWeights.length === 0) continue;

				for (var wi = 0; wi < layer.trainableWeights.length; wi++) {
					var w = layer.trainableWeights[wi];
					if (w && w.val && !w.val.isDisposed) {
						trainableWeights.push(w.val);
						weightMeta.push({
							layerIndex: li,
							layerName: layer.name || ("layer_" + li),
							layerType: layer.getClassName ? layer.getClassName() : "unknown",
							weightName: w.name || ("w_" + wi),
							paramCount: w.val.size
						});
					}
				}
			}
		} catch (e) {
			return { weights: [], meta: [] };
		}

		return { weights: trainableWeights, meta: weightMeta };
	}

	function _getBatch(xTensor, yTensor) {
		var numSamples = xTensor.shape[0];
		var maxSamples = Math.min(32, numSamples);

		if (maxSamples < numSamples) {
			var indices = [];
			var step = numSamples / maxSamples;
			for (var i = 0; i < maxSamples; i++) {
				indices.push(Math.min(Math.floor(i * step), numSamples - 1));
			}
			return { x: tf.gather(xTensor, indices), y: tf.gather(yTensor, indices), isSlice: true };
		}
		return { x: xTensor, y: yTensor, isSlice: false };
	}

	function _computeNormStats(gradData) {
		var l2Norm = 0;
		var maxAbs = 0;
		var minAbs = Infinity;
		var sum = 0;

		for (var j = 0; j < gradData.length; j++) {
			var absVal = Math.abs(gradData[j]);
			l2Norm += gradData[j] * gradData[j];
			sum += absVal;
			if (absVal > maxAbs) maxAbs = absVal;
			if (absVal < minAbs) minAbs = absVal;
		}

		return {
			l2Norm: Math.sqrt(l2Norm),
			maxAbs: maxAbs,
			minAbs: minAbs,
			meanAbs: gradData.length > 0 ? sum / gradData.length : 0
		};
	}

	function _aggregateLayerGradients(trainableWeights, weightMeta, grads) {
		var layerGradients = {};

		for (var gi = 0; gi < trainableWeights.length; gi++) {
			var meta = weightMeta[gi];
			var gradTensor = grads[trainableWeights[gi].name];
			if (!gradTensor) continue;

			var gradData;
			try {
				gradData = gradTensor.dataSync();
			} catch (e) {
				continue;
			}
			var stats = _computeNormStats(gradData);

			var key = meta.layerIndex + "_" + meta.layerName;
			if (!layerGradients[key]) {
				layerGradients[key] = {
					name: meta.layerName,
					type: meta.layerType,
					index: meta.layerIndex,
					gradNorm: 0,
					gradMax: 0,
					gradMin: Infinity,
					gradMean: 0,
					paramCount: 0,
					weightCount: 0
				};
			}

			layerGradients[key].gradNorm += stats.l2Norm;
			layerGradients[key].gradMax = Math.max(layerGradients[key].gradMax, stats.maxAbs);
			layerGradients[key].gradMin = Math.min(layerGradients[key].gradMin, stats.minAbs);
			layerGradients[key].gradMean += stats.meanAbs;
			layerGradients[key].paramCount += meta.paramCount;
			layerGradients[key].weightCount++;
		}

		return layerGradients;
	}

	function _layerGradientsToSortedArray(layerGradients) {
		var layers = [];
		var keys = Object.keys(layerGradients);
		for (var k = 0; k < keys.length; k++) {
			var lg = layerGradients[keys[k]];
			if (lg.weightCount > 0) {
				lg.gradMean /= lg.weightCount;
			}
			layers.push(lg);
		}
		layers.sort(function (a, b) { return a.index - b.index; });
		return layers;
	}

	function _computeGradients() {
		if (!_canComputeGradients()) {
			return null;
		}

		_state.isComputing = true;
		var result = null;

		try {
			result = tf.tidy(function () {
				// Re-validate inside tidy
				if (!_isDataAvailable() || !_isModelAvailable()) return null;

				var xTensor, yTensor;
				try {
					xTensor = xy_data_global.x;
					yTensor = xy_data_global.y;
					if (!xTensor || xTensor.isDisposed || !yTensor || yTensor.isDisposed) return null;
				} catch (e) {
					return null;
				}

				var batch = _getBatch(xTensor, yTensor);
				var weightInfo = _getTrainableWeights();

				if (weightInfo.weights.length === 0) return null;

				var lossFunction = function () {
					var predictions;
					try {
						predictions = model.apply(batch.x, { training: true });
					} catch (e) {
						return tf.scalar(0);
					}
					if (!predictions || predictions.isDisposed) return tf.scalar(0);

					var lossFn = model.loss;
					if (typeof lossFn === "string") {
						lossFn = tf.losses[lossFn] || tf.losses.meanSquaredError;
					} else if (typeof lossFn !== "function") {
						lossFn = tf.losses.meanSquaredError;
					}
					try {
						return lossFn(batch.y, predictions).mean();
					} catch (e) {
						return tf.scalar(0);
					}
				};

				var gradsResult;
				try {
					gradsResult = tf.variableGrads(lossFunction, weightInfo.weights);
				} catch (innerErr) {
					return null;
				}

				if (!gradsResult || !gradsResult.grads) return null;

				var layerGradients = _aggregateLayerGradients(weightInfo.weights, weightInfo.meta, gradsResult.grads);

				if (gradsResult.value && !gradsResult.value.isDisposed) {
					gradsResult.value.dispose();
				}

				var layers = _layerGradientsToSortedArray(layerGradients);
				if (layers.length === 0) return null;

				return {
					timestamp: Date.now(),
					layers: layers
				};
			});
		} catch (e) {
			result = null;
		} finally {
			// *** CRITICAL FIX: ALWAYS reset isComputing ***
			_state.isComputing = false;
		}

		if (result && result.layers && result.layers.length > 0) {
			_state.consecutiveFailures = 0;
		} else {
			_state.consecutiveFailures++;
		}

		return result;
	}

	// ============================================================
	// HEATMAP CANVAS RENDERING (DOUBLE-BUFFERED)
	// ============================================================

	function _computeHeatmapDimensions(numSteps, numLayers) {
		var width = Math.max(300, Math.min(800, numSteps * 12));
		var height = Math.max(60, numLayers * 20);
		return { width: width, height: height };
	}

	function _computeLogRange(history) {
		var allNorms = [];
		for (var t = 0; t < history.length; t++) {
			for (var l = 0; l < history[t].layers.length; l++) {
				var norm = history[t].layers[l].gradNorm;
				if (norm > 0 && isFinite(norm)) allNorms.push(norm);
			}
		}
		if (allNorms.length === 0) return null;

		allNorms.sort(function (a, b) { return a - b; });
		var logMin = Math.log10(Math.max(allNorms[0], 1e-12));
		var logMax = Math.log10(allNorms[allNorms.length - 1] || 1);
		var logRange = logMax - logMin || 1;
		return { logMin: logMin, logMax: logMax, logRange: logRange };
	}

	function _ensureOffscreenCanvas(width, height) {
		if (_state.offscreenCanvas &&
			_state.offscreenCanvas.width === width &&
			_state.offscreenCanvas.height === height) {
			return _state.offscreenCanvas;
		}

		_state.offscreenCanvas = document.createElement("canvas");
		_state.offscreenCanvas.width = width;
		_state.offscreenCanvas.height = height;
		_state.offscreenCtx = _state.offscreenCanvas.getContext("2d");
		return _state.offscreenCanvas;
	}

	function _renderHeatmapInPlace(canvas, history) {
		if (!canvas || history.length === 0) return;
		if (!history[0].layers || history[0].layers.length === 0) return;

		var numLayers = history[0].layers.length;
		var numSteps = history.length;
		var dims = _computeHeatmapDimensions(numSteps, numLayers);

		// Ensure the visible canvas has correct dimensions
		if (canvas.width !== dims.width || canvas.height !== dims.height) {
			canvas.width = dims.width;
			canvas.height = dims.height;
			canvas.style.height = dims.height + "px";
		}

		var range = _computeLogRange(history);
		if (!range) return;

		// DOUBLE BUFFER: Render to offscreen canvas first, then copy in one
		// operation. This eliminates flicker from clearRect + progressive draw.
		var offscreen = _ensureOffscreenCanvas(dims.width, dims.height);
		var ctx = _state.offscreenCtx;
		ctx.clearRect(0, 0, dims.width, dims.height);

		var cellW = dims.width / numSteps;
		var cellH = dims.height / numLayers;

		for (var t = 0; t < numSteps; t++) {
			var record = history[t];
			if (!record || !record.layers) continue;
			for (var l = 0; l < Math.min(record.layers.length, numLayers); l++) {
				var norm = record.layers[l].gradNorm;
				var logNorm = Math.log10(Math.max(norm, 1e-12));
				var normalized = (logNorm - range.logMin) / range.logRange;
				normalized = Math.max(0, Math.min(1, normalized));

				ctx.fillStyle = _viridisColor(normalized);
				ctx.fillRect(
					Math.floor(t * cellW),
					Math.floor(l * cellH),
					Math.ceil(cellW) + 1,
					Math.ceil(cellH) + 1
				);
			}
		}

		// Single atomic copy to visible canvas — no flicker
		var visibleCtx = canvas.getContext("2d");
		visibleCtx.clearRect(0, 0, dims.width, dims.height);
		visibleCtx.drawImage(offscreen, 0, 0);
	}

	// ============================================================
	// VIRIDIS COLORMAP
	// ============================================================

	function _viridisColor(t) {
		var r, g, b;
		if (t < 0.25) {
			var s = t / 0.25;
			r = Math.round(68 + s * (49 - 68));
			g = Math.round(1 + s * (104 - 1));
			b = Math.round(84 + s * (142 - 84));
		} else if (t < 0.5) {
			var s = (t - 0.25) / 0.25;
			r = Math.round(49 + s * (33 - 49));
			g = Math.round(104 + s * (144 - 104));
			b = Math.round(142 + s * (141 - 142));
		} else if (t < 0.75) {
			var s = (t - 0.5) / 0.25;
			r = Math.round(33 + s * (93 - 33));
			g = Math.round(144 + s * (201 - 144));
			b = Math.round(141 + s * (99 - 141));
		} else {
			var s = (t - 0.75) / 0.25;
			r = Math.round(93 + s * (253 - 93));
			g = Math.round(201 + s * (231 - 201));
			b = Math.round(99 + s * (37 - 99));
		}
		return "rgb(" + r + "," + g + "," + b + ")";
	}

	// ============================================================
	// DIAGNOSTICS
	// ============================================================

	function _diagnose(latestRecord) {
		if (!latestRecord || !latestRecord.layers || latestRecord.layers.length < 2) return null;

		var layers = latestRecord.layers;
		var norms = layers.map(function (l) { return l.gradNorm; });
		var totalLayers = norms.length;
		var positiveNorms = norms.filter(function (n) { return n > 0; });
		var zeroNorms = norms.filter(function (n) { return n === 0 || n < 1e-30; });

		if (positiveNorms.length === 0) {
			// ALL layers have zero gradient — completely dead network
			return {
				status: "vanishing",
				ratio: Infinity,
				maxNorm: 0,
				minNorm: 0,
				zeroLayerCount: totalLayers,
				totalLayerCount: totalLayers
			};
		}

		var maxNorm = Math.max.apply(null, norms);
		var minNorm = positiveNorms.length > 0 ? Math.min.apply(null, positiveNorms) : 0;
		var ratio = (minNorm > 0 && maxNorm > 0) ? maxNorm / minNorm : 1;

		return _classifyGradientHealth(maxNorm, minNorm, ratio, zeroNorms.length, totalLayers, norms);
	}

	function _classifyGradientHealth(maxNorm, minNorm, ratio, zeroLayerCount, totalLayerCount, norms) {
		var status = "healthy";
		var message = "";

		// --- NEW: Detect layers with zero/near-zero gradients (dying ReLU, dead layers) ---
		// If ANY layer has zero gradient while others don't, that's a vanishing gradient problem
		var nearZeroThreshold = 1e-10;
		var nearZeroCount = 0;
		if (norms) {
			for (var i = 0; i < norms.length; i++) {
				if (norms[i] < nearZeroThreshold) {
					nearZeroCount++;
				}
			}
		} else {
			nearZeroCount = zeroLayerCount;
		}

		var fractionDead = nearZeroCount / totalLayerCount;

		if (nearZeroCount > 0 && nearZeroCount < totalLayerCount) {
			// Some layers receive gradient, some don't — classic vanishing/dying ReLU
			status = "vanishing";
			message = nearZeroCount + " of " + totalLayerCount + " layers have near-zero gradients (dead). Gradient is not flowing through the full network. Consider using residual connections, batch normalization, or different activation functions.";
		} else if (nearZeroCount === totalLayerCount) {
			// All layers dead
			status = "vanishing";
			message = "All layers have zero gradients. The network is completely unable to learn. Check for dying ReLU, extreme bias values, or disconnected layers.";
		} else if (maxNorm > 1e4) {
			status = "exploding";
			message = "Gradient magnitudes are extremely large (max: " + maxNorm.toExponential(2) + "). Consider reducing learning rate or adding gradient clipping.";
		} else if (minNorm < 1e-8 && maxNorm > 1e-2) {
			status = "vanishing";
			message = "Some layers have near-zero gradients (min: " + minNorm.toExponential(2) + "). Consider using residual connections, batch normalization, or different activation functions.";
		} else if (ratio > 1e4) {
			status = "vanishing";
			message = "Gradient ratio across layers is " + ratio.toExponential(1) + "\u00d7. Early layers may not be learning effectively.";
		} else if (fractionDead > 0) {
			// Catch edge case: some layers are near-zero but didn't trigger above
			status = "vanishing";
			message = nearZeroCount + " of " + totalLayerCount + " layers have negligible gradients.";
		} else {
			message = "Gradient flow looks healthy. All layers are receiving meaningful gradient signal.";
		}

		return {
			status: status,
			ratio: ratio,
			maxNorm: maxNorm,
			minNorm: minNorm,
			zeroLayerCount: nearZeroCount,
			totalLayerCount: totalLayerCount
		};
	}

	// ============================================================
	// DOM UPDATE HELPERS
	// ============================================================

	function _showElement(el) {
		if (el && el.style.display === "none") el.style.display = "";
	}

	function _hideElement(el) {
		if (el && el.style.display !== "none") el.style.display = "none";
	}

	function _updateMeta(metaEl) {
		if (!metaEl) return;
		var snapshotCount = _state.history.length;
		if (snapshotCount === 0 && _state.lastValidHistory.length > 0) {
			snapshotCount = _state.lastValidHistory.length;
		}
		var timeStr = new Date().toLocaleTimeString();
		var newText = snapshotCount + " snapshots \u00b7 " + timeStr;
		if (metaEl.textContent !== newText) {
			metaEl.textContent = newText;
		}
	}

	function _updateWarning(warningEl, diagnosis) {
		if (!warningEl) return;
		if (!diagnosis) { _hideElement(warningEl); return; }

		_showElement(warningEl);
		var newClass = "gflow_warning " + (
			diagnosis.status === "exploding" ? "gflow_warning_exploding" :
			diagnosis.status === "vanishing" ? "gflow_warning_vanishing" : "gflow_warning_healthy"
		);
		if (warningEl.className !== newClass) {
			warningEl.className = newClass;
		}
		var icon = diagnosis.status === "exploding" ? "\ud83d\udd25" :
			diagnosis.status === "vanishing" ? "\u26a0\ufe0f" : "\u2705";
		var msgKey = diagnosis.status === "exploding" ? "gflow_exploding" :
			diagnosis.status === "vanishing" ? "gflow_vanishing" : "gflow_healthy";
		var newText = icon + " <span class='TRANSLATEME_" + msgKey + "'></span>";
		if (warningEl.innerHTML !== newText) {
			warningEl.innerHTML = newText;
		}
	}

	function _updateStatsCards(statsEl, latest, diagnosis) {
		if (!statsEl || !latest || !latest.layers || latest.layers.length === 0) return;

		var norms = latest.layers.map(function (l) { return l.gradNorm; });
		var positiveNorms = norms.filter(function (n) { return n > 0; });
		var maxN = Math.max.apply(null, norms);
		var minN = positiveNorms.length > 0 ? Math.min.apply(null, positiveNorms) : 0;
		var avgN = norms.reduce(function (a, b) { return a + b; }, 0) / norms.length;

		var statValues = [
			maxN.toExponential(3),
			minN.toExponential(3),
			avgN.toExponential(3),
			diagnosis ? diagnosis.ratio.toExponential(2) + "\u00d7" : "N/A"
		];
		var statLabels = [
			"<span class='TRANSLATEME_gflow_max_norm_label'></span>",
			"<span class='TRANSLATEME_gflow_min_norm_label'></span>",
			"<span class='TRANSLATEME_gflow_mean_norm_label'></span>",
			"<span class='TRANSLATEME_gflow_layer_ratio_label'></span>"
		];

		var existingCards = statsEl.querySelectorAll(".gflow_stat_card");
		if (existingCards.length !== 4) {
			statsEl.innerHTML = "";
			for (var si = 0; si < 4; si++) {
				var card = document.createElement("div");
				card.className = "gflow_stat_card";
				card.innerHTML = "<div class='gflow_stat_label'>" + statLabels[si] + "</div><div class='gflow_stat_value' data-gflow-stat='" + si + "'>" + statValues[si] + "</div>";
				statsEl.appendChild(card);
			}
		} else {
			for (var si = 0; si < 4; si++) {
				var valEl = statsEl.querySelector("[data-gflow-stat='" + si + "']");
				if (valEl && valEl.textContent !== statValues[si]) {
					valEl.textContent = statValues[si];
				}
			}
		}
	}

	function _ensureHeatCanvas(heatmapWrap) {
		if (_state.heatCanvas && document.body.contains(_state.heatCanvas)) {
			if (heatmapWrap.contains(_state.heatCanvas)) {
				return _state.heatCanvas;
			}
		}

		var existing = heatmapWrap.querySelector("canvas.gflow_canvas");
		if (existing) {
			_state.heatCanvas = existing;
			return existing;
		}

		_state.heatCanvas = document.createElement("canvas");
		_state.heatCanvas.className = "gflow_canvas";
		_state.heatCanvas.style.width = "100%";
		heatmapWrap.appendChild(_state.heatCanvas);
		return _state.heatCanvas;
	}

	function _updateHeatmap(heatmapWrap, latest) {
		if (!heatmapWrap) return;

		var canvas = _ensureHeatCanvas(heatmapWrap);

		var historyToRender = _state.history.length > 0 ? _state.history : _state.lastValidHistory;
		if (!historyToRender || historyToRender.length === 0) return;

		_renderHeatmapInPlace(canvas, historyToRender);
		_updateLayerLabels(heatmapWrap, latest);
	}

	function _updateLayerLabels(heatmapWrap, latest) {
		if (!heatmapWrap || !latest || !latest.layers || latest.layers.length === 0) return;

		var labelOverlay = heatmapWrap.querySelector(".gflow_label_overlay");
		if (!labelOverlay) {
			labelOverlay = document.createElement("div");
			labelOverlay.className = "gflow_label_overlay";
			heatmapWrap.appendChild(labelOverlay);
		}

		var currentLabelCount = labelOverlay.children.length;
		if (currentLabelCount !== latest.layers.length) {
			labelOverlay.innerHTML = "";
			for (var i = 0; i < latest.layers.length; i++) {
				var lbl = document.createElement("span");
				lbl.textContent = latest.layers[i].name;
				labelOverlay.appendChild(lbl);
			}
		}
	}

	function _updateTimeAxis(timeAxisEl) {
		if (!timeAxisEl) return;
		var historyToUse = _state.history.length > 0 ? _state.history : _state.lastValidHistory;
		if (historyToUse && historyToUse.length > 1) {
			_showElement(timeAxisEl);
			var startEl = timeAxisEl.querySelector("[data-gflow='time_start']");
			var endEl = timeAxisEl.querySelector("[data-gflow='time_end']");
			if (startEl) {
				var newStart = new Date(historyToUse[0].timestamp).toLocaleTimeString();
				if (startEl.textContent !== newStart) startEl.textContent = newStart;
			}
			if (endEl) {
				var newEnd = new Date(historyToUse[historyToUse.length - 1].timestamp).toLocaleTimeString();
				if (endEl.textContent !== newEnd) endEl.textContent = newEnd;
			}
		} else {
			_hideElement(timeAxisEl);
		}
	}

	function _updateLayerBars(layerBarsEl, latest) {
		if (!layerBarsEl || !latest || !latest.layers || latest.layers.length === 0) return;

		var layerMaxNorm = 0;
		for (var i = 0; i < latest.layers.length; i++) {
			if (latest.layers[i].gradNorm > layerMaxNorm) layerMaxNorm = latest.layers[i].gradNorm;
		}

		var existingRows = layerBarsEl.querySelectorAll(".gflow_layer_row");

		if (existingRows.length !== latest.layers.length) {
			layerBarsEl.innerHTML = "";
			for (var i = 0; i < latest.layers.length; i++) {
				var layer = latest.layers[i];
				var pct = layerMaxNorm > 0 ? (layer.gradNorm / layerMaxNorm) * 100 : 0;
				var barColor = _viridisColor(pct / 100);

				var row = document.createElement("div");
				row.className = "gflow_layer_row";
				row.innerHTML = "<span class='gflow_layer_name' title='" + layer.name + " (" + layer.type + ")'>" + layer.name + "</span>" +
					"<div class='gflow_layer_bar_outer'><div class='gflow_layer_bar_inner' data-gflow-bar='" + i + "' style='width:" + pct.toFixed(1) + "%;background:" + barColor + ";'></div></div>" +
					"<span class='gflow_layer_val' data-gflow-val='" + i + "'>" + layer.gradNorm.toExponential(2) + "</span>";
				layerBarsEl.appendChild(row);
			}
		} else {
			for (var i = 0; i < latest.layers.length; i++) {
				var layer = latest.layers[i];
				var pct = layerMaxNorm > 0 ? (layer.gradNorm / layerMaxNorm) * 100 : 0;
				var barColor = _viridisColor(pct / 100);

				var barEl = layerBarsEl.querySelector("[data-gflow-bar='" + i + "']");
				var valEl = layerBarsEl.querySelector("[data-gflow-val='" + i + "']");

				if (barEl) {
					barEl.style.width = pct.toFixed(1) + "%";
					barEl.style.backgroundColor = barColor;
				}
				if (valEl) {
					var newText = layer.gradNorm.toExponential(2);
					if (valEl.textContent !== newText) {
						valEl.textContent = newText;
					}
				}
			}
		}
	}

	// ============================================================
	// MASTER DOM UPDATE — ANTI-FLICKER CORE
	// ============================================================

	function _updateDOM(container) {
		if (_state.renderLock) return;
		_state.renderLock = true;

		try {
			_updateDOMInner(container);
		} finally {
			_state.renderLock = false;
		}
	}

	function _updateDOMInner(container) {
		var root = container.querySelector("[data-gflow-root]");
		if (!root) return;

		var hasData = _state.history.length > 0;
		var latest = null;

		if (hasData) {
			latest = _state.history[_state.history.length - 1];
			_state.lastValidRecord = latest;
			_state.hasEverRendered = true;
			_state.lastValidHistory = _state.history.slice();
			_state.contentShownOnce = true;
		} else if (_state.lastValidRecord) {
			// Use last valid data instead of showing empty
			latest = _state.lastValidRecord;
			hasData = true;
		}

		// Grab DOM elements
		var emptyEl = root.querySelector("[data-gflow='empty']");
		var statsEl = root.querySelector("[data-gflow='stats']");
		var heatmapWrap = root.querySelector("[data-gflow='heatmap_wrap']");
		var warningEl = root.querySelector("[data-gflow='warning']");
		var timeAxisEl = root.querySelector("[data-gflow='time_axis']");
		var layerBarsEl = root.querySelector("[data-gflow='layer_bars']");
		var legendEl = root.querySelector("[data-gflow='legend']");
		var metaEl = root.querySelector("[data-gflow='meta']");

		if (!hasData) {
			// CRITICAL: During training, NEVER show empty state
			if (_state.isTraining) {
				return;
			}
			// If we've ever shown content, suppress empty unless massive failure streak
			if (_state.contentShownOnce && _state.consecutiveFailures < _state.maxConsecutiveFailures) {
				return;
			}
			if (Date.now() < _state.suppressEmptyUntil) {
				return;
			}

			if (_state.visibilityState !== "empty") {
				_showElement(emptyEl);
				_hideElement(statsEl);
				_hideElement(heatmapWrap);
				_hideElement(warningEl);
				_hideElement(timeAxisEl);
				_hideElement(layerBarsEl);
				_hideElement(legendEl);
				_state.visibilityState = "empty";
			}
			return;
		}

		// Debounce — but never block the first transition from empty to content
		var now = Date.now();
		if (_state.visibilityState === "content" && now - _state.lastRenderTime < _state.minRenderInterval) {
			if (!_state.pendingRender) {
				_state.pendingRender = setTimeout(function () {
					_state.pendingRender = null;
					if (_state.container && document.body.contains(_state.container)) {
						_updateDOM(_state.container);
					}
				}, _state.minRenderInterval);
			}
			return;
		}

		// Show content sections
		_hideElement(emptyEl);
		_showElement(statsEl);
		_showElement(heatmapWrap);
		_showElement(layerBarsEl);
		_showElement(legendEl);

		// Update each section in-place
		_updateMeta(metaEl);

		var diagnosis = _diagnose(latest);
		_updateWarning(warningEl, diagnosis);
		_updateStatsCards(statsEl, latest, diagnosis);
		_updateHeatmap(heatmapWrap, latest);
		_updateTimeAxis(timeAxisEl);
		_updateLayerBars(layerBarsEl, latest);

		_state.lastRenderTime = now;
		_state.visibilityState = "content";
	}

	// ============================================================
	// RENDER — MAIN ENTRY POINT
	// ============================================================

	function _render(divOrId) {
		var container = _getOrCreateContainer(divOrId);
		if (!container) return null;

		_injectStyles();

		// Attempt gradient computation
		var newRecord = _computeGradients();
		if (newRecord && newRecord.layers && newRecord.layers.length > 0) {
			var currentLayerCount = newRecord.layers.length;
			if (_state.history.length > 0) {
				var lastLayerCount = _state.history[_state.history.length - 1].layers.length;
				if (lastLayerCount !== currentLayerCount) {
					// Layer count changed — save backup before clearing
					_state.lastValidHistory = _state.history.slice();
					_state.lastValidRecord = _state.history[_state.history.length - 1];
					_state.history = [];
					_state.lastLayerCount = currentLayerCount;
				}
			}

			_state.history.push(newRecord);
			if (_state.history.length > _state.maxHistory) {
				_state.history.shift();
			}

			_state.consecutiveFailures = 0;
		}

		// Build or repair skeleton
		if (!_isDomIntact(container)) {
			_buildSkeleton(container);
		}

		// Update DOM in-place
		_updateDOM(container);

		update_translations(); // await not possible here

		return container;
	}

	// ============================================================
	// PUBLIC API
	// ============================================================

	function gradientFlow(divOrId) {
		return _render(divOrId);
	}

	gradientFlow.reset = function () {
		if (_state.pendingRender) {
			clearTimeout(_state.pendingRender);
			_state.pendingRender = null;
		}
		_state.history = [];
		_state.lastValidRecord = null;
		_state.lastValidHistory = [];
		_state.hasEverRendered = false;
		_state.initialized = false;
		_state.heatCanvas = null;
		_state.legendCanvas = null;
		_state.offscreenCanvas = null;
		_state.offscreenCtx = null;
		_state.consecutiveFailures = 0;
		_state.isComputing = false;
		_state.isTraining = false;
		_state.renderLock = false;
		_state.visibilityState = "empty";
		_state.skeletonBuiltOnce = false;
		_state.contentShownOnce = false;
		_state.lastLayerCount = -1;
		if (_state.container) {
			_state.container.innerHTML = "";
		}
	};

	gradientFlow.onTrainingStart = function () {
		_state.isTraining = true;
		_state.isComputing = false;  // CRITICAL: Reset computing lock
		_state.consecutiveFailures = 0;
		_state.suppressEmptyUntil = Date.now() + 30000;
	};

	gradientFlow.onTrainingEnd = function () {
		_state.isTraining = false;
		_state.isComputing = false;  // CRITICAL: Reset computing lock
		_state.consecutiveFailures = 0;
		if (_state.history.length > 0) {
			_state.lastValidRecord = _state.history[_state.history.length - 1];
			_state.lastValidHistory = _state.history.slice();
			_state.hasEverRendered = true;
			_state.contentShownOnce = true;
		}
		if (_state.pendingRender) {
			clearTimeout(_state.pendingRender);
			_state.pendingRender = null;
		}
	};

	gradientFlow.onEpochBoundary = function () {
		_state.isComputing = false;  // CRITICAL: Reset computing lock at epoch boundary
		_state.suppressEmptyUntil = Date.now() + 10000;
	};

	gradientFlow.getHistory = function () {
		return _state.history;
	};

	gradientFlow.getState = function () {
		return _state;
	};

	gradientFlow.snapshot = function (divOrId) {
		return _render(divOrId);
	};

	return gradientFlow;

})();

// Global convenience
if (typeof window !== "undefined") {
	window.gradientFlow = GradientFlowHeatmap;
}

function gradientFlowToSummary() {
	gradientFlow("gradient_flow");
}
