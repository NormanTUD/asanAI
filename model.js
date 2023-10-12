"use strict";

async function except (errname, e) {
	$(".overlay").remove();

	await write_descriptions();
	await enable_everything();

	if(Object.keys(e).includes("message")) {
		e = e.message;
	}

	wrn(errname + ": " + e + ". Resetting model.");
	console.trace();
	await write_error(e);
	throw new Error(e);
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

	var res = await md5(str);

	return res;
}

async function _create_model () {
	var _create_model_uuid = uuidv4();

	while (create_model_queue.length) {
		await delay(50);
	}

	create_model_queue.push(_create_model_uuid);

	if(has_missing_values) {
		l(language[lang]["not_creating_model_because_values_are_missing"]);
		return model;
	}

	try {
		try {
			if(global_model_data) {
				var model_data_tensors = find_tensors_with_is_disposed_internal(global_model_data);
				for (var i = 0; i < model_data_tensors.length; i++) {
					await dispose(model_data_tensors[i]);
				}
			}

			if(model && Object.keys(model).includes("layers") && model.layers.length) {
				for (var i = 0; i < model.layers.length; i++) {
					await dispose(model.layers[i].bias);
					await dispose(model.layers[i].kernel);
				}

				await dispose(model);
			}
		} catch (e) {
			if(Object.keys(e).includes("message")) {
				e = e.message;
			}

			err(e);
		}

		[model, global_model_data] = await create_model(model);

		if(can_be_shown_in_latex()) {
			$("#math_mode_settings").show();
		} else {
			$("#math_mode_settings").hide();
		}
	} catch (e) {
		if(Object.keys(e).includes("message")) {
			e = e.message;
		}

		create_model_queue = create_model_queue.filter(function(e) { return e !== _create_model_uuid })

		if(("" + e).includes("undefined has no properties")) {
			wrn("Trying to work on undefined model. This may be the case when this function is called, but the model is currently being rebuilt.");
			return;
		} else if(("" + e).includes("Input 0 is incompatible with layer")) {
			throw new Error("" + e);
		} else if(("" + e).includes("BaseConv expects config.kernelSize to be number")) {
			throw new Error("" + e);
		} else if(("" + e).includes("targetShape is undefined")) {
			wrn("" + e);
		} else if(("" + e).includes("ReferenceError")) {
			wrn("" + e);
		} else if(("" + e).includes("The channel dimension of the input should be defined")) {
			wrn("" + e);
		} else if(("" + e).includes("model is undefined")) {
			wrn("Currently, the model is undefined. This may be fatal, but may also not be");
		} else if(("" + e).includes("model.layers[i] is undefined")) {
			wrn("" + e);
		} else if(("" + e).includes("Inputs to DepthwiseConv2D should have rank") || ("" + e).includes("Inputs to SeparableConv2D should have rank")) {
			wrn("" + e);
		} else if(("" + e).includes("Cannot read properties of undefined (reading 'layers')")) {
			wrn("" + e);
			return;
		} else if(("" + e).includes("Cannot read properties of undefined")) {
			wrn("" + e);
			return;
		} else if(("" + e).includes("identifier starts immediately after numeric literal")) {
			wrn("" + e);
			return;
		} else if(
			("" + e).includes("Convolution layer expected config.filters to be a 'number' > 0 but got undefined") ||
			("" + e).includes("The kernelSize argument must be an integer or tuple of 2 integers") ||
			("" + e).includes("The strides argument must be an integer or tuple of 2 integers") ||
			("" + e).includes("Expected units to be a positive integer, but got undefined") ||
			("" + e).includes("have a defined dimension but the layer received an input with shape")
		) {
			wrn("" + e);
			return;
		} else {
			await except("ERROR1", "" + e);
			if(mode == "beginner") {
				Swal.fire({
					icon: "error",
					title: "Oops [4]...",
					text: "" + e
				});
			} else {
				l("ERROR: " + e);
			}
		}
	}

	create_model_queue = create_model_queue.filter(function(e) { return e !== _create_model_uuid })

	if(!disable_layer_debuggers && model) {
		add_layer_debuggers();
	}

	//add_optimizer_debugger();
}

async function _get_recreate_model(current_status_hash, model_config_hash, new_model_config_hash) {
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

	return recreate_model;
}

function find_tensors_with_is_disposed_internal(obj, tensorList = []) {
	if (typeof obj === "object") {
		if (obj.isDisposedInternal !== undefined) {
			tensorList.push(obj);
		}
		for (const key in obj) {
			find_tensors_with_is_disposed_internal(obj[key], tensorList);
		}
	}

	return tensorList;
}

async function compile_model (recursion_level=0) {
	if(recursion_level > 3) {
		err("recursion level for compile_model too high");
		return;
	}

	assert(get_number_of_layers() >= 1, "Need at least 1 layer.");

	var new_model_config_hash = await get_model_config_hash();
	assert(typeof(new_model_config_hash) == "string", "new model config has is not a string");

	var recreate_model = await _get_recreate_model(current_status_hash, model_config_hash, new_model_config_hash);

	if(!model) {
		if(finished_loading) {
			wrn("model not given");
		}

		if(global_model_data) {
			var model_data_tensors = find_tensors_with_is_disposed_internal(global_model_data);
			for (var i = 0; i < model_data_tensors.length; i++) {
				await dispose(model_data_tensors[i]);
			}
		}

		try {
			[model, global_model_data] = await create_model(model, await get_model_structure());
		} catch (e) {
			throw new Error(e);
		}
	}

	if(recreate_model) {
		model_is_trained = false;
		reset_summary();
		await _create_model();
		await last_shape_layer_warning();
	}

	if(!model) {
		wrn("No model to compile!");
		return;
	}

	while (create_model_queue.length) {
		await delay(10);
	}

	try {
		while (!model) {
			await delay(10);
		}

		model_config_hash = new_model_config_hash;
		model.compile(global_model_data);
	} catch (e) {
		if(Object.keys(e).includes("message")) {
			e = e.message;
		}

		if(("" + e).includes("model is empty")) {
			set_model_layer_warning(0, "" + e);

			for (var i = 0; i < $("#layer_setting").length; i++) {
				set_layer_background(i, "red")
			}
		} else if (("" + e).includes("model is empty")) {
			err("" + e)
			return;
		} else if (("" + e).includes("e is null")) {
			err("" + e)
			await delay(1000);
			return await compile_model(recursion_level + 1);
		} else {
			if(e) {
				err(e);
			} else {
				await except("ERROR2", "Unknown error");
			}

			return;
		}
	}

	for (var i = 0; i < $("#layer_setting").length; i++) {
		set_layer_background(i, "")
	}

	try {
		$("#outputShape").val(JSON.stringify(model.outputShape));
	} catch (e) {
		if(("" + e).includes("model is undefined")) {
			wrn("model is undefined while compile_model");
		} else {
			throw new Error(e);
		}
	}

	write_model_summary_wait();

}

function get_weight_type_name_from_option_name (on) {
	if(typeof(on) != "string") {
		wrn(`get_weight_type_name_from_option_name(on = ${on}), typeof(on) = ${typeof(on)}`);
		return;
	}

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
				data[get_js_name(option_name)] = [parse_int(get_item_value(i, option_name + "_x"))];
			} else if(type.endsWith("2d")) {
				data[get_js_name(option_name)] = [parse_int(get_item_value(i, option_name + "_x")), parse_int(get_item_value(i, option_name + "_y"))];
			} else if(type.endsWith("3d")) {
				data[get_js_name(option_name)] = [parse_int(get_item_value(i, option_name + "_x")), parse_int(get_item_value(i, option_name + "_y")), parse_int(get_item_value(i, option_name + "_z"))];
			} else if(type.endsWith("2dTranspose")) {
				data[get_js_name(option_name)] = [parse_int(get_item_value(i, option_name + "_x")), parse_int(get_item_value(i, option_name + "_y"))];
			} else {
				alert("Unknown layer type: " + type);
			}
		} else if(["trainable", "use_bias"].includes(option_name) ) {
			try {
				data[get_js_name(option_name)] = get_item_value(i, option_name);
			} catch (e) {
				if(Object.keys(e).includes("message")) {
					e = e.message;
				}

				if(("" + e).includes("identifier starts immediately after numeric literal")) {
					err("" + e);
				} else {
					throw new Error(e);
				}
			}

		} else if(["size", "dilation_rate"].includes(option_name)) {
			var dil_rate = get_item_value(i, option_name);

			dil_rate = dil_rate.replace(/[^0-9,]/g, "");

			var code_str = "[" + dil_rate + "]";

			data[get_js_name(option_name)] = eval(code_str);

		} else if(option_name == "rate") {
			data["rate"] = parse_float(get_item_value(i, "dropout"));

		} else if(["epsilon", "momentum", "dropout_rate"].includes(option_name)) {
			data[get_js_name(option_name)] = parse_float(get_item_value(i, option_name));

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
						wrn("Something may be wrong here! Value for '" + option_name.toString() + "' is ''");
					}
				} else {
					data[get_js_name(option_name)] = is_numeric(value) ? parse_float(value) : value;
				}
			}
		}
	}

	delete data["visualize"];

	return data;
}

async function get_model_structure(is_fake_model = 0) {
	var new_current_status_hash = "";
	var first_layer = true; // seperate from i because first layer may be input layer (which is not a "real" layer)
	var structure = [];

	var num_of_layers = get_number_of_layers();

	assert(num_of_layers >= 1, "number of layers must be at least 1 or more");

	for (var i = 0; i < num_of_layers; i++) {
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
				wrn("Failed to add layer type ", type, ": ", e);
				header("DATA:");
				log(data);
				$($(".warning_container")[i]).show();
				$($(".warning_layer")[i]).html(e);

			}

			traindebug("tf.layers." + type + "(", data, ")");
		} else {
			if(finished_loading) {
				wrn(`get_model_structure is empty for layer ${i}`)
			}
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
		(["recurrentInitializer", "depthwiseInitializer", "pointwiseInitializer", "movingMeanInitializer", "movingVarianceInitializer", "betaInitializer", "gammaInitializer"].includes(keyname) && ["constant", "glorotNormal", "glorotUniform", "heNormal", "heUniform", "identity", "leCunNormal", "leCunUniform", "ones", "orthogonal", "randomNormal", "randomUniform", "truncatedNormal", "varianceScaling", "zeros", "string", "l1", "l2", "l1l2"].includes(value)) ||
		(keyname == "dtype" && ["float32", "int32", "bool", "complex64", "string"].includes(value)) ||
		(keyname == "padding" && ["valid", "same", "causal"].includes(value)) ||
		(["activation", "recurrentActivation"].includes(keyname) && ["LeakyReLU", "elu", "hardSigmoid", "linear", "relu", "relu6",  "selu", "sigmoid", "softmax", "softplus", "softsign", "tanh", "swish", "mish"].includes(value)) ||
		(["kernelSize", "poolSize", "strides", "dilationRate", "size"].includes(keyname) && (is_number_array(value) || typeof(value) == "number")) ||
		(keyname == "implementation" && [1, 2].includes(value)) ||
		(keyname == "biasConstraint" && ["maxNorm", "minNorm"].includes(value)) ||
		(keyname == "interpolation" && ["nearest", "bilinear"].includes(value)) ||
		(keyname == "inputShape" && layer == 0 && (typeof(value) == "object" || is_number_array(value))) ||
		(keyname == "targetShape" && is_number_array(value)) ||
		(["alpha", "stddev", "depthMultiplier"].includes(keyname) && typeof(value) == "number") ||
		(keyname == "axis" && typeof(value) == "number" && parse_int(value) == value) ||
		(["recurrentDropout", "dropout", "rate", "dropout_rate"].includes(keyname) && typeof(value) == "number" && value >= 0 && value <= 1) ||
		(["epsilon"].includes(keyname) && typeof(value) == "number" && value >= 0) ||
		(["theta"].includes(keyname) && typeof(value) == "number") ||
		(["maxValue", "momentum"].includes(keyname) && typeof(value) == "number") ||
		(["seed"].includes(keyname) && typeof(value) == "number") ||
		(["cell"].includes(keyname) && typeof(value).includes("object"))
	) {
		return true;
	}

	//log("keyname: ", keyname, "value: ", value, "layer:", layer);

	return false;
}

function get_key_name_camel_case(keyname) {
	assert(typeof(keyname) == "string", `keyname "${keyname}" is not a string, but ${typeof(keyname)}`);

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
	var res = Object.fromEntries(Object.entries(obj).filter(([_, v]) => v != null));

	return res;
}

async function get_html_from_model () {
	var html = "";

	html += "<html>" + "\n";
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
		html += "					URL.revokeObjectURL(output.src);\n";
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
		html += "			async function predict() {\n";
		html +=	"				await load_model();\n";
		html += "				var input = $('#inputtensor').val()\n";
		html += "				var tensor = tf.tensor(eval(input));\n";
		html += "				tensor = tf.divNoNan(tensor, divide_by);\n";
		html += "				var prediction_tensor = await model.predict(tensor);\n";
		html += "				var results = await prediction_tensor.dataSync();\n";
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
		html += "			}\n";
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
	html += "</html>" + "\n";

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
								err(e);
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
								err(e);
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
	if(!data) {
		err("Data is undefined");
		return;
	}

	var has_keys = Object.keys(data);

	try {
		if(has_keys.includes("dropout_rate") && type == "dropout") {
			var tmp = data["dropout_rate"];
			delete data["dropout_rate"];
			data["rate"] = tmp;
			has_keys = Object.keys(data);
		}
	} catch (e) {
		err(e);
	}

	try {
		if(typeof(data) == "object" && ["lstm", "gru", "simpleRNN"].includes(type) && has_keys.includes("rate")) {
			var tmp = data["rate"];
			delete data["rate"];
			data["dropout"] = tmp;
			has_keys = Object.keys(data);
		}
	} catch (e) {
		err(e);
	}

	try {
		if(typeof(data) == "object" && "targetShape" in data && ["string", "number"].includes(typeof(data["targetShape"]))) {
			data["targetShape"] = eval("[" + data["targetShape"] + "]");
		}
	} catch (e) {
		err(e);
	}

	try {
		if(typeof(data) == "object" && "size" in data && typeof(data["size"]) == "string") {
			data["size"] = eval("[" + data["size"] + "]");
		}
	} catch (e) {
		err(e);
	}

	try {
		if(typeof(data) == "object" && "dilationRate" in data && data["dilationRate"].length == 0) {
			data["dilationRate"] = null;
		}
	} catch (e) {
		err(e);
	}

	try {
		if(typeof(data) == "object" && "units" in data && typeof(data["units"]) == "undefined") {
			if(finished_loading) {
				wrn("units was not defined. Using 2 as default");
			}
			data["units"] = 2;
		}
	} catch (e) {
		err(e);
	}

	try {

		["strides", "kernelSize"].forEach(function (correction_name) {
			if(typeof(data) == "object" && correction_name in data && (isNaN(data[correction_name][0]) || typeof(data[correction_name][0]) == "undefined")) {
				data[correction_name] = [];
				for (var k = 0; k < data[correction_name].length; k++) {
					data[correction_name][k] = 1;
				}
			}
		});
	} catch (e) {
		err(e);
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
		err(e);
	}

	try {
		data = remove_empty(data);
	} catch (e) {
		err(e);
	}

	return data;
}

async function _add_layer_to_model (type, data, fake_model_structure, i, new_model, model_uuid) {
	try {
		if(layer_options[type]["custom"]) {
			if(i == 0) {
				data["inputShape"] = get_input_shape();
			} else {
				delete data["inputShape"];
			}
			var model_add_code = `new_model.add(new ${type}(${JSON.stringify(data)}))`;
			eval(model_add_code);
		} else {
			//console.log("adding ", tf.layers[type], ", data: ", data);
			var new_layer = tf.layers[type](data);

			new_model.add(new_layer);

			var added_layer = new_model.layers[new_model.layers.length - 1];

			if(added_layer["bias"]) {
				_custom_tensors["" + added_layer.bias.id] = ["UUID:" + model_uuid, added_layer.bias, "[bias in _add_layer_to_model]"];
				_clean_custom_tensors();
			}

			if(added_layer["kernel"]) {
				_custom_tensors["" + added_layer.kernel.id] = ["UUID:" + model_uuid, added_layer.kernel, "[kernel in _add_layer_to_model]"];
				_clean_custom_tensors();
			}

			if(new_model && new_model.layers) {
				var new_output_shape = new_model.layers[new_model.layers.length - 1].getOutputAt(0).shape;
				if(new_output_shape) {
					for (j in new_output_shape) {
						if(new_output_shape[j] === 0) {
							if(new_output_shape.shape) {
								log("New output-shape:", new_output_shape.shape);
							}
							throw new Error("Input shape contains 0 at layer " + j);
						}
					}

					try {
						var new_output_shape = new_model.layers[new_model.layers.length - 1].getOutputAt(1);
						throw new Error(`Layer ${i} has more than one output head!`);
					} catch (e) {
						if(("" + e).includes("Has Multi-Output")) {
							throw new Error(e);
						}
					}
				}
			}
		}
		set_layer_background(i, "");
	} catch (e) {
		if(Object.keys(e).includes("message")) {
			e = e.message;
		}

		if(!fake_model_structure && !("" + e).includes("nodeIndex is not a number")) { // "nodeIndex is not a number" means the model has only one output node, which is good
			if(
				("" + e).includes("Negative dimension size caused by adding layer") ||
				("" + e).includes("Has Multi-Output") ||
				("" + e).includes("Input shape contains 0") ||
				("" + e).includes("is incompatible with layer") ||
				("" + e).includes("targetShape is undefined") ||
				("" + e).includes("is not fully defined") ||
				("" + e).includes("The dilationRate argument must be an integer") ||
				("" + e).includes("The first layer in a Sequential model must get an `inputShape` or `batchInputShape` argument")
			) {
				set_layer_background(i, "red");
				set_model_layer_warning(i, "" + e);
			} else {
				set_model_layer_warning(i, "" + e);
				l("ERROR: " + e);
				console.log("ORIGINAL e: ", e);
				log(type);
				log(data);
				throw new Error(e);
			}

			await dispose(new_model);
		}

		return false;
	}

	return new_model;
}

function _set_layer_gui (data, fake_model_structure, i) {
	assert(typeof(data) == "object", "data is not an object");
	assert(typeof(i) == "number", "i is not a number");

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

async function create_model (old_model, fake_model_structure, force) {
	if(has_missing_values) {
		l("Not creating model because some values are missing (create model)");
		if(old_model) {
			return old_model;
		}

		err("No model found, but has missing values");

		return [old_model, null];
	}

	var new_layers_container_md5 = await get_layers_container_md5();
	if(!layers_container_md5 || force) {
		layers_container_md5 = new_layers_container_md5;
	}

	var new_current_status_hash = await get_current_status_hash(fake_model_structure ? 0 : 1);

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

	var model_uuid = "";

	if(fake_model_structure) {
		model_uuid = "FAKE_MODEL";
	} else {
		model_uuid = uuidv4();
	}

	var new_model;
	try {
		new_model = await _add_layers_to_model(model_structure, fake_model_structure, i, model_uuid);

		await dispose_old_model_tensors(model_uuid);
	} catch (e) {
		if(("" + e).includes("Negative dimension size caused by adding layer")) {
			wrn(`Trying to add the layer ${i} failed, probably because the input size is too small or there are too many stacked layers.`);
		} else if(("" + e).includes("Input shape contains 0")) {
			wrn("" + e);
		} else if(("" + e).includes("is not fully defined")) {
			wrn("" + e);
			return;
		} else if(("" + e).includes("Input 0 is incompatible with layer")) {
			wrn("Model could not be created because of problems with the input layer.");
			return;
		} else {
			throw new Error(e);
		}

		return;
	}

	$(".warning_container").html("").hide();

	if(model && model.layers && model.layers.length) {
		if(i in model.layers) {
			try {
				var ok = 1;
				try {
					model.layers[i].input.shape;
					ok = 0;
				} catch (er) { // ignore delibaretly, when it fails, its ok
					wrn("" + er);
				}

				if(!ok) {
					throw new Error(`model.layers[${i}] is a multibound head`);
				}
			} catch(e) {
				err(e);
				wrn("Model has multi-node inputs. It should not have!!! Continuing anyway, but please, debug this!!!");
			}
		}
	}

	enable_train();

	if(typeof(fake_model_structure) == "undefined") {
		$("#html").text(await get_html_from_model());
	}

	current_layer_status_hash = await get_current_layer_container_status_hash();

	if(!fake_model_structure) {
		dbg(language[lang]["model_compiled_successfully"]);
	}

	if(old_model) {
		var old_model_has_layers = 1;
		try { var x = old_model.layers; } catch (e) { old_model_has_layers = 0; }

		try {
			if(old_model_has_layers && old_model.layers && old_model.layers.length) {
				for (var k = 0; k < old_model.layers.length; k++) {
					for (var j = 0; j < old_model.layers[k].weights.length; j++) {
						await dispose(old_model.layers[k].weights[j].val);
					}
				}
			} else {
				if(finished_loading) {
					info("Old layers had no layers defined");
				}
			}
		} catch (e) {
			throw new Error(e);
		}

		await dispose(old_model);
	}

	var model_data = await get_model_data();

	if(!fake_model_structure) {
		last_known_good_input_shape = get_input_shape_as_string();
	}

	return [new_model, model_data];
}

async function dispose_old_model_tensors (model_uuid) {
	var disposable = [];

	Object.keys(_custom_tensors).forEach((i, e) => {
		if(
			(_custom_tensors[i][2].match(/(?:kernel|bias) in _add_layer_to_model/) ||
			_custom_tensors[i][2].match(/model in tf_sequential/)) &&
			!_custom_tensors[i][2].match(/FAKE/)
		) {
			if(_custom_tensors[i][0].match(/UUID:/) && !_custom_tensors[i][0].includes(model_uuid)) {
				disposable.push(_custom_tensors[i][1]);
			}
		}
	});

	for (var i in disposable) {
		if(i != "last") {
			await dispose(disposable[i]);
		}
	}

	_clean_custom_tensors();
}

async function _add_layers_to_model (model_structure, fake_model_structure, i, model_uuid) {
	var new_model = tf_sequential(model_uuid);
	for (var i = 0; i < model_structure.length; i++) {
		var type = model_structure[i]["type"];
		var data = model_structure[i]["data"];

		data = _check_data(data, type);

		_set_layer_gui(data, fake_model_structure, i);

		try {
			if(!await _add_layer_to_model(type, data, fake_model_structure, i, new_model, model_uuid)) {
				if(!fake_model_structure) {
					err(`Failed to add layer type ${type}`);
				} else {
					info(`Failed to add layer type ${type} (but ok because fake_model)`);
				}
			}
		} catch (e) {
			var msg = "" + e;
			msg = msg.replace(/^(Error:\s*)+/, "Error: ");
			$($(".warning_container")[i]).html(msg).show();
			await write_descriptions();
			throw new Error(e);
		}
	}

	return new_model;
}

async function get_fake_data_for_layertype (layer_nr, layer_type) {

	assert(typeof(layer_nr) == "number", layer_nr + " is not an number but " + typeof(layer_nr));
	assert(typeof(layer_type) == "string", layer_type + " is not an string but " + typeof(layer_type));
	assert(Object.keys(layer_options).includes(layer_type), "Unknown layer type " + layer_type);

	await write_descriptions();

	var data = {};

	var options = layer_options[layer_type]["options"];

	if(layer_nr == 0) {
		data["inputShape"] = get_input_shape();
	}

	for (var i = 0; i < options.length; i++) {
		var this_option = options[i];

		var js_option_name = undefined;
		if (this_option in python_names_to_js_names) {
			js_option_name = python_names_to_js_names[this_option];
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
				wrn("Cannot map " + this_option + " to js_option_name");
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

	var match = layer_type.match(/(\d+)[dD]/);

	if(match) {
		if(typeof(layer_options_defaults[option_name]) == "string" && layer_options_defaults[option_name] == "[]") {
			var number_of_match_items = parse_int(match[1]);
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

async function create_fake_model_structure (layer_nr, layer_type) {
	assert(typeof(layer_nr) == "number", layer_nr + " is not an number but " + typeof(layer_nr));
	assert(typeof(layer_type) == "string", layer_type + " is not an string but " + typeof(layer_type));

	var fake_model_structure = await get_model_structure();

	fake_model_structure[layer_nr]["type"] = layer_type;
	fake_model_structure[layer_nr]["data"] = await get_fake_data_for_layertype(layer_nr, layer_type);

	return fake_model_structure;
}

async function compile_fake_model(layer_nr, layer_type) {
	assert(typeof(layer_nr) == "number", layer_nr + " is not a number but " + typeof(layer_nr));
	assert(typeof(layer_type) == "string", layer_type + " is not a string but " + typeof(layer_type));

	var fake_model_structure;

	try {
		fake_model_structure = await create_fake_model_structure(layer_nr, layer_type);
	} catch (e) {
		if(Object.keys(e).includes("message")) {
			e = e.message;
		}

		wrn(e);
		return false;
	}

	var ret = false;

	try {
		var fake_model;

		try {
			var tmp_model_data;
			[fake_model, tmp_model_data] = await create_model(null, fake_model_structure);

			ret = tidy(() => {
				try {
					fake_model.compile(tmp_model_data);

					return true;
				} catch (e) {
					return false;
				}
			});

			await dispose(tmp_model_data);
		} catch(e) {
			err(e);

			ret = false;
		}

		if(model.output.shape.join(",") != fake_model.output.shape.join(",")) {
			ret = false;
		}

		await dispose(fake_model);

	} catch (e) {
		wrn(e);
		ret = false;
	}

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
	var res = !!(["dense", "reshape", "dropout", "GaussianNoise", "gaussianDropout", "DebugLayer"].includes(layer_type) || ["Activation", "Noise"].includes(layer_options[layer_type].category));

	return res;
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

	var res = _heuristic_layer_possibility_check(layer_type, layer_input_shape);

	return res;
}

async function get_valid_layer_types (layer_nr) {
	assert(typeof(layer_nr) == "number", layer_nr + " is not an number but " + typeof(layer_nr));

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

	$("body").css("cursor", "wait");

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
					var compiled_fake_model = await compile_fake_model(layer_nr, layer_type);
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

	$("body").css("cursor", get_cursor_or_none("default"));

	allowed_layer_cache[layer_nr] = valid_layer_types;

	return valid_layer_types;
}

async function set_weights_from_json_object (json, dont_show_weights, no_error, m) {
	if(!json) {
		err("set_weights_from_json_object: json is empty");
		return false;
	}

	if(!m) {
		//wrn("Model not given. Using model singleton.");
		m = model;
	}

	if(!m) {
		err("No model");
		return;
	}

	var weights_array = [];

	var tensors = [];

	if(typeof(json) == "string") {
		try {
			json = JSON.parse(json);
		} catch (e) {
			l("An error occured setting the weights. Check the developer's console for more details.");
			err(e);
			return;
		}
	}

	for (var i = 0; i < json.length; i++) {
		tensors.push(tensor(json[i]));
	}

	try {
		var old_model_weights = model.weights;
		try {
			m.setWeights(tensors);

			for (var i = 0; i < json.length; i++) {
				await dispose(tensors[i]);
			}
		} catch (e) {
			//log("" + e);
		}
	} catch (e) {
		if(!no_error) {
			Swal.fire({
				icon: "error",
				title: "Error loading weights",
				text: e
			});
		}
		err(e);
		return false;
	}

	if(!dont_show_weights) {
		Swal.fire(
			"Weights loaded successfully",
			"",
			"success"
		);
	}

	return true;
}

async function set_weights_from_string (string, no_warning, no_error, m) {
	try {
		var json = JSON.parse(string);

		var res = await set_weights_from_json_object(json, no_warning, no_error, m);

		return res;
	} catch (e) {
		if(Object.keys(e).includes("message")) {
			e = e.message;
		}

		err("" + e);
	}
}

async function get_weights_as_json (m) {
	if(!m) {
		m = model;
	}

	if(!m) {
		err("Cannot find model, using global one");
		return false;
	}

	if(!Object.keys(m).includes("_callHook")) {
		err("model does not include _callHook");
		return false;
	}

	if(!typeof(m.getWeights) == "function") {
		err("model.getWeights is not a function");
		return false;
	}

	if(m) {
		var weights = await m.getWeights();

		var weights_array = [];

		for (var i = 0; i < weights.length; i++) {
			if(!weights[i].isDisposed) {
				try {
					weights_array[i] = weights[i].arraySync();
				} catch (e) {
					wrn("" + e);
				}
			}
		}

		return weights_array;
	} else {
		return false;
	}
}

async function get_weights_as_string (m) {

	if(!m) {
		m = model;
	}

	if(!m) {
		if(finished_loading) {
			wrn("Could not get model...");
		}
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
						err(e);
					}
				} else {
					wrn("weights is disposed");
				}
			}

			last_weights_as_string = JSON.stringify(weights_array);
			res = last_weights_as_string;
		} catch (e) {
			if((""+e).includes("already disposed")) {
				if(finished_loading) {
					//wrn("Maybe the model was recompiled or changed while predicting. This MAY be the cause of a problem, but it may also not be.");
				}
			} else if((""+e).includes("e is undefined")) {
				wrn("e is undefined in get_weights_as_string. This has happened to me when rebuilding the model after it was set to null. If this happened here, it is most probably harmless");
			} else if((""+e).includes("getWeights is not a function")) {
				wrn("getWeights is not a function. The model may have been undefined while attempting this.");
			} else {
				err(e);
				console.trace();
			}
		}
	} else {
		res = false;
	}

	return res;
}

function download(filename, text) {
	var element = document.createElement("a");
	element.setAttribute("href", "data:text/plain;charset=utf-8," + encodeURIComponent(text));
	element.setAttribute("download", filename);

	element.style.display = "none";
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
		model.save("downloads://model");
	} catch (e) {
		Swal.fire({
			icon: "error",
			title: "Saving model failed",
			text: "The model may be defective and cannot be saved. Sorry. The error is: " + e
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

	try {
		var weights_array = JSON.parse(weights_as_string);

		var test_tensor = tensor(weights_array);

		var shape = test_tensor.shape;

		await dispose(test_tensor);

		return shape;
	} catch (e) {
		if(Object.keys(e).includes("message")) {
			e = e.message;
		}

		err("Parsing error in get_weights_shape: " + e);
	}
}

async function get_tfjs_model () {
	await model.save("localstorage://demo/management/model1");

	var str = localStorage["tensorflowjs_models/demo/management/model1/model_topology"];

	return str;
}

async function _force_reinit() {
	l("Started re-initializing");
	await compile_model(0, 1);
	await updated_page();
	l("Done re-initializing");
}

async function force_reinit (no_msg) {
	if(!model) {
		l("Tried re-initializing, but no model was found");
		return;
	}

	if(!no_msg) {
		Swal.fire({
			title: "Are you sure?",
			text: "This loses your training progress, but you can undo it.",
			icon: "warning",
			showCancelButton: true,
			confirmButtonColor: "#3085d6",
			cancelButtonColor: "#d33",
			confirmButtonText: "Yes, re-init!"
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

}

async function input_shape_is_image (is_from_webcam=0) {
	var shape = get_input_shape();
	var is = $(".input_shape_is_image");
	if(shape.length == 3 && shape[2] == 3) {
		is.show();
		show_hide_cosmo_stuff();
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

		return true;
	}
	is.hide();
	return false;
}

function model_output_shape_looks_like_classification () {
	var res = model.outputShape.length == 2;

	return res;
}

function layer_has_multiple_nodes () {
	if(!model) {
		if(finished_loading) {
			wrn("no model in layer_has_multiple_nodes");
		}
	}

	if(!Object.keys(model).includes("layers")) {
		if(finished_loading) {

			wrn("no model.layers in layer_has_multiple_nodes");
		}
	}

	var failed = 0;

	try {
		for (var x in model.layers) {
			try {
				var zzz = model.layers[x].output;
			} catch (e) {
				if(("" + e).includes("multiple inbound nodes")) {
					return true;
				} else {
					throw new Error(e);
				}
			}
		}
	} catch (e) {
		throw new Error(e);
	}

	return false;
}
