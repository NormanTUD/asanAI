"use strict";

// ============================================================
// LOSS LANDSCAPE 3D PLOTTER (Plotly.js version)
// For models with exactly 1 Dense layer, 1 neuron, input shape [1]
// Singleton: only one instance on the page at a time.
// ============================================================

var LossLandscape = (function () {

	var _SINGLETON_ID = "loss_landscape_singleton";
	var _state = {
		container: null,
		plotDiv: null,
		intervalId: null,
		active: false,
		history: [],
		gridSize: 40,
		wRange: [-3, 3],
		bRange: [-3, 3],
		cachedX: null,
		cachedY: null,
		lastEligible: false,
		debugMsg: "Initializing...",
		plotlyInitialized: false,
		lastPlotHash: ""
	};

	// ============================================================
	// MODEL DETECTION
	// ============================================================

	function _isEligibleModel() {
		if (typeof model === "undefined" || !model) return false;
		if (!model.layers || !Array.isArray(model.layers)) return false;
		if (model.layers.length !== 1) return false;

		var layer = model.layers[0];
		var className = "";
		try { className = layer.getClassName ? layer.getClassName() : ""; } catch (e) { return false; }
		if (className.toLowerCase() !== "dense") return false;

		var config = layer.getConfig ? layer.getConfig() : {};
		if (config.units !== 1) return false;

		var inputShape = null;
		try { inputShape = model.input.shape; } catch (e) { return false; }
		if (!inputShape || inputShape.length !== 2) return false;
		if (inputShape[1] !== 1) return false;

		return true;
	}

	// ============================================================
	// DATA INTERCEPTION - robust against disposed tensors
	// ============================================================

	function _safeExtract(t) {
		if (!t) return null;
		try {
			if (t && typeof t === "object" && typeof t.dataSync === "function") {
				// Check if tensor is disposed
				if (t.isDisposed) return null;
				return Array.from(t.dataSync());
			}
			if (Array.isArray(t)) {
				return t.flat(Infinity).map(Number);
			}
			if (t && t.buffer && typeof t.length === "number") {
				return Array.from(t);
			}
		} catch (e) {
			return null;
		}
		return null;
	}

	function _syncData() {
		// Strategy 1: xy_data_global (set in train.js run_neural_network)
		if (typeof xy_data_global !== "undefined" && xy_data_global !== null && typeof xy_data_global === "object") {
			var xT = xy_data_global.x || xy_data_global["x"];
			var yT = xy_data_global.y || xy_data_global["y"];

			if (xT && yT) {
				var xArr = _safeExtract(xT);
				var yArr = _safeExtract(yT);

				if (xArr && yArr && xArr.length > 0 && yArr.length > 0) {
					_state.cachedX = xArr;
					_state.cachedY = yArr;
					_state.debugMsg = "Data from xy_data_global: " + xArr.length + " samples";
					return true;
				} else {
					_state.debugMsg = "xy_data_global found but extraction failed (disposed?)";
				}
			} else {
				_state.debugMsg = "xy_data_global exists but .x or .y is falsy";
			}
		} else {
			_state.debugMsg = "xy_data_global: " + (typeof xy_data_global === "undefined" ? "undefined" : "null");
		}

		// Strategy 2: csv_global_x / csv_global_y
		if (typeof csv_global_x !== "undefined" && csv_global_x && typeof csv_global_y !== "undefined" && csv_global_y) {
			var cx = _safeExtract(csv_global_x);
			var cy = _safeExtract(csv_global_y);
			if (cx && cy && cx.length > 0) {
				_state.cachedX = cx;
				_state.cachedY = cy;
				_state.debugMsg = "Data from csv_global_x/y: " + cx.length + " samples";
				return true;
			}
		}

		// Strategy 3: global_x / global_y
		if (typeof global_x !== "undefined" && global_x && typeof global_y !== "undefined" && global_y) {
			var gx = _safeExtract(global_x);
			var gy = _safeExtract(global_y);
			if (gx && gy && gx.length > 0) {
				_state.cachedX = gx;
				_state.cachedY = gy;
				_state.debugMsg = "Data from global_x/y: " + gx.length + " samples";
				return true;
			}
		}

		// Keep using cached data if we have it
		return _state.cachedX !== null && _state.cachedX.length > 0;
	}

	// ============================================================
	// LOSS COMPUTATION
	// ============================================================

	function _computeLoss(w, b, xData, yData) {
		var n = Math.min(xData.length, yData.length);
		if (n === 0) return 0;
		var sumSqErr = 0;
		for (var i = 0; i < n; i++) {
			var pred = w * xData[i] + b;
			var err = pred - yData[i];
			sumSqErr += err * err;
		}
		return sumSqErr / n;
	}

	// ============================================================
	// GET CURRENT WEIGHTS
	// ============================================================

	function _getCurrentWeights() {
		if (!model || !model.layers || model.layers.length < 1) return null;
		try {
			var layer = model.layers[0];
			var weights = layer.getWeights();
			if (!weights || weights.length < 1) return null;
			var kernel = weights[0].dataSync();
			var w = kernel[0];
			var b = 0;
			if (weights.length > 1) {
				var bias = weights[1].dataSync();
				b = bias[0];
			}
			return { w: w, b: b };
		} catch (e) { return null; }
	}

	// ============================================================
	// COMPUTE GRID FOR PLOTLY
	// ============================================================

	function _computeSurfaceData() {
		var xData = _state.cachedX;
		var yData = _state.cachedY;
		if (!xData || !yData || xData.length === 0) return null;

		var gridSize = _state.gridSize;
		var wMin = _state.wRange[0], wMax = _state.wRange[1];
		var bMin = _state.bRange[0], bMax = _state.bRange[1];

		var wVals = [];
		var bVals = [];
		var zVals = [];

		for (var i = 0; i < gridSize; i++) {
			wVals.push(wMin + (i / (gridSize - 1)) * (wMax - wMin));
		}
		for (var j = 0; j < gridSize; j++) {
			bVals.push(bMin + (j / (gridSize - 1)) * (bMax - bMin));
		}

		for (var j = 0; j < gridSize; j++) {
			var row = [];
			for (var i = 0; i < gridSize; i++) {
				var loss = _computeLoss(wVals[i], bVals[j], xData, yData);
				row.push(loss);
			}
			zVals.push(row);
		}

		return { wVals: wVals, bVals: bVals, zVals: zVals };
	}

	// ============================================================
	// PLOTLY RENDERING
	// ============================================================

	function _ensurePlotly(callback) {
		if (typeof Plotly !== "undefined") {
			callback();
			return;
		}
		// Load Plotly if not available
		var script = document.createElement("script");
		script.src = "https://cdn.plot.ly/plotly-latest.min.js";
		script.onload = callback;
		script.onerror = function () {
			_state.debugMsg = "Failed to load Plotly.js";
		};
		document.head.appendChild(script);
	}

	function _renderPlot() {
		if (typeof Plotly === "undefined") return;

		var plotDiv = _state.plotDiv;
		if (!plotDiv) return;

		var surfaceData = _computeSurfaceData();
		if (!surfaceData) {
			// Show debug message
			plotDiv.innerHTML = "<div style='color:#aaa;text-align:center;padding:40px;font-family:monospace;font-size:12px;'>" +
				"<p><b>Loss Landscape 3D</b> - Waiting for data</p>" +
				"<p>" + _state.debugMsg + "</p>" +
				"<p>cachedX: " + (_state.cachedX ? _state.cachedX.length + " items" : "null") + "</p>" +
				"<p>cachedY: " + (_state.cachedY ? _state.cachedY.length + " items" : "null") + "</p>" +
				"</div>";
			return;
		}

		// Build hash to avoid unnecessary re-renders
		var current = _getCurrentWeights();
		var plotHash = _state.wRange.join(",") + "|" + _state.bRange.join(",") + "|" + _state.history.length;
		if (current) plotHash += "|" + current.w.toFixed(6) + "," + current.b.toFixed(6);

		// Surface trace
		var surfaceTrace = {
			type: "surface",
			x: surfaceData.wVals,
			y: surfaceData.bVals,
			z: surfaceData.zVals,
			colorscale: [
				[0, "rgb(0, 0, 80)"],
				[0.15, "rgb(0, 100, 200)"],
				[0.3, "rgb(0, 200, 255)"],
				[0.45, "rgb(50, 255, 200)"],
				[0.6, "rgb(200, 255, 50)"],
				[0.75, "rgb(255, 200, 0)"],
				[0.9, "rgb(255, 100, 0)"],
				[1, "rgb(200, 0, 0)"]
			],
			opacity: 0.85,
			showscale: true,
			colorbar: {
				title: "Loss",
				titleside: "right",
				thickness: 15,
				len: 0.6
			},
			contours: {
				z: { show: true, usecolormap: true, highlightcolor: "#fff", project: { z: false } }
			},
			hovertemplate: "w: %{x:.4f}<br>b: %{y:.4f}<br>loss: %{z:.6f}<extra></extra>",
			name: "Loss Surface"
		};

		var traces = [surfaceTrace];

		// Path trace (history)
		if (_state.history.length > 1) {
			var pathW = [];
			var pathB = [];
			var pathLoss = [];

			for (var h = 0; h < _state.history.length; h++) {
				var pt = _state.history[h];
				pathW.push(pt.w);
				pathB.push(pt.b);
				pathLoss.push(_computeLoss(pt.w, pt.b, _state.cachedX, _state.cachedY) + 0.01);
			}

			var pathTrace = {
				type: "scatter3d",
				mode: "lines+markers",
				x: pathW,
				y: pathB,
				z: pathLoss,
				line: { color: "#ffffff", width: 4 },
				marker: { size: 2, color: "#ffffff", opacity: 0.6 },
				name: "Optimization Path",
				hovertemplate: "w: %{x:.4f}<br>b: %{y:.4f}<br>loss: %{z:.6f}<extra>Step %{pointNumber}</extra>"
			};
			traces.push(pathTrace);

			// Start point
			var startTrace = {
				type: "scatter3d",
				mode: "markers",
				x: [pathW[0]],
				y: [pathB[0]],
				z: [pathLoss[0]],
				marker: { size: 8, color: "#2ecc71", symbol: "diamond" },
				name: "Start",
				hovertemplate: "START<br>w: %{x:.4f}<br>b: %{y:.4f}<br>loss: %{z:.6f}<extra></extra>"
			};
			traces.push(startTrace);
		}

		// Current position
		if (current) {
			var cLoss = _computeLoss(current.w, current.b, _state.cachedX, _state.cachedY) + 0.01;
			var currentTrace = {
				type: "scatter3d",
				mode: "markers",
				x: [current.w],
				y: [current.b],
				z: [cLoss],
				marker: { size: 10, color: "#e74c3c", symbol: "circle", line: { color: "#fff", width: 2 } },
				name: "Current (w=" + current.w.toFixed(4) + ", b=" + current.b.toFixed(4) + ")",
				hovertemplate: "CURRENT<br>w: %{x:.4f}<br>b: %{y:.4f}<br>loss: %{z:.6f}<extra></extra>"
			};
			traces.push(currentTrace);
		}

		var layout = {
			title: {
				text: "3D Loss Landscape (MSE) | " + (_state.cachedX ? _state.cachedX.length : 0) + " samples | Steps: " + _state.history.length,
				font: { size: 13, color: "#aaa" }
			},
			scene: {
				xaxis: { title: "Weight (w)", gridcolor: "rgba(255,255,255,0.1)", color: "#aaa" },
				yaxis: { title: "Bias (b)", gridcolor: "rgba(255,255,255,0.1)", color: "#aaa" },
				zaxis: { title: "Loss (MSE)", gridcolor: "rgba(255,255,255,0.1)", color: "#aaa", type: "log" },
				bgcolor: "#0d0d1a",
				camera: {
					eye: { x: 1.5, y: 1.5, z: 1.2 }
				}
			},
			paper_bgcolor: "#0d0d1a",
			plot_bgcolor: "#0d0d1a",
			font: { color: "#ccc" },
			margin: { l: 0, r: 0, t: 40, b: 0 },
			showlegend: true,
			legend: { x: 0.01, y: 0.99, bgcolor: "rgba(13,13,26,0.8)", font: { size: 10 } }
		};

		var config = {
			responsive: true,
			displayModeBar: true,
			modeBarButtonsToRemove: ["toImage", "sendDataToCloud"],
			displaylogo: false
		};

		if (!_state.plotlyInitialized || plotHash !== _state.lastPlotHash) {
			if (!_state.plotlyInitialized) {
				Plotly.newPlot(plotDiv, traces, layout, config);
				_state.plotlyInitialized = true;
			} else {
				Plotly.react(plotDiv, traces, layout, config);
			}
			_state.lastPlotHash = plotHash;
		}
	}

	// ============================================================
	// AUTO-RANGE
	// ============================================================

	function _updateRange() {
		var current = _getCurrentWeights();
		if (!current) return;

		var wMin = current.w, wMax = current.w;
		var bMin = current.b, bMax = current.b;

		for (var i = 0; i < _state.history.length; i++) {
			var pt = _state.history[i];
			if (pt.w < wMin) wMin = pt.w;
			if (pt.w > wMax) wMax = pt.w;
			if (pt.b < bMin) bMin = pt.b;
			if (pt.b > bMax) bMax = pt.b;
		}

		var wPad = Math.max(1, (wMax - wMin) * 0.5);
		var bPad = Math.max(1, (bMax - bMin) * 0.5);

		_state.wRange = [wMin - wPad, wMax + wPad];
		_state.bRange = [bMin - bPad, bMax + bPad];
	}

	// ============================================================
	// TICK
	// ============================================================

	function _tick() {
		var eligible = _isEligibleModel();

		if (!eligible) {
			if (_state.container) {
				_state.container.style.display = "none";
			}
			_state.lastEligible = false;
			return;
		}

		_state.lastEligible = true;

		if (_state.container) {
			_state.container.style.display = "";
		}

		_syncData();

		var current = _getCurrentWeights();
		if (current) {
			var last = _state.history.length > 0 ? _state.history[_state.history.length - 1] : null;
			if (!last || Math.abs(last.w - current.w) > 1e-8 || Math.abs(last.b - current.b) > 1e-8) {
				_state.history.push({ w: current.w, b: current.b });
				if (_state.history.length > 5000) {
					_state.history = _state.history.slice(-2500);
				}
			}
		}

		_updateRange();
		_renderPlot();
	}

	// ============================================================
	// CONTAINER MANAGEMENT
	// ============================================================

	function _getOrCreateContainer(divOrId) {
		var existing = document.getElementById(_SINGLETON_ID);
		if (existing) {
			_state.container = existing;
			return existing;
		}

		var parent = null;
		if (typeof divOrId === "string" && divOrId !== "") {
			parent = document.getElementById(divOrId);
		} else if (divOrId instanceof HTMLElement) {
			parent = divOrId;
		}

		var container = document.createElement("div");
		container.id = _SINGLETON_ID;
		container.style.cssText = "margin: 20px 0; padding: 10px; border-radius: 12px; background: #0d0d1a; display: inline-block; min-width: 700px;";

		if (parent) {
			parent.appendChild(container);
		} else {
			document.body.appendChild(container);
		}

		_state.container = container;
		return container;
	}

	function _buildUI(container) {
		container.innerHTML = "";

		var title = document.createElement("div");
		title.style.cssText = "color: #aaa; font-size: 12px; margin-bottom: 6px; font-family: sans-serif;";
		title.textContent = "3D Loss Landscape (1 Dense, 1 neuron, input [1]) — Plotly";
		container.appendChild(title);

		var plotDiv = document.createElement("div");
		plotDiv.id = _SINGLETON_ID + "_plot";
		plotDiv.style.cssText = "width: 680px; height: 550px; border-radius: 8px; overflow: hidden;";
		container.appendChild(plotDiv);

		_state.plotDiv = plotDiv;
		_state.plotlyInitialized = false;
		_state.lastPlotHash = "";

		var btnRow = document.createElement("div");
		btnRow.style.cssText = "margin-top: 8px; display: flex; gap: 8px;";

		var clearBtn = document.createElement("button");
		clearBtn.textContent = "Clear Path";
		clearBtn.style.cssText = "padding: 4px 12px; border: 1px solid rgba(255,255,255,0.2); background: rgba(255,255,255,0.05); color: #ccc; border-radius: 6px; cursor: pointer; font-size: 11px;";
		clearBtn.onclick = function () {
			_state.history = [];
			_state.plotlyInitialized = false;
			_tick();
		};
		btnRow.appendChild(clearBtn);

		container.appendChild(btnRow);
	}

	// ============================================================
	// PUBLIC API
	// ============================================================

	function init(divOrId) {
		if (_state.intervalId) {
			clearInterval(_state.intervalId);
			_state.intervalId = null;
		}

		var container = _getOrCreateContainer(divOrId);
		_buildUI(container);

		_state.history = [];
		_state.cachedX = null;
		_state.cachedY = null;
		_state.debugMsg = "Initializing...";

		_ensurePlotly(function () {
			_state.active = true;
			_state.intervalId = setInterval(_tick, 500);
			_tick();
		});

		return container;
	}

	function stop() {
		if (_state.intervalId) {
			clearInterval(_state.intervalId);
			_state.intervalId = null;
		}
		_state.active = false;
	}

	function update() { _tick(); }

	return { init: init, stop: stop, update: update };

})();

if (typeof window !== "undefined") {
	window.LossLandscape = LossLandscape;
}
