"use strict";

function print_tensor_to_string (tensor) {
	var logBackup = console.log;
	var logMessages = [];

	console.log = function() {
		logMessages.push.apply(logMessages, arguments);
	};

	tensor.print(1);

	var return_str = logMessages.join("\n");

	console.log = logBackup;

	return return_str;
}

async function train_neural_network () {
	if(model.isTraining || model.model.isTraining) {
		model.stopTraining = true;
		model.model.stopTraining = true;
		$("#train_neural_network_button").html("Start training");
		enable_everything();
	} else {
		if(!loaded_tfvis) {
			var script = document.createElement("script");
			script.src = "tf/tfjs-vis.js";
			script.type = "text/javascript";
			script.onload = function () {
				loaded_tfvis = 1;
				load_tfvis();
			};
			document.getElementsByTagName("head")[0].appendChild(script);
		} else {
			load_tfvis();
		}

		$("#train_neural_network_button").html("Stop training");
		favicon_spinner();
		disable_everything();
		$(".call_counter").html("0");
		$(".reset_before_train_network").html("");
		$("#percentage").html("");
		$("#percentage").show();
		$(".input_image_grid").html("");
		$(".output_image_grid").html("");
		max_number_words = 0;
		max_number_characters = 0;
		reset_photo_gallery();
		reset_summary();
		reset_history();

		let xs_and_ys = await get_xs_and_ys();
		$("#percentage").html("");
		$("#percentage").hide();

		var result = await run_neural_network(xs_and_ys["x"], xs_and_ys["y"], xs_and_ys["keys"]);

		$("#train_neural_network_button").html("Start training");
		enable_everything();

		return result;
	}
}

function load_tfvis () {
	$("#tfvis_tab_layer").html("");
	for (var i = 0; i < get_numberoflayers(); i++) {
		$("#tfvis_tab_layer").append('<div id="tf_vis_layer_' + i + '"></div>');
		tfvis.show.layer($("#tf_vis_layer_" + i)[0], model.getLayer(null, i));
	}
}


function get_model_data () {
	var loss = $("#loss").val();
	var optimizer_type = $("#optimizer").val();
	var metric_type = $("#metric").val();

	var model_data = {
		loss: loss,
		optimizer: optimizer_type,
		metrics: metric_type
	};

	var optimizer_data_names = model_data_structure[optimizer_type];

	for (var i = 0; i < optimizer_data_names.length; i++) {
		model_data[optimizer_data_names[i]] = $("#" + optimizer_data_names[i] + "_" + optimizer_type).val();
	}

	return model_data;
}

function get_fit_data (show_tfvis) {
	var epochs = get_epochs();
	var batchSize = get_batchSize();
	var validationSplit = parseInt($("#validationSplit").val()) / 100;

	var callbacks = {};

	if(show_tfvis) {
		callbacks = tfvis.show.fitCallbacks(
			$("#tfvis_tab_training_performance_graph")[0],
			["loss", "acc", "val_loss", "val_acc" ],
			{ height: 200, callbacks: ["onBatchEnd", "onEpochEnd"] }
		);

		callbacks["onTrainBegin"] = function () {
			$(".training_performance_tabs").show();
			if($("#jump_to_training_tab").is(":checked")) {
				//$('#training_performance_tab_label').click();
				//$('a[href="#training_data_tab"]').click();
			}
		};

		callbacks["onTrainEnd"] = function () {
			restart_fcnn();
			favicon_default();

			show_prediction();
		}
	}

	var fit_data = {
		validationSplit: validationSplit,
		batchSize: batchSize,
		epochs: epochs,
		shuffle: true,
		verbose: 0,
		callbacks: callbacks
	};

	traindebug("fit_data:");
	traindebug(fit_data);

	return fit_data;
}

function show_info_pre_run () {
	write_model_model_summary(model);
}

function show_info_after_run (h) {
	traindebug("Showing tfvis/history/memory");
	tfvis.show.history($("#tfvis_tab_history_graphs")[0], h, Object.keys(h["history"]));
	write_history(h);
	print_memory();
}

async function run_neural_network (x, y, keys) {
	traindebug("x: ", x);
	traindebug("y: ", y);

	clean_gui();
	traindebug("x-shape: ", x.shape);

	var inputShape = set_input_shape("[" + x.shape.slice(1).join(", ") + "]");

	traindebug("inputShape: ", inputShape);

	$("#tfvis_tab_label").show();

	if($("#jump_to_training_tab").is(":checked")) {
		$('a[href="#tfvis_tab"]').click();
		$('a[href="#tfvis_tab_training_performance"]').click();
	}

	try {
		model = create_model(model);

		try {
			compile_model();

			try {
				show_info_pre_run();

				h = await model.fit(x, y, get_fit_data(1));

				$("#predictcontainer").show();
				$("#predict_error").hide();
				$("#predict_error").html("");

				show_info_after_run(h);

				return {"h": h, "model": model};
			} catch (e) {
				enable_everything();
				$("#errorcontainer").show();
				$("#error").html(e);
				explain_error_msg();
				header_error("ERROR:");
				header_error(e);
				console.trace();
				favicon_default();
			}
		} catch (e) {
			alert("Compiling model failed: " + e);
		}
	} catch (e) {
		alert("Creating model failed: " + e);
	}
}
