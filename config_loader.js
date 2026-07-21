"use strict";

async function set_config(index=undefined, keep_overlay=false) {
	assert(["string", "undefined"].includes(typeof(index)), "Index must be either string or undefined, but is " + typeof(index) + " (" + index + ")");

	last_known_good_input_shape = "[]";

	$(".only_show_when_predicting_image_file").hide();

	var msg = language[lang]["loading_model"];

	if (index) {
		msg = language[lang]["undoing_redoing"];
	}

	l(msg);

	var overlay = null;
	if (!finished_loading) {
		load_msg_advance(msg + "...");
	} else {
		var spinner = `<div class="spinner"></div> `;
		overlay = load_msg({"title": `<span style="display:flex; align-items:center; gap:0.5ch">${spinner}${msg}...</span>`, "html": msg});
	}

	function update_step(step_msg) {
		l(step_msg);
		if (overlay) {
			var spinner = `<div class="spinner"></div> `;
			update_overlay_title(overlay, `<span style="display:flex; align-items:center; gap:0.5ch">${spinner}${step_msg}...</span>`);
		}
	}

	var original_disabling_saving_status = disabling_saving_status;
	disabling_saving_status = true;

	prev_layer_data = [];

	is_setting_config = true;

	update_step(language[lang]["loading_configuration"]);
	var config = await _get_configuration(index);

	disable_show_python_and_create_model = true;

	if (config) {
		update_step(language[lang]["setting_model_parameters"]);
		await set_stuff_from_predefined_config(index, config);

		update_step(language[lang]["reading_layer_architecture"]);
		var keras_layers = await get_number_of_layers_and_keras_layers(config);

		if(keras_layers === false) {
			err("set_config: keras_layers from get_number_of_layers_and_keras_layers was empty");
			return;
		}

		if(keras_layers === false) {
			return;
		}

		if (config["input_shape"]) {
			update_step(language[lang]["setting_input_shape"]);
			await set_input_shape(config["input_shape"]);
		} else {
			if(!set_is_from_config_or_return(config)) {
				return;
			}
		}

		await set_width_and_height_from_first_layer_if_image(keras_layers);

		update_step(language[lang]["applying_layer_settings"]);
		keras_layers = await apply_keras_layers_to_ui_from_config(config, keras_layers);
	}

	disabling_saving_status = original_disabling_saving_status;
	disable_show_python_and_create_model = false;

	update_step(language[lang]["creating_model"]);

	await dispose_if_exists(global_model_data);

	await get_model_data();

	model = await create_model(model, undefined);

	update_step(language[lang]["compiling_model"]);
	await compile_model();

	update_step(language[lang]["loading_weights"]);
	if(await set_weights_if_exists_or_error(config)) {
		return;
	}

	disable_all_non_selected_layer_types();

	update_step(language[lang]["loading_labels"]);
	await get_label_data();

	is_setting_config = false;

	await update_page_and_show_time();
	await write_descriptions();

	trigger_initializers();

	show_or_hide_photos_depending_on_if_index(index);

	remove_confusion_matrix();

	if(!keep_overlay) {
		remove_overlay();
	}
}

async function _get_configuration(index=undefined) {
	assert(["string", "undefined"].includes(typeof(index)), "Index must be either string or undefined, but is " + typeof(index) + " (" + index + ")");

	var data = undefined;

	if (index) {
		if (Object.keys(status_saves).includes(index)) {
			data = {};
			data["model_structure"] = status_saves[index]["model_structure"];
			data["weights"] = status_saves[index]["weights"];
		} else {
			log("[_get_configuration] Index " + index + " could not be found");
		}
	}

	if (typeof(data) == "undefined") {
		try {
			while ($("#dataset").val() === null) {
				await delay(50);
			}

			var data_url, keras_url;
			var filename = traindata_struct[$("#dataset option:selected").text()]["filename"];

			if(filename.startsWith("get_")) {
				data_url = traindata_struct[$("#dataset option:selected").text()]["data"];
				keras_url = filename;
			} else {
				data_url = "traindata/" + $("#dataset").val() + ".json";
				keras_url = "traindata/" + $("#dataset").val() + "_keras.json";
			}

			data = await get_cached_json(data_url);

			if (uploaded_model == "") {
				var new_data = await get_cached_json(keras_url);
				if(new_data) {
					data["keras"] = new_data;
				}
			} else {
				data["keras"] = JSON.parse(uploaded_model);
				uploaded_model = "";
			}
		} catch (e) {
			if(Object.keys(e).includes("message")) {
				e = e.message;
			}

			err(e);

			return null;
		}
	}

	return data;
}

async function set_stuff_from_predefined_config (index, config) {
	if (!index) {
		var trigger_height_change = 0;

		trigger_height_change = set_width_or_height_from_config(config, "width", trigger_height_change);
		trigger_height_change = set_width_or_height_from_config(config, "height", trigger_height_change);

		if (config["labels"]) {
			l(language[lang]["setting_labels_from_config"]);
			await set_labels(config["labels"]);
			assert(labels.length > 0, "could not get labels even though they are specified");
		}

		set_max_number_of_files_per_category_from_config(config);

		set_divide_by_from_config(config);

		set_epochs_batchsize_and_validation_split_from_config_if_side_is_loaded(config);

		set_metric_loss_and_optimizer_from_config(config);

		$("#height").trigger("change"); // quickfix for compiling changes only now instead of many times earlier on each trigger.change

		set_special_optimizer_stuff_from_config(config);
	}
}

async function get_number_of_layers_and_keras_layers (config) {
	var number_of_layers = 0;
	var keras_layers = null;

	if (!config["model_structure"]) {
		keras_layers = get_keras_layers_from_possible_paths(config, keras_layers);

		if(await error_if_keras_layers_not_defined(keras_layers)) {
			return false;
		}

		number_of_layers = set_number_of_layers_from_keras_layers_or_error(keras_layers, number_of_layers);

		if(number_of_layers === null) {
			return false;
		}
	} else {
		number_of_layers = config["model_structure"].length;
	}

	await init_number_of_layers(number_of_layers);

	return keras_layers;
}

function get_keras_layers_from_possible_paths (config, keras_layers) {
	var paths = get_possible_paths_for_layers();

	for (var path_idx = 0; path_idx < paths.length; path_idx++) {
		if (!keras_layers) {
			keras_layers = get_key_from_path(config, paths[path_idx]);
		}
	}

	return keras_layers;
}

function get_possible_paths_for_layers() {
	return [
		["keras", "config", "layers"],
		["keras", "modelTopology", "config", "layers"],
		["keras", "modelTopology", "model_config", "layers"],
		["keras", "modelTopology", "model_config", "config", "layers"],
		["keras", "keras", "modelTopology", "config", "layers"],
		["keras", "keras", "modelTopology", "model_config", "layers"],
		["keras", "keras", "modelTopology", "model_config", "config", "layers"],
		["layers"],
		["keras"]
	];
}

async function apply_keras_layers_to_ui_from_config(config, keras_layers) {
	if (!config["model_structure"]) {
		if (keras_layers[0]["class_name"] == "InputLayer") {
			keras_layers.shift();
		}

		var layer_settings = $(".layer_setting");
		for (var keras_layer_idx = 0; keras_layer_idx < keras_layers.length; keras_layer_idx++) {
			var layer_type = $($(layer_settings[keras_layer_idx]).find(".layer_type")[0]);
			layer_type.val(python_names_to_js_names[keras_layers[keras_layer_idx]["class_name"]]);
			layer_type.trigger("change");
			layer_type.trigger("slide");
		}

		await apply_keras_layers_to_ui(keras_layers);
	} else {
		populate_layer_settings_from_config(config);
	}

	return keras_layers;
}

async function apply_keras_layers_to_ui(keras_layers) {
	for (var keras_layer_idx = 0; keras_layer_idx < keras_layers.length; keras_layer_idx++) {
		var datapoints = get_datapoints_for_keras_layer();

		dbg("[set_config] " + language[lang]["setting_options_for_layer"] + " " + keras_layer_idx);

		datapoints.forEach(function (item_name) {
			if (item_name in keras_layers[keras_layer_idx]["config"] && item_name != "kernel_size" && item_name != "strides" && item_name != "pool_size") {
var value = keras_layers[keras_layer_idx]["config"][item_name];
				if (item_name == "kernel_initializer") {
					value = detect_kernel_initializer(value);
				} else if (item_name == "bias_initializer") {
					value = get_initializer_name(value["class_name"]);
				}

				if (!(keras_layers[keras_layer_idx]["class_name"] == "Flatten" && item_name == "trainable")) {
					set_item_value(keras_layer_idx, item_name, value);
				}
			} else {
				if (["kernel_size", "strides", "pool_size"].includes(item_name) && item_name in keras_layers[keras_layer_idx]["config"]) {
					var values = keras_layers[keras_layer_idx]["config"][item_name];
					set_xyz_values(keras_layer_idx, item_name, values);
				} else if (item_name == "dropout_rate" && keras_layers[keras_layer_idx]["class_name"] == "Dropout") {
					set_item_value(keras_layer_idx, "dropout_rate", keras_layers[keras_layer_idx]["config"]["rate"]);
				} else {
					//wrn("Item not found in keras: " + item_name);
				}
			}
		});

		var units = keras_layers[keras_layer_idx]["config"]["units"];
		if (units == "number_of_categories") {
			var number_of_categories = await get_number_of_categories();
			set_item_value(keras_layer_idx, "units", number_of_categories);
		} else {
			if (Object.keys(keras_layers[keras_layer_idx]["config"]).includes("units")) {
				set_item_value(keras_layer_idx, "units", units);
			}
		}

		if ("dilation_rate" in keras_layers[keras_layer_idx]["config"]) {
			var dilation_rate = keras_layers[keras_layer_idx]["config"]["dilation_rate"];
			var dilation_rate_str = dilation_rate.join(",");
			set_item_value(keras_layer_idx, "dilation_rate", dilation_rate_str);
		}
	}
}

function populate_layer_settings_from_config (config) {
	for (var model_structure_idx = 0; model_structure_idx < config["model_structure"].length; model_structure_idx++) {
		dbg("[set_config] " + language[lang]["setting_options_for_layer"] + " " + model_structure_idx);
		var layer_type = $($(".layer_type")[model_structure_idx]); //$($($(".layer_setting")[model_structure_idx]).find(".layer_type")[0]);
		layer_type.val(config["model_structure"][model_structure_idx]["type"]);
		layer_type.trigger("change");
		layer_type.trigger("slide");

		var keys = Object.keys(config["model_structure"][model_structure_idx]["data"]);
		for (var j = 0; j < keys.length; j++) {
			const key = keys[j];
			if (!["inputShape"].includes(key)) {
				apply_config_value_to_model_structure(config, key, model_structure_idx);
			}
		}
	}
}

function apply_config_value_to_model_structure (config, key, model_structure_idx) {
	var value = config["model_structure"][model_structure_idx]["data"][key];

	if (["kernelSize", "strides"].includes(key)) {
		set_xyz_values(model_structure_idx, get_python_name(key), value);
	} else if (["dilationRate"].includes(key)) {
		set_item_value(model_structure_idx, get_python_name(key), value.join(","));
	} else {
		if ((typeof(value)).includes("object")) {
			if (Object.keys(value).includes("name")) {
				value = value["name"];
			}
		}

		set_item_value(model_structure_idx, get_python_name(key), value);
	}
}

async function set_is_from_config_or_return (config) {
	try {
		await set_is_from_config_is(config);
	} catch (e) {
		if(handle_set_config_load_input_shape_error(e)) {
			return true;
		}
	}

	return false;
}

async function set_is_from_config_is(config) {
	var is = get_is_from_config(config);

	if(is) {
		is = remove_empty(is);
		is = Object.values(is);

		if(is[0] == 1 && is.length == 4) {
			is.shift();
		}

		await set_input_shape("[" + is.join(", ") + "]");
	}
}

function get_is_from_config (config) {
	var is = null;
	if(Object.keys(config).includes("keras")) {
		if(Object.keys(config.keras).includes("modelTopology")) {
			is = config.keras.modelTopology.config.layers[0].config.batch_input_shape;
		} else {
			is = config.keras.config.layers[0].config.batch_input_shape;
		}
	} else {
		l(language[lang]["error_keras_not_found_in_config"]);
	}

	return is;
}

function set_width_or_height_from_config(config, type, trigger_height_change) {
	if (config[type]) {
		dbg("[set_config] " + language[lang]["setting_height"]);
		$("#" + type).val(config[type]);
		trigger_height_change++;
		eval(`${type} = config[type];`) ;
		eval(`assert(typeof(${type}) == "number", "${type} is not a number");`);
	}

}

function set_divide_by_from_config(config) {
	if (config["divide_by"]) {
		assert(typeof(config["divide_by"]) == "number", "divide_by is not a number");
		dbg(`[set_config] ${language[lang]["setting_divide_by_to"]} ` + config["divide_by"]);
		$("#divide_by").val(config["divide_by"]);
	} else {
		dbg(`[set_config] ${language[lang]["setting_divide_by_to"]} ` + 1);
		$("#divide_by").val(1);
	}
}

function set_max_number_of_files_per_category_from_config (config) {
	if (config["max_number_of_files_per_category"]) {
		assert(typeof(config["max_number_of_files_per_category"]) == "number", "max_number_of_files_per_category is not a number");
		dbg(`[set_config] ${language[lang]["setting_max_number_of_files_per_category_to"]} ${config["max_number_of_files_per_category"]}`);
		set_imgcat(config["max_number_of_files_per_category"]);
	} else {
		dbg(`[set_config] ${language[lang]["no_max_number_of_files_per_category_found_in_config"]}`);
	}
}

function set_metric_loss_and_optimizer_from_config (config) {
	set_loss(config["loss"], 0);
	set_metric(config["metric"], 0);
	set_optimizer(config["optimizer"], 0);
}

function set_epochs_batchsize_and_validation_split_from_config_if_side_is_loaded(config) {
	assert(typeof(config["epochs"]) == "number", "epochs is not a number");
	assert(typeof(config["loss"]) == "string", "loss is not a string");

	if(finished_loading) {
		set_epochs(config["epochs"]);
		set_batch_size(config["batchSize"]);
		set_validation_split(config["validationSplit"]);
	}
}

function set_special_optimizer_stuff_from_config(config) {
	set_optimizer_special_rmsprop_from_config(config);
	set_optimizer_special_sgd_rmsprop_from_config(config);
	set_optimizer_special_momentum_rmsprop_from_config(config);
}

async function error_if_keras_layers_not_defined(keras_layers) {
	if (keras_layers === undefined) {
		await send_bug_report();

		Swal.fire({
			icon: "error",
			title: language[lang]["oops"],
			text: language[lang]["error_loading_model"]
		});
		await write_descriptions();
		return true;
	}

	return false;
}

async function set_weights_if_exists_or_error(config){
	try {
		if (config["weights"]) {
			l(language[lang]["setting_weights_from_config_weights"]);
			var weights_string = JSON.stringify(config["weights"]);
			await set_weights_from_string(weights_string, 1, 1);
		}
	} catch (e) {
		err(e);
		l(language[lang]["error_failed_to_load_model_and_or_weights"]);

		remove_overlay();
		return true;
	}

	return false;
}

function set_number_of_layers_from_keras_layers_or_error(keras_layers, number_of_layers) {
	try {
		number_of_layers = keras_layers.length - (keras_layers[0]["class_name"] == "InputLayer" ? 1 : 0);
	} catch (e) {
		Swal.close();
		err(e);
		l(language[lang]["error_cannot_load_this_model_file_is_it_json_from_asanai_or_a_graph_model"]);
		remove_overlay();
		return null;
	}

	return number_of_layers;
}

async function set_width_and_height_from_first_layer_if_image(keras_layers) {
	try {
		if (!Array.isArray(keras_layers) || keras_layers.length === 0) {
			wrn("keras_layers is not an array or is empty");
			return;
		}

		var first_layer = keras_layers[0];
		if (!first_layer || !first_layer.config || !first_layer.config.batch_input_shape) {
			wrn("First layer or its batch_input_shape is missing");
			return;
		}

		var batch_shape = first_layer.config.batch_input_shape;
		if (!Array.isArray(batch_shape)) {
			wrn("batch_input_shape is not an array");
			return;
		}

		if (batch_shape.length === 4 && batch_shape[batch_shape.length - 1] === 3) {
			var new_height = batch_shape[1];
			var new_width = batch_shape[2];

			if (typeof new_width !== "number" || typeof new_height !== "number") {
				wrn("Width or height is not a number");
				return;
			}

			width = new_width;
			height = new_height;

			await set_width(new_width);
			await set_height(new_height);

			await updated_page(1);
		} else {
			dbg(`First layer is not an image layer with 3 channels, but looks like this: [${batch_shape.join(", ")}]`);
		}
	} catch (_err) {
		err("Error in set_width_and_height_from_first_layer_if_image:", _err);
	}
}

function get_datapoints_for_keras_layer () {
	return [
		"kernel_initializer",
		"bias_initializer",
		"activation",
		"pool_size",
		"padding",
		"strides",
		"filters",
		"kernel_size",
		"dropout_rate",
		"max_features",
		"trainable",
		"use_bias",
		"stddev",
		"rate"
	];
}

function detect_kernel_initializer(original_kernel_initializer_data) {
	assert(typeof(original_kernel_initializer_data) == "object", "Parameter for detect_kernel_initializer(" + original_kernel_initializer_data + ") is not an array, but " + typeof(original_kernel_initializer_data));

	var kernel_initializer_data = original_kernel_initializer_data["config"];

	if ("mode" in kernel_initializer_data) {
		if (kernel_initializer_data["mode"].toLowerCase().includes("avg")) {
			if (kernel_initializer_data["distribution"] == "uniform") {
				return "glorotUniform";
			} else if (kernel_initializer_data["distribution"] == "normal") {
				return "glorotNormal";
			}
		} else if (kernel_initializer_data["mode"].toLowerCase().includes("in")) {
			if (kernel_initializer_data["scale"] == 2) {
				if (kernel_initializer_data["distribution"] == "uniform") {
					return "heUniform";
				} else if (kernel_initializer_data["distribution"] == "normal") {
					return "heNormal";
				}
			} else if (kernel_initializer_data["scale"] == 1) {
				if (kernel_initializer_data["distribution"] == "uniform") {
					return "leCunUniform";
				} else if (kernel_initializer_data["distribution"] == "normal") {
					return "leCunNormal";
				}
			}
		} else {
			log(language[lang]["not_fanavg_nor_fanin"]);
			log(kernel_initializer_data);
		}
	} else {
		//log("No mode");
		//log(kernel_initializer_data);
		if(original_kernel_initializer_data["class_name"] == "Ones") {
			return "ones";
		} else if (original_kernel_initializer_data["class_name"] == "Zeros") {
			return "zeros";
		}

		return original_kernel_initializer_data["class_name"];
	}
}

function handle_set_config_load_input_shape_error(e) {
	if(Object.keys(e).includes("message")) {
		e = e.message;
	}

	remove_overlay();

	if (("" + e).includes("config.keras.config")) {
		err("[set_config] Keras configuration could not be found!");
		return true;
	} else {
		throw new Error(e);
	}
}
