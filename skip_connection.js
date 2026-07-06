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
