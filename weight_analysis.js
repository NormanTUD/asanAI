"use strict";

// ============================================================
// WEIGHT ANALYSIS - "Ist das Modell trainiert?"
// ============================================================

var WeightAnalysis = (function() {

	// ============================================================
	// HELPER FUNCTIONS
	// ============================================================

	function _getWeightsFromModel(m) {
		if (!m) m = (typeof model !== "undefined") ? model : null;
		if (!m || !m.getWeights) return null;

		var weights = [];
		try {
			var rawWeights = m.getWeights();
			for (var i = 0; i < rawWeights.length; i++) {
				if (!rawWeights[i].isDisposed) {
					weights.push({
						name: m.weights[i] ? m.weights[i].name : "weight_" + i,
						shape: rawWeights[i].shape,
						data: rawWeights[i].dataSync()
					});
				}
			}
		} catch (e) {
			console.warn("[WeightAnalysis] Could not get weights:", e);
			return null;
		}
		return weights;
	}

	function _computeStats(arr) {
		if (!arr || arr.length === 0) return null;
		var min = Infinity, max = -Infinity, sum = 0, sumSq = 0;
		var zeros = 0, nanCount = 0, infCount = 0;

		for (var i = 0; i < arr.length; i++) {
			var v = arr[i];
			if (isNaN(v)) { nanCount++; continue; }
			if (!isFinite(v)) { infCount++; continue; }
			if (v < min) min = v;
			if (v > max) max = v;
			sum += v;
			sumSq += v * v;
			if (v === 0) zeros++;
		}

		var n = arr.length - nanCount - infCount;
		var mean = n > 0 ? sum / n : 0;
		var variance = n > 1 ? (sumSq / n) - (mean * mean) : 0;
		var std = Math.sqrt(Math.max(0, variance));

		var kurtosis = 0;
		var skewness = 0;
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
			kurtosis = ((sumFourth / n) / (std * std * std * std)) - 3;
		}

		return {
			count: arr.length, min: min, max: max, mean: mean, std: std,
			variance: variance, zeros: zeros, nanCount: nanCount, infCount: infCount,
			zeroFraction: arr.length > 0 ? zeros / arr.length : 0,
			kurtosis: kurtosis, skewness: skewness,
			range: (max !== -Infinity && min !== Infinity) ? max - min : 0
		};
	}

	function _computeHistogram(arr, bins) {
		bins = bins || 50;
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

	// ============================================================
	// ENTROPY ANALYSIS
	// ============================================================

	function _computeEntropy(arr, bins) {
		bins = bins || 50;
		var hist = _computeHistogram(arr, bins);
		if (!hist || !hist.counts) return 0;

		var total = 0;
		for (var i = 0; i < hist.counts.length; i++) total += hist.counts[i];
		if (total === 0) return 0;

		var entropy = 0;
		for (var i = 0; i < hist.counts.length; i++) {
			if (hist.counts[i] > 0) {
				var p = hist.counts[i] / total;
				entropy -= p * Math.log2(p);
			}
		}
		return entropy;
	}

	// ============================================================
	// SPARSITY ANALYSIS
	// ============================================================

	function _computeSparsity(arr, stats) {
		if (!arr || arr.length === 0 || !stats) return 0;
		// Use a threshold relative to the layer's std deviation
		// Weights within 5% of std are considered "near-zero" (pruned/sparse)
		var threshold = Math.max(1e-6, stats.std * 0.05);
		var nearZero = 0;
		for (var i = 0; i < arr.length; i++) {
			if (Math.abs(arr[i]) < threshold) nearZero++;
		}
		return nearZero / arr.length;
	}

	function _computeLayerScore(indicators, isBiasLayer, shape) {
		var entropyScore = indicators.entropy.score;
		var sparsityScore = indicators.sparsity.score;
		var svdScore = indicators.svd.score;
		var kurtosisScore = indicators.kurtosis.score;
		var ksScore = indicators.ksTest.score;
		var corrScore = indicators.correlation.score;
		var initDevScore = indicators.initDeviation ? indicators.initDeviation.score : 0;

		if (isBiasLayer) {
			// For bias layers, the primary signal is: are they non-zero?
			// Biases are almost always initialized to 0. Any significant value = trained.
			// Use initDeviation and KS-test as primary indicators
			var biasScore = Math.max(initDevScore, ksScore, entropyScore);
			return Math.max(0, Math.min(100, biasScore));
		}

		// For kernel layers: use a "max of strong signals" approach combined with average
		// This prevents a single weak indicator from dragging down the score
		var allScores = [entropyScore, sparsityScore, svdScore, kurtosisScore, ksScore, corrScore, initDevScore];
		allScores.sort(function(a, b) { return b - a; }); // descending

		// Weighted average emphasizing top signals
		var weightedAvg = (
			entropyScore * 0.10 +
			sparsityScore * 0.12 +
			svdScore * 0.20 +
			kurtosisScore * 0.10 +
			ksScore * 0.15 +
			corrScore * 0.08 +
			initDevScore * 0.25
		);

		// "Any strong signal" boost: if top-2 indicators are high, boost overall
		var topSignalBoost = 0;
		if (allScores[0] > 50) {
			topSignalBoost = allScores[0] * 0.2;
		}
		if (allScores.length > 1 && allScores[1] > 40) {
			topSignalBoost += allScores[1] * 0.1;
		}

		var finalLayerScore = weightedAvg + topSignalBoost;

		// Clamp
		return Math.max(0, Math.min(100, finalLayerScore));
	}



	function _computeLayerScore(indicators, isBiasLayer, shape) {
		var entropyScore = indicators.entropy.score;
		var sparsityScore = indicators.sparsity.score;
		var svdScore = indicators.svd.score;
		var kurtosisScore = indicators.kurtosis.score;
		var ksScore = indicators.ksTest.score;
		var corrScore = indicators.correlation.score;
		var initDevScore = indicators.initDeviation ? indicators.initDeviation.score : 0;

		if (isBiasLayer) {
			var biasScore = Math.max(initDevScore, ksScore, entropyScore);
			return Math.max(0, Math.min(100, biasScore));
		}

		// Weighted average emphasizing the strongest signals
		var weightedAvg = (
			entropyScore * 0.08 +
			sparsityScore * 0.10 +
			svdScore * 0.18 +
			kurtosisScore * 0.09 +
			ksScore * 0.13 +
			corrScore * 0.07 +
			initDevScore * 0.35
		);

		// "Any strong signal" boost: if top indicators are high, boost overall
		var allScores = [entropyScore, sparsityScore, svdScore, kurtosisScore, ksScore, corrScore, initDevScore];
		allScores.sort(function(a, b) { return b - a; });

		var topSignalBoost = 0;
		if (allScores[0] > 30) {
			topSignalBoost = allScores[0] * 0.25;
		}
		if (allScores.length > 1 && allScores[1] > 20) {
			topSignalBoost += allScores[1] * 0.12;
		}
		if (allScores.length > 2 && allScores[2] > 15) {
			topSignalBoost += allScores[2] * 0.05;
		}

		var finalLayerScore = weightedAvg + topSignalBoost;
		return Math.max(0, Math.min(100, finalLayerScore));
	}

	function _computeInitDeviationScore(stats, shape) {
		if (!stats || !shape || shape.length < 2) return 0;

		var fanIn, fanOut;

		if (shape.length === 4) {
			var receptiveFieldSize = shape[0] * shape[1];
			fanIn = shape[2] * receptiveFieldSize;
			fanOut = shape[3] * receptiveFieldSize;
		} else if (shape.length === 2) {
			fanIn = shape[0];
			fanOut = shape[1];
		} else {
			return 0;
		}

		// Expected std for different initialization schemes
		var glorotUniformLimit = Math.sqrt(6.0 / (fanIn + fanOut));
		var glorotUniformStd = glorotUniformLimit / Math.sqrt(3);
		var glorotNormalStd = Math.sqrt(2.0 / (fanIn + fanOut));
		var heNormalStd = Math.sqrt(2.0 / fanIn);
		var lecunNormalStd = Math.sqrt(1.0 / fanIn);

		var candidates = [glorotUniformStd, glorotNormalStd, heNormalStd, lecunNormalStd];
		var actualStd = stats.std;

		// Find closest init scheme
		var minDeviation = Infinity;
		var closestExpectedStd = candidates[0];
		for (var i = 0; i < candidates.length; i++) {
			var deviation = Math.abs(actualStd - candidates[i]) / Math.max(candidates[i], 1e-8);
			if (deviation < minDeviation) {
				minDeviation = deviation;
				closestExpectedStd = candidates[i];
			}
		}

		// Mean shift from zero — THE strongest signal for training
		// Even 1 epoch of training shifts the mean away from 0
		var meanShift = Math.abs(stats.mean) / Math.max(closestExpectedStd, 1e-8);

		// Std deviation change — trained networks' std drifts from init
		var stdScore = Math.min(minDeviation / 0.03 * 100, 100);

		// Mean score — even tiny mean shifts are significant
		// Random init mean for N params: expected |mean| ~ std/sqrt(N)
		// So normalize by expected random mean
		var expectedRandomMean = closestExpectedStd / Math.sqrt(Math.max(stats.count, 1));
		var meanSignificance = Math.abs(stats.mean) / Math.max(expectedRandomMean, 1e-10);
		// If mean is more than 2x what random would produce, that's training
		var meanScore = Math.min((meanSignificance / 2.0) * 100, 100);

		// Kurtosis deviation — uniform init has kurtosis=-1.2, normal has 0
		// Training pushes kurtosis positive (heavy tails / sparsity)
		var kurtosisScore = 0;
		// Check against both uniform (-1.2) and normal (0) expected values
		var kurtDevFromUniform = Math.abs(stats.kurtosis - (-1.2));
		var kurtDevFromNormal = Math.abs(stats.kurtosis - 0);
		var minKurtDev = Math.min(kurtDevFromUniform, kurtDevFromNormal);
		kurtosisScore = Math.min(minKurtDev / 0.3 * 100, 100);

		// Skewness — init should be ~0, training can introduce asymmetry
		var skewScore = Math.min(Math.abs(stats.skewness) / 0.05 * 100, 100);

		// Combined with emphasis on mean shift (most reliable for short training)
		var combined = stdScore * 0.25 + meanScore * 0.35 + kurtosisScore * 0.20 + skewScore * 0.20;
		return Math.max(0, Math.min(100, combined));
	}

	function _computeEntropyIndicator(data) {
		var entropy = _computeEntropy(data, 50);
		var maxEntropy = Math.log2(50);
		var entropyRatio = entropy / maxEntropy;
		var entropyBaseline = 0.92;
		var entropyScore = 0;
		if (entropyRatio < entropyBaseline) {
			entropyScore = ((entropyBaseline - entropyRatio) / entropyBaseline) * 250;
		}
		if (entropyRatio > 0.99) {
			entropyScore = Math.max(entropyScore, 10);
		}
		entropyScore = Math.min(Math.max(0, entropyScore), 100);
		return { value: entropy, maxEntropy: maxEntropy, ratio: entropyRatio, score: entropyScore };
	}

	function _computeSparsityIndicator(data, stats) {
		var sparsity = _computeSparsity(data, stats);
		var sparsityBaseline = 0.02;
		var sparsityAdjusted = Math.max(0, sparsity - sparsityBaseline);
		var sparsityScore = Math.min(sparsityAdjusted * 400, 100);
		return { value: sparsity, score: sparsityScore };
	}

	function _computeSVDIndicator(data, shape) {
		var svdSteepness = _computeSVDSteepness(data, shape);
		var svdScore = Math.min(svdSteepness * 200, 100);
		return { steepness: svdSteepness, score: svdScore };
	}

	function _computeKurtosisIndicator(stats) {
		var kurtosisBaseline = 0.3;
		var kurtosisAdjusted = Math.max(0, Math.abs(stats.kurtosis) - kurtosisBaseline);
		var kurtosisScore = Math.min(kurtosisAdjusted * 40, 100);
		return { value: stats.kurtosis, score: kurtosisScore };
	}

	function _computeKSIndicator(data, stats) {
		var ksD = _ksTestAgainstNormal(Array.from(data), stats.mean, stats.std);
		var ksBaseline = 0.01;
		var ksAdjusted = Math.max(0, ksD - ksBaseline);
		var ksScore = Math.min(ksAdjusted * 800, 100);
		return { d: ksD, score: ksScore };
	}

	function _computeCorrelationIndicator(data, shape) {
		var correlation = _computeAvgInterFilterCorrelation(data, shape);
		var corrScore = Math.min(correlation * 500, 100);
		return { value: correlation, score: corrScore };
	}

	function _computeBiasLayerScore(data) {
		var biasNonZero = 0;
		var biasMaxAbs = 0;
		for (var j = 0; j < data.length; j++) {
			if (Math.abs(data[j]) > 1e-7) biasNonZero++;
			if (Math.abs(data[j]) > biasMaxAbs) biasMaxAbs = Math.abs(data[j]);
		}
		var biasNonZeroFrac = biasNonZero / Math.max(data.length, 1);
		var layerScore = Math.min(biasNonZeroFrac * 120, 100);
		layerScore = Math.max(layerScore, Math.min(biasMaxAbs * 200, 100));
		return layerScore;
	}

	function _computeKernelLayerScore(indicators) {
		var initDevScore = indicators.initDeviation.score;
		var svdScore = indicators.svd.score;
		var ksScore = indicators.ksTest.score;
		var sparsityScore = indicators.sparsity.score;
		var kurtosisScore = indicators.kurtosis.score;
		var entropyScore = indicators.entropy.score;
		var corrScore = indicators.correlation.score;

		var allScores = [
			{ score: initDevScore, weight: 0.40 },
			{ score: svdScore, weight: 0.15 },
			{ score: ksScore, weight: 0.12 },
			{ score: sparsityScore, weight: 0.10 },
			{ score: kurtosisScore, weight: 0.08 },
			{ score: entropyScore, weight: 0.08 },
			{ score: corrScore, weight: 0.07 }
		];

		var weightedSum = 0;
		for (var j = 0; j < allScores.length; j++) {
			weightedSum += allScores[j].score * allScores[j].weight;
		}

		var sortedScores = allScores.map(function(x) { return x.score; }).sort(function(a, b) { return b - a; });
		var topBoost = 0;
		if (sortedScores[0] > 25) topBoost += sortedScores[0] * 0.20;
		if (sortedScores[1] > 15) topBoost += sortedScores[1] * 0.10;
		if (sortedScores[2] > 10) topBoost += sortedScores[2] * 0.05;

		return weightedSum + topBoost;
	}

	function _buildSortedData(data) {
		var sortedData = [];
		for (var si = 0; si < data.length; si++) {
			if (!isNaN(data[si]) && isFinite(data[si])) sortedData.push(data[si]);
		}
		sortedData.sort(function(a, b) { return a - b; });
		return sortedData;
	}

	function _analyzeLayer(w) {
		var data = w.data;
		var stats = _computeStats(data);
		if (!stats) return null;

		var isBiasLayer = w.name.toLowerCase().includes("bias");

		var indicators = {};
		indicators.entropy = _computeEntropyIndicator(data);
		indicators.sparsity = _computeSparsityIndicator(data, stats);
		indicators.svd = _computeSVDIndicator(data, w.shape);
		indicators.kurtosis = _computeKurtosisIndicator(stats);
		indicators.ksTest = _computeKSIndicator(data, stats);
		indicators.correlation = _computeCorrelationIndicator(data, w.shape);
		indicators.initDeviation = { score: _computeInitDeviationScore(stats, w.shape) };

		var layerScore = 0;
		if (isBiasLayer) {
			layerScore = _computeBiasLayerScore(data);
		} else {
			layerScore = _computeKernelLayerScore(indicators);
		}
		layerScore = Math.max(0, Math.min(100, layerScore));

		var sortedData = _buildSortedData(data);

		return {
			name: w.name,
			shape: w.shape,
			paramCount: data.length,
			stats: stats,
			indicators: indicators,
			score: layerScore,
			histogram: _computeHistogram(data, 40),
			sortedData: sortedData,
			l2Norm: Math.sqrt(sortedData.reduce(function(s, v) { return s + v * v; }, 0))
		};
	}

	function analyzeModel(m) {
		var weights = _getWeightsFromModel(m);
		if (!weights || weights.length === 0) {
			return { score: 0, confidence: 0, message: "wa_no_weights_found", layers: [] };
		}

		var layerResults = [];
		var totalScore = 0;
		var totalWeight = 0;

		for (var i = 0; i < weights.length; i++) {
			var layerResult = _analyzeLayer(weights[i]);
			if (!layerResult) continue;

			totalScore += layerResult.score * layerResult.paramCount;
			totalWeight += layerResult.paramCount;
			layerResults.push(layerResult);
		}

		var biasScore = _analyzeBiases(weights) * 100;

		var rawScore = totalWeight > 0 ? totalScore / totalWeight : 0;
		var finalScore = rawScore * 0.65 + biasScore * 0.35;
		finalScore = Math.max(0, Math.min(100, finalScore));

		var totalParams = 0;
		for (var i = 0; i < weights.length; i++) totalParams += weights[i].data.length;
		var confidence = Math.min(100, Math.log10(totalParams + 1) * 25);

		var messageKey = "";
		if (finalScore > 60) messageKey = "wa_model_very_likely_trained";
		else if (finalScore > 50) messageKey = "wa_model_shows_training_signs";
		else if (finalScore > 15) messageKey = "wa_model_slightly_trained_or_special_init";
		else messageKey = "wa_model_seems_untrained";

		return {
			score: Math.round(finalScore),
			confidence: Math.round(confidence),
			messageKey: messageKey,
			biasScore: Math.round(biasScore),
			layers: layerResults,
			totalParams: totalParams
		};
	}

	// ============================================================
	// SVD SPECTRUM (approximation)
	// ============================================================

	function _computeSVDSteepness(arr, shape) {
		if (!arr || !shape || shape.length < 2) return 0;

		// Reshape into 2D matrix: (inputDim, outputDim)
		var rows, cols;
		if (shape.length === 4) {
			// Conv layer: [H, W, C_in, C_out] -> reshape to (H*W*C_in, C_out)
			rows = shape[0] * shape[1] * shape[2];
			cols = shape[3];
		} else if (shape.length === 2) {
			// Dense layer: [in, out]
			rows = shape[0];
			cols = shape[1];
		} else if (shape.length === 1) {
			// Bias vector - no meaningful SVD
			return 0;
		} else {
			// Fallback: flatten to roughly square
			var total = 1;
			for (var i = 0; i < shape.length; i++) total *= shape[i];
			cols = shape[shape.length - 1];
			rows = total / cols;
		}

		if (rows < 2 || cols < 2) return 0;

		// Compute Gram matrix (A^T * A) for singular value approximation
		// This is cols x cols, which is manageable
		var minDim = Math.min(rows, cols);
		var maxDim = Math.max(rows, cols);

		// If matrix is too large, subsample rows
		var sampleRows = Math.min(rows, 2000);
		var rowStep = Math.max(1, Math.floor(rows / sampleRows));
		var actualRows = Math.ceil(rows / rowStep);

		// Build A^T * A (cols x cols)
		var gram = new Float64Array(cols * cols);
		for (var sampledR = 0; sampledR < rows; sampledR += rowStep) {
			for (var c1 = 0; c1 < cols; c1++) {
				var val1 = arr[sampledR * cols + c1] || 0;
				for (var c2 = c1; c2 < cols; c2++) {
					var val2 = arr[sampledR * cols + c2] || 0;
					var prod = val1 * val2;
					gram[c1 * cols + c2] += prod;
					if (c1 !== c2) gram[c2 * cols + c1] += prod;
				}
			}
		}

		// Power iteration to get top-k singular values (approximation)
		var k = Math.min(cols, 10);
		var singularValues = [];

		// Deflated power iteration
		var deflatedGram = new Float64Array(gram);

		for (var sv = 0; sv < k; sv++) {
			// Random initial vector
			var vec = new Float64Array(cols);
			for (var j = 0; j < cols; j++) vec[j] = Math.random() - 0.5;

			// Normalize
			var norm = 0;
			for (var j = 0; j < cols; j++) norm += vec[j] * vec[j];
			norm = Math.sqrt(norm);
			if (norm === 0) break;
			for (var j = 0; j < cols; j++) vec[j] /= norm;

			// Power iteration (20 iterations is usually enough)
			for (var iter = 0; iter < 30; iter++) {
				var newVec = new Float64Array(cols);
				for (var r = 0; r < cols; r++) {
					var sum = 0;
					for (var c = 0; c < cols; c++) {
						sum += deflatedGram[r * cols + c] * vec[c];
					}
					newVec[r] = sum;
				}
				// Compute eigenvalue (Rayleigh quotient)
				norm = 0;
				for (var j = 0; j < cols; j++) norm += newVec[j] * newVec[j];
				norm = Math.sqrt(norm);
				if (norm < 1e-12) break;
				for (var j = 0; j < cols; j++) vec[j] = newVec[j] / norm;
			}

			// Eigenvalue = v^T * A * v
			var eigenvalue = 0;
			for (var r = 0; r < cols; r++) {
				var sum = 0;
				for (var c = 0; c < cols; c++) {
					sum += deflatedGram[r * cols + c] * vec[c];
				}
				eigenvalue += vec[r] * sum;
			}

			singularValues.push(Math.max(0, eigenvalue));

			// Deflate: remove this eigenvector's contribution
			for (var r = 0; r < cols; r++) {
				for (var c = 0; c < cols; c++) {
					deflatedGram[r * cols + c] -= eigenvalue * vec[r] * vec[c];
				}
			}
		}

		// Compute energy concentration
		var totalEnergy = 0;
		for (var i = 0; i < singularValues.length; i++) totalEnergy += singularValues[i];
		if (totalEnergy === 0) return 0;

		// Top-1 concentration (how much the first singular value dominates)
		var top1Ratio = singularValues[0] / totalEnergy;

		// For random matrices, the Marchenko-Pastur law predicts the top eigenvalue ratio
		// For a random (m x n) matrix with m >> n, top eigenvalue ~ (1 + sqrt(n/m))^2 * sigma^2
		// The expected top-1 ratio for random is approximately 1/min(rows,cols) * correction
		var aspectRatio = Math.min(rows, cols) / Math.max(rows, cols);
		var randomBaseline = (1 + Math.sqrt(aspectRatio)) * (1 + Math.sqrt(aspectRatio)) / cols;
		// Simplified: for typical layers, random baseline for top-1 ratio is ~0.15-0.35
		var empiricalBaseline = 0.30;

		var corrected = (top1Ratio - empiricalBaseline) / (1 - empiricalBaseline);
		return Math.max(0, Math.min(1, corrected));
	}

	// ============================================================
	// BIAS ANALYSIS
	// ============================================================

	function _analyzeBiases(weights) {
		var biasLayers = [];

		for (var i = 0; i < weights.length; i++) {
			if (weights[i].name.toLowerCase().includes("bias")) {
				biasLayers.push(weights[i]);
			}
		}

		if (biasLayers.length === 0) return 0;

		var totalScore = 0;

		for (var b = 0; b < biasLayers.length; b++) {
			var data = biasLayers[b].data;
			var n = data.length;
			if (n === 0) continue;

			// Metric 1: L2 norm of biases (should be 0 for untrained)
			var l2 = 0;
			var maxAbs = 0;
			var sum = 0;
			var nonZeroCount = 0;

			for (var j = 0; j < n; j++) {
				var v = data[j];
				l2 += v * v;
				sum += v;
				if (Math.abs(v) > maxAbs) maxAbs = Math.abs(v);
				if (Math.abs(v) > 1e-7) nonZeroCount++;
			}
			l2 = Math.sqrt(l2);
			var mean = sum / n;

			// Metric 2: Fraction of non-zero biases
			var nonZeroFraction = nonZeroCount / n;

			// Metric 3: Variance of biases (trained biases have structure/variance)
			var variance = 0;
			for (var j = 0; j < n; j++) {
				var diff = data[j] - mean;
				variance += diff * diff;
			}
			variance = variance / Math.max(1, n - 1);
			var std = Math.sqrt(variance);

			// Metric 4: Are biases correlated with their position?
			// (trained biases often have patterns, e.g., some channels activated more)
			var hasPattern = 0;
			if (n >= 4) {
				// Check if there's a trend or clustering
				var firstHalfMean = 0, secondHalfMean = 0;
				var half = Math.floor(n / 2);
				for (var j = 0; j < half; j++) firstHalfMean += data[j];
				for (var j = half; j < n; j++) secondHalfMean += data[j];
				firstHalfMean /= half;
				secondHalfMean /= (n - half);
				var halfDiff = Math.abs(firstHalfMean - secondHalfMean);
				if (std > 0) hasPattern = Math.min(halfDiff / std, 1.0);
			}

			// Scoring for this bias layer
			// Any non-zero bias is evidence (since init is always 0)
			var layerBiasScore = 0;

			// Strong signal: large magnitude biases
			var magnitudeScore = Math.min(maxAbs * 150, 100); // maxAbs > 0.67 -> 100%

			// Medium signal: most biases are non-zero
			var coverageScore = nonZeroFraction * 100;

			// Supporting signal: variance (structured biases)
			var varianceScore = Math.min(std * 200, 100); // std > 0.5 -> 100%

			// Pattern bonus
			var patternBonus = hasPattern * 20;

			layerBiasScore = magnitudeScore * 0.45 + coverageScore * 0.25 + varianceScore * 0.20 + patternBonus * 0.10;
			layerBiasScore = Math.min(100, layerBiasScore);

			totalScore += layerBiasScore;
		}

		return biasLayers.length > 0 ? totalScore / biasLayers.length / 100 : 0;
	}

	// ============================================================
	// INTER-FILTER CORRELATION
	// ============================================================

	function _computeCorrelation(arr1, arr2) {
		if (arr1.length !== arr2.length || arr1.length === 0) return 0;
		var n = arr1.length;
		var sum1 = 0, sum2 = 0, sum1Sq = 0, sum2Sq = 0, sumProd = 0;
		for (var i = 0; i < n; i++) {
			sum1 += arr1[i];
			sum2 += arr2[i];
			sum1Sq += arr1[i] * arr1[i];
			sum2Sq += arr2[i] * arr2[i];
			sumProd += arr1[i] * arr2[i];
		}
		var num = sumProd - (sum1 * sum2 / n);
		var den = Math.sqrt((sum1Sq - sum1 * sum1 / n) * (sum2Sq - sum2 * sum2 / n));
		if (den === 0) return 0;
		return Math.abs(num / den);
	}

	function _computeAvgInterFilterCorrelation(weightData, shape) {
		if (!shape || shape.length < 2) return 0;

		var lastDim = shape[shape.length - 1];
		if (lastDim < 2) return 0;

		var filterSize = weightData.length / lastDim;
		if (filterSize < 1) return 0;

		var filters = [];
		for (var f = 0; f < lastDim; f++) {
			var filter = [];
			for (var j = 0; j < filterSize; j++) {
				filter.push(weightData[j * lastDim + f]);
			}
			filters.push(filter);
		}

		var totalCorr = 0;
		var pairs = 0;
		var maxPairs = Math.min(20, lastDim * (lastDim - 1) / 2);
		for (var a = 0; a < lastDim && pairs < maxPairs; a++) {
			for (var b = a + 1; b < lastDim && pairs < maxPairs; b++) {
				totalCorr += _computeCorrelation(filters[a], filters[b]);
				pairs++;
			}
		}

		return pairs > 0 ? totalCorr / pairs : 0;
	}

	// ============================================================
	// KOLMOGOROV-SMIRNOV TEST
	// ============================================================

	function _ksTestAgainstNormal(arr, mean, std) {
		if (!arr || arr.length < 10 || std === 0) return 0;
		var sorted = arr.slice().filter(function(v) { return !isNaN(v) && isFinite(v); });
		sorted.sort(function(a, b) { return a - b; });
		var n = sorted.length;
		var maxD = 0;

		for (var i = 0; i < n; i++) {
			var empirical = (i + 1) / n;
			var z = (sorted[i] - mean) / std;
			var theoretical = 0.5 * (1 + _erf(z / Math.sqrt(2)));
			var d = Math.abs(empirical - theoretical);
			if (d > maxD) maxD = d;
		}
		return maxD;
	}

	function _erf(x) {
		var a1 = 0.254829592, a2 = -0.284496736, a3 = 1.421413741;
		var a4 = -1.453152027, a5 = 1.061405429, p = 0.3275911;
		var sign = x < 0 ? -1 : 1;
		x = Math.abs(x);
		var t = 1.0 / (1.0 + p * x);
		var y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);
		return sign * y;
	}

	// ============================================================
	// PERCENTILE HELPER (for box plots)
	// ============================================================

	function _percentile(sortedArr, p) {
		if (!sortedArr || sortedArr.length === 0) return 0;
		var idx = (p / 100) * (sortedArr.length - 1);
		var lower = Math.floor(idx);
		var upper = Math.ceil(idx);
		if (lower === upper) return sortedArr[lower];
		return sortedArr[lower] + (idx - lower) * (sortedArr[upper] - sortedArr[lower]);
	}

	// ============================================================
	// RENDERING HELPERS
	// ============================================================

	function _trm(key) {
		return "<span class='TRANSLATEME_" + key + "'></span>";
	}

	function _histogramSVG(histogram, title) {
		if (!histogram || !histogram.counts || histogram.binWidth === 0) return "";
		var width = 300, height = 60;
		var maxCount = Math.max.apply(null, histogram.counts) || 1;
		var barWidth = width / histogram.counts.length;

		var svg = "<svg width='100%' viewBox='0 0 " + width + " " + (height + 16) + "' style='display:block; max-width:400px;'>";

		for (var i = 0; i < histogram.counts.length; i++) {
			var barHeight = (histogram.counts[i] / maxCount) * height;
			var x = i * barWidth;
			var y = height - barHeight;
			var binCenter = histogram.binEdges[i] + histogram.binWidth / 2;

			var color = binCenter < 0 ? "#3498db" : "#2ecc71";
			if (Math.abs(binCenter) < histogram.binWidth) color = "#e74c3c";

			svg += "<rect x='" + x + "' y='" + y + "' width='" + Math.max(barWidth - 0.5, 0.5) +
				"' height='" + barHeight + "' fill='" + color + "' opacity='0.8'/>";
		}

		if (histogram.min < 0 && histogram.max > 0) {
			var zeroX = ((0 - histogram.min) / (histogram.max - histogram.min)) * width;
			svg += "<line x1='" + zeroX + "' y1='0' x2='" + zeroX + "' y2='" + height + "' stroke='#333' stroke-width='0.5' stroke-dasharray='2,2' opacity='0.5'/>";
		}

		svg += "<text x='2' y='" + (height + 12) + "' font-size='8' fill='currentColor' opacity='0.5'>" + histogram.min.toFixed(3) + "</text>";
		svg += "<text x='" + (width - 40) + "' y='" + (height + 12) + "' font-size='8' fill='currentColor' opacity='0.5'>" + histogram.max.toFixed(3) + "</text>";

		svg += "</svg>";
		return svg;
	}

	function _scoreGauge(score, size) {
		size = size || 120;
		var radius = size / 2 - 10;
		var cx = size / 2, cy = size / 2;
		var circumference = 2 * Math.PI * radius;
		var offset = circumference * (1 - score / 100);

		var color = score > 75 ? "#2ecc71" : score > 50 ? "#f39c12" : score > 30 ? "#e67e22" : "#e74c3c";

		var svg = "<svg width='" + size + "' height='" + size + "' viewBox='0 0 " + size + " " + size + "'>";
		svg += "<circle cx='" + cx + "' cy='" + cy + "' r='" + radius + "' fill='none' stroke='rgba(128,128,128,0.2)' stroke-width='8'/>";
		svg += "<circle cx='" + cx + "' cy='" + cy + "' r='" + radius + "' fill='none' stroke='" + color + "' stroke-width='8' " +
			"stroke-dasharray='" + circumference + "' stroke-dashoffset='" + offset + "' " +
			"transform='rotate(-90 " + cx + " " + cy + ")' stroke-linecap='round'/>";
		svg += "<text x='" + cx + "' y='" + (cy + 8) + "' text-anchor='middle' font-size='24' font-weight='bold' fill='" + color + "'>" + score + "%</text>";
		svg += "</svg>";
		return svg;
	}

	function _indicatorBar(labelKey, score, detail) {
		var color = score > 70 ? "#2ecc71" : score > 40 ? "#f39c12" : "#e74c3c";
		var html = "<div style='margin: 6px 0;'>";
		html += "<div style='display:flex; justify-content:space-between; font-size:0.85em;'>";
		html += "<span>" + _trm(labelKey) + "</span>";
		html += "<span style='opacity:0.6;'>" + detail + "</span>";
		html += "</div>";
		html += "<div style='height:6px; background:rgba(128,128,128,0.15); border-radius:3px; overflow:hidden;'>";
		html += "<div style='height:100%; width:" + Math.max(0, Math.min(100, score)) + "%; background:" + color + "; border-radius:3px; transition:width 0.5s;'></div>";
		html += "</div></div>";
		return html;
	}

	// ============================================================
	// NEW VISUALIZATIONS
	// ============================================================

	// Box Plot SVG per layer
	function _boxPlotSVG(sortedData, stats) {
		if (!sortedData || sortedData.length < 5) return "";
		var width = 300, height = 40;
		var q1 = _percentile(sortedData, 25);
		var q2 = _percentile(sortedData, 50);
		var q3 = _percentile(sortedData, 75);
		var iqr = q3 - q1;
		var whiskerLow = Math.max(stats.min, q1 - 1.5 * iqr);
		var whiskerHigh = Math.min(stats.max, q3 + 1.5 * iqr);

		var dataMin = stats.min;
		var dataMax = stats.max;
		var range = dataMax - dataMin;
		if (range === 0) return "";

		function xPos(v) { return ((v - dataMin) / range) * (width - 20) + 10; }

		var svg = "<svg width='100%' viewBox='0 0 " + width + " " + height + "' style='display:block; max-width:400px;'>";
		var cy = height / 2;

		// Whisker line
		svg += "<line x1='" + xPos(whiskerLow) + "' y1='" + cy + "' x2='" + xPos(whiskerHigh) + "' y2='" + cy + "' stroke='currentColor' stroke-width='1' opacity='0.5'/>";
		// Whisker caps
		svg += "<line x1='" + xPos(whiskerLow) + "' y1='" + (cy - 8) + "' x2='" + xPos(whiskerLow) + "' y2='" + (cy + 8) + "' stroke='currentColor' stroke-width='1.5'/>";
		svg += "<line x1='" + xPos(whiskerHigh) + "' y1='" + (cy - 8) + "' x2='" + xPos(whiskerHigh) + "' y2='" + (cy + 8) + "' stroke='currentColor' stroke-width='1.5'/>";
		// Box
		svg += "<rect x='" + xPos(q1) + "' y='" + (cy - 12) + "' width='" + (xPos(q3) - xPos(q1)) + "' height='24' fill='rgba(52,152,219,0.3)' stroke='#3498db' stroke-width='1.5' rx='2'/>";
		// Median
		svg += "<line x1='" + xPos(q2) + "' y1='" + (cy - 12) + "' x2='" + xPos(q2) + "' y2='" + (cy + 12) + "' stroke='#e74c3c' stroke-width='2'/>";
		// Mean dot
		svg += "<circle cx='" + xPos(stats.mean) + "' cy='" + cy + "' r='3' fill='#f39c12'/>";

		svg += "</svg>";
		return svg;
	}

	// CDF (Cumulative Distribution Function) SVG
	function _cdfSVG(sortedData) {
		if (!sortedData || sortedData.length < 2) return "";
		var width = 300, height = 50;
		var n = sortedData.length;
		var step = Math.max(1, Math.floor(n / 150)); // sample points

		var svg = "<svg width='100%' viewBox='0 0 " + width + " " + (height + 14) + "' style='display:block; max-width:400px;'>";
		var path = "M";
		var dataMin = sortedData[0];
		var dataMax = sortedData[n - 1];
		var range = dataMax - dataMin;
		if (range === 0) return "";

		for (var i = 0; i < n; i += step) {
			var x = ((sortedData[i] - dataMin) / range) * width;
			var y = height - ((i + 1) / n) * height;
			path += (i === 0 ? "" : " L") + x.toFixed(1) + " " + y.toFixed(1);
		}
		// Ensure last point
		path += " L" + width + " 0";

		svg += "<path d='" + path + "' fill='none' stroke='#9b59b6' stroke-width='1.5'/>";
		svg += "<text x='2' y='" + (height + 12) + "' font-size='7' fill='currentColor' opacity='0.5'>" + dataMin.toFixed(3) + "</text>";
		svg += "<text x='" + (width - 40) + "' y='" + (height + 12) + "' font-size='7' fill='currentColor' opacity='0.5'>" + dataMax.toFixed(3) + "</text>";
		svg += "</svg>";
		return svg;
	}

	// Weight Norm Heatmap (all layers)
	function _weightNormHeatmapSVG(layers) {
		if (!layers || layers.length === 0) return "";
		var width = 400, height = 30;
		var barWidth = width / layers.length;
		var maxNorm = 0;
		for (var i = 0; i < layers.length; i++) {
			if (layers[i].l2Norm > maxNorm) maxNorm = layers[i].l2Norm;
		}
		if (maxNorm === 0) return "";

		var svg = "<svg width='100%' viewBox='0 0 " + width + " " + (height + 20) + "' style='display:block; max-width:500px;'>";
		for (var i = 0; i < layers.length; i++) {
			var intensity = layers[i].l2Norm / maxNorm;
			var r = Math.round(255 * intensity);
			var g = Math.round(100 * (1 - intensity));
			var b = Math.round(50);
			var x = i * barWidth;
			svg += "<rect x='" + x + "' y='0' width='" + Math.max(barWidth - 1, 1) + "' height='" + height + "' fill='rgb(" + r + "," + g + "," + b + ")' opacity='0.85'/>";
			if (layers.length <= 20) {
				svg += "<text x='" + (x + barWidth / 2) + "' y='" + (height + 12) + "' text-anchor='middle' font-size='6' fill='currentColor' opacity='0.6'>" + (i + 1) + "</text>";
			}
		}
		svg += "</svg>";
		return svg;
	}

	// Parameter Distribution Pie Chart
	function _paramPieChartSVG(layers) {
		if (!layers || layers.length === 0) return "";
		var size = 140;
		var cx = size / 2, cy = size / 2, radius = size / 2 - 10;
		var totalParams = 0;
		for (var i = 0; i < layers.length; i++) totalParams += layers[i].paramCount;
		if (totalParams === 0) return "";

		var colors = ["#3498db", "#2ecc71", "#e74c3c", "#f39c12", "#9b59b6", "#1abc9c", "#e67e22", "#34495e", "#16a085", "#c0392b"];
		var svg = "<svg width='" + size + "' height='" + size + "' viewBox='0 0 " + size + " " + size + "'>";
		var startAngle = 0;

		for (var i = 0; i < layers.length; i++) {
			var fraction = layers[i].paramCount / totalParams;
			var endAngle = startAngle + fraction * 2 * Math.PI;
			var largeArc = fraction > 0.5 ? 1 : 0;

			var x1 = cx + radius * Math.cos(startAngle);
			var y1 = cy + radius * Math.sin(startAngle);

			var x2 = cx + radius * Math.cos(endAngle);
			var y2 = cy + radius * Math.sin(endAngle);

			var color = colors[i % colors.length];

			if (fraction > 0.001) {
				var path = "M " + cx + " " + cy + " L " + x1 + " " + y1 + " A " + radius + " " + radius + " 0 " + largeArc + " 1 " + x2 + " " + y2 + " Z";
				svg += "<path d='" + path + "' fill='" + color + "' opacity='0.8' stroke='white' stroke-width='0.5'/>";
			}

			startAngle = endAngle;
		}

		svg += "</svg>";
		return svg;
	}

	// Training Score Timeline (bar chart of layer scores)
	function _layerScoreBarChartSVG(layers) {
		if (!layers || layers.length === 0) return "";
		var width = 400, height = 80;
		var barWidth = (width - 20) / layers.length;
		var maxScore = 100;

		var svg = "<svg width='100%' viewBox='0 0 " + width + " " + (height + 20) + "' style='display:block; max-width:500px;'>";

		for (var i = 0; i < layers.length; i++) {
			var barHeight = (layers[i].score / maxScore) * height;
			var x = 10 + i * barWidth;
			var y = height - barHeight;
			var color = layers[i].score > 60 ? "#2ecc71" : layers[i].score > 35 ? "#f39c12" : "#e74c3c";

			svg += "<rect x='" + x + "' y='" + y + "' width='" + Math.max(barWidth - 2, 2) + "' height='" + barHeight + "' fill='" + color + "' opacity='0.8' rx='2'/>";
			if (layers.length <= 15) {
				svg += "<text x='" + (x + barWidth / 2) + "' y='" + (height + 14) + "' text-anchor='middle' font-size='7' fill='currentColor' opacity='0.6'>" + Math.round(layers[i].score) + "</text>";
			}
		}

		// Threshold lines
		svg += "<line x1='10' y1='" + (height - 60 * height / 100) + "' x2='" + (width - 10) + "' y2='" + (height - 60 * height / 100) + "' stroke='#2ecc71' stroke-width='0.5' stroke-dasharray='3,3' opacity='0.4'/>";
		svg += "<line x1='10' y1='" + (height - 35 * height / 100) + "' x2='" + (width - 10) + "' y2='" + (height - 35 * height / 100) + "' stroke='#f39c12' stroke-width='0.5' stroke-dasharray='3,3' opacity='0.4'/>";

		svg += "</svg>";
		return svg;
	}

	// Std deviation comparison across layers
	function _stdComparisonSVG(layers) {
		if (!layers || layers.length === 0) return "";
		var width = 400, height = 50;
		var maxStd = 0;
		for (var i = 0; i < layers.length; i++) {
			if (layers[i].stats.std > maxStd) maxStd = layers[i].stats.std;
		}
		if (maxStd === 0) return "";

		var barWidth = (width - 20) / layers.length;
		var svg = "<svg width='100%' viewBox='0 0 " + width + " " + (height + 16) + "' style='display:block; max-width:500px;'>";

		for (var i = 0; i < layers.length; i++) {
			var barHeight = (layers[i].stats.std / maxStd) * height;
			var x = 10 + i * barWidth;
			var y = height - barHeight;
			svg += "<rect x='" + x + "' y='" + y + "' width='" + Math.max(barWidth - 2, 2) + "' height='" + barHeight + "' fill='#9b59b6' opacity='0.7' rx='1'/>";
		}

		svg += "<text x='2' y='" + (height + 12) + "' font-size='7' fill='currentColor' opacity='0.5'>0</text>";
		svg += "<text x='" + (width - 50) + "' y='" + (height + 12) + "' font-size='7' fill='currentColor' opacity='0.5'>max=" + maxStd.toFixed(4) + "</text>";
		svg += "</svg>";
		return svg;
	}

	// ============================================================
	// RENDER FUNCTION
	// ============================================================

	function weight_analysis_render(divOrId) {
		var container;

		if (typeof divOrId === "string" && divOrId !== "") {
			container = document.getElementById(divOrId);
		} else if (divOrId instanceof HTMLElement) {
			container = divOrId;
		}

		if (!container) {
			container = document.createElement("div");
			container.id = "weight_analysis_container";
			document.body.appendChild(container);
		}

		// Inject styles
		if (!document.getElementById("weight_analysis_styles")) {
			var style = document.createElement("style");
			style.id = "weight_analysis_styles";
			style.textContent = `
		.wa_container { padding: 20px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; }
		.wa_header { display: flex; align-items: center; gap: 24px; margin-bottom: 20px; flex-wrap: wrap; }
		.wa_message { font-size: 1.1em; font-weight: 500; margin-top: 8px; }
		.wa_confidence { font-size: 0.85em; opacity: 0.6; margin-top: 4px; }
		.wa_layer_card { border: 2px solid rgba(128,128,128,0.2); border-radius: 10px; padding: 16px; margin: 12px 0; background: rgba(128,128,128,0.03); }
		.wa_layer_card:hover { box-shadow: 0 2px 12px rgba(0,0,0,0.08); }
		.wa_layer_header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; }
		.wa_layer_name { font-weight: 600; font-size: 0.95em; }
		.wa_layer_score { font-size: 0.85em; font-weight: bold; padding: 2px 10px; border-radius: 12px; }
		.wa_layer_score_high { background: rgba(46,204,113,0.15); color: #27ae60; }
		.wa_layer_score_mid { background: rgba(243,156,18,0.15); color: #e67e22; }
		.wa_layer_score_low { background: rgba(231,76,60,0.15); color: #c0392b; }
		.wa_indicators { margin-top: 10px; }
		.wa_grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-top: 8px; }
		@media (max-width: 600px) { .wa_grid { grid-template-columns: 1fr; } }
		.wa_stats_mini { font-size: 0.78em; opacity: 0.6; font-family: monospace; margin-top: 6px; }
		.wa_comparison { margin-top: 24px; padding: 16px; border-radius: 10px; background: rgba(52,152,219,0.05); border: 2px solid rgba(52,152,219,0.2); }
		.wa_comparison h3 { margin: 0 0 12px 0; }
		.wa_no_model { padding: 40px; text-align: center; opacity: 0.6; font-size: 1.1em; }
		.wa_section { margin-top: 20px; padding: 16px; border-radius: 10px; background: rgba(155,89,182,0.05); border: 2px solid rgba(155,89,182,0.15); }
		.wa_section h3 { margin: 0 0 12px 0; }
		.wa_viz_label { font-size: 0.8em; opacity: 0.6; margin-bottom: 4px; margin-top: 12px; }
	    `;
			document.head.appendChild(style);
		}

		// Run analysis
		var m = (typeof model !== "undefined") ? model : null;
		if (!m || !m.getWeights) {
			container.innerHTML = "<div class='wa_container'><div class='wa_no_model'>" + _trm("wa_no_model_loaded") + "</div></div>";
			return container;
		}

		var result = analyzeModel(m);

		if (!result || result.layers.length === 0) {
			container.innerHTML = "<div class='wa_container'><div class='wa_no_model'>" + _trm("wa_no_weights_in_model") + "</div></div>";
			return container;
		}

		var html = "<div class='wa_container'>";

		// Header with gauge
		html += "<h2>" + _trm("wa_title") + "</h2>";
		html += "<div class='wa_header'>";
		html += _scoreGauge(result.score, 140);
		html += "<div>";
		html += "<div class='wa_message'>" + _trm(result.messageKey) + "</div>";
		html += "<div class='wa_confidence'>" + _trm("wa_confidence") + ": " + result.confidence + "% (" + _trm("wa_based_on") + " " + result.totalParams.toLocaleString() + " " + _trm("wa_parameters") + ")</div>";
		html += "<div style='margin-top:8px; font-size:0.85em; opacity:0.7;'>" + _trm("wa_bias_score") + ": " + result.biasScore + "% (" + _trm("wa_nonzero_biases_hint") + ")</div>";
		html += "</div></div>";

		// ============================================================
		// NEW: Global Visualizations Section
		// ============================================================

		html += "<div class='wa_section'>";
		html += "<h3>" + _trm("wa_global_visualizations") + "</h3>";

		// Weight Norm Heatmap
		html += "<div class='wa_viz_label'>" + _trm("wa_weight_norm_heatmap") + "</div>";
		html += _weightNormHeatmapSVG(result.layers);

		// Layer Score Bar Chart
		html += "<div class='wa_viz_label'>" + _trm("wa_layer_score_overview") + "</div>";
		html += _layerScoreBarChartSVG(result.layers);

		// Std Comparison
		html += "<div class='wa_viz_label'>" + _trm("wa_std_per_layer") + "</div>";
		html += _stdComparisonSVG(result.layers);

		// Parameter Distribution Pie Chart
		html += "<div class='wa_viz_label'>" + _trm("wa_param_distribution") + "</div>";
		html += "<div style='display:flex; align-items:center; gap:16px; flex-wrap:wrap;'>";
		html += _paramPieChartSVG(result.layers);
		html += "<div style='font-size:0.75em; opacity:0.6;'>";
		var colors = ["#3498db", "#2ecc71", "#e74c3c", "#f39c12", "#9b59b6", "#1abc9c", "#e67e22", "#34495e", "#16a085", "#c0392b"];
		for (var i = 0; i < Math.min(result.layers.length, 10); i++) {
			html += "<div><span style='display:inline-block;width:10px;height:10px;background:" + colors[i % colors.length] + ";border-radius:2px;margin-right:4px;'></span>" + result.layers[i].name + " (" + result.layers[i].paramCount.toLocaleString() + ")</div>";
		}
		if (result.layers.length > 10) html += "<div>...</div>";
		html += "</div></div>";

		html += "</div>"; // wa_section

		// ============================================================
		// Overall indicators
		// ============================================================

		html += "<div class='wa_comparison'>";
		html += "<h3>" + _trm("wa_overall_indicators") + "</h3>";

		var avgEntropy = 0, avgSparsity = 0, avgSVD = 0, avgKurtosis = 0, avgKS = 0, avgCorr = 0;
		for (var i = 0; i < result.layers.length; i++) {
			var ind = result.layers[i].indicators;
			avgEntropy += ind.entropy.score;
			avgSparsity += ind.sparsity.score;
			avgSVD += ind.svd.score;
			avgKurtosis += ind.kurtosis.score;
			avgKS += ind.ksTest.score;
			avgCorr += ind.correlation.score;
		}
		var nLayers = result.layers.length;
		avgEntropy /= nLayers; avgSparsity /= nLayers; avgSVD /= nLayers;
		avgKurtosis /= nLayers; avgKS /= nLayers; avgCorr /= nLayers;

		html += _indicatorBar("wa_indicator_entropy", avgEntropy, avgEntropy.toFixed(1) + "%");
		html += _indicatorBar("wa_indicator_sparsity", avgSparsity, avgSparsity.toFixed(1) + "%");
		html += _indicatorBar("wa_indicator_svd", avgSVD, avgSVD.toFixed(1) + "%");
		html += _indicatorBar("wa_indicator_kurtosis", avgKurtosis, avgKurtosis.toFixed(1) + "%");
		html += _indicatorBar("wa_indicator_ks_test", avgKS, avgKS.toFixed(1) + "%");
		html += _indicatorBar("wa_indicator_correlation", avgCorr, avgCorr.toFixed(1) + "%");

		html += "</div>";

		// ============================================================
		// Per-layer details
		// ============================================================

		html += "<h3 style='margin-top:24px;'>" + _trm("wa_per_layer_analysis") + "</h3>";

		for (var i = 0; i < result.layers.length; i++) {
			var layer = result.layers[i];
			var scoreClass = layer.score > 60 ? "wa_layer_score_high" : layer.score > 35 ? "wa_layer_score_mid" : "wa_layer_score_low";

			html += "<div class='wa_layer_card'>";
			html += "<div class='wa_layer_header'>";
			html += "<span class='wa_layer_name'>" + layer.name + " <span style='opacity:0.5; font-weight:normal;'>[" + layer.shape.join("\u00d7") + "] (" + layer.paramCount.toLocaleString() + " " + _trm("wa_params") + ")</span></span>";
			html += "<span class='wa_layer_score " + scoreClass + "'>" + Math.round(layer.score) + "% " + _trm("wa_trained") + "</span>";
			html += "</div>";

			// Indicators
			html += "<div class='wa_indicators'>";
			var ind = layer.indicators;
			html += _indicatorBar("wa_indicator_entropy", ind.entropy.score, "H=" + ind.entropy.value.toFixed(3) + " / " + ind.entropy.maxEntropy.toFixed(3));
			html += _indicatorBar("wa_indicator_sparsity", ind.sparsity.score, (ind.sparsity.value * 100).toFixed(1) + "% near-zero");
			html += _indicatorBar("wa_indicator_svd", ind.svd.score, "Steepness: " + ind.svd.steepness.toFixed(3));
			html += _indicatorBar("wa_indicator_kurtosis", ind.kurtosis.score, "k=" + ind.kurtosis.value.toFixed(3));
			html += _indicatorBar("wa_indicator_ks_test", ind.ksTest.score, "D=" + ind.ksTest.d.toFixed(4));
			html += _indicatorBar("wa_indicator_correlation", ind.correlation.score, "r=" + ind.correlation.value.toFixed(4));
			html += "</div>";

			// Histogram
			html += "<div style='margin-top:10px;'>";
			html += "<div class='wa_viz_label'>" + _trm("wa_weight_distribution") + "</div>";
			html += _histogramSVG(layer.histogram, layer.name);
			html += "</div>";

			// Box Plot
			html += "<div style='margin-top:10px;'>";
			html += "<div class='wa_viz_label'>" + _trm("wa_box_plot") + "</div>";
			html += _boxPlotSVG(layer.sortedData, layer.stats);
			html += "</div>";

			// CDF
			html += "<div style='margin-top:10px;'>";
			html += "<div class='wa_viz_label'>" + _trm("wa_cdf") + "</div>";
			html += _cdfSVG(layer.sortedData);
			html += "</div>";

			// Mini stats
			html += "<div class='wa_stats_mini'>";
			html += "mean=" + layer.stats.mean.toFixed(5) + " | std=" + layer.stats.std.toFixed(5);
			html += " | min=" + layer.stats.min.toFixed(4) + " | max=" + layer.stats.max.toFixed(4);
			html += " | zeros=" + layer.stats.zeros + " | NaN=" + layer.stats.nanCount + " | Inf=" + layer.stats.infCount;
			html += " | L2=" + layer.l2Norm.toFixed(4);
			html += " | skew=" + layer.stats.skewness.toFixed(3) + " | kurt=" + layer.stats.kurtosis.toFixed(3);
			html += "</div>";

			html += "</div>"; // wa_layer_card
		}

		// ============================================================
		// Comparison section: Random vs. Trained
		// ============================================================

		html += "<div class='wa_comparison' style='margin-top:24px;'>";
		html += "<h3>" + _trm("wa_comparison_title") + "</h3>";
		html += "<div class='wa_grid'>";
		html += "<div><strong>" + _trm("wa_random_weights") + ":</strong><ul style='font-size:0.85em; opacity:0.8;'>";
		html += "<li>" + _trm("wa_random_uniform_distribution") + "</li>";
		html += "<li>" + _trm("wa_random_no_sparsity") + "</li>";
		html += "<li>" + _trm("wa_random_flat_svd") + "</li>";
		html += "<li>" + _trm("wa_random_kurtosis_zero") + "</li>";
		html += "<li>" + _trm("wa_random_no_correlation") + "</li>";
		html += "<li>" + _trm("wa_random_biases_zero") + "</li>";
		html += "</ul></div>";
		html += "<div><strong>" + _trm("wa_trained_weights") + ":</strong><ul style='font-size:0.85em; opacity:0.8;'>";
		html += "<li>" + _trm("wa_trained_structured_distribution") + "</li>";
		html += "<li>" + _trm("wa_trained_high_sparsity") + "</li>";
		html += "<li>" + _trm("wa_trained_steep_svd") + "</li>";
		html += "<li>" + _trm("wa_trained_high_kurtosis") + "</li>";
		html += "<li>" + _trm("wa_trained_correlated_filters") + "</li>";
		html += "<li>" + _trm("wa_trained_biases_nonzero") + "</li>";
		html += "</ul></div>";
		html += "</div></div>";

		html += "</div>"; // wa_container

		container.innerHTML = html;

		// Trigger translation system
		if (typeof update_translations === "function") {
			update_translations(); // await not possible here
		}

		return container;
	}

	// ============================================================
	// AUTO-REFRESH (optional)
	// ============================================================

	var _autoRefreshInterval = null;

	function startAutoRefresh(divOrId, intervalMs) {
		intervalMs = intervalMs || 5000;
		stopAutoRefresh();
		_autoRefreshInterval = setInterval(function() {
			try {
				weight_analysis_render(divOrId);
			} catch (e) {
				console.warn("[WeightAnalysis] Auto-refresh error:", e);
			}
		}, intervalMs);
	}

	function stopAutoRefresh() {
		if (_autoRefreshInterval) {
			clearInterval(_autoRefreshInterval);
			_autoRefreshInterval = null;
		}
	}

	// ============================================================
	// DEAD NEURON DETECTOR
	// ============================================================

	function detectDeadNeurons(m) {
		var weights = _getWeightsFromModel(m);
		if (!weights || weights.length === 0) return [];

		var deadNeurons = [];

		for (var i = 0; i < weights.length; i++) {
			var w = weights[i];
			if (!w.name.toLowerCase().includes("kernel")) continue;

			var data = w.data;
			var shape = w.shape;
			if (shape.length < 2) continue;

			var lastDim = shape[shape.length - 1];
			var filterSize = data.length / lastDim;

			for (var f = 0; f < lastDim; f++) {
				var allZero = true;
				var sumAbs = 0;
				for (var j = 0; j < filterSize; j++) {
					var val = data[j * lastDim + f];
					if (Math.abs(val) > 1e-7) {
						allZero = false;
					}
					sumAbs += Math.abs(val);
				}

				if (allZero) {
					deadNeurons.push({ layer: w.name, neuron: f, type: "dead", magnitude: 0 });
				} else if (sumAbs / filterSize < 1e-6) {
					deadNeurons.push({ layer: w.name, neuron: f, type: "nearly_dead", magnitude: sumAbs / filterSize });
				}
			}
		}

		return deadNeurons;
	}

	// ============================================================
	// WEIGHT DRIFT (distance from initialization)
	// ============================================================

	var _initialWeightsSnapshot = null;

	function snapshotInitialWeights(m) {
		var weights = _getWeightsFromModel(m);
		if (!weights) return;
		_initialWeightsSnapshot = [];
		for (var i = 0; i < weights.length; i++) {
			_initialWeightsSnapshot.push({
				name: weights[i].name,
				data: new Float32Array(weights[i].data)
			});
		}
	}

	function computeWeightDrift(m) {
		if (!_initialWeightsSnapshot) return null;
		var weights = _getWeightsFromModel(m);
		if (!weights) return null;

		var drifts = [];
		for (var i = 0; i < Math.min(weights.length, _initialWeightsSnapshot.length); i++) {
			var current = weights[i].data;
			var initial = _initialWeightsSnapshot[i].data;
			if (current.length !== initial.length) continue;

			var l2Dist = 0;
			for (var j = 0; j < current.length; j++) {
				var diff = current[j] - initial[j];
				l2Dist += diff * diff;
			}
			l2Dist = Math.sqrt(l2Dist);

			var l2Init = 0;
			for (var j = 0; j < initial.length; j++) {
				l2Init += initial[j] * initial[j];
			}
			l2Init = Math.sqrt(l2Init);

			drifts.push({
				name: weights[i].name,
				l2Distance: l2Dist,
				relativeChange: l2Init > 0 ? l2Dist / l2Init : 0
			});
		}

		return drifts;
	}

	// ============================================================
	// MODEL COMPLEXITY ANALYZER
	// ============================================================

	function analyzeComplexity(m) {
		var weights = _getWeightsFromModel(m);
		if (!weights) return null;

		var totalParams = 0;
		var trainableParams = 0;

		for (var i = 0; i < weights.length; i++) {
			totalParams += weights[i].data.length;
			trainableParams += weights[i].data.length;
		}

		return {
			totalParams: totalParams,
			trainableParams: trainableParams,
			layerCount: weights.length,
			paramsPerLayer: totalParams / Math.max(1, weights.length),
			memoryMB: (totalParams * 4) / (1024 * 1024)
		};
	}

	// ============================================================
	// PUBLIC API
	// ============================================================

	return {
		analyzeModel: analyzeModel,
		weight_analysis_render: weight_analysis_render,
		startAutoRefresh: startAutoRefresh,
		stopAutoRefresh: stopAutoRefresh,
		detectDeadNeurons: detectDeadNeurons,
		snapshotInitialWeights: snapshotInitialWeights,
		computeWeightDrift: computeWeightDrift,
		analyzeComplexity: analyzeComplexity
	};

})();

// ============================================================
// AUTO-INIT
// ============================================================

(function() {
	if (typeof document !== "undefined") {
		var _autoInit = function() {
			var target = document.getElementById("weight_analysis");
			if (target) {
				WeightAnalysis.weight_analysis_render(target);
			}
		};

		if (document.readyState === "loading") {
			document.addEventListener("DOMContentLoaded", _autoInit);
		} else {
			setTimeout(_autoInit, 1000);
		}
	}
})();
