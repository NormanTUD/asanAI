"use strict";

// ============================================================
// EDITABLE MATH VARIABLES SYSTEM
// ============================================================

var _math_editables = [];
var _math_active_ed = null;
var _math_pop_el = null;

function math_register_editable(id, get, set, min, max, label, opts) {
    opts = opts || {};

    // Prevent duplicate registration — update existing if found
    for (var i = 0; i < _math_editables.length; i++) {
        if (_math_editables[i].id === id) {
            _math_editables[i].get = get;
            _math_editables[i].set = function(v) {
                if (started_training) {
                    console.warn("[math_register_editable] Cannot edit variable '" + id + "' while training is in progress.");
                    return;
                }
                set(v);
            };
            _math_editables[i].min = min;
            _math_editables[i].max = max;
            _math_editables[i].label = label;
            _math_editables[i].step = opts.step || 0.01;
            _math_editables[i].decimals = opts.decimals || 3;
            _math_editables[i].onChange = opts.onChange || null;
            return;
        }
    }

    _math_editables.push({
        id: id,
        get: get,
        set: function(v) {
            if (started_training) {
                console.warn("[math_register_editable] Cannot edit variable '" + id + "' while training is in progress.");
                return;
            }
            set(v);
        },
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

    var is_dark = (typeof get_cookie === "function") && (get_cookie("theme") === "darkmode");

    var pop = document.createElement("div");
    pop.id = "math_var_popup";
    pop.className = "math-pop-ed" + (is_dark ? " math-pop-dark" : " math-pop-light");
    pop.innerHTML = [
        '<label class="math-pop-label" id="math_pop_lbl">Parameter</label>',
        '<div class="math-pop-row">',
        '  <input type="number" id="math_pop_num" step="any">',
        '</div>',
        '<input type="range" id="math_pop_slider" min="-10" max="10" step="0.01">',
        '<div class="math-pop-actions">',
        '  <button class="math-pop-btn math-pop-btn-reset" id="math_pop_reset">Reset</button>',
        '  <button class="math-pop-btn math-pop-btn-close" id="math_pop_close">\u2715</button>',
        '</div>'
    ].join("\n");

    document.body.appendChild(pop);
    _math_pop_el = pop;

    var numInput = document.getElementById("math_pop_num");
    var slider = document.getElementById("math_pop_slider");
    var resetBtn = document.getElementById("math_pop_reset");
    var closeBtn = document.getElementById("math_pop_close");

    numInput.addEventListener("input", function () {
        if (!_math_active_ed) return;
        if (started_training) {
            console.warn("[math_popup] Cannot edit variables while training is in progress.");
            return;
        }
        var v = parseFloat(numInput.value);
        if (isNaN(v)) return;
        _math_active_ed.set(v);
        slider.value = Math.min(parseFloat(slider.max), Math.max(parseFloat(slider.min), v));
        _math_on_variable_changed(_math_active_ed);
        _safe_predict_own_data_and_repredict(); // await not possible
    });

    slider.addEventListener("input", function () {
        if (!_math_active_ed) return;
        if (started_training) {
            console.warn("[math_popup] Cannot edit variables while training is in progress.");
            return;
        }
        var v = parseFloat(slider.value);
        _math_active_ed.set(v);
        numInput.value = _math_active_ed.get().toFixed(_math_active_ed.decimals);
        _math_on_variable_changed(_math_active_ed);
        _safe_predict_own_data_and_repredict(); // await not possible
    });

    resetBtn.addEventListener("click", function () {
        if (!_math_active_ed || _math_active_ed._initial === undefined) return;
        if (started_training) {
            console.warn("[math_popup] Cannot reset variables while training is in progress.");
            return;
        }
        _math_active_ed.set(_math_active_ed._initial);
        numInput.value = _math_active_ed.get().toFixed(_math_active_ed.decimals);
        slider.value = Math.min(parseFloat(slider.max), Math.max(parseFloat(slider.min), _math_active_ed.get()));
        _math_on_variable_changed(_math_active_ed);
        _safe_predict_own_data_and_repredict(); // await not possible
    });

    closeBtn.addEventListener("click", math_close_popup);

    document.addEventListener("mousedown", function (e) {
        if (!_math_pop_el) return;
        if (!_math_pop_el.classList.contains("math-pop-visible")) return;
        if (_math_pop_el.contains(e.target)) return;
        if (e.target.closest && e.target.closest(".math-ed-num")) return;
        math_close_popup();
        _safe_predict_own_data_and_repredict(); // await not possible
    });
    return pop;
}

function math_open_popup(id, anchorRect) {
    var ed = math_find_editable(id);
    if (!ed) return;

    // Block opening the popup if training is active
    if (started_training) {
        console.warn("[math_open_popup] Cannot edit variables while training is in progress.");
        return;
    }

    if (ed._initial === undefined) {
        ed._initial = ed.get();
    }

    _math_active_ed = ed;
    var pop = math_ensure_popup();

    var is_dark = (typeof get_cookie === "function") && (get_cookie("theme") === "darkmode");
    pop.classList.remove("math-pop-dark", "math-pop-light");
    pop.classList.add(is_dark ? "math-pop-dark" : "math-pop-light");

    document.getElementById("math_pop_lbl").textContent = ed.label;
    document.getElementById("math_pop_num").value = ed.get().toFixed(ed.decimals);
    document.getElementById("math_pop_num").step = "any";

    var slider = document.getElementById("math_pop_slider");
    slider.min = ed.min;
    slider.max = ed.max;
    slider.step = ed.step;
    slider.value = Math.min(ed.max, Math.max(ed.min, ed.get()));

    var left = anchorRect.left + anchorRect.width / 2 - 115;
    var top = anchorRect.bottom + 8;
    if (left < 5) left = 5;
    if (left > window.innerWidth - 240) left = window.innerWidth - 240;
    if (top > window.innerHeight - 120) top = anchorRect.top - 110;

    pop.style.left = left + "px";
    pop.style.top = top + "px";
    pop.classList.add("math-pop-visible");

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
    var el = document.querySelector('[data-math-eid="' + ed.id + '"]');
    if (el) {
        el.textContent = ed.get().toFixed(ed.decimals);
    }

    if (ed.onChange && typeof ed.onChange === "function") {
        ed.onChange(ed.get(), ed);
    }

    var event = new CustomEvent("math_variable_changed", {
        detail: { id: ed.id, value: ed.get(), editable: ed }
    });
    document.dispatchEvent(event);
}

// ============================================================
// COLORED SPAN REPLACEMENT (post-Temml render)
// ============================================================

function _replace_colored_spans_with_editables(container, editables_in_order) {
    if (!editables_in_order || editables_in_order.length === 0) return;

    var allElements = container.getElementsByTagName("*");
    var coloredSpans = [];

    for (var i = 0; i < allElements.length; i++) {
        var el = allElements[i];
        var style = el.getAttribute("style") || "";

        if (style.indexOf("53d8fb") === -1 && style.indexOf("53D8FB") === -1 &&
            style.indexOf("rgb(83, 216, 251)") === -1) {
            continue;
        }

        // Only consider elements that directly contain text (leaf-level colored spans)
        var hasColoredChildElement = false;
        for (var c = 0; c < el.children.length; c++) {
            var childStyle = el.children[c].getAttribute("style") || "";
            if (childStyle.indexOf("53d8fb") !== -1 || childStyle.indexOf("53D8FB") !== -1 ||
                childStyle.indexOf("rgb(83, 216, 251)") !== -1) {
                hasColoredChildElement = true;
                break;
            }
        }

        // If this element has colored children, skip it (we'll process the children instead)
        if (hasColoredChildElement) continue;

        // Check that this element has meaningful text content (a number)
        var text = el.textContent.trim();
        if (text && (text.match(/^-?\d/) || text === "0")) {
            coloredSpans.push(el);
        }
    }

    var edIdx = 0;
    for (var i = 0; i < coloredSpans.length && edIdx < editables_in_order.length; i++) {
        _convert_span_to_editable(coloredSpans[i], editables_in_order[edIdx]);
        edIdx++;
    }

    if (edIdx < editables_in_order.length) {
        console.warn("[_replace_colored_spans_with_editables] Only matched " + edIdx +
            " of " + editables_in_order.length + " editables. Found " +
            coloredSpans.length + " colored spans.");
    }
}

function _convert_span_to_editable(span, edInfo) {
    var ed = math_find_editable(edInfo.eid);
    if (!ed) return;

    var decimals = ed.decimals || 3;
    var displayVal = ed.get().toFixed(decimals);

    span.innerHTML = "";
    span.textContent = displayVal;
    span.className = (span.className || "") + " math-ed-num";
    span.setAttribute("data-math-eid", edInfo.eid);
    span.style.color = "";
    span.style.cursor = started_training ? "not-allowed" : "pointer";

    span.addEventListener("click", (function(eid, el) {
        return function(e) {
            e.stopPropagation();
            if (started_training) {
                console.warn("[_convert_span_to_editable] Cannot edit variables while training is in progress.");
                return;
            }
            math_open_popup(eid, el.getBoundingClientRect());
        };
    })(edInfo.eid, span));
}

// ============================================================
// SINGLE LATEX RENDER + EDITABLE POST-PROCESS
// ============================================================

function el_render_single_latex_with_editables(container, latex, editables) {
    container.innerHTML = "";

    var wrapper = document.createElement("div");
    wrapper.className = "math-hybrid-rendered";

    try {
        wrapper.innerHTML = temml.renderToString(latex, { displayMode: true });
    } catch (err) {
        console.error("[el_render_single_latex_with_editables] Temml error:", err);
        wrapper.innerHTML = "<span style='color:#e94560;font-size:0.85em;'>ParseError: " +
            err.message + "</span><br><code style='font-size:0.7em;color:#888;'>" +
            latex.substring(0, 300) + "...</code>";
        container.appendChild(wrapper);
        return;
    }

    container.appendChild(wrapper);
    _replace_colored_spans_with_editables(wrapper, editables);
}

// ============================================================
// SAFE PREDICT WRAPPER (avoids fromPixels errors for conv models)
// ============================================================

async function _safe_predict_own_data_and_repredict() {
    try {
        // If the model requires image input (has convolutions), we need
        // to verify that valid image data is available before predicting.
        if (typeof input_shape_is_image === "function" && input_shape_is_image()) {
            // For image-based models, check if there's a valid image element
            // or canvas to predict from, not just a text string.
            var predict_input = document.getElementById("predict_own_data");
            if (predict_input) {
                var val = predict_input.value;
                // If the value is a plain string (not a data URL or valid image source),
                // skip prediction to avoid the fromPixels error.
                if (typeof val === "string" && val.length > 0 &&
                    !val.startsWith("data:image") &&
                    !val.startsWith("http") &&
                    !val.startsWith("blob:")) {
                    // Check if there's an image element in the predict container
                    var predict_img = document.querySelector("#predict_container img, #predict_container canvas, #predictcontainer img, #predictcontainer canvas");
                    if (!predict_img) {
                        dbg("[_safe_predict_own_data_and_repredict] Skipping prediction: model requires image input but no valid image element found.");
                        return;
                    }
                }
            }

            // Also check if there's a valid canvas/image for webcam or uploaded image
            var own_image_el = document.querySelector("#own_image, #predict_image, .predict_own_image");
            if (!own_image_el) {
                // Try to find any suitable image element for prediction
                var any_predict_canvas = document.querySelector("#predict_canvas, .predict_canvas");
                if (!any_predict_canvas) {
                    dbg("[_safe_predict_own_data_and_repredict] Skipping prediction: no valid image/canvas element available for convolutional model.");
                    return;
                }
            }
        }

        await predict_own_data_and_repredict();
    } catch (e) {
        console.warn("[_safe_predict_own_data_and_repredict] Error during prediction:", e);
    }
}

function _math_update_popup_position() {
	if (!_math_pop_el || !_math_pop_el.classList.contains("math-pop-visible")) return;
	if (!_math_active_ed) return;

	var activeEl = document.querySelector('[data-math-eid="' + _math_active_ed.id + '"]');
	if (!activeEl) return;

	var anchorRect = activeEl.getBoundingClientRect();
	var left = anchorRect.left + anchorRect.width / 2 - 115;
	var top = anchorRect.bottom + 8;

	if (left < 5) left = 5;
	if (left > window.innerWidth - 240) left = window.innerWidth - 240;
	if (top > window.innerHeight - 120) top = anchorRect.top - 110;

	_math_pop_el.style.left = left + "px";
	_math_pop_el.style.top = top + "px";
}

// Register the scroll listener (do this once, e.g., inside math_ensure_popup):
window.addEventListener("scroll", _math_update_popup_position, true);
