"use strict";

function collapse_into_segments(layer_to_group) {
	var result = [];
	if (layer_to_group.length === 0) return result;
	var last = layer_to_group[0];
	var group_list = [];
	for (var i = 0; i < layer_to_group.length; i++) {
		var cur = layer_to_group[i];
		if (cur !== last) {
			var obj = {};
			obj[last] = group_list;
			result.push(obj);
			group_list = [];
			last = cur;
		}
		group_list.push(i);
	}
	var obj = {};
	obj[last] = group_list;
	result.push(obj);
	return result;
}

function group_layers(layers) {
	if (!Array.isArray(layers)) throw new Error("group_layers parameter is not an Array, but " + typeof(layers));
	var str = layers.join(";");
	var starts = build_layer_start_positions(str, layers);
	var layer_to_group = new Array(layers.length);
	for (var i = 0; i < layer_to_group.length; i++) layer_to_group[i] = null;

	var layer_names = Object.keys(layer_options);
	var list_activation_layers = [];
	for (var idx = 0; idx < layer_names.length; idx++) {
		var cat = layer_options[layer_names[idx]]["category"];
		if (cat == "Activation") list_activation_layers.push(layer_names[idx]);
	}

	var batch_or_layer_normalization = "((?:(?:batch|layer)Normalization;?)+)";
	var feature_extraction_base = "(?:(?:depthwise|separable)?conv.d(?:transpose)?;?)+;?(?:(?:batch|layer)Normalization;)*;?(?:[^;]+Pooling.d;?)*";
	var descs = get_group_layers_groups(list_activation_layers, batch_or_layer_normalization, feature_extraction_base);

	fill_layer_groups_from_matches(str, starts, descs, layer_to_group);
	return collapse_into_segments(layer_to_group);
}

async function write_descriptions(force = 0) {
	if (disable_show_python_and_create_model) {
		fade_out_removed([]);
		return;
	}

	if (is_hidden_or_has_hidden_parent($("#layers_container"))) {
		$(".descriptions_of_layers").hide();
		return;
	}

	const current_hash = await get_model_config_hash() + "_" + $(window).width();
	if (!force && last_drawn_descriptions === current_hash) {
		return;
	}

	const groups = group_layers(get_layer_type_array());
	if (!groups || !groups.length) {
		fade_out_removed([]);
		return;
	}

	const layer = $(".layer");
	if (!layer.length) {
		fade_out_removed([]);
		return;
	}

	const new_layout = compute_description_layout(groups, layer);
	if (!new_layout || !new_layout.length) {
		fade_out_removed([]);
		return;
	}

	morph_boxes(new_layout);
	last_drawn_descriptions = current_hash;

	await update_translations();
}

function morph_boxes(new_layout) {
	const existing = {};
	$(".descriptions_of_layers").each(function () {
		existing[$(this).data("key")] = $(this);
	});

	const used_keys = new Set();

	for (const box of new_layout) {
		const key = box.label;
		used_keys.add(key);

		if (existing[key]) {
			morph_update(existing[key], box);
		} else {
			morph_create(box);
		}
	}

	fade_out_removed(used_keys);
}

function compute_description_layout(groups, layer) {
	const right_offset = get_layer_right_offset(layer);
	const markers_start = $(".layer_start_marker");
	const markers_end = $(".layer_end_marker");

	const layout = [];
	const seen = Object.create(null);

	for (let g of groups) {
		const raw_key = Object.keys(g)[0];
		if (!raw_key || raw_key === "null" || raw_key === "undefined") continue;

		// make key unique
		let key = raw_key;
		if (seen[key] != null) {
			seen[key] += 1;
			key = `${raw_key}__${seen[key]}`;
		} else {
			seen[key] = 0;
		}

		const rows = g[raw_key];
		const first = $(layer[rows[0]]);
		const last  = $(layer[Math.max(0, rows[rows.length - 1] - 1)]);
		if (!first.length || !last.length) continue;

		const first_idx = Math.min(...rows);
		const start_marker = $(markers_start[first_idx]);
		if (!start_marker.length) continue;

		const first_start = parse_int(start_marker.offset().top - 6.5);
		const last_end    = parse_int($(markers_end[rows[rows.length - 1]]).offset().top);
		const first_top   = parse_int(first.position().top);
		if (!Number.isFinite(first_start) ||
			!Number.isFinite(last_end) ||
			!Number.isFinite(first_top)) {
			continue;
		}

		layout.push({
			label: key,
			top: first_top,
			left: right_offset,
			height: last_end - first_start - 13
		});
	}

	return layout;
}

function morph_update(elem, box) {
	elem.css({
		top: box.top + "px",
		left: box.left + "px",
		height: box.height + "px"
	});
}

function fade_out_removed(allowed_keys) {
	$(".descriptions_of_layers").each(function () {
		const key = $(this).data("key");
		if (!allowed_keys.includes(key)) {
			const el = $(this);
			el.css({
				opacity: 0,
				transform: "scaleY(0.85)"
			});
			setTimeout(() => el.remove(), 220);
		}
	});
}

function morph_create(box) {
	const div = $(`
	<div class="descriptions_of_layers"
	     data-key="${box.label}"
	     style="
		 position: absolute;
		 top: ${box.top}px;
		 left: ${box.left}px;
		 height: ${box.height}px;
		 opacity: 0;
		 transform: scaleY(0.85);
	     ">
	    ${box.label}
	</div>
    `);

	div.appendTo("#maindiv");

	requestAnimationFrame(() => {
		requestAnimationFrame(() => {
			div.css({
				opacity: 1,
				transform: "scaleY(1)"
			});
		});
	});
}

function get_layer_right_offset(layer) {
	const current_time = Date.now();

	if(last_get_layer_right_offset_value != "" || Math.abs(last_get_layer_right_offset_time - current_time) > 300) {
		const $layer_zero = $(layer[0]);
		last_get_layer_right_offset_value = parse_int($layer_zero.offset().left + $layer_zero.width() + 26);
		last_get_layer_right_offset_time = current_time;
	}

	return last_get_layer_right_offset_value;
}

function fill_layer_groups_from_matches(str, starts, descs, layer_to_group) {
	for (var d = 0; d < descs.length; d++) {
		var desc = descs[d];
		var re = RegExp(desc.re, "ig");
		var m;
		while ((m = re.exec(str)) !== null) {
			var captured = m[1] || m[0];
			var start_char = m.index;
			var end_char = m.index + captured.length - 1;
			var start_layer = find_layer_index_by_char_pos(starts, start_char);
			var end_layer = find_layer_index_by_char_pos(starts, end_char);
			for (var li = start_layer; li <= end_layer; li++) {
				layer_to_group[li] = desc.name;
			}
		}
	}
}

function find_layer_index_by_char_pos(starts, pos) {
	var lo = 0, hi = starts.length - 1;
	while (lo <= hi) {
		var mid = (lo + hi) >> 1;
		var start = starts[mid];
		var next_start = mid + 1 < starts.length ? starts[mid + 1] : Infinity;
		if (pos < start) {
			hi = mid - 1;
		} else if (pos >= next_start) {
			lo = mid + 1;
		} else {
			return mid;
		}
	}
	return Math.max(0, Math.min(starts.length - 1, lo));
}

function build_layer_start_positions(str, layers) {
	var starts = new Array(layers.length);
	var pos = 0;
	for (var i = 0; i < layers.length; i++) {
		starts[i] = pos;
		try {
			const layers_i = layers[i];
			if(layers_i) {
				pos += layers_i?.length === null ? 1 : layers_i?.length + 1;
			}
		} catch(e) {
			wrn(`build_layer_start_positions: ${e}`);
		}
	}
	return starts;
}

function get_group_layers_groups (list_activation_layers, batch_or_layer_normalization, feature_extraction_base) {
	if(!Array.isArray(list_activation_layers)) {
		err(`[get_group_layers_groups] list_activation_layers was not an array, but ${typeof list_activation_layers}`);
		return;
	}

	return [
		{
			"re": "((?:upSampling2d;?)+)",
			"name": "<span class='TRANSLATEME_scaling_up'></span>"
		},
		{
			"re": "((?:lstm;)+)",
			"name": "LSTM"
		},
		{
			"re": "((?:[^;]+Pooling[0-9]D;?)+;?)",
			"name": "<span class='TRANSLATEME_dimensionality_reduction'></span>"
		},
		{
			"re": "((?:" + list_activation_layers.join("|") + ")+)",
			"name": "<span class='TRANSLATEME_shy_activation_function'></span>"
		},
		{
			"re": "((?:dropout;?)+)",
			"name": "<span class='TRANSLATEME_shy_overfitting_prevention'></span>"
		},
		{
			"re": batch_or_layer_normalization,
			"name": "<span class='TRANSLATEME_rescale_and_recenter'></span>"
		},
		{
			"re": "(" + batch_or_layer_normalization + "*(?:" + feature_extraction_base + "))",
			"name": "<span class='TRANSLATEME_feature_extraction'></span>"
		},
		{
			"re": "(" + batch_or_layer_normalization + "*(?:(?:" + feature_extraction_base + ";?)*(?:dropout?;);?))",
			"name": "<span class='TRANSLATEME_feature_extraction_and_overfitting_prevention'></span>"
		},
		{
			"re": "((?:dense;?)+;?(?:dropout)?(?:dense;?)*)",
			"name": "<span class='TRANSLATEME_classification'></span>"
		},
		{
			"re": "((?:flatten;?)+;?)",
			"name": "<span class='TRANSLATEME_flatten'></span>"
		},
		{
			"re": "((?:reshape;?)+;?)",
			"name": "<span class='TRANSLATEME_change_shape'></span>"
		},
		{
			"re": "((?:(?:gaussian[^;]|alphaDropout)+;?)+;?)",
			"name": "<span class='TRANSLATEME_simulate_real_data'></span>"
		},
		{
			"re": "(DebugLayer)+",
			"name": "Debugger"
		}
	]
}

function get_layer_type_array () {
	var r = [];

	for (var layer_idx = 0; layer_idx < get_number_of_layers(); layer_idx++) {
		r.push($($(".layer_type")[layer_idx]).val());
	}

	return r;
}
