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

function gui_in_training () {
	started_training = true;
	$("#train_neural_network_button").html("Stop training");
	disable_everything();
	favicon_spinner();
}

function gui_not_in_training () {
	started_training = false;
	$("#train_neural_network_button").html("Start training");
	enable_everything();
	favicon_default();
}

function reset_gui_before_training () {
	$(".call_counter").html("0");
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
	if(started_training || model.isTraining || model.model.isTraining) {
		model.stopTraining = true;
		model.model.stopTraining = true;

		gui_not_in_training();
	} else {
		gui_in_training();
		reset_gui_before_training();

		$("#percentage").html("");
		$("#percentage").hide();

		run_neural_network();
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
		$(".training_performance_tabs").show();
	};

	callbacks["onBatchBegin"] = async function () {
		if(!started_training) {
			model.stopTraining = true;
			model.model.stopTraining = true;

			this.model.stopTraining = true;
			this.model.model.stopTraining = true;

			gui_not_in_training();
		}
	};

	callbacks["onTrainEnd"] = async function () {
		restart_fcnn();
		favicon_default();
		show_prediction();
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
	write_model_summary();
}

function show_info_after_run (h) {
	assert(typeof(h) == "object", "history object is not of type object");

	traindebug("Showing tfvis/history/memory");
	//tfvis.show.history($("#tfvis_tab_history_graphs")[0], h, Object.keys(h["history"]));
	write_history(h);
	print_memory();
}

async function run_neural_network () {
	clean_gui();

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

				const model_fit_task = async () => {
					disable_everything();
					var xs_and_ys = await get_xs_and_ys();

					if(started_training) {
						var inputShape = set_input_shape("[" + xs_and_ys["x"].shape.slice(1).join(", ") + "]");

						if($("#jump_to_training_tab").is(":checked")) {
							$('#training_performance_tab_label').show();
							$('a[href="#training_data_tab"]').click();
							$('a[href="#tfvis_tab_training_performance"').click()
						}

						try {
							h = await model.fit(xs_and_ys["x"], xs_and_ys["y"], get_fit_data());

							model_is_trained = true;

							$("#train_neural_network_button").html("Start training");

							$("#predictcontainer").show();
							$("#predict_error").hide();
							$("#predict_error").html("");

							show_info_after_run(h);

							enable_everything();

							return {"h": h, "model": model};
						} catch (e) {
							console.trace();
							$("#error").parent().show();
							$("#error").html(e);
							explain_error_msg();

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
				}

				return model_fit_task();
			} catch (e) {
				enable_everything();
				$("#errorcontainer").show();
				$("#error").html(e);
				explain_error_msg();
				header_error("ERROR:");
				header_error(e);
				explain_error_msg();
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
