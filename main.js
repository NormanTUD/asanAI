"use strict";

function check_all_tabs () {
	function removeLeftOfHash(inputString) {
		const hashIndex = inputString.indexOf('#');
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

function show_idle_time () {
	if(!is_cosmo_mode) {
		$("#cosmo_reload_debugger").remove();
		return;
	}

	if(!enable_cosmo_debugger) {
		$("#cosmo_reload_debugger").remove();
		return;
	}

	if(!$("#cosmo_reload_debugger").length) {
		var left = 50;
		$("body").append(`<div id="cosmo_reload_debugger" style="position: absolute; bottom: 100px; left: ${left}px; background-color: rgba(255, 150, 150, 128); text-shadow: #fff 1px 1px 1px;" class="manicule_debugger"></div>`);
	}

	if(idleTime) {
		$("#cosmo_reload_debugger").html(`Last activity: ${idleTime}/${reload_time}`);
	}
}

async function on_resize () {
	reset_view();
	await show_cosmo_elements_depending_on_current_skills();
	await write_descriptions(1);

	if(!$("#ribbon").is(":visible")) {
		$("#ribbon_shower").show();
	}

	restart_fcnn();
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
				l("Found camera: " + device.label);
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
			info("[has_front_back_camera] Webcam access was denied");
		} else {
			err("ERROR: " + e);
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

	if(is_cosmo_mode) {
		tabs_settings = {
			activate: function (event, ui) {},
			hide: { effect: "fade", duration: 0 },
			show: { effect: "fade", duration: 0 }
		};
	}

	var tablist = $("#tablist");
	$("#ribbon").children().each(function (i, e) {
		var title = $(e).prop("title");
		if(title) {
			var named_id = $(e).prop("id");
			tablist.append("<li><a href=#" + named_id + ">" + title + "</a></li>");
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
		document.getElementById("upload_weights").addEventListener("change", upload_weights, false);
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

async function get_traindata_and_init_categories () {
	traindata_struct = await get_json("traindata.php");
	init_categories();

	await init_page_contents();
	await write_descriptions();

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
	if(cam) {
		await show_webcam(1);
	}

	if(cam) {
		await get_data_from_webcam(1);
	}

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
	dbg("[set_backend] " + language[lang]["setting_backend"]);
	var backend = get_backend();

	if(!has_webgl) {
		backend = "cpu";
		$("#cpu_backend").prop("checked", true);
		l("Has no WebGL. Using CPU backend.");
	}

	await tf.setBackend(backend);

}

$(document).ready(async function() {
	if(!is_cosmo_mode) {
		if(parse_int(document.location.href.indexOf("start_cosmo")) != -1 && document.location.href.indexOf("no_cosmo") === -1) {
			await cosmo_mode();
		}
	}

	if(!is_cosmo_mode) {
		$(".show_in_cosmo_mode").hide();
	}
	
	check_all_tabs();

	dbg("[document.ready] " + language[lang]["trying_to_set_backend"]);
	await set_backend();
	dbg("[document.ready] " + language[lang]["backend_set"]);

	assert(layer_types_that_dont_have_default_options().length == 0, "There are layer types that do not have default options");

	init_losses_and_metrics();

	/*
	if (location.hostname === "localhost" || location.hostname === "127.0.0.1") {
		window.onbeforeunload = function() {
			return "You're leaving the site.";
		};
	}
	*/

	$("#register_form").submit(function(e) {
		e.preventDefault();
		register(); // cannot be async
	});

	if(get_cookie("session_id") != null) {
		$("#register").hide();
		$("#logout").show();
		$(".show_when_logged_in").show();
	}

	init_tabs();
	init_set_all_options();
	init_categories();

	await init_page_contents();

	if(!is_cosmo_mode) {
		await force_download_image_preview_data();
	}

	document.getElementById("upload_tfjs_weights").onchange = function(evt) {
		if(!window.FileReader) return;
		var reader = new FileReader();

		reader.onload = async function(evt) {
			if(evt.target.readyState != 2) return;
			if(evt.target.error) {
				alert("Error while reading file");
				return;
			}

			var filecontent = evt.target.result;
			await set_weights_from_string(filecontent, 0, 1);

			//add_layer_debuggers();

			$("#predictcontainer").show();
		};

		reader.readAsText(evt.target.files[0]);
	};

	await change_data_origin();

	window.onresize = on_resize;

	try {
		setInterval(fix_viz_width, 700);
	} catch (e) {
		wrn("Function fix_viz_width not found: " + e);
	}

	try {
		setInterval(check_number_values, 100);
	} catch (e) {
		wrn("Function check_number_values not found: " + e);
	}

	try {
		setInterval(write_model_summary_wait, 1000);
	} catch (e) {
		wrn("Function write_model_summary_wait not found: " + e);
	}

	/*
	try {
		//setInterval(write_descriptions, 1000);
		setInterval(disable_everything_in_last_layer_enable_everyone_else_in_beginner_mode, 400);
	} catch (e) {
		wrn("Function disable_everything_in_last_layer_enable_everyone_else_in_beginner_mode not found: " + e);
	}
	*/

	allow_edit_input_shape();

	copy_options();
	copy_values();

	show_hide_augment_tab();

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

	cookie_theme = get_cookie("theme");
	if(cookie_theme) {
		dbg("[document.ready] " + language[lang]["has_cookie_for"] + " " + cookie_theme);
		$("#theme_choser").val(cookie_theme).trigger("change");
		dbg("[document.ready] " + language[lang]["theme_set"]);
	}

	get_drawing_board_on_page($("#predict_handdrawn_canvas"), "sketcher", "predict_handdrawn();");

	$(".optimizer_metadata_input"). change(function(event) {
		updated_page(); // cannot be async
	});

	alter_text_webcam_series();
	$("#webgl_backend").prop("checked", true).trigger("change");

	l("Git-Hash: " + git_hash + ", TFJS-Version: " + tf.version["tfjs-core"]);

	await toggle_show_input_layer();

	invert_elements_in_dark_mode();

	click_on_graphs = 0;

	allow_editable_labels();

	await show_prediction(0, 1);

	if(atrament_data.sketcher && await input_shape_is_image()) {
		await predict_handdrawn();
	}

	change_all_initializers();

	await write_descriptions(1);

	$("#loading_icon_wrapper").hide();
	$("#mainsite").show();

	if(is_cosmo_mode) {
		$("#scroll_left").show();
		$("#scroll_right").show();
		$("#presentation_site_nr").show();
		$("#start_stop_training").css("visibility", "hidden");
		$(".cosmo_next_button_span").show();
		$("#photos").css("min-height", "");
		await show_tab_label("training_data_tab_label", 1);
	} else {
		$("#status_bar").show();
		await restart_fcnn(1);
	}

	try {
		await _temml();
	} catch (e) {
		if(("" + e).includes("not an object")) {
			// ignore
		} else {
			err(e);
		}
	}

	dbg("[document.ready] " + language[lang]["site_is_ready"]);

	if(is_cosmo_mode) {
		add_scroll_right_button();
		await add_end_presentation_button(1);
	} else {
		model_is_ok_icon = $("#model_is_ok_icon");
		label_debugger_icon = $("#label_debugger_icon");
		setInterval(model_is_ok, 300);
		setInterval(label_debugger_icon_ok, 300);
		setInterval(_temml, 500);

		show_tab_label("summary_tab_label");
		show_tab_label("predict_tab_label");
		show_tab_label("code_tab_label");
		show_tab_label("training_data_tab_label", 1);
	}

	setInterval(_clean_custom_tensors, 400);

	await change_optimizer();

	window.addEventListener("error", async function(e) {
		if(Object.keys(e).includes("message")) {
			e = e.message;
		}

		await send_bug_report();
	});

	var today = new Date();

	var forceSnowParam = urlParams.get('force_snow');

	if (today.getMonth() === 11 && today.getDate() === 24 || forceSnowParam) {
		try {
			show_snow();
		} catch (error) {
			wrn(`Error executing show_snow(): ${error}`);
		}
	}

	finished_loading = true;

	updated_page();
});
