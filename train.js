"use strict";

var multi_run_data = {};
var current_multi_run = 0;

function save_multi_run_weights(run) {
	if (!model) return;
	multi_run_data[run].weights = model.layers.map(function(layer) {
		return layer.getWeights().map(function(w) {
			return w.arraySync();
		});
	});
}

function restore_multi_run_weights(run) {
	if (!model || !multi_run_data[run] || !multi_run_data[run].weights) return false;
	model.layers.forEach(function(layer, li) {
		var saved = multi_run_data[run].weights[li];
		if (saved) {
			layer.setWeights(saved.map(function(arr) {
				return tf.tensor(arr);
			}));
		}
	});
	return true;
}

function show_multi_run_run_chart(run) {
	if (!multi_run_data[run] || !multi_run_data[run].plotData) return;
	current_multi_run = run;

	var plotData = multi_run_data[run].plotData;
	var traces = [];
	Object.keys(plotData).forEach(function(key) {
		if (plotData[key].x && plotData[key].x.length) {
			traces.push(JSON.parse(JSON.stringify(plotData[key])));
		}
	});

	$(".multi_run_tab").removeClass("multi_run_tab_active");
	$(".multi_run_tab[data-run=" + run + "]").addClass("multi_run_tab_active");

	$(".multi_run_chart_area").hide();
	var chartId = "multi_run_chart_" + run;
	var chartEl = document.getElementById(chartId);
	if (chartEl) {
		$(chartEl).show();
	}

	if (traces.length) {
		var layout = get_plotly_layout(language[lang]["epochs"], "Loss");
		layout.height = 450;
		layout.autosize = true;
		Plotly.newPlot(chartId, traces, layout, { responsive: true });
	}

	restore_multi_run_weights(run);
	l("[multi-run] Restored weights and chart for run " + run);
}

async function check_signal_flow() {
	if (!model || !model.layers || !model.layers.length) {
		wrn("[check_signal_flow] No model available.");
		return;
	}

	var inputShape = model.input.shape.slice(1); // remove batch dim
	var sampleInput;

	try {
		sampleInput = tf.randomNormal([1, ...inputShape]);
	} catch (e) {
		wrn("[check_signal_flow] Could not create sample input: " + e);
		return;
	}

	var allDead = false;

	for (var i = 0; i < model.layers.length; i++) {
		var layer = model.layers[i];
		var layerName = layer.name;

		try {
			var intermediateModel = tf.model({
				inputs: model.input,
				outputs: layer.getOutputAt(0)
			});

			var output = intermediateModel.predict(sampleInput);
			var data = output.dataSync();

			var total = data.length;
			var zeros = 0;
			var maxAbs = 0;
			var sum = 0;
			var hasNaN = false;
			var hasInf = false;

			for (var j = 0; j < total; j++) {
				var val = data[j];
				if (isNaN(val)) { hasNaN = true; continue; }
				if (!isFinite(val)) { hasInf = true; continue; }
				var absVal = Math.abs(val);
				if (val === 0) zeros++;
				if (absVal > maxAbs) maxAbs = absVal;
				sum += absVal;
			}

			var zeroPct = ((zeros / total) * 100).toFixed(1);
			var mean = (sum / total);

			if (hasNaN) {
				err(`🔴 LAYER ${i} ("${layerName}"): Contains NaN values! Model is broken.`);
			} else if (hasInf) {
				err(`🔴 LAYER ${i} ("${layerName}"): Contains Infinity! Exploding activations.`);
			} else if (maxAbs === 0) {
				err(`🔴 DEAD SIGNAL at layer ${i} ("${layerName}"): ALL ${total} activations are ZERO.`);
				allDead = true;
			} else if (parseFloat(zeroPct) > 95) {
				wrn(`🟡 NEARLY DEAD layer ${i} ("${layerName}"): ${zeroPct}% zeros (${zeros}/${total}), max=${maxAbs.toExponential(2)}, mean=${mean.toExponential(2)}`);
			} else if (maxAbs > 1e6) {
				wrn(`🟡 EXPLODING layer ${i} ("${layerName}"): max=${maxAbs.toExponential(2)}, mean=${mean.toExponential(2)}`);
			} else {
				l(`✅ Layer ${i} ("${layerName}"): ${zeroPct}% zeros, max=${maxAbs.toExponential(2)}, mean=${mean.toExponential(2)}`);
			}

			// ONLY dispose the output tensor, NOT the intermediate model!
			// The intermediate model shares weights with the real model.
			// Disposing it would destroy the real model's kernels.
			output.dispose();
			// DO NOT: intermediateModel.dispose();

		} catch (e) {
			dbg(`[check_signal_flow] Could not check layer ${i} ("${layerName}"): ${e}`);
		}
	}

	sampleInput.dispose();

	if (allDead) {
		wrn("⚠️ SUGGESTION: Your network has dead layers. Try:");
		wrn("   1. Use 'leakyReLU' or 'elu' instead of 'relu'");
		wrn("   2. Use 'heNormal' kernel initializer");
		wrn("   3. Increase the number of filters (currently only 4)");
		wrn("   4. Lower the learning rate");
	}
}

async function gui_in_training (set_started_training=1) {
	if(set_started_training) {
		started_training = true;
	}
	await disable_everything();
	favicon_spinner();
	await write_descriptions();

	await reset_cached_loaded_images();

	if(set_started_training) {
		mark_start_stop_training();
	}
}

async function gui_not_in_training(set_started_training = 1) {
	if (set_started_training) {
		started_training = false;
	}
	reset_start_stop_training_buttons();
	await update_translations();
	favicon_default();

	// Do NOT end the TF scope here — let the caller (train_neural_network)
	// manage scope lifecycle to avoid premature backend invalidation.
	// The scope will be cleaned up in train_neural_network's finally block.

	await enable_everything();
	$(".show_after_training").show();
	$("#program_looks_at_data_span").hide();

	await reset_cached_loaded_images();

	unmark_start_stop_training();
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
	}
}

function get_empty_plotly(name) {
	let key = name.toLowerCase().replace(/\s+/g, "_");
	let obj = {};
	obj[key] = {
		x: [],
		y: [],
		type: get_scatter_type(),
		mode: get_plotly_type(),
		name: name
	};
	return obj;
}

function get_model_fingerprint() {
	try {
		var structure = [];
		var num_of_layers = $(".layer_setting").length;
		for (var i = 0; i < num_of_layers; i++) {
			var type = $($($(".layer_setting")[i]).find(".layer_type")).val();
			if (typeof type !== "undefined" && type) {
				structure.push(type);
			}
		}
		var input_shape = get_input_shape();
		return JSON.stringify({ layers: structure, inputShape: input_shape });
	} catch (e) {
		return null;
	}
}

function save_training_history(epochData, batchData, multiRunResults) {
	training_history_counter++;
	training_history.push({
		label: "#" + training_history_counter,
		epochData: JSON.parse(JSON.stringify(epochData)),
		batchData: JSON.parse(JSON.stringify(batchData)),
		timestamp: Date.now(),
		loss: (epochData["loss"] && epochData["loss"]["y"] && epochData["loss"]["y"].length)
			? epochData["loss"]["y"][epochData["loss"]["y"].length - 1]
			: null,
		fingerprint: last_model_fingerprint,
		multiRunResults: multiRunResults || null
	});
	render_training_history_tabs();
}

function show_training_history_run(idx, showBatch) {
	$(".training_history_tab").removeClass("training_history_tab_active");
	$(".training_history_tab[data-idx=" + idx + "]").addClass("training_history_tab_active");

	$(".training_history_chart_area").hide();
	var chartId = "training_history_chart_" + idx;
	var chartEl = document.getElementById(chartId);
	if (chartEl) {
		$(chartEl).show();
	}

	var entry = training_history[idx];
	if (!entry) return;

	if (entry.multiRunResults) {
		show_multi_run_statistics(entry.multiRunResults);
	} else {
		$("#multi_run_stats").html("").hide();
	}

	var data = showBatch ? entry.batchData : entry.epochData;
	var traces = [];
	Object.keys(data).forEach(function(key) {
		if (data[key].x && data[key].x.length) {
			traces.push(JSON.parse(JSON.stringify(data[key])));
		}
	});

	if (!traces.length) return;

	var xLabel = showBatch ? "Batch" : (typeof language !== "undefined" && language[lang] ? language[lang]["epochs"] : "Epochs");
	var chartContainer = document.getElementById(chartId);
	if (!chartContainer) return;

	try {
		Plotly.newPlot(chartId, traces, get_plotly_layout(xLabel, "Loss"), { responsive: true });
	} catch (e) {
		err("Error rendering training history chart:", e);
	}
}

function toggle_training_history_collapsible() {
	var $header = $("#training_history_tabs .training_history_collapsible_header");
	var $body = $("#training_history_tabs .training_history_collapsible_body");
	var $icon = $header.find(".training_history_collapsible_icon");
	var isCollapsed = $body.hasClass("collapsed");

	if (isCollapsed) {
		$body.removeClass("collapsed").css("max-height", $body[0].scrollHeight + "px").css("opacity", "1");
		$icon.removeClass("collapsed");
		$header.data("expanded", true);
	} else {
		$body.addClass("collapsed").css("max-height", "0").css("opacity", "0");
		$icon.addClass("collapsed");
		$header.data("expanded", false);
	}
}

function render_training_history_tabs() {
	if (training_history.length === 0) {
		$("#training_history_tabs").html("").hide();
		return;
	}

	var wasExpanded = $("#training_history_tabs .training_history_collapsible_header").data("expanded");

	var html = '<div class="training_history_collapsible_header" onclick="toggle_training_history_collapsible()" data-expanded="false">';
	html += '<span class="training_history_collapsible_icon collapsed">&#9660;</span>';
	html += '<span class="TRANSLATEME_training_history"></span>';
	html += '<span style="opacity:0.5; font-size:12px;"> (' + training_history.length + ')</span>';
	html += '</div>';

	html += '<div class="training_history_collapsible_body collapsed">';

	html += '<div class="training_history_tabs">';
	training_history.forEach(function(entry, i) {
		var activeClass = i === training_history.length - 1 ? " training_history_tab_active" : "";
		var lossStr = entry.loss !== null ? entry.loss.toFixed(4) : "?";
		html += '<button class="training_history_tab' + activeClass + '" data-idx="' + i + '">' + entry.label + ' (loss=' + lossStr + ')</button>';
	});
	html += '</div>';

	html += '<div class="training_history_loss_toggle">';
	html += '<button class="training_history_toggle_btn active" data-mode="epoch">Epoch</button>';
	html += '<button class="training_history_toggle_btn" data-mode="batch">Batch</button>';
	html += '</div>';

	training_history.forEach(function(entry, i) {
		var display = i === training_history.length - 1 ? "block" : "none";
		html += '<div id="training_history_chart_' + i + '" class="training_history_chart_area" style="display:' + display + ';"></div>';
	});

	html += '</div>';

	$("#training_history_tabs").html(html).show();

	$(".training_history_tab").on("click", function() {
		var idx = parseInt($(this).data("idx"));
		var activeMode = $(".training_history_toggle_btn.active").data("mode");
		show_training_history_run(idx, activeMode === "batch");
	});

	$(".training_history_toggle_btn").on("click", function() {
		$(".training_history_toggle_btn").removeClass("active");
		$(this).addClass("active");
		var showBatch = $(this).data("mode") === "batch";
		var activeIdx = parseInt($(".training_history_tab_active").data("idx"));
		show_training_history_run(activeIdx, showBatch);
	});

	var lastIdx = training_history.length - 1;
	show_training_history_run(lastIdx, false);

	if (wasExpanded) {
		$("#training_history_tabs .training_history_collapsible_header").data("expanded", false);
		toggle_training_history_collapsible();
	}
}

async function incrementAndReset() {
    const $el = $('input').filter('.input_data.units, .input_data.filters').first();
    if ($el.length === 0) return;

    const originalValue = parseFloat($el.val()) || 0;
    const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

    $el.val(originalValue + 1).trigger('change');

    await wait(1000);

    $el.val(originalValue).trigger('change');
}

async function retrain_neural_network() {
	await incrementAndReset();

	await train_neural_network();
}

async function train_neural_network() {
	reset_math_history();

	if ($($(".train_neural_network_button")[0]).prop("disabled")) {
		err('Cannot train: train_neural_network is disabled.');
		return null;
	}

	$("#canvas_grid_visualization").html("");

	// Ensure backend is ready before starting any scoped operations
	await tf.ready();

	let scopeStarted = false;
	try {
		tf.engine().startScope();
		scopeStarted = true;

		var ret = await _train_neural_network();

		return ret;
	} catch (e) {
		err("[train_neural_network] Unexpected error:", e);
		return null;
	} finally {
		// Only end scope if we started it and it's still active
		if (scopeStarted) {
			try {
				if (tf.engine().state.activeScope !== null) {
					if (typeof xy_data_global !== "undefined" && xy_data_global) {
						if (xy_data_global.x && typeof xy_data_global.x.isDisposed !== "undefined" && !xy_data_global.x.isDisposed) {
							tf.keep(xy_data_global.x);
						}
						if (xy_data_global.y && typeof xy_data_global.y.isDisposed !== "undefined" && !xy_data_global.y.isDisposed) {
							tf.keep(xy_data_global.y);
						}
					}
					tf.engine().endScope();
				}
			} catch (e) {
				console.warn("[train_neural_network] Error ending scope:", e);
			}
		}
	}
}

async function _train_neural_network () {
	var ret = null;

	await wait_for_updated_page(1);

	if(model === null || model === undefined || typeof(model) != "object" || !Object.keys(model).includes("layers")) {
		await gui_not_in_training();

		model = await create_model();
		await compile_model();

		return;
	}

	restart_fcnn(); // await not possible i think

	if(started_training) {
		var spinner = `<div class="spinner"></div> `;
		var stop_overlay = show_overlay("", `<span style="display:flex; align-items:center; gap:0.5ch">${spinner}${language[lang]["preparing_stop_training"]}</span>`);

		function stop_update_step(step_msg) {
			l(step_msg);
			if (stop_overlay) {
				update_overlay_title(stop_overlay, `<span style="display:flex; align-items:center; gap:0.5ch">${spinner}${step_msg}...</span>`);
			}
		}

		stop_update_step(language[lang]["preparing_stop_training"]);
		disable_gradcam_during_training_if_internal_states();

		stop_downloading_data = true;

		stop_update_step(language[lang]["stopping_training"]);
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

		var new_fingerprint = get_model_fingerprint();
		_model_fingerprint_unchanged = (last_model_fingerprint && new_fingerprint && new_fingerprint === last_model_fingerprint);

		if (last_model_fingerprint && new_fingerprint && new_fingerprint !== last_model_fingerprint) {
			training_history = [];
			training_history_counter = 0;
			render_training_history_tabs();
		}
		last_model_fingerprint = new_fingerprint;

		if (!_model_fingerprint_unchanged) {
			training_logs_batch = get_empty_plotly("Loss");
			training_logs_epoch = get_empty_plotly("Loss");
		}

		last_batch_time = 0;

		training_memory_history = get_empty_training_memory_history_plotly();

		reset_gui_before_training();

		$("#percentage").html("");
		$("#percentage").hide();

		var num_runs = get_number_of_runs();
		l("[multi-train] num_runs=" + num_runs + ", mode=" + get_mode() + ", #number_of_runs raw=" + $("#number_of_runs").val());
		if (num_runs > 1 && get_mode() === "expert") {
			l("[multi-train] Dispatching to multi_train_neural_network with " + num_runs + " runs");
			ret = await multi_train_neural_network(num_runs);
		} else {
			l("[multi-train] Dispatching to run_neural_network (single run)"); // await not required here
			ret = await run_neural_network();
		}

		if (training_logs_epoch["loss"] && training_logs_epoch["loss"]["x"] && training_logs_epoch["loss"]["x"].length > 0) {
			save_training_history(training_logs_epoch, training_logs_batch, _last_multi_run_results);
			_last_multi_run_results = null;
		}

		await show_tab_label("predict_tab_label", jump_to_interesting_tab());

		if(got_images_from_webcam) {
			if(cam && !cam.isClosed) {
				await show_webcam();
			}

			await show_webcam();
		}

		await enable_everything();

		await show_prediction(0, 0);
	}

	await write_descriptions();
	await write_model_to_latex_to_page();

	await sleep(1000);
	await wait_for_updated_page(3);

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

async function get_model_data () {
	if(global_model_data) {
		var model_data_tensors = find_tensors_with_is_disposed_internal(global_model_data);
		for (var model_data_tensor_idx = 0; model_data_tensor_idx < model_data_tensors.length; model_data_tensor_idx++) {
			await dispose(model_data_tensors[model_data_tensor_idx]);
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
		validationSplit = parse_float(validationSplit);
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

	for (var optimizer_idx = 0; optimizer_idx < optimizer_data_names.length; optimizer_idx++) {
		var element_name = optimizer_data_names[optimizer_idx] + "_" + optimizer_type;
		var $element_field = $("#" + element_name);
		var element_val = $element_field.val();

		global_model_data[optimizer_data_names[optimizer_idx]] = parse_float(element_val);
	}

	var optimizer_constructors = {
		"adadelta": "adadelta(global_model_data['learningRate'], global_model_data['rho'], global_model_data['epsilon'])",
		"adagrad": "adagrad(global_model_data['learningRate'], global_model_data['initialAccumulatorValue'])",
		"adam": "adam(global_model_data['learningRate'], global_model_data['beta1'], global_model_data['beta2'], global_model_data['epsilon'])",
		"adamax": "adamax(global_model_data['learningRate'], global_model_data['beta1'], global_model_data['beta2'], global_model_data['epsilon'], global_model_data['decay'])",
		"rmsprop": "rmsprop(global_model_data['learningRate'], global_model_data['decay'], global_model_data['momentum'], global_model_data['epsilon'], global_model_data['centered'])",
		"sgd": "sgd(global_model_data['learningRate'])"
	};

	global_model_data["optimizer"] = tidy(() => {
		const optimizer_as_code = "tf.train." + optimizer_constructors[get_optimizer()];
		return eval(optimizer_as_code);
	});

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
		create_loss_landscape();

		_math_interactive_mode_before = _math_interactive_mode;

		if(_math_interactive_mode) {
			toggle_math_interactive_mode();
		}

		confusion_matrix_and_grid_cache = {};
		current_epoch = 0;
		this_training_start_time = Date.now();
		$(".training_performance_tabs").show();

		await show_tab_label("training_tab_label", jump_to_interesting_tab());

		$("#network_has_seen_msg").hide();

		await visualize_train();
		await confusion_matrix_to_page();

		confusion_matrix_and_grid_cache = {};

		history_of_weights_for_loss_landscape = [];

		show_or_hide_beginner_or_expert_mode_stuff();

		gradientFlowToSummary();

		// GradientFlowHeatmap.reset();

		gradientFlow.onTrainingStart();
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

		show_or_hide_beginner_or_expert_mode_stuff();
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

		//visualizeModelOrganism(model, "neural_organism");

		show_or_hide_beginner_or_expert_mode_stuff();

		TopologicalAnalyzer.update();
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
			last_batch_time = current_time;
		}

		var this_plot_data = [training_logs_batch["loss"]];

		if(!last_batch_plot_time || (Date.now() - last_batch_plot_time) > (parse_int($("#min_time_between_batch_plots").val()) * 1000)) { // Only plot every min_time_between_batch_plots seconds
			const plot_func = (batchNr === 1) ? Plotly.newPlot : Plotly.update;

			last_batch_plot_time = Date.now();
		}

		if(!is_hidden_or_has_hidden_parent($("#predict_tab"))) {
			if($("#predict_own_data").val()) {
				await predict($("#predict_own_data").val());
			}
			await show_prediction(0, 1);
			if(input_shape_is_image()) {
				await repredict();
			}
		}

		confusion_matrix_and_grid_cache = {};

		await restart_fcnn();

		current_loss_value = logs.loss;

		//history_of_weights_for_loss_landscape.push(extract_flat_weights_from_model(model));

		show_or_hide_beginner_or_expert_mode_stuff();
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
					"mode": get_plotly_type(),
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

		try {
			$("#plotly_epoch_history").parent().show();
			$("#plotly_epoch_history").show();
			if(epochNr == 1) {
				Plotly.newPlot('plotly_epoch_history', this_plot_data, get_plotly_layout(language[lang]["epochs"], "Loss"));
			} else {
				Plotly.update('plotly_epoch_history', this_plot_data, get_plotly_layout(language[lang]["epochs"], "Loss"));
			}
		} catch (e) {
			err("Error trying to write plotly_epoch_history plot!");
		}

		await visualize_train();

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

		await confusion_matrix_to_page();

		confusion_matrix_and_grid_cache = {};

		if (enabled_saving_history()) {
			const latex = model_to_latex();

			if(latex) {
				math_history.push(latex);

				create_math_slider();
			}
		}

		create_weight_surfaces();

		await plot_model_plot(true);

		current_loss_value = logs.loss;

		reset_neuron_outputs();

		//await visualizeModelBends();

		//visualizeModelOrganism(model, "neural_organism");

		show_or_hide_beginner_or_expert_mode_stuff();

		gradientFlow.onEpochBoundary();
		gradientFlowToSummary();
	};

	callbacks["onTrainEnd"] = async function () {
		confusion_matrix_and_grid_cache = {};
		favicon_default();
		await write_model_to_latex_to_page();
		set_document_title(original_title);
		await restart_fcnn();

		await visualize_train();

		reset_tiny_graph(1);
		$("#network_has_seen_msg").hide();

		await confusion_matrix_to_page();

		confusion_matrix_and_grid_cache = {};

		_math_interactive_mode = _math_interactive_mode_before;

		if(_math_interactive_mode) {
			toggle_math_interactive_mode();
		}

		show_or_hide_beginner_or_expert_mode_stuff();

		gradientFlow.onTrainingEnd();
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

		for (let x_idx = 0; x_idx < x.length; x_idx++) {
			const xCoord = x_idx * xScale;
			const yCoord = h - (y[x_idx] - minY) * yScale;
			//log("x, y:", xCoord, yCoord);
			//log("h, y, y[x_idx], minY, yScale:", h, y, y[x_idx], minY, yScale, "<<<<<<");
			if (x_idx === 0) {
				ctx.moveTo(xCoord, yCoord);
			} else {
				ctx.lineTo(xCoord, yCoord);
			}
		}

		ctx.stroke();

		if(y_val.length) {
			ctx.beginPath();
			ctx.strokeStyle = "orange";
			for (let y_idx = 0; y_idx < y_val.length; y_idx++) {
				const xCoord = y_idx * xScale;
				const yCoord = h - (y_val[y_idx] - minY) * yScale;
				if (y_idx === 0) {
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

	for (var layer_idx = 0; layer_idx < model?.layers?.length; layer_idx++) {
		if(model?.layers[layer_idx] && "original_apply" in model?.layers[layer_idx]) {
			try {
				eval("model.layers[" + layer_idx + "].apply = model.layers[" + layer_idx + "].original_apply;\n");
			} catch (e) {
				err(e);
			}
		}
	}

}

async function get_x_and_y_or_die_in_case_of_error (recursive=0) {
	await update_translations();

	var x_and_y = false;

	try {
		var error_string = "";
		write_model_summary_wait();

		await disable_everything();
		l(language[lang]["getting_data"] + "...");
		x_and_y = await get_x_and_y();
		l(language[lang]["got_data"]);
	} catch (e) {
		if(Object.keys(e).includes("message")) {
			e = e.message;
		}

		if(("" + e).includes("n is undefined") && recursive == 0) {
			wrn("[get_x_and_y_or_die_in_case_of_error] Error '" + e + "'. Trying to get xs and ys again...");
			return await get_x_and_y_or_die_in_case_of_error(recursive + 1);
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
			err(e);
			log("============================");
			console.log(e);
			log("============================");
			header("ERROR END");
		}
		favicon_default();
		await write_descriptions();
		reset_start_stop_training_buttons();
		await update_translations();
		started_training = false;
		return false;
	}

	return x_and_y;
}

function reset_start_stop_training_buttons () {
	$(".train_neural_network_button").html("<span class='TRANSLATEME_start_training'></span>").removeClass("stop_training").addClass("start_training");

	enable_train_if_has_custom_images();
}

async function _show_or_hide_simple_visualization (fit_data, x_and_y) {
	try {
		const x_shape = get_shape_from_array_or_tensor(x_and_y["x"]);
		if(!x_shape) {
			err(`_show_or_hide_simple_visualization: Could not get x_shape!`);
			return;
		}

		const y_shape = get_shape_from_array_or_tensor(x_and_y["y"]);
		if(!y_shape) {
			err(`_show_or_hide_simple_visualization: Could not get y_shape!`);
			return;
		}

		var x_shape_is_ok = x_shape.length == 2 && x_shape[1] == 1;
		var y_shape_is_ok = y_shape.length == 2 && y_shape[1] == 1;
		var model_shape_is_ok = model?.input?.shape.length == 2 && model?.input?.shape[1] == 1;

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

			var x_data_json = JSON.stringify(array_sync(x_and_y["x"]));
			var y_data_json = JSON.stringify(array_sync(x_and_y["y"]));

			var new_on_batch_end_callback = await get_live_tracking_on_batch_end("model", parse_int($("#epochs").val()), x_data_json, y_data_json, false, "simplest_training_data_visualization");

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
				dbg(`${language[lang]["x_shape_is_wrong_for_simple_visualization"]}: [${x_shape.join(", ")}]`);
				shown_warnings = true;
			}

			if(!y_shape_is_ok) {
				dbg(`${language[lang]["y_shape_is_wrong_for_simple_visualization"]}: [${y_shape.join(", ")}]`);
				shown_warnings = true;
			}

			if(!model_shape_is_ok) {
				dbg(`${language[lang]["model_shape_is_wrong_for_simple_visualization"]}: ${model_shape_to_string(model?.input?.shape)}`);
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
		err("Error:", error.message);
		// Handle the error or rethrow it based on your requirements
	}
}

function _clear_plotly_epoch_history () {
	$("#plotly_epoch_history").parent().hide();
	$("#plotly_epoch_history").html("");
}

async function _get_fit_data (x_and_y) {
	var fit_data = true;

	try {
		await add_layer_debuggers();

		fit_data = await get_fit_data();

		await _show_or_hide_simple_visualization(fit_data, x_and_y);

		//await visualizeModelBends();

		await show_tab_label("training_tab_label", jump_to_interesting_tab());

	} catch (e) {
		await write_error_and_reset(e, null, null);
		fit_data = false;
	}

	return fit_data;
}

async function duplicate_last_layer () {
	dbg(language[lang]["adding_layer"]);

	var $last_layer = $(".add_layer")[get_last_layer()];

	dbg(language[lang]["awaiting_disable_invalid_layers_event"]); // await

	enable_all_layer_types();

	var start_layers = model?.layers?.length;
	dbg(language[lang]["clicking_on_this_item_for_layer_duplication"], $last_layer);
	$last_layer.click();

	while (model?.layers?.length - start_layers <= 0) {
		dbg(sprintf(language[lang]["waiting_until_model_layers_length_m_minus_start_layers_n_is_greater_than_zero"], model?.layers?.length, start_layers));
		await delay(200);
	}

	await delay(1000);

	if(mode == "beginner") {
		await disable_invalid_layers_event(new Event("duplicate_last_layer"), $last_layer);
	}
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

	while (units != $units.val()) {
		dbg(`${language[lang]["waiting_for_set_dense_layer_units"]}(${nr}, ${units})`);
		await delay(100);
	}
	await delay(500);
}

function get_last_layer (minus=1) {
	return $(".layer_type").length - minus;
}

async function repair_output_shape (tries_classification_but_receives_other=0) {
	await compile_model_if_not_defined();

	try {
		var last_layer_output_shape = get_last_layer_output_shape();

		if(last_layer_output_shape && last_layer_output_shape.length == 2) {
			var num_categories = labels.length;
			if(!num_categories) {
				return false;
			}
			if(last_layer_output_shape[1] != num_categories) {
				$($(".glass_box")[model?.layers?.length - 1]).find(".units").val(labels.length);
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

					await repair_output_layer_and_train(ll);

					if(change_to_beginner) {
						mode = "beginner";
					}

					is_repairing_output_shape = false;

					return true;
				}

				return false;
			}
		}
	} catch (e) {
		handle_repair_output_shape_error(e);
	}

	return false;
}

async function repair_output_layer_and_train(ll) {
	await (async () => {
		try {
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
}

function handle_repair_output_shape_error (e) {
	if(Object.keys(e).includes("message")) {
		e = e.message;
	}

	if(("" + e).includes("model.layers is undefined")) {
		wrn("[repair_output_shape] model.layers is undefined");
	} else {
		throw new Error(e);
	}
}

function add_stop_training_class_to_train_button () {
	$(".train_neural_network_button").html("<span class='TRANSLATEME_stop_training'></span>").removeClass("start_training").addClass("stop_training");

	enable_train_if_has_custom_images();
}

function reset_predict_container_after_training() {
	$("#predictcontainer").show();
	$("#predict_error").hide().html("");
}

function get_last_layer_output_shape() {
	if (typeof model === "undefined" || !model || !Array.isArray(model?.layers)) {
		dbg("Model is undefined or has no layers.");
		return null;
	}

	const lastIndex = typeof get_last_layer === "function" ? get_last_layer() : null;
	if (lastIndex === null || lastIndex < 0 || !model?.layers?.length || lastIndex >= model?.layers?.length) {
		err("Invalid last layer index.");
		return null;
	}

	const lastLayer = model?.layers[lastIndex];
	if (!lastLayer || !lastLayer.output || !lastLayer.output.shape) {
		err("Last layer has no output shape.");
		return null;
	}

	return lastLayer.output.shape;
}

function get_first_layer_input_shape() {
	if (typeof model === "undefined" || !model || !Array.isArray(model?.layers) || !model?.layers?.length) {
		dbg("Model is undefined or has no layers.");
		return null;
	}

	const firstLayer = model?.layers[0];
	if (!firstLayer || !firstLayer.input || !firstLayer.input.shape) {
		err("First layer has no input shape.");
		return null;
	}

	return firstLayer.input.shape;
}

function validate_model_io_shapes(x_shape, y_shape) {
	const input_shape = get_first_layer_input_shape();
	const output_shape = get_last_layer_output_shape();

	if (!Array.isArray(x_shape) || !Array.isArray(y_shape)) {
		err("x_shape or y_shape is not an array.");
		return false;
	}

	if (!Array.isArray(input_shape) || !Array.isArray(output_shape)) {
		err("Model input/output shape could not be determined.");
		return false;
	}

	// Prüfe Dimensionen
	if (x_shape.length !== input_shape.length) {
		err(`Input shape mismatch: x has ${x_shape.length} dims, model expects ${input_shape.length}.`);
		return false;
	}

	if (y_shape.length !== output_shape.length) {
		err(`Output shape mismatch: y has ${y_shape.length} dims, model expects ${output_shape.length}.`);
		return false;
	}

	// Vergleiche jede Dimension, außer wenn input/output null für Batchsize
	for (let i = 0; i < input_shape.length; i++) {
		const x_dim = x_shape[i];
		const model_dim = input_shape[i];

		if (model_dim !== null && x_dim !== model_dim) {
			err(`Input dimension ${i} mismatch: x has ${x_dim}, model expects ${model_dim}.`);
			return false;
		}
	}

	for (let i = 0; i < output_shape.length; i++) {
		const y_dim = y_shape[i];
		const model_dim = output_shape[i];

		if (model_dim !== null && y_dim !== model_dim) {
			err(`Output dimension ${i} mismatch: y has ${y_dim}, model expects ${model_dim}.`);
			return false;
		}
	}

	return true;
}

function warn_if_not_tensor (val, name) {
	if (!(val instanceof tf.Tensor)) {
		wrn(`${name} is not a Tensor, converting automatically`);
	}
}

function warn_if_not_tensors(x, y) {
	warn_if_not_tensor(x, "x");
	warn_if_not_tensor(y, "y");
}

async function fit_model(x_and_y) {
	try {
		const fit_data = await _get_fit_data(x_and_y);

		await tf.ready();
		await compile_model();

		// Verify model is valid after compilation
		if (!model || !model.optimizer) {
			throw new Error("[fit_model] Model or optimizer is null/undefined after await compile_model(). Backend may not be initialized.");
		}

		l(language[lang]["started_training"]);

		let x = x_and_y["x"];
		let y = x_and_y["y"];

		warn_if_not_tensors(x, y);

		// Convert to tensors if they aren't already, ensuring they are
		// bound to the current active backend
		if (!is_tensor(x)) {
			x = tf.tensor(Array.isArray(x) ? x : array_sync(x));
		}
		if (!is_tensor(y)) {
			y = tf.tensor(Array.isArray(y) ? y : array_sync(y));
		}

		const x_shape = get_shape_from_array_or_tensor(x);
		const y_shape = get_shape_from_array_or_tensor(y);

		dbg(`Starting model-fit. Shapes: [${x_shape.join(", ")}] -> [${y_shape.join(", ")}]`);

		validate_model_io_shapes(x_shape, y_shape);

		await wait_for_updated_page(2);

		const h = await model.fit(x, y, fit_data);

		await nextFrame();
		l(language[lang]["finished_training"]);

		assert(typeof h === "object", "history object is not of type object");
		model_is_trained = true;
		reset_predict_container_after_training();

		await dispose(fit_data);
		return h;
	} catch (_err) {
		err("[fit_model] Training failed:", _err);
		throw _err;
	}
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

	if(!model?.layers?.length) {
		err(`[run_neural_network] ${language[lang]["no_layers"]}`);
		return;
	}

	await prepare_gui_for_training();

	_set_apply_to_original_apply();

	await check_signal_flow();

	l(language[lang]["getting_data"]);
	var x_and_y = await get_x_and_y_or_die_in_case_of_error();

	if(x_and_y === false) {
		err(`run_neural_network: Error trying to get x_and_y, it was false`);
	}

	await show_tab_label("training_tab_label", jump_to_interesting_tab());

	if(!x_and_y) {
		err(`[run_neural_network] ${language[lang]["could_not_get_xs_and_xy"]}`);
		return;
	}

	var repaired = false;

	if(started_training) {
		remove_overlay();

		await set_input_shape_from_xs(x_and_y);
		prepare_site_for_training();
		await compile_model_if_not_defined();
		await go_to_training_tab_label();

		["x", "y"].forEach(tensor_name => {
			if(!is_tensor(x_and_y[tensor_name])) {
				if(Array.isArray(x_and_y[tensor_name])) {
					x_and_y[tensor_name] = tensor(x_and_y[tensor_name]);
				} else {
					err(`run_neural_network: ${tensor_name} is not a tensor, nor is it an array.`, x_and_y[tensor_name]);
				}
			}
		});

		try {
			xy_data_global = x_and_y;
			ret = await fit_model(x_and_y);
		} catch (e) {
			repaired = await handle_model_fit_error(e, repaired, recursive);
		}

		show_input_shape_repaired_message(repaired);
		await enable_everything();
		hide_training_progress_bar();
	} else {
		remove_overlay();
	}

	x_and_y = await reset_stuff_after_training(x_and_y);

	return ret;
}

function get_number_of_runs() {
	var mode = get_mode();
	l("[get_number_of_runs] mode=" + mode);
	if (mode !== "expert") {
		l("[get_number_of_runs] Not expert mode, returning 1");
		return 1;
	}
	var raw = $("#number_of_runs").val();
	var val = parse_int(raw);
	l("[get_number_of_runs] raw=" + raw + ", parsed=" + val);
	if (isNaN(val) || val < 1) val = 1;
	if (val > 50) val = 50;
	l("[get_number_of_runs] returning " + val);
	return val;
}

function get_minimal_callbacks() {
	return {
		onTrainBegin: async function() {
			current_epoch = 0;
			this_training_start_time = Date.now();
		},
		onBatchBegin: async function() {
			if (!started_training) {
				model.stopTraining = true;
			}
		},
		onEpochBegin: async function() {
			confusion_matrix_and_grid_cache = {};
			current_epoch++;
			var max_number_epochs = get_epochs();
			var current_time = Date.now();
			var epoch_time = (current_time - this_training_start_time) / current_epoch;
			var epochs_left = max_number_epochs - current_epoch;
			var seconds_left = parse_int(Math.ceil((epochs_left * epoch_time) / 1000) / 5) * 5;
			var time_estimate = human_readable_time(seconds_left);

			show_training_progress_bar();
			set_document_title("[" + current_epoch + "/" + max_number_epochs + ", " + time_estimate + "] asanAI");

			var percentage = parse_int((current_epoch / max_number_epochs) * 100);
			$("#training_progressbar>div").css("width", percentage + "%");
		},
		onBatchEnd: async function(batch, logs) {
			current_loss_value = logs.loss;
		},
		onEpochEnd: async function(batch, logs) {
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
						"mode": get_plotly_type(),
						"name": "val_loss"
					};
				}

				training_logs_epoch[other_key_name]["x"].push(epochNr);
				training_logs_epoch[other_key_name]["y"].push(logs[other_key_name]);
				training_logs_epoch[other_key_name]["mode"] = get_plotly_type();
				training_logs_epoch[other_key_name]["name"] = other_key_name;

				this_plot_data.push(training_logs_epoch[other_key_name]);
			}

			try {
				$("#plotly_epoch_history").parent().show();
				$("#plotly_epoch_history").show();
				if(epochNr == 1) {
					Plotly.newPlot('plotly_epoch_history', this_plot_data, get_plotly_layout(language[lang]["epochs"], "Loss"));
				} else {
					Plotly.update('plotly_epoch_history', this_plot_data, get_plotly_layout(language[lang]["epochs"], "Loss"));
				}
			} catch (e) {}

			current_loss_value = logs.loss;
		},
		onTrainEnd: async function() {}
	};
}

function calculate_stats(values) {
	var n = values.length;
	var sum = values.reduce((a, b) => a + b, 0);
	var mean = sum / n;
	var variance = values.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / n;
	var std = Math.sqrt(variance);
	var min = Math.min(...values);
	var max = Math.max(...values);
	var cv = mean !== 0 ? (std / Math.abs(mean)) * 100 : 0;
	return { mean: mean, std: std, min: min, max: max, cv: cv, n: n };
}

function _build_multi_run_stats_html(results, losses, valLosses, accs) {
	var lossStats = calculate_stats(losses);

	var html = '<div class="multi_run_stats_container">';
	html += '<h3><span class="TRANSLATEME_multi_run_statistics"></span></h3>';
	html += '<p><span class="TRANSLATEME_noise_analysis_intro"></span></p>';

	html += '<table class="multi_run_stats_table">';
	html += '<tr><th></th>';
	html += '<th><span class="TRANSLATEME_mean"></span></th>';
	html += '<th><span class="TRANSLATEME_min"></span></th>';
	html += '<th><span class="TRANSLATEME_max"></span></th>';
	html += '<th><span class="TRANSLATEME_best_run"></span></th>';
	html += '<th><span class="TRANSLATEME_worst_run"></span></th>';
	html += '</tr>';

	html += '<tr><td><strong><span class="TRANSLATEME_loss"></span></strong></td>';
	html += '<td>' + lossStats.mean.toFixed(4) + '</td>';
	html += '<td>' + lossStats.min.toFixed(4) + '</td>';
	html += '<td>' + lossStats.max.toFixed(4) + '</td>';
	html += '<td>#' + (losses.indexOf(lossStats.min) + 1) + '</td>';
	html += '<td>#' + (losses.indexOf(lossStats.max) + 1) + '</td>';
	html += '</tr>';

	if (valLosses.length > 0) {
		var valLossStats = calculate_stats(valLosses);
		html += '<tr><td><strong>Val Loss</strong></td>';
		html += '<td>' + valLossStats.mean.toFixed(4) + '</td>';
		html += '<td>' + valLossStats.min.toFixed(4) + '</td>';
		html += '<td>' + valLossStats.max.toFixed(4) + '</td>';
		html += '<td>#' + (valLosses.indexOf(valLossStats.min) + 1) + '</td>';
		html += '<td>#' + (valLosses.indexOf(valLossStats.max) + 1) + '</td>';
		html += '</tr>';
	}

	if (accs.length > 0) {
		var accStats = calculate_stats(accs);
		html += '<tr><td><strong><span class="TRANSLATEME_accuracy"></span></strong></td>';
		html += '<td>' + (accStats.mean * 100).toFixed(1) + '%</td>';
		html += '<td>' + (accStats.min * 100).toFixed(1) + '%</td>';
		html += '<td>' + (accStats.max * 100).toFixed(1) + '%</td>';
		html += '<td>#' + (accs.indexOf(accStats.max) + 1) + '</td>';
		html += '<td>#' + (accs.indexOf(accStats.min) + 1) + '</td>';
		html += '</tr>';
	}

	html += '</table>';

	var noiseThresholdHigh = 20;
	var noiseThresholdMedium = 5;
	var noiseClass;
	if (lossStats.cv > noiseThresholdHigh) {
		noiseClass = "noise_high";
	} else if (lossStats.cv > noiseThresholdMedium) {
		noiseClass = "noise_medium";
	} else {
		noiseClass = "noise_low";
	}

	html += '<div class="noise_level ' + noiseClass + '">';
	html += '<strong><span class="TRANSLATEME_noise_level"></span>:</strong> <span class="TRANSLATEME_' + noiseClass + '"></span>';
	html += '</div>';

	if (losses.length >= 6) {
		html += '<div id="multi_run_boxplot" style="margin: 12px 0;"></div>';
	}

	html += '<h4><span class="TRANSLATEME_number_of_runs"></span></h4>';
	html += '<table class="multi_run_stats_table multi_run_detail">';
	html += '<tr><th><span class="TRANSLATEME_run"></span></th><th><span class="TRANSLATEME_loss"></span></th>';
	if (valLosses.length > 0) {
		html += '<th>Val Loss</th>';
	}
	if (accs.length > 0) {
		html += '<th><span class="TRANSLATEME_accuracy"></span></th>';
	}
	html += '</tr>';

	var minLoss = Math.min(...losses);
	var maxLoss = Math.max(...losses);

	results.forEach(function(r, i) {
		var lastLoss = r.history.loss[r.history.loss.length - 1];
		var rowClass = "";
		if (lastLoss === minLoss) rowClass = "best_run_row";
		else if (lastLoss === maxLoss) rowClass = "worst_run_row";

		html += '<tr class="' + rowClass + '">';
		html += '<td>' + (i + 1) + '</td>';
		html += '<td>' + lastLoss.toFixed(4) + '</td>';
		if (valLosses.length > 0 && r.history.val_loss) {
			var lastValLoss = r.history.val_loss[r.history.val_loss.length - 1];
			html += '<td>' + lastValLoss.toFixed(4) + '</td>';
		}
		if (accs.length > 0) {
			var key = r.history.acc ? "acc" : "accuracy";
			if (r.history[key]) {
				var lastAcc = r.history[key][r.history[key].length - 1];
				html += '<td>' + (lastAcc * 100).toFixed(1) + '%</td>';
			} else {
				html += '<td>-</td>';
			}
		}
		html += '</tr>';
	});

	html += '</table>';

	var lastRun = results.length;
	html += '<div class="multi_run_tabs">';
	results.forEach(function(r, i) {
		var runNr = i + 1;
		var activeClass = runNr === lastRun ? " multi_run_tab_active" : "";
		var lossVal = r.history.loss[r.history.loss.length - 1].toFixed(4);
		html += '<button class="multi_run_tab' + activeClass + '" data-run="' + runNr + '">#' + runNr + ' (' + lossVal + ')</button>';
	});
	html += '</div>';

	results.forEach(function(r, i) {
		var runNr = i + 1;
		var display = runNr === lastRun ? "block" : "none";
		html += '<div id="multi_run_chart_' + runNr + '" class="multi_run_chart_area" style="display:' + display + ';"></div>';
	});

	html += '</div>';
	return html;
}

function _render_multi_run_boxplot(losses, valLosses) {
	var boxTraces = [];

	boxTraces.push({
		x: losses,
		type: "box",
		name: language[lang]["loss"],
		boxpoints: "all",
		jitter: 0.3,
		pointpos: -1.5,
		orientation: "h"
	});

	if (valLosses.length >= 6) {
		boxTraces.push({
			x: valLosses,
			type: "box",
			name: "Val Loss",
			boxpoints: "all",
			jitter: 0.3,
			pointpos: 1.5,
			orientation: "h"
		});
	}

	var boxLayout = {
		paper_bgcolor: "rgba(0, 0, 0, 0)",
		plot_bgcolor: "rgba(0, 0, 0, 0)",
		font: { family: "Arial, Helvetica, sans-serif", size: 14, color: "#7f7f7f" },
		margin: { l: 70, r: 30, b: 40, t: 30 },
		xaxis: {
			title: { text: language[lang]["loss"], font: { size: 14, color: "#7f7f7f" } },
			showline: false,
			showgrid: true,
			gridcolor: "#ccc"
		},
		showlegend: false,
		height: 100 + (valLosses.length >= 6 ? 80 : 0)
	};

	Plotly.newPlot("multi_run_boxplot", boxTraces, boxLayout, { responsive: true });
}

function show_multi_run_statistics(results) {
	var losses = results.map(function(r) {
		var lastIdx = r.history.loss.length - 1;
		return r.history.loss[lastIdx];
	});

	var valLosses = results.map(function(r) {
		if (!r.history.val_loss) return null;
		var lastIdx = r.history.val_loss.length - 1;
		return r.history.val_loss[lastIdx];
	}).filter(function(v) { return v !== null; });

	var accs = results.map(function(r) {
		if (!r.history.acc && !r.history.accuracy) return null;
		var key = r.history.acc ? "acc" : "accuracy";
		var lastIdx = r.history[key].length - 1;
		return r.history[key][lastIdx];
	}).filter(function(v) { return v !== null; });

	var html = _build_multi_run_stats_html(results, losses, valLosses, accs);

	$("#multi_run_stats").html(html).show();
	update_translations();

	if (losses.length >= 6) {
		_render_multi_run_boxplot(losses, valLosses);
	}

	current_multi_run = results.length;

	$(".multi_run_tab").on("click", function() {
		var run = parseInt($(this).data("run"));
		show_multi_run_run_chart(run);
	});

	show_multi_run_run_chart(current_multi_run);
}

async function multi_train_neural_network(num_runs) {
	var ret = null;

	if (!model) {
		err("[multi_train_neural_network] " + language[lang]["no_model_defined"]);
		return null;
	}

	if (!model?.layers?.length) {
		err("[multi_train_neural_network] " + language[lang]["no_layers"]);
		return null;
	}

	await prepare_gui_for_training();
	_set_apply_to_original_apply();

	await check_signal_flow();

	l(language[lang]["getting_data"]);
	var x_and_y = await get_x_and_y_or_die_in_case_of_error();

	if (x_and_y === false) {
		err("multi_train_neural_network: Error trying to get x_and_y, it was false");
	}

	await show_tab_label("training_tab_label", jump_to_interesting_tab());

	if (!x_and_y) {
		err("[multi_train_neural_network] " + language[lang]["could_not_get_xs_and_xy"]);
		return null;
	}

	var results = [];
	var epochs = get_epochs();
	var batchSize = get_batch_size();
	var validationSplit = parse_int($("#validationSplit").val()) / 100;
	var shuffle = $("#shuffle_before_each_epoch").is(":checked");

	multi_run_data = {};
	current_multi_run = 0;

	for (var run = 1; run <= num_runs; run++) {
		l("[multi-train] === Starting run " + run + "/" + num_runs + " ===");

		multi_update_step(language[lang]["run_x_of_y"] + " " + run + "/" + num_runs);

		multi_run_data[run] = { weights: null, plotData: null };

		training_logs_epoch = get_empty_plotly("Loss");
		training_logs_batch = get_empty_plotly("Loss");
		last_batch_plot_time = false;

		try {
			if (run > 1) {
				l("[multi-train] run " + run + ": reinitializing weights with fresh random values");
				model.layers.forEach(function(layer) {
					var currentWeights = layer.getWeights();
					if (currentWeights.length === 0) return;
					var newWeights = currentWeights.map(function(w) {
						return tf.initializers.glorotUniform().apply(w.shape);
					});
					layer.setWeights(newWeights);
				});
				l("[multi-train] run " + run + ": weights reinitialized, layers=" + (model?.layers?.length || 0));
			}

			await set_input_shape_from_xs(x_and_y);
			prepare_site_for_training();
			await go_to_training_tab_label();

			["x", "y"].forEach(function(tensor_name) {
				if (!is_tensor(x_and_y[tensor_name])) {
					if (Array.isArray(x_and_y[tensor_name])) {
						x_and_y[tensor_name] = tensor(x_and_y[tensor_name]);
					} else {
						err("multi_train_neural_network: " + tensor_name + " is not a tensor, nor is it an array.", x_and_y[tensor_name]);
					}
				}
			});

			xy_data_global = x_and_y;

			var fit_data;
			if (run < num_runs) {
				l("[multi-train] run " + run + ": building minimal fit_data (intermediate run)");
				fit_data = {
					validationSplit: validationSplit,
					batchSize: batchSize,
					epochs: epochs,
					shuffle: shuffle,
					verbose: 0,
					callbacks: get_minimal_callbacks(),
					yieldEvery: "batch"
				};
				await compile_model();
			} else {
				l("[multi-train] run " + run + ": building full fit_data (last run)");
				await add_layer_debuggers();
				fit_data = await get_fit_data();
				await compile_model();
			}

			if (!fit_data) {
				err("[multi_train_neural_network] fit_data is false for run " + run);
				continue;
			}

			l("[multi-train] run " + run + ": starting model.fit, epochs=" + fit_data.epochs + ", batchSize=" + fit_data.batchSize);
			await wait_for_updated_page(2);

			remove_overlay();

			const h = await model.fit(x_and_y.x, x_and_y.y, fit_data);

			l("[multi-train] run " + run + ": model.fit completed, final loss=" + (h.history.loss ? h.history.loss[h.history.loss.length - 1] : "N/A"));
			assert(typeof h === "object", "history object is not of type object");
			model_is_trained = true;
			reset_predict_container_after_training();

			save_multi_run_weights(run);

			multi_run_data[run].plotData = JSON.parse(JSON.stringify(training_logs_epoch));
			l("[multi-train] run " + run + ": saved weights and plot data");

			results.push({ run: run, history: h.history });

			ret = h;
		} catch (e) {
			err("[multi-train] Training failed on run " + run + ":", e);
		}
	}

	l("[multi-train] All " + num_runs + " runs completed. Results: " + results.length);

	_last_multi_run_results = results;
	show_multi_run_statistics(results);

	show_input_shape_repaired_message(false);
	await enable_everything();
	hide_training_progress_bar();

	x_and_y = await reset_stuff_after_training(x_and_y);

	return ret;
}

async function reset_stuff_after_training (x_and_y) {
	x_and_y = await reset_data_after_training(x_and_y);

	show_last_training_time_log();

	await gui_not_in_training();

	return x_and_y;
}

function prepare_site_for_training() {
	if (!_model_fingerprint_unchanged) {
		_clear_plotly_epoch_history();
	}
}

async function set_input_shape_from_xs(x_and_y) {
	return await set_input_shape("[" + x_and_y["x"].shape.slice(1).join(", ") + "]");
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
	} else if (("" + e).includes("target expected a batch of elements where each example has shape")) {
		repaired = await try_repair_and_rerun_if_classification(repaired, e, recursive);
	}

	reset_tiny_graph();

	return repaired;
}

async function try_repair_and_rerun_if_classification (repaired, e, recursive) {
	if(is_classification && get_last_layer_activation_function() == "softmax") {
		try {
			await set_new_loss_and_metric_if_different("categoricalCrossentropy");

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
		await write_error(e, null, null);
	}

	return repaired;
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

async function reset_data_after_training(x_and_y) {
	/*
	await unset_x_and_y(x_and_y)

	await reset_data();

	await dispose_global_x_and_y()

	return null;
	*/

	return x_and_y;
}

async function dispose_global_x_and_y() {
	await dispose(global_x, global_y);
}

async function unset_x_and_y(x_and_y) {
	try {
		if (x_and_y && Object.keys(x_and_y).includes("x") && x_and_y["x"]) {
			await dispose(x_and_y["x"]);
		}

		if (x_and_y && Object.keys(x_and_y).includes("y") && x_and_y["y"]) {
			await dispose(x_and_y["y"]);
		}
	} catch (e) {
		err(e);
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

function get_canvasses(numCategories, _height) {
	var canvasses = [];

	for (let numCategories_idx = 0; numCategories_idx < numCategories; numCategories_idx++) {
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

		canvasses.push(canvas);
	}

	return canvasses;
}

function draw_category_to_training_visualization(canvasses, numCategories, category_overview, margin) {
	for (let canvasIndex = 0; canvasIndex < numCategories; canvasIndex++) {
		var canvas = canvasses[canvasIndex];
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
}

function draw_images_in_grid(images, categories, probabilities, category_overview) {
	var $container = $("#canvas_grid_visualization");

	// === FIX: Prevent scroll jump by keeping container height stable ===
	// Before clearing, lock the container to its current rendered height.
	// This prevents layout collapse which causes the browser to scroll up.
	var currentHeight = $container.outerHeight();
	if (currentHeight > 0) {
		$container.css("min-height", currentHeight + "px");
	}

	$container.html("");

	var numCategories = labels.length;

	var margin = 10;
	var scaleWidth = 40;

	var _height = $container.height();

	if (!_height) {
		_height = 460;
	}

	// Create a scale canvas on the left
	var scaleCanvas = document.createElement("canvas");
	scaleCanvas.width = scaleWidth;
	scaleCanvas.height = _height;
	var scaleCtx = scaleCanvas.getContext("2d");

	scaleCtx.fillStyle = "rgba(255, 255, 255, 0)";
	scaleCtx.fillRect(0, 0, scaleCanvas.width, scaleCanvas.height);

	scaleCtx.font = "12px Arial";
	if (is_dark_mode) {
		scaleCtx.fillStyle = "#ffffff";
		scaleCtx.strokeStyle = "#ffffff";
	} else {
		scaleCtx.fillStyle = "#000000";
		scaleCtx.strokeStyle = "#000000";
	}
	scaleCtx.textAlign = "right";

	var graphHeight = _height - margin * 2 - 50;
	var scaleTop = margin;
	var scaleBottom = scaleTop + graphHeight;

	scaleCtx.beginPath();
	scaleCtx.moveTo(scaleWidth - 5, scaleTop);
	scaleCtx.lineTo(scaleWidth - 5, scaleBottom);
	scaleCtx.stroke();

	var numTicks = 10;
	for (var tick = 0; tick <= numTicks; tick++) {
		var value = tick * 10;
		var yPos = scaleBottom - (value / 100) * graphHeight;

		scaleCtx.beginPath();
		scaleCtx.moveTo(scaleWidth - 10, yPos);
		scaleCtx.lineTo(scaleWidth - 5, yPos);
		scaleCtx.stroke();

		scaleCtx.fillText(value.toString(), scaleWidth - 12, yPos + 4);
	}

	scaleCtx.save();
	scaleCtx.translate(12, scaleTop + graphHeight / 2);
	scaleCtx.rotate(-Math.PI / 2);
	scaleCtx.textAlign = "center";
	scaleCtx.fillText(language[lang]["certainty"] + " in %", 0, 0);
	scaleCtx.restore();

	$(scaleCanvas).appendTo($container);

	var canvasses = get_canvasses(numCategories, _height);

	var graphWidth = canvasses[0].width - margin * 2;
	var maxProb = 1;

	draw_category_to_training_visualization(canvasses, numCategories, category_overview, margin);

	var canvas_img_counter = {};
	var real_canvas_img_counter = [];

	for (let image_idx = 0; image_idx < images.length; image_idx++) {
		let category = categories[image_idx];
		real_canvas_img_counter[category] = 0;
	}

	for (let image_idx = 0; image_idx < images.length; image_idx++) {
		let category = categories[image_idx];
		canvas_img_counter[category] = 0;
		real_canvas_img_counter[category]++;
	}

	var targetSize = Math.min(model?.input?.shape[1], model?.input?.shape[2]);

	for (let image_idx = 0; image_idx < images.length; image_idx++) {
		var image = images[image_idx];
		var category = categories[image_idx];
		var probability = probabilities[image_idx];

		if (real_canvas_img_counter[category] > 0) {
			var canvas_width = canvasses[0].width;
			targetSize = canvas_width / real_canvas_img_counter[category];
			targetSize = Math.min(model?.input?.shape[1], model?.input?.shape[2], targetSize);
		}

		var xPos = margin * 1;
		var yPos = margin + graphHeight - probability / maxProb * graphHeight;

		var canvasIndex = category;
		var canvas = canvasses[canvasIndex];
		if (canvas) {
			var ctx = canvas.getContext("2d");

			var scale = targetSize / Math.max(image.width, image.height);
			var w = image.width * scale;
			var h = image.height * scale;

			var imageX = xPos - model?.input?.shape[2] / 2;
			imageX += canvas_img_counter[category] * targetSize;

			if (imageX < 0) {
				imageX = 0;
			}

			imageX = parse_int(imageX);

			var imageY = parse_int(yPos - h / 2);
			ctx.drawImage(image, imageX, imageY, w, h);

			canvas_img_counter[category]++;
		}
	}

	append_grid_image_to_dom(numCategories, canvasses, _height);

	// === FIX: After content is inserted, release the min-height lock ===
	// Use requestAnimationFrame to ensure the new content is rendered first,
	// then remove the artificial min-height so the container can size naturally.
	requestAnimationFrame(function () {
		$container.css("min-height", "");
	});
}

function append_grid_image_to_dom(numCategories, canvasses, _height) {
	for (let numCategories_idx  = 0; numCategories_idx  < numCategories; numCategories_idx++) {
		var canvas = canvasses[numCategories_idx];
		if(canvas) {
			var containerId = "#canvas_grid_visualization";
			$(canvas).appendTo($(containerId));
			if ((numCategories_idx + 1) < numCategories) {
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

			if(!_url.startsWith("data:image/png")) {
				wrn(`Category could not be found for the url ${_url} and the image element ${image_element}`);
			}

			return null;
		}
	} catch (error) {
		err("Error while extracting category:", error);
		return null;
	}
}

function findIndexByKey(_array, key) {
	try {
		assert(Array.isArray(_array), "Input is not an _array");
		assert(typeof key === "string", "Key is not a string");

		for (let array_idx = 0; array_idx < _array.length; array_idx++) {
			if (_array[array_idx] === key) {
				return array_idx; // Found the key, return its index
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

	for (var key_idx = 0; key_idx < keys.length; key_idx++) {
		await dispose(_cached_loaded_images[keys[key_idx]]);
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

function get_imgs_for_grid_vis() {
    return [
        ...$("#photos").find("img,canvas").toArray(),
        ...$(".own_images").find("img,canvas").toArray()
    ];
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

	if(!input_shape_is_image()) {
		log_once(language[lang]["train_visualization_only_works_for_images"]);
		$("#canvas_grid_visualization").html("");
		return;
	}

	if(get_last_layer_activation_function() != "softmax") {
		log_once(language[lang]["train_visualization_only_works_when_last_layer_is_softmax"]);
		$("#canvas_grid_visualization").html("");
		return;
	}

	var _max = get_max_nr_of_images_in_grid();

	if(_max == 0) {
		dbg(`visualize_train: get_nr_of_images_in_grid was 0`);
		return;
	}

	$("#plotly_epoch_history").show();

	if(!labels.length) {
		$("#canvas_grid_visualization").html("");

		await nextFrame();

		return;
	}

	var image_elements = get_imgs_for_grid_vis();

	if(image_elements.length == 0) {
		err("[visualize_train] Could not find image_elements");
		return;
	}

	var [total_wrong, total_correct, category_overview, categories, probabilities] = await get_category_overview(image_elements);

	for (var category_overview_idx = 0; category_overview_idx  < Object.keys(category_overview).length; category_overview_idx++) {
		var category = Object.keys(category_overview)[category_overview_idx];
		category_overview[category]["percentage_correct"] = parse_int((category_overview[category]["correct"] / category_overview[category]["total"]) * 100);
	}

	await render_grid_or_hide(image_elements, categories, probabilities, category_overview);
}

function get_src_or_error (image_element) {
	var src = null;
	try {
		src = image_element.src;
	} catch (e) {
		if(Object.keys(e).includes("message")) {
			e = e.message;
		}

		e = "" + e;

		throw new Error(e);
	}

	return src;
}

function add_to_predictions_and_categories (this_predicted_array, image_element_xpath, categories, probabilities) {
	if(this_predicted_array) {
		confusion_matrix_and_grid_cache[image_element_xpath] = this_predicted_array;

		var max_probability = Math.max(...this_predicted_array);
		var category = this_predicted_array.indexOf(max_probability);

		categories.push(category);
		probabilities.push(max_probability);
	} else {
		err(`[visualize_train] Cannot find prediction for image with xpath ${image_element_xpath}`);
	}

	return [categories, probabilities];
}

function get_img_tensor_or_null_and_error (image_element) {
	return tidy(() => {
		try {
			var res = cached_load_resized_image(image_element);
			return res;
		} catch (e) {
			err(e);
			return null;
		}
	});
}

function get_max_nr_of_images_in_grid() {
	var v = parseInt($("#max_number_of_images_in_grid").val(), 10);
	return Number.isInteger(v) && v > 0 ? v : 50;
}

async function get_category_overview (image_elements) {
	var total_wrong = 0;
	var probabilities = [];
	var total_correct = 0;
	var categories = [];
	var category_overview = {};

	const _max = get_max_nr_of_images_in_grid();

	var tensors_to_predict = [];
	var tensor_image_indices = [];

	for (var image_idx = 0; image_idx < image_elements.length && image_idx <= _max; image_idx++) {
		var image_element = image_elements[image_idx];

		if(!image_element) {
			wrn("[visualize_train] image_element not defined!", image_element);
			continue;
		}

		var img_tensor = get_img_tensor_or_null_and_error(image_element);

		if(img_tensor === null) {
			wrn("[visualize_train] Could not load image from pixels from this element:", image_element);
			continue;
		}

		tensors_to_predict.push(img_tensor);
		tensor_image_indices.push(image_idx);
	}

	var batch_predictions = {};

	if(tensors_to_predict.length > 0) {
		var batchTensor = tf.concat(tensors_to_predict, 0);
		var batchRes = tidy(() => {
			return model.predict(batchTensor);
		});
		var batchResData = array_sync(batchRes);
		batchTensor.dispose();
		batchRes.dispose();

		for(var i = 0; i < tensor_image_indices.length; i++) {
			batch_predictions[tensor_image_indices[i]] = batchResData[i];
		}
	}

	for (var image_idx = 0; image_idx < image_elements.length; image_idx++) {
		var image_element = image_elements[image_idx];

		var image_element_xpath = get_element_xpath(image_element);
		var this_predicted_array = [];
		var src = get_src_or_error(image_element);

		if(image_idx <= _max && batch_predictions.hasOwnProperty(image_idx)) {
			this_predicted_array = batch_predictions[image_idx];

			assert(Array.isArray(this_predicted_array), `this_predicted_array is not an array, but ${typeof(this_predicted_array)}, ${JSON.stringify(this_predicted_array)}`);

			[categories, probabilities] = add_to_predictions_and_categories(this_predicted_array, image_element_xpath, categories, probabilities);
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

			category_overview = init_category_overview_for_predicted_category(category_overview, predicted_category);

			if(predicted_index == correct_index) {
				total_correct++;

				category_overview[predicted_category]["correct"]++;
			} else {
				total_wrong++;

				category_overview[predicted_category]["wrong"]++;
			}
			category_overview[predicted_category]["total"]++;
		} catch (e) {
			err(e);
		}

	}

	return [total_wrong, total_correct, category_overview, categories, probabilities];
}

function init_category_overview_for_predicted_category (category_overview, predicted_category) {
	if(!Object.keys(category_overview).includes(predicted_category)) {
		category_overview[predicted_category] = {
			wrong: 0,
			correct: 0,
			total: 0
		};
	}

	return category_overview;
}

async function render_grid_or_hide(imgs, categories, probabilities, category_overview) {
	if (!imgs.length || !categories.length || !probabilities.length) {
		if (!imgs.length) dbg("render_grid_or_hide: imgs empty");
		if (!categories.length) dbg("render_grid_or_hide: categories empty");
		if (!probabilities.length) dbg("render_grid_or_hide: probabilities empty");

		// Lock height before clearing to prevent scroll jump
		var $container = $("#canvas_grid_visualization");
		var currentHeight = $container.outerHeight();
		if (currentHeight > 0) {
			$container.css("min-height", currentHeight + "px");
		}
		$container.html("");
		requestAnimationFrame(function () {
			$container.css("min-height", "");
		});
		return;
	}

	draw_images_in_grid(imgs, categories, probabilities, category_overview);

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
	];
}
