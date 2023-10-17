"use strict";

class asanAI {
	constructor (...args) {
		var last_tested_tf_version = "4.11.0";
		var last_tested_jquery_version = "3.6.0";
		var last_tested_plotly_version = "2.14.0";

		this.custom_tensors = {};

		this.tf_version = this.get_version(`tf.version["tfjs-core"]`, last_tested_tf_version, "tensorflow.js");
		this.jquery_version = this.get_version(`jQuery().jquery`, last_tested_jquery_version, "jQuery");
		this.plotly_version = this.get_version(`Plotly.version`, last_tested_plotly_version, "Plotly");

		this.is_dark_mode = false;
		this.max_neurons_fcnn = 32;
		this.draw_internal_states = true;
		this.draw_internal_states_div = "";
		this.pixel_size = 3;

		this.started_webcam = false;
		this.camera = null
		this.last_video_element = null;

		this.model = null;

		if(args.length == 1) {
			if(Object.keys(args[0]).includes("model")) {
				if(this.is_model(args[0].model)) {
					this.model = args[0].model;

					this.model_height = this.model.input.shape[1];
					this.model_width = this.model.input.shape[1];
				} else {
					throw new Error("model is not a valid this.model");
				}
			}

			if(Object.keys(args[0]).includes("max_neurons_fcnn")) {
				if(typeof(args[0].max_neurons_fcnn) == "number") {
					this.max_neurons_fcnn = args[0].max_neurons_fcnn;
				} else {
					throw new Error("max_neurons_fcnn is not a boolean");
				}
			}

			if(Object.keys(args[0]).includes("draw_internal_states_div")) {
				if(typeof(args[0].draw_internal_states_div) == "string") {
					this.draw_internal_states_div = args[0].draw_internal_states_div;
				} else {
					throw new Error("draw_internal_states_div is not a string");
				}
			}

			if(Object.keys(args[0]).includes("draw_internal_states")) {
				if(typeof(args[0].draw_internal_states) == "boolean") {
					this.draw_internal_states = args[0].draw_internal_states;
				} else {
					throw new Error("draw_internal_states is not a boolean");
				}
			}
		} else if (args.length > 1) {
			throw new error("All arguments must be passed to asanAI in a JSON-like structure as a single parameter");
		}
	}

	summary () {
		if(!this.model) {
			this.err("No model given. Cannot do summary.");
			return;
		}

		this.model.summary();
	}

	uuidv4() {
		var res = ([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g, c =>
			(c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
		);

		return res;
	}

	get_item_value_model(layer) {
		this.assert(typeof (layer) == "number", "Layer is not an integer, but " + typeof (layer));

		var classname = this.model.layers[layer].getClassName();

		if(!classname) {
			this.err("cannot get class name for layer " + i) ;
			return;
		}

		if(classname == "Dense") {
			return this.model.layers[layer].units;
		} else if(classname == "Conv2D") {
			return this.model.layers[layer].filters;
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
				units = this.parse_int(units);
			} else {
				units = 0;
			}
		} catch (e) {
			console.log(e);
		}

		var max_neurons_fcnn = this.max_neurons_fcnn;

		if(units > max_neurons_fcnn && use_max_layer_size) {
			this.log("FCNN-Visualization: Units is " + units + ", which is bigger than " + max_neurons_fcnn + ". " + max_neurons_fcnn + " is the maximum, it will get set to this for layer " + i);
			units = max_neurons_fcnn;
		}

		return units;
	}

	get_fcnn_data () {
		var names = [];
		var units = [];
		var meta_infos = [];

		if(!this.model) {
			this.wrn("this.Model not found for restart_fcnn");
			return;
		}

		if(!Object.keys(model).includes("layers")) {
			this.wrn("this.model.layers not found for restart_fcnn");
			return;
		}

		if(this.model.layers.length == 0) {
			this.err("this.model.layers.length is 0");
			return;
		}

		for (var i = 0; i < this.model.layers.length; i++) {
			var class_name = this.model.layers[i].getClassName();
			if(!["Dense", "Flatten", "Conv2D"].includes(class_name)) {
				continue;
			}

			var _unit = this.get_units_at_layer(i);
			if(i == 0) {
				names.push(`Input Layer`);
			} else if (i == this.model.layers.length - 1) {
				names.push(`Output Layer`);
			} else {
				names.push(`${class_name} ${i}`);
			}

			units.push(_unit);

			var output_shape_of_layer = "";
			try { 
				output_shape_of_layer = this.model.layers[i].outputShape;
			} catch (e) {

			}

			var kernel_size_x, kernel_size_y;

			try {
				kernel_size_x = model.layers[i].kernelSize[0]
				kernel_size_y = model.layers[i].kernelSize[1];
			} catch (e) {}

			var input_shape_of_layer = "";
			try {
				input_shape_of_layer = this.model.layers[i].input.shape;
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

	restart_fcnn (divname) {
		var fcnn_data = this.get_fcnn_data();

		if(!fcnn_data) {
			this.err("Could not get FCNN data");
			return;
		}

		var [names, units, meta_infos] = fcnn_data;

		this.draw_new_fcnn(divname, units, names, meta_infos);
	}

	draw_new_fcnn(...args) {
		this.assert(args.length == 4, "draw_new_fcnn must have 4 arguments");

		var divname = args[0];
		var layers = args[1];
		var labels = args[2];
		var meta_infos = args[3];

		var canvas = $(document.getElementById(divname)).find("canvas");

		if (!canvas.length) {
			canvas = document.createElement("canvas");
			canvas.id = "new_fcnn_canvas";
			document.body.appendChild(canvas);
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

		this._draw_neurons_and_connections(ctx, layers, meta_infos, layerSpacing, canvasHeight, maxSpacing, maxShapeSize, maxRadius);

		this._draw_layers_text(layers, meta_infos, ctx, canvasHeight, canvasWidth, layerSpacing);
	}

	_draw_layers_text (layers, meta_infos, ctx, canvasHeight, canvasWidth, layerSpacing, labels) {
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
				if(this.is_dark_mode) {
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

	_draw_neurons_or_conv2d (numNeurons, ctx, verticalSpacing, layerY, shapeType, layerX, maxShapeSize, meta_info) {
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


	_draw_neurons_and_connections (ctx, layers, meta_infos, layerSpacing, canvasHeight, maxSpacing, maxShapeSize, maxRadius) {
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
				this._draw_neurons_or_conv2d(numNeurons, ctx, verticalSpacing, layerY, shapeType, layerX, maxShapeSize, meta_info);
			} else if (shapeType == "rectangle_flatten") {
				_height = Math.min(650, meta_info["output_shape"][1]);
				this._draw_flatten(ctx, meta_info, maxShapeSize, canvasHeight, layerX, layerY, _height);
			} else {
				alert("Unknown shape Type: " + shapeType);
			}

			this._draw_connections_between_layers(ctx, layers, layerSpacing, meta_infos, maxSpacing, canvasHeight, layerY, layerX, maxRadius, _height);
		}
	}

	_draw_flatten (ctx, meta_info, maxShapeSize, canvasHeight, layerX, layerY, _height) {
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

	_draw_connections_between_layers(ctx, layers, layerSpacing, meta_infos, maxSpacing, canvasHeight, layerY, layerX, maxRadius, _height) {
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

	draw_fcnn (divname, max_neurons=32) {
		var $divname = $("#" + divname);
		this.assert(divname.length != 1, `div by id ${divname} could not be found`);

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

	_register_tensors (...args) {
		for (var i = 0; i < args.length; i++) {
			if(this.is_tf_tensor(args[i])) {
				this.custom_tensors["" + args[i].id] = [this.get_stack_trace(), args[i], this.tensor_print_to_string(args[i])];
				this.clean_custom_tensors();
			}
		}
	}

	array_sync (...args) {
		this._register_tensors(...args);
		var first_tensor = args.shift();
		var res = first_tensor.arraySync();

		return res;
	}

	tf_to_float (...args) {
		this._register_tensors(...args);
		var first_tensor = args.shift();
		var res = first_tensor.toFloat();

		this.custom_tensors["" + res.id] = [this.get_stack_trace(), res, this.tensor_print_to_string(res)];
		this.clean_custom_tensors();

		return res;
	}

	tf_to_tensor (...args) {
		this._register_tensors(...args);
		var first_tensor = args.shift();
		var res = first_tensor.toTensor(...args);

		this.custom_tensors["" + res.id] = [this.get_stack_trace(), res, this.tensor_print_to_string(res)];
		this.clean_custom_tensors();

		return res;
	}

	tf_mean (...args) {
		this._register_tensors(...args);
		var res = tf.mean(...args);

		this.custom_tensors["" + res.id] = [this.get_stack_trace(), res, this.tensor_print_to_string(res)];
		this.clean_custom_tensors();

		return res;
	}

	tf_relu (...args) {
		this._register_tensors(...args);
		var res = tf.relu(...args);

		this.custom_tensors["" + res.id] = [this.get_stack_trace(), res, this.tensor_print_to_string(res)];
		this.clean_custom_tensors();

		return res;
	}

	tf_concat (...args) {
		this._register_tensors(...args);
		var first_tensor = args.shift();
		var res = first_tensor.concat(...args);

		this.custom_tensors["" + res.id] = [this.get_stack_trace(), res, this.tensor_print_to_string(res)];
		this.clean_custom_tensors();

		return res;
	}

	expand_dims (...args) {
		this._register_tensors(...args);
		var res = tf.expandDims(...args);

		this.custom_tensors["" + res.id] = [this.get_stack_trace(), res, this.tensor_print_to_string(res)];
		this.clean_custom_tensors();

		return res;
	}

	tf_transpose (...args) {
		this._register_tensors(...args);
		var res = tf.transpose(...args);

		this.custom_tensors["" + res.id] = [this.get_stack_trace(), res, this.tensor_print_to_string(res)];
		this.clean_custom_tensors();

		return res;
	}


	tf_sub (...args) {
		this._register_tensors(...args);
		var res = tf.sub(...args);

		this.custom_tensors["" + res.id] = [this.get_stack_trace(), res, this.tensor_print_to_string(res)];
		this.clean_custom_tensors();

		return res;
	}

	tf_min (...args) {
		this._register_tensors(...args);
		var res = tf.min(...args);

		this.custom_tensors["" + res.id] = [this.get_stack_trace(), res, this.tensor_print_to_string(res)];
		this.clean_custom_tensors();

		return res;
	}

	tf_max (...args) {
		this._register_tensors(...args);
		var res = tf.max(...args);

		this.custom_tensors["" + res.id] = [this.get_stack_trace(), res, this.tensor_print_to_string(res)];
		this.clean_custom_tensors();

		return res;
	}

	tf_add (...args) {
		this._register_tensors(...args);
		var first_tensor = args[0];
		var second_arg = args[1];
		if(!Object.keys(second_arg).includes("isDisposedInternal")) {
			this.err("Error: second argument to tf_add is wrong. See stacktrace.");
			return;
		}
		var res = first_tensor.add(second_arg, ...args);

		this.custom_tensors["" + res.id] = [this.get_stack_trace(), res, this.tensor_print_to_string(res)];

		this.clean_custom_tensors();

		return res;
	}

	tf_mul (...args) {
		this._register_tensors(...args);
		var res = tf.mul(...args);

		this.custom_tensors["" + res.id] = [this.get_stack_trace(), res, this.tensor_print_to_string(res)];
		this.clean_custom_tensors();

		return res;
	}

	 tf_div (...args) {
		this._register_tensors(...args);
		var res = tf.div(...args);

		this.custom_tensors["" + res.id] = [this.get_stack_trace(), res, this.tensor_print_to_string(res)];
		this.clean_custom_tensors();

		return res;
	}

	 tf_moments (...args) {
		this._register_tensors(...args);
		var res = tf.moments(...args);

		return res;
	}

	 tf_reshape (...args) {
		this._register_tensors(...args);
		var res = tf.reshape(...args);

		this.custom_tensors["" + res.id] = [this.get_stack_trace(), res, this.tensor_print_to_string(res)];
		this.clean_custom_tensors();

		return res;
	}

	 tf_unique (...args) {
		this._register_tensors(...args);
		var res = tf.unique(...args);

		this.custom_tensors["" + res.values.id] = [this.get_stack_trace(), res.values, this.tensor_print_to_string(res.values)];
		this.custom_tensors["" + res.indices.id] = [this.get_stack_trace(), res.indices, this.tensor_print_to_string(res.indices)];
		this.clean_custom_tensors();

		return res;
	}

	tensor_print_to_string(_tensor) {
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

	 removeTimestampAndLines(inputString) {
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

	get_stack_trace () {
		var s = "";
		try {
			var a = {}; 
			a.debug();
		} catch(ex) {
			s = "" + ex.stack;
		}

		s = this.removeTimestampAndLines(s);

		return s;
	};


	async nextFrame(...args) {
		this._register_tensors(...args);
		await tf.nextFrame(...args);
	}

	 shuffleCombo (...args) {
		this._register_tensors(...args);
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

				if(this.custom_tensors[tensor_id]) {
					delete this.custom_tensors[tensor_id];
				}

				await this.nextFrame();
			} else {
				/*
				this.wrn("item was empty in dispose():"); // not a real async
				console.trace();
				*/
			}

			this.clean_custom_tensors();
		} catch (e) {
			if(Object.keys(e).includes("message")) {
				e = e.message;
			}

			this.err(e);

			return null;
		}
	}

	 tf_model (...args) {
		this._register_tensors(...args);
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

			return res;
		} catch (e) {
			if(Object.keys(e).includes("message")) {
				e = e.message;
			}

			throw new Error(e);
		}
	}

	 tf_sequential(model_uuid) {
		assert(model_uuid, "model_uuid is not defined");
		assert(typeof(model_uuid) == "string", "model_uuid must be a string");

		var res = tf.sequential();

		res.originalAdd = res.add;

		res.add = function (...args) {
			var r = res.originalAdd(...args);

			try {
				var k = res.layers[res.layers.length - 1].kernel;
				if(k) {
					this.custom_tensors["" + k.id] = ["UUID:" + model_uuid, k, "[kernel in tf_sequential]"];
				}
			} catch (e) {
				this.wrn(e);
			}

			try {
				var b = res.layers[res.layers.length - 1].bias;

				if(b) {
					this.custom_tensors["" + b.id] = ["UUID:" + model_uuid, b, "[bias in tf_sequential]"];
				}
			} catch (e) {
				this.wrn(e);
			}

			this.clean_custom_tensors();

			return r;
		};

		this.custom_tensors["" + res.id] = ["UUID:" + model_uuid, res, "[model in tf_sequential]"];

		this.clean_custom_tensors();

		return res;
	}

	 buffer(...args) {
		this._register_tensors(...args);
		try {
			var res = tf.buffer(...args);

			//this.custom_tensors["" + res.dataId.id] = [this.get_stack_trace(), res, this.tensor_print_to_string(res)];

			this.clean_custom_tensors();

			return res;
		} catch (e) {
			if(Object.keys(e).includes("message")) {
				e = e.message;
			}

			this.err(e);

			return null;
		}
	}

	 fromPixels (...args) {
		this._register_tensors(...args);
		try {
			var res = tf.browser.fromPixels(...args);

			this.custom_tensors["" + res.dataId.id] = [this.get_stack_trace(), res, this.tensor_print_to_string(res)];

			this.clean_custom_tensors();

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
		this._register_tensors(...args);
		try {
			var res = tf.input(...args);

			this.custom_tensors["" + res.id] = [this.get_stack_trace(), res, "[input]"];

			this.clean_custom_tensors();

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
		this._register_tensors(...args);
		try {
			var res = tf.ones(...args);

			this.custom_tensors["" + res.dataId.id] = [this.get_stack_trace(), res, this.tensor_print_to_string(res)];

			this.clean_custom_tensors();

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
		this._register_tensors(...args);
		try {
			var res = tf.reshape(...args);

			this.custom_tensors["" + res.dataId.id] = [this.get_stack_trace(), res, this.tensor_print_to_string(res)];

			this.clean_custom_tensors();

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
		this._register_tensors(...args);
		try {
			var res = tf.min(...args);

			this.custom_tensors["" + res.dataId.id] = [this.get_stack_trace(), res, this.tensor_print_to_string(res)];

			this.clean_custom_tensors();

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
		this._register_tensors(...args);
		try {
			var res = tf.max(...args);

			this.custom_tensors["" + res.dataId.id] = [this.get_stack_trace(), res, this.tensor_print_to_string(res)];

			this.clean_custom_tensors();

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
		this._register_tensors(...args);
		try {
			var res = tf.add(...args);

			this.custom_tensors["" + res.dataId.id] = [this.get_stack_trace(), res, this.tensor_print_to_string(res)];

			this.clean_custom_tensors();

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
		this._register_tensors(...args);
		try {
			var res = tf.abs(...args);

			this.custom_tensors["" + res.dataId.id] = [this.get_stack_trace(), res, this.tensor_print_to_string(res)];

			this.clean_custom_tensors();

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
		this._register_tensors(...args);
		try {
			var res = await tf.data.webcam(...args);

			this.clean_custom_tensors();

			return res;
		} catch (e) {
			if(Object.keys(e).includes("message")) {
				e = e.message;
			}

			this.err(e);

			return null;
		}
	}

	 resizeNearestNeighbor(...args) {
		this._register_tensors(...args);
		try {
			var res = tf.image.resizeNearestNeighbor(...args);

			this.custom_tensors["" + res.dataId.id] = [this.get_stack_trace(), res, "[resizeNearestNeighbor]"];

			this.clean_custom_tensors();

			return res;
		} catch (e) {
			if(Object.keys(e).includes("message")) {
				e = e.message;
			}

			this.err(e);

			return null;
		}
	}

	 resizeBilinear(...args) {
		this._register_tensors(...args);
		try {
			var res = tf.image.resizeBilinear(...args);

			this.custom_tensors["" + res.dataId.id] = [this.get_stack_trace(), res, "[resizeBilinear]"];

			this.clean_custom_tensors();

			return res;
		} catch (e) {
			if(Object.keys(e).includes("message")) {
				e = e.message;
			}

			this.err(e);

			return null;
		}
	}

	 rotateWithOffset (...args) {
		this._register_tensors(...args);
		try {
			var res = tf.image.rotateWithOffset(...args);

			this.custom_tensors["" + res.dataId.id] = [this.get_stack_trace(), res, this.tensor_print_to_string(res)];

			this.clean_custom_tensors();

			return res;
		} catch (e) {
			if(Object.keys(e).includes("message")) {
				e = e.message;
			}

			this.err(e);

			return null;
		}
	}

	 flipLeftRight (...args) {
		this._register_tensors(...args);
		try {
			var res = tf.image.flipLeftRight(...args);

			this.custom_tensors["" + res.dataId.id] = [this.get_stack_trace(), res, this.tensor_print_to_string(res)];

			this.clean_custom_tensors();

			return res;
		} catch (e) {
			if(Object.keys(e).includes("message")) {
				e = e.message;
			}

			this.err(e);

			return null;
		}
	}

	 clipByValue (...args) {
		this._register_tensors(...args);
		try {
			var res = tf.clipByValue(...args);

			this.custom_tensors["" + res.dataId.id] = [this.get_stack_trace(), res, this.tensor_print_to_string(res)];

			this.clean_custom_tensors();

			return res;
		} catch (e) {
			if(Object.keys(e).includes("message")) {
				e = e.message;
			}

			this.err(e);

			return null;
		}
	}

	 randomUniform (...args) {
		this._register_tensors(...args);
		try {
			var res = tf.randomUniform(...args);

			this.custom_tensors["" + res.dataId.id] = [this.get_stack_trace(), res, this.tensor_print_to_string(res)];

			this.clean_custom_tensors();

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
		this._register_tensors(...args);
		try {
			var res = tf.square(...args);

			this.custom_tensors["" + res.dataId.id] = [this.get_stack_trace(), res, this.tensor_print_to_string(res)];

			this.clean_custom_tensors();

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
		this._register_tensors(...args);
		try {
			var res = tf.mean(...args);

			this.custom_tensors["" + res.dataId.id] = [this.get_stack_trace(), res, this.tensor_print_to_string(res)];

			this.clean_custom_tensors();

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
		this._register_tensors(...args);
		try {
			var res = tf.sqrt(...args);

			this.custom_tensors["" + res.dataId.id] = [this.get_stack_trace(), res, this.tensor_print_to_string(res)];

			this.clean_custom_tensors();

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
		this._register_tensors(...args);
		try {
			var res = tf.tensor1d(...args);

			this.custom_tensors["" + res.dataId.id] = [this.get_stack_trace(), res, this.tensor_print_to_string(res)];

			this.clean_custom_tensors();

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
		this._register_tensors(...args);
		try {
			var res = tf.tensor2d(...args);

			this.custom_tensors["" + res.dataId.id] = [this.get_stack_trace(), res, this.tensor_print_to_string(res)];

			this.clean_custom_tensors();

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
		this._register_tensors(...args);
		try {
			var res = tf.tensor(...args);

			this.custom_tensors["" + res.id] = [this.get_stack_trace(), res, this.tensor_print_to_string(res)];

			this.clean_custom_tensors();

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
		this._register_tensors(...args);
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
		this._register_tensors(...args);
		try {
			var res = tf.divNoNan(...args);

			this.custom_tensors["" + res.id] = [this.get_stack_trace(), res, this.tensor_print_to_string(res)];

			this.clean_custom_tensors();

			return res;
		} catch (e) {
			if(Object.keys(e).includes("message")) {
				e = e.message;
			}

			this.err(e);

			return null;
		}
	}

	 oneHot (...args) {
		this._register_tensors(...args);
		try {
			var res = tf.oneHot(...args);

			this.custom_tensors[res.id] = [this.get_stack_trace(), res, this.tensor_print_to_string(res)];

			this.clean_custom_tensors();

			return res;
		} catch (e) {
			if(Object.keys(e).includes("message")) {
				e = e.message;
			}

			this.err(e);

			return null;
		}
	}

	clean_custom_tensors () {
		var keys = Object.keys(this.custom_tensors);

		if(!keys.length) {
			return;
		}
		var disposed_keys = [];

		for (var i in keys) {
			var key = keys[i];

			try {
				if(!Object.keys(this.custom_tensors).includes(key) || this.custom_tensors[key][1].isDisposedInternal || this.custom_tensors[key][1].isDisposed) {
					disposed_keys.push(key);
				}
			} catch (e) {
				if(("" + e).includes("this.custom_tensors[key] is undefined")) {
					//
				} else {
					this.wrn(e);
				}
			}
		}

		for (var i in disposed_keys) {
			delete this.custom_tensors[disposed_keys[i]];
		}
	}

	 parse_int (...args) {
		var res = parseInt(...args);

		if(isNaN(res)) {
			this.wrn("NaN detected in parse_int, args: " + JSON.stringify(args));
			console.trace();
		}

		return res;
	}

	 parse_float (...args) {
		var res = parseFloat(...args);

		if(isNaN(res)) {
			this.wrn("NaN detected in parse_int, args: " + JSON.stringify(args));
			console.trace();
		}

		return res;
	}

	async loadLayersModel (...args) {
		this._register_tensors(...args);
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
		this._register_tensors(...args);
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

		return msg;
	}

	get_model () {
		return this.model;
	}

	set_model (_m) {
		if(!this.is_model(_m)) {
			this.err("Given item is not a valid model");
			return;
		}

		this.model = _m;

		this.model_height = this.model.input.shape[1];
		this.model_width = this.model.input.shape[1];

		return this_model;
	}

	async toggle_webcam (item=null) {
		if(this.camera) {
			this.started_webcam = false;
			this.camera.stop()
			this.camera = null;

			if(item) {
				$(item).text("Start webcam");
			}
		} else {
			this.started_webcam = true;
			this.err("Cannot stop a camera that has not been started");
			if(this.webcam_prediction_div_name) {
				this.show_and_predict_webcam_in_div(this.webcam_prediction_div_name, this.webcam_height, this.webcam_width);
			}

			if(item) {
				$(item).text("Stop webcam");
			}
		}


	}

	predict_manually(_tensor) {
		if(!this.model) {
			this.err("Cannot predict without a model");
			return;
		}

		var output = this.tf_to_float(_tensor);

		for (var i = 0; i < this.model.layers.length; i++) {
			var input = output;
			output = this.model.layers[i].apply(input)

			if(this.draw_internal_states) {
				try {
					this._draw_internal_states(i, input, output);
				} catch (e) {
					this.err(e);
				}

			}
		}

		return output;
	}

	async show_and_predict_webcam_in_div(divname, _w, _h) {
		var $divname = $("#" + divname);
		this.assert(divname.length != 1, `div by id ${divname} could not be found`);	

		this.webcam_prediction_div_name = divname;

		if(!_w) {
			_w = 300;
			this.webcam_width = _w;
		}

		if(!_h) {
			_h = 300;
			this.webcam_height = _h;
		}

		var $video_element = $divname.find(".webcam_element");
		var $desc = $divname.find(".desc");

		if($video_element.length > 1) {
			this.wrn(`More than one video element found #${divname}. Using the first one`);
			$video_element = $video_element[0];
		} else if ($video_element.length) {
			$video_element = $video_element[0];
		} else {
			$video_element = $(`<video id="${divname}" width=${_w} height=${_h}></video>`)

			$divname.append($video_element);

			$video_element = $video_element[0];
		}

		this.last_video_element = $video_element;

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


		this.started_webcam = true;
		this.camera = await tf.data.webcam($video_element);

		while (this.started_webcam) {
			if(this.internal_states_div) {
				$("#" + this.internal_states_div).html("");			
			}

			var image = await this.camera.capture();

			var _data = this.resizeNearestNeighbor(image, [this.model_height, this.model_width]);
			var resized = this.expand_dims(_data);

			var res;
			try {
				res = this.predict_manually(resized)
			} catch (e) {
				if(Object.keys(e).includes("message")) {
					e = e.message;
				}

				this.err("" + e);
				this.err(`Input shape of the model: [${this.model.input.shape.join(", ")}]. Input shape of the data: [${resized.shape.join(", ")}]`);

				return;
			}

			var prediction = this.array_sync(res);

			$($desc).html(JSON.stringify(prediction));

			await this.dispose(res);
			await this.dispose(_data);
			await this.dispose(resized);
			await this.dispose(image);
			await this.delay(50);
		}
	}

	delay(time) {
		return new Promise(resolve => setTimeout(resolve, time));
	}

	array_to_html(array) {
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


	visualizeNumbersOnCanvas(
	  numberArray,
	  blockWidth = 1,
	  blockHeight = 25
	) {
		// Create or retrieve the canvas element
		var canvas = document.createElement("canvas");
		canvas.id = "neurons_canvas_" + this.uuidv4();
		canvas.classList.add("neurons_canvas_class");

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

	get_methods (obj) {
		return Object.getOwnPropertyNames(obj).filter(item => typeof obj[item] === "function")
	}

	show_internals (divname="") {
		if(!this.model) {
			this.dbg("No model found");

			return;
		}

		if(!this.model.layers) {
			this.dbg("No layer found");
		}

		this.draw_internal_states = true;
		if(divname) {
			this.internal_states_div = divname;
		}
	}

	_draw_internal_states (layer, inputs, applied) {
		var number_of_items_in_this_batch = inputs.shape[0];
		//log("number_of_items_in_this_batch: " + number_of_items_in_this_batch);

		for (var batchnr = 0; batchnr < number_of_items_in_this_batch; batchnr++) {
			var asanai_this = this;
			var input_data = this.tidy(() => { return asanai_this.array_sync(inputs); });
			var output_data = this.tidy(() => { return asanai_this.array_sync(applied) });

			var __parent = $("#" + this.internal_states_div);

			var layer_div = __parent.find($($(".layer_data")[layer]));
			if(layer_div.length == 0) {
				layer_div = $("<div class='layer_data'></div>");
				__parent.append(layer_div);
			}

			layer_div.html("<h3 class=\"data_flow_visualization layer_header\">Layer " + layer + " &mdash; " + $($(".layer_type")[layer]).val() + " " + this.get_layer_identification(layer) + "</h3>").hide();

			layer_div.show();
			layer_div.append("<div class='data_flow_visualization input_layer_header' style='display: none' id='layer_" + layer + "_input'><h4>Input:</h4></div>");
			layer_div.append("<div class='data_flow_visualization weight_matrix_header' style='display: none' id='layer_" + layer + "_kernel'><h4>Weight Matrix:</h4></div>");
			layer_div.append("<div class='data_flow_visualization output_header' style='display: none' id='layer_" + layer + "_output'><h4>Output:</h4></div>");
			layer_div.append("<div class='data_flow_visualization equations_header' style='display: none' id='layer_" + layer + "_equations'></div>");

			var input = $("#layer_" + layer + "_input");
			var kernel = $("#layer_" + layer + "_kernel");
			var output = $("#layer_" + layer + "_output");
			var equations = $("#layer_" + layer + "_equations");

			var kernel_data = [];

			if(this.model.layers[layer] && Object.keys(this.model.layers[layer]).includes("kernel")) {
				if(this.model.layers[layer].kernel.val.shape.length == 4) {
					var ks_x = 0;
					var ks_y = 1;
					var number_filters = 2;
					var filters = 3;

					kernel_data = this.tidy(() => {
						return this.array_sync(this.tf_transpose(this.model.layers[layer].kernel.val, [filters, ks_x, ks_y, number_filters]));
					});
				}
			}

			var canvas_input = this.draw_image_if_possible(layer, "input", input_data, 1);
			var canvas_kernel = this.draw_image_if_possible(layer, "kernel", kernel_data, 1);
			//console.log("output_data:", output_data);
			console.log("output_data.shape:", this.get_dim(output_data));
			var canvas_output = this.draw_image_if_possible(layer, "output", output_data, 1);

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
					if(this.get_shape_from_array(output_data).length == 1) {
						var h = this.visualizeNumbersOnCanvas(output_data)
						equations.append(h).show();
					} else {
						var h = this.array_to_html(output_data);
						equations.append(h).show();
					}
				}
			}
		}
	}

	draw_grid (canvas, pixel_size, colors, denormalize, black_and_white, onclick, multiply_by, data_hash, _class="") {
		this.assert(typeof(this.pixel_size) == "number", "pixel_size must be of type number, is " + typeof(this.pixel_size));
		if(!multiply_by) {
			multiply_by = 1;
		}

		var drew_something = false;

		var _height = colors.length;
		var _width = colors[0].length;

		$(canvas).attr("width", _width * this.pixel_size);
		$(canvas).attr("height", _height * this.pixel_size);
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
			for (var x = 0, i = 0; i < this.width; x += this.pixel_size, i++) {
				for (var y = 0, j = 0; j < _height; y += this.pixel_size, j++) {
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

		for (var x = 0, i = 0; i < this.width; x += this.pixel_size, i++) {
			for (var y = 0, j = 0; j < _height; y += this.pixel_size, j++) {
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
					w: this.pixel_size,
					h: this.pixel_size,
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
		if(this.model === null || this.model === undefined) {
			model_is_ok();
			return;
		}

		if(this.model.layers[i] && Object.keys(this.model.layers[i]).length >= 1) {
			var object_keys = Object.keys(this.model.layers[i]);
			var new_str = "";

			if(object_keys.includes("filters") && object_keys.includes("kernelSize")) {
				new_str = this.model.layers[i]["filters"] + "@" + this.model.layers[i].kernelSize.join("x");

			} else if(object_keys.includes("filters")) {
				new_str = "Filters:&nbsp;" + this.model.layers[i]["filters"];

			} else if(object_keys.includes("units")) {
				new_str = "Units:&nbsp;" + this.model.layers[i]["units"];

			} else if(object_keys.includes("rate")) {
				new_str = "Rate:&nbsp;" + this.model.layers[i]["rate"];

			} else if(object_keys.includes("poolSize")) {
				new_str = this.model.layers[i].poolSize.join("x");
			}

			return new_str;
		}

		return "";
	}

	get_dim(a) {
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

	draw_image_if_possible (layer, canvas_type, colors, get_canvas_object) {
		var canvas = null;

		try {
			var ret = false;

			if(!this.get_dim(colors).length == 4) {
				this.log("colors had no length of 3 but [" + this.get_dim(colors).join(", ") + "]");
				return false;
			}

			if(canvas_type == "output" || canvas_type == "input") {
				if(canvas_type == "input") {
					canvas = this.get_canvas_in_class(layer, "input_image_grid", !get_canvas_object);
				} else {
					canvas = this.get_canvas_in_class(layer, "image_grid", !get_canvas_object);
				}

				if(!get_canvas_object) {
					$($(canvas)[0]).parent().parent().show();
				}

				ret = this.draw_grid(canvas, this.pixel_size, colors, 1);
				if(get_canvas_object) {
					return canvas;
				}

				return ret;
			} else if(canvas_type == "kernel") {
				var shape = this.get_dim(colors);

				var canvasses = [];

				for (var filter_id = 0; filter_id < shape[0]; filter_id++) {
					for (var channel_id = 0; channel_id < shape[1]; channel_id++) {
						canvas = this.get_canvas_in_class(layer, "filter_image_grid", !get_canvas_object);

						if(!get_canvas_object) {
							$($(canvas)[0]).parent().parent().show();
						}

						//    this.draw_grid(canvas, this.pixel_size, colors, denormalize, black_and_white, onclick, multiply_by, data_hash) {
						ret = this.draw_kernel(canvas, this.kernel_pixel_size, colors[filter_id]);

						if(get_canvas_object) {
							canvasses.push(canvas);
						}
					}
				}

				if(get_canvas_object) {
					return canvasses;
				}
				return ret;
			}
		} catch (e) {
			this.err(e);
		}

		return false;
	}

	array_to_html(array) {
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

	get_canvas_in_class (layer, classname, dont_append, use_uuid=0) {
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

	scaleNestedArray(arr) {
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

	draw_kernel(canvasElement, rescaleFactor, pixels) {
		// canvasElement is the HTML canvas element where you want to draw the image
		// rescaleFactor is the factor by which the image should be resized, e.g., 2 for twice the size
		// pixels is a 3D array [n, m, a] where n is the height, m is the width, and a is the number of channels

		this.scaleNestedArray(pixels);

		var context = canvasElement.getContext('2d'); // Get the 2D rendering context

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
}
