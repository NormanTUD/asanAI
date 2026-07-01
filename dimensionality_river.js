"use strict";

// ============================================================
// DIMENSIONALITY RIVER - t-SNE per-layer visualization
// Shows how MULTIPLE SAMPLES are represented at each layer.
// Each point = one input sample. Color = class label.
// ============================================================

var DimensionalityRiver = (function () {

	var _SINGLETON_ID = "dimriver_singleton_container";

	var _state = {
		container: null,
		autoUpdateTimer: null,
		perplexity: 30,
		iterations: 200,
		learningRate: 10,
		maxSamples: 150,
		lastResult: null,
		cachedActivations: null, // {layers: [{name, type, activations: [sample0vec, sample1vec, ...]}], labels: [...]}
		isComputing: false
	};

	// ============================================================
	// CONTAINER MANAGEMENT
	// ============================================================

	function _getOrCreateContainer(divOrId) {
		var container = null;
		if (typeof divOrId === "string" && divOrId !== "") {
			container = document.getElementById(divOrId);
			if (container) { _state.container = container; return container; }
		} else if (divOrId instanceof HTMLElement) {
			_state.container = divOrId;
			return divOrId;
		}
		var existing = document.getElementById(_SINGLETON_ID);
		if (existing) { _state.container = existing; return existing; }
		container = document.createElement("div");
		container.id = _SINGLETON_ID;
		document.body.appendChild(container);
		_state.container = container;
		return container;
	}

	// ============================================================
	// COLLECT ACTIVATIONS FOR MULTIPLE SAMPLES
	// This is the key difference: we run many samples through
	// the model and collect each layer's output per sample.
	// ============================================================

	function _collectMultiSampleActivations(callback) {
		if (_state.isComputing) return;

		// Need model and data
		if (typeof model === "undefined" || !model) { callback(null, "dimriver_no_model"); return; }
		if (typeof xy_data_global === "undefined" || !xy_data_global || !xy_data_global.x) { callback(null, "dimriver_no_data"); return; }

		// Check if model is disposed
		try {
			model.layers[0].getWeights();
		} catch (e) {
			callback(null, "dimriver_no_model");
			return;
		}

		_state.isComputing = true;

		try {
			var xTensor = xy_data_global.x;
			var numSamples = xTensor.shape[0];
			var maxSamples = Math.min(_state.maxSamples, numSamples);

			// Get labels
			var labelsResult = _extractLabels(maxSamples);

			// Subsample input data
			var indices = [];
			if (maxSamples < numSamples) {
				var step = numSamples / maxSamples;
				for (var i = 0; i < maxSamples; i++) {
					indices.push(Math.min(Math.floor(i * step), numSamples - 1));
				}
			} else {
				for (var i = 0; i < maxSamples; i++) indices.push(i);
			}

			// Use tf.tidy for the whole operation and a single execute call
			var layerInfos = [];
			var layerOutputSymbols = [];

			for (var i = 0; i < model.layers.length; i++) {
				var layer = model.layers[i];
				if (layer.getClassName && layer.getClassName() === "InputLayer") continue;
				layerInfos.push({
					name: layer.name || ("layer_" + i),
					type: layer.getClassName ? layer.getClassName() : "unknown",
					index: i
				});
				layerOutputSymbols.push(layer.output);
			}

			if (layerOutputSymbols.length === 0) {
				_state.isComputing = false;
				callback(null, "dimriver_no_layers");
				return;
			}

			// Create ONE intermediate model with ALL layer outputs (no dispose issues)
			var multiOutputModel = tf.model({
				inputs: model.input,
				outputs: layerOutputSymbols
			});

			var xSubset = tf.tidy(function () {
				return tf.gather(xTensor, indices);
			});

			// Predict all layers at once
			var allOutputs = multiOutputModel.predict(xSubset);

			// If only one layer, wrap in array
			if (!Array.isArray(allOutputs)) allOutputs = [allOutputs];

			// Extract data from each layer output
			var results = [];
			for (var l = 0; l < allOutputs.length; l++) {
				var outTensor = allOutputs[l];
				var batchSize = outTensor.shape[0];
				var flatSize = outTensor.size / batchSize;

				var flattened = tf.tidy(function () {
					return outTensor.reshape([batchSize, flatSize]);
				});

				var activationData = flattened.arraySync();
				flattened.dispose();

				results.push({
					name: layerInfos[l].name,
					type: layerInfos[l].type,
					index: layerInfos[l].index,
					activations: activationData,
					flatDim: activationData[0] ? activationData[0].length : 0
				});
			}

			// Dispose outputs and subset - but NOT the multiOutputModel's layers
			for (var l = 0; l < allOutputs.length; l++) {
				allOutputs[l].dispose();
			}
			xSubset.dispose();

			// Do NOT dispose multiOutputModel - it shares layers with the original model!
			// Just remove the reference, let GC handle the lightweight wrapper
			multiOutputModel = null;

			_state.isComputing = false;
			_state.cachedActivations = { layers: results, labels: labelsResult, numSamples: maxSamples };
			callback(_state.cachedActivations, null);

		} catch (e) {
			_state.isComputing = false;
			console.error("DimensionalityRiver error:", e);
			callback(null, "dimriver_error");
		}
	}

	function _extractLabels(numSamples) {
		try {
			if (!xy_data_global || !xy_data_global.y) return null;
			var yTensor = xy_data_global.y;
			var yShape = yTensor.shape;
			var yData = yTensor.dataSync();

			var decoded = [];
			if (yShape.length === 2 && yShape[1] > 1) {
				// One-hot: argmax
				var numClasses = yShape[1];
				var totalSamples = yShape[0];
				for (var i = 0; i < totalSamples; i++) {
					var maxIdx = 0, maxVal = -Infinity;
					for (var c = 0; c < numClasses; c++) {
						var val = yData[i * numClasses + c];
						if (val > maxVal) { maxVal = val; maxIdx = c; }
					}
					decoded.push(maxIdx);
				}
			} else {
				// Flat labels
				for (var i = 0; i < yData.length; i++) {
					decoded.push(Math.round(yData[i]));
				}
			}

			// Subsample to match
			var totalAvailable = decoded.length;
			if (totalAvailable >= numSamples) {
				var step = totalAvailable / numSamples;
				var result = [];
				for (var i = 0; i < numSamples; i++) {
					result.push(decoded[Math.min(Math.floor(i * step), totalAvailable - 1)]);
				}
				return result;
			}
			return decoded.slice(0, numSamples);
		} catch (e) { return null; }
	}

	// ============================================================
	// t-SNE IMPLEMENTATION
	// ============================================================

	function _computePairwiseDistances(points) {
		var n = points.length;
		var dist = [];
		for (var i = 0; i < n; i++) dist[i] = new Float64Array(n);
		for (var i = 0; i < n; i++) {
			for (var j = i + 1; j < n; j++) {
				var d = 0;
				for (var k = 0; k < points[i].length; k++) {
					var diff = (points[i][k] || 0) - (points[j][k] || 0);
					d += diff * diff;
				}
				d = Math.sqrt(d);
				dist[i][j] = d;
				dist[j][i] = d;
			}
		}
		return dist;
	}

	function _computePerplexityRow(distances, i, perplexity) {
		var n = distances.length;
		var target = Math.log(perplexity);
		var lo = 1e-10, hi = 1e4, mid = 1.0;
		for (var iter = 0; iter < 50; iter++) {
			mid = (lo + hi) / 2;
			var sum = 0;
			for (var j = 0; j < n; j++) {
				if (j === i) continue;
				sum += Math.exp(-distances[i][j] * distances[i][j] / (2 * mid * mid));
			}
			if (sum === 0) sum = 1e-10;
			var hSum = 0;
			for (var j = 0; j < n; j++) {
				if (j === i) continue;
				var p = Math.exp(-distances[i][j] * distances[i][j] / (2 * mid * mid)) / sum;
				if (p > 1e-10) hSum -= p * Math.log(p);
			}
			if (hSum > target) hi = mid;
			else lo = mid;
		}
		return mid;
	}

	function _computeP(distances, perplexity) {
		var n = distances.length;
		var P = [];
		for (var i = 0; i < n; i++) {
			P[i] = new Float64Array(n);
			var sigma = _computePerplexityRow(distances, i, perplexity);
			var sum = 0;
			for (var j = 0; j < n; j++) {
				if (j === i) continue;
				P[i][j] = Math.exp(-distances[i][j] * distances[i][j] / (2 * sigma * sigma));
				sum += P[i][j];
			}
			if (sum === 0) sum = 1e-10;
			for (var j = 0; j < n; j++) P[i][j] /= sum;
		}
		for (var i = 0; i < n; i++) {
			for (var j = i + 1; j < n; j++) {
				var avg = (P[i][j] + P[j][i]) / (2 * n);
				P[i][j] = avg;
				P[j][i] = avg;
			}
		}
		return P;
	}

	function _tsne(points, opts) {
		opts = opts || {};
		var perplexity = opts.perplexity || _state.perplexity;
		var iterations = opts.iterations || _state.iterations;
		var lr = opts.learningRate || _state.learningRate;
		var n = points.length;

		if (n < 3) return points.map(function () { return [Math.random(), Math.random()]; });
		perplexity = Math.max(2, Math.min(perplexity, Math.floor((n - 1) / 3)));

		var distances = _computePairwiseDistances(points);
		var P = _computeP(distances, perplexity);

		var Y = [];
		for (var i = 0; i < n; i++) Y[i] = [(Math.random() - 0.5) * 0.01, (Math.random() - 0.5) * 0.01];

		var gains = [], prevGrad = [];
		for (var i = 0; i < n; i++) { gains[i] = [1, 1]; prevGrad[i] = [0, 0]; }

		for (var iter = 0; iter < iterations; iter++) {
			var qSum = 0;
			var qMatrix = [];
			for (var i = 0; i < n; i++) qMatrix[i] = new Float64Array(n);
			for (var i = 0; i < n; i++) {
				for (var j = i + 1; j < n; j++) {
					var dx = Y[i][0] - Y[j][0], dy = Y[i][1] - Y[j][1];
					var q = 1.0 / (1.0 + dx * dx + dy * dy);
					qMatrix[i][j] = q; qMatrix[j][i] = q;
					qSum += 2 * q;
				}
			}
			if (qSum === 0) qSum = 1e-10;

			var grad = [];
			for (var i = 0; i < n; i++) {
				var gx = 0, gy = 0;
				for (var j = 0; j < n; j++) {
					if (i === j) continue;
					var q = qMatrix[i][j] / qSum;
					var mult = 4 * (P[i][j] - q) * qMatrix[i][j];
					gx += mult * (Y[i][0] - Y[j][0]);
					gy += mult * (Y[i][1] - Y[j][1]);
				}
				grad[i] = [gx, gy];
			}

			var momentum = iter < 250 ? 0.5 : 0.8;
			for (var i = 0; i < n; i++) {
				for (var d = 0; d < 2; d++) {
					var sign = grad[i][d] > 0 ? 1 : -1;
					var prevSign = prevGrad[i][d] > 0 ? 1 : -1;
					gains[i][d] = (sign === prevSign) ? gains[i][d] * 0.8 + 0.01 : gains[i][d] + 0.2;
					gains[i][d] = Math.max(gains[i][d], 0.01);
					prevGrad[i][d] = momentum * prevGrad[i][d] - lr * gains[i][d] * grad[i][d];
					Y[i][d] += prevGrad[i][d];
				}
			}

			var cx = 0, cy = 0;
			for (var i = 0; i < n; i++) { cx += Y[i][0]; cy += Y[i][1]; }
			cx /= n; cy /= n;
			for (var i = 0; i < n; i++) { Y[i][0] -= cx; Y[i][1] -= cy; }
		}
		return Y;
	}

	// ============================================================
	// METRICS: Cluster separation quality
	// ============================================================

	function _computeSilhouetteScore(embedded, labels) {
		if (!labels || embedded.length < 4) return null;
		var n = embedded.length;
		var uniqueLabels = {};
		for (var i = 0; i < n; i++) uniqueLabels[labels[i]] = true;
		var classes = Object.keys(uniqueLabels);
		if (classes.length < 2) return null;

		var totalSil = 0, count = 0;
		for (var i = 0; i < n; i++) {
			var myClass = labels[i];
			var intraSum = 0, intraCount = 0;
			var interMin = Infinity;

			for (var c = 0; c < classes.length; c++) {
				var cls = parseInt(classes[c]);
				var distSum = 0, distCount = 0;
				for (var j = 0; j < n; j++) {
					if (i === j) continue;
					if (labels[j] !== cls) continue;
					var dx = embedded[i][0] - embedded[j][0];
					var dy = embedded[i][1] - embedded[j][1];
					distSum += Math.sqrt(dx * dx + dy * dy);
					distCount++;
				}
				if (distCount === 0) continue;
				var avgDist = distSum / distCount;
				if (cls === myClass) { intraSum = avgDist; intraCount = 1; }
				else { if (avgDist < interMin) interMin = avgDist; }
			}

			if (intraCount > 0 && interMin < Infinity) {
				var sil = (interMin - intraSum) / Math.max(interMin, intraSum);
				totalSil += sil;
				count++;
			}
		}
		return count > 0 ? totalSil / count : null;
	}

	function _computeClassCentroids(embedded, labels) {
		if (!labels) return null;
		var centroids = {};
		var counts = {};
		for (var i = 0; i < embedded.length; i++) {
			var lbl = labels[i];
			if (!centroids[lbl]) { centroids[lbl] = [0, 0]; counts[lbl] = 0; }
			centroids[lbl][0] += embedded[i][0];
			centroids[lbl][1] += embedded[i][1];
			counts[lbl]++;
		}
		for (var lbl in centroids) {
			centroids[lbl][0] /= counts[lbl];
			centroids[lbl][1] /= counts[lbl];
		}
		return centroids;
	}

	// ============================================================
	// ANALYSIS (runs t-SNE on cached activations)
	// ============================================================

	function _analyzeFromCache(data) {
		if (!data || !data.layers || data.layers.length === 0) {
			return { error: "dimriver_no_layers", layers: [] };
		}

		var results = [];
		for (var i = 0; i < data.layers.length; i++) {
			var layer = data.layers[i];
			var points = layer.activations;
			if (!points || points.length < 3) continue;

			// Limit dimensionality for speed (PCA-like: just take first N dims)
			var maxDim = 50;
			var truncatedPoints = points;
			if (points[0] && points[0].length > maxDim) {
				truncatedPoints = [];
				for (var s = 0; s < points.length; s++) {
					truncatedPoints.push(points[s].slice(0, maxDim));
				}
			}

			var embedded = _tsne(truncatedPoints, {
				perplexity: Math.min(_state.perplexity, Math.floor(truncatedPoints.length / 3)),
				iterations: _state.iterations,
				learningRate: _state.learningRate
			});

			var silhouette = _computeSilhouetteScore(embedded, data.labels);
			var centroids = _computeClassCentroids(embedded, data.labels);

			results.push({
				name: layer.name,
				type: layer.type,
				index: layer.index,
				numSamples: embedded.length,
				originalDim: layer.flatDim,
				embedded: embedded,
				labels: data.labels,
				silhouette: silhouette,
				centroids: centroids
			});
		}

		return {
			layers: results,
			timestamp: Date.now(),
			numSamples: data.numSamples,
			error: results.length === 0 ? "dimriver_no_layers" : null
		};
	}

	// ============================================================
	// SVG RENDERING
	// ============================================================

	var _COLORS = [
		"#e74c3c", "#3498db", "#2ecc71", "#f39c12", "#9b59b6",
		"#1abc9c", "#e67e22", "#34495e", "#16a085", "#c0392b",
		"#2980b9", "#27ae60", "#d35400", "#8e44ad", "#f1c40f"
	];

	function _scatterSVG(layer, width, height) {
		var embedded = layer.embedded;
		var labels = layer.labels;
		if (!embedded || embedded.length < 3) return "<div class='dimriver_empty'>—</div>";

		var margin = 30;
		var plotW = width - 2 * margin;
		var plotH = height - 2 * margin;

		var minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
		for (var i = 0; i < embedded.length; i++) {
			if (embedded[i][0] < minX) minX = embedded[i][0];
			if (embedded[i][0] > maxX) maxX = embedded[i][0];
			if (embedded[i][1] < minY) minY = embedded[i][1];
			if (embedded[i][1] > maxY) maxY = embedded[i][1];
		}
		var rangeX = maxX - minX || 1;
		var rangeY = maxY - minY || 1;

		var svg = "<svg class='dimriver_svg' width='100%' viewBox='0 0 " + width + " " + height + "'>";

		// Background
		svg += "<rect x='" + margin + "' y='" + margin + "' width='" + plotW + "' height='" + plotH + "' fill='rgba(128,128,128,0.02)' stroke='rgba(128,128,128,0.1)' rx='4'/>";

		// Grid
		for (var g = 0; g <= 4; g++) {
			var gx = margin + (g / 4) * plotW;
			var gy = margin + (g / 4) * plotH;
			svg += "<line x1='" + gx + "' y1='" + margin + "' x2='" + gx + "' y2='" + (height - margin) + "' stroke='currentColor' stroke-width='0.3' opacity='0.06'/>";
			svg += "<line x1='" + margin + "' y1='" + gy + "' x2='" + (width - margin) + "' y2='" + gy + "' stroke='currentColor' stroke-width='0.3' opacity='0.06'/>";
		}

		// Draw centroids first (larger, semi-transparent)
		if (layer.centroids) {
			for (var lbl in layer.centroids) {
				var cx = margin + ((layer.centroids[lbl][0] - minX) / rangeX) * plotW;
				var cy = margin + ((layer.centroids[lbl][1] - minY) / rangeY) * plotH;
				var color = _COLORS[Math.abs(parseInt(lbl)) % _COLORS.length];
				svg += "<circle cx='" + cx.toFixed(1) + "' cy='" + cy.toFixed(1) + "' r='12' fill='" + color + "' opacity='0.12' stroke='" + color + "' stroke-width='2' stroke-opacity='0.4'/>";
				svg += "<text x='" + cx.toFixed(1) + "' y='" + (cy + 3).toFixed(1) + "' text-anchor='middle' font-size='8' font-weight='bold' fill='" + color + "' opacity='0.8'>" + lbl + "</text>";
			}
		}

		// Points
		for (var i = 0; i < embedded.length; i++) {
			var x = margin + ((embedded[i][0] - minX) / rangeX) * plotW;
			var y = margin + ((embedded[i][1] - minY) / rangeY) * plotH;

			var color = "#8e44ad";
			if (labels && labels[i] !== undefined && labels[i] !== null) {
				color = _COLORS[Math.abs(labels[i]) % _COLORS.length];
			}

			svg += "<circle cx='" + x.toFixed(1) + "' cy='" + y.toFixed(1) + "' r='3.5' fill='" + color + "' opacity='0.65'>";
			svg += "<title>" + (labels ? "Sample " + i + " | Class " + labels[i] : "Sample " + i) + "</title>";
			svg += "</circle>";
		}

		// Silhouette score badge
		if (layer.silhouette !== null && layer.silhouette !== undefined) {
			var silVal = layer.silhouette.toFixed(3);
			var silColor = layer.silhouette > 0.5 ? "#27ae60" : (layer.silhouette > 0.2 ? "#f39c12" : "#e74c3c");
			svg += "<rect x='" + (width - margin - 90) + "' y='" + (margin + 4) + "' width='86' height='20' rx='4' fill='rgba(255,255,255,0.85)' stroke='" + silColor + "' stroke-width='1'/>";
			svg += "<text x='" + (width - margin - 47) + "' y='" + (margin + 17) + "' text-anchor='middle' font-size='9' fill='" + silColor + "' font-weight='bold'>Silhouette: " + silVal + "</text>";
		}

		// Axis labels
		svg += "<text x='" + (width / 2) + "' y='" + (height - 6) + "' text-anchor='middle' font-size='9' fill='currentColor' opacity='0.4'>t-SNE dim 1</text>";
		svg += "<text x='8' y='" + (height / 2) + "' text-anchor='middle' font-size='9' fill='currentColor' opacity='0.4' transform='rotate(-90, 8, " + (height / 2) + ")'>t-SNE dim 2</text>";

		// Info: dim and samples
		svg += "<text x='" + (margin + 4) + "' y='" + (margin + 14) + "' font-size='8' fill='currentColor' opacity='0.4'>" + layer.numSamples + " samples, " + layer.originalDim + "D→2D</text>";

		svg += "</svg>";
		return svg;
	}

	function _riverOverviewSVG(results) {
		if (!results || results.length < 2) return "";

		var width = 700, height = 140;
		var margin = { left: 50, right: 30, top: 25, bottom: 40 };
		var plotW = width - margin.left - margin.right;
		var plotH = height - margin.top - margin.bottom;

		var svg = "<svg class='dimriver_svg' width='100%' viewBox='0 0 " + width + " " + height + "'>";

		// Compute silhouette scores per layer for the river
		var scores = [];
		for (var l = 0; l < results.length; l++) {
			scores.push(results[l].silhouette !== null ? results[l].silhouette : 0);
		}

		var maxScore = 1.0; // Silhouette is [-1, 1]

		// Draw river as area chart of silhouette scores
		var pathTop = "M";
		var pathBot = "";
		for (var l = 0; l < results.length; l++) {
			var x = margin.left + (l / (results.length - 1)) * plotW;
			var scoreNorm = (scores[l] + 1) / 2; // normalize to [0,1]
			var halfH = scoreNorm * (plotH / 2);
			var cy = margin.top + plotH / 2;
			pathTop += (l === 0 ? "" : " L") + x.toFixed(1) + " " + (cy - halfH).toFixed(1);
			pathBot = x.toFixed(1) + " " + (cy + halfH).toFixed(1) + (pathBot ? " L" + pathBot : "");
		}
		pathTop += " L" + pathBot + " Z";

		// Gradient fill based on score
		svg += "<defs><linearGradient id='riverGrad' x1='0%' y1='0%' x2='100%' y2='0%'>";
		for (var l = 0; l < results.length; l++) {
			var pct = (l / (results.length - 1) * 100).toFixed(0);
			var color = scores[l] > 0.5 ? "rgba(46,204,113,0.25)" : (scores[l] > 0.2 ? "rgba(243,156,18,0.25)" : "rgba(231,76,60,0.25)");
			svg += "<stop offset='" + pct + "%' stop-color='" + color + "'/>";
		}
		svg += "</linearGradient></defs>";

		svg += "<path d='" + pathTop + "' fill='url(#riverGrad)' stroke='#3498db' stroke-width='1.5'/>";

		// Score line
		var scoreLine = "M";
		for (var l = 0; l < results.length; l++) {
			var x = margin.left + (l / (results.length - 1)) * plotW;
			var y = margin.top + plotH - ((scores[l] + 1) / 2) * plotH;
			scoreLine += (l === 0 ? "" : " L") + x.toFixed(1) + " " + y.toFixed(1);
		}
		svg += "<path d='" + scoreLine + "' fill='none' stroke='#2980b9' stroke-width='2' stroke-linecap='round'/>";

		// Layer markers with score
		for (var l = 0; l < results.length; l++) {
			var x = margin.left + (l / (results.length - 1)) * plotW;
			var y = margin.top + plotH - ((scores[l] + 1) / 2) * plotH;
			var color = scores[l] > 0.5 ? "#27ae60" : (scores[l] > 0.2 ? "#f39c12" : "#e74c3c");
			svg += "<circle cx='" + x.toFixed(1) + "' cy='" + y.toFixed(1) + "' r='5' fill='" + color + "' stroke='white' stroke-width='1.5'/>";
			svg += "<text x='" + x.toFixed(1) + "' y='" + (y - 9).toFixed(1) + "' text-anchor='middle' font-size='8' fill='" + color + "' font-weight='bold'>" + scores[l].toFixed(2) + "</text>";
			svg += "<text x='" + x.toFixed(1) + "' y='" + (height - 8) + "' text-anchor='middle' font-size='7' fill='currentColor' opacity='0.5'>" + results[l].name.substring(0, 10) + "</text>";
		}

		// Y-axis labels
		svg += "<text x='" + (margin.left - 5) + "' y='" + (margin.top + 6) + "' text-anchor='end' font-size='7' fill='currentColor' opacity='0.4'>1.0</text>";
		svg += "<text x='" + (margin.left - 5) + "' y='" + (margin.top + plotH) + "' text-anchor='end' font-size='7' fill='currentColor' opacity='0.4'>-1.0</text>";
		svg += "<text x='" + (margin.left - 5) + "' y='" + (margin.top + plotH / 2 + 3) + "' text-anchor='end' font-size='7' fill='currentColor' opacity='0.4'>0.0</text>";

		// Zero line
		var zeroY = margin.top + plotH / 2;
		svg += "<line x1='" + margin.left + "' y1='" + zeroY + "' x2='" + (width - margin.right) + "' y2='" + zeroY + "' stroke='currentColor' stroke-width='0.5' opacity='0.15' stroke-dasharray='3,3'/>";

		// Title
		svg += "<text x='" + (width / 2) + "' y='14' text-anchor='middle' font-size='9' fill='currentColor' opacity='0.6'><tspan class='TRANSLATEME_dimriver_river_overview'></tspan></text>";

		svg += "</svg>";
		return svg;
	}

	// ============================================================
	// MAIN RENDER
	// ============================================================

	function render(divOrId) {
		var container = _getOrCreateContainer(divOrId);
		_injectStyles();

		// Mark as initialized and start visibility watching
		if (!_initialized) {
			_initialized = true;
			_startVisibilityWatch();
		}
		_lastRenderTime = Date.now();

		// If container is empty (first render), show loading
		// Otherwise keep existing content visible during computation
		if (!container.querySelector(".dimriver_container")) {
			container.innerHTML = "<div class='dimriver_container'><div class='dimriver_loading'><span class='TRANSLATEME_calculating'></span>...</div></div>";
			_triggerTranslations();
		}

		// Use setTimeout to allow UI to update before heavy computation
		setTimeout(function () {
			// Double-check visibility before expensive computation
			if (!_isContainerVisible()) {
				return;
			}

			_collectMultiSampleActivations(function (data, error) {
				if (error || !data) {
					var html = "<div class='dimriver_container'>";
					html += "<div class='dimriver_header'><h2><span class='TRANSLATEME_dimriver_title'></span></h2></div>";
					html += "<p class='dimriver_subtitle'><span class='TRANSLATEME_dimriver_subtitle'></span></p>";
					html += "<div class='dimriver_error'><span class='TRANSLATEME_" + (error || "dimriver_no_data") + "'></span></div>";
					html += "<p style='text-align:center; opacity:0.5; font-size:0.85em;'><span class='TRANSLATEME_dimriver_hint_train'></span></p>";
					html += "</div>";
					container.innerHTML = html;
					_triggerTranslations();
					return;
				}

				var result = _analyzeFromCache(data);
				_state.lastResult = result;
				_renderResult(container, result);
			});
		}, 50);

		return container;
	}

	function _smoothSwap(container, newHtml) {
		// If container has existing content, crossfade
		var existing = container.querySelector(".dimriver_container");
		if (existing) {
			// Create new content off-screen, then swap with opacity transition
			existing.classList.add("dimriver_fade_out");
			setTimeout(function () {
				container.innerHTML = newHtml;
				// Force reflow then add fade-in
				var newEl = container.querySelector(".dimriver_container");
				if (newEl) {
					newEl.classList.add("dimriver_fade_in");
				}
			}, 120); // Short fade-out duration
		} else {
			container.innerHTML = newHtml;
		}
	}

	function _renderResult(container, result) {
		var html = "<div class='dimriver_container dimriver_fade_in'>";

		// Header
		html += "<div class='dimriver_header'>";
		html += "<h2><span class='TRANSLATEME_dimriver_title'></span></h2>";
		html += "<div class='dimriver_controls'>";
		html += "<button class='dimriver_btn' onclick='DimensionalityRiver.refresh()' title='Refresh'>⟳</button>";
		html += "<button class='dimriver_btn " + (_state.autoUpdateTimer ? "dimriver_btn_active" : "") + "' onclick='DimensionalityRiver.toggleAutoUpdate()'>" + (_state.autoUpdateTimer ? "⏸" : "▶") + "</button>";
		html += "</div></div>";

		html += "<p class='dimriver_subtitle'><span class='TRANSLATEME_dimriver_subtitle'></span> | " + result.numSamples + " samples | " + new Date().toLocaleTimeString() + "</p>";

		if (result.error) {
			html += "<div class='dimriver_error'><span class='TRANSLATEME_" + result.error + "'></span></div>";
			html += "</div>";
			_smoothSwap(container, html);
			_triggerTranslations();
			return;
		}

		// Interpretation summary
		html += _renderInterpretationSummary(result);

		// Sliders
		html += "<div class='dimriver_sliders'>";
		html += _renderSlider("perplexity", "dimriver_perplexity", 5, 50, _state.perplexity, 5);
		html += _renderSlider("iterations", "dimriver_iterations", 50, 500, _state.iterations, 50);
		html += _renderSlider("maxSamples", "dimriver_max_points", 30, 300, _state.maxSamples, 10);
		html += "</div>";

		// River overview (silhouette progression)
		if (result.layers.length >= 2) {
			html += "<div class='dimriver_section'>";
			html += "<div class='dimriver_section_title'><span class='TRANSLATEME_dimriver_river_overview'></span></div>";
			html += "<p class='dimriver_explanation'><span class='TRANSLATEME_dimriver_river_explanation'></span></p>";
			html += _riverOverviewSVG(result.layers);
			html += "</div>";
		}

		// Per-layer scatter plots
		html += "<div class='dimriver_section'>";
		html += "<div class='dimriver_section_title'><span class='TRANSLATEME_dimriver_per_layer'></span></div>";
		html += "<p class='dimriver_explanation'><span class='TRANSLATEME_dimriver_scatter_explanation'></span></p>";
		html += "</div>";

		html += "<div class='dimriver_grid'>";
		for (var i = 0; i < result.layers.length; i++) {
			var layer = result.layers[i];
			html += "<div class='dimriver_card'>";
			html += "<div class='dimriver_card_header'>";
			html += "<strong>" + _escapeHtml(layer.name) + "</strong>";
			html += " <span class='dimriver_badge'>" + layer.type + "</span>";
			html += "</div>";
			html += _scatterSVG(layer, 320, 320);
			html += "</div>";
		}
		html += "</div>";

		// Legend
		if (result.layers.length > 0 && result.layers[0].labels) {
			var numClasses = 0;
			var lbls = result.layers[0].labels;
			for (var i = 0; i < lbls.length; i++) {
				if (lbls[i] >= numClasses) numClasses = lbls[i] + 1;
			}
			if (numClasses > 0 && numClasses <= 15) {
				html += "<div class='dimriver_legend'>";
				for (var c = 0; c < numClasses; c++) {
					var labelName = (typeof labels !== "undefined" && labels[c]) ? labels[c] : "Class " + c;
					html += "<div class='dimriver_legend_item'><div class='dimriver_legend_dot' style='background:" + _COLORS[c % _COLORS.length] + ";'></div>" + _escapeHtml(labelName) + "</div>";
				}
				html += "</div>";
			}
		}

		html += "</div>";

		_smoothSwap(container, html);
		_bindSliders();
		_triggerTranslations();
	}

	// ============================================================
	// INTERPRETATION SUMMARY
	// ============================================================

	function _renderInterpretationSummary(result) {
		if (!result || !result.layers || result.layers.length === 0) return "";

		var html = "<div class='dimriver_summary'>";

		// Check silhouette progression
		var hasLabels = result.layers[0].labels !== null;
		var silhouettes = [];
		for (var i = 0; i < result.layers.length; i++) {
			if (result.layers[i].silhouette !== null) silhouettes.push(result.layers[i].silhouette);
		}

		if (hasLabels && silhouettes.length >= 2) {
			var first = silhouettes[0];
			var last = silhouettes[silhouettes.length - 1];
			var improvement = last - first;

			var icon, message, msgClass;
			if (last > 0.5) {
				icon = "✅"; message = "dimriver_interpretation_good"; msgClass = "dimriver_good";
			} else if (last > 0.2) {
				icon = "⚠️"; message = "dimriver_interpretation_moderate"; msgClass = "dimriver_moderate";
			} else {
				icon = "❌"; message = "dimriver_interpretation_poor"; msgClass = "dimriver_poor";
			}

			html += "<div class='dimriver_summary_row " + msgClass + "'>";
			html += "<span class='dimriver_summary_icon'>" + icon + "</span>";
			html += "<span class='TRANSLATEME_" + message + "'></span>";
			html += " (Silhouette: " + first.toFixed(3) + " → " + last.toFixed(3);
			html += ", Δ = " + (improvement >= 0 ? "+" : "") + improvement.toFixed(3) + ")";
			html += "</div>";
		} else if (!hasLabels) {
			html += "<div class='dimriver_summary_row dimriver_info'>";
			html += "<span class='dimriver_summary_icon'>ℹ️</span>";
			html += "<span class='TRANSLATEME_dimriver_no_labels_hint'></span>";
			html += "</div>";
		}

		html += "</div>";
		return html;
	}

	// ============================================================
	// SLIDER RENDERING & BINDING
	// ============================================================

	function _renderSlider(key, labelKey, min, max, value, step) {
		return "<div class='dimriver_slider_item'>" +
			"<label class='dimriver_slider_label'><span class='TRANSLATEME_" + labelKey + "'></span>: <span class='dimriver_slider_val' data-key='" + key + "'>" + value + "</span></label>" +
			"<input type='range' class='dimriver_slider_input' data-key='" + key + "' min='" + min + "' max='" + max + "' step='" + step + "' value='" + value + "'/>" +
			"</div>";
	}

	function _bindSliders() {
		if (!_state.container) return;
		var sliders = _state.container.querySelectorAll(".dimriver_slider_input");
		for (var i = 0; i < sliders.length; i++) {
			sliders[i].addEventListener("input", function () {
				var key = this.dataset.key;
				var val = parseFloat(this.value);
				if (key && !isNaN(val)) {
					_state[key] = val;
					var display = _state.container.querySelector(".dimriver_slider_val[data-key='" + key + "']");
					if (display) display.textContent = val;
				}
			});
			sliders[i].addEventListener("change", function () {
				_state.cachedActivations = null; // Force re-collect if maxSamples changed
				render(_state.container);
			});
		}
	}

	// ============================================================
	// HELPERS
	// ============================================================

	function _escapeHtml(str) {
		if (!str) return "";
		return String(str).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
	}

	function _triggerTranslations() {
		try {
			if (typeof update_translations === "function") update_translations();
		} catch (e) { }
	}

	// ============================================================
	// AUTO-UPDATE
	// ============================================================

	function startAutoUpdate(intervalMs) {
		stopAutoUpdate();
		_state.autoUpdateTimer = setInterval(function () {
			try { _state.cachedActivations = null; render(_state.container); } catch (e) { }
		}, intervalMs || 8000);
	}

	function stopAutoUpdate() {
		if (_state.autoUpdateTimer) {
			clearInterval(_state.autoUpdateTimer);
			_state.autoUpdateTimer = null;
		}
	}

	function toggleAutoUpdate() {
		if (_state.autoUpdateTimer) stopAutoUpdate();
		else startAutoUpdate();
		render(_state.container);
	}

	function refresh() {
		_state.cachedActivations = null;
		render(_state.container);
	}

	// ============================================================
	// STYLES
	// ============================================================

	function _injectStyles() {
		if (document.getElementById("dimriver_styles")) return;
		var style = document.createElement("style");
		style.id = "dimriver_styles";
		style.textContent = [
			".dimriver_container { padding: 16px; font-family: inherit; }",
			".dimriver_container h2 { margin: 0 0 4px 0; font-size: 1.4em; }",
			".dimriver_header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px; }",
			".dimriver_controls { display: flex; gap: 6px; }",
			".dimriver_btn { border: 1px solid rgba(128,128,128,0.3); background: rgba(128,128,128,0.06); border-radius: 6px; padding: 4px 10px; cursor: pointer; font-size: 1em; transition: all 0.2s; }",
			".dimriver_btn:hover { background: rgba(128,128,128,0.15); }",
			".dimriver_btn_active { background: rgba(46,204,113,0.15); border-color: rgba(46,204,113,0.4); }",
			".dimriver_subtitle { opacity: 0.55; margin: 0 0 12px 0; font-size: 0.82em; }",
			".dimriver_section { margin-bottom: 16px; }",
			".dimriver_section_title { font-size: 0.85em; font-weight: 600; margin-bottom: 6px; opacity: 0.7; }",
			".dimriver_explanation { font-size: 0.72em; opacity: 0.55; margin-bottom: 8px; line-height: 1.4; padding: 5px 8px; background: rgba(52,152,219,0.04); border-radius: 4px; border-left: 3px solid rgba(52,152,219,0.3); }",
			".dimriver_grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 14px; }",
			".dimriver_card { border: 2px solid rgba(128,128,128,0.15); border-radius: 10px; padding: 12px; background: rgba(128,128,128,0.02); transition: box-shadow 0.3s; }",
			".dimriver_card:hover { box-shadow: 0 3px 14px rgba(0,0,0,0.07); }",
			".dimriver_card_header { display: flex; align-items: center; gap: 8px; margin-bottom: 8px; flex-wrap: wrap; }",
			".dimriver_badge { font-size: 0.7em; opacity: 0.55; background: rgba(128,128,128,0.08); padding: 2px 8px; border-radius: 4px; }",
			".dimriver_legend { display: flex; gap: 12px; margin: 12px 0; font-size: 0.78em; opacity: 0.7; flex-wrap: wrap; justify-content: center; }",
			".dimriver_legend_item { display: flex; align-items: center; gap: 4px; }",
			".dimriver_legend_dot { width: 9px; height: 9px; border-radius: 50%; }",
			".dimriver_sliders { border: 1px solid rgba(128,128,128,0.15); border-radius: 8px; padding: 12px; margin-bottom: 14px; background: rgba(128,128,128,0.02); display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 10px; }",
			".dimriver_slider_item { display: flex; flex-direction: column; gap: 3px; }",
			".dimriver_slider_label { font-size: 0.72em; opacity: 0.6; }",
			".dimriver_slider_val { font-weight: bold; }",
			".dimriver_slider_input { width: 100%; cursor: pointer; accent-color: #9b59b6; }",
			".dimriver_error { padding: 24px; text-align: center; opacity: 0.5; font-size: 1.05em; }",
			".dimriver_empty { text-align: center; opacity: 0.3; padding: 20px; font-size: 1.5em; }",
			".dimriver_svg { display: block; }",
			".dimriver_loading { padding: 40px; text-align: center; opacity: 0.6; font-size: 1.1em; }",
			".dimriver_summary { margin-bottom: 14px; padding: 10px 14px; border-radius: 8px; border: 1px solid rgba(128,128,128,0.15); background: rgba(128,128,128,0.02); }",
			".dimriver_summary_row { display: flex; align-items: center; gap: 8px; font-size: 0.85em; padding: 4px 0; }",
			".dimriver_summary_icon { font-size: 1.2em; }",
			".dimriver_good { color: #27ae60; }",
			".dimriver_moderate { color: #f39c12; }",
			".dimriver_poor { color: #e74c3c; }",
			".dimriver_info { color: #3498db; opacity: 0.7; }",
			".dimriver_container { padding: 16px; font-family: inherit; opacity: 1; transition: opacity 0.15s ease-in-out; }",
			".dimriver_fade_out { opacity: 0.3; transition: opacity 0.12s ease-out; }",
			".dimriver_fade_in { animation: dimriver_fadein 0.2s ease-in-out; }",
			"@keyframes dimriver_fadein { from { opacity: 0.3; } to { opacity: 1; } }",
		].join("\n");
		document.head.appendChild(style);
	}

	// ============================================================
	// VISIBILITY-BASED AUTO-REFRESH
	// Once initialized, checks every 5s if visible and re-renders
	// ============================================================

	var _visibilityTimer = null;
	var _initialized = false;
	var _lastRenderTime = 0;
	var _MIN_RENDER_INTERVAL = 5000; // 5 seconds

	function _isContainerVisible() {
		if (!_state.container) return false;
		// Check offsetParent (null = hidden via display:none or not in DOM)
		if (_state.container.offsetParent === null) return false;
		// Check computed visibility
		var style = window.getComputedStyle(_state.container);
		if (style.display === "none" || style.visibility === "hidden") return false;
		// Check aria-hidden (for tab panels)
		if (_state.container.getAttribute("aria-hidden") === "true") return false;
		// Check if any parent has aria-hidden or display:none
		var parent = _state.container.parentElement;
		while (parent && parent !== document.body) {
			var pStyle = window.getComputedStyle(parent);
			if (pStyle.display === "none" || pStyle.visibility === "hidden") return false;
			if (parent.getAttribute("aria-hidden") === "true") return false;
			parent = parent.parentElement;
		}
		return true;
	}

	function _startVisibilityWatch() {
		if (_visibilityTimer) return; // Already watching
		_visibilityTimer = setInterval(function () {
			if (!_initialized) return;
			if (_state.isComputing) return;
			if (!_isContainerVisible()) return;

			var now = Date.now();
			if (now - _lastRenderTime < _MIN_RENDER_INTERVAL) return;

			// Check if model exists and is not disposed
			try {
				if (typeof model === "undefined" || !model) return;
				model.layers[0].getWeights();
			} catch (e) {
				return; // Model disposed, skip
			}

			_lastRenderTime = now;
			_state.cachedActivations = null;
			render(_state.container);
		}, 5000);
	}

	function _stopVisibilityWatch() {
		if (_visibilityTimer) {
			clearInterval(_visibilityTimer);
			_visibilityTimer = null;
		}
	}

	// ============================================================
	// AUTO-UPDATE (manual toggle, separate from visibility watch)
	// ============================================================

	function startAutoUpdate(intervalMs) {
		stopAutoUpdate();
		_state.autoUpdateTimer = setInterval(function () {
			if (_state.isComputing) return;
			if (!_isContainerVisible()) return;
			try {
				_state.cachedActivations = null;
				_lastRenderTime = Date.now();
				render(_state.container);
			} catch (e) { }
		}, intervalMs || 8000);
	}

	function stopAutoUpdate() {
		if (_state.autoUpdateTimer) {
			clearInterval(_state.autoUpdateTimer);
			_state.autoUpdateTimer = null;
		}
	}

	function toggleAutoUpdate() {
		if (_state.autoUpdateTimer) stopAutoUpdate();
		else startAutoUpdate();
		render(_state.container);
	}

	function refresh() {
		_state.cachedActivations = null;
		_lastRenderTime = Date.now();
		render(_state.container);
	}

	// ============================================================
	// PUBLIC API
	// ============================================================

	return {
		render: render,
		refresh: refresh,
		startAutoUpdate: startAutoUpdate,
		stopAutoUpdate: stopAutoUpdate,
		toggleAutoUpdate: toggleAutoUpdate,
		stopVisibilityWatch: _stopVisibilityWatch,
		getLastResult: function () { return _state.lastResult; },
		getState: function () { return _state; },
		isVisible: _isContainerVisible,
		setConfig: function (cfg) {
			if (cfg && typeof cfg === "object") {
				for (var k in cfg) {
					if (_state.hasOwnProperty(k)) _state[k] = cfg[k];
				}
			}
		}
	};
})();

// ============================================================
// GLOBAL CONVENIENCE FUNCTION
// ============================================================

function dimensionalityRiver(divOrId) {
	return DimensionalityRiver.render(divOrId);
}
