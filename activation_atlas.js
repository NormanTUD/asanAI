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
		featureVisSteps: 512,
		featureVisLR: 0.02,
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
		lastComputeTime: 0,
		stopRequested: false,
		progressBar: null,
		progressLabel: null,
		timeEstimateLabel: null,
		toggleBtn: null,
		generationStartTime: 0,
		cellsCompleted: 0,
		totalCells: 0
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
	// GRADIENT ASCENT - Improved with multi-scale, jitter, and
	// stronger regularization for clearer feature visualizations
	// ============================================================

	function _gaussianBlur3x3(img4d) {
		var blurred = tf.avgPool(img4d, [3, 3], [1, 1], 'same');
		return blurred;
	}

	function _generateFeatureVisLive(targetActivation, layerIdx, inputShape, steps, lr, onStepCallback) {
		var targetLayer = model.layers[layerIdx];
		var extractModel = tf.model({ inputs: model.input, outputs: targetLayer.output });
		var targetTensor = tf.tensor1d(targetActivation);
		var targetNorm = targetTensor.norm().add(1e-8);

		var imgH = inputShape[1];
		var imgW = inputShape[2];
		var channels = inputShape[3];

		var initNoise = tf.tidy(function () {
			var smallH = Math.max(4, Math.floor(imgH / 4));
			var smallW = Math.max(4, Math.floor(imgW / 4));
			var small = tf.randomNormal([1, smallH, smallW, channels], 0, 0.01);
			var upsampled = tf.image.resizeBilinear(small, [imgH, imgW]);
			return upsampled;
		});

		var inputImg = tf.variable(initNoise);
		initNoise.dispose();

		var currentStep = 0;
		var batchSize = 16;

		function processBatch() {
			return new Promise(function (resolve) {
				var endStep = Math.min(currentStep + batchSize, steps);

				for (var step = currentStep; step < endStep; step++) {
					var jitterX = Math.floor(Math.random() * 5) - 2;
					var jitterY = Math.floor(Math.random() * 5) - 2;

					var grads = tf.tidy(function () {
						return tf.grad(function (img) {
							var jittered = img;
							if (jitterX !== 0 || jitterY !== 0) {
								var padded = tf.pad(img, [[0, 0], [2, 2], [2, 2], [0, 0]], 0);
								var startY = 2 + jitterY;
								var startX = 2 + jitterX;
								jittered = padded.slice([0, startY, startX, 0], [1, imgH, imgW, channels]);
							}

							var activation = extractModel.predict(jittered.reshape(inputShape));
							var flat = activation.reshape([activation.size]);

							var dotProd = flat.mul(targetTensor).sum();
							var normA = flat.norm().add(1e-8);
							var cosSim = dotProd.div(normA.mul(targetNorm));

							return cosSim;
						})(inputImg);
					});

					tf.tidy(function () {
						var gradNorm = grads.norm().add(1e-8);
						var normalized = grads.div(gradNorm);

						var progress = step / steps;
						var currentLR = lr * (1.0 - progress * 0.5);

						inputImg.assign(inputImg.add(normalized.mul(currentLR)));
					});
					grads.dispose();

					if (step % 2 === 0) {
						tf.tidy(function () {
							var decayed = inputImg.mul(0.995);
							inputImg.assign(decayed);
						});
					}

					if (step % 4 === 0) {
						tf.tidy(function () {
							var img4d = inputImg.reshape(inputShape);
							var blurred = _gaussianBlur3x3(img4d);

							var progress = step / steps;
							var blurWeight = 0.5 * (1.0 - progress * 0.7);
							var mixed = img4d.mul(1.0 - blurWeight).add(blurred.mul(blurWeight));
							inputImg.assign(mixed.reshape(inputImg.shape));
						});
					}

					if (step % 8 === 0) {
						tf.tidy(function () {
							var clipped = inputImg.clipByValue(-2.5, 2.5);
							inputImg.assign(clipped);
						});
					}

					if (step % 32 === 0 && step > 0 && imgH >= 8 && imgW >= 8) {
						tf.tidy(function () {
							var img4d = inputImg.reshape(inputShape);
							var halfH = Math.max(4, Math.floor(imgH / 2));
							var halfW = Math.max(4, Math.floor(imgW / 2));
							var down = tf.image.resizeBilinear(img4d, [halfH, halfW]);
							var up = tf.image.resizeBilinear(down, [imgH, imgW]);
							var progress = step / steps;
							var smoothWeight = 0.3 * (1.0 - progress);
							var mixed = img4d.mul(1.0 - smoothWeight).add(up.mul(smoothWeight));
							inputImg.assign(mixed.reshape(inputImg.shape));
						});
					}
				}

				currentStep = endStep;
				resolve();
			});
		}

		function getPixelData() {
			var result = tf.tidy(function () {
				var img = inputImg.reshape(inputShape).squeeze([0]);
				var flat = img.reshape([-1]);
				var sorted = tf.topk(flat, flat.size).values;
				var numPixels = sorted.size;
				var lowIdx = Math.floor(numPixels * 0.01);
				var highIdx = Math.floor(numPixels * 0.99);
				var vals = sorted.dataSync();
				var lowVal = vals[numPixels - 1 - lowIdx] || vals[numPixels - 1];
				var highVal = vals[numPixels - 1 - highIdx] || vals[0];

				if (lowVal > highVal) { var tmp = lowVal; lowVal = highVal; highVal = tmp; }
				var range = highVal - lowVal;
				if (range < 0.001) range = 0.001;

				return img.sub(lowVal).div(range).mul(255).clipByValue(0, 255).toInt();
			});

			var data = result.dataSync();
			result.dispose();
			return data;
		}

		function cleanup() {
			inputImg.dispose();
			targetTensor.dispose();
			targetNorm.dispose();
		}

		return {
			processBatch: processBatch,
			getPixelData: getPixelData,
			cleanup: cleanup,
			getCurrentStep: function () { return currentStep; },
			getTotalSteps: function () { return steps; },
			isDone: function () { return currentStep >= steps; }
		};
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
	// ============================================================

	function _getLayerWeights(layerIdx) {
		var targetLayer = model.layers[layerIdx];
		var weights = targetLayer.getWeights();

		if (!weights || weights.length === 0) {
			for (var i = layerIdx + 1; i < model.layers.length; i++) {
				weights = model.layers[i].getWeights();
				if (weights && weights.length > 0) break;
			}
		}

		return weights;
	}

	function _getKernelInfo(weights) {
		var kernel = weights[0];
		var kernelShape = kernel.shape;
		var numPrototypes, prototypeSize, kernelData;

		if (kernelShape.length === 2) {
			numPrototypes = kernelShape[1];
			prototypeSize = kernelShape[1];
			kernelData = kernel.arraySync();
		} else if (kernelShape.length === 4) {
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

		return {
			numPrototypes: numPrototypes,
			prototypeSize: prototypeSize,
			kernelData: kernelData,
			kernelShape: kernelShape
		};
	}

	function _getFlatOutputSize(layerIdx) {
		var targetLayer = model.layers[layerIdx];
		var extractModel = tf.model({ inputs: model.input, outputs: targetLayer.output });
		var outputShape = extractModel.outputShape;
		if (Array.isArray(outputShape[0])) {
			return outputShape.slice(1).reduce(function (a, b) { return a * b; }, 1);
		}
		return outputShape.slice(1).reduce(function (a, b) { return a * b; }, 1);
	}

	function _buildOneHotPrototypes(maxPrototypes, flatOutputSize, numPrototypes) {
		var prototypes = [];
		for (var i = 0; i < maxPrototypes; i++) {
			var proto = new Float32Array(flatOutputSize);
			if (flatOutputSize === numPrototypes) {
				proto[i] = 1.0;
			} else {
				var spatialSize = flatOutputSize / numPrototypes;
				for (var s = 0; s < spatialSize; s++) {
					proto[s * numPrototypes + i] = 1.0;
				}
			}
			prototypes.push({ activation: proto, neuronIdx: i, isMixed: false });
		}
		return prototypes;
	}

	function _buildMixedPrototypes(prototypes, maxPrototypes, flatOutputSize) {
		var numMixed = Math.min(maxPrototypes, 40);
		var mixed_prototypes = [];
		for (var m = 0; m < numMixed; m++) {
			var idxA = Math.floor(Math.random() * maxPrototypes);
			var idxB = Math.floor(Math.random() * maxPrototypes);
			if (idxA === idxB) idxB = (idxB + 1) % maxPrototypes;
			var alpha = 0.2 + Math.random() * 0.6;

			var mixed = new Float32Array(flatOutputSize);
			var protoA = prototypes[idxA].activation;
			var protoB = prototypes[idxB].activation;
			for (var d = 0; d < flatOutputSize; d++) {
				mixed[d] = protoA[d] * alpha + protoB[d] * (1 - alpha);
			}
			mixed_prototypes.push({ activation: mixed, neuronIdx: -1, isMixed: true, mixA: idxA, mixB: idxB, alpha: alpha });
		}
		return mixed_prototypes;
	}

	function _extractPrototypeActivations(layerIdx) {
		var weights = _getLayerWeights(layerIdx);
		if (!weights || weights.length === 0) return null;

		var kernelInfo = _getKernelInfo(weights);
		if (!kernelInfo) return null;

		var numPrototypes = kernelInfo.numPrototypes;
		var flatOutputSize = _getFlatOutputSize(layerIdx);
		var maxPrototypes = Math.min(numPrototypes, 80);

		var prototypes = _buildOneHotPrototypes(maxPrototypes, flatOutputSize, numPrototypes);
		var mixedPrototypes = _buildMixedPrototypes(prototypes, maxPrototypes, flatOutputSize);
		prototypes = prototypes.concat(mixedPrototypes);

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
		var shape = inputShape.slice(1);
		var imgH = shape[0];
		var imgW = shape[1];
		var channels = shape[2] || 1;
		return { imgH: imgH, imgW: imgW, channels: channels, batchedShape: [1, imgH, imgW, channels] };
	}

	function _formatTime(seconds) {
		if (seconds < 60) return Math.round(seconds) + "s";
		if (seconds < 3600) return Math.floor(seconds / 60) + "m " + Math.round(seconds % 60) + "s";
		return Math.floor(seconds / 3600) + "h " + Math.floor((seconds % 3600) / 60) + "m";
	}

	function _updateTimeEstimate() {
		if (!_state.timeEstimateLabel) return;
		if (_state.cellsCompleted < 1) {
			_state.timeEstimateLabel.textContent = "Estimating time...";
			return;
		}
		var elapsed = (Date.now() - _state.generationStartTime) / 1000;
		var perCell = elapsed / _state.cellsCompleted;
		var remaining = perCell * (_state.totalCells - _state.cellsCompleted);
		_state.timeEstimateLabel.textContent = "⏱ " + _formatTime(remaining) + " remaining (~" + perCell.toFixed(1) + "s/cell)";
	}

	function _buildAtlas(callback, progressFn) {
		if (_state.isComputing) return;
		if (typeof model === "undefined" || !model) { callback("No model available"); return; }

		_state.isComputing = true;
		_state.stopRequested = false;
		_state.generationStartTime = Date.now();
		_state.cellsCompleted = 0;

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

			if (progressFn) progressFn("Extracting prototype activations from weights...", 0.02);

			var protoData = _extractPrototypeActivations(layerIdx);
			if (!protoData || protoData.prototypes.length < 3) {
				_state.isComputing = false;
				callback("Could not extract prototype activations from layer '" + targetLayer.name + "'. Try a different layer.");
				return;
			}

			var prototypes = protoData.prototypes;
			var flatOutputSize = protoData.flatOutputSize;

			if (progressFn) progressFn("Running t-SNE on " + prototypes.length + " prototypes...", 0.05);

			var protoVectors = prototypes.map(function (p) { return Array.from(p.activation); });

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

			if (progressFn) progressFn("Building grid and interpolating...", 0.1);

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
			var allCells = [];

			for (var r = 0; r < gridSize; r++) {
				for (var c = 0; c < gridSize; c++) {
					var cellCenterX = minX + (c + 0.5) / gridSize * rangeX;
					var cellCenterY = minY + (r + 0.5) / gridSize * rangeY;

					var interpolated = new Float32Array(flatOutputSize);
					var totalWeight = 0;

					for (var p = 0; p < embedded.length; p++) {
						var dx = cellCenterX - embedded[p][0];
						var dy = cellCenterY - embedded[p][1];
						var dist = Math.sqrt(dx * dx + dy * dy);
						if (dist < 0.0001) dist = 0.0001;
						var weight = 1.0 / (dist * dist * dist);
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

					var nearestDist = Infinity, nearestIdx = 0;
					for (var p = 0; p < embedded.length; p++) {
						var dx2 = cellCenterX - embedded[p][0];
						var dy2 = cellCenterY - embedded[p][1];
						var d2 = dx2 * dx2 + dy2 * dy2;
						if (d2 < nearestDist) { nearestDist = d2; nearestIdx = p; }
					}

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

			if (progressFn) progressFn("Generating feature visualizations...", 0.12);

			_state.gridCells = allCells;
			_state.totalCells = allCells.length;
			var inputShapeArr = inputInfo.batchedShape;
			var totalCells = allCells.length;
			var cellIdx = 0;

			// Draw the empty grid first
			_drawAtlas();

			function _generateNextLive() {
				if (_state.stopRequested) {
					_state.isComputing = false;
					_state.stopRequested = false;
					_setToggleState("start");
					if (progressFn) progressFn("Stopped by user.", cellIdx / totalCells);
					callback(null, {
						layerName: targetLayer.name || ("Layer " + layerIdx),
						gridSize: gridSize,
						totalCells: totalCells,
						numPrototypes: prototypes.length,
						numNeurons: protoData.numNeurons,
						imgH: imgH,
						imgW: imgW,
						stopped: true
					});
					return;
				}

				if (cellIdx >= totalCells) {
					_state.isComputing = false;
					_state.lastComputeTime = Date.now();
					_setToggleState("start");

					var meta = {
						layerName: targetLayer.name || ("Layer " + layerIdx),
						gridSize: gridSize,
						totalCells: totalCells,
						numPrototypes: prototypes.length,
						numNeurons: protoData.numNeurons,
						imgH: imgH,
						imgW: imgW
					};

					callback(null, meta);
					return;
				}

				var cell = allCells[cellIdx];
				var pct = 0.12 + 0.88 * (cellIdx / totalCells);
				if (progressFn) progressFn("Generating cell " + (cellIdx + 1) + "/" + totalCells, pct);

				_updateProgressUI(pct, cellIdx, totalCells);

				var generator = _generateFeatureVisLive(
					Array.from(cell.avgActivation),
					layerIdx,
					inputShapeArr,
					_state.featureVisSteps,
					_state.featureVisLR,
					null
				);

				function _processAndDraw() {
					if (_state.stopRequested) {
						generator.cleanup();
						_state.isComputing = false;
						_state.stopRequested = false;
						_setToggleState("start");
						if (progressFn) progressFn("Stopped by user.", cellIdx / totalCells);
						callback(null, {
							layerName: targetLayer.name || ("Layer " + layerIdx),
							gridSize: gridSize,
							totalCells: totalCells,
							numPrototypes: prototypes.length,
							numNeurons: protoData.numNeurons,
							imgH: imgH,
							imgW: imgW,
							stopped: true
						});
						return;
					}

					generator.processBatch().then(function () {
						try {
							var pixelData = generator.getPixelData();
							cell.generatedImage = _pixelDataToCanvas(pixelData, imgH, imgW, channels);
							_drawAtlas();
						} catch (e) { /* ignore intermediate draw errors */ }

						if (generator.isDone()) {
							try {
								var finalPixelData = generator.getPixelData();
								cell.generatedImage = _pixelDataToCanvas(finalPixelData, imgH, imgW, channels);
								_drawAtlas();
							} catch (e) {
								console.warn("[Atlas] Cell generation failed:", e.message);
								cell.generatedImage = null;
							}
							generator.cleanup();
							cellIdx++;
							_state.cellsCompleted = cellIdx;
							_updateTimeEstimate();
							tf.nextFrame().then(_generateNextLive);
						} else {
							tf.nextFrame().then(_processAndDraw);
						}
					});
				}

				_processAndDraw();
			}

			tf.nextFrame().then(_generateNextLive);

		} catch (e) {
			_state.isComputing = false;
			console.error("[ActivationAtlas]", e);
			callback("Error: " + (e.message || e));
		}
	}

	// ============================================================
	// PROGRESS UI HELPERS
	// ============================================================

	function _updateProgressUI(pct, cellIdx, totalCells) {
		if (_state.progressBar) {
			_state.progressBar.style.width = (pct * 100).toFixed(1) + "%";
		}
		if (_state.progressLabel) {
			_state.progressLabel.textContent = "Cell " + (cellIdx + 1) + "/" + totalCells + " (" + Math.round(pct * 100) + "%)";
		}
	}

	function _setToggleState(mode) {
		if (!_state.toggleBtn) return;
		if (mode === "stop") {
			_state.toggleBtn.textContent = "⏹ Stop";
			_state.toggleBtn.classList.add("atlas_toggle_stop");
			_state.toggleBtn.classList.remove("atlas_toggle_start");
		} else {
			_state.toggleBtn.textContent = "▶ Generate";
			_state.toggleBtn.classList.remove("atlas_toggle_stop");
			_state.toggleBtn.classList.add("atlas_toggle_start");
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
				// Animated pulse placeholder
				var pulse = 0.3 + 0.2 * Math.sin(Date.now() / 600 + i * 0.3);
				ctx.fillStyle = "rgba(52,152,219," + pulse.toFixed(2) + ")";
				ctx.beginPath();
				ctx.arc(cx + cw / 2, cy + ch / 2, Math.min(cw, ch) * 0.15, 0, Math.PI * 2);
				ctx.fill();
			}

			// Subtle grid lines
			ctx.strokeStyle = "rgba(255,255,255,0.06)";
			ctx.lineWidth = 0.5;
			ctx.strokeRect(cx, cy, cw, ch);

			// Neuron index color indicator
			if (cell.dominantNeuron >= 0) {
				var color = _COLORS[cell.dominantNeuron % _COLORS.length];
				ctx.fillStyle = color;
				ctx.globalAlpha = 0.5;
				ctx.fillRect(cx, cy, 3 * zoom, 3 * zoom);
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
			ctx.lineWidth = 2.5;
			ctx.shadowColor = "rgba(52,152,219,0.6)";
			ctx.shadowBlur = 12;
			ctx.strokeRect(hcx - 2, hcy - 2, hcw + 4, hch + 4);
			ctx.shadowBlur = 0;

			var tooltipX = hcx + hcw + 12;
			var tooltipY = hcy;
			if (tooltipX + 240 > W) tooltipX = hcx - 250;
			if (tooltipY + 110 > H) tooltipY = H - 120;
			if (tooltipY < 10) tooltipY = 10;

			ctx.fillStyle = "rgba(8,8,24,0.95)";
			ctx.strokeStyle = "rgba(52,152,219,0.6)";
			ctx.lineWidth = 1.5;
			_roundRect(ctx, tooltipX, tooltipY, 230, 100, 10);
			ctx.fill();
			ctx.stroke();

			ctx.fillStyle = "#ffffff";
			ctx.font = "bold 11px -apple-system, BlinkMacSystemFont, sans-serif";
			ctx.fillText("Grid [" + hc.row + ", " + hc.col + "]", tooltipX + 10, tooltipY + 20);

			ctx.font = "11px -apple-system, BlinkMacSystemFont, sans-serif";
			ctx.fillStyle = "#aaaaaa";
			if (hc.dominantNeuron >= 0) {
				ctx.fillText("Nearest neuron: #" + hc.dominantNeuron, tooltipX + 10, tooltipY + 38);
			}

			if (hc.topContributions && hc.topContributions.length > 0) {
				ctx.fillStyle = "#888888";
				ctx.font = "10px -apple-system, BlinkMacSystemFont, sans-serif";
				var contribStr = "Mix: ";
				for (var ti = 0; ti < Math.min(hc.topContributions.length, 3); ti++) {
					var contrib = hc.topContributions[ti];
					contribStr += "#" + contrib.idx + "(" + (contrib.weight * 100).toFixed(0) + "%) ";
				}
				ctx.fillText(contribStr.trim(), tooltipX + 10, tooltipY + 56);
			}

			ctx.fillStyle = "#666666";
			ctx.font = "10px -apple-system, BlinkMacSystemFont, sans-serif";
			ctx.fillText("Interpolated from " + (hc.topContributions ? hc.topContributions.length : "?") + " prototypes", tooltipX + 10, tooltipY + 74);

			if (hc.topContributions) {
				var cBarX = tooltipX + 10;
				var cBarY = tooltipY + 84;
				var cBarW = 210;
				ctx.beginPath();
				_roundRect(ctx, cBarX - 1, cBarY - 1, cBarW + 2, 8, 3);
				ctx.clip();
				for (var ci = 0; ci < Math.min(hc.topContributions.length, 8); ci++) {
					var cFrac = hc.topContributions[ci].weight;
					var segW = cBarW * cFrac;
					ctx.fillStyle = _COLORS[hc.topContributions[ci].idx % _COLORS.length];
					ctx.fillRect(cBarX, cBarY, segW, 6);
					cBarX += segW;
				}
				ctx.restore();
			}
		}

		// Animate placeholder pulses while computing
		if (_state.isComputing) {
			requestAnimationFrame(function () {
				if (_state.isComputing) _drawAtlas();
			});
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
	// UI BUILDING - FINAL (after generation completes)
	// ============================================================

	function _buildUI(container, meta) {
		container.innerHTML = "";
		_injectStyles();

		var wrapper = document.createElement("div");
		wrapper.className = "atlas_wrapper atlas_fade_in";

		// Header
		var header = document.createElement("div");
		header.className = "atlas_header";
		header.innerHTML = "<span class='atlas_title_text'>✦ Activation Atlas</span>";

		var controls = document.createElement("div");
		controls.className = "atlas_controls";

		// Toggle button (now shows "Generate" since we're done)
		var toggleBtn = document.createElement("button");
		toggleBtn.className = "atlas_btn atlas_toggle_btn atlas_toggle_start";
		toggleBtn.textContent = "▶ Generate";
		toggleBtn.title = "Regenerate atlas";
		toggleBtn.onclick = function () {
			_handleToggle(container);
		};
		controls.appendChild(toggleBtn);
		_state.toggleBtn = toggleBtn;

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
		};
		controls.appendChild(layerSelect);

		header.appendChild(controls);
		wrapper.appendChild(header);

		// Parameters panel
		var paramsPanel = _buildParamsPanel();
		wrapper.appendChild(paramsPanel);

		// Info bar
		if (meta) {
			var info = document.createElement("div");
			info.className = "atlas_info";
			var elapsed = ((Date.now() - _state.generationStartTime) / 1000).toFixed(1);
			info.innerHTML = "<strong>" + (meta.layerName || "?") + "</strong> · " +
				meta.gridSize + "×" + meta.gridSize + " (" + meta.totalCells + " cells) · " +
				meta.numPrototypes + " prototypes · " + meta.numNeurons + " neurons · " +
				meta.imgH + "×" + meta.imgW + "px · " +
				(meta.stopped ? "<span style='color:#e74c3c;'>⏹ Stopped</span> · " : "") +
				"<span style='color:#2ecc71;'>✓ " + elapsed + "s</span>";
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
		zoomLabel.textContent = "Zoom & Pan";
		zoomBar.appendChild(zoomLabel);

		var zoomInBtn = document.createElement("button");
		zoomInBtn.className = "atlas_btn";
		zoomInBtn.textContent = "+";
		zoomInBtn.onclick = function () { _state.zoom = Math.min(10, _state.zoom * 1.25); _drawAtlas(); };
		zoomBar.appendChild(zoomInBtn);

		var resetBtn = document.createElement("button");
		resetBtn.className = "atlas_btn";
		resetBtn.textContent = "⟲ Reset View";
		resetBtn.onclick = function () { _state.zoom = 1; _state.panX = 0; _state.panY = 0; _drawAtlas(); };
		zoomBar.appendChild(resetBtn);

		wrapper.appendChild(zoomBar);

		// Explanation
		var explanation = document.createElement("div");
		explanation.className = "atlas_explanation";
		explanation.innerHTML = "This atlas explores the model's learned activation space <em>without training data</em>. " +
			"Prototype directions are extracted from layer weights, projected to 2D via t-SNE, and the space is filled via IDW interpolation. " +
			"Each cell shows a gradient-ascent image of what the model \"sees\" for that interpolated activation. " +
			"Transition regions reveal mixture concepts the network has learned.";
		wrapper.appendChild(explanation);

		container.appendChild(wrapper);

		_bindCanvasEvents();
		_drawAtlas();
	}

	// ============================================================
	// PARAMETERS PANEL
	// ============================================================

	function _buildParamsPanel() {
		var panel = document.createElement("div");
		panel.className = "atlas_params_panel";

		var params = [
			{ label: "Grid Size", key: "gridSize", type: "select", options: [6, 8, 10, 12, 16] },
			{ label: "Vis Steps", key: "featureVisSteps", type: "range", min: 64, max: 1024, step: 64 },
			{ label: "Learning Rate", key: "featureVisLR", type: "range", min: 0.005, max: 0.1, step: 0.005, decimals: 3 }
		];

		params.forEach(function (param) {
			var row = document.createElement("div");
			row.className = "atlas_param_row";

			var label = document.createElement("label");
			label.className = "atlas_param_label";
			label.textContent = param.label;
			row.appendChild(label);

			if (param.type === "select") {
				var sel = document.createElement("select");
				sel.className = "atlas_select atlas_param_input";
				param.options.forEach(function (val) {
					var opt = document.createElement("option");
					opt.value = "" + val;
					opt.textContent = val + "×" + val;
					if (val === _state[param.key]) opt.selected = true;
					sel.appendChild(opt);
				});
				sel.onchange = function () { _state[param.key] = parseInt(this.value); };
				row.appendChild(sel);
			} else if (param.type === "range") {
				var rangeWrap = document.createElement("div");
				rangeWrap.className = "atlas_range_wrap";

				var range = document.createElement("input");
				range.type = "range";
				range.className = "atlas_range";
				range.min = param.min;
				range.max = param.max;
				range.step = param.step;
				range.value = _state[param.key];

				var valDisplay = document.createElement("span");
				valDisplay.className = "atlas_range_val";
				valDisplay.textContent = param.decimals ? _state[param.key].toFixed(param.decimals) : _state[param.key];

				range.oninput = function () {
					var v = parseFloat(this.value);
					_state[param.key] = v;
					valDisplay.textContent = param.decimals ? v.toFixed(param.decimals) : v;
				};

				rangeWrap.appendChild(range);
				rangeWrap.appendChild(valDisplay);
				row.appendChild(rangeWrap);
			}

			panel.appendChild(row);
		});

		return panel;
	}

	// ============================================================
	// LIVE UI - shown during generation
	// ============================================================

	function _buildLiveUI(container) {
		container.innerHTML = "";
		_injectStyles();

		var wrapper = document.createElement("div");
		wrapper.className = "atlas_wrapper atlas_fade_in";

		// Header
		var header = document.createElement("div");
		header.className = "atlas_header";
		header.innerHTML = "<span class='atlas_title_text'>✦ Activation Atlas</span>";

		var controls = document.createElement("div");
		controls.className = "atlas_controls";

		// Toggle button (shows "Stop" during generation)
		var toggleBtn = document.createElement("button");
		toggleBtn.className = "atlas_btn atlas_toggle_btn atlas_toggle_stop";
		toggleBtn.textContent = "⏹ Stop";
		toggleBtn.title = "Stop generation";
		toggleBtn.onclick = function () {
			_handleToggle(container);
		};
		controls.appendChild(toggleBtn);
		_state.toggleBtn = toggleBtn;

		header.appendChild(controls);
		wrapper.appendChild(header);

		// Progress section
		var progressSection = document.createElement("div");
		progressSection.className = "atlas_progress_section";

		var progressBarOuter = document.createElement("div");
		progressBarOuter.className = "atlas_progress_outer";

		var progressBarInner = document.createElement("div");
		progressBarInner.className = "atlas_progress_inner";
		progressBarInner.style.width = "0%";
		_state.progressBar = progressBarInner;

		progressBarOuter.appendChild(progressBarInner);
		progressSection.appendChild(progressBarOuter);

		var progressInfo = document.createElement("div");
		progressInfo.className = "atlas_progress_info";

		var progressLabel = document.createElement("span");
		progressLabel.className = "atlas_progress_label";
		progressLabel.textContent = "Initializing...";
		_state.progressLabel = progressLabel;
		progressInfo.appendChild(progressLabel);

		var timeEstimate = document.createElement("span");
		timeEstimate.className = "atlas_time_estimate";
		timeEstimate.textContent = "";
		_state.timeEstimateLabel = timeEstimate;
		progressInfo.appendChild(timeEstimate);

		progressSection.appendChild(progressInfo);
		wrapper.appendChild(progressSection);

		// Canvas
		var canvas = document.createElement("canvas");
		canvas.className = "atlas_canvas";
		canvas.width = _state.canvasWidth;
		canvas.height = _state.canvasHeight;
		canvas.style.cursor = "crosshair";
		wrapper.appendChild(canvas);

		_state.canvas = canvas;
		_state.ctx = canvas.getContext("2d");

		container.appendChild(wrapper);
		_bindCanvasEvents();
	}

	// ============================================================
	// TOGGLE HANDLER
	// ============================================================

	function _handleToggle(container) {
		if (_state.isComputing) {
			// Currently generating -> stop
			_state.stopRequested = true;
			_setToggleState("start");
		} else {
			// Currently idle -> start generation
			_state.zoom = 1;
			_state.panX = 0;
			_state.panY = 0;
			_state.hoveredCell = null;
			_state.stopRequested = false;

			_buildLiveUI(container);

			setTimeout(function () {
				_buildAtlas(function (error, meta) {
					if (error) {
						container.innerHTML = "<div class='atlas_wrapper'><div class='atlas_error'>" + error + "</div></div>";
						return;
					}
					_buildUI(container, meta);
				}, function (msg, pct) {
					if (_state.progressBar) {
						_state.progressBar.style.width = (pct * 100).toFixed(1) + "%";
					}
					if (_state.progressLabel) {
						_state.progressLabel.textContent = msg;
					}
				});
			}, 50);
		}
	}

	// ============================================================
	// STYLES
	// ============================================================

	function _injectStyles() {
		if (document.getElementById("atlas_styles_v2")) return;
		var style = document.createElement("style");
		style.id = "atlas_styles_v2";
		style.textContent = [
			"@keyframes atlas_fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }",
			"@keyframes atlas_shimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }",
			"@keyframes atlas_pulse { 0%, 100% { opacity: 0.6; } 50% { opacity: 1; } }",
			".atlas_fade_in { animation: atlas_fadeIn 0.4s ease-out; }",
			".atlas_wrapper { padding: 20px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }",
			".atlas_header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }",
			".atlas_title_text { font-size: 1.2em; font-weight: 700; background: linear-gradient(135deg, #3498db, #9b59b6); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }",			".atlas_controls { display: flex; gap: 8px; align-items: center; flex-wrap: wrap; }",
			".atlas_btn { border: 1px solid rgba(128,128,128,0.3); background: rgba(128,128,128,0.06); border-radius: 8px; padding: 6px 14px; cursor: pointer; font-size: 0.9em; transition: all 0.25s ease; backdrop-filter: blur(4px); }",
			".atlas_btn:hover { background: rgba(128,128,128,0.18); transform: translateY(-1px); box-shadow: 0 4px 12px rgba(0,0,0,0.2); }",
			".atlas_btn:active { transform: translateY(0); }",
			".atlas_btn:disabled { opacity: 0.4; cursor: not-allowed; transform: none; }",
			".atlas_toggle_btn { font-weight: 600; padding: 8px 18px; border-radius: 10px; font-size: 0.95em; letter-spacing: 0.3px; }",
			".atlas_toggle_start { border-color: rgba(46,204,113,0.5); color: #2ecc71; background: rgba(46,204,113,0.08); }",
			".atlas_toggle_start:hover { background: rgba(46,204,113,0.18); box-shadow: 0 4px 16px rgba(46,204,113,0.2); }",
			".atlas_toggle_stop { border-color: rgba(231,76,60,0.5); color: #e74c3c; background: rgba(231,76,60,0.08); animation: atlas_pulse 2s infinite; }",
			".atlas_toggle_stop:hover { background: rgba(231,76,60,0.18); box-shadow: 0 4px 16px rgba(231,76,60,0.2); }",
			".atlas_select { border: 1px solid rgba(128,128,128,0.3); background: rgba(128,128,128,0.06); border-radius: 8px; padding: 6px 10px; font-size: 0.85em; cursor: pointer; transition: all 0.2s; }",
			".atlas_select:hover { border-color: rgba(52,152,219,0.5); }",
			".atlas_info { font-size: 0.82em; opacity: 0.7; margin-bottom: 12px; padding: 8px 12px; background: rgba(52,152,219,0.04); border-radius: 8px; border: 1px solid rgba(52,152,219,0.1); line-height: 1.6; }",
			".atlas_canvas { display: block; width: 100%; max-width: 900px; border: 2px solid rgba(128,128,128,0.12); border-radius: 12px; background: #0d0d1a; box-shadow: 0 8px 32px rgba(0,0,0,0.3); transition: box-shadow 0.3s; }",
			".atlas_canvas:hover { box-shadow: 0 12px 48px rgba(0,0,0,0.4); }",
			".atlas_zoom_bar { display: flex; align-items: center; gap: 8px; margin-top: 12px; font-size: 0.85em; }",
			".atlas_zoom_label { opacity: 0.6; min-width: 80px; text-align: center; font-size: 0.85em; }",
			".atlas_explanation { font-size: 0.78em; opacity: 0.55; margin-top: 14px; line-height: 1.6; padding: 10px 14px; background: rgba(52,152,219,0.03); border-radius: 8px; border-left: 3px solid rgba(52,152,219,0.25); }",
			".atlas_error { padding: 24px; text-align: center; opacity: 0.6; font-size: 1em; color: #e74c3c; }",
			// Progress section
			".atlas_progress_section { margin-bottom: 16px; animation: atlas_fadeIn 0.3s ease-out; }",
			".atlas_progress_outer { width: 100%; max-width: 900px; height: 10px; background: rgba(128,128,128,0.12); border-radius: 6px; overflow: hidden; position: relative; }",
			".atlas_progress_outer::after { content: ''; position: absolute; top: 0; left: 0; right: 0; bottom: 0; background: linear-gradient(90deg, transparent, rgba(255,255,255,0.05), transparent); background-size: 200% 100%; animation: atlas_shimmer 2s infinite; }",
			".atlas_progress_inner { height: 100%; background: linear-gradient(90deg, #3498db, #9b59b6, #2ecc71); background-size: 200% 100%; border-radius: 6px; transition: width 0.4s cubic-bezier(0.4, 0, 0.2, 1); box-shadow: 0 0 12px rgba(52,152,219,0.4); }",
			".atlas_progress_info { display: flex; justify-content: space-between; align-items: center; margin-top: 6px; }",
			".atlas_progress_label { font-size: 0.82em; opacity: 0.7; font-weight: 500; }",
			".atlas_time_estimate { font-size: 0.78em; opacity: 0.5; font-style: italic; }",
			// Parameters panel
			".atlas_params_panel { display: flex; flex-wrap: wrap; gap: 12px; margin-bottom: 14px; padding: 12px 14px; background: rgba(128,128,128,0.04); border: 1px solid rgba(128,128,128,0.1); border-radius: 10px; animation: atlas_fadeIn 0.4s ease-out; }",
			".atlas_param_row { display: flex; align-items: center; gap: 8px; }",
			".atlas_param_label { font-size: 0.8em; opacity: 0.6; min-width: 70px; font-weight: 500; }",
			".atlas_param_input { max-width: 100px; }",
			".atlas_range_wrap { display: flex; align-items: center; gap: 6px; }",
			".atlas_range { width: 100px; height: 4px; -webkit-appearance: none; appearance: none; background: rgba(128,128,128,0.2); border-radius: 2px; outline: none; cursor: pointer; }",
			".atlas_range::-webkit-slider-thumb { -webkit-appearance: none; width: 14px; height: 14px; border-radius: 50%; background: #3498db; cursor: pointer; box-shadow: 0 2px 6px rgba(52,152,219,0.4); transition: transform 0.2s; }",
			".atlas_range::-webkit-slider-thumb:hover { transform: scale(1.2); }",
			".atlas_range_val { font-size: 0.78em; opacity: 0.6; min-width: 40px; font-family: 'SF Mono', 'Fira Code', monospace; }"
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
		_state.stopRequested = false;

		// Build the live UI immediately (with canvas, progress bar, toggle button)
		_buildLiveUI(container);

		setTimeout(function () {
			_buildAtlas(function (error, meta) {
				if (error) {
					container.innerHTML = "<div class='atlas_wrapper atlas_fade_in'><div class='atlas_error'>⚠ " + error + "</div></div>";
					return;
				}
				// Rebuild the final UI with all controls
				_buildUI(container, meta);
			}, function (msg, pct) {
				if (_state.progressBar) {
					_state.progressBar.style.width = (pct * 100).toFixed(1) + "%";
				}
				if (_state.progressLabel) {
					_state.progressLabel.textContent = msg;
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
