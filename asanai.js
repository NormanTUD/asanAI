"use strict";

class asanAI {
	#current_epoch = 0;
	#plotly_div = "";
	#this_training_start_time = null;
	#max_number_of_images_in_grid = 50;

	#printed_msgs = [];
	#confusion_matrix_and_grid_cache = {};
	#_enable_debug = false;
	#write_tensors_info_div = "";
	#status_bar_background_color = "#262626";
	#status_bar_text_color = "#fff";
	#last_tensor_size_cpu = 0;
	#last_num_global_tensors = 0;
	#last_tensor_size_gpu = 0;
	#asanai_name = null;
	#bar_background_color = "#909090";
	#fcnn_div_name = null;
	#kernel_pixel_size_max = 50;
	#pixel_size_max = 50;
	#show_sliders = false;
	#webcam_height = null;
	#webcam_width = null;
	#is_dark_mode = false;
	#show_bars_instead_of_numbers = true;
	#max_neurons_fcnn = 32;
	#draw_internal_states = false;
	#internal_states_div = "";
	#pixel_size = 3;
	#divide_by = 1;
	#labels = [];
	#bar_width = 100;
	show_and_predict_webcam_in_div_div = null;
	#currently_switching_models = false;
	#num_channels = 3;
	#default_bar_color = "orange";
	#max_bar_color = "green";
	#kernel_pixel_size = 5;
	#model_summary_div = null;
	#started_webcam = false;
	#camera = null
	#last_video_element = null;
	#model_height = null;
	#model_width = null;
	#model = null;
	#images_to_repredict = [];
	#images_to_repredict_divs = [];
	#custom_tensors = {};

	ribbon_data = {
		"ribbon": {
			"tabs": [
				{
					"id": "file-tab",
					"title": "File",
					"backstage": {
						"content": "This is the Backstage.",
						"buttons": [
							{
								"label": "Open",
								"description": "Open a document from your computer"
							},
							{
								"label": "Save",
								"description": "Save your document to your computer"
							}
						]
					}
				},
				{
					"id": "format-tab",
					"title": "Home",
					"sections": [
						{
							"title": "Tables",
							"buttons": [
								{
									"id": "add-table-btn",
									"title": "Add Table",
									"help": "This button will add a table to your document",
									"icons": {
										"normal": "icons/normal/new-table.png",
										"hot": "icons/hot/new-table.png",
										"disabled": "icons/disabled/new-table.png"
									}
								},
								{
									"id": "open-table-btn",
									"title": "Open Table",
									"help": "This button will open a table and add it to your document",
									"icons": {
										"normal": "icons/normal/open-table.png",
										"hot": "icons/hot/open-table.png",
										"disabled": "icons/disabled/open-table.png"
									}
								},
								{
									"id": "del-table-btn",
									"title": "Remove Table",
									"help": "This button will remove the selected table from your document",
									"disabled": true,
									"icons": {
										"normal": "icons/normal/delete-table.png",
										"hot": "icons/hot/delete-table.png",
										"disabled": "icons/disabled/delete-table.png"
									}
								}
							]
						},
						{
							"title": "Pages",
							"buttons": [
								{
									"id": "add-page-btn",
									"title": "Add Page",
									"help": "This button will add a page to your document",
									"icons": {
										"normal": "icons/normal/new-page.png",
										"hot": "icons/hot/new-page.png",
										"disabled": "icons/disabled/new-page.png"
									}
								},
								{
									"id": "open-page-btn",
									"title": "Open Page",
									"help": "This button will open a page and add it to your document",
									"icons": {
										"normal": "icons/normal/open-page.png",
										"hot": "icons/hot/open-page.png",
										"disabled": "icons/disabled/open-page.png"
									}
								},
								{
									"id": "del-page-btn",
									"title": "Remove Page",
									"help": "This button will remove the selected page from your document",
									"disabled": true,
									"icons": {
										"normal": "icons/normal/delete-page.png",
										"hot": "icons/hot/delete-page.png",
										"disabled": "icons/disabled/delete-page.png"
									}
								}
							]
						},
						{
							"title": "Actions",
							"buttons": [
								{
									"id": "run-btn",
									"title": "Run",
									"help": "This button will run the program",
									"style": "background-color: lightgreen",
									"icons": {
										"normal": "icons/normal/run.png",
										"hot": "icons/hot/run.png",
										"disabled": "icons/disabled/run.png"
									}
								}
							]
						}
					]
				},
				{
					"id": "next-tab",
					"title": "Options",
					"sections": [
						{
							"title": "More Stuff",
							"buttons": [
								{
									"title": "Other Feature",
									"help": "This button will do something else",
									"icons": {
										"normal": "icons/normal/bullet-orange.png"
									}
								},
								{
									"id": "other-btn-2",
									"title": "Remove Table",
									"help": "This button will remove the selected table from your document",
									"disabled": true,
									"icons": {
										"normal": "icons/normal/delete-table.png"
									}
								}
							]
						}
					]
				}
			]
		}
	}


	constructor (...args) {
		var last_tested_tf_version = "4.11.0";
		var last_tested_jquery_version = "3.6.0";
		var last_tested_plotly_version = "2.14.0";
		var last_tested_temml_version = "0.10.14";


		this.tf_version = this.get_version(`tf.version["tfjs-core"]`, last_tested_tf_version, "tensorflow.js");
		this.jquery_version = this.get_version(`jQuery().jquery`, last_tested_jquery_version, "jQuery");
		this.plotly_version = this.get_version(`Plotly.version`, last_tested_plotly_version, "Plotly");
		this.plotly_version = this.get_version(`temml.version`, last_tested_temml_version, "temml");

		if(args.length == 1) {
			args = args[0];
			if(Object.keys(args).includes("labels")) {
				this.set_labels(args.labels);

				delete args["labels"];
			}

			if(Object.keys(args).includes("model")) {
				this.set_model(args.model);

				delete args["model"];
			}

			if(Object.keys(args).includes("model_data")) {
				if(!Object.keys(args).includes("optimizer_config")) {
					throw new Error("model_data must be used together with optimizer_config. Can only find model_data, but not optimizer_config");
				}
				this.#model = this.create_model_from_model_data(args["model_data"], args["optimizer_config"]);

				delete args["model_data"];
				delete args["optimizer_config"];
			}

			if(Object.keys(args).includes("divide_by")) {
				if(typeof(args.divide_by) == "number" || this.#looks_like_number(args.divide_by)) {
					this.#divide_by= this.#parse_float(args.divide_by);

					delete args["divide_by"];
				} else {
					throw new Error("divide_by is not a number");
				}
			}

			if(Object.keys(args).includes("max_neurons_fcnn")) {
				if(typeof(args.max_neurons_fcnn) == "number") {
					this.#max_neurons_fcnn = args.max_neurons_fcnn;

					delete args["max_neurons_fcnn"];
				} else {
					throw new Error("max_neurons_fcnn is not a number");
				}
			}

			if(Object.keys(args).includes("internal_states_div")) {
				if(typeof(args.internal_states_div) == "string") {
					this.#internal_states_div = args.internal_states_div;

					delete args["internal_states_div"];
				} else {
					throw new Error("internal_states_div is not a string");
				}
			}

			if(Object.keys(args).includes("draw_internal_states")) {
				if(typeof(args.draw_internal_states) == "boolean") {
					this.#draw_internal_states = args.draw_internal_states;

					delete args["draw_internal_states"];
				} else {
					throw new Error("draw_internal_states is not a boolean");
				}
			}


			var ignored_keys = Object.keys(args);

			if(ignored_keys.length) {
				var keys_str = `[constructor] The following keys were invalid as parameters to asanAI: ${ignored_keys.join(", ")}. Cannot initialize with wrong parameters (it's for your own safety!)`;

				throw new Error(keys_str);
			}
		} else if (args.length > 1) {
			throw new error("All arguments must be passed to asanAI in a JSON-like structure as a single parameter");
		}
	}

	create_model_from_model_data (model_data, optimizer_config) {
		this.assert(Array.isArray(model_data), "[create_model_from_model_data] model data is not an array");

		var restart_camera = false;
		if(this.#camera) {
			restart_camera = true;
			this.stop_camera();
		}

		if(!optimizer_config) {
			this.err("[create_model_from_model_data] optimizer_config cannot be left empty. It is needed for compiling the model.");
			return;
		}

		if(!typeof(optimizer_config) == "object") {
			this.err("[create_model_from_model_data] optimizer_config must be a associative array.");
			return;
		}

		if(model_data.length == 0) {
			this.err(`[create_model_from_model_data] model_data has no layers`);
			return;
		}

		var model_uuid = this.#uuidv4();
		var __model = this.tf_sequential(model_uuid);

		for (var layer_idx = 0; layer_idx < model_data.length; layer_idx++) {
			var layer = model_data[layer_idx];

			var keys = Object.keys(layer);
			this.assert(keys.length == 1, `layer ${layer_idx} has ${keys.length} values instead of 1`)

			var layer_name = keys[0];
			var layer_config = layer[layer_name];

			var code = `__model.add(tf.layers.${layer_name}(layer_config))`;

			eval(code);
		}

		if(!__model.layers.length) {
			this.err("[create_model_from_model_data] Could not add any layers.");
			return;
		}

		__model.compile(optimizer_config);

		this.set_model(__model);

		if(restart_camera) {
			this.start_camera();
		}

		return __model;
	}

	summary () {
		if(!this.#model) {
			this.err("No model given. Cannot do summary.");
			return;
		}

		this.#model.summary();
	}

	#uuidv4() {
		var res = ([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g, c =>
			(c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
		);

		return res;
	}

	get_item_value_model(layer) {
		this.assert(typeof (layer) == "number", "Layer is not an integer, but " + typeof (layer));

		var classname = this.#model.layers[layer].getClassName();

		if(!classname) {
			this.err("cannot get class name for layer " + i) ;
			return;
		}

		if(classname == "Dense") {
			return this.#model.layers[layer].units;
		} else if(classname == "Conv2D") {
			return this.#model.layers[layer].filters;
		} else if(classname == "Flatten") {
			return 0;
		} else {
			this.err(`Layer type ${classname} not yet supported`);
		}
	}

	get_units_at_layer(i, use_max_layer_size) {
		var units = undefined;
		try {
			var units = this.get_item_value_model(i);
			if(units) {
				units = this.#parse_int(units);
			} else {
				units = 0;
			}
		} catch (e) {
			console.log(e);
		}

		var max_neurons_fcnn = this.#max_neurons_fcnn;

		if(units > max_neurons_fcnn && use_max_layer_size) {
			this.log("FCNN-Visualization: Units is " + units + ", which is bigger than " + max_neurons_fcnn + ". " + max_neurons_fcnn + " is the maximum, it will get set to this for layer " + i);
			units = max_neurons_fcnn;
		}

		return units;
	}

	#get_fcnn_data () {
		var names = [];
		var units = [];
		var meta_infos = [];

		if(!this.#model) {
			this.wrn("this.#model not found for restart_fcnn");
			return;
		}

		if(!Object.keys(this.#model).includes("layers")) {
			this.wrn("this.#model.layers not found for restart_fcnn");
			return;
		}

		if(this.#model.layers.length == 0) {
			this.err("this.#model.layers.length is 0");
			return;
		}

		for (var i = 0; i < this.#model.layers.length; i++) {
			var class_name = this.#model.layers[i].getClassName();
			if(!["Dense", "Flatten", "Conv2D"].includes(class_name)) {
				continue;
			}

			var _unit = this.get_units_at_layer(i);
			if(i == 0) {
				names.push(`Input Layer`);
			} else if (i == this.#model.layers.length - 1) {
				names.push(`Output Layer`);
			} else {
				names.push(`${class_name} ${i}`);
			}

			units.push(_unit);

			var output_shape_of_layer = "";
			try { 
				output_shape_of_layer = this.#model.layers[i].outputShape;
			} catch (e) {

			}

			var kernel_size_x, kernel_size_y;

			try {
				kernel_size_x = model.layers[i].kernelSize[0]
				kernel_size_y = model.layers[i].kernelSize[1];
			} catch (e) {}

			var input_shape_of_layer = "";
			try {
				input_shape_of_layer = this.#model.layers[i].input.shape;
			} catch(e) {

			}

			meta_infos.push({
				layer_type: class_name,
				nr: i,
				input_shape: input_shape_of_layer,
				output_shape: output_shape_of_layer,
				kernel_size_x: kernel_size_x,
				kernel_size_y: kernel_size_y
			});
		}

		return [names, units, meta_infos];
	}

	restart_fcnn (divname=this.#fcnn_div_name) {
		var fcnn_data = this.#get_fcnn_data();

		if(!fcnn_data) {
			this.err("Could not get FCNN data");
			return;
		}

		var [names, units, meta_infos] = fcnn_data;

		this.#draw_new_fcnn(divname, units, names, meta_infos);
	}

	#draw_new_fcnn(...args) {
		this.assert(args.length == 4, "#draw_new_fcnn must have 4 arguments");

		var divname = args[0];
		var layers = args[1];
		var labels = args[2];
		var meta_infos = args[3];

		var $div = $("#" + divname);
		if(!$div.length) {
			this.err(`[#draw_new_fcnn] cannot use non-existant div. I cannot find #${divname}`);
			return;
		}

		var canvas = $("#__fcnn_canvas");

		if (!canvas.length) {
			var $canvas = $(`<canvas id='__fcnn_canvas'></canvas>`);
			canvas = $canvas[0];
			$("#" + divname).append(canvas);
		} else {
			canvas = canvas[0];
		}

		var ctx = canvas.getContext("2d");

		// Set canvas dimensions and background
		var canvasWidth = 800;
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

		this.#_draw_neurons_and_connections(ctx, layers, meta_infos, layerSpacing, canvasHeight, maxSpacing, maxShapeSize, maxRadius);

		this.#_draw_layers_text(layers, meta_infos, ctx, canvasHeight, canvasWidth, layerSpacing);
	}

	#_draw_layers_text (layers, meta_infos, ctx, canvasHeight, canvasWidth, layerSpacing, labels) {
		for (var i = 0; i < layers.length; i++) {
			if (labels && labels[i]) {
				ctx.beginPath();
				var font_size = Math.max(12, Math.min(6, (canvasWidth / (layers.length * 24))));
				ctx.font = font_size + "px Arial";
				if(this.is_dark_mode) {
					ctx.fillStyle = "white";
				} else {
					ctx.fillStyle = "black";
				}
				ctx.textAlign = "center";
				ctx.fillText(labels[i], (i + 1) * layerSpacing, canvasHeight - (2*24) - 5);
				ctx.closePath();
			}

			if (meta_infos && meta_infos[i]) {
				ctx.beginPath();
				var meta_info = meta_infos[i];

				var _is = meta_info.input_shape;
				var _os = meta_info.output_shape;

				var font_size = Math.max(12, Math.min(6, (canvasWidth / (layers.length * 24))));
				ctx.font = font_size + "px Arial";
				if(this.#is_dark_mode) {
					ctx.fillStyle = "white";
				} else {
					ctx.fillStyle = "black";
				}
				ctx.textAlign = "center";
				ctx.fillText("Input:  [" + _is.filter(n => n).join(", ") + "]", (i + 1) * layerSpacing, canvasHeight - (24) - 5);
				ctx.fillText("Output: [" + _os.filter(n => n).join(", ") + "]", (i + 1) * layerSpacing, canvasHeight - 5);
				ctx.closePath();
			}
		}
	}

	#_draw_neurons_or_conv2d (numNeurons, ctx, verticalSpacing, layerY, shapeType, layerX, maxShapeSize, meta_info) {
		for (var j = 0; j < numNeurons; j++) {
			ctx.beginPath();
			var neuronY = (j - (numNeurons - 1) / 2) * verticalSpacing + layerY;
			ctx.beginPath();

			if (shapeType === "circle") {
				ctx.arc(layerX, neuronY, maxShapeSize, 0, 2 * Math.PI);
				ctx.fillStyle = "white";
			} else if (shapeType === "rectangle_conv2d") {
				var _ww = meta_info["kernel_size_x"] * 3;
				var _hh = meta_info["kernel_size_y"] * 3;

				var _x = layerX - _ww / 2;
				var _y = neuronY - _hh / 2;

				ctx.rect(_x, _y, _ww, _hh);
				ctx.fillStyle = "lightblue";
			}

			ctx.strokeStyle = "black";
			ctx.lineWidth = 1;
			ctx.fill();
			ctx.stroke();
			ctx.closePath();
		}
	}


	#_draw_neurons_and_connections (ctx, layers, meta_infos, layerSpacing, canvasHeight, maxSpacing, maxShapeSize, maxRadius) {
		var _height = null;
		// Draw neurons
		for (var i = 0; i < layers.length; i++) {
			var meta_info = meta_infos[i];
			var layer_type = meta_info["layer_type"];
			var layerX = (i + 1) * layerSpacing;
			var layerY = canvasHeight / 2;
			var numNeurons = layers[i];
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
				this.#_draw_neurons_or_conv2d(numNeurons, ctx, verticalSpacing, layerY, shapeType, layerX, maxShapeSize, meta_info);
			} else if (shapeType == "rectangle_flatten") {
				_height = Math.min(650, meta_info["output_shape"][1]);
				this.#_draw_flatten(ctx, meta_info, maxShapeSize, canvasHeight, layerX, layerY, _height);
			} else {
				alert("Unknown shape Type: " + shapeType);
			}

			this.#_draw_connections_between_layers(ctx, layers, layerSpacing, meta_infos, maxSpacing, canvasHeight, layerY, layerX, maxRadius, _height);
		}
	}

	#_draw_flatten (ctx, meta_info, maxShapeSize, canvasHeight, layerX, layerY, _height) {
		if(meta_info["output_shape"]) {
			ctx.beginPath();
			var rectSize = maxShapeSize * 2;

			var layerY = canvasHeight / 2;

			var _width = rectSize;

			var _x = layerX - _width / 2;
			var _y = layerY - _height / 2;

			ctx.rect(_x, _y, _width, _height);
			ctx.fillStyle = "lightgray";

			ctx.strokeStyle = "black";
			ctx.lineWidth = 1;
			ctx.fill();
			ctx.stroke();
			ctx.closePath();
		} else {
			alert("Has no output shape");
		}
	}

	#_draw_connections_between_layers(ctx, layers, layerSpacing, meta_infos, maxSpacing, canvasHeight, layerY, layerX, maxRadius, _height) {
		// Draw connections
		for (var i = 0; i < layers.length - 1; i++) {
			var meta_info = meta_infos[i];

			var layer_type = meta_info["layer_type"];
			var layer_input_shape = meta_info["input_shape"];
			var layer_output_shape = meta_info["output_shape"];

			var currentLayerX = (i + 1) * layerSpacing;
			var nextLayerX = (i + 2) * layerSpacing;
			var currentLayerNeurons = layers[i];
			var nextLayerNeurons = layers[i + 1];

			var next_layer_type = null;
			var next_layer_input_shape = null;
			var next_layer_input_shape = null;
			var next_layer_output_shape = null;

			var last_layer_type = null;
			var last_layer_input_shape = null;
			var last_layer_input_shape = null;
			var last_layer_output_shape = null;

			if((i + 1) in meta_infos) {
				var next_meta_info = meta_infos[i + 1];
				next_layer_type = next_meta_info["layer_type"];
				next_layer_input_shape = next_meta_info["input_shape"];
				next_layer_output_shape = next_meta_info["output_shape"];
			}

			if(i > 0) {
				var last_meta_info = meta_infos[i - 1];
				last_layer_type = last_meta_info["layer_type"];
				last_layer_input_shape = last_meta_info["input_shape"];
				last_layer_output_shape = last_meta_info["output_shape"];
			}

			var force_min_y = null;
			var force_max_y = null;

			if(layer_type == "Flatten" || layer_type == "MaxPooling2D") {
				currentLayerNeurons = layer_input_shape[layer_input_shape.length - 1];
			}

			if(next_layer_type == "Flatten" || layer_type == "MaxPooling2D") {
				nextLayerNeurons = Math.min(64, next_layer_output_shape[next_layer_output_shape.length - 1]);
			}

			var currentSpacing = Math.min(maxSpacing, (canvasHeight / currentLayerNeurons) * 0.8);
			var nextSpacing = Math.min(maxSpacing, (canvasHeight / nextLayerNeurons) * 0.8);

			for (var j = 0; j < currentLayerNeurons; j++) {
				var currentNeuronY = (j - (currentLayerNeurons - 1) / 2) * currentSpacing + layerY;

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
					ctx.strokeStyle = "gray";
					ctx.stroke();
				}
			}
		}
	}

	draw_fcnn (divname=this.#fcnn_div_name, max_neurons=32) { // TODO: max neurons
		if(!divname) {
			this.err("[draw_fcnn] Cannot continue draw_fcnn without a divname");
			return;
		}
		var $divname = $("#" + divname);
		this.assert(divname.length != 1, `div by id ${divname} could not be found`);
		
		this.#fcnn_div_name = divname;

		this.restart_fcnn(divname);
	}

	is_model (_m) {
		if(!_m) {
			return false;
		}

		if(!Object.keys(_m).includes("_callHook")) {
			return false;
		}

		if(!Object.keys(_m).includes("metricsNames")) {
			this.err("The given model is a valid model, but it has not been compiled yet");
			return false;
		}

		return true;
	}

	get_version (code, last_tested, name) {
		code = "try { " + code + "} catch (e) { }";
		try {
			var res = eval(code);

			if(("" + res).includes("undefined")) {
				throw new Error("is null");
			} else if(res != last_tested) {
				this.wrn(`Your ${name}-version is ${res}, but the last tested one was ${last_tested}. Keep that in mind. It may result in errors.`);
			}

			return res;
		} catch (e) {
			if(Object.keys(e).includes("message")) {
				e = e.message;
			}

			if(("" + e).includes("is null") || ("" + e).includes("is not defined")) {
				throw new Error(`${name} is not installed or not included properly. Install ${name}, version ${last_tested}`)
			} else {
				throw new Error(e);
			}
		}
	}

	assert(condition, msg) {
		if(!condition) {
			throw new Error(msg);
		}
	}

	is_tf_tensor (arg) {
		if(typeof(arg) != "object") {
			return false;
		}

		if(!Object.keys(arg).includes("isDisposedInternal")) {
			return false;
		}

		if(!Object.keys(arg).includes("kept")) {
			return false;
		}

		return true;
	}

	#_register_tensors (...args) {
		for (var i = 0; i < args.length; i++) {
			if(this.is_tf_tensor(args[i])) {
				this.#custom_tensors["" + args[i].id] = [this.#get_stack_trace(), args[i], this.#tensor_print_to_string(args[i])];
				this.#clean_custom_tensors();
			}
		}
	}

	array_sync (...args) {
		this.#_register_tensors(...args);
		var first_tensor = args.shift();
		var res = first_tensor.arraySync();

		return res;
	}

	tf_to_int (...args) {
		this.#_register_tensors(...args);
		var first_tensor = args.shift();
		var res = first_tensor.toInt();

		this.#custom_tensors["" + res.id] = [this.#get_stack_trace(), res, this.#tensor_print_to_string(res)];
		this.#clean_custom_tensors();

		return res;
	}

	tf_to_float (...args) {
		this.#_register_tensors(...args);
		var first_tensor = args.shift();
		var res = first_tensor.toFloat();

		this.#custom_tensors["" + res.id] = [this.#get_stack_trace(), res, this.#tensor_print_to_string(res)];
		this.#clean_custom_tensors();

		return res;
	}

	tf_to_tensor (...args) {
		this.#_register_tensors(...args);
		var first_tensor = args.shift();
		var res = first_tensor.toTensor(...args);

		this.#custom_tensors["" + res.id] = [this.#get_stack_trace(), res, this.#tensor_print_to_string(res)];
		this.#clean_custom_tensors();

		return res;
	}

	tf_mean (...args) {
		this.#_register_tensors(...args);
		var res = tf.mean(...args);

		this.#custom_tensors["" + res.id] = [this.#get_stack_trace(), res, this.#tensor_print_to_string(res)];
		this.#clean_custom_tensors();

		return res;
	}

	tf_relu (...args) {
		this.#_register_tensors(...args);
		var res = tf.relu(...args);

		this.#custom_tensors["" + res.id] = [this.#get_stack_trace(), res, this.#tensor_print_to_string(res)];
		this.#clean_custom_tensors();

		return res;
	}

	tf_concat (...args) {
		this.#_register_tensors(...args);
		var first_tensor = args.shift();
		var res = first_tensor.concat(...args);

		this.#custom_tensors["" + res.id] = [this.#get_stack_trace(), res, this.#tensor_print_to_string(res)];
		this.#clean_custom_tensors();

		return res;
	}

	#expand_dims (...args) {
		this.#_register_tensors(...args);
		var res = tf.expandDims(...args);

		this.#custom_tensors["" + res.id] = [this.#get_stack_trace(), res, this.#tensor_print_to_string(res)];
		this.#clean_custom_tensors();

		return res;
	}

	tf_transpose (...args) {
		this.#_register_tensors(...args);
		var res = tf.transpose(...args);

		this.#custom_tensors["" + res.id] = [this.#get_stack_trace(), res, this.#tensor_print_to_string(res)];
		this.#clean_custom_tensors();

		return res;
	}


	tf_sub (...args) {
		this.#_register_tensors(...args);
		var res = tf.sub(...args);

		this.#custom_tensors["" + res.id] = [this.#get_stack_trace(), res, this.#tensor_print_to_string(res)];
		this.#clean_custom_tensors();

		return res;
	}

	tf_min (...args) {
		this.#_register_tensors(...args);
		var res = tf.min(...args);

		this.#custom_tensors["" + res.id] = [this.#get_stack_trace(), res, this.#tensor_print_to_string(res)];
		this.#clean_custom_tensors();

		return res;
	}

	tf_max (...args) {
		this.#_register_tensors(...args);
		var res = tf.max(...args);

		this.#custom_tensors["" + res.id] = [this.#get_stack_trace(), res, this.#tensor_print_to_string(res)];
		this.#clean_custom_tensors();

		return res;
	}

	tf_add (...args) {
		this.#_register_tensors(...args);
		var first_tensor = args[0];
		var second_arg = args[1];
		if(!Object.keys(second_arg).includes("isDisposedInternal")) {
			this.err("Error: second argument to tf_add is wrong. See stacktrace.");
			return;
		}
		var res = first_tensor.add(second_arg, ...args);

		this.#custom_tensors["" + res.id] = [this.#get_stack_trace(), res, this.#tensor_print_to_string(res)];

		this.#clean_custom_tensors();

		return res;
	}

	tf_mul (...args) {
		this.#_register_tensors(...args);
		var res = tf.mul(...args);

		this.#custom_tensors["" + res.id] = [this.#get_stack_trace(), res, this.#tensor_print_to_string(res)];
		this.#clean_custom_tensors();

		return res;
	}

	tf_div (...args) {
		this.#_register_tensors(...args);
		var res = tf.div(...args);

		this.#custom_tensors["" + res.id] = [this.#get_stack_trace(), res, this.#tensor_print_to_string(res)];
		this.#clean_custom_tensors();

		return res;
	}

	tf_moments (...args) {
		this.#_register_tensors(...args);
		var res = tf.moments(...args);

		return res;
	}

	tf_reshape (...args) {
		this.#_register_tensors(...args);
		var res = tf.reshape(...args);

		this.#custom_tensors["" + res.id] = [this.#get_stack_trace(), res, this.#tensor_print_to_string(res)];
		this.#clean_custom_tensors();

		return res;
	}

	tf_unique (...args) {
		this.#_register_tensors(...args);
		var res = tf.unique(...args);

		this.#custom_tensors["" + res.values.id] = [this.#get_stack_trace(), res.values, this.#tensor_print_to_string(res.values)];
		this.#custom_tensors["" + res.indices.id] = [this.#get_stack_trace(), res.indices, this.#tensor_print_to_string(res.indices)];
		this.#clean_custom_tensors();

		return res;
	}

	#tensor_print_to_string(_tensor) {
		if(!this.#_enable_debug) {
			return "Run asanai.enable_debug() to enable tensor printing.";
		}

		try {
			var logBackup = console.log;
			var logMessages = [];

			console.log = function () {
				logMessages.push.apply(logMessages, arguments);
			};

			_tensor.print(1);

			console.log = logBackup;

			return logMessages.join("\n");
		} catch (e) {
			if(("" + e).includes("Error: Tensor is disposed")) {
				this.wrn("tensor to be printed was already disposed");
			} else {
				this.err("tensor_print_to_string failed:", e);

			}
			return "<span class='error_msg'>Error getting tensor as string</span>";
		}
	}

	#removeTimestampAndLines(inputString) {
		try {
			// Remove the "t=\d" pattern
			const cleanedString = inputString.replace(/\?t=\d+/g, "");

			// Split the string into lines
			const lines = cleanedString.split("\n");

			// Remove the first two lines
			lines.splice(0, 2);

			// Join the remaining lines back into a single string
			const resultString = lines.join("\n");

			return resultString;
		} catch (e) {
			if(Object.keys(e).includes("message")) {
				e = e.message;
			}

			this.err("" + e);

			return "";
		}
	}

	#get_stack_trace () {
		var s = "";
		try {
			var a = {}; 
			a.debug();
		} catch(ex) {
			s = "" + ex.stack;
		}

		s = this.#removeTimestampAndLines(s);

		return s;
	};


	async #next_frame(...args) {
		this.#_register_tensors(...args);
		await tf.nextFrame(...args);
	}

	shuffleCombo (...args) {
		this.#_register_tensors(...args);
		try {
			return tf.util.shuffleCombo(...args);
		} catch (e) {
			if(Object.keys(e).includes("message")) {
				e = e.message;
			}

			this.err("" + e);
			return args;
		}
	}

	async dispose (item) { // start_tensors
		try {
			//console.trace();
			//log(item);
			if(item) {
				var tensor_id = item.id;
				tf.dispose(item);

				if(this.#custom_tensors[tensor_id]) {
					delete this.#custom_tensors[tensor_id];
				}

				await this.#next_frame();
			} else {
				/*
				this.wrn("item was empty in dispose():"); // not a real async
				console.trace();
				*/
			}

			this.#clean_custom_tensors();
		} catch (e) {
			if(Object.keys(e).includes("message")) {
				e = e.message;
			}

			this.err(e);

			return null;
		}
	}

	tf_model (...args) {
		this.#_register_tensors(...args);
		try {
			var res = tf.model(...args);

			return res;
		} catch (e) {
			if(Object.keys(e).includes("message")) {
				e = e.message;
			}

			this.err(e);

			return null;
		}
	}

	tidy (...args) {
		try {
			var res = tf.tidy(...args);

			this.#clean_custom_tensors();

			return res;
		} catch (e) {
			if(Object.keys(e).includes("message")) {
				e = e.message;
			}

			throw new Error(e);
		}
	}

	tf_sequential(model_uuid) {
		this.assert(model_uuid, "model_uuid is not defined");
		this.assert(typeof(model_uuid) == "string", "model_uuid must be a string");

		var res = tf.sequential();

		res.originalAdd = res.add;

		var asanai_this = this;

		res.add = function (...args) {
			var r = res.originalAdd(...args);

			try {
				var k = res.layers[res.layers.length - 1].kernel;
				if(k) {
					asanai_this.#custom_tensors["" + k.id] = ["UUID:" + model_uuid, k, "[kernel in tf_sequential]"];
				}
			} catch (e) {
				asanai_this.wrn(e);
			}

			try {
				var b = res.layers[res.layers.length - 1].bias;

				if(b) {
					asanai_this.#custom_tensors["" + b.id] = ["UUID:" + model_uuid, b, "[bias in tf_sequential]"];
				}
			} catch (e) {
				asanai_this.wrn(e);
			}

			asanai_this.#clean_custom_tensors();

			return r;
		};

		asanai_this.#custom_tensors["" + res.id] = ["UUID:" + model_uuid, res, "[model in tf_sequential]"];

		asanai_this.#clean_custom_tensors();

		return res;
	}

	buffer(...args) {
		this.#_register_tensors(...args);
		try {
			var res = tf.buffer(...args);

			//this.#custom_tensors["" + res.dataId.id] = [this.#get_stack_trace(), res, this.#tensor_print_to_string(res)];

			this.#clean_custom_tensors();

			return res;
		} catch (e) {
			if(Object.keys(e).includes("message")) {
				e = e.message;
			}

			this.err(e);

			return null;
		}
	}

	from_pixels (...args) {
		this.#_register_tensors(...args);


		try {
			var res = tf.browser.fromPixels(...args);

			this.#custom_tensors["" + res.dataId.id] = [this.#get_stack_trace(), res, this.#tensor_print_to_string(res)];

			this.#clean_custom_tensors();

			return res;
		} catch (e) {
			if(Object.keys(e).includes("message")) {
				e = e.message;
			}

			this.err(e);

			return null;
		}
	}

	input(...args) {
		this.#_register_tensors(...args);
		try {
			var res = tf.input(...args);

			this.#custom_tensors["" + res.id] = [this.#get_stack_trace(), res, "[input]"];

			this.#clean_custom_tensors();

			return res;
		} catch (e) {
			if(Object.keys(e).includes("message")) {
				e = e.message;
			}

			this.err(e);

			return null;
		}
	}

	ones(...args) {
		this.#_register_tensors(...args);
		try {
			var res = tf.ones(...args);

			this.#custom_tensors["" + res.dataId.id] = [this.#get_stack_trace(), res, this.#tensor_print_to_string(res)];

			this.#clean_custom_tensors();

			return res;
		} catch (e) {
			if(Object.keys(e).includes("message")) {
				e = e.message;
			}

			this.err(e);

			return null;
		}
	}

	reshape(...args) {
		this.#_register_tensors(...args);
		try {
			var res = tf.reshape(...args);

			this.#custom_tensors["" + res.dataId.id] = [this.#get_stack_trace(), res, this.#tensor_print_to_string(res)];

			this.#clean_custom_tensors();

			return res;
		} catch (e) {
			if(Object.keys(e).includes("message")) {
				e = e.message;
			}

			this.err(e);

			return null;
		}
	}

	min(...args) {
		this.#_register_tensors(...args);
		try {
			var res = tf.min(...args);

			this.#custom_tensors["" + res.dataId.id] = [this.#get_stack_trace(), res, this.#tensor_print_to_string(res)];

			this.#clean_custom_tensors();

			return res;
		} catch (e) {
			if(Object.keys(e).includes("message")) {
				e = e.message;
			}

			this.err(e);

			return null;
		}
	}

	max(...args) {
		this.#_register_tensors(...args);
		try {
			var res = tf.max(...args);

			this.#custom_tensors["" + res.dataId.id] = [this.#get_stack_trace(), res, this.#tensor_print_to_string(res)];

			this.#clean_custom_tensors();

			return res;
		} catch (e) {
			if(Object.keys(e).includes("message")) {
				e = e.message;
			}

			this.err(e);

			return null;
		}
	}

	add(...args) {
		this.#_register_tensors(...args);
		try {
			var res = tf.add(...args);

			this.#custom_tensors["" + res.dataId.id] = [this.#get_stack_trace(), res, this.#tensor_print_to_string(res)];

			this.#clean_custom_tensors();

			return res;
		} catch (e) {
			if(Object.keys(e).includes("message")) {
				e = e.message;
			}

			this.err(e);

			return null;
		}
	}

	abs(...args) {
		this.#_register_tensors(...args);
		try {
			var res = tf.abs(...args);

			this.#custom_tensors["" + res.dataId.id] = [this.#get_stack_trace(), res, this.#tensor_print_to_string(res)];

			this.#clean_custom_tensors();

			return res;
		} catch (e) {
			if(Object.keys(e).includes("message")) {
				e = e.message;
			}

			this.err(e);

			return null;
		}
	}

	async tf_data_webcam (...args) {
		this.#_register_tensors(...args);
		try {
			var res = await tf.data.webcam(...args);

			this.#clean_custom_tensors();

			return res;
		} catch (e) {
			if(Object.keys(e).includes("message")) {
				e = e.message;
			}

			this.err(e);

			return null;
		}
	}

	#resizeImage (...args) {
		return this.#resizeBilinear(...args);
	}

	#resizeNearestNeighbor(...args) {
		this.#_register_tensors(...args);
		try {
			var res = tf.image.resizeNearestNeighbor(...args);

			this.#custom_tensors["" + res.dataId.id] = [this.#get_stack_trace(), res, "[#resizeNearestNeighbor]"];

			this.#clean_custom_tensors();

			return res;
		} catch (e) {
			if(Object.keys(e).includes("message")) {
				e = e.message;
			}

			this.err(e);

			return null;
		}
	}

	#resizeBilinear(...args) {
		this.#_register_tensors(...args);
		try {
			var res = tf.image.resizeBilinear(...args);

			this.#custom_tensors["" + res.dataId.id] = [this.#get_stack_trace(), res, "[resizeBilinear]"];

			this.#clean_custom_tensors();

			return res;
		} catch (e) {
			if(Object.keys(e).includes("message")) {
				e = e.message;
			}

			this.err(e);

			return null;
		}
	}

	#rotateWithOffset (...args) {
		this.#_register_tensors(...args);
		try {
			var res = tf.image.rotateWithOffset(...args);

			this.#custom_tensors["" + res.dataId.id] = [this.#get_stack_trace(), res, this.#tensor_print_to_string(res)];

			this.#clean_custom_tensors();

			return res;
		} catch (e) {
			if(Object.keys(e).includes("message")) {
				e = e.message;
			}

			this.err(e);

			return null;
		}
	}

	#flipLeftRight (...args) {
		this.#_register_tensors(...args);
		try {
			var res = tf.image.flipLeftRight(...args);

			this.#custom_tensors["" + res.dataId.id] = [this.#get_stack_trace(), res, this.#tensor_print_to_string(res)];

			this.#clean_custom_tensors();

			return res;
		} catch (e) {
			if(Object.keys(e).includes("message")) {
				e = e.message;
			}

			this.err(e);

			return null;
		}
	}

	#clipByValue (...args) {
		this.#_register_tensors(...args);
		try {
			var res = tf.clipByValue(...args);

			this.#custom_tensors["" + res.dataId.id] = [this.#get_stack_trace(), res, this.#tensor_print_to_string(res)];

			this.#clean_custom_tensors();

			return res;
		} catch (e) {
			if(Object.keys(e).includes("message")) {
				e = e.message;
			}

			this.err(e);

			return null;
		}
	}

	#randomUniform (...args) {
		this.#_register_tensors(...args);
		try {
			var res = tf.randomUniform(...args);

			this.#custom_tensors["" + res.dataId.id] = [this.#get_stack_trace(), res, this.#tensor_print_to_string(res)];

			this.#clean_custom_tensors();

			return res;
		} catch (e) {
			if(Object.keys(e).includes("message")) {
				e = e.message;
			}

			this.err(e);

			return null;
		}
	}

	tf_square (...args) {
		this.#_register_tensors(...args);
		try {
			var res = tf.square(...args);

			this.#custom_tensors["" + res.dataId.id] = [this.#get_stack_trace(), res, this.#tensor_print_to_string(res)];

			this.#clean_custom_tensors();

			return res; 
		} catch (e) {
			if(Object.keys(e).includes("message")) {
				e = e.message;
			}

			this.err(e);

			return null;
		}
	}

	tf_mean (...args) {
		this.#_register_tensors(...args);
		try {
			var res = tf.mean(...args);

			this.#custom_tensors["" + res.dataId.id] = [this.#get_stack_trace(), res, this.#tensor_print_to_string(res)];

			this.#clean_custom_tensors();

			return res;
		} catch (e) {
			if(Object.keys(e).includes("message")) {
				e = e.message;
			}

			this.err(e);

			return null;
		}
	}

	sqrt (...args) {
		this.#_register_tensors(...args);
		try {
			var res = tf.sqrt(...args);

			this.#custom_tensors["" + res.dataId.id] = [this.#get_stack_trace(), res, this.#tensor_print_to_string(res)];

			this.#clean_custom_tensors();

			return res;
		} catch (e) {
			if(Object.keys(e).includes("message")) {
				e = e.message;
			}

			this.err(e);

			return null;
		}
	}

	tensor1d (...args) {
		this.#_register_tensors(...args);
		try {
			var res = tf.tensor1d(...args);

			this.#custom_tensors["" + res.dataId.id] = [this.#get_stack_trace(), res, this.#tensor_print_to_string(res)];

			this.#clean_custom_tensors();

			return res;
		} catch (e) {
			if(Object.keys(e).includes("message")) {
				e = e.message;
			}

			this.err(e);

			return null;
		}
	}

	tensor2d (...args) {
		this.#_register_tensors(...args);
		try {
			var res = tf.tensor2d(...args);

			this.#custom_tensors["" + res.dataId.id] = [this.#get_stack_trace(), res, this.#tensor_print_to_string(res)];

			this.#clean_custom_tensors();

			return res;
		} catch (e) {
			if(Object.keys(e).includes("message")) {
				e = e.message;
			}

			this.err(e);

			return null;
		}
	}

	tensor (...args) {
		this.#_register_tensors(...args);
		try {
			var res = tf.tensor(...args);

			this.#custom_tensors["" + res.id] = [this.#get_stack_trace(), res, this.#tensor_print_to_string(res)];

			this.#clean_custom_tensors();

			return res;
		} catch (e) {
			if(Object.keys(e).includes("message")) {
				e = e.message;
			}

			this.err(e);

			return null;
		}
	}

	grad (...args) {
		this.#_register_tensors(...args);
		try {
			var res = tf.grad(...args);

			return res;
		} catch (e) {
			if(Object.keys(e).includes("message")) {
				e = e.message;
			}

			this.err(e);

			return null;
		}
	}

	divNoNan (...args) {
		this.#_register_tensors(...args);
		try {
			var res = tf.divNoNan(...args);

			this.#custom_tensors["" + res.id] = [this.#get_stack_trace(), res, this.#tensor_print_to_string(res)];

			this.#clean_custom_tensors();

			return res;
		} catch (e) {
			if(Object.keys(e).includes("message")) {
				e = e.message;
			}

			this.err(e);

			return null;
		}
	}

	one_hot (...args) {
		this.#_register_tensors(...args);
		try {
			var res = tf.oneHot(...args);

			this.#custom_tensors[res.id] = [this.#get_stack_trace(), res, this.#tensor_print_to_string(res)];

			this.#clean_custom_tensors();

			return res;
		} catch (e) {
			if(Object.keys(e).includes("message")) {
				e = e.message;
			}

			this.err(e);

			return null;
		}
	}

	#clean_custom_tensors () {
		var keys = Object.keys(this.#custom_tensors);

		if(!keys.length) {
			return;
		}
		var disposed_keys = [];

		for (var i in keys) {
			var key = keys[i];

			try {
				if(!Object.keys(this.#custom_tensors).includes(key) || this.#custom_tensors[key][1].isDisposedInternal || this.#custom_tensors[key][1].isDisposed) {
					disposed_keys.push(key);
				}
			} catch (e) {
				if(("" + e).includes("this.#custom_tensors[key] is undefined")) {
					//
				} else {
					this.wrn(e);
				}
			}
		}

		for (var i in disposed_keys) {
			delete this.#custom_tensors[disposed_keys[i]];
		}
	}

	#parse_int (...args) {
		var res = parseInt(...args);

		if(isNaN(res)) {
			this.wrn("NaN detected in #parse_int, args: " + JSON.stringify(args));
			console.trace();
		}

		return res;
	}

	#parse_float (...args) {
		var res = parseFloat(...args);

		if(isNaN(res)) {
			this.wrn("NaN detected in #parse_float, args: " + JSON.stringify(args));
			console.trace();
		}

		return res;
	}

	async loadLayersModel (...args) {
		this.#_register_tensors(...args);
		try {
			var res = await tf.loadLayersModel(...args);

			return res;
		} catch (e) {
			if(Object.keys(e).includes("message")) {
				e = e.message;
			}

			this.err(e);

			return null;
		}
	}

	toPixels (...args) {
		this.#_register_tensors(...args);
		try {
			var res = tf.browser.toPixels(...args);

			return res;
		} catch (e) {
			if(Object.keys(e).includes("message")) {
				e = e.message;
			}

			this.err(e);

			return null;
		}
	}

	wrn (...msgs) {
		var msg = "";
		for (var i = 0; i < msgs.length; i++) {
			if(Object.keys(msgs[i]).includes("message")) {
				msgs[i] = msgs[i].message;
			}

			console.warn(msgs[i]);
		}

		msg = msgs.join("\n");

		$("#__status__bar__log").html("[WARN] " + msg);

		return msg;
	}

	log (...msgs) {
		var msg = "";
		for (var i = 0; i < msgs.length; i++) {
			if(Object.keys(msgs[i]).includes("message")) {
				msgs[i] = msgs[i].message;
			}

			console.log(msgs[i]);
		}

		msg = msgs.join("\n");

		$("#__status__bar__log").html(msg);
		$("#__loading_screen__text").html(msg);

		return msg;
	}

	dbg (...msgs) {
		var msg = "";
		for (var i = 0; i < msgs.length; i++) {
			if(Object.keys(msgs[i]).includes("message")) {
				msgs[i] = msgs[i].message;
			}

			console.debug(msgs[i]);
		}

		msg = msgs.join("\n");

		//$("#__status__bar__log").html("[DEBUG] " + msg);

		return msg;
	}

	err (...msgs) {
		var msg = "";
		for (var i = 0; i < msgs.length; i++) {
			if(Object.keys(msgs[i]).includes("message")) {
				msgs[i] = msgs[i].message;
			}

			console.error(msgs[i]);
		}

		msg = msgs.join("\n");

		$("#__status__bar__log").html("[ERROR] " + msg);
		$("#__loading_screen__text").html("[ERROR] " + msg);

		return msg;
	}

	get_model () {
		return this.#model;
	}

	#redo_what_has_to_be_redone (_restart_webcam) {
		if(this.#model.input.shape.length == 4) {
			this.#model_height = this.#model.input.shape[1];
			this.#model_width = this.#model.input.shape[2];
			this.#num_channels = this.#model.input.shape[3];
		}

		if(this.#fcnn_div_name) {
			this.restart_fcnn();
		}

		if(this.#model_summary_div) {
			this.write_model_summary();
		}

		if(_restart_webcam) {
			this.start_camera();
		}

		if(this.#images_to_repredict) {
			for (var i = 0; i < this.#images_to_repredict.length; i++) {
				var this_img_element_xpath = this.#images_to_repredict[i];
				var this_img_element = this.get_elements_by_xpath(this_img_element_xpath);
				if($(this_img_element).length) {
					var this_div_element = this.#images_to_repredict_divs[i];

					this.predict_image(this_img_element, this_div_element, false, false);
				} else {
					this.err(`[set_model] Cannot find element by xpath for reprediction: ${this_img_element_xpath}`);
				}
			}
		} else {
			this.dbg(`[set_model] No images to repredict`);
		}
	}

	set_model (_m) {
		if(!this.is_model(_m)) {
			throw new Error("[set_model] Given item is not a valid model");
			return;
		}

		this.#currently_switching_models = true;

		var _restart_webcam = 0;
		if(this.#started_webcam) {
			this.stop_camera();
			_restart_webcam = 1;
		}

		this.#model = _m;

		this.#redo_what_has_to_be_redone(_restart_webcam);

		this.#currently_switching_models = false;
		return this.#model;
	}

	get_elements_by_xpath (STR_XPATH) {
		this.assert(typeof(STR_XPATH) == "string", "[get_element_xpath] Parameter is not string, but " + typeof(STR_XPATH));

		var xresult = document.evaluate(STR_XPATH, document, null, XPathResult.ANY_TYPE, null);
		var xnodes = [];
		var xres;
		while (xres = xresult.iterateNext()) {
			xnodes.push(xres);
		}

		return xnodes;
	}

	stop_camera (item) {
		this.#started_webcam = false;
		if(this.#camera) {
			this.#camera.stop()
		}

		this.#camera = null;

		$(this.#last_video_element).hide();
		$("#" + this.show_and_predict_webcam_in_div_div).hide();

		if(item) {
			$(item).text("Start webcam");
		}
	}

	start_camera (item) {
		this.#started_webcam = true;
		if(this.webcam_prediction_div_name) {
			try {
				this.show_and_predict_webcam_in_div(this.webcam_prediction_div_name, this.#webcam_height, this.#webcam_width);
			} catch (e) {
				if(Object.keys(e).includes("message")) {
					e = e.message;
				}

				if(("" + e).includes("The fetching process for the")) {
					this.err("[start_camera] This error may happen when switching models: " + e);
				} else {
					throw new Error("" + e);
				}
			}
		}

		$(this.#last_video_element).show();
		$("#" + this.show_and_predict_webcam_in_div_div).show();

		if(item) {
			$(item).text("Stop webcam");
		}
	}

	get_webcam () {
		return this.#camera;
	}

	async toggle_webcam (item=null) {
		if(this.#camera) {
			this.stop_camera(item);
		} else {
			this.start_camera(item);
		}


	}

	#tensor_shape_fits_input_shape (tensor_shape, model_shape) {
		this.assert(Array.isArray(tensor_shape), "tensor_shape is not an array");
		this.assert(Array.isArray(model_shape), "model_shape is not an array");

		if(tensor_shape.length != model_shape.length) {
			this.wrn(`#tensor_shape_fits_input_shape failed. Different number of values: tensor_shape: [${tensor_shape.join(", ")}], model_shape: [${model_shape.join(", ")}]`);
			return false;
		}


		var mismatch = 0;

		for (var i = 0; i < tensor_shape.length; i++) {
			if (!(tensor_shape[i] == model_shape[i] || model_shape[i] === null || model_shape[i] === undefined)) {
				mismatch++;
			}
		}

		if(mismatch) {
			return false;
		} else {
			return true;
		}
	}

	#get_element_xpath(element) {
		this.assert(typeof (element) == "object", "item is not an object but " + typeof (element));

		const idx = (sib, name) => sib
			? idx(sib.previousElementSibling, name || sib.localName) + (sib.localName == name)
			: 1;
		const segs = elm => !elm || elm.nodeType !== 1
			? [""]
			: elm.id && document.getElementById(elm.id) === elm
				? [`id("${elm.id}")`]
				: [...segs(elm.parentNode), `${elm.localName.toLowerCase()}[${idx(elm)}]`];
		return segs(element).join("/");
	}

	#show_images_to_be_predicted () {
		var elements = [];
		for (var i = 0; i < this.#images_to_repredict.length; i++) {
			var _xpath = this.#images_to_repredict[i];
			var _elements = this.get_element_by_xpath(_xpath);
			var this_div_element = this.#images_to_repredict_divs[i];
			elements.push(_elements, this_div_element)
		}

		for (var i = 0; i < elements.length; i++) {
			$(elements[i]).show();
		}
	}

	get_element_by_xpath (path) {
		return document.evaluate(path, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
	}

	#hide_images_to_be_predicted () {
		var elements = [];
		for (var i = 0; i < this.#images_to_repredict.length; i++) {
			var _xpath = this.#images_to_repredict[i];
			var _elements = this.get_element_by_xpath(_xpath);
			var this_div_element = this.#images_to_repredict_divs[i];
			elements.push(_elements, this_div_element)
		}

		for (var i = 0; i < elements.length; i++) {
			$(elements[i]).hide();
		}
	}

	predict_image (img_element_or_div, write_to_div="", _add_to_repredict=true, _add_on_click_repredict=false) {
		this.assert(typeof(_add_to_repredict) == "boolean", "_add_to_repredict is not a boolean");
		this.assert(typeof(_add_on_click_repredict) == "boolean", "_add_on_click_repredict is not a boolean");
		this.assert(img_element_or_div, "img_element_or_div is empty");

		if(!this.#model) {
			this.err(`[predict_image] Cannot predict image without a loaded model`);
			return;
		}

		if(write_to_div) {
			if(typeof(write_to_div) == "string") {
				var $write_to_div = $("#" + write_to_div);
				if($write_to_div.length == 1) {
					write_to_div = $write_to_div[0];
				} else {
					this.err(`[predict_image] Could not find div to write to by id ${write_to_div}`);
					return;
				}
			} else if(!write_to_div instanceof HTMLElement) {
				this.err(`[predict_image] write_to_div is not a HTMLElement`);
				return;
			}
		}

		if(typeof(img_element_or_div) == "string") {
			var $img_element_or_div = $("#" + img_element_or_div);
			if($img_element_or_div.length == 1) {
				img_element_or_div = $img_element_or_div[0];
			} else {
				this.err(`[predict_image] Cannot find exactly one element titled ${img_element_or_div}`);
				return;
			}
		}

		this.assert(img_element_or_div, "img_element_or_div is empty");

		var valid_tags = ["CANVAS", "IMG"];
		var img_tag_name;

		if (img_element_or_div instanceof jQuery || Array.isArray(img_element_or_div)){
			img_element_or_div = img_element_or_div[0];
		}

		img_tag_name = img_element_or_div.tagName;

		this.assert(img_tag_name, "img_tag_name is empty!");

		if(!valid_tags.includes(img_tag_name)) {
			this.err(`[predict_image] Element found, but is not valid tag. Is: ${img_tag_name}, but should be in [${valid_tags.join(", ")}]`);
			return;
		}

		var model_input_shape = this.#model.input.shape;

		if(this.#model.input.shape.length != 4) {
			this.err(`[predict_image] Input shape does not have 4 elements, it is like this: [${this.#model.input.shape.join(", ")}]`);

			this.#hide_images_to_be_predicted()

			return;
		}

		this.#show_images_to_be_predicted()

		var _height = model_input_shape[1];
		var _width = model_input_shape[2];

		var data = this.tidy(() => {
			var image_tensor = this.#expand_dims(this.from_pixels(img_element_or_div, this.#num_channels));
			image_tensor = this.#resizeImage(image_tensor, [_height, _width]);
			return image_tensor;
		});

		var result = this.predict(data);

		if(write_to_div) {
			this.#_show_output(result, write_to_div);
		}

		var result_array  = this.tidy(() => { return this.array_sync(result) });
		this.dispose(data);
		this.dispose(result);

		if(_add_to_repredict) {
			var _xpath = this.#get_element_xpath(img_element_or_div);
			if(!this.#images_to_repredict.includes(img_element_or_div)) {
				this.#images_to_repredict.push(_xpath);
				this.#images_to_repredict_divs.push(write_to_div);
			}
		}

		if(_add_on_click_repredict) {
			if($(img_element_or_div).attr("onclick")) {
				this.dbg(`[predict_image] Element already has onclick. Not adding a new one.`);
			} else {
				var write_to_div_id = $(write_to_div).attr("id");
				if(write_to_div_id) {
					if(!this.#asanai_name) {
						this.err(`[predict_image] To call this function, run "asanai_object.set_asanai_name('asanai_object')". This is needed to define onclick functions that go back to this class, and I cannot determine the object's variable name by myself.`);
						return;
					} else {
						$(img_element_or_div).attr("onclick", `${this.#asanai_name}.predict_image(this, ${write_to_div_id})`);
					}
				} else {
					this.err(`[predict_image] Could not attach onclick handler to element: write_to_div element has no ID`);
				}
			}
		}

		return result;
	}

	predict (_tensor) {
		if(!this.#model) {
			this.err("[predict] Cannot predict without a model");
			return;
		}

		if(!this.#model.input) {
			this.err("[predict] Cannot predict without a model.input");
			return;		
		}

		if(!this.#model.input.shape) {
			this.err("[predict] Cannot predict without a model.input.shape");
			return;		
		}

		if(this.#num_channels != 3) {
			this.#num_channels = 3;
			this.wrn(`[predict] Setting num_channels to 3, because webcam data does not have transparency.`);
		}

		if(!this.#tensor_shape_fits_input_shape(_tensor.shape, this.#model.input.shape)) {
			this.err(`[predict] Tensor does not fit model shape. Not predicting. Tensor shape: [${_tensor.shape.join(", ")}], model_shape: [${this.#model.input.shape.join(", ")}].`)
			return;
		}

		if(this.#looks_like_number("" + this.#divide_by)) {
			_tensor = tf.tidy(() => {
				var new_tensor = tf.div(_tensor, this.#divide_by);
				return new_tensor;
			});
		}

		var output;
		try {
			var asanai_this = this;

			output = asanai_this.tidy(() => {
				return this.tf_to_float(_tensor);
			});
		} catch (e) {
			if(Object.keys(e).includes("message")) {
				e = e.message;
			}

			this.err("" + e);
			return;
		}

		for (var i = 0; i < this.#model.layers.length; i++) {
			var input = output;
			try {
				output = this.#model.layers[i].apply(input)
			} catch (e) {
				if(Object.keys(e).includes("message")) {
					e = e.message;
				}

				this.err("" + e);
				return;
			}

			if(this.#draw_internal_states) {
				if(i == 0 && this.#show_sliders) {
					var __parent = $("#" + this.#internal_states_div);
					if(__parent.length && $("#" + this.#internal_states_div).find(".show_internals_slider").length == 0) {
						var _html = this.#show_internals_slider(
							this.#pixel_size,
							this.#pixel_size_max,
							this.#kernel_pixel_size,
							this.#kernel_pixel_size_max
						);

						__parent.append($(_html));
					} else {
						this.dbg(`[predict] Could not find $("#" + this.#internal_states_div) = $("#${this.#internal_states_div}")`);
					}
				}
				try {
					var asanai_this = this;
					this.tidy(() => {
						asanai_this.#_draw_internal_states(i, input, output);
					});
				} catch (e) {
					if(Object.keys(e).includes("message")) {
						e = e.message;
					}

					this.err("" + e);
				}
			}

			this.dispose(input);
		}

		this.dispose(_tensor);

		return output;
	}

	async show_and_predict_webcam_in_div(divname=this.show_and_predict_webcam_in_div_div, _w, _h) {
		var $divname = $("#" + divname);
		this.assert(divname.length != 1, `[show_and_predict_webcam_in_div] div by id ${divname} could not be found`);	

		if(!this.#model) {
			this.#started_webcam = false;
			this.err("[show_and_predict_webcam_in_div] Cannot predict without a loaded model");
			return;
		}

		if(!this.#model.input.shape.length == 4) {
			this.#started_webcam = false;
			this.err(`[show_and_predict_webcam_in_div] Model input shape but be image like [b, h, w, c], but is: ${this.#model.input.shape.join(", ")}`);
			return;
		}

		this.show_and_predict_webcam_in_div_div = divname;

		this.webcam_prediction_div_name = divname;

		if(!_w) {
			_w = 300;
			this.#webcam_width = _w;
		}

		if(!_h) {
			_h = 300;
			this.#webcam_height = _h;
		}

		var $video_element = $divname.find("#" + divname + "_webcam_element");
		var $desc = $divname.find(".desc");

		if($video_element.length > 1) {
			this.wrn(`More than one video element found #${divname}. Using the first one`);
			$video_element = $video_element[0];
		} else if ($video_element.length) {
			$video_element = $video_element[0];
		} else {
			$video_element = $(`<video id="${divname}_webcam_element" width=${_w} height=${_h}></video>`)

			$divname.append($video_element);

			$video_element = $video_element[0];
		}

		this.#last_video_element = $video_element;

		if($desc.length > 1) {
			this.wrn(`More than one description element found #${divname}. Using the first one`);
			$desc = $desc[0];
		} else if ($desc.length) {
			$desc = $desc[0];
		} else {
			$desc = $(`<span class='desc'></span>`)

			$divname.append($desc);

			$desc = $desc[0];
		}

		this.#started_webcam = true;
		try {
			this.#camera = await tf.data.webcam($video_element);
		} catch (e) {
			if(Object.keys(e).includes("message")) {
				e = e.message;
			}

			if(("" + e).includes("The fetching process for the")) {
				this.err("[show_and_predict_webcam_in_div] " + e)
				return;
			} else {
				throw new Error(e);
			}
		}

		while (this.#started_webcam) {
			if(this.#internal_states_div) {
				$("#" + this.#internal_states_div).html("");			
			}

			var image;
			try {
				if(this.#camera) {
					image = await this.#camera.capture();
				} else {
					throw new Error("camera is null");
				}
			} catch (e) {
				if(Object.keys(e).includes("message")) {
					e = e.message;
				}

				if(("" + e).includes("is null") || ("" + e).includes("thrown converting video to pixels")) {
					this.err(`[show_and_predict_webcam_in_div] camera is null. Stopping webcam.`);
					this.stop_camera();
					return;
				} else {
					throw new Error(e);
				}
			}

			var asanai_this = this;

			if(!this.#model) {
				this.err(`[show_and_predict_webcam_in_div] model not defined`);
				return;
			}

			if(!image) {
				this.err(`[show_and_predict_webcam_in_div] image is empty. Cannot continue.`);
				return;
			}

			var worked = this.tidy(() => {
				try {
					var _data = asanai_this.#resizeImage(image, [asanai_this.#model_height, asanai_this.#model_width]);
					var resized = asanai_this.#expand_dims(_data);
					//resized = asanai_this.tf_div(resized, asanai_this.#divide_by);

					var res;

					try {
						res = asanai_this.predict(resized)
					} catch (e) {
						if(Object.keys(e).includes("message")) {
							e = e.message;
						}

						asanai_this.err("" + e);
						asanai_this.err(`Input shape of the model: [${asanai_this.#model.input.shape.join(", ")}]. Input shape of the data: [${resized.shape.join(", ")}]`);

						return;
					}

					var prediction = asanai_this.array_sync(res);

					asanai_this.#_show_output(res, $desc);

					return true;
				} catch (e) {
					if(Object.keys(e).includes("message")) {
						e = e.message;
					}

					if(("" + e).includes("model is not defined")) {
						return false;
					} else if(("" + e).includes("first_tensor is undefined")) {
						return false;
					} else {
						throw new Error(e);
					}

					return false;
				}
			});

			if(!worked) {
				this.err(`[show_and_predict_webcam_in_div] Resizing image data failed. Stopping camera.`);
				this.stop_camera();
			}

			await this.dispose(image);

			await this.delay(50);
		}

		this.dbg("[show_and_predict_webcam_in_div] this.#started_webcam is false, while loop has ended.")
	}

	delay(time) {
		return new Promise(resolve => setTimeout(resolve, time));
	}

	#visualize_numbers_on_canvas (numberArray, blockWidth = 1, blockHeight = 25) {
		var canvas = document.createElement("canvas");
		canvas.id = "neurons_canvas_" + this.#uuidv4();
		canvas.classList.add("neurons_canvas_class");

		// Calculate the canvas width based on the number of elements
		var canvasWidth = numberArray.length * blockWidth;
		var canvasHeight = blockHeight;

		// Set the canvas dimensions
		canvas.width = canvasWidth;
		canvas.height = canvasHeight;

		var ctx = canvas.getContext("2d");
		var blocksPerRow = Math.floor(canvas.width / blockWidth);

		this.#scaleNestedArray(numberArray);

		for (var i = 0; i < numberArray.length; i++) {
			var value = numberArray[i];
			var color = "rgb(" + value + "," + value + "," + value + ")";

			var x = (i % blocksPerRow) * blockWidth;
			var y = Math.floor(i / blocksPerRow) * blockHeight;

			ctx.fillStyle = color;
			ctx.fillRect(x, y, blockWidth, blockHeight);
		}

		return canvas;
	}

	#get_methods (obj) {
		return Object.getOwnPropertyNames(obj).filter(item => typeof obj[item] === "function")
	}

	hide_internals () {
		this.#draw_internal_states = false;
		$("#" + this.#internal_states_div).html("");
		this.#internal_states_div = "";
	}

	#show_internals_slider (pixel_val, pixel_max, kernel_val, kernel_max) {
		if(!this.#asanai_name) {
			this.err(`[#show_internals_slider] To call this function, run "asanai_object.set_asanai_name('asanai_object')". This is needed to define onclick functions that go back to this class, and I cannot determine the object's variable name by myself.`);
			return;
		}

		var html = `<div class='show_internals_slider'>`
		html += `Pixel-Size: <input type="range" min="1" max="${pixel_max}" value="${pixel_val}" onchange="${this.#asanai_name}.set_pixel_size($(this).val())">`;
		html += `Kernel-Pixel-Size: <input type="range" min="1" max="${kernel_max}" value="${kernel_val}" onchange="${this.#asanai_name}.set_kernel_pixel_size($(this).val())">`;
		html += `</div>`;

		return html;
	}

	show_internals (divname="", show_sliders=false) {
		if(!this.#model) {
			this.dbg("No model found");

			return;
		}

		if(!typeof(show_sliders) == "boolean") {
			this.err("[show_internals] second parameter, show_sliders, must either be true or false)");
			return;
		}

		this.#show_sliders = show_sliders;

		if(!divname) {
			this.err("[show_internals] Cannot call show_internals without a divname (at least once)");
			return;
		}

		var $div = $("#" + divname)

		if(!$div.length) {
			this.err(`[show_internals] #${divname} could not be found`);
			return;
		}

		if(!this.#model.layers) {
			this.dbg("No layer found");
		}

		this.#draw_internal_states = true;
		this.#internal_states_div = divname;
	}

	#normalize_to_image_data (input_data) {
		var asanai_this = this;

		var res = this.tidy(() => {
			var flattened_input = input_data;

			var tmp;

			if(asanai_this.is_tf_tensor(flattened_input)) {
				tmp = asanai_this.array_sync(flattened_input);
				flattened_input = tmp;
			}

			while (asanai_this.get_shape_from_array(flattened_input).length > 1) {
				flattened_input = flattened_input.flat();
			}

			var max = Math.max(...flattened_input);
			var min = Math.min(...flattened_input);

			//asanai_this.log("max: " + max + ", min: " + min);

			var range = tf.sub(max, min);

			if(!asanai_this.is_tf_tensor(input_data)) {
				input_data = asanai_this.tensor(input_data);
			}

			//
			var divisor = max - min;

			var multiplicator = tf.sub(input_data, min);

			if(divisor == 0) {
				return asanai_this.array_sync(input_data);
			}

			var twofiftyfive = tf.ones(input_data.shape);
			twofiftyfive = tf.mul(twofiftyfive, 1);

			var divisor_tensor = tf.ones(input_data.shape);
			divisor_tensor = tf.mul(divisor_tensor, divisor);

			var scaled_tensor = tf.div(tf.mul(input_data, twofiftyfive), divisor_tensor);


			var _r = asanai_this.array_sync(scaled_tensor);

			asanai_this.dispose(tmp);

			return _r;
		});

		return res;
	}

	#_draw_internal_states (layer, inputs, applied) {
		var number_of_items_in_this_batch = inputs.shape[0];
		//log("number_of_items_in_this_batch: " + number_of_items_in_this_batch);

		var layer_name;
		try {
			layer_name = this.#model.layers[layer].getClassName();
		} catch (e) {
			if(Object.keys(e).includes("message")) {
				e = e.message;
			}

			this.err("[_draw_internal_states] Cannot get layer-name: " + e);

			return;
		}

		for (var batchnr = 0; batchnr < number_of_items_in_this_batch; batchnr++) {
			var input_data = this.#normalize_to_image_data(inputs);
			var output_data = this.#normalize_to_image_data(applied);

			var __parent = $("#" + this.#internal_states_div);

			var layer_div = __parent.find($($(".layer_data")[layer]));
			if(layer_div.length == 0) {
				layer_div = $("<div class='layer_data'></div>");
				__parent.append(layer_div);
			}

			layer_div.html("<h3 class=\"data_flow_visualization layer_header\">Layer " + layer + " &mdash; " + layer_name + " " + this.get_layer_identification(layer) + "</h3>").hide();

			layer_div.show();

			var style_none = " style='display: none' ";
			var start = "<div class='data_flow_visualization ";

			layer_div.append(`${start} input_layer_header' ${style_none} id='layer_${layer}_input'><h4>Input:</h4></div>`);
			layer_div.append(`${start} weight_matrix_header' ${style_none} id='layer_${layer}_kernel'><h4>Weight Matrix:</h4></div>`);
			layer_div.append(`${start} output_header' ${style_none} id='layer_${layer}_output'><h4>Output:</h4></div>`);
			layer_div.append(`${start} equations_header' ${style_none} id='layer_${layer}_equations'></div>`);

			var input = $("#layer_" + layer + "_input");
			var kernel = $("#layer_" + layer + "_kernel");
			var output = $("#layer_" + layer + "_output");
			var equations = $("#layer_" + layer + "_equations");

			var kernel_data = [];

			if(this.#model.layers[layer] && Object.keys(this.#model.layers[layer]).includes("kernel")) {
				if(this.#model.layers[layer].kernel.val.shape.length == 4) {
					var ks_x = 0;
					var ks_y = 1;
					var number_filters = 2;
					var filters = 3;

					kernel_data = this.tidy(() => {
						var res = this.tidy(() => { 

							var transposed = this.tf_transpose(
								this.#model.layers[layer].kernel.val,
								[filters, ks_x, ks_y, number_filters]
							)

							var _res = this.array_sync(transposed);

							this.dispose(transposed);

							return _res;
						});

						return res;
					});
				}

				kernel_data = tf.tidy(() => { return this.#normalize_to_image_data(kernel_data); });
			}

			var canvasses_input = this.#draw_image_if_possible(layer, "input", input_data);
			var canvasses_kernel = this.#draw_image_if_possible(layer, "kernel", kernel_data);
			var canvasses_output = this.#draw_image_if_possible(layer, "output", output_data);

			if(layer == 0) {
				for (var input_canvas_idx = 0; input_canvas_idx < canvasses_input.length; input_canvas_idx++) {
					input.append(canvasses_input[input_canvas_idx]).show();
				}
			}

			if(this.get_shape_from_array(output_data[0]).length == 1) {
				var h = this.#visualize_numbers_on_canvas(output_data[0])
				equations.append(h).show();
			} else {
				for (var canvasses_output_idx = 0; canvasses_output_idx < canvasses_output.length; canvasses_output_idx++) {
					var img_output = canvasses_output[canvasses_output_idx];
					output.append(img_output).show();
				}

				for (var kernel_canvas_idx = 0; kernel_canvas_idx < canvasses_kernel.length; kernel_canvas_idx++) {
					if(kernel_canvas_idx in canvasses_kernel) {
						var this_kernel = canvasses_kernel[kernel_canvas_idx];
						if(this_kernel) {
							kernel.append(this_kernel).show();
						} else {
							this.log(canvasses_kernel);
							this.err(`Kernel ${kernel_canvas_idx} for layer ${layer} is false or undefined`)
						}
					} else {
						this.log(canvasses_kernel);
						this.err(`${kernel_canvas_idx} not in canvasses_kernel for layer ${layer}`);
					}
				}
			}


			this.dispose(kernel_data)

			/*
			 else {
				var h = this.#array_to_html(output_data[0]);
				equations.append(h).show();
			}
			*/
		}
	}

	#draw_grid (canvas, pixel_size, colors, black_and_white, onclick, data_hash, _class="") {
		this.assert(typeof(this.#pixel_size) == "number", "pixel_size must be of type number, is " + typeof(this.#pixel_size));
		this.assert(this.#get_dim(colors).length == 3, "color input shape is not of length of 3, but: [" + this.#get_dim(colors).join(", ") +"]");

		this.#scaleNestedArray(colors);

		var drew_something = false;

		var _height = colors.length;
		var _width = colors[0].length;

		$(canvas).attr("width", _width * this.#pixel_size);
		$(canvas).attr("height", _height * this.#pixel_size);
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

		for (var x = 0, i = 0; i < _width; x += this.#pixel_size, i++) {
			for (var y = 0, j = 0; j < _height; y += this.#pixel_size, j++) {
				var red, green, blue;

				if(black_and_white) {
					//red = green = blue = this.#parse_int(colors[j][i]); // TODO
					red = green = blue = parseInt(colors[j][i]);
				} else {
					red = this.#parse_int(colors[j][i][0]);
					green = this.#parse_int(colors[j][i][1]);
					blue = this.#parse_int(colors[j][i][2]);
				}

				var color = `rgb(${red}, ${green}, ${blue})`;

				var pixel = {
					x: x,
					y: y,
					w: this.#pixel_size,
					h: this.#pixel_size,
					fill: color,
					stroke: color
				};

				this.#draw_rect(ctx, pixel);
			}
		}

		ctx.fill();
		ctx.closePath();

		return canvas;
	}

	get_shape_from_array(a) {
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

	get_layer_identification (i) {
		if(this.#model === null || this.#model === undefined) {
			model_is_ok();
			return;
		}

		if(this.#model.layers[i] && Object.keys(this.#model.layers[i]).length >= 1) {
			var object_keys = Object.keys(this.#model.layers[i]);
			var new_str = "";

			if(object_keys.includes("filters") && object_keys.includes("kernelSize")) {
				new_str = this.#model.layers[i]["filters"] + "@" + this.#model.layers[i].kernelSize.join("x");

			} else if(object_keys.includes("filters")) {
				new_str = "Filters:&nbsp;" + this.#model.layers[i]["filters"];

			} else if(object_keys.includes("units")) {
				new_str = "Units:&nbsp;" + this.#model.layers[i]["units"];

			} else if(object_keys.includes("rate")) {
				new_str = "Rate:&nbsp;" + this.#model.layers[i]["rate"];

			} else if(object_keys.includes("poolSize")) {
				new_str = this.#model.layers[i].poolSize.join("x");
			}

			return new_str;
		}

		return "";
	}

	#get_dim(a) {
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

	get_kernel_pixel_size () {
		return this.#kernel_pixel_size;
	}

	set_kernel_pixel_size (_new) {
		if(this.#looks_like_number(_new)) {
			this.#kernel_pixel_size = this.#parse_int(_new);
		} else {
			throw new Error(`[set_kernel_pixel_size] The parameter given (${_new}, type: ${typeof(_new)}) is not a number and does not does not look like a number.`);
		}
	}

	get_pixel_size () {
		return this.#pixel_size;
	}

	set_pixel_size (_new) {
		if(this.#looks_like_number(_new)) {
			this.#pixel_size = this.#parse_int(_new);
		} else {
			throw new Error(`[set_pixel_size] The parameter given (${_new}, type: ${typeof(_new)}) is not a number and does not does not look like a number.`);
		}
	}

	#draw_image_if_possible (layer, canvas_type, colors) {
		var canvas = null;

		try {
			var ret = [];

			var colors_shape = this.#get_dim(colors);

			if(colors_shape.length != 4) {
				//this.log("colors had no length of 4 but [" + this.#get_dim(colors).join(", ") + "]");
				return false;
			}

			colors_shape = this.#get_dim(colors);

			if(canvas_type == "output" || canvas_type == "input") {
				//this.log("pixels.shape: [" + this.#get_dim(colors).join(", ") + "]");

				var _num_channels = colors_shape[colors_shape.length - 1];

				if(_num_channels == 3) {
					if(canvas_type == "input") {
						canvas = this.#get_canvas_in_class(layer, "input_image_grid");
					} else {
						canvas = this.#get_canvas_in_class(layer, "image_grid");
					}

					ret.push(this.#draw_grid(canvas, this.#pixel_size, colors[0], 0, "", ""));
				} else {
					for (var i = 0; i < _num_channels; i++) {
						if(canvas_type == "input") {
							canvas = this.#get_canvas_in_class(layer, "input_image_grid");
						} else {
							canvas = this.#get_canvas_in_class(layer, "image_grid");
						}

						var inputTensor = this.tensor(colors);

						var slice = this.tidy(() => {
							var _h = inputTensor.shape[1];
							var _w = inputTensor.shape[2];
							var _slice = inputTensor.slice([0, 0, 0, i], [1, _h, _w, 1]);

							return _slice;
						});

						var asanai_this = this;

						var _slice_array = this.tidy(() => {
							var res = asanai_this.array_sync(slice);

							asanai_this.dispose(slice);

							return res;
						});

						var _grid_canvas = this.#draw_grid(canvas, this.#pixel_size, _slice_array[0], 1, "", "");

						ret.push(_grid_canvas);
						this.dispose(inputTensor);
					}
				}
			} else if(canvas_type == "kernel") {
				var shape = this.#get_dim(colors);

				var canvasses = [];

				for (var filter_id = 0; filter_id < shape[0]; filter_id++) {
					for (var channel_id = 0; channel_id < shape[1]; channel_id++) {
						canvas = this.#get_canvas_in_class(layer, "filter_image_grid");

						var drawn = this.#draw_kernel(canvas, this.#kernel_pixel_size, colors[filter_id]);

						ret.push(drawn);
					}
				}
			}
		} catch (e) {
			this.err(e);
		}

		return ret;
	}

	#array_to_html(array) {
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

	#get_canvas_in_class (layer, classname, dont_append, use_uuid=0) {
		var _uuid = "";
		var _uuid_str = "";
		if (use_uuid) {
			_uuid = this.#uuidv4();
			_uuid_str = " id='" + _uuid + "'";
		}
		var new_canvas = $("<canvas" + _uuid_str + "/>", {class: "layer_image", style: 'margin: 5px'}).prop({
			width: 0,
			height: 0
		});
		if(!dont_append) {
			$($("." + classname)[layer]).append(new_canvas);
		}

		return new_canvas[0];
	}

	#scaleNestedArray(arr) {
		// Find the minimum and maximum values in the nested array
		let min = Number.MAX_VALUE;
		let max = Number.MIN_VALUE;

		function findMinMax(arr) {
			for (let item of arr) {
				if (Array.isArray(item)) {
					findMinMax(item);
				} else {
					if (item < min) min = item;
					if (item > max) max = item;
				}
			}
		}

		findMinMax(arr);

		// Scale the values
		function scaleValue(value) {
			return (value - min) * (255 / (max - min));
		}

		function scaleNested(arr) {
			for (let i = 0; i < arr.length; i++) {
				if (Array.isArray(arr[i])) {
					scaleNested(arr[i]);
				} else {
					arr[i] = scaleValue(arr[i]);
				}
			}
		}

		scaleNested(arr);
	}

	#draw_kernel(canvasElement, rescaleFactor, pixels) {
		// canvasElement is the HTML canvas element where you want to draw the image
		// rescaleFactor is the factor by which the image should be resized, e.g., 2 for twice the size
		// pixels is a 3D array [n, m, a] where n is the height, m is the width, and a is the number of channels

		this.#scaleNestedArray(pixels);

		var context = canvasElement.getContext('2d'); // Get the 2D rendering context

		var kernel_shape = this.#get_dim(pixels);

		this.assert(kernel_shape.length == 3, `kernel is not an image, it has shape [${kernel_shape.join(", ")}]`);

		var [_height, _width, channels] = [pixels.length, pixels[0].length, pixels[0][0].length]; // Destructure the dimensions

		if (channels === 3) {
			// Draw a color image on the canvas and resize it accordingly
			canvasElement.width = _width * rescaleFactor;
			canvasElement.height = _height * rescaleFactor;

			for (let i = 0; i < _height; i++) {
				for (let j = 0; j < _width; j++) {
					var [r, g, b] = pixels[i][j]; // Assuming channels are [red, green, blue]
					context.fillStyle = `rgb(${r}, ${g}, ${b}`;
					context.fillRect(j * rescaleFactor, i * rescaleFactor, rescaleFactor, rescaleFactor);
				}
			}
		} else {
			// Draw only the first channel
			canvasElement.width = _width * rescaleFactor;
			canvasElement.height = _height * rescaleFactor;

			for (let i = 0; i < _height; i++) {
				for (let j = 0; j < _width; j++) {
					const grayscaleValue = pixels[i][j][0]; // Assuming the first channel is grayscale
					context.fillStyle = `rgb(${grayscaleValue}, ${grayscaleValue}, ${grayscaleValue}`;
					context.fillRect(j * rescaleFactor, i * rescaleFactor, rescaleFactor, rescaleFactor);
				}
			}
		}

		return canvasElement;
	}

	#draw_rect(ctx, rect) {
		ctx.fillStyle = rect.fill;
		ctx.strokeStyle = rect.stroke;
		ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
		ctx.strokeRect(rect.x, rect.y, rect.w, rect.h);
	}

	write_model_summary(divname=this.#model_summary_div) {
		if(!divname) {
			this.err("Cannot call write_model_summary without a divname (at least once)");
			return;
		}

		var $div = $("#" + divname)

		if(!$div.length) {
			this.err(`#${divname} could not be found`);
			return;
		}

		if(!$div.is(":visible")) {
			return;
		}

		this.assert(typeof(this.#model) == "object", "model is not an object");

		var logBackup = console.log;
		var logMessages = [];

		console.log = function () {
			logMessages.push.apply(logMessages, arguments);
		};

		this.#model.summary(200);

		$div.html(this.summary_to_table(logMessages));

		console.log = logBackup;

		this.#model_summary_div = divname;
	}

	summary_to_table(lines) {
		var new_array = [];

		var colspan_nr = 0;

		for (var i = 0; i < lines.length; i++) {
			var line = lines[i];

			if (line.match(/^=+$/)) {
			} else if (line.match(/\s{2,}/)) {
				var regex = new RegExp(/\s*(.*?)\s*(\[.*\])\s*(\[.*\])\s*(\d+)\s*/, "g");
				var result = regex.exec(line);
				var splitted = [];
				if(result) {
					splitted = [result[1], "<pre>" + result[2] + "</pre>", "<pre>" + result[3] + "</pre>", result[4]];
				} else {
					var splitted = line.split(/\s{2,}/).filter(n => n);
					for (var j = 0; j < splitted.length; j++) {
						if (splitted[j].startsWith("[")) {
							splitted[j] = "<pre>" + splitted[j] + "</pre>";
						}
					}
				}

				new_array.push(splitted);
				if (splitted.length > colspan_nr) {
					colspan_nr = splitted.length;
				}
			} else if (!line.match(/^_+$/) && line) {
				new_array.push(line);
			}
		}

		var table = "<table border=1 style='border-collapse: collapse;'>\n";
		for (var i = 0; i < new_array.length; i++) {
			var d_or_h = "d";
			if (i == 0) {
				d_or_h = "h";
			}
			if (typeof (new_array[i]) == "object") {
				table += "<tr><t" + d_or_h + ">" + new_array[i].join("</t" + d_or_h + "><t" + d_or_h + ">") + "</t" + d_or_h + "></tr>\n";
			} else {
				table += "<tr><td colspan=" + colspan_nr + ">" + new_array[i] + "</td></tr>\n";
			}
		}

		table += "</table>\n";

		return "<center>" + table + "</center>";
	}

	write_tensors_info(divname=this.#write_tensors_info_div, time=200) {
		if($("#__status__bar__").length == 1) {
			this.err("[write_tensors_info] Cannot use status bar and write_tensors_info at the same time. Chose one.");
			return;
		}

		var $div = $("#" + divname);

		if(!$div.length) {
			this.err("Cannot find #" + divname);
			return;
		}

		this.#write_tensors_info_div = divname;

		if(!this.#looks_like_number(time)) {
			console.err("write_tensors_info: second parameter must be a number. Time will be set to 200 ms");
			time = 200;
		}

		var asanai_this = this;

		var _tensor_debugger = function () {



			var memory;
			try {
				memory = tf.memory();
			} catch (e) {
				if(Object.keys(e).includes("message")) {
					e = e.message;
				}

				if(("" + e).includes("tf is null")) {
					err("tf is null");
				} else {
					throw new Error(e);
				}

				return;
			}


			var bytes = memory["numBytes"];
			var gpu_bytes = memory["numBytesInGPU"];

			var num_tensors =  memory["numTensors"]; // Object.keys(tensors).length;
			var ram_mb = bytes / 1024 / 1024;
			ram_mb = ram_mb.toFixed(2);
			var gpu_mb = gpu_bytes / 1024 / 1024;
			if(gpu_mb) {
				gpu_mb = gpu_mb.toFixed(2);
			}

			var tensor_color = "";
			var gpu_color = "";
			var cpu_color = "";

			if(asanai_this.#last_num_global_tensors > num_tensors) {
				tensor_color = "#00ff00";
			} else if (asanai_this.#last_num_global_tensors < num_tensors) {
				tensor_color = "#ff0000";
			}

			if(asanai_this.#last_tensor_size_cpu > ram_mb) {
				cpu_color = "#00ff00";
			} else if (asanai_this.#last_tensor_size_cpu < ram_mb) {
				cpu_color = "#ff0000";
			}

			if(asanai_this.#last_tensor_size_gpu > gpu_mb) {
				gpu_color = "#00ff00";
			} else if (asanai_this.#last_tensor_size_gpu < gpu_mb) {
				gpu_color = "#ff0000";
			}

			var debug_string = `Tensors: ` + asanai_this.colorize(num_tensors, tensor_color) + ", RAM: " + asanai_this.colorize(ram_mb, cpu_color) + "MB";

			if(gpu_mb.toString().match(/^\d+(?:\.\d+)?$/)) {
				debug_string = debug_string + ", GPU: " + asanai_this.colorize(gpu_mb, gpu_color) + "MB";
			}

			if(Object.keys(asanai_this.#custom_tensors).length) {
				debug_string += ", asanAI: " + Object.keys(asanai_this.#custom_tensors).length;
			}

			var $div = $("#" + divname);
			var memdeb = $div[0];

			if(memdeb) {
				if(memdeb.innerHTML != debug_string) {

					if($div.html() != debug_string) {
						$div.html(debug_string);
					}
				}
			} else {
				asanai_this.wrn("memory_debugger_div not found. Did you, by any chance, manually remove it?");
			}

			asanai_this.#last_num_global_tensors = num_tensors;
			asanai_this.#last_tensor_size_cpu = ram_mb;
			asanai_this.#last_tensor_size_gpu = gpu_mb;
		}

		self.write_tensor_interval = setInterval(_tensor_debugger , 200);
	}

	colorize (text, color) {
		if(color) {
			return "<span style='color: " + color + "'>" + text + "</span>";
		}
		return text;
	}

	hide_tensors_info () {
		if(self.write_tensor_interval) {
			clearInterval(self.write_tensor_interval)
			$("#" + self.#write_tensors_info_div).html("");

			self.write_tensor_interval = null;
		} else {
			this.err("Cannot delete tensor info without tensor info being installed first via write_tensors_info(divname, time_in_ms)");
		}
	}

	#looks_like_number(item) {
		if(typeof(item) == "number") {
			return true;
		}

		if (/^[+-]?(?:(?:\d+(?:\.\d+)?))$/.test(item)) {
			return true;
		}

		return false;
	}

	get_divide_by () {
		return this.#divide_by;
	}

	set_divide_by (number) {
		if(this.#looks_like_number(number)) {
			this.#divide_by = this.#parse_float(number);
			return this.#divide_by;
		}

		this.err(`"${number}" does not seem to be a number. Cannot set it.`);
	}

	#_show_images_in_output (predictions_tensor, write_to_div) {
		if(!this.is_tf_tensor(predictions_tensor)) {
			this.err("[#_show_images_in_output] predctions tensor (first parameter) is not a tensor");
			return;
		}

		if(typeof(write_to_div) == "string") {
			var $write_to_div = $("#" + write_to_div);
			if($write_to_div.length == 1) {
				write_to_div = $write_to_div[0];
			} else {
				this.err(`[#_show_images_in_output] Could not find div to write to by id ${write_to_div}`);
				return;
			}
		} else if(!write_to_div instanceof HTMLElement) {
			this.err(`[#_show_images_in_output] write_to_div is not a HTMLElement`);
			return;
		}

		if(!predictions_tensor.shape.length == 4) {
			this.err(`[#_show_images_in_output] predictions tensor does not have 4 elements in length, but [${predictions_tensor.shape.join(", ")}]`);
			return;
		}

		var asanai_this = this;

		var normalized = this.tidy(() => {
			var _n = asanai_this.tensor(asanai_this.#normalize_to_image_data(asanai_this.array_sync(predictions_tensor)));

			return _n;
		});

		var synched = this.tidy(() => {
			var res = asanai_this.array_sync(normalized);
			return res;
		});

		this.dispose(normalized);

		var _dim = this.#get_dim(synched);

		var canvas = $(`<canvas height=${_dim[0]} width=${_dim[1]} />`)[0];

		$(write_to_div).html("");

		for (var image_idx = 0; image_idx < _dim[0]; image_idx++) {
			var this_synched = synched[0];
			var _grid_canvas = this.#draw_grid(canvas, this.#pixel_size, this_synched, 1, "", "");
			$(write_to_div).append(_grid_canvas);
		}
	}

	#_show_output (predictions_tensor, write_to_div) {
		if(!this.is_tf_tensor(predictions_tensor)) {
			this.err("[#_show_output] predctions tensor (first parameter) is not a tensor");
			return;
		}

		if(typeof(write_to_div) == "string") {
			var $write_to_div = $("#" + write_to_div);
			if($write_to_div.length == 1) {
				write_to_div = $write_to_div[0];
			} else {
				this.err(`[#_show_output] Could not find div to write to by id ${write_to_div}`);
				return;
			}
		} else if(!write_to_div instanceof HTMLElement) {
			this.err(`[#_show_output] write_to_div is not a HTMLElement`);
			return;
		}

		if(this.#model.output.shape.length == 2) {
			this.#_predict_table(predictions_tensor, write_to_div);
		} else if(this.#model.output.shape.length == 4) {
			this.#_show_images_in_output(predictions_tensor, write_to_div)
		} else {
			var error = `Unimplemented output shape: [${this.#model.output.shape.join(", ")}]`;
			this.err(error);
			$(write_to_div).html(error);
		}
	}

	#_predict_table (predictions_tensor, write_to_div) {
		if(!this.is_tf_tensor(predictions_tensor)) {
			this.err("[#_predict_table] Predictions tensor is (first parameter) is not a tensor");
			return;
		}

		if(write_to_div) {
			if(typeof(write_to_div) == "string") {
				var $write_to_div = $("#" + write_to_div);
				if($write_to_div.length == 1) {
					write_to_div = $write_to_div[0];
				} else {
					this.err(`[#_predict_table] Could not find div to write to by id ${write_to_div}`);
					return;
				}
			} else if(!write_to_div instanceof HTMLElement) {
				this.err(`[#_predict_table] write_to_div is not a HTMLElement`);
				return;
			}
		}

		var asanai_this = this;
		var predictions = tf.tidy(() => { return asanai_this.array_sync(predictions_tensor); });

		var max = 0;

		for (var i = 0; i < predictions[0].length; i++) {
			if(max < predictions[0][i]) {
				max = predictions[0][i];
			}
		}

		var html = "<table class='predict_table'>";

		for (var i = 0; i < predictions[0].length; i++) {
			html += this.#_draw_bars_or_numbers(i, predictions[0], max);
		}

		html += "</table>";

		$(write_to_div).html(html);
	}

	#last_layer_is_softmax () {
		// TODO
		var _last_layer_is_softmax = this.#model.layers[this.#model.layers.length - 1].activation 
	}

	#_draw_bars_or_numbers (i, predictions, max) {
		var label = this.#labels[i % this.#labels.length];
		var val = predictions[i];
		var w = Math.floor(val * this.#bar_width);

		var html = "";

		var bar_style = ` style='margin-top: 4px; display: inline-block;`;
		bar_style += `height: 3px; background-color: ${this.#bar_background_color}; padding: 5px; width: ${this.#bar_width}px;' `;

		var highest_bar_css = `background-color: #${this.#max_bar_color} !important;`;

		var label_element_css = "width: 100%; text-align: left; height: 40px;";

		var best_result_css = `background-color: ${this.#max_bar_color}; color: white;`;

		var label_element = ` class='label_element' style='${label_element_css}' `;
		var label_element_best_result = ` class='label_element best_result' style='${best_result_css} ${label_element_css}' `;

		if(this.#show_bars_instead_of_numbers) {
			if(label) {
				if(val == max) {
					html =`<tr><td ${label_element}>${label}</td><td><span ${bar_style}><span style='${highest_bar_css} background-color: ${this.#max_bar_color}; margin-wtop: 2px; width: ${w}px; display: block; height: 4px'></span></span></td></tr>`;
				} else {
					html = `<tr><td ${label_element}>${label}</td><td><span ${bar_style}><span style='margin-top: 2px; background-color: ${this.#default_bar_color}; width: ${w}px; display: block; height: 4px'></span></span></td></tr>`;
				}
			} else {
				if(val == max) {
					html = `<tr><td><span ${bar_style}><span style='${highest_bar_css} background-color: ${this.#max_bar_color};width:${w}px; display: block; height: 4px'></span></span></td></tr>`;
				} else {
					html = `<tr><td><span ${bar_style}><span style='width: background-color: ${this.#default_bar_color};${w}px; display: block; height: 4px'></span></span></td></tr>`;
				}
			}
		} else {
			if(label) {
				if(val == max) {
					html = `<tr><td><b ${label_element_best_result}>${label}</td><td>${val}</b></td></tr>\n`;
				} else {
					html = `<tr><td class='label_element'>${label}</td><td>${predictions[0][i]}</td></tr>\n`;
				}
			} else {
				if(val == max) {
					html = `<tr><td><b ${label_element_best_result}>${predictions[0][i]}</b></td></tr>\n`;
				} else {
					html = `<tr><td>${predictions[0][i]}</td></tr>`;
				}
			}
		}

		return html;
	}

	get_labels () {
		return this.#labels;
	}

	set_labels (_l) {
		if(Array.isArray(_l)) {
			if(this.#get_dim(_l).length == 1) {
				this.#labels = _l;

				if(this.#model) {
					if(this.#model.output.shape.length == 2) {
						var num_labels = this.#model.output.shape[1];

						if(this.#labels.length != num_labels) {
							this.wrn(`Your model expects ${num_labels}, but you have set ${this.#labels.length} labels.`);
						}
					}
				}
			} else {
				throw new Error("labels cannot be a multdimensional array");
			}
		} else {
			throw new Error("labels must be an array");
		}
	}

	load_image_urls_to_div_and_tensor (divname, urls_and_categories, one_hot = 1, shuffle = 1) {
		if(!this.#model) {
			this.err(`[load_image_urls_into_div] Cannot continue without a loaded model`);
			return;
		}

		if(!this.#model.layers) {
			this.err(`[load_image_urls_into_div] Cannot continue with a model without layers`);
			return;
		}

		if(!Array.isArray(this.#model.input.shape)) {
			this.err(`[load_image_urls_into_div] this.#model.input.shape is not an array`);
			return;
		}

		if(this.#model.input.shape.length != 4) {
			this.err(`[load_image_urls_into_div] this.#model.input must be an array with 4 elements, but is [${this.#model.input.shape.join(", ")}]`);
			return;
		}

		if(!this.#model_height) {
			this.err(`[load_image_urls_into_div] this.#model_height has no value`);
			return;
		}

		if(!this.#model_width) {
			this.err(`[load_image_urls_into_div] this.#model_width has no value`);
			return;
		}

		var $div = $("#" + divname);
		if(!$div.length) {
			this.err(`[#load_image_urls_into_div] cannot use non-existant div. I cannot find #${divname}`);
			return;
		}

		if(!Array.isArray(urls_and_categories)) {
			this.err(`[load_image_urls_into_div] urls_and_categories is not an array`);
			return;
		}

		if(!urls_and_categories.length) {
			this.err(`[load_image_urls_into_div] urls_and_categories is empty`);
			return;
		}

		var urls = [];
		var categories = [];

		var unique_categories = [];

		if(shuffle) {
			urls_and_categories = urls_and_categories.sort((a, b) => 0.5 - Math.random());
		}

		for (var i = 0; i < urls_and_categories.length; i++) {
			var _this = urls_and_categories[i];
			var url;
			var cat;

			if(0 in _this) {
				url = _this[0];
			} else {
				this.err(`No url for url for urls_and_categories[${i}] found`);
				return;
			}

			if(1 in _this) {
				cat = _this[1];
			} else {
				this.err(`No url for url for urls_and_categories[${i}] found`);
				return;
			}

			urls.push(url);
			categories.push(cat);

			if(!unique_categories.includes(cat)) {
				unique_categories.push(cat);
			}
		}

		this.assert(Array.isArray(urls), `urls is not an array but ${typeof(urls)}`);
		this.assert(Array.isArray(categories), `categories is not an array but ${typeof(categories)}`);
		this.assert(Array.isArray(unique_categories), `categories is not an array but ${typeof(unique_categories)}`);
		this.assert(unique_categories.length <= categories.length, `unique_categories.length = ${unique_categories.length} is larger than categories.length = ${categories.length}, which should never occur.`);

		if(!urls.length) {
			this.err("[load_image_urls_into_div] urls-array is empty");
			return;
		}

		if(!urls.length) {
			this.err("[load_image_urls_into_div] categories-array is empty");
			return;
		}

		var imgs = [];

		var __is = this.#model.input.shape;

		var image_tensors_array = [];

		var category_output = [];

		for (var i = 0; i < urls.length; i++) {
			if(i == 0) {
				$div.html("");
			}

			var url = urls[i];

			this.assert(typeof(url) == "string", `${urls[i]} is not a string but ${typeof(urls[i])}`);

			var height = 50;
			var width = 50;

			if(this.#model_height) {
				height = this.#model_height;
			}

			if(this.#model_width) {
				width = this.#model_width;
			}

			var _uuid = this.#uuidv4();

			var img_id = `load_images_into_div_image_${_uuid}`;

			var img = $(`<img id='${img_id}' width=${width} height=${height} src='${url}' />`);

			imgs.push(img[0]);

			$div.append(img);

			var asanai_this = this;

			var img_array = this.tidy(() => {
				var _t = asanai_this.array_sync(asanai_this.from_pixels(img[0], asanai_this.num_channels));

				return _t;
			});

			image_tensors_array.push(img_array)
			category_output.push(unique_categories.indexOf(categories[i]));
		}

		var category_tensor = this.tensor(category_output);

		image_tensors_array = this.tensor(image_tensors_array);

		if(one_hot) {
			var asanai_this = this;

			category_tensor = this.tidy(() => {
				var __tensor = category_tensor.toInt();

				var _unique_categories_length = unique_categories.length;

				var _res = asanai_this.one_hot(__tensor, _unique_categories_length);

				this.dispose(__tensor)

				return _res;
			});

			var last_layer_activation = this.#model.layers[this.#model.layers.length - 1].getConfig().activation;
			
			if(last_layer_activation != "") {
				this.wrn("[load_image_urls_to_div_and_tensor] The last layer is not softmax, but you chose one hot encoding. Though this is possible, usually, it is not what you want. Set the last layer's activation function to softmax.");
			}
		}

		this.set_labels(unique_categories);

		var res = {
			html_image_elements: imgs,
			labels: unique_categories,
			x: image_tensors_array,
			y: category_tensor
		};

		return res;
	}

	#set_document_title (t) {
		if(t != document.title) {
			document.title = t;
		}
	}

	async #input_shape_is_image (is_from_webcam=0) {
		if(!this.#model) {
			this.err(`cannot find this.#model`);
			return;
		}

		if(!this.#model.input) {
			this.err(`cannot find this.#model.input`);
			return;
		}

		if(!this.#model.input.shape) {
			this.err(`cannot find this.#model.input.shape`);
			return;
		}

		if(!this.#model.input.shape.length) {
			this.err(`could find this.#model.input.shape.length but is 0`);
			return;
		}

		var shape = this.#model.input.shape;
		if(shape.length == 3 && shape[2] == 3) {
			return true;
		}
		return false;
	}

	load_image_urls_into_div (divname, ...urls) {
		var $div = $("#" + divname);
		if(!$div.length) {
			this.err(`[#load_image_urls_into_div] cannot use non-existant div. I cannot find #${divname}`);
			return;
		}

		this.assert(Array.isArray(urls), `urls is not an array but ${typeof(urls)}`);

		while (this.get_shape_from_array(urls).length > 1) {
			urls = urls.flat();
		}

		if(!urls.length) {
			this.err("[load_image_urls_into_div] urls-array is empty");
			return;
		}

		var imgs = [];

		for (var i = 0; i < urls.length; i++) {
			var url = urls[i];

			this.assert(typeof(url) == "string", `${urls[i]} is not a string but ${typeof(urls[i])}`);

			var height = 50;
			var width = 50;

			if(this.#model_height) {
				height = this.#model_height;
			}

			if(this.#model_width) {
				height = this.#model_width;
			}

			var _uuid = this.#uuidv4();

			var img = $(`<img id='load_images_into_div_image_${_uuid}' width=${width} height=${height} src='${url}' />`);

			imgs.push(img);

			$div.append(img);
		}

		return imgs;
	}

	#log_once (...args) {
		var md5 = JSON.stringify(args);

		if(this.#printed_msgs.includes(md5)) {
			return;
		}

		this.#printed_msgs.push(md5);

		log(...args);
	}

	async #visualize_train () {
		if(!$("#visualize_images_in_grid").is(":checked")) {
			$("#canvas_grid_visualization").html("");
			return;
		}

		if($("#data_origin").val() != "default") {
			this.#log_once("Train visualization only works for default data.");
			$("#canvas_grid_visualization").html("");
			return;
		}

		if(!is_classification) {
			this.#log_once("Train visualization only works for classification problems.");
			$("#canvas_grid_visualization").html("");
			return;
		}

		if(!await this.#input_shape_is_image()) {
			this.#log_once("Train visualization only works for images.");
			$("#canvas_grid_visualization").html("");
			return;
		}

		if(get_last_layer_activation_function() != "softmax") {
			this.#log_once("Train visualization only works when the last layer is softmax.");
			$("#canvas_grid_visualization").html("");
			return;
		}

		var imgs = [];
		var categories = [];
		var probabilities = [];

		var max = this.#max_number_of_images_in_grid;

		if(max == 0) {
			return;
		}

		$("#plotly_epoch_history").show();

		if(!labels.length) {
			$("#canvas_grid_visualization").html("");

			await nextFrame();

			if(is_cosmo_mode) {
				await fit_to_window();
			}

			return;
		}

		var image_elements = $("#photos").find("img,canvas");
		if(!image_elements.length) {
			err("[visualize_train] could not find image_elements");
			return;
		}

		var total_wrong = 0;
		var total_correct = 0;

		var category_overview = {};

		for (var i = 0; i < image_elements.length; i++) {
			var img_elem = image_elements[i];

			var img_elem_xpath = get_element_xpath(img_elem);
			
			var this_predicted_array = [];


			var src;
			try {
				src = img_elem.src;
			} catch (e) {
				if(Object.keys(e).includes("message")) {
					e = message;
				}

				e = "" + e;

				throw new Error(e);

				continue;
			}

			if(!src) {
				err("[visualize_train] Cannot use images without src tags");
				continue;
			}

			if(i <= max) {
				var res_array;

				if(!img_elem) {
					tf.engine().endScope();
					wrn("[visualize_train] img_elem not defined!", img_elem);
					continue;
				}

				var img_tensor = tidy(() => {
					try {
						var res = expand_dims(resizeBilinear(fromPixels(img_elem), [height, width]));
						res = divNoNan(res, parse_float($("#divide_by").val()));
						return res;
					} catch (e) {
						err(e);
						return null;
					}
				});

				if(img_tensor === null) {
					wrn("[visualize_train] Could not load image from pixels from this element:", img_elem);
					continue;
				}

				var res = tidy(() => { return model.predict(img_tensor); });

				res_array = array_sync(res)[0];
				await dispose(img_tensor);
				await dispose(res);

				assert(Array.isArray(res_array), `res_array is not an array, but ${typeof(res_array)}, ${JSON.stringify(res_array)}`);

				this_predicted_array = res_array;

				if(this_predicted_array) {
					confusion_matrix_and_grid_cache[img_elem_xpath] = this_predicted_array;

					var max_probability = Math.max(...this_predicted_array);
					var category = this_predicted_array.indexOf(max_probability);

					//console.log("xpath:", img_elem_xpath, "category", category, "max_probability:", max_probability, "this_predicted_array:", this_predicted_array);

					categories.push(category);
					probabilities.push(max_probability);
					imgs.push(img_elem);
				} else {
					err(`[visualize_train] Cannot find prediction for image with xpath ${img_elem_xpath}`);
				}
			}

			try {
				var tag_name = img_elem.tagName;
				if(src && tag_name == "IMG") {
					var predicted_tensor = this_predicted_array;

					if(predicted_tensor === null || predicted_tensor === undefined) {
						dbg("[visualize_train] Predicted tensor was null or undefined");
						return;
					}

					var predicted_index = predicted_tensor.indexOf(Math.max(...predicted_tensor));

					var correct_category = extractCategoryFromURL(src);
					if(correct_category === undefined || correct_category === null) {
						continue;				
					}

					var predicted_category = labels[predicted_index];

					if(is_cosmo_mode) {
						predicted_category = language[lang][predicted_category];
					}

					var correct_index = -1;

					try {
						correct_index = findIndexByKey(
							[
								...labels, 
								...cosmo_categories, 
								...original_labels, 
								"Brandschutz", 
								"Gebot", 
								"Verbot", 
								"Rettung", 
								"Warnung", 
								"Fire prevention", 
								"Mandatory", 
								"Prohibition", 
								"Rescue", 
								"Warning",
								"fire",
								"mandatory",
								"prohibition",
								"rescue",
								"warning"
							], correct_category) % labels.length;
					} catch (e) {
						wrn("[visualize_train] " + e);
						return;
					}

					if(!Object.keys(category_overview).includes(predicted_category)) {
						category_overview[predicted_category] = {
							wrong: 0,
							correct: 0,
							total: 0
						};
					}

					//log("predicted_category " + predicted_category + " detected from " + src + ", predicted_index = " + predicted_index + ", correct_index = " + correct_index);

					if(predicted_index == correct_index) {
						total_correct++;

						category_overview[predicted_category]["correct"]++;
					} else {
						total_wrong++;

						category_overview[predicted_category]["wrong"]++;
					}
					category_overview[predicted_category]["total"]++;
				} else {
					err(`[visualize_train] Cannot use img element, src: ${src}, tagName: ${tag_name}`);
				}
			} catch (e) {
				console.log(e);
			}

		}

		for (var i = 0; i < Object.keys(category_overview).length; i++) {
			var category = Object.keys(category_overview)[i];
			category_overview[category]["percentage_correct"] = parseInt((category_overview[category]["correct"] / category_overview[category]["total"]) * 100);
		}

		if(imgs.length && categories.length && probabilities.length) {
			draw_images_in_grid(imgs, categories, probabilities, category_overview);
		} else {
			$("#canvas_grid_visualization").html("");
		}

		await nextFrame();

		if(is_cosmo_mode) {
			await fit_to_window();
		}
	}

	_get_callbacks () {
		var callbacks = {};

		callbacks["onTrainBegin"] = async function () {
			this.#confusion_matrix_and_grid_cache = {};
			this.#current_epoch = 0;
			this.#this_training_start_time = Date.now();

			await this.#visualize_train();
			await this.#confusion_matrix_to_page(); // async not possible

			this.#confusion_matrix_and_grid_cache = {};
		};

		callbacks["onBatchBegin"] = async function () {
			this.#confusion_matrix_and_grid_cache = {};
			if(!started_training) {
				model.stopTraining = true;
			}

			//if(!is_hidden_or_has_hidden_parent($("#math_tab"))) {
			//	await write_model_to_latex_to_page();
			//}

			this.#confusion_matrix_and_grid_cache = {};
		};

		callbacks["onEpochBegin"] = async function () {
			this.#confusion_matrix_and_grid_cache = {};
			this.#current_epoch++;
			var max_number_epochs = get_epochs();
			var current_time = Date.now();
			var epoch_time = (current_time - this.#this_training_start_time) / this.#current_epoch;
			var epochs_left = max_number_epochs - this.#current_epoch;
			var seconds_left = parse_int(Math.ceil((epochs_left * epoch_time) / 1000) / 5) * 5;
			var time_estimate = human_readable_time(seconds_left);

			//$("#training_progress_bar").show();

			this.#set_document_title("[" + this.#current_epoch + "/" + max_number_epochs + ", " + time_estimate  + "] asanAI");

			if(is_cosmo_mode) {
				time_estimate = human_readable_time(parse_int(seconds_left * 2.5));
				if(max_number_epochs && this.#current_epoch > 0 && time_estimate && seconds_left >= 0) {
					$("#current_epoch_cosmo_display").html(this.#current_epoch);
					$("#max_epoch_cosmo_display").html(max_number_epochs);
					$("#time_estimate_cosmo").html(time_estimate);
					$("#show_cosmo_epoch_status").show();
				} else {
					$("#show_cosmo_epoch_status").hide();
				}
				idleTime = 0;
			}

			var percentage = parse_int((this.#current_epoch / max_number_epochs) * 100);
			$("#training_progressbar>div").css("width", percentage + "%");
			this.#confusion_matrix_and_grid_cache = {};
		};

		callbacks["onBatchEnd"] = async function (batch, logs) {
			this.#confusion_matrix_and_grid_cache = {};
			delete logs["batch"];
			delete logs["size"];

			var batchNr = 1;
			var loss = logs["loss"];
			if(training_logs_batch["loss"]["x"].length) {
				batchNr = Math.max(...training_logs_batch["loss"]["x"]) + 1;
			}
			training_logs_batch["loss"]["x"].push(batchNr);
			training_logs_batch["loss"]["y"].push(loss);

			if(!last_batch_time) {
				last_batch_time = +new Date();
			} else {
				var current_time = +new Date();
				time_per_batch["time"]["x"].push(batchNr);
				time_per_batch["time"]["y"].push((current_time - last_batch_time) / 1000);
				last_batch_time = current_time;
			}

			var this_plot_data = [training_logs_batch["loss"]];

			if(!is_cosmo_mode) {
				$("#plotly_batch_history").parent().show();
				$("#plotly_time_per_batch").parent().show();
			}

			if(!last_batch_plot_time || (Date.now() - last_batch_plot_time) > (parse_int($("#min_time_between_batch_plots").val()) * 1000)) { // Only plot every min_time_between_batch_plots seconds
				if(batchNr == 1) {
					Plotly.newPlot("plotly_batch_history", this_plot_data, get_plotly_layout(language[lang]["batches"]));
					Plotly.newPlot("plotly_time_per_batch", [time_per_batch["time"]], get_plotly_layout(language[lang]["time_per_batch"]));
				} else {
					Plotly.update("plotly_batch_history", this_plot_data, get_plotly_layout(language[lang]["batches"]));
					Plotly.update("plotly_time_per_batch", [time_per_batch["time"]], get_plotly_layout(language[lang]["time_per_batch"]));
				}
				last_batch_plot_time = Date.now();
			}

			if(!is_hidden_or_has_hidden_parent($("#predict_tab"))) {
				if($("#predict_own_data").val()) {
					await predict($("#predict_own_data").val());
				}
				await show_prediction(0, 1);
				if(await this.#input_shape_is_image()) {
					await repredict();
				}
			}

			if(is_cosmo_mode) {
				$("#cosmo_training_grid_stage_explanation").show();
				if(current_cosmo_stage == 1) {
					await this.#visualize_train();
				}
			}

			this.#confusion_matrix_and_grid_cache = {};
		};

		callbacks["onEpochEnd"] = async function (batch, logs) {
			this.#confusion_matrix_and_grid_cache = {};
			delete logs["epoch"];
			delete logs["size"];

			var epochNr = 1;
			var loss = logs["loss"];
			if(training_logs_epoch["loss"]["x"].length) {
				epochNr = Math.max(...training_logs_epoch["loss"]["x"]) + 1;
			}
			training_logs_epoch["loss"]["x"].push(epochNr);
			training_logs_epoch["loss"]["y"].push(loss);

			var other_key_name = "val_loss";

			var this_plot_data = [training_logs_epoch["loss"]];

			if(Object.keys(logs).includes(other_key_name)) {
				if(epochNr == 1) {
					training_logs_epoch[other_key_name] = {
						"x": [],
						"y": [],
						"type": get_scatter_type(),
						"mode": get_plotly_layout(),
						"name": "Loss"
					};
				}

				loss = logs[other_key_name];
				training_logs_epoch[other_key_name]["x"].push(epochNr);
				training_logs_epoch[other_key_name]["y"].push(loss);
				training_logs_epoch[other_key_name]["mode"] = get_plotly_type();
				training_logs_epoch[other_key_name]["name"] = other_key_name;

				this_plot_data.push(training_logs_epoch[other_key_name]);
			}

			$("#plotly_epoch_history").parent().show();
			if(is_cosmo_mode) {
				if(current_cosmo_stage == 1 || current_cosmo_stage == 2) {
					$("#cosmo_training_predictions_explanation").hide();
					$("#cosmo_training_grid_stage_explanation").show();
					$("#cosmo_training_plotly_explanation").hide();

					$("#plotly_epoch_history").hide();

					await this.#visualize_train();

					$("#visualize_images_in_grid").show();
				/*
				} else if(current_cosmo_stage == 2) {
					$("#visualize_images_in_grid").hide();

					$("#cosmo_training_predictions_explanation").show();
					$("#cosmo_training_grid_stage_explanation").hide();
					$("#cosmo_training_plotly_explanation").hide();

					$("#plotly_epoch_history").hide();

					var elem = $("#example_predictions")[0];
					var to = $("#training_tab")[0];
					move_element_to_another_div(elem, to)

					await repredict();
					await update_translations();

				*/
				} else {
					$("#visualize_images_in_grid").hide();

					$("#cosmo_training_predictions_explanation").hide();
					$("#cosmo_training_grid_stage_explanation").hide();
					$("#cosmo_training_plotly_explanation").show();

					if(epochNr == 0 || epochNr == 1) {
						Plotly.newPlot("plotly_epoch_history", this_plot_data, get_plotly_layout(language[lang]["epochs"]));
					} else {
						Plotly.update("plotly_epoch_history", this_plot_data, get_plotly_layout(language[lang]["epochs"]));
					}

					$("#plotly_epoch_history").show();
					$("#visualize_images_in_grid").html("").hide();
					$("#canvas_grid_visualization").html("").hide();
				}

				await fit_to_window();
			} else {
				$("#plotly_epoch_history").show();
				if(epochNr == 1) {
					Plotly.newPlot("plotly_epoch_history", this_plot_data, get_plotly_layout(language[lang]["epochs"]));
				} else {
					Plotly.update("plotly_epoch_history", this_plot_data, get_plotly_layout(language[lang]["epochs"]));
				}

				await this.#visualize_train();
			}

			var this_plot_data = [training_logs_batch["loss"]];
			Plotly.update("plotly_batch_history", this_plot_data, get_plotly_layout(language[lang]["batches"]));
			Plotly.update("plotly_time_per_batch", [time_per_batch["time"]], get_plotly_layout(language[lang]["time_per_batch"]));
			last_batch_plot_time = false;

			if(is_cosmo_mode) {
				await fit_to_window();
			}

			if(training_logs_epoch["loss"].x.length >= 2) {
				var vl = Object.keys(training_logs_epoch).includes("val_loss") ? training_logs_epoch["val_loss"].y : null;
				var th = 18;
				var plotCanvas = create_tiny_plot(training_logs_epoch["loss"].x, training_logs_epoch["loss"].y, vl, th * 2, parse_int(0.9 * th));
				$("#tiny_graph").html("");
				$("#tiny_graph").append(plotCanvas).show();
			} else {
				$("#tiny_graph").html("").hide();
			}
			$("#network_has_seen_msg").show();

			this.#confusion_matrix_to_page(); // async not possible

			this.#confusion_matrix_and_grid_cache = {};
		};

		callbacks["onTrainEnd"] = async function () {
			this.#confusion_matrix_and_grid_cache = {};
			favicon_default();
			await write_model_to_latex_to_page();
			this.#set_document_title(original_title);
			await restart_fcnn();
			await restart_lenet();

			$("#tiny_graph").hide();

			if(0 && is_cosmo_mode) {
				if(current_cosmo_stage == 1) {
					var elem = $("#example_predictions")[0];
					var to = $("#example_predictions_parent")[0];
					log("moving", elem, "to", to);
					move_element_to_another_div(elem, to);
				}
			}

			$("#network_has_seen_msg").hide();
			if(is_cosmo_mode) {
				$("#show_after_training").show();
			}

			this.#confusion_matrix_to_page(); // async not possible

			await reset_data();

			this.#confusion_matrix_and_grid_cache = {};
		};

		return callbacks;
	}

	async #confusion_matrix_to_page () {
		if(!labels && labels.length != 0) {
			return;
		}

		if(!is_classification) {
			return;
		}

		if(is_cosmo_mode) {
			return;
		}

		var confusion_matrix_html = await this.#confusion_matrix(labels);

		if(confusion_matrix_html) {
			var str = "<h2>Confusion Matrix:</h2>\n" + confusion_matrix_html;
			$("#confusion_matrix").html(str);
			$("#confusion_matrix_training").html(str);
		} else {
			$("#confusion_matrix").html("");
			$("#confusion_matrix_training").html("");
		}
	}

	async #confusion_matrix(classes) {
		if(!classes.length) {
			if(current_epoch < 2) {
				wrn("[confusion_matrix] No classes found");
			}
			return "";
		}

		if(!is_classification) {
			wrn("[confusion_matrix] Only works with classification");
			return "";
		}

		if(!model) {
			wrn("[confusion_matrix] model not defined. Cannot continue");
		}
		
		var imgs = $("#photos").find("img,canvas");

		if(!imgs.length) {
			if(current_epoch == 1) {
				wrn("[confusion_matrix] No images found");
			}
			return "";
		}
		
		var table_data = {};
		
		var num_items = 0;

		for (var i = 0; i < imgs.length; i++) {
			var img_elem = imgs[i];
			var img_elem_xpath = get_element_xpath(img_elem);

			var predicted_tensor = confusion_matrix_and_grid_cache[img_elem_xpath];

			if(!predicted_tensor) {
				var img_tensor = tidy(() => {
					try {
						var predicted_tensor = expand_dims(resizeBilinear(fromPixels(img_elem), [height, width]));
						predicted_tensor = divNoNan(predicted_tensor, parse_float($("#divide_by").val()));
						return predicted_tensor;
					} catch (e) {
						err(e);
						return null;
					}
				});

				if(img_tensor === null) {
					wrn("[confusion_matrix] Could not load image from pixels from this element:", img_elem);
					await dispose(img_tensor);
					continue;
				}

				try {
					predicted_tensor = tidy(() => {
						return model.predict(img_tensor);
					});

					predicted_tensor = tidy(() => {
						var _res = array_sync(predicted_tensor)[0];
						dispose(predicted_tensor); // await not possible
						return _res;
					});

					confusion_matrix_and_grid_cache[img_elem_xpath] = predicted_tensor;
				} catch (e) {
					if(Object.keys(e).includes("message")) {
						e = e.message;
					}

					dbg("Cannot predict image: " + e);

					await dispose(img_tensor);
					await dispose(predicted_tensor);

					continue;
				}
			}

			//console.log("cached: ", predicted_tensor);

			if(!predicted_tensor) {
				err(`[confusion_matrix] Could not get predicted_tensor`);
				continue;
			}

			if(!predicted_tensor) {
				dbg("predicted_tensor is empty");

				await dispose(img_tensor);
				await dispose(predicted_tensor);

				continue;
			}


			assert(Array.isArray(predicted_tensor), `predicted_tensor is not an array, but ${typeof(predicted_tensor)}, ${JSON.stringify(predicted_tensor)}`);

			if(predicted_tensor === null || predicted_tensor === undefined) {
				dbg("Predicted tensor was null or undefined");
				continue;
			}

			var predicted_index = predicted_tensor.indexOf(Math.max(...predicted_tensor));
			var predicted_category = labels[predicted_index];

			var src = img_elem.src;
			var correct_category = extractCategoryFromURL(src);

			if(!Object.keys(table_data).includes(correct_category)) {
				table_data[correct_category] = {};
			}

			if(Object.keys(table_data[correct_category]).includes(predicted_category)) {
				table_data[correct_category][predicted_category]++;
			} else {
				table_data[correct_category][predicted_category] = 1;
			}

			//console.log("xpath:", img_elem_xpath, "predicted_index:", predicted_index, "category", predicted_category);

			await dispose(img_tensor);
			await dispose(predicted_tensor);

			num_items++;
		}

		if(!num_items) {
			wrn("[confusion_matrix] Could not get any items!");
			return "";
		}

		var str = `<table class="confusion_matrix_table">` ;
		for (var i = 0; i <= classes.length; i++) {
			if(i == 0) {
				str += `<tr>`;
				str += `<th class='confusion_matrix_tx' style='text-align: right'><i>Correct category</i> &rarr;<br><i>Predicted category</i> &darr;</th>`;
				for (var j =  0; j < classes.length; j++) {
					str += `<th class='confusion_matrix_tx'>${classes[j]}</th>`;
				}
				str += `</tr>`;
			} else {
				str += `<tr>`;
				for (var j =  0; j <= classes.length; j++) {
					if(j == 0) {
						str += `<th class="confusion_matrix_tx">${classes[i - 1]}</th>`;
					} else {
						var text = `0`; // `${classes[i - 1]} &mdash; ${classes[j - 1]}`;
						if(Object.keys(table_data).includes(classes[i - 1]) && Object.keys(table_data[classes[i - 1]]).includes(classes[j - 1])) {
							text = table_data[classes[i - 1]][classes[j - 1]];
						}
						if(classes[i - 1] == classes[j - 1]) {
							if(text == `0`) {
								str += `<td class="confusion_matrix_tx">${text}</td>`;
							} else {
								str += `<td  class="confusion_matrix_tx" style='background-color: #83F511'>${text}</td>`;
							}
						} else {
							if(text == `0`) {
								str += `<td class="confusion_matrix_tx">${text}</td>`;
							} else {
								str += `<td class="confusion_matrix_tx"style='background-color: #F51137'>${text}</td>`;
							}
						}
					}
				}
				str += `</tr>`;
			}
		}
		str += `</table>`;

		return str;

	}

	async fit (_x, _y, args={}, _plotly_data={}) {
		if(!Object.keys(args).length) {
			this.err(`[fit]: third argument, args, seems to be empty. Must at least contain epochs and batchSize`);
			return;
		}

		if(!Object.keys(args).includes("epochs")) {
			this.err(`[fit]: third argument, args, seems not to contain epochs. Must at least contain epochs and batchSize`);
			return;
		}

		if(!Object.keys(args).includes("batchSize")) {
			this.err(`[fit]: third argument, args, seems not to contain batchSize. Must at least contain epochs and batchSize`);
			return;
		}

		if(!this.#model) {
			this.err(`[fit] Cannot continue without a loaded model`);
			return;
		}

		if(!this.#model.layers) {
			this.err(`[fit] Cannot continue with a model without layers`);
			return;
		}

		if(this.#model.input.shape.length != _x.shape.length) {
			this.err(`[fit] Cannot fit, because the input shape of the model [${this.#model.input.shape.join(", ")}] differs from _x.shape [${_y.shape.join(", ")}] in length`);
			return;
		} else {
			var mis = this.#model.input.shape;
			var xs = _x.shape;

			var matches = true;

			for (var k = 1; k < xs.length; k++) {
				if(mis[k] != xs[k]) {
					matches = false;
				}
			}

			if(!matches) {
				this.err(`[fit] Cannot fit, because the input shape of the model [${this.#model.input.shape.join(", ")}] differs from _x.shape [${_x.shape.join(", ")}]`);
				return;
			}
		}

		if(this.#model.output.shape.length != _y.shape.length) {
			this.err(`[fit] Cannot fit, because the output shape of the model [${this.#model.output.shape.join(", ")}] differs from _y.shape [${_y.shape.join(", ")}] in length`);
			return;
		} else {
			var mos = this.#model.output.shape;
			var ys = _y.shape;

			var matches = true;

			for (var k = 1; k < ys.length; k++) {
				if(mos[k] != ys[k]) {
					matches = false;
				}
			}

			if(!matches) {
				this.err(`[fit] Cannot fit, because the output shape of the model [${this.#model.output.shape.join(", ")}] differs from _y.shape [${_y.shape.join(", ")}]`);
				return;
			}
		}

		var _callbacks = {};

		if(Object.keys(_plotly_data).length) {
			if(Object.keys(_plotly_data).includes("div")) {
				this.#plotly_div = _plotly_data["div"];
				_callbacks = this._get_callbacks();
			} else {
				this.err(`_plotly_data is defined but does not include div-option`);
				return;
			}
		}

		try {
			var history = this.#model.fit(_x, _y, args, _callbacks);

			this.#redo_what_has_to_be_redone(false);

			return history;
		} catch (e) {
			if(Object.keys(e).includes("message")) {
				e = e.message;
			}

			if(("" + e).includes("e is null")) {
				return false;
			} else {
				throw new Error(e);
			}
		}

		this.set_model(this.#model);

		return history;
	}

	get_custom_tensors () {
		return this.#custom_tensors;
	}

	tensor_debugger () {
		console.table(this.#custom_tensors);
	}

	is_valid_web_color (color) {
		const webColors = [
			"aquamarine",
			"azure", 
			"beige",
			"bisque",
			"black",
			"blue", 
			"brown", 
			"burlywood",
			"chartreuse",
			"chocolate",
			"coral", 
			"cornsilk",
			"crimson",
			"cyan", 
			"firebrick",
			"fuchsia", 
			"gainsboro",
			"goldenrod",
			"gray", 
			"green", 
			"honeydew",
			"indigo",
			"ivory",
			"khaki",
			"lavender",
			"lime",
			"linen",
			"magenta",
			"maroon",
			"moccasin",
			"navy",
			"olive",
			"orange", 
			"orchid",
			"peru",
			"pink",
			"plum",
			"purple", 
			"red", 
			"salmon",
			"seashell",
			"sienna",
			"silver", 
			"snow",
			"tan",
			"teal",
			"thistle", 
			"tomato",
			"turquoise",
			"violet",
			"wheat",
			"white", 
			"yellow", 
		];

		// Convert the color input to lowercase for case-insensitivity
		const lowerCaseColor = color.toLowerCase();

		if (webColors.includes(lowerCaseColor)) {
			return true;
		}

		const colorRegex = /^(#([0-9a-fA-F]{3}){1,2}|(rgb|hsl)a?\(\s*((\d{1,3}\s*,\s*){2}\d{1,3}|(\d+(\.\d+)?%\s*,\s*){2}\d+(\.\d+)?%\s*,\s*\d+(\.\d+)?|(\d+(\.\d+)?%\s*,\s*\d+(\.\d+)?%\s*,\s*\d{1,3}))\s*\))$/;

		if (color.match(colorRegex)) {
			return true;
		}

		return false;
	}

	get_max_bar_color () {
		return this.#max_bar_color;
	}

	get_default_bar_color () {
		return this.#default_bar_color;
	}

	set_max_bar_color(color) {
		if(this.is_valid_web_color(color)) {
			if(this.get_max_bar_color() != color) {
				this.#max_bar_color = color;
				if(this.#model) {
					this.set_model(this.#model);
				}

				if(this.get_bar_background_color() == color) {
					this.wrn(`[set_default_bar_color] New max bar color is the same as the background. You will not be able to see max bars.`);
				}
			} else {
				this.wrn(`[set_max_bar_color] Color stayed the same. Not changing.`);
			}
		} else {
			this.err(`[set_max_bar_color] Color "${color}" does not seem to be a valid web color. Valid are names like 'red' or 'green', strings like 'rgb(255, 0, 3)' or hex colors like '#ff0011'`);
		}
	}

	set_default_bar_color(color) {
		if(this.is_valid_web_color(color)) {
			if(this.get_default_bar_color() != color) {
				this.#default_bar_color = color;
				if(this.#model) {
					this.set_model(this.#model);
				}

				if(this.get_bar_background_color() == color) {
					this.wrn(`[set_default_bar_color] New default bar color is the same as the background. You will not be able to see default bars.`);
				}
			} else {
				this.wrn(`[set_default_bar_color] Color stayed the same. Not changing.`);
			}
		} else {
			this.err(`[set_default_bar_color] Color "${color}" does not seem to be a valid web color. Valid are names like 'red' or 'green', strings like 'rgb(255, 0, 3)' or hex colors like '#ff0011'`);
		}
	}

	get_bar_background_color () {
		return this.#bar_background_color;
	}

	set_bar_background_color (color) {
		if(this.is_valid_web_color(color)) {
			if(this.get_bar_background_color() != color) {
				this.#bar_background_color = color;
				if(this.#model) {
					this.set_model(this.#model);
				}

				if(color == this.get_max_bar_color()) {
					this.wrn(`[set_bar_background_color] Max-bar color is the same as background-color. Max bars will not be visible`);
				}

				if(color == this.get_default_bar_color()) {
					this.wrn(`[set_bar_background_color] Default-bar color is the same as background-color. Default bars will not be visible`);
				}
			} else {
				this.wrn(`[set_bar_background_color] Color stayed the same. Not changing.`);
			}
		} else {
			this.err(`[set_bar_background_color] Color "${color}" does not seem to be a valid web color. Valid are names like 'red' or 'green', strings like 'rgb(255, 0, 3)' or hex colors like '#ff0011'`);
		}
	}

	enable_debug () {
		this.#_enable_debug = true;
	}

	disable_debug () {
		this.#_enable_debug = false;
	}

	get_images_to_repredict () {
		return this.#images_to_repredict;
	}

	get_asanai_name () {
		return this.#asanai_name;
	}

	set_asanai_name (name) {
		if(eval(`window.${name}`)) {
			if(window[name].constructor.name == "asanAI") {
				this.#asanai_name = name;
			} else {
				this.err(`[set_asanai_name] Variable ${name} could be found but is not an asanAI class.`);
			}
		} else {
			this.err(`[set_asanai_name] Could not find global variable ${name}. Cannot use it as asanAI name.`);
		}
	}

	show_status_bar () {
		if($("#__status__bar__").length == 1) {
			this.err("[show_status_bar] Status bar element already exists. Not re-initializing it.");
			return;
		}

		if(this.#write_tensors_info_div) {
			this.err("[show_status_bar] Cannot use write_tensors_info and status_bar at the same time. Chose one.");
			return;
		}

		var css = `background-color: ${this.#status_bar_background_color}; `;
		css += `color: ${this.#status_bar_text_color}; `;
		css += `user-select: none; `;
		css += `height: 1.5em; `;
		css += `width: 100%; `;
		css += `position: fixed; `;
		css += `bottom: 0px; `;
		css += `margin: 0px; `;
		css += `border: 1px groove #626262; `;
		css += `padding-bottom: 5px; `;

		var $element = $(`<div style='${css}'><span id='__status__bar__log'></span><span style='right: 0px; position: fixed;' id='__status__bar__memory_debuger'></span></div>`);

		$($element).appendTo($("body"));;

		this.write_tensors_info("__status__bar__memory_debuger");

		return $element;
	}

	generate_ribbon_from_ribbon_data (jsonData) {
		var tabs = [
			`
			<div class="ribbon-tab file" id="file-tab">
				<span class="ribbon-title">File</span>
				<div class="ribbon-backstage">
					This is the Backstage.<br/><br/>

					<div class="button big">
						<span class="label">Open</span>
						<span class="desc">Open a document from your computer</span>
					</div><br/>
					<div class="button big">
						<span class="label">Save</span>
						<span class="desc">Save your document to your computer</span>
					</div>
				</div>
			</div>
			`,
			`
			<div class="ribbon-tab" id="format-tab">
				<span class="ribbon-title" id='home_tab'>Home</span>
				<div class="ribbon-section">
					<span class="section-title">Tables</span>
					<div class="ribbon-button ribbon-button-large" id="add-table-btn">
						<span class="button-title">Add<br/>Table</span>
						<span class="button-help">This button will add a table to your document.</span>
						<img class="ribbon-icon ribbon-normal" src="icons/normal/new-table.png" />
						<img class="ribbon-icon ribbon-hot" src="icons/hot/new-table.png" />
						<img class="ribbon-icon ribbon-disabled" src="icons/disabled/new-table.png" />
					</div>
					<div class="ribbon-button ribbon-button-large" id="open-table-btn">
						<span class="button-title">Open<br/>Table</span>
						<span class="button-help">This button will open a table and add it to your document.</span>
						<img class="ribbon-icon ribbon-normal" src="icons/normal/open-table.png" />
						<img class="ribbon-icon ribbon-hot" src="icons/hot/open-table.png" />
						<img class="ribbon-icon ribbon-disabled" src="icons/disabled/open-table.png" />
					</div>
					<div class="ribbon-button ribbon-button-large disabled" id="del-table-btn">
						<span class="button-title">Remove<br/>Table</span>
						<span class="button-help">This button will remove the selected table from your document.</span>
						<img class="ribbon-icon ribbon-normal" src="icons/normal/delete-table.png" />
						<img class="ribbon-icon ribbon-hot" src="icons/hot/delete-table.png" />
						<img class="ribbon-icon ribbon-disabled" src="icons/disabled/delete-table.png" />
					</div>
				</div>

				<div class="ribbon-section">
					<span class="section-title">Pages</span>
					<div class="ribbon-button ribbon-button-large" id="add-page-btn">
						<span class="button-title">Add<br/>Page</span>
						<span class="button-help">This button will add a page to your document.</span>
						<img class="ribbon-icon ribbon-normal" src="icons/normal/new-page.png" />
						<img class="ribbon-icon ribbon-hot" src="icons/hot/new-page.png" />
						<img class="ribbon-icon ribbon-disabled" src="icons/disabled/new-page.png" />
					</div>
					<div class="ribbon-button ribbon-button-large" id="open-page-btn">
						<span class="button-title">Open<br/>Page</span>
						<span class="button-help">This button will open a page and add it to your document.</span>
						<img class="ribbon-icon ribbon-normal" src="icons/normal/open-page.png" />
						<img class="ribbon-icon ribbon-hot" src="icons/hot/open-page.png" />
						<img class="ribbon-icon ribbon-disabled" src="icons/disabled/open-page.png" />
					</div>
					<div class="ribbon-button ribbon-button-large disabled" id="del-page-btn">
						<span class="button-title">Remove<br/>Page</span>
						<span class="button-help">This button will remove the selected page from your document.</span>
						<img class="ribbon-icon ribbon-normal" src="icons/normal/delete-page.png" />
						<img class="ribbon-icon ribbon-hot" src="icons/hot/delete-page.png" />
						<img class="ribbon-icon ribbon-disabled" src="icons/disabled/delete-page.png" />
					</div>
				</div>


				<div class="ribbon-section">
					<span class="section-title">Actions</span>
					<div class="ribbon-button ribbon-button-small" id="run-btn" style='background-color: lightgreen' >
						<span onclick='load_test_images_and_train()' class="button-title">Run</span>
						<span class="button-help">This button will run the program.</span>
						<img class="ribbon-icon ribbon-normal" src="icons/normal/run.png" />
						<img class="ribbon-icon ribbon-hot" src="icons/hot/run.png" />
						<img class="ribbon-icon ribbon-disabled" src="icons/disabled/run.png" />
					</div>
					<!--
					<div class="ribbon-button ribbon-button-small" id="repeat-btn">
						<span class="button-title">Repeat</span>
						<span class="button-help">This button will repeat something.</span>
						<img class="ribbon-icon ribbon-normal" src="icons/normal/repeat.png" />
						<img class="ribbon-icon ribbon-hot" src="icons/hot/repeat.png" />
						<img class="ribbon-icon ribbon-disabled" src="icons/disabled/repeat.png" />
					</div>
					<div class="ribbon-button ribbon-button-small disabled" id="save-btn">
						<span class="button-title">Save</span>
						<span class="button-help">This button will save your document.</span>
						<img class="ribbon-icon ribbon-normal" src="icons/normal/save.png" />
						<img class="ribbon-icon ribbon-hot" src="icons/hot/save.png" />
						<img class="ribbon-icon ribbon-disabled" src="icons/disabled/save.png" />
					</div>
					-->
				</div>

			</div>

			`,
			`
			<div class="ribbon-tab" id="next-tab">
				<span class="ribbon-title">Options</span>
				<div class="ribbon-section">
					<span class="section-title">More Stuff</span>
					<div class="ribbon-button ribbon-button-large">
						<span class="button-title">Other<br/>Feature</span>
						<span class="button-help">This button will do something else.</span>
						<img class="ribbon-icon ribbon-normal" src="icons/normal/bullet-orange.png" />
					</div>
					<div class="ribbon-button ribbon-button-large disabled" id="other-btn-2">
						<span class="button-title">Remove<br/>Table</span>
						<span class="button-help">This button will remove the selected table from your document.</span>
						<img class="ribbon-icon ribbon-normal" src="icons/normal/delete-table.png" />
					</div>
				</div>
			</div>
			`,
			`
			<div class="ribbon-tab" id="next-tab">
				<span class="ribbon-title">Options</span>
				<div class="ribbon-section">
					<span class="section-title">More Stuff</span>
					<div class="ribbon-button ribbon-button-large">
						<span class="button-title">Other<br/>Feature</span>
						<span class="button-help">This button will do something else.</span>
						<img class="ribbon-icon ribbon-normal" src="icons/normal/bullet-orange.png" />
					</div>
					<div class="ribbon-button ribbon-button-large disabled" id="other-btn-2">
						<span class="button-title">Remove<br/>Table</span>
						<span class="button-help">This button will remove the selected table from your document.</span>
						<img class="ribbon-icon ribbon-normal" src="icons/normal/delete-table.png" />
					</div>
				</div>
			</div>
			`
		];

		return `
		<div id="ribbon">
			<span class="ribbon-window-title"></span>

			${tabs.join("\n")}
		</div>`;
	}

	show_ribbon () {
		try {
			if(!typeof(jQuery().ribbon) == "function") {
				this.err(`[show_ribbon] jQuery().ribbon is not included. Cannot show ribbon without.`);
				return;
			}
		} catch (e) {
			this.err(`[show_ribbon] jQuery().ribbon is not included. Cannot show ribbon without.`);
			return;
		}

		var ribbon_element = this.generate_ribbon_from_ribbon_data(this.ribbon_data);
		$("#ribbon_content").html(ribbon_element);
		$('#ribbon').ribbon();
	}
}
