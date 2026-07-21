"use strict";

async function reset_labels () {
	await set_labels([], 1);
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
		wrn(language[lang]["arr_is_an_array_but_empty"]);
		return;
	}

	if(get_shape_from_array(arr).length != 1 && !force_allow_empty) {
		err(language[lang]["arr_is_an_array_but_multidimensional_it_needs_to_be_one_dimensional"]);
		return;
	}

	if(!model) {
		if(finished_loading) {
			dbg("set_labels: something may be wrong: " + language[lang]["model_is_not_defined"]);
		} else {
			dbg("set_labels: " + language[lang]["model_is_not_defined"]);
		}
		return;
	}

	for (var arr_idx = 0; arr_idx < arr.length; arr_idx++) {
		if(typeof(arr[arr_idx]) != "string") {
			err(`typeof(arr[${arr_idx}]) is not a string but ${typeof(arr[arr_idx])}. Cannot continue. All values must be strings.`);
			return;
		}
	}

	var old_array_string = JSON.stringify(labels);
	var new_array_string = JSON.stringify(arr);

	labels = arr;
	dbg(`${language[lang]["set_labels"]} = [${arr.join(", ")}]`);

	var nr_of_layer = model?.layers?.length;
	if(!nr_of_layer) {
		return null;
	}

	var last_layer_nr = nr_of_layer - 1;
	var last_layer = model?.layers[last_layer_nr];
	if(!last_layer) {
		dbg("Could not get last layer");
		return;
	}
	var last_layer_type = get_last_layer_classname();

	var mos = last_layer.getOutputAt(0).shape;
	var last_layer_activation = last_layer.getConfig()["activation"];

	if(mos[0] === null && mos.length == 2 && last_layer_activation == "softmax" && last_layer_type == "Dense") {
		var model_number_output_categories = mos[1];
		var new_number_output_neurons = arr.length;

		if(new_number_output_neurons && model_number_output_categories != new_number_output_neurons && !is_setting_config) {
			dbg(`set_item_value(${last_layer_nr}, "units", ${new_number_output_neurons})`);
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
		}
	} else {
		dbg(language[lang]["cannot_autoset_layer_errors"] + " " + _get_debug_msg_for_set_labels(mos, last_layer_activation, last_layer_type));

		return;
	}
}

function download_labels_json () {
	download("labels.json", JSON.stringify(labels));
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

async function allow_editable_labels () {
	if(editable_labels_queued) {
		return;
	}

	editable_labels_queued = true;

	while (started_training) {
		await delay(200);
	}

	$(".label_element").each((i, x) => {
		var label_index = parse_int($(x).parent().parent().find(".label_element").index(x)) % labels.length;

		if(!labels.length) {
			return;
		}

		try {
			var tmp_label = labels[label_index];
			if(tmp_label === undefined) {
				wrn("[allow_editable_labels] tmp_label undefined");
				return;
			}

			if(label_index === undefined) {
				let tmp_label = $(x).text();
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

	editable_labels_queued = false;
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

function _get_debug_msg_for_set_labels (mos, last_layer_activation, last_layer_type) {
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

	return msg;
}

function label_debugger_icon_ok() {
	try {
		let icon = $("#label_debugger_icon");

		if (!model_meta || is_setting_config) {
			return icon.html("").hide();
		}

		if (model_meta.last_layer_activation !== "softmax") {
			return icon.html("").hide();
		}

		if (labels.length) {
			return icon.html("").hide();
		}

		let is_dense_softmax =
			Array.isArray(model_meta.last_layer_shape) &&
			model_meta.last_layer_shape.length === 2 &&
			typeof model_meta.last_layer_name === "string" &&
			model_meta.last_layer_name.startsWith("dense");

		if (is_dense_softmax) {
			icon.html("<span style='background-color: orange; color: black;'>" + language[lang]["no_labels"] + "</span>").show();
		} else {
			icon.html("").hide();
		}
	} catch (e) {
		err(e?.message || e);
		$("#label_debugger_icon").html("").hide();
	}
}
