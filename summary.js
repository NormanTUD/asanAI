"use strict";

// ============================================================
// CONSTANTS & CONFIG
// ============================================================
var SUMMARY_CONFIG = {
	param_bar_color: "#4CAF50",
	param_bar_bg: "#e0e0e0",
	param_bar_height: "8px",
	chart_height: 80,
	chart_width: null,
	chart_stroke_color: "#2196F3",
	chart_fill_color: "rgba(33, 150, 243, 0.15)",
	chart_grid_color: "#e0e0e0",
	tooltip_bg: "#333",
	tooltip_color: "#fff",
	tooltip_max_width: "360px",
	arrow_color: "#888"
};

// ============================================================
// RESET
// ============================================================
function reset_summary() {
	last_summary_model_uuid = null;
}

// ============================================================
// MAIN WRITE FUNCTIONS
// ============================================================
function write_model_summary() {
	if (is_hidden_or_has_hidden_parent($("#summary_tab"))) {
		return;
	}

	$("#summarycontainer").show();

	assert(typeof(model) == "object", "model is not an object");

	var summary_element = document.getElementById("summary");
	if (!summary_element) return;

	var new_html = build_model_summary_table();

	var existing_table = summary_element.querySelector("[id='summary_table']");

	if (!existing_table) {
		summary_element.innerHTML = new_html;
		_inject_summary_extras(summary_element);
		last_summary_model_uuid = model.uuid;
		return;
	}

	var temp = document.createElement("div");
	temp.innerHTML = new_html;
	var new_table = temp.querySelector("[id='summary_table']");

	if (!new_table) {
		summary_element.innerHTML = new_html;
		_inject_summary_extras(summary_element);
		last_summary_model_uuid = model.uuid;
		return;
	}

	$(existing_table).find("tr").stop(true, true);

	var old_tbody = existing_table.querySelector("tbody");
	if (!old_tbody) {
		summary_element.innerHTML = new_html;
		_inject_summary_extras(summary_element);
		last_summary_model_uuid = model.uuid;
		return;
	}

	var new_tbody = new_table.querySelector("tbody");
	if (!new_tbody) {
		summary_element.innerHTML = new_html;
		_inject_summary_extras(summary_element);
		last_summary_model_uuid = model.uuid;
		return;
	}

	var old_rows = Array.from(old_tbody.querySelectorAll("tr"));
	var new_rows = Array.from(new_tbody.querySelectorAll("tr"));

	var max_len = Math.max(old_rows.length, new_rows.length);

	for (var i = 0; i < max_len; i++) {
		if (i < old_rows.length && i < new_rows.length) {
			if (old_rows[i].innerHTML !== new_rows[i].innerHTML) {
				var newInner = new_rows[i].innerHTML;
				$(old_rows[i]).data("_newInner", newInner);
				$(old_rows[i]).fadeTo(80, 0.4, function() {
					this.innerHTML = $(this).data("_newInner");
					$(this).fadeTo(120, 1);
				});
			}
		} else if (i >= old_rows.length) {
			(function(newRow) {
				var clone = newRow.cloneNode(true);
				$(clone).css({ opacity: 0, maxHeight: 0, overflow: "hidden" });
				old_tbody.appendChild(clone);
				var h = clone.scrollHeight;
				$(clone).animate({ maxHeight: h + 20 }, 200, function() {
					$(this).css({ maxHeight: "", overflow: "" });
				});
				$(clone).fadeTo(200, 1);
			})(new_rows[i]);
		} else {
			(function(row) {
				$(row).animate(
					{ maxHeight: 0, opacity: 0, paddingTop: 0, paddingBottom: 0 },
					200,
					function() { $(this).remove(); }
				);
			})(old_rows[i]);
		}
	}

	_inject_summary_extras(summary_element);
	last_summary_model_uuid = model.uuid;
}

function write_model_summary_wait() {
	var redo_summary = false;

	if (model && !Object.keys(model).includes("uuid")) {
		redo_summary = true;
	}

	if (!redo_summary && model && last_summary_model_uuid != model.uuid) {
		redo_summary = true;
	}

	if (redo_summary) {
		try {
			var summary_el = document.getElementById("summary");
			if (!summary_el) return;

			var existing_table = summary_el.querySelector("[id='summary_table']");
			if (!existing_table) {
				var html_code = "<center><div class=\"spinner\"></div></center>";
				if (html_code != summary_el.innerHTML) {
					summary_el.innerHTML = html_code;
				}
			}

			invert_elements_in_dark_mode();
			write_model_summary();
		} catch (e) {
			if (Object.keys(e).includes("message")) {
				e = e.message;
			}

			if (("" + e).includes("getElementById(...) is null")) {
				wrn("[write_model_summary_wait] Did you remove the summary tab manually?");
			} else if (("" + e).includes("model is empty. Add some layers first")) {
				err("[write_model_summary_wait] " + e);
			} else {
				throw new Error(e);
			}
		}
	}
}

// ============================================================
// BUILD TABLE (with features 2, 8, 9)
// ============================================================
function build_model_summary_table() {
	if (!model) {
		console.error("build_model_summary_table: no model provided");
		return "<div style=\"color:red\">No model provided</div>";
	}

	var total_params = 0;
	var trainable_params = 0;
	var non_trainable_params = 0;

	var layer_data = [];
	var layers = [];
	try { layers = model.layers || []; } catch (e) { layers = []; }
	var max_params = 0;

	for (var li = 0; li < layers.length; li++) {
		var layer = layers[li];
		if (!layer) continue;

		var input_shape = null;
		var output_shape = null;

		try {
			input_shape = layer.inputShape || layer.inputShapes || layer.batchInputShape || null;
			if (!input_shape && layer.inboundNodes && layer.inboundNodes[0]) {
				input_shape = layer.inboundNodes[0].inputShapes || layer.inboundNodes[0].inputShape || null;
			}
		} catch (e) { input_shape = null; }

		try {
			output_shape = layer.outputShape || layer.outputShapes || null;
			if (!output_shape && layer.inboundNodes && layer.inboundNodes[0]) {
				output_shape = layer.inboundNodes[0].outputShapes || layer.inboundNodes[0].outputShape || null;
			}
		} catch (e) { output_shape = null; }

		var trainable_count = _safe_count_params(layer.trainableWeights || layer.trainable_weights || []);
		var non_trainable_count = _safe_count_params(layer.nonTrainableWeights || layer.non_trainable_weights || []);
		var params = trainable_count + non_trainable_count;
		if (!params) {
			var fallback_weights = null;
			try { fallback_weights = layer.weights || (typeof layer.getWeights === "function" ? layer.getWeights() : null) || []; } catch (e) { fallback_weights = []; }
			params = _safe_count_params(fallback_weights);
		}

		total_params += params;
		trainable_params += trainable_count;
		non_trainable_params += non_trainable_count;

		if (params > max_params) max_params = params;

		var layer_type = "";
		try { layer_type = (typeof layer.getClassName === "function" && layer.getClassName()) || (layer.constructor && layer.constructor.name) || "Layer"; } catch (e) { layer_type = "Layer"; }
		var name = layer.name || (layer_type + "_" + li);

		layer_data.push({
			name: name,
			layer_type: layer_type,
			input_shape: input_shape,
			output_shape: output_shape,
			params: params,
			trainable_count: trainable_count,
			non_trainable_count: non_trainable_count,
			layer_ref: layer
		});
	}

	// Build rows
	var rows = [];
	for (var ri = 0; ri < layer_data.length; ri++) {
		var ld = layer_data[ri];

		// Feature 2: Parameter bar
		var bar_width = max_params > 0 ? Math.round((ld.params / max_params) * 100) : 0;
		var param_bar_html = "";
		if (ld.params > 0) {
			param_bar_html = "<div class=\"param-bar-container\" style=\"" +
				"width:100%; background:" + SUMMARY_CONFIG.param_bar_bg + "; " +
				"border-radius:3px; height:" + SUMMARY_CONFIG.param_bar_height + "; " +
				"margin-top:3px; overflow:hidden;\">" +
				"<div class=\"param-bar-fill\" style=\"" +
				"width:" + bar_width + "%; height:100%; " +
				"background:" + SUMMARY_CONFIG.param_bar_color + "; " +
				"border-radius:3px; transition:width 0.3s ease;\"></div></div>";
		}

		// Feature 8: Tooltip via floating DOM element (no ugly title attr)
		var layer_name_cell = "<td class=\"summary-layer-name\" data-layer-index=\"" + ri + "\">" +
			"<span class=\"st-layer-name-text\">" + _escape_html(ld.name) + "</span> " +
			"<span class=\"st-layer-type-badge\">" + _escape_html(ld.layer_type) + "</span></td>";


		var row_html = "<tr>" +
			layer_name_cell +
			"<td>" + _escape_html(_format_shape(ld.input_shape)) + "</td>" +
			"<td>" + _escape_html(_format_shape(ld.output_shape)) + "</td>" +
			"<td style=\"min-width:100px;\">" +
				"<span class=\"param-count\">" + ld.params.toLocaleString() + "</span>" +
				param_bar_html +
			"</td>" +
			"</tr>";

		rows.push(row_html);
	}

	rows.push("<tr class=\"summary_totals\"><td colspan=\"5\">Total params: " + total_params.toLocaleString() + "</td></tr>");
	rows.push("<tr class=\"summary_totals\"><td colspan=\"5\">Trainable params: " + trainable_params.toLocaleString() + "</td></tr>");
	rows.push("<tr class=\"summary_totals\"><td colspan=\"5\">Non-trainable params: " + non_trainable_params.toLocaleString() + "</td></tr>");

	// Store globally for chart and export
	window._summary_layer_data = layer_data;
	window._summary_totals = { total: total_params, trainable: trainable_params, non_trainable: non_trainable_params };

	return "<center>" +
		"<div id=\"summary_export_bar\"></div>" +
		"<table id=\"summary_table\" class=\"st-summary-table\"><tbody>" +
		"<tr class=\"st-table-header\"><th>Layer (type)</th><th>Input Shape</th><th>Output Shape</th><th>Param Count</th></tr>" +
		rows.join("\n") +
		"</tbody></table>" +
		"<div id=\"summary_cumulative_chart\"></div>" +
		"</center>";
}

function _build_layer_tooltip_html(layer_data_entry) {
	try {
		if (!layer_data_entry) return "";
		var layer = layer_data_entry.layer_ref;
		if (!layer) return "";

		var config = null;
		if (typeof layer.getConfig === "function") {
			try { config = layer.getConfig() || {}; } catch (e) { config = {}; }
		} else if (layer.config) {
			config = layer.config;
		} else {
			config = {};
		}

		var sections = [];

		// Section 1: Layer identity with icon
		var type_icon = _get_layer_type_icon(layer_data_entry.layer_type);
		sections.push(
			"<div class='st-tip-header'>" +
			"<div class='st-tip-header-icon'>" + type_icon + "</div>" +
			"<div class='st-tip-header-text'>" +
			"<div class='st-tip-name'>" + _escape_html(layer_data_entry.name) + "</div>" +
			"<div class='st-tip-type'>" + _escape_html(layer_data_entry.layer_type) + "</div>" +
			"</div>" +
			"</div>"
		);

		// Section 2: Configuration (key-value pairs, nicely formatted)
		if (config && typeof config === "object") {
			var skip_keys = ["name", "dtype", "batch_input_shape", "batchInputShape", "trainable"];
			var highlight_keys = ["kernel_size", "kernelSize", "filters", "units", "activation",
				"padding", "strides", "pool_size", "poolSize", "rate", "momentum", "epsilon"];
			var config_items = [];
			var keys = Object.keys(config);

			for (var k = 0; k < keys.length; k++) {
				var key = keys[k];
				if (skip_keys.indexOf(key) !== -1) continue;
				var val = config[key];
				if (val === null || val === undefined) continue;
				if (typeof val === "object" && !Array.isArray(val)) {
					if (val.class_name || val.className) {
						val = val.class_name || val.className;
					} else {
						try { val = JSON.stringify(val); } catch (e2) { val = "[object]"; }
					}
				}
				if (Array.isArray(val)) val = JSON.stringify(val);

				var is_highlight = highlight_keys.indexOf(key) !== -1;
				var label = _format_config_key(key);
				config_items.push(
					"<div class='st-tip-config-row'>" +
					"<span class='st-tip-config-key" + (is_highlight ? " st-tip-highlight" : "") + "'>" +
					_escape_html(label) + "</span>" +
					"<span class='st-tip-config-val" + (is_highlight ? " st-tip-highlight-val" : "") + "'>" +
					_escape_html(String(val)) + "</span>" +
					"</div>"
				);
			}

			if (config_items.length > 0) {
				sections.push(
					"<div class='st-tip-section'>" +
					"<div class='st-tip-section-label'>" +
					"<span class='st-tip-section-icon'>⚙</span> Configuration</div>" +
					"<div class='st-tip-config-grid'>" + config_items.join("") + "</div>" +
					"</div>"
				);
			}
		}

		// Section 3: Parameters with mini visual bar
		if (layer_data_entry.params > 0) {
			var total_model_params = (window._summary_totals && window._summary_totals.total) || 1;
			var pct = Math.min(100, Math.round((layer_data_entry.params / total_model_params) * 100));
			var param_html =
				"<div class='st-tip-section'>" +
				"<div class='st-tip-section-label'>" +
				"<span class='st-tip-section-icon'>📊</span> Parameters</div>" +
				"<div class='st-tip-param-grid'>" +
				"<div class='st-tip-param-row'><span class='st-tip-param-label'>Total</span>" +
				"<span class='st-tip-param-value'>" + layer_data_entry.params.toLocaleString() + "</span></div>";

			if (layer_data_entry.trainable_count > 0) {
				param_html += "<div class='st-tip-param-row'><span class='st-tip-param-label'>Trainable</span>" +
					"<span class='st-tip-param-value'>" + layer_data_entry.trainable_count.toLocaleString() + "</span></div>";
			}
			if (layer_data_entry.non_trainable_count > 0) {
				param_html += "<div class='st-tip-param-row'><span class='st-tip-param-label'>Non-trainable</span>" +
					"<span class='st-tip-param-value'>" + layer_data_entry.non_trainable_count.toLocaleString() + "</span></div>";
			}

			// Mini percentage bar
			param_html += "<div class='st-tip-pct-bar-container'>" +
				"<div class='st-tip-pct-bar' style='width:" + pct + "%'></div>" +
				"</div>" +
				"<div class='st-tip-pct-label'>" + pct + "% of model parameters</div>";

			param_html += "</div></div>";
			sections.push(param_html);
		}

		// Section 4: Memory estimate
		if (layer_data_entry.params > 0) {
			var bytes = layer_data_entry.params * 4;
			var mem_str = _format_memory(bytes);
			var activation_mem = "";
			if (layer_data_entry.output_shape) {
				var shape_arr = Array.isArray(layer_data_entry.output_shape) ? layer_data_entry.output_shape : [];
				var act_elements = 1;
				for (var si = 1; si < shape_arr.length; si++) {
					if (shape_arr[si] != null && Number(shape_arr[si]) > 0) {
						act_elements *= Number(shape_arr[si]);
					}
				}
				if (act_elements > 1) {
					activation_mem = "<div class='st-tip-mem-row'><span class='st-tip-mem-label'>Activation/sample</span>" +
						"<span class='st-tip-mem-value'>~" + _format_memory(act_elements * 4) + "</span></div>";
				}
			}
			sections.push(
				"<div class='st-tip-section st-tip-section-memory'>" +
				"<div class='st-tip-section-label'>" +
				"<span class='st-tip-section-icon'>💾</span> Memory (float32)</div>" +
				"<div class='st-tip-mem-row'><span class='st-tip-mem-label'>Weights</span>" +
				"<span class='st-tip-mem-value'>~" + mem_str + "</span></div>" +
				activation_mem +
				"</div>"
			);
		}

		// Section 5: Shape flow
		sections.push(
			"<div class='st-tip-section st-tip-section-shapes'>" +
			"<div class='st-tip-section-label'>" +
			"<span class='st-tip-section-icon'>📐</span> Shape Flow</div>" +
			"<div class='st-tip-shape-flow'>" +
			"<span class='st-tip-shape-box'>" + _escape_html(_format_shape(layer_data_entry.input_shape)) + "</span>" +
			"<span class='st-tip-shape-arrow'>→</span>" +
			"<span class='st-tip-shape-box st-tip-shape-out'>" + _escape_html(_format_shape(layer_data_entry.output_shape)) + "</span>" +
			"</div>" +
			"</div>"
		);

		return "<div class='st-tip-content'>" + sections.join("") + "</div>";
	} catch (e) {
		return "";
	}
}

function _get_layer_type_icon(layer_type) {
	if (!layer_type) return "◆";
	var t = layer_type.toLowerCase();
	if (t.indexOf("conv") !== -1) return "▦";
	if (t.indexOf("dense") !== -1 || t.indexOf("linear") !== -1) return "◈";
	if (t.indexOf("pool") !== -1) return "▤";
	if (t.indexOf("dropout") !== -1) return "◌";
	if (t.indexOf("batch") !== -1 || t.indexOf("norm") !== -1) return "≋";
	if (t.indexOf("flatten") !== -1) return "▬";
	if (t.indexOf("input") !== -1) return "◉";
	if (t.indexOf("activation") !== -1) return "⚡";
	if (t.indexOf("lstm") !== -1 || t.indexOf("gru") !== -1 || t.indexOf("rnn") !== -1) return "↺";
	if (t.indexOf("embed") !== -1) return "❖";
	if (t.indexOf("concat") !== -1 || t.indexOf("add") !== -1 || t.indexOf("merge") !== -1) return "⊕";
	if (t.indexOf("reshape") !== -1) return "⬡";
	return "◆";
}

// ============================================================
// HELPER: Safe param counting
// ============================================================
function _safe_count_params(weights) {
	if (!weights) return 0;
	var sum = 0;
	try {
		for (var i = 0; i < weights.length; i++) {
			var w = weights[i];
			if (!w) continue;
			var shape = null;
			try { shape = w.shape || (w.tensor && w.tensor.shape) || (w.val && w.val.shape) || null; } catch (e) { shape = null; }
			if (!shape && typeof w.size === "number") { sum += w.size; continue; }
			if (Array.isArray(shape)) { sum += _product_of_dims(shape); continue; }
			if (shape && typeof shape.length !== "undefined") { sum += _product_of_dims(Array.from(shape)); continue; }
		}
	} catch (e) {
		console.warn("[_safe_count_params] Error:", e);
	}
	return sum;
}

function _product_of_dims(shape) {
	if (!Array.isArray(shape)) return 0;
	var p = 1;
	for (var i = 0; i < shape.length; i++) {
		p *= (shape[i] == null ? 1 : Number(shape[i]));
	}
	return isNaN(p) ? 0 : p;
}

// ============================================================
// HELPER: Format shape
// ============================================================
function _format_shape(shape) {
	if (shape == null) return "N/A";
	if (Array.isArray(shape)) return JSON.stringify(shape);
	try { return JSON.stringify(shape); } catch (e) { return String(shape); }
}

// ============================================================
// HELPER: Escape HTML
// ============================================================
function _escape_html(s) {
	if (s == null) return "";
	return String(s)
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;")
		.replace(/'/g, "&#39;");
}

// ============================================================
// INJECT EXTRAS (chart, export bar, tooltip styles)
// ============================================================
// ============================================================
// INJECT EXTRAS (chart, export bar, tooltip listeners)
// ============================================================
function _inject_summary_extras(container) {
	try {
		_inject_tooltip_styles();
		_build_export_bar(container);
		_attach_tooltip_listeners(container);
	} catch (e) {
		console.warn("[_inject_summary_extras] Non-critical error:", e);
	}
}

function _format_param_short(val) {
	try {
		if (val >= 1e9) return (val / 1e9).toFixed(1) + "B";
		if (val >= 1e6) return (val / 1e6).toFixed(1) + "M";
		if (val >= 1e3) return (val / 1e3).toFixed(1) + "K";
		return Math.round(val).toString();
	} catch (e) {
		return "0";
	}
}

function _escape_svg(s) {
	if (!s) return "";
	return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

// ============================================================
// Feature 10: EXPORT BAR
// ============================================================
function _build_export_bar(container) {
	try {
		var bar_el = container.querySelector("[id='summary_export_bar']");
		if (!bar_el) return;

		var btn_style = "display:inline-block; margin:4px 3px; padding:4px 10px; " +
			"font-size:11px; cursor:pointer; border:1px solid #ccc; border-radius:3px; " +
			"background:#f8f8f8; color:#333; user-select:none; transition:background 0.15s;";

		var html = "<div style=\"text-align:center; margin-bottom:6px;\">";
		html += "<span style=\"font-size:10px; color:#888; margin-right:8px;\">Export:</span>";
		html += "<span class=\"summary-export-btn\" data-format=\"clipboard\" style=\"" + btn_style + "\" title=\"Copy to clipboard\">&#128203; Clipboard</span>";
		html += "<span class=\"summary-export-btn\" data-format=\"markdown\" style=\"" + btn_style + "\" title=\"Export as Markdown\">MD</span>";
		html += "<span class=\"summary-export-btn\" data-format=\"csv\" style=\"" + btn_style + "\" title=\"Export as CSV\">CSV</span>";
		html += "<span class=\"summary-export-btn\" data-format=\"latex\" style=\"" + btn_style + "\" title=\"Export as LaTeX\">LaTeX</span>";
		html += "</div>";

		bar_el.innerHTML = html;

		// Attach event listeners
		var btns = bar_el.querySelectorAll(".summary-export-btn");
		for (var b = 0; b < btns.length; b++) {
			btns[b].addEventListener("click", function() {
				var format = this.getAttribute("data-format");
				_export_summary(format, this);
			});
			btns[b].addEventListener("mouseenter", function() { this.style.background = "#e3e3e3"; });
			btns[b].addEventListener("mouseleave", function() { this.style.background = "#f8f8f8"; });
		}
	} catch (e) {
		console.warn("[_build_export_bar] Error:", e);
	}
}

function _export_summary(format, btn_el) {
	try {
		var layer_data = window._summary_layer_data;
		var totals = window._summary_totals;
		if (!layer_data || layer_data.length === 0) {
			_flash_btn(btn_el, "No data", false);
			return;
		}

		var output = "";

		switch (format) {
			case "markdown":
				output = _export_as_markdown(layer_data, totals);
				_download_text(output, "model_summary.md", "text/markdown");
				_flash_btn(btn_el, "Done", true);
				break;
			case "csv":
				output = _export_as_csv(layer_data, totals);
				_download_text(output, "model_summary.csv", "text/csv");
				_flash_btn(btn_el, "Done", true);
				break;
			case "latex":
				output = _export_as_latex(layer_data, totals);
				_download_text(output, "model_summary.tex", "text/plain");
				_flash_btn(btn_el, "Done", true);
				break;
			case "clipboard":
				output = _export_as_markdown(layer_data, totals);
				_copy_to_clipboard(output, btn_el);
				break;
			default:
				console.warn("[_export_summary] Unknown format:", format);
		}
	} catch (e) {
		console.warn("[_export_summary] Error:", e);
		_flash_btn(btn_el, "Error", false);
	}
}

function _export_as_markdown(layer_data, totals) {
	var lines = [];
	lines.push("| Layer (type) | Input Shape | Output Shape | Param Count |");
	lines.push("|---|---|---|---|");
	for (var i = 0; i < layer_data.length; i++) {
		var ld = layer_data[i];
		lines.push("| " + (ld.name || "") + " (" + (ld.layer_type || "") + ") | " +
			_format_shape_export(ld.input_shape) + " | " +
			_format_shape_export(ld.output_shape) + " | " +
			(ld.params || 0).toLocaleString() + " |");
	}
	lines.push("");
	if (totals) {
		lines.push("**Total params:** " + (totals.total || 0).toLocaleString());
		lines.push("**Trainable params:** " + (totals.trainable || 0).toLocaleString());
		lines.push("**Non-trainable params:** " + (totals.non_trainable || 0).toLocaleString());
	}
	return lines.join("\n");
}

function _export_as_csv(layer_data, totals) {
	var lines = [];
	lines.push("Layer,Type,Input Shape,Output Shape,Params");
	for (var i = 0; i < layer_data.length; i++) {
		var ld = layer_data[i];
		lines.push("\"" + _csv_escape(ld.name || "") + "\",\"" +
			_csv_escape(ld.layer_type || "") + "\",\"" +
			_csv_escape(_format_shape_export(ld.input_shape)) + "\",\"" +
			_csv_escape(_format_shape_export(ld.output_shape)) + "\"," +
			(ld.params || 0));
	}
	lines.push("");
	if (totals) {
		lines.push("\"Total params\",,,,," + (totals.total || 0));
		lines.push("\"Trainable params\",,,,," + (totals.trainable || 0));
		lines.push("\"Non-trainable params\",,,,," + (totals.non_trainable || 0));
	}
	return lines.join("\n");
}

function _export_as_latex(layer_data, totals) {
	var lines = [];
	lines.push("\\begin{table}[h]");
	lines.push("\\centering");
	lines.push("\\caption{Model Summary}");
	lines.push("\\begin{tabular}{|l|c|c|r|}");
	lines.push("\\hline");
	lines.push("\\textbf{Layer (type)} & \\textbf{Input Shape} & \\textbf{Output Shape} & \\textbf{Param Count} \\\\");
	lines.push("\\hline");
	for (var i = 0; i < layer_data.length; i++) {
		var ld = layer_data[i];
		lines.push(_latex_escape(ld.name || "") + " (" + _latex_escape(ld.layer_type || "") + ") & " +
			_latex_escape(_format_shape_export(ld.input_shape)) + " & " +
			_latex_escape(_format_shape_export(ld.output_shape)) + " & " +
			(ld.params || 0).toLocaleString() + " \\\\");
	}
	lines.push("\\hline");
	if (totals) {
		lines.push("\\multicolumn{4}{|l|}{Total params: " + (totals.total || 0).toLocaleString() + "} \\\\");
		lines.push("\\multicolumn{4}{|l|}{Trainable params: " + (totals.trainable || 0).toLocaleString() + "} \\\\");
		lines.push("\\multicolumn{4}{|l|}{Non-trainable params: " + (totals.non_trainable || 0).toLocaleString() + "} \\\\");
	}
	lines.push("\\hline");
	lines.push("\\end{tabular}");
	lines.push("\\end{table}");
	return lines.join("\n");
}

function _format_shape_export(shape) {
	try {
		if (shape == null) return "N/A";
		if (Array.isArray(shape)) return JSON.stringify(shape);
		return String(shape);
	} catch (e) {
		return "N/A";
	}
}

function _csv_escape(s) {
	if (s == null) return "";
	return String(s).replace(/"/g, "\"\"");
}

function _latex_escape(s) {
	if (s == null) return "";
	return String(s)
		.replace(/\\/g, "\\textbackslash{}")
		.replace(/&/g, "\\&")
		.replace(/%/g, "\\%")
		.replace(/\$/g, "\\$")
		.replace(/_/g, "\\_")
		.replace(/\{/g, "\\{")
		.replace(/\}/g, "\\}")
		.replace(/~/g, "\\textasciitilde{}")
		.replace(/\^/g, "\\textasciicircum{}");
}

function _download_text(content, filename, mime_type) {
	try {
		var blob = new Blob([content], { type: mime_type || "text/plain" });
		var url = URL.createObjectURL(blob);
		var a = document.createElement("a");
		a.href = url;
		a.download = filename || "export.txt";
		a.style.display = "none";
		document.body.appendChild(a);
		a.click();
		setTimeout(function() {
			try {
				document.body.removeChild(a);
				URL.revokeObjectURL(url);
			} catch (e) { /* cleanup failed, non-critical */ }
		}, 250);
	} catch (e) {
		console.error("[_download_text] Failed to download:", e);
		// Fallback: open in new window
		try {
			var win = window.open("", "_blank");
			if (win) {
				win.document.write("<pre>" + String(content).replace(/</g, "&lt;").replace(/>/g, "&gt;") + "</pre>");
				win.document.close();
			} else {
				alert("Export failed: popup blocked. Please allow popups and try again.");
			}
		} catch (e2) {
			console.error("[_download_text] Fallback also failed:", e2);
		}
	}
}

function _copy_to_clipboard(text, btn_el) {
	try {
		if (navigator.clipboard && typeof navigator.clipboard.writeText === "function") {
			navigator.clipboard.writeText(text).then(function() {
				_flash_btn(btn_el, "Copied", true);
			}).catch(function(err) {
				console.warn("[_copy_to_clipboard] Clipboard API failed, trying fallback:", err);
				_clipboard_fallback(text, btn_el);
			});
		} else {
			_clipboard_fallback(text, btn_el);
		}
	} catch (e) {
		console.warn("[_copy_to_clipboard] Error:", e);
		_clipboard_fallback(text, btn_el);
	}
}

function _clipboard_fallback(text, btn_el) {
	try {
		var textarea = document.createElement("textarea");
		textarea.value = text;
		textarea.style.position = "fixed";
		textarea.style.left = "-9999px";
		textarea.style.top = "-9999px";
		textarea.style.opacity = "0";
		document.body.appendChild(textarea);
		textarea.focus();
		textarea.select();
		var success = false;
		try { success = document.execCommand("copy"); } catch (e) { success = false; }
		document.body.removeChild(textarea);
		if (success) {
			_flash_btn(btn_el, "Copied", true);
		} else {
			_flash_btn(btn_el, "Failed", false);
		}
	} catch (e) {
		console.error("[_clipboard_fallback] Error:", e);
		_flash_btn(btn_el, "Failed", false);
	}
}

function _flash_btn(btn_el, message, is_success) {
	if (!btn_el) return;
	try {
		var original_text = btn_el.textContent || btn_el.innerText || "";
		btn_el.textContent = message;
		btn_el.style.background = is_success ? "#c8e6c9" : "#ffcdd2";
		setTimeout(function() {
			try {
				if (btn_el) {
					btn_el.textContent = original_text;
					btn_el.style.background = "#f8f8f8";
				}
			} catch (e) { /* non-critical */ }
		}, 1500);
	} catch (e) {
		// Non-critical, ignore
	}
}

/**
 * Format a config key from snake_case/camelCase to readable form
 */
function _format_config_key(key) {
	// Convert camelCase to spaces
	var result = key.replace(/([A-Z])/g, " $1");
	// Convert snake_case to spaces
	result = result.replace(/_/g, " ");
	// Capitalize first letter
	result = result.trim();
	result = result.charAt(0).toUpperCase() + result.slice(1);
	return result;
}

/**
 * Format bytes to human-readable memory string
 */
function _format_memory(bytes) {
	if (bytes >= 1073741824) return (bytes / 1073741824).toFixed(2) + " GB";
	if (bytes >= 1048576) return (bytes / 1048576).toFixed(2) + " MB";
	if (bytes >= 1024) return (bytes / 1024).toFixed(1) + " KB";
	return bytes + " B";
}

/**
 * Global tooltip element and state management
 */
var _summary_tooltip_el = null;
var _summary_tooltip_timeout = null;
var _summary_tooltip_hide_timeout = null;

function _get_or_create_tooltip_el() {
	if (_summary_tooltip_el && document.body.contains(_summary_tooltip_el)) {
		return _summary_tooltip_el;
	}
	var el = document.createElement("div");
	el.id = "summary-floating-tooltip";
	el.className = "st-floating-tooltip";
	el.style.display = "none";
	el.style.opacity = "0";
	el.addEventListener("mouseenter", function() {
		if (_summary_tooltip_hide_timeout) {
			clearTimeout(_summary_tooltip_hide_timeout);
			_summary_tooltip_hide_timeout = null;
		}
	});
	el.addEventListener("mouseleave", function() {
		_hide_tooltip();
	});
	document.body.appendChild(el);
	_summary_tooltip_el = el;
	return el;
}

function _show_tooltip(target_el, html_content) {
	if (_summary_tooltip_hide_timeout) {
		clearTimeout(_summary_tooltip_hide_timeout);
		_summary_tooltip_hide_timeout = null;
	}

	var tooltip = _get_or_create_tooltip_el();
	tooltip.innerHTML = html_content;
	tooltip.style.display = "block";
	tooltip.style.opacity = "0";
	tooltip.style.transform = "translateY(6px)";
	tooltip.style.pointerEvents = "auto";

	// Position intelligently relative to target
	_position_tooltip(tooltip, target_el);

	// Animate in
	requestAnimationFrame(function() {
		tooltip.style.transition = "opacity 0.2s cubic-bezier(0.4,0,0.2,1), transform 0.2s cubic-bezier(0.4,0,0.2,1)";
		tooltip.style.opacity = "1";
		tooltip.style.transform = "translateY(0)";
	});
}

function _hide_tooltip() {
	if (_summary_tooltip_hide_timeout) {
		clearTimeout(_summary_tooltip_hide_timeout);
	}
	_summary_tooltip_hide_timeout = setTimeout(function() {
		var tooltip = _summary_tooltip_el;
		if (tooltip) {
			tooltip.style.opacity = "0";
			tooltip.style.transform = "translateY(6px)";
			setTimeout(function() {
				if (tooltip && tooltip.style.opacity === "0") {
					tooltip.style.display = "none";
				}
			}, 200);
		}
		_summary_tooltip_hide_timeout = null;
	}, 120);
}

/**
 * Position the tooltip intelligently, avoiding going off-screen.
 */
function _position_tooltip(tooltip, target_el) {
	var rect = target_el.getBoundingClientRect();
	var tooltip_rect = tooltip.getBoundingClientRect();
	var vw = window.innerWidth || document.documentElement.clientWidth;
	var vh = window.innerHeight || document.documentElement.clientHeight;
	var scroll_x = window.pageXOffset || document.documentElement.scrollLeft;
	var scroll_y = window.pageYOffset || document.documentElement.scrollTop;

	var gap = 8; // Gap between target and tooltip

	// Default: position below the target, aligned to left edge
	var top = rect.bottom + scroll_y + gap;
	var left = rect.left + scroll_x;

	// Check if tooltip goes off the bottom
	if (rect.bottom + tooltip_rect.height + gap > vh) {
		// Position above instead
		top = rect.top + scroll_y - tooltip_rect.height - gap;
	}

	// Check if tooltip goes off the right
	if (left + tooltip_rect.width > scroll_x + vw - 10) {
		left = scroll_x + vw - tooltip_rect.width - 10;
	}

	// Check if tooltip goes off the left
	if (left < scroll_x + 10) {
		left = scroll_x + 10;
	}

	// Check if tooltip goes off the top (after repositioning above)
	if (top < scroll_y + 10) {
		top = scroll_y + 10;
	}

	tooltip.style.position = "absolute";
	tooltip.style.top = top + "px";
	tooltip.style.left = left + "px";
}

/**
 * Attach tooltip event listeners to all layer name cells.
 * Called after table is built/updated.
 */
function _attach_tooltip_listeners(container) {
	var cells = container.querySelectorAll(".summary-layer-name[data-layer-index]");
	for (var i = 0; i < cells.length; i++) {
		(function(cell) {
			cell.removeAttribute("title");

			cell.addEventListener("mouseenter", function() {
				var idx = parseInt(this.getAttribute("data-layer-index"), 10);
				var layer_data = window._summary_layer_data;
				if (!layer_data || idx < 0 || idx >= layer_data.length) return;

				var html = _build_layer_tooltip_html(layer_data[idx]);
				if (html) {
					if (_summary_tooltip_timeout) clearTimeout(_summary_tooltip_timeout);
					var self = this;
					_summary_tooltip_timeout = setTimeout(function() {
						_show_tooltip(self, html);
					}, 200);
				}
			});

			cell.addEventListener("mouseleave", function() {
				if (_summary_tooltip_timeout) {
					clearTimeout(_summary_tooltip_timeout);
					_summary_tooltip_timeout = null;
				}
				_hide_tooltip();
			});
		})(cells[i]);
	}
}

/**
 * Inject tooltip and chart styles into the document head.
 */
function _inject_tooltip_styles() {
	if (document.getElementById("summary-tooltip-styles")) return;
	try {
		var style = document.createElement("style");
		style.id = "summary-tooltip-styles";
		style.textContent =
			/* ===== GLASSMORPHISM FLOATING TOOLTIP ===== */
			".st-floating-tooltip {" +
			"  position: absolute;" +
			"  z-index: 99999;" +
			"  background: rgba(15, 15, 35, 0.85);" +
			"  backdrop-filter: blur(16px) saturate(180%);" +
			"  -webkit-backdrop-filter: blur(16px) saturate(180%);" +
			"  border: 1px solid rgba(255, 255, 255, 0.08);" +
			"  border-radius: 16px;" +
			"  padding: 0;" +
			"  max-width: 420px;" +
			"  min-width: 260px;" +
			"  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255,255,255,0.05), inset 0 1px 0 rgba(255,255,255,0.1);" +
			"  font-family: -apple-system, BlinkMacSystemFont, 'Inter', 'Segoe UI', Roboto, sans-serif;" +
			"  font-size: 12.5px;" +
			"  line-height: 1.55;" +
			"  pointer-events: auto;" +
			"  overflow: hidden;" +
			"  transform: translateY(4px);" +
			"  transition: opacity 0.2s cubic-bezier(0.4,0,0.2,1), transform 0.2s cubic-bezier(0.4,0,0.2,1);" +
			"}" +
			".st-floating-tooltip[style*='opacity: 1'] {" +
			"  transform: translateY(0);" +
			"}" +

			/* Tooltip inner content */
			".st-tip-content {" +
			"  max-height: 450px;" +
			"  overflow-y: auto;" +
			"  scrollbar-width: thin;" +
			"  scrollbar-color: rgba(255,255,255,0.15) transparent;" +
			"}" +
			".st-tip-content::-webkit-scrollbar { width: 4px; }" +
			".st-tip-content::-webkit-scrollbar-track { background: transparent; }" +
			".st-tip-content::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.15); border-radius: 4px; }" +

			/* Header */
			".st-tip-header {" +
			"  display: flex;" +
			"  align-items: center;" +
			"  gap: 12px;" +
			"  padding: 14px 16px;" +
			"  background: linear-gradient(135deg, rgba(99, 102, 241, 0.15), rgba(139, 92, 246, 0.1));" +
			"  border-bottom: 1px solid rgba(255,255,255,0.06);" +
			"}" +
			".st-tip-header-icon {" +
			"  width: 36px;" +
			"  height: 36px;" +
			"  display: flex;" +
			"  align-items: center;" +
			"  justify-content: center;" +
			"  background: rgba(99, 102, 241, 0.2);" +
			"  border-radius: 10px;" +
			"  font-size: 16px;" +
			"  flex-shrink: 0;" +
			"}" +
			".st-tip-header-text { flex: 1; min-width: 0; }" +
			".st-tip-name {" +
			"  font-weight: 600;" +
			"  font-size: 13.5px;" +
			"  color: #f0f0ff;" +
			"  white-space: nowrap;" +
			"  overflow: hidden;" +
			"  text-overflow: ellipsis;" +
			"}" +
			".st-tip-type {" +
			"  font-size: 11px;" +
			"  color: rgba(167, 139, 250, 0.9);" +
			"  margin-top: 1px;" +
			"  font-weight: 500;" +
			"}" +

			/* Sections */
			".st-tip-section {" +
			"  padding: 12px 16px;" +
			"  border-bottom: 1px solid rgba(255,255,255,0.04);" +
			"}" +
			".st-tip-section:last-child { border-bottom: none; }" +
			".st-tip-section-label {" +
			"  font-size: 10px;" +
			"  text-transform: uppercase;" +
			"  letter-spacing: 0.8px;" +
			"  color: rgba(255,255,255,0.4);" +
			"  margin-bottom: 8px;" +
			"  font-weight: 600;" +
			"  display: flex;" +
			"  align-items: center;" +
			"  gap: 6px;" +
			"}" +
			".st-tip-section-icon { font-size: 12px; }" +

			/* Config grid */
			".st-tip-config-grid { display: flex; flex-direction: column; gap: 4px; }" +
			".st-tip-config-row {" +
			"  display: flex;" +
			"  justify-content: space-between;" +
			"  align-items: baseline;" +
			"  padding: 3px 8px;" +
			"  border-radius: 6px;" +
			"  background: rgba(255,255,255,0.02);" +
			"  transition: background 0.15s ease;" +
			"}" +
			".st-tip-config-row:hover { background: rgba(255,255,255,0.05); }" +
			".st-tip-config-key {" +
			"  color: rgba(255,255,255,0.5);" +
			"  font-size: 11.5px;" +
			"  font-family: 'SF Mono', 'JetBrains Mono', 'Fira Code', monospace;" +
			"}" +
			".st-tip-config-val {" +
			"  color: rgba(255,255,255,0.85);" +
			"  font-size: 11.5px;" +
			"  font-family: 'SF Mono', 'JetBrains Mono', 'Fira Code', monospace;" +
			"  font-weight: 500;" +
			"}" +
			".st-tip-highlight { color: rgba(129, 140, 248, 0.95) !important; }" +
			".st-tip-highlight-val { color: #c4b5fd !important; font-weight: 600; }" +

			/* Parameters */
			".st-tip-param-grid { display: flex; flex-direction: column; gap: 4px; }" +
			".st-tip-param-row {" +
			"  display: flex;" +
			"  justify-content: space-between;" +
			"  align-items: center;" +
			"}" +
			".st-tip-param-label { color: rgba(255,255,255,0.5); font-size: 11.5px; }" +
			".st-tip-param-value { color: #f0f0ff; font-weight: 600; font-size: 12px; font-family: 'SF Mono', monospace; }" +
			".st-tip-pct-bar-container {" +
			"  width: 100%;" +
			"  height: 4px;" +
			"  background: rgba(255,255,255,0.06);" +
			"  border-radius: 4px;" +
			"  margin-top: 8px;" +
			"  overflow: hidden;" +
			"}" +
			".st-tip-pct-bar {" +
			"  height: 100%;" +
			"  background: linear-gradient(90deg, #6366f1, #a78bfa);" +
			"  border-radius: 4px;" +
			"  transition: width 0.4s cubic-bezier(0.4,0,0.2,1);" +
			"}" +
			".st-tip-pct-label {" +
			"  font-size: 10px;" +
			"  color: rgba(255,255,255,0.35);" +
			"  margin-top: 4px;" +
			"  text-align: right;" +
			"}" +

			/* Memory */
			".st-tip-section-memory { background: rgba(16, 185, 129, 0.04); }" +
			".st-tip-mem-row {" +
			"  display: flex;" +
			"  justify-content: space-between;" +
			"  align-items: center;" +
			"  padding: 2px 0;" +
			"}" +
			".st-tip-mem-label { color: rgba(255,255,255,0.5); font-size: 11.5px; }" +
			".st-tip-mem-value { color: #6ee7b7; font-weight: 600; font-size: 12px; font-family: 'SF Mono', monospace; }" +

			/* Shape flow */
			".st-tip-section-shapes { background: rgba(99, 102, 241, 0.03); }" +
			".st-tip-shape-flow {" +
			"  display: flex;" +
			"  align-items: center;" +
			"  gap: 8px;" +
			"  justify-content: center;" +
			"  flex-wrap: wrap;" +
			"}" +
			".st-tip-shape-box {" +
			"  padding: 4px 10px;" +
			"  background: rgba(255,255,255,0.05);" +
			"  border: 1px solid rgba(255,255,255,0.1);" +
			"  border-radius: 8px;" +
			"  font-family: 'SF Mono', 'JetBrains Mono', monospace;" +
			"  font-size: 11px;" +
			"  color: rgba(255,255,255,0.75);" +
			"}" +
			".st-tip-shape-out {" +
			"  border-color: rgba(99, 102, 241, 0.3);" +
			"  background: rgba(99, 102, 241, 0.08);" +
			"  color: #c4b5fd;" +
			"}" +
			".st-tip-shape-arrow {" +
			"  color: rgba(167, 139, 250, 0.7);" +
			"  font-size: 14px;" +
			"  font-weight: bold;" +
			"}" +

			/* ===== TABLE STYLING ===== */
			".st-summary-table {" +
			"  border-collapse: separate;" +
			"  border-spacing: 0;" +
			"  border: 1px solid rgba(255,255,255,0.08);" +
			"  border-radius: 12px;" +
			"  overflow: hidden;" +
			"  width: auto;" +
			"  font-family: -apple-system, BlinkMacSystemFont, 'Inter', 'Segoe UI', Roboto, sans-serif;" +
			"}" +
			".st-summary-table th, .st-summary-table td {" +
			"  padding: 10px 14px;" +
			"  text-align: left;" +
			"}" +

			".st-table-header {" +
			"  background: linear-gradient(135deg, #1e1b4b, #312e81, #3730a3);" +
			"}" +


			/* Gradient table header */
			".st-table-header th {" +
			"  color: rgba(255,255,255,0.9);" +
			"  font-size: 11px;" +
			"  font-weight: 600;" +
			"  text-transform: uppercase;" +
			"  letter-spacing: 0.6px;" +
			"  border-bottom: 1px solid rgba(99, 102, 241, 0.3);" +
			"  white-space: nowrap;" +
			"}" +

			/* Table rows */
			".st-summary-table tbody tr {" +
			"  transition: background 0.2s ease, transform 0.15s ease;" +
			"}" +
			".st-summary-table tbody tr:hover {" +
			"  background: rgba(99, 102, 241, 0.06);" +
			"}" +

			".st-table-header:hover {" +
			"  background: linear-gradient(135deg, #1e1b4b, #312e81, #3730a3) !important;" +
			"}" +


			".st-summary-table tbody tr td {" +
			"  border-bottom: 1px solid rgba(255,255,255,0.04);" +
			"}" +

			/* Layer name cell */
			".summary-layer-name {" +
			"  cursor: help;" +
			"  position: relative;" +
			"  transition: color 0.15s ease;" +
			"}" +
			".summary-layer-name:hover {" +
			"  color: #a78bfa;" +
			"}" +
			".summary-layer-name:hover .st-layer-name-text {" +
			"  text-decoration: underline;" +
			"  text-decoration-color: rgba(167, 139, 250, 0.4);" +
			"  text-underline-offset: 3px;" +
			"}" +
			".st-layer-name-text {" +
			"  font-weight: 500;" +
			"  transition: text-decoration-color 0.2s ease;" +
			"}" +
			".st-layer-type-badge {" +
			"  display: inline-block;" +
			"  padding: 1px 7px;" +
			"  background: rgba(99, 102, 241, 0.12);" +
			"  border: 1px solid rgba(99, 102, 241, 0.2);" +
			"  border-radius: 20px;" +
			"  font-size: 10px;" +
			"  color: rgba(167, 139, 250, 0.85);" +
			"  font-weight: 500;" +
			"  vertical-align: middle;" +
			"  margin-left: 4px;" +
			"}" +

			/* Param bar update */
			".param-bar-container {" +
			"  display: block;" +
			"  border-radius: 4px;" +
			"  overflow: hidden;" +
			"}" +
			".param-bar-fill {" +
			"  transition: width 0.4s cubic-bezier(0.4,0,0.2,1);" +
			"}" +

			/* Summary totals row */
			".summary_totals td {" +
			"  font-size: 12px;" +
			"  padding: 8px 14px;" +
			"  background: rgba(255,255,255,0.02);" +
			"  font-weight: 500;" +
			"}" +

			/* Shape arrow */
			".shape-arrow-cell { vertical-align: middle; }" +
			".shape-arrow {" +
			"  display: inline-block;" +
			"  transition: transform 0.2s ease;" +
			"}" +
			"tr:hover .shape-arrow { transform: translateX(2px); }" +

			/* Export bar buttons */
			".summary-export-btn {" +
			"  display: inline-block;" +
			"  margin: 4px 3px;" +
			"  padding: 5px 12px;" +
			"  font-size: 11px;" +
			"  cursor: pointer;" +
			"  border: 1px solid rgba(255,255,255,0.1);" +
			"  border-radius: 8px;" +
			"  background: rgba(255,255,255,0.04);" +
			"  color: rgba(255,255,255,0.7);" +
			"  user-select: none;" +
			"  transition: all 0.2s ease;" +
			"  font-weight: 500;" +
			"}" +
			".summary-export-btn:hover {" +
			"  background: rgba(99, 102, 241, 0.15);" +
			"  border-color: rgba(99, 102, 241, 0.3);" +
			"  color: #c4b5fd;" +
			"  transform: translateY(-1px);" +
			"  box-shadow: 0 4px 12px rgba(99, 102, 241, 0.15);" +
			"}" +
			".summary-export-btn:active {" +
			"  transform: translateY(0);" +
			"  box-shadow: none;" +
			"}" +

			/* Param count styling */
			".param-count {" +
			"  font-family: 'SF Mono', 'JetBrains Mono', 'Fira Code', monospace;" +
			"  font-size: 12px;" +
			"  color: rgba(255,255,255,0.85);" +
			"  font-weight: 500;" +
			"}" +

			/* Spinner override for summary */
			"#summary .spinner {" +
			"  border-color: rgba(99, 102, 241, 0.2);" +
			"  border-top-color: #6366f1;" +
			"}" +

			/* Scrollbar for tooltip content */
			".st-tip-content::-webkit-scrollbar { width: 4px; }" +
			".st-tip-content::-webkit-scrollbar-track { background: transparent; }" +
			".st-tip-content::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.15); border-radius: 4px; }" +

			/* Bar chart styles (keep existing) */
			".st-bar-chart-container {" +
			"  width: 100%; max-width: 700px; margin: 0 auto; padding: 10px 0;" +
			"}" +
			".st-bar-row {" +
			"  display: flex; align-items: center; margin: 3px 0; font-size: 11px;" +
			"}" +
			".st-bar-label {" +
			"  width: 140px; min-width: 100px; text-align: right; padding-right: 8px;" +
			"  overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" +
			"  color: rgba(255,255,255,0.5); font-family: 'SF Mono', monospace;" +
			"}" +
			".st-bar-track {" +
			"  flex: 1; height: 18px; background: rgba(255,255,255,0.04); border-radius: 6px;" +
			"  overflow: hidden; position: relative;" +
			"}" +
			".st-bar-fill {" +
			"  height: 100%; border-radius: 6px; transition: width 0.4s ease;" +
			"  display: flex; align-items: center; justify-content: flex-end; padding-right: 4px;" +
			"  font-size: 10px; color: #fff; font-weight: 500; min-width: 0;" +
			"}" +
			".st-bar-value {" +
			"  margin-left: 8px; min-width: 60px; font-size: 11px; color: rgba(255,255,255,0.5);" +
			"  font-family: 'SF Mono', monospace;" +
			"}" +
			".st-bar-severity-red { background: linear-gradient(90deg, #ef4444, #f87171); }" +
			".st-bar-severity-amber { background: linear-gradient(90deg, #f59e0b, #fbbf24); }" +
			".st-bar-severity-indigo { background: linear-gradient(90deg, #6366f1, #818cf8); }" +
			".st-chart-title {" +
			"  text-align: center; font-size: 11px; color: rgba(255,255,255,0.4);" +
			"  margin-bottom: 8px; font-weight: 500; text-transform: uppercase; letter-spacing: 0.5px;" +
			"}" +
			".st-chart-warning {" +
			"  text-align: center; font-size: 11px; margin-top: 6px; padding: 6px 12px;" +
			"  border-radius: 8px;" +
			"}" +
			".st-chart-warning-red { background: rgba(239, 68, 68, 0.1); color: #fca5a5; border: 1px solid rgba(239,68,68,0.2); }" +
			".st-chart-warning-amber { background: rgba(245, 158, 11, 0.1); color: #fcd34d; border: 1px solid rgba(245,158,11,0.2); }" +

			/* Summary totals row */
			".summary_totals td {" +
			"  font-size: 12px;" +
			"  padding: 10px 14px;" +
			"  background: rgba(255,255,255,0.02);" +
			"  font-weight: 500;" +
			"  font-family: -apple-system, BlinkMacSystemFont, 'Inter', sans-serif;" +
			"}" +

			/* Export bar container */
			"[id='summary_export_bar'] { margin-top: 12px; margin-bottom: 8px; }" +
			"[id='summary_param_distribution_chart'] { margin-top: 14px; margin-bottom: 8px; }" +

			/* Shape arrow cell */
			".shape-arrow-cell { vertical-align: middle; }" +
			".shape-arrow {" +
			"  display: inline-block;" +
			"  color: " + SUMMARY_CONFIG.arrow_color + ";" +
			"  transition: transform 0.2s ease, color 0.2s ease;" +
			"}" +
			"tr:hover .shape-arrow { transform: translateX(3px); color: #c4b5fd; }" +

			/* Param bar container */
			".param-bar-container { display: block; border-radius: 4px; overflow: hidden; }" +
			".param-bar-fill { transition: width 0.4s cubic-bezier(0.4,0,0.2,1); }";

		document.head.appendChild(style);
	} catch (e) {
		console.warn("[_inject_tooltip_styles] Could not inject styles:", e);
	}
}

// ============================================================
// LEGACY SUPPORT: summary_to_table (unchanged from original)
// ============================================================
function summary_to_table(lines) {
	var new_array = [];

	var colspan_nr = 0;

	for (var line_idx = 0; line_idx < lines.length; line_idx++) {
		var line = lines[line_idx];

		if (line.match(/^=+$/)) {
		} else if (line.match(/\s{2,}/)) {
			var regex = new RegExp(/\s*(.*?)\s*(\[.*\])\s*(\[.*\])\s*(\d+)\s*/, "g");
			var result = regex.exec(line);
			var splitted = [];
			if(result) {
				splitted = [result[1], result[2], result[3], result[4]];
			} else {
				splitted = line?.split(/\s{2,}/)?.filter(n => n);

				if(!splitted) {
					return "<i>Error getting summary table</i>";
				}

				for (var j = 0; j < splitted.length; j++) {
					if (splitted[j].startsWith("[")) {
						splitted[j] = "<pre>" + splitted[j] + "</pre>";
					}
				}
			}

			new_array.push(splitted);
			if (splitted.length > colspan_nr) {
				colspan_nr = splitted.length;
			}
		} else if (!line.match(/^_+$/) && line) {
			new_array.push(line);
		}
	}

	var table = "<table border=1 style='border-collapse: collapse;'>\n";
	for (var arr_idx = 0; arr_idx < new_array.length; arr_idx++) {
		var d_or_h = "d";
		if (arr_idx == 0) {
			d_or_h = "h";
		}
		if (typeof(new_array[arr_idx]) == "object") {
			table += "<tr><t" + d_or_h + ">" + new_array[arr_idx].join("</t" + d_or_h + "><t" + d_or_h + ">") + "</t" + d_or_h + "></tr>\n";
		} else {
			table += "<tr><td colspan=" + colspan_nr + ">" + new_array[arr_idx] + "</td></tr>\n";
		}
	}

	table += "</table>\n";

	return "<center>" + table + "</center>";
}

