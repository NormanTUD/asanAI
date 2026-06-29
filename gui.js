"use strict";

function mark_start_stop_training() {
	var el = document.getElementById('start_stop_training');
	if (!el) return console.error('no element #start_stop_training');
	el.classList.add('mark_red_and_blink');
}

function unmark_start_stop_training() {
	var el = document.getElementById('start_stop_training');
	if (!el) return console.error('no element #start_stop_training');
	el.classList.remove('mark_red_and_blink');
}

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

function enable_train() {
	if(!is_custom_data_and_has_custom_data()) {
		return;
	}

	$(".train_neural_network_button").prop("disabled", false);
	$(".retrain_neural_network_button").prop("disabled", false);
}

function disable_train() {
	$(".train_neural_network_button").prop("disabled", true);
	$(".retrain_neural_network_button").prop("disabled", true);
}

function get_key_from_path(_array, keypath) {
	if (keypath.length == 0) {
		return _array;
	}

	var this_key = undefined;
	var tmp = _array;

	for (var keypath_idx = 0; keypath_idx < keypath.length; keypath_idx++) {
		this_key = keypath[keypath_idx];
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

	var input_shape_line = file?.split("\n")[0];
	if(!input_shape_line) {
		err("input_shape_line was empty or undefined");
		return [];
	}
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

	var input_shape_line = file?.split("\n")[0];
	if(!input_shape_line) {
		err("input_shape_line was empty or undefined");
	}
	var shape_match = /^#\s*shape\s*:?\s*\(\d+,?\s*(.*)\)$/.exec(input_shape_line);

	assert(shape_match !== null, "shape_match is null");

	if (1 in shape_match) {
		return shape_match[1];
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
		var id = x.id ?? "";
		var cls = x.className ?? "";
		var val = x.value ?? "";
		var chk = (typeof x.checked !== "undefined" ? x.checked : "");
		html_code += ";;;;;;;" + id + ";;;;" + cls + "=" + val + ";;;;" + chk;
	});

	if(use_weights) {
		html_code += get_weights_as_string();
	}

	var new_status_hash = await md5(html_code);

	last_status_hash = new_status_hash;

	return new_status_hash;
}

function is_numeric(str) {
	if (typeof str != "string") return false;
	if (str == "") return false;
	return !isNaN(str) && !isNaN(parse_float(str));
}

function set_last_layer_activation_function (activation_function) {
	assert(Object.keys(activations).includes(activation_function), "activation function " + activation_function + " is invalid. Must be one of these: " + Object.keys(activations).join(", "));

	var last_layer_nr = $(".layer_type").length - 1;
	var activation_item = $($(".layer_options_internal")[last_layer_nr]).find(".activation");
	if(activation_item.val() != activation_function) {
		activation_item.val(activation_function).trigger("change");
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
		top: last_mouse_y + 'px',
		left: last_mouse_x + 'px',
		transform: 'translate(-50%, -50%)',
		fontSize: '1.5em',
		opacity: 0,
		zIndex: 9999,
		pointerEvents: 'none',
		transition: 'opacity 0.2s ease-in-out, transform 0.3s ease-out'
	});
	$('body').append(feedback);
	setTimeout(() => feedback.css('opacity', 1), 0);
	setTimeout(() => feedback.css('opacity', 0), 300);
	setTimeout(() => feedback.remove(), 600);
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
		show_data_plotter();
		show_layer_visualization_tab();
	} else {
		$("#show_kernel_images").prop("disabled", true);
		hide_data_plotter();
		hide_layer_visualization_tab();
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
		model = await create_model(model, undefined);
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

	log("Changed width or height");
}

function generateOnesString(inputString) {
	typeassert(inputString, string, "inputString");
	return (inputString.toLowerCase().match(/\d+/g) || []).map(number => "1,".repeat(parse_int(number))).join("").replace(/,$/, "");
}

function get_data_origin() {
	return $("#data_origin").val();
}

function show_python_container() {
	$("#pythoncontainer").show();
}

function set_code(selector, code) {
	var el = $(selector);

	if (!el.data("original")) {
		el.data("original", code);
	}

	el.text(code).show();
}

function init_highlight_observer() {
	if (_highlight_observer) return;
	_highlight_observer = new IntersectionObserver(function(entries) {
		entries.forEach(function(e) {
			if (!e.isIntersecting) return;
			var sel = e.target.getAttribute("data-highlight-sel");
			if (!_highlight_debounce[sel]) return;

			clearTimeout(_highlight_debounce[sel]);
			_highlight_debounce[sel] = setTimeout(function() {
				highlight_code().then(function() { // await not possible here
					$(sel).addClass("highlighted");
				});
			}, 100);

			_highlight_observer.unobserve(e.target);
		});
	});
}

async function highlight_if_needed(selector) {
	var el = $(selector);
	if (!el.length) return;

	if (!el.hasClass("highlighted") || el.data("original") !== el.text()) {
		init_highlight_observer();
		el[0].setAttribute("data-highlight-sel", selector);

		clearTimeout(_highlight_debounce[selector]);
		_highlight_debounce[selector] = setTimeout(function() {
			_highlight_observer.observe(el[0]);
		}, 80);
	}
}

function hide_no_conv_stuff() {
	var any_conv_visualizations = 0;

	if(model) {
		if(Object.keys(model).includes("layers")) {
			var nr_of_layer = model?.layers?.length;
			if(!nr_of_layer) {
				return null;
			}

			for (var layer_idx = 0; layer_idx < nr_of_layer; layer_idx++) {
				if (model?.layers[layer_idx].name.startsWith("conv")) {
					any_conv_visualizations++;
				}
			}
		}
	}

	if (any_conv_visualizations) {
		hide_conv_visualizations();
	} else {
		show_conv_visualizations();
		hide_data_plotter();
	}

	if(input_shape_is_image()) {
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
	if (!Array.isArray(a)) {
		throw new TypeError(`Not an array: ${typeof a}`);
	}

	const dim = [];
	let current = a;
	while (true) {
		dim.push(current.length);
		const first = current[0];
		if (!Array.isArray(first)) {
			break;
		}
		current = first;
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

function stop_webcam_if_cam() {
	if (cam) {
		stop_webcam();
	}
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

function _reset_prev_layer_data() {
	prev_layer_data = [];
}

function _invalidate_layer_structure_cache() {
	layer_structure_cache = null;
}

async function _maybe_write_latex(no_update_initializers) {
	if (!no_update_math) {
		return await write_model_to_latex_to_page();
	}
	return Promise.resolve(1);
}

function _stop_webcam_if_active() {
	stop_webcam_if_cam();
}

async function _write_descriptions_safe() {
	try {
		await write_descriptions();
	} catch (e) {
		wrn(e);
	}
}

function _maybe_show_prediction(no_prediction) {
	if (!no_prediction) {
		show_prediction(1, 1); // await not desired here
	}
}

async function _maybe_predict_handdrawn() {
	if (atrament_data.sketcher && input_shape_is_image()) {
		try {
			await predict_handdrawn();
		} catch (e) {
			if (("" + e).includes("but got array with shape")) {
				var _err = "This may have happened when you change the model input size while prediction. In which case, it is a harmless error.";
				wrn("[updated_page_internal] " + _err);
				l(_err);
			} else {
				throw new Error(e);
			}
		}
	}
}

async function _maybe_update_initializers(no_update_initializers) {
	if (!no_update_initializers) {
		await update_initializers();
	}
}

async function identify_layers_or_error () {
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
}

function show_or_hide_beginner_or_expert_mode_stuff() {
	if(mode == "beginner") {
		$(".expert_mode_only").hide();
	} else {
		$(".expert_mode_only").show();
	}
}

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

function show_or_hide_download_with_data() {
	let show = true;
	let messages = [];

	try {
		if (get_loss() !== "categoricalCrossentropy") {
			messages.push(language[lang]["download_with_data_disabled_because_the_loss_is_not_categorical_cross_entropy"]);
			show = false;
		}
		if (!is_classification) {
			messages.push(language[lang]["download_with_data_disabled_because_not_classification_problem"]);
			show = false;
		}
		if (!model) {
			messages.push(language[lang]["download_with_data_disabled_because_no_model"]);
			show = false;
		}
		if (!model?.layers?.length) {
			messages.push(language[lang]["download_with_data_disabled_because_no_layers"]);
			show = false;
		}
		if (model?.layers?.[0]?.input?.shape?.length !== 4) {
			messages.push(`${language[lang]["download_with_data_disabled_input_shape_doesnt_have_four_elements"]}: ${JSON.stringify(model?.layers?.[0]?.input?.shape)}`);
			show = false;
		}
		if (model?.layers?.[model?.layers?.length - 1]?.input?.shape?.length !== 2) {
			messages.push(`${language[lang]["download_with_data_disabled_input_shape_doesnt_have_two_elements"]}: ${JSON.stringify(model?.layers?.[model?.layers?.length - 1]?.input?.shape)}`);
			show = false;
		}

		const merged_msg = messages.join("\n");

		if(merged_msg != last_show_or_hide_msg) {
			if (messages.length) dbg(merged_msg);

			last_show_or_hide_msg = merged_msg;
		}

	} catch (e) {
		wrn((e?.message || e) + ". Disabling 'download with data'-button");
		show = false;
	}

	$("#download_with_data").toggle(show);
}

async function change_optimizer() {
	var type = get_optimizer();
	$(".optimizer_metadata").hide();

	$("#" + type + "_metadata").show();

	await updated_page();

	await get_model_data();
}

function set_momentum(val) {
	$("#momentum_" + get_optimizer()).val(val);
}

function set_validation_split(val) {
	assert(typeof(val) == "number" || is_numeric(val), val + " is not an number but " + typeof(number));
	val = parse_int(val);

	l(language[lang]["set_val_split_to"] + val);
	$("#validationSplit").val(val);

	//set_get("validation_split", val);
}

function set_epsilon(val) {
	$("#epsilon_" + get_optimizer()).val(val);
}

function set_decay(val) {
	$("#decay_" + get_optimizer()).val(val);
}

function set_rho(val) {
	$("#rho_" + get_optimizer()).val(val);
}

function set_learning_rate(val) {
	$("#learningRate_" + get_optimizer()).val(val);
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
				padding:6px 8px;z-index:9999;border:1px solid rgba(255,255,255,0.2);\
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

	if(get_metric() != val) {
		$("#metric").val(val);
		if(trigger_change) {
			$("#metric").trigger("change");
		}
	}
}

function get_metric() {
	return $("#metric").val();
}

function get_loss() {
	return $("#loss").val();
}

function get_optimizer() {
	return $("#optimizer").val();
}

function set_loss(val, trigger_change = 1) {
	l(language[lang]["set_loss_to"] + val);

	assert(losses.includes(val), loss + " is not a valid loss. It must be in " + losses.join(", "));
	assert(typeof(val) == "string", val + " is not an string but " + typeof(val));

	const $loss = $("#loss");

	if(get_loss() != val) {
		$loss.val(val);
		if(trigger_change) {
			$loss.trigger("change");
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

function make_pooling_visual_explanation() { 
	make_pooling_visualizer(".maxpooling_visual_explanation", {poolingType: "max"}); 
	make_pooling_visualizer(".averagepooling_visual_explanation", { poolingType: 'avg' }); 
}

function make_layer_normalization_visual_explanation() {
	window.make_layernorm_visual_explanation('.layernorm_visual_explanation', {
		gridRows: 3,
		gridCols: 3
	});
}

function _make_upsampling_visualizer() {
	make_upsampling_visualizer('.upsampling_visual_explanation', {
		gridSize: 2,
		upFactor: 2,
		maxWidth: 200
	});
}

async function show_visual_explanations(wd) {
	make_conv_visual_explanation();
	make_flatten_visual_explanation();
	make_dense_visual_explanation();
	make_dropout_visual_explanation();
	make_pooling_visual_explanation();
	make_layer_normalization_visual_explanation();
	_make_upsampling_visualizer();
	make_activation_visual_explanation();
	make_conv_transpose_visualizer();
	make_gaussian_noise_visualizer(".gaussiannoise_visualizer");
	make_depthwise_conv_visualizer(".depthwise_conv_visualizer");
	make_separable_conv_visualizer(".separable_conv_visualizer");

	make_reshape_visualizer('.reshape_demo');

	if(wd) {
		await write_descriptions(1);
	}
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

function reset_photo_gallery() {
	$("#photoscontainer").hide();
	document.getElementById("photos").innerHTML = "";
}

function set_optimizer_special_sgd_rmsprop_from_config(config) {
	if (["sgd", "rmsprop"].includes(config["optimizer"])) {
		set_learning_rate(config["learningRate"]);
	}
}

function set_optimizer_special_rmsprop_from_config(config) {
	if (config["optimizer"] == "rmsprop") {
		l(language[lang]["setting_optimizer_to_rmsprop"]);
		set_rho(config["rho"]);
		set_decay(config["decay"]);
		set_epsilon(config["epsilon"]);
	}
}

function set_optimizer_special_momentum_rmsprop_from_config(config) {
	if (["momentum", "rmsprop"].includes(config["optimizer"])) {
		set_momentum(config["momentum"]);
	}
}

function remove_confusion_matrix () {
	$("#confusion_matrix").remove();
}

async function wait_for_updated_page_if_page_finished_loading (x) {
	if(finished_loading) {
		await wait_for_updated_page(x);
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

async function dispose_if_exists(element) {
	if(element) {
		await dispose(element);
	}
}

function trigger_initializers () {
	$(".kernel_initializer").trigger("change");
	$(".bias_initializer").trigger("change");
}

function show_or_hide_photos_depending_on_if_index(index) {
	if(!index) {
		if(input_shape_is_image()) {
			$("#photos").show();
			$("#xy_display_data").hide();
		} else {
			$("#photos").hide();
			$("#xy_display_data").show();
		}
	}
}

async function wait_for_updated_page(seconds) {
	dbg("Started waiting for updated page...");

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

	dbg("Finished waiting for updated page.");
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

function hide_prediction_non_image () {
	$("#prediction_non_image").html("").hide();
}

function init_weight_file_list() {
	$("#model_dataset").find("option").remove();

	var chosen_dataset = $("#dataset").find(":selected").text();

	var this_struct = traindata_struct[chosen_dataset]["weights_file"];

	var weight_files = Object.keys(this_struct);

	for (var weight_idx = 0; weight_idx < weight_files.length; weight_idx++) {
		var new_option = $("<option>", { value: weight_files[weight_idx], text: weight_files[weight_idx] });
		$("#model_dataset").append(new_option);
	}

	hide_dataset_when_only_one();
}

function set_x_file (val) {
	//logt(`Setting X file to ${val}`)
	x_file = val;
}

function set_y_file (val) {
	//logt(`Setting Y file to ${val}`)
	y_file = val;
}

function toggle_items(items, visible) {
	for (var item_idx = 0; item_idx < items.length; item_idx++) {
		var item_name = items[item_idx];
		var target = item_name.endsWith(".parent")
			? $("#" + item_name.replace(/\.parent/, "")).parent()
			: $("#" + item_name);
		visible ? target.show() : target.hide();
	}
}

async function clean_gui() {
	reset_summary();
	await write_descriptions();
}

async function set_input_shape(val, force=0) {
	assert(typeof(val) == "string", "set_input_shape(" + val + "), val is not string, but " + typeof(val));

	if(force && input_shape_is_image()) {
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
		if(model && typeof(model?.input?.shape) == "object") {
			return model?.input?.shape.filter(n => n);
		} else {
			return [];
		}
	}
}

async function change_metrics() {
	var new_metric = get_metric();

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
		for (var activations_setting_idx = 0; activations_setting_idx < activations_setting.length - 1; activations_setting_idx++) {
			$(activations_setting[activations_setting_idx]).val(chosen_value).trigger("change");
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

function sources_popup() {
	open_popup("sources_popup");
}

async function manage_download() {
	if(!get_cookie("session_id") === null) {
		await save_model();
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
					document.getElementById("save_model_msg").innerHTML = "";
				} else {
					color_msg_red("save_model_msg");
					document.getElementById("save_model_msg").innerText = "Please choose a different network name. There is already a network with this name.";
				}
			}
		});
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

function open_save_model_dialog() {
	open_popup("save_model_dialog");
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

	model = await loadLayersModel(iobrowserFiles([modelUpload.files[0], weightsUpload.files[0]]));

	$("#predictcontainer").show();
	$("a[href=\"#predict_tab\"]").click();

	await repredict();
}

async function get_custom_tensor_string_x (evt) {
	if(debug_custom_tensor_x == "") {
		return evt.target.files[0].text();
	}

	return debug_custom_tensor_x;
}

async function get_custom_tensor_string_y (evt) {
	if(debug_custom_tensor_y == "") {
		return evt.target.files[0].text();
	}

	return debug_custom_tensor_y;
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

	for (var parent_idx = 0; parent_idx < parents.length; parent_idx++) {
		if ($(parents[parent_idx]).css("display") == "none") {
			return true;
		}
	}

	return false;
}

async function set_height(new_val) {
	if(!looks_like_number(new_val)) {
		err(`set_height(${new_val}) does not look like a number`);
		return;
	}

	if (!Number.isInteger(Number(new_val))) {
		err(`set_height(${new_val}) is not an integer`);
		return;
	}

	$("#height").val(new_val);
	await change_height();
}

async function set_width(new_val) {
	if(!looks_like_number(new_val)) {
		err(`set_width(${new_val}) does not look like a number`);
		return;
	}

	if (!Number.isInteger(Number(new_val))) {
		err(`set_width(${new_val}) is not an integer`);
		return;
	}

	$("#width").val(new_val);
	await change_width();
}

async function update_input_shape() {
	await set_input_shape("[" + get_input_shape().join() + "]");
	layer_structure_cache = null;
	await updated_page();
	if(input_shape_is_image()) {
		var this_shape = get_input_shape();
		$("#width").val(this_shape[1]);
		$("#height").val(this_shape[0]);
		await change_width();
		await change_height();
	}

	await highlight_code();

	await predict_own_data_and_repredict();
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

function set_loss_and_metric_if_not_already_set(val) {
	if(get_loss() != val) {
		set_loss(val, 1);
	}

	if(get_metric() != val) {
		set_metric(val, 1);
	}
}

function set_is_classification () {
	if(get_loss() == "categoricalCrossentropy") {
		is_classification = true;
	} else {
		is_classification = false;
	}
}

async function last_shape_layer_warning() {
	if ($("#data_origin").val() == "image") {
		if (!model) {
			log("last_layer_shape_warning is waiting for the model...");
			await wait_for_model();
		}

		if (model.outputShape.length == 2) {
			delete_custom_drawing_layer();
			$("#last_layer_shape_warning").html("");
		} else {
			if (model.outputShape.length != 4) {
				var n = $(".own_image_label").length;
				$("#last_layer_shape_warning").html("<h3>The last layer's output shape's length is neither 2 (for classification) nor 4 (for segmentation). Please add a flatten-layer somewhere before the output layer (which has to be Dense) to allow classification into " + n + " categories. Training will not be possible otherwise.</h3>");
			} else {
				$("#last_layer_shape_warning").html("");

				await ensure_custom_image_layers();

				set_loss_and_metric_if_not_already_set("meanSquaredError");

				await change_last_responsible_layer_for_image_output();

				$("#validationSplit").val(0);
			}
		}
	} else {
		$("#last_layer_shape_warning").html("");
	}

	set_is_classification();
}

function set_shown_advanced(shown) {
	for (var shown_idx = 0; shown_idx < shown.length; shown_idx++) {
		if (shown[shown_idx]) {
			$($(".layer_options_internal")[shown_idx]).css("display", "table-row-group");
		} else {
			$($(".layer_options_internal")[shown_idx]).css("display", "none");
		}
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
			dbg("[_tensor_print_to_string] tensor to be printed was already disposed");
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
		$(".retrain_neural_network_button").html("<span class='TRANSLATEME_start_training_from_scratch'></span>").removeClass("stop_training").addClass("start_training");

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

function get_layer_regularizer_config(layer_nr, regularizer_type) {
	assert(valid_initializer_types.includes(regularizer_type), "insert_regularizer_trs(layer_nr, " + regularizer_type + ") is not a valid regularizer_type (2nd option)");
	assert(typeof(layer_nr) == "number", `get_layer_regularizer_config(${layer_nr}, ${regularizer_type}), layer_nr is not an integer but ${typeof(layer_nr)}`);

	var starts_with_string = regularizer_type + "_regularizer_";

	var this_regularizer_options = $($(".layer_setting")[layer_nr]).find("." + regularizer_type + "_regularizer_tr").find(".input_data");

	var option_hash = {};

	for (var regularizer_idx = 0; regularizer_idx < this_regularizer_options.length; regularizer_idx++) {
		var this_option = this_regularizer_options[regularizer_idx];
		var classList = this_option?.className?.split(/\s+/);

		if(classList) {
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
		} else {
			err(`classList was empty`);
		}
	}

	return option_hash;
}

function set_this_option_or_error (this_option) {
	if(this_option.type == "number") {
		wrn("Wrong value for element, using default = 1");
		$(this_option).val(1);
	} else {
		err("ERROR in ", this_option);
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

	data_origin = $("#data_origin").val();
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
	$("#toggle_layer_view_button").html("<img class='invert_in_dark_mode' src='_gui/maximize.svg' width=20 />");
}

function hide_layer_view () {
	$("#layers_container_left").hide();
	$(".descriptions_of_layers").hide();
	$("#toggle_layer_view_button").html("<img class='invert_in_dark_mode' src='_gui/minimize.svg' width=20 />");
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

	seconds = parse_int(seconds);

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

function hide_tab_label(label) {
	assert(typeof(label) == "string", "label is not a string");

	$("#" + label).parent().hide();
	var children = $("#" + label).parent().parent().children();

	var currently_selected = null;
	var first_displayable = null;

	for (var child_idx = 0; child_idx <= children.length; child_idx++) {
		if (!currently_selected && $(children[child_idx]).attr("aria-expanded") == "true") {
			currently_selected = children[child_idx];
		}

		if (!first_displayable && $(children[child_idx]).css("display") != "none") {
			first_displayable = children[child_idx];
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

function show_tab_label(label, click=0) {
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

function getDimFromString(input) {
	if (typeof input !== "string") {
		throw new TypeError("getDimFromString expects a string.");
	}

	var regex = /(\d+)[dD]/g;
	var match = regex.exec(input);

	if (match && match[1] !== undefined) {
		var parsed = parseInt(match[1], 10);
		if (Number.isNaN(parsed)) {
			throw new Error("Error at parsing the input number.");
		}
		return parsed;
	}

	return null;
}

function safeGetDim(input) {
	try {
		return getDimFromString(input);
	} catch (err) {
		if (typeof console !== "undefined" && typeof console.error === "function") {
			console.error("safeGetDim: error:", err && err.message ? err.message : err);
		}
		return null;
	}
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

function check_all_sizes() {
	return check_all_comma_seperated("size", "Sizes");
}

function check_all_dilation_rates() {
	return check_all_comma_seperated("dilation_rate", "Dilation Rate");
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
	var ca = document?.cookie?.split(";");

	if(!ca) {
		return null;
	}

	for(var ca_idx = 0; ca_idx < ca.length; ca_idx++) {
		var c = ca[ca_idx];
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
	for (var select_idx = 0; select_idx < selects.length; select_idx ++) {
		var sink = $(selects[select_idx]);
		var sink_id = sink.attr("id");

		var origin = $("#" + $(selects[select_idx]).data("from_and_to"));
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
	for (var input_idx = 0; input_idx < inputs.length; input_idx++) {
		var sink = $(inputs[input_idx]);
		var origin = $("#" + $(inputs[input_idx]).data("from_and_to"));
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
			var _load_time = new Date().toLocaleString();
			_load_time = _load_time.replace(/ GMT.*/, "");
			msg = ("" + msg).replace(/^(Error:\s*)+/, "Error: ");
			$("#log").prepend(_load_time + ": " + msg + "\n");
			last_l = msg;
			if(msg.toString().startsWith("ERROR:") || msg.toString().startsWith("TypeError:")) {
				err(msg);
				msg = "<span style='color: red'>" + msg + "</span>";
			}
			$("#status_bar_log").html(msg);
		}
	} catch (e) {
		err("Some thing went wrong with the `l` function: " + e);
	}
}

async function set_custom_image_training () {
	close_popups();

	labels = [];

	if($("#data_origin").val() != "image") {
		$("#data_origin").val("image").trigger("change");
	}

	await rename_labels();
}

async function get_data_from_webcam_if_possible(){
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
		}
	} else {
		dbg("cam is defined, not trying to show it again");
	}
}

async function set_custom_webcam_training_data() {
	close_popups();

	labels = [];

	dbg("Init webcams");
	await init_webcams();

	if($("#data_origin").val() != "image") {
		$.when($("#data_origin").val("image").trigger("change")).done(get_data_from_webcam_if_possible);
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

	await rename_labels();
}

async function toggle_layers() {
	$(".left_side").toggle();

	await write_descriptions(1);
}

async function get_available_cams () {
	var webcams = [];
	var ids = [];

	await navigator.mediaDevices.enumerateDevices().then(function (devices) {
		for(var device_idx = 0; device_idx < devices.length; device_idx++){
			var device = devices[device_idx];
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
	try {
		const codeBlocks = document.querySelectorAll('code[class*="language-"], [class*="language-"] code, [class*="lang-"] code');
		const promises = [];

		for (const block of codeBlocks) {
			// Prüfen, ob schon Tokens eingefügt wurden
			// (Prism fügt <span class="token ..."> hinzu)
			if (block.querySelector('span.token')) {
				// Schon gehighlighted → überspringen
				continue;
			}

			// Wenn kein Token vorhanden, highlight ausführen
			promises.push(new Promise(resolve => {
				try {
					Prism.highlightElement(block, false, () => {
						block.dataset.highlighted = "true";
						resolve(true);
					});
				} catch (e) {
					console.error("Highlight failed:", e);
					resolve(false);
				}
			}));
		}

		await Promise.all(promises);
		return true;
	} catch (err) {
		console.error("highlight_code_fast failed:", err);
		return false;
	}
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

	return $activation_layer.val();
}

function get_last_layer_activation_function() {
	var container = document.getElementById("layers_container");
	var children = container.children;
	if (!children.length) return null;
	var last_layer = children[children.length - 1];
	var activation = last_layer.querySelector(".activation");
	return activation ? activation.value : null;
}

function dataURLToBlob(dataURL) {
	try {
		var parts = dataURL?.split(";base64,");

		if(!parts) {
			err(`dataURLToBlob: dataURL was none or undefined`);
			return;
		}

		var contentType = parts[0].split(":")[1];
		var raw = window.atob(parts[1]);
		var rawLength = raw.length;
		var uInt8Array = new Uint8Array(rawLength);

		for (var rawLength_idx = 0; rawLength_idx < rawLength; ++rawLength_idx) {
			uInt8Array[rawLength_idx] = raw.charCodeAt(rawLength_idx);
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
		wrn(`clear_attrament("${idname}"): idname = "${idname}" (type: ${typeof(idname)})not found`);
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
                        $("body").addClass("darkmode");
                } else {
                        $("#asanai_main_logo").attr("src", "_gui/logo_small.png");
                        $("body").removeClass("darkmode");
                }

                is_already_inverted_in_dark_mode = is_dark_mode;

                create_weight_surfaces(1);
        }
}

function green_marker (element) {
	$(element).parent().parent().find(".green_icon").removeClass("green_icon");
	$(element).addClass("green_icon");
}

function atrament_set_brush (t, idname) {
	atrament_data[idname]['atrament'].mode = 'brush';
	$(t).parent().find('.pen_size_slider').show();
	$(t).parent().find('.jscolor').show();
	green_marker(t);
	hide_colorpicker_for_eraser(idname);
}

function atrament_set_fill(t, idname) {
	atrament_data[idname]['atrament'].mode = 'fill';
	$(t).parent().find('.pen_size_slider').hide();
	$(t).parent().find('.jscolor').show();
	green_marker(t);
	hide_colorpicker_for_eraser(idname);
}

function setup_atrament_data(idname, customfunc) {
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
		err("Cannot find element e: " + e);
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
	await write_model_to_latex_to_page();
	_temml();
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

	for (var c_idx = 0; c_idx < c.length; c_idx++) {
		if($(c[c_idx]).css("display") != "none") {
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

function disable_everything_in_last_layer_enable_everyone_else_in_beginner_mode () {
	try {
		if(model && !(model.isTraining || started_training)) {
			enable_every_layer();
		}

		if(mode == "beginner") {
			var last_element_nr = $(".layer_setting").length - 1;
			var last_layer_setting = $($(".layer_setting")[last_element_nr]);

			const $last_config_table = $($(".configtable")[$(".configtable").length - 1]);

			$last_config_table.find("input,select,button").prop("disabled", true);

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
			icon.html("<span style='background-color: orange; color: black;'>[No labels]</span>").show();
		} else {
			icon.html("").hide();
		}
	} catch (e) {
		err(e?.message || e);
		$("#label_debugger_icon").html("").hide();
	}
}

function model_is_ok () {
	if(!model_is_ok_icon || !finished_loading) {
		return;
	}

	var green = "<img src='_gui/green.svg' height=12 />";
	var red = "<img src='_gui/red.svg' height=12 />";
	var orange = "<img src='_gui/orange.svg' height=12 />";

	var color = green;

	if(!lang) {
		err("lang is not defined! Something is seriously wrong here...");
		return;
	}

	if(!language) {
		err("language is not defined! Something is seriously wrong here...");
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

		const nr_of_layers_in_gui = $("#layers_container").find("li").length;
		const nr_of_layers_in_model = model?.layers?.length;

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
		} else if(nr_of_layers_in_gui != nr_of_layers_in_model) {
			color = red;
			msg = `${language[lang]["different_number_layers_gui_model"]} (GUI: ${nr_of_layers_in_gui}, ${language[lang]["model"]}: ${nr_of_layers_in_model}).`;
		}
	} catch (e) {
		color = red;
		msg = "" + e;
		err("model_is_ok: " + msg);
	}

	var _content = `${color}`;

	_content = add_symbols_to_model_is_ok_content(_content, color, green);

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
			dbg("[model_is_ok] something may be wrong: " + msg);
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

	ribbon_shower_hack();

	set_model_is_ok_icon_color(color, red, green, orange);

	if(color == red) {
		status_model_is_ok = false;
	} else {
		status_model_is_ok = true;
	}
}

function set_model_is_ok_icon_color (color, red, green, orange) {
	if(color == red) {
		$("#model_is_ok_icon").css("color", "red");
	} else if(color == green) {
		$("#model_is_ok_icon").css("color", "green");
	} else if(color == orange) {
		$("#model_is_ok_icon").css("color", "orange");
	}
}

function add_symbols_to_model_is_ok_content (_content, color, green) {
	_content = add_started_training_symbol_to_content(_content);
	_content = add_waiting_symbol_to_content(_content);
	_content = add_model_is_trained_symbol_to_content(_content, color, green);
	return _content;
}

function add_model_is_trained_symbol_to_content (_content, color, green) {
	if(model_is_trained && color == green) {
		_content += "&#9989;";
	}
	return _content;
}

function add_waiting_symbol_to_content(_content) {
	const body = document.body;

	if (waiting_updated_page_uuids.length) {
		_content += "&#9201;";
		body.style.cursor = "wait";
	} else {
		body.style.cursor = "default";
	}

	return _content;
}

function add_started_training_symbol_to_content (_content) {
	if(started_training) {
		_content += "&#129302;&#128214;";
	}
	return _content;
}

function ribbon_shower_hack () {
	// nasty hack to prevent both, ribbon icons and ribbon at the same time
	if($("#ribbon_shower").is(":visible") && $("#ribbon").is(":visible")) {
		show_ribbon();
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
			overlay.style.backgroundImage = "radial-gradient(circle at 12% 22%, rgba(255,255,255,0.4) 0.5px, transparent 1.5px), radial-gradient(circle at 32% 38%, rgba(255,255,255,0.3) 0.5px, transparent 1.5px), radial-gradient(circle at 68% 18%, rgba(255,255,255,0.35) 0.5px, transparent 1.5px), radial-gradient(circle at 78% 52%, rgba(255,255,255,0.25) 0.5px, transparent 1.5px), radial-gradient(circle at 52% 76%, rgba(255,255,255,0.3) 0.5px, transparent 1.5px), radial-gradient(circle at 60% 60%, rgba(255,255,255,0.04) 0%, transparent 70%), radial-gradient(circle at 20% 70%, rgba(255,255,255,0.03) 0%, transparent 80%), linear-gradient(180deg, rgba(10,15,35,1) 0%, rgba(0,0,15,1) 100%)";
		} else if (bg_color.toLowerCase() === "white") {
			overlay.style.backgroundImage = "linear-gradient( 180deg, rgba(200, 230, 255, 1) 0%, rgba(245, 250, 255, 1) 100% ), radial-gradient(circle at 20% 30%, rgba(255,255,255,0.6) 0%, transparent 60%), radial-gradient(circle at 70% 20%, rgba(255,255,255,0.5) 0%, transparent 70%), radial-gradient(circle at 40% 70%, rgba(255,255,255,0.4) 0%, transparent 65%), radial-gradient(circle at 80% 60%, rgba(255,255,255,0.5) 0%, transparent 70%)";
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
		log(language[lang]["an_error_occurred"], error);
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
		name.includes("visualizer") ||
		name.includes("jquery") ||
		name.includes("tf") ||
		name.includes("snake_activation_layer") ||
		name.includes("multi_activation") ||
		name.includes("main.js") ||
		name.includes("debug_layer") ||
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

	await create_model(model, undefined);
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
	windowDiv.style.width = "98%";
	windowDiv.style.minWidth = "300px";
	windowDiv.style.zIndex = 9;
	windowDiv.style.backgroundColor = is_dark_mode ? "black" : "white";
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
	textarea.style.height = "100%";
	textarea.style.minHeight = "500px";
	textarea.style.height = "80%";
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

	function esc_listener(e) {
		if (e.key === "Escape") {
			if (document.body.contains(windowDiv)) {
				document.body.removeChild(windowDiv);
			}
			document.removeEventListener("keydown", esc_listener);
		}
	}

        document.addEventListener("keydown", esc_listener);
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

// get_kernel_images not yet used
function get_kernel_images (layer_nr, all=0) {
	try {
		var _k = model?.layers[layer_nr].kernel.val.shape;
		var transposed_kernel = tidy(() => { return array_sync(tf_transpose(model?.layers[layer_nr].kernel.val, [3, 0, 1, 2])); });

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

function get_min_max_val(n, m, this_layer_output) {
	var minVal = Infinity;
	var maxVal = -Infinity;

	for (var x = 0; x < n; x++) {
		for (var y = 0; y < m; y++) {
			var value = this_layer_output[x][y];
			if (value < minVal) minVal = value;
			if (value > maxVal) maxVal = value;
		}
	}

	return [minVal, maxVal];
}

function get_last_layer_classname() {
	return get_layer_classname_by_nr(model?.layers?.length - 1);
}

function get_layer_classname_by_nr(layer_idx) {
	if (!model || !model?.layers) {
		err("Model or model.layers is undefined!");
		return null;
	}

	var nr_of_layer = model?.layers?.length;
	if(!nr_of_layer) {
		return null;
	}

	if (layer_idx < 0 || layer_idx >= nr_of_layer) {
		wrn(`layer_idx ${layer_idx} is out of bounds. Valid range: 0-${nr_of_layer - 1}`);
		return null;
	}

	try {
		const className = model?.layers[layer_idx].getClassName();
		return className;
	} catch (e) {
		err(`Error retrieving className for layer ${layer_idx}: ${e.message}`);
		return null;
	}
}

async function download_model_and_weights_and_labels () {
	await wait_for_updated_page(3);
	await save_model();
	await download_labels_json();
	await download_weights_json();
	if($("#data_origin").val() == "image") {
		await create_and_download_zip();
	}
}

function setOptimizerTooltips() {
	const lang = window.lang;

	optimizer_infos_json.forEach(function(optimizer) {
		const optimizerName = optimizer.optimizer;
		const infoText = optimizer.info[lang];
		const variables = optimizer.variable_info;

		$(`#${optimizerName}_metadata .TRANSLATEME_optimizer`).attr('title', infoText);

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
			} catch (_err) {
				err("Error at saving:", _err);
				throw _err;
			}
		}
	});
}

function createSimpleZip(files) {
	const chunks = [];
	const centralDirectory = [];
	let offset = 0;

	for (let files_idx = 0; files_idx < files.length; files_idx++) {
		const file = files[files_idx];
		const fileNameBytes = new TextEncoder().encode(file.name);
		const data = file.data;
		const crc32 = computeCRC32(data);

		const localHeader = new Uint8Array(30 + fileNameBytes.length);
		localHeader.set([0x50, 0x4B, 0x03, 0x04], 0);           // Local file header signature
		localHeader.set([0x14, 0x00], 4);                       // Version needed to extract
		localHeader.set([0x00, 0x00], 6);                       // General purpose bit flag
		localHeader.set([0x00, 0x00], 8);                       // Compression method: 0 = store
		localHeader.set([0x00, 0x00, 0x00, 0x00], 10);          // File time/date (optional)
		localHeader.set(uint32le(crc32), 14);                   // CRC-32
		localHeader.set(uint32le(data.length), 18);             // Compressed size
		localHeader.set(uint32le(data.length), 22);             // Uncompressed size
		localHeader.set(uint16le(fileNameBytes.length), 26);    // File name length
		localHeader.set([0x00, 0x00], 28);                      // Extra field length
		localHeader.set(fileNameBytes, 30);                     // File name

		chunks.push(localHeader, data);

		const centralHeader = new Uint8Array(46 + fileNameBytes.length);
		centralHeader.set([0x50, 0x4B, 0x01, 0x02], 0);         // Central dir signature
		centralHeader.set([0x14, 0x00, 0x14, 0x00], 4);         // Version made by / needed
		centralHeader.set([0x00, 0x00], 8);                     // General purpose bit flag
		centralHeader.set([0x00, 0x00], 10);                    // Compression
		centralHeader.set([0x00, 0x00, 0x00, 0x00], 12);        // File time/date
		centralHeader.set(uint32le(crc32), 16);                 // CRC
		centralHeader.set(uint32le(data.length), 20);           // Compressed size
		centralHeader.set(uint32le(data.length), 24);           // Uncompressed size
		centralHeader.set(uint16le(fileNameBytes.length), 28);  // File name length
		centralHeader.set([0x00, 0x00], 30);                    // Extra field length
		centralHeader.set([0x00, 0x00], 32);                    // File comment length
		centralHeader.set([0x00, 0x00], 34);                    // Disk number start
		centralHeader.set([0x00, 0x00], 36);                    // Internal file attributes
		centralHeader.set([0x00, 0x00, 0x00, 0x00], 38);        // External file attributes
		centralHeader.set(uint32le(offset), 42);                // Offset of local header
		centralHeader.set(fileNameBytes, 46);                   // File name

		offset += localHeader.length + data.length;
		centralDirectory.push(centralHeader);
	}

	const centralDirStart = offset;
	for (let cd_idx = 0; cd_idx < centralDirectory.length; cd_idx++) {
		chunks.push(centralDirectory[cd_idx]);
		offset += centralDirectory[cd_idx].length;
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
	for (let idx = 0; idx < data.length; idx++) {
		crc = (crc >>> 8) ^ CRC32_TABLE[(crc ^ data[idx]) & 0xff];
	}
	return (crc ^ 0xffffffff) >>> 0;
}

var CRC32_TABLE = (function () {
	const table = new Uint32Array(256);
	for (let idx = 0; idx < 256; idx++) {
		let c = idx;
		for (let j = 0; j < 8; j++) {
			c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
		}
		table[idx] = c >>> 0;
	}
	return table;
})();

function reset_tiny_graph(hide=0) {
	if(hide) {
		$("#tiny_graph").html("").hide();
	} else {
		$("#tiny_graph").html("");
	}
}

function hide_training_progress_bar () {
	$("#training_progress_bar").hide();
}

function show_training_progress_bar () {
	$("#training_progress_bar").show();
}

function set_adam_lr (lr) {
	$("#learningRate_adam").val(lr).trigger("change");
}

function set_imgcat (new_nr) {
	if(!looks_like_number(new_nr)) {
		err(`set_imgcat: ${new_nr} is does not look like a number`);
		return;
	}

	if (!Number.isInteger(Number(new_nr))) {
		err(`set_imgcat: ${new_nr} is does not look like an integer`);
		return;
	}

	$("#max_number_of_files_per_category").val(new_nr).trigger("change");
}

function get_imgcat () {
	return $("#max_number_of_files_per_category").val();
}

async function set_data_origin_and_wait(val) {
        $("#data_origin").val(val).trigger("change");
        await wait_for_updated_page(3);
}

async function set_model_dataset(val) {
	$("#model_dataset").val(val).trigger("change");

	await wait_for_updated_page(3);
}

function hide_layer_visualization_tab () {
	$("#layer_visualizations_tab").html("").hide();
}

function get_layer_visualization_tab_str() {
	return $("#layer_visualizations_tab").html();
}

function hide_data_plotter() {
	$("#data_plotter").hide();
}

function show_data_plotter() {
	$("#data_plotter").show();
}

function show_conv_visualizations() {
	$(".hide_when_no_conv_visualizations").hide();
	$(".hide_when_conv_visualizations").show();
}

function hide_conv_visualizations() {
	$(".hide_when_no_conv_visualizations").show();
	$(".hide_when_conv_visualizations").hide();
}

function enabled_saving_history () {
	return $("#save_math_history").is(":checked");
}

function any_trainable_checked() {
	try {
		var checkboxes = document.querySelectorAll('input.input_data.trainable[type="checkbox"]');
		if (!checkboxes || checkboxes.length === 0) {
			return false;
		}
		for (var i = 0; i < checkboxes.length; i++) {
			if (checkboxes[i].checked === true) {
				return true;
			}
		}
		return false;
	} catch (error) {
		return false;
	}
}

function open_help() {
	try {
		var url = 'manual.html';
		var newTab = window.open(url, '_blank');

		if (newTab === null) {
			alert('Popup blocked! Please allow popups for this site to view the manual.');
			console.error('Popup blocked by browser when trying to open: ' + url);
			return false;
		}

		newTab.focus();
		console.log('Manual opened successfully in new tab:', url);
		return true;
	} catch (error) {
		console.error('Error opening manual.html:', error);
		alert('An error occurred while trying to open the manual.');
		return false;
	}
}

function close_popups() {
	close_popup('save_model_dialog');
	close_popup('upload_dialog');
	close_popup('sources_popup');
}

function toggle_skip_connection(layer_nr, elem) {
	var enabled = $(elem).is(":checked");

	if (!skip_connection_settings[layer_nr]) {
		skip_connection_settings[layer_nr] = { enabled: false };
	}

	skip_connection_settings[layer_nr].enabled = enabled;

	updated_page(); // await not possible here
}
