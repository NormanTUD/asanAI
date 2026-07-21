"use strict";

function update_skip_connection_initializer(layer_nr, elem) {
	if (layer_nr === null || layer_nr === undefined) {
		err("[update_skip_connection_initializer] Could not determine layer number");
		return;
	}

	var val = $(elem).val();

	if (!skip_connection_settings[layer_nr]) {
		skip_connection_settings[layer_nr] = { enabled: false, initializer: val, initializer_params: {} };
	}

	skip_connection_settings[layer_nr].initializer = val;

	// Setze Default-Parameter basierend auf dem Initializer
	var default_params = {};
	if (initializer_options[val] && initializer_options[val].options) {
		var options = initializer_options[val].options;
		for (var i = 0; i < options.length; i++) {
			default_params[options[i]] = _get_skip_initializer_default_value(options[i], layer_nr);
		}
	}
	skip_connection_settings[layer_nr].initializer_params = default_params;

	// Force model recreation by invalidating the config hash
	model_config_hash = null;
}

function insert_skip_initializer_options(layer_nr, elem) {
	if (layer_nr === null || layer_nr === undefined) return;

	var $layer_setting = $(elem).closest(".layer_setting");

	// Remove old sub-option rows
	$layer_setting.find(".skip_connection_initializer_option_tr").remove();

	var initializer_name = $(elem).val();
	var $init_row = $layer_setting.find(".skip_connection_initializer_tr");

	// Determine the section_class from the initializer row
	var section_class = _get_section_class_from_row($init_row);

	var html = _get_skip_initializer_sub_options_html(layer_nr, initializer_name, section_class);

	if (html) {
		var $new_rows = $(html);
		$new_rows.insertAfter($init_row);

		// Apply advanced section state to each new row
		$new_rows.each(function() {
			apply_advanced_section_state_to_row($init_row, $(this));
		});
	}
}

function update_skip_connection_initializer_param(layer_nr, param_name, elem) {
	if (layer_nr === null || layer_nr === undefined) return;

	var val = $(elem).val();
	if (looks_like_number(val)) {
		val = parse_float(val);
	}

	if (!skip_connection_settings[layer_nr]) {
		skip_connection_settings[layer_nr] = { enabled: false, initializer: "glorotUniform", initializer_params: {} };
	}

	if (!skip_connection_settings[layer_nr].initializer_params) {
		skip_connection_settings[layer_nr].initializer_params = {};
	}

	skip_connection_settings[layer_nr].initializer_params[param_name] = val;

	// Force model recreation by invalidating the config hash
	model_config_hash = null;
}

function toggle_skip_connection(layer_nr, elem) {
	if (layer_nr === null || layer_nr === undefined) {
		err("[toggle_skip_connection] Could not determine layer number");
		return;
	}

	var enabled = $(elem).is(":checked");

	if (!skip_connection_settings[layer_nr]) {
		skip_connection_settings[layer_nr] = { enabled: false, initializer: "glorotUniform", initializer_params: {} };
	}

	skip_connection_settings[layer_nr].enabled = enabled;

	// Force model recreation
	model_config_hash = null;

	var $layer_setting = $(elem).closest(".layer_setting");
	var $init_row = $layer_setting.find(".skip_connection_initializer_tr");
	var $init_option_rows = $layer_setting.find(".skip_connection_initializer_option_tr");

	if (enabled) {
		$init_row.show();
		$init_option_rows.show();

		// If no sub-options exist yet, insert them with proper advanced section class
		if ($init_option_rows.length === 0) {
			var initializer_name = skip_connection_settings[layer_nr].initializer || "glorotUniform";

			// Determine the section_class from the parent row
			var section_class = _get_section_class_from_row($init_row);

			var html = _get_skip_initializer_sub_options_html(layer_nr, initializer_name, section_class);
			if (html) {
				var $new_rows = $(html);
				$new_rows.insertAfter($init_row);

				// Apply advanced section state to each new row
				$new_rows.each(function() {
					apply_advanced_section_state_to_row($init_row, $(this));
				});
			}
		}
	} else {
		$init_row.hide();
		$init_option_rows.hide();
	}

	updated_page(); // await not possible here
}

function _get_skip_initializer_default_value(opt_name, nr) {
    if (opt_name === "seed") return get_unique_seed_for_layer(nr);
    if (opt_name === "mean") return 0;
    if (opt_name === "stddev") return 0.05;
    if (opt_name === "value") return 1;
    if (opt_name === "minval") return -0.05;
    if (opt_name === "maxval") return 0.05;
    if (opt_name === "scale") return 1;
    if (opt_name === "mode") return "fanIn";
    if (opt_name === "distribution") return "normal";
    return 1;
}

function _get_skip_initializer_sub_options_html(nr, initializer_name, section_class) {
	if (!initializer_name || !initializer_options[initializer_name]) {
		return "";
	}

	var options = initializer_options[initializer_name]["options"];
	if (!options || options.length === 0) {
		return "";
	}

	var str = "";
	var current_params = (skip_connection_settings[nr] && skip_connection_settings[nr].initializer_params) || {};

	// Determine display style: hidden if section_class is provided and section is collapsed
	var display_style = "";
	if (section_class) {
		display_style = "display: none;";
	}

	for (var i = 0; i < options.length; i++) {
		var opt_name = options[i];
		var opt_value = (opt_name in current_params) ? current_params[opt_name] : _get_skip_initializer_default_value(opt_name, nr);

		var class_attr = "skip_connection_initializer_option_tr";
		if (section_class) {
			class_attr += " " + section_class;
		}

		str += "<tr class='" + class_attr + "' style='" + display_style + "'>";
		str += "<td>" + opt_name.charAt(0).toUpperCase() + opt_name.slice(1) + ":</td>";
		str += "<td>";
		if (opt_name === "mode") {
			str += "<select class='input_field skip_connection_initializer_param_" + opt_name + "' onchange='update_skip_connection_initializer_param(find_layer_number_by_element(this), \"" + opt_name + "\", this); updated_page();'>";
			for (var mk in mode_modes) {
				var sel = (mk === ("" + opt_value)) ? " selected" : "";
				str += "<option value='" + mk + "'" + sel + ">" + mode_modes[mk] + "</option>";
			}
			str += "</select>";
		} else if (opt_name === "distribution") {
			str += "<select class='input_field skip_connection_initializer_param_" + opt_name + "' onchange='update_skip_connection_initializer_param(find_layer_number_by_element(this), \"" + opt_name + "\", this); updated_page();'>";
			for (var dk in distribution_modes) {
				var sel2 = (dk === ("" + opt_value)) ? " selected" : "";
				str += "<option value='" + dk + "'" + sel2 + ">" + distribution_modes[dk] + "</option>";
			}
			str += "</select>";
		} else {
			str += "<input class='input_field skip_connection_initializer_param_" + opt_name + "' type='number' value='" + opt_value + "' min='-3.4e+38' max='3.4e+38' onchange='update_skip_connection_initializer_param(find_layer_number_by_element(this), \"" + opt_name + "\", this); updated_page();' />";
		}
		str += "</td>";
		str += "</tr>";
	}

	return str;
}

function add_skip_connection_option(type, nr) {
	if (skip_connection_excluded_types.includes(type)) {
		return "";
	}

	var checked_attr = "";
	var current_initializer = "glorotUniform";

	/*
	if (skip_connection_settings[nr] && skip_connection_settings[nr].enabled === true) {
		checked_attr = " checked ";
	}
	*/
	if (skip_connection_settings[nr] && skip_connection_settings[nr].initializer) {
		current_initializer = skip_connection_settings[nr].initializer;
	}

	var str = "";
	str += "<tr class='skip_connection_tr'>";
	str += "<td><span class='TRANSLATEME_skip_connection'>Skip Connection</span>:</td>";
	str += "<td>";
	str += "<input type='checkbox' class='skip_connection_enabled' " + checked_attr + " onchange='toggle_skip_connection(find_layer_number_by_element(this), this)' />";
	str += "</td>";
	str += "</tr>";

	// Initializer selector row (hidden when skip is disabled)
	var init_display = checked_attr ? "" : "display:none;";
	str += "<tr class='skip_connection_initializer_tr' style='" + init_display + "'>";
	str += "<td>Skip Initializer:</td>";
	str += "<td>";
	str += "<select class='input_field skip_connection_initializer_select' onchange='update_skip_connection_initializer(find_layer_number_by_element(this), this); insert_skip_initializer_options(find_layer_number_by_element(this), this); updated_page(null, null, this, null, 1);'>";
	for (var key in initializers) {
		if (initializers.hasOwnProperty(key)) {
			var selected_attr = (key === current_initializer) ? " selected" : "";
			str += "<option value='" + key + "'" + selected_attr + ">" + initializers[key] + "</option>";
		}
	}
	str += "</select>";
	str += "</td>";
	str += "</tr>";

	// Sub-options for the skip initializer (seed, mean, stddev, etc.)
	// NOTE: We pass NO section_class here because build_advanced_section will
	// add the class to ALL <tr> elements in the advanced_str (including these).
	// The section_class is applied by build_advanced_section after this function returns.
	if (checked_attr) {
		// Pass null for section_class - build_advanced_section handles it
		str += _get_skip_initializer_sub_options_html(nr, current_initializer, null);
	}

	return str;
}

function get_skip_connection_info(layer_nr) {
    if (!skip_connection_settings[layer_nr]) {
        return { enabled: false, strength: 1.0 };
    }

    var strength = _compute_skip_strength_from_model(layer_nr);

    return {
        enabled: skip_connection_settings[layer_nr].enabled,
        strength: strength
    };
}

function update_skip_connection_strength(layer_nr, elem) {
	var val = parseFloat($(elem).val());

	if (!skip_connection_settings[layer_nr]) {
		skip_connection_settings[layer_nr] = { enabled: false, strength: val };
	}

	skip_connection_settings[layer_nr].strength = val;
	$("#skip_conn_strength_val_" + layer_nr).text(val.toFixed(2));

	updated_page(); // await not possible here
}

function update_skip_connection_strength_display(layer_nr, elem) {
	var val = parseFloat($(elem).val());
	$("#skip_conn_strength_val_" + layer_nr).text(val.toFixed(2));
}

function build_skip_connection_html(type, nr) {
	if (skip_connection_excluded_types.includes(type)) {
		return "";
	}
	return add_skip_connection_option(type, nr);
}
