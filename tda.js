"use strict";

// ============================================================
// TOPOLOGICAL DATA ANALYSIS (TDA) MODULE v2.0
// Dynamic, Interactive, Auto-Updating
// ============================================================

var TDAAnalysis = (function () {

	// ============================================================
	// STATE
	// ============================================================

	var _config = {
		maxPoints: 300,
		maxEpsilon: 2.0,
		epsilonSteps: 40,
		maxDimension: 1,
		minPersistence: 0.005,
		maxEdgesForVR: 4000,
		autoUpdateInterval: 3000,
		takensWindowSize: 8,
		takensDelay: 1,
		pca2dForHighDim: true,
		highlightTopN: 5
	};

	var _state = {
		container: null,
		mode: "activations",
		autoUpdateTimer: null,
		isRunning: false,
		history: [],
		maxHistory: 50,
		selectedLayer: null,
		hoveredPoint: null,
		expandedCards: {},
		filterDimension: -1, // -1 = all, 0 = H0, 1 = H1
		sortBy: "persistence", // persistence, birth, death
		lastResult: null,
		epoch: 0,
		dataSource: "auto" // auto, activations, weights, raw_data
	};

	// ============================================================
	// DISTANCE & LINEAR ALGEBRA
	// ============================================================

	function _euclideanDistance(a, b) {
		if (!a || !b || a.length !== b.length) return Infinity;
		var sum = 0;
		for (var i = 0; i < a.length; i++) {
			var diff = (a[i] || 0) - (b[i] || 0);
			sum += diff * diff;
		}
		return Math.sqrt(sum);
	}

	function _manhattanDistance(a, b) {
		if (!a || !b || a.length !== b.length) return Infinity;
		var sum = 0;
		for (var i = 0; i < a.length; i++) {
			sum += Math.abs((a[i] || 0) - (b[i] || 0));
		}
		return sum;
	}

	function _cosineDistance(a, b) {
		if (!a || !b || a.length !== b.length) return Infinity;
		var dot = 0, normA = 0, normB = 0;
		for (var i = 0; i < a.length; i++) {
			dot += (a[i] || 0) * (b[i] || 0);
			normA += (a[i] || 0) * (a[i] || 0);
			normB += (b[i] || 0) * (b[i] || 0);
		}
		normA = Math.sqrt(normA);
		normB = Math.sqrt(normB);
		if (normA === 0 || normB === 0) return 1;
		return 1 - (dot / (normA * normB));
	}

	function _getDistanceFunction(metric) {
		switch (metric) {
			case "manhattan": return _manhattanDistance;
			case "cosine": return _cosineDistance;
			default: return _euclideanDistance;
		}
	}

	function _computeDistanceMatrix(points, metric) {
		if (!points || points.length === 0) return null;
		var n = points.length;
		var distFn = _getDistanceFunction(metric || "euclidean");
		var dist = new Float64Array(n * n);
		var maxDist = 0;
		for (var i = 0; i < n; i++) {
			for (var j = i + 1; j < n; j++) {
				var d = distFn(points[i], points[j]);
				if (!isFinite(d)) d = 0;
				dist[i * n + j] = d;
				dist[j * n + i] = d;
				if (d > maxDist) maxDist = d;
			}
		}
		return { matrix: dist, n: n, maxDist: maxDist };
	}

	// Simple PCA to 2D for visualization
	function _pca2D(points) {
		if (!points || points.length < 2) return points;
		var dim = points[0].length;
		if (dim <= 2) return points;

		var n = points.length;

		// Compute mean
		var mean = new Array(dim).fill(0);
		for (var i = 0; i < n; i++) {
			for (var j = 0; j < dim; j++) {
				mean[j] += (points[i][j] || 0);
			}
		}
		for (var j = 0; j < dim; j++) mean[j] /= n;

		// Center data
		var centered = [];
		for (var i = 0; i < n; i++) {
			var row = [];
			for (var j = 0; j < dim; j++) {
				row.push((points[i][j] || 0) - mean[j]);
			}
			centered.push(row);
		}

		// Power iteration for top 2 eigenvectors of covariance
		var pc1 = _powerIteration(centered, dim, null);
		var pc2 = _powerIteration(centered, dim, pc1);

		// Project
		var result = [];
		for (var i = 0; i < n; i++) {
			var x = 0, y = 0;
			for (var j = 0; j < dim; j++) {
				x += centered[i][j] * pc1[j];
				y += centered[i][j] * pc2[j];
			}
			result.push([x, y]);
		}

		return result;
	}

	function _powerIteration(data, dim, deflateVec) {
		var n = data.length;
		var vec = new Array(dim);
		for (var j = 0; j < dim; j++) vec[j] = Math.random() - 0.5;

		for (var iter = 0; iter < 50; iter++) {
			var newVec = new Array(dim).fill(0);

			// Multiply by covariance (X^T X) implicitly
			for (var i = 0; i < n; i++) {
				var dot = 0;
				for (var j = 0; j < dim; j++) dot += data[i][j] * vec[j];
				for (var j = 0; j < dim; j++) newVec[j] += data[i][j] * dot;
			}

			// Deflate if needed
			if (deflateVec) {
				var proj = 0;
				for (var j = 0; j < dim; j++) proj += newVec[j] * deflateVec[j];
				for (var j = 0; j < dim; j++) newVec[j] -= proj * deflateVec[j];
			}

			// Normalize
			var norm = 0;
			for (var j = 0; j < dim; j++) norm += newVec[j] * newVec[j];
			norm = Math.sqrt(norm);
			if (norm < 1e-10) break;
			for (var j = 0; j < dim; j++) newVec[j] /= norm;

			vec = newVec;
		}

		return vec;
	}

	// ============================================================
	// UNION-FIND
	// ============================================================

	function _UnionFind(n) {
		this.parent = new Int32Array(n);
		this.rank = new Int32Array(n);
		this.size = new Int32Array(n);
		this.birthTime = new Float64Array(n);
		for (var i = 0; i < n; i++) {
			this.parent[i] = i;
			this.size[i] = 1;
		}
	}

	_UnionFind.prototype.find = function (x) {
		while (this.parent[x] !== x) {
			this.parent[x] = this.parent[this.parent[x]];
			x = this.parent[x];
		}
		return x;
	};

	_UnionFind.prototype.union = function (x, y) {
		var rx = this.find(x);
		var ry = this.find(y);
		if (rx === ry) return false;
		if (this.rank[rx] < this.rank[ry]) { var tmp = rx; rx = ry; ry = tmp; }
		this.parent[ry] = rx;
		this.size[rx] += this.size[ry];
		if (this.rank[rx] === this.rank[ry]) this.rank[rx]++;
		return true;
	};

	// ============================================================
	// PERSISTENT HOMOLOGY: H0
	// ============================================================

	function _computeH0Persistence(distInfo) {
		if (!distInfo || !distInfo.matrix || distInfo.n < 2) return [];

		var n = distInfo.n;
		var dist = distInfo.matrix;
		var edges = [];

		for (var i = 0; i < n; i++) {
			for (var j = i + 1; j < n; j++) {
				var d = dist[i * n + j];
				if (isFinite(d) && d > 0) {
					edges.push({ i: i, j: j, d: d });
				}
			}
		}

		if (edges.length === 0) return [];

		edges.sort(function (a, b) { return a.d - b.d; });

		if (edges.length > _config.maxEdgesForVR) {
			edges = edges.slice(0, _config.maxEdgesForVR);
		}

		var uf = new _UnionFind(n);
		var persistence = [];

		for (var e = 0; e < edges.length; e++) {
			var edge = edges[e];
			var ri = uf.find(edge.i);
			var rj = uf.find(edge.j);

			if (ri !== rj) {
				var deathEps = edge.d;
				var dying = uf.size[ri] < uf.size[rj] ? ri : rj;
				var pers = deathEps;

				if (pers > _config.minPersistence) {
					persistence.push({
						birth: 0,
						death: deathEps,
						persistence: pers,
						dimension: 0,
						representative: [edge.i, edge.j]
					});
				}

				uf.union(edge.i, edge.j);
			}
		}

		// Infinite component
		persistence.push({ birth: 0, death: Infinity, persistence: Infinity, dimension: 0, representative: null });

		return persistence;
	}

	// ============================================================
	// PERSISTENT HOMOLOGY: H1 (improved cycle detection)
	// ============================================================

	function _computeH1Persistence(distInfo) {
		if (!distInfo || !distInfo.matrix || distInfo.n < 3) return [];

		var n = distInfo.n;
		var dist = distInfo.matrix;
		var edges = [];

		for (var i = 0; i < n; i++) {
			for (var j = i + 1; j < n; j++) {
				var d = dist[i * n + j];
				if (isFinite(d) && d > 0) {
					edges.push({ i: i, j: j, d: d });
				}
			}
		}

		if (edges.length < 3) return [];

		edges.sort(function (a, b) { return a.d - b.d; });

		var maxEdges = Math.min(edges.length, 800);
		edges = edges.slice(0, maxEdges);

		var persistence = [];
		var adjacency = new Array(n);
		for (var i = 0; i < n; i++) adjacency[i] = [];

		var uf = new _UnionFind(n);
		var cyclesSeen = {};

		for (var e = 0; e < edges.length; e++) {
			var edge = edges[e];

			// Check if this edge creates a cycle (both endpoints already connected)
			var ri = uf.find(edge.i);
			var rj = uf.find(edge.j);

			if (ri === rj) {
				// This edge closes a cycle! Find the cycle birth
				var birthEps = edge.d;

				// Find shortest path between edge.i and edge.j using BFS on current graph
				var pathLen = _bfsPathLength(adjacency, edge.i, edge.j, n);

				if (pathLen >= 2 && pathLen <= 10) {
					// Death approximation: the longest edge in the cycle
					var deathEps = birthEps * (1 + 0.5 / pathLen);
					var pers = deathEps - birthEps;

					var cycleKey = Math.min(edge.i, edge.j) + "_" + Math.max(edge.i, edge.j) + "_" + pathLen;
					if (!cyclesSeen[cycleKey] && pers > _config.minPersistence) {
						cyclesSeen[cycleKey] = true;
						persistence.push({
							birth: birthEps,
							death: deathEps,
							persistence: pers,
							dimension: 1,
							representative: [edge.i, edge.j],
							cycleLength: pathLen + 1
						});
					}
				}
			} else {
				uf.union(edge.i, edge.j);
			}

			adjacency[edge.i].push({ node: edge.j, d: edge.d });
			adjacency[edge.j].push({ node: edge.i, d: edge.d });
		}

		persistence.sort(function (a, b) { return b.persistence - a.persistence; });
		return persistence.slice(0, 40);
	}

	function _bfsPathLength(adjacency, start, end, n) {
		if (start === end) return 0;
		var visited = new Uint8Array(n);
		var queue = [{ node: start, depth: 0 }];
		visited[start] = 1;
		var head = 0;

		while (head < queue.length) {
			var current = queue[head++];
			if (current.depth > 10) return Infinity;

			var neighbors = adjacency[current.node];
			for (var i = 0; i < neighbors.length; i++) {
				var next = neighbors[i].node;
				if (next === end) return current.depth + 1;
				if (!visited[next]) {
					visited[next] = 1;
					queue.push({ node: next, depth: current.depth + 1 });
				}
			}
		}

		return Infinity;
	}

	// ============================================================
	// BETTI CURVES
	// ============================================================

	function _computeBettiCurve(distInfo, persistence, dimension) {
		if (!distInfo || !persistence || persistence.length === 0) return [];

		var maxDist = distInfo.maxDist || 1;
		var steps = _config.epsilonSteps;
		var curve = [];

		for (var s = 0; s <= steps; s++) {
			var eps = (s / steps) * maxDist;
			var count = 0;

			for (var p = 0; p < persistence.length; p++) {
				if (persistence[p].dimension === dimension) {
					if (persistence[p].birth <= eps && (persistence[p].death > eps || !isFinite(persistence[p].death))) {
						count++;
					}
				}
			}

			curve.push({ epsilon: eps, betti: count });
		}

		return curve;
	}

	// ============================================================
	// TOPOLOGICAL SUMMARY
	// ============================================================

	function _computeTopologicalSummary(persistence) {
		if (!persistence || persistence.length === 0) {
			return {
				totalFeatures: 0, h0Count: 0, h1Count: 0,
				maxPersistence: 0, meanPersistence: 0, medianPersistence: 0,
				entropy: 0, wasserstein1: 0, landscape: []
			};
		}

		var h0 = [], h1 = [], finitePers = [];
		for (var i = 0; i < persistence.length; i++) {
			if (persistence[i].dimension === 0) h0.push(persistence[i]);
			if (persistence[i].dimension === 1) h1.push(persistence[i]);
			if (isFinite(persistence[i].persistence)) finitePers.push(persistence[i]);
		}

		var maxPers = 0, sumPers = 0;
		var persValues = [];

		for (var i = 0; i < finitePers.length; i++) {
			var pv = finitePers[i].persistence;
			if (pv > maxPers) maxPers = pv;
			sumPers += pv;
			persValues.push(pv);
		}

		var meanPers = finitePers.length > 0 ? sumPers / finitePers.length : 0;

		// Median
		persValues.sort(function (a, b) { return a - b; });
		var medianPers = 0;
		if (persValues.length > 0) {
			var mid = Math.floor(persValues.length / 2);
			medianPers = persValues.length % 2 !== 0 ? persValues[mid] : (persValues[mid - 1] + persValues[mid]) / 2;
		}

		// Entropy
		var entropy = 0;
		if (sumPers > 0 && finitePers.length > 1) {
			for (var i = 0; i < finitePers.length; i++) {
				var p = finitePers[i].persistence / sumPers;
				if (p > 0) entropy -= p * Math.log2(p);
			}
		}

		// Wasserstein-1 distance to diagonal (sum of persistence / sqrt(2))
		var wasserstein1 = sumPers / Math.sqrt(2);

		// Persistence landscape (simplified: top-k persistence values)
		var landscape = persValues.slice(-Math.min(10, persValues.length)).reverse();

		return {
			totalFeatures: persistence.length,
			h0Count: h0.length,
			h1Count: h1.length,
			maxPersistence: maxPers,
			meanPersistence: meanPers,
			medianPersistence: medianPers,
			entropy: entropy,
			wasserstein1: wasserstein1,
			landscape: landscape
		};
	}

	// ============================================================
	// DATA EXTRACTION
	// ============================================================

	function _subsampleArray(arr, maxPoints) {
		if (!arr || arr.length <= maxPoints) return arr;
		// Random subsample for better representation
		var indices = [];
		for (var i = 0; i < arr.length; i++) indices.push(i);
		// Fisher-Yates partial shuffle
		for (var i = 0; i < maxPoints; i++) {
			var j = i + Math.floor(Math.random() * (indices.length - i));
			var tmp = indices[i]; indices[i] = indices[j]; indices[j] = tmp;
		}
		var result = [];
		for (var i = 0; i < maxPoints; i++) {
			result.push(arr[indices[i]]);
		}
		return result;
	}

	function _reshapeToPointCloud(data, shape) {
		if (!data || data.length === 0) return null;

		var points = [];

		try {
			if (!shape || shape.length < 2) {
				// Takens embedding for 1D time series
				var windowSize = Math.min(_config.takensWindowSize, Math.floor(data.length / 3));
				if (windowSize < 2) windowSize = 2;
				var delay = _config.takensDelay;

				for (var i = 0; i <= data.length - windowSize * delay; i += delay) {
					var point = [];
					for (var j = 0; j < windowSize; j++) {
						var idx = i + j * delay;
						var v = idx < data.length ? data[idx] : 0;
						if (isNaN(v) || !isFinite(v)) v = 0;
						point.push(v);
					}
					points.push(point);
				}
			} else {
				var cols = shape[shape.length - 1] || 1;
				var rows = Math.floor(data.length / cols);

				for (var i = 0; i < rows; i++) {
					var point = [];
					for (var j = 0; j < cols; j++) {
						var v = data[i * cols + j];
						if (isNaN(v) || !isFinite(v)) v = 0;
						point.push(v);
					}
					points.push(point);
				}
			}
		} catch (e) {
			console.warn("[TDA] Error reshaping:", e);
			return null;
		}

		return _subsampleArray(points, _config.maxPoints);
	}

	function _extractRawTrainingData() {
		try {
			if (typeof xy_data_global !== "undefined" && xy_data_global && xy_data_global.x) {
				var xData;
				if (xy_data_global.x.dataSync) {
					xData = Array.from(xy_data_global.x.dataSync());
				} else if (Array.isArray(xy_data_global.x)) {
					xData = xy_data_global.x.flat(Infinity);
				} else {
					return null;
				}

				var shape = null;
				if (xy_data_global.x.shape) {
					shape = xy_data_global.x.shape;
				}

				return { data: xData, shape: shape, name: "training_x" };
			}
		} catch (e) {
			console.warn("[TDA] Could not extract raw training data:", e);
		}
		return null;
	}

	function _extractActivationData() {
		try {
			if (typeof layerIOStats === "undefined" || !layerIOStats || !layerIOStats.records || layerIOStats.records.length === 0) {
				return null;
			}

			var latestRecord = layerIOStats.records[layerIOStats.records.length - 1];
			if (!latestRecord || !latestRecord.layers || latestRecord.layers.length === 0) {
				return null;
			}

			var layers = [];
			for (var i = 0; i < latestRecord.layers.length; i++) {
				var layer = latestRecord.layers[i];
				if (!layer.output || layer.output.length < 4) continue;
				layers.push({
					data: Array.from(layer.output),
					shape: layer.outputShape,
					name: layer.layerName || ("layer_" + i),
					type: layer.layerType || "unknown",
					index: layer.layerIndex || i
				});
			}

			return layers.length > 0 ? layers : null;
		} catch (e) {
			console.warn("[TDA] Could not extract activation data:", e);
			return null;
		}
	}

	function _extractWeightData() {
		try {
			var m = (typeof model !== "undefined") ? model : null;
			if (!m || !m.getWeights) return null;

			var rawWeights = m.getWeights();
			var layers = [];

			for (var i = 0; i < rawWeights.length; i++) {
				if (rawWeights[i] && !rawWeights[i].isDisposed) {
					var wData = rawWeights[i].dataSync();
					if (wData && wData.length >= 4) {
						layers.push({
							data: Array.from(wData),
							shape: rawWeights[i].shape,
							name: (m.weights && m.weights[i]) ? m.weights[i].name : ("weight_" + i),
							type: "weight",
							index: i
						});
					}
				}
			}

			return layers.length > 0 ? layers : null;
		} catch (e) {
			console.warn("[TDA] Could not extract weight data:", e);
			return null;
		}
	}

	// ============================================================
	// CORE ANALYSIS PIPELINE
	// ============================================================

	function _analyzePointCloud(points, name, meta) {
		if (!points || points.length < 3) return null;

		var distInfo = _computeDistanceMatrix(points, "euclidean");
		if (!distInfo) return null;

		var h0 = _computeH0Persistence(distInfo);
		var h1 = _computeH1Persistence(distInfo);
		var allPersistence = h0.concat(h1);

		var bettiCurve0 = _computeBettiCurve(distInfo, allPersistence, 0);
		var bettiCurve1 = _computeBettiCurve(distInfo, allPersistence, 1);

		var summary = _computeTopologicalSummary(allPersistence);

		// PCA projection for visualization
		var projected = _pca2D(points);

		return {
			name: name,
			meta: meta || {},
			numPoints: points.length,
			pointDim: points[0] ? points[0].length : 0,
			persistence: allPersistence,
			bettiCurve0: bettiCurve0,
			bettiCurve1: bettiCurve1,
			summary: summary,
			projected: projected,
			maxDist: distInfo.maxDist
		};
	}

	function analyze(mode) {
		if (!mode) mode = _state.mode;

		var results = [];
		var error = null;

		try {
			if (mode === "raw_data") {
				var rawData = _extractRawTrainingData();
				if (!rawData) {
					error = "tda_no_raw_data";
				} else {
					var points = _reshapeToPointCloud(rawData.data, rawData.shape);
					var result = _analyzePointCloud(points, rawData.name, { type: "raw_data" });
					if (result) results.push(result);
				}
			} else if (mode === "activations") {
				var layers = _extractActivationData();
				if (!layers) {
					error = "tda_no_activation_data";
				} else {
					for (var i = 0; i < layers.length; i++) {
						var points = _reshapeToPointCloud(layers[i].data, layers[i].shape);
						var result = _analyzePointCloud(points, layers[i].name, {
							type: layers[i].type,
							index: layers[i].index
						});
						if (result) results.push(result);
					}
				}
			} else if (mode === "weights") {
				var layers = _extractWeightData();
				if (!layers) {
					error = "tda_no_model";
				} else {
					for (var i = 0; i < layers.length; i++) {
						var points = _reshapeToPointCloud(layers[i].data, layers[i].shape);
						var result = _analyzePointCloud(points, layers[i].name, {
							type: layers[i].type,
							index: layers[i].index,
							shape: layers[i].shape
						});
						if (result) results.push(result);
					}
				}
			} else {
				// Auto mode: try all sources
				var rawData = _extractRawTrainingData();
				if (rawData) {
					var points = _reshapeToPointCloud(rawData.data, rawData.shape);
					var result = _analyzePointCloud(points, rawData.name, { type: "raw_data" });
					if (result) results.push(result);
				}

				var actLayers = _extractActivationData();
				if (actLayers) {
					for (var i = 0; i < actLayers.length; i++) {
						var points = _reshapeToPointCloud(actLayers[i].data, actLayers[i].shape);
						var result = _analyzePointCloud(points, actLayers[i].name, {
							type: actLayers[i].type,
							index: actLayers[i].index,
							source: "activation"
						});
						if (result) results.push(result);
					}
				}

				var wLayers = _extractWeightData();
				if (wLayers) {
					for (var i = 0; i < wLayers.length; i++) {
						var points = _reshapeToPointCloud(wLayers[i].data, wLayers[i].shape);
						var result = _analyzePointCloud(points, wLayers[i].name, {
							type: wLayers[i].type,
							index: wLayers[i].index,
							source: "weight",
							shape: wLayers[i].shape
						});
						if (result) results.push(result);
					}
				}

				if (results.length === 0) error = "tda_no_data_available";
			}
		} catch (e) {
			console.error("[TDA] Analysis error:", e);
			error = "tda_analysis_error";
		}

		var output = {
			layers: results,
			timestamp: Date.now(),
			mode: mode,
			epoch: (typeof current_epoch !== "undefined") ? current_epoch : 0,
			error: error
		};

		_state.lastResult = output;

		// Store in history
		if (results.length > 0) {
			_state.history.push({
				timestamp: output.timestamp,
				epoch: output.epoch,
				summaries: results.map(function (r) { return { name: r.name, summary: r.summary }; })
			});
			if (_state.history.length > _state.maxHistory) {
				_state.history.shift();
			}
		}

		return output;
	}

	// ============================================================
	// SVG RENDERING
	// ============================================================

	function _persistenceDiagramSVG(persistence, layerIdx) {
		if (!persistence || persistence.length === 0) return "<div class='tda_empty_plot'>—</div>";

		var width = 240, height = 240;
		var margin = 32;
		var plotW = width - 2 * margin;
		var plotH = height - 2 * margin;

		var maxVal = 0;
		for (var i = 0; i < persistence.length; i++) {
			if (isFinite(persistence[i].birth) && persistence[i].birth > maxVal) maxVal = persistence[i].birth;
			if (isFinite(persistence[i].death) && persistence[i].death > maxVal) maxVal = persistence[i].death;
		}
		if (maxVal === 0) maxVal = 1;

		var svg = "<svg class='tda_svg_interactive' width='100%' viewBox='0 0 " + width + " " + height + "' data-layer='" + layerIdx + "'>";

		// Background grid
		for (var g = 0; g <= 4; g++) {
			var gx = margin + (g / 4) * plotW;
			var gy = height - margin - (g / 4) * plotH;
			svg += "<line x1='" + gx + "' y1='" + (height - margin) + "' y2='" + (height - margin) + "' stroke='currentColor' stroke-width='0.3' opacity='0.15'/>";
			svg += "<line x1='" + margin + "' y1='" + gy + "' x2='" + (width - margin) + "' y2='" + gy + "' stroke='currentColor' stroke-width='0.3' opacity='0.15'/>";
		}

		// Diagonal line (birth = death)
		svg += "<line x1='" + margin + "' y1='" + (height - margin) + "' x2='" + (width - margin) + "' y2='" + margin + "' stroke='currentColor' stroke-width='0.7' stroke-dasharray='4,3' opacity='0.25'/>";

		// Axes
		svg += "<line x1='" + margin + "' y1='" + (height - margin) + "' x2='" + (width - margin) + "' y2='" + (height - margin) + "' stroke='currentColor' stroke-width='1' opacity='0.5'/>";
		svg += "<line x1='" + margin + "' y1='" + (height - margin) + "' x2='" + margin + "' y2='" + margin + "' stroke='currentColor' stroke-width='1' opacity='0.5'/>";

		// Axis tick labels
		svg += "<text x='" + margin + "' y='" + (height - margin + 12) + "' font-size='7' fill='currentColor' opacity='0.4'>0</text>";
		svg += "<text x='" + (width - margin - 10) + "' y='" + (height - margin + 12) + "' font-size='7' fill='currentColor' opacity='0.4'>" + maxVal.toFixed(2) + "</text>";
		svg += "<text x='" + (margin - 18) + "' y='" + (margin + 5) + "' font-size='7' fill='currentColor' opacity='0.4'>" + maxVal.toFixed(2) + "</text>";

		// Points
		for (var i = 0; i < persistence.length; i++) {
			var p = persistence[i];
			if (!isFinite(p.birth) || !isFinite(p.death)) continue;

			var x = margin + (p.birth / maxVal) * plotW;
			var y = (height - margin) - (p.death / maxVal) * plotH;

			var color = p.dimension === 0 ? "#3498db" : "#e74c3c";
			var radius = Math.min(5, 2 + (p.persistence / maxVal) * 4);
			var opacity = Math.min(0.9, 0.4 + (p.persistence / maxVal) * 0.5);

			svg += "<circle class='tda_pd_point' cx='" + x.toFixed(1) + "' cy='" + y.toFixed(1) + "' r='" + radius.toFixed(1) + "' fill='" + color + "' opacity='" + opacity.toFixed(2) + "' data-dim='" + p.dimension + "' data-birth='" + p.birth.toFixed(4) + "' data-death='" + p.death.toFixed(4) + "' data-pers='" + p.persistence.toFixed(4) + "' data-layer='" + layerIdx + "' style='cursor:pointer; transition: r 0.2s, opacity 0.2s;'>";
			svg += "<title>H" + p.dimension + " | birth=" + p.birth.toFixed(4) + " | death=" + p.death.toFixed(4) + " | pers=" + p.persistence.toFixed(4) + "</title>";
			svg += "</circle>";
		}

		// Axis labels
		svg += "<text x='" + (width / 2) + "' y='" + (height - 3) + "' text-anchor='middle' font-size='9' fill='currentColor' opacity='0.5'><tspan class='TRANSLATEME_tda_birth'></tspan></text>";
		svg += "<text x='8' y='" + (height / 2) + "' text-anchor='middle' font-size='9' fill='currentColor' opacity='0.5' transform='rotate(-90, 8, " + (height / 2) + ")'><tspan class='TRANSLATEME_tda_death'></tspan></text>";

		svg += "</svg>";
		return svg;
	}

	function _barcodeSVG(persistence, layerIdx) {
		if (!persistence || persistence.length === 0) return "<div class='tda_empty_plot'>—</div>";

		var finite = persistence.filter(function (p) { return isFinite(p.persistence); });
		if (finite.length === 0) return "<div class='tda_empty_plot'>—</div>";

		// Sort by persistence (longest bars first)
		finite.sort(function (a, b) { return b.persistence - a.persistence; });

		var maxBars = Math.min(finite.length, 25);
		finite = finite.slice(0, maxBars);

		var width = 280, barHeight = 9, gap = 2;
		var height = (barHeight + gap) * finite.length + 24;
		var margin = { left: 10, right: 10, top: 6, bottom: 18 };
		var plotW = width - margin.left - margin.right;

		var maxDeath = 0;
		for (var i = 0; i < finite.length; i++) {
			if (finite[i].death > maxDeath) maxDeath = finite[i].death;
		}
		if (maxDeath === 0) maxDeath = 1;

		var svg = "<svg class='tda_svg_interactive' width='100%' viewBox='0 0 " + width + " " + height + "' data-layer='" + layerIdx + "'>";

		for (var i = 0; i < finite.length; i++) {
			var p = finite[i];
			var x1 = margin.left + (p.birth / maxDeath) * plotW;
			var x2 = margin.left + (p.death / maxDeath) * plotW;
			var y = margin.top + i * (barHeight + gap);
			var color = p.dimension === 0 ? "#3498db" : "#e74c3c";
			var barW = Math.max(2, x2 - x1);

			svg += "<rect class='tda_barcode_bar' x='" + x1.toFixed(1) + "' y='" + y.toFixed(1) + "' width='" + barW.toFixed(1) + "' height='" + barHeight + "' fill='" + color + "' opacity='0.75' rx='2' data-dim='" + p.dimension + "' data-birth='" + p.birth.toFixed(4) + "' data-death='" + p.death.toFixed(4) + "' data-pers='" + p.persistence.toFixed(4) + "' style='cursor:pointer; transition: opacity 0.2s;'>";
			svg += "<title>H" + p.dimension + " [" + p.birth.toFixed(4) + ", " + p.death.toFixed(4) + "] pers=" + p.persistence.toFixed(4) + "</title>";
			svg += "</rect>";
		}

		// Axis
		svg += "<line x1='" + margin.left + "' y1='" + (height - margin.bottom) + "' x2='" + (width - margin.right) + "' y2='" + (height - margin.bottom) + "' stroke='currentColor' stroke-width='0.5' opacity='0.3'/>";
		svg += "<text x='" + margin.left + "' y='" + (height - 4) + "' font-size='7' fill='currentColor' opacity='0.4'>0</text>";
		svg += "<text x='" + (width - margin.right - 25) + "' y='" + (height - 4) + "' font-size='7' fill='currentColor' opacity='0.4'>" + maxDeath.toFixed(3) + "</text>";
		svg += "<text x='" + (width / 2) + "' y='" + (height - 4) + "' text-anchor='middle' font-size='7' fill='currentColor' opacity='0.4'>ε</text>";

		svg += "</svg>";
		return svg;
	}

	function _bettiCurveSVG(curve0, curve1, layerIdx) {
		if ((!curve0 || curve0.length === 0) && (!curve1 || curve1.length === 0)) return "<div class='tda_empty_plot'>—</div>";

		var width = 280, height = 100;
		var margin = { left: 28, right: 10, top: 12, bottom: 22 };
		var plotW = width - margin.left - margin.right;
		var plotH = height - margin.top - margin.bottom;

		var maxBetti = 1;
		var maxEps = 0;

		var curves = [curve0 || [], curve1 || []];
		for (var c = 0; c < curves.length; c++) {
			for (var i = 0; i < curves[c].length; i++) {
				if (curves[c][i].betti > maxBetti) maxBetti = curves[c][i].betti;
				if (curves[c][i].epsilon > maxEps) maxEps = curves[c][i].epsilon;
			}
		}

		if (maxEps === 0) return "<div class='tda_empty_plot'>—</div>";

		var svg = "<svg class='tda_svg_interactive' width='100%' viewBox='0 0 " + width + " " + height + "' data-layer='" + layerIdx + "'>";

		// Fill area under curves
		var colors = ["#3498db", "#e74c3c"];
		var fillOpacity = ["0.08", "0.06"];

		for (var c = 0; c < curves.length; c++) {
			var curve = curves[c];
			if (curve.length < 2) continue;

			// Area fill
			var areaPath = "M " + (margin.left + (curve[0].epsilon / maxEps) * plotW).toFixed(1) + " " + (margin.top + plotH).toFixed(1);
			for (var i = 0; i < curve.length; i++) {
				var x = margin.left + (curve[i].epsilon / maxEps) * plotW;
				var y = margin.top + plotH - (curve[i].betti / maxBetti) * plotH;
				areaPath += " L " + x.toFixed(1) + " " + y.toFixed(1);
			}
			areaPath += " L " + (margin.left + (curve[curve.length - 1].epsilon / maxEps) * plotW).toFixed(1) + " " + (margin.top + plotH).toFixed(1) + " Z";
			svg += "<path d='" + areaPath + "' fill='" + colors[c] + "' opacity='" + fillOpacity[c] + "'/>";

			// Line
			var path = "M";
			for (var i = 0; i < curve.length; i++) {
				var x = margin.left + (curve[i].epsilon / maxEps) * plotW;
				var y = margin.top + plotH - (curve[i].betti / maxBetti) * plotH;
				path += (i === 0 ? "" : " L") + x.toFixed(1) + " " + y.toFixed(1);
			}
			svg += "<path d='" + path + "' fill='none' stroke='" + colors[c] + "' stroke-width='1.8' opacity='0.85'/>";
		}

		// Axes
		svg += "<line x1='" + margin.left + "' y1='" + (height - margin.bottom) + "' x2='" + (width - margin.right) + "' y2='" + (height - margin.bottom) + "' stroke='currentColor' stroke-width='0.5' opacity='0.3'/>";
		svg += "<line x1='" + margin.left + "' y1='" + margin.top + "' x2='" + margin.left + "' y2='" + (height - margin.bottom) + "' stroke='currentColor' stroke-width='0.5' opacity='0.3'/>";

		// Y-axis ticks
		svg += "<text x='" + (margin.left - 3) + "' y='" + (margin.top + 4) + "' text-anchor='end' font-size='7' fill='currentColor' opacity='0.4'>" + maxBetti + "</text>";
		svg += "<text x='" + (margin.left - 3) + "' y='" + (height - margin.bottom + 3) + "' text-anchor='end' font-size='7' fill='currentColor' opacity='0.4'>0</text>";

		// X-axis label
		svg += "<text x='" + (width / 2) + "' y='" + (height - 4) + "' text-anchor='middle' font-size='8' fill='currentColor' opacity='0.4'>ε</text>";

		// Legend
		svg += "<text x='" + (width - margin.right - 40) + "' y='" + (margin.top + 8) + "' font-size='8' fill='#3498db' opacity='0.8'>β₀</text>";
		svg += "<text x='" + (width - margin.right - 22) + "' y='" + (margin.top + 8) + "' font-size='8' fill='#e74c3c' opacity='0.8'>β₁</text>";

		svg += "</svg>";
		return svg;
	}

	function _pointCloudSVG(projected, persistence, layerIdx) {
		if (!projected || projected.length < 3) return "<div class='tda_empty_plot'>—</div>";

		var width = 240, height = 240;
		var margin = 20;
		var plotW = width - 2 * margin;
		var plotH = height - 2 * margin;

		var minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
		for (var i = 0; i < projected.length; i++) {
			var px = projected[i][0] || 0;
			var py = projected[i][1] || 0;
			if (px < minX) minX = px;
			if (px > maxX) maxX = px;
			if (py < minY) minY = py;
			if (py > maxY) maxY = py;
		}

		var rangeX = maxX - minX || 1;
		var rangeY = maxY - minY || 1;

		var svg = "<svg class='tda_svg_interactive' width='100%' viewBox='0 0 " + width + " " + height + "' data-layer='" + layerIdx + "'>";

		// Points
		for (var i = 0; i < projected.length; i++) {
			var px = projected[i][0] || 0;
			var py = projected[i][1] || 0;
			var x = margin + ((px - minX) / rangeX) * plotW;
			var y = margin + ((py - minY) / rangeY) * plotH;

			svg += "<circle class='tda_cloud_point' cx='" + x.toFixed(1) + "' cy='" + y.toFixed(1) + "' r='2.5' fill='#8e44ad' opacity='0.5' data-idx='" + i + "' style='cursor:crosshair; transition: r 0.15s, opacity 0.15s;'>";
			svg += "<title>Point " + i + " (" + (projected[i][0] || 0).toFixed(3) + ", " + (projected[i][1] || 0).toFixed(3) + ")</title>";
			svg += "</circle>";
		}

		// Label
		svg += "<text x='" + (width / 2) + "' y='" + (height - 3) + "' text-anchor='middle' font-size='8' fill='currentColor' opacity='0.4'>PC1</text>";
		svg += "<text x='6' y='" + (height / 2) + "' text-anchor='middle' font-size='8' fill='currentColor' opacity='0.4' transform='rotate(-90, 6, " + (height / 2) + ")'>PC2</text>";

		svg += "</svg>";
		return svg;
	}

	function _landscapeSVG(landscape, layerIdx) {
		if (!landscape || landscape.length === 0) return "<div class='tda_empty_plot'>—</div>";

		var width = 280, height = 70;
		var margin = { left: 25, right: 10, top: 8, bottom: 16 };
		var plotW = width - margin.left - margin.right;
		var plotH = height - margin.top - margin.bottom;

		var maxVal = 0;
		for (var i = 0; i < landscape.length; i++) {
			if (landscape[i] > maxVal) maxVal = landscape[i];
		}
		if (maxVal === 0) maxVal = 1;

		var svg = "<svg class='tda_svg_interactive' width='100%' viewBox='0 0 " + width + " " + height + "' data-layer='" + layerIdx + "'>";

		var barW = plotW / landscape.length - 2;
		if (barW < 3) barW = 3;

		for (var i = 0; i < landscape.length; i++) {
			var barH = (landscape[i] / maxVal) * plotH;
			var x = margin.left + i * (plotW / landscape.length) + 1;
			var y = margin.top + plotH - barH;
			var opacity = 0.5 + (landscape[i] / maxVal) * 0.4;

			svg += "<rect x='" + x.toFixed(1) + "' y='" + y.toFixed(1) + "' width='" + barW.toFixed(1) + "' height='" + barH.toFixed(1) + "' fill='#9b59b6' opacity='" + opacity.toFixed(2) + "' rx='1.5'>";
			svg += "<title>λ" + (i + 1) + " = " + landscape[i].toFixed(4) + "</title>";
			svg += "</rect>";
			svg += "<text x='" + (x + barW / 2).toFixed(1) + "' y='" + (margin.top + plotH + 10) + "' text-anchor='middle' font-size='6' fill='currentColor' opacity='0.4'>λ" + (i + 1) + "</text>";
		}

		// Y-axis
		svg += "<line x1='" + margin.left + "' y1='" + margin.top + "' x2='" + margin.left + "' y2='" + (height - margin.bottom) + "' stroke='currentColor' stroke-width='0.5' opacity='0.3'/>";
		svg += "<text x='" + (margin.left - 3) + "' y='" + (margin.top + 5) + "' text-anchor='end' font-size='6' fill='currentColor' opacity='0.4'>" + maxVal.toFixed(3) + "</text>";

		svg += "</svg>";
		return svg;
	}

	function _historySparklineSVG(layerName) {
		if (!_state.history || _state.history.length < 2) return "";

		var values = [];
		for (var h = 0; h < _state.history.length; h++) {
			var entry = _state.history[h];
			for (var s = 0; s < entry.summaries.length; s++) {
				if (entry.summaries[s].name === layerName) {
					values.push(entry.summaries[s].summary.entropy || 0);
					break;
				}
			}
		}

		if (values.length < 2) return "";

		var width = 120, height = 30;
		var maxVal = Math.max.apply(null, values) || 1;
		var minVal = Math.min.apply(null, values);

		var svg = "<svg width='" + width + "' height='" + height + "' viewBox='0 0 " + width + " " + height + "' style='display:inline-block; vertical-align:middle;'>";

		var path = "M";
		for (var i = 0; i < values.length; i++) {
			var x = (i / (values.length - 1)) * width;
			var y = height - ((values[i] - minVal) / (maxVal - minVal || 1)) * height;
			path += (i === 0 ? "" : " L") + x.toFixed(1) + " " + y.toFixed(1);
		}

		svg += "<path d='" + path + "' fill='none' stroke='#9b59b6' stroke-width='1.5' opacity='0.7'/>";
		svg += "</svg>";
		return svg;
	}

	// ============================================================
	// INTERACTIVE EVENT BINDING
	// ============================================================

	function _bindInteractiveEvents() {
		if (!_state.container) return;

		// Hover effects on persistence diagram points
		var pdPoints = _state.container.querySelectorAll(".tda_pd_point");
		for (var i = 0; i < pdPoints.length; i++) {
			pdPoints[i].addEventListener("mouseenter", function () {
				this.setAttribute("r", parseFloat(this.getAttribute("r")) * 1.8);
				this.setAttribute("opacity", "1");
			});
			pdPoints[i].addEventListener("mouseleave", function () {
				this.setAttribute("r", (parseFloat(this.getAttribute("r")) / 1.8).toFixed(1));
				this.setAttribute("opacity", this.dataset.dim === "0" ? "0.7" : "0.6");
			});
			pdPoints[i].addEventListener("click", function () {
				_showPointDetail(this);
			});
		}

		// Hover effects on barcode bars
		var bars = _state.container.querySelectorAll(".tda_barcode_bar");
		for (var i = 0; i < bars.length; i++) {
			bars[i].addEventListener("mouseenter", function () {
				this.setAttribute("opacity", "1");
				this.style.filter = "brightness(1.2)";
			});
			bars[i].addEventListener("mouseleave", function () {
				this.setAttribute("opacity", "0.75");
				this.style.filter = "";
			});
		}

		// Hover effects on point cloud
		var cloudPoints = _state.container.querySelectorAll(".tda_cloud_point");
		for (var i = 0; i < cloudPoints.length; i++) {
			cloudPoints[i].addEventListener("mouseenter", function () {
				this.setAttribute("r", "5");
				this.setAttribute("opacity", "1");
			});
			cloudPoints[i].addEventListener("mouseleave", function () {
				this.setAttribute("r", "2.5");
				this.setAttribute("opacity", "0.5");
			});
		}

		// Collapsible cards
		var cardHeaders = _state.container.querySelectorAll(".tda_card_header");
		for (var i = 0; i < cardHeaders.length; i++) {
			cardHeaders[i].addEventListener("click", function (e) {
				if (e.target.closest(".tda_filter_btn")) return;
				var card = this.closest(".tda_card");
				var body = card.querySelector(".tda_card_body");
				if (body) {
					var isHidden = body.style.display === "none";
					body.style.display = isHidden ? "" : "none";
					var layerName = card.dataset.layerName;
					if (layerName) _state.expandedCards[layerName] = isHidden;
				}
			});
		}

		// Filter buttons
		var filterBtns = _state.container.querySelectorAll(".tda_filter_btn");
		for (var i = 0; i < filterBtns.length; i++) {
			filterBtns[i].addEventListener("click", function (e) {
				e.stopPropagation();
				var dim = parseInt(this.dataset.filterDim);
				_state.filterDimension = (_state.filterDimension === dim) ? -1 : dim;
				_update();
			});
		}
	}

	function _showPointDetail(el) {
		var detail = _state.container.querySelector(".tda_point_detail");
		if (!detail) {
			detail = document.createElement("div");
			detail.className = "tda_point_detail";
			_state.container.querySelector(".tda_container").appendChild(detail);
		}

		var dim = el.dataset.dim;
		var birth = parseFloat(el.dataset.birth);
		var death = parseFloat(el.dataset.death);
		var pers = parseFloat(el.dataset.pers);

		detail.innerHTML = "<div class='tda_detail_content'>" +
			"<strong>H" + dim + " " + (dim === "0" ? "(<span class='TRANSLATEME_tda_component'></span>)" : "(<span class='TRANSLATEME_tda_cycle'></span>)") + "</strong><br>" +
			"<span class='TRANSLATEME_tda_birth'></span>: " + birth.toFixed(5) + "<br>" +
			"<span class='TRANSLATEME_tda_death'></span>: " + death.toFixed(5) + "<br>" +
			"<span class='TRANSLATEME_tda_persistence_label'></span>: <strong>" + pers.toFixed(5) + "</strong>" +
			"<div class='tda_detail_close' onclick='this.parentElement.parentElement.style.display=\"none\"'>✕</div>" +
			"</div>";
		detail.style.display = "block";
		update_translations(); // await not possible
	}

	// ============================================================
	// MAIN RENDER
	// ============================================================

	function _update() {
		if (!_state.container) return;
		render(_state.container, _state.mode);
	}

	function render(divOrId, mode) {
		var container;

		if (typeof divOrId === "string" && divOrId !== "") {
			container = document.getElementById(divOrId);
		} else if (divOrId instanceof HTMLElement) {
			container = divOrId;
		}

		if (!container) {
			container = document.createElement("div");
			container.id = "tda_analysis_container_" + Date.now();
			document.body.appendChild(container);
		}

		_state.container = container;
		if (mode) _state.mode = mode;

		// Inject styles once
		_injectStyles();

		// Run analysis
		var result = analyze(_state.mode);

		if (result.error) {
			container.innerHTML = "<div class='tda_container'><div class='tda_error'><span class='TRANSLATEME_" + result.error + "'></span></div></div>";
			update_translations(); // await not possible
			return container;
		}

		var html = "<div class='tda_container'>";

		// Header
		html += "<div class='tda_header_row'>";
		html += "<h2><span class='TRANSLATEME_tda_title'></span></h2>";
		html += "<div class='tda_controls'>";
		html += "<button class='tda_btn tda_btn_refresh' onclick='TDAAnalysis.refresh()' title='Refresh'>⟳</button>";
		html += "<button class='tda_btn " + (_state.autoUpdateTimer ? "tda_btn_active" : "") + "' onclick='TDAAnalysis.toggleAutoUpdate()' title='Auto-update'>" + (_state.autoUpdateTimer ? "⏸" : "▶") + "</button>";
		html += "</div>";
		html += "</div>";

		// Subtitle with epoch info
		html += "<p class='tda_subtitle'><span class='TRANSLATEME_tda_subtitle'></span>";
		if (result.epoch > 0) html += " | Epoch " + result.epoch;
		html += " | " + new Date(result.timestamp).toLocaleTimeString();
		if (_state.history.length > 1) html += " | <span class='TRANSLATEME_tda_history'></span>: " + _state.history.length;
		html += "</p>";

		// Tabs
		html += "<div class='tda_tabs'>";
		var modes = ["activations", "weights", "raw_data", "auto"];
		var modeKeys = ["tda_tab_activations", "tda_tab_weights", "tda_tab_raw_data", "tda_tab_auto"];
		for (var m = 0; m < modes.length; m++) {
			html += "<div class='tda_tab " + (_state.mode === modes[m] ? "tda_tab_active" : "") + "' data-mode='" + modes[m] + "' onclick='TDAAnalysis.setMode(\"" + modes[m] + "\")'><span class='TRANSLATEME_" + modeKeys[m] + "'></span></div>";
		}
		html += "</div>";

		// Filter row
		html += "<div class='tda_filter_row'>";
		html += "<span class='tda_filter_label'><span class='TRANSLATEME_tda_filter'></span>:</span>";
		html += "<button class='tda_filter_btn " + (_state.filterDimension === -1 ? "tda_filter_active" : "") + "' data-filter-dim='-1'><span class='TRANSLATEME_tda_all'></span></button>";
		html += "<button class='tda_filter_btn " + (_state.filterDimension === 0 ? "tda_filter_active" : "") + "' data-filter-dim='0'>H₀</button>";
		html += "<button class='tda_filter_btn " + (_state.filterDimension === 1 ? "tda_filter_active" : "") + "' data-filter-dim='1'>H₁</button>";
		html += "<span class='tda_sort_label'> | <span class='TRANSLATEME_tda_sort'></span>:</span>";
		html += "<select class='tda_sort_select' onchange='TDAAnalysis.setSortBy(this.value)'>";
		html += "<option value='persistence'" + (_state.sortBy === "persistence" ? " selected" : "") + ">Persistence</option>";
		html += "<option value='birth'" + (_state.sortBy === "birth" ? " selected" : "") + ">Birth</option>";
		html += "<option value='death'" + (_state.sortBy === "death" ? " selected" : "") + ">Death</option>";
		html += "</select>";
		html += "</div>";

		// Legend
		html += "<div class='tda_legend'>";
		html += "<div class='tda_legend_item'><div class='tda_legend_dot' style='background:#3498db;'></div> H\u2080 (<span class='TRANSLATEME_tda_connected_components'></span>)</div>";
		html += "<div class='tda_legend_item'><div class='tda_legend_dot' style='background:#e74c3c;'></div> H\u2081 (<span class='TRANSLATEME_tda_loops'></span>)</div>";
		html += "<div class='tda_legend_item'><div class='tda_legend_dot' style='background:#9b59b6;'></div> <span class='TRANSLATEME_tda_point_cloud'></span></div>";
		html += "</div>";

		if (!result.layers || result.layers.length === 0) {
			html += "<div class='tda_no_data'><span class='TRANSLATEME_tda_no_layers_analyzed'></span></div>";
		} else {
			// Global topology overview
			html += _renderGlobalOverview(result.layers);

			// Per-layer cards
			for (var i = 0; i < result.layers.length; i++) {
				var layer = result.layers[i];
				html += _renderLayerCard(layer, _state.mode, i);
			}
		}

		html += "</div>"; // end tda_container

		container.innerHTML = html;
		_bindInteractiveEvents();
		update_translations(); // await not possible

		return container;
	}

	// ============================================================
	// GLOBAL OVERVIEW
	// ============================================================

	function _renderGlobalOverview(layers) {
		if (!layers || layers.length < 2) return "";

		var html = "<div class='tda_overview_card'>";
		html += "<div class='tda_overview_title'><span class='TRANSLATEME_tda_topology_overview'></span></div>";

		// Comparison table
		html += "<div class='tda_overview_table_wrap'><table class='tda_overview_table'>";
		html += "<tr><th><span class='TRANSLATEME_tda_layer'></span></th><th>H₀</th><th>H₁</th><th><span class='TRANSLATEME_tda_max_persistence'></span></th><th><span class='TRANSLATEME_tda_persistence_entropy'></span></th><th><span class='TRANSLATEME_tda_wasserstein'></span></th><th><span class='TRANSLATEME_tda_trend'></span></th></tr>";

		for (var i = 0; i < layers.length; i++) {
			var l = layers[i];
			var s = l.summary;
			var entropyColor = s.entropy > 3 ? "#27ae60" : (s.entropy > 1.5 ? "#f39c12" : "#e74c3c");

			html += "<tr class='tda_overview_row' data-layer-idx='" + i + "' style='cursor:pointer;'>";
			html += "<td><strong>" + _escapeHtml(l.name || "") + "</strong></td>";
			html += "<td>" + s.h0Count + "</td>";
			html += "<td>" + s.h1Count + "</td>";
			html += "<td>" + s.maxPersistence.toFixed(3) + "</td>";
			html += "<td style='color:" + entropyColor + ";'>" + s.entropy.toFixed(3) + "</td>";
			html += "<td>" + s.wasserstein1.toFixed(3) + "</td>";
			html += "<td>" + _historySparklineSVG(l.name) + "</td>";
			html += "</tr>";
		}

		html += "</table></div>";
		html += "</div>";

		return html;
	}

	// ============================================================
	// MISSING HELPER FUNCTIONS
	// ============================================================

	function _escapeHtml(str) {
		if (!str) return "";
		if (typeof str !== "string") str = String(str);
		return str
			.replace(/&/g, "&amp;")
			.replace(/</g, "&lt;")
			.replace(/>/g, "&gt;")
			.replace(/"/g, "&quot;")
			.replace(/'/g, "&#039;");
	}

	function _statItem(value, labelKey) {
		return "<div class='tda_stat_item'>" +
			"<div class='tda_stat_value'>" + value + "</div>" +
			"<div class='tda_stat_label'><span class='TRANSLATEME_" + labelKey + "'></span></div>" +
			"</div>";
	}

	// ============================================================
	// RENDER LAYER CARD
	// ============================================================

	function _renderLayerCard(layer, mode, layerIdx) {
		var isExpanded = _state.expandedCards[layer.name] !== false;
		var bodyDisplay = isExpanded ? "" : "display:none;";

		var html = "<div class='tda_card' data-layer-name='" + _escapeHtml(layer.name || "") + "'>";

		// Header
		html += "<div class='tda_card_header'>";
		html += "<div class='tda_card_title_row'>";
		html += "<span class='tda_expand_icon'>" + (isExpanded ? "▼" : "▶") + "</span> ";
		html += "<strong>" + _escapeHtml(layer.name || "") + "</strong>";
		html += "</div>";

		var badge = "";
		if (layer.meta && layer.meta.source) {
			badge += "<span class='tda_source_badge tda_source_" + layer.meta.source + "'>" + layer.meta.source + "</span> ";
		}
		if (layer.meta && layer.meta.type) {
			badge += layer.meta.type + " | ";
		}
		badge += layer.numPoints + " <span class='TRANSLATEME_tda_points'></span>, dim=" + layer.pointDim;
		if (layer.meta && layer.meta.shape) {
			badge += " [" + layer.meta.shape.join("\u00d7") + "]";
		}
		html += "<span class='tda_badge'>" + badge + "</span>";

		// Filter buttons in header
		html += "<div class='tda_header_actions'>";
		html += "<button class='tda_filter_btn " + (_state.filterDimension === 0 ? "tda_filter_active" : "") + "' data-filter-dim='0' title='H₀'>H₀</button>";
		html += "<button class='tda_filter_btn " + (_state.filterDimension === 1 ? "tda_filter_active" : "") + "' data-filter-dim='1' title='H₁'>H₁</button>";
		html += "</div>";

		html += "</div>"; // end header

		// Body (collapsible)
		html += "<div class='tda_card_body' style='" + bodyDisplay + "'>";

		// Summary stats
		var summary = layer.summary;
		html += "<div class='tda_summary_grid'>";
		html += _statItem(summary.h0Count, "tda_h0_features");
		html += _statItem(summary.h1Count, "tda_h1_features");
		html += _statItem(summary.maxPersistence.toFixed(4), "tda_max_persistence");
		html += _statItem(summary.meanPersistence.toFixed(4), "tda_mean_persistence");
		html += _statItem(summary.medianPersistence.toFixed(4), "tda_median_persistence");
		html += _statItem(summary.entropy.toFixed(3), "tda_persistence_entropy");
		html += _statItem(summary.wasserstein1.toFixed(3), "tda_wasserstein");
		html += _statItem(summary.totalFeatures, "tda_total_features");
		html += "</div>";

		// Filter persistence based on state
		var filteredPersistence = layer.persistence;
		if (_state.filterDimension >= 0) {
			filteredPersistence = layer.persistence.filter(function (p) {
				return p.dimension === _state.filterDimension;
			});
		}

		// Sort persistence
		if (_state.sortBy === "birth") {
			filteredPersistence = filteredPersistence.slice().sort(function (a, b) { return a.birth - b.birth; });
		} else if (_state.sortBy === "death") {
			filteredPersistence = filteredPersistence.slice().sort(function (a, b) { return (isFinite(b.death) ? b.death : 1e10) - (isFinite(a.death) ? a.death : 1e10); });
		} else {
			filteredPersistence = filteredPersistence.slice().sort(function (a, b) { return (isFinite(b.persistence) ? b.persistence : 1e10) - (isFinite(a.persistence) ? a.persistence : 1e10); });
		}

		// Plots grid
		html += "<div class='tda_plots'>";

		// Persistence Diagram
		html += "<div class='tda_plot_box'>";
		html += "<div class='tda_plot_label'><span class='TRANSLATEME_tda_persistence_diagram'></span></div>";
		html += _persistenceDiagramSVG(filteredPersistence, layerIdx);
		html += "</div>";

		// Barcode
		html += "<div class='tda_plot_box'>";
		html += "<div class='tda_plot_label'><span class='TRANSLATEME_tda_barcode'></span></div>";
		html += _barcodeSVG(filteredPersistence, layerIdx);
		html += "</div>";

		// Betti Curves
		html += "<div class='tda_plot_box'>";
		html += "<div class='tda_plot_label'><span class='TRANSLATEME_tda_betti_curves'></span></div>";
		html += _bettiCurveSVG(layer.bettiCurve0, layer.bettiCurve1, layerIdx);
		html += "</div>";

		// Point Cloud (PCA 2D projection)
		html += "<div class='tda_plot_box'>";
		html += "<div class='tda_plot_label'><span class='TRANSLATEME_tda_point_cloud'></span> (PCA 2D)</div>";
		html += _pointCloudSVG(layer.projected, filteredPersistence, layerIdx);
		html += "</div>";

		// Persistence Landscape
		html += "<div class='tda_plot_box'>";
		html += "<div class='tda_plot_label'><span class='TRANSLATEME_tda_persistence_landscape'></span></div>";
		html += _landscapeSVG(summary.landscape, layerIdx);
		html += "</div>";

		html += "</div>"; // end tda_plots

		// Top features table
		html += _renderTopFeaturesTable(filteredPersistence, layerIdx);

		html += "</div>"; // end tda_card_body
		html += "</div>"; // end tda_card

		return html;
	}

	// ============================================================
	// TOP FEATURES TABLE
	// ============================================================

	function _renderTopFeaturesTable(persistence, layerIdx) {
		var finite = persistence.filter(function (p) { return isFinite(p.persistence); });
		if (finite.length === 0) return "";

		finite.sort(function (a, b) { return b.persistence - a.persistence; });
		var topN = Math.min(finite.length, _config.highlightTopN);

		var html = "<div class='tda_top_features'>";
		html += "<div class='tda_top_features_title'><span class='TRANSLATEME_tda_top_features'></span> (Top " + topN + ")</div>";
		html += "<table class='tda_features_table'>";
		html += "<tr><th>#</th><th>Dim</th><th><span class='TRANSLATEME_tda_birth'></span></th><th><span class='TRANSLATEME_tda_death'></span></th><th><span class='TRANSLATEME_tda_persistence_label'></span></th><th><span class='TRANSLATEME_tda_significance'></span></th></tr>";

		var maxPers = finite[0].persistence;

		for (var i = 0; i < topN; i++) {
			var p = finite[i];
			var significance = (p.persistence / maxPers * 100).toFixed(1);
			var barWidth = (p.persistence / maxPers * 100).toFixed(0);
			var color = p.dimension === 0 ? "#3498db" : "#e74c3c";

			html += "<tr class='tda_feature_row' data-layer='" + layerIdx + "' data-idx='" + i + "'>";
			html += "<td>" + (i + 1) + "</td>";
			html += "<td><span style='color:" + color + ";font-weight:bold;'>H" + p.dimension + "</span></td>";
			html += "<td>" + p.birth.toFixed(4) + "</td>";
			html += "<td>" + p.death.toFixed(4) + "</td>";
			html += "<td><strong>" + p.persistence.toFixed(4) + "</strong></td>";
			html += "<td><div class='tda_significance_bar'><div class='tda_significance_fill' style='width:" + barWidth + "%; background:" + color + ";'></div><span>" + significance + "%</span></div></td>";
			html += "</tr>";
		}

		html += "</table></div>";
		return html;
	}

	// ============================================================
	// STYLES INJECTION
	// ============================================================

	function _injectStyles() {
		if (document.getElementById("tda_analysis_styles_v2")) return;

		var style = document.createElement("style");
		style.id = "tda_analysis_styles_v2";
		style.textContent = [
			".tda_container { padding: 16px; font-family: inherit; }",
			".tda_container h2 { margin: 0 0 4px 0; font-size: 1.4em; }",
			".tda_header_row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px; }",
			".tda_controls { display: flex; gap: 6px; }",
			".tda_btn { border: 1px solid rgba(128,128,128,0.3); background: rgba(128,128,128,0.06); border-radius: 6px; padding: 4px 10px; cursor: pointer; font-size: 1em; transition: all 0.2s; }",
			".tda_btn:hover { background: rgba(128,128,128,0.15); }",
			".tda_btn_active { background: rgba(46,204,113,0.15); border-color: rgba(46,204,113,0.4); }",
			".tda_subtitle { opacity: 0.55; margin: 0 0 12px 0; font-size: 0.82em; }",
			".tda_tabs { display: flex; gap: 4px; margin-bottom: 12px; flex-wrap: wrap; }",
			".tda_tab { padding: 5px 12px; border-radius: 6px; cursor: pointer; font-size: 0.82em; border: 1px solid rgba(128,128,128,0.2); background: rgba(128,128,128,0.04); transition: all 0.2s; user-select: none; }",
			".tda_tab:hover { background: rgba(128,128,128,0.12); }",
			".tda_tab_active { background: rgba(52,152,219,0.14); border-color: rgba(52,152,219,0.4); font-weight: 600; }",
			".tda_filter_row { display: flex; align-items: center; gap: 6px; margin-bottom: 12px; font-size: 0.82em; flex-wrap: wrap; }",
			".tda_filter_label, .tda_sort_label { opacity: 0.6; }",
			".tda_filter_btn { padding: 3px 9px; border-radius: 4px; cursor: pointer; font-size: 0.8em; border: 1px solid rgba(128,128,128,0.2); background: rgba(128,128,128,0.04); transition: all 0.2s; }",
			".tda_filter_btn:hover { background: rgba(128,128,128,0.12); }",
			".tda_filter_active { background: rgba(52,152,219,0.15); border-color: rgba(52,152,219,0.4); font-weight: 600; }",
			".tda_sort_select { padding: 3px 8px; border-radius: 4px; border: 1px solid rgba(128,128,128,0.2); background: rgba(128,128,128,0.04); font-size: 0.8em; }",
			".tda_legend { display: flex; gap: 14px; margin-bottom: 14px; font-size: 0.78em; opacity: 0.7; flex-wrap: wrap; }",
			".tda_legend_item { display: flex; align-items: center; gap: 4px; }",
			".tda_legend_dot { width: 9px; height: 9px; border-radius: 50%; }",
			".tda_overview_card { border: 2px solid rgba(128,128,128,0.15); border-radius: 10px; padding: 14px; margin-bottom: 16px; background: rgba(128,128,128,0.02); }",
			".tda_overview_title { font-weight: 600; margin-bottom: 10px; font-size: 0.95em; }",
			".tda_overview_table_wrap { overflow-x: auto; }",
			".tda_overview_table { width: 100%; border-collapse: collapse; font-size: 0.8em; }",
			".tda_overview_table th { text-align: left; padding: 4px 8px; border-bottom: 1px solid rgba(128,128,128,0.2); opacity: 0.6; font-size: 0.85em; text-transform: uppercase; }",
			".tda_overview_table td { padding: 5px 8px; border-bottom: 1px solid rgba(128,128,128,0.08); }",
			".tda_overview_row:hover { background: rgba(52,152,219,0.06); }",
			".tda_card { border: 2px solid rgba(128,128,128,0.15); border-radius: 10px; padding: 14px; margin: 12px 0; background: rgba(128,128,128,0.02); transition: box-shadow 0.3s; }",
			".tda_card:hover { box-shadow: 0 3px 14px rgba(0,0,0,0.07); }",
			".tda_card_header { display: flex; justify-content: space-between; align-items: center; cursor: pointer; user-select: none; flex-wrap: wrap; gap: 6px; }",
			".tda_card_title_row { display: flex; align-items: center; gap: 6px; }",
			".tda_expand_icon { font-size: 0.7em; opacity: 0.5; }",
			".tda_badge { font-size: 0.72em; opacity: 0.55; background: rgba(128,128,128,0.08); padding: 2px 8px; border-radius: 4px; }",
			".tda_source_badge { font-size: 0.65em; padding: 1px 6px; border-radius: 3px; font-weight: 600; text-transform: uppercase; }",
			".tda_source_activation { background: rgba(52,152,219,0.15); color: #2980b9; }",
			".tda_source_weight { background: rgba(231,76,60,0.12); color: #c0392b; }",
			".tda_source_raw_data { background: rgba(46,204,113,0.12); color: #27ae60; }",
			".tda_header_actions { display: flex; gap: 4px; }",
			".tda_summary_grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(100px, 1fr)); gap: 6px; margin: 10px 0; }",
			".tda_stat_item { background: rgba(128,128,128,0.05); border-radius: 6px; padding: 7px; text-align: center; }",
			".tda_stat_value { font-size: 1.1em; font-weight: bold; font-variant-numeric: tabular-nums; }",
			".tda_stat_label { font-size: 0.65em; opacity: 0.55; margin-top: 2px; text-transform: uppercase; letter-spacing: 0.3px; }",
			".tda_plots { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-top: 10px; }",
			"@media (max-width: 750px) { .tda_plots { grid-template-columns: 1fr; } }",
			".tda_plot_box { background: rgba(128,128,128,0.03); border-radius: 8px; padding: 10px; border: 1px solid rgba(128,128,128,0.08); }",
			".tda_plot_label { font-size: 0.7em; opacity: 0.45; margin-bottom: 4px; text-transform: uppercase; letter-spacing: 0.4px; }",
			".tda_empty_plot { text-align: center; opacity: 0.3; padding: 20px; font-size: 1.5em; }",
			".tda_top_features { margin-top: 12px; }",
			".tda_top_features_title { font-size: 0.8em; font-weight: 600; margin-bottom: 6px; opacity: 0.7; }",
			".tda_features_table { width: 100%; border-collapse: collapse; font-size: 0.75em; }",
			".tda_features_table th { text-align: left; padding: 3px 6px; border-bottom: 1px solid rgba(128,128,128,0.15); opacity: 0.5; font-size: 0.85em; }",
			".tda_features_table td { padding: 4px 6px; border-bottom: 1px solid rgba(128,128,128,0.06); }",
			".tda_feature_row:hover { background: rgba(52,152,219,0.06); }",
			".tda_significance_bar { position: relative; height: 14px; background: rgba(128,128,128,0.08); border-radius: 3px; overflow: hidden; min-width: 60px; }",
			".tda_significance_fill { position: absolute; left: 0; top: 0; height: 100%; border-radius: 3px; opacity: 0.6; }",
			".tda_significance_bar span { position: relative; z-index: 1; font-size: 0.8em; padding-left: 4px; line-height: 14px; }",
			".tda_point_detail { position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); background: var(--bg, #fff); border: 2px solid rgba(128,128,128,0.3); border-radius: 10px; padding: 16px; z-index: 10000; box-shadow: 0 8px 30px rgba(0,0,0,0.15); max-width: 300px; display: none; }",
			".tda_detail_content { font-size: 0.9em; line-height: 1.6; }",
			".tda_detail_close { position: absolute; top: 6px; right: 10px; cursor: pointer; font-size: 1.2em; opacity: 0.5; }",
			".tda_detail_close:hover { opacity: 1; }",
			".tda_error { padding: 24px; text-align: center; opacity: 0.5; font-size: 1.05em; }",
			".tda_no_data { padding: 30px; text-align: center; opacity: 0.4; font-size: 0.95em; }",
			".tda_svg_interactive circle:hover { filter: brightness(1.3); }",
			".tda_svg_interactive rect:hover { filter: brightness(1.2); }"
		].join("\n");
		document.head.appendChild(style);
	}

	// ============================================================
	// AUTO-UPDATE
	// ============================================================

	function startAutoUpdate(intervalMs) {
		stopAutoUpdate();
		var interval = intervalMs || _config.autoUpdateInterval;
		_state.autoUpdateTimer = setInterval(function () {
			try {
				if (_state.container) {
					render(_state.container, _state.mode);
				}
			} catch (e) {
				console.warn("[TDA] Auto-update error:", e);
			}
		}, interval);
	}

	function stopAutoUpdate() {
		if (_state.autoUpdateTimer) {
			clearInterval(_state.autoUpdateTimer);
			_state.autoUpdateTimer = null;
		}
	}

	function toggleAutoUpdate() {
		if (_state.autoUpdateTimer) {
			stopAutoUpdate();
		} else {
			startAutoUpdate();
		}
		if (_state.container) {
			render(_state.container, _state.mode);
		}
	}

	function refresh() {
		if (_state.container) {
			render(_state.container, _state.mode);
		}
	}

	function setMode(mode) {
		_state.mode = mode;
		if (_state.container) {
			render(_state.container, _state.mode);
		}
	}

	function setSortBy(sortBy) {
		_state.sortBy = sortBy;
		if (_state.container) {
			render(_state.container, _state.mode);
		}
	}

	// ============================================================
	// PUBLIC API
	// ============================================================

	return {
		render: render,
		analyze: analyze,
		refresh: refresh,
		setMode: setMode,
		setSortBy: setSortBy,
		startAutoUpdate: startAutoUpdate,
		stopAutoUpdate: stopAutoUpdate,
		toggleAutoUpdate: toggleAutoUpdate,
		getLastResult: function () { return _state.lastResult; },
		getHistory: function () { return _state.history; },
		getState: function () { return _state; },
		setConfig: function (cfg) {
			if (cfg && typeof cfg === "object") {
				for (var k in cfg) {
					if (_config.hasOwnProperty(k)) {
						_config[k] = cfg[k];
					}
				}
			}
		}
	};

})();
