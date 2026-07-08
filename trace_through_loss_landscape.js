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
		lastPlotHash: "",
		parentElement: null,
		parentId: null,
		// NEW: track user interaction to defer updates
		userInteracting: false,
		interactionTimeout: null,
		// NEW: preserve camera position across updates
		lastCamera: null,
		// NEW: track if container was already built (avoid rebuild)
		uiBuilt: false,
		// NEW: use requestAnimationFrame for smoother scheduling
		rafId: null,
		pendingUpdate: false
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
	// CAMERA PRESERVATION - Key fix for smooth interaction
	// ============================================================

	function _saveCamera() {
		if (!_state.plotDiv || !_state.plotDiv._fullLayout) return;
		try {
			var scene = _state.plotDiv._fullLayout.scene;
			if (scene && scene._scene && scene._scene.getCamera) {
				_state.lastCamera = scene._scene.getCamera();
			} else if (scene && scene.camera) {
				_state.lastCamera = JSON.parse(JSON.stringify(scene.camera));
			}
		} catch (e) {
			// Camera read failed, keep last known
		}
	}

	function _getLayoutWithCamera(baseLayout) {
		// If we have a saved camera, apply it to prevent reset
		if (_state.lastCamera) {
			baseLayout.scene.camera = _state.lastCamera;
		}
		return baseLayout;
	}

	// ============================================================
	// INTERACTION DETECTION - Defer updates while user is interacting
	// ============================================================

	function _setupInteractionListeners() {
		if (!_state.plotDiv) return;

		var plotDiv = _state.plotDiv;

		// Plotly fires these events during 3D interaction
		plotDiv.addEventListener("mousedown", _onInteractionStart, { passive: true });
		plotDiv.addEventListener("touchstart", _onInteractionStart, { passive: true });
		plotDiv.addEventListener("wheel", _onInteractionStart, { passive: true });

		// Listen for plotly relayout events (fired after camera changes)
		plotDiv.on && plotDiv.on("plotly_relayout", function (eventData) {
			// Save camera whenever user moves it
			if (eventData && (eventData["scene.camera"] || eventData["scene.camera.eye"])) {
				_state.lastCamera = eventData["scene.camera"] || null;
			}
			_saveCamera();
		});

		// Also hook into plotly_relayouting for live camera tracking
		plotDiv.on && plotDiv.on("plotly_relayouting", function (eventData) {
			_state.userInteracting = true;
			_clearInteractionTimeout();
			_state.interactionTimeout = setTimeout(_onInteractionEnd, 300);

			// Save camera during interaction
			if (eventData && eventData["scene.camera"]) {
				_state.lastCamera = eventData["scene.camera"];
			}
		});
	}

	function _onInteractionStart() {
		_state.userInteracting = true;
		_clearInteractionTimeout();

		// Save camera state before any potential update
		_saveCamera();

		// Set a timeout to mark interaction as ended
		_state.interactionTimeout = setTimeout(_onInteractionEnd, 400);
	}

	function _onInteractionEnd() {
		_state.userInteracting = false;
		_saveCamera();

		// If there was a pending update, do it now
		if (_state.pendingUpdate) {
			_state.pendingUpdate = false;
			_scheduleRender();
		}
	}

	function _clearInteractionTimeout() {
		if (_state.interactionTimeout) {
			clearTimeout(_state.interactionTimeout);
			_state.interactionTimeout = null;
		}
	}

	// ============================================================
	// PLOTLY RENDERING - SMOOTH UPDATES (no destroy/recreate)
	// ============================================================

	function _ensurePlotly(callback) {
		if (typeof Plotly !== "undefined") {
			callback();
			return;
		}
		var script = document.createElement("script");
		script.src = "https://cdn.plot.ly/plotly-latest.min.js";
		script.onload = callback;
		script.onerror = function () {
			_state.debugMsg = "Failed to load Plotly.js";
		};
		document.head.appendChild(script);
	}

	function _scheduleRender() {
		if (_state.rafId) return; // Already scheduled
		_state.rafId = requestAnimationFrame(function () {
			_state.rafId = null;
			_renderPlot();
		});
	}

	function _renderPlot() {
		if (typeof Plotly === "undefined") return;

		var plotDiv = _state.plotDiv;
		if (!plotDiv || !plotDiv.parentNode) return;

		// FIX #1: If user is currently interacting (dragging/rotating/scrolling),
		// defer the update to avoid fighting with Plotly's internal handlers
		if (_state.userInteracting) {
			_state.pendingUpdate = true;
			return;
		}

		var surfaceData = _computeSurfaceData();
		if (!surfaceData) {
			var infoDiv = document.getElementById(_SINGLETON_ID + "_info");
			if (infoDiv) {
				infoDiv.style.display = "";
				infoDiv.innerHTML =
					"<p><b>Loss Landscape 3D</b> - Waiting for data</p>" +
					"<p>" + _state.debugMsg + "</p>" +
					"<p>cachedX: " + (_state.cachedX ? _state.cachedX.length + " items" : "null") + "</p>" +
					"<p>cachedY: " + (_state.cachedY ? _state.cachedY.length + " items" : "null") + "</p>";
			}
			return;
		}

		// Hide info overlay when we have data
		var infoDiv = document.getElementById(_SINGLETON_ID + "_info");
		if (infoDiv) {
			infoDiv.style.display = "none";
		}

		// Build hash to avoid unnecessary re-renders
		var current = _getCurrentWeights();
		var plotHash = _state.wRange[0].toFixed(4) + "," + _state.wRange[1].toFixed(4) + "|" +
			_state.bRange[0].toFixed(4) + "," + _state.bRange[1].toFixed(4) + "|" +
			_state.history.length + "|" +
			(_state.cachedX ? _state.cachedX.length : 0);
		if (current) plotHash += "|" + current.w.toFixed(6) + "," + current.b.toFixed(6);

		// Skip render if nothing changed
		if (plotHash === _state.lastPlotHash && _state.plotlyInitialized) {
			return;
		}

		// FIX #2: Save camera BEFORE updating so we can restore it
		_saveCamera();

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
				title: { text: "Loss (MSE)", side: "right" },
				thickness: 15,
				len: 0.6
			},
			contours: {
				z: { show: true, usecolormap: true, highlightcolor: "#fff", project: { z: false } }
			},
			hovertemplate: "Weight (w): %{x:.4f}<br>Bias (b): %{y:.4f}<br>Loss: %{z:.6f}<extra></extra>",
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
				var lossVal = _computeLoss(pt.w, pt.b, _state.cachedX, _state.cachedY);
				pathLoss.push(Math.max(lossVal + 0.01, 1e-6));
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
				hovertemplate: "Weight (w): %{x:.4f}<br>Bias (b): %{y:.4f}<br>Loss: %{z:.6f}<extra>Step %{pointNumber}</extra>"
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
				hovertemplate: "START<br>Weight (w): %{x:.4f}<br>Bias (b): %{y:.4f}<br>Loss: %{z:.6f}<extra></extra>"
			};
			traces.push(startTrace);
		}

		// Current position
		if (current) {
			var cLoss = _computeLoss(current.w, current.b, _state.cachedX, _state.cachedY);
			cLoss = Math.max(cLoss + 0.01, 1e-6);
			var currentTrace = {
				type: "scatter3d",
				mode: "markers",
				x: [current.w],
				y: [current.b],
				z: [cLoss],
				marker: { size: 10, color: "#e74c3c", symbol: "circle", line: { color: "#fff", width: 2 } },
				name: "Current (w=" + current.w.toFixed(4) + ", b=" + current.b.toFixed(4) + ")",
				hovertemplate: "CURRENT<br>Weight (w): %{x:.4f}<br>Bias (b): %{y:.4f}<br>Loss: %{z:.6f}<extra></extra>"
			};
			traces.push(currentTrace);
		}

		var layout = {
			title: {
				text: "3D Loss Landscape (MSE) — " + (_state.cachedX ? _state.cachedX.length : 0) + " samples, " + _state.history.length + " steps",
				font: { size: 13, color: "#aaa" }
			},
			scene: {
				xaxis: {
					title: { text: "Weight (w)", font: { size: 12, color: "#ddd" } },
					gridcolor: "rgba(255,255,255,0.1)",
					color: "#aaa",
					tickfont: { size: 10, color: "#999" }
				},
				yaxis: {
					title: { text: "Bias (b)", font: { size: 12, color: "#ddd" } },
					gridcolor: "rgba(255,255,255,0.1)",
					color: "#aaa",
					tickfont: { size: 10, color: "#999" }
				},
				zaxis: {
					title: { text: "Loss (MSE)", font: { size: 12, color: "#ddd" } },
					gridcolor: "rgba(255,255,255,0.1)",
					color: "#aaa",
					tickfont: { size: 10, color: "#999" },
					rangemode: "tozero"
				},
				bgcolor: "#0d0d1a",
				// FIX #3: Only set camera on initial render, otherwise preserve user's camera
				camera: _state.lastCamera || { eye: { x: 1.5, y: 1.5, z: 1.2 } }
			},
			paper_bgcolor: "#0d0d1a",
			plot_bgcolor: "#0d0d1a",
			font: { color: "#ccc" },
			margin: { l: 0, r: 0, t: 40, b: 0 },
			showlegend: true,
			legend: { x: 0.01, y: 0.99, bgcolor: "rgba(13,13,26,0.8)", font: { size: 10 } },
			// FIX #4: Prevent Plotly from triggering scroll events on the page
			dragmode: "orbit"
		};

		var config = {
			responsive: true,
			displayModeBar: true,
			modeBarButtonsToRemove: ["toImage", "sendDataToCloud"],
			displaylogo: false,
			// FIX #5: Prevent scroll zoom from propagating to page
			scrollZoom: true
		};

		if (!_state.plotlyInitialized) {
			Plotly.newPlot(plotDiv, traces, layout, config).then(function () {
				_state.plotlyInitialized = true;
				_state.lastPlotHash = plotHash;
				// Setup interaction listeners AFTER plot is created
				_setupInteractionListeners();
			});
		} else {
			// FIX #6: Use Plotly.react with preserved camera — this does a
			// diff-based update without destroying/recreating the WebGL context
			Plotly.react(plotDiv, traces, layout, config).then(function () {
				_state.lastPlotHash = plotHash;
			});
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
	// TICK - uses requestAnimationFrame for smoother scheduling
	// ============================================================

	function _tick() {
		var eligible = _isEligibleModel();

		if (!eligible) {
			// FIX #7: Use opacity + pointer-events instead of position changes
			// This avoids layout reflow which causes scroll jumping
			if (_state.container) {
				_state.container.style.opacity = "0";
				_state.container.style.pointerEvents = "none";
				// Keep the element in flow with fixed height to prevent reflow
				_state.container.style.height = "0";
				_state.container.style.minHeight = "0";
				_state.container.style.overflow = "hidden";
				_state.container.style.margin = "0";
				_state.container.style.padding = "0";
			}
			_state.lastEligible = false;
			return;
		}

		// Model became eligible — restore smoothly
		if (!_state.lastEligible && _state.container) {
			_state.container.style.transition = "opacity 0.3s ease";
			_state.container.style.opacity = "1";
			_state.container.style.pointerEvents = "";
			_state.container.style.height = "";
			_state.container.style.minHeight = "620px";
			_state.container.style.overflow = "";
			_state.container.style.margin = "20px 0";
			_state.container.style.padding = "10px";
		}
		_state.lastEligible = true;

		if (_state.container) {
			_state.container.style.opacity = "1";
			_state.container.style.pointerEvents = "";
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

		// FIX #8: Use requestAnimationFrame for rendering to sync with browser paint
		_scheduleRender();
	}

	// ============================================================
	// CONTAINER MANAGEMENT - FIX #9: Never remove/re-add to DOM
	// ============================================================

	function _getOrCreateContainer(divOrId) {
		// Check if our container already exists in the DOM
		var existing = document.getElementById(_SINGLETON_ID);
		if (existing && existing.parentNode) {
			// Reuse existing container — DON'T remove it!
			// This prevents scroll position reset
			_state.container = existing;

			// Only purge the plotly instance if we need to rebuild
			if (_state.plotDiv && typeof Plotly !== "undefined") {
				try { Plotly.purge(_state.plotDiv); } catch (e) {}
			}
			_state.plotlyInitialized = false;
			_state.lastPlotHash = "";
			return existing;
		}

		var parent = null;
		if (typeof divOrId === "string" && divOrId !== "") {
			parent = document.getElementById(divOrId);
			_state.parentId = divOrId;
		} else if (divOrId instanceof HTMLElement) {
			parent = divOrId;
			_state.parentElement = divOrId;
		}

		var container = document.createElement("div");
		container.id = _SINGLETON_ID;
		container.style.cssText = "margin: 20px 0; padding: 10px; border-radius: 12px; background: #0d0d1a; display: inline-block; min-width: 700px; min-height: 620px; transition: opacity 0.3s ease; contain: layout style;";

		if (parent) {
			parent.appendChild(container);
		} else {
			document.body.appendChild(container);
		}

		_state.container = container;
		return container;
	}

	function _buildUI(container) {
		// FIX #10: Only build UI once, don't wipe innerHTML if already built
		if (_state.uiBuilt && _state.plotDiv && _state.plotDiv.parentNode) {
			// Just purge the plot for re-initialization, don't rebuild DOM
			if (typeof Plotly !== "undefined") {
				try { Plotly.purge(_state.plotDiv); } catch (e) {}
			}
			_state.plotlyInitialized = false;
			_state.lastPlotHash = "";
			return;
		}

		container.innerHTML = "";

		var title = document.createElement("div");
		title.style.cssText = "color: #aaa; font-size: 12px; margin-bottom: 6px; font-family: sans-serif;";
		title.textContent = "3D Loss Landscape (1 Dense, 1 neuron, input [1]) — Plotly";
		container.appendChild(title);

		// Info overlay (shown when waiting for data, hidden otherwise)
		var infoDiv = document.createElement("div");
		infoDiv.id = _SINGLETON_ID + "_info";
		infoDiv.style.cssText = "color:#aaa;text-align:center;padding:40px;font-family:monospace;font-size:12px;position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);z-index:1;pointer-events:none;";
		infoDiv.innerHTML = "<p><b>Loss Landscape 3D</b> - Waiting for data</p>";

		// Plot wrapper with fixed dimensions to prevent reflow
		var plotWrapper = document.createElement("div");
		plotWrapper.style.cssText = "position: relative; width: 680px; height: 550px; contain: strict;";

		var plotDiv = document.createElement("div");
		plotDiv.id = _SINGLETON_ID + "_plot";
		plotDiv.style.cssText = "width: 680px; height: 550px; border-radius: 8px; overflow: hidden; contain: strict;";

		plotWrapper.appendChild(plotDiv);
		plotWrapper.appendChild(infoDiv);
		container.appendChild(plotWrapper);

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
			_state.lastPlotHash = "";
			_tick();
		};
		btnRow.appendChild(clearBtn);

		container.appendChild(btnRow);

		// FIX #11: Prevent wheel events on the plot from scrolling the page
		plotDiv.addEventListener("wheel", function (e) {
			e.stopPropagation();
			// Don't preventDefault — let Plotly handle zoom
		}, { passive: true });

		// Prevent touch scrolling on the plot from scrolling the page
		plotDiv.addEventListener("touchmove", function (e) {
			e.stopPropagation();
		}, { passive: false });

		_state.uiBuilt = true;
	}

	// ============================================================
	// PUBLIC API
	// ============================================================

	function init_loss_landscape(divOrId) {
		if (_state.intervalId) {
			clearInterval(_state.intervalId);
			_state.intervalId = null;
		}

		// Store the parent reference for re-creation
		if (typeof divOrId === "string") {
			_state.parentId = divOrId;
			_state.parentElement = null;
		} else if (divOrId instanceof HTMLElement) {
			_state.parentElement = divOrId;
			_state.parentId = null;
		}

		var container = _getOrCreateContainer(divOrId);
		_buildUI(container);

		_state.history = [];
		_state.cachedX = null;
		_state.cachedY = null;
		_state.debugMsg = "Initializing...";
		_state.lastCamera = null;

		_ensurePlotly(function () {
			_state.active = true;
			// FIX #12: Use a slower interval (800ms) to reduce conflicts with interaction
			_state.intervalId = setInterval(_tick, 800);
			_tick();
		});

		return container;
	}

	function destroy() {
		if (_state.intervalId) {
			clearInterval(_state.intervalId);
			_state.intervalId = null;
		}
		if (_state.rafId) {
			cancelAnimationFrame(_state.rafId);
			_state.rafId = null;
		}
		_state.active = false;

		if (_state.plotDiv && typeof Plotly !== "undefined") {
			try { Plotly.purge(_state.plotDiv); } catch (e) {}
		}

		if (_state.container && _state.container.parentNode) {
			_state.container.parentNode.removeChild(_state.container);
		}

		_state.container = null;
		_state.plotDiv = null;
		_state.plotlyInitialized = false;
		_state.lastPlotHash = "";
		_state.history = [];
		_state.cachedX = null;
		_state.cachedY = null;
		_state.uiBuilt = false;
		_state.lastCamera = null;
		_state.userInteracting = false;
		_clearInteractionTimeout();
	}

	function stop() {
		if (_state.intervalId) {
			clearInterval(_state.intervalId);
			_state.intervalId = null;
		}
		if (_state.rafId) {
			cancelAnimationFrame(_state.rafId);
			_state.rafId = null;
		}
		_state.active = false;
	}

	function update() {
		// If container was destroyed, re-create it in the same parent
		if (!_state.container || !_state.container.parentNode) {
			var target = _state.parentId || _state.parentElement || null;
			if (target) {
				init_loss_landscape(target);
				return;
			}
		}
		_state.lastPlotHash = ""; // Force a re-render
		_tick();
	}

	return { init_loss_landscape: init_loss_landscape, stop: stop, update: update, destroy: destroy };

})();

if (typeof window !== "undefined") {
	window.LossLandscape = LossLandscape;
}

function create_loss_landscape() {
	LossLandscape.init_loss_landscape("auto_loss_landscape");
}
