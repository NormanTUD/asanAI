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

		// Feature 8: Tooltip
		var tooltip_content = _build_layer_tooltip(ld.layer_ref);
		var tooltip_attr = tooltip_content ? (" title=\"" + tooltip_content + "\"") : "";
		var cursor_style = tooltip_content ? "cursor:help;" : "cursor:default;";
		var layer_name_cell = "<td class=\"summary-layer-name\"" + tooltip_attr + " style=\"" + cursor_style + "\">" +
			_escape_html(ld.name) + " <span style=\"opacity:0.7;\">(" + _escape_html(ld.layer_type) + ")</span></td>";

		// Feature 9: Shape flow arrow
		var arrow_html = _shape_flow_arrow(ld.input_shape, ld.output_shape);

		var row_html = "<tr>" +
			layer_name_cell +
			"<td>" + _escape_html(_format_shape(ld.input_shape)) + "</td>" +
			"<td class=\"shape-arrow-cell\" style=\"text-align:center; padding:0 4px;\">" + arrow_html + "</td>" +
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
		"<table id=\"summary_table\" border=\"1\" style=\"border-collapse:collapse;\"><tbody>" +
		"<tr><th>Layer (type)</th><th>Input Shape</th><th></th><th>Output Shape</th><th>Param Count</th></tr>" +
		rows.join("\n") +
		"</tbody></table>" +
		"<div id=\"summary_cumulative_chart\"></div>" +
		"</center>";
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
// Feature 9: Shape flow arrow
// ============================================================
function _shape_flow_arrow(input_shape, output_shape) {
	try {
		if (!input_shape || !output_shape) {
			return "<span class=\"shape-arrow\" style=\"color:" + SUMMARY_CONFIG.arrow_color + "\">&rarr;</span>";
		}

		var in_dims = Array.isArray(input_shape) ? input_shape : [];
		var out_dims = Array.isArray(output_shape) ? output_shape : [];

		var annotations = [];
		if (in_dims.length === out_dims.length && in_dims.length > 0) {
			for (var d = 1; d < in_dims.length; d++) {
				var i_val = in_dims[d];
				var o_val = out_dims[d];
				if (i_val != null && o_val != null && Number(i_val) > 0 && Number(o_val) > 0) {
					var ratio = Number(i_val) / Number(o_val);
					if (Math.abs(ratio - 2) < 0.01) { annotations.push("&darr;2&times;"); }
					else if (Math.abs(ratio - 4) < 0.01) { annotations.push("&darr;4&times;"); }
					else if (Math.abs(ratio - 0.5) < 0.01) { annotations.push("&uarr;2&times;"); }
					else if (Math.abs(ratio - 0.25) < 0.01) { annotations.push("&uarr;4&times;"); }
					else if (Number(o_val) > Number(i_val)) { annotations.push("&uarr;"); }
					else if (Number(o_val) < Number(i_val)) { annotations.push("&darr;"); }
				}
			}
		}

		var arrow_text = annotations.length > 0 ? annotations.join(" ") : "&rarr;";
		return "<span class=\"shape-arrow\" title=\"Dimension change\" style=\"color:" + SUMMARY_CONFIG.arrow_color + "; font-weight:bold; font-size:0.85em;\">" + arrow_text + "</span>";
	} catch (e) {
		return "<span class=\"shape-arrow\" style=\"color:" + SUMMARY_CONFIG.arrow_color + "\">&rarr;</span>";
	}
}

// ============================================================
// Feature 8: Build tooltip content from layer config
// ============================================================
function _build_layer_tooltip(layer) {
	try {
		if (!layer) return "";
		var config = null;
		if (typeof layer.getConfig === "function") {
			try { config = layer.getConfig() || {}; } catch (e) { config = {}; }
		} else if (layer.config) {
			config = layer.config;
		} else {
			return "";
		}

		if (!config || typeof config !== "object") return "";

		var skip_keys = ["name", "dtype", "batch_input_shape", "batchInputShape"];
		var entries = [];
		var keys = Object.keys(config);
		for (var k = 0; k < keys.length; k++) {
			var key = keys[k];
			if (skip_keys.indexOf(key) !== -1) continue;
			var val = config[key];
			if (val === null || val === undefined) continue;
			if (typeof val === "object" && !Array.isArray(val)) {
				try { val = JSON.stringify(val); } catch (e2) { val = "[object]"; }
			}
			if (Array.isArray(val)) {
				val = JSON.stringify(val);
			}
			entries.push(_escape_html(key) + ": " + _escape_html(String(val)));
		}

		if (entries.length === 0) return "";
		// Use &#10; for newlines in title attribute
		return entries.join("&#10;");
	} catch (e) {
		return "";
	}
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

// ============================================================
// Feature 8: TOOLTIP STYLES INJECTION
// ============================================================
// ============================================================
// Feature 8: FLOATING DOM TOOLTIP SYSTEM (replaces title attr)
// ============================================================

/**
 * Build rich tooltip HTML content for a layer.
 * Returns an HTML string (not plain text) with config details,
 * parameter counts, and memory estimates.
 */
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

		// Section 1: Layer identity
		sections.push(
			"<div class='st-tooltip-section st-tooltip-header'>" +
			"<strong>" + _escape_html(layer_data_entry.name) + "</strong>" +
			" <span class='st-tooltip-type'>(" + _escape_html(layer_data_entry.layer_type) + ")</span>" +
			"</div>"
		);

		// Section 2: Configuration details
		if (config && typeof config === "object") {
			var skip_keys = ["name", "dtype", "batch_input_shape", "batchInputShape", "trainable"];
			var highlight_keys = ["kernel_size", "kernelSize", "filters", "units", "activation",
				"padding", "strides", "pool_size", "poolSize", "rate", "momentum", "epsilon"];
			var config_lines = [];
			var keys = Object.keys(config);

			for (var k = 0; k < keys.length; k++) {
				var key = keys[k];
				if (skip_keys.indexOf(key) !== -1) continue;
				var val = config[key];
				if (val === null || val === undefined) continue;
				if (typeof val === "object" && !Array.isArray(val)) {
					// Check for nested activation config
					if (val.class_name || val.className) {
						val = val.class_name || val.className;
					} else {
						try { val = JSON.stringify(val); } catch (e2) { val = "[object]"; }
					}
				}
				if (Array.isArray(val)) {
					val = JSON.stringify(val);
				}

				var is_highlight = highlight_keys.indexOf(key) !== -1;
				var label = _format_config_key(key);
				config_lines.push(
					"<span class='" + (is_highlight ? "st-tooltip-key-highlight" : "st-tooltip-key") + "'>" +
					_escape_html(label) + ":</span> " +
					"<span class='st-tooltip-val'>" + _escape_html(String(val)) + "</span>"
				);
			}

			if (config_lines.length > 0) {
				sections.push(
					"<div class='st-tooltip-section st-tooltip-config'>" +
					"<div class='st-tooltip-section-title'>Configuration</div>" +
					config_lines.join("<br>") +
					"</div>"
				);
			}
		}

		// Section 3: Parameter counts
		var param_lines = [];
		param_lines.push("Total: <strong>" + (layer_data_entry.params || 0).toLocaleString() + "</strong>");
		if (layer_data_entry.trainable_count > 0) {
			param_lines.push("Trainable: " + layer_data_entry.trainable_count.toLocaleString());
		}
		if (layer_data_entry.non_trainable_count > 0) {
			param_lines.push("Non-trainable: " + layer_data_entry.non_trainable_count.toLocaleString());
		}
		sections.push(
			"<div class='st-tooltip-section st-tooltip-params'>" +
			"<div class='st-tooltip-section-title'>Parameters</div>" +
			param_lines.join("<br>") +
			"</div>"
		);

		// Section 4: Memory estimate (assuming float32 = 4 bytes per param)
		if (layer_data_entry.params > 0) {
			var bytes = layer_data_entry.params * 4;
			var mem_str = _format_memory(bytes);
			// Also estimate activation memory if output shape is available
			var activation_mem = "";
			if (layer_data_entry.output_shape) {
				var out_elements = _product_of_dims(
					Array.isArray(layer_data_entry.output_shape) ? layer_data_entry.output_shape : []
				);
				if (out_elements > 0) {
					// Exclude batch dim (first element often null)
					var shape_arr = Array.isArray(layer_data_entry.output_shape) ? layer_data_entry.output_shape : [];
					var act_elements = 1;
					for (var si = 1; si < shape_arr.length; si++) {
						if (shape_arr[si] != null && Number(shape_arr[si]) > 0) {
							act_elements *= Number(shape_arr[si]);
						}
					}
					if (act_elements > 1) {
						activation_mem = "<br>Activation (per sample): ~" + _format_memory(act_elements * 4);
					}
				}
			}
			sections.push(
				"<div class='st-tooltip-section st-tooltip-memory'>" +
				"<div class='st-tooltip-section-title'>Memory (float32)</div>" +
				"Weights: ~" + mem_str +
				activation_mem +
				"</div>"
			);
		}

		// Section 5: Shapes
		sections.push(
			"<div class='st-tooltip-section st-tooltip-shapes'>" +
			"<div class='st-tooltip-section-title'>Shapes</div>" +
			"In: " + _escape_html(_format_shape(layer_data_entry.input_shape)) +
			"<br>Out: " + _escape_html(_format_shape(layer_data_entry.output_shape)) +
			"</div>"
		);

		return "<div class='st-tooltip-inner'>" + sections.join("") + "</div>";
	} catch (e) {
		return "";
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
	el.addEventListener("mouseenter", function() {
		// Keep tooltip visible when hovering over it
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
	tooltip.style.pointerEvents = "auto";

	// Position intelligently relative to target
	_position_tooltip(tooltip, target_el);

	// Fade in
	tooltip.style.transition = "opacity 0.15s ease";
	tooltip.style.opacity = "1";
}

function _hide_tooltip() {
	if (_summary_tooltip_hide_timeout) {
		clearTimeout(_summary_tooltip_hide_timeout);
	}
	_summary_tooltip_hide_timeout = setTimeout(function() {
		var tooltip = _summary_tooltip_el;
		if (tooltip) {
			tooltip.style.opacity = "0";
			setTimeout(function() {
				if (tooltip) tooltip.style.display = "none";
			}, 150);
		}
		_summary_tooltip_hide_timeout = null;
	}, 100); // Small delay to allow moving to tooltip
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
			// Remove any native title to prevent double tooltip
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
					}, 200); // Small delay to avoid flicker
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
			/* Floating tooltip container */
			".st-floating-tooltip {" +
			"  position: absolute;" +
			"  z-index: 99999;" +
			"  background: #1a1a2e;" +
			"  color: #e0e0e0;" +
			"  border: 1px solid #333;" +
			"  border-radius: 8px;" +
			"  padding: 0;" +
			"  max-width: 380px;" +
			"  min-width: 220px;" +
			"  box-shadow: 0 4px 20px rgba(0,0,0,0.4), 0 0 1px rgba(255,255,255,0.1);" +
			"  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;" +
			"  font-size: 12px;" +
			"  line-height: 1.5;" +
			"  pointer-events: auto;" +
			"  overflow: hidden;" +
			"}" +
			".st-tooltip-inner {" +
			"  max-height: 400px;" +
			"  overflow-y: auto;" +
			"}" +
			".st-tooltip-section {" +
			"  padding: 8px 12px;" +
			"  border-bottom: 1px solid #2a2a3e;" +
			"}" +
			".st-tooltip-section:last-child { border-bottom: none; }" +
			".st-tooltip-header {" +
			"  background: #16213e;" +
			"  padding: 10px 12px;" +
			"  font-size: 13px;" +
			"}" +
			".st-tooltip-type { color: #8888aa; font-weight: normal; }" +
			".st-tooltip-section-title {" +
			"  font-size: 10px;" +
			"  text-transform: uppercase;" +
			"  letter-spacing: 0.5px;" +
			"  color: #6c7a89;" +
			"  margin-bottom: 4px;" +
			"  font-weight: 600;" +
			"}" +
			".st-tooltip-key-highlight { color: #64b5f6; font-weight: 500; }" +
			".st-tooltip-key { color: #90a4ae; }" +
			".st-tooltip-val { color: #e0e0e0; }" +
			".st-tooltip-config { font-family: 'SF Mono', 'Fira Code', monospace; font-size: 11px; }" +
			".st-tooltip-params { background: #1a2332; }" +
			".st-tooltip-memory { background: #1a2332; color: #a5d6a7; font-size: 11px; }" +
			".st-tooltip-shapes { font-family: monospace; font-size: 11px; color: #b0bec5; }" +

			/* Layer name cell styling */
			".summary-layer-name { cursor: help; position: relative; }" +

			/* Bar chart styles */
			".param-bar-container { display: block; }" +
			".shape-arrow-cell { vertical-align: middle; }" +
			"[id='summary_param_distribution_chart'] { margin-top: 14px; margin-bottom: 8px; }" +
			"[id='summary_export_bar'] { margin-top: 8px; margin-bottom: 4px; }" +

			/* Per-layer bar chart */
			".st-bar-chart-container {" +
			"  width: 100%; max-width: 700px; margin: 0 auto; padding: 10px 0;" +
			"}" +
			".st-bar-row {" +
			"  display: flex; align-items: center; margin: 3px 0; font-size: 11px;" +
			"}" +
			".st-bar-label {" +
			"  width: 140px; min-width: 100px; text-align: right; padding-right: 8px;" +
			"  overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" +
			"  color: #555; font-family: monospace;" +
			"}" +
			".st-bar-track {" +
			"  flex: 1; height: 18px; background: #f0f0f0; border-radius: 3px;" +
			"  overflow: hidden; position: relative;" +
			"}" +
			".st-bar-fill {" +
			"  height: 100%; border-radius: 3px; transition: width 0.4s ease;" +
			"  display: flex; align-items: center; justify-content: flex-end; padding-right: 4px;" +
			"  font-size: 10px; color: #fff; font-weight: 500; min-width: 0;" +
			"}" +
			".st-bar-value {" +
			"  margin-left: 8px; min-width: 60px; font-size: 11px; color: #666;" +
			"  font-family: monospace;" +
			"}" +
			".st-bar-severity-red { background: #e53935; }" +
			".st-bar-severity-amber { background: #fb8c00; }" +
			".st-bar-severity-indigo { background: #5c6bc0; }" +
			".st-chart-title {" +
			"  text-align: center; font-size: 11px; color: #888;" +
			"  margin-bottom: 8px; font-weight: 500;" +
			"}" +
			".st-chart-warning {" +
			"  text-align: center; font-size: 11px; margin-top: 6px; padding: 4px 8px;" +
			"  border-radius: 4px;" +
			"}" +
			".st-chart-warning-red { background: #ffebee; color: #c62828; }" +
			".st-chart-warning-amber { background: #fff3e0; color: #e65100; }";

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

