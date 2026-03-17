"use strict";

/**
 * Renders the current intermediate tensor data onto a preview canvas.
 * Called after each gradient ascent iteration for live feedback.
 */
function _render_preview_to_canvas(canvas, tensorData, layer_idx, neuron) {
	if (!canvas || !tensorData) return;

	try {
		var imageArray = tidy(() => {
			var dp = deprocess_image(tensorData);
			if (!dp) return null;
			return array_sync(dp);
		});

		if (!imageArray) return;

		var data = imageArray[0];
		scaleNestedArray(data);

		var data_hash = {
			layer: layer_idx,
			neuron: neuron,
			model_hash: "_preview_"
		};

		draw_grid(canvas, 1, data, 1, 0, null, null, data_hash, "layer_image");
	} catch (e) {
		console.warn("Preview render failed:", e);
	}
}

// ============================================================================
// Helpers extracted from draw_maximally_activated_neuron
// ============================================================================

/**
 * Sets up the preview canvas for image models, attaching it to the container.
 * Returns null if the model isn't an image model or the container is missing.
 */
function _setup_preview_canvas(layer_idx, container) {
	var isImageModel = (model?.input?.shape.length == 4 && model?.input?.shape[3] == 3);
	if (!isImageModel || !container) return null;

	var previewCanvas = get_canvas_in_class(layer_idx, "maximally_activated_class", 0, 1);
	previewCanvas.classList.add("feature-map-working");
	container.appendChild(previewCanvas);
	return previewCanvas;
}

/**
 * Resolves the iteration count from the GUI or falls back to a sensible default.
 */
function _resolve_iterations(layer_idx) {
	var isLastLayer = (layer_idx >= model.layers.length - 2);
	var defaultIterations = isLastLayer ? 200 : 30;
	var iterations = parse_int($("#max_activation_iterations").val()) || defaultIterations;
	if (!iterations) {
		log(`Iterations was set to ${iterations} in the GUI, using ${defaultIterations} instead`);
		iterations = defaultIterations;
	}
	return iterations;
}

/**
 * Marks the preview canvas as done (removes working state).
 */
function _finalize_preview_canvas(previewCanvas) {
	if (!previewCanvas) return;
	previewCanvas.classList.remove("feature-map-working");
	previewCanvas.classList.add("feature-map-done");
}

/**
 * Handles the tensor (non-image) branch of successful gradient ascent results.
 * Appends an input label and a <pre> block with the LaTeX-formatted tensor.
 */
async function _render_tensor_result(full_data, layer_idx, neuron, container) {
	var fragment = document.createDocumentFragment();
	var _tensor = tensor(full_data.data);
	var t_str = `<span class="temml_me">${array_to_latex_matrix(array_sync(_tensor))}</span>`;
	log(language[lang]["maximally_activated_tensor"] + ":", t_str);

	var inputElem = document.createElement("input");
	inputElem.style.width = "100%";
	inputElem.value = `Maximally activated tensors for Layer ${layer_idx}, Neuron ${neuron}:`;
	fragment.appendChild(inputElem);

	var pre = document.createElement("pre");
	pre.innerHTML = t_str;
	fragment.appendChild(pre);

	await dispose(_tensor);

	if (container) container.appendChild(fragment);
}

/**
 * Handles the image branch of successful gradient ascent results.
 * Draws the result onto either the existing preview canvas or a new one.
 * Returns the canvas that was drawn to.
 */
async function _render_image_result(full_data, layer_idx, neuron, previewCanvas, container) {
	var data = full_data.image[0];
	var data_hash = {
		layer: layer_idx,
		neuron: neuron,
		model_hash: await get_model_config_hash()
	};
	scaleNestedArray(data);

	if (previewCanvas) {
		draw_grid(previewCanvas, 1, data, 1, 0, "predict_maximally_activated(this, 'image')", null, data_hash, "layer_image");
		return previewCanvas;
	} else {
		var fragment = document.createDocumentFragment();
		var canvas = get_canvas_in_class(layer_idx, "maximally_activated_class", 0, 1);
		draw_grid(canvas, 1, data, 1, 0, "predict_maximally_activated(this, 'image')", null, data_hash, "layer_image");
		fragment.appendChild(canvas);
		if (container) container.appendChild(fragment);
		return canvas;
	}
}

/**
 * Processes a successful gradient ascent result — dispatches to the tensor
 * or image renderer and collects canvasses.
 */
async function _handle_successful_ascent(full_data, layer_idx, neuron, previewCanvas, container, canvasses) {
	if (full_data.data) {
		await _render_tensor_result(full_data, layer_idx, neuron, container);
	} else if (full_data.image) {
		var canvas = await _render_image_result(full_data, layer_idx, neuron, previewCanvas, container);
		canvasses.push(canvas);
	}
	show_tab_label("maximally_activated_label", 1);
}

// ============================================================================
// Refactored main function — now a slim orchestrator
// ============================================================================

async function draw_maximally_activated_neuron(layer_idx, neuron, max_neurons) {
	var canvasses = [];
	var original_disable_layer_debuggers = disable_layer_debuggers;
	disable_layer_debuggers = 1;

	var container = document.getElementById("maximally_activated_content");
	var previewCanvas = _setup_preview_canvas(layer_idx, container);

	try {
		var iterations = _resolve_iterations(layer_idx);

		var full_data = await input_gradient_ascent(
			layer_idx, neuron, iterations, undefined, max_neurons, 0,
			previewCanvas
		);

		disable_layer_debuggers = original_disable_layer_debuggers;
		_finalize_preview_canvas(previewCanvas);

		if (full_data["worked"]) {
			await _handle_successful_ascent(full_data, layer_idx, neuron, previewCanvas, container, canvasses);
		}
	} catch (e) {
		_finalize_preview_canvas(previewCanvas);
		await write_error(e, null, null);
		show_tab_label("visualization_tab", 1);
		show_tab_label("fcnn_tab_label", 1);
		return false;
	}

	await nextFrame();
	return canvasses;
}

async function draw_single_maximally_activated_neuron(layer_idx, neurons, is_recursive, type) {
	var canvasses = [];
	var container = document.getElementById("maximally_activated_content");

	var $msgWrapper = $("#generate_images_msg_wrapper");
	var $msg = $("#generate_images_msg");
	$msgWrapper.hide();
	$msg.html("");

	for (var neuron_idx = neurons - 1; neuron_idx >= 0; neuron_idx--) {
		if (stop_generating_images) {
			info(language[lang]["stopped_generating_images_because_button_was_clicked"]);
			continue;
		}

		var base_msg = `${language[lang]["generating_image_for_neuron"]} ${neuron_idx + 1} ${language[lang]["of"]} ${neurons}`;

		await draw_maximally_activated_neuron_with_retries(base_msg, layer_idx, neurons, neuron_idx, is_recursive, type, canvasses, neurons);
	}

	log(language[lang]["done_generating_feature_maps"]);
	return canvasses;
}

async function draw_maximally_activated_neuron_with_retries(base_msg, layer_idx, neurons, neuron_idx, is_recursive, type, canvasses, max_neurons) {
	var tries_left = 3;
	try {
		l(base_msg);
		const canvas = await draw_maximally_activated_neuron(layer_idx, neurons - neuron_idx - 1, max_neurons);
		canvasses.push(canvas);
	} catch (e) {
		tries_left = await handle_draw_maximally_activated_neuron_multiple_times_error(e, is_recursive, tries_left, canvasses, layer_idx, type);
	}
}

async function handle_draw_maximally_activated_neuron_multiple_times_error(e, is_recursive, tries_left, canvasses, layer_idx, type) {
	currently_generating_images = false;

	if (("" + e).includes("already disposed") || ("" + e).includes("is disposed") || ("" + e).includes("Tensor or TensorLike, but got 'null'")) {
		if (!is_recursive) {
			while (tries_left) {
				await delay(200);
				try {
					l(`${language[lang]["failed_try_again"]}...`);
					canvasses.push(await draw_maximally_activated_layer(layer_idx, type, 1));
				} catch (e) {
					if (("" + e).includes("already disposed") || ("" + e).includes("is disposed")) {
						err("" + e);
					} else {
						throw new Error(e);
					}
				}
				tries_left--;
			}
		} else {
			log(language[lang]["already_disposed_in_draw_maximally_activated_neuron_recursive_ignore"]);
		}
	} else {
		throw new Error(e);
	}

	return tries_left;
}

function _get_neurons_last_layer(layer_idx, type) {
	typeassert(layer_idx, int, "layer_idx");
	typeassert(type, string, "type");

	var neurons = 1;

	if (!Object.keys(model).includes("layers")) {
		wrn(language[lang]["cannot_get_model_layers"]);
		return false;
	}

	if (!Object.keys(model.layers).includes("" + layer_idx)) {
		wrn(`${language[lang]["cannot_get_model_layers"]}[${layer_idx}]`);
		return false;
	}

	if (type.includes("conv")) {
		neurons = model?.layers[layer_idx].filters;
	} else if (type == "dense") {
		neurons = model?.layers[layer_idx]?.units;
	} else if (type == "flatten") {
		neurons = 1;
	} else {
		dbg(language[lang]["unknown_layer"] + " " + layer_idx);
		return false;
	}

	return neurons;
}

// ============================================================================
// UI helpers for draw_maximally_activated_layer
// ============================================================================

function _find_layer_button(layer_idx) {
	var button = $($(".layer_setting")[layer_idx]).find(".visualize_layer_button");
	if (!button.length) {
		console.error("Button not found for layer_idx:", layer_idx);
		dbg("Button not found, exiting function");
		return null;
	}
	dbg("Button found for layer_idx: " + layer_idx);
	return button;
}

function _set_button_color(button, color) {
	(function(btn) {
		requestAnimationFrame(function() {
			if (btn && btn.style) btn.style.backgroundColor = color;
		});
	})(button[0]);
}

function _stop_running_generation(button) {
	console.log("Generation is already running, stopping...");
	dbg("Generation running, setting stop flag");
	stop_generating_images = 1;
	_set_button_color(button, "");
	dbg("Button color reset after stopping generation");
}

function _prepare_ui_for_generation(button, layer_idx) {
	(function(btn) {
		requestAnimationFrame(function() {
			if (btn) {
				btn.style.backgroundColor = "red";
			}

			show_tab_label("maximally_activated_label", 1);

			if (jump_to_interesting_tab()) {
				$("#visualization_tab_label").click();
				$("#visualization_tab_label").click();
				dbg("Jumped to interesting tab and clicked visualization tab label");
			}

			document.body.style.cursor = "wait";
			add_header_to_maximally_activated_content(layer_idx);
		});
	})(button[0]);

	dbg("Starting generation, button set to red and UI prepared");
}

async function _teardown_ui_after_generation(button) {
	hide_stuff_after_generating_maximally_activated_neurons();
	dbg("Hid unnecessary elements after generating neurons");

	console.log("Done generating images");
	dbg("Generation done");

	stop_generating_images = false;
	currently_generating_images = false;
	dbg("Flags reset: stop_generating_images=false, currently_generating_images=false");

	_set_button_color(button, "");
	(function(btn) {
		requestAnimationFrame(function() {
			document.body.style.cursor = "default";
		});
	})(button[0]);

	favicon_default();
	dbg("Favicon reset to default");

	set_document_title(original_title);
	dbg("Document title reset");

	await allow_editable_labels();
	dbg("Editable labels allowed");

	reset_cursor();
	dbg("Cursor reset to default");

	if (!(started_training || model.isTraining)) {
		await gui_not_in_training(0);
		dbg("GUI set to not in training mode");
	}
}

async function _resolve_neurons_or_bail(layer_idx, type, button) {
	var neurons = _get_neurons_last_layer(layer_idx, type);
	dbg("Neurons obtained from last layer");

	if (typeof neurons == "boolean" && !neurons) {
		currently_generating_images = false;
		stop_generating_images = false;
		_set_button_color(button, "");
		err("Cannot determine number of neurons in the last layer");
		dbg("Error: Cannot determine number of neurons, exiting function");
		return null;
	}

	return neurons;
}

// ============================================================================
// Main orchestrator — now delegates to focused helpers
// ============================================================================
async function draw_maximally_activated_layer(layer_idx, type, is_recursive = 0) {
	var button = _find_layer_button(layer_idx);
	if (!button) return;

	if (currently_generating_images) {
		_stop_running_generation(button);
		return;
	}

	_prepare_ui_for_generation(button, layer_idx);

	await nextFrame();
	dbg("Next frame awaited");

	await gui_in_training(0);
	dbg("GUI checked for training mode");

	await wait_for_images_to_be_generated();
	dbg("Waited for images to be generated");

	currently_generating_images = true;
	dbg("currently_generating_images set to true");

	var neurons = await _resolve_neurons_or_bail(layer_idx, type, button);
	if (neurons === null) return;

	favicon_spinner();
	dbg("Favicon spinner started");

	var canvasses;
	try {
		canvasses = await draw_single_maximally_activated_neuron(layer_idx, neurons, is_recursive, type);
		dbg("draw_single_maximally_activated_neuron completed");
	} catch (err) {
		console.error("Error while drawing neurons:", err);
		dbg("Caught error while drawing neurons");
	}

	await _teardown_ui_after_generation(button);

	return canvasses;
}

function add_header_to_maximally_activated_content(layer_idx) {
	var fragment = document.createDocumentFragment();
	var h2 = document.createElement("h2");
	h2.className = 'h2_maximally_activated_layer_contents';

	var input = document.createElement("input");
	input.id = `max_activated_input_text_${uuidv4()}`;
	input.style.width = "100%";
	input.value = `Layer ${layer_idx + get_types_in_order(layer_idx)}`;

	h2.appendChild(input);
	fragment.appendChild(h2);

	var container = document.getElementById("maximally_activated_content");
	if (container) container.appendChild(fragment);
}

function hide_stuff_after_generating_maximally_activated_neurons() {
	$("#generate_images_msg_wrapper").hide();
	$("#generate_images_msg").html("");
}

function reset_cursor() {
	$("body").css("cursor", "default");
}

function get_types_in_order(layer_idx) {
	var types_in_order = "";
	if (get_number_of_layers() - 1 == layer_idx && labels && labels.length) {
		types_in_order = " (" + labels.join(", ") + ")";
	}

	return types_in_order;
}

async function predict_maximally_activated(item, force_category) {
	if (typeof item != "object") throw new Error("item is not an object");

	dbg("Getting results");
	var results;
	try {
		results = await predict(item);
		dbg("Got results");
	} catch (e) {
		err(e && e.message ? e.message : e);
		return;
	}

	if (!results) {
		err(language[lang]["results_is_empty_in"] + " predict_maximally_activated");
		return;
	}

	var el = $(item)[0];

	dbg("Removing old prediction element");
	var old = el.__max_pred;
	if (old) old.remove();

	dbg("Creating prediction element off-DOM");
	var pre = document.createElement("pre");
	pre.className = "maximally_activated_predictions";

	var temp = document.createElement("div");
	temp.innerHTML = results;
	pre.appendChild(temp);

	pre.style.visibility = "hidden";

	el.insertAdjacentElement("afterend", pre);
	el.__max_pred = pre;

	pre.style.visibility = "";

	dbg("Inserted prediction element");
}

async function wait_for_images_to_be_generated() {
	if (currently_generating_images) {
		l(language[lang]["cannot_predict_two_layers_at_the_same_time"] + "...");

		while (currently_generating_images) {
			await delay(500);
		}
	}

	await wait_for_updated_page(3);
}

function handle_scaled_grads_error(e) {
	if (Object.keys(e).includes("message")) {
		e = e.message;
	}

	err(`${language[lang]["inside_scaled_grads_creation_error"]}: ${e}`);
}

// ============================================================================
// IMPROVEMENT #2: Total Variation regularization
// Penalizes high-frequency pixel differences to suppress checkerboard noise
// while preserving meaningful edges.
// ============================================================================
function _compute_tv_gradients(data, tvWeight) {
	return tidy(() => {
		var h = data.shape[1];
		var w = data.shape[2];

		if (h < 3 || w < 3) {
			return tf.zerosLike(data);
		}

		var dx = tf.sub(
			data.slice([0, 0, 1, 0], [-1, -1, w - 1, -1]),
			data.slice([0, 0, 0, 0], [-1, -1, w - 1, -1])
		);
		var dy = tf.sub(
			data.slice([0, 1, 0, 0], [-1, h - 1, -1, -1]),
			data.slice([0, 0, 0, 0], [-1, h - 1, -1, -1])
		);

		var dxSign = tf.sign(dx);
		var dySign = tf.sign(dy);

		var dxPadded = tf.pad(dxSign, [[0,0],[0,0],[1,0],[0,0]]);
		var dxPaddedShift = tf.pad(dxSign, [[0,0],[0,0],[0,1],[0,0]]);
		var tvGradX = tf.sub(dxPadded, dxPaddedShift);

		var dyPadded = tf.pad(dySign, [[0,0],[1,0],[0,0],[0,0]]);
		var dyPaddedShift = tf.pad(dySign, [[0,0],[0,1],[0,0],[0,0]]);
		var tvGradY = tf.sub(dyPadded, dyPaddedShift);

		var tvGrad = tf.add(tvGradX, tvGradY);
		return tf.mul(tvGrad, tf.scalar(tvWeight));
	});
}

// ============================================================================
// Lightweight spatial jitter helpers (translation only — safe for all sizes)
// Rotation and scale jitter are DISABLED for small images (<64px) because
// repeated bilinear interpolation destroys them.
// ============================================================================
function _should_use_transform_jitter(h, w) {
	return (h >= 64 && w >= 64);
}

function _apply_rotation_jitter(data, angleDeg) {
	return tidy(() => {
		var angleRad = angleDeg * Math.PI / 180.0;
		if (tf.image && tf.image.rotateWithOffset) {
			return tf.image.rotateWithOffset(data, angleRad, 0, 0.5);
		}
		return tf.clone(data);
	});
}

function _apply_scale_jitter(data, scaleFactor, origH, origW) {
	return tidy(() => {
		if (Math.abs(scaleFactor - 1.0) < 0.001) return tf.clone(data);
		var h = data.shape[1];
		var w = data.shape[2];
		var newH = Math.max(2, Math.round(h * scaleFactor));
		var newW = Math.max(2, Math.round(w * scaleFactor));

		var resized = tf.image.resizeBilinear(data, [newH, newW]);

		if (newH >= origH && newW >= origW) {
			var startH = Math.floor((newH - origH) / 2);
			var startW = Math.floor((newW - origW) / 2);
			return resized.slice([0, startH, startW, 0], [data.shape[0], origH, origW, data.shape[3]]);
		} else {
			var padTop = Math.floor((origH - newH) / 2);
			var padBottom = origH - newH - padTop;
			var padLeft = Math.floor((origW - newW) / 2);
			var padRight = origW - newW - padLeft;
			return tf.pad(resized, [[0,0],[padTop, padBottom],[padLeft, padRight],[0,0]]);
		}
	});
}

// ============================================================================
// IMPROVEMENT #5: Better initialization
// For small images: slightly noisy gray. For larger: low-freq upscaled noise.
// ============================================================================
function _create_init_image(shape) {
	return tidy(() => {
		var h = shape[0];
		var w = shape[1];
		var c = shape[2];

		if (h <= 32 || w <= 32) {
			// Small images: start with gray + small noise
			// This avoids the blob artifacts from upscaling tiny noise
			return clipByValue(
				tf.add(
					tf.fill([1, h, w, c], 0.5),
					tf.randomNormal([1, h, w, c], 0.0, 0.01)
				),
				0, 1
			);
		} else {
			// Larger images: low-frequency noise for coherent starting point
			var smallH = Math.max(4, Math.floor(h / 4));
			var smallW = Math.max(4, Math.floor(w / 4));
			var smallNoise = tf.randomNormal([1, smallH, smallW, c], 0.0, 1.0);
			var upscaled = tf.image.resizeBilinear(smallNoise, [h, w]);
			var mean = upscaled.mean();
			var variance = tf.moments(upscaled).variance;
			var std = tf.sqrt(tf.add(variance, tf.scalar(1e-5)));
			var normalized = tf.div(tf.sub(upscaled, mean), std);
			return clipByValue(
				tf.add(tf.mul(normalized, tf.scalar(0.1)), tf.scalar(0.5)),
				0, 1
			);
		}
	});
}

// ============================================================================
// Configuration builder — extracts all the setup logic from the main loop
// ============================================================================
function _build_ascent_config(layer_idx, iterations, fullH, fullW, new_input_shape) {
	var imageSize = Math.min(fullH, fullW);
	var numChannels = new_input_shape[new_input_shape.length - 1];

	var jitterMax = Math.max(1, Math.floor(imageSize / 16));
	var useTransformJitter = _should_use_transform_jitter(fullH, fullW);

	var decayRate = 0.995;
	var decayInterval = 4;

	var isLastLayer = (layer_idx === model.layers.length - 1);
	var defaultLR = isLastLayer ? 0.5 : 0.15;
	var learningRate = parse_float($("#max_activation_lr").val()) || defaultLR;

	var tvWeight = 0.0003;
	var tvInterval = 3;

	var blurPhases = [];
	if (imageSize >= 16 && iterations >= 12) {
		var phase1End = Math.floor(iterations * 0.33);
		var phase2End = Math.floor(iterations * 0.66);
		blurPhases = [
			{ until: phase1End, factor: Math.max(2, Math.floor(imageSize / 8)) },
			{ until: phase2End, factor: Math.max(2, Math.floor(imageSize / 16)) },
			{ until: iterations, factor: 0 }
		];
	} else {
		blurPhases = [{ until: iterations, factor: 0 }];
	}

	return {
		imageSize, numChannels, jitterMax, useTransformJitter,
		decayRate, decayInterval, learningRate,
		tvWeight, tvInterval, blurPhases, fullH, fullW
	};
}

// ============================================================================
// Determine the current blur factor from the phase schedule
// ============================================================================
function _get_current_blur_factor(blurPhases, iteration_idx) {
	for (var p = 0; p < blurPhases.length; p++) {
		if (iteration_idx < blurPhases[p].until) {
			return blurPhases[p].factor;
		}
	}
	return 0;
}

// ============================================================================
// Apply spatial translation jitter (shift image by random offset)
// ============================================================================
function _apply_spatial_jitter(data, ox, oy) {
	return tidy(() => {
		var h = data.shape[1];
		var w = data.shape[2];
		var padded = tf.pad(data, [
			[0, 0],
			[Math.max(ox, 0), Math.max(-ox, 0)],
			[Math.max(oy, 0), Math.max(-oy, 0)],
			[0, 0]
		]);
		return tf.slice(padded,
			[0, Math.max(-ox, 0), Math.max(-oy, 0), 0],
			[data.shape[0], h, w, data.shape[3]]
		);
	});
}

// ============================================================================
// Undo spatial translation jitter (reverse the shift)
// ============================================================================
function _undo_spatial_jitter(data, ox, oy) {
	return tidy(() => {
		var h = data.shape[1];
		var w = data.shape[2];
		var padded = tf.pad(data, [
			[0, 0],
			[Math.max(-ox, 0), Math.max(ox, 0)],
			[Math.max(-oy, 0), Math.max(oy, 0)],
			[0, 0]
		]);
		return tf.slice(padded,
			[0, Math.max(ox, 0), Math.max(oy, 0), 0],
			[data.shape[0], h, w, data.shape[3]]
		);
	});
}

// ============================================================================
// Apply and undo transform jitter (rotation + scale, large images only)
// ============================================================================
async function _apply_transform_jitter_forward(data, rotAngle, scaleJitter, fullH, fullW) {
	var rotated = _apply_rotation_jitter(data, rotAngle);
	await dispose(data);
	var scaled = _apply_scale_jitter(rotated, scaleJitter, fullH, fullW);
	await dispose(rotated);
	return scaled;
}

async function _undo_transform_jitter(data, rotAngle, scaleJitter, fullH, fullW) {
	var unRotated = _apply_rotation_jitter(data, -rotAngle);
	await dispose(data);
	var unScaled = _apply_scale_jitter(unRotated, 1.0 / scaleJitter, fullH, fullW);
	await dispose(unRotated);
	return unScaled;
}

// ============================================================================
// Compute blurred version of data for coarse-to-fine gradient computation
// ============================================================================
function _compute_blurred_data_for_grad(data, currentBlurFactor, fullH, fullW) {
	if (currentBlurFactor < 2) {
		return { dataForGrad: data, needDispose: false };
	}
	var blurH = Math.max(2, Math.round(fullH / currentBlurFactor));
	var blurW = Math.max(2, Math.round(fullW / currentBlurFactor));
	var dataForGrad = tidy(() => {
		var down = tf.image.resizeBilinear(data, [blurH, blurW]);
		return tf.image.resizeBilinear(down, [fullH, fullW]);
	});
	return { dataForGrad: dataForGrad, needDispose: true };
}

// ============================================================================
// Compute normalized (RMS-scaled) gradients
// ============================================================================
function _compute_scaled_gradients(grad_function, dataForGrad) {
	try {
		return tidy(() => {
			var grads = grad_function(dataForGrad);
			var grads_sq = tf_square(grads);
			var grads_sq_mean = tf_mean(grads_sq);
			var rms = sqrt(grads_sq_mean);
			var eps = get_epsilon();
			var norm = tf_add(rms, tf_constant_shape(eps, rms));
			return tf_div(grads, norm);
		});
	} catch (e) {
		handle_scaled_grads_error(e);
		return null;
	}
}

// ============================================================================
// Apply gradient step, L2 decay, and TV regularization
// ============================================================================
async function _apply_gradient_update(data, scaledGrads, learningRate, iteration_idx, config) {
	// Gradient step
	var updated = tidy(() => {
		var step = tf_mul(scaledGrads, tf_constant_shape(learningRate, scaledGrads));
		return tf_add(data, step);
	});
	await dispose(scaledGrads);
	await dispose(data);
	data = updated;

	// L2 decay
	if (iteration_idx % config.decayInterval === 0) {
		var decayed = tidy(() => tf_mul(data, tf_constant_shape(config.decayRate, data)));
		await dispose(data);
		data = decayed;
	}

	// TV regularization
	if (iteration_idx % config.tvInterval === 0 && iteration_idx > 0) {
		var tvGrad = _compute_tv_gradients(data, config.tvWeight);
		var tvRegularized = tidy(() => tf.sub(data, tvGrad));
		await dispose(tvGrad);
		await dispose(data);
		data = tvRegularized;
	}

	return data;
}

// ============================================================================
// Ensure tensor dimensions haven't drifted from expected shape
// ============================================================================
async function _ensure_correct_dimensions(data, fullH, fullW) {
	if (data.shape[1] !== fullH || data.shape[2] !== fullW) {
		var resizedBack = tidy(() => tf.image.resizeBilinear(data, [fullH, fullW]));
		await dispose(data);
		return resizedBack;
	}
	return data;
}

// ============================================================================
// Step 1–2: Apply all forward jitter (spatial + transform)
// ============================================================================
async function _apply_forward_jitter(data, config) {
	var ox = Math.floor(Math.random() * (config.jitterMax * 2 + 1)) - config.jitterMax;
	var oy = Math.floor(Math.random() * (config.jitterMax * 2 + 1)) - config.jitterMax;

	var jittered = _apply_spatial_jitter(data, ox, oy);
	await dispose(data);
	data = jittered;

	var rotAngle = 0;
	var scaleJitter = 1.0;

	if (config.useTransformJitter) {
		rotAngle = (Math.random() - 0.5) * 4.0;
		scaleJitter = 1.0 + (Math.random() - 0.5) * 0.06;
		data = await _apply_transform_jitter_forward(data, rotAngle, scaleJitter, config.fullH, config.fullW);
	}

	return { data, ox, oy, rotAngle, scaleJitter };
}

// ============================================================================
// Steps 3–4: Compute gradients (with optional coarse-to-fine blur)
// ============================================================================
async function _compute_gradients_for_iteration(data, config, grad_function, iteration_idx) {
	var currentBlurFactor = _get_current_blur_factor(config.blurPhases, iteration_idx);
	var { dataForGrad, needDispose: needDisposeBlurred } = _compute_blurred_data_for_grad(
		data, currentBlurFactor, config.fullH, config.fullW
	);

	var scaledGrads = _compute_scaled_gradients(grad_function, dataForGrad);

	if (needDisposeBlurred) {
		await dispose(dataForGrad);
	}

	return scaledGrads;
}

// ============================================================================
// Steps 8–10: Undo all jitter and ensure correct dimensions
// ============================================================================
async function _undo_jitter_and_stabilize(data, ox, oy, rotAngle, scaleJitter, config) {
	// Undo spatial jitter
	var unJittered = _undo_spatial_jitter(data, ox, oy);
	await dispose(data);
	data = unJittered;

	// Undo transform jitter
	if (config.useTransformJitter) {
		data = await _undo_transform_jitter(data, rotAngle, scaleJitter, config.fullH, config.fullW);
	}

	// Safety: ensure dimensions haven't drifted
	data = await _ensure_correct_dimensions(data, config.fullH, config.fullW);

	return data;
}

// ============================================================================
// Step 11: Render live preview if due
// ============================================================================
async function _maybe_render_preview(data, iteration_idx, iterations, previewInterval, previewCanvas, layer_idx, neuron) {
	if (previewCanvas && (iteration_idx % previewInterval === 0 || iteration_idx === iterations - 1)) {
		_render_preview_to_canvas(previewCanvas, data, layer_idx, neuron);
		await nextFrame();
	}
}

// ============================================================================
// Single iteration of gradient ascent — now a slim orchestrator
// ============================================================================
async function _run_single_iteration(data, iteration_idx, iterations, config, grad_function, layer_idx, neuron, max_neurons, previewCanvas, previewInterval) {
	log(`Layer ${layer_idx}, neuron ${neuron + 1}/${max_neurons}, iteration ${iteration_idx + 1}/${iterations}`);

	if (stop_generating_images) return { data: data, worked: false };

	// Steps 1–2: Apply forward jitter
	var jitterState = await _apply_forward_jitter(data, config);
	data = jitterState.data;

	// Steps 3–4: Compute gradients
	var scaledGrads = await _compute_gradients_for_iteration(data, config, grad_function, iteration_idx);

	if (!scaledGrads) {
		return { data: data, worked: false };
	}

	// Steps 5–7: Gradient step, L2 decay, TV regularization
	data = await _apply_gradient_update(data, scaledGrads, config.learningRate, iteration_idx, config);

	// Steps 8–10: Undo jitter and stabilize dimensions
	data = await _undo_jitter_and_stabilize(data, jitterState.ox, jitterState.oy, jitterState.rotAngle, jitterState.scaleJitter, config);

	// Step 11: Live preview
	await _maybe_render_preview(data, iteration_idx, iterations, previewInterval, previewCanvas, layer_idx, neuron);

	return { data: data, worked: true };
}

// ============================================================================
// Post-process generated data into image or raw tensor output
// ============================================================================
function _postprocess_generated_data(generated_data, full_data) {
	if (model?.input?.shape.length == 4 && model?.input?.shape[3] == 3) {
		try {
			full_data["image"] = tidy(() => {
				return array_sync(tidy(() => {
					var dp = deprocess_image(generated_data);
					if (!dp) {
						err(language[lang]["deprocess_image_returned_empty_image"]);
						full_data["worked"] = 0;
					}
					return dp;
				}));
			});
		} catch (e) {
			if (Object.keys(e).includes("message")) {
				e = e.message;
			}
			console.log("generated_data: ", generated_data);
			err("" + e);
			full_data["worked"] = 0;
		}
	} else {
		full_data["data"] = array_sync(generated_data);
	}
	return full_data;
}

// ============================================================================
// Model & gradient function setup
// ============================================================================
function _build_aux_model_and_grad(layer_idx, neuron) {
	var layer_output = model.getLayer(null, layer_idx).getOutputAt(0);
	var aux_model = tf_model({ inputs: model.inputs, outputs: layer_output });

	var lossFunction = function(input) {
		return aux_model.apply(input, { training: true }).gather([neuron], -1).mean();
	};
	var grad_function = grad(lossFunction);

	return { aux_model: aux_model, grad_function: grad_function };
}

// ============================================================================
// Initialize or accept a starting image
// ============================================================================
function _initialize_image(start_image, new_input_shape) {
	if (typeof start_image !== "undefined") {
		return start_image;
	}
	return _create_init_image(new_input_shape);
}

// ============================================================================
// Compute preview interval from iteration count
// ============================================================================
function _compute_preview_interval(iterations) {
	if (iterations <= 20) return 1;
	return Math.max(1, Math.floor(iterations / 20));
}

// ============================================================================
// Run the main gradient ascent loop over all iterations
// ============================================================================
async function _run_ascent_loop(data, iterations, config, grad_function, layer_idx, neuron, max_neurons, previewCanvas, previewInterval) {
	var worked = 0;

	for (var iteration_idx = 0; iteration_idx < iterations; iteration_idx++) {
		var result = await _run_single_iteration(
			data, iteration_idx, iterations, config, grad_function,
			layer_idx, neuron, max_neurons, previewCanvas, previewInterval
		);
		data = result.data;
		if (result.worked) worked = 1;
	}

	return { data: data, worked: worked };
}

// ============================================================================
// Post-process generated data into image or raw tensor output
// ============================================================================
function _postprocess_generated_data(generated_data, full_data) {
	if (model?.input?.shape.length == 4 && model?.input?.shape[3] == 3) {
		try {
			full_data["image"] = tidy(() => {
				return array_sync(tidy(() => {
					var dp = deprocess_image(generated_data);
					if (!dp) {
						err(language[lang]["deprocess_image_returned_empty_image"]);
						full_data["worked"] = 0;
					}
					return dp;
				}));
			});
		} catch (e) {
			if (Object.keys(e).includes("message")) {
				e = e.message;
			}
			console.log("generated_data: ", generated_data);
			err("" + e);
			full_data["worked"] = 0;
		}
	} else {
		full_data["data"] = array_sync(generated_data);
	}
	return full_data;
}

// ============================================================================
// Handle errors during gradient ascent (retry on disposed tensors)
// ============================================================================
async function _handle_ascent_error(e, recursion, layer_idx, neuron, iterations, start_image) {
	if (("" + e).includes("is already disposed")) {
		await compile_model();
		if (recursion < 20) {
			await delay(recursion * 1000);
			return await input_gradient_ascent(layer_idx, neuron, iterations, start_image, undefined, recursion + 1);
		} else {
			throw new Error("Too many retries for input_gradient_ascent");
		}
	} else {
		throw new Error("Error 12: " + e);
	}
}

// ============================================================================
// Core gradient ascent — now a clean orchestrator
// ============================================================================
async function input_gradient_ascent(layer_idx, neuron, iterations, start_image, max_neurons, recursion, previewCanvas) {
	if (typeof recursion === "undefined") recursion = 0;

	typeassert(layer_idx, int, "layer_idx");
	typeassert(neuron, int, "neuron");
	typeassert(iterations, int, "iterations");
	typeassert(recursion, int, "recursion");

	var full_data = {};
	var previewInterval = _compute_preview_interval(iterations);

	try {
		// Step 1: Build auxiliary model and gradient function
		var { aux_model, grad_function } = _build_aux_model_and_grad(layer_idx, neuron);

		// Step 2: Determine input shape and build config
		var new_input_shape = get_input_shape_with_batch_size();
		new_input_shape.shift();
		var fullH = new_input_shape[0];
		var fullW = new_input_shape[1];
		var config = _build_ascent_config(layer_idx, iterations, fullH, fullW, new_input_shape);

		// Step 3: Initialize starting image
		var data = _initialize_image(start_image, new_input_shape);

		// Step 4: Run the iteration loop
		var loopResult = await _run_ascent_loop(
			data, iterations, config, grad_function,
			layer_idx, neuron, max_neurons, previewCanvas, previewInterval
		);

		var generated_data = loopResult.data;
		var worked = loopResult.worked;

	} catch (e) {
		return await _handle_ascent_error(e, recursion, layer_idx, neuron, iterations, start_image);
	}

	// Step 5: Post-process and return
	full_data = _postprocess_generated_data(generated_data, full_data);
	await dispose(generated_data);
	full_data["worked"] = worked;

	return full_data;
}

async function handle_input_gradient_descent_error(e, recursion, layer_idx, neuron, iterations, start_image) {
	if (("" + e).includes("is already disposed")) {
		await compile_model();
		if (recursion < 20) {
			await delay(recursion * 1000);
			return await input_gradient_ascent(layer_idx, neuron, iterations, start_image, undefined, recursion + 1);
		} else {
			throw new Error("Too many retries for input_gradient_ascent");
		}
	} else {
		throw new Error("Error 12: " + e);
	}
}

// ============================================================================
// deprocess_image — refactored into focused helpers
// ============================================================================

/**
 * Clips each channel of a tensor to mean ± 2*std to remove outliers.
 */
function _clip_channels_by_std(x, numChannels) {
	return tidy(() => {
		var channels = tf.split(x, numChannels, -1);
		var clippedChannels = channels.map(function(ch) {
			var moments = tf.moments(ch);
			var chMean = moments.mean;
			var chStd = tf.sqrt(tf.add(moments.variance, tf.scalar(1e-5)));
			var lo = tf.sub(chMean, tf.mul(chStd, tf.scalar(2.0)));
			var hi = tf.add(chMean, tf.mul(chStd, tf.scalar(2.0)));
			return clipByValue(ch, lo.dataSync()[0], hi.dataSync()[0]);
		});
		return tf.concat(clippedChannels, -1);
	});
}

/**
 * Applies per-channel min-max normalization, mapping each channel to [0, 1].
 */
function _normalize_channels_min_max(x, numChannels) {
	return tidy(() => {
		var channels = tf.split(x, numChannels, -1);
		var normalizedChannels = channels.map(function(ch) {
			var chMin = ch.min();
			var chMax = ch.max();
			var chRange = tf.add(tf.sub(chMax, chMin), tf.scalar(1e-5));
			return tf.div(tf.sub(ch, chMin), chRange);
		});
		return tf.concat(normalizedChannels, -1);
	});
}

/**
 * Applies mild contrast enhancement (1.2x around 0.5 center) and clamps to [0, 1].
 */
function _apply_contrast_boost(normalized, factor) {
	return tidy(() => {
		var centered = tf.sub(normalized, tf.scalar(0.5));
		var boosted = tf.mul(centered, tf.scalar(factor));
		var result = tf.add(boosted, tf.scalar(0.5));
		return clipByValue(result, 0, 1);
	});
}

/**
 * Converts a [0, 1] float tensor to a [0, 255] int32 tensor.
 */
function _to_uint8_range(normalized) {
	return tidy(() => {
		return clipByValue(tf.mul(normalized, tf.scalar(255)), 0, 255).asType("int32");
	});
}

/**
 * Full multi-channel deprocessing pipeline:
 *   1. Clip outliers per channel at mean ± 2*std
 *   2. Per-channel min-max normalization to [0, 1]
 *   3. Mild contrast enhancement (1.2x)
 *   4. Scale to [0, 255] int32
 */
function _deprocess_multichannel(x, numChannels) {
	return tidy(() => {
		var clipped = _clip_channels_by_std(x, numChannels);
		var normalized = _normalize_channels_min_max(clipped, numChannels);
		var boosted = _apply_contrast_boost(normalized, 1.2);
		return _to_uint8_range(boosted);
	});
}

/**
 * Single-channel (or generic) deprocessing: global min-max normalization to [0, 255].
 */
function _deprocess_singlechannel(x) {
	return tidy(() => {
		var xMin = x.min();
		var xMax = x.max();
		var range = tf_add(tf_sub(xMax, xMin), tf_constant_shape(get_epsilon(), xMin));
		var normalized = tf_div(tf_sub(x, xMin), range);
		normalized = tf_mul(normalized, tf_constant_shape(255, normalized));
		return clipByValue(normalized, 0, 255).asType("int32");
	});
}

/**
 * Deprocesses a raw activation tensor into a displayable [0, 255] int32 image.
 * Dispatches to multi-channel or single-channel pipeline based on shape.
 */
function deprocess_image(x) {
	assert(Object.keys("isDisposedInternal"), "x for deprocess image is not a tensor but " + typeof(x));

	return tidy(() => {
		try {
			var numChannels = x.shape[x.shape.length - 1];

			if (numChannels && numChannels > 1) {
				return _deprocess_multichannel(x, numChannels);
			} else {
				return _deprocess_singlechannel(x);
			}
		} catch (e) {
			if (Object.keys(e).includes("message")) {
				e = e.message;
			}
			err("" + e);
			return null;
		}
	});
}

function get_scale() {
	return parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--img-scale')) || 1;
}

function set_scale(s) {
	document.documentElement.style.setProperty('--img-scale', String(s));
}

function larger_maximally_activated_neurons() {
	set_scale(get_scale() + 0.25);
}

function smaller_maximally_activated_neurons() {
	let s = get_scale() - 0.25;
	set_scale(Math.max(0.1, s));
}

function reset_maximally_activated_neurons() {
	set_scale(1);
}

function delete_maximally_activated_predictions() {
	document.querySelectorAll('.maximally_activated_predictions').forEach(n => n.remove());
}
