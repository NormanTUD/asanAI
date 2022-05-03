"use strict";

function gui_in_training () {
	started_training = true;
	$("#train_neural_network_button").html("Stop training");
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
	$("#tfvis_tab_label").parent().show();
	write_descriptions();

	if(started_training) {
		if(model.isTraining || model.model.isTraining) {
			model.stopTraining = true;
			model.model.stopTraining = true;
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
	}

	write_descriptions();
	write_model_to_latex_to_page();
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

		$("#tfvis_tab_label").parent().show();
		if($("#jump_to_training_tab").is(":checked")) {
			$("#tfvis_tab_label").click();
		}
		hide_annoying_tfjs_vis_overlays();
	};

	callbacks["onBatchBegin"] = async function () {
		if(!started_training) {
			model.stopTraining = true;
			model.model.stopTraining = true;

			this.model.stopTraining = true;
			this.model.model.stopTraining = true;
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
		show_prediction();
		hide_annoying_tfjs_vis_overlays();
		write_model_to_latex_to_page();
		document.title = original_title;
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

	for (var i = 0; i < model.layers.length; i++) {
		if("original_apply" in model.layers[i]) {
			eval("model.layers[" + i + "].apply = model.layers[" + i + "].original_apply;\n");
		}
	}


	$("#tfvis_tab_label").show();

	if($("#jump_to_training_tab").is(":checked")) {
		$('a[href="#tfvis_tab"]').click();
		$('a[href="#tfvis_tab_training_performance"]').show();
		$('a[href="#tfvis_tab_training_performance"]').click();
	}

	try {
		model = create_model(model);
		try {
			compile_model();
			try {
				show_info_pre_run();

				disable_everything();
				var xs_and_ys = await get_xs_and_ys();

				if(started_training) {
					var inputShape = set_input_shape("[" + xs_and_ys["x"].shape.slice(1).join(", ") + "]");

					if($("#jump_to_training_tab").is(":checked")) {
						$('#training_performance_tab_label').show();
						if($("#data_origin").val() == "default") {
							$('a[href="#training_data_tab"]').click();
						}
						$('a[href="#tfvis_tab_training_performance"').click()
					}

					try {
						add_layer_debuggers();
						h = await model.fit(xs_and_ys["x"], xs_and_ys["y"], get_fit_data());

						model_is_trained = true;

						$("#train_neural_network_button").html("Start training");
						$("#predictcontainer").show();
						$("#predict_error").hide();
						$("#predict_error").html("");

						show_info_after_run(h);

						enable_everything();
						gui_not_in_training();
					} catch (e) {
						write_error(e);

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
			} catch (e) {
				write_error(e);
				console.trace();
				favicon_default();
			}
		} catch (e) {
			alert("Compiling model failed: " + e);
		}
	} catch (e) {
		alert("Creating model failed: " + e);
	}

	reset_data();
}
