"use strict";

// ─────────────────────────────────────────────────────────────────────────────
// Configuration: which options are considered "basic" (shown by default)
// Everything else is hidden behind an "Advanced" toggle.
// ─────────────────────────────────────────────────────────────────────────────

const BASIC_OPTIONS = new Set([
	"activation",
	"units",
	"filters",
	"kernel_size",
	"pool_size",
	"dropout_rate",
	"visualize",
	"rate",
	"input_dim",
	"output_dim"
]);

function is_basic_option(item) {
	return BASIC_OPTIONS.has(item);
}

// ─────────────────────────────────────────────────────────────────────────────
// build_layer_options_html
// ─────────────────────────────────────────────────────────────────────────────

function build_layer_options_html(values, str, type, nr) {
	if (!values["options"]) {
		err("[build_layer_options_html] No options defined for layer type '" + type + "'");
		return str;
	}

	var options = values["options"];
	var basic_str = "";
	var advanced_str = "";

	for (var j = 0; j < options.length; j++) {
		var item = options[j];
		var option_html = build_single_option_html(item, type, nr);

		if (is_basic_option(item)) {
			basic_str += option_html;
		} else {
			advanced_str += option_html;
		}
	}

	advanced_str += build_skip_connection_html(type, nr);

	str += basic_str;
	str += build_advanced_section(advanced_str, nr);

	return str;
}

// ─────────────────────────────────────────────────────────────────────────────
// _update_bias_initializer_visibility
// FIXED: Uses the new show_or_hide_bias_initializer that respects advanced state
// ─────────────────────────────────────────────────────────────────────────────

function _update_bias_initializer_visibility() {
	var number_of_layers = get_number_of_layers();
	show_or_hide_bias_initializer(number_of_layers);
}

// ─────────────────────────────────────────────────────────────────────────────
// build_single_option_html
// Renders a single layer option row (activation, initializer, or eval-based)
// ─────────────────────────────────────────────────────────────────────────────

function build_single_option_html(item, type, nr) {
	var html = "";

	if (item == "activation") {
		html = get_tr_str_for_layer_table("<span class='TRANSLATEME_activation_function'></span>", "activation", "select", activations, nr, "", 0, 0);
	} else if (is_known_initializer_option(item)) {
		html = build_initializer_option_html(item, nr);
	} else {
		html = build_eval_option_html(item, type, nr);
	}

	return html;
}

// ─────────────────────────────────────────────────────────────────────────────
// is_known_initializer_option
// Checks if an option name matches one of the known initializer patterns
// ─────────────────────────────────────────────────────────────────────────────

const KNOWN_INITIALIZER_OPTIONS = [
	"kernel_initializer",
	"bias_initializer",
	"beta_initializer",
	"depthwise_initializer",
	"pointwise_initializer",
	"gamma_initializer"
];

function is_known_initializer_option(item) {
	return KNOWN_INITIALIZER_OPTIONS.includes(item);
}

// ─────────────────────────────────────────────────────────────────────────────
// build_initializer_option_html
// Renders a select row for a known initializer option
// ─────────────────────────────────────────────────────────────────────────────

function build_initializer_option_html(item, nr) {
	var translate_key = "<span class='TRANSLATEME_" + item + "'></span>";
	return get_tr_str_for_layer_table(translate_key, item, "select", initializers, nr, "", 0, 0);
}

// ─────────────────────────────────────────────────────────────────────────────
// build_eval_option_html
// Renders a custom option by calling its add_*_option function
// Falls back gracefully if the function doesn't exist
// ─────────────────────────────────────────────────────────────────────────────

function build_eval_option_html(item, type, nr) {
	var func_name = "add_" + item + "_option";

	if (typeof window[func_name] === "function") {
		return window[func_name](type, nr);
	}

	err("[build_layer_options_html] No function '" + func_name + "' found for option '" + item + "' (type: '" + type + "')");
	return "";
}


// ─────────────────────────────────────────────────────────────────────────────
// build_skip_connection_html
// Appends skip connection option if applicable
// ─────────────────────────────────────────────────────────────────────────────

function build_skip_connection_html(type, nr) {
	if (skip_connection_excluded_types.includes(type)) {
		return "";
	}
	return add_skip_connection_option(type, nr);
}

// ─────────────────────────────────────────────────────────────────────────────
// collapse_advanced_section
// Animates the advanced section closed and rotates the arrow icon
// ─────────────────────────────────────────────────────────────────────────────

function collapse_advanced_section($section, $icon) {
	$section.slideUp(200);
	$icon.html("&#9654;"); // ▶ right arrow (collapsed)
}

// ─────────────────────────────────────────────────────────────────────────────
// expand_advanced_section
// Animates the advanced section open and rotates the arrow icon
// ─────────────────────────────────────────────────────────────────────────────

function expand_advanced_section($section, $icon) {
	$section.slideDown(200);
	$icon.html("&#9660;"); // ▼ down arrow (expanded)
}

// ─────────────────────────────────────────────────────────────────────────────
// get_tr_str_for_layer_table (updated)
// Now uses expert_mode_only to also add the option to the advanced section
// when rendered outside of build_layer_options_html context
// ─────────────────────────────────────────────────────────────────────────────

function get_tr_str_for_layer_table(desc, classname, type, data, nr, tr_class, hidden, expert_mode_only = 0) {
	assert(typeof(classname) == "string", "classname is not a string");
	assert(typeof(data) == "object", "data is not an object");
	assert(typeof(nr) == "number", "nr is not a number");
	assert(typeof(tr_class) == "string" || tr_class === undefined || tr_class === null, "tr_class is not a string");

	var new_uuid = uuidv4();

	var str = "<tr";
	if (tr_class) {
		str += " class='" + tr_class + "'";
	}
	if (hidden) {
		str += " style='display: none' ";
	}
	str += ">";

	str += "<td>" + desc + ":</td>";
	str += "<td>";
	str += build_input_element(type, classname, new_uuid, data, nr);
	str += "</td>";

	return str;
}

// ─────────────────────────────────────────────────────────────────────────────
// build_input_element
// Dispatches to the correct input creator based on type
// ─────────────────────────────────────────────────────────────────────────────

function build_input_element(type, classname, new_uuid, data, nr) {
	if (type == "select") {
		return create_select_for_layer_panel_str(classname, new_uuid, data);
	} else if (type == "text") {
		return create_text_for_layer_panel_str(classname, data, nr);
	} else if (type == "number") {
		return create_number_input_for_layer_panel_str(classname, new_uuid, data);
	} else if (type == "checkbox") {
		return create_checkbox_for_layer_panel_str(classname, new_uuid, data);
	}

	err("[build_input_element] Invalid table type: " + type);
	return "";
}

async function show_layers(number) {
	assert(typeof(number) == "number", "show_layer(" + number + ") is not a number but " + typeof(number));

	var layers_container = $("#layers_container");

	var layers_container_str = "";
	var layer_visualizations_tab_str = get_layer_visualization_tab_str();

	var remove = "<button class='add_remove_layer_button remove_layer' disabled='' onclick='remove_layer(this)'>-</button>&thinsp;";
	var add = "<button class='add_remove_layer_button add_layer' onclick='add_layer(this)'>+</button>&nbsp;";

	for (var layer_idx = 0; layer_idx < number; layer_idx++) {
		layers_container_str +=
			"<li class='ui-sortable-handle'><span class='layer_start_marker'></span><div class='container layer layer_setting glass_box'>" +
			"<div style='display:none' class='warning_container'><span style='color: yellow'>&#9888;</span><span class='warning_layer'></span></div>" +
				remove +
				add +
				"<span class='layer_nr_desc'></span>" +
				"<span class='layer_identifier'></span>" +
				"<table class='configtable'>" +
					option_for_layer(layer_idx) +
				"</table>" +
				"</div>" +
			"<span class='layer_end_marker'></span>" +
			"</li>"
		;

		layer_visualizations_tab_str += "<div class='layer_data'></div>";
	}

	layers_container[0].innerHTML = layers_container_str;

	for (let layer_idx = 0; layer_idx < number; layer_idx++) {
		await initializer_layer_options(layer_idx);
	}

	show_layer_visualization_tab(layer_visualizations_tab_str);

	sortable_layers_container(layers_container);

	$(".train_neural_network_button").show();
	$(".retrain_neural_network_button").show();
}

function option_for_layer(nr) {
	assert(typeof(nr) == "number", "option_for_layer(" + nr + ") is not a number but " + typeof(number));

	var this_event = "initializer_layer_options(this)";

	var option_for_layer_id = `option_for_layer_${uuidv4()}_${nr}_${option_for_layer_counter++}`;

	var str = "";
	str += "<tr>";
	str += "<td style='width: 110%;'>";
	str += "<button style='cursor: pointer' class='left_border_radius show_data layer_options_button' onclick='toggle_layer_options(this)'><img src='_gui/icons/settings.svg' class='icon_small' />&nbsp;<span class='TRANSLATEME_settings'></span></button>";
	str += "<button style='cursor: pointer' class='right_border_radius show_data layer_help_button' onclick='toggle_layer_help(this)'>?</button>";
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
	str += "<tr><td colspan='2'><div class='layer_explanation_help' style='display: none'></div></td></tr>";

	return str;
}

function get_option_for_layer_by_type(nr) {
	assert(typeof(nr) == "number", "[get_option_for_layer_by_type] Argument nr is not a number, got " + typeof(nr));

	var layer_type = $($(".layer_type")[nr]);

	var type = layer_type.val();

	if (!type) {
		wrn("[get_option_for_layer_by_type] No type found for layer", nr, "-> falling back to 'dense'");
		layer_type.children().children().each(function () {
			if ($(this).val() == "dense") {
				$(this).prop("selected", true);
			}
		});
		type = layer_type.val();
		err("[get_option_for_layer_by_type] Cannot determine type of layer " + nr + ", defaulted to '" + type + "'");
		return;
	}

	var str = "";

	var found = false;

	for (var [key, values] of Object.entries(layer_options)) {
		if (key == type) {
			found = true;

			str = build_layer_options_html(values, str, type, nr);
		}
	}

	if (!found) {
		err("[get_option_for_layer_by_type] Layer type '" + type + "' not found in layer_options. Available keys: " + Object.keys(layer_options).join(", "));
	}

	assert(typeof(str) == "string", "[get_option_for_layer_by_type] str is not a string, got " + typeof(str) + " (" + str + ")");

	return str;
}

function add_seed_option (type, nr) {
	var style = "";

	var current_input_shape = get_input_shape();
	if (current_input_shape.length != 3) {
		style = " style=\"display: none\" ";
	}

	var seed_value = get_unique_seed_for_layer(nr);

	var res = "<tr class='seed_value' " + style + "><td>Seed</td><td><input onchange='updated_page()' type='number' name='seed' class='seed dropout_seed' value='" + seed_value + "' /></td></tr>";

	return res;
}

function add_visualize_option(type, nr) {
	assert(typeof(type) == "string", "type is not a string");
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
	for (var dim_idx = 0; dim_idx < dimensionality; dim_idx++) {
		var letter = String.fromCharCode(letter_code);
		const classname = "pool_size_" + letter;
		const desc = "Pool-Size " + letter;
		const data = { "min": 1, "max": 4096, "step": 1, "value": get_default_option(type, "pool_size")[dim_idx] };
		str += get_tr_str_for_layer_table(desc, classname, "number", data, nr, null, null);
		letter_code++;
	}

	return str;
}

function add_kernel_size_option(type, nr) {
	var str = "";
	var dimensionality = get_dimensionality_from_layer_name(type);

	assert(typeof(dimensionality) == "number", `get_dimensionality_from_layer_name does not return a number for type '${type}'`);

	var letter_code = "x".charCodeAt();
	for (var dim_idx = 0; dim_idx < dimensionality; dim_idx++) {
		var letter = String.fromCharCode(letter_code);
		const desc = "<span class='TRANSLATEME_kernel_size'></span> " + letter;
		const classname = "kernel_size_" + letter;
		const default_value = get_default_option(type, "kernel_size");
		const data = { "min": 1, "max": 4096, "step": 1, "value": default_value[dim_idx] };
		str += get_tr_str_for_layer_table(desc, classname, "number", data, nr, null, null);
		letter_code++;
	}

	return str;
}

function add_strides_option(type, nr) {
	var str = "";
	var dimensionality = get_dimensionality_from_layer_name(type);

	assert(typeof(dimensionality) == "number", `get_dimensionality_from_layer_name does not return a number for type '${type}'`);

	var letter_code = "x".charCodeAt();
	for (var dim_idx = 0; dim_idx < dimensionality; dim_idx++) {
		var letter = String.fromCharCode(letter_code);
		const desc = "Strides " + letter;
		const classname = "strides_" + letter;
		const data = { "min": 1, "max": 4096, "step": 1, "value": get_default_option(type, "strides")[dim_idx] };
		str += get_tr_str_for_layer_table(desc, classname, "number", data, nr, null, null);
		letter_code++;
	}

	return str;
}

// ─────────────────────────────────────────────────────────────────────────────
// insert_activation_option_trs
// Same fix for activation sub-options.
// ─────────────────────────────────────────────────────────────────────────────

function insert_activation_option_trs(layer_nr, option_type) {
	assert(["alpha", "max_value", "axis", "theta", "alpha_initializer", "alpha_regularizer", "alpha_constraint", "shared_axes"].includes(option_type), "invalid option type " + option_type);
	assert(typeof(layer_nr) == "number", "Layer number's type must be number, is: " + typeof(layer_nr));

	if (option_type == "none") {
		log("[insert_activation_option_trs] option_type is '" + option_type + "'");
		return;
	}

	var function_name = `add_activation_${option_type}_option`;

	if (typeof window[function_name] !== "function") {
		err("[insert_activation_option_trs] Function '" + function_name + "' not found");
		return;
	}

	var layer_type = $($(".layer_type")[layer_nr]).val();
	var $new_row = $(window[function_name](layer_type, layer_nr));

	var $parent_row = $($(".activation")[layer_nr]).parent().parent();

	$new_row.insertAfter($parent_row);

	// Activation is a basic option, so its sub-options should be visible
	// (no need to hide them behind advanced toggle)
}


async function insert_activation_options(layer_nr) {
	// TODO NOT YET USED
	assert(typeof(layer_nr) == "number", "layer_nr must be of the type of number but is: " + typeof(layer_nr));
	assert(layer_nr >= 0 && layer_nr <= get_number_of_layers(), "Invalid layer number");

	const $layer = $($(".layer_options_internal")[layer_nr]);

	$layer.find(".activation_tr").remove();

	var activation_item = $layer.find(".activation");

	if (activation_item && activation_item.length) {
		var activation_name = activation_item.val();
		if (activation_name == "linear") {
			return;
		}

		if (Object.keys(activation_options).includes(activation_name)) {
			var options = activation_options[activation_name]["options"];

			for (var option_idx = 0; option_idx < options.length; option_idx++) {
				insert_activation_option_trs(layer_nr, options[option_idx]);
			}
		}
	} else {
		if(get_layer_type_array()[layer_nr] != "flatten") {
			log("[insert_activation_options] Layer " + layer_nr + " does not seem to have a activation setting");
		}
	}

	await updated_page();
}

function create_number_input_for_layer_panel_str (classname, new_uuid, data) {
	var str = "";
	str += "<input class='input_field input_data " + classname + "' type='number' ";

	["min", "max", "step", "value"].forEach(key => {
		if (key in data) {
			if(looks_like_number(data[key])) {
				str += key + "='" + String(data[key]) + "' ";
			}
		}
	});

	if(classname.includes("_initializer_") && (classname.includes("kernel") || classname.includes("bias"))) {
		//updated_page(no_graph_restart, disable_auto_enable_valid_layer_types, item, no_prediction, no_update_initializers) {
		str += `id='get_tr_str_for_layer_table_${new_uuid}'  onchange='updated_page(null, null, null, null, 1)' onkeyup="var original_no_update_math=no_update_math; no_update_math = is_hidden_or_has_hidden_parent('#math_tab_code') ? 1 : 0; is_hidden_or_has_hidden_parent('#math_tab_code'); updated_page(null, null, this, null, 1); no_update_math=original_no_update_math;" />`;
	} else {
		str += `id='get_tr_str_for_layer_table_${new_uuid}'  _onchange='updated_page()' onkeyup="var original_no_update_math=no_update_math; no_update_math = is_hidden_or_has_hidden_parent('#math_tab_code') ? 1 : 0; is_hidden_or_has_hidden_parent('#math_tab_code'); updated_page(null, null, this); no_update_math=original_no_update_math;" />`;
	}

	return str;
}

function create_checkbox_for_layer_panel_str (classname, new_uuid, data) {
	var str = "";
	var on_change_string = "updated_page(null, null, this);";

	str += `<input id='checkbox_${new_uuid}' type='checkbox' class='input_data ${classname}' `;
	if ("status" in data && data["status"] == "checked") {
		str += " checked ";
	}

	if(classname == "use_bias") {
		on_change_string += "change_bias_selection(this);";
	}

	str += `_onchange='${on_change_string}' />`;

	return str;
}

function create_text_for_layer_panel_str (classname, data, nr) {
	var str = "";
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

	if(pre_text && classname == "dilation_rate") {
		const layer_type = $($(".layer_type")[nr]).val();
		const num_dilation_rate_items = safeGetDim(layer_type);
		const dilation_rate_generated = Array(num_dilation_rate_items).fill(1).join(',');

		pre_text = ` value='${dilation_rate_generated}'`;
	}

	str += `<input id="text_field_${uuidv4()}" class="input_field input_data ${classname}" ${pre_text} ${placeholder} data-createdfrom="create_text_for_layer_panel_str" type="text" _onchange="updated_page()" onkeyup="updated_page(null, null, this)" />`;

	return str;
}

function create_select_for_layer_panel_str(classname, new_uuid, data) {
	var str = "";

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

	str += `<select id="select_${new_uuid}" class='input_field input_data  ${classname}' data-createdfrom="create_select_for_layer_panel_str" _onchange='${onchange_text}'>`;
	for (var [key, value] of Object.entries(data)) {
		str += "<option value=\"" + key + "\">" + value + "</option>";
	}
	str += "</select>";

	return str;
}

function add_cell_option() {
	return "";
}

function add_number_lstm_cells_option(type, nr) {
	var data = { "min": 0, "step": 1, "value": 1 };
	var res = get_tr_str_for_layer_table("LSTM Cells", "number_lstm_cells", "number", data, nr, null, null);

	return res;
}

function add_skip_connection_option(type, nr) {
	if (skip_connection_excluded_types.includes(type)) {
		return "";
	}

	var str = "";
	str += "<tr class='skip_connection_tr'>";
	str += "<td><span class='TRANSLATEME_skip_connection'>Skip Connection</span>:</td>";
	str += "<td>";
	str += "<input type='checkbox' class='skip_connection_enabled' id='skip_conn_enabled_" + nr + "' onchange='toggle_skip_connection(" + nr + ", this)' />";
	str += "</td>";
	str += "</tr>";

	return str;
}

async function add_layer(item) {
	assert(typeof(item) == "object", "item is not an object but " + typeof(item));

	layer_structure_cache = null;

	var real_nr = get_layer_nr_by_item(item);

	var nr_of_layer = (get_number_of_layers() - 1);

	var item_parent_parent = $(item).parent().parent();

	var plus_or_minus_one = 1;

	try {
		if(real_nr == nr_of_layer) {
			clone_with_fade(item_parent_parent, true);
			plus_or_minus_one = 0;
		} else {
			clone_with_fade(item_parent_parent, false);
		}
	} catch (e) {
		if(Object.keys(e).includes("message")) {
			e = e.message;
		}

		err("[add_layer] " + e);
	}

	$("#number_of_layers").val(parse_int($("#number_of_layers").val()) + 1);

	var previous_layer_type = $(".layer_setting").eq(real_nr).find(".layer_type").val();
	var new_layer_type = previous_layer_type;
	if (new_layer_type == "flatten") {
		new_layer_type = "dense";
	}
	$(".layer_setting").eq(real_nr + plus_or_minus_one).find(".layer_type").val(new_layer_type).trigger("change");

	await updated_page();

	await write_descriptions();

	$(".remove_layer").prop("disabled", false).show();

	$($(".remove_layer")[real_nr + plus_or_minus_one]).removeAttr("disabled");

	await rename_labels();
	await predict_handdrawn();

	disable_everything_in_last_layer_enable_everyone_else_in_beginner_mode();

	await restart_webcam_if_needed();

	l(language[lang]["added_layer"]);
}

async function remove_layer(item) {
	assert(typeof(item) == "object", "item is not an object but " + typeof(item));

	var number_of_layers_element = document.getElementById("number_of_layers");
	var old_value = parseInt(number_of_layers_element.value);
	if (old_value > 1) {
		var $layer = $($(item).parent()[0]).parent();

		layer_structure_cache = null;
		number_of_layers_element.value = old_value - 1;

		// Smooth slide up + fade out
		$layer.animate(
			{ height: 0, opacity: 0, marginTop: 0, marginBottom: 0, paddingTop: 0, paddingBottom: 0 },
			200,
			async function() {
				$layer.remove();  // endgültig entfernen
				await updated_page();
				disable_all_non_selected_layer_types();

				if (get_number_of_layers() == 1) {
					$(".remove_layer").prop("disabled", true).hide();
				} else {
					$(".remove_layer").prop("disabled", false).show();
				}

				await write_descriptions();
				await predict_handdrawn();
				disable_everything_in_last_layer_enable_everyone_else_in_beginner_mode();
				await restart_webcam_if_needed();
				l(language[lang]["removed_layer"]);
			}
		);

	} else {
		log("You cannot remove the last remaining layer of your model.");
	}
}

function clone_with_fade(src, insert_before) {
	var clone = src.clone(false);

	sanitize_cloned_ids(clone);

	clone.css({
		opacity: 0,
		height: 0,
		overflow: 'hidden'
	});

	if (insert_before) {
		clone.insertBefore(src);
	} else {
		clone.insertAfter(src);
	}

	var target_height = clone.prop('scrollHeight');

	clone.animate({ height: target_height + 'px' }, 150, function () {
		clone.css({ height: '', overflow: '' });
		clone.fadeTo(150, 1);
	});
}

function sanitize_cloned_ids(root) {
	root.find('[id]').each(function () {
		this.id = regenerate_id(this.id);
	});
}

function regenerate_id(old_id) {
	return old_id.replace(/_[0-9a-f\-]{36}$/, '') + '_' + crypto.randomUUID();
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

function get_layer_nr_by_item (item) {
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

	return real_nr;
}

async function toggle_layer_options(item) {
	assert(typeof(item) == "object", "toggle_layer_options(" + item + ") is not an object but " + typeof(item));

	const $full_layer = $(item).parent().parent().parent().parent();
	const $help = $full_layer.find(".layer_explanation_help");
	const $options = $full_layer.find(".layer_options_internal");

	// Wenn Options geöffnet werden, Help schließen
	if (!$options.is(":visible")) {
		$help.hide();
		$full_layer.find(".layer_help_button").removeClass("layer_button_active");
	}

	$options.toggle();

	// Toggle active state
	if ($options.is(":visible")) {
		$(item).addClass("layer_button_active");
	} else {
		$(item).removeClass("layer_button_active");
	}

	await write_descriptions(1);
	await show_visual_explanations(1);
}

async function toggle_layer_help(item) {
	assert(typeof(item) == "object", "toggle_layer_help(" + item + ") is not an object but " + typeof(item));

	const $full_layer = $(item).parent().parent().parent().parent();
	const $help = $full_layer.find(".layer_explanation_help");
	const $options = $full_layer.find(".layer_options_internal");

	// Wenn Help geöffnet wird, Options schließen
	if (!$help.is(":visible")) {
		$options.hide();
		$full_layer.find(".layer_options_button").removeClass("layer_button_active");
	}

	$help.toggle();

	// Toggle active state
	if ($help.is(":visible")) {
		$(item).addClass("layer_button_active");
	} else {
		$(item).removeClass("layer_button_active");
	}

	await write_descriptions(1);
	await show_visual_explanations(1);
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

	for (var option_idx = 0; option_idx < options.length; option_idx++) {
		if (!$(options[option_idx]).is(":selected")) {
			$(options[option_idx]).prop("disabled", true);
		}

		if (valid_layer_types.includes($(options[option_idx]).prop("value"))) {
			$(options[option_idx]).prop("disabled", false);
		}
	}
}

async function disable_invalid_layers_event(e, thisitem) {
	var this_disable_invalid_layers_event_uuid = uuidv4();

	if(special_disable_invalid_layers_event_uuid) {
		this_disable_invalid_layers_event_uuid = special_disable_invalid_layers_event_uuid;
	}

	assert(typeof(e) == "object", "disable_invalid_layers_event: e -> " + e + " is not an object but " + typeof(e));
	assert(typeof(thisitem) == "object", "disable_invalid_layers_event: thisitem -> " + thisitem + " is not an [object HTMLSelectElement] but " + typeof(thisitem));

	e.preventDefault();
	var layer_nr = null;

	layer_nr = find_layer_number_by_element(thisitem);

	await enable_valid_layer_types(layer_nr);

	last_disable_invalid_layers_event_uuid = this_disable_invalid_layers_event_uuid;
}

async function disable_all_invalid_layers() {
	document.body.style.pointerEvents = "none";
	await disable_all_invalid_layers_from(0);
	document.body.style.pointerEvents = "";
}

async function disable_all_invalid_layers_from(start) {
	assert(typeof(start) == "number", "disable_all_invalid_layers_from(" + start + ") is not a number but " + typeof(start));

	favicon_spinner();
	for (var layer_idx = start; layer_idx < get_number_of_layers(); layer_idx++) {
		await enable_valid_layer_types(layer_idx);
	}
	favicon_default();
}

function enable_all_layer_types () {
	var nr_of_layer = model?.layers?.length;
	if(!nr_of_layer) {
		return;
	}

	if(!model || !Object.keys(model).includes("layers") || !nr_of_layer) {
		err(language[lang]["model_not_found_or_has_no_layers"]);
		return;
	}

	for (var layer_nr = 0; layer_nr < nr_of_layer; layer_nr++) {
		var options = $($($(".layer_type")[layer_nr]).children().children());

		for (var option_idx = 0; option_idx < options.length; option_idx++) {
			if (!$(options[option_idx]).is(":selected")) {
				$(options[option_idx]).prop("disabled", true);
			}

			$(options[option_idx]).prop("disabled", false);
		}
	}
}

function disable_all_non_selected_layer_types() {
	var all_options = $(".layer_type").children().children();

	for (var option_idx = 0; option_idx < all_options.length; option_idx++) {
		var this_all_options = $(all_options[option_idx]);
		if (!this_all_options.is(":selected")) {
			if (this_all_options.val() != "dense") {
				this_all_options.prop("disabled", true);
			}
		} else {
			this_all_options.prop("selected", true);
		}
	}
}

async function insert_initializer (name) {
	var nr_of_layer = model?.layers?.length;
	if(!nr_of_layer) {
		return;
	}

	for (var layer_idx = 0; layer_idx < nr_of_layer; layer_idx++) {
		await insert_initializer_options(layer_idx, name);
	}

	await update_translations();
}

function get_layer_initializer_config(layer_nr, initializer_type) {
	const is_valid_initializer = valid_initializer_types.includes(initializer_type);
	const invalid_initializer_error_message = "insert_initializer_trs(layer_nr, " + initializer_type + ") is not a valid initializer_type (2nd option)";

	assert(is_valid_initializer, invalid_initializer_error_message);

	assert(typeof(layer_nr) == "number", "get_layer_initializer_config(" + layer_nr + ", initializer_type), layer_nr is not an integer but " + typeof(layer_nr));

	var starts_with_string = initializer_type + "_initializer_";

	var this_initializer_options = $($(".layer_setting")[layer_nr]).find("." + initializer_type + "_initializer_tr").find(".input_data");

	var option_hash = {};

	for (var init_idx = 0; init_idx < this_initializer_options.length; init_idx++) {
		var this_option = this_initializer_options[init_idx];
		var classList = this_option?.className?.split(/\s+/);

		if(classList) {
			for (var j = 0; j < classList.length; j++) {
				var class_list_element = classList[j];
				if (class_list_element.startsWith(starts_with_string)) {
					var option_name = class_list_element;
					option_name = option_name.replace(starts_with_string, "");
					var value = get_item_value(layer_nr, class_list_element);

					/*
					if(layer_nr == 0) {
						log("option_name:", option_name, "value:", value, "class_list_element:", class_list_element);
					}
					*/

					if (looks_like_number(value)) {
						value = parse_float(value);
					}

					if (value !== "") {
						option_hash[option_name] = is_numeric(value) ? parse_float(value) : value;
					} else {
						set_this_option_or_error(this_option);
					}
				}
			}
		} else {
			err(`classList was empty`);
		}
	}

	return option_hash;
}

function findInitializerElement(arr) {
	for (let arr_idx = 0; arr_idx < arr.length; arr_idx++) {
		if (typeof arr[arr_idx] === "string" && arr[arr_idx].includes("_initializer_")) {
			return arr[arr_idx];
		}
	}
	return null; // Return null if no matching element is found
}

function get_item_value(layer_idx, option_name) {
	assert(typeof(layer_idx) == "number", "Layer is not an integer, but " + typeof(layer_idx));
	assert(typeof(option_name) == "string", "option_name '" + option_name + "' is not a string, but " + typeof(option_name));

	var layer_settings = $(".layer_setting");
	var $layer = $(layer_settings[layer_idx]);

	if (typeof(option_name) == "string") {
		let found = $($layer.find("." + option_name)[0]);
		if (found.attr("type") == "checkbox") {
			return found.is(":checked");
		} else {
			var data = found.val();
			return data;
		}
	} else {
		for (var this_classname in option_name) {
			let found = $($layer.find("." + this_classname)[0]);
			if (found.attr("type") == "checkbox") {
				return found.is(":checked");
			} else {
				let data = found.val();
				if (data) {
					return data;
				}
			}
		}
		return null;
	}
}

function set_item_value(layer_idx, option_name, value) {
	if (option_name == "name") {
		return;
	}

	assert(typeof(layer_idx) == "number", "Layer is not an integer, but " + typeof(layer_idx));
	assert(typeof(option_name) == "string", "option_name '" + option_name + "' is not a string, but " + typeof(option_name));
	assert(["string", "number", "boolean"].includes(typeof(value)), "value '" + value + "' for " + option_name + " is not a string or number, but " + typeof(value));

	var layer_settings = $(".layer_setting");
	if(layer_idx >= layer_settings.length) {
		wrn(`[set_item_value] Layer ${layer_idx} was too high. Max number is ${layer_settings.length - 1}`);

		return;
	}

	var layer_setting = layer_settings[layer_idx];
	var found_setting = $($(layer_setting).find("." + option_name)[0]);
	if (found_setting.length) {
		if (found_setting.attr("type") == "checkbox") {
			found_setting.prop("checked", value == 1 ? true : false).trigger("change");
		} else {
			found_setting.val(value).trigger("change");
		}
	} else {
		if(option_name == "rate") {
			set_item_value(layer_idx, "dropout_rate", value);
		} else if(!["trainable", "units"].includes(option_name)) {
			err("Unknown option_name '" + option_name + "' in layer " + layer_idx);
		}
	}
}

function set_xyz_values(j, name, values) {
	assert(typeof(j) == "number", "j must be number, is: " + typeof(j));
	assert(typeof(name) == "string", "name must be string, is: " + typeof(name));
	assert(typeof(values) == "object", "name must be object, is: " + typeof(values));

	var letter = "x";
	for (var val_idx = 0; val_idx < values.length; val_idx++) {
		var this_name = name + "_" + String.fromCharCode(letter.charCodeAt() + val_idx);
		set_item_value(j, this_name, values[val_idx]);
	}
}

function change_bias_selection (elem) {
	if(!$(elem).is(":checked")) {
		$(elem).parent().parent().parent().find(".bias_initializer_tr").remove();
	}
}

function set_model_layer_warning(layer_idx, warning) {
	assert(typeof(layer_idx) == "number", layer_idx + " is not a number");
	assert(typeof(warning) == "string", warning + " is not a string");

	if(warning) {
		$($(".warning_layer")[layer_idx]).html(warning).show().parent().show();
	} else {
		$($(".warning_layer")[layer_idx]).html("").hide().parent().hide();
	}
}

function set_layer_background(nr, color) {
	$($(".layer_setting")[nr]).css("background-color", color);
}

function find_layer_number_by_element(element) {
	var item_parent = element;

	while (!$(item_parent).hasClass("layer_setting")) {
		item_parent = $(item_parent).parent();
		if (get_element_xpath($("body")[0]) == get_element_xpath(item_parent[0])) {
			write_error("Infinite recursion", null, null); // cannot be async
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

function get_number_of_layers() {
	let val = document.getElementById("number_of_layers")?.value;
	if (val === null || val === undefined) {
		wrn("[get_number_of_layers] Element #number_of_layers not found");
		return null;
	}

	if(looks_like_number(val)) {
		return parse_int(val);
	}

	const model_layers_length = model?.layers?.length;

	if(model_layers_length !== undefined) {
		return model_layers_length;
	}

	wrn("Error getting number of layers from #number_of_layers");
	return null;
}

function set_number_of_layers(val) {
	if (typeof val !== "number" || !Number.isFinite(val)) {
		throw new Error(val + " is not a valid number but " + typeof val);
	}
	var el = document.getElementById("number_of_layers");
	if (!el) {
		wrn("Element #number_of_layers not found");
		return null;
	}
	el.value = val;
	return val;
}

function show_layer_visualization_tab (str=false) {
	if (str)  {
		$("#layer_visualizations_tab").html(str);
	}

	$("#layer_visualizations_tab").show();
}

function disable_flatten_layer () {
	if(!model) {
		if(finished_loading) {
			info(`disable_flatten_layer: ${language[lang]["no_model_found"]}`);
		}
		return;
	}

	var nr_of_layer = model?.layers?.length;

	if(!nr_of_layer) {
		return;
	}

	if(!Object.keys(model).includes("layers") || !nr_of_layer) {
		if(finished_loading) {
			wrn(`disable_flatten_layer: ${language[lang]["no_layers_found"]}`);
		}
		return;
	}

	try {
		var flatten_layer = null;
		for (var layer_idx = 0; layer_idx < nr_of_layer; layer_idx++) {
			if(!flatten_layer && model?.layers[layer_idx].name.startsWith("flatten")) {
				flatten_layer = layer_idx;
			}
		}

		if(flatten_layer !== null) {
			$($(".layer_setting")[flatten_layer]).find(".remove_layer").prop("disabled", true);
		}
	} catch (e) {
		throw new Error(e);
	}

}

function enable_every_layer () {
	$(".configtable").find("input,select,button").prop("disabled", false);
	$(".layer_setting").find("button").prop("disabled", false);
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

function get_str_for_description(desc) {
	assert(typeof(desc) == "string", desc + " is not string but " + typeof(desc));

	return "<span class='typeset_me'>" + desc + "</span>";
}

// ─────────────────────────────────────────────────────────────────────────────
// enforce_advanced_section_visibility
// After dynamic rows are inserted (via trigger("change")), this function
// ensures all rows belonging to a collapsed advanced section are hidden.
// Now uses a more robust approach: finds ALL elements with the section class
// within the layer, not just direct children.
// ─────────────────────────────────────────────────────────────────────────────

function enforce_advanced_section_visibility(layer_idx) {
	var $layer = $($(".layer_options_internal")[layer_idx]);

	var $toggle_button = $layer.find(".advanced_options_toggle_button");

	if (!$toggle_button.length) {
		return;
	}

	var section_class = $toggle_button.data("section-class");
	var is_expanded = $toggle_button.data("expanded") === true;

	if (!is_expanded) {
		// Force-hide all rows in this section — use global selector since
		// the rows are definitely inside this layer's tbody
		$layer.find("." + section_class).css("display", "none");
	}
}

// ─────────────────────────────────────────────────────────────────────────────
// enforce_all_advanced_section_visibility
// Runs enforce on ALL layers. Call this after any global operation that
// might have shown advanced rows (like update_initializers, updated_page, etc.)
// ─────────────────────────────────────────────────────────────────────────────

function enforce_all_advanced_section_visibility() {
	var $all_layers = $(".layer_options_internal");
	$all_layers.each(function (layer_idx) {
		enforce_advanced_section_visibility(layer_idx);
	});
}

// ─────────────────────────────────────────────────────────────────────────────
// insert_regularizer_options
// FIXED: Calls enforce_advanced_section_visibility after inserting rows.
// ─────────────────────────────────────────────────────────────────────────────

async function insert_regularizer_options(layer_nr, regularizer_type) {
	assert(valid_initializer_types.includes(regularizer_type), "insert_regularizer_trs(layer_nr, " + regularizer_type + ") is not a valid regularizer_type (2nd option)");
	assert(typeof(layer_nr) == "number", "layer_nr must be of the type of number but is: " + typeof(layer_nr));
	var max_layer = get_number_of_layers();
	if(!(layer_nr >= 0 && layer_nr <= max_layer)) {
		dbg(sprintf(language[lang]["invalid_layer_nr_max_layer_n_layer_nr_m"], max_layer, layer_nr));
		return;
	}

	const $layer = $($(".layer_options_internal")[layer_nr]);

	$layer.find("." + regularizer_type + "_regularizer_tr").remove();

	var regularizer = $layer.find("." + regularizer_type + "_regularizer");

	if (regularizer.length) {
		var regularizer_name = regularizer.val();

		var options = regularizer_options[regularizer_name]["options"];

		for (var option_idx = 0; option_idx < options.length; option_idx++) {
			insert_regularizer_option_trs(layer_nr, regularizer_type, options[option_idx]);
		}
	} else {
		if(get_layer_type_array()[layer_nr] != "flatten") {
			log("[insert_regularizer_options] Layer " + layer_nr + " does not seem to have a " + regularizer_type + " regularizer setting");
		}
	}

	// Re-enforce visibility after inserting new rows
	enforce_advanced_section_visibility(layer_nr);

	await updated_page();
}

// ─────────────────────────────────────────────────────────────────────────────
// insert_initializer_options
// FIXED: Calls enforce_advanced_section_visibility after inserting rows.
// ─────────────────────────────────────────────────────────────────────────────

async function insert_initializer_options (layer_nr, initializer_type) {
	assert(valid_initializer_types.includes(initializer_type), "insert_initializer_trs(layer_nr, " + initializer_type + ") is not a valid initializer_type (2nd option)");
	assert(typeof(layer_nr) == "number", "layer_nr must be of the type of number but is: " + typeof(layer_nr));

	var max_layer = get_number_of_layers();
	if(!(layer_nr >= 0 && layer_nr <= max_layer)) {
		dbg(sprintf(language[lang]["invalid_layer_nr_max_layer_n_layer_nr_m"], max_layer, layer_nr));
		return;
	}

	const $layer = $($(".layer_options_internal")[layer_nr]);

	var existing_init_elements = $layer.find("." + initializer_type + "_initializer_tr");

	var initializer = $layer.find("." + initializer_type + "_initializer");

	var initializer_name = initializer.val();

	if(existing_init_elements.length) {
		var number_of_removed_items = 0;

		var options = initializer_options[initializer_name]["options"];

		var prev_classes = [];

		for (var init_idx = 0; init_idx < existing_init_elements.length; init_idx++) {
			var remove = true;

			var found_element = $(existing_init_elements[init_idx]);
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
				$(existing_init_elements[init_idx]).remove();
				number_of_removed_items++;
			}
		}

		if(number_of_removed_items == 0) {
			return;
		}
	}

	if(initializer_name) {
		let options = initializer_options[initializer_name]["options"];

		for (var option_idx = 0; option_idx < options.length; option_idx++) {
			insert_initializer_option_trs(layer_nr, initializer_type, options[option_idx]);
		}
	}

	// Re-enforce visibility after inserting new rows
	enforce_advanced_section_visibility(layer_nr);
}

// ─────────────────────────────────────────────────────────────────────────────
// update_initializers
// FIXED: Calls enforce_all_advanced_section_visibility after all insertions.
// ─────────────────────────────────────────────────────────────────────────────

async function update_initializers () {
	await insert_initializer("kernel");
	await insert_initializer("bias");
	await insert_initializer("depthwise");
	await insert_initializer("beta");
	await insert_initializer("gamma");
	await insert_initializer("moving_mean");
	await insert_initializer("pointwise");

	enforce_all_advanced_section_visibility();
}

// ─────────────────────────────────────────────────────────────────────────────
// show_or_hide_bias_initializer
// FIXED: Now respects the advanced section collapse state.
// Only shows the bias initializer row if the advanced section is expanded.
// When hiding (use_bias unchecked), always hides regardless of section state.
// Also handles bias_regularizer row.
// ─────────────────────────────────────────────────────────────────────────────

function show_or_hide_bias_initializer(number_of_layers) {
	var layer_settings = $(".layer_setting");
	for (var layer_idx = 0; layer_idx < number_of_layers; layer_idx++) {
		var this_layer = $(layer_settings[layer_idx]);
		var use_bias_setting = this_layer.find(".use_bias");
		if (use_bias_setting.length) {
			var $bias_init_row = this_layer.find(".bias_initializer").parent().parent();
			var $bias_reg_row = this_layer.find(".bias_regularizer").parent().parent();

			if ($(use_bias_setting[0]).is(":checked")) {
				// Only show if the advanced section is currently expanded
				if (is_advanced_section_expanded($bias_init_row)) {
					$bias_init_row.show();
				}
				if (is_advanced_section_expanded($bias_reg_row)) {
					$bias_reg_row.show();
				}
			} else {
				$bias_init_row.hide();
				$bias_reg_row.hide();
			}
		}
	}
}

// ─────────────────────────────────────────────────────────────────────────────
// is_advanced_section_expanded
// Helper: checks if a row's advanced section is currently expanded.
// Returns true if the row is NOT in an advanced section (always visible),
// or if the section's toggle button says expanded=true.
// ─────────────────────────────────────────────────────────────────────────────

function is_advanced_section_expanded($row) {
	if (!$row.length) {
		return true;
	}

	var row_classes = ($row.attr("class") || "").split(/\s+/);
	var section_class = null;

	for (var i = 0; i < row_classes.length; i++) {
		if (row_classes[i].startsWith("advanced_options_section_")) {
			section_class = row_classes[i];
			break;
		}
	}

	if (!section_class) {
		// Not in an advanced section — treat as always visible
		return true;
	}

	var $toggle_button = $("button[data-section-class='" + section_class + "']");
	return $toggle_button.length && $toggle_button.data("expanded") === true;
}

// ─────────────────────────────────────────────────────────────────────────────
// set_option_for_layer_by_layer_nr
// FIXED: Calls enforce_advanced_section_visibility AFTER all triggers,
// and also after write_descriptions which may cause further DOM changes.
// ─────────────────────────────────────────────────────────────────────────────

async function set_option_for_layer_by_layer_nr(layer_idx) {
	assert(typeof(layer_idx) == "number", "initializer_layer_options_by_layer_nr(" + layer_idx + ") is not a number but " + typeof(layer_idx));

	var layer = $(".layer_options_internal")[layer_idx];

	const layer_str = get_option_for_layer_by_type(layer_idx);

	layer.innerHTML = layer_str;

	$($(".layer_options_internal")[layer_idx]).find("select").trigger("change");

	var valid_subtypes = ["initializer", "regularizer"];
	for (var valid_initializer_idx = 0; valid_initializer_idx < valid_initializer_types.length; valid_initializer_idx++) {
		var kn = valid_initializer_types[valid_initializer_idx];

		for (var vs = 0; vs < valid_subtypes.length; vs++) {
			var t = valid_subtypes[vs];
			var name = kn + "_" + t;
			$(layer).find("." + name).trigger("change");
		}
	}

	// Re-enforce advanced section hidden state on all rows that were
	// dynamically inserted by the trigger("change") calls above
	enforce_advanced_section_visibility(layer_idx);

	var layer_type = $($(".layer_type")[layer_idx]);

	var type = layer_type.val();

	for (var [key, values] of Object.entries(layer_options)) {
		if (key == type) {
			if (values["description"]) {
				const help = get_str_for_description(values["description"]);
				$(layer).parent().find(".layer_explanation_help").html(help);
			} else {
				err("[build_layer_options_html] No description given for layer type '" + type + "'");
			}
		}
	}

	await write_descriptions();

	// Final enforce after everything is done
	enforce_advanced_section_visibility(layer_idx);
}

// ─────────────────────────────────────────────────────────────────────────────
// initializer_layer_options
// FIXED: Calls enforce after updated_page which may trigger further changes.
// ─────────────────────────────────────────────────────────────────────────────

async function initializer_layer_options(thisitem) {
	if ($(thisitem).hasClass("swal2-select") || $(thisitem).attr("id") == "model_dataset") {
		return;
	}

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

	// Enforce after updated_page, which may have called update_initializers
	// or show_or_hide_bias_initializer
	enforce_advanced_section_visibility(nr);

	await show_visual_explanations(0);
}

// ─────────────────────────────────────────────────────────────────────────────
// apply_advanced_section_state_to_row
// Checks if the parent row belongs to an advanced section (has the
// advanced_options_section_* class). If so, applies the same class and
// hides the row if the advanced section is currently collapsed.
// ─────────────────────────────────────────────────────────────────────────────

function apply_advanced_section_state_to_row($parent_row, $new_row) {
	var parent_classes = ($parent_row.attr("class") || "").split(/\s+/);
	var section_class = null;

	for (var i = 0; i < parent_classes.length; i++) {
		if (parent_classes[i].startsWith("advanced_options_section_")) {
			section_class = parent_classes[i];
			break;
		}
	}

	if (!section_class) {
		return;
	}

	$new_row.addClass(section_class);

	var $toggle_button = $("button[data-section-class='" + section_class + "']");
	var is_expanded = $toggle_button.length && $toggle_button.data("expanded") === true;

	if (!is_expanded) {
		$new_row.css("display", "none");
	}
}

// ─────────────────────────────────────────────────────────────────────────────
// insert_initializer_option_trs
// ─────────────────────────────────────────────────────────────────────────────

function insert_initializer_option_trs(layer_nr, initializer_type, option_type) {
	assert(valid_initializer_types.includes(initializer_type), "insert_initializer_option_trs: layer_nr, " + initializer_type + " is not a valid initializer_type (2nd option)");
	assert(["seed", "mean", "stddev", "value", "mode", "distribution", "minval", "maxval", "scale", ...valid_initializer_types].includes(option_type), "invalid option type " + option_type);
	assert(typeof(layer_nr) == "number", "Layer number's type must be number, is: " + typeof(layer_nr));

	var function_name = `add_${initializer_type}_initializer_${option_type}_option`;

	if (typeof window[function_name] !== "function") {
		err("[insert_initializer_option_trs] Function '" + function_name + "' not found");
		return;
	}

	var layer_type = $($(".layer_type")[layer_nr]).val();
	var $new_row = $(window[function_name](layer_type, layer_nr));

	var $parent_row = $($(".layer_setting")[layer_nr])
		.find("." + initializer_type + "_initializer")
		.parent()
		.parent();

	$new_row.insertAfter($parent_row);

	apply_advanced_section_state_to_row($parent_row, $new_row);
}

// ─────────────────────────────────────────────────────────────────────────────
// insert_regularizer_option_trs
// ─────────────────────────────────────────────────────────────────────────────

function insert_regularizer_option_trs(layer_nr, regularizer_type, option_type) {
	assert(valid_initializer_types.includes(regularizer_type), "insert_regularizer_option_trs: layer_nr, " + regularizer_type + " is not a valid regularizer_type (2nd option)");
	assert(["l1", "l1l2", "l2", "none"].includes(option_type), "invalid option type " + option_type);
	assert(typeof(layer_nr) == "number", "Layer number's type must be number, is: " + typeof(layer_nr));

	if (option_type == "none") {
		log("[insert_regularizer_option_trs] option_type is '" + option_type + "'");
		return;
	}

	var function_name = `add_${regularizer_type}_regularizer_${option_type}_option`;

	if (typeof window[function_name] !== "function") {
		err("[insert_regularizer_option_trs] Function '" + function_name + "' not found");
		return;
	}

	var layer_type = $($(".layer_type")[layer_nr]).val();
	var $new_row = $(window[function_name](layer_type, layer_nr));

	var $parent_row = $($(".layer_setting")[layer_nr])
		.find("." + regularizer_type + "_regularizer")
		.parent()
		.parent();

	$new_row.insertAfter($parent_row);

	apply_advanced_section_state_to_row($parent_row, $new_row);
}

// ─────────────────────────────────────────────────────────────────────────────
// build_advanced_section
// ─────────────────────────────────────────────────────────────────────────────

function build_advanced_section(advanced_html, nr) {
	if (!advanced_html || !advanced_html.trim()) {
		return "";
	}

	var section_class = "advanced_options_section_" + nr + "_" + uuidv4();

	var $temp = $("<table><tbody>" + advanced_html + "</tbody></table>");
	$temp.find("tr").each(function () {
		$(this).addClass(section_class);
		$(this).css("display", "none");
	});

	var marked_html = $temp.find("tbody").html();

	var toggle_btn = "<tr class='advanced_toggle_row'><td colspan='2'>";
	toggle_btn += "<button type='button' class='advanced_options_toggle_button' ";
	toggle_btn += "data-section-class='" + section_class + "' ";
	toggle_btn += "data-expanded='false' ";
	toggle_btn += "onclick='toggle_advanced_options(this)'>";
	toggle_btn += "<span class='advanced_toggle_icon'>&#9654;</span>&nbsp;";
	toggle_btn += "<span class='TRANSLATEME_advanced_options'>Advanced</span>";
	toggle_btn += "</button></td></tr>";

	return toggle_btn + marked_html;
}

// ─────────────────────────────────────────────────────────────────────────────
// toggle_advanced_options
// ─────────────────────────────────────────────────────────────────────────────

function toggle_advanced_options(button) {
	var $button = $(button);
	var section_class = $button.data("section-class");
	var is_expanded = $button.data("expanded");
	var $rows = $("." + section_class);
	var $icon = $button.find(".advanced_toggle_icon");

	if (is_expanded) {
		$rows.each(function () {
			$(this).fadeOut(150);
		});
		$icon.html("&#9654;");
		$button.data("expanded", false);

		setTimeout(function() {
			write_descriptions(1); // await not possible here
		}, 160);
	} else {
		$rows.each(function () {
			var $row = $(this);
			if (should_row_stay_hidden($row)) {
				return;
			}
			$row.fadeIn(150);
		});
		$icon.html("&#9660;");
		$button.data("expanded", true);

		write_descriptions(1); // await not possible here
	}
}

// ─────────────────────────────────────────────────────────────────────────────
// should_row_stay_hidden
// Checks if a row should remain hidden even when the advanced section expands.
// Handles the case where use_bias is unchecked.
// ─────────────────────────────────────────────────────────────────────────────

function should_row_stay_hidden($row) {
	var is_bias_row = $row.find(".bias_initializer").length > 0 ||
		$row.find(".bias_regularizer").length > 0 ||
		$row.hasClass("bias_initializer_tr") ||
		$row.hasClass("bias_regularizer_tr");

	if (is_bias_row) {
		var $layer_options = $row.closest(".layer_options_internal");
		var $layer_setting = $layer_options.closest(".layer_setting");
		if (!$layer_setting.length) {
			$layer_setting = $layer_options.parent().closest(".layer_setting");
		}
		var $use_bias = $layer_setting.find(".use_bias");
		if ($use_bias.length && !$use_bias.is(":checked")) {
			return true;
		}
	}

	return false;
}

// ─────────────────────────────────────────────────────────────────────────────
// rename_tmp_onchange
// FIXED: After renaming _onchange to onchange, re-enforce advanced visibility
// because the onchange handlers may now fire and show hidden rows.
// ─────────────────────────────────────────────────────────────────────────────

function rename_tmp_onchange() {
	$("*[_onchange]").each(function (i, x) {
		var elem = $(this);
		elem.attr("onchange", elem.attr("_onchange"));
		elem.removeAttr("_onchange");
	});

	// After enabling onchange handlers, enforce advanced section state
	// because some handlers may have been triggered during the rename
	enforce_all_advanced_section_visibility();
}

function get_skip_connection_info(layer_nr) {
	if (!skip_connection_settings[layer_nr]) {
		return { enabled: false, strength: 0 };
	}
	// Strength wird jetzt aus dem Modell gelesen, nicht vom Slider
	var strength = _compute_skip_strength_from_model(layer_nr);
	return { enabled: skip_connection_settings[layer_nr].enabled, strength: strength };
}

function update_skip_connection_strength(layer_nr, elem) {
	var val = parseFloat($(elem).val());

	if (!skip_connection_settings[layer_nr]) {
		skip_connection_settings[layer_nr] = { enabled: true, strength: val };
	}

	skip_connection_settings[layer_nr].strength = val;
	$("#skip_conn_strength_val_" + layer_nr).text(val.toFixed(2));

	updated_page(); // await not possible here
}

function update_skip_connection_strength_display(layer_nr, elem) {
	var val = parseFloat($(elem).val());
	$("#skip_conn_strength_val_" + layer_nr).text(val.toFixed(2));
}
