"use strict";

function set_loss_and_metric (loss, metric) {var start_tensors = memory_leak_debugger();
	if(!metric) {
		metric = loss;
		if(metric == "binaryCrossentropy") {
			metric = "categoricalCrossentropy";
		}
	}

	set_loss(loss);
	set_metric(metric);
	memory_leak_debugger("set_loss_and_metric", start_tensors)
}

function reset_labels () {var start_tensors = memory_leak_debugger();
	labels = [];
	memory_leak_debugger("reset_labels", start_tensors)
}

function enable_train () {var start_tensors = memory_leak_debugger();
	$(".train_neural_network_button").prop("disabled", false);
	memory_leak_debugger("enable_train", start_tensors)
}

function disable_train () {var start_tensors = memory_leak_debugger();
	$(".train_neural_network_button").prop("disabled", true);
	memory_leak_debugger("disable_train", start_tensors)
}

function get_key_from_path(array, keypath) { var start_tensors = memory_leak_debugger();
	if (keypath.length == 0) {
		return array;
	}

	var this_key = undefined;
	var tmp = array;

	for (var i = 0; i < keypath.length; i++) {
		this_key = keypath[i];
		tmp = tmp[this_key];
		if(!tmp) {
			memory_leak_debugger("get_key_from_path", start_tensors)
			return null;
		}
	}

	memory_leak_debugger("get_key_from_path", start_tensors)
	return tmp;
}

function get_full_shape_without_batch(file) { var start_tensors = memory_leak_debugger();
	if (file === null) {
		return null;
	}

	var input_shape_line = file.split("\n")[0];
	var shape_match = /^#\s*shape\s*:?\s*\((.*)\)$/.exec(input_shape_line);

	//shape_match[0] = null;

	var res = eval("[" + shape_match[1] + "]");

	res[0] = null;

	memory_leak_debugger("get_full_shape_without_batch", start_tensors);

	return res;
}

function get_shape_from_file(file) { var start_tensors = memory_leak_debugger();
	if (file === null) {
		return null;
	}

	var input_shape_line = file.split("\n")[0];
	var shape_match = /^#\s*shape\s*:?\s*\(\d+,?\s*(.*)\)$/.exec(input_shape_line);

	if (1 in shape_match) {
		memory_leak_debugger("get_shape_from_file", start_tensors);
		return shape_match[1];
	}

	memory_leak_debugger("get_shape_from_file", start_tensors);
	return null;
}

function get_dimensionality_from_layer_name(layer_type) { var start_tensors = memory_leak_debugger();
	var match = layer_type.match(/(\d+)[dD]$/);

	if (match) {
		memory_leak_debugger("get_dimensionality_from_layer_name", start_tensors);
		return match[1];
	}
	memory_leak_debugger("get_dimensionality_from_layer_name", start_tensors);
	return null;
}

function get_full_shape_from_file(file) { var start_tensors = memory_leak_debugger();
	if (file === null) {
		return null;
	}
	var input_shape_line = file.split("\n")[0];
	var shape_match = /^#\s*shape \((.*)\)$/.exec(input_shape_line);
	if (1 in shape_match) {
		memory_leak_debugger("get_full_shape_from_file", start_tensors);
		return shape_match[1];
	}

	memory_leak_debugger("get_full_shape_from_file", start_tensors);
	return null;
}

async function md5 (content) { var start_tensors = memory_leak_debugger();
	var res = await hashwasm.md5(content);

	memory_leak_debugger("md5", start_tensors);

	return res;
}

async function get_current_layer_container_status_hash() { var start_tensors = memory_leak_debugger();
	var html = $("#layers_container").html();

	html = html.replaceAll(' disabled=""', "");

	var res = await md5(html);

	memory_leak_debugger("get_current_layer_container_status_hash", start_tensors);

	return res;
}

async function get_current_status_hash(use_weights=1) { var start_tensors = memory_leak_debugger();
	var html_code = '';

	var allitems = [];
	allitems = Array.prototype.concat.apply(allitems, document.getElementsByTagName('input'));
	allitems = Array.prototype.concat.apply(allitems, document.getElementsByTagName('checkbox'));
	allitems = Array.prototype.concat.apply(allitems, document.getElementsByTagName('select'));
	allitems = Array.prototype.concat.apply(allitems, document.getElementsByTagName('textarea'));

	allitems.forEach(function (x) {
		var item = $(x);
		html_code += ";;;;;;;" + x.id + ";;;;" + x.className + "=" + x.value + ";;;;" + x.checked
	});

	if(use_weights) {
		html_code += await get_weights_as_string();
	}

	var new_status_hash = await md5(html_code);

	last_status_hash = new_status_hash;

	memory_leak_debugger("get_current_status_hash", start_tensors);

	return new_status_hash;
}

/* This function returns the value of an item in a given layer, specified by classname. If the item is a checkbox, it returns whether or not the box is checked. Otherwise, it returns the value of the item. */

function get_item_value(layer, classname) {
	assert(typeof (layer) == "number", "Layer is not an integer, but " + typeof (layer));
	assert(typeof (classname) == "string", "classname '" + classname + "' is not a string, but " + typeof (classname));

	var layer_settings = $(".layer_setting");
	var layer = $(layer_settings[layer]);
	if (typeof(classname) == "string") {
		var found = $(layer.find("." + classname)[0]);
		if (found.attr("type") == "checkbox") {
			return found.is(":checked");
		} else {
			var data = found.val();
			return data;
		}
	} else {
		for (var this_classname in classname) {
			var found = $($layer.find("." + this_classname)[0])
			if (found.attr("type") == "checkbox") {
				return found.is(":checked");
			} else {
				var data = found.val();
				if (data) {
					return data;
				}
			}
		}
		return null;
	}
}

function set_item_value(layer, classname, value) {
	if (classname == "name") {
		return;
	}

	assert(typeof (layer) == "number", "Layer is not an integer, but " + typeof (layer));
	assert(typeof (classname) == "string", "classname '" + classname + "' is not a string, but " + typeof (classname));
	assert(["string", "number", "boolean"].includes(typeof (value)), "value '" + value + "' for " + classname + " is not a string or number, but " + typeof (value));

	var layer_setting = $(".layer_setting")[layer];
	var found_setting = $($(layer_setting).find("." + classname)[0]);
	if (found_setting.length) {
		if (found_setting.attr("type") == "checkbox") {
			found_setting.prop("checked", value == 1 ? true : false).trigger("change");
		} else {
			found_setting.val(value).trigger("change");
		}
	} else {
		if(classname == "rate") {
			set_item_value(layer, "dropout_rate", value)
		} else if(classname != "trainable") {
			log("Unknown classname '" + classname + "' in layer " + layer);
		}
	}
}

function get_tr_str_for_description(desc) {
	assert(typeof (desc) == "string", desc + " is not string but " + typeof (desc));
	return "<tr><td><span class='TRANSLATEME_description'></span>:</td><td><span class='typeset_me'>" + desc + "</span></td></tr>";
}

function isNumeric(str) {
	if (typeof str != "string") return false;
	return !isNaN(str) && !isNaN(parseFloat(str));
}

function quote_python(item) {
	if (item === undefined) {
		return "";
	}

	if (typeof (item) == "object") {
		return JSON.stringify(item);
	} else {
		if (isNumeric(item)) {
			return item;
		} else if (/^\d+(,\d+)*$/.test(item)) {
			return "[" + item + "]";
		} else if (item == "True" || item == "False") {
			return item;
		} else if (item.includes("get_shape")) {
			return item;
		} else if (item.startsWith("[")) {
			return item;
		} else {
			return '"' + item + '"';
		}
	}

	return item;
}

function get_js_name(name) {
	if (name in python_names_to_js_names) {
		return python_names_to_js_names[name];
	}
	return name;
}

function get_python_name(name) {
	if (name in js_names_to_python_names) {
		return js_names_to_python_names[name];
	}
	return name;
}

function get_tr_str_for_layer_table(desc, classname, type, data, nr, tr_class, hidden, expert_mode_only = 0) {
	var str = "<tr";
	if(expert_mode_only) {
		if(tr_class) {
			tr_class = tr_class + " expert_mode_only";
		} else {
			tr_class = "expert_mode_only";
		}
	}
	if (tr_class) {
		str += " class='" + tr_class + "'";
	}
	if (hidden) {
		str += " style='display: none' ";
	}
	str += ">";

	var help = "";

	str += "<td>" + desc + help + ":</td>";
	str += "<td>";
	if (type == "select") {
		var onchange_text = "updated_page(null, null, this);";

		var types_init_or_reg = ["initializer", "regularizer"];

		for (var tk = 0; tk < valid_initializer_types.length; tk++) {
			for (var tir = 0; tir < types_init_or_reg.length; tir++) {
				if (classname == valid_initializer_types[tk] + "_" + types_init_or_reg[tir]) {
					onchange_text = `insert_${types_init_or_reg[tir]}_options(find_layer_number_by_element($(this)), "${valid_initializer_types[tk]}");updated_page(null, null, this)`;
				}
			}
		}

		if (classname == "activation") {
			//onchange_text = "insert_activation_options(find_layer_number_by_element($(this)));updated_page(null, null, this)";
		}

		str += "<select class='input_field input_data " + classname + "' _onchange='" + onchange_text + "'>";
		for (const [key, value] of Object.entries(data)) {
			str += '<option value="' + key + '">' + value + '</option>';
		}
		str += "</select>";
	} else if (type == "text") {
		var placeholder = "";

		if ("placeholder" in data) {
			placeholder = " placeholder='" + data["placeholder"] + "' ";
		}

		var pre_text = "";
		if ("text" in data) {
			var text = data["text"];
			if (typeof (data["text"]) == "function") {
				text = data["text"](nr);
			}

			pre_text = " value='" + text + "' ";
		}

		str += '<input class="input_field input_data ' + classname + '" ' + pre_text + placeholder + ' type="text"  _onchange="updated_page()" onkeyup="updated_page(null, null, this)" />';
	} else if (type == "number") {
		str += "<input class='input_field input_data " + classname + "' type='number' ";

		if ("min" in data) {
			str += " min=" + data["min"] + " ";
		}

		if ("max" in data) {
			str += " max=" + data["max"] + " ";
		}

		if ("step" in data) {
			str += " step=" + data["step"] + " ";
		}

		if ("value" in data) {
			str += " value=" + data["value"] + " ";
		}

		str += " _onchange='updated_page()' onkeyup=\"var original_no_update_math=no_update_math; no_update_math = is_hidden_or_has_hidden_parent('#math_tab_code') ? 1 : 0; is_hidden_or_has_hidden_parent('#math_tab_code'); updated_page(null, null, this); no_update_math=original_no_update_math;\" />";
			var original_no_update_math = no_update_math;
	} else if (type == "checkbox") {
		str += "<input type='checkbox' class='input_data " + classname + "' _onchange='updated_page(null, null, this);' ";
		if ("status" in data && data["status"] == "checked") {
			str += " checked='CHECKED' ";
		}
		str += " />";

	} else {
		alert("Invalid table type: " + type);
	}
	str += "</td>";

	return str;
}

function add_cell_option() {
	return "";
}

function add_number_lstm_cells_option(type, nr) { var start_tensors = memory_leak_debugger();
	var res = get_tr_str_for_layer_table("LSTM Cells", "number_lstm_cells", "number", { "min": 0, "step": 1, "value": 1 }, nr);

	memory_leak_debugger("add_number_lstm_cells_option", start_tensors)

	return res;
}

function add_seed_option (type, nr) { var start_tensors = memory_leak_debugger();
	var style = "";

	var current_input_shape = get_input_shape();
	if (current_input_shape.length != 3) {
		style = ' style="display: none" '
	}

	var res = "<tr class='visualize_button' " + style + "><td>Seed</td><td><input type='text' name='seed' class='seed dropout_seed' value='1' /></td></tr>";

	memory_leak_debugger("add_seed_option", start_tensors);

	return res;
}

function add_visualize_option(type, nr) { var start_tensors = memory_leak_debugger();
	var style = "";

	var current_input_shape = get_input_shape();
	if (current_input_shape.length != 3) {
		style = ' style="display: none" '
	}

	var res = "<tr class='visualize_button' " + style + "><td>Visualize this layer?</td><td><button class='visualize_layer_button' onclick='draw_maximally_activated_layer(find_layer_number_by_element(this), \"" + type + "\")'>Visualize layer</button></td></tr>";

	memory_leak_debugger("add_visualize_option", start_tensors);


	return res;
}

function add_pool_size_option(type, nr) { var start_tensors = memory_leak_debugger();
	var str = "";

	var dimensionality = get_dimensionality_from_layer_name(type);

	var letter_code = 'x'.charCodeAt();
	for (var i = 0; i < dimensionality; i++) {
		var letter = String.fromCharCode(letter_code);
		str += get_tr_str_for_layer_table("Pool-Size " + letter, "pool_size_" + letter, "number", { "min": 1, "max": 4096, "step": 1, "value": get_default_option(type, "pool_size")[i] }, nr);
		letter_code++;
	}

	memory_leak_debugger("add_pool_size_option", start_tensors);

	return str;
}

function add_kernel_size_option(type, nr) { var start_tensors = memory_leak_debugger();
	var str = "";
	var dimensionality = get_dimensionality_from_layer_name(type);

	var letter_code = 'x'.charCodeAt();
	for (var i = 0; i < dimensionality; i++) {
		var letter = String.fromCharCode(letter_code);
		str += get_tr_str_for_layer_table("Kernel-Size " + letter, "kernel_size_" + letter, "number", { "min": 1, "max": 4096, "step": 1, "value": get_default_option(type, "kernel_size")[i] }, nr);
		letter_code++;
	}

	memory_leak_debugger("add_kernel_size_option", start_tensors);

	return str;
}

function add_strides_option(type, nr) { var start_tensors = memory_leak_debugger();
	var str = "";
	var dimensionality = get_dimensionality_from_layer_name(type);

	var letter_code = 'x'.charCodeAt();
	for (var i = 0; i < dimensionality; i++) {
		var letter = String.fromCharCode(letter_code);
		str += get_tr_str_for_layer_table("Strides " + letter, "strides_" + letter, "number", { "min": 1, "max": 4096, "step": 1, "value": get_default_option(type, "strides")[i] }, nr);
		letter_code++;
	}

	memory_leak_debugger("add_strides_option", start_tensors);

	return str;
}

/* activation gui functions end */

function insert_activation_option_trs(layer_nr, option_type) { var start_tensors = memory_leak_debugger();
	assert(["alpha", "max_value", "axis", "theta", "alpha_initializer", "alpha_regularizer", "alpha_constraint", "shared_axes"].includes(option_type), "invalid option type " + option_type);
	assert(typeof (layer_nr) == "number", "Layer number's type must be number, is: " + typeof (layer_nr));

	if (option_type != "none") {
		var eval_string = `$(add_activation_${option_type}_option($($(".layer_type")[${layer_nr}]).val(), ${layer_nr})).insertAfter($($(".activation")[${layer_nr}]).parent().parent());`;

		eval(eval_string);
	} else {
		log("option_type is '" + option_type + "'");
	}
	memory_leak_debugger("insert_activation_option_trs", start_tensors);
}

function insert_regularizer_option_trs(layer_nr, regularizer_type, option_type) { var start_tensors = memory_leak_debugger();
	assert(valid_initializer_types.includes(regularizer_type), "insert_regularizer_option_trs(layer_nr, " + regularizer_type + ") is not a valid regularizer_type (2nd option)");
	assert(["l1", "l1l2", "l2", "none"].includes(option_type), "invalid option type " + option_type);
	assert(typeof (layer_nr) == "number", "Layer number's type must be number, is: " + typeof (layer_nr));

	if (option_type != "none") {
		var eval_string = `$(add_${regularizer_type}_regularizer_${option_type}_option($($(".layer_type")[${layer_nr}]).val(), ${layer_nr})).insertAfter($($(".layer_setting")[${layer_nr}]).find(".${regularizer_type}_regularizer").parent().parent())`;

		eval(eval_string);
	} else {
		log("option_type is '" + option_type + "'");
	}
	memory_leak_debugger("insert_regularizer_option_trs", start_tensors);
}

function insert_initializer_option_trs(layer_nr, initializer_type, option_type) { var start_tensors = memory_leak_debugger();
	assert(valid_initializer_types.includes(initializer_type), "insert_initializer_option_trs(layer_nr, " + initializer_type + ") is not a valid initializer_type (2nd option)");
	assert(["seed", "mean", "stddev", "value", "mode", "distribution", "minval", "maxval", "scale"].includes(option_type), "invalid option type " + option_type);
	assert(typeof (layer_nr) == "number", "Layer number's type must be number, is: " + typeof (layer_nr));

	var eval_string = `$(add_${initializer_type}_initializer_${option_type}_option($($(".layer_type")[${layer_nr}]).val(), ${layer_nr})).insertAfter($($(".layer_setting")[${layer_nr}]).find(".${initializer_type}_initializer").parent().parent())`;

	eval(eval_string);

	memory_leak_debugger("insert_initializer_option_trs", start_tensors);
}

async function insert_activation_options(layer_nr) { var start_tensors = memory_leak_debugger();
	// TODO NOT YET USED
	assert(typeof (layer_nr) == "number", "layer_nr must be of the type of number but is: " + typeof (layer_nr));
	assert(layer_nr >= 0 && layer_nr <= get_number_of_layers(), "Invalid layer number");

	$($(".layer_options_internal")[layer_nr]).find(".activation_tr").remove()

	var activation_item = $($(".layer_options_internal")[layer_nr]).find(".activation");

	if (activation_item.length) {
		var activation_name = activation_item.val();
		if (activation_name == "linear") {
			return;
		}

		if (Object.keys(activation_options).includes(activation_name)) {
			var options = activation_options[activation_name]["options"];

			for (var i = 0; i < options.length; i++) {
				insert_activation_option_trs(layer_nr, options[i]);
			}
		}
	} else {
		log("Layer " + layer_nr + " does not seem to have a activation setting");
	}

	await updated_page();

	memory_leak_debugger("insert_activation_option", start_tensors);
}

function set_last_layer_activation_function (activation_function) { var start_tensors = memory_leak_debugger();
	assert(Object.keys(activations).includes(activation_function), "activation function " + activation_function + " is invalid. Must be one of these: " + Object.keys(activations).join(", "));

	var last_layer_nr = $(".layer_type").length - 1;
	var activation_item = $($(".layer_options_internal")[last_layer_nr]).find(".activation");
	if(activation_item.val() != activation_function) {
		activation_item.val(activation_function).trigger("change");
	}
	memory_leak_debugger("set_last_layer_activation_function", start_tensors);
}

async function insert_regularizer_options(layer_nr, regularizer_type) { var start_tensors = memory_leak_debugger();
	assert(valid_initializer_types.includes(regularizer_type), "insert_regularizer_trs(layer_nr, " + regularizer_type + ") is not a valid regularizer_type (2nd option)");
	assert(typeof (layer_nr) == "number", "layer_nr must be of the type of number but is: " + typeof (layer_nr));
	assert(layer_nr >= 0 && layer_nr <= get_number_of_layers(), "Invalid layer number");

	$($(".layer_options_internal")[layer_nr]).find("." + regularizer_type + "_regularizer_tr").remove()

	var regularizer = $($(".layer_options_internal")[layer_nr]).find("." + regularizer_type + "_regularizer");

	if (regularizer.length) {
		var regularizer_name = regularizer.val();

		var options = regularizer_options[regularizer_name]["options"];

		for (var i = 0; i < options.length; i++) {
			insert_regularizer_option_trs(layer_nr, regularizer_type, options[i]);
		}
	} else {
		log("Layer " + layer_nr + " does not seem to have a " + regularizer_type + " regularizer setting");
	}
	await updated_page();
	memory_leak_debugger("insert_regularizer_options", start_tensors);
}

async function insert_initializer_options(layer_nr, initializer_type) {
	assert(valid_initializer_types.includes(initializer_type), "insert_initializer_trs(layer_nr, " + initializer_type + ") is not a valid initializer_type (2nd option)");
	assert(typeof (layer_nr) == "number", "layer_nr must be of the type of number but is: " + typeof (layer_nr));
	assert(layer_nr >= 0 && layer_nr <= get_number_of_layers(), "Invalid layer number");

	$($(".layer_options_internal")[layer_nr]).find("." + initializer_type + "_initializer_tr").remove()

	var initializer = $($(".layer_options_internal")[layer_nr]).find("." + initializer_type + "_initializer");

	if (initializer.length) {
		var initializer_name = initializer.val();

		if(initializer_name) {
			var options = initializer_options[initializer_name]["options"];

			for (var i = 0; i < options.length; i++) {
				insert_initializer_option_trs(layer_nr, initializer_type, options[i]);
			}
		} else {
			log("ERROR: Initializer is empty!");
			log("initializer:", initializer);
			log("initializer_name:", initializer_name);
		}
	} else {
		log("Layer " + layer_nr + " does not seem to have a " + initializer_type + " initializer setting");
	}

	await updated_page();
}

async function get_number_of_training_items() {
	let training_data = await _get_training_data();
	var keys = Object.keys(training_data);
	var number = 0;
	for (var key in keys) {
		number += Object.entries(training_data)[key][1].length;
	}
	return number;
}

async function get_json(url) {
	var data = await $.getJSON(url);
	return data;
}

async function get_cached_json(url) {
	if (Object.keys(_cached_json).includes(url)) {
		return _cached_json[url];
	}
	var data = await $.getJSON(url);
	_cached_json[url] = data;
	return data;
}

/* This function gets the configuration for the index passed in. If no index is passed in, it gets the configuration for the currently selected dataset. */

async function _get_configuration(index) { var start_tensors = memory_leak_debugger();
	assert(["string", "undefined"].includes(typeof (index)), "Index must be either string or undefined, but is " + typeof (index) + " (" + index + ")");

	var data = undefined;

	if (index) {
		if (Object.keys(status_saves).includes(index)) {
			data = {};
			data["model_structure"] = status_saves[index]["model_structure"];
			data["weights"] = status_saves[index]["weights"];
		} else {
			log("Index " + index + " could not be found");
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
				data["keras"] = await get_cached_json(keras_url);
			} else {
				data["keras"] = JSON.parse(uploaded_model);
				uploaded_model = "";
			}
		} catch (e) {
			log(e);
			memory_leak_debugger("_get_configuration", start_tensors);
			return null;
		}
	}

	memory_leak_debugger("_get_configuration", start_tensors);
	return data;
}

function copy_to_clipboard(text) {
	var dummy = document.createElement("textarea");
	document.body.appendChild(dummy);
	dummy.value = text;
	dummy.select();
	document.execCommand("copy");
	document.body.removeChild(dummy);
}

function copy_id_to_clipboard(idname) {
	var serialized = $("#" + idname).text();
	copy_to_clipboard(serialized);
}

function enable_disable_grad_cam() {
	if ($("#show_grad_cam").is(":checked")) {
		$("#grad_cam_heatmap").show();
	} else {
		$("#grad_cam_heatmap").hide();
	}

	if($("#show_layer_data").is(":checked")) {
		l("You can either use grad CAM or the internal layer states, but not both. Disabling internal layer states.");
		$("#show_layer_data").prop("checked", false).trigger("change");
	}

	hide_empty_tabs("visualization_ribbon");
}

function enable_disable_kernel_images() {
	if ($("#show_layer_data").is(":checked")) {
		$("#show_kernel_images").prop("disabled", false);
		$("#data_plotter").show();
		$("#layer_visualizations_tab").show();
	} else {
		$("#show_kernel_images").prop("disabled", true);
		$("#data_plotter").hide();
		$("#layer_visualizations_tab").hide();
	}

	if($("#show_grad_cam").is(":checked")) {
		l("You can either use grad CAM or the internal layer states, but not both. GradCAM.");
		$("#show_grad_cam").prop("checked", false).trigger("change");
	}

	$("#grad_cam_heatmap").hide();

	hide_empty_tabs("visualization_ribbon");
}

function change_kernel_pixel_size() {
	kernel_pixel_size = parseInt($("#kernel_pixel_size").val());
}

function change_pixel_size() {
	pixel_size = parseInt($("#pixel_size").val());
}

async function change_height() {
	await change_width_or_height("height", 0);
}

async function change_width() {
	await change_width_or_height("width", 1);
}

function change_output_and_example_image_size() {
	if($("#width").val() == "" || $("#height").val() == "") {
		return;
	}

	$("#output").width($("#width").val())
	$("#output").height($("#height").val())
	//$(".example_images").width($("#width").val())
	//$(".example_images").height($("#height").val())
}

async function change_width_or_height(name, inputshape_index) {
	if (["width", "height"].includes(name)) {
		var value = parseInt($("#" + name).val());
		if(value && value != eval(name)) {
			var t_start = Date.now();
			l("Changing " + name + "...");
			if(show_swal_when_changing_size) {
				Swal.fire({
					title: "Loading new " + name,
					allowEscapeKey: false,
					allowOutsideClick: false,
					showConfirmButton: false
				});
			}

			var inputShape = get_input_shape();
			inputShape[inputshape_index] = value;
			await set_input_shape("[" + inputShape.join(", ") + "]");
			eval(name + " = " + value);
			layer_structure_cache = null;
			[model, global_model_data] = await create_model();
			is_setting_config = false;
			await updated_page();
			change_output_and_example_image_size();

			await restart_webcams();

			if(show_swal_when_changing_size) {
				Swal.close()
			}

			var t_end = Date.now();

			var used_time = ((t_end - t_start) / 1000).toFixed(5);

			model_is_trained = false;
			l("Done changing " + name + ", took " + used_time + "seconds.");
		}
	} else {
		console.error("Invalid name in change_width_or_height: " + name + ", must be either 'width' or 'height'");
	}


}

async function update_python_code(dont_reget_labels) {
	var redo_graph = 0;

	var input_shape = [height, width, number_channels];

	var loss = document.getElementById("loss").value;
	var optimizer_type = document.getElementById("optimizer").value;
	var metric_type = document.getElementById("metric").value;
	var batchSize = document.getElementById("batchSize").value;
	var data_origin = document.getElementById("data_origin").value;

	var python_code = "";

	var epochs = parseInt(document.getElementById("epochs").value);

	$("#pythoncontainer").show();

	python_code += "# This generated code is licensed under WTFPL. You can do whatever you want with it, without any restrictions.\n";
	python_code += "# python3 -m venv asanaienv\n";
	python_code += "# source asanaienv/bin/activate\n";
	python_code += "# pip3 install tensorflow tensorflowjs protobuf==3.20.0 ";

	var input_shape_is_image_val = await input_shape_is_image();

	if (input_shape_is_image_val) {
		python_code += " scikit-image opencv-python ";
	}
	python_code += "\n";
	python_code += "import os\n";
	python_code += "if not os.path.exists('keras_model'):\n";
	python_code += "    os.system('tensorflowjs_converter --input_format=tfjs_layers_model --output_format=keras_saved_model model.json keras_model')\n";
	python_code += "# Save this file as python-script and run it like this:\n";
	if (input_shape_is_image_val) {
		python_code += "# python3 nn.py file_1.jpg file_2.jpg file_3.jpg\n";
	} else {
		python_code += "# python3 nn.py\n";
	}
	python_code += "import keras\n";
	python_code += "import tensorflow as tf\n";

	python_code += "model = tf.keras.models.load_model(\n";
	python_code += "   'keras_model',\n";
	python_code += "   custom_objects=None,\n";
	python_code += "   compile=True\n";
	python_code += ")\n\n";
	python_code += "model.summary()\n"

	var x_shape = "";

	if (!dont_reget_labels) {
		await get_label_data();
	}

	if (input_shape_is_image_val) {
		python_code += "from tensorflow.keras.preprocessing.image import ImageDataGenerator\n";
		python_code += "from PIL import Image\n";
		python_code += "import numpy as np\n";
		python_code += "from skimage import transform\n";
		python_code += "import sys\n";

		python_code += "labels = ['" + labels.join("', '") + "']\n";
		python_code += "height = " + height + "\n";
		python_code += "width = " + width + "\n";
		python_code += "divideby = " + $("#divide_by").val() + "\n";

		python_code += "def load(filename):\n";
		python_code += "    np_image = Image.open(filename)\n";
		python_code += "    np_image = np.array(np_image).astype('float32')/divideby\n";
		python_code += "    np_image = transform.resize(np_image, (height, width, 3))\n";
		python_code += "    np_image = np.expand_dims(np_image, axis=0)\n";
		python_code += "    return np_image\n";

		python_code += "def load_frame(filename):\n";
		python_code += "    np_image = cv2.cvtColor(filename, cv2.COLOR_BGR2RGB)\n";
		python_code += "    np_image = np.array(np_image).astype('float32')/divideby\n";
		python_code += "    np_image = transform.resize(np_image, (height, width, 3))\n";
		python_code += "    np_image = np.expand_dims(np_image, axis=0)\n";
		python_code += "    return np_image\n";

		python_code += "for a in range(1, len(sys.argv)):\n";
		python_code += "    image = load(sys.argv[a])\n";
		python_code += "    print(sys.argv[a] + ':')\n";
		python_code += "    prediction = model.predict(image)\n";
		python_code += "    for i in range(0, len(prediction)):\n";
		python_code += "        for j in range(0, len(prediction[i])):\n";
		python_code += "            print(labels[j] + ': ' + str(prediction[i][j]))\n";



		x_shape = "[height, width, 3]";
	} else {
		python_code += "import re\n";
		python_code += "from pprint import pprint\n";
		python_code += "import numpy as np\n";
		python_code += "def get_shape (filename):\n";
		python_code += "    with open(filename) as f:\n";
		python_code += "        first_line = f.readline()\n";
		python_code += "        match = re.search(r'shape: \\((.*)\\)', first_line)\n";
		python_code += "        return eval('[' + match[1] + ']')\n";
		python_code += "x = np.loadtxt('x.txt').reshape(get_shape('x.txt'))\n";
		python_code += "pprint(model.predict(x))\n";
	}

	//python_code += "model = keras.models.Sequential()\n";

	var layer_types = $(".layer_type");
	var layer_settings = $(".layer_setting");

	for (var i = 0; i < get_number_of_layers(); i++) {
		var type = $(layer_types[i]).val();

		var data = {};

		if (i == 0) {
			if (input_shape_is_image_val) {
				data["input_shape"] = x_shape;
			} else {
				data["input_shape"] = "get_shape('x.txt')";
			}
		}

		if (type in layer_options) {
			for (var j = 0; j < layer_options[type]["options"].length; j++) {
				var option_name = layer_options[type]["options"][j];
				if (option_name == "pool_size") {
					data[get_python_name(option_name)] = [parseInt(get_item_value(i, "pool_size_x")), parseInt(get_item_value(i, "pool_size_y"))];
				} else if (option_name == "strides") {
					data[get_python_name(option_name)] = [parseInt(get_item_value(i, "strides_x")), parseInt(get_item_value(i, "strides_y"))];
				} else if (option_name == "kernel_size") {
					data[get_python_name(option_name)] = [parseInt(get_item_value(i, "kernel_size_x")), parseInt(get_item_value(i, "kernel_size_y"))];
				} else if (option_name == "size") {
					data[get_python_name(option_name)] = eval("[" + get_item_value(i, "size") + "]");
				} else if (option_name == "dilation_rate") {
					data[get_python_name(option_name)] = eval("[" + get_item_value(i, "dilation_rate") + "]");
				} else if (option_name == "target_shape") {
					data[get_python_name(option_name)] = eval("[" + get_item_value(i, "target_shape") + "]");
				} else if (option_name == "activation") {
					data[get_python_name(option_name)] = get_python_name(get_item_value(i, option_name));
				} else {
					data[get_python_name(option_name)] = get_item_value(i, option_name);
				}
			}

			//python_code += "model.add(" + get_python_name(type) + "(";

			redo_graph++;
		}


		["bias", "kernel", "activity"].forEach((type) => {
			["regularizer"].forEach((func) => {
				var item_name = type + "_" + func;
				if (Object.keys(data).includes(item_name)) {
					if (data[item_name] == "none") {
						delete data[item_name];
					}
				}
			});
		});

		var params = [];
		for (const [key, value] of Object.entries(data)) {
			if (key == "dtype" && i == 0 || key != "dtype") {
				if (typeof (value) != "undefined") {
					params.push(get_python_name(key) + "=" + quote_python(get_python_name(value)));
				}
			}
		}
	}

	if(input_shape_is_image_val) {
		python_code += `
if len(sys.argv) == 1:
    import cv2

    cap = cv2.VideoCapture(0)

    while True:
        # Capture frame-by-frame
        ret, frame = cap.read()

        if not ret:
            import sys
            print("Could not load frame from webcam. Is the webcam currently in use?")
            sys.exit(1)

        # Preprocess the frame
        image = load_frame(frame)

        # Make predictions
        predictions = model.predict(image)

        highest_index = np.argmax(predictions[0])

        # Get the class with highest probability

        # Add label to the frame
        for i in range(0, len(labels)):
            prediction = labels[i]
            text = str(prediction) + " (" + str(predictions[0][i]) + ")"
            x = 10
            y = (i + 1) * 30
            color = (255, 0, 0)
            if i == highest_index:
                color = (0, 255, 0)
            cv2.putText(frame, text, (x, y), cv2.FONT_HERSHEY_SIMPLEX, 1, color, 2)

        # Display the resulting frame
        cv2.imshow('frame', frame)
        if cv2.waitKey(1) & 0xFF == ord('q'):
            break

    # When everything done, release the capture
    cap.release()
    cv2.destroyAllWindows()
`;
	}

	document.getElementById("python").innerHTML = python_code;
	document.getElementById("python").style.display = "block";
	await highlight_code();

	return redo_graph;
}

async function hide_no_conv_stuff() {
	var any_conv_visualizations = 0;

	var keys = Object.keys(conv_visualizations);

	for (var i = 0; i < keys.length; i++) {
		if (conv_visualizations[keys[i]]) {
			any_conv_visualizations++;
		}
	}

	if (any_conv_visualizations) {
		$(".hide_when_no_conv_visualizations").show();
		$(".hide_when_conv_visualizations").hide();
	} else {
		$(".hide_when_no_conv_visualizations").hide();
		$(".hide_when_conv_visualizations").show();
		$("#data_plotter").hide();
	}

	if(is_cosmo_mode) {
		$(".hide_in_cosmo_mode").hide();
	} else {
		$(".hide_in_cosmo_mode").show();
	}

	if(await input_shape_is_image()) {
		$(".hide_when_no_image").show();
		$(".hide_when_image").hide();
	} else {
		$('a[href*="tf_ribbon_augmentation"]').hide().parent().hide();
		$("#auto_augment").prop("checked", false);
		$(".hide_when_no_image").hide();
		$(".hide_when_image").show();
	}

	if (conv_visualizations["alexnet"]) {
		$(".hide_when_no_alexnet").show();
	} else {
		$(".hide_when_no_alexnet").hide();
	}

	hide_empty_tabs("visualization_ribbon");
}

async function get_shape_from_array(a) {
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

function stop_webcam() {
	$("#show_webcam_button").html("<span class='show_webcam_button large_button'>&#128247;</span>");
	if (cam) {
		cam.stop();
	}
	$("#webcam").hide();
	$("#webcam_prediction").hide();
	cam = undefined;
}

function _has_any_warning () {
	if($("#width").val() == "" || $("#height").val() == "") {
		//console.warn("Width or height is empty string, returning from updated_page");
		return true;
	}

	if (disable_show_python_and_create_model) {
		//console.info("disable_show_python_and_create_model, returning from updated_page");
		return true;
	}

	if (is_setting_config) {
		//console.info("Currently running is_setting_config, returning from updated_page");
		return true;
	}

	if(has_missing_values) {
		l("Not creating model because some values are missing (updated page)");
		return true;
	}

	return false;
}

async function updated_page(no_graph_restart, disable_auto_enable_valid_layer_types, item, no_prediction) { var start_tensors = memory_leak_debugger();
	var updated_page_uuid = uuidv4();

	if(number_of_currently_running_updated_pages > 1) {
		if(finished_loading) {
			console.info("Only using first updated_page.");
		}
		number_of_currently_running_updated_pages--;
		memory_leak_debugger("updated_page (A)", start_tensors);
		return;
	}


	while (number_of_currently_running_updated_pages > 1) {
		await delay(200);
		log_once(`Currently in queue for updated_page: ${number_of_currently_running_updated_pages} ${updated_page_uuid}`);
	}

	number_of_currently_running_updated_pages++;

	var fref = async (no_graph_restart, disable_auto_enable_valid_layer_types, no_prediction) => {
		if(_has_any_warning()) {
			return false;
		}

		rename_tmp_onchange();

		var number_of_layers = get_number_of_layers();
		show_or_hide_bias_initializer(number_of_layers);

		try {
			await compile_model();
		} catch (e) {
			log(e);
			log("There was an error compiling the model: " + e);
		};


		var redo_graph = await update_python_code();

		if (model && redo_graph && !no_graph_restart) {
			await restart_fcnn(1);
			await restart_lenet(1);
			await restart_alexnet(1);
		}

		prev_layer_data = [];

		await identify_layers(number_of_layers);

		layer_structure_cache = null;

		await save_current_status();

		show_dtype_only_first_layer();

		enable_start_training_custom_tensors();

		var wait_for_latex_model = Promise.resolve(1);

		if (!no_update_math) {
			wait_for_latex_model = await write_model_to_latex_to_page();
		}

		await last_shape_layer_warning();

		await hide_no_conv_stuff();

		var current_input_shape = get_input_shape();
		if (current_input_shape.length != 3) {
			$(".visualize_button").hide();
			if (cam) {
				stop_webcam();
			}
		} else {
			$(".visualize_button").show();
		}

		try {
			await write_descriptions();
		} catch (e) {
			console.warn(e);
		}

		//var wait_for_show_hide_load_weights = await show_or_hide_load_weights()

		allow_training();

		if (!no_prediction) {
			await show_prediction(1, 1);
		}

		await typeset();

		await wait_for_latex_model;
		//await wait_for_show_hide_load_weights;
		if(atrament_data.sketcher && await input_shape_is_image()) {
			await predict_handdrawn();
		}

		if(mode == "beginner") {
			$(".expert_mode_only").hide();
		} else {
			$(".expert_mode_only").show();
		}


		allow_editable_labels();

		disable_everything_in_last_layer_enable_everyone_else_in_beginner_mode();

		return 1;
	};
	
	var ret = await fref(no_graph_restart, disable_auto_enable_valid_layer_types, no_prediction);

	if(!ret) {
		if(finished_loading) {
			console.warn("updated_page failed");
		}
	}


	number_of_currently_running_updated_pages--;
	memory_leak_debugger("updated_page", start_tensors);
}

async function typeset() { var start_tensors = memory_leak_debugger();
	var math_elements = $(".typeset_me");

	for (var i = 0; i < math_elements.length; i++) {
		var xpath = get_element_xpath(math_elements[i]);
		var new_md5 = await md5($(math_elements[i]).html());
		var old_md5 = math_items_hashes[xpath];

		var retypeset = 0;
		if(new_md5 != old_md5) {
			retypeset = 1;
		}

		if($(math_elements[i]).attr("id") == "math_tab_code") {
			if(is_hidden_or_has_hidden_parent($("#math_tab_code")[0])) {
				retypeset = 0;
			}
		}

		if(retypeset) {
			MathJax.typeset([math_elements[i]]);
			math_items_hashes[xpath] = new_md5;
		}
	}
	memory_leak_debugger("typeset", start_tensors);
}

async function change_optimizer() { var start_tensors = memory_leak_debugger();
	var type = $("#optimizer").val();
	$(".optimizer_metadata").hide();

	$("#" + type + "_metadata").show();

	await updated_page();
	memory_leak_debugger("change_optimizer", start_tensors)
}

function set_momentum(val) {
	$("#momentum_" + $("#optimizer").val()).val(val);
}

function set_validationSplit(val) {
	assert(typeof(val) == "number", val + " is not an number but " + typeof(number));
	l("Set validationSplit to " + val);
	$("#validationSplit").val(val);
}

function set_epsilon(val) {
	$("#epsilon_" + $("#optimizer").val()).val(val);
}

function set_decay(val) {
	$("#decay_" + $("#optimizer").val()).val(val);
}

function set_rho(val) {
	$("#rho_" + $("#optimizer").val()).val(val);
}

function set_learningRate(val) {
	$("#learningRate_" + $("#optimizer").val()).val(val);
}

function byteToMB(varbyte) {
	var mb = Math.round((varbyte / (1024 * 1024)) * 100) / 100;
	return varbyte + " (" + mb + "MB)";
}

function write_model_summary_wait () {
	document.getElementById('summary').innerHTML = "<center><img width=32 height=32 src='loading_favicon.gif' /></center>";
	write_model_summary();
}

function write_model_summary() {
	if(is_hidden_or_has_hidden_parent($("#summary_tab"))) {
		return;
	}

	$("#summarycontainer").show();
	assert(typeof(model) == "object", "model is not an object");
	var logBackup = console.log;
	var logMessages = [];

	console.log = function () {
		logMessages.push.apply(logMessages, arguments);
	};

	model.summary(200);

	document.getElementById('summary').innerHTML = summary_to_table(logMessages);

	console.log = logBackup;
}

function reset_summary() {
	$("#summarycontainer").hide();
	$("#summary").html("");
}


function set_optimizer(val) {
	assert(typeof (val) == "string", val + " is not an string but " + typeof (val));
	l("Setting optimizer to " + val);
	$("#optimizer").val(val).trigger("change");
}

function set_metric(val) {
	l("Setting metric to " + val);

	if(Object.keys(metric_shortnames).includes(val)) {
		val = metric_shortnames[val];
	}

	assert(metrics.includes(val), metric + " is not a valid metric. It must be in " + metrics.join(", "));
	assert(typeof (val) == "string", val + " is not an string but " + typeof (val));

	if($("#metric").val() != val) {
		$("#metric").val(val).trigger("change");
	}
}

function set_loss(val) {
	l("Setting loss to " + val);
	assert(losses.includes(val), loss + " is not a valid loss. It must be in " + losses.join(", "));
	assert(typeof (val) == "string", val + " is not an string but " + typeof (val));

	if($("#metric").val() != val) {
		$("#loss").val(val).trigger("change");
	}
}

function get_epochs() {
	return parseInt($("#epochs").val());
}

function get_batchSize() {
	return parseInt($("#batchSize").val());
}

function set_batchSize(val) {
	assert(typeof (val) == "number", val + " is not an integer but " + typeof (val));
	l("Set batchsize to " + val);
	$("#batchSize").val(val);
}

function set_epochs(val) {
	assert(typeof (val) == "number", val + " is not an integer but " + typeof (val));
	l("Setting epochs to " + val);
	document.getElementById("epochs").value = val;
}

function set_number_of_layers(val) {
	assert(typeof (val) == "number", val + " is not an integer but " + typeof (val));
	document.getElementById("number_of_layers").value = val;
	return val;
}

function get_number_of_layers() {
	return parseInt(document.getElementById("number_of_layers").value);
}

function init_epochs(val) {
	assert(typeof (val) == "number", "init_epochs(" + val + ") is not an integer but " + typeof (val));
	l("Initializing epochs to " + val);
	set_epochs(val);
}

async function init_number_of_layers(val) {
	assert(typeof (val) == "number", "init_number_of_layers(" + val + ") is not an integer but " + typeof (val));

	await set_number_of_layers(val);

	await show_layers(val);

	number_of_initialized_layers = val;
	//updated_page();
}

function get_option_for_layer_by_type(nr) {
	assert(typeof (nr) == "number", "get_option_for_layer_by_type(" + nr + ") is not a number, but " + typeof (nr));

	var layer_type = $($(".layer_type")[nr]);

	var type = layer_type.val();

	if (!type) {
		layer_type.children().children().each(function () {
			if ($(this).val() == 'dense') {
				$(this).prop("selected", true);
			}
		});
		type = layer_type.val();
		console.log("Cannot determine type of layer " + nr);
		return;
	}

	var str = "";

	var kernel_initializer_string = get_tr_str_for_layer_table("<span class='TRANSLATEME_kernel_initializer'></span>", "kernel_initializer", "select", initializers, nr);
	var bias_initializer_string = get_tr_str_for_layer_table("<span class='TRANSLATEME_bias_initializer'></span", "bias_initializer", "select", initializers, nr);
	var activation_string = get_tr_str_for_layer_table("<span class='TRANSLATEME_activation_function'></span>", "activation", "select", activations, nr);

	for (var [key, value] of Object.entries(layer_options)) {
		if (key == type) {
			if (value["description"]) {
				str += get_tr_str_for_description(value["description"]);
			} else {
				alert("No description given for " + key);
			}

			if (value["options"]) {
				var options = value["options"];
				for (var j = 0; j < options.length; j++) {
					var item = options[j];
					if (item == "activation") {
						str += activation_string;
					} else if (item == "kernel_initializer") {
						str += kernel_initializer_string;
					} else if (item == "bias_initializer") {
						str += bias_initializer_string;
					} else {
						eval("str += add_" + item + "_option(type, nr);");
					}
				}
			} else {
				alert("No options given for " + key);
			}
		}
	}

	return str;
}

async function initializer_layer_options(thisitem) {
	if ($(thisitem).hasClass("swal2-select") || $(thisitem).attr("id") == "model_dataset") {
		return;
	}

	//assert(typeof(thisitem) == "object", "initializer_layer_options(" + thisitem + ") is not an object but " + typeof(thisitem));

	layer_structure_cache = null;

	var nr = thisitem;
	if (typeof (nr) != "number") {
		nr = find_layer_number_by_element(thisitem);
	}

	assert(typeof (nr) == "number", "found nr is not an integer but " + typeof (nr));

	await set_option_for_layer_by_layer_nr(nr);

	var chosen_option = $($(".layer_setting")[nr]).find(".layer_type").val()
	$($(".layer_setting")[nr]).find("option").each(function (i, x) {
		if (chosen_option == $(x).val()) {
			$(x).attr('selected', 'selected');
		} else {
			$(x).removeAttr('selected');
		}
	})

	await updated_page(null, 1);
}

async function set_option_for_layer_by_layer_nr(nr) {
	assert(typeof(nr) == "number", "initializer_layer_options_by_layer_nr(" + nr + ") is not a number but " + typeof(nr));

	var layer = $(".layer_options_internal")[nr];
	layer.innerHTML = get_option_for_layer_by_type(nr);

	var valid_subtypes = ["initializer", "regularizer"];
	for (var i = 0; i < valid_initializer_types.length; i++) {
		var kn = valid_initializer_types[i];

		for (var vs = 0; vs < valid_subtypes.length; vs++) {
			var t = valid_subtypes[vs];
			var name = kn + "_" + t;
			$(layer).find("." + name).trigger("change");
		}
	}

	await write_descriptions();
}

async function toggle_options(item) {
	assert(typeof (item) == "object", "toggle_options(" + item + ") is not an object but " + typeof (item));

	$(item).parent().parent().parent().next().toggle();
	await write_descriptions(1);
}

async function disable_invalid_layers_event(e, thisitem) {
	assert(typeof (e) == "object", "disable_all_invalid_layers(e -> " + e + " is not an object but " + typeof (e));
	assert(typeof (thisitem) == "object", "disable_all_invalid_layers(e, thisitem -> " + thisitem + " is not an [object HTMLSelectElement] but " + typeof (thisitem));

	e.preventDefault();
	var layer_nr = null;

	layer_nr = find_layer_number_by_element(thisitem);

	await enable_valid_layer_types(layer_nr);

	//hide_empty_groups(layer_nr);
}

async function disable_all_invalid_layers() {
	document.body.style.pointerEvents = "none";
	await disable_all_invalid_layers_from(0);
	document.body.style.pointerEvents = "";
}

async function disable_all_invalid_layers_from(start) {
	assert(typeof (start) == "number", "disable_all_invalid_layers_from(" + start + ") is not a number but " + typeof (start));

	favicon_spinner();
	for (var i = start; i < get_number_of_layers(); i++) {
		await enable_valid_layer_types(i);
	}
	favicon_default();
}

async function enable_valid_layer_types(layer_nr) {
	if(started_training) {
		console.info("enable_valid_layer_types disabled because is in training");
		return;
	}
	assert(typeof (layer_nr) == "number", "enable_valid_layer_types(" + layer_nr + ") is not a number but " + typeof (layer_nr));

	var valid_layer_types = await get_valid_layer_types(layer_nr);

	var options = $($($('.layer_type')[layer_nr]).children().children());

	for (var i = 0; i < options.length; i++) {
		if (!$(options[i]).is(":selected")) {
			$(options[i]).prop("disabled", true);
			//$(options[i]).prop("hidden", false); // Disabled until hide_empty_groups works
		}

		if (valid_layer_types.includes($(options[i]).prop('value'))) {
			$(options[i]).prop("disabled", false);
		} else {
			//$(options[i]).prop("hidden", true); // Disabled until hide_empty_groups works
		}
	}
}

function option_for_layer(nr) {
	assert(typeof (nr) == "number", "option_for_layer(" + nr + ") is not a number but " + typeof (number));

	var this_event = "initializer_layer_options(this)";
	var str = "";
	str += "<tr>";
	str += "<td style='width: 140px'>";
	str += "<button style='cursor: context-menu' class='show_data layer_options_button' onclick='toggle_options(this)'>&#9881;&nbsp;<span class='TRANSLATEME_settings'></span></button>";
	str += "</td>";
	str += "<td>";
	str += "<select onfocus='disable_invalid_layers_event(event, this)' onchange='" + this_event + "' class='input_data layer_type'>";
	var last_category = '';
	for (var key of layer_names) {
		var this_category = layer_options[key].category;
		if (last_category != this_category) {
			if (last_category != "") {
				str += "</optgroup>";
			}
			str += '<optgroup label="' + this_category + '">';
			last_category = this_category;
		}
		str += "<option value='" + key + "'>" + get_python_name(key) + "</option>";
	}
	str += "</optgroup>";
	str += "</select>";
	str += "</td>";
	str += "</tr>";
	str += "<tbody class='layer_options_internal' style='display: none'></tbody>";

	return str;
}

async function remove_layer(item) {
	assert(typeof (item) == "object", "item is not an object but " + typeof (item));

	var number_of_layers_element = document.getElementById("number_of_layers");
	var old_value = parseInt(number_of_layers_element.value);
	if (old_value > 1) {
		$($(item).parent()[0]).parent().remove()

		layer_structure_cache = null;
		number_of_layers_element.value = old_value - 1;

		await updated_page();
		disable_all_non_selected_layer_types();

		if (get_number_of_layers() == 1) {
			$(".remove_layer").prop("disabled", true).hide();
		} else {
			$(".remove_layer").prop("disabled", false).show();
		}
		await save_current_status();
	} else {
		Swal.fire({
			icon: 'error',
			title: 'Oops [2]...',
			text: 'You cannot remove the last remaining layer of your model.',
		});

	}

	await write_descriptions();
	//rename_labels();
	await predict_handdrawn();

	l("Removed layer");
}

function get_element_xpath(element) {
	assert(typeof (element) == "object", "item is not an object but " + typeof (element));

	const idx = (sib, name) => sib
		? idx(sib.previousElementSibling, name || sib.localName) + (sib.localName == name)
		: 1;
	const segs = elm => !elm || elm.nodeType !== 1
		? ['']
		: elm.id && document.getElementById(elm.id) === elm
		? [`id("${elm.id}")`]
		: [...segs(elm.parentNode), `${elm.localName.toLowerCase()}[${idx(elm)}]`];
	return segs(element).join('/');
}

async function add_layer(item) { var start_tensors = memory_leak_debugger();
	assert(typeof (item) == "object", "item is not an object but " + typeof (item));

	layer_structure_cache = null;

	$(item).parent().parent().clone().insertAfter($(item).parent().parent());

	var real_nr = null;

	var item_xpath = get_element_xpath(item);

	var add_layer_buttons = $(".add_layer");
	for (var nr = 0; nr < add_layer_buttons.length; nr++) {
		var elem = add_layer_buttons[nr];
		if (item_xpath == get_element_xpath(elem)) {
			real_nr = nr;
		}
	}

	$("#number_of_layers").val(parseInt($("#number_of_layers").val()) + 1);

	var previous_layer_type = $($($($(".layer_setting")[real_nr])).find(".layer_type")[0]).val();
	var new_layer_type = previous_layer_type;
	if (new_layer_type == "flatten") {
		new_layer_type = "dense";
	}
	$($($($(".layer_setting")[real_nr + 1])).find(".layer_type")[0]).val(new_layer_type);

	await updated_page();

	await write_descriptions();

	$(".remove_layer").prop("disabled", false)
	$(".remove_layer").show();

	await save_current_status();

	await rename_labels();
	await predict_handdrawn();

	l("Added layer");

	memory_leak_debugger("add_layer", start_tensors);
}

function sortable_layers_container(layers_container) { var start_tensors = memory_leak_debugger();
	assert(typeof (layers_container) == "object", "layers_container is not an object but " + typeof (layers_container));

	var error_div = $("#error");

	layers_container.sortable({
		cursor: "move",
		handle: 'div',
		helper: 'clone',
		forcePlaceholderSize: true,
		placeholder: 'placeholder',
		start: function (e, ui) {
			ui.placeholder.height(ui.item.height());
			ui.placeholder.css('visibility', 'visible');
			$(".descriptions_of_layers").hide();
		},
		update: async function (e, ui) {
			var prev_throw_compile_exception = throw_compile_exception;
			throw_compile_exception = true;
			try {
				await compile_model();
				error_div.html("");
				error_div.parent().hide();
			} catch (e) {
				if (mode == "beginner") {
					$("#layers_container").sortable('cancel');
					alert("Dropping this layer there causes the model.compile command to fail. Reverting this drop:\n" + e);
					try {
						await compile_model();
					} catch (e) {
						log(e);
					};
					error_div.html("");
					error_div.parent().hide();
				} else {
					error_div.html(e);
					error_div.parent().show();
				}
			};
			throw_compile_exception = prev_throw_compile_exception;

			$(".descriptions_of_layers").show();
			await updated_page();
		},
		axis: 'y',
		revert: true
	});

	layers_container.droppable({
		tolerance: 'pointer'
	});

	memory_leak_debugger("sortable_layers_container", start_tensors);
}

function disable_all_non_selected_layer_types() {
	l("Disabling all non-selected layer types");
	var all_options = $(".layer_type").children().children();

	for (var i = 0; i < all_options.length; i++) {
		var this_all_options = $(all_options[i]);
		if (!this_all_options.is(":selected")) {
			if (this_all_options.val() != "dense") {
				this_all_options.prop("disabled", true)
			}
		} else {
			this_all_options.prop("selected", true)
		}
	}
	l("Disabled all non-selected layer types");
}

async function show_layers(number) {
	assert(typeof (number) == "number", "show_layer(" + number + ") is not a number but " + typeof (number));

	var layers_container = $("#layers_container");

	var layers_container_str = "";
	var layer_visualizations_tab_str = $("#layer_visualizations_tab").html();

	var remove = "<button class='add_remove_layer_button remove_layer' onclick='remove_layer(this)'>-</button>&thinsp;";
	var add = "<button class='add_remove_layer_button add_layer' onclick='add_layer(this)'>+</button>&nbsp;";

	for (var i = 0; i < number; i++) {
		layers_container_str +=
			"<li class='ui-sortable-handle'><span class='layer_start_marker'></span><div class='container layer layer_setting glass_box'>" +
			"<div style='display:none' class='warning_container'><span style='color: yellow'>&#9888;</span><span class='warning_layer'></span></div>" +
			remove +
			add +
			"<span class='layer_nr_desc'></span>" +
			"<span class='layer_identifier'></span>" +
			"<table class='configtable'>" +
			option_for_layer(i) +
			"</table>" +
			"</div>" +
			"<span class='layer_end_marker'></span>" +
			"</li>"
		;

		layer_visualizations_tab_str +=
			"<div class='layer_data'></div>" +
		"<br>";
		;
	}

	layers_container[0].innerHTML = layers_container_str;

	for (var i = 0; i < number; i++) {
		await initializer_layer_options(i);
	}

	$("#layer_visualizations_tab").html(layer_visualizations_tab_str);

	sortable_layers_container(layers_container);

	$(".train_neural_network_button").show();

	lenet.resize();
}

function reset_photo_gallery() {
	$("#photoscontainer").hide();
	document.getElementById("photos").innerHTML = "";
}

function set_xyz_values(j, name, values) {
	assert(typeof (j) == "number", "j must be number, is: " + typeof (number));
	assert(typeof (name) == "string", "name must be string, is: " + typeof (number));
	assert(typeof (values) == "object", "name must be object, is: " + typeof (number));

	var letter = 'x';
	for (var i = 0; i < values.length; i++) {
		var this_name = name + "_" + String.fromCharCode(letter.charCodeAt() + i)
		set_item_value(j, this_name, values[i]);
	}
}

async function set_config(index) {
	assert(["string", "undefined"].includes(typeof (index)), "Index must be either string or undefined, but is " + typeof (index) + " (" + index + ")");

	$(".only_show_when_predicting_image_file").hide();

	show_swal_when_changing_size = false;

	var swal_msg = "Loading model";
	if(is_cosmo_mode) {
		swal_msg = "Lade Modell";
	}
	if (index) {
		swal_msg = "Undoing/redoing";
	}

	l(swal_msg);
	await load_msg({"title": swal_msg + "..."});

	var original_disabling_saving_status = disabling_saving_status;
	disabling_saving_status = true;

	prev_layer_data = [];

	is_setting_config = true;

	var config = await _get_configuration(index);

	disable_show_python_and_create_model = true;

	if (config) {
		if (!index) {
			if (config["width"]) {
				l("Setting width");
				$("#width").val(config["width"]).trigger("change");
			}

			if (config["height"]) {
				l("Setting height");
				$("#height").val(config["height"]).trigger("change");
			}

			if (config["labels"]) {
				l("Setting labels from config");
				labels = config["labels"];
			}

			if (config["max_number_of_files_per_category"]) {
				l("Setting max_number_of_files_per_category to " + config["max_number_of_files_per_category"]);
				$("#max_number_of_files_per_category").val(config["max_number_of_files_per_category"]);
			}

			if (config["divide_by"]) {
				l("Setting divide_by to " + config["divide_by"]);
				$("#divide_by").val(config["divide_by"]);
			} else {
				l("Setting divide_by to 1");
				$("#divide_by").val(1);
			}

			set_epochs(config["epochs"]);
			set_loss(config["loss"]);

			set_metric(config["metric"]);
			set_optimizer(config["optimizer"]);

			if (config["optimizer"] == "rmsprop") {
				l("Setting optimizer to rmsprop");
				set_rho(config["rho"]);
				set_decay(config["decay"]);
				set_epsilon(config["epsilon"]);
			}

			if (["sgd", "rmsprop"].includes(config["optimizer"])) {
				set_learningRate(config["learningRate"]);
			}

			if (["monentum", "rmsprop"].includes(config["optimizer"])) {
				set_momentum(config["momentum"]);
			}

			set_batchSize(parseInt(config["batchSize"]));
			set_validationSplit(config["validationSplit"]);
		}

		var number_of_layers = 0;

		var keras_layers;
		if (!config["model_structure"]) {
			l("Looking for model structure...");
			var paths = [
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

			for (var i = 0; i < paths.length; i++) {
				if (!keras_layers) {
					keras_layers = get_key_from_path(config, paths[i]);
				}
			}

			if (keras_layers === undefined) {
				Swal.fire({
					icon: 'error',
					title: 'Oops [1]...',
					text: 'Error loading the model'
				});
				await write_descriptions();
				log(config);
				return;
			}

			try {
				number_of_layers = keras_layers.length - (keras_layers[0]["class_name"] == "InputLayer" ? 1 : 0);
			} catch (e) {
				Swal.close()
				console.error(e);
				l("ERROR: Cannot load this model file. Is it a JSON file from asanAI? Is it maybe a graph model?");
				return;
			}
			l("Found model structure");
		} else {
			number_of_layers = config["model_structure"].length;
		}

		//log("number_of_layers: " + number_of_layers);
		await init_number_of_layers(number_of_layers);

		if (config["input_shape"]) {
			await set_input_shape(config["input_shape"]);
		} else {
				var is = null;
				if(Object.keys(config).includes("keras")) {
					if(Object.keys(config.keras).includes("modelTopology")) {
						is = config.keras.modelTopology.config.layers[0].config.batch_input_shape;
					} else {
						is = config.keras.config.layers[0].config.batch_input_shape;
					}
				}

				if(is) {
					is = remove_empty(is);
					is = Object.values(is);
					await set_input_shape("[" + is.join(", ") + "]");
				} else {
					l("ERROR: keras not found in config");
				}
		}

		if (!config["model_structure"]) {
			if (keras_layers[0]["class_name"] == "InputLayer") {
				keras_layers.shift();
			}

			var layer_settings = $(".layer_setting");
			for (var i = 0; i < keras_layers.length; i++) {
				var layer_type = $($(layer_settings[i]).find(".layer_type")[0]);
				l("Setting layer " + i + " to " + python_names_to_js_names[keras_layers[i]["class_name"]]);
				layer_type.val(python_names_to_js_names[keras_layers[i]["class_name"]]);
				layer_type.trigger("change");
				layer_type.trigger("slide");
			}

			for (var i = 0; i < keras_layers.length; i++) {
				var datapoints = [
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

				l("Setting options for layer " + i);

				datapoints.forEach(function (item_name) {
					if (item_name in keras_layers[i]["config"] && item_name != "kernel_size" && item_name != "strides" && item_name != "pool_size") {
						var value = keras_layers[i]["config"][item_name];
						if (item_name == "kernel_initializer") {
							value = detect_kernel_initializer(value);
						} else if (item_name == "bias_initializer") {
							value = get_initializer_name(value["class_name"]);
						}


						if (!(keras_layers[i]["class_name"] == "Flatten" && item_name == "trainable")) {
							set_item_value(i, item_name, value);
						}
					} else {
						if (["kernel_size", "strides", "pool_size"].includes(item_name) && item_name in keras_layers[i]["config"]) {
							var values = keras_layers[i]["config"][item_name];
							set_xyz_values(i, item_name, values);
						} else if (item_name == "dropout_rate" && keras_layers[i]["class_name"] == "Dropout") {
							set_item_value(i, "dropout_rate", keras_layers[i]["config"]["rate"]);
						} else {
							//console.warn("Item not found in keras: " + item_name);
						}
					}
				});

				var units = keras_layers[i]["config"]["units"];
				if (units == "number_of_categories") {
					var number_of_categories = await get_number_of_categories();
					set_item_value(i, "units", number_of_categories);
				} else {
					if (Object.keys(keras_layers[i]["config"]).includes("units")) {
						set_item_value(i, "units", units);
					}
				}

				if ("dilation_rate" in keras_layers[i]["config"]) {
					var dilation_rate = keras_layers[i]["config"]["dilation_rate"];
					var dilation_rate_str = dilation_rate.join(",");
					set_item_value(i, "dilation_rate", dilation_rate_str);
				}
			}
		} else {
			for (var i = 0; i < config["model_structure"].length; i++) {
				l("Setting options for layer " + i);
				var layer_type = $($(".layer_type")[i]); //$($($(".layer_setting")[i]).find(".layer_type")[0]);
				layer_type.val(config["model_structure"][i]["type"]);
				layer_type.trigger("change");
				layer_type.trigger("slide");

				var keys = Object.keys(config["model_structure"][i]["data"]);
				for (var j = 0; j < keys.length; j++) {
					if (!["inputShape"].includes(keys[j])) {
						var value = config["model_structure"][i]["data"][keys[j]];

						if (["kernelSize", "strides"].includes(keys[j])) {
							set_xyz_values(i, get_python_name(keys[j]), value);
						} else if (["dilationRate"].includes(keys[j])) {
							set_item_value(i, get_python_name(keys[j]), value.join(","));
						} else {
							if ((typeof (value)).includes("object")) {
								if (Object.keys(value).includes("name")) {
									value = value["name"];
								}
							}

							//log("set " + keys[j] + " to " + value);
							set_item_value(i, get_python_name(keys[j]), value);
						}
					}
				}
			}
		}
	}

	disabling_saving_status = original_disabling_saving_status;
	disable_show_python_and_create_model = false;

	l("Creating model");

	if(global_model_data) {
		await dispose(global_model_data);
	}

	[model, global_model_data] = await create_model(model);

	l("Compiling model");
	await compile_model();

	try {
		if (config["weights"]) {
			l("Setting weights from config-weights");
			var weights_string = JSON.stringify(config["weights"]);
			await set_weights_from_string(weights_string, 1, 1)
		} else {
			await load_weights(1);
		}
	} catch (e) {
		console.error(e);
		l("ERROR: Failed to load. Failed to load model and/or weights");
		Swal.close()
		return;
	}

	disable_all_non_selected_layer_types();

	if (!index) {
		l("Saving current status");
		await save_current_status();
	}

	l("Getting label data");
	await get_label_data();

	is_setting_config = false;

	l("Call `updated page`-routine");
	await updated_page(null, null, null, 1);

	Swal.close();

	show_swal_when_changing_size = true;

	await write_descriptions();

	l("Updating predictions");
	await show_prediction(1, 1);
 
	$(".kernel_initializer").trigger("change");
	$(".bias_initializer").trigger("change");

	l("Loaded configuration");
}

async function show_or_hide_load_weights() {
	$("#load_weights_button").attr("disabled", "true");

	var dataset = $("#dataset option:selected").text();
	var this_struct = traindata_struct[dataset];
	var keys = Object.keys(this_struct);

	if (keys.includes("weights_file") && await _show_load_weights()) {
		$("#load_weights_button").removeAttr("disabled");
	}
}

async function init_dataset() {
	$("#photos").html("").hide();
	$("#maximally_activated_content").html("");
	hide_tab_label("maximally_activated_label");
	show_tab_label("visualization_tab_label", 1)

	show_tab_label("fcnn_tab_label", 1);
	hide_tab_label("tfvis_tab_label");

	clicked_on_tab = 0;
	init_epochs(2);

	set_batchSize(2);

	$(".training_performance_tabs").hide();

	$("#data_origin").val("default").trigger("change");
	show_tab_label("visualization_tab_label", 1);

	await save_current_status();
	init_weight_file_list();
	init_download_link();

	$("#predict_error").html("");
	$("#prediction").html("");
}

function init_download_link() {
	let html = "";
	if(!is_cosmo_mode) {
		html = "Download the training data <a alt='Download Training Data as ZIP' href='traindata/zip.php?dataset=" + $("#dataset").val() + "'>here</a>.";
	}
	var d = $("#download_data").html(html).show;
}

async function get_number_of_categories() {
	var training_data_info = await _get_training_data();
	var num = Object.keys(training_data_info).length;
	return num;
}

async function chose_dataset(no_set_config) {
	$("#data_origin").val("default").trigger("change")

	$("#maximally_activated_content").html("")
	hide_tab_label("maximally_activated_label");
	if(!is_cosmo_mode) {
		show_tab_label("visualization_tab_label", 1);
	}
	show_tab_label("fcnn_tab_label", 1);

	init_weight_file_list();
	x_file = null;
	y_file = null;
	y_shape = null;

	status_saves = [];
	state_stack = [];
	future_state_stack = [];

	show_hide_undo_buttons();

	//await show_or_hide_load_weights()
	model_is_trained = false;
	if (!no_set_config) {
		await set_config();
	}
	is_setting_config = false;

	$("#predict_error").html("");
	$("#prediction").html("");

	await identify_layers(get_number_of_layers());
	init_download_link();

	if(!is_cosmo_mode) {
		await force_download_image_preview_data();
	}

	$("#prediction_non_image").hide();
}

function init_weight_file_list() {
	$('#model_dataset').find('option').remove();

	var chosen_dataset = $("#dataset").find(":selected").text();

	var this_struct = traindata_struct[chosen_dataset]["weights_file"];

	var weight_files = Object.keys(this_struct);

	for (var i = 0; i < weight_files.length; i++) {
		var new_option = $('<option>', { value: weight_files[i], text: weight_files[i] });
		$("#model_dataset").append(new_option);
	}
}

async function init_dataset_category() {
	$("#photos").html("").hide();
	$("#maximally_activated_content").html("");
	hide_tab_label("maximally_activated_label");

	var original_is_settings_config = is_setting_config;
	is_setting_config = true;
	x_file = null;
	y_file = null;
	y_shape = null;

	status_saves = [];
	state_stack = [];
	future_state_stack = [];

	show_hide_undo_buttons();

	clicked_on_tab = 0;

	await reset_data();

	var show_items = {
		"image": ["imageresizecontainer", "black_and_white", "resizedimensions", "resizedimensions.parent"],
		"else": ["max_values", "max_values.parent"]
	};



	var item_names = Object.keys(show_items);

	if(await input_shape_is_image()) {
		for (var i = 0; i < show_items["image"].length; i++) {
			var item_name = show_items["image"][i];
			if (item_name.endsWith(".parent")) {
				item_name = item_name.replace(/\.parent/, '');
				$("#" + item_name).parent().show();
			} else {
				$("#" + item_name).show();
			}
		}

		for (var i = 0; i < show_items["else"].length; i++) {
			var item_name = show_items["else"][i];
			if (item_name.endsWith(".parent")) {
				item_name = item_name.replace(/\.parent/, '');
				$("#" + item_name).parent().hide();
			} else {
				$("#" + item_name).hide();
			}
		}
	} else {
		for (var i = 0; i < show_items["else"].length; i++) {
			var item_name = show_items["else"][i];
			if (item_name.endsWith(".parent")) {
				item_name = item_name.replace(/\.parent/, '');
				$("#" + item_name).parent().show();
			} else {
				$("#" + item_name).show();
			}
		}

		for (var i = 0; i < show_items["image"].length; i++) {
			var item_name = show_items["image"][i];
			if (item_name.endsWith(".parent")) {
				item_name = item_name.replace(/\.parent/, '');
				$("#" + item_name).parent().hide();
			} else {
				$("#" + item_name).hide();
			}
		}
	}

	$("#input_text").hide();

	var dataset = "";

	$("#dataset").html(dataset);
	$("#upload_x").hide().parent().hide();
	$("#upload_y").hide().parent().hide();
	$("#reset_model").show();

	$('#data_origin').change(function () {
		$('#data_origin option[value="default"]').prop('disabled', false);
	});

	init_download_link();
	init_categories();
	init_weight_file_list();

	number_of_initialized_layers = 0;

	state_stack = [];
	future_state_stack = [];

	hide_tab_label("tfvis_tab_label");

	is_setting_config = original_is_settings_config;

	$("#data_origin").val("default").trigger("change");

	show_tab_label("visualization_tab_label", 1);
	show_tab_label("fcnn_tab_label", 1);

	await updated_page();
	init_download_link();
}

async function clean_gui() { var start_tensors = memory_leak_debugger();
	reset_summary();
	await write_error("");
	await write_descriptions();
	memory_leak_debugger("clean_gui", start_tensors);
}

async function set_input_shape(val) {var start_tensors = memory_leak_debugger();
	assert(typeof (val) == "string", "set_input_shape(" + val + "), val is not string, but " + typeof (val));

	$("#inputShape").val(val);

	await write_descriptions();

	var res = get_input_shape();

	memory_leak_debugger("set_input_shape", start_tensors)

	return res;
}

function get_input_shape_with_batch_size() { var start_tensors = memory_leak_debugger();
	var shape = get_input_shape();
	shape.unshift(parseInt($("#batchSize").val()));
	var res = shape;
	memory_leak_debugger("get_input_shape_with_batch_size", start_tensors);
	return res;
}

function get_input_shape() { var start_tensors = memory_leak_debugger();
	var code = $("#inputShape").val();
	if (!code.startsWith("[")) {
		code = "[" + code + "]";
	}
	var res = eval(code);
	memory_leak_debugger("get_input_shape", start_tensors);
	return res;
}

async function change_metrics() {
	var new_metric = $("#metric").val();

	l("Changed metrics");
	$("#metric_equation").html("");

	await updated_page(1);
}

function get_activation_list() {
	var array = [];
	layer_names.forEach(function eachKey(key) {
		if (layer_options[key]["category"] == "Activation") {
			array.push(key);
		}
	})
	return array;
}

function change_favicon(path) {
	assert(typeof (path) == "string", "Path for change_favicon(" + path + ") is not a string, but " + typeof (path));

	var link = document.querySelector("link[rel~='icon']");
	if (!link) {
		link = document.createElement('link');
		link.rel = 'icon';
		document.getElementsByTagName('head')[0].appendChild(link);
	}
	link.href = path;
}

function favicon_default() {
	change_favicon("favicon.ico");
}

function favicon_spinner() {
	change_favicon("loading_favicon.gif");
}


async function disable_everything() {
	document.body.style.cursor = "wait";
	$("#layers_container").sortable("disable");
	$("#ribbon,select,input,checkbox,.add_remove_layer_button").prop("disabled", true);
	$(".show_data").prop("disabled", false);
	await write_descriptions();
	await highlight_code();
}

async function enable_everything() {
	document.body.style.cursor = "default";
	$("#layers_container").sortable("enable");
	$("#ribbon,select,input,checkbox,.add_remove_layer_button").prop("disabled", false);
	await write_descriptions();
	await highlight_code();
}

function detect_kernel_initializer(original_kernel_initializer_data) {
	assert(typeof (original_kernel_initializer_data) == "object", "Parameter for detect_kernel_initializer(" + original_kernel_initializer_data + ") is not an array, but " + typeof (original_kernel_initializer_data));

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
			log("Not fanAvg, nor FanIn");
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

function show_or_hide_bias_initializer(number_of_layers) {
	var layer_settings = $(".layer_setting");
	for (var i = 0; i < number_of_layers; i++) {
		var this_layer = $(layer_settings[i]);
		var use_bias_setting = this_layer.find(".use_bias");
		if (use_bias_setting.length) {
			if ($(use_bias_setting[0]).is(":checked")) {
				this_layer.find(".bias_initializer").parent().parent().show()
			} else {
				this_layer.find(".bias_initializer").parent().parent().hide()
			}
		}
	}
}

/* Diese Funktion sollte eigentlich leere Gruppen verstecken, aber hat nie geklappt. Daher: TODO, aber ohne Eile! */
function hide_empty_groups(layer_nr) {
	assert(typeof (layer_nr) == "number", "hide_empty_groups(" + layer_nr + "), layer_nr is not an integer but " + typeof (layer_nr));

	$($(".layer_type")[layer_nr]).children().each(function (i, group) {
		var children = $(group).children();

		var number_of_enabled_children = 0;
		for (var j = 0; j < children.length; j++) {
			if (!($(children[j]).is(":disabled") || $(children[j]).is(":selected"))) {
				number_of_enabled_children += 1;
			}
		}

		if (number_of_enabled_children) {
			$(group).show();
		} else {
			$(group).hide();
		}
	})
}

async function set_all_kernel_initializers() {
	var chosen_value = $("#set_all_kernel_initializers").val();
	l("Setting all kernel initializers to " + chosen_value);
	var initializer_keys = Object.keys(initializers);
	if (initializer_keys.includes(chosen_value)) {
		$(".kernel_initializer").val(chosen_value).trigger("change");
	}

	$("#set_all_kernel_initializers").val("none");

	await updated_page();
}

async function set_all_bias_initializers() {
	var chosen_value = $("#set_all_bias_initializers").val();
	l("Setting all bias initializers to " + chosen_value);
	var initializer_keys = Object.keys(initializers);
	if (initializer_keys.includes(chosen_value)) {
		$(".bias_initializer").val(chosen_value).trigger("change");
	}

	$("#set_all_bias_initializers").val("none");

	await updated_page();
}

async function set_all_activation_functions_except_last_layer() {
	var chosen_value = $("#set_all_activation_functions_except_last_layer").val();
	l("Setting all activation functions (except for last layer) to " + chosen_value);
	var keys = Object.keys(activations);
	if (keys.includes(chosen_value)) {
		var activations_setting = $(".activation");
		for (var i = 0; i < activations_setting.length - 1; i++) {
			$(activations_setting[i]).val(chosen_value).trigger("change");
		}
	}

	$("#set_all_activation_functions_except_last_layer").val("none");

	await updated_page();
}


async function set_all_activation_functions() {
	var chosen_value = $("#set_all_activation_functions").val();
	l("Setting all activation functions to " + chosen_value);
	var keys = Object.keys(activations);
	if (keys.includes(chosen_value)) {
		$(".activation").val(chosen_value).trigger("change");
	}

	$("#set_all_activation_functions").val("none");

	await updated_page();
}

function last_index(array) {
	assert(typeof (array) == "object", "last_index(" + array + ") is not an array but " + typeof (array));
	return array.length - 1;
}

async function save_current_status() {
	if (disabling_saving_status) {
		return;
	}

	try {
		var index = await get_current_status_hash();

		if (state_stack.includes(index) || future_state_stack.includes(index)) {
			return;
		}

		status_saves[index] = {
			"model_structure": await get_model_structure(),
			"weights": await get_weights_as_string()
		};

		future_state_stack = [];

		if (last_index(state_stack) == -1 || state_stack[last_index(state_stack)] != index) {
			state_stack.push(index);
		}

		show_hide_undo_buttons();
	} catch (e) {
		log(e);
	}
}

async function undo() {
	var shown = get_shown_advanced();
	if (state_stack.length >= 1) {
		$(":focus").blur();
		var current_index = state_stack.pop();
		var this_index = state_stack.pop();

		future_state_stack.unshift(current_index); // Add to beginning of future_state_stack

		if (last_index(state_stack) == -1 || state_stack[last_index(state_stack)] != this_index) {
			state_stack.push(this_index);
		}

		var old_disabling_saving_status = disabling_saving_status;
		disabling_saving_status = true;

		await set_config(this_index);
		is_setting_config = false;

		disabling_saving_status = old_disabling_saving_status;
	}

	show_hide_undo_buttons();
	set_shown_advanced(shown);

	await write_descriptions();

	l("Undone last change");
}

async function redo() {
	var shown = get_shown_advanced();
	if (future_state_stack.length) {
		$(":focus").blur();
		var this_index = future_state_stack.shift();
		if (last_index(state_stack) == -1 || state_stack[last_index(state_stack)] != this_index) {
			state_stack.push(this_index); // Add to end of state_stack
		}

		var old_disabling_saving_status = disabling_saving_status;
		disabling_saving_status = true;

		await set_config(this_index);

		is_setting_config = false;

		disabling_saving_status = old_disabling_saving_status;
	}

	show_hide_undo_buttons();
	set_shown_advanced(shown);
	await write_descriptions();

	l("Redone last undone change");
}

function enable_symbol(name) {
	assert(typeof (name) == "string", name + " is not a string but " + typeof (name));
	var el = document.getElementById(name);
	assert(typeof (el) == "object", "document.getElementById(" + name + ") is not an object");
	el.classList.remove("disabled_symbol");
	el.classList.add("enabled_symbol");
}

function disable_symbol(name) {
	assert(typeof (name) == "string", name + " is not a string but " + typeof (name));
	var el = document.getElementById(name);
	assert(typeof (el) == "object", "document.getElementById(" + name + ") is not an object");
	el.classList.remove("enabled_symbol");
	el.classList.add("disabled_symbol");
}

function show_hide_undo_buttons() {
	disable_symbol("undo_button");
	disable_symbol("redo_button");

	if (state_stack.length > 1) {
		enable_symbol("undo_button");
	}

	if (future_state_stack.length) {
		enable_symbol("redo_button");
	}


	//debug_undo_redo_stack();
}

function debug_undo_redo_stack() {
	//console.clear();

	header("State-Stack:");
	log(state_stack);

	header("Redo-Stack:");
	log(future_state_stack);

	header("status_saves:");
	log(Object.keys(status_saves));
}

function show_register_button(elem) {
	if (elem.checked) {
		document.getElementById("register_button").style = "display: block";
	} else {
		document.getElementById("register_button").style = "display: none";
	}
}

async function register() {
	var email = document.getElementById("register_email").value;
	var username = document.getElementById("register_username").value;
	var password = document.getElementById("register_password").value;
	document.getElementById("register_error_msg").style.display = 'visible';
	if (email.includes("@")) {
		document.getElementById("register_error_msg").innerHTML = "";
		$.ajax({
			url: "register.php?email=" + email + "&username=" + username + "&pw=" + password + "&days=7",
			success: function (data) {
				if(data["status"] == "ok") {
					color_msg_green("register_error_msg");
					document.getElementById("register_error_msg").innerHTML = data["status"] + ": " + data["msg"];
					setCookie("session_id", data["session_id"], 7);
					$("#register").hide();
					$("#delete_button").hide();
					$("#logout").show();
					$("#register_dialog").delay(400).fadeOut();
					$(".show_when_logged_in").show();
				}
				if(data["status"] == "error") {
					color_msg_red("register_error_msg");
					document.getElementById("register_error_msg").innerHTML = data["status"] + ": " + data["msg"];
				}
				l(data["msg"]);
			},
			error: function (object, error, msg) {
				color_msg_red("register_error_msg");
				document.getElementById("register_error_msg").innerHTML = error + ": " + msg;
			}
		});
	} else {
		color_msg_red("register_error_msg");
		document.getElementById("register_error_msg").innerHTML = "Email must contain an '@'.";
	}

	await write_descriptions();
}

async function login() {
	var username = document.getElementById("login_username").value;
	var password = document.getElementById("login_password").value;
	document.getElementById("login_error_msg").style.display = 'visible';
	$.ajax({
		url: "login.php?username=" + username + "&pw=" + password + "&days=7",
		success: async function (data) {
			if(data["status"] == "ok") {
				user_id = data["user_id"];
				color_msg_green("login_error_msg");
				document.getElementById("login_error_msg").innerHTML = data["status"] + ": " + data["msg"];
				setCookie("session_id", data["session_id"], 7);
				$("#register").hide();
				$("#logout").show();
				$("#register_dialog").delay(400).fadeOut(400, async () => {
					await get_traindata_and_init_categories();
				});
				$(".show_when_logged_in").show();
			}
			if(data["status"] == "error") {
				color_msg_red("login_error_msg");
				document.getElementById("login_error_msg").innerHTML = data["status"] + ": " + data["msg"];
			}
			l(data["msg"]);
		}
	});
}

async function logout() {
	user_id = null;
	eraseCookie('session_id');
	$("#logout").hide();
	$("#register").show();
	$("#register_email").val("");
	$("#register_username").val("");
	$("#register_password").val("");
	$("#login_username").val("");
	$("#login_password").val("");
	$("#register_button").hide();
	document.getElementById("login_error_msg").innerHTML = "";
	document.getElementById("register_error_msg").innerHTML = "";
	document.getElementById("network_name").innerHTML = "";
	document.getElementById("license").checked = false;
	document.getElementById("is_public").checked = false;
	$(".show_when_logged_in").hide();
	l("Logged out.");

	await get_traindata_and_init_categories();
}

async function sources_popup() {
	await openPopup("sources_popup");
}

async function losses_popup() {
	if ($("#explanation").children().length == 0) {
		add_loss_functions_to_plotly_visualizer();
	}
	await openPopup("losses_popup");
}

async function close_losses() {
	await closePopup("losses_popup");
}

function model_name_already_exists() {
	var model_names = Object.keys(traindata_struct);
	var network_name = document.getElementById("network_name").value;
	for(var i = 0; i < model_names.length; i++) {
		if(model_names[i] == network_name) {
			return true;
		}
	}
	return false;
}

function model_name_exists() {
	$.ajax({
		url: "get_model_names.php",
		success: function (data) {
			log(data)
		}
	});
}

function insert_test_users() {
	var users = ["eins", "zwei", "drei", "vier", "fünf", "vier", "test"];
	for(var i = 0; i < users.length; i++) {
		$.ajax({
			url: "register.php?email=" + users[i] + "@&username=" + users[i] + "&pw=" + users[i] + users[i]
		});
	}
}

async function delete_model() {
	var id = get_id_from_train_data_struct("id");
	var user_id = get_id_from_train_data_struct("user_id");
	$.ajax({
		url: "delete_from_db.php?id=" + id + "&user_id=" + user_id,
		async: false
	});

	await get_traindata_and_init_categories();
}

function get_id_from_train_data_struct(index) {
	var dataset_index = document.getElementById("dataset").selectedIndex;

	if(dataset_index >= 0) {
		var dataset = document.getElementById("dataset").children[dataset_index].innerText;
		if(dataset != undefined) {
			var id = traindata_struct[dataset][index];
			return id;
		}
	}
	return false;
}

function display_delete_button() {
	var user_id = get_id_from_train_data_struct("user_id").toString();

	var dm = $("#delete_model");

	if(user_id.match(/^[0-9]*$/) && !!getCookie("session_id")) {
		if(dm.hasClass("disabled_symbol")) {
			dm.html("&#10060;").removeClass("disabled_symbol");
		}
	} else {
		if(!dm.hasClass("disabled_symbol")) {
			dm.html("&#10006;").addClass("disabled_symbol");
		}
	}
}

async function manage_download() {
	if(!getCookie("session_id") === null) {
		save_model();
	} else {
		await open_save_model_dialog();
	}
}

function has_network_name(elem) {
	var name = elem.value;
	$(elem).val(name.replaceAll(/\s/g, ""));
	name = elem.value;

	if(!network_name_is_empty(name)) {
		$.ajax({
			url: "get_number_of_model_names.php?name=" + name,
			success: function (data) {
				log(data["number"])
				if(data["number"] == 0) {
					$("#save_to_db").prop("disabled", false);
					document.getElementById("save_model_msg").innerHTML = "";
				} else {
					$("#save_to_db").prop("disabled", true);
					color_msg_red("save_model_msg");
					document.getElementById("save_model_msg").innerText = "Please choose a different network name. There is already a network with this name.";
				}
			}
		});
	} else {
		$("#save_to_db").prop("disabled", true);
	}
}

function color_msg_green(id) {
	document.getElementById(id).style = "background-color: green";
}

function color_msg_red(id) {
	document.getElementById(id).style = "background-color: red";
}

function network_name_is_empty(name) {
	if(name.match(/^ *$/) || (name == "")) {
		return true;
	} else {
		return false;
	}
}

// function get_classifications() {
// 	var op = "";
// 	for(var i = 0; i < Object.keys(traindata_struct).length; i++) {
// 		op = document.createElement("option");
// 		op.innerText = Object.keys(traindata_struct)[i];
// 		op.value = traindata_struct[Object.keys(traindata_struct)[i]]["category_name"];
// 		$("#select_classification").append(op);
// 	}
// }

function save_to_db(model_structure, model_weights, model_data, requests_public) {
	document.getElementById("save_model_msg").style.display = 'visible';
	$.ajax({
		url: "save_to_db.php",
		data: {
			model_structure: model_structure,
			model_weights: model_weights,
			model_data: model_data,
			requests_public: requests_public,
			network_name: $("#network_name").val()
		},
		method: "POST",
		success: async function (data) {
			log(data);
			if(data["status"] == "ok") {
				color_msg_green("save_model_msg");
				$.ajax({
					url: "save_training_data.php",
					data: {
						data: await get_training_data_as_json(),
						model_id: data["id"]
					},
					method: "POST",
					error: function (object, error, msg) {
						color_msg_red("save_model_msg");
						document.getElementById("save_model_msg").innerText = msg;
					}
				});
			}
			if(data["status"] == "error") {
				color_msg_red("save_model_msg");
			}
		},
		error: function (object, error, msg) {
			color_msg_red("save_model_msg");
			document.getElementById("save_model_msg").innerText = msg;
		}
	});


}

async function save_to_db_wrapper () {
	if(!model_name_exists()) {
		save_to_db(await get_tfjs_model(), await get_weights_as_string(), JSON.stringify(await get_model_data(1)), document.getElementById("is_public").checked);
		$("#save_to_db").prop("disabled", true);
	} else {
		color_msg_red("save_model_msg");
		document.getElementById("save_model_msg").innerText = "Please choose a different name for this model.";
		$("#save_model_msg").show();
	}
}

async function open_save_model_dialog() {
	await openPopup("save_model_dialog");
}

async function open_register_dialog() {
	await openPopup("register_dialog");
}

async function open_save_dialog() {
	await openPopup("save_dialog");
}

async function openPopup(name) {
	assert(typeof (name) == "string", name + " is not a string but " + typeof (name));
	var el = document.getElementById(name);
	assert(typeof (el) == "object", "document.getElementById(" + name + ") is not an object");

	if ($(el).css("display") == "none") {
		el.style.display = 'block';
	} else {
		el.style.display = 'none';
	}
	await write_descriptions();
}

async function closePopup(name) {
	assert(typeof (name) == "string", name + " is not a string but " + typeof (name));
	var el = document.getElementById(name);
	assert(typeof (el) == "object", "document.getElementById(" + name + " is not an object");
	el.style.display = 'none';
	await write_descriptions();
}

async function upload_model(evt) {
	let files = evt.target.files;

	let f = files[0];

	let reader = new FileReader();

	// Closure to capture the file information.
	reader.onload = (function (theFile) {
		return async function (e) {
			uploaded_model = e.target.result;

			await set_config();
			is_setting_config = false;
		};
	})(f);

	reader.readAsText(f);
}

async function upload_weights(evt) { var start_tensors = memory_leak_debugger();
	let files = evt.target.files;

	let f = files[0];

	let reader = new FileReader();

	// Closure to capture the file information.
	reader.onload = (() => function (theFile) {
		return function (e) {

		};
	})(f);

	reader.readAsText(f);

	var modelUpload = document.getElementById('upload_model');
	var weightsUpload = document.getElementById('upload_weights');

	model = await tf.loadLayersModel(tf.io.browserFiles([modelUpload.files[0], weightsUpload.files[0]]));

	$("#predictcontainer").show();
	$('a[href="#predict_tab"]').click();
	if(is_cosmo_mode) {
		await delay(200);
		log("TRYING HERE!!!!!!!!");
		chose_next_manicule_target();
	}
	memory_leak_debugger("upload_weights", start_tensors);
}

var handle_x_file = async function (evt) {
	x_file = await evt.target.files[0].text();
	await set_input_shape("[" + get_shape_from_file(x_file) + "]");

	if (!_heuristic_layer_possibility_check($($(".layer_type")[0]).val(), get_input_shape())) {
		Swal.fire({
			title: 'X-Data and first layer have incompatible shape-requirements. Set to Dense for all layers?',
			showDenyButton: true,
			showCancelButton: false,
			confirmButtonText: 'Yes',
			denyButtonText: 'No',
		}).then((result) => {
			if (result.isConfirmed) {
				$(".layer_type").val("dense").trigger("change");
				Swal.fire('Set all layers to dense', '', 'success');
			} else if (result.isDenied) {
				Swal.fire('The model may not work as expected', '', 'warning')
			}
		});
	}
	await updated_page();

	enable_start_training_custom_tensors();
}

var handle_y_file = async function (evt) {
	y_file = await evt.target.files[0].text();
	y_shape = get_shape_from_file(y_file);
	$("#y_shape_div").show();
	$("#y_shape").val(y_shape);
	await updated_page();

	enable_start_training_custom_tensors();
}

function enable_start_training_custom_tensors() {
	if (!$("#data_origin").val() == "tensordata") {
		return;
	}

	enable_train();

	if (x_file && y_file) {
		var last_layer_warning_container = $($(".warning_container")[get_number_of_layers() - 1]);
		if (eval($("#outputShape").val()).join(",") == get_full_shape_without_batch(y_file).join(",")) {
			special_reason_disable_training = false;
			last_layer_warning_container.html("").hide();
		} else {
			special_reason_disable_training = true;
			last_layer_warning_container.html(
				"The last layer's output shape does not conform with the provided Y-data's shape. " +
				"Try changing the number of neurons, so that the output becomes [null" +
				get_full_shape_without_batch(y_file).join(",") + "]"
			);

			last_layer_warning_container.show();
			disable_train();
		}
	}

	current_status_hash = "";
}

function get_sum_of_items_childrens_width(item) {
	var total_width = 0;

	$(item).each(function (index) {
		total_width += parseInt($(this).width(), 10);
	});

	return total_width;
}

function get_chosen_dataset() {
	var val = $("#model_dataset").val();
	if (!val) {
		val = $("#dataset").val();
	}
	return val;
}

async function load_weights(dont_show_msg) { var start_tensors = memory_leak_debugger();
	var dataset = $("#dataset option:selected").text();
	var this_struct = traindata_struct[dataset];

	var weights_file = this_struct["weights_file"][get_chosen_dataset()];

	if (weights_file) {
		$.ajax({
			url: weights_file,
			success: async function (data) {
				//await set_weights_from_json_object(data, dont_show_msg, 1, model);
				prev_layer_data = [];
				await show_prediction(0, 1);
				await write_model_to_latex_to_page();
				//await show_or_hide_load_weights();
			}
		});
	}

	memory_leak_debugger("load_weights", start_tensors);
}

function show_dtype_only_first_layer() { var start_tensors = memory_leak_debugger();
	for (var i = 0; i < get_number_of_layers(); i++) {
		if (i == 0) {
			$($(".dtype")[i]).parent().parent().show()
		} else {
			$($(".dtype")[i]).parent().parent().hide()
		}
	}
	memory_leak_debugger("show_dtype_only_first_layer", start_tensors);
}

function attrChangeName(elem, attr, new_attr) { var start_tensors = memory_leak_debugger();
	var data = $(elem).attr(attr);
	$(elem).attr(new_attr, data);
	$(elem).removeAttr(attr);
	memory_leak_debugger("attrChangeName", start_tensors);
}

function is_hidden_or_has_hidden_parent(element) { var start_tensors = memory_leak_debugger();
	if ($(element).css("display") == "none") {
		return true;
	}

	var parents = $(element).parents();

	for (var i = 0; i < parents.length; i++) {
		if ($(parents[i]).css("display") == "none") {
			memory_leak_debugger("is_hidden_or_has_hidden_parent", start_tensors);
			return true;
		}
	}

	memory_leak_debugger("is_hidden_or_has_hidden_parent", start_tensors);
	return false;
}

function start_chardin_tour() { var start_tensors = memory_leak_debugger();
	disable_hidden_chardin_entries();
	chardinJs = $("body").chardinJs($("body"));
	chardinJs.start();
	memory_leak_debugger("start_chardin_tour", start_tensors);
}

function disable_hidden_chardin_entries() { var start_tensors = memory_leak_debugger();
	var items = $("[data-intro],[data-introdisabled]");

	for (var i = 0; i < items.length; i++) {
		var target = $(items[i]);
		if (is_hidden_or_has_hidden_parent(target)) {
			attrChangeName(target, "data-intro", "data-introdisabled");
		} else {
			attrChangeName(target, "data-introdisabled", "data-intro");
		}
	}

	chardinJs = $("body").chardinJs($("body"));

	var activated_items = $("[data-intro]");

	if (activated_items.length > 0) {
		$("#chardinjs_help_icon").removeClass("disabled_symbol").css("cursor", "help").click(start_chardin_tour);
	} else {
		$("#chardinjs_help_icon").addClass("disabled_symbol").css("cursor", "not-allowed").attr("onclick", "").unbind("click");
	}

	memory_leak_debugger("disable_hidden_chardin_entries", start_tensors);
}

async function update_input_shape() { var start_tensors = memory_leak_debugger();
	await set_input_shape("[" + get_input_shape().join() + "]");
	layer_structure_cache = null;
	await updated_page();
	if(await input_shape_is_image()) {
		var this_shape = get_input_shape();
		$("#width").val(this_shape[1]);
		$("#height").val(this_shape[0]);
		await change_width();
		await change_height();
	}

	await highlight_code();
	memory_leak_debugger("update_input_shape", start_tensors);
}

async function toggle_show_input_layer() { var start_tensors = memory_leak_debugger();
	show_input_layer = $("#show_input_layer").is(":checked");

	await restart_fcnn(1);
	await restart_lenet(1);
	await restart_alexnet(1);
	memory_leak_debugger("toggle_show_input_layer", start_tensors);
}

function reset_view() { var start_tensors = memory_leak_debugger();
	var items = $("g");

	for (var i = 0; i < items.length; i++) {
		var parents_parent = $(items[i]).parent().parent();
		var parents_parent_id = parents_parent.prop("id");

		var container_width = parents_parent[0].getBoundingClientRect().width;

		var width = items[i].getBoundingClientRect().width;

		if (width) {
			var translate_left = parseInt(container_width / width);

			if (parents_parent_id == "lenet") {
				$($("g")[i]).attr("transform", "translate(-" + translate_left + ",0) scale(1)")
			} else if (parents_parent_id == "fcnn") {
				$($("g")[i]).attr("transform", "translate(-" + translate_left + ",0) scale(1)")
			}
		}
	}
	memory_leak_debugger("reset_view", start_tensors);
}

async function change_data_origin() { var start_tensors = memory_leak_debugger();
	currently_running_change_data_origin = 1;
	l("Change data origin");
	//if($("#reinit_weights_on_data_source_change").is(":checked") && $("#data_origin").val() != "default") {
	//	force_reinit(1);
	//}

	x_file = null;
	y_file = null;
	y_shape = null;

	enable_train();

	var new_origin = $("#data_origin").val();

	var show_images_per_category = 0;

	var show_own_image_data = 0;
	var show_own_tensor_data = 0;
	var show_own_csv_data = 0;

	if (new_origin == "default") {
		if (await input_shape_is_image()) {
			show_images_per_category = 1;
		}

		reset_labels();
		await get_label_data();

		if(!is_cosmo_mode) {
			$(".hide_when_custom_data").show();
		}

		changed_data_source = false;

		await set_default_input_shape();

		if(!is_cosmo_mode) {
			show_tab_label("visualization_tab_label", 1);
			show_tab_label("fcnn_tab_label", 1);
		}

		await update_python_code();
	} else {
		disable_train();

		if ($("#data_origin").val() == "image") {
			show_own_image_data = 1;
			show_images_per_category = 1;
			await set_input_shape("[" + height + ", " + width + ", 3]");
			$("#max_number_of_files_per_category").val(0).trigger("change");
		} else if ($("#data_origin").val() == "tensordata") {
			show_own_tensor_data = 1;
		} else if ($("#data_origin").val() == "csv") {
			await show_csv_file(1);
			if(contains_convolution() && mode != "expert") {
				await Swal.fire({
					title: 'Are you sure?',
					text: "Using CSV in a network that contains convolutions is probably not what you want. Only continue if you really know what you are doing!",
					icon: 'warning',
					showCancelButton: true,
					confirmButtonColor: '#3085d6',
					cancelButtonColor: '#d33',
					cancelButtonText: 'Yes, switch to expert mode and use CSV with this network!',
					confirmButtonText: 'No, keep me safe from tons of errors!'
				}).then((result) => {
					if (!result.isConfirmed) {
						$('#mode_chooser').children().attr("checked", "checked").trigger("change");
						show_own_csv_data = 1;
					} else {
						show_own_tensor_data = 1;
						$("#data_origin").val("tensordata").trigger("change");
					}
				});
			} else {
				show_own_csv_data = 1;
			}
		} else {
			alert("Unknown data_origin: " + $("#data_origin").val());
		}

		$(".hide_when_custom_data").hide();

		changed_data_source = true;
	}

	if (show_images_per_category) {
		$("#max_number_of_files_per_category_tr").show();
	} else {
		$("#max_number_of_files_per_category_tr").hide();
		$("#max_number_of_files_per_category").val(0);
	}

	/*
	hide_tab_label("training_data_tab_label");
	hide_tab_label("own_csv_data_label");
	hide_tab_label("own_image_data_label");
	hide_tab_label("own_tensor_data_label");
	*/

	if (show_own_image_data) {
		show_tab_label("own_image_data_label", 1);

		hide_tab_label("training_data_tab_label");
		hide_tab_label("own_csv_data_label");
		hide_tab_label("own_tensor_data_label");

		$("#own_images_container").html("");
		await add_new_category();
		await add_new_category();
		if(is_cosmo_mode) {
			await add_new_category();
			await add_new_category();
			await add_new_category();
		}
		disable_start_training_button_custom_images();
		$("#loss").val("categoricalCrossentropy");
		$("#metric").val("categoricalCrossentropy");
		await rename_labels();
	} else if (show_own_tensor_data) {
		show_tab_label("own_tensor_data_label", 1);

		hide_tab_label("training_data_tab_label");
		hide_tab_label("own_csv_data_label");
		hide_tab_label("own_image_data_label");

		var config = await _get_configuration();
		$("#loss").val(config["loss"]);
	} else if (show_own_csv_data) {
		show_tab_label("own_csv_data_label", 1);

		hide_tab_label("training_data_tab_label");
		hide_tab_label("own_image_data_label");
		hide_tab_label("own_tensor_data_label");

		var config = await _get_configuration();
		$("#loss").val(config["loss"]);
	} else {
		show_tab_label("training_data_tab_label");

		hide_tab_label("own_csv_data_label");
		hide_tab_label("own_image_data_label");
		hide_tab_label("own_tensor_data_label");

		var config = await _get_configuration();
		$("#loss").val(config["loss"]);
	}

	if (window.location.href.indexOf("no_webcam") == -1) {
		if (await input_shape_is_image()) {
			if(!is_cosmo_mode) {
				$("#show_webcam_button").show();
			} else {
				//$("#show_webcam_button").hide();
			}
		} else {
			$("#show_webcam_button").hide();
			stop_webcam();
		}
	}
	currently_running_change_data_origin = 0;
	memory_leak_debugger("change_data_origin", start_tensors);
}

function auto_adjust_number_of_neurons(n) { var start_tensors = memory_leak_debugger();
	if ($("#auto_adjust_number_of_neurons").is(":checked")) {
		var last_layer_type = $($(".layer_type")[$(".layer_type").length - 1]).val();

		if (last_layer_type == "dense") {
			var original_no_update_math = no_update_math;
			no_update_math = true;
			click_on_graphs = 0;
			if(n != $($(".layer_setting")[$(".layer_setting").length - 1]).find(".units").val()) {
				$($(".layer_setting")[$(".layer_setting").length - 1]).find(".units").val(n).trigger("change");
			}
			no_update_math = original_no_update_math;
		} else {
			log("last layer not dense");
		}
	}
	memory_leak_debugger("auto_adjust_number_of_neurons", start_tensors);
}

async function delete_category(item, uuid) { var start_tensors = memory_leak_debugger();
	var category_nr = get_category_nr(item);

	$($(".own_image_upload_container")[category_nr]).remove();

	auto_adjust_number_of_neurons($(".own_image_label").length);

	show_or_hide_hide_delete_category();

	disable_start_training_button_custom_images();

	await rename_labels();

	$("#save_button_" + uuid).remove();
	memory_leak_debugger("delete_category", start_tensors);
}

function get_category_nr(elem) { var start_tensors = memory_leak_debugger();
	while (!$(elem).hasClass("own_image_upload_container")) {
		elem = $(elem).parent();
	}

	var nr = -1;
	var search_element_xpath = get_element_xpath(elem[0]);

	$(".own_image_upload_container").each(
		function (i, this_elem) {
			if (get_element_xpath(this_elem) == search_element_xpath) {
				nr = i;
			}
		}
	);

	memory_leak_debugger("get_category_nr", start_tensors);
	return nr;
}

function delete_custom_drawing_layer () { var start_tensors = memory_leak_debugger();
	var all_current_custom_images = $(".own_image_span");
	for (var i = 0; i < all_current_custom_images.length; i++) {
		var imgs = $(all_current_custom_images[i]).find("img,canvas");
		for (var j = 0; j < all_current_custom_images.length; j++) {
			try {
				var this_canvas_id = imgs[j].id;
				if($("#" + this_canvas_id + "_layer").length) {
					l("Deleting layer for custom image " + this_canvas_id);
					$("#" + this_canvas_id + "_layer").remove();
					$("#" + this_canvas_id + "_layer_colorpicker").remove()
					$("#" + this_canvas_id + "_layer_slider").remove()
					delete(atrament_data[this_canvas_id]);
				}
			} catch (e) {
				//console.log(e);
			}
		}
	}

	memory_leak_debugger("delete_custom_drawing_layer", start_tensors);
}

async function last_shape_layer_warning() { var start_tensors = memory_leak_debugger();
	if ($("#data_origin").val() == "image") {
		if (model.outputShape.length == 2) {
			is_classification = true;
			delete_custom_drawing_layer();
			$("#last_layer_shape_warning").html("");
		} else {
			if (model.outputShape.length != 4) {
				var n = $(".own_image_label").length;
				$("#last_layer_shape_warning").html("<h3>The last layer's output shape's length is neither 2 (for classification) nor 4 (for segmentation). Please add a flatten-layer somewhere before the output layer (which has to be Dense) to allow classification into " + n + " categories. Training will not be possible otherwise.</h3>");
			} else {
				$("#last_layer_shape_warning").html("");
				var all_current_custom_images = $(".own_image_span");
				for (var i = 0; i < all_current_custom_images.length; i++) {
					var canvasses = $(all_current_custom_images[i]).find("img,canvas");

					for (var j = 0; j < canvasses.length; j++) {
						var this_canvas_id = canvasses[j].id
						if(!this_canvas_id.endsWith("_layer")) {
							if($("#" + this_canvas_id + "_layer").length == 0) {
								l("Drawing layer for custom image " + this_canvas_id);
								addLayer(this_canvas_id, 0.5);
							}
						}
					}
				}

				is_classification = false;

				if($("#loss").val() != "meanSquaredError") {
					l("Setting loss to meanSquaredError");
					$("#loss").val("meanSquaredError").trigger("change");
				}
				if($("#metric").val() != "meanSquaredError") {
					$("#metric").val("meanSquaredError").trigger("change");
				}

				await change_last_responsible_layer_for_image_output();
			}
		}
	} else {
		$("#last_layer_shape_warning").html("");
	}
	memory_leak_debugger("last_shape_layer_warning", start_tensors);
}

function alter_text_webcam_series () { var start_tensors = memory_leak_debugger();
	var number = parseInt($("#number_of_series_images").val())
	var delaybetween = parseFloat($("#delay_between_images_in_series").val())

	var s = "&#128248; x " + number;
	if(!is_cosmo_mode) {
		s = s + " (" + (1 / delaybetween) + "/s)"
	}

	$(".webcam_series_button").html(s);
	memory_leak_debugger("alter_text_webcam_series", start_tensors);
}

function add_image_to_category (img, category) { var start_tensors = memory_leak_debugger();
	var imgDiv = $($(".own_images")[category]);
	var html = '<span class="own_image_span"><img height="90" src="' + img+ '" /><span onclick="delete_own_image(this)">&#10060;&nbsp;&nbsp;&nbsp;</span></span><br>';
	imgDiv.append(html);
	memory_leak_debugger("add_image_to_category", start_tensors);
}

async function add_new_category() { var start_tensors = memory_leak_debugger();
	var n = $(".own_image_label").length;

	var imgDiv = $(".own_images");
	var current_labels = [];

	var label_nr = n;
	var uuid = uuidv4();

	$(".own_image_label").each(function (i, x) {
		current_labels.push($(x).val());
	})

	while (current_labels.includes("label " + label_nr)) {
		label_nr++;
	}

	var k = 99999;

	if($(".own_image_upload_container").length <= 2) {
		k = $(".own_image_upload_container").length;
	}

	if (imgDiv.length == 0 || imgDiv.length <= n) {
		var webcam_button_style = "display: none";
		if(cam_data) {
			webcam_button_style = "";
		}

		var req = '';
		var c = '';
		if([0, 1].includes(k)) {
			var t = '';
			if(k == 0) {
				t = ``;
			} else {
				t = `,took_images[1]`;
			}

			req = `data-required_skills="show_webcam[1]${t}"`;
			if(is_cosmo_mode) {
				c = 'cosmo';
			}
		}

		var s = `<div class="own_image_upload_container" data-required_skills="loaded_page[1],finished_training[1],added_custom_category[2],show_webcam[1],set_custom_images[${k}],added_custom_category[${k}],drew_custom_image[1]">` +
			`<button style="${webcam_button_style}" class="hide_in_cosmo_mode large_button webcam_data_button" onclick="take_image_from_webcam(this)">&#128248; Webcam</button>` +
			`<button ${req} style="${webcam_button_style}" class="${c} large_button webcam_data_button webcam_series_button" data-dont_hide_after_show="1" onclick="take_image_from_webcam_n_times(this)">&#128248; x 10 (10/s)</button>` +
			`<button class="delete_category_button" onclick="delete_category(this, '${uuid}')">&#10060;</button></div>` +
			`<button id='save_button_${uuid}' style='border: 0; box-shadow: none;' class='large_button' data-required_skills="set_custom_images[${k}],drew_custom_image[${k}]" onclick="add_image_to_category($('#${uuid}_sketcher')[0].toDataURL(), ${label_nr});event.preventDefault();atrament_data['${uuid}_sketcher']['atrament'].clear();add_cosmo_point('saved_custom_image')">&#128190;</button><hr>` +
		`</div>`;

		$(s).appendTo("#own_images_container");

		var this_label = 'category ' + label_nr;

		if(is_cosmo_mode) {
			this_label = cosmo_categories[label_nr % cosmo_categories.length];
		}

		$('<form method="post" enctype="multipart/form-data"><input onkeyup="rename_labels(1)" class="own_image_label" value="' + this_label + '" /><input type="file" class="own_image_files" multiple accept="image/*"><br/></form>').prependTo($(".own_image_upload_container")[n]);

		$('<div class="own_images"></div>').appendTo($(".own_image_upload_container")[n]);

		get_drawing_board_on_page($(".own_image_upload_container")[n], uuid + "_sketcher", "");
	}

	imgDiv = $(".own_images")[n];

	init_own_image_files();

	auto_adjust_number_of_neurons($(".own_image_label").length);

	show_or_hide_hide_delete_category();

	await last_shape_layer_warning();

	alter_text_webcam_series();

	await rename_labels();

	await add_cosmo_point("added_custom_category");

	memory_leak_debugger("add_new_category", start_tensors);
	return uuid;
}

function addLayer(canvas_id, transparency) { var start_tensors = memory_leak_debugger();
	// Get the canvas element
	const canvas = document.getElementById(canvas_id);

	// Create a new canvas element for the layer
	const layer = document.createElement("canvas");
	layer.id = `${canvas_id}_layer`;
	layer.width = canvas.width;
	layer.height = canvas.height;
	layer.style.position = "absolute";
	layer.style.left = canvas.offsetLeft + "px";
	layer.style.top = canvas.offsetTop + "px";
	layer.style.backgroundColor = "white";
	layer.style.opacity = transparency;

	// Add the new canvas element to the document
	$("#" + canvas_id).parent().append(layer);

	// Create a new Atrament instance for the layer
	atrament_data[layer.id] = {};
	atrament_data[layer.id]["atrament"] = new Atrament(layer);

	clear_attrament(layer.id);

	// Create a transparency slider
	const transparency_slider = document.createElement("input");
	transparency_slider.id = layer.id + "_slider";
	transparency_slider.type = "range";
	transparency_slider.min = 0;
	transparency_slider.max = 1;
	transparency_slider.step = 0.01;
	transparency_slider.value = transparency;
	transparency_slider.style.position = "absolute";
	transparency_slider.style.left = canvas.offsetLeft + canvas.width + "px";
	transparency_slider.style.top = canvas.offsetTop + "px";
	transparency_slider.style.width = "100px";

	// Update the opacity of the layer when the slider value changes
	transparency_slider.addEventListener("input", function() {
		layer.style.opacity = this.value;
	});

	// Add the transparency slider to the document
	
	$("#" + canvas_id).parent().append("<br>");
	var color_picker_code = `<input type="text" name="value" id='${layer.id}_colorpicker' class="show_data jscolor" value="#000000" onchange="atrament_data['${layer.id}']['atrament'].color='#'+this.value;"  /><br>`;
	$("#" + canvas_id).parent().append(color_picker_code);
	atrament_data[layer.id]["colorpicker"] = new jscolor($("#" + layer.id + "_colorpicker")[0], {format:'rgb'});


	$("#" + canvas_id).parent().append("<br>Transparency:");
	$("#" + canvas_id).parent().append(transparency_slider);

	$("#" + canvas_id).parent().append("<br>Pen size:");
	$("#" + canvas_id).parent().append($(`<input class="show_data" type="range" min="1" oninput="atrament_data['${layer.id}']['atrament'].weight=parseFloat(event.target.value);" value="20" step="1" max="100" autocomplete="off">`));
	memory_leak_debugger("addLayer", start_tensors);
}


async function rename_labels() { var start_tensors = memory_leak_debugger();
	reset_labels();
	$(".own_image_label").each(function (i, x) {
		labels.push($(x).val());
	});

	await update_python_code(1);

	memory_leak_debugger("rename_labels", start_tensors);
}

function show_or_hide_hide_delete_category() { var start_tensors = memory_leak_debugger();
	if ($(".own_image_label").length > 1) {
		$(".delete_category_button").show();
	} else {
		$(".delete_category_button").hide();
	}
	memory_leak_debugger("show_or_hide_hide_delete_category", start_tensors);
}

function get_shown_advanced() { var start_tensors = memory_leak_debugger();
	var layer_options_internal = $(".layer_options_internal");

	var shown = [];

	for (var i = 0; i < layer_options_internal.length; i++) {
		var display = $(layer_options_internal[i]).css("display")
		if (display == "none") {
			shown[i] = 0;
		} else {
			shown[i] = 1;
		}
	}

	memory_leak_debugger("get_shown_advanced", start_tensors);

	return shown;
}

function set_shown_advanced(shown) { var start_tensors = memory_leak_debugger();
	for (var i = 0; i < shown.length; i++) {
		if (shown[i]) {
			$($(".layer_options_internal")[i]).css("display", "table-row-group");
		} else {
			$($(".layer_options_internal")[i]).css("display", "none");
		}
	}
	memory_leak_debugger("set_shown_advanced", start_tensors);
}

function show_head_data(head) { var start_tensors = memory_leak_debugger();
	var previous_values = [];
	$(".header_select").each((x, y) => { previous_values.push($(y).val()); });

	$("#csv_header_overview").html("");

	var html = "<h2>Header-to-Training-data</h2><table>";


	for (var i = 0; i < head.length; i++) {
		var x_selected = "";
		var y_selected = "";
		var none_selected = "";

		if(previous_values.length) {
			if (previous_values[i] == "X") {
				x_selected = "selected";
			} else if (previous_values[i] == "none") {
				none_selected = "selected";
			} else if (previous_values[i] == "Y") {
				y_selected = "selected";
			}
		} else {
			x_selected = "selected";
			none_selected = "";

			if (i == head.length - 1) {
				x_selected = "";
				y_selected = "selected";
			}
		}
		var select = "<select name='" + head[i] + "' onchange='show_csv_file(1)' class='header_select'><option " + x_selected + " value='X'>X</option><option " + y_selected + " value='Y'>Y</option><option value='none' " + none_selected + ">None</option></select>";
		if(!$("#auto_one_hot_y").is(":checked")) {
			select += ",<br>divide by: <input style='width: 30px;' value='1' type='number' onchange='show_csv_file(1)' class='header_divide_by' />";
		}

		html += "<tr><td>";
		html += head[i];
		html += "</td><td>";
		html += select;
		html += "<br>";
		html += "</td>";
		if(i != head.length - 1) {
			html += "<tr><td colspan=2><hr></td></th>";
		}
		html += "</tr>";
	}

	html += "</table>";
	$("#csv_header_overview").html(html);
	memory_leak_debugger("show_head_data", start_tensors);
}

async function show_csv_file(disabled_show_head_data) { var start_tensors = memory_leak_debugger();
	var csv = $("#csv_file").val();

	var data = parse_csv_file(csv);

	var head = data["head"];

	$("#x_y_shape_preview").html("");

	$(".hide_when_no_csv").hide();

	if (head.length > 1 && data.data.length >= 1) {
		if (!disabled_show_head_data) {
			show_head_data(head);
		}

		var parsed_data = await get_x_y_from_csv();

		if(typeof parsed_data == "string" && parsed_data == "incomplete") {
			return;
		}

		var y_between_0_and_1 = parsed_data["y_between_0_and_1"]

		if (!y_between_0_and_1) {
			if ($("#auto_set_last_layer_activation").is(":checked")) {
				var activations = $(".activation");
				$(activations[activations.length - 1]).val("linear").trigger("change");
			}
		}

		var new_input_shape = parsed_data.x.shape.slice(1);
		await set_input_shape("[" + new_input_shape.toString() + "]");
		var auto_adjust = $("#csv_auto_adjust_number_of_neurons").is(":checked");
		if(auto_adjust) {
			if (!parsed_data.is_one_hot_encoded && parsed_data.number_of_categories) {
				auto_adjust_number_of_neurons(parsed_data.number_of_categories);
			}
		}

		var shape_preview = "X-shape: [" + parsed_data.x.shape.join(", ") + "]<br>Y-shape: [" + parsed_data.y.shape.join(", ") + "]";

		var is_same = output_shape_is_same(parsed_data.y.shape, $("#outputShape").val())
		var shape_preview_color = "<div>";
		csv_allow_training = true;
		//shape_preview_color += "black";
		if (is_same) {
			if (auto_adjust) {
				await updated_page();
			}
			//shape_preview_color += "green";
		} else {
			//shape_preview_color += "red";
			//csv_allow_training = false;
		}
		//shape_preview_color += ">";

		shape_preview = shape_preview_color + shape_preview + "</div>";

		shape_preview += "<br>X: <pre>" + tensor_print_to_string(parsed_data.x) + "</pre>";

		if (parsed_data.x.dtype == "string") {
			csv_allow_training = false;
		}

		shape_preview += "<br>Y: <pre>" + tensor_print_to_string(parsed_data.y) + "</pre>";
		if (parsed_data.y.dtype == "string") {
			csv_allow_training = false;
		}

		if (csv_allow_training) {
			await hide_error();
		}

		if($("#auto_one_hot_y").is(":checked")) {
			if(labels.length) {
				shape_preview += "Generated encodings:<br>";
				for (var k = 0; k < labels.length; k++) {
					shape_preview += labels[k] + ": " + get_generated_encoding(k, labels.length) + "<br>";
				}
				l("Generated encodings");
			} else {
				l("Auto-encoding enabled, but no labels given");
			}
		}

		$("#x_y_shape_preview").html(shape_preview);
		$(".hide_when_no_csv").show();

		await dispose(parsed_data.x);
		await dispose(parsed_data.y);
	} else {
		$("#csv_header_overview").html("");
		csv_allow_training = false;
	}
	memory_leak_debugger("show_csv_file", start_tensors);
}

function get_generated_encoding(nr, max) { var start_tensors = memory_leak_debugger();
	var array = [];
	for (var i = 0; i < max; i++) {
		if(i == nr) {
			array.push(1);
		} else {
			array.push(0);
		}
	}

	var res = "[" + array.join(", ") + "]";

	memory_leak_debugger("get_generated_encoding", start_tensors);

	return res;
}

function ensure_shape_array(shape) { var start_tensors = memory_leak_debugger();
	if (typeof (shape) == "string") {
		return eval(shape);
	} else if (typeof (shape) == "object") {
		return shape;
	}
	console.warn("Is neither shape nor object: ", shape);
	memory_leak_debugger("ensure_shape_array", start_tensors)
}

function output_shape_is_same(output_shape_data, output_shape_network) { var start_tensors = memory_leak_debugger();
	output_shape_data = ensure_shape_array(output_shape_data);
	output_shape_network = ensure_shape_array(output_shape_network);

	var shape_length_difference = Math.abs(output_shape_data.length - output_shape_network.length);

	if (shape_length_difference <= 1) {
		if (!shape_length_difference == 0) {
			output_shape_data.unshift(null);
		}

		for (var i = 0; i < output_shape_network.length; i++) {
			var is_equal = output_shape_data[i] === output_shape_network[i] || output_shape_network[i] === null || output_shape_data[i] === null;
			if (!is_equal) {
				memory_leak_debugger("output_shape_is_same", start_tensors)
				return false;
			}
		}

		memory_leak_debugger("output_shape_is_same", start_tensors)
		return true;
	} else {
		memory_leak_debugger("output_shape_is_same", start_tensors)
		return false;
	}
}

function tensor_print_to_string(tensor) { var start_tensors = memory_leak_debugger();
	try {
		var logBackup = console.log;
		var logMessages = [];

		console.log = function () {
			logMessages.push.apply(logMessages, arguments);
		};

		tensor.print(1);

		console.log = logBackup;

		memory_leak_debugger("tensor_print_to_string", start_tensors)
		return logMessages.join("\n");
	} catch (e) {
		console.error("tensor_print_to_string failed:", e);

		memory_leak_debugger("tensor_print_to_string", start_tensors)
		return "<span class='error_msg'>Error getting tensor as string</span>";
	}
}

function contains_convolution() { var start_tensors = memory_leak_debugger();
	var number_of_layers = get_number_of_layers();
	for (var j = 0; j < get_number_of_layers(); j++) {
		var layer_type = $($(".layer_type")[j]).val();

		if (layer_type.includes("conv")) {
			memory_leak_debugger("contains_convolution", start_tensors);
			return true;
		}
	}

	memory_leak_debugger("contains_convolution", start_tensors);
	return false;
}

function disable_start_training_button_custom_images() { var start_tensors = memory_leak_debugger();
	if ($(".own_images").children().length != 0) {
		enable_train();
	} else {
		disable_train();
	}
	memory_leak_debugger("disable_start_training_button_custom_images", start_tensors);
}

async function write_error(e, fn, hide_swal) { var start_tensors = memory_leak_debugger();
	if (e) {
		var msg = e;

		if(Object.keys(e).includes("message")) {
			msg = e.message;
		}

		var explanation = explain_error_msg(e);

		if (explanation) {
			msg = msg + "\n<br><br>\n" + explanation;
		}

		$(".train_neural_network_button").html("Start training").removeClass("stop_training").addClass("start_training");
		await write_descriptions();
		console.warn(e);
		console.trace();

		if(!hide_swal) {
			Swal.fire({
				icon: 'error',
				title: 'Oops [5]...',
				html: msg
			});
		} else {
			l(msg);
		}
	} else {
		$("#error").html("No error found, but something went wrong").show().parent().hide();
	}

	if(typeof(fn) == "function") {
		fn();
	}

	await enable_everything();
	await write_descriptions();
	memory_leak_debugger("write_error", start_tensors);
}

async function hide_error() { var start_tensors = memory_leak_debugger();
	$("#error").html("").hide().parent().hide();
	await enable_everything();
	await write_descriptions();
	memory_leak_debugger("hide_error", start_tensors);
}

function find_layer_number_by_element(element) { var start_tensors = memory_leak_debugger();
	var item_parent = element;

	while (!$(item_parent).hasClass("layer_setting")) {
		item_parent = $(item_parent).parent();
		if (get_element_xpath($("body")[0]) == get_element_xpath(item_parent[0])) {
			write_error("Infinite recursion"); // cannot be async
			return;
		}
	}

	item_parent = $(item_parent).parent();

	var item_parent_xpath = get_element_xpath(item_parent[0]);
	var nr = null;

	$("#layers_container").children().each(function (counter, element) {
		if (get_element_xpath(element) == item_parent_xpath) {
			nr = counter;
		}
	});

	memory_leak_debugger("find_layer_number_by_element", start_tensors);

	return nr;
}

function get_layer_regularizer_config(layer_nr, regularizer_type) { var start_tensors = memory_leak_debugger();
	assert(valid_initializer_types.includes(regularizer_type), "insert_regularizer_trs(layer_nr, " + regularizer_type + ") is not a valid regularizer_type (2nd option)");
	assert(typeof (layer_nr) == "number", "get_layer_regularizer_config(" + layer_nr + "), layer_nr is not an integer but " + typeof (layer_nr));

	var starts_with_string = regularizer_type + "_regularizer_";

	var this_regularizer_options = $($(".layer_setting")[layer_nr]).find("." + regularizer_type + "_regularizer_tr").find(".input_data");

	var option_hash = {};

	for (var i = 0; i < this_regularizer_options.length; i++) {
		var this_option = this_regularizer_options[i];
		var classList = this_option.className.split(/\s+/);

		for (var j = 0; j < classList.length; j++) {
			if (classList[j].startsWith(starts_with_string)) {
				var option_name = classList[j];
				option_name = option_name.replace(starts_with_string, "");
				var value = get_item_value(layer_nr, classList[j]);
				if (looks_like_number(value)) {
					value = parseFloat(value);
				}
				if (value != "") {
					option_hash[option_name] = value;
				}
			}
		}
	}

	memory_leak_debugger("get_layer_regularizer_config", start_tensors)
	return option_hash;
}

function get_layer_initializer_config(layer_nr, initializer_type) { var start_tensors = memory_leak_debugger();
	assert(valid_initializer_types.includes(initializer_type), "insert_initializer_trs(layer_nr, " + initializer_type + ") is not a valid initializer_type (2nd option)");
	assert(typeof (layer_nr) == "number", "get_layer_initializer_config(" + layer_nr + "), layer_nr is not an integer but " + typeof (layer_nr));

	var starts_with_string = initializer_type + "_initializer_";

	var this_initializer_options = $($(".layer_setting")[layer_nr]).find("." + initializer_type + "_initializer_tr").find(".input_data");

	var option_hash = {};

	for (var i = 0; i < this_initializer_options.length; i++) {
		var this_option = this_initializer_options[i];
		var classList = this_option.className.split(/\s+/);

		for (var j = 0; j < classList.length; j++) {
			if (classList[j].startsWith(starts_with_string)) {
				var option_name = classList[j];
				option_name = option_name.replace(starts_with_string, "");
				var value = get_item_value(layer_nr, classList[j]);

				if (looks_like_number(value)) {
					value = parseFloat(value);
				}

				if (value !== "") {
					option_hash[option_name] = isNumeric(value) ? parseFloat(value) : value;
				}
			}
		}
	}

	memory_leak_debugger("get_layer_initializer_config", start_tensors);
	return option_hash;
}

function looks_like_number(item) { var start_tensors = memory_leak_debugger();
	if(typeof(item) == "number") {
		memory_leak_debugger("looks_like_number", start_tensors);
		return true;
	}

	if (/^[+-]?(?:(?:\d+(?:\.\d+)?))$/.test(item)) {
		memory_leak_debugger("looks_like_number", start_tensors);
		return true;
	}

	memory_leak_debugger("looks_like_number", start_tensors);
	return false;
}

async function set_default_input_shape() { var start_tensors = memory_leak_debugger();
	if (!changed_data_source) {
		return;
	}

	var default_config = await _get_configuration();

	if (default_config) {
		try {
			var default_input_shape = default_config["input_shape"];

			await set_input_shape(default_input_shape);

			await compile_model();

			await identify_layers(get_number_of_layers());

			await write_descriptions();
		} catch (e) {
			log(e);
		}
	}

	memory_leak_debugger("set_default_input_shape", start_tensors);
}

function allow_training() { var start_tensors = memory_leak_debugger();
	if (_allow_training()) {
		enable_train();
	} else {
		disable_train();
	}
	memory_leak_debugger("allow_training", start_tensors);
}

function _allow_training() { var start_tensors = memory_leak_debugger();
	if(has_missing_values) {
		return false;
	}

	if(has_zero_output_shape) {
		return false;
	}

	var data_origin = $("#data_origin").val();

	if (data_origin == "default") {
		return true;
	}

	var data_origin = $("#data_origin").val();
	if (data_origin == "image") {
		var number_of_training_images = $(".own_images").children().length;
		if (number_of_training_images) {
			return true;
		} else {
			return false;
		}
	} else if (data_origin == "csv") {
		return csv_allow_training;
	} else if (data_origin == "tensordata") {
		if (special_reason_disable_training) {
			return false;
		} else {
			if (x_file && y_file) {
				return true;
			} else {
				return false;
			}
		}
	}

	memory_leak_debugger("_allow_training", start_tensors);
}

async function show_layer_view() {
	$("#layers_container_left").show();
	$(".descriptions_of_layers").show();
	await write_descriptions();
	$("#toggle_layer_view_button").html("&#x1F5D6;");
}

function hide_layer_view () {
	$("#layers_container_left").hide();
	$(".descriptions_of_layers").hide();
	$("#toggle_layer_view_button").html("&#x1F5D7;");
}

async function toggle_layer_view() {
	if (is_hidden_or_has_hidden_parent($("#layers_container_left"))) {
		await show_layer_view();
	} else {
		hide_layer_view();
	}

	await write_descriptions();
}

function fix_viz_width () {
	$("#lenet").find("svg").attr("width", $("#lenet").css("width"));
	$("#fcnn").find("svg").attr("width", $("#fcnn").css("width"));
}

async function theme_choser () {
	var theme = $("#theme_choser").val();

	document.getElementById('css_mode').href = theme + '.css';
	document.getElementById('css_ribbon').href = 'ribbon' + theme + '.css';

	setCookie("theme", theme);

	await write_descriptions();
	await write_model_to_latex_to_page();
	await restart_fcnn();
	await restart_alexnet();

	invert_elements_in_dark_mode();
}

function move_to_demo_mode(element) {
	var old_parent = move_element_to_another_div(element, "#demomode");
	return old_parent;
}

// Returns: old parent div
function move_element_to_another_div(element, new_element_id) {
	var old_parent = $(element).parent();

	$(element).detach().appendTo(new_element_id);

	return old_parent;
}

async function repeat_while_demo() {
	await show_prediction()

	if (!(model.isTraining || started_training)) {
		await train_neural_network();
	}
}

async function start_demo_mode() {
	if (!(model.isTraining || started_training)) {
		train_neural_network(); // cannot be in async
	}

	await delay(1000);

	var potential_items_to_move = {
		"fcnn_tab": "fcnn_tab",
		"lenet_tab_label": "lenet",
		"alexnet_tab_label": "alexnet",
		"math_tab_label": "math_tab",
		"training_data_tab_label": "training_data_tab",
		"predictcontainer": "predictcontainer"
	};

	var potential_items_to_move_keys = Object.keys(potential_items_to_move);

	var items_to_move = [];

	for (var i = 0; i < potential_items_to_move_keys.length; i++) {
		var aria_hidden = $("#" + potential_items_to_move_keys[i]).attr("aria-hidden");
		var display_mode = $("#" + potential_items_to_move_keys[i]).css("display");
		log(potential_items_to_move_keys[i] + ", aria-hidden: " + aria_hidden + ", css-display: " + display_mode);
		if (display_mode != "none") {
			items_to_move.push(potential_items_to_move[potential_items_to_move_keys[i]]);
		}
	}

	log(items_to_move);

	for (var i = 0; i < items_to_move.length; i++) {
		demo_mode_data_origin[items_to_move[i]] = move_to_demo_mode("#" + items_to_move[i]);
		demo_mode_data_original_css[items_to_move[i]] = $("#" + items_to_move[i]).css("display");
		$("#" + items_to_move[i]).show();
	}

	$("#mainsite").hide();
	$("#demomode").show();

	await delay(5000);
	demo_interval = window.setInterval(repeat_while_demo, 10000);
}

async function end_demo_mode() {
	if (demo_interval) {
		window.clearInterval(demo_interval);
	}

	if (!(model.isTraining || started_training)) {
		train_neural_network(); // cannot be async
	}
	var demo_mode_keys = Object.keys(demo_mode_data_origin);
	for (var i = 0; i < demo_mode_keys.length; i++) {
		move_element_to_another_div("#" + demo_mode_keys[i], demo_mode_data_origin[demo_mode_keys[i]]);
		$("#" + demo_mode_keys[i]).css("display", demo_mode_data_original_css[demo_mode_keys[i]]);
	}

	$("#mainsite").show();
	$("#demomode").hide();

	await write_descriptions();
}

async function change_model_dataset() { var start_tensors = memory_leak_debugger();
	await load_weights(1);
	display_delete_button();
	memory_leak_debugger("change_model_dataset", start_tensors);
}

function allow_edit_inputShape() {
	l("Checking whether to allow editing input shape or not");
	if ($("#auto_input_shape").is(":checked")) {
		$("#inputShape").attr("readonly", true);
	} else {
		$("#inputShape").attr("readonly", false);
	}
}

function show_ribbon() {
	$("#ribbon").show();
	$("#ribbon_shower").hide();
	$("#status_bar").show();
}

function hide_ribbon() {
	$("#ribbon").hide();
	$("#ribbon_shower").show();
	$("#status_bar").hide();
}

function human_readable_time_german(seconds) {
	if (!seconds) {
		return "eine Sekunde";
	}
	var levels = [
		[Math.floor(seconds / 31536000), 'Jahre'],
		[Math.floor((seconds % 31536000) / 86400), 'Tage'],
		[Math.floor(((seconds % 31536000) % 86400) / 3600), 'Stunden'],
		[Math.floor((((seconds % 31536000) % 86400) % 3600) / 60), 'Minuten'],
		[(((seconds % 31536000) % 86400) % 3600) % 60, 'Sekunden'],
	];
	var returntext = '';

	for (var i = 0, max = levels.length; i < max; i++) {
		if (levels[i][0] === 0) continue;
		returntext += ' ' + levels[i][0] + ' ' + (levels[i][0] === 1 ? levels[i][1].substr(0, levels[i][1].length - 1) : levels[i][1]);
	};
	return returntext.trim();
}

function human_readable_time(seconds) {
	if (!seconds) {
		return "1 sec";
	}
	var levels = [
		[Math.floor(seconds / 31536000), 'years'],
		[Math.floor((seconds % 31536000) / 86400), 'days'],
		[Math.floor(((seconds % 31536000) % 86400) / 3600), 'hours'],
		[Math.floor((((seconds % 31536000) % 86400) % 3600) / 60), 'mins'],
		[(((seconds % 31536000) % 86400) % 3600) % 60, 'secs'],
	];
	var returntext = '';

	for (var i = 0, max = levels.length; i < max; i++) {
		if (levels[i][0] === 0) continue;
		returntext += ' ' + levels[i][0] + ' ' + (levels[i][0] === 1 ? levels[i][1].substr(0, levels[i][1].length - 1) : levels[i][1]);
	};
	return returntext.trim();
}

function delete_own_image(elem) {
	$(elem).parent().next().remove()
	$(elem).parent().remove();
}

function larger_maximally_activated_neurons() {
	$(".layer_image").css({ height: '+=50px', width: '+=50px' })
}

function smaller_maximally_activated_neurons() {
	$(".layer_image").css({ height: '-=50px', width: '-=50px' })
	if ($(".layer_image").css("width") == "0px") {
		$(".layer_image").css({ height: 'auto', width: 'auto' })
	}
}

function reset_maximally_activated_neurons() {
	$(".layer_image").css({ height: 'auto', width: 'auto' })
}

function delete_maximally_activated_predictions() {
	$(".maximally_activated_predictions").remove();
}

async function predict_all_maximally_activated_neurons() {
	await $(".layer_image").each(async function (i, x) {
		await predict_maximally_activated(x, 'image');
	});
}

async function get_layers_container_md5() {
	await delay(1);
	var layers_container_str = "";
	$("#layers_container").find("select,input,checkbox").each(function (i, x) {
		x = $(x);
		layers_container_str += x.attr("class") + "=" + x.val() + ";;;";
	})

	return await md5(layers_container_str);
}

function rename_tmp_onchange() {
	$("*[_onchange]").each(function (i, x) {
		var elem = $(this);
		elem.attr("onchange", elem.attr('_onchange'));
		elem.removeAttr('_onchange');
	})
}

function hide_tab_label(label) {
	assert(typeof(label) == "string", "label is not a string");

	$("#" + label).parent().hide();
	var children = $("#" + label).parent().parent().children();

	var currently_selected = null;
	var first_displayable = null;

	for (var i = 0; i <= children.length; i++) {
		if (!currently_selected && $(children[i]).attr("aria-expanded") == "true") {
			currently_selected = children[i];
		}

		if (!first_displayable && $(children[i]).css("display") != "none") {
			first_displayable = children[i];
		}
	}

	if (first_displayable && (is_cosmo_mode || is_hidden_or_has_hidden_parent(currently_selected))) {
		$($(first_displayable).children()[0]).click()
	}

	updateTranslations();
}

function show_tab_label(label, click) {
	assert(typeof(label) == "string", "label is not a string");

	var $item = $("#" + label);
	assert($item.length == 1, "Invalid or double $item for label " + label);

	if(is_cosmo_mode) {
		if(click) {
			var href = $item[0].id.replace(/_label$/, "");
			var element_to_show = $("#" + href);

			assert(element_to_show.length == 1, "invalid element");

			$(".tab").each((i, x) => {
				$(x).hide();
			});

			element_to_show.show().parent().show().parent().show();
		}
	} else {
		$item.show().parent().show();

		if(click) {
			$item.trigger("click");
		}
	}

	updateTranslations();
}

function check_number_values() {
	var all_fields = document.querySelectorAll('input[type="number"]');
	var default_bg_color = $("input").css("background-color");

	var missing_values = 0;

	for (var i = 0; i < all_fields.length; i++) {
		var item = $(all_fields[i]);
		var val = item.val();

		if (!isNumeric(val)) {
			if(!$(all_fields[i]).hasClass("no_red_on_error")) {
				item.css("background-color", "red");
			}
			missing_values++;
		} else {
			val = parseFloat(val);
			item.css("background-color", default_bg_color);

			var max = parseFloat(item.attr("max"));
			var min = parseFloat(item.attr("min"));

			if (max) {
				if (val > max) {
					item.val(max).trigger("change");
				}
			}

			if (min) {
				if (val < min) {
					item.val(min).trigger("change");
				}
			}

		}
	};
	
	if(missing_values) {
		has_missing_values = true;
		disable_train();
	} else {
		has_missing_values = false;
		if(!shown_has_zero_data) {
			enable_train();
		}
	}
}

function summary_to_table(lines) {
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
			table += "<tr><t" + d_or_h + ">" + new_array[i].join("</t" + d_or_h + "><t" + d_or_h + ">") + "</t" + d_or_h + "></tr>\n"
		} else {
			table += "<tr><td colspan=" + colspan_nr + ">" + new_array[i] + "</td></tr>\n";
		}
	}

	table += "</table>\n";
	return "<center>" + table + "</center>";
}

function plotly_show_loss_graph() {
	tf.tidy(() => {
		var y_true_table = [];
		$(".data_table_y_true").each((i, x) => {
			y_true_table[i] = [i, parseFloat($(x).val())]
		});

		var y_pred_table = [];
		$(".data_table_y_pred").each((i, x) => {
			y_pred_table[i] = [i, parseFloat($(x).val())]
		});

		var y_true = tf.tensor2d(y_true_table);
		var y_pred = tf.tensor2d(y_pred_table);

		var trace1 = {
			x: y_true.arraySync().map(x => x[0]),
			y: y_true.arraySync().map(x => x[1]),
			mode: 'markers',
			type: 'scatter',
			name: "Ground Thruth"
		};

		var trace2 = {
			x: y_pred.arraySync().map(x => x[0]),
			y: y_pred.arraySync().map(x => x[1]),
			mode: 'markers',
			type: 'scatter',
			name: "Prediction"
		};

		var plot_data = [trace1, trace2];

		var data = [
			{ "name": "meanAbsoluteError", "fn": tf.metrics.meanAbsoluteError },
			{ "name": "meanSquaredError", "fn": tf.metrics.meanSquaredError },
			{ "name": "meanAbsolutePercentageError", "fn": tf.metrics.MAPE },
			{ "name": "precision", "fn": tf.metrics.precision },
			//{"name": "recall", "fn": tf.metrics.recall},
			{ "name": "cosineProximity", "fn": tf.metrics.cosineProximity },
			{ "name": "binaryCrossentropy", "fn": tf.metrics.binaryCrossentropy },
			{ "name": "binaryAccuracy", "fn": tf.metrics.binaryAccuracy },
			{ "name": "categoricalCrossentropy", "fn": tf.metrics.categoricalCrossentropy },
			{ "name": "categoricalAccuracy", "fn": tf.metrics.categoricalAccuracy },
		];

		for (var i = 0; i < data.length; i++) {
			var fn = data[i]["fn"];
			var name = data[i]["name"]

			var loss = fn(y_true, y_pred);

			plot_data.push({
				x: y_pred.arraySync().map(x => x[0]),
				y: loss.arraySync(),
				mode: 'lines',
				type: 'scatter',
				name: name
			});
		}


		Plotly.newPlot('explanation', plot_data);
	});

	write_descriptions(); // cannot be async
}

function add_row_to_plotly_loss() {
	$('#data_table tbody tr:last').clone().insertAfter('#data_table tbody tr:last');

	plotly_show_loss_graph();

	if ($($($($("#table_div").children()[0])[0]).children()[0]).children().length > 3) {
		$(".delete_row").prop("disabled", false);
	} else {
		$(".delete_row").prop("disabled", true);
	}

	write_descriptions(); // cannot be async
}

function remove_plotly_table_element(item) {
	var item_parent_parent = $(item).parent().parent();
	if (item_parent_parent.parent().children().length <= 4) {
		$(".delete_row").prop("disabled", true);
	} else {
		$(".delete_row").prop("disabled", false);
	}
	item_parent_parent.remove();
	plotly_show_loss_graph();
}

function create_plotly_table() {
	var str = `<table id="data_table" border=1 style="border-collapse: collapse;">` +
		`	<tr>` +
		`		<th>Y true</th>` +
		`		<th>Y pred</th>` +
		`		<th>Delete</th>` +
		`	</tr>` +
		`	<tr>` +
		`		<td colspan=3><button onclick="add_row_to_plotly_loss()">Add new data</button></td>` +
		`	</tr>`;

	for (var i = 0; i < example_plotly_data.length; i++) {
		str += `	<tr>` +
			`		<td><input onkeyup="plotly_show_loss_graph()" onchange="plotly_show_loss_graph()" type="number" class="data_table_y_true" value="${example_plotly_data[i][0]}" /></td>` +
			`		<td><input onkeyup="plotly_show_loss_graph()" onchange="plotly_show_loss_graph()" type="number" class="data_table_y_pred" value="${example_plotly_data[i][1]}" /></td>` +
			`		<td>` +
			`			<button class='delete_row' onclick="remove_plotly_table_element(this)">&#10060;</button>` +
			`		</td>` +
			`	</tr>`;
	}

	str += `</table>`;

	$("#table_div").html(str);

	write_descriptions(); // cannot be async
}

function add_loss_functions_to_plotly_visualizer(data) {
	create_plotly_table();
	plotly_show_loss_graph();
}

function setCookie(name, value, days = 365) {
	var expires = "";
	if (days) {
		var date = new Date();
		date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
		expires = "; expires=" + date.toUTCString();
	}

	// Set SameSite and secure attributes
	var cookieOptions = "; SameSite=None; secure";

	document.cookie = name + "=" + (value || "") + expires + "; path=/" + cookieOptions;
}

function getCookie(name) {
	var nameEQ = name + "=";
	var ca = document.cookie.split(';');
	for(var i=0;i < ca.length;i++) {
		var c = ca[i];
		while (c.charAt(0)==' ') c = c.substring(1,c.length);
		if (c.indexOf(nameEQ) == 0) return c.substring(nameEQ.length,c.length);
	}
	return null;
}

function eraseCookie(name) {
	document.cookie = name +'=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;';
}

function copy_options () {
	var selects = $(".copy_options");
	for (var i = 0; i  < selects.length; i++) {
		var sink = $(selects[i]);
		var sink_id = sink.attr("id");

		var origin = $("#" + $(selects[i]).data("from_and_to"));
		var origin_id = origin.attr("id");

		sink.html("");

		var options = $("#" + origin_id + " > option").clone();
		sink.append(options);

		sink.change(function (o, s) {
			return function (e) {
				$("#" + o).val($("#" + s).val()).trigger("change");
				copy_options();
				$("#" + s).val($("#" + o).val());
			};
		}(origin_id, sink_id));
	}
}

function copy_values() {
	var inputs = $(".copy_values");
	for (var i = 0; i  < inputs.length; i++) {
		var sink = $(inputs[i]);
		var origin = $("#" + $(inputs[i]).data("from_and_to"));
		$(sink).val(origin.val());

		var possible_values = ["min", "max", "step"];

		for (var j = 0; j < possible_values.length; j++) {
			if(origin.attr(possible_values[j])) {
				sink.attr(possible_values[j], origin.attr(possible_values[j]));
			}
		}

		var origin_id = origin.attr("id");
		var sink_id = sink.attr("id");

		sink.change(function(o, s){
			return function(e){
				$("#" + o).val($("#" + s).val());
			};
		}(origin_id, sink_id));

	}
}

function realWidth(obj) { var start_tensors = memory_leak_debugger();
	var clone = obj.clone();
	clone.css("visibility","hidden");
	$('body').append(clone);
	var w = clone.outerWidth();
	clone.remove();
	memory_leak_debugger("realWidth", start_tensors);
	return w;
}

function realHeight(obj) { var start_tensors = memory_leak_debugger();
	var clone = obj.clone();
	clone.css("visibility","hidden");
	$('body').append(clone);
	var h = clone.outerHeight();
	clone.remove();
	memory_leak_debugger("realHeight", start_tensors);
	return h;
}

async function get_training_data_as_json () { var start_tensors = memory_leak_debugger();
	force_download = 1;
	var training_data = await get_xs_and_ys()
	force_download = 0;

	training_data.x = await training_data.x.arraySync()
	training_data.y = await training_data.y.arraySync()

	await dispose(training_data["x"]);
	await dispose(training_data["y"]);

	memory_leak_debugger("get_training_data_as_json", start_tensors);
	return JSON.stringify(training_data);
}

function l(msg) { var start_tensors = memory_leak_debugger();
	if(last_l != msg) {
		var load_time = Date().toLocaleString();
		load_time = load_time.replace(/ GMT.*/, "");
		$("#log").prepend(load_time + ": " + msg + "\n")
		last_l = msg;
		if(msg.toString().startsWith("ERROR:") || msg.toString().startsWith("TypeError:")) {
			console.error(msg);
			console.trace();
			msg = "<span style='color: red'>" + msg + "</span>";
		}
		$("#status_bar_log").html(msg);
	}
	memory_leak_debugger("l", start_tensors);
}

async function set_custom_image_training () { var start_tensors = memory_leak_debugger();
	if($("#data_origin").val() != "image") {
		$("#data_origin").val("image").trigger("change");
	}
	memory_leak_debugger("set_custom_image_training", start_tensors);
}


async function set_custom_webcam_training_data() { var start_tensors = memory_leak_debugger();
	if(!is_hidden_or_has_hidden_parent($("#own_image_data"))) {
		return;
	}

	await init_webcams();


	if($("#data_origin").val() != "image") {
		$.when($("#data_origin").val("image").trigger("change")).done(async function(){
			if(!cam_data) {
				await get_data_from_webcam();
			}

			if(!cam) {
				await show_webcam();
				await add_cosmo_point("show_webcam");
			}
		});
	} else {
		if(!cam_data) {
			await get_data_from_webcam();
		}

		if(!cam) {
			await show_webcam();
		}

		show_tab_label("own_image_data_label", 1);
	}

	await add_cosmo_point("set_custom_images");
	memory_leak_debugger("set_custom_webcam_training_data", start_tensors);
}

async function toggle_layers() { var start_tensors = memory_leak_debugger();
	$(".left_side").toggle();

	await write_descriptions(1);
	
	if(is_cosmo_mode && !$(".left_side").attr("data-clicked")) {
		await add_cosmo_point("toggled_layers");
		$(".left_side").attr("data-clicked", 1)
	}
	memory_leak_debugger("toggle_layer", start_tensors);
}

async function get_available_cams () { var start_tensors = memory_leak_debugger();
	var webcams = [];
	var ids = [];

	await navigator.mediaDevices.enumerateDevices().then(function (devices) {
		for(var i = 0; i < devices.length; i++){
			var device = devices[i];
			if (device.kind === 'videoinput') {
				webcams.push(device.label);
				ids.push(device.deviceId);
			}
		};
	});

	memory_leak_debugger("get_available_cams", start_tensors);
	return [webcams, ids];
}

async function switch_to_next_camera () { var start_tensors = memory_leak_debugger();
	webcam_id++;
	webcam_id = webcam_id % (webcam_modes.length);
	await get_data_from_webcam(1);

	memory_leak_debugger("switch_to_next_camera", start_tensors);
}

function swalmsg (msg) { var start_tensors = memory_leak_debugger();
	l(msg);
	log(msg);
	var res = Swal.fire({
		title: msg,
		allowEscapeKey: false,
		allowOutsideClick: false,
		showConfirmButton: false
	});

	memory_leak_debugger("swalmsg", start_tensors);

	return res;
}

async function highlight_code () { var start_tensors = memory_leak_debugger();
	Prism.highlightAll();
	memory_leak_debugger("highlight_code", start_tensors);
}

async function easter_egg_fireworks (force=0) { var start_tensors = memory_leak_debugger();
	if(in_fireworks) {
		return;
	}

	fireworks_counter++;
	console.warn(fireworks_counter);

	if(force || fireworks_counter && fireworks_counter % 10 == 0) {
		$(".fireworks-container").show();
		in_fireworks = true;
		var fw = new Fireworks(document.querySelector('.fireworks-container'))
		fw.start();
		await delay(10000);
		fw.stop();
		in_fireworks = false;
		$(".fireworks-container").html("").hide();
	}

	memory_leak_debugger("easter_egg_fireworks", start_tensors);
}

async function init_webcams () { var start_tensors = memory_leak_debugger();
	if(inited_webcams) {
		memory_leak_debugger("init_webcams", start_tensors);
		return;
	}

	inited_webcams = true;
	l("Checking webcams");

	var available_webcam_data = await get_available_cams();
	available_webcams = available_webcam_data[0];
	available_webcams_ids = available_webcam_data[1];

	l("Number of available cams: " + available_webcams.length);

	if(available_webcams.length) {
		l("Webcam(s) were found. Enabling webcam related features.");
		l("List of found webcams: " + available_webcams.join(", "));
		$(".only_when_webcam").show();

		if(await hasBothFrontAndBack()) {
			$(".only_when_front_and_back_camera").show();
		} else {
			$(".only_when_front_and_back_camera").hide();
		}

		if(available_webcams.length > 1) {
			$(".only_when_multiple_webcams").show();
			for (var i = 0; i < available_webcams.length; i++) {
				$('#which_webcam').append($('<option>', {
					value: i,
					text: available_webcams[i]
				}));
			}
		} else {
			$(".only_when_multiple_webcams").hide();
		}
	} else {
		l("No webcams were found. Disabling webcam related features.");
		$(".only_when_webcam").hide();
		$(".only_when_multiple_webcams").hide();
		$(".only_when_front_and_back_camera").hide();
	}

	l("Done checking webcams");

	memory_leak_debugger("init_webcams", start_tensors);
}

function show_hide_augment_tab () { var start_tensors = memory_leak_debugger();
	if($("#auto_augment").is(":checked")) {
		l("Showing Augmentation tab");
		$('a[href*="tf_ribbon_augmentation"]').show().parent().show();
	} else {
		l("Hiding Augmentation tab");
		$('a[href*="tf_ribbon_augmentation"]').hide().parent().hide();
	}
	memory_leak_debugger("show_hide_augment_tab", start_tensors);
}

function get_last_layer_activation_function () { var start_tensors = memory_leak_debugger();
	var layers_container_children = $("#layers_container").children();
	var number_of_layers = layers_container_children.length;

	var last_layer = $(layers_container_children[number_of_layers - 1]);

	var res = last_layer.find(".activation").val();

	memory_leak_debugger("get_last_layer_activation_function", start_tensors);

	return res;
}

function drag_start(event) { var start_tensors = memory_leak_debugger();
	var style = window.getComputedStyle(event.target, null);
	var str = (parseInt(style.getPropertyValue("left")) - event.clientX) + ',' + (parseInt(style.getPropertyValue("top")) - event.clientY) + ',' + event.target.id;
	event.dataTransfer.setData("Text", str);
	memory_leak_debugger("drag_start", start_tensors);
}

function drop(event) { var start_tensors = memory_leak_debugger();
	var offset = event.dataTransfer.getData("Text").split(',');
	var dm = document.getElementById(offset[2]);
	dm.style.left = (event.clientX + parseInt(offset[0], 10)) + 'px';
	dm.style.top = (event.clientY + parseInt(offset[1], 10)) + 'px';
	event.preventDefault();

	memory_leak_debugger("drop", start_tensors);

	return false;
}

function drag_over(event) { var start_tensors = memory_leak_debugger();
	event.preventDefault();
	memory_leak_debugger("drag_over", start_tensors);
	return false;
}

function get_layer_nr_by_name (layer_name) { var start_tensors = memory_leak_debugger();
	for (var i = 0; i < model.layers.length; i++) {
		if(model.layers[i].getConfig().name == layer_name) {
			memory_leak_debugger("get_layer_nr_by_name", start_tensors);
			return i;
		}
	}

	memory_leak_debugger("get_layer_nr_by_name", start_tensors);
	return -1;
}

function set_layer_background(nr, color) { var start_tensors = memory_leak_debugger();
	$($(".layer_setting")[nr]).css("background-color", color)
	memory_leak_debugger("set_layer_background", start_tensors);
}

function set_model_layer_warning(i, warning) { var start_tensors = memory_leak_debugger();
	assert(typeof(i) == "number", i + " is not a number");
	assert(typeof(warning) == "string", warning + " is not a string");

	if(warning) {
		$($(".warning_layer")[i]).html(warning).show().parent().show();
	} else {
		$($(".warning_layer")[i]).html("").hide().parent().hide();
	}
	memory_leak_debugger("set_model_layer_warning", start_tensors);
}

function download(filename, text) { var start_tensors = memory_leak_debugger();
	var element = document.createElement('a');
	element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
	element.setAttribute('download', filename);

	element.style.display = 'none';
	document.body.appendChild(element);

	element.click();

	document.body.removeChild(element);
	memory_leak_debugger("download", start_tensors);
}

async function download_current_data_as_json () {
	download("data.json", JSON.stringify(await get_x_y_as_array())) 
}

function scroll_down_div (classname) { var start_tensors = memory_leak_debugger();
	var items = $('.' + classname);
	for (var i = 0; i < items.length; i++) {
		items.scrollTop(items[i].scrollHeight - $(items[i]).height());
	}

	memory_leak_debugger("scroll_down_div", start_tensors);
}

async function download_model_for_training (m) { var start_tensors = memory_leak_debugger();
	var data = {
		"model": JSON.parse(m.toJSON()),
		"fit_data": get_fit_data(),
		"model_data": await get_model_data(),
		"weights": await get_weights_as_json(),
		"data": await get_x_y_as_array()
	};

	$.ajax({
		'type': 'POST',
		'url': 'submit.php?zip=1',
		'data': {
			"data": JSON.stringify(data)
		},
		'success': async function(response) {
			var a = document.createElement("a"); //Create <a>
			a.href = "data:application/zip;base64," + response; //Image Base64 Goes here
			a.download = "model.zip"; //File name Here
			a.click(); //Downloaded file
		}
	});
	memory_leak_debugger("download_model_for_training", start_tensors);
}

function clear_attrament (idname) { var start_tensors = memory_leak_debugger()
	if(!atrament_data) {
		console.warn("atrament_data not defined");
		return;
	}

	/*
	if(Object.keys(atrament_data).includes(idname)) {
		console.warn(`${idname} is not a key of atrament_data`);
		return;
	}
	*/

	try {
		atrament_data[idname]['atrament'].context.fillStyle = "#ffffff";
		atrament_data[idname]['atrament'].context.fillRect(
			0, 
			0, 
			atrament_data[idname]['atrament'].canvas.width, 
			atrament_data[idname]['atrament'].canvas.height
		);
	} catch (e) {
		console.error(e);
	}

	memory_leak_debugger("clear_attrament", start_tensors);
}

function invert_elements_in_dark_mode () { var start_tensors = memory_leak_debugger();
	var is_dark_mode = $("#theme_choser").val() == 'darkmode' ? true : false;

	var el = $(".invert_in_dark_mode");

	el.removeClass("dark_mode_inverted");

	if(is_dark_mode) {
		el.addClass("dark_mode_inverted");
	}

	memory_leak_debugger("invert_elements_in_dark_mode", start_tensors);
}

function green_marker (element) { var start_tensors = memory_leak_debugger();
	$(element).parent().parent().find(".green_icon").removeClass("green_icon")
	$(element).addClass("green_icon");
	memory_leak_debugger("green_marker", start_tensors);
}

function get_drawing_board_on_page (indiv, idname, customfunc) { var start_tensors = memory_leak_debugger();
	//logt("get_drawing_board_on_page");
	if(!customfunc) {
		customfunc = "";
	}

	var k = 99999;

	if($(".own_image_upload_container").length <= 2) {
		k = $(".own_image_upload_container").length;
	}

	var classes = "";
	var required_skills = "";



	if(idname != "sketcher") {
		if(is_cosmo_mode) {
			classes = " cosmo";
		}
		required_skills = ' data-required_skills="took_images[4]" ';
	//} else {
	//	log(`!!!!!!${idname}!!!!!!`)
	}

	var code = `<form class='no_mark${classes}' ${required_skills} onkeydown="return event.key != 'Enter';">
		<span class='invert_in_dark_mode'><a class='atrament_buttons green_icon' onclick="atrament_data['${idname}']['atrament'].mode = 'brush'; $(this).parent().find('.pen_size_slider').show(); $(this).parent().find('.jscolor').show(); green_marker(this); hide_colorpicker_for_eraser('${idname}');"><img width=32 src='pen.png'/></a></span>
		<span class='invert_in_dark_mode'><a class='atrament_buttons' onclick="atrament_data['${idname}']['atrament'].mode = 'fill'; $(this).parent().find('.pen_size_slider').hide(); $(this).parent().find('.jscolor').show(); green_marker(this); hide_colorpicker_for_eraser('${idname}');"><img width=32 src='Fill-icon.svg'></a></span>
		<span class='invert_in_dark_mode'><a class='atrament_buttons' onclick="atrament_data['${idname}']['atrament'].mode = 'erase'; $(this).parent().find('.pen_size_slider').show(); $(this).parent().find('.jscolor').hide(); green_marker(this); hide_colorpicker_for_eraser('${idname}');"><img width=32 src='Eraser_icon.svg'/></a></span>
		&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
		<span onclick="clear_attrament('${idname}');${customfunc}" class='atrament_buttons_small'>&#10060;</span><br>
		<span class='colorpicker_elements'>
			<img onclick='chose_nearest_color_picker(this)' src='colorpicker.svg' width=32 />
			<input type="text" name="value" id='${idname}_colorpicker' class="show_data jscolor" style='width: 50px' value="#000000" onchange="atrament_data['${idname}']['atrament'].color='#'+this.value;" />
		</span>
		<input class="show_data pen_size_slider" type="range" min="1" oninput="atrament_data['${idname}']['atrament'].weight = parseFloat(event.target.value);" value="20" step="1" max="100" autocomplete="off" />
		<br />
		<canvas style="z-index: 2; margin: 5px; position: relative; outline: solid 1px black; width: 200px; height: 200px" width=200 height=200 id="${idname}"></canvas>
	</form>`;

	var drawingboard = $(code);

	$(indiv).append(drawingboard);

	atrament_data[idname] = {};

	// Drawings code
	// first, we need to set up the canvas
	atrament_data[idname]["canvas"] = document.getElementById(idname);
	atrament_data[idname]["canvas"] .style.cursor = 'crosshair';
	// instantiate Atrament
	atrament_data[idname]["atrament"] = new Atrament(
		atrament_data[idname]["canvas"], {
			width: atrament_data[idname]["canvas"].offsetWidth,
			height: atrament_data[idname]["canvas"].offsetHeight
		}
	);

	var ctx = atrament_data[idname]["canvas"] .getContext("2d");
	ctx.fillStyle = "white";
	ctx.fillRect(0, 0, atrament_data[idname]["canvas"].width, atrament_data[idname]["canvas"].height);

	// a little helper tool for logging events
	const eventsLog = [];
	const logElement = document.getElementById('events');

	atrament_data[idname]["atrament"].addEventListener('clean', () => {
		if(customfunc) {
			eval(customfunc);
		}
	});

	atrament_data[idname]["atrament"].addEventListener('fillstart', ({ x, y }) => {
		atrament_data[idname]["canvas"].style.cursor = 'wait';
		if(customfunc) {
			eval(customfunc);
		}
	});

	atrament_data[idname]["atrament"].addEventListener('fillend', () => {
		atrament_data[idname]["canvas"].style.cursor = 'crosshair';
		if(customfunc) {
			eval(customfunc);
		}
	});

	atrament_data[idname]["atrament"].addEventListener('strokeend', async () => {
		if(customfunc) {
			eval(customfunc);
		}

		if(idname != "sketcher") {
			await add_cosmo_point("drew_custom_image");
		}
	});

	atrament_data[idname]["atrament"].adaptiveStroke = true;

	atrament_data[idname]["colorpicker"] = new jscolor($("#" + idname + "_colorpicker")[0], {format:'rgb'});

	atrament_data[idname]['atrament'].weight = 20;
	memory_leak_debugger("get_drawing_board_on_page", start_tensors);
}

function chose_nearest_color_picker (e) { var start_tensors = memory_leak_debugger();
	var input = $(e).parent().find("input");

	var id = $(input)[0].id.replace(/_colorpicker$/, "")

	atrament_data[id].colorpicker.show()
	
	memory_leak_debugger("chose_nearest_color_picker", start_tensors);
}

async function onclick_math_mode (t, e) { var start_tensors = memory_leak_debugger();
	await write_model_to_latex_to_page(0, 1);
	memory_leak_debugger("onclick_math_mode", start_tensors);
}

async function set_all_strides () { var start_tensors = memory_leak_debugger();
	var n = $("#all_strides_val").val();
	await _set_all_strides(n);
	if(looks_like_number(n)) {
		$("#all_strides_val").val("");
	}

	memory_leak_debugger("set_all_strides", start_tensors);
}

async function _set_all_strides (n) { var start_tensors = memory_leak_debugger();
	assert(typeof(n) == "number" || looks_like_number(n), n + " is not an integer and does not look like one");
	n = parseInt(n);

	$(".strides_z").val(n);
	$(".strides_y").val(n);
	$(".strides_x").val(n);

	$($(".strides_x")[0]).trigger("change");

	memory_leak_debugger("_set_all_strides", start_tensors);
}

function hide_empty_tabs (name) {
	var c = $("#" + name).children();

	for (var i = 0; i < c.length; i++) {
		if($(c[i]).css("display") != "none") {
			$("[href='#" + name + "']").parent().show()
			return;
		}
	}

	if($("[href='#" + name + "']").parent().hasClass("ui-state-active")) {
		$("[href='#home_ribbon']").click();
	}

	$("[href='#" + name + "']").parent().hide()
}

function getCanvasBlob(canvas) {
	return new Promise(function(resolve, reject) {
		canvas.toBlob(function(blob) {
			resolve(blob)
		})
	})
}


async function create_zip_with_custom_images () { var start_tensor = memory_leak_debugger();
	const zipWriter = new zip.ZipWriter(new zip.BlobWriter("application/zip"));

	var canvasses = $(".own_image_span").find("canvas");

	for (var i = 0; i < canvasses.length; i++) {
		var canvas = canvasses[i];

		var blob = await getCanvasBlob(canvas);

		var label = $(canvas).parent().parent().parent().find(".own_image_label").val();

		var filename = canvas.id

		await zipWriter.add(label + "/" + filename + ".png", new zip.BlobReader(blob));
	}
	var res = zipWriter.close();
	memory_leak_debugger("create_zip_with_custom_images", start_tensor);
	return res;
}

function downloadFile(blob) { var start_tensors = memory_leak_debugger();
	var new_child = Object.assign(document.createElement("a"), {
		className: "download_link",
		download: "custom_images.zip",
		href: URL.createObjectURL(blob),
		textContent: "Download zip file",
	});

	$("#download_zip_file").html(new_child);

	memory_leak_debugger("downloadFile", start_tensors);
}

function saveFile (name, type, data) { var start_tensors = memory_leak_debugger();
	if (data !== null && navigator.msSaveBlob)
		return navigator.msSaveBlob(new Blob([data], { type: type }), name);
	var a = $("<a style='display: none;'/>");
	var url = window.URL.createObjectURL(new Blob([data], {type: type}));
	a.attr("href", url);
	a.attr("download", name);
	$("body").append(a);
	a[0].click();
	window.URL.revokeObjectURL(url);
	a.remove();
	memory_leak_debugger("saveFile", start_tensors);
}

function save_custom_images_file (blob) { var start_tensors = memory_leak_debugger();
	saveFile("custom_images.zip", "data:application/zip", blob);
	memory_leak_debugger("save_custom_images_file", start_tensors);
}

async function create_and_download_zip () { var start_tensors = memory_leak_debugger();
	var res = await create_zip_with_custom_images().then(save_custom_images_file);

	memory_leak_debugger("create_and_download_zip", start_tensors);

	return res;
}

async function change_last_responsible_layer_for_image_output () { var start_tensors = memory_leak_debugger();
	if(is_classification) {
		memory_leak_debugger("change_last_responsible_layer_for_image_output", start_tensors);
		return;
	}

	var current_layer_status_hash = await get_current_layer_container_status_hash();

	if(last_image_output_shape_hash == current_layer_status_hash) {
		memory_leak_debugger("change_last_responsible_layer_for_image_output", start_tensors);
		return;
	}

	last_image_output_shape_hash = current_layer_status_hash;

	var layer_types = get_layer_type_array();

	var last_layer_nr = null;

	for (var i = layer_types.length; i >= 0; i--) {
		if(last_layer_nr === null && ["dense", "conv2d"].includes(layer_types[i])) {
			last_layer_nr = i;
		}
	}

	if(last_layer_nr) {
		if($($(".layer_setting")[last_layer_nr]).find(".units,.filters").val() != 3) {
			l("Setting the neurons/filter of layer " + last_layer_nr + " to 3");
			$($(".layer_setting")[last_layer_nr]).find(".units,.filters").val(3).trigger("change")
		}

		if($($(".layer_setting")[last_layer_nr]).find(".activation").val() != "linear") {
			l("Setting the activation function of layer " + last_layer_nr + " to linear");
			$($(".layer_setting")[last_layer_nr]).find(".activation").val("linear").trigger("change");
		}
	} else {
		console.warn("Last layer number could not be found. Do you have any Dense or Conv2d layers?");
	}

	memory_leak_debugger("change_last_responsible_layer_for_image_output", start_tensors);
}

function show_bars_instead_of_numbers () { var start_tensors = memory_leak_debugger();
	if(get_last_layer_activation_function() == "softmax") {
		if($("#show_bars_instead_of_numbers").is(":checked")) {
			memory_leak_debugger("show_bars_instead_of_numbers", start_tensors);
			return true;
		}
	}

	memory_leak_debugger("show_bars_instead_of_numbers", start_tensors);
	return false;
}

async function update_label_by_nr (t, nr) { var start_tensors = memory_leak_debugger();
	var name = $(t).val();

	var t_xpath = get_element_xpath(t);

	labels[nr] = name;

	$(".label_element").each((i, x) => {
		if(1 || get_element_xpath(x) != t_xpath) {
			var label_index = parseInt($(x).parent().parent().find(".label_element").index(x)) % labels.length;

			if(label_index == nr) {
				if($(x).children().length && $(x).children()[0].nodeName == "INPUT") {
					$(x).find("input").val(name);
				} else {
					$(x).html(`<input class='label_input_element' style='width: 130px;' type='text' value='${name}' onchange='update_label_by_nr(${label_index}, $(this).val())' />`);
				}
			}
		}
	});

	$($(".own_image_label")[nr]).val(name)

	await update_python_code(1);
	memory_leak_debugger("update_label_by_nr", start_tensors);
}

function allow_editable_labels () { var start_tensors = memory_leak_debugger();
	if(is_cosmo_mode) {
		return;
	}

	$(".label_element").each((i, x) => {
		var label_index = parseInt($(x).parent().parent().find(".label_element").index(x)) % labels.length;

		if(!labels.length) {
			console.warn("labels is an array, but is empty.");
			return;
		}

		var tmp_label = labels[label_index];
		if(tmp_label === undefined) {
			console.warn("tmp_label undefined");
			return;
		}


		if(label_index === undefined) {
			var tmp_label = $(x).text();
			$(x).html(`<input class='label_input_element' style='width: 130px;' type='text' value='${tmp_label}' onchange='update_label_by_nr(this, ${label_index})' />`);
			return;
		}

		tmp_label = tmp_label.replaceAll(/'/g, "");
		if(tmp_label) {
			if($(x).children().length && $(x).children()[0].nodeName == "INPUT") {
				$(x).find("input").val(tmp_label);
			} else {
				$(x).html(`<input class='label_input_element' style='width: 130px;' type='text' value='${tmp_label}' onchange='update_label_by_nr(this, ${label_index})' />`);
			}
		} else {
			tmp_label = $(x).text();
			$(x).html(`<input class='label_input_element' style='width: 130px;' type='text' value='${tmp_label}' onchange='update_label_by_nr(this, ${label_index})' />`);
		}
	});

	memory_leak_debugger("allow_editable_labels", start_tensors);
}

function enable_every_layer () { var start_tensors = memory_leak_debugger();
	$(".configtable").find("input,select,button").prop("disabled", false);
	$(".layer_setting").find("button").prop("disabled", false);
	memory_leak_debugger("enable_every_layer", start_tensors);
}

function disable_flatten_layer () { var start_tensors = memory_leak_debugger();
	if(!model) {
		memory_leak_debugger("disable_flatten_layer", start_tensors);
		return;
	}

	var flatten_layer = null;
	for (var i = 0; i < model.layers.length; i++) {
		if(!flatten_layer && model.layers[i].name.startsWith("flatten")) {
			flatten_layer = i;
		}
	}

	if(!!flatten_layer) {
		$($(".layer_setting")[flatten_layer]).find(".remove_layer").prop("disabled", true);
	}

	memory_leak_debugger("disable_flatten_layer", start_tensors);
}

function disable_everything_in_last_layer_enable_everyone_else_in_beginner_mode () { var start_tensors = memory_leak_debugger();
	enable_every_layer();

	if(mode == "beginner") {
		$($(".configtable")[$(".configtable").length - 1]).find("input,select,button").prop("disabled", true);
		$($(".layer_setting")[$(".layer_setting").length - 1]).find("button").prop("disabled", true);
		$($(".layer_setting")[$(".layer_setting").length - 1]).find(".show_data").prop("disabled", false);
		$($(".layer_setting")[$(".layer_setting").length - 1]).find(".visualize_layer_button").prop("disabled", false);

		disable_flatten_layer();

		//l("Disabling last layer in beginner mode");
	}

	memory_leak_debugger("disable_everything_in_last_layer_enable_everyone_else_in_beginner_mode", start_tensors);
}

function hide_colorpicker_for_eraser (idname) { var start_tensors = memory_leak_debugger();
	var box = $(atrament_data[idname].canvas).parent();

	if(atrament_data[idname]["atrament"].mode == "erase") {
		box.find(".colorpicker_elements").css("visibility", "hidden")
	} else {
		box.find(".colorpicker_elements").css("visibility", "visible")
	}

	memory_leak_debugger("hide_colorpicker_for_eraser", start_tensors);
}

async function load_msg(swal_msg_format) { var start_tensors = memory_leak_debugger();
	if(started_training && stop_downloading_data) {
		console.info("Training is not started anymore, but the stopped downloading");
		return;
	}

	if(finished_loading) {
		return await Swal.fire({
			title: swal_msg_format["title"],
			html: swal_msg_format["html"],
			timer: 2000,
			showConfirmButton: false
		});
	} else {
		var html_msg = "";
		if(Object.keys(swal_msg_format).includes("title")) {
			html_msg = "<h1>" + swal_msg_format["title"] + "</h1>";
		}

		if(Object.keys(swal_msg_format).includes("html")) {
			html_msg += swal_msg_format["html"]
		}

		$("#load_msg").html(html_msg);
	}
	memory_leak_debugger("load_msg", start_tensors);
}

function show_proper_set_all_initializer (required) { var start_tensors = memory_leak_debugger();
	$(".set_all_initializers_tr").hide();

	for (var i = 0; i < required.length; i++) {
		var val_key = required[i];
		$(".set_all_initializers_" + val_key).show();
	}

	memory_leak_debugger("show_proper_set_all_initializer", start_tensors);
}

function set_required_seeds (required, type, kernel_or_bias, trigger=0) { var start_tensors = memory_leak_debugger();
	var values = get_initializer_set_all_values(required, kernel_or_bias);

	assert(typeof(type) == "string", "type is not string");
	assert(typeof(values) == "object", "values is not an object");


	for (var i = 0; i < required.length; i++) {
		var val_key = required[i];

		if(!val_key) {
			console.log("val_key not defined or false START");
			log("required", required);
			log("type", type);
			log("values", values);
			log("kernel_or_bias", kernel_or_bias);
			console.error("val_key not defined or false END");

			continue;
		}

		if(!Object.keys(values).includes(val_key)) {
			console.error(`${val_key} is required but not defined at all`);
			continue;
		}

		var val = values[val_key];
		//log("val", val);

		if(Object.keys(values).includes(val_key)) {
			var item_selector = "." + kernel_or_bias + val_key;
			//log("item_selector", item_selector);
			var ui_elements = $(item_selector);
			if(ui_elements.length >= 1) {
				var element = ui_elements.val(val).trigger("change");
				if(trigger) {
					element.trigger("change");
				}
			} else {
				console.error("ui_elements contains no elements. Selector: "  + item_selector)
			}
		} else {
			console.error(`${val_key} is required but not properly defined`);
		}
	}
	memory_leak_debugger("set_required_seeds", start_tensors)
}

function get_initializer_set_all_values (required) { var start_tensors = memory_leak_debugger();
	var values = [];
	assert(typeof(values) == "object", "values is not an object");

	required.forEach((element) => {
		var selector = "#set_all_initializers_value_" + element;
		var elements = $(selector);
		if(elements.length) {
			var value = elements.val();
			if(value) {
				values[element] = value;
			} else {
				console.error("value is empty");
			}
		} else {
			console.error("Nothing found for selector " + selector);
		}
	});

	//assert(Object.keys(values).length == required.length, "some values are missing: " + Object.keys(values).length + " !=" + required.length);

	memory_leak_debugger("get_initializer_set_all_values", start_tensors);
	return values;
}

function change_all_initializers (kernel_bias=["kernel_initializer_", "bias_initializer_"]) { var start_tensors = memory_leak_debugger();
	var type = $("#change_initializers_selector").val();
	assert(typeof(type) == "string", "type is not string");

	kernel_bias.forEach((kernel_or_bias) => {
		var required = [];
		var error_occured = false;
		if(["glorotUniform", "glorotNormal", "heNormal", "heUniform", "leCunUniform", "leCunNormal"].includes(type)) {
			required = ["seed"];
		} else if(type == "randomUniform") {
			required = ["seed", "maxval", "minval"];
		} else if(type == "varianceScaling") {
			required = ["seed", "distribution", "mode", "scale"];
		} else if(type == "randomNormal" || type == "truncatedNormal") {
			required = ["seed", "stddev", "mean"];
		} else if(type == "constant") {
			required = ["value"];
		} else if(type == "ones" || type == "zeros") {
			// do nothing, the trigger is enough
		} else {
			console.error("Unknown initializer type: " + type);
			error_occured = true;
		}

		show_proper_set_all_initializer(required);

		if(!error_occured) {
			try {
				set_required_seeds(required, type, kernel_or_bias)
			} catch (e) {
				l("ERROR: " + e);
			}
		}
	});

	memory_leak_debugger("change_all_initializers", start_tensors);
}
