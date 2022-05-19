"use strict";

function gui_in_training () {
	started_training = true;
	disable_everything();
	favicon_spinner();
	write_descriptions();
}

function gui_not_in_training () {
	started_training = false;
	$("#train_neural_network_button").html("Start training");
	favicon_default();

	try {
		if (!tf.engine().state.activeScope === null) {
			tf.engine().endScope();
		}
	} catch (e) {
		log(e);
	}

	enable_everything();
	$(".show_after_training").show();
}

function reset_gui_before_training () {
	prev_layer_data = []
	$(".reset_before_train_network").html("");
	$("#percentage").html("");
	$("#percentage").show();
	$(".input_image_grid").html("");
	$(".output_image_grid").html("");
	reset_photo_gallery();
	reset_summary();
	reset_history();
}

async function train_neural_network () {
	write_descriptions();

	if(!Object.keys(model).includes("layers")) {
		gui_not_in_training();
		write_error("Something went wrong with compiling the model. Please reload the site.");
	}

	if(started_training) {
		Swal.fire({
			title: 'Stopped training',
			html: "This may take some time...",
			timer: 1000,
			showConfirmButton: false
		});

		if(model.isTraining || model.isTraining) {
			model.stopTraining = true;
			model.stopTraining = true;
		}

		document.title = original_title;
		gui_not_in_training();
	} else {
		gui_in_training();
		reset_gui_before_training();

		$("#percentage").html("");
		$("#percentage").hide();

		await run_neural_network();

		enable_everything();

		show_prediction();
	}

	write_descriptions();
	write_model_to_latex_to_page();

	save_current_status();
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
		model_data[optimizer_data_names[i]] = parseFloat($("#" + optimizer_data_names[i] + "_" + optimizer_type).val());
	}


	var optimizer_constructors = {
		"adadelta": "adadelta(model_data['learningRate'], model_data['rho'], model_data['epsilon'])",
		"adagrad": "adagrad(model_data['learningRate'], model_data['initialAccumulatorValue'])",
		"adam": "adam(model_data['learningRate'], model_data['beta1'], model_data['beta2'], model_data['epsilon'])",
		"adamax": "adamax(model_data['learningRate'], model_data['beta1'], model_data['beta2'], model_data['epsilon'], model_data['decay'])",
		"rmsprop": "rmsprop(model_data['learningRate'], model_data['decay'], model_data['momentum'], model_data['epsilon'], model_data['centered'])",
		"sgd": "sgd(model_data['learningRate'])"
	};

	model_data["optimizer"] = eval("tf.train." + optimizer_constructors[model_data["optimizer"]]);

	return model_data;
}

function delay(time) {
	return new Promise(resolve => setTimeout(resolve, time));
}

function get_fit_data () {
	var epochs = get_epochs();
	var batchSize = get_batchSize();
	var validationSplit = parseInt($("#validationSplit").val()) / 100;

	var callbacks = {};

	callbacks = tfvis.show.fitCallbacks(
		$("#tfvis_tab_training_performance_graph")[0],
		["loss", "acc", "val_loss", "val_acc" ],
		{ height: 200, callbacks: ["onBatchEnd", "onEpochEnd"] }
	);

	callbacks["onTrainBegin"] = async function () {
		current_epoch = 0;
		this_training_start_time = Date.now()
		hide_annoying_tfjs_vis_overlays();
		$(".training_performance_tabs").show();

		if($("#jump_to_training_tab").is(":checked")) {
			show_tab_label("tfvis_tab_label", 1);
		} else {
			show_tab_label("tfvis_tab_label");
		}

		hide_annoying_tfjs_vis_overlays();
	};

	callbacks["onBatchBegin"] = async function () {
		if(!started_training) {
			model.stopTraining = true;
		}

		hide_annoying_tfjs_vis_overlays();
		if(!is_hidden_or_has_hidden_parent($("#math_tab"))) {
			write_model_to_latex_to_page();
		}
	};

	callbacks["onEpochBegin"] = async function () {
		current_epoch++;
		var max_number_epochs = get_epochs();
		var current_time = Date.now();
		var epoch_time = (current_time - this_training_start_time) / current_epoch;
		var epochs_left = max_number_epochs - current_epoch;
		var time_estimate = human_readable_time(parseInt(Math.ceil((epochs_left * epoch_time) / 1000) / 5) * 5);
		document.title = "[" + current_epoch + "/" + max_number_epochs + ", " + time_estimate  + "] " + "NNE";
	}

	callbacks["onTrainEnd"] = async function () {
		favicon_default();
		hide_annoying_tfjs_vis_overlays();
		write_model_to_latex_to_page();
		document.title = original_title;
	}

	if($("#enable_early_stopping").is(":checked")) {
		callbacks["earlyStopping"] = tf.callbacks.earlyStopping({
			monitor: $("#what_to_monitor_early_stopping").val(),
			minDelta: parseFloat($("#min_delta_early_stopping").val()),
			patience: parseInt($("#patience_early_stopping").val()),
		});
	}

	//callbacks["onBatchEnd"] = async function () {
	//}

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
	write_model_summary();
}

function show_info_after_run (h) {
	assert(typeof(h) == "object", "history object is not of type object");

	traindebug("Showing tfvis/history/memory");
	write_history(h);
	print_memory();
}

async function run_neural_network () {
	clean_gui();
	$("#train_neural_network_button").html("Stop training");

	for (var i = 0; i < model.layers.length; i++) {
		if("original_apply" in model.layers[i]) {
			eval("model.layers[" + i + "].apply = model.layers[" + i + "].original_apply;\n");
		}
	}

	show_tab_label("tfvis_tab_label");

	if($("#jump_to_training_tab").is(":checked")) {
		show_tab_label("tfvis_tab_label", 1);
		show_tab_label("tfvis_tab_training_performance_label", 1);
	}

	try {
		model = await create_model(model);
	} catch (e) {
		alert("Creating model failed: " + e);
		return;
	}

	try {
		await compile_model();
	} catch (e) {
		alert("Compiling model failed: " + e);
		return;
	}

	tf.engine().startScope();

	var xs_and_ys;

	try {
		var error_string = "";
		show_info_pre_run();

		disable_everything();
		xs_and_ys = await get_xs_and_ys();

		if(Object.keys(xs_and_ys).includes("x")) {
			if(xs_and_ys["x"].shape.toString() == "0") {
				error_string += "No X-data! ";
			}
		} else {
			error_string += "No X-data! ";
		}

		if(Object.keys(xs_and_ys).includes("y")) {
			if(xs_and_ys["y"].shape.toString() == "0") {
				error_string += "No Y-data! ";
			}
		} else {
			error_string += "No Y-data! ";
		}


		if(error_string) {
			throw new Error(error_string);
		}
	} catch (e) {
		var explanation = explain_error_msg(e.toString());
		if(explanation) {
			explanation = "<br><br>" + explain_error_msg(e.toString());
		} else {
			explanation = "";
		}
		Swal.fire(
			'Error while training',
			e.toString() + explanation,
			'warning'
		);
		header("ERROR");
		log(e);
		header("ERROR END");
		console.trace();
		favicon_default();
		write_descriptions();
		$("#train_neural_network_button").html("Start training");
		started_training = false;
		return;
	}

	if(started_training) {
		var inputShape = set_input_shape("[" + xs_and_ys["x"].shape.slice(1).join(", ") + "]");

		if($("#jump_to_training_tab").is(":checked")) {
			show_tab_label("training_performance_tab_label");
			if($("#data_origin").val() == "default") {
				show_tab_label("training_data_tab_label", 1);
			}
			show_tab_label("tfvis_tab_training_performance_label", 1);
		}

		try {
			add_layer_debuggers();

			var fit_data = get_fit_data();

			h = await model.fit(xs_and_ys["x"], xs_and_ys["y"], fit_data);

			/* Memory leak in model.fit: prevention: save weights as string, delete everything,
			 * then restore the model with the saved weights. Not pretty, but it works...  */

			var trained_weights = await get_weights_as_string();

			reset_data();

			tf.disposeVariables();

			model = await create_model(null, await get_model_structure(), 1);
			await compile_model();

			await set_weights_from_string(trained_weights, 1, 1);

			dispose(xs_and_ys["x"]);
			dispose(xs_and_ys["y"]);
			xs_and_ys = null;

			/* Memory leak hack end */

			model_is_trained = true;

			$("#predictcontainer").show();
			$("#predict_error").hide().html("");

			show_info_after_run(h);

			dispose(h);

			enable_everything();
		} catch (e) {
			write_error(e);

			started_training = false;

			$('body').css('cursor', 'default');
			$("#layers_container").sortable("enable");
			$("#ribbon,select,input,checkbox").prop("disabled", false);
			write_descriptions();
			Prism.highlightAll();

			var link = document.querySelector("link[rel~='icon']");
			if (!link) {
				link = document.createElement('link');
				link.rel = 'icon';
				document.getElementsByTagName('head')[0].appendChild(link);
			}
			link.href = 'favicon.ico';
		}
	}

	gui_not_in_training();

	reset_data();

	tf.engine().endScope();

	save_current_status();
}
