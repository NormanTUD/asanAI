"use strict";

function check_number_values() {
	var all_fields = document.querySelectorAll('input[type="number"]:not(.no_red_bg_when_empty)');

	var default_bg_color = $("input").css("background-color");

	var missing_values = 0;

	for (var i = 0; i < all_fields.length; i++) {
		var field = all_fields[i];
		var val = field.value;

		if (val !== "" && !is_numeric(val)) {
			if (!field.classList.contains("no_red_on_error")) {
				field.style.backgroundColor = "red";
			}
			missing_values++;
		} else if (val !== "") {
			val = parse_float(val);
			field.style.backgroundColor = default_bg_color;

			var max_attr = field.getAttribute("max");
			var min_attr = field.getAttribute("min");

			if (max_attr !== null) {
				var max = parse_float(max_attr);
				if (!isNaN(max) && val > max) {
					field.value = max;
					field.dispatchEvent(new Event("change"));
				}
			}

			if (min_attr !== null) {
				var min = parse_float(min_attr);
				if (!isNaN(min) && val < min) {
					field.value = min;
					field.dispatchEvent(new Event("change"));
				}
			}
		} else { // val === ""
			if (!field.classList.contains("no_red_on_error")) {
				field.style.backgroundColor = "red";
			}
		}
	}

	if ($data_origin === null) {
		$data_origin = document.getElementById("data_origin");
	}

	if ($data_origin && $data_origin.value === "image") {
		if (model && Object.keys(model).includes("_callHook") && model?.input?.shape?.length === 4 && model?.input?.shape[3] === 3) {
			var currently_existing_custom_images = get_custom_elements_from_webcam_page();
			if (currently_existing_custom_images.length === 0) {
				has_missing_values++;
			}
		}
	}

	if(!any_trainable_checked()) {
		missing_values += 1;
	}

	missing_values += check_all_kinds_of_inputs();

	if(get_data_origin() == "csv" && csv_has_unparsable_values) {
		missing_values++;
	}

	if (missing_values) {
		has_missing_values = true;
		disable_train();
	} else {
		has_missing_values = false;
		if (!shown_has_zero_data) {
			enable_train();
		}
	}
}

function check_all_kinds_of_inputs () {
	var ret = 0;

	ret += check_all_dilation_rates();

	ret += check_all_sizes();

	ret += check_all_target_shapes();

	ret += check_if_val_is_integer("strides_x", "Strides-X");
	ret += check_if_val_is_integer("strides_y", "Strides-Y");
	ret += check_if_val_is_integer("strides_z", "Strides-Z");

	ret += check_if_val_is_integer("kernel_size_x", "Kernel-Size-X");
	ret += check_if_val_is_integer("kernel_size_y", "Kernel-Size-Y");
	ret += check_if_val_is_integer("kernel_size_z", "Kernel-Size-Z");

	ret += check_if_val_is_integer("pool_size_x", "Pool-Size-X");
	ret += check_if_val_is_integer("pool_size_y", "Pool-Size-Y");
	ret += check_if_val_is_integer("pool_size_z", "Pool-Size-Z");

	ret += check_if_val_is_integer("filters", "Filter");

	ret += check_if_val_is_integer("units", "Units");

	ret += check_if_val_is_integer("axis", "Axis");

	ret += check_if_val_is_float_or_integer("kernel_regularizer_l1", "Kernel-Regularizer-L1");
	ret += check_if_val_is_float_or_integer("kernel_regularizer_l2", "Kernel-Regularizer-L2");

	ret += check_if_val_is_float_or_integer("bias_regularizer_l1", "Bias-Regularizer-L1");
	ret += check_if_val_is_float_or_integer("bias_regularizer_l2", "Bias-Regularizer-L2");

	ret += check_if_val_is_float_or_integer("dropout_rate", "Dropout-Rate");
	ret += check_if_val_is_float_or_integer("dropout", "Dropout-Rate");

	ret += check_if_val_is_float_or_integer("alpha", "Alpha");
	ret += check_if_val_is_float_or_integer("max_value", "Max-Value");
	ret += check_if_val_is_float_or_integer("theta", "Theta");
	ret += check_if_val_is_float_or_integer("epsilon", "Epsilon");
	ret += check_if_val_is_float_or_integer("stddev", "Standard-Deviation");
	ret += check_if_val_is_float_or_integer("dropout_seed", "Dropout-Seed");

	return ret;
}

function check_if_val_is_integer (classname, name) {
	var layer_types = get_layer_type_array();

	var missing_values = 0;

	var example_input = document.querySelector('input, select, textarea');
	var default_bg_color = $("input").css("background-color");

	const all_layer_settings = $(".layer_setting");

	for (var layer_idx = 0; layer_idx < get_number_of_layers(); layer_idx++) {
		var this_element = $(all_layer_settings[layer_idx]).find("." + classname);

		if (this_element.length) {
			var this_dilation_rate_val = this_element.val();
			var this_layer_type = layer_types[layer_idx];

			var this_val = this_element.val();

			const err_msg = `${name} is not an integer`;

			if(!isIntegerLike(this_val)) {
				this_element.css("background-color", "red");
				missing_values++;
				layer_warning_container(layer_idx, err_msg);
			} else {
				this_element.css("background-color", default_bg_color);
				remove_layer_warning(layer_idx, err_msg);
			}
		}
	}

	return missing_values;
}

function check_if_val_is_float_or_integer (classname, name) {
	var layer_types = get_layer_type_array();

	var missing_values = 0;

	var example_input = document.querySelector('input, select, textarea');
	var default_bg_color = $("input").css("background-color");

	const all_layer_settings = $(".layer_setting");

	for (var layer_idx = 0; layer_idx < get_number_of_layers(); layer_idx++) {
		var this_element = $(all_layer_settings[layer_idx]).find("." + classname);

		if (this_element.length) {
			var this_dilation_rate_val = this_element.val();
			var this_layer_type = layer_types[layer_idx];

			var this_val = this_element.val();

			const err_msg = `${name} is not an integer`;

			if(!looks_like_number(this_val)) {
				this_element.css("background-color", "red");
				missing_values++;
				layer_warning_container(layer_idx, err_msg);
			} else {
				this_element.css("background-color", default_bg_color);
				remove_layer_warning(layer_idx, err_msg);
			}
		}
	}

	return missing_values;
}

function check_all_comma_seperated(classname, name) {
	var layer_types = get_layer_type_array();

	var missing_values = 0;

	var example_input = document.querySelector('input, select, textarea');
	var default_bg_color = $("input").css("background-color");

	const all_layer_settings = $(".layer_setting");

	for (var layer_idx = 0; layer_idx < get_number_of_layers(); layer_idx++) {
		var this_element = $(all_layer_settings[layer_idx]).find("." + classname);

		if (this_element.length) {
			var this_dilation_rate_val = this_element.val();
			var this_layer_type = layer_types[layer_idx];

			var number_of_required_values = safeGetDim(this_layer_type);

			if (!number_of_required_values) {
				continue;
			}

			var err_msg = `${name} is expected to be a comma-separated list of ${number_of_required_values} integers, but it is not`;

			var value_count = this_dilation_rate_val?.split(/\s*,\s*/)?.length;

			if(value_count) {
				if (value_count !== number_of_required_values) {
					this_element.css("background-color", "red");
					missing_values++;
					layer_warning_container(layer_idx, err_msg);
				} else {
					this_element.css("background-color", default_bg_color);
					remove_layer_warning(layer_idx, err_msg);
				}
			} else {
				err(`value_count was empty`);
			}
		}
	}

	return missing_values;
}

function check_all_dilation_rates() {
	return check_all_comma_seperated("dilation_rate", "Dilation Rate");
}

function check_all_sizes() {
	return check_all_comma_seperated("size", "Sizes");
}

function check_all_target_shapes() {
	var missing_values = 0;
	var default_bg_color = $("input").css("background-color");
	var all_layer_settings = $(".layer_setting");

	for (var layer_idx = 0; layer_idx < get_number_of_layers(); layer_idx++) {
		try {
			var this_layer = $(all_layer_settings[layer_idx]);
			if (!this_layer.length) {
				continue;
			}

			var this_target_shape = this_layer.find(".target_shape");
			if (!this_target_shape.length) {
				continue;
			}

			var valid = validate_target_shape(layer_idx, this_target_shape, default_bg_color);
			if (!valid) {
				missing_values++;
			}
		} catch (err) {
			console.error("Error in check_all_target_shapes() for layer", layer_idx, err);
		}
	}

	return missing_values;
}

function validate_target_shape(layer_idx, input_element, default_bg_color) {
	var err_msg_base = "Target shape must be a comma-separated list of integers (e.g. 40,40,3).";
	var this_target_shape_val = input_element.val();
	var parsed_shape = parse_target_shape_value(this_target_shape_val);

	if (parsed_shape === null) {
		input_element.css("background-color", "red");
		layer_warning_container(layer_idx, err_msg_base);
		return false;
	}

	var target_product = parsed_shape.reduce(function (a, b) {
		return a * b;
	}, 1);

	var expected_product = get_model_input_product(layer_idx);

	if (expected_product !== null && target_product !== expected_product) {
		var err_msg_product = "Target shape product (" + target_product + 
			") does not match model input shape product (" + 
			expected_product + ")";
		input_element.css("background-color", "red");
		layer_warning_container(layer_idx, err_msg_product);
		return false;
	}

	input_element.css("background-color", default_bg_color);
	remove_layer_warning(layer_idx, err_msg_base);
	remove_layer_warning(layer_idx, "Target shape product");
	return true;
}

function parse_target_shape_value(value) {
	try {
		if (typeof value !== "string" || value.trim() === "") {
			return null;
		}

		var parts = value.split(/\s*,\s*/).filter(Boolean);
		var int_values = [];

		for (var i = 0; i < parts.length; i++) {
			var parsed = parseInt(parts[i], 10);
			if (isNaN(parsed) || parsed.toString() !== parts[i].replace(/^0+(?!$)/, "")) {
				return null;
			}
			int_values.push(parsed);
		}

		if (int_values.length === 0) {
			return null;
		}

		return int_values;
	} catch (err) {
		console.error("Error in parse_target_shape_value:", err);
		return null;
	}
}

function get_model_input_product(layer_idx) {
	try {
		if (typeof model === "undefined" || !model.layers || !model.layers[layer_idx]) {
			return null;
		}

		var layer = model.layers[layer_idx];
		if (!layer.getInputAt) {
			return null;
		}

		var shape = layer.getInputAt(0).shape;
		if (!Array.isArray(shape)) {
			return null;
		}

		var shape_values = shape.filter(function (v) {
			return typeof v === "number" && !isNaN(v);
		});

		if (shape_values.length === 0) {
			return null;
		}

		var product = shape_values.reduce(function (a, b) {
			return a * b;
		}, 1);

		return product;
	} catch (err) {
		console.error("Error in get_model_input_product for layer", layer_idx, err);
		return null;
	}
}

function isIntegerLike(value) {
	try {
		if (Number.isInteger(value)) {
			return true;
		}

		if (typeof value === 'string') {
			if (value.trim() !== value || value === '') {
				return false;
			}

			if (/^[+-]?\d+$/.test(value)) {
				var num = Number(value);
				if (Number.isInteger(num)) {
					return true;
				}
			}
		}

		return false;
	} catch (err) {
		console.error('Error in isIntegerLike:', err);
		return false;
	}
}

function looks_like_number(item) {
	if(Number.isNaN(item)) {
		return false;
	}

	if(typeof(item) == "number") {
		return true;
	}

	if (/^[+-]?(?:(?:\d+(?:\.\d+)?))$/.test(item)) {
		return true;
	}

	return false;
}

function is_numeric(str) {
	if (typeof str != "string") return false;
	if (str == "") return false;
	return !isNaN(str) && !isNaN(parse_float(str));
}
