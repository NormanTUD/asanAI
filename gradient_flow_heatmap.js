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
		maxHistory: 60,
		isComputing: false,
		lastRenderTime: 0,
		animationFrame: null,
		initialized: false,  // tracks if DOM skeleton exists
		heatCanvas: null,    // persistent canvas reference
		legendCanvas: null   // persistent legend canvas reference
	};

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
	// BUILD SKELETON (once)
	// ============================================================

	function _buildSkeleton(container) {
		var root = document.createElement("div");
		root.className = "gflow_container gflow_fade_in";
		root.setAttribute("data-gflow-root", "1");

		root.innerHTML = [
			"<div class='gflow_header'>",
			"  <h2>Gradient Flow</h2>",
			"  <span class='gflow_header_meta' data-gflow='meta'></span>",
			"</div>",
			"<p class='gflow_subtitle'>Visualizes the L2 norm of gradients per layer. Bright = strong gradient signal (learning). Dark = weak gradient (stuck). Monitors vanishing/exploding gradient problems in real-time.</p>",
			"<div class='gflow_warning gflow_warning_healthy' data-gflow='warning' style='display:none;'></div>",
			"<div class='gflow_stats_grid' data-gflow='stats'></div>",
			"<div class='gflow_canvas_wrap' data-gflow='heatmap_wrap'></div>",
			"<div class='gflow_time_axis' data-gflow='time_axis' style='display:none;'><span data-gflow='time_start'></span><span>Time →</span><span data-gflow='time_end'></span></div>",
			"<div class='gflow_legend'>",
			"  <span>Low gradient</span>",
			"  <canvas data-gflow='legend_bar' width='120' height='10' class='gflow_legend_bar'></canvas>",
			"  <span>High gradient</span>",
			"  <span style='margin-left:12px;opacity:0.5;'>(log scale)</span>",
			"</div>",
			"<div class='gflow_layer_bars' data-gflow='layer_bars'></div>",
			"<div class='gflow_empty' data-gflow='empty'>Waiting for model and data...<br><small>Load a model and training data, then call this visualization during or after training.</small></div>",
		].join("\n");

		container.innerHTML = "";
		container.appendChild(root);

		// Render legend gradient bar once
		var legendCanvas = root.querySelector("[data-gflow='legend_bar']");
		if (legendCanvas) {
			var lctx = legendCanvas.getContext("2d");
			for (var x = 0; x < 120; x++) {
				lctx.fillStyle = _viridisColor(x / 119);
				lctx.fillRect(x, 0, 1, 10);
			}
			_state.legendCanvas = legendCanvas;
		}

		_state.initialized = true;
	}

	// ============================================================
	// GRADIENT COMPUTATION
	// ============================================================

	function _computeGradients() {
		if (_state.isComputing) return null;
		if (typeof model === "undefined" || !model) return null;
		if (typeof xy_data_global === "undefined" || !xy_data_global || !xy_data_global.x || !xy_data_global.y) return null;

		try {
			model.layers[0].getWeights();
		} catch (e) {
			return null;
		}

		_state.isComputing = true;
		var result = null;

		try {
			result = tf.tidy(function () {
				var xTensor = xy_data_global.x;
				var yTensor = xy_data_global.y;

				if (!xTensor || xTensor.isDisposed || !yTensor || yTensor.isDisposed) return null;

				var numSamples = xTensor.shape[0];
				var maxSamples = Math.min(32, numSamples);
				var xBatch, yBatch;

				if (maxSamples < numSamples) {
					var indices = [];
					var step = numSamples / maxSamples;
					for (var i = 0; i < maxSamples; i++) {
						indices.push(Math.min(Math.floor(i * step), numSamples - 1));
					}
					xBatch = tf.gather(xTensor, indices);
					yBatch = tf.gather(yTensor, indices);
				} else {
					xBatch = xTensor;
					yBatch = yTensor;
				}

				var trainableWeights = [];
				var weightMeta = [];

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

				if (trainableWeights.length === 0) return null;

				var lossFunction = function () {
					var predictions = model.apply(xBatch, { training: true });
					var lossFn = model.loss;
					if (typeof lossFn === "string") {
						lossFn = tf.losses[lossFn] || tf.losses.meanSquaredError;
					} else if (typeof lossFn !== "function") {
						lossFn = tf.losses.meanSquaredError;
					}
					return lossFn(yBatch, predictions).mean();
				};

				var gradsFunction = tf.variableGrads(lossFunction, trainableWeights);
				var grads = gradsFunction.grads;

				var layerGradients = {};

				for (var gi = 0; gi < trainableWeights.length; gi++) {
					var meta = weightMeta[gi];
					var gradTensor = grads[trainableWeights[gi].name];
					if (!gradTensor) continue;

					var gradData = gradTensor.dataSync();
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

					l2Norm = Math.sqrt(l2Norm);
					var meanAbs = gradData.length > 0 ? sum / gradData.length : 0;

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

					layerGradients[key].gradNorm += l2Norm;
					layerGradients[key].gradMax = Math.max(layerGradients[key].gradMax, maxAbs);
					layerGradients[key].gradMin = Math.min(layerGradients[key].gradMin, minAbs);
					layerGradients[key].gradMean += meanAbs;
					layerGradients[key].paramCount += meta.paramCount;
					layerGradients[key].weightCount++;
				}

				if (gradsFunction.value && !gradsFunction.value.isDisposed) {
					gradsFunction.value.dispose();
				}

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

				return {
					timestamp: Date.now(),
					layers: layers
				};
			});
		} catch (e) {
			console.warn("[GradientFlow] Computation error:", e);
			result = null;
		}

		_state.isComputing = false;
		return result;
	}

	// ============================================================
	// HEATMAP CANVAS RENDERING (in-place)
	// ============================================================

	function _renderHeatmapInPlace(canvas, history) {
		if (history.length === 0) return;

		var numLayers = history[0].layers.length;
		var numSteps = history.length;

		var width = Math.max(300, Math.min(800, numSteps * 12));
		var height = Math.max(60, numLayers * 20);

		if (canvas.width !== width || canvas.height !== height) {
			canvas.width = width;
			canvas.height = height;
			canvas.style.height = height + "px";
		}

		var ctx = canvas.getContext("2d");
		ctx.clearRect(0, 0, width, height);

		var cellW = width / numSteps;
		var cellH = height / numLayers;

		var allNorms = [];
		for (var t = 0; t < numSteps; t++) {
			for (var l = 0; l < history[t].layers.length; l++) {
				var norm = history[t].layers[l].gradNorm;
				if (norm > 0 && isFinite(norm)) allNorms.push(norm);
			}
		}

		if (allNorms.length === 0) return;

		allNorms.sort(function (a, b) { return a - b; });
		var logMin = Math.log10(Math.max(allNorms[0], 1e-12));
		var logMax = Math.log10(allNorms[allNorms.length - 1] || 1);
		var logRange = logMax - logMin || 1;

		for (var t = 0; t < numSteps; t++) {
			for (var l = 0; l < history[t].layers.length; l++) {
				var norm = history[t].layers[l].gradNorm;
				var logNorm = Math.log10(Math.max(norm, 1e-12));
				var normalized = (logNorm - logMin) / logRange;
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
	}

	// Viridis-inspired colormap
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

		var maxNorm = Math.max.apply(null, norms);
		var minNorm = Math.min.apply(null, norms.filter(function (n) { return n > 0; }));

		var ratio = (minNorm > 0 && maxNorm > 0) ? maxNorm / minNorm : 1;

		var status = "healthy";
		var message = "";

		if (maxNorm > 1e4) {
			status = "exploding";
			message = "Gradient magnitudes are extremely large (max: " + maxNorm.toExponential(2) + "). Consider reducing learning rate or adding gradient clipping.";
		} else if (minNorm < 1e-8 && maxNorm > 1e-2) {
			status = "vanishing";
			message = "Some layers have near-zero gradients (min: " + minNorm.toExponential(2) + "). Consider using residual connections, batch normalization, or different activation functions.";
		} else if (ratio > 1e4) {
			status = "vanishing";
			message = "Gradient ratio across layers is " + ratio.toExponential(1) + "×. Early layers may not be learning effectively.";
		} else {
			message = "Gradient flow looks healthy. All layers are receiving meaningful gradient signal.";
		}

		return { status: status, message: message, ratio: ratio, maxNorm: maxNorm, minNorm: minNorm };
	}

	// ============================================================
	// UPDATE DOM IN-PLACE (no flicker)
	// ============================================================

	function _updateDOM(container) {
		var root = container.querySelector("[data-gflow-root]");
		if (!root) return;

		var hasData = _state.history.length > 0;
		var latest = hasData ? _state.history[_state.history.length - 1] : null;

		// Toggle empty state vs content visibility
		var emptyEl = root.querySelector("[data-gflow='empty']");
		var statsEl = root.querySelector("[data-gflow='stats']");
		var heatmapWrap = root.querySelector("[data-gflow='heatmap_wrap']");
		var warningEl = root.querySelector("[data-gflow='warning']");
		var timeAxisEl = root.querySelector("[data-gflow='time_axis']");
		var layerBarsEl = root.querySelector("[data-gflow='layer_bars']");
		var metaEl = root.querySelector("[data-gflow='meta']");

		if (!hasData) {
			emptyEl.style.display = "";
			statsEl.style.display = "none";
			heatmapWrap.style.display = "none";
			warningEl.style.display = "none";
			timeAxisEl.style.display = "none";
			layerBarsEl.style.display = "none";
			return;
		}

		// Hide empty, show content
		emptyEl.style.display = "none";
		statsEl.style.display = "";
		heatmapWrap.style.display = "";
		layerBarsEl.style.display = "";

		// Update meta
		if (metaEl) {
			metaEl.textContent = _state.history.length + " snapshots · " + new Date().toLocaleTimeString();
		}

		// Update warning
		var diagnosis = _diagnose(latest);
		if (diagnosis && warningEl) {
			warningEl.style.display = "";
			warningEl.className = "gflow_warning " + (
				diagnosis.status === "exploding" ? "gflow_warning_exploding" :
				diagnosis.status === "vanishing" ? "gflow_warning_vanishing" : "gflow_warning_healthy"
			);
			var icon = diagnosis.status === "exploding" ? "🔥" :
				diagnosis.status === "vanishing" ? "❄️" : "✅";
			warningEl.textContent = icon + " " + diagnosis.message;
		}

		// Update stats cards (in-place text updates)
		if (latest.layers.length > 0 && statsEl) {
			var norms = latest.layers.map(function (l) { return l.gradNorm; });
			var maxN = Math.max.apply(null, norms);
			var minN = Math.min.apply(null, norms.filter(function (n) { return n > 0; }).concat([0]));
			var avgN = norms.reduce(function (a, b) { return a + b; }, 0) / norms.length;

			var statValues = [
				maxN.toExponential(3),
				minN.toExponential(3),
				avgN.toExponential(3),
				diagnosis ? diagnosis.ratio.toExponential(2) + "×" : "N/A"
			];
			var statLabels = ["Max Gradient Norm", "Min Gradient Norm", "Mean Gradient Norm", "Layer Ratio (max/min)"];

			var existingCards = statsEl.querySelectorAll(".gflow_stat_card");
			if (existingCards.length !== 4) {
				// Build cards once
				statsEl.innerHTML = "";
				for (var si = 0; si < 4; si++) {
					var card = document.createElement("div");
					card.className = "gflow_stat_card";
					card.innerHTML = "<div class='gflow_stat_label'>" + statLabels[si] + "</div><div class='gflow_stat_value' data-gflow-stat='" + si + "'>" + statValues[si] + "</div>";
					statsEl.appendChild(card);
				}
			} else {
				// Update values only
				for (var si = 0; si < 4; si++) {
					var valEl = statsEl.querySelector("[data-gflow-stat='" + si + "']");
					if (valEl) valEl.textContent = statValues[si];
				}
			}
		}

		// Update heatmap canvas (in-place redraw)
		if (heatmapWrap) {
			if (!_state.heatCanvas) {
				_state.heatCanvas = document.createElement("canvas");
				_state.heatCanvas.className = "gflow_canvas";
				_state.heatCanvas.style.width = "100%";
				heatmapWrap.appendChild(_state.heatCanvas);
			}
			_renderHeatmapInPlace(_state.heatCanvas, _state.history);

			// Update layer labels overlay
			var labelOverlay = heatmapWrap.querySelector(".gflow_label_overlay");
			if (!labelOverlay) {
				labelOverlay = document.createElement("div");
				labelOverlay.className = "gflow_label_overlay";
				heatmapWrap.appendChild(labelOverlay);
			}

			// Only rebuild labels if layer count changed
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

		// Update time axis
		if (_state.history.length > 1 && timeAxisEl) {
			timeAxisEl.style.display = "";
			var startEl = timeAxisEl.querySelector("[data-gflow='time_start']");
			var endEl = timeAxisEl.querySelector("[data-gflow='time_end']");
			if (startEl) startEl.textContent = new Date(_state.history[0].timestamp).toLocaleTimeString();
			if (endEl) endEl.textContent = new Date(_state.history[_state.history.length - 1].timestamp).toLocaleTimeString();
		} else if (timeAxisEl) {
			timeAxisEl.style.display = "none";
		}

		// Update per-layer bar chart (in-place)
		if (layerBarsEl && latest.layers.length > 0) {
			var layerMaxNorm = 0;
			for (var i = 0; i < latest.layers.length; i++) {
				if (latest.layers[i].gradNorm > layerMaxNorm) layerMaxNorm = latest.layers[i].gradNorm;
			}

			var existingRows = layerBarsEl.querySelectorAll(".gflow_layer_row");

			if (existingRows.length !== latest.layers.length) {
				// Rebuild layer rows (only when layer count changes)
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
				// Update bar widths and values in-place (smooth CSS transition handles animation)
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
						valEl.textContent = layer.gradNorm.toExponential(2);
					}
				}
			}
		}

		_state.lastRenderTime = Date.now();
	}

	// ============================================================
	// RENDER (main entry, builds skeleton once then updates in-place)
	// ============================================================

	function _render(divOrId) {
		var container = _getOrCreateContainer(divOrId);
		_injectStyles();

		// Compute new gradients
		var newRecord = _computeGradients();
		if (newRecord && newRecord.layers && newRecord.layers.length > 0) {
			_state.history.push(newRecord);
			if (_state.history.length > _state.maxHistory) {
				_state.history.shift();
			}
		}

		// Build skeleton once, then always update in-place
		if (!_state.initialized || !container.querySelector("[data-gflow-root]")) {
			_buildSkeleton(container);
		}

		// Update all DOM elements in-place (no innerHTML replacement)
		_updateDOM(container);

		return container;
	}

	function _statCard(label, value) {
		return "<div class='gflow_stat_card'><div class='gflow_stat_label'>" + label + "</div><div class='gflow_stat_value'>" + value + "</div></div>";
	}

	// ============================================================
	// PUBLIC API
	// ============================================================

	/**
	 * Main entry point. Call this to render/update the gradient flow heatmap.
	 * @param {string|HTMLElement|undefined} divOrId - Optional container div or ID.
	 *   If omitted, creates/reuses a singleton container.
	 */
	function gradientFlow(divOrId) {
		return _render(divOrId);
	}

	gradientFlow.reset = function () {
		_state.history = [];
		_state.initialized = false;
		_state.heatCanvas = null;
		_state.legendCanvas = null;
		if (_state.container) {
			_state.container.innerHTML = "";
		}
	};

	gradientFlow.getHistory = function () {
		return _state.history;
	};

	gradientFlow.getState = function () {
		return _state;
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
