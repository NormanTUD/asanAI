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

function get_canvas_in_class (layer, classname) {
	var new_canvas = $('<canvas/>', {class: "layer_image"}).prop({
		width: 0,
		height: 0
	});
	$($('.' + classname)[layer]).append(new_canvas);
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

	var min = -1;
	var max = 1;

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

function draw_grid (canvas, pixel_size, colors, denormalize, black_and_white, onclick) {
	assert(typeof(pixel_size) == "number", "pixel_size must be of type number, is " + typeof(pixel_size));

	var drew_something = false;

	var width = colors[0].length;
	var height = colors.length;

	$(canvas).attr("width", width * pixel_size);
	$(canvas).attr("height", height * pixel_size);
	if(onclick) {
		$(canvas).attr("onclick", onclick);
	}

	var ctx = $(canvas)[0].getContext('2d');
	ctx.beginPath();    

	var min = -1;
	var max = 1;

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
				red = green = blue = colors[j][i];
			} else {
				red = colors[j][i][0];
				green = colors[j][i][1];
				blue = colors[j][i][2];
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
	
	write_descriptions();

	return drew_input || drew_kernel || drew_output;
}

function draw_image_if_possible (layer, canvas_type, colors) {
	if(canvas_type != "kernel") {
		if(canvas_type == "input" && layer != 0) {
			return;
		}
	}

	var canvas = null;

	try {
		var ret = false;

		var data_type = looks_like_image_data(colors);

		if(data_type == "simple") {
			if(canvas_type == "input") {
				canvas = get_canvas_in_class(layer, "input_image_grid");
			} else {
				canvas = get_canvas_in_class(layer, "image_grid");
			}

			$($(canvas)[0]).parent().parent().show()
			if(max_images_per_layer == 0 || get_number_of_images_per_layer(layer) <= max_images_per_layer) {
				ret = draw_grid(canvas, pixel_size, colors, 1);
			} else {
				log('Too many images (simple) in layer ' + layer);
			}

			return ret;
		} else if((data_type == "kernel" || canvas_type == "kernel")) {
			var shape = get_dim(colors);

			var first_kernel = null;

			if($($(".filter_image_grid")[layer]).children().length <= parseInt($($(".layer_setting")[0]).find(".filters").val())) {
				for (var filter_id = 0; filter_id < shape[0]; filter_id++) {
					for (var channel_id = 0; channel_id < shape[1]; channel_id++) {
						canvas = get_canvas_in_class(layer, "filter_image_grid");

						$($(canvas)[0]).parent().parent().show()

						ret = draw_grid(canvas, kernel_pixel_size, colors[filter_id][channel_id], 1, 1);
						if(first_kernel === null) {
							first_kernel = colors[filter_id][channel_id];
						}
					}
				}
			}

			return ret;
		} else if(data_type == "filter") {
			var shape = get_dim(colors);

			for (var k = 0; k < shape[2]; k++) {
				if(canvas_type == "input") {
					canvas = get_canvas_in_class(layer, "input_image_grid");
				} else {
					canvas = get_canvas_in_class(layer, "image_grid");
				}
				$($(canvas)[0]).parent().parent().show()

				if(max_images_per_layer == 0 || get_number_of_images_per_layer(layer) <= max_images_per_layer) {
					ret = draw_grid_grayscale(canvas, 5, colors, k);
				} else {
					console.log('Too many images (filter) in layer ' + layer);
				}
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

	for (var i = 0; i < get_numberoflayers(); i++) {
		r.push($($(".layer_type")[i]).val());
	}

	return r;
}

function group_layers (layers) {
        var str = layers.join(";");

        var char_to_group = new Array(str.length);
        char_to_group.fill(null);

	var feature_extraction_base = "(?:(?:depthwise|separable)?conv([0-9])d(?:transpose)?;?)+;?(?:(?:batch|layer)Normalization;)*;?(?:[^;]+Pooling\\2d;?)*";

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
			"re": "((?:lstm;)+)",
			"name": "LSTM"
		},
		{ 
			"re": "((?:upSampling2d;)+)", 
			"name": "Scaling up"
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
			"re": "(" + batch_or_layer_normalization + "*(?:" + feature_extraction_base + ";?(?:dropout?;);?))", 
			"name": "Feature ex&shy;traction&amp;Over&shy;fitting pre&shy;vention"
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
			"name": "Relia&shy;bility for real data"
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

function write_descriptions () {
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
		} else if(err.includes("Failed to compile fragment shader")) {
			explanation = "This may mean that the batch-size and/or filter-size and/or image dimension resize-sizes are too large.";
		} else if(err.includes("target expected a batch of elements where each example")) {
			explanation = "The last number of neurons in the last layer may not match the number of categories.<br><br>It may also be possible that you chose a wrong Loss function. If the number of neurons match, try chosing other losses, like categoricalCrossentropy.";
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
		} else if(err.includes("numeric tensor, but got string tensor")) {
			if($("#data_type").val() == "csv" && $("#data_origin").val() == "own") {
				explanation = "Please check your CSV-file input to remove unneeded extra characters. Neither input nor output tensors should contain any strings, but only integers and floats.";
			} else {
				explanation = "Are you sure your input data is numeric?";
			}
		} else if(err.includes("input expected a batch of elements where each example has shape")) {
			explanation = "Does the input-shape match the data?";
		} else if (err.includes("Error when checking input") && err.includes("but got array with shape")) {
			if($("#data_type").val() == "csv" && $("#data_origin").val() == "own") {
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
		write_error("model is not defined");
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

function identify_layers (numberoflayers) {
	for (var i = 0; i < numberoflayers; i++) {
		$($(".layer_nr_desc")[i]).html(i + ":&nbsp;");
		var new_str = get_layer_identification(i);

		if(new_str != "") {
			new_str = new_str + ",&nbsp;";
		}

		var output_shape_string = "";
		try {
			if(i in model.layers) {
				output_shape_string = "Output:&nbsp;" + JSON.stringify(model.layers[i].getOutputAt(0).shape);
				output_shape_string = output_shape_string.replace("null,", "");
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
}

function hide_unused_layer_visualization_headers () {
	for (var i = 0; i < get_numberoflayers(); i++) {
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
					show_tab_label('layer_visualizations_tab_label');

					var output_data = applied.arraySync()[0];
					$($(".layer_data")[${i}]).html('');
					var input_data = inputs[0].arraySync()[0];

					var kernel_data = [];
					if(Object.keys(model.layers[${i}]).includes('kernel')) {
						if(model.layers[${i}].kernel.val.shape.length == 4) {
							kernel_data = model.layers[${i}].kernel.val.transpose([3, 2, 0, 1]).arraySync(); // TODO
						}
					}

					var html = $($(".layer_data")[${i}]).html();
					if($('#header_layer_visualization_${i}').length == 0) {
						html = html + "<h2 id='header_layer_visualization_${i}'>Layer ${i}: " + $($('.layer_type')[${i}]).val() + ' ' + get_layer_identification(${i}) + " [null," + get_dim(input_data) + "] -> " + JSON.stringify(model.layers[${i}].getOutputAt(0).shape) + ":</h2>";
					}
		
					if(layers_can_be_visualized()) {
						if(!draw_images_if_possible(${i}, input_data, output_data, kernel_data) && 0) {
							var weights_string = '';
							if ('weights' in this) {
								for (var j = 0; j < this['weights'].length; j++) {
									if (j in this['weights'] && 'val' in this['weights'][j]) {
										weights_string = weights_string + "\\n" + 'Weights ' + j + ': ' + JSON.stringify(this['weights'][j]['val'].arraySync(), null, "\\t");
									}
								}
							}
							if(weights_string) {
								html = html + '<pre>' + weights_string + '</pre>';
							}

							var bias_string = '';
							if ('bias' in this) {
								bias_string = "\\n" + 'Bias: ' + JSON.stringify(this['bias']['val'].arraySync(), null, "\\t") + "\\n";
							}
							if(bias_string) {
								html = html + '<pre>' + bias_string + '</pre>';
							}
							html = html + "<pre>Output layer ${i}: [" + get_dim(output_data) + "]\\n"
							html = html + JSON.stringify(output_data, null, "\\t") + '</pre>';
						}

						$($(".layer_data")[${i}]).append(html);
					}
				}
			}

			return applied;
		}`;
		eval(code);
	}
}

function zoom_kernel_images (kernel_image_zoom) {
	$(".kernel_layer_image").width($(".kernel_layer_image").width() * kernel_image_zoom);
}

function reset_zoom_kernel_images () {
	$(".kernel_layer_image").width("auto");
}

function layers_can_be_visualized () {
	for (var i = 0; i < get_numberoflayers(); i++) {
		var shape = calculate_default_target_shape(i);

		if(shape_looks_like_image_data(shape) != "unknown") {
			return true;
		}
	}
	return false;
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
	var max = x.max().dataSync()[0];
	var min = x.min().dataSync()[0];

	var x_minus_min = x.sub(min);

	x = x_minus_min.div(max - min);

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
                        console.warn("Iteration " + i + " of " + iterations);

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
	var neurons = 1;

	if(type == "conv2d") {
		neurons = parseInt(get_item_value(layer, "filters"));
	} else if (type == "dense") {
		neurons = parseInt(get_item_value(layer, "units"));
	} else {
		console.warn("Unknown layer " + layer);
		return;
	}

	log("Layer: " + layer);
	$("#maximally_activated_content").append("<h2>Layer " + layer + "</h2>")

	var times = [];

	favicon_spinner();

	var stop = 0;

	for (var i = 0; i < neurons; i++) {
		if(stop) {
			continue;
		}
		var eta = "";
		if(times.length) {
			eta = " (" + human_readable_time(parseInt((neurons - i) * median(times))) + " left)";
		}

		var swal_msg = "Image " + (i + 1) + " of " + neurons + eta;
		document.title = swal_msg;

		await Swal.fire({
			title: 'Generating Image...',
			html: swal_msg,
			timer: 2000,
			showCancelButton: true,
			showConfirmButton: false
		}).then((e)=>{
			if(e.isDismissed && e.dismiss == "cancel") {
				stop = 1;
			}
		});

		log("Set title to " + swal_msg);

		var start = Date.now();
		await draw_maximally_activated_neuron(layer, i);
		var end = Date.now();

		var time = ((end - start) / 1000) + 1;

		times.push(time);

	}

	favicon_default();

	document.title = original_title;
}

async function predict_maximally_activated (item, force_category) {
	var results = await predict(item, force_category, 1);
	if($(item).next().length && $(item).next()[0].tagName.toLowerCase() == "pre") {
		$(item).next().remove();
	}
	$(item).after("<pre class='maximally_activated_predictions'>" + results + "</pre>");
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

			var res = draw_grid(canvas, 1, data, 1, 0, "predict_maximally_activated(this, 'image')");

			if(res) {
				$("#maximally_activated_content").append(canvas);
				show_tab_label("maximally_activated_label", 1)
			} else {
				log("Res: " + res);
			}

			return res;
		}
		return false;
	} catch (e) {
		write_error(e);
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
	var str = "\\underbrace{\\begin{pmatrix}\n";

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

function get_layer_data() {
	var layers = model.layers;
	var layer_data = [];

	for (var i = 0; i < layers.length; i++) {
		var this_layer = layers[i];

		var this_layer_weights = {};

		try {
			this_layer_weights["kernel"] = Array.from(this_layer.weights[0].val.arraySync());

			if(Object.keys(this_layer.weights).includes("1")) {
				this_layer_weights["bias"] = Array.from(this_layer.weights[1].val.dataSync());
			}
		} catch (e) {}

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
	var str = model.layers[i].outputShape.toString()
	str = str.replace(/^,|,$/g,'');;
	str = "[" + str + "]";
	return str;
}

function _get_h (i) {
	return "h_{\\text{Shape: }" + get_layer_output_shape_as_string(i) + "}" + "'".repeat(i);
}

function model_to_latex () {
	var layers = model.layers;

	var input_shape = model.layers[0].input.shape;

	if(input_shape.length != 2) {
		log("Invalid input shape. Only works with input_shape that has 2 values");
		return;
	}

	var output_shape = model.layers[model.layers.length - 1].outputShape;

	if(output_shape.length != 2) {
		log("Invalid output shape. Only works with output_shape that has 2 values");
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

	var activation_string = "";
	var str = "";

	var shown_activation_equations = [];

	if(Object.keys(loss_equations).includes($("#loss").val())) {
		str += "<h2>Loss:</h2>$$" + loss_equations[$("#loss").val()] + "$$ ";
	}

	for (var i = 0; i < layer_data.length; i++) {
		var this_layer_type = $($(".layer_type")[i]).val();
		if(i == 0) {
			str += "<h2>Layers:</h2>";
		}
		str += "$$ \\text{Layer " + i + " (" + this_layer_type + "):} \\qquad ";

		if(this_layer_type == "dense") {
			var activation_name = model.layers[i].activation.constructor.className;

			if(Object.keys(activation_function_equations).includes(activation_name)) {
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
				//log("Activation name '" + activation_name + "' not found");
			}

			var activation_start = "";

			if(activation_name != "linear") {
				activation_start = "\\mathrm{\\underbrace{" + activation_name + "}_{\\mathrm{Activation}}}\\left(";
			}

			var kernel_name = "Kernel^{" + array_size(layer_data[i].kernel).join(" \\times ") + "}";

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
				str += " + " + array_to_latex_color([layer_data[i].bias], "Bias", [colors[i].bias], 1);
			} catch (e) {}

			if(activation_name != "linear") {
				str += "\\right)";
			}
		} else if (this_layer_type == "flatten") {
			var original_input_shape = JSON.stringify(model.layers[i].getInputAt(0).shape.filter(Number));
			var original_output_shape = JSON.stringify(model.layers[i].getOutputAt(0).shape.filter(Number));
			str += _get_h(i) + " = " + _get_h(i - 1) + " \\xrightarrow{\\text{Reshape}} \\text{New Shape: }" + original_output_shape;
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
					this_activation_string = this_activation_string.replaceAll("\\alpha", "{\\alpha = " + alpha + "} \\cdot ");
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
				outname = array_to_latex(y_layer, "Output") + " = ";
			} else {
				outname += _get_h(i) + " = ";
			}

			var mini_batch_mean = "\\text{Mini-Batch mean: } \\mu_\\mathcal{B} = \\frac{1}{n} \\sum_{i=1}^n x_i";

			var mini_batch_variance = "\\text{Mini-Batch variance: }\\sigma_\\mathcal{B}^2 = \\frac{1}{n} \\sum_{i = 1}^n \\left(x_i - \\mu_\\mathcal{B}\\right)^2";

			var new_x = "\\underbrace{\\frac{x_i - \\mu_\\mathcal{B}}{\\sqrt{\\sigma_\\mathcal{B}^2 + \\epsilon \\left( = " + model.layers[i].epsilon + "\\right)}}}_\\text{Normalize}";

			//var new_y = "\\underbrace{y_i}_\\text{Scale and shift} = \\gamma\\hat{x}_i + \\beta";

			str += "$$\n$$";

			str += mini_batch_mean + "$$\n$$";
			str += mini_batch_variance + "$$\n$$";
			str += outname + new_x; // + "$$\n$$" + new_y;
		} else if (this_layer_type == "dropout") {
			var dropout_rate = parseInt(parseFloat($($(".layer_setting")[i]).find(".dropout_rate").val()) * 100);
			str += "\\text{Setting " + dropout_rate + "\\% of the input values to 0 randomly}";
		} else {
			log("Invalid layer type for layer " + i + ": " + this_layer_type);
		}
		str += "$$";
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
		return false;
	}

	if(model.layers[0].input.shape.length != 2) {
		return false;
	}

	if(model.layers[model.layers.length - 1].input.shape.length != 2) {
		return false;
	}

	for (var i = 0; i < model.layers.length; i++) {
		var this_layer_type = $($(".layer_type")[i]).val();
		if(!(["dense", "flatten", "reshape", "elu", "leakyReLU", "reLU", "softmax", "thresholdedReLU", "dropout"].includes(this_layer_type))) {
			return false
		}
	}

	return true;
}

async function write_model_to_latex_to_page (reset_prev_layer_data, force) {
	if(!can_be_shown_in_latex()) {
		if(!is_hidden_or_has_hidden_parent($("#math_tab")[0])) {
			show_tab_label("fcnn_tab_label", 1);
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
			var new_md5 = md5($(math_tab_code_elem).html());
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

			assert(this_old_layer[this_key].length == this_new_layer[this_key].length, "Keys are not equal for layer data of " + layer_nr + ", key: " + this_key);

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
