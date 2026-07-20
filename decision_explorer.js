"use strict";

// ============================================================
// DECISION EXPLORER - Layer-by-layer decision tracing
// Traces a single input through the network, showing how each
// layer transforms the representation and which neurons matter.
// ============================================================

var DecisionExplorer = (function () {

	var _SINGLETON_ID = "decision_explorer_singleton";

	var _state = {
		container: null,
		currentSample: 0,
		mode: "beginner",
		cachedData: null,
		isComputing: false,
		autoPlayTimer: null,
		expandedLayer: null,
		generation: 0,
		retryCount: 0
	};

	var _COLORS = [
		"#3498db", "#e74c3c", "#2ecc71", "#f39c12", "#9b59b6",
		"#1abc9c", "#e67e22", "#34495e", "#16a085", "#c0392b"
	];

	// ============================================================
	// TRANSLATION HELPER
	// ============================================================

	function _t(key, fallback) {
		if (typeof language !== "undefined" && typeof lang !== "undefined" && language[lang] && language[lang][key]) {
			return language[lang][key];
		}
		return fallback || key;
	}

	function _triggerTranslations() {
		try { update_translations(); } catch (e) {}
	}

	// ============================================================
	// STYLES
	// ============================================================

	function _injectStyles() {
		if (document.getElementById("decision_explorer_styles")) return;
		var s = document.createElement("style");
		s.id = "decision_explorer_styles";
		s.textContent = [
			".dex_container { padding: 16px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }",
			".dex_header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; flex-wrap: wrap; gap: 8px; }",
			".dex_header h2 { margin: 0; font-size: 1.3em; font-weight: 700; }",
			".dex_controls { display: flex; gap: 6px; align-items: center; flex-wrap: wrap; }",
			".dex_btn { padding: 5px 12px; border: 1px solid rgba(128,128,128,0.25); border-radius: 6px; background: rgba(128,128,128,0.06); color: inherit; cursor: pointer; font-size: 0.82em; transition: all 0.2s; }",
			".dex_btn:hover { background: rgba(128,128,128,0.15); }",
			".dex_btn_active { background: rgba(52,152,219,0.2); border-color: rgba(52,152,219,0.5); color: #3498db; }",
			".dex_mode_toggle { display: inline-flex; border: 1px solid rgba(128,128,128,0.25); border-radius: 6px; overflow: hidden; }",
			".dex_mode_toggle button { padding: 4px 10px; border: none; background: transparent; color: inherit; cursor: pointer; font-size: 0.78em; transition: all 0.2s; }",
			".dex_mode_toggle button.dex_active { background: rgba(52,152,219,0.25); color: #3498db; font-weight: 600; }",
			".dex_subtitle { opacity: 0.55; margin: 0 0 14px 0; font-size: 0.82em; line-height: 1.5; }",
			".dex_sample_nav { display: flex; align-items: center; gap: 8px; margin-bottom: 14px; padding: 8px 12px; border-radius: 8px; border: 1px solid rgba(128,128,128,0.12); background: rgba(128,128,128,0.03); }",
			".dex_sample_nav label { font-size: 0.82em; opacity: 0.7; }",
			".dex_sample_nav select { padding: 4px 8px; border-radius: 4px; border: 1px solid rgba(128,128,128,0.25); background: transparent; color: inherit; font-size: 0.82em; }",
			".dex_prediction_box { display: flex; gap: 16px; align-items: center; padding: 10px 14px; border-radius: 8px; margin-bottom: 14px; border: 1px solid rgba(128,128,128,0.12); background: rgba(128,128,128,0.03); flex-wrap: wrap; }",
			".dex_pred_item { text-align: center; }",
			".dex_pred_item .dex_pred_label { font-size: 0.7em; opacity: 0.5; text-transform: uppercase; letter-spacing: 0.3px; margin-bottom: 2px; }",
			".dex_pred_item .dex_pred_value { font-size: 1.05em; font-weight: 600; }",
			".dex_pred_correct { color: #2ecc71; }",
			".dex_pred_wrong { color: #e74c3c; }",
			".dex_section { margin-bottom: 18px; }",
			".dex_section_title { font-size: 0.95em; font-weight: 600; margin-bottom: 6px; display: flex; align-items: center; gap: 6px; }",
			".dex_section_explain { font-size: 0.8em; opacity: 0.6; margin-bottom: 10px; line-height: 1.5; }",
			".dex_flow_wrap { position: relative; overflow-x: auto; padding: 10px 0; }",
			".dex_flow_svg { display: block; width: 100%; height: auto; }",
			".dex_flow_node { cursor: pointer; transition: opacity 0.2s; }",
			".dex_flow_node:hover { opacity: 0.85; }",
			".dex_layer_card { border: 1px solid rgba(128,128,128,0.12); border-radius: 8px; margin-bottom: 10px; overflow: hidden; transition: border-color 0.3s; }",
			".dex_layer_card_expanded { border-color: rgba(52,152,219,0.4); }",
			".dex_layer_header { display: flex; justify-content: space-between; align-items: center; padding: 8px 12px; cursor: pointer; background: rgba(128,128,128,0.03); transition: background 0.2s; }",
			".dex_layer_header:hover { background: rgba(128,128,128,0.08); }",
			".dex_layer_name { font-size: 0.85em; font-weight: 600; }",
			".dex_layer_type { font-size: 0.72em; opacity: 0.5; margin-left: 6px; }",
			".dex_layer_summary { font-size: 0.75em; opacity: 0.6; }",
			".dex_layer_body { padding: 10px 12px; display: none; }",
			".dex_layer_body_open { display: block; }",
			".dex_neuron_row { display: flex; align-items: center; gap: 6px; margin-bottom: 3px; font-size: 0.78em; }",
			".dex_neuron_name { min-width: 70px; max-width: 100px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; opacity: 0.7; }",
			".dex_neuron_bar_outer { flex: 1; height: 12px; background: rgba(128,128,128,0.08); border-radius: 3px; overflow: hidden; position: relative; }",
			".dex_neuron_bar_inner { height: 100%; border-radius: 3px; transition: width 0.4s ease; min-width: 1px; }",
			".dex_neuron_val { min-width: 55px; text-align: right; font-family: 'SF Mono', 'Fira Code', monospace; font-size: 0.85em; opacity: 0.7; }",
			".dex_neuron_contrib { min-width: 60px; text-align: right; font-size: 0.78em; }",
			".dex_contrib_pos { color: #2ecc71; }",
			".dex_contrib_neg { color: #e74c3c; }",
			".dex_contrib_none { opacity: 0.3; }",
			".dex_attribution_wrap { margin-bottom: 14px; }",
			".dex_attribution_grid { display: grid; gap: 2px; margin: 0 auto; }",
			".dex_attr_pixel { width: 100%; aspect-ratio: 1; border-radius: 1px; transition: background 0.3s; }",
			".dex_attr_legend { display: flex; align-items: center; gap: 6px; font-size: 0.72em; opacity: 0.6; margin-top: 6px; justify-content: center; }",
			".dex_attr_legend_bar { width: 80px; height: 8px; border-radius: 3px; }",
			".dex_explanation { padding: 12px 14px; border-radius: 8px; border: 1px solid rgba(128,128,128,0.12); background: rgba(128,128,128,0.03); font-size: 0.85em; line-height: 1.65; }",
			".dex_explanation strong { color: #3498db; }",
			".dex_empty { padding: 40px; text-align: center; opacity: 0.5; font-size: 1em; }",
			".dex_info_badge { display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 0.72em; font-weight: 600; margin-left: 4px; }",
			".dex_info_badge_green { background: rgba(46,204,113,0.15); color: #2ecc71; }",
			".dex_info_badge_red { background: rgba(231,76,60,0.15); color: #e74c3c; }",
			".dex_flow_connection { transition: opacity 0.3s; }",
			"@keyframes dex_fadein { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: translateY(0); } }",
			".dex_fade_in { animation: dex_fadein 0.3s ease-out; }",
			".dex_tensor_bar { display: inline-block; height: 14px; margin-right: 2px; border-radius: 2px; vertical-align: middle; transition: width 0.3s; }",
			".dex_summary_row { display: flex; gap: 10px; flex-wrap: wrap; margin-bottom: 14px; }",
			".dex_summary_card { flex: 1; min-width: 140px; padding: 10px 12px; border-radius: 8px; border: 1px solid rgba(128,128,128,0.12); background: rgba(128,128,128,0.03); text-align: center; }",
			".dex_summary_card .dex_sum_val { font-size: 1.4em; font-weight: 700; }",
			".dex_summary_card .dex_sum_label { font-size: 0.7em; opacity: 0.5; margin-top: 2px; text-transform: uppercase; letter-spacing: 0.3px; }",
		].join("\n");
		document.head.appendChild(s);
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
		var c = document.createElement("div");
		c.id = _SINGLETON_ID;
		document.body.appendChild(c);
		_state.container = c;
		return c;
	}

	// ============================================================
	// DATA COLLECTION
	// ============================================================

	function _checkModel() {
		try {
			if (typeof model === "undefined" || !model) return false;
			if (!model.layers || !model.layers.length) return false;
			model.layers[0].getWeights();
			return true;
		} catch (e) {
			return false;
		}
	}

	function _isAliveTensor(x) {
		try {
			if (!x) return false;
			if (typeof x.dataSync !== "function") return false;
			if (x.isDisposed === true) return false;
			x.dataSync();
			return true;
		} catch (e) {
			return false;
		}
	}

	function _getDataX() {
		try {
			if (typeof xy_data_global === "undefined" || !xy_data_global) return null;
			return xy_data_global.x || null;
		} catch (e) { return null; }
	}

	function _getDataY() {
		try {
			if (typeof xy_data_global === "undefined" || !xy_data_global) return null;
			return xy_data_global.y || null;
		} catch (e) { return null; }
	}

	function _checkData() {
		try {
			var x = _getDataX();
			if (!x) return false;
			if (_isAliveTensor(x)) return true;
			if (Array.isArray(x) && x.length > 0) return true;
			return false;
		} catch (e) {
			return false;
		}
	}

	function _checkReady() {
		return _checkModel() && _checkData();
	}

	function _getNumSamples() {
		try {
			var x = xy_data_global.x;
			if (!x) return 0;
			if (_isAliveTensor(x)) return x.shape[0];
			if (Array.isArray(x)) return x.length;
			return 0;
		} catch (e) { return 0; }
	}

	function _ensureXTensor() {
		var xRaw = xy_data_global.x;
		if (_isAliveTensor(xRaw)) return { tensor: xRaw, needsDispose: false };
		if (Array.isArray(xRaw) && xRaw.length > 0) {
			return { tensor: tf.tensor(xRaw), needsDispose: true };
		}
		return null;
	}

	function _ensureYTensor() {
		var yRaw = xy_data_global.y;
		if (yRaw && _isAliveTensor(yRaw)) return yRaw;
		return null;
	}

	function _collectDecisionData(sampleIdx, callback) {
		if (_state.isComputing) return;

		try {
			if (!_checkReady()) {
				callback(null, _checkModel() ? "dex_no_data" : "dex_no_model");
				return;
			}
		} catch (e) {
			callback(null, "dex_error");
			return;
		}

		var numSamples = _getNumSamples();
		if (numSamples === 0) { callback(null, "dex_no_data"); return; }
		sampleIdx = Math.max(0, Math.min(sampleIdx, numSamples - 1));

		_state.isComputing = true;

		try {
			var xInfo = _ensureXTensor();
			if (!xInfo) { _state.isComputing = false; callback(null, "dex_no_data"); return; }
			var xTensor = xInfo.tensor;
			var yTensor = _ensureYTensor();

			var layerInfos = [];
			var layerOutputs = [];

			for (var i = 0; i < model.layers.length; i++) {
				var layer = model.layers[i];
				if (layer.getClassName && layer.getClassName() === "InputLayer") continue;
				layerInfos.push({
					name: layer.name || ("layer_" + i),
					type: layer.getClassName ? layer.getClassName() : "unknown",
					index: i
				});
				layerOutputs.push(layer.output);
			}

			if (layerOutputs.length === 0) {
				_state.isComputing = false;
				callback(null, "dex_no_model");
				return;
			}

			var multiModel = tf.model({ inputs: model.input, outputs: layerOutputs });

			var singleInput = tf.tidy(function () {
				return tf.gather(xTensor, [sampleIdx]);
			});

			var allOutputs = multiModel.predict(singleInput);
			if (!Array.isArray(allOutputs)) allOutputs = [allOutputs];

			var layers = [];
			for (var l = 0; l < allOutputs.length; l++) {
				var out = allOutputs[l];
				var shape = out.shape.slice(1);
				var flatSize = out.size;
				var flatArr = out.dataSync();
				var absSum = 0;
				var maxVal = -Infinity;
				var minVal = Infinity;
				var nonZero = 0;
				for (var k = 0; k < flatArr.length; k++) {
					var v = flatArr[k];
					absSum += Math.abs(v);
					if (v > maxVal) maxVal = v;
					if (v < minVal) minVal = v;
					if (Math.abs(v) > 1e-8) nonZero++;
				}

				var perNeuron = [];
				if (shape.length >= 2) {
					var lastDim = shape[shape.length - 1];
					var numElements = flatArr.length / lastDim;
					for (var n = 0; n < lastDim; n++) {
						var nSum = 0;
						var nAbs = 0;
						var nMax = -Infinity;
						for (var e = 0; e < numElements; e++) {
							var val = flatArr[e * lastDim + n];
							nSum += val;
							nAbs += Math.abs(val);
							if (val > nMax) nMax = val;
						}
						perNeuron.push({ index: n, sum: nSum, absSum: nAbs, max: nMax, mean: nSum / numElements });
					}
				} else {
					for (var n = 0; n < flatArr.length; n++) {
						perNeuron.push({ index: n, sum: flatArr[n], absSum: Math.abs(flatArr[n]), max: flatArr[n], mean: flatArr[n] });
					}
				}

				perNeuron.sort(function (a, b) { return b.absSum - a.absSum; });

				layers.push({
					name: layerInfos[l].name,
					type: layerInfos[l].type,
					index: layerInfos[l].index,
					shape: shape,
					flatArr: Array.from(flatArr),
					flatSize: flatSize,
					absSum: absSum,
					maxVal: maxVal,
					minVal: minVal,
					nonZero: nonZero,
					zeroFraction: 1 - (nonZero / flatArr.length),
					perNeuron: perNeuron.slice(0, 30)
				});
			}

			for (var l = 0; l < allOutputs.length; l++) {
				allOutputs[l].dispose();
			}
			singleInput.dispose();
			multiModel = null;

			var prediction = model.predict(tf.tidy(function () {
				return tf.gather(xTensor, [sampleIdx]);
			}));
			var predData = prediction.dataSync();
			prediction.dispose();

			var predArr = Array.from(predData);
			var predClass = 0;
			var predMax = -Infinity;
			for (var c = 0; c < predArr.length; c++) {
				if (predArr[c] > predMax) { predMax = predArr[c]; predClass = c; }
			}

			var trueClass = -1;
			if (yTensor) {
				try {
					var ySingle = tf.tidy(function () { return tf.gather(yTensor, [sampleIdx]); });
					var yData = ySingle.dataSync();
					ySingle.dispose();
					if (yData.length > 1) {
						var yMax = -Infinity;
						for (var c = 0; c < yData.length; c++) {
							if (yData[c] > yMax) { yMax = yData[c]; trueClass = c; }
						}
					} else {
						trueClass = Math.round(yData[0]);
					}
				} catch (e) {}
			}

			var attr = _computeAttribution(xTensor, sampleIdx, predClass, 20);

			var inputShape = xTensor.shape.slice(1);

			var result = {
				sampleIdx: sampleIdx,
				layers: layers,
				prediction: predArr,
				predClass: predClass,
				predConfidence: predMax,
				trueClass: trueClass,
				inputShape: inputShape,
				attribution: attr,
				numSamples: numSamples,
				totalLayers: layers.length,
				totalParams: _countParams(),
				generation: ++_state.generation
			};

			_state.isComputing = false;
			if (xInfo.needsDispose) try { xTensor.dispose(); } catch (e) {}
			callback(result, null);

		} catch (e) {
			_state.isComputing = false;
			if (xInfo && xInfo.needsDispose && xTensor) try { xTensor.dispose(); } catch (e2) {}
			console.error("[DecisionExplorer]", e);
			callback(null, "dex_error");
		}
	}

	function _countParams() {
		var total = 0;
		try {
			for (var i = 0; i < model.layers.length; i++) {
				var ws = model.layers[i].getWeights();
				for (var w = 0; w < ws.length; w++) {
					total += ws[w].size;
				}
			}
		} catch (e) {}
		return total;
	}

	// ============================================================
	// INTEGRATED GRADIENTS ATTRIBUTION
	// ============================================================

	function _computeAttribution(xTensor, sampleIdx, targetClass, steps) {
		try {
			var inputShape = xTensor.shape.slice(1);
			var flatSize = 1;
			for (var d = 0; d < inputShape.length; d++) flatSize *= inputShape[d];
			if (flatSize > 50000) {
				return _computeSimpleAttribution(xTensor, sampleIdx, targetClass);
			}

			var singleSample = tf.tidy(function () {
				return tf.gather(xTensor, [sampleIdx]);
			});

			var baseline = tf.zerosLike(singleSample);
			var attrAccum = new Float32Array(flatSize);

			for (var s = 0; s <= steps; s++) {
				var alpha = s / steps;
				var interpolated = tf.tidy(function () {
					return baseline.mul(1 - alpha).add(singleSample.mul(alpha));
				});

				var gradFunc = tf.grad(function (inp) {
					var pred = model.predict(inp);
					return pred.slice([0, targetClass], [1, 1]).squeeze();
				});

				var grads = gradFunc(interpolated);
				var gradData = grads.dataSync();
				interpolated.dispose();
				grads.dispose();

				for (var k = 0; k < flatSize; k++) {
					attrAccum[k] += gradData[k] / (steps + 1);
				}
			}

			baseline.dispose();
			var inputData = singleSample.dataSync();
			var result = new Float32Array(flatSize);
			for (var k = 0; k < flatSize; k++) {
				result[k] = attrAccum[k] * (inputData[k] || 0);
			}
			singleSample.dispose();

			return { values: result, shape: inputShape };
		} catch (e) {
			return _computeSimpleAttribution(xTensor, sampleIdx, targetClass);
		}
	}

	function _computeSimpleAttribution(xTensor, sampleIdx, targetClass) {
		try {
			var singleSample = tf.tidy(function () { return tf.gather(xTensor, [sampleIdx]); });
			var eps = 0.01;
			var inputShape = xTensor.shape.slice(1);
			var flatSize = 1;
			for (var d = 0; d < inputShape.length; d++) flatSize *= inputShape[d];
			if (flatSize > 10000) {
				singleSample.dispose();
				return null;
			}

			var basePred = model.predict(singleSample).dataSync();
			var baseVal = basePred[targetClass] || 0;
			var result = new Float32Array(flatSize);
			var inputData = singleSample.dataSync();

			for (var k = 0; k < flatSize; k++) {
				var perturbed = tf.tidy(function () {
					var flat = singleSample.reshape([1, flatSize]);
					var mask = tf.zeros([1, flatSize]);
					var perturbedFlat = flat.add(mask.scatter([0, k], tf.tensor1d([eps]), flatSize));
					return perturbedFlat.reshape([1].concat(inputShape));
				});
				var newPred = model.predict(perturbed).dataSync();
				result[k] = (newPred[targetClass] - baseVal) * inputData[k] / eps;
				perturbed.dispose();
			}

			singleSample.dispose();
			return { values: result, shape: inputShape };
		} catch (e) {
			return null;
		}
	}

	// ============================================================
	// SVG FLOW DIAGRAM
	// ============================================================

	function _renderFlowDiagram(data) {
		if (!data || !data.layers || data.layers.length === 0) return "";

		var W = 700, H = 50 + data.layers.length * 70;
		var margin = { left: 80, right: 30, top: 25, bottom: 20 };
		var usableW = W - margin.left - margin.right;

		var svg = "<svg class='dex_flow_svg' viewBox='0 0 " + W + " " + H + "'>";
		svg += "<defs>";
		for (var i = 0; i < _COLORS.length; i++) {
			svg += "<linearGradient id='dexGrad" + i + "' x1='0%' y1='0%' x2='0%' y2='100%'>";
			svg += "<stop offset='0%' stop-color='" + _COLORS[i] + "' stop-opacity='0.6'/>";
			svg += "<stop offset='100%' stop-color='" + _COLORS[i] + "' stop-opacity='0.15'/>";
			svg += "</linearGradient>";
		}
		svg += "</defs>";

		var nodes = [];

		var inputNode = { y: margin.top + 20, label: _t("dex_input", "Input"), shape: data.inputShape, activation: null };
		nodes.push(inputNode);

		for (var i = 0; i < data.layers.length; i++) {
			var ly = margin.top + 20 + (i + 1) * (H - margin.top - margin.bottom - 40) / data.layers.length;
			var layer = data.layers[i];
			var maxAct = 0;
			if (layer.perNeuron.length > 0) maxAct = layer.perNeuron[0].absSum;
			nodes.push({
				y: ly,
				label: layer.name,
				type: layer.type,
				shape: layer.shape,
				activation: layer.absSum,
				nonZero: layer.nonZero,
				flatSize: layer.flatSize,
				colorIdx: i % _COLORS.length,
				layerIdx: i
			});
		}

		var maxActAcross = 1;
		for (var i = 0; i < nodes.length; i++) {
			if (nodes[i].activation && nodes[i].activation > maxActAcross) maxActAcross = nodes[i].activation;
		}

		for (var i = 0; i < nodes.length - 1; i++) {
			var from = nodes[i];
			var to = nodes[i + 1];
			var fromAct = from.activation || 10;
			var toAct = to.activation || 10;
			var thickness = Math.max(2, Math.min(20, (toAct / maxActAcross) * 20));
			var fromColor = _COLORS[(i) % _COLORS.length];
			var toColor = _COLORS[(i + 1) % _COLORS.length];

			var cx = margin.left + usableW / 2;
			var y1 = from.y + 12;
			var y2 = to.y - 12;

			svg += "<path class='dex_flow_connection' d='M" + (cx - thickness / 2) + "," + y1;
			svg += " C" + (cx - thickness) + "," + ((y1 + y2) / 2);
			svg += " " + (cx + thickness) + "," + ((y1 + y2) / 2);
			svg += " " + (cx + thickness / 2) + "," + y2 + "'";
			svg += " fill='" + toColor + "' opacity='0.18' stroke='" + toColor + "' stroke-width='0.5' stroke-opacity='0.3'/>";
			svg += "<path class='dex_flow_connection' d='M" + (cx + thickness / 2) + "," + y1;
			svg += " C" + (cx + thickness * 1.5) + "," + ((y1 + y2) / 2);
			svg += " " + (cx - thickness * 1.5) + "," + ((y1 + y2) / 2);
			svg += " " + (cx - thickness / 2) + "," + y2 + "'";
			svg += " fill='" + toColor + "' opacity='0.08'/>";
		}

		for (var i = 0; i < nodes.length; i++) {
			var n = nodes[i];
			var cx = margin.left + usableW / 2;
			var barW = 40;
			var color = n.colorIdx !== undefined ? _COLORS[n.colorIdx % _COLORS.length] : "#888";

			svg += "<g class='dex_flow_node' onclick='DecisionExplorer.toggleLayer(" + (n.layerIdx !== undefined ? n.layerIdx : -1) + ")'>";
			svg += "<rect x='" + (cx - barW / 2) + "' y='" + (n.y - 10) + "' width='" + barW + "' height='20' rx='4' fill='" + color + "' opacity='0.25' stroke='" + color + "' stroke-width='1' stroke-opacity='0.4'/>";

			if (n.activation !== null && maxActAcross > 0) {
				var fillW = Math.max(2, (n.activation / maxActAcross) * barW);
				svg += "<rect x='" + (cx - barW / 2) + "' y='" + (n.y - 10) + "' width='" + fillW + "' height='20' rx='4' fill='" + color + "' opacity='0.6'/>";
			}

			svg += "<text x='" + (cx + barW / 2 + 8) + "' y='" + (n.y + 4) + "' font-size='10' fill='currentColor' font-weight='600'>" + _escapeHtml(n.label) + "</text>";

			if (n.shape) {
				svg += "<text x='" + (cx - barW / 2 - 8) + "' y='" + (n.y + 4) + "' text-anchor='end' font-size='8' fill='currentColor' opacity='0.45'>[" + n.shape.join(",") + "]</text>";
			}

			if (n.activation !== null) {
				svg += "<text x='" + (cx + barW / 2 + 8) + "' y='" + (n.y + 16) + "' font-size='8' fill='currentColor' opacity='0.4'>" + _t("dex_sum", "Σ|a|") + "=" + _fmtNum(n.activation) + "</text>";
			}

			if (n.type) {
				svg += "<text x='" + (cx + barW / 2 + 8) + "' y='" + (n.y - 6) + "' font-size='7' fill='" + color + "' opacity='0.6'>" + _escapeHtml(n.type) + "</text>";
			}

			svg += "</g>";
		}

		svg += "</svg>";
		return svg;
	}

	// ============================================================
	// NEURON CONTRIBUTIONS
	// ============================================================

	function _renderNeuronContributions(data, mode) {
		if (!data || !data.layers || data.layers.length === 0) return "";

		var html = "";
		var showLayers = data.layers.length > 12 ? [0, 1, Math.floor(data.layers.length / 3), Math.floor(data.layers.length / 2), Math.floor(data.layers.length * 2 / 3), data.layers.length - 1] : null;

		for (var i = 0; i < data.layers.length; i++) {
			var layer = data.layers[i];
			if (layer.perNeuron.length === 0) continue;

			var isExpanded = _state.expandedLayer === i;
			var showByDefault = showLayers === null || showLayers.indexOf(i) >= 0;

			html += "<div class='dex_layer_card" + (isExpanded ? " dex_layer_card_expanded" : "") + "'>";
			html += "<div class='dex_layer_header' onclick='DecisionExplorer.toggleLayer(" + i + ")'>";
			html += "<div><span class='dex_layer_name'>" + _escapeHtml(layer.name) + "</span>";
			html += "<span class='dex_layer_type'>" + _escapeHtml(layer.type) + "</span></div>";

			var shapeStr = layer.shape ? "[" + layer.shape.join(",") + "]" : "";
			var nnz = layer.flatSize - Math.round(layer.zeroFraction * layer.flatSize);
			html += "<span class='dex_layer_summary'>" + shapeStr + " &middot; " + nnz + "/" + layer.flatSize + " active</span>";
			html += "</div>";

			if (isExpanded || showByDefault) {
				html += "<div class='dex_layer_body" + (isExpanded ? " dex_layer_body_open" : "") + "'>";
				html += _renderNeuronBars(layer, mode);
				html += "</div>";
			}
			html += "</div>";
		}
		return html;
	}

	function _renderNeuronBars(layer, mode) {
		var neurons = layer.perNeuron.slice(0, 12);
		if (neurons.length === 0) return "<div style='opacity:0.4;font-size:0.8em;'>No neurons</div>";

		var maxAbs = neurons[0].absSum || 1;
		var html = "";

		html += "<div class='dex_neuron_row' style='opacity:0.4;font-size:0.72em;'>";
		html += "<span class='dex_neuron_name'>" + _t("dex_neuron", "Neuron") + "</span>";
		html += "<span class='dex_neuron_bar_outer'></span>";
		html += "<span class='dex_neuron_val'>|Σ|</span>";
		if (mode === "advanced") {
			html += "<span class='dex_neuron_contrib'>∇·x</span>";
		}
		html += "</div>";

		for (var n = 0; n < neurons.length; n++) {
			var neuron = neurons[n];
			var barPct = maxAbs > 0 ? (neuron.absSum / maxAbs * 100) : 0;
			var barColor = neuron.sum >= 0 ? "rgba(46,204,113,0.7)" : "rgba(231,76,60,0.7)";

			html += "<div class='dex_neuron_row'>";
			html += "<span class='dex_neuron_name'>n" + neuron.index + "</span>";
			html += "<span class='dex_neuron_bar_outer'>";
			html += "<span class='dex_neuron_bar_inner' style='width:" + barPct + "%;background:" + barColor + ";'></span>";
			html += "</span>";
			html += "<span class='dex_neuron_val'>" + _fmtNum(neuron.absSum) + "</span>";

			if (mode === "advanced" && neuron.mean !== undefined) {
				var contribClass = neuron.mean > 0 ? "dex_contrib_pos" : (neuron.mean < 0 ? "dex_contrib_neg" : "dex_contrib_none");
				html += "<span class='dex_neuron_contrib " + contribClass + "'>" + (neuron.mean > 0 ? "+" : "") + _fmtNum(neuron.mean) + "</span>";
			}
			html += "</div>";
		}
		return html;
	}

	// ============================================================
	// ATTRIBUTION HEATMAP
	// ============================================================

	function _renderAttribution(data) {
		if (!data || !data.attribution || !data.attribution.values) return "";
		if (!data.attribution.shape) return "";

		var shape = data.attribution.shape;
		var vals = data.attribution.values;

		var isImage = shape.length === 3 && (shape[2] === 1 || shape[2] === 3);
		if (!isImage) return _renderAttributionBars(data);

		var h = shape[0];
		var w = shape[1];
		var ch = shape[2];
		var pixCount = h * w;

		var maxAbs = 0;
		for (var k = 0; k < vals.length; k++) {
			if (Math.abs(vals[k]) > maxAbs) maxAbs = Math.abs(vals[k]);
		}
		if (maxAbs < 1e-10) maxAbs = 1;

		var cellSize = Math.max(2, Math.min(16, Math.floor(300 / Math.max(h, w))));
		var gridW = w * cellSize;
		var gridH = h * cellSize;

		var html = "<div style='text-align:center;'>";
		html += "<div class='dex_attribution_grid' style='grid-template-columns: repeat(" + w + ", " + cellSize + "px); width: " + gridW + "px; margin: 0 auto;'>";

		for (var r = 0; r < h; r++) {
			for (var c = 0; c < w; c++) {
				var acc = 0;
				for (var ch2 = 0; ch2 < ch; ch2++) {
					acc += vals[(r * w + c) * ch + ch2];
				}
				acc /= ch;
				var norm = acc / maxAbs;
				var color;
				if (norm > 0) {
					color = "rgba(46,204,113," + (norm * 0.9 + 0.1).toFixed(2) + ")";
				} else {
					color = "rgba(231,76,60," + (Math.abs(norm) * 0.9 + 0.1).toFixed(2) + ")";
				}
				html += "<div class='dex_attr_pixel' style='background:" + color + ";width:" + cellSize + "px;height:" + cellSize + "px;'></div>";
			}
		}
		html += "</div>";

		html += "<div class='dex_attr_legend'>";
		html += "<span>" + _t("dex_hurts", "hurts") + "</span>";
		html += "<div class='dex_attr_legend_bar' style='background:linear-gradient(to right, #e74c3c, #333, #2ecc71);'></div>";
		html += "<span>" + _t("dex_helps", "helps") + "</span>";
		html += "</div>";
		html += "</div>";
		return html;
	}

	function _renderAttributionBars(data) {
		if (!data || !data.attribution || !data.attribution.values) return "";
		var vals = data.attribution.values;
		var shape = data.attribution.shape;
		var flatSize = vals.length;

		var perFeature = [];
		if (shape.length >= 2) {
			var lastDim = shape[shape.length - 1];
			var numElems = flatSize / lastDim;
			for (var f = 0; f < lastDim; f++) {
				var sum = 0;
				for (var e = 0; e < numElems; e++) sum += vals[e * lastDim + f];
				perFeature.push({ index: f, value: sum });
			}
		} else {
			for (var f = 0; f < flatSize; f++) {
				perFeature.push({ index: f, value: vals[f] });
			}
		}

		perFeature.sort(function (a, b) { return Math.abs(b.value) - Math.abs(a.value); });
		var top = perFeature.slice(0, 15);

		var maxAbs = 1;
		for (var i = 0; i < top.length; i++) {
			if (Math.abs(top[i].value) > maxAbs) maxAbs = Math.abs(top[i].value);
		}

		var html = "<div style='max-width:500px;'>";
		for (var i = 0; i < top.length; i++) {
			var f = top[i];
			var pct = (Math.abs(f.value) / maxAbs * 100);
			var color = f.value >= 0 ? "rgba(46,204,113,0.7)" : "rgba(231,76,60,0.7)";
			html += "<div class='dex_neuron_row'>";
			html += "<span class='dex_neuron_name'>f" + f.index + "</span>";
			html += "<span class='dex_neuron_bar_outer'>";
			html += "<span class='dex_neuron_bar_inner' style='width:" + pct + "%;background:" + color + ";'></span>";
			html += "</span>";
			html += "<span class='dex_neuron_val'>" + _fmtNum(f.value) + "</span>";
			html += "</div>";
		}
		html += "</div>";
		return html;
	}

	// ============================================================
	// EXPLANATION PANEL
	// ============================================================

	function _renderExplanation(data, mode) {
		if (!data || !data.layers || data.layers.length === 0) return "";

		var html = "<div class='dex_explanation'>";

		if (mode === "beginner") {
			html += _renderBeginnerExplanation(data);
		} else {
			html += _renderAdvancedExplanation(data);
		}
		html += "</div>";
		return html;
	}

	function _renderBeginnerExplanation(data) {
		var html = "";
		var predName = _getLabelName(data.predClass);
		var trueName = data.trueClass >= 0 ? _getLabelName(data.trueClass) : _t("dex_unknown", "unknown");
		var isCorrect = data.predClass === data.trueClass;
		var confPct = (data.predConfidence * 100).toFixed(1);

		html += "<p>" + _t("dex_beginner_intro", "Let's follow how your neural network made its decision for this input:") + "</p>";

		html += "<p>" + _t("dex_beginner_prediction", "The network predicted <strong>") + _escapeHtml(predName) + "</strong> with <strong>" + confPct + "%</strong> confidence." + (data.trueClass >= 0 ? " (" + (isCorrect ? _t("dex_correct", "Correct!") : _t("dex_wrong", "Wrong!") + " " + _t("dex_actual_was", "Actual:") + " " + _escapeHtml(trueName)) + ")" : "") + "</p>";

		if (data.layers.length > 0) {
			var first = data.layers[0];
			var last = data.layers[data.layers.length - 1];

			var earlyActive = 0;
			if (data.layers.length > 1) earlyActive = data.layers[1] ? (1 - data.layers[1].zeroFraction) * 100 : 0;

			html += "<p>" + _t("dex_beginner_journey", "The data traveled through <strong>") + data.layers.length + "</strong> " + _t("dex_layers", "layers") + ". ";
			html += _t("dex_beginner_early", "In the early layers, the network detected simple patterns. ") + "</p>";

			if (earlyActive > 80) {
				html += "<p>" + _t("dex_beginner_active", "Most neurons are active (") + earlyActive.toFixed(0) + "%) " + _t("dex_beginner_active2", "- the network is using a broad set of features.") + "</p>";
			} else if (earlyActive < 20) {
				html += "<p>" + _t("dex_beginner_sparse", "Only a few neurons are active (") + earlyActive.toFixed(0) + "%) " + _t("dex_beginner_sparse2", "- the network is being very selective about what it pays attention to.") + "</p>";
			}

			if (last.perNeuron.length > 0) {
				var topNeuron = last.perNeuron[0];
				var finalText = _t("dex_beginner_final", "In the final layer, neuron <strong>n") + topNeuron.index + "</strong>" + _t("dex_beginner_final2", " had the strongest activation. This neuron's output is what ultimately determines the prediction.");
				html += "<p>" + finalText + "</p>";
			}
		}

		if (data.attribution && data.attribution.values) {
			var maxAttrIdx = 0;
			var maxAttrVal = 0;
			for (var k = 0; k < data.attribution.values.length; k++) {
				if (Math.abs(data.attribution.values[k]) > maxAttrVal) {
					maxAttrVal = Math.abs(data.attribution.values[k]);
					maxAttrIdx = k;
				}
			}
			var isImage = data.inputShape.length === 3 && (data.inputShape[2] === 1 || data.inputShape[2] === 3);
			if (isImage) {
				html += "<p>" + _t("dex_beginner_attribution_image", "The heatmap above shows which pixels influenced the decision most. Bright green = helped the prediction, red = worked against it.") + "</p>";
			} else {
				html += "<p>" + _t("dex_beginner_attribution_tabular", "The feature importance bars above show which input features had the most influence on the decision. Green = positive influence, red = negative.") + "</p>";
			}
		}

		return html;
	}

	function _renderAdvancedExplanation(data) {
		var html = "";
		var predName = _getLabelName(data.predClass);
		var trueName = data.trueClass >= 0 ? _getLabelName(data.trueClass) : _t("dex_unknown", "unknown");

		html += "<p><strong>" + _t("dex_adv_decision_trace", "Decision Trace") + "</strong> &mdash; " + _t("dex_adv_for_sample", "for sample") + " #" + data.sampleIdx + "</p>";
		html += "<p>" + _t("dex_adv_prediction", "Prediction: <strong>") + _escapeHtml(predName) + "</strong> (" + (data.predConfidence * 100).toFixed(2) + "%)" + (data.trueClass >= 0 ? " | " + _t("dex_adv_true", "True: ") + "<strong>" + _escapeHtml(trueName) + "</strong>" : "") + "</p>";

		html += "<p style='font-size:0.85em;opacity:0.6;'>" + _t("dex_adv_params", "Total parameters") + ": " + _fmtInt(data.totalParams) + " | " + _t("dex_adv_layers", "Layers") + ": " + data.totalLayers + "</p>";

		html += "<hr style='border:none;border-top:1px solid rgba(128,128,128,0.15);margin:10px 0;'>";

		for (var i = 0; i < data.layers.length; i++) {
			var layer = data.layers[i];
			var shapeStr = layer.shape ? "[" + layer.shape.join(", ") + "]" : "?";

			html += "<p style='margin:6px 0;'>";
			html += "<strong>" + _escapeHtml(layer.name) + "</strong> ";
			html += "<span style='opacity:0.5;'>(" + _escapeHtml(layer.type) + ")</span> ";
			html += "<span style='opacity:0.4;font-family:monospace;font-size:0.9em;'>" + shapeStr + "</span> ";

			var pctActive = ((1 - layer.zeroFraction) * 100).toFixed(1);
			html += "<span style='opacity:0.5;'>| " + pctActive + "% active</span> ";

			if (i < data.layers.length - 1 && data.layers[i + 1]) {
				var nextLayer = data.layers[i + 1];
				if (layer.shape && nextLayer.shape) {
					var ratio = layer.flatSize / (nextLayer.flatSize || 1);
					if (ratio > 2) {
						html += "<span class='dex_info_badge dex_info_badge_red'>" + _t("dex_adv_compressing", "compressing") + " " + ratio.toFixed(1) + "x</span>";
					} else if (ratio < 0.5) {
						html += "<span class='dex_info_badge dex_info_badge_green'>" + _t("dex_adv_expanding", "expanding") + " " + (1 / ratio).toFixed(1) + "x</span>";
					}
				}
			}
			html += "</p>";
		}

		if (data.attribution && data.attribution.values) {
			var isImage = data.inputShape.length === 3 && (data.inputShape[2] === 1 || data.inputShape[2] === 3);
			if (isImage) {
				html += "<hr style='border:none;border-top:1px solid rgba(128,128,128,0.15);margin:10px 0;'>";
				html += "<p style='margin:6px 0;'>" + _t("dex_adv_ig_title", "<strong>Integrated Gradients Attribution</strong>") + "</p>";
				html += "<p style='font-size:0.82em;opacity:0.6;'>" + _t("dex_adv_ig_explain", "Attribution computed via Integrated Gradients with 20 interpolation steps between a zero baseline and the input. The attribution at each pixel is the integral of gradients along the straight-line path, multiplied by the input value. This satisfies the completeness axiom: the sum of attributions equals the difference between the prediction at the input and the prediction at the baseline.") + "</p>";
			} else {
				html += "<hr style='border:none;border-top:1px solid rgba(128,128,128,0.15);margin:10px 0;'>";
				html += "<p style='margin:6px 0;'>" + _t("dex_adv_feat_title", "<strong>Feature Attribution</strong>") + "</p>";
				html += "<p style='font-size:0.82em;opacity:0.6;'>" + _t("dex_adv_feat_explain", "Per-feature importance computed as the average gradient of the target class output with respect to each input feature, scaled by the feature value. Green bars indicate features that pushed the prediction toward the predicted class; red bars indicate features that pushed against it.") + "</p>";
			}
		}

		var convIdx = -1;
		for (var i = 0; i < data.layers.length; i++) {
			if (data.layers[i].type && data.layers[i].type.indexOf("Conv") >= 0) { convIdx = i; break; }
		}
		if (convIdx >= 0) {
			var cl = data.layers[convIdx];
			var activeRatio = (1 - cl.zeroFraction);
			if (activeRatio < 0.1) {
				html += "<p style='color:#e67e22;margin:8px 0;'>⚠ " + _t("dex_adv_dead_relu", "Potential dying ReLU detected at layer") + " <strong>" + _escapeHtml(cl.name) + "</strong> (" + (cl.zeroFraction * 100).toFixed(1) + "% zeros).</p>";
			} else if (cl.zeroFraction > 0.5) {
				html += "<p style='color:#f39c12;margin:8px 0;'>⚠ " + _t("dex_adv_high_sparsity", "High sparsity at layer") + " <strong>" + _escapeHtml(cl.name) + "</strong> (" + (cl.zeroFraction * 100).toFixed(1) + "% zeros).</p>";
			}
		}

		return html;
	}

	// ============================================================
	// SUMMARY CARDS
	// ============================================================

	function _renderSummary(data) {
		if (!data) return "";
		var html = "<div class='dex_summary_row'>";

		var predName = _getLabelName(data.predClass);
		var confPct = (data.predConfidence * 100).toFixed(1);
		var isCorrect = data.predClass === data.trueClass;

		html += "<div class='dex_summary_card'>";
		html += "<div class='dex_sum_val' style='color:" + (isCorrect ? "#2ecc71" : "#e74c3c") + ";'>" + _escapeHtml(predName) + "</div>";
		html += "<div class='dex_sum_label'>" + _t("dex_prediction", "Prediction") + "</div>";
		html += "</div>";

		html += "<div class='dex_summary_card'>";
		html += "<div class='dex_sum_val'>" + confPct + "%</div>";
		html += "<div class='dex_sum_label'>" + _t("dex_confidence", "Confidence") + "</div>";
		html += "</div>";

		html += "<div class='dex_summary_card'>";
		html += "<div class='dex_sum_val'>" + data.totalLayers + "</div>";
		html += "<div class='dex_sum_label'>" + _t("dex_layers", "Layers") + "</div>";
		html += "</div>";

		html += "<div class='dex_summary_card'>";
		html += "<div class='dex_sum_val'>" + _fmtInt(data.totalParams) + "</div>";
		html += "<div class='dex_sum_label'>" + _t("dex_parameters", "Parameters") + "</div>";
		html += "</div>";

		html += "</div>";
		return html;
	}

	// ============================================================
	// MAIN RENDER
	// ============================================================

	function _render(divOrId) {
		var container = _getOrCreateContainer(divOrId);
		_injectStyles();

		var modelOk = _checkModel();
		var dataOk = _checkData();
		var numSamples = _getNumSamples();

		console.log("[DecisionExplorer] render: modelOk=" + modelOk + " dataOk=" + dataOk + " numSamples=" + numSamples +
			" xy_data_global=" + (typeof xy_data_global === "undefined" ? "undef" : xy_data_global === null ? "null" : typeof xy_data_global) +
			" model=" + (typeof model === "undefined" ? "undef" : model === null ? "null" : "ok") +
			" xy.x=" + (xy_data_global && xy_data_global.x ? (Array.isArray(xy_data_global.x) ? "arr[" + xy_data_global.x.length + "]" : (xy_data_global.x.isDisposed ? "disposed" : "tensor")) : "none"));

		if (!modelOk) {
			container.innerHTML = "<div class='dex_container'><div class='dex_empty'>" + _t("dex_no_model", "No model loaded. Please create or load a model first.") + "</div></div>";
			_triggerTranslations();
			return;
		}

		if (!dataOk || numSamples === 0) {
			if (_state.retryCount === undefined || _state.retryCount < 30) {
				_state.retryCount = (_state.retryCount || 0) + 1;
				if (_state.retryCount === 1) {
					container.innerHTML = "<div class='dex_container'><div class='dex_empty'>" + _t("dex_computing", "Waiting for data...") + " <div class='spinner' style='margin:10px auto;width:24px;height:24px;'></div></div></div>";
					_triggerTranslations();
				}
				setTimeout(function () { _render(divOrId); }, 500);
				return;
			}
			_state.retryCount = 0;
			container.innerHTML = "<div class='dex_container'><div class='dex_empty'>" + _t("dex_no_data", "No data available. Load a dataset or train first.") + "</div></div>";
			_triggerTranslations();
			return;
		}
		_state.retryCount = 0;

		_state.currentSample = Math.min(_state.currentSample, numSamples - 1);

		var isCorrect = true;

		container.innerHTML = "<div class='dex_container'><div class='dex_empty'>" + _t("dex_computing", "Computing decision trace...") + " <div class='spinner' style='margin:10px auto;width:24px;height:24px;'></div></div></div>";
		_triggerTranslations();

		setTimeout(function () {
			_collectDecisionData(_state.currentSample, function (data, error) {
				if (error || !data) {
					container.innerHTML = "<div class='dex_container'><div class='dex_empty'>" + _t(error || "dex_error", "An error occurred.") + "</div></div>";
					_triggerTranslations();
					return;
				}

				_state.cachedData = data;

				var html = "<div class='dex_container dex_fade_in'>";

				html += "<div class='dex_header'>";
				html += "<h2><span class='TRANSLATEME_dex_title'></span></h2>";
				html += "<div class='dex_controls'>";
				html += "<div class='dex_mode_toggle'>";
				html += "<button class='" + (_state.mode === "beginner" ? "dex_active" : "") + "' onclick='DecisionExplorer.setMode(\"beginner\")'>" + _t("dex_beginner", "Beginner") + "</button>";
				html += "<button class='" + (_state.mode === "advanced" ? "dex_active" : "") + "' onclick='DecisionExplorer.setMode(\"advanced\")'>" + _t("dex_advanced", "Advanced") + "</button>";
				html += "</div>";
				html += "<button class='dex_btn' onclick='DecisionExplorer.refresh()'>⟳</button>";
				html += "</div></div>";

				html += "<p class='dex_subtitle'><span class='TRANSLATEME_dex_subtitle'></span></p>";

				html += "<div class='dex_sample_nav'>";
				html += "<label><span class='TRANSLATEME_dex_sample'></span>:</label>";
				html += "<select id='dex_sample_select' onchange='DecisionExplorer.goToSample(parseInt(this.value))'>";
				var maxShow = Math.min(numSamples, 500);
				for (var i = 0; i < maxShow; i++) {
					var sel = i === _state.currentSample ? " selected" : "";
					var lbl = _getLabelName(_getTrueClassForIdx(i));
					html += "<option value='" + i + "'" + sel + ">#" + i + (lbl ? " (" + _escapeHtml(lbl) + ")" : "") + "</option>";
				}
				html += "</select>";
				html += "</div>";

				html += _renderSummary(data);

				html += "<div class='dex_section'>";
				html += "<div class='dex_section_title'><span class='TRANSLATEME_dex_flow_title'></span></div>";
				html += "<div class='dex_section_explain'><span class='TRANSLATEME_dex_flow_explain'></span></div>";
				html += "<div class='dex_flow_wrap'>" + _renderFlowDiagram(data) + "</div>";
				html += "</div>";

				html += "<div class='dex_section'>";
				html += "<div class='dex_section_title'><span class='TRANSLATEME_dex_neuron_title'></span></div>";
				html += "<div class='dex_section_explain'><span class='TRANSLATEME_dex_neuron_explain'></span></div>";
				html += _renderNeuronContributions(data, _state.mode);
				html += "</div>";

				if (data.attribution) {
					html += "<div class='dex_section'>";
					html += "<div class='dex_section_title'><span class='TRANSLATEME_dex_attr_title'></span></div>";
					html += "<div class='dex_section_explain'><span class='TRANSLATEME_dex_attr_explain'></span></div>";
					html += "<div class='dex_attribution_wrap'>" + _renderAttribution(data) + "</div>";
					html += "</div>";
				}

				html += "<div class='dex_section'>";
				html += "<div class='dex_section_title'><span class='TRANSLATEME_dex_explain_title'></span></div>";
				html += _renderExplanation(data, _state.mode);
				html += "</div>";

				html += "</div>";

				container.innerHTML = html;
				_triggerTranslations();
			});
		}, 50);
	}

	// ============================================================
	// HELPERS
	// ============================================================

	function _escapeHtml(str) {
		if (!str) return "";
		return String(str).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
	}

	function _fmtNum(v) {
		if (v === undefined || v === null || isNaN(v)) return "0";
		var abs = Math.abs(v);
		if (abs >= 1000) return v.toFixed(0);
		if (abs >= 1) return v.toFixed(2);
		if (abs >= 0.01) return v.toFixed(3);
		return v.toExponential(1);
	}

	function _fmtInt(v) {
		if (v >= 1000000) return (v / 1000000).toFixed(1) + "M";
		if (v >= 1000) return (v / 1000).toFixed(1) + "K";
		return String(v);
	}

	function _getLabelName(idx) {
		if (idx < 0) return "";
		try {
			if (typeof labels !== "undefined" && Array.isArray(labels) && idx < labels.length && labels[idx]) {
				return String(labels[idx]);
			}
		} catch (e) {}
		try {
			if (xy_data_global && xy_data_global.keys && Array.isArray(xy_data_global.keys) && idx < xy_data_global.keys.length) {
				return String(xy_data_global.keys[idx]);
			}
		} catch (e) {}
		return "Class " + idx;
	}

	function _getTrueClassForIdx(sampleIdx) {
		try {
			if (!xy_data_global || !xy_data_global.y) return -1;
			var yData = xy_data_global.y;
			if (Array.isArray(yData)) {
				if (sampleIdx >= yData.length) return -1;
				var val = yData[sampleIdx];
				if (Array.isArray(val)) {
					var maxIdx = 0, maxVal = -Infinity;
					for (var c = 0; c < val.length; c++) { if (val[c] > maxVal) { maxVal = val[c]; maxIdx = c; } }
					return maxIdx;
				}
				return Math.round(val);
			}
			if (!_isAliveTensor(yData)) return -1;
			var ySingle = tf.tidy(function () { return tf.gather(yData, [sampleIdx]); });
			var arr = ySingle.dataSync();
			ySingle.dispose();
			if (arr.length > 1) {
				var maxIdx = 0, maxVal = -Infinity;
				for (var c = 0; c < arr.length; c++) {
					if (arr[c] > maxVal) { maxVal = arr[c]; maxIdx = c; }
				}
				return maxIdx;
			}
			return Math.round(arr[0]);
		} catch (e) {
			return -1;
		}
	}

	// ============================================================
	// PUBLIC API
	// ============================================================

	return {
		render: function (divOrId) {
			_render(divOrId);
		},

		refresh: function () {
			if (_state.container) _render(_state.container.id || _state.container);
		},

		goToSample: function (idx) {
			_state.currentSample = idx;
			_render(_state.container.id || _state.container);
		},

		setMode: function (m) {
			_state.mode = m;
			_render(_state.container.id || _state.container);
		},

		toggleLayer: function (layerIdx) {
			if (_state.expandedLayer === layerIdx) {
				_state.expandedLayer = null;
			} else {
				_state.expandedLayer = layerIdx;
			}
			if (_state.cachedData) {
				var body = _state.container.querySelectorAll(".dex_layer_body");
				var cards = _state.container.querySelectorAll(".dex_layer_card");
				for (var i = 0; i < cards.length; i++) {
					if (i === layerIdx) {
						cards[i].classList.toggle("dex_layer_card_expanded");
						if (body[i]) body[i].classList.toggle("dex_layer_body_open");
					}
				}
			}
		}
	};

})();
