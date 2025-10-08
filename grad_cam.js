function apply_color_map (x) {
	assert(x.rank === 4, `Expected rank-4 tensor input, got rank ${x.rank}`);
	assert(x.shape[0] === 1, `Expected exactly one example, but got ${x.shape[0]} examples`);
	assert(x.shape[3] === 1, `Expected exactly one channel, but got ${x.shape[3]} channels`);

	var res = tidy(() => {
		// Get normalized x.
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

		const aux_model = grad_cam_internal_create_aux_model(_model, last_conv_layer_nr);
		const sub_model2 = grad_cam_internal_create_sub_model2(_model, last_conv_layer_nr);

		const retval = tidy(() => {
			try {
				return grad_cam_internal_compute_heatmap(aux_model, sub_model2, x, class_idx, overlay_factor);
			} catch (e) {
				if (("" + e).includes("already disposed")) {
					dbg(language[lang]["model_weights_disposed_probably_recompiled"]);
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

function grad_cam_internal_create_aux_model(_model, last_conv_layer_index) {
	const last_conv_output = _model.getLayer(null, last_conv_layer_index).getOutputAt(0);
	return tf_model({
		inputs: _model.inputs,
		outputs: last_conv_output
	});
}

function grad_cam_internal_create_sub_model2(_model, start_index) {
	const layer_output = _model.getLayer(null, start_index).getInputAt(0);
	const new_input = input({ shape: layer_output.shape.slice(1) });
	let y = new_input;

	while (start_index < _model.layers.length) {
		const layer = _model.layers[start_index];
		console.log("y:", y, "layer:", layer);
		if (Object.keys(layer).includes("original_apply_real")) {
			y = layer.original_apply_real(y);
		} else {
			y = layer.apply(y);
		}
		start_index++;
	}

	return tf_model({
		inputs: new_input,
		outputs: y
	});
}

function grad_cam_internal_compute_heatmap(aux_model, sub_model2, x, class_idx, overlay_factor) {
	function conv_output_to_class_output(input_tensor) {
		return sub_model2
			.apply(input_tensor, { training: true })
			.gather([class_idx], 1);
	}

	const grad_function = grad(conv_output_to_class_output);
	const conv_output = aux_model.apply(x);
	log("conv_output", conv_output);
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

	// Normalize and blend input + heatmap
	const overlay = tf_add(tf_mul(heat_map, overlay_factor), tf_div(x, 255));
	const result = tf_div(overlay, tf_mul(tf_max(overlay), 255));

	return result;
}
