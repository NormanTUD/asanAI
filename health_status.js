"use strict";

// ============================================================
// GLOBAL LAYER I/O RECORDING
// ============================================================

var layerIOStats = {
	records: [],
	maxRecords: 50,
	enabled: true,
	_isRecording: false,
	_extractors: null,
	_extractorModelId: null,
	_container: null
};

function _ensureExtractors() {
	if (!model || !model._allLayers) return false;

	var currentModelId = model._allLayers.length + "_" + (model.inputs ? model.inputs[0].id : "");
	if (layerIOStats._extractorModelId === currentModelId && layerIOStats._extractors) {
		return true;
	}

	if (layerIOStats._extractors) {
		for (var i = 0; i < layerIOStats._extractors.length; i++) {
			if (layerIOStats._extractors[i] && layerIOStats._extractors[i].model) {
				try { layerIOStats._extractors[i].model.dispose(); } catch (e) { }
			}
		}
	}

	layerIOStats._extractors = [];
	layerIOStats._extractorModelId = currentModelId;

	var inputTensor = model.inputs[0];
	var allLayers = model._allLayers;

	for (var i = 0; i < allLayers.length; i++) {
		if (allLayers[i].getClassName() === "InputLayer") {
			layerIOStats._extractors.push(null);
			continue;
		}
		try {
			var layerOutput = allLayers[i].getOutputAt(0);
			var extModel = tf.model({ inputs: inputTensor, outputs: layerOutput });
			layerIOStats._extractors.push({
				model: extModel,
				layerIndex: i,
				layerName: allLayers[i].name,
				layerType: allLayers[i].getClassName()
			});
		} catch (e) {
			layerIOStats._extractors.push(null);
		}
	}

	return true;
}

function recordLayerIO(input) {
	if (!model || layerIOStats._isRecording) return;
	if (!layerIOStats.enabled) return;

	layerIOStats._isRecording = true;

	try {
		if (!_ensureExtractors()) {
			layerIOStats._isRecording = false;
			return;
		}
	} catch (e) {
		layerIOStats._isRecording = false;
		return;
	}

	var record = {
		timestamp: Date.now(),
		layers: []
	};

	try {
		tf.tidy(function () {
			var inputTensor;
			if (input instanceof tf.Tensor) {
				inputTensor = input;
			} else {
				inputTensor = tf.tensor(input);
			}

			var modelInputShape = model.inputs[0].shape;
			if (inputTensor.shape.length === modelInputShape.length - 1) {
				inputTensor = inputTensor.expandDims(0);
			}

			var inputDataSync = inputTensor.dataSync();
			var prevOutput = inputDataSync;

			for (var i = 0; i < layerIOStats._extractors.length; i++) {
				var ext = layerIOStats._extractors[i];
				if (!ext) continue;

				try {
					var outputTensor = ext.model.predict(inputTensor);
					var outputData = outputTensor.dataSync();

					record.layers.push({
						layerIndex: ext.layerIndex,
						layerName: ext.layerName,
						layerType: ext.layerType,
						input: prevOutput ? new Float32Array(prevOutput) : null,
						output: new Float32Array(outputData),
						outputShape: outputTensor.shape
					});

					prevOutput = outputData;
				} catch (e) { }
			}
		});
	} catch (e) {
		console.warn("[layerIO] recording error:", e);
	}

	layerIOStats._isRecording = false;

	layerIOStats.records.push(record);
	if (layerIOStats.records.length > layerIOStats.maxRecords) {
		layerIOStats.records.shift();
	}
}

function enableAutoRecord() {
	if (!model) return;
	if (model._io_auto_record_patched) return;

	var _origPredict = model.predict.bind(model);

	model.predict = function (input, config) {
		var result = _origPredict(input, config);

		if (layerIOStats.enabled && !layerIOStats._isRecording) {
			try {
				recordLayerIO(input);
			} catch (e) { }
		}

		return result;
	};

	model._io_auto_record_patched = true;
}

// ============================================================
// STATS
// ============================================================

function _computeStats(arr) {
	if (!arr || arr.length === 0) return null;

	var min = Infinity, max = -Infinity, sum = 0, sumSq = 0;
	var zeros = 0, negatives = 0, positives = 0;
	var nanCount = 0, infCount = 0;

	for (var i = 0; i < arr.length; i++) {
		var v = arr[i];
		if (isNaN(v)) { nanCount++; continue; }
		if (!isFinite(v)) { infCount++; continue; }
		if (v < min) min = v;
		if (v > max) max = v;
		sum += v;
		sumSq += v * v;
		if (v === 0) zeros++;
		else if (v < 0) negatives++;
		else positives++;
	}

	var n = arr.length - nanCount - infCount;
	var mean = n > 0 ? sum / n : 0;
	var variance = n > 1 ? (sumSq / n) - (mean * mean) : 0;
	var std = Math.sqrt(Math.max(0, variance));

	return {
		count: arr.length, min: min, max: max, mean: mean, std: std,
		zeros: zeros, negatives: negatives, positives: positives,
		nanCount: nanCount, infCount: infCount,
		zeroFraction: arr.length > 0 ? zeros / arr.length : 0,
		negativeFraction: arr.length > 0 ? negatives / arr.length : 0
	};
}

function _computeHistogram(arr, bins) {
	bins = bins || 40;
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

function _detectWarnings(layerData) {
	var warnings = [];
	if (!layerData.output) return warnings;
	var stats = _computeStats(layerData.output);
	if (!stats) return warnings;

	if (stats.zeroFraction > 0.8) {
		warnings.push({ type: "dying_relu", severity: stats.zeroFraction > 0.95 ? "critical" : "warning", zeroFraction: stats.zeroFraction });
	}
	if (stats.std < 1e-7 && stats.count > 1) {
		warnings.push({ type: "saturated", severity: "warning", std: stats.std });
	}
	if (stats.max > 1e6 || stats.min < -1e6) {
		warnings.push({ type: "exploding", severity: "critical", min: stats.min, max: stats.max });
	}
	if (stats.nanCount > 0 || stats.infCount > 0) {
		warnings.push({ type: "nan_inf", severity: "critical", nanCount: stats.nanCount, infCount: stats.infCount });
	}
	return warnings;
}

// ============================================================
// RENDERING
// ============================================================

function renderLayerIOStats(divTarget) {
	var container;

	// Singleton: reuse existing container
	if (layerIOStats._container && document.body.contains(layerIOStats._container)) {
		container = layerIOStats._container;
	} else if (typeof divTarget === "string") {
		container = document.getElementById(divTarget);
		if (!container) {
			container = document.createElement("div");
			container.id = divTarget;
			document.body.appendChild(container);
		}
	} else if (divTarget instanceof HTMLElement) {
		container = divTarget;
	} else {
		container = document.createElement("div");
		container.id = "layer_io_monitor";
		document.body.appendChild(container);
	}

	layerIOStats._container = container;
	container.className = "layer_io_monitor";

	// Inject styles once
	if (!document.getElementById("layer_io_styles")) {
		var style = document.createElement("style");
		style.id = "layer_io_styles";
		style.textContent = `
	    .layer_io_monitor {
		padding: 20px;
		max-height: 90vh;
		overflow-y: auto;
	    }
	    .layer_io_monitor h2 {
		margin: 0 0 12px 0;
	    }
	    .layer_io_monitor .lio_subtitle {
		opacity: 0.6;
		margin: 0 0 16px 0;
		font-size: 0.85em;
	    }
	    .layer_io_monitor .lio_card {
		border: 2px solid var(--border-color, #ddd);
		border-radius: 8px;
		padding: 14px;
		margin: 10px 0;
		transition: border-color 0.3s;
	    }
	    .layer_io_monitor .lio_card.lio_healthy { border-color: #2ecc71; }
	    .layer_io_monitor .lio_card.lio_warning { border-color: #f39c12; }
	    .layer_io_monitor .lio_card.lio_critical { border-color: #e74c3c; }
	    .layer_io_monitor .lio_header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 8px;
	    }
	    .layer_io_monitor .lio_header strong {
		font-size: 1.05em;
	    }
	    .layer_io_monitor .lio_header .lio_type {
		opacity: 0.5;
		font-weight: normal;
	    }
	    .layer_io_monitor .lio_header .lio_shape {
		font-size: 0.8em;
		opacity: 0.5;
	    }
	    .layer_io_monitor .lio_warnings {
		background: rgba(231, 76, 60, 0.1);
		border: 1px solid #e74c3c;
		border-radius: 4px;
		padding: 6px 10px;
		margin-bottom: 8px;
		font-size: 0.9em;
	    }
	    .layer_io_monitor .lio_stats_grid {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 8px;
	    }
	    .layer_io_monitor .lio_stats_box {
		border-radius: 6px;
		padding: 8px 10px;
		background: rgba(128,128,128,0.08);
	    }
	    .layer_io_monitor .lio_stats_box h4 {
		margin: 0 0 4px 0;
		font-size: 0.8em;
		text-transform: uppercase;
		opacity: 0.6;
	    }
	    .layer_io_monitor .lio_stats_box table {
		width: 100%;
		font-size: 0.82em;
		border-collapse: collapse;
	    }
	    .layer_io_monitor .lio_stats_box td {
		padding: 1px 4px;
	    }
	    .layer_io_monitor .lio_stats_box td:first-child {
		opacity: 0.6;
	    }
	    .layer_io_monitor .lio_stats_box td:last-child {
		text-align: right;
		font-variant-numeric: tabular-nums;
	    }
	    .layer_io_monitor .lio_plot_section {
		margin-top: 8px;
	    }
	    .layer_io_monitor .lio_plot_label {
		font-size: 0.75em;
		opacity: 0.5;
		margin-bottom: 2px;
	    }
	    .layer_io_monitor .lio_aggregate {
		margin-top: 20px;
		padding: 14px;
		border-radius: 8px;
		background: rgba(128,128,128,0.06);
		border: 1px solid rgba(128,128,128,0.2);
	    }
	    .layer_io_monitor .lio_aggregate h3 {
		margin: 0 0 10px 0;
	    }
	    .layer_io_monitor .lio_ok { color: #2ecc71; }
	    .layer_io_monitor .lio_warn { color: #f39c12; }
	    .layer_io_monitor .lio_crit { color: #e74c3c; }
	    .layer_io_monitor .lio_multi_plot {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 12px;
		margin-top: 12px;
	    }
	    .layer_io_monitor .lio_multi_plot > div {
		background: rgba(128,128,128,0.05);
		border-radius: 6px;
		padding: 8px;
	    }
	    .layer_io_monitor .lio_temml {
		margin-top: 6px;
		font-size: 0.9em;
	    }
	`;
		document.head.appendChild(style);
	}

	var T = function (key) {
		try { return language[lang][key] || key; } catch (e) { return key; }
	};

	if (layerIOStats.records.length === 0) {
		container.innerHTML = "<p style='opacity:0.6;'>" + T("layer_io_no_data") + "</p>";
		return container;
	}

	var latestRecord = layerIOStats.records[layerIOStats.records.length - 1];
	var html = "";

	html += "<h2>" + T("layer_io_title") + "</h2>";
	html += "<p class='lio_subtitle'>" + T("layer_io_record") + " #" + layerIOStats.records.length +
		" | " + new Date(latestRecord.timestamp).toLocaleTimeString() +
		" | " + T("layer_io_total") + ": " + layerIOStats.records.length + "</p>";

	// Per-layer cards
	for (var i = 0; i < latestRecord.layers.length; i++) {
		var layer = latestRecord.layers[i];
		var inputStats = layer.input ? _computeStats(layer.input) : null;
		var outputStats = _computeStats(layer.output);
		var warnings = _detectWarnings(layer);
		var histogram = _computeHistogram(layer.output, 40);

		var cardClass = warnings.length === 0 ? "lio_healthy" :
			warnings.some(function (w) { return w.severity === "critical"; }) ? "lio_critical" : "lio_warning";

		html += "<div class='lio_card " + cardClass + "'>";

		// Header
		html += "<div class='lio_header'>";
		html += "<strong>[" + layer.layerIndex + "] " + layer.layerName + " <span class='lio_type'>(" + layer.layerType + ")</span></strong>";
		html += "<span class='lio_shape'>" + T("layer_io_shape") + ": [" + (layer.outputShape || "?").toString() + "]</span>";
		html += "</div>";

		// Warnings
		if (warnings.length > 0) {
			html += "<div class='lio_warnings'>";
			for (var w = 0; w < warnings.length; w++) {
				var wn = warnings[w];
				var icon = wn.severity === "critical" ? "🔴" : "🟡";
				var msg = "";
				if (wn.type === "dying_relu") msg = T("layer_io_dying_relu") + ": " + (wn.zeroFraction * 100).toFixed(1) + "% " + T("layer_io_zeros").toLowerCase();
				else if (wn.type === "exploding") msg = T("layer_io_exploding") + " [" + wn.min.toExponential(1) + ", " + wn.max.toExponential(1) + "]";
				else if (wn.type === "saturated") msg = T("layer_io_saturated") + " (std=" + wn.std.toExponential(2) + ")";
				else if (wn.type === "nan_inf") msg = T("layer_io_nan_inf") + " (NaN:" + wn.nanCount + ", Inf:" + wn.infCount + ")";
				html += "<div>" + icon + " " + msg + "</div>";
			}
			html += "</div>";
		}

		// Stats grid
		html += "<div class='lio_stats_grid'>";
		if (inputStats) {
			html += "<div class='lio_stats_box'><h4>" + T("layer_io_input") + "</h4>";
			html += _statsTable(inputStats, T);
			html += "</div>";
		}
		if (outputStats) {
			html += "<div class='lio_stats_box'><h4>" + T("layer_io_output") + "</h4>";
			html += _statsTable(outputStats, T);
			html += "</div>";
		}
		html += "</div>";

		// Histogram
		if (histogram && histogram.counts && histogram.binWidth > 0) {
			html += "<div class='lio_plot_section'>";
			html += "<div class='lio_plot_label'>" + T("layer_io_output_distribution") + "</div>";
			html += _histogramSVG(histogram, warnings);
			html += "</div>";
		}

		// Temml
		if (outputStats) {
			html += "<div class='lio_temml' data-temml='1'>";
			html += "\\mu = " + outputStats.mean.toFixed(4) +
				", \\; \\sigma = " + outputStats.std.toFixed(4) +
				", \\; \\text{" + T("layer_io_zeros").toLowerCase() + "} = " + (outputStats.zeroFraction * 100).toFixed(1) + "\\%";
			html += "</div>";
		}

		html += "</div>"; // end card
	}

	// Aggregate section with multiple plots
	html += _renderAggregateSection(latestRecord, T);

	container.innerHTML = html;

	// Render temml
	try {
		var els = container.querySelectorAll("[data-temml]");
		for (var t = 0; t < els.length; t++) {
			try {
				els[t].innerHTML = temml.renderToString(els[t].textContent, { displayMode: false });
			} catch (e) { }
		}
	} catch (e) { }

	return container;
}

function _statsTable(stats, T) {
	var html = "<table>";
	var rows = [
		[T("layer_io_min"), stats.min === Infinity ? "N/A" : stats.min.toFixed(5)],
		[T("layer_io_max"), stats.max === -Infinity ? "N/A" : stats.max.toFixed(5)],
		[T("layer_io_mean"), stats.mean.toFixed(5)],
		[T("layer_io_std"), stats.std.toFixed(5)],
		[T("layer_io_zeros"), stats.zeros + " (" + (stats.zeroFraction * 100).toFixed(1) + "%)"],
		[T("layer_io_negatives"), stats.negatives + " (" + (stats.negativeFraction * 100).toFixed(1) + "%)"],
		[T("layer_io_count"), stats.count.toString()]
	];
	if (stats.nanCount > 0) rows.push(["NaN", "<span class='lio_crit'>" + stats.nanCount + "</span>"]);
	if (stats.infCount > 0) rows.push(["Inf", "<span class='lio_crit'>" + stats.infCount + "</span>"]);

	for (var r = 0; r < rows.length; r++) {
		html += "<tr><td>" + rows[r][0] + "</td><td>" + rows[r][1] + "</td></tr>";
	}
	html += "</table>";
	return html;
}

function _histogramSVG(histogram, warnings) {
	var width = 380, height = 50;
	var maxCount = Math.max.apply(null, histogram.counts) || 1;
	var barWidth = width / histogram.counts.length;
	var isDying = warnings.some(function (w) { return w.type === "dying_relu"; });

	var svg = "<svg width='100%' viewBox='0 0 " + width + " " + (height + 16) + "' style='display:block; max-width:500px;'>";

	for (var i = 0; i < histogram.counts.length; i++) {
		var barHeight = (histogram.counts[i] / maxCount) * height;
		var x = i * barWidth;
		var y = height - barHeight;
		var binCenter = histogram.binEdges[i] + histogram.binWidth / 2;

		var color;
		if (isDying && Math.abs(binCenter) < histogram.binWidth) color = "#e74c3c";
		else if (binCenter < 0) color = "#3498db";
		else color = "#2ecc71";

		svg += "<rect x='" + x + "' y='" + y + "' width='" + Math.max(barWidth - 0.5, 0.5) +
			"' height='" + barHeight + "' fill='" + color + "' opacity='0.75'/>";
	}

	// Zero line
	if (histogram.min < 0 && histogram.max > 0) {
		var zeroX = ((0 - histogram.min) / (histogram.max - histogram.min)) * width;
		svg += "<line x1='" + zeroX + "' y1='0' x2='" + zeroX + "' y2='" + height + "' stroke='currentColor' stroke-width='0.5' stroke-dasharray='2,2' opacity='0.4'/>";
	}

	svg += "<text x='0' y='" + (height + 12) + "' font-size='9' fill='currentColor' opacity='0.5'>" + histogram.min.toFixed(2) + "</text>";
	svg += "<text x='" + (width - 35) + "' y='" + (height + 12) + "' font-size='9' fill='currentColor' opacity='0.5'>" + histogram.max.toFixed(2) + "</text>";

	svg += "</svg>";
	return svg;
}

function _renderAggregateSection(record, T) {
	var html = "<div class='lio_aggregate'>";
	html += "<h3>" + T("layer_io_health_check") + "</h3>";

	var dyingLayers = [], explodingLayers = [], saturatedLayers = [], nanLayers = [];

	for (var i = 0; i < record.layers.length; i++) {
		var warnings = _detectWarnings(record.layers[i]);
		for (var w = 0; w < warnings.length; w++) {
			if (warnings[w].type === "dying_relu") dyingLayers.push(record.layers[i].layerName);
			if (warnings[w].type === "exploding") explodingLayers.push(record.layers[i].layerName);
			if (warnings[w].type === "saturated") saturatedLayers.push(record.layers[i].layerName);
			if (warnings[w].type === "nan_inf") nanLayers.push(record.layers[i].layerName);
		}
	}

	if (dyingLayers.length === 0 && explodingLayers.length === 0 && saturatedLayers.length === 0 && nanLayers.length === 0) {
		html += "<div class='lio_ok'>✅ " + T("layer_io_all_healthy") + "</div>";
	} else {
		if (dyingLayers.length > 0) html += "<div class='lio_crit'>🔴 " + T("layer_io_dying_relu") + ": " + dyingLayers.join(", ") + "</div>";
		if (explodingLayers.length > 0) html += "<div class='lio_crit'>🔴 " + T("layer_io_exploding") + ": " + explodingLayers.join(", ") + "</div>";
		if (nanLayers.length > 0) html += "<div class='lio_crit'>🔴 " + T("layer_io_nan_inf") + ": " + nanLayers.join(", ") + "</div>";
		if (saturatedLayers.length > 0) html += "<div class='lio_warn'>🟡 " + T("layer_io_saturated") + ": " + saturatedLayers.join(", ") + "</div>";
	}

	// Multi-plot section
	html += "<div class='lio_multi_plot'>";

	// Plot 1: Magnitude per layer (bar chart)
	html += "<div><div class='lio_plot_label'>" + T("layer_io_magnitude_per_layer") + "</div>";
	html += _barChartSVG(record, function (s) { return Math.abs(s.mean) + s.std; }, function (s) {
		return s.zeroFraction > 0.8 ? "#e74c3c" : s.std < 1e-6 ? "#f39c12" : "#2ecc71";
	});
	html += "</div>";

	// Plot 2: Zero fraction per layer
	html += "<div><div class='lio_plot_label'>" + T("layer_io_zero_fraction_per_layer") + "</div>";
	html += _barChartSVG(record, function (s) { return s.zeroFraction; }, function (s) {
		return s.zeroFraction > 0.8 ? "#e74c3c" : s.zeroFraction > 0.5 ? "#f39c12" : "#2ecc71";
	});
	html += "</div>";

	// Plot 3: Std per layer
	html += "<div><div class='lio_plot_label'>" + T("layer_io_std_per_layer") + "</div>";
	html += _barChartSVG(record, function (s) { return s.std; }, function (s) {
		return s.std < 1e-6 ? "#e74c3c" : s.std > 100 ? "#f39c12" : "#3498db";
	});
	html += "</div>";

	// Plot 4: Mean flow (line chart)
	html += "<div><div class='lio_plot_label'>" + T("layer_io_mean_flow") + "</div>";
	html += _lineChartSVG(record, function (s) { return s.mean; }, "#00d4ff");
	html += "</div>";

	html += "</div>"; // end lio_multi_plot
	html += "</div>"; // end lio_aggregate

	return html;
}

function _barChartSVG(record, valueFn, colorFn) {
	var width = 200, height = 50;
	var values = [];
	var colors = [];

	for (var i = 0; i < record.layers.length; i++) {
		var s = _computeStats(record.layers[i].output);
		if (!s) { values.push(0); colors.push("#555"); continue; }
		var v = valueFn(s);
		values.push(isFinite(v) ? v : 0);
		colors.push(colorFn(s));
	}

	if (values.length === 0) return "";

	var maxVal = Math.max.apply(null, values.map(function (v) { return Math.abs(v); })) || 1;
	var barWidth = Math.max(2, (width / values.length) - 1);

	var svg = "<svg width='100%' viewBox='0 0 " + width + " " + (height + 14) + "' style='display:block; max-width:250px;'>";

	for (var i = 0; i < values.length; i++) {
		var barH = (Math.abs(values[i]) / maxVal) * height;
		var x = i * (barWidth + 1);
		var y = height - barH;

		svg += "<rect x='" + x + "' y='" + y + "' width='" + barWidth +
			"' height='" + barH + "' fill='" + colors[i] + "' opacity='0.85' rx='1'>";
		svg += "<title>" + record.layers[i].layerName + ": " + values[i].toFixed(4) + "</title>";
		svg += "</rect>";
	}

	// X-axis
	svg += "<line x1='0' y1='" + height + "' x2='" + width + "' y2='" + height + "' stroke='currentColor' opacity='0.2' stroke-width='0.5'/>";

	// Labels for first and last
	if (values.length > 0) {
		svg += "<text x='0' y='" + (height + 11) + "' font-size='7' fill='currentColor' opacity='0.4'>0</text>";
		svg += "<text x='" + ((values.length - 1) * (barWidth + 1)) + "' y='" + (height + 11) + "' font-size='7' fill='currentColor' opacity='0.4'>" + (values.length - 1) + "</text>";
	}

	svg += "</svg>";
	return svg;
}

function _lineChartSVG(record, valueFn, color) {
	var width = 200, height = 50;
	var values = [];

	for (var i = 0; i < record.layers.length; i++) {
		var s = _computeStats(record.layers[i].output);
		if (!s) { values.push(0); continue; }
		var v = valueFn(s);
		values.push(isFinite(v) ? v : 0);
	}

	if (values.length < 2) return "";

	var minVal = Math.min.apply(null, values);
	var maxVal = Math.max.apply(null, values);
	var range = maxVal - minVal || 1;

	var points = [];
	for (var i = 0; i < values.length; i++) {
		var x = (i / (values.length - 1)) * width;
		var y = height - ((values[i] - minVal) / range) * height;
		points.push(x.toFixed(1) + "," + y.toFixed(1));
	}

	var svg = "<svg width='100%' viewBox='0 0 " + width + " " + (height + 14) + "' style='display:block; max-width:250px;'>";

	// Zero line if applicable
	if (minVal < 0 && maxVal > 0) {
		var zeroY = height - ((0 - minVal) / range) * height;
		svg += "<line x1='0' y1='" + zeroY + "' x2='" + width + "' y2='" + zeroY + "' stroke='currentColor' opacity='0.2' stroke-width='0.5' stroke-dasharray='2,2'/>";
	}

	// Line
	svg += "<polyline points='" + points.join(" ") + "' fill='none' stroke='" + color + "' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/>";

	// Dots
	for (var i = 0; i < values.length; i++) {
		var x = (i / (values.length - 1)) * width;
		var y = height - ((values[i] - minVal) / range) * height;
		svg += "<circle cx='" + x.toFixed(1) + "' cy='" + y.toFixed(1) + "' r='2' fill='" + color + "'>";
		svg += "<title>" + record.layers[i].layerName + ": " + values[i].toFixed(4) + "</title>";
		svg += "</circle>";
	}

	// Y-axis labels
	svg += "<text x='0' y='" + (height + 11) + "' font-size='7' fill='currentColor' opacity='0.4'>" + minVal.toFixed(2) + "</text>";
	svg += "<text x='" + (width - 30) + "' y='" + (height + 11) + "' font-size='7' fill='currentColor' opacity='0.4'>" + maxVal.toFixed(2) + "</text>";

	svg += "</svg>";
	return svg;
}
