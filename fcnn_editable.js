"use strict";

// ============================================================
// FCNN INTERACTIVE EDITING SYSTEM
// Inspired by math_editable.js popup pattern
// ============================================================

var _fcnn_edit_popup_el = null;
var _fcnn_edit_active = null; // { type, layer_idx, neuron_idx, from_idx, to_idx, ... }
var _fcnn_edit_initial_value = null;

// ============================================================
// POPUP CREATION
// ============================================================

function _fcnn_edit_ensure_popup() {
    // If popup exists and is in DOM, reuse it
    if (_fcnn_edit_popup_el && document.body.contains(_fcnn_edit_popup_el)) {
        return _fcnn_edit_popup_el;
    }

    // Remove any orphaned popup
    var existing = document.getElementById("fcnn_edit_popup");
    if (existing) {
        try { existing.parentNode.removeChild(existing); } catch(e) {}
    }

    var is_dark = false;
    try { is_dark = (typeof is_dark_mode !== 'undefined' && !!is_dark_mode); } catch(e) {}

    var pop = document.createElement("div");
    pop.id = "fcnn_edit_popup";
    pop.setAttribute("data-fcnn-edit", "true");
    pop.style.cssText = [
        "position: fixed",
        "z-index: 1000000",
        "background: " + (is_dark ? 'rgba(25,25,35,0.98)' : 'rgba(255,255,255,0.99)'),
        "color: " + (is_dark ? '#e0e0e0' : '#222'),
        "border: 2px solid " + (is_dark ? '#6080cc' : '#3366cc'),
        "border-radius: 10px",
        "padding: 14px 18px",
        "font-family: 'Segoe UI', Arial, sans-serif",
        "font-size: 13px",
        "min-width: 280px",
        "max-width: 420px",
        "box-shadow: 0 8px 32px rgba(0,0,0,0.3)",
        "display: none",
        "opacity: 0",
        "transition: opacity 0.15s ease",
        "user-select: none",
        "-webkit-user-select: none",
        "overflow: visible"
    ].join(";");

    pop.innerHTML = [
        '<div id="fcnn_edit_title" style="font-weight:bold;font-size:14px;margin-bottom:8px;"></div>',
        '<div id="fcnn_edit_info" style="font-size:11px;opacity:0.7;margin-bottom:10px;word-break:break-word;"></div>',
        
        '<!-- WEIGHT SECTION -->',
        '<div id="fcnn_edit_weight_section" style="display:none;margin-bottom:10px;padding:8px;border:1px solid ' + (is_dark ? '#444' : '#ddd') + ';border-radius:6px;">',
        '  <div style="font-weight:600;font-size:11px;margin-bottom:6px;opacity:0.8;">⚖️ Weight</div>',
        '  <div style="display:flex;align-items:center;gap:8px;margin-bottom:4px;">',
        '    <label style="font-weight:600;min-width:50px;font-size:12px;">Value:</label>',
        '    <input type="number" id="fcnn_edit_weight_num" step="any" style="',
        '      flex:1;padding:5px 8px;border-radius:5px;',
        '      border:1px solid ' + (is_dark ? '#555' : '#ccc') + ';',
        '      background:' + (is_dark ? '#2a2a3a' : '#fff') + ';',
        '      color:' + (is_dark ? '#eee' : '#222') + ';',
        '      font-size:13px;font-family:monospace;',
        '      -moz-appearance:textfield;',
        '    ">',
        '  </div>',
        '  <input type="range" id="fcnn_edit_weight_slider" style="width:100%;margin:4px 0;cursor:pointer;" min="-5" max="5" step="0.001">',
        '  <div id="fcnn_edit_weight_range_info" style="display:flex;justify-content:space-between;font-size:9px;opacity:0.5;"></div>',
        '</div>',
        
        '<!-- BIAS SECTION -->',
        '<div id="fcnn_edit_bias_section" style="display:none;margin-bottom:10px;padding:8px;border:1px solid ' + (is_dark ? '#444' : '#ddd') + ';border-radius:6px;">',
        '  <div style="font-weight:600;font-size:11px;margin-bottom:6px;opacity:0.8;">🎯 Bias</div>',
        '  <div style="display:flex;align-items:center;gap:8px;margin-bottom:4px;">',
        '    <label style="font-weight:600;min-width:50px;font-size:12px;">Value:</label>',
        '    <input type="number" id="fcnn_edit_bias_num" step="any" style="',
        '      flex:1;padding:5px 8px;border-radius:5px;',
        '      border:1px solid ' + (is_dark ? '#555' : '#ccc') + ';',
        '      background:' + (is_dark ? '#2a2a3a' : '#fff') + ';',
        '      color:' + (is_dark ? '#eee' : '#222') + ';',
        '      font-size:13px;font-family:monospace;',
        '      -moz-appearance:textfield;',
        '    ">',
        '  </div>',
        '  <input type="range" id="fcnn_edit_bias_slider" style="width:100%;margin:4px 0;cursor:pointer;" min="-5" max="5" step="0.001">',
        '  <div id="fcnn_edit_bias_range_info" style="display:flex;justify-content:space-between;font-size:9px;opacity:0.5;"></div>',
        '</div>',
        
        '<!-- FROM/TO SELECTOR (for weight editing) -->',
        '<div id="fcnn_edit_indices_section" style="display:none;margin-bottom:10px;padding:8px;border:1px solid ' + (is_dark ? '#444' : '#ddd') + ';border-radius:6px;">',
        '  <div style="font-weight:600;font-size:11px;margin-bottom:6px;opacity:0.8;">🔗 Connection Indices</div>',
        '  <div style="display:flex;gap:12px;">',
        '    <div style="flex:1;">',
        '      <label style="font-size:11px;font-weight:600;">From neuron:</label>',
        '      <input type="number" id="fcnn_edit_from_idx" min="0" step="1" style="',
        '        width:100%;padding:4px 6px;border-radius:4px;margin-top:2px;',
        '        border:1px solid ' + (is_dark ? '#555' : '#ccc') + ';',
        '        background:' + (is_dark ? '#2a2a3a' : '#fff') + ';',
        '        color:' + (is_dark ? '#eee' : '#222') + ';',
        '        font-size:12px;font-family:monospace;',
        '      ">',
        '    </div>',
        '    <div style="flex:1;">',
        '      <label style="font-size:11px;font-weight:600;">To neuron:</label>',
        '      <input type="number" id="fcnn_edit_to_idx" min="0" step="1" style="',
        '        width:100%;padding:4px 6px;border-radius:4px;margin-top:2px;',
        '        border:1px solid ' + (is_dark ? '#555' : '#ccc') + ';',
        '        background:' + (is_dark ? '#2a2a3a' : '#fff') + ';',
        '        color:' + (is_dark ? '#eee' : '#222') + ';',
        '        font-size:12px;font-family:monospace;',
        '      ">',
        '    </div>',
        '  </div>',
        '</div>',
        
        '<!-- BUTTONS -->',
        '<div style="display:flex;gap:8px;justify-content:flex-end;margin-top:6px;">',
        '  <button id="fcnn_edit_reset" title="Reset to original value" style="',
        '    padding:5px 12px;border-radius:5px;border:1px solid ' + (is_dark ? '#555' : '#ccc') + ';',
        '    background:' + (is_dark ? '#3a3a4a' : '#f0f0f0') + ';color:' + (is_dark ? '#ddd' : '#333') + ';',
        '    cursor:pointer;font-size:12px;',
        '  ">↺ Reset</button>',
        '  <button id="fcnn_edit_close" style="',
        '    padding:5px 12px;border-radius:5px;border:none;',
        '    background:' + (is_dark ? '#4466aa' : '#3366cc') + ';color:#fff;',
        '    cursor:pointer;font-size:12px;font-weight:600;',
        '  ">✕ Close</button>',
        '</div>'
    ].join("\n");

    document.body.appendChild(pop);
    _fcnn_edit_popup_el = pop;

    // ===== Wire up ALL events with maximum resilience =====
    var weightNum = document.getElementById("fcnn_edit_weight_num");
    var weightSlider = document.getElementById("fcnn_edit_weight_slider");
    var biasNum = document.getElementById("fcnn_edit_bias_num");
    var biasSlider = document.getElementById("fcnn_edit_bias_slider");
    var fromIdx = document.getElementById("fcnn_edit_from_idx");
    var toIdx = document.getElementById("fcnn_edit_to_idx");
    var resetBtn = document.getElementById("fcnn_edit_reset");
    var closeBtn = document.getElementById("fcnn_edit_close");

    // --- Weight number input ---
    function _onWeightNumChange() {
        if (!_fcnn_edit_active) return;
        if (_fcnn_edit_is_training()) return;
        var v = parseFloat(weightNum.value);
        if (!isFinite(v)) return;
        var sMin = parseFloat(weightSlider.min);
        var sMax = parseFloat(weightSlider.max);
        // Auto-expand slider range if value exceeds it
        if (v < sMin) { weightSlider.min = (v * 1.5).toString(); }
        if (v > sMax) { weightSlider.max = (v * 1.5).toString(); }
        weightSlider.value = v;
        _fcnn_edit_apply_value(v);
    }
    weightNum.addEventListener("input", _onWeightNumChange);
    weightNum.addEventListener("change", _onWeightNumChange);
    weightNum.addEventListener("keydown", function(e) {
        if (e.key === "Enter") { e.preventDefault(); _onWeightNumChange(); }
    });

    // --- Weight slider ---
    function _onWeightSliderChange() {
        if (!_fcnn_edit_active) return;
        if (_fcnn_edit_is_training()) return;
        var v = parseFloat(weightSlider.value);
        if (!isFinite(v)) return;
        weightNum.value = v.toFixed(6);
        _fcnn_edit_apply_value(v);
    }
    weightSlider.addEventListener("input", _onWeightSliderChange);
    weightSlider.addEventListener("change", _onWeightSliderChange);

    // --- Bias number input ---
    function _onBiasNumChange() {
        if (!_fcnn_edit_active) return;
        if (_fcnn_edit_is_training()) return;
        var v = parseFloat(biasNum.value);
        if (!isFinite(v)) return;
        var sMin = parseFloat(biasSlider.min);
        var sMax = parseFloat(biasSlider.max);
        if (v < sMin) { biasSlider.min = (v * 1.5).toString(); }
        if (v > sMax) { biasSlider.max = (v * 1.5).toString(); }
        biasSlider.value = v;
        _fcnn_edit_apply_bias(v);
    }
    biasNum.addEventListener("input", _onBiasNumChange);
    biasNum.addEventListener("change", _onBiasNumChange);
    biasNum.addEventListener("keydown", function(e) {
        if (e.key === "Enter") { e.preventDefault(); _onBiasNumChange(); }
    });

    // --- Bias slider ---
    function _onBiasSliderChange() {
        if (!_fcnn_edit_active) return;
        if (_fcnn_edit_is_training()) return;
        var v = parseFloat(biasSlider.value);
        if (!isFinite(v)) return;
        biasNum.value = v.toFixed(6);
        _fcnn_edit_apply_bias(v);
    }
    biasSlider.addEventListener("input", _onBiasSliderChange);
    biasSlider.addEventListener("change", _onBiasSliderChange);

    // --- From/To index change (re-lookup weight) ---
    function _onIndexChange() {
        if (!_fcnn_edit_active) return;
        if (_fcnn_edit_active.type !== "weight") return;
        if (_fcnn_edit_is_training()) return;
        
        var fi = parseInt(fromIdx.value, 10);
        var ti = parseInt(toIdx.value, 10);
        if (!isFinite(fi) || !isFinite(ti)) return;
        if (fi < 0) { fi = 0; fromIdx.value = "0"; }
        if (ti < 0) { ti = 0; toIdx.value = "0"; }

        // Clamp to matrix bounds
        var shape = _fcnn_edit_active._weight_shape;
        if (shape && shape.length >= 2) {
            var rows = shape[shape.length - 2];
            var cols = shape[shape.length - 1];
            if (fi >= rows) { fi = rows - 1; fromIdx.value = fi.toString(); }
            if (ti >= cols) { ti = cols - 1; toIdx.value = ti.toString(); }
            
            var newFlatIdx = fi * cols + ti;
            _fcnn_edit_active.from_idx = fi;
            _fcnn_edit_active.to_idx = ti;
            _fcnn_edit_active.weight_flat_idx = newFlatIdx;

            // Read the new weight value
            var newVal = _fcnn_edit_read_weight_at(_fcnn_edit_active, newFlatIdx);
            if (newVal !== null) {
                weightNum.value = newVal.toFixed(6);
                var range = Math.max(Math.abs(newVal) * 3, 2);
                weightSlider.min = (-range).toString();
                weightSlider.max = range.toString();
                weightSlider.step = (range * 2 / 2000).toString();
                weightSlider.value = newVal;
                _fcnn_edit_initial_value.weight = newVal;
                
                // Update info text
                var infoEl = document.getElementById("fcnn_edit_info");
                if (infoEl) {
                    infoEl.innerHTML = 
                        'From neuron <b>' + fi + '</b> → To neuron <b>' + ti + '</b><br>' +
                        'Flat index: ' + newFlatIdx + ' of ' + (rows * cols) + '<br>' +
                        'Weight matrix shape: [' + rows + ' × ' + cols + ']';
                }
            }
        }
    }
    fromIdx.addEventListener("input", _onIndexChange);
    fromIdx.addEventListener("change", _onIndexChange);
    fromIdx.addEventListener("keydown", function(e) { if (e.key === "Enter") { e.preventDefault(); _onIndexChange(); } });
    toIdx.addEventListener("input", _onIndexChange);
    toIdx.addEventListener("change", _onIndexChange);
    toIdx.addEventListener("keydown", function(e) { if (e.key === "Enter") { e.preventDefault(); _onIndexChange(); } });

    // --- Reset button ---
    resetBtn.addEventListener("click", function(e) {
        e.preventDefault();
        e.stopPropagation();
        if (!_fcnn_edit_active || !_fcnn_edit_initial_value) return;
        if (_fcnn_edit_is_training()) return;

        if (_fcnn_edit_active.type === "weight" && _fcnn_edit_initial_value.weight !== undefined) {
            var wv = _fcnn_edit_initial_value.weight;
            weightNum.value = wv.toFixed(6);
            weightSlider.value = wv;
            _fcnn_edit_apply_value(wv);
        }
        if ((_fcnn_edit_active.type === "neuron_bias" || _fcnn_edit_active.type === "neuron_full") && _fcnn_edit_initial_value.bias !== undefined) {
            var bv = _fcnn_edit_initial_value.bias;
            biasNum.value = bv.toFixed(6);
            biasSlider.value = bv;
            _fcnn_edit_apply_bias(bv);
        }
    });

    // --- Close button ---
    closeBtn.addEventListener("click", function(e) {
        e.preventDefault();
        e.stopPropagation();
        _fcnn_edit_close_popup();
    });

    // --- Outside click (with delay to prevent immediate close) ---
    var _popup_just_opened = false;
    pop._setJustOpened = function() {
        _popup_just_opened = true;
        setTimeout(function() { _popup_just_opened = false; }, 300);
    };

    document.addEventListener("mousedown", function(e) {
        if (!_fcnn_edit_popup_el) return;
        if (_fcnn_edit_popup_el.style.display === "none") return;
        if (_popup_just_opened) return;
        if (_fcnn_edit_popup_el.contains(e.target)) return;
        // Don't close if clicking on the canvas (let click handler manage)
        var canvas = document.getElementById("fcnn_canvas");
        if (canvas && canvas.contains(e.target)) return;
        _fcnn_edit_close_popup();
    }, true);

    // --- Escape key to close ---
    document.addEventListener("keydown", function(e) {
        if (e.key === "Escape" || e.keyCode === 27) {
            if (_fcnn_edit_popup_el && _fcnn_edit_popup_el.style.display !== "none") {
                _fcnn_edit_close_popup();
            }
        }
    });

    // --- Prevent scroll-through on popup ---
    pop.addEventListener("wheel", function(e) {
        e.stopPropagation();
    }, { passive: true });

    return pop;
}

function _fcnn_edit_is_training() {
    try {
        if (typeof started_training !== 'undefined' && started_training) return true;
    } catch(e) {}
    try {
        if (typeof is_training !== 'undefined' && is_training) return true;
    } catch(e) {}
    try {
        if (typeof training_in_progress !== 'undefined' && training_in_progress) return true;
    } catch(e) {}
    return false;
}

function _fcnn_edit_read_weight_at(activeState, flatIdx) {
    try {
        if (!activeState) return null;
        var meta_infos = activeState.meta_infos || activeState._meta_infos;
        var from_layer = activeState.from_layer;
        
        // Try via get_layer_weight_data first
        if (typeof get_layer_weight_data === 'function' && meta_infos) {
            var weightInfo = get_layer_weight_data(from_layer, meta_infos);
            if (weightInfo && weightInfo.data && flatIdx >= 0 && flatIdx < weightInfo.data.length) {
                return weightInfo.data[flatIdx];
            }
        }
        
        // Fallback: direct layer access
        if (meta_infos && meta_infos[from_layer + 1]) {
            var meta = meta_infos[from_layer + 1];
            var layerIdx = meta.nr;
            if (layerIdx != null && typeof model !== 'undefined' && model && model.layers && model.layers[layerIdx]) {
                var layer = model.layers[layerIdx];
                var weights = layer.getWeights();
                if (weights && weights.length > 0) {
                    var data = weights[0].dataSync();
                    // Don't dispose — getWeights returns references in some TF.js versions
                    if (data && flatIdx >= 0 && flatIdx < data.length) {
                        return data[flatIdx];
                    }
                }
            }
        }
        
        return null;
    } catch(e) {
        console.warn("[fcnn_edit] _fcnn_edit_read_weight_at error:", e);
        return null;
    }
}

// ============================================================
// OPEN POPUP FOR NEURON (bias editing)
// ============================================================

function _fcnn_edit_open_neuron(region, mouseX, mouseY) {
    if (started_training) {
        console.warn("[fcnn_edit] Cannot edit while training is in progress.");
        return;
    }

    var pop = _fcnn_edit_ensure_popup();
    var layer_idx = region.layer_idx;
    var neuron_idx = region.neuron_idx;

    // Find the actual model layer that has weights/biases
    var actual_layer = _fcnn_edit_find_dense_layer_for_neuron(layer_idx);
    if (!actual_layer) {
        console.warn("[fcnn_edit] No editable layer found for layer_idx:", layer_idx);
        return;
    }

    var biasData = _fcnn_edit_get_bias_data(actual_layer);
    var biasValue = 0;
    if (biasData && neuron_idx < biasData.length) {
        biasValue = biasData[neuron_idx];
    } else {
        console.warn("[fcnn_edit] No bias found for neuron", neuron_idx, "in layer", actual_layer);
        return;
    }

    _fcnn_edit_active = {
        type: "neuron_bias",
        layer_idx: layer_idx,
        actual_layer_idx: actual_layer,
        neuron_idx: neuron_idx
    };
    _fcnn_edit_initial_value = { bias: biasValue };

    // Configure popup
    document.getElementById("fcnn_edit_title").textContent = `⚙️ Neuron [Layer ${layer_idx}, Index ${neuron_idx}]`;
    document.getElementById("fcnn_edit_info").textContent = `Editing bias of neuron ${neuron_idx} in ${region.layer_type || 'Dense'} layer`;

    // Hide weight section, show bias section
    document.getElementById("fcnn_edit_num").parentElement.style.display = "none";
    document.getElementById("fcnn_edit_slider").style.display = "none";
    document.getElementById("fcnn_edit_bias_section").style.display = "block";

    var biasNum = document.getElementById("fcnn_edit_bias_num");
    var biasSlider = document.getElementById("fcnn_edit_bias_slider");
    biasNum.value = biasValue.toFixed(6);

    // Set slider range dynamically
    var range = Math.max(Math.abs(biasValue) * 3, 2);
    biasSlider.min = -range;
    biasSlider.max = range;
    biasSlider.step = range / 1000;
    biasSlider.value = biasValue;

    _fcnn_edit_show_popup(pop, mouseX, mouseY);
}

// ============================================================
// OPEN POPUP FOR WEIGHT (connection editing)
// ============================================================

function _fcnn_edit_open_weight(region, mouseX, mouseY) {
    if (_fcnn_edit_is_training()) {
        console.warn("[fcnn_edit] Cannot edit while training is in progress.");
        return;
    }

    var pop = _fcnn_edit_ensure_popup();
    if (!pop) {
        console.error("[fcnn_edit] Failed to create popup element.");
        return;
    }

    var from_layer = region.from_layer;
    var to_layer = region.to_layer;
    var from_neurons = region.from_neurons;
    var to_neurons = region.to_neurons;

    // Get weight info
    var fcnn_data = null;
    try { fcnn_data = get_fcnn_data(); } catch(e) {}
    if (!fcnn_data) {
        console.warn("[fcnn_edit] Cannot get FCNN data.");
        return;
    }
    var names = fcnn_data[0];
    var units = fcnn_data[1];
    var meta_infos = fcnn_data[2];

    var weightInfo = null;
    try { weightInfo = get_layer_weight_data(from_layer, meta_infos); } catch(e) {}
    if (!weightInfo || !weightInfo.data) {
        console.warn("[fcnn_edit] No weight data for connection between layers", from_layer, "and", to_layer);
        return;
    }

    // Convert mouse position to canvas coordinates
    var canvas = document.getElementById("fcnn_canvas");
    if (!canvas) {
        console.warn("[fcnn_edit] Canvas not found.");
        return;
    }
    var rect = canvas.getBoundingClientRect();
    var scaleX = canvas.width / rect.width;
    var scaleY = canvas.height / rect.height;
    var canvasMouseX = (mouseX - rect.left) * scaleX;
    var canvasMouseY = (mouseY - rect.top) * scaleY;

    // Determine which neuron pair is closest to the click
    var relY = 0.5;
    var relX = 0.5;
    if (region.h > 0) {
        relY = (canvasMouseY - region.y) / region.h;
        relY = Math.max(0, Math.min(1, relY));
    }
    if (region.w > 0) {
        relX = (canvasMouseX - region.x) / region.w;
        relX = Math.max(0, Math.min(1, relX));
    }

    // Map to neuron indices using position heuristics
    var from_idx, to_idx;
    if (relX < 0.35) {
        // Near the "from" side
        from_idx = Math.min(from_neurons - 1, Math.max(0, Math.round(relY * (from_neurons - 1))));
        to_idx = Math.min(to_neurons - 1, Math.max(0, Math.round(relY * (to_neurons - 1))));
    } else if (relX > 0.65) {
        // Near the "to" side
        from_idx = Math.min(from_neurons - 1, Math.max(0, Math.round(relY * (from_neurons - 1))));
        to_idx = Math.min(to_neurons - 1, Math.max(0, Math.round(relY * (to_neurons - 1))));
    } else {
        // Middle — use Y for both
        from_idx = Math.min(from_neurons - 1, Math.max(0, Math.round(relY * (from_neurons - 1))));
        to_idx = Math.min(to_neurons - 1, Math.max(0, Math.round(relY * (to_neurons - 1))));
    }

    // Get the weight value
    var shape = weightInfo.shape;
    var cols = shape[shape.length - 1];
    var rows = shape[shape.length - 2];
    var fi = Math.min(from_idx, rows - 1);
    var ti = Math.min(to_idx, cols - 1);
    fi = Math.max(0, fi);
    ti = Math.max(0, ti);
    var weight_flat_idx = fi * cols + ti;

    if (weight_flat_idx < 0 || weight_flat_idx >= weightInfo.data.length) {
        console.warn("[fcnn_edit] Weight index out of bounds:", weight_flat_idx, "of", weightInfo.data.length);
        // Fallback to index 0
        weight_flat_idx = 0;
        fi = 0;
        ti = 0;
    }

    var weightValue = weightInfo.data[weight_flat_idx];
    if (!isFinite(weightValue)) weightValue = 0;

    _fcnn_edit_active = {
        type: "weight",
        from_layer: from_layer,
        to_layer: to_layer,
        from_idx: fi,
        to_idx: ti,
        weight_flat_idx: weight_flat_idx,
        meta_infos: meta_infos,
        _weight_shape: shape
    };
    _fcnn_edit_initial_value = { weight: weightValue };

    // Configure popup
    document.getElementById("fcnn_edit_title").textContent = "🔗 Weight [Layer " + from_layer + " → " + to_layer + "]";
    document.getElementById("fcnn_edit_info").innerHTML =
        "From neuron <b>" + fi + "</b> → To neuron <b>" + ti + "</b><br>" +
        "Flat index: " + weight_flat_idx + " of " + weightInfo.data.length + "<br>" +
        "Weight matrix shape: [" + rows + " × " + cols + "]";

    // Show weight section and indices section, hide bias section
    document.getElementById("fcnn_edit_weight_section").style.display = "block";
    document.getElementById("fcnn_edit_bias_section").style.display = "none";
    document.getElementById("fcnn_edit_indices_section").style.display = "block";

    var weightNum = document.getElementById("fcnn_edit_weight_num");
    var weightSlider = document.getElementById("fcnn_edit_weight_slider");
    var weightRangeInfo = document.getElementById("fcnn_edit_weight_range_info");
    var fromIdxInput = document.getElementById("fcnn_edit_from_idx");
    var toIdxInput = document.getElementById("fcnn_edit_to_idx");

    weightNum.value = weightValue.toFixed(6);

    // Dynamic slider range based on weight distribution
    var range = Math.max(
        Math.abs(weightInfo.max) * 1.5,
        Math.abs(weightInfo.min) * 1.5,
        Math.abs(weightValue) * 3,
        2
    );
    weightSlider.min = (-range).toString();
    weightSlider.max = range.toString();
    weightSlider.step = (range * 2 / 2000).toString();
    weightSlider.value = weightValue;

    if (weightRangeInfo) {
        weightRangeInfo.innerHTML = "<span>" + (-range).toFixed(2) + "</span><span>" + range.toFixed(2) + "</span>";
    }

    // Set index inputs
    fromIdxInput.value = fi.toString();
    fromIdxInput.max = (rows - 1).toString();
    toIdxInput.value = ti.toString();
    toIdxInput.max = (cols - 1).toString();

    _fcnn_edit_show_popup(pop, mouseX, mouseY);
    if (pop._setJustOpened) pop._setJustOpened();
}

// ============================================================
// OPEN POPUP FOR SPECIFIC WEIGHT (from neuron click - outgoing weights)
// ============================================================

function _fcnn_edit_open_neuron_weights(region, mouseX, mouseY) {
    if (_fcnn_edit_is_training()) {
        console.warn("[fcnn_edit] Cannot edit while training is in progress.");
        return;
    }

    var pop = _fcnn_edit_ensure_popup();
    if (!pop) {
        console.error("[fcnn_edit] Failed to create popup element.");
        return;
    }

    var layer_idx = region.layer_idx;
    var neuron_idx = region.neuron_idx;

    // Find the actual model layer that has bias for this neuron
    var actual_layer = _fcnn_edit_find_dense_layer_for_neuron(layer_idx);
    var biasData = actual_layer !== null ? _fcnn_edit_get_bias_data(actual_layer) : null;
    var biasValue = null;

    if (biasData && neuron_idx < biasData.length) {
        biasValue = biasData[neuron_idx];
    }

    // Even if no bias found, we should still open the popup with info
    // (user clicked a neuron — show what we can)
    if (biasValue === null && actual_layer === null) {
        // Try one more approach: maybe this is an input layer or non-Dense
        // Show an informational popup instead of silently failing
        _fcnn_edit_active = {
            type: "neuron_info_only",
            layer_idx: layer_idx,
            neuron_idx: neuron_idx
        };
        _fcnn_edit_initial_value = null;

        document.getElementById("fcnn_edit_title").textContent = "ℹ️ Neuron [Layer " + layer_idx + ", #" + neuron_idx + "]";
        document.getElementById("fcnn_edit_info").innerHTML = 
            "This neuron has no editable bias.<br>" +
            (layer_idx === 0 ? "Input layer neurons typically have no bias." : "Layer may use <code>use_bias=false</code>.");

        // Hide all edit sections
        document.getElementById("fcnn_edit_weight_section").style.display = "none";
        document.getElementById("fcnn_edit_bias_section").style.display = "none";
        document.getElementById("fcnn_edit_indices_section").style.display = "none";

        _fcnn_edit_show_popup(pop, mouseX, mouseY);
        if (pop._setJustOpened) pop._setJustOpened();
        return;
    }

    // We have a valid bias — set up full neuron editing
    _fcnn_edit_active = {
        type: "neuron_full",
        layer_idx: layer_idx,
        actual_layer_idx: actual_layer,
        neuron_idx: neuron_idx
    };
    _fcnn_edit_initial_value = { bias: biasValue };

    // Title and info
    document.getElementById("fcnn_edit_title").textContent = "⚙️ Neuron [Layer " + layer_idx + ", #" + neuron_idx + "]";
    document.getElementById("fcnn_edit_info").innerHTML = 
        "Bias of neuron <b>" + neuron_idx + "</b> in " + (region.layer_type || "Dense") + " layer" +
        (region.activation_value !== null && region.activation_value !== undefined 
            ? "<br>Current activation: <b>" + _format_number(region.activation_value) + "</b>" 
            : "");

    // Show bias section, hide weight and indices sections
    document.getElementById("fcnn_edit_weight_section").style.display = "none";
    document.getElementById("fcnn_edit_bias_section").style.display = "block";
    document.getElementById("fcnn_edit_indices_section").style.display = "none";

    var biasNum = document.getElementById("fcnn_edit_bias_num");
    var biasSlider = document.getElementById("fcnn_edit_bias_slider");
    var biasRangeInfo = document.getElementById("fcnn_edit_bias_range_info");

    biasNum.value = biasValue.toFixed(6);

    // Set slider range dynamically — ensure it's never zero-width
    var range = Math.max(Math.abs(biasValue) * 3, 2);
    biasSlider.min = (-range).toString();
    biasSlider.max = range.toString();
    biasSlider.step = (range * 2 / 2000).toString();
    biasSlider.value = biasValue;

    if (biasRangeInfo) {
        biasRangeInfo.innerHTML = "<span>" + (-range).toFixed(2) + "</span><span>" + range.toFixed(2) + "</span>";
    }

    _fcnn_edit_show_popup(pop, mouseX, mouseY);
    if (pop._setJustOpened) pop._setJustOpened();
}

// ============================================================
// SHOW/HIDE POPUP
// ============================================================

function _fcnn_edit_show_popup(pop, mouseX, mouseY) {
    if (!pop) return;

    // Make visible but transparent first to measure
    pop.style.display = "block";
    pop.style.opacity = "0";
    pop.style.left = "-9999px";
    pop.style.top = "-9999px";

    // Force layout calculation
    var pw = pop.offsetWidth || 300;
    var ph = pop.offsetHeight || 250;

    var vw = window.innerWidth || document.documentElement.clientWidth || 800;
    var vh = window.innerHeight || document.documentElement.clientHeight || 600;

    // Position near click, preferring right and below
    var left = mouseX + 20;
    var top = mouseY - 30;

    // Flip if would go off-screen
    if (left + pw > vw - 15) {
        left = mouseX - pw - 20;
    }
    if (top + ph > vh - 15) {
        top = vh - ph - 15;
    }
    if (left < 10) left = 10;
    if (top < 10) top = 10;

    // Final safety clamp
    left = Math.max(5, Math.min(left, vw - pw - 5));
    top = Math.max(5, Math.min(top, vh - ph - 5));

    pop.style.left = left + "px";
    pop.style.top = top + "px";
    pop.style.opacity = "1";

    // Double-check positioning after render (for dynamic content)
    requestAnimationFrame(function() {
        if (!pop || pop.style.display === "none") return;
        var actualW = pop.offsetWidth;
        var actualH = pop.offsetHeight;
        var currentLeft = parseInt(pop.style.left, 10) || 0;
        var currentTop = parseInt(pop.style.top, 10) || 0;

        if (currentLeft + actualW > vw - 5) {
            pop.style.left = Math.max(5, vw - actualW - 10) + "px";
        }
        if (currentTop + actualH > vh - 5) {
            pop.style.top = Math.max(5, vh - actualH - 10) + "px";
        }
    });
}

function _fcnn_edit_close_popup() {
    if (_fcnn_edit_popup_el) {
        _fcnn_edit_popup_el.style.opacity = "0";
        _fcnn_edit_popup_el.style.display = "none";
        _fcnn_edit_popup_el.style.left = "-9999px";
        _fcnn_edit_popup_el.style.top = "-9999px";
    }
    _fcnn_edit_active = null;
    _fcnn_edit_initial_value = null;
}

// ============================================================
// APPLY VALUE CHANGES TO MODEL (the core - like math_editable set())
// ============================================================

function _fcnn_edit_apply_value(newValue) {
    if (!_fcnn_edit_active) return;
    if (_fcnn_edit_active.type !== "weight") return;
    if (!isFinite(newValue)) return;

    // Check if model tensors are still valid (model may have been recreated)
    try {
        var meta_infos = _fcnn_edit_active.meta_infos;
        var from_layer = _fcnn_edit_active.from_layer;
        var meta = meta_infos[from_layer + 1];
        var layer = model.layers[meta.nr];
        var testWeights = layer.getWeights();
        if (!testWeights || testWeights.length === 0) return; // silent return
        testWeights[0].dataSync();
    } catch(e) {
        // Model was recreated - DON'T close popup, just skip this update.
        // The model will stabilize and next slider event will work.
        log("[fcnn_edit] Skipping weight update - model tensors temporarily unavailable.");
        return;  // <--- Einfach return, NICHT close!
    }

    try {
        var meta_infos = _fcnn_edit_active.meta_infos;
        var from_layer = _fcnn_edit_active.from_layer;
        var weight_flat_idx = _fcnn_edit_active.weight_flat_idx;

        if (!meta_infos || from_layer + 1 >= meta_infos.length) {
            console.warn("[fcnn_edit] Invalid meta_infos or from_layer");
            return;
        }

        // Get the actual model layer (weights belong to the receiving layer)
        var meta = meta_infos[from_layer + 1];
        if (!meta) { console.warn("[fcnn_edit] No meta for layer", from_layer + 1); return; }

        var actual_layer_idx = meta.nr;
        if (actual_layer_idx == null) { console.warn("[fcnn_edit] No layer nr"); return; }

        if (typeof model === 'undefined' || !model || !model.layers) {
            console.warn("[fcnn_edit] Model not available");
            return;
        }

        var layer = model.layers[actual_layer_idx];
        if (!layer) { console.warn("[fcnn_edit] Layer not found:", actual_layer_idx); return; }

        // Method 1: Use getWeights/setWeights (safest across TF.js versions)
        var currentWeights = null;
        try { currentWeights = layer.getWeights(); } catch(e) {}
        
        if (currentWeights && currentWeights.length > 0) {
            var kernelTensor = currentWeights[0];
            var kernelData = null;
            
            // Get mutable copy of kernel data
            try {
                kernelData = Array.from(kernelTensor.dataSync());
            } catch(e) {
                try {
                    kernelData = Array.from(kernelTensor.arraySync().flat(Infinity));
                } catch(e2) {
                    console.warn("[fcnn_edit] Cannot read kernel data");
                    return;
                }
            }

            if (weight_flat_idx >= kernelData.length) {
                console.warn("[fcnn_edit] Index out of bounds:", weight_flat_idx, ">=", kernelData.length);
                return;
            }

            kernelData[weight_flat_idx] = newValue;

            // Build new weights array
            var newWeightTensors = [];
            try {
                var newKernel = tf.tensor(kernelData, kernelTensor.shape);
                newWeightTensors.push(newKernel);

                for (var i = 1; i < currentWeights.length; i++) {
                    newWeightTensors.push(currentWeights[i]);
                }

                // Set weights — TF.js internally clones the data
                layer.setWeights(newWeightTensors);

                // Only dispose the new kernel we created (not the ones from getWeights
                // which TF.js may still reference internally in some versions)
                newKernel.dispose();
            } catch(setErr) {
                console.warn("[fcnn_edit] setWeights failed, trying direct approach:", setErr.message);
                // Dispose our new kernel if it was created
                if (newWeightTensors.length > 0 && newWeightTensors[0] && typeof newWeightTensors[0].dispose === 'function') {
                    try { newWeightTensors[0].dispose(); } catch(e) {}
                }
                
                // Method 2: Direct .val assignment (works in some TF.js builds)
                _fcnn_edit_apply_value_direct(layer, weight_flat_idx, newValue);
                return;
            }

            // Trigger live update
            _fcnn_edit_trigger_update();
            return;
        }

        // Method 2 fallback: Direct tensor manipulation
        _fcnn_edit_apply_value_direct(layer, weight_flat_idx, newValue);

    } catch (e) {
        console.error("[fcnn_edit] Error applying weight value:", e);
    }
}

// Direct .val manipulation fallback
function _fcnn_edit_apply_value_direct(layer, weight_flat_idx, newValue) {
    try {
        if (!layer || !layer.weights || layer.weights.length === 0) return;
        
        var kernel = layer.weights[0];
        if (!kernel) return;

        // Try .val approach
        if (kernel.val && typeof kernel.val.dataSync === 'function') {
            var data = Array.from(kernel.val.dataSync());
            if (weight_flat_idx < data.length) {
                data[weight_flat_idx] = newValue;
                var oldVal = kernel.val;
                kernel.val = tf.tensor(data, kernel.shape || oldVal.shape);
                try { oldVal.dispose(); } catch(e) {}
                _fcnn_edit_trigger_update();
                return;
            }
        }

        // Try kernel.write() approach (newer TF.js)
        if (typeof kernel.write === 'function') {
            var readTensor = typeof kernel.read === 'function' ? kernel.read() : null;
            if (readTensor) {
                var data = Array.from(readTensor.dataSync());
                if (weight_flat_idx < data.length) {
                    data[weight_flat_idx] = newValue;
                    var newTensor = tf.tensor(data, readTensor.shape);
                    kernel.write(newTensor);
                    newTensor.dispose();
                    _fcnn_edit_trigger_update();
                }
            }
        }
    } catch(e) {
        console.warn("[fcnn_edit] Direct value assignment also failed:", e);
    }
}

function _fcnn_edit_apply_bias(newValue) {
    if (!_fcnn_edit_active) return;
    if (_fcnn_edit_active.type !== "neuron_bias" && _fcnn_edit_active.type !== "neuron_full") return;
    if (!isFinite(newValue)) return;

    try {
        var actual_layer_idx = _fcnn_edit_active.actual_layer_idx;
        var neuron_idx = _fcnn_edit_active.neuron_idx;

        if (typeof model === 'undefined' || !model || !model.layers) {
            console.warn("[fcnn_edit] Model not available");
            return;
        }

        if (actual_layer_idx == null || actual_layer_idx < 0 || actual_layer_idx >= model.layers.length) {
            console.warn("[fcnn_edit] Invalid layer index:", actual_layer_idx);
            return;
        }

        var layer = model.layers[actual_layer_idx];
        if (!layer) { console.warn("[fcnn_edit] Layer not found:", actual_layer_idx); return; }

        // Method 1: getWeights/setWeights
        var currentWeights = null;
        try { currentWeights = layer.getWeights(); } catch(e) {}

        if (currentWeights && currentWeights.length >= 2) {
            var biasTensor = currentWeights[1];
            var biasData = null;

            try {
                biasData = Array.from(biasTensor.dataSync());
            } catch(e) {
                try {
                    biasData = Array.from(biasTensor.arraySync());
                } catch(e2) {
                    console.warn("[fcnn_edit] Cannot read bias data");
                    return;
                }
            }

            if (neuron_idx >= biasData.length) {
                console.warn("[fcnn_edit] Neuron index out of bounds:", neuron_idx, ">=", biasData.length);
                return;
            }

            biasData[neuron_idx] = newValue;

            // Build new weights array
            var newWeightTensors = [];
            try {
                // Keep kernel unchanged
                newWeightTensors.push(currentWeights[0]);
                
                // New bias
                var newBias = tf.tensor(biasData, biasTensor.shape);
                newWeightTensors.push(newBias);

                // Any additional weight tensors (rare but possible)
                for (var i = 2; i < currentWeights.length; i++) {
                    newWeightTensors.push(currentWeights[i]);
                }

                // Set weights
                layer.setWeights(newWeightTensors);

                // Dispose only the new bias tensor we created
                newBias.dispose();
            } catch(setErr) {
                console.warn("[fcnn_edit] setWeights for bias failed, trying direct:", setErr.message);
                try { if (newWeightTensors[1] && typeof newWeightTensors[1].dispose === 'function') newWeightTensors[1].dispose(); } catch(e) {}
                
                // Fallback: direct .val manipulation
                _fcnn_edit_apply_bias_direct(layer, neuron_idx, newValue);
                return;
            }

            _fcnn_edit_trigger_update();
            return;
        }

        // Method 2 fallback
        _fcnn_edit_apply_bias_direct(layer, neuron_idx, newValue);

    } catch (e) {
        console.error("[fcnn_edit] Error applying bias value:", e);
    }
}

// Direct .val manipulation fallback for bias
function _fcnn_edit_apply_bias_direct(layer, neuron_idx, newValue) {
    try {
        if (!layer || !layer.weights || layer.weights.length < 2) return;
        
        var biasWeight = layer.weights[1];
        if (!biasWeight) return;

        // Try .val approach
        if (biasWeight.val && typeof biasWeight.val.dataSync === 'function') {
            var data = Array.from(biasWeight.val.dataSync());
            if (neuron_idx < data.length) {
                data[neuron_idx] = newValue;
                var oldVal = biasWeight.val;
                biasWeight.val = tf.tensor(data, biasWeight.shape || oldVal.shape);
                try { oldVal.dispose(); } catch(e) {}
                _fcnn_edit_trigger_update();
                return;
            }
        }

        // Try .write() approach
        if (typeof biasWeight.write === 'function') {
            var readTensor = typeof biasWeight.read === 'function' ? biasWeight.read() : null;
            if (readTensor) {
                var data = Array.from(readTensor.dataSync());
                if (neuron_idx < data.length) {
                    data[neuron_idx] = newValue;
                    var newTensor = tf.tensor(data, readTensor.shape);
                    biasWeight.write(newTensor);
                    newTensor.dispose();
                    _fcnn_edit_trigger_update();
                }
            }
        }

        // Try layer.bias direct access
        if (layer.bias && layer.bias.val && typeof layer.bias.val.dataSync === 'function') {
            var data = Array.from(layer.bias.val.dataSync());
            if (neuron_idx < data.length) {
                data[neuron_idx] = newValue;
                var oldVal = layer.bias.val;
                layer.bias.val = tf.tensor(data, oldVal.shape);
                try { oldVal.dispose(); } catch(e) {}
                _fcnn_edit_trigger_update();
            }
        }
    } catch(e) {
        console.warn("[fcnn_edit] Direct bias assignment also failed:", e);
    }
}

// ============================================================
// SAFE WEIGHT SETTING (handles TF.js layer.setWeights)
// ============================================================

function _fcnn_edit_set_layer_weights_safe(layer, layer_idx) {
    try {
        // Rebuild weight tensors from the .val references
        var newWeights = [];
        for (var i = 0; i < layer.weights.length; i++) {
            var w = layer.weights[i];
            if (w && w.val) {
                newWeights.push(w.val);
            }
        }

        if (newWeights.length > 0) {
            layer.setWeights(newWeights);
        }
    } catch (e) {
        // setWeights may fail if shapes don't match; the direct .val assignment
        // above should still work for inference
        console.warn("[fcnn_edit] setWeights fallback - direct tensor assignment used:", e.message);
    }
}

// ============================================================
// TRIGGER LIVE UPDATE (repredict, redraw FCNN, update GUI)
// ============================================================

var _fcnn_edit_update_timer = null;
var _fcnn_edit_update_in_progress = false;

function _fcnn_edit_trigger_update() {
    // Debounce to avoid excessive redraws during slider drag
    if (_fcnn_edit_update_timer) clearTimeout(_fcnn_edit_update_timer);

    _fcnn_edit_update_timer = setTimeout(async function() {
        if (_fcnn_edit_update_in_progress) return;
        _fcnn_edit_update_in_progress = true;

        try {
            // 1. Clear connection cache (weights changed, colors will differ)
            try {
                if (typeof CONNECTION_CANVAS_CACHE !== 'undefined' && CONNECTION_CANVAS_CACHE && typeof CONNECTION_CANVAS_CACHE.clear === 'function') {
                    CONNECTION_CANVAS_CACHE.clear();
                }
            } catch(e) {}

            // 2. Invalidate FCNN hashes to force redraw
            try { if (typeof last_fcnn_data_hash !== 'undefined') last_fcnn_data_hash = null; } catch(e) {}
            try { if (typeof last_fcnn_hash !== 'undefined') last_fcnn_hash = null; } catch(e) {}

            // 3. Invalidate ALL prediction caches so repredict doesn't short-circuit
            try { if (typeof last_predict_handdrawn_hash !== 'undefined') last_predict_handdrawn_hash = null; } catch(e) {}
            try { if (typeof last_handdrawn_image_hash !== 'undefined') last_handdrawn_image_hash = null; } catch(e) {}
            try { if (typeof last_status_hash_text_prediction !== 'undefined') last_status_hash_text_prediction = null; } catch(e) {}
            try { if (typeof new_handdrawn_image_hash !== 'undefined') new_handdrawn_image_hash = null; } catch(e) {}

            // 4. Re-run layer states (forward pass through model to get new activations)
            try {
                if (typeof get_layer_states === 'function') {
                    await get_layer_states();
                }
            } catch (e) {
                console.warn("[fcnn_edit] get_layer_states error (non-critical):", e.message || e);
            }

            // 5. Repredict
            try {
                if (typeof _safe_predict_own_data_and_repredict === 'function') {
                    await _safe_predict_own_data_and_repredict();
                } else if (typeof predict_own_data_and_repredict === 'function') {
                    await predict_own_data_and_repredict();
                }
            } catch (e) {
                console.warn("[fcnn_edit] Prediction error (non-critical):", e.message || e);
            }

            // 6. Force redraw FCNN canvas
            try {
                if (typeof force_restart_fcnn === 'function') {
                    await force_restart_fcnn();
                } else if (typeof restart_fcnn === 'function') {
                    await restart_fcnn(1);
                }
            } catch (e) {
                console.warn("[fcnn_edit] FCNN redraw error:", e.message || e);
            }

            // 7. Update math displays if they exist
            try {
                if (typeof updated_page === 'function') await updated_page();
            } catch (e) {}

            // 8. Update confusion matrix / metrics if visible
            try {
                if (typeof update_confusion_matrix === 'function') await update_confusion_matrix();
            } catch (e) {}

            // 9. Fire custom event for any other listeners
            try {
                document.dispatchEvent(new CustomEvent("fcnn_weights_changed", {
                    detail: { active: _fcnn_edit_active, timestamp: Date.now() }
                }));
            } catch (e) {}

        } catch (e) {
            console.warn("[fcnn_edit] Error during live update:", e);
        } finally {
            _fcnn_edit_update_in_progress = false;
            _fcnn_edit_update_timer = null;
        }
    }, 60);
}

// ============================================================
// HELPER: Find the actual dense layer index for a given FCNN layer_idx
// ============================================================

function _fcnn_edit_find_dense_layer_for_neuron(fcnn_layer_idx) {
    try {
        if (typeof model === 'undefined' || !model || !model.layers) return null;

        var fcnn_data = null;
        try { fcnn_data = get_fcnn_data(); } catch(e) { return null; }
        if (!fcnn_data) return null;

        var names = fcnn_data[0];
        var units = fcnn_data[1];
        var meta_infos = fcnn_data[2];

        if (!meta_infos || fcnn_layer_idx >= meta_infos.length) return null;

        var meta = meta_infos[fcnn_layer_idx];
        if (!meta || meta.nr === undefined || meta.nr === null) return null;

        var actual_idx = meta.nr;
        if (actual_idx < 0 || actual_idx >= model.layers.length) return null;

        // Input layer (index 0 in FCNN visualization) typically has no bias
        if (fcnn_layer_idx === 0) {
            // Check if this layer itself has bias (unusual for input but possible)
            var layer = model.layers[actual_idx];
            if (layer) {
                var w = null;
                try { w = layer.getWeights(); } catch(e) {}
                if (w && w.length >= 2) {
                    // Verify bias size matches expected units
                    try {
                        var biasShape = w[1].shape;
                        var biasSize = biasShape[biasShape.length - 1];
                        if (biasSize === units[fcnn_layer_idx]) {
                            return actual_idx;
                        }
                    } catch(e) {}
                }
            }
            return null;
        }

        // For non-input layers, check the layer at actual_idx
        var layer = model.layers[actual_idx];
        if (!layer) return null;

        // Check if this layer has weights with bias
        var w = null;
        try { w = layer.getWeights(); } catch(e) {}
        
        if (w && w.length >= 2) {
            // Verify bias size matches expected neuron count
            try {
                var biasShape = w[1].shape;
                var biasSize = biasShape[biasShape.length - 1];
                var expected = units[fcnn_layer_idx];
                if (biasSize === expected) {
                    return actual_idx;
                }
                // If sizes don't match exactly, still return if it's close
                // (could be due to visualization truncation)
                if (biasSize >= expected) {
                    return actual_idx;
                }
            } catch(e) {
                // Shape check failed but layer has 2+ weight tensors — likely valid
                return actual_idx;
            }
            return actual_idx;
        }

        // Layer doesn't have bias — check via layer.weights property
        try {
            if (layer.weights && layer.weights.length >= 2) {
                var biasWeight = layer.weights[1];
                if (biasWeight && (biasWeight.val || typeof biasWeight.read === 'function')) {
                    return actual_idx;
                }
            }
        } catch(e) {}

        // Fallback: scan adjacent layers for matching bias size
        var expected_units = units[fcnn_layer_idx];
        for (var offset = -2; offset <= 2; offset++) {
            if (offset === 0) continue;
            var tryIdx = actual_idx + offset;
            if (tryIdx < 0 || tryIdx >= model.layers.length) continue;

            var tryLayer = model.layers[tryIdx];
            if (!tryLayer) continue;

            var tw = null;
            try { tw = tryLayer.getWeights(); } catch(e) { continue; }
            if (!tw || tw.length < 2) continue;

            try {
                var biasShape = tw[1].shape;
                var biasSize = biasShape[biasShape.length - 1];
                if (biasSize === expected_units) {
                    return tryIdx;
                }
            } catch(e) {}
        }

        return null;
    } catch (e) {
        console.warn("[fcnn_edit] Error finding dense layer:", e);
        return null;
    }
}

// ============================================================
// HELPER: Get bias data array for a layer
// ============================================================

// ===== EXTRACTED HELPERS FOR _fcnn_edit_get_bias_data =====

function _try_read_bias_from_getWeights(layer) {
    // Method 1: getWeights() — most reliable
    try {
        var weights = layer.getWeights();
        if (weights && weights.length >= 2) {
            var biasTensor = weights[1];
            if (biasTensor) {
                var result = _try_extract_array_from_tensor(biasTensor);
                if (result) return result;
            }
        }
    } catch(e) {}
    return null;
}

function _try_read_bias_from_weights_property(layer) {
    // Method 2: layer.weights[1].val (older TF.js / custom builds)
    try {
        if (layer.weights && layer.weights.length >= 2) {
            var biasWeight = layer.weights[1];
            if (biasWeight) {
                var result = _try_extract_array_from_weight_variable(biasWeight);
                if (result) return result;
            }
        }
    } catch(e) {}
    return null;
}

function _try_read_bias_from_layer_bias(layer) {
    // Method 3: layer.bias (some TF.js versions expose this directly)
    try {
        if (layer.bias) {
            var result = _try_extract_array_from_weight_variable(layer.bias);
            if (result) return result;
        }
    } catch(e) {}
    return null;
}

function _try_extract_array_from_tensor(tensor) {
    if (typeof tensor.dataSync === 'function') {
        var data = tensor.dataSync();
        if (data && data.length > 0) {
            return Array.from(data);
        }
    }
    if (typeof tensor.arraySync === 'function') {
        var arr = tensor.arraySync();
        if (Array.isArray(arr)) {
            return arr.flat ? arr.flat(Infinity) : arr;
        }
    }
    return null;
}

function _try_extract_array_from_weight_variable(weightVar) {
    // Try .val.dataSync()
    if (weightVar.val && typeof weightVar.val.dataSync === 'function') {
        var data = weightVar.val.dataSync();
        if (data && data.length > 0) return Array.from(data);
    }
    // Try .val.arraySync()
    if (weightVar.val && typeof weightVar.val.arraySync === 'function') {
        var arr = weightVar.val.arraySync();
        if (Array.isArray(arr)) return arr.flat ? arr.flat(Infinity) : arr;
    }
    // Try .read()
    if (typeof weightVar.read === 'function') {
        var tensor = weightVar.read();
        if (tensor) {
            var result = _try_extract_array_from_tensor(tensor);
            if (result) return result;
        }
    }
    // Try direct dataSync on the weight variable itself
    if (typeof weightVar.dataSync === 'function') {
        var data = weightVar.dataSync();
        if (data && data.length > 0) return Array.from(data);
    }
    return null;
}

function _check_layer_has_no_bias(layer) {
    // Method 4: Try layer.getConfig() to check if use_bias is false
    try {
        var config = layer.getConfig ? layer.getConfig() : null;
        if (config && config.use_bias === false) {
            return true;
        }
    } catch(e) {}
    return false;
}

// ===== REFACTORED MAIN FUNCTION =====

function _fcnn_edit_get_bias_data(actual_layer_idx) {
    try {
        if (typeof model === 'undefined' || !model || !model.layers) return null;
        if (actual_layer_idx == null || actual_layer_idx < 0 || actual_layer_idx >= model.layers.length) return null;

        var layer = model.layers[actual_layer_idx];
        if (!layer) return null;

        var result;

        result = _try_read_bias_from_getWeights(layer);
        if (result) return result;

        result = _try_read_bias_from_weights_property(layer);
        if (result) return result;

        result = _try_read_bias_from_layer_bias(layer);
        if (result) return result;

        if (_check_layer_has_no_bias(layer)) {
            return null;
        }

        return null;
    } catch (e) {
        console.warn("[fcnn_edit] _fcnn_edit_get_bias_data error:", e);
        return null;
    }
}
