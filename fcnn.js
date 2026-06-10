"use strict";

// ===== TOOLTIP INFRASTRUCTURE =====

var _fcnn_tooltip_el = null;
var _fcnn_tooltip_visible = false;
var _fcnn_hit_regions = [];
var _fcnn_canvas_mouse_bound = false;

function _compute_histogram_bins(weightData, weightStats, numBins) {
	var bins = new Array(numBins).fill(0);
	var range = weightStats.max - weightStats.min;
	var sampleSize = Math.min(weightData.length, 50000);
	var step = Math.max(1, Math.floor(weightData.length / sampleSize));

	for (var i = 0; i < weightData.length; i += step) {
		var binIdx = Math.min(numBins - 1, Math.floor(((weightData[i] - weightStats.min) / range) * numBins));
		bins[binIdx]++;
	}
	return bins;
}

function _render_histogram_svg(bins, numBins, svgW, svgH, weightStats) {
	var maxBin = Math.max(...bins);
	if (maxBin === 0) return "";

	var barW = svgW / numBins;
	var bars = "";

	for (var b = 0; b < numBins; b++) {
		var barH = (bins[b] / maxBin) * svgH;
		var x = b * barW;
		var y = svgH - barH;
		var t = b / (numBins - 1);
		var color;
		if (t < 0.5) {
			var intensity = Math.round(100 + (1 - t * 2) * 155);
			color = `rgb(60, 80, ${intensity})`;
		} else {
			var intensity = Math.round(100 + (t * 2 - 1) * 155);
			color = `rgb(${intensity}, 60, 60)`;
		}
		bars += `<rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${(barW - 0.5).toFixed(1)}" height="${barH.toFixed(1)}" fill="${color}" opacity="0.8"/>`;
	}

	var range = weightStats.max - weightStats.min;
	var zeroX = ((0 - weightStats.min) / range) * svgW;
	var zeroLine = "";
	if (zeroX > 0 && zeroX < svgW) {
		zeroLine = `<line x1="${zeroX.toFixed(1)}" y1="0" x2="${zeroX.toFixed(1)}" y2="${svgH}" stroke="white" stroke-width="1" opacity="0.7" stroke-dasharray="2,2"/>`;
	}

	return `
	<tr><td colspan="2" style="padding:6px 0 2px;">
	    <div style="font-size:10px;font-weight:600;margin-bottom:3px;opacity:0.7;">Weight Distribution</div>
	    <svg width="${svgW}" height="${svgH}" style="border-radius:4px;background:rgba(0,0,0,0.15);">
		${bars}
		${zeroLine}
	    </svg>
	    <div style="display:flex;justify-content:space-between;font-size:9px;opacity:0.6;margin-top:2px;">
		<span>${_format_number(weightStats.min)}</span>
		<span>0</span>
		<span>${_format_number(weightStats.max)}</span>
	    </div>
	</td></tr>
    `;
}

function _build_weight_histogram_html(weightStats, weightData) {
	if (!weightData || !weightStats || weightStats.count < 2) return "";
	var range = weightStats.max - weightStats.min;
	if (range === 0) return "";

	var numBins = 30;
	var bins = _compute_histogram_bins(weightData, weightStats, numBins);
	return _render_histogram_svg(bins, numBins, 200, 40, weightStats);
}

async function restart_fcnn(force = 0) {
	if ($("#fcnn_canvas").is(":visible")) {
		if (restart_fcnn_timeout) clearTimeout(restart_fcnn_timeout);
		restart_fcnn_timeout = setTimeout(() => {
			restart_fcnn_internal(force); // await not possible
			restart_fcnn_timeout = null;
		}, 100);
	} else {
		if (!restart_fcnn_pending_visible || force) {
			restart_fcnn_pending_visible = true;

			const checkVisible = () => {
				const el = $("#fcnn_canvas");
				if (el.length && el.is(":visible")) {
					restart_fcnn_internal(force); // await not possible
					restart_fcnn_pending_visible = false;
				} else {
					setTimeout(checkVisible, 200);
				}
			};

			checkVisible();
		}
	}
}

async function restart_fcnn_internal(force = 0) {
	if (is_running_test || currently_running_change_data_origin) {
		if (!force) {
			return;
		}
	}

	if (!$("#fcnn_canvas").is(":visible")) {
		return;
	}

	var fcnn_data = get_fcnn_data();

	if (!fcnn_data) {
		return;
	}

	var right_side_width = $("#right_side").width();

	if (!fcnn_data) {
		dbg(language[lang]["could_not_get_fcnn_data"]);
		return;
	}

	var cache_key = await md5(JSON.stringify({
		"right_side_width": right_side_width,
		"fcnn_data": fcnn_data
	}));

	if (last_fcnn_data_hash == cache_key && !force) {
		return;
	}

	last_fcnn_data_hash = cache_key;

	var [names, units, meta_infos] = fcnn_data;

	await draw_fcnn(units, names, meta_infos);

	return true;
}

async function force_restart_fcnn() {
	return await restart_fcnn(1);
}

function get_fcnn_data() {
	var names = [];
	var units = [];
	var meta_infos = [];

	if (!model) {
		dbg("[get_fcnn_data] Model not found for restart_fcnn");
		return;
	}

	if (!Object.keys(model).includes("layers")) {
		dbg("[get_fcnn_data] model.layers not found for restart_fcnn");
		return;
	}

	var nr_layers = model?.layers?.length;

	if (!nr_layers) {
		return;
	}

	var start_layer = 0;

	for (var layer_idx = 0; layer_idx < nr_layers; layer_idx++) {
		var class_name = get_layer_classname_by_nr(layer_idx);

		if (!["Dense", "Flatten", "LayerNormalization"].includes(class_name) && !(typeof class_name === "string" && class_name.toLowerCase().includes("conv2d"))) {
			continue;
		}

		var _unit = get_units_at_layer(layer_idx);
		if (layer_idx == 0) {
			names.push("Input Layer");
		} else if (layer_idx == nr_layers - 1) {
			names.push("Output Layer");
		} else {
			names.push(`${class_name} ${layer_idx}`);
		}

		units.push(_unit);

		var output_shape_of_layer = "";
		try {
			output_shape_of_layer = model.layers[layer_idx].outputShape;
		} catch (e) {}

		var kernel_size_x = $($(".configtable")[layer_idx]).find(".kernel_size_x").val();
		var kernel_size_y = $($(".configtable")[layer_idx]).find(".kernel_size_y").val();

		var input_shape_of_layer = "";
		try {
			input_shape_of_layer = model.layers[layer_idx].input.shape;
		} catch(e) {

		}

		meta_infos.push({
			layer_type: class_name,
			nr: start_layer + layer_idx,
			input_shape: input_shape_of_layer,
			output_shape: output_shape_of_layer,
			kernel_size_x: kernel_size_x,
			kernel_size_y: kernel_size_y
		});
	}

	return [names, units, meta_infos];
}

function _draw_connections_between_layers(ctx, layers, layerSpacing, meta_infos, maxSpacing, canvasHeight, layerY, layerX, maxRadius, _height, maxSpacingConv2d) {
	try {
		for (var layer_nr = 0; layer_nr < layers.length - 1; layer_nr++) {
			draw_layer_connections(ctx, layer_nr, layers, layerSpacing, meta_infos, maxSpacing, canvasHeight, layerY, maxRadius, _height, maxSpacingConv2d);
		}
	} catch (e) {
		if (e && e.message) e = e.message;
		assert(false, e);
	}
}

function _setup_fcnn_canvas() {
	var canvas = document.getElementById("fcnn_canvas");
	if (!canvas) {
		canvas = document.createElement("canvas");
		canvas.id = "fcnn_canvas";
		document.body.appendChild(canvas);
	}
	return canvas;
}

function _compute_fcnn_dimensions(layers, canvasWidth, canvasHeight) {
	var maxNeurons = Math.max(...layers);
	var maxRadius = Math.min(8, (canvasHeight / 2) / maxNeurons, (canvasWidth / 2) / (layers.length + 1));
	var layerSpacing = canvasWidth / (layers.length + 1);
	var maxSpacing = Math.min(maxRadius * 3, (canvasHeight / maxNeurons) * 0.8);
	var maxShapeSize = Math.min(8, (canvasHeight / 2) / maxNeurons, (canvasWidth / 2) / (layers.length + 1));
	var font_size = Math.max(10, Math.min(16, canvasWidth / (layers.length * 12)));

	return { maxNeurons, maxRadius, layerSpacing, maxSpacing, maxShapeSize, font_size };
}

function _compute_max_conv2d_spacing(meta_infos, maxSpacing) {
	var max_conv2d_height = 0;
	meta_infos.forEach(function (i) {
		if (i && i.layer_type && typeof i.layer_type === "string" && i.layer_type.toLowerCase().includes("conv2d")) {
			var os = i.output_shape;
			var height = os && os[1] ? os[1] : 0;
			if (height > max_conv2d_height) {
				max_conv2d_height = height;
			}
		}
	});
	return maxSpacing + max_conv2d_height;
}

async function draw_fcnn(...args) {
	assert(args.length == 3, "draw_fcnn must have 3 arguments");
	if (is_setting_config) return;

	var args_hash = await md5(JSON.stringify(args));
	if (last_fcnn_hash == args_hash) return;
	args_hash = last_fcnn_hash;

	var [layers, _labels, meta_infos] = args;

	var canvas = _setup_fcnn_canvas();
	var ctx = canvas.getContext("2d", { willReadFrequently: true });

	var ghw = $("#graphs_here").width();
	var canvasWidth = Math.max(800, ghw);
	var canvasHeight = 800;
	canvas.width = canvasWidth;
	canvas.height = canvasHeight;
	ctx.clearRect(0, 0, canvasWidth, canvasHeight);

	var dims = _compute_fcnn_dimensions(layers, canvasWidth, canvasHeight);
	var maxSpacingConv2d = _compute_max_conv2d_spacing(meta_infos, dims.maxSpacing);

	_draw_layers_text(layers, meta_infos, ctx, canvasHeight, canvasWidth, dims.layerSpacing, _labels, dims.font_size);
	await _draw_neurons_and_connections(ctx, canvasWidth, layers, meta_infos, dims.layerSpacing, canvasHeight, dims.maxSpacing, dims.maxShapeSize, dims.maxRadius, maxSpacingConv2d, dims.font_size);
}

function draw_first_layer_image(ctx, maxVal, minVal, n, m, first_layer_input, font_size) {
	if (maxVal != minVal) {
		var scale = 255 / (maxVal - minVal);

		var imageData = ctx.createImageData(m, n);

		for (var row = 0; row < n; row++) {
			for (var col = 0; col < m; col++) {
				var dataIndex = (row * m + col) * 4;

				var red   = parse_int((first_layer_input[row][col][0] - minVal) * scale);
				var green = parse_int((first_layer_input[row][col][1] - minVal) * scale);
				var blue  = parse_int((first_layer_input[row][col][2] - minVal) * scale);

				red   = Math.max(0, Math.min(255, red));
				green = Math.max(0, Math.min(255, green));
				blue  = Math.max(0, Math.min(255, blue));

				imageData.data[dataIndex + 0] = red;
				imageData.data[dataIndex + 1] = green;
				imageData.data[dataIndex + 2] = blue;
				imageData.data[dataIndex + 3] = 255;
			}
		}

		var _first_image_x = 10;
		var _first_image_y = font_size + 10;

		ctx.putImageData(imageData, _first_image_x, _first_image_y, 0, 0, m, n);

		ctx.font = font_size + "px Arial";
		if (is_dark_mode) {
			ctx.fillStyle = "white";
		} else {
			ctx.fillStyle = "black";
		}
		ctx.textAlign = "left";
		ctx.closePath();

		ctx.strokeStyle = "black";
		ctx.lineWidth = 1;
		ctx.strokeRect(_first_image_x, _first_image_y, m, n);
	}

	return ctx;
}

function _validate_kernel_inputs(ctx, this_layer_output) {
	if (!(ctx && typeof ctx.putImageData === "function")) {
		console.warn("draw_filled_kernel_rectangle: ctx is invalid");
		return null;
	}
	if (!Array.isArray(this_layer_output) || this_layer_output.length === 0) {
		console.warn("draw_filled_kernel_rectangle: this_layer_output is empty");
		return null;
	}
	let n = this_layer_output.length;
	let m = Array.isArray(this_layer_output[0]) ? this_layer_output[0].length : 0;
	if (m === 0) {
		console.warn("draw_filled_kernel_rectangle: invalid row");
		return null;
	}
	return { n, m };
}

function _compute_kernel_min_max(n, m, this_layer_output, minVal, maxVal) {
	var [calcMin, calcMax] = get_min_max_val(n, m, this_layer_output);
	if (!isFinite(calcMin) || !isFinite(calcMax)) return null;

	minVal = (typeof minVal === "number" && isFinite(minVal)) ? minVal : calcMin;
	maxVal = (typeof maxVal === "number" && isFinite(maxVal)) ? maxVal : calcMax;
	if (maxVal === minVal) maxVal = minVal + 1;

	return { minVal, maxVal };
}

function _build_kernel_image_data(ctx, this_layer_output, n, m, minVal, maxVal) {
	var scale = 255 / (maxVal - minVal);
	var imageData;
	try {
		imageData = ctx.createImageData(m, n);
	} catch (e) {
		console.error("draw_filled_kernel_rectangle: failed to create ImageData", e);
		return null;
	}

	for (var x = 0; x < n; x++) {
		if (!Array.isArray(this_layer_output[x]) || this_layer_output[x].length !== m) continue;
		for (var y = 0; y < m; y++) {
			var rawVal = this_layer_output[x][y];
			if (typeof rawVal !== "number" || !isFinite(rawVal)) continue;
			var value = Math.floor((rawVal - minVal) * scale);
			var index = (x * m + y) * 4;
			var gray = Math.abs(255 - value);
			imageData.data[index] = gray;
			imageData.data[index + 1] = gray;
			imageData.data[index + 2] = gray;
			imageData.data[index + 3] = 255;
		}
	}
	return imageData;
}

function _render_kernel_to_canvas(ctx, imageData, meta_info, m, n, layerX, neuronY) {
	var _ww = Number(meta_info?.input_shape?.[1]);
	var _hh = Number(meta_info?.input_shape?.[2]);
	if (!Number.isInteger(_ww) || !Number.isInteger(_hh) || _ww <= 0 || _hh <= 0) {
		_ww = m;
		_hh = n;
	}

	var _x = Math.floor(layerX - _ww / 2);
	var _y = Math.floor(neuronY - _hh / 2);

	var tempCanvas = document.createElement("canvas");
	tempCanvas.width = m;
	tempCanvas.height = n;
	var tctx = tempCanvas.getContext("2d");
	tctx.putImageData(imageData, 0, 0);
	ctx.drawImage(tempCanvas, _x, _y, _ww, _hh);

	ctx.strokeStyle = "black";
	ctx.lineWidth = 1;
	ctx.strokeRect(_x, _y, _ww, _hh);
}

function draw_filled_kernel_rectangle(ctx, meta_info, this_layer_output, n, m, minVal, maxVal, layerX, neuronY) {
	try {
		var dims = _validate_kernel_inputs(ctx, this_layer_output);
		if (!dims) return ctx;

		var bounds = _compute_kernel_min_max(dims.n, dims.m, this_layer_output, minVal, maxVal);
		if (!bounds) return ctx;

		var imageData = _build_kernel_image_data(ctx, this_layer_output, dims.n, dims.m, bounds.minVal, bounds.maxVal);
		if (!imageData) return ctx;

		_render_kernel_to_canvas(ctx, imageData, meta_info, dims.m, dims.n, layerX, neuronY);
	} catch (err) {
		console.error("draw_filled_kernel_rectangle: unexpected error", err);
	}
	return ctx;
}

function draw_empty_kernel_rectangle(ctx, meta_info, verticalSpacing, layerX, neuronY) {
	var _ww = Math.min(meta_info["kernel_size_x"] * 3, verticalSpacing - 2);
	var _hh = Math.min(meta_info["kernel_size_y"] * 3, verticalSpacing - 2);

	var _x = layerX - _ww / 2;
	var _y = neuronY - _hh / 2;

	ctx.rect(_x, _y, _ww, _hh);
	ctx.fillStyle = "#c2e3ed";
	ctx.fill();

	ctx.closePath();

	ctx.strokeStyle = "black";
	ctx.lineWidth = 1;
	ctx.strokeRect(_x, _y, _ww, _hh);

	return ctx;
}

function annotate_output_neurons(canvasWidth, ctx, layerId, numNeurons, j, font_size, layerX, neuronY) {
	ctx.strokeStyle = "black";
	ctx.lineWidth = 1;
	ctx.fill();
	ctx.stroke();
	ctx.closePath();

	var nr_layers = model?.layers?.length;

	if (!nr_layers) {
		return ctx;
	}

	if (layerId == nr_layers - 1 && get_last_layer_activation_function() == "softmax") {
		if (labels && Array.isArray(labels) && labels.length && Object.keys(labels).includes(`${j}`) && numNeurons == labels.length) {
			ctx.beginPath();
			ctx.font = font_size + "px Arial";
			if (is_dark_mode) {
				ctx.fillStyle = "white";
			} else {
				ctx.fillStyle = "black";
			}
			ctx.textAlign = "left";
			ctx.fillText(labels[j], layerX + 30, neuronY + (font_size / 2));
			ctx.closePath();
		}
	}

	return ctx;
}

function draw_neuron_with_normalized_color(ctx, this_layer_output, layerX, neuronY, radius, j) {
	ctx.beginPath();
	ctx.arc(layerX, neuronY, radius, 0, 2 * Math.PI);
	ctx.fillStyle = "#767b8d";  // gray base circle
	ctx.fill();

	if (this_layer_output && this_layer_output.length > 0) {
		var minVal = Math.min(...this_layer_output);
		var maxVal = Math.max(...this_layer_output);
		var value = this_layer_output[j];

		var normalizedValue;
		if (maxVal === minVal) {
			normalizedValue = 128; // all equal → neutral gray
		} else {
			normalizedValue = Math.floor(((value - minVal) / (maxVal - minVal)) * 255);
			normalizedValue = Math.max(0, Math.min(255, normalizedValue)); // clamp
		}

		var color = `rgb(${normalizedValue}, ${normalizedValue}, ${normalizedValue})`;

		ctx.beginPath();
		ctx.arc(layerX, neuronY, radius - 1, 0, 2 * Math.PI);
		ctx.fillStyle = color;
		ctx.fill();
	} else {
		ctx.beginPath();
		ctx.arc(layerX, neuronY, radius - 1, 0, 2 * Math.PI);
		ctx.fillStyle = "#ffffff";  // no value → white
		ctx.fill();
	}

	return ctx;
}

// ===== TOOLTIP INFRASTRUCTURE =====

var _fcnn_tooltip_el = null;
var _fcnn_tooltip_visible = false;
var _fcnn_hit_regions = [];
var _fcnn_canvas_mouse_bound = false;

function _get_tooltip_styles(dark) {
	return `
	position: fixed;
	z-index: 999999;
	pointer-events: none;
	background: ${dark
			? 'linear-gradient(135deg, rgba(20,25,40,0.97), rgba(30,35,55,0.97))'
			: 'linear-gradient(135deg, rgba(255,255,255,0.99), rgba(245,248,255,0.99))'};
	color: ${dark ? '#e8ecf4' : '#1a1a2e'};
	border: 1px solid ${dark ? 'rgba(100,140,255,0.3)' : 'rgba(70,100,200,0.2)'};
	border-radius: 12px;
	padding: 14px 18px;
	font-family: 'Inter', 'SF Pro Display', 'Segoe UI', system-ui, sans-serif;
	font-size: 12px;
	line-height: 1.6;
	max-width: 440px;
	max-height: 520px;
	overflow: auto;
	box-shadow: 0 8px 32px rgba(0,0,0,${dark ? '0.5' : '0.12'}),
	    0 2px 8px rgba(0,0,0,${dark ? '0.3' : '0.06'}),
	    inset 0 1px 0 rgba(255,255,255,${dark ? '0.05' : '0.8'});
	display: none;
	transition: opacity 0.15s cubic-bezier(0.4, 0, 0.2, 1),
	    transform 0.15s cubic-bezier(0.4, 0, 0.2, 1);
	opacity: 0;
	transform: translateY(4px) scale(0.98);
	backdrop-filter: blur(12px);
	-webkit-backdrop-filter: blur(12px);
    `;
}

function _ensure_fcnn_tooltip() {
	if (_fcnn_tooltip_el && document.body.contains(_fcnn_tooltip_el)) return _fcnn_tooltip_el;

	_fcnn_tooltip_el = document.createElement("div");
	_fcnn_tooltip_el.id = "fcnn_tooltip_overlay";

	var dark = (typeof is_dark_mode !== 'undefined' && is_dark_mode);
	_fcnn_tooltip_el.style.cssText = _get_tooltip_styles(dark);

	document.body.appendChild(_fcnn_tooltip_el);
	return _fcnn_tooltip_el;
}

function _show_fcnn_tooltip(html, mouseX, mouseY) {
	var tip = _ensure_fcnn_tooltip();
	// ... (existing positioning logic) ...
	tip.innerHTML = html;
	tip.style.display = "block";
	// Trigger animation
	requestAnimationFrame(() => {
		tip.style.opacity = "1";
		tip.style.transform = "translateY(0) scale(1)";
	});
	_fcnn_tooltip_visible = true;
}

function _hide_fcnn_tooltip() {
	if (_fcnn_tooltip_el) {
		_fcnn_tooltip_el.style.opacity = "0";
		_fcnn_tooltip_el.style.transform = "translateY(4px) scale(0.98)";
		setTimeout(() => {
			if (_fcnn_tooltip_el && !_fcnn_tooltip_visible) {
				_fcnn_tooltip_el.style.display = "none";
			}
		}, 150);
	}
	_fcnn_tooltip_visible = false;
}

function _register_fcnn_hit_region(region) {
	// region: { type, shape, x, y, w, h, radius, layer_idx, neuron_idx, meta, data, ... }
	_fcnn_hit_regions.push(region);
}

function _clear_fcnn_hit_regions() {
	_fcnn_hit_regions = [];
}

function _point_in_region(px, py, region) {
	try {
		if (region.shape === "circle") {
			var dx = px - region.x;
			var dy = py - region.y;
			return (dx * dx + dy * dy) <= (region.radius * region.radius);
		} else {
			// rectangle
			return px >= region.x && px <= region.x + region.w && py >= region.y && py <= region.y + region.h;
		}
	} catch (e) {
		return false;
	}
}

function _format_number(val) {
	if (val === null || val === undefined) return "N/A";
	if (!isFinite(val)) return String(val);
	if (Math.abs(val) < 0.001 && val !== 0) return val.toExponential(4);
	return parseFloat(val.toFixed(6)).toString();
}

function _compute_stats(arr) {
	if (!arr || !arr.length) return null;
	var min = Infinity, max = -Infinity, sum = 0, count = 0;
	for (var i = 0; i < arr.length; i++) {
		var v = arr[i];
		if (typeof v !== "number" || !isFinite(v)) continue;
		if (v < min) min = v;
		if (v > max) max = v;
		sum += v;
		count++;
	}
	if (count === 0) return null;
	var avg = sum / count;

	// Std dev
	var sqSum = 0;
	for (var i = 0; i < arr.length; i++) {
		var v = arr[i];
		if (typeof v !== "number" || !isFinite(v)) continue;
		sqSum += (v - avg) * (v - avg);
	}
	var std = Math.sqrt(sqSum / count);

	return { min: min, max: max, avg: avg, std: std, count: count, sum: sum };
}

function _compute_local_min_max(data2d, rows, cols) {
	var mn = Infinity, mx = -Infinity;
	for (var r = 0; r < rows; r++) {
		for (var col = 0; col < cols; col++) {
			var v = data2d[r][col];
			if (typeof v === "number" && isFinite(v)) {
				if (v < mn) mn = v;
				if (v > mx) mx = v;
			}
		}
	}
	return { min: mn, max: mx };
}

function _create_scaled_canvas(rows, cols, maxDisplaySize) {
	var pixelScale = Math.max(1, Math.floor(maxDisplaySize / Math.max(rows, cols)));
	var c = document.createElement("canvas");
	c.width = cols * pixelScale;
	c.height = rows * pixelScale;
	return { canvas: c, pixelScale: pixelScale };
}

function _render_inverted_grayscale_pixels(cx, data2d, rows, cols, pixelScale, mn, scale) {
	for (var r = 0; r < rows; r++) {
		for (var col = 0; col < cols; col++) {
			var v = data2d[r][col];
			var value = Math.floor((v - mn) * scale);
			var gray = Math.max(0, Math.min(255, Math.abs(255 - value)));
			cx.fillStyle = `rgb(${gray},${gray},${gray})`;
			cx.fillRect(col * pixelScale, r * pixelScale, pixelScale, pixelScale);
		}
	}
}

function _make_mini_canvas_data_url_inverted(data2d, width, height, maxDisplaySize, globalMin, globalMax) {
	try {
		if (!data2d || !data2d.length) return null;
		var rows = data2d.length;
		var cols = Array.isArray(data2d[0]) ? data2d[0].length : 0;
		if (cols === 0) return null;

		var mn = (typeof globalMin === "number" && isFinite(globalMin)) ? globalMin : null;
		var mx = (typeof globalMax === "number" && isFinite(globalMax)) ? globalMax : null;

		if (mn === null || mx === null) {
			var local = _compute_local_min_max(data2d, rows, cols);
			mn = mn !== null ? mn : local.min;
			mx = mx !== null ? mx : local.max;
		}
		if (mn === mx) mx = mn + 1;

		var scale = 255 / (mx - mn);
		maxDisplaySize = maxDisplaySize || 64;

		var { canvas: c, pixelScale } = _create_scaled_canvas(rows, cols, maxDisplaySize);
		var cx = c.getContext("2d");

		_render_inverted_grayscale_pixels(cx, data2d, rows, cols, pixelScale, mn, scale);

		return c.toDataURL("image/png");
	} catch (e) {
		return null;
	}
}

// ===== EXTRACTED HELPERS FOR _make_mini_canvas_rgb_data_url =====

function _compute_rgb_global_min_max(data3d, rows, cols) {
	var mn = Infinity, mx = -Infinity;
	for (var r = 0; r < rows; r++) {
		for (var col = 0; col < cols; col++) {
			if (data3d[r] && data3d[r][col]) {
				for (var ch2 = 0; ch2 < 3; ch2++) {
					var v = data3d[r][col][ch2];
					if (typeof v === "number" && isFinite(v)) {
						if (v < mn) mn = v;
						if (v > mx) mx = v;
					}
				}
			}
		}
	}
	if (mn === mx) mx = mn + 1;
	return { min: mn, max: mx };
}

function _render_rgb_pixels_to_canvas(cx, data3d, rows, cols, scale, mn, sc) {
	for (var r = 0; r < rows; r++) {
		for (var col = 0; col < cols; col++) {
			var pixel = data3d[r][col];
			if (!pixel) continue;
			var red = Math.max(0, Math.min(255, Math.floor((pixel[0] - mn) * sc)));
			var green = Math.max(0, Math.min(255, Math.floor((pixel[1] - mn) * sc)));
			var blue = Math.max(0, Math.min(255, Math.floor((pixel[2] - mn) * sc)));
			cx.fillStyle = `rgb(${red},${green},${blue})`;
			cx.fillRect(col * scale, r * scale, scale, scale);
		}
	}
}

// ===== REFACTORED MAIN FUNCTION =====

function _make_mini_canvas_rgb_data_url(data3d, maxDisplaySize) {
	// data3d: [rows][cols][3] RGB array
	try {
		if (!data3d || !data3d.length) return null;
		var rows = data3d.length;
		var cols = Array.isArray(data3d[0]) ? data3d[0].length : 0;
		if (cols === 0) return null;

		maxDisplaySize = maxDisplaySize || 64;
		var scale = Math.max(1, Math.floor(maxDisplaySize / Math.max(rows, cols)));
		var cw = cols * scale;
		var ch = rows * scale;

		var c = document.createElement("canvas");
		c.width = cw;
		c.height = ch;
		var cx = c.getContext("2d");

		var minMax = _compute_rgb_global_min_max(data3d, rows, cols);
		var sc = 255 / (minMax.max - minMax.min);

		_render_rgb_pixels_to_canvas(cx, data3d, rows, cols, scale, minMax.min, sc);

		return c.toDataURL("image/png");
	} catch (e) {
		return null;
	}
}

// ===== TOOLTIP HTML BUILDERS =====

function _build_neuron_tooltip_html(region) {
	var parts = [];
	parts.push(`<div style="font-weight:bold;font-size:13px;margin-bottom:4px;">♾️ Neuron</div>`);
	parts.push(`<table style="border-collapse:collapse;width:100%;">`);

	var row = function (label, val) {
		return `<tr><td style="padding:2px 6px 2px 0;font-weight:600;white-space:nowrap;">${label}</td><td style="padding:2px 0;">${val}</td></tr>`;
	};

	parts.push(row("Layer", region.layer_idx));
	parts.push(row("Neuron Index", region.neuron_idx));

	if (region.layer_type) parts.push(row("Layer Type", region.layer_type));

	if (region.activation_value !== undefined && region.activation_value !== null) {
		parts.push(row("Activation (real)", `<b>${_format_number(region.activation_value)}</b>`));
	}

	if (region.layer_stats) {
		var s = region.layer_stats;
		parts.push(row("Layer Min", _format_number(s.min)));
		parts.push(row("Layer Max", _format_number(s.max)));
		parts.push(row("Layer Avg", _format_number(s.avg)));
		parts.push(row("Layer Std", _format_number(s.std)));
		parts.push(row("Layer Neuron Count", s.count));

		if (region.activation_value !== undefined && region.activation_value !== null && s.max !== s.min) {
			var rel = ((region.activation_value - s.min) / (s.max - s.min));
			parts.push(row("Relative (0–1)", _format_number(rel)));
			parts.push(row("Percentile-like", (rel * 100).toFixed(1) + "%"));
		}
	}

	if (region.label) parts.push(row("Label", region.label));

	if (region.output_shape) parts.push(row("Output Shape", "[" + region.output_shape.filter(function (n) { return n; }).join(", ") + "]"));
	if (region.input_shape) parts.push(row("Input Shape", "[" + region.input_shape.filter(function (n) { return n; }).join(", ") + "]"));

	parts.push(`</table>`);
	return parts.join("");
}

function _build_conv2d_tooltip_html(region) {
	var parts = [];
	parts.push(`<div style="font-weight:bold;font-size:13px;margin-bottom:4px;">🗺️ Conv2D Feature Map</div>`);
	parts.push(`<table style="border-collapse:collapse;width:100%;">`);

	var row = function (label, val) {
		return `<tr><td style="padding:2px 6px 2px 0;font-weight:600;white-space:nowrap;">${label}</td><td style="padding:2px 0;">${val}</td></tr>`;
	};

	parts.push(row("Layer", region.layer_idx));
	parts.push(row("Channel/Filter", region.neuron_idx));

	if (region.layer_type) parts.push(row("Layer Type", region.layer_type));
	if (region.kernel_size_x && region.kernel_size_y) parts.push(row("Kernel Size", `${region.kernel_size_x} × ${region.kernel_size_y}`));
	if (region.output_shape) parts.push(row("Output Shape", "[" + region.output_shape.filter(function (n) { return n; }).join(", ") + "]"));
	if (region.input_shape) parts.push(row("Input Shape", "[" + region.input_shape.filter(function (n) { return n; }).join(", ") + "]"));

	if (region.channel_stats) {
		var s = region.channel_stats;
		parts.push(row("Channel Min", _format_number(s.min)));
		parts.push(row("Channel Max", _format_number(s.max)));
		parts.push(row("Channel Avg", _format_number(s.avg)));
		parts.push(row("Channel Std", _format_number(s.std)));
		parts.push(row("Pixel Count", s.count));
	}

	parts.push(`</table>`);

	// Show mini image if available
	if (region.image_data_url) {
		parts.push(`<div style="margin-top:6px;text-align:center;"><img src="${region.image_data_url}" style="border:1px solid #888;border-radius:3px;max-width:100px;max-height:100px;image-rendering:pixelated;" title="Feature map visualization"/></div>`);
	}

	return parts.join("");
}

function _build_flatten_tooltip_html(region) {
	var parts = [];
	parts.push(`<div style="font-weight:bold;font-size:13px;margin-bottom:4px;">📏 Flatten Layer</div>`);
	parts.push(`<table style="border-collapse:collapse;width:100%;">`);

	var row = function (label, val) {
		return `<tr><td style="padding:2px 6px 2px 0;font-weight:600;white-space:nowrap;">${label}</td><td style="padding:2px 0;">${val}</td></tr>`;
	};

	parts.push(row("Layer", region.layer_idx));

	if (region.layer_type) parts.push(row("Layer Type", region.layer_type));
	if (region.output_shape) parts.push(row("Output Shape", "[" + region.output_shape.filter(function (n) { return n; }).join(", ") + "]"));
	if (region.input_shape) parts.push(row("Input Shape", "[" + region.input_shape.filter(function (n) { return n; }).join(", ") + "]"));

	if (region.flatten_stats) {
		var s = region.flatten_stats;
		parts.push(row("Min", _format_number(s.min)));
		parts.push(row("Max", _format_number(s.max)));
		parts.push(row("Avg", _format_number(s.avg)));
		parts.push(row("Std", _format_number(s.std)));
		parts.push(row("Total Values", s.count));
	}

	parts.push(`</table>`);

	if (region.image_data_url) {
		parts.push(`<div style="margin-top:6px;text-align:center;"><img src="${region.image_data_url}" style="border:1px solid #888;border-radius:3px;max-width:16px;max-height:200px;image-rendering:pixelated;" title="Flatten values"/></div>`);
	}

	return parts.join("");
}

function _build_layernorm_tooltip_html(region) {
	var parts = [];
	parts.push(`<div style="font-weight:bold;font-size:13px;margin-bottom:4px;">⚖️ Layer Normalization</div>`);
	parts.push(`<table style="border-collapse:collapse;width:100%;">`);

	var row = function (label, val) {
		return `<tr><td style="padding:2px 6px 2px 0;font-weight:600;white-space:nowrap;">${label}</td><td style="padding:2px 0;">${val}</td></tr>`;
	};

	parts.push(row("Layer", region.layer_idx));
	parts.push(row("Block Size (w × h)", `${Math.round(region.w)} × ${Math.round(region.h)}`));
	if (region.layer_type) parts.push(row("Layer Type", region.layer_type));
	if (region.output_shape) parts.push(row("Output Shape", "[" + region.output_shape.filter(function (n) { return n; }).join(", ") + "]"));
	if (region.input_shape) parts.push(row("Input Shape", "[" + region.input_shape.filter(function (n) { return n; }).join(", ") + "]"));

	parts.push(row("Operation", "Normalize → Scale (γ) → Shift (β)"));

	parts.push(`</table>`);
	return parts.join("");
}

function _build_connection_tooltip_html(region) {
	var parts = [];
	parts.push(`<div style="font-weight:bold;font-size:13px;margin-bottom:4px;">🔗 Connection</div>`);
	parts.push(`<table style="border-collapse:collapse;width:100%;">`);

	var row = function (label, val) {
		return `<tr><td style="padding:2px 6px 2px 0;font-weight:600;white-space:nowrap;">${label}</td><td style="padding:2px 0;">${val}</td></tr>`;
	};

	parts.push(row("From Layer", region.from_layer));
	parts.push(row("To Layer", region.to_layer));
	parts.push(row("Connections", `${region.from_neurons} × ${region.to_neurons} = ${region.from_neurons * region.to_neurons}`));

	if (region.weight_stats) {
		var s = region.weight_stats;
		parts.push(row("Weight Min", _format_number(s.min)));
		parts.push(row("Weight Max", _format_number(s.max)));
		parts.push(row("Weight Avg", _format_number(s.avg)));
		parts.push(row("Weight Std", _format_number(s.std)));
		parts.push(row("Total Weights", s.count));

		// Show weight distribution gradient bar
		if (s.min !== s.max) {
			var zeroPos = ((0 - s.min) / (s.max - s.min)) * 100;
			zeroPos = Math.max(0, Math.min(100, zeroPos));
			parts.push(`<tr><td colspan="2" style="padding:4px 0;">
		<div style="position:relative;height:12px;background:linear-gradient(to right, #4444ff, #ffffff ${zeroPos.toFixed(1)}%, #ff4444);border-radius:3px;border:1px solid #888;">
		    <div style="position:absolute;left:${zeroPos.toFixed(1)}%;top:0;bottom:0;width:1px;background:#000;"></div>
		</div>
		<div style="display:flex;justify-content:space-between;font-size:10px;margin-top:2px;">
		    <span>${_format_number(s.min)}</span>
		    <span>0</span>
		    <span>${_format_number(s.max)}</span>
		</div>
	    </td></tr>`);
		}

		// ===== ADD HISTOGRAM IF WE HAVE WEIGHT DATA =====
		if (region.weight_data && region.weight_data.length > 0) {
			parts.push(_build_weight_histogram_html(region.weight_stats, region.weight_data));
		}
	}

	parts.push(`</table>`);
	return parts.join("");
}

function _build_input_image_tooltip_html(region) {
	var parts = [];
	parts.push(`<div style="font-weight:bold;font-size:13px;margin-bottom:4px;">🖼️ Input Image</div>`);
	parts.push(`<table style="border-collapse:collapse;width:100%;">`);

	var row = function (label, val) {
		return `<tr><td style="padding:2px 6px 2px 0;font-weight:600;white-space:nowrap;">${label}</td><td style="padding:2px 0;">${val}</td></tr>`;
	};

	parts.push(row("Dimensions", `${region.img_width} × ${region.img_height}`));
	parts.push(row("Channels", region.channels || "3 (RGB)"));

	if (region.pixel_stats) {
		var s = region.pixel_stats;
		parts.push(row("Pixel Min", _format_number(s.min)));
		parts.push(row("Pixel Max", _format_number(s.max)));
		parts.push(row("Pixel Avg", _format_number(s.avg)));
		parts.push(row("Pixel Std", _format_number(s.std)));
		parts.push(row("Value Count", s.count));

		// Normalized range info
		if (s.min >= -1.5 && s.max <= 1.5) {
			parts.push(row("Normalization", "Likely [-1, 1]"));
		} else if (s.min >= -0.1 && s.max <= 1.1) {
			parts.push(row("Normalization", "Likely [0, 1]"));
		} else if (s.min >= -1 && s.max <= 256) {
			parts.push(row("Normalization", "Likely [0, 255]"));
		}
	}

	parts.push(`</table>`);

	if (region.image_data_url) {
		parts.push(`<div style="margin-top:6px;text-align:center;"><img src="${region.image_data_url}" style="border:1px solid #888;border-radius:3px;max-width:128px;max-height:128px;image-rendering:pixelated;" title="Input image"/></div>`);
	}

	return parts.join("");
}

// ===== MOUSE EVENT BINDING =====

function _bind_fcnn_canvas_mouse_events() {
	if (_fcnn_canvas_mouse_bound) return;
	var canvas = document.getElementById("fcnn_canvas");
	if (!canvas) return;

	_fcnn_canvas_mouse_bound = true;
	var _last_hit_idx = -1;

	canvas.addEventListener("mousemove", function (e) {
		_last_hit_idx = _handle_fcnn_mousemove(e, canvas, _last_hit_idx);
	});

	canvas.addEventListener("click", function (e) {
		_handle_fcnn_click(e, canvas);
	});

	canvas.addEventListener("mouseleave", function () {
		_hide_fcnn_tooltip();
		_last_hit_idx = -1;
		canvas.style.cursor = "default";
	});

	window.addEventListener("scroll", function () {
		_hide_fcnn_tooltip();
		_last_hit_idx = -1;
	}, { passive: true });

	window.addEventListener("resize", function () {
		_hide_fcnn_tooltip();
		_last_hit_idx = -1;
		_fcnn_canvas_mouse_bound = false;
	});
}

function _get_canvas_coords(e, canvas) {
	var rect = canvas.getBoundingClientRect();
	var scaleX = canvas.width / rect.width;
	var scaleY = canvas.height / rect.height;
	return {
		x: (e.clientX - rect.left) * scaleX,
		y: (e.clientY - rect.top) * scaleY
	};
}

function _find_hit_region(cx, cy) {
	for (var i = _fcnn_hit_regions.length - 1; i >= 0; i--) {
		if (_point_in_region(cx, cy, _fcnn_hit_regions[i])) {
			return { region: _fcnn_hit_regions[i], index: i };
		}
	}
	return { region: null, index: -1 };
}

function _handle_fcnn_mousemove(e, canvas, lastHitIdx) {
	try {
		var coords = _get_canvas_coords(e, canvas);
		var { region: hit, index: hitIdx } = _find_hit_region(coords.x, coords.y);

		if (hitIdx === lastHitIdx && _fcnn_tooltip_visible) {
			if (hit && _fcnn_tooltip_el) {
				_reposition_tooltip(e);
			}
			return lastHitIdx;
		}

		if (hit) {
			var html = _build_tooltip_html_for_region(hit);
			_show_fcnn_tooltip(html, e.clientX, e.clientY);
			canvas.style.cursor = "crosshair";
		} else {
			_hide_fcnn_tooltip();
			canvas.style.cursor = "default";
		}
		return hitIdx;
	} catch (err) {
		_hide_fcnn_tooltip();
		canvas.style.cursor = "default";
		return -1;
	}
}

function _build_tooltip_html_for_region(hit) {
	switch (hit.type) {
		case "neuron": return _build_neuron_tooltip_html(hit);
		case "conv2d": return _build_conv2d_tooltip_html(hit);
		case "flatten": return _build_flatten_tooltip_html(hit);
		case "layernorm": return _build_layernorm_tooltip_html(hit);
		case "connection": return _build_connection_tooltip_html(hit);
		case "input_image": return _build_input_image_tooltip_html(hit);
		default: return `<div>Element: <b>${hit.type}</b></div>`;
	}
}

function _reposition_tooltip(e) {
	var vw = window.innerWidth;
	var vh = window.innerHeight;
	var tipW = _fcnn_tooltip_el.offsetWidth || 200;
	var tipH = _fcnn_tooltip_el.offsetHeight || 100;
	var left = e.clientX + 16;
	var top = e.clientY + 12;
	if (left + tipW > vw - 10) left = e.clientX - tipW - 10;
	if (top + tipH > vh - 10) top = e.clientY - tipH - 10;
	if (left < 5) left = 5;
	if (top < 5) top = 5;
	_fcnn_tooltip_el.style.left = left + "px";
	_fcnn_tooltip_el.style.top = top + "px";
}

function _handle_fcnn_click(e, canvas) {
	try {
		var coords = _get_canvas_coords(e, canvas);
		var { region: hit } = _find_hit_region(coords.x, coords.y);
		if (!hit) return;

		if (typeof started_training !== 'undefined' && started_training) return;
		if (typeof _fcnn_edit_ensure_popup !== 'function') return;

		_hide_fcnn_tooltip();

		if (hit.type === "neuron") _fcnn_edit_open_neuron_weights(hit, e.clientX, e.clientY);
		else if (hit.type === "connection") _fcnn_edit_open_weight(hit, e.clientX, e.clientY);
	} catch (err) {
		console.warn("[fcnn_edit] Click handler error:", err);
	}
}

async function _draw_neurons_and_connections(ctx, canvasWidth, layers, meta_infos, layerSpacing, canvasHeight, maxSpacing, maxShapeSize, maxRadius, maxSpacingConv2d, font_size) {
	var _height = null;

	// Clear all hit regions before redrawing
	_clear_fcnn_hit_regions();

	for (var layer_idx = 0; layer_idx < layers.length; layer_idx++) {
		var meta_info = meta_infos[layer_idx];
		var layer_type = meta_info["layer_type"];
		var layerX = (layer_idx + 1) * layerSpacing;
		var layerY = canvasHeight / 2;
		var numNeurons = layers[layer_idx];
		var verticalSpacing = maxSpacing;
		var shapeType = "circle";

		if (numNeurons * verticalSpacing > canvasHeight) {
			verticalSpacing = canvasHeight / numNeurons;
		}

		if (layer_type.toLowerCase().includes("conv2d")) {
			shapeType = "rectangle_conv2d";
		} else if (layer_type.toLowerCase().includes("flatten")) {
			shapeType = "rectangle_flatten";
		} else if (layer_type.toLowerCase().includes("layernormalization")) {
			shapeType = "layernorm";
		}

		if (shapeType == "circle" || shapeType == "rectangle_conv2d") {
			ctx = _draw_neurons_or_conv2d(layer_idx, canvasWidth, numNeurons, ctx, verticalSpacing, layerY, shapeType, layerX, maxShapeSize, meta_info, maxSpacingConv2d, font_size);
		} else if (shapeType == "rectangle_flatten") {
			_height = Math.min(650, meta_info["output_shape"][1]);
			ctx = _draw_flatten(layer_idx, ctx, meta_info, maxShapeSize, canvasHeight, layerX, layerY, _height);
		} else if (shapeType == "layernorm") {
			ctx = draw_layernorm(layer_idx, ctx, meta_info, canvasHeight, layerX, layerY, maxShapeSize);
		} else {
			alert("Unknown shape Type: " + shapeType);
		}
	}

	_draw_connections_between_layers(ctx, layers, layerSpacing, meta_infos, maxSpacing, canvasHeight, layerY, layerX, maxRadius, _height, maxSpacingConv2d);

	// Bind mouse events after drawing (idempotent - only binds once)
	_bind_fcnn_canvas_mouse_events();
}

function draw_layernorm(layer_idx, ctx, meta_info, canvasHeight, layerX, layerY, maxShapeSize) {
	try {
		var blockWidth = maxShapeSize * 10;
		var blockHeight = maxShapeSize * 2.5;

		var x = layerX - blockWidth / 2;
		var y = layerY - blockHeight / 2;

		var sectionWidth = blockWidth / 3;

		ctx.fillStyle = "#e0e0e0";
		ctx.fillRect(x, y, sectionWidth, blockHeight);

		ctx.fillStyle = "#b0d4ff";
		ctx.fillRect(x + sectionWidth, y, sectionWidth, blockHeight);

		ctx.fillStyle = "#ffd0a0";
		ctx.fillRect(x + sectionWidth * 2, y, sectionWidth, blockHeight);

		ctx.beginPath();
		ctx.rect(x, y, blockWidth, blockHeight);
		ctx.strokeStyle = "black";
		ctx.lineWidth = 2;
		ctx.stroke();
		ctx.closePath();

		// Register hit region for tooltip
		const this_region = {
			type: "layernorm",
			shape: "rect",
			x: x,
			y: y,
			w: blockWidth,
			h: blockHeight,
			layer_idx: layer_idx,
			layer_type: meta_info.layer_type || "LayerNormalization",
			output_shape: meta_info.output_shape || null,
			input_shape: meta_info.input_shape || null
		};
		_register_fcnn_hit_region(this_region);

	} catch (e) {
		if (e && e.message) e = e.message;
		assert(false, e);
	}

	return ctx;
}

function _draw_flatten(layer_idx, ctx, meta_info, maxShapeSize, canvasHeight, layerX, layerY, _height) {
	try {
		if (!meta_info["output_shape"]) {
			alert("Has no output shape");
			return ctx;
		}

		var rectSize = maxShapeSize * 2;
		let localLayerY = canvasHeight / 2;
		var _width = rectSize;
		var _x = layerX - _width / 2;
		var _y = localLayerY - _height / 2;

		var this_layer_output = _get_flatten_layer_output(layer_idx);

		_render_flatten_rect(ctx, this_layer_output, _x, _y, _width, _height);
		_draw_flatten_outline(ctx, _x, _y, _width, _height);

		var { flatten_stats, flatten_image_url } = _compute_flatten_tooltip_data(this_layer_output);

		const this_region = {
			type: "flatten",
			shape: "rect",
			x: _x, y: _y, w: _width, h: _height,
			layer_idx: layer_idx,
			layer_type: meta_info.layer_type || "Flatten",
			output_shape: meta_info.output_shape || null,
			input_shape: meta_info.input_shape || null,
			flatten_stats: flatten_stats,
			image_data_url: flatten_image_url
		};

		_register_fcnn_hit_region(this_region);
	} catch (e) {
		if (Object.keys(e).includes("message")) e = e.message;
		assert(false, e);
	}
	return ctx;
}

function _get_flatten_layer_output(layer_idx) {
	if (!proper_layer_states_saved() || !layer_states_saved || !layer_states_saved[`${layer_idx}`]) return null;
	var this_layer_states = layer_states_saved[`${layer_idx}`];
	if (!this_layer_states["output"]) return null;

	var output = this_layer_states["output"];
	var shape = get_shape_from_array(output);
	if (shape.length < 1) return null;

	var flat = Array.isArray(output) ? output.flat(Infinity) : [output];
	return (flat.length > 0) ? flat : null;
}

function _render_flatten_rect(ctx, this_layer_output, _x, _y, _width, _height) {
	if (this_layer_output && this_layer_output.length > 0) {
		var normalizedValues = normalizeArray(this_layer_output);
		var numValues = normalizedValues.length;
		var lineHeight = _height / numValues;

		for (var val_idx = 0; val_idx < numValues; val_idx++) {
			ctx.beginPath();
			var colorValue = Math.abs(255 - Math.round(normalizedValues[val_idx]));
			ctx.fillStyle = `rgb(${colorValue}, ${colorValue}, ${colorValue})`;
			ctx.fillRect(_x, _y + val_idx * lineHeight, _width, lineHeight);
		}
	} else {
		ctx.fillStyle = "lightgray";
		ctx.fillRect(_x, _y, _width, _height);
	}
}

function _draw_flatten_outline(ctx, _x, _y, _width, _height) {
	ctx.beginPath();
	ctx.rect(_x, _y, _width, _height);
	ctx.strokeStyle = "black";
	ctx.lineWidth = 1;
	ctx.stroke();
	ctx.closePath();
}

function _compute_flatten_tooltip_data(this_layer_output) {
	var flatten_stats = null;
	var flatten_image_url = null;
	if (this_layer_output && this_layer_output.length > 0) {
		flatten_stats = _compute_stats(this_layer_output);
		try {
			var stripRows = Math.min(this_layer_output.length, 256);
			var strip2d = [];
			var step = Math.max(1, Math.floor(this_layer_output.length / stripRows));
			for (var si = 0; si < stripRows; si++) {
				strip2d.push([this_layer_output[si * step]]);
			}
			flatten_image_url = _make_mini_canvas_data_url(strip2d, 1, stripRows, 128);
		} catch (e) {}
	}
	return { flatten_stats, flatten_image_url };
}

function _draw_neurons_or_conv2d(layer_idx, canvasWidth, numNeurons, ctx, verticalSpacing, layerY, shapeType, layerX, maxShapeSize, meta_info, maxSpacingConv2d, font_size) {
	assert(typeof (ctx) == "object", `ctx is not an object but ${typeof (ctx)}`);

	var n, m, minVal, maxVal;

	if (
		Object.keys(layer_states_saved).length &&
		Object.keys(layer_states_saved).includes("0") &&
		get_shape_from_array(layer_states_saved["0"]["input"]).length == 4 &&
		get_shape_from_array(layer_states_saved["0"]["input"])[3] == 3 &&
		layer_idx == 0
	) {
		var first_layer_input = layer_states_saved["0"]["input"][0];

		n = first_layer_input.length;
		m = first_layer_input[0].length;

		var flattened = flatten(first_layer_input);

		minVal = Math.min(...flattened);
		maxVal = Math.max(...flattened);

		ctx = draw_first_layer_image(ctx, maxVal, minVal, n, m, first_layer_input, font_size);

		// Register hit region for the input image
		var _first_image_x = 10;
		var _first_image_y = font_size + 10;

		// Build pixel stats and image URL for tooltip
		var pixel_stats = _compute_stats(flattened);
		var input_image_url = null;
		try {
			input_image_url = _make_mini_canvas_rgb_data_url(first_layer_input, 96);
		} catch (e) {
			input_image_url = null;
		}

		var this_region = {
			type: "input_image",
			shape: "rect",
			x: _first_image_x,
			y: _first_image_y,
			w: m,
			h: n,
			layer_idx: 0,
			img_width: m,
			img_height: n,
			channels: 3,
			pixel_stats: pixel_stats,
			image_data_url: input_image_url
		};
		_register_fcnn_hit_region(this_region);
	}

	ctx = draw_layer_neurons(ctx, canvasWidth, numNeurons, verticalSpacing, layerY, layer_states_saved, maxShapeSize, meta_info, n, m, minVal, maxVal, layerX, shapeType, maxSpacingConv2d, layer_idx, font_size);

	return ctx;
}

function draw_layer_neurons(ctx, canvasWidth, numNeurons, verticalSpacing, layerY, layer_states_saved, maxShapeSize, meta_info, n, m, minVal, maxVal, layerX, shapeType, maxSpacingConv2d, layer_idx, font_size) {
	var this_layer_output = null;
	var this_layer_states = null;
	var has_visualization = false;

	const has_proper_layer_states_saved = proper_layer_states_saved();

	// Pre-compute layer stats for Dense layers
	var layer_stats = _compute_layer_stats_for_neurons(shapeType, has_proper_layer_states_saved, layer_idx);

	// Check if conv2d has visualization data
	if (shapeType === "rectangle_conv2d") {
		has_visualization = _check_conv2d_has_visualization(numNeurons, has_proper_layer_states_saved, layer_idx);
	}

	for (let j = 0; j < numNeurons; j++) {
		ctx.beginPath();

		if (shapeType === "circle") {
			ctx = _draw_single_dense_neuron(ctx, j, numNeurons, verticalSpacing, layerY, layerX, maxShapeSize, layer_idx, meta_info, has_proper_layer_states_saved, layer_stats, canvasWidth, font_size);
		} else if (shapeType === "rectangle_conv2d") {
			ctx = _draw_single_conv2d_neuron(ctx, j, numNeurons, maxSpacingConv2d, layerY, layerX, verticalSpacing, layer_idx, meta_info, has_proper_layer_states_saved, has_visualization, n, m, minVal, maxVal, maxShapeSize);
		}
	}

	return ctx;
}

function _compute_layer_stats_for_neurons(shapeType, hasProperStates, layer_idx) {
	if (shapeType !== "circle" || !hasProperStates || !layer_states_saved || !layer_states_saved[`${layer_idx}`]) {
		return null;
	}
	try {
		var layer_flat_output = flatten(layer_states_saved[`${layer_idx}`]["output"][0]);
		if (layer_flat_output && layer_flat_output.length > 0) {
			return _compute_stats(layer_flat_output);
		}
	} catch (e) {}
	return null;
}

function _check_conv2d_has_visualization(numNeurons, hasProperStates, layer_idx) {
	if (!hasProperStates || !layer_states_saved || !layer_states_saved[`${layer_idx}`]) return false;
	if (get_shape_from_array(layer_states_saved[`${layer_idx}`]["output"]).length !== 4) return false;

	var tmp_all = transform_array_whd_dwh(layer_states_saved[`${layer_idx}`]["output"][0]);
	for (var j = 0; j < numNeurons; j++) {
		var flat = tmp_all[j] ? flatten(tmp_all[j]) : [];
		if (flat.length && Math.min(...flat) !== Math.max(...flat)) {
			return true;
		}
	}
	return false;
}

function _draw_single_dense_neuron(ctx, j, numNeurons, verticalSpacing, layerY, layerX, maxShapeSize, layer_idx, meta_info, hasProperStates, layer_stats, canvasWidth, font_size) {
	var neuronY = (j - (numNeurons - 1) / 2) * verticalSpacing + layerY;
	var this_layer_output = null;

	if (hasProperStates && layer_states_saved && layer_states_saved[`${layer_idx}`]) {
		this_layer_output = flatten(layer_states_saved[`${layer_idx}`]["output"][0]);
	}

	var availableSpace = verticalSpacing / 2 - 2;
	var radius = Math.min(maxShapeSize, Math.max(4, availableSpace));

	if (radius < 0) {
		log_once(`Found negative radius! Radius: ${radius}`);
		return ctx;
	}

	ctx = draw_neuron_with_normalized_color(ctx, this_layer_output, layerX, neuronY, radius, j);
	ctx = annotate_output_neurons(canvasWidth, ctx, layer_idx, numNeurons, j, font_size, layerX, neuronY);

	// Register hit region
	var activation_value = (this_layer_output && j < this_layer_output.length) ? this_layer_output[j] : null;
	const this_region = {
		type: "neuron",
		shape: "circle",
		x: layerX,
		y: neuronY,
		radius: radius + 2,
		layer_idx: layer_idx,
		neuron_idx: j,
		layer_type: meta_info.layer_type || "Dense",
		activation_value: activation_value,
		layer_stats: layer_stats,
		output_shape: meta_info.output_shape || null,
		input_shape: meta_info.input_shape || null,
		label: _get_neuron_label(layer_idx, j)
	};
	_register_fcnn_hit_region(this_region);

	return ctx;
}

function _get_neuron_label(layer_idx, j) {
	try {
		var nr_layers = model?.layers?.length;
		if (layer_idx == nr_layers - 1 && labels && Array.isArray(labels) && labels[j]) {
			return labels[j];
		}
	} catch (e) {}
	return null;
}

function _draw_single_conv2d_neuron(ctx, j, numNeurons, maxSpacingConv2d, layerY, layerX, verticalSpacing, layer_idx, meta_info, hasProperStates, has_visualization, n, m, minVal, maxVal, maxShapeSize) {
	var neuronY = (j - (numNeurons - 1) / 2) * maxSpacingConv2d + layerY;
	var conv_layer_output_for_channel = _get_conv2d_channel_output(hasProperStates, layer_idx, j);

	var conv_rect_dims = _draw_and_get_conv2d_rect(ctx, has_visualization, meta_info, conv_layer_output_for_channel, n, m, minVal, maxVal, layerX, neuronY, verticalSpacing);

	// Compute channel stats and image for tooltip
	var { channel_stats, channel_image_url } = _compute_conv2d_channel_tooltip_data(conv_layer_output_for_channel, minVal, maxVal);

	const this_region = {
		type: "conv2d",
		shape: "rect",
		x: conv_rect_dims.x,
		y: conv_rect_dims.y,
		w: conv_rect_dims.w,
		h: conv_rect_dims.h,
		layer_idx: layer_idx,
		neuron_idx: j,
		layer_type: meta_info.layer_type || "Conv2D",
		kernel_size_x: meta_info.kernel_size_x,
		kernel_size_y: meta_info.kernel_size_y,
		output_shape: meta_info.output_shape || null,
		input_shape: meta_info.input_shape || null,
		channel_stats: channel_stats,
		image_data_url: channel_image_url
	};

	_register_fcnn_hit_region(this_region);

	return ctx;
}

function _get_conv2d_channel_output(hasProperStates, layer_idx, j) {
	if (!hasProperStates || !layer_states_saved || !layer_states_saved[`${layer_idx}`]) return null;
	if (get_shape_from_array(layer_states_saved[`${layer_idx}`]["output"]).length !== 4) return null;
	var transformed = transform_array_whd_dwh(layer_states_saved[`${layer_idx}`]["output"][0]);
	return transformed[j] || null;
}

function _draw_and_get_conv2d_rect(ctx, has_visualization, meta_info, channelOutput, n, m, minVal, maxVal, layerX, neuronY, verticalSpacing) {
	if (has_visualization) {
		ctx = draw_filled_kernel_rectangle(ctx, meta_info, channelOutput, n, m, minVal, maxVal, layerX, neuronY);
		var _ww = Number(meta_info?.input_shape?.[1]) || (channelOutput ? channelOutput[0].length : 10);
		var _hh = Number(meta_info?.input_shape?.[2]) || (channelOutput ? channelOutput.length : 10);
		return { x: layerX - _ww / 2, y: neuronY - _hh / 2, w: _ww, h: _hh };
	} else {
		ctx = draw_empty_kernel_rectangle(ctx, meta_info, verticalSpacing, layerX, neuronY);
		var _ww = Math.min((meta_info["kernel_size_x"] || 3) * 3, verticalSpacing - 2);
		var _hh = Math.min((meta_info["kernel_size_y"] || 3) * 3, verticalSpacing - 2);
		return { x: layerX - _ww / 2, y: neuronY - _hh / 2, w: _ww, h: _hh };
	}
}

function _compute_conv2d_channel_tooltip_data(channelOutput, minVal, maxVal) {
	var channel_stats = null;
	var channel_image_url = null;
	if (channelOutput && Array.isArray(channelOutput) && channelOutput.length > 0) {
		try {
			var flat_channel = flatten(channelOutput);
			channel_stats = _compute_stats(flat_channel);
			channel_image_url = _make_mini_canvas_data_url_inverted(channelOutput, channelOutput[0].length, channelOutput.length, 80, minVal, maxVal);
		} catch (e) {}
	}
	return { channel_stats, channel_image_url };
}

function draw_layer_connections(ctx, layer_nr, layers, layerSpacing, meta_infos, maxSpacing, canvasHeight, layerY, maxRadius, _height, maxSpacingConv2d) {
	try {
		var params = _prepare_connection_params(layer_nr, layers, layerSpacing, meta_infos, maxSpacing, canvasHeight, layerY, maxRadius, _height, maxSpacingConv2d);
		var { currX, nextX, currNeurons, nextNeurons, currYs, nextYs, weightInfo, _weight_stats, _weight_data_sample } = params;

		var convLike = (currNeurons > 512 || nextNeurons > 512);
		var estimateCount = currNeurons * nextNeurons;

		if (convLike) {
			_draw_connection_block_fill(ctx, currYs, nextYs, currX, nextX, layer_nr, currNeurons, nextNeurons, _weight_stats, _weight_data_sample, 0.1);
		} else if (estimateCount > 300000) {
			_draw_connection_block_fill(ctx, currYs, nextYs, currX, nextX, layer_nr, currNeurons, nextNeurons, _weight_stats, _weight_data_sample, 0.08);
		} else {
			_draw_connection_lines(ctx, layer_nr, currX, nextX, currYs, nextYs, currNeurons, nextNeurons, canvasHeight, maxRadius, weightInfo, _weight_stats, _weight_data_sample);
		}
	} catch (e) {
		if (e && e.message) e = e.message;
		assert(false, e);
	}
}

function _prepare_connection_params(layer_nr, layers, layerSpacing, meta_infos, maxSpacing, canvasHeight, layerY, maxRadius, _height, maxSpacingConv2d) {
	var meta = get_layer_meta(meta_infos, layer_nr);
	var next_meta = get_layer_meta(meta_infos, layer_nr + 1);

	var currX = (layer_nr + 1) * layerSpacing + maxRadius;
	var nextX = (layer_nr + 2) * layerSpacing - maxRadius;

	var currNeurons = _resolve_neuron_count(layers[layer_nr], meta, "input");
	var nextNeurons = _resolve_neuron_count(layers[layer_nr + 1], next_meta, "output");

	if (meta.layer_type === "LayerNormalization") currNeurons = 1;
	if (next_meta.layer_type === "LayerNormalization") nextNeurons = 1;

	var currSpacing = compute_spacing(meta.layer_type, currNeurons, canvasHeight, maxSpacing, maxSpacingConv2d);
	var nextSpacing = compute_spacing(next_meta.layer_type, nextNeurons, canvasHeight, maxSpacing, maxSpacingConv2d);

	var currYs = Array.from({ length: currNeurons }, (_, i) => compute_neuron_y(i, currNeurons, currSpacing, layerY, meta.layer_type, _height));
	var nextYs = Array.from({ length: nextNeurons }, (_, j) => compute_neuron_y(j, nextNeurons, nextSpacing, layerY, next_meta.layer_type, _height));

	var weightInfo = get_layer_weight_data(layer_nr, meta_infos);
	var _weight_stats = null;
	var _weight_data_sample = null;
	if (weightInfo && weightInfo.data) {
		var sampleLimit = Math.min(weightInfo.data.length, 50000);
		_weight_data_sample = Array.from(weightInfo.data.slice(0, sampleLimit));
		_weight_stats = _compute_stats(_weight_data_sample);
	}

	return { currX, nextX, currNeurons, nextNeurons, currYs, nextYs, weightInfo, _weight_stats, _weight_data_sample };
}

function _resolve_neuron_count(defaultCount, meta, direction) {
	var layer_type = meta.layer_type;
	if (layer_type === "Flatten" || layer_type === "MaxPooling2D") {
		var shape = direction === "input" ? meta.input_shape : meta.output_shape;
		if (shape) {
			var count = shape[shape.length - 1];
			return direction === "output" ? Math.min(64, count) : count;
		}
	}
	return defaultCount;
}

function _draw_connection_block_fill(ctx, currYs, nextYs, currX, nextX, layer_nr, currNeurons, nextNeurons, weight_stats, weight_data, alpha) {
	var yMin = Math.min(currYs[0], nextYs[0]);
	var yMax = Math.max(currYs[currYs.length - 1], nextYs[nextYs.length - 1]);

	ctx.save();
	ctx.globalAlpha = alpha;
	ctx.fillStyle = is_dark_mode ? "#8090b0" : "#606784";
	ctx.fillRect(currX, yMin, nextX - currX, Math.max(1, yMax - yMin));
	ctx.restore();

	const this_region = {
		type: "connection",
		shape: "rect",
		x: currX, y: yMin,
		w: nextX - currX,
		h: Math.max(1, yMax - yMin),
		from_layer: layer_nr,
		to_layer: layer_nr + 1,
		from_neurons: currNeurons,
		to_neurons: nextNeurons,
		weight_stats: weight_stats,
		weight_data: weight_data
	};

	_register_fcnn_hit_region(this_region);
}

function _draw_connection_lines(ctx, layer_nr, currX, nextX, currYs, nextYs, currNeurons, nextNeurons, canvasHeight, maxRadius, weightInfo, weight_stats, weight_data) {
	var offInfo = _render_layer_pair_to_offscreen(layer_nr, currX, nextX, currYs, nextYs, currX, nextX, canvasHeight, maxRadius, weightInfo);
	ctx.drawImage(offInfo.canvas, currX - offInfo.pad, 0);

	var connYMin = Math.min(currYs[0], nextYs[0]) - maxRadius;
	var connYMax = Math.max(currYs[currYs.length - 1], nextYs[nextYs.length - 1]) + maxRadius;

	const this_region = {
		type: "connection",
		shape: "rect",
		x: currX, y: connYMin,
		w: nextX - currX,
		h: Math.max(1, connYMax - connYMin),
		from_layer: layer_nr,
		to_layer: layer_nr + 1,
		from_neurons: currNeurons,
		to_neurons: nextNeurons,
		weight_stats: weight_stats,
		weight_data: weight_data
	};

	_register_fcnn_hit_region(this_region);
}

// ===== HELPER FUNCTIONS =====

function get_layer_meta(meta_infos, idx) {
	if (idx in meta_infos) {
		const info = meta_infos[idx];
		return {
			layer_type: info["layer_type"],
			input_shape: info["input_shape"],
			output_shape: info["output_shape"]
		};
	}
	return { layer_type: null, input_shape: null, output_shape: null };
}

function compute_spacing(layer_type, neurons, canvasHeight, maxSpacing, maxSpacingConv2d) {
	// treat any Conv2D-* / *Conv2D variants as conv2d for spacing purposes
	if (layer_type && typeof layer_type === "string" && layer_type.toLowerCase().includes("conv2d")) {
		return Math.min(maxSpacingConv2d, (canvasHeight / neurons) * 0.8);
	}
	return Math.min(maxSpacing, (canvasHeight / neurons) * 0.8);
}

function compute_neuron_y(neuron_idx, total_neurons, spacing, layerY, layer_type, _height) {
	var y = (neuron_idx - (total_neurons - 1) / 2) * spacing + layerY;
	if (layer_type && layer_type.toLowerCase().includes("flatten")) {
		var top = layerY - (_height / 2);
		var bottom = layerY + (_height / 2);
		y = Math.min(bottom, Math.max(top, y));
	}
	return y;
}

function _connection_cache_key(layer_nr, currNeurons, nextNeurons, currX, nextX, currSpacing, nextSpacing) {
	return `${layer_nr}:${currNeurons}x${nextNeurons}:x${Math.round(currX)}-${Math.round(nextX)}:s${Math.round(currSpacing)}-${Math.round(nextSpacing)}`;
}

function get_weight_color(weight, minW, maxW) {
	var normalized = (maxW !== minW) ? ((weight - minW) / (maxW - minW)) * 2 - 1 : 0;
	var abs = Math.abs(normalized);

	var r, g, b;
	if (normalized >= 0) {
		// White → Blue (große/positive Gewichte)
		r = Math.round(255 * (1 - abs));
		g = Math.round(255 * (1 - abs));
		b = 255;
	} else {
		// White → Red (kleine/negative Gewichte)
		r = 255;
		g = Math.round(255 * (1 - abs));
		b = Math.round(255 * (1 - abs));
	}

	var alpha = 0.15 + abs * 0.75;
	return `rgba(${r}, ${g}, ${b}, ${alpha.toFixed(2)})`;
}

function get_layer_weight_data(layer_nr, meta_infos) {
	try {
		if (!model || !model.layers) return null;

		// Weights belong to the receiving layer (layer_nr + 1 in meta_infos)
		var meta = meta_infos[layer_nr + 1];
		if (!meta) return null;

		var actual_layer_idx = meta.nr;
		if (actual_layer_idx == null) return null;

		var layer = model.layers[actual_layer_idx];
		if (!layer || !layer.weights || layer.weights.length === 0) return null;

		var kernel = layer.weights[0];
		if (!kernel || !kernel.val) return null;

		var weightData = kernel.val.dataSync();
		if (!weightData || weightData.length === 0) return null;

		var minW = weightData[0], maxW = weightData[0];
		for (var i = 1; i < weightData.length; i++) {
			if (weightData[i] < minW) minW = weightData[i];
			if (weightData[i] > maxW) maxW = weightData[i];
		}

		return { data: weightData, min: minW, max: maxW, shape: kernel.shape };
	} catch (e) {
		return null;
	}
}

// ===== OFFSCREEN RENDERING WITH CACHE =====

var CONNECTION_CANVAS_CACHE = new Map();

function _draw_unweighted_connections(octx, currYs, nextYs, localX1, localX2, dark) {
	octx.strokeStyle = dark ? "rgba(160, 175, 210, 0.7)" : "rgba(40, 50, 90, 0.55)";
	octx.globalAlpha = 1.0;
	octx.beginPath();
	let count = 0;
	const CHUNK = 5000;

	for (let i = 0; i < currYs.length; i++) {
		const y1 = currYs[i];
		for (let k = 0; k < nextYs.length; k++) {
			var cpX = (localX1 + localX2) / 2;
			octx.moveTo(localX1, y1);
			octx.bezierCurveTo(cpX, y1, cpX, nextYs[k], localX2, nextYs[k]);
			count++;
			if ((count % CHUNK) === 0) {
				octx.stroke();
				octx.beginPath();
			}
		}
	}
	if (count % CHUNK !== 0) octx.stroke();
}

function _draw_weighted_connections(octx, currYs, nextYs, localX1, localX2, weightInfo, dark) {
	var shape = weightInfo.shape;
	var cols = shape[shape.length - 1];
	var rows = shape[shape.length - 2];

	for (let i = 0; i < currYs.length; i++) {
		const y1 = currYs[i];
		for (let k = 0; k < nextYs.length; k++) {
			var fi = Math.min(i, rows - 1);
			var ti = Math.min(k, cols - 1);
			var idx = fi * cols + ti;
			var w = (idx >= 0 && idx < weightInfo.data.length) ? weightInfo.data[idx] : 0;

			octx.beginPath();
			octx.strokeStyle = _get_weight_color_themed(w, weightInfo.min, weightInfo.max, dark);
			var cpX = (localX1 + localX2) / 2;
			octx.moveTo(localX1, y1);
			octx.bezierCurveTo(cpX, y1, cpX, nextYs[k], localX2, nextYs[k]);
			octx.stroke();
		}
	}
}

function _render_layer_pair_to_offscreen(layer_nr, currXs, nextXs, currYs, nextYs, currX, nextX, canvasHeight, maxRadius, weightInfo) {
	var dark = (typeof is_dark_mode !== 'undefined' && is_dark_mode);
	var darkFlag = dark ? "d" : "l";
	var wFlag = weightInfo ? ("w" + weightInfo.min.toFixed(3) + "_" + weightInfo.max.toFixed(3)) : "nw";
	const key = _connection_cache_key(layer_nr, currYs.length, nextYs.length, currX, nextX, 0, 0) + ":" + darkFlag + ":" + wFlag;

	if (CONNECTION_CANVAS_CACHE.has(key)) {
		return CONNECTION_CANVAS_CACHE.get(key);
	}

	const pad = Math.ceil(maxRadius + 2);
	const width = Math.max(1, Math.ceil(nextX - currX) + pad * 2);
	const height = Math.max(1, canvasHeight);

	const off = document.createElement("canvas");
	off.width = width;
	off.height = height;
	const octx = off.getContext("2d");

	const shiftX = pad - currX;
	octx.lineWidth = 1;

	const localX1 = currX + shiftX;
	const localX2 = nextX + shiftX;

	if (!weightInfo) {
		_draw_unweighted_connections(octx, currYs, nextYs, localX1, localX2, dark);
	} else {
		_draw_weighted_connections(octx, currYs, nextYs, localX1, localX2, weightInfo, dark);
	}

	CONNECTION_CANVAS_CACHE.set(key, { canvas: off, shiftX: shiftX, pad: pad });
	return CONNECTION_CANVAS_CACHE.get(key);
}

function _get_weight_color_themed(weight, minW, maxW, dark) {
	var normalized = (maxW !== minW) ? ((weight - minW) / (maxW - minW)) * 2 - 1 : 0;
	var abs = Math.abs(normalized);

	var r, g, b, alpha;

	if (dark) {
		// Dark mode: bright colors on dark background
		if (normalized >= 0) {
			// Neutral → Blue
			r = Math.round(80 + (1 - abs) * 100);
			g = Math.round(80 + (1 - abs) * 100);
			b = Math.round(140 + abs * 115);
		} else {
			// Neutral → Red
			r = Math.round(140 + abs * 115);
			g = Math.round(80 + (1 - abs) * 100);
			b = Math.round(80 + (1 - abs) * 100);
		}
		alpha = 0.3 + abs * 0.65;
	} else {
		// Light mode: dark/saturated colors on white background
		if (normalized >= 0) {
			// Dark neutral → Deep Blue
			r = Math.round(30 * (1 - abs));
			g = Math.round(30 * (1 - abs));
			b = Math.round(80 + abs * 175);
		} else {
			// Dark neutral → Deep Red
			r = Math.round(80 + abs * 175);
			g = Math.round(30 * (1 - abs));
			b = Math.round(30 * (1 - abs));
		}
		alpha = 0.25 + abs * 0.7;
	}

	return `rgba(${r}, ${g}, ${b}, ${alpha.toFixed(2)})`;
}

// ===== LAYERS TEXT DRAWING =====

function _draw_layer_pill_badge(ctx, x, labelText, font_size) {
	ctx.font = `bold ${font_size}px 'Segoe UI', Arial, sans-serif`;
	var textWidth = ctx.measureText(labelText).width;
	var pillW = textWidth + 20;
	var pillH = font_size + 10;
	var pillX = x - pillW / 2;
	var pillY = 12;

	ctx.beginPath();
	_roundRect(ctx, pillX, pillY, pillW, pillH, 8);
	ctx.fillStyle = is_dark_mode ? 'rgba(60, 70, 110, 0.7)' : 'rgba(70, 100, 200, 0.1)';
	ctx.fill();
	ctx.strokeStyle = is_dark_mode ? 'rgba(100, 130, 200, 0.5)' : 'rgba(70, 100, 200, 0.3)';
	ctx.lineWidth = 1;
	ctx.stroke();

	ctx.fillStyle = is_dark_mode ? '#b0c4ff' : '#2a4494';
	ctx.textAlign = "center";
	ctx.textBaseline = "middle";
	ctx.fillText(labelText, x, pillY + pillH / 2);
	ctx.textBaseline = "alphabetic";
}

function _draw_layer_shape_info(ctx, x, meta_info, font_size, canvasHeight) {
	ctx.font = `${font_size - 1}px 'Segoe UI', Arial, sans-serif`;
	ctx.fillStyle = is_dark_mode ? 'rgba(200,210,230,0.7)' : 'rgba(60,60,80,0.7)';
	ctx.textAlign = "center";

	if (meta_info.input_shape) {
		ctx.fillText("In: [" + meta_info.input_shape.filter(n => n).join(", ") + "]", x, canvasHeight - 28);
	}
	if (meta_info.output_shape) {
		ctx.fillText("Out: [" + meta_info.output_shape.filter(n => n).join(", ") + "]", x, canvasHeight - 10);
	}
}

function _draw_layers_text(layers, meta_infos, ctx, canvasHeight, canvasWidth, layerSpacing, _labels, font_size) {
	try {
		for (var layer_idx = 0; layer_idx < layers.length; layer_idx++) {
			var x = (layer_idx + 1) * layerSpacing;

			if (_labels && _labels[layer_idx]) {
				_draw_layer_pill_badge(ctx, x, _labels[layer_idx], font_size);
			}

			if (meta_infos && meta_infos[layer_idx]) {
				_draw_layer_shape_info(ctx, x, meta_infos[layer_idx], font_size, canvasHeight);
			}
		}
	} catch (e) {
		if (Object.keys(e).includes("message")) e = e.message;
		assert(false, e);
	}
}

// Helper: draw a rounded rectangle path
function _roundRect(ctx, x, y, w, h, r) {
	if (w < 2 * r) r = w / 2;
	if (h < 2 * r) r = h / 2;
	ctx.moveTo(x + r, y);
	ctx.arcTo(x + w, y, x + w, y + h, r);
	ctx.arcTo(x + w, y + h, x, y + h, r);
	ctx.arcTo(x, y + h, x, y, r);
	ctx.arcTo(x, y, x + w, y, r);
	ctx.closePath();
}

// ===== TRANSFORM HELPER =====

function transform_array_whd_dwh(inputArray) {
	var width = inputArray.length;
	var height = inputArray[0].length;
	var depth = inputArray[0][0].length;

	var newArray = [];
	for (var depth_idx = 0; depth_idx < depth; depth_idx++) {
		newArray[depth_idx] = [];
		for (var width_idx = 0; width_idx < width; width_idx++) {
			newArray[depth_idx][width_idx] = [];
			for (var height_idx = 0; height_idx < height; height_idx++) {
				newArray[depth_idx][width_idx][height_idx] = inputArray[width_idx][height_idx][depth_idx];
			}
		}
	}

	return newArray;
}

// ===== PROPER LAYER STATES CHECK =====

function proper_layer_states_saved() {
	try {
		if (typeof (layer_states_saved) != "object") {
			return false;
		}

		if (!model) {
			return false;
		}

		var _keys = Object.keys(layer_states_saved);

		if (_keys.length == 0) {
			return false;
		}

		for (var key_idx = 0; key_idx < _keys.length; key_idx++) {
			var _model_uuid = layer_states_saved[key_idx]["model_uuid"];

			if (model.uuid != _model_uuid) {
				return false;
			}
		}

		return true;
	} catch (e) {
		return false;
	}
}

// ===== CLEANUP ON PAGE UNLOAD =====

window.addEventListener("beforeunload", function () {
	_hide_fcnn_tooltip();
	if (_fcnn_tooltip_el && _fcnn_tooltip_el.parentNode) {
		_fcnn_tooltip_el.parentNode.removeChild(_fcnn_tooltip_el);
	}
	_fcnn_tooltip_el = null;
	_fcnn_hit_regions = [];
	CONNECTION_CANVAS_CACHE.clear();
});

// ===== DARK MODE CHANGE LISTENER =====
// Re-style tooltip when dark mode changes

(function () {
	var _last_dark_mode_state = (typeof is_dark_mode !== 'undefined') ? is_dark_mode : false;

	setInterval(function () {
		var currentDark = (typeof is_dark_mode !== 'undefined') ? is_dark_mode : false;
		if (currentDark !== _last_dark_mode_state) {
			_last_dark_mode_state = currentDark;
			// Clear connection cache since colors change
			if (CONNECTION_CANVAS_CACHE) CONNECTION_CANVAS_CACHE.clear();
			// Force tooltip restyle on next show
			if (_fcnn_tooltip_el) {
				_fcnn_tooltip_el.style.background = currentDark ? 'rgba(30,30,40,0.97)' : 'rgba(255,255,255,0.98)';
				_fcnn_tooltip_el.style.color = currentDark ? '#e0e0e0' : '#222';
				_fcnn_tooltip_el.style.border = `1px solid ${currentDark ? '#555' : '#bbb'}`;
			}
		}
	}, 500);
})();
