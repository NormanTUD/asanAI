"use strict";

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

async function retrain_neural_network() {
	// =====================================================================
	// FIX: Do NOT call incrementAndReset() before training.
	// The old approach of incrementing/decrementing a UI value to force
	// model recreation caused a race condition: compile_model() would be
	// triggered BEFORE started_training=true, creating a fresh optimizer
	// with empty m/v buffers. Then training would start with this fresh
	// optimizer, but another compile_model() call (from the reset) could
	// sneak in and replace it again.
	//
	// Instead, we simply force a fresh model creation and compilation
	// directly, in a controlled manner, BEFORE setting started_training.
	// =====================================================================
	
	dbg("[retrain_neural_network] Forcing fresh model creation for retraining...");
	
	// Force model recreation by invalidating the config hash
	model_config_hash = "";
	no_weights_current_status_hash = "";
	
	// Create a fresh model (this resets all weights)
	try {
		model = await create_model(model, undefined, 1); // force=1
		await get_model_data();
		
		if (!model) {
			err("[retrain_neural_network] Failed to create fresh model!");
			return null;
		}
		
		// Compile with fresh optimizer
		model.compile({
			optimizer: global_model_data.optimizer,
			loss: global_model_data.loss,
			metrics: [global_model_data.metric]
		});
		
		dbg("[retrain_neural_network] Fresh model compiled. Starting training...");
	} catch (e) {
		err("[retrain_neural_network] Error during model recreation: " + (e.message || e));
		return null;
	}

	await train_neural_network();
}

async function train_neural_network() {
	await tf.ready();
	let scopeStarted = false;
	try {
		tf.engine().startScope();
		scopeStarted = true;

		// NEUER CODE: Optimizer im aktuellen Scope erstellen
		if (model && model.optimizer) {
			// Prüfe ob der Optimizer im aktuellen Scope gültig ist
			try {
				const opt_config = model.optimizer.getConfig();
				// Wenn das funktioniert, ist der Optimizer OK
			} catch (e) {
				// Optimizer ist ungültig im aktuellen Scope → neu erstellen
				wrn("[train_neural_network] Recreating optimizer in current scope...");
				var saved_st = started_training;
				started_training = false;
				await get_model_data();
				started_training = saved_st;
				model.compile({
					optimizer: global_model_data.optimizer,
					loss: global_model_data.loss,
					metrics: [global_model_data.metric]
				});
			}
		}

		var ret = await _train_neural_network();
		return ret;
	} finally {
		if (scopeStarted) {
			try { tf.engine().endScope(); } catch(e) {}
		}
	}
}

async function _train_neural_network () {
	training_requested = true;
	var ret = null;

	await wait_for_updated_page(1);

	if(model === null || model === undefined || typeof(model) != "object" || !Object.keys(model).includes("layers")) {
		await gui_not_in_training();

		model = await create_model();
		await compile_model();

		training_requested = false;

		return;
	}

	await restart_fcnn();

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

		training_logs_batch = get_empty_plotly("Loss");
		training_logs_epoch = get_empty_plotly("Loss");

		last_batch_time = 0;

		training_memory_history = get_empty_training_memory_history_plotly();

		reset_gui_before_training();

		$("#percentage").html("");
		$("#percentage").hide();

		ret = await run_neural_network();

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

	training_requested = false;

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

/**
 * Selectively repairs NaN values in optimizer accumulators WITHOUT resetting
 * the entire optimizer. Only the corrupted slots are zeroed out.
 * This preserves the momentum information for all non-corrupted weights.
 *
 * Returns: { repaired: boolean, nan_slots: number, total_slots: number }
 */
async function selective_repair_nan_optimizer_slots() {
	if (!model || !model.optimizer) return { repaired: false, nan_slots: 0, total_slots: 0 };
	if (typeof model.optimizer.getWeights !== "function") return { repaired: false, nan_slots: 0, total_slots: 0 };
	if (typeof model.optimizer.setWeights !== "function") return { repaired: false, nan_slots: 0, total_slots: 0 };

	try {
		const opt_weights = await model.optimizer.getWeights();
		if (!opt_weights || opt_weights.length === 0) return { repaired: false, nan_slots: 0, total_slots: 0 };

		let nan_slots = 0;
		let total_slots = opt_weights.length;
		let needs_repair = false;
		const repaired_weights = [];

		for (let ow_idx = 0; ow_idx < opt_weights.length; ow_idx++) {
			const ow = opt_weights[ow_idx];
			if (!ow || !ow.tensor || ow.tensor.isDisposed) {
				repaired_weights.push(ow);
				continue;
			}

			const data = ow.tensor.dataSync();
			let has_nan_in_this = false;

			for (let di = 0; di < data.length; di++) {
				if (isNaN(data[di]) || !isFinite(data[di])) {
					has_nan_in_this = true;
					break;
				}
			}

			if (has_nan_in_this) {
				nan_slots++;
				needs_repair = true;
				// Replace this slot with zeros (safe reset for this specific accumulator)
				const zero_tensor = tf.zeros(ow.tensor.shape, ow.tensor.dtype);
				repaired_weights.push({ name: ow.name, tensor: zero_tensor });
				wrn(`[selective_repair_nan_optimizer_slots] Zeroed NaN accumulator slot "${ow.name}" (shape: [${ow.tensor.shape.join(",")}])`);
			} else {
				repaired_weights.push(ow);
			}
		}

		if (needs_repair) {
			try {
				await model.optimizer.setWeights(repaired_weights.map(w => w.tensor));
				dbg(`[selective_repair_nan_optimizer_slots] Repaired ${nan_slots}/${total_slots} NaN accumulator slots.`);
			} catch (set_err) {
				// If setWeights fails (some optimizers don't support it well),
				// fall back to full optimizer reset
				wrn(`[selective_repair_nan_optimizer_slots] setWeights failed: ${set_err.message}. Falling back to full optimizer reset.`);
				await repair_nan_optimizer_if_needed();
			}

			// Dispose the zero tensors we created
			for (let rw_idx = 0; rw_idx < repaired_weights.length; rw_idx++) {
				if (repaired_weights[rw_idx] !== opt_weights[rw_idx]) {
					try { repaired_weights[rw_idx].tensor.dispose(); } catch(e) {}
				}
			}
		}

		return { repaired: needs_repair, nan_slots: nan_slots, total_slots: total_slots };
	} catch (e) {
		wrn("[selective_repair_nan_optimizer_slots] Error: " + (e.message || e));
		return { repaired: false, nan_slots: 0, total_slots: 0 };
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

async function get_model_data () {
	if (typeof tf === "undefined" || !tf || !tf.train) {
		err("[get_model_data] FATAL: tf or tf.train is not defined. Cannot create optimizer.");
		return;
	}

	// GUARD: Niemals den Optimizer ersetzen wenn Training laeuft oder angefragt wurde
	if ((started_training || training_requested) && model && model.optimizer) {
		dbg("[get_model_data] SKIPPED: training requested or in progress.");
		if (global_model_data) {
			global_model_data["optimizer"] = model.optimizer;
		}
		return;
	}

	// GUARD: Wenn is_setting_config und bereits ein gueltiger Optimizer existiert, nicht ersetzen
	if (is_setting_config && global_model_data && global_model_data.optimizer &&
		typeof global_model_data.optimizer.minimize === "function") {
		dbg("[get_model_data] SKIPPED: is_setting_config and optimizer already exists.");
		return;
	}

	// GUARD: Wenn model bereits trainiert wurde, Optimizer nicht ersetzen
	if (model_is_trained && model && model.optimizer &&
		typeof model.optimizer.minimize === "function") {
		dbg("[get_model_data] SKIPPED: model is trained and has valid optimizer.");
		if (global_model_data) {
			global_model_data["optimizer"] = model.optimizer;
		}
		return;
	}

	if (global_model_data) {
		try {
			var model_data_tensors = find_tensors_with_is_disposed_internal(global_model_data);
			for (var model_data_tensor_idx = 0; model_data_tensor_idx < model_data_tensors.length; model_data_tensor_idx++) {
				try {
					await dispose(model_data_tensors[model_data_tensor_idx]);
				} catch (dispose_err) {
					dbg("[get_model_data] Error disposing old tensor: " + dispose_err);
				}
			}
		} catch (e) {
			dbg("[get_model_data] Error during old tensor cleanup: " + e);
		}
	}

	var loss = get_loss();
	var optimizer_type = get_optimizer();
	var metric_type = get_metric();

	if (!loss) {
		err("[get_model_data] FATAL: loss is empty/undefined!");
		return;
	}

	if (!optimizer_type) {
		err("[get_model_data] FATAL: optimizer_type is empty/undefined!");
		return;
	}

	if (!metric_type) {
		wrn("[get_model_data] WARNING: metric_type is empty/undefined, defaulting to loss.");
		metric_type = loss;
	}

	if (Object.values(metric_shortnames).includes(metric_type)) {
		metric_type = get_key_by_value(metric_shortnames, metric_type);
	}

	var epochs = $("#epochs").val();
	var batchSize = $("#batchSize").val();
	var validationSplit = $("#validationSplit").val();
	var divide_by = $("#divide_by").val();

	if (looks_like_number(epochs)) {
		epochs = parse_int(epochs);
	} else {
		finished_loading && wrn("[get_model_data] #epochs doesn't look like a number: " + epochs);
		epochs = 1;
	}

	if (looks_like_number(batchSize)) {
		batchSize = parse_int(batchSize);
	} else {
		finished_loading && wrn("[get_model_data] #batchSize doesn't look like a number: " + batchSize);
		batchSize = 32;
	}

	if (looks_like_number(validationSplit)) {
		validationSplit = parse_float(validationSplit);
	} else {
		finished_loading && wrn("[get_model_data] #validationSplit doesn't look like a number: " + validationSplit);
		validationSplit = 0;
	}

	if (looks_like_number(divide_by)) {
		divide_by = parse_float(divide_by);
	} else {
		finished_loading && wrn("[get_model_data] #divide_by doesn't look like a number: " + divide_by);
		divide_by = 1;
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

	if (!is_hidden_or_has_hidden_parent($("#height"))) {
		global_model_data["width"] = width;
		global_model_data["height"] = height;
	}

	var optimizer_data_names = model_data_structure[optimizer_type];

	if (!optimizer_data_names || !Array.isArray(optimizer_data_names)) {
		err(`[get_model_data] FATAL: No optimizer data structure found for "${optimizer_type}". ` +
			`Available: ${Object.keys(model_data_structure).join(", ")}`);
		return;
	}

	for (var optimizer_idx = 0; optimizer_idx < optimizer_data_names.length; optimizer_idx++) {
		var element_name = optimizer_data_names[optimizer_idx] + "_" + optimizer_type;
		var $element_field = $("#" + element_name);

		if (!$element_field.length) {
			wrn(`[get_model_data] WARNING: UI element #${element_name} not found for optimizer "${optimizer_type}".`);
			continue;
		}

		var element_val = $element_field.val();

		if (!looks_like_number(element_val)) {
			wrn(`[get_model_data] WARNING: Optimizer param "${optimizer_data_names[optimizer_idx]}" ` +
				`value "${element_val}" does not look like a number. Using 0.`);
			element_val = "0";
		}

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

	if (!Object.keys(optimizer_constructors).includes(optimizer_type)) {
		err(`[get_model_data] FATAL: Unknown optimizer type "${optimizer_type}". ` +
			`Available: ${Object.keys(optimizer_constructors).join(", ")}`);
		return;
	}

	var optimizer_as_code = "tf.train." + optimizer_constructors[optimizer_type];

	// ZWEITER GUARD: Nochmal pruefen nach den async Operationen oben
	if (started_training && model && model.optimizer) {
		dbg("[get_model_data] SKIPPED optimizer creation post-async: training is in progress.");
		global_model_data["optimizer"] = model.optimizer;
		return;
	}

	dbg("[get_model_data] Creating optimizer: " + optimizer_as_code);

	try {
		await tf.ready();

		var new_optimizer = eval(optimizer_as_code);

		if (!new_optimizer) {
			err("[get_model_data] FATAL: eval returned null/undefined for: " + optimizer_as_code);
			return;
		}

		if (typeof new_optimizer.minimize !== "function") {
			err("[get_model_data] FATAL: Created optimizer has no minimize method!");
			return;
		}

		var clip_value = parse_float($("#gradient_clip_value").val ? ($("#gradient_clip_value").val() || "1.0") : "1.0");

		if (clip_value > 0 && isFinite(clip_value)) {
			new_optimizer.clipValue = clip_value;
			dbg(`[get_model_data] Gradient clipping applied: clipValue=${clip_value}`);
		} else {
			new_optimizer.clipValue = 1.0;
			dbg(`[get_model_data] Gradient clipping applied: clipValue=1.0 (default)`);
		}

		if (typeof new_optimizer.getClassName === "function") {
			dbg(`[get_model_data] Optimizer created: ${new_optimizer.getClassName()}`);
		}

		if (typeof new_optimizer.getConfig === "function") {
			try {
				var applied_config = new_optimizer.getConfig();
				if (applied_config && applied_config.learningRate !== undefined) {
					var expected_lr = global_model_data["learningRate"];
					var actual_lr = applied_config.learningRate;
					if (Math.abs(expected_lr - actual_lr) > 1e-10) {
						wrn(`[get_model_data] LR mismatch! Expected: ${expected_lr}, Got: ${actual_lr}`);
					} else {
						dbg(`[get_model_data] LR verified: ${actual_lr}`);
					}
				}
			} catch (config_err) {
				dbg("[get_model_data] Could not verify optimizer config: " + config_err);
			}
		}

		global_model_data["optimizer"] = new_optimizer;

	} catch (e) {
		var error_msg = (e && e.message) ? e.message : ("" + e);
		err("[get_model_data] FATAL: Failed to create optimizer. Code: " + optimizer_as_code +
			". Error: " + error_msg);

		try {
			wrn("[get_model_data] Attempting fallback: default Adam with clipValue=1.0...");
			await tf.ready();
			var fallback_opt = tf.train.adam(0.001);
			fallback_opt.clipValue = 1.0;
			global_model_data["optimizer"] = fallback_opt;
			wrn("[get_model_data] Fallback Adam created successfully.");
		} catch (fallback_err) {
			err("[get_model_data] FATAL: Even fallback optimizer failed: " + fallback_err);
			return;
		}
	}

	if (!global_model_data["optimizer"]) {
		err("[get_model_data] FATAL: After all attempts, optimizer is still null!");
		return;
	}

	if (finished_loading) {
		dbg(`[get_model_data] Summary: optimizer=${optimizer_type}, ` +
			`lr=${global_model_data["learningRate"]}, ` +
			`loss=${loss}, metric=${metric_type}, ` +
			`epochs=${epochs}, batchSize=${batchSize}`);
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

function delay(time) {
	return new Promise(resolve => setTimeout(resolve, time));
}

async function get_fit_data () {
	var epochs = get_epochs();
	var batchSize = get_batch_size();
	var validationSplit = parse_int($("#validationSplit").val()) / 100;

	var callbacks = {};

	callbacks["onTrainBegin"] = async function () {
		_math_interactive_mode_before = _math_interactive_mode;

		this._original_optimizer = model.optimizer;
		this._original_optimizer_id = model.optimizer ?
			(model.optimizer.getClassName() + "_" + Date.now()) : null;

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
		await confusion_matrix_to_page(); // async not possible

		confusion_matrix_and_grid_cache = {};

		history_of_weights_for_loss_landscape = [];

		show_or_hide_beginner_or_expert_mode_stuff();
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
	};

	callbacks["onBatchEnd"] = async function (batch, logs) {
		confusion_matrix_and_grid_cache = {};

		// =====================================================================
		// CRITICAL: Detect NaN loss IMMEDIATELY and stop training
		// If loss becomes NaN, every subsequent optimizer step will corrupt
		// the m/v buffers further. Stop immediately to limit damage.
		// =====================================================================
		if (logs && (isNaN(logs["loss"]) || !isFinite(logs["loss"]))) {
			err(`[onBatchEnd] CRITICAL: Loss is ${logs["loss"]} at batch ${batch}! ` +
				"Stopping training immediately to prevent optimizer corruption.");
			model.stopTraining = true;

			// Attempt immediate repair
			try {
				await repair_nan_weights_if_needed();
				await repair_nan_optimizer_if_needed();
				wrn("[onBatchEnd] Emergency NaN repair attempted. Training stopped.");
			} catch (repair_err) {
				err("[onBatchEnd] Emergency repair failed: " + (repair_err.message || repair_err));
			}
			return;
		}

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

		show_plotly_graphs();

		if(!last_batch_plot_time || (Date.now() - last_batch_plot_time) > (parse_int($("#min_time_between_batch_plots").val()) * 1000)) {
			const plot_func = (batchNr === 1) ? Plotly.newPlot : Plotly.update;

			plot_func("plotly_batch_history", this_plot_data, get_plotly_layout(language[lang]["batches"]));

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

		show_or_hide_beginner_or_expert_mode_stuff();
	};

	callbacks["onBatchBegin"] = async function () {
		confusion_matrix_and_grid_cache = {};

		if (this._original_optimizer && model.optimizer !== this._original_optimizer) {
			err("[onBatchBegin] CRITICAL: Optimizer was REPLACED during training! " +
				"Restoring original optimizer...");
			model.compile({
				optimizer: this._original_optimizer,
				loss: global_model_data.loss,
				metrics: [global_model_data.metric]
			});
		}

		if(!started_training) {
			model.stopTraining = true;
		}

		// =====================================================================
		// GUARD: Quick NaN check on model weights every N batches.
		// If weights become NaN during training, stop immediately.
		// We only check every 10 batches for performance.
		// =====================================================================
		if (typeof callbacks._batch_counter === "undefined") {
			callbacks._batch_counter = 0;
		}
		callbacks._batch_counter++;

		if (callbacks._batch_counter % 10 === 0) {
			try {
				const weights = model.getWeights();
				let found_nan = false;
				for (let wi = 0; wi < weights.length; wi++) {
					if (weights[wi].isDisposed) continue;
					// Quick sample check - just first few values
					const data = weights[wi].dataSync();
					for (let di = 0; di < Math.min(data.length, 20); di++) {
						if (isNaN(data[di])) {
							found_nan = true;
							err(`[onBatchBegin] NaN detected in weight tensor ${wi} at batch ${callbacks._batch_counter}! Attempting repair...`);
							break;
						}
					}
					if (found_nan) break;
				}

				if (found_nan) {
					const repaired = await repair_nan_weights_if_needed();
					if (repaired) {
						const opt_repaired = await selective_repair_nan_optimizer_slots();
						wrn(`[onBatchBegin] NaN repair: weights=${repaired}, optimizer_slots=${opt_repaired.nan_slots} fixed. Training continues.`);
					} else {
						err("[onBatchBegin] NaN repair failed. Stopping training.");
						model.stopTraining = true;
						return;
					}
				}
			} catch (nan_batch_err) {
				dbg(`[onBatchBegin] Batch NaN check error (non-fatal): ${nan_batch_err}`);
			}
		}

		if(!is_hidden_or_has_hidden_parent($("#math_tab"))) {
			await write_model_to_latex_to_page();
		}

		confusion_matrix_and_grid_cache = {};

		show_or_hide_beginner_or_expert_mode_stuff();
	};

	callbacks["onEpochEnd"] = async function (batch, logs) {
		confusion_matrix_and_grid_cache = {};

		// =====================================================================
		// CRITICAL: Check for NaN in optimizer accumulators at end of each epoch.
		// If NaN has crept into Adam's m/v buffers during this epoch, we repair
		// it NOW before the next epoch starts, preventing NaN from spreading
		// to all future weight updates.
		// =====================================================================
		if (logs && (isNaN(logs["loss"]) || !isFinite(logs["loss"]))) {
			err(`[onEpochEnd] Loss is ${logs["loss"]} at epoch ${batch}! Attempting NaN repair...`);
			const repair_result = await selective_repair_nan_optimizer_slots();
			if (repair_result.repaired) {
				wrn(`[onEpochEnd] Repaired ${repair_result.nan_slots} NaN optimizer slots. Training will continue.`);
				// Also repair any NaN weights
				await repair_nan_weights_if_needed();
			} else {
				err("[onEpochEnd] Could not repair NaN. Stopping training.");
				model.stopTraining = true;
				return;
			}
		} else {
			// Even if loss looks OK, check optimizer accumulators periodically
			// because NaN can exist in individual weight slots without making
			// the overall loss NaN (if those weights have small influence)
			try {
				if (model.optimizer && typeof model.optimizer.getWeights === "function") {
					const opt_weights = await model.optimizer.getWeights();
					if (opt_weights && opt_weights.length > 0) {
						let has_any_nan = false;
						for (let ow_idx = 0; ow_idx < opt_weights.length; ow_idx++) {
							const ow = opt_weights[ow_idx];
							if (ow && ow.tensor && !ow.tensor.isDisposed) {
								// Sample check - don't check every element for performance
								const data = ow.tensor.dataSync();
								const check_count = Math.min(data.length, 200);
								const step = Math.max(1, Math.floor(data.length / check_count));
								for (let di = 0; di < data.length; di += step) {
									if (isNaN(data[di]) || !isFinite(data[di])) {
										has_any_nan = true;
										break;
									}
								}
							}
							if (has_any_nan) break;
						}

						if (has_any_nan) {
							wrn(`[onEpochEnd] NaN detected in optimizer accumulators (epoch ${batch}). Performing selective repair...`);
							const repair_result = await selective_repair_nan_optimizer_slots();
							if (repair_result.repaired) {
								wrn(`[onEpochEnd] Repaired ${repair_result.nan_slots} NaN slots. Training continues.`);
							}
							// Also check and repair weights
							await repair_nan_weights_if_needed();
						}
					}
				}
			} catch (nan_check_err) {
				dbg(`[onEpochEnd] Optimizer NaN check failed (non-fatal): ${nan_check_err}`);
			}
		}

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

		$("#plotly_epoch_history").parent().show();
		$("#plotly_epoch_history").show();
		if(epochNr == 1) {
			Plotly.newPlot('plotly_epoch_history', this_plot_data, get_plotly_layout(language[lang]["epochs"], "Loss"));
		} else {
			Plotly.update('plotly_epoch_history', this_plot_data, get_plotly_layout(language[lang]["epochs"], "Loss"));
		}

		await visualize_train();

		if(training_logs_batch && "loss" in training_logs_batch) {
			this_plot_data = [training_logs_batch["loss"]];
			Plotly.update("plotly_batch_history", this_plot_data, get_plotly_layout(language[lang]["batches"], "Loss"));
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

		/*
		await plot_training_data_to_neurons(); // TODO!
		*/

		reset_neuron_outputs();

		//await visualizeModelBends();

		//visualizeModelOrganism(model, "neural_organism");

		show_or_hide_beginner_or_expert_mode_stuff();
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

		confusion_matrix_and_grid_cache = {};

		_math_interactive_mode = _math_interactive_mode_before;

		if(_math_interactive_mode) {
			toggle_math_interactive_mode();
		}

		show_or_hide_beginner_or_expert_mode_stuff();
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

function show_plotly_graphs() {
	$("#plotly_batch_history").parent().show();
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

async function prepare_gui_for_training() {
	await wait_for_updated_page(2);

	await clean_gui();

	add_stop_training_class_to_train_button();
}

/**
 * Validates and sanitizes training tensors before they are passed to model.fit().
 * Removes samples that contain NaN or Infinity values.
 * Returns sanitized {x, y} or throws if all data is invalid.
 */
function sanitize_training_data(x, y) {
	return tf.tidy(() => {
		const x_shape = x.shape;
		const y_shape = y.shape;
		const num_samples = x_shape[0];

		if (num_samples === 0) {
			throw new Error("[sanitize_training_data] No samples in input data!");
		}

		// Check each sample for NaN/Inf
		// Reshape x to [num_samples, -1] to check per-sample
		const x_flat = x.reshape([num_samples, -1]);

		// For each sample, check if it contains NaN or Inf
		// tf.isNaN returns boolean tensor, reduce over features axis
		const has_nan = x_flat.isNaN().any(1); // [num_samples] boolean
		const has_inf = x_flat.abs().equal(Infinity).any(1); // [num_samples] boolean
		const x_invalid = has_nan.logicalOr(has_inf); // [num_samples] boolean

		// Also check y
		const y_flat = y.reshape([num_samples, -1]);
		const y_has_nan = y_flat.isNaN().any(1);
		const y_has_inf = y_flat.abs().equal(Infinity).any(1);
		const y_invalid = y_has_nan.logicalOr(y_has_inf);

		// Combined invalid mask
		const invalid = x_invalid.logicalOr(y_invalid);
		const valid = invalid.logicalNot();

		const valid_data = valid.dataSync();
		const num_valid = Array.from(valid_data).filter(v => v).length;
		const num_invalid = num_samples - num_valid;

		if (num_invalid > 0) {
			wrn(`[sanitize_training_data] Found ${num_invalid}/${num_samples} samples with NaN/Inf values. Removing them.`);
		}

		if (num_valid === 0) {
			throw new Error("[sanitize_training_data] ALL samples contain NaN or Inf! Cannot train.");
		}

		if (num_valid === num_samples) {
			dbg("[sanitize_training_data] All samples are clean (no NaN/Inf).");
			return { x: x, y: y, removed: 0 };
		}

		// Gather only valid indices
		const valid_indices_arr = [];
		for (let i = 0; i < num_samples; i++) {
			if (valid_data[i]) {
				valid_indices_arr.push(i);
			}
		}

		const valid_indices = tf.tensor1d(valid_indices_arr, 'int32');
		const x_clean = tf.gather(x, valid_indices);
		const y_clean = tf.gather(y, valid_indices);

		dbg(`[sanitize_training_data] Kept ${num_valid}/${num_samples} clean samples.`);

		return { x: x_clean, y: y_clean, removed: num_invalid };
	});
}

/**
 * Checks if the model weights contain NaN and attempts to fix them
 * by reinitializing only the corrupted weight tensors.
 * Returns true if any weights were repaired.
 */
async function repair_nan_weights_if_needed() {
	if (!model || !model.layers) return false;

	let has_nan = false;
	let nan_weight_indices = [];
	const all_weights = model.getWeights();

	for (let wi = 0; wi < all_weights.length; wi++) {
		if (all_weights[wi].isDisposed) continue;
		const w_data = all_weights[wi].dataSync();
		for (let di = 0; di < w_data.length; di++) {
			if (isNaN(w_data[di]) || !isFinite(w_data[di])) {
				has_nan = true;
				nan_weight_indices.push(wi);
				break;
			}
		}
	}

	if (!has_nan) {
		return false;
	}

	err(`[repair_nan_weights_if_needed] Found NaN/Inf in ${nan_weight_indices.length} weight tensor(s): indices [${nan_weight_indices.join(", ")}]. Reinitializing corrupted weights...`);

	// Clone all weights, replace NaN ones with fresh random values
	const repaired_weights = [];
	for (let wi = 0; wi < all_weights.length; wi++) {
		if (nan_weight_indices.includes(wi)) {
			const shape = all_weights[wi].shape;
			// Use Glorot uniform initialization as a safe default
			const fan_in = shape.length >= 2 ? shape[shape.length - 2] : shape[0];
			const fan_out = shape.length >= 2 ? shape[shape.length - 1] : shape[0];
			const limit = Math.sqrt(6.0 / (fan_in + fan_out));
			const new_weight = tf.randomUniform(shape, -limit, limit);
			repaired_weights.push(new_weight);
			wrn(`[repair_nan_weights_if_needed] Reinitialized weight tensor ${wi} (shape: [${shape.join(", ")}]) with Glorot uniform.`);
		} else {
			repaired_weights.push(all_weights[wi].clone());
		}
	}

	model.setWeights(repaired_weights);

	// Dispose cloned tensors
	for (let wi = 0; wi < repaired_weights.length; wi++) {
		try { repaired_weights[wi].dispose(); } catch(e) {}
	}

	dbg("[repair_nan_weights_if_needed] Weight repair complete.");
	return true;
}

/**
 * Checks optimizer accumulators for NaN values and resets the optimizer if found.
 * This prevents NaN from propagating through all future training steps.
 * Returns true if optimizer was reset.
 */
async function repair_nan_optimizer_if_needed() {
	if (!model || !model.optimizer) return false;
	if (typeof model.optimizer.getWeights !== "function") return false;

	try {
		const opt_weights = await model.optimizer.getWeights();
		if (!opt_weights || opt_weights.length === 0) return false;

		let has_nan = false;
		for (let ow_idx = 0; ow_idx < opt_weights.length; ow_idx++) {
			const ow = opt_weights[ow_idx];
			if (ow && ow.tensor && !ow.tensor.isDisposed) {
				const data = ow.tensor.dataSync();
				for (let di = 0; di < Math.min(data.length, 5000); di++) {
					if (isNaN(data[di]) || !isFinite(data[di])) {
						has_nan = true;
						break;
					}
				}
			}
			if (has_nan) break;
		}

		if (!has_nan) return false;

		err("[repair_nan_optimizer_if_needed] NaN detected in optimizer accumulators! " +
			"Resetting optimizer to prevent NaN propagation...");

		// Save current model weights (they should already be repaired by repair_nan_weights_if_needed)
		const current_weights = model.getWeights().map(w => w.clone());

		// Create fresh optimizer
		var saved_st = started_training;
		started_training = false;
		await get_model_data();
		started_training = saved_st;

		if (!global_model_data || !global_model_data.optimizer) {
			err("[repair_nan_optimizer_if_needed] Could not create fresh optimizer!");
			for (let wi = 0; wi < current_weights.length; wi++) {
				try { current_weights[wi].dispose(); } catch(e) {}
			}
			return false;
		}

		// Recompile with fresh optimizer
		model.compile({
			optimizer: global_model_data.optimizer,
			loss: global_model_data.loss,
			metrics: [global_model_data.metric]
		});

		// Restore weights
		model.setWeights(current_weights);

		// Cleanup
		for (let wi = 0; wi < current_weights.length; wi++) {
			try { current_weights[wi].dispose(); } catch(e) {}
		}

		dbg("[repair_nan_optimizer_if_needed] Optimizer reset complete. Fresh Adam m/v buffers.");
		return true;
	} catch (e) {
		wrn("[repair_nan_optimizer_if_needed] Error during NaN check: " + (e.message || e));
		return false;
	}
}

// Neuer Guard in fit_model(), direkt vor model.fit():
async function validate_optimizer_will_work() {
	if (!model || !model.optimizer) return false;

	// Führe einen Dummy-Trainingsschritt durch und prüfe ob Akkumulatoren befüllt werden
	const test_x = x.slice(0, 1);
	const test_y = y.slice(0, 1);

	const weights_before = model.getWeights().map(w => w.clone());

	await model.fit(test_x, test_y, { epochs: 1, verbose: 0 });

	// Prüfe ob Akkumulatoren jetzt non-zero sind
	const opt_weights = await model.optimizer.getWeights();
	let any_nonzero = false;

	for (let i = 0; i < opt_weights.length; i++) {
		if (opt_weights[i] && opt_weights[i].tensor && !opt_weights[i].tensor.isDisposed) {
			const max_val = tf.tidy(() => opt_weights[i].tensor.abs().max().dataSync()[0]);
			if (max_val > 0) {
				any_nonzero = true;
				break;
			}
		}
	}

	// Restore original weights
	model.setWeights(weights_before);
	weights_before.forEach(w => w.dispose());
	test_x.dispose();
	test_y.dispose();

	if (!any_nonzero) {
		err("[validate_optimizer_will_work] FAILED: After 1 training step, " +
			"all optimizer accumulators are still zero! Optimizer is broken.");
		return false;
	}

	return true;
}

async function fit_model(x_and_y) {
	var weights_before_training = null;
	var fit_data = null;

	try {
		dbg("[fit_model] ========== FIT_MODEL START ==========");

		// =====================================================================
		// GUARD: Validate x_and_y input
		// =====================================================================
		if (!x_and_y) {
			err("[fit_model] FATAL: x_and_y is null/undefined!");
			throw new Error("[fit_model] x_and_y is null/undefined");
		}

		if (typeof x_and_y !== "object") {
			err(`[fit_model] FATAL: x_and_y is not an object, but ${typeof x_and_y}`);
			throw new Error("[fit_model] x_and_y is not an object");
		}

		if (!("x" in x_and_y)) {
			err("[fit_model] FATAL: x_and_y has no 'x' key! Keys: " + Object.keys(x_and_y).join(", "));
			throw new Error("[fit_model] x_and_y missing 'x'");
		}

		if (!("y" in x_and_y)) {
			err("[fit_model] FATAL: x_and_y has no 'y' key! Keys: " + Object.keys(x_and_y).join(", "));
			throw new Error("[fit_model] x_and_y missing 'y'");
		}

		// =====================================================================
		// GUARD: Get fit_data (callbacks, epochs, batchSize, etc.)
		// =====================================================================
		dbg("[fit_model] Getting fit_data...");

		try {
			fit_data = await _get_fit_data(x_and_y);
		} catch (fit_data_err) {
			err("[fit_model] FATAL: _get_fit_data threw: " + (fit_data_err.message || fit_data_err));
			throw fit_data_err;
		}

		if (!fit_data || fit_data === true) {
			err("[fit_model] FATAL: fit_data is invalid (was " + JSON.stringify(fit_data) + "). Cannot train.");
			throw new Error("[fit_model] fit_data was not properly created.");
		}

		if (typeof fit_data !== "object") {
			err(`[fit_model] FATAL: fit_data is not an object, but ${typeof fit_data}`);
			throw new Error("[fit_model] fit_data is not an object");
		}

		dbg("[fit_model] fit_data obtained. epochs=" + fit_data.epochs + ", batchSize=" + fit_data.batchSize);

		// =====================================================================
		// GUARD: Ensure TF.js backend is ready
		// =====================================================================
		dbg("[fit_model] Ensuring tf.ready()...");
		try {
			await tf.ready();
			dbg("[fit_model] tf.ready() completed. Backend: " + tf.getBackend());
		} catch (tf_ready_err) {
			err("[fit_model] FATAL: tf.ready() failed: " + (tf_ready_err.message || tf_ready_err));
			throw tf_ready_err;
		}

		// =====================================================================
		// GUARD: Ensure model exists
		// =====================================================================
		if (!model) {
			err("[fit_model] Model is null/undefined. Attempting to compile...");
			try {
				await compile_model();
			} catch (compile_err) {
				err("[fit_model] FATAL: compile_model threw: " + (compile_err.message || compile_err));
				throw compile_err;
			}
		}

		if (!model) {
			err("[fit_model] FATAL: Model is STILL null after compile_model!");
			throw new Error("[fit_model] Model is null after compile_model");
		}

		if (!model.layers || !model.layers.length) {
			err("[fit_model] FATAL: Model has no layers!");
			throw new Error("[fit_model] Model has no layers");
		}

		dbg("[fit_model] Model exists with " + model.layers.length + " layers.");

		// =====================================================================
		// CRITICAL: Optimizer handling
		//
		// We need a VALID optimizer that was created in the CURRENT TF.js
		// engine scope. If the optimizer was created in a different scope
		// (e.g., during page init before tf.engine().startScope() was called
		// in train_neural_network), its internal tensor slots may reference
		// a stale backend context, causing "n is undefined" / "backend is
		// undefined" errors during model.fit().
		//
		// Strategy:
		// 1. If model.optimizer exists, TEST it by calling getConfig()
		// 2. If the test fails, or optimizer is missing, create a FRESH one
		//    right here, in the current scope, and recompile.
		// =====================================================================
		var optimizer_is_valid = false;
		var optimizer_class_name = "unknown";

		if (model.optimizer) {
			try {
				// Test 1: Can we call getConfig()?
				var test_config = null;
				if (typeof model.optimizer.getConfig === "function") {
					test_config = model.optimizer.getConfig();
				}

				if (!test_config || typeof test_config !== "object") {
					wrn("[fit_model] Optimizer getConfig() returned invalid result: " + JSON.stringify(test_config));
					optimizer_is_valid = false;
				} else {
					// Test 2: Can we access the className?
					if (typeof model.optimizer.getClassName === "function") {
						optimizer_class_name = model.optimizer.getClassName();
					}

					// Test 3: Try to verify the optimizer can actually work
					// by checking if it has the minimize method
					if (typeof model.optimizer.minimize !== "function") {
						wrn("[fit_model] Optimizer has no minimize() method!");
						optimizer_is_valid = false;
					} else {
						// Test 4: Try a lightweight operation to see if backend is accessible
						try {
							var test_var = tf.scalar(1.0);
							var test_grad = tf.grad(x => x.mul(tf.scalar(2.0)));
							var test_result = test_grad(test_var);
							test_result.dispose();
							test_var.dispose();
							optimizer_is_valid = true;
						} catch (backend_test_err) {
							wrn("[fit_model] Backend accessibility test failed: " + (backend_test_err.message || backend_test_err));
							optimizer_is_valid = false;
						}
					}
				}
			} catch (opt_test_err) {
				wrn("[fit_model] Optimizer validation threw: " + (opt_test_err.message || opt_test_err));
				optimizer_is_valid = false;
			}
		} else {
			dbg("[fit_model] model.optimizer is null/undefined.");
			optimizer_is_valid = false;
		}

		if (optimizer_is_valid) {
			dbg("[fit_model] Existing optimizer VALID: " + optimizer_class_name +
				". Skipping recompilation to preserve gradient accumulator state (Adam m/v buffers).");
		} else {
			wrn("[fit_model] Optimizer is INVALID or missing. Creating fresh optimizer in current scope...");

			try {
				// Temporarily allow get_model_data to create a new optimizer
				// even though started_training is true, by using a direct approach
				var saved_started_training = started_training;
				started_training = false;
				await get_model_data();
				started_training = saved_started_training;

				if (!global_model_data || !global_model_data.optimizer) {
					err("[fit_model] FATAL: get_model_data did not produce a valid optimizer!");
					throw new Error("[fit_model] No optimizer after get_model_data");
				}

				// Compile with the fresh optimizer
				model.compile({
					optimizer: global_model_data.optimizer,
					loss: global_model_data.loss,
					metrics: [global_model_data.metric]
				});

				// Verify compilation worked
				if (!model.optimizer) {
					err("[fit_model] FATAL: model.optimizer is STILL null after compile!");
					throw new Error("[fit_model] Compilation failed - no optimizer");
				}

				optimizer_class_name = model.optimizer.getClassName ? model.optimizer.getClassName() : "unknown";
				dbg("[fit_model] Fresh optimizer created and model compiled: " + optimizer_class_name);

			} catch (recompile_err) {
				err("[fit_model] FATAL: Failed to create fresh optimizer: " + (recompile_err.message || recompile_err));
				throw recompile_err;
			}
		}

		// =====================================================================
		// Final optimizer sanity check
		// =====================================================================
		if (!model.optimizer) {
			err("[fit_model] FATAL: After all attempts, model.optimizer is null!");
			throw new Error("[fit_model] No optimizer available for training");
		}

		l(language[lang]["started_training"]);

		// =====================================================================
		// PREPARE: x and y tensors
		// =====================================================================
		let x = x_and_y["x"];
		let y = x_and_y["y"];

		if (!x) {
			err("[fit_model] FATAL: x (input data) is null or undefined!");
			throw new Error("[fit_model] x is null or undefined");
		}

		if (!y) {
			err("[fit_model] FATAL: y (label data) is null or undefined!");
			throw new Error("[fit_model] y is null or undefined");
		}

		// =====================================================================
		// GUARD: Convert to tensors if needed
		// =====================================================================
		warn_if_not_tensors(x, y);

		if (!is_tensor(x)) {
			dbg("[fit_model] x is not a tensor, converting...");
			try {
				x = tf.tensor(Array.isArray(x) ? x : array_sync(x));
				dbg("[fit_model] x converted to tensor successfully.");
			} catch (x_conv_err) {
				err("[fit_model] FATAL: Failed to convert x to tensor: " + (x_conv_err.message || x_conv_err));
				throw x_conv_err;
			}
		}

		if (!is_tensor(y)) {
			dbg("[fit_model] y is not a tensor, converting...");
			try {
				y = tf.tensor(Array.isArray(y) ? y : array_sync(y));
				dbg("[fit_model] y converted to tensor successfully.");
			} catch (y_conv_err) {
				err("[fit_model] FATAL: Failed to convert y to tensor: " + (y_conv_err.message || y_conv_err));
				throw y_conv_err;
			}
		}

		// =====================================================================
		// GUARD: Check tensor disposal status
		// =====================================================================
		if (x.isDisposed) {
			err("[fit_model] FATAL: x tensor is already disposed!");
			throw new Error("[fit_model] x tensor is disposed");
		}

		if (y.isDisposed) {
			err("[fit_model] FATAL: y tensor is already disposed!");
			throw new Error("[fit_model] y tensor is disposed");
		}

		// =====================================================================
		// GUARD: Shape logging and validation
		// =====================================================================
		const x_shape = x.shape;
		const y_shape = y.shape;

		dbg(`[fit_model] x shape: [${x_shape.join(", ")}], y shape: [${y_shape.join(", ")}]`);
		dbg(`[fit_model] x dtype: ${x.dtype}, y dtype: ${y.dtype}`);

		if (x_shape[0] === 0) {
			err("[fit_model] FATAL: x has 0 samples!");
			throw new Error("[fit_model] x has 0 samples");
		}

		if (y_shape[0] === 0) {
			err("[fit_model] FATAL: y has 0 samples!");
			throw new Error("[fit_model] y has 0 samples");
		}

		if (x_shape[0] !== y_shape[0]) {
			err(`[fit_model] FATAL: x and y have different number of samples! x: ${x_shape[0]}, y: ${y_shape[0]}`);
			throw new Error("[fit_model] x/y sample count mismatch");
		}

		// =====================================================================
		// GUARD: Label checks (classification)
		// =====================================================================
		if (y_shape.length === 2) {
			const num_samples = y_shape[0];
			const num_classes = y_shape[1];

			dbg(`[fit_model] Classification: ${num_samples} samples, ${num_classes} classes.`);

			if (num_classes <= 1) {
				wrn(`[fit_model] WARNING: y has only ${num_classes} class(es). This may cause issues with categoricalCrossentropy.`);
			}

			try {
				const y_data = y.arraySync();
				const first_label = JSON.stringify(y_data[0]);
				let all_same = true;
				for (let i = 1; i < Math.min(y_data.length, 50); i++) {
					if (JSON.stringify(y_data[i]) !== first_label) {
						all_same = false;
						break;
					}
				}
				if (all_same && num_samples > 1) {
					err(`[fit_model] CRITICAL: All y labels are IDENTICAL! First label: ${first_label}. The model cannot learn from uniform labels!`);
				}

				const class_counts = new Array(num_classes).fill(0);
				for (let i = 0; i < y_data.length; i++) {
					const max_idx = y_data[i].indexOf(Math.max(...y_data[i]));
					if (max_idx >= 0 && max_idx < num_classes) {
						class_counts[max_idx]++;
					}
				}
				dbg(`[fit_model] Class distribution: [${class_counts.join(", ")}]`);

				const empty_classes = class_counts.filter(c => c === 0).length;
				if (empty_classes > 0) {
					wrn(`[fit_model] WARNING: ${empty_classes} class(es) have ZERO samples! Classes: [${class_counts.join(", ")}]`);
				}
			} catch (label_check_err) {
				dbg(`[fit_model] Label distribution check error (non-fatal): ${label_check_err}`);
			}
		} else {
			dbg(`[fit_model] Regression or non-standard output: y_shape=[${y_shape.join(", ")}]`);
		}

		// =====================================================================
		// GUARD: Model I/O shape validation
		// =====================================================================
		try {
			var shapes_valid = validate_model_io_shapes(x_shape, y_shape);
			if (!shapes_valid) {
				err("[fit_model] WARNING: Model I/O shape validation FAILED. Training may error.");
			} else {
				dbg("[fit_model] Model I/O shape validation passed.");
			}
		} catch (shape_val_err) {
			wrn("[fit_model] Shape validation threw (non-fatal): " + (shape_val_err.message || shape_val_err));
		}

		// =====================================================================
		// GUARD: x value range check
		// =====================================================================
		try {
			const x_max_tensor = x.max();
			const x_min_tensor = x.min();
			const x_max = x_max_tensor.dataSync()[0];
			const x_min = x_min_tensor.dataSync()[0];
			x_max_tensor.dispose();
			x_min_tensor.dispose();

			dbg(`[fit_model] x range: [${x_min.toFixed(4)}, ${x_max.toFixed(4)}]`);

			if (x_max > 10) {
				wrn(`[fit_model] WARNING: x max=${x_max.toFixed(2)}. Data may not be normalized. Consider divide_by=255 for pixel values.`);
			}
			if (x_max === x_min) {
				err(`[fit_model] CRITICAL: All x values are identical (${x_max})! Model cannot learn from constant input.`);
			}
			if (isNaN(x_max) || isNaN(x_min)) {
				err(`[fit_model] CRITICAL: x contains NaN values! max=${x_max}, min=${x_min}`);
			}
			if (!isFinite(x_max) || !isFinite(x_min)) {
				err(`[fit_model] CRITICAL: x contains Infinity! max=${x_max}, min=${x_min}`);
			}
		} catch (range_err) {
			dbg(`[fit_model] x range check failed (non-fatal): ${range_err}`);
		}

		// =====================================================================
		// GUARD: Sanitize training data (remove NaN/Inf samples)
		// This prevents NaN from entering the model during training, which
		// would corrupt optimizer accumulators permanently.
		// =====================================================================
		try {
			const sanitized = sanitize_training_data(x, y);
			if (sanitized.removed > 0) {
				// Replace x and y with clean versions
				if (x !== x_and_y["x"]) {
					// x was already a copy we created, dispose it
					x.dispose();
				}
				if (y !== x_and_y["y"]) {
					y.dispose();
				}
				x = sanitized.x;
				y = sanitized.y;
				wrn(`[fit_model] Removed ${sanitized.removed} corrupted sample(s) from training data.`);
			}
		} catch (sanitize_err) {
			if (sanitize_err.message && sanitize_err.message.includes("ALL samples contain NaN")) {
				err("[fit_model] FATAL: " + sanitize_err.message);
				throw sanitize_err;
			}
			wrn("[fit_model] Data sanitization failed (non-fatal): " + (sanitize_err.message || sanitize_err));
		}

		// =====================================================================
		// GUARD: Check and repair NaN in model weights BEFORE training
		// If weights are already NaN (from a previous failed training run),
		// training will immediately produce NaN loss and corrupt the optimizer.
		// =====================================================================
		try {
			const weights_repaired = await repair_nan_weights_if_needed();
			if (weights_repaired) {
				wrn("[fit_model] Model weights contained NaN and were repaired. " +
					"Also resetting optimizer to clear corrupted accumulators...");
				await repair_nan_optimizer_if_needed();
			}
		} catch (repair_err) {
			wrn("[fit_model] Weight/optimizer NaN repair failed (non-fatal): " + (repair_err.message || repair_err));
		}


		// =====================================================================
		// GUARD: Trainability check
		// =====================================================================
		let trainable_count = 0;
		let non_trainable_count = 0;
		let total_params = 0;

		for (let li = 0; li < model.layers.length; li++) {
			const layer = model.layers[li];
			if (layer.trainable) {
				trainable_count++;
			} else {
				non_trainable_count++;
			}
			try {
				const layer_weights = layer.getWeights();
				for (let wi = 0; wi < layer_weights.length; wi++) {
					total_params += layer_weights[wi].size;
				}
			} catch (e) { /* ignore */ }
		}

		dbg(`[fit_model] Trainable layers: ${trainable_count}, Non-trainable: ${non_trainable_count}, Total params: ${total_params}`);

		if (trainable_count === 0) {
			err("[fit_model] CRITICAL: No layers are trainable! All gradients will be zero.");
		}

		if (total_params === 0) {
			err("[fit_model] CRITICAL: Model has 0 parameters! Nothing to train.");
		}

		// =====================================================================
		// GUARD: Optimizer and loss info logging
		// =====================================================================
		try {
			const opt_class = model.optimizer.getClassName ? model.optimizer.getClassName() : "unknown";
			const opt_config = model.optimizer.getConfig ? model.optimizer.getConfig() : {};
			const lr = opt_config.learningRate || opt_config.learning_rate || "?";
			dbg(`[fit_model] Optimizer: ${opt_class}, lr: ${lr}`);

			if (typeof lr === "number" && lr === 0) {
				err("[fit_model] CRITICAL: Learning rate is 0! No weight updates will occur.");
			}
			if (typeof lr === "number" && lr > 1) {
				wrn(`[fit_model] WARNING: Learning rate is very high (${lr}). Training may diverge.`);
			}
		} catch (opt_log_err) {
			dbg(`[fit_model] Could not log optimizer details: ${opt_log_err}`);
		}

		try {
			const current_loss = get_loss();
			dbg(`[fit_model] Loss function: ${current_loss}`);

			// Check loss/activation compatibility
			if (current_loss === "categoricalCrossentropy" && y_shape.length === 2 && y_shape[1] > 1) {
				const last_layer = model.layers[model.layers.length - 1];
				const last_activation = last_layer.getConfig ? last_layer.getConfig().activation : "unknown";
				if (last_activation && last_activation !== "softmax" && last_activation !== "linear") {
					wrn(`[fit_model] WARNING: Using categoricalCrossentropy but last layer activation is "${last_activation}" (expected "softmax").`);
				}
			}
		} catch (loss_check_err) {
			dbg(`[fit_model] Loss compatibility check failed (non-fatal): ${loss_check_err}`);
		}

		// =====================================================================
		// GUARD: Architecture bottleneck detection
		// =====================================================================
		try {
			for (let li = 0; li < model.layers.length; li++) {
				const layer = model.layers[li];
				const layer_class = layer.getClassName ? layer.getClassName() : "";

				if (layer_class === "Conv2D" || layer_class === "Conv1D" || layer_class === "Conv3D") {
					const config = layer.getConfig();
					if (config && config.filters !== undefined && config.filters <= 1) {
						dbg(`[fit_model] ARCHITECTURE WARNING: Layer "${layer.name}" (${layer_class}) has only ${config.filters} filter(s). This creates a severe information bottleneck and may prevent gradient flow to earlier layers.`);
					}
				}

				if (layer_class === "Dense") {
					const config = layer.getConfig();
					if (config && config.units !== undefined && config.units <= 1 && li < model.layers.length - 1) {
						wrn(`[fit_model] ARCHITECTURE WARNING: Hidden layer "${layer.name}" has only ${config.units} unit(s). This may bottleneck gradient flow.`);
					}
				}
			}
		} catch (arch_err) {
			dbg(`[fit_model] Architecture check failed (non-fatal): ${arch_err}`);
		}

		// =====================================================================
		// SAVE WEIGHTS BEFORE TRAINING (for gradient flow verification)
		// =====================================================================
		try {
			weights_before_training = model.getWeights().map(w => w.clone());
			dbg(`[fit_model] Saved ${weights_before_training.length} weight tensors for post-training gradient check.`);
		} catch (snapshot_err) {
			wrn(`[fit_model] Could not snapshot weights before training: ${snapshot_err}`);
			weights_before_training = null;
		}

		// =====================================================================
		// GUARD: Final pre-flight check - test a single forward pass
		// =====================================================================
		try {
			dbg("[fit_model] Running pre-flight forward pass test...");
			const test_x = x.slice(0, 1);
			const test_pred = model.predict(test_x);
			const test_pred_data = test_pred.dataSync();

			if (test_pred_data.some(v => isNaN(v))) {
				err("[fit_model] CRITICAL: Forward pass produces NaN BEFORE training! Model weights may be corrupted.");
			} else if (test_pred_data.some(v => !isFinite(v))) {
				err("[fit_model] CRITICAL: Forward pass produces Infinity BEFORE training!");
			} else {
				dbg(`[fit_model] Pre-flight forward pass OK. Output sample: [${Array.from(test_pred_data).slice(0, 5).map(v => v.toFixed(4)).join(", ")}${test_pred_data.length > 5 ? "..." : ""}]`);
			}

			test_pred.dispose();
			test_x.dispose();
		} catch (preflight_err) {
			wrn("[fit_model] Pre-flight forward pass failed (non-fatal): " + (preflight_err.message || preflight_err));
		}

		// =====================================================================
		// GUARD: Log memory state before training
		// =====================================================================
		try {
			const mem_info = tf.memory();
			dbg(`[fit_model] Memory before training: ${mem_info.numTensors} tensors, ${(mem_info.numBytes / 1024 / 1024).toFixed(2)} MB`);
		} catch (mem_err) {
			dbg("[fit_model] Could not read memory info: " + mem_err);
		}

		await wait_for_updated_page(2);

		// =====================================================================
		// ==================== ACTUAL TRAINING ====================
		// =====================================================================
		dbg("[fit_model] >>>>>> Calling model.fit() <<<<<<");
		dbg(`[fit_model] fit params: epochs=${fit_data.epochs}, batchSize=${fit_data.batchSize}, validationSplit=${fit_data.validationSplit}, shuffle=${fit_data.shuffle}`);

		var h = null;

		try {
			h = await model.fit(x, y, fit_data);
		} catch (fit_err) {
			var fit_err_msg = fit_err.message || ("" + fit_err);

			err("[fit_model] model.fit() THREW: " + fit_err_msg);

			// Diagnose common errors
			if (fit_err_msg.includes("backend") && fit_err_msg.includes("undefined")) {
				err("[fit_model] DIAGNOSIS: 'backend undefined' error. This means the optimizer was created in a different TF.js engine scope than where model.fit() is running. The optimizer's internal tensor slots reference a stale backend context.");
				err("[fit_model] ATTEMPTED FIX: Creating a completely fresh optimizer in the current scope and retrying...");

				try {
					await tf.ready();
					var saved_st = started_training;
					started_training = false;
					await get_model_data();
					started_training = saved_st;
					model.compile({
						optimizer: global_model_data.optimizer,
						loss: global_model_data.loss,
						metrics: [global_model_data.metric]
					});
					dbg("[fit_model] Recompiled with fresh optimizer. Retrying model.fit()...");
					h = await model.fit(x, y, fit_data);
					dbg("[fit_model] RETRY SUCCEEDED!");
				} catch (retry_err) {
					err("[fit_model] RETRY ALSO FAILED: " + (retry_err.message || retry_err));
					throw retry_err;
				}
			} else if (fit_err_msg.includes("is already disposed")) {
				err("[fit_model] DIAGNOSIS: A tensor was disposed during training. This usually means compile_model was called mid-training, disposing the model's internal tensors.");
				throw fit_err;
			} else if (fit_err_msg.includes("NaN")) {
				err("[fit_model] DIAGNOSIS: NaN encountered during training. Possible causes: learning rate too high, data not normalized, or exploding gradients.");
				throw fit_err;
			} else {
				throw fit_err;
			}
		}

		dbg("[fit_model] model.fit() completed successfully.");

		// =====================================================================
		// POST-TRAINING: Log final loss
		// =====================================================================
		if (h && h.history && h.history.loss) {
			const losses = h.history.loss;
			const final_loss = losses[losses.length - 1];
			const first_loss = losses[0];
			dbg(`[fit_model] Loss: first=${first_loss.toFixed(6)}, final=${final_loss.toFixed(6)}, delta=${(first_loss - final_loss).toFixed(6)}`);

			if (isNaN(final_loss)) {
				err("[fit_model] CRITICAL: Final loss is NaN! Training diverged.");
			}
			if (final_loss > first_loss * 10) {
				wrn("[fit_model] WARNING: Loss INCREASED significantly during training (exploding gradients?).");
			}
			if (Math.abs(first_loss - final_loss) < 1e-10 && losses.length > 1) {
				wrn("[fit_model] WARNING: Loss did not change at all during training. Possible dead model.");
			}
		} else {
			wrn("[fit_model] WARNING: No loss history available after training.");
		}

		// =====================================================================
		// POST-TRAINING: GRADIENT FLOW VERIFICATION
		// WICHTIG: Dieser Block darf NIEMALS den Optimizer ersetzen oder
		// model.compile aufrufen! Das wuerde die Akkumulatoren zerstoeren.
		// Er dient NUR der Diagnose.
		// =====================================================================
		try {
			if (weights_before_training) {
				const weights_after = model.getWeights();
				let weight_idx = 0;
				let frozen_layers = [];
				let updated_layers = [];
				let near_zero_layers = [];

				for (let li = 0; li < model.layers.length; li++) {
					const layer = model.layers[li];
					const num_weights = layer.getWeights().length;

					for (let wi = 0; wi < num_weights; wi++) {
						if (weight_idx >= weights_before_training.length || weight_idx >= weights_after.length) {
							break;
						}

						const before = weights_before_training[weight_idx];
						const after = weights_after[weight_idx];

						if (before.isDisposed || after.isDisposed) {
							weight_idx++;
							continue;
						}

						const weight_name = (layer.weights && layer.weights[wi]) ? layer.weights[wi].name : `weight_${wi}`;

						const diff = tf.tidy(() => {
							return tf.abs(tf.sub(after, before)).max().dataSync()[0];
						});

						const full_name = `${layer.name}/${weight_name}`;

						if (diff === 0) {
							frozen_layers.push(full_name);
						} else if (diff < 1e-10) {
							near_zero_layers.push(`${full_name}(${diff.toExponential(2)})`);
						} else {
							updated_layers.push(`${full_name}(${diff.toExponential(2)})`);
						}

						weight_idx++;
					}
				}

				dbg(`[fit_model] GRADIENT SUMMARY: updated=${updated_layers.length}, frozen=${frozen_layers.length}, near_zero=${near_zero_layers.length}`);

				if (updated_layers.length > 0) {
					dbg(`[fit_model] UPDATED weights: [${updated_layers.join(", ")}]`);
				}

				if (frozen_layers.length > 0) {
					wrn(`[fit_model] FROZEN weights (diff=0): [${frozen_layers.join(", ")}]`);
				}

				if (near_zero_layers.length > 0) {
					wrn(`[fit_model] NEAR-ZERO weights: [${near_zero_layers.join(", ")}]`);
				}

				if (frozen_layers.length > 0 && updated_layers.length > 0) {
					// NUR WARNEN, NICHT REPARIEREN!
					// Der Optimizer-Reset war die Ursache des Bugs.
					err(`[fit_model] VANISHING GRADIENT DETECTED: ${frozen_layers.length} weight tensor(s) did NOT update while ${updated_layers.length} did. ` +
						`Frozen: [${frozen_layers.join(", ")}]. ` +
						`Possible causes: ` +
						`(1) Architecture bottleneck, ` +
						`(2) Dead neurons after ReLU, ` +
						`(3) Learning rate too low for some layers.`);
				} else if (frozen_layers.length > 0 && updated_layers.length === 0) {
					err(`[fit_model] CRITICAL: NO weights updated at all! All ${frozen_layers.length} weight tensors are frozen. ` +
						`Check: (1) learning rate > 0, (2) layers are trainable, (3) loss function is correct, (4) data is not constant.`);
				} else if (frozen_layers.length === 0 && updated_layers.length > 0) {
					dbg(`[fit_model] GRADIENT CHECK PASSED: All ${updated_layers.length} weight tensors updated successfully.`);
				}

				// Cleanup cloned weights
				for (let wi = 0; wi < weights_before_training.length; wi++) {
					try {
						if (!weights_before_training[wi].isDisposed) {
							weights_before_training[wi].dispose();
						}
					} catch (disp_err) { /* ignore */ }
				}
				weights_before_training = null;
			}
		} catch (grad_check_err) {
			wrn(`[fit_model] Gradient flow check failed (non-fatal): ${grad_check_err}`);
			if (weights_before_training) {
				for (let wi = 0; wi < weights_before_training.length; wi++) {
					try {
						if (!weights_before_training[wi].isDisposed) {
							weights_before_training[wi].dispose();
						}
					} catch (disp_err) { /* ignore */ }
				}
				weights_before_training = null;
			}
		}

		// =====================================================================
		// POST-TRAINING: Check optimizer accumulator state - NUR DIAGNOSE
		// WICHTIG: Hier wird KEIN neuer Optimizer erstellt!
		// =====================================================================
		try {
			if (model.optimizer && typeof model.optimizer.getWeights === "function") {
				const opt_weights = await model.optimizer.getWeights();
				if (opt_weights && opt_weights.length > 0) {
					let all_zero_count = 0;
					let non_zero_count = 0;
					let nan_count = 0;
					let total_opt_weights = opt_weights.length;

					for (let ow_idx = 0; ow_idx < opt_weights.length; ow_idx++) {
						const ow = opt_weights[ow_idx];
						if (ow && ow.tensor && !ow.tensor.isDisposed) {
							const data = ow.tensor.dataSync();
							let has_nan_in_this = false;
							let max_val = 0;

							for (let di = 0; di < data.length; di++) {
								if (isNaN(data[di]) || !isFinite(data[di])) {
									has_nan_in_this = true;
									break;
								}
								const abs_val = Math.abs(data[di]);
								if (abs_val > max_val) max_val = abs_val;
							}

							if (has_nan_in_this) {
								nan_count++;
							} else if (max_val === 0) {
								all_zero_count++;
							} else {
								non_zero_count++;
							}
						}
					}

					dbg(`[fit_model] Optimizer accumulator state: ${non_zero_count}/${total_opt_weights} non-zero, ` +
						`${all_zero_count}/${total_opt_weights} all-zero, ${nan_count}/${total_opt_weights} contain NaN.`);

					if (nan_count > 0) {
						err(`[fit_model] CRITICAL: ${nan_count} optimizer accumulator(s) contain NaN! ` +
							"Performing selective repair...");
						await selective_repair_nan_optimizer_slots();
					} else if (all_zero_count === total_opt_weights && total_opt_weights > 0) {
						err("[fit_model] CRITICAL: ALL optimizer accumulators are zero after training! " +
							"This means the optimizer never received gradients. " +
							"Check: architecture bottleneck, all-zero input data, or learning rate = 0.");
					}
				}
			}
		} catch (opt_state_err) {
			dbg(`[fit_model] Optimizer state inspection failed (non-fatal): ${opt_state_err}`);
		}

		// =====================================================================
		// POST-TRAINING: Check for NaN in model weights
		// =====================================================================
		try {
			let has_nan = false;
			let has_inf = false;
			const current_weights = model.getWeights();

			for (let wi = 0; wi < current_weights.length; wi++) {
				if (current_weights[wi].isDisposed) continue;

				const w_data = current_weights[wi].dataSync();
				for (let di = 0; di < Math.min(w_data.length, 1000); di++) {
					if (isNaN(w_data[di])) {
						has_nan = true;
						break;
					}
					if (!isFinite(w_data[di])) {
						has_inf = true;
						break;
					}
				}
				if (has_nan || has_inf) break;
			}

			if (has_nan) {
				err("[fit_model] CRITICAL: Model weights contain NaN after training! Training has diverged.");
			}
			if (has_inf) {
				err("[fit_model] CRITICAL: Model weights contain Infinity after training! Exploding gradients detected.");
			}
		} catch (nan_check_err) {
			dbg(`[fit_model] NaN/Inf weight check failed (non-fatal): ${nan_check_err}`);
		}

		// =====================================================================
		// POST-TRAINING: If NaN detected in weights, repair and warn
		// =====================================================================
		if (has_nan || has_inf) {
			wrn("[fit_model] Attempting automatic NaN/Inf repair...");
			try {
				const repaired = await repair_nan_weights_if_needed();
				if (repaired) {
					await repair_nan_optimizer_if_needed();
					wrn("[fit_model] NaN repair completed. Model weights and optimizer have been reset. " +
						"Consider: (1) reducing learning rate, (2) adding gradient clipping, " +
						"(3) checking data normalization (divide_by=255).");
				}
			} catch (nan_repair_err) {
				err("[fit_model] NaN repair failed: " + (nan_repair_err.message || nan_repair_err));
			}
		}

		// =====================================================================
		// POST-TRAINING: Log memory state
		// =====================================================================
		try {
			const mem_info = tf.memory();
			dbg(`[fit_model] Memory after training: ${mem_info.numTensors} tensors, ${(mem_info.numBytes / 1024 / 1024).toFixed(2)} MB`);
		} catch (mem_err) {
			dbg("[fit_model] Could not read memory info after training: " + mem_err);
		}

		// =====================================================================
		// POST-TRAINING: Final forward pass sanity check
		// =====================================================================
		try {
			const test_x_post = x.slice(0, 1);
			const test_pred_post = model.predict(test_x_post);
			const test_pred_post_data = test_pred_post.dataSync();

			if (test_pred_post_data.some(v => isNaN(v))) {
				err("[fit_model] CRITICAL: Forward pass produces NaN AFTER training!");
			} else {
				dbg(`[fit_model] Post-training forward pass OK. Output: [${Array.from(test_pred_post_data).slice(0, 5).map(v => v.toFixed(4)).join(", ")}${test_pred_post_data.length > 5 ? "..." : ""}]`);
			}

			test_pred_post.dispose();
			test_x_post.dispose();
		} catch (post_pred_err) {
			dbg(`[fit_model] Post-training forward pass check failed (non-fatal): ${post_pred_err}`);
		}

		// =====================================================================
		// FINALIZE
		// =====================================================================
		await nextFrame();
		l(language[lang]["finished_training"]);

		assert(typeof h === "object", "history object is not of type object");
		model_is_trained = true;
		reset_predict_container_after_training();

		if (h && h.history && h.history.loss) {
			const losses = h.history.loss;
			const final_loss = losses[losses.length - 1];
			const first_loss = losses[0];
			dbg(`[fit_model] Loss summary: first=${first_loss.toFixed(6)}, final=${final_loss.toFixed(6)}, improvement=${((1 - final_loss/first_loss) * 100).toFixed(1)}%`);

			if (losses.length > 1 && final_loss >= first_loss) {
				wrn("[fit_model] WARNING: Loss did not decrease during training. Model may not be learning.");
			}
		}

		dbg("[fit_model] ========== FIT_MODEL END (SUCCESS) ==========");

		await dispose(fit_data);
		return h;

	} catch (_err) {
		// =====================================================================
		// ERROR HANDLING
		// =====================================================================
		var err_msg = "";
		if (_err && typeof _err === "object" && "message" in _err) {
			err_msg = _err.message;
		} else {
			err_msg = "" + _err;
		}

		err("[fit_model] Training failed: " + err_msg);

		// Log the full stack trace if available
		if (_err && _err.stack) {
			dbg("[fit_model] Stack trace: " + _err.stack);
		}

		// Diagnose specific error patterns
		if (err_msg.includes("backend") && err_msg.includes("undefined")) {
			err("[fit_model] DIAGNOSIS: 'backend undefined' — The optimizer was created in a different " +
				"TF.js engine scope than where model.fit() is running. This happens when " +
				"compile_model is called before tf.engine.startScope in train_neural_network, " +
				"and then model.fit() runs inside that scope.");
			err("[fit_model] ATTEMPTED FIX: Will try to recompile with a fresh optimizer in the current scope...");

			try {
				await tf.ready();
				var saved_st_err = started_training;
				started_training = false;
				await get_model_data();
				started_training = saved_st_err;

				if (global_model_data && global_model_data.optimizer) {
					model.compile({
						optimizer: global_model_data.optimizer,
						loss: global_model_data.loss,
						metrics: [global_model_data.metric]
					});
					dbg("[fit_model] Recompiled successfully. Please retry training.");
				} else {
					err("[fit_model] Could not get valid optimizer for recompilation.");
				}
			} catch (recompile_err) {
				err("[fit_model] Recompilation attempt also failed: " + (recompile_err.message || recompile_err));
			}
		} else if (err_msg.includes("is already disposed")) {
			err("[fit_model] DIAGNOSIS: A tensor was disposed during training. " +
				"This usually means compile_model or create_model was called mid-training, " +
				"disposing the model's internal tensors. Check that started_training guard is working.");
		} else if (err_msg.includes("NaN")) {
			err("[fit_model] DIAGNOSIS: NaN encountered. Possible causes: " +
				"(1) Learning rate too high, (2) Data not normalized (divide_by=255?), " +
				"(3) Exploding gradients, (4) Invalid loss function for this data type.");
		} else if (err_msg.includes("expected a batch of elements")) {
			err("[fit_model] DIAGNOSIS: Shape mismatch between data and model. " +
				"Check that input_shape matches your data dimensions.");
		}

		// Cleanup weights snapshot if it exists
		if (weights_before_training) {
			for (let wi = 0; wi < weights_before_training.length; wi++) {
				try {
					if (!weights_before_training[wi].isDisposed) {
						weights_before_training[wi].dispose();
					}
				} catch (disp_err) { /* ignore */ }
			}
			weights_before_training = null;
		}

		// Cleanup fit_data if possible
		if (fit_data && fit_data !== true && typeof fit_data === "object") {
			try {
				await dispose(fit_data);
			} catch (fd_err) {
				dbg("[fit_model] Could not dispose fit_data in error handler: " + fd_err);
			}
		}

		dbg("[fit_model] ========== FIT_MODEL END (ERROR) ==========");

		throw _err;
	}
}


async function run_neural_network (recursive=0) {
	var ret = null;

	if(!model) {
		err(`[run_neural_network] ${language[lang]["no_model_defined"]}.`);
		return;
	}

	if(!model?.layers?.length) {
		err(`[run_neural_network] ${language[lang]["no_layers"]}.`);
		return;
	}

	dbg(`[run_neural_network] Starting. ${model.layers.length} layers, recursive=${recursive}`);

	await prepare_gui_for_training();

	_set_apply_to_original_apply();

	var x_and_y = await get_x_and_y_or_die_in_case_of_error();

	if(x_and_y === false) {
		err(`[run_neural_network] get_x_and_y returned false.`);
		return;
	}

	await show_tab_label("training_tab_label", jump_to_interesting_tab());

	if(!x_and_y) {
		err(`[run_neural_network] ${language[lang]["could_not_get_xs_and_xy"]}.`);
		return;
	}

	if (x_and_y["x"] && x_and_y["y"]) {
		const x_s = is_tensor(x_and_y["x"]) ? x_and_y["x"].shape : (Array.isArray(x_and_y["x"]) ? get_shape_from_array(x_and_y["x"]) : "unknown");
		const y_s = is_tensor(x_and_y["y"]) ? x_and_y["y"].shape : (Array.isArray(x_and_y["y"]) ? get_shape_from_array(x_and_y["y"]) : "unknown");
		dbg(`[run_neural_network] Data: x=[${x_s}], y=[${y_s}]`);
	}

	var repaired = false;

	if(started_training) {
		remove_overlay();

		await set_input_shape_from_xs(x_and_y);
		prepare_site_for_training();

		// =====================================================================
		// Compile model ONCE before training starts.
		// After this point, compile_model() will be blocked by the
		// started_training guard, ensuring the optimizer state is preserved
		// throughout the entire training run.
		// =====================================================================
		if (!model || !model.optimizer) {
			dbg("[run_neural_network] Model needs compilation before training.");
			await compile_model_if_not_defined();
		} else {
			dbg("[run_neural_network] Model already has optimizer, skipping pre-training compilation.");
		}

		if (!model || !model.optimizer) {
			err("[run_neural_network] FATAL: No optimizer after compilation.");
			await gui_not_in_training();
			return;
		}

		dbg(`[run_neural_network] Ready to train. Optimizer: ${model.optimizer.getClassName ? model.optimizer.getClassName() : 'unknown'}`);

		await go_to_training_tab_label();

		["x", "y"].forEach(tensor_name => {
			if(!is_tensor(x_and_y[tensor_name])) {
				if(Array.isArray(x_and_y[tensor_name])) {
					x_and_y[tensor_name] = tensor(x_and_y[tensor_name]);
				} else {
					err(`[run_neural_network] ${tensor_name} is not a tensor nor array.`);
				}
			}
		});

		try {
			ret = await fit_model(x_and_y);
		} catch (e) {
			repaired = await handle_model_fit_error(e, repaired, recursive);
		}

		show_input_shape_repaired_message(repaired);
		await enable_everything();
		hide_training_progress_bar();
	}

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
	prepend_hr_to_training_content();

	_clear_plotly_epoch_history();
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

function prepend_hr_to_training_content () {
	$("#training_content").clone().prepend("<hr>").appendTo("#training_tab");
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

function draw_images_in_grid (images, categories, probabilities, category_overview) {
	$("#canvas_grid_visualization").html("");
	var numCategories = labels.length;

	var margin = 10;
	var scaleWidth = 40; // Width reserved for the scale on the left

	var _height = $("#canvas_grid_visualization").height();

	if(!_height) {
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
	if(is_dark_mode) {
		scaleCtx.fillStyle = "#ffffff";
		scaleCtx.strokeStyle = "#ffffff";
	} else {
		scaleCtx.fillStyle = "#000000";
		scaleCtx.strokeStyle = "#000000";
	}
	scaleCtx.textAlign = "right";

	var graphHeight = _height - margin * 2 - 50; // Account for bottom text area
	var scaleTop = margin;
	var scaleBottom = scaleTop + graphHeight;

	// Draw the vertical line for the scale axis
	scaleCtx.beginPath();
	scaleCtx.moveTo(scaleWidth - 5, scaleTop);
	scaleCtx.lineTo(scaleWidth - 5, scaleBottom);
	scaleCtx.stroke();

	// Draw scale labels and tick marks from 0 to 100
	var numTicks = 10;
	for (var tick = 0; tick <= numTicks; tick++) {
		var value = tick * 10; // 0, 10, 20, ..., 100
		var yPos = scaleBottom - (value / 100) * graphHeight;

		// Draw tick mark
		scaleCtx.beginPath();
		scaleCtx.moveTo(scaleWidth - 10, yPos);
		scaleCtx.lineTo(scaleWidth - 5, yPos);
		scaleCtx.stroke();

		// Draw label
		scaleCtx.fillText(value.toString(), scaleWidth - 12, yPos + 4);
	}

	// Draw "Certainty %" label rotated
	scaleCtx.save();
	scaleCtx.translate(12, scaleTop + graphHeight / 2);
	scaleCtx.rotate(-Math.PI / 2);
	scaleCtx.textAlign = "center";
	scaleCtx.fillText(language[lang]["certainty"] + " in %", 0, 0);
	scaleCtx.restore();

	// Append scale canvas to DOM first
	$(scaleCanvas).appendTo($("#canvas_grid_visualization"));

	// create a canvas for each category
	var canvasses = get_canvasses(numCategories, _height);

	var graphWidth = canvasses[0].width - margin * 2;
	var maxProb = 1;

	// draw y-axis labels

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

	var targetSize = Math.min(model?.input?.shape[1], model?.input?.shape[2]); // Change this to the desired size

	// draw x-axis labels and images
	for (let image_idx = 0; image_idx < images.length; image_idx++) {
		var image = images[image_idx];
		var category = categories[image_idx];
		var probability = probabilities[image_idx];

		if(real_canvas_img_counter[category] > 0) {
			var canvas_width = canvasses[0].width;

			targetSize = canvas_width / real_canvas_img_counter[category];

			targetSize = Math.min(model?.input?.shape[1], model?.input?.shape[2], targetSize); // Change this to the desired size
		}

		var xPos = margin * 1;
		var yPos = margin + graphHeight - probability / maxProb * graphHeight;

		var canvasIndex = category;
		var canvas = canvasses[canvasIndex];
		if(canvas) {
			var ctx = canvas.getContext("2d");

			// draw image
			var scale = targetSize / Math.max(image.width, image.height);
			var w = image.width * scale;
			var h = image.height * scale;

			var imageX = xPos - model?.input?.shape[2] / 2;
			imageX += canvas_img_counter[category] * targetSize;

			if(imageX < 0) {
				imageX = 0;
			}

			imageX = parse_int(imageX);

			var imageY = parse_int(yPos - h / 2);
			ctx.drawImage(image, imageX, imageY, w, h);

			canvas_img_counter[category]++;
		}
	}

	append_grid_image_to_dom(numCategories, canvasses, _height);
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
		var image_from_element;
		
		try {
			image_from_element = fromPixels(image_element);
		} catch (from_pixels_err) {
			wrn(`[cached_load_resized_image] fromPixels failed for "${image_element_xpath}": ${from_pixels_err.message || from_pixels_err}. Using zero tensor.`);
			// Create a zero tensor with the expected shape [height, width, 3]
			image_from_element = tf.zeros([
				image_element.naturalHeight || image_element.height || height || 40,
				image_element.naturalWidth || image_element.width || width || 40,
				3
			], 'int32');
		}
		
		// =====================================================================
		// GUARD: Validate pixel data integrity
		// Check for NaN/Inf in the raw pixel data. This can happen when:
		// 1. Image hasn't fully loaded (incomplete decode)
		// 2. Cross-origin image without CORS headers
		// 3. Browser bug with certain image formats
		// 4. Canvas tainted by cross-origin data
		// =====================================================================
		var needs_replacement = false;
		
		try {
			// Use tf.any(tf.isNaN(...)) for efficient GPU-side check
			var has_nan_tensor = image_from_element.isNaN().any();
			var has_nan_val = has_nan_tensor.dataSync()[0];
			has_nan_tensor.dispose();
			
			if (has_nan_val) {
				wrn(`[cached_load_resized_image] Image "${image_element_xpath}" contains NaN pixel values!`);
				needs_replacement = true;
			}
			
			if (!needs_replacement) {
				// Check for Inf
				var has_inf_tensor = tf.isInf(image_from_element.toFloat()).any();
				var has_inf_val = has_inf_tensor.dataSync()[0];
				has_inf_tensor.dispose();
				
				if (has_inf_val) {
					wrn(`[cached_load_resized_image] Image "${image_element_xpath}" contains Infinity pixel values!`);
					needs_replacement = true;
				}
			}
		} catch (check_err) {
			// Fallback: manual check on a sample
			try {
				var sample_data = image_from_element.dataSync();
				for (var pi = 0; pi < Math.min(sample_data.length, 300); pi++) {
					if (isNaN(sample_data[pi]) || !isFinite(sample_data[pi])) {
						wrn(`[cached_load_resized_image] Image "${image_element_xpath}" has invalid pixel at index ${pi}: ${sample_data[pi]}`);
						needs_replacement = true;
						break;
					}
				}
			} catch (sample_err) {
				wrn(`[cached_load_resized_image] Could not validate image data: ${sample_err}`);
				needs_replacement = true;
			}
		}
		
		if (needs_replacement) {
			err(`[cached_load_resized_image] Replacing corrupted image "${image_element_xpath}" with zero tensor to prevent NaN propagation.`);
			var replacement_shape = image_from_element.shape;
			image_from_element = tf.zeros(replacement_shape, 'float32');
		}
		
		// Resize
		var resized = resize_image(image_from_element, [height, width]);
		var _res = expand_dims(resized);

		// Divide by normalization factor
		var divide_by_val = parse_float($("#divide_by").val());
		
		// Guard against divide_by = 0 or NaN
		if (!divide_by_val || divide_by_val === 0 || isNaN(divide_by_val) || !isFinite(divide_by_val)) {
			wrn("[cached_load_resized_image] divide_by is 0/NaN/Inf! Using 255 as fallback.");
			divide_by_val = 255;
		}
		
		_res = divNoNan(_res, divide_by_val);
		
		// =====================================================================
		// FINAL GUARD: Verify the output tensor is clean
		// This catches any NaN that might have been introduced by resize or divNoNan
		// =====================================================================
		try {
			var final_nan_check = _res.isNaN().any();
			var final_has_nan = final_nan_check.dataSync()[0];
			final_nan_check.dispose();
			
			if (final_has_nan) {
				err(`[cached_load_resized_image] FINAL CHECK FAILED: Output tensor for "${image_element_xpath}" still contains NaN after processing! Replacing with zeros.`);
				var final_shape = _res.shape;
				_res = tf.zeros(final_shape, _res.dtype);
			}
		} catch (final_check_err) {
			dbg(`[cached_load_resized_image] Final NaN check failed (non-fatal): ${final_check_err}`);
		}

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

	for (var image_idx = 0; image_idx < image_elements.length; image_idx++) {
		var image_element = image_elements[image_idx];

		var image_element_xpath = get_element_xpath(image_element);
		var this_predicted_array = [];
		var src = get_src_or_error(image_element);

		if(image_idx <= _max) {
			var res_array;

			if(!image_element) {
				tf.engine().endScope();
				wrn("[visualize_train] image_element not defined!", image_element);
				continue;
			}

			var img_tensor = get_img_tensor_or_null_and_error(image_element);

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

				[categories, probabilities] = add_to_predictions_and_categories(this_predicted_array, image_element_xpath, categories, probabilities);
			} catch (e) {
				dbg(`visualize_train: Error ${e}`);
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
		$("#canvas_grid_visualization").html("");
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
