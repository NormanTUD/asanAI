async function restart_fcnn (force = 0) {
	if(is_running_test || currently_running_change_data_origin) {
		if(!force) {
			return;
		}
	}

	if(!$("#fcnn_canvas").is(":visible") && !force) {
		return;
	}

	var fcnn_data = get_fcnn_data();

	var right_side_width = $("#right_side").width();

	if(!fcnn_data) {
		dbg(language[lang]["could_not_get_fcnn_data"]);
		return;
	}

	var cache_key = await md5(JSON.stringify({
		"right_side_width": right_side_width,
		"fcnn_data": fcnn_data
	}));

	if(last_fcnn_data_hash == cache_key && !force) {
		return;
	}

	last_fcnn_data_hash = cache_key;

	var [names, units, meta_infos] = fcnn_data;

	await draw_fcnn(units, names, meta_infos);

	return true;
}

async function force_restart_fcnn () {
	return await restart_fcnn(1);
}

function get_fcnn_data () {
	var names = [];
	var units = [];
	var meta_infos = [];

	if(!model) {
		dbg("[get_fcnn_data] Model not found for restart_fcnn");
		return;
	}

	if(!Object.keys(model).includes("layers")) {
		wrn("[get_fcnn_data] model.layers not found for restart_fcnn");
		return;
	}

	if(model.layers.length == 0) {
		wrn("[get_fcnn_data] model.layers.length is 0");
		return;
	}

	var start_layer = 0;

	for (var layer_idx = 0; layer_idx < model.layers.length; layer_idx++) {
		var class_name = get_layer_classname_by_nr(layer_idx);
		if(!["Dense", "Flatten", "Conv2D"].includes(class_name)) {
			continue;
		}

		var _unit = get_units_at_layer(layer_idx);
		if(layer_idx == 0) {
			names.push("Input Layer");
		} else if (layer_idx == model.layers.length - 1) {
			names.push("Output Layer");
		} else {
			names.push(`${class_name} ${layer_idx}`);
		}

		units.push(_unit);

		var output_shape_of_layer = "";
		try {
			output_shape_of_layer = model.layers[layer_idx].outputShape;
		} catch (e) {

		}

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

async function _draw_neurons_and_connections (ctx, layers, meta_infos, layerSpacing, canvasHeight, maxSpacing, maxShapeSize, maxRadius, maxSpacingConv2d, font_size) {
	var _height = null;

	for (var layer_idx = 0; layer_idx < layers.length; layer_idx++) {
		var meta_info = meta_infos[layer_idx];
		var layer_type = meta_info["layer_type"];
		var layerX = (layer_idx + 1) * layerSpacing;
		var layerY = canvasHeight / 2;
		var numNeurons = layers[layer_idx];
		var verticalSpacing = maxSpacing;
		var shapeType = "circle"; // Default shape is circle

		if (numNeurons * verticalSpacing > canvasHeight) {
			verticalSpacing = canvasHeight / numNeurons;
		}

		// Check if the layer type is "conv2d"
		if (layer_type.toLowerCase().includes("conv2d")) {
			shapeType = "rectangle_conv2d";
		} else if (layer_type.toLowerCase().includes("flatten")) {
			shapeType = "rectangle_flatten";
		}

		if(shapeType == "circle" || shapeType == "rectangle_conv2d") {
			ctx = _draw_neurons_or_conv2d(layer_idx, numNeurons, ctx, verticalSpacing, layerY, shapeType, layerX, maxShapeSize, meta_info, maxSpacingConv2d, font_size);
		} else if (shapeType == "rectangle_flatten") {
			_height = Math.min(650, meta_info["output_shape"][1]);
			ctx = _draw_flatten(layer_idx, ctx, meta_info, maxShapeSize, canvasHeight, layerX, layerY, _height);
		} else {
			alert("Unknown shape Type: " + shapeType);
		}
	}

	_draw_connections_between_layers(ctx, layers, layerSpacing, meta_infos, maxSpacing, canvasHeight, layerY, layerX, maxRadius, _height, maxSpacingConv2d);
}

function _draw_connections_between_layers(ctx, layers, layerSpacing, meta_infos, maxSpacing, canvasHeight, layerY, layerX, maxRadius, _height, maxSpacingConv2d) {
	try {
		// Draw connections
		for (var layer_nr = 0; layer_nr < layers.length - 1; layer_nr++) {
			var meta_info = meta_infos[layer_nr];

			var layer_type = meta_info["layer_type"];
			var layer_input_shape = meta_info["input_shape"];
			var layer_output_shape = meta_info["output_shape"];

			var currentLayerX = (layer_nr + 1) * layerSpacing;
			var nextLayerX = (layer_nr + 2) * layerSpacing;
			var currentLayerNeurons = layers[layer_nr];
			var nextLayerNeurons = layers[layer_nr + 1];

			var next_layer_type = null;
			var next_layer_input_shape = null;
			var next_layer_output_shape = null;

			var last_layer_type = null;
			var last_layer_input_shape = null;
			var last_layer_output_shape = null;

			if((layer_nr + 1) in meta_infos) {
				var next_meta_info = meta_infos[layer_nr + 1];
				next_layer_type = next_meta_info["layer_type"];
				next_layer_input_shape = next_meta_info["input_shape"];
				next_layer_output_shape = next_meta_info["output_shape"];
			}

			if(layer_nr > 0) {
				var last_meta_info = meta_infos[layer_nr - 1];
				last_layer_type = last_meta_info["layer_type"];
				last_layer_input_shape = last_meta_info["input_shape"];
				last_layer_output_shape = last_meta_info["output_shape"];
			}

			if(layer_type == "Flatten" || layer_type == "MaxPooling2D") {
				currentLayerNeurons = layer_input_shape[layer_input_shape.length - 1];
			}

			if(next_layer_type == "Flatten" || layer_type == "MaxPooling2D") {
				nextLayerNeurons = Math.min(64, next_layer_output_shape[next_layer_output_shape.length - 1]);
			}

			var currentSpacing = Math.min(layer_type == "Conv2D" ? maxSpacingConv2d : maxSpacing, (canvasHeight / currentLayerNeurons) * 0.8);
			var nextSpacing = Math.min(next_layer_type == "Conv2D" ? maxSpacingConv2d : maxSpacing, (canvasHeight / nextLayerNeurons) * 0.8);

			var line_color = "gray";
			var line_tickness = 1;

			for (var neuron_nr = 0; neuron_nr < currentLayerNeurons; neuron_nr++) {
				var currentNeuronY = (neuron_nr - (currentLayerNeurons - 1) / 2) * currentSpacing + layerY;

				// Check if the current layer is a Flatten layer
				if (layer_type.toLowerCase().includes("flatten")) {
					// Adjust the y-positions of connections to fit with the "flatten square"
					var flattenSquareTopY = layerY - (_height / 2);
					var flattenSquareBottomY = layerY + (_height / 2);
					currentNeuronY = Math.min(flattenSquareBottomY, Math.max(flattenSquareTopY, currentNeuronY));
				}

				for (var k = 0; k < nextLayerNeurons; k++) {
					var nextNeuronY = (k - (nextLayerNeurons - 1) / 2) * nextSpacing + layerY;

					// Adjust the y-positions of connections to fit with the "flatten square"
					if (next_layer_type.toLowerCase().includes("flatten")) {
						var flattenSquareTopY = layerY - (_height / 2);
						var flattenSquareBottomY = layerY + (_height / 2);
						nextNeuronY = Math.min(flattenSquareBottomY, Math.max(flattenSquareTopY, nextNeuronY));
					}

					ctx.beginPath();
					ctx.moveTo(currentLayerX + maxRadius, currentNeuronY);
					ctx.lineTo(nextLayerX - maxRadius, nextNeuronY);
					ctx.strokeStyle = line_color;
					ctx.lineWidth = line_tickness;
					ctx.stroke();
				}
			}
		}
	} catch (e) {
		if(Object.keys(e).includes("message")) {
			e = e.message;
		}

		assert(false, e);
	}
}

function _draw_layers_text (layers, meta_infos, ctx, canvasHeight, canvasWidth, layerSpacing, _labels, font_size) {
	try {
		for (var layer_idx = 0; layer_idx < layers.length; layer_idx++) {
			if (_labels && _labels[layer_idx]) {
				ctx.beginPath();
				ctx.font = font_size + "px Arial";
				if(is_dark_mode) {
					ctx.fillStyle = "white";
				} else {
					ctx.fillStyle = "black";
				}
				ctx.textAlign = "center";
				ctx.fillText(_labels[layer_idx], (layer_idx + 1) * layerSpacing, canvasHeight - (2*24) - 5);
				ctx.closePath();
			}

			if (meta_infos && meta_infos[layer_idx]) {
				ctx.beginPath();
				var meta_info = meta_infos[layer_idx];

				var _is = meta_info.input_shape;
				var _os = meta_info.output_shape;

				ctx.font = font_size + "px Arial";
				if(is_dark_mode) {
					ctx.fillStyle = "white";
				} else {
					ctx.fillStyle = "black";
				}
				ctx.textAlign = "center";
				if(_is) {
					ctx.fillText("Input:  [" + _is.filter(n => n).join(", ") + "]", (layer_idx + 1) * layerSpacing, canvasHeight - (24) - 5);
				}
				if(_os) {
					ctx.fillText("Output: [" + _os.filter(n => n).join(", ") + "]", (layer_idx + 1) * layerSpacing, canvasHeight - 5);
				}
				ctx.closePath();
			}
		}
	} catch (e) {
		if(Object.keys(e).includes("message")) {
			e = e.message;
		}

		assert(false, e);
	}
}

async function draw_fcnn(...args) {
	assert(args.length == 3, "draw_fcnn must have 3 arguments");

	if(is_setting_config) {
		return;
	}

	var args_hash = await md5(JSON.stringify(args));

	if(last_fcnn_hash == args_hash) {
		return;
	}

	args_hash = last_fcnn_hash;

	var layers = args[0];
	var _labels = args[1];
	var meta_infos = args[2];

	var canvas = document.getElementById("fcnn_canvas");

	if (!canvas) {
		canvas = document.createElement("canvas");
		canvas.id = "fcnn_canvas";
		document.body.appendChild(canvas);
	}

	var ctx = canvas.getContext("2d", { willReadFrequently: true });

	var ghw = $("#graphs_here").width();

	var canvasWidth = Math.max(800, ghw);
	var canvasHeight = 800;

	canvas.width = canvasWidth;
	canvas.height = canvasHeight;
	ctx.clearRect(0, 0, canvasWidth, canvasHeight);

	var maxNeurons = Math.max(...layers);
	var maxRadius = Math.min(8, (canvasHeight / 2) / maxNeurons, (canvasWidth / 2) / (layers.length + 1));

	// Adjust spacing based on the number of neurons in each layer
	var layerSpacing = canvasWidth / (layers.length + 1);
	var maxSpacing = Math.min(maxRadius * 3, (canvasHeight / maxNeurons) * 0.8);
	var maxShapeSize = Math.min(8, (canvasHeight / 2) / maxNeurons, (canvasWidth / 2) / (layers.length + 1));

	var max_conv2d_height = 0;
	
	meta_infos.forEach(function (i, e) {
		if(i.layer_type == "Conv2D") {
			var os = i.output_shape;
			var height = os[1];
			var width = os[2];
			
			if (height > max_conv2d_height) {
				max_conv2d_height = height;
			}
		}
	});

	var maxSpacingConv2d = maxSpacing + max_conv2d_height;

	var font_size = Math.max(12, Math.min(6, (canvasWidth / (layers.length * 24))));

	_draw_layers_text(layers, meta_infos, ctx, canvasHeight, canvasWidth, layerSpacing, _labels, font_size);

	await _draw_neurons_and_connections(ctx, layers, meta_infos, layerSpacing, canvasHeight, maxSpacing, maxShapeSize, maxRadius, maxSpacingConv2d, font_size);
}

function _draw_flatten (layer_idx, ctx, meta_info, maxShapeSize, canvasHeight, layerX, layerY, _height) {
	try {
		if(meta_info["output_shape"]) {
			var this_layer_states = null;

			if(proper_layer_states_saved() && layer_states_saved && layer_states_saved[`${layer_idx}`]) {
				this_layer_states = layer_states_saved[`${layer_idx}`];
			}

			var rectSize = maxShapeSize * 2;

			var layerY = canvasHeight / 2;

			var _width = rectSize;

			var _x = layerX - _width / 2;
			var _y = layerY - _height / 2;

			if(this_layer_states && get_shape_from_array(this_layer_states["output"]).length == 2) {
				// OK
			} else {
				this_layer_states = null;
			}

			if(this_layer_states) {
				var this_layer_output = this_layer_states["output"].flat();

				var normalizedValues = normalizeArray(this_layer_output);

				var numValues = normalizedValues.length;
				var lineHeight = _height / numValues;

				for (var val_idx = 0; val_idx < numValues; val_idx++) {
					var colorValue = Math.abs(255 - Math.round(normalizedValues[val_idx]));
					var _rgb = `rgb(${colorValue}, ${colorValue}, ${colorValue})`;
					ctx.fillStyle = _rgb;
					ctx.fillRect(_x, _y + val_idx * lineHeight, _width, lineHeight);
				}
			} else {
				ctx.fillStyle = "lightgray";
				ctx.fillRect(_x, _y, _width, _height);
			}

			// Outline separat
			ctx.beginPath();
			ctx.rect(_x, _y, _width, _height);
			ctx.strokeStyle = "black";
			ctx.lineWidth = 1;
			ctx.stroke();
			ctx.closePath();
		} else {
			alert("Has no output shape");
		}
	} catch (e) {
		if(Object.keys(e).includes("message")) {
			e = e.message;
		}

		assert(false, e);
	}

	return ctx;
}

function proper_layer_states_saved () {
	try {
		if(typeof(layer_states_saved) != "object") {
			dbg(`[proper_layer_states_saved] layer_states_saved is not an object`);
			return false;
		}

		if(!model) {
			dbg(`[proper_layer_states_saved] model is not defined`);
			return false;
		}

		var _keys = Object.keys(layer_states_saved);

		if(_keys.length == 0) {
			return false;
		}

		for (var key_idx = 0; key_idx < _keys.length; key_idx++) {
			var _model_uuid = layer_states_saved[key_idx]["model_uuid"];

			if(model.uuid != _model_uuid) {
				return false;
			}
		}

		return true;
	} catch (e) {
		dbg(e);
		return false;
	}
}

function _draw_neurons_or_conv2d(layer_idx, numNeurons, ctx, verticalSpacing, layerY, shapeType, layerX, maxShapeSize, meta_info, maxSpacingConv2d, font_size) {
	assert(typeof(ctx) == "object", `ctx is not an object but ${typeof(ctx)}`);

	if(
		Object.keys(layer_states_saved).length &&
		Object.keys(layer_states_saved).includes("0") &&
		get_shape_from_array(layer_states_saved["0"]["input"]).length == 4 &&
		get_shape_from_array(layer_states_saved["0"]["input"])[3] == 3 &&
		layer_idx == 0
	) {
		var first_layer_input = layer_states_saved["0"]["input"][0];

		var n = first_layer_input.length;
		var m = first_layer_input[0].length;

		var flattened = flatten(first_layer_input);

		var minVal = Math.max(...flattened);
		var maxVal = Math.min(...flattened);

		ctx = draw_first_layer_image(ctx, maxVal, minVal, n, m, first_layer_input, font_size);
	}

	ctx = draw_layer_neurons(ctx, numNeurons, verticalSpacing, layerY, layer_states_saved, maxShapeSize, meta_info, n, m, minVal, maxVal, layerX, shapeType, maxSpacingConv2d, layer_idx, font_size);

	return ctx;
}

function draw_layer_neurons (ctx, numNeurons, verticalSpacing, layerY, layer_states_saved, maxShapeSize, meta_info, n, m, minVal, maxVal, layerX, shapeType, maxSpacingConv2d, layer_idx, font_size) {
	var this_layer_output = null;
	var this_layer_states = null;

	var has_visualization = false;

	if (shapeType === "rectangle_conv2d") {
		for (var j = 0; j < numNeurons; j++) {
			if (proper_layer_states_saved() && layer_states_saved && layer_states_saved[`${layer_idx}`]) {
				if (get_shape_from_array(layer_states_saved[`${layer_idx}`]["output"]).length == 4) {
					var tmp_output = transformArrayWHD_DWH(layer_states_saved[`${layer_idx}`]["output"][0]);
					tmp_output = tmp_output[j];
					var flat = tmp_output ? flatten(tmp_output) : [];
					if (flat.length && Math.min(...flat) != Math.max(...flat)) {
						has_visualization = true;
						break;
					}
				}
			}
		}
	}

	for (var j = 0; j < numNeurons; j++) {
		ctx.beginPath();
		var neuronY = (j - (numNeurons - 1) / 2) * verticalSpacing + layerY;
		ctx.beginPath();

		if (shapeType === "circle") {
			if(proper_layer_states_saved() && layer_states_saved && layer_states_saved[`${layer_idx}`]) {
				this_layer_output = flatten(layer_states_saved[`${layer_idx}`]["output"][0]);
			}

			var availableSpace = verticalSpacing / 2 - 2;
			var radius = Math.min(maxShapeSize, Math.max(4, availableSpace));
			if(radius >= 0) {
				ctx = draw_neuron_with_normalized_color(ctx, this_layer_output, layerX, neuronY, radius, j);
			} else {
				log_once(`Found negative radius! Radius: ${radius}, maxShapeSize: ${maxShapeSize}, availableSpace: ${availableSpace}`);
				return ctx;
			}

			ctx = annotate_output_neurons(ctx, layer_idx, numNeurons, j, font_size, layerX, neuronY);
		} else if (shapeType === "rectangle_conv2d") {
			neuronY = (j - (numNeurons - 1) / 2) * maxSpacingConv2d + layerY;

			if (proper_layer_states_saved() && layer_states_saved && layer_states_saved[`${layer_idx}`]) {
				if (get_shape_from_array(layer_states_saved[`${layer_idx}`]["output"]).length == 4) {
					this_layer_output = transformArrayWHD_DWH(layer_states_saved[`${layer_idx}`]["output"][0]);
					this_layer_output = this_layer_output[j];
				}
			}

			if (has_visualization) {
				ctx = draw_filled_kernel_rectangle(ctx, meta_info, this_layer_output, n, m, minVal, maxVal, layerX, neuronY);
			} else {
				ctx = draw_empty_kernel_rectangle(ctx, meta_info, verticalSpacing, layerX, neuronY);
			}
		}
	}

	return ctx;
}

function transformArrayWHD_DWH(inputArray) {
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

function draw_first_layer_image(ctx, maxVal, minVal, n, m, first_layer_input, font_size) {
	if(maxVal != minVal) {
		var scale = 255 / (maxVal - minVal);

		var imageData = ctx.createImageData(m, n);

		for (var row = 0; row < n; row++) {
			for (var col = 0; col < m; col++) {
				var pixelValue = Math.floor((first_layer_input[row][col] - minVal) * scale);
				var dataIndex = (row * m + col) * 4;

				var red   = Math.abs(255 - parse_int((first_layer_input[row][col][0] - minVal) * scale));
				var green = Math.abs(255 - parse_int((first_layer_input[row][col][1] - minVal) * scale));
				var blue  = Math.abs(255 - parse_int((first_layer_input[row][col][2] - minVal) * scale));

				imageData.data[dataIndex + 0] = red;
				imageData.data[dataIndex + 1] = green;
				imageData.data[dataIndex + 2] = blue;
				imageData.data[dataIndex + 3] = 255;
			}
		}

		var _first_image_x = 10;
		var _first_image_y = font_size + 10;

		ctx.putImageData(imageData, _first_image_x, _first_image_y, 0, 0, n, m);

		ctx.font = font_size + "px Arial";
		if(is_dark_mode) {
			ctx.fillStyle = "white";
		} else {
			ctx.fillStyle = "black";
		}
		ctx.textAlign = "left";
		ctx.fillText(language[lang]["input_image"] + ":", 10, 10);
		ctx.closePath();

		ctx.strokeStyle = "black";
		ctx.lineWidth = 1;
		ctx.strokeRect(_first_image_x, _first_image_y, n, m);

	}

	return ctx;
}

function draw_filled_kernel_rectangle(ctx, meta_info, this_layer_output, n, m, minVal, maxVal, layerX, neuronY) {
	try {
		if (!(ctx && typeof ctx.putImageData === "function")) {
			console.warn("draw_filled_kernel_rectangle: ctx is invalid or not a 2D canvas context");
			return ctx;
		}

		if (!Array.isArray(this_layer_output) || this_layer_output.length === 0) {
			console.warn("draw_filled_kernel_rectangle: this_layer_output is empty or not an array");
			return ctx;
		}

		var n = this_layer_output.length;
		var m = Array.isArray(this_layer_output[0]) ? this_layer_output[0].length : 0;

		if (m === 0) {
			console.warn("draw_filled_kernel_rectangle: this_layer_output[0] is not a valid row");
			return ctx;
		}

		var [calcMin, calcMax] = get_min_max_val(n, m, this_layer_output);
		if (!isFinite(calcMin) || !isFinite(calcMax)) {
			console.warn("draw_filled_kernel_rectangle: invalid min/max values", calcMin, calcMax);
			return ctx;
		}

		// override given min/max if not valid
		minVal = (typeof minVal === "number" && isFinite(minVal)) ? minVal : calcMin;
		maxVal = (typeof maxVal === "number" && isFinite(maxVal)) ? maxVal : calcMax;

		if (maxVal === minVal) {
			maxVal = minVal + 1;
		}

		var scale = 255 / (maxVal - minVal);
		var imageData;
		try {
			imageData = ctx.createImageData(m, n);
		} catch (e) {
			console.error("draw_filled_kernel_rectangle: failed to create ImageData", e);
			return ctx;
		}

		for (var x = 0; x < n; x++) {
			if (!Array.isArray(this_layer_output[x]) || this_layer_output[x].length !== m) {
				console.warn("draw_filled_kernel_rectangle: row", x, "has invalid length, skipping");
				continue;
			}
			for (var y = 0; y < m; y++) {
				var rawVal = this_layer_output[x][y];
				if (typeof rawVal !== "number" || !isFinite(rawVal)) {
					console.warn("draw_filled_kernel_rectangle: invalid value at", x, y, "->", rawVal);
					continue;
				}
				var value = Math.floor((rawVal - minVal) * scale);
				var index = (x * m + y) * 4;
				var gray = Math.abs(255 - value);
				imageData.data[index] = gray;
				imageData.data[index + 1] = gray;
				imageData.data[index + 2] = gray;
				imageData.data[index + 3] = 255;
			}
		}

		var _ww = Number(meta_info?.input_shape?.[1]);
		var _hh = Number(meta_info?.input_shape?.[2]);
		if (!Number.isInteger(_ww) || !Number.isInteger(_hh) || _ww <= 0 || _hh <= 0) {
			console.warn("draw_filled_kernel_rectangle: invalid input_shape, using fallback size", _ww, _hh);
			_ww = m;
			_hh = n;
		}

		var _x = Math.floor(layerX - _ww / 2);
		var _y = Math.floor(neuronY - _hh / 2);

		try {
			// safer scaling path via drawImage
			var tempCanvas = document.createElement("canvas");
			tempCanvas.width = m;
			tempCanvas.height = n;
			var tctx = tempCanvas.getContext("2d");
			tctx.putImageData(imageData, 0, 0);
			ctx.drawImage(tempCanvas, _x, _y, _ww, _hh);

			ctx.strokeStyle = "black";
			ctx.lineWidth = 1;
			ctx.strokeRect(_x, _y, _ww, _hh);
		} catch (e) {
			console.error("draw_filled_kernel_rectangle: failed to render image", e);
		}

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

function annotate_output_neurons (ctx, layerId, numNeurons, j, font_size, layerX, neuronY) {
	ctx.strokeStyle = "black";
	ctx.lineWidth = 1;
	ctx.fill();
	ctx.stroke();
	ctx.closePath();

	if(layerId == model.layers.length - 1 && get_last_layer_activation_function() == "softmax") {
		if(labels && Array.isArray(labels) && labels.length && Object.keys(labels).includes(`${j}`) && numNeurons == labels.length) {
			ctx.beginPath();
			var canvasWidth = Math.max(800, $("#graphs_here").width());

			ctx.font = font_size + "px Arial";
			if(is_dark_mode) {
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
