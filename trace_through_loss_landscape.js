"use strict";

var LossLandscape = (function () {

	var _SINGLETON_ID = "loss_landscape_singleton";
	var _state = {
		container: null,
		canvas: null,
		ctx: null,
		intervalId: null,
		active: false,
		history: [],
		gridSize: 60,
		wRange: [-3, 3],
		bRange: [-3, 3],
		canvasWidth: 500,
		canvasHeight: 500,
		cachedX: null,
		cachedY: null,
		lastEligible: false,
		debugMsg: "Initializing..."
	};

	function _isEligibleModel() {
		if (typeof model === "undefined" || !model) return false;
		if (!model.layers || !Array.isArray(model.layers)) return false;
		if (model.layers.length !== 1) return false;

		var layer = model.layers[0];
		var className = "";
		try {
			className = layer.getClassName ? layer.getClassName() : "";
		} catch (e) { return false; }
		if (className.toLowerCase() !== "dense") return false;

		var config = layer.getConfig ? layer.getConfig() : {};
		if (config.units !== 1) return false;

		var inputShape = null;
		try {
			inputShape = model.input.shape;
		} catch (e) { return false; }

		if (!inputShape || inputShape.length !== 2) return false;
		if (inputShape[1] !== 1) return false;

		return true;
	}

	function _syncData() {
		// Try xy_data_global first (set in train.js run_neural_network)
		if (typeof xy_data_global !== "undefined" && xy_data_global !== null) {
			var xTensor = xy_data_global.x || xy_data_global["x"];
			var yTensor = xy_data_global.y || xy_data_global["y"];

			if (xTensor && yTensor) {
				try {
					var xArr = null;
					var yArr = null;

					// Handle TF tensors
					if (xTensor.dataSync) {
						xArr = Array.from(xTensor.dataSync());
					} else if (Array.isArray(xTensor)) {
						xArr = xTensor.flat(Infinity);
					}

					if (yTensor.dataSync) {
						yArr = Array.from(yTensor.dataSync());
					} else if (Array.isArray(yTensor)) {
						yArr = yTensor.flat(Infinity);
					}

					if (xArr && yArr && xArr.length > 0 && yArr.length > 0) {
						_state.cachedX = xArr;
						_state.cachedY = yArr;
						_state.debugMsg = "Data synced: " + xArr.length + " samples";
						return true;
					} else {
						_state.debugMsg = "xy_data_global found but arrays empty (x:" + (xArr ? xArr.length : "null") + ", y:" + (yArr ? yArr.length : "null") + ")";
					}
				} catch (e) {
					_state.debugMsg = "Error reading xy_data_global: " + e.message;
				}
			} else {
				_state.debugMsg = "xy_data_global exists but x/y missing";
			}
		} else {
			_state.debugMsg = "xy_data_global is undefined or null";
		}

		// Fallback: try global_x / global_y
		if (typeof global_x !== "undefined" && typeof global_y !== "undefined" && global_x && global_y) {
			try {
				var gx = global_x.dataSync ? Array.from(global_x.dataSync()) : (Array.isArray(global_x) ? global_x.flat(Infinity) : null);
				var gy = global_y.dataSync ? Array.from(global_y.dataSync()) : (Array.isArray(global_y) ? global_y.flat(Infinity) : null);
				if (gx && gy && gx.length > 0) {
					_state.cachedX = gx;
					_state.cachedY = gy;
					_state.debugMsg = "Data from global_x/y: " + gx.length + " samples";
					return true;
				}
			} catch (e) {
				_state.debugMsg = "Error reading global_x/y: " + e.message;
			}
		}

		return _state.cachedX !== null && _state.cachedX.length > 0;
	}

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

	function _computeGrid() {
		var xData = _state.cachedX;
		var yData = _state.cachedY;
		if (!xData || !yData || xData.length === 0) return null;

		var gridSize = _state.gridSize;
		var wMin = _state.wRange[0], wMax = _state.wRange[1];
		var bMin = _state.bRange[0], bMax = _state.bRange[1];

		var grid = new Float64Array(gridSize * gridSize);
		var maxLoss = 0;

		for (var i = 0; i < gridSize; i++) {
			var w = wMin + (i / (gridSize - 1)) * (wMax - wMin);
			for (var j = 0; j < gridSize; j++) {
				var b = bMin + (j / (gridSize - 1)) * (bMax - bMin);
				var loss = _computeLoss(w, b, xData, yData);
				grid[i * gridSize + j] = loss;
				if (loss > maxLoss) maxLoss = loss;
			}
		}

		return { grid: grid, maxLoss: maxLoss };
	}

	function _lossToColor(loss, maxLoss) {
		if (maxLoss === 0) return [0, 0, 80];
		var t = Math.log(1 + loss) / Math.log(1 + maxLoss);
		t = Math.max(0, Math.min(1, t));

		var r, g, bc;
		if (t < 0.25) {
			var s = t / 0.25;
			r = 0; g = Math.floor(s * 200); bc = Math.floor(80 + s * 175);
		} else if (t < 0.5) {
			var s = (t - 0.25) / 0.25;
			r = Math.floor(s * 50); g = Math.floor(200 + s * 55); bc = Math.floor(255 - s * 155);
		} else if (t < 0.75) {
			var s = (t - 0.5) / 0.25;
			r = Math.floor(50 + s * 205); g = Math.floor(255 - s * 55); bc = Math.floor(100 - s * 100);
		} else {
			var s = (t - 0.75) / 0.25;
			r = 255; g = Math.floor(200 - s * 200); bc = 0;
		}
		return [r, g, bc];
	}

	function _draw() {
		var canvas = _state.canvas;
		var ctx = _state.ctx;
		if (!canvas || !ctx) return;

		var W = canvas.width;
		var H = canvas.height;
		var gridSize = _state.gridSize;

		var result = _computeGrid();
		if (!result) {
			// Show debug message instead of blank
			ctx.fillStyle = "#1a1a2e";
			ctx.fillRect(0, 0, W, H);
			ctx.fillStyle = "rgba(255,255,255,0.5)";
			ctx.font = "13px monospace";
			ctx.textAlign = "center";
			ctx.fillText("Loss Landscape - Waiting for data", W / 2, H / 2 - 20);
			ctx.fillStyle = "rgba(255,255,255,0.35)";
			ctx.font = "11px monospace";
			ctx.fillText(_state.debugMsg, W / 2, H / 2 + 10);

			var current = _getCurrentWeights();
			if (current) {
				ctx.fillText("Model weights: w=" + current.w.toFixed(4) + " b=" + current.b.toFixed(4), W / 2, H / 2 + 30);
			}
			ctx.fillText("cachedX: " + (_state.cachedX ? _state.cachedX.length + " items" : "null"), W / 2, H / 2 + 50);
			ctx.fillText("cachedY: " + (_state.cachedY ? _state.cachedY.length + " items" : "null"), W / 2, H / 2 + 65);
			return;
		}

		var grid = result.grid;
		var maxLoss = result.maxLoss;

		var margin = 50;
		var plotW = W - margin - 20;
		var plotH = H - margin - 20;

		ctx.fillStyle = "#1a1a2e";
		ctx.fillRect(0, 0, W, H);

		// Draw heatmap
		var imageData = ctx.createImageData(gridSize, gridSize);
		for (var i = 0; i < gridSize; i++) {
			for (var j = 0; j < gridSize; j++) {
				var loss = grid[i * gridSize + j];
				var color = _lossToColor(loss, maxLoss);
				var idx = ((gridSize - 1 - j) * gridSize + i) * 4;
				imageData.data[idx] = color[0];
				imageData.data[idx + 1] = color[1];
				imageData.data[idx + 2] = color[2];
				imageData.data[idx + 3] = 255;
			}
		}

		var tempCanvas = document.createElement("canvas");
		tempCanvas.width = gridSize;
		tempCanvas.height = gridSize;
		tempCanvas.getContext("2d").putImageData(imageData, 0, 0);

		ctx.imageSmoothingEnabled = true;
		ctx.drawImage(tempCanvas, margin, 10, plotW, plotH);

		// Axes
		ctx.fillStyle = "#ffffff";
		ctx.font = "12px sans-serif";
		ctx.textAlign = "center";
		ctx.fillText("Weight (w)", margin + plotW / 2, H - 5);
		ctx.textAlign = "left";
		ctx.fillText(_state.wRange[0].toFixed(1), margin, H - 20);
		ctx.textAlign = "right";
		ctx.fillText(_state.wRange[1].toFixed(1), margin + plotW, H - 20);

		ctx.save();
		ctx.translate(12, 10 + plotH / 2);
		ctx.rotate(-Math.PI / 2);
		ctx.textAlign = "center";
		ctx.fillText("Bias (b)", 0, 0);
		ctx.restore();

		ctx.textAlign = "left";
		ctx.fillText(_state.bRange[1].toFixed(1), margin - 45, 18);
		ctx.fillText(_state.bRange[0].toFixed(1), margin - 45, plotH + 10);

		// History path
		if (_state.history.length > 1) {
			ctx.beginPath();
			ctx.strokeStyle = "rgba(255, 255, 255, 0.7)";
			ctx.lineWidth = 1.5;
			for (var h = 0; h < _state.history.length; h++) {
				var pt = _state.history[h];
				var px = margin + ((pt.w - _state.wRange[0]) / (_state.wRange[1] - _state.wRange[0])) * plotW;
				var py = 10 + (1 - (pt.b - _state.bRange[0]) / (_state.bRange[1] - _state.bRange[0])) * plotH;
				if (h === 0) ctx.moveTo(px, py);
				else ctx.lineTo(px, py);
			}
			ctx.stroke();

			// Start marker
			var s0 = _state.history[0];
			var sx = margin + ((s0.w - _state.wRange[0]) / (_state.wRange[1] - _state.wRange[0])) * plotW;
			var sy = 10 + (1 - (s0.b - _state.bRange[0]) / (_state.bRange[1] - _state.bRange[0])) * plotH;
			ctx.beginPath();
			ctx.arc(sx, sy, 5, 0, Math.PI * 2);
			ctx.fillStyle = "rgba(46, 204, 113, 0.8)";
			ctx.fill();
		}

		// Current position
		var current = _getCurrentWeights();
		if (current) {
			var cx = margin + ((current.w - _state.wRange[0]) / (_state.wRange[1] - _state.wRange[0])) * plotW;
			var cy = 10 + (1 - (current.b - _state.bRange[0]) / (_state.bRange[1] - _state.bRange[0])) * plotH;

			ctx.beginPath();
			ctx.arc(cx, cy, 8, 0, Math.PI * 2);
			ctx.fillStyle = "rgba(255, 255, 255, 0.3)";
			ctx.fill();

			ctx.beginPath();
			ctx.arc(cx, cy, 4, 0, Math.PI * 2);
			ctx.fillStyle = "#ffffff";
			ctx.fill();
			ctx.strokeStyle = "#000000";
			ctx.lineWidth = 1;
			ctx.stroke();

			ctx.fillStyle = "#ffffff";
			ctx.font = "11px monospace";
			ctx.textAlign = "left";
			ctx.fillText("w=" + current.w.toFixed(4) + " b=" + current.b.toFixed(4), cx + 12, cy - 5);

			var currentLoss = _computeLoss(current.w, current.b, _state.cachedX, _state.cachedY);
			ctx.fillText("loss=" + currentLoss.toFixed(6), cx + 12, cy + 10);
		}

		// Info
		ctx.fillStyle = "rgba(255,255,255,0.8)";
		ctx.font = "bold 13px sans-serif";
		ctx.textAlign = "right";
		ctx.fillText("Loss Landscape | " + (_state.cachedX ? _state.cachedX.length : 0) + " samples", W - 10, H - 5);

		ctx.textAlign = "left";
		ctx.font = "11px sans-serif";
		ctx.fillStyle = "rgba(255,255,255,0.5)";
		ctx.fillText("Steps: " + _state.history.length, margin, H - 5);
	}

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

		// Always try to sync data
		_syncData();

		// Record current weights
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
		_draw();
	}

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
		container.style.cssText = "margin: 20px 0; padding: 10px; border-radius: 12px; background: #1a1a2e; display: inline-block;";

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
		title.textContent = "Loss Landscape (1 Dense layer, 1 neuron, input [1])";
		container.appendChild(title);

		var canvas = document.createElement("canvas");
		canvas.width = _state.canvasWidth;
		canvas.height = _state.canvasHeight;
		canvas.style.cssText = "display: block; border-radius: 8px; border: 1px solid rgba(255,255,255,0.1);";
		container.appendChild(canvas);

		_state.canvas = canvas;
		_state.ctx = canvas.getContext("2d");

		var btnRow = document.createElement("div");
		btnRow.style.cssText = "margin-top: 8px; display: flex; gap: 8px;";

		var clearBtn = document.createElement("button");
		clearBtn.textContent = "Clear Path";
		clearBtn.style.cssText = "padding: 4px 12px; border: 1px solid rgba(255,255,255,0.2); background: rgba(255,255,255,0.05); color: #ccc; border-radius: 6px; cursor: pointer; font-size: 11px;";
		clearBtn.onclick = function () { _state.history = []; };
		btnRow.appendChild(clearBtn);

		container.appendChild(btnRow);
	}

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

		_state.active = true;
		_state.intervalId = setInterval(_tick, 500);
		_tick();

		return container;
	}

	function stop() {
		if (_state.intervalId) {
			clearInterval(_state.intervalId);
			_state.intervalId = null;
		}
		_state.active = false;
	}

	function update() {
		_tick();
	}

	return { init: init, stop: stop, update: update };

})();

if (typeof window !== "undefined") {
	window.LossLandscape = LossLandscape;
}
