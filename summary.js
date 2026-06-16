"use strict";

function reset_summary() {
	// Don't nuke the HTML — just mark that we need a refresh
	// The next write_model_summary() call will handle the transition
	last_summary_model_uuid = null;
}

function write_model_summary() {
	if (is_hidden_or_has_hidden_parent($("#summary_tab"))) {
		return;
	}

	// Always show the container (it may have been hidden)
	$("#summarycontainer").show();

	assert(typeof(model) == "object", "model is not an object");

	var summary_element = document.getElementById("summary");
	if (!summary_element) return;

	var new_html = build_model_summary_table();

	var existing_table = summary_element.querySelector("#summary_table");

	// No existing table — just set innerHTML directly
	if (!existing_table) {
		summary_element.innerHTML = new_html;
		last_summary_model_uuid = model.uuid;
		return;
	}

	// Parse new HTML
	var temp = document.createElement("div");
	temp.innerHTML = new_html;
	var new_table = temp.querySelector("#summary_table");

	if (!new_table) {
		summary_element.innerHTML = new_html;
		last_summary_model_uuid = model.uuid;
		return;
	}

	// Stop any in-progress animations
	$(existing_table).find("tr").stop(true, true);

	var old_tbody = existing_table.querySelector("tbody");
	if (!old_tbody) {
		summary_element.innerHTML = new_html;
		last_summary_model_uuid = model.uuid;
		return;
	}

	var new_tbody = new_table.querySelector("tbody");
	if (!new_tbody) {
		summary_element.innerHTML = new_html;
		last_summary_model_uuid = model.uuid;
		return;
	}

	var old_rows = Array.from(old_tbody.querySelectorAll("tr"));
	var new_rows = Array.from(new_tbody.querySelectorAll("tr"));

	var max_len = Math.max(old_rows.length, new_rows.length);

	for (var i = 0; i < max_len; i++) {
		if (i < old_rows.length && i < new_rows.length) {
			// Both exist — update in place if different
			if (old_rows[i].innerHTML !== new_rows[i].innerHTML) {
				var newInner = new_rows[i].innerHTML;
				$(old_rows[i]).data("_newInner", newInner);
				$(old_rows[i]).fadeTo(80, 0.4, function() {
					this.innerHTML = $(this).data("_newInner");
					$(this).fadeTo(120, 1);
				});
			}
		} else if (i >= old_rows.length) {
			// New row — slide in
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
			// Row removed — slide out
			(function(row) {
				$(row).animate(
					{ maxHeight: 0, opacity: 0, paddingTop: 0, paddingBottom: 0 },
					200,
					function() { $(this).remove(); }
				);
			})(old_rows[i]);
		}
	}

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

			// NEVER replace with spinner if table exists
			var existing_table = summary_el.querySelector("#summary_table");
			if (!existing_table) {
				var html_code = '<center><div class="spinner"></div></center>';
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

function build_model_summary_table() {
	if (!model) {
		console.error('build_model_summary_table: no model provided');
		return '<div style="color:red">No model provided</div>';
	}

	function format_shape(shape) {
		if (shape == null) return 'N/A';
		if (Array.isArray(shape)) return JSON.stringify(shape);
		try { return JSON.stringify(shape); } catch (e) { return String(shape); }
	}

	function product_of_dims(shape) {
		if (!Array.isArray(shape)) return 0;
		let p = 1;
		for (let i = 0; i < shape.length; ++i) p *= (shape[i] == null ? 1 : Number(shape[i]));
		return p;
	}

	function count_params_from_weights(weights) {
		if (!weights) return 0;
		let sum = 0;
		for (let i = 0; i < weights.length; ++i) {
			let w = weights[i];
			if (!w) continue;
			let shape = w.shape || (w.tensor && w.tensor.shape) || (w.val && w.val.shape);
			if (!shape && typeof w.size === 'number') { sum += w.size; continue; }
			if (Array.isArray(shape)) { sum += product_of_dims(shape); continue; }
			try { if (w && w.shape) { sum += product_of_dims(w.shape); continue; } } catch (e) {}
		}
		return sum;
	}

	function escape_html(s) {
		if (s == null) return '';
		return String(s).replace(/[&<>"']/g, function (m) { return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]; });
	}

	let total_params = 0;
	let trainable_params = 0;
	let non_trainable_params = 0;

	let rows = [];

	let layers = model?.layers || [];
	for (let li = 0; li < layers.length; ++li) {
		let layer = layers[li];
		if (!layer) continue;

		let input_shape = layer.inputShape || layer.inputShapes || layer.batchInputShape || (layer.inboundNodes && layer.inboundNodes[0] && (layer.inboundNodes[0].inputShapes || layer.inboundNodes[0].inputShape)) || null;
		let output_shape = layer.outputShape || layer.outputShapes || (layer.inboundNodes && layer.inboundNodes[0] && (layer.inboundNodes[0].outputShapes || layer.inboundNodes[0].outputShape)) || null;

		let trainable_count = count_params_from_weights(layer.trainableWeights || layer.trainable_weights || []);
		let non_trainable_count = count_params_from_weights(layer.nonTrainableWeights || layer.non_trainable_weights || []);
		let params = trainable_count + non_trainable_count;
		if (!params) params = count_params_from_weights(layer.weights || (typeof layer.getWeights === 'function' && layer.getWeights()) || []);

		total_params += params;
		trainable_params += trainable_count;
		non_trainable_params += non_trainable_count;

		let layer_type = (typeof layer.getClassName === 'function' && layer.getClassName()) || (layer.constructor && layer.constructor.name) || 'Layer';
		let name = layer.name || (layer_type + '_' + li);

		rows.push('<tr><td>' + escape_html(name) + ' (' + escape_html(layer_type) + ')</td><td>' + escape_html(format_shape(input_shape)) + '</td><td>' + escape_html(format_shape(output_shape)) + '</td><td>' + params + '</td></tr>');
	}

	rows.push('<tr class="summary_totals"><td colspan="4">Total params: ' + total_params + '</td></tr>');
	rows.push('<tr class="summary_totals"><td colspan="4">Trainable params: ' + trainable_params + '</td></tr>');
	rows.push('<tr class="summary_totals"><td colspan="4">Non-trainable params: ' + non_trainable_params + '</td></tr>');

	// Only return the table itself, not the outer wrapper divs
	return '<center>' +
		'<table id="summary_table" border="1"><tbody>' +
		'<tr><th>Layer (type)</th><th>Input Shape</th><th>Output Shape</th><th>Param #</th></tr>' +
		rows.join('\n') +
		'</tbody></table></center>';
}

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
