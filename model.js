"use strict";

function compile_model () {
	reset_summary();
	if(get_numberoflayers() >= 1) {
		try {
			model = create_model(model);
			add_layer_debuggers();

			model.compile(get_model_data());

			write_model_model_summary(model);

			$("#outputShape").val(JSON.stringify(model.outputShape));
		} catch (e) {
			enable_everything();
			console.warn("ERROR: " + e + " Resetting model");
			console.trace();
		}

	} else {
		console.warn("Need at least 1 layer. Not there yet...");
	}
}

function get_model_structure() {
	var new_current_status_hash = get_current_status_hash();
	if(layer_structure_cache && current_status_hash == new_current_status_hash) {
		return layer_structure_cache;
	}
	var first_layer = true;
	var structure = [];
	for (var i = 0; i < get_numberoflayers(); i++) {
		var layer_type = $($($(".layer_setting")[i]).find(".layer_type")[0]);
		var type = $(layer_type).val();
		if(typeof(type) !== "undefined") {
			var data = {
				"name": type + "_" + (i + 1)
			};

			if(i == 0 || first_layer) {
				data["inputShape"] = get_input_shape();
			}

			for (var j = 0; j < layer_options[type]["options"].length; j++) {
				var option_name = layer_options[type]["options"][j];
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
				} else if(option_name == "dropout_rate") {
					data[get_js_name(option_name)] = parseInt(get_item_value(i, "dropout_rate")) / 100;
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
						}
					}
				}
			}

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
		}
	}
	layer_structure_cache = structure;
	return structure;
}

function create_model (old_model, fake_model_structure) {
	var new_current_status_hash = get_current_status_hash();
	if(fake_model_structure === undefined && new_current_status_hash == current_status_hash) {
		return old_model;
	}
	//log("create_model");

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

	for (var i = 0; i < model_structure.length; i++) {
		var type = model_structure[i]["type"];
		var data = model_structure[i]["data"];
		new_model.add(tf.layers[type](data));
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
	//log("get_fake_data_for_layertype(" + layer_nr + ", " + layer_type + ")");
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

		/*
		if(layer_type == "conv3d") {
			data["poolSize"] = layer_options_defaults["pool_size"];
			data["poolSize"].push(data["poolSize"][0]);
			data["strides"] = layer_options_defaults["strides"];
			data["strides"].push(data["strides"][0]);
		}
		*/
	}
	
	return data;
}

function create_fake_model_structure (layer_nr, layer_type) {
	//log("create_fake_model_structure(" + layer_nr + ", " + layer_type + ")");
	var fake_model_structure = get_model_structure();

	fake_model_structure[layer_nr]["type"] = layer_type;
	fake_model_structure[layer_nr]["data"] = get_fake_data_for_layertype(layer_nr, layer_type);

	return fake_model_structure;
}

function compile_fake_model (layer_nr, layer_type) {
	//log("compile_fake_model(" + layer_nr + ", " + layer_type + ")");
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

function get_valid_layer_types (layer_nr) {
	//log("get_valid_layer_types(" + layer_nr + ")");
	var valid_layer_types = [];

	var layer_types = Object.keys(layer_options);

	for (var i = 0; i < layer_types.length; i++) {
		var layer_type = layer_types[i];
		if(compile_fake_model(layer_nr, layer_type)) {
			valid_layer_types.push(layer_type);
		}
	}

	return valid_layer_types;
}
