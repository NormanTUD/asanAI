"use strict";

function set_loss_and_metric (loss, metric) {
	if(!metric) {
		metric = loss;
		if(metric == "binaryCrossentropy") {
			metric = "categoricalCrossentropy";
		}
	}

	set_loss(loss);
	set_metric(metric);
}

async function set_labels (arr, force_allow_empty=0) {
	if(!arr) {
		err(language[lang]["arr_is_undefined_or_false"]);
		return;
	}

	if(!Array.isArray(arr)) {
		err(language[lang]["arr_is_not_an_array"]);
		return;
	}

	if(arr.length == 0 && !force_allow_empty) {
		err(language[lang]["arr_is_an_array_but_empty"]);
		return;
	}

	if(get_shape_from_array(arr).length != 1 && !force_allow_empty) {
		err(language[lang]["arr_is_an_array_but_multidimensional_it_needs_to_be_one_dimensional"]);
		return;
	}

	if(!model) {
		if(finished_loading) {
			wrn(language[lang]["model_is_not_defined"]);
		} else {
			dbg(language[lang]["model_is_not_defined"]);
		}
		return;
	}

	if(!Object.keys(model).includes("layers") || !model.layers.length) {
		err(language[lang]["model_layers_is_not_defined_or_empty"]);
		return;
	}

	for (var i = 0; i < arr.length; i++) {
		if(typeof(arr[i]) != "string") {
			err(`typeof(arr[${i}]) is not a string but ${typeof(arr[i])}. Cannot continue. All values must be strings.`);
			return;
		}
	}

	var old_array_string = JSON.stringify(labels);
	var new_array_string = JSON.stringify(arr);

	if(old_array_string != new_array_string) {
		labels = arr;
		dbg(`${language[lang]["set_labels"]} = [${arr.join(", ")}]`);
	} else {
		dbg(language[lang]["not_changing_labels_they_stayed_the_same"]);

		return;
	}

	var last_layer_nr = model.layers.length - 1;
	var last_layer = model.layers[last_layer_nr];
	var last_layer_type = last_layer.getClassName();

	var mos = last_layer.getOutputAt(0).shape;
	var last_layer_activation = last_layer.getConfig()["activation"];

	if(mos[0] === null && mos.length == 2 && last_layer_activation == "softmax" && last_layer_type == "Dense") {
		var model_number_output_categories = mos[1];
		var new_number_output_neurons = arr.length;

		if(new_number_output_neurons && model_number_output_categories != new_number_output_neurons && !is_setting_config) {
			void(0); dbg(`set_item_value(${last_layer_nr}, "units", ${new_number_output_neurons})`);
			set_item_value(last_layer_nr, "units", new_number_output_neurons);

			await repredict();
		} else {
			var msg = "";

			if(!new_number_output_neurons) {
				msg += language[lang]["new_number_of_output_neurons_is_zero_or_undefined"] + ". ";
			}

			if(is_setting_config) {
				msg += language[lang]["do_not_change_neurons_while_is_setting_config_is_true"] + ". ";
			}

			if(model_number_output_categories == new_number_output_neurons) {
				msg += language[lang]["new_number_of_output_neurons_matches_the_number_already_in_the_model"] + ". ";
			}

			dbg(msg);
			//console.trace();
		}
	} else {
		var msg = "";
		if(mos[0] !== null) {
			msg += language[lang]["batch_dimension_in_output_shape_must_be_null"] + ". ";
		}

		if(mos.length != 2) {
			msg += language[lang]["output_shape_length_must_be_two"] + ". ";
		}

		if(last_layer_activation != "softmax") {
			msg += language[lang]["last_layer_must_have_softmax_to_autoset_layers"] + ". ";
		}

		if (last_layer_type != "Dense") {
			msg += language[lang]["last_layer_must_be_of_type_dense"] + ". ";
		}

		dbg(language[lang]["cannot_autoset_layer_errors"] + " " + msg);

		return;
	}
}

async function load_labels_from_json_string (json) {
	var struct;

	try {
		struct = JSON.parse(json);
	} catch (e) {
		if(Object.keys(e).includes("message")) {
			e = e.message;
		}

		if(("" + e).includes("SyntaxError")) {
			err(language[lang]["the_uploaded_labels_json_isnt_valid"]);
			return;
		} else {
			throw new Error(e);
		}
	}

	await set_labels(struct);
}

function download_labels_json () {
	download("labels.json", JSON.stringify(labels));
}

async function reset_labels () {
	await set_labels([], 1);
}

function enable_train () {
	$(".train_neural_network_button").prop("disabled", false);
}

function disable_train () {
	$(".train_neural_network_button").prop("disabled", true);
}

function get_key_from_path(_array, keypath) {
	if (keypath.length == 0) {
		return _array;
	}

	var this_key = undefined;
	var tmp = _array;

	for (var i = 0; i < keypath.length; i++) {
		this_key = keypath[i];
		tmp = tmp[this_key];
		if(!tmp) {
			return null;
		}
	}

	return tmp;
}

function get_full_shape_without_batch(file) {
	typeassert(file, string, "file");

	if (file === null) {
		return null;
	}

	var input_shape_line = file.split("\n")[0];
	var shape_match = /^#\s*shape\s*:?\s*\((.*)\)$/.exec(input_shape_line);

	assert(shape_match !== null, "shape_match is null");

	//shape_match[0] = null;

	var res = eval("[" + shape_match[1] + "]");

	res[0] = null;

	return res;
}

function get_shape_from_file(file) {
	typeassert(file, string, "file");

	if (file === null) {
		return null;
	}

	var input_shape_line = file.split("\n")[0];
	var shape_match = /^#\s*shape\s*:?\s*\(\d+,?\s*(.*)\)$/.exec(input_shape_line);

	assert(shape_match !== null, "shape_match is null");

	if (1 in shape_match) {
		return shape_match[1];
	}

	return null;
}

function get_dimensionality_from_layer_name(layer_type) {
	typeassert(layer_type, string, "layer_type");

	var match = layer_type.match(/(\d+)[dD]/);

	assert(match !== null, "match is null");

	if (match) {
		return parse_int(match[1]);
	}

	return null;
}

async function md5 (content) {
	try {
		var res = await hashwasm.md5(content);

		return res;
	} catch (e) {
		if(Object.keys(e).includes("message")) {
			e = e.message;
		}

		err("[md5] " + e);
	}
}

async function get_current_layer_container_status_hash() {
	var html = $("#layers_container").html();

	html = html.replaceAll(" disabled=\"\"", "");

	var res = await md5(html);

	return res;
}

async function get_current_status_hash(use_weights=1) {
	var html_code = "";

	var allitems = [];
	allitems = Array.prototype.concat.apply(allitems, document.getElementsByTagName("input"));
	allitems = Array.prototype.concat.apply(allitems, document.getElementsByTagName("checkbox"));
	allitems = Array.prototype.concat.apply(allitems, document.getElementsByTagName("select"));
	allitems = Array.prototype.concat.apply(allitems, document.getElementsByTagName("textarea"));

	allitems.forEach(function (x) {
		var item = $(x);
		html_code += ";;;;;;;" + x.id + ";;;;" + x.className + "=" + x.value + ";;;;" + x.checked;
	});

	if(use_weights) {
		html_code += get_weights_as_string();
	}

	var new_status_hash = await md5(html_code);

	last_status_hash = new_status_hash;

	return new_status_hash;
}

/* This function returns the value of an item in a given layer, specified by classname. If the item is a checkbox, it returns whether or not the box is checked. Otherwise, it returns the value of the item. */

function get_item_value(layer, classname) {
	assert(typeof(layer) == "number", "Layer is not an integer, but " + typeof(layer));
	assert(typeof(classname) == "string", "classname '" + classname + "' is not a string, but " + typeof(classname));

	var layer_settings = $(".layer_setting");
	var $layer = $(layer_settings[layer]);

	if (typeof(classname) == "string") {
		var found = $($layer.find("." + classname)[0]);
		if (found.attr("type") == "checkbox") {
			return found.is(":checked");
		} else {
			var data = found.val();
			return data;
		}
	} else {
		for (var this_classname in classname) {
			var found = $($layer.find("." + this_classname)[0]);
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

	assert(typeof(layer) == "number", "Layer is not an integer, but " + typeof(layer));
	assert(typeof(classname) == "string", "classname '" + classname + "' is not a string, but " + typeof(classname));
	assert(["string", "number", "boolean"].includes(typeof(value)), "value '" + value + "' for " + classname + " is not a string or number, but " + typeof(value));

	var layer_settings = $(".layer_setting");
	if(layer >= layer_settings.length) {
		wrn(`[set_item_value] Layer ${layer} was too high. Max number is ${layer_settings.length - 1}`);

		return;
	}

	var layer_setting = layer_settings[layer];
	var found_setting = $($(layer_setting).find("." + classname)[0]);
	if (found_setting.length) {
		if (found_setting.attr("type") == "checkbox") {
			found_setting.prop("checked", value == 1 ? true : false).trigger("change");
		} else {
			found_setting.val(value).trigger("change");
		}
	} else {
		if(classname == "rate") {
			set_item_value(layer, "dropout_rate", value);
		} else if(classname != "trainable") {
			err("Unknown classname '" + classname + "' in layer " + layer);
		}
	}
}

function get_tr_str_for_description(desc) {
	assert(typeof(desc) == "string", desc + " is not string but " + typeof(desc));
	return "<tr><td><span class='TRANSLATEME_description'></span>:</td><td><span class='typeset_me'>" + desc + "</span></td></tr>";
}

function is_numeric(str) {
	if (typeof str != "string") return false;
	if (str == "") return false;
	return !isNaN(str) && !isNaN(parse_float(str));
}

function quote_python(item, nobrackets=0) {
	if (item === undefined) {
		return "";
	}

	if (typeof(item) == "object") {
		return JSON.stringify(item);
	} else {
		if (is_numeric(item)) {
			return item;
		} else if (!nobrackets && /^\d+(,\d+)*$/.test(item)) {
			return "[" + item + "]";
		} else if (item == "True" || item == "False") {
			return item;
		} else if (!nobrackets && item.includes("get_shape")) {
			return item;
		} else if (!nobrackets && item.startsWith("[")) {
			return item;
		} else {
			return "\"" + item + "\"";
		}
	}

	return item;
}

function get_js_name(_name) {
	if(typeof(_name) == "boolean") {
		if(_name) {
			return "true";
		}
		return "false";
	}

	if(Array.isArray(_name)) {
		return _name;
	}

	if (_name in python_names_to_js_names) {
		return python_names_to_js_names[_name];
	}
	return _name;
}

function get_python_name(_name) {
	if(typeof(_name) == "boolean") {
		if(_name) {
			return "True";
		}
		return "False";
	}

	if(Array.isArray(_name)) {
		return _name;
	}

	if (_name in js_names_to_python_names) {
		return js_names_to_python_names[_name];
	}
	return _name;
}

function get_tr_str_for_layer_table(desc, classname, type, data, nr, tr_class, hidden, expert_mode_only = 0) {
	assert(typeof(classname) == "string", "classname is not a string");
	assert(typeof(data) == "object", "data is not an object");
	assert(typeof(nr) == "number", "nr is not a number");
	assert(typeof(tr_class) == "string" ||tr_class === undefined || tr_class === null, "tr_class is not a string");

	assert(expert_mode_only === 0 || expert_mode_only === 1, "expert_mode_only for get_tr_str_for_layer_table must be either 0 or 1, but is " + expert_mode_only);

	var new_uuid = uuidv4();

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
				var new_name = valid_initializer_types[tk] + "_" + types_init_or_reg[tir];
				if (classname == new_name) {
					var _get_layer_str = "find_layer_number_by_element($(this))";
					var _init_type = `"${valid_initializer_types[tk]}"`;
					var _updated_page_str = "updated_page(null, null, this)";
					var _func_name = `insert_${types_init_or_reg[tir]}_options`;

					onchange_text = `${_func_name}(${_get_layer_str}, ${_init_type});${_updated_page_str}`;
				}
			}
		}

		if (classname == "activation") {
			//onchange_text = "insert_activation_options(find_layer_number_by_element($(this)));updated_page(null, null, this)";
		}

		str += `<select id="select_${new_uuid}" class='input_field input_data ${classname}' _onchange='${onchange_text}'>`;
		for (var [key, value] of Object.entries(data)) {
			str += "<option value=\"" + key + "\">" + value + "</option>";
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
			if (typeof(data["text"]) == "function") {
				text = data["text"](nr);
			}

			pre_text = " value='" + text + "' ";
		}

		str += `<input id="text_field_${uuidv4()}" class="input_field input_data ${classname}" ${pre_text} ${placeholder} type="text" _onchange="updated_page()" onkeyup="updated_page(null, null, this)" />`;
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

		if(classname.includes("_initializer_") && (classname.includes("kernel") || classname.includes("bias"))) {
			//updated_page(no_graph_restart, disable_auto_enable_valid_layer_types, item, no_prediction, no_update_initializers) {
			str += `id='get_tr_str_for_layer_table_${new_uuid}'  onchange='updated_page(null, null, null, null, 1)' onkeyup="var original_no_update_math=no_update_math; no_update_math = is_hidden_or_has_hidden_parent('#math_tab_code') ? 1 : 0; is_hidden_or_has_hidden_parent('#math_tab_code'); updated_page(null, null, this, null, 1); no_update_math=original_no_update_math;" />`;
		} else {
			str += `id='get_tr_str_for_layer_table_${new_uuid}'  _onchange='updated_page()' onkeyup="var original_no_update_math=no_update_math; no_update_math = is_hidden_or_has_hidden_parent('#math_tab_code') ? 1 : 0; is_hidden_or_has_hidden_parent('#math_tab_code'); updated_page(null, null, this); no_update_math=original_no_update_math;" />`;
		}

		var original_no_update_math = no_update_math;
	} else if (type == "checkbox") {
		var on_change_string = "updated_page(null, null, this);";

		str += `<input id='checkbox_${new_uuid}' type='checkbox' class='input_data ${classname}' `;
		if ("status" in data && data["status"] == "checked") {
			str += " checked='CHECKED' ";
		}

		if(classname == "use_bias") {
			on_change_string += "change_bias_selection(this);";
		}

		str += `_onchange='${on_change_string}' />`;

	} else {
		alert("Invalid table type: " + type);
	}
	str += "</td>";

	return str;
}

function change_bias_selection (elem) {
	if(!$(elem).is(":checked")) {
		$(elem).parent().parent().parent().find(".bias_initializer_tr").remove();
	}
}

function add_cell_option() {
	return "";
}

function add_number_lstm_cells_option(type, nr) {
	var res = get_tr_str_for_layer_table("LSTM Cells", "number_lstm_cells", "number", { "min": 0, "step": 1, "value": 1 }, nr);

	return res;
}

function add_seed_option (type, nr) {
	var style = "";

	var current_input_shape = get_input_shape();
	if (current_input_shape.length != 3) {
		style = " style=\"display: none\" ";
	}

	var res = "<tr class='seed_value' " + style + "><td>Seed</td><td><input onchange='updated_page()' type='number' name='seed' class='seed dropout_seed' value='1' /></td></tr>";

	return res;
}

function add_visualize_option(type, nr) {
	assert(typeof(type) == "string", "type is not a number");
	assert(typeof(nr) == "number", "nr is not a number");

	var style = "";

	var res = "<tr class='visualize_button' " + style + "><td><span class='TRANSLATEME_visualize_this_layer'></span>?</td><td><button class='visualize_layer_button' onclick='draw_maximally_activated_layer(find_layer_number_by_element(this), \"" + type + "\")'><span class='TRANSLATEME_visualize_layer'></span></button></td></tr>";

	return res;
}

function add_pool_size_option(type, nr) {
	assert(typeof(type) == "string", "type is not a number");
	assert(typeof(nr) == "number", "nr is not a number");

	var str = "";

	var dimensionality = get_dimensionality_from_layer_name(type);

	assert(typeof(dimensionality) == "number", `get_dimensionality_from_layer_name does not return a number for type '${type}'`);

	var letter_code = "x".charCodeAt();
	for (var i = 0; i < dimensionality; i++) {
		var letter = String.fromCharCode(letter_code);
		str += get_tr_str_for_layer_table("Pool-Size " + letter, "pool_size_" + letter, "number", { "min": 1, "max": 4096, "step": 1, "value": get_default_option(type, "pool_size")[i] }, nr);
		letter_code++;
	}

	return str;
}

function add_kernel_size_option(type, nr) {
	var str = "";
	var dimensionality = get_dimensionality_from_layer_name(type);

	assert(typeof(dimensionality) == "number", `get_dimensionality_from_layer_name does not return a number for type '${type}'`);

	var letter_code = "x".charCodeAt();
	for (var i = 0; i < dimensionality; i++) {
		var letter = String.fromCharCode(letter_code);
		str += get_tr_str_for_layer_table(
			"<span class='TRANSLATEME_kernel_size'></span> " + letter,
			"kernel_size_" + letter, "number",
			{ "min": 1, "max": 4096, "step": 1, "value": get_default_option(type, "kernel_size")[i] },
			nr
		);
		letter_code++;
	}

	return str;
}

function add_strides_option(type, nr) {
	var str = "";
	var dimensionality = get_dimensionality_from_layer_name(type);

	assert(typeof(dimensionality) == "number", `get_dimensionality_from_layer_name does not return a number for type '${type}'`);

	var letter_code = "x".charCodeAt();
	for (var i = 0; i < dimensionality; i++) {
		var letter = String.fromCharCode(letter_code);
		str += get_tr_str_for_layer_table("Strides " + letter, "strides_" + letter, "number", { "min": 1, "max": 4096, "step": 1, "value": get_default_option(type, "strides")[i] }, nr);
		letter_code++;
	}

	return str;
}

/* activation gui functions end */

function insert_activation_option_trs(layer_nr, option_type) {
	assert(["alpha", "max_value", "axis", "theta", "alpha_initializer", "alpha_regularizer", "alpha_constraint", "shared_axes"].includes(option_type), "invalid option type " + option_type);
	assert(typeof(layer_nr) == "number", "Layer number's type must be number, is: " + typeof(layer_nr));

	if (option_type != "none") {
		var eval_string = `$(add_activation_${option_type}_option($($(".layer_type")[${layer_nr}]).val(), ${layer_nr})).insertAfter($($(".activation")[${layer_nr}]).parent().parent());`;

		eval(eval_string);
	} else {
		log("[insert_activation_option] option_type is '" + option_type + "'");
	}
}

function insert_regularizer_option_trs(layer_nr, regularizer_type, option_type) {
	assert(valid_initializer_types.includes(regularizer_type), "insert_regularizer_option_trs(layer_nr, " + regularizer_type + ") is not a valid regularizer_type (2nd option)");
	assert(["l1", "l1l2", "l2", "none"].includes(option_type), "invalid option type " + option_type);
	assert(typeof(layer_nr) == "number", "Layer number's type must be number, is: " + typeof(layer_nr));

	if (option_type != "none") {
		var eval_string = `$(add_${regularizer_type}_regularizer_${option_type}_option($($(".layer_type")[${layer_nr}]).val(), ${layer_nr})).insertAfter($($(".layer_setting")[${layer_nr}]).find(".${regularizer_type}_regularizer").parent().parent())`;

		eval(eval_string);
	} else {
		log("[insert_regularizer_option_trs] option_type is '" + option_type + "'");
	}
}

function insert_initializer_option_trs(layer_nr, initializer_type, option_type) {
	assert(valid_initializer_types.includes(initializer_type), "insert_initializer_option_trs(layer_nr, " + initializer_type + ") is not a valid initializer_type (2nd option)");
	assert(["seed", "mean", "stddev", "value", "mode", "distribution", "minval", "maxval", "scale", ...valid_initializer_types].includes(option_type), "invalid option type " + option_type);
	assert(typeof(layer_nr) == "number", "Layer number's type must be number, is: " + typeof(layer_nr));

	var function_name = `add_${initializer_type}_initializer_${option_type}_option`;

	var eval_string = `$(${function_name}($($(".layer_type")[${layer_nr}]).val(), ${layer_nr})).
		insertAfter($($(".layer_setting")[${layer_nr}]).
			find(".${initializer_type}_initializer").
			parent().
			parent()
		)
	`;

	//console.log(eval_string);

	eval(eval_string);

}

async function insert_activation_options(layer_nr) {
	// TODO NOT YET USED
	assert(typeof(layer_nr) == "number", "layer_nr must be of the type of number but is: " + typeof(layer_nr));
	assert(layer_nr >= 0 && layer_nr <= get_number_of_layers(), "Invalid layer number");

	$($(".layer_options_internal")[layer_nr]).find(".activation_tr").remove();

	var activation_item = $($(".layer_options_internal")[layer_nr]).find(".activation");

	if (activation_item && activation_item.length) {
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
		if(get_layer_type_array()[layer_nr] != "flatten") {
			log("[insert_activation_options] Layer " + layer_nr + " does not seem to have a activation setting");
		}
	}

	await updated_page();
}

function set_last_layer_activation_function (activation_function) {
	assert(Object.keys(activations).includes(activation_function), "activation function " + activation_function + " is invalid. Must be one of these: " + Object.keys(activations).join(", "));

	var last_layer_nr = $(".layer_type").length - 1;
	var activation_item = $($(".layer_options_internal")[last_layer_nr]).find(".activation");
	if(activation_item.val() != activation_function) {
		activation_item.val(activation_function).trigger("change");
	}
}

async function insert_regularizer_options(layer_nr, regularizer_type) {
	assert(valid_initializer_types.includes(regularizer_type), "insert_regularizer_trs(layer_nr, " + regularizer_type + ") is not a valid regularizer_type (2nd option)");
	assert(typeof(layer_nr) == "number", "layer_nr must be of the type of number but is: " + typeof(layer_nr));
	var max_layer = get_number_of_layers();
	if(!(layer_nr >= 0 && layer_nr <= max_layer)) {
		dbg(sprintf(language[lang]["invalid_layer_nr_max_layer_n_layer_nr_m"], max_layer, layer_nr));
		return;
	}

	$($(".layer_options_internal")[layer_nr]).find("." + regularizer_type + "_regularizer_tr").remove();

	var regularizer = $($(".layer_options_internal")[layer_nr]).find("." + regularizer_type + "_regularizer");

	if (regularizer.length) {
		var regularizer_name = regularizer.val();

		var options = regularizer_options[regularizer_name]["options"];

		for (var i = 0; i < options.length; i++) {
			insert_regularizer_option_trs(layer_nr, regularizer_type, options[i]);
		}
	} else {
		if(get_layer_type_array()[layer_nr] != "flatten") {
			log("[insert_regularizer_options] Layer " + layer_nr + " does not seem to have a " + regularizer_type + " regularizer setting");
		}
	}
	await updated_page();
}

function findInitializerElement(arr) {
	for (let i = 0; i < arr.length; i++) {
		if (typeof arr[i] === "string" && arr[i].includes("_initializer_")) {
			return arr[i];
		}
	}
	return null; // Return null if no matching element is found
}

async function insert_initializer_options (layer_nr, initializer_type) {
	assert(valid_initializer_types.includes(initializer_type), "insert_initializer_trs(layer_nr, " + initializer_type + ") is not a valid initializer_type (2nd option)");
	assert(typeof(layer_nr) == "number", "layer_nr must be of the type of number but is: " + typeof(layer_nr));

	var max_layer = get_number_of_layers();
	if(!(layer_nr >= 0 && layer_nr <= max_layer)) {
		dbg(sprintf(language[lang]["invalid_layer_nr_max_layer_n_layer_nr_m"], max_layer, layer_nr));
		return;
	}

	var existing_init_elements = $($(".layer_options_internal")[layer_nr]).find("." + initializer_type + "_initializer_tr");

	var initializer = $($(".layer_options_internal")[layer_nr]).find("." + initializer_type + "_initializer");

	var initializer_name = initializer.val();

	if(existing_init_elements.length) {
		var number_of_removed_items = 0;

		var options = initializer_options[initializer_name]["options"];

		var prev_classes = [];

		for (var i = 0; i < existing_init_elements.length; i++) {
			var remove = true;

			var found_element = $(existing_init_elements[i]);
			if(found_element.length) {
				var found_input_element = $(found_element[0]).find("input");
				if(found_input_element.length) {
					var class_list = found_input_element[0].classList;
					var this_initializer_class_type = findInitializerElement(class_list);

					var this_initializer_type = this_initializer_class_type.replace(/.*_initializer_/, "");

					if(options.includes(this_initializer_type) && prev_classes.includes(this_initializer_type)) {
						remove = false;
					} else {
						prev_classes.push(this_initializer_type);

					}
				}
			}

			if(remove) {
				$(existing_init_elements[i]).remove();
				number_of_removed_items++;
			}
		}

		if(number_of_removed_items == 0) {
			return;
		}
	}

	if(initializer_name) {
		var options = initializer_options[initializer_name]["options"];

		for (var i = 0; i < options.length; i++) {
			insert_initializer_option_trs(layer_nr, initializer_type, options[i]);
		}
	}
}

async function get_json(url) {
	try {
		var data = await $.getJSON(url);
		return data;
	} catch (e) {
		assert(false, `${url}: ${e.statusText}`);
	}
}

async function get_cached_json(url) {
	if (Object.keys(_cached_json).includes(url)) {
		return _cached_json[url];
	}

	try {
		var worked = 1;
		var data = await $.getJSON(url).fail(function() {
			worked = 0;
			log_once("Could not get " + url);
		});
		if(worked) {
			_cached_json[url] = data;
		}

		return data;
	} catch (e) {
		if(Object.keys(e).includes("message")) {
			e = e.message;
		}

		if(Object.keys(e).includes("statusText")) {
			e = e.statusText;
		}

		log_once("Probably harmless error getting url: " + url + ": " + e);
	}
}

/* This function gets the configuration for the index passed in. If no index is passed in, it gets the configuration for the currently selected dataset. */

async function _get_configuration(index) {
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

function copy_to_clipboard(text) {
	var dummy = document.createElement("textarea");
	document.body.appendChild(dummy);
	dummy.value = text;
	dummy.select();
	document.execCommand("copy");
	document.body.removeChild(dummy);
}

function show_clipboard_feedback() {
	var feedback = $('<div>📋</div>');
	feedback.css({
		position: 'fixed',
		top: '50%',
		left: '50%',
		transform: 'translate(-50%, -50%)',
		fontSize: '3em',
		opacity: 0,
		zIndex: 9999,
		transition: 'opacity 0.1s ease-in-out'
	});
	$('body').append(feedback);
	setTimeout(() => feedback.css('opacity', 1), 0);
	setTimeout(() => feedback.css('opacity', 0), 400);
	setTimeout(() => feedback.remove(), 1000);
}

function copy_id_to_clipboard(idname) {
	var serialized = $("#" + idname).text();
	copy_to_clipboard(serialized);

	show_clipboard_feedback();
}

function enable_disable_grad_cam() {
	if ($("#show_grad_cam").is(":checked")) {
		$("#grad_cam_heatmap").show();
	} else {
		$("#grad_cam_heatmap").hide();
	}

	if($("#show_layer_data").is(":checked")) {
		wrn("[enable_disable_grad_cam] You can either use grad CAM or the internal layer states, but not both. Disabling internal layer states.");
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
		wrn("[enable_disable_kernel_images] You can either use grad CAM or the internal layer states, but not both. GradCAM.");
		$("#show_grad_cam").prop("checked", false).trigger("change");
	}

	$("#grad_cam_heatmap").hide();

	hide_empty_tabs("visualization_ribbon");
}

function change_kernel_pixel_size() {
	kernel_pixel_size = parse_int($("#kernel_pixel_size").val());
}

function change_pixel_size() {
	pixel_size = parse_int($("#pixel_size").val());
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

	$("#output").width($("#width").val());
	$("#output").height($("#height").val());
	//$(".example_images").width($("#width").val())
	//$(".example_images").height($("#height").val())
}

async function change_width_or_height(name, inputshape_index) {
	var is_valid_name = ["width", "height"].includes(name);

	if(!is_valid_name) {
		err(`${name} is neither 'width' nor 'height'`);
		return;
	}

	var value = $("#" + name).val();

	if(!("" + value).length) {
		err("[change_width_or_height] value is not defined");
		return;
	}

	if(!looks_like_number(value)) {
		err(`[change_width_or_height] Value "${value}" does not look like a number`);
		return;
	}

	value = parse_int(value);

	assert(typeof(value) == "number", `${value} is not a number, but ${typeof(value)}`);

	if(value == eval(name)) {
		return;
	}

	var t_start = Date.now();
	l(language[lang]["changing"] + " " + language[lang][name] + "...");

	var inputShape = get_input_shape();
	inputShape[inputshape_index] = value;
	await set_input_shape("[" + inputShape.join(", ") + "]");
	eval(name + " = " + value);
	layer_structure_cache = null;
	try {
		[model, global_model_data] = await create_model();
		is_setting_config = false;

	} catch (e) {
		var last_good = get_last_good_input_shape_as_string();
		l(language[lang]["input_size_too_small_restoring_last_known_good_config"] + " " + last_good);
		await set_input_shape(last_good, 1);

		var new_size = get_input_shape_as_string().replace("[", "").replace("]", "").split(", ")[inputshape_index];

		$("#" + name).val(new_size).trigger("change");
	}

	await updated_page();
	change_output_and_example_image_size();

	await restart_webcams();

	var t_end = Date.now();

	var used_time = ((t_end - t_start) / 1000).toFixed(5);

	model_is_trained = false;
	var hrt = human_readable_time(used_time);
	if(hrt) {
		l(language[lang]["done_changing"] + " " + language[lang][name] + ", " + language[lang]["took"] + " " + hrt + " (" + used_time + ")");
	}
}

function generateOnesString(inputString) {
	typeassert(inputString, string, "inputString");
	return (inputString.toLowerCase().match(/\d+/g) || []).map(number => "1,".repeat(parseInt(number))).join("").replace(/,$/, "");
}

async function update_python_code(dont_reget_labels, get_python_codes=0, hide_labels=0, auto_determine_last_layer_inputs=0) {
	var redo_graph = 0;

	var input_shape = [height, width, number_channels];

	var loss = document.getElementById("loss").value;
	var optimizer_type = document.getElementById("optimizer").value;
	var metric_type = document.getElementById("metric").value;
	var batchSize = document.getElementById("batchSize").value;
	var data_origin = document.getElementById("data_origin").value;

	var epochs = parse_int(document.getElementById("epochs").value);

	$("#pythoncontainer").show();

	var input_shape_is_image_val = await input_shape_is_image();

	var x_shape = "";

	if(input_shape_is_image_val) {
		x_shape = "[height, width, 3]";
	}

	if (!dont_reget_labels) {
		await get_label_data();
	}

	var layer_types = $(".layer_type");
	var layer_settings = $(".layer_setting");

	var expert_code = "";

	var is_last_layer = false;

	for (var i = 0; i < get_number_of_layers(); i++) {
		if(i == (get_number_of_layers() - 1) && auto_determine_last_layer_inputs) {
			is_last_layer = true;
		}

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
					var _pool_size_x = get_item_value(i, "pool_size_x");
					var _pool_size_y = get_item_value(i, "pool_size_y");

					if(looks_like_number(_pool_size_x) && looks_like_number(_pool_size_y)) {
						data[get_python_name(option_name)] = [parse_int(_pool_size_x), parse_int(_pool_size_y)];
					}
				} else if (option_name == "strides") {
					var _strides_x = get_item_value(i, "strides_x");
					var _strides_y = get_item_value(i, "strides_y");

					if(looks_like_number(_strides_x) && looks_like_number(_strides_y)) {
						data[get_python_name(option_name)] = [parse_int(_strides_x), parse_int(_strides_y)];
					}
				} else if (option_name == "kernel_size") {
					var kernel_size_x = get_item_value(i, "kernel_size_x");
					var kernel_size_y = get_item_value(i, "kernel_size_y");
					var kernel_size_z = get_item_value(i, "kernel_size_z");

					if(kernel_size_x && kernel_size_y && kernel_size_z) {
						data[get_python_name(option_name)] = [
							parse_int(kernel_size_x),
							parse_int(kernel_size_y),
							parse_int(kernel_size_z)
						];
					} else if (kernel_size_x && kernel_size_y) {
						data[get_python_name(option_name)] = [
							parse_int(kernel_size_x),
							parse_int(kernel_size_y)
						];
					} else if (kernel_size_x) {
						data[get_python_name(option_name)] = [
							parse_int(kernel_size_x)
						];
					} else {
						await write_error(`Neither (kernel_size_x && kernel_size_y && kernel_size_z) nor (kernel_size_x && kernel_size_z) nor (kernel_size_x). Kernel-Data: ${JSON.stringify({kernel_size_x: kernel_size_x, kernel_size_y: kernel_size_y, kernel_size_z: kernel_size_z, })}`);
					}
				} else if (option_name == "size") {
					data[get_python_name(option_name)] = eval("[" + get_item_value(i, "size") + "]");
				} else if (option_name == "dilation_rate") {
					var dil_rate = get_item_value(i, option_name);

					if(dil_rate == "") {
						dil_rate = generateOnesString(get_layer_type_array()[i]);
					}

					dil_rate = dil_rate.replace(/[^0-9,]/g, "");

					dil_rate.replace(/\s*,\s*/g, ", ");

					var code_str = "[" + dil_rate + "]";

					data[get_python_name(option_name)] = eval("[" + code_str + "]");

				} else if (option_name == "target_shape") {
					data[get_python_name(option_name)] = eval("[" + get_item_value(i, "target_shape") + "]");
				} else if (option_name == "activation") {
					if(option_name) {
						data[get_python_name(option_name)] = get_python_name(get_item_value(i, option_name));
					}
				} else {
					data[get_python_name(option_name)] = get_item_value(i, option_name);
				}
			}

			redo_graph++;
		}

		valid_initializer_types.forEach((type) => {
			["regularizer", "initializer"].forEach((func) => {
				var item_name = type + "_" + func;
				if (Object.keys(data).includes(item_name)) {
					if (data[item_name] == "none") {
						delete data[item_name];
					}
				}
			});
		});

		var params = [];
		for (var [key, value] of Object.entries(data)) {
			if (key == "dtype" && i == 0 || key != "dtype") {
				if (typeof(value) != "undefined" && typeof(key) != "boolean") {
					params.push(get_python_name(key) + "=" + quote_python(get_python_name(value)));
				}
			}
		}

		delete data["visualize"];

		if(model && Object.keys(model).includes("layers")) {
			/*
			var cdata = convert_to_python_string(data)
			if(cdata == "{}") {
				cdata = "";
			}
			*/
			//expert_code += `model.add(layers.${model.layers[i].getClassName()}(${cdata}))\n`;
			try {
				var classname = "";

				if(Object.keys(model).includes("layers") && Object.keys(model.layers).includes("" + i)) {
					classname = model.layers[i].getClassName();
				}

				if(Object.keys(data).includes("dilation_rate")) {
					assert(data.dilation_rate[0].length > 0, "Dilation rate must have at least 1 parameter if it exists");
				}

				if(classname) {
					expert_code += model_add_python_structure(classname, data, is_last_layer);
				} else {
					expert_code += "# Problem getting the code for this layer";
				}
			} catch (e) {
				if(("" + e).includes("model.layers[i] is undefined")) {
					wrn("[update_python_code] model.layers was undefined. This MAY be harmless.");
				} else {
					expert_code += "# ERROR while creating code: " + e;
					log("[update_python_code] ERROR in python expert code: " + e);
					console.log("[update_python_code] data:", data);
				}
			}
		}
	}

	if(expert_code) {
		var labels_str = "";
		if(labels.length && !hide_labels) {
			labels_str = "labels = ['" + labels.join("', '") + "']\n";
		}

		var wh = "";

		var is = get_input_shape_with_batch_size(); is[0] = "None";

		expert_code =
			python_boilerplate(input_shape_is_image_val, 0) +
			labels_str +

			"model = tf.keras.Sequential()\n\n" +

			"from keras import layers\n" +

			expert_code +

			`model.build(input_shape=[${is.join(", ")}])` +
			"\n\nmodel.summary()\n";
	}

	var python_code = create_python_code(input_shape_is_image_val);

	$("#python").text(python_code).show();
	$("#python_expert").text(expert_code).show();

	await highlight_code();

	if(get_python_codes) {
		return [python_code, expert_code];
	} else {
		return redo_graph;
	}
}

function or_none (str, prepend = "\"", append = "\"") {
	if(str) {
		if(("" + str).match(/^[+-]?\d+(?:\.\d+)$/)) {
			return parse_float(str);
		} else if(("" + str).match(/^[+-]?\d+$/)) {
			return parse_int(str);
		}
		return prepend + get_python_name(str) + append;
	}
	return "None";
}

// TODO
function model_add_python_structure (layer_type, data, is_last_layer) {
	assert(layer_type, "layer_type is not defined");
	assert(data, "data is not defined");

	if(Object.keys(data).includes("dropout_rate")) {
		data["rate"] = data["dropout_rate"];
		delete data["dropout_rate"];
	}

	var str = "";
	if(layer_type == "Conv2D") {
		return `model.add(layers.Conv2D(
	${data.filters},
	(${data.kernel_size}),
${python_data_to_string(data, ["filters", "kernel_size"])}
))\n`;
	} else if(layer_type == "Dense") {
		if(is_last_layer) {
			var auto_determine_string = "len([name for name in os.listdir('data') if os.path.isdir(os.path.join('data', name))])";

			data["units"] = auto_determine_string;
		}

		var _string = `model.add(layers.Dense(
${python_data_to_string(data)}
))\n`;

		return _string;
	} else if (layer_type == "UpSampling2D") {
		str += `model.add(layers.UpSampling2D(
${python_data_to_string(data)}
))\n`;
	} else if (layer_type == "SeparableConv1D") {
		str += `model.add(layers.SeparableConv1D(
${python_data_to_string(data)}
))\n`;
	} else if (layer_type == "BatchNormalization") {
		str += `model.add(layers.BatchNormalization(
${python_data_to_string(data)}
))\n`;
	} else if (layer_type == "ThresholdedReLU") {
		str += `model.add(layers.ThresholdedReLU(
${python_data_to_string(data)}
))\n`;
	} else if (layer_type == "Softmax") {
		str += `model.add(layers.Softmax(
${python_data_to_string(data)}
))\n`;
	} else if (layer_type == "ReLU") {
		str += `model.add(layers.ReLU(
${python_data_to_string(data)}
))\n`;
	} else if (layer_type == "Conv2DTranspose") {
		str += `model.add(layers.Conv2DTranspose(
	${data.filters},
	(${data.kernel_size}),
${python_data_to_string(data, ["kernel_size", "filters"])}
))\n`;
	} else if (layer_type == "AlphaDropout") {
		str += `model.add(layers.AlphaDropout(
${python_data_to_string(data)}
))\n`;
	} else if (layer_type == "Dropout") {
		str += `model.add(layers.Dropout(
${python_data_to_string(data)}
))\n`;
	} else if (layer_type == "GaussianDropout") {
		str += `model.add(layers.GaussianDropout(
${python_data_to_string(data)}
))\n`;
	} else if (layer_type == "GaussianNoise") {
		str += `model.add(layers.GaussianNoise(stddev=${data.stddev}, seed=${or_none(data.seed)}))\n`;
	} else if (layer_type.startsWith("GlobalAveragePooling")) {
		str += `model.add(layers.${layer_type}(
${python_data_to_string(data)}
))\n`;
	} else if (layer_type.startsWith("GlobalMaxPooling")) {
		str += `model.add(layers.${layer_type}(
${python_data_to_string(data)}
))\n`;
	} else if (layer_type == "LayerNormalization") {
		str += `model.add(layers.LayerNormalization(
${python_data_to_string(data)}
))\n`;
	} else if (layer_type == "Reshape") {
		str += `model.add(layers.Reshape(
	target_shape=[${data.target_shape}]
))\n`;
	} else if (layer_type == "MaxPooling3D") {
		str += `model.add(layers.MaxPooling3D(
	(${data.pool_size[0]}, ${data.pool_size[1]}, ${data.pool_size[2]}),
${python_data_to_string(data, ["pool_size"])}
))\n`;
	} else if (layer_type == "MaxPooling2D") {
		str += `model.add(layers.MaxPooling2D(
${python_data_to_string(data, ["pool_size"])}
))\n`;
	} else if (layer_type == "MaxPooling1D") {
		str += `model.add(layers.${layer_type}(
	(${data.pool_size[0]}),
${python_data_to_string(data, ["pool_size"])}
))\n`;
	} else if (layer_type == "AveragePooling1D") {
		str += `model.add(layers.AveragePooling1D(
${python_data_to_string(data)}
))\n`;
	} else if (layer_type == "SeparableConv2D") {
		str += `model.add(layers.SeparableConv2D(
${python_data_to_string(data)}
))\n`;
	} else if (layer_type == "AveragePooling2D") {
		str += `model.add(layers.AveragePooling2D(
${python_data_to_string(data)}
))\n`;
	} else if (layer_type == "AveragePooling3D") {
		str += `model.add(layers.AveragePooling3D(
${python_data_to_string(data)}
))\n`;

	} else if (layer_type == "LeakyReLU") {
		str += `model.add(layers.LeakyReLU(
${python_data_to_string(data)}
))\n`;
	} else if (layer_type == "ELU") {
		str += `model.add(layers.ELU(
${python_data_to_string(data)}
))\n`;
	} else if (layer_type == "DepthwiseConv1D") {
		str += `model.add(layers.DepthwiseConv1D(
${python_data_to_string(data)}
))\n`;
	} else if (layer_type == "DepthwiseConv2D") {
		str += `model.add(layers.DepthwiseConv2D(
	(${data.kernel_size}),
${python_data_to_string(data, ["kernel_size"])}
))\n`;
	} else if(layer_type == "Flatten") {
		return "model.add(layers.Flatten())\n";
	} else if(layer_type == "DebugLayer") {
		return "# Debug layer are custom to asanAI and are not available in TensorFlow\n";
	} else {
		return "# NOT YET IMPLEMENTED: " + layer_type + "\n";
	}
	return str;
}

function python_data_to_string (_data, _except=[]) {
	assert(typeof(_data) == "object", "_data is not an object for python_data_to_string");
	assert(typeof(_except) == "object", "_except is not an object for python_data_to_string");

	var strings = [];
	var _string = "";

	var keys = Object.keys(_data);

	_except.push("input_shape");

	for (var i = 0; i < keys.length; i++) {
		var key = keys[i];

		if(!_except.includes(key)) {
			if(key == "strides" || key == "dilation_rate" || key == "pool_size") {
				assert(typeof(_data[key]) == "object", "_data[key] for " + key + " is not an object!");
				strings.push(`\t${key}=(${_data[key].join(", ")})`);
			} else if(key == "use_bias" || key == "trainable") {
				var true_or_false = 0;
				if(_data[key] == "True" || _data[key] == "true" || _data[key] == "1" || _data[key] == 1) {
					true_or_false = 1;
				}
				strings.push(`\t${key}=${true_or_false ? "True" : "False"}`);
			} else if(key == "size") {
				strings.push(`\tsize=${or_none(data.size, "(", ")")}`);
			} else {
				if(typeof(_data[key]) == "string") {
					if (_data[key].startsWith("len")) {
						strings.push(`\t${key}=${_data[key]}`);
					} else {
						strings.push(`\t${key}=${or_none(_data[key])}`);
					}
				} else {
					strings.push(`\t${key}=${or_none(_data[key])}`);
				}
			}
		}
	}

	_string = strings.join(",\n");

	return _string;
}

function convert_to_python_string(obj) {
	var pythonCode = "{";
	var i = 0;
	for (var key in obj) {
		if(i == 0) {
			pythonCode += "\n";
		}
		let value = obj[key];
		if(!("" + value).startsWith("[")) {
			if (typeof value == "boolean") {
				value = value ? "True" : "False";
			} else if (!isNaN(value)) {
				if (Number.isInteger(parse_float(value))) {
					value = parse_int(value);
				} else {
					value = parse_float(value);
				}
			} else {
				value = "\"" + value + "\"";
			}
		}
		pythonCode += `    ${key}: ${value},\n`;
		i++;
	}
	pythonCode += "}";
	return pythonCode;
}

function python_boilerplate (input_shape_is_image_val, _expert_mode=0) {
	var python_code = "";

	python_code += "#!/usr/bin/env python3\n";

	python_code += "# This generated code is licensed under CC-BY.\n";
	python_code += "\n";
	python_code += "# First, click 'Download model data' (or 'Modelldaten downloaden') and place the files you get in the same folder as this script.\n";
	python_code += "# Then, run this script like this:\n";
	python_code += "# python3 scriptname.py\n";
	if (input_shape_is_image_val) {
		python_code += "# - or -\n";
		python_code += "# python3 scriptname.py 1.jpg 2.jpg 3.jpg\n";
	} else {
		python_code += "# You can either have the data you want to predict in x.txt, or, if it doesn't exist, you'll be asked for the data.\n";
	}

	python_code += "\n";

	python_code += "import sys\n";
	python_code += "import re\n";
	python_code += "import platform\n";
	python_code += "import shutil\n";
	python_code += "import os\n";
	python_code += "import subprocess\n";

	python_code += `
try:
    import venv
except ModuleNotFoundError:
    print("venv not found. Is python3-venv installed?")
    sys.exit(1)

from pathlib import Path

VENV_PATH = Path.home() / ".asanai_venv"
PYTHON_BIN = VENV_PATH / "bin" / "python"

if platform.system() == "Windows":
    PYTHON_BIN = VENV_PATH / "Scripts" / "python.exe"

def create_and_setup_venv():
    print(f"Creating virtualenv at {VENV_PATH}")
    venv.create(VENV_PATH, with_pip=True)
    subprocess.check_call([PYTHON_BIN, "-m", "pip", "install", "--upgrade", "pip"])
    subprocess.check_call([PYTHON_BIN, "-m", "pip", "install", "asanai"])

def restart_with_venv():
    try:
        result = subprocess.run(
            [str(PYTHON_BIN)] + sys.argv,
            text=True,
            check=True,
            env=dict(**os.environ)
        )
        sys.exit(result.returncode)
    except subprocess.CalledProcessError as e:
        print("Subprocess Error:")
        print(f"Exit-Code: {e.returncode}")
        sys.exit(e.returncode)
    except Exception as e:
        print(f"Unexpected error while restarting python: {e}")
        sys.exit(1)

try:
    import asanai
except ModuleNotFoundError:
    if not VENV_PATH.exists():
        create_and_setup_venv()
    else:
        try:
            subprocess.check_call([PYTHON_BIN, "-m", "pip", "install", "-q", "asanai"])
        except subprocess.CalledProcessError:
            shutil.rmtree(VENV_PATH)
            create_and_setup_venv()
            restart_with_venv()
    try:
        restart_with_venv()
    except KeyboardInterrupt:
        print("You cancelled installation")
        sys.exit(0)

`;

	python_code += "tf = asanai.install_tensorflow(sys.argv)\n";

	python_code += "\n";

	python_code += `# This code converts the tensorflow.js image from the browser to the tensorflow image for usage with python
if not os.path.exists('model.h5'):
    asanai.convert_to_keras_if_needed()

if not os.path.exists('model.h5'):
    print('model.h5 cannot be found')
    sys.exit(1)
`;

	python_code += "\n";

	return python_code;
}

function create_python_code (input_shape_is_image_val) {
	var python_code = python_boilerplate(input_shape_is_image_val, 1);

	python_code += "model = tf.keras.models.load_model('model.h5')\n";
	python_code += "\n";
	python_code += "model.summary()\n";
	python_code += "\n";

	if (input_shape_is_image_val) {
		python_code += "from tensorflow.keras.preprocessing.image import ImageDataGenerator\n";
		python_code += "import numpy as np\n";

		python_code += "\n";

		python_code += "labels = ['" + labels.join("', '") + "']\n";
		python_code += "height = " + height + "\n";
		python_code += "width = " + width + "\n";
		python_code += "divide_by = " + $("#divide_by").val() + "\n";

		python_code += "\n";

		python_code += `import rich

if asanai.output_is_simple_image(model) or asanai.output_is_complex_image(model):
    if len(sys.argv) == 1:
        asanai.visualize_webcam(model, height, width, divide_by)
    else:
        for a in range(1, len(sys.argv)):
            filename = sys.argv[a]
            asanai.visualize(model, filename)
elif asanai.model_is_simple_classification(model):
    for a in range(1, len(sys.argv)):
        filename = sys.argv[a]
        image = asanai.load(filename, height, width, divide_by)

        if image is None:
            asanai.console.print(f"[bold red]Error:[/] Could not load image: [italic]{filename}[/]")
            continue

        prediction = model.predict(image, verbose=0)

        for i in range(len(prediction)):
            nr_labels = len(prediction[i])
            if len(labels) < nr_labels:
                asanai.console.print(
                    rich.Panel.fit(
                        f"[bold red]Aborted:[/] Model returned [bold]{nr_labels}[/] labels,\\n"
                        f"but only [bold]{len(labels)}[/] labels are defined.",
                        title="Error",
                        border_style="red"
                    )
                )
                sys.exit(1)

            table = rich.Table(show_lines=True)

            table.add_column("Label", style="cyan", justify="right")
            table.add_column("Probability/Output", style="magenta", justify="left")

            for j in range(nr_labels):
                table.add_row(labels[j], f"{prediction[i][j]:.4f}")

            asanai.console.print(table)


    # If no command line arguments were given, try to predict the current webcam:
    if len(sys.argv) == 1:
        try:
            import cv2

            cap = cv2.VideoCapture(0)

            while True:
                # Capture frame-by-frame
                ret, frame = cap.read()

                if not ret:
                    import sys
                    print("Could not load frame from webcam. Is the webcam currently in use?")
                    sys.exit(1)

                image = asanai.load_frame(frame, height, width, divide_by)

                if image is not None:
                    predictions = model.predict(image, verbose=0)

                    frame = asanai.annotate_frame(frame, predictions, labels)

                    asanai.print_predictions_line(predictions, labels)

                    if frame is not None:
                        cv2.imshow('frame', frame)
                        if cv2.waitKey(1) & 0xFF == ord('q'):
                            break

                        if cv2.getWindowProperty("frame", cv2.WND_PROP_VISIBLE) < 1:
                            print("\\nWindow was closed.")
                            break

            # When everything done, release the capture
            cap.release()
            cv2.destroyAllWindows()
        except KeyboardInterrupt:
            print("You pressed CTRL-c. Program will end.")
            sys.exit(0)
else:
    print("I don't know how to deal with this!")
`;
	} else {
		python_code += `try:
    while True:
        x = asanai.load_or_input_model_data(model, 'x.txt')
        asanai.show_result(model.predict(x))
except (EOFError, KeyboardInterrupt):
    print("You pressed CTRL-c or CTRL-d. Script will exit.")
    sys.exit(0)
`;
	}

	return python_code;
}

async function hide_no_conv_stuff() {
	var any_conv_visualizations = 0;

	if(model) {
		if(Object.keys(model).includes("layers")) {
			for (var i = 0; i < model.layers.length; i++) {
				if (model.layers[i].name.startsWith("conv")) {
					any_conv_visualizations++;
				}
			}
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

	if(await input_shape_is_image()) {
		$(".hide_when_no_image").show();
		$(".hide_when_image").hide();
	} else {
		$("a[href*=\"tf_ribbon_augmentation\"]").hide().parent().hide();
		$("#auto_augment").prop("checked", false);
		$(".hide_when_no_image").hide();
		$(".hide_when_image").show();
	}

	hide_empty_tabs("visualization_ribbon");

	return any_conv_visualizations;
}

function get_shape_from_array(a) {
	typeassert(a, array, "a");

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

function _has_any_warning () {
	if($("#width").val() == "" || $("#height").val() == "") {
		//wrn("[_has_any_warning] Width or height is empty string, returning from updated_page");
		return true;
	}

	if (disable_show_python_and_create_model) {
		//info("[_has_any_warning] disable_show_python_and_create_model, returning from updated_page");
		return true;
	}

	if (is_setting_config) {
		//info("Currently running is_setting_config, returning from updated_page");
		return true;
	}

	if(has_missing_values) {
		l(language[lang]["not_creating_model_because_values_are_missing"]);
		return true;
	}

	return false;
}

var updated_page_internal = async (no_graph_restart, disable_auto_enable_valid_layer_types, no_prediction, no_update_initializers) => {
	if(_has_any_warning()) {
		return false;
	}

	rename_tmp_onchange();

	var number_of_layers = get_number_of_layers();
	show_or_hide_bias_initializer(number_of_layers);

	try {
		await compile_model();
	} catch (e) {
		if(Object.keys(e).includes("message")) {
			e = e.message;
		}

		log(e);
		log(language[lang]["there_was_an_error_compiling_the_model"] + ": " + e);
		throw new Error(e);
	}

	var redo_graph = await update_python_code(1);

	if (model && redo_graph && !no_graph_restart) {
		await restart_fcnn(1);
	}

	prev_layer_data = [];

	try {
		await identify_layers();
	} catch (e) {
		var stack = e.stack;
		if(Object.keys(e).includes("message")) {
			e = e.message;
		}

		err("identify_layers() failed with: " + e + ". Stack: ");
		console.log(stack);
	}

	layer_structure_cache = null;

	await save_current_status();

	enable_start_training_custom_tensors();

	var wait_for_latex_model = Promise.resolve(1);

	if (!no_update_math) {
		wait_for_latex_model = await write_model_to_latex_to_page();
	}

	await last_shape_layer_warning();

	await hide_no_conv_stuff();

	var current_input_shape = get_input_shape();
	if (cam) {
		stop_webcam();
	}

	try {
		await write_descriptions();
	} catch (e) {
		wrn(e);
	}

	allow_training();

	if (!no_prediction) {
		show_prediction(1, 1); // await not desired here
	}

	await wait_for_latex_model;
	//await wait_for_show_hide_load_weights;
	if(atrament_data.sketcher && await input_shape_is_image()) {
		try {
			await predict_handdrawn();
		} catch (e) {
			if(("" + e).includes("but got array with shape")) {
				var _err = "This may have happened when you change the model input size while prediction. In which case, it is a harmless error.";
				wrn("[updated_page_internal] " + _err);
				l(_err);
			} else {
				throw new Error(e);
			}
		}
	}

	if(mode == "beginner") {
		$(".expert_mode_only").hide();
	} else {
		$(".expert_mode_only").show();
	}

	allow_editable_labels();

	if(!no_update_initializers) {
		await insert_kernel_initializers();
		await insert_bias_initializers();
	}

	return true;
};

async function insert_kernel_initializers () {
	for (var i = 0; i < model.layers.length; i++) {
		await insert_initializer_options(i, "kernel");
	}

	await update_translations();
}

async function insert_bias_initializers () {
	for (var i = 0; i < model.layers.length; i++) {
		await insert_initializer_options(i, "bias");
	}

	await update_translations();
}

async function updated_page(no_graph_restart, disable_auto_enable_valid_layer_types, item, no_prediction, no_update_initializers) {
	if(!finished_loading) {
		return;
	}
	var updated_page_uuid = uuidv4();

	var functionName = "updated_page"; // Specify the function name

	try {
		waiting_updated_page_uuids.push(updated_page_uuid);

		while (waiting_updated_page_uuids.length && waiting_updated_page_uuids[0] != updated_page_uuid) {
			await delay(10);
		}

		/*
		console.log("updated_page trace:");
		console.trace();
		*/
		var ret = await updated_page_internal(no_graph_restart, disable_auto_enable_valid_layer_types, no_prediction, no_update_initializers);

		var index = waiting_updated_page_uuids.indexOf(updated_page_uuid);

		if (index !== -1) {
			waiting_updated_page_uuids.splice(index, 1);
		} else {
			console.warn("Could not find index of " + updated_page_uuid);
		}
	} catch (e) {
		var original_e = e;
		var index = waiting_updated_page_uuids.indexOf(updated_page_uuid);

		if (index !== -1) {
			waiting_updated_page_uuids.splice(index, 1);
		} else {
			console.error("Could not find index of " + updated_page_uuid);
		}

		if(Object.keys(e).includes("message")) {
			e = e.message;
		}

		if(("" + e).includes("There are zeroes in the output shape") || ("" + e).includes("Negative dimension size caused")) {
			var last_good = get_last_good_input_shape_as_string();
			l(language[lang]["input_size_too_small_restoring_last_known_good_config"] + " " + last_good);
			if(last_good && last_good != "[]" && last_good != get_input_shape_as_string()) {
				await set_input_shape(last_good, 1);
			}
		} else if(("" + e).includes("Cannot read properties of undefined (reading 'predict')")) {
			wrn("[updated_page] " + e);
		} else if(("" + e).includes("out of memory")) {
			await write_error("" + e);
		} else if(("" + e).includes("Cannot read properties of undefined")) {
			wrn("[updated_page] " + e);
		} else if(("" + e).includes("model.layers[i]")) {
			dbg("[updated_page] model.layers[i] (" + i + ") is undefined");
		} else if (("" + e).includes("model.layers is undefined")) {
			dbg("[updated_page] model.layers is undefined");
		} else if (("" + e).includes("model is undefined")) {
			dbg("[updated_page] model is undefined");
		} else if (("" + e).includes("model.input is undefined")) {
			dbg("[updated_page] model.input is undefined");
		} else if (("" + e).includes("Inputs to DepthwiseConv2D should have rank")) {
			dbg("[updated_page] " + e);
		} else if (("" + e).includes("targetShape is undefined")) {
			dbg("[updated_page] " + e);
		} else if (("" + e).includes("code is undefined")) {
			dbg("[updated_page] This error may happen when the whole DOM is deleted: " + e);
		} else if (("" + e).includes("fcnn is undefined")) {
			dbg("[updated_page] This error may happen when you did not include d3 or three.js: " + e);
		} else if (("" + e).includes("e is null")) {
			dbg("[updated_page] This error may happen when switching models: " + e);
		} else {
			err("" + e);
			console.error("Stack:", original_e.stack);
			throw new Error("" + e);
		}

		return false;
	}

	if(!ret) {
		if(finished_loading) {
			//wrn("updated_page failed");

			var last_good = get_last_good_input_shape_as_string();
			if(last_good && last_good != "[]" && last_good != get_input_shape_as_string()) {
				l(language[lang]["input_size_too_small_restoring_last_known_good_config"] + " " + last_good);
				await set_input_shape(last_good, 1);
			}
		}
	}

	try {
		await _temml();
	} catch (e) {
		wrn(e);
	}

	last_updated_page = Date.now();

	disable_everything_in_last_layer_enable_everyone_else_in_beginner_mode();

	show_or_hide_download_with_data();

	restart_fcnn();

	write_optimizer_to_math_tab();
}

function show_or_hide_download_with_data () {
	var show_download_with_data = true;

	try {
		if($("#loss").val() != "categoricalCrossentropy") {
			dbg(language[lang]["download_with_data_disabled_because_the_loss_is_not_categorical_cross_entropy"]);
			show_download_with_data = false;
		}

		if(!is_classification) {
			dbg(language[lang]["download_with_data_disabled_because_not_classification_problem"]);
			show_download_with_data = false;
		}

		if(!model) {
			dbg(language[lang]["download_with_data_disabled_because_no_model"]);
			show_download_with_data = false;
		}

		if(!Object.keys(model).includes("layers") || !model.layers || !model.layers.length) {
			dbg(language[lang]["download_with_data_disabled_because_no_layers"]);
			show_download_with_data = false;
		}

		if(!Object.keys(model).includes("layers") || model.layers[0].input.shape.length != 4) {
			dbg(`${language[lang]["download_with_data_disabled_input_shape_doesnt_have_four_elements"]}: ${JSON.stringify(model.layers[0].input.shape)}`);
			show_download_with_data = false;
		}

		if(!Object.keys(model).includes("layers") || model.layers[model.layers.length - 1].input.shape.length != 2) {
			dbg(`${language[lang]["download_with_data_disabled_input_shape_doesnt_have_two_elements"]}: ${JSON.stringify(model.layers[0].input.shape)}`);
			show_download_with_data = false;
		}
	} catch (e) {
		if(Object.keys(e).includes("message")) {
			e = e.message;
		}

		wrn("" + e + ". Disabling 'download with data'-button");

		show_download_with_data = false;
	}

	if(show_download_with_data) {
		$("#download_with_data").show();
	} else {
		$("#download_with_data").hide();
	}
}

async function change_optimizer() {
	var type = $("#optimizer").val();
	$(".optimizer_metadata").hide();

	$("#" + type + "_metadata").show();

	await updated_page();
}

function set_momentum(val) {
	$("#momentum_" + $("#optimizer").val()).val(val);
}

function set_validation_split(val) {
	assert(typeof(val) == "number" || is_numeric(val), val + " is not an number but " + typeof(number));
	val = parse_int(val);

	l(language[lang]["set_val_split_to"] + val);
	$("#validationSplit").val(val);

	//set_get("validation_split", val);
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

function set_learning_rate(val) {
	$("#learningRate_" + $("#optimizer").val()).val(val);
}

function add_label_sidebar() {
	var LABEL_SIDEBAR_BTN_HTML = $(`<button class="add_category" onclick="add_new_category();">+ <span class="TRANSLATEME_add_category"></span></button>`)[0];

	var labels = document.querySelectorAll('.own_image_label');
	if (!labels.length) return;

	var bar = document.getElementById('labelSidebar');
	var table;

	if (!bar) {
		// CSS nur einmal hinzufügen
		var existingStyle = document.querySelector('#labelSidebarStyle');
		if (!existingStyle) {
			var css = '\
			#labelSidebar{position:fixed;top:50%;right:0;transform:translateY(-50%);\
				max-height:90%;overflow:auto;background:rgba(0,0,0,0.3);\
				padding:6px 8px;z-index:9999;border-left:1px solid rgba(255,255,255,0.2);\
				box-shadow:-2px 0 6px rgba(0,0,0,0.4)}\
			#labelSidebar table{border-collapse:collapse;width:100%}\
			#labelSidebar td{padding:3px 6px;border:none;cursor:pointer;\
				color:white;text-shadow:0 0 2px black, 1px 1px 2px black;\
				font:14px sans-serif}\
			#labelSidebar td:hover{text-decoration:underline;background:rgba(255,255,255,0.1)}\
				.flashHighlight{animation:flash 1s ease-out}\
			@keyframes flash{0%{background:#fffa8b}100%{background:transparent}}';
			var style = document.createElement('style');
			style.id = 'labelSidebarStyle';
			style.appendChild(document.createTextNode(css));
			document.head.appendChild(style);
		}

		bar = document.createElement('div');
		bar.id = 'labelSidebar';
		table = document.createElement('table');
		bar.appendChild(LABEL_SIDEBAR_BTN_HTML);
		bar.appendChild(table);
		document.body.appendChild(bar);
	} else {
		table = bar.querySelector('table');
		table.innerHTML = '';
	}

	// Einträge einfügen
	Array.prototype.forEach.call(labels, function(el, i){
		if (!el.id) el.id = 'auto_label_' + i;

		var row = document.createElement('tr');
		var cell = document.createElement('td');
		cell.textContent = (el.value || el.textContent || 'label ' + (i+1));
		cell.onclick = function(){
			el.scrollIntoView({behavior:'smooth',block:'center'});
			el.classList.add('flashHighlight');
			setTimeout(function(){ el.classList.remove('flashHighlight'); }, 1100);
		};
		row.appendChild(cell);
		table.appendChild(row);
	});

	// Sichtbarkeitsprüfung
	function update_sidebar_visibility() {
		var visibleCount = 0;
		Array.prototype.forEach.call(labels, function(el, idx){
			var hidden = is_hidden_or_has_hidden_parent(el);
			table.rows[idx].style.display = hidden ? 'none' : '';
			if (!hidden) visibleCount++;
		});
		bar.style.display = visibleCount ? '' : 'none';
	}

	update_sidebar_visibility();

	// Observer vorbereiten
	if (labelSidebarObserver) labelSidebarObserver.disconnect();

	labelSidebarObserver = new MutationObserver(update_sidebar_visibility);
	Array.prototype.forEach.call(labels, function(el){
		labelSidebarObserver.observe(el, {attributes:true, attributeFilter:['style','class','hidden']});
	});
	labelSidebarObserver.observe(document.body, {childList:true, subtree:true});
}

function remove_label_sidebar(full = false) {
	if (labelSidebarObserver) {
		labelSidebarObserver.disconnect();
		labelSidebarObserver = null;
	}

	var bar = document.getElementById('labelSidebar');
	if (bar) {
		if (full) {
			bar.remove();
			var style = document.getElementById('labelSidebarStyle');
			if (style) style.remove();
		} else {
			bar.style.display = 'none';
		}
	}
}

function write_model_summary_wait () {
	var redo_summary = false;

	if(model && !Object.keys(model).includes("uuid")) {
		redo_summary = true;
	}

	if(!redo_summary && model && last_summary_model_uuid != model.uuid) {
		redo_summary = true;
	}

	if(redo_summary) {
		try {
			var html_code = `<center><div class="spinner"></div></center>`;
			if(html_code != document.getElementById("summary").innerHTML) {
				document.getElementById("summary").innerHTML = html_code;

			}

			invert_elements_in_dark_mode();
			write_model_summary();
		} catch (e) {
			if(Object.keys(e).includes("message")) {
				e = e.message;
			}

			if(("" + e).includes("getElementById(...) is null")) {
				wrn("[write_model_summary_wait] Did you remove the summary tab manually?");
			} else if(("" + e).includes("model is empty. Add some layers first")) {
				err("[write_model_summary_wait] " + e);
			} else {
				throw new Error(e);
			}
		}
	}
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

	console.log = logBackup;

	document.getElementById("summary").innerHTML = summary_to_table(logMessages);

	last_summary_model_uuid = model.uuid;
}

function reset_summary() {
	$("#summarycontainer").hide();
	$("#summary").html("");
}

function set_optimizer(val, trigger_change = 1) {
	assert(typeof(val) == "string", val + " is not an string but " + typeof(val));
	l(language[lang]["set_optimizer_to"] + val);
	$("#optimizer").val(val);
	if(trigger_change) {
		$("#optimizer").trigger("change");
	}
}

function set_metric(val, trigger_change = 1) {
	l(language[lang]["set_metric_to"] + val);

	if(Object.keys(metric_shortnames).includes(val)) {
		val = metric_shortnames[val];
	}

	assert(metrics.includes(val), metric + " is not a valid metric. It must be in " + metrics.join(", "));
	assert(typeof(val) == "string", val + " is not an string but " + typeof(val));

	if($("#metric").val() != val) {
		$("#metric").val(val);
		if(trigger_change) {
			$("#metric").trigger("change");
		}
	}
}

function set_loss(val, trigger_change = 1) {
	l(language[lang]["set_loss_to"] + val);

	assert(losses.includes(val), loss + " is not a valid loss. It must be in " + losses.join(", "));
	assert(typeof(val) == "string", val + " is not an string but " + typeof(val));

	if($("#loss").val() != val) {
		$("#loss").val(val);
		if(trigger_change) {
			$("#loss").trigger("change");
		}
	}
}

function get_epochs() {
	return parse_int($("#epochs").val());
}

function get_batch_size() {
	return parse_int($("#batchSize").val());
}

function set_batch_size(val) {
	assert(typeof(val) == "number" || is_numeric(val), val + " is not numeric but " + typeof(val));
	val = parse_int(val);

	l(language[lang]["setting_batch_size_to"] + " " + val);
	$("#batchSize").val(val);

	//set_get("batch_size", val);
}

function set_epochs(val) {
	assert(typeof(val) == "number" || is_numeric(val), val + " is not numeric but " + typeof(val));
	val = parse_int(val);
	dbg(`[set_epochs] ${language[lang]["setting_epochs_to"]} ${val}`);
	document.getElementById("epochs").value = val;
	$(document.getElementById("epochs")).trigger("change");

	//set_get("epochs", val);
}

function set_number_of_layers(val) {
	assert(typeof(val) == "number", val + " is not an integer but " + typeof(val));
	document.getElementById("number_of_layers").value = val;
	return val;
}

function get_number_of_layers() {
	try {
		return parse_int(document.getElementById("number_of_layers").value);
	} catch (e) {
		if(("" + e).includes("getElementById(...) is null")) {
			wrn("[get_number_of_layers] Was the $('#number_of_layers') element removed?");
		} else {
			throw new Error(e);
		}
	}
}

function init_epochs(val) {
	assert(typeof(val) == "number", "init_epochs(" + val + ") is not an integer but " + typeof(val));
	l(language[lang]["initializing_epochs_to"] + " " + val);
	set_epochs(val);
}

async function init_number_of_layers(val) {
	assert(typeof(val) == "number", "init_number_of_layers(" + val + ") is not an integer but " + typeof(val));

	await set_number_of_layers(val);

	await show_layers(val);

	number_of_initialized_layers = val;
	//updated_page();
}

function get_option_for_layer_by_type(nr) {
	assert(typeof(nr) == "number", "get_option_for_layer_by_type(" + nr + ") is not a number, but " + typeof(nr));

	var layer_type = $($(".layer_type")[nr]);

	var type = layer_type.val();

	if (!type) {
		layer_type.children().children().each(function () {
			if ($(this).val() == "dense") {
				$(this).prop("selected", true);
			}
		});
		type = layer_type.val();
		err(language[lang]["cannot_determine_type_of_layer"] + " " + nr);
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
						var _code = "str += add_" + item + "_option(type, nr);";
						eval(_code);
					}
				}
			} else {
				alert("No options given for " + key);
			}
		}
	}

	assert(typeof(str) == "string", "str is not a string in get_option_for_layer_by_type, but " + str + ", " + typeof(str));

	return str;
}

async function initializer_layer_options(thisitem) {
	if ($(thisitem).hasClass("swal2-select") || $(thisitem).attr("id") == "model_dataset") {
		return;
	}

	//assert(typeof(thisitem) == "object", "initializer_layer_options(" + thisitem + ") is not an object but " + typeof(thisitem));

	layer_structure_cache = null;

	var nr = thisitem;
	if (typeof(nr) != "number") {
		nr = find_layer_number_by_element(thisitem);
	}

	assert(typeof(nr) == "number", "found nr is not an integer but " + typeof(nr));

	await set_option_for_layer_by_layer_nr(nr);

	var chosen_option = $($(".layer_setting")[nr]).find(".layer_type").val();
	$($(".layer_setting")[nr]).find("option").each(function (i, x) {
		if (chosen_option == $(x).val()) {
			$(x).attr("selected", "selected");
		} else {
			$(x).removeAttr("selected");
		}
	});

	await updated_page(null, 1);
}

// sets options for layer by layer nr++++
async function set_option_for_layer_by_layer_nr(nr) {
	assert(typeof(nr) == "number", "initializer_layer_options_by_layer_nr(" + nr + ") is not a number but " + typeof(nr));

	var layer = $(".layer_options_internal")[nr];
	layer.innerHTML = get_option_for_layer_by_type(nr);

	$($(".layer_options_internal")[nr]).find("select").trigger("change");

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
	assert(typeof(item) == "object", "toggle_options(" + item + ") is not an object but " + typeof(item));

	$(item).parent().parent().parent().next().toggle();
	await write_descriptions(1);
}

async function disable_invalid_layers_event(e, thisitem) {
	assert(typeof(e) == "object", "disable_all_invalid_layers(e -> " + e + " is not an object but " + typeof(e));
	assert(typeof(thisitem) == "object", "disable_all_invalid_layers(e, thisitem -> " + thisitem + " is not an [object HTMLSelectElement] but " + typeof(thisitem));

	e.preventDefault();
	var layer_nr = null;

	layer_nr = find_layer_number_by_element(thisitem);

	await enable_valid_layer_types(layer_nr);
}

async function disable_all_invalid_layers() {
	document.body.style.pointerEvents = "none";
	await disable_all_invalid_layers_from(0);
	document.body.style.pointerEvents = "";
}

async function disable_all_invalid_layers_from(start) {
	assert(typeof(start) == "number", "disable_all_invalid_layers_from(" + start + ") is not a number but " + typeof(start));

	favicon_spinner();
	for (var i = start; i < get_number_of_layers(); i++) {
		await enable_valid_layer_types(i);
	}
	favicon_default();
}

function enable_all_layer_types () {
	if(!model || !Object.keys(model).includes("layers") || !model.layers.length) {
		err(language[lang]["model_not_found_or_has_no_layers"]);
		return;
	}

	for (var layer_nr = 0; layer_nr < model.layers.length; layer_nr++) {
		var options = $($($(".layer_type")[layer_nr]).children().children());

		for (var i = 0; i < options.length; i++) {
			if (!$(options[i]).is(":selected")) {
				$(options[i]).prop("disabled", true);
			}

			$(options[i]).prop("disabled", false);
		}
	}
}

async function enable_valid_layer_types(layer_nr) {
	if(started_training && !is_repairing_output_shape) {
		info(language[lang]["enable_valid_layer_types_disabled_in_training"]);
		return;
	}
	assert(typeof(layer_nr) == "number", "enable_valid_layer_types(" + layer_nr + ") is not a number but " + typeof(layer_nr));

	if(is_repairing_output_shape) {
		enable_all_layer_types();
		return;
	}

	var valid_layer_types = await get_valid_layer_types(layer_nr);

	var options = $($($(".layer_type")[layer_nr]).children().children());

	for (var i = 0; i < options.length; i++) {
		if (!$(options[i]).is(":selected")) {
			$(options[i]).prop("disabled", true);
		}

		if (valid_layer_types.includes($(options[i]).prop("value"))) {
			$(options[i]).prop("disabled", false);
		}
	}
}

function option_for_layer(nr) {
	assert(typeof(nr) == "number", "option_for_layer(" + nr + ") is not a number but " + typeof(number));

	var this_event = "initializer_layer_options(this)";

	var option_for_layer_id = `option_for_layer_${uuidv4()}`;

	var str = "";
	str += "<tr>";
	str += "<td style='width: 140px'>";
	str += "<button style='cursor: context-menu' class='show_data layer_options_button' onclick='toggle_options(this)'><img src='_gui/icons/settings.svg' class='icon_small' />&nbsp;<span class='TRANSLATEME_settings'></span></button>";
	str += "</td>";
	str += "<td>";
	str += `<select id="${option_for_layer_id}" onfocus='disable_invalid_layers_event(event, this)' onchange='${this_event}' class='input_data layer_type'>`;
	var last_category = "";
	for (var key of layer_names) {
		var this_category = layer_options[key].category;
		if (last_category != this_category) {
			if (last_category != "") {
				str += "</optgroup>";
			}
			str += "<optgroup label=\"" + this_category + "\">";
			last_category = this_category;
		}
		str += "<option class='layer_type_selector_" + key + "' value='" + key + "'>" + get_python_name(key) + "</option>";
	}
	str += "</optgroup>";
	str += "</select>";
	str += "</td>";
	str += "</tr>";
	str += "<tbody class='layer_options_internal' style='display: none'></tbody>";

	return str;
}

async function remove_layer(item) {
	assert(typeof(item) == "object", "item is not an object but " + typeof(item));

	var number_of_layers_element = document.getElementById("number_of_layers");
	var old_value = parse_int(number_of_layers_element.value);
	if (old_value > 1) {
		$($(item).parent()[0]).parent().remove();

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
			icon: "error",
			title: "Oops [2]...",
			text: "You cannot remove the last remaining layer of your model.",
		});
	}

	await write_descriptions();
	//rename_labels();
	await predict_handdrawn();

	disable_everything_in_last_layer_enable_everyone_else_in_beginner_mode();

	await restart_webcam_if_needed();

	l(language[lang]["removed_layer"]);
}

function get_element_xpath(element) {
	assert(typeof(element) == "object", "item is not an object but " + typeof(element));

	var idx = (sib, name) => sib
		? idx(sib.previousElementSibling, name || sib.localName) + (sib.localName == name)
		: 1;
	var segs = elm => !elm || elm.nodeType !== 1
		? [""]
		: elm.id && document.getElementById(elm.id) === elm
			? [`id("${elm.id}")`]
			: [...segs(elm.parentNode), `${elm.localName.toLowerCase()}[${idx(elm)}]`];
	return segs(element).join("/");
}

async function add_layer(item) {
	assert(typeof(item) == "object", "item is not an object but " + typeof(item));

	layer_structure_cache = null;

	var real_nr = null;

	var item_xpath = get_element_xpath(item);

	var add_layer_buttons = $(".add_layer");
	for (var nr = 0; nr < add_layer_buttons.length; nr++) {
		var elem = add_layer_buttons[nr];
		if (item_xpath == get_element_xpath(elem)) {
			real_nr = nr;
		}
	}

	assert(real_nr !== null, "real_nr is null!");

	var nr_of_layer = (get_number_of_layers() - 1);

	var item_parent_parent = $(item).parent().parent();

	var plus_or_minus_one = 1;

	try {
		if(real_nr == nr_of_layer) { // insert before last layer
			item_parent_parent.clone().insertBefore(item_parent_parent);
			plus_or_minus_one = 0;
		} else {
			item_parent_parent.clone().insertAfter(item_parent_parent);
		}
	} catch (e) {
		if(Object.keys(e).includes("message")) {
			e = e.message;
		}

		err("[add_layer] " + e);
	}

	$("#number_of_layers").val(parse_int($("#number_of_layers").val()) + 1);

	var previous_layer_type = $($($($(".layer_setting")[real_nr])).find(".layer_type")[0]).val();
	var new_layer_type = previous_layer_type;
	if (new_layer_type == "flatten") {
		new_layer_type = "dense";
	}
	$($($($(".layer_setting")[real_nr + plus_or_minus_one])).find(".layer_type")[0]).val(new_layer_type).trigger("change");

	await updated_page();

	await write_descriptions();

	$(".remove_layer").prop("disabled", false);
	$(".remove_layer").show();

	$($(".remove_layer")[real_nr + plus_or_minus_one]).removeAttr("disabled");

	await save_current_status();

	await rename_labels();
	await predict_handdrawn();

	disable_everything_in_last_layer_enable_everyone_else_in_beginner_mode();

	await restart_webcam_if_needed();

	l(language[lang]["added_layer"]);

}

function sortable_layers_container(layers_container) {
	assert(typeof(layers_container) == "object", "layers_container is not an object but " + typeof(layers_container));

	var error_div = $("#error");

	layers_container.sortable({
		cursor: "move",
		handle: "div",
		helper: "clone",
		forcePlaceholderSize: true,
		placeholder: "placeholder",
		start: function (e, ui) {
			ui.placeholder.height(ui.item.height());
			ui.placeholder.css("visibility", "visible");
			$(".descriptions_of_layers").hide();
		},
		update: async function (e, ui) {
			try {
				await compile_model();
				error_div.html("");
				error_div.parent().hide();
			} catch (e) {
				if (mode == "beginner") {
					$("#layers_container").sortable("cancel");
					alert("Dropping this layer there causes the model.compile command to fail. Reverting this drop:\n" + e);
					try {
						await compile_model();
					} catch (e) {
						log(e);
					}
					error_div.html("");
					error_div.parent().hide();
				} else {
					error_div.html(e);
					error_div.parent().show();
				}
			}

			$(".descriptions_of_layers").show();
			await updated_page();
		},
		axis: "y",
		revert: true
	});

	layers_container.droppable({
		tolerance: "pointer"
	});

}

function disable_all_non_selected_layer_types() {
	var all_options = $(".layer_type").children().children();

	for (var i = 0; i < all_options.length; i++) {
		var this_all_options = $(all_options[i]);
		if (!this_all_options.is(":selected")) {
			if (this_all_options.val() != "dense") {
				this_all_options.prop("disabled", true);
			}
		} else {
			this_all_options.prop("selected", true);
		}
	}
}

async function show_layers(number) {
	assert(typeof(number) == "number", "show_layer(" + number + ") is not a number but " + typeof(number));

	var layers_container = $("#layers_container");

	var layers_container_str = "";
	var layer_visualizations_tab_str = $("#layer_visualizations_tab").html();

	var remove = "<button class='add_remove_layer_button remove_layer' disabled='' onclick='remove_layer(this)'>-</button>&thinsp;";
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
		
	}

	layers_container[0].innerHTML = layers_container_str;

	for (var i = 0; i < number; i++) {
		await initializer_layer_options(i);
	}

	$("#layer_visualizations_tab").html(layer_visualizations_tab_str);

	sortable_layers_container(layers_container);

	$(".train_neural_network_button").show();
}

function reset_photo_gallery() {
	$("#photoscontainer").hide();
	document.getElementById("photos").innerHTML = "";
}

function set_xyz_values(j, name, values) {
	assert(typeof(j) == "number", "j must be number, is: " + typeof(number));
	assert(typeof(name) == "string", "name must be string, is: " + typeof(name));
	assert(typeof(values) == "object", "name must be object, is: " + typeof(values));

	var letter = "x";
	for (var i = 0; i < values.length; i++) {
		var this_name = name + "_" + String.fromCharCode(letter.charCodeAt() + i);
		set_item_value(j, this_name, values[i]);
	}
}

async function set_config(index) {
	assert(["string", "undefined"].includes(typeof(index)), "Index must be either string or undefined, but is " + typeof(index) + " (" + index + ")");

	//console.log("block 1");

	last_known_good_input_shape = "[]";

	$(".only_show_when_predicting_image_file").hide();

	var swal_msg = language[lang]["loading_model"];

	if (index) {
		swal_msg = language[lang]["undoing_redoing"];
	}

	//console.log("block 2");
	try {
		l(swal_msg);
		//console.log("block 2.1");

		var overlay = load_msg({"title": swal_msg + "..."});

		var original_disabling_saving_status = disabling_saving_status;
		disabling_saving_status = true;

		prev_layer_data = [];

		is_setting_config = true;

		var config = await _get_configuration(index);

		disable_show_python_and_create_model = true;
		//console.log("block 2.2");

		if (config) {
			if (!index) {
				var trigger_height_change = 0;

				if (config["width"]) {
					dbg("[set_config] " + language[lang]["setting_width"]);
					$("#width").val(config["width"]);
					trigger_height_change++;
					width = config["width"];
					assert(typeof(width) == "number", "width is not a number");
				}

				if (config["height"]) {
					dbg("[set_config] " + language[lang]["setting_height"]);
					$("#height").val(config["height"]);
					trigger_height_change++;
					height = config["height"];
					assert(typeof(height) == "number", "height is not a number");
				}

				if (config["labels"]) {
					l(language[lang]["setting_labels_from_config"]);
					await set_labels(config["labels"]);
					assert(labels.length > 0, "could not get labels even though they are specified");
				}

				if (config["max_number_of_files_per_category"]) {
					assert(typeof(config["max_number_of_files_per_category"]) == "number", "max_number_of_files_per_category is not a number");
					dbg(`[set_config] ${language[lang]["setting_max_number_of_files_per_category_to"]} ${config["max_number_of_files_per_category"]}`);
					$("#max_number_of_files_per_category").val(config["max_number_of_files_per_category"]);
				} else {
					dbg(`[set_config] ${language[lang]["no_max_number_of_files_per_category_found_in_config"]}`);
				}

				if (config["divide_by"]) {
					assert(typeof(config["divide_by"]) == "number", "divide_by is not a number");
					dbg(`[set_config] ${language[lang]["setting_divide_by_to"]} ` + config["divide_by"])
					$("#divide_by").val(config["divide_by"]);
				} else {
					dbg(`[set_config] ${language[lang]["setting_divide_by_to"]} ` + 1);
					$("#divide_by").val(1);
				}

				assert(typeof(config["epochs"]) == "number", "epochs is not a number");
				assert(typeof(config["loss"]) == "string", "loss is not a string");

				if(finished_loading) {
					set_epochs(config["epochs"]);
					set_batch_size(config["batchSize"]);
					set_validation_split(config["validationSplit"]);
				}
				set_loss(config["loss"], 0);

				set_metric(config["metric"], 0);
				set_optimizer(config["optimizer"], 0);

				$("#height").trigger("change"); // quickfix for compiling changes only now instead of many times earlier on each trigger.change

				if (config["optimizer"] == "rmsprop") {
					l(language[lang]["setting_optimizer_to_rmsprop"]);
					set_rho(config["rho"]);
					set_decay(config["decay"]);
					set_epsilon(config["epsilon"]);
				}

				if (["sgd", "rmsprop"].includes(config["optimizer"])) {
					set_learning_rate(config["learningRate"]);
				}

				if (["monentum", "rmsprop"].includes(config["optimizer"])) {
					set_momentum(config["momentum"]);
				}
			}

			var number_of_layers = 0;

			var keras_layers;
			if (!config["model_structure"]) {
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
					await send_bug_report();

					Swal.fire({
						icon: "error",
						title: "Oops [1]...",
						text: "Error loading the model"
					});
					await write_descriptions();
					log(config);
					return;
				}

				try {
					number_of_layers = keras_layers.length - (keras_layers[0]["class_name"] == "InputLayer" ? 1 : 0);
				} catch (e) {
					Swal.close();
					err(e);
					l(language[lang]["error_cannot_load_this_model_file_is_it_json_from_asanai_or_a_graph_model"]);
					remove_overlay();
					return;
				}
			} else {
				number_of_layers = config["model_structure"].length;
			}

			//log("number_of_layers: " + number_of_layers);
			await init_number_of_layers(number_of_layers);

			if (config["input_shape"]) {
				await set_input_shape(config["input_shape"]);
			} else {
				var is = null;
				try {
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

						if(is[0] == 1 && is.length == 4) {
							is.shift();
						}

						await set_input_shape("[" + is.join(", ") + "]");
					} else {
						l(language[lang]["error_keras_not_found_in_config"]);
					}
				} catch (e) {
					if(Object.keys(e).includes("message")) {
						e = e.message;
					}

					remove_overlay();

					if (("" + e).includes("config.keras.config")) {
						err("[set_config] Keras configuration could not be found!");
						return;
					} else {
						throw new Error(e);
					}
				}
			}

			var first_layer_batch_input_shape = keras_layers[0]["config"]["batch_input_shape"];

			assert(Array.isArray(first_layer_batch_input_shape), "first_layer_batch_input_shape is not an array");

			if(first_layer_batch_input_shape.length == 4 && first_layer_batch_input_shape[first_layer_batch_input_shape.length - 1] == 3) {
				var new_height = first_layer_batch_input_shape[1];
				var new_width = first_layer_batch_input_shape[2];

				width = new_width;
				height = new_height;

				$("#width").val(new_width).trigger("change");
				$("#height").val(new_height).trigger("chance");

				await updated_page(1);
			}

			if (!config["model_structure"]) {
				if (keras_layers[0]["class_name"] == "InputLayer") {
					keras_layers.shift();
				}

				var layer_settings = $(".layer_setting");
				for (var i = 0; i < keras_layers.length; i++) {
					var layer_type = $($(layer_settings[i]).find(".layer_type")[0]);
					dbg("[set_config] " + language[lang]["setting_layer"] + " " + i + " -> " + python_names_to_js_names[keras_layers[i]["class_name"]]);
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

					dbg("[set_config] " + language[lang]["setting_options_for_layer"] + " " + i);

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
								//wrn("Item not found in keras: " + item_name);
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
					dbg("[set_config] " + language[lang]["setting_options_for_layer"] + " " + i);
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
								if ((typeof(value)).includes("object")) {
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

		//console.log("block 2.3");

		disabling_saving_status = original_disabling_saving_status;
		disable_show_python_and_create_model = false;

		l(language[lang]["creating_model"]);

		if(global_model_data) {
			await dispose(global_model_data);
		}

		//console.log("block 2.4");
		[model, global_model_data] = await create_model(model);

		l(language[lang]["compiling_model"]);
		await compile_model();

		//console.log("block 2.5");
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
			return;
		}

		disable_all_non_selected_layer_types();

		if (!index) {
			dbg(`[set_config] ${language[lang]["saving_current_status"]}`);

			await save_current_status();
		}

		dbg("[set_config] " + language[lang]["getting_labels"]);
		await get_label_data();

		is_setting_config = false;

		l(language[lang]["updating_page"]);
		var start_t = Date.now();
		await updated_page(null, null, null, 1);
		var end_t = Date.now();
		var runtime = (end_t - start_t) / 1000;
		var hrt = human_readable_time(runtime);
		if(hrt) {
			l(language[lang]["page_update_took"] + " " + hrt);
		}

		//console.log("block 2.6");
		await write_descriptions();

		//dbg("[set_config] " + language[lang]["updating_predictions"]);
		//await show_prediction(1, 1);

		//console.log("block 2.7");
		$(".kernel_initializer").trigger("change");
		$(".bias_initializer").trigger("change");

		if(finished_loading) {
			await wait_for_updated_page(2);
		}

		//console.log("block 2.8");
		//l(language[lang]["loaded_configuration"]);

		if(!index) {
			if(await input_shape_is_image()) {
				$("#photos").show();
				$("#xy_display_data").hide();
			} else {
				$("#photos").hide();
				$("#xy_display_data").show();
			}
		}
	} catch (e) {
		if(Object.keys(e).includes("message")) {
			e = e.message;
		}

		err("[set_config] " + e);
	}

	//console.log("block 3");

	remove_overlay();
}

async function wait_for_updated_page (seconds) {
	while (waiting_updated_page_uuids.length) {
		await delay(10);
	}
}

async function init_dataset() {
	$("#photos").html("").hide();
	$("#maximally_activated_content").html("");
	hide_tab_label("maximally_activated_label");

	show_tab_label("fcnn_tab_label");
	hide_tab_label("training_tab_label");

	clicked_on_tab = 0;
	init_epochs(1);

	set_batch_size(1);

	$(".training_performance_tabs").hide();

	$("#data_origin").val("default").trigger("change");
	show_tab_label("visualization_tab_label");
	show_tab_label("training_data_tab_label", $("#jump_to_interesting_tab").is(":checked") ? 1 : 0);

	await save_current_status();
	init_weight_file_list();
	init_download_link();

	$("#predict_error").html("");
	$("#prediction").html("");
}

function init_download_link() {
	let html = "";
	html = "Download the training data <a alt='Download Training Data as ZIP' href='traindata/zip.php?dataset=" + $("#dataset").val() + "'>here</a>.";
	var d = $("#download_data").html(html).show;
}

async function get_number_of_categories() {
	var training_data_info = await _get_training_data();
	var num = Object.keys(training_data_info).length;
	return num;
}

async function chose_dataset(no_set_config) {
	$("#data_origin").val("default").trigger("change");

	$("#maximally_activated_content").html("");
	hide_tab_label("maximally_activated_label");
	show_tab_label("visualization_tab_label", $("#jump_to_interesting_tab").is(":checked") ? 1 : 0);
	show_tab_label("fcnn_tab_label", $("#jump_to_interesting_tab").is(":checked") ? 1 : 0);

	init_weight_file_list();
	x_file = null;
	y_file = null;
	y_shape = null;

	status_saves = [];
	state_stack = [];
	future_state_stack = [];

	show_hide_undo_buttons();

	model_is_trained = false;
	if (!no_set_config) {
		await set_config();
	}
	is_setting_config = false;

	$("#predict_error").html("");
	$("#prediction").html("");

	try {
		await identify_layers();
	} catch (e) {
		if(Object.keys(e).includes("message")) {
			e = e.message;
		}

		wrn("" + e);
	}
	init_download_link();

	await force_download_image_preview_data();

	$("#prediction_non_image").hide();
	$(".hide_when_custom_data").show().each((i, e) => { $(e).show(); });

	model = await _create_model();
	await compile_model();

	await delay(500);
	await show_prediction(1, 1);

	hide_dataset_when_only_one();

	l(language[lang]["ok_chosen_dataset"]);
}

function init_weight_file_list() {
	$("#model_dataset").find("option").remove();

	var chosen_dataset = $("#dataset").find(":selected").text();

	var this_struct = traindata_struct[chosen_dataset]["weights_file"];

	var weight_files = Object.keys(this_struct);

	for (var i = 0; i < weight_files.length; i++) {
		var new_option = $("<option>", { value: weight_files[i], text: weight_files[i] });
		$("#model_dataset").append(new_option);
	}

	hide_dataset_when_only_one();
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
				item_name = item_name.replace(/\.parent/, "");
				$("#" + item_name).parent().show();
			} else {
				$("#" + item_name).show();
			}
		}

		for (var i = 0; i < show_items["else"].length; i++) {
			var item_name = show_items["else"][i];
			if (item_name.endsWith(".parent")) {
				item_name = item_name.replace(/\.parent/, "");
				$("#" + item_name).parent().hide();
			} else {
				$("#" + item_name).hide();
			}
		}
	} else {
		for (var i = 0; i < show_items["else"].length; i++) {
			var item_name = show_items["else"][i];
			if (item_name.endsWith(".parent")) {
				item_name = item_name.replace(/\.parent/, "");
				$("#" + item_name).parent().show();
			} else {
				$("#" + item_name).show();
			}
		}

		for (var i = 0; i < show_items["image"].length; i++) {
			var item_name = show_items["image"][i];
			if (item_name.endsWith(".parent")) {
				item_name = item_name.replace(/\.parent/, "");
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

	$("#data_origin").change(function () {
		$("#data_origin option[value=\"default\"]").prop("disabled", false);
	});

	init_download_link();
	init_categories();
	init_weight_file_list();

	number_of_initialized_layers = 0;

	state_stack = [];
	future_state_stack = [];

	hide_tab_label("training_tab_label");

	is_setting_config = original_is_settings_config;

	$("#data_origin").val("default").trigger("change");

	show_tab_label("visualization_tab_label", $("#jump_to_interesting_tab").is(":checked") ? 1 : 0);
	show_tab_label("fcnn_tab_label", $("#jump_to_interesting_tab").is(":checked") ? 1 : 0);

	await updated_page();
	init_download_link();
}

async function clean_gui() {
	reset_summary();
	await write_descriptions();
}

async function set_input_shape(val, force=0) {
	assert(typeof(val) == "string", "set_input_shape(" + val + "), val is not string, but " + typeof(val));

	if(force && await input_shape_is_image()) {
		var new_input_shape = val;
		new_input_shape = new_input_shape.replace("[", "").replace("]", "").split(", ");

		if(new_input_shape.length == 4 && new_input_shape[0] == 1) {
			new_input_shape.shift();
		}

		var new_height = new_input_shape[0];
		var new_width = new_input_shape[1];

		if(height != new_height) {
			$("#height").val(new_height).trigger("change");
		}

		if(width != new_width) {
			$("#width").val(new_width).trigger("change");
		}
	}

	$("#inputShape").val(val);

	await write_descriptions();

	var res = get_input_shape();

	return res;
}

function get_input_shape_with_batch_size() {
	var shape = get_input_shape();
	shape.unshift(parse_int($("#batchSize").val()));
	var res = shape;
	return res;
}

function get_input_shape() {
	var code = $("#inputShape").val();
	if (!code.startsWith("[")) {
		code = "[" + code + "]";
	}
	var match = code.match(/^\s*\[\s*(?:(?:\s*\d+\s*,\s*)*\d+)?\s*\]\s*$/);
	if(match) {
		var res = eval(code);
		return res;
	} else {
		if(model && typeof(model.input.shape) == "object") {
			return model.input.shape.filter(n => n);
		} else {
			return [];
		}
	}
}

async function change_metrics() {
	var new_metric = $("#metric").val();

	l(language[lang]["changed_metrics"]);
	$("#metric_equation").html("");

	await updated_page(1);
}

function change_favicon(path) {
	assert(typeof(path) == "string", "Path for change_favicon(" + path + ") is not a string, but " + typeof(path));

	var link = document.querySelector("link[rel~='icon']");
	if (!link) {
		link = document.createElement("link");
		link.rel = "icon";
		document.getElementsByTagName("head")[0].appendChild(link);
	}
	link.href = path;
}

function favicon_default() {
	change_favicon("favicon.ico");
}

function favicon_spinner() {
	change_favicon("_gui/loading_favicon.gif");
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
	document.body.style.cursor = get_cursor_or_none("default");
	$("#layers_container").sortable("enable");
	$("#ribbon,select,input,checkbox,.add_remove_layer_button").prop("disabled", false);
	await write_descriptions();
	await highlight_code();

	disable_everything_in_last_layer_enable_everyone_else_in_beginner_mode();
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

function show_or_hide_bias_initializer(number_of_layers) {
	var layer_settings = $(".layer_setting");
	for (var i = 0; i < number_of_layers; i++) {
		var this_layer = $(layer_settings[i]);
		var use_bias_setting = this_layer.find(".use_bias");
		if (use_bias_setting.length) {
			if ($(use_bias_setting[0]).is(":checked")) {
				this_layer.find(".bias_initializer").parent().parent().show();
			} else {
				this_layer.find(".bias_initializer").parent().parent().hide();
			}
		}
	}
}

async function set_all_kernel_initializers() {
	var chosen_value = $("#set_all_kernel_initializers").val();
	l(language[lang]["setting_all_kernel_initializers_to"] + " " + chosen_value);
	var initializer_keys = Object.keys(initializers);
	if (initializer_keys.includes(chosen_value)) {
		$(".kernel_initializer").val(chosen_value).trigger("change");
	}

	$("#set_all_kernel_initializers").val("none");

	await updated_page();
}

async function set_all_bias_initializers() {
	var chosen_value = $("#set_all_bias_initializers").val();
	l(language[lang]["setting_all_bias_initializers_to"] + " " + chosen_value);
	var initializer_keys = Object.keys(initializers);
	if (initializer_keys.includes(chosen_value)) {
		$(".bias_initializer").val(chosen_value).trigger("change");
	}

	$("#set_all_bias_initializers").val("none");

	await updated_page();
}

async function set_all_activation_functions_except_last_layer() {
	var chosen_value = $("#set_all_activation_functions_except_last_layer").val();
	l(language[lang]["setting_all_activation_functions_except_last_layer_to"] + " " + chosen_value);
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
	l(language[lang]["setting_all_activation_functions_to"] + " " + chosen_value);
	var keys = Object.keys(activations);
	if (keys.includes(chosen_value)) {
		$(".activation").val(chosen_value).trigger("change");
	}

	$("#set_all_activation_functions").val("none");

	await updated_page();
}

function last_index(_array) {
	assert(typeof(_array) == "object", "last_index(" + _array + ") is not an _array but " + typeof(_array));
	return _array.length - 1;
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
			"weights": get_weights_as_string()
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

	l(language[lang]["undone_last_change"]);
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

	l(language[lang]["redone_last_undone_change"]);
}

function enable_symbol(name) {
	assert(typeof(name) == "string", name + " is not a string but " + typeof(name));
	var el = document.getElementById(name);

	typeassert(el, object, "el");
	assert(typeof(el) == "object", "document.getElementById(" + name + ") is not an object");

	el.classList.remove("disabled_symbol");
	el.classList.add("enabled_symbol");
}

function disable_symbol(name) {
	assert(typeof(name) == "string", name + " is not a string but " + typeof(name));

	var el = document.getElementById(name);

	typeassert(el, object, "el");
	assert(typeof(el) == "object", "document.getElementById(" + name + ") is not an object");

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
	document.getElementById("register_error_msg").style.display = "visible";
	if (email.includes("@")) {
		document.getElementById("register_error_msg").innerHTML = "";
		$.ajax({
			url: "php_files/register.php?email=" + email + "&username=" + username + "&pw=" + password + "&days=7",
			success: function (data) {
				if(data["status"] == "ok") {
					color_msg_green("register_error_msg");
					document.getElementById("register_error_msg").innerHTML = data["status"] + ": " + data["msg"];
					set_cookie("session_id", data["session_id"], 7);
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
			error: function (_object, error, msg) {
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

function sources_popup() {
	open_popup("sources_popup");
}

function losses_popup() {
	if ($("#explanation").children().length == 0) {
		add_loss_functions_to_plotly_visualizer();
	}
	open_popup("losses_popup");
}

function close_losses() {
	close_popup("losses_popup");
}

function model_name_exists() {
	$.ajax({
		url: "get_model_names.php",
		success: function (data) {
			log(data);
		}
	});
}

function manage_download() {
	if(!get_cookie("session_id") === null) {
		save_model();
	} else {
		open_save_model_dialog();
	}
}

function has_network_name(elem) {
	var name = elem.value;
	$(elem).val(name.replaceAll(/\s/g, ""));
	name = elem.value;

	if(!network_name_is_empty(name)) {
		$.ajax({
			url: "php_files/get_number_of_model_names.php?name=" + name,
			success: function (data) {
				log(data["number"]);
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
	typeassert(name, string, "name");

	if(name.match(/^ *$/) || (name == "")) {
		return true;
	} else {
		return false;
	}
}

function save_to_db(model_structure, model_weights, model_data, requests_public) {
	document.getElementById("save_model_msg").style.display = "visible";
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
					error: function (_object, error, msg) {
						color_msg_red("save_model_msg");
						document.getElementById("save_model_msg").innerText = msg;
					}
				});
			}
			if(data["status"] == "error") {
				color_msg_red("save_model_msg");
			}
		},
		error: function (_object, error, msg) {
			color_msg_red("save_model_msg");
			document.getElementById("save_model_msg").innerText = msg;
		}
	});

}

async function save_to_db_wrapper () {
	if(!model_name_exists()) {
		save_to_db(await get_tfjs_model(), get_weights_as_string(), JSON.stringify(await get_model_data(1)), document.getElementById("is_public").checked);
		$("#save_to_db").prop("disabled", true);
	} else {
		color_msg_red("save_model_msg");
		document.getElementById("save_model_msg").innerText = "Please choose a different name for this model.";
		$("#save_model_msg").show();
	}
}

function open_save_model_dialog() {
	open_popup("save_model_dialog");
}

function open_register_dialog() {
	open_popup("register_dialog");
}

function open_upload_dialog() {
	open_popup("upload_dialog");
}

function close_all_popups() {
	$(".popup_body").each((i, e) => {
		$(e).is(":visible") && $(e).find(".close_button").click();
	});
}

function open_popup(name) {
	assert(typeof(name) == "string", name + " is not a string but " + typeof(name));
	var el = document.getElementById(name);
	assert(typeof(el) == "object", "document.getElementById(" + name + ") is not an object");

	var visible = $($(".popup_body:visible")[0]).parent().attr("id");

	close_all_popups();

	if(visible != name) {
		if ($(el).css("display") == "none") {
			el.style.display = "block";
		} else {
			el.style.display = "none";
		}
	} else {
		el.style.display = "none";
	}
}

function close_popup(name) {
	assert(typeof(name) == "string", name + " is not a string but " + typeof(name));
	var el = document.getElementById(name);
	assert(typeof(el) == "object", "document.getElementById(" + name + " is not an object");
	el.style.display = "none";
}

async function upload_model(evt) {
	let files = evt.target.files;

	let f = files[0];

	let reader = new FileReader();

	// Closure to capture the file information.
	reader.onload = (function (theFile) {
		return async function (e) {
			await wait_for_updated_page(3);

			uploaded_model = e.target.result;

			try {
				await set_config();
			} catch (e) {
				if(Object.keys(e).includes("message")) {
					e = e.message;
				}

				err("[upload_model] " + e);
			}
			is_setting_config = false;

			remove_overlay();
		};
	})(f);

	reader.readAsText(f);
}

function remove_overlay() {
	$(".overlay").remove();
}

async function upload_weights(evt) {
	let files = evt.target.files;

	let f = files[0];

	let reader = new FileReader();

	// Closure to capture the file information.
	reader.onload = (() => function (theFile) {
		return function (e) {

		};
	})(f);

	reader.readAsText(f);

	var modelUpload = document.getElementById("upload_model");
	var weightsUpload = document.getElementById("upload_weights");

	model = await loadLayersModel(tf.io.browserFiles([modelUpload.files[0], weightsUpload.files[0]]));

	$("#predictcontainer").show();
	$("a[href=\"#predict_tab\"]").click();

	await repredict();
}

var handle_x_file = async function (evt) {
	x_file = await evt.target.files[0].text();
	await set_input_shape("[" + get_shape_from_file(x_file) + "]");

	if (!_heuristic_layer_possibility_check($($(".layer_type")[0]).val(), get_input_shape())) {
		Swal.fire({
			title: "X-Data and first layer have incompatible shape-requirements. Set to Dense for all layers?",
			showDenyButton: true,
			showCancelButton: false,
			confirmButtonText: "Yes",
			denyButtonText: "No",
		}).then((result) => {
			if (result.isConfirmed) {
				$(".layer_type").val("dense").trigger("change");
				Swal.fire("Set all layers to dense", "", "success");
			} else if (result.isDenied) {
				Swal.fire("The model may not work as expected", "", "warning");
			}
		});
	}
	await updated_page();

	enable_start_training_custom_tensors();
};

var handle_y_file = async function (evt) {
	y_file = await evt.target.files[0].text();
	y_shape = get_shape_from_file(y_file);
	$("#y_shape_div").show();
	$("#y_shape").val(y_shape);
	await updated_page();

	enable_start_training_custom_tensors();
};

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

function get_chosen_dataset() {
	var val = $("#model_dataset").val();
	if (!val) {
		val = $("#dataset").val();
	}
	return val;
}

function attr_change_name(elem, attr, new_attr) {
	var data = $(elem).attr(attr);
	$(elem).attr(new_attr, data);
	$(elem).removeAttr(attr);
}

function is_hidden_or_has_hidden_parent(element) {
	if ($(element).css("display") == "none") {
		return true;
	}

	var parents = $(element).parents();

	for (var i = 0; i < parents.length; i++) {
		if ($(parents[i]).css("display") == "none") {
			return true;
		}
	}

	return false;
}

async function update_input_shape() {
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
}

async function change_data_origin() {
	currently_running_change_data_origin = 1;
	dbg("[change_data_origin] " + language[lang]["changed_data_source"]);
	//if($("#reinit_weights_on_data_source_change").is(":checked") && $("#data_origin").val() != "default") {
	//	force_reinit(1);
	//}

	x_file = null;
	y_file = null;
	y_shape = null;

	enable_train();

	var new_origin = $("#data_origin").val();

	var show_images_per_category = 0;

	var show_own_images = 0;
	var show_own_tensor = 0;
	var show_own_csv = 0;

	if (new_origin == "default") {
		var _config = await _get_configuration();

		if(Object.keys(_config).includes("input_shape")) {
			dbg("[change_data_origin] Setting input shape to: " + _config.input_shape);

			await set_input_shape(_config.input_shape);
		}

		if(Object.keys(_config).includes("output_shape")) {
			dbg("[change_data_origin] Output shape detect as: " + _config.output_shape);

			var output_shape = JSON.parse(_config.output_shape);

			var units = output_shape[output_shape.length - 1];

			var layer_types = $(".layer_type");
			var last_layer_nr = layer_types.length - 1;
			var last_layer_type = $(layer_types[last_layer_nr]).val();

			if(last_layer_type == "dense") {
				set_item_value(last_layer_nr, "units", units);
			} else {
				wrn(`[change_data_origin] Last layer type is ${last_layer_type}, not dense, cannot set Units.`);
			}
		}

		if (await input_shape_is_image()) {
			show_images_per_category = 1;
		}

		await reset_labels();
		await get_label_data();

		$(".hide_when_custom_data").show().each((i, e) => { $(e).show(); });

		changed_data_source = false;

		await set_default_input_shape();

		show_tab_label("visualization_tab_label", $("#jump_to_interesting_tab").is(":checked") ? 1 : 0);
		show_tab_label("fcnn_tab_label", $("#jump_to_interesting_tab").is(":checked") ? 1 : 0);

		await update_python_code(1);
	} else {
		disable_train();

		if ($("#data_origin").val() == "image") {
			show_own_images = 1;
			show_images_per_category = 1;
			await set_input_shape("[" + height + ", " + width + ", 3]");
		} else if ($("#data_origin").val() == "tensordata") {
			show_own_tensor = 1;
		} else if ($("#data_origin").val() == "csv") {
			await show_csv_file(1);
			show_own_csv = 1;
		} else {
			alert("Unknown data_origin: " + $("#data_origin").val());
		}

		$(".hide_when_custom_data").show().each((i, e) => { $(e).hide(); });

		changed_data_source = true;

		taint_privacy();
	}

	if (show_images_per_category) {
		$("#max_number_of_files_per_category_tr").show();
	} else {
		$("#max_number_of_files_per_category_tr").hide();
	}

	/*
	hide_tab_label("training_data_tab_label");
	hide_tab_label("own_csv_tab_label");
	hide_tab_label("own_images_tab_label");
	hide_tab_label("own_tensor_tab_label");
	*/

	if (show_own_images) {
		show_tab_label("own_images_tab_label", 1);

		hide_tab_label("training_data_tab_label");
		hide_tab_label("own_csv_tab_label");
		hide_tab_label("own_tensor_tab_label");

		$("#own_images_container").html("");
		await add_new_category();
		await add_new_category();
		disable_start_training_button_custom_images();
		$("#loss").val("categoricalCrossentropy");
		$("#metric").val("categoricalCrossentropy");
		await rename_labels();
	} else if (show_own_tensor) {
		show_tab_label("own_tensor_tab_label", 1);

		hide_tab_label("training_data_tab_label");
		hide_tab_label("own_csv_tab_label");
		hide_tab_label("own_images_tab_label");

		var config = await _get_configuration();
		if("loss" in config) {
			$("#loss").val(config["loss"]);
		}
	} else if (show_own_csv) {
		show_tab_label("own_csv_tab_label", 1);

		hide_tab_label("training_data_tab_label");
		hide_tab_label("own_images_tab_label");
		hide_tab_label("own_tensor_tab_label");

		set_loss("meanSquaredError", 1);
		set_metric("meanSquaredError", 1);
	} else {
		show_tab_label("training_data_tab_label");

		hide_tab_label("own_csv_tab_label");
		hide_tab_label("own_images_tab_label");
		hide_tab_label("own_tensor_tab_label");

		var config = await _get_configuration();
		if("loss" in config) {
			$("#loss").val(config["loss"]);
		}
	}

	if (window.location.href.indexOf("no_webcam") == -1) {
		if (await input_shape_is_image()) {
			$("#show_webcam_button").show();
		} else {
			$("#show_webcam_button").hide();
			stop_webcam();
		}
	}

	try {
		model = await _create_model();
		await compile_model();
	} catch (e) {
		err(e);
	}

	currently_running_change_data_origin = 0;

	try {
		await repair_output_shape();
	} catch (e) {
		err(e);
	}
}

function auto_adjust_number_of_neurons(n) {
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
			log(language[lang]["last_layer_not_dense"]);
		}
	}
}

async function delete_category(item, uuid) {
	var category_nr = get_category_nr(item);

	$($(".own_image_upload_container")[category_nr]).remove();

	auto_adjust_number_of_neurons($(".own_image_label").length);

	show_or_hide_hide_delete_category();

	disable_start_training_button_custom_images();

	await rename_labels();

	$("#save_button_" + uuid).remove();

	add_label_sidebar();
}

function get_category_nr(elem) {
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

	return nr;
}

function delete_custom_drawing_layer () {
	var all_current_custom_images = $(".own_image_span");
	for (var i = 0; i < all_current_custom_images.length; i++) {
		var imgs = $(all_current_custom_images[i]).find("img,canvas");
		for (var j = 0; j < all_current_custom_images.length; j++) {
			try {
				var this_canvas_id = imgs[j].id;
				if($("#" + this_canvas_id + "_layer").length) {
					l(language[lang]["deleting_layer_for_custom_image"] + " " + this_canvas_id);
					$("#" + this_canvas_id + "_layer").remove();
					$("#" + this_canvas_id + "_layer_colorpicker").remove();
					$("#" + this_canvas_id + "_layer_slider").remove();
					delete(atrament_data[this_canvas_id]);
				}
			} catch (e) {
				//log(e);
			}
		}
	}

}

async function last_shape_layer_warning() {
	if ($("#data_origin").val() == "image") {
		if (!model) {
			log("last_layer_shape_warning is waiting for the model...");
			while (!model) {
				await delay(200);
			}
		}
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
						var this_canvas_id = canvasses[j].id;
						if(!this_canvas_id.endsWith("_layer")) {
							var base_id = btoa(await md5(get_element_xpath(canvasses[j]))).replaceAll("=", "");
							var new_canvas_id = base_id + "_layer";
							if($(new_canvas_id).length == 0) {
								log("Drawing layer for custom image " + this_canvas_id + ", new_canvas_id: " + new_canvas_id);
								add_canvas_layer(canvasses[j], 0.5, base_id);
							}
						}
					}
				}

				is_classification = false;

				if($("#loss").val() != "meanSquaredError") {
					set_loss("meanSquaredError", 1);
				}

				if($("#metric").val() != "meanSquaredError") {
					set_metric("meanSquaredError", 1);
				}

				await change_last_responsible_layer_for_image_output();
			}
		}
	} else {
		$("#last_layer_shape_warning").html("");
	}
}

function alter_text_webcam_series () {
	var number = parse_int($("#number_of_series_images").val());
	var delaybetween = parse_float($("#delay_between_images_in_series").val());

	var s = "&#128248; x " + number;
	s = s + " (" + (1 / delaybetween) + "/s)";

	$(".webcam_series_button").html(s);
}

function add_image_to_category (img, category) {
	var imgDiv = $($(".own_images")[category]);
	var html = "<span class=\"own_image_span\"><img height=\"90\" src=\"" + img+ "\" /><span onclick=\"delete_own_image(this)\">&#10060;&nbsp;&nbsp;&nbsp;</span></span><br>";
	imgDiv.append(html);
}

async function add_new_category(disable_init_own_image_files=0, do_not_reset_labels=0) {
	var n = $(".own_image_label").length;

	var imgDiv = $(".own_images");
	var current_labels = [];

	var label_nr = n;
	var uuid = uuidv4();

	$(".own_image_label").each(function (i, x) {
		current_labels.push($(x).val());
	});

	while (current_labels.includes("label " + label_nr)) {
		label_nr++;
	}

	var k = 99999;

	if($(".own_image_upload_container").length <= 2) {
		k = $(".own_image_upload_container").length;
	}

	if (imgDiv.length == 0 || imgDiv.length <= n) {
		var webcam_button_style = "display: none";
		if(cam) {
			webcam_button_style = "";
		}

		var req = "";
		var c = "";
		if([0, 1].includes(k)) {
			var t = "";
			if(k == 0) {
				t = "";
			} else {
				t = ",took_images[1]";
			}

			req = `data-required_skills="show_webcam[1]${t}"`;
		}

		var s = `<div class="own_image_upload_container" data-required_skills="loaded_page[1],finished_training[1],added_custom_category[2],show_webcam[1],set_custom_images[${k}],added_custom_category[${k}],drew_custom_image[1]">` +
			`<button style="${webcam_button_style}" class="large_button webcam_data_button" onclick="take_image_from_webcam(this)">&#128248; Webcam</button>` +
			`<button ${req} style="${webcam_button_style}" class="${c} large_button webcam_data_button webcam_series_button" data-dont_hide_after_show="1" onclick="take_image_from_webcam_n_times(this)">&#128248; x 10 (10/s)</button>` +
			`<button class="delete_category_button" onclick="delete_category(this, '${uuid}')">&#10060;</button></div>` +
			`<button id='save_button_${uuid}' style='border: 0; box-shadow: none;' class='large_button' data-required_skills="set_custom_images[${k}],drew_custom_image[${k}]" onclick="add_image_to_category($('#${uuid}_sketcher')[0].toDataURL(), ${label_nr});event.preventDefault();clear_attrament('${uuid}_sketcher');">&#128190;</button>` +
		"</div>";

		$(s).appendTo("#own_images_container");

		var this_label = "category " + label_nr;
		if(label_nr < labels.length) {
			this_label = labels[label_nr];
		}

		var uuid_input_form = uuidv4();

		$(`<form method="post" enctype="multipart/form-data"><a id="${uuid_input_form}_link"></a><input id="${uuid_input_form}" onkeyup="rename_labels()" class="own_image_label" value="${this_label}" /><input type="file" class="own_image_files" multiple accept="image/*"><br/></form>`).prependTo($(".own_image_upload_container")[n]);

		$("<div class=\"own_images\"></div>").appendTo($(".own_image_upload_container")[n]);

		get_drawing_board_on_page($(".own_image_upload_container")[n], uuid + "_sketcher", "");
	}

	imgDiv = $(".own_images")[n];

	if(!disable_init_own_image_files) {
		await init_own_image_files();
	}

	auto_adjust_number_of_neurons($(".own_image_label").length);

	show_or_hide_hide_delete_category();

	await last_shape_layer_warning();

	alter_text_webcam_series();

	if(!do_not_reset_labels) {
		await rename_labels(do_not_reset_labels);
	}

	add_label_sidebar();

	restart_webcam_if_needed();

	return uuid;
}

function add_canvas_layer(canvas, transparency, base_id) {
	void(0), log("add_canvas_layer(", canvas + ", ", transparency, ", ", base_id, ")");

	assert(typeof(canvas) == "object", "add_canvas_layer(canvas, transparency, base_id): canvas is not an object");
	assert(typeof(base_id) == "string", "add_canvas_layer(canvas, transparency, base_id): base_id is not a string");
	assert(is_numeric(transparency) || typeof(transparency) == "number", "add_canvas_layer(canvas_, transparency, base_id): transparency is not a number");
	// Get the canvas element

	// Create a new canvas element for the layer
	var layer = document.createElement("canvas");
	canvas.id = base_id;
	layer.id = `${base_id}_layer`;
	layer.width = canvas.width;
	layer.height = canvas.height;
	layer.style.position = "absolute";
	layer.style.left = canvas.offsetLeft + "px";
	layer.style.top = canvas.offsetTop + "px";
	layer.style.backgroundColor = "white";
	layer.style.opacity = transparency;

	// Add the new canvas element to the document
	$(canvas).parent().append(layer);

	// Create a new Atrament instance for the layer
	atrament_data[layer.id] = {};
	atrament_data[layer.id]["atrament"] = new Atrament(layer);

	clear_attrament(layer.id);

	// Create a transparency slider
	var transparency_slider = document.createElement("input");
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

	$(canvas).parent().append("<br>");
	var color_picker_code = `<input type="text" name="value" id='${layer.id}_colorpicker' class="show_data jscolor" value="#000000" onchange="atrament_data['${layer.id}']['atrament'].color='#'+this.value;"  /><br>`;
	$(canvas).parent().append(color_picker_code);
	atrament_data[layer.id]["colorpicker"] = new jscolor($("#" + layer.id + "_colorpicker")[0], {format:"rgb"});

	$(canvas).parent().append("<br>Transparency:");
	$(canvas).parent().append(transparency_slider);

	$(canvas).parent().append("<br>Pen size:");
	$(canvas).parent().append($(`<input class="show_data" type="range" min="1" oninput="atrament_data['${layer.id}']['atrament'].weight=parse_float(event.target.value);" value="20" step="1" max="100" autocomplete="off">`));
}

async function rename_labels(do_not_reset_labels=0) {
	if(!do_not_reset_labels) {
		await reset_labels();
	}
	$(".own_image_label").each(function (i, x) {
		labels.push($(x).val());
	});

	await update_python_code(1);

	add_label_sidebar();
}

// shows or hides category delete
function show_or_hide_hide_delete_category() {
	if ($(".own_image_label").length > 1) {
		$(".delete_category_button").show();
	} else {
		$(".delete_category_button").hide();
	}
}

function get_shown_advanced() {
	var layer_options_internal = $(".layer_options_internal");

	var shown = [];

	for (var i = 0; i < layer_options_internal.length; i++) {
		var display = $(layer_options_internal[i]).css("display");
		if (display == "none") {
			shown[i] = 0;
		} else {
			shown[i] = 1;
		}
	}

	return shown;
}

function set_shown_advanced(shown) {
	for (var i = 0; i < shown.length; i++) {
		if (shown[i]) {
			$($(".layer_options_internal")[i]).css("display", "table-row-group");
		} else {
			$($(".layer_options_internal")[i]).css("display", "none");
		}
	}
}

function show_head_data(head) {
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
			select += `,<br>${trm("divide_by")}: <input style='width: 30px;' value='1' type='number' onchange='show_csv_file(1)' class='header_divide_by' />`;
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
}

function get_csv_header_selections () {
	var header_elements = [];
	$(".header_select").each(function (i, e) {
		header_elements.push(($(e).val())) ;
	});

	return header_elements;
}

function has_x_and_y_in_csv_headers (headers = get_csv_header_selections()) {
	typeassert(headers, array, "headers");

	if(headers.includes("Y") && headers.includes("X")) {
		return true;
	}

	return false;
}

async function show_csv_file(disabled_show_head_data) {
	var csv = $("#csv_file").val();

	var data = parse_csv_file(csv);

	var head = data["head"];

	$("#x_y_shape_preview").html("");

	$(".hide_when_no_csv").hide();

	if (head.length > 1 && data.data.length >= 1) {
		var header_csv_selection = get_csv_header_selections();

		var has_x_and_y = has_x_and_y_in_csv_headers(header_csv_selection);
		if(has_x_and_y || header_csv_selection.length == 0) {
			if (!disabled_show_head_data) {
				show_head_data(head);
			}

			var parsed_data = await get_x_y_from_csv();

			if(typeof parsed_data == "string" && parsed_data == "incomplete") {
				return;
			}

			var y_between_0_and_1 = parsed_data["y_between_0_and_1"];

			if (!y_between_0_and_1) {
				if ($("#auto_set_last_layer_activation").is(":checked")) {
					var activations = $(".activation");
					if($(activations[activations.length - 1]).val() != "linear") {
						$(activations[activations.length - 1]).val("linear").trigger("change");
					}
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

			var is_same = output_shape_is_same(parsed_data.y.shape, $("#outputShape").val());
			var shape_preview_color = "<div>";
			csv_allow_training = true;
			//shape_preview_color += "black";
			if (is_same) {
				if (auto_adjust) {
					await updated_page(null, null, null, 1);
				}
				//shape_preview_color += "green";
			} else {
				//shape_preview_color += "red";
				//csv_allow_training = false;
			}
			//shape_preview_color += ">";

			shape_preview = shape_preview_color + shape_preview + "</div>";

			var x_str = _tensor_print_to_string(parsed_data.x);
			var y_str = _tensor_print_to_string(parsed_data.y);

			if(x_str.includes("error_msg") && old_x_str) {
				x_str = old_x_str;
			}

			if(y_str.includes("error_msg") && old_y_str) {
				y_str = old_y_str;
			}

			old_x_str = x_str;
			old_y_str = y_str;

			shape_preview += "<br>X: <pre>" + x_str + "</pre>";

			if (parsed_data.x.dtype == "string") {
				csv_allow_training = false;
			}

			shape_preview += "<br>Y: <pre>" + y_str + "</pre>";

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
					l(language[lang]["generated_encodings"]);
				} else {
					l(language[lang]["auto_generating_enables_but_no_labels_given"]);
				}
			}

			$("#x_y_shape_preview").html(shape_preview);
			$(".hide_when_no_csv").show();
		} else {
			log(language[lang]["csv_headers_must_have_x_and_y_values"]);

			$("#csv_header_overview").html("");
			csv_allow_training = false;

			$($(".header_select")[0]).val("X");
			$($(".header_select")[1]).val("Y").trigger("change");

			await show_csv_file();
		}
	} else {
		$("#csv_header_overview").html("");
		csv_allow_training = false;
	}

}

function get_generated_encoding(nr, max) {
	var array = [];
	for (var i = 0; i < max; i++) {
		if(i == nr) {
			array.push(1);
		} else {
			array.push(0);
		}
	}

	var res = "[" + array.join(", ") + "]";

	return res;
}

function ensure_shape_array(shape) {
	if (typeof(shape) == "string") {
		return eval(shape);
	} else if (typeof(shape) == "object") {
		return shape;
	}
	wrn("[ensure_shape_array] Is neither shape nor object: ", shape);
}

function output_shape_is_same(output_shape_data, output_shape_network) {
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
				return false;
			}
		}

		return true;
	} else {
		return false;
	}
}

function tensor_print_to_string(_tensor) {
	if(!debug) {
		return "Set variable debug to true to enable tensor printing";
	}

	return _tensor_print_to_string(_tensor);
}

function _tensor_print_to_string (_tensor) {
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
			wrn("[_tensor_print_to_string] tensor to be printed was already disposed");
		} else {
			err("[_tensor_print_to_string] _tensor_print_to_string failed:", e);

		}
		return "<span class='error_msg'>Error getting tensor as string</span>";
	}
}

function contains_convolution() {
	var number_of_layers = get_number_of_layers();
	for (var j = 0; j < number_of_layers; j++) {
		var layer_type = $($(".layer_type")[j]).val();

		if (layer_type.includes("conv")) {
			return true;
		}
	}

	return false;
}

function disable_start_training_button_custom_images() {
	if ($(".own_images").children().length != 0) {
		enable_train();
	} else {
		disable_train();
	}
}

async function write_error(e, fn, hide_swal) {
	if (e) {
		var msg = e;

		if(Object.keys(e).includes("message")) {
			msg = e.message;
		}

		var explanation = explain_error_msg("" + msg);

		if (explanation) {
			msg = msg + "\n<br><br>\n" + explanation;
		}

		$(".train_neural_network_button").html("<span class='TRANSLATEME_start_training'></span>").removeClass("stop_training").addClass("start_training");
		await update_translations();
		await write_descriptions();
		err("[write_error] "+ msg);
		console.trace();

		if(!hide_swal) {
			Swal.fire({
				icon: "error",
				title: "Oops [5]...",
				html: msg
			});
		} else {
			l(msg);
		}

		await send_bug_report();
	} else {
		$("#error").html("No error found, but something went wrong").show().parent().hide();
	}

	if(typeof(fn) == "function") {
		fn();
	}

	await enable_everything();
	await write_descriptions();
}

async function hide_error() {
	$("#error").html("").hide().parent().hide();
	await enable_everything();
	await write_descriptions();
}

function find_layer_number_by_element(element) {
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

	return nr;
}

function get_layer_regularizer_config(layer_nr, regularizer_type) {
	assert(valid_initializer_types.includes(regularizer_type), "insert_regularizer_trs(layer_nr, " + regularizer_type + ") is not a valid regularizer_type (2nd option)");
	assert(typeof(layer_nr) == "number", "get_layer_regularizer_config(" + layer_nr + "), layer_nr is not an integer but " + typeof(layer_nr));

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
					value = parse_float(value);
				}

				if (value != "") {
					option_hash[option_name] = value;
				}
			}
		}
	}

	return option_hash;
}

function get_layer_initializer_config(layer_nr, initializer_type) {
	assert(
		valid_initializer_types.includes(initializer_type),
		"insert_initializer_trs(layer_nr, " + initializer_type + ") is not a valid initializer_type (2nd option)"
	);

	assert(typeof(layer_nr) == "number", "get_layer_initializer_config(" + layer_nr + "), layer_nr is not an integer but " + typeof(layer_nr));

	var starts_with_string = initializer_type + "_initializer_";

	var this_initializer_options = $($(".layer_setting")[layer_nr]).find("." + initializer_type + "_initializer_tr").find(".input_data");

	var option_hash = {};

	for (var i = 0; i < this_initializer_options.length; i++) {
		var this_option = this_initializer_options[i];
		var classList = this_option.className.split(/\s+/);

		for (var j = 0; j < classList.length; j++) {
			var class_list_element = classList[j];
			if (class_list_element.startsWith(starts_with_string)) {
				var option_name = class_list_element;
				option_name = option_name.replace(starts_with_string, "");
				var value = get_item_value(layer_nr, class_list_element);

				/*
				if(layer_nr == 0) {
					void(0); log("option_name:", option_name, "value:", value, "class_list_element:", class_list_element);
				}
				*/

				if (looks_like_number(value)) {
					value = parse_float(value);
				}

				if (value !== "") {
					option_hash[option_name] = is_numeric(value) ? parse_float(value) : value;
				} else {
					if(this_option.type == "number") {
						wrn("Wrong value for element, using default = 1");
						$(this_option).val(1);
					} else {
						err("ERROR in ", this_option);
					}
				}
			}
		}
	}

	return option_hash;
}

function looks_like_number(item) {
	if(typeof(item) == "number") {
		return true;
	}

	if (/^[+-]?(?:(?:\d+(?:\.\d+)?))$/.test(item)) {
		return true;
	}

	return false;
}

async function set_default_input_shape() {
	if (!changed_data_source) {
		return;
	}

	var default_config = await _get_configuration();

	if (default_config) {
		try {
			var default_input_shape = default_config["input_shape"];

			await set_input_shape(default_input_shape);

			await compile_model();

			await identify_layers();

			await write_descriptions();
		} catch (e) {
			log(e);
		}
	}

}

function allow_training() {
	if (_allow_training()) {
		enable_train();
	} else {
		disable_train();
	}
}

function _allow_training() {
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

	await restart_fcnn();
}

async function theme_choser () {
	var theme = $("#theme_choser").val();

	if(theme) {
		document.getElementById("css_mode").href = "css/" + theme + ".css";
		document.getElementById("css_ribbon").href = "css/" + "ribbon" + theme + ".css";

		set_cookie("theme", theme);

		await write_descriptions();
		await write_model_to_latex_to_page();

		invert_elements_in_dark_mode();

		await restart_fcnn();
	}
}

// Returns: old parent div
function move_element_to_another_div(element, new_element_id) {
	var old_parent = $(element).parent();

	$(element).detach().appendTo(new_element_id);

	return old_parent;
}

function allow_edit_input_shape() {
	if ($("#auto_input_shape").is(":checked")) {
		dbg("[allow_edit] " + language[lang]["input_shape_is_read_only"]);
		$("#inputShape").attr("readonly", true);
	} else {
		dbg("[allow_edit] " + language[lang]["input_shape_is_writable"]);
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

	close_all_popups();
}

function human_readable_time(seconds, start="", end="") {
	if (!seconds) {
		return language[lang]["one_second"];
	}

	if(seconds > 86400 * 365) {
		var params = [];
		if(start != "") {
			params.push("Start:");
			params.push(start);
		}

		if(end != "") {
			params.push("End:");
			params.push(end);
		}

		wrn("[human_readable_time] Seconds is very large:", seconds, "Please check the source of that", params);
		console.trace();

		return null;
	}

	var levels = [
		[Math.floor(seconds / 31536000), language[lang]["years"]],
		[Math.floor((seconds % 31536000) / 86400), language[lang]["days"]],
		[Math.floor(((seconds % 31536000) % 86400) / 3600), language[lang]["hours"]],
		[Math.floor((((seconds % 31536000) % 86400) % 3600) / 60), language[lang]["minutes"]],
		[(((seconds % 31536000) % 86400) % 3600) % 60, language[lang]["seconds"]],
	];

	var returntext = "";

	if (levels[0][0] !== 0) {
		returntext += levels[0][0] + " " + (levels[0][0] === 1 ? levels[0][1].substr(0, levels[0][1].length - 1) : levels[0][1]);
	}

	if (levels[1][0] !== 0) {
		if (returntext) {
			returntext += ", ";
		}
		returntext += levels[1][0] + " " + (levels[1][0] === 1 ? levels[1][1].substr(0, levels[1][1].length - 1) : levels[1][1]);
	}

	if (levels[2][0] !== 0) {
		if (returntext) {
			returntext += ", ";
		}
		returntext += levels[2][0] + " " + (levels[2][0] === 1 ? levels[2][1].substr(0, levels[2][1].length - 1) : levels[2][1]);
	}

	if (levels[3][0] !== 0) {
		if (returntext) {
			returntext += ", ";
		}
		returntext += levels[3][0] + " " + (levels[3][0] === 1 ? levels[3][1].substr(0, levels[3][1].length - 1) : levels[3][1]);
	}

	if (levels[4][0] !== 0) {
		if (returntext) {
			returntext += ", ";
		}
		returntext += levels[4][0] + " " + (levels[4][0] === 1 ? levels[4][1].substr(0, levels[4][1].length - 1) : levels[4][1]);
	}

	return returntext;
}

function delete_own_image(elem) {
	$(elem).parent().next().remove();
	$(elem).parent().remove();
}

function larger_maximally_activated_neurons() {
	$(".layer_image").css({ height: "+=50px", width: "+=50px" });
}

function smaller_maximally_activated_neurons() {
	$(".layer_image").css({ height: "-=50px", width: "-=50px" });

	if ($(".layer_image").css("width") == "0px") {
		$(".layer_image").css({ height: "auto", width: "auto" });
	}
}

function reset_maximally_activated_neurons() {
	$(".layer_image").css({ height: "auto", width: "auto" });
}

function delete_maximally_activated_predictions() {
	$(".maximally_activated_predictions").remove();
}

async function get_layers_container_md5() {
	await delay(1);
	var layers_container_str = "";
	$("#layers_container").find("select,input,checkbox").each(function (i, x) {
		x = $(x);
		layers_container_str += x.attr("class") + "=" + x.val() + ";;;";
	});

	var res = await md5(layers_container_str);

	return res;
}

function rename_tmp_onchange() {
	$("*[_onchange]").each(function (i, x) {
		var elem = $(this);
		elem.attr("onchange", elem.attr("_onchange"));
		elem.removeAttr("_onchange");
	});

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

	if (first_displayable && is_hidden_or_has_hidden_parent(currently_selected)) {
		$($(first_displayable).children()[0]).click();
	}

	try {
		update_translations(); // await not possible
	} catch (e) {
		err(e);
	}
}

function tab_already_open (to_open) {
	var is_already_open = 0;

	$(".ui-state-active").each((i, e) => {
		if(is_already_open) {
			return;
		}
		var href = $(e).is(":visible") && $($(e).children()[0]).prop("href").replace(/.*#/, "");
		var id = $(e).is(":visible") && $($(e).children()[0]).prop("id");

		if(href == to_open || id == to_open) {
			is_already_open = 1;
		}

		if(!$("#" + href).is(":visible")) {
			is_already_open = 0;
		}
	});

	return is_already_open;
}

function show_specific_tab_content (label) {
	$("#right_side").find(".ui-tab").each((i, e) => {
		var href = $(e).find("a").attr("href").replace(/.*#/, "");
		var id = $(e).find("a").attr("id").replace(/.*#/, "");
		if(href == label || id == label) {
			$("#" + href).show();
		} else {
			$("#" + href).hide();
		}
	});
}

function hide_all_tab_contents () {
	$("#right_side").find(".ui-tab").each((i, e) => {
		$("#" + ($(e).find("a").attr("href").replace(/.*#/, ""))).hide();
	});
}

function show_tab_label(label, click) {
	assert(typeof(label) == "string", "label is not a string");

	var auto_skip_click = label == "math_tab_label" && tab_already_open(label);

	var $item = $("#" + label);
	assert($item && $item.length == 1, "Invalid or double $item for label " + label);

	$item.show().parent().show();

	if(click && !auto_skip_click) {
		$item.trigger("click");
	}

	update_translations(); // await not possible
}

function check_number_values() {
	var all_fields = document.querySelectorAll("input[type=\"number\"]");
	var default_bg_color = $("input").css("background-color");

	var missing_values = 0;

	for (var i = 0; i < all_fields.length; i++) {
		var $item = $(all_fields[i]);
		var val = $item.val();

		if (val != "" && !is_numeric(val)) {
			if(!$(all_fields[i]).hasClass("no_red_on_error")) {
				$item.css("background-color", "red");
			}
			missing_values++;
		} else if (val != "") {
			val = parse_float(val);
			$item.css("background-color", default_bg_color);

			var max_attr = $item.attr("max");
			var min_attr = $item.attr("min");
			//console.log("max_attr:", max_attr, "max_attr type:", typeof(max_attr));

			if(max_attr !== null && typeof(max_attr) != "undefined") {
				var max = parse_float(max_attr);
				if (typeof(max) === "number") {
					if (val > max) {
						$item.val(max).trigger("change");
					}
				}
			}

			if(min_attr !== null && typeof(min_attr) != "undefined") {
				var min = parse_float(min_attr);
				if (typeof(min) === "number") {
					if (val < min) {
						$item.val(min).trigger("change");
					}
				}
			}
		} else if (val == "") {
			$item.css("background-color", "red");
		}
	}

	if($data_origin === null) {
		$data_origin = $("#data_origin");
	}

	if($data_origin && $data_origin.val() == "image") {
		if(model && Object.keys(model).includes("_callHook") && model.input.shape.length == 4 && model.input.shape[3] == 3) {
			var currently_existing_custom_images = get_custom_elements_from_webcam_page();

			if(currently_existing_custom_images.length == 0) {
				has_missing_values++;
			}
		}
	}

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
				splitted = [result[1], result[2], result[3], result[4]];
			} else {
				splitted = line.split(/\s{2,}/).filter(n => n);
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
		if (typeof(new_array[i]) == "object") {
			table += "<tr><t" + d_or_h + ">" + new_array[i].join("</t" + d_or_h + "><t" + d_or_h + ">") + "</t" + d_or_h + "></tr>\n";
		} else {
			table += "<tr><td colspan=" + colspan_nr + ">" + new_array[i] + "</td></tr>\n";
		}
	}

	table += "</table>\n";

	return "<center>" + table + "</center>";
}

function plotly_show_loss_graph() {
	try {
		tidy(() => {
			var y_true_table = [];
			$(".data_table_y_true").each((i, x) => {
				y_true_table[i] = [i, parse_float($(x).val())];
			});

			var y_pred_table = [];
			$(".data_table_y_pred").each((i, x) => {
				y_pred_table[i] = [i, parse_float($(x).val())];
			});

			var y_true = tensor2d(y_true_table);
			var y_pred = tensor2d(y_pred_table);

			var trace1 = {
				x: array_sync(y_true).map(x => x[0]),
				y: array_sync(y_true).map(x => x[1]),
				mode: "markers",
				type: "scatter",
				name: "Ground Truth"
			};

			var trace2 = {
				x: array_sync(y_pred).map(x => x[0]),
				y: array_sync(y_pred).map(x => x[1]),
				mode: "markers",
				type: "scatter",
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
				var name = data[i]["name"];

				tidy(() => {
					var loss = fn(y_true, y_pred);

					plot_data.push({
						x: array_sync(y_pred).map(x => x[0]),
						y: array_sync(loss),
						mode: "lines",
						type: "scatter",
						name: name
					});
				});
			}

			Plotly.newPlot("explanation", plot_data);
		});
	} catch (e) {
		if(Object.keys(e).includes("message")) {
			e = e.message;
		}

		assert(false, e);
	}

	write_descriptions(); // cannot be async

}

function add_row_to_plotly_loss() {
	$("#data_table tbody tr:last").clone().insertAfter("#data_table tbody tr:last");

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
	var str = "<table id=\"data_table\" border=1 style=\"border-collapse: collapse;\">" +
		"	<tr>" +
		"		<th>Y true</th>" +
		"		<th>Y pred</th>" +
		"		<th>Delete</th>" +
		"	</tr>" +
		"	<tr>" +
		"		<td colspan=3><button onclick=\"add_row_to_plotly_loss()\">Add new data</button></td>" +
		"	</tr>";

	for (var i = 0; i < example_plotly_data.length; i++) {
		str += "	<tr>" +
			`		<td><input onkeyup="plotly_show_loss_graph()" onchange="plotly_show_loss_graph()" type="number" class="data_table_y_true" value="${example_plotly_data[i][0]}" /></td>` +
			`		<td><input onkeyup="plotly_show_loss_graph()" onchange="plotly_show_loss_graph()" type="number" class="data_table_y_pred" value="${example_plotly_data[i][1]}" /></td>` +
			"		<td>" +
			"			<button class='delete_row' onclick=\"remove_plotly_table_element(this)\">&#10060;</button>" +
			"		</td>" +
			"	</tr>";
	}

	str += "</table>";

	$("#table_div").html(str);

	write_descriptions(); // cannot be async

}

function add_loss_functions_to_plotly_visualizer(data) {
	create_plotly_table();
	plotly_show_loss_graph();
}

function set_cookie(name, value, days = 365) {
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

function get_cookie(name) {
	var nameEQ = name + "=";
	var ca = document.cookie.split(";");
	for(var i=0;i < ca.length;i++) {
		var c = ca[i];
		while (c.charAt(0)==" ") c = c.substring(1,c.length);
		if (c.indexOf(nameEQ) == 0) return c.substring(nameEQ.length,c.length);
	}
	return null;
}

function delete_cookie(name) {
	document.cookie = name +"=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;";
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

function real_width(obj) {
	try {
		var clone = obj.clone();
		clone.css("visibility","hidden");
		$("body").append(clone);
		var w = clone.outerWidth();
		clone.remove();
		return w;
	} catch (e) {
		if(Object.keys(e).includes("message")) {
			e = e.message;
		}

		assert(false, e);
	}
}

function real_height(obj) {
	try {
		var h = obj.outerHeight();
		return h;
	} catch (e) {
		if(Object.keys(e).includes("message")) {
			e = e.message;
		}

		assert(false, e);
	}
}

async function get_training_data_as_json () {
	force_download = 1;
	var training_data = await get_xs_and_ys();
	force_download = 0;

	training_data.x = array_sync(training_data.x);
	training_data.y = array_sync(training_data.y);

	await dispose(training_data["x"]);
	await dispose(training_data["y"]);

	return JSON.stringify(training_data);
}

function l(msg) {
	msg = "" + msg;

	if(!msg) {
		dbg("[l] msg is empty");
		return;
	}

	if(msg == "[object Object]") {
		log("[object Object] found:");
		console.log(msg);
		console.trace();
	}

	try {
		if(last_l != msg) {
			var load_time = Date().toLocaleString();
			load_time = load_time.replace(/ GMT.*/, "");
			msg = ("" + msg).replace(/^(Error:\s*)+/, "Error: ");
			$("#log").prepend(load_time + ": " + msg + "\n");
			last_l = msg;
			if(msg.toString().startsWith("ERROR:") || msg.toString().startsWith("TypeError:")) {
				err(msg);
				console.trace();
				msg = "<span style='color: red'>" + msg + "</span>";
			}
			$("#status_bar_log").html(msg);
		}
	} catch (e) {
		void(0); err("Some thing went wrong with the `l` function: " + e);
	}
}

async function set_custom_image_training () {
	if($("#data_origin").val() != "image") {
		$("#data_origin").val("image").trigger("change");
	}
}

function get_cam_config() {
	return {
		video: {
			frameRate: { ideal: 30, max: 60 },
				resizeMode: "crop-and-scale",
				width: { ideal: 1280, min: 640, max: 1920 },
				height: { ideal: 720, min: 480, max: 1080 },
		}
	};
}

async function set_custom_webcam_training_data() {
	dbg("Init webcams");
	await init_webcams();

	if($("#data_origin").val() != "image") {
		$.when($("#data_origin").val("image").trigger("change")).done(async function(){
			if(!cam) {
				dbg("cam was not defined. Trying to get data from webcam");
				await get_data_from_webcam();
			}

			if(!cam) {
				try {
					dbg("cam was still not defined. Trying to get data from webcam again");
					await get_data_from_webcam();
				} catch (e) {
					err(e);
					console.trace();
				}
			} else {
				dbg("cam is defined, not trying to show it again");
			}
		});
	} else {
		if(!cam) {
			await get_data_from_webcam();
		}

		if(!cam) {
			await show_webcam();
		}

		show_tab_label("own_images_tab_label", 1);
	}
	dbg("Done setting web for custom training data");
}

async function toggle_layers() {
	$(".left_side").toggle();

	await write_descriptions(1);
}

async function get_available_cams () {
	var webcams = [];
	var ids = [];

	await navigator.mediaDevices.enumerateDevices().then(function (devices) {
		for(var i = 0; i < devices.length; i++){
			var device = devices[i];
			if (device.kind === "videoinput") {
				webcams.push(device.label);
				ids.push(device.deviceId);
			}
		}
	});

	return [webcams, ids];
}

async function switch_to_next_camera () {
	webcam_id++;
	webcam_id = webcam_id % (webcam_modes.length);
	await get_data_from_webcam(1);

}

async function highlight_code () {
	Prism.highlightAll();
}

function getCameraSearchHTML() {
	var html = `
<div style="position: relative; width: 150px; height: 150px;">
  <div style="
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    font-size: 64px;
    z-index: 1;
  ">📷</div>
  <div style="
    position: absolute;
    top: 50%;
    left: 50%;
    width: 60px;
    height: 60px;
    margin: -30px 0 0 -30px;
    animation: orbit 3s linear infinite;
    z-index: 2;
  ">
    <div style="
      position: absolute;
      top: 0;
      left: 50%;
      transform: translateX(-50%);
      font-size: 32px;
      animation: counter-rotate 3s linear infinite;
    ">🔍</div>
  </div>
</div>
<style>
@keyframes orbit {
  0%   { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
@keyframes counter-rotate {
  0%   { transform: translateX(-50%) rotate(0deg); }
  100% { transform: translateX(-50%) rotate(-360deg); }
}
</style>
	`;
	return html;
}

function show_hide_augment_tab () {
	if($("#auto_augment").is(":checked")) {
		dbg("[show_hide_augment_tab] " + language[lang]["showing_augmentation"]);
		$("a[href*=\"tf_ribbon_augmentation\"]").show().parent().show();
	} else {
		dbg("[show_hide_augment_tab] " + language[lang]["hiding_augmentation"]);
		$("a[href*=\"tf_ribbon_augmentation\"]").hide().parent().hide();
	}
}

function get_layer_activation_function (nr) {
	var $layers_container = $("#layers_container");

	if(!$layers_container.length) {
		err(`[get_layer_activation_function] $layers_container not found!`);
		return null;
	}

	var $children = $layers_container.children();

	if(nr > $children.length) {
		dbg(`[get_layer_activation_function] nr ${nr} is larger than $children.length ${$children.length}`);
		return null;
	}

	var $activation_layer = $($children[nr]).find(".activation");

	if(!$activation_layer.length) {
		return null;
	}

	return $activation_layer.val()
}

function get_last_layer_activation_function () {
	var layers_container_children = $("#layers_container").children();
	var number_of_layers = layers_container_children.length;

	var last_layer = $(layers_container_children[number_of_layers - 1]);

	var res = last_layer.find(".activation").val();

	return res;
}

function set_layer_background(nr, color) {
	$($(".layer_setting")[nr]).css("background-color", color);
}

function set_model_layer_warning(i, warning) {
	assert(typeof(i) == "number", i + " is not a number");
	assert(typeof(warning) == "string", warning + " is not a string");

	if(warning) {
		$($(".warning_layer")[i]).html(warning).show().parent().show();
	} else {
		$($(".warning_layer")[i]).html("").hide().parent().hide();
	}
}

async function download_model_for_training () {
	_download_model_for_training().then(downloadNetworkZip);
}

async function _download_model_for_training () {
	var old_divide_by_value = $("#divide_by").val();

	$("#divide_by").val(1);

	var data = JSON.parse(await get_x_y_as_array());

	if(!Object.keys(data).includes("x")) {
		err(language[lang]["could_not_retrieve_x_data"]);
		return;
	}

	if(!Object.keys(data).includes("y")) {
		err(language[lang]["could_not_retrieve_y_data"]);
		return;
	}

	var x_keys = Object.keys(data["x"]);
	var y_keys = Object.keys(data["y"]);

	if(x_keys.length != y_keys.length) {
		err(sprintf(language[lang]["x_and_y_keys_must_have_same_nr_of_values_but_has_m_and_y"], x_keys.length, y_keys.length));
		return;
	}

	$("#divide_by").val(old_divide_by_value);

	var python_codes = await update_python_code(1, 1, 1, 1);

	var expert_code = python_codes[1];

	expert_code += "\nfrom termcolor import colored\n";

	expert_code += "\ndivide_by = " + old_divide_by_value + "\n";

	expert_code += "\n" + _get_tensorflow_data_loader_code();
	expert_code += "\n" + _get_tensorflow_save_model_code();

	var zipWriter = new zip.ZipWriter(new zip.BlobWriter("application/zip"));

	var expert_code_reader = new zip.TextReader(expert_code);
	await zipWriter.add("train.py", expert_code_reader);

	var run_sh_reader = new zip.TextReader(_get_run_sh_file_for_custom_training());
	await zipWriter.add("run.sh", run_sh_reader);

	var predict_py_reader = new zip.TextReader(_get_predict_py_for_local_training());
	await zipWriter.add("predict.py", predict_py_reader);

	var readme_sh_reader = new zip.TextReader(_get_readme_md_for_local_training());
	await zipWriter.add("README.md", readme_sh_reader);

	var k = 0;

	for (var i = 0; i < x_keys.length; i++) {
		var x_value = data["x"][i];
		var y_value = data["y"][i];

		var label_nr = y_value.indexOf(1);
		var label = labels[label_nr];

		var filename = `data/${label}/${k}.jpg`;

		const canvas = document.createElement("canvas");
		const ctx = canvas.getContext("2d");

		canvas.width = x_value[0].length;
		canvas.height = x_value.length;

		x_value.forEach((row, y) => {
			row.forEach((pixel, x) => {
				ctx.fillStyle = `rgb(${pixel.join(",")})`;
				ctx.fillRect(x, y, 1, 1);
			});
		});

		var data_url = canvas.toDataURL("image/png");

		var blob = dataURLToBlob(data_url);

		zipWriter.add(filename, new zip.BlobReader(blob));

		k++;
	}

	var res = await zipWriter.close();

	return res;
}

function _get_run_sh_file_for_custom_training () {
	return `#!/bin/bash

function echoerr() {
        echo "$@" 1>&2
}

function green_text {
        echo -e "\\033[0;32m$1\\e[0m"
}

function red_text {
        echoerr -e "\\e[31m$1\\e[0m"
}

set -e
set -o pipefail

function calltracer () {
        red_text 'Last file/last line:'
        caller
}
trap 'calltracer' ERR

function help () {
        echo "Possible options:"
        echo "  --train"
        echo "  --predict"
        echo "  --learning_rate=FLOAT"
        echo "  --epochs=INT"
        echo "  --validation_split=FLOAT"
        echo "  --width=(INT)=INT"
        echo "  --height=(INT)=INT"
        echo "  --help                                             this help"
        echo "  --debug                                            Enables debug mode (set -x)"
        exit $1
}

train=0
predict=0

if [[ -d "saved_model" ]]; then
        green_text "saved_model file was found, that means: the model has already been trained and can be used to predict."
        predict=1
        train=0
else
        green_text "saved_model file was not found. Model has not yet been trained and, by default, will be trained"
        predict=0
        train=1
fi

for i in $@; do
        case $i in
                --train)
                        train=1
                        predict=0
                        shift
                        ;;
                --predict)
                        train=0
                        predict=1
                        shift
                        ;;
                --learning_rate=*)
                        learning_rate="\${i#*=}"
                        re='^[+-]?[0-9]+([.][0-9]+)?$'
                        if ! [[ $learning_rate =~ $re ]] ; then
                                red_text "error: Not a FLOAT: $i" >&2
                                help 1
                        fi
                        shift
                        ;;
                --epochs=*)
                        epochs="\${i#*=}"
                        re='^[+-]?[0-9]+$'
                        if ! [[ $epochs =~ $re ]] ; then
                                red_text "error: Not a INT: $i" >&2
                                help 1
                        fi
                        shift
                        ;;
                --validation_split=*)
                        validation_split="\${i#*=}"
                        re='^[+-]?[0-9]+([.][0-9]+)?$'
                        if ! [[ $validation_split =~ $re ]] ; then
                                red_text "error: Not a FLOAT: $i" >&2
                                help 1
                        fi
                        shift
                        ;;
                --width=*)
                        width="\${i#*=}"
                        re='^[+-]?[0-9]+$'
                        if ! [[ $width =~ $re ]] ; then
                                red_text "error: Not a INT: $i" >&2
                                help 1
                        fi
                        shift
                        ;;
                --height=*)
                        height="\${i#*=}"
                        re='^[+-]?[0-9]+$'
                        if ! [[ $height =~ $re ]] ; then
                                red_text "error: Not a INT: $i" >&2
                                help 1
                        fi
                        shift
                        ;;

                -h|--help)
                        help 0
                        ;;
                --debug)
                        set -x
                        ;;
        esac
done

ENV_DIR=$HOME/.asanaienv
if [[ ! -d "$ENV_DIR" ]]; then
        green_text "$ENV_DIR not found. Creating virtual environment."
        python3 -m venv $ENV_DIR
        source $ENV_DIR/bin/activate

        pip install tensorflow tensorflowjs protobuf scikit-image opencv-python keras termcolor pyyaml h5py
fi

source $ENV_DIR/bin/activate

if [[ "$train" == 1 ]]; then
        python3 train.py $*
elif [[ "$predict" == 1 ]]; then
        python3 predict.py $*
else
        red_text "Neither predict nor train was set."
fi
`;
}

function _get_predict_py_for_local_training () {
	var old_divide_by_value = $("#divide_by").val();

	return `#!/usr/bin/env python3
# This generated code is licensed under CC-BY.

import sys
import os
import numpy as np
import tensorflow as tf
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import Conv2D, Flatten, Dense
from tensorflow.keras.preprocessing import image
from termcolor import colored

def predict_single_file(file_path, model, labels):
    img = image.load_img(file_path, target_size=(${height}, ${width}))
    img_array = image.img_to_array(img)
    img_array = np.expand_dims(img_array, axis=0) / ${old_divide_by_value}

    prediction = model.predict(img_array)
    max_label_idx = np.argmax(prediction)
    predicted_label = labels[max_label_idx]
    print(f"Predicted label for {file_path}: {predicted_label}")

    for i in range(0, len(prediction[0])):
        if i == max_label_idx:
            print(colored(f"{labels[i]}: {prediction[0][i]}", "green"))
        else:
            print(f"{labels[i]}: {prediction[0][i]}")

def main():
    if not os.path.exists('saved_model'):
        print("Error: 'saved_model' does not exist. Please train the model first.")
        sys.exit(1)

    labels = []
    import json

    try:
        with open('labels.json', 'r') as json_file:
            labels = json.load(json_file)
    except Exception as e:
        print("Error loading labels.json:", e)

    model = None

    try:
        model = tf.keras.models.load_model('saved_model')
    except OSError as e:
        print(colored(str(e), "red"))
        sys.exit(1)

    model.summary()

    if len(sys.argv) < 2:
        print("Usage: predict.py <file1> <file2> ...")
        sys.exit(2)

    for file_path in sys.argv[1:]:
        if not os.path.exists(file_path):
            print(f"Error: File '{file_path}' does not exist.")
            continue
        predict_single_file(file_path, model, labels)

if __name__ == "__main__":
    main()
`;
}

function _get_readme_md_for_local_training () {
	return `# What is this?

This is a package there is everything to run the neural network you created in asanAI on your local hardware.

# Quickstart:

In the \`data\` directory, there are subdirectories, one for each category.

Put your images into these folders, and run \`bash run.sh --train\` to train the model. It will automatically get saved as \`saved_model\`, and then you can predict new images with \`bash run.sh --predict filename1.jpg\`.

# Files:

## run.sh

This is the run-script for the network. It installs all dependencies like TensorFlow, Keras and so on that you need to train the neural network and predict it.

## train.py

This file is for training the neural network. Run it with:

\`\`\`
bash run.sh --train
\`\`\`

## predict.py

This file is for predicting files with the neural network. Run it with:

\`\`\`
bash run.sh --predict imagefile1.jpg imagefile2.jpg ...
\`\`\`

# Problems?

Contact <norman.koch@tu-dresden.de>.
`;
}

function _get_tensorflow_save_model_code () {
	var _epochs = $("#epochs").val();

	var _optimizer = $("#optimizer").val();

	var _optimizer_python_name = "";

	var possible_options = {
		beta1: "beta_1",
		beta2: "beta_2",
		decay: "weight_decay",
		epsilon: "epsilon",
		initialAccumulatorValue: "initial_accumulator_value",
		learningRate: "learning_rate",
		momentum: "momentum",
		rho: "rho"
	};

	var optimizer_values = {};

	var optimizer_option_keys = Object.keys(possible_options);

	for (var i = 0; i < optimizer_option_keys.length; i++) {
		var element_name = `#${optimizer_option_keys[i]}_${_optimizer}`;

		var $option_element = $(element_name);

		if ($option_element.length) {
			optimizer_values[possible_options[optimizer_option_keys[i]]] = $option_element.val();
		}
	}

	var optimizer_params_python_array = [];

	var given_params_names = Object.keys(optimizer_values);

	for (var i = 0; i < given_params_names.length; i++) {
		optimizer_params_python_array.push(given_params_names[i] + "=" + optimizer_values[given_params_names[i]]);
	}

	var optimizer_params_python = optimizer_params_python_array.join(", ");

	switch (_optimizer) {
	case "adam":
		_optimizer_python_name = "Adam";
		break;

	case "adadelta":
		_optimizer_python_name = "Adadelta";
		break;

	case "adagrad":
		_optimizer_python_name = "Adagrad";
		break;

	case "adamax":
		_optimizer_python_name = "Adamax";
		break;

	case "rmsprop":
		_optimizer_python_name = "RMSprop";
		break;

	case "sgd":
		_optimizer_python_name = "SGD";
		break;

	default:
		void(0); err("Unknown optimizer name: " + _optimizer);
		return;
	}

	return `

parser = argparse.ArgumentParser(description='Description of your program')
parser.add_argument('--train', action='store_true', help='Train the model')
parser.add_argument('--predict', action='store_true', help='Use the trained model for prediction')
parser.add_argument('--learning_rate', type=float, help='Learning rate as a floating point number')
parser.add_argument('--epochs', type=int, help='Number of epochs as an integer')
parser.add_argument('--validation_split', type=float, help='Validation split as a floating point number')
parser.add_argument('--width', type=int, help='Width as an integer')
parser.add_argument('--height', type=int, help='Height as an integer')
parser.add_argument('--debug', action='store_true', help='Enables debug mode (set -x)')

args = parser.parse_args()

from tensorflow.keras.optimizers import ${_optimizer_python_name}
optimizer = ${_optimizer_python_name}(${optimizer_params_python})

model.compile(optimizer=optimizer, loss='categorical_crossentropy', metrics=['accuracy'])
model.fit(train_generator, validation_data=validation_generator, epochs=${_epochs})

# Save the model to saved_model for future usage.
model.save('saved_model')
`;
}

function _get_tensorflow_data_loader_code () {
	var _batch_size = $("#batchSize").val();
	var _validation_split = parseFloat($("#validationSplit").val()) / 100;

	return `
from tensorflow.keras.preprocessing.image import ImageDataGenerator

# Define size of images
target_size = (${height}, ${width})

# Create ImageDataGenerator to read images and resize them
datagen = ImageDataGenerator(rescale=1./divide_by, # Normalize (from 0-255 to 0-1)
                             validation_split=${_validation_split}, # Split into validation and training datasets
                             preprocessing_function=lambda x: tf.image.resize(x, target_size)) # Resize images

# Read images and split them into training and validation dataset automatically
train_generator = datagen.flow_from_directory(
    'data',
    target_size=target_size,
    batch_size=${_batch_size},
    class_mode='categorical',
    subset='training')

validation_generator = datagen.flow_from_directory(
    'data',
    target_size=target_size,
    batch_size=32,
    class_mode='categorical',
    subset='validation')

import json

labels = (train_generator.class_indices)
labels = dict((v,k) for k,v in labels.items())
labels_array = [labels[value] for value in labels]

try:
    with open('labels.json', 'w') as json_file:
        json.dump(labels_array, json_file)
except Exception as e:
    print("Error writing the JSON file:", e)

`;
}

function dataURLToBlob(dataURL) {
	try {
		var parts = dataURL.split(";base64,");
		var contentType = parts[0].split(":")[1];
		var raw = window.atob(parts[1]);
		var rawLength = raw.length;
		var uInt8Array = new Uint8Array(rawLength);

		for (var i = 0; i < rawLength; ++i) {
			uInt8Array[i] = raw.charCodeAt(i);
		}

		return new Blob([uInt8Array], { type: contentType });
	} catch (e) {
		if(Object.keys(e).includes("message")) {
			e = e.message;
		}

		assert(false, e);
	}
}

function downloadNetworkZip(blob) {
	try {
		var url = URL.createObjectURL(blob);
		var link = document.createElement("a");
		link.href = url;
		link.download = "network.zip";
		link.textContent = "Download zip file";

		link.click();

		URL.revokeObjectURL(url);
	} catch (e) {
		if(Object.keys(e).includes("message")) {
			e = e.message;
		}

		assert(false, e);
	}
}

function clear_attrament (idname) {
	if(!atrament_data) {
		wrn("[clear_attrament] atrament_data not defined");
		return;
	}

	if(idname === null) {
		wrn(language[lang]["idname_is_null_returning"]);
		return;
	}

	if(idname === undefined) {
		wrn(language[lang]["idname_is_undefined_returning"]);
		return;
	}
	
	if(!Object.keys(atrament_data).includes(idname)) {
		void(0); wrn(`clear_attrament("${idname}"): idname = "${idname}" (type: ${typeof(idname)})not found`);
		return;
	}

	try {
		atrament_data[idname]["atrament"].context.fillStyle = "#ffffff";
		atrament_data[idname]["atrament"].context.fillRect(
			0,
			0,
			atrament_data[idname]["atrament"].canvas.width,
			atrament_data[idname]["atrament"].canvas.height
		);
	} catch (e) {
		err(e);
	}

}

function invert_elements_in_dark_mode () {
	is_dark_mode = $("#theme_choser").val() == "darkmode" ? true : false;

	if(is_dark_mode != is_already_inverted_in_dark_mode) {
		var el = $(".invert_in_dark_mode");

		el.removeClass("dark_mode_inverted");

		if(is_dark_mode) {
			el.addClass("dark_mode_inverted");
		}

		if(is_dark_mode) {
			$("#asanai_main_logo").attr("src", "_gui/logo_small_dark.png");
		} else {
			$("#asanai_main_logo").attr("src", "_gui/logo_small.png");
		}

		is_already_inverted_in_dark_mode = is_dark_mode;
	}
}

function green_marker (element) {
	$(element).parent().parent().find(".green_icon").removeClass("green_icon");
	$(element).addClass("green_icon");
}

function get_drawing_board_on_page (indiv, idname, customfunc) {
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
		required_skills = " data-required_skills=\"took_images[4]\" ";
	//} else {
	//	log(`!!!!!!${idname}!!!!!!`)
	}

	var w = 150;
	var h = 150;

	var code = `<form class='no_mark${classes}' ${required_skills} onkeydown="return event.key != 'Enter';">
		<span class='atrament_settings'>
			<span class='invert_in_dark_mode'><a class='atrament_buttons green_icon' onclick="atrament_data['${idname}']['atrament'].mode = 'brush'; $(this).parent().find('.pen_size_slider').show(); $(this).parent().find('.jscolor').show(); green_marker(this); hide_colorpicker_for_eraser('${idname}');"><img width=32 src='_gui/pen.png'/></a></span>
			<span class='invert_in_dark_mode'><a class='atrament_buttons' onclick="atrament_data['${idname}']['atrament'].mode = 'fill'; $(this).parent().find('.pen_size_slider').hide(); $(this).parent().find('.jscolor').show(); green_marker(this); hide_colorpicker_for_eraser('${idname}');"><img width=32 src='_gui/fill_icon.svg'></a></span>
			<!--<span class='invert_in_dark_mode'><a class='atrament_buttons' onclick="atrament_data['${idname}']['atrament'].mode = 'erase'; $(this).parent().find('.pen_size_slider').show(); $(this).parent().find('.jscolor').hide(); green_marker(this); hide_colorpicker_for_eraser('${idname}');"><img width=32 src='_gui/eraser_icon.svg'/></a></span>-->
			&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
			<span onclick="clear_attrament('${idname}');${customfunc}" class='atrament_buttons_small'>&#10060;</span><br>
			<span class='colorpicker_elements'>
				<img onclick='chose_nearest_color_picker(this)' src='_gui/Colorwheel.svg' width=32 />
				<input type="text" name="value" id='${idname}_colorpicker' class="show_data jscolor" style='width: 50px' value="#000000" onchange="atrament_data['${idname}']['atrament'].color='#'+this.value;" />
			</span>
			<input class="show_data pen_size_slider" type="range" min="1" oninput="atrament_data['${idname}']['atrament'].weight = parse_float(event.target.value);" value="20" step="1" max="100" autocomplete="off" />
			<br />
		</span>
		<canvas style="z-index: 2; margin: 5px; position: relative; outline: solid 5px black; width: ${w}px; height: ${h}px" width=${w} height=${h} id="${idname}"></canvas>
	</form>`;

	var drawingboard = $(code);

	$(indiv).append(drawingboard);

	atrament_data[idname] = {};

	// Drawings code
	// first, we need to set up the canvas
	atrament_data[idname]["canvas"] = document.getElementById(idname);
	atrament_data[idname]["canvas"] .style.cursor = "cell";
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
	var eventsLog = [];
	var logElement = document.getElementById("events");

	atrament_data[idname]["atrament"].addEventListener("clean", () => {
		taint_privacy();

		if(customfunc) {
			eval(customfunc);
		}
	});

	atrament_data[idname]["atrament"].addEventListener("fillstart", ({ x, y }) => {
		taint_privacy();

		atrament_data[idname]["canvas"].style.cursor = "wait";
		if(customfunc) {
			eval(customfunc);
		}
	});

	atrament_data[idname]["atrament"].addEventListener("fillend", () => {
		taint_privacy();

		atrament_data[idname]["canvas"].style.cursor = "cell";
		if(customfunc) {
			eval(customfunc);
		}
	});

	atrament_data[idname]["atrament"].addEventListener("strokeend", async () => {
		taint_privacy();

		if(customfunc) {
			try {
				eval(customfunc);
			} catch (e) {
				wrn("[get_drawing_board_on_page] Cannot run custom atrament function, probably because the model was undefined: " + e);
				console.trace();
			}
		}
	});

	atrament_data[idname]["atrament"].adaptiveStroke = true;

	atrament_data[idname]["colorpicker"] = new jscolor($("#" + idname + "_colorpicker")[0], {format:"rgb"});

	atrament_data[idname]["atrament"].weight = 20;
}

function chose_nearest_color_picker (e) {
	var $e = $(e);

	if(!$e.length) {
		void(0); err("Cannot find element e: " + e);
		return;
	}

	var input = $(e).parent().find("input");

	if(!input.length) {
		err(language[lang]["could_not_find_input"]);
		return;
	}

	var id = $(input)[0].id.replace(/_colorpicker$/, "");

	atrament_data[id].colorpicker.show();
}

async function onclick_math_mode (t, e) {
	await write_model_to_latex_to_page(0, 1);
	await _temml();
}

async function set_all_strides () {
	var n = $("#all_strides_val").val();
	await _set_all_strides(n);
	if(looks_like_number(n)) {
		$("#all_strides_val").val("");
	}

}

async function _set_all_strides (n) {
	assert(typeof(n) == "number" || looks_like_number(n), n + " is not an integer and does not look like one");
	n = parse_int(n);

	$(".strides_z").val(n);
	$(".strides_y").val(n);
	$(".strides_x").val(n);

	$($(".strides_x")[0]).trigger("change");

}

function hide_empty_tabs (name) {
	var c = $("#" + name).children();

	for (var i = 0; i < c.length; i++) {
		if($(c[i]).css("display") != "none") {
			$("[href='#" + name + "']").parent().show();
			return;
		}
	}

	if($("[href='#" + name + "']").parent().hasClass("ui-state-active")) {
		$("[href='#home_ribbon']").click();
	}

	$("[href='#" + name + "']").parent().hide();
}

function get_canvas_blob(canvas) {
	try {
		return new Promise(function(resolve, reject) {
			try {
				canvas.toBlob(function(blob) {
					resolve(blob);
				});
			} catch (e) {
				if(Object.keys(e).includes("message")) {
					e = e.message;
				}

				assert(false, e);
			}
		});
	} catch (e) {
		if(Object.keys(e).includes("message")) {
			e = e.message;
		}

		assert(false, e);
	}
}

function get_img_blob(img) {
	return new Promise(function(resolve, reject) {
		try {
			var canvas = document.createElement("canvas");
			var ctx = canvas.getContext("2d");
			var $img = $(img);

			if (img.complete) {
				canvas.width = $img.width();
				canvas.height = $img.height();

				ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

				get_canvas_blob(canvas)
					.then(function (blob) {
						resolve(blob);
					})
					.catch(function (error) {
						reject(error);
					});
			} else {
				img.onload = function () {
					canvas.width = $img.width() * 2;
					canvas.height = $img.height() * 2;

					ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

					$("body").append(canvas);

					get_canvas_blob(canvas)
						.then(function (blob) {
							resolve(blob);
						})
						.catch(function (error) {
							reject(error);
						});
				};
			}
		} catch (e) {
			if(Object.keys(e).includes("message")) {
				e = e.message;
			}

			assert(false, e);
		}
	});
}

async function create_zip_with_custom_images () {
	var zipWriter = new zip.ZipWriter(new zip.BlobWriter("application/zip"));

	var canvasses = $(".own_image_span").find("canvas");

	for (var i = 0; i < canvasses.length; i++) {
		var canvas = canvasses[i];

		var blob = await get_canvas_blob(canvas);

		var label = $(canvas).parent().parent().parent().find(".own_image_label").val();

		var filename = canvas.id;

		if(!filename) {
			filename = uuidv4();
		}
		var path = label + "/" + filename + ".png";

		if(!blob) {
			err(language[lang]["canvas_blob_could_not_be_found"]);
		} else {
			var blob_reader = new zip.BlobReader(blob);

			try {
				await zipWriter.add(path, blob_reader);
			} catch (e) {
				if(Object.keys(e).includes("message")) {
					e = e.message;
				}

				err(`${language[lang]["trying_to_add_canvas_to"]} '${path}': ` + e);
			}
		}
	}

	var imgs = $(".own_image_span").find("img");

	for (var i = 0; i < imgs.length; i++) {
		var img = imgs[i];

		var blob = await get_img_blob(img);

		var label = $(img).parent().parent().parent().find(".own_image_label").val();

		var filename = img.id;

		if(!filename) {
			filename = uuidv4();
		}
		var path = label + "/" + filename + ".png";

		if(!blob) {
			err(language[lang]["img_blob_could_not_be_found"]);
		} else {
			var blob_reader = new zip.BlobReader(blob);

			try {
				await zipWriter.add(path, blob_reader);
			} catch (e) {
				if(Object.keys(e).includes("message")) {
					e = e.message;
				}

				err(`Trying to add img to '${path}': ` + e);
			}
		}
	}

	var res = await zipWriter.close();
	return res;
}

function save_file (name, type, data) {
	if (data !== null && navigator.msSaveBlob) {
		return navigator.msSaveBlob(new Blob([data], { type: type }), name);
	}

	var a = $("<a style='display: none;'/>");
	var url = window.URL.createObjectURL(new Blob([data], {type: type}));
	a.attr("href", url);
	a.attr("download", name);
	$("body").append(a);
	a[0].click();
	window.URL.revokeObjectURL(url);
	a.remove();
}

function save_custom_images_file (blob, filename="custom_images.zip") {
	save_file(filename, "data:application/zip", blob);
}

async function create_and_download_zip () {
	var res = await create_zip_with_custom_images().then(save_custom_images_file);

	return res;
}

async function change_last_responsible_layer_for_image_output () {
	if(is_classification) {
		return;
	}

	var current_layer_status_hash = await get_current_layer_container_status_hash();

	if(last_image_output_shape_hash == current_layer_status_hash) {
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
			l(sprintf(language[lang]["setting_neurons_or_filters_of_layer_n_to_3"], last_layer_nr));
			$($(".layer_setting")[last_layer_nr]).find(".units,.filters").val(3).trigger("change");
		}

		if($($(".layer_setting")[last_layer_nr]).find(".activation").val() != "linear") {
			l(sprintf(language[lang]["setting_activation_function_of_layer_n_to_linear"], last_layer_nr));
			$($(".layer_setting")[last_layer_nr]).find(".activation").val("linear").trigger("change");
		}
	} else {
		wrn("[change_last_responsible_layer_for_image_output] Last layer number could not be found. Do you have any Dense or Conv2d layers?");
	}
}

function show_bars_instead_of_numbers () {
	if(get_last_layer_activation_function() == "softmax") {
		if($("#show_bars_instead_of_numbers").is(":checked")) {
			return true;
		}
	}

	return false;
}

async function update_label_by_nr (t, nr) {
	var name = $(t).val();

	var t_xpath = get_element_xpath(t);

	labels[nr] = name;

	$(".label_element").each((i, x) => {
		if(1 || get_element_xpath(x) != t_xpath) {
			var label_index = parse_int($(x).parent().parent().find(".label_element").index(x)) % labels.length;

			if(label_index == nr) {
				if($(x).children().length && $(x).children()[0].nodeName == "INPUT") {
					$(x).find("input").val(name);
				} else {
					$(x).html(`<input class='label_input_element' type='text' value='${name}' onchange='update_label_by_nr(${label_index}, $(this).val())' />`);
				}
			}
		}
	});

	$($(".own_image_label")[nr]).val(name);

	await update_python_code(1);
}

function allow_editable_labels () {
	$(".label_element").each((i, x) => {
		var label_index = parse_int($(x).parent().parent().find(".label_element").index(x)) % labels.length;

		if(!labels.length) {
			//wrn("labels is an array, but is empty.");
			return;
		}

		try {
			var tmp_label = labels[label_index];
			if(tmp_label === undefined) {
				wrn("[allow_editable_labels] tmp_label undefined");
				return;
			}

			if(label_index === undefined) {
				var tmp_label = $(x).text();
				$(x).html(`<input id="${uuidv4()}" class='label_input_element' type='text' value='${tmp_label}' onchange='update_label_by_nr(this, ${label_index})' />`);
				return;
			}

			tmp_label = tmp_label.replaceAll(/'/g, "");
			if(tmp_label) {
				if($(x).children().length && $(x).children()[0].nodeName == "INPUT") {
					$(x).find("input").val(tmp_label);
				} else {
					$(x).html(`<input id="${uuidv4()}" class='label_input_element' type='text' value='${tmp_label}' onchange='update_label_by_nr(this, ${label_index})' />`);
				}
			} else {
				tmp_label = $(x).text();
				$(x).html(`<input id="${uuidv4()}" class='label_input_element' type='text' value='${tmp_label}' onchange='update_label_by_nr(this, ${label_index})' />`);
			}
		} catch (e) {
			if(("" + e).includes("tmp_label.replaceAll is not a function")) {
				wrn("[allow_editable_labels] This may be the case if you have data from a CSV. If this is the case, this warning can most likely be ignored.");
			} else {
				err(e);
			}
		}
	});
}

function enable_every_layer () {
	$(".configtable").find("input,select,button").prop("disabled", false);
	$(".layer_setting").find("button").prop("disabled", false);
}

function disable_flatten_layer () {
	if(!model) {
		if(finished_loading) {
			wrn(`[disable_flatten_layer] ${language[lang]["no_model_found"]}`);
		}
		return;
	}

	if(!Object.keys(model).includes("layers") || !model.layers.length) {
		if(finished_loading) {
			wrn(`[disable_flatten_layer] ${language[lang]["no_layers_found"]}`);
		}
		return;
	}

	try {
		var flatten_layer = null;
		for (var i = 0; i < model.layers.length; i++) {
			if(!flatten_layer && model.layers[i].name.startsWith("flatten")) {
				flatten_layer = i;
			}
		}

		if(flatten_layer !== null) {
			$($(".layer_setting")[flatten_layer]).find(".remove_layer").prop("disabled", true);
		}
	} catch (e) {
		throw new Error(e);
	}

}

function disable_everything_in_last_layer_enable_everyone_else_in_beginner_mode () {
	try {
		if(model && !(model.isTraining || started_training)) {
			enable_every_layer();
		}

		if(mode == "beginner") {
			var last_element_nr = $(".layer_setting").length - 1;
			var last_layer_setting = $($(".layer_setting")[last_element_nr]);

			$($(".configtable")[$(".configtable").length - 1]).find("input,select,button").prop("disabled", true);

			last_layer_setting.find("button").prop("disabled", true);
			last_layer_setting.find(".show_data").prop("disabled", false);
			last_layer_setting.find(".visualize_layer_button").prop("disabled", false);
			last_layer_setting.find(".remove_layer").prop("disabled", true);
			last_layer_setting.find(".add_layer").prop("disabled", false);

			disable_flatten_layer();

			//l("Disabling last layer in beginner mode");
		}
	} catch (e) {
		if(Object.keys(e).includes("message")) {
			e = e.message;
		}

		err("[disable_everything_in_last_layer_enable_everyone_else_in_beginner_mode] " + e);
	}

}

function hide_colorpicker_for_eraser (idname) {
	try {
		var box = $(atrament_data[idname].canvas).parent();

		if(atrament_data[idname]["atrament"].mode == "erase") {
			box.find(".colorpicker_elements").css("visibility", "hidden");
		} else {
			box.find(".colorpicker_elements").css("visibility", "visible");
		}
	} catch (e) {
		if(Object.keys(e).includes("message")) {
			e = e.message;
		}

		assert(false, e);
	}
}

function load_msg(swal_msg_format) {
	remove_overlay();

	var _overlay = null;
	if(started_training && stop_downloading_data) {
		info(language[lang]["training_not_started_anymore_stopped_downloading"]);
		return;
	}

	if(finished_loading) {
		_overlay = show_overlay(swal_msg_format["html"] ? swal_msg_format["html"] : "", swal_msg_format["title"] ? swal_msg_format["title"] : "");
	} else {
		var html_msg = "";
		if(Object.keys(swal_msg_format).includes("title")) {
			html_msg = "<h1 style='font-size: 3vw;'>" + swal_msg_format["title"] + "</h1>";
		}

		if(Object.keys(swal_msg_format).includes("html")) {
			html_msg += swal_msg_format["html"];
		}

		$("#load_msg").html(html_msg);
	}

	return _overlay;
}

function show_proper_set_all_initializer (required) {
	try {
		$(".set_all_initializers_tr").hide();

		for (var i = 0; i < required.length; i++) {
			var val_key = required[i];
			$(".set_all_initializers_" + val_key).show();
		}
	} catch (e) {
		if(Object.keys(e).includes("message")) {
			e = e.message;
		}

		assert(false, e);
	}
}

function set_required_seeds (required, type, kernel_or_bias, trigger=0) {
	assert(typeof(type) == "string", "type is not string");

	var values = get_initializer_set_all_values(required, kernel_or_bias);

	assert(typeof(values) == "object", "values is not an object");

	for (var i = 0; i < required.length; i++) {
		var val_key = required[i];

		if(!val_key) {
			void(0); log("val_key not defined or false START");
			void(0); log("required", required);
			void(0); log("type", type);
			void(0); log("values", values);
			void(0); log("kernel_or_bias", kernel_or_bias);
			void(0); err("val_key not defined or false END");

			continue;
		}

		if(!Object.keys(values).includes(val_key)) {
			void(0); err(`${val_key} is required but not defined at all`);
			continue;
		}

		var val = values[val_key];
		//log("val", val);

		if(Object.keys(values).includes(val_key)) {
			var item_selector = "." + kernel_or_bias + val_key;
			//log("item_selector", item_selector);
			var ui_elements = $(item_selector);
			if(ui_elements.length >= 1) {
				try {
					var element = ui_elements.val(val).trigger("change");
					if(trigger) {
						element.trigger("change");
					}
				} catch (e) {
					if(Object.keys(e).includes("message")) {
						e = e.message;
					}

					if(("" + e).includes("SyntaxError: illegal character")) {
						err("[set_required_seeds] " + e);
					} else {
						throw new Error(e);
					}
				}
			} else if(finished_loading) {
				err("ui_elements contains no elements. Selector: "  + item_selector);
			}
		} else {
			err(`[set_required_seeds] ${val_key} is required but not properly defined`);
		}
	}
}

function get_initializer_set_all_values (required) {
	var values = [];
	assert(typeof(values) == "object", "values is not an object");

	try {
		required.forEach((element) => {
			var selector = "#set_all_initializers_value_" + element;
			var elements = $(selector);
			if(elements.length) {
				var value = elements.val();
				if(value) {
					values[element] = value;
				} else {
					err(language[lang]["value_is_empty"]);
				}
			} else {
				err("Nothing found for selector " + selector);
			}
		});

		//assert(Object.keys(values).length == required.length, "some values are missing: " + Object.keys(values).length + " !=" + required.length);

		return values;
	} catch (e) {
		if(Object.keys(e).includes("message")) {
			e = e.message;
		}

		assert(false, e);
	}
}

function change_all_initializers (kernel_bias=["kernel_initializer_", "bias_initializer_"]) {
	var type = $("#change_initializers_selector").val();
	assert(typeof(type) == "string", "type is not string");

	try {
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
				err("Unknown initializer type: " + type);
				error_occured = true;
			}

			show_proper_set_all_initializer(required);

			if(!error_occured) {
				try {
					set_required_seeds(required, type, kernel_or_bias);
				} catch (e) {
					l(language[lang]["error"] + ": " + e);
				}
			}
		});
	} catch (e) {
		if(Object.keys(e).includes("message")) {
			e = e.message;
		}

		assert(false, e);
	}

}

function set_right_border_between_example_predictions() {
	var expred = $("#example_predictions").find(".full_example_image_prediction");

	for (var i = 0; i < expred.length - 1; i++) {
		$(expred[i]).css("padding-right", "50px").css("border-right", "thick double #000000");
	}
}

function is_tablet () {
	var userAgent = navigator.userAgent.toLowerCase();
	var isTablet = /(ipad|tablet|(android(?!.*mobile))|(windows(?!.*phone)(.*touch))|kindle|playbook|silk|(puffin(?!.*(IP|AP|WP))))/.test(userAgent);

	return isTablet;
}

function is_touch_device () {
	if(is_touch_device_cache !== null) {
		return is_touch_device_cache;
	}

	var res = (("ontouchstart" in window) ||
		(navigator.maxTouchPoints > 0) ||
		(navigator.msMaxTouchPoints > 0));

	if(!res) {
		res = !!window.matchMedia("(pointer: coarse)").matches;
	}

	is_touch_device_cache = res;

	return res;
}

function get_cursor_or_none (cursorname) {
	try {
		if(is_touch_device() && is_tablet()) {
			return "none";
		}
	} catch (e) {
		if(("" + e).includes("is_touch_device is not defined")) {
			return cursorname;
		}
	}

	return cursorname;
}

function label_debugger_icon_ok () {
	if(!model) {
		return;
	}

	if(is_setting_config) {
		$("#label_debugger_icon").html("").hide();
		return;
	}

	if(get_last_layer_activation_function() != "softmax") {
		$("#label_debugger_icon").html("").hide();
		return;
	}

	if(labels.length) {
		$("#label_debugger_icon").html("").hide();
	} else {
		try {
			if(
				model &&
				Object.keys(model).includes("layers") &&
				model.layers &&
				model.layers.last().output.shape.length == 2 &&
				model.layers.last().name.startsWith("dense")
			) {
				$("#label_debugger_icon").html("<span style='background-color: orange; color: black;'>[No labels]</span>").show();
				get_label_data(); // await not possible here
			} else {
				$("#label_debugger_icon").html("").hide();
			}
		} catch (e) {
			if(Object.keys(e).includes("message")) {
				e = e.message;
			}

			err(e);
		}
	}
}

function model_is_ok () {
	if(!model_is_ok_icon || !finished_loading) {
		return;
	}

	var green = "&#128994;";
	var red = "&#128308;";
	var orange = "&#128992;";

	var color = green;

	if(!lang) {
		void(0); err("lang is not defined! Something is seriously wrong here...");
		return;
	}

	if(!language) {
		void(0); err("language is not defined! Something is seriously wrong here...");
		return;
	}

	var msg = language[lang]["model_is_ok"];

	try {
		var model_has_input = 1;
		try {
			var x = model.input;
		} catch (e) {
			model_has_input = 0;
		}

		if(!model) {
			color = red;
			msg = language[lang]["model_is_not_defined"];
		} else if(model && !Object.keys(model).includes("layers")) {
			color = orange;
			msg = "Model does not have any layers.";
		} else if(model && !model_has_input) {
			color = orange;
			msg = "Model has no input.";
		} else if(layer_has_multiple_nodes()) {
			color = red;
			msg = "Model has multiple output nodes.";
		} else if($("#layers_container").find("li").length != model.layers.length ) {
			color = red;
			msg = `${language[lang]["different_number_layers_gui_model"]} (GUI: ${$("#layers_container").find("li").length}, ${language[lang]["model"]}: ${model.layers.length}).`;
		}
	} catch (e) {
		color = red;
		msg = "" + e;
		err(msg);
	}

	var _content = `${color}`;

	if(started_training) {
		_content += "&#129302;&#128214;";
	}

	if(waiting_updated_page_uuids.length) {
		_content += "&#9201;";
	}

	if(model_is_trained && color == green ) {
		_content += "&#9989;";
	}

	var number_of_visible_tabs = 0;
	$("#right_side").find(">.tab").each((i,e) => {
		if($(e).is(":visible")) {
			number_of_visible_tabs++;
		}
	});

	if(number_of_visible_tabs > 1) {
		log_once(`${number_of_visible_tabs} visible tabs`);
		_content += "&#128461;";
	}

	var last_description_end_y = parse_int(get_last_description_of_layers_end_y());
	var last_layer_setting_end_y = parse_int(get_last_layer_setting_end_y());

	if(last_description_end_y != 0) {
		if(Math.abs(last_description_end_y - last_layer_setting_end_y) > 3) {
			_content += "&updownarrow;";
			if(finished_loading) {
				dbg(`${language[lang]["desc_boxes_and_layers_different_length"]}: ${last_layer_setting_end_y}/${last_description_end_y}`);
			}
			write_descriptions(); // await not possible
		}
	}

	if(last_model_ok_status != _content) {
		if(color == red) {
			wrn("[model_is_ok] " + msg);
		} else if (color == orange) {
			dbg("[model_is_ok] " + msg);
		}

		l(msg);

		var new_html = `<span title='${msg}'>${_content}</span>`;
		if(new_html != model_is_ok_icon.html()) {
			model_is_ok_icon.html(new_html);
		}

		last_model_ok_status = _content;
	}

	// nasty hack to prevent both, ribbon icons and ribbon at the same time
	if($("#ribbon_shower").is(":visible") && $("#ribbon").is(":visible")) {
		show_ribbon();
	}

	if(color == red) {
		$("#model_is_ok_icon").css("color", "red");
	} else if(color == green) {
		$("#model_is_ok_icon").css("color", "green");
	} else if(color == orange) {
		$("#model_is_ok_icon").css("color", "orange");
	}
}

function show_overlay(text, title="") {
	try {
		var bg_color = "white";
		var text_color = "black";

		if (is_dark_mode) {
			bg_color = "black";
			text_color = "white";
		}

		var overlay = document.createElement("div");
		overlay.style.position = "fixed";
		overlay.style.top = "0";
		overlay.style.left = "0";
		overlay.style.width = "100%";
		overlay.style.height = "100%";
		overlay.style.opacity = "1";
		overlay.style.display = "flex";
		overlay.style.alignItems = "center";
		overlay.style.justifyContent = "center";
		overlay.style.userSelect = "none";
		overlay.style.zIndex = "9999";
		$(overlay).addClass("overlay");

		if (bg_color.toLowerCase() === "black") {
			overlay.style.backgroundImage = "linear-gradient(to bottom, black, #111111, #222222)";
		} else if (bg_color.toLowerCase() === "white") {
			overlay.style.backgroundImage = "linear-gradient(to bottom, white, #f0f0f0, #e0e0e0)";
		} else {
			overlay.style.backgroundImage = "linear-gradient(to bottom, " + bg_color + ", #000000)";
		}

		var textElement = document.createElement("p");
		textElement.innerHTML = text;
		textElement.style.textAlign = "center";
		textElement.style.fontFamily = "Arial, sans-serif";
		textElement.style.fontSize = "24px";
		textElement.style.color = text_color;
		textElement.style.padding = "20px";

		overlay.appendChild(textElement);

		if(title) {
			var hElement = document.createElement("h1");
			hElement.innerHTML = title;
			hElement.style.textAlign = "center";
			hElement.style.fontFamily = "Arial, sans-serif";
			hElement.style.fontSize = "24px";
			hElement.style.color = text_color;
			hElement.style.padding = "20px";

			overlay.appendChild(hElement);
		}

		document.body.appendChild(overlay);

		assert(true, "Overlay displayed successfully.");

		return overlay;
	} catch (error) {
		log(language[lang]["an_error_occured"], error);
		wrn("[show_overlay] Failed to display overlay.");
	}
}

function clone_canvas(oldCanvas) {
	try {
		//create a new canvas
		var newCanvas = document.createElement("canvas");
		var context = newCanvas.getContext("2d");

		//set dimensions
		newCanvas.width = oldCanvas.width;
		newCanvas.height = oldCanvas.height;

		//apply the old canvas to the new one
		context.drawImage(oldCanvas, 0, 0);

		//return the new canvas
		return newCanvas;
	} catch (e) {
		if(Object.keys(e).includes("message")) {
			e = e.message;
		}

		assert(false, e);
	}
}

// Function to get the value of a query parameter from the URL
function get_get(paramName, _default) {
	var urlParams = new URLSearchParams(window.location.search);
	var res = urlParams.get(paramName);
	if(res !== null && res !== "") {
		return res;
	}

	return _default;
}

//log(get_get("epochs", 10), get_get("BLA", "abc"));

// Function to set or update a query parameter in the URL
function set_get(paramName, paramValue) {
	var urlParams = new URLSearchParams(window.location.search);
	urlParams.set(paramName, paramValue);

	// Update the URL with the new parameter
	var newUrl = `${window.location.origin}${window.location.pathname}?${urlParams.toString()}`;

	try {
		history.replaceState(null, "", newUrl); // Update the URL without reloading the page
	} catch (error) {
		// Handle error: Log and warn about the error
		wrn("[set_get] Error updating URL:", error);
		// You can add more intelligent handling here if needed
	}
}

function jump_to_interesting_tab () {
	return $("#jump_to_interesting_tab").is(":checked") ? 1 : 0;
}

function can_reload_js (name) {
	if(name.includes("visualization") ||
		name.includes("libs") ||
		name.includes("jquery") ||
		name.includes("tf") ||
		name.includes("main.js") ||
		name.includes("debug.js") ||
		name.includes("three") ||
		name.includes("bottom.js") ||
		name.includes("custom")
	) {
		return false;
	}
	return true;
}

async function reload_all_js () {
	var entries = performance.getEntriesByType("resource");
	entries.map(function(entry) {
		if (entry.initiatorType === "script") {
			if(can_reload_js(entry.name)) {
				reload_js(entry.name);
			}
		}
	});

	await create_model();
	await compile_model();
}

function reload_js(src) {
	$("script[src=\"" + src + "\"]").remove();
	$("<script>").attr("src", src).appendTo("head");
}

// reload_all_js();

function create_centered_window_with_text(parameter) {
	$(".math_copier").remove();

	// Create a div for the window
	var windowDiv = document.createElement("div");
	windowDiv.style.position = "fixed";
	windowDiv.style.top = "50%"; // Center vertically
	windowDiv.style.left = "50%"; // Center horizontally
	windowDiv.style.transform = "translate(-50%, -50%)"; // Center using transform
	windowDiv.style.minWidth = "300px";
	windowDiv.style.zIndex = 9;
	windowDiv.style.backgroundColor = "white";
	windowDiv.style.border = "1px solid #ccc";
	windowDiv.style.padding = "10px";
	windowDiv.style.boxShadow = "0px 0px 10px rgba(0, 0, 0, 0.2)";
	windowDiv.classList.add("math_copier");

	// Create the "x" button
	var closeButton = document.createElement("button");
	closeButton.textContent = "x";
	closeButton.style.position = "absolute";
	closeButton.style.top = "5px";
	closeButton.style.right = "5px";
	closeButton.style.border = "none";
	closeButton.style.backgroundColor = "red";
	closeButton.style.cursor = "pointer";

	// Create the readonly textarea
	var textarea = document.createElement("textarea");
	textarea.readOnly = true;
	textarea.style.width = "100%";
	textarea.style.height = "200px";
	textarea.textContent = parameter;

	// Create the "Copy to Clipboard" button
	var copyButton = document.createElement("button");
	copyButton.textContent = language[lang]["copy_to_clipboard"];
	copyButton.style.width = "100%";
	copyButton.style.marginTop = "10px";

	// Add a click event listener to copy the textarea's content to the clipboard
	copyButton.addEventListener("click", () => {
		textarea.select();
		document.execCommand("copy");
	});

	// Add the textarea, copy button, and close button to the window
	windowDiv.appendChild(closeButton);
	windowDiv.appendChild(textarea);
	windowDiv.appendChild(copyButton);

	// Add an event listener to close the window when the "x" button is clicked
	closeButton.addEventListener("click", () => {
		document.body.removeChild(windowDiv);
	});

	// Append the window to the body to display it
	document.body.appendChild(windowDiv);
}

function get_last_element_of_class_end_y(name) {
	if(document.body === null) {
		wrn("[get_last_element_of_class_end_y] document.body is null!");
		return;
	}

	assert(typeof(name) == "string", "get_last_element_of_class_end_y(" + name + ") parameter is not a string");
	var descs = $("." + name);

	if (!descs) {
		wrn("[get_last_element_of_class_end_y] descs not defined");
		return 0;
	}

	try {
		var last_desc = descs[descs.length - 1];
		if(!last_desc) {
			return 0;
		}

		var $last_desc = $(last_desc);

		var real_height_last_desc = real_height($last_desc);
		var last_desc_offset = $last_desc.offset();

		if(last_desc_offset && Object.keys(last_desc_offset).includes("top")) {
			var _res = last_desc_offset.top + real_height_last_desc;

			return _res;
		} else {
			return 0;
		}
	} catch (e) {
		if(Object.keys(e).includes("message")) {
			e = e.message;
		}

		wrn("[get_last_element_of_class_end_y] " + e);
	}

	return 0;
}

function get_last_layer_setting_end_y () {
	return get_last_element_of_class_end_y("layer_setting");
}

function get_last_description_of_layers_end_y () {
	return get_last_element_of_class_end_y("descriptions_of_layers");
}

function set_document_title (t) {
	if(t) {
		if(t != document.title) {
			document.title = t;
		}
	} else {
		err(language[lang]["missing_title"]);
	}
}

function hide_dataset_when_only_one () {
	var num_datasets = $("#model_dataset").children().length;

	if(num_datasets > 1) {
		$("#model_dataset").parent().parent().show();
	} else {
		$("#model_dataset").parent().parent().hide();
	}
}

function get_custom_elements_from_webcam_page () {
	var imgs = [];

	$("#own_images_container").find("img").each((i, e) => {
		if($(e).prop("src").match(/data:image\/png;base64,/)) {
			imgs.push(e);
		}
	});

	$("#own_images_container").find("canvas").each((i, e) => {
		if($(e).attr("id").match(/_canvas$/)) {
			imgs.push(e);
		}
	});

	return imgs;
}

function get_example_csv () {
	return `sex(m=0;w=1),height,shoe_size
0,171,41
0,172,41
0,175,42
0,175,44
0,178,44
0,180,42
0,180,44
0,183,44
0,183,46
0,185,42
0,187,44
0,205,48
0,206,50
1,155,37
1,156,36
1,157,37
1,158,35
1,158,37
1,159,36
1,159,38
1,160,36
1,160,37
1,160,38
1,160,40
1,161,37
1,161,38
1,162,36
1,163,37
1,163,38
1,163,39
1,164,36
1,164,37
1,164,39
1,165,36
1,165,37
1,165,38
1,165,39
1,166,38
1,167,39
1,168,36
1,168,38
1,168,39
1,169,38
1,169,39
1,169,40
1,170,38
1,170,39
1,170,40
1,171,39
1,171,40
1,172,37
1,172,39
1,173,38
1,173,40
1,174,37
1,174,39
1,175,39
1,176,40
1,178,39
1,178,41
1,180,42
1,183,39
1,184,41
`;
}

function load_shoe_example () {
	var example_shoe_str = get_example_csv();

	$("#csv_file").val(example_shoe_str).trigger("keyup");

	show_csv_file();
}

function load_csv_custom_function () {
	var start = $("#csv_custom_start").val();

	if(!looks_like_number(start)) {
		wrn(language[lang]["start_must_be_a_number"]);
		return;
	}

	start = parse_float(start);

	var end = parse_float($("#csv_custom_end").val());

	if(!looks_like_number(end)) {
		wrn(language[lang]["end_must_be_a_number"]);
		return;
	}

	end = parse_float(end);

	if(start > end) {
		var tmp = end;
		end = start;
		start = tmp;
	}

	if(start == end) {
		wrn(language[lang]["start_and_end_number_are_equal"]);
		return;
	}

	var stepsize = $("#csv_custom_stepsize").val();

	if(!looks_like_number(stepsize)) {
		wrn(language[lang]["stepsize_is_not_a_number"]);
		return;
	}

	stepsize = Math.abs(parse_float(stepsize));

	if(stepsize == "0") {
		wrn(language[lang]["stepsize_cannot_be_zero"]);
		return;
	}

	var fn = $("#csv_custom_fn").val();

	if(!fn.length) {
		wrn(language[lang]["function_is_too_short"]);
		return;
	}

	var str = fill_get_data_between(start, end, stepsize, fn);

	$("#csv_file").val(str).trigger("keyup");
}

function fill_get_data_between (start, end, stepsize, fn) {
	if(!looks_like_number(end)) {
		var err_msg = language[lang]["end_number_must_be_something_other_than_zero"];
		err(err_msg);
		$("#custom_function_error").html("" + err_msg).show();
		return "";	
	}

	if(!looks_like_number(start)) {
		var err_msg = language["start_number_must_be_something_other_than_zero"];
		err(err_msg);
		$("#custom_function_error").html("" + err_msg).show();
		return "";	
	}

	if(!looks_like_number(stepsize)) {
		var err_msg = language[lang]["stepsize_cannot_be_zero"];
		err(err_msg);
		$("#custom_function_error").html("" + err_msg).show();
		return "";	
	}

	if(stepsize == 0) {
		var err_msg = language[lang]["stepsize_cannot_be_zero"];
		err(err_msg);
		$("#custom_function_error").html("" + err_msg).show();
		return "";	
	}

	if(stepsize < 0) {
		stepsize = Math.abs(stepsize);
	}

	var lines = [["x", "y"]];

	if(!fn.includes("x")) {
		var err_msg = language[lang]["function_does_not_include_x"];
		err(err_msg);
		$("#custom_function_error").html("" + err_msg).show();
		return "";
	}

	if(fn.includes("y")) {
		lines[0].push("z");

		for (var x = start; x <= end; x += stepsize) {
			for (var y = start; y <= end; y += stepsize) {
				var result = isolateEval(`${fn}`);
				lines.push([x,  y, result]);
			}
		}
	} else {
		for (var x = start; x <= end; x += stepsize) {
			try {
				$("#custom_function_error").html("").hide();
				var result = eval(`${fn}`);
				lines.push([x, result]);
			} catch (e) {
				$("#custom_function_error").html("" + e).show();

				return "";
			}
		}
	}

	var str = "";

	for (var i = 0; i < lines.length; i++) {
		str += `${lines[i]}\n`;
	}

	return str;
}

// get_kernel_images not yet used
function get_kernel_images (layer_nr, all=0) {
	try {
		var _k = model.layers[layer_nr].kernel.val.shape;
		var transposed_kernel = tidy(() => { return array_sync(tf_transpose(model.layers[layer_nr].kernel.val, [3, 0, 1, 2])); });

		var kernel_size_x = _k[0];
		var kernel_size_y = _k[1];
		var channels_per_filter = _k[2];
		var filters = _k[3];

		if(all) {
			return transposed_kernel;
		}

		return transposed_kernel[0];
	} catch (e) {
		if(Object.keys(e).includes("message")) {
			e = e.message;
		}

		assert(false, e);
	}
}

function normalizeArray(array) {
	var min = Math.min(...array);
	var max = Math.max(...array);
	return array.map(value => ((value - min) / (max - min)) * 255);
}

function proper_layer_states_saved () {
	try {
		if(typeof(layer_states_saved) != "object") {
			dbg(`[proper_layer_states_saved] layer_states_saved is not an object`);
			return false;
		}

		if(!model) {
			dbg(`[proper_layer_states_saved] model is not defined`);
			return false;
		}

		var _keys = Object.keys(layer_states_saved);

		if(_keys.length == 0) {
			dbg(`[proper_layer_states_saved] _keys is empty`);
			return false;
		}

		var first_layer_flattened_input = flatten(layer_states_saved[0].input);

		var _min = Math.min(...first_layer_flattened_input);
		var _max = Math.max(...first_layer_flattened_input);

		if (_max == _min) {
			return false;
		}

		for (var i = 0; i < _keys.length; i++) {
			var _model_uuid = layer_states_saved[i]["model_uuid"];

			if(model.uuid != _model_uuid) {
				dbg(`[proper_layer_states_saved] model.uuid ${model.uuid} does not match _model_uuid ${_model_uuid}`);
				return false;
			}
		}

		return true;
	} catch (e) {
		dbg(e);
		return false;
	}
}

function _draw_flatten (layerId, ctx, meta_info, maxShapeSize, canvasHeight, layerX, layerY, _height) {
	try {
		if(meta_info["output_shape"]) {
			var this_layer_states = null;

			if(proper_layer_states_saved() && layer_states_saved && layer_states_saved[`${layerId}`]) {
				this_layer_states = layer_states_saved[`${layerId}`];
			}

			ctx.beginPath();
			var rectSize = maxShapeSize * 2;

			var layerY = canvasHeight / 2;

			var _width = rectSize;

			var _x = layerX - _width / 2;
			var _y = layerY - _height / 2;

			if(this_layer_states && get_shape_from_array(this_layer_states["output"]).length == 2) {
				// OK
			} else {
				this_layer_states = null;
			}

			if(this_layer_states) {
				var this_layer_output = this_layer_states["output"].flat();

				var normalizedValues = normalizeArray(this_layer_output);

				var numValues = normalizedValues.length;
				var lineHeight = _height / numValues;

				for (var i = 0; i < numValues; i++) {
					var colorValue = Math.abs(255 - Math.round(normalizedValues[i]));
					var _rgb = `rgb(${colorValue}, ${colorValue}, ${colorValue})`;
					ctx.fillStyle = _rgb;
					ctx.fillRect(_x, _y + i * lineHeight, _width, lineHeight);
				}

				ctx.strokeStyle = "black";
				ctx.lineWidth = 1;
				ctx.fill();
				ctx.stroke();
			} else {
				ctx.rect(_x, _y, _width, _height);
				ctx.fillStyle = "lightgray";

				ctx.strokeStyle = "black";
				ctx.lineWidth = 1;
				ctx.fill();
				ctx.stroke();
			}

			ctx.closePath();
		} else {
			alert("Has no output shape");
		}
	} catch (e) {
		if(Object.keys(e).includes("message")) {
			e = e.message;
		}

		assert(false, e);
	}

	return ctx;
}

function transformArrayWHD_DWH(inputArray) {
	var width = inputArray.length;
	var height = inputArray[0].length;
	var depth = inputArray[0][0].length;

	var newArray = [];
	for (var i = 0; i < depth; i++) {
		newArray[i] = [];
		for (var j = 0; j < width; j++) {
			newArray[i][j] = [];
			for (var k = 0; k < height; k++) {
				newArray[i][j][k] = inputArray[j][k][i];
			}
		}
	}

	return newArray;
}

var r_nr = 2;
var g_nr = 0;
var b_nr = 1;
var show_once = false;

function _draw_neurons_or_conv2d(layerId, numNeurons, ctx, verticalSpacing, layerY, shapeType, layerX, maxShapeSize, meta_info, maxSpacingConv2d, font_size) {
	var this_layer_states = null;
	var this_layer_output = null;

	assert(typeof(ctx) == "object", `ctx is not an object but ${typeof(ctx)}`);

	if(
		Object.keys(layer_states_saved).length &&
		Object.keys(layer_states_saved).includes("0") &&
		get_shape_from_array(layer_states_saved["0"]["input"]).length == 4 &&
		get_shape_from_array(layer_states_saved["0"]["input"])[3] == 3 &&
		layerId == 0
	) {
		var first_layer_input = layer_states_saved["0"]["input"][0];

		var n = first_layer_input.length;
		var m = first_layer_input[0].length;

		var flattened = flatten(first_layer_input);

		var minVal = Math.max(...flattened);
		var maxVal = Math.min(...flattened);

		if(maxVal != minVal) {
			var scale = 255 / (maxVal - minVal);

			var imageData = ctx.createImageData(m, n);

			for (var x = 0; x < n; x++) {
				for (var y = 0; y < m; y++) {
					var value = Math.floor((first_layer_input[x][y] - minVal) * scale);
					var index = (x * m + y) * 4;

					var _r = Math.abs(255 - parse_int((first_layer_input[x][y][0] - minVal) * scale));
					var _g = Math.abs(255 - parse_int((first_layer_input[x][y][1] - minVal) * scale));
					var _b = Math.abs(255 - parse_int((first_layer_input[x][y][2] - minVal) * scale));

					if(show_once) {
						void(0); log(`rgb: ${_r}, ${_g}, ${_b}, min/maxVal: ${minVal}/${maxVal}, scale: ${scale}, first_layer_input[${x}][${y}][0]`, first_layer_input[x][y][0]);
						show_once = false;
					}

					imageData.data[index + 0] = _r;
					imageData.data[index + 1] = _g;
					imageData.data[index + 2] = _b;
					imageData.data[index + 3] = 255;
				}
			}

			var _first_image_x = 10;
			var _first_image_y = font_size + 10;

			ctx.putImageData(imageData, _first_image_x, _first_image_y, 0, 0, n, m);

			ctx.font = font_size + "px Arial";
			if(is_dark_mode) {
				ctx.fillStyle = "white";
			} else {
				ctx.fillStyle = "black";
			}
			ctx.textAlign = "left";
			ctx.fillText("Input image:", 10, 10);
			ctx.closePath();
		}
	}

	for (var j = 0; j < numNeurons; j++) {
		ctx.beginPath();
		var neuronY = (j - (numNeurons - 1) / 2) * verticalSpacing + layerY;
		ctx.beginPath();

		if (shapeType === "circle") {
			if(proper_layer_states_saved() && layer_states_saved && layer_states_saved[`${layerId}`]) {
				this_layer_states = layer_states_saved[`${layerId}`]["output"][0];

				if (get_shape_from_array(this_layer_states).length == 1) {
					this_layer_output = this_layer_states;
				} else {
					this_layer_output = flatten(this_layer_states);
				}
			}

			var availableSpace = verticalSpacing / 2 - 2;

			var radius = Math.min(maxShapeSize, availableSpace);
			if(radius >= 0) {
				if(this_layer_output) {
					var minVal = Math.min(...this_layer_output);
					var maxVal = Math.max(...this_layer_output);

					var value = this_layer_output[j];
					var normalizedValue = Math.floor(((value - minVal) / (maxVal - minVal)) * 255);

					ctx.fillStyle = `rgb(${normalizedValue}, ${normalizedValue}, ${normalizedValue})`;

					// Adjust the radius based on available vertical space
					ctx.arc(layerX, neuronY, radius, 0, 2 * Math.PI);
				} else {
					ctx.arc(layerX, neuronY, radius, 0, 2 * Math.PI);
					ctx.fillStyle = "white";
				}
			} else {
				log_once("Found negative radius!");

				return ctx;
			}

			ctx.strokeStyle = "black";
			ctx.lineWidth = 1;
			ctx.fill();
			ctx.stroke();
			ctx.closePath();

			if(layerId == model.layers.length - 1 && get_last_layer_activation_function() == "softmax") {
				if(labels && Array.isArray(labels) && labels.length && Object.keys(labels).includes(`${j}`) && numNeurons == labels.length) {
					ctx.beginPath();
					var canvasWidth = Math.max(800, $("#graphs_here").width());

					ctx.font = font_size + "px Arial";
					if(is_dark_mode) {
						ctx.fillStyle = "white";
					} else {
						ctx.fillStyle = "black";
					}
					ctx.textAlign = "left";
					ctx.fillText(labels[j], layerX + 30, neuronY + (font_size / 2));
					ctx.closePath();
				}
			}
		} else if (shapeType === "rectangle_conv2d") {
			var _x = 0;
			var _y = 0;

			neuronY = (j - (numNeurons - 1) / 2) * maxSpacingConv2d + layerY;

			if (proper_layer_states_saved() && layer_states_saved && layer_states_saved[`${layerId}`]) {
				this_layer_states = layer_states_saved[`${layerId}`]["output"];

				if (get_shape_from_array(this_layer_states).length == 4) {
					this_layer_output = transformArrayWHD_DWH(this_layer_states[0]);
					this_layer_output = this_layer_output[j];
				}
			}

			if (this_layer_output) {
				var n = this_layer_output.length;
				var m = this_layer_output[0].length;
				var minVal = Infinity;
				var maxVal = -Infinity;

				for (var x = 0; x < n; x++) {
					for (var y = 0; y < m; y++) {
						var value = this_layer_output[x][y];
						if (value < minVal) minVal = value;
						if (value > maxVal) maxVal = value;
					}
				}

				var scale = 255 / (maxVal - minVal);
				var imageData = ctx.createImageData(m, n);
				for (var x = 0; x < n; x++) {
					for (var y = 0; y < m; y++) {
						var value = Math.floor((this_layer_output[x][y] - minVal) * scale);
						var index = (x * m + y) * 4;
						imageData.data[index] = Math.abs(255 - value);
						imageData.data[index + 1] = Math.abs(255 - value);
						imageData.data[index + 2] = Math.abs(255 - value);
						imageData.data[index + 3] = 255;
					}
				}

				var _ww = meta_info["input_shape"][1];
				var _hh = meta_info["input_shape"][2];

				_x = layerX - _ww / 2;
				_y = neuronY - _hh / 2;
				ctx.putImageData(imageData, _x, _y, 0, 0, _ww, _hh);

			} else {
				var _ww = Math.min(meta_info["kernel_size_x"] * 3, verticalSpacing - 2);
				var _hh = Math.min(meta_info["kernel_size_y"] * 3, verticalSpacing - 2);

				_x = layerX - _ww / 2;
				_y = neuronY - _hh / 2;

				ctx.rect(_x, _y, _ww, _hh);
				ctx.fillStyle = "#c2e3ed";
				ctx.fill();

				ctx.closePath();
			}
		}
	}

	return ctx;
}

async function draw_fcnn(...args) {
	assert(args.length == 3, "draw_fcnn must have 3 arguments");

	var args_hash = await md5(JSON.stringify(args));

	if(last_fcnn_hash == args_hash) {
		return;
	}

	args_hash = last_fcnn_hash;

	var layers = args[0];
	var _labels = args[1];
	var meta_infos = args[2];

	var canvas = document.getElementById("fcnn_canvas");

	if (!canvas) {
		canvas = document.createElement("canvas");
		canvas.id = "fcnn_canvas";
		document.body.appendChild(canvas);
	}

	var ctx = canvas.getContext("2d");

	// Set canvas dimensions and background
	var canvasWidth = Math.max(800, $("#graphs_here").width());
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

	var max_conv2d_height = 0;
	
	meta_infos.forEach(function (i, e) {
		if(i.layer_type == "Conv2D") {
			var os = i.output_shape;
			var height = os[1];
			var width = os[2];
			//log(`width: ${width}, height: ${height}`)
			
			if (height > max_conv2d_height) {
				max_conv2d_height = height;
			}
		}
	});

	var maxSpacingConv2d = maxSpacing + max_conv2d_height;

	var font_size = Math.max(12, Math.min(6, (canvasWidth / (layers.length * 24))));

	_draw_layers_text(layers, meta_infos, ctx, canvasHeight, canvasWidth, layerSpacing, font_size);

	await _draw_neurons_and_connections(ctx, layers, meta_infos, layerSpacing, canvasHeight, maxSpacing, maxShapeSize, maxRadius, maxSpacingConv2d, font_size);
}

async function _draw_neurons_and_connections (ctx, layers, meta_infos, layerSpacing, canvasHeight, maxSpacing, maxShapeSize, maxRadius, maxSpacingConv2d, font_size) {
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
			ctx = _draw_neurons_or_conv2d(i, numNeurons, ctx, verticalSpacing, layerY, shapeType, layerX, maxShapeSize, meta_info, maxSpacingConv2d, font_size);
		} else if (shapeType == "rectangle_flatten") {
			_height = Math.min(650, meta_info["output_shape"][1]);
			ctx = _draw_flatten(i, ctx, meta_info, maxShapeSize, canvasHeight, layerX, layerY, _height);
		} else {
			alert("Unknown shape Type: " + shapeType);
		}

		try {
			fcnn_initial_canvas_state = ctx.getImageData(0, 0, ctx.canvas.width, ctx.canvas.height);
		} catch (e) {
			log(e);
			log(`width: ${ctx.canvas.width}, height: ${ctx.canvas.height}`);
		}

		if (started_training) {
			await _draw_connections_between_layers(ctx, layers, layerSpacing, meta_infos, maxSpacing, canvasHeight, layerY, layerX, maxRadius, _height);
		} else {
			_draw_connections_between_layers(ctx, layers, layerSpacing, meta_infos, maxSpacing, canvasHeight, layerY, layerX, maxRadius, _height);
		}
	}

	_draw_connections_between_layers(ctx, layers, layerSpacing, meta_infos, maxSpacing, canvasHeight, layerY, layerX, maxRadius, _height, maxSpacingConv2d);
}

function get_weight_differences (oldWeights, newWeights) {
	assert(Array.isArray(oldWeights), "oldWeights is not an array");
	assert(Array.isArray(newWeights), "newWeights is not an array");

	var weightDifferences = [];

	if (
		oldWeights.length != newWeights.length ||
		JSON.stringify(get_shape_from_array(oldWeights)) != JSON.stringify(get_shape_from_array(newWeights))
	) {
		return null;
	}

	for (let layer_idx = 0; layer_idx < oldWeights.length; layer_idx++) {
		const layerDiff = [];
		for (let neuron_idx = 0; neuron_idx < oldWeights[layer_idx].length; neuron_idx++) {
			const oldNeuronWeights = oldWeights[layer_idx][neuron_idx];
			const newNeuronWeights = newWeights[layer_idx][neuron_idx];

			if (Array.isArray(oldNeuronWeights) && Array.isArray(newNeuronWeights)) {
				const neuronDiff = [];
				for (let weight_idx = 0; weight_idx < oldNeuronWeights.length; weight_idx++) {
					const diff = newNeuronWeights[weight_idx] - oldNeuronWeights[weight_idx];
					neuronDiff.push(diff);
				}
				layerDiff.push(neuronDiff);
			} else {
				const diff = newNeuronWeights - oldNeuronWeights;
				layerDiff.push(diff);
			}
		}
		weightDifferences.push(layerDiff);
	}

	return weightDifferences;
}

function _normalize(value, min, max) {
	return (value - min) / (max - min);
}

function _draw_connections_between_layers(ctx, layers, layerSpacing, meta_infos, maxSpacing, canvasHeight, layerY, layerX, maxRadius, _height, maxSpacingConv2d) {
	try {
		// Draw connections
		for (var layer_nr = 0; layer_nr < layers.length - 1; layer_nr++) {
			var meta_info = meta_infos[layer_nr];

			var layer_type = meta_info["layer_type"];
			var layer_input_shape = meta_info["input_shape"];
			var layer_output_shape = meta_info["output_shape"];

			var currentLayerX = (layer_nr + 1) * layerSpacing;
			var nextLayerX = (layer_nr + 2) * layerSpacing;
			var currentLayerNeurons = layers[layer_nr];
			var nextLayerNeurons = layers[layer_nr + 1];

			var next_layer_type = null;
			var next_layer_input_shape = null;
			var next_layer_output_shape = null;

			var last_layer_type = null;
			var last_layer_input_shape = null;
			var last_layer_output_shape = null;

			if((layer_nr + 1) in meta_infos) {
				var next_meta_info = meta_infos[layer_nr + 1];
				next_layer_type = next_meta_info["layer_type"];
				next_layer_input_shape = next_meta_info["input_shape"];
				next_layer_output_shape = next_meta_info["output_shape"];
			}

			if(layer_nr > 0) {
				var last_meta_info = meta_infos[layer_nr - 1];
				last_layer_type = last_meta_info["layer_type"];
				last_layer_input_shape = last_meta_info["input_shape"];
				last_layer_output_shape = last_meta_info["output_shape"];
			}

			if(layer_type == "Flatten" || layer_type == "MaxPooling2D") {
				currentLayerNeurons = layer_input_shape[layer_input_shape.length - 1];
			}

			if(next_layer_type == "Flatten" || layer_type == "MaxPooling2D") {
				nextLayerNeurons = Math.min(64, next_layer_output_shape[next_layer_output_shape.length - 1]);
			}

			var currentSpacing = Math.min(layer_type == "Conv2D" ? maxSpacingConv2d : maxSpacing, (canvasHeight / currentLayerNeurons) * 0.8);
			var nextSpacing = Math.min(next_layer_type == "Conv2D" ? maxSpacingConv2d : maxSpacing, (canvasHeight / nextLayerNeurons) * 0.8);

			var line_color = "gray";
			var line_tickness = 1;

			for (var neuron_nr = 0; neuron_nr < currentLayerNeurons; neuron_nr++) {
				var currentNeuronY = (neuron_nr - (currentLayerNeurons - 1) / 2) * currentSpacing + layerY;

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
					ctx.strokeStyle = line_color;
					ctx.lineWidth = line_tickness;
					ctx.stroke();
				}
			}
		}
	} catch (e) {
		if(Object.keys(e).includes("message")) {
			e = e.message;
		}

		assert(false, e);
	}
}

function _draw_layers_text (layers, meta_infos, ctx, canvasHeight, canvasWidth, layerSpacing, _labels, font_size) {
	try {
		for (var i = 0; i < layers.length; i++) {
			if (_labels && _labels[i]) {
				ctx.beginPath();
				ctx.font = font_size + "px Arial";
				if(is_dark_mode) {
					ctx.fillStyle = "white";
				} else {
					ctx.fillStyle = "black";
				}
				ctx.textAlign = "center";
				ctx.fillText(_labels[i], (i + 1) * layerSpacing, canvasHeight - (2*24) - 5);
				ctx.closePath();
			}

			if (meta_infos && meta_infos[i]) {
				ctx.beginPath();
				var meta_info = meta_infos[i];

				var _is = meta_info.input_shape;
				var _os = meta_info.output_shape;

				ctx.font = font_size + "px Arial";
				if(is_dark_mode) {
					ctx.fillStyle = "white";
				} else {
					ctx.fillStyle = "black";
				}
				ctx.textAlign = "center";
				if(_is) {
					ctx.fillText("Input:  [" + _is.filter(n => n).join(", ") + "]", (i + 1) * layerSpacing, canvasHeight - (24) - 5);
				}
				if(_os) {
					ctx.fillText("Output: [" + _os.filter(n => n).join(", ") + "]", (i + 1) * layerSpacing, canvasHeight - 5);
				}
				ctx.closePath();
			}
		}
	} catch (e) {
		if(Object.keys(e).includes("message")) {
			e = e.message;
		}

		assert(false, e);
	}
}

function get_fcnn_data () {
	var names = [];
	var units = [];
	var meta_infos = [];

	if(!model) {
		wrn("[get_fcnn_data] Model not found for restart_fcnn");
		return;
	}

	if(!Object.keys(model).includes("layers")) {
		wrn("[get_fcnn_data] model.layers not found for restart_fcnn");
		return;
	}

	if(model.layers.length == 0) {
		wrn("[get_fcnn_data] model.layers.length is 0");
		return;
	}

	var start_layer = 0;

	for (var i = 0; i < model.layers.length; i++) {
		var class_name = model.layers[i].getClassName();
		if(!["Dense", "Flatten", "Conv2D"].includes(class_name)) {
			continue;
		}

		var _unit = get_units_at_layer(i);
		if(i == 0) {
			names.push("Input Layer");
		} else if (i == model.layers.length - 1) {
			names.push("Output Layer");
		} else {
			names.push(`${class_name} ${i}`);
		}

		units.push(_unit);

		var output_shape_of_layer = "";
		try {
			output_shape_of_layer = model.layers[i].outputShape;
		} catch (e) {

		}

		var kernel_size_x = $($(".configtable")[i]).find(".kernel_size_x").val();
		var kernel_size_y = $($(".configtable")[i]).find(".kernel_size_y").val();
		
		var input_shape_of_layer = "";
		try {
			input_shape_of_layer = model.layers[i].input.shape;
		} catch(e) {

		}

		meta_infos.push({
			layer_type: class_name,
			nr: start_layer + i,
			input_shape: input_shape_of_layer,
			output_shape: output_shape_of_layer,
			kernel_size_x: kernel_size_x,
			kernel_size_y: kernel_size_y
		});
	}

	return [names, units, meta_infos];
}

async function restart_fcnn () {
	if(is_running_test || currently_running_change_data_origin) {
		return;
	}

	if(!$("#fcnn_canvas").is(":visible")) {
		return;
	}

	var fcnn_data = get_fcnn_data();

	var right_side_width = $("#right_side").width();

	if(!fcnn_data) {
		wrn(language[lang]["could_not_get_fcnn_data"]);
		return;
	}

	var cache_key = await md5(JSON.stringify({
		"right_side_width": right_side_width,
		"fcnn_data": fcnn_data,
		"weights": get_weights_as_string()
	}));

	if(last_fcnn_data_hash == cache_key) {
		return;
	}

	last_fcnn_data_hash = cache_key;

	var [names, units, meta_infos] = fcnn_data;

	await draw_fcnn(units, names, meta_infos);
}

async function download_model_and_weights_and_labels () {
	await wait_for_updated_page(3);
	save_model();
	await download_labels_json();
	await download_weights_json();
	if($("#data_origin").val() == "image") {
		await create_and_download_zip();
	}
}

async function read_zip_to_category (content) {
	var new_zip = new JSZip();
	var zip_content = await new_zip.loadAsync(content);
	var uploaded_images_to_categories = {};

	try {
		const promises = [];

		new_zip.forEach((relPath, file) => {
			var promise = (async () => {
				var category = relPath.replace(/\/.*/, "");
				var filename = relPath.replace(/.*\//, "");

				var file_contents_base64 = await file.async("base64");

				if (!Object.keys(uploaded_images_to_categories).includes(category)) {
					uploaded_images_to_categories[category] = [];
				}

				uploaded_images_to_categories[category].push(file_contents_base64);
			})();

			promises.push(promise);
		});

		// Await all promises to complete
		await Promise.all(promises);
	} catch (e) {
		if(Object.keys(e).includes("message")) {
			e = e.message;
		}

		assert(false, e);
	}

	return uploaded_images_to_categories;
}

async function click_on_new_category_or_delete_category_until_number_is_right (number_of_categories) {
	while ($(".delete_category_button").length != number_of_categories) {
		if($(".delete_category_button").length > number_of_categories) {
			while ($(".delete_category_button").length != 1) {
				var $last_delete_button = $(".delete_category_button")[$(".delete_category_button").length - 1];

				$last_delete_button.click();

				await delay(1000);
			}
		} else {
			await add_new_category();
		}
	}
}

async function read_zip (content) {
	try {
		var old_labels = labels;
		var old_labels_string = JSON.stringify(old_labels);

		if(!content) {
			err(language[lang]["no_content"]);
			return;
		}

		var uploaded_images_to_categories = await read_zip_to_category(content);

		if(Object.keys(uploaded_images_to_categories).length == 0) {
			err(language[lang]["could_not_upload_images_zip_seemed_to_be_empty"]);
			return;
		}

		dbg(language[lang]["upload_done_results_available_in_uploaded_images_to_category"]);

		$("#data_origin").val("image");
		await delay(200);
		await change_data_origin(1);
		await delay(200);

		var new_labels = Object.keys(uploaded_images_to_categories);
		var number_of_categories = new_labels.length;

		if(!number_of_categories) {
			err(language[lang]["no_new_labels_given"]);
			return;
		}

		await click_on_new_category_or_delete_category_until_number_is_right(number_of_categories);

		void(0); log("number_of_categories:", number_of_categories);

		await wait_for_updated_page(1)

		await set_labels(new_labels);

		for (var li = 0; li < number_of_categories; li++) {
			var this_label = new_labels[li];
			
			var this_category_id = labels.indexOf(this_label);

			if(this_category_id == -1) {
				err(`this_category_id could not be determined for ${this_label}, labels are: ${labels.join(", ")}, old_labels are: ${old_labels_string}`);
			} else {
				$($(".own_image_label")[this_category_id]).val(this_label);

				void(0); log(`Label: ${this_label}`);

				for (var ii = 0; ii < uploaded_images_to_categories[this_label].length; ii++) {
					var _image = uploaded_images_to_categories[this_label][ii];
					if(_image) {
						_image = "data:image/png;base64," + _image;

						//void(0); log("add_image_to_category", _image, this_category_id);
						add_image_to_category(_image, this_category_id);
					}
				}
			}
		}
	} catch (e) {
		if(Object.keys(e).includes("message")) {
			e = e.message;
		}

		assert(false, e);
	}
}

function create_overview_table_for_custom_image_categories () {
	if($("#data_origin").val() != "image") {
		wrn(language[lang]["create_overview_table_for_custom_image_categories_can_only_be_called_with_custom_images"]);
		return;
	}

	var $own_image_label = $(".own_image_label");

	var data_struct = [];

	for (var i = 0; i < $own_image_label.length; i++) {
		var name = $($own_image_label[i]).val();

		var position = $($own_image_label[i]).offset();
		var _id = $own_image_label[i].id;

		var _top = position.top;

		var this_data_struct = {
			name: name,
			top: _top,
			id: _id
		};

		data_struct.push(this_data_struct);
	}

	console.log(data_struct);

	var toc = "";

	for (var i = 0; i < data_struct.length; i++) {
		var this_tr = "<tr><td>";

		var name = data_struct[i]["name"];
		var _id = data_struct[i]["id"];

		this_tr += `<a href='#${_id}_link'>${name}</a>`;

		this_tr += "</td></tr>";

		toc += this_tr;
	}

	if (toc) {
		toc = "<table>" + toc + "</table>";
	}

	return toc;
}

function add_overview_table_to_images_tab () {
	var table = create_overview_table_for_custom_image_categories();

	if(!table) {
		return;
	}

	if($("#overview_table_custom_imgs").length) {
		$("#overview_table_custom_imgs").html(table);
	} else {

		table = "<div id='overview_table_custom_imgs'>" + table + "</div>";

		var $own_images_tab = $("#own_images_tab");

		$own_images_tab.append(table);
	}

}

function setOptimizerTooltips() {
	const lang = window.lang; // 'de' or 'en'
	const optimizerInfos = optimizer_infos_json;

	// Set tooltips for each optimizer
	optimizerInfos.forEach(function(optimizer) {
		const optimizerName = optimizer.optimizer;
		const infoText = optimizer.info[lang];
		const variables = optimizer.variable_info;

		// Tooltip for optimizer select option
		$(`#${optimizerName}_metadata .TRANSLATEME_optimizer`).attr('title', infoText);

		// Iterate through each variable and set tooltips
		Object.keys(variables).forEach(function(variableName) {
			const tooltipText = variables[variableName][lang];
			$(`#${optimizerName}_metadata .TRANSLATEME_${variableName}`).attr('title', tooltipText);
		});
	});
}

async function saveModelAsSingleZip() {
	const modelArtifacts = await model.save({
		async save(artifacts) {
			try {
				const modelJson = {
					modelTopology: artifacts.modelTopology,
					format: artifacts.format,
					generatedBy: artifacts.generatedBy,
					convertedBy: artifacts.convertedBy || null,
					weightsManifest: [{
						paths: ["model.weights.bin"],
						weights: artifacts.weightSpecs
					}]
				};

				const files = [
					{
						name: "model.json",
						data: new TextEncoder().encode(JSON.stringify(modelJson, null, 2)),
					},
					{
						name: "model.weights.bin",
						data: new Uint8Array(artifacts.weightData),
					}
				];

				const zipBlob = createSimpleZip(files);
				const url = URL.createObjectURL(zipBlob);

				const a = document.createElement("a");
				a.href = url;
				a.download = "model.zip";
				document.body.appendChild(a);
				a.click();
				a.remove();
				URL.revokeObjectURL(url);

				return {
					modelArtifactsInfo: {
						dateSaved: new Date(),
						modelTopologyType: "JSON",
						modelTopologyBytes: files[0].data.length,
						weightDataBytes: files[1].data.length
					}
				};
			} catch (err) {
				err("Error at saving:", err);
				throw err;
			}
		}
	});
}

function createSimpleZip(files) {
    const chunks = [];
    const centralDirectory = [];
    let offset = 0;

    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const fileNameBytes = new TextEncoder().encode(file.name);
        const data = file.data;
        const crc32 = computeCRC32(data);

        const localHeader = new Uint8Array(30 + fileNameBytes.length);
        localHeader.set([0x50, 0x4B, 0x03, 0x04], 0);           // Local file header signature
        localHeader.set([0x14, 0x00], 4);                       // Version needed to extract
        localHeader.set([0x00, 0x00], 6);                       // General purpose bit flag
        localHeader.set([0x00, 0x00], 8);                       // Compression method: 0 = store
        localHeader.set([0x00, 0x00, 0x00, 0x00], 10);          // File time/date (optional)
        localHeader.set(uint32le(crc32), 14);                  // CRC-32
        localHeader.set(uint32le(data.length), 18);            // Compressed size
        localHeader.set(uint32le(data.length), 22);            // Uncompressed size
        localHeader.set(uint16le(fileNameBytes.length), 26);   // File name length
        localHeader.set([0x00, 0x00], 28);                      // Extra field length
        localHeader.set(fileNameBytes, 30);                    // File name

        chunks.push(localHeader, data);

        const centralHeader = new Uint8Array(46 + fileNameBytes.length);
        centralHeader.set([0x50, 0x4B, 0x01, 0x02], 0);         // Central dir signature
        centralHeader.set([0x14, 0x00, 0x14, 0x00], 4);         // Version made by / needed
        centralHeader.set([0x00, 0x00], 8);                     // General purpose bit flag
        centralHeader.set([0x00, 0x00], 10);                    // Compression
        centralHeader.set([0x00, 0x00, 0x00, 0x00], 12);        // File time/date
        centralHeader.set(uint32le(crc32), 16);                // CRC
        centralHeader.set(uint32le(data.length), 20);          // Compressed size
        centralHeader.set(uint32le(data.length), 24);          // Uncompressed size
        centralHeader.set(uint16le(fileNameBytes.length), 28); // File name length
        centralHeader.set([0x00, 0x00], 30);                    // Extra field length
        centralHeader.set([0x00, 0x00], 32);                    // File comment length
        centralHeader.set([0x00, 0x00], 34);                    // Disk number start
        centralHeader.set([0x00, 0x00], 36);                    // Internal file attributes
        centralHeader.set([0x00, 0x00, 0x00, 0x00], 38);        // External file attributes
        centralHeader.set(uint32le(offset), 42);                // Offset of local header
        centralHeader.set(fileNameBytes, 46);                  // File name

        offset += localHeader.length + data.length;
        centralDirectory.push(centralHeader);
    }

    const centralDirStart = offset;
    for (let i = 0; i < centralDirectory.length; i++) {
        chunks.push(centralDirectory[i]);
        offset += centralDirectory[i].length;
    }

    const endRecord = new Uint8Array(22);
    endRecord.set([0x50, 0x4B, 0x05, 0x06], 0);               // EOCD signature
    endRecord.set([0x00, 0x00], 4);                           // Disk number
    endRecord.set([0x00, 0x00], 6);                           // Disk where central dir starts
    endRecord.set(uint16le(files.length), 8);                // Number of entries on disk
    endRecord.set(uint16le(files.length), 10);               // Total number of entries
    endRecord.set(uint32le(offset - centralDirStart), 12);   // Size of central directory
    endRecord.set(uint32le(centralDirStart), 16);            // Offset of start of central dir
    endRecord.set([0x00, 0x00], 20);                          // Comment length

    chunks.push(endRecord);

    return new Blob(chunks, { type: "application/zip" });
}

function uint16le(n) {
    return [n & 0xff, (n >> 8) & 0xff];
}

function uint32le(n) {
    return [n & 0xff, (n >> 8) & 0xff, (n >> 16) & 0xff, (n >> 24) & 0xff];
}

function computeCRC32(data) {
    let crc = 0xffffffff;
    for (let i = 0; i < data.length; i++) {
        crc = (crc >>> 8) ^ CRC32_TABLE[(crc ^ data[i]) & 0xff];
    }
    return (crc ^ 0xffffffff) >>> 0;
}

var CRC32_TABLE = (function () {
    const table = new Uint32Array(256);
    for (let i = 0; i < 256; i++) {
        let c = i;
        for (let j = 0; j < 8; j++) {
            c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
        }
        table[i] = c >>> 0;
    }
    return table;
})();
