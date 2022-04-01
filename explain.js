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

function draw_grid (canvas, pixel_size, colors, denormalize, black_and_white) {
	assert(typeof(pixel_size) == "number", "pixel_size must be of type number, is " + typeof(pixel_size));

	var drew_something = false;

	var width = colors[0].length;
	var height = colors.length;

	$(canvas).attr("width", width * pixel_size);
	$(canvas).attr("height", height * pixel_size);

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
				console.log('Too many images (simple) in layer ' + layer);
			}

			return ret;
		} else if((data_type == "kernel" || canvas_type == "kernel") && $("#show_kernel_images").is(":checked") && !$("#show_kernel_images").is(":disabled")) {
			var shape = get_dim(colors);

			var first_kernel = null;

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

async function plot_activation (activation) {
	if(!loaded_plotly) {
		var script = document.createElement("script");
		script.src = "plotly-latest.min.js";
		script.type = "text/javascript";
		script.onload = function () {
			loaded_plotly = 1;
			_plot_activation(activation);
		};
		document.getElementsByTagName("head")[0].appendChild(script);
	} else {
		_plot_activation(activation);
	}

}

async function _plot_activation (activation) {
	activation = get_plot_activation_name(activation); 
	let models;
	models = [activation].map(activationFunctionName => {
		// Create a model
		var my_model = tf.sequential();
		my_model.add(tf.layers.dense({
			units: 1,
			useBias: true,
			activation: activationFunctionName,
			inputDim: 1,
		}));
		my_model.compile({
			loss: 'meanSquaredError',
			optimizer: tf.train.adam(),
		});

		// this is not a valid property on LayersModel, but needed a quick way to attach some metadata
		my_model.activationFunction = activationFunctionName;
		return my_model;
	});

	tf.tidy(() => {
		models.forEach(my_model => my_model.layers[0].setWeights([tf.tensor2d([[1]]), tf.tensor1d([1])]));
	});

	const xs = tf.linspace(-5, 5, 100);

	const series = tf.tidy(() => models.map(my_model => {
		const ys = my_model.predict(xs.reshape([100, 1]));

		return {
			x: xs.dataSync(),
			y: ys.dataSync(),
			type: 'scatter',
			name: model.activationFunction,
		};
	}));

	dispose(xs);

	const functionColors = {
		sigmoid: '#8ed081',
		hardSigmoid: '#430ade',
		softplus: '#f33',
		softsign: '#8af',
		tanh: '#f4c095',
		softmax: '#e2c044',
		linear: '#d2d6ef',
		relu: '#f19a3e',
		relu6: '#b9ffb7',
		selu: '#a846a0',
		elu: '#d30c7b',
	};
	let options = {
		colorway: [activation].map(name => functionColors[name]),
		margin: {
			l: 40,
			r: 20,
			b: 20,
			t: 10,
			pad: 0,
		},
	};
	const plotElement = document.getElementById("plot");

	Plotly.newPlot("activation_plot", series, options, { displaylogo: false });

	$("#activation_plot").show();
	$("#activation_plot").parent().show();
	$("#activation_plot_name").html("Activation-function: " + activation);
	$("#activation_plot_name").show();

	write_descriptions();

	$('a[href="#visualization_tab"]').click();
	$("#activation_plot_tab_label").show();
	$("#activation_plot_tab_label").parent().show();
	$('a[href="#activation_plot_tab"]').click();
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

	var feature_extraction_base = "(?:(?:depthwise|separable)?conv([0-9])d(?:transpose)?;?)+;?(?:(?:batch|layer)Normalization;)*;?(?:[^;]+Pooling\\2d;?)";

        var descs = [
                { "re": "((?:[^;]+Pooling[0-9]D;?)+;?)", "name": "Di&shy;men&shy;sio&shy;na&shy;lity re&shy;duc&shy;tion" },
		{ "re": "((?:" + Object.keys(activations).join("|") + ")+)", "name": "Ac&shy;ti&shy;va&shy;tion fun&shy;ction" },
                { "re": "((?:dropout;?)+)", "name": "Pre&shy;vent Over&shy;fit&shy;ting" },
                { "re": "(?:(?:batch|layer)Normalization;)*(" + feature_extraction_base + "*)", "name": "Feature ex&shy;traction" },
                { "re": "(?:(?:batch|layer)Normalization;)*(" + feature_extraction_base + "*;?(?:dropout?;);?)", "name": "Feature ex&shy;traction&amp;Over&shy;fitting pre&shy;vention" },
                { "re": "((?:dense;?)+;?(?:dropout)?)", "name": "Classi&shy;fication" },
                { "re": "((?:(?:batch|layer)Normalization;?)+)", "name": "Re-scale and re-center data" },
                { "re": "((?:flatten;?)+;?)", "name": "Flatten" },
                { "re": "((?:reshape;?)+;?)", "name": "Change shape" },
                { "re": "((?:(?:gaussian[^;]|alphaDropout)+;?)+;?)", "name": "More relia&shy;bility for real-world-data" }
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

			if(1 || layer.length) {
				var right_offset = parseInt($(layer[0]).offset().left + $(layer[0]).width() + 30);

				for (var i = 0; i < groups.length; i++) {
					var keyname = Object.keys(groups[i])[0];
					var layers = groups[i][keyname];
					var last_layer_nr = layers[layers.length - 1];

					if(keyname != "null") {
						var first_layer_top = parseInt($(layer[layers[0]]).position()["top"]);
						var last_layer_bottom = $(layer[Math.max(0, last_layer_nr - 1)]).position().top + $(layer[last_layer_nr]).height();
						var height = $($(".layer_end_marker")[last_layer_nr]).offset()["top"] - $($(".layer_start_marker")[layers[0]]).offset()["top"] - 7;
						var hidden = '';
						if(is_hidden_or_has_hidden_parent($("#layers_container_left"))) {
							hidden = "display: none;";
						}
						$('<div class="descriptions_of_layers" style="top: ' + first_layer_top + 'px; left: ' + right_offset + 'px; height: ' + height + 'px;' + hidden+ '">' + keyname + '</div>').appendTo('#wizard');
					}
				}
			}
		}
	}
}

async function write_initializer_values (nr) {
	$("#visualization_tab").click();
	$("#help_tab_label").show();
	$("#help_tab_label").parent().show();
	$("#help_tab_label").click();

	$("#help_tab").html("<pre>" + await get_model_initializer_values_str(nr) + "</pre>");
}

async function get_model_initializer_values_str (nr) {
	var x;
	try {
		x = await model.layers[nr].getWeights()[0]
		x = x.toString(1)
	} catch (e) {
		console.warn("Could not get model_initializer values for " + nr + ", error: " + e);
		x = "";
	}

	return x;
}

function explain_error_msg () {
	var err = $("#error").html();
	var explanation = "";

	if(model && model.layers && model.layers.length) {
		var last_layer_name = model.layers[model.layers.length - 1].name;
		if(err.includes(last_layer_name) && err.includes("Error when checking target") && err.includes("but got array with shape")) {
			explanation = "This may mean that the number of neurons in the last layer do not conform with the data structure in the training-data-outputs.";
		} else if(err.includes("Failed to compile fragment shader")) {
			explanation = "This may mean that the batch-size and/or filter-size and/or image dimension resize-sizes are too large.";
		} else if(err.includes("target expected a batch of elements where each example")) {
			explanation = "The last number of neurons in the last layer may not match the number of categories.";
		} else if(err.includes("but got array with shape 0,")) {
			explanation = "Have you forgotten to add your own training data?";
		} else if(err.includes("texShape is undefined")) {
			explanation = "Please check if any of the output-dimensions contain '0' and if so, try to minimize the dimensionality reduction so that all zeroes disappear.";
		} else if(err.includes("info is undefined")) {
			explanation = "Have you enabled debug-mode and also stopped training early? Please try disabling debug mode and re-train.";
		} else if(err.includes("expects targets to be binary matrices")) {
			explanation = "Try choosing another loss and metric function, like Mean Squared Error (MSE) or Mean Absolute Error (MAE).";
		} else if(err.includes("numeric tensor, but got string tensor")) {
			if($("#data_type").val() == "csv" && $("#data_origin").val() == "own") {
				explanation = "Please check your CSV-file input to remove unneeded extra characters. Neither input nor output tensors should contain any strings, but only integers and floats.";
			} else {
				explanation = "Are you sure your input data is numeric?";
			}
		}
	} else {
		explanation = "No layers."
	}

	if(explanation.length) {
		$("#error").append("<br><br>" + explanation)

		write_descriptions();
	}

	$("#train_neural_network_button").html("Start training");

	//updated_page();
}

function write_layer_identification (nr, text) {
	if(text.length) {
		$($(".layer_identifier")[nr]).html(text);
	} else {
		$($(".layer_identifier")[nr]).html("");
	}
}

function get_layer_identification (i) {
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

		write_layer_identification(i, new_str + output_shape_string + activation_function_string);
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

function add_layer_debuggers () {
	$("#datalayers").html("");

	$(".layer_data").html("")

	for (var i = 0; i < model.layers.length; i++) {
		if("original_apply" in model.layers[i]) {
			eval("model.layers[" + i + "].apply = model.layers[" + i + "].original_apply;\n");
		}

		var code = "model.layers[" + i + "].original_apply = model.layers[" + i + "].apply;" +
			"model.layers[" + i +"].apply = function (inputs, kwargs) {";
				if($("#show_progress_through_layers").is(":checked")) {
					code += "(function(){ setTimeout(function(){ fcnn_fill_layer(" + i + "); },1000); })();";
				}

				code += "var z = model.layers[" + i + "].original_apply(inputs, kwargs);" +
				"$($('.call_counter')[" + i + "]).html(parseInt($($('.call_counter')[" + i + "]).html()) + 1);" +
				"return z;" +
			"}";

		eval(code);

		if ($("#show_layer_data").is(":checked") && layers_can_be_visualized()) {
			$('#layer_visualizations_tab_label').parent().parent().show();
			$('#layer_visualizations_tab_label').parent().show();
			$('#layer_visualizations_tab_label').show();

			var code = `model.layers[${i}].original_apply_real = model.layers[${i}].apply;
				model.layers[${i}].apply = function (inputs, kwargs) {
					var applied = model.layers[${i}].original_apply_real(inputs, kwargs);

					if(!disable_layer_debuggers) {
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

					return applied;
				}`;
			eval(code);
		}
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

function inputGradientAscent(m, layerIndex, filterIndex, iterations, start_image) {
        return tf.tidy(() => {
                const imageH = m.inputs[0].shape[1];
                const imageW = m.inputs[0].shape[2];
                const imageDepth = model.inputs[0].shape[3];

                // Create an auxiliary model of which input is the same as the original
                // model but the output is the output of the convolutional layer of
                // interest.
                const layerOutput = m.getLayer(null, layerIndex).output;
                const auxModel = tf.model({inputs: m.inputs, outputs: layerOutput});

                // This function calculates the value of the convolutional layer's
                // output at the designated filter index.
                const lossFunction = (input) => auxModel.apply(input, {training: true}).gather([filterIndex], 3);

                // This returned function (`gradFunction`) calculates the gradient of the
                // convolutional filter's output with respect to the input image.
                const gradFunction = tf.grad(lossFunction);

                // Form a random image as the starting point of the gradient ascent.
                var image = tf.randomUniform([1, imageH, imageW, imageDepth], 0, 1);
		if(typeof(start_image) != "undefined") {
			image = start_image;
		} else {
			image = image.mul(20).add(128);
		}

                for (var i = 0; i < iterations; ++i) {
                        console.warn("Iteration " + (i + 1) + " of " + iterations);
                        const scaledGrads = tf.tidy(() => {
                                const grads = gradFunction(image);
                                const norm = tf.sqrt(tf.mean(tf.square(grads))).add(tf.backend().epsilon());
                                // Important trick: scale the gradient with the magnitude (norm)
                                // of the gradient.
                                return grads.div(norm);
                        });
                        // Perform one step of gradient ascent: Update the image along the
                        // direction of the gradient.
                        //image = tf.clipByValue(image.add(scaledGrads), 0, 255);
			image = image.add(scaledGrads);
                }
                return deprocessImage(image).arraySync();
        });
}

async function get_image_from_url (url) {
	var tf_img = (async () => {
		let img = await load_image(url);
		tf_img = tf.browser.fromPixels(img);
		var resized_img = tf_img.
			resizeNearestNeighbor([height, width]).
			toFloat().
			expandDims();
		if($("#divide_by").val() != 1) {
			resized_img = tf.div(resized_img, parseFloat($("#divide_by").val()));
		}
		return resized_img;
	})();
	return tf_img;
}

async function draw_maximally_activated_neuron (layer, neuron) {
	var current_input_shape = get_input_shape();

	if(current_input_shape.length != 3) {
		return;
	}

	disable_layer_debuggers = 1;
	try {
		var start_image = undefined;
		if($("#dataset_category").val() == "image" && $("#use_example_image_as_base").is(":checked")) {
			var examples = [];
			await $.ajax({url: 'traindata/index.php?dataset=' + $("#dataset").val() + '&dataset_category=image&examples=1', success: function (x) { examples = x["example"]; }})

			var base_url = "traindata/image/" + $("#dataset").val() + "/example/";

			if(examples.length) {
				start_image = await get_image_from_url(base_url + "/" + examples[0]);
				start_image = start_image.div(255);
			}
		}
		var data = inputGradientAscent(model, layer, neuron, $("#max_activation_iterations").val(), start_image)[0];
		disable_layer_debuggers = 1;
		var canvas = get_canvas_in_class(layer, "maximally_activated_class");

		var res = draw_grid(canvas, parseInt($("#max_activation_pixel_size").val()), data, 1, 0);

		if(res) {
			$("#maximally_activated").append(canvas);
			$("#maximally_activated_label").parent().show();
			$("#maximally_activated_label").show().click();
		}
		$("[href='#maximally_activated']").click()

		return res;
	} catch (e) {
		log(e);
		$("#error").html(e)
		$("#error").parent().show();
		$("#visualization_tab").click();
		$("#fcnn_tab_label").click();
		write_descriptions();
		return false;
	}
}

function fcnn_fill_layer (layer_nr) {
	restart_fcnn();
	restart_lenet();

	$("[id^=fcnn_" + layer_nr + "_]").css("fill", "red");
	$("[id^=lenet_" + layer_nr + "_]").css("fill", "red");
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
		"LeakyReLU": {
			"equation": "\\mathrm{LeakyReLU}\\left(x\\right) = \\mathrm{max}\\left(0.1x, x\\right)",
			"equation_no_function_name": "\\mathrm{max}\\left(0.1REPLACEME, REPLACEME\\right)"
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

	var layer_data = get_layer_data();

	var y_layer = [];

	for (var i = 0; i < output_shape[1]; i++) {
		y_layer.push(["y_" + i]);
	}

	var colors = color_compare_old_and_new_layer_data(JSON.parse(JSON.stringify(layer_data)), JSON.parse(JSON.stringify(layer_data)));
	if(prev_layer_data.length) {
		colors = color_compare_old_and_new_layer_data(JSON.parse(JSON.stringify(prev_layer_data)), JSON.parse(JSON.stringify(layer_data)));
	}

	var input_layer = [];

	for (var i = 0; i < input_shape[1]; i++) {
		input_layer.push(["x_" + i]);
	}

	var activation_string = "";
	var str = "";

	var shown_activation_equations = [];

	for (var i = 0; i < layer_data.length; i++) {
		var this_layer_type = $($(".layer_type")[i]).val();
		str += "$$ \\text{Layer " + i + " (" + this_layer_type + "):} \\qquad ";

		if(this_layer_type == "dense") {
			var activation_name = model.layers[i].activation.constructor.className;

			if(Object.keys(activation_function_equations).includes(activation_name)) {
				if(!shown_activation_equations.includes(activation_name)) {
					var this_activation_string = activation_function_equations[activation_name]["equation"];

					var has_lower_limit = Object.keys(activation_function_equations[activation_name]).includes("upper_limit");
					var has_upper_limit = Object.keys(activation_function_equations[activation_name]).includes("upper_limit")

					var this_activation_array = [];

					if(has_lower_limit) {
						this_activation_array.push("\\text{Lower-limit: } " + activation_function_equations[activation_name]["lower_limit"]);
					}

					if(has_upper_limit) {
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

			if(i == layer_data.length - 1) {
				str += array_to_latex(y_layer, "Output") + " = " + activation_start;
				if(i == 0) {
					str += a_times_b(array_to_latex(input_layer, "Input"), array_to_latex_color(layer_data[i].kernel, "Kernel", colors[i].kernel));
				} else {
					var repeat_nr = i - 1;
					if(repeat_nr < 0) {
						repeat_nr = 0;
					}
					str += a_times_b("h" + "'".repeat(repeat_nr), array_to_latex_color(layer_data[i].kernel, "Kernel", colors[i].kernel));
				}
			} else {
				str += "h" + "'".repeat(i) + " = " + activation_start;
				if(i == 0) {
					str += a_times_b(array_to_latex(input_layer, "Input"), array_to_latex_color(layer_data[i].kernel, "Kernel", colors[i].kernel));
				} else {
					str += a_times_b("h" + "'".repeat(i - 1), array_to_latex_color(layer_data[i].kernel, "Kernel", colors[i].kernel));
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
			var original_output_shape = JSON.stringify(model.layers[1].getOutputAt(0).shape.filter(Number));
			str += "h" + "'".repeat(i) + " = h" + "'".repeat(i - 1) +"_{\\text{Shape: " + original_input_shape + "}} \\xrightarrow{\\text{Reshape}} \\text{New Shape: }" + original_output_shape;
		} else if (this_layer_type == "reshape") {
			var original_input_shape = JSON.stringify(model.layers[i].getInputAt(0).shape.filter(Number));
			var original_output_shape = JSON.stringify(model.layers[1].getOutputAt(0).shape.filter(Number));
			if(i > 1) {
				str += "h" + "'".repeat(i) + " = h" + "'".repeat(i - 1) +"_{\\text{Shape: " + original_input_shape + "}} \\xrightarrow{\\text{Reshape}} \\text{New Shape: }" + original_output_shape;
			} else {
				str += array_to_latex(input_layer, "Input") + " = h" + "_{\\text{Shape: " + original_input_shape + "}} \\xrightarrow{\\text{Reshape}} \\text{New Shape: }" + original_output_shape;
			}
		} else if (["elu", "leakyReLU", "reLU", "softmax"].includes(this_layer_type)) {
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
				prev_layer_name += "h" + "'".repeat(i - 1);
			}

			if(i == layer_data.length - 1) {
				str += array_to_latex(y_layer, "Output") + " = ";
			} else {
				str += "h" + "'".repeat(i) + " = ";
			}

			if(Object.keys(activation_function_equations).includes(activation_name)) {
				var this_activation_string = activation_function_equations[activation_name]["equation_no_function_name"];

				this_activation_string = this_activation_string.replaceAll("REPLACEME", "{" + prev_layer_name + "}");

				var has_lower_limit = Object.keys(activation_function_equations[activation_name]).includes("upper_limit");
				var has_upper_limit = Object.keys(activation_function_equations[activation_name]).includes("upper_limit")

				var this_activation_array = [];

				if(has_lower_limit) {
					this_activation_array.push("\\text{Lower-limit: } " + activation_function_equations[activation_name]["lower_limit"]);
				}

				if(has_upper_limit) {
					this_activation_array.push("\\text{Upper-limit: } " + activation_function_equations[activation_name]["upper_limit"]);
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

			if(i == 0) {
				prev_layer_name += array_to_latex(input_layer, "Input");
			} else {
				prev_layer_name += "h" + "'".repeat(i - 1);
			}

			if(i == layer_data.length - 1) {
				str += array_to_latex(y_layer, "Output") + " = ";
			} else {
				str += "h" + "'".repeat(i) + " = ";
			}

			str += "\\frac{\\left(" + prev_layer_name + " - \\text{mean}\\left(" + prev_layer_name + "\\right)\\right)}{\\sqrt{\\mathrm{variance}\\left(" + prev_layer_name + "\\right)}}";
		} else {
			log("Invalid layer type for layer " + i + ": " + this_layer_type);
		}
		str += "$$";
	}

	prev_layer_data = layer_data;

	if(activation_string && str) {
		return activation_string + "<hr>" + str;
	} else {
		if(str) {
			return str;
		}
	}
}

function can_be_shown_in_latex () {
	if(model.layers[0].input.shape.length != 2) {
		return false;
	}

	if(model.layers[model.layers.length - 1].input.shape.length != 2) {
		return false;
	}

	for (var i = 0; i < model.layers.length; i++) {
		var this_layer_type = $($(".layer_type")[i]).val();
		if(!(["dense", "flatten", "reshape", "elu", "leakyReLU", "reLU", "softmax"].includes(this_layer_type))) {
			return false
		}
	}

	return true;
}

async function write_model_to_latex_to_page (delay_code, reset_prev_layer_data) {
	if(reset_prev_layer_data) {
		prev_layer_data = [];
	}
	if(!can_be_shown_in_latex()) {
		$("#math_tab_label").hide();
		if(!is_hidden_or_has_hidden_parent($("#math_tab"))) {
			$("#fcnn_tab_label").click();
		}
		return;
	}

	$("#math_tab_label").show();

	var latex = model_to_latex();

	if(delay_code) {
		$("<div id='tmp_math_tab' style='display: none'></div>").appendTo("body");
		$("#tmp_math_tab").html(latex);

		var math_element = document.getElementById("tmp_math_tab");
		await MathJax.Hub.Queue(["Typeset", MathJax.Hub, math_element]);

		await delay(parseInt($("#math_update_interval").val()));

		$("#math_tab").html($("#tmp_math_tab").html());

		$("#tmp_math_tab").remove();
	} else {
		$("#math_tab").html(latex);
		try {
			MathJax.Hub.Queue(["Typeset", MathJax.Hub]);
		} catch (e) {
			var mathjax_error_explanation = "Are you online?";
			$("#math_tab").html("<h2>Error</h2>\n" + e + "\n<br>" + mathjax_error_explanation);
		}
	}
}

function color_compare_old_and_new_layer_data (old_data, new_data) {
	assert(old_data.length == new_data.length, "Old data and new data are vastly different. Have you changed the number of layers without resetting prev_layer_data?");

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
						color_diff[layer_nr][this_key][item_nr] = "black";
					} else {
						if(this_old_sub_array[item_nr] > this_new_sub_array[item_nr]) {
							color_diff[layer_nr][this_key][item_nr] = "red";
						} else if(this_old_sub_array[item_nr] < this_new_sub_array[item_nr]) {
							color_diff[layer_nr][this_key][item_nr] = "green";
						}
					}
				} else { // sub array contains more arrays (kernels most probably))
					color_diff[layer_nr][this_key][item_nr] = [];
					for (var kernel_nr = 0; kernel_nr < this_old_sub_array[item_nr].length; kernel_nr++) {
						if(this_old_sub_array[item_nr][kernel_nr] == this_new_sub_array[item_nr][kernel_nr]) {
							color_diff[layer_nr][this_key][item_nr][kernel_nr] = "black";
						} else {
							if(this_old_sub_array[item_nr][kernel_nr] > this_new_sub_array[item_nr][kernel_nr]) {
								color_diff[layer_nr][this_key][item_nr][kernel_nr] = "red";
							} else if(this_old_sub_array[item_nr][kernel_nr] < this_new_sub_array[item_nr][kernel_nr]) {
								color_diff[layer_nr][this_key][item_nr][kernel_nr] = "green";
							}
						}
					}
				}
			}
		}

	}

	return color_diff;
}
