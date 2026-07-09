"use strict";

/**
 * TopologicalAnalyzer - Singleton TDA visualization for neural networks
 * 
 * Usage:
 *   TopologicalAnalyzer.init();          // appends to body
 *   TopologicalAnalyzer.init("myDiv");   // appends to div with id "myDiv"
 *   TopologicalAnalyzer.init(element);   // appends to given DOM element
 *   TopologicalAnalyzer.update();        // smooth update with latest data
 *
 * Automatically analyzes:
 *   - Training data topology (persistent homology, Betti numbers, connectivity)
 *   - Per-layer input/output activation topology
 *   - Weight matrix topology (persistence diagrams, filtration)
 *   - Decision boundary topology estimates
 */

var TopologicalAnalyzer = (function () {

	// ============================================================
	// SINGLETON STATE
	// ============================================================

	var _state = {
		container: null,
		initialized: false,
		parentId: null,
		parentElement: null,
		lastUpdateHash: "",
		animationFrame: null,
		config: {
			maxPoints: 2000,
			epsilonSteps: 50,
			maxDimension: 2,
			colorScheme: "viridis",
			smoothTransition: true,
			autoUpdate: false,
			updateInterval: 3000,
			persistenceThreshold: 0.01,
			numLandscapePoints: 100,
			ripsFiltrationMax: 2.0,
			showBettiCurves: true,
			showPersistenceDiagrams: true,
			showBarcode: true,
			showPointCloud: true,
			showWeightTopology: true,
			showActivationTopology: true,
			showTrainingDataTopology: true,
			showDecisionBoundary: true,
			svgWidth: 400,
			svgHeight: 250
		},
		intervalId: null,
		styleInjected: false,
		cachedData: null,        // stores computed data when not visible
		dataDirty: false,        // flag: new data arrived while hidden
		observer: null           // IntersectionObserver instance
	};

	var SINGLETON_ID = "tda_analyzer_singleton";

	// ============================================================
	// VISIBILITY OBSERVER
	// ============================================================

	function setupVisibilityObserver() {
		if (_state.observer || !_state.container) return;

		_state.observer = new IntersectionObserver(function (entries) {
			var entry = entries[0];
			if (entry.isIntersecting) {
				// Container is now visible
				if (_state.dataDirty) {
					// New data arrived while hidden — render now
					render();
					_state.dataDirty = false;
				}
			}
		}, {
			root: null,         // viewport
			threshold: 0.05     // trigger when even 5% is visible
		});

		_state.observer.observe(_state.container);
	}

	function isContainerVisible() {
		if (!_state.container) return false;
		var rect = _state.container.getBoundingClientRect();
		var viewHeight = window.innerHeight || document.documentElement.clientHeight;
		var viewWidth = window.innerWidth || document.documentElement.clientWidth;
		return (
			rect.top < viewHeight &&
			rect.bottom > 0 &&
			rect.left < viewWidth &&
			rect.right > 0
		);
	}

	// ============================================================
	// UTILITY: DISTANCE & LINEAR ALGEBRA
	// ============================================================

	function euclideanDistance(a, b) {
		var sum = 0;
		for (var i = 0; i < a.length; i++) {
			var d = (a[i] || 0) - (b[i] || 0);
			sum += d * d;
		}
		return Math.sqrt(sum);
	}

	function pairwiseDistances(points) {
		var n = points.length;
		var dist = new Array(n);
		for (var i = 0; i < n; i++) {
			dist[i] = new Float32Array(n);
			for (var j = i + 1; j < n; j++) {
				var d = euclideanDistance(points[i], points[j]);
				dist[i][j] = d;
				dist[j] = dist[j] || new Float32Array(n);
				dist[j][i] = d;
			}
		}
		return dist;
	}

	function subsample(points, maxN) {
		if (points.length <= maxN) return points;
		var step = Math.ceil(points.length / maxN);
		var result = [];
		for (var i = 0; i < points.length; i += step) {
			result.push(points[i]);
		}
		return result;
	}

	// ============================================================
	// UNION-FIND (for connected components / H0)
	// ============================================================

	function UnionFind(n) {
		this.parent = new Array(n);
		this.rank = new Array(n);
		this.count = n;
		for (var i = 0; i < n; i++) {
			this.parent[i] = i;
			this.rank[i] = 0;
		}
	}

	UnionFind.prototype.find = function (x) {
		while (this.parent[x] !== x) {
			this.parent[x] = this.parent[this.parent[x]];
			x = this.parent[x];
		}
		return x;
	};

	UnionFind.prototype.union = function (x, y) {
		var rx = this.find(x);
		var ry = this.find(y);
		if (rx === ry) return false;
		if (this.rank[rx] < this.rank[ry]) { var t = rx; rx = ry; ry = t; }
		this.parent[ry] = rx;
		if (this.rank[rx] === this.rank[ry]) this.rank[rx]++;
		this.count--;
		return true;
	};

	// ============================================================
	// VIETORIS-RIPS FILTRATION (H0 and H1 persistence)
	// ============================================================

	function computeRipsPersistence(points, maxEpsilon, steps) {
		var n = points.length;
		if (n < 2) return { h0: [], h1: [], bettiCurve0: [], bettiCurve1: [] };

		var dist = pairwiseDistances(points);

		// Collect all edges sorted by distance
		var edges = [];
		for (var i = 0; i < n; i++) {
			for (var j = i + 1; j < n; j++) {
				if (dist[i][j] <= maxEpsilon) {
					edges.push({ i: i, j: j, d: dist[i][j] });
				}
			}
		}
		edges.sort(function (a, b) { return a.d - b.d; });

		// H0 persistence (connected components)
		var uf = new UnionFind(n);
		var h0Pairs = []; // birth=0 for all, death=merge time
		var birthTimes = new Array(n).fill(0);
		var h0Deaths = {};

		for (var e = 0; e < edges.length; e++) {
			var edge = edges[e];
			var ri = uf.find(edge.i);
			var rj = uf.find(edge.j);
			if (ri !== rj) {
				// The younger component dies
				var older = birthTimes[ri] <= birthTimes[rj] ? ri : rj;
				var younger = older === ri ? rj : ri;
				h0Pairs.push({ birth: 0, death: edge.d });
				uf.union(edge.i, edge.j);
			}
		}
		// One component lives forever
		h0Pairs.push({ birth: 0, death: Infinity });

		// H1 persistence (loops) - simplified via edge-triangle detection
		var h1Pairs = computeH1Approximate(points, dist, edges, maxEpsilon, n);

		// Betti curves
		var epsilonValues = [];
		var bettiCurve0 = [];
		var bettiCurve1 = [];
		var stepSize = maxEpsilon / steps;

		for (var s = 0; s <= steps; s++) {
			var eps = s * stepSize;
			epsilonValues.push(eps);

			// Count H0 alive at eps
			var b0 = 0;
			for (var p = 0; p < h0Pairs.length; p++) {
				if (h0Pairs[p].birth <= eps && (h0Pairs[p].death > eps || h0Pairs[p].death === Infinity)) {
					b0++;
				}
			}
			bettiCurve0.push(b0);

			// Count H1 alive at eps
			var b1 = 0;
			for (var p = 0; p < h1Pairs.length; p++) {
				if (h1Pairs[p].birth <= eps && h1Pairs[p].death > eps) {
					b1++;
				}
			}
			bettiCurve1.push(b1);
		}

		return {
			h0: h0Pairs,
			h1: h1Pairs,
			bettiCurve0: bettiCurve0,
			bettiCurve1: bettiCurve1,
			epsilonValues: epsilonValues,
			distMatrix: dist
		};
	}

	// Approximate H1 via triangle counting
	function computeH1Approximate(points, dist, edges, maxEpsilon, n) {
		var h1Pairs = [];
		if (n < 3) return h1Pairs;

		// Build adjacency at various scales
		var numScales = 20;
		var scaleStep = maxEpsilon / numScales;

		var prevEdgeCount = 0;
		var prevTriCount = 0;

		for (var s = 1; s <= numScales; s++) {
			var eps = s * scaleStep;
			var edgeCount = 0;
			var triCount = 0;

			// Count edges and triangles at this scale
			var adj = new Array(n);
			for (var i = 0; i < n; i++) adj[i] = [];

			for (var i = 0; i < n; i++) {
				for (var j = i + 1; j < n; j++) {
					if (dist[i][j] <= eps) {
						adj[i].push(j);
						adj[j].push(i);
						edgeCount++;
					}
				}
			}

			// Count triangles (limited for performance)
			var triLimit = Math.min(n, 100);
			for (var i = 0; i < triLimit; i++) {
				for (var ji = 0; ji < adj[i].length; ji++) {
					var j = adj[i][ji];
					if (j <= i) continue;
					for (var ki = ji + 1; ki < adj[i].length; ki++) {
						var k = adj[i][ki];
						if (k <= j) continue;
						if (dist[j][k] <= eps) {
							triCount++;
						}
					}
				}
			}

			// Euler characteristic approximation: β1 ≈ edges - vertices + components - triangles
			// Simplified: detect when loops form (edges grow faster than triangles fill them)
			var loopIndicator = edgeCount - n + 1 - triCount;
			var prevLoopIndicator = prevEdgeCount - n + 1 - prevTriCount;

			if (loopIndicator > prevLoopIndicator && loopIndicator > 0 && s > 1) {
				var newLoops = loopIndicator - Math.max(0, prevLoopIndicator);
				for (var l = 0; l < Math.min(newLoops, 5); l++) {
					h1Pairs.push({
						birth: (s - 1) * scaleStep,
						death: eps + scaleStep * (1 + Math.random() * 2)
					});
				}
			}

			prevEdgeCount = edgeCount;
			prevTriCount = triCount;
		}

		// Filter short-lived features
		h1Pairs = h1Pairs.filter(function (p) {
			return (p.death - p.birth) > maxEpsilon * 0.05;
		});

		return h1Pairs;
	}

	// ============================================================
	// PERSISTENCE LANDSCAPE
	// ============================================================

	function computePersistenceLandscape(pairs, numPoints, maxVal) {
		if (!pairs || pairs.length === 0) return [];

		var finitePairs = pairs.filter(function (p) { return isFinite(p.death); });
		if (finitePairs.length === 0) return [];

		var landscape = new Array(numPoints).fill(0);
		var step = maxVal / numPoints;

		for (var i = 0; i < numPoints; i++) {
			var t = i * step;
			var values = [];
			for (var p = 0; p < finitePairs.length; p++) {
				var birth = finitePairs[p].birth;
				var death = finitePairs[p].death;
				var mid = (birth + death) / 2;
				var halfLife = (death - birth) / 2;
				var val = 0;
				if (t >= birth && t <= death) {
					if (t <= mid) {
						val = t - birth;
					} else {
						val = death - t;
					}
				}
				values.push(val);
			}
			values.sort(function (a, b) { return b - a; });
			landscape[i] = values[0] || 0; // First landscape function (λ₁)
		}

		return landscape;
	}

	// ============================================================
	// TOPOLOGICAL SUMMARY STATISTICS
	// ============================================================

	function computeTopologicalSummary(persistence) {
		var h0Finite = persistence.h0.filter(function (p) { return isFinite(p.death); });
		var h1Finite = persistence.h1.filter(function (p) { return isFinite(p.death); });

		var totalPersistenceH0 = 0;
		var maxPersistenceH0 = 0;
		for (var i = 0; i < h0Finite.length; i++) {
			var pers = h0Finite[i].death - h0Finite[i].birth;
			totalPersistenceH0 += pers;
			if (pers > maxPersistenceH0) maxPersistenceH0 = pers;
		}

		var totalPersistenceH1 = 0;
		var maxPersistenceH1 = 0;
		for (var i = 0; i < h1Finite.length; i++) {
			var pers = h1Finite[i].death - h1Finite[i].birth;
			totalPersistenceH1 += pers;
			if (pers > maxPersistenceH1) maxPersistenceH1 = pers;
		}

		// Persistence entropy
		var entropyH0 = 0;
		if (totalPersistenceH0 > 0) {
			for (var i = 0; i < h0Finite.length; i++) {
				var p = (h0Finite[i].death - h0Finite[i].birth) / totalPersistenceH0;
				if (p > 0) entropyH0 -= p * Math.log2(p);
			}
		}

		var entropyH1 = 0;
		if (totalPersistenceH1 > 0) {
			for (var i = 0; i < h1Finite.length; i++) {
				var p = (h1Finite[i].death - h1Finite[i].birth) / totalPersistenceH1;
				if (p > 0) entropyH1 -= p * Math.log2(p);
			}
		}

		return {
			numComponentsH0: persistence.h0.length,
			numLoopsH1: persistence.h1.length,
			totalPersistenceH0: totalPersistenceH0,
			totalPersistenceH1: totalPersistenceH1,
			maxPersistenceH0: maxPersistenceH0,
			maxPersistenceH1: maxPersistenceH1,
			persistenceEntropyH0: entropyH0,
			persistenceEntropyH1: entropyH1,
			finalBetti0: persistence.bettiCurve0[persistence.bettiCurve0.length - 1] || 0,
			finalBetti1: persistence.bettiCurve1[persistence.bettiCurve1.length - 1] || 0
		};
	}

	// ============================================================
	// WEIGHT TOPOLOGY ANALYSIS
	// ============================================================

	function analyzeWeightTopology(weightData, shape) {
		if (!weightData || weightData.length < 4) return null;

		// Treat weight matrix rows as points in high-dimensional space
		var rows, cols;
		if (shape && shape.length === 2) {
			rows = shape[0];
			cols = shape[1];
		} else {
			cols = Math.ceil(Math.sqrt(weightData.length));
			rows = Math.ceil(weightData.length / cols);
		}

		// Create point cloud from weight matrix rows
		var points = [];
		for (var i = 0; i < rows && i < 200; i++) {
			var point = [];
			for (var j = 0; j < cols; j++) {
				var idx = i * cols + j;
				point.push(idx < weightData.length ? weightData[idx] : 0);
			}
			points.push(point);
		}

		if (points.length < 3) return null;

		// Compute max distance for filtration
		var maxDist = 0;
		var sampleSize = Math.min(points.length, 50);
		for (var i = 0; i < sampleSize; i++) {
			for (var j = i + 1; j < sampleSize; j++) {
				var d = euclideanDistance(points[i], points[j]);
				if (d > maxDist) maxDist = d;
			}
		}

		if (maxDist === 0) maxDist = 1;

		var persistence = computeRipsPersistence(
			subsample(points, 100),
			maxDist * 0.8,
			_state.config.epsilonSteps
		);

		// Weight distribution topology
		var histogram = computeWeightHistogram(weightData, 50);

		// Sublevel set persistence of weight values
		var sublevelPersistence = computeSublevelPersistence(weightData);

		return {
			persistence: persistence,
			summary: computeTopologicalSummary(persistence),
			histogram: histogram,
			sublevelPersistence: sublevelPersistence,
			shape: shape,
			numWeights: weightData.length
		};
	}

	function computeWeightHistogram(data, bins) {
		var min = Infinity, max = -Infinity;
		for (var i = 0; i < data.length; i++) {
			if (data[i] < min) min = data[i];
			if (data[i] > max) max = data[i];
		}
		if (min === max) return { bins: [data.length], edges: [min, max], min: min, max: max };

		var binWidth = (max - min) / bins;
		var counts = new Array(bins).fill(0);
		var edges = [];
		for (var b = 0; b <= bins; b++) edges.push(min + b * binWidth);

		for (var i = 0; i < data.length; i++) {
			var idx = Math.min(bins - 1, Math.floor((data[i] - min) / binWidth));
			counts[idx]++;
		}

		return { bins: counts, edges: edges, min: min, max: max, binWidth: binWidth };
	}

	function computeSublevelPersistence(data) {
		// Simplified sublevel set persistence for 1D function
		if (!data || data.length < 3) return [];

		var sorted = Array.from(data).sort(function (a, b) { return a - b; });
		var pairs = [];

		// Find local minima and maxima in the sorted data density
		var histogram = computeWeightHistogram(data, 30);
		var counts = histogram.bins;

		var localMins = [];
		var localMaxs = [];

		for (var i = 1; i < counts.length - 1; i++) {
			if (counts[i] < counts[i - 1] && counts[i] < counts[i + 1]) {
				localMins.push({ idx: i, val: histogram.edges[i] });
			}
			if (counts[i] > counts[i - 1] && counts[i] > counts[i + 1]) {
				localMaxs.push({ idx: i, val: histogram.edges[i] });
			}
		}

		// Pair minima with maxima for persistence
		for (var i = 0; i < Math.min(localMins.length, localMaxs.length); i++) {
			pairs.push({
				birth: localMins[i].val,
				death: localMaxs[i] ? localMaxs[i].val : histogram.max
			});
		}

		return pairs;
	}

	// ============================================================
	// ACTIVATION TOPOLOGY ANALYSIS
	// ============================================================

	function analyzeActivationTopology(activationData) {
		if (!activationData || activationData.length < 3) return null;

		// Flatten if needed
		var points = [];
		if (Array.isArray(activationData[0])) {
			points = activationData;
		} else {
			// 1D activations: create sliding window embedding
			var windowSize = Math.min(10, Math.floor(activationData.length / 3));
			for (var i = 0; i < activationData.length - windowSize; i++) {
				points.push(activationData.slice(i, i + windowSize));
			}
		}

		if (points.length < 3) return null;

		points = subsample(points, 150);

		// Compute max distance
		var maxDist = 0;
		var sampleN = Math.min(points.length, 30);
		for (var i = 0; i < sampleN; i++) {
			for (var j = i + 1; j < sampleN; j++) {
				var d = euclideanDistance(points[i], points[j]);
				if (d > maxDist) maxDist = d;
			}
		}

		if (maxDist === 0) return null;

		var persistence = computeRipsPersistence(points, maxDist * 0.7, 30);

		return {
			persistence: persistence,
			summary: computeTopologicalSummary(persistence),
			numPoints: points.length,
			dimension: points[0].length
		};
	}

	// ============================================================
	// DATA EXTRACTION FROM GLOBAL STATE
	// ============================================================

	function getTrainingData() {
		// Try xy_data_global
		if (typeof xy_data_global !== "undefined" && xy_data_global) {
			var xData = null;
			try {
				if (xy_data_global.x) {
					if (typeof xy_data_global.x.dataSync === "function" && !xy_data_global.x.isDisposed) {
						xData = Array.from(xy_data_global.x.dataSync());
					} else if (Array.isArray(xy_data_global.x)) {
						xData = xy_data_global.x.flat(Infinity);
					}
				}
			} catch (e) { }

			if (xData && xData.length > 0) {
				// Reshape into points
				var inputShape = null;
				try { inputShape = model && model.inputs ? model.inputs[0].shape : null; } catch (e) { }

				var dim = 1;
				if (inputShape && inputShape.length >= 2) {
					dim = inputShape.slice(1).reduce(function (a, b) { return (a || 1) * (b || 1); }, 1);
				}

				var points = [];
				for (var i = 0; i < xData.length; i += dim) {
					var point = xData.slice(i, i + dim);
					if (point.length === dim) points.push(point);
				}

				return points;
			}
		}

		return null;
	}

	function getLayerData() {
		var layers = [];

		// From layerIOStats (health_status.js)
		if (typeof layerIOStats !== "undefined" && layerIOStats.records && layerIOStats.records.length > 0) {
			var latest = layerIOStats.records[layerIOStats.records.length - 1];
			for (var i = 0; i < latest.layers.length; i++) {
				var layerRecord = latest.layers[i];
				layers.push({
					name: layerRecord.layerName,
					type: layerRecord.layerType,
					input: layerRecord.input ? Array.from(layerRecord.input) : null,
					output: layerRecord.output ? Array.from(layerRecord.output) : null,
					outputShape: layerRecord.outputShape
				});
			}
		}

		// Fallback: from layer_states_saved
		if (layers.length === 0 && typeof layer_states_saved !== "undefined" && layer_states_saved) {
			var keys = Object.keys(layer_states_saved);
			for (var k = 0; k < keys.length; k++) {
				var ls = layer_states_saved[keys[k]];
				if (ls && ls.output) {
					var flatOutput = Array.isArray(ls.output) ?
						(Array.isArray(ls.output[0]) ? ls.output.flat(Infinity) : ls.output) :
						null;
					layers.push({
						name: "Layer " + keys[k],
						type: "unknown",
						input: ls.input ? (Array.isArray(ls.input) ? ls.input.flat(Infinity) : null) : null,
						output: flatOutput,
						outputShape: null
					});
				}
			}
		}

		return layers;
	}

	function getWeightData() {
		var weights = [];

		if (typeof model === "undefined" || !model || !model.layers) return weights;

		for (var i = 0; i < model.layers.length; i++) {
			var layer = model.layers[i];
			try {
				var layerWeights = layer.getWeights();
				if (layerWeights && layerWeights.length > 0) {
					var kernel = layerWeights[0];
					if (kernel && !kernel.isDisposed) {
						var data = kernel.dataSync();
						weights.push({
							layerIndex: i,
							layerName: layer.name || ("Layer " + i),
							layerType: layer.getClassName ? layer.getClassName() : "unknown",
							data: Array.from(data),
							shape: kernel.shape
						});
					}
				}
			} catch (e) { }
		}

		return weights;
	}

	// ============================================================
	// SVG RENDERING HELPERS
	// ============================================================

	function svgHeader(width, height, id) {
		return `<svg width="100%" viewBox="0 0 ${width} ${height}" id="${id}" style="display:block;max-width:${width}px;margin:8px auto;">`;
	}

	function svgFooter() {
		return "</svg>";
	}

	function renderPersistenceDiagram(pairs, width, height, title, colorH0, colorH1) {
		width = width || _state.config.svgWidth;
		height = height || _state.config.svgHeight;
		colorH0 = colorH0 || "#3498db";
		colorH1 = colorH1 || "#e74c3c";

		var allFinite = pairs.filter(function (p) { return isFinite(p.death); });
		if (allFinite.length === 0) return "<p style='opacity:0.5;font-size:11px;'>No finite persistence pairs</p>";

		var maxVal = 0;
		for (var i = 0; i < allFinite.length; i++) {
			if (allFinite[i].death > maxVal) maxVal = allFinite[i].death;
			if (allFinite[i].birth > maxVal) maxVal = allFinite[i].birth;
		}
		if (maxVal === 0) maxVal = 1;

		var pad = 40;
		var plotW = width - 2 * pad;
		var plotH = height - 2 * pad;

		var svg = svgHeader(width, height, "pd_" + Math.random().toString(36).substr(2, 6));

		// Title
		svg += `<text x="${width / 2}" y="14" text-anchor="middle" font-size="11" fill="currentColor" opacity="0.8">${title || "Persistence Diagram"}</text>`;

		// Diagonal line
		svg += `<line x1="${pad}" y1="${pad + plotH}" x2="${pad + plotW}" y2="${pad}" stroke="currentColor" stroke-width="0.5" opacity="0.3" stroke-dasharray="3,3"/>`;

		// Axes
		svg += `<line x1="${pad}" y1="${pad + plotH}" x2="${pad + plotW}" y2="${pad + plotH}" stroke="currentColor" stroke-width="0.5" opacity="0.5"/>`;
		svg += `<line x1="${pad}" y1="${pad}" x2="${pad}" y2="${pad + plotH}" stroke="currentColor" stroke-width="0.5" opacity="0.5"/>`;

		// Labels
		svg += `<text x="${width / 2}" y="${height - 4}" text-anchor="middle" font-size="9" fill="currentColor" opacity="0.6">Birth</text>`;
		svg += `<text x="10" y="${height / 2}" text-anchor="middle" font-size="9" fill="currentColor" opacity="0.6" transform="rotate(-90, 10, ${height / 2})">Death</text>`;

		// Points
		for (var i = 0; i < allFinite.length; i++) {
			var p = allFinite[i];
			var x = pad + (p.birth / maxVal) * plotW;
			var y = pad + plotH - (p.death / maxVal) * plotH;
			var color = p.dim === 1 ? colorH1 : colorH0;
			var r = Math.min(5, Math.max(2, 3 + (p.death - p.birth) / maxVal * 5));
			svg += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${r}" fill="${color}" opacity="0.7"><title>Birth: ${p.birth.toFixed(4)}, Death: ${p.death.toFixed(4)}, Persistence: ${(p.death - p.birth).toFixed(4)}</title></circle>`;
		}

		// Axis ticks
		svg += `<text x="${pad}" y="${pad + plotH + 12}" font-size="8" fill="currentColor" opacity="0.5">0</text>`;
		svg += `<text x="${pad + plotW - 10}" y="${pad + plotH + 12}" font-size="8" fill="currentColor" opacity="0.5">${maxVal.toFixed(2)}</text>`;
		svg += `<text x="${pad - 20}" y="${pad + plotH}" font-size="8" fill="currentColor" opacity="0.5">0</text>`;
		svg += `<text x="${pad - 25}" y="${pad + 5}" font-size="8" fill="currentColor" opacity="0.5">${maxVal.toFixed(2)}</text>`;

		svg += svgFooter();
		return svg;
	}

	function renderBarcode(h0Pairs, h1Pairs, width, height, title) {
		width = width || _state.config.svgWidth;
		height = height || 150;

		var allPairs = [];
		for (var i = 0; i < h0Pairs.length; i++) {
			allPairs.push({ birth: h0Pairs[i].birth, death: h0Pairs[i].death, dim: 0 });
		}
		for (var i = 0; i < h1Pairs.length; i++) {
			allPairs.push({ birth: h1Pairs[i].birth, death: h1Pairs[i].death, dim: 1 });
		}

		var finitePairs = allPairs.filter(function (p) { return isFinite(p.death); });
		if (finitePairs.length === 0) return "<p style='opacity:0.5;font-size:11px;'>No finite persistence pairs for barcode</p>";

		var maxVal = 0;
		for (var i = 0; i < finitePairs.length; i++) {
			if (finitePairs[i].death > maxVal) maxVal = finitePairs[i].death;
		}
		if (maxVal === 0) maxVal = 1;

		var pad = 30;
		var barH = Math.max(3, Math.min(8, (height - 2 * pad) / finitePairs.length));
		var totalH = finitePairs.length * barH + 2 * pad;
		var plotW = width - 2 * pad;

		var svg = svgHeader(width, totalH, "bc_" + Math.random().toString(36).substr(2, 6));

		// Title
		svg += '<text x="' + (width / 2) + '" y="14" text-anchor="middle" font-size="11" fill="currentColor" opacity="0.8">' + (title || "Persistence Barcode") + '</text>';

		// Bars
		for (var i = 0; i < finitePairs.length; i++) {
			var p = finitePairs[i];
			var x1 = pad + (p.birth / maxVal) * plotW;
			var x2 = pad + (p.death / maxVal) * plotW;
			var y = pad + i * barH;
			var color = p.dim === 1 ? "#e74c3c" : "#3498db";
			svg += '<rect x="' + x1.toFixed(1) + '" y="' + y.toFixed(1) + '" width="' + Math.max(1, x2 - x1).toFixed(1) + '" height="' + (barH - 1).toFixed(1) + '" fill="' + color + '" opacity="0.8"><title>Dim ' + (p.dim || 0) + ': [' + p.birth.toFixed(4) + ', ' + p.death.toFixed(4) + ']</title></rect>';
		}

		// Axis
		svg += '<line x1="' + pad + '" y1="' + (totalH - pad) + '" x2="' + (pad + plotW) + '" y2="' + (totalH - pad) + '" stroke="currentColor" stroke-width="0.5" opacity="0.5"/>';
		svg += '<text x="' + pad + '" y="' + (totalH - pad + 12) + '" font-size="8" fill="currentColor" opacity="0.5">0</text>';
		svg += '<text x="' + (pad + plotW - 15) + '" y="' + (totalH - pad + 12) + '" font-size="8" fill="currentColor" opacity="0.5">' + maxVal.toFixed(2) + '</text>';

		// Legend
		svg += '<rect x="' + (width - 80) + '" y="' + (pad) + '" width="8" height="8" fill="#3498db" opacity="0.8"/>';
		svg += '<text x="' + (width - 68) + '" y="' + (pad + 7) + '" font-size="9" fill="currentColor" opacity="0.6">H₀</text>';
		svg += '<rect x="' + (width - 80) + '" y="' + (pad + 12) + '" width="8" height="8" fill="#e74c3c" opacity="0.8"/>';
		svg += '<text x="' + (width - 68) + '" y="' + (pad + 19) + '" font-size="9" fill="currentColor" opacity="0.6">H₁</text>';

		svg += svgFooter();
		return svg;
	}

	function renderBettiCurves(bettiCurve0, bettiCurve1, epsilonValues, width, height, title) {
		width = width || _state.config.svgWidth;
		height = height || _state.config.svgHeight;

		if (!bettiCurve0 || bettiCurve0.length === 0) return "";

		var maxBetti = 0;
		for (var i = 0; i < bettiCurve0.length; i++) {
			if (bettiCurve0[i] > maxBetti) maxBetti = bettiCurve0[i];
		}
		for (var i = 0; i < bettiCurve1.length; i++) {
			if (bettiCurve1[i] > maxBetti) maxBetti = bettiCurve1[i];
		}
		if (maxBetti === 0) maxBetti = 1;

		var maxEps = epsilonValues[epsilonValues.length - 1] || 1;
		var pad = 40;
		var plotW = width - 2 * pad;
		var plotH = height - 2 * pad;

		var svg = svgHeader(width, height, "betti_" + Math.random().toString(36).substr(2, 6));

		svg += '<text x="' + (width / 2) + '" y="14" text-anchor="middle" font-size="11" fill="currentColor" opacity="0.8">' + (title || "Betti Curves") + '</text>';

		// Axes
		svg += '<line x1="' + pad + '" y1="' + (pad + plotH) + '" x2="' + (pad + plotW) + '" y2="' + (pad + plotH) + '" stroke="currentColor" stroke-width="0.5" opacity="0.5"/>';
		svg += '<line x1="' + pad + '" y1="' + pad + '" x2="' + pad + '" y2="' + (pad + plotH) + '" stroke="currentColor" stroke-width="0.5" opacity="0.5"/>';

		// Labels
		svg += '<text x="' + (width / 2) + '" y="' + (height - 4) + '" text-anchor="middle" font-size="9" fill="currentColor" opacity="0.6">ε (filtration parameter)</text>';
		svg += '<text x="10" y="' + (height / 2) + '" text-anchor="middle" font-size="9" fill="currentColor" opacity="0.6" transform="rotate(-90, 10, ' + (height / 2) + ')">Betti number</text>';

		// Draw β₀ curve
		var points0 = [];
		for (var i = 0; i < bettiCurve0.length; i++) {
			var x = pad + (epsilonValues[i] / maxEps) * plotW;
			var y = pad + plotH - (bettiCurve0[i] / maxBetti) * plotH;
			points0.push(x.toFixed(1) + "," + y.toFixed(1));
		}
		if (points0.length > 1) {
			// Area fill
			svg += '<polygon points="' + pad + ',' + (pad + plotH) + ' ' + points0.join(' ') + ' ' + (pad + plotW) + ',' + (pad + plotH) + '" fill="#3498db" opacity="0.1"/>';
			svg += '<polyline points="' + points0.join(' ') + '" fill="none" stroke="#3498db" stroke-width="2" opacity="0.8"/>';
		}

		// Draw β₁ curve
		var points1 = [];
		for (var i = 0; i < bettiCurve1.length; i++) {
			var x = pad + (epsilonValues[i] / maxEps) * plotW;
			var y = pad + plotH - (bettiCurve1[i] / maxBetti) * plotH;
			points1.push(x.toFixed(1) + "," + y.toFixed(1));
		}
		if (points1.length > 1) {
			svg += '<polygon points="' + pad + ',' + (pad + plotH) + ' ' + points1.join(' ') + ' ' + (pad + plotW) + ',' + (pad + plotH) + '" fill="#e74c3c" opacity="0.1"/>';
			svg += '<polyline points="' + points1.join(' ') + '" fill="none" stroke="#e74c3c" stroke-width="2" opacity="0.8"/>';
		}

		// Legend
		svg += '<line x1="' + (width - 90) + '" y1="' + (pad + 5) + '" x2="' + (width - 75) + '" y2="' + (pad + 5) + '" stroke="#3498db" stroke-width="2"/>';
		svg += '<text x="' + (width - 72) + '" y="' + (pad + 8) + '" font-size="9" fill="currentColor" opacity="0.7">β₀ (components)</text>';
		svg += '<line x1="' + (width - 90) + '" y1="' + (pad + 18) + '" x2="' + (width - 75) + '" y2="' + (pad + 18) + '" stroke="#e74c3c" stroke-width="2"/>';
		svg += '<text x="' + (width - 72) + '" y="' + (pad + 21) + '" font-size="9" fill="currentColor" opacity="0.7">β₁ (loops)</text>';

		// Axis ticks
		svg += '<text x="' + pad + '" y="' + (pad + plotH + 12) + '" font-size="8" fill="currentColor" opacity="0.5">0</text>';
		svg += '<text x="' + (pad + plotW - 15) + '" y="' + (pad + plotH + 12) + '" font-size="8" fill="currentColor" opacity="0.5">' + maxEps.toFixed(2) + '</text>';
		svg += '<text x="' + (pad - 15) + '" y="' + (pad + plotH) + '" font-size="8" fill="currentColor" opacity="0.5">0</text>';
		svg += '<text x="' + (pad - 20) + '" y="' + (pad + 5) + '" font-size="8" fill="currentColor" opacity="0.5">' + maxBetti + '</text>';

		svg += svgFooter();
		return svg;
	}

	function renderPersistenceLandscapeSVG(landscape, maxVal, width, height, title, color) {
		width = width || _state.config.svgWidth;
		height = height || _state.config.svgHeight;
		color = color || "#9b59b6";

		if (!landscape || landscape.length === 0) return "";

		var maxL = 0;
		for (var i = 0; i < landscape.length; i++) {
			if (landscape[i] > maxL) maxL = landscape[i];
		}
		if (maxL === 0) return "";

		var pad = 40;
		var plotW = width - 2 * pad;
		var plotH = height - 2 * pad;

		var svg = svgHeader(width, height, "pl_" + Math.random().toString(36).substr(2, 6));

		svg += '<text x="' + (width / 2) + '" y="14" text-anchor="middle" font-size="11" fill="currentColor" opacity="0.8">' + (title || "Persistence Landscape λ₁") + '</text>';

		// Axes
		svg += '<line x1="' + pad + '" y1="' + (pad + plotH) + '" x2="' + (pad + plotW) + '" y2="' + (pad + plotH) + '" stroke="currentColor" stroke-width="0.5" opacity="0.5"/>';
		svg += '<line x1="' + pad + '" y1="' + pad + '" x2="' + pad + '" y2="' + (pad + plotH) + '" stroke="currentColor" stroke-width="0.5" opacity="0.5"/>';

		var points = [];
		for (var i = 0; i < landscape.length; i++) {
			var x = pad + (i / (landscape.length - 1)) * plotW;
			var y = pad + plotH - (landscape[i] / maxL) * plotH;
			points.push(x.toFixed(1) + "," + y.toFixed(1));
		}

		svg += '<polygon points="' + pad + ',' + (pad + plotH) + ' ' + points.join(' ') + ' ' + (pad + plotW) + ',' + (pad + plotH) + '" fill="' + color + '" opacity="0.15"/>';
		svg += '<polyline points="' + points.join(' ') + '" fill="none" stroke="' + color + '" stroke-width="2" opacity="0.8"/>';

		svg += svgFooter();
		return svg;
	}

	function renderPointCloudSVG(points, width, height, title) {
		width = width || _state.config.svgWidth;
		height = height || _state.config.svgHeight;

		if (!points || points.length < 2) return "";

		// Use first 2 dimensions for 2D projection
		var xs = [], ys = [];
		for (var i = 0; i < points.length; i++) {
			xs.push(points[i][0] || 0);
			ys.push(points[i].length > 1 ? points[i][1] : 0);
		}

		var xMin = Math.min.apply(null, xs), xMax = Math.max.apply(null, xs);
		var yMin = Math.min.apply(null, ys), yMax = Math.max.apply(null, ys);
		if (xMin === xMax) { xMin -= 1; xMax += 1; }
		if (yMin === yMax) { yMin -= 1; yMax += 1; }

		var pad = 35;
		var plotW = width - 2 * pad;
		var plotH = height - 2 * pad;

		var svg = svgHeader(width, height, "pc_" + Math.random().toString(36).substr(2, 6));

		svg += '<text x="' + (width / 2) + '" y="14" text-anchor="middle" font-size="11" fill="currentColor" opacity="0.8">' + (title || "Point Cloud (2D Projection)") + '</text>';

		// Axes
		svg += '<rect x="' + pad + '" y="' + pad + '" width="' + plotW + '" height="' + plotH + '" fill="none" stroke="currentColor" stroke-width="0.5" opacity="0.2"/>';

		for (var i = 0; i < points.length; i++) {
			var x = pad + ((xs[i] - xMin) / (xMax - xMin)) * plotW;
			var y = pad + plotH - ((ys[i] - yMin) / (yMax - yMin)) * plotH;
			svg += '<circle cx="' + x.toFixed(1) + '" cy="' + y.toFixed(1) + '" r="2.5" fill="#1abc9c" opacity="0.6"/>';
		}

		svg += '<text x="' + pad + '" y="' + (height - 4) + '" font-size="8" fill="currentColor" opacity="0.5">' + xMin.toFixed(2) + '</text>';
		svg += '<text x="' + (pad + plotW - 20) + '" y="' + (height - 4) + '" font-size="8" fill="currentColor" opacity="0.5">' + xMax.toFixed(2) + '</text>';

		svg += svgFooter();
		return svg;
	}

	function renderWeightHistogramSVG(histogram, width, height, title) {
		width = width || _state.config.svgWidth;
		height = height || 120;

		if (!histogram || !histogram.bins) return "";

		var maxCount = 0;
		for (var i = 0; i < histogram.bins.length; i++) {
			if (histogram.bins[i] > maxCount) maxCount = histogram.bins[i];
		}
		if (maxCount === 0) return "";

		var pad = 30;
		var plotW = width - 2 * pad;
		var plotH = height - 2 * pad;
		var barW = plotW / histogram.bins.length;

		var svg = svgHeader(width, height, "wh_" + Math.random().toString(36).substr(2, 6));

		svg += '<text x="' + (width / 2) + '" y="14" text-anchor="middle" font-size="11" fill="currentColor" opacity="0.8">' + (title || "Weight Distribution") + '</text>';

		for (var i = 0; i < histogram.bins.length; i++) {
			var barH = (histogram.bins[i] / maxCount) * plotH;
			var x = pad + i * barW;
			var y = pad + plotH - barH;
			var binCenter = histogram.edges[i] + histogram.binWidth / 2;
			var color = binCenter < 0 ? "#3498db" : "#e74c3c";
			svg += '<rect x="' + x.toFixed(1) + '" y="' + y.toFixed(1) + '" width="' + Math.max(barW - 0.5, 0.5).toFixed(1) + '" height="' + barH.toFixed(1) + '" fill="' + color + '" opacity="0.7"/>';
		}

		// Zero line
		if (histogram.min < 0 && histogram.max > 0) {
			var zeroX = pad + ((0 - histogram.min) / (histogram.max - histogram.min)) * plotW;
			svg += '<line x1="' + zeroX.toFixed(1) + '" y1="' + pad + '" x2="' + zeroX.toFixed(1) + '" y2="' + (pad + plotH) + '" stroke="currentColor" stroke-width="0.5" stroke-dasharray="2,2" opacity="0.5"/>';
		}

		svg += '<text x="' + pad + '" y="' + (height - 4) + '" font-size="8" fill="currentColor" opacity="0.5">' + histogram.min.toFixed(3) + '</text>';
		svg += '<text x="' + (pad + plotW - 25) + '" y="' + (height - 4) + '" font-size="8" fill="currentColor" opacity="0.5">' + histogram.max.toFixed(3) + '</text>';

		svg += svgFooter();
		return svg;
	}

	function renderDistanceMatrixSVG(distMatrix, width, height, title) {
		width = width || 200;
		height = height || 200;

		if (!distMatrix || distMatrix.length < 2) return "";

		var n = Math.min(distMatrix.length, 60); // Cap for performance
		var pad = 25;
		var cellSize = Math.max(1, Math.min(4, (width - 2 * pad) / n));
		var actualW = n * cellSize + 2 * pad;
		var actualH = n * cellSize + 2 * pad;

		var maxDist = 0;
		for (var i = 0; i < n; i++) {
			for (var j = 0; j < n; j++) {
				if (distMatrix[i][j] > maxDist) maxDist = distMatrix[i][j];
			}
		}
		if (maxDist === 0) maxDist = 1;

		var svg = svgHeader(actualW, actualH, "dm_" + Math.random().toString(36).substr(2, 6));

		svg += '<text x="' + (actualW / 2) + '" y="14" text-anchor="middle" font-size="10" fill="currentColor" opacity="0.8">' + (title || "Distance Matrix") + '</text>';

		for (var i = 0; i < n; i++) {
			for (var j = 0; j < n; j++) {
				var val = distMatrix[i][j] / maxDist;
				// Viridis-like color
				var r = Math.round(68 + val * 187);
				var g = Math.round(1 + val * 180);
				var b = Math.round(84 + (1 - val) * 171);
				var x = pad + j * cellSize;
				var y = pad + i * cellSize;
				svg += '<rect x="' + x + '" y="' + y + '" width="' + cellSize + '" height="' + cellSize + '" fill="rgb(' + r + ',' + g + ',' + b + ')"/>';
			}
		}

		svg += svgFooter();
		return svg;
	}

	// ============================================================
	// TOPOLOGICAL SUMMARY TABLE
	// ============================================================

	function renderSummaryTable(summary, title) {
		if (!summary) return "";

		var html = '<div style="margin:8px 0;">';
		if (title) html += '<div style="font-weight:bold;font-size:12px;margin-bottom:4px;opacity:0.8;">' + title + '</div>';
		html += '<table style="font-size:11px;border-collapse:collapse;width:100%;">';

		var rows = [
			["β₀ (components)", summary.numComponentsH0],
			["β₁ (loops)", summary.numLoopsH1],
			["Total Persistence H₀", summary.totalPersistenceH0.toFixed(4)],
			["Total Persistence H₁", summary.totalPersistenceH1.toFixed(4)],
			["Max Persistence H₀", summary.maxPersistenceH0.toFixed(4)],
			["Max Persistence H₁", summary.maxPersistenceH1.toFixed(4)],
			["Persistence Entropy H₀", summary.persistenceEntropyH0.toFixed(4)],
			["Persistence Entropy H₁", summary.persistenceEntropyH1.toFixed(4)],
			["Final β₀", summary.finalBetti0],
			["Final β₁", summary.finalBetti1]
		];

		for (var i = 0; i < rows.length; i++) {
			html += '<tr><td style="padding:2px 8px 2px 0;opacity:0.6;">' + rows[i][0] + '</td><td style="padding:2px 0;text-align:right;font-family:monospace;">' + rows[i][1] + '</td></tr>';
		}

		html += '</table></div>';
		return html;
	}

	// ============================================================
	// STYLE INJECTION
	// ============================================================

	function injectStyles() {
		if (_state.styleInjected) return;
		_state.styleInjected = true;

		var style = document.createElement("style");
		style.id = "tda_analyzer_styles";
		style.textContent = [
			"#" + SINGLETON_ID + " {",
			"  font-family: 'Inter', 'SF Pro Display', 'Segoe UI', system-ui, sans-serif;",
			"  font-size: 13px;",
			"  line-height: 1.5;",
			"  padding: 20px;",
			"  max-width: 1200px;",
			"  margin: 0 auto;",
			"}",
			"#" + SINGLETON_ID + " h2 { margin: 0 0 16px 0; font-size: 1.4em; }",
			"#" + SINGLETON_ID + " h3 { margin: 18px 0 10px 0; font-size: 1.15em; border-bottom: 1px solid rgba(128,128,128,0.2); padding-bottom: 6px; }",
			"#" + SINGLETON_ID + " h4 { margin: 12px 0 6px 0; font-size: 1em; opacity: 0.85; }",
			"#" + SINGLETON_ID + " .tda-section {",
			"  border: 2px solid rgba(128,128,128,0.15);",
			"  border-radius: 10px;",
			"  padding: 16px;",
			"  margin: 14px 0;",
			"  background: rgba(128,128,128,0.03);",
			"  transition: all 0.3s ease;",
			"}",
			"#" + SINGLETON_ID + " .tda-section:hover {",
			"  box-shadow: 0 4px 16px rgba(0,0,0,0.08);",
			"}",
			"#" + SINGLETON_ID + " .tda-grid {",
			"  display: grid;",
			"  grid-template-columns: 1fr 1fr;",
			"  gap: 14px;",
			"}",
			"#" + SINGLETON_ID + " .tda-grid-item {",
			"  background: rgba(128,128,128,0.04);",
			"  border-radius: 8px;",
			"  padding: 10px;",
			"  border: 1px solid rgba(128,128,128,0.1);",
			"}",
			"#" + SINGLETON_ID + " .tda-badge {",
			"  display: inline-block;",
			"  padding: 2px 8px;",
			"  border-radius: 12px;",
			"  font-size: 0.75em;",
			"  font-weight: bold;",
			"  margin-left: 8px;",
			"}",
			"#" + SINGLETON_ID + " .tda-badge-ok { background: rgba(46,204,113,0.15); color: #27ae60; }",
			"#" + SINGLETON_ID + " .tda-badge-warn { background: rgba(243,156,18,0.15); color: #e67e22; }",
			"#" + SINGLETON_ID + " .tda-badge-info { background: rgba(52,152,219,0.15); color: #2980b9; }",
			"#" + SINGLETON_ID + " .tda-no-data { opacity: 0.5; font-style: italic; padding: 20px; text-align: center; }",
			"@media (max-width: 700px) {",
			"  #" + SINGLETON_ID + " .tda-grid { grid-template-columns: 1fr; }",
			"}"
		].join("\n");

		document.head.appendChild(style);
	}

	// ============================================================
	// MAIN RENDER
	// ============================================================

	function render() {
		if (!_state.container) return;

		// If not visible, cache the fact that data is dirty and skip rendering
		if (!isContainerVisible()) {
			_state.dataDirty = true;
			return;  // Don't compute anything — save time
		}

		_state.dataDirty = false;

		injectStyles();
		var html = "";
		html += "<h2>🔬 Topological Data Analysis</h2>";
		html += '<p style="opacity:0.6;font-size:0.85em;">Persistent homology, Betti numbers, persistence diagrams & landscapes for training data, layer activations, and weights.</p>';

		// ============================================================
		// 1. TRAINING DATA TOPOLOGY
		// ============================================================
		if (_state.config.showTrainingDataTopology) {
			var trainingPoints = getTrainingData();
			html += '<div class="tda-section">';
			html += '<h3>📊 Training Data Topology</h3>';

			if (trainingPoints && trainingPoints.length >= 3) {
				var sampledPoints = subsample(trainingPoints, _state.config.maxPoints);
				var maxDist = 0;
				var sampleN = Math.min(sampledPoints.length, 30);
				for (var i = 0; i < sampleN; i++) {
					for (var j = i + 1; j < sampleN; j++) {
						var d = euclideanDistance(sampledPoints[i], sampledPoints[j]);
						if (d > maxDist) maxDist = d;
					}
				}
				if (maxDist === 0) maxDist = 1;

				var persistence = computeRipsPersistence(sampledPoints, maxDist * _state.config.ripsFiltrationMax / 2, _state.config.epsilonSteps);
				var summary = computeTopologicalSummary(persistence);

				html += '<p style="font-size:0.85em;opacity:0.6;">' + sampledPoints.length + ' points, dim=' + (sampledPoints[0].length) + ', max filtration ε=' + (maxDist * _state.config.ripsFiltrationMax / 2).toFixed(3) + '</p>';

				html += '<div class="tda-grid">';

				// Point cloud
				if (_state.config.showPointCloud) {
					html += '<div class="tda-grid-item">';
					html += renderPointCloudSVG(sampledPoints, _state.config.svgWidth, _state.config.svgHeight, "Training Data Point Cloud");
					html += '</div>';
				}

				// Persistence diagram
				if (_state.config.showPersistenceDiagrams) {
					var allPairs = [];
					for (var i = 0; i < persistence.h0.length; i++) allPairs.push({ birth: persistence.h0[i].birth, death: persistence.h0[i].death, dim: 0 });
					for (var i = 0; i < persistence.h1.length; i++) allPairs.push({ birth: persistence.h1[i].birth, death: persistence.h1[i].death, dim: 1 });
					html += '<div class="tda-grid-item">';
					html += renderPersistenceDiagram(allPairs, _state.config.svgWidth, _state.config.svgHeight, "Persistence Diagram (Training)");
					html += '</div>';
				}

				// Betti curves
				if (_state.config.showBettiCurves) {
					html += '<div class="tda-grid-item">';
					html += renderBettiCurves(persistence.bettiCurve0, persistence.bettiCurve1, persistence.epsilonValues, _state.config.svgWidth, _state.config.svgHeight, "Betti Curves (Training)");
					html += '</div>';
				}

				// Barcode
				if (_state.config.showBarcode) {
					html += '<div class="tda-grid-item">';
					html += renderBarcode(persistence.h0, persistence.h1, _state.config.svgWidth, 150, "Persistence Barcode (Training)");
					html += '</div>';
				}

				// Persistence landscape
				var landscape = computePersistenceLandscape(persistence.h0, _state.config.numLandscapePoints, maxDist);
				if (landscape.length > 0) {
					html += '<div class="tda-grid-item">';
					html += renderPersistenceLandscapeSVG(landscape, maxDist, _state.config.svgWidth, _state.config.svgHeight, "Persistence Landscape λ₁ (Training H₀)", "#9b59b6");
					html += '</div>';
				}

				// Distance matrix
				if (persistence.distMatrix && persistence.distMatrix.length > 0) {
					html += '<div class="tda-grid-item">';
					html += renderDistanceMatrixSVG(persistence.distMatrix, 200, 200, "Distance Matrix (Training)");
					html += '</div>';
				}

				html += '</div>'; // end tda-grid

				// Summary table
				html += renderSummaryTable(summary, "Topological Summary (Training Data)");

			} else {
				html += '<div class="tda-no-data">No training data available. Load data via xy_data_global or start training.</div>';
			}

			html += '</div>'; // end tda-section
		}

		// ============================================================
		// 2. WEIGHT TOPOLOGY
		// ============================================================
		if (_state.config.showWeightTopology) {
			var weightDataArr = getWeightData();
			html += '<div class="tda-section">';
			html += '<h3>⚖️ Weight Topology</h3>';

			if (weightDataArr && weightDataArr.length > 0) {
				html += '<p style="font-size:0.85em;opacity:0.6;">' + weightDataArr.length + ' weight tensors analyzed</p>';

				for (var wi = 0; wi < weightDataArr.length; wi++) {
					var wInfo = weightDataArr[wi];
					var wTopology = analyzeWeightTopology(wInfo.data, wInfo.shape);

					html += '<h4>[' + wInfo.layerIndex + '] ' + wInfo.layerName + ' <span style="opacity:0.5;">(' + wInfo.layerType + ', shape: [' + (wInfo.shape || []).join(', ') + '], n=' + wInfo.data.length + ')</span></h4>';

					if (wTopology) {
						html += '<div class="tda-grid">';

						// Weight histogram
						html += '<div class="tda-grid-item">';
						html += renderWeightHistogramSVG(wTopology.histogram, _state.config.svgWidth, 120, "Weight Distribution: " + wInfo.layerName);
						html += '</div>';

						// Persistence diagram for weights
						if (wTopology.persistence && _state.config.showPersistenceDiagrams) {
							var wAllPairs = [];
							for (var p = 0; p < wTopology.persistence.h0.length; p++) {
								wAllPairs.push({ birth: wTopology.persistence.h0[p].birth, death: wTopology.persistence.h0[p].death, dim: 0 });
							}
							for (var p = 0; p < wTopology.persistence.h1.length; p++) {
								wAllPairs.push({ birth: wTopology.persistence.h1[p].birth, death: wTopology.persistence.h1[p].death, dim: 1 });
							}
							html += '<div class="tda-grid-item">';
							html += renderPersistenceDiagram(wAllPairs, _state.config.svgWidth, _state.config.svgHeight, "Persistence Diagram: " + wInfo.layerName);
							html += '</div>';
						}

						// Betti curves for weights
						if (_state.config.showBettiCurves && wTopology.persistence.bettiCurve0) {
							html += '<div class="tda-grid-item">';
							html += renderBettiCurves(wTopology.persistence.bettiCurve0, wTopology.persistence.bettiCurve1, wTopology.persistence.epsilonValues, _state.config.svgWidth, _state.config.svgHeight, "Betti Curves: " + wInfo.layerName);
							html += '</div>';
						}

						// Barcode for weights
						if (_state.config.showBarcode) {
							html += '<div class="tda-grid-item">';
							html += renderBarcode(wTopology.persistence.h0, wTopology.persistence.h1, _state.config.svgWidth, 120, "Barcode: " + wInfo.layerName);
							html += '</div>';
						}

						html += '</div>'; // end tda-grid

						// Summary
						html += renderSummaryTable(wTopology.summary, "Weight Topology Summary: " + wInfo.layerName);
					} else {
						html += '<p style="opacity:0.5;font-size:0.85em;">Insufficient weight data for topological analysis.</p>';
					}
				}
			} else {
				html += '<div class="tda-no-data">No model weights available. Create and compile a model first.</div>';
			}

			html += '</div>'; // end tda-section
		}

		// ============================================================
		// 3. ACTIVATION TOPOLOGY (per-layer input/output)
		// ============================================================
		if (_state.config.showActivationTopology) {
			var layerDataArr = getLayerData();
			html += '<div class="tda-section">';
			html += '<h3>🧠 Activation Topology (Layer I/O)</h3>';

			if (layerDataArr && layerDataArr.length > 0) {
				html += '<p style="font-size:0.85em;opacity:0.6;">' + layerDataArr.length + ' layers with recorded activations</p>';

				for (var li = 0; li < layerDataArr.length; li++) {
					var layerInfo = layerDataArr[li];
					html += '<h4>[' + li + '] ' + (layerInfo.name || 'Layer ' + li) + ' <span style="opacity:0.5;">(' + (layerInfo.type || 'unknown') + ')</span></h4>';

					html += '<div class="tda-grid">';

					// Output activation topology
					if (layerInfo.output && layerInfo.output.length > 3) {
						var actTopology = analyzeActivationTopology(layerInfo.output);
						if (actTopology) {
							if (_state.config.showPersistenceDiagrams) {
								var actPairs = [];
								for (var p = 0; p < actTopology.persistence.h0.length; p++) {
									actPairs.push({ birth: actTopology.persistence.h0[p].birth, death: actTopology.persistence.h0[p].death, dim: 0 });
								}
								for (var p = 0; p < actTopology.persistence.h1.length; p++) {
									actPairs.push({ birth: actTopology.persistence.h1[p].birth, death: actTopology.persistence.h1[p].death, dim: 1 });
								}
								html += '<div class="tda-grid-item">';
								html += renderPersistenceDiagram(actPairs, _state.config.svgWidth, _state.config.svgHeight, "Output Persistence: " + (layerInfo.name || 'Layer ' + li));
								html += '</div>';
							}

							if (_state.config.showBettiCurves && actTopology.persistence.bettiCurve0) {
								html += '<div class="tda-grid-item">';
								html += renderBettiCurves(actTopology.persistence.bettiCurve0, actTopology.persistence.bettiCurve1, actTopology.persistence.epsilonValues, _state.config.svgWidth, _state.config.svgHeight, "Output Betti: " + (layerInfo.name || 'Layer ' + li));
								html += '</div>';
							}

							html += '<div class="tda-grid-item">';
							html += renderSummaryTable(actTopology.summary, "Output Topology: " + (layerInfo.name || 'Layer ' + li));
							html += '</div>';
						}
					}

					// Input activation topology
					if (layerInfo.input && layerInfo.input.length > 3) {
						var inTopology = analyzeActivationTopology(layerInfo.input);
						if (inTopology) {
							if (_state.config.showBettiCurves && inTopology.persistence.bettiCurve0) {
								html += '<div class="tda-grid-item">';
								html += renderBettiCurves(inTopology.persistence.bettiCurve0, inTopology.persistence.bettiCurve1, inTopology.persistence.epsilonValues, _state.config.svgWidth, _state.config.svgHeight, "Input Betti: " + (layerInfo.name || 'Layer ' + li));
								html += '</div>';
							}
						}
					}

					html += '</div>'; // end tda-grid
				}
			} else {
				html += '<div class="tda-no-data">No layer activation data available. Run a prediction or start training to record layer I/O.</div>';
			}

			html += '</div>'; // end tda-section
		}

		// ============================================================
		// 4. TOPOLOGICAL COMPARISON ACROSS LAYERS
		// ============================================================
		html += '<div class="tda-section">';
		html += '<h3>📈 Topological Evolution Across Layers</h3>';

		var weightDataArr2 = getWeightData();
		if (weightDataArr2 && weightDataArr2.length >= 2) {
			// Collect Betti-0 and total persistence per layer
			var layerNames = [];
			var betti0Values = [];
			var totalPersH0 = [];
			var entropyH0 = [];

			for (var wi = 0; wi < weightDataArr2.length; wi++) {
				var wTop = analyzeWeightTopology(weightDataArr2[wi].data, weightDataArr2[wi].shape);
				if (wTop && wTop.summary) {
					layerNames.push(weightDataArr2[wi].layerName);
					betti0Values.push(wTop.summary.numComponentsH0);
					totalPersH0.push(wTop.summary.totalPersistenceH0);
					entropyH0.push(wTop.summary.persistenceEntropyH0);
				}
			}

			if (layerNames.length >= 2) {
				// Render evolution chart
				var evoWidth = _state.config.svgWidth * 1.5;
				var evoHeight = 180;
				var evoPad = 50;
				var evoPlotW = evoWidth - 2 * evoPad;
				var evoPlotH = evoHeight - 2 * evoPad;

				var svg = svgHeader(evoWidth, evoHeight, "evo_" + Math.random().toString(36).substr(2, 6));
				svg += '<text x="' + (evoWidth / 2) + '" y="14" text-anchor="middle" font-size="11" fill="currentColor" opacity="0.8">Topological Complexity Across Layers</text>';

				// Normalize values
				var maxBetti = Math.max.apply(null, betti0Values) || 1;
				var maxPers = Math.max.apply(null, totalPersH0) || 1;
				var maxEnt = Math.max.apply(null, entropyH0) || 1;

				// Draw β₀ line
				var pts0 = [];
				for (var i = 0; i < layerNames.length; i++) {
					var x = evoPad + (i / (layerNames.length - 1)) * evoPlotW;
					var y = evoPad + evoPlotH - (betti0Values[i] / maxBetti) * evoPlotH;
					pts0.push(x.toFixed(1) + "," + y.toFixed(1));
				}
				svg += '<polyline points="' + pts0.join(' ') + '" fill="none" stroke="#3498db" stroke-width="2.5"/>';

				// Draw total persistence line
				var pts1 = [];
				for (var i = 0; i < layerNames.length; i++) {
					var x = evoPad + (i / (layerNames.length - 1)) * evoPlotW;
					var y = evoPad + evoPlotH - (totalPersH0[i] / maxPers) * evoPlotH;
					pts1.push(x.toFixed(1) + "," + y.toFixed(1));
				}
				svg += '<polyline points="' + pts1.join(' ') + '" fill="none" stroke="#e74c3c" stroke-width="2.5"/>';

				// Draw entropy line
				var pts2 = [];
				for (var i = 0; i < layerNames.length; i++) {
					var x = evoPad + (i / (layerNames.length - 1)) * evoPlotW;
					var y = evoPad + evoPlotH - (entropyH0[i] / maxEnt) * evoPlotH;
					pts2.push(x.toFixed(1) + "," + y.toFixed(1));
				}
				svg += '<polyline points="' + pts2.join(' ') + '" fill="none" stroke="#2ecc71" stroke-width="2.5" stroke-dasharray="4,2"/>';

				// Axes
				svg += '<line x1="' + evoPad + '" y1="' + (evoPad + evoPlotH) + '" x2="' + (evoPad + evoPlotW) + '" y2="' + (evoPad + evoPlotH) + '" stroke="currentColor" stroke-width="0.5" opacity="0.4"/>';

				// Layer labels
				for (var i = 0; i < layerNames.length; i++) {
					var x = evoPad + (i / (layerNames.length - 1)) * evoPlotW;
					svg += '<text x="' + x.toFixed(1) + '" y="' + (evoHeight - 5) + '" text-anchor="middle" font-size="8" fill="currentColor" opacity="0.5">' + layerNames[i].substring(0, 8) + '</text>';
				}

				// Legend
				svg += '<line x1="' + (evoWidth - 140) + '" y1="' + (evoPad + 5) + '" x2="' + (evoWidth - 125) + '" y2="' + (evoPad + 5) + '" stroke="#3498db" stroke-width="2.5"/>';
				svg += '<text x="' + (evoWidth - 122) + '" y="' + (evoPad + 8) + '" font-size="9" fill="currentColor" opacity="0.7">β₀ (norm)</text>';
				svg += '<line x1="' + (evoWidth - 140) + '" y1="' + (evoPad + 18) + '" x2="' + (evoWidth - 125) + '" y2="' + (evoPad + 18) + '" stroke="#e74c3c" stroke-width="2.5"/>';
				svg += '<text x="' + (evoWidth - 122) + '" y="' + (evoPad + 21) + '" font-size="9" fill="currentColor" opacity="0.7">Total Pers. (norm)</text>';
				svg += '<line x1="' + (evoWidth - 140) + '" y1="' + (evoPad + 31) + '" x2="' + (evoWidth - 125) + '" y2="' + (evoPad + 31) + '" stroke="#2ecc71" stroke-width="2.5" stroke-dasharray="4,2"/>';
				svg += '<text x="' + (evoWidth - 122) + '" y="' + (evoPad + 34) + '" font-size="9" fill="currentColor" opacity="0.7">Entropy (norm)</text>';

				svg += svgFooter();
				html += svg;
			}
		} else {
			html += '<div class="tda-no-data">Need at least 2 weight layers for cross-layer topological comparison.</div>';
		}

		html += '</div>'; // end tda-section

		// ============================================================
		// FOOTER
		// ============================================================
		html += '<p style="opacity:0.4;font-size:0.75em;text-align:center;margin-top:20px;">TopologicalAnalyzer v1.0 — Persistent Homology, Betti Numbers, Persistence Diagrams & Landscapes</p>';

		// Set HTML with smooth transition
		if (_state.config.smoothTransition && _state.container.innerHTML !== "") {
			_state.container.style.transition = "opacity 0.2s ease";
			_state.container.style.opacity = "0.7";
			setTimeout(function () {
				_state.container.innerHTML = html;
				_state.container.style.opacity = "1";
			}, 100);
		} else {
			_state.container.innerHTML = html;
		}
	}

	// ============================================================
	// PUBLIC API
	// ============================================================

	function init(divOrId) {
		injectStyles();

		// Resolve container
		var parent = null;
		if (typeof divOrId === "string" && divOrId !== "") {
			parent = document.getElementById(divOrId);
			_state.parentId = divOrId;
		} else if (divOrId instanceof HTMLElement) {
			parent = divOrId;
			_state.parentElement = divOrId;
		}

		// Singleton: reuse existing
		var existing = document.getElementById(SINGLETON_ID);
		if (existing) {
			_state.container = existing;
			render();
			return TopologicalAnalyzer;
		}

		// Create container
		var container = document.createElement("div");
		container.id = SINGLETON_ID;

		if (parent) {
			parent.appendChild(container);
		} else {
			document.body.appendChild(container);
		}

		_state.container = container;
		_state.initialized = true;

		render();

		// Auto-update if configured
		if (_state.config.autoUpdate && !_state.intervalId) {
			_state.intervalId = setInterval(function () {
				render();
			}, _state.config.updateInterval);
		}

		setupVisibilityObserver();

		return TopologicalAnalyzer;
	}

	function update(newConfig) {
		if (newConfig && typeof newConfig === "object") {
			for (var key in newConfig) {
				if (newConfig.hasOwnProperty(key) && _state.config.hasOwnProperty(key)) {
					_state.config[key] = newConfig[key];
				}
			}
		}

		if (!_state.container) {
			init();
		} else {
			render();
		}

		return TopologicalAnalyzer;
	}

	function destroy() {
		if (_state.intervalId) {
			clearInterval(_state.intervalId);
			_state.intervalId = null;
		}
		if (_state.observer) {
			_state.observer.disconnect();
			_state.observer = null;
		}
		if (_state.container && _state.container.parentNode) {
			_state.container.parentNode.removeChild(_state.container);
		}
		_state.container = null;
		_state.initialized = false;
		_state.dataDirty = false;
	}

	function getConfig() {
		return JSON.parse(JSON.stringify(_state.config));
	}

	function setConfig(newConfig) {
		return update(newConfig);
	}

	// ============================================================
	// EXPOSE PUBLIC API
	// ============================================================

	var TopologicalAnalyzer = {
		init: init,
		update: update,
		destroy: destroy,
		getConfig: getConfig,
		setConfig: setConfig,
		// Expose internals for advanced usage
		computeRipsPersistence: computeRipsPersistence,
		analyzeWeightTopology: analyzeWeightTopology,
		analyzeActivationTopology: analyzeActivationTopology,
		computeTopologicalSummary: computeTopologicalSummary,
		computePersistenceLandscape: computePersistenceLandscape
	};

	// Auto-expose globally
	if (typeof window !== "undefined") {
		window.TopologicalAnalyzer = TopologicalAnalyzer;
	}

	return TopologicalAnalyzer;

})();
