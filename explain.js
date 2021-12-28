"use strict";

function get_number_of_images_per_layer (layer) {
	return $($(".image_grid")[layer]).children().length + $($(".input_image_grid")[layer]).children.length;
}

// normalize_to_rgb(-1) = 0, normalize_to_rgb(1) = 255
function normalize_to_rgb (val) {
	return parseInt(127.5 * (1 + val));
}

function get_input_canvas (layer) {
	var new_canvas = $('<canvas/>', {class: "layer_image"}).prop({
		width: 0,
		height: 0
	});
	$($('.input_image_grid')[layer]).append(new_canvas);
	return new_canvas[0];
}

function get_canvas (layer) {
	var new_canvas = $('<canvas/>', {class: "layer_image"}).prop({
		width: 0,
		height: 0
	});
	$($('.image_grid')[layer]).append(new_canvas);
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

function looks_like_image_data (data) {
	var shape = get_dim(data);
	if(shape.length == 3) {
		if(shape[2] == 3) {
			return "simple";
		} else {
			return "filter";
		}
	}
	return "unknown";
}

function draw_rect(ctx, rect){
	ctx.fillStyle=rect.fill;
	ctx.strokeStyle=rect.stroke;
	ctx.fillRect(rect.x,rect.y,rect.w,rect.h);
	ctx.strokeRect(rect.x,rect.y,rect.w,rect.h);
}

function draw_grid_grayscale (canvas, pixel_size, colors, pos) {
	var width = colors[0].length;
	var height = colors.length;

	$(canvas).attr("width", width * pixel_size);
	$(canvas).attr("height", height * pixel_size);

	var ctx = $(canvas)[0].getContext('2d');
	ctx.beginPath();
	for (var x = 0, i = 0; i < width; x += pixel_size, i++) {
		for (var y = 0, j = 0; j < height; y += pixel_size, j++) {
			var red = normalize_to_rgb(colors[j][i][pos]);
			var green = normalize_to_rgb(colors[j][i][pos]);
			var blue = normalize_to_rgb(colors[j][i][pos]);

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
		}
	}
	ctx.fill();
	ctx.closePath();
}

function draw_grid (canvas, pixel_size, colors) {
	var width = colors[0].length;
	var height = colors.length;

	$(canvas).attr("width", width * pixel_size);
	$(canvas).attr("height", height * pixel_size);

	var ctx = $(canvas)[0].getContext('2d');
	ctx.beginPath();    
	for (var x = 0, i = 0; i < width; x += pixel_size, i++) {
		for (var y = 0, j = 0; j < height; y += pixel_size, j++) {
			var red = colors[j][i][0];
			var green = colors[j][i][1];
			var blue = colors[j][i][2];

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
		}
	}
	ctx.fill();
	ctx.closePath();
}

function draw_images_if_possible (layer, input_data, output_data) {
	draw_image_if_possible(layer, 'input', input_data);
	draw_image_if_possible(layer, 'output', output_data);

	$($('.image_grid')[layer]).append("<hr>");
	
	write_descriptions();
}

function draw_image_if_possible (layer, canvas_type, colors) {
	if(canvas_type == "input" && layer != 0) {
		return;
	}

	var canvas = null;

	try {
		var data_type = looks_like_image_data(colors);
		if(data_type == "simple") {
			if(canvas_type == "input") {
				canvas = get_input_canvas(layer);
			} else {
				canvas = get_canvas(layer);
			}

			$($(canvas)[0]).parent().parent().show()
			if(max_images_per_layer == 0 || get_number_of_images_per_layer(layer) <= max_images_per_layer) {
				draw_grid(canvas, pixel_size, colors);
			} else {
				console.log('Too many images (simple) in layer ' + layer);
			}
		} else if(data_type == "filter") {
			var shape = get_dim(colors);

			for (var k = 0; k < shape[2]; k++) {
				if(canvas_type == "input") {
					canvas = get_input_canvas(layer);
				} else {
					canvas = get_canvas(layer);
				}
				$($(canvas)[0]).parent().parent().show()

				if(max_images_per_layer == 0 || get_number_of_images_per_layer(layer) <= max_images_per_layer) {
					draw_grid_grayscale(canvas, pixel_size, colors, k);
				} else {
					console.log('Too many images (filter) in layer ' + layer);
				}
			}
		}
	} catch (e) {
		console.warn(e);
	}
}

function rgbToHex(r, g, b) {
	return ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
}

function get_image_color_data(image_element) {
	var canvas = document.createElement("canvas");
	var context = canvas.getContext && canvas.getContext("2d");

	canvas.height = width; //image_element.naturalHeight || image_element.offsetHeight || image_element.height;
	canvas.width = height; //image_element.naturalWidth || image_element.offsetWidth || image_element.width;

	context.drawImage(image_element, 0, 0);

	var data = context.getImageData(0, 0, width, height);

	var length = data.data.length;

	var i = 0;

	var colors = [];

	while (i < length) {
		var hex = rgbToHex(data.data[i], data.data[i+1], data.data[i+2]);
		colors.push(hex);
		i += 4;
	}

	return colors;
}

function get_image_color_url_from_first_example () {
	var image_element_color_data = get_image_color_data($(".preview_image")[0]);
	return image_element_color_data.join(",");
}

async function Sleep(milliseconds) {
	return new Promise(resolve => setTimeout(resolve, milliseconds));
}

function get_random_color () {
	var items = [
		"Aqua", 
		"Aquamarine", 
		"BlanchedAlmond", 
		"BlueViolet", 
		"Brown", 
		"Burlywood", 
		"CadetBlue", 
		"Chartreuse", 
		"Chocolate", 
		"Coral", 
		"CornflowerBlue", 
		"Crimson", 
		"Cyan", 
		"DeepPink", 
		"DeepSkyBlue", 
		"DimGray", 
		"DodgerBlue", 
		"FireBrick", 
		"FireBrick", 
		"ForestGreen", 
		"Fuchsia", 
		"Gold", 
		"Goldenrod", 
		"Gray", 
		"Green", 
		"GreenYellow", 
		"HotPink", 
		"IndianRed", 
		"Khaki", 
		"LawnGreen", 
		"LightBlue", 
		"LightCoral", 
		"LightCoral", 
		"LightGray", 
		"LightGreen", 
		"LightPink", 
		"LightSalmon",
		"LightSeaGreen", 
		"LightSkyBlue", 
		"LightSlateGray", 
		"LightSteelBlue", 
		"Lime", 
		"LimeGreen", 
		"Magenta", 
		"Maroon", 
		"MediumAquamarine", 
		"MediumOrchid", 
		"MediumPurple", 
		"MediumSeaGreen", 
		"MediumSeaGreen", 
		"MediumSlateBlue", 
		"MediumSpringGreen", 
		"MediumVioletRed", 
		"Olive", 
		"OliveDrab", 
		"Orange", 
		"OrangeRed", 
		"Orchid", 
		"PaleGreen", 
		"PaleTurquoise", 
		"PaleVioletRed", 
		"PeachPuff", 
		"Peru", 
		"Pink", 
		"Plum", 
		"PowderBlue", 
		"Purple", 
		"RebeccaPurple", 
		"Red", 
		"RosyBrown", 
		"RoyalBlue", 
		"SaddleBrown", 
		"Salmon", 
		"SandyBrown", 
		"SeaGreen", 
		"Sienna", 
		"Sienna", 
		"Silver", 
		"SkyBlue", 
		"SlateBlue", 
		"SlateGray", 
		"SpringGreen", 
		"SteelBlue", 
		"Tan", 
		"Teal", 
		"Thistle", 
		"Tomato", 
		"Turquoise", 
		"Violet", 
		"Yellow", 
		"YellowGreen"
	];
	var item = items[Math.floor(Math.random() * items.length)];
	return item;
}

function write_svg_to_image (imgviewer, xml) {
	console.log($(imgviewer));
	$(imgviewer).html(xml);
}

function show_image (draw, imgviewer) {
	var xml = draw.node.outerHTML;
	write_svg_to_image(imgviewer, xml);
}

async function show_dropout (n, m, imgdata, img, rectangle_size) {
	var dropout_draw_nxm = SVG();

	var img_height = $(img).attr("height");
	var img_width = $(img).attr("width");

	var x = 3;

	var grid = dropout_draw_nxm.group();
	var result_grid = dropout_draw_nxm.group();

	var colors = [];
	if(imgdata !== null) {
		var arg_colors = imgdata.split(",");
		for (var i = 0; i != arg_colors.length; i++) {
			colors.push("#" + arg_colors[i]);
		}
	}

	while (colors.length != n*m) {
		colors.push(get_random_color());
	}

	var max_width_grid = img_width / 4;
	rectangle_size = Math.min(max_width_grid / (n * 2), max_width_grid / (m * 2));

	var j = 0;
	for (var m_counter = m; m_counter != 0; m_counter--) {
		for (var n_counter = n; n_counter != 0; n_counter--) {
			var x = rectangle_size * (n - n_counter);
			var y = rectangle_size * (m - m_counter);
			var item = dropout_draw_nxm.rect(rectangle_size, rectangle_size).attr({"x": x, "y": y}).fill(colors[j]);
			grid.add(item);

			j++;
		}
	}

	var k = 0;
	for (var m_counter = m; m_counter != 0; m_counter--) {
		for (var n_counter = n; n_counter != 0; n_counter--) {
			var color = colors[k];
			var x = rectangle_size * (n - n_counter);
			var y = rectangle_size * (m - m_counter);
			if(Math.random() >= 0.6) {
				color = "black";
			}
			var item = dropout_draw_nxm.rect(rectangle_size, rectangle_size).attr({"x": x, "y": y}).fill(color);
			result_grid.add(item);

			k++;
		}
	}

	var max_height_grid = rectangle_size * m;
	var function_beginning_x = 150;
	var function_beginning_width = 150;

	var function_beginning = dropout_draw_nxm.text("dropout(").font({
		family:   "Helvetica",
		size:     25,
		anchor:   "middle",
		leading:  "1.5em"
	}).attr(
		{
			"x": function_beginning_x,
			"y": max_height_grid / 1.3
		}
	);

	grid.transform({
		scale: [1, 1],
		translateX: rectangle_size * (m - m_counter)
	});

	var width_grid = rectangle_size * n;
	grid.move(function_beginning_width, 40);

	var function_middle = dropout_draw_nxm.text(") = ").font({
		family:   "Helvetica",
		size:     25,
		anchor:   "middle",
		leading:  "1.5em"
	}).attr({
		"x": function_beginning_width + function_beginning_x + width_grid,
		"y": max_height_grid / 1.3
	});

	result_grid.transform({
		scale: [1, 1],
		translateX: rectangle_size * (m - m_counter)
	});

	result_grid.move(function_beginning_width + function_beginning_x + width_grid, 40);

	dropout_draw_nxm.transform({
		scale: 1.1
	});

	show_image(dropout_draw_nxm, img);
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
		model = tf.sequential();
		model.add(tf.layers.dense({
			units: 1,
			useBias: true,
			activation: activationFunctionName,
			inputDim: 1,
		}));
		model.compile({
			loss: 'meanSquaredError',
			optimizer: tf.train.adam(),
		});

		// this is not a valid property on LayersModel, but needed a quick way to attach some metadata
		model.activationFunction = activationFunctionName;
		return model;
	});

	tf.tidy(() => {
		models.forEach(model => model.layers[0].setWeights([tf.tensor2d([[1]]), tf.tensor1d([1])]));
	});

	const xs = tf.linspace(-5, 5, 100);

	const series = tf.tidy(() => models.map(model => {
		const ys = model.predict(xs.reshape([100, 1]));

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
                { "re": "(?:(?:batch|layer)Normalization;)*((?:conv([0-9])d;?)+;?(?:(?:batch|layer)Normalization;)*;?(?:[^;]+Pooling\\2d;?)*)", "name": "Feature Ex&shy;traction" },
                { "re": "((?:dropout;?)+)", "name": "Over&shy;fitting-pre&shy;vention" },
                { "re": "((?:dense;?)+;?)", "name": "Classi&shy;fication" },
                { "re": "((?:(?:batch|layer)Normalization;?)+)", "name": "Re-scale and re-center data" },
                { "re": "((?:flatten;?)+;?)", "name": "Flatten Data" },
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

			var right_offset = parseInt($($(".layer")[0]).offset().left + $($(".layer")[0]).width() + 30);

			for (var i = 0; i < groups.length; i++) {
				var keyname = Object.keys(groups[i])[0];
				var layers = groups[i][keyname];
				var last_layer_nr = layers[layers.length - 1];

				if(keyname != "null") {
					var first_layer_top = parseInt($($(".layer")[layers[0]]).position()["top"]);
					var last_layer_bottom = $($('.layer')[Math.max(0, last_layer_nr - 1)]).position().top + $($('.layer')[last_layer_nr]).height();
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

function identify_layers () {
	for (var i = 0; i < get_numberoflayers(); i++) {
		var this_layer = $($(".layer")[i]);
		var new_str = "";
		if(
			$(this_layer.find(".filters")[0]).length &&
			$(this_layer.find(".kernel_size_x")[0]).length &&
			$(this_layer.find(".kernel_size_y")[0]).length &&
			$(this_layer.find(".kernel_size_z")[0]).length
		) {
			new_str = 
				$(this_layer.find(".filters")[0]).val() + "@" +
				$(this_layer.find(".kernel_size_x")[0]).val() + "x" +
				$(this_layer.find(".kernel_size_y")[0]).val() + "x" +
				$(this_layer.find(".kernel_size_z")[0]).val();
		} else if(
			$(this_layer.find(".filters")[0]).length &&
			$(this_layer.find(".kernel_size_x")[0]).length &&
			$(this_layer.find(".kernel_size_y")[0]).length
		) {
			new_str =
				$(this_layer.find(".filters")[0]).val() + "@" +
				$(this_layer.find(".kernel_size_x")[0]).val() + "x" +
				$(this_layer.find(".kernel_size_y")[0]).val();
		} else if(
			$(this_layer.find(".filters")[0]).length &&
			$(this_layer.find(".kernel_size_x")[0]).length
		) {
			new_str =
				$(this_layer.find(".filters")[0]).val() + "@" +
				$(this_layer.find(".kernel_size_x")[0]).val();
		} else if($(this_layer.find(".filters")[0]).length) {
			new_str = "Filters:&nbsp;" + $(this_layer.find(".filters")[0]).val();
		} else if($(this_layer.find(".units")[0]).length) {
			new_str = "Units:&nbsp;" + $(this_layer.find(".units")[0]).val();
		} else if($(this_layer.find(".dropout_rate")[0]).length) {
			new_str = "Rate:&nbsp;" + $(this_layer.find(".dropout_rate")[0]).val();
		} else if(
			$(this_layer.find(".pool_size_x")[0]).length &&
			$(this_layer.find(".pool_size_y")[0]).length &&
			$(this_layer.find(".pool_size_z")[0]).length
		) {
			new_str =
				$(this_layer.find(".pool_size_x")[0]).val() + "x" +
				$(this_layer.find(".pool_size_y")[0]).val() + "x" +
				$(this_layer.find(".pool_size_z")[0]).val()
		} else if(
			$(this_layer.find(".pool_size_x")[0]).length &&
			$(this_layer.find(".pool_size_y")[0]).length
		) {
			new_str = "Pool-Size:&nbsp;" + 	$(this_layer.find(".pool_size_x")[0]).val() + "x" + $(this_layer.find(".pool_size_y")[0]).val()
		} else if(
			$(this_layer.find(".pool_size_x")[0]).length
		) {
			new_str = "Pool-Size:&nbsp;" + $(this_layer.find(".pool_size_x")[0]).val();
		}
	
		if(new_str != "") {
			new_str = new_str + ",&nbsp;";
		}

		var output_shape_string = "";
		try {
			if(i in model.layers) {
				output_shape_string = "Output:&nbsp;" + JSON.stringify(model.layers[i].getOutputAt(0).shape);
			}
		} catch (e) {
			console.warn(e);
		}

		write_layer_identification(i, new_str + output_shape_string);
	}
}
