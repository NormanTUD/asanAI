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

async function train_neural_network () {
	if(model === null || model === undefined || typeof(model) != "object" || !Object.keys(model).includes("layers")) {
		await gui_not_in_training();

		model = await create_model();
		await compile_model();

		return;
	}

	if(started_training) {
		if(is_cosmo_mode) {
			$(".auto_image_captions").remove();
			$("#webcam_in_cosmo").show();
			return;
		} else {
			show_overlay(language[lang]["stopped_training"] + " &mdash; " + language[lang]["this_may_take_a_while"] + "...");

			if($("#show_grad_cam").is(":checked")) {
				l("You can either use grad CAM or the internal layer states, but not both. GradCAM.");
				$("#show_grad_cam").prop("checked", false).prop("disabled", true).trigger("change");
			}
		}

		stop_downloading_data = true;

		if(model.isTraining) {
			model.stopTraining = true;
			model.stopTraining = true;
		}

		set_document_title(original_title);
		await gui_not_in_training();
		$(".overlay").remove();
		l(language[lang]["stopped_training"]);
	} else {
		l("Started training");

		stop_downloading_data = false;

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
				"name": "Loss"
			}
		};

		training_logs_epoch = {
			"loss": {
				"x": [],
				"y": [],
				"type": get_scatter_type(),
				"mode": get_plotly_type(),
				"name": "Loss"
			}
		};

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

		training_memory_history = {
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

		reset_gui_before_training();

		$("#percentage").html("");
		$("#percentage").hide();

		await run_neural_network();

		if(is_cosmo_mode) {
			//await show_tab_label("predict_tab_label", 1);

			//set_right_border_between_example_predictions();

			$("#own_files").hide();

			await _predict_mode_examples();
			//$("#example_predictions").show();

			//await fit_to_window();

			//await cosmo_maximally_activate_last_layer();

			//await fit_to_window();

			//await predict_handdrawn();

			await fit_to_window();

			await chose_next_manicule_target();

			if(!already_moved_to_predict_for_cosmo && 0) {
				move_element_to_another_div($("#maximally_activated_content")[0], $("#cosmo_visualize_last_layer")[0]);
				already_moved_to_predict_for_cosmo = true;
			}

			/*
			if(!cam) {
				$("#show_webcam_button").click();
			}
			*/
		} else {
			await show_tab_label("predict_tab_label", jump_to_interesting_tab());
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
		await chose_next_manicule_target();
	}

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

	var loss = $("#loss").val();
	var optimizer_type = $("#optimizer").val();
	var metric_type = $("#metric").val();

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

		if(is_cosmo_mode) {
			$("#program_looks_at_data_span").show();
			$("#show_after_training").hide();
		}
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

		if(is_cosmo_mode) {
			await show_tab_label("training_tab_label", 1);
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

		$("#training_progress_bar").show();

		set_document_title("[" + current_epoch + "/" + max_number_epochs + ", " + time_estimate  + "] asanAI");

		if(is_cosmo_mode) {
			time_estimate = human_readable_time(parse_int(seconds_left * 2.5));
			if(max_number_epochs && current_epoch > 0 && time_estimate && seconds_left >= 0) {
				$("#current_epoch_cosmo_display").html(current_epoch);
				$("#max_epoch_cosmo_display").html(max_number_epochs);
				$("#time_estimate_cosmo").html(time_estimate);
				$("#show_cosmo_epoch_status").show();
			} else {
				$("#show_cosmo_epoch_status").hide();
			}
			idleTime = 0;
		}

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

		if(!is_cosmo_mode) {
			$("#plotly_batch_history").parent().show();
			$("#plotly_time_per_batch").parent().show();
		}

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

		if(is_cosmo_mode) {
			$("#cosmo_training_grid_stage_explanation").show();
			if(current_cosmo_stage == 1) {
				await visualize_train();
			}
		}

		confusion_matrix_and_grid_cache = {};
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
		if(is_cosmo_mode) {
			if(current_cosmo_stage == 1 || current_cosmo_stage == 2) {
				$("#cosmo_training_predictions_explanation").hide();
				$("#cosmo_training_grid_stage_explanation").show();
				$("#cosmo_training_plotly_explanation").hide();

				$("#plotly_epoch_history").hide();

				await visualize_train();

				$("#visualize_images_in_grid").show();
			/*
			} else if(current_cosmo_stage == 2) {
				$("#visualize_images_in_grid").hide();

				$("#cosmo_training_predictions_explanation").show();
				$("#cosmo_training_grid_stage_explanation").hide();
				$("#cosmo_training_plotly_explanation").hide();

				$("#plotly_epoch_history").hide();

				var elem = $("#example_predictions")[0];
				var to = $("#training_tab")[0];
				move_element_to_another_div(elem, to)

				await repredict();
				await update_translations();

			*/
			} else {
				$("#visualize_images_in_grid").hide();

				$("#cosmo_training_predictions_explanation").hide();
				$("#cosmo_training_grid_stage_explanation").hide();
				$("#cosmo_training_plotly_explanation").show();

				if(epochNr == 0 || epochNr == 1) {
					Plotly.newPlot("plotly_epoch_history", this_plot_data, get_plotly_layout(language[lang]["epochs"]));
				} else {
					Plotly.update("plotly_epoch_history", this_plot_data, get_plotly_layout(language[lang]["epochs"]));
				}

				$("#plotly_epoch_history").show();
				$("#visualize_images_in_grid").html("").hide();
				$("#canvas_grid_visualization").html("").hide();
			}

			await fit_to_window();
		} else {
			$("#plotly_epoch_history").show();
			if(epochNr == 1) {
				Plotly.newPlot("plotly_epoch_history", this_plot_data, get_plotly_layout(language[lang]["epochs"]));
			} else {
				Plotly.update("plotly_epoch_history", this_plot_data, get_plotly_layout(language[lang]["epochs"]));
			}

			await visualize_train();
		}

		if(training_logs_batch && "loss" in training_logs_batch) {
			var this_plot_data = [training_logs_batch["loss"]];
			Plotly.update("plotly_batch_history", this_plot_data, get_plotly_layout(language[lang]["batches"]));
		}
		if(time_per_batch && "time" in time_per_batch) {
			Plotly.update("plotly_time_per_batch", [time_per_batch["time"]], get_plotly_layout(language[lang]["time_per_batch"]));
		}
		last_batch_plot_time = false;

		if(is_cosmo_mode) {
			await fit_to_window();
		}

		if(training_logs_epoch["loss"].x.length >= 2) {
			var vl = Object.keys(training_logs_epoch).includes("val_loss") ? training_logs_epoch["val_loss"].y : null;
			var th = 18;
			var plotCanvas = create_tiny_plot(training_logs_epoch["loss"].x, training_logs_epoch["loss"].y, vl, th * 2, parse_int(0.9 * th));
			$("#tiny_graph").html("");
			$("#tiny_graph").append(plotCanvas).show();
		} else {
			$("#tiny_graph").html("").hide();
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
		await restart_lenet();

		$("#tiny_graph").hide();

		if(0 && is_cosmo_mode) {
			if(current_cosmo_stage == 1) {
				var elem = $("#example_predictions")[0];
				var to = $("#example_predictions_parent")[0];
				log("moving", elem, "to", to);
				move_element_to_another_div(elem, to);
			}
		}

		$("#network_has_seen_msg").hide();
		if(is_cosmo_mode) {
			$("#show_after_training").show();
		}

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

//var pc = create_tiny_plot([1,2,3,4], [1,2,3,4], [5,6,7,8], 20, 20); $("#tiny_graph").html(""); $("#tiny_graph").append(pc).show();

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

async function _get_xs_and_ys (recursive=0) {
	var xs_and_ys = false;
	try {
		var error_string = "";
		write_model_summary_wait();

		await disable_everything();
		l("Getting data...");
		xs_and_ys = await get_xs_and_ys();
		await show_tab_label("training_tab_label", jump_to_interesting_tab());
		l(language[lang]["got_data"]);
	} catch (e) {
		if(Object.keys(e).includes("message")) {
			e = e.message;
		}

		if(("" + e).includes("n is undefined") && recursive == 0) {
			wrn("[_get_xs_and_ys] Error '" + e + "'. Trying to get xs and ys again...");
			return await _get_xs_and_ys(recursive + 1);
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
				wrn(`[_show_or_hide_simple_visualization] Model not found. Not showing simple visualization`);
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
				log("Could not install new callback");
			}
		} else {
			var shown_warnings = false;

			if(!model) {
				dbg(`model is not defined`);
				shown_warnings = true;
			}

			if(!x_shape_is_ok) {
				dbg(`x-shape is wrong: [${xs_and_ys["x"].shape.join(", ")}]`);
				shown_warnings = true;
			}

			if(!y_shape_is_ok) {
				dbg(`y-shape is wrong: [${xs_and_ys["y"].shape.join(", ")}]`);
				shown_warnings = true;
			}

			if(!model_shape_is_ok) {
				dbg(`model-shape is wrong: ${model_shape_to_string(model.input.shape)}`);
				shown_warnings = true;
			}

			if (!shown_warnings) {
				dbg(`Unknown reason for not displaying simple visualization`);
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
			throw new Error('Input is not an array.');
		}

		const result = model_shape.map((element) => {
			return element === null ? 'null' : element;
		});

		return '[' + result.join(', ') + ']';
	} catch (error) {
		console.error('Error:', error.message);
		// Handle the error or rethrow it based on your requirements
	}
}

// Beispielaufrufe
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

				log("Not re-running run_neural_network");
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
						l("Temporarily using expert mode...");
						change_to_beginner = 1;
						mode = "expert";
					}

					await (async () => {
						try {
							function get_last_layer (minus=1) {
								debug(`get_last_layer(${minus})`);
								return $(".layer_type").length - minus;
							}

							async function change_layer_to (nr, to) {
								debug(`change_layer_to(${nr}, ${to})`);
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

								debug("changing val to " + to);
								$layer_type.val(to);

								debug("changing selectedIndex to " + index);
								$layer_type.prop("selectedIndex", index);

								debug("triggering $layer_type:", $layer_type);
								$layer_type.trigger("change");

								debug(`Start waiting for "${$layer_type.val()}" becoming equal to ${to}`);
								while ($layer_type.val() != to) {
									debug(`Currently waiting for "${$layer_type.val()}" (layer ${nr}) becoming equal to ${to}`);
									await delay(100);
								}

								await delay(500);
							}

							async function duplicate_last_layer () {
								debug("Adding layer");

								var $last_layer = $(".add_layer")[get_last_layer()];

								debug("Awaiting disable_invalid_layers_event()"); // await

								enable_all_layer_types();

								var start_layers = model.layers.length;
								debug("Clicking on this item for layer duplication: ", $last_layer);
								$last_layer.click();

								while (model.layers.length - (start_layers) > 0) {
									debug(`Waiting until model.layers.length (${model.layers.length}) - (start_layers) (${(start_layers)}) > 0`);
									await delay(200);
								}

								await delay(1000);

								if(mode == "beginner") {
									await disable_invalid_layers_event(new Event("duplicate_last_layer"), $last_layer);
								}
							}

							async function set_activation_to (nr, val) {
								debug(`set_activation_to(${nr}, ${val})`);
								$($(".layer_setting")[nr]).find(".activation").val(val).trigger("change");
								while ($($(".layer_setting")[nr]).find(".activation").val() != val) {
									await delay(100);
								}
								await delay(500);
							}

							async function set_dense_layer_units(nr, units) {
								debug("Setting the units of layer " + nr + " to " + units);
								var $units = $($(".layer_setting")[nr]).find(".units");
								$units.val(units);

								while (ll != $units.val()) {
									debug(`Waiting for set_dense_layer_units(${nr}, ${units})`);
									await delay(100);
								}
								await delay(500);
							}

							await duplicate_last_layer();
							await change_layer_to(get_last_layer(), "flatten");

							await duplicate_last_layer();
							await change_layer_to(get_last_layer(), "dense");

							await set_dense_layer_units(get_last_layer(), ll);

							await set_activation_to(get_last_layer(), "softmax");

							$(".overlay").remove();
							$("#start_training").click();
						} catch (e) {
							$(".overlay").remove();
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

async function run_neural_network (recursive=0) {
	await wait_for_updated_page(2);

	if(!model) {
		err("[run_neural_network] No model");
		return;
	}

	if(model.layers.length == 0) {
		err("[run_neural_network] No layers");
		return;
	}

	if(is_cosmo_mode) {
		$("#lenet_example_cosmo").parent().hide();
		await delay(200);
	}
	await clean_gui();
	if(is_cosmo_mode) {
		await fit_to_window();
	}

	$(".train_neural_network_button").html("<span class='TRANSLATEME_stop_training'></span>").removeClass("start_training").addClass("stop_training");
	await update_translations();

	_set_apply_to_original_apply();

	var xs_and_ys = await _get_xs_and_ys();

	if(!xs_and_ys) {
		err("[run_neural_network] Could not get xs_and_ys");
		return;
	}

	var repaired = false;

	if(started_training) {
		$(".overlay").remove();

		var inputShape = await set_input_shape("[" + xs_and_ys["x"].shape.slice(1).join(", ") + "]");

		if(!is_cosmo_mode) {
			$("#training_content").clone().appendTo("#training_tab");
		}

		_clear_plotly_epoch_history();

		if(!model) {
			model = await create_model();
			await compile_model();
		}

		var fit_data = await _get_fit_data(xs_and_ys);

		await show_tab_label("training_tab_label", jump_to_interesting_tab());

		try {
			l(language[lang]["compiling_model"]);
			await compile_model();


			l(language[lang]["started_training"]);

			h = await model.fit(xs_and_ys["x"], xs_and_ys["y"], fit_data);

			l(language[lang]["finished_training"]);

			await nextFrame();

			assert(typeof(h) == "object", "history object is not of type object");

			model_is_trained = true;

			$("#predictcontainer").show();
			$("#predict_error").hide().html("");
		} catch (e) {
			log(e);
			if(("" + e).includes("is already disposed")) {
				err("[run_neural_network] Model was already disposed, this may be the case when, during the training, the model is re-created and something is tried to be predicted. USUALLY, not always, this is a harmless error.");
				// input expected a batch of elements where each example has shape [2] (i.e.,tensor shape [*,2]) but the input received an input with 5 examples, each with shape [3] (tensor shape [5,3])
			} else if (("" + e).includes("input expected a batch of elements where each example has shape")) {
				err("[run_neural_network] Error: " + e + ". This may mean that you got the file from CSV mode but have not waited long enough to parse the file.");
			} else if (("" + e).includes("n is undefined")) {
				while (!model) {
					dbg("[run_neural_network] Waiting for model...");
					delay(500);
				}
				wrn("[run_neural_network] Error: " + e + ". This may mean the model was not yet compiled");

				if(!recursive) {
					await run_neural_network(1);
				} else {
					throw new Error(e);
				}
			} else if (("" + e).includes("target expected a batch of elements where each example has shape")) {
				if(is_classification && get_last_layer_activation_function() == "softmax") {
					try {
						var old_loss = $("#loss").val();
						var old_metric = $("#metric").val();

						var new_loss = "categoricalCrossentropy";
						var new_metric = new_loss;

						if(old_loss != new_loss) {
							$("#loss").val(new_loss).trigger("change");
							wrn("[run_neural_network] Autoset metric to " + new_loss);
						}

						if(old_metric != new_metric) {
							$("#metric").val(new_metric).trigger("change");
							wrn("[run_neural_network] Autoset metric to " + new_metric);
						}
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
			} else if (("" + e).includes("n is undefined")) {
				if(!recursive) {
					await run_neural_network(1);
				} else {
					throw new Error(e);
				}
			} else {
				await gui_not_in_training();

				if(typeof(e) == "object" && Object.keys(e).includes("message")) {
					e = e.message;
				}

				if(("" + e).match(/expected.*to have (\d+) dimension\(s\). but got array with shape ((?:\d+,?)*\d+)\s*$/)) {
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

					if (r.isConfirmed) {
						try {
							repaired = await repair_output_shape(1);
						} catch (ee) {
							throw new Error(ee);
						}
					} else if (r.isDenied) {
						Swal.fire("Not doing Input shape repair", "", "info");
					} else {
						log("Unknown swal r: ", r);
					}
				} else {
					if(("" + e).includes("model is null") || ("" + e).includes("model is undefined")) {
						info("[run_neural_network] Model is null or undefined. Recompiling model...");
						model = await create_model();
						await compile_model();
						info("[run_neural_network] Model was null or undefined. Recompiling model done!");
					} else if(("" + e).includes("but got array with shape")) {
						wrn("[run_neural_network] Shape error. This may happens when the width or height or changed while training or predicting. In this case, it's harmless.");
					} else if (("" + e).includes("expects targets to be binary matrices") && !recursive) {
						dbg(`[run_neural_network] Error: '${e}', Setting loss and metric to meanSquaredError`);

						$("#loss").val("meanSquaredError");
						$("#metric").val("meanSquaredError");

						await run_neural_network(1);
					} else {
						await write_error("" + e);

						throw new Error(e);
					}
				}
			}

			$("#tiny_graph").html("");
		}

		if(repaired) {
			Swal.fire(
				language[lang]["output_shape_repaired"],
				language[lang]["please_try_training_again"],
				"success"
			);
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
		err(e);
		console.trace();
	}

	await reset_data();

	await dispose(global_x);
	await dispose(global_y);

	await save_current_status();
	var dn = Date.now();
	if(last_training_time) {
		var training_time = parse_int(parse_int(dn - last_training_time) / 1000);
		if(training_time > 60) {
			l(language[lang]["done_training_took"] + " " + human_readable_time(training_time, dn, last_training_time) + " (" + training_time + "s)");
		} else {
			l(language[lang]["done_training_took"] + " " + human_readable_time(training_time));
		}
	}

	await gui_not_in_training();
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
	var margin = 40;
	var canvases = [];

	// create a canvas for each category
	for (let i = 0; i < numCategories; i++) {
		var canvas = document.createElement("canvas");
		var pw = parse_int($("#training_tab").width() * relationScale);
		var w = parse_int(pw / (numCategories + 1));

		if(is_cosmo_mode) {
			w = 200;
		}

		canvas.width = w;
		canvas.height = 460;

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

	var targetSize = Math.min(40, height, width); // Change this to the desired size

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

		var __key = labels[canvasIndex];
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

		var _acc_text = 
			_d["correct"] + 
			" " + 
			language[lang]["of"] + 
			" " + 
			_d["total"] + 
			" " + 
			language[lang]["correct"] +
			" (" + 
			_d["percentage_correct"] + 
			"%)"
		;

		//log("TEXT:", _text);
		ctx.fillText(_acc_text, canvas.width / 2, canvas.height - margin);
	}

	// draw x-axis labels and images
	for (let i = 0; i < images.length; i++) {
		var image = images[i];
		var category = categories[i];
		var probability = probabilities[i];

		var xPos = margin * 1.5;
		var yPos = margin + graphHeight - probability / maxProb * graphHeight;

		var canvasIndex = category;
		var canvas = canvases[canvasIndex];
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
			if(is_cosmo_mode) {
				$(containerId).css("background", "#00429d").css("background", "linear-gradient(0deg, lightyellow 0%, #96ffea 70%, #00429d 100%");
			}
			$(`<span style="display: inline-block; vertical-align: top; border-left: 1px solid #000; height: 400px"></span>`).appendTo($(containerId));
		} else {
			wrn("[draw_images_in_grid] Canvas could not be appended!");
		}
	}

}

function extractCategoryFromURL(_url) {
	if(!_url) {
		dbg(`[extractCategoryFromURL] extractCategoryFromURL(${_url})`);
		return null;
	}
	try {
		const categoryMatch = _url.match(/\/([^/]+)\/[^/]+?$/);

		if (categoryMatch) {
			const category = categoryMatch[1];
			return category;
		} else {
			console.warn("Category not found in the URL:", _url);
			return null; // Or handle the error in your specific way
		}
	} catch (error) {
		console.error("Error while extracting category:", error);
		return null; // Or handle the error in your specific way
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

function cached_load_resized_image (img_elem) {
	var img_elem_xpath = get_element_xpath(img_elem);

	if(Object.keys(_cached_loaded_images).includes(img_elem_xpath) && !_cached_loaded_images[img_elem_xpath].isDisposed) {
		return _cached_loaded_images[img_elem_xpath];
	}

	var res = tidy(() => {
		var _res = expand_dims(resize_image(fromPixels(img_elem), [height, width]));

		_res = divNoNan(_res, parse_float($("#divide_by").val()));

		return _res;
	});

	_cached_loaded_images[img_elem_xpath] = res;

	return res;
}

async function visualize_train () {
	if(!$("#visualize_images_in_grid").is(":checked")) {
		$("#canvas_grid_visualization").html("");
		return;
	}

	if($("#data_origin").val() != "default") {
		log_once("Train visualization only works for default data.");
		$("#canvas_grid_visualization").html("");
		return;
	}

	if(!is_classification) {
		log_once("Train visualization only works for classification problems.");
		$("#canvas_grid_visualization").html("");
		return;
	}

	if(!await input_shape_is_image()) {
		log_once("Train visualization only works for images.");
		$("#canvas_grid_visualization").html("");
		return;
	}

	if(get_last_layer_activation_function() != "softmax") {
		log_once("Train visualization only works when the last layer is softmax.");
		$("#canvas_grid_visualization").html("");
		return;
	}

	var imgs = [];
	var categories = [];
	var probabilities = [];

	var max = parse_int($("#max_number_of_images_in_grid").val());

	if(is_cosmo_mode) {
		max = 10000;
	}

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

	if(!labels.length) {
		$("#canvas_grid_visualization").html("");

		await nextFrame();

		if(is_cosmo_mode) {
			await fit_to_window();
		}

		return;
	}

	var image_elements = $("#photos").find("img,canvas");
	if(!image_elements.length) {
		err("[visualize_train] could not find image_elements");
		return;
	}

	var total_wrong = 0;
	var total_correct = 0;

	var category_overview = {};

	for (var i = 0; i < image_elements.length; i++) {
		var img_elem = image_elements[i];

		var img_elem_xpath = get_element_xpath(img_elem);
		
		var this_predicted_array = [];


		var src;
		try {
			src = img_elem.src;
		} catch (e) {
			if(Object.keys(e).includes("message")) {
				e = message;
			}

			e = "" + e;

			throw new Error(e);

			continue;
		}

		if(!src) {
			err("[visualize_train] Cannot use images without src tags");
			continue;
		}

		if(i <= max) {
			var res_array;

			if(!img_elem) {
				tf.engine().endScope();
				wrn("[visualize_train] img_elem not defined!", img_elem);
				continue;
			}

			var img_tensor = tidy(() => {
				try {
					var res = cached_load_resized_image(img_elem);
					return res;
				} catch (e) {
					err(e);
					return null;
				}
			});

			if(img_tensor === null) {
				wrn("[visualize_train] Could not load image from pixels from this element:", img_elem);
				continue;
			}

			var res = tidy(() => { return model.predict(img_tensor); });

			res_array = array_sync(res)[0];
			await dispose(res);

			assert(Array.isArray(res_array), `res_array is not an array, but ${typeof(res_array)}, ${JSON.stringify(res_array)}`);

			this_predicted_array = res_array;

			if(this_predicted_array) {
				confusion_matrix_and_grid_cache[img_elem_xpath] = this_predicted_array;

				var max_probability = Math.max(...this_predicted_array);
				var category = this_predicted_array.indexOf(max_probability);

				//console.log("xpath:", img_elem_xpath, "category", category, "max_probability:", max_probability, "this_predicted_array:", this_predicted_array);

				categories.push(category);
				probabilities.push(max_probability);
				imgs.push(img_elem);
			} else {
				err(`[visualize_train] Cannot find prediction for image with xpath ${img_elem_xpath}`);
			}
		}

		try {
			var tag_name = img_elem.tagName;
			if(src && tag_name == "IMG") {
				var predicted_tensor = this_predicted_array;

				if(predicted_tensor === null || predicted_tensor === undefined) {
					dbg("[visualize_train] Predicted tensor was null or undefined");
					return;
				}

				var predicted_index = predicted_tensor.indexOf(Math.max(...predicted_tensor));

				var correct_category = extractCategoryFromURL(src);
				if(correct_category === undefined || correct_category === null) {
					continue;				
				}

				var predicted_category = labels[predicted_index];

				if(is_cosmo_mode) {
					predicted_category = language[lang][predicted_category];
				}

				var correct_index = -1;

				try {
					correct_index = findIndexByKey(
						[
							...labels, 
							...cosmo_categories, 
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
						], correct_category) % labels.length;
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
			} else {
				err(`[visualize_train] Cannot use img element, src: ${src}, tagName: ${tag_name}`);
			}
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

	if(is_cosmo_mode) {
		await fit_to_window();
	}
}
