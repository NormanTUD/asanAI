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

				// Guard against NaN/Infinity and clamp to [0, 1]
				let clampedValue = pixelValue;
				if (!isFinite(clampedValue) || isNaN(clampedValue)) {
					clampedValue = 0;
				}
				clampedValue = Math.max(0, Math.min(1, clampedValue));

				// Clamp row index to valid colormap bounds
				let row = Math.floor(clampedValue * (colorMapSize - 1));
				row = Math.max(0, Math.min(colorMapSize - 1, row));

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
	// Use the visible layers (model.layers), which excludes InputLayer
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
 * This version correctly handles skip connections (Add, Concatenate, etc.)
 * by rebuilding the full topology graph instead of assuming sequential flow.
 *
 * Strategy:
 *   auxModel:        From input to last conv layer output (following topology).
 *   classifierModel: From conv output shape to final output (sequential subset,
 *                    skipping merge layers that can't be replicated without
 *                    the full graph).
 */
function _grad_cam_clone_layer(original_layer) {
	var config = original_layer.getConfig();
	var class_name = original_layer.getClassName();
	delete config["name"];

	var cloned;
	try {
		cloned = tf.layers[class_name.charAt(0).toLowerCase() + class_name.slice(1)](config);
	} catch (_e) {
		try {
			cloned = tf.serialization.SerializationMap
				.getMap()
				.classNameMap[class_name][0]
				.fromConfig(
					tf.serialization.SerializationMap.getMap().classNameMap[class_name][0],
					config
				);
		} catch (_e2) {
			cloned = tf.layers[class_name.toLowerCase()](config);
		}
	}

	return cloned;
}

function _grad_cam_is_merge_layer(layer) {
	var class_name = layer.getClassName();
	return ['Add', 'Concatenate', 'Multiply', 'Average', 'Maximum', 'Minimum', 'Dot'].includes(class_name);
}

function _grad_cam_get_inbound_layer_indices(_model, layer_index) {
	var layer = _model._allLayers
		? _model._allLayers[layer_index]
		: _model.layers[layer_index];

	var inbound_indices = [];

	try {
		var inboundNodes = layer.inboundNodes || layer._inboundNodes;
		if (inboundNodes && inboundNodes.length > 0) {
			var node = inboundNodes[0];
			var inboundLayers = node.inboundLayers || [];
			for (var il = 0; il < inboundLayers.length; il++) {
				var inbound_layer = inboundLayers[il];
				var all_layers = _model._allLayers || _model.layers;
				for (var li = 0; li < all_layers.length; li++) {
					if (all_layers[li] === inbound_layer) {
						inbound_indices.push(li);
						break;
					}
				}
			}
		}
	} catch (_e) {
	}

	return inbound_indices;
}

function _grad_cam_clone_layers_range(_model, all_layers, start_idx, end_idx, tensor_map, last_tensor) {
	var cloned_layers = [];
	var last_y = last_tensor;

	for (var i = start_idx; i <= end_idx; i++) {
		var layer = all_layers[i];

		if (layer.getClassName() === "InputLayer") {
			continue;
		}

		var is_merge = _grad_cam_is_merge_layer(layer);
		var inbound_indices = _grad_cam_get_inbound_layer_indices(_model, i);

		var cloned;
		var layer_output;

		if (is_merge && inbound_indices.length >= 2) {
			var merge_inputs = [];
			var all_inputs_available = true;

			for (var mi = 0; mi < inbound_indices.length; mi++) {
				var inbound_idx = inbound_indices[mi];
				if (tensor_map[inbound_idx] !== undefined) {
					merge_inputs.push(tensor_map[inbound_idx]);
				} else {
					all_inputs_available = false;
					break;
				}
			}

			if (all_inputs_available && merge_inputs.length >= 2) {
				cloned = _grad_cam_clone_layer(layer);
				try {
					layer_output = cloned.apply(merge_inputs);
				} catch (merge_err) {
					wrn("[Grad-CAM] Merge layer clone failed: " + merge_err.message + ". Using first input as passthrough.");
					layer_output = merge_inputs[0];
					cloned = null;
				}
			} else {
				layer_output = last_y;
				cloned = null;
			}
		} else {
			var layer_input;
			if (inbound_indices.length === 1 && tensor_map[inbound_indices[0]] !== undefined) {
				layer_input = tensor_map[inbound_indices[0]];
			} else {
				layer_input = last_y;
			}

			cloned = _grad_cam_clone_layer(layer);
			try {
				layer_output = cloned.apply(layer_input);
			} catch (apply_err) {
				if (layer_input !== last_y) {
					try {
						cloned = _grad_cam_clone_layer(layer);
						layer_output = cloned.apply(last_y);
					} catch (_e2) {
						wrn("[Grad-CAM] Could not apply layer " + i + " (" + layer.getClassName() + "): " + _e2.message);
						layer_output = last_y;
						cloned = null;
					}
				} else {
					wrn("[Grad-CAM] Could not apply layer " + i + " (" + layer.getClassName() + "): " + apply_err.message);
					layer_output = last_y;
					cloned = null;
				}
			}
		}

		tensor_map[i] = layer_output;
		last_y = layer_output;

		if (cloned) {
			cloned_layers.push({ source: layer, dest: cloned });
		}
	}

	return { cloned_layers: cloned_layers, last_y: last_y };
}

function _grad_cam_copy_weights(cloned_layers) {
	for (var wi = 0; wi < cloned_layers.length; wi++) {
		try {
			var sw = cloned_layers[wi].source.getWeights();
			if (sw && sw.length > 0) {
				cloned_layers[wi].dest.setWeights(sw);
			}
		} catch (_e) {
		}
	}
}

function _grad_cam_build_models_safe(_model, last_conv_layer_index) {
	var all_layers = _model._allLayers || _model.layers;

	var input_layer_index = -1;
	for (var idx = 0; idx < all_layers.length; idx++) {
		if (all_layers[idx].getClassName() === "InputLayer") {
			input_layer_index = idx;
			break;
		}
	}

	var actual_last_conv_index = -1;
	var visible_layer_count = 0;
	for (var idx2 = 0; idx2 < all_layers.length; idx2++) {
		if (all_layers[idx2].getClassName() === "InputLayer") continue;
		if (visible_layer_count === last_conv_layer_index) {
			actual_last_conv_index = idx2;
			break;
		}
		visible_layer_count++;
	}

	if (actual_last_conv_index < 0) {
		actual_last_conv_index = last_conv_layer_index + (input_layer_index >= 0 ? 1 : 0);
	}

	// Part 1: auxModel (input → last conv output)
	var input_shape = _model.inputs[0].shape.slice(1);
	var aux_input = input({ shape: input_shape });

	var tensor_map = {};
	if (input_layer_index >= 0) {
		tensor_map[input_layer_index] = aux_input;
	} else {
		tensor_map[-1] = aux_input;
	}

	var result1 = _grad_cam_clone_layers_range(
		_model, all_layers, 0, actual_last_conv_index, tensor_map, aux_input
	);

	var y = result1.last_y;
	var auxModel = tf_model({ inputs: aux_input, outputs: y });
	_grad_cam_copy_weights(result1.cloned_layers);

	// Part 2: classifierModel (conv output → predictions)
	var conv_output_shape = y.shape.slice(1);
	var cls_input = input({ shape: conv_output_shape });

	var tensor_map2 = {};
	tensor_map2[actual_last_conv_index] = cls_input;

	var result2 = _grad_cam_clone_layers_range(
		_model, all_layers, actual_last_conv_index + 1, all_layers.length - 1, tensor_map2, cls_input
	);

	var z = result2.last_y;
	var classifierModel = tf_model({ inputs: cls_input, outputs: z });
	_grad_cam_copy_weights(result2.cloned_layers);

	return { auxModel: auxModel, classifierModel: classifierModel };
}

function grad_cam_internal_compute_heatmap(aux_model, sub_model2, x, class_idx, overlay_factor) {
	const EPSILON = 1e-7;

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

	// Apply ReLU and check if everything got zeroed out
	const heat_map_relu = tf_relu(heat_map);
	const max_after_relu = tf_max(heat_map_relu);
	const max_val = max_after_relu.dataSync()[0];

	if (max_val < EPSILON) {
		// All gradients were negative/zero after ReLU — fallback:
		// Use tf.abs() directly since there's no tf_abs wrapper.
		// This preserves spatial structure even when contributions are negative.
		heat_map = tf.abs(heat_map);
		const max_abs = tf_max(heat_map);
		const max_abs_val = max_abs.dataSync()[0];

		if (max_abs_val < EPSILON) {
			// Truly zero everywhere — nothing to visualize
			log(`grad_class_activation_map: heat_map is entirely zero, cannot generate.`);
			return null;
		}

		heat_map = expand_dims(tf_div(heat_map, tf_add(max_abs, EPSILON)), -1);
	} else {
		heat_map = heat_map_relu;
		heat_map = expand_dims(tf_div(heat_map, tf_add(max_after_relu, EPSILON)), -1);
	}

	heat_map = resize_image(heat_map, [x.shape[1], x.shape[2]]);
	heat_map = apply_color_map(heat_map);

	const overlay = tf_add(tf_mul(heat_map, overlay_factor), tf_div(x, 255));
	const result = tf_div(overlay, tf_add(tf_max(overlay), EPSILON));

	return result;
}
