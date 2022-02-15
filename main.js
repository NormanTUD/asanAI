"use strict";

function reset_page () {
	init_dataset_category();
	init_dataset();
}

function output_size_at_layer (input_size_of_first_layer, layer_nr) {
	if(model === null) {
		compile_model();
	}
	var output_size = input_size_of_first_layer;
	for (var i = 0; i < model.layers.length; i++) {
		output_size = model.layers[i].getOutputAt(0)["shape"];
		if(i == layer_nr) {
			return output_size;
		}
	}
	return output_size;
}

function get_full_shape_from_file (file) {
	if(file === null) {
		return null;
	}
	var input_shape_line = file.split("\n")[0];
	var shape_match = /^#\s*shape \((.*)\)$/.exec(input_shape_line);
	if(1 in shape_match) {
		return shape_match[1];
	}
	return null;
}

function get_shape_from_file (file) {
	if(file === null) {
		return null;
	}
	var input_shape_line = file.split("\n")[0];
	var shape_match = /^#\s*shape \(\d+,\s*(.*)\)$/.exec(input_shape_line);

	if(1 in shape_match) {
		return shape_match[1];
	}
	return null;
}

async function _get_training_data() {
	const data = await $.getJSON("traindata/index.php?dataset=" + $("#dataset").val() + "&dataset_category=" + $("#dataset_category").val() + "&max_number_of_files_per_category=" +  $("#max_number_of_files_per_category").val() + "&t=" + Math.floor(Date.now() / 1000));
	return data;
}

async function handle_x_file(evt) {
	x_file = await evt.target.files[0].text();
	set_input_shape("[" + get_shape_from_file(x_file) + "]");
	updated_page();
}

async function handle_y_file(evt) {
	y_file = await evt.target.files[0].text();
	y_shape = get_shape_from_file(y_file);
	$("#y_shape_div").show();
	$("#y_shape").val(y_shape);
	updated_page();
}

function determine_input_shape () {
	if($("#dataset_category").val() == "image") {
		set_input_shape("[" + width + ", " + height + ", 3]");
	}
}

$(document).ready(function() {
	global_disable_auto_enable_valid_layer_types = true;
	disable_show_python_and_create_model = true;
	$("#width").val(width);
	$("#height").val(height);

	$("#upload_own_data_group").hide();
	$("#train_data_set_group").hide();

	init_dataset_category().then(() => {
		global_disable_auto_enable_valid_layer_types = true; // warum?!?!?!?!?!
		init_epochs(2);
		set_batchSize(5);
	});

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

	$("#ribbon").children().each(function (i, e) {
		var title = $(e).prop("title");
		if(title) {
			var named_id = $(e).prop("id");
			$("#tablist").append("<li><a href=#" + named_id + ">" + title + "</a></li>");
		}
	});

	$("#tablist").show();
	$("#ribbon").tabs();
	$("#right_side").tabs(); 
	$("#visualization_tab").tabs();
	$("#tfvis_tab").tabs();
	$("#code_tab").tabs();

	if(["image"].includes($("#dataset_category").val())) {
		$("#train_data_set_group").show();
	}

	global_disable_auto_enable_valid_layer_types = false;
	disable_show_python_and_create_model = false;

	set_mode();

	var initializer_keys = Object.keys(initializers);

	for (var i = 0; i < initializer_keys.length; i++) {
		$('#set_all_bias_initializers').append($('<option>', {
			value: initializer_keys[i],
			text: initializer_keys[i]
		}));
	}

	for (var i = 0; i < initializer_keys.length; i++) {
		$('#set_all_kernel_initializers').append($('<option>', {
			value: initializer_keys[i],
			text: initializer_keys[i]
		}));
	}

	var activation_functions = Object.keys(activations);

	for (var i = 0; i < activation_functions.length; i++) {
		$('#set_all_activation_functions').append($('<option>', {
			value: activation_functions[i],
			text: activation_functions[i]
		}));
	}

	document.addEventListener('keydown', function(event) {
		if (event.ctrlKey && event.key === 'z') {
			undo();
		} else if (event.ctrlKey && event.key === 'y') {
			redo();
		}
	});
});

function get_output_shape () {
	return $("#outputShape").val();
}

function fcnn_fill_layer (layer_nr) {
	restart_fcnn();
	restart_lenet();

	$("[id^=fcnn_" + layer_nr + "_]").css("fill", "red");
	$("[id^=lenet_" + layer_nr + "_]").css("fill", "red");
}

function upload_model(evt) {
	let files = evt.target.files;

	let f = files[0];

	let reader = new FileReader();

	// Closure to capture the file information.
	reader.onload = (function(theFile) {
		return function(e) {
			local_store.setItem("tensorflowjs_models/mymodel", e.target.result);
		};
	})(f);

	// Read in the image file as a data URL.
	reader.readAsText(f);

	set_config();

	add_layer_debuggers();
}

async function upload_weights(evt) {
	let files = evt.target.files;

	let f = files[0];

	let reader = new FileReader();

	// Closure to capture the file information.
	reader.onload = (() => function(theFile) {
		return function(e) {

		};
	})(f);

	// Read in the image file as a data URL.
	reader.readAsText(f);

	var modelUpload = document.getElementById('upload_model');
	var weightsUpload = document.getElementById('upload_weights');

	model = await tf.loadLayersModel(tf.io.browserFiles([modelUpload.files[0], weightsUpload.files[0]]));

	add_layer_debuggers();

	$("#predictcontainer").show();
	$('a[href="#predict_tab"]').click();
}


