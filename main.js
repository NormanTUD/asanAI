"use strict";

function blobToBase64(blobString) {
	const blob = new Blob([blobString]);

	const reader = new FileReader();

	return new Promise((resolve, reject) => {
		reader.onloadend = () => {
			if (reader.error) {
				console.warn("Error reading a blob: ", reader.error);
				reject(reader.error);
			} else {
				const _base64String = reader.result.split(",")[1];
				resolve(_base64String);
			}
		};

		reader.readAsDataURL(blob);
	});
}

function getBase64(file) {
	var fileReader = new FileReader();
	if (file) {
		fileReader.readAsDataURL(file);
	}
	return new Promise((resolve, reject) => {
		fileReader.onloadend = function(event) {
			resolve(event.target.result);
		};
	});
}

function check_all_tabs () {
	function removeLeftOfHash(inputString) {
		const hashIndex = inputString.indexOf("#");
		if (hashIndex !== -1) {
			return inputString.slice(hashIndex + 1);
		} else {
			return inputString;
		}
	}

	var _tab_labels = $("[id$='_tab_label']");

	for (var i = 0; i < _tab_labels.length; i++) {
		var _l = _tab_labels[i];

		var tab_link = "" + _l;
		var tab_name = removeLeftOfHash(tab_link);

		var _item = $("#" + tab_name);

		if(_item.length != 1) {
			alert(tab_name + " does not have exactly 1 element!");
		}
	}
}

async function on_resize () {
	await write_descriptions(1);

	if(!$("#ribbon").is(":visible")) {
		$("#ribbon_shower").show();
	}

	await restart_fcnn();
}

function layer_types_that_dont_have_default_options () {
	var no_options = [];

	var all_options = [];

	var keys = Object.keys(layer_options);

	for (var i = 0; i < keys.length; i++) {
		var layer_name = keys[i];
		for (var j = 0; j < layer_options[layer_name]["options"].length; j++) {
			var this_option = layer_options[layer_name]["options"][j];
			if(!all_options.includes(this_option)) {
				all_options.push(this_option);
			}
		}
	}

	for (var i = 0; i < all_options.length; i++) {
		var key = all_options[i];
		if(!key in layer_options_defaults) {
			no_options.push(key);
		}
	}

	return no_options;
}

async function has_front_back_camera() {
	let result = {
		hasBack: false,
		hasFront: false,
		videoDevices: []
	};
	try {
		const stream = await navigator.mediaDevices.getUserMedia({video: true, audio: false});
		let devices = await navigator.mediaDevices.enumerateDevices();
		const videoDevices = devices.filter(device => {
			if (device.kind === "videoinput") {
				l(language[lang]["found_camera"] + ": " + device.label);
				if (device.label && device.label.length > 0) {
					if (
						device.label.toLowerCase().indexOf("back") >= 0 ||
						device.label.toLowerCase().indexOf("rück") >= 0
					) {
						result.hasBack = true;
					} else if (
						device.label.toLowerCase().indexOf("front") >= 0
					) {
						result.hasFront = true;
					} else {
						/* some other device label ... desktop browser? */
					}
				}
				return true;
			}
			return false;
		});
		result.videoDevices = videoDevices;
		const tracks = stream.getTracks();
		if (tracks) {
			for (let t = 0; t < tracks.length; t++) {
				tracks[t].stop();
			}
		}
		return result;
	} catch (e) {
		/* log and swallow exception, this is a probe only */
		if(("" + e).includes("NotAllowedError")) {
			info("[has_front_back_camera] " + language[lang]["webcam_access_denied"]);
		} else {
			err("[has_front_back_camera] " + e);
		}
		return result;
	}
}

function init_tabs () {
	dbg("[init_tabs] " + language[lang]["initializing_tabs"]);

	var tabs_settings = {
		activate: function (event, ui) {},
		hide: { effect: "fade", duration: 0 },
		show: { effect: "fade", duration: 0 }
	};

	var tablist = $("#tablist");
	$("#ribbon").children().each(function (i, e) {
		var title = $(e).prop("title");
		if(title) {
			var named_id = $(e).prop("id");
			tablist.append(`<li><a href='#${named_id}'><span class='TRANSLATEME_${title}'></span></a></li>`);
		}
	});

	$("#ribbon").tabs(tabs_settings);
	$("#right_side").tabs(tabs_settings);
	$("#visualization_tab").tabs(tabs_settings);
	$("#training_tab").tabs(tabs_settings);
	$("#code_tab").tabs(tabs_settings);

}

function init_set_all_options () {
	dbg("[init_set_all_options] " + language[lang]["initializing_set_options_for_all"]);
	var initializer_keys = Object.keys(initializers);
	var activation_functions = Object.keys(activations);

	var set_all_bias_initializers = $("#set_all_bias_initializers");
	var set_all_kernel_initializers = $("#set_all_kernel_initializers");
	var set_all_activation_functions = $("#set_all_activation_functions");
	var set_all_activation_functions_except_last_layer = $("#set_all_activation_functions_except_last_layer");

	for (var i = 0; i < initializer_keys.length; i++) {
		set_all_bias_initializers.append($("<option>", {
			value: initializer_keys[i],
			text: initializer_keys[i]
		}));

		set_all_kernel_initializers.append($("<option>", {
			value: initializer_keys[i],
			text: initializer_keys[i]
		}));
	}

	for (var i = 0; i < activation_functions.length; i++) {
		set_all_activation_functions.append($("<option>", {
			value: activation_functions[i],
			text: activation_functions[i]
		}));

		set_all_activation_functions_except_last_layer.append($("<option>", {
			value: activation_functions[i],
			text: activation_functions[i]
		}));
	}

	document.addEventListener("keyup", function(event) {
		if(shift_pressed && event.key == "Shift") {
			shift_pressed = false;
		}
	});

	document.addEventListener("keydown", function(event) {
		if(event.key == "Shift") {
			shift_pressed = true;
		}

		if (event.ctrlKey && event.key === "z") {
			undo(); // cannot be async
		} else if (event.ctrlKey && event.key === "y") {
			redo(); // cannot be async
		} else if (event.ctrlKey && event.key === ";") {
			$("#jump_to_interesting_tab").click();
			train_neural_network(); // cannot be async
		} else if (event.ctrlKey && event.key === ",") {
			train_neural_network(); // cannot be async
		} else if (event.ctrlKey && event.key === "L") {
			$("#jump_to_interesting_tab").click();
		} else if (event.ctrlKey && event.altKey && event.key === "h") {
			$("[href='#home_ribbon']").click();
		} else if (event.altKey && event.key === "t") {
			$("[href='#tf_ribbon']").click();
		} else if (event.altKey && event.key === "m") {
			$("#visualization_tab_label").click();
			$("#math_tab_label").click();
		} else if (event.altKey && event.key === "v") {
			$("[href='#visualization_ribbon']").click();
		}
	});

}

async function init_page_contents (chosen_dataset) {
	try {
		dbg("[init_page_contents] " + language[lang]["initializing_page_contents"]);
		skip_predictions = true;
		disabling_saving_status = true;
		global_disable_auto_enable_valid_layer_types = true;
		disable_show_python_and_create_model = true;

		$("#width").val(width);
		$("#height").val(height);

		await init_dataset_category();
		global_disable_auto_enable_valid_layer_types = true;

		try {
			document.getElementById("upload_x_file").addEventListener("change", handle_x_file, false);
			document.getElementById("upload_y_file").addEventListener("change", handle_y_file, false);
			document.getElementById("upload_model").addEventListener("change", upload_model, false);
		} catch (e) {
			if(Object.keys(e).includes("message")) {
				e = e.message;
			}

			err("" + e);
		}

		await determine_input_shape();

		$("#layers_container").sortable({
			placeholder: "sortable_placeholder",
			axis: "y",
			opacity: 0.6,
			revert: true,
			update: function( ) {
				updated_page(); // cannot be async
			}
		});

		$("#tablist").show();

		is_setting_config = false;

		global_disable_auto_enable_valid_layer_types = false;
		disable_show_python_and_create_model = false;

		if(chosen_dataset) {
			$("#dataset").val(chosen_dataset).trigger("change");
		} else {
			await set_config();
		}

		rename_tmp_onchange();

		await updated_page();

		disabling_saving_status = false;
		skip_predictions = false;

		hide_dataset_when_only_one();
	} catch (e) {
		if(Object.keys(e).includes("message")) {
			e = e.message;
		}

		assert(false, e);
	}
}

function dataset_already_there (dataset_name) {
	var already_there = false;
	$("#dataset").children().each(
		function (id, e) {
			if(e.text == dataset_name) {
				already_there = true;
				return;
			}
		}
	);

	return already_there;
}

function init_categories () {
	dbg("[init_categories] " + language[lang]["initializing_categories"]);
	$("#dataset").html("");

	var dataset_names = Object.keys(traindata_struct);
	for (var j = 0; j < dataset_names.length; j++) {
		var dataset_name = dataset_names[j];
		if(!dataset_already_there(dataset_name)) {
			var dataset_value = traindata_struct[dataset_names[j]]["name"];
			var existing_keys_in_dataset = $.map($("#dataset option"), e => $(e).val());

			$("#dataset").append(`<option value="${dataset_value}">${dataset_name}</option>`);
		}
	}

	number_of_initialized_layers = 0;

}

async function hasBothFrontAndBack () {
	if(hasBothFrontAndBackCached === undefined) {
		var has_front_and_back_facing_camera = await has_front_back_camera();
		hasBothFrontAndBackCached = has_front_and_back_facing_camera.hasBack && has_front_and_back_facing_camera.hasFront;
	}

	return hasBothFrontAndBackCached;
}

async function restart_webcams () {
	show_overlay(getCameraSearchHTML());

	if(cam) {
		await show_webcam(1);
	}

	if(cam) {
		await get_data_from_webcam(1);
	}

	remove_overlay();
}

function init_losses_and_metrics () {
	dbg("[init_losses_and_metrics] " + language[lang]["initializing_losses"]);
	for (var i = 0; i < losses.length; i++) {
		$("#loss").append($("<option>", {
			value: losses[i],
			text: losses[i]
		}));
	}

	dbg("[init_losses_and_metrics] " + language[lang]["initializing_metrics"]);
	for (var i = 0; i < metrics.length; i++) {
		$("#metric").append($("<option>", {
			value: metrics[i],
			text: metrics[i]
		}));
	}

}

async function set_backend() {
	if(!Object.keys(language).includes(lang)) {
		err(`${lang} is not in languages!`);
		return;
	}

	dbg("[set_backend] " + language[lang]["setting_backend"]);
	var backend = get_backend();

	if(!has_webgl) {
		backend = "cpu";
		$("#cpu_backend").prop("checked", true);
		l(language[lang]["no_webgl_using_cpu"]);
	}

	await tf.setBackend(backend);

}

function show_login_stuff_when_session_id_is_set() {
	if(get_cookie("session_id") != null) {
		$("#register").hide();
		$("#logout").show();
		$(".show_when_logged_in").show();
	}
}

function upload_labels_function(evt) {
	if(!window.FileReader) return;
	var reader = new FileReader();

	reader.onloadend = async function(evt) {
		if(evt.target.readyState != 2) return;
		if(evt.target.error) {
			alert("Error while reading labels file");
			return;
		}

		var filecontent = evt.target.result;
		await load_labels_from_json_string(filecontent);
	};

	reader.readAsText(evt.target.files[0]);
}

function upload_custom_images_function (evt) {
	if (!window.FileReader) {
		assert(false, "Your browser may be outdated, as it lacks FileReader. Cannot load zip files without.");
		return;
	}

	if(get_input_shape().length != 3 || get_input_shape()[2] != 3 || get_last_layer_activation_function() != "softmax") {
		err(language[lang]["uploading_custom_images_is_only_supported_for_image_models"]);
		return;
	}

	var reader = new FileReader();

	reader.onloadend = async function(evt) {
		if (evt.target.readyState !== FileReader.DONE) {
			return;
		}

		if (evt.target.error) {
			wrn(language[lang]["error_while_loading_custom_images_zip_file"] + ": " + evt.target.error);
			return;
		}

		var base64String = null;

		try {
			base64String = reader.result;
		} catch (e) {
			if (e.hasOwnProperty("message")) {
				e = e.message;
			}

			err(language[lang]["error_while_getting_reader_result"] + ": " + e);
			return;
		}

		try {
			await read_zip(base64String);
		} catch (e) {
			if (e.hasOwnProperty("message")) {
				e = e.message;
			}

			if (("" + e).includes("Corrupted zip")) {
				Swal.fire({
					icon: "error",
					title: "Oops...",
					text: language[lang]["the_zip_file_you_uploaded_seems_to_be_corrupt_or_partially_uploaded"]
				});
				return;
			} else if (("" + e).includes("is this a zip file")) {
				Swal.fire({
					icon: "error",
					title: "Oops...",
					text: language[lang]["it_seems_like_uploading_the_file_has_failed"] + "..."
				});
				return;
			} else {
				throw new Error("Error while reading zip: " + e);
			}
		}
	};

	reader.readAsArrayBuffer(evt.target.files[0]);

}

function upload_tfjs_weights_function (evt) {
	if(!window.FileReader) return;
	var reader = new FileReader();

	reader.onloadend = async function(evt) {
		if(evt.target.readyState != 2) return;
		if(evt.target.error) {
			alert("Error while reading weights file");
			return;
		}

		var filecontent = evt.target.result;
		await set_weights_from_string(filecontent, 0, 1);

		//add_layer_debuggers();

		$("#predictcontainer").show();
	};

	reader.readAsText(evt.target.files[0]);
}

function set_upload_functions_onchange_handlers () {
	document.getElementById("upload_labels").onchange = upload_labels_function;
	document.getElementById("upload_custom_images").onchange = upload_custom_images_function;
	document.getElementById("upload_tfjs_weights").onchange = upload_tfjs_weights_function;
}

function set_check_number_vales_interval() {
	try {
		setInterval(check_number_values, 500);
	} catch (e) {
		wrn("[document.ready] Function check_number_values not found: " + e);
	}

}

function set_write_model_summary_interval () {
	try {
		setInterval(write_model_summary_wait, 1000);
	} catch (e) {
		wrn("[document.ready] Function write_model_summary_wait not found: " + e);
	}
}

function set_auto_intervals () {
	set_check_number_vales_interval();
	set_write_model_summary_interval();

	setInterval(model_is_ok, 300);
	setInterval(label_debugger_icon_ok, 300);
	setInterval(_temml, 500);
	setInterval(_clean_custom_tensors, 400);
	setInterval(restart_fcnn, 500);
}

async function try_to_set_backend() {
	dbg("[document.ready] " + language[lang]["trying_to_set_backend"]);
	await set_backend();
	dbg("[document.ready] " + language[lang]["backend_set"]);
}

function set_register_form_submit () {
	$("#register_form").submit(function(e) {
		e.preventDefault();
		register(); // cannot be async
	});
}

function set_values_from_url () {
	var urlParams = new URLSearchParams(window.location.search);
	if(urlParams.get("epochs")) {
		set_epochs(urlParams.get("epochs"));
	}

	if(urlParams.get("imgcat")) {
		$("#max_number_of_files_per_category").val(urlParams.get("imgcat")).trigger("change");
	}

	if(urlParams.get("show_layer_data")) {
		$("#show_layer_data").prop("checked", true).trigger("change");
	}

	if(urlParams.get("auto_augment")) {
		$("#auto_augment").prop("checked", true).trigger("change");
		$("a[href*=\"tf_ribbon_augmentation\"]").show();
	}

	if(urlParams.get("valsplit")) {
		$("#validationSplit").val(urlParams.get("valsplit")).trigger("change");
	}

	if(urlParams.get("no_jump_to_interesting_tab")) {
		$("#jump_to_interesting_tab").prop("checked", false).trigger("change");
	}

	if(urlParams.get("autostart_training")) {
		train_neural_network(); // cannot be async
	}

	if(urlParams.get("data_source")) {
		$("#data_origin").val(urlParams.get("data_source")).trigger("change");
	}
}

function set_theme_from_cookie () {
	cookie_theme = get_cookie("theme");
	if(cookie_theme) {
		dbg("[document.ready] " + language[lang]["has_cookie_for"] + " " + cookie_theme);
		$("#theme_choser").val(cookie_theme).trigger("change");
		dbg("[document.ready] " + language[lang]["theme_set"]);
	}

}

function set_optimizer_metadata_input_change() {
	$(".optimizer_metadata_input"). change(function(event) {
		updated_page(); // cannot be async
	});
}

function set_webgl_backend() {
	$("#webgl_backend").prop("checked", true).trigger("change");
}

function show_website_and_hide_loader() {
	$("#loading_icon_wrapper").hide();
	$("#mainsite").show();
	$("#status_bar").show();
}

function set_model_and_label_debugger () {
	model_is_ok_icon = $("#model_is_ok_icon");
	label_debugger_icon = $("#label_debugger_icon");
}

async function temml_or_catch() {
	try {
		await _temml();
	} catch (e) {
		if(("" + e).includes("not an object")) {
			// ignore
		} else {
			err(e);
		}
	}
}

function show_long_loading_time_message () {
	var end_loading_time = Date.now();

	var __loading_time = human_readable_time(Math.abs(start_loading_time - end_loading_time) / 1000);
	var __max_loading_time__ = 10;

	if(__loading_time > __max_loading_time__) {
		err(sprintf(language[lang]["loading_time_took_more_than_n_seconds_which_is_too_slow"], __max_loading_time__));
	}

	return __loading_time;
}

function autoset_dark_theme_if_user_prefers_it () {
	if(!get_cookie("theme") && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches && get_cookie("theme") != "darkmode") {
		$("#theme_choser").val("darkmode").trigger("change");
	}
}

async function predict_handdrawn_if_applicable () {
	if(atrament_data.sketcher && await input_shape_is_image()) {
		await predict_handdrawn();
	}
}

function add_error_event_listener () {
	window.addEventListener("error", async function(e) {
		if(Object.keys(e).includes("message")) {
			e = e.message;
		}

		await send_bug_report();
	});
}

function show_snow_when_applicable () {
	var today = new Date();
	var forceSnowParam = urlParams.get("force_snow");

	if (today.getMonth() === 11 && today.getDate() === 24 || forceSnowParam) {
		try {
			show_snow();
		} catch (error) {
			wrn(`${language[lang]["error_at_executing_show_snow"]}: ${error}`);
		}
	}

}

function check_if_lang () {
	if(!Object.keys(language).includes(lang)) {
		err(lang + " is not in languages!");
		return false;
	}
	return true;
}

$(document).ready(async function() {
	check_all_tabs();

	if(!check_if_lang()) {
		return;
	}

	await try_to_set_backend();

	assert(layer_types_that_dont_have_default_options().length == 0, "There are layer types that do not have default options");

	init_losses_and_metrics();

	set_register_form_submit();

	show_login_stuff_when_session_id_is_set();

	init_tabs();
	init_set_all_options();
	init_categories();

	await init_page_contents();
	await force_download_image_preview_data();

	set_upload_functions_onchange_handlers();

	await change_data_origin();

	window.onresize = on_resize;

	set_auto_intervals();

	allow_edit_input_shape();

	copy_options();
	copy_values();

	show_hide_augment_tab();

	set_values_from_url();

	set_theme_from_cookie();

	get_drawing_board_on_page($("#predict_handdrawn_canvas"), "sketcher", "predict_handdrawn();");

	set_optimizer_metadata_input_change();

	alter_text_webcam_series();

	set_webgl_backend();

	void(0); l(`Git-Hash: ${git_hash}, TFJS-Version: ${tf.version["tfjs-core"]}`);

	invert_elements_in_dark_mode();

	click_on_graphs = 0;

	allow_editable_labels();

	await show_prediction(0, 1);

	await predict_handdrawn_if_applicable();

	change_all_initializers();

	await write_descriptions(1);

	show_website_and_hide_loader();

	await restart_fcnn(1);

	await temml_or_catch();

	set_model_and_label_debugger();

	show_default_tab_labels();

	await change_optimizer();

	add_error_event_listener();

	show_snow_when_applicable();

	finished_loading = true;

	await updated_page();

	autoset_dark_theme_if_user_prefers_it();

	setOptimizerTooltips();

	document.getElementById('navbar1').addEventListener('click', function(event) {
		add_label_sidebar();
	});

	await checkAndRunTests();

	var __loading_time = show_long_loading_time_message();

	log(`${language[lang]["loading_the_site_took"]} ${__loading_time}`);
});

function show_default_tab_labels () {
	show_tab_label("summary_tab_label");
	show_tab_label("predict_tab_label");
	show_tab_label("code_tab_label");
	show_tab_label("training_data_tab_label", 1);
}

function sleep(ms) {
	return new Promise(resolve => setTimeout(resolve, ms));
}

async function checkAndRunTests() {
	const params = new URLSearchParams(window.location.search);
	const runTestsParam = params.get('run_tests');

	await sleep(10);

	if (runTestsParam === '0' || runTestsParam === '1') {
		await run_tests(Number(runTestsParam));
	}
}

async function _scrollTo (x, y) {
	//log(`_scrollTo(${x}, ${y})`);
	window.scrollTo(x, y);
}

document.getScroll = function(force_real_data=false) {
	if (last_scroll_array && !force_real_data) {
		var copy_last_scroll_array = last_scroll_array;
		last_scroll_array = null;

		return copy_last_scroll_array;
	}

	if (window.pageYOffset != undefined) {
		return [pageXOffset, pageYOffset];
	} else {
		var sx, sy, d = document,
			r = d.documentElement,
			b = d.body;
		sx = r.scrollLeft || b.scrollLeft || 0;
		sy = r.scrollTop || b.scrollTop || 0;
		return [sx, sy];
	}
};

window.addEventListener("scroll",function(e, i){
	last_scroll_array = document.getScroll(true);
});
