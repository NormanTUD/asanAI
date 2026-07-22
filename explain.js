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

	var min = Math.min(...numberArray);
	var max = Math.max(...numberArray);

	for (var numberArray_idx = 0; numberArray_idx < numberArray.length; numberArray_idx++) {
		var value = numberArray[numberArray_idx];
		var grayscaleValue = normalize_to_rgb_min_max(value, min, max);
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
		return 0;
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
		_uuid_str = " class='generated_canvas' id='" + _uuid + "'";
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

function draw_grid_grayscale (canvas, pixel_size, colors, pos) {
	var _width = colors[0].length;
	var _height = colors.length;

	canvas.width = _width * pixel_size;
	canvas.height = _height * pixel_size;

	var ctx = canvas.getContext("2d");
	var img = ctx.createImageData(_width, _height);
	var data = img.data;

	var min = Infinity;
	var max = -Infinity;

	// finde min/max
	for (var j = 0; j < _height; j++) {
		for (var i = 0; i < _width; i++) {
			var val = colors[j][i][pos];
			if (val < min) min = val;
			if (val > max) max = val;
		}
	}

	// fülle ImageData
	for (let j = 0; j < _height; j++) {
		for (let i = 0; i < _width; i++) {
			let val = normalize_to_rgb_min_max(colors[j][i][pos], min, max);
			let idx = (j * _width + i) * 4;
			data[idx] = val;
			data[idx + 1] = val;
			data[idx + 2] = val;
			data[idx + 3] = 255;
		}
	}

	// skaliere auf pixel_size
	var tmpCanvas = document.createElement("canvas");
	tmpCanvas.width = _width;
	tmpCanvas.height = _height;
	tmpCanvas.getContext("2d").putImageData(img, 0, 0);

	ctx.imageSmoothingEnabled = false; // wichtig, sonst wird interpoliert
	ctx.drawImage(tmpCanvas, 0, 0, canvas.width, canvas.height);

	return true;
}

function draw_grid(canvas, pixel_size, colors, denormalize, black_and_white, onclick, multiply_by, data_hash, _class="") {
	assert(typeof(pixel_size) == "number", "pixel_size must be of type number, is " + typeof(pixel_size));
	if (!multiply_by) multiply_by = 1;

	var drew_something = false;
	var _height = colors.length;
	var _width = colors[0].length;

	$(canvas).attr("width", _width * pixel_size);
	$(canvas).attr("height", _height * pixel_size);
	if (_class) $(canvas).attr("class", _class);

	if (typeof(data_hash) == "object") {
		for (let name in data_hash) {
			$(canvas).data(name, data_hash[name]);
		}
	}

	if (onclick) $(canvas).attr("onclick", onclick);

	var ctx = $(canvas)[0].getContext("2d");
	var img = ctx.createImageData(_width, _height);
	var data = img.data;

	var min = 0;
	var max = 0;

	if (denormalize) {
		for (var j = 0; j < _height; j++) {
			for (var i = 0; i < _width; i++) {
				var red, green, blue;

				if (black_and_white) {
					red = green = blue = colors[j][i];
				} else {
					red = colors[j][i][0];
					green = colors[j][i][1];
					blue = colors[j][i][2];
				}

				if (red > max) max = red;
				if (green > max) max = green;
				if (blue > max) max = blue;

				if (red < min) min = red;
				if (green < min) min = green;
				if (blue < min) min = blue;
			}
		}
	}

	for (let j = 0; j < _height; j++) {
		for (let i = 0; i < _width; i++) {
			let red, green, blue;

			if (black_and_white) {
				red = green = blue = colors[j][i] * multiply_by;
			} else {
				red = colors[j][i][0] * multiply_by;
				green = colors[j][i][1] * multiply_by;
				blue = colors[j][i][2] * multiply_by;
			}

			if (denormalize) {
				if (red !== undefined) red = normalize_to_rgb_min_max(red, min, max);
				if (green !== undefined) green = normalize_to_rgb_min_max(green, min, max);
				if (blue !== undefined) blue = normalize_to_rgb_min_max(blue, min, max);
			}

			var idx = (j * _width + i) * 4;
			data[idx] = red;
			data[idx + 1] = green;
			data[idx + 2] = blue;
			data[idx + 3] = 255;

			drew_something = true;
		}
	}

	// einmaliges Scaling auf pixel_size
	var tmpCanvas = document.createElement("canvas");
	tmpCanvas.width = _width;
	tmpCanvas.height = _height;
	tmpCanvas.getContext("2d").putImageData(img, 0, 0);

	ctx.imageSmoothingEnabled = false;
	ctx.drawImage(tmpCanvas, 0, 0, _width * pixel_size, _height * pixel_size);

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
				context.fillStyle = `rgb(${r}, ${g}, ${b})`;
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
				context.fillStyle = `rgb(${grayscaleValue}, ${grayscaleValue}, ${grayscaleValue})`;
				context.fillRect(j * rescaleFactor, i * rescaleFactor, rescaleFactor, rescaleFactor);
			}
		}
	}
}

function draw_image_if_possible (layer, canvas_type, colors, get_canvas_object) {
	var canvas = null;

	try {
		var ret = false;

		if(!colors || !Array.isArray(colors) || colors.length == 0) {
			return false;
		}

		// Guard: wenn es ein 2D-Array ist (z.B. Dense kernel), nicht als Bild zeichnen
		if(canvas_type == "kernel" && Array.isArray(colors) && colors.length > 0 && !Array.isArray(colors[0][0])) {
			return false;
		}

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
			let shape = get_dim(colors);

			let canvasses = [];

			for (let k = 0; k < shape[2]; k++) {
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

function recurse(a, dims) {
	if (dims.length === 1) return a;

	const [first, ...rest] = dims;
	const result = Array.from({ length: dims[dims.length - 1] }, (_, i) =>
		recurse(a.map(row => row[i]), rest)
	);
	return result;
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

	var nr_of_layer = model?.layers?.length;
	if(!nr_of_layer) {
		return "";
	}

	if(model && model?.layers && nr_of_layer) {
		var last_layer_name = model?.layers[nr_of_layer - 1]?.name;
		if(_err.includes(last_layer_name) && _err.includes("Error when checking target") && _err.includes("but got array with shape")) {
			explanation = "This may mean that the number of neurons in the last layer do not conform with the data structure in the training-data-outputs.";
		} else if(_err.includes("does not match the shape of the rest")) {
			explanation = "Have you repeatedly pressed 'Start training'? The second one may have started while the first one was not ready, and re-downloaded images. Please reload the page.";
		} else if(_err.includes("Failed to compile fragment shader")) {
			explanation = "This may mean that the batch-size and/or filter-size and/or image dimension resize-sizes are too large, or your GPU memory is too low. Try disabling GPU acceleration (see General -> CPU instead of WebGL).";
		} else if(_err.includes("target expected a batch of elements where each example")) {
			explanation = "The last number of neurons in the last layer may not match the number of categories.<br><br>It may also be possible that you chose a wrong Loss function. If the number of neurons match, try choosing other losses, like categoricalCrossentropy, or the last layer's activation function is wrong, for classification problems it should be SoftMax.<br><br>You may also have only one category, but you need at least two.";
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
			explanation = "This is probably a bug in asanAI";
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

	var nr_of_layer = model?.layers?.length;
	if(!nr_of_layer) {
		return "";
	}

	if(!nr_of_layer) {
		return "";
	}

	if(layer_idx >= nr_of_layer) {
		return "";
	}

	if(model?.layers[layer_idx] && Object.keys(model?.layers[layer_idx]).length >= 1) {
		var object_keys = Object.keys(model?.layers[layer_idx]);
		var new_str = "";

		if(object_keys.includes("filters") && object_keys.includes("kernelSize")) {
			new_str = model?.layers[layer_idx]["filters"] + "@" + model?.layers[layer_idx].kernelSize.join("x");

		} else if(object_keys.includes("filters")) {
			new_str = "Filters:&nbsp;" + model?.layers[layer_idx]["filters"];

		} else if(object_keys.includes("units")) {
			new_str = "Units:&nbsp;" + model?.layers[layer_idx]["units"];

		} else if(object_keys.includes("rate")) {
			new_str = "Rate:&nbsp;" + model?.layers[layer_idx]["rate"];

		} else if(object_keys.includes("poolSize")) {
			new_str = model?.layers[layer_idx]?.poolSize.join("x");
		}

		return new_str;
	}

	return "";
}

async function fetchLayerShapeStatus (layer_idx, output_shape_string, has_zero_output_shape) {
	if(model && model?.layers && model?.layers?.length >= layer_idx) {
		try {
			model?.layers[layer_idx]?.input.shape;
		} catch(e) {
			void(0); dbg("Model has multi-node inputs. It should not have!!! Continuing anyway, but please, debug this!!!");
		}

		if (model && model?.layers && layer_idx in model?.layers) {
			const this_layer = model?.layers[layer_idx];

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
	} else {
		enable_train();
	}

	return [output_shape_string, has_zero_output_shape];
}

async function identify_layers () {
	var number_of_layers = $("div.container.layer").length;

	if(!model) {
		dbg(language[lang]["no_model_defined"]);
		return;
	}

	if(!Object.keys(model).includes("layers") || !model?.layers?.length) {
		dbg(language[lang]["the_loaded_model_has_no_layers"]);
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
			if(model && model?.layers && layer_idx in model?.layers) {
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

function _add_layer_debugger_hook (layer_idx) {
	if(get_methods(model?.layers[layer_idx]).includes("original_apply_real")) {
		model.layers[layer_idx].apply = model.layers[layer_idx].original_apply_real;
	}

	model.layers[layer_idx].original_apply_real = model.layers[layer_idx].apply;

	var code = `model.layers[${layer_idx}].apply = function (inputs, kwargs) {
		if (${layer_idx} == 0) {
			layer_states_saved = {}
		}

		var output = model?.layers[${layer_idx}]?.original_apply_real(inputs, kwargs);

		var shown_layer_debuggers = false;

		if(!disable_layer_debuggers) {
			if($("#show_layer_data").is(":checked")) {
				$("#layer_visualizations_tab").show();
				draw_internal_states(${layer_idx}, inputs, output);
				shown_layer_debuggers = true;
			}
		}

		if(!shown_layer_debuggers) {
			$("#layer_visualizations_tab").hide();
		}

		const synced_output = array_sync(output);

		const synced_input = array_sync(inputs[0]);

		var this_layer_data = {
			input: synced_input,
			output: synced_output,
			model_uuid: model.uuid
		};

		layer_states_saved["${layer_idx}"] = this_layer_data;

		if(started_training) {
			if(!Object.keys(neuron_outputs).includes("${layer_idx}")) {
				neuron_outputs["${layer_idx}"] = {input: [], output: []};
			}

			neuron_outputs["${layer_idx}"]["input"].push(synced_input);
			neuron_outputs["${layer_idx}"]["output"].push(synced_output);
		}

		return output;
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

async function add_layer_debuggers () {
	$("#datalayers").html("");

	$(".layer_data").html("");

	if(!model) {
		if(finished_loading) {
			dbg(language[lang]["no_model_found"]);
		}

		return;
	}

	if(!model?.layers) {
		if(finished_loading) {
			dbg(language[lang]["no_layers_found"]);
		}
	}

	try {
		if(!model) {
			return;
		}

		if(!model?.layers) {
			return;
		}

		var nr_of_layer = model?.layers?.length;
		if(!nr_of_layer) {
			return;
		}

		for (var layer_idx = 0; layer_idx < nr_of_layer; layer_idx++) {
			_add_layer_debugger_hook(layer_idx);
		}
	} catch (e) {
		err(e);
	}

	if(!input_shape_is_image()) {
		await predict_own_data_and_repredict();
	}
}

function show_and_append_layer_divs (layer_div, layer) {
	if(!layer_div) {
		err(`[show_and_append_layer_divs] layer_div was falsy`);
		return;
	}

	try {
		layer_div.show();
		layer_div.append("<div class='data_flow_visualization input_layer_header' style='display: none' id='layer_" + layer + "_input'><h4>Input:</h4></div>");
		layer_div.append("<div class='data_flow_visualization weight_matrix_header' style='display: none' id='layer_" + layer + "_kernel'><h4>" + language[lang]["weight_matrices"] + ":</h4></div>");
		layer_div.append("<div class='data_flow_visualization output_header' style='display: none' id='layer_" + layer + "_output'><h4>Output:</h4></div>");
		layer_div.append("<div class='data_flow_visualization equations_header' style='display: none' id='layer_" + layer + "_equations'></div>");
	} catch (e) {
		err(`[show_and_append_layer_divs] ${e}`);
	}
}

function show_intermediate_representations(canvas_input, canvas_output, canvas_kernel, input, kernel, output, layer) {
	if(!canvas_input) {
		err(`[show_intermediate_representations] canvas_input was empty`);
		return;
	}

	if(!canvas_kernel) {
		err(`[show_intermediate_representations] canvas_kernel was empty`);
		return;
	}

	if(!canvas_output) {
		err(`[show_intermediate_representations] canvas_output was empty`);
		return;
	}

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

	if($(".layer_data").length != get_number_of_layers()) {
		var inner_html = "";
		for (var layer_idx = 0; layer_idx < get_number_of_layers(); layer_idx++) {
			inner_html += "<div class='layer_data'></div>";
		}

		$("#layer_visualizations_tab").html(inner_html);
	}

	for (var batchnr = 0; batchnr < number_of_items_in_this_batch; batchnr++) {
		var input_data = array_sync(inputs[0])[batchnr];
		var output_data = array_sync(applied)[batchnr];

		var layer_div = $($(".layer_data")[layer]);
		if(batchnr == 0) {
			layer_div.append("<h1>Layer data flow</h1>");
		}

		layer_div.html("<h3 class=\"data_flow_visualization layer_header\">Layer " + layer + " &mdash; " + $($(".layer_type")[layer]).val() + " " + get_layer_identification(layer) + "</h3>").hide();

		show_and_append_layer_divs(layer_div, layer);

		var input = $("#layer_" + layer + "_input");
		var kernel = $("#layer_" + layer + "_kernel");
		var output = $("#layer_" + layer + "_output");
		var equations = $("#layer_" + layer + "_equations");

		show_layer_visualization_tab();

		var kernel_data = [];

		if(Object.keys(model?.layers[layer]).includes("kernel")) {
			if(model?.layers[layer]?.kernel?.val?.shape?.length == 4) {
				var ks_x = 0;
				var ks_y = 1;
				var number_filters = 2;
				var filters = 3;

				kernel_data = tidy(() => {
					return array_sync(tf_transpose(model?.layers[layer]?.kernel?.val, [filters, ks_x, ks_y, number_filters]));
				});
			} else if(model?.layers[layer]?.kernel?.val?.shape?.length == 2) {
				kernel_data = tidy(() => {
					return array_sync(model?.layers[layer]?.kernel?.val);
				});
			}
		}

		var canvas_input = draw_image_if_possible(layer, "input", input_data, 1);
		var canvas_kernel = draw_image_if_possible(layer, "kernel", kernel_data, 1);
		var canvas_output = draw_image_if_possible(layer, "output", output_data, 1);

		// Fallback für Dense-Layer: Gewichtungsmatrix bunt visualisieren (transponiert)
		if(!canvas_kernel && kernel_data.length && model?.layers[layer]?.kernel?.val?.shape?.length == 2) {
			// Transponiert: Breite = input_units, Höhe = output_units
			var k_original_height = kernel_data.length;        // input_units
			var k_original_width = kernel_data[0].length;      // output_units

			var k_width = k_original_height;   // input_units -> Breite
			var k_height = k_original_width;   // output_units -> Höhe

			var k_pixel_size = Math.max(1, Math.min(12, Math.floor(400 / Math.max(k_height, k_width))));
			// Mindestgröße damit man was sieht
			if(k_pixel_size * k_width < 80) {
				k_pixel_size = Math.max(1, Math.ceil(80 / k_width));
			}

			var kernel_canvas = document.createElement("canvas");
			kernel_canvas.width = k_width * k_pixel_size;
			kernel_canvas.height = k_height * k_pixel_size;

			var k_ctx = kernel_canvas.getContext("2d");

			// Alle Werte sammeln
			var all_vals = [];
			for(var ki = 0; ki < k_original_height; ki++) {
				for(var kj = 0; kj < k_original_width; kj++) {
					all_vals.push(kernel_data[ki][kj]);
				}
			}

			// Standardabweichung berechnen
			var k_mean = 0;
			for(var vi = 0; vi < all_vals.length; vi++) {
				k_mean += all_vals[vi];
			}
			k_mean /= all_vals.length;

			var k_variance = 0;
			for(var vi = 0; vi < all_vals.length; vi++) {
				k_variance += (all_vals[vi] - k_mean) * (all_vals[vi] - k_mean);
			}
			k_variance /= all_vals.length;
			var k_std = Math.sqrt(k_variance);

			// Symmetrisches Clipping um 0: ±2*std
			var k_clip = Math.max(k_std * 2, 1e-7);

			// Pixel zeichnen (transponiert + divergierende Farbskala)
			var tmpCanvas = document.createElement("canvas");
			tmpCanvas.width = k_width;
			tmpCanvas.height = k_height;
			var tmpCtx = tmpCanvas.getContext("2d");
			var imgData = tmpCtx.createImageData(k_width, k_height);

			for(var kj = 0; kj < k_original_width; kj++) {       // output neuron -> Zeile im Bild
				for(var ki = 0; ki < k_original_height; ki++) {   // input neuron -> Spalte im Bild
					var raw_val = kernel_data[ki][kj];
					// Auf [-1, 1] normalisieren (symmetrisch um 0)
					var normalized = raw_val / k_clip;
					normalized = Math.max(-1, Math.min(1, normalized));

					// Divergierende Farbskala: blau (-1) -> weiß (0) -> rot (+1)
					var r, g, b;
					if(normalized < 0) {
						var t = 1 + normalized; // 0 bei -1, 1 bei 0
						r = Math.round(20 + 235 * t);
						g = Math.round(60 + 195 * t);
						b = Math.round(220 + 35 * t);
					} else {
						var t = normalized;
						r = 255;
						g = Math.round(255 - 210 * t);
						b = Math.round(255 - 230 * t);
					}

					var idx = (kj * k_width + ki) * 4;
					imgData.data[idx] = r;
					imgData.data[idx + 1] = g;
					imgData.data[idx + 2] = b;
					imgData.data[idx + 3] = 255;
				}
			}

			tmpCtx.putImageData(imgData, 0, 0);
			k_ctx.imageSmoothingEnabled = false;
			k_ctx.drawImage(tmpCanvas, 0, 0, kernel_canvas.width, kernel_canvas.height);

			kernel.append(kernel_canvas).show();
			canvas_kernel = [];
		}

		if(canvas_output.length && canvas_input.length) {
			[input, kernel, output] = show_intermediate_representations(canvas_input, canvas_output, canvas_kernel, input, kernel, output, layer);
		} else if (canvas_output.length && canvas_input.nodeName == "CANVAS") {
			[input, kernel, output] = visualize_layer_canvases_simple(canvas_input, canvas_kernel, canvas_output, input, kernel, output, layer);
		} else {
			[input, output, equations] = show_layer_state_or_data(canvas_input, canvas_output, output_data, input, output, equations, layer);
		}
	}

	if(number_of_items_in_this_batch) {
		$("#layer_visualizations_tab").show();
	} else {
		$("#layer_visualizations_tab").hide();
	}
}

function show_layer_state_or_data (canvas_input, canvas_output, output_data, input, output, equations, layer) {
	if(canvas_input.nodeName == "CANVAS") {
		if(layer == 0) {
			input.append(canvas_input).show();
		}
		if(canvas_output.nodeName == "CANVAS") {
			let img_output = canvas_output;
			output.append(img_output).show();
		}
	} else {
		if(get_shape_from_array(output_data).length == 1 && !$("#show_raw_data").is(":checked")) {
			let h = visualizeNumbersOnCanvas(output_data);
			equations.append(h).show();
		} else {
			let h = array_to_html(output_data);
			equations.append(h).show();
		}
	}

	return [input, output, equations];
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
			if(!document.getElementById(`${id}_training_data_graph`)) {
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
			yaxis: {
				title: "predicted vs. real data",
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

function _viz_bends_apply_activation(val, name) {
	switch (name.toLowerCase()) {
		case 'relu': return Math.max(0, val);
		case 'sigmoid': return 1 / (1 + Math.exp(-val));
		case 'tanh': return Math.tanh(val);
		case 'leakyrelu': return val >= 0 ? val : 0.01 * val;
		case 'elu': return val >= 0 ? val : Math.exp(val) - 1;
		case 'softplus': return Math.log(1 + Math.exp(val));
		default: return val;
	}
}

function _viz_bends_is_bend_activation(name) {
	const n = name.toLowerCase();
	return n === 'relu' || n === 'leakyrelu';
}

function _viz_bends_forward_pass(layerData, x) {
	let currentInput = [x];
	for (let l = 0; l < layerData.length; l++) {
		const { kernel, bias, units, inputDim, actName } = layerData[l];
		const output = new Array(units);
		for (let j = 0; j < units; j++) {
			let sum = bias[j];
			for (let i = 0; i < inputDim; i++) {
				sum += currentInput[i] * kernel[i * units + j];
			}
			output[j] = _viz_bends_apply_activation(sum, actName);
		}
		currentInput = output;
	}
	return currentInput[0];
}

function _viz_bends_get_pre_activations(layerData, x) {
	let currentInput = [x];
	const allPre = [];

	for (let l = 0; l < layerData.length; l++) {
		const { kernel, bias, units, inputDim, actName } = layerData[l];
		const preAct = new Array(units);
		const postAct = new Array(units);

		for (let j = 0; j < units; j++) {
			let sum = bias[j];
			for (let i = 0; i < inputDim; i++) {
				sum += currentInput[i] * kernel[i * units + j];
			}
			preAct[j] = sum;
			postAct[j] = _viz_bends_apply_activation(sum, actName);
		}

		allPre.push(preAct);
		currentInput = postAct;
	}

	return allPre;
}

async function _viz_bends_extract_layer_data(model) {
	const layerData = [];
	for (let l = 0; l < model.layers.length; l++) {
		const layer = model.layers[l];
		const weights = layer.getWeights();
		if (!weights || weights.length < 2) continue;
		const [kernelTensor, biasTensor] = weights;
		const kernel = await kernelTensor.data();
		const bias = await biasTensor.data();
		const actName = layer.activation?.getClassName?.() || 'linear';

		const units = layer.units;
		const inputDim = kernel.length / units;

		layerData.push({ kernel, bias, units, inputDim, actName });
	}
	return layerData;
}

function _viz_bends_compute_x_range(layerData, dataXMin, dataXMax) {
	let xMin, xMax;

	if (dataXMin !== null && dataXMax !== null) {
		const dataRange = Math.max(dataXMax - dataXMin, 1);
		xMin = dataXMin - dataRange * 0.15;
		xMax = dataXMax + dataRange * 0.15;
	} else {
		const firstLayerData = layerData[0];
		let knotPoints = [];
		for (let j = 0; j < firstLayerData.units; j++) {
			const w = firstLayerData.kernel[j];
			const b = firstLayerData.bias[j];
			if (Math.abs(w) > 1e-8) {
				knotPoints.push(-b / w);
			}
		}

		if (knotPoints.length > 0) {
			const kMin = Math.min(...knotPoints);
			const kMax = Math.max(...knotPoints);
			const range = Math.max(kMax - kMin, 1);
			xMin = kMin - range * 0.7;
			xMax = kMax + range * 0.7;
		} else {
			xMin = -5;
			xMax = 5;
		}
	}

	return { xMin, xMax };
}

function _viz_bends_detect_bend_points(layerData, xs, combinedY, xMin, xMax, hasBendActivations) {
	let bendResults = [];

	if (hasBendActivations) {
		const scanResolution = 5000;
		const scanStep = (xMax - xMin) / scanResolution;

		let prevPre = _viz_bends_get_pre_activations(layerData, xMin);

		for (let i = 1; i <= scanResolution; i++) {
			const x = xMin + scanStep * i;
			const currPre = _viz_bends_get_pre_activations(layerData, x);

			for (let l = 0; l < layerData.length; l++) {
				if (!_viz_bends_is_bend_activation(layerData[l].actName)) continue;

				for (let j = 0; j < layerData[l].units; j++) {
					const pPre = prevPre[l][j];
					const cPre = currPre[l][j];

				if (pPre * cPre >= 0) continue;
				const t = Math.abs(pPre) / (Math.abs(pPre) + Math.abs(cPre));
				const bendX = (x - scanStep) + t * scanStep;
				bendResults.push({ x: bendX, layer: l, neuron: j });
				}
			}

			prevPre = currPre;
		}

		bendResults.sort((a, b) => a.x - b.x);
		const deduped = [];
		for (const bp of bendResults) {
			if (deduped.length === 0 ||
				Math.abs(bp.x - deduped[deduped.length - 1].x) > (xMax - xMin) * 0.0005) {
				deduped.push(bp);
			}
		}
		bendResults = deduped;
	}

	if (!hasBendActivations) {
		const slopes = [];
		for (let i = 0; i < xs.length - 1; i++) {
			slopes.push((combinedY[i + 1] - combinedY[i]) / (xs[i + 1] - xs[i]));
		}
		const curvatureBends = [];
		for (let i = 0; i < slopes.length - 1; i++) {
			const d2 = Math.abs(slopes[i + 1] - slopes[i]);
			curvatureBends.push({ idx: i + 1, curvature: d2 });
		}
		curvatureBends.sort((a, b) => b.curvature - a.curvature);
		const threshold = curvatureBends.length > 0 ? curvatureBends[0].curvature * 0.1 : 0;
		for (const cb of curvatureBends.slice(0, 20)) {
			if (cb.curvature > threshold) {
				bendResults.push({
					x: xs[cb.idx],
					layer: -1,
					neuron: -1,
				});
			}
		}
		bendResults.sort((a, b) => a.x - b.x);
		const deduped2 = [];
		for (const bp of bendResults) {
			if (deduped2.length === 0 ||
				Math.abs(bp.x - deduped2[deduped2.length - 1].x) > (xMax - xMin) * 0.01) {
				deduped2.push(bp);
			}
		}
		bendResults = deduped2;
	}

	return bendResults;
}

function _viz_bends_hsl_to_rgb(h, s, l) {
	s /= 100; l /= 100;
	const k = n => (n + h / 30) % 12;
	const a = s * Math.min(l, 1 - l);
	const f = n => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
	return `rgb(${Math.round(f(0)*255)},${Math.round(f(8)*255)},${Math.round(f(4)*255)})`;
}

function _viz_bends_build_traces(xs, combinedY, dataPoints, layerData, bendResults) {
	const traces = [];

	if (dataPoints) {
		traces.push({
			x: dataPoints.xs,
			y: dataPoints.ys,
			mode: 'markers',
			name: 'Training Data',
			marker: {
				color: 'rgba(255, 255, 255, 0.8)',
				size: 7,
				symbol: 'circle',
				line: { color: 'rgba(100, 100, 255, 0.9)', width: 1.5 }
			},
			hovertemplate: 'x: %{x}<br>y: %{y}<extra>Data</extra>',
		});
	}

	if (layerData.length === 2) {
		const layer1 = layerData[0];
		const layer2 = layerData[1];

		for (let j = 0; j < layer1.units; j++) {
			const w1 = layer1.kernel[j];
			const b1 = layer1.bias[j];
			const w2 = layer2.kernel[j];

			const ys = xs.map(x => {
				const preAct = w1 * x + b1;
				const postAct = _viz_bends_apply_activation(preAct, layer1.actName);
				return postAct * w2;
			});

			const color = _viz_bends_hsl_to_rgb((j * 360 / layer1.units) % 360, 70, 55);

			traces.push({
				x: xs,
				y: ys,
				mode: 'lines',
				name: `N${j+1} (w₁=${w1.toFixed(2)}, b=${b1.toFixed(2)}, w₂=${w2.toFixed(2)})`,
				line: { color, width: 1.5, dash: 'dot' },
				opacity: 0.6,
			});
		}
	} else {
		for (let l = 0; l < layerData.length - 1; l++) {
			const numNeurons = layerData[l].units;
			for (let j = 0; j < numNeurons; j++) {
				const ys = xs.map(x => {
					const pre = _viz_bends_get_pre_activations(layerData, x);
					return _viz_bends_apply_activation(pre[l][j], layerData[l].actName);
				});

				const color = _viz_bends_hsl_to_rgb(
					((l * 137 + j * 360 / numNeurons) % 360), 60, 50
				);

				traces.push({
					x: xs,
					y: ys,
					mode: 'lines',
					name: `L${l+1} N${j+1}`,
					line: { color, width: 1, dash: 'dot' },
					opacity: 0.4,
					legendgroup: `layer${l}`,
					visible: 'legendonly',
				});
			}
		}
	}

	traces.push({
		x: xs,
		y: combinedY,
		mode: 'lines',
		name: 'Model Output',
		line: { color: 'cyan', width: 4 },
	});

	if (bendResults.length > 0) {
		const bendXs = bendResults.map(b => b.x);
		const bendYs = bendXs.map(bx => _viz_bends_forward_pass(layerData, bx));
		const bendLabels = bendResults.map(b =>
			b.layer >= 0 ? `L${b.layer+1} N${b.neuron+1}` : 'Curvature peak'
		);

		traces.push({
			x: bendXs,
			y: bendYs,
			mode: 'markers',
			name: `Bend Points (${bendResults.length})`,
			marker: {
				color: 'rgba(255, 50, 50, 0.9)',
				size: 11,
				symbol: 'diamond',
				line: { color: 'white', width: 2 }
			},
			text: bendLabels,
			hovertemplate: '<b>%{text}</b><br>x: %{x:.4f}<br>y: %{y:.4f}<extra></extra>',
		});
	}

	const slopeY = [];
	for (let i = 0; i < xs.length - 1; i++) {
		slopeY.push((combinedY[i + 1] - combinedY[i]) / (xs[i + 1] - xs[i]));
	}
	slopeY.push(slopeY[slopeY.length - 1]);

	traces.push({
		x: xs,
		y: slopeY,
		mode: 'lines',
		name: 'Slope (dy/dx)',
		line: { color: 'rgba(255, 165, 0, 0.7)', width: 2, dash: 'dash' },
		yaxis: 'y2',
		visible: 'legendonly',
	});

	return traces;
}

function _viz_bends_layout() {
	return {
		paper_bgcolor: 'rgba(0,0,0,0)',
		plot_bgcolor: 'rgba(0,0,0,0)',
		font: {
			color: 'var(--plotly-font-color, #444)',
			family: 'Inter, system-ui, sans-serif'
		},
		margin: { t: 30, b: 60, l: 50, r: 50 },
		xaxis: {
			gridcolor: 'rgba(128, 128, 128, 0.2)',
			zerolinecolor: 'rgba(128, 128, 128, 0.5)',
			automargin: true,
			title: 'x',
		},
		yaxis: {
			gridcolor: 'rgba(128, 128, 128, 0.2)',
			zerolinecolor: 'rgba(128, 128, 128, 0.5)',
			automargin: true,
			title: 'y',
		},
		yaxis2: {
			overlaying: 'y',
			side: 'right',
			gridcolor: 'rgba(255, 165, 0, 0.1)',
			title: 'Slope',
			showgrid: false,
		},
		legend: {
			bgcolor: 'rgba(255, 255, 255, 0.1)',
			font: { size: 11 },
			orientation: 'h',
			y: -0.25,
		},
		showlegend: true,
	};
}

async function visualizeModelBends() {
	const targetDiv = document.getElementById("bend_graph");

	if (typeof model === 'undefined' || !model || !model.layers || model.layers.length < 2) {
		if (targetDiv) targetDiv.innerHTML = '';
		return;
	}

	const firstLayer = model.layers[0];
	const inputShape = firstLayer.batchInputShape;
	if (!inputShape || inputShape[inputShape.length - 1] !== 1) {
		if (targetDiv) targetDiv.innerHTML = '';
		return;
	}

	const lastLayer = model.layers[model.layers.length - 1];
	if (lastLayer.units !== 1) {
		if (targetDiv) targetDiv.innerHTML = '';
		return;
	}

	const layerData = await _viz_bends_extract_layer_data(model);
	if (layerData.length < 2) {
		if (targetDiv) targetDiv.innerHTML = '';
		return;
	}

	const hasBendActivations = layerData.some(ld => _viz_bends_is_bend_activation(ld.actName));

	let dataXMin = null;
	let dataXMax = null;
	let dataPoints = null;

	if (typeof xy_data_global !== 'undefined' && xy_data_global &&
		xy_data_global.latex_array_x && xy_data_global.latex_array_x.length > 0) {

		const rawXs = xy_data_global.latex_array_x.map(arr => arr[0]);
		const rawYs = xy_data_global.latex_array_y
			? xy_data_global.latex_array_y.map(arr => arr[0])
			: null;

		dataXMin = Math.min(...rawXs);
		dataXMax = Math.max(...rawXs);

		if (rawYs) {
			dataPoints = { xs: rawXs, ys: rawYs };
		}
	}

	const { xMin, xMax } = _viz_bends_compute_x_range(layerData, dataXMin, dataXMax);

	const numPoints = 800;
	const xs = [];
	for (let i = 0; i < numPoints; i++) {
		xs.push(xMin + (xMax - xMin) * i / (numPoints - 1));
	}

	const combinedY = xs.map(x => _viz_bends_forward_pass(layerData, x));

	const bendResults = _viz_bends_detect_bend_points(layerData, xs, combinedY, xMin, xMax, hasBendActivations);

	const traces = _viz_bends_build_traces(xs, combinedY, dataPoints, layerData, bendResults);
	const layout = _viz_bends_layout();

	let plotDiv;
	if (targetDiv) {
		plotDiv = targetDiv;
	} else {
		plotDiv = document.getElementById('__nn_viz_auto__');
		if (!plotDiv) {
			plotDiv = document.createElement('div');
			plotDiv.id = '__nn_viz_auto__';
			document.body.appendChild(plotDiv);
		}
	}

	plotDiv.style.width = '100%';
	plotDiv.style.minHeight = '400px';

	Plotly.react(plotDiv, traces, layout, { responsive: true });
}
