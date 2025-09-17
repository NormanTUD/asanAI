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

		try {
			fcnn_initial_canvas_state = ctx.getImageData(0, 0, ctx.canvas.width, ctx.canvas.height);
		} catch (e) {
			log(e);
			log(`width: ${ctx.canvas.width}, height: ${ctx.canvas.height}`);
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

	var canvasWidth = Math.max(800, $("#graphs_here").width());
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
			//log(`width: ${width}, height: ${height}`)
			
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

function _draw_flatten (layerId, ctx, meta_info, maxShapeSize, canvasHeight, layerX, layerY, _height) {
	try {
		if(meta_info["output_shape"]) {
			var this_layer_states = null;

			if(proper_layer_states_saved() && layer_states_saved && layer_states_saved[`${layerId}`]) {
				this_layer_states = layer_states_saved[`${layerId}`];
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
