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

	xs.dispose();

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

function group_layers () {
	var layers = get_layer_type_array();
        var str = layers.join(";");

        var char_to_group = new Array(str.length);
        char_to_group.fill(null);

        var descs = [
                { "re": "((?:[^;]+Pooling[0-9]D;?)+;?)", "name": "Di&shy;men&shy;sio&shy;na&shy;lity re&shy;duc&shy;tion" },
		{ "re": "((?:" + Object.keys(activations).join("|") + ")+)", "name": "Ac&shy;ti&shy;va&shy;tion fun&shy;ction" },
                { "re": "(?:(?:batch|layer)Normalization;)*((?:(?:depthwise|separable)?conv([0-9])d(?:transpose)?;?)+;?(?:(?:batch|layer)Normalization;)*;?(?:[^;]+Pooling\\2d;?)*)", "name": "Feature ex&shy;traction" },
                { "re": "((?:dropout;?)+)", "name": "Over&shy;fitting-pre&shy;vention" },
                { "re": "((?:dense;?)+;?)", "name": "Classi&shy;fication" },
                { "re": "((?:(?:batch|layer)Normalization;?)+)", "name": "Re-scale and re-center data" },
                { "re": "((?:flatten;?)+;?)", "name": "Flatten" },
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
		var groups = group_layers();

		if(groups.length > 0) {
			$(".descriptions_of_layers").remove();

			var layer = $(".layer");

			var right_offset = parseInt($(layer[0]).offset().left + $(layer[0]).width() + 30);

			for (var i = 0; i < groups.length; i++) {
				var keyname = Object.keys(groups[i])[0];
				var layers = groups[i][keyname];
				var last_layer_nr = layers[layers.length - 1];

				if(keyname != "null") {
					var first_layer_top = parseInt($(layer[layers[0]]).position()["top"]);
					var last_layer_bottom = $(layer[Math.max(0, last_layer_nr - 1)]).position().top + $(layer[last_layer_nr]).height();
					var height = $($(".layer_end_marker")[last_layer_nr]).offset()["top"] - $($(".layer_start_marker")[layers[0]]).offset()["top"] - 7;
					$('<div class="descriptions_of_layers" style="top: ' + first_layer_top + 'px; left: ' + right_offset + 'px; height: ' + height + 'px;">' + keyname + '</div>').appendTo('#wizard');
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

	if(model.layers.length) {
		var last_layer_name = model.layers[model.layers.length - 1].name;
		if(err.includes(last_layer_name) && err.includes("Error when checking target") && err.includes("but got array with shape")) {
			explanation = "This may mean that the number of neurons in the last layer do not conform with the data structure in the training-data-outputs.";
		} else if(err.includes("Failed to compile fragment shader")) {
			explanation = "This may mean that the batch-size and/or filter-size and/or image dimension resize-sizes are too large.";
		}
	} else {
		explanation = "No layers."
	}

	if(explanation.length) {
		$("#error").append("<br><br>" + explanation)

		write_descriptions();
	}
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

function identify_layers () {
	for (var i = 0; i < get_numberoflayers(); i++) {
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
	$("#layerinfoscontainer").hide();

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

		if($("#debug_checkbox").is(":checked")) {
			$("#layerinfoscontainer").show();
			eval("model.layers[" + i + "].original_apply = model.layers[" + i + "].apply;" +
				"model.layers[" + i +"].apply = function (inputs, kwargs) {" +
					"var z = model.layers[" + i + "].original_apply(inputs, kwargs);" +
					"if(!disable_layer_debuggers) {\n" +
						"$(\"#datalayers\").append(\"============> Layer " + i + " (" + model.layers[i].name + ")\\n\");" +
						"if(" + i + " == 0) {" +
							"$(\"#datalayers\").append(\"Input layer " + i + ":\\n\");" +
							"$(\"#datalayers\").append(print_tensor_to_string(inputs[0]) + \"\\n\");" +
						"}" +
						"$(\"#datalayers\").append(\"Output layer " + i + ":\\n\");" +
						"$(\"#datalayers\").append(print_tensor_to_string(z) + \"\\n\");" +
					"}" +
					"return z;" +
				"}"
			);
		}

		if ($("#show_layer_data").is(":checked") && layers_can_be_visualized()) {
			$(".copy_layer_data_button").show();
			var code = "model.layers[" + i + "].original_apply_real = model.layers[" + i + "].apply;\n" +
				"model.layers[" + i + "].apply = function (inputs, kwargs) {\n" +
					"var applied = model.layers[" + i + "].original_apply_real(inputs, kwargs);\n" +

					"if(!disable_layer_debuggers) {\n" +
						"var output_data = applied.arraySync()[0];\n" +
						"$($(\".layer_data\")[" + i + "]).html('');\n" +
						"var input_data = inputs[0].arraySync()[0];\n" +

						"var kernel_data = [];\n" +
						"if(Object.keys(model.layers[" + i + "]).includes('kernel')) {\n" +
							"if(model.layers[" + i + "].kernel.val.shape.length == 4) {\n" +
								"kernel_data = model.layers[" + i + "].kernel.val.transpose([3, 2, 0, 1]).arraySync();\n" + // TODO
							"}\n" +
						"}\n" +

						"var html = $($(\".layer_data\")[" + i + "]).html();\n" +
						"if($('#header_layer_visualization_" + i + "').length == 0) {\n" +
							"html = html + \"<h2 id='header_layer_visualization_" + i + "'>Layer " + i + ": \" + $($('.layer_type')[" + i + "]).val() + ' ' + get_layer_identification(" + i + ") + \" [null,\" + get_dim(input_data) + \"] -> \" + JSON.stringify(model.layers[" + i + "].getOutputAt(0).shape) + \":</h2>\";\n" +
						"}\n" +

			
						"if(!draw_images_if_possible(" + i + ", input_data, output_data, kernel_data) && 0) {\n" +
							"var weights_string = '';\n" +
							"if ('weights' in this) {\n" +
								"for (var j = 0; j < this['weights'].length; j++) {\n" +
									"if (j in this['weights'] && 'val' in this['weights'][j]) {\n" +
										"weights_string = weights_string + \"\\n\" + 'Weights ' + j + ': ' + JSON.stringify(this['weights'][j]['val'].arraySync(), null, \"\\t\");\n" +
									"}\n" +
								"}\n" +
							"}\n" +
							"if(weights_string) {\n" +
								"html = html + '<pre>' + weights_string + '</pre>';\n" +
							"}\n" +

							"var bias_string = '';\n" +
							"if ('bias' in this) {\n" +
								"bias_string = \"\\n\" + 'Bias: ' + JSON.stringify(this['bias']['val'].arraySync(), null, \"\\t\") + \"\\n\";\n" +
							"}\n" +
							"if(bias_string) {\n" +
								"html = html + '<pre>' + bias_string + '</pre>';\n" +
							"}\n" +
							"html = html + \"<pre>Output layer " + i + ": [\" + get_dim(output_data) + \"]\\n\"\n" +
							"html = html + JSON.stringify(output_data, null, \"\\t\") + '</pre>';\n" +
						"}\n" +

						"$('#layer_visualizations_tab_label').parent().show();\n" +
						"$('#layer_visualizations_tab_label').show();\n" +
						"$($(\".layer_data\")[" + i + "]).append(html);\n" +
					"}\n" +

					"return applied;\n" +
				"}\n";
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


function inputGradientAscent(m, layerIndex, filterIndex, iterations = 40) {
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
                let image = tf.randomUniform([1, imageH, imageW, imageDepth], 0, 1)
                        .mul(20)
                        .add(128);

                for (let i = 0; i < iterations; ++i) {
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
                        image = tf.clipByValue(image.add(scaledGrads), 0, 255);
                }
                return deprocessImage(image).arraySync();
        });
}

function draw_maximally_activated_neuron (layer, neuron) {
	$("#layer_visualizations_tab_label").click()
	disable_layer_debuggers = 1;
	try {
		var data = inputGradientAscent(model, layer, neuron, $("#max_activation_iterations").val())[0];
		disable_layer_debuggers = 1;
		var canvas = get_canvas_in_class(layer, "maximally_activated_class");

		var res = draw_grid(canvas, 3, data, 1, 0);

		if(res) {
			$("#maximally_activated").append(canvas);
			$("#maximally_activated_label").parent().show();
			$("#maximally_activated_label").show().click();
		}

		return res;
	} catch (e) {
		log(e);
		$("#error").html(e)
		$("#error").parent().show();
		$("#visualization_tab").click();
		$("#fcnn_tab_label").click();
		return false;
	}
}
