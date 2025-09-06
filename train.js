"use strict";

async function gui_in_training (set_started_training=1) {
	if(set_started_training) {
		started_training = true;
	}
	await disable_everything();
	favicon_spinner();
	await write_descriptions();

	await reset_cached_loaded_images();
}

async function gui_not_in_training (set_started_training=1) {
	if(set_started_training) {
		started_training = false;
	}
	$(".train_neural_network_button").html("<span class='TRANSLATEME_start_training'></span>").removeClass("stop_training").addClass("start_training");
	await update_translations();
	favicon_default();

	try {
		if (!tf.engine().state.activeScope === null) {
			tf.engine().endScope();
		}
	} catch (e) {
		log("[gui_not_in_training] " + e);
	}

	await enable_everything();
	$(".show_after_training").show();
	$("#program_looks_at_data_span").hide();

	await reset_cached_loaded_images();
}

function reset_gui_before_training () {
	prev_layer_data = [];
	$(".reset_before_train_network").html("");
	$("#percentage").html("");
	$("#percentage").show();
	$(".input_image_grid").html("");
	$(".output_image_grid").html("");
	reset_photo_gallery();
	reset_summary();
}

function disable_gradcam_during_training_if_internal_states() {
	if($("#show_grad_cam").is(":checked")) {
		l(language[lang]["you_cannot_use_gradcam_and_internal_states_together"]);
		$("#show_grad_cam").prop("checked", false).prop("disabled", true).trigger("change");
	}
}

function set_model_stop_training() {
	if(model.isTraining) {
		model.stopTraining = true;
		model.stopTraining = true;
	}
}

function get_empty_loss_plotly() {
	return {
		"loss": {
			"x": [],
			"y": [],
			"type": get_scatter_type(),
			"mode": get_plotly_type(),
			"name": "Loss"
		}
	};
}

async function train_neural_network () {
	var ret = null;
	if(model === null || model === undefined || typeof(model) != "object" || !Object.keys(model).includes("layers")) {
		await gui_not_in_training();

		model = await create_model();
		await compile_model();

		return;
	}
	
	restart_fcnn(); // await not possible i think

	if(started_training) {
		show_overlay(language[lang]["stopped_training"] + " &mdash; " + language[lang]["this_may_take_a_while"] + "...");

		disable_gradcam_during_training_if_internal_states();

		stop_downloading_data = true;

		set_model_stop_training();

		set_document_title(original_title);
		await gui_not_in_training();
		remove_overlay();
		l(language[lang]["stopped_training"]);
	} else {
		l(language[lang]["started_training"]);

		stop_downloading_data = false;

		$("#show_grad_cam").prop("disabled", false);
		last_training_time = Date.now();
		await gui_in_training();

		training_logs_batch = get_empty_loss_plotly();
		training_logs_epoch = get_empty_loss_plotly();

		last_batch_time = 0;

		time_per_batch = {
			"time": {
				"x": [],
				"y": [],
				"type": get_scatter_type(),
				"mode": get_plotly_type(),
				"name": "Time per batch (in seconds)"
			}
		};

		training_memory_history = get_empty_training_memory_history_plotly();

		reset_gui_before_training();

		$("#percentage").html("");
		$("#percentage").hide();

		ret = await run_neural_network();

		await show_tab_label("predict_tab_label", jump_to_interesting_tab());

		await enable_everything();

		await show_prediction();
	}

	await write_descriptions();
	await write_model_to_latex_to_page();

	await save_current_status();

	return ret;
}

function get_empty_training_memory_history_plotly() {
	return {
		numBytes: {
			"x": [],
				"y": [],
				"type": get_scatter_type(),
				"mode": get_plotly_type(),
				"name": "RAM (MB)"
		},
			numBytesInGPU: {
				"x": [],
					"y": [],
					"type": get_scatter_type(),
					"mode": get_plotly_type(),
					"name": "GPU (MB)"
			},
			numTensors: {
				"x": [],
					"y": [],
					"type": get_scatter_type(),
					"mode": get_plotly_type(),
					"name": "Number of Tensors"
			}
	};
}

function get_key_by_value(_object, value) {
	try {
		var res = Object.keys(_object).find(key => _object[key] === value);

		return res;
	} catch (e) {
		if(Object.keys(e).includes("message")) {
			e = e.message;
		}

		assert(false, e);
	}
}

async function get_model_data (optimizer_name_only) {
	if(global_model_data) {
		var model_data_tensors = find_tensors_with_is_disposed_internal(global_model_data);
		for (var i = 0; i < model_data_tensors.length; i++) {
			await dispose(model_data_tensors[i]);
		}
	}

	var loss = get_loss();
	var optimizer_type = get_optimizer();
	var metric_type = get_metric();

	if(Object.values(metric_shortnames).includes(metric_type)) {
		metric_type = get_key_by_value(metric_shortnames, metric_type);
	}

	var epochs = $("#epochs").val();
	var batchSize = $("#batchSize").val();
	var validationSplit = $("#validationSplit").val();
	var divide_by = $("#divide_by").val();

	if(looks_like_number(epochs)) {
		epochs = parse_int(epochs);
	} else {
		finished_loading && wrn("#epochs doesnt look like a number");
	}

	if(looks_like_number(batchSize)) {
		batchSize = parse_int(batchSize);
	} else {
		finished_loading && wrn("#batchSize doesnt look like a number");
	}

	if(looks_like_number(validationSplit)) {
		validationSplit = parse_int(validationSplit);
	} else {
		finished_loading && wrn("#validation_split doesnt look like a number");
	}

	if(looks_like_number(divide_by)) {
		divide_by = parse_float(divide_by);
	} else {
		finished_loading && wrn("#divide_by doesnt look like a number");
	}

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
		var element_name = optimizer_data_names[i] + "_" + optimizer_type;
		var $element_field = $("#" + element_name);
		var element_val = $element_field.val();

		global_model_data[optimizer_data_names[i]] = parse_float(element_val);
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
		global_model_data["optimizer"] = tidy(() => { return eval("tf.train." + optimizer_constructors[global_model_data["optimizer"]]); });
	}

	return global_model_data;
}

function delay(time) {
	return new Promise(resolve => setTimeout(resolve, time));
}

async function get_fit_data () {
	var epochs = get_epochs();
	var batchSize = get_batch_size();
	var validationSplit = parse_int($("#validationSplit").val()) / 100;

	var callbacks = {};

	callbacks["onTrainBegin"] = async function () {
		confusion_matrix_and_grid_cache = {};
		current_epoch = 0;
		this_training_start_time = Date.now();
		$(".training_performance_tabs").show();

		await show_tab_label("training_tab_label", jump_to_interesting_tab());

		$("#network_has_seen_msg").hide();

		await visualize_train();
		await confusion_matrix_to_page(); // async not possible

		confusion_matrix_and_grid_cache = {};
	};

	callbacks["onBatchBegin"] = async function () {
		confusion_matrix_and_grid_cache = {};
		if(!started_training) {
			model.stopTraining = true;
		}

		if(!is_hidden_or_has_hidden_parent($("#math_tab"))) {
			await write_model_to_latex_to_page();
		}

		confusion_matrix_and_grid_cache = {};
	};

	callbacks["onEpochBegin"] = async function () {
		confusion_matrix_and_grid_cache = {};
		current_epoch++;
		var max_number_epochs = get_epochs();
		var current_time = Date.now();
		var epoch_time = (current_time - this_training_start_time) / current_epoch;
		var epochs_left = max_number_epochs - current_epoch;
		var seconds_left = parse_int(Math.ceil((epochs_left * epoch_time) / 1000) / 5) * 5;
		var time_estimate = human_readable_time(seconds_left);

		show_training_progress_bar();

		set_document_title("[" + current_epoch + "/" + max_number_epochs + ", " + time_estimate  + "] asanAI");

		var percentage = parse_int((current_epoch / max_number_epochs) * 100);
		$("#training_progressbar>div").css("width", percentage + "%");
		confusion_matrix_and_grid_cache = {};
	};

	callbacks["onBatchEnd"] = async function (batch, logs) {
		confusion_matrix_and_grid_cache = {};
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

		$("#plotly_batch_history").parent().show();
		$("#plotly_time_per_batch").parent().show();

		if(!last_batch_plot_time || (Date.now() - last_batch_plot_time) > (parse_int($("#min_time_between_batch_plots").val()) * 1000)) { // Only plot every min_time_between_batch_plots seconds
			if(batchNr == 1) {
				Plotly.newPlot("plotly_batch_history", this_plot_data, get_plotly_layout(language[lang]["batches"]));
				Plotly.newPlot("plotly_time_per_batch", [time_per_batch["time"]], get_plotly_layout(language[lang]["time_per_batch"]));
			} else {
				Plotly.update("plotly_batch_history", this_plot_data, get_plotly_layout(language[lang]["batches"]));
				Plotly.update("plotly_time_per_batch", [time_per_batch["time"]], get_plotly_layout(language[lang]["time_per_batch"]));
			}
			last_batch_plot_time = Date.now();
		}

		if(!is_hidden_or_has_hidden_parent($("#predict_tab"))) {
			if($("#predict_own_data").val()) {
				await predict($("#predict_own_data").val());
			}
			await show_prediction(0, 1);
			if(await input_shape_is_image()) {
				await repredict();
			}
		}

		confusion_matrix_and_grid_cache = {};

		await restart_fcnn();
	};

	callbacks["onEpochEnd"] = async function (batch, logs) {
		confusion_matrix_and_grid_cache = {};
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
			if(epochNr == 1 || !Object.keys(training_logs_epoch).includes(other_key_name)) {
				training_logs_epoch[other_key_name] = {
					"x": [],
					"y": [],
					"type": get_scatter_type(),
					"mode": get_plotly_layout(),
					"name": "Loss"
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
		$("#plotly_epoch_history").show();
		if(epochNr == 1) {
			Plotly.newPlot("plotly_epoch_history", this_plot_data, get_plotly_layout(language[lang]["epochs"]));
		} else {
			Plotly.update("plotly_epoch_history", this_plot_data, get_plotly_layout(language[lang]["epochs"]));
		}

		await visualize_train();

		if(training_logs_batch && "loss" in training_logs_batch) {
			var this_plot_data = [training_logs_batch["loss"]];
			Plotly.update("plotly_batch_history", this_plot_data, get_plotly_layout(language[lang]["batches"]));
		}
		if(time_per_batch && "time" in time_per_batch) {
			Plotly.update("plotly_time_per_batch", [time_per_batch["time"]], get_plotly_layout(language[lang]["time_per_batch"]));
		}
		last_batch_plot_time = false;

		if(training_logs_epoch["loss"].x.length >= 2) {
			var vl = Object.keys(training_logs_epoch).includes("val_loss") ? training_logs_epoch["val_loss"].y : null;
			var th = 18;
			var plotCanvas = create_tiny_plot(training_logs_epoch["loss"].x, training_logs_epoch["loss"].y, vl, th * 2, parse_int(0.9 * th));
			reset_tiny_graph();
			$("#tiny_graph").append(plotCanvas).show();
		} else {
			reset_tiny_graph(1);
		}
		$("#network_has_seen_msg").show();

		confusion_matrix_to_page(); // async not possible

		confusion_matrix_and_grid_cache = {};
	};

	callbacks["onTrainEnd"] = async function () {
		confusion_matrix_and_grid_cache = {};
		favicon_default();
		await write_model_to_latex_to_page();
		set_document_title(original_title);
		await restart_fcnn();

		reset_tiny_graph(1);
		$("#network_has_seen_msg").hide();

		confusion_matrix_to_page(); // async not possible

		await reset_data();

		confusion_matrix_and_grid_cache = {};
	};

	var fit_data = {
		validationSplit: validationSplit,
		batchSize: batchSize,
		epochs: epochs,
		shuffle: $("#shuffle_before_each_epoch").is(":checked"),
		verbose: 0,
		callbacks: callbacks,
		yieldEvery: "batch"
	};

	traindebug("fit_data:");
	traindebug(fit_data);

	return fit_data;
}

function create_tiny_plot(x, y, y_val, w, h) {
	try {
		// Check if x and y arrays have the same size
		if (x.length !== y.length) {
			throw new Error("x and y arrays must have the same size");
		}

		if((y_val && y_val.length != x.length) || !y_val) {
			y_val = [];
		}

		// Create a canvas element
		const canvas = document.createElement("canvas");
		canvas.width = w;
		canvas.height = h;
		const ctx = canvas.getContext("2d");

		// Define plot parameters

		// Calculate the x-axis scaling factor to fit the entire width
		const xScale = (w - 2) / (x.length - 1);

		// Find the range of y values
		const minY = Math.min(Math.min(...y), Math.min(...y_val));
		const maxY = Math.max(Math.max(...y), Math.max(...y_val));

		// Calculate the y-axis scaling factor
		const yScale = (h - 2) / (maxY - minY);

		// Plot the training loss (in blue)
		ctx.beginPath();
		ctx.strokeStyle = "blue";
		ctx.lineWidth = 2;

		ctx.beginPath();

		for (let i = 0; i < x.length; i++) {
			const xCoord = i * xScale;
			const yCoord = h - (y[i] - minY) * yScale;
			//log("x, y:", xCoord, yCoord);
			//log("h, y, y[i], minY, yScale:", h, y, y[i], minY, yScale, "<<<<<<");
			if (i === 0) {
				ctx.moveTo(xCoord, yCoord);
			} else {
				ctx.lineTo(xCoord, yCoord);
			}
		}

		ctx.stroke();

		if(y_val.length) {
			ctx.beginPath();
			ctx.strokeStyle = "orange";
			for (let i = 0; i < y_val.length; i++) {
				const xCoord = i * xScale;
				const yCoord = h - (y_val[i] - minY) * yScale;
				if (i === 0) {
					ctx.moveTo(xCoord, yCoord);
				} else {
					ctx.lineTo(xCoord, yCoord);
				}
			}
			ctx.stroke();
		}

		return canvas; // Return the canvas element
	} catch (e) {
		if(Object.keys(e).includes("message")) {
			e = e.message;
		}

		assert(false, e);
	}
}

function _set_apply_to_original_apply () {
	assert(Object.keys(model).includes("layers"), "model does not include layers");

	for (var i = 0; i < model.layers.length; i++) {
		if("original_apply" in model.layers[i]) {
			try {
				eval("model.layers[" + i + "].apply = model.layers[" + i + "].original_apply;\n");
			} catch (e) {
				err(e);
				console.trace();
			}
		}
	}

}

async function _get_x_and_y (recursive=0) {
	await update_translations();

	var xs_and_ys = false;
	try {
		var error_string = "";
		write_model_summary_wait();

		await disable_everything();
		l(language[lang]["getting_data"] + "...");
		xs_and_ys = await get_x_and_y();
		await show_tab_label("training_tab_label", jump_to_interesting_tab());
		l(language[lang]["got_data"]);
	} catch (e) {
		if(Object.keys(e).includes("message")) {
			e = e.message;
		}

		if(("" + e).includes("n is undefined") && recursive == 0) {
			wrn("[_get_x_and_y] Error '" + e + "'. Trying to get xs and ys again...");
			return await _get_x_and_y(recursive + 1);
		} else {
			var explanation = explain_error_msg("" + e);
			if(explanation) {
				explanation = "<br><br>" + explain_error_msg(e.toString());
			} else {
				explanation = "";
			}
			await send_bug_report();
			Swal.fire(
				"Error while training",
				e.toString() + explanation,
				"warning"
			);
			header("ERROR");
			log(e);
			header("ERROR END");
			console.trace();
		}
		favicon_default();
		await write_descriptions();
		$(".train_neural_network_button").html("<span class='TRANSLATEME_start_training'></span>").removeClass("stop_training").addClass("start_training");
		await update_translations();
		started_training = false;
		return false;
	}

	return xs_and_ys;
}

async function _show_or_hide_simple_visualization (fit_data, xs_and_ys) {
	try {
		var x_shape_is_ok = xs_and_ys["x"].shape.length == 2 && xs_and_ys["x"].shape[1] == 1;
		var y_shape_is_ok = xs_and_ys["y"].shape.length == 2 && xs_and_ys["y"].shape[1] == 1;
		var model_shape_is_ok = model.input.shape.length == 2 && model.input.shape[1] == 1;

		if(
			x_shape_is_ok &&
			y_shape_is_ok &&
			model &&
			model_shape_is_ok
		) {
			if(!model) {
				wrn("[_show_or_hide_simple_visualization] Model not found. Not showing simple visualization");
				old_onEpochEnd = undefined;
				$("#simplest_training_data_visualization").html("").hide();
				return;
			}

			old_onEpochEnd = fit_data["callbacks"]["onBatchEnd"];

			var x_data_json = JSON.stringify(array_sync(xs_and_ys["x"]));
			var y_data_json = JSON.stringify(array_sync(xs_and_ys["y"]));

			var new_on_batch_end_callback = await get_live_tracking_on_batch_end(
				"model",
				parse_int($("#epochs").val()),
				x_data_json,
				y_data_json,
				false,
				"simplest_training_data_visualization"
			);

			//log(new_on_batch_end_callback);
			if(new_on_batch_end_callback) {
				fit_data["callbacks"]["onBatchEnd"] = new_on_batch_end_callback;
				//log("tried installing new callbacks in fit_data:", fit_data);
				$("#simplest_training_data_visualization").show();
			} else {
				log(language[lang]["could_not_install_new_callback"]);
			}
		} else {
			var shown_warnings = false;

			if(!model) {
				dbg("_show_or_hide_simple_visualization: " + language[lang]["model_is_not_defined"]);
				shown_warnings = true;
			}

			if(!x_shape_is_ok) {
				dbg(`${language[lang]["x_shape_is_wrong_for_simple_visualization"]}: [${xs_and_ys["x"].shape.join(", ")}]`);
				shown_warnings = true;
			}

			if(!y_shape_is_ok) {
				dbg(`${language[lang]["y_shape_is_wrong_for_simple_visualization"]}: [${xs_and_ys["y"].shape.join(", ")}]`);
				shown_warnings = true;
			}

			if(!model_shape_is_ok) {
				dbg(`${language[lang]["model_shape_is_wrong_for_simple_visualization"]}: ${model_shape_to_string(model.input.shape)}`);
				shown_warnings = true;
			}

			if (!shown_warnings) {
				dbg(language[lang]["unknown_reason_for_not_displaying_simple_visualization"]);
			}

			old_onEpochEnd = undefined;
			$("#simplest_training_data_visualization").html("").hide();
		}
	} catch (e) {
		if(Object.keys(e).includes("message")) {
			e = e.message;
		}

		assert(false, e);
	}
}

function model_shape_to_string (model_shape) {
	try {
		if (!Array.isArray(model_shape)) {
			throw new Error("Input is not an array.");
		}

		const result = model_shape.map((element) => {
			return element === null ? "null" : element;
		});

		return "[" + result.join(", ") + "]";
	} catch (error) {
		console.error("Error:", error.message);
		// Handle the error or rethrow it based on your requirements
	}
}

//console.log(convertNullToString([1, null, 3])); // Ausgabe: '[1, "null", 3]'
//console.log(convertNullToString([1, 2, 3])); // Ausgabe: '[1, 2, 3]'
//console.log(convertNullToString([null, 1, 2, 3, 4, 5])); // Ausgabe: '["null", 1, 2, 3, 4, 5]'


function _clear_plotly_epoch_history () {
	$("#plotly_epoch_history").parent().hide();
	$("#plotly_epoch_history").html("");
}

async function _get_fit_data (xs_and_ys) {
	var fit_data = true;

	try {
		add_layer_debuggers();

		fit_data = await get_fit_data();

		await _show_or_hide_simple_visualization(fit_data, xs_and_ys);

		await show_tab_label("training_tab_label", jump_to_interesting_tab());

	} catch (e) {
		await write_error_and_reset(e);
		fit_data = false;
	}

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
				return false;
			}
			if(last_layer_output_shape[1] != num_categories) {
				$($(".glass_box")[model.layers.length - 1]).find(".units").val(labels.length);
				await updated_page();

				log(language[lang]["not_rerunning_run_neural_network"]);
				return true;
			} else {
				return false;
			}
		} else {
			if(tries_classification_but_receives_other) {
				var ll = labels.length;
				show_overlay(language[lang]["fixing_output_shape"]);
				if(labels && ll) {
					is_repairing_output_shape = true;
					var change_to_beginner = 0;
					if(mode == "beginner") {
						l(language[lang]["temporarily_using_expert_mode"] + "...");
						change_to_beginner = 1;
						mode = "expert";
					}

					await (async () => {
						try {
							function get_last_layer (minus=1) {
								void(0); dbg(`get_last_layer(${minus})`);
								return $(".layer_type").length - minus;
							}

							async function change_layer_to (nr, to) {
								void(0); dbg(`change_layer_to(${nr}, ${to})`);
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

								dbg(language[lang]["changing_val_to"] + " " + to);
								$layer_type.val(to);

								dbg(language[lang]["changing_selectedIndex"] + " " + index);
								$layer_type.prop("selectedIndex", index);

								void(0); dbg("triggering $layer_type:", $layer_type);
								$layer_type.trigger("change");

								dbg(sprintf(language[lang]["start_waiting_for_x_becoming_equal_to_y"], $layer_type.val(), to));
								while ($layer_type.val() != to) {
									dbg(sprintf(language[lang]["currently_waiting_for_n_layer_m_becoming_equal_to_a"], $layer_type.val(), nr, to));
									await delay(100);
								}

								await delay(500);
							}

							async function duplicate_last_layer () {
								dbg(language[lang]["adding_layer"]);

								var $last_layer = $(".add_layer")[get_last_layer()];

								dbg(language[lang]["awaiting_disable_invalid_layers_event"]); // await

								enable_all_layer_types();

								var start_layers = model.layers.length;
								dbg(language[lang]["clicking_on_this_item_for_layer_duplication"], $last_layer);
								$last_layer.click();

								while (model.layers.length - (start_layers) > 0) {
									dbg(sprintf(language[lang]["waiting_until_model_layers_length_m_minus_start_layers_n_is_greater_than_zero"], model.layers.length, start_layers));
									await delay(200);
								}

								await delay(1000);

								if(mode == "beginner") {
									await disable_invalid_layers_event(new Event("duplicate_last_layer"), $last_layer);
								}
							}

							async function set_activation_to (nr, val) {
								void(0), dbg(`set_activation_to(${nr}, ${val})`);
								$($(".layer_setting")[nr]).find(".activation").val(val).trigger("change");
								while ($($(".layer_setting")[nr]).find(".activation").val() != val) {
									await delay(100);
								}
								await delay(500);
							}

							async function set_dense_layer_units(nr, units) {
								dbg(sprintf(language[lang]["setting_the_units_of_layer_n_to_m"], nr, units));
								var $units = $($(".layer_setting")[nr]).find(".units");
								$units.val(units);

								while (ll != $units.val()) {
									dbg(`${language[lang]["waiting_for_set_dense_layer_units"]}(${nr}, ${units})`);
									await delay(100);
								}
								await delay(500);
							}

							await duplicate_last_layer();
							await change_layer_to(get_last_layer() - 1, "flatten");

							await duplicate_last_layer();
							await change_layer_to(get_last_layer(), "dense");

							await set_dense_layer_units(get_last_layer(), ll);

							await set_activation_to(get_last_layer(), "softmax");

							remove_overlay();
							$("#start_training").click();
						} catch (e) {
							remove_overlay();
							$("#start_training").click();
							throw new Error(e);
						}
					})();

					if(change_to_beginner) {
						mode = "beginner";
					}

					is_repairing_output_shape = false;

					return true;
				} else {
					return false;
				}

			}
		}
	} catch (e) {
		if(Object.keys(e).includes("message")) {
			e = e.message;
		}

		if(("" + e).includes("model.layers is undefined")) {
			wrn("[repair_output_shape] model.layers is undefined");
		} else {
			throw new Error(e);
		}
	}

	return false;
}

function add_stop_training_class_to_train_button () {
	$(".train_neural_network_button").html("<span class='TRANSLATEME_stop_training'></span>").removeClass("start_training").addClass("stop_training");
}

function reset_predict_container_after_training() {
	$("#predictcontainer").show();
	$("#predict_error").hide().html("");
}

async function fit_model(xs_and_ys) {
	var fit_data = await _get_fit_data(xs_and_ys);

	await compile_model();

	l(language[lang]["started_training"]);
	var ret = await model.fit(xs_and_ys["x"], xs_and_ys["y"], fit_data)
	await nextFrame();
	l(language[lang]["finished_training"]);

	assert(typeof(ret) == "object", "history object is not of type object");

	model_is_trained = true;

	reset_predict_container_after_training();

	await dispose(fit_data);

	return ret;
}

async function prepare_gui_for_training() {
	await wait_for_updated_page(2);

	await clean_gui();

	add_stop_training_class_to_train_button();
}

async function run_neural_network (recursive=0) {
	var ret = null;

	if(!model) {
		err(`[run_neural_network] ${language[lang]["no_model_defined"]}`);
		return;
	}

	if(model.layers.length == 0) {
		err(`[run_neural_network] ${language[lang]["no_layers"]}`);
		return;
	}

	await prepare_gui_for_training();

	_set_apply_to_original_apply();

	var xs_and_ys = await _get_x_and_y();

	if(!xs_and_ys) {
		err(`[run_neural_network] ${language[lang]["could_not_get_xs_and_xy"]}`);
		return;
	}

	var repaired = false;

	if(started_training) {
		remove_overlay();

		await set_input_shape_from_xs(xs_and_ys);
		prepare_site_for_training();
		await compile_model_if_not_defined();
		await go_to_training_tab_label();

		try {
			ret = await fit_model(xs_and_ys);
		} catch (e) {
			repaired = await handle_model_fit_error(e, repaired, recursive);
		}

		show_input_shape_repaired_message(repaired);
		await enable_everything();
		hide_training_progress_bar();
	}

	xs_and_ys = await reset_stuff_after_training();

	return ret;
}

async function reset_stuff_after_training (xs_and_ys) {
	xs_and_ys = await reset_data_after_training(xs_and_ys);

	show_last_training_time_log();

	await gui_not_in_training();

	return xs_and_ys;
}

function prepare_site_for_training() {
	prepend_hr_to_training_content();

	_clear_plotly_epoch_history();
}

async function set_input_shape_from_xs(xs_and_ys) {
	return await set_input_shape("[" + xs_and_ys["x"].shape.slice(1).join(", ") + "]");
}

async function go_to_training_tab_label () {
	await show_tab_label("training_tab_label", jump_to_interesting_tab());
}

async function handle_model_fit_error (e, repaired, recursive) {
	log(e);
	if(("" + e).includes("is already disposed")) {
		wrn("[run_neural_network] Model was already disposed, this may be the case when, during the training, the model is re-created and something is tried to be predicted. Usually, this is a harmless error.");
		// input expected a batch of elements where each example has shape [2] (i.e.,tensor shape [*,2]) but the input received an input with 5 examples, each with shape [3] (tensor shape [5,3])
	} else if (("" + e).includes("input expected a batch of elements where each example has shape")) {
		err("[run_neural_network] Error: " + e + ". This may mean that you got the file from CSV mode but have not waited long enough to parse the file.");
	} else if (("" + e).includes("n is undefined")) {
		return await rerun_if_not_recursive_on_error(e)
	} else if (("" + e).includes("target expected a batch of elements where each example has shape")) {
		repaired = await try_repair_and_rerun_if_classification(repaired, e, recursive)
	} else {
		repaired = await last_effort_repair_and_run(e, repaired, recursive);
	}

	reset_tiny_graph();

	return repaired;
}

async function try_repair_and_rerun_if_classification (repaired, e, recursive) {
	if(is_classification && get_last_layer_activation_function() == "softmax") {
		try {
			await set_new_loss_and_metric_if_different("categoricalCrossentropy")

			try {
				repaired = await repair_output_shape(1);
			} catch (ee) {
				throw new Error(e);
			}

			if(!recursive) {
				await run_neural_network(1);
			}
		} catch (e) {
			wrn(e);
		}
	} else {
		await write_error(e);
	}

	return repaired;
}

async function last_effort_repair_and_run (e, repaired, recursive) {
	await gui_not_in_training();

	if(typeof(e) == "object" && Object.keys(e).includes("message")) {
		e = e.message;
	}

	if(("" + e).match(/expected.*to have (\d+) dimension\(s\). but got array with shape ((?:\d+,?)*\d+)\s*$/)) {
		repaired = await repair_shape_if_user_agrees(repaired);
	} else {
		return await handle_non_output_shape_related_training_errors(e, recursive);
	}

	return repaired;
}

async function rerun_if_not_recursive_on_error(e) {
	while (!model) {
		dbg("[run_neural_network] Waiting for model...");
		delay(500);
	}
	wrn("[run_neural_network] Error: " + e + ". This may mean the model was not yet compiled");

	if(!recursive) {
		return await run_neural_network(1);
	} else {
		throw new Error(e);
	}
}

function prepend_hr_to_training_content () {
	$("#training_content").clone().prepend("<hr>").appendTo("#training_tab");
}

async function repair_shape_if_user_agrees(repaired) {
	var r = await ask_if_output_shape_should_be_repaired();

	if (r.isConfirmed) {
		try {
			repaired = await repair_output_shape(1);
		} catch (ee) {
			throw new Error(ee);
		}
	} else if (r.isDenied) {
		Swal.fire("Not doing Input shape repair", "", "info");
	} else {
		log(language[lang]["unknown_swal_r"] + ": ", r);
	}

	return repaired;
}

async function ask_if_output_shape_should_be_repaired () {
	var r = null;

	await Swal.fire({
		title: language[lang]["defective_output_shape"],
		html: language[lang]["autofix_output_shape"],
		showDenyButton: true,
		showCancelButton: false,
		confirmButtonText: language[lang]["Yes"],
		denyButtonText: language[lang]["No"]
	}).then((result) => {
		r = result;
	});

	return r;
}

async function set_new_loss_and_metric_if_different (new_loss_and_metric) {
	var old_loss = get_loss();
	var old_metric = get_metric(); 

	if(old_loss != new_loss_and_metric) {
		set_loss(new_loss_and_metric);
		wrn("[run_neural_network] Autoset metric to " + new_loss_and_metric);
	}

	if(old_metric != new_loss_and_metric) {
		set_metric(new_loss_and_metric);
		wrn("[run_neural_network] Autoset metric to " + new_loss_and_metric);
	}

	await wait_for_updated_page(2);
}

async function handle_non_output_shape_related_training_errors(e, recursive) {
	if(("" + e).includes("model is null") || ("" + e).includes("model is undefined")) {
		return await recreate_and_compile_and_rerun_neural_network();
	} else if(("" + e).includes("but got array with shape")) {
		wrn("[run_neural_network] Shape error. This may happens when the width or height or changed while training or predicting. In this case, it's harmless.");
	} else if (("" + e).includes("expects targets to be binary matrices") && !recursive) {
		return await rerun_network_after_changing_loss_and_metric_to_mse(e);
	} else {
		await write_and_throw_error(e)
	}
}

async function recreate_and_compile_and_rerun_neural_network() {
	info("[run_neural_network] Model is null or undefined. Recompiling model...");
	model = await create_model();
	await compile_model();
	info("[run_neural_network] Model was null or undefined. Recompiling model done!");
	return await run_neural_network(1);
}

async function write_and_throw_error (e) {
	await write_error("" + e);
	throw new Error(e);
}

async function rerun_network_after_changing_loss_and_metric_to_mse (e) {
	dbg(`[run_neural_network] Error: '${e}', Setting loss and metric to meanSquaredError`);

	set_loss("meanSquaredError", 0);
	set_metric("meanSquaredError", 0);

	return await run_neural_network(1);
}

function show_input_shape_repaired_message(repaired) {
	if(repaired) {
		Swal.fire(
			language[lang]["output_shape_repaired"],
			language[lang]["please_try_training_again"],
			"success"
		);
	}
}

function show_last_training_time_log () {
	var dn = Date.now();
	if(last_training_time) {
		var training_time = parse_int(parse_int(dn - last_training_time) / 1000);
		if(training_time > 60) {
			l(language[lang]["done_training_took"] + " " + human_readable_time(training_time, dn, last_training_time) + " (" + training_time + "s)");
		} else {
			l(language[lang]["done_training_took"] + " " + human_readable_time(training_time));
		}
	}
}

async function reset_data_after_training(xs_and_ys) {
	await unset_xs_and_ys(xs_and_ys)

	await reset_data();

	await dispose_global_x_and_y()

	await save_current_status();

	return null;
}

async function dispose_global_x_and_y() {
	await dispose(global_x);
	await dispose(global_y);
}

async function unset_xs_and_ys(xs_and_ys) {
	try {
		if (xs_and_ys && Object.keys(xs_and_ys).includes("x") && xs_and_ys["x"]) {
			await dispose(xs_and_ys["x"]);
		}

		if (xs_and_ys && Object.keys(xs_and_ys).includes("y") && xs_and_ys["y"]) {
			await dispose(xs_and_ys["y"]);
		}
	} catch (e) {
		err(e);
		console.trace();
	}
}

async function write_error_and_reset(e, fn, hide_swal) {
	await write_error(e, fn, hide_swal);
	await reset_on_error();
}

async function reset_on_error () {
	started_training = false;

	document.body.style.cursor = get_cursor_or_none("default");
	$("#layers_container").sortable("enable");
	$("#ribbon,select,input,checkbox").prop("disabled", false);
	await write_descriptions();
	Prism.highlightAll();

	var link = document.querySelector("link[rel~='icon']");
	if (!link) {
		link = document.createElement("link");
		link.rel = "icon";
		document.getElementsByTagName("head")[0].appendChild(link);
	}
	link.href = "favicon.ico";
}

function draw_images_in_grid (images, categories, probabilities, category_overview) {
	$("#canvas_grid_visualization").html("");
	var numCategories = labels.length;

	var margin = 10;
	var canvases = [];

	var _height = $("#canvas_grid_visualization").height();

	if(!_height) {
		_height = 460;
	}

	// create a canvas for each category
	for (let i = 0; i < numCategories; i++) {
		var canvas = document.createElement("canvas");
		var relationScale = 1;
		var pw = parse_int($("#training_tab").width() * relationScale);
		var w = parse_int(pw / (numCategories + 1));

		canvas.width = w;
		canvas.height = _height;

		var ctx = canvas.getContext("2d");

		ctx.fillStyle = "rgba(255, 255, 255, 0)";
		ctx.fillRect(0, 0, canvas.width, canvas.height);

		ctx.font = "14px Arial";
		if(is_dark_mode) {
			ctx.fillStyle = "#ffffff";
		} else {
			ctx.fillStyle = "#000000";
		}
		ctx.textAlign = "right";

		canvases.push(canvas);
	}

	var graphWidth = canvases[0].width - margin * 2;
	var graphHeight = canvases[0].height - margin * 2;
	var maxProb = 1;

	// draw y-axis labels

	for (let canvasIndex = 0; canvasIndex < numCategories; canvasIndex++) {
		var canvas = canvases[canvasIndex];
		var ctx = canvas.getContext("2d");

		ctx.textAlign = "center";
		var label = labels[canvasIndex];
		var _text = label;
		ctx.fillText(_text, canvas.width / 2, canvas.height - margin - 30);

		if(!category_overview) {
			dbg("[draw_images_in_grid] category_overview was empty");
			continue;
		}

		var __key = labels[canvasIndex % labels.length];
		if(!Object.keys(category_overview).includes(__key)) {
			if (__key == "fire") { __key = language[lang]["fire"]; }
			else if (__key == "mandatory") { __key = language[lang]["mandatory"]; }
			else if (__key == "prohibition") { __key = language[lang]["prohibition"]; }
			else if (__key == "rescue") { __key = language[lang]["rescue"]; }
			else if (__key == "warning") { __key = language[lang]["warning"]; }
		}

		if(!Object.keys(category_overview).includes(__key)) {
			//dbg("[draw_images_in_grid] category_overview did not contain key " + __key);
			continue;
		}

		var _d = category_overview[__key];

		var _acc_text = `${_d["correct"]} ${language[lang]["of"]} ${_d["total"]} ${language[lang]["correct"]} (${_d["percentage_correct"]}%)`;

		ctx.fillText(_acc_text, canvas.width / 2, canvas.height - margin);
	}

	var canvas_img_counter = {};
	var real_canvas_img_counter = [];

	for (let i = 0; i < images.length; i++) {
		var category = categories[i];

		real_canvas_img_counter[category] = 0;
	}

	for (let i = 0; i < images.length; i++) {
		var category = categories[i];

		canvas_img_counter[category] = 0;

		real_canvas_img_counter[category]++;
	}

	var targetSize = Math.min(model.input.shape[1], model.input.shape[2]); // Change this to the desired size

	// draw x-axis labels and images
	for (let i = 0; i < images.length; i++) {
		var image = images[i];
		var category = categories[i];
		var probability = probabilities[i];

		if(real_canvas_img_counter[category] > 0) {
			var canvas_width = canvases[0].width;

			targetSize = canvas_width / real_canvas_img_counter[category];

			targetSize = Math.min(model.input.shape[1], model.input.shape[2], targetSize); // Change this to the desired size
		}

		var xPos = margin * 1;
		var yPos = margin + graphHeight - probability / maxProb * graphHeight;

		var canvasIndex = category;
		var canvas = canvases[canvasIndex];
		if(canvas) {
			var ctx = canvas.getContext("2d");

			// draw image
			var scale = targetSize / Math.max(image.width, image.height);
			var w = image.width * scale;
			var h = image.height * scale;

			var imageX = xPos - model.input.shape[2] / 2;
			imageX += canvas_img_counter[category] * targetSize;

			if(imageX < 0) {
				imageX = 0;
			}

			imageX = parse_int(imageX);

			var imageY = parse_int(yPos - h / 2);
			ctx.drawImage(image, imageX, imageY, w, h);

			canvas_img_counter[category]++;
		} else {
			wrn("[draw_images_in_grid] Canvas not defined. canvasIndex + 1:", canvasIndex);
		}
	}

	// append each canvas to its corresponding element
	for (let i = 0; i < numCategories; i++) {
		var canvas = canvases[i];
		if(canvas) {
			//var containerId = "#canvas_grid_visualization_" + (i + 1);
			var containerId = "#canvas_grid_visualization";
			$(canvas).appendTo($(containerId));
			if ((i + 1) < numCategories) {
				$(`<span style="display: inline-block; vertical-align: top; border-left: 1px solid #000; height: ${_height}px"></span>`).appendTo($(containerId));
			}
		} else {
			wrn("[draw_images_in_grid] Canvas could not be appended!");
		}
	}

}


function extractCategoryFromURL(_url, image_element) {
	if(!_url) {
		return null;
	}
	try {
		const categoryMatch = _url.match(/\/([^/]+)\/[^/]+?$/);

		if (categoryMatch && !_url.startsWith("data:image/png;base64")) {
			const category = categoryMatch[1];
			return category;
		} else {
			var $image_element = $(image_element);

			if($image_element.length == 0) {
				return null;
			}

			var category_number = $image_element.data("category");
			if (category_number !== null && category_number !== undefined && category_number !== "") {
				if(!labels.length) {
					wrn("labels is empty");
					return null;
				}
				return labels[category_number % labels.length];
			}

			wrn(`Category could not be found for the url ${_url} and the image element ${image_element}`);

			return null;
		}
	} catch (error) {
		console.error("Error while extracting category:", error);
		return null;
	}
}

function findIndexByKey(_array, key) {
	try {
		assert(Array.isArray(_array), "Input is not an _array");
		assert(typeof key === "string", "Key is not a string");

		for (let i = 0; i < _array.length; i++) {
			if (_array[i] === key) {
				return i; // Found the key, return its index
			}
		}

		assert(false, `Key ${key} not found in the _array: ${JSON.stringify(_array)}`);
	} catch (error) {
		console.log("Error:", error);
		// Handle the error intelligently, log and/or perform other actions as needed
	}
}


async function reset_cached_loaded_images () {
	var keys = Object.keys(_cached_loaded_images);

	for (var i = 0; i < keys.length; i++) {
		await dispose(_cached_loaded_images[keys[i]]);
	}

	_cached_loaded_images = {};
}

function cached_load_resized_image (image_element) {
	var image_element_xpath = get_element_xpath(image_element);

	if(Object.keys(_cached_loaded_images).includes(image_element_xpath) && !_cached_loaded_images[image_element_xpath].isDisposed) {
		return _cached_loaded_images[image_element_xpath];
	}

	var res = tidy(() => {
		var image_from_element = fromPixels(image_element);
		var _res = expand_dims(resize_image(image_from_element, [height, width]));

		_res = divNoNan(_res, parse_float($("#divide_by").val()));

		return _res;
	});

	_cached_loaded_images[image_element_xpath] = res;

	return res;
}

async function visualize_train () {
	if(!$("#visualize_images_in_grid").is(":checked")) {
		$("#canvas_grid_visualization").html("");
		return;
	}

	if(!is_classification) {
		log_once(language[lang]["train_visualization_only_works_for_classification_problems"]);
		$("#canvas_grid_visualization").html("");
		return;
	}

	if(!await input_shape_is_image()) {
		log_once(language[lang]["train_visualization_only_works_for_images"]);
		$("#canvas_grid_visualization").html("");
		return;
	}

	if(get_last_layer_activation_function() != "softmax") {
		log_once(language[lang]["train_visualization_only_works_when_last_layer_is_softmax"]);
		$("#canvas_grid_visualization").html("");
		return;
	}

	var imgs = [];
	var categories = [];
	var probabilities = [];

	var max = parse_int($("#max_number_of_images_in_grid").val());

	if(max == 0) {
		return;
	}

	$("#plotly_epoch_history").show();
	$("#canvas_grid_visualization").css({"position": "absolute"});
	$("#canvas_grid_visualization").css({"opacity": "0.5"});

	if(!labels.length) {
		$("#canvas_grid_visualization").html("");

		await nextFrame();

		return;
	}

	var image_elements = [];
	if($("#data_origin").val() == "default") {
		image_elements = $("#photos").find("img,canvas");
	} else {
		image_elements = $(".own_image_span").find("img,canvas")
	}

	if(image_elements.length == 0) {
		err("[visualize_train] Could not find image_elements");
		return;
	}

	var total_wrong = 0;
	var total_correct = 0;

	var category_overview = {};

	for (var i = 0; i < image_elements.length; i++) {
		var image_element = image_elements[i];

		var image_element_xpath = get_element_xpath(image_element);
		
		var this_predicted_array = [];


		var src;
		try {
			src = image_element.src;
		} catch (e) {
			if(Object.keys(e).includes("message")) {
				e = message;
			}

			e = "" + e;

			throw new Error(e);

			continue;
		}

		if(i <= max) {
			var res_array;

			if(!image_element) {
				tf.engine().endScope();
				wrn("[visualize_train] image_element not defined!", image_element);
				continue;
			}

			var img_tensor = tidy(() => {
				try {
					var res = cached_load_resized_image(image_element);
					return res;
				} catch (e) {
					err(e);
					return null;
				}
			});

			if(img_tensor === null) {
				wrn("[visualize_train] Could not load image from pixels from this element:", image_element);
				continue;
			}

			try {
				var res = tidy(() => {
					return model.predict(img_tensor);
				});

				res_array = array_sync(res)[0];
				await dispose(res);

				assert(Array.isArray(res_array), `res_array is not an array, but ${typeof(res_array)}, ${JSON.stringify(res_array)}`);

				this_predicted_array = res_array;

				if(this_predicted_array) {
					confusion_matrix_and_grid_cache[image_element_xpath] = this_predicted_array;

					var max_probability = Math.max(...this_predicted_array);
					var category = this_predicted_array.indexOf(max_probability);

					//console.log("xpath:", image_element_xpath, "category", category, "max_probability:", max_probability, "this_predicted_array:", this_predicted_array);

					categories.push(category);
					probabilities.push(max_probability);
					imgs.push(image_element);
				} else {
					err(`[visualize_train] Cannot find prediction for image with xpath ${image_element_xpath}`);
				}
			} catch (e) {
				wrn(`visualize_train: Error ${e}`)
			}
		}

		try {
			var tag_name = image_element.tagName;
			var predicted_tensor = this_predicted_array;

			if(predicted_tensor === null || predicted_tensor === undefined) {
				dbg("[visualize_train] Predicted tensor was null or undefined");
				return;
			}

			var predicted_index = predicted_tensor.indexOf(Math.max(...predicted_tensor));

			var correct_category = extractCategoryFromURL(src, image_element);
			if(correct_category === undefined || correct_category === null) {
				continue;				
			}

			var predicted_category = labels[predicted_index];

			var correct_index = -1;

			try {
				correct_index = findIndexByKey(get_all_labels(), correct_category) % labels.length;
			} catch (e) {
				wrn("[visualize_train] " + e);
				return;
			}

			if(!Object.keys(category_overview).includes(predicted_category)) {
				category_overview[predicted_category] = {
					wrong: 0,
					correct: 0,
					total: 0
				};
			}

			//log("predicted_category " + predicted_category + " detected from " + src + ", predicted_index = " + predicted_index + ", correct_index = " + correct_index);

			if(predicted_index == correct_index) {
				total_correct++;

				category_overview[predicted_category]["correct"]++;
			} else {
				total_wrong++;

				category_overview[predicted_category]["wrong"]++;
			}
			category_overview[predicted_category]["total"]++;
		} catch (e) {
			console.log(e);
		}

	}

	for (var i = 0; i < Object.keys(category_overview).length; i++) {
		var category = Object.keys(category_overview)[i];
		category_overview[category]["percentage_correct"] = parseInt((category_overview[category]["correct"] / category_overview[category]["total"]) * 100);
	}

	if(imgs.length && categories.length && probabilities.length) {
		draw_images_in_grid(imgs, categories, probabilities, category_overview);
	} else {
		$("#canvas_grid_visualization").html("");
	}

	await nextFrame();
}

function get_all_labels () {
	return [
		...labels, 
		...original_labels, 
		"Brandschutz", 
		"Gebot", 
		"Verbot", 
		"Rettung", 
		"Warnung", 
		"Fire prevention", 
		"Mandatory", 
		"Prohibition", 
		"Rescue", 
		"Warning",
		"fire",
		"mandatory",
		"prohibition",
		"rescue",
		"warning"
	]
}
