"use strict";

// ============================================================
// ACTIVATION ATLAS - Dense mosaic of gradient-ascent generated
// images covering the model's learned activation space.
// NO TRAINING DATA REQUIRED - explores the weight space directly.
// ============================================================

var ActivationAtlas = (function () {

	var _SINGLETON_ID = "activation_atlas_singleton";
	var _state = {
		container: null,
		canvas: null,
		ctx: null,
		layerIndex: -1,
		gridSize: 10,
		featureVisSteps: 25,
		featureVisLR: 0.5,
		zoom: 1,
		panX: 0,
		panY: 0,
		isDragging: false,
		dragStartX: 0,
		dragStartY: 0,
		panStartX: 0,
		panStartY: 0,
		gridCells: null,
		hoveredCell: null,
		isComputing: false,
		canvasWidth: 900,
		canvasHeight: 900,
		lastComputeTime: 0
	};

	// ============================================================
	// CONTAINER MANAGEMENT
	// ============================================================

	function _getOrCreateContainer(divOrId) {
		var existing = document.getElementById(_SINGLETON_ID);
		if (existing && existing.parentElement) {
			existing.parentElement.removeChild(existing);
		}

		var container = null;
		if (typeof divOrId === "string" && divOrId !== "") {
			container = document.getElementById(divOrId);
		} else if (divOrId instanceof HTMLElement) {
			container = divOrId;
		}

		if (!container) {
			container = document.createElement("div");
			container.id = _SINGLETON_ID;
			document.body.appendChild(container);
		}

		container.innerHTML = "";
		_state.container = container;
		return container;
	}

	// ============================================================
	// t-SNE (lightweight)
	// ============================================================

	function _euclideanDist(a, b) {
		var sum = 0;
		for (var i = 0; i < a.length; i++) {
			var d = (a[i] || 0) - (b[i] || 0);
			sum += d * d;
		}
		return Math.sqrt(sum);
	}

	function _computeDistances(points) {
		var n = points.length;
		var dist = [];
		for (var i = 0; i < n; i++) {
			dist[i] = new Float64Array(n);
		}
		for (var i = 0; i < n; i++) {
			for (var j = i + 1; j < n; j++) {
				var d = _euclideanDist(points[i], points[j]);
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

	function _tsne(points, perplexity, iterations) {
		var n = points.length;
		if (n < 3) return points.map(function () { return [Math.random(), Math.random()]; });
		perplexity = Math.max(2, Math.min(perplexity, Math.floor((n - 1) / 3)));

		var distances = _computeDistances(points);

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

		var Y = [];
		for (var i = 0; i < n; i++) Y[i] = [(Math.random() - 0.5) * 0.01, (Math.random() - 0.5) * 0.01];

		var gains = [], prevGrad = [];
		for (var i = 0; i < n; i++) { gains[i] = [1, 1]; prevGrad[i] = [0, 0]; }

		var lr = 10;
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
					var qij = qMatrix[i][j] / qSum;
					var mult = 4 * (P[i][j] - qij) * qMatrix[i][j];
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
	// GRADIENT ASCENT - Optimize input to match target activation
	// ============================================================

	function _generateFeatureVis(targetActivation, layerIdx, inputShape, steps, lr) {
		var targetLayer = model.layers[layerIdx];
		var extractModel = tf.model({ inputs: model.input, outputs: targetLayer.output });
		var targetTensor = tf.tensor1d(targetActivation);

		var inputImg = tf.variable(tf.randomUniform(inputShape, -0.01, 0.01));

		for (var step = 0; step < steps; step++) {
			var grads = tf.tidy(function () {
				return tf.grad(function (img) {
					var activation = extractModel.predict(img.reshape(inputShape));
					var flat = activation.reshape([activation.size]);
					var dotProd = flat.mul(targetTensor).sum();
					var normA = flat.norm().add(1e-8);
					var normB = targetTensor.norm().add(1e-8);
					return dotProd.div(normA.mul(normB));
				})(inputImg);
			});

			tf.tidy(function () {
				var gradNorm = grads.norm().add(1e-8);
				var normalized = grads.div(gradNorm);
				inputImg.assign(inputImg.add(normalized.mul(lr)));
			});
			grads.dispose();

			if (step > 0 && step % 10 === 0) {
				tf.tidy(function () {
					var current = inputImg.reshape(inputShape);
					var clipped = current.clipByValue(-1.5, 1.5);
					inputImg.assign(clipped.reshape(inputImg.shape));
				});
			}
		}

		var result = tf.tidy(function () {
			var img = inputImg.reshape(inputShape).squeeze([0]);
			var minVal = img.min();
			var maxVal = img.max();
			var range = maxVal.sub(minVal).add(1e-8);
			return img.sub(minVal).div(range).mul(255).clipByValue(0, 255).toInt();
		});

		var data = result.dataSync();
		result.dispose();
		inputImg.dispose();
		targetTensor.dispose();

		return data;
	}

	function _pixelDataToCanvas(pixelData, imgH, imgW, channels) {
		var canvas = document.createElement("canvas");
		canvas.width = imgW;
		canvas.height = imgH;
		var ctx = canvas.getContext("2d");
		var imageData = ctx.createImageData(imgW, imgH);

		for (var i = 0; i < imgH * imgW; i++) {
			if (channels === 3) {
				imageData.data[i * 4] = pixelData[i * 3];
				imageData.data[i * 4 + 1] = pixelData[i * 3 + 1];
				imageData.data[i * 4 + 2] = pixelData[i * 3 + 2];
			} else {
				imageData.data[i * 4] = pixelData[i];
				imageData.data[i * 4 + 1] = pixelData[i];
				imageData.data[i * 4 + 2] = pixelData[i];
			}
			imageData.data[i * 4 + 3] = 255;
		}
		ctx.putImageData(imageData, 0, 0);
		return canvas;
	}

	// ============================================================
	// WEIGHT-BASED ACTIVATION SPACE EXPLORATION
	// Extract "prototype directions" from the layer's weights,
	// project them to 2D, grid the space, and interpolate to fill.
	// ============================================================

	function _extractPrototypeActivations(layerIdx) {
		// Strategy: Use the weight columns/rows of the target layer
		// (or the layer after it) as prototype activation directions.
		// These represent the "features" the layer has learned to detect.

		var targetLayer = model.layers[layerIdx];
		var weights = targetLayer.getWeights();

		if (!weights || weights.length === 0) {
			// Try the next layer's incoming weights
			for (var i = layerIdx + 1; i < model.layers.length; i++) {
				weights = model.layers[i].getWeights();
				if (weights && weights.length > 0) break;
			}
		}

		if (!weights || weights.length === 0) return null;

		// Get the kernel (first weight tensor, ignoring bias)
		var kernel = weights[0];
		var kernelShape = kernel.shape;
		var kernelData;

		// For dense layers: shape is [inputDim, outputDim]
		// Each column = one neuron's incoming weight pattern
		// For conv layers: shape is [h, w, inChannels, outChannels]
		// Each filter = one feature detector

		var numPrototypes, prototypeSize;

		if (kernelShape.length === 2) {
			// Dense: columns are prototypes
			// We want the OUTPUT neurons as prototypes (what the layer produces)
			numPrototypes = kernelShape[1];
			prototypeSize = kernelShape[1]; // activation space dimension
			// Each prototype = a one-hot direction in activation space
			// But better: use random combinations of the weight columns
			kernelData = kernel.arraySync();
		} else if (kernelShape.length === 4) {
			// Conv: [h, w, inC, outC] — each filter is a prototype
			numPrototypes = kernelShape[3];
			var flatKernel = tf.tidy(function () {
				return kernel.reshape([kernelShape[0] * kernelShape[1] * kernelShape[2], kernelShape[3]]);
			});
			kernelData = flatKernel.arraySync();
			flatKernel.dispose();
			prototypeSize = kernelShape[3];
		} else {
			return null;
		}

		// Build the activation-space dimension from the target layer output
		var extractModel = tf.model({ inputs: model.input, outputs: targetLayer.output });
		var outputShape = extractModel.outputShape;
		var flatOutputSize;
		if (Array.isArray(outputShape[0])) {
			flatOutputSize = outputShape.slice(1).reduce(function (a, b) { return a * b; }, 1);
		} else {
			flatOutputSize = outputShape.slice(1).reduce(function (a, b) { return a * b; }, 1);
		}

		// Generate prototype activation vectors:
		// Use one-hot directions + random interpolations between them
		var prototypes = [];
		var maxPrototypes = Math.min(numPrototypes, 80);

		// Pure one-hot prototypes (individual neurons/filters)
		for (var i = 0; i < maxPrototypes; i++) {
			var proto = new Float32Array(flatOutputSize);
			// Activate a single unit (or a small group for conv)
			if (flatOutputSize === numPrototypes) {
				// Dense layer: one-hot
				proto[i] = 1.0;
			} else {
				// Conv layer: activate one filter across all spatial positions
				var spatialSize = flatOutputSize / numPrototypes;
				for (var s = 0; s < spatialSize; s++) {
					proto[s * numPrototypes + i] = 1.0;
				}
			}
			prototypes.push({ activation: proto, neuronIdx: i, isMixed: false });
		}

		// Add interpolated/mixed prototypes between pairs
		var numMixed = Math.min(maxPrototypes, 40);
		for (var m = 0; m < numMixed; m++) {
			var idxA = Math.floor(Math.random() * maxPrototypes);
			var idxB = Math.floor(Math.random() * maxPrototypes);
			if (idxA === idxB) idxB = (idxB + 1) % maxPrototypes;
			var alpha = 0.2 + Math.random() * 0.6; // mix ratio

			var mixed = new Float32Array(flatOutputSize);
			var protoA = prototypes[idxA].activation;
			var protoB = prototypes[idxB].activation;
			for (var d = 0; d < flatOutputSize; d++) {
				mixed[d] = protoA[d] * alpha + protoB[d] * (1 - alpha);
			}
			prototypes.push({ activation: mixed, neuronIdx: -1, isMixed: true, mixA: idxA, mixB: idxB, alpha: alpha });
		}

		return {
			prototypes: prototypes,
			flatOutputSize: flatOutputSize,
			numNeurons: numPrototypes
		};
	}

	// ============================================================
	// CORE: Build atlas from weight-derived prototypes
	// ============================================================

	function _getTargetLayerIndex() {
		if (_state.layerIndex >= 0 && _state.layerIndex < model.layers.length) {
			return _state.layerIndex;
		}
		for (var i = model.layers.length - 2; i >= 0; i--) {
			var cls = model.layers[i].getClassName().toLowerCase();
			if (cls.indexOf("conv") >= 0 || cls.indexOf("dense") >= 0) {
				return i;
			}
		}
		return Math.max(0, model.layers.length - 2);
	}

	function _getInputShape() {
		var inputShape = model.inputShape || model.inputs[0].shape;
		// inputShape is like [null, 28, 28, 1]
		var shape = inputShape.slice(1); // remove batch dim
		var imgH = shape[0];
		var imgW = shape[1];
		var channels = shape[2] || 1;
		return { imgH: imgH, imgW: imgW, channels: channels, batchedShape: [1, imgH, imgW, channels] };
	}

	function _buildAtlas(callback, progressFn) {
		if (_state.isComputing) return;
		if (typeof model === "undefined" || !model) { callback("No model available"); return; }

		_state.isComputing = true;

		try {
			var inputInfo = _getInputShape();
			var imgH = inputInfo.imgH;
			var imgW = inputInfo.imgW;
			var channels = inputInfo.channels;

			if (!imgH || !imgW) {
				_state.isComputing = false;
				callback("Cannot determine input image dimensions from model");
				return;
			}

			var layerIdx = _getTargetLayerIndex();
			var targetLayer = model.layers[layerIdx];

			if (progressFn) progressFn("Extracting prototype activations from weights...", 0.05);

			var protoData = _extractPrototypeActivations(layerIdx);
			if (!protoData || protoData.prototypes.length < 3) {
				_state.isComputing = false;
				callback("Could not extract prototype activations from layer '" + targetLayer.name + "'. Try a different layer.");
				return;
			}

			var prototypes = protoData.prototypes;
			var flatOutputSize = protoData.flatOutputSize;

			if (progressFn) progressFn("Running t-SNE on " + prototypes.length + " prototypes...", 0.1);

			// Project prototypes to 2D via t-SNE
			var protoVectors = prototypes.map(function (p) { return Array.from(p.activation); });

			// Truncate for t-SNE if too high-dim
			var maxDim = 50;
			var truncated = protoVectors;
			if (protoVectors[0] && protoVectors[0].length > maxDim) {
				var variances = [];
				for (var d = 0; d < protoVectors[0].length; d++) {
					var mean = 0;
					for (var i = 0; i < protoVectors.length; i++) mean += protoVectors[i][d];
					mean /= protoVectors.length;
					var variance = 0;
					for (var i = 0; i < protoVectors.length; i++) {
						var diff = protoVectors[i][d] - mean;
						variance += diff * diff;
					}
					variances.push({ idx: d, v: variance });
				}
				variances.sort(function (a, b) { return b.v - a.v; });
				var topDims = variances.slice(0, maxDim).map(function (x) { return x.idx; });
				truncated = protoVectors.map(function (row) {
					return topDims.map(function (d) { return row[d]; });
				});
			}

			var perp = Math.max(2, Math.min(15, Math.floor(prototypes.length / 4)));
			var embedded = _tsne(truncated, perp, 400);

			if (progressFn) progressFn("Building grid and interpolating...", 0.25);

			// Grid the 2D space
			var minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
			for (var i = 0; i < embedded.length; i++) {
				if (embedded[i][0] < minX) minX = embedded[i][0];
				if (embedded[i][0] > maxX) maxX = embedded[i][0];
				if (embedded[i][1] < minY) minY = embedded[i][1];
				if (embedded[i][1] > maxY) maxY = embedded[i][1];
			}
			var rangeX = (maxX - minX) || 1;
			var rangeY = (maxY - minY) || 1;

			var gridSize = _state.gridSize;

			// For each grid cell, compute the activation vector via IDW
			// interpolation from ALL prototypes based on their 2D positions
			var allCells = [];

			for (var r = 0; r < gridSize; r++) {
				for (var c = 0; c < gridSize; c++) {
					// Grid cell center in 2D
					var cellCenterX = minX + (c + 0.5) / gridSize * rangeX;
					var cellCenterY = minY + (r + 0.5) / gridSize * rangeY;

					// IDW interpolation from all prototypes
					var interpolated = new Float32Array(flatOutputSize);
					var totalWeight = 0;

					for (var p = 0; p < embedded.length; p++) {
						var dx = cellCenterX - embedded[p][0];
						var dy = cellCenterY - embedded[p][1];
						var dist = Math.sqrt(dx * dx + dy * dy);
						if (dist < 0.0001) dist = 0.0001;
						var weight = 1.0 / (dist * dist * dist); // power 3 for sharper locality
						totalWeight += weight;
						var protoAct = prototypes[p].activation;
						for (var d = 0; d < flatOutputSize; d++) {
							interpolated[d] += weight * protoAct[d];
						}
					}

					if (totalWeight > 0) {
						for (var d = 0; d < flatOutputSize; d++) {
							interpolated[d] /= totalWeight;
						}
					}

					// Find nearest prototype for labeling
					var nearestDist = Infinity, nearestIdx = 0;
					for (var p = 0; p < embedded.length; p++) {
						var dx2 = cellCenterX - embedded[p][0];
						var dy2 = cellCenterY - embedded[p][1];
						var d2 = dx2 * dx2 + dy2 * dy2;
						if (d2 < nearestDist) { nearestDist = d2; nearestIdx = p; }
					}

					// Compute mixture: top contributing prototypes
					var contributions = [];
					for (var p = 0; p < embedded.length; p++) {
						var dx3 = cellCenterX - embedded[p][0];
						var dy3 = cellCenterY - embedded[p][1];
						var dist3 = Math.sqrt(dx3 * dx3 + dy3 * dy3);
						if (dist3 < 0.0001) dist3 = 0.0001;
						var w3 = 1.0 / (dist3 * dist3 * dist3);
						contributions.push({ idx: p, weight: w3 / totalWeight });
					}
					contributions.sort(function (a, b) { return b.weight - a.weight; });

					allCells.push({
						row: r,
						col: c,
						avgActivation: interpolated,
						nearestPrototype: nearestIdx,
						dominantNeuron: prototypes[nearestIdx].neuronIdx,
						topContributions: contributions.slice(0, 5),
						generatedImage: null,
						isInterpolated: true
					});
				}
			}

			if (progressFn) progressFn("Generating feature visualizations...", 0.3);

			// Generate images for all cells
			var inputShape = inputInfo.batchedShape;
			var totalCells = allCells.length;
			var cellIdx = 0;

			function _generateNext() {
				if (cellIdx >= totalCells) {
					_state.gridCells = allCells;
					_state.isComputing = false;
					_state.lastComputeTime = Date.now();
					callback(null, {
						layerName: targetLayer.name,
						layerIndex: layerIdx,
						gridSize: gridSize,
						totalCells: totalCells,
						imgH: imgH,
						imgW: imgW,
						channels: channels,
						numPrototypes: prototypes.length,
						numNeurons: protoData.numNeurons
					});
					return;
				}

				var cell = allCells[cellIdx];
				if (progressFn) {
					var pct = 0.3 + 0.7 * (cellIdx / totalCells);
					progressFn("Generating cell " + (cellIdx + 1) + "/" + totalCells, pct);
				}

				try {
					var pixelData = _generateFeatureVis(
						Array.from(cell.avgActivation),
						layerIdx,
						inputShape,
						_state.featureVisSteps,
						_state.featureVisLR
					);
					cell.generatedImage = _pixelDataToCanvas(pixelData, imgH, imgW, channels);
				} catch (e) {
					console.warn("[Atlas] Cell generation failed:", e.message);
					cell.generatedImage = null;
				}

				cellIdx++;
				setTimeout(_generateNext, 0);
			}

			_generateNext();

		} catch (e) {
			_state.isComputing = false;
			console.error("[ActivationAtlas]", e);
			callback("Error: " + (e.message || e));
		}
	}

	// ============================================================
	// CANVAS RENDERING
	// ============================================================

	var _COLORS = [
		"#e74c3c", "#3498db", "#2ecc71", "#f39c12", "#9b59b6",
		"#1abc9c", "#e67e22", "#34495e", "#16a085", "#c0392b",
		"#2980b9", "#27ae60", "#d35400", "#8e44ad", "#f1c40f"
	];

	function _drawAtlas() {
		var canvas = _state.canvas;
		var ctx = _state.ctx;
		var cells = _state.gridCells;
		if (!canvas || !ctx || !cells || cells.length === 0) return;

		var W = canvas.width;
		var H = canvas.height;
		var gridSize = _state.gridSize;

		ctx.clearRect(0, 0, W, H);
		ctx.fillStyle = "#0d0d1a";
		ctx.fillRect(0, 0, W, H);

		var margin = 10;
		var plotW = W - 2 * margin;
		var plotH = H - 2 * margin;
		var cellW = plotW / gridSize;
		var cellH = plotH / gridSize;

		var zoom = _state.zoom;
		var panX = _state.panX;
		var panY = _state.panY;

		for (var i = 0; i < cells.length; i++) {
			var cell = cells[i];
			var cx = margin + cell.col * cellW;
			var cy = margin + cell.row * cellH;

			cx = (cx - W / 2) * zoom + W / 2 + panX;
			cy = (cy - H / 2) * zoom + H / 2 + panY;
			var cw = cellW * zoom;
			var ch = cellH * zoom;

			if (cx + cw < 0 || cx > W || cy + ch < 0 || cy > H) continue;

			if (cell.generatedImage) {
				ctx.drawImage(cell.generatedImage, cx, cy, cw, ch);
			} else {
				ctx.fillStyle = "rgba(30,30,50,0.8)";
				ctx.fillRect(cx, cy, cw, ch);
			}

			// Subtle grid lines
			ctx.strokeStyle = "rgba(255,255,255,0.08)";
			ctx.lineWidth = 0.5;
			ctx.strokeRect(cx, cy, cw, ch);

			// Neuron index color indicator
			if (cell.dominantNeuron >= 0) {
				var color = _COLORS[cell.dominantNeuron % _COLORS.length];
				ctx.fillStyle = color;
				ctx.globalAlpha = 0.6;
				ctx.fillRect(cx, cy, 4 * zoom, 4 * zoom);
				ctx.globalAlpha = 1.0;
			}
		}

		// Hovered cell tooltip
		if (_state.hoveredCell !== null) {
			var hc = _state.hoveredCell;
			var hcx = margin + hc.col * cellW;
			var hcy = margin + hc.row * cellH;
			hcx = (hcx - W / 2) * zoom + W / 2 + panX;
			hcy = (hcy - H / 2) * zoom + H / 2 + panY;
			var hcw = cellW * zoom;
			var hch = cellH * zoom;

			ctx.strokeStyle = "#ffffff";
			ctx.strokeStyle = "#ffffff";
			ctx.lineWidth = 3;
			ctx.strokeRect(hcx - 2, hcy - 2, hcw + 4, hch + 4);

			// Tooltip
			var tooltipX = hcx + hcw + 10;
			var tooltipY = hcy;
			if (tooltipX + 220 > W) tooltipX = hcx - 230;
			if (tooltipY + 100 > H) tooltipY = H - 110;
			if (tooltipY < 10) tooltipY = 10;

			ctx.fillStyle = "rgba(10,10,30,0.95)";
			ctx.strokeStyle = "rgba(52,152,219,0.8)";
			ctx.lineWidth = 2;
			_roundRect(ctx, tooltipX, tooltipY, 220, 95, 8);
			ctx.fill();
			ctx.stroke();

			ctx.fillStyle = "#ffffff";
			ctx.font = "bold 11px sans-serif";
			ctx.fillText("Grid [" + hc.row + ", " + hc.col + "]", tooltipX + 8, tooltipY + 18);

			ctx.font = "11px sans-serif";
			ctx.fillStyle = "#aaaaaa";
			if (hc.dominantNeuron >= 0) {
				ctx.fillText("Nearest neuron: #" + hc.dominantNeuron, tooltipX + 8, tooltipY + 36);
			}

			// Top contributions
			if (hc.topContributions && hc.topContributions.length > 0) {
				ctx.fillStyle = "#888888";
				ctx.font = "10px sans-serif";
				var contribStr = "Mix: ";
				for (var ti = 0; ti < Math.min(hc.topContributions.length, 3); ti++) {
					var contrib = hc.topContributions[ti];
					contribStr += "#" + contrib.idx + "(" + (contrib.weight * 100).toFixed(0) + "%) ";
				}
				ctx.fillText(contribStr.trim(), tooltipX + 8, tooltipY + 54);
			}

			ctx.fillStyle = "#666666";
			ctx.font = "10px sans-serif";
			ctx.fillText("Interpolated from " + (hc.topContributions ? hc.topContributions.length : "?") + " prototypes", tooltipX + 8, tooltipY + 72);

			// Small contribution bar
			if (hc.topContributions) {
				var cBarX = tooltipX + 8;
				var cBarY = tooltipY + 80;
				var cBarW = 200;
				for (var ci = 0; ci < Math.min(hc.topContributions.length, 8); ci++) {
					var cFrac = hc.topContributions[ci].weight;
					var segW = cBarW * cFrac;
					ctx.fillStyle = _COLORS[hc.topContributions[ci].idx % _COLORS.length];
					ctx.fillRect(cBarX, cBarY, segW, 6);
					cBarX += segW;
				}
			}
		}
	}

	function _roundRect(ctx, x, y, w, h, r) {
		ctx.beginPath();
		ctx.moveTo(x + r, y);
		ctx.lineTo(x + w - r, y);
		ctx.quadraticCurveTo(x + w, y, x + w, y + r);
		ctx.lineTo(x + w, y + h - r);
		ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
		ctx.lineTo(x + r, y + h);
		ctx.quadraticCurveTo(x, y + h, x, y + h - r);
		ctx.lineTo(x, y + r);
		ctx.quadraticCurveTo(x, y, x + r, y);
		ctx.closePath();
	}

	function _getLabelName(idx) {
		if (idx < 0) return "Unknown";
		try {
			if (typeof labels !== "undefined" && Array.isArray(labels) && labels[idx]) {
				return labels[idx];
			}
		} catch (e) { }
		return "Neuron " + idx;
	}

	// ============================================================
	// INTERACTION (zoom, pan, hover)
	// ============================================================

	function _bindCanvasEvents() {
		var canvas = _state.canvas;
		if (!canvas) return;

		canvas.addEventListener("wheel", function (e) {
			e.preventDefault();
			var delta = e.deltaY > 0 ? 0.9 : 1.1;
			_state.zoom = Math.max(0.3, Math.min(10, _state.zoom * delta));
			_drawAtlas();
		});

		canvas.addEventListener("mousedown", function (e) {
			_state.isDragging = true;
			_state.dragStartX = e.clientX;
			_state.dragStartY = e.clientY;
			_state.panStartX = _state.panX;
			_state.panStartY = _state.panY;
			canvas.style.cursor = "grabbing";
		});

		canvas.addEventListener("mousemove", function (e) {
			if (_state.isDragging) {
				_state.panX = _state.panStartX + (e.clientX - _state.dragStartX);
				_state.panY = _state.panStartY + (e.clientY - _state.dragStartY);
				_drawAtlas();
			} else {
				_handleHover(e);
			}
		});

		canvas.addEventListener("mouseup", function () {
			_state.isDragging = false;
			canvas.style.cursor = "crosshair";
		});

		canvas.addEventListener("mouseleave", function () {
			_state.isDragging = false;
			_state.hoveredCell = null;
			canvas.style.cursor = "crosshair";
			_drawAtlas();
		});
	}

	function _handleHover(e) {
		var canvas = _state.canvas;
		var cells = _state.gridCells;
		if (!canvas || !cells) return;

		var rect = canvas.getBoundingClientRect();
		var mx = (e.clientX - rect.left) * (canvas.width / rect.width);
		var my = (e.clientY - rect.top) * (canvas.height / rect.height);

		var W = canvas.width, H = canvas.height;
		var margin = 10;
		var plotW = W - 2 * margin;
		var plotH = H - 2 * margin;
		var gridSize = _state.gridSize;
		var cellW = plotW / gridSize;
		var cellH = plotH / gridSize;
		var zoom = _state.zoom, panX = _state.panX, panY = _state.panY;

		var found = null;
		for (var i = 0; i < cells.length; i++) {
			var cell = cells[i];
			var cx = margin + cell.col * cellW;
			var cy = margin + cell.row * cellH;
			cx = (cx - W / 2) * zoom + W / 2 + panX;
			cy = (cy - H / 2) * zoom + H / 2 + panY;
			var cw = cellW * zoom;
			var ch = cellH * zoom;

			if (mx >= cx && mx <= cx + cw && my >= cy && my <= cy + ch) {
				found = cell;
				break;
			}
		}

		if (_state.hoveredCell !== found) {
			_state.hoveredCell = found;
			canvas.style.cursor = found ? "pointer" : "crosshair";
			_drawAtlas();
		}
	}

	// ============================================================
	// UI BUILDING
	// ============================================================

	function _buildUI(container, meta) {
		container.innerHTML = "";
		_injectStyles();

		var wrapper = document.createElement("div");
		wrapper.className = "atlas_wrapper";

		// Header
		var header = document.createElement("div");
		header.className = "atlas_header";
		header.innerHTML = "<span class='TRANSLATEME_atlas_title'>Activation Atlas</span>";

		var controls = document.createElement("div");
		controls.className = "atlas_controls";

		var refreshBtn = document.createElement("button");
		refreshBtn.className = "atlas_btn";
		refreshBtn.textContent = "⟳";
		refreshBtn.title = "Refresh";
		refreshBtn.onclick = function () { activationAtlas(_state.container); };
		controls.appendChild(refreshBtn);

		var layerSelect = document.createElement("select");
		layerSelect.className = "atlas_select";
		if (typeof model !== "undefined" && model && model.layers) {
			var autoOpt = document.createElement("option");
			autoOpt.value = "-1";
			autoOpt.textContent = "Auto (last hidden)";
			layerSelect.appendChild(autoOpt);
			for (var i = 0; i < model.layers.length; i++) {
				var opt = document.createElement("option");
				opt.value = "" + i;
				opt.textContent = model.layers[i].name || ("Layer " + i);
				layerSelect.appendChild(opt);
			}
		}
		layerSelect.value = "" + _state.layerIndex;
		layerSelect.onchange = function () {
			_state.layerIndex = parseInt(this.value);
			activationAtlas(_state.container);
		};
		controls.appendChild(layerSelect);

		// Grid size control
		var gridSelect = document.createElement("select");
		gridSelect.className = "atlas_select";
		[6, 8, 10, 12, 16].forEach(function (g) {
			var opt = document.createElement("option");
			opt.value = "" + g;
			opt.textContent = g + "×" + g;
			if (g === _state.gridSize) opt.selected = true;
			gridSelect.appendChild(opt);
		});
		gridSelect.onchange = function () {
			_state.gridSize = parseInt(this.value);
			activationAtlas(_state.container);
		};
		controls.appendChild(gridSelect);

		header.appendChild(controls);
		wrapper.appendChild(header);

		// Info bar
		if (meta) {
			var info = document.createElement("div");
			info.className = "atlas_info";
			info.innerHTML = "<span class='TRANSLATEME_atlas_layer'>Layer</span>: <strong>" + (meta.layerName || "?") + "</strong> | " +
				meta.gridSize + "×" + meta.gridSize + " grid (" + meta.totalCells + " cells) | " +
				meta.numPrototypes + " prototypes from " + meta.numNeurons + " neurons | " +
				meta.imgH + "×" + meta.imgW + "px | " +
				new Date().toLocaleTimeString();
			wrapper.appendChild(info);
		}

		// Canvas
		var canvas = document.createElement("canvas");
		canvas.className = "atlas_canvas";
		canvas.width = _state.canvasWidth;
		canvas.height = _state.canvasHeight;
		canvas.style.cursor = "crosshair";
		wrapper.appendChild(canvas);

		_state.canvas = canvas;
		_state.ctx = canvas.getContext("2d");

		// Zoom controls
		var zoomBar = document.createElement("div");
		zoomBar.className = "atlas_zoom_bar";

		var zoomOutBtn = document.createElement("button");
		zoomOutBtn.className = "atlas_btn";
		zoomOutBtn.textContent = "−";
		zoomOutBtn.onclick = function () { _state.zoom = Math.max(0.3, _state.zoom * 0.8); _drawAtlas(); };
		zoomBar.appendChild(zoomOutBtn);

		var zoomLabel = document.createElement("span");
		zoomLabel.className = "atlas_zoom_label";
		zoomLabel.textContent = "Zoom";
		zoomBar.appendChild(zoomLabel);

		var zoomInBtn = document.createElement("button");
		zoomInBtn.className = "atlas_btn";
		zoomInBtn.textContent = "+";
		zoomInBtn.onclick = function () { _state.zoom = Math.min(10, _state.zoom * 1.25); _drawAtlas(); };
		zoomBar.appendChild(zoomInBtn);

		var resetBtn = document.createElement("button");
		resetBtn.className = "atlas_btn";
		resetBtn.textContent = "Reset";
		resetBtn.onclick = function () { _state.zoom = 1; _state.panX = 0; _state.panY = 0; _drawAtlas(); };
		zoomBar.appendChild(resetBtn);

		wrapper.appendChild(zoomBar);

		// Explanation
		var explanation = document.createElement("div");
		explanation.className = "atlas_explanation";
		explanation.innerHTML = "<span class='TRANSLATEME_atlas_explanation'>This atlas explores the model's learned activation space without requiring training data. " +
			"Prototype activation directions are extracted from the layer's weights (one per neuron/filter), " +
			"projected to 2D via t-SNE, and the space is filled via inverse-distance interpolation. " +
			"Each cell shows a gradient-ascent-generated image of what the model \"sees\" for that interpolated activation. " +
			"Transition regions between neurons reveal mixture/hybrid concepts the network has learned.</span>";
		wrapper.appendChild(explanation);

		container.appendChild(wrapper);

		_bindCanvasEvents();
		_drawAtlas();

		if (typeof update_translations === "function") {
			update_translations();
		}
	}

	// ============================================================
	// STYLES
	// ============================================================

	function _injectStyles() {
		if (document.getElementById("atlas_styles")) return;
		var style = document.createElement("style");
		style.id = "atlas_styles";
		style.textContent = [
			".atlas_wrapper { padding: 16px; font-family: inherit; }",
			".atlas_header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }",
			".atlas_controls { display: flex; gap: 8px; align-items: center; }",
			".atlas_btn { border: 1px solid rgba(128,128,128,0.3); background: rgba(128,128,128,0.06); border-radius: 6px; padding: 4px 10px; cursor: pointer; font-size: 1em; transition: all 0.2s; }",
			".atlas_btn:hover { background: rgba(128,128,128,0.15); }",
			".atlas_select { border: 1px solid rgba(128,128,128,0.3); background: rgba(128,128,128,0.06); border-radius: 6px; padding: 4px 8px; font-size: 0.85em; cursor: pointer; }",
			".atlas_info { font-size: 0.82em; opacity: 0.6; margin-bottom: 10px; }",
			".atlas_canvas { display: block; width: 100%; max-width: 900px; border: 2px solid rgba(128,128,128,0.15); border-radius: 10px; background: #0d0d1a; }",
			".atlas_zoom_bar { display: flex; align-items: center; gap: 8px; margin-top: 10px; font-size: 0.85em; }",
			".atlas_zoom_label { opacity: 0.6; min-width: 60px; text-align: center; }",
			".atlas_explanation { font-size: 0.75em; opacity: 0.5; margin-top: 12px; line-height: 1.5; padding: 8px 10px; background: rgba(52,152,219,0.04); border-radius: 6px; border-left: 3px solid rgba(52,152,219,0.3); }",
			".atlas_loading { padding: 40px; text-align: center; opacity: 0.6; font-size: 1.1em; }",
			".atlas_error { padding: 24px; text-align: center; opacity: 0.5; font-size: 1em; color: #e74c3c; }"
		].join("\n");
		document.head.appendChild(style);
	}

	// ============================================================
	// MAIN PUBLIC FUNCTION
	// ============================================================

	function activationAtlas(divOrId) {
		var container = _getOrCreateContainer(divOrId);
		_injectStyles();

		_state.zoom = 1;
		_state.panX = 0;
		_state.panY = 0;
		_state.hoveredCell = null;

		container.innerHTML = "<div class='atlas_wrapper'><div class='atlas_loading'><span class='TRANSLATEME_calculating'>Calculating</span>...<div id='atlas_progress_text' style='margin-top:8px;font-size:0.8em;opacity:0.5;'></div></div></div>";
		if (typeof update_translations === "function") update_translations();

		var progressText = document.getElementById("atlas_progress_text");

		setTimeout(function () {
			_buildAtlas(function (error, meta) {
				if (error) {
					container.innerHTML = "<div class='atlas_wrapper'><div class='atlas_error'>" + error + "</div></div>";
					return;
				}
				_buildUI(container, meta);
			}, function (msg, pct) {
				if (progressText) {
					progressText.textContent = msg + " (" + Math.round(pct * 100) + "%)";
				}
			});
		}, 50);

		return container;
	}

	// ============================================================
	// EXPOSE
	// ============================================================

	return activationAtlas;

})();

if (typeof window !== "undefined") {
	window.activationAtlas = ActivationAtlas;
}
