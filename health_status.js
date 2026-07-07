"use strict";

// ============================================================
// GLOBAL LAYER I/O RECORDING
// ============================================================

var layerIOStats = {
	records: [],
	maxRecords: 50,
	enabled: true,
	_isRecording: false,
	_multiModel: null,
	_outputMeta: null,
	_extractorModelId: null,
	_container: null
};

// --- FIX 1: Multi-Output-Modell statt N separate Modelle ---
function _ensureExtractors() {
	if (!model || !model._allLayers) return false;

	var currentModelId = model._allLayers.length + "_" + (model.inputs ? model.inputs[0].id : "");
	if (layerIOStats._extractorModelId === currentModelId && layerIOStats._multiModel) {
		return true;
	}

	// Altes Modell aufräumen
	if (layerIOStats._multiModel) {
		try { layerIOStats._multiModel.dispose(); } catch (e) { }
	}

	layerIOStats._multiModel = null;
	layerIOStats._outputMeta = [];
	layerIOStats._extractorModelId = currentModelId;

	var inputTensor = model.inputs[0];
	var allLayers = model._allLayers;

	var allOutputs = [];
	var outputMeta = [];

	for (var i = 0; i < allLayers.length; i++) {
		if (allLayers[i].getClassName() === "InputLayer") continue;
		try {
			var layerOutput = allLayers[i].getOutputAt(0);
			allOutputs.push(layerOutput);
			outputMeta.push({
				layerIndex: i,
				layerName: allLayers[i].name,
				layerType: allLayers[i].getClassName()
			});
		} catch (e) { }
	}

	if (allOutputs.length === 0) return false;

	try {
		// EIN Modell mit ALLEN Layer-Outputs
		layerIOStats._multiModel = tf.model({ inputs: inputTensor, outputs: allOutputs });
		layerIOStats._outputMeta = outputMeta;
	} catch (e) {
		// Fallback: Wenn Multi-Output nicht klappt (z.B. bei bestimmten Architekturen),
		// versuche einzelne Modelle
		layerIOStats._multiModel = null;
		layerIOStats._outputMeta = [];
		return false;
	}

	return true;
}

// --- FIX 2 & 3: Optimiertes Recording mit Multi-Output und ohne Stats-Berechnung ---
function recordLayerIO(input) {
	if (!model || layerIOStats._isRecording) return;
	if (!layerIOStats.enabled) return;

	layerIOStats._isRecording = true;

	try {
		if (!_ensureExtractors()) {
			layerIOStats._isRecording = false;
			return;
		}
	} catch (e) {
		layerIOStats._isRecording = false;
		return;
	}

	var record = {
		timestamp: Date.now(),
		layers: []
	};

	try {
		tf.tidy(function () {
			var inputTensor;
			if (input instanceof tf.Tensor) {
				inputTensor = input;
			} else {
				inputTensor = tf.tensor(input);
			}

			var modelInputShape = model.inputs[0].shape;
			if (inputTensor.shape.length === modelInputShape.length - 1) {
				inputTensor = inputTensor.expandDims(0);
			}

			// EIN Forward-Pass für ALLE Layer-Outputs
			var outputs = layerIOStats._multiModel.predict(inputTensor);

			// Falls nur ein Output, in Array wrappen
			if (!Array.isArray(outputs)) {
				outputs = [outputs];
			}

			// Input-Daten einmal holen
			var inputDataSync = inputTensor.dataSync();
			var prevOutput = inputDataSync;

			for (var i = 0; i < outputs.length; i++) {
				var meta = layerIOStats._outputMeta[i];
				if (!meta) continue;

				try {
					var outputData = outputs[i].dataSync();

					// FIX 3: Nur Rohdaten speichern, KEINE Stats hier berechnen
					record.layers.push({
						layerIndex: meta.layerIndex,
						layerName: meta.layerName,
						layerType: meta.layerType,
						input: prevOutput ? new Float32Array(prevOutput) : null,
						output: new Float32Array(outputData),
						outputShape: outputs[i].shape
					});

					prevOutput = outputData;
				} catch (e) { }
			}
		});
	} catch (e) {
		wrn("[layerIO] recording error:", e);
	}

	layerIOStats._isRecording = false;

	layerIOStats.records.push(record);
	if (layerIOStats.records.length > layerIOStats.maxRecords) {
		layerIOStats.records.shift();
	}
}

// --- FIX 4: Sampling – nur jeden N-ten Predict aufzeichnen ---
var _predictCounter = 0;
var _recordEveryN = 50; // Nur jeden 50. Predict aufzeichnen

function enableAutoRecord() {
	if (!model) {
		// FIX: Wenn model noch nicht existiert, versuche es später erneut
		wrn("[layerIO] enableAutoRecord called but model is null. Will retry...");
		setTimeout(function () {
			enableAutoRecord();
		}, 1000);
		return;
	}

	// FIX: Wenn das Modell sich geändert hat, neu patchen
	if (layerIOStats._lastPatchedModel === model && model._io_auto_record_patched) {
		return; // Bereits gepatcht, gleiches Modell
	}

	// Falls ein anderes Modell vorher gepatcht war, ist das egal –
	// wir patchen jetzt das aktuelle
	var _origPredict = model.predict.bind(model);

	model.predict = function (input, config) {
		var result = _origPredict(input, config);

		if (layerIOStats.enabled && !layerIOStats._isRecording) {
			try {
				recordLayerIO(input);
			} catch (e) { }
		}

		return result;
	};

	model._io_auto_record_patched = true;
	layerIOStats._lastPatchedModel = model;

	dbg("[layerIO] Auto-record patched on model successfully.");
}

// ============================================================
// STATS (nur beim Rendering berechnet – Lazy)
// ============================================================

function _computeStats(arr) {
	if (!arr || arr.length === 0) return null;

	var min = Infinity, max = -Infinity, sum = 0, sumSq = 0;
	var zeros = 0, negatives = 0, positives = 0;
	var nanCount = 0, infCount = 0;

	for (var i = 0; i < arr.length; i++) {
		var v = arr[i];
		if (isNaN(v)) { nanCount++; continue; }
		if (!isFinite(v)) { infCount++; continue; }
		if (v < min) min = v;
		if (v > max) max = v;
		sum += v;
		sumSq += v * v;
		if (v === 0) zeros++;
		else if (v < 0) negatives++;
		else positives++;
	}

	var n = arr.length - nanCount - infCount;
	var mean = n > 0 ? sum / n : 0;
	var variance = n > 1 ? (sumSq / n) - (mean * mean) : 0;
	var std = Math.sqrt(Math.max(0, variance));

	// Compute skewness and kurtosis
	var skewness = 0;
	var kurtosis = 0;
	if (n > 2 && std > 0) {
		var sumCubed = 0, sumFourth = 0;
		for (var i = 0; i < arr.length; i++) {
			var v = arr[i];
			if (isNaN(v) || !isFinite(v)) continue;
			var diff = v - mean;
			sumCubed += diff * diff * diff;
			sumFourth += diff * diff * diff * diff;
		}
		skewness = (sumCubed / n) / (std * std * std);
		kurtosis = ((sumFourth / n) / (std * std * std * std)) - 3; // excess kurtosis
	}

	return {
		count: arr.length, min: min, max: max, mean: mean, std: std,
		zeros: zeros, negatives: negatives, positives: positives,
		nanCount: nanCount, infCount: infCount,
		zeroFraction: arr.length > 0 ? zeros / arr.length : 0,
		negativeFraction: arr.length > 0 ? negatives / arr.length : 0,
		skewness: skewness,
		kurtosis: kurtosis,
		range: (max !== -Infinity && min !== Infinity) ? max - min : 0
	};
}

function _computeHistogram(arr, bins) {
	bins = bins || 40;
	if (!arr || arr.length === 0) return null;

	var min = Infinity, max = -Infinity;
	for (var i = 0; i < arr.length; i++) {
		var v = arr[i];
		if (isNaN(v) || !isFinite(v)) continue;
		if (v < min) min = v;
		if (v > max) max = v;
	}

	if (min === max) return { binEdges: [min, min], counts: [arr.length], min: min, max: max, binWidth: 0 };

	var binWidth = (max - min) / bins;
	var counts = new Array(bins).fill(0);
	var binEdges = [];
	for (var b = 0; b <= bins; b++) binEdges.push(min + b * binWidth);

	for (var i = 0; i < arr.length; i++) {
		var v = arr[i];
		if (isNaN(v) || !isFinite(v)) continue;
		var idx = Math.min(Math.floor((v - min) / binWidth), bins - 1);
		counts[idx]++;
	}

	return { binEdges: binEdges, counts: counts, min: min, max: max, binWidth: binWidth };
}

function _computePercentiles(arr) {
	if (!arr || arr.length === 0) return null;
	var sorted = [];
	for (var i = 0; i < arr.length; i++) {
		if (!isNaN(arr[i]) && isFinite(arr[i])) sorted.push(arr[i]);
	}
	sorted.sort(function(a, b) { return a - b; });
	var n = sorted.length;
	if (n === 0) return null;

	return {
		p1: sorted[Math.floor(n * 0.01)],
		p5: sorted[Math.floor(n * 0.05)],
		p25: sorted[Math.floor(n * 0.25)],
		p50: sorted[Math.floor(n * 0.50)],
		p75: sorted[Math.floor(n * 0.75)],
		p95: sorted[Math.floor(n * 0.95)],
		p99: sorted[Math.floor(n * 0.99)]
	};
}

function _detectWarnings(layerData) {
	var warnings = [];
	if (!layerData.output) return warnings;
	var stats = _computeStats(layerData.output);
	if (!stats) return warnings;

	// ===== EXISTING CHECKS (keep all of these) =====

	// Dying ReLU
	if (stats.zeroFraction > 0.8) {
		warnings.push({ type: "dying_relu", severity: stats.zeroFraction > 0.95 ? "critical" : "warning", zeroFraction: stats.zeroFraction });
	}

	// Saturated layer
	if (stats.std < 1e-7 && stats.count > 1) {
		warnings.push({ type: "saturated", severity: "warning", std: stats.std });
	}

	// Exploding activations
	if (stats.max > 1e6 || stats.min < -1e6) {
		warnings.push({ type: "exploding", severity: "critical", min: stats.min, max: stats.max });
	}

	// NaN/Inf
	if (stats.nanCount > 0 || stats.infCount > 0) {
		warnings.push({ type: "nan_inf", severity: "critical", nanCount: stats.nanCount, infCount: stats.infCount });
	}

	// Vanishing activations
	if (stats.range > 0 && stats.range < 1e-5 && stats.count > 10) {
		warnings.push({ type: "vanishing", severity: "warning", range: stats.range });
	}

	// High kurtosis
	if (Math.abs(stats.kurtosis) > 10) {
		warnings.push({ type: "high_kurtosis", severity: "info", kurtosis: stats.kurtosis });
	}

	// Extreme skewness
	if (Math.abs(stats.skewness) > 5) {
		warnings.push({ type: "high_skewness", severity: "info", skewness: stats.skewness });
	}

	// Constant output
	if (stats.min === stats.max && stats.count > 1) {
		warnings.push({ type: "constant_output", severity: "critical", value: stats.min });
	}

	// All negative
	if (stats.positives === 0 && stats.negatives > 0 && stats.zeros === 0) {
		warnings.push({ type: "all_negative", severity: "info", negativeFraction: 1.0 });
	}

	// Magnitude explosion/collapse
	if (layerData.input) {
		var inputStats = _computeStats(layerData.input);
		if (inputStats && inputStats.std > 0 && stats.std > 0) {
			var magnitudeRatio = stats.std / inputStats.std;
			if (magnitudeRatio > 100) {
				warnings.push({ type: "magnitude_explosion", severity: "warning", ratio: magnitudeRatio });
			} else if (magnitudeRatio < 0.01) {
				warnings.push({ type: "magnitude_collapse", severity: "warning", ratio: magnitudeRatio });
			}
		}
	}

	// ===== NEW CHECKS =====

	// --- 1. Saturated Sigmoid/Tanh ---
	// If a sigmoid/tanh layer has most values near ±1 or 0/1 boundaries,
	// gradients will be near zero (vanishing gradient problem)
	if (layerData.layerType === "Dense" || layerData.layerType === "Activation") {
		var nearBoundary = 0;
		var threshold = 0.05; // how close to boundary counts as "saturated"
		for (var i = 0; i < layerData.output.length; i++) {
			var v = layerData.output[i];
			// Sigmoid saturation: values near 0 or 1
			if ((v > (1 - threshold) && v <= 1) || (v < threshold && v >= 0)) {
				nearBoundary++;
			}
			// Tanh saturation: values near -1 or 1
			if (v > (1 - threshold) || v < -(1 - threshold)) {
				nearBoundary++;
			}
		}
		var saturationFraction = nearBoundary / (layerData.output.length * 2); // *2 because we check both
		if (saturationFraction > 0.4) {
			warnings.push({
				type: "activation_saturation",
				severity: saturationFraction > 0.7 ? "warning" : "info",
				saturationFraction: saturationFraction
			});
		}
	}

	// --- 3. Rank Collapse / Low Effective Dimensionality ---
	// If outputs are highly correlated (low rank), the layer isn't using its capacity
	// Approximation: check if variance is concentrated in very few dimensions
	if (layerData.outputShape && layerData.outputShape.length === 2 && layerData.outputShape[1] > 4) {
		var numFeatures = layerData.outputShape[1];
		var featureVariances = [];
		var totalSamples = layerData.output.length / numFeatures;

		if (totalSamples >= 2) {
			for (var f = 0; f < numFeatures; f++) {
				var fSum = 0, fSumSq = 0;
				for (var s = 0; s < totalSamples; s++) {
					var val = layerData.output[s * numFeatures + f];
					fSum += val;
					fSumSq += val * val;
				}
				var fMean = fSum / totalSamples;
				var fVar = (fSumSq / totalSamples) - (fMean * fMean);
				featureVariances.push(Math.max(0, fVar));
			}

			// Sort variances descending
			featureVariances.sort(function(a, b) { return b - a; });
			var totalVar = 0;
			for (var f = 0; f < featureVariances.length; f++) totalVar += featureVariances[f];

			if (totalVar > 0) {
				// How many dimensions explain 95% of variance?
				var cumVar = 0;
				var effectiveDims = 0;
				for (var f = 0; f < featureVariances.length; f++) {
					cumVar += featureVariances[f];
					effectiveDims++;
					if (cumVar / totalVar >= 0.95) break;
				}
				var dimRatio = effectiveDims / numFeatures;
				if (dimRatio < 0.2 && numFeatures > 8) {
					warnings.push({
						type: "rank_collapse",
						severity: dimRatio < 0.1 ? "warning" : "info",
						effectiveDims: effectiveDims,
						totalDims: numFeatures,
						dimRatio: dimRatio
					});
				}
			}
		}
	}

	// --- 4. Bimodal Distribution Detection ---
	// A bimodal output distribution may indicate the layer is acting as a
	// binary switch rather than extracting useful features
	if (stats.count > 20) {
		var histogram = _computeHistogram(layerData.output, 20);
		if (histogram && histogram.counts) {
			var counts = histogram.counts;
			var totalCount = 0;
			for (var h = 0; h < counts.length; h++) totalCount += counts[h];

			// Find valleys: local minima surrounded by higher bins
			var valleys = 0;
			var deepestValleyDepth = 0;
			for (var h = 2; h < counts.length - 2; h++) {
				var left = Math.max(counts[h - 1], counts[h - 2]);
				var right = Math.max(counts[h + 1], counts[h + 2]);
				var current = counts[h];
				if (current < left * 0.5 && current < right * 0.5 && left > totalCount * 0.05 && right > totalCount * 0.05) {
					valleys++;
					var depth = 1 - (current / Math.min(left, right));
					if (depth > deepestValleyDepth) deepestValleyDepth = depth;
				}
			}

			if (valleys > 0 && deepestValleyDepth > 0.5) {
				warnings.push({
					type: "bimodal_distribution",
					severity: "info",
					valleys: valleys,
					depth: deepestValleyDepth
				});
			}
		}
	}

	// --- 5. Output Clipping / Railing ---
	// Many values stuck at the same extreme (e.g., clipped at 0 by ReLU,
	// or at 1 by sigmoid, or at clip boundaries)
	if (stats.count > 10) {
		var atMax = 0, atMin = 0;
		for (var i = 0; i < layerData.output.length; i++) {
			if (layerData.output[i] === stats.max) atMax++;
			if (layerData.output[i] === stats.min) atMin++;
		}
		var railFraction = Math.max(atMax, atMin) / stats.count;
		// Only flag if not already caught by dying_relu or constant_output
		if (railFraction > 0.4 && stats.min !== stats.max && stats.zeroFraction <= 0.8) {
			warnings.push({
				type: "output_railing",
				severity: railFraction > 0.7 ? "warning" : "info",
				railFraction: railFraction,
				railValue: atMax > atMin ? stats.max : stats.min
			});
		}
	}

	// --- 6. Numerical Instability (pre-explosion) ---
	// Large values that haven't hit 1e6 yet but are growing dangerously
	if (stats.max > 1000 || stats.min < -1000) {
		if (stats.max <= 1e6 && stats.min >= -1e6) { // Not already caught by exploding
			warnings.push({
				type: "large_activations",
				severity: (stats.max > 10000 || stats.min < -10000) ? "warning" : "info",
				max: stats.max,
				min: stats.min
			});
		}
	}

	// --- 7. Entropy Collapse (for softmax/probability outputs) ---
	// If the output looks like probabilities, check if entropy is too low (overconfident)
	// or too high (uniform/underfitting)
	if (stats.min >= 0 && stats.max <= 1.001) {
		var sumProbs = 0;
		for (var i = 0; i < layerData.output.length; i++) {
			sumProbs += layerData.output[i];
		}
		// Check if it sums to ~1 (probability distribution)
		var numClasses = layerData.output.length;
		if (numClasses > 1 && Math.abs(sumProbs - 1.0) < 0.01) {
			// Compute entropy
			var entropy = 0;
			for (var i = 0; i < numClasses; i++) {
				var p = layerData.output[i];
				if (p > 1e-10) {
					entropy -= p * Math.log(p);
				}
			}
			var maxEntropy = Math.log(numClasses);
			var normalizedEntropy = entropy / maxEntropy;

			if (normalizedEntropy < 0.1 && numClasses > 2) {
				warnings.push({
					type: "overconfident_output",
					severity: "info",
					entropy: entropy,
					normalizedEntropy: normalizedEntropy,
					maxProb: stats.max
				});
			} else if (normalizedEntropy > 0.95) {
				warnings.push({
					type: "uniform_output",
					severity: "warning",
					entropy: entropy,
					normalizedEntropy: normalizedEntropy
				});
			}
		}
	}

	// --- 8. Oscillating Outputs (sign changes indicating instability) ---
	// Rapid sign alternations in sequential outputs can indicate instability
	if (stats.count > 10 && stats.negatives > 0 && stats.positives > 0) {
		var signChanges = 0;
		var prevSign = layerData.output[0] >= 0 ? 1 : -1;
		for (var i = 1; i < layerData.output.length; i++) {
			var v = layerData.output[i];
			if (isNaN(v) || !isFinite(v)) continue;
			var currSign = v >= 0 ? 1 : -1;
			if (currSign !== prevSign) signChanges++;
			prevSign = currSign;
		}
		var signChangeRate = signChanges / (stats.count - 1);
		// A random signal would have ~0.5 sign change rate
		// Much higher than 0.5 suggests high-frequency oscillation
		if (signChangeRate > 0.7) {
			warnings.push({
				type: "high_frequency_oscillation",
				severity: "info",
				signChangeRate: signChangeRate
			});
		}
	}

	// --- 9. Near-Zero Mean with High Std (potential instability for non-normalized layers) ---
	if (Math.abs(stats.mean) < 0.01 && stats.std > 10 && stats.count > 10) {
		warnings.push({
			type: "high_variance_zero_mean",
			severity: "info",
			mean: stats.mean,
			std: stats.std
		});
	}

	// --- 10. Coefficient of Variation (CV) too extreme ---
	// CV = std/|mean| — if very high, the signal-to-noise ratio is poor
	if (Math.abs(stats.mean) > 1e-6) {
		var cv = stats.std / Math.abs(stats.mean);
		if (cv > 50) {
			warnings.push({
				type: "high_coefficient_of_variation",
				severity: "info",
				cv: cv
			});
		}
	}

	return warnings;
}

// ============================================================
// RENDERING
// ============================================================

function renderLayerIOStats(divTarget) {
	var container;

	// Singleton: reuse existing container
	if (layerIOStats._container && document.body.contains(layerIOStats._container)) {
		container = layerIOStats._container;
	} else if (typeof divTarget === "string") {
		container = document.getElementById(divTarget);
		if (!container) {
			container = document.createElement("div");
			container.id = divTarget;
			document.body.appendChild(container);
		}
	} else if (divTarget instanceof HTMLElement) {
		container = divTarget;
	} else {
		container = document.createElement("div");
		container.id = "layer_io_monitor";
		document.body.appendChild(container);
	}

	layerIOStats._container = container;
	container.className = "layer_io_monitor";

	// Inject styles once
	if (!document.getElementById("layer_io_styles")) {
		var style = document.createElement("style");
		style.id = "layer_io_styles";
		style.textContent = `
	    .layer_io_monitor {
		padding: 20px;
	    }
	    .layer_io_monitor h2 {
		margin: 0 0 12px 0;
	    }
	    .layer_io_monitor .lio_subtitle {
		opacity: 0.6;
		margin: 0 0 16px 0;
		font-size: 0.85em;
	    }
	    .layer_io_monitor .lio_card {
		border: 3px solid var(--border-color, #bbb);
		border-radius: 10px;
		padding: 16px 18px;
		margin: 14px 0;
		transition: border-color 0.3s, box-shadow 0.3s, background 0.3s;
		box-shadow: 0 2px 8px rgba(0,0,0,0.07), 0 1px 3px rgba(0,0,0,0.04);
		background: rgba(255,255,255,0.6);
	    }
	    @media (prefers-color-scheme: dark) {
		.layer_io_monitor .lio_card {
		    background: rgba(30,30,30,0.7);
		    box-shadow: 0 2px 8px rgba(0,0,0,0.3), 0 1px 3px rgba(0,0,0,0.2);
		}
	    }
	    .layer_io_monitor .lio_card:hover {
		box-shadow: 0 4px 16px rgba(0,0,0,0.12), 0 2px 6px rgba(0,0,0,0.06);
		transform: translateY(-1px);
	    }
	    .layer_io_monitor .lio_card.lio_healthy {
		border-color: #2ecc71;
		background: linear-gradient(135deg, rgba(46,204,113,0.04) 0%, rgba(46,204,113,0.01) 100%);
	    }
	    .layer_io_monitor .lio_card.lio_warning {
		border-color: #f39c12;
		background: linear-gradient(135deg, rgba(243,156,18,0.06) 0%, rgba(243,156,18,0.02) 100%);
	    }
	    .layer_io_monitor .lio_card.lio_critical {
		border-color: #e74c3c;
		background: linear-gradient(135deg, rgba(231,76,60,0.06) 0%, rgba(231,76,60,0.02) 100%);
		animation: lio_pulse_critical 2s ease-in-out infinite;
	    }
	    .layer_io_monitor .lio_card.lio_info_card {
		border-color: #3498db;
		background: linear-gradient(135deg, rgba(52,152,219,0.04) 0%, rgba(52,152,219,0.01) 100%);
	    }
	    @keyframes lio_pulse_critical {
		0%, 100% { box-shadow: 0 2px 8px rgba(231,76,60,0.15); }
		50% { box-shadow: 0 4px 20px rgba(231,76,60,0.3); }
	    }
	    .layer_io_monitor .lio_header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 10px;
		padding-bottom: 8px;
		border-bottom: 1px solid rgba(128,128,128,0.15);
	    }
	    .layer_io_monitor .lio_header strong {
		font-size: 1.1em;
	    }
	    .layer_io_monitor .lio_header .lio_type {
		opacity: 0.5;
		font-weight: normal;
		font-size: 0.9em;
	    }
	    .layer_io_monitor .lio_header .lio_shape {
		font-size: 0.8em;
		opacity: 0.5;
		background: rgba(128,128,128,0.1);
		padding: 2px 8px;
		border-radius: 4px;
	    }
	    .layer_io_monitor .lio_status_badge {
		display: inline-block;
		padding: 2px 8px;
		border-radius: 12px;
		font-size: 0.7em;
		font-weight: bold;
		text-transform: uppercase;
		letter-spacing: 0.5px;
		margin-left: 8px;
	    }
	    .layer_io_monitor .lio_badge_healthy {
		background: rgba(46,204,113,0.15);
		color: #27ae60;
	    }
	    .layer_io_monitor .lio_badge_warning {
		background: rgba(243,156,18,0.15);
		color: #e67e22;
	    }
	    .layer_io_monitor .lio_badge_critical {
		background: rgba(231,76,60,0.15);
		color: #c0392b;
	    }
	    .layer_io_monitor .lio_badge_info {
		background: rgba(52,152,219,0.15);
		color: #2980b9;
	    }
	    .layer_io_monitor .lio_warnings {
		background: rgba(231, 76, 60, 0.08);
		border: 1px solid rgba(231, 76, 60, 0.3);
		border-radius: 6px;
		padding: 8px 12px;
		margin-bottom: 10px;
		font-size: 0.9em;
	    }
	    .layer_io_monitor .lio_warnings > div {
		padding: 2px 0;
	    }
	    .layer_io_monitor .lio_info_box {
		background: rgba(52, 152, 219, 0.08);
		border: 1px solid rgba(52, 152, 219, 0.3);
		border-radius: 6px;
		padding: 8px 12px;
		margin-bottom: 10px;
		font-size: 0.9em;
	    }
	    .layer_io_monitor .lio_stats_grid {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 10px;
	    }
	    .layer_io_monitor .lio_stats_box {
		border-radius: 8px;
		padding: 10px 12px;
		background: rgba(128,128,128,0.06);
		border: 1px solid rgba(128,128,128,0.1);
	    }
	    .layer_io_monitor .lio_stats_box h4 {
		margin: 0 0 6px 0;
		font-size: 0.8em;
		text-transform: uppercase;
		opacity: 0.6;
		letter-spacing: 0.5px;
	    }
	    .layer_io_monitor .lio_stats_box table {
		width: 100%;
		font-size: 0.82em;
		border-collapse: collapse;
	    }
	    .layer_io_monitor .lio_stats_box td {
		padding: 2px 4px;
	    }
	    .layer_io_monitor .lio_stats_box td:first-child {
		opacity: 0.6;
	    }
	    .layer_io_monitor .lio_stats_box td:last-child {
		text-align: right;
		font-variant-numeric: tabular-nums;
		font-family: 'SF Mono', 'Fira Code', monospace;
	    }
	    .layer_io_monitor .lio_stats_box .lio_val_warn {
		color: #f39c12;
		font-weight: bold;
	    }
	    .layer_io_monitor .lio_stats_box .lio_val_crit {
		color: #e74c3c;
		font-weight: bold;
	    }
	    .layer_io_monitor .lio_plot_section {
		margin-top: 10px;
	    }
	    .layer_io_monitor .lio_plot_label {
		font-size: 0.75em;
		opacity: 0.5;
		margin-bottom: 4px;
		text-transform: uppercase;
		letter-spacing: 0.3px;
	    }
	    .layer_io_monitor .lio_aggregate {
		margin-top: 24px;
		padding: 18px;
		border-radius: 10px;
		background: rgba(128,128,128,0.04);
		border: 2px solid rgba(128,128,128,0.15);
		box-shadow: 0 2px 8px rgba(0,0,0,0.04);
	    }
	    .layer_io_monitor .lio_aggregate h3 {
		margin: 0 0 12px 0;
	    }
	    .layer_io_monitor .lio_ok { color: #2ecc71; font-weight: 500; }
	    .layer_io_monitor .lio_warn { color: #f39c12; font-weight: 500; }
	    .layer_io_monitor .lio_crit { color: #e74c3c; font-weight: 500; }
	    .layer_io_monitor .lio_info_text { color: #3498db; font-weight: 500; }
	    .layer_io_monitor .lio_multi_plot {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 14px;
		margin-top: 14px;
	    }
	    .layer_io_monitor .lio_multi_plot > div {
		background: rgba(128,128,128,0.04);
		border-radius: 8px;
		padding: 10px;
		border: 1px solid rgba(128,128,128,0.1);
	    }
	    .layer_io_monitor .lio_temml {
		margin-top: 8px;
		font-size: 0.9em;
		padding: 4px 8px;
		background: rgba(128,128,128,0.04);
		border-radius: 4px;
	    }
	    .layer_io_monitor .lio_percentiles {
		margin-top: 8px;
		font-size: 0.78em;
		opacity: 0.7;
		font-family: 'SF Mono', 'Fira Code', monospace;
	    }
	    .layer_io_monitor .lio_config_issues {
		margin-top: 20px;
		padding: 16px;
		border-radius: 10px;
		background: rgba(155, 89, 182, 0.05);
		border: 2px solid rgba(155, 89, 182, 0.2);
	    }
	    .layer_io_monitor .lio_config_issues h3 {
		margin: 0 0 10px 0;
		color: #8e44ad;
	    }
	    .layer_io_monitor .lio_config_issue_item {
		padding: 6px 0;
		border-bottom: 1px solid rgba(128,128,128,0.08);
	    }
	    .layer_io_monitor .lio_config_issue_item:last-child {
		border-bottom: none;
	    }
	    .layer_io_monitor .lio_score_bar {
		height: 6px;
		border-radius: 3px;
		background: rgba(128,128,128,0.15);
		margin-top: 8px;
		overflow: hidden;
	    }
	    .layer_io_monitor .lio_score_fill {
		height: 100%;
		border-radius: 3px;
		transition: width 0.5s ease;
	    }
	`;
		document.head.appendChild(style);
	}

	if (layerIOStats.records.length === 0) {
		container.innerHTML = "<p style='opacity:0.6;'><span class='TRANSLATEME_layer_io_no_data'></span></p>";
		return container;
	}

	var latestRecord = layerIOStats.records[layerIOStats.records.length - 1];
	var html = "";

	html += "<h2><span class='TRANSLATEME_layer_io_title'></span></h2>";
	html += "<p class='lio_subtitle'><span class='TRANSLATEME_layer_io_record'></span> #" + layerIOStats.records.length +
		" | " + new Date(latestRecord.timestamp).toLocaleTimeString() +
		" | <span class='TRANSLATEME_layer_io_total'></span>: " + layerIOStats.records.length + "</p>";

	// Overall health score
	html += _renderHealthScore(latestRecord);

	// Per-layer cards – Stats werden JETZT erst berechnet (lazy)
	for (var i = 0; i < latestRecord.layers.length; i++) {
		var layer = latestRecord.layers[i];
		var inputStats = layer.input ? _computeStats(layer.input) : null;
		var outputStats = _computeStats(layer.output);
		var warnings = _detectWarnings(layer);
		var histogram = _computeHistogram(layer.output, 40);
		var percentiles = _computePercentiles(layer.output);

		var hasCritical = warnings.some(function (w) { return w.severity === "critical"; });
		var hasWarning = warnings.some(function (w) { return w.severity === "warning"; });
		var hasInfo = warnings.some(function (w) { return w.severity === "info"; });

		var cardClass = hasCritical ? "lio_critical" :
			hasWarning ? "lio_warning" :
			hasInfo ? "lio_info_card" : "lio_healthy";

		var badgeClass = hasCritical ? "lio_badge_critical" :
			hasWarning ? "lio_badge_warning" :
			hasInfo ? "lio_badge_info" : "lio_badge_healthy";

		var badgeText = hasCritical ? "layer_io_status_critical" :
			hasWarning ? "layer_io_status_warning" :
			hasInfo ? "layer_io_status_info" : "layer_io_status_healthy";

		html += "<div class='lio_card " + cardClass + "'>";

		// Header
		html += "<div class='lio_header'>";
		html += "<div><strong>[" + layer.layerIndex + "] " + layer.layerName + " <span class='lio_type'>(" + layer.layerType + ")</span></strong>";
		html += "<span class='lio_status_badge " + badgeClass + "'><span class='TRANSLATEME_" + badgeText + "'></span></span></div>";
		html += "<span class='lio_shape'><span class='TRANSLATEME_layer_io_shape'></span>: [" + (layer.outputShape || "?").toString() + "]</span>";
		html += "</div>";

		// Warnings
		if (warnings.length > 0) {
			var critWarnings = warnings.filter(function(w) { return w.severity === "critical" || w.severity === "warning"; });
			var infoWarnings = warnings.filter(function(w) { return w.severity === "info"; });

			if (critWarnings.length > 0) {
				html += "<div class='lio_warnings'>";
				for (var w = 0; w < critWarnings.length; w++) {
					html += _renderWarningItem(critWarnings[w]);
				}
				html += "</div>";
			}

			if (infoWarnings.length > 0) {
				html += "<div class='lio_info_box'>";
				for (var w = 0; w < infoWarnings.length; w++) {
					html += _renderWarningItem(infoWarnings[w]);
				}
				html += "</div>";
			}
		}

		// Stats grid
		html += "<div class='lio_stats_grid'>";
		if (inputStats) {
			html += "<div class='lio_stats_box'><h4><span class='TRANSLATEME_layer_io_input'></span></h4>";
			html += _statsTable(inputStats);
			html += "</div>";
		}
		if (outputStats) {
			html += "<div class='lio_stats_box'><h4><span class='TRANSLATEME_layer_io_output'></span></h4>";
			html += _statsTable(outputStats);
			html += "</div>";
		}
		html += "</div>";

		// Percentiles
		if (percentiles) {
			html += "<div class='lio_percentiles'>";
			html += "P1=" + percentiles.p1.toFixed(4) + " | P5=" + percentiles.p5.toFixed(4) +
				" | P25=" + percentiles.p25.toFixed(4) + " | P50=" + percentiles.p50.toFixed(4) +
				" | P75=" + percentiles.p75.toFixed(4) + " | P95=" + percentiles.p95.toFixed(4) +
				" | P99=" + percentiles.p99.toFixed(4);
			html += "</div>";
		}

		// Histogram
		if (histogram && histogram.counts && histogram.binWidth > 0) {
			html += "<div class='lio_plot_section'>";
			html += "<div class='lio_plot_label'><span class='TRANSLATEME_layer_io_output_distribution'></span></div>";
			html += _histogramSVG(histogram, warnings);
			html += "</div>";
		}

		// Temml
		if (outputStats) {
			html += "<div class='lio_temml' data-temml='1'>";
			html += "\\mu = " + outputStats.mean.toFixed(4) +
				", \\; \\sigma = " + outputStats.std.toFixed(4) +
				", \\; \\text{zeros} = " + (outputStats.zeroFraction * 100).toFixed(1) + "\\%";
			if (outputStats.skewness !== undefined) {
				html += ", \\; \\gamma_1 = " + outputStats.skewness.toFixed(3);
			}
			if (outputStats.kurtosis !== undefined) {
				html += ", \\; \\kappa = " + outputStats.kurtosis.toFixed(3);
			}
			html += "</div>";
		}

		html += "</div>"; // end card
	}

	// ============================================================
	// AGGREGATE INDICATORS WITH TOOLTIP POPUPS (NEW)
	// ============================================================
	html += _renderAggregateIndicators(latestRecord);

	// Config issues detection
	html += _renderConfigIssues(latestRecord);

	// Aggregate section with multiple plots
	html += _renderAggregateSection(latestRecord);

	container.innerHTML = html;

	// Render temml
	try {
		var els = container.querySelectorAll("[data-temml]");
		for (var t = 0; t < els.length; t++) {
			try {
				els[t].innerHTML = temml.renderToString(els[t].textContent, { displayMode: false });
			} catch (e) { }
		}
	} catch (e) { }

	// ============================================================
	// ATTACH TOOLTIP POPUPS TO INDICATOR ROWS (NEW)
	// ============================================================
	try {
		var indicatorContainer = document.getElementById("lio_aggregate_indicators");
		if (indicatorContainer && typeof attachWaTooltips === "function") {
			var allOutputs = [];
			for (var i = 0; i < latestRecord.layers.length; i++) {
				if (latestRecord.layers[i].output) {
					for (var j = 0; j < latestRecord.layers[i].output.length; j++) {
						allOutputs.push(latestRecord.layers[i].output[j]);
					}
				}
			}
			var indicators = _computeAggregateIndicators(allOutputs, latestRecord);
			attachWaTooltips(indicatorContainer, {
				entropy: indicators.entropy,
				entropyMax: indicators.entropyMax,
				sparsity: indicators.sparsity,
				svd: indicators.svd,
				kurtosis: indicators.kurtosis,
				ks: indicators.ks,
				correlation: indicators.correlation
			});
		}
	} catch (e) { }

	// Update translations
	try {
		if (typeof update_translations === "function") {
			update_translations();
		}
	} catch (e) { }

	return container;
}

// ============================================================
// HEALTH SCORE (updated with tooltip integration)
// ============================================================

function _renderHealthScore(record) {
    var totalLayers = record.layers.length;
    var criticalCount = 0, warningCount = 0, infoCount = 0;

    for (var i = 0; i < totalLayers; i++) {
        var warnings = _detectWarnings(record.layers[i]);
        for (var w = 0; w < warnings.length; w++) {
            if (warnings[w].severity === "critical") criticalCount++;
            else if (warnings[w].severity === "warning") warningCount++;
            else if (warnings[w].severity === "info") infoCount++;
        }
    }

    var score = 100;
    score -= criticalCount * 25;
    score -= warningCount * 10;
    score -= infoCount * 3;
    score = Math.max(0, Math.min(100, score));

    var scoreColor = score >= 80 ? "#2ecc71" : score >= 50 ? "#f39c12" : "#e74c3c";

    var html = "<div style='margin-bottom: 16px;'>";
    html += "<strong><span class='TRANSLATEME_layer_io_health_score'></span>: " + score + "/100</strong>";
    html += "<div class='lio_score_bar'>";
    html += "<div class='lio_score_fill' style='width: " + score + "%; background: " + scoreColor + ";'></div>";
    html += "</div>";
    html += "<small style='opacity:0.6;'>" + criticalCount + " <span class='TRANSLATEME_layer_io_critical_issues'></span>, " +
        warningCount + " <span class='TRANSLATEME_layer_io_warnings_label'></span>, " +
        infoCount + " <span class='TRANSLATEME_layer_io_info_label'></span></small>";
    html += "</div>";

    return html;
}

// ============================================================
// AGGREGATE INDICATORS WITH TOOLTIP POPUPS
// ============================================================

function _renderAggregateIndicators(record) {
    var allOutputs = [];
    for (var i = 0; i < record.layers.length; i++) {
        if (record.layers[i].output) {
            for (var j = 0; j < record.layers[i].output.length; j++) {
                allOutputs.push(record.layers[i].output[j]);
            }
        }
    }

    if (allOutputs.length === 0) return "";

    var indicators = _computeAggregateIndicators(allOutputs, record);

    var html = "<div class='lio_aggregate' id='lio_aggregate_indicators'>";
    html += "<h3><span class='TRANSLATEME_wa_overall_indicators'></span></h3>";

    html += waIndicatorRowHTML("entropy", "wa_indicator_entropy",
        "H=" + indicators.entropy.toFixed(3) + " / " + indicators.entropyMax.toFixed(3));

    html += waIndicatorRowHTML("sparsity", "wa_indicator_sparsity",
        (indicators.sparsity * 100).toFixed(1) + "% near-zero");

    html += waIndicatorRowHTML("svd", "wa_indicator_svd",
        "Steepness: " + indicators.svd.toFixed(3));

    html += waIndicatorRowHTML("kurtosis", "wa_indicator_kurtosis",
        "k=" + indicators.kurtosis.toFixed(3));

    html += waIndicatorRowHTML("ks_test", "wa_indicator_ks_test",
        "D=" + indicators.ks.toFixed(4));

    html += waIndicatorRowHTML("correlation", "wa_indicator_correlation",
        "r=" + indicators.correlation.toFixed(4));

    html += waIndicatorRowHTML("weight_distribution", "wa_weight_distribution", "");

    html += "</div>";

    return html;
}

function _computeAggregateIndicators(allOutputs, record) {
    var stats = _computeStats(allOutputs);
    var n = allOutputs.length;

    // Entropy
    var histogram = _computeHistogram(allOutputs, 256);
    var entropy = 0;
    var entropyMax = 0;
    if (histogram && histogram.counts) {
        var total = 0;
        for (var i = 0; i < histogram.counts.length; i++) {
            total += histogram.counts[i];
        }
        entropyMax = Math.log2(histogram.counts.length);
        for (var i = 0; i < histogram.counts.length; i++) {
            if (histogram.counts[i] > 0) {
                var p = histogram.counts[i] / total;
                entropy -= p * Math.log2(p);
            }
        }
    }

    // Sparsity
    var nearZeroCount = 0;
    var threshold = 0.01;
    for (var i = 0; i < allOutputs.length; i++) {
        if (Math.abs(allOutputs[i]) < threshold) nearZeroCount++;
    }
    var sparsity = allOutputs.length > 0 ? nearZeroCount / allOutputs.length : 0;

    // SVD steepness (approximation via sorted variance)
    var svdSteepness = _computeSvdSteepness(record);

    // Kurtosis
    var kurtosis = stats ? stats.kurtosis : 0;

    // KS-Test approximation
    var ksD = _computeKsTest(allOutputs, stats);

    // Inter-filter correlation
    var correlation = _computeInterFilterCorrelation(record);

    return {
        entropy: entropy,
        entropyMax: entropyMax,
        sparsity: sparsity,
        svd: svdSteepness,
        kurtosis: kurtosis,
        ks: ksD,
        correlation: correlation
    };
}

function _computeSvdSteepness(record) {
    if (!record.layers || record.layers.length < 2) return 0;

    var variances = [];
    for (var i = 0; i < record.layers.length; i++) {
        var s = _computeStats(record.layers[i].output);
        if (s && s.std > 0) {
            variances.push(s.std * s.std);
        }
    }

    if (variances.length < 2) return 0;

    variances.sort(function(a, b) { return b - a; });
    var totalVar = 0;
    for (var i = 0; i < variances.length; i++) totalVar += variances[i];

    if (totalVar === 0) return 0;

    // Steepness = how much the first component dominates
    var topRatio = variances[0] / totalVar;
    var steepness = topRatio - (1 / variances.length);
    return Math.max(0, Math.min(1, steepness));
}

function _computeKsTest(arr, stats) {
    if (!arr || arr.length === 0 || !stats || stats.std === 0) return 0;

    var sorted = [];
    for (var i = 0; i < arr.length; i++) {
        if (!isNaN(arr[i]) && isFinite(arr[i])) sorted.push(arr[i]);
    }
    sorted.sort(function(a, b) { return a - b; });

    var n = sorted.length;
    if (n === 0) return 0;

    var maxD = 0;
    for (var i = 0; i < n; i++) {
        var empiricalCDF = (i + 1) / n;
        var z = (sorted[i] - stats.mean) / stats.std;
        var theoreticalCDF = 0.5 * (1 + _erfApprox(z / Math.sqrt(2)));
        var d = Math.abs(empiricalCDF - theoreticalCDF);
        if (d > maxD) maxD = d;
    }

    return maxD;
}

function _erfApprox(x) {
    var a1 = 0.254829592, a2 = -0.284496736, a3 = 1.421413741;
    var a4 = -1.453152027, a5 = 1.061405429, p = 0.3275911;
    var sign = x < 0 ? -1 : 1;
    x = Math.abs(x);
    var t = 1.0 / (1.0 + p * x);
    var y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);
    return sign * y;
}

function _computeInterFilterCorrelation(record) {
    if (!record.layers || record.layers.length < 2) return 0;

    var layerMeans = [];
    for (var i = 0; i < record.layers.length; i++) {
        var s = _computeStats(record.layers[i].output);
        if (s) layerMeans.push(s.mean);
    }

    if (layerMeans.length < 2) return 0;

    // Compute average pairwise correlation between adjacent layers
    var totalCorr = 0;
    var pairs = 0;

    for (var i = 0; i < record.layers.length - 1; i++) {
        var a = record.layers[i].output;
        var b = record.layers[i + 1].output;
        if (!a || !b) continue;

        var minLen = Math.min(a.length, b.length, 500);
        var sumA = 0, sumB = 0, sumAB = 0, sumA2 = 0, sumB2 = 0;

        for (var j = 0; j < minLen; j++) {
            sumA += a[j];
            sumB += b[j];
            sumAB += a[j] * b[j];
            sumA2 += a[j] * a[j];
            sumB2 += b[j] * b[j];
        }

        var meanA = sumA / minLen;
        var meanB = sumB / minLen;
        var num = sumAB / minLen - meanA * meanB;
        var denA = Math.sqrt(sumA2 / minLen - meanA * meanA);
        var denB = Math.sqrt(sumB2 / minLen - meanB * meanB);

        if (denA > 1e-10 && denB > 1e-10) {
            totalCorr += Math.abs(num / (denA * denB));
            pairs++;
        }
    }

    return pairs > 0 ? totalCorr / pairs : 0;
}

// ============================================================
// CONFIG ISSUES DETECTION
// ============================================================

function _renderConfigIssues(record) {
	var issues = [];

	if (!model || !model._allLayers) return "";

	var allLayers = model._allLayers;

	// 1. Dense layer after Conv without Flatten
	var lastWasConv = false;
	for (var i = 0; i < allLayers.length; i++) {
		var className = allLayers[i].getClassName();
		if (className.toLowerCase().includes("conv")) {
			lastWasConv = true;
		} else if (className === "Flatten" || className === "GlobalAveragePooling2D" || className === "GlobalMaxPooling2D") {
			lastWasConv = false;
		} else if (className === "Dense" && lastWasConv) {
			issues.push({
				type: "dense_after_conv_no_flatten",
				severity: "critical",
				layer: allLayers[i].name
			});
			lastWasConv = false;
		}
	}

	// 2. Very high learning rate
	try {
		if (model.optimizer && model.optimizer.learningRate) {
			var lr = typeof model.optimizer.learningRate === "function" ?
				model.optimizer.learningRate() : model.optimizer.learningRate;
			if (lr > 0.1) {
				issues.push({ type: "high_learning_rate", severity: "warning", value: lr });
			}
			if (lr < 1e-7) {
				issues.push({ type: "very_low_learning_rate", severity: "info", value: lr });
			}
		}
	} catch (e) { }

	// 3. Last layer activation mismatch with loss
	try {
		var lastLayer = allLayers[allLayers.length - 1];
		var lastActivation = "";
		if (lastLayer.getConfig && lastLayer.getConfig().activation) {
			lastActivation = lastLayer.getConfig().activation;
		}
		var loss = "";
		if (typeof get_loss === "function") {
			loss = get_loss();
		}

		if (loss === "categoricalCrossentropy" && lastActivation !== "softmax") {
			issues.push({ type: "activation_loss_mismatch", severity: "warning", activation: lastActivation, loss: loss, suggestion: "softmax" });
		}
		if (loss === "binaryCrossentropy" && lastActivation !== "sigmoid" && lastActivation !== "softmax") {
			issues.push({ type: "activation_loss_mismatch", severity: "warning", activation: lastActivation, loss: loss, suggestion: "sigmoid" });
		}
		if ((loss === "meanSquaredError" || loss === "meanAbsoluteError") && lastActivation === "softmax") {
			issues.push({ type: "activation_loss_mismatch", severity: "info", activation: lastActivation, loss: loss, suggestion: "linear" });
		}
	} catch (e) { }

	// 4. Dropout as last layer
	try {
		var visibleLayers = model.layers;
		if (visibleLayers.length > 0) {
			var lastVisibleClass = visibleLayers[visibleLayers.length - 1].getClassName();
			if (lastVisibleClass === "Dropout") {
				issues.push({ type: "dropout_last_layer", severity: "warning" });
			}
		}
	} catch (e) { }

	// 5. Very few parameters in a layer (potential bottleneck)
	try {
		for (var i = 0; i < record.layers.length; i++) {
			var layerOutput = record.layers[i].output;
			if (layerOutput && layerOutput.length < 2 && record.layers[i].layerType === "Dense") {
				issues.push({ type: "bottleneck_too_small", severity: "info", layer: record.layers[i].layerName, size: layerOutput.length });
			}
		}
	} catch (e) { }

	// 6. Consecutive identical layers without activation change
	try {
		for (var i = 1; i < record.layers.length; i++) {
			if (record.layers[i].layerType === record.layers[i - 1].layerType &&
				record.layers[i].layerType === "Dense") {
				var s1 = _computeStats(record.layers[i - 1].output);
				var s2 = _computeStats(record.layers[i].output);
				if (s1 && s2 && Math.abs(s1.mean - s2.mean) < 0.001 && Math.abs(s1.std - s2.std) < 0.001) {
					issues.push({ type: "redundant_layers", severity: "info", layers: record.layers[i - 1].layerName + " & " + record.layers[i].layerName });
				}
			}
		}
	} catch (e) { }

	// 7. Output layer units mismatch with number of labels
	try {
		if (typeof labels !== "undefined" && labels.length > 0) {
			var lastLayerOutput = record.layers[record.layers.length - 1];
			if (lastLayerOutput && lastLayerOutput.output) {
				var outputSize = lastLayerOutput.output.length;
				var outputShape = lastLayerOutput.outputShape;
				if (outputShape && outputShape.length === 2 && outputShape[0] !== null) {
					outputSize = outputShape[1];
				} else if (outputShape && outputShape.length === 2) {
					outputSize = outputShape[1];
				}
				if (outputSize !== labels.length && labels.length > 1) {
					issues.push({ type: "output_label_mismatch", severity: "warning", outputSize: outputSize, labelCount: labels.length });
				}
			}
		}
	} catch (e) { }

	// 8. No trainable layers
	try {
		var hasTrainable = false;
		for (var i = 0; i < allLayers.length; i++) {
			if (allLayers[i].trainable) {
				hasTrainable = true;
				break;
			}
		}
		if (!hasTrainable) {
			issues.push({ type: "no_trainable_layers", severity: "critical" });
		}
	} catch (e) { }

	// 9. Gradient ratio
	try {
		if (record.layers.length >= 2) {
			var firstStats = _computeStats(record.layers[0].output);
			var lastStats = _computeStats(record.layers[record.layers.length - 1].output);
			if (firstStats && lastStats && firstStats.std > 0) {
				var gradientRatio = lastStats.std / firstStats.std;
				if (gradientRatio > 1000) {
					issues.push({ type: "gradient_explosion_risk", severity: "warning", ratio: gradientRatio });
				} else if (gradientRatio < 0.001) {
					issues.push({ type: "gradient_vanishing_risk", severity: "warning", ratio: gradientRatio });
				}
			}
		}
	} catch (e) { }

	if (issues.length === 0) return "";

	var html = "<div class='lio_config_issues'>";
	html += "<h3>\u2692\uFE0F <span class='TRANSLATEME_layer_io_config_issues'></span> (" + issues.length + ")</h3>";

	for (var i = 0; i < issues.length; i++) {
		html += "<div class='lio_config_issue_item'>";
		html += _renderConfigIssueItem(issues[i]);
		html += "</div>";
	}

	html += "</div>";
	return html;
}

function _renderConfigIssueItem(issue) {
	var icon = issue.severity === "critical" ? "\uD83D\uDEA5" : issue.severity === "warning" ? "\uD83D\uDEA0" : "\uD83D\uDEB5";
	var html = icon + " ";

	switch (issue.type) {
		case "dense_after_conv_no_flatten":
			html += "<span class='TRANSLATEME_layer_io_issue_dense_no_flatten'></span> (" + issue.layer + ")";
			break;
		case "high_learning_rate":
			html += "<span class='TRANSLATEME_layer_io_issue_high_lr'></span>: " + issue.value.toExponential(2);
			break;
		case "very_low_learning_rate":
			html += "<span class='TRANSLATEME_layer_io_issue_low_lr'></span>: " + issue.value.toExponential(2);
			break;
		case "activation_loss_mismatch":
			html += "<span class='TRANSLATEME_layer_io_issue_activation_mismatch'></span>: " +
				issue.activation + " + " + issue.loss + " \u2192 <span class='TRANSLATEME_layer_io_suggestion'></span>: " + issue.suggestion;
			break;
		case "dropout_last_layer":
			html += "<span class='TRANSLATEME_layer_io_issue_dropout_last'></span>";
			break;
		case "bottleneck_too_small":
			html += "<span class='TRANSLATEME_layer_io_issue_bottleneck'></span>: " + issue.layer + " (" + issue.size + " <span class='TRANSLATEME_layer_io_units'></span>)";
			break;
		case "redundant_layers":
			html += "<span class='TRANSLATEME_layer_io_issue_redundant'></span>: " + issue.layers;
			break;
		case "output_label_mismatch":
			html += "<span class='TRANSLATEME_layer_io_issue_output_mismatch'></span>: " + issue.outputSize + " <span class='TRANSLATEME_layer_io_outputs'></span> vs " + issue.labelCount + " <span class='TRANSLATEME_layer_io_labels'></span>";
			break;
		case "no_trainable_layers":
			html += "<span class='TRANSLATEME_layer_io_issue_no_trainable'></span>";
			break;
		case "gradient_explosion_risk":
			html += "<span class='TRANSLATEME_layer_io_issue_gradient_explosion'></span> (ratio: " + issue.ratio.toExponential(2) + ")";
			break;
		case "gradient_vanishing_risk":
			html += "<span class='TRANSLATEME_layer_io_issue_gradient_vanishing'></span> (ratio: " + issue.ratio.toExponential(2) + ")";
			break;
		default:
			html += issue.type;
	}

	return html;
}

// ============================================================
// WARNING ITEM RENDERER
// ============================================================

function _renderWarningItem(wn) {
	var icon = wn.severity === "critical" ? "\uD83D\uDEA5" : wn.severity === "warning" ? "\uD83D\uDEA0" : "\uD83D\uDEB5";
	var msg = "";

	switch (wn.type) {
		// ... existing cases ...

		case "activation_saturation":
			msg = "<span class='TRANSLATEME_layer_io_activation_saturation'></span>: " +
				(wn.saturationFraction * 100).toFixed(1) + "% <span class='TRANSLATEME_layer_io_near_boundary'></span>";
			break;
		case "dead_neurons":
			msg = "<span class='TRANSLATEME_layer_io_dead_neurons'></span>: " +
				wn.deadCount + "/" + wn.totalNeurons + " (" + (wn.deadFraction * 100).toFixed(1) + "%)";
			break;
		case "rank_collapse":
			msg = "<span class='TRANSLATEME_layer_io_rank_collapse'></span>: " +
				wn.effectiveDims + "/" + wn.totalDims + " <span class='TRANSLATEME_layer_io_effective_dims'></span> (" +
				(wn.dimRatio * 100).toFixed(1) + "%)";
			break;
		case "bimodal_distribution":
			msg = "<span class='TRANSLATEME_layer_io_bimodal'></span> (" +
				wn.valleys + " valley(s), depth=" + (wn.depth * 100).toFixed(0) + "%)";
			break;
		case "output_railing":
			msg = "<span class='TRANSLATEME_layer_io_output_railing'></span>: " +
				(wn.railFraction * 100).toFixed(1) + "% <span class='TRANSLATEME_layer_io_at_value'></span> " + wn.railValue.toFixed(4);
			break;
		case "large_activations":
			msg = "<span class='TRANSLATEME_layer_io_large_activations'></span> [" +
				wn.min.toFixed(1) + ", " + wn.max.toFixed(1) + "]";
			break;
		case "overconfident_output":
			msg = "<span class='TRANSLATEME_layer_io_overconfident'></span> (entropy=" +
				wn.normalizedEntropy.toFixed(3) + ", max_p=" + wn.maxProb.toFixed(4) + ")";
			break;
		case "uniform_output":
			msg = "<span class='TRANSLATEME_layer_io_uniform_output'></span> (normalized entropy=" +
				wn.normalizedEntropy.toFixed(3) + ")";
			break;
		case "high_frequency_oscillation":
			msg = "<span class='TRANSLATEME_layer_io_oscillation'></span> (sign change rate=" +
				wn.signChangeRate.toFixed(3) + ")";
			break;
		case "high_variance_zero_mean":
			msg = "<span class='TRANSLATEME_layer_io_high_var_zero_mean'></span> (\u03BC=" +
				wn.mean.toFixed(4) + ", \u03C3=" + wn.std.toFixed(2) + ")";
			break;
		case "high_coefficient_of_variation":
			msg = "<span class='TRANSLATEME_layer_io_high_cv'></span> (CV=" + wn.cv.toFixed(1) + ")";
			break;
		default:
			msg = wn.type;
	}

	return "<div>" + icon + " " + msg + "</div>";
}

// ============================================================
// STATS TABLE
// ============================================================

function _statsTable(stats) {
	if (!stats) return "";
	var html = "<table>";

	var valClass = function (condition) { return condition ? "lio_val_crit" : ""; };
	var warnClass = function (condition) { return condition ? "lio_val_warn" : ""; };

	var rows = [
		["<span class='TRANSLATEME_layer_io_min'></span>", stats.min === Infinity ? "N/A" : stats.min.toFixed(5), valClass(stats.min < -1e6)],
		["<span class='TRANSLATEME_layer_io_max'></span>", stats.max === -Infinity ? "N/A" : stats.max.toFixed(5), valClass(stats.max > 1e6)],
		["<span class='TRANSLATEME_layer_io_mean'></span>", stats.mean.toFixed(5), ""],
		["<span class='TRANSLATEME_layer_io_std'></span>", stats.std.toFixed(5), warnClass(stats.std < 1e-7)],
		["<span class='TRANSLATEME_layer_io_zeros'></span>", stats.zeros + " (" + (stats.zeroFraction * 100).toFixed(1) + "%)", warnClass(stats.zeroFraction > 0.8)],
		["<span class='TRANSLATEME_layer_io_negatives'></span>", stats.negatives + " (" + (stats.negativeFraction * 100).toFixed(1) + "%)", ""],
		["<span class='TRANSLATEME_layer_io_count'></span>", stats.count.toString(), ""]
	];

	if (stats.nanCount > 0) rows.push(["NaN", "<span class='lio_val_crit'>" + stats.nanCount + "</span>", "lio_val_crit"]);
	if (stats.infCount > 0) rows.push(["Inf", "<span class='lio_val_crit'>" + stats.infCount + "</span>", "lio_val_crit"]);
	if (stats.skewness !== undefined) rows.push(["<span class='TRANSLATEME_layer_io_skewness'></span>", stats.skewness.toFixed(3), warnClass(Math.abs(stats.skewness) > 5)]);
	if (stats.kurtosis !== undefined) rows.push(["<span class='TRANSLATEME_layer_io_kurtosis'></span>", stats.kurtosis.toFixed(3), warnClass(Math.abs(stats.kurtosis) > 10)]);

	for (var r = 0; r < rows.length; r++) {
		var cls = rows[r][2] ? " class='" + rows[r][2] + "'" : "";
		html += "<tr><td>" + rows[r][0] + "</td><td" + cls + ">" + rows[r][1] + "</td></tr>";
	}
	html += "</table>";
	return html;
}

// ============================================================
// HISTOGRAM SVG
// ============================================================

function _histogramSVG(histogram, warnings) {
	var width = 380, height = 50;
	var maxCount = Math.max.apply(null, histogram.counts) || 1;
	var barWidth = width / histogram.counts.length;
	var isDying = warnings.some(function (w) { return w.type === "dying_relu"; });

	var svg = "<svg width='100%' viewBox='0 0 " + width + " " + (height + 16) + "' style='display:block; max-width:500px;'>";

	for (var i = 0; i < histogram.counts.length; i++) {
		var barHeight = (histogram.counts[i] / maxCount) * height;
		var x = i * barWidth;
		var y = height - barHeight;
		var binCenter = histogram.binEdges[i] + histogram.binWidth / 2;

		var color;
		if (isDying && Math.abs(binCenter) < histogram.binWidth) color = "#e74c3c";
		else if (binCenter < 0) color = "#3498db";
		else color = "#2ecc71";

		svg += "<rect x='" + x + "' y='" + y + "' width='" + Math.max(barWidth - 0.5, 0.5) +
			"' height='" + barHeight + "' fill='" + color + "' opacity='0.75'/>";
	}

	// Zero line
	if (histogram.min < 0 && histogram.max > 0) {
		var zeroX = ((0 - histogram.min) / (histogram.max - histogram.min)) * width;
		svg += "<line x1='" + zeroX + "' y1='0' x2='" + zeroX + "' y2='" + height + "' stroke='currentColor' stroke-width='0.5' stroke-dasharray='2,2' opacity='0.4'/>";
	}

	svg += "<text x='0' y='" + (height + 12) + "' font-size='9' fill='currentColor' opacity='0.5'>" + histogram.min.toFixed(2) + "</text>";
	svg += "<text x='" + (width - 35) + "' y='" + (height + 12) + "' font-size='9' fill='currentColor' opacity='0.5'>" + histogram.max.toFixed(2) + "</text>";

	svg += "</svg>";
	return svg;
}

// ============================================================
// AGGREGATE SECTION
// ============================================================

function _renderAggregateSection(record) {
	var html = "<div class='lio_aggregate'>";
	html += "<h3><span class='TRANSLATEME_layer_io_health_check'></span></h3>";

	var dyingLayers = [], explodingLayers = [], saturatedLayers = [], nanLayers = [];
	var vanishingLayers = [], constantLayers = [];

	for (var i = 0; i < record.layers.length; i++) {
		var warnings = _detectWarnings(record.layers[i]);
		for (var w = 0; w < warnings.length; w++) {
			if (warnings[w].type === "dying_relu") dyingLayers.push(record.layers[i].layerName);
			if (warnings[w].type === "exploding") explodingLayers.push(record.layers[i].layerName);
			if (warnings[w].type === "saturated") saturatedLayers.push(record.layers[i].layerName);
			if (warnings[w].type === "nan_inf") nanLayers.push(record.layers[i].layerName);
			if (warnings[w].type === "vanishing") vanishingLayers.push(record.layers[i].layerName);
			if (warnings[w].type === "constant_output") constantLayers.push(record.layers[i].layerName);
		}
	}

	if (dyingLayers.length === 0 && explodingLayers.length === 0 && saturatedLayers.length === 0 &&
		nanLayers.length === 0 && vanishingLayers.length === 0 && constantLayers.length === 0) {
		html += "<div class='lio_ok'>\u2705 <span class='TRANSLATEME_layer_io_all_healthy'></span></div>";
	} else {
		if (nanLayers.length > 0) html += "<div class='lio_crit'>\uD83D\uDEA5 <span class='TRANSLATEME_layer_io_nan_inf'></span>: " + nanLayers.join(", ") + "</div>";
		if (explodingLayers.length > 0) html += "<div class='lio_crit'>\uD83D\uDEA5 <span class='TRANSLATEME_layer_io_exploding'></span>: " + explodingLayers.join(", ") + "</div>";
		if (constantLayers.length > 0) html += "<div class='lio_crit'>\uD83D\uDEA5 <span class='TRANSLATEME_layer_io_constant_output'></span>: " + constantLayers.join(", ") + "</div>";
		if (dyingLayers.length > 0) html += "<div class='lio_crit'>\uD83D\uDEA5 <span class='TRANSLATEME_layer_io_dying_relu'></span>: " + dyingLayers.join(", ") + "</div>";
		if (saturatedLayers.length > 0) html += "<div class='lio_warn'>\uD83D\uDEA0 <span class='TRANSLATEME_layer_io_saturated'></span>: " + saturatedLayers.join(", ") + "</div>";
		if (vanishingLayers.length > 0) html += "<div class='lio_warn'>\uD83D\uDEA0 <span class='TRANSLATEME_layer_io_vanishing'></span>: " + vanishingLayers.join(", ") + "</div>";
	}

	// Multi-plot section
	html += "<div class='lio_multi_plot'>";

	// Plot 1: Magnitude per layer
	html += "<div><div class='lio_plot_label'><span class='TRANSLATEME_layer_io_magnitude_per_layer'></span></div>";
	html += _barChartSVG(record, function (s) { return Math.abs(s.mean) + s.std; }, function (s) {
		return s.zeroFraction > 0.8 ? "#e74c3c" : s.std < 1e-6 ? "#f39c12" : "#2ecc71";
	});
	html += "</div>";

	// Plot 2: Zero fraction per layer
	html += "<div><div class='lio_plot_label'><span class='TRANSLATEME_layer_io_zero_fraction_per_layer'></span></div>";
	html += _barChartSVG(record, function (s) { return s.zeroFraction; }, function (s) {
		return s.zeroFraction > 0.8 ? "#e74c3c" : s.zeroFraction > 0.5 ? "#f39c12" : "#2ecc71";
	});
	html += "</div>";

	// Plot 3: Std per layer
	html += "<div><div class='lio_plot_label'><span class='TRANSLATEME_layer_io_std_per_layer'></span></div>";
	html += _barChartSVG(record, function (s) { return s.std; }, function (s) {
		return s.std < 1e-6 ? "#e74c3c" : s.std > 100 ? "#f39c12" : "#3498db";
	});
	html += "</div>";

	// Plot 4: Mean flow
	html += "<div><div class='lio_plot_label'><span class='TRANSLATEME_layer_io_mean_flow'></span></div>";
	html += _lineChartSVG(record, function (s) { return s.mean; }, "#00d4ff");
	html += "</div>";

	// Plot 5: Skewness per layer
	html += "<div><div class='lio_plot_label'><span class='TRANSLATEME_layer_io_skewness_per_layer'></span></div>";
	html += _lineChartSVG(record, function (s) { return s.skewness || 0; }, "#9b59b6");
	html += "</div>";

	// Plot 6: Kurtosis per layer
	html += "<div><div class='lio_plot_label'><span class='TRANSLATEME_layer_io_kurtosis_per_layer'></span></div>";
	html += _lineChartSVG(record, function (s) { return s.kurtosis || 0; }, "#e67e22");
	html += "</div>";

	html += "</div>"; // end lio_multi_plot
	html += "</div>"; // end lio_aggregate

	return html;
}

// ============================================================
// CHART HELPERS
// ============================================================

function _barChartSVG(record, valueFn, colorFn) {
	var width = 200, height = 50;
	var values = [];
	var colors = [];

	for (var i = 0; i < record.layers.length; i++) {
		var s = _computeStats(record.layers[i].output);
		if (!s) { values.push(0); colors.push("#555"); continue; }
		var v = valueFn(s);
		values.push(isFinite(v) ? v : 0);
		colors.push(colorFn(s));
	}

	if (values.length === 0) return "";

	var maxVal = Math.max.apply(null, values.map(function (v) { return Math.abs(v); })) || 1;
	var barWidth = Math.max(2, (width / values.length) - 1);

	var svg = "<svg width='100%' viewBox='0 0 " + width + " " + (height + 14) + "' style='display:block; max-width:250px;'>";

	for (var i = 0; i < values.length; i++) {
		var barH = (Math.abs(values[i]) / maxVal) * height;
		var x = i * (barWidth + 1);
		var y = height - barH;

		svg += "<rect x='" + x + "' y='" + y + "' width='" + barWidth +
			"' height='" + barH + "' fill='" + colors[i] + "' opacity='0.85' rx='1'>";
		svg += "<title>" + record.layers[i].layerName + ": " + values[i].toFixed(4) + "</title>";
		svg += "</rect>";
	}

	// X-axis
	svg += "<line x1='0' y1='" + height + "' x2='" + width + "' y2='" + height + "' stroke='currentColor' opacity='0.2' stroke-width='0.5'/>";

	// Labels for first and last
	if (values.length > 0) {
		svg += "<text x='0' y='" + (height + 11) + "' font-size='7' fill='currentColor' opacity='0.4'>0</text>";
		svg += "<text x='" + ((values.length - 1) * (barWidth + 1)) + "' y='" + (height + 11) + "' font-size='7' fill='currentColor' opacity='0.4'>" + (values.length - 1) + "</text>";
	}

	svg += "</svg>";
	return svg;
}

function _lineChartSVG(record, valueFn, color) {
	var width = 200, height = 50;
	var values = [];

	for (var i = 0; i < record.layers.length; i++) {
		var s = _computeStats(record.layers[i].output);
		if (!s) { values.push(0); continue; }
		var v = valueFn(s);
		values.push(isFinite(v) ? v : 0);
	}

	if (values.length < 2) return "";

	var minVal = Math.min.apply(null, values);
	var maxVal = Math.max.apply(null, values);
	var range = maxVal - minVal || 1;

	var points = [];
	for (var i = 0; i < values.length; i++) {
		var x = (i / (values.length - 1)) * width;
		var y = height - ((values[i] - minVal) / range) * height;
		points.push(x.toFixed(1) + "," + y.toFixed(1));
	}

	var svg = "<svg width='100%' viewBox='0 0 " + width + " " + (height + 14) + "' style='display:block; max-width:250px;'>";

	// Zero line if applicable
	if (minVal < 0 && maxVal > 0) {
		var zeroY = height - ((0 - minVal) / range) * height;
		svg += "<line x1='0' y1='" + zeroY + "' x2='" + width + "' y2='" + zeroY + "' stroke='currentColor' opacity='0.2' stroke-width='0.5' stroke-dasharray='2,2'/>";
	}

	// Area fill
	svg += "<polygon points='0," + height + " " + points.join(" ") + " " + width + "," + height + "' fill='" + color + "' opacity='0.1'/>";

	// Line
	svg += "<polyline points='" + points.join(" ") + "' fill='none' stroke='" + color + "' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/>";

	// Dots
	for (var i = 0; i < values.length; i++) {
		var x = (i / (values.length - 1)) * width;
		var y = height - ((values[i] - minVal) / range) * height;
		svg += "<circle cx='" + x.toFixed(1) + "' cy='" + y.toFixed(1) + "' r='2.5' fill='" + color + "' stroke='white' stroke-width='0.5'>";
		svg += "<title>" + record.layers[i].layerName + ": " + values[i].toFixed(4) + "</title>";
		svg += "</circle>";
	}

	// Y-axis labels
	svg += "<text x='0' y='" + (height + 11) + "' font-size='7' fill='currentColor' opacity='0.4'>" + minVal.toFixed(2) + "</text>";
	svg += "<text x='" + (width - 30) + "' y='" + (height + 11) + "' font-size='7' fill='currentColor' opacity='0.4'>" + maxVal.toFixed(2) + "</text>";

	svg += "</svg>";
	return svg;
}
