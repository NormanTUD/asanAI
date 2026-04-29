"use strict";

function _temml() {
    try {
        const elements = $(".temml_me").toArray().filter(e =>
            e.textContent.trim() &&
            !e.dataset.rendered &&
            $(e).is(":visible")
        );

        if (!elements.length) return;

        const batch_size = 20;
        let i = 0;

        function render_batch() {
            const batch = elements.slice(i, i + batch_size);
            for (const e of batch) render_temml_quick(e);
            i += batch_size;
            if (i < elements.length)
                setTimeout(render_batch, 0);
        }

        render_batch();
    } catch (e) {
        console.error("temml:", e);
    }
}

function render_temml_quick(e) {
    const $e = $(e);
    const latex = e.textContent.trim();
    if (!latex) return;

    if (e.querySelector && e.querySelector('.math-ed-num')) {
        return;
    }

    try {
        const tmp = document.createElement("span");
        temml.render(latex, tmp);
        e.innerHTML = tmp.innerHTML;
        e.dataset.rendered = "1";
        e.dataset.latex = latex;
        $e.off("contextmenu.temml").on("contextmenu.temml", ev => {
            ev.preventDefault();
            create_centered_window_with_text(latex);
        });
    } catch (err) {
        wrn("temml error:", err);
        wrn(`latex:\n>>>>\n${latex}\n<<<<\n`);
        wrn(get_stack_trace(1));
    }
}

// ============================================================
// HYBRID DENSE INJECTION (called after DOM is ready)
// ============================================================

function _inject_hybrid_dense_direct(container_id, layer_idx, layer_data, colors, input_layer) {
	var container = document.getElementById(container_id);
	if (!container) {
		console.warn("[_inject_hybrid_dense_direct] Container not found:", container_id);
		return;
	}

	_purge_stale_editables(layer_idx);
	_resync_layer_data(layer_idx, layer_data);

	var kernel = layer_data[layer_idx].kernel;
	var bias = layer_data[layer_idx].bias;
	var decimals = get_dec_points_math_mode();
	var max_rows = Math.min(kernel.length, get_max_nr_cols_rows());
	var max_cols = Math.min(kernel[0] ? kernel[0].length : 1, get_max_nr_cols_rows());
	var max_bias = Math.min(bias ? bias.length : 0, get_max_nr_cols_rows());

	var weight_indices = _resolve_weight_indices(layer_idx);
	var kernel_weight_idx = weight_indices.kernel;
	var bias_weight_idx = weight_indices.bias;

	_register_kernel_editables(layer_idx, layer_data, max_rows, max_cols, decimals, kernel_weight_idx);
	_register_bias_editables(layer_idx, layer_data, max_bias, decimals, bias_weight_idx);

	var all_editables = [];
	var kernel_latex = _build_kernel_latex(layer_idx, kernel, max_rows, max_cols, decimals, all_editables);
	var right_side = _build_right_side(layer_idx, input_layer);
	var full_latex = kernel_latex + " \\times " + right_side;

	if (bias && bias.length && bias_weight_idx !== -1) {
		full_latex += _build_bias_latex(layer_idx, bias, max_bias, decimals, all_editables);
	}

	el_render_single_latex_with_editables(container, full_latex, all_editables);
}

// --- Helpers ---

function _purge_stale_editables(layer_idx) {
	var prefix = "L" + layer_idx + "_";
	_math_editables = _math_editables.filter(function(ed) {
		return ed.id.indexOf(prefix) !== 0;
	});
}

function _resync_layer_data(layer_idx, layer_data) {
	if (!model || !model.layers || !model.layers[layer_idx] || !model.layers[layer_idx].weights) return;

	var fresh_layer = {};
	var possible_weight_names = ["kernel", "bias"];

	for (var wi = 0; wi < model.layers[layer_idx].weights.length; wi++) {
		var wname = get_weight_name_by_layer_and_weight_index(layer_idx, wi);
		if (possible_weight_names.indexOf(wname) === -1) continue;

		var wval = model.layers[layer_idx].weights[wi].val;
		if (!wval || wval.isDisposed) continue;

		fresh_layer[wname] = Array.from(wval.dataSync());

		if (wname === "kernel" && wval.shape.length === 2) {
			fresh_layer[wname] = _reshape_flat_to_matrix(fresh_layer[wname], wval.shape);
		}
	}

	if (fresh_layer.kernel) layer_data[layer_idx].kernel = fresh_layer.kernel;
	if (fresh_layer.bias) layer_data[layer_idx].bias = fresh_layer.bias;
}

function _reshape_flat_to_matrix(flat, shape) {
	var rows = shape[0], cols = shape[1];
	var matrix = [];
	for (var r = 0; r < rows; r++) {
		matrix.push(flat.slice(r * cols, (r + 1) * cols));
	}
	return matrix;
}

function _resolve_weight_indices(layer_idx) {
	var result = { kernel: -1, bias: -1 };
	if (!model || !model.layers || !model.layers[layer_idx] || !model.layers[layer_idx].weights) return result;

	var layer_weights = model.layers[layer_idx].weights;
	for (var wi = 0; wi < layer_weights.length; wi++) {
		var wname = get_weight_name_by_layer_and_weight_index(layer_idx, wi);
		if (wname === "kernel" && result.kernel === -1) {
			result.kernel = wi;
		} else if (wname === "bias" && result.bias === -1) {
			result.bias = wi;
		}
	}
	return result;
}

function _register_kernel_editables(layer_idx, layer_data, max_rows, max_cols, decimals, kernel_weight_idx) {
	for (var i = 0; i < max_rows; i++) {
		for (var j = 0; j < max_cols; j++) {
			_register_single_kernel_editable(layer_idx, layer_data, i, j, kernel_weight_idx, decimals);
		}
	}
}

function _register_single_kernel_editable(layer_idx, layer_data, row, col, kwi, decimals) {
	var eid = "L" + layer_idx + "_kernel_" + row + "_" + col;
	math_register_editable(eid, function() { return layer_data[layer_idx].kernel[row][col]; }, function(v) { layer_data[layer_idx].kernel[row][col] = v; if (kwi >= 0) _math_apply_single_weight(layer_idx, kwi, layer_data[layer_idx].kernel); }, -10, 10, "Layer " + layer_idx + " kernel[" + row + "][" + col + "]", { decimals: decimals });
}

function _register_bias_editables(layer_idx, layer_data, max_bias, decimals, bias_weight_idx) {
	if (!layer_data[layer_idx].bias || !layer_data[layer_idx].bias.length || bias_weight_idx === -1) return;

	for (var b = 0; b < max_bias; b++) {
		_register_single_bias_editable(layer_idx, layer_data, b, bias_weight_idx, decimals);
	}
}

function _register_single_bias_editable(layer_idx, layer_data, idx, bwi, decimals) {
	var eid = "L" + layer_idx + "_bias_" + idx;
	math_register_editable(eid, function() { return layer_data[layer_idx].bias[idx]; }, function(v) { layer_data[layer_idx].bias[idx] = v; if (bwi >= 0) _math_apply_single_weight(layer_idx, bwi, layer_data[layer_idx].bias); }, -10, 10, "Layer " + layer_idx + " bias[" + idx + "]", { decimals: decimals });
}

function _build_kernel_latex(layer_idx, kernel, max_rows, max_cols, decimals, all_editables) {
	var latex = "\\underbrace{\\begin{pmatrix}\n";

	for (var row = 0; row < max_rows; row++) {
		var row_parts = [];
		for (var col = 0; col < max_cols; col++) {
			var eid = "L" + layer_idx + "_kernel_" + row + "_" + col;
			var ed = math_find_editable(eid);
			var val = ed ? ed.get().toFixed(decimals) : "0";
			row_parts.push("\\textcolor{#53d8fb}{" + val + "}");
			all_editables.push({ eid: eid, value: val });
		}
		if (kernel[row] && kernel[row].length > max_cols) {
			row_parts.push("\\cdots");
		}
		latex += row_parts.join(" & ");
		if (row < max_rows - 1) latex += " \\\\\n";
	}

	if (kernel.length > max_rows) {
		latex += " \\\\ \\vdots & \\ddots";
	}
	latex += "\n\\end{pmatrix}}_{\\text{Weights}^{" + array_size(kernel).join("\\times") + "}}";
	return latex;
}

function _build_right_side(layer_idx, input_layer) {
	if (layer_idx === 0) {
		return array_to_latex(input_layer, "Input");
	}
	return _get_h(Math.max(0, layer_idx - 1));
}

function _build_bias_latex(layer_idx, bias, max_bias, decimals, all_editables) {
	var latex = " + \\underbrace{\\begin{pmatrix}\n";
	var parts = [];

	for (var bi = 0; bi < max_bias; bi++) {
		var beid = "L" + layer_idx + "_bias_" + bi;
		var bed = math_find_editable(beid);
		var bval = bed ? bed.get().toFixed(decimals) : "0";
		parts.push("\\textcolor{#53d8fb}{" + bval + "}");
		all_editables.push({ eid: beid, value: bval });
	}

	if (bias.length > max_bias) {
		parts.push("\\vdots");
	}
	latex += parts.join(" \\\\\n");
	latex += "\n\\end{pmatrix}}_{\\text{Bias}}";
	return latex;
}

// ============================================================
// APPLY WEIGHT TO MODEL
// ============================================================

function _math_apply_single_weight(layer_idx, weight_idx, new_array) {
	try {
		if (!model || !model.layers || !model.layers[layer_idx]) return;
		if (weight_idx < 0) return;

		var weight = model.layers[layer_idx].weights[weight_idx];
		if (!weight || !weight.val || weight.val.isDisposed) return;

		var old_tensor = weight.val;

		// Flatten correctly regardless of nesting depth
		var flat;
		if (Array.isArray(new_array) && Array.isArray(new_array[0])) {
			flat = new_array.flat(Infinity);
		} else if (Array.isArray(new_array)) {
			flat = new_array.slice();
		} else {
			flat = [new_array];
		}

		// The tensor shape is the source of truth.
		// If sizes don't match, the layer_data is out of sync with the model.
		// This can happen if the model was recompiled. In that case, we need to
		// re-read the tensor and only update the portion that matches.
		if (flat.length !== old_tensor.size) {
			console.warn("[_math_apply_single_weight] Size mismatch: tensor expects " +
				old_tensor.size + " values (shape " + old_tensor.shape + ") but got " +
				flat.length + " from layer_data. Re-syncing from model.");

			// The layer_data is stale. We cannot safely assign.
			// Force a full re-render which will re-sync layer_data from the model.
			// This triggers the re-sync at the top of _inject_hybrid_dense_direct next time.
			return;
		}

		var new_tensor = tf.tensor(flat, old_tensor.shape);
		weight.val.assign(new_tensor);
		new_tensor.dispose();
	} catch (e) {
		console.error("[_math_apply_single_weight] Error:", e);
	}
}

function _infer_shape(arr) {
	var shape = [];
	var current = arr;
	while (Array.isArray(current)) {
		shape.push(current.length);
		current = current[0];
	}
	return shape;
}
