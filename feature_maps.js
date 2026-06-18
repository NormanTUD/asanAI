"use strict";

// ============================================================================
// Color Decorrelation: optimize in a decorrelated color space for more
// vivid, natural-looking feature visualizations.
// Uses the ImageNet color correlation matrix from Lucid.
// ============================================================================

/**
 * The color correlation matrix derived from ImageNet statistics.
 * Transforms decorrelated space → correlated (RGB) space.
 * From: https://github.com/tensorflow/lucid
 */
var COLOR_CORRELATION_MATRIX = [
	[0.56282854, 0.58447580, 0.58447580],
	[0.19482528, 0.00000000, -0.19482528],
	[0.04329450, -0.10823626, 0.06494176]
];

var COLOR_CORRELATION_STDS = [0.3, 0.59, 0.11];
var COLOR_CORRELATION_MATRIX_NORMALIZED = null;

var COLOR_CORRELATION_SVD_SQRT = [
	[0.26, 0.09, 0.02],
	[0.27, 0.00, -0.05],
	[0.27, -0.09, 0.03]
];

var USER_COLOR_CORRELATION_MATRIX = null;
var USE_USER_COLOR_CORRELATION = false;

function compute_color_correlation_from_data(imageTensors) {
	try {
		var result = tidy(() => {
			var pixels;

			if (Array.isArray(imageTensors)) {
				// Array of [H, W, 3] tensors — flatten and concatenate
				var flattened = imageTensors.map(function(t) {
					if (t.shape.length === 4) {
						// [1, H, W, 3] → [H*W, 3]
						return tf.reshape(t, [-1, 3]);
					} else {
						// [H, W, 3] → [H*W, 3]
						return tf.reshape(t, [-1, 3]);
					}
				});
				pixels = tf.concat(flattened, 0); // [totalPixels, 3]
			} else if (imageTensors.shape.length === 4) {
				// [N, H, W, 3] → [N*H*W, 3]
				pixels = tf.reshape(imageTensors, [-1, 3]);
			} else {
				console.error("compute_color_correlation_from_data: unexpected tensor shape", imageTensors.shape);
				return null;
			}

			// Compute mean per channel
			var mean = pixels.mean(0); // [3]

			// Center the pixels
			var centered = tf.sub(pixels, mean.expandDims(0)); // [N, 3]

			// Compute covariance matrix: (1/N) * centered^T * centered
			var n = centered.shape[0];
			var cov = tf.div(
				tf.matMul(centered, centered, true, false), // [3, 3]
				tf.scalar(n)
			);

			// Compute SVD-like square root via eigendecomposition approximation.
			// Since tf.js doesn't have a native eigen/SVD for small matrices,
			// we use a Cholesky-like approach: compute sqrt via iterative method
			// or use the direct analytical formula for 3x3 symmetric positive-definite.
			var covData = cov.arraySync();

			// Use analytical Cholesky decomposition for 3x3
			var L = _cholesky_3x3(covData);
			if (!L) return null;

			return L;
		});

		return result;
	} catch (e) {
		console.error("Failed to compute color correlation from user data:", e);
		return null;
	}
}

function _cholesky_3x3(A) {
	var L = [[0, 0, 0], [0, 0, 0], [0, 0, 0]];

	// L[0][0]
	if (A[0][0] <= 0) return null;
	L[0][0] = Math.sqrt(A[0][0]);

	// L[1][0], L[1][1]
	L[1][0] = A[1][0] / L[0][0];
	var tmp = A[1][1] - L[1][0] * L[1][0];
	if (tmp <= 0) return null;
	L[1][1] = Math.sqrt(tmp);

	// L[2][0], L[2][1], L[2][2]
	L[2][0] = A[2][0] / L[0][0];
	L[2][1] = (A[2][1] - L[2][0] * L[1][0]) / L[1][1];
	tmp = A[2][2] - L[2][0] * L[2][0] - L[2][1] * L[2][1];
	if (tmp <= 0) return null;
	L[2][2] = Math.sqrt(tmp);

	return L;
}

function _normalize_correlation_matrix(m) {
	var result = [[0, 0, 0], [0, 0, 0], [0, 0, 0]];

	for (var col = 0; col < 3; col++) {
		var norm = Math.sqrt(
			m[0][col] * m[0][col] +
			m[1][col] * m[1][col] +
			m[2][col] * m[2][col]
		);
		if (norm < 1e-10) norm = 1;
		for (var row = 0; row < 3; row++) {
			result[row][col] = m[row][col] / norm;
		}
	}

	return result;
}

function set_color_correlation_from_training_data(imageTensors) {
	var rawMatrix = compute_color_correlation_from_data(imageTensors);

	if (!rawMatrix) {
		console.warn("Could not compute color correlation from training data. Using ImageNet defaults.");
		USE_USER_COLOR_CORRELATION = false;
		return false;
	}

	// Validate: check that the matrix isn't degenerate
	var det = _determinant_3x3(rawMatrix);
	if (Math.abs(det) < 1e-10) {
		console.warn("Computed color correlation matrix is near-singular (det=" + det + "). Using ImageNet defaults.");
		USE_USER_COLOR_CORRELATION = false;
		return false;
	}

	// Validate: check that values are in a reasonable range
	var maxVal = 0;
	for (var i = 0; i < 3; i++) {
		for (var j = 0; j < 3; j++) {
			maxVal = Math.max(maxVal, Math.abs(rawMatrix[i][j]));
		}
	}
	if (maxVal > 100 || maxVal < 1e-6) {
		console.warn("Computed color correlation matrix has extreme values (max=" + maxVal + "). Using ImageNet defaults.");
		USE_USER_COLOR_CORRELATION = false;
		return false;
	}

	USER_COLOR_CORRELATION_MATRIX = _normalize_correlation_matrix(rawMatrix);
	USE_USER_COLOR_CORRELATION = true;

	// Invalidate cached inverse
	COLOR_DECORRELATION_MATRIX = null;
	COLOR_CORRELATION_MATRIX_NORMALIZED = null;

	console.log("Successfully computed color correlation matrix from training data.");
	return true;
}

function _determinant_3x3(m) {
	var a = m[0][0], b = m[0][1], c = m[0][2];
	var d = m[1][0], e = m[1][1], f = m[1][2];
	var g = m[2][0], h = m[2][1], i = m[2][2];
	return a * (e * i - f * h) - b * (d * i - f * g) + c * (d * h - e * g);
}

function reset_color_correlation_to_defaults() {
	USE_USER_COLOR_CORRELATION = false;
	USER_COLOR_CORRELATION_MATRIX = null;
	COLOR_DECORRELATION_MATRIX = null;
	COLOR_CORRELATION_MATRIX_NORMALIZED = null;
	console.log("Color correlation reset to ImageNet defaults.");
}

function _get_color_correlation_matrix() {
	if (USE_USER_COLOR_CORRELATION && USER_COLOR_CORRELATION_MATRIX) {
		return USER_COLOR_CORRELATION_MATRIX;
	}

	if (!COLOR_CORRELATION_MATRIX_NORMALIZED) {
		var m = COLOR_CORRELATION_SVD_SQRT;
		var result = [[0, 0, 0], [0, 0, 0], [0, 0, 0]];

		for (var col = 0; col < 3; col++) {
			var norm = Math.sqrt(
				m[0][col] * m[0][col] +
				m[1][col] * m[1][col] +
				m[2][col] * m[2][col]
			);
			if (norm < 1e-10) norm = 1;
			for (var row = 0; row < 3; row++) {
				result[row][col] = m[row][col] / norm;
			}
		}

		COLOR_CORRELATION_MATRIX_NORMALIZED = result;
	}
	return COLOR_CORRELATION_MATRIX_NORMALIZED;
}

/**
 * Precomputed inverse of COLOR_CORRELATION_MATRIX.
 * Transforms correlated (RGB) space → decorrelated space.
 */
var COLOR_DECORRELATION_MATRIX = null;

/**
 * Computes the inverse of a 3x3 matrix.
 */
function _invert_3x3(m) {
	var a = m[0][0], b = m[0][1], c = m[0][2];
	var d = m[1][0], e = m[1][1], f = m[1][2];
	var g = m[2][0], h = m[2][1], i = m[2][2];

	var det = a * (e * i - f * h) - b * (d * i - f * g) + c * (d * h - e * g);
	if (Math.abs(det) < 1e-10) {
		console.warn("Color correlation matrix is singular, falling back to identity");
		return [[1, 0, 0], [0, 1, 0], [0, 0, 1]];
	}

	var invDet = 1.0 / det;
	return [
		[(e * i - f * h) * invDet, (c * h - b * i) * invDet, (b * f - c * e) * invDet],
		[(f * g - d * i) * invDet, (a * i - c * g) * invDet, (c * d - a * f) * invDet],
		[(d * h - e * g) * invDet, (b * g - a * h) * invDet, (a * e - b * d) * invDet]
	];
}

/**
 * Returns the decorrelation (inverse) matrix, computing it once on first use.
 */
function _get_color_decorrelation_matrix() {
	if (!COLOR_DECORRELATION_MATRIX) {
		COLOR_DECORRELATION_MATRIX = _invert_3x3(_get_color_correlation_matrix());
	}
	return COLOR_DECORRELATION_MATRIX;
}

/**
 * Transforms an image tensor from decorrelated space to RGB space.
 * Input shape: [batch, H, W, 3], values centered around 0.
 * Output: correlated RGB tensor suitable for feeding into the model.
 */
function _decorrelated_to_rgb(data) {
	return tidy(() => {
		var colorMatrix = tf.tensor2d(_get_color_correlation_matrix()); // [3, 3]
		var shape = data.shape;
		var flat = tf.reshape(data, [-1, 3]); // [N, 3]
		var transformed = tf.matMul(flat, colorMatrix, false, true); // [N, 3]
		var result = tf.reshape(transformed, shape); // [1, H, W, 3]
		return tf.sigmoid(result);
	});
}

/**
 * Transforms an image tensor from RGB space [0, 1] to decorrelated space.
 * Used to convert an initial RGB image into the optimization space.
 */
function _rgb_to_decorrelated(data) {
	return tidy(() => {
		var clamped = clipByValue(data, 0.001, 0.999);
		var logit = tf.log(tf.div(clamped, tf.sub(tf.scalar(1.0), clamped)));

		var invMatrix = tf.tensor2d(_get_color_decorrelation_matrix()); // [3, 3]
		var shape = logit.shape;
		var flat = tf.reshape(logit, [-1, 3]);
		var transformed = tf.matMul(flat, invMatrix, false, true);
		return tf.reshape(transformed, shape);
	});
}

function _assess_color_quality(rgbImage) {
	return tidy(() => {
		var pixels = tf.reshape(rgbImage, [-1, 3]);

		// Check for NaN/Inf
		var hasNan = tf.any(tf.isNaN(pixels)).dataSync()[0];
		if (hasNan) {
			return { isGood: false, reason: "NaN values detected in output" };
		}

		// Check per-channel variance — if any channel has near-zero variance,
		// the decorrelation may be collapsing that channel
		var channels = tf.split(pixels, 3, -1);
		var variances = channels.map(function(ch) {
			return tf.moments(ch).variance.dataSync()[0];
		});

		var minVariance = Math.min(variances[0], variances[1], variances[2]);
		var maxVariance = Math.max(variances[0], variances[1], variances[2]);

		if (minVariance < 1e-6) {
			return { isGood: false, reason: "Channel collapsed (variance=" + minVariance.toFixed(8) + ")" };
		}

		// Check variance ratio — if one channel dominates overwhelmingly
		if (maxVariance / (minVariance + 1e-10) > 100) {
			return { isGood: false, reason: "Extreme channel imbalance (ratio=" + (maxVariance / minVariance).toFixed(1) + ")" };
		}

		// Check if output is nearly monochrome (all channels highly correlated)
		var mean0 = tf.mean(channels[0]).dataSync()[0];
		var mean1 = tf.mean(channels[1]).dataSync()[0];
		var mean2 = tf.mean(channels[2]).dataSync()[0];

		// If all means are nearly identical AND variances are similar,
		// the image is likely grayscale despite color decorrelation
		var meanRange = Math.max(mean0, mean1, mean2) - Math.min(mean0, mean1, mean2);
		if (meanRange < 0.02 && maxVariance / (minVariance + 1e-10) < 2) {
			return { isGood: false, reason: "Output appears monochrome (mean range=" + meanRange.toFixed(4) + ")" };
		}

		return { isGood: true, reason: "OK" };
	});
}

async function _finalize_ascent_with_quality_check(generated_data, worked, useColorDecorrelation, layer_idx, neuron, iterations, start_image, recursion, previewCanvas, max_neurons) {
	if (!useColorDecorrelation || !USE_USER_COLOR_CORRELATION) {
		// No user matrix in use — just finalize normally
		return await _finalize_ascent(generated_data, worked, useColorDecorrelation);
	}

	// Convert to RGB and assess quality
	var rgbData = _decorrelated_to_rgb(generated_data);
	var quality = _assess_color_quality(rgbData);

	if (quality.isGood) {
		// Good result — proceed normally
		await dispose(generated_data);
		var full_data = {};
		full_data = _postprocess_generated_data(rgbData, full_data);
		await dispose(rgbData);
		full_data["worked"] = worked;
		return full_data;
	}

	// Bad result — log warning and retry with ImageNet defaults
	console.warn("Color quality check failed (" + quality.reason + "). Retrying with ImageNet defaults.");
	await dispose(generated_data);
	await dispose(rgbData);

	// Temporarily switch to ImageNet defaults
	var savedUserMatrix = USER_COLOR_CORRELATION_MATRIX;
	var savedUseUser = USE_USER_COLOR_CORRELATION;
	USE_USER_COLOR_CORRELATION = false;
	COLOR_DECORRELATION_MATRIX = null; // Invalidate cache

	try {
		// Re-run gradient ascent with ImageNet defaults
		var fallbackResult = await input_gradient_ascent(layer_idx, neuron, iterations, start_image, max_neurons, recursion, previewCanvas);
		return fallbackResult;
	} finally {
		// Restore user settings (don't permanently override user choice)
		USER_COLOR_CORRELATION_MATRIX = savedUserMatrix;
		USE_USER_COLOR_CORRELATION = savedUseUser;
		COLOR_DECORRELATION_MATRIX = null; // Invalidate cache again
	}
}

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

		var full_data = await input_gradient_ascent(layer_idx, neuron, iterations, undefined, max_neurons, 0, previewCanvas);

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

// ============================================================================
// Error handling helpers for draw_maximally_activated_neuron retries
// ============================================================================

/**
 * Returns true if the error message indicates a disposed-tensor problem
 * that is potentially recoverable by retrying.
 */
function _is_disposed_tensor_error(e) {
	var msg = "" + e;
	return (
		msg.includes("already disposed") ||
		msg.includes("is disposed") ||
		msg.includes("Tensor or TensorLike, but got 'null'")
	);
}

/**
 * Attempts a single retry of draw_maximally_activated_layer.
 * Returns true if the retry succeeded, false if it hit a disposed-tensor
 * error again (and should keep retrying), or throws on unexpected errors.
 */
async function _attempt_single_retry(canvasses, layer_idx, type) {
	await delay(200);
	try {
		l(`${language[lang]["failed_try_again"]}...`);
		canvasses.push(await draw_maximally_activated_layer(layer_idx, type, 1));
		return true;
	} catch (retryError) {
		if (_is_disposed_tensor_error(retryError)) {
			err("" + retryError);
			return false;
		}
		throw new Error(retryError);
	}
}

/**
 * Runs up to `tries_left` retries when a disposed-tensor error occurs
 * during non-recursive generation.
 */
async function _retry_disposed_tensor(tries_left, canvasses, layer_idx, type) {
	while (tries_left > 0) {
		var succeeded = await _attempt_single_retry(canvasses, layer_idx, type);
		tries_left--;
		if (succeeded) break;
	}
	return tries_left;
}

/**
 * Top-level error handler for draw_maximally_activated_neuron_with_retries.
 *
 * - Disposed-tensor errors in non-recursive calls trigger up to `tries_left`
 *   retries of the whole layer.
 * - Disposed-tensor errors in recursive calls are logged and ignored to
 *   prevent infinite retry chains.
 * - All other errors are re-thrown.
 */
async function handle_draw_maximally_activated_neuron_multiple_times_error(e, is_recursive, tries_left, canvasses, layer_idx, type) {
	currently_generating_images = false;

	if (!_is_disposed_tensor_error(e)) {
		throw new Error(e);
	}

	if (is_recursive) {
		log(language[lang]["already_disposed_in_draw_maximally_activated_neuron_recursive_ignore"]);
		return tries_left;
	}

	return await _retry_disposed_tensor(tries_left, canvasses, layer_idx, type);
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
		// Build tensor directly from the canvas element
		var tensor_img = await _get_tensor_img(item);
		if (!tensor_img) {
			err("predict_maximally_activated: could not create tensor from item");
			return;
		}

		var predictions_tensor = await __predict(tensor_img);
		await dispose(tensor_img);

		if (!predictions_tensor) {
			err(language[lang]["results_is_empty_in"] + " predict_maximally_activated");
			return;
		}

		if (model.outputShape.length == 4) {
			// image output - not typical for maximally activated predictions
			results = "";
		} else {
			var desc = $("<span></span>");
			await _predict_table(predictions_tensor, desc);
			results = desc.html();
		}

		await dispose(predictions_tensor);

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

function _create_init_image(shape, useColorDecorrelation) {
	return tidy(() => {
		var h = shape[0];
		var w = shape[1];
		var c = shape[2];

		if (useColorDecorrelation && c === 3) {
			if (h <= 32 || w <= 32) {
				// Small images: uniform noise with enough variance in all channels
				return tf.randomNormal([1, h, w, c], 0.0, 0.01);
			} else {
				var smallH = Math.max(4, Math.floor(h / 4));
				var smallW = Math.max(4, Math.floor(w / 4));

				// Generate each channel independently with appropriate scale.
				// Channel 0 (luminance-like) gets smaller init, channels 1-2
				// (color-like) get comparable variance so they aren't immediately
				// overwhelmed by the luminance channel during optimization.
				var ch0 = tf.randomNormal([1, smallH, smallW, 1], 0.0, 0.5);
				var ch1 = tf.randomNormal([1, smallH, smallW, 1], 0.0, 0.5);
				var ch2 = tf.randomNormal([1, smallH, smallW, 1], 0.0, 0.5);
				var smallNoise = tf.concat([ch0, ch1, ch2], -1);

				var upscaled = tf.image.resizeBilinear(smallNoise, [h, w]);
				// Normalize per-channel to preserve relative color variance
				var channels = tf.split(upscaled, 3, -1);
				var normed = channels.map(function(ch) {
					var moments = tf.moments(ch);
					var mean = moments.mean;
					var std = tf.sqrt(tf.add(moments.variance, tf.scalar(1e-5)));
					return tf.mul(tf.div(tf.sub(ch, mean), std), tf.scalar(0.1));
				});
				return tf.concat(normed, -1);
			}
		}

		// Original behavior for non-decorrelated or non-3-channel
		if (h <= 32 || w <= 32) {
			return clipByValue(
				tf.add(
					tf.fill([1, h, w, c], 0.5),
					tf.randomNormal([1, h, w, c], 0.0, 0.01)
				),
				0, 1
			);
		} else {
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
function _compute_scaled_gradients(grad_function, dataForGrad, useColorDecorrelation) {
	try {
		return tidy(() => {
			var grads = grad_function(dataForGrad);

			if (useColorDecorrelation && grads.shape[grads.shape.length - 1] === 3) {
				// Per-channel normalization in decorrelated space.
				// Even with a properly normalized correlation matrix, the
				// gradient magnitudes can still differ across decorrelated
				// channels. Per-channel normalization ensures each axis
				// gets equal learning signal.
				var channels = tf.split(grads, 3, -1);
				var normalizedChannels = channels.map(function(ch) {
					var rms = tf.sqrt(tf.mean(tf.square(ch)));
					var eps = tf.scalar(1e-8);
					return tf.div(ch, tf.add(rms, eps));
				});
				return tf.concat(normalizedChannels, -1);
			}

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
// L2 weight decay: gently shrink activations to prevent runaway values
// ============================================================================
async function _apply_l2_decay(data, iteration_idx, decayRate, decayInterval, useColorDecorrelation) {
	if (iteration_idx % decayInterval !== 0) return data;

	if (useColorDecorrelation && data.shape[data.shape.length - 1] === 3) {
		var decayed = tidy(() => {
			var channels = tf.split(data, 3, -1);
			// Channel 0 in the normalized decorrelated space is still the
			// highest-variance (luminance-like) axis. Apply full decay there
			// and gentler decay on the color-opponent channels.
			var ch0 = tf.mul(channels[0], tf.scalar(decayRate));
			var colorDecay = 1.0 - (1.0 - decayRate) * 0.25; // 25% of luminance decay
			var ch1 = tf.mul(channels[1], tf.scalar(colorDecay));
			var ch2 = tf.mul(channels[2], tf.scalar(colorDecay));
			return tf.concat([ch0, ch1, ch2], -1);
		});
		await dispose(data);
		return decayed;
	}

	var decayed = tidy(() => tf_mul(data, tf_constant_shape(decayRate, data)));
	await dispose(data);
	return decayed;
}

// ============================================================================
// Total Variation regularization step: suppress high-frequency noise
// ============================================================================
async function _apply_tv_regularization(data, iteration_idx, tvWeight, tvInterval, useColorDecorrelation) {
	if (iteration_idx % tvInterval !== 0 || iteration_idx === 0) return data;

	var tvGrad = _compute_tv_gradients(data, tvWeight);

	if (useColorDecorrelation && data.shape[data.shape.length - 1] === 3) {
		var scaledTvGrad = tidy(() => {
			var channels = tf.split(tvGrad, 3, -1);
			var ch0 = channels[0];                             // full TV on luminance
			var ch1 = tf.mul(channels[1], tf.scalar(0.25));    // 25% TV on color
			var ch2 = tf.mul(channels[2], tf.scalar(0.25));    // 25% TV on color
			return tf.concat([ch0, ch1, ch2], -1);
		});
		var tvRegularized = tidy(() => tf.sub(data, scaledTvGrad));
		await dispose(tvGrad);
		await dispose(scaledTvGrad);
		await dispose(data);
		return tvRegularized;
	}

	var tvRegularized = tidy(() => tf.sub(data, tvGrad));
	await dispose(tvGrad);
	await dispose(data);
	return tvRegularized;
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
	var { dataForGrad, needDispose: needDisposeBlurred } = _compute_blurred_data_for_grad(data, currentBlurFactor, config.fullH, config.fullW);

	var scaledGrads = _compute_scaled_gradients(grad_function, dataForGrad, config.useColorDecorrelation);

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
async function _maybe_render_preview(data, iteration_idx, iterations, previewInterval, previewCanvas, layer_idx, neuron, useColorDecorrelation) {
	if (previewCanvas && (iteration_idx % previewInterval === 0 || iteration_idx === iterations - 1)) {
		var displayData = data;
		if (useColorDecorrelation) {
			displayData = _decorrelated_to_rgb(data);
		}
		_render_preview_to_canvas(previewCanvas, displayData, layer_idx, neuron);
		if (useColorDecorrelation) {
			await dispose(displayData);
		}
		await nextFrame();
	}
}

// ============================================================================
// Model & gradient function setup
// ============================================================================
function _build_aux_model_and_grad(layer_idx, neuron, useColorDecorrelation) {
	var layer_output = model.getLayer(null, layer_idx).getOutputAt(0);
	var aux_model = tf_model({ inputs: model.inputs, outputs: layer_output });

	var lossFunction;

	if (useColorDecorrelation) {
		// The input to the loss function is in decorrelated space.
		// We transform to RGB before feeding to the model so gradients
		// flow through the color transform, encouraging decorrelated updates.
		lossFunction = function(input) {
			var rgbInput = _decorrelated_to_rgb(input);
			return aux_model.apply(rgbInput, { training: true }).gather([neuron], -1).mean();
		};
	} else {
		lossFunction = function(input) {
			return aux_model.apply(input, { training: true }).gather([neuron], -1).mean();
		};
	}

	var grad_function = grad(lossFunction);

	return { aux_model: aux_model, grad_function: grad_function };
}

// ============================================================================
// Initialize or accept a starting image
// ============================================================================
function _initialize_image(start_image, new_input_shape, useColorDecorrelation) {
	if (typeof start_image !== "undefined") {
		// If a start image is provided in RGB, convert to decorrelated space
		if (useColorDecorrelation && start_image.shape[start_image.shape.length - 1] === 3) {
			return _rgb_to_decorrelated(start_image);
		}
		return start_image;
	}
	return _create_init_image(new_input_shape, useColorDecorrelation);
}

// ============================================================================
// Compute preview interval from iteration count
// ============================================================================
function _compute_preview_interval(iterations) {
	// Adaptive: more frequent previews for short runs, less for long ones
	if (iterations <= 20) return 2;
	if (iterations <= 50) return 5;
	return Math.max(5, Math.floor(iterations / 15));
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
// Updated _build_ascent_config — now includes Adam hyperparameters
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

    // Enable color decorrelation for 3-channel (RGB) image models
    var useColorDecorrelation = (numChannels === 3);

    // Adam optimizer hyperparameters
    var adam = {
        beta1: 0.9,
        beta2: 0.999,
        epsilon: 1e-8
    };

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
        tvWeight, tvInterval, blurPhases, fullH, fullW,
        useColorDecorrelation, adam
    };
}

// ============================================================================
// Updated _prepare_ascent — initializes Adam moment tensors (m and v)
// ============================================================================
/**
 * Phase 1: Build the model, config, initial image, and Adam state for gradient ascent.
 * Returns all state needed to run the iteration loop.
 */
function _prepare_ascent(layer_idx, neuron, iterations, start_image) {
    var new_input_shape = get_input_shape_with_batch_size();
    new_input_shape.shift();

    var fullH = new_input_shape[0];
    var fullW = new_input_shape[1];
    var config = _build_ascent_config(layer_idx, iterations, fullH, fullW, new_input_shape);

    var { aux_model, grad_function } = _build_aux_model_and_grad(layer_idx, neuron, config.useColorDecorrelation);

    var data = _initialize_image(start_image, new_input_shape, config.useColorDecorrelation);

    // Initialize Adam optimizer state: first moment (m) and second moment (v)
    var adamState = {
        m: tidy(() => tf.zerosLike(data)),  // First moment estimate
        v: tidy(() => tf.zerosLike(data)),  // Second moment estimate
        t: 0                                 // Timestep counter
    };

    return { aux_model, grad_function, config, data, adamState };
}

// ============================================================================
// Updated _apply_gradient_step — uses Adam update rule instead of vanilla SGD
// ============================================================================
/**
 * Adam gradient step: computes bias-corrected first and second moment estimates,
 * then moves data in the adaptive direction.
 *
 * Returns { updatedData, updatedAdamState }
 */
async function _apply_gradient_step(data, scaledGrads, learningRate, adamState, adamConfig) {
    var beta1 = adamConfig.beta1;
    var beta2 = adamConfig.beta2;
    var epsilon = adamConfig.epsilon;

    // Increment timestep
    var t = adamState.t + 1;

    // Compute updated first moment: m = beta1 * m + (1 - beta1) * grads
    var newM = tidy(() => {
        return tf.add(
            tf.mul(adamState.m, tf.scalar(beta1)),
            tf.mul(scaledGrads, tf.scalar(1.0 - beta1))
        );
    });

    // Compute updated second moment: v = beta2 * v + (1 - beta2) * grads^2
    var newV = tidy(() => {
        return tf.add(
            tf.mul(adamState.v, tf.scalar(beta2)),
            tf.mul(tf.square(scaledGrads), tf.scalar(1.0 - beta2))
        );
    });

    // Bias correction
    var biasCorrection1 = 1.0 - Math.pow(beta1, t);
    var biasCorrection2 = 1.0 - Math.pow(beta2, t);

    // Compute Adam update: lr * (m_hat / (sqrt(v_hat) + eps))
    var updated = tidy(() => {
        var mHat = tf.div(newM, tf.scalar(biasCorrection1));
        var vHat = tf.div(newV, tf.scalar(biasCorrection2));
        var denom = tf.add(tf.sqrt(vHat), tf.scalar(epsilon));
        var step = tf.mul(tf.scalar(learningRate), tf.div(mHat, denom));
        return tf.add(data, step);
    });

    // Dispose old state
    await dispose(adamState.m);
    await dispose(adamState.v);
    await dispose(scaledGrads);
    await dispose(data);

    var updatedAdamState = { m: newM, v: newV, t: t };

    return { updatedData: updated, updatedAdamState: updatedAdamState };
}

// ============================================================================
// Updated _apply_gradient_update — passes Adam state through the pipeline
// ============================================================================
async function _apply_gradient_update(data, scaledGrads, learningRate, iteration_idx, config, adamState) {
    var stepResult = await _apply_gradient_step(data, scaledGrads, learningRate, adamState, config.adam);
    data = stepResult.updatedData;
    adamState.m = stepResult.updatedAdamState.m;
    adamState.v = stepResult.updatedAdamState.v;
    adamState.t = stepResult.updatedAdamState.t;

    data = await _apply_l2_decay(data, iteration_idx, config.decayRate, config.decayInterval, config.useColorDecorrelation);
    data = await _apply_tv_regularization(data, iteration_idx, config.tvWeight, config.tvInterval, config.useColorDecorrelation);

    return { data: data, adamState: adamState };
}

// ============================================================================
// Updated _run_single_iteration — threads Adam state through
// ============================================================================
async function _run_single_iteration(data, iteration_idx, iterations, config, grad_function, layer_idx, neuron, max_neurons, previewCanvas, previewInterval, adamState) {
    log(`Layer ${layer_idx}, neuron ${neuron + 1}/${max_neurons}, iteration ${iteration_idx + 1}/${iterations}`);

    if (stop_generating_images) return { data: data, worked: false, adamState: adamState };

    // Steps 1–2: Apply forward jitter
    var jitterState = await _apply_forward_jitter(data, config);
    data = jitterState.data;

    // Steps 3–4: Compute gradients
    var scaledGrads = await _compute_gradients_for_iteration(data, config, grad_function, iteration_idx);

    if (!scaledGrads) {
        return { data: data, worked: false, adamState: adamState };
    }

    // Steps 5–7: Adam gradient step, L2 decay, TV regularization
    var updateResult = await _apply_gradient_update(data, scaledGrads, config.learningRate, iteration_idx, config, adamState);
    data = updateResult.data;
    adamState = updateResult.adamState;

    // Steps 8–10: Undo jitter and stabilize dimensions
    data = await _undo_jitter_and_stabilize(data, jitterState.ox, jitterState.oy, jitterState.rotAngle, jitterState.scaleJitter, config);

    // Step 11: Live preview (with decorrelation-aware rendering)
    await _maybe_render_preview(data, iteration_idx, iterations, previewInterval, previewCanvas, layer_idx, neuron, config.useColorDecorrelation);

    return { data: data, worked: true, adamState: adamState };
}

// ============================================================================
// Updated _run_ascent_loop — manages Adam state across iterations
// ============================================================================
async function _run_ascent_loop(data, iterations, config, grad_function, layer_idx, neuron, max_neurons, previewCanvas, previewInterval, adamState) {
    var worked = 0;

    for (var iteration_idx = 0; iteration_idx < iterations; iteration_idx++) {
        var result = await _run_single_iteration(data, iteration_idx, iterations, config, grad_function, layer_idx, neuron, max_neurons, previewCanvas, previewInterval, adamState);
        data = result.data;
        adamState = result.adamState;
        if (result.worked) worked = 1;
    }

    // Dispose Adam state tensors when done
    await dispose(adamState.m);
    await dispose(adamState.v);

    return { data: data, worked: worked };
}

// ============================================================================
// Updated _execute_ascent_loop — passes adamState from prepared state
// ============================================================================
/**
 * Phase 2: Execute the gradient ascent loop and return raw generated data.
 */
async function _execute_ascent_loop(prepared, iterations, layer_idx, neuron, max_neurons, previewCanvas, previewInterval) {
    var loopResult = await _run_ascent_loop(
        prepared.data, iterations, prepared.config, prepared.grad_function,
        layer_idx, neuron, max_neurons, previewCanvas, previewInterval,
        prepared.adamState
    );

    return {
        generated_data: loopResult.data,
        worked: loopResult.worked
    };
}

/**
 * Phase 3: Post-process raw generated data and package into final output.
 */
async function _finalize_ascent(generated_data, worked, useColorDecorrelation) {
	var full_data = {};

	// If we optimized in decorrelated space, convert back to RGB for deprocessing
	if (useColorDecorrelation) {
		var rgbData = _decorrelated_to_rgb(generated_data);
		await dispose(generated_data);
		generated_data = rgbData;
	}

	full_data = _postprocess_generated_data(generated_data, full_data);
	await dispose(generated_data);
	full_data["worked"] = worked;
	return full_data;
}

/**
 * Core gradient ascent — now a clean three-phase orchestrator.
 *
 * Phase 1: _prepare_ascent     — model, config, initial image
 * Phase 2: _execute_ascent_loop — run all iterations
 * Phase 3: _finalize_ascent     — deprocess and package results
 */
async function input_gradient_ascent(layer_idx, neuron, iterations, start_image, max_neurons, recursion, previewCanvas = true) {
	if (typeof recursion === "undefined") recursion = 0;

	typeassert(layer_idx, int, "layer_idx");
	typeassert(neuron, int, "neuron");
	typeassert(iterations, int, "iterations");
	typeassert(recursion, int, "recursion");

	var previewInterval = _compute_preview_interval(iterations);

	var generated_data;
	var worked;
	var useColorDecorrelation = false;

	try {
		// Phase 1: Prepare model, config, initial image, and Adam optimizer state
		var prepared = _prepare_ascent(layer_idx, neuron, iterations, start_image);
		useColorDecorrelation = prepared.config.useColorDecorrelation;

		// Phase 2: Execute the gradient ascent loop (with Adam updates)
		var loopOutput = await _execute_ascent_loop(prepared, iterations, layer_idx, neuron, max_neurons, previewCanvas, previewInterval);

		generated_data = loopOutput.generated_data;
		worked = loopOutput.worked;
	} catch (e) {
		return await _handle_ascent_error(e, recursion, layer_idx, neuron, iterations, start_image);
	}

	if (useColorDecorrelation && USE_USER_COLOR_CORRELATION) {
		return await _finalize_ascent_with_quality_check(generated_data, worked, useColorDecorrelation, layer_idx, neuron, iterations, start_image, recursion, previewCanvas, max_neurons);
	}

	return await _finalize_ascent(generated_data, worked, useColorDecorrelation);
}

async function gui_compute_color_correlation() {
	var $status = $("#color_correlation_status");
	$status.html("Computing color statistics from training data...");

	try {
		var trainingImages = await _get_training_image_tensors();

		if (!trainingImages || trainingImages.length === 0) {
			$status.html('<span style="color:orange">No training images available. Using ImageNet defaults.</span>');
			reset_color_correlation_to_defaults();
			return;
		}

		var success = set_color_correlation_from_training_data(trainingImages);

		// Dispose training image tensors if we created them
		for (var i = 0; i < trainingImages.length; i++) {
			if (trainingImages[i] && !trainingImages[i].isDisposed) {
				await dispose(trainingImages[i]);
			}
		}

		if (success) {
			$status.html('<span style="color:green">✓ Color correlation computed from your training data.</span>');
			$("#use_user_color_correlation").prop("checked", true);
		} else {
			$status.html('<span style="color:orange">⚠ Computation failed. Using ImageNet defaults.</span>');
			$("#use_user_color_correlation").prop("checked", false);
		}
	} catch (e) {
		console.error("gui_compute_color_correlation error:", e);
		$status.html('<span style="color:red">✗ Error: ' + (e.message || e) + '. Using ImageNet defaults.</span>');
		reset_color_correlation_to_defaults();
	}
}

function gui_toggle_user_color_correlation(checkbox) {
	USE_USER_COLOR_CORRELATION = checkbox.checked;
	// Invalidate cached matrices so they're recomputed on next use
	COLOR_DECORRELATION_MATRIX = null;

	if (checkbox.checked && !USER_COLOR_CORRELATION_MATRIX) {
		console.warn("No user color correlation matrix computed yet. Will use ImageNet defaults until computed.");
		USE_USER_COLOR_CORRELATION = false;
		checkbox.checked = false;
	}
}

async function _get_training_image_tensors() {
	// Attempt to get images from the application's training data store
	// This adapts to the specific application's data loading mechanism
	if (typeof get_dataset_as_tensors === "function") {
		var dataset = await get_dataset_as_tensors();
		if (dataset && dataset.xs) {
			// dataset.xs is likely [N, H, W, 3] — split into individual tensors
			var n = dataset.xs.shape[0];
			// Use at most 500 images for efficiency
			var sampleSize = Math.min(n, 500);
			var tensors = [];
			for (var i = 0; i < sampleSize; i++) {
				tensors.push(tidy(() => dataset.xs.slice([i, 0, 0, 0], [1, -1, -1, -1])));
			}
			return tensors;
		}
	}

	// Fallback: try to get images from loaded training canvases
	if (typeof get_training_data_as_tensors === "function") {
		return await get_training_data_as_tensors();
	}

	// Fallback: try to sample from the current dataset
	if (typeof x_train !== "undefined" && x_train && x_train.shape) {
		var n = x_train.shape[0];
		var sampleSize = Math.min(n, 500);
		var tensors = [];
		for (var i = 0; i < sampleSize; i++) {
			tensors.push(tidy(() => x_train.slice([i, 0, 0, 0], [1, -1, -1, -1])));
		}
		return tensors;
	}

	return null;
}

function gui_reset_color_correlation() {
	reset_color_correlation_to_defaults();
	$("#use_user_color_correlation").prop("checked", false);
	$("#color_correlation_status").html("Using ImageNet defaults.");
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
