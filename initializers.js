"use strict";

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

function change_all_initializers (kernel_bias=["kernel_initializer_", "bias_initializer_"]) {
	var type = $("#change_initializers_selector").val();
	assert(typeof(type) == "string", "type is not string");

	try {
		kernel_bias.forEach((kernel_or_bias) => {
			var required = [];
			var error_occurred = false;
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
				error_occurred = true;
			}

			show_proper_set_all_initializer(required);

			if(!error_occurred) {
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

function set_required_seeds (required, type, kernel_or_bias, trigger=0) {
	assert(typeof(type) == "string", "type is not string");

	var values = get_initializer_set_all_values(required);

	assert(typeof(values) == "object", "values is not an object");

	for (var req_idx = 0; req_idx < required.length; req_idx++) {
		var val_key = required[req_idx];

		if(!val_key) {
			log("val_key not defined or false START");
			log("required", required);
			log("type", type);
			log("values", values);
			log("kernel_or_bias", kernel_or_bias);
			err("val_key not defined or false END");

			continue;
		}

		if(!Object.keys(values).includes(val_key)) {
			err(`${val_key} is required but not defined at all`);
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

function show_proper_set_all_initializer (required) {
	try {
		$(".set_all_initializers_tr").hide();

		for (var req_idx = 0; req_idx < required.length; req_idx++) {
			var val_key = required[req_idx];
			$(".set_all_initializers_" + val_key).show();
		}
	} catch (e) {
		if(Object.keys(e).includes("message")) {
			e = e.message;
		}

		assert(false, e);
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

function trigger_initializers () {
	$(".kernel_initializer").trigger("change");
	$(".bias_initializer").trigger("change");
}
