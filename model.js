"use strict";

function except (errname, e) {
	write_descriptions();
	enable_everything();
	console.warn(errname + ": " + e + ". Resetting model.");
	console.trace();
	write_error(e);
	if(throw_compile_exception) { throw e; }
}

function get_model_config_hash () {
	var arr = [];
	$("#layers_container").find("input, checkbox, select").each(function (i, x) {
		if($(x).attr("type") == "checkbox") {
			arr.push($(x).is(":checked"));
		} else {
			arr.push($(x).val());
		}
	});

	var str = arr.join(";;;;;;;;;");

	return md5(str);
}

async function _create_model () {
	try {
		model = await create_model(model);

		if(can_be_shown_in_latex()) {
			$("#math_mode_settings").show();
		} else {
			$("#math_mode_settings").hide();
		}
	} catch (e) {
		except("ERROR1", e);
		if(mode == "amateur") {
			undo();
			Swal.fire({
				icon: 'error',
				title: 'Oops [4]...',
				text: e + "\n\nUndoing last change"
			});
		}
	}

	if(!disable_layer_debuggers && model) {
		add_layer_debuggers();
	}
}

async function compile_model (keep_weights, force_dont_keep_weights) {
	assert(get_numberoflayers() >= 1, "Need at least 1 layer.");

	keep_weights = keep_weights && $("#keep_weights").is(":checked");
	if(force_dont_keep_weights) {
		keep_weights = 0;
	}

	var recreate_model = false;

	if(model_config_hash != get_model_config_hash() || current_status_hash != get_current_status_hash()) {
		recreate_model = true;
	}

	var old_weights_string = false;

	if(!model) {
		model = await create_model(model, await get_model_structure());
	} else {
		if(keep_weights && model && Object.keys(model).includes("layers")) {
			old_weights_string = await get_weights_as_string(model);
		}
	}

	var model_was_trained_previously = model_is_trained;

	if(model_is_trained) {
		if(model_config_hash == get_model_config_hash()) {
			recreate_model = false;
		} else {
			recreate_model = true;
			if(recreate_model) {
				model_is_trained = false;
			}
		}
	}

	var recompiled_model = false;
	var recreated_model = false;

	if(recreate_model) {
		model_is_trained = false;
		reset_summary();
		await _create_model();
		recreated_model = true;
	}

	try {
		model_config_hash = get_model_config_hash();
		var model_data = get_model_data();
		model.compile(model_data);
		recompiled_model = true;
	} catch (e) {
		except("ERROR2", e);
	}

	$("#outputShape").val(JSON.stringify(model.outputShape));

	write_model_summary();

	if(keep_weights) {
		if(old_weights_string) {
			var new_weights_string = await get_weights_as_string(model);
			var old_weights = eval(old_weights_string);
			var new_weights = eval(new_weights_string);

			var old_shape_string = (await get_shape_from_array(old_weights)).toString();
			var new_shape_string = (await get_shape_from_array(new_weights)).toString();

			if(old_shape_string == new_shape_string) {
				if(old_weights_string != new_weights_string) {
					set_weights_from_string(JSON.stringify(old_weights), 1, 1, model);
					model_is_trained = true;
				}
			}
		}
	}
}

function get_data_for_layer (type, i, first_layer) {
	assert(typeof(type) == "string", type + " is not a string but " + typeof(type));
	assert(typeof(i) == "number", i + " is not a number but " + typeof(i));
	assert(typeof(first_layer) == "boolean", first_layer + " is not a boolean but " + typeof(first_layer));

	var data = {
		"name": type + "_" + (i + 1)
	};

	if(i == 0 || first_layer) {
		data["inputShape"] = get_input_shape();
	}

	for (var j = 0; j < layer_options[type]["options"].length; j++) {
		var option_name = layer_options[type]["options"][j];
		assert(typeof(option_name) == "string", option_name + " is not string but " + typeof(option_name));

		if(["pool_size", "kernel_size", "strides"].includes(option_name)) {
			if(type.endsWith("1d")) {
				data[get_js_name(option_name)] = [parseInt(get_item_value(i, option_name + "_x"))];
			} else if(type.endsWith("2d")) {
				data[get_js_name(option_name)] = [parseInt(get_item_value(i, option_name + "_x")), parseInt(get_item_value(i, option_name + "_y"))];
			} else if(type.endsWith("3d")) {
				data[get_js_name(option_name)] = [parseInt(get_item_value(i, option_name + "_x")), parseInt(get_item_value(i, option_name + "_y")), parseInt(get_item_value(i, option_name + "_z"))];
			} else if(type.endsWith("2dTranspose")) {
				data[get_js_name(option_name)] = [parseInt(get_item_value(i, option_name + "_x")), parseInt(get_item_value(i, option_name + "_y"))];
			} else {
				alert("Unknown layer type: " + type);
			}

		} else if(["trainable", "use_bias"].includes(option_name) ) {
			data[get_js_name(option_name)] = get_item_value(i, option_name);

		} else if(["size", "dilation_rate"].includes(option_name)) {
			data[get_js_name(option_name)] = eval("[" + get_item_value(i, option_name) + "]");

		} else if(option_name == "rate") {
			data["rate"] = parseFloat(get_item_value(i, "dropout"));

		} else if(["epsilon", "momentum", "dropout_rate"].includes(option_name)) {
			data[get_js_name(option_name)] = parseFloat(get_item_value(i, option_name));

		} else if(option_name == "activation" && $($($($(".layer_setting")[i]).find("." + option_name)[0])).val() == "None") {
			// Do nothing if activation = None
			data["activation"] = null;

		} else if(option_name == "kernel_initializer") {
			var initializer_name = get_item_value(i, "kernel_initializer");
			if(initializer_name) {
				var initializer_config = get_layer_initializer_config(i, "kernel");
				var initializer_config_string = JSON.stringify(initializer_config);
				data["kernelInitializer"] = {"name": initializer_name, "config": initializer_config};
			}
		} else if(option_name == "bias_initializer") {
			var initializer_name = get_item_value(i, "bias_initializer");
			if(initializer_name) {
				var initializer_config = get_layer_initializer_config(i, "bias");
				var initializer_config_string = JSON.stringify(initializer_config);
				data["biasInitializer"] = {"name": initializer_name, "config": initializer_config};
			}
		} else if(option_name == "bias_regularizer") {
			var regularizer_name = get_item_value(i, "bias_regularizer");
			if(regularizer_name) {
				var regularizer_config = get_layer_regularizer_config(i, "bias");
				var regularizer_config_string = JSON.stringify(regularizer_config);
				data["biasRegularizer"] = {"name": regularizer_name, "config": regularizer_config};
			}
		} else if(option_name == "activity_regularizer") {
			var regularizer_name = get_item_value(i, "activity_regularizer");
			if(regularizer_name) {
				var regularizer_config = get_layer_regularizer_config(i, "activity");
				var regularizer_config_string = JSON.stringify(regularizer_config);
				data["activityRegularizer"] = {"name": regularizer_name, "config": regularizer_config};
			}
		} else if(option_name == "kernel_regularizer") {
			var regularizer_name = get_item_value(i, "kernel_regularizer");
			if(regularizer_name) {
				var regularizer_config = get_layer_regularizer_config(i, "kernel");
				var regularizer_config_string = JSON.stringify(regularizer_config);
				data["kernelRegularizer"] = {"name": regularizer_name, "config": regularizer_config};
			}
		} else {
			var elem = $($($(".layer_setting")[i]).find("." + option_name)[0]);
			var value = $(elem).val();

			if($(elem).is(":checkbox")) {
				data[get_js_name(option_name)] = value == "on" ? true : false;
			} else {
				if(value == "") {
					//console.warn("Something may be wrong here! value is ''");
				} else {
					data[get_js_name(option_name)] = isNumeric(value) ? parseInt(value) : value;
				}
			}
		}
	}

	delete data["visualize"];

	return data;
}

async function get_model_structure() {
	//console.trace();
	var new_current_status_hash = await get_current_status_hash();
	/*
	if(layer_structure_cache && current_status_hash == new_current_status_hash) {
		//log("Using cache");
		//console.trace();
		return JSON.parse(layer_structure_cache);
	}
	*/
	var first_layer = true; // seperate from i because first layer may be input layer (which is not a "real" layer)
	var structure = [];

	for (var i = 0; i < get_numberoflayers(); i++) {
		var layer_type = $($($(".layer_setting")[i]).find(".layer_type")[0]);
		var type = $(layer_type).val();
		if(typeof(type) !== "undefined" && type) {
			var data = get_data_for_layer(type, i, first_layer);

			try {
				var layer_info = {
					"type": type,
					"data": data
				};
				structure.push(layer_info);

				first_layer = false;
			} catch (e) {
				//console.warn("Failed to add layer type ", type, ": ", e);
				//header("DATA:");
				//console.log(data);
				$($(".warning_container")[i]).show()
				$($(".warning_layer")[i]).html(e)
			}

			traindebug("tf.layers." + type + "(", data, ")");
		} else {
			header("ACHTUNG!!! IS EMPTY!!!");
			log('$($($(".layer_setting")[' + i + ']).find(".layer_type")[0]);');
			log($(layer_type).val());
			console.trace();
		}
	}

	layer_structure_cache = JSON.stringify(structure);
	return structure;
}

function is_number_array (value) {
	if(typeof(value) == "object") {
		for (var i = 0; i < value.length; i++) {
			if(typeof(value[i]) != "number") {
				return false;
			}
		}
		return true;
	}

	return false;
}

function is_valid_parameter (keyname, value, layer) {
	assert(typeof(keyname) == "string", "keyname " + keyname + " is not a string but " + typeof(keyname));
	assert(["string", "number", "boolean", "object"].includes(typeof(value)), value + " is not a string/number/boolean but " + typeof(value));
	assert(typeof(layer) == "number", layer + " is not a number but " + typeof(layer));

	if(
		(["units", "filters"].includes(keyname) && typeof(value) == "number") ||
		(["kernelRegularizer", "biasRegularizer", "activityRegularizer", "kernelInitializer", "biasInitializer"].includes(keyname) && (typeof(value) == "object") || ["zeros"].includes(value)) ||
		(["unitForgetBias", "center", "scale", "unroll", "trainable", "useBias", "stateful", "returnSequences", "returnState", "goBackwards"].includes(keyname) && typeof(value) == "boolean") ||
		(keyname == "name" && typeof(value) == "string") ||
		(["recurrentInitializer", "depthwiseInitializer", "pointwiseInitializer", "movingMeanInitializer", "movingVarianceInitializer", "betaInitializer", "gammaInitializer"].includes(keyname) && ['constant', 'glorotNormal', 'glorotUniform', 'heNormal', 'heUniform', 'identity', 'leCunNormal', 'leCunUniform', 'ones', 'orthogonal', 'randomNormal', 'randomUniform', 'truncatedNormal', 'varianceScaling', 'zeros', 'string', 'l1', 'l2', 'l1l2'].includes(value)) ||
		(keyname == "dtype" && ['float32', 'int32', 'bool', 'complex64', 'string'].includes(value)) ||
		(keyname == "padding" && ['valid', 'same', 'causal'].includes(value)) ||
		(["activation", "recurrentActivation"].includes(keyname) && ['LeakyReLU', 'elu', 'hardSigmoid', 'linear', 'relu', 'relu6',  'selu', 'sigmoid', 'softmax', 'softplus', 'softsign', 'tanh', 'swish', 'mish'].includes(value)) ||
		(["kernelSize", "poolSize", "strides", "dilationRate", "size"].includes(keyname) && (is_number_array(value) || typeof(value) == "number")) ||
		(keyname == "implementation" && [1, 2].includes(value)) ||
		(keyname == "interpolation" && ["nearest", "bilinear"].includes(value)) ||
		(keyname == "inputShape" && layer == 0 && is_number_array(value)) ||
		(keyname == "targetShape" && is_number_array(value)) ||
		(["alpha", "stddev", "depthMultiplier"].includes(keyname) && typeof(value) == "number") ||
		(keyname == "axis" && typeof(value) == "number" && parseInt(value) == value) ||
		(["recurrentDropout", "dropout", "rate", "dropout_rate"].includes(keyname) && typeof(value) == "number" && value >= 0 && value <= 1) ||
		(["epsilon"].includes(keyname) && typeof(value) == "number" && value >= 0) ||
		(["theta"].includes(keyname) && typeof(value) == "number") ||
		(["maxValue", "momentum"].includes(keyname) && typeof(value) == "number") ||
		(["cell"].includes(keyname) && typeof(value).includes("object"))
	) {
		return true;
	}

	return false;
}

function remove_empty(obj) {
	return Object.fromEntries(Object.entries(obj).filter(([_, v]) => v != null));
}

async function create_model (old_model, fake_model_structure, force) {
	var new_layers_container_md5 = await get_layers_container_md5();
	if(!layers_container_md5 || force) {
		layers_container_md5 = new_layers_container_md5;
	}

	var new_current_status_hash = await get_current_status_hash();
	if(!force) {
		if(fake_model_structure === undefined && new_current_status_hash == current_status_hash) {
			//return old_model;
		}
	}

	var old_weights_string = false;
	if(model && Object.keys(model).includes("layers")) {
		old_weights_string = await get_weights_as_string(model);
	}

	current_status_hash = new_current_status_hash;

	$(".warning_container").hide();

	if(!force) {
		if(disable_show_python_and_create_model) {
			return;
		}
	}

	var new_model = tf.sequential();

	var model_structure = fake_model_structure;
	if(model_structure === undefined) {
		model_structure = await get_model_structure();
	}

	var html = '';

	html += '<html>' + "\n";
	html += "        <head>\n";
	html += "		<meta charset='UTF-8'>\n";
	html += "                <title>Example Network</title>\n";
	html += "                <script src='https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@2.0.0/dist/tf.min.js'></script>\n";
	html += "                <script src='https://code.jquery.com/jquery-3.6.0.js'></script>\n";
	html += "        </head>\n";
	html += "        <body>\n";
	html += "		<script type='text/javascript'>\n";
	html += "			var model;\n";
	html += "			var labels = ['" + labels.join("', '") + "'];\n";
	html += "			async function load_model () {\n";
	html += "				if(!model) {\n";
	html += "					model = await tf.loadLayersModel('./model.json');\n";
	html += "				}\n";
	html += "			}\n";
	if(input_shape_is_image()) {
		html += "			var load_file = (function(event) {\n";
		html += "				var output = document.getElementById('output');\n";
		html += "				$('#output').removeAttr('src');\n";
		html += "				output.src = URL.createObjectURL(event.target.files[0]);\n";
		html += "				output.onload = async function() {\n";
		html += "					await load_model();\n";
		html += "					URL.revokeObjectURL(output.src);\n";
		html += "					var img = $('#output')[0];\n";
		html += "					img.height = model.layers[0].input.shape[1];\n";
		html += "					img.width = model.layers[0].input.shape[2];\n";
		html += "					var tensor = tf.browser.fromPixels(img);\n";
		html += "					var results_tensor = await model.predict(tensor.expandDims());\n";
		html += "					var results = results_tensor.dataSync();\n";
		html += "					var html = '<pre>';\n";
		html += "					for (var i = 0; i < results.length; i++) {\n";
		html += "						var label = labels[i % labels.length];\n";
		html += "						html += label + ': ' + results[i] + '\n';\n";
		html += "					}\n";
		html += "					html += '</pre>';\n";
		html += "					$('#results').html(html);\n";
		html += "					$('#results_container').show();\n";
		html += "				};\n";
		html += "				$('#output').show();\n";
		html += "			});\n";
	} else {
		html += "TODO\n"
	}
	html += "		</script>\n";
	html += "        </body>\n";
	html += "	<input type='file' id='upload_img' onchange='load_file(event)' />\n";
	if(input_shape_is_image()) {
		html += "	<div id='results_container' style='display: none'>\n";
		html += "		<img id='output' />\n";
		html += "		<div id='results'></div>\n";
		html += "	</div>\n";
	} else {
		html += "TODO\n";
	}
	html += '</html>' + "\n";

	var node_js = "import * as tf from '@tensorflow/tfjs-node';\n";

	node_js += "// npm install @tensorflow/tfjs-node\n";
	node_js += "var model = tf.sequential();\n";

	for (var i = 0; i < model_structure.length; i++) {
		var type = model_structure[i]["type"];
		var data = model_structure[i]["data"];

		var has_keys = Object.keys(data);

		if(has_keys.includes("dropout_rate") && type == "dropout") {
			var tmp = data["dropout_rate"];
			delete data["dropout_rate"];
			data["rate"] = tmp;
			has_keys = Object.keys(data);
		}

		if(["lstm", "gru", "simpleRNN"].includes(type) && has_keys.includes("rate")) {
			var tmp = data["rate"];
			delete data["rate"];
			data["dropout"] = tmp;
			has_keys = Object.keys(data);
		}

		if("targetShape" in data && ["string", "number"].includes(typeof(data["targetShape"]))) {
			data["targetShape"] = eval("[" + data["targetShape"] + "]");
		}

		if("size" in data && typeof(data["size"]) == "string") {
			data["size"] = eval("[" + data["size"] + "]");
		}

		if("dilationRate" in data && data["dilationRate"].length == 0) {
			data["dilationRate"] = null;
		}

		if("units" in data && typeof(data["units"]) == "undefined") {
			data["units"] = 2;
		}

		["strides", "kernelSize"].forEach(function (correction_name) {
			if(correction_name in data && (isNaN(data[correction_name][0]) || typeof(data[correction_name][0]) == "undefined")) {
				for (var k = 0; k < data[correction_name].length; k++) {
					data[correction_name][k] = 1;
				}
			}
		});

		var node_data = JSON.parse(JSON.stringify(data));

		if(has_keys.includes("kernelInitializer")) {
			var original_name = data["kernelInitializer"]["name"];
			var options_stringified = JSON.stringify(data["kernelInitializer"]["config"]);
			if(original_name) {
				data["kernelInitializer"] = eval(`tf.initializers.${original_name}(${options_stringified})`);
			}
		}

		if(has_keys.includes("biasInitializer")) {
			var original_name = data["biasInitializer"]["name"];
			var options_stringified = JSON.stringify(data["biasInitializer"]["config"]);
			if(original_name) {
				data["biasInitializer"] = eval(`tf.initializers.${original_name}(${options_stringified})`);
			}
		}

		if(has_keys.includes("biasRegularizer")) {
			var original_name = data["biasRegularizer"]["name"];
			var options_stringified = JSON.stringify(data["biasRegularizer"]["config"]);
			if(original_name && original_name != "none") {
				data["biasRegularizer"] = eval(`tf.regularizers.${original_name}(${options_stringified})`);
			} else {
				data["biasRegularizer"] = null;
				node_data["biasRegularizer"] = null;
			}
		}

		if(has_keys.includes("kernelRegularizer")) {
			var original_name = data["kernelRegularizer"]["name"];
			var options_stringified = JSON.stringify(data["kernelRegularizer"]["config"]);
			if(original_name && original_name != "none") {
				data["kernelRegularizer"] = eval(`tf.regularizers.${original_name}(${options_stringified})`);
			} else {
				data["kernelRegularizer"] = null;
				node_data["kernelRegularizer"] = null;
			}
		}

		if(has_keys.includes("activityRegularizer")) {
			var original_name = data["activityRegularizer"]["name"];
			var options_stringified = JSON.stringify(data["activityRegularizer"]["config"]);
			if(original_name && original_name != "none") {
				data["activityRegularizer"] = eval(`tf.regularizers.${original_name}(${options_stringified})`);
			} else {
				data["activityRegularizer"] = null;
				node_data["activityRegularizer"] = null;
			}
		}

		if(type == "rnn") {
			// never worked...
			var lstm_cells = [];
			for (var index = 0; index < data["units"]; index++) {
				lstm_cells.push(tf.layers.RNNCell({units: data["units"]}));
			}
			data["cell"] = lstm_cells;
			log(data);
		}

		data = remove_empty(data);
		node_data = remove_empty(node_data);

		var data_keys = Object.keys(data);
		for (var k = 0; k < data_keys.length; k++) {
			var this_key = data_keys[k];
			var layer_setting = $($(".layer_setting")[i]);
			var current_setting = layer_setting.find("." + js_names_to_python_names[this_key]);
			if(!is_valid_parameter(this_key, data[this_key], i)) {
				header("INVALID PARAMETER: " + this_key + ": " + data[this_key] + " (" + typeof(data[this_key]) + ")");
				current_setting.css("background-color", "red");
			} else {
				current_setting.css("background-color", "");
			}
		}

		try {
			new_model.add(tf.layers[type](data));
		} catch (e) {
			if(!fake_model_structure) {
				var msg = e;
				console.trace();
				if(mode != "expert") {
					msg = msg + "\n\nUndoing last change"
				}
				Swal.fire({
					icon: 'error',
					title: 'Oops [3]...',
					text: msg
				}).then(() => {
					if(mode != "expert") {
						undo();
						future_state_stack = [];
						show_hide_undo_buttons();
					}
				});
			}
			return model;
		}

		if(Object.keys(node_data).includes("kernelInitializer")) {
			node_data["kernelInitializer"] = "tf.initializers." + node_data["kernelInitializer"]["name"] + "(" + JSON.stringify(node_data["kernelInitializer"]["config"]) + ")";
		}

		if(Object.keys(node_data).includes("biasInitializer")) {
			node_data["biasInitializer"] = "tf.initializers." + node_data["biasInitializer"]["name"] + "(" + JSON.stringify(node_data["biasInitializer"]["config"]) + ")";
		}

		if(Object.keys(node_data).includes("biasRegularizer")) {
			node_data["biasRegularizer"] = "tf.regularizers." + node_data["biasRegularizer"]["name"] + "(" + JSON.stringify(node_data["biasRegularizer"]["config"]) + ")";
		}

		if(Object.keys(node_data).includes("kernelRegularizer")) {
			node_data["kernelRegularizer"] = "tf.regularizers." + node_data["kernelRegularizer"]["name"] + "(" + JSON.stringify(node_data["kernelRegularizer"]["config"]) + ")";
		}

		if(Object.keys(node_data).includes("activityRegularizer")) {
			node_data["activityRegularizer"] = "tf.regularizers." + node_data["activityRegularizer"]["name"] + "(" + JSON.stringify(node_data["activityRegularizer"]["config"]) + ")";
		}

		var encoded_data_string = "";
		var encoded_data_array = [];

		if(i == 0) {
			node_data["inputShape"] = "[" + node_data["inputShape"].join(", ") + "]";
		} else {
			delete node_data["inputShape"];
			delete node_data["dtype"];
		}

		var node_data_keys = Object.keys(node_data);

		for (var k = 0; k < node_data_keys.length; k++) {
			if(["kernelInitializer", "biasInitializer", "inputShape", "kernelRegularizer", "activityRegularizer", "biasRegularizer"].includes(node_data_keys[k]) || ["number", "boolean"].includes(typeof(node_data[node_data_keys[k]]))) {
				encoded_data_array.push('"' + node_data_keys[k] + '": ' + node_data[node_data_keys[k]]);
			} else {
				if(["kernelSize", "strides", "dilationRate", "poolSize"].includes(node_data_keys[k])) {
					encoded_data_array.push('"' + node_data_keys[k] + '": ' + "[" + node_data[node_data_keys[k]] + "]");
				} else {
					encoded_data_array.push('"' + node_data_keys[k] + '": "' + node_data[node_data_keys[k]] + '"');
				}
			}
		}

		encoded_data_string = encoded_data_array.join(",\n") + "\n";

		node_js += "model.add(tf.layers." + type + "({" + encoded_data_string + "}));\n";
	}

	node_js += "\nmodel.summary();\n";


	if(typeof(fake_model_structure) == "undefined") {
		$("#node").html(node_js);
		$("#html").text(html);
	}

	current_layer_status_hash = get_current_layer_container_status_hash();

	if(!force_dont_keep_weights) {
		if(old_weights_string) {
			if(layers_container_md5 == new_layers_container_md5) {
				var new_weights_string = await get_weights_as_string(new_model);
				var old_weights = eval(old_weights_string);
				var new_weights = eval(new_weights_string);

				var old_shape_string = (await get_shape_from_array(old_weights)).toString();
				var new_shape_string = (await get_shape_from_array(new_weights)).toString();

				if(old_shape_string == new_shape_string) {
					if(old_weights_string != new_weights_string) {
						set_weights_from_string(JSON.stringify(old_weights), 1, 1, new_model);
					}
				}
			} else {
				layers_container_md5 = new_layers_container_md5;
			}
		}
	}

	return new_model;
}

function get_fake_data_for_layertype (layer_nr, layer_type) {
	assert(typeof(layer_nr) == "number", layer_nr + " is not an number but " + typeof(layer_nr));
	assert(typeof(layer_type) == "string", layer_type + " is not an string but " + typeof(layer_type));
	assert(Object.keys(layer_options).includes(layer_type), "Unknown layer type " + layer_type);

	write_descriptions();

	var data = {};

	var options = layer_options[layer_type]["options"]

	if(layer_nr == 0) {
		data["inputShape"] = get_input_shape();
	}

	for (var i = 0; i < options.length; i++) {
		var this_option = options[i];

		var js_option_name = undefined;
		if (this_option in python_names_to_js_names) {
			js_option_name = python_names_to_js_names[this_option]
		} else if (this_option.startsWith("strides")) {
			js_option_name = "strides";
		} else if (this_option.startsWith("kernel_size")) {
			js_option_name = "kernelSize";
		} else if (this_option == "dropout") {
			js_option_name = "rate";
		} else if (this_option.startsWith("pool_size")) {
			js_option_name = "poolSize";
		} else if (this_option == "dropout_rate") {
			js_option_name = "dropoutRate";
		} else if(this_option == "visualize") {
			// left emtpy on purpose
		}

		if(js_option_name) {
			var default_value = get_default_option(layer_type, js_names_to_python_names[js_option_name]);

			if(js_option_name === undefined) {
				console.warn("Cannot map " + this_option + " to js_option_name");
			} else {
				if(js_option_name == "dilationRate") {
					data[js_option_name] = eval(default_value);
				} else if (typeof(default_value) == "function") {
					data[js_option_name] = default_value(i);
				} else {
					data[js_option_name] = default_value;
				}
			}

			data = remove_empty(data);
		}
	}

	return data;
}

function get_default_option (layer_type, option_name) {
	assert(typeof(layer_type) == "string", "layer_type must be string, is " + typeof(layer_type));
	assert(typeof(option_name) == "string", "option_name must be string, is " + typeof(option_name));

	var match = layer_type.match(/(\d+)[dD]$/);

	if(match) {
		if(typeof(layer_options_defaults[option_name]) == "string" && layer_options_defaults[option_name] == "[]") {
			var number_of_match_items = parseInt(match[1]);
			var number = 2;
			var results = [];
			for (var i = 0; i < number_of_match_items; i++) {
				results.push(number);
			}

			return results;
		}
	}

	return layer_options_defaults[option_name];
}

async function create_fake_model_structure (layer_nr, layer_type) {
	assert(typeof(layer_nr) == "number", layer_nr + " is not an number but " + typeof(layer_nr));
	assert(typeof(layer_type) == "string", layer_type + " is not an string but " + typeof(layer_type));

	var fake_model_structure = await get_model_structure();

	fake_model_structure[layer_nr]["type"] = layer_type;
	fake_model_structure[layer_nr]["data"] = get_fake_data_for_layertype(layer_nr, layer_type);

	return fake_model_structure;
}

async function compile_fake_model (layer_nr, layer_type) {
	assert(typeof(layer_nr) == "number", layer_nr + " is not an number but " + typeof(layer_nr));
	assert(typeof(layer_type) == "string", layer_type + " is not an string but " + typeof(layer_type));

	var fake_model_structure = await create_fake_model_structure(layer_nr, layer_type);

	try {
		var fake_model = await create_model(null, fake_model_structure);
		fake_model.compile(get_model_data());
	} catch (e) {
		return false;
	}
	return true;
}

// Heuristic check of whether layer types are possible at all. Only test if they're possible,
// this saves a lot of time

function _heuristic_layer_possibility_check(layer_type, layer_input_shape) {
	if(["conv1d", "conv2d", "conv2dTranspose", "upSampling2d", "conv3d", "depthwiseConv2d", "separableConv2d", "averagePooling1d", "averagePooling2d", "averagePooling3d", "globalMaxPooling1d", "globalMaxPooling2d", "maxPooling1d", "maxPooling2d", "maxPooling3d", "globalAveragePooling1d"].includes(layer_type)) {
		if(["conv1d", "averagePooling1d", "globalMaxPooling1d", "maxPooling1d", "globalAveragePooling1d"].includes(layer_type)) {
			if(layer_input_shape.length == 2) {
				return true;
			}
			return false;
		} else if(["conv2d", "conv2dTranspose", "upSampling2d", "depthwiseConv2d", "separableConv2d", "averagePooling2d", "globalMaxPooling2d", "maxPooling2d"].includes(layer_type)) {
			if(layer_input_shape.length == 3) {
				return true;
			}
			return false;
		} else if(["conv3d", "averagePooling3d", "maxPooling3d", "globalAveragePooling2d", "zeroPadding2d"].includes(layer_type)) {
			if(layer_input_shape.length == 4) {
				return true;
			}
			return false;
		}
	} else if(["globalAveragePooling2d", "zeroPadding2d"].includes(layer_type)) {
		if(["globalAveragePooling2d", "zeroPadding2d"].includes(layer_type)) {
			if(layer_input_shape.length == 3) {
				return true;
			}
			return false;
		}

	} else if(["gru"].includes(layer_type)) {
		if(layer_type == "gru" && layer_input_shape.length < 2) {
			return false;
		}
	} else if(["ZeroPadding2D"].includes(layer_type)) {
		if(layer_type == "gru" && layer_input_shape.length != 4) {
			return false;
		}
	}

	return true;
}

function heuristic_layer_possibility_check (layer_nr, layer_type) {
	assert(typeof(layer_nr) == "number", layer_nr + " is not an number but " + typeof(layer_nr));
	assert(typeof(layer_type) == "string", layer_type + " is not an string but " + typeof(layer_type));

	var layer_input_shape = calculate_default_target_shape(layer_nr);

	if(layer_type == "flatten") {
		if(layer_nr == 0) {
			return false;
		} else {
			if(layer_input_shape.length > 1) {
				return true;
			} else {
				return false;
			}
		}
	}

	return _heuristic_layer_possibility_check(layer_type, layer_input_shape);
}

async function get_valid_layer_types (layer_nr) {
	assert(typeof(layer_nr) == "number", layer_nr + " is not an number but " + typeof(layer_nr));

	if(!typeof(last_allowed_layers_update) == "undefined" &&  last_allowed_layers_update == await get_current_status_hash() && Object.keys(allowed_layer_cache).includes(layer_nr)) {
		return allowed_layer_cache[layer_nr];
	}

	allowed_layer_cache[layer_nr] = null;

	last_allowed_layers_update = await get_current_status_hash();

	var valid_layer_types = [];

	$('body').css('cursor', 'wait');

	for (var i = 0; i < layer_names.length; i++) {
		var layer_type = layer_names[i];
		if(mode == "expert") {
			valid_layer_types.push(layer_type);
		} else {
			if(["dense", "reshape", "dropout"].includes(layer_type) || ["Activation", "Noise"].includes(layer_options[layer_type].category)) {
				valid_layer_types.push(layer_type);
			} else {
				if(heuristic_layer_possibility_check(layer_nr, layer_type)) {
					//log("Testing " + layer_type);
					if(await compile_fake_model(layer_nr, layer_type)) {
						valid_layer_types.push(layer_type);
					}
				}
			}
		}
	}

	$('body').css('cursor', 'default');

	allowed_layer_cache[layer_nr] = valid_layer_types;

	return valid_layer_types;
}

function set_weights_from_json_object (json, dont_show_weights, no_error, m) {
	if(!m) {
		m = model;
	}

	if(!m) {
		log("No model");
		return;
	}

	var weights_array = [];

	var tensors = [];

	if(typeof(json) == "string") {
		json = JSON.parse(json);
	}

	for (var i = 0; i < json.length; i++) {
		tensors.push(tf.tensor(json[i]));
	}

	try {
		m.setWeights(tensors);

		for (var i = 0; i < json.length; i++) {
			dispose(tensors[i]);
		}
	} catch (e) {
		if(!no_error) {
			Swal.fire({
				icon: 'error',
				title: 'Error loading weights',
				text: "e"
			});
		}
		return false;
	}

	if(!dont_show_weights) {
		Swal.fire(
			'Weights loaded successfully',
			'',
			'success'
		);
	}

	return true;
}

async function set_weights_from_string (string, no_warning, no_error, m) {
	var json = JSON.parse(string);

	return set_weights_from_json_object(json, no_warning, no_error, m);
}

async function get_weights_as_string (m) {
	if(!m) {
		m = model;
	}

	if(!model) {
		return false;
	}

	if(m) {
		var weights = await m.getWeights();

		var weights_array = [];

		for (var i = 0; i < weights.length; i++) {
			if(!weights[i].isDisposed) {
				try {
					weights_array[i] = weights[i].arraySync();
				} catch (e) {}
			}
		}

		return JSON.stringify(weights_array);
	} else {
		return false;
	}
}

async function copy_weights_to_clipboard () {
	copy_to_clipboard(await get_weights_as_string());

	Swal.fire(
		'Done!',
		'Copied weights to clipboard',
		'success'
	)
}

function download(filename, text) {
	var element = document.createElement('a');
	element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
	element.setAttribute('download', filename);

	element.style.display = 'none';
	document.body.appendChild(element);

	element.click();

	document.body.removeChild(element);
}

async function download_weights_json () {
	download("weights.json", await get_weights_as_string());
}

async function output_size_at_layer (input_size_of_first_layer, layer_nr) {
	if(!model) {
		await compile_model();
	}
	var output_size = input_size_of_first_layer;
	for (var i = 0; i < model.layers.length; i++) {
		output_size = model.layers[i].getOutputAt(0)["shape"];
		if(i == layer_nr) {
			return output_size;
		}
	}
	return output_size;
}


function save_model () {
	try {
		model.save('downloads://model');
	} catch (e) {
		Swal.fire({
			icon: 'error',
			title: 'Saving model failed',
			text: 'The model may be defective and cannot be saved. Sorry. The error is: ' + e
		});
	}
}

function get_current_chosen_object_default_weights_string () {
	var category_text = $("#dataset_category option:selected").text();
	var dataset = $("#dataset option:selected").text();
	var this_struct = traindata_struct[category_text]["datasets"][dataset];

	var response = "";

	var weights_file = this_struct["weights_file"][get_chosen_dataset()];

	if(!weights_files[weights_file]) {
		$.ajax({
			type: "GET",
			url: weights_file,
			async: false,
			success : function(text) {
				response = text;
			}
		});

		weights_files[weights_file] = JSON.stringify(response);
	}

	return weights_files[weights_file];
}

async function get_weights_shape (weights_as_string, m) {
	if(!m) {
		m = model;
	}
	if(weights_as_string === undefined) {
		weights_as_string = await get_weights_as_string(m);
	}
	var weights_array = eval(weights_as_string);

	var test_tensor = tf.tensor(weights_array);

	var shape = test_tensor.shape;
	dispose(test_tensor);

	return shape;
}

async function _show_load_weights () {
	if(!model) {
		return false;
	}

	var this_weights_file = traindata_struct[$("#dataset_category option:selected").text()].datasets[$("#dataset option:selected").text()].weights_file;

	if(!(Object.keys(this_weights_file).length >= 1)) {
		return false;
	}

	try {
		var default_weights_shape = JSON.stringify(await get_weights_shape(get_current_chosen_object_default_weights_string()));
		var current_network_weights_shape = JSON.stringify(await get_weights_shape());
		if(default_weights_shape === current_network_weights_shape) {
			if(get_current_chosen_object_default_weights_string() == await get_weights_as_string()) {
				return false;
			} else {
				return true;
			}
		}
		return false;
	} catch (e) {
		return false;
	}
}

async function get_tfjs_model () {
	await model.save('localstorage://demo/management/model1');

	var str = localStorage["tensorflowjs_models/demo/management/model1/model_topology"];

	return str;
}

async function force_reinit () {
	if(!model) {
		return;
	}
	var old_force_dont_keep_weights = force_dont_keep_weights;

	force_dont_keep_weights = true;

	await compile_model(0, 1);

	force_dont_keep_weights = old_force_dont_keep_weights;

	updated_page();
}

function input_shape_is_image () {
	var shape = get_input_shape();
	if(shape.length == 3 && shape[2] == 3) {
		return true;
	}
	return false;
}
