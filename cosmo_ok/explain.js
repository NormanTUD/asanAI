"use strict";

function visualizeNumbersOnCanvas(
  numberArray,
  blockWidth = 1,
  blockHeight = 25
) {
	// Create or retrieve the canvas element
	var canvas = document.createElement("canvas");
	canvas.id = "neurons_canvas_" + uuidv4();

	// Calculate the canvas width based on the number of elements
	var canvasWidth = numberArray.length * blockWidth;
	var canvasHeight = blockHeight;

	// Set the canvas dimensions
	canvas.width = canvasWidth;
	canvas.height = canvasHeight;

	var ctx = canvas.getContext("2d");
	var blocksPerRow = Math.floor(canvas.width / blockWidth);

	for (var i = 0; i < numberArray.length; i++) {
		var value = numberArray[i];
		var grayscaleValue = Math.round((value / numberArray[numberArray.length - 1]) * 255);
		var color = "rgb(" + grayscaleValue + "," + grayscaleValue + "," + grayscaleValue + ")";

		var x = (i % blocksPerRow) * blockWidth;
		var y = Math.floor(i / blocksPerRow) * blockHeight;

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

	var multiplicator = x - min;
	var divisor = max - min;

	if(divisor == 0) {
		return val;
	}

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
	ctx.fillStyle=rect.fill;
	ctx.strokeStyle=rect.stroke;
	ctx.fillRect(rect.x,rect.y,rect.w,rect.h);
	ctx.strokeRect(rect.x,rect.y,rect.w,rect.h);
}

function draw_grid_grayscale (canvas, pixel_size, colors, pos) {
	var drew_something = false;

	var width = colors[0].length;
	var height = colors.length;

	$(canvas).attr("width", width * pixel_size);
	$(canvas).attr("height", height * pixel_size);

	var ctx = $(canvas)[0].getContext("2d");
	ctx.beginPath();

	var min = 0;
	var max = 0;

	for (var x = 0, i = 0; i < width; x += pixel_size, i++) {
		for (var y = 0, j = 0; j < height; y += pixel_size, j++) {
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

	for (var x = 0, i = 0; i < width; x += pixel_size, i++) {
		for (var y = 0, j = 0; j < height; y += pixel_size, j++) {
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

	var height = colors.length;
	var width = colors[0].length;

	$(canvas).attr("width", width * pixel_size);
	$(canvas).attr("height", height * pixel_size);
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
		for (var x = 0, i = 0; i < width; x += pixel_size, i++) {
			for (var y = 0, j = 0; j < height; y += pixel_size, j++) {
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
		for (var y = 0, j = 0; j < height; y += pixel_size, j++) {
			var red, green, blue;

			if(black_and_white) {
				red = green = blue = colors[j][i] * multiply_by;
			} else {
				red = colors[j][i][0] * multiply_by;
				green = colors[j][i][1] * multiply_by;
				blue = colors[j][i][2] * multiply_by;
			}

			if(denormalize) {
				red = normalize_to_rgb_min_max(red, min, max);
				green = normalize_to_rgb_min_max(green, min, max);
				blue = normalize_to_rgb_min_max(blue, min, max);
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

			ret = draw_grid(canvas, pixel_size, colors, 1);
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

					//    draw_grid(canvas, pixel_size, colors, denormalize, black_and_white, onclick, multiply_by, data_hash) {
					ret = draw_grid(canvas, kernel_pixel_size, colors[filter_id][channel_id], 1, 1);

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

				ret = draw_grid_grayscale(canvas, 5, colors, k);

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

	for (var i = 0; i < get_number_of_layers(); i++) {
		r.push($($(".layer_type")[i]).val());
	}

	return r;
}

function group_layers (layers) {
	var str = layers.join(";");

	var char_to_group = new Array(str.length);
	char_to_group.fill(null);

	var feature_extraction_base = "(?:(?:depthwise|separable)?conv.d(?:transpose)?;?)+;?(?:(?:batch|layer)Normalization;)*;?(?:[^;]+Pooling.d;?)*";

	var layer_names = Object.keys(layer_options);

	var list_activation_layers = [];

	for (var i = 0; i < layer_names.length; i++) {
		var category = layer_options[layer_names[i]]["category"];
		if(category == "Activation") {
			list_activation_layers.push(layer_names[i]);
		}
	}

	var batch_or_layer_normalization = "((?:(?:batch|layer)Normalization;?)+)";

	var descs = [
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
	];

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
	for (var i = 0; i < str.length; i++) {
		if(str[i] == ";") {
			current_layer_nr++;
		} else if(str[i - 1] == ";" || i == 0) {
			layer_to_char_start[current_layer_nr] = i;
		}
	}

	var result = [];

	var last_layer_type = char_to_group[0];

	var current_type_layers = [];

	for (var i = 0; i < layer_to_char_start.length; i++) {
		var layer_type = char_to_group[layer_to_char_start[i]];

		if(last_layer_type != layer_type) {
			var this_item = {};
			this_item[last_layer_type] = current_type_layers;
			result.push(this_item);

			current_type_layers = [];
			last_layer_type = layer_type;
		}

		current_type_layers.push(i);
	}

	var this_item = {};
	this_item[last_layer_type] = current_type_layers;
	result.push(this_item);

	return result;
}

async function write_descriptions (force=0) {
	if(is_cosmo_mode) {
		//log("Not doing anything in cosmo mode");
		return;
	}

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

	for (var i = 0; i < groups.length; i++) {
		var group = groups[i];
		var keyname = Object.keys(groups[i])[0];
		var layers = groups[i][keyname];
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
			var height = last_layer_end - first_layer_start - 13;
			var hidden = "";
			if(is_hidden_or_has_hidden_parent($("#layers_container_left"))) {
				hidden = "display: none;";
			}

			var new_div_html = "";
			new_div_html = `<div class="descriptions_of_layers" style="position: absolute; top: ${first_layer_top}px; left: ${right_offset}px; height: ${height}px; ${hidden}'">${keyname}</div>`;

			$(new_div_html).appendTo("#maindiv");
		}
	}

	if(is_cosmo_mode) {
		$(".descriptions_of_layers").hide();
	} else {
		$(".descriptions_of_layers").show();
	}

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
			explanation = "This may mean that the batch-size and/or filter-size and/or image dimension resize-sizes are too large.";
		} else if(_err.includes("target expected a batch of elements where each example")) {
			explanation = "The last number of neurons in the last layer may not match the number of categories.<br><br>It may also be possible that you chose a wrong Loss function. If the number of neurons match, try chosing other losses, like categoricalCrossentropy.<br><br>You may also have only one category, but you need at least two.";
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
	var color = $($("div.container.layer")[layer_nr]).css("background-color")

	if(color == "rgb(255, 0, 0)") {
		return true;
	}

	return false;
}

/* This function will write the given text to the layer identification of the given number. If the text is empty, it will clear the layer identification. */

function write_layer_identification (nr, text) {
	if(text.length) {
		$($(".layer_identifier")[nr]).html(text);
	} else {
		$($(".layer_identifier")[nr]).html("");
	}

}

function get_layer_identification (i) {
	if(model === null || model === undefined) {
		model_is_ok();
		return;
	}

	if(model.layers[i] && Object.keys(model.layers[i]).length >= 1) {
		var object_keys = Object.keys(model.layers[i]);
		var new_str = "";

		if(object_keys.includes("filters") && object_keys.includes("kernelSize")) {
			new_str = model.layers[i]["filters"] + "@" + model.layers[i].kernelSize.join("x");

		} else if(object_keys.includes("filters")) {
			new_str = "Filters:&nbsp;" + model.layers[i]["filters"];

		} else if(object_keys.includes("units")) {
			new_str = "Units:&nbsp;" + model.layers[i]["units"];

		} else if(object_keys.includes("rate")) {
			new_str = "Rate:&nbsp;" + model.layers[i]["rate"];

		} else if(object_keys.includes("poolSize")) {
			new_str = model.layers[i].poolSize.join("x");
		}

		return new_str;
	}

	return "";
}

async function identify_layers () {
	var number_of_layers = $("div.container.layer").length;

	//console.trace();
	has_zero_output_shape = false;

	var failed = 0;
	for (var i = 0; i < number_of_layers; i++) {
		$($(".layer_nr_desc")[i]).html(i + ":&nbsp;");
		var new_str = get_layer_identification(i);

		if(new_str != "") {
			new_str = new_str + ",&nbsp;";
		}

		var output_shape_string = "";
		try {
			if(i in model.layers) {
				try {
					model.layers[i].input.shape;
				} catch(e) {
					err("Model has multi-node inputs. It should not have!!! Continuing anyway, but please, debug this!!!");
				}

				var shape = JSON.stringify(model.layers[i].getOutputAt(0).shape);
				if(/((\[|,)\s*)\s*0\s*((\]|,)\s*)/.test(shape) || /\[\s*(0,?\s*?)+\s*\]/.test(shape)) {
					output_shape_string = "<span style='background-color: red'>Output:&nbsp;" + shape + "</span>";
					output_shape_string = output_shape_string.replace("null,", "");
					has_zero_output_shape = true;
				} else {
					output_shape_string = "Output:&nbsp;" + shape;
					output_shape_string = output_shape_string.replace("null,", "");
				}
			} else {
				dbg(`identify_layers: i = ${i} is not in model.layers. model.layers.length = ${model.layers.length}. This may happen when the model is recompiled during this step and if so, is probably harmless.`);
			}

			if(has_zero_output_shape) {
				var basemsg = "ERROR: There are zeroes in the output shape. ";
				var msg = basemsg + "The input shape will be resettet the the last known working configuration.";

				disable_train();

				throw new Error(msg);

				return;
			} else {
				enable_train();
			}
		} catch (e) {
			throw new Error(e);

			return;
		}

		var activation_function_string = "";
		try {
			if(i in model.layers) {
				var this_layer = $($(".layer")[i]);
				var act = $(this_layer.find(".activation")).val();
				if("" + act != "undefined") {
					activation_function_string = ", " + act;
				}
			}
		} catch (e) {
			throw new Error(e);
		}

		if(layer_is_red(i)) {
			failed++;
			write_layer_identification(i, "<span class='layer_identifier_activation'></span>");
		} else {
			write_layer_identification(i + failed, new_str + output_shape_string + "<span class='layer_identifier_activation'>" + activation_function_string + "</span>");
		}
	}

	if(!has_zero_output_shape) {
		shown_has_zero_data = false;
	}

}

function hide_unused_layer_visualization_headers () {
	for (var i = 0; i < get_number_of_layers(); i++) {
		hide_layer_visualization_header_if_unused(i);
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

/* This code is responsible for adding a debugger to a layer in order to visualize the data that is being passed through it. This can be helpful in understanding what is happening in a model and how it is making predictions. */

function add_layer_debuggers () {
	$("#datalayers").html("");

	$(".layer_data").html("");

	if(!model) {
		if(finished_loading) {
			dbg("No model found");
		}

		return;
	}

	if(!model.layers) {
		if(finished_loading) {
			dbg("No layer found");
		}
	}

	try {
		for (var i = 0; i < model.layers.length; i++) {
			if(get_methods(model.layers[i]).includes("original_apply_real")) {
				model.layers[i].apply = model.layers[i].original_apply_real;
			}

			model.layers[i].original_apply_real = model.layers[i].apply;

			var code = `model.layers[${i}].apply = function (inputs, kwargs) {
				var applied = model.layers[${i}].original_apply_real(inputs, kwargs);

				if(!disable_layer_debuggers) {
					if($("#show_layer_data").is(":checked")) {
						draw_internal_states(${i}, inputs, applied);
					}
				}

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

function draw_internal_states (layer, inputs, applied) {
	var number_of_items_in_this_batch = inputs[0].shape[0];
	//log("layer: " + layer);
	//log("number_of_items_in_this_batch: " + number_of_items_in_this_batch);

	for (var batchnr = 0; batchnr < number_of_items_in_this_batch; batchnr++) {
		//log("batchnr: " + batchnr);

		var input_data = inputs[0].arraySync()[batchnr];
		var output_data = applied.arraySync()[batchnr];

		var layer_div = $($(".layer_data")[layer]);
		if(batchnr == 0) {
			layer_div.append("<h1>Layer data flow</h1>");
		}
		layer_div.html("<h3 class=\"data_flow_visualization layer_header\">Layer " + layer + " &mdash; " + $($(".layer_type")[layer]).val() + " " + get_layer_identification(layer) + "</h3>").hide();

		layer_div.show();
		layer_div.append("<div class='data_flow_visualization input_layer_header' style='display: none' id='layer_" + layer + "_input'><h4>Input:</h4></div>");
		layer_div.append("<div class='data_flow_visualization weight_matrix_header' style='display: none' id='layer_" + layer + "_kernel'><h4>Weight Matrix:</h4></div>");
		layer_div.append("<div class='data_flow_visualization output_header' style='display: none' id='layer_" + layer + "_output'><h4>Output:</h4></div>");
		layer_div.append("<div class='data_flow_visualization equations_header' style='display: none' id='layer_" + layer + "_equations'></div>");

		var input = $("#layer_" + layer + "_input");
		var kernel = $("#layer_" + layer + "_kernel");
		var output = $("#layer_" + layer + "_output");
		var equations = $("#layer_" + layer + "_equations");

		$("#layer_visualizations_tab").show();

		var kernel_data = [];

		if(Object.keys(model.layers[layer]).includes("kernel")) {
			if(model.layers[layer].kernel.val.shape.length == 4) {
				kernel_data = model.layers[layer].kernel.val.transpose([3, 2, 1, 0]).arraySync();
			}
		}

		var canvas_input = draw_image_if_possible(layer, "input", input_data, 1);
		var canvas_kernel = draw_image_if_possible(layer, "kernel", kernel_data, 1);
		//console.log("output_data:", output_data);
		var canvas_output = draw_image_if_possible(layer, "output", output_data, 1);

		if(canvas_output.length && canvas_input.length) {
			for (var j = 0; j < canvas_input.length; j++) {
				for (var i = 0; i < canvas_output.length; i++) {
					var img_output = canvas_output[i];
					if(Object.keys(canvas_kernel).includes(i + "")) {
						var img_kernel = canvas_kernel[i];
						if(layer == 0) {
							input.append(canvas_input[j]).show();
						}
						kernel.append(img_kernel).show();
					}
					output.append(img_output).show();
				}
			}
		} else if (canvas_output.length && canvas_input.nodeName == "CANVAS") {
			for (var i = 0; i < canvas_output.length; i++) {
				var img_output = canvas_output[i];
				if(layer == 0) {
					input.append(canvas_input).show();
				}
				if(Object.keys(canvas_kernel).includes(i + "")) {
					var img_kernel = canvas_kernel[i];
					kernel.append(img_kernel).show();
				}
				output.append(img_output).show();
			}
		} else {
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
					var h = visualizeNumbersOnCanvas(output_data)
					equations.append(h).show();
				} else {
					var h = array_to_html(output_data);
					equations.append(h).show();
				}
			}
		}
	}
}

/*
 * From https://github.com/tensorflow/tfjs-examples/tree/master/visualize-convnet
 */

/* The deprocess_image function takes an image tensor and deprocesses it so that it's ready to be shown to the user. This includes normalizing the image, adding a small positive number to the denominator to prevent division-by-zero, clipping the image to [0, 1], and then multiplying by 255 and casting to an int32. */

function deprocess_image(x) {
	var res = tidy(() => {
		const {mean, variance} = tf.moments(x);
		x = x.sub(mean);
		// Add a small positive number (EPSILON) to the denominator to prevent
		// division-by-zero.
		x = x.div(sqrt(variance).add(tf.backend().epsilon()));
		// Clip to [0, 1].
		x = x.add(0.5);
		x = clipByValue(x, 0, 1);
		x = x.mul(255);
		return clipByValue(x, 0, 255).asType("int32");
	});

	return res;
}

/* This function performs gradient ascent on the input image to find an image that maximizes the output of the given filter in the given layer. */

async function input_gradient_ascent(layerIndex, neuron, iterations, start_image, recursion = 0) {
	var worked = 0;
	var full_data = {};

	try {
		var generated_data = tidy(() => {
			// Create an auxiliary model of which input is the same as the original
			// model but the output is the output of the convolutional layer of
			// interest.
			const layerOutput = model.getLayer(null, layerIndex).getOutputAt(0);

			const auxModel = tf_model({inputs: model.inputs, outputs: layerOutput});

			// This function calculates the value of the convolutional layer's
			// output at the designated filter index.
			const lossFunction = (input) => auxModel.apply(input, {training: true}).gather([neuron], -1);

			// This returned function (`gradFunction`) calculates the gradient of the
			// convolutional filter's output with respect to the input image.
			const gradFunction = grad(lossFunction);

			// Form a random image as the starting point of the gradient ascent.

			var new_input_shape = get_input_shape_with_batch_size();
			new_input_shape.shift();
			var data = randomUniform([1, ...new_input_shape], 0, 1);
			if(typeof(start_image) != "undefined") {
				data = start_image;
			}

			for (var i = 0; i < iterations; i++) {
				if(stop_generating_images) {
					continue;
				}

				const scaledGrads = tidy(() => {
					const grads = gradFunction(data);
					const norm = sqrt(tf_mean(tf_square(grads))).add(tf.backend().epsilon());
					// Important trick: scale the gradient with the magnitude (norm)
					// of the gradient.
					return grads.div(norm);
				});

				data = data.add(scaledGrads);
			}

			worked = 1;
			return data;
		});
	} catch (e) {
		if(("" + e).includes("is already disposed")) {
			await compile_model();
			if(recursion > 20) {
				await delay(recursion * 1000);
				return await input_gradient_ascent(layerIndex, neuron, iterations, start_image, recursion + 1);
			} else {
				throw new Error("Too many retries for input_gradient_ascent");
			}
		} else {
			throw new Error(e);
		}
	}

	if(model.input.shape.length == 4 && model.input.shape[3] == 3) {
		full_data["image"] = tidy(() => { return deprocess_image(generated_data).arraySync(); });
	} else {
		full_data["data"] = tidy(() => { return generated_data.arraySync(); });
	}

	await dispose(generated_data);

	full_data["worked"] = worked;

	return full_data;
}

/* This function gets an image from a URL. It uses the load_image function to load the image, and then uses fromPixels to convert it to a TensorFlow image. Next, it resizes the image using the nearest neighbor algorithm, and then expands the dimensions of the image. Finally, it returns the image. */

function _get_neurons_last_layer (layer, type) {
	var neurons = 1;

	if(!Object.keys(model).includes("layers")) {
		wrn("Cannot get model.layers");
		return false;
	}

	if(!Object.keys(model.layers).includes("" + layer)) {
		wrn(`Cannot get model.layers[${layer}]`);
		return false;
	}

	if(type == "conv2d") {
		neurons = model.layers[layer].filters;
	} else if (type == "dense") {
		neurons = model.layers[layer].units;
	} else if (type == "flatten") {
		neurons = 1;
	} else {
		dbg("Unknown layer " + layer);
		return false;
	}

	return neurons;
}

async function draw_maximally_activated_layer (layer, type, is_recursive = 0) {
	if(!is_cosmo_mode) {
		show_tab_label("maximally_activated_label", 1);
		window.scrollTo(0,0);

		await nextFrame();

		$("body").css("cursor", "wait");

		await gui_in_training(0);
	}

	if(currently_generating_images) {
		l("Cannot predict 2 layers at the same time. Waiting until done...");

		while (currently_generating_images) {
			await delay(500);
		}

	}

	var canvasses = [];

	currently_generating_images = true;

	var neurons = _get_neurons_last_layer(layer, type);

	if(typeof(neurons) == "boolean" && !neurons)  {
		currently_generating_images = false;
		err("Cannot determine number of neurons in last layer");
		return;
	}

	var types_in_order = "";
	if(get_number_of_layers() - 1 == layer && labels && labels.length) {
		types_in_order = " (" + labels.join(", ") + ")";
	}

	var times = [];

	favicon_spinner();

	$("#stop_generating_images_button").show();

	for (var i = 0; i < neurons; i++) {
		$("#generate_images_msg_wrapper").hide();
		$("#generate_images_msg").html("");

		if(stop_generating_images) {
			info("Stopped generating images because the stop generating images button was clicked");
			continue;
		}

		await _show_eta(times, i, neurons);

		var start = Date.now();

		var currentURL = window.location.href;
		var urlParams = new URLSearchParams(window.location.search);

		var tries_left = 3;

		var base_msg = `${language[lang]["generating_image_for_neuron"]} ${i + 1} ${language[lang]["of"]} ${neurons}`;

		try {
			l(base_msg);
			canvasses.push(await draw_maximally_activated_neuron(layer, neurons - i - 1));
		} catch (e) {
			currently_generating_images = false;

			if(("" + e).includes("already disposed")) {
				if(!is_recursive) {
					while (tries_left) {
						await delay(200);
						try {
							l(`${base_msg} ${language[lang]["failed_try_again"]}...`);
							canvasses.push(await draw_maximally_activated_layer(layer, type, 1));
						} catch (e) {
							if(("" + e).includes("already disposed")) {
								err("" + e);
							} else {
								throw new Error(e);
							}
						}
						tries_left--;
					}

					if(tries_left) {

					}
				} else {
					log("Already disposed in draw_maximally_activated_layer in a recursive step. Ignore this probably.");
				}
			} else {
				throw new Error(e);
			}
		}

		var end = Date.now();

		var time = ((end - start) / 1000) + 1;

		times.push(time);
	}

	$("#stop_generating_images_button").hide();
	$("#generate_images_msg_wrapper").hide();
	$("#generate_images_msg").html("");

	var type_h2 = "h2";
	var ruler = "";
	var br = "";

	if(is_cosmo_mode) {
		type_h2 = "span";
		ruler = "<hr class='cosmo_hr'>";
		br = "<br>";
	}

	$("#maximally_activated_content").prepend(`<${type_h2} class='h2_maximally_activated_layer_contents'>${ruler}<input class="hide_in_cosmo_mode" style='width: 100%' value='Layer ${layer + types_in_order}' /></${type_h2}>${br}`);

	l(language[lang]["done_generating_images"]);

	stop_generating_images = false;

	favicon_default();

	set_document_title(original_title);

	await allow_editable_labels();

	if(!is_cosmo_mode) {
		$("body").css("cursor", "default");
	}

	currently_generating_images = false;

	if(!(started_training || model.isTraining)) {
		await gui_not_in_training(0);
	}

	return canvasses;
}

async function _show_eta (times, i, neurons) {
	var eta = "";
	if(times.length) {
		eta = " (" + human_readable_time(parse_int((neurons - i) * median(times))) + " " + language[lang]["left"] + ")";
	}

	var img_left = (neurons - i);

	var swal_msg = "";

	if((neurons - i) == 1) {
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

	$("#show_cosmo_epoch_status").hide();

	$("#current_image").remove();

	if(!is_cosmo_mode) {
		show_tab_label("visualization_tab_label", $("#jump_to_interesting_tab").is(":checked") ? 1 : 0);
		show_tab_label("maximally_activated_label", $("#jump_to_interesting_tab").is(":checked") ? 1 : 0);
	}
}

async function predict_maximally_activated (item, force_category) {
	if(is_cosmo_mode) {
		$(".maximally_activated_predictions").show();
		return;
	}

	var results = await predict(item, force_category, 1);
	if($(item).next().length && $(item).next()[0].tagName.toLowerCase() == "pre") {
		$(item).next().remove();
	}

	$(item).after("<pre class='maximally_activated_predictions'>" + results + "</pre>");
}

async function draw_maximally_activated_neuron (layer, neuron) {
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

		var full_data = await input_gradient_ascent(layer, neuron, iterations, start_image);

		disable_layer_debuggers = original_disable_layer_debuggers;

		if(full_data["worked"]) {
			if(Object.keys(full_data).includes("data")) {
				var _tensor = tensor(full_data["data"]);
				var t_str = tensor_print_to_string(_tensor);
				log("Maximally activated tensors:", t_str);
				$("#maximally_activated_content").prepend(`<input style='width: 100%' value='Maximally activated tensors for Layer ${layer}, Neuron ${neuron}:' /><pre>${t_str}</pre>`);
				show_tab_label("maximally_activated_label", 1);
				await dispose(_tensor);
			} else if (Object.keys(full_data).includes("image")) {
				var data = full_data["image"][0];
				var to_class = is_cosmo_mode ? "current_images" : "maximally_activated_class";
				var canvas = get_canvas_in_class(layer, to_class, 0, 1);
				var _uuid = canvas.id;

				canvasses.push(canvas);

				var data_hash = {
					layer: layer,
					neuron: neuron,
					model_hash: await get_model_config_hash()
				};

				scaleNestedArray(data);
				var res = draw_grid(canvas, 1, data, 1, 0, "predict_maximally_activated(this, 'image')", null, data_hash, "layer_image");

				if(res) {
					if(!is_cosmo_mode) {
						$("#maximally_activated_content").prepend(canvas);
						show_tab_label("maximally_activated_label", 1);
					}
				} else {
					log("Res: ", res);
				}
			}
		}
	} catch (e) {
		await write_error(e);
		show_tab_label("visualization_tab", 1);
		show_tab_label("fcnn_tab_label", 1);
		return false;
	}

	await nextFrame();

	return canvasses;
}

function array_to_fixed (array, fixnr) {
	if(fixnr == 0) {
		return array;
	}
	var x = 0;
	var len = array.length;
	while(x < len) {
		if(looks_like_number(array[x])) {
			array[x] = parse_float(parse_float(array[x]).toFixed(fixnr));
		}
		x++;
	}

	return array;
}

function array_to_color (array, color) {
	var x = 0;
	var len = array.length;
	var new_array = [];
	while(x < len) {
		var this_color = "";

		if(color && Object.keys(color).includes("" + x)) {
			this_color = color[x];
		}

		if(this_color == "#353535" || this_color == "#ffffff" || this_color == "white" || this_color == "black" || !this_color) {
			new_array.push(array[x]);
		} else {
			new_array.push("\\colorbox{" + this_color + "}{" + array[x] + "}");
		}

		x++;
	}

	return new_array;
}

function array_to_latex_color (original_array, desc, color=null, newline_instead_of_ampersand=0) {
	if(!color) {
		return array_to_latex(original_array, desc, newline_instead_of_ampersand);
	}

	var array = JSON.parse(JSON.stringify(original_array));
	var str = "\\underbrace{\\begin{pmatrix}\n";

	var joiner = " & ";
	if(newline_instead_of_ampersand) {
		joiner = " \\\\\n";
	}

	var arr = [];

	for (var i = 0; i < array.length; i++) {
		try {
			array[i] = array_to_fixed(array[i], parse_int($("#decimal_points_math_mode").val() || 0));
		} catch (e) {
			err("ERROR in math mode (e, array, i, color):", e, array, i, color);
		}

		try {
			array[i] = array_to_color(array[i], color[i]);
			arr.push(array[i].join(joiner));
		} catch (e) {
			err("ERROR in math mode (e, array, i, color):", e, array, i, color);
		}
	}

	str += arr.join("\\\\\n");

	str += "\n\\end{pmatrix}}";
	if(desc) {
		str += "_{\\mathrm{" + desc + "}}\n";
	}

	return str;
}

function array_to_latex (array, desc, newline_instead_of_ampersand) {
	var str = "";
	str = "\\underbrace{\\begin{pmatrix}\n";

	var joiner = " & ";
	if(newline_instead_of_ampersand) {
		joiner = " \\\\\n";
	}

	var arr = [];

	for (var i = 0; i < array.length; i++) {
		array[i] = array_to_fixed(array[i], parse_int($("#decimal_points_math_mode").val()));
		arr.push(array[i].join(joiner));
	}

	str += arr.join("\\\\\n");

	str += "\n\\end{pmatrix}}";
	if(desc) {
		str += "_{\\mathrm{" + desc + "}}\n";
	}

	return str;
}

function a_times_b (a, b) {
	var res = a + " \\times " + b;

	return res;
}

function get_weight_name_by_layer_and_weight_index (layer, index) {
	assert(typeof(layer) == "number", layer + " is not a number");
	assert(typeof(index) == "number", index + " is not a number");

	var original_name = model.layers[layer].weights[index].name;

	var matches = /^.*\/(.*?)(?:_\d+)?$/.exec(original_name);
	if(matches === null) {
		err("matches is null. Could not determine name from " + original_name);
	} else if(1 in matches) {
		return matches[1];
	} else {
		err("Could not determine name from " + original_name + ", matches: ");
		log(matches);
	}

	return null;
}

function get_layer_data() {
	var layer_data = [];

	var possible_weight_names = ["kernel", "bias", "beta", "gamma", "moving_mean", "moving_variance"];

	for (var i = 0; i < model.layers.length; i++) {
		var this_layer_weights = {};

		for (var n = 0; n < possible_weight_names.length; n++) {
			this_layer_weights[possible_weight_names[n]] = [];
		}

		try {
			if("weights" in model.layers[i]) {
				for (var k = 0; k < model.layers[i].weights.length; k++) {
					var wname = get_weight_name_by_layer_and_weight_index(i, k);
					if(possible_weight_names.includes(wname)) {
						this_layer_weights[wname] = Array.from(model.layers[i].weights[k].val.arraySync());
					} else {
						err("Invalid wname: " + wname);
						log(model.layers[i].weights[k]);
					}
				}
			}
		} catch (e) {
			if(("" + e).includes("Tensor is disposed")) {
				dbg("Model was disposed during get_layer_data(). This is probably because the model was recompiled during this.");
			} else {
				err(e);
			}
		}

		layer_data.push(this_layer_weights);
	}

	return layer_data;
}

function array_size (ar) {
	var row_count = ar.length;
	var row_sizes = [];

	for(var i = 0; i < row_count; i++){
		row_sizes.push(ar[i].length);
	}

	var res = [row_count, Math.min.apply(null, row_sizes)];

	return res;
}

function get_layer_output_shape_as_string (i) {
	assert(typeof(i) == "number", i + " is not a number");
	assert(i < model.layers.length, i + " is larger than " + (model.layers.length - 1));
	if(Object.keys(model).includes("layers")) {
		try {
			var str = model.layers[i].outputShape.toString();
			str = str.replace(/^,|,$/g,"");
			str = "[" + str + "]";
			return str;
		} catch (e) {
			err(e);
		}
	} else {
		log("Layers not in model");
	}

}

function _get_h (i) {
	var res = "h_{\\text{Shape: }" + get_layer_output_shape_as_string(i) + "}" + "'".repeat(i);

	return res;
}

function array_to_latex_matrix (array, level=0, no_brackets) {
	var base_tab = "";
	for (var i = 0; i < level; i++) {
		base_tab += "\t";
	}
	var str = base_tab + (!no_brackets ? "\\left(" : "") + "\\begin{matrix}\n";
	if(typeof(array) == "object") {
		for (var i = 0; i < array.length; i++) {
			if(typeof(array[i]) == "object") {
				for (var k = 0; k < array[i].length; k++) {
					if(typeof(array[i][k]) == "object") {
						str += array_to_latex_matrix(array[i][k], level + 1);
					} else {
						if(k == array[i].length - 1) {
							str += base_tab + "\t" + array[i][k] + "\\\\\n";
						} else {
							str += base_tab + "\t" + array[i][k] + " & ";
						}
					}
				}
			} else {
				str += base_tab + "\t" + array[i] + "\\\\\n";
			}
		}
	} else {
		str += base_tab + "\t" + array + "\n";
	}

	str += base_tab + "\\end{matrix}" + (!no_brackets ? "\\right)" : "") + "\n";

	return str;
}

function model_to_latex () {
	var layers = model.layers;

	var input_shape = model.layers[0].input.shape;

	if(!$("#allow_math_mode_for_all_layers").is(":checked") && input_shape.length != 2) {
		l("Math mode works only in input shape [n] (or [null, n] with batch)");
		return;
	}

	var output_shape = model.layers[model.layers.length - 1].outputShape;

	if(!$("#allow_math_mode_for_all_layers").is(":checked") && output_shape.length != 2) {
		l("Math mode works only in output shape [n] (or [null, n] with batch)");
		return;
	}

	var activation_function_equations = {
		"sigmoid": {
			"equation": "\\mathrm{sigmoid}\\left(x\\right) = \\sigma\\left(x\\right) = \\frac{1}{1+e^{-x}}",
			"equation_no_function_name": "\\sigma\\left(REPLACEME\\right) = \\frac{1}{1+e^{-REPLACEME}}",
			"lower_limit": 0,
			"upper_limit": 1,
			"math_ml": 1
		},
		"tanh": {
			"equation": "\\mathrm{tanh}\\left(x\\right) = \\frac{e^x-e^{-x}}{e^x+e^{-x}}",
			"equation_no_function_name": "\\frac{e^REPLACEME-e^{-REPLACEME}}{e^REPLACEME+e^{-REPLACEME}}",
			"lower_limit": -1,
			"upper_limit": 1
		},
		"relu": {
			"equation": "\\mathrm{relu}\\left(x\\right) = \\mathrm{max}\\left(0, x\\right)",
			"equation_no_function_name": "\\mathrm{max}\\left(0, REPLACEME\\right)",
			"lower_limit": 0
		},
		"thresholdedReLU": {
			"equation": "\\mathrm{thresholdedReLU}\\left(x\\right) = \\begin{cases}\nx & x > \\theta \\\\ \n 0 & \\mathrm{otherwise}\n\\end{cases}\n",
			"equation_no_function_name": "\\begin{cases}\nx & x > \\theta \\\\ \n 0 & \\mathrm{otherwise}\n\\end{cases}\n"
		},
		"LeakyReLU": {
			"equation": "\\mathrm{LeakyReLU}\\left(x\\right) = \\mathrm{max}\\left(\\alpha \\cdot x, x\\right)",
			"equation_no_function_name": "\\mathrm{max}\\left(ALPHAREPL \\cdot REPLACEME, REPLACEME\\right)"
		},
		"elu": {
			"equation": "\\mathrm{elu}\\left(x\\right) = \\left\\{\n\\begin{array}{ll}\nx & x \\geq 0 \\\\\n\\alpha\\left(e^x - 1\\right)& \\, x \\lt 0 \\\\\n\\end{array}\n\\right.",
			"equation_no_function_name": "\\left\\{\n\\begin{array}{ll}\nREPLACEME & REPLACEME \\geq 0 \\\\\n\\alpha\\left(e^REPLACEME - 1\\right)& \\, x \\lt 0 \\\\\n\\end{array}\n\\right."
		},
		"softplus": {
			"equation": "\\mathrm{softplus}\\left(x\\right) = \\ln\\left(1 + e^x\\right)",
			"equation_no_function_name": "\\ln\\left(1 + e^REPLACEME\\right)",
			"lower_limit": 0
		},
		"softmax": {
			"equation": "\\mathrm{softmax}\\left(x\\right) = \\frac{e^{z_j}}{\\sum^K_{k=1} e^{z_k}}",
			"equation_no_function_name": "\\frac{e^{z_j}}{\\sum^K_{k=1} e^{z_k}}",
			"lower_limit": 0,
			"upper_limit": 1,
		},
		"softsign": {
			"equation": "\\mathrm{softsign}\\left(x\\right) = \\frac{x}{\\left(1 + \\left| x \\right| \\right)}",
			"equation_no_function_name": "\\frac{REPLACEME}{\\left(1 + \\left| REPLACEME \\right| \\right)}",
			"lower_limit": -1,
			"upper_limit": 1
		},
		"selu": {
			"equation": "\\mathrm{selu}\\left(x\\right) = \\mathrm{scale} \\cdot \\mathrm{elu}\\left(x, \\alpha\\right) = \\mathrm{scale} \\cdot \\left\\{\n\\begin{array}{ll}\nx & x \\geq 0 \\\\\n\\alpha\\left(e^x - 1\\right)& \\, x \\lt 0 \\\\\n\\end{array}\n\\right.",
			"equation_no_function_name": "\\mathrm{scale} \\cdot \\left\\{\n\\begin{array}{ll}\nREPLACEME & REPLACEME \\geq 0 \\\\\n\\alpha\\left(e^REPLACEME - 1\\right)& \\, REPLACEME \\lt 0 \\\\\n\\end{array}\n\\right."
		},
		"relu6": {
			"equation": "\\mathrm{relu6}\\left(x\\right) = \\mathrm{min}\\left(\\mathrm{max}\\left(0, x\\right),6\\right)",
			"equation_no_function_name": "\\mathrm{min}\\left(\\mathrm{max}\\left(0, REPLACEME\\right),6\\right)",
			"lower_limit": 0,
			"upper_limit": 6
		}
	};

	var loss_equations = {
		"meanAbsoluteError": "\\mathrm{MAE} = \\frac{1}{n} \\sum_{i=1}^n \\left|y_i - \\hat{y}_i\\right|",
		"meanSquaredError": "\\mathrm{MSE} = \\frac{1}{n} \\sum_{i=1}^n \\left(y_i - \\hat{y}_i\\right)^2",
		"rmse": "\\mathrm{RMSE} = \\sqrt{\\mathrm{MSE}} = \\sqrt{\\frac{1}{n} \\sum_{i=1}^n \\left(y_i - \\hat{y}_i\\right)^2}",
		"categoricalCrossentropy": "\\text{Categorical Crossentropy:} -\\sum_{i=1}^n y_i \\log\\left(\\hat{y}_i\\right)",
		"binaryCrossentropy": "\\text{Binary Crossentropy:} -\\frac{1}{n} \\sum_{i=1}^n y_i \\cdot \\log\\left(\\hat{y}_i\\right) + 1\\left(-y_i\\right) \\cdot \\log\\left(1 - \\hat{y}_i\\right)",
		"meanSquaredLogarithmicError": "\\text{Mean Squared Logarithmic Error:} \\frac{1}{n} \\sum_{i=0}^n \\left(log\\left(y_i + 1\\right)- \\log\\left(\\hat{y}_i + 1\\right)\\right)^2",
		"poisson": "\\text{Poisson:} \\frac{1}{n} \\sum_{i=0}^n \\left(\\hat{x}_i - y_i\\cdot \\log\\left(\\hat{y}_i\\right)\\right)",
		"squaredHinge": "\\text{Squared Hinge:} \\sum_{i=0}^n \\left(\\mathrm{max}\\left(0, 1 - y_i \\cdot \\hat{y}_i\\right)^ 2\\right)",
		"logcosh": "\\text{logcosh:} \\sum_{i=0}^n \\log(\\cosh\\left(\\hat{y}_i - y_i\\right))",
		"meanAbsolutePercentageError": "\\text{MAPE} = \\frac{1}{n} \\sum_{t=1}^{n} \\left|\\frac{\\hat{y} - y}{\\hat{y}}\\right|"
	};

	var default_vars = {
		"g": {
			"name": "Gradient estimate"
		},
		"nabla_operator": {
			"name": "Nabla-Operator (Vector of partial derivatives), 3d example: ",
			"value": "\\begin{align} \\begin{bmatrix} \\frac{\\partial}{\\partial x} \\\\ \\frac{\\partial}{\\partial y} \\\\ \\frac{\\partial}{\\partial z} \\end{bmatrix} \\end{align}"
		},
		"theta": {
			"name": "Weights"
		},
		"eta": {
			"name": "Learning rate",
			"origin": "learningRate_OPTIMIZERNAME"
		},
		"epsilon": {
			"name": "Epsilon",
			"origin": "epsilon_OPTIMIZERNAME"
		}
	};

	var optimizer_equations = {
		"sgd": {
			"equations": [
				"g = \\nabla_{\\theta}J(\\theta; x, y)",
				"\\Delta\\theta = -\\eta \\cdot g",
				"\\theta = \\theta + \\Delta\\cdot g"
			],
			"dependencies": [],
			"variables": {
				"\\eta": {
					"name": "Learning rate",
					"origin": "learningRate_sgd"
				},
				"\\theta": default_vars["theta"],
				"\\nabla": default_vars["nabla_operator"],
				"J": {
					"name": "Loss function"
				},
				"g": {
					"name": "Gradient"
				},
				"x": {
					"name": "Input values"
				},
				"y": {
					"name": "Output values"
				}
			}
		},
		"momentum": {
			"equations": [
				"\\Delta\\theta_t = -\\gamma v_{t-1} - \\eta g_t"
			],
			"dependencies": [],
			"variables": {
				"\\eta": default_vars["eta"],
				"\\theta": default_vars["theta"]
			}
		},
		"nag": {
			"equations": [
				"\\Delta\\theta_t = -\\gamma v_{t-1} - \\eta \\nabla_\\theta J(\\theta - \\gamma v_{t-1})"
			],
			"dependencies": [],
			"variables": {
				"\\theta": default_vars["theta"],
				"\\nabla": default_vars["nabla_operator"],
				"\\eta": default_vars["eta"],
			}
		},
		"adagrad": {
			"equations": [
				"\\Delta\\theta = - \\frac{\\eta}{\\sqrt{G}} \\bigodot g"
			],
			"dependencies": [],
			"variables": {
				"\\eta": default_vars["eta"],
				"g": default_vars["g"],
				"\\theta": default_vars["theta"]
			}
		},
		"adadelta": {
			"equations": [
				"\\Delta\\theta_t = - \\frac{\\mathrm{rmsprop}\\left[\\Delta\\theta\\right]_{t-1}}{\\mathrm{rmsprop}\\left[g_t\\right]}g_t"
			],
			"dependencies": ["rmsprop"],
			"variables": {
				"\\eta": default_vars["eta"],
				"g": default_vars["g"],
				"g_t": {
					"name": "Gradient at time t along } \\theta^j \\text{ "
				},
				"\\theta": default_vars["theta"],
				"\\epsilon": default_vars["epsilon"]
			}
		},
		"adamax": {
			"equations": [
				"\\theta = \\theta + \\alpha \\sum^m_{i=1}\\left(y^\\left(i\\right) - h_\\theta\\left(x^{\\left(i\\right)}\\right)\\right)x^{\\left(i\\right)}, \\quad \\text{Repeat until converge}"
			],
			"dependencies": [],
			"variables": {
				"\\theta": default_vars["theta"],
				"\\alpha": {
					"name": "Initial accumulator value"
				}
			}
		},
		"rmsprop": {
			"equations": [
				"\\Delta\\theta = - \\frac{\\eta}{\\sqrt{E\\left[g²\\right]+\\epsilon}}"
			],
			"dependencies": [],
			"variables": {
				"g": default_vars["g"],
				"\\eta": default_vars["eta"],
				"\\epsilon": default_vars["epsilon"]
			}
		},
		"adam": {
			"equations": [
				"v_t = \\beta_1 * \\cdot v_{t - 1} - \\left(1 - \\beta_1\\right) * g_t",
				"s_t = \\beta_2 * \\cdot s_{t - 1} - \\left(1 - \\beta_2\\right) * g^2_t",
				"\\Delta\\theta = - \\eta\\frac{v_t}{\\sqrt{s_t+\\epsilon}} * g_t",
				"\\theta_{t+1} = \\theta_t + \\Delta\\theta_t"
			],
			"dependencies": [],
			"variables": {
				"\\theta": {
					"name": "Weights"
				},
				"\\eta": default_vars["eta"],
				"\\epsilon": default_vars["epsilon"],
				"g_t": {
					"name": "Gradient at time t along } \\theta^j \\text{ "
				},
				"v_t": {
					"name": "Exponential average of gradients along }\\theta_j \\text{ "
				},
				"s_t": {
					"name": "Exponential average of squares of gradients along }\\theta_j \\text{ "
				},
				"\\beta_1, \\beta_2": {
					"name": "Hyperparameter"
				}
			}
		}
	};

	var activation_string = "";
	var str = "";
	var layer_data = get_layer_data();

	var y_layer = [];

	for (var i = 0; i < output_shape[1]; i++) {
		y_layer.push(["y_{" + i + "}"]);
	}

	var colors = [];
	if(prev_layer_data.length) {
		colors = color_compare_old_and_new_layer_data(JSON.parse(JSON.stringify(prev_layer_data)), JSON.parse(JSON.stringify(layer_data)));
	} else {
		colors = color_compare_old_and_new_layer_data(JSON.parse(JSON.stringify(layer_data)), JSON.parse(JSON.stringify(layer_data)));
	}

	var input_layer = [];

	for (var i = 0; i < input_shape[1]; i++) {
		input_layer.push(["x_{" + i + "}"]);
	}

	var shown_activation_equations = [];

	for (var i = 0; i < model.layers.length; i++) {
		var this_layer_type = $($(".layer_type")[i]).val();
		if(i == 0) {
			str += "<h2>Layers:</h2>";
		}

		str += "<div class='temml_me'> \\text{Layer " + i + " (" + this_layer_type + "):} \\qquad ";

		if(this_layer_type == "dense") {
			var activation_name = model.layers[i].activation.constructor.className;

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

			var kernel_name = "\\text{Weight Matrix}^{" + array_size(layer_data[i].kernel).join(" \\times ") + "}";

			if(i == layer_data.length - 1) {
				str += array_to_latex(y_layer, "Output") + " = " + activation_start;
				if(i == 0) {
					str += a_times_b(array_to_latex(input_layer, "Input"), array_to_latex_color(layer_data[i].kernel, kernel_name, colors[i].kernel));
				} else {
					var repeat_nr = i - 1;
					if(repeat_nr < 0) {
						repeat_nr = 0;
					}
					str += a_times_b(_get_h(repeat_nr), array_to_latex_color(layer_data[i].kernel, kernel_name, colors[i].kernel));
				}
			} else {
				str += _get_h(i) + " = " + activation_start;
				if(i == 0) {
					str += a_times_b(array_to_latex(input_layer, "Input"), array_to_latex_color(layer_data[i].kernel, kernel_name, colors[i].kernel));
				} else {
					str += a_times_b(_get_h(i - 1), array_to_latex_color(layer_data[i].kernel, kernel_name, colors[i].kernel));
				}
			}

			try {
				if("bias" in layer_data[i] && layer_data[i].bias.length) {
					str += " + " + array_to_latex_color([layer_data[i].bias], "Bias", [colors[i].bias], 1);
				}
			} catch (e) {
				err(e);
			}

			if(activation_name != "linear") {
				str += "\\right)";
			}
		} else if (this_layer_type == "flatten") {
			var original_input_shape = JSON.stringify(model.layers[i].getInputAt(0).shape.filter(Number));
			var original_output_shape = JSON.stringify(model.layers[i].getOutputAt(0).shape.filter(Number));
			str += _get_h(i) + " = " + _get_h(i == 0 ? 0 : i - 1) + " \\xrightarrow{\\text{Reshape}} \\text{New Shape: }" + original_output_shape;
		} else if (this_layer_type == "reshape") {
			var original_input_shape = JSON.stringify(model.layers[i].getInputAt(0).shape.filter(Number));
			var original_output_shape = JSON.stringify(model.layers[i].getOutputAt(0).shape.filter(Number));
			var general_reshape_string = "_{\\text{Shape: " + original_input_shape + "}} \\xrightarrow{\\text{Reshape}} \\text{New Shape: }" + original_output_shape;
			if(i > 1) {
				str += _get_h(i) + " = " + _get_h(i - 1) + general_reshape_string;
			} else {
				str += array_to_latex(input_layer, "Input") + " = h" + general_reshape_string;
			}
		} else if (["elu", "leakyReLU", "reLU", "softmax", "thresholdedReLU"].includes(this_layer_type)) {
			var activation_name = this_layer_type;
			if(activation_name == "leakyReLU") {
				activation_name = "LeakyReLU";
			} else if(activation_name == "reLU") {
				activation_name = "relu";
			}

			var prev_layer_name = "";

			if(i == 0) {
				prev_layer_name += array_to_latex(input_layer, "Input");
			} else {
				prev_layer_name += _get_h(i - 1);
			}

			if(i == layer_data.length - 1) {
				str += array_to_latex(y_layer, "Output") + " = ";
			} else {
				str += _get_h(i) + " = ";
			}

			if(Object.keys(activation_function_equations).includes(activation_name)) {
				var this_activation_string = activation_function_equations[activation_name]["equation_no_function_name"];

				this_activation_string = this_activation_string.replaceAll("REPLACEME", "{" + prev_layer_name + "}");

				var alpha = parse_float(get_item_value(i, "alpha"));
				if(typeof(alpha) == "number") {
					this_activation_string = this_activation_string.replaceAll("ALPHAREPL", "{" + alpha + "}");
					this_activation_string = this_activation_string.replaceAll("\\alpha", "\\underbrace{" + alpha + "}_{\\alpha} \\cdot ");
				}

				var theta = parse_float(get_item_value(i, "theta"));
				if(typeof(theta) == "number") {
					this_activation_string = this_activation_string.replaceAll("\\theta", "{\\theta = " + theta + "} \\cdot ");
				}

				var max_value_item = $($(".layer_setting")[i]).find(".max_value");

				this_activation_string = this_activation_string.replaceAll("REPLACEME", "{" + prev_layer_name + "}");

				var this_activation_array = [];

				if(Object.keys(activation_function_equations[activation_name]).includes("upper_limit")) {
					this_activation_array.push("\\text{Lower-limit: } " + activation_function_equations[activation_name]["lower_limit"]);
				}

				if(Object.keys(activation_function_equations[activation_name]).includes("upper_limit")) {
					this_activation_array.push("\\text{Upper-limit: } " + activation_function_equations[activation_name]["upper_limit"]);
				}

				if(max_value_item.length) {
					var max_value = max_value_item.val();
					this_activation_array.push("\\text{Capped at maximally " + max_value + "}");
				}

				if(this_activation_array.length) {
					this_activation_string = this_activation_string + "\\qquad (" + this_activation_array.join(", ") + ")";
				}

				str += this_activation_string + "\n";
			} else {
				//log("Activation name '" + activation_name + "' not found");
			}
		} else if (this_layer_type == "batchNormalization") {
			// not used
			//x* = (x - E[x]) / sqrt(var(x))

			var prev_layer_name = "";

			var outname = "";

			if(i == layer_data.length - 1) {
				outname = array_to_latex(y_layer, "Output") + " \\longrightarrow ";
			} else {
				outname += _get_h(i) + " \\longrightarrow ";
			}

			var mini_batch_mean = "\\underbrace{\\mu_\\mathcal{B} = \\frac{1}{n} \\sum_{i=1}^n x_i}_{\\text{Batch mean}}";

			var mini_batch_variance = "\\underbrace{\\sigma_\\mathcal{B}^2 = \\frac{1}{n} \\sum_{i = 1}^n \\left(x_i - \\mu_\\mathcal{B}\\right)^2}_{\\text{Batch variance}}";

			var x_equation = "\\overline{x_i} \\longrightarrow \\underbrace{\\frac{x_i - \\mu_\\mathcal{B}}{\\sqrt{\\sigma_\\mathcal{B}^2 + \\epsilon \\left( = " + model.layers[i].epsilon + "\\right)}}}_\\text{Normalize}";

			var beta_string = "";
			var gamma_string = "";
			if("beta" in layer_data[i]) {
				beta_string = array_to_latex_matrix(array_to_fixed(layer_data[i].beta, parse_int($("#decimal_points_math_mode").val())));
				beta_string = "\\displaystyle " + beta_string;
			}
			if("gamma" in layer_data[i]) {
				gamma_string = array_to_latex_matrix(array_to_fixed(layer_data[i].gamma, parse_int($("#decimal_points_math_mode").val())));
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
		} else if (this_layer_type == "dropout") {
			var dropout_rate = parse_int(parse_float($($(".layer_setting")[i]).find(".dropout_rate").val()) * 100);
			str += "\\text{Setting " + dropout_rate + "\\% of the input values to 0 randomly}";
		} else if (this_layer_type == "DebugLayer") {
			str += "\\text{The debug layer does nothing to the data, but just prints it out to the developers console.}";
		} else if (this_layer_type == "gaussianNoise") {
			str += "\\text{Adds gaussian noise to the input (only active during training), Standard-deviation: " + get_item_value(i, "stddev") + ".}";
		} else if (this_layer_type == "conv1d") {
			str += _get_h(i + 1) + " = \\sum_{i=1}^{N} \\left( \\sum_{p=1}^{K} " + _get_h(i) + "(x+i, c) \\times \\text{kernel}(p, c, k) \\right) + \\text{bias}(k)";
		} else if (this_layer_type == "conv1d") {
			str += _get_h(i + 1) + "\\sum_{i=1}^{N} \\left( \\sum_{p=1}^{K}" + _get_h(i) + "(x+i, c) \\times \\text{kernel}(p, c, k) \\right) + \\text{bias}(k)";
		} else if (this_layer_type == "conv2d") {
			str += _get_h(i + 1) + " = \\sum_{i=1}^{N} \\sum_{j=1}^{M} \\left( \\sum_{p=1}^{K} \\sum_{q=1}^{L} " + _get_h(i) + "(x+i, y+j, c) \\times \\text{kernel}(p, q, c, k) \\right) + \\text{bias}(k)";
		} else if (this_layer_type == "conv3d") {
			str += _get_h(i + 1) + " \\sum_{i=1}^{N} \\sum_{j=1}^{M} \\sum_{l=1}^{P} \\left( \\sum_{p=1}^{K} \\sum_{q=1}^{L} \\sum_{r=1}^{R} " + _get_h(i) + "(x+i, y+j, z+l, c) \\times \\text{kernel}(p, q, r, c, k) \\right) + \\text{bias}(k)";
		} else if (this_layer_type == "maxPooling1D") {
			str += _get_h(i + 1) + "\\max_{i=1}^{N}" + _get_h(i) + "(x+i)";
		} else if (this_layer_type == "maxPooling2D") {
			str += _get_h(i + 1) + "\\max_{i=1}^{N} \\max_{j=1}^{M} " + _get_h(i) + "(x+i, y+j)";
		} else if (this_layer_type == "maxPooling3D") {
			str += _get_h(i + 1) + "\\max_{i=1}^{N} \\max_{j=1}^{M} \\max_{l=1}^{P} " + _get_h(i) + "(x+i, y+j, z+l)";
		} else {
			str += "\\mathrm{(The equations for this layer are not yet defined)}";
			log("Invalid layer type for layer " + i + ": " + this_layer_type);
		}

		str += "</div><br>";
		/*
		if(i != model.layers.length - 1) {
			str += "<hr class='full_width_hr'>";
		}
		*/
	}

	if(Object.keys(loss_equations).includes($("#loss").val())) {
		str += "<h2>Loss:</h2><div class='temml_me'>" + loss_equations[$("#loss").val()] + "</div><br>";
	}

	var optimizer = $("#optimizer").val();
	if(Object.keys(optimizer_equations).includes(optimizer)) {
		var this_optimizer = optimizer_equations[optimizer];

		var dependencies = this_optimizer["dependencies"];

		str += "<h2>Optimizer:</h2>\n";

		if(this_optimizer.variables) {
			var varnames = Object.keys(this_optimizer.variables);
			//log("a", this_optimizer.variables);
			for (var m = 0; m < varnames.length; m++) {
				//log("b", this_optimizer.variables[varnames[m]]);
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

			str += "<h3>Equations for optimizers:</h3>\n";
		}

		for (var m = 0; m < dependencies.length; m++) {
			if(dependencies[m] != optimizer) {
				str += "<div class='temml_me'>\\displaystyle \\text{" + dependencies[m] + ": }" + optimizer_equations[dependencies[m]]["equations"].join(" </div><br>\n<div class='temml_me'> ") + " </div><br>";
			}
		}

		str += "<div class='temml_me'> \\displaystyle \\text{" + optimizer + ": }" + this_optimizer["equations"].join(" </div><br>\n<div class='temml_me'> ") + " </div><br>";
	} else {
		log("<h2>Unknown optimizer: " + optimizer + "</h2>");
	}

	prev_layer_data = layer_data;

	if(activation_string && str) {
		return "<h2>Activation functions:</h2> " + activation_string + str;
	} else {
		if(str) {
			return str;
		}
	}

}

function can_be_shown_in_latex () {
	if(!model) {
		if(load_time != "") {
			l("Hiding Math tab because there is no model. This might be a bug.");
		}
		return false;
	}

	if(!Object.keys(model).includes("layers")) {
		dbg("model does not include layers. Cannot be shown in LaTeX");
		return false;
	}

	if(!Object.keys(model["layers"]).includes("0")) {
		dbg("model does not include layers. Cannot be shown in LaTeX");
		return false;
	}

	if($("#allow_math_mode_for_all_layers").is(":checked")) {
		return true;
	}

	if(!($("#allow_math_mode_for_all_layers").is(":checked")) && model.layers[0].input.shape.length != 2) {
		if($("#math_tab_label").is(":visible")) {
			l("Hiding math tab because the input tensor is too large.");
		}
		return false;
	}

	if(model.layers[model.layers.length - 1].input.shape.length != 2) {
		l("Hiding math tab because the output tensor has too many dimensions. It has " + model.layers[model.layers.length - 1].input.shape.length + ". Must be 2.");
		return false;
	}

	for (var i = 0; i < model.layers.length; i++) {
		var this_layer_type = $($(".layer_type")[i]).val();
		var valid_layers = [
			"dense",
			"flatten",
			"reshape",
			"elu",
			"leakyReLU",
			"reLU",
			"softmax",
			"thresholdedReLU",
			"dropout",
			"batchNormalization",
			"DebugLayer",
			"gaussianNoise",
		];
		if(!(valid_layers.includes(this_layer_type))) {
			l("Hiding math tab because " + this_layer_type + " is not in " + valid_layers.join(", "));
			return false;
		}
	}

	return true;
}

async function write_model_to_latex_to_page (reset_prev_layer_data, force) {
	if(!can_be_shown_in_latex()) {
		if(!is_hidden_or_has_hidden_parent($("#math_tab")[0])) {
			show_tab_label("math_tab_label", 1);
		} else {
			hide_tab_label("math_tab_label");
		}
		return;
	}

	if(!force && $("#math_tab_label").css("display") == "none") {
		return;
	}

	if(reset_prev_layer_data) {
		prev_layer_data = [];
	}

	var latex = model_to_latex();

	if(latex) {
		$("#math_tab_code").html(latex);

		try {
			show_tab_label("math_tab_label");

			var math_tab_code_elem = $("#math_tab_code")[0];

			var xpath = get_element_xpath(math_tab_code_elem);
			var new_md5 = await md5($(math_tab_code_elem).html());
			var old_md5 = math_items_hashes[xpath];

			if(new_md5 != old_md5 || force || !is_hidden_or_has_hidden_parent($("#math_tab_code"))) {
				try {
					await _temml();
				} catch (e) {
					if(!("" + e).includes("assign to property") || ("" + e).includes("s.body[0] is undefined")) {
						info("" + e);
					} else if (("" + e).includes("too many function arguments")) {
						err("TEMML: " + e);
					} else {
						throw new Error(e);
					}
				}
				show_tab_label("math_tab_label");
				math_items_hashes[xpath] = new_md5;
			}
		} catch (e) {
			if(("" + e).includes("can't assign to property")) {
				wrn("failed temml:", e);
			} else {
				await write_error(e);
			}
		}
	} else {
		hide_tab_label("math_tab_label");
	}
}

/* This function is used to compare old and new layer data to see if there are any differences. The default color is black, but if darkmode is true, the default color will be white. The color diff variable will contain an array of objects, with each object representing a layer. The keys of each object represent the different data sets within that layer, and the values are arrays of colors, with each color representing the difference between the old and new data for that particular data set. */

function color_compare_old_and_new_layer_data (old_data, new_data) {
	assert(old_data.length == new_data.length, "Old data and new data are vastly different. Have you changed the number of layers without resetting prev_layer_data?");

	var default_color = "#ffffff";
	var cookie_theme = get_cookie("theme");
	var darkmode = 0;
	if(cookie_theme == "darkmode") {
		darkmode = 1;
	}
	if(darkmode) {
		default_color = "#353535";
	}

	var color_diff = [];

	for (var layer_nr = 0; layer_nr < old_data.length; layer_nr++) {
		var this_old_layer = old_data[layer_nr];
		var this_new_layer = new_data[layer_nr];

		assert(Object.keys(this_old_layer).join(",") == Object.keys(this_new_layer).join(","), "Old data and new data for layer " + layer_nr + " have different length data sets");

		var keys = Object.keys(this_old_layer);

		color_diff[layer_nr] = {};

		for (var key_nr = 0; key_nr < keys.length; key_nr++) {
			var this_key = keys[key_nr];

			if(!(this_old_layer[this_key].length == this_new_layer[this_key].length)) {
				//wrn("Keys are not equal for layer data of " + layer_nr + ", key: " + this_key);
				continue;
			}

			color_diff[layer_nr][this_key] = [];

			var this_old_sub_array = this_old_layer[this_key];
			var this_new_sub_array = this_new_layer[this_key];

			for (var item_nr = 0; item_nr < this_old_sub_array.length; item_nr++) {
				if(Object.keys(this_new_sub_array).includes("" + item_nr)) {
					if(Object.keys(this_old_sub_array).includes("" + item_nr)) {
						var this_new_item = this_new_sub_array[item_nr];
						var this_old_item = this_old_sub_array[item_nr];

						if(typeof(this_old_item) == "number") { // sub array is all numbers
							if(this_old_item == this_new_item) {
								color_diff[layer_nr][this_key][item_nr] = default_color;
							} else {
								if(this_old_item > this_new_item) {
									color_diff[layer_nr][this_key][item_nr] = "#cf1443";
								} else if(this_old_item < this_new_item) {
									color_diff[layer_nr][this_key][item_nr] = "#2E8B57";
								}
							}
						} else { // sub array contains more arrays (kernels most probably))
							color_diff[layer_nr][this_key][item_nr] = [];
							for (var kernel_nr = 0; kernel_nr < this_old_item.length; kernel_nr++) {
								try {
									if(this_old_item[kernel_nr] == this_new_item[kernel_nr]) {
										color_diff[layer_nr][this_key][item_nr][kernel_nr] = default_color;
									} else {
										if(this_old_item[kernel_nr] > this_new_item[kernel_nr]) {
											color_diff[layer_nr][this_key][item_nr][kernel_nr] = "#cf1443";
										} else if(this_old_item[kernel_nr] < this_new_item[kernel_nr]) {
											color_diff[layer_nr][this_key][item_nr][kernel_nr] = "#2E8B57";
										}
									}
								} catch (e) {
									wrn(e);
									console.trace();
								}
							}
						}
					}
				}
			}
		}

	}

	return color_diff;
}

async function get_live_tracking_on_batch_end (global_model_name, max_epoch, x_data_json, y_data_json, show_loss, append_to_id) {
	var id = uuidv4();

	/*
	var loss_trace = {
		x: [],
		y: [],
		name: 'loss',
		yaxis: 'y2',
		xaxis: 'x2',
		type: 'scatter'
	};
	*/

	var onBatchEnd = null;

	onBatchEnd = function (epoch, logs) {
		if(typeof(old_onEpochEnd) == "function") {
			old_onEpochEnd(epoch, logs);
		}

		try {
			var current_epoch = epoch + 1;
			if(current_epoch == 1) {
				$(`#${append_to_id}`).html("");
				$(`<div id='${id}_training_data_graph'></div>`).appendTo($(`#${append_to_id}`));
			}

			var real_trace = {
				x: [],
				y: [],
				type: "scatter",
				name: "Ground Truth"
			};

			var predicted_trace = {
				x: [],
				y: [],
				type: "scatter",
				name: "Prediction"
			};

			var x_data = eval(x_data_json);
			var y_data = eval(y_data_json);

			//1) combine the arrays:
			var list = [];
			for (var j = 0; j < x_data.length; j++)
				list.push({"x_data": parse_float(x_data[j][0]), "y_data": parse_float(y_data[j][0])});

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

			for (var i = 0; i < y_data.length; i++) {
				try {
					real_trace.x.push(x_data[i][0]);
					predicted_trace.x.push(x_data[i][0]);

					real_trace.y.push(y_data[i][0]);

					var predict_me = tensor(x_data[i]);
					var predicted_tensor = eval(global_model_name).predict(predict_me);
					var predicted = predicted_tensor.arraySync()[0][0];

					predicted_trace.y.push(predicted);

					dispose(predict_me); // no await possible
					dispose(predicted_tensor); // no await possible
				} catch (e) {
					err(e);
					console.trace();
				}
			}

			var layout = {
				paper_bgcolor: "rgba(0, 0, 0, 0)",
				plot_bgcolor: "rgba(0, 0, 0, 0)",
				gridcolor: "#7c7c7c",
				font: {
					family: "Courier New, monospace",
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

			var data = [real_trace, predicted_trace];

			Plotly.react(`${id}_training_data_graph`, data, layout);  // Use Plotly.react() to update the existing plot
		} catch (e) {
			err(e);
		}
	};

	return onBatchEnd;
}

function least_square (x_array, y_array) {
	assert(x_array.length == y_array.length, "x and y arrays must have the same number of components");
	assert(x_array.length != 0, "x or y cannot be empty");

	var X = 0;
	var Y = 0;

	var n = x_array.length;

	for (var i = 0; i < n; i++) {
		X += x_array[i];
		Y += y_array[i];
	}

	X = X / n;
	Y = Y / n;

	var m_top = 0;
	var m_bottom = 0;

	for (var i = 0; i < n; i++) {
		m_top += ((x_array[i] - X) * (y_array[i] - Y));
		m_bottom += ((x_array[i] - X) ** 2);
	}

	var m = m_top / m_bottom;

	var b = Y - (m * X);

	return [m, b];
}

function array_to_html(array) {
	var m = "";
	for (var i = 0; i < array.length; i++) {
		if(typeof(array[i]) == "object") {
			for (var j = 0; j < array[i].length; j++) {
				m += array[i][j] + " ";
			}
		} else {
			m += array[i];
		}
		m += "<br>";
	}

	return m;
}

function apply_color_map (x) {
	assert(x.rank === 4, `Expected rank-4 tensor input, got rank ${x.rank}`);
	assert(x.shape[0] === 1, `Expected exactly one example, but got ${x.shape[0]} examples`);
	assert(x.shape[3] === 1, `Expected exactly one channel, but got ${x.shape[3]} channels`);

	var res = tidy(() => {
		// Get normalized x.
		const EPSILON = 1e-5;
		const xRange = x.max().sub(x.min());
		const xNorm = x.sub(x.min()).div(xRange.add(EPSILON));
		const xNormData = xNorm.dataSync();

		const h = x.shape[1];
		const w = x.shape[2];
		var _buffer = buffer([1, h, w, 3]);

		const colorMapSize = RGB_COLORMAP.length / 3;
		for (let i = 0; i < h; ++i) {
			for (let j = 0; j < w; ++j) {
				const pixelValue = xNormData[i * w + j];
				const row = Math.floor(pixelValue * colorMapSize);
				_buffer.set(RGB_COLORMAP[3 * row], 0, i, j, 0);
				_buffer.set(RGB_COLORMAP[3 * row + 1], 0, i, j, 1);
				_buffer.set(RGB_COLORMAP[3 * row + 2], 0, i, j, 2);
			}
		}
		return _buffer.toTensor();
	});

	return res;
}

async function grad_class_activation_map(model, x, classIndex, overlayFactor = 2.0) {
	if(started_training) {
		l("Cannot show gradCAM while training");
		return;
	}

	if(!contains_convolution()) {
		l("Cannot continue using gradCAM when you have no convolutional layers");
		return;
	}

	if(is_hidden_or_has_hidden_parent("#grad_cam_heatmap")) {
		l("Not wasting resources on gradCAM when the predict tab is not visible anyways.");
		return;
	}

	try {
		// Try to locate the last conv layer of the model.
		let layerIndex = model.layers.length - 1;
		while (layerIndex >= 0) {
			if (model.layers[layerIndex].getClassName().startsWith("Conv")) {
				break;
			}
			layerIndex--;
		}

		assert(layerIndex >= 0, "Failed to find a convolutional layer in model");

		const lastConvLayer = model.layers[layerIndex];

		// Get "sub-model 1", which goes from the original input to the output
		// of the last convolutional layer.
		const layerOutput = model.getLayer(null, layerIndex).getOutputAt(0);
		const auxModel = tf_model({inputs: model.inputs, outputs: layerOutput});

		// Get "sub-model 2", which goes from the output of the last convolutional
		// layer to the original output.
		const newInput = input({shape: layerOutput.shape.slice(1)});
		layerIndex++;
		let y = newInput;
		while (layerIndex < model.layers.length) {
			y = model.layers[layerIndex++].apply(y);
		}
		const subModel2 = tf_model({inputs: newInput, outputs: y});

		var retval = tidy(() => {
			// This function runs sub-model 2 and extracts the slice of the probability
			// output that corresponds to the desired class.

			const convOutput2ClassOutput = (input) => subModel2.apply(input, {training: true}).gather([classIndex], 1);
			// This is the gradient function of the output corresponding to the desired
			// class with respect to its input (i.e., the output of the last
			// convolutional layer of the original model).
			const gradFunction = grad(convOutput2ClassOutput);

			// Calculate the values of the last conv layer's output.
			const lastConvLayerOutputValues = auxModel.apply(x);
			// Calculate the values of gradients of the class output w.r.t. the output
			// of the last convolutional layer.
			const gradValues = gradFunction(lastConvLayerOutputValues);

			// Pool the gradient values within each filter of the last convolutional
			// layer, resulting in a tensor of shape [numFilters].
			const pooledGradValues = tf_mean(gradValues, [0, 1, 2]);
			// Scale the convlutional layer's output by the pooled gradients, using
			// broadcasting.
			const scaledConvOutputValues =
				lastConvLayerOutputValues.mul(pooledGradValues);

			// Create heat map by averaging and collapsing over all filters.
			let heatMap = scaledConvOutputValues.mean(-1);

			// Discard negative values from the heat map and normalize it to the [0, 1]
			// interval.
			heatMap = heatMap.relu();
			heatMap = heatMap.div(heatMap.max()).expandDims(-1);

			// Up-sample the heat map to the size of the input image.
			heatMap = resizeBilinear(heatMap, [x.shape[1], x.shape[2]]);

			// Apply an RGB colormap on the heatMap. This step is necessary because
			// the heatMap is a 1-channel (grayscale) image. It needs to be converted
			// into a color (RGB) one through this function call.
			heatMap = apply_color_map(heatMap);

			// To form the final output, overlay the color heat map on the input image.
			heatMap = heatMap.mul(overlayFactor).add(x.div(255));
			return heatMap.div(heatMap.max()).mul(255);
		});

		return retval;
	} catch (e) {
		if(("" + e).includes("already disposed")) {
			dbg("Model weights are disposed. Probably the model was recompiled during prediction");
		} else {
			await write_error(e);
		}
		return null;
	}
}

function find_key_by_value(obj, valueToFind, _default=null) {
	try {
		for (const key in obj) {
			if (obj.hasOwnProperty(key)) {
				if (obj[key] === valueToFind) {
					return [1, key]; // Found the key
				}
			}
		}

		return [0, _default];
	} catch (error) {
		err("Error in find_key_by_value: " + error.message); // Log and warn about the error
		return [0, _default]; // Return null to indicate that the key was not found
	}
}

function _create_table_cosmo (pgi, style="") {
	assert(Array.isArray(pgi), "pgi is not an array");
	assert(pgi.length, "pgi is empty");

	//log("_create_table_cosmo(", pgi, style, ")");

	var uuids = [];
	var table = "<table" + (style ? " style= '" + style + "' " : "") + ">";
	table += "<tr>";
	if((pgi.length / labels.length) > 1) {
		table += "<th>Training</th>";
	}

	var labels_arr_str = [];

	for (var i in labels) {
		if(is_numeric(i)) {
			var _label = find_key_by_value(language[lang], labels[i], labels[i]);
			//log("!!! !!! !!! _label:", _label);
			if(labels[0]) {
				labels_arr_str.push(`<span class='TRANSLATEME_${_label[1]}'></span>`);
			} else {
				labels_arr_str.push(`${_label[1]} BB`);
			}
		}
	}

	table += "<th>" + labels_arr_str.join("</th><th>") + "</th>";
	table += "</tr>";

	table += "<tr>";

	for (var i = 0; i < pgi.length; i++) {
		var cell_nr = i % labels.length;
		var line_nr = Math.floor(i / labels.length);

		if (cell_nr == 0) {
			table += "<tr>";

			if((pgi.length / labels.length) > 1) {
				table += "<td>" + (line_nr + 1) + "</td>";
			}
		}

		var elem_uuid = uuidv4(); // Assuming you have a function for generating UUIDs
		/*
		if(Array.isArray(pgi[i])) {
			elem_uuid = pgi[i][1];
		}
		*/
		uuids.push(elem_uuid);
		table += `<td><span id='${elem_uuid}'></span></td>`;

		if (cell_nr == (labels.length - 1)) {
			table += "</tr>";
		}
	}
	table += "</tr>";
	table += "</table>";

	var res = [table, uuids];

	//log(res);

	return res;
}

async function toggle_previous_current_generated_images () {
	if(!$("#current_images").is(":visible")) {
		$("#previous_images_button").html("&#x2190; <span class='TRANSLATEME_previous_images'></span>");
		$("#previous_images").hide();
		$("#current_images").show();
		$(".layer_image").show();
	} else {
		assert(Array.isArray(previously_generated_images), "previously_generated_images should be an array");
		assert(Array.isArray(labels), "labels should be an array");
		assert(labels.length > 0, "labels array should not be empty");

		var last_cell_nr = 0;
		var last_line_nr = 0;

		var table_and_uuids = _create_table_cosmo(previously_generated_images);

		var table = table_and_uuids[0];
		var uuids = table_and_uuids[1];

		$(".layer_image").hide();

		$("#previous_images").html(table);

		for (var i = 0; i < previously_generated_images.length; i++) {
			var _prev = previously_generated_images[i];

			//log("Appending ", _prev, " to ", $("#" + uuids[i]), "#" + uuids[i]);

			$("#" + uuids[i]).append(_prev);
			$("#" + uuids[i]).find("canvas").css("width", "170px").css("height", "170px").css("image-rendering", "crisp-edges");
		}

		$("#previous_images_button").html("<span class='TRANSLATEME_current_images'></span> &#x2192;");
		$("#current_images").hide();
		$("#previous_images").show();
	}

	await update_translations();

	fit_to_window(); // await not possible
}

var already_moved_to_predict_for_cosmo = false;

async function cosmo_maximally_activate_last_layer () {
	generating_images = true;

	if($(".layer_image").length) {
		var $layer_images = $(".layer_image");

		for (var i = 0; i < $layer_images.length; i++) {
			var li = $layer_images[i];

			var clone = clone_canvas(li);

			previously_generated_images.push(clone);
		}

		await fit_to_window();
	} else {
		log("No previous layers found");
	}

	$("#maximally_activated_content").html("");

	if(!already_moved_to_predict_for_cosmo) {
		move_element_to_another_div($("#maximally_activated_content")[0], $("#cosmo_visualize_last_layer")[0]);
		already_moved_to_predict_for_cosmo = true;
	}

	await fit_to_window();

	//$("#cosmo_visualize_last_layer").html("");
	var lt = get_layer_type_array();

	var canvasses = await draw_maximally_activated_layer(lt.length - 1, lt[lt.length - 1]);

	await nextFrame();

	await fit_to_window();

	var example_image_width = $($(".layer_image")[0]).width();

	var style_internal = `width: ${example_image_width + 65}px;`;
	var style = ` class='cosmo_labels_above_generated_images' style='${style_internal}' `;

	var table_and_uuids = _create_table_cosmo(canvasses, "display:initial");

	var table = table_and_uuids[0];
	var table_uuids = table_and_uuids[1];

	console.log("table_and_uuids MAIN", table_and_uuids, "canvasses:", canvasses);

	$(".h2_maximally_activated_layer_contents").html(`
		<hr class='cosmo_hr'>
		<div id='previous_images_button' style='display: none' class='green_bg cosmo_button'>&#x2190; <span class='TRANSLATEME_previous_images'></span></div>

		<span id='current_images'>
			<span class='TRANSLATEME_the_ai_thinks_categories_look_like_this'></span>:
			<br><br>
			${table}
		</span>
		<span id='previous_images' style='display:none'>
		</span>
	`);

	for (var i = 0; i < canvasses.length; i++) {
		var _prev = canvasses[i][0];
		$("#" + table_uuids[i]).
			append(_prev).
			find("canvas").
			css("width", "170px").
			css("height", "170px").
			css("image-rendering", "crisp-edges").
			css("margin-right", "65px").
			css("margin-left", "65px");
	}

	if(previously_generated_images.length) {
		$("#previous_images_button").show();
	}

	$("#previous_images_button").on("click", toggle_previous_current_generated_images);

	await update_translations();
	await fit_to_window();

	var ep = get_epochs();

	var images_in_total = parse_int($("#max_number_of_files_per_category").val()) * labels.length;
	var nr_epochs = get_epochs();

	var str = `<span class="TRANSLATEME_click_on"></span> <button class="green_bg cosmo_button cosmo" data-required_skills="loaded_page[1],watched_presentation[1],finished_training[1]" data-dont_hide_after_show="1" data-keep_cosmo="1" id="webcam_in_cosmo" onclick="switch_predict_mode()"><span class='TRANSLATEME_camera_draw_self'></span> 📷</button> <span id='warnschild_oder_zurueck'>${language[lang]["and_try_to_draw_a_warning_sign"]}</span>.<hr class='cosmo_hr'><span class='TRANSLATEME_if_bad_continue_training'></span><br>`;

	if(current_cosmo_stage == 1) {
		$(".h2_maximally_activated_layer_contents").before(`<span class='TRANSLATEME_the_training_was_only_with'></span> ${images_in_total} <span class='TRANSLATEME_images_and'></span> ${nr_epochs} <span class='TRANSLATEME_epochs_done'></span>.<br><span class='it_might_only_be_noise'></span><hr class="cosmo_hr">${str}`);
		await update_translations();
	} else {
		$(".h2_maximally_activated_layer_contents").before(str);
	}

	$(".layer_image").css("width", "170px").css("margin-top", "30px").css("margin-left", "65px").css("margin-right", "65px").css("margin-bottom", "0px").addClass("layer_image");

	generating_images = false;

	await chose_next_manicule_target();

	await update_translations();

	//$("#__tmp__prev_generated").remove();
}

async function _temml () {
	while ($("#temml_blocker").length) {
		await delay(200);
	}

	try {
		$("<span display='style:none' id='temml_blocker'></span>").appendTo($("body"));
		$(".temml_me").each((i, e) => {
			if($(e).attr("data-rendered") != 1 && $(e).is(":visible") && e.textContent) {
				var original_latex = e.textContent;

				$(e)[0].innerHTML = "<img src='_gui/loading_favicon.gif' />";

				var tmp_element = $("<span id='tmp_equation' style='display: none'></span>");
				$(tmp_element).appendTo($(body));

				temml.render(original_latex, tmp_element[0]);

				$(e)[0].innerHTML = tmp_element[0].innerHTML;
				$(e).attr("data-rendered", 1);
				$(e).attr("data-latex", original_latex);

				$("#tmp_equation").remove();

				$(e).on("contextmenu", function(ev) {
					ev.preventDefault();
					create_centered_window_with_text(original_latex);
				});
			}
		});
	} catch (e) {
		wrn("" + e);
	}
	$("#temml_blocker").remove();
}

function arbitrary_array_to_latex (arr) {
	var latex = _arbitrary_array_to_latex(arr);
	var res = "<span class='temml_me'>" + latex + "</span>";
	return res;
}

function _arbitrary_array_to_latex (arr) {
	var str = "";
	if(typeof(arr) == "number") {
		return arr;
	} else if (typeof(arr) == "string") {
		return `\\textrm{${arr}}`;
	} else if (typeof(arr) == "object") {
		if(Array.isArray(arr)) {
			str += "\\begin{pmatrix}\n";

			var str_array = [];

			var shape = get_shape_from_array(arr);

			var line_end_marker = " \\\\\n ";
			var cell_end_marker = " & ";

			if(shape.length == 1) {
				for (var i in arr) {
					var item = arr[i];
					str_array.push(_arbitrary_array_to_latex(item));
				}

				str += str_array.join(line_end_marker);
			} else if (shape.length == 2) {
				for (var i in arr) {
					var line_array = [];
					for (var j in arr[i]) {
						var item = arr[i][j];
						var res = _arbitrary_array_to_latex(item);
						if(res !== undefined && res !== null && !res.toString().match(/^\s*$/)) {
							line_array.push(res);
						}
					}

					str_array.push(line_array.join(cell_end_marker));
				}

				str += str_array.join(line_end_marker);
			} else {
				for (var i in arr) {
					var item = arr[i];
					str_array.push(_arbitrary_array_to_latex(item));
				}

				str += str_array.join(line_end_marker);
			}

			str += "\\end{pmatrix}\n";
		} else {
			log("OBJECTs NOT IMPLEMENTED YET");
		}
	} else if (typeof(arr) == "function") {
		//log("_arbitrary_array_to_latex was called with function argument");
		//console.trace();
	} else {
		wrn("Unknown type: " + typeof(arr));
	}
	return str;
}

/*
log("1 = ", _arbitrary_array_to_latex(1));
log("[1, 1]", _arbitrary_array_to_latex([1, 1]));
log("[[1, 2], [3, 4]]", _arbitrary_array_to_latex([[1,2],[3,4]]));
log("[[[1, 2], [3, 4], [5, 6], [1, 2], [3, 4], [5, 6]]]", _arbitrary_array_to_latex([[[1,2],[3,4], [5,6],[1, 2], [3, 4], [5, 6]]]));
log("[[[1, 2], [3, 4], [5, 6]], [[1, 2], [3, 4], [5, 6]]]", _arbitrary_array_to_latex([[[[1,2],[3,4], [5,6]],[[1, 2], [3, 4], [5, 6]]]]));
*/

function array_to_ellipsis_latex (x, limit) {
	var _shape = get_shape_from_array(x);

	if(_shape.length == 1) {
		return x[0];
	} else if(_shape.length == 2) {
		return array_to_latex(_array_to_ellipsis_latex(x, limit));
	} else {
		var sub_arrays = [];
		for (var _item = 0; _item < _shape[0]; _item++) {
			sub_arrays.push(array_to_ellipsis_latex(x[_item], limit));
		}

		var str = '\\begin{pmatrix}';
		for (var k = 0; k < sub_arrays.length; k++) {
			str += sub_arrays[k];
		}

		str += '\\end{pmatrix}';

		return str;
	}
}

function _array_to_ellipsis_latex (x, limit) {
	var _new = [];

	var last_line_was_ellipsis = 0;
	for (var i = 0; i < x.length; i++) {
		if(i < limit || i >= (x.length - limit)) {
			_new.push(x[i]);
			last_line_was_ellipsis = 0;
		} else {
			if(!last_line_was_ellipsis) {
				var _item = [];
				for (var j = 0; j < x[i].length; j++) {
					_item.push("\\vdots");
				}
				_new.push(_item);
				last_line_was_ellipsis = 1;
			}
		}
	}

	var new_two = [];

	for (var i = 0; i < _new.length; i++) {
		var new_element = [];
		var last_element_was_ellipsis = 0;
		for (var j = 0; j < _new[i].length; j++) {
			if(j < limit || j >= (_new[i].length - limit)) {
				new_element.push(_new[i][j]);
				last_element_was_ellipsis = 0;
			} else {
				if(!last_element_was_ellipsis) {
					new_element.push("\\cdots");
					last_element_was_ellipsis = 1;
				}
			}
		}

		new_two.push(new_element);
	}

	log("new_two:", new_two);

	return new_two;
}
