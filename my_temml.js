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

    var kernel = layer_data[layer_idx].kernel;
    var bias = layer_data[layer_idx].bias;
    var decimals = get_dec_points_math_mode();
    var max_rows = Math.min(kernel.length, get_max_nr_cols_rows());
    var max_cols = Math.min(kernel[0] ? kernel[0].length : 1, get_max_nr_cols_rows());

    // Resolve weight indices directly from the model
    var kernel_weight_idx = -1;
    var bias_weight_idx = -1;

    if (model && model.layers && model.layers[layer_idx] && model.layers[layer_idx].weights) {
        var layer_weights = model.layers[layer_idx].weights;
        for (var wi = 0; wi < layer_weights.length; wi++) {
            var wname = get_weight_name_by_layer_and_weight_index(layer_idx, wi);
            if (wname === "kernel" && kernel_weight_idx === -1) {
                kernel_weight_idx = wi;
            } else if (wname === "bias" && bias_weight_idx === -1) {
                bias_weight_idx = wi;
            }
        }
    }

    // Register kernel editables
    for (var i = 0; i < kernel.length; i++) {
        for (var j = 0; j < kernel[i].length; j++) {
            (function(li, row, col, kwi) {
                var eid = "L" + li + "_kernel_" + row + "_" + col;
                if (!math_find_editable(eid)) {
                    math_register_editable(
                        eid,
                        function() { return layer_data[li].kernel[row][col]; },
                        function(v) {
                            layer_data[li].kernel[row][col] = v;
                            if (kwi >= 0) {
                                _math_apply_single_weight(li, kwi, layer_data[li].kernel);
                            }
                        },
                        -10, 10,
                        "Layer " + li + " kernel[" + row + "][" + col + "]",
                        { decimals: decimals }
                    );
                }
            })(layer_idx, i, j, kernel_weight_idx);
        }
    }

    // Register bias editables
    if (bias && bias.length && bias_weight_idx !== -1) {
        for (var b = 0; b < bias.length; b++) {
            (function(li, idx, bwi) {
                var eid = "L" + li + "_bias_" + idx;
                if (!math_find_editable(eid)) {
                    math_register_editable(
                        eid,
                        function() { return layer_data[li].bias[idx]; },
                        function(v) {
                            layer_data[li].bias[idx] = v;
                            if (bwi >= 0) {
                                _math_apply_single_weight(li, bwi, layer_data[li].bias);
                            }
                        },
                        -10, 10,
                        "Layer " + li + " bias[" + idx + "]",
                        { decimals: decimals }
                    );
                }
            })(layer_idx, b, bias_weight_idx);
        }
    }

    // Build the full LaTeX string with colored number placeholders
    var kernel_latex = "\\underbrace{\\begin{pmatrix}\n";
    var all_editables = [];

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
        kernel_latex += row_parts.join(" & ");
        if (row < max_rows - 1) kernel_latex += " \\\\\n";
    }
    if (kernel.length > max_rows) {
        kernel_latex += " \\\\ \\vdots & \\ddots";
    }
    kernel_latex += "\n\\end{pmatrix}}_{\\text{Weights}^{" + array_size(kernel).join("\\times") + "}}";

    // Right side
    var right_side;
    if (layer_idx === 0) {
        right_side = array_to_latex(input_layer, "Input");
    } else {
        right_side = _get_h(Math.max(0, layer_idx - 1));
    }

    var full_latex = kernel_latex + " \\times " + right_side;

    // Bias
    if (bias && bias.length && bias_weight_idx !== -1) {
        var bias_latex = " + \\underbrace{\\begin{pmatrix}\n";
        var max_bias = Math.min(bias.length, get_max_nr_cols_rows());
        var bias_parts = [];
        for (var bi = 0; bi < max_bias; bi++) {
            var beid = "L" + layer_idx + "_bias_" + bi;
            var bed = math_find_editable(beid);
            var bval = bed ? bed.get().toFixed(decimals) : "0";
            bias_parts.push("\\textcolor{#53d8fb}{" + bval + "}");
            all_editables.push({ eid: beid, value: bval });
        }
        if (bias.length > max_bias) {
            bias_parts.push("\\vdots");
        }
        bias_latex += bias_parts.join(" \\\\\n");
        bias_latex += "\n\\end{pmatrix}}_{\\text{Bias}}";
        full_latex += bias_latex;
    }

    // Render the complete LaTeX, then replace colored spans with editables
    el_render_single_latex_with_editables(container, full_latex, all_editables);
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
            flat = new_array;
        } else {
            flat = [new_array];
        }

        // Always use the original tensor's shape
        var new_tensor = tf.tensor(flat, old_tensor.shape);
        weight.val.assign(new_tensor);
        new_tensor.dispose();
    } catch (e) {
        console.error("[_math_apply_single_weight] Error:", e);
    }
}
