"use strict";

function visualizeNumbersOnCanvas(numberArray, blockWidth = 1, blockHeight = 25) {
	assert(Array.isArray(numberArray), "visualizeNumbersOnCanvas: numberArray is not an Array, but " + typeof(numberArray));
	assert(typeof(blockWidth) == "number", "blockWidth is not a number, but " + typeof(blockWidth));
	assert(typeof(blockHeight) == "number", "blockHeight is not a number, but " + typeof(blockHeight));

	// Create or retrieve the canvas element
	var canvas = document.createElement("canvas");
	canvas.id = "neurons_canvas_" + uuidv4();
	canvas.classList.add("neurons_canvas_class");

	// Calculate the canvas width based on the number of elements
	var canvasWidth = numberArray.length * blockWidth;
	var canvasHeight = blockHeight;

	// Set the canvas dimensions
	canvas.width = canvasWidth;
	canvas.height = canvasHeight;

	var ctx = canvas.getContext("2d");
	var blocksPerRow = Math.floor(canvas.width / blockWidth);

	for (var numberArray_idx = 0; numberArray_idx < numberArray.length; numberArray_idx++) {
		var value = numberArray[numberArray_idx];
		var grayscaleValue = Math.round((value / numberArray[numberArray.length - 1]) * 255);
		var color = "rgb(" + grayscaleValue + "," + grayscaleValue + "," + grayscaleValue + ")";

		var x = (numberArray_idx % blocksPerRow) * blockWidth;
		var y = Math.floor(numberArray_idx / blocksPerRow) * blockHeight;

		ctx.fillStyle = color;
		ctx.fillRect(x, y, blockWidth, blockHeight);
	}

	return canvas;
}

function normalize_to_rgb_min_max (x, min, max) {
	assert(typeof(x) == "number", "x is not a number");

	if(typeof(max) != "number" || typeof(min) != "number") {
		return x;
	}

	assert(typeof(x) == "number", "x is not a number, but " + typeof(x));
	assert(typeof(min) == "number", "min is not a number, but " + typeof(min));
	assert(typeof(max) == "number", "max is not a number, but " + typeof(max));

	assert(!isNaN(x), "x is NaN");
	assert(!isNaN(min), "min is NaN");
	assert(!isNaN(max), "max is NaN");

	var multiplicator = x - min;
	var divisor = max - min;

	//log("x:", x, "min:", min, "multiplicator:", multiplicator, "divisor:", divisor);

	if(divisor == 0) {
		return val;
	}

	assert(typeof(multiplicator) == "number", "multiplicator is not a number, but " + typeof(multiplicator));
	assert(typeof(divisor) == "number", "divisor is not a number, but " + typeof(divisor));

	assert(!isNaN(divisor), "divisor is NaN");
	assert(!isNaN(multiplicator), "multiplicator is NaN");

	var to_be_parsed_as_int = 255 * multiplicator / divisor;

	var val = parse_int(to_be_parsed_as_int);

	if(val > 255) {
		val = 255;
	} else if (val < 0) {
		val = 0;
	}

	return val;
}

function get_canvas_in_class (layer, classname, dont_append, use_uuid=0) {
	var _uuid = "";
	var _uuid_str = "";
	if (use_uuid) {
		_uuid = uuidv4();
		_uuid_str = " id='" + _uuid + "'";
	}
	var new_canvas = $("<canvas" + _uuid_str + "/>", {class: "layer_image"}).prop({
		width: 0,
		height: 0
	});
	if(!dont_append) {
		$($("." + classname)[layer]).append(new_canvas);
	}

	return new_canvas[0];
}

function get_dim(a) {
	if(!a) {
		return 0;
	}

	var dim = [];
	for (;;) {
		dim.push(a.length);

		if (Array.isArray(a[0])) {
			a = a[0];
		} else {
			break;
		}
	}
	return dim;
}

function shape_looks_like_image_data (shape) {
	if(!shape) {
		return "unknown";
	}

	if(shape.length == 3) {
		if(shape[2] == 3) {
			return "simple";
		} else {
			return "filter";
		}
	} else if(shape.length == 4) {
		if(shape[1] <= 4 && shape[2] <= 4) {
			return "kernel";
		}
	}

	return "unknown";
}

function looks_like_image_data (data) {
	var shape = get_dim(data);
	var res = shape_looks_like_image_data(shape);

	return res;
}

function draw_rect(ctx, rect) {
	assert(typeof(ctx) == "object", "ctx must be of type object, but is " + typeof(ctx));
	assert(typeof(rect) == "object", "rect must be of type object, but is " + typeof(rect));

	ctx.fillStyle = rect.fill;
	ctx.strokeStyle = rect.stroke;
	ctx.fillRect(rect.x, rect.y, rect.w,rect.h);
	ctx.strokeRect(rect.x, rect.y, rect.w, rect.h);
}

function draw_grid_grayscale (canvas, pixel_size, colors, pos) {
	assert(typeof(canvas) == "object", "canvas is not an object, but " + typeof(canvas));
	assert(typeof(pixel_size) == "number", "pixel_size is not a number, but " + typeof(pixel_size));
	assert(Array.isArray(colors), "colors is not an array, but " + typeof(colors));
	assert(typeof(pos) == "number", "pos is not a number, but " + typeof(pos));

	var drew_something = false;

	var _width = colors[0].length;
	var _height = colors.length;

	$(canvas).attr("width", _width * pixel_size);
	$(canvas).attr("height", _height * pixel_size);

	var ctx = $(canvas)[0].getContext("2d");
	ctx.beginPath();

	var min = 0;
	var max = 0;

	for (var x = 0, i = 0; i < _width; x += pixel_size, i++) {
		for (var y = 0, j = 0; j < _height; y += pixel_size, j++) {
			var red = colors[j][i][pos];
			var green = colors[j][i][pos];
			var blue = colors[j][i][pos];

			if(red > max) { max = red; }
			if(green > max) { max = green; }
			if(blue > max) { max = blue; }

			if(red < min) { min = red; }
			if(green < min) { min = green; }
			if(blue < min) { min = blue; }
		}
	}

	for (var x = 0, i = 0; i < _width; x += pixel_size, i++) {
		for (var y = 0, j = 0; j < _height; y += pixel_size, j++) {
			var red = normalize_to_rgb_min_max(colors[j][i][pos], min, max);
			var green = normalize_to_rgb_min_max(colors[j][i][pos], min, max);
			var blue = normalize_to_rgb_min_max(colors[j][i][pos], min, max);

			var color = "rgb(" + red + "," + green + "," + blue + ")";
			var pixel = {
				x: x,
				y: y,
				w: pixel_size,
				h: pixel_size,
				fill: color,
				stroke: color
			};
			draw_rect(ctx, pixel);
			drew_something = true;
		}
	}
	ctx.fill();
	ctx.closePath();

	return drew_something;
}

function draw_grid (canvas, pixel_size, colors, denormalize, black_and_white, onclick, multiply_by, data_hash, _class="") {
	assert(typeof(pixel_size) == "number", "pixel_size must be of type number, is " + typeof(pixel_size));
	if(!multiply_by) {
		multiply_by = 1;
	}

	var drew_something = false;

	var _height = colors.length;
	var _width = colors[0].length;

	$(canvas).attr("width", _width * pixel_size);
	$(canvas).attr("height", _height * pixel_size);
	if(_class) {
		$(canvas).attr("class", _class);
	}

	if(typeof(data_hash) == "object") {
		for (name in data_hash) {
			$(canvas).data(name, data_hash[name]);
		}
	}

	if(onclick) {
		$(canvas).attr("onclick", onclick);
	}

	var ctx = $(canvas)[0].getContext("2d");
	ctx.beginPath();

	var min = 0;
	var max = 0;

	if(denormalize) {
		for (var x = 0, i = 0; i < _width; x += pixel_size, i++) {
			for (var y = 0, j = 0; j < _height; y += pixel_size, j++) {
				var red, green, blue;

				if(black_and_white) {
					red = green = blue = colors[j][i];
				} else {
					red = colors[j][i][0];
					green = colors[j][i][1];
					blue = colors[j][i][2];
				}

				if(red > max) { max = red; }
				if(green > max) { max = green; }
				if(blue > max) { max = blue; }

				if(red < min) { min = red; }
				if(green < min) { min = green; }
				if(blue < min) { min = blue; }
			}
		}
	}

	for (var x = 0, i = 0; i < width; x += pixel_size, i++) {
		for (var y = 0, j = 0; j < _height; y += pixel_size, j++) {
			var red, green, blue;

			if(black_and_white) {
				red = green = blue = colors[j][i] * multiply_by;
			} else {
				red = colors[j][i][0] * multiply_by;
				green = colors[j][i][1] * multiply_by;
				blue = colors[j][i][2] * multiply_by;
			}

			if(denormalize) {
				if(red) {
					red = normalize_to_rgb_min_max(red, min, max);
				}

				if(green) {
					green = normalize_to_rgb_min_max(green, min, max);
				}

				if(blue) {
					blue = normalize_to_rgb_min_max(blue, min, max);
				}
			}

			var color = "rgb(" + red + "," + green + "," + blue + ")";
			var pixel = {
				x: x,
				y: y,
				w: pixel_size,
				h: pixel_size,
				fill: color,
				stroke: color
			};
			draw_rect(ctx, pixel);
			drew_something = true;
		}
	}

	ctx.fill();
	ctx.closePath();

	return drew_something;
}

function draw_kernel(canvasElement, rescaleFactor, pixels) {
	// canvasElement is the HTML canvas element where you want to draw the image
	// rescaleFactor is the factor by which the image should be resized, e.g., 2 for twice the size
	// pixels is a 3D array [n, m, a] where n is the height, m is the width, and a is the number of channels

	scaleNestedArray(pixels);

	var context = canvasElement.getContext("2d"); // Get the 2D rendering context

	var [n, m, a] = [pixels.length, pixels[0].length, pixels[0][0].length]; // Destructure the dimensions

	if (a === 3) {
		// Draw a color image on the canvas and resize it accordingly
		canvasElement.width = m * rescaleFactor;
		canvasElement.height = n * rescaleFactor;

		for (let i = 0; i < n; i++) {
			for (let j = 0; j < m; j++) {
				var [r, g, b] = pixels[i][j]; // Assuming channels are [red, green, blue]
				context.fillStyle = `rgb(${r}, ${g}, ${b}`;
				context.fillRect(j * rescaleFactor, i * rescaleFactor, rescaleFactor, rescaleFactor);
			}
		}
	} else {
		// Draw only the first channel
		canvasElement.width = m * rescaleFactor;
		canvasElement.height = n * rescaleFactor;

		for (let i = 0; i < n; i++) {
			for (let j = 0; j < m; j++) {
				const grayscaleValue = pixels[i][j][0]; // Assuming the first channel is grayscale
				context.fillStyle = `rgb(${grayscaleValue}, ${grayscaleValue}, ${grayscaleValue}`;
				context.fillRect(j * rescaleFactor, i * rescaleFactor, rescaleFactor, rescaleFactor);
			}
		}
	}
}

function draw_image_if_possible (layer, canvas_type, colors, get_canvas_object) {
	var canvas = null;

	try {
		var ret = false;

		var data_type = looks_like_image_data(colors);

		if(data_type == "simple") {
			if(canvas_type == "input") {
				canvas = get_canvas_in_class(layer, "input_image_grid", !get_canvas_object);
			} else {
				canvas = get_canvas_in_class(layer, "image_grid", !get_canvas_object);
			}

			if(!get_canvas_object) {
				$($(canvas)[0]).parent().parent().show();
			}

			ret = draw_grid(canvas, pixel_size, colors, 1, 0, "", "", "");

			if(get_canvas_object) {
				return canvas;
			}

			return ret;
		} else if((data_type == "kernel" || canvas_type == "kernel")) {
			var shape = get_dim(colors);

			var canvasses = [];

			for (var filter_id = 0; filter_id < shape[0]; filter_id++) {
				for (var channel_id = 0; channel_id < shape[1]; channel_id++) {
					canvas = get_canvas_in_class(layer, "filter_image_grid", !get_canvas_object);

					if(!get_canvas_object) {
						$($(canvas)[0]).parent().parent().show();
					}

					ret = draw_kernel(canvas, kernel_pixel_size, colors[filter_id]);

					if(get_canvas_object) {
						canvasses.push(canvas);
					}
				}
			}

			if(get_canvas_object) {
				return canvasses;
			}
			return ret;
		} else if(data_type == "filter") {
			var shape = get_dim(colors);

			var canvasses = [];

			for (var k = 0; k < shape[2]; k++) {
				if(canvas_type == "input") {
					canvas = get_canvas_in_class(layer, "input_image_grid", !get_canvas_object);
				} else {
					canvas = get_canvas_in_class(layer, "image_grid", !get_canvas_object);
				}

				if(!get_canvas_object) {
					$($(canvas)[0]).parent().parent().show();
				}

				ret = draw_grid_grayscale(canvas, pixel_size, colors, k);

				if(get_canvas_object) {
					canvasses.push(canvas);
				}
			}

			if(get_canvas_object) {
				return canvasses;
			}

			return ret;
		}
	} catch (e) {
		err(e);
	}

	return false;
}

function get_layer_type_array () {
	var r = [];

	for (var layer_idx = 0; layer_idx < get_number_of_layers(); layer_idx++) {
		r.push($($(".layer_type")[layer_idx]).val());
	}

	return r;
}

function deepTranspose(arr) {
	if (!Array.isArray(arr)) return arr;

	const shape = [];
	let tmp = arr;
	while (Array.isArray(tmp)) {
		shape.push(tmp.length);
		tmp = tmp[0];
	}

	return recurse(arr, shape);
}

function recurse(a, dims) {
	if (dims.length === 1) return a;

	const [first, ...rest] = dims;
	const result = Array.from({ length: dims[dims.length - 1] }, (_, i) =>
		recurse(a.map(row => row[i]), rest)
	);
	return result;
}

function get_group_layers_groups (list_activation_layers, batch_or_layer_normalization, feature_extraction_base) {
	return [
		{
			"re": "((?:upSampling2d;?)+)",
			"name": "Scaling up"
		},
		{
			"re": "((?:lstm;)+)",
			"name": "LSTM"
		},
		{
			"re": "((?:[^;]+Pooling[0-9]D;?)+;?)",
			"name": "<span class='TRANSLATEME_dimensionality_reduction'></span>"
		},
		{
			"re": "((?:" + list_activation_layers.join("|") + ")+)",
			"name": "<span class='TRANSLATEME_shy_activation_function'></span>"
		},
		{
			"re": "((?:dropout;?)+)",
			"name": "<span class='TRANSLATEME_shy_overfitting_prevention'></span>"
		},
		{
			"re": batch_or_layer_normalization,
			"name": "<span class='TRANSLATEME_rescale_and_recenter'></span>"
		},
		{
			"re": "(" + batch_or_layer_normalization + "*(?:" + feature_extraction_base + "))",
			"name": "<span class='TRANSLATEME_feature_extraction'></span>"
		},
		{
			"re": "(" + batch_or_layer_normalization + "*(?:(?:" + feature_extraction_base + ";?)*(?:dropout?;);?))",
			"name": "Feature ex&shy;trac&shy;tion &amp; Over&shy;fit&shy;ting pre&shy;vention"
		},
		{
			"re": "((?:dense;?)+;?(?:dropout)?(?:dense;?)*)",
			"name": "<span class='TRANSLATEME_classification'></span>"
		},
		{
			"re": "((?:flatten;?)+;?)",
			"name": "<span class='TRANSLATEME_flatten'></span>"
		},
		{
			"re": "((?:reshape;?)+;?)",
			"name": "<span class='TRANSLATEME_change_shape'></span>"
		},
		{
			"re": "((?:(?:gaussian[^;]|alphaDropout)+;?)+;?)",
			"name": "<span class='TRANSLATEME_simulate_real_data'></span>"
		},
		{
			"re": "(DebugLayer)+",
			"name": "Debugger"
		}
	]
}

function group_layers (layers) {
	assert(Array.isArray(layers), "group_layers parameter is not an Array, but " + typeof(layers));

	var str = layers.join(";");

	var char_to_group = new Array(str.length);
	char_to_group.fill(null);

	var feature_extraction_base = "(?:(?:depthwise|separable)?conv.d(?:transpose)?;?)+;?(?:(?:batch|layer)Normalization;)*;?(?:[^;]+Pooling.d;?)*";

	var layer_names = Object.keys(layer_options);

	var list_activation_layers = [];

	for (var layer_name_idx = 0; layer_name_idx < layer_names.length; layer_name_idx++) {
		var category = layer_options[layer_names[layer_name_idx]]["category"];
		if(category == "Activation") {
			list_activation_layers.push(layer_names[layer_name_idx]);
		}
	}

	var batch_or_layer_normalization = "((?:(?:batch|layer)Normalization;?)+)";

	var descs = get_group_layers_groups(list_activation_layers, batch_or_layer_normalization, feature_extraction_base);

	for (var desc_i = 0; desc_i < descs.length; desc_i++) {
		var this_re = RegExp(descs[desc_i]["re"], "ig");
		var current_match;
		while ((current_match = this_re.exec(str)) !== null) {
			for (var new_index = current_match["index"]; new_index < (current_match["index"] + current_match[1].length); new_index++) {
				char_to_group[new_index] = descs[desc_i]["name"];
			}
		}
	}

	var layer_to_char_start = [];

	var current_layer_nr = 0;
	for (var str_idx = 0; str_idx < str.length; str_idx++) {
		if(str[str_idx] == ";") {
			current_layer_nr++;
		} else if(str[str_idx - 1] == ";" || str_idx == 0) {
			layer_to_char_start[current_layer_nr] = str_idx;
		}
	}

	var result = [];

	var last_layer_type = char_to_group[0];

	var current_type_layers = [];

	for (var char_idx = 0; char_idx < layer_to_char_start.length; char_idx++) {
		var layer_type = char_to_group[layer_to_char_start[char_idx]];

		if(last_layer_type != layer_type) {
			var this_item = {};
			this_item[last_layer_type] = current_type_layers;
			result.push(this_item);

			current_type_layers = [];
			last_layer_type = layer_type;
		}

		current_type_layers.push(char_idx);
	}

	var this_item = {};
	this_item[last_layer_type] = current_type_layers;
	result.push(this_item);

	return result;
}

async function write_descriptions (force=0) {
	if(!force) {
		var new_hash = await get_model_config_hash() + "_" + $(window).width();
		if(last_drawn_descriptions == new_hash) {
			//log("last_drawn_descriptions == new_hash");
			$(".descriptions_of_layers").remove();
		}

		last_drawn_descriptions = new_hash;
	}

	if(is_hidden_or_has_hidden_parent($("#layers_container"))) {
		$(".descriptions_of_layers").hide();
		return;
	}

	if(disable_show_python_and_create_model) {
		//log("!disable_show_python_and_create_model");
		$(".descriptions_of_layers").remove();
		return;
	}

	var groups = group_layers(get_layer_type_array());

	if(groups.length <= 0) {
		//log("groups.length <= 0");
		$(".descriptions_of_layers").remove();
		return;
	}

	$(".descriptions_of_layers").remove();

	var layer = $(".layer");

	if(!layer.length) {
		//log("!layer.length!");
		return;
	}

	var right_offset = parse_int($(layer[0]).offset().left + $(layer[0]).width() + 26);

	var all_layer_markers = $(".layer_start_marker");
	assert(all_layer_markers.length >= 1);

	for (var group_idx = 0; group_idx < groups.length; group_idx++) {
		var group = groups[group_idx];
		var keyname = Object.keys(groups[group_idx])[0];
		var layers = groups[group_idx][keyname];
		var last_layer_nr = layers[layers.length - 1];

		var first_layer = $(layer[layers[0]]);
		assert(first_layer.length, "first_layer could not be determined");

		var last_layer = $(layer[Math.max(0, last_layer_nr - 1)]);
		assert(last_layer.length, "last_layer could not be determined");

		var first_layer_idx = Math.min(...group[keyname]);
		assert(typeof(first_layer_idx) === "number", "first_layer_idx is not a number");
		assert(!isNaN(first_layer_idx), "first_layer_idx is NaN");

		var first_layer_marker = $(all_layer_markers[first_layer_idx]);
		assert(first_layer_marker.length, "first_layer_marker could not be determined");

		var first_layer_start = parse_int(first_layer_marker.offset()["top"] - 6.5);
		assert(first_layer_start, "first_layer_start could not be determined");

		var last_layer_end = parse_int($($(".layer_end_marker")[last_layer_nr]).offset()["top"]);
		assert(typeof(last_layer_end) === "number", "last_layer_end is not a number");
		assert(last_layer_end >= 0, "last_layer_end is not a number");

		var first_layer_top = parse_int(first_layer.position()["top"]);
		assert(typeof(first_layer_top) === "number", "first_layer_top is not a number");
		assert(first_layer_top >= 0, "first_layer_top is smaller or equal to 0");

		if(keyname != "null" && keyname && keyname != "undefined") {
			var _height = last_layer_end - first_layer_start - 13;
			var hidden = "";
			if(is_hidden_or_has_hidden_parent($("#layers_container_left"))) {
				hidden = "display: none;";
			}

			var new_div_html = "";
			new_div_html = `<div class="descriptions_of_layers" style="position: absolute; top: ${first_layer_top}px; left: ${right_offset}px; height: ${_height}px; ${hidden}">${keyname}</div>`;

			$(new_div_html).appendTo("#maindiv");
		}
	}

	$(".descriptions_of_layers").show();

	await update_translations();
}

function explain_error_msg (_err) {
	if(!_err) {
		return "";
	}

	if(typeof(_err) == "object") {
		_err = _err.toString();
	}

	log(_err);

	var explanation = "";

	if(model && model.layers && model.layers.length) {
		var last_layer_name = model.layers[model.layers.length - 1].name;
		if(_err.includes(last_layer_name) && _err.includes("Error when checking target") && _err.includes("but got array with shape")) {
			explanation = "This may mean that the number of neurons in the last layer do not conform with the data structure in the training-data-outputs.";
		} else if(_err.includes("does not match the shape of the rest")) {
			explanation = "Have you repeatedly pressed 'Start training'? The second one may have started while the first one was not ready, and re-downloaded images. Please reload the page.";
		} else if(_err.includes("Failed to compile fragment shader")) {
			explanation = "This may mean that the batch-size and/or filter-size and/or image dimension resize-sizes are too large, or your GPU memory is too low. Try disabling GPU acceleration (see General -> CPU instead of WebGL).";
		} else if(_err.includes("target expected a batch of elements where each example")) {
			explanation = "The last number of neurons in the last layer may not match the number of categories.<br><br>It may also be possible that you chose a wrong Loss function. If the number of neurons match, try choosing other losses, like categoricalCrossentropy.<br><br>You may also have only one category, but you need at least two.";
		} else if(_err.includes("but got array with shape 0,")) {
			explanation = "Have you forgotten to add your own training data?";
		} else if(_err.includes("texShape is undefined")) {
			explanation = "Please check if any of the output-dimensions contain '0' and if so, try to minimize the dimensionality reduction so that all zeroes disappear.";
		} else if(_err.includes("info is undefined")) {
			explanation = "Have you enabled debug-mode and also stopped training early? Please try disabling debug mode and re-train.<br><br>This might also be caused by calling `tf.disposeVariables()` somewhere...";
		} else if(_err.includes("expects targets to be binary matrices")) {
			explanation = "Try choosing another loss and metric function, like Mean Squared Error (MSE) or Mean Absolute Error (MAE).";
		} else if(_err.includes("oneHot: depth must be")) {
			explanation = "Try choosing another loss and metric function, like Mean Squared Error (MSE) or Mean Absolute Error (MAE).";
		} else if(_err.includes("Cannot find a connection between any variable and the result of the loss function")) {
			explanation = "This is probably a bug in asanAI. This may happen when the function run_neural_network is called, but the model is not compiled (e.g. the compile_model function throws an exception). You should never see this. Sorry.";
		} else if (_err.includes("Input Tensors should have the same number of samples as target Tensors") || _err.includes("not defined") || _err.includes("Cannot convert")) {
			explanation = "This is probably a bug in asanAI"
		} else if(_err.includes("numeric tensor, but got string tensor")) {
			if($("#data_origin").val() == "csv") {
				explanation = "Please check your CSV-file input to remove unneeded extra characters. Neither input nor output tensors should contain any strings, but only integers and floats.";
			} else {
				explanation = "Are you sure your input data is numeric?";
			}
		} else if(_err.includes("input expected a batch of elements where each example has shape")) {
			explanation = "Does the input-shape match the data?";
		} else if (_err.includes("Error when checking input") && _err.includes("but got array with shape")) {
			if($("#data_origin").val() == "csv") {
				explanation = "Have you chosen an 'own'-data-source with CSV-files in a network with convolutional layers?";
			}
		}
	} else {
		explanation = "No layers.";
	}

	if(explanation.length) {
		return explanation;
	}

	return "";
}

function layer_is_red (layer_nr) {
	assert(typeof(layer_nr) == "number", "layer_nr is not a number but " + layer_nr + "(" + typeof(layer_nr) + ")");
	var color = $($("div.container.layer")[layer_nr]).css("background-color");

	if(color == "rgb(255, 0, 0)") {
		return true;
	}

	return false;
}

/* This function will write the given text to the layer identification of the given number. If the text is empty, it will clear the layer identification. */

function write_layer_identification (nr, text) {
	assert(typeof(nr) == "number", "write_layer_identification: first parameter nr is not a number but " + typeof(nr) + " (" + nr + ")");
	assert(typeof(text) == "string", "write_layer_identification: second parameter text is not a string but " + typeof(text) + " (" + text + ")");

	if(text.length) {
		$($(".layer_identifier")[nr]).html(text);
	} else {
		$($(".layer_identifier")[nr]).html("");
	}

}

function get_layer_identification (layer_idx) {
	assert(typeof(layer_idx) == "number", "layer_idx is not a number");

	if(model === null || model === undefined) {
		model_is_ok();
		return "";
	}

	if(!model) {
		return "";
	}

	if(!Object.keys(model).includes("layers")) {
		return "";
	}

	if(!model.layers.length) {
		return "";
	}

	if(layer_idx >= model.layers.length) {
		return "";
	}

	if(model.layers[layer_idx] && Object.keys(model.layers[layer_idx]).length >= 1) {
		var object_keys = Object.keys(model.layers[layer_idx]);
		var new_str = "";

		if(object_keys.includes("filters") && object_keys.includes("kernelSize")) {
			new_str = model.layers[layer_idx]["filters"] + "@" + model.layers[layer_idx].kernelSize.join("x");

		} else if(object_keys.includes("filters")) {
			new_str = "Filters:&nbsp;" + model.layers[layer_idx]["filters"];

		} else if(object_keys.includes("units")) {
			new_str = "Units:&nbsp;" + model.layers[layer_idx]["units"];

		} else if(object_keys.includes("rate")) {
			new_str = "Rate:&nbsp;" + model.layers[layer_idx]["rate"];

		} else if(object_keys.includes("poolSize")) {
			new_str = model.layers[layer_idx].poolSize.join("x");
		}

		return new_str;
	}

	return "";
}

async function fetchLayerShapeStatus (layer_idx, output_shape_string, has_zero_output_shape) {
	if(model && model.layers && model.layers.length >= layer_idx) {
		try {
			model.layers[layer_idx].input.shape;
		} catch(e) {
			void(0); dbg("Model has multi-node inputs. It should not have!!! Continuing anyway, but please, debug this!!!");
		}

		if (model && model.layers && layer_idx in model.layers) {
			const this_layer = model.layers[layer_idx];

			if(this_layer) {
				var shape = JSON.stringify(this_layer.getOutputAt(0).shape);
				if(/((\[|,)\s*)\s*0\s*((\]|,)\s*)/.test(shape) || /\[\s*(0,?\s*?)+\s*\]/.test(shape)) {
					output_shape_string = "<span style='background-color: red'>Output:&nbsp;" + shape + "</span>";
					output_shape_string = output_shape_string.replace("null,", "");
					has_zero_output_shape = true;
				} else {
					output_shape_string = "Output:&nbsp;" + shape;
					output_shape_string = output_shape_string.replace("null,", "");
				}
			}
		}
	} else {
		void(0); dbg(`identify_layers: layer_idx = ${layer_idx} is not in model.layers. This may happen when the model is recompiled during this step and if so, is probably harmless.`);
	}

	if(has_zero_output_shape) {
		var basemsg = "ERROR: There are zeroes in the output shape. ";
		var msg = basemsg + "The input shape will be resetted the the last known working configuration.";

		disable_train();

		throw new Error(msg);

		return;
	} else {
		enable_train();
	}

	return [output_shape_string, has_zero_output_shape];
}

async function identify_layers () {
	var number_of_layers = $("div.container.layer").length;

	if(!model) {
		err(language[lang]["no_model_defined"]);
		return;
	}

	if(!Object.keys(model).includes("layers") || model.layers.length == 0) {
		wrn(language[lang]["the_loaded_model_has_no_layers"]);
		return;
	}

	//console.trace();
	has_zero_output_shape = false;

	var failed = 0;
	for (var layer_idx = 0; layer_idx < number_of_layers; layer_idx++) {
		$($(".layer_nr_desc")[layer_idx]).html(layer_idx + ":&nbsp;");
		var new_str = get_layer_identification(layer_idx);

		if(new_str != "") {
			new_str = new_str + ",&nbsp;";
		}

		var output_shape_string = "";
		try {
			[output_shape_string, has_zero_output_shape] = await fetchLayerShapeStatus(layer_idx, output_shape_string, has_zero_output_shape);
		} catch (e) {
			if(Object.keys(e).includes("message")) {
				e = e.message;
			}

			if(("" + e).includes("model is null") || ("" + e).includes("is undefined") || ("" + e).includes("reading 'getOutputAt'")) {
				err("" + e);
			} else {
				throw new Error(e);
			}

			return;
		}

		var activation_function_string = "";
		try {
			if(model && model.layers && layer_idx in model.layers) {
				var this_layer = $($(".layer")[layer_idx]);
				var act = $(this_layer.find(".activation")).val();
				if("" + act != "undefined") {
					activation_function_string = ", " + act;
				}
			}
		} catch (e) {
			throw new Error(e);
		}

		if(layer_is_red(layer_idx)) {
			failed++;
			write_layer_identification(layer_idx, "<span class='layer_identifier_activation'></span>");
		} else {
			write_layer_identification(layer_idx + failed, new_str + output_shape_string + "<span class='layer_identifier_activation'>" + activation_function_string + "</span>");
		}
	}

	if(!has_zero_output_shape) {
		shown_has_zero_data = false;
	}

}

function hide_unused_layer_visualization_headers () {
	for (var layer_idx = 0; layer_idx < get_number_of_layers(); layer_idx++) {
		hide_layer_visualization_header_if_unused(layer_idx);
	}
}

function hide_layer_visualization_header_if_unused (layer) {
	assert(typeof(layer) == "number", "layer is not a number");

	var used = 0;

	if($($(".kernel_image_grid_div")[layer]).css("display") != "none") {
		used = 1;
	}

	if($($(".output_image_grid_div")[layer]).css("display") != "none") {
		used = 1;
	}

	if($($(".input_image_grid_div")[layer]).css("display") != "none") {
		used = 1;
	}

	if(used == 0) {
		$($(".layer_data")[layer]).hide();
	}

}

function add_layer_debuggers () {
	$("#datalayers").html("");

	$(".layer_data").html("");

	if(!model) {
		if(finished_loading) {
			dbg(language[lang]["no_model_found"]);
		}

		return;
	}

	if(!model.layers) {
		if(finished_loading) {
			dbg(language[lang]["no_layers_found"]);
		}
	}

	try {
		if(!model) {
			return;
		}

		if(!model.layers) {
			return;
		}

		for (var layer_idx = 0; layer_idx < model.layers.length; layer_idx++) {
			if(get_methods(model.layers[layer_idx]).includes("original_apply_real")) {
				model.layers[layer_idx].apply = model.layers[layer_idx].original_apply_real;
			}

			model.layers[layer_idx].original_apply_real = model.layers[layer_idx].apply;

			var code = `model.layers[${layer_idx}].apply = function (inputs, kwargs) {
				if (${layer_idx} == 0) {
					layer_states_saved = {}
				}

				var applied = model.layers[${layer_idx}].original_apply_real(inputs, kwargs);

				if(!disable_layer_debuggers) {
					if($("#show_layer_data").is(":checked")) {
						draw_internal_states(${layer_idx}, inputs, applied);
					}
				}

				var this_layer_data = {
					input: array_sync(inputs[0]),
					output: array_sync(applied),
					model_uuid: model.uuid
				};

				layer_states_saved["${layer_idx}"] = this_layer_data;

				return applied;
			}`;

			try {
				eval(code);
			} catch (e) {
				if(Object.keys(e).includes("message")) {
					e = e.message;
				}

				if(("" + e).includes("already disposed")) {
					wrn("" + e);
				} else {
					throw new Error("" + e);
				}
			}
		}
	} catch (e) {
		err(e);
	}
}

function show_and_append_layer_divs (layer_div, layer) {
	layer_div.show();
	layer_div.append("<div class='data_flow_visualization input_layer_header' style='display: none' id='layer_" + layer + "_input'><h4>Input:</h4></div>");
	layer_div.append("<div class='data_flow_visualization weight_matrix_header' style='display: none' id='layer_" + layer + "_kernel'><h4>" + language[lang]["weight_matrices"] + ":</h4></div>");
	layer_div.append("<div class='data_flow_visualization output_header' style='display: none' id='layer_" + layer + "_output'><h4>Output:</h4></div>");
	layer_div.append("<div class='data_flow_visualization equations_header' style='display: none' id='layer_" + layer + "_equations'></div>");
}

function show_intermediate_representations(canvas_input, canvas_output, canvas_kernel, input, kernel, output, layer) {
	for (var j = 0; j < canvas_input.length; j++) {
		for (var canvas_idx = 0; canvas_idx < canvas_output.length; canvas_idx++) {
			var img_output = canvas_output[canvas_idx];
			if(Object.keys(canvas_kernel).includes(canvas_idx + "")) {
				var img_kernel = canvas_kernel[canvas_idx * 3];
				if(layer == 0) {
					input.append(canvas_input[j * 3]).show();
				}
				kernel.append(img_kernel).show();
			}
			output.append(img_output).show();
		}
	}

	return [input, kernel, output];
}

function draw_internal_states (layer, inputs, applied) {
	typeassert(layer, int, "layer");
	typeassert(inputs, array, "inputs");

	var number_of_items_in_this_batch = inputs[0].shape[0];

	for (var batchnr = 0; batchnr < number_of_items_in_this_batch; batchnr++) {
		var input_data = array_sync(inputs[0])[batchnr];
		var output_data = array_sync(applied)[batchnr];

		var layer_div = $($(".layer_data")[layer]);
		if(batchnr == 0) {
			layer_div.append("<h1>Layer data flow</h1>");
		}
		layer_div.html("<h3 class=\"data_flow_visualization layer_header\">Layer " + layer + " &mdash; " + $($(".layer_type")[layer]).val() + " " + get_layer_identification(layer) + "</h3>").hide();

		show_and_append_layer_divs(layer_div, layer)

		var input = $("#layer_" + layer + "_input");
		var kernel = $("#layer_" + layer + "_kernel");
		var output = $("#layer_" + layer + "_output");
		var equations = $("#layer_" + layer + "_equations");

		show_layer_visualization_tab();

		var kernel_data = [];

		if(Object.keys(model.layers[layer]).includes("kernel")) {
			if(model.layers[layer].kernel.val.shape.length == 4) {
				var ks_x = 0;
				var ks_y = 1;
				var number_filters = 2;
				var filters = 3;

				kernel_data = tidy(() => {
					return array_sync(tf_transpose(model.layers[layer].kernel.val, [filters, ks_x, ks_y, number_filters]));
				});
			}
		}

		var canvas_input = draw_image_if_possible(layer, "input", input_data, 1);
		var canvas_kernel = draw_image_if_possible(layer, "kernel", kernel_data, 1);
		var canvas_output = draw_image_if_possible(layer, "output", output_data, 1);

		if(canvas_output.length && canvas_input.length) {
			[input, kernel, output] = show_intermediate_representations(canvas_input, canvas_output, canvas_kernel, input, kernel, output, layer);
		} else if (canvas_output.length && canvas_input.nodeName == "CANVAS") {
			[input, kernel, output] = visualize_layer_canvases_simple(canvas_input, canvas_kernel, canvas_output, input, kernel, output, layer);
		} else {
			[input, output, equations] = show_layer_state_or_data(canvas_input, canvas_output, output_data, input, output, equations, layer);
		}
	}
}

function show_layer_state_or_data (canvas_input, canvas_output, output_data, input, output, equations, layer) {
	if(canvas_input.nodeName == "CANVAS") {
		if(layer == 0) {
			input.append(canvas_input).show();
		}
		if(canvas_output.nodeName == "CANVAS") {
			var img_output = canvas_output;
			output.append(img_output).show();
		}
	} else {
		if(get_shape_from_array(output_data).length == 1 && !$("#show_raw_data").is(":checked")) {
			var h = visualizeNumbersOnCanvas(output_data);
			equations.append(h).show();
		} else {
			var h = array_to_html(output_data);
			equations.append(h).show();
		}
	}

	return [input, output, equations]
}

function visualize_layer_canvases_simple (canvas_input, canvas_kernel, canvas_output, input, kernel, output, layer) {
	if(canvas_output) {
		for (var canvas_idx = 0; canvas_idx < canvas_output.length; canvas_idx++) {
			var img_output = canvas_output[canvas_idx];
			if(layer == 0) {
				input.append(canvas_input).show();
			}
			if(Object.keys(canvas_kernel).includes(canvas_idx + "")) {
				var img_kernel = canvas_kernel[canvas_idx * 3];
				kernel.append(img_kernel).show();
			}
			output.append(img_output).show();
		}
	}

	return [input, kernel, output];
}

function deprocess_image(x) {
	assert(Object.keys("isDisposedInternal"), "x for deprocess image is not a tensor but " + typeof(x));

	var res = tidy(() => {
		try {
			const {mean, variance} = tf_moments(x);
			x = tf_sub(x, mean);
			// Add a small positive number (EPSILON) to the denominator to prevent
			// division-by-zero.
			x = tf_add(tf_div(x, sqrt(variance), tf_constant_shape(get_epsilon(), x)), x);
			// Clip to [0, 1].
			x = tf_add(x, tf_constant_shape(0.5, x));
			x = clipByValue(x, 0, 1);
			x = tf_mul(x, tf_constant_shape(255, x));
			return tidy(() => {
				return clipByValue(x, 0, 255).asType("int32");
			});
		} catch (e) {
			if(Object.keys(e).includes("message")) {
				e = e.message;
			}

			err("" + e);

			return null;
		}
	});

	return res;
}

/* This function performs gradient ascent on the input image to find an image that maximizes the output of the given filter in the given layer. */

function handle_scaled_grads_error (e) {
	if(Object.keys(e).includes("message")) {
		e = e.message;
	}

	err(`${language[lang]["inside_scaled_grads_creation_error"]}: ${e}`);
}

async function input_gradient_ascent(layer_idx, neuron, iterations, start_image, recursion = 0) {
	typeassert(layer_idx, int, "layer_idx");
	typeassert(neuron, int, "neuron");
	typeassert(iterations, int, "iterations");
	typeassert(recursion, int, "recursion");

	var worked = 0;
	var full_data = {};

	try {
		var generated_data = tidy(() => {
			// Create an auxiliary model of which input is the same as the original
			// model but the output is the output of the convolutional layer of
			// interest.
			const layer_output = model.getLayer(null, layer_idx).getOutputAt(0);

			const aux_model = tf_model({inputs: model.inputs, outputs: layer_output});

			// This function calculates the value of the convolutional layer's
			// output at the designated filter index.
			const lossFunction = (input) => aux_model.apply(input, {training: true}).gather([neuron], -1);

			// This returned function (`grad_function`) calculates the gradient of the
			// convolutional filter's output with respect to the input image.
			const grad_function = grad(lossFunction);

			// Form a random image as the starting point of the gradient ascent.

			var new_input_shape = get_input_shape_with_batch_size();
			new_input_shape.shift();
			var data = randomUniform([1, ...new_input_shape], 0, 1);
			if(typeof(start_image) != "undefined") {
				data = start_image;
			}

			for (var iteration_idx = 0; iteration_idx < iterations; iteration_idx++) {
				log(`Iteration ${iteration_idx + 1}/${iterations}`);
				if(stop_generating_images) {
					continue;
				}

				const scaledGrads = tidy(() => {
					try {
						const grads = grad_function(data);
						const _is = sqrt(tf_mean(tf_square(grads)));
						const norm = tf_add(_is, tf_constant_shape(get_epsilon(), _is));
						// Important trick: scale the gradient with the magnitude (norm)
						// of the gradient.
						return tf_div(grads, norm);
					} catch (e) {
						handle_scaled_grads_error(e)
					}
				});

				data = tf_add(data, scaledGrads);
				worked = 1;
			}

			return data;
		});
	} catch (e) {
		return await handle_input_gradient_descent_error(e, recursion, layer_idx);
	}

	if(model.input.shape.length == 4 && model.input.shape[3] == 3) {
		try {
			full_data["image"] = tidy(() => {
				return array_sync(tidy(() => {
					var dp = deprocess_image(generated_data);

					if(!dp) {
						err(language[lang]["deprocess_image_returned_empty_image"]);
						full_data["worked"] = 0;
					}

					return dp;
				}));
			});
		} catch (e) {
			if(Object.keys(e).includes("message")) {
				e = e.message;
			}

			console.log("generated_data: ", generated_data);

			err("" + e);

			full_data["worked"] = 0;
		}
	} else {
		full_data["data"] = array_sync(generated_data);
	}

	await dispose(generated_data);

	full_data["worked"] = worked;

	return full_data;
}

async function handle_input_gradient_descent_error (e, recursion, layer_idx) {
	if(("" + e).includes("is already disposed")) {
		await compile_model();
		if(recursion > 20) {
			await delay(recursion * 1000);
			return await input_gradient_ascent(layer_idx, neuron, iterations, start_image, recursion + 1);
		} else {
			throw new Error("Too many retries for input_gradient_ascent");
		}
	} else {
		throw new Error("Error 12: " + e);
	}
}

/* This function gets an image from a URL. It uses the load_image function to load the image, and then uses fromPixels to convert it to a TensorFlow image. Next, it resizes the image using the nearest neighbor algorithm, and then expands the dimensions of the image. Finally, it returns the image. */

function _get_neurons_last_layer (layer_idx, type) {
	typeassert(layer_idx, int, "layer_idx");
	typeassert(type, string, "type");

	var neurons = 1;

	if(!Object.keys(model).includes("layers")) {
		wrn(language[lang]["cannot_get_model_layers"]);
		return false;
	}

	if(!Object.keys(model.layers).includes("" + layer_idx)) {
		wrn(`${language[lang]["cannot_get_model_layers"]}[${layer_idx}]`);
		return false;
	}

	if(type == "conv2d") {
		neurons = model.layers[layer_idx].filters;
	} else if (type == "dense") {
		neurons = model.layers[layer_idx].units;
	} else if (type == "flatten") {
		neurons = 1;
	} else {
		dbg(language[lang]["unknown_layer"] + " " + layer_idx);
		return false;
	}

	return neurons;
}

async function wait_for_images_to_be_generated() {
	if(currently_generating_images) {
		l(language[lang]["cannot_predict_two_layers_at_the_same_time"] + "...");

		while (currently_generating_images) {
			await delay(500);
		}
	}

	await wait_for_updated_page(3);
}

function get_types_in_order(layer_idx) {
	var types_in_order = "";
	if(get_number_of_layers() - 1 == layer_idx && labels && labels.length) {
		types_in_order = " (" + labels.join(", ") + ")";
	}
	
	return types_in_order;
}

async function draw_single_maximally_activated_neuron (layer_idx, neurons, is_recursive, type) {
	var canvasses = [];

	for (var neuron_idx = 0; neuron_idx < neurons; neuron_idx++) {
		$("#generate_images_msg_wrapper").hide();
		$("#generate_images_msg").html("");

		if(stop_generating_images) {
			info(language[lang]["stopped_generating_images_because_button_was_clicked"]);
			continue;
		}

		var currentURL = window.location.href;
		var urlParams = new URLSearchParams(window.location.search);

		var base_msg = `${language[lang]["generating_image_for_neuron"]} ${neuron_idx + 1} ${language[lang]["of"]} ${neurons}`;

		await draw_maximally_activated_neuron_with_retries(base_msg, layer_idx, neurons, neuron_idx, is_recursive, type, canvasses)
	}

	return canvasses;
}

function show_stop_generating_button () {
	$("#stop_generating_images_button").show();
}

function hide_stuff_after_generating_maximally_activated_neurons () {
	$("#stop_generating_images_button").hide();
	$("#generate_images_msg_wrapper").hide();
	$("#generate_images_msg").html("");
}

function reset_cursor () {
	$("body").css("cursor", "default");
}

function add_header_to_maximally_activated_content (layer_idx) {
	$("#maximally_activated_content").prepend(`<h2 class='h2_maximally_activated_layer_contents'><input id='max_activated_input_text_${uuidv4()}' style='width: 100%' value='Layer ${layer_idx + get_types_in_order(layer_idx)}' /></h2>`);
}

async function draw_maximally_activated_layer (layer_idx, type, is_recursive = 0) {
	show_tab_label("maximally_activated_label", 1);
	window.scrollTo(0,0);

	await nextFrame();

	$("body").css("cursor", "wait");

	await gui_in_training(0);

	await wait_for_images_to_be_generated();

	currently_generating_images = true;

	var neurons = _get_neurons_last_layer(layer_idx, type);

	if(typeof(neurons) == "boolean" && !neurons) {
		currently_generating_images = false;
		err(language[lang]["cannot_determine_number_of_neurons_in_last_layer"]);
		return;
	}

	favicon_spinner();

	show_stop_generating_button();
	
	var canvasses = await draw_single_maximally_activated_neuron(layer_idx, neurons, is_recursive, type);

	hide_stuff_after_generating_maximally_activated_neurons()

	add_header_to_maximally_activated_content(layer_idx);

	l(language[lang]["done_generating_images"]);

	stop_generating_images = false;

	favicon_default();

	set_document_title(original_title);

	await allow_editable_labels();

	reset_cursor();

	currently_generating_images = false;

	if(!(started_training || model.isTraining)) {
		await gui_not_in_training(0);
	}

	return canvasses;
}

async function draw_maximally_activated_neuron_with_retries (base_msg, layer_idx, neurons, neuron_idx, is_recursive, type, canvasses) {
	var tries_left = 3;
	try {
		l(base_msg);
		const canvas = await draw_maximally_activated_neuron(layer_idx, neurons - neuron_idx - 1);
		canvasses.push(canvas);
	} catch (e) {
		tries_left = await handle_draw_maximally_activated_neuron_multiple_times_error(e, is_recursive, tries_left, canvasses);
	}
}

async function handle_draw_maximally_activated_neuron_multiple_times_error(e, is_recursive, tries_left, canvasses) {
	currently_generating_images = false;

	if(("" + e).includes("already disposed") || ("" + e).includes("Tensor or TensorLike, but got 'null'")) {
		if(!is_recursive) {
			while (tries_left) {
				await delay(200);
				try {
					l(`${base_msg} ${language[lang]["failed_try_again"]}...`);
					canvasses.push(await draw_maximally_activated_layer(layer_idx, type, 1));
				} catch (e) {
					if(("" + e).includes("already disposed")) {
						err("" + e);
					} else {
						throw new Error(e);
					}
				}
				tries_left--;
			}
		} else {
			log(language[lang]["already_disposed_in_draw_maximally_activated_neuron_recursive_ignore"]);
		}
	} else {
		throw new Error(e);
	}

	return tries_left;
}

async function _show_eta (times, neuron_idx, neurons) {
	typeassert(times, array, "times");
	typeassert(neuron_idx, int, "neuron_idx");
	typeassert(neurons, int, "neurons");

	var eta = "";
	if(times.length) {
		eta = " (" + human_readable_time(parse_int((neurons - neuron_idx) * median(times))) + " " + language[lang]["left"] + ")";
	}

	var img_left = (neurons - neuron_idx);

	var swal_msg = "";

	if((neurons - neuron_idx) == 1) {
		swal_msg = img_left + " " + language[lang]["image_left"];
	} else {
		swal_msg = img_left + " " + language[lang]["images_left"];
	}

	if(eta) {
		swal_msg += " " + eta;
	}

	l(swal_msg + " ");

	l(swal_msg);
	set_document_title(swal_msg);

	$("#current_image").remove();

	show_tab_label("visualization_tab_label", $("#jump_to_interesting_tab").is(":checked") ? 1 : 0);
	show_tab_label("maximally_activated_label", $("#jump_to_interesting_tab").is(":checked") ? 1 : 0);
}

async function predict_data_img (item, force_category) {
	assert(typeof(item) == "object", "item is not an object");

	var results;
	try {
		results = await predict(item, force_category, 1);
	} catch (e) {
		if(Object.keys(e).includes("message")) {
			e = e.message;
		}

		err(e);
	}

	if(!results) {
		err(language[lang]["results_is_empty_in"] + " predict_data_img");
		return;
	}

	var $item = $(item);
	var next_item = $item.next().next();

	if(next_item.length && next_item[0].tagName.toLowerCase() == "pre") {
		next_item.remove();
	}

	$item.after("<pre class='predict_data_img'>" + results + "</pre>");

	$("#remove_predict_data_img_predictions").show();
}

function remove_predict_data_img () {
	$(".predict_data_img").remove();

	$("#remove_predict_data_img_predictions").hide();
}

async function predict_maximally_activated (item, force_category) {
	assert(typeof(item) == "object", "item is not an object");

	var results;
	try {
		results = await predict(item, force_category, 1);
	} catch (e) {
		if(Object.keys(e).includes("message")) {
			e = e.message;
		}

		err(e);
	}

	if(!results) {
		err(language[lang]["results_is_empty_in"] + " predict_maximally_activated");
		return;
	}

	var $item = $(item);
	var next_item = $item.next().next();

	if(next_item.length && next_item[0].tagName.toLowerCase() == "pre") {
		next_item.remove();
	}

	$item.after("<pre class='maximally_activated_predictions'>" + results + "</pre>");
}

async function draw_maximally_activated_neuron (layer_idx, neuron) {
	var current_input_shape = get_input_shape();

	var canvasses = [];

	var original_disable_layer_debuggers = disable_layer_debuggers;
	disable_layer_debuggers = 1;

	try {
		var start_image = undefined;
		var iterations = parse_int($("#max_activation_iterations").val());
		if(!iterations) {
			log(`Iterations was set to ${iterations} in the GUI, using 30 instead`);
			iterations = 30;
		}

		var full_data = await input_gradient_ascent(layer_idx, neuron, iterations, start_image);

		disable_layer_debuggers = original_disable_layer_debuggers;

		if(full_data["worked"]) {
			if(Object.keys(full_data).includes("data")) {
				var _tensor = tensor(full_data["data"]);
				var t_str = _tensor_print_to_string(_tensor);
				log(language[lang]["maximally_activated_tensor"] + ":", t_str);
				$("#maximally_activated_content").prepend(`<input style='width: 100%' value='Maximally activated tensors for Layer ${layer_idx}, Neuron ${neuron}:' /><pre>${t_str}</pre>`);
				show_tab_label("maximally_activated_label", 1);
				await dispose(_tensor);
			} else if (Object.keys(full_data).includes("image")) {
				var data = full_data["image"][0];
				var to_class = "maximally_activated_class";
				var canvas = get_canvas_in_class(layer_idx, to_class, 0, 1);
				var _uuid = canvas.id;

				canvasses.push(canvas);

				var data_hash = {
					layer: layer_idx,
					neuron: neuron,
					model_hash: await get_model_config_hash()
				};

				scaleNestedArray(data);
				var res = draw_grid(canvas, 1, data, 1, 0, "predict_maximally_activated(this, 'image')", null, data_hash, "layer_image");

				if(res) {
					$("#maximally_activated_content").prepend(canvas);
					show_tab_label("maximally_activated_label", 1);
				} else {
					void(0); log("Res: ", res);
				}
			}
		}
	} catch (e) {
		await write_error(e, null, null);
		show_tab_label("visualization_tab", 1);
		show_tab_label("fcnn_tab_label", 1);
		return false;
	}

	await nextFrame();

	return canvasses;
}

function get_max_nr_cols_rows () {
	var $max_nr_vals = $("#max_nr_vals");
	if($max_nr_vals.length == 0) {
		dbg(`[get_max_nr_cols_rows] Could not find #max_nr_vals`);
		return 32;
	}

	var res = $max_nr_vals.val()

	if(!looks_like_number(res)) {
		dbg(`[get_max_nr_cols_rows] '${res}' doesn't look like a number`);
		return 32;
	}

	if(!res) {
		dbg(`[get_max_nr_cols_rows] res is either null, 0, undefined or empty`);
		return 32;
	}
	
	return parse_int(res);
}

function show_could_not_get_msg (name) {
	dbg(`Could not get ${name}. It may have been disposed already.`);
}

function get_conv2d_latex (layer_idx, _af, layer_has_bias) {
	var str = "";
	str += "\\begin{matrix}";
	str += _get_h(layer_idx + 1) + " = ";
	str += add_activation_function_to_latex (_af, "begin");
	str += "\\sum_{i=1}^{N} \\sum_{j=1}^{M} \\left( \\sum_{p=1}^{K} \\sum_{q=1}^{L} " + _get_h(layer_idx) + "(x+i, y+j, c) \\times \\text{kernel}(p, q, c, k) \\right)";

	var layer_bias_string = "";

	if(layer_has_bias) {
		str += " + \\text{bias}(k)";
		var bias_val = "";
		try {
			var bias_val = null;
			if (
				model &&
				Array.isArray(model.layers) &&
				model.layers[layer_idx] &&
				model.layers[layer_idx].bias &&
				typeof model.layers[layer_idx].bias.val !== "undefined" &&
				!model.layers[layer_idx].bias.disposed
			) {
				bias_val = model.layers[layer_idx].bias.val;
			}

			if (bias_val) {
				var synced_data = array_sync(bias_val, true);
				if (synced_data) {
					var bias_shape = get_shape_from_array(synced_data);
					layer_bias_string += `\\text{Bias}^{${bias_shape.join(", ")}} = ` + array_to_latex_matrix(synced_data);
				}
			} else {
				show_could_not_get_msg("bias");
			}
		} catch (e) {
			show_could_not_get_msg("bias");
		}
	}

	str += add_activation_function_to_latex(_af, "end");

	str += " \\\\";

	try {
		var this_kernel_val = null;
		if (
			model &&
			Array.isArray(model.layers) &&
			model.layers[layer_idx] &&
			model.layers[layer_idx].kernel &&
			typeof model.layers[layer_idx].kernel.val !== "undefined" &&
			!model.layers[layer_idx].kernel.disposed
		) {
			this_kernel_val = model.layers[layer_idx].kernel.val;
		}

		if (this_kernel_val) {
			var synced_data = array_sync(this_kernel_val, true);
			if (synced_data) {
				var kernel_shape = get_shape_from_array(synced_data);
				str += `\\text{Kernel}^{${kernel_shape.join(", ")}} = ` + array_to_latex_matrix(synced_data);

				if (layer_bias_string) {
					str += ` \\\\ \n${layer_bias_string}`;
				}
			} else {
				show_could_not_get_msg("kernel");
			}
		} else {
			show_could_not_get_msg("kernel");
		}
	} catch (e) {
		show_could_not_get_msg("kernel");
	}

	str += "\\end{matrix}";

	return str;
}

function get_upsampling2d_latex (layer_idx) {
	const latexFormula = `
				{${_get_h(layer_idx + 1)}}_{i,j,c} = {${_get_h(layer_idx)}}_{\\left\\lfloor \\frac{i}{s_h} \\right\\rfloor, \\left\\lfloor \\frac{j}{s_w} \\right\\rfloor, c}
			`;

	return latexFormula;
}

function str_or_activation_plus_str (str) {
	if(activation_string && str) {
		return `<h2>${language[lang]["activation_functions"]}:</h2>${activation_string}${str}`;
	} else {
		if(str) {
			return str;
		}
	}

	return "No LaTeX-equations could be generated";
}

function get_dec_points_math_mode() {
	const val = $("#decimal_points_math_mode").val();
	const n = parseInt(val, 10);
	if (isNaN(n)) return 16;
	return n;
}

function get_conv1d_latex (layer_idx, layer_has_bias) {
	var str = "";
	str += "\\begin{matrix}";
	str += _get_h(layer_idx + 1) + " = \\sum_{i=1}^{N} \\left( \\sum_{p=1}^{K} " + _get_h(layer_idx) + "(x+i, c) \\times \\text{kernel}(p, c, k) \\right) \\\\";

	var layer_bias_string = "";

	if(layer_has_bias) {
		str += " + \\text{bias}(k)";
		var bias_shape = get_shape_from_array(array_sync(model.layers[layer_idx].bias.val, true));
		layer_bias_string += `\\text{Bias}^{${bias_shape.join(", ")}} = ` + array_to_latex_matrix(array_sync(model.layers[layer_idx].bias.val, true));
	}

	str += " \\\\";

	var kernel_shape = get_shape_from_array(array_sync(model.layers[layer_idx].kernel.val, true));
	str += `\\text{Kernel}^{${kernel_shape.join(", ")}} = `+ array_to_latex_matrix(array_sync(model.layers[layer_idx].kernel.val, true));

	if(layer_bias_string) {
		str += ` \\\\ \n${layer_bias_string}`;
	}

	str += "\\end{matrix}";

	return str;
}

function get_layer_activation_name(layerIdx) {
	if (!model || typeof model !== 'object') return null;
	if (!Array.isArray(model.layers)) return null;
	if (layerIdx < 0 || layerIdx >= model.layers.length) return null;

	const layer = model.layers[layerIdx];
	if (!layer || typeof layer !== 'object') return null;

	const activation = layer.activation;
	if (!activation || typeof activation !== 'object') return null;

	const constructor = activation.constructor;
	if (!constructor || typeof constructor !== 'function') return null;

	// bevorzugt className, fallback auf name
	return constructor.className || constructor.name || null;
}

function format_layer_equation(layer_idx, layer_data, y_layer, input_layer, activation_start) {
	var left_side = get_left_side(layer_idx, layer_data, y_layer, activation_start);
	var right_side = get_right_side(layer_idx, input_layer);
	return { left: left_side, right: right_side };
}

function get_left_side(layer_idx, layer_data, y_layer, activation_start) {
	if (layer_idx === layer_data.length - 1) {
		return array_to_latex(y_layer, "Output") + " = " + activation_start;
	}
	return _get_h(layer_idx) + " = " + activation_start;
}

function get_right_side(layer_idx, input_layer) {
	if (layer_idx === 0) {
		return array_to_latex(input_layer, "Input");
	}
	return _get_h(Math.max(0, layer_idx - 1));
}

function get_dense_latex (layer_idx, activation_function_equations, layer_data, colors, y_layer, input_layer) {
	var str = "";
	try {
		var activation_name = get_layer_activation_name(layer_idx);

		if (activation_name === null) {
			return "\\text{Problem trying to get activation name}";
		}

		if(activation_name == "linear") {
			//
		} else if(Object.keys(activation_function_equations).includes(activation_name)) {
			if(!shown_activation_equations.includes(activation_name)) {
				var this_activation_string = activation_function_equations[activation_name]["equation"];

				var this_activation_array = [];

				if(Object.keys(activation_function_equations[activation_name]).includes("upper_limit")) {
					this_activation_array.push("\\text{Lower-limit: } " + activation_function_equations[activation_name]["lower_limit"]);
				}

				if(Object.keys(activation_function_equations[activation_name]).includes("upper_limit")) {
					this_activation_array.push("\\text{Upper-limit: } " + activation_function_equations[activation_name]["upper_limit"]);
				}

				if(this_activation_array.length) {
					this_activation_string = this_activation_string + "\\qquad (" + this_activation_array.join(", ") + ")";
				}

				activation_string += "<div class='temml_me'>" + this_activation_string + "</div><br>\n";

				shown_activation_equations.push(activation_name);
			}
		} else {
			err("Activation name '" + activation_name + "' not found");
		}

		var activation_start = "";

		if(activation_name != "linear") {
			activation_start = "\\mathrm{\\underbrace{" + activation_name + "}_{\\mathrm{Activation}}}\\left(";
		}

		var this_layer_data_kernel = layer_data[layer_idx].kernel;

		var kernel_name = "\\text{" + language[lang]["weight_matrix"] + "}^{" + array_size(this_layer_data_kernel).join(" \\times ") + "}";

		var first_part = array_to_latex_color(this_layer_data_kernel, kernel_name, deepTranspose(colors[layer_idx].kernel));

		var eq = format_layer_equation(layer_idx, layer_data, y_layer, input_layer, activation_start);

		str += eq.left;

		str += a_times_b(first_part, eq.right);

		try {
			if("bias" in layer_data[layer_idx] && layer_data[layer_idx].bias.length) {
				str += " + " + array_to_latex_color([layer_data[layer_idx].bias], "Bias", [colors[layer_idx].bias], 1);
			}
		} catch (e) {
			err(e);
		}

		if(activation_name != "linear") {
			str += "\\right)";
		}
	} catch (e) {
		wrn(`Caught error ${e}`);
		if (e && e.stack) {
			err("Full stack:\n" + e.stack);
		}
	}

	return str;
}

function get_activation_functions_latex(this_layer_type, input_layer, layer_idx, y_layer, layer_data, activation_function_equations) {
	var str = "";
	var activation_name = this_layer_type;
	if(activation_name == "leakyReLU") {
		activation_name = "LeakyReLU";
	} else if(activation_name == "reLU") {
		activation_name = "relu";
	}

	var prev_layer_name = "";

	if(layer_idx == 0) {
		prev_layer_name += array_to_latex(input_layer, "Input");
	} else {
		prev_layer_name += _get_h(layer_idx - 1);
	}

	if(layer_idx == layer_data.length - 1) {
		str += array_to_latex(y_layer, "Output") + " = ";
	} else {
		str += _get_h(layer_idx) + " = ";
	}

	const varnames = {
		"reLU": "max_value",
		"elu": "alpha",
		"leakyReLU": "alpha",
		"softmax": "",
		"thresholdedReLU": "theta"
	};

	if(Object.keys(activation_function_equations).includes(activation_name)) {
		var this_activation_string = activation_function_equations[activation_name]["equation_no_function_name"];

		this_activation_string = this_activation_string.replaceAll("REPLACEME", "{" + prev_layer_name + "}");

		if(!Object.keys(varnames).includes(this_layer_type)) {
			err(`Missing varname for ${this_layer_type}`);

			return `\\text{Missing value for ${this_layer_type}}`;
		}

		if(varnames[this_layer_type].length != "") {
			const varname = varnames[this_layer_type]

			var var_str = get_item_value(layer_idx, varname);

			var var_float = parse_float(var_str);

			if(typeof(var_float) == "number") {
				this_activation_string = this_activation_string.replaceAll("ALPHAREPL", "{" + var_float + "}");
				this_activation_string = this_activation_string.replaceAll(`\\${varname}`, "\\underbrace{" + var_float + `}_{\\${varname}} \\cdot `);
			}

			var $theta = get_item_value(layer_idx, "theta");
			if(looks_like_number($theta)) {
				var theta = parse_float($theta);
				if(typeof(theta) == "number") {
					this_activation_string = this_activation_string.replaceAll("\\theta", "{\\theta = " + theta + "} \\cdot ");
				}
			}

			this_activation_string = this_activation_string.replaceAll("REPLACEME", "{" + prev_layer_name + "}");
		}

		var this_activation_array = [];

		if(Object.keys(activation_function_equations[activation_name]).includes("upper_limit")) {
			this_activation_array.push("\\text{Lower-limit: } " + activation_function_equations[activation_name]["lower_limit"]);
		}

		if(Object.keys(activation_function_equations[activation_name]).includes("upper_limit")) {
			this_activation_array.push("\\text{Upper-limit: } " + activation_function_equations[activation_name]["upper_limit"]);
		}

		var max_value_item = $($(".layer_setting")[layer_idx]).find(".max_value");

		if(max_value_item.length) {
			var max_value = max_value_item.val();
			this_activation_array.push("\\text{Capped at maximally " + max_value + "}");
		}

		if(this_activation_array.length) {
			this_activation_string = this_activation_string + "\\qquad (" + this_activation_array.join(", ") + ")";
		}

		str += this_activation_string + "\n";
	}

	return str;
}

function get_batch_normalization_latex (layer_data, y_layer, layer_idx) {
	var str = "";
	var prev_layer_name = "";

	var outname = "";

	if(layer_idx == layer_data.length - 1) {
		outname = array_to_latex(y_layer, "Output") + " \\longrightarrow ";
	} else {
		outname += _get_h(layer_idx) + " \\longrightarrow ";
	}

	var mini_batch_mean = "\\underbrace{\\mu_\\mathcal{B} = \\frac{1}{n} \\sum_{i=1}^n x_i}_{\\text{Batch mean}}";

	var mini_batch_variance = "\\underbrace{\\sigma_\\mathcal{B}^2 = \\frac{1}{n} \\sum_{i = 1}^n \\left(x_i - \\mu_\\mathcal{B}\\right)^2}_{\\text{Batch variance}}";

	var x_equation = "\\overline{x_i} \\longrightarrow \\underbrace{\\frac{x_i - \\mu_\\mathcal{B}}{\\sqrt{\\sigma_\\mathcal{B}^2 + \\epsilon \\left( = " + model.layers[layer_idx].epsilon + "\\right)}}}_\\text{Normalize}";

	var beta_string = "";
	var gamma_string = "";
	if("beta" in layer_data[layer_idx]) {
		beta_string = array_to_latex_matrix(array_to_fixed(layer_data[layer_idx].beta, get_dec_points_math_mode));
		beta_string = "\\displaystyle " + beta_string;
	}
	if("gamma" in layer_data[layer_idx]) {
		gamma_string = array_to_latex_matrix(array_to_fixed(layer_data[layer_idx].gamma, get_dec_points_math_mode()));
		gamma_string = "\\displaystyle " + gamma_string;
	}

	var y_equation = "y_i = \\underbrace{\\underbrace{\\gamma}_{" + gamma_string + "}\\overline{x_i} + \\underbrace{\\beta}_{" + beta_string + "}}_{\\text{Scaling\\&shifting}}";

	var between_equations = ",\\qquad ";
	var skip_between_equations = ",\\\\[10pt]\\\\\n";

	str += "\\begin{array}{c}\n";
	str += "\\displaystyle " + mini_batch_mean + between_equations;
	str += "\\displaystyle " + mini_batch_variance + between_equations;
	str += "\\displaystyle " + x_equation + skip_between_equations;
	str += "\\displaystyle " + outname + y_equation;
	str += "\\end{array}\n";

	return str;
}

function get_optimizer_latex_equations () {
	var optimizer_equations = get_optimizer_equations();
	var str = "";
	var optimizer = get_optimizer();
	if(Object.keys(optimizer_equations).includes(optimizer)) {
		var this_optimizer = optimizer_equations[optimizer];

		var dependencies = this_optimizer["dependencies"];

		str += "<h2>Optimizer:</h2>\n";

		if(this_optimizer.variables) {
			var varnames = Object.keys(this_optimizer.variables);
			for (var m = 0; m < varnames.length; m++) {
				var thisvarname = varnames[m];
				if(!m) {
					str += "<h3>Variables and definitions:</h3>\n";
				}

				var origin = this_optimizer.variables[thisvarname]["origin"];

				str += "<div class='temml_me'> \\displaystyle \\text{" + this_optimizer.variables[thisvarname]["name"] + ": } " + thisvarname;
				if(Object.keys(this_optimizer.variables[thisvarname]).includes("value")) {
					str += " = " + this_optimizer.variables[thisvarname]["value"];
				} else if(origin !== undefined) {
					origin = origin.replace("OPTIMIZERNAME", optimizer);
					var valofparam = $("#" + origin).val();
					str += " = " + valofparam;
				}
				str += "</div><br>";

				if(Object.keys(this_optimizer.variables).includes("example")) {
					str += "<div class='temml_me'> \\displaystyle " + this_optimizer.variables.example + " </div><br>";
				}
			}

			str += "<h3 style='display: none' id='optimizer_variables_header'>Optimizer variables:</h3>\n";
			str += "<div style='display: none' id='optimizer_variables_div'></div>"

			str += `<h3>${language[lang]["optimizer_algorithm"]}:</h3>\n`;
			str += "<p>Taken (and slightly modified) from the <a href='https://pytorch.org/docs/stable/optim.html' target='_blank'>PyTorch-Optimizer API, where there's more info on all optimizers</a>.</p>";
		}

		if (dependencies) {
			for (var m = 0; m < dependencies.length; m++) {
				if(dependencies[m] != optimizer) {
					str += "<div class='temml_me'>\\displaystyle \\text{" + dependencies[m] + ": }" + optimizer_equations[dependencies[m]]["equations"].join(" </div><br>\n<div class='temml_me'> ") + " </div><br>";
				}
			}
		}

		str += "<div class='temml_me'> \\displaystyle \\text{" + optimizer + ": }" + this_optimizer["equations"].join(" </div><br>\n<div class='temml_me'> ") + " </div><br>";
	} else {
		log(language[lang]["unknown_optimizer"] + " " + optimizer);
	}

	return str;
}

function get_loss_equations_string(loss_equations) {
	if(Object.keys(loss_equations).includes(get_loss())) {
		return "<h2>Loss:</h2><div class='temml_me'>" + loss_equations[get_loss()] + "</div><br>";
	}

	return "";
}

function get_empty_default_trace (name) {
	return {
		x: [],
		y: [],
		type: "scatter",
		name: name
	};
}

async function get_live_tracking_on_batch_end (global_model_name, max_epoch, x_data_json, y_data_json, show_loss, append_to_id) {
	var id = uuidv4();

	var onBatchEnd = function (epoch, logs) {
		if(typeof(old_onEpochEnd) == "function") {
			old_onEpochEnd(epoch, logs);
		}

		try {
			var current_epoch = epoch + 1;
			if(current_epoch == 1) {
				$(`#${append_to_id}`).html("");
				$(`<div id='${id}_training_data_graph'></div>`).appendTo($(`#${append_to_id}`));
			}

			var real_trace = get_empty_default_trace("Ground Truth");
			var predicted_trace = get_empty_default_trace("Prediction");

			var x_data, y_data;

			try {
				x_data = JSON.parse(x_data_json);
			} catch (e) {
				if(Object.keys(e).includes("message")) {
					e = e.message;
				}

				err(`${language[lang]["error_parsing_x_data"]} (${x_data_json}): ${e}`);
				return;
			}

			try {
				y_data = JSON.parse(y_data_json);
			} catch (e) {
				if(Object.keys(e).includes("message")) {
					e = e.message;
				}

				err(`${language[lang]["error_parsing_y_data"]} (${y_data_json}): ${e}`);
				return;
			}

			//1) combine the arrays:
			var list = [];
			for (var j = 0; j < x_data.length; j++) {
				var x_pure = x_data[j][0];
				var y_pure = y_data[j][0];

				if(looks_like_number(x_pure) && looks_like_number(y_pure)) {
					list.push({"x_data": parse_float(x_pure), "y_data": parse_float(y_pure)});
				}
			}

			//2) sort:
			list.sort(function(a, b) {
				return ((a.x_data < b.x_data) ? -1 : ((a.x_data == b.x_data) ? 0 : 1));
				//Sort could be modified to, for example, sort on the age
				// if the name is the same.
			});

			//3) separate them back out:
			for (var k = 0; k < list.length; k++) {
				x_data[k][0] = list[k].x_data;
				y_data[k][0] = list[k].y_data;
			}

			for (var y_data_idx = 0; y_data_idx < y_data.length; y_data_idx++) {
				try {
					real_trace.x.push(x_data[y_data_idx][0]);
					predicted_trace.x.push(x_data[y_data_idx][0]);

					real_trace.y.push(y_data[y_data_idx][0]);

					var predict_me = tensor(x_data[y_data_idx]);
					var predicted_tensor = eval(global_model_name).predict(predict_me);
					var predicted = array_sync(predicted_tensor)[0][0];

					predicted_trace.y.push(predicted);

					dispose(predict_me); // no await possible
					dispose(predicted_tensor); // no await possible
				} catch (e) {
					err(e);
					console.trace();
				}
			}

			var data = [real_trace, predicted_trace];

			Plotly.react(`${id}_training_data_graph`, data, get_layout_for_real_vs_predicted_function());
		} catch (e) {
			err(e);
		}
	};

	return onBatchEnd;
}

function get_layout_for_real_vs_predicted_function() {
	return {
		paper_bgcolor: "rgba(0, 0, 0, 0)",
			plot_bgcolor: "rgba(0, 0, 0, 0)",
			gridcolor: "#7c7c7c",
			font: {
				family: "Arial, Helvetica, sans-serif",
					size: 18,
					color: "#7f7f7f"
			},
			title: "Real function vs. predicted function",
			yaxis: {title: "predicted vs. real data"},
			yaxis: {
				title: "y",
					side: "left",
					showgrid: false
			},
			xaxis: {
				title: "x",
					side: "bottom",
					showgrid: false
			},
			renderer: "webgl"
	};
}

function array_to_html(_array) {
	var m = "";
	for (var arr_idx = 0; arr_idx < _array.length; arr_idx++) {
		if(typeof(_array[arr_idx]) == "object") {
			for (var j = 0; j < _array[arr_idx].length; j++) {
				m += _array[arr_idx][j] + " ";
			}
		} else {
			m += _array[arr_idx];
		}
		m += "<br>";
	}

	return m;
}
