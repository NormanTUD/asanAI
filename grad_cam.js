"use strict";

function apply_color_map(x) {
	assert(x.rank === 4, `Expected rank-4 tensor input, got rank ${x.rank}`);
	assert(x.shape[0] === 1, `Expected exactly one example, but got ${x.shape[0]} examples`);
	assert(x.shape[3] === 1, `Expected exactly one channel, but got ${x.shape[3]} channels`);

	var res = tidy(() => {
		const EPSILON = 1e-5;
		const xRange = tf_sub(tf_max(x), tf_min(x));
		const xNorm = tf_div(tf_sub(x, tf_min(x)), tf_add(xRange, EPSILON));
		const xNormData = xNorm.dataSync();

		const h = x.shape[1];
		const w = x.shape[2];
		var _buffer = buffer([1, h, w, 3]);

		const colorMapSize = RGB_COLORMAP.length / 3;
		for (let i = 0; i < h; ++i) {
			for (let j = 0; j < w; ++j) {
				const pixelValue = xNormData[i * w + j];
				const row = Math.floor(pixelValue * colorMapSize);
				_buffer.set(RGB_COLORMAP[3 * row], 0, i, j, 0);
				_buffer.set(RGB_COLORMAP[3 * row + 1], 0, i, j, 1);
				_buffer.set(RGB_COLORMAP[3 * row + 2], 0, i, j, 2);
			}
		}
		return tf_to_tensor(_buffer);
	});

	return res;
}

// Cache to avoid rebuilding sub-models on every call.
// Invalidated when the model identity changes.
var _grad_cam_cache = {
	model_id: null,
	last_conv_layer_nr: null,
	auxModel: null,
	classifierModel: null
};

function _grad_cam_invalidate_cache() {
	_grad_cam_cache.model_id = null;
	_grad_cam_cache.last_conv_layer_nr = null;
	_grad_cam_cache.auxModel = null;
	_grad_cam_cache.classifierModel = null;
}

async function grad_class_activation_map(_model, x, class_idx, overlay_factor = 0.5) {
	if (started_training) {
		l(language[lang]["cannot_show_gradcam_while_training"]);
		return null;
	}

	if (!contains_convolution()) {
		l(language[lang]["cannot_use_gradcam_without_conv_layer"]);
		return null;
	}

	if (is_hidden_or_has_hidden_parent("#predict_tab")) {
		info(language[lang]["not_wasting_resources_on_gradcam_when_not_visible"]);
		return null;
	}

	try {
		const last_conv_layer_nr = grad_cam_internal_find_last_conv_layer(_model);
		if (last_conv_layer_nr < 0) {
			l(language[lang]["cannot_use_gradcam_without_conv_layer"]);
			return null;
		}

		// Determine a stable identity for the model so we know when to rebuild.
		var current_model_id = _model.uuid || _model.name || null;

		var need_rebuild = (
			_grad_cam_cache.model_id !== current_model_id ||
			_grad_cam_cache.last_conv_layer_nr !== last_conv_layer_nr ||
			!_grad_cam_cache.auxModel ||
			!_grad_cam_cache.classifierModel
		);

		if (need_rebuild) {
			var built = _grad_cam_build_models_safe(_model, last_conv_layer_nr);
			_grad_cam_cache.model_id = current_model_id;
			_grad_cam_cache.last_conv_layer_nr = last_conv_layer_nr;
			_grad_cam_cache.auxModel = built.auxModel;
			_grad_cam_cache.classifierModel = built.classifierModel;
		}

		var aux_model = _grad_cam_cache.auxModel;
		var sub_model2 = _grad_cam_cache.classifierModel;

		const retval = tidy(() => {
			try {
				return grad_cam_internal_compute_heatmap(aux_model, sub_model2, x, class_idx, overlay_factor);
			} catch (e) {
				if (("" + e).includes("already disposed")) {
					dbg(language[lang]["model_weights_disposed_probably_recompiled"]);
					_grad_cam_invalidate_cache();
				} else {
					void (0); err("ERROR in next line stack:", e.stack);
					err("" + e);
				}
				return null;
			}
		});

		return retval;
	} catch (e) {
		if (("" + e).includes("already disposed")) {
			dbg(language[lang]["model_weights_disposed_probably_recompiled"]);
			_grad_cam_invalidate_cache();
		} else {
			void (0); err("ERROR in next line stack:", e.stack);
			await write_error(e, null, null);
		}
		return null;
	}
}

function grad_cam_internal_find_last_conv_layer(_model) {
	let index = _model.layers.length - 1;
	while (index >= 0) {
		if (_model.layers[index].getClassName().startsWith("Conv")) {
			return index;
		}
		index--;
	}
	return -1;
}

/**
 * Builds both Grad-CAM sub-models WITHOUT ever calling getOutputAt(0)
 * on the original model's layers, and WITHOUT calling layer.apply()
 * on the original model's layer objects (which would add inbound nodes).
 *
 * Instead, we use tf.grad() with an imperative forward pass through
 * the model's weights, completely bypassing the symbolic graph.
 *
 * Strategy:
 *   auxModel:        A brand-new tf.LayersModel from a fresh symbolic
 *                    input to a fresh copy of each layer up to (and
 *                    including) the last conv layer.
 *   classifierModel: A brand-new tf.LayersModel from a fresh symbolic
 *                    input (shaped like the conv output) through fresh
 *                    copies of each layer after the conv layer.
 *
 * "Fresh copy" means we use tf.layers.<type>(config) to create a
 * structurally identical layer, then copy the weights from the
 * original. This guarantees zero interaction with the original
 * model's node graph.
 */
function _grad_cam_build_models_safe(_model, last_conv_layer_index) {
	// ── Helper: clone a single layer (structure + weights) ──────────
	function _clone_layer(original_layer) {
		var config = original_layer.getConfig();
		var class_name = original_layer.getClassName();

		// Remove 'name' so TF.js auto-generates a unique one,
		// preventing name collisions with the original model.
		delete config["name"];

		// Use the TF.js deserializer to create a layer from class+config.
		var cloned;
		try {
			cloned = tf.layers[class_name.charAt(0).toLowerCase() + class_name.slice(1)](config);
		} catch (_e) {
			// Some layer class names don't directly map to tf.layers.*
			// Fall back to the serialization API.
			cloned = tf.serialization.SerializationMap
				.getMap()
				.classNameMap[class_name][0]
				.fromConfig(
					tf.serialization.SerializationMap.getMap().classNameMap[class_name][0],
					config
				);
		}

		return cloned;
	}

	function _copy_weights(source_layer, dest_layer, dummy_tensor) {
		// We must call the dest layer on a tensor first to build it,
		// so that setWeights() works.
		try {
			dest_layer.apply(dummy_tensor);
		} catch (_e) {
			// Some layers (like Flatten) don't need explicit building
		}

		try {
			var w = source_layer.getWeights();
			if (w && w.length > 0) {
				dest_layer.setWeights(w);
			}
		} catch (_e2) {
			// Layers without weights (Flatten, etc.) — ignore
		}
	}

	// ── Part 1: auxModel (input → last conv output) ─────────────────
	var input_shape = _model.inputs[0].shape.slice(1); // drop batch dim
	var aux_input = input({ shape: input_shape });
	var y = aux_input;

	// We need to track the symbolic tensor at each step so we can
	// copy weights after building.
	var cloned_layers_part1 = [];

	for (var i = 0; i < _model.layers.length; i++) {
		var layer = _model.layers[i];

		// Skip InputLayer — our fresh `input()` replaces it.
		if (i === 0 && layer.getClassName() === "InputLayer") {
			continue;
		}

		var cloned = _clone_layer(layer);
		y = cloned.apply(y);
		cloned_layers_part1.push({ source: layer, dest: cloned });

		if (i === last_conv_layer_index) {
			break;
		}
	}

	var auxModel = tf_model({ inputs: aux_input, outputs: y });

	// Now copy weights for part 1.
	for (var wi = 0; wi < cloned_layers_part1.length; wi++) {
		try {
			var sw = cloned_layers_part1[wi].source.getWeights();
			if (sw && sw.length > 0) {
				cloned_layers_part1[wi].dest.setWeights(sw);
			}
		} catch (_e) {
			// weightless layers
		}
	}

	// ── Part 2: classifierModel (conv output → predictions) ─────────
	var conv_output_shape = y.shape.slice(1); // drop batch dim
	var cls_input = input({ shape: conv_output_shape });
	var z = cls_input;

	var cloned_layers_part2 = [];

	for (var j = last_conv_layer_index + 1; j < _model.layers.length; j++) {
		var layer2 = _model.layers[j];

		var cloned2 = _clone_layer(layer2);
		z = cloned2.apply(z);
		cloned_layers_part2.push({ source: layer2, dest: cloned2 });
	}

	var classifierModel = tf_model({ inputs: cls_input, outputs: z });

	// Copy weights for part 2.
	for (var wj = 0; wj < cloned_layers_part2.length; wj++) {
		try {
			var sw2 = cloned_layers_part2[wj].source.getWeights();
			if (sw2 && sw2.length > 0) {
				cloned_layers_part2[wj].dest.setWeights(sw2);
			}
		} catch (_e2) {
			// weightless layers
		}
	}

	return { auxModel: auxModel, classifierModel: classifierModel };
}

function grad_cam_internal_compute_heatmap(aux_model, sub_model2, x, class_idx, overlay_factor) {
	function conv_output_to_class_output(input_tensor) {
		return sub_model2
			.apply(input_tensor, { training: true })
			.gather([class_idx], 1);
	}

	const grad_function = grad(conv_output_to_class_output);
	const conv_output = aux_model.apply(x);
	const grads = grad_function(conv_output);
	const pooled_grads = tf_mean(grads, [0, 1, 2]);
	const scaled_conv_output = tf_mul(conv_output, pooled_grads);
	let heat_map = tf_mean(scaled_conv_output, -1);

	heat_map = tf_relu(heat_map);
	heat_map = expand_dims(tf_div(heat_map, tf_max(heat_map)), -1);

	if (!heat_map) {
		log(`grad_class_activation_map: heat_map could not be generated.`);
		return null;
	}

	heat_map = resize_image(heat_map, [x.shape[1], x.shape[2]]);
	heat_map = apply_color_map(heat_map);

	const overlay = tf_add(tf_mul(heat_map, overlay_factor), tf_div(x, 255));
	const result = tf_div(overlay, tf_mul(tf_max(overlay), 255));

	return result;
}
