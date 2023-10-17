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

		this.started_webcam = false;
		this.camera = null

		this.model = null;

		if(args.length == 1) {
			if(Object.keys(args[0]).includes("model")) {
				if(this.is_model(args[0].model)) {
					this.model = args[0].model;
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

			if(Object.keys(args[0]).includes("is_dark_mode")) {
				if(typeof(args[0].is_dark_mode) == "boolean") {
					this.is_dark_mode = args[0].is_dark_mode;
				} else {
					throw new Error("is_dark_mode is not a boolean");
				}
			}
		} else if (args.length > 1) {
			throw new error("All arguments must be passed to asanAI in a JSON-like structure as a single parameter");
		}
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
				wrn("tensor to be printed was already disposed");
			} else {
				err("tensor_print_to_string failed:", e);

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

		return this_model;
	}

	stop_webcam () {
		if(this.camera) {
			this.started_webcam = false;
			this.camera.stop()
			this.camera = null;
		} else {
			this.err("Cannot stop a camera that has not been started");
		}
	}

	async show_and_predict_webcam_in_div(divname, _w, _h) {
		var $divname = $("#" + divname);
		this.assert(divname.length != 1, `div by id ${divname} could not be found`);	

		if(!_w) {
			_w = 300;
		}

		if(!_h) {
			_h = 300;
		}

		var $video_element = $divname.find("#webcam_element");
		if($video_element.length) {
			$video_element = $video_element[0];
		} else {
			$video_element = $(`<video id="${divname}" width=${_w} height=${_h}></video>`)

			$divname.append($video_element);

			$video_element = $video_element[0];
		}

		this.started_webcam = true;
		this.camera = await tf.data.webcam($video_element);

		while (this.started_webcam) {
			var image = await this.camera.capture();
			var prediction = this.tidy(() => {
				var resized = this.expand_dims(this.resizeNearestNeighbor(image, [50, 50]));
				var res = this.model.predict(resized)

				return this.array_sync(res);
			});

			this.log(prediction);

			await this.dispose(image);
		}
	}
}
