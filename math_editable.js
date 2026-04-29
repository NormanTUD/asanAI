"use strict";

// ============================================================
// EDITABLE MATH VARIABLES SYSTEM
// Inspired by the UAT interactive formula approach
// ============================================================

var _math_editables = [];
var _math_active_ed = null;
var _math_pop_el = null;

/**
 * Register an editable variable.
 * @param {string} id - Unique identifier
 * @param {function} get - Getter returning current numeric value
 * @param {function} set - Setter accepting new numeric value
 * @param {number} min - Minimum allowed value
 * @param {number} max - Maximum allowed value
 * @param {string} label - Human-readable label
 * @param {object} [opts] - Optional: { step, decimals, onChange }
 */
function math_register_editable(id, get, set, min, max, label, opts) {
    opts = opts || {};
    _math_editables.push({
        id: id,
        get: get,
        set: set,
        min: min,
        max: max,
        label: label,
        step: opts.step || 0.01,
        decimals: opts.decimals || 3,
        onChange: opts.onChange || null
    });
}

function math_clear_editables() {
    _math_editables = [];
    math_close_popup();
}

function math_find_editable(id) {
    for (var i = 0; i < _math_editables.length; i++) {
        if (_math_editables[i].id === id) return _math_editables[i];
    }
    return null;
}

// ============================================================
// POPUP EDITOR
// ============================================================

function math_ensure_popup() {
    if (_math_pop_el) return _math_pop_el;

    var pop = document.createElement("div");
    pop.id = "math_var_popup";
    pop.className = "math-pop-ed";
    pop.innerHTML = [
        '<label class="math-pop-label" id="math_pop_lbl">Parameter</label>',
        '<div class="math-pop-row">',
        '  <input type="number" id="math_pop_num" step="0.05">',
        '  <span class="math-pop-range" id="math_pop_rng">[-5, 5]</span>',
        '</div>',
        '<input type="range" id="math_pop_slider" min="-5" max="5" step="0.01">',
        '<div class="math-pop-actions">',
        '  <button class="math-pop-btn math-pop-btn-reset" id="math_pop_reset">Reset</button>',
        '  <button class="math-pop-btn math-pop-btn-close" id="math_pop_close">✕</button>',
        '</div>'
    ].join("\n");

    document.body.appendChild(pop);
    _math_pop_el = pop;

    // Event listeners
    var numInput = document.getElementById("math_pop_num");
    var slider = document.getElementById("math_pop_slider");
    var resetBtn = document.getElementById("math_pop_reset");
    var closeBtn = document.getElementById("math_pop_close");

    numInput.addEventListener("input", function () {
        if (!_math_active_ed) return;
        var v = parseFloat(numInput.value);
        if (isNaN(v)) return;
        v = Math.min(_math_active_ed.max, Math.max(_math_active_ed.min, v));
        _math_active_ed.set(v);
        slider.value = _math_active_ed.get();
        _math_on_variable_changed(_math_active_ed);
    });

    slider.addEventListener("input", function () {
        if (!_math_active_ed) return;
        var v = parseFloat(slider.value);
        _math_active_ed.set(v);
        numInput.value = _math_active_ed.get().toFixed(_math_active_ed.decimals);
        _math_on_variable_changed(_math_active_ed);
    });

    resetBtn.addEventListener("click", function () {
        if (!_math_active_ed || !_math_active_ed._initial) return;
        _math_active_ed.set(_math_active_ed._initial);
        numInput.value = _math_active_ed.get().toFixed(_math_active_ed.decimals);
        slider.value = _math_active_ed.get();
        _math_on_variable_changed(_math_active_ed);
    });

    closeBtn.addEventListener("click", math_close_popup);

    // Close on outside click
    document.addEventListener("mousedown", function (e) {
        if (!_math_pop_el) return;
        if (_math_pop_el.contains(e.target)) return;
        if (e.target.closest && e.target.closest(".math-ed-num")) return;
        math_close_popup();
    });

    return pop;
}

function math_open_popup(id, anchorRect) {
    var ed = math_find_editable(id);
    if (!ed) return;

    // Store initial value for reset
    if (ed._initial === undefined) {
        ed._initial = ed.get();
    }

    _math_active_ed = ed;
    var pop = math_ensure_popup();

    document.getElementById("math_pop_lbl").textContent = ed.label;
    document.getElementById("math_pop_num").value = ed.get().toFixed(ed.decimals);
    document.getElementById("math_pop_num").step = ed.step;
    document.getElementById("math_pop_slider").min = ed.min;
    document.getElementById("math_pop_slider").max = ed.max;
    document.getElementById("math_pop_slider").step = ed.step;
    document.getElementById("math_pop_slider").value = ed.get();
    document.getElementById("math_pop_rng").textContent = "[" + ed.min + ", " + ed.max + "]";

    // Position popup
    var left = anchorRect.left + anchorRect.width / 2 - 115;
    var top = anchorRect.bottom + 8;
    if (left < 5) left = 5;
    if (left > window.innerWidth - 240) left = window.innerWidth - 240;
    if (top > window.innerHeight - 120) top = anchorRect.top - 110;

    pop.style.left = left + "px";
    pop.style.top = top + "px";
    pop.classList.add("math-pop-visible");

    // Highlight active editable
    document.querySelectorAll(".math-ed-num.math-ed-active").forEach(function (el) {
        el.classList.remove("math-ed-active");
    });
    var activeEl = document.querySelector('[data-math-eid="' + id + '"]');
    if (activeEl) activeEl.classList.add("math-ed-active");
}

function math_close_popup() {
    if (_math_pop_el) {
        _math_pop_el.classList.remove("math-pop-visible");
    }
    document.querySelectorAll(".math-ed-num.math-ed-active").forEach(function (el) {
        el.classList.remove("math-ed-active");
    });
    _math_active_ed = null;
}

// ============================================================
// CALLBACK ON CHANGE
// ============================================================

function _math_on_variable_changed(ed) {
    // Update the displayed value in the inline span
    var el = document.querySelector('[data-math-eid="' + ed.id + '"]');
    if (el) {
        el.textContent = ed.get().toFixed(ed.decimals);
    }

    // Fire custom callback if provided
    if (ed.onChange && typeof ed.onChange === "function") {
        ed.onChange(ed.get(), ed);
    }

    // Fire global event for the math mode to react
    var event = new CustomEvent("math_variable_changed", {
        detail: { id: ed.id, value: ed.get(), editable: ed }
    });
    document.dispatchEvent(event);
}

// ============================================================
// HYBRID RENDERING (LaTeX chunks + editable numbers)
// ============================================================

/**
 * Token types for hybrid formula rendering:
 * - tex(str): A LaTeX fragment rendered by Temml
 * - num(eid): An editable number (clickable)
 * - num_labeled(eid, label): Editable number with a subscript label
 * - linebreak(): Forces a new line in the formula
 */
function math_tex(str) { return { type: "tex", value: str }; }
function math_num(eid) { return { type: "num", eid: eid }; }
function math_num_labeled(eid, label) { return { type: "num_labeled", eid: eid, label: label }; }
function math_linebreak() { return { type: "break" }; }

/**
 * Render a hybrid formula into a container element.
 * @param {string|HTMLElement} container - Element or ID
 * @param {Array} tokens - Array of token objects from math_tex/math_num/etc.
 */
/**
 * FIXED: Build the hybrid formula by constructing ONE LaTeX string
 * with placeholder markers, render it with Temml, then replace
 * the placeholders with clickable editable spans.
 *
 * This avoids:
 *  - Unmatched brace errors (single complete LaTeX string)
 *  - Slowness (one Temml call instead of 100+)
 */
function math_render_hybrid(container, tokens) {
    var el = (typeof container === "string") ? document.getElementById(container) : container;
    if (!el) {
        console.error("[math_render_hybrid] Container not found:", container);
        return;
    }

    // Step 1: Build a single LaTeX string with placeholders for editable numbers
    var latex = "";
    var editables_in_order = []; // track which eid goes where

    for (var i = 0; i < tokens.length; i++) {
        var tok = tokens[i];

        if (tok.type === "break") {
            latex += " \\\\\n";
            continue;
        }

        if (tok.type === "tex") {
            latex += tok.value;
            continue;
        }

        if (tok.type === "num" || tok.type === "num_labeled") {
            var ed = math_find_editable(tok.eid);
            var displayVal = ed ? ed.get().toFixed(ed.decimals || 3) : "0";

            // Insert a placeholder that Temml will render as a colored box
            // We use \htmlId{} if supported, otherwise \textcolor with a unique marker
            var placeholder_id = "mhed_" + tok.eid.replace(/[^a-zA-Z0-9]/g, "_");
            
            // Use \cssId if Temml supports it, otherwise use a class-based approach
            // Safest: render the number as colored text that we can find and replace post-render
            latex += "\\textcolor{#53d8fb}{" + displayVal + "}";
            
            editables_in_order.push({
                eid: tok.eid,
                value: displayVal,
                label: tok.label || null
            });
            continue;
        }
    }

    // Step 2: Render the complete LaTeX string with Temml (single call)
    el.innerHTML = "";
    var texContainer = document.createElement("div");
    texContainer.className = "math-hybrid-rendered";

    try {
        texContainer.innerHTML = temml.renderToString(latex, { displayMode: true });
    } catch (err) {
        console.error("[math_render_hybrid] Temml error:", err, "\nLaTeX:\n", latex);
        texContainer.textContent = "Render error: " + err.message;
        el.appendChild(texContainer);
        return;
    }

    el.appendChild(texContainer);

    // Step 3: Find the colored number spans and replace them with interactive ones
    // Temml renders \textcolor{#53d8fb}{...} as a <span style="color:#53d8fb;">...</span>
    _replace_colored_spans_with_editables(texContainer, editables_in_order);
}

/**
 * After Temml renders, find the top-level colored spans and replace them
 * with clickable editable number spans.
 * 
 * KEY FIX: Match sequentially by DOM order, not by text content.
 * Since we generate the LaTeX and the editables_in_order array in the
 * same order, the Nth colored span corresponds to the Nth editable.
 */
function _replace_colored_spans_with_editables(container, editables_in_order) {
    if (!editables_in_order || editables_in_order.length === 0) return;

    // Find all elements that Temml colored with our marker color.
    // Temml renders \textcolor{#53d8fb}{...} as a span with style containing "color"
    // We need the OUTERMOST colored spans only (not their children).
    var allSpans = container.querySelectorAll('*');
    var coloredSpans = [];

    for (var i = 0; i < allSpans.length; i++) {
        var span = allSpans[i];
        var style = span.getAttribute("style") || "";
        
        // Check if this span has our marker color in its style
        if (style.indexOf("53d8fb") !== -1 || style.indexOf("53D8FB") !== -1) {
            // Make sure this isn't a child of another colored span we already found
            var isChild = false;
            for (var j = 0; j < coloredSpans.length; j++) {
                if (coloredSpans[j].contains(span) && coloredSpans[j] !== span) {
                    isChild = true;
                    break;
                }
            }
            if (!isChild) {
                coloredSpans.push(span);
            }
        }
    }

    // If we couldn't find colored spans via inline style, try computed style
    if (coloredSpans.length === 0) {
        var walker = document.createTreeWalker(container, NodeFilter.SHOW_ELEMENT, null, false);
        var candidates = [];
        while (walker.nextNode()) {
            candidates.push(walker.currentNode);
        }
        
        for (var i = 0; i < candidates.length; i++) {
            var cs = window.getComputedStyle(candidates[i]);
            // rgb(83, 216, 251) is #53d8fb
            if (cs.color === "rgb(83, 216, 251)") {
                // Check it's not a child of an already-found span
                var isChild = false;
                for (var j = 0; j < coloredSpans.length; j++) {
                    if (coloredSpans[j].contains(candidates[i]) && coloredSpans[j] !== candidates[i]) {
                        isChild = true;
                        break;
                    }
                }
                if (!isChild) {
                    coloredSpans.push(candidates[i]);
                }
            }
        }
    }

    // Now match sequentially: the Nth colored span = the Nth editable
    // This works because we generate both in the same order (row by row, col by col)
    var edIdx = 0;
    for (var i = 0; i < coloredSpans.length && edIdx < editables_in_order.length; i++) {
        var span = coloredSpans[i];
        var edInfo = editables_in_order[edIdx];
        
        _convert_span_to_editable(span, edInfo);
        edIdx++;
    }

    if (edIdx < editables_in_order.length) {
        console.warn("[_replace_colored_spans_with_editables] Only matched " + edIdx + 
            " of " + editables_in_order.length + " editables. Found " + 
            coloredSpans.length + " colored spans.");
    }
}

/**
 * Convert a Temml-rendered span into a clickable editable.
 */
function _convert_span_to_editable(span, edInfo) {
    var ed = math_find_editable(edInfo.eid);
    if (!ed) return;

    var decimals = ed.decimals || 3;
    var displayVal = ed.get().toFixed(decimals);

    // Clear the Temml-rendered content and replace with our interactive span
    span.innerHTML = "";
    span.textContent = displayVal;
    span.className = (span.className || "") + " math-ed-num";
    span.setAttribute("data-math-eid", edInfo.eid);
    
    // Remove Temml's inline color style — our CSS class handles styling
    span.style.color = "";
    span.style.cursor = "pointer";

    // Use a closure to capture the correct eid and span reference
    span.addEventListener("click", (function(eid, el) {
        return function(e) {
            e.stopPropagation();
            math_open_popup(eid, el.getBoundingClientRect());
        };
    })(edInfo.eid, span));
}

/**
 * Fallback: if color-based detection fails, find text nodes matching
 * editable values and wrap them.
 */
function _fallback_sequential_replace(container, editables_in_order) {
    var edIdx = 0;
    var walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT, null, false);
    
    while (walker.nextNode() && edIdx < editables_in_order.length) {
        var textNode = walker.currentNode;
        var text = textNode.textContent.trim();
        var edInfo = editables_in_order[edIdx];

        if (text === edInfo.value || text.replace(/[−]/g, '-') === edInfo.value) {
            var newSpan = document.createElement("span");
            newSpan.className = "math-ed-num";
            newSpan.setAttribute("data-math-eid", edInfo.eid);
            newSpan.textContent = edInfo.value;
            newSpan.style.cursor = "pointer";

            newSpan.addEventListener("click", (function (eid) {
                return function (e) {
                    e.stopPropagation();
                    math_open_popup(eid, newSpan.getBoundingClientRect());
                };
            })(edInfo.eid));

            textNode.parentNode.replaceChild(newSpan, textNode);
            edIdx++;
        }
    }
}


// ============================================================
// INTEGRATION HELPERS
// For use within model_to_latex or custom formula builders
// ============================================================

/**
 * Create an editable weight/bias inline in a LaTeX formula string.
 * Returns HTML string that can be inserted into the math tab.
 * 
 * Usage in model_to_latex:
 *   Instead of just showing the number, wrap it:
 *   math_editable_inline("w1_0", 0.532, -5, 5, "W₁[0]")
 */
function math_editable_inline(id, currentValue, min, max, label, opts) {
    opts = opts || {};
    var decimals = opts.decimals || get_dec_points_math_mode();
    var step = opts.step || 0.01;

    // Register if not already registered
    if (!math_find_editable(id)) {
        // We need getter/setter that reference the actual model weight
        // This is a placeholder — the caller should register properly
        var _val = currentValue;
        math_register_editable(id, function () { return _val; }, function (v) { _val = v; }, min, max, label, { step: step, decimals: decimals });
    }

    var ed = math_find_editable(id);
    var displayVal = ed ? ed.get().toFixed(decimals) : parseFloat(currentValue).toFixed(decimals);

    return '<span class="math-ed-wrap"><span class="math-ed-num" data-math-eid="' +
        id + '" onclick="math_open_popup(\'' + id + '\', this.getBoundingClientRect())">' +
        displayVal + '</span>' +
        (label ? '<span class="math-ed-label">' + label + '</span>' : '') +
        '</span>';
}

/**
 * Register model weights as editables.
 * Call this after model is compiled/loaded.
 */
function math_register_model_weights() {
    math_clear_editables();

    if (!model || !model.layers) return;

    for (var layer_idx = 0; layer_idx < model.layers.length; layer_idx++) {
        var layer = model.layers[layer_idx];
        if (!layer.weights) continue;

        for (var w_idx = 0; w_idx < layer.weights.length; w_idx++) {
            var weight = layer.weights[w_idx];
            if (!weight || !weight.val || weight.val.isDisposed) continue;

            var synced = array_sync(weight.val, true);
            if (!synced) continue;

            var shape = get_shape_from_array(synced);
            var weight_name = get_weight_name_by_layer_and_weight_index(layer_idx, w_idx);

            // For 1D arrays (biases), register each element
            if (shape.length === 1) {
                for (var i = 0; i < synced.length; i++) {
                    (function (li, wi, idx, arr) {
                        var eid = "L" + li + "_" + weight_name + "_" + idx;
                        math_register_editable(
                            eid,
                            function () { return arr[idx]; },
                            function (v) {
                                arr[idx] = v;
                                _math_apply_weight_change(li, wi, arr);
                            },
                            -10, 10,
                            "Layer " + li + " " + weight_name + "[" + idx + "]",
                            { step: 0.01, decimals: get_dec_points_math_mode() }
                        );
                    })(layer_idx, w_idx, i, synced);
                }
            }

            // For 2D arrays (kernels), register each element
            if (shape.length === 2) {
                for (var r = 0; r < synced.length; r++) {
                    for (var c = 0; c < synced[r].length; c++) {
                        (function (li, wi, row, col, arr) {
                            var eid = "L" + li + "_" + weight_name + "_" + row + "_" + col;
                            math_register_editable(
                                eid,
                                function () { return arr[row][col]; },
                                function (v) {
                                    arr[row][col] = v;
                                    _math_apply_weight_change(li, wi, arr);
                                },
                                -10, 10,
                                "Layer " + li + " " + weight_name + "[" + row + "][" + col + "]",
                                { step: 0.01, decimals: get_dec_points_math_mode() }
                            );
                        })(layer_idx, w_idx, r, c, synced);
                    }
                }
            }
        }
    }
}

/**
 * Apply a weight change back to the actual TensorFlow model.
 */
function _math_apply_weight_change(layer_idx, weight_idx, new_array) {
    try {
        var weight = model.layers[layer_idx].weights[weight_idx];
        if (!weight || !weight.val) return;

        var old_tensor = weight.val;
        var new_tensor = tf.tensor(new_array, old_tensor.shape);

        weight.val.assign(new_tensor);
        new_tensor.dispose();

        // Trigger re-render of math tab
        write_model_to_latex_to_page(false, true);
    } catch (e) {
        console.error("[_math_apply_weight_change] Error:", e);
    }
}
