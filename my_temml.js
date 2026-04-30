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
        if (started_training) {
            console.warn("[_math_apply_single_weight] Cannot apply weight changes while training is in progress.");
            return;
        }

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
        if (flat.length !== old_tensor.size) {
            console.warn("[_math_apply_single_weight] Size mismatch: tensor expects " +
                old_tensor.size + " values (shape " + old_tensor.shape + ") but got " +
                flat.length + " from layer_data. Re-syncing from model.");
            return;
        }

        var new_tensor = tf.tensor(flat, old_tensor.shape);
        weight.val.assign(new_tensor);
        new_tensor.dispose();
    } catch (e) {
        console.error("[_math_apply_single_weight] Error:", e);
    }
}

// ============================================================
// HYBRID BATCHNORM INJECTION (called after DOM is ready)
// ============================================================

function _inject_hybrid_batchnorm_direct(container_id, layer_idx, layer_data, colors, y_layer) {
	var container = document.getElementById(container_id);
	if (!container) {
		console.warn("[_inject_hybrid_batchnorm_direct] Container not found:", container_id);
		return;
	}

	_purge_stale_editables(layer_idx);
	_resync_batchnorm_layer_data(layer_idx, layer_data);

	var gamma = layer_data[layer_idx].gamma;
	var beta = layer_data[layer_idx].beta;
	var decimals = get_dec_points_math_mode();
	var max_gamma = Math.min(gamma ? gamma.length : 0, get_max_nr_cols_rows());
	var max_beta = Math.min(beta ? beta.length : 0, get_max_nr_cols_rows());

	var weight_indices = _resolve_batchnorm_weight_indices(layer_idx);
	var gamma_weight_idx = weight_indices.gamma;
	var beta_weight_idx = weight_indices.beta;

	_register_gamma_editables(layer_idx, layer_data, max_gamma, decimals, gamma_weight_idx);
	_register_beta_editables(layer_idx, layer_data, max_beta, decimals, beta_weight_idx);

	var all_editables = [];
	var full_latex = _build_batchnorm_full_latex(layer_idx, layer_data, gamma, beta, max_gamma, max_beta, decimals, all_editables, y_layer);

	el_render_single_latex_with_editables(container, full_latex, all_editables);
}

// --- BatchNorm Helpers ---

function _resync_batchnorm_layer_data(layer_idx, layer_data) {
	if (!model || !model.layers || !model.layers[layer_idx] || !model.layers[layer_idx].weights) return;

	var fresh_layer = {};
	var possible_weight_names = ["gamma", "beta", "moving_mean", "moving_variance"];

	for (var wi = 0; wi < model.layers[layer_idx].weights.length; wi++) {
		var wname = get_weight_name_by_layer_and_weight_index(layer_idx, wi);
		if (possible_weight_names.indexOf(wname) === -1) continue;

		var wval = model.layers[layer_idx].weights[wi].val;
		if (!wval || wval.isDisposed) continue;

		fresh_layer[wname] = Array.from(wval.dataSync());
	}

	if (fresh_layer.gamma) layer_data[layer_idx].gamma = fresh_layer.gamma;
	if (fresh_layer.beta) layer_data[layer_idx].beta = fresh_layer.beta;
	if (fresh_layer.moving_mean) layer_data[layer_idx].moving_mean = fresh_layer.moving_mean;
	if (fresh_layer.moving_variance) layer_data[layer_idx].moving_variance = fresh_layer.moving_variance;
}

function _resolve_batchnorm_weight_indices(layer_idx) {
	var result = { gamma: -1, beta: -1 };
	if (!model || !model.layers || !model.layers[layer_idx] || !model.layers[layer_idx].weights) return result;

	var layer_weights = model.layers[layer_idx].weights;
	for (var wi = 0; wi < layer_weights.length; wi++) {
		var wname = get_weight_name_by_layer_and_weight_index(layer_idx, wi);
		if (wname === "gamma" && result.gamma === -1) {
			result.gamma = wi;
		} else if (wname === "beta" && result.beta === -1) {
			result.beta = wi;
		}
	}
	return result;
}

function _register_gamma_editables(layer_idx, layer_data, max_gamma, decimals, gamma_weight_idx) {
	if (!layer_data[layer_idx].gamma || !layer_data[layer_idx].gamma.length || gamma_weight_idx === -1) return;

	for (var g = 0; g < max_gamma; g++) {
		_register_single_gamma_editable(layer_idx, layer_data, g, gamma_weight_idx, decimals);
	}
}

function _register_single_gamma_editable(layer_idx, layer_data, idx, gwi, decimals) {
	var eid = "L" + layer_idx + "_gamma_" + idx;
	math_register_editable(eid, function() { return layer_data[layer_idx].gamma[idx]; }, function(v) { layer_data[layer_idx].gamma[idx] = v; if (gwi >= 0) _math_apply_single_weight(layer_idx, gwi, layer_data[layer_idx].gamma); }, -10, 10, "Layer " + layer_idx + " gamma[" + idx + "]", { decimals: decimals });
}

function _register_beta_editables(layer_idx, layer_data, max_beta, decimals, beta_weight_idx) {
	if (!layer_data[layer_idx].beta || !layer_data[layer_idx].beta.length || beta_weight_idx === -1) return;

	for (var b = 0; b < max_beta; b++) {
		_register_single_beta_editable(layer_idx, layer_data, b, beta_weight_idx, decimals);
	}
}

function _register_single_beta_editable(layer_idx, layer_data, idx, bwi, decimals) {
	var eid = "L" + layer_idx + "_beta_" + idx;
	math_register_editable(eid, function() { return layer_data[layer_idx].beta[idx]; }, function(v) { layer_data[layer_idx].beta[idx] = v; if (bwi >= 0) _math_apply_single_weight(layer_idx, bwi, layer_data[layer_idx].beta); }, -10, 10, "Layer " + layer_idx + " beta[" + idx + "]", { decimals: decimals });
}

function _build_batchnorm_full_latex(layer_idx, layer_data, gamma, beta, max_gamma, max_beta, decimals, all_editables, y_layer) {
	var _epsilon = model?.layers[layer_idx]?.epsilon;

	// --- Mini-batch mean ---
	var mini_batch_mean = "\\underbrace{\\mu_\\mathcal{B} = \\frac{1}{n} \\sum_{i=1}^n x_i}_{\\text{Batch mean}}";

	// --- Mini-batch variance ---
	var mini_batch_variance = "\\underbrace{\\sigma_\\mathcal{B}^2 = \\frac{1}{n} \\sum_{i = 1}^n \\left(x_i - \\mu_\\mathcal{B}\\right)^2}_{\\text{Batch variance}}";

	// --- Normalize equation ---
	var x_equation = '\\epsilon \\text{ could not be determined}';
	if (_epsilon !== undefined) {
		x_equation = "\\overline{x_i} \\longrightarrow \\underbrace{\\frac{x_i - \\mu_\\mathcal{B}}{\\sqrt{\\sigma_\\mathcal{B}^2 + \\epsilon \\left( = " + _epsilon + "\\right)}}}_\\text{Normalize}";
	}

	// --- Gamma (colored + editable) ---
	var gamma_latex = _build_batchnorm_param_latex(layer_idx, "gamma", gamma, max_gamma, decimals, all_editables);

	// --- Beta (colored + editable) ---
	var beta_latex = _build_batchnorm_param_latex(layer_idx, "beta", beta, max_beta, decimals, all_editables);

	// --- Output name ---
	var outname = "";
	if (layer_idx == layer_data.length - 1) {
		outname = array_to_latex(y_layer, "Output") + " \\longrightarrow ";
	} else {
		outname += _get_h(layer_idx) + " \\longrightarrow ";
	}

	// --- y equation with interactive gamma and beta ---
	var y_equation = "y_i = \\underbrace{\\underbrace{\\gamma}_{" + gamma_latex + "}\\overline{x_i} + \\underbrace{\\beta}_{" + beta_latex + "}}_{\\text{Scaling\\&shifting}}";

	var between_equations = ",\\qquad ";
	var skip_between_equations = ",\\\\[10pt]\\\\\n";

	var str = "\\begin{array}{c}\n";
	str += "\\displaystyle " + mini_batch_mean + between_equations;
	str += "\\displaystyle " + mini_batch_variance + between_equations;
	str += "\\displaystyle " + x_equation + skip_between_equations;
	str += "\\displaystyle " + outname + y_equation;
	str += "\\end{array}\n";

	return str;
}

function _build_batchnorm_param_latex(layer_idx, param_name, param_array, max_count, decimals, all_editables) {
	if (!param_array || !param_array.length) {
		return "\\text{N/A}";
	}

	var latex = "\\displaystyle \\begin{pmatrix}\n";
	var parts = [];

	for (var i = 0; i < max_count; i++) {
		var eid = "L" + layer_idx + "_" + param_name + "_" + i;
		var ed = math_find_editable(eid);
		var val = ed ? ed.get().toFixed(decimals) : "0";
		parts.push("\\textcolor{#53d8fb}{" + val + "}");
		all_editables.push({ eid: eid, value: val });
	}

	if (param_array.length > max_count) {
		parts.push("\\vdots");
	}

	latex += parts.join(" \\\\\n");
	latex += "\n\\end{pmatrix}";

	return latex;
}

// ============================================================
// HYBRID BATCHNORM INJECTION (called after DOM is ready)
// ============================================================

function _inject_hybrid_batchnorm_direct(container_id, layer_idx, layer_data, colors, y_layer) {
	var container = document.getElementById(container_id);
	if (!container) {
		console.warn("[_inject_hybrid_batchnorm_direct] Container not found:", container_id);
		return;
	}

	_purge_stale_editables(layer_idx);
	_resync_layer_data_for_params(layer_idx, layer_data, ["gamma", "beta", "moving_mean", "moving_variance"]);

	var gamma = layer_data[layer_idx].gamma;
	var beta = layer_data[layer_idx].beta;
	var decimals = get_dec_points_math_mode();
	var max_gamma = Math.min(gamma ? gamma.length : 0, get_max_nr_cols_rows());
	var max_beta = Math.min(beta ? beta.length : 0, get_max_nr_cols_rows());

	var weight_indices = _resolve_weight_indices_by_name(layer_idx, ["gamma", "beta"]);

	_register_1d_param_editables(layer_idx, layer_data, "gamma", max_gamma, decimals, weight_indices["gamma"]);
	_register_1d_param_editables(layer_idx, layer_data, "beta", max_beta, decimals, weight_indices["beta"]);

	var all_editables = [];
	var full_latex = _build_batchnorm_full_latex(layer_idx, layer_data, gamma, beta, max_gamma, max_beta, decimals, all_editables, y_layer);

	el_render_single_latex_with_editables(container, full_latex, all_editables);
}

// ============================================================
// GENERALIZED HELPERS (reusable across layer types)
// ============================================================

/**
 * Re-sync specific parameter names from the live model into layer_data.
 * Works for any layer type that has named weights.
 */
function _resync_layer_data_for_params(layer_idx, layer_data, param_names) {
	if (!model || !model.layers || !model.layers[layer_idx] || !model.layers[layer_idx].weights) return;

	for (var wi = 0; wi < model.layers[layer_idx].weights.length; wi++) {
		var wname = get_weight_name_by_layer_and_weight_index(layer_idx, wi);
		if (param_names.indexOf(wname) === -1) continue;

		var wval = model.layers[layer_idx].weights[wi].val;
		if (!wval || wval.isDisposed) continue;

		layer_data[layer_idx][wname] = Array.from(wval.dataSync());
	}
}

/**
 * Resolve weight indices by name for a given layer.
 * Returns an object like { "gamma": 0, "beta": 1, ... } or -1 if not found.
 */
function _resolve_weight_indices_by_name(layer_idx, names) {
	var result = {};
	for (var i = 0; i < names.length; i++) {
		result[names[i]] = -1;
	}

	if (!model || !model.layers || !model.layers[layer_idx] || !model.layers[layer_idx].weights) return result;

	var layer_weights = model.layers[layer_idx].weights;
	for (var wi = 0; wi < layer_weights.length; wi++) {
		var wname = get_weight_name_by_layer_and_weight_index(layer_idx, wi);
		if (wname in result && result[wname] === -1) {
			result[wname] = wi;
		}
	}
	return result;
}

/**
 * Register editables for a 1D parameter array (e.g., bias, gamma, beta).
 * Reusable for any layer type that has 1D trainable vectors.
 */
function _register_1d_param_editables(layer_idx, layer_data, param_name, max_count, decimals, weight_idx) {
	if (!layer_data[layer_idx][param_name] || !layer_data[layer_idx][param_name].length || weight_idx === -1) return;

	for (var i = 0; i < max_count; i++) {
		_register_single_1d_editable(layer_idx, layer_data, param_name, i, weight_idx, decimals);
	}
}

function _register_single_1d_editable(layer_idx, layer_data, param_name, idx, weight_idx, decimals) {
	var eid = "L" + layer_idx + "_" + param_name + "_" + idx;
	math_register_editable(eid, function() { return layer_data[layer_idx][param_name][idx]; }, function(v) { layer_data[layer_idx][param_name][idx] = v; if (weight_idx >= 0) { _math_apply_single_weight(layer_idx, weight_idx, layer_data[layer_idx][param_name]); } }, -10, 10, "Layer " + layer_idx + " " + param_name + "[" + idx + "]", { decimals: decimals });
}

/**
 * Build a colored, editable pmatrix for a 1D parameter array.
 * Pushes editable entries into all_editables. Returns LaTeX string.
 */
function _build_1d_param_latex(layer_idx, param_name, param_array, max_count, decimals, all_editables) {
	if (!param_array || !param_array.length) {
		return "\\text{N/A}";
	}

	var latex = "\\displaystyle \\begin{pmatrix}\n";
	var parts = [];

	for (var i = 0; i < max_count; i++) {
		var eid = "L" + layer_idx + "_" + param_name + "_" + i;
		var ed = math_find_editable(eid);
		var val = ed ? ed.get().toFixed(decimals) : "0";
		parts.push("\\textcolor{#53d8fb}{" + val + "}");
		all_editables.push({ eid: eid, value: val });
	}

	if (param_array.length > max_count) {
		parts.push("\\vdots");
	}

	latex += parts.join(" \\\\\n");
	latex += "\n\\end{pmatrix}";

	return latex;
}

// ============================================================
// BATCHNORM-SPECIFIC LATEX BUILDER
// ============================================================

function _build_batchnorm_full_latex(layer_idx, layer_data, gamma, beta, max_gamma, max_beta, decimals, all_editables, y_layer) {
	var _epsilon = model?.layers[layer_idx]?.epsilon;

	// --- Mini-batch mean ---
	var mini_batch_mean = "\\underbrace{\\mu_\\mathcal{B} = \\frac{1}{n} \\sum_{i=1}^n x_i}_{\\text{Batch mean}}";

	// --- Mini-batch variance ---
	var mini_batch_variance = "\\underbrace{\\sigma_\\mathcal{B}^2 = \\frac{1}{n} \\sum_{i = 1}^n \\left(x_i - \\mu_\\mathcal{B}\\right)^2}_{\\text{Batch variance}}";

	// --- Normalize equation ---
	var x_equation = '\\epsilon \\text{ could not be determined}';
	if (_epsilon !== undefined) {
		x_equation = "\\overline{x_i} \\longrightarrow \\underbrace{\\frac{x_i - \\mu_\\mathcal{B}}{\\sqrt{\\sigma_\\mathcal{B}^2 + \\epsilon \\left( = " + _epsilon + "\\right)}}}_\\text{Normalize}";
	}

	// --- Gamma (colored + editable) ---
	var gamma_latex = _build_1d_param_latex(layer_idx, "gamma", gamma, max_gamma, decimals, all_editables);

	// --- Beta (colored + editable) ---
	var beta_latex = _build_1d_param_latex(layer_idx, "beta", beta, max_beta, decimals, all_editables);

	// --- Output name ---
	var outname = "";
	if (layer_idx == layer_data.length - 1) {
		outname = array_to_latex(y_layer, "Output") + " \\longrightarrow ";
	} else {
		outname += _get_h(layer_idx) + " \\longrightarrow ";
	}

	// --- y equation with interactive gamma and beta ---
	var y_equation = "y_i = \\underbrace{\\underbrace{\\gamma}_{" + gamma_latex + "}\\overline{x_i} + \\underbrace{\\beta}_{" + beta_latex + "}}_{\\text{Scaling\\&shifting}}";

	var between_equations = ",\\qquad ";
	var skip_between_equations = ",\\\\[10pt]\\\\\n";

	var str = "\\begin{array}{c}\n";
	str += "\\displaystyle " + mini_batch_mean + between_equations;
	str += "\\displaystyle " + mini_batch_variance + between_equations;
	str += "\\displaystyle " + x_equation + skip_between_equations;
	str += "\\displaystyle " + outname + y_equation;
	str += "\\end{array}\n";

	return str;
}
