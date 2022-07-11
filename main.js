"use strict";

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
	var tabs_settings = {
		activate: function (event, ui) {
			disable_hidden_chardin_entries();
			hide_annoying_tfjs_vis_overlays();
		}
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
	var initializer_keys = Object.keys(initializers);
	var activation_functions = Object.keys(activations);

	var set_all_bias_initializers = $('#set_all_bias_initializers')
	var set_all_kernel_initializers = $('#set_all_kernel_initializers');
	var set_all_activation_functions = $('#set_all_activation_functions');

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
	}

	document.addEventListener('keydown', function(event) {
		if (event.ctrlKey && event.key === 'z') {
			undo();
		} else if (event.ctrlKey && event.key === 'y') {
			redo();
		} else if (event.ctrlKey && event.key === ';') {
			$("#jump_to_training_tab").click();
			$("#jump_to_predict_tab").click();
			train_neural_network();
		} else if (event.ctrlKey && event.key === ',') {
			train_neural_network();
		} else if (event.ctrlKey && event.key === 'L') {
			$("#jump_to_predict_tab").click();
			$("#jump_to_training_tab").click();
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
	skip_predictions = true;
	disabling_saving_status = true;
	global_disable_auto_enable_valid_layer_types = true;
	disable_show_python_and_create_model = true;

	$("#width").val(width);
	$("#height").val(height);

	$("#train_data_set_group").hide();

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

	if(["image"].includes($("#dataset_category").val())) {
		$("#train_data_set_group").show();
	}

	await set_config();
	is_setting_config = false;

	global_disable_auto_enable_valid_layer_types = false;
	disable_show_python_and_create_model = false;

	if(chosen_dataset) {
		$("#dataset").val(chosen_dataset).trigger("change");
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
	if(getCookie("dataset_category")) {
		l("Setting dataset_category to " + getCookie("dataset_category") + " from cookie");
		$("#dataset_category").val(getCookie("dataset_category"));
	} else if(get_get("dataset_category")) {
		$("#dataset_category").val(get_get("dataset_category"));
	} else {
		$("#dataset_category").val("image");
	}

	await init_page_contents();
	write_descriptions();
}

function init_categories () {
	var chosen_category = $("#dataset_category").val();
	var categories = Object.keys(traindata_struct);

	$("#dataset").html("");

	for (var i = 0; i < categories.length; i++) {
		var existing_keys = $.map($("#dataset_category option"), e => $(e).val())
		var folder_name = traindata_struct[categories[i]]["category_name"];
		var category = categories[i];
		if(!existing_keys.includes(folder_name)) {
			$("#dataset_category").prepend(`<option value="${folder_name}">${category}</option>`);
		}

		if(folder_name == chosen_category) {
			var datasets = traindata_struct[categories[i]]["datasets"];

			var dataset_names = Object.keys(datasets);
			for (var j = 0; j < dataset_names.length; j++) {
				var dataset_name = dataset_names[j];
				if(!dataset_already_there(dataset_name)) {
					var dataset_value = datasets[dataset_names[j]]["name"];
					var existing_keys_in_dataset = $.map($("#dataset option"), e => $(e).val())
					if(!existing_keys_in_dataset.includes(folder_name)) {
						$("#dataset").append(`<option value="${dataset_value}">${dataset_name}</option>`);
					}
				}
			}
		}
	}

	number_of_initialized_layers = 0;
}

function fix_graph_color () {
	$(".subsurface-title").css("background-color", "transparent").css("border-bottom", "transparent");
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

$(document).ready(async function() {
	swalmsg("Checking webcams");

	var available_webcam_data = await get_available_cams();
	available_webcams = available_webcam_data[0];
	available_webcams_ids = available_webcam_data[1];

	log("Number of available cams: " + available_webcams.length);

	if(available_webcams.length) {
		l("Webcam(s) were found. Enabling webcam related features.");
		l("List of found webcams: " + available_webcams.join(", "));
		$(".only_when_webcam").show();

		if(await hasBothFrontAndBack()) {
			$(".only_when_front_and_back_camera").show();
		} else {
			$(".only_when_front_and_back_camera").hide();
		}

		if(available_webcams.length > 1) {
			$(".only_when_multiple_webcams").show();
			for (var i = 0; i < available_webcams.length; i++) {
				$('#which_webcam').append($('<option>', {
					value: i,
					text: available_webcams[i]
				}));
			}
		} else {
			$(".only_when_multiple_webcams").hide();
		}
	} else {
		l("No webcams were found. Disabling webcam related features.");
		$(".only_when_webcam").hide();
		$(".only_when_multiple_webcams").hide();
		$(".only_when_front_and_back_camera").hide();
	}

	swalmsg("Loading page");

	$("#register_form").submit(function(e) {
		e.preventDefault();
		register();
	});

	if(getCookie("session_id") != null) {
		$("#register").hide();
		$("#logout").show();
		$(".show_when_logged_in").show();
	}

	assert(layer_types_that_dont_have_default_options().length == 0, "There are layer types that do not have default options");


	init_tabs();
	init_set_all_options();
	init_categories();

	if(getCookie("dataset_category")) {
		l("Setting dataset_category to " + getCookie("dataset_category") + " from cookie");
		$("#dataset_category").val(getCookie("dataset_category"));
	} else if(get_get("dataset_category")) {
		$("#dataset_category").val(get_get("dataset_category"));
	} else {
		$("#dataset_category").val("image");
	}

	await init_page_contents();

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

	await show_or_hide_load_weights();

	await change_data_origin();

	window.onresize = reset_view;

	setInterval(fix_lenet_width, 700);

	setInterval(fix_graph_color, 700);

	//$("#lenet_tab_label").click();
	//$("#code_tab_label").click()

	allow_edit_inputShape();

	setInterval(check_number_values, 200);
	setInterval(display_delete_button, 200);
	setInterval(write_descriptions, 500);
	//setInterval(restart_fcnn, 500);

	copy_options();
	copy_values();
});
