"use strict";

async function updated_page(no_graph_restart=null, disable_auto_enable_valid_layer_types=null, item=null, no_prediction=null, no_update_initializers=null) {
	if(!finished_loading) {
		return;
	}

	var updated_page_uuid = uuidv4();

	var functionName = "updated_page"; // Specify the function name

	var last_good = get_last_good_input_shape_as_string();

	try {
		waiting_updated_page_uuids.push(updated_page_uuid);

		while (waiting_updated_page_uuids && waiting_updated_page_uuids.length && waiting_updated_page_uuids[0] != updated_page_uuid) {
			await delay(10);
		}

		var ret = await updated_page_internal(no_graph_restart, disable_auto_enable_valid_layer_types, no_prediction, no_update_initializers);

		var index = waiting_updated_page_uuids.indexOf(updated_page_uuid);

		if (index !== -1) {
			waiting_updated_page_uuids.splice(index, 1);
		} else {
			wrn("Could not find index of " + updated_page_uuid);
		}
	} catch (e) {
		var original_e = e;
		let index = waiting_updated_page_uuids.indexOf(updated_page_uuid);

		if (index !== -1) {
			waiting_updated_page_uuids.splice(index, 1);
		} else {
			err("Could not find index of " + updated_page_uuid);
		}

		await handle_page_update_error(e, last_good, original_e);

		return false;
	}

	if(!ret) {
		if(finished_loading) {
			//wrn("updated_page failed");

			if(last_good && last_good != "[]" && last_good != get_input_shape_as_string()) {
				l(language[lang]["input_size_too_small_restoring_last_known_good_config"] + " " + last_good);
				await set_input_shape(last_good, 1);
			}
		}
	}

	try {
		_temml();
	} catch (e) {
		wrn(e);
	}

	last_updated_page = Date.now();

	disable_everything_in_last_layer_enable_everyone_else_in_beginner_mode();

	show_or_hide_download_with_data();

	await restart_fcnn();

	await write_optimizer_to_math_tab();

	create_weight_surfaces();

	await plot_model_plot();

	await write_descriptions(1);

	history_of_weights_for_loss_landscape = [];

	await plot_model_plot(true);
}

var updated_page_internal = async (no_graph_restart, disable_auto_enable_valid_layer_types, no_prediction, no_update_initializers) => {
	if (_has_any_warning()) {
		return false;
	}

	rename_tmp_onchange();

	_update_bias_initializer_visibility();

	await _compile_model_or_throw();

	await _update_python_and_restart_graph(no_graph_restart);

	_reset_prev_layer_data();

	await identify_layers_or_error();

	_invalidate_layer_structure_cache();

	enable_start_training_custom_tensors();

	var wait_for_latex_model = await _maybe_write_latex(no_update_initializers);

	await last_shape_layer_warning();

	check_low_filter_warning();

	hide_no_conv_stuff();

	_stop_webcam_if_active();

	await _write_descriptions_safe();

	allow_training();

	_maybe_show_prediction(no_prediction);

	await wait_for_latex_model;

	await _maybe_predict_handdrawn();

	show_or_hide_beginner_or_expert_mode_stuff();

	allow_editable_labels(); // await not useful here

	await _maybe_update_initializers(no_update_initializers);

	return true;
};

async function _compile_model_or_throw() {
	try {
		await compile_model();
	} catch (e) {
		if (Object.keys(e).includes("message")) {
			e = e.message;
		}

		log(e);
		log(language[lang]["there_was_an_error_compiling_the_model"] + ": " + e);
		throw new Error(e);
	}
}

async function _update_python_and_restart_graph(no_graph_restart) {
	var redo_graph = await update_python_code(1);

	if (model && redo_graph && !no_graph_restart) {
		await restart_fcnn(1);
	}
}

async function handle_page_update_error(e, last_good, original_e) {
	if(Object.keys(e).includes("message")) {
		e = e.message;
	}

	if(("" + e).includes("There are zeroes in the output shape") || ("" + e).includes("Negative dimension size caused")) {
		l(language[lang]["input_size_too_small_restoring_last_known_good_config"] + " " + last_good);
		if(last_good && last_good != "[]" && last_good != get_input_shape_as_string()) {
			await set_input_shape(last_good, 1);
		}
	} else if(("" + e).includes("Cannot read properties of undefined (reading 'predict')") || ("" + e).includes("Cannot read properties of undefined")) {
		if (e instanceof Error) {
			wrn("[updated_page] " + e.message + "\n" + e.stack);
		} else {
			wrn("[updated_page] " + JSON.stringify(e));
		}
	} else if(("" + e).includes("out of memory")) {
		await write_error("" + e, null, null);
	} else if(("" + e).includes("model.layers[i]")) {
		dbg("[updated_page] model.layers[i] is undefined");
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
		err("Stack:", original_e.stack);
		throw new Error("" + e);
	}
}

async function update_page_and_show_time() {
	l(language[lang]["updating_page"]);
	var start_t = Date.now();
	await updated_page(null, null, null, 1);
	var end_t = Date.now();
	var runtime = (end_t - start_t) / 1000;
	var hrt = human_readable_time(runtime);
	if(hrt) {
		l(language[lang]["page_update_took"] + " " + hrt);
	}
}

async function wait_for_updated_page_if_page_finished_loading (x) {
	if(finished_loading) {
		await wait_for_updated_page(x);
	}
}

async function wait_for_updated_page(seconds) {
	let waited = 0;
	while (waiting_updated_page_uuids.length) {
		if (waited % 2000 === 0 && waited > 0) {
			dbg("Still waiting for updated page... waited " + (waited / 1000) + " seconds so far");
		}
		await delay(10);
		waited += 10;
		if (waited >= seconds * 1000) {
			dbg("Timeout reached after " + seconds + " seconds, stopping wait");
			break;
		}
	}
}
