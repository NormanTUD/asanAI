"use strict";

async function except (errname, e) {
	remove_overlay();

	await write_descriptions();
	await enable_everything();

	if(Object.keys(e).includes("message")) {
		e = e.message;
	}

	wrn(errname + ": " + e + ". Resetting model.");
	console.trace();
	await write_error(e, null, null);
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

async function dispose_model_before_creating_a_new_one() {
	try {
		await dispose_model_data_tensors();
		await dispose_model_tensors();
	} catch (e) {
		if(Object.keys(e).includes("message")) {
			e = e.message;
		}

		err(e);
	}
}

async function dispose_model_data_tensors() {
	if(global_model_data) {
		var model_data_tensors = find_tensors_with_is_disposed_internal(global_model_data);
		for (var tensor_idx = 0; tensor_idx < model_data_tensors.length; tensor_idx++) {
			await dispose(model_data_tensors[tensor_idx]);
		}
	}
}

async function dispose_model_tensors() {
	if(model && Object.keys(model).includes("layers") && model.layers.length) {
		if (model && model.length >= 0) {
			for (var layer_idx = 0; layer_idx < model.layers.length; layer_idx++) {
				await dispose(model.layers[layer_idx].bias);
				await dispose(model.layers[layer_idx].kernel);
			}
		}

		if (model) {
			await dispose(model);
		}
	}
}

function show_math_mode_settings_if_possible () {
	if(can_be_shown_in_latex()) {
		$("#math_mode_settings").show();
	} else {
		$("#math_mode_settings").hide();
	}
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
		await dispose_model_before_creating_a_new_one();

		[model, global_model_data] = await create_model(model);

		show_math_mode_settings_if_possible();
	} catch (e) {
		if(Object.keys(e).includes("message")) {
			e = e.message;
		}

		create_model_queue = create_model_queue.filter(function(e) { return e !== _create_model_uuid; });

		if(("" + e).includes("undefined has no properties")) {
			wrn("[create_model] Trying to work on undefined model. This may be the case when this function is called, but the model is currently being rebuilt.");
			return;
		} else if(("" + e).includes("Input 0 is incompatible with layer")) {
			throw new Error("[create_model] " + e);
		} else if(("" + e).includes("BaseConv expects config.kernelSize to be number")) {
			throw new Error("[create_model] " + e);
		} else if(("" + e).includes("targetShape is undefined")) {
			wrn("[create_model] " + e);
		} else if(("" + e).includes("ReferenceError")) {
			wrn("[create_model] " + e);
		} else if(("" + e).includes("The channel dimension of the input should be defined")) {
			wrn("[create_model] " + e);
		} else if(("" + e).includes("model is undefined")) {
			wrn("[create_model] Currently, the model is undefined. This may be fatal, but may also not be");
		} else if(("" + e).includes("model.layers[i] is undefined")) {
			wrn("[create_model] " + e);
		} else if(("" + e).includes("Inputs to DepthwiseConv2D should have rank") || ("" + e).includes("Inputs to SeparableConv2D should have rank")) {
			wrn("[create_model] " + e);
		} else if(("" + e).includes("Cannot read properties of undefined (reading 'layers')")) {
			wrn("[create_model] " + e);
			return;
		} else if(("" + e).includes("Cannot read properties of undefined")) {
			wrn("[create_model] " + e);
			return;
		} else if(("" + e).includes("identifier starts immediately after numeric literal")) {
			wrn("[create_model] " + e);
			return;
		} else if(
			("" + e).includes("Convolution layer expected config.filters to be a 'number' > 0 but got undefined") ||
			("" + e).includes("The kernelSize argument must be an integer or tuple of 2 integers") ||
			("" + e).includes("The strides argument must be an integer or tuple of 2 integers") ||
			("" + e).includes("Expected units to be a positive integer, but got undefined") ||
			("" + e).includes("have a defined dimension but the layer received an input with shape")
		) {
			wrn("[create_model] " + e);
			return;
		} else if (("" + e).includes("Improper config format") || ("" + e).includes("not in config")) {
			err(`[create_model] ${e}`);
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
				l(language[lang]["error"] + ": " + e);
			}
		}
	}

	create_model_queue = create_model_queue.filter(function(e) { return e !== _create_model_uuid; });

	await add_layer_debugger_if_model();

	reset_math_history();
}

async function add_layer_debugger_if_model () {
	if(!disable_layer_debuggers && model) {
		await add_layer_debuggers();
	}
}

async function _get_recreate_model(new_model_config_hash) {
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

async function create_model_or_throw () {
	try {
		[model, global_model_data] = await create_model(model, await get_model_structure());
	} catch (e) {
		throw new Error(e);
	}
}

async function recreate_model_if_needed (new_model_config_hash) {
	var recreate_model = await _get_recreate_model(new_model_config_hash);

	if(recreate_model) {
		model_is_trained = false;
		reset_summary();
		await _create_model();
		await last_shape_layer_warning();
	}
}

async function compile_model (recursion_level=0) {
	l(language[lang]["compiling_model"]);

	if(recursion_level > 3) {
		err(language[lang]["recursion_level_for_compile_model_too_high"]);
		return;
	}

	assert(get_number_of_layers() >= 1, "Need at least 1 layer.");

	var new_model_config_hash = await get_model_config_hash();
	assert(typeof(new_model_config_hash) == "string", "new model config has is not a string");

	if(!model) {
		if(finished_loading) {
			dbg("compile_model: " + language[lang]["model_not_given"]);
		}

		if(global_model_data) {
			var model_data_tensors = find_tensors_with_is_disposed_internal(global_model_data);
			for (var tensor_idx = 0; tensor_idx  < model_data_tensors.length; tensor_idx++) {
				await dispose(model_data_tensors[tensor_idx]);
			}
		}

		await create_model_or_throw();
	}

	await recreate_model_if_needed(new_model_config_hash);

	if(!model) {
		dbg(`[compile_model] ${language[lang]["no_model_to_compile"]}!`);
		return;
	}

	while (create_model_queue.length || !model) {
		await delay(10);
	}

	if (!global_model_data) {
		global_model_data = await get_model_data();
	}

	if (!global_model_data) {
		wrn(language[lang]["global_model_data_is_empty"]);
	}

	if (!typeof model.compile === "function") {
		dbg("model has no compile() method");
		return;
	}

	try {
		model.compile(global_model_data);
		model_config_hash = new_model_config_hash;
	} catch (e) {
		var ret = await handle_model_compile_error(e, recursion_level);

		if(ret === true) {
			return;
		}

		if(ret !== false) {
			return ret;
		}
	}

	reset_background_color_for_all_layers();

	try_to_set_output_shape_from_model();

	write_model_summary_wait();
}

async function handle_model_compile_error (e, recursion_level) {
	if(Object.keys(e).includes("message")) {
		e = e.message;
	}

	if(("" + e).includes("model is empty")) {
		set_model_layer_warning(0, "" + e);

		for (var layer_idx = 0; layer_idx < $("#layer_setting").length; layer_idx++) {
			set_layer_background(layer_idx, "red");
			has_missing_values = true;
		}
	} else if (("" + e).includes("model is empty")) {
		err("[compile_model] " + e);
		return true;
	} else if (("" + e).includes("e is null")) {
		err("[compile_model] " + e);
		await delay(1000);
		return await compile_model(recursion_level + 1);
	} else if (("" + e).includes("model.compile is not a function")) {
		dbg("[compile_model] " + e);
		return true;
	} else {
		if(e) {
			err("" + e);
		} else {
			await except("ERROR2", "Unknown error");
		}

		return true;
	}

	return false;
}

function try_to_set_output_shape_from_model () {
	try {
		$("#outputShape").val(JSON.stringify(model.outputShape));
	} catch (e) {
		if(("" + e).includes("model is undefined")) {
			wrn("[compile_model] model is undefined while compile_model");
		} else {
			throw new Error(e);
		}
	}
}

function reset_background_color_for_all_layers () {
	for (var layer_idx = 0; layer_idx < $("#layer_setting").length; layer_idx++) {
		set_layer_background(layer_idx, "");
	}
}

function get_weight_type_name_from_option_name (option_name) {
	if(typeof(option_name) != "string") {
		wrn(`[get_weight_type_name_from_option_name] get_weight_type_name_from_option_name(option_name = ${option_name}), typeof(option_name) = ${typeof(option_name)}`);
		return;
	}

	if(option_name.match(/_/)) {
		for (var valid_initializer_idx = 0; valid_initializer_idx < valid_initializer_types.length; valid_initializer_idx++) {
			var v = valid_initializer_types[valid_initializer_idx];
			var re = new RegExp("^" + v + "(?:_.*)?$");
			if(option_name.match(re)) {
				return v;
			}
		}
	} else {
		return option_name;
	}

	return option_name;
}

function get_data_for_conv_option(data, type, option_name, layer_idx) {
	const js_name = get_js_name(option_name);

	if (type.endsWith("1d")) {
		const val_x = get_item_value(layer_idx, option_name + "_x");
		if(looks_like_number(val_x)) {
			const int_x = parse_int(val_x);
			data[js_name] = [int_x];
		} else {
			wrn(`Invalid option for ${option_name} in layer ${layer_idx} (${type}). Does not look like a number.`);
		}
	} else if (type.endsWith("2d") || type.endsWith("2dTranspose")) {
		const val_x = get_item_value(layer_idx, option_name + "_x");
		const val_y = get_item_value(layer_idx, option_name + "_y");

		if(!looks_like_number(val_x) || !looks_like_number(val_y)) {
			wrn(`Invalid option for ${option_name} in layer ${layer_idx} (${type}). At least one value does not look like a number.`);
		} else {
			const int_x = parse_int(val_x);
			const int_y = parse_int(val_y);
			data[js_name] = [int_x, int_y];
		}
	} else if (type.endsWith("3d")) {
		const val_x = get_item_value(layer_idx, option_name + "_x");
		const val_y = get_item_value(layer_idx, option_name + "_y");
		const val_z = get_item_value(layer_idx, option_name + "_z");
		if(!looks_like_number(val_x) || !looks_like_number(val_y) || !looks_like_number(val_z)) {
			wrn(`Invalid option for ${option_name} in layer ${layer_idx} (${type}). At least one value does not look like a number.`);
		} else {
			const int_x = parse_int(val_x);
			const int_y = parse_int(val_y);
			const int_z = parse_int(val_z);
			data[js_name] = [int_x, int_y, int_z];
		}
	} else {
		alert("Unknown layer type: " + type);
	}

	return data;
}

function get_data_for_layer (type, layer_idx, first_layer) {
	assert(typeof(type) == "string", type + " is not a string but " + typeof(type));
	assert(typeof(layer_idx) == "number", layer_idx + " is not a number but " + typeof(layer_idx));
	assert(typeof(first_layer) == "boolean", first_layer + " is not a boolean but " + typeof(first_layer));

	var data = {
		"name": type + "_" + (layer_idx + 1)
	};

	if(layer_idx == 0 || first_layer) {
		data["inputShape"] = get_input_shape();
	}

	for (var j = 0; j < layer_options[type]["options"].length; j++) {
		var option_name = layer_options[type]["options"][j];
		assert(typeof(option_name) == "string", option_name + " is not string but " + typeof(option_name));

		if(["pool_size", "kernel_size", "strides"].includes(option_name)) {
			data = get_data_for_conv_option(data, type, option_name, layer_idx);
		} else if(["trainable", "use_bias"].includes(option_name) ) {
			try {
				data[get_js_name(option_name)] = get_item_value(layer_idx, option_name);
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
			var dil_rate = get_item_value(layer_idx, option_name);

			dil_rate = dil_rate.replace(/[^0-9,]/g, "");

			var code_str = "[" + dil_rate + "]";

			data[get_js_name(option_name)] = eval(code_str);
		} else if(option_name == "rate") {
			data["rate"] = parse_float(get_item_value(layer_idx, "dropout"));
		} else if(["epsilon", "momentum", "dropout_rate"].includes(option_name)) {
			var this_val = get_item_value(layer_idx, option_name);
			if(looks_like_number(this_val)) {
				data[get_js_name(option_name)] = parse_float(this_val);
			} else {
				const potential_wrn = `${option_name} did not look like a number at layer ${layer_idx}`;

				wrn(potential_wrn);
			}
		} else if(option_name == "activation" && $($($($(".layer_setting")[layer_idx]).find("." + option_name)[0])).val() == "None") {
			// Do nothing if activation = None
			data["activation"] = null;
		} else if (valid_initializer_types.includes(get_key_name_camel_case(get_weight_type_name_from_option_name(option_name))) && option_name.includes("nitializer")) {
			var weight_type = get_weight_type_name_from_option_name(option_name);

			var initializer_name = get_item_value(layer_idx, weight_type + "_initializer");
			if(initializer_name) {
				var initializer_config = get_layer_initializer_config(layer_idx, weight_type);
				var initializer_config_string = JSON.stringify(initializer_config);
				data[get_key_name_camel_case(weight_type) + "Initializer"] = {"name": initializer_name, "config": initializer_config};
			}
		} else if (valid_initializer_types.includes(get_key_name_camel_case(get_weight_type_name_from_option_name(option_name))) && option_name.includes("egularizer")) {
			var weight_type = get_weight_type_name_from_option_name(option_name);
			var regularizer_name = get_item_value(layer_idx, weight_type + "_regularizer");
			if(regularizer_name) {
				var regularizer_config = get_layer_regularizer_config(layer_idx, weight_type);
				var regularizer_config_string = JSON.stringify(regularizer_config);
				data[get_key_name_camel_case(weight_type) + "Regularizer"] = {"name": regularizer_name, "config": regularizer_config};
			}
		} else {
			var elem = $($($(".layer_setting")[layer_idx]).find("." + option_name)[0]);
			var value = $(elem).val();

			if($(elem).is(":checkbox")) {
				data[get_js_name(option_name)] = value == "on" ? true : false;
			} else {
				if(value == "") {
					if(!option_name.includes("constraint")) {
						wrn("[get_data_for_layer] Something may be wrong here! Value for '" + option_name.toString() + "' is ''");
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

	for (var layer_idx  = 0; layer_idx < num_of_layers; layer_idx++) {
		var layer_type = $($($(".layer_setting")[layer_idx]).find(".layer_type")[0]);
		var type = $(layer_type).val();
		if(typeof(type) !== "undefined" && type) {
			var data = get_data_for_layer(type, layer_idx, first_layer);

			try {
				var layer_info = {
					"type": type,
					"data": data
				};
				structure.push(layer_info);

				first_layer = false;
			} catch (e) {
				wrn("[get_model_structure] " + language[lang]["failed_to_add_layer_type"] + type + ": " + e);
				header("DATA:");
				log(data);
				$($(".warning_container")[layer_idx]).show();
				$($(".warning_layer")[layer_idx]).html(e);

			}

			traindebug("tf.layers." + type + "(", data, ")");
		} else {
			if(finished_loading) {
				wrn(`${language[lang]["get_model_structure_is_empty_for_layer"]} ${layer_idx}`);
			}
		}
	}

	await write_descriptions();

	layer_structure_cache = JSON.stringify(structure);

	assert(typeof(structure) == "object", `structure is not an object, but of type '${typeof structure}'`);

	return structure;
}

function is_number_array (value) {
	if(typeof(value) == "object") {
		for (var val_idx = 0; val_idx < value.length; val_idx++) {
			if(typeof(value[val_idx]) != "number") {
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
	for (var letter_idx = 0; letter_idx < letters.length; letter_idx++) {
		if(letters[letter_idx] == "_") {
			next_is_camel_case = true;
		} else {
			if(next_is_camel_case) {
				results.push(letters[letter_idx].toUpperCase());
				next_is_camel_case = false;
			} else {
				results.push(letters[letter_idx]);
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
	html += `		<script src='https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@${tf.version["tfjs-core"]}/dist/tf.min.js'></script>\n`;
	html += `		<script src='https://code.jquery.com/jquery-${$().jquery}.js'></script>\n`;
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
	var input_shape_is_image_val = input_shape_is_image();
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
		html += "					for (var result_idx = 0; result_idx < results.length; result_idx++) {\n";
		html += "						var label = labels[result_idx % labels.length];\n";
		html += "						html += label + ': ' + results[result_idx] + \"\\n\";\n";
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
		html += "				for (var result_idx = 0; result_idx < results.length; result_idx++) {\n";
		html += "					var label = labels[result_idx % labels.length];\n";
		html += "					if(label) {\n";
		html += "						html += label + ': ' + results[result_idx] + \"\\n\";\n";
		html += "					} else {\n";
		html += "						html += results[result_idx] + '\\n';\n";
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

function check_initializers(data, has_keys) {
	for (var i = 0; i < valid_initializer_types.length; i++) {
		var init_type = valid_initializer_types[i];

		// Initializer (keeps original behaviour exactly)
		var keynameInit = get_key_name_camel_case(init_type + "Initializer");
		if (has_keys.includes(keynameInit)) {
			var original_name = data[keynameInit]["name"];
			if (typeof(original_name) == "string") {
				var options_stringified = JSON.stringify(data[keynameInit]["config"]);
				if (original_name) {
					var execute_this_string = "tf.initializers." + original_name + "(" + options_stringified + ")";
					try {
						data[keynameInit] = eval(execute_this_string);
					} catch (e) {
						void(0); err("Error: ", e, "execute_this_string:", execute_this_string);
						console.trace();
					}
				} else {
					data[keynameInit] = null;
				}
			}
		}

		// Regularizer (keeps original behaviour exactly)
		var keynameReg = get_key_name_camel_case(init_type + "Regularizer");
		if (has_keys.includes(keynameReg)) {
			var original_name = data[keynameReg]["name"];
			assert(typeof(original_name) == "string", "original_name is not string (B)");
			var options_stringified = JSON.stringify(data[keynameReg]["config"]);
			if (typeof(original_name) == "string") {
				if (original_name && original_name != "none") {
					try {
						data[keynameReg] = eval("tf.regularizers." + original_name + "(" + options_stringified + ")");
					} catch (e) {
						err(e);
						console.trace();
					}
				} else {
					data[keynameReg] = null;
				}
			}
		}
	}

	return data;
}

function _check_data(data, type) {
	if (!data) {
		err(language[lang]["data_is_undefined"]);
		return;
	}

	const no_units_error_layer_types = ["flatten", "conv", "reshape", "dropout", "elu", "leakyrelu", "softmax", "thresholdedrelu", "layernormalization", "depthwise", "seperable", "up", "average", "max", "alpha", "gaussian", "debug"];

	const rules = [
		{
			condition: (d) => d.dropout_rate !== undefined && type === "dropout",
			transform: (d) => { d.rate = d.dropout_rate; delete d.dropout_rate; }
		},
		{
			condition: (d) => ["lstm", "gru", "simpleRNN"].includes(type) && d.rate !== undefined,
			transform: (d) => { d.dropout = d.rate; delete d.rate; }
		},
		{
			condition: (d) => typeof d.targetShape === "string" || typeof d.targetShape === "number",
			transform: (d) => { d.targetShape = eval("[" + d.targetShape + "]"); }
		},
		{
			condition: (d) => typeof d.size === "string",
			transform: (d) => { d.size = eval("[" + d.size + "]"); }
		},
		{
			condition: (d) => Array.isArray(d.dilationRate) && d.dilationRate.length === 0,
			transform: (d) => { d.dilationRate = null; }
		},
		{
			condition: (d) => d.name && !no_units_error_layer_types.some(prefix => d.name.startsWith(prefix)) && d.units === undefined,
			transform: (d) => {
				var base_name = d.name;
				base_name = base_name.replace(/_\d+$/, "");

				if(Object.keys(layer_options[base_name]["options"]).includes("units")) {
					if(finished_loading) {
						wrn(`[_check_data] units was not defined. Using 2 as default. Layer type: ${d.name}, d: ${JSON.stringify(d)}`);
					}

					d.units = 2;
				}
			}
		},
		{
			condition: (d) => ["strides","kernelSize"].some(k => d[k] !== undefined),
			transform: (d) => {
				["strides","kernelSize"].forEach(k => {
					if (d[k] && (isNaN(d[k][0]) || d[k][0] === undefined)) {
						d[k] = d[k].map(() => 1);
					}
				});
			}
		}
	];

	for (const rule of rules) {
		try {
			if (rule.condition(data)) {
				rule.transform(data);
			}
		} catch (e) {
			err(e);
		}
	}

	try { data = check_initializers(data, Object.keys(data)); } catch(e){ err(e); }

	if(type === "rnn") {
		try {
			const lstm_cells = [];
			for (let data_idx = 0; data_idx < data.units; data_idx++) {
				lstm_cells.push(tf.layers.RNNCell({units: data.units}));
			}
			data.cell = lstm_cells;
			log(data);
		} catch(e) { err(e); }
	}

	try { data = remove_empty(data); } catch(e){ err(e); }

	return data;
}

function add_kernel_and_bias_to_custom_tensors(added_layer, model_uuid) {
	if(added_layer["bias"]) {
		_custom_tensors["" + added_layer.bias.id] = ["UUID:" + model_uuid, added_layer.bias, "[bias in _add_layer_to_model]"];
		_clean_custom_tensors();
	}

	if(added_layer["kernel"]) {
		_custom_tensors["" + added_layer.kernel.id] = ["UUID:" + model_uuid, added_layer.kernel, "[kernel in _add_layer_to_model]"];
		_clean_custom_tensors();
	}
}

async function _add_layer_to_model (type, data, fake_model_structure, model_structure_idx, new_model, model_uuid) {
	try {
		if(layer_options[type]["custom"]) {
			if(model_structure_idx == 0) {
				data["inputShape"] = get_input_shape();
			} else {
				delete data["inputShape"];
			}
			var model_add_code = `new_model.add(new ${type}(${JSON.stringify(data)}))`;
			eval(model_add_code);
		} else {
			var new_layer = tf.layers[type](data);

			new_model.add(new_layer);

			var added_layer = new_model.layers[new_model.layers.length - 1];

			add_kernel_and_bias_to_custom_tensors(added_layer, model_uuid);

			throw_if_shape_contains_0_or_has_multihead(new_model);
		}
		set_layer_background(model_structure_idx, "");
	} catch (e) {
		await handle_add_to_layer_model_catch(fake_model_structure, e, model_structure_idx, type, data, new_model, model_uuid);

		return false;
	}

	return new_model;
}

function throw_if_shape_contains_0_or_has_multihead(new_model) {
	if(new_model && new_model.layers) {
		var new_output_shape = new_model.layers[new_model.layers.length - 1].getOutputAt(0).shape;
		if(new_output_shape) {
			throw_if_output_shape_contains_0(new_output_shape);
			throw_if_has_multihead_output(new_model);
		}
	}
}

function throw_if_has_multihead_output (new_model) {
	try {
		var new_output_shape = new_model.layers[new_model.layers.length - 1].getOutputAt(1);
		throw new Error(`Layer ${model_structure_idx} has more than one output head!`);
	} catch (e) {
		if(("" + e).includes("Has Multi-Output")) {
			throw new Error(e);
		}
	}
}

function throw_if_output_shape_contains_0(new_output_shape) {
	for (j in new_output_shape) {
		if(new_output_shape[j] === 0) {
			if(new_output_shape.shape) {
				void(0); log("New output-shape:", new_output_shape.shape);
			}
			throw new Error("Input shape contains 0 at layer " + j);
		}
	}
}

async function handle_add_to_layer_model_catch (fake_model_structure, e, model_structure_idx, type, data, new_model, model_uuid) {
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
			set_layer_background(model_structure_idx, "red");
			set_model_layer_warning(model_structure_idx, "" + e);
			has_missing_values = true;
		} else {
			set_model_layer_warning(model_structure_idx, "" + e);
			l(language[lang]["error"] + ": " + e);
			dbg("type:");
			dbg(type);
			dbg("data:");
			dbg(data);
			throw new Error(e);
		}

		await dispose(new_model);
	}
}

function _set_layer_gui (data, fake_model_structure, model_structure_idx) {
	assert(typeof(data) == "object", "data is not an object");
	assert(typeof(model_structure_idx) == "number", "model_structure_idx is not a number");

	var data_keys = Object.keys(data);
	for (var k = 0; k < data_keys.length; k++) {
		var this_key = data_keys[k];
		var layer_setting = $($(".layer_setting")[model_structure_idx]);
		var current_setting = layer_setting.find("." + js_names_to_python_names[this_key]);
		if(!fake_model_structure && !is_valid_parameter(this_key, data[this_key], model_structure_idx)) {
			header("=================");
			void(0); log(`INVALID PARAMETER FOR LAYER ${model_structure_idx}: ` + this_key + ": ", data[this_key], " (" + typeof(data[this_key]) + ")");
			header("<<<<<<<<<<<<<<<<<");
			current_setting.css("background-color", "red");
		} else {
			current_setting.css("background-color", "");
		}
	}

}

function handle_create_model_error (e) {
	if(("" + e).includes("Negative dimension size caused by adding layer")) {
		wrn(`[create_model] Trying to layer failed, probably because the input size is too small or there are too many stacked layers.`);
	} else if(("" + e).includes("Input shape contains 0")) {
		wrn("[create_model] " + e);
	} else if(("" + e).includes("is not fully defined")) {
		wrn("[create_model] " + e);
	} else if(("" + e).includes("Input 0 is incompatible with layer")) {
		wrn("[create_model] Model could not be created because of problems with the input layer.");
	} else {
		throw new Error("[create_model] " +e);
	}
}

function remove_layer_warning(layer_idx, msg) {
	try {
		var container = $($(".warning_container")[layer_idx]);
		if (container.length === 0) {
			return;
		}

		var list = container.find("ul");
		if (list.length === 0) {
			// Nichts zu entfernen
			return;
		}

		var removed = false;
		list.find("li").each(function() {
			if ($(this).text() === msg) {
				$(this).remove();
				removed = true;
				return false;
			}
		});

		// Wenn alle entfernt wurden, Container leeren und verstecken
		if (list.find("li").length === 0) {
			container.html("").hide();
		}

		if (!removed) {
			console.warn("remove_layer_warning: message not found:", msg);
		}

	} catch (e) {
		console.error("Error in remove_layer_warning:", e);
	}
}

function hide_warning_container () {
	$(".warning_container").hide();
}

async function create_model (old_model = model, fake_model_structure = undefined, force = 0) {
	if(has_missing_values) {
		l(`${language[lang]["not_creating_model_because_some_values_are_missing"]} (create model)`);
		if(old_model) {
			return old_model;
		}

		err(language[lang]["no_model_found_but_has_missing_values"]);

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

	hide_warning_container();

	var model_structure = fake_model_structure;
	if(model_structure === undefined) {
		model_structure = await get_model_structure();
	}

	var model_uuid = "";

	if(fake_model_structure) {
		model_uuid = "FAKE_MODEL";
	} else {
		model_uuid = uuidv4();
	}

	var new_model;
	try {
		new_model = await _add_layers_to_model(model_structure, fake_model_structure, model_uuid);

		await dispose_old_model_tensors(model_uuid);
	} catch (e) {
		handle_create_model_error(e)

		return;
	}

	$(".warning_container").html("").hide();

	enable_train();

	if(typeof(fake_model_structure) == "undefined") {
		$("#html").text(await get_html_from_model());
	}

	current_layer_status_hash = await get_current_layer_container_status_hash();

	if(!fake_model_structure) {
		dbg("[create_model] " + language[lang]["model_compiled_successfully"]);

		if(currently_predicting_webcam) {
			currently_predicting_webcam = false;

			await restart_webcams();
		}
	}

	await dispose_old_model_weights(old_model);

	var model_data = await get_model_data();

	global_model_data = model_data;

	set_last_known_good_input_shape(fake_model_structure);

	return [new_model, model_data];
}

async function dispose_old_model_weights (old_model) {
	if(old_model) {
		var old_model_has_layers = 1;
		try {
			var x = old_model.layers;
		} catch (e) {
			old_model_has_layers = 0;
		}

		try {
			if(old_model_has_layers && old_model.layers && old_model.layers.length) {
				for (var k = 0; k < old_model.layers.length; k++) {
					for (var j = 0; j < old_model.layers[k].weights.length; j++) {
						await dispose(old_model.layers[k].weights[j].val);
					}
				}
			} else {
				if(finished_loading) {
					dbg(language[lang]["old_model_had_no_layers"]);
				}
			}
		} catch (e) {
			throw new Error(e);
		}

		await dispose(old_model);
	}
}

function set_last_known_good_input_shape (fake_model_structure) {
	if(!fake_model_structure) {
		last_known_good_input_shape = get_input_shape_as_string();
	}
}

async function dispose_old_model_tensors (model_uuid) {
	var disposable = [];

	Object.keys(_custom_tensors).forEach((idx, e) => {
		if(
			(_custom_tensors[idx][2].match(/(?:kernel|bias) in _add_layer_to_model/) ||
			_custom_tensors[idx][2].match(/model in tf_sequential/)) &&
			!_custom_tensors[idx][2].match(/FAKE/)
		) {
			if(_custom_tensors[idx][0].match(/UUID:/) && !_custom_tensors[idx][0].includes(model_uuid)) {
				disposable.push(_custom_tensors[idx][1]);
			}
		}
	});

	for (var disposable_idx in disposable) {
		if(disposable_idx != "last") {
			await dispose(disposable[disposable_idx]);
		}
	}

	_clean_custom_tensors();
}

async function _add_layers_to_model (model_structure, fake_model_structure, model_uuid) {
	var new_model = tf_sequential(model_uuid);
	for (var model_structure_idx = 0; model_structure_idx < model_structure.length; model_structure_idx++) {
		var type = model_structure[model_structure_idx]["type"];
		var data = model_structure[model_structure_idx]["data"];

		data = _check_data(data, type);

		_set_layer_gui(data, fake_model_structure, model_structure_idx);

		try {
			if(!await _add_layer_to_model(type, data, fake_model_structure, model_structure_idx, new_model, model_uuid)) {
				if(!fake_model_structure) {
					err(`[_add_layers_to_model] ${language[lang]["failed_to_add_layer_type"]} ${type}`);
				} else {
					dbg(`[_add_layers_to_model] ${language[lang]["failed_to_add_layer_type"]} ${type} (${language[lang]["but_ok_because_fake_model"]})`);
				}
			}
		} catch (e) {
			var msg = "" + e;
			msg = msg.replace(/^(Error:\s*)+/, "Error: ");
			layer_warning_container(model_structure_idx, msg);
			await write_descriptions();
			throw new Error(e);
		}
	}

	return new_model;
}

function layer_warning_container(layer_idx, msg) {
	try {
		var container = $($(".warning_container")[layer_idx]);
		if (container.length === 0) {
			console.error("layer_warning_container: invalid layer index", layer_idx);
			return;
		}

		// Prüfe, ob bereits eine UL existiert, sonst neu erstellen
		var list = container.find("ul");
		if (list.length === 0) {
			list = $("<ul></ul>");
			container.html(list);
		}

		// Wenn msg schon vorhanden ist, nicht nochmal hinzufügen
		var exists = false;
		list.find("li").each(function() {
			if ($(this).text() === msg) {
				exists = true;
				return false;
			}
		});

		if (!exists) {
			var li = $("<li></li>").text(msg);
			list.append(li);
		}

		container.show();

	} catch (e) {
		console.error("Error in layer_warning_container:", e);
	}
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

	for (var option_idx = 0; option_idx < options.length; option_idx++) {
		var this_option = options[option_idx];

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
			// left empty on purpose
		}

		if(js_option_name) {
			var default_value = get_default_option(layer_type, js_names_to_python_names[js_option_name]);

			if(js_option_name === undefined) {
				void(0); wrn("Cannot map " + this_option + " to js_option_name");
			} else {
				if(js_option_name == "dilationRate") {
					data[js_option_name] = eval(default_value);
				} else if (typeof(default_value) == "function") {
					data[js_option_name] = default_value(option_idx);
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

	if(layer_type == "number") {
		err(`layer_type is number`);
	}

	var match = layer_type.match(/(\d+)[dD]/);

	if(match) {
		if(typeof(layer_options_defaults[option_name]) == "string" && layer_options_defaults[option_name] == "[]") {
			var number_of_match_items = parse_int(match[1]);
			var number = 1;
			if(option_name == "kernel_size") {
				var number = 3;
			}
			var results = [];

			for (var number_idx = 0; number_idx < number_of_match_items; number_idx++) {
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

function layer_type_always_works(layer_type) {
	var res = !!(
		["dense", "dropout", "GaussianNoise", "gaussianDropout", "DebugLayer"].includes(layer_type) ||
		(layer_options[layer_type] && ["Activation", "Noise"].includes(layer_options[layer_type].category))
	);
	return res;
}

function heuristic_layer_possibility_check (layer_nr, layer_type) {
	assert(typeof(layer_nr) == "number", layer_nr + " is not an number but " + typeof(layer_nr));
	assert(typeof(layer_type) == "string", layer_type + " is not an string but " + typeof(layer_type));

	var layer_input_shape = calculate_default_target_shape(layer_nr);

	if(!layer_input_shape) {
		return false;
	}

	if(layer_type == "flatten") {
		if(layer_input_shape.length > 1) {
			return true;
		} else {
			return false;
		}

		return false;
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

	for (var layer_idx = 0; layer_idx < layer_names.length; layer_idx++) {
		var layer_type = layer_names[layer_idx];
		if(mode == "expert") {
			valid_layer_types.push(layer_type);
		} else {
			if(layer_type == "reshape") {
				void(0); // do nothing here, since reshape is only available in expert mode
			} else if(layer_type_always_works(layer_type)) {
				valid_layer_types.push(layer_type);
			} else {
				var percent = (((layer_idx + 1) / layer_names.length) * 100).toFixed(0);
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
		l(language[lang]["checked_possible_layer_types"]);
	}

	$("body").css("cursor", get_cursor_or_none("default"));

	allowed_layer_cache[layer_nr] = valid_layer_types;

	return valid_layer_types;
}

async function set_weights_from_json_object (json, dont_show_weights, no_error, m) {
	if(!json) {
		err(language[lang]["set_weights_from_json_object_json_was_empty"]);
		return false;
	}

	if(!m) {
		//wrn("Model not given. Using model singleton.");
		m = model;
	}

	if(!m) {
		err(language[lang]["no_model"]);
		return;
	}

	var weights_array = [];

	var tensors = [];

	if(typeof(json) == "string") {
		try {
			json = JSON.parse(json);
		} catch (e) {
			l(language[lang]["an_error_occured_setting_weights_check_dev_console"]);
			err(e);
			return;
		}
	}

	for (var json_idx = 0; json_idx < json.length; json_idx++) {
		tensors.push(tensor(json[json_idx]));
	}

	try {
		var old_model_weights = model.weights;
		try {
			m.setWeights(tensors);

			for (var json_idx = 0; json_idx < json.length; json_idx++) {
				await dispose(tensors[json_idx]);
			}
		} catch (e) {
			//log("" + e);
		}
	} catch (e) {
		if(!no_error) {
			Swal.fire({
				icon: "error",
				title: language[lang]["error_loading_weights"],
				text: e
			});
		}
		err(e);
		return false;
	}

	if(!dont_show_weights) {
		Swal.fire(
			language[lang]["weights_loaded_successfully"],
			"",
			"success"
		);
	}

	return true;
}

async function set_weights_from_string (_string, no_warning, no_error, m=model) {
	try {
		var json = JSON.parse(_string);

		var res = await set_weights_from_json_object(json, no_warning, no_error, m);

		return res;
	} catch (e) {
		if(Object.keys(e).includes("message")) {
			e = e.message;
		}

		err("" + e);

		if(("" + e).includes("JSON.parse:")) {
			Swal.fire({
				icon: "error",
				title: "Oops...",
				text: language[lang]["weights_json_was_not_valid"]
			});
			err("" + e);
		}
	}
}

async function get_weights_as_json (m) {
	if(!m) {
		m = model;
	}

	if(!m) {
		err(language[lang]["cannot_find_model_using_global_one"]);
		return false;
	}

	if(!Object.keys(m).includes("_callHook")) {
		err(language[lang]["model_doesnt_include__call_hook"]);
		return false;
	}

	if(!typeof(m.getWeights) == "function") {
		err(language[lang]["model_get_weights_is_not_a_function"]);
		return false;
	}

	if(m) {
		var weights_array = [];
		tidy(() => {
			try {
				var weights = m.getWeights();

				for (var weight_idx = 0; weight_idx < weights.length; weight_idx++) {
					if(!weights[weight_idx].isDisposed) {
						weights_array[weight_idx] = array_sync(weights[weight_idx]);
					}
				}
			} catch (e) {
				if(("" + e).includes("already disposed")) {
					if(finished_loading) {
						//wrn("Maybe the model was recompiled or changed while predicting. This MAY be the cause of a problem, but it may also not be.");
					}
				} else if(("" + e).includes("e is undefined")) {
					wrn(language[lang]["e_is_undefined_in_get_weights_as_string_probably_harmless"]);
				} else if(("" + e).includes("getWeights is not a function")) {
					wrn(language[lang]["get_weights_is_not_a_function_model_may_have_been_undefined"]);
				} else {
					err(e);
					console.trace();
				}
			}
		});

		return weights_array;
	} else {
		return false;
	}
}

function get_weights_as_string (m = model) {
	if(!m) {
		m = model;
	}

	if(!m) {
		if(finished_loading) {
			dbg("get_weights_as_string: " + language[lang]["could_not_get_model"])
		}

		return false;
	}

	if(!Object.keys(m).includes("_callHook")) {
		dbg(language[lang]["given_model_is_not_a_model"]);
		return false;
	}

	if(!typeof(m.getWeights) == "function") {
		dbg(language[lang]["get_weights_is_not_defined"]);
		return false;
	}

	var res;

	if(m) {
		tidy(() => {
			try {
				var weights = m.getWeights();

				var weights_array = [];

				for (var weight_idx = 0; weight_idx < weights.length; weight_idx++) {
					if(!weights[weight_idx].isDisposed) {
						weights_array[weight_idx] = array_sync(weights[weight_idx]);
					} else {
						wrn(sprintf(language[lang]["weights_n_is_disposed"], weight_idx));
					}
				}

				last_weights_as_string = JSON.stringify(weights_array);
				res = last_weights_as_string;
			} catch (e) {
				if(("" + e).includes("already disposed")) {
					if(finished_loading) {
						//wrn("Maybe the model was recompiled or changed while predicting. This MAY be the cause of a problem, but it may also not be.");
					}
				} else if(("" + e).includes("e is undefined")) {
					wrn(language[lang]["e_is_undefined_in_get_weights_as_string_probably_harmless"]);
				} else if(("" + e).includes("getWeights is not a function")) {
					wrn(language[lang]["get_weights_is_not_a_function_model_may_have_been_undefined"]);
				} else {
					err(e);
					console.trace();
				}
			}
		});
	} else {
		res = false;
	}

	return res;
}

function download(filename, text) {
	try {
		var blob = new Blob([text], { type: "text/plain" });
		var url = URL.createObjectURL(blob);

		var element = document.createElement("a");
		element.setAttribute("href", url);
		element.setAttribute("download", filename);

		element.style.display = "none";
		document.body.appendChild(element);

		element.click();

		document.body.removeChild(element);

		URL.revokeObjectURL(url);
	} catch (error) {
		err(language[lang]["error_in_download"] + ":", error);
		// You can add additional error handling logic here
	}
}

function download_weights_json () {
	download("weights.json", get_weights_as_string());
}

async function output_size_at_layer (input_size_of_first_layer, layer_nr) {
	if(!model) {
		await compile_model();
	}
	var output_size = input_size_of_first_layer;
	for (var layer_idx = 0; layer_idx < model.layers.length; layer_idx++) {
		output_size = model.layers[layer_idx].getOutputAt(0)["shape"];
		if(layer_idx == layer_nr) {
			return output_size;
		}
	}

	return output_size;
}

async function save_model () {
	try {
		//model.save("downloads://model");
		await saveModelAsSingleZip();
	} catch (e) {
		if(!is_testing_unusual_inputs) {
			Swal.fire({
				icon: "error",
				title: language[lang]["saving_model_failed"],
				text: language[lang]["model_may_be_defective_and_cannot_be_saved"] + ": " + e
			});
		} else {
			wrn(language[lang]["wrong_model_but_thats_ok_because_you_are_testing_unusual_function_inputs"]);
		}
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
		weights_as_string = get_weights_as_string(m);
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

		err(language[lang]["parsing_error_in_get_weights_shape"] + ": " + e);
	}
}

async function get_tfjs_model () {
	await model.save("localstorage://demo/management/model1");

	var str = localStorage["tensorflowjs_models/demo/management/model1/model_topology"];

	return str;
}

async function _force_reinit() {
	l(language[lang]["starting_reinitializing"]);
	await compile_model(0);
	await updated_page();
	l(language[lang]["done_reinitializing"]);
}

async function force_reinit (no_msg) {
	if(!model) {
		l(language[lang]["tried_reinit_but_no_model_found"]);
		return;
	}

	if(!no_msg) {
		Swal.fire({
			title: language[lang]["are_you_sure"],
			text: language[lang]["this_loses_your_training_process_but_you_can_undo_it"],
			icon: "warning",
			showCancelButton: true,
			confirmButtonColor: "#3085d6",
			cancelButtonColor: "#d33",
			confirmButtonText: language[lang]["yes_reinit"]
		}).then(async (result) => {
			if (result.isConfirmed) {
				await _force_reinit();
			} else {
				l(language[lang]["reinit_cancelled"]);
			}
		});
	} else {
		await _force_reinit();
	}

	await rename_labels();
	await repredict();

}

function input_shape_is_image (is_from_webcam=0) {
	var shape = get_input_shape();
	var is = $(".input_shape_is_image");
	if(shape.length == 3 && shape[2] == 3) {
		is.show();
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
			wrn("[layer_has_multiple_nodes] no model in layer_has_multiple_nodes");
		}
	}

	if(!Object.keys(model).includes("layers")) {
		if(finished_loading) {
			wrn("[layer_has_multiple_nodes] no model.layers in layer_has_multiple_nodes");
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

async function compile_model_if_not_defined () {
	if(!model) {
		model = await create_model();
		await compile_model();
	}
}
