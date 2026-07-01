"use strict";

// ============================================================
// DIMENSIONALITY RIVER - t-SNE/UMAP-style per-layer visualization
// Reduces each layer's activations to 2D and shows how clusters
// evolve through the network.
// ============================================================

var DimensionalityRiver = (function () {

	var _SINGLETON_ID = "dimriver_singleton_container";

	var _state = {
		container: null,
		autoUpdateTimer: null,
		perplexity: 30,
		iterations: 300,
		learningRate: 10,
		maxPointsPerLayer: 200,
		colorBy: "label", // "label" or "index"
		lastResult: null
	};

	// ============================================================
	// CONTAINER MANAGEMENT
	// ============================================================

	function _getOrCreateContainer(divOrId) {
		var container = null;

		if (typeof divOrId === "string" && divOrId !== "") {
			container = document.getElementById(divOrId);
			if (container) {
				_state.container = container;
				return container;
			}
		} else if (divOrId instanceof HTMLElement) {
			_state.container = divOrId;
			return divOrId;
		}

		var existing = document.getElementById(_SINGLETON_ID);
		if (existing) {
			_state.container = existing;
			return existing;
		}

		container = document.createElement("div");
		container.id = _SINGLETON_ID;
		document.body.appendChild(container);
		_state.container = container;
		return container;
	}

	// ============================================================
	// t-SNE IMPLEMENTATION (Barnes-Hut approximation simplified)
	// ============================================================

    function _computePairwiseDistances(points) {
        var n = points.length;
        var dist = [];
        for (var i = 0; i < n; i++) {
            dist[i] = new Float64Array(n);
        }
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
			var entropy = Math.log(sum);
			// Add weighted sum for entropy
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
			for (var j = 0; j < n; j++) {
				P[i][j] /= sum;
			}
		}
		// Symmetrize
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

        // Clamp perplexity to valid range
        perplexity = Math.max(2, Math.min(perplexity, Math.floor((n - 1) / 3)));

        var distances = _computePairwiseDistances(points);
        var P = _computeP(distances, perplexity);

        // Initialize Y randomly
        var Y = [];
        for (var i = 0; i < n; i++) {
            Y[i] = [(Math.random() - 0.5) * 0.01, (Math.random() - 0.5) * 0.01];
        }

        var gains = [];
        var prevGrad = [];
        for (var i = 0; i < n; i++) {
            gains[i] = [1, 1];
            prevGrad[i] = [0, 0];
        }

        // Gradient descent
        for (var iter = 0; iter < iterations; iter++) {
            // Compute Q (Student-t distribution)
            var qSum = 0;
            var qMatrix = [];
            for (var i = 0; i < n; i++) {
                qMatrix[i] = new Float64Array(n);
            }
            for (var i = 0; i < n; i++) {
                for (var j = i + 1; j < n; j++) {
                    var dx = Y[i][0] - Y[j][0];
                    var dy = Y[i][1] - Y[j][1];
                    var q = 1.0 / (1.0 + dx * dx + dy * dy);
                    qMatrix[i][j] = q;
                    qMatrix[j][i] = q;
                    qSum += 2 * q;
                }
            }
            if (qSum === 0) qSum = 1e-10;

            // Compute gradients
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

            // Update with momentum
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

            // Center
            var cx = 0, cy = 0;
            for (var i = 0; i < n; i++) { cx += Y[i][0]; cy += Y[i][1]; }
            cx /= n; cy /= n;
            for (var i = 0; i < n; i++) { Y[i][0] -= cx; Y[i][1] -= cy; }
        }

        return Y;
    }


	// ============================================================
	// DATA EXTRACTION
	// ============================================================

	function _extractLayerActivations() {
		try {
			if (typeof layerIOStats === "undefined" || !layerIOStats || !layerIOStats.records || layerIOStats.records.length === 0) return null;
			var latestRecord = layerIOStats.records[layerIOStats.records.length - 1];
			if (!latestRecord || !latestRecord.layers || latestRecord.layers.length === 0) return null;

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
		} catch (e) { return null; }
	}

	function _reshapeToPoints(data, shape) {
		if (!data || data.length === 0) return null;
		var points = [];

		if (!shape || shape.length < 2) {
			// Takens embedding
			var windowSize = 8;
			for (var i = 0; i <= data.length - windowSize; i++) {
				var point = [];
				for (var j = 0; j < windowSize; j++) {
					var v = data[i + j];
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

		// Subsample
		if (points.length > _state.maxPointsPerLayer) {
			var step = Math.ceil(points.length / _state.maxPointsPerLayer);
			var sampled = [];
			for (var i = 0; i < points.length; i += step) {
				sampled.push(points[i]);
			}
			points = sampled;
		}

		return points.length >= 3 ? points : null;
	}

	function _getLabelsForPoints(numPoints) {
		// Try to get labels from global data
		try {
			if (typeof xy_data_global !== "undefined" && xy_data_global && xy_data_global.y) {
				var yData;
				if (xy_data_global.y.dataSync) yData = Array.from(xy_data_global.y.dataSync());
				else if (Array.isArray(xy_data_global.y)) yData = xy_data_global.y.flat(Infinity);
				else return null;

				// If one-hot, argmax
				var yShape = xy_data_global.y.shape || null;
				if (yShape && yShape.length === 2 && yShape[1] > 1) {
					var numClasses = yShape[1];
					var decoded = [];
					for (var i = 0; i < yData.length; i += numClasses) {
						var maxIdx = 0, maxVal = -Infinity;
						for (var c = 0; c < numClasses; c++) {
							if (yData[i + c] > maxVal) { maxVal = yData[i + c]; maxIdx = c; }
						}
						decoded.push(maxIdx);
					}
					// Subsample to match points
					if (decoded.length >= numPoints) {
						var step = Math.ceil(decoded.length / numPoints);
						var result = [];
						for (var i = 0; i < numPoints; i++) {
							result.push(decoded[Math.min(i * step, decoded.length - 1)]);
						}
						return result;
					}
					return decoded.slice(0, numPoints);
				}

				// Flat labels
				if (yData.length >= numPoints) {
					var step = Math.ceil(yData.length / numPoints);
					var result = [];
					for (var i = 0; i < numPoints; i++) {
						result.push(Math.round(yData[Math.min(i * step, yData.length - 1)]));
					}
					return result;
				}
			}
		} catch (e) { }
		return null;
	}

	// ============================================================
	// ANALYSIS
	// ============================================================

	function analyze() {
		var layers = _extractLayerActivations();
		if (!layers) return { error: "dimriver_no_data", layers: [] };

		var results = [];
		for (var i = 0; i < layers.length; i++) {
			var points = _reshapeToPoints(layers[i].data, layers[i].shape);
			if (!points) continue;

			var embedded = _tsne(points, {
				perplexity: Math.min(_state.perplexity, Math.floor(points.length / 3)),
				iterations: _state.iterations,
				learningRate: _state.learningRate
			});

			var pointLabels = _getLabelsForPoints(embedded.length);

			results.push({
				name: layers[i].name,
				type: layers[i].type,
				index: layers[i].index,
				numPoints: embedded.length,
				originalDim: points[0] ? points[0].length : 0,
				embedded: embedded,
				labels: pointLabels
			});
		}

		var output = {
			layers: results,
			timestamp: Date.now(),
			error: results.length === 0 ? "dimriver_no_layers" : null
		};

		_state.lastResult = output;
		return output;
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

		var margin = 24;
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

		// Background grid
		for (var g = 0; g <= 4; g++) {
			var gx = margin + (g / 4) * plotW;
			var gy = margin + (g / 4) * plotH;
			svg += "<line x1='" + gx + "' y1='" + margin + "' x2='" + gx + "' y2='" + (height - margin) + "' stroke='currentColor' stroke-width='0.3' opacity='0.08'/>";
			svg += "<line x1='" + margin + "' y1='" + gy + "' x2='" + (width - margin) + "' y2='" + gy + "' stroke='currentColor' stroke-width='0.3' opacity='0.08'/>";
		}

		// Points
		for (var i = 0; i < embedded.length; i++) {
			var x = margin + ((embedded[i][0] - minX) / rangeX) * plotW;
			var y = margin + ((embedded[i][1] - minY) / rangeY) * plotH;

			var color = "#8e44ad";
			if (labels && labels[i] !== undefined && labels[i] !== null) {
				color = _COLORS[Math.abs(labels[i]) % _COLORS.length];
			}

			svg += "<circle cx='" + x.toFixed(1) + "' cy='" + y.toFixed(1) + "' r='3' fill='" + color + "' opacity='0.7' style='transition: r 0.15s;'>";
			svg += "<title>" + (labels ? "class " + labels[i] : "point " + i) + "</title>";
			svg += "</circle>";
		}

		// Axes labels
		svg += "<text x='" + (width / 2) + "' y='" + (height - 4) + "' text-anchor='middle' font-size='9' fill='currentColor' opacity='0.4'>t-SNE dim 1</text>";
		svg += "<text x='6' y='" + (height / 2) + "' text-anchor='middle' font-size='9' fill='currentColor' opacity='0.4' transform='rotate(-90, 6, " + (height / 2) + ")'>t-SNE dim 2</text>";

		svg += "</svg>";
		return svg;
	}

	function _riverOverviewSVG(results) {
		if (!results || results.length < 2) return "";

		var width = 700, height = 120;
		var margin = { left: 40, right: 20, top: 20, bottom: 30 };
		var plotW = width - margin.left - margin.right;
		var plotH = height - margin.top - margin.bottom;

		var svg = "<svg class='dimriver_svg' width='100%' viewBox='0 0 " + width + " " + height + "'>";

		// For each layer, compute cluster spread (variance of embedded points)
		var spreads = [];
		for (var l = 0; l < results.length; l++) {
			var emb = results[l].embedded;
			var varX = 0, varY = 0, meanX = 0, meanY = 0;
			for (var i = 0; i < emb.length; i++) { meanX += emb[i][0]; meanY += emb[i][1]; }
			meanX /= emb.length; meanY /= emb.length;
			for (var i = 0; i < emb.length; i++) {
				varX += (emb[i][0] - meanX) * (emb[i][0] - meanX);
				varY += (emb[i][1] - meanY) * (emb[i][1] - meanY);
			}
			spreads.push(Math.sqrt((varX + varY) / emb.length));
		}

		var maxSpread = Math.max.apply(null, spreads) || 1;

		// Draw river
		var path = "M";
		var pathBottom = "";
		for (var l = 0; l < results.length; l++) {
			var x = margin.left + (l / (results.length - 1)) * plotW;
			var halfH = (spreads[l] / maxSpread) * (plotH / 2);
			var cy = margin.top + plotH / 2;
			path += (l === 0 ? "" : " L") + x.toFixed(1) + " " + (cy - halfH).toFixed(1);
			pathBottom = x.toFixed(1) + " " + (cy + halfH).toFixed(1) + (pathBottom ? " L" + pathBottom : "");
		}
		path += " L" + pathBottom + " Z";
		svg += "<path d='" + path + "' fill='rgba(52,152,219,0.15)' stroke='#3498db' stroke-width='1.5'/>";

		// Layer markers
		for (var l = 0; l < results.length; l++) {
			var x = margin.left + (l / (results.length - 1)) * plotW;
			var cy = margin.top + plotH / 2;
			svg += "<circle cx='" + x.toFixed(1) + "' cy='" + cy + "' r='4' fill='#3498db' opacity='0.8'/>";
			svg += "<text x='" + x.toFixed(1) + "' y='" + (height - 8) + "' text-anchor='middle' font-size='7' fill='currentColor' opacity='0.5'>" + results[l].name.substring(0, 10) + "</text>";
		}

		svg += "<text x='" + (margin.left - 5) + "' y='" + (margin.top + plotH / 2 + 4) + "' text-anchor='end' font-size='8' fill='currentColor' opacity='0.4'><tspan class='TRANSLATEME_dimriver_spread'></tspan></text>";

		svg += "</svg>";
		return svg;
	}

	// ============================================================
	// MAIN RENDER
	// ============================================================

	function render(divOrId) {
		var container = _getOrCreateContainer(divOrId);
		_injectStyles();

		var result = analyze();

		var html = "<div class='dimriver_container'>";

		// Header
		html += "<div class='dimriver_header'>";
		html += "<h2><span class='TRANSLATEME_dimriver_title'></span></h2>";
		html += "<div class='dimriver_controls'>";
		html += "<button class='dimriver_btn' onclick='DimensionalityRiver.refresh()' title='Refresh'>⟳</button>";
		html += "<button class='dimriver_btn " + (_state.autoUpdateTimer ? "dimriver_btn_active" : "") + "' onclick='DimensionalityRiver.toggleAutoUpdate()'>" + (_state.autoUpdateTimer ? "⏸" : "▶") + "</button>";
		html += "</div></div>";

		html += "<p class='dimriver_subtitle'><span class='TRANSLATEME_dimriver_subtitle'></span> | " + new Date().toLocaleTimeString() + "</p>";

		// Error
		if (result.error) {
			html += "<div class='dimriver_error'><span class='TRANSLATEME_" + result.error + "'></span></div>";
			html += "<p style='text-align:center; opacity:0.5; font-size:0.85em;'><span class='TRANSLATEME_dimriver_hint_train'></span></p>";
			html += "</div>";
			container.innerHTML = html;
			_triggerTranslations();
			return container;
		}

		// Sliders
		html += "<div class='dimriver_sliders'>";
		html += _renderSlider("perplexity", "dimriver_perplexity", 5, 100, _state.perplexity, 5);
		html += _renderSlider("iterations", "dimriver_iterations", 50, 1000, _state.iterations, 50);
		html += _renderSlider("maxPointsPerLayer", "dimriver_max_points", 30, 500, _state.maxPointsPerLayer, 10);
		html += "</div>";

		// River overview
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
			html += " <span class='dimriver_badge'>" + layer.type + " | " + layer.numPoints + " pts | dim=" + layer.originalDim + "</span>";
			html += "</div>";
			html += _scatterSVG(layer, 280, 280);
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
		container.innerHTML = html;

		_bindSliders();
		_triggerTranslations();
		return container;
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
			try { render(_state.container); } catch (e) { }
		}, intervalMs || 5000);
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
			".dimriver_grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 14px; }",
			".dimriver_card { border: 2px solid rgba(128,128,128,0.15); border-radius: 10px; padding: 12px; background: rgba(128,128,128,0.02); transition: box-shadow 0.3s; }",
			".dimriver_card:hover { box-shadow: 0 3px 14px rgba(0,0,0,0.07); }",
			".dimriver_card_header { display: flex; align-items: center; gap: 8px; margin-bottom: 8px; flex-wrap: wrap; }",
			".dimriver_badge { font-size: 0.7em; opacity: 0.55; background: rgba(128,128,128,0.08); padding: 2px 8px; border-radius: 4px; }",
			".dimriver_legend { display: flex; gap: 12px; margin: 12px 0; font-size: 0.78em; opacity: 0.7; flex-wrap: wrap; }",
			".dimriver_legend_item { display: flex; align-items: center; gap: 4px; }",
			".dimriver_legend_dot { width: 9px; height: 9px; border-radius: 50%; }",
			".dimriver_sliders { border: 1px solid rgba(128,128,128,0.15); border-radius: 8px; padding: 12px; margin-bottom: 14px; background: rgba(128,128,128,0.02); display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 10px; }",
			".dimriver_slider_item { display: flex; flex-direction: column; gap: 3px; }",
			".dimriver_slider_label { font-size: 0.72em; opacity: 0.6; }",
			".dimriver_slider_val { font-weight: bold; }",
			".dimriver_slider_input { width: 100%; cursor: pointer; accent-color: #9b59b6; }",
			".dimriver_error { padding: 24px; text-align: center; opacity: 0.5; font-size: 1.05em; }",
			".dimriver_empty { text-align: center; opacity: 0.3; padding: 20px; font-size: 1.5em; }",
			".dimriver_svg { display: block; }"
		].join("\n");
		document.head.appendChild(style);
	}

	// ============================================================
	// PUBLIC API
	// ============================================================

	return {
		render: render,
		analyze: analyze,
		refresh: refresh,
		startAutoUpdate: startAutoUpdate,
		stopAutoUpdate: stopAutoUpdate,
		toggleAutoUpdate: toggleAutoUpdate,
		getLastResult: function () { return _state.lastResult; },
		getState: function () { return _state; },
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

/**
 * Renders the Dimensionality River visualization.
 * @param {string|HTMLElement} [divOrId] - A div ID string, an HTMLElement, or omit to auto-append.
 * @returns {HTMLElement} The container element.
 *
 * Usage:
 *   dimensionalityRiver();              // appends to body
 *   dimensionalityRiver("my_div");      // renders into #my_div
 *   dimensionalityRiver(someElement);   // renders into the given element
 */

function dimensionalityRiver(divOrId) {
	return DimensionalityRiver.render(divOrId);
}
