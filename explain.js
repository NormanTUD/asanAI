"use strict";

function get_number_of_images_per_layer (layer) {
	return $($(".image_grid")[layer]).children().length + $($(".input_image_grid")[layer]).children.length;
}

function normalize_to_rgb_min_max (x, min, max) {
	var val = parseInt(255 * (x - min) / (max - min));
	if(val > 255) {
		val = 255;
	} else if (val < 0) {
		val = 0;
	}

	return val;
}

function get_canvas_in_class (layer, classname, dont_append) {
	var new_canvas = $('<canvas/>', {class: "layer_image"}).prop({
		width: 0,
		height: 0
	});
	if(!dont_append) {
		$($('.' + classname)[layer]).append(new_canvas);
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
	return shape_looks_like_image_data(shape);
}

function draw_rect(ctx, rect){
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

	var ctx = $(canvas)[0].getContext('2d');
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

			var color = 'rgb(' + red + ',' + green + ',' + blue + ')';
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

function draw_grid (canvas, pixel_size, colors, denormalize, black_and_white, onclick, multiply_by, data_hash) {
	assert(typeof(pixel_size) == "number", "pixel_size must be of type number, is " + typeof(pixel_size));
	if(!multiply_by) {
		multiply_by = 1;
	}

	var drew_something = false;

	var height = colors.length;
	var width = colors[0].length;

	$(canvas).attr("width", width * pixel_size);
	$(canvas).attr("height", height * pixel_size);

	if(typeof(data_hash) == "object") {
		for (name in data_hash) {
			$(canvas).data(name, data_hash[name]);
		}
	}

	if(onclick) {
		$(canvas).attr("onclick", onclick);
	}

	var ctx = $(canvas)[0].getContext('2d');
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

			var color = 'rgb(' + red + ',' + green + ',' + blue + ')';
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

function draw_images_if_possible (layer, input_data, output_data, kernel_data) {
	var drew_input = draw_image_if_possible(layer, 'input', input_data);

	var drew_kernel = draw_image_if_possible(layer, 'kernel', kernel_data);

	var drew_output = draw_image_if_possible(layer, 'output', output_data);
	
	return drew_input || drew_kernel || drew_output;
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
				$($(canvas)[0]).parent().parent().show()
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
						$($(canvas)[0]).parent().parent().show()
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
					$($(canvas)[0]).parent().parent().show()
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
		console.warn(e);
	}

	return false;
}

async function Sleep(milliseconds) {
	return new Promise(resolve => setTimeout(resolve, milliseconds));
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
			"name": "Di&shy;men&shy;sio&shy;na&shy;lity re&shy;duc&shy;tion"
		},
		{
			"re": "((?:" + list_activation_layers.join("|") + ")+)", 
			"name": "Ac&shy;ti&shy;va&shy;tion fun&shy;ction"
		},
                {
			"re": "((?:dropout;?)+)", 
			"name": "Pre&shy;vent Over&shy;fit&shy;ting" 
		},
                {
			"re": batch_or_layer_normalization, 
			"name": "Re-scale and re-center data" 
		},
                {
			"re": "(" + batch_or_layer_normalization + "*(?:" + feature_extraction_base + "))", 
			"name": "Feature ex&shy;traction"
		},
                {
			"re": "(" + batch_or_layer_normalization + "*(?:(?:" + feature_extraction_base + ";?)*(?:dropout?;);?))", 
			"name": "Feature ex&shy;trac&shy;tion &amp; Over&shy;fit&shy;ting pre&shy;vention"
		},
                { 
			"re": "((?:dense;?)+;?(?:dropout)?(?:dense;?)*)", 
			"name": "Classi&shy;fication" 
		},
                { 
			"re": "((?:flatten;?)+;?)", 
			"name": "Flatten" 
		},
                {
			"re": "((?:reshape;?)+;?)", 
			"name": "Change shape" 
		},
                {
			"re": "((?:(?:gaussian[^;]|alphaDropout)+;?)+;?)", 
			"name": "Simulate real data"
		},
		{
			"re": "(DebugLayer)+",
			"name": "Debugger"
		}
        ];

        for (var desc_i = 0; desc_i < descs.length; desc_i++) {
                var this_re = RegExp(descs[desc_i]["re"], 'ig');
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
	if(!force) {
		var new_hash = await get_model_config_hash() + '_' + $(window).width();
		if(last_drawn_descriptions == new_hash) {
			return;
		}

		last_drawn_descriptions = new_hash;
	}

	if(!disable_show_python_and_create_model) {
		var groups = group_layers(get_layer_type_array());

		if(groups.length > 0) {
			$(".descriptions_of_layers").remove();

			var layer = $(".layer");

			if(layer.length) {
				var right_offset = parseInt($(layer[0]).offset().left + $(layer[0]).width() + 26);

				for (var i = 0; i < groups.length; i++) {
					var keyname = Object.keys(groups[i])[0];
					var layers = groups[i][keyname];
					var last_layer_nr = layers[layers.length - 1];

					if(keyname != "null") {
						var first_layer_top = parseInt($(layer[layers[0]]).position()["top"]);
						var last_layer_bottom = $(layer[Math.max(0, last_layer_nr - 1)]).position().top + $(layer[last_layer_nr]).height();
						var height = parseInt($($(".layer_end_marker")[last_layer_nr]).offset()["top"] - $($(".layer_start_marker")[layers[0]]).offset()["top"] - 6.5);
						var hidden = '';
						if(is_hidden_or_has_hidden_parent($("#layers_container_left"))) {
							hidden = "display: none;";
						}

						$('<div class="descriptions_of_layers" style="top: ' + first_layer_top + 'px; left: ' + right_offset + 'px; height: ' + height + 'px;' + hidden+ '">' + keyname + '</div>').appendTo('#maindiv');
					}
				}
			}
		}
	}
}

function explain_error_msg (err) {
	if(!err) {
		return "";
	}

	if(typeof(err) == "object") {
		err = err.toString();
	}

	log(err);

	var explanation = "";

	if(model && model.layers && model.layers.length) {
		var last_layer_name = model.layers[model.layers.length - 1].name;
		if(err.includes(last_layer_name) && err.includes("Error when checking target") && err.includes("but got array with shape")) {
			explanation = "This may mean that the number of neurons in the last layer do not conform with the data structure in the training-data-outputs.";
		} else if(err.includes("does not match the shape of the rest")) {
			explanation = "Have you repeatedly pressed 'Start training'? The second one may have started while the first one was not ready, and re-downloaded images. Please reload the page.";
		} else if(err.includes("Failed to compile fragment shader")) {
			explanation = "This may mean that the batch-size and/or filter-size and/or image dimension resize-sizes are too large.";
		} else if(err.includes("target expected a batch of elements where each example")) {
			explanation = "The last number of neurons in the last layer may not match the number of categories.<br><br>It may also be possible that you chose a wrong Loss function. If the number of neurons match, try chosing other losses, like categoricalCrossentropy.<br><br>You may also have only one category, but you need at least two.";
		} else if(err.includes("but got array with shape 0,")) {
			explanation = "Have you forgotten to add your own training data?";
		} else if(err.includes("texShape is undefined")) {
			explanation = "Please check if any of the output-dimensions contain '0' and if so, try to minimize the dimensionality reduction so that all zeroes disappear.";
		} else if(err.includes("info is undefined")) {
			explanation = "Have you enabled debug-mode and also stopped training early? Please try disabling debug mode and re-train.<br><br>This might also be caused by calling `tf.disposeVariables()` somewhere...";
		} else if(err.includes("expects targets to be binary matrices")) {
			explanation = "Try choosing another loss and metric function, like Mean Squared Error (MSE) or Mean Absolute Error (MAE).";
		} else if(err.includes("oneHot: depth must be")) {
			explanation = "Try choosing another loss and metric function, like Mean Squared Error (MSE) or Mean Absolute Error (MAE).";
		} else if(err.includes("Cannot find a connection between any variable and the result of the loss function")) {
			explanation = "This is probably a bug in asanAI. This may happen when the function run_neural_network is called, but the model is not compiled (e.g. the compile_model function throws an exception). You should never see this. Sorry.";
		} else if(err.includes("numeric tensor, but got string tensor")) {
			if($("#data_origin").val() == "csv") {
				explanation = "Please check your CSV-file input to remove unneeded extra characters. Neither input nor output tensors should contain any strings, but only integers and floats.";
			} else {
				explanation = "Are you sure your input data is numeric?";
			}
		} else if(err.includes("input expected a batch of elements where each example has shape")) {
			explanation = "Does the input-shape match the data?";
		} else if (err.includes("Error when checking input") && err.includes("but got array with shape")) {
			if($("#data_origin").val() == "csv") {
				explanation = "Have you chosen an 'own'-data-source with CSV-files in a network with convolutional layers?";
			}
		}
	} else {
		explanation = "No layers."
	}

	if(explanation.length) {
		return explanation;
	}
	return "";
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
	if(model === null) {
		write_error("model is not defined"); // cannot be async
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

async function identify_layers (numberoflayers) {
	//console.trace();
	has_zero_output_shape = false;
	for (var i = 0; i < numberoflayers; i++) {
		$($(".layer_nr_desc")[i]).html(i + ":&nbsp;");
		var new_str = get_layer_identification(i);

		if(new_str != "") {
			new_str = new_str + ",&nbsp;";
		}

		var output_shape_string = "";
		try {
			if(i in model.layers) {
				var shape = JSON.stringify(model.layers[i].getOutputAt(0).shape);
				if(/((\[|,)\s*)\s*0\s*((\]|,)\s*)/.test(shape) || /\[\s*(0,?\s*?)+\s*\]/.test(shape)) {
					output_shape_string = "<span style='background-color: red'>Output:&nbsp;" + shape + "</span>";
					output_shape_string = output_shape_string.replace("null,", "");
					has_zero_output_shape = true;
				} else {
					output_shape_string = "Output:&nbsp;" + shape;
					output_shape_string = output_shape_string.replace("null,", "");
				}
			}

			if(has_zero_output_shape) {
				var zero_output_shape_current_status_hash = await get_current_layer_container_status_hash();

				if(zero_output_shape_current_status_hash != last_zero_output_shape_status) {
					var basemsg = "ERROR: There are zeroes in the output shapes. ";
					var msg = basemsg + "This may cause a lot of problems. Keep that in mind when you continue.<br>If you use images, try larger input image sizes, or remove some layers that reduce the output shape's dimensions.<br>The affected layers output shapes are marked <span style='color: red'>red</span>.<br>Training and saving is disabled.";
					l(msg);
					if(!shown_has_zero_data) {
						if(!swal.isVisible()) {
							Swal.fire({
								icon: 'error',
								title: 'Oops [6]...',
								html: msg
							});
						}
						shown_has_zero_data = true;
					}
					last_zero_output_shape_status = zero_output_shape_current_status_hash;
					disable_train();
				}
			} else {
				if(!has_zero_output_shape && !shown_has_zero_data) {
					enable_train();
				}
			}
		} catch (e) {
			console.warn(e);
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
			console.warn(e);
		}

		write_layer_identification(i, new_str + output_shape_string + "<span class='layer_identifier_activation'>" + activation_function_string + "</span>");
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
		$($(".layer_data")[layer]).hide()
	}
}

/* This code is responsible for adding a debugger to a layer in order to visualize the data that is being passed through it. This can be helpful in understanding what is happening in a model and how it is making predictions. */

function add_layer_debuggers () {
	$("#datalayers").html("");

	$(".layer_data").html("")

	for (var i = 0; i < model.layers.length; i++) {
		if(get_methods(model.layers[i]).includes("original_apply_real")) {
			model.layers[i].apply = model.layers[i].original_apply_real;
		}

		model.layers[i].original_apply_real = model.layers[i].apply

		var code = `model.layers[${i}].apply = function (inputs, kwargs) {
			var applied = model.layers[${i}].original_apply_real(inputs, kwargs);

			if(!disable_layer_debuggers) {
				if($("#show_layer_data").is(":checked")) {
					draw_internal_states(${i}, inputs, applied);
				}
			}

			return applied;
		}`;

		eval(code);
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
		layer_div.html('<h3>Layer ' + layer + " &mdash; " + $($(".layer_type")[layer]).val() + " " + get_layer_identification(layer) + "</h3>").hide();

		layer_div.show();
		layer_div.append("<div style='display: none' id='layer_" + layer + "_input'><h4>Input:</h4></div>");
		layer_div.append("<div style='display: none' id='layer_" + layer + "_kernel'><h4>Weight Matrix:</h4></div>");
		layer_div.append("<div style='display: none' id='layer_" + layer + "_output'><h4>Output:</h4></div>");
		layer_div.append("<div style='display: none' id='layer_" + layer + "_equations'><h4>Raw Data:</h4></div>");

		var input = $("#layer_" + layer + "_input");
		var kernel = $("#layer_" + layer + "_kernel");
		var output = $("#layer_" + layer + "_output");
		var equations = $("#layer_" + layer + "_equations");

		$("#layer_visualizations_tab").show();

		var kernel_data = [];
		if(Object.keys(model.layers[layer]).includes('kernel')) {
			if(model.layers[layer].kernel.val.shape.length == 4) {
				kernel_data = model.layers[layer].kernel.val.transpose([3, 2, 1, 0]).arraySync();
			}
		}

		var canvas_input = draw_image_if_possible(layer, 'input', input_data, 1);
		var canvas_kernel = draw_image_if_possible(layer, 'kernel', kernel_data, 1);
		var canvas_output = draw_image_if_possible(layer, 'output', output_data, 1);

		if(canvas_output.length && canvas_input.length) {
			for (var j = 0; j < canvas_input.length; j++) {
				for (var i = 0; i < canvas_output.length; i++) {
					var img_output = canvas_output[i];
					if(Object.keys(canvas_kernel).includes(i + '')) {
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
				if(Object.keys(canvas_kernel).includes(i + '')) {
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
				if($("#show_raw_data").is(":checked")) {
					var h = array_to_html(output_data);
					equations.append(h).show()
				} else {
					equations.html("Enable 'show raw data?' in the visualization tab to show").show();
				}
			}
		}
	}

	//MathJax.typeset();
}

function zoom_kernel_images (kernel_image_zoom) {
	$(".kernel_layer_image").width($(".kernel_layer_image").width() * kernel_image_zoom);
}

function reset_zoom_kernel_images () {
	$(".kernel_layer_image").width("auto");
}

/*
 * From https://github.com/tensorflow/tfjs-examples/tree/master/visualize-convnet
 */

/* The deprocessImage function takes an image tensor and deprocesses it so that it's ready to be shown to the user. This includes normalizing the image, adding a small positive number to the denominator to prevent division-by-zero, clipping the image to [0, 1], and then multiplying by 255 and casting to an int32. */

function deprocessImage(x) {
        return tf.tidy(() => {
                const {mean, variance} = tf.moments(x);
                x = x.sub(mean);
                // Add a small positive number (EPSILON) to the denominator to prevent
                // division-by-zero.
                x = x.div(tf.sqrt(variance).add(tf.backend().epsilon()));
                // Clip to [0, 1].
                x = x.add(0.5);
                x = tf.clipByValue(x, 0, 1);
                x = x.mul(255);
                return tf.clipByValue(x, 0, 255).asType('int32');
        });
}

/* This function normalizes a given tensor so that it's minimum value is 0 and it's maximum value is 1. This is done by subtracting the minimum value from the tensor, and then dividing by the difference between the maximum and minimum values. */

function tensor_normalize_to_rgb_min_max (x) {
	var max = x.max();
	var min = x.min();

	var x_minus_min = x.sub(min);

	x = x_minus_min.div(max.sub(min));

	return x;
}

/* This function performs gradient ascent on the input image to find an image that maximizes the output of the given filter in the given layer. */

function inputGradientAscent(layerIndex, filterIndex, iterations, start_image) {
	var worked = 0;
        var full_data = {};


	full_data["image"] = tf.tidy(() => {
                var imageH = model.inputs[0].shape[1];
                var imageW = model.inputs[0].shape[2];
                const imageDepth = model.inputs[0].shape[3];

                // Create an auxiliary model of which input is the same as the original
                // model but the output is the output of the convolutional layer of
                // interest.
                const layerOutput = model.getLayer(null, layerIndex).output;
                const auxModel = tf.model({inputs: model.inputs, outputs: layerOutput});

                // This function calculates the value of the convolutional layer's
                // output at the designated filter index.
                const lossFunction = (input) => auxModel.apply(input, {training: true}).gather([filterIndex], -1);

                // This returned function (`gradFunction`) calculates the gradient of the
                // convolutional filter's output with respect to the input image.
                const gradFunction = tf.grad(lossFunction);

                // Form a random image as the starting point of the gradient ascent.
		
		if(parseInt($("#max_activated_neuron_image_size").val()) && $($(".layer_type")[layerIndex]).val() != "dense") {
			imageH = imageW = parseInt($("#max_activated_neuron_image_size").val());
		}

                var image = tf.randomUniform([1, imageH, imageW, imageDepth], 0, 255);
		if(typeof(start_image) != "undefined") {
			image = start_image;
		}

		image = image.div(parseFloat($("#divide_by").val()));

		var prev_img_str = image.dataSync().join(";");

                for (var i = 1; i <= iterations; i++) {
			if(stop_generating_images) {
				continue;
			}

                        const scaledGrads = tf.tidy(() => {
                                const grads = gradFunction(image);
                                const norm = tf.sqrt(tf.mean(tf.square(grads))).add(tf.backend().epsilon());
                                // Important trick: scale the gradient with the magnitude (norm)
                                // of the gradient.
                                return grads.div(norm);
                        });

                        // Perform one step of gradient ascent: Update the image along the
                        // direction of the gradient.

			image = tensor_normalize_to_rgb_min_max(image);

			image = image.add(scaledGrads);
			//image = tf.clipByValue(image.add(scaledGrads), 0, parseFloat($("#divide_by").val()));
			
			var randomizer_limits = parseFloat($("#randomizer_limits").val());
			if(randomizer_limits != 0) {
				image = image.add(tf.randomUniform(image.shape, -randomizer_limits, randomizer_limits));
			}

			if(image.dataSync().join(";") == prev_img_str && i >= 5) {
				header_error("Image has not changed");
				return deprocessImage(image).arraySync();
			} else {
				prev_img_str = image.dataSync().join(";");
			}
                }

		worked = 1;
                return deprocessImage(image).arraySync();
        });

	full_data["worked"] = worked;

	return full_data;
}

/* This function gets an image from a URL. It uses the load_image function to load the image, and then uses tf.browser.fromPixels to convert it to a TensorFlow image. Next, it resizes the image using the nearest neighbor algorithm, and then expands the dimensions of the image. Finally, it returns the image. */

async function get_image_from_url (url) {
	var tf_img = (async () => {
		let img = await load_image(url);
		tf_img = tf.browser.fromPixels(img);
		var resized_img = tf_img.
			resizeNearestNeighbor([height, width]).
			toFloat().
			expandDims();
		if($("#divide_by").val() != 1) {
			resized_img = tf.divNoNan(resized_img, parseFloat($("#divide_by").val()));
		}
		return resized_img;
	})();
	return tf_img;
}

async function draw_maximally_activated_layer (layer, type) {
	show_tab_label("maximally_activated_label", 1);

	var neurons = 1;

	if(type == "conv2d") {
		neurons = parseInt(get_item_value(layer, "filters"));
	} else if (type == "dense") {
		neurons = parseInt(get_item_value(layer, "units"));
	} else {
		console.warn("Unknown layer " + layer);
		return;
	}

	//log("Layer: " + layer);
	var types_in_order = "";
	if(get_number_of_layers() - 1 == layer) {
		if(labels && labels.length) {
			types_in_order = " (" + labels.join(", ") + ")";
		}
	}

	var times = [];

	favicon_spinner();

	for (var i = neurons - 1; i >= 0; i--) {
		if(stop_generating_images) {
			continue;
		}
		var eta = "";
		if(times.length) {
			eta = " (" + human_readable_time(parseInt((i) * median(times))) + " left)";
		}

		var swal_msg = "Image " + ((neurons - i)) + " of " + neurons + eta;

		l(swal_msg + " <button onclick='stop_generating_images=1'>Stop generating images</button>");

		l(swal_msg);
		document.title = swal_msg;

		await Swal.fire({
			title: 'Generating Image...',
			html: swal_msg,
			timer: 2000,
			showCancelButton: true,
			showConfirmButton: false
		}).then((e)=>{
			if(e.isDismissed && e.dismiss == "cancel") {
				l("Stopped generating new images, this may take a while");
				stop_generating_images = 1;
			}
		});


		show_tab_label("visualization_tab_label", $("#jump_to_interesting_tab").is(":checked") ? 1 : 0);
		show_tab_label("maximally_activated_label", $("#jump_to_interesting_tab").is(":checked") ? 1 : 0);


		var start = Date.now();

		await draw_maximally_activated_neuron(layer, i);

		var end = Date.now();

		var time = ((end - start) / 1000) + 1;

		times.push(time);
	}

	$("#maximally_activated_content").prepend("<h2 class='h2_maximally_activated_layer_contents'>Layer " + layer + types_in_order + "</h2>")

	l("Done generating images");

	stop_generating_images = false;

	favicon_default();

	document.title = original_title;

	await allow_editable_labels();
}

async function predict_maximally_activated (item, force_category) {
	var results = await predict(item, force_category, 1);
	if($(item).next().length && $(item).next()[0].tagName.toLowerCase() == "pre") {
		$(item).next().remove();
	}
	$(item).after("<pre class='maximally_activated_predictions'>" + results + "</pre>");

	await predict($('#predict_own_data').val())
}

async function draw_maximally_activated_neuron (layer, neuron) {
	var current_input_shape = get_input_shape();

	if(current_input_shape.length != 3) {
		return;
	}

	var original_disable_layer_debuggers = disable_layer_debuggers;
	disable_layer_debuggers = 1;

	try {
		var start_image = undefined;

		var full_data = inputGradientAscent(layer, neuron, $("#max_activation_iterations").val(), start_image);

		disable_layer_debuggers = original_disable_layer_debuggers;

		if(full_data["worked"]) {
			var data = full_data["image"][0];
			var canvas = get_canvas_in_class(layer, "maximally_activated_class");

			var data_hash = {
				layer: layer, 
				neuron: neuron,
				model_hash: await get_model_config_hash()
				
			};

			var res = draw_grid(canvas, 1, data, 1, 0, "predict_maximally_activated(this, 'image')", null, data_hash);

			if(res) {
				$("#maximally_activated_content").prepend(canvas);
				show_tab_label("maximally_activated_label", 1)
			} else {
				log("Res: " + res);
			}

			return res;
		}
		return false;
	} catch (e) {
		await write_error(e);
		show_tab_label("visualization_tab", 1);
		show_tab_label("fcnn_tab_label", 1);
		return false;
	}
}

function array_to_fixed (array, fixnr) {
	if(fixnr == 0) {
		return array;
	}
	var x = 0;
	var len = array.length
	while(x < len){ 
		if(looks_like_number(array[x])) {
			array[x] = parseFloat(parseFloat(array[x]).toFixed(fixnr)); 
		}
		x++;
	}
	return array;
}

function array_to_color (array, color) {
	var x = 0;
	var len = array.length
	var new_array = [];
	while(x < len){ 
		var this_color = color[x];
		if(!this_color) {
			this_color = "orange";
		}
		new_array.push("\\color{" + this_color + "}{" + array[x] + "}");
		x++;
	}
	return new_array;
}

function array_to_latex_color (original_array, desc, color, newline_instead_of_ampersand) {
	var array = JSON.parse(JSON.stringify(original_array));
	var str = "\\underbrace{\\begin{pmatrix}\n";

	var joiner = " & ";
	if(newline_instead_of_ampersand) {
		joiner = " \\\\\n";
	}

	var arr = [];

	for (var i = 0; i < array.length; i++) {
		array[i] = array_to_fixed(array[i], parseInt($("#decimal_points_math_mode").val() || 0));
		array[i] = array_to_color(array[i], color[i]);
		arr.push(array[i].join(joiner));
	}

	str += arr.join("\\\\\n");

	str += "\n\\end{pmatrix}}_{\\mathrm{" + desc + "}}\n";

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
		array[i] = array_to_fixed(array[i], parseInt($("#decimal_points_math_mode").val()));
		arr.push(array[i].join(joiner));
	}

	str += arr.join("\\\\\n");

	str += "\n\\end{pmatrix}}_{\\mathrm{" + desc + "}}\n";

	return str;
}

function a_times_b (a, b) {
	return a + " \\times " + b;
}

function get_weight_name_by_layer_and_weight_index (layer, index) {
	assert(typeof(layer) == "number", layer + " is not a number");
	assert(typeof(index) == "number", index + " is not a number");

	var original_name = model.layers[layer].weights[index].name

	var matches = /^.*\/(.*?)(?:_\d+)?$/.exec(original_name);
	if(matches === null) {
		console.error("matches is null. Could not determine name from " + original_name);
	} else if(1 in matches) {
		return matches[1];
	} else {
		console.error("Could not determine name from " + original_name + ", matches: ");
		log(matches)
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
						console.error("Invalid wname: " + wname);
						log(model.layers[i].weights[k]);
					}
				}
			}
		} catch (e) {
			console.error(e);
		}

		layer_data.push(this_layer_weights);	
	}

	return layer_data;
}

function array_size (ar) {
	var row_count = ar.length;
	var row_sizes = []
	for(var i = 0; i < row_count; i++){
		row_sizes.push(ar[i].length)
	}
	return [row_count, Math.min.apply(null, row_sizes)]
}

function get_layer_output_shape_as_string (i) {
	assert(typeof(i) == "number", i + " is not a number");
	assert(i < model.layers.length, i + " is larger than " + model.layers.length);
	if(Object.keys(model).includes("layers")) {
		try {
			var str = model.layers[i].outputShape.toString()
			str = str.replace(/^,|,$/g,'');;
			str = "[" + str + "]";
			return str;
		} catch (e) {
			console.error(e);
		}
	} else {
		log("Layers not in model");
	}
}

function _get_h (i) {
	return "h_{\\text{Shape: }" + get_layer_output_shape_as_string(i) + "}" + "'".repeat(i);
}

function array_to_latex_matrix (array, level=0, no_brackets) { // TODO color
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
        str += base_tab + "\\end{matrix}" + (!no_brackets ? "\\right)" : "") + "\n"
        return str;
}

function model_to_latex () {
	var layers = model.layers;

	var input_shape = model.layers[0].input.shape;

	if(input_shape.length != 2) {
		l("Math mode works only in input shape [n] (or [null, n] with batch)");
		return;
	}

	var output_shape = model.layers[model.layers.length - 1].outputShape;

	if(output_shape.length != 2) {
		l("Math mode works only in output shape [n] (or [null, n] with batch)");
		return;
	}

	var activation_function_equations = {
		"sigmoid": {
			"equation": "\\mathrm{sigmoid}\\left(x\\right) = \\sigma\\left(x\\right) = \\frac{1}{1+e^{-x}}",
			"equation_no_function_name": "\\sigma\\left(REPLACEME\\right) = \\frac{1}{1+e^{-REPLACEME}}",
			"lower_limit": 0,
			"upper_limit": 1
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

		str += "$$ \\text{Layer " + i + " (" + this_layer_type + "):} \\qquad ";

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

					activation_string += "$$" + this_activation_string + "$$\n";

					shown_activation_equations.push(activation_name);
				}
			} else {
				console.error("Activation name '" + activation_name + "' not found");
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
				console.error(e);
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
				
				var alpha = parseFloat(get_item_value(i, "alpha"));
				if(typeof(alpha) == "number") {
					this_activation_string = this_activation_string.replaceAll("ALPHAREPL", "{" + alpha + "}");
					this_activation_string = this_activation_string.replaceAll("\\alpha", "\\underbrace{" + alpha + "}_{\\alpha} \\cdot ");
				}

				var theta = parseFloat(get_item_value(i, "theta"));
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
				beta_string = array_to_latex_matrix(array_to_fixed(layer_data[i].beta, parseInt($("#decimal_points_math_mode").val())));
				beta_string = "\\displaystyle " + beta_string;
			}
			if("gamma" in layer_data[i]) {
				gamma_string = array_to_latex_matrix(array_to_fixed(layer_data[i].gamma, parseInt($("#decimal_points_math_mode").val())));
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
			var dropout_rate = parseInt(parseFloat($($(".layer_setting")[i]).find(".dropout_rate").val()) * 100);
			str += "\\text{Setting " + dropout_rate + "\\% of the input values to 0 randomly}";
		} else if (this_layer_type == "DebugLayer") {
			str += "\\text{The debug layer does nothing to the data, but just prints it out to the developers console.}"
		} else if (this_layer_type == "gaussianNoise") {
			str += "\\text{Adds gaussian noise to the input (only active during training), Standard-deviation: " + get_item_value(i, "stddev") + ".}"
		} else {
			log("Invalid layer type for layer " + i + ": " + this_layer_type);
		}
		str += "$$";
		/*
		if(i != model.layers.length - 1) {
			str += "<hr class='full_width_hr'>";
		}
		*/
	}

	if(Object.keys(loss_equations).includes($("#loss").val())) {
		str += "<h2>Loss:</h2>$$" + loss_equations[$("#loss").val()] + "$$ ";
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


				str += "$$ \\displaystyle \\text{" + this_optimizer.variables[thisvarname]["name"] + ": } " + thisvarname;
				if(Object.keys(this_optimizer.variables[thisvarname]).includes("value")) {
					str += " = " + this_optimizer.variables[thisvarname]["value"];
				} else if(origin !== undefined) {
					origin = origin.replace("OPTIMIZERNAME", optimizer);
					var valofparam = $("#" + origin).val();
					str += " = " + valofparam;
				}
				str += " $$";

				if(Object.keys(this_optimizer.variables).includes("example")) {
					str += "$$ \\displaystyle " + this_optimizer.variables.example + " $$";
				}
			}

			str += "<h3>Equations for optimizers:</h3>\n";
		}

		for (var m = 0; m < dependencies.length; m++) {
			if(dependencies[m] != optimizer) {
				str += "$$ \\displaystyle \\text{" + dependencies[m] + ": }" + optimizer_equations[dependencies[m]]["equations"].join(" $$\n$$ ") + " $$";
			}
		}

		str += "$$ \\displaystyle \\text{" + optimizer + ": }" + this_optimizer["equations"].join(" $$\n$$ ") + " $$";
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

	if(model.layers[0].input.shape.length != 2) {
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
		var valid_layers = ["dense", "flatten", "reshape", "elu", "leakyReLU", "reLU", "softmax", "thresholdedReLU", "dropout", "batchNormalization", "DebugLayer", "gaussianNoise"];
		if(!(valid_layers.includes(this_layer_type))) {
			l("Hiding math tab because " + this_layer_type + " is not in " + valid_layers.join(", "));
			return false
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
				await MathJax.typesetPromise([math_tab_code_elem]);
				show_tab_label("math_tab_label");
				math_items_hashes[xpath] = new_md5;
			}
		} catch (e) {
			var mathjax_error_explanation = "Are you online?";
			console.warn(e);
			$("#math_tab_code").html("<h2>Error</h2>\n" + e + "\n<br>" + mathjax_error_explanation);
		}
	} else {
		hide_tab_label("math_tab_label");
	}
}

/* This function is used to compare old and new layer data to see if there are any differences. The default color is black, but if darkmode is true, the default color will be white. The color diff variable will contain an array of objects, with each object representing a layer. The keys of each object represent the different data sets within that layer, and the values are arrays of colors, with each color representing the difference between the old and new data for that particular data set. */

function color_compare_old_and_new_layer_data (old_data, new_data) {
	assert(old_data.length == new_data.length, "Old data and new data are vastly different. Have you changed the number of layers without resetting prev_layer_data?");

	var default_color = "black";
	var cookie_theme = getCookie("theme");
	var darkmode = 0;
	if(cookie_theme == "darkmode") {
		darkmode = 1;
	}
	if(darkmode) {
		default_color = "white";
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
				console.warn("Keys are not equal for layer data of " + layer_nr + ", key: " + this_key);
				console.trace();
			}

			color_diff[layer_nr][this_key] = [];

			var this_old_sub_array = this_old_layer[this_key];
			var this_new_sub_array = this_new_layer[this_key];
			
			for (var item_nr = 0; item_nr < this_old_sub_array.length; item_nr++) {
				if(typeof(this_old_sub_array[item_nr]) == "number") { // sub array is all numbers
					if(this_old_sub_array[item_nr] == this_new_sub_array[item_nr]) {
						color_diff[layer_nr][this_key][item_nr] = default_color;
					} else {
						if(this_old_sub_array[item_nr] > this_new_sub_array[item_nr]) {
							color_diff[layer_nr][this_key][item_nr] = "OrangeRed";
						} else if(this_old_sub_array[item_nr] < this_new_sub_array[item_nr]) {
							color_diff[layer_nr][this_key][item_nr] = "SeaGreen";
						}
					}
				} else { // sub array contains more arrays (kernels most probably))
					color_diff[layer_nr][this_key][item_nr] = [];
					for (var kernel_nr = 0; kernel_nr < this_old_sub_array[item_nr].length; kernel_nr++) {
						if(this_old_sub_array[item_nr][kernel_nr] == this_new_sub_array[item_nr][kernel_nr]) {
							color_diff[layer_nr][this_key][item_nr][kernel_nr] = default_color;
						} else {
							if(this_old_sub_array[item_nr][kernel_nr] > this_new_sub_array[item_nr][kernel_nr]) {
								color_diff[layer_nr][this_key][item_nr][kernel_nr] = "OrangeRed";
							} else if(this_old_sub_array[item_nr][kernel_nr] < this_new_sub_array[item_nr][kernel_nr]) {
								color_diff[layer_nr][this_key][item_nr][kernel_nr] = "SeaGreen";
							}
						}
					}
				}
			}
		}

	}

	return color_diff;
}

function get_loss_landscape_data (Y, Y_hat, min_x, max_x, min_y, max_y, steps) {
        var x_diff = Math.abs(min_x - max_x);
        var y_diff = Math.abs(min_y - max_y);
        var x_step_size = x_diff / steps;
        var y_step_size = y_diff / steps;

        var x_pos = Math.min(max_x, min_x);
        var y_pos = Math.min(max_y, min_y);

        var landscape = [];

        while (x_pos <= max_x) {
                y_pos = Math.min(max_y, min_y);
                while (y_pos <= max_x) {
                        //log("x: " + x_pos + ", y: " + y_pos);
                        y_pos += y_step_size;
			var this_loss = median(eval("tf.metrics." + $("#loss").val() + "(Y, Y_hat).arraySync()"));
                        landscape.push([x_pos, y_pos, this_loss]);
                }
                x_pos += x_step_size;
        }

        return landscape;
}

async function create_loss_landscape () {
	var old_force_download = force_download;
	force_download = 1;
	var xs_ys = await get_xs_and_ys()
	force_download = old_force_download;

	/*
	xs_ys.x = tf.tensor([xs_ys.x], null, 'float32');
	xs_ys.y = tf.tensor([xs_ys.y], null, 'float32');
	*/

	var Y = model.predict(xs_ys.x);
	//log(Y);
	var Y_hat = xs_ys.y.asType("float32");
	//log(Y_hat);

	//log(xs_ys);

	var landscape = get_loss_landscape_data(Y, Y_hat, -10, 10, -10, 10, 20);
	log(landscape);

	var data = [{
		z: landscape,
		type: 'surface'
	}];

	var layout = {
		title: 'Loss Landscape',
		autosize: true,
		width: 500,
		height: 500
	};

	Plotly.newPlot('graphs_here', data, layout);
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

	eval(`
	onBatchEnd = async function (epoch, logs) {
		if(typeof(old_onEpochEnd) == 'function') {
			old_onEpochEnd(epoch, logs);
		}

		try {
			var current_epoch = epoch + 1;
			if(current_epoch == 1) {
				$("#${append_to_id}").html("");
				$("<div id='${id}_training_data_graph'></div>").appendTo($("#${append_to_id}"));
			}

			var real_trace = {
				x: [],
				y: [],
				type: 'scatter',
				name: "Ground Truth"
			};

			var predicted_trace = {
				x: [],
				y: [],
				type: 'scatter',
				name: "Prediction"
			};

			var x_data = ${x_data_json};
			var y_data = ${y_data_json};

			//1) combine the arrays:
			var list = [];
			for (var j = 0; j < x_data.length; j++)
				list.push({'x_data': parseFloat(x_data[j][0]), 'y_data': parseFloat(y_data[j][0])});

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
				real_trace.x.push(x_data[i][0]);
				predicted_trace.x.push(x_data[i][0]);

				real_trace.y.push(y_data[i][0]);
				tf.engine().startScope();
				var predicted = await ${global_model_name}.predict(tf.tensor(x_data[i])).arraySync()[0][0];
				tf.engine().endScope();
				predicted_trace.y.push(predicted);
			}

			var layout = {
				paper_bgcolor: "rgba(0, 0, 0, 0)",
				plot_bgcolor: "rgba(0, 0, 0, 0)",
				gridcolor: "#7c7c7c",
				font: {
					family: 'Courier New, monospace',
					size: 18,
					color: '#7f7f7f'
				},
				title: "Real function vs. predicted function",
				yaxis: {title: 'predicted vs. real data'},
				yaxis: {
					title: 'y',
					side: 'left',
					showgrid: false
				},
				xaxis: {
					title: 'x',
					side: 'bottom',
					showgrid: false
				}
			};

			var data = [real_trace, predicted_trace];

			Plotly.newPlot('${id}_training_data_graph', data, layout);
		} catch (e) {
			console.error(e);
		}
	}
	`);

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

function least_square_equation (x_array, y_array) {
	var r = least_square(x_array, y_array);
	var m = r[0];
	var b = r[1];

	var equation = `y = ${m}x + ${b}`;

	return equation;
}

function array_to_html(array) {
	var m = '';
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

function applyColorMap(x) {
	tf.util.assert(
		x.rank === 4, `Expected rank-4 tensor input, got rank ${x.rank}`);
	tf.util.assert(
		x.shape[0] === 1,
		`Expected exactly one example, but got ${x.shape[0]} examples`);
	tf.util.assert(
		x.shape[3] === 1,
		`Expected exactly one channel, but got ${x.shape[3]} channels`);

	return tf.tidy(() => {
		// Get normalized x.
		const EPSILON = 1e-5;
		const xRange = x.max().sub(x.min());
		const xNorm = x.sub(x.min()).div(xRange.add(EPSILON));
		const xNormData = xNorm.dataSync();

		const h = x.shape[1];
		const w = x.shape[2];
		const buffer = tf.buffer([1, h, w, 3]);

		const colorMapSize = RGB_COLORMAP.length / 3;
		for (let i = 0; i < h; ++i) {
			for (let j = 0; j < w; ++j) {
				const pixelValue = xNormData[i * w + j];
				const row = Math.floor(pixelValue * colorMapSize);
				buffer.set(RGB_COLORMAP[3 * row], 0, i, j, 0);
				buffer.set(RGB_COLORMAP[3 * row + 1], 0, i, j, 1);
				buffer.set(RGB_COLORMAP[3 * row + 2], 0, i, j, 2);
			}
		}
		return buffer.toTensor();
	});
}

function gradClassActivationMap(model, x, classIndex, overlayFactor = 2.0) {
	if(started_training) {
		l("Cannot show grad CAM while training");
		return;
	}

	if(!contains_convolution()) {
		l("Cannot continue using grad CAM when you have no convolutional layers");
		return;
	}

	if(is_hidden_or_has_hidden_parent("#grad_cam_heatmap")) {
		l("Not wasting resources on grad CAM when the predict tab is not visible anyways.");
		return;
	}

	try {
		// Try to locate the last conv layer of the model.
		let layerIndex = model.layers.length - 1;
		while (layerIndex >= 0) {
			if (model.layers[layerIndex].getClassName().startsWith('Conv')) {
				break;
			}
			layerIndex--;
		}
		tf.util.assert(
			layerIndex >= 0, `Failed to find a convolutional layer in model`);

		const lastConvLayer = model.layers[layerIndex];

		/*
		console.log(
			`Located last convolutional layer of the model at ` +
			`index ${layerIndex}: layer type = ${lastConvLayer.getClassName()}; ` +
			`layer name = ${lastConvLayer.name}`);
		*/

		// Get "sub-model 1", which goes from the original input to the output
		// of the last convolutional layer.
		const lastConvLayerOutput = lastConvLayer.output;
		const subModel1 =
			tf.model({inputs: model.inputs, outputs: lastConvLayerOutput});

		// Get "sub-model 2", which goes from the output of the last convolutional
		// layer to the original output.
		const newInput = tf.input({shape: lastConvLayerOutput.shape.slice(1)});
		layerIndex++;
		let y = newInput;
		while (layerIndex < model.layers.length) {
			y = model.layers[layerIndex++].apply(y);
		}
		const subModel2 = tf.model({inputs: newInput, outputs: y});

		var retval = tf.tidy(() => {
			// This function runs sub-model 2 and extracts the slice of the probability
			// output that corresponds to the desired class.

			const convOutput2ClassOutput = (input) =>
				subModel2.apply(input, {training: true}).gather([classIndex], 1);
			// This is the gradient function of the output corresponding to the desired
			// class with respect to its input (i.e., the output of the last
			// convolutional layer of the original model).
			const gradFunction = tf.grad(convOutput2ClassOutput);

			// Calculate the values of the last conv layer's output.
			const lastConvLayerOutputValues = subModel1.apply(x);
			// Calculate the values of gradients of the class output w.r.t. the output
			// of the last convolutional layer.
			const gradValues = gradFunction(lastConvLayerOutputValues);

			// Pool the gradient values within each filter of the last convolutional
			// layer, resulting in a tensor of shape [numFilters].
			const pooledGradValues = tf.mean(gradValues, [0, 1, 2]);
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
			heatMap = tf.image.resizeBilinear(heatMap, [x.shape[1], x.shape[2]]);

			// Apply an RGB colormap on the heatMap. This step is necessary because
			// the heatMap is a 1-channel (grayscale) image. It needs to be converted
			// into a color (RGB) one through this function call.
			heatMap = applyColorMap(heatMap);

			// To form the final output, overlay the color heat map on the input image.
			heatMap = heatMap.mul(overlayFactor).add(x.div(255));
			return heatMap.div(heatMap.max()).mul(255);
		});

		return retval;
	} catch (e) {
		console.warn(e);
		return null;
	}
}

// grid_search(tf.tensor([1, 1, 5]), tf.tensor([2, 1, 1]), 0, 1, 0, 1, 10)
// tf.metrics.meanSquaredError(tf.tensor([1, 1]), tf.tensor([2, 1])).print() 
