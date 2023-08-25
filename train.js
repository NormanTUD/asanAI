"use strict";

async function gui_in_training () { var start_tensors = memory_leak_debugger();
	started_training = true;
	await disable_everything();
	favicon_spinner();
	await write_descriptions();
	memory_leak_debugger("gui_in_training", start_tensors);
}

async function gui_not_in_training () { var start_tensors = memory_leak_debugger();
	started_training = false;
	$(".train_neural_network_button").html("<span class='TRANSLATEME_start_training'></span>").removeClass("stop_training").addClass("start_training");
	updateTranslations();
	favicon_default();

	try {
		if (!tf.engine().state.activeScope === null) {
			tf.engine().endScope();
		}
	} catch (e) {
		log("" + e);
	}

	await enable_everything();
	$(".show_after_training").show();
	memory_leak_debugger("gui_not_in_training", start_tensors);
}

function reset_gui_before_training () { var start_tensors = memory_leak_debugger();
	prev_layer_data = []
	$(".reset_before_train_network").html("");
	$("#percentage").html("");
	$("#percentage").show();
	$(".input_image_grid").html("");
	$(".output_image_grid").html("");
	reset_photo_gallery();
	reset_summary();
	memory_leak_debugger("reset_gui_before_training", start_tensors);
}

async function train_neural_network () { var start_tensors = memory_leak_debugger();
	if(model === null || !Object.keys(model).includes("layers")) {
		await gui_not_in_training();
		await write_error("Something went wrong with compiling the model. Please reload the site.");

		return;
	}

	if(started_training) {
		if(is_cosmo_mode) {
			$(".auto_image_captions").remove();
			$("#webcam_in_cosmo").show();
			return;
			/*
			await add_cosmo_point("started_training", 0);
			remove_manicule(1);
			*/
		}

		if($("#show_grad_cam").is(":checked")) {
			l("You can either use grad CAM or the internal layer states, but not both. GradCAM.");
			$("#show_grad_cam").prop("checked", false).prop("disabled", true).trigger("change");
		}
		
		Swal.fire({
			title: 'Stopped training',
			html: "This may take some time...",
			timer: 1000,
			showConfirmButton: false
		});

		if(model.isTraining) {
			model.stopTraining = true;
			model.stopTraining = true;
		}

		document.title = original_title;
		await gui_not_in_training();
		l("Stopped training");
	} else {
		l("Started training")

		if(is_cosmo_mode) {
			$(".cosmo_next_button_span").css("visibility", "hidden");
			$(".auto_image_captions").remove();
			$("#webcam_in_cosmo").show();
		}

		$("#show_grad_cam").prop("disabled", false);
		last_training_time = Date.now();
		await gui_in_training();

		training_logs_batch = {
			"loss": {
				"x": [],
				"y": [],
				"type": get_scatter_type(),
				"mode": get_plotly_type(),
				"name": 'Loss'
			}
		};

		training_logs_epoch = {
			"loss": {
				"x": [],
				"y": [],
				"type": get_scatter_type(),
				"mode": get_plotly_type(),
				"name": 'Loss'
			}
		};

		last_batch_time = 0;

		time_per_batch = {
			"time": {
				"x": [],
				"y": [],
				"type": get_scatter_type(),
				"mode": get_plotly_type(),
				"name": 'Time per batch (in seconds)'
			}
		}

		training_memory_history = {
			numBytes: {
				"x": [],
				"y": [],
				"type": get_scatter_type(),
				"mode": get_plotly_type(),
				"name": 'RAM (MB)'
			},
			numBytesInGPU: {
				"x": [],
				"y": [],
				"type": get_scatter_type(),
				"mode": get_plotly_type(),
				"name": 'GPU (MB)'
			},
			numTensors: {
				"x": [],
				"y": [],
				"type": get_scatter_type(),
				"mode": get_plotly_type(),
				"name": 'Number of Tensors'
			}
		}

		reset_gui_before_training();

		$("#percentage").html("");
		$("#percentage").hide();

		await run_neural_network();

		if(is_cosmo_mode) {
			show_tab_label("predict_tab", 1);

			set_right_border_between_example_predictions();

			$("#own_files").hide();

			await _predict_mode_examples();
			$("#example_predictions").show();

			await fit_to_window();

			await cosmo_maximally_activate_last_layer();

			await fit_to_window();

			await predict_handdrawn();

			await fit_to_window();
		
			chose_next_manicule_target();

			if(!already_moved_to_predict_for_cosmo) {
				move_element_to_another_div($("#maximally_activated_content")[0], $("#cosmo_visualize_last_layer")[0])
				already_moved_to_predict_for_cosmo = true;
			}

			if(!cam) {
				$("#show_webcam_button").click();
			}
		} else {
			show_tab_label("predict_tab", $("#jump_to_interesting_tab").is(":checked") ? 1 : 0);
		}

		await enable_everything();

		await show_prediction();

		if(is_cosmo_mode) {
			await add_cosmo_point("finished_training");

			$(".cosmo_next_button_span").css("visibility", "visible");

			await fit_to_window();
		}
	}

	await write_descriptions();
	await write_model_to_latex_to_page();

	await save_current_status();

	if(is_cosmo_mode) {
		chose_next_manicule_target();
	}

	memory_leak_debugger("train_neural_network", start_tensors);
}

function getKeyByValue(object, value) { var start_tensors = memory_leak_debugger();
	var res = Object.keys(object).find(key => object[key] === value);

	memory_leak_debugger("getKeyByValue", start_tensors);

	return res;
}

async function get_model_data (optimizer_name_only) { var start_tensors = memory_leak_debugger();
	if(global_model_data) {
		var model_data_tensors = findTensorsWithIsDisposedInternal(global_model_data);
		for (var i = 0; i < model_data_tensors.length; i++) {
			await dispose(model_data_tensors[i]);
		}
	}

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

	global_model_data = {
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
		global_model_data["width"] = width;
		global_model_data["height"] = height;
	}

	var optimizer_data_names = model_data_structure[optimizer_type];

	for (var i = 0; i < optimizer_data_names.length; i++) {
		global_model_data[optimizer_data_names[i]] = parseFloat($("#" + optimizer_data_names[i] + "_" + optimizer_type).val());
	}


	var optimizer_constructors = {
		"adadelta": "adadelta(global_model_data['learningRate'], global_model_data['rho'], global_model_data['epsilon'])",
		"adagrad": "adagrad(global_model_data['learningRate'], global_model_data['initialAccumulatorValue'])",
		"adam": "adam(global_model_data['learningRate'], global_model_data['beta1'], global_model_data['beta2'], global_model_data['epsilon'])",
		"adamax": "adamax(global_model_data['learningRate'], global_model_data['beta1'], global_model_data['beta2'], global_model_data['epsilon'], global_model_data['decay'])",
		"rmsprop": "rmsprop(global_model_data['learningRate'], global_model_data['decay'], global_model_data['momentum'], global_model_data['epsilon'], global_model_data['centered'])",
		"sgd": "sgd(global_model_data['learningRate'])"
	};

	if(!optimizer_name_only) {
		global_model_data["optimizer"] = tf.tidy(() => { return eval("tf.train." + optimizer_constructors[global_model_data["optimizer"]]) });
	}

	var new_tensors = findTensorsWithIsDisposedInternal(global_model_data).length;

	memory_leak_debugger("get_model_data", start_tensors + new_tensors);
	return global_model_data;
}

function delay(time) { // var start_tensors
	return new Promise(resolve => setTimeout(resolve, time));
}

function get_fit_data () { var start_tensors = memory_leak_debugger();
	var epochs = get_epochs();
	var batchSize = get_batchSize();
	var validationSplit = parseInt($("#validationSplit").val()) / 100;

	var callbacks = {};

	callbacks["onTrainBegin"] = async function () {
		current_epoch = 0;
		this_training_start_time = Date.now()
		$(".training_performance_tabs").show();

		show_tab_label("tfvis_tab_label", $("#jump_to_interesting_tab").is(":checked") ? 1 : 0);
	};

	callbacks["onBatchBegin"] = async function () { var start_tensors = memory_leak_debugger();
		if(!started_training) {
			model.stopTraining = true;
		}

		if(!is_hidden_or_has_hidden_parent($("#math_tab"))) {
			await write_model_to_latex_to_page();
		}


		if(is_cosmo_mode) {
			show_tab_label("tfvis_tab_label", 1);
		}

		memory_leak_debugger("onBatchBegin", start_tensors);
	};

	callbacks["onEpochBegin"] = async function () { var start_tensors = memory_leak_debugger();
		current_epoch++;
		var max_number_epochs = get_epochs();
		var current_time = Date.now();
		var epoch_time = (current_time - this_training_start_time) / current_epoch;
		var epochs_left = max_number_epochs - current_epoch;
		var seconds_left = parseInt(Math.ceil((epochs_left * epoch_time) / 1000) / 5) * 5;
		var time_estimate = human_readable_time(seconds_left);

		$("#training_progress_bar").show();

		document.title = "[" + current_epoch + "/" + max_number_epochs + ", " + time_estimate  + "] asanAI";

		if(is_cosmo_mode) {
			time_estimate = human_readable_time(seconds_left);
			if(max_number_epochs && current_epoch > 0 && time_estimate && seconds_left >= 0) {
				$("#current_epoch_cosmo_display").html(current_epoch);
				$("#max_epoch_cosmo_display").html(max_number_epochs);
				$("#time_estimate_cosmo").html(time_estimate);
				$('#show_cosmo_epoch_status').show();
			} else {
				$('#show_cosmo_epoch_status').hide();
			}
			idleTime = 0;
		}

		var percentage = parseInt((current_epoch / max_number_epochs) * 100);
		$("#training_progressbar>div").css("width", percentage + "%")

		memory_leak_debugger("onEpochBegin", start_tensors);
	};

	callbacks["onBatchEnd"] = async function (batch, logs) { var start_tensors = memory_leak_debugger();
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

		if(!is_cosmo_mode) {
			$("#plotly_batch_history").parent().show();
			$("#plotly_time_per_batch").parent().show();
		}

		if(!last_batch_plot_time || (Date.now() - last_batch_plot_time) > (parseInt($("#min_time_between_batch_plots")) * 1000)) { // Only plot every min_time_between_batch_plots seconds
			if(batchNr == 1) {
				Plotly.newPlot('plotly_batch_history', this_plot_data, get_plotly_layout(language[lang]["batches"]));
				Plotly.newPlot('plotly_time_per_batch', [time_per_batch["time"]], get_plotly_layout(language[lang]["time_per_batch"]));
			} else {
				Plotly.update('plotly_batch_history', this_plot_data, get_plotly_layout(language[lang]["batches"]));
				Plotly.update('plotly_time_per_batch', [time_per_batch["time"]], get_plotly_layout(language[lang]["time_per_batch"]));
			}
			last_batch_plot_time = Date.now();
		}

		if(!is_hidden_or_has_hidden_parent($("#predict_tab"))) {
			if($('#predict_own_data').val()) {
				await predict($('#predict_own_data').val());
			}
			await show_prediction(0, 1);
			if(await input_shape_is_image()) {
				await repredict();
			}
		}

		memory_leak_debugger("onBatchEnd", start_tensors);
	};

	callbacks["onEpochEnd"] = async function (batch, logs) { var start_tensors = memory_leak_debugger();
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
					"mode": get_plotly_layout(),
					"name": 'Loss'
				};
			}

			loss = logs[other_key_name];
			training_logs_epoch[other_key_name]["x"].push(epochNr);
			training_logs_epoch[other_key_name]["y"].push(loss);
			training_logs_epoch[other_key_name]["mode"] = get_plotly_type();
			training_logs_epoch[other_key_name]["name"] = other_key_name;

			this_plot_data.push(training_logs_epoch[other_key_name]);
		}

		$("#plotly_epoch_history").parent().show();
		if(!is_cosmo_mode) {
			$("#plotly_epoch_history").show();
			if(epochNr == 1) {
				Plotly.newPlot('plotly_epoch_history', this_plot_data, get_plotly_layout(language[lang]["epochs"]));
			} else {
				Plotly.update('plotly_epoch_history', this_plot_data, get_plotly_layout(language[lang]["epochs"]));
			}
		} else {
			$("#plotly_epoch_history").hide();
		}

		var this_plot_data = [training_logs_batch["loss"]];
		Plotly.update('plotly_batch_history', this_plot_data, get_plotly_layout(language[lang]["batches"]));
		Plotly.update('plotly_time_per_batch', [time_per_batch["time"]], get_plotly_layout(language[lang]["time_per_batch"]));
		last_batch_plot_time = false;

		await visualize_train();
		if(is_cosmo_mode) {
			await fit_to_window();
		}
		memory_leak_debugger("onEpochEnd", start_tensors);
	}

	callbacks["onTrainEnd"] = async function () { var start_tensors = memory_leak_debugger();
		favicon_default();
		await write_model_to_latex_to_page();
		document.title = original_title;
		restart_fcnn();
		restart_lenet();
		restart_alexnet();
		memory_leak_debugger("onTrainEnd", start_tensors);
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

	memory_leak_debugger("get_fit_data", start_tensors);
	return fit_data;
}

function _set_apply_to_original_apply () { var start_tensors = memory_leak_debugger();

	assert(Object.keys(model).includes("layers"), "model does not include layers");

	for (var i = 0; i < model.layers.length; i++) {
		if("original_apply" in model.layers[i]) {
			try {
				eval("model.layers[" + i + "].apply = model.layers[" + i + "].original_apply;\n");
			} catch (e) {
				console.error(e);
				console.trace();
			}
		}
	}

	memory_leak_debugger("_set_apply_to_original_apply", start_tensors);
}

async function _create_and_compile_model () { var start_tensors = memory_leak_debugger();
	try {
		[model, global_model_data] = await create_model(model);
	} catch (e) {
		throw new Error("Creating model failed: " + e);
	}

	try {
		await compile_model();
	} catch (e) {
		throw new Error("Compiling model failed: " + e);
	}

	memory_leak_debugger("_create_and_compile_model", start_tensors);
}

async function _get_xs_and_ys () { var start_tensors = memory_leak_debugger();
	var xs_and_ys = false;
	try {
		var error_string = "";
		write_model_summary_wait();

		await disable_everything();
		l("Getting data...");
		xs_and_ys = await get_xs_and_ys();
		show_tab_label("tfvis_tab_label", $("#jump_to_interesting_tab").is(":checked") ? 1 : 0);
		l("Got data!");
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
		log("" + e);
		header("ERROR END");
		console.trace();
		favicon_default();
		await write_descriptions();
		$(".train_neural_network_button").html("<span class='TRANSLATEME_start_training'></span>").removeClass("stop_training").addClass("start_training");
		updateTranslations();
		started_training = false;
		memory_leak_debugger("_get_xs_and_ys", start_tensors);
		return false;
	}

	memory_leak_debugger("_get_xs_and_ys", start_tensors);

	return xs_and_ys;
}

async function _show_or_hide_simple_visualization (fit_data, xs_and_ys) { var start_tensors = memory_leak_debugger();
	if(xs_and_ys["x"].shape.length == 2 && xs_and_ys["x"].shape[1] == 1) {
		if(xs_and_ys["x"].shape.length == 2 && xs_and_ys["x"].shape[1] == 1) {
			old_onEpochEnd = fit_data["callbacks"]["onBatchEnd"];

			var new_on_batch_end_callback = await get_live_tracking_on_batch_end(
				"model",
				parseInt($("#epochs").val()), 
				JSON.stringify(xs_and_ys["x"].arraySync()), 
				JSON.stringify(xs_and_ys["y"].arraySync()
			), false, "simplest_training_data_visualization");
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

	memory_leak_debugger("_show_or_hide_simple_visualization", start_tensors);
}

function _clear_plotly_epoch_history () { // var start_tensors
	$("#plotly_epoch_history").parent().hide();
	$("#plotly_epoch_history").html("");
}

async function _get_fit_data (xs_and_ys) { var start_tensors = memory_leak_debugger();
	var fit_data = true;

	try {
		add_layer_debuggers();

		fit_data = get_fit_data();

		await _show_or_hide_simple_visualization(fit_data, xs_and_ys);

		show_tab_label("tfvis_tab_label", $("#jump_to_interesting_tab").is(":checked") ? 1 : 0);

		memory_leak_debugger("checking data fit", start_tensors);
	} catch (e) {
		await write_error_and_reset(e);
		fit_data = false;
	}

	memory_leak_debugger("get_fit_data", start_tensors);
	return fit_data;
}

async function repair_output_shape (tries_classification_but_receives_other=0) {
	if(!model) {
		model = await create_model();
		await compile_model();
	}

	try {
		var last_layer_output_shape = model.layers[model.layers.length - 1].output.shape;
		if(last_layer_output_shape.length == 2) {
			var num_categories = labels.length;
			if(!num_categories) {
				return;
			}
			if(last_layer_output_shape[1] != num_categories) {
				$($(".glass_box")[model.layers.length - 1]).find(".units").val(labels.length);
				await updated_page()

				log("Not re-running run_neural_network");
			} else {
				return;
			}
		} else {
			if(tries_classification_but_receives_other) {
				var ll = labels.length;
				var overlay = showWhiteOverlayWithText(language[lang]["fixing_output_shape"]);
				if(labels && ll) {
					await (async () => {
						try {
							function get_last_layer (minus=1) {
								log(`get_last_layer(${minus})`);
								return $(".layer_type").length - minus;
							}

							async function change_layer_to (nr, to) {
								log(`change_layer_to(${nr}, ${to})`);
								var layer_type = $(".layer_type")[nr];
								var $layer_type = $(layer_type);

								var index = 0;
								if(to == "dense") {
									index = 0;
								} else if(to == "flatten") {
									index = 1;
								} else {
									throw new Error("unknown to-value:" + to);
								}

								log("changing val to " + to);
								$layer_type.val(to);

								log("changing selectedIndex to " + index);
								$layer_type.prop("selectedIndex", index);

								log("triggering $layer_type:", $layer_type);
								$layer_type.trigger("change");

								log(`Start waiting for "${$layer_type.val()}" becoming equal to ${to}`);
								while ($layer_type.val() != to) {
									log(`Currently waiting for "${$layer_type.val()}" (layer ${nr}) becoming equal to ${to}`);
									await delay(100);
								}

								await delay(500);
							}

							async function duplicate_last_layer () {
								log("Adding layer");

								var $last_layer = $(".add_layer")[get_last_layer()];

								log("Awaiting disable_invalid_layers_event()");
								
								enable_all_layer_types();

								var start_layers = model.layers.length;
								log("Clicking on this item for layer duplication: ", $last_layer)
								$last_layer.click();

								while (model.layers.length - (start_layers) > 0) {
									log(`Waiting until model.layers.length (${model.layers.length}) - (start_layers) (${(start_layers)}) > 0`);
									await delay(200);
								}

								await delay(1000);

								if(mode == "beginner") {
									await disable_invalid_layers_event(new Event("duplicate_last_layer"), $last_layer);
								}
							}

							async function set_activation_to (nr, val) {
								log(`set_activation_to(${nr}, ${val})`);
								$($(".layer_setting")[nr]).find(".activation").val(val).trigger("change");
								while ($($(".layer_setting")[nr]).find(".activation").val() != val) {
									await delay(100);
								}
								await delay(500);
							}

							async function set_dense_layer_units(nr, units) {
								log("Setting the units of layer " + nr + " to " + units);
								var $units = $($(".layer_setting")[nr]).find(".units");
								$units.val(units);

								while (ll != $units.val()) {
									log(`Waiting for set_dense_layer_units(${nr}, ${units})`);
									await delay(100);
								}
								await delay(500);
							}

							await duplicate_last_layer();
							await change_layer_to(get_last_layer(), "flatten");

							await duplicate_last_layer();
							await change_layer_to(get_last_layer(), "dense")

							await set_dense_layer_units(get_last_layer(), ll);

							await set_activation_to(get_last_layer(), "softmax");

							$(overlay).remove();
							$("#start_training").click();
						} catch (e) {
							$(overlay).remove();
							$("#start_training").click();
							throw new Error(e);
						}
					})();
				}

			}
		}
	} catch (e) {
		throw new Error(e);
	}
}

async function run_neural_network (recursive=0) { var start_tensors = memory_leak_debugger();
	await clean_gui();
	if(is_cosmo_mode) {
		await fit_to_window();
	}

	$(".train_neural_network_button").html("<span class='TRANSLATEME_stop_training'></span>").removeClass("start_training").addClass("stop_training");
	updateTranslations();

	_set_apply_to_original_apply();

	var xs_and_ys = await _get_xs_and_ys();

	if(!xs_and_ys) {
		console.error("Could not get xs_and_ys");
		return;
	}

	if(started_training) {
		var inputShape = await set_input_shape("[" + xs_and_ys["x"].shape.slice(1).join(", ") + "]");

		if(!is_cosmo_mode) {
			$("#training_content").clone().appendTo("#tfvis_tab");
		}

		_clear_plotly_epoch_history();

		if(!model) {
			model = await create_model();
			await compile_model();
		}

		var fit_data = await _get_fit_data(xs_and_ys);

		show_tab_label("tfvis_tab_label", $("#jump_to_interesting_tab").is(":checked") ? 1 : 0);

		try {
			var start_tensors_INTERNAL = memory_leak_debugger();

			h = await model.fit(xs_and_ys["x"], xs_and_ys["y"], fit_data);
			l("Finished model.fit");

			await tf.nextFrame();

			memory_leak_debugger("model.fit done", start_tensors_INTERNAL);

			assert(typeof(h) == "object", "history object is not of type object");

			model_is_trained = true;

			$("#predictcontainer").show();
			$("#predict_error").hide().html("");
		} catch (e) {
			if(("" + e).includes("is already disposed")) {
				console.error("Model was already disposed, this may be the case when, during the training, the model is re-created and something is tried to be predicted. USUALLY, not always, this is a harmless error.");
				// input expected a batch of elements where each example has shape [2] (i.e.,tensor shape [*,2]) but the input received an input with 5 examples, each with shape [3] (tensor shape [5,3])
			} else if (("" + e).includes("input expected a batch of elements where each example has shape")) {
				console.error("Error: " + e + ". This may mean that you got the file from CSV mode but have not waited long enough to parse the file.");
			} else if (("" + e).includes("n is undefined")) {
				console.warn("Error: " + e + ". This is probably harmless, since it usually means the model was recompiled during this step..");
			} else if (("" + e).includes("target expected a batch of elements where each example has shape")) {
				if(is_classification) {
					try {
						await repair_output_shape();

						if(!recursive) {
							await run_neural_network(1);
						}
					} catch (e) {
						console.warn(e);
					}

				} else {
					throw new Error(e);
				}
			} else {
				if(typeof(e) == "object" && Object.keys(e).includes("message")) {
					e = e.message;
				}

				if(("" + e).match(/expected.*to have (\d+) dimension\(s\). but got array with shape ((?:\d+,?)*\d+)\s*$/)) {
					if(mode == "expert") {
						var r = null;
						await Swal.fire({
							title: 'Defective input shape detected',
							html: 'Do you want to automatically fix the output shape?',
							showDenyButton: true,
							showCancelButton: false,
							confirmButtonText: 'Yes',
							denyButtonText: `No`,
						}).then((result) => {
							r = result;
						})

						if (r.isConfirmed) {
							await repair_output_shape(1);
						} else if (r.isDenied) {
							Swal.fire('Not doing Input shape repair', '', 'info')
						} else {
							log("Unknown swal r: ", r);
						}
					} else if (mode == "beginner") {
						await repair_output_shape(1);
					} else {
						throw new Error("Unknown mode");
					}
				} else {
					await write_error("" + e);

					throw new Error(e);
				}
			}
		}

		await enable_everything();
		$("#training_progress_bar").hide();

		await dispose(fit_data);
	}


	try {
		await dispose(xs_and_ys["x"]);
		await dispose(xs_and_ys["y"]);
		xs_and_ys = null;
	} catch (e) {
		console.error(e);
		console.trace();
	}

	await gui_not_in_training();

	await reset_data();

	await save_current_status();
	var training_time = parseInt(parseInt(Date.now() - last_training_time) / 1000);
	l(language[lang]["done_training_took"] + " " + human_readable_time(training_time) + " (" + training_time + "s)");
	last_training_time = "";

	memory_leak_debugger("run_neural_network", start_tensors);
}

async function write_error_and_reset(e, fn, hide_swal) { var start_tensors = memory_leak_debugger();
	await write_error(e, fn, hide_swal);
	await reset_on_error();
	memory_leak_debugger("write_error", start_tensors);
}

async function reset_on_error () { var start_tensors = memory_leak_debugger();
	started_training = false;

	document.body.style.cursor = get_cursor_or_none("default");
	$("#layers_container").sortable("enable");
	$("#ribbon,select,input,checkbox").prop("disabled", false);
	await write_descriptions();
	Prism.highlightAll();

	var link = document.querySelector("link[rel~='icon']");
	if (!link) {
		link = document.createElement('link');
		link.rel = 'icon';
		document.getElementsByTagName('head')[0].appendChild(link);
	}
	link.href = 'favicon.ico';
	memory_leak_debugger("reset_on_error", start_tensors);
}

function randomInRange(start,end) { var start_tensors = memory_leak_debugger();
	var res = Math.floor(Math.random() * (end - start + 1) + start);
	memory_leak_debugger("randomInRange", start_tensors);
	return res;
}

function drawImagesInGrid(images, categories, probabilities, numCategories) { var start_tensors = memory_leak_debugger();
	$("#canvas_grid_visualization").html("");
	var categoryNames = labels.slice(0, numCategories);
	var margin = 40;
	var canvases = [];

	// create a canvas for each category
	for (let i = 0; i < (numCategories + 1); i++) {
		var canvas = document.createElement("canvas");
		var pw = parseInt($("#tfvis_tab").width() * relationScale);
		var w = parseInt(pw / (numCategories + 2));

		if(is_cosmo_mode) {
			w = 200;
		}

		canvas.width = w;
		canvas.height = 400;

		var ctx = canvas.getContext("2d");

		ctx.fillStyle = "#ffffff";
		ctx.fillRect(0, 0, canvas.width, canvas.height);

		ctx.font = "14px Arial";
		ctx.fillStyle = "#000000";
		ctx.textAlign = "right";

		canvases.push(canvas);
	}

	var graphWidth = canvases[0].width - margin * 2;
	var graphHeight = canvases[0].height - margin * 2;

	var maxProb = 1;

	{
		var ctx = canvases[0].getContext("2d");
		for (let j = 0; j <= 10; j += 2) {
			var yPos = margin + graphHeight - j / 10 * graphHeight;
			var neg = -10;
			var label = (j / 10 * maxProb).toFixed(2);
			if(is_cosmo_mode) {
				if (label == "0.00") {
					label = language[lang]["very_unsure"];
				} else if (label == "0.20") {
					label = language[lang]["quite_unsure"];
				} else if (label == "0.40") {
					label = language[lang]["a_bit_unsure"];
				} else if (label == "0.60") {
					label = language[lang]["neutral"];
				} else if (label == "0.80") {
					label = language[lang]["relatively_sure"];
				} else if (label == "1.00") {
					label = language[lang]["very_sure"];
				} else {
					console.warn("cosmo-label not found for " + label + " probability");
				}
				neg = +90;
			}
			ctx.fillText(label, margin + neg, yPos);
		}
	}

	var targetSize = Math.min(40, height, width); // Change this to the desired size

	// draw y-axis labels

	for (let canvasIndex = 1; canvasIndex < (numCategories + 1); canvasIndex++) {
		var canvas = canvases[canvasIndex];
		var ctx = canvas.getContext("2d");

		if(!canvasIndex == 0) {
			ctx.textAlign = "center";
			var label = categoryNames[canvasIndex - 1];
			ctx.fillText(label, canvas.width / 2, canvas.height - margin + 20);
		}
	}


	// draw x-axis labels and images
	for (let i = 0; i < images.length; i++) {
		var image = images[i];
		var category = categories[i];
		var probability = probabilities[i];

		var xPos = margin * 1.5;
		var yPos = margin + graphHeight - probability / maxProb * graphHeight;

		var canvasIndex = category;
		var canvas = canvases[canvasIndex + 1];
		if(canvas) {
			var ctx = canvas.getContext("2d");

			// draw image
			var scale = targetSize / Math.max(image.width, image.height);
			var w = image.width * scale;
			var h = image.height * scale;

			var imageX = xPos - width / 2;
			imageX += random_two(-(2*targetSize), 2*targetSize);

			if((imageX + targetSize) > canvas.width) {
				imageX = canvas.width - targetSize;
			}

			if(imageX < 0) {
				imageX = 0;
			}

			var imageY = yPos - h / 2;
			//log("DEBUG:", image, imageX, imageY, w, h);
			ctx.drawImage(image, imageX, imageY, w, h);
		} else {
			console.warn("Canvas not defined. Canvasses:", canasses, "canvasIndex + 1:", canvasIndex + 1);
		}
	}

	// append each canvas to its corresponding element
	for (let i = 0; i < (numCategories + 1); i++) {
		var canvas = canvases[i];
		if(canvas) {
			//var containerId = "#canvas_grid_visualization_" + (i + 1);
			var containerId = "#canvas_grid_visualization";
			$(canvas).appendTo($(containerId));
			$('<span style="display:table-cell; border-left:1px solid #000;height:400px"></span>').appendTo($(containerId));
		} else {
			console.warn("Canvas could not be appended!");
		}
	}

	memory_leak_debugger("drawImagesInGrid", start_tensors);
}

async function visualize_train () { var start_tensors = memory_leak_debugger();
	seed_two = 2;

	if(!$("#visualize_images_in_grid").is(":checked")) {
		$("#canvas_grid_visualization").html("");
		return;
	}

	if($("#data_origin").val() != "default") {
		log_once("Disabling visualize_train because this only works for default, not for custom data of any kind.");
		$("#canvas_grid_visualization").html("");
		return;
	}

	if(!is_classification) {
		log_once("Disabling visualize_train because this only works when using classification.");
		$("#canvas_grid_visualization").html("");
		return;
	}

	if(!await input_shape_is_image()) {
		log_once("Disable visualize_train because the input shape is not image-like.");
		$("#canvas_grid_visualization").html("");
		return;
	}

	if(get_last_layer_activation_function() != "softmax") {
		log_once("Disable visualize_train because the last layer is not softmax.");
		$("#canvas_grid_visualization").html("");
		return;
	}

	var imgs = [];
	var categories = [];
	var probabilities = [];

	var max = parseInt($("#max_number_of_images_in_grid").val());

	if(max == 0) {
		return;
	}

	if(is_cosmo_mode) {
		$("#plotly_epoch_history").hide();
		$("#canvas_grid_visualization").css({"position": "inherit"});
		$("#canvas_grid_visualization").css({"opacity": "1"});
		$(".auto_image_captions").remove();
	} else {
		$("#plotly_epoch_history").show();
		$("#canvas_grid_visualization").css({"position": "absolute"});
		$("#canvas_grid_visualization").css({"opacity": "0.5"});
	}

	if(labels.length) {
		var image_elements = $("#photos").find("img,canvas");
		if(!image_elements.length) {
			console.error("could not find image_elements");
			return;
		}
		for (var i = 0; i < image_elements.length; i++) {
			var x = image_elements[i];
			if(i <= max) {
				tf.engine().startScope();
				imgs.push(x);

				var img_tensor = tf.tidy(() => {
					var res = tf.browser.fromPixels(x).resizeBilinear([height, width]).expandDims()
					res = tf.divNoNan(res, parseFloat($("#divide_by").val()));
					return res;
				});

				var res = tf.tidy(() => { return model.predict(img_tensor) });

				var res_array = res.arraySync()[0];
				//log("RES for " + x.src + " :", res_array);

				var probability = Math.max(...res_array);
				var category = res_array.indexOf(probability);

				categories.push(category);
				probabilities.push(probability);

				await dispose(res);
				await dispose(img_tensor)
				tf.engine().endScope();
			}
		}

		if(imgs.length && categories.length && probabilities.length) {
			drawImagesInGrid(imgs, categories, probabilities, labels.length);
		} else {
			$("#canvas_grid_visualization").html("");
		}
	} else {
		$("#canvas_grid_visualization").html("");
	}

	await tf.nextFrame();

	memory_leak_debugger("visualize_train", start_tensors);

	if(is_cosmo_mode) {
		await fit_to_window();
	}
}
