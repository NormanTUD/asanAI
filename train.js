"use strict";

function gui_in_training () {
	started_training = true;
	disable_everything();
	favicon_spinner();
	write_descriptions();
}

function gui_not_in_training () {
	started_training = false;
	$(".train_neural_network_button").html("Start training").removeClass("stop_training").addClass("start_training");
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
}

async function train_neural_network () {
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
		l("Stopped training");
	} else {
		l("Started training")
		last_training_time = Date.now();
		gui_in_training();

		training_logs_batch = {
			"loss": {
				"x": [],
				"y": [],
				"type": get_scatter_type(),
				"mode": 'lines+markers',
				"name": 'Loss'
			}
		};

		training_logs_epoch = {
			"loss": {
				"x": [],
				"y": [],
				"type": get_scatter_type(),
				"mode": 'lines+markers',
				"name": 'Loss'
			}
		};

		last_batch_time = 0;

		time_per_batch = {
			"time": {
				"x": [],
				"y": [],
				"type": get_scatter_type(),
				"mode": 'lines+markers',
				"name": 'Time per batch (in seconds)'
			}
		}

		training_memory_history = {
			numBytes: {
				"x": [],
				"y": [],
				"type": get_scatter_type(),
				"mode": 'lines+markers',
				"name": 'RAM (MB)'
			},
			numBytesInGPU: {
				"x": [],
				"y": [],
				"type": get_scatter_type(),
				"mode": 'lines+markers',
				"name": 'GPU (MB)'
			},
			numTensors: {
				"x": [],
				"y": [],
				"type": get_scatter_type(),
				"mode": 'lines+markers',
				"name": 'Number of Tensors'
			}
		}

		reset_gui_before_training();

		$("#percentage").html("");
		$("#percentage").hide();

		await run_neural_network();

		enable_everything();

		await show_prediction();
	}

	write_descriptions();
	write_model_to_latex_to_page();

	save_current_status();
}

function getKeyByValue(object, value) {
	return Object.keys(object).find(key => object[key] === value);
}

function get_model_data (optimizer_name_only) {
	var loss = $("#loss").val();
	var optimizer_type = $("#optimizer").val();
	var metric_type = $("#metric").val();

	if(Object.values(metric_shortnames).includes(metric_type)) {
		metric_type = getKeyByValue(metric_shortnames, metric_type);
	}

	var epochs = parseInt($("#epochs").val());
	var batchSize = parseInt($("#batchSize").val());
	var validationSplit = parseInt($("#validationSplit").val());
	var divide_by = parseFloat($("#divide_by").val());

	var model_data = {
		loss: loss,
		optimizer_name: optimizer_type,
		optimizer: optimizer_type,
		metrics: metric_type,
		metric: metric_type,
		epochs: epochs,
		batchSize: batchSize,
		validationSplit: validationSplit,
		divide_by: divide_by,
		labels: labels
	};

	if(!is_hidden_or_has_hidden_parent($("#height"))) {
		model_data["width"] = width;
		model_data["height"] = height;
	}

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

	// TODO:
	// original_function = tf.train.adam
	// tf.train.adam = function (e, t, n, r) { log("ADAM etnr:", e, t, n, r); var res = original_function(e, t, n, r); log("res", res); return res; }

	if(!optimizer_name_only) {
		model_data["optimizer"] = eval("tf.train." + optimizer_constructors[model_data["optimizer"]]);
		/*
		var old_applyGradients = model_data["optimizer"].applyGradients;
		model_data["optimizer"].applyGradients = function (...args) {
			log("Optimizer args:");
			log(args);
			
			var res = old_applyGradients(...args);
			log("Optimizer res:");
			log(res);

			return res;
		}
		*/
	}

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

	callbacks["onTrainBegin"] = async function () {
		current_epoch = 0;
		this_training_start_time = Date.now()
		$(".training_performance_tabs").show();

		if($("#jump_to_interesting_tab").is(":checked")) {
			show_tab_label("tfvis_tab_label", 1);
		} else {
			show_tab_label("tfvis_tab_label", 0);
		}

	};

	callbacks["onBatchBegin"] = async function () {
		if(!started_training) {
			model.stopTraining = true;
		}

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

		$("#training_progress_bar").show();

		document.title = "[" + current_epoch + "/" + max_number_epochs + ", " + time_estimate  + "] asanAI";

		var percentage = parseInt((current_epoch / max_number_epochs) * 100);
		$("#training_progressbar>div").css("width", percentage + "%")
		/*
		if(training_logs_batch["loss"]["x"] && training_logs_batch["loss"]["x"].length) {
			$("#approximation_equation").parent().show();
			$("#approximation_equation").html(least_square_equation(training_logs_batch["loss"]["x"], training_logs_batch["loss"]["y"]));
		} else {
			$("#approximation_equation").parent().hide();
		}
		*/
	}

	callbacks["onBatchEnd"] = function (batch, logs) {
		delete logs["batch"];
		delete logs["size"];

		var batchNr = 1;
		var loss = logs["loss"];
		if(training_logs_batch["loss"]["x"].length) {
			batchNr = Math.max(...training_logs_batch["loss"]["x"]) + 1;
		}
		training_logs_batch["loss"]["x"].push(batchNr);
		training_logs_batch["loss"]["y"].push(loss);

		if(!last_batch_time) {
			last_batch_time = +new Date();
		} else {
			var current_time = +new Date();
			time_per_batch["time"]["x"].push(batchNr);
			time_per_batch["time"]["y"].push((current_time - last_batch_time) / 1000);
			last_batch_time = current_time;
		}

		var this_plot_data = [training_logs_batch["loss"]];

		var memory_status = tf.memory();

		/*
		var objects_in_training_memory_history = Object.keys(training_memory_history);

		for (var i = 0; i < objects_in_training_memory_history.length; i++) {
			var name = objects_in_training_memory_history[i];

			training_memory_history[name]["x"].push(batchNr);
			if(["numBytes", "numBytesInGPU"].includes(name)) {
				training_memory_history[name]["y"].push(memory_status[name] / 1048576);
			} else {
				training_memory_history[name]["y"].push(memory_status[name]);
			}
		}
		*/


		$("#plotly_batch_history").parent().show();
		$("#plotly_time_per_batch").parent().show();
		//$("#plotly_memory_history").parent().show();

		if(batchNr == 1) {
			Plotly.newPlot('plotly_batch_history', this_plot_data, plotly_color);
			Plotly.newPlot('plotly_time_per_batch', [time_per_batch["time"]], plotly_color);
			//Plotly.newPlot('plotly_memory_history', [training_memory_history["numBytesInGPU"], training_memory_history["numBytes"], training_memory_history["numTensors"]], plotly_color);
		} else {
			Plotly.update('plotly_batch_history', this_plot_data, plotly_color);
			Plotly.update('plotly_time_per_batch', [time_per_batch["time"]], plotly_color);
			//Plotly.update('plotly_memory_history', [training_memory_history["numBytesInGPU"], training_memory_history["numBytes"], training_memory_history["numTensors"]], plotly_color);
		}

		if($("#auto_update_predictions").is(":checked")) {
			if($('#predict_own_data').val()) {
				predict($('#predict_own_data').val());
			}
			show_prediction(0, 1);
			predict_handdrawn();
		}

		setTimeout('', 1); // thread yield
	};

	callbacks["onEpochEnd"] = function (batch, logs) {
		delete logs["epoch"];
		delete logs["size"];

		var epochNr = 1;
		var loss = logs["loss"];
		if(training_logs_epoch["loss"]["x"].length) {
			epochNr = Math.max(...training_logs_epoch["loss"]["x"]) + 1;
		}
		training_logs_epoch["loss"]["x"].push(epochNr);
		training_logs_epoch["loss"]["y"].push(loss);


		var other_key_name = "val_loss";

		var this_plot_data = [training_logs_epoch["loss"]];

		if(Object.keys(logs).includes(other_key_name)) {
			if(epochNr == 1) {
				training_logs_epoch[other_key_name] = {
					"x": [],
					"y": [],
					"type": get_scatter_type(),
					"mode": 'lines+markers',
					"name": 'Loss'
				};
			}

			loss = logs[other_key_name];
			training_logs_epoch[other_key_name]["x"].push(epochNr);
			training_logs_epoch[other_key_name]["y"].push(loss);
			training_logs_epoch[other_key_name]["mode"] = "lines+markers";
			training_logs_epoch[other_key_name]["name"] = other_key_name;

			this_plot_data.push(training_logs_epoch[other_key_name]);
		}

		$("#plotly_epoch_history").parent().show();
		if(epochNr == 1) {
			Plotly.newPlot('plotly_epoch_history', this_plot_data, plotly_color);
		} else {
			Plotly.update('plotly_epoch_history', this_plot_data, plotly_color);
		}
	}

	callbacks["onTrainEnd"] = async function () {
		favicon_default();
		write_model_to_latex_to_page();
		document.title = original_title;
		restart_fcnn();
		restart_lenet();
		restart_alexnet();
	}

	if($("#enable_early_stopping").is(":checked")) {
		callbacks["earlyStopping"] = tf.callbacks.earlyStopping({
			monitor: $("#what_to_monitor_early_stopping").val(),
			minDelta: parseFloat($("#min_delta_early_stopping").val()),
			patience: parseInt($("#patience_early_stopping").val()),
		});
	}

	var fit_data = {
		validationSplit: validationSplit,
		batchSize: batchSize,
		epochs: epochs,
		shuffle: $("#shuffle_before_each_epoch").is(":checked"),
		verbose: 0,
		callbacks: callbacks,
		yieldEvery: 'batch'
	};

	traindebug("fit_data:");
	traindebug(fit_data);

	return fit_data;
}

function show_info_pre_run () {
	write_model_summary_wait();
}

function show_info_after_run (h) {
	assert(typeof(h) == "object", "history object is not of type object");

	traindebug("Showing tfvis/history/memory");
}

async function run_neural_network () {
	clean_gui();
	$(".train_neural_network_button").html("Stop training").removeClass("start_training").addClass("stop_training");

	for (var i = 0; i < model.layers.length; i++) {
		if("original_apply" in model.layers[i]) {
			eval("model.layers[" + i + "].apply = model.layers[" + i + "].original_apply;\n");
		}
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
		l("Getting data...");
		xs_and_ys = await get_xs_and_ys();
		show_tab_label("tfvis_tab_label", $("#jump_to_interesting_tab").is(":checked") ? 1 : 0);
		l("Got data!");

		if(xs_and_ys) {
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
		} else {
			error_string = "No xy_data. Maybe an error while augmenting data?"
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
		$(".train_neural_network_button").html("Start training").removeClass("stop_training").addClass("start_training");
		started_training = false;
		return;
	}

	if(started_training) {
		var inputShape = set_input_shape("[" + xs_and_ys["x"].shape.slice(1).join(", ") + "]");

		$("#training_content").clone().appendTo("#tfvis_tab");

		$("#plotly_epoch_history").parent().hide();
		$("#plotly_epoch_history").html("");

		try {
			await compile_model();
		} catch (e) {
			write_error_and_reset(e);
		}

		try {
			add_layer_debuggers();

			var fit_data = get_fit_data();

			l("Started model.fit");

			if(xs_and_ys["x"].shape.length == 2 && xs_and_ys["x"].shape[1] == 1) {
				if(xs_and_ys["x"].shape.length == 2 && xs_and_ys["x"].shape[1] == 1) {
					old_onEpochEnd = fit_data["callbacks"]["onBatchEnd"];

					var new_on_batch_end_callback = await get_live_tracking_on_batch_end("model", parseInt($("#epochs").val()), JSON.stringify(xs_and_ys["x"].arraySync()), JSON.stringify(xs_and_ys["y"].arraySync()), false, "simplest_training_data_visualization");
					//log(new_on_batch_end_callback);
					if(new_on_batch_end_callback) {
						fit_data["callbacks"]["onBatchEnd"] = new_on_batch_end_callback;
						//log("tried installing new callbacks in fit_data:", fit_data);
						$("#simplest_training_data_visualization").show()
					} else {
						log("Could not install new callback");
					}


				}
			} else {
				old_onEpochEnd = undefined;
				$("#simplest_training_data_visualization").html("").hide();
			}

			if($("#jump_to_interesting_tab").is(":checked")) {
				show_tab_label("tfvis_tab_label", 1);
			} else {
				show_tab_label("tfvis_tab_label", 0);
			}

			h = await model.fit(xs_and_ys["x"], xs_and_ys["y"], fit_data);
			l("Finished model.fit");

			show_info_after_run(h);

			dispose(h);
		} catch (e) {
			write_error_and_reset(e);
		}

		var trained_weights = undefined;
		try {
			/* Memory leak in model.fit: prevention: save weights as string, delete everything,
			 * then restore the model with the saved weights. Not pretty, but it works...  */

			//log("Training done, getting weights");
			trained_weights = await get_weights_as_string();

			reset_data();

			tf.disposeVariables();

			model = await create_model(null, await get_model_structure(), 1);
		} catch (e) {
			write_error_and_reset(e);
		}

		try {
			await set_weights_from_string(trained_weights, 1, 1);

			dispose(xs_and_ys["x"]);
			dispose(xs_and_ys["y"]);
			xs_and_ys = null;

			/* Memory leak hack end */

			model_is_trained = true;

			$("#predictcontainer").show();
			$("#predict_error").hide().html("");

			enable_everything();

			$("#training_progress_bar").hide();
		} catch (e) {
			write_error_and_reset(e);
		}
	}

	gui_not_in_training();

	reset_data();

	tf.engine().endScope();

	save_current_status();
	var training_time = parseInt(parseInt(Date.now() - last_training_time) / 1000);
	l("Done training, took " + human_readable_time(training_time) + " (" + training_time + "s)");
	last_training_time = "";
}

function write_error_and_reset(e) {
	write_error(e);
	reset_on_error();
}

function reset_on_error () {
	started_training = false;

	document.body.style.cursor = "default";
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
