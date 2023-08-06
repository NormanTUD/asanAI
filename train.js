"use strict";

async function gui_in_training () {
	started_training = true;
	await disable_everything();
	favicon_spinner();
	await write_descriptions();
}

async function gui_not_in_training () {
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

	await enable_everything();
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

			await delay(200);

			await predict_handdrawn();
			await cosmo_maximally_activate_last_layer();

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
		}
	}

	await write_descriptions();
	await write_model_to_latex_to_page();

	await save_current_status();

	if(is_cosmo_mode) {
		chose_next_manicule_target();
	}
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
	var start_tensors = memory_leak_debugger();
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

	callbacks["onBatchBegin"] = async function () {
		var start_tensors = memory_leak_debugger();
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

	callbacks["onEpochBegin"] = async function () {
		var start_tensors = memory_leak_debugger();
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
			time_estimate = human_readable_time_german(seconds_left);
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

	callbacks["onBatchEnd"] = async function (batch, logs) {
		var start_tensors = memory_leak_debugger();
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
				Plotly.newPlot('plotly_batch_history', this_plot_data, plotly_layout);
				Plotly.newPlot('plotly_time_per_batch', [time_per_batch["time"]], plotly_layout);
			} else {
				Plotly.update('plotly_batch_history', this_plot_data, plotly_layout);
				Plotly.update('plotly_time_per_batch', [time_per_batch["time"]], plotly_layout);
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

	callbacks["onEpochEnd"] = async function (batch, logs) {
		var start_tensors = memory_leak_debugger();
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
					"mode": get_plotly_type(),
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
				Plotly.newPlot('plotly_epoch_history', this_plot_data, plotly_layout);
			} else {
				Plotly.update('plotly_epoch_history', this_plot_data, plotly_layout);
			}
		} else {
			$("#plotly_epoch_history").hide();
		}

		var this_plot_data = [training_logs_batch["loss"]];
		Plotly.update('plotly_batch_history', this_plot_data, plotly_layout);
		Plotly.update('plotly_time_per_batch', [time_per_batch["time"]], plotly_layout);
		last_batch_plot_time = false;

		await visualize_train();
		memory_leak_debugger("onEpochEnd", start_tensors);
	}

	callbacks["onTrainEnd"] = async function () {
		var start_tensors = memory_leak_debugger();
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

function _set_apply_to_original_apply () {
	var start_tensors = memory_leak_debugger();

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

async function _create_and_compile_model () {
	try {
		model = await create_model(model);
	} catch (e) {
		throw new Error("Creating model failed: " + e);
	}

	try {
		await compile_model();
	} catch (e) {
		throw new Error("Compiling model failed: " + e);
	}
}

async function _get_xs_and_ys () {
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
		log(e);
		header("ERROR END");
		console.trace();
		favicon_default();
		await write_descriptions();
		$(".train_neural_network_button").html("Start training").removeClass("stop_training").addClass("start_training");
		started_training = false;
		return false;
	}

	return xs_and_ys;
}

async function _show_or_hide_simple_visualization (xs_and_ys) {
	var start_tensors = memory_leak_debugger();
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

function _clear_plotly_epoch_history () {
	$("#plotly_epoch_history").parent().hide();
	$("#plotly_epoch_history").html("");
}

async function _get_fit_data (xs_and_ys) {
	var start_tensors = memory_leak_debugger();
	var fit_data = true;

	try {
		add_layer_debuggers();

		fit_data = get_fit_data();

		await _show_or_hide_simple_visualization(xs_and_ys);

		var start_tensors = memory_leak_debugger();

		show_tab_label("tfvis_tab_label", $("#jump_to_interesting_tab").is(":checked") ? 1 : 0);

		memory_leak_debugger("checking data fit", start_tensors);
	} catch (e) {
		await write_error_and_reset(e);
		fit_data = false;
	}

	memory_leak_debugger("get_fit_data", start_tensors);
	return fit_data;
}

async function run_neural_network () {
	var start_tensors = memory_leak_debugger();
	await clean_gui();

	$(".train_neural_network_button").html("Stop training").removeClass("start_training").addClass("stop_training");

	_set_apply_to_original_apply();

	await _create_and_compile_model();

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

		var fit_data = await _get_fit_data(xs_and_ys);

		var error = 0;

		try {
			/*
			log("Model-Input-shape:", model.getInputAt(0).shape);
			log("x-shape:", xs_and_ys["x"].shape);
			log("y-shape:", xs_and_ys["y"].shape);
			*/

			show_tab_label("tfvis_tab_label", $("#jump_to_interesting_tab").is(":checked") ? 1 : 0);
			var start_tensors = memory_leak_debugger();

			h = await model.fit(xs_and_ys["x"], xs_and_ys["y"], fit_data);

			await tf.nextFrame();

			memory_leak_debugger("model.fit done", start_tensors);
			l("Finished model.fit");

			assert(typeof(h) == "object", "history object is not of type object");

			await dispose(h);
		} catch (e) {
			console.error(e);
			if(typeof(e) == "object" && Object.keys(e).includes("message")) {
				e = e.message;
			}
			await write_error("" + e);
			error = 1;
		}

		await dispose(fit_data);

		if(!error) {
			model_is_trained = true;

			$("#predictcontainer").show();
			$("#predict_error").hide().html("");

			await enable_everything();

			$("#training_progress_bar").hide();
		}
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
	l("Done training, took " + human_readable_time(training_time) + " (" + training_time + "s)");
	last_training_time = "";

	memory_leak_debugger("run_neural_network", start_tensors);
}

async function write_error_and_reset(e, fn, hide_swal) {
	await write_error(e, fn, hide_swal);
	await reset_on_error();
}

async function reset_on_error () {
	started_training = false;

	document.body.style.cursor = "default";
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
}

function randomInRange(start,end){
       return Math.floor(Math.random() * (end - start + 1) + start);
}

function drawImagesInGrid(images, categories, probabilities, numCategories) {
	var start_tensors = memory_leak_debugger();
	$("#canvas_grid_visualization").html("");
	var categoryNames = labels.slice(0, numCategories);
	var margin = 40;
	var canvases = [];

	// create a canvas for each category
	for (let i = 0; i < (numCategories + 1); i++) {
		var canvas = document.createElement("canvas");
		canvas.width = parseInt($("#tfvis_tab").width() / (numCategories + 2));
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
			var label = (j / 10 * maxProb).toFixed(2);
			ctx.fillText(label, margin - 10, yPos);
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
	}

	// append each canvas to its corresponding element
	for (let i = 0; i < (numCategories + 1); i++) {
		var canvas = canvases[i];
		//var containerId = "#canvas_grid_visualization_" + (i + 1);
		var containerId = "#canvas_grid_visualization";
		$(canvas).appendTo($(containerId));
		$('<span style="display:table-cell; border-left:1px solid #000;height:400px"></span>').appendTo($(containerId));
	}

	memory_leak_debugger("drawImagesInGrid", start_tensors);
}

async function visualize_train () {
	var start_tensors = memory_leak_debugger();
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
				tf.engine().startScope()
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
			//log("drawImagesInGrid:", imgs, categories, probabilities, labels.length);
			drawImagesInGrid(imgs, categories, probabilities, labels.length);
		} else {
			$("#canvas_grid_visualization").html("");
		}
	} else {
		$("#canvas_grid_visualization").html("");
	}

	await tf.nextFrame();

	memory_leak_debugger("visualize_train", start_tensors);
}
