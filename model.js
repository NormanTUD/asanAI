"use strict";

async function except (errname, e) {
	await write_descriptions();
	await enable_everything();

	if(Object.keys(e).includes("message")) {
		e = e.message;
	}

	console.warn(errname + ": " + e + ". Resetting model.");
	console.trace();
	await write_error(e);
	if(throw_compile_exception) {
		throw new Error(e);
	}
}

async function get_model_config_hash () {
	var arr = [];
	$("#layers_container").find("input, checkbox, select").each(function (i, x) {
		if($(x).attr("type") == "checkbox") {
			arr.push($(x).is(":checked"));
		} else {
			arr.push($(x).val());
		}
	});

	var str = arr.join(";;;;;;;;;");

	return await md5(str);
}

async function _create_model () { var start_tensors = memory_leak_debugger();
	if(has_missing_values) {
		l("Not creating model because some values are missing (_create_model)");
		return model;
	}
	try {
		if(global_model_data) {
			var model_data_tensors = findTensorsWithIsDisposedInternal(global_model_data);
			for (var i = 0; i < model_data_tensors.length; i++) {
				await dispose(model_data_tensors[i]);
			}
		}

		[model, global_model_data] = await create_model(model);

		if(can_be_shown_in_latex()) {
			$("#math_mode_settings").show();
		} else {
			$("#math_mode_settings").hide();
		}
	} catch (e) {
		await except("ERROR1", e);
		if(mode == "beginner") {
			Swal.fire({
				icon: 'error',
				title: 'Oops [4]...',
				text: e
			});
		} else {
			l("ERROR: " + e);
		}
	}

	if(!disable_layer_debuggers && model) {
		add_layer_debuggers();
	}

	memory_leak_debugger("_create_model", start_tensors + 2); // 2 neue tensoren wegen global_model_data
}

async function _get_recreate_model(current_status_hash, model_config_hash, new_model_config_hash) { var start_tensors = memory_leak_debugger();
	var recreate_model = false;

	if(model_config_hash != new_model_config_hash || current_status_hash != await get_current_status_hash()) {
		recreate_model = true;
	}

	if(model_is_trained) {
		if(model_config_hash == new_model_config_hash) {
			recreate_model = false;
		} else {
			recreate_model = true;
			if(recreate_model) {
				model_is_trained = false;
			}
		}
	}

	memory_leak_debugger("_get_recreate_model", start_tensors);
	return recreate_model;
}

function findTensorsWithIsDisposedInternal(obj, tensorList = []) {
	if (typeof obj === "object") {
		if (obj.isDisposedInternal !== undefined) {
			tensorList.push(obj);
		}
		for (const key in obj) {
			findTensorsWithIsDisposedInternal(obj[key], tensorList);
		}
	}
	return tensorList;
}

async function compile_model () { var start_tensors = memory_leak_debugger();
	assert(get_number_of_layers() >= 1, "Need at least 1 layer.");
	var new_model_config_hash = await get_model_config_hash();
	assert(typeof(new_model_config_hash) == "string", "new model config has is not a string");

	var recreate_model = await _get_recreate_model(current_status_hash, model_config_hash, new_model_config_hash);

	if(!model) {
		if(finished_loading) {
			console.warn("model not given");
		}

		if(global_model_data) {
			var model_data_tensors = findTensorsWithIsDisposedInternal(global_model_data);
			for (var i = 0; i < model_data_tensors.length; i++) {
				await dispose(model_data_tensors[i]);
			}
		}

		[model, global_model_data] = await create_model(model, await get_model_structure());
	}

	if(recreate_model) {
		model_is_trained = false;
		reset_summary();
		await _create_model();
		await last_shape_layer_warning();
	}

	try {
		model_config_hash = new_model_config_hash;
		model.compile(global_model_data);
	} catch (e) {
		await except("ERROR2", e);
	}

	$("#outputShape").val(JSON.stringify(model.outputShape));

	write_model_summary_wait();

	memory_leak_debugger("compile_model", start_tensors + findTensorsWithIsDisposedInternal(global_model_data).length);
}

function get_weight_type_name_from_option_name (on) {
	if(on.match(/_/)) {
		for (var i = 0; i < valid_initializer_types.length; i++) {
			var v = valid_initializer_types[i];
			var re = new RegExp("^" + v + "(?:_.*)?$");
			if(on.match(re)) {
				return v;
			}
		}
	} else {
		return on;
	}

	return on;
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

		} else if (valid_initializer_types.includes(get_key_name_camel_case(get_weight_type_name_from_option_name(option_name))) && option_name.includes("nitializer")) {
			var weight_type = get_weight_type_name_from_option_name(option_name);

			var initializer_name = get_item_value(i, weight_type + "_initializer");
			if(initializer_name) {
				var initializer_config = get_layer_initializer_config(i, weight_type);
				var initializer_config_string = JSON.stringify(initializer_config);
				data[get_key_name_camel_case(weight_type) + "Initializer"] = {"name": initializer_name, "config": initializer_config};
			}

		} else if (valid_initializer_types.includes(get_key_name_camel_case(get_weight_type_name_from_option_name(option_name))) && option_name.includes("egularizer")) {
			var weight_type = get_weight_type_name_from_option_name(option_name);
			var regularizer_name = get_item_value(i, weight_type + "_regularizer");
			if(regularizer_name) {
				var regularizer_config = get_layer_regularizer_config(i, weight_type);
				var regularizer_config_string = JSON.stringify(regularizer_config);
				data[get_key_name_camel_case(weight_type) + "Regularizer"] = {"name": regularizer_name, "config": regularizer_config};
			}

		} else {
			var elem = $($($(".layer_setting")[i]).find("." + option_name)[0]);
			var value = $(elem).val();

			if($(elem).is(":checkbox")) {
				data[get_js_name(option_name)] = value == "on" ? true : false;
			} else {
				if(value == "") {
					if(!option_name.includes("constraint")) {
						console.warn("Something may be wrong here! Value for '" + option_name.toString() + "' is ''");
					}
				} else {
					data[get_js_name(option_name)] = isNumeric(value) ? parseFloat(value) : value;
				}
			}
		}
	}

	delete data["visualize"];

	return data;
}

async function get_model_structure(is_fake_model = 0) {
	//console.trace();
	var new_current_status_hash = "";
	/*
	if(is_fake_model) {
		new_current_status_hash = await get_current_status_hash();
	if(layer_structure_cache && current_status_hash == new_current_status_hash) {
		//log("Using cache");
		//console.trace();
		return JSON.parse(layer_structure_cache);
	}
	*/
	var first_layer = true; // seperate from i because first layer may be input layer (which is not a "real" layer)
	var structure = [];

	for (var i = 0; i < get_number_of_layers(); i++) {
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
				console.warn("Failed to add layer type ", type, ": ", e);
				header("DATA:");
				log(data);
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

	await write_descriptions();

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
		(["kernelRegularizer", "biasRegularizer", "activityRegularizer", "kernelInitializer", "biasInitializer", "gammaInitializer", "gammaRegularizer", "betaInitializer"].includes(keyname) && (typeof(value) == "object") || ["zeros", "ones"].includes(value)) ||
		(["unitForgetBias", "center", "scale", "unroll", "trainable", "useBias", "stateful", "returnSequences", "returnState", "goBackwards"].includes(keyname) && typeof(value) == "boolean") ||
		(["name", "betaConstraint", "gammaConstraint"].includes(keyname) && typeof(value) == "string") ||
		(["recurrentInitializer", "depthwiseInitializer", "pointwiseInitializer", "movingMeanInitializer", "movingVarianceInitializer", "betaInitializer", "gammaInitializer"].includes(keyname) && ['constant', 'glorotNormal', 'glorotUniform', 'heNormal', 'heUniform', 'identity', 'leCunNormal', 'leCunUniform', 'ones', 'orthogonal', 'randomNormal', 'randomUniform', 'truncatedNormal', 'varianceScaling', 'zeros', 'string', 'l1', 'l2', 'l1l2'].includes(value)) ||
		(keyname == "dtype" && ['float32', 'int32', 'bool', 'complex64', 'string'].includes(value)) ||
		(keyname == "padding" && ['valid', 'same', 'causal'].includes(value)) ||
		(["activation", "recurrentActivation"].includes(keyname) && ['LeakyReLU', 'elu', 'hardSigmoid', 'linear', 'relu', 'relu6',  'selu', 'sigmoid', 'softmax', 'softplus', 'softsign', 'tanh', 'swish', 'mish'].includes(value)) ||
		(["kernelSize", "poolSize", "strides", "dilationRate", "size"].includes(keyname) && (is_number_array(value) || typeof(value) == "number")) ||
		(keyname == "implementation" && [1, 2].includes(value)) ||
		(keyname == "interpolation" && ["nearest", "bilinear"].includes(value)) ||
		(keyname == "inputShape" && layer == 0 && (typeof(value) == "object" || is_number_array(value))) ||
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

	//log("keyname: ", keyname, "value: ", value, "layer:", layer);

	return false;
}

function get_key_name_camel_case(keyname) {
	var letters = keyname.split("");
	var results = [];

	var next_is_camel_case = false;
	for (var i = 0; i < letters.length; i++) {
		if(letters[i] == "_") {
			next_is_camel_case = true;
		} else {
			if(next_is_camel_case) {
				results.push(letters[i].toUpperCase());
				next_is_camel_case = false;
			} else {
				results.push(letters[i]);
			}
		}
	}

	return results.join("");
}

function remove_empty(obj) {
	return Object.fromEntries(Object.entries(obj).filter(([_, v]) => v != null));
}

async function get_html_from_model () {
	var html = '';

	html += '<html>' + "\n";
	html += "	<head>\n";
	html += "		<meta charset='UTF-8'>\n";
	html += "		<title>Example Network</title>\n";
	html += "		<script src='https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@2.0.0/dist/tf.min.js'></script>\n";
	html += "		<script src='https://code.jquery.com/jquery-3.6.0.js'></script>\n";
	html += "		<!--<link href='main.css' rel='stylesheet' />-->\n";
	html += "	</head>\n";
	html += "	<body>\n";
	html += "		<script type='text/javascript'>\n";
	html += "			var model;\n";
	html += "			var labels = ['" + labels.join("', '") + "'];\n";
	html += "			var divide_by = " + $("#divide_by").val() + ";\n";
	html += "			async function load_model () {\n";
	html += "				model = await tf.loadLayersModel('./model.json');\n";
	html += "			}\n";
	var input_shape_is_image_val = await input_shape_is_image();
	if(input_shape_is_image_val) {
		html += "			var load_file = (function(event) {\n";
		html += "				var output = document.getElementById('output');\n";
		html += "				$('#output').removeAttr('src');\n";
		html += "				output.src = URL.createObjectURL(event.target.files[0]);\n";
		html += "				output.onload = async function() {\n";
		html += "					await load_model();\n";
		html += "				URL.revokeObjectURL(output.src);\n";
		html += "					var img = $('#output')[0];\n";
		html += "					img.height = model.layers[0].input.shape[1];\n";
		html += "					img.width = model.layers[0].input.shape[2];\n";
		html += "					var tensor = tf.browser.fromPixels(img);\n";
		html += "					tensor = tf.divNoNan(tensor, divide_by);\n";
		html += "					var results_tensor = await model.predict(tensor.expandDims());\n";
		html += "					var results = results_tensor.dataSync();\n";
		html += "					var html = '<pre>';\n";
		html += "					for (var i = 0; i < results.length; i++) {\n";
		html += "						var label = labels[i % labels.length];\n";
		html += "						html += label + ': ' + results[i] + \"\\n\";\n";
		html += "					}\n";
		html += "					html += '</pre>';\n";
		html += "					$('#results').html(html);\n";
		html += "					$('#results_container').show();\n";
		html += "				};\n";
		html += "				$('#output').show();\n";
		html += "			});\n";
	} else {
		html += "			async function predict() {\n"
		html +=	"				await load_model();\n";
		html += "				var input = $('#inputtensor').val()\n"
		html += "				var tensor = tf.tensor(eval(input));\n"
		html += "				tensor = tf.divNoNan(tensor, divide_by);\n";
		html += "				var prediction_tensor = await model.predict(tensor);\n"
		html += "				var results = await prediction_tensor.dataSync();\n"
		html += "				var html = '<pre>';\n";
		html += "				for (var i = 0; i < results.length; i++) {\n";
		html += "					var label = labels[i % labels.length];\n";
		html += "					if(label) {\n";
		html += "						html += label + ': ' + results[i] + \"\\n\";\n";
		html += "					} else {\n";
		html += "						html += results[i] + '\\n';\n";
		html += "					}\n";
		html += "				}\n";
		html += "				html += '</pre>';\n";
		html += "				$('#results').html(html);\n";
		html += "			}\n"
	}
	html += "			</script>\n";
	if(input_shape_is_image_val) {
		html += "				<input type='file' id='upload_img' onchange='load_file(event)' />\n";
		html += "			<div id='results_container' style='display: none'>\n";
		html += "				<img id='output' />\n";
		html += "				<div id='results'></div>\n";
		html += "			</div>\n";
	} else {
		html += "			<textarea style='width: 500px; height: 200px;' id='inputtensor'></textarea><br>\n";
		html += "			<button onclick='predict()'>Predict</button>\n";
		html += "			<div id='results'></div>\n";
		html +=	"			<script>\n";
		html +=	"				async function write_placeholder() {\n";
		html +=	"					await load_model();\n";
		html +=	"					var shape = model.layers[0].input.shape;\n";
		html +=	"					shape.shift();\n";
		html += "					$('#inputtensor').attr('placeholder', 'Shape: [[' + shape.join(', ') + ']]');\n";
		html +=	"				}\n";
		html +=	"				write_placeholder();\n";
		html +=	"			</script>\n";
	}
	html += "        </body>\n";
	html += '</html>' + "\n";

	return html;
}

function check_initializers (data, has_keys) {
	valid_initializer_types.forEach((init_or_regularizer_type) => {
		["Regularizer", "Initializer"].forEach((regularizer_or_init) => {
			var keyname = get_key_name_camel_case(init_or_regularizer_type + regularizer_or_init);
			if(regularizer_or_init == "Initializer") {
				if(has_keys.includes(keyname)) {
					var original_name = data[keyname]["name"];
					if(typeof(original_name) == "string") {
						var options_stringified = JSON.stringify(data[keyname]["config"]);
						if(original_name) {
							try {
								data[keyname] = eval(`tf.initializers.${original_name}(${options_stringified})`);
							} catch (e) {
								console.error(e);
								console.trace();
							}
						} else {
							data[keyname] = null;
						}
					//} else {
					//	log("original_name (A):", original_name);
					}
				}
			} else if(regularizer_or_init == "Regularizer") {
				if(has_keys.includes(keyname)) {
					var original_name = data[keyname]["name"];
					assert(typeof(original_name) == "string", "original_name is not string (B)");
					var options_stringified = JSON.stringify(data[keyname]["config"]);
					if(typeof(original_name) == "string") {
						if(original_name && original_name != "none") {
							try {
								data[keyname] = eval(`tf.regularizers.${original_name}(${options_stringified})`);
							} catch (e) {
								console.error(e);
								console.trace();
							}
						} else {
							data[keyname] = null;
						}
					//} else {
					//	log("original_name (B):", original_name);
					}
				}
			} else {
				log("Invalid regularizer_or_init: " + regularizer_or_init);
			}
		});
	});

	return data;
}

function _check_data (data, type) {
	var has_keys = Object.keys(data);

	try {
		if(has_keys.includes("dropout_rate") && type == "dropout") {
			var tmp = data["dropout_rate"];
			delete data["dropout_rate"];
			data["rate"] = tmp;
			has_keys = Object.keys(data);
		}
	} catch (e) {
		console.error(e);
	}

	try {
		if(["lstm", "gru", "simpleRNN"].includes(type) && has_keys.includes("rate")) {
			var tmp = data["rate"];
			delete data["rate"];
			data["dropout"] = tmp;
			has_keys = Object.keys(data);
		}
	} catch (e) {
		console.error(e);
	}

	try {
		if("targetShape" in data && ["string", "number"].includes(typeof(data["targetShape"]))) {
			data["targetShape"] = eval("[" + data["targetShape"] + "]");
		}
	} catch (e) {
		console.error(e);
	}

	try {
		if("size" in data && typeof(data["size"]) == "string") {
			data["size"] = eval("[" + data["size"] + "]");
		}
	} catch (e) {
		console.error(e);
	}

	try {
		if("dilationRate" in data && data["dilationRate"].length == 0) {
			data["dilationRate"] = null;
		}
	} catch (e) {
		console.error(e);
	}

	try {
		if("units" in data && typeof(data["units"]) == "undefined") {
			console.warn("units was not defined. Using 2 as default");
			data["units"] = 2;
		}
	} catch (e) {
		console.error(e);
	}

	try {

		["strides", "kernelSize"].forEach(function (correction_name) {
			if(correction_name in data && (isNaN(data[correction_name][0]) || typeof(data[correction_name][0]) == "undefined")) {
				data[correction_name] = [];
				for (var k = 0; k < data[correction_name].length; k++) {
					data[correction_name][k] = 1;
				}
			}
		});
	} catch (e) {
		console.error(e);
	}

	try {
		data = check_initializers(data, has_keys);

		if(type == "rnn") {
			// never worked...
			var lstm_cells = [];
			for (var index = 0; index < data["units"]; index++) {
				lstm_cells.push(tf.layers.RNNCell({units: data["units"]}));
			}
			data["cell"] = lstm_cells;
			log(data);
		}
	} catch (e) {
		console.error(e);
	}

	try {
		data = remove_empty(data);
	} catch (e) {
		console.error(e);
	}

	return data;
}

async function _add_layer_to_model (type, data, fake_model_structure, i, new_model) { var start_tensors = memory_leak_debugger();
	try {
		if(layer_options[type]["custom"]) {
			if(i == 0) {
				data["inputShape"] = get_input_shape();
			} else {
				delete data["inputShape"];
			}
			eval(`new_model.add(new ${type}(${JSON.stringify(data)}))`);
		} else {
			//log("adding ", tf.layers[type], ", data: ", data);
			new_model.add(tf.layers[type](data));
		}
		set_layer_background(i, "");
	} catch (e) {
		if(!fake_model_structure) {
			var msg = e;
			set_model_layer_warning(i, e.toString());
			l("ERROR: " + e);
			log(type);
			log(data);

			if(e.toString().includes("is incompatible with layer")) {
				set_layer_background(i, "red");
			}

			await dispose(new_model);

			memory_leak_debugger("create_model (A)", start_tensors);

			memory_leak_debugger("_add_layer_to_model", start_tensors);
			return false;
		}

		memory_leak_debugger("_add_layer_to_model", start_tensors);
		return false;
	}

	var new_tensors = 0;

	new_model.layers.forEach((elem, nr) => {
		try {
			new_tensors += new_model.layers[nr].weights.length;
		} catch (e) {
			console.log(e);
		}
	});

	memory_leak_debugger("_add_layer_to_model", start_tensors + new_tensors);
	return new_model;
}

function _set_layer_gui (data, fake_model_structure, i) {
	var data_keys = Object.keys(data);
	for (var k = 0; k < data_keys.length; k++) {
		var this_key = data_keys[k];
		var layer_setting = $($(".layer_setting")[i]);
		var current_setting = layer_setting.find("." + js_names_to_python_names[this_key]);
		if(!fake_model_structure && !is_valid_parameter(this_key, data[this_key], i)) {
			header("=================");
			log(`INVALID PARAMETER FOR LAYER ${i}: ` + this_key + ": ", data[this_key], " (" + typeof(data[this_key]) + ")");
			header("<<<<<<<<<<<<<<<<<");
			current_setting.css("background-color", "red");
		} else {
			current_setting.css("background-color", "");
		}
	}
}

async function create_model (old_model, fake_model_structure, force) { var start_tensors = memory_leak_debugger();

	if(has_missing_values) {
		l("Not creating model because some values are missing (create model)");
		if(old_model) {
			return old_model;
		}

		console.error("No model found, but has missing values");

		return [old_model, null];
	}

	var new_layers_container_md5 = await get_layers_container_md5();
	if(!layers_container_md5 || force) {
		layers_container_md5 = new_layers_container_md5;
	}

	var new_current_status_hash = await get_current_status_hash(!!fake_model_structure ? 0 : 1);

	if(!force && disable_show_python_and_create_model) {
		return [old_model, null];
	}

	current_status_hash = new_current_status_hash;

	$(".warning_container").hide();

	var model_structure = fake_model_structure;
	if(model_structure === undefined) {
		model_structure = await get_model_structure();
	}

	assert(typeof(model_structure) == "object", "model_structure is not an object");

	var new_model = await _add_layers_to_model(model_structure, fake_model_structure, i, new_model);

	enable_train();

	if(typeof(fake_model_structure) == "undefined") {
		$("#html").text(await get_html_from_model());
	}

	current_layer_status_hash = await get_current_layer_container_status_hash();

	if(!fake_model_structure) {
		l("Model compiled successfully");
	}

	if(old_model) {
		for (var k = 0; k < old_model.length; k++) {
			for (var j = 0; j < old_model.layers[k].weights.length; j++) {
				await dispose(old_model.layers[k].weights[j].val);
			}
		}

		await dispose(old_model);
	}

	var new_tensors = findTensorsWithIsDisposedInternal(model_data).length;
	for (var k = 0; k < new_model.length; k++) {
		for (var j = 0; j < new_model.layers[k].weights.length; j++) {
			if(Object.keys(new_model.layers[k].weights[j]).includes("val")) {
				new_tensors++;
			}
		}
	}

	var model_data = await get_model_data();

	memory_leak_debugger("create_model", start_tensors + new_tensors);

	return [new_model, model_data];
}

async function _add_layers_to_model (model_structure, fake_model_structure, i) { var start_tensors = memory_leak_debugger();

	var new_model = tf.sequential();
	for (var i = 0; i < model_structure.length; i++) {
		var type = model_structure[i]["type"];
		var data = model_structure[i]["data"];

		data = _check_data(data, type);

		_set_layer_gui(data, fake_model_structure, i);
		
		if(!await _add_layer_to_model(type, data, fake_model_structure, i, new_model)) {
			if(fake_model_structure) {
				console.error(`Failed to add layer type ${type}`);
			} else {
				console.info(`Failed to add layer type ${type} (but ok because fake_model)`);
			}
		}
	}

	var new_tensors = 0;

	new_model.layers.forEach((elem, nr) => {
		try {
			new_tensors += new_model.layers[nr].weights.length;
		} catch (e) {
			console.log(e);
		}
	});

	memory_leak_debugger("_add_layers_to_model", start_tensors + new_tensors);
	return new_model;
}

async function get_fake_data_for_layertype (layer_nr, layer_type) { var start_tensors = memory_leak_debugger();

	assert(typeof(layer_nr) == "number", layer_nr + " is not an number but " + typeof(layer_nr));
	assert(typeof(layer_type) == "string", layer_type + " is not an string but " + typeof(layer_type));
	assert(Object.keys(layer_options).includes(layer_type), "Unknown layer type " + layer_type);

	await write_descriptions();

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

	memory_leak_debugger("get_fake_data_for_layertype", start_tensors);

	return data;
}

function get_default_option (layer_type, option_name) {
	assert(typeof(layer_type) == "string", "layer_type must be string, is " + typeof(layer_type));
	assert(typeof(option_name) == "string", "option_name must be string, is " + typeof(option_name));

	var match = layer_type.match(/(\d+)[dD]$/);

	if(match) {
		if(typeof(layer_options_defaults[option_name]) == "string" && layer_options_defaults[option_name] == "[]") {
			var number_of_match_items = parseInt(match[1]);
			var number = 1;
			if(option_name == "kernel_size") {
				var number = 3;
			}
			var results = [];
			for (var i = 0; i < number_of_match_items; i++) {
				results.push(number);
			}

			return results;
		}
	}

	return layer_options_defaults[option_name];
}

async function create_fake_model_structure (layer_nr, layer_type) { var start_tensors = memory_leak_debugger();
	assert(typeof(layer_nr) == "number", layer_nr + " is not an number but " + typeof(layer_nr));
	assert(typeof(layer_type) == "string", layer_type + " is not an string but " + typeof(layer_type));

	var fake_model_structure = await get_model_structure();

	fake_model_structure[layer_nr]["type"] = layer_type;
	fake_model_structure[layer_nr]["data"] = await get_fake_data_for_layertype(layer_nr, layer_type);

	memory_leak_debugger("create_fake_model_structure", start_tensors);

	return fake_model_structure;
}

async function compile_fake_model(layer_nr, layer_type) { var start_tensors = memory_leak_debugger();
	assert(typeof(layer_nr) == "number", layer_nr + " is not a number but " + typeof(layer_nr));
	assert(typeof(layer_type) == "string", layer_type + " is not a string but " + typeof(layer_type));

	var fake_model_structure = await create_fake_model_structure(layer_nr, layer_type);

	var ret = false;

	try {
		var fake_model, after_create_model_tensors;

		try {
			var tmp_model_data;
			[fake_model, tmp_model_data] = await create_model(null, fake_model_structure);
			after_create_model_tensors = tf.memory()["numTensors"];

			ret = tf.tidy(() => {
				try {
					fake_model.compile(tmp_model_data);

					return true;
				} catch (e) {
					return false;
				}
			});

			await dispose(tmp_model_data);
		} catch(e) {
			console.error(e);

			ret = false;
		}

		var after_compile_tensors = tf.memory()["numTensors"];

		await dispose(fake_model);

	} catch (e) {
		console.warn(e);
		ret = false;
	}

	memory_leak_debugger("compile_fake_model", start_tensors);

	return ret;
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

	if(mode == "beginner" && ["reshape"].includes(layer_type)) {
		return false;
	}

	return true;
}

function layer_type_always_works (layer_type) {
	return !!(["dense", "reshape", "dropout", "GaussianNoise", "gaussianDropout", "DebugLayer"].includes(layer_type) || ["Activation", "Noise"].includes(layer_options[layer_type].category));
}

function heuristic_layer_possibility_check (layer_nr, layer_type) {
	assert(typeof(layer_nr) == "number", layer_nr + " is not an number but " + typeof(layer_nr));
	assert(typeof(layer_type) == "string", layer_type + " is not an string but " + typeof(layer_type));

	var layer_input_shape = calculate_default_target_shape(layer_nr);

	if(layer_type == "flatten") {
		if(layer_input_shape.length > 1) {
			return true;
		} else {
			return false;
		}
	}

	return _heuristic_layer_possibility_check(layer_type, layer_input_shape);
}

async function get_valid_layer_types (layer_nr) {
	assert(typeof(layer_nr) == "number", layer_nr + " is not an number but " + typeof(layer_nr));

	/*
	log("get_valid_layer_types");
	console.trace();
	*/

	//log("last_allowed_layers_update:", last_allowed_layers_update);

	if(typeof(last_allowed_layers_update) != "undefined") {
		if(last_allowed_layers_update == await get_current_status_hash(0)) {
			if(Object.keys(allowed_layer_cache).includes(layer_nr)) {
				return allowed_layer_cache[layer_nr];
			} else {
				//log("Object.keys(allowed_layer_cache) does not include layer_nr");
			}
		} else {
			//log("The Status hash is different");
		}
	} else {
		//log("last_allowed_layers_update is undefined");
	}

	allowed_layer_cache[layer_nr] = null;

	last_allowed_layers_update = await get_current_status_hash(0);

	var valid_layer_types = [];

	$('body').css('cursor', 'wait');

	var checked_layers = false;

	for (var i = 0; i < layer_names.length; i++) {
		var layer_type = layer_names[i];
		if(mode == "expert") {
			valid_layer_types.push(layer_type);
		} else {
			if(layer_type_always_works(layer_type)) {
				valid_layer_types.push(layer_type);
			} else {
				var percent = (((i + 1) / layer_names.length) * 100).toFixed(0);
				var pb_string = "Checking " + layer_type + " (" + percent + "%)";
				l(pb_string);
				if(heuristic_layer_possibility_check(layer_nr, layer_type)) {
					//log("Testing " + layer_type);
					var compiled_fake_model = await compile_fake_model(layer_nr, layer_type)
					if(compiled_fake_model) {
						valid_layer_types.push(layer_type);
					}
				}
				checked_layers = true;
			}
			await write_descriptions();
		}
	}
	await write_descriptions();

	if(checked_layers) {
		l("Checked possible layer types");
	}

	$('body').css('cursor', 'default');

	allowed_layer_cache[layer_nr] = valid_layer_types;

	return valid_layer_types;
}

async function set_weights_from_json_object (json, dont_show_weights, no_error, m) { var start_tensors = memory_leak_debugger();

	if(!m) {
		//console.warn("Model not given. Using model singleton.");
		m = model;
	}

	if(!m) {
		console.error("No model");
		return;
	}

	var weights_array = [];

	var tensors = [];

	if(typeof(json) == "string") {
		try {
			json = JSON.parse(json);
		} catch (e) {
			l("An error occured setting the weights. Check the developer's console for more details.");
			console.error(e);
			return;
		}
	}

	for (var i = 0; i < json.length; i++) {
		tensors.push(tf.tensor(json[i]));
	}

	try {
		var old_model_weights = model.weights;
		try {
			m.setWeights(tensors);

			for (var i = 0; i < json.length; i++) {
				await dispose(tensors[i]);
			}
		} catch (e) {
			//log(e);
		}
	} catch (e) {
		if(!no_error) {
			Swal.fire({
				icon: 'error',
				title: 'Error loading weights',
				text: e
			});
		}
		console.error(e);
		return false;
	}

	if(!dont_show_weights) {
		Swal.fire(
			'Weights loaded successfully',
			'',
			'success'
		);
	}

	memory_leak_debugger("set_weights_from_json_object", start_tensors);

	return true;
}

async function set_weights_from_string (string, no_warning, no_error, m) { var start_tensors = memory_leak_debugger();
	var json = JSON.parse(string);

	var res = await set_weights_from_json_object(json, no_warning, no_error, m);

	memory_leak_debugger("set_weights_from_string", start_tensors);

	return res;
}

async function get_weights_as_json (m) {
	if(!m) {
		m = model;
	}

	if(!m) {
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

		return weights_array;
	} else {
		return false;
	}
}


async function get_weights_as_string (m) { var start_tensors = memory_leak_debugger();

	if(!m) {
		m = model;
	}

	if(!m) {
		if(finished_loading) {
			console.warn("Could not get model...");
		}
		memory_leak_debugger("get_weights_as_string", start_tensors);
		return false;
	}

	var res;

	if(m) {
		try {
			var weights = await m.getWeights();

			var weights_array = [];

			for (var i = 0; i < weights.length; i++) {
				if(!weights[i].isDisposed) {
					try {
						weights_array[i] = weights[i].arraySync();
					} catch (e) {
						console.error(e);
					}
				} else {
					console.warn("weights is disposed");
				}
			}

			last_weights_as_string = JSON.stringify(weights_array);
			res = last_weights_as_string;
		} catch (e) {
			if((""+e).includes("already disposed")) {
				console.warn("Maybe the model was recompiled or changed while predicting. This MAY be the cause of a problem, but it may also not be.");
			} else {
				console.error(e);
				console.trace();
			}
		}
	} else {
		res = false;
	}

	memory_leak_debugger("get_weights_as_string", start_tensors);

	return res;
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
	var dataset = $("#dataset option:selected").text();
	var this_struct = traindata_struct[dataset];

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

	await dispose(test_tensor);

	return shape;
}

async function _show_load_weights () {
	if(!model) {
		return false;
	}

	var this_weights_file = traindata_struct[$("#dataset option:selected").text()].weights_file;

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

async function _force_reinit() {
	l("Started re-initializing");
	await compile_model(0, 1);
	await updated_page();
	l("Done re-initializing");
}

async function force_reinit (no_msg) { var start_tensors = memory_leak_debugger();
	if(!model) {
		l("Tried re-initializing, but no model was found");
		return;
	}

	if(!no_msg) {
		Swal.fire({
			title: 'Are you sure?',
			text: 'This loses your training progress, but you can undo it.',
			icon: 'warning',
			showCancelButton: true,
			confirmButtonColor: '#3085d6',
			cancelButtonColor: '#d33',
			confirmButtonText: 'Yes, re-init!'
		}).then(async (result) => {
			if (result.isConfirmed) {
				await _force_reinit();
			} else {
				l("Re-init cancelled");
			}
		});
	} else {
		await _force_reinit();
	}

	await rename_labels();
	await repredict();

	memory_leak_debugger("force_reinit", start_tensors);
}

async function input_shape_is_image (is_from_webcam=0) { var start_tensors = memory_leak_debugger();
	var shape = get_input_shape();
	var is = $(".input_shape_is_image");
	if(shape.length == 3 && shape[2] == 3) {
		is.show();
		if(is_cosmo_mode) {
			$(".hide_in_cosmo_mode").hide();
		}
		/*
		if(!is_from_webcam && is_cosmo_mode) {
			for (var i = 0; i < is.length; i++) {
				if(has_special_cosmo_classes(is[i])) {
					$(is[i]).hide();
					if(!is_from_webcam) {
						await show_cosmo_elements_depending_on_current_skills();
					}
				}
			}
		}
		*/

		memory_leak_debugger("input_shape_is_image", start_tensors);
		return true;
	}
	is.hide();
	memory_leak_debugger("input_shape_is_image", start_tensors);
	return false;
}

function model_output_shape_looks_like_classification () {
	return model.outputShape.length == 2;
}
