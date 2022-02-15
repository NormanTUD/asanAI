"use strict";

function compile_model () {
	var recompile_now = true;

	var recompiled = false;

	if(model_is_trained) {
		recompile_now = confirm("The model has been trained. You changed something. This needs a recompile to take action. Recompiling loses the trained weights/filters. Do you want to recompile and lose the training process?");
		if(!recompile_now) {
			$("#recompile_tab").show();
		}
	}

	if(recompile_now) {
		$("#recompile_tab").hide();
		model_is_trained = false;
		reset_summary();
		if(get_numberoflayers() >= 1) {
			try {
				var go_on = false;

				try {
					model = create_model(model);
					go_on = true;
					$("#error").html("");
					$("#error").parent().hide();
				} catch (e) {
					enable_everything();
					console.warn("ERROR1: " + e + " Resetting model.");
					//console.trace();
					$("#error").html(e);
					$("#error").parent().show();
					if(throw_compile_exception) { throw e; }
				}

				if(!disable_layer_debuggers) {
					add_layer_debuggers();
				}

				if(go_on) {
					try {
						model.compile(get_model_data());
						write_model_summary();
						$("#outputShape").val(JSON.stringify(model.outputShape));
						recompiled = true;
					} catch (e) {
						enable_everything();
						console.warn("ERROR2: " + e + " Resetting model.");
						console.trace();
						$("#error").html(e);
						$("#error").parent().show();
						if(throw_compile_exception) { throw e; }
					}
				}
			} catch (e) {
				enable_everything();
				console.warn("ERROR3: " + e + " Resetting model.");
				console.trace();
				$("#error").html(e);
				$("#error").parent().show();
				if(throw_compile_exception) { throw e; }
			}
		} else {
			console.warn("Need at least 1 layer. Not there yet...");
		}
	} else {
		log("Not recompiling now");
	}

	return recompiled;
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

		if(option_name == "pool_size") {
			data[get_js_name(option_name)] = [parseInt(get_item_value(i, "pool_size_x")), parseInt(get_item_value(i, "pool_size_y"))];
		} else if(option_name == "kernel_size") {
			data[get_js_name(option_name)] = [parseInt(get_item_value(i, "kernel_size_x")), parseInt(get_item_value(i, "kernel_size_y"))];
		} else if(option_name == "kernel_size_1d") {
			data[get_js_name("kernel_size")] = parseInt(get_item_value(i, "kernel_size"));
		} else if(option_name == "strides_1d") {
			data[get_js_name("strides")] = parseInt(get_item_value(i, "strides"));
		} else if(option_name == "trainable") {
			data[get_js_name("trainable")] = get_item_value(i, "trainable");
		} else if(option_name == "use_bias") {
			data[get_js_name("useBias")] = get_item_value(i, "use_bias");
		} else if(option_name == "pool_size_1d") {
			data[get_js_name("pool_size")] = parseInt(get_item_value(i, "pool_size"));
		} else if(option_name == "strides") {
			data[get_js_name(option_name)] = [parseInt(get_item_value(i, "strides_x")), parseInt(get_item_value(i, "strides_y"))];
		} else if(option_name == "size") {
			data[get_js_name(option_name)] = eval("[" + get_item_value(i, "size") + "]");
		} else if(option_name == "dilation_rate") {
			data[get_js_name(option_name)] = eval("[" + get_item_value(i, "dilation_rate") + "]");
		} else if(option_name == "rate") {
			data["rate"] = parseFloat(get_item_value(i, "dropout"));
		} else if(["epsilon", "momentum", "dropout_rate"].includes(option_name)) {
			data[get_js_name(option_name)] = parseFloat(get_item_value(i, option_name));
		} else if(option_name == "activation" && $($($($(".layer_setting")[i]).find("." + option_name)[0])).val() == "None") {
			// Do nothing if activation = None 
			data["activation"] = null;
		} else {
			var elem = $($($(".layer_setting")[i]).find("." + option_name)[0]);
			var value = $(elem).val();

			if($(elem).is(":checkbox")) {
				data[get_js_name(option_name)] = value == "on" ? true : false;
			} else {
				if(value != "") {
					data[get_js_name(option_name)] = isNumeric(value) ? parseInt(value) : value;
				} else {
					console.warn("Something may be wrong here! value is ''");
				}
			}
		}
	}

	return data;
}

function get_model_structure() {
	//console.trace();
	var new_current_status_hash = get_current_status_hash();
	if(layer_structure_cache && current_status_hash == new_current_status_hash) {
		//log("Using cache");
		//console.trace();
		return JSON.parse(layer_structure_cache);
	}
	var first_layer = true;
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
		}
	}

	layer_structure_cache = JSON.stringify(structure);
	return structure;
}

function is_integer_array (value) {
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
		(["unitForgetBias", "center", "scale", "unroll", "trainable", "useBias", "stateful", "returnSequences", "returnState", "goBackwards"].includes(keyname) && typeof(value) == "boolean") ||
		(keyname == "name" && typeof(value) == "string") || 
		(["recurrentInitializer", "biasInitializer", "kernelInitializer", "depthwiseInitializer", "pointwiseInitializer", "movingMeanInitializer", "movingVarianceInitializer", "betaInitializer", "gammaInitializer"].includes(keyname) && ['constant', 'glorotNormal', 'glorotUniform', 'heNormal', 'heUniform', 'identity', 'leCunNormal', 'leCunUniform', 'ones', 'orthogonal', 'randomNormal', 'randomUniform', 'truncatedNormal', 'varianceScaling', 'zeros', 'string'].includes(value)) ||
		(keyname == "dtype" && ['float32', 'int32', 'bool', 'complex64', 'string'].includes(value)) ||
		(keyname == "padding" && ['valid', 'same', 'causal'].includes(value)) ||
		(keyname == "activation" && ['elu', 'hardSigmoid', 'linear', 'relu', 'relu6',  'selu', 'sigmoid', 'softmax', 'softplus', 'softsign', 'tanh', 'swish', 'mish'].includes(value)) ||
		(["kernelSize", "poolSize", "strides", "dilationRate", "size"].includes(keyname) && (is_integer_array(value) || typeof(value) == "number")) ||
		(keyname == "implementation" && [1, 2].includes(value)) ||
		(keyname == "interpolation" && ["nearest", "bilinear"].includes(value)) ||
		(keyname == "inputShape" && layer == 0 && is_integer_array(value)) ||
		(keyname == "targetShape" && is_integer_array(value)) ||
		(["alpha", "stddev", "depthMultiplier"].includes(keyname) && typeof(value) == "number") ||
		(keyname == "axis" && typeof(value) == "number" && parseInt(value) == value) ||
		(["recurrentDropout", "dropout", "rate", "dropout_rate"].includes(keyname) && typeof(value) == "number" && value >= 0 && value <= 1) ||
		(["epsilon"].includes(keyname) && typeof(value) == "number" && value >= 0) ||
		(["theta"].includes(keyname) && typeof(value) == "number" && (value >= 0 || value == -1)) ||
		(["maxValue", "momentum"].includes(keyname) && typeof(value) == "number")
	) {
		return true;
	}

	return false;
}

function remove_empty(obj) {
	return Object.fromEntries(Object.entries(obj).filter(([_, v]) => v != null));
}

function create_model (old_model, fake_model_structure) {
	var new_current_status_hash = get_current_status_hash();
	if(fake_model_structure === undefined && new_current_status_hash == current_status_hash) {
		return old_model;
	}

	current_status_hash = new_current_status_hash;

	$(".warning_container").hide();

	if(disable_show_python_and_create_model) {
		return;
	}

	var new_model = tf.sequential();

	var model_structure = fake_model_structure; 
	if(model_structure === undefined) {
		model_structure = get_model_structure();
	}

	var node_js = "import * as tf from '@tensorflow/tfjs-node';\nvar model = tf.sequential();\n";
	
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

		data = remove_empty(data);

		var data_keys = Object.keys(data);
		for (var k = 0; k < data_keys.length; k++) {
			var this_key = data_keys[k];
			if(!is_valid_parameter(this_key, data[this_key], i)) {
				header("INVALID PARAMETER: " + this_key + ": " + data[this_key] + " (" + typeof(data[this_key]) + ")");
			}
		}

		new_model.add(tf.layers[type](data));

		node_js += "model.add(tf.layers." + type + "(" + JSON.stringify(data, null, 2) + "));\n";
	}

	if(typeof(fake_model_structure) == "undefined") {
		$("#node").html(node_js);
	}

	return new_model;
}

function list_all_layer_types_that_dont_have_default_options () {
	var no_options = [];

	var all_options = [];

	var keys = Object.keys(layer_options);

	for (var i = 0; i < keys.length; i++) {
		var layer_name = keys[i];
		for (var j = 0; j < layer_options[layer_name]["options"].length; j++) {
			var this_option = layer_options[layer_name]["options"][j];
			if(!all_options.includes(this_option)) {
				all_options.push(this_option);
			}
		}
	}

	for (var i = 0; i < all_options.length; i++) {
		var key = all_options[i];
		if(key in layer_options_defaults) {
		} else {
			no_options.push(key);
		}
	}

	log(no_options);
}

function get_fake_data_for_layertype (layer_nr, layer_type) {
	assert(typeof(layer_nr) == "number", layer_nr + " is not an number but " + typeof(layer_nr));
	assert(typeof(layer_type) == "string", layer_type + " is not an string but " + typeof(layer_type));

	var data = {};

	var options = layer_options[layer_type]["options"]

	if(layer_nr == 0) {
		data["inputShape"] = get_input_shape();
	}

	for (var i = 0; i < options.length; i++) {
		var this_option = options[i];

		var default_value = layer_options_defaults[this_option];
		var js_option_name = undefined;
		if (this_option in python_names_to_js_names) {
			js_option_name = python_names_to_js_names[this_option]
		} else if (this_option == "strides_1d") {
			js_option_name = "strides";
		} else if (this_option == "kernel_size_1d") {
			js_option_name = "kernelSize";
		} else if (this_option == "dropout") {
			js_option_name = "rate";
		} else if (this_option == "pool_size_1d") {
			js_option_name = "poolSize";
		} else if (this_option == "dropout_rate") {
			js_option_name = "dropoutRate";
		}

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

		if(layer_type == "averagePooling1d") {
			data["poolSize"] = layer_options_defaults["pool_size"][0];
			data["strides"] = layer_options_defaults["strides"][0];
		}

		data = remove_empty(data);
	}
	
	return data;
}

function create_fake_model_structure (layer_nr, layer_type) {
	assert(typeof(layer_nr) == "number", layer_nr + " is not an number but " + typeof(layer_nr));
	assert(typeof(layer_type) == "string", layer_type + " is not an string but " + typeof(layer_type));

	var fake_model_structure = get_model_structure();

	fake_model_structure[layer_nr]["type"] = layer_type;
	fake_model_structure[layer_nr]["data"] = get_fake_data_for_layertype(layer_nr, layer_type);

	return fake_model_structure;
}

function compile_fake_model (layer_nr, layer_type) {
	assert(typeof(layer_nr) == "number", layer_nr + " is not an number but " + typeof(layer_nr));
	assert(typeof(layer_type) == "string", layer_type + " is not an string but " + typeof(layer_type));

	var fake_model_structure = create_fake_model_structure(layer_nr, layer_type);
	try {
		var fake_model = create_model(null, fake_model_structure);
		fake_model.compile(get_model_data());
	} catch (e) {
		var str_e = e + "";
		return false;
	}
	return true;
}

// Heuristic check of whether layer types are possible at all. Only test if they're possible,
// this saves a lot of time
function heuristic_layer_possibility_check (layer_nr, layer_type) {
	assert(typeof(layer_nr) == "number", layer_nr + " is not an number but " + typeof(layer_nr));
	assert(typeof(layer_type) == "string", layer_type + " is not an string but " + typeof(layer_type));

	var layer_input_shape = calculate_default_target_shape(layer_nr);

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
		} else if(["conv3d", "averagePooling3d", "maxPooling3d"].includes(layer_type)) {
			if(layer_input_shape.length == 4) {
				return true;
			}
			return false;
		}
	} else if(["gru"].includes(layer_type)) {
		if(layer_type == "gru" && layer_input_shape.length < 2) {
			return false;
		}
	}
	return true;
}

function get_valid_layer_types (layer_nr) {
	assert(typeof(layer_nr) == "number", layer_nr + " is not an number but " + typeof(layer_nr));

	if(!typeof(last_allowed_layers_update) == "undefined" &&  last_allowed_layers_update == get_current_status_hash() && Object.keys(allowed_layer_cache).includes(layer_nr)) {
		return allowed_layer_cache[layer_nr];
	}

	allowed_layer_cache[layer_nr] = null;

	last_allowed_layers_update = get_current_status_hash();

	var valid_layer_types = [];

	var layer_types = Object.keys(layer_options);

	$('body').css('cursor', 'wait');

	for (var i = 0; i < layer_types.length; i++) {
		var layer_type = layer_types[i];
		if(mode == "expert") {
			valid_layer_types.push(layer_type);
		} else {
			if(["dense", "reshape", "dropout"].includes(layer_type) || ["Activation", "Noise"].includes(layer_options[layer_type].category)) {
				valid_layer_types.push(layer_type);
			} else {
				if(heuristic_layer_possibility_check(layer_nr, layer_type)) {
					//log("Testing " + layer_type);
					if(compile_fake_model(layer_nr, layer_type)) {
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

async function get_weights_as_string () {
	var weights = await model.getWeights();

	var weights_array = [];

	for (var i = 0; i < weights.length; i++) {
		weights_array[i] = weights[i].arraySync();
	}

	return JSON.stringify(weights_array);
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
