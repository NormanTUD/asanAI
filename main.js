"use strict";

function on_resize () {
	reset_view(); 
	show_cosmo_waves();
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



async function hasFrontBack() {
	let result = {hasBack: false, hasFront: false, videoDevices: []}
	try {
		const stream = await navigator.mediaDevices.getUserMedia({video: true, audio: false});
		let devices = await navigator.mediaDevices.enumerateDevices();
		const videoDevices = devices.filter(device => {
			if (device.kind === 'videoinput') {
				l("Found camera: " + device.label);
				if (device.label && device.label.length > 0) {
					if (
						device.label.toLowerCase().indexOf('back') >= 0 ||
						device.label.toLowerCase().indexOf('rück') >= 0
					) {
						result.hasBack = true;
					} else if (
						device.label.toLowerCase().indexOf('front') >= 0
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
	} catch (ex) {
		/* log and swallow exception, this is a probe only */
		l("ERROR: " + ex);
		return result;
	}
}

function get_get (param) {
	const queryString = window.location.search;

	const urlParams = new URLSearchParams(queryString);

	return urlParams.get(param);
}

function init_tabs () {
	l("Initializing tabs");
	var tabs_settings = {
		activate: function (event, ui) {
			disable_hidden_chardin_entries();
		},
		hide: { effect: "fade", duration: 100 },
		show: { effect: "fade", duration: 100 }
	};

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
	$("#tfvis_tab").tabs(tabs_settings);
	$("#code_tab").tabs(tabs_settings);
}

function init_set_all_options () {
	l("Initializing 'set options for all'");
	var initializer_keys = Object.keys(initializers);
	var activation_functions = Object.keys(activations);

	var set_all_bias_initializers = $('#set_all_bias_initializers')
	var set_all_kernel_initializers = $('#set_all_kernel_initializers');
	var set_all_activation_functions = $('#set_all_activation_functions');
	var set_all_activation_functions_except_last_layer = $('#set_all_activation_functions_except_last_layer');

	for (var i = 0; i < initializer_keys.length; i++) {
		set_all_bias_initializers.append($('<option>', {
			value: initializer_keys[i],
			text: initializer_keys[i]
		}));

		set_all_kernel_initializers.append($('<option>', {
			value: initializer_keys[i],
			text: initializer_keys[i]
		}));
	}

	for (var i = 0; i < activation_functions.length; i++) {
		set_all_activation_functions.append($('<option>', {
			value: activation_functions[i],
			text: activation_functions[i]
		}));

		set_all_activation_functions_except_last_layer.append($('<option>', {
			value: activation_functions[i],
			text: activation_functions[i]
		}));
	}

	document.addEventListener('keydown', function(event) {
		if (event.ctrlKey && event.key === 'z') {
			undo();
		} else if (event.ctrlKey && event.key === 'y') {
			redo();
		} else if (event.ctrlKey && event.key === ';') {
			$("#jump_to_interesting_tab").click();
			train_neural_network();
		} else if (event.ctrlKey && event.key === ',') {
			train_neural_network();
		} else if (event.ctrlKey && event.key === 'L') {
			$("#jump_to_interesting_tab").click();
		} else if (event.ctrlKey && event.altKey && event.key === 'h') {
			$("[href='#home_ribbon']").click();
		} else if (event.altKey && event.key === 't') {
			$("[href='#tf_ribbon']").click();
		} else if (event.altKey && event.key === 'm') {
			$("#visualization_tab_label").click();
			$("#math_tab_label").click();
		} else if (event.ctrlKey && event.key === '#') {
			if($("#demomode").css("display") == "none") {
				start_demo_mode();
			} else {
				end_demo_mode();
			}
		} else if (event.altKey && event.key === 'v') {
			$("[href='#visualization_ribbon']").click();
		}
	});
}

async function init_page_contents (chosen_dataset) {
	l("Initializing page contents");
	skip_predictions = true;
	disabling_saving_status = true;
	global_disable_auto_enable_valid_layer_types = true;
	disable_show_python_and_create_model = true;

	$("#width").val(width);
	$("#height").val(height);

	await init_dataset_category();
	global_disable_auto_enable_valid_layer_types = true;

	document.getElementById("upload_x_file").addEventListener("change", handle_x_file, false);
	document.getElementById("upload_y_file").addEventListener("change", handle_y_file, false);
	document.getElementById('upload_model').addEventListener('change', upload_model, false);
	document.getElementById('upload_weights').addEventListener('change', upload_weights, false);

	determine_input_shape();

	$("#layers_container").sortable({
		placeholder: 'sortable_placeholder',
		axis: 'y',
		opacity: 0.6,
		revert: true,
		update: function( ) {
			updated_page();
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

	updated_page();

	disabling_saving_status = false;
	skip_predictions = false;
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
	write_descriptions();
}

function init_categories () {
	l("Initializing categories");
	$("#dataset").html("");

	var dataset_names = Object.keys(traindata_struct);
	for (var j = 0; j < dataset_names.length; j++) {
		var dataset_name = dataset_names[j];
		if(!dataset_already_there(dataset_name)) {
			var dataset_value = traindata_struct[dataset_names[j]]["name"];
			var existing_keys_in_dataset = $.map($("#dataset option"), e => $(e).val())

			$("#dataset").append(`<option value="${dataset_value}">${dataset_name}</option>`);
		}
	}

	number_of_initialized_layers = 0;
}

async function hasBothFrontAndBack () {
	if(hasBothFrontAndBackCached === undefined) {
		var has_front_and_back_facing_camera = await hasFrontBack();
		hasBothFrontAndBackCached = has_front_and_back_facing_camera.hasBack && has_front_and_back_facing_camera.hasFront;
	}

	return hasBothFrontAndBackCached;
}

function restart_webcams () {
	if(cam) {
		show_webcam(1);
	}

	if(cam_data) {
		get_data_from_webcam(1);
	}
}

function init_losses_and_metrics () {
	l("Initializing losses");
	for (var i = 0; i < losses.length; i++) {
		$('#loss').append($('<option>', {
			value: losses[i],
			text: losses[i]
		}));
	}

	l("Initializing metrics");
	for (var i = 0; i < metrics.length; i++) {
		$('#metric').append($('<option>', {
			value: metrics[i],
			text: metrics[i]
		}));
	}
}


async function set_backend() {
	l("Setting backend");
	var backend = get_backend();

	if(!has_webgl) {
		backend = "cpu";
		$("#cpu_backend").prop("checked", true);
		l("Has no WebGL. Using CPU backend.");
	}

	await tf.setBackend(backend);
}

$(document).ready(async function() {
	var s = swalmsg("Loading page");

	if(getCookie("cosmo_mode") && document.location.href.indexOf('no_cosmo') === -1) {
		cosmo_mode();
	}

	l("Trying to set Backend");
	await set_backend();
	l("Backend set");

	assert(layer_types_that_dont_have_default_options().length == 0, "There are layer types that do not have default options");

	init_losses_and_metrics();

	if (location.hostname === "localhost" || location.hostname === "127.0.0.1") {
		window.onbeforeunload = function() {
			return "You're leaving the site.";
		};
	}

	$("#register_form").submit(function(e) {
		e.preventDefault();
		register();
	});

	if(getCookie("session_id") != null) {
		$("#register").hide();
		$("#logout").show();
		$(".show_when_logged_in").show();
	}


	init_tabs();
	init_set_all_options();
	init_categories();

	await init_page_contents();

	await force_download_image_preview_data();

	document.getElementById("upload_tfjs_weights").onchange = function(evt) {
		if(!window.FileReader) return;
		var reader = new FileReader();

		reader.onload = function(evt) {
			if(evt.target.readyState != 2) return;
			if(evt.target.error) {
				alert('Error while reading file');
				return;
			}

			var filecontent = evt.target.result;
			set_weights_from_string(filecontent, 0, 1);

			add_layer_debuggers();

			$("#predictcontainer").show();
		};

		reader.readAsText(evt.target.files[0]);
	};

	l("Show or hide 'load weights'-button");
	await show_or_hide_load_weights();

	await change_data_origin();

	window.onresize = on_resize;

	setInterval(fix_viz_width, 700);
	setInterval(check_number_values, 200);
	setInterval(display_delete_button, 200);
	setInterval(write_model_summary, 200);
	setInterval(write_descriptions, 500);

	allow_edit_inputShape();

	copy_options();
	copy_values();

	show_hide_augment_tab();

	const urlParams = new URLSearchParams(window.location.search);
	if(urlParams.get("epochs")) {
		$("#epochs").val(urlParams.get("epochs")).trigger("change");
	}

	if(urlParams.get("imgcat")) {
		$("#max_number_of_files_per_category").val(urlParams.get("imgcat")).trigger("change");
	}

	if(urlParams.get("show_layer_data")) {
		$("#show_layer_data").prop("checked", true).trigger("change");
	}

	if(urlParams.get("auto_augment")) {
		$("#auto_augment").prop("checked", true).trigger("change");
		$('a[href*="tf_ribbon_augmentation"]').show();
	}

	if(urlParams.get("valsplit")) {
		$("#validationSplit").val(urlParams.get("valsplit")).trigger("change");
	}

	if(urlParams.get("no_jump_to_interesting_tab")) {
		$("#jump_to_interesting_tab").prop("checked", false).trigger("change");
	}

	if(urlParams.get("autostart_training")) {
		train_neural_network();
	}

	if(urlParams.get("data_source")) {
		$("#data_origin").val(urlParams.get("data_source")).trigger("change");
	}


	cookie_theme = getCookie("theme");
	if(cookie_theme) {
		l("Has cookie for " + cookie_theme);
		$("#theme_choser").val(cookie_theme).trigger("change")
		l("Set theme");
	}

	get_drawing_board_on_page($("#predict_handdrawn_canvas"), "sketcher", "predict_handdrawn();");

	l("Installing change-handlers on optimizer_metadata_input");
	$('.optimizer_metadata_input'). change(function(event) {
		updated_page();
	});
	l("Done installing change handlers on optimizer_metadata_input");

	alter_text_webcam_series();
	$("#webgl_backend").prop("checked", true).trigger("change");

	l("Git-Hash: " + git_hash);

	l("TFJS-Version: " + tf.version["tfjs-core"]);

	toggle_show_input_layer();

	invert_elements_in_dark_mode();

	document.addEventListener('keydown', (event) => {
		const currentTime = new Date().getTime();

		if (event.key === 'Escape') {
			if (currentTime - lastEscapeTime < 1000) {
				escapeCount++;
			} else {
				escapeCount = 1;
			}
			lastEscapeTime = currentTime;

			if (escapeCount === 3) {
				escapeCount = 0;
				lastEscapeTime = 0;
				cosmo_mode();
			}
		}
	});

	click_on_graphs = 0;

	allow_editable_labels();

	s.close();

	l("Site is ready");
});
