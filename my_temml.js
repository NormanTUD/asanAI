"use strict";

function _temml() {
	try {
		const elements = $(".temml_me").toArray().filter(e =>
			e.textContent.trim() &&
			!e.dataset.rendered &&
			$(e).is(":visible")
		);

		if (!elements.length) return;

		const batch_size = 20; // tune: 20 = fast + safe
		let i = 0;

		function render_batch() {
			const batch = elements.slice(i, i + batch_size);
			for (const e of batch) render_temml_quick(e);
			i += batch_size;
			if (i < elements.length)
				setTimeout(render_batch, 0); // let UI breathe
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

	// Skip if this element contains hybrid editable content
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

function _inject_hybrid_dense(container_id, layer_idx, layer_data, colors, input_layer) {
    // Find the rendered placeholder text and replace it with a hybrid container
    var math_tab = document.getElementById("math_tab_code");
    if (!math_tab) return;

    // Find the element containing our placeholder text
    var placeholder_text = "[Interactive: Layer " + layer_idx + "]";
    var walker = document.createTreeWalker(math_tab, NodeFilter.SHOW_TEXT, null, false);
    var target_parent = null;

    while (walker.nextNode()) {
        if (walker.currentNode.textContent.includes("Interactive: Layer " + layer_idx)) {
            target_parent = walker.currentNode.parentElement;
            break;
        }
    }

    if (!target_parent) {
        // Fallback: find the temml_me span that contains this layer
        var all_temml = math_tab.querySelectorAll(".temml_me");
        for (var i = 0; i < all_temml.length; i++) {
            if (all_temml[i].dataset.latex && all_temml[i].dataset.latex.includes("Interactive: Layer " + layer_idx)) {
                target_parent = all_temml[i];
                break;
            }
        }
    }

    if (!target_parent) return;

    // Create the hybrid container
    var container = document.createElement("div");
    container.id = container_id;
    container.className = "fb"; // reuse the formula-box style from the UAT site
    target_parent.innerHTML = "";
    target_parent.appendChild(container);

    // Register editables for this layer
    var kernel = layer_data[layer_idx].kernel;
    var bias = layer_data[layer_idx].bias;
    var decimals = get_dec_points_math_mode();

    // Register kernel weights
    for (var i = 0; i < kernel.length; i++) {
        for (var j = 0; j < kernel[i].length; j++) {
            (function (li, row, col) {
                var eid = "L" + li + "_k_" + row + "_" + col;
                if (!math_find_editable(eid)) {
                    math_register_editable(
                        eid,
                        function () { return layer_data[li].kernel[row][col]; },
                        function (v) {
                            layer_data[li].kernel[row][col] = v;
                            _math_apply_weight_to_model(li, "kernel", layer_data[li].kernel);
                        },
                        -10, 10,
                        "Layer " + li + " kernel[" + row + "][" + col + "]",
                        { step: 0.01, decimals: decimals }
                    );
                }
            })(layer_idx, i, j);
        }
    }

    // Register bias weights
    if (bias && bias.length) {
        for (var b = 0; b < bias.length; b++) {
            (function (li, idx) {
                var eid = "L" + li + "_b_" + idx;
                if (!math_find_editable(eid)) {
                    math_register_editable(
                        eid,
                        function () { return layer_data[li].bias[idx]; },
                        function (v) {
                            layer_data[li].bias[idx] = v;
                            _math_apply_weight_to_model(li, "bias", layer_data[li].bias);
                        },
                        -10, 10,
                        "Layer " + li + " bias[" + idx + "]",
                        { step: 0.01, decimals: decimals }
                    );
                }
            })(layer_idx, b);
        }
    }

    // Build hybrid tokens
    var tokens = [];
    var max_rows = Math.min(kernel.length, get_max_nr_cols_rows());
    var max_cols = Math.min(kernel[0] ? kernel[0].length : 0, get_max_nr_cols_rows());

    // Kernel matrix header
    tokens.push(math_tex("\\underbrace{"));
    tokens.push(math_tex("\\begin{pmatrix}"));

    for (var row = 0; row < max_rows; row++) {
        if (row > 0) tokens.push(math_tex("\\\\"));
        for (var col = 0; col < max_cols; col++) {
            if (col > 0) tokens.push(math_tex("&"));
            var eid = "L" + layer_idx + "_k_" + row + "_" + col;
            tokens.push(math_num_labeled(eid, "w_{" + row + "," + col + "}"));
        }
        if (kernel[row] && kernel[row].length > max_cols) {
            tokens.push(math_tex("& \\cdots"));
        }
    }
    if (kernel.length > max_rows) {
        tokens.push(math_tex("\\\\ \\vdots & \\ddots"));
    }

    tokens.push(math_tex("\\end{pmatrix}"));
    tokens.push(math_tex("}_{\\text{Weights}^{" + array_size(kernel).join("\\times") + "}}"));

    // Times input
    tokens.push(math_tex("\\times"));
    if (layer_idx === 0) {
        tokens.push(math_tex(array_to_latex(input_layer, "Input")));
    } else {
        tokens.push(math_tex(_get_h(Math.max(0, layer_idx - 1))));
    }

    // Bias
    if (bias && bias.length) {
        tokens.push(math_tex("+"));
        tokens.push(math_tex("\\underbrace{\\begin{pmatrix}"));
        var max_bias = Math.min(bias.length, get_max_nr_cols_rows());
        for (var bi = 0; bi < max_bias; bi++) {
            if (bi > 0) tokens.push(math_tex("\\\\"));
            var beid = "L" + layer_idx + "_b_" + bi;
            tokens.push(math_num_labeled(beid, "b_{" + bi + "}"));
        }
        if (bias.length > max_bias) {
            tokens.push(math_tex("\\\\ \\vdots"));
        }
        tokens.push(math_tex("\\end{pmatrix}}_{\\text{Bias}}"));
    }

    // Render the hybrid formula
    math_render_hybrid(container, tokens);
}

/**
 * Apply weight changes back to the TensorFlow.js model
 */
function _math_apply_weight_to_model(layer_idx, weight_type, new_array) {
    try {
        if (!model || !model.layers || !model.layers[layer_idx]) return;

        var weights = model.layers[layer_idx].weights;
        for (var i = 0; i < weights.length; i++) {
            var name = get_weight_name_by_layer_and_weight_index(layer_idx, i);
            if (name === weight_type) {
                var old_tensor = weights[i].val;
                var flat = Array.isArray(new_array[0]) ? new_array.flat() : new_array;
                var new_tensor = tf.tensor(flat, old_tensor.shape);
                weights[i].val.assign(new_tensor);
                new_tensor.dispose();

                // Trigger prediction update if available
                if (typeof predict_handdrawn === "function") {
                    try { predict_handdrawn(); } catch (e) { /* ignore */ }
                }
                break;
            }
        }
    } catch (e) {
        console.error("[_math_apply_weight_to_model]", e);
    }
}
