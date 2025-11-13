"use strict";

function is_math_tab_visible() {
	var el = document.querySelector('#math_tab_code').parentElement
	if (!el) return false
	var style = window.getComputedStyle(el)
	var rect = el.getBoundingClientRect()
	return (
		rect.width > 0 &&
		rect.height > 0 &&
		rect.bottom > 0 &&
		rect.right > 0 &&
		style.visibility !== 'hidden' &&
		style.display !== 'none'
	)
}

function ensure_math_tab_visibility_watch() {
	var el = document.querySelector('#math_tab_code')
	if (!el) return

	if (!_write_latex_visibility_observer) {
		_write_latex_visibility_observer = new IntersectionObserver(function(entries) {
			if (entries.some(function(e) { return e.isIntersecting })) {
				run_pending_latex_write()
			}
		})
		_write_latex_visibility_observer.observe(el)
	}

	if (!_write_latex_poll_timer) {
		_write_latex_poll_timer = setInterval(function() {
			if (is_math_tab_visible()) run_pending_latex_write()
		}, 500)
	}
}

function run_pending_latex_write() {
	if (_write_latex_running) return
	if (!_write_latex_pending_args) return
	if (!is_math_tab_visible()) return
	_write_latex_running = true

	var args = _write_latex_pending_args
	_write_latex_pending_args = null

	Promise.resolve(_write_model_to_latex_to_page_internal.apply(null, args))
		.catch(function(e) {
			console.error('Latex write error:', e)
		})
		.finally(function() {
			_write_latex_running = false
		})
}

async function write_model_to_latex_to_page() {
	_write_latex_pending_args = arguments

	if (is_math_tab_visible()) {
		run_pending_latex_write()
	} else {
		ensure_math_tab_visibility_watch()
	}
}

async function _write_model_to_latex_to_page_internal (reset_prev_layer_data = false, force = false) {
	if(reset_prev_layer_data) {
		prev_layer_data = [];
	}

	var latex = model_to_latex();

	if(latex) {
		$("#math_tab_code").html(latex);

		try {
			var math_tab_code_elem = $("#math_tab_code")[0];

			var xpath = get_element_xpath(math_tab_code_elem);
			var new_md5 = await md5($(math_tab_code_elem).html());
			var old_md5 = math_items_hashes[xpath];

			if(new_md5 != old_md5 || force || !is_hidden_or_has_hidden_parent($("#math_tab_code"))) {
				try {
					_temml();
				} catch (e) {
					if(!("" + e).includes("assign to property") || ("" + e).includes("s.body[0] is undefined")) {
						void(0); info("" + e);
					} else if (("" + e).includes("too many function arguments")) {
						void(0); err("TEMML: " + e);
					} else {
						throw new Error(e);
					}
				}
				math_items_hashes[xpath] = new_md5;
			}
		} catch (e) {
			if(("" + e).includes("can't assign to property")) {
				wrn(language[lang]["failed_temml"], e);
			} else {
				await write_error(e, null, null);
			}
		}

		write_optimizer_to_math_tab();
	}
}

function get_colors_from_old_and_new_layer_data(prev_layer_data, layer_data) {
	const deep_copy = data => structuredClone ? structuredClone(data) : JSON.parse(JSON.stringify(data));
	const old_data = prev_layer_data.length ? prev_layer_data : layer_data;
	return color_compare_old_and_new_layer_data(deep_copy(old_data), deep_copy(layer_data));
}

function color_compare_old_and_new_layer_data (old_data, new_data) {
	assert(old_data.length == new_data.length, "Old data and new data are vastly different. Have you changed the number of layers without resetting prev_layer_data?");

	var default_color = "#ffffff";
	var cookie_theme = get_cookie("theme");
	var darkmode = 0;

	if(cookie_theme == "darkmode") {
		darkmode = 1;
	}

	if(darkmode) {
		default_color = "#353535";
	}

	var color_diff = [];

	for (var layer_nr = 0; layer_nr < old_data.length; layer_nr++) {
		var this_old_layer = old_data[layer_nr];
		var this_new_layer = new_data[layer_nr];

		assert(Object.keys(this_old_layer).join(",") == Object.keys(this_new_layer).join(","), "Old data and new data for layer " + layer_nr + " have different length data sets");

		var keys = Object.keys(this_old_layer);

		color_diff[layer_nr] = {};

		var ret = compare_entire_layer_and_update_colors(keys, this_old_layer, this_new_layer, color_diff, layer_nr, default_color);

		if(ret === false) {
			continue;
		}

		color_diff = ret;
	}

	return color_diff;
}

function compare_nested_array(old_arr, new_arr, default_color) {
	const out = new Array(old_arr.length);
	for (let i = 0; i < old_arr.length; i++) {
		const o = old_arr[i];
		const n = new_arr[i];
		out[i] = typeof o === "number" ? (o === n ? default_color : (o > n ? "#cf1443" : "#2e8b57")) : default_color;
	}
	return out;
}

function compare_entire_layer_and_update_colors(keys, old_layer, new_layer, color_diff, layer_nr, default_color) {
	for (let k = 0; k < keys.length; k++) {
		const key = keys[k];
		const old_arr = old_layer[key];
		const new_arr = new_layer[key];
		if (old_arr.length !== new_arr.length) return false;

		const cd = (color_diff[layer_nr][key] = new Array(old_arr.length));
		for (let i = 0; i < old_arr.length; i++) {
			const o = old_arr[i];
			const n = new_arr[i];
			if (Array.isArray(o)) {
				cd[i] = compare_nested_array(o, n, default_color);
			} else if (typeof o === "number") {
				cd[i] = o === n ? default_color : (o > n ? "#cf1443" : "#2e8b57");
			} else {
				cd[i] = default_color;
			}
		}
	}
	return color_diff;
}

function can_be_shown_in_latex () {
	if(!model) {
		return false;
	}

	if(!Object.keys(model).includes("layers") || !Object.keys(model["layers"]).includes("0")) {
		dbg(language[lang]["model_doesnt_include_layers_cannot_show_in_latex"]);
		return false;
	}

	if (
	    !model ||
	    !Array.isArray(model.layers) ||
	    model.layers.length === 0 ||
	    !model.layers[model.layers.length - 1].input ||
	    !model.layers[model.layers.length - 1].input.shape ||
	    model.layers[model.layers.length - 1].input.shape.length !== 2
	) {
		return false;
	}


	for (var layer_idx = 0; layer_idx < model.layers.length; layer_idx++) {
		var this_layer_type = $($(".layer_type")[layer_idx]).val();
		var valid_layers = [
			"dense",
			"flatten",
			"reshape",
			"elu",
			"leakyReLU",
			"reLU",
			"softmax",
			"thresholdedReLU",
			"dropout",
			"batchNormalization",
			"DebugLayer",
			"gaussianNoise",
		];
		if(!(valid_layers.includes(this_layer_type))) {
			return false;
		}
	}

	return true;
}

function create_math_slider() {
	_create_math_slider("math_history_slider", "#math_tab_code");
}

function reset_math_history () {
	math_history = [];
	$("#math_history_slider").html("").hide();
}

function write_optimizer_to_math_tab () {
	try {
		if(!model) {
			dbg(`[write_optimizer_to_math_tab] model not defined`);
			return;
		}

		if(typeof(model.optimizer) != "object") {
			dbg(`[write_optimizer_to_math_tab] model doesn't have optimizer key`);
			return;
		}

		var values = {};

		var _keys = Object.keys(model.optimizer);

		for (var key_idx = 0; key_idx < _keys.length; key_idx++) {
			var _key = _keys[key_idx];
			if(_key != "iterations_") {
				try {
					var _val = model.optimizer[_key];

					if(typeof(_val) == "number") {
						values[_key] = _val;
					} else if (!Array.isArray(_val) && typeof(_val) == "object") {
						if(!Object.keys(_val).includes("isDisposedInternal")) {
							dbg(`_val in write_optimizer_to_math_tab for key ${_key} is not a tensor! (does not have isDisposedInternal`, _val);
						} else if(!_val.isDisposedInternal) {
							tf.engine().startScope();
							values[_key] = array_sync(_val, true);
							tf.engine().endScope();
						} else {
							dbg(language[lang]["tensor_already_disposed_write_optimizer_to_math_tab"])
						}
					} else if (Array.isArray(_val)) {
						tf.engine().startScope();
						values = get_values_for_optimizer_array_from_array(values, _val, _key);
						tf.engine().endScope();
					} else {
						dbg(`Unknown type in write_optimizer_to_math_tab for key ${_key}:`, _val)
					}
				} catch (e) {
					// ignore
				}
			}
		}

		var str = "";

		var val_keys = Object.keys(values);

		if(val_keys.length) {
			var elements = [];

			for (var val_key_idx = 0; val_key_idx < val_keys.length; val_key_idx++) {
				var this_matrix_or_int_string = "";
				var shape = "";
				if(Array.isArray(values[val_keys[val_key_idx]])) {
					shape = " [" + get_shape_from_array(values[val_keys[val_key_idx]]).join(",") + "]"
					this_matrix_or_int_string = _arbitrary_array_to_latex(values[val_keys[val_key_idx]], 5);
				} else {
					this_matrix_or_int_string = values[val_keys[val_key_idx]];
				}

				var this_element = `<span class='temml_me'>\\text{${val_keys[val_key_idx]}${shape}} = ${this_matrix_or_int_string}`;
				this_element += "</span>"
				elements.push(this_element);
			}

			str += elements.join("<br>\n");
		}

		if(str) {
			$("#optimizer_variables_header").show();
			$("#optimizer_variables_div").html(str).show();

			_temml();
		} else {
			hide_and_reset_optimizer_variables();
		}
	} catch (e) {
		hide_and_reset_optimizer_variables()

		dbg(e);
	}
}

function hide_and_reset_optimizer_variables() {
	$("#optimizer_variables_header").hide();
	$("#optimizer_variables_div").html("").hide();
}

function _create_math_slider (containerId, targetId) {
	try {
		let container = document.getElementById(containerId);
		if (!container) {
			console.error("Container not found:", containerId);
			return;
		}

		container.innerHTML = "";

		if (!Array.isArray(math_history) || math_history.length === 0 || math_history.length == 1) {
			container.style.display = "none";
			return;
		} else {
			container.style.display = "flex";
		}

		let style = document.createElement("style");

		style.textContent = `
			#${containerId} {
				display: flex;
				flex-direction: column;
				align-items: center;
				gap: 10px;
				padding: 20px;
			}
			#${containerId} input[type=range] {
				width: 80%;
				-webkit-appearance: none;
				background: transparent;
			}
			#${containerId} input[type=range]::-webkit-slider-thumb {
				-webkit-appearance: none;
				appearance: none;
				width: 20px;
				height: 20px;
				border-radius: 50%;
				background: #4caf50;
				cursor: pointer;
				border: none;
				box-shadow: 0 0 5px rgba(0,0,0,0.3);
			}

			#${containerId} input[type=range]::-webkit-slider-runnable-track {
				height: 6px;
				background: #ddd;
				border-radius: 3px;
			}

			#${containerId} .epoch-label {
				font-family: sans-serif;
				font-size: 14px;
				color: #333333;
			}
		`;
		document.head.appendChild(style);

		let label = document.createElement("div");
		label.className = "epoch-label";

		// initialize with current slider value (last epoch)
		let slider = document.createElement("input");
		slider.type = "range";
		slider.min = 1;
		slider.max = math_history.length;
		slider.value = math_history.length;
		slider.step = 1;

		label.textContent = "Epoch: " + slider.value + " / " + math_history.length;
		container.appendChild(label);
		container.appendChild(slider);

		slider.addEventListener("input", function () {
			let index = parseInt(slider.value, 10) - 1;
			label.textContent = "Epoch: " + slider.value + " / " + math_history.length;

			let target = $(targetId);
			if (target.length === 0) {
				console.error("Target not found:", targetId);
				return;
			}

			target.html(math_history[index]);

			try {
				_temml();
			} catch (e) {
				console.error("Error in _temml:", e);
			}
		});

		let initIndex = parseInt(slider.value, 10) - 1;

	} catch (err) {
		console.error("Error in _create_math_slider:", err);
	}
}

function _array_to_ellipsis_latex (x, limit) {
	var _new = [];

	var last_line_was_ellipsis = 0;
	for (var x_idx = 0; x_idx < x.length; x_idx++) {
		if(x_idx < limit || x_idx >= (x.length - limit)) {
			_new.push(x[x_idx]);
			last_line_was_ellipsis = 0;
		} else {
			if(!last_line_was_ellipsis) {
				var _item = [];
				for (var j = 0; j < x[x_idx].length; j++) {
					_item.push("\\vdots");
				}
				_new.push(_item);
				last_line_was_ellipsis = 1;
			}
		}
	}

	var new_two = [];

	for (var _new_idx = 0; _new_idx < _new.length; _new_idx++) {
		var new_element = [];
		var last_element_was_ellipsis = 0;
		for (var j = 0; j < _new[_new_idx].length; j++) {
			if(j < limit || j >= (_new[_new_idx].length - limit)) {
				new_element.push(_new[_new_idx][j]);
				last_element_was_ellipsis = 0;
			} else {
				if(!last_element_was_ellipsis) {
					new_element.push("\\cdots");
					last_element_was_ellipsis = 1;
				}
			}
		}

		new_two.push(new_element);
	}

	return new_two;
}

function array_to_ellipsis_latex (x, limit, underbrace_text="") {
	var _shape = get_shape_from_array(x);

	if(_shape.length == 1) {
		return x[0];
	} else if(_shape.length == 2) {
		return array_to_latex(_array_to_ellipsis_latex(x, limit), underbrace_text);
	} else {
		var sub_arrays = [];
		for (var _item = 0; _item < _shape[0]; _item++) {
			sub_arrays.push(array_to_ellipsis_latex(x[_item], limit));
		}

		var str = "\\begin{pmatrix}";
		for (var k = 0; k < sub_arrays.length; k++) {
			str += sub_arrays[k];
		}

		str += "\\end{pmatrix}";

		return str;
	}
}

function get_values_for_optimizer_array_from_array(values, _val, _key) {
	for (var j = 0; j < _val.length; j++) {
		if (j == 0) {
			values[_key] = [];
		}

		if (j in _val) {
			var variable_val = _val[j].variable;
			if (typeof variable_val !== 'undefined' && variable_val !== null && !variable_val.isDisposedInternal) {
				try {
					var _this_res = tidy(() => { return array_sync(variable_val, true) });
					values[_key][j] = _this_res;
				} catch (_err) {
					dbg("array_sync failed for j=" + j + " variable=" + variable_val + " error=" + _err);
				}
			}
		} else {
			dbg("index j=" + j + " not in _val");
		}

	}

	return values;
}

function _arbitrary_array_to_latex(arr, max_vals = 33, fixval = get_dec_points_math_mode()) {
	arr = replaceNaNsRecursive(arr);

	arr = array_to_fixed(arr, fixval);

	var str = "";

	function get_truncated_array(arr, max_vals, is_row = false) {
		if (arr.length > max_vals) {
			let visible = arr.slice(0, max_vals);
			if (is_row) {
				visible.push("\\cdots");
			} else {
				visible.push("\\cdots");
			}
			return visible;
		}
		return arr;
	}

	if (typeof(arr) === "number") {
		return arr.toString();
	} else if (typeof(arr) === "string") {
		return `\\textrm{${arr}}`;
	} else if (typeof(arr) === "object") {
		if (Array.isArray(arr)) {
			str += "\\begin{pmatrix}\n";

			var shape = get_shape_from_array(arr);
			var str_array = [];
			var num_rows = arr.length;

			if (shape.length === 1) {
				let truncated_array = get_truncated_array(arr, max_vals);
				str_array.push(truncated_array.join(" & "));
				str += str_array.join(" \\\\\n");
			} else if (shape.length === 2) {
				let num_cols = Math.min(arr[0].length, max_vals);

				// Process each row
				for (let i = 0; i < Math.min(num_rows, max_vals); i++) {
					let row = arr[i];
					let truncated_row = get_truncated_array(row, max_vals, true);
					str_array.push(truncated_row.join(" & "));
				}

				// Add \vdots if there are more rows than max_vals
				if (num_rows > max_vals) {
					str_array.push("\\vdots");
				}

				str += str_array.join(" \\\\\n");
			} else {
				str += "{\n";
				for (let i = 0; i < Math.min(arr.length, max_vals); i++) {
					str += _arbitrary_array_to_latex(arr[i], max_vals) + ", ";
				}

				if (arr.length > max_vals) {
					str += "\\cdots";
				}

				str += "}\n";
			}

			str += "\\end{pmatrix}\n";
		} else {
			str += "\\{";
			let obj_array = [];
			for (var key in arr) {
				if (arr.hasOwnProperty(key)) {
					obj_array.push(`\\textbf{${key}}: ${_arbitrary_array_to_latex(arr[key], max_vals)}`);
				}
			}
			str += obj_array.join(", ");
			str += "\\}";
		}
	} else if (typeof(arr) === "function") {
		console.log("_arbitrary_array_to_latex was called with function argument");
	} else {
		if (arr) {
			wrn("Unknown type: " + typeof(arr));
		}
	}

	return str;
}

function arbitrary_array_to_latex (arr) {
	var latex = _arbitrary_array_to_latex(arr);
	var res = "<span class='temml_me'>" + latex + "</span>";
	return res;
}

function replaceNaNsRecursive(input) {
	if (Array.isArray(input)) {
		return input.map(element => replaceNaNsRecursive(element));
	} else {
		return isNaN(input) ? "\\text{NaN}" : input;
	}
}

function array_to_fixed (_array, fixnr) {
	if(typeof _array === "number") {
		return "" + _array;
	}

	typeassert(_array, array, "_array");
	typeassert(fixnr, int, "fixnr");

	if(fixnr == 0) {
		return _array;
	}

	var x = 0;
	var len = _array.length;
	while(x < len) {
		var val =  _array[x]
		if(Array.isArray(_array[x])) {
			_array[x] = array_to_fixed(val, fixnr);
		} else if(looks_like_number(val)) {
			_array[x] = parse_float(parse_float(val).toFixed(fixnr));
		}
		x++;
	}

	return _array;
}

function array_to_color (_array, color) {
	if(contains_convolution()) {
		return _array;
	}

	var x = 0;
	var len = _array.length;
	var new_array = [];
	while(x < len) {
		var this_color = "";

		if(color && Object.keys(color).includes("" + x)) {
			this_color = color[x];
		}

		if(this_color == "#353535" || this_color == "#ffffff" || this_color == "white" || this_color == "black" || !this_color) {
			new_array.push(_array[x]);
		} else {
			new_array.push("\\colorbox{" + this_color + "}{" + _array[x] + "}");
		}

		x++;
	}

	return new_array;
}

function array_to_latex_color(original_array, desc, color = null, newline_instead_of_ampersand = 0, max_values = get_max_nr_cols_rows()) {
	original_array = array_to_fixed(original_array, get_dec_points_math_mode());

	if (!color) {
		return array_to_latex(original_array, desc, newline_instead_of_ampersand);
	}

	var _array = JSON.parse(JSON.stringify(original_array));
	var str = "\\underbrace{\\begin{pmatrix}\n";

	var joiner = " & ";
	if (newline_instead_of_ampersand) {
		joiner = " \\\\\n";
	}

	var arr = [];

	var num_rows = _array.length;
	var num_cols = 1;
	try {
		num_cols = _array[0].length;
	} catch (e) {}
	var display_rows = Math.min(max_values, num_rows);
	var display_cols = Math.min(max_values, num_cols);

	for (var display_row_idx = 0; display_row_idx < display_rows; display_row_idx++) {
		if (display_row_idx === max_values - 1 && num_rows > max_values) {
			// Row with \vdots
			var row = Array(display_cols).fill("\\vdots");
			row[display_cols - 1] = "\\ddots";
		} else {
			var row = _array[display_row_idx].slice(0, display_cols);
			if (num_cols > max_values) {
				row[display_cols - 1] = "\\dots";
			}
		}

		try {
			row = array_to_color(row, color[display_row_idx]);
			arr.push(row.join(joiner));
		} catch (e) {
			err("ERROR in math mode (e, _array, display_row_idx, color):", e, _array, display_row_idx, color);
		}
	}

	if (num_rows > max_values) {
		// Add final row for \dots
		var last_row = Array(display_cols).fill("\\dots");
		last_row[display_cols - 1] = "\\ddots";
		arr.push(last_row.join(joiner));
	}

	str += arr.join("\\\\\n");

	str += "\n\\end{pmatrix}}";
	if (desc) {
		str += "_{\\mathrm{" + desc + "}}\n";
	}

	return str;
}

function array_to_latex (_array, desc = false, newline_instead_of_ampersand = false) {
	typeassert(_array, array, "_array");

	var str = "\\underbrace{\\begin{pmatrix}\n";

	var joiner = " & ";
	if(newline_instead_of_ampersand) {
		joiner = " \\\\\n";
	}

	var arr = [];

	for (var arr_idx = 0; arr_idx < _array.length; arr_idx++) {
		_array[arr_idx] = array_to_fixed(_array[arr_idx], get_dec_points_math_mode());
		arr.push(_array[arr_idx].join(joiner));
	}

	str += arr.join("\\\\\n");

	str += "\n\\end{pmatrix}}";
	if(desc) {
		str += "_{\\mathrm{" + desc + "}}\n";
	}

	return str;
}

function a_times_b (a, b) {
	var res = a + " \\times " + b;

	return res;
}

function get_weight_name_by_layer_and_weight_index (layer_idx, index) {
	assert(typeof(layer_idx) == "number", layer_idx + " is not a number");
	assert(typeof(index) == "number", index + " is not a number");

	var original_name = model?.layers[layer_idx]?.weights[index]?.name;

	var matches = /^.*\/(.*?)(?:_\d+)?$/.exec(original_name);
	if(matches === null) {
		err("matches is null. Could not determine name from " + original_name);
	} else if(1 in matches) {
		return matches[1];
	} else {
		err("Could not determine name from " + original_name + ", matches: ");
		log(matches);
	}

	return null;
}

function populate_layer_weight(this_layer_weights, possible_weight_names, layer_idx, k) {
	var weight_name = get_weight_name_by_layer_and_weight_index(layer_idx, k);

	if(possible_weight_names.includes(weight_name)) {
		var layer_weights = model?.layers[layer_idx]?.weights[k]?.val;
		if(layer_weights) {
			const synced_weight = array_sync(layer_weights, true);

			if(synced_weight) {
				this_layer_weights[weight_name] = Array.from(synced_weight);
			}
		}
	} else {
		void(0); err("Invalid weight_name: " + weight_name);
		log(model?.layers[layer_idx]?.weights[k]);
	}

	return this_layer_weights;
}

function get_layer_data() {
	var layer_data = [];

	var possible_weight_names = ["kernel", "alpha", "bias", "beta", "gamma", "moving_mean", "moving_variance", "depthwise_kernel", "pointwise_kernel", "snakeAlpha", "aSin", "aElu", "aSnake", "aRelu"];

	for (var layer_idx = 0; layer_idx < model.layers.length; layer_idx++) {
		var this_layer_weights = {};

		for (var n = 0; n < possible_weight_names.length; n++) {
			this_layer_weights[possible_weight_names[n]] = [];
		}

		try {
			if("weights" in model.layers[layer_idx]) {
				for (var k = 0; k < model.layers[layer_idx].weights.length; k++) {
					this_layer_weights = populate_layer_weight(this_layer_weights, possible_weight_names, layer_idx, k);
				}
			}
		} catch (e) {
			if(("" + e).includes("Tensor is disposed") || ("" + e).includes("object null is not iterable")) {
				dbg("Model was disposed during get_layer_data(). This is probably because the model was recompiled during this.");
			} else {
				err("" + e);

				if (e && e.stack) {
					err("Full stack:\n" + e.stack);
				}
			}
		}

		layer_data.push(this_layer_weights);
	}

	return layer_data;
}

function array_size (ar) {
	var row_count = ar.length;
	var row_sizes = [];

	for(var row_count_idx = 0; row_count_idx < row_count; row_count_idx++){
		row_sizes.push(ar[row_count_idx].length);
	}

	var res = [row_count, Math.min.apply(null, row_sizes)];

	return res;
}

function get_layer_output_shape_as_string (layer_idx) {
	assert(typeof(layer_idx) == "number", layer_idx + " is not a number");

	if(Object.keys(model).includes("layers")) {
		try {
			var str = model?.layers[layer_idx]?.outputShape?.toString();
			if(str) {
				str = str.replace(/^,|,$/g,"");
				str = "[" + str + "]";
				return str;
			} else {
				return "";
			}
		} catch (e) {
			err(e);
		}
	} else {
		log(language[lang]["layers_not_in_model"]);
	}

}

function _get_h (layer_idx) {
	var res = "h_{\\text{Shape: }" + get_layer_output_shape_as_string(layer_idx) + "}" + "'".repeat(layer_idx);

	return res;
}

function array_to_latex_matrix(_array, level = 0, no_brackets = false, max_nr = 33) {
	_array = array_to_fixed(_array, get_dec_points_math_mode());

	var base_tab = "";
	for (var level_idx = 0; level_idx < level; level_idx++) {
		base_tab += "\t";
	}

	var str = base_tab + (no_brackets ? "" : "\\left(") + "\\begin{matrix}\n";

	if (typeof _array == "object") {
		for (var arr_idx = 0; arr_idx < _array.length; arr_idx++) {
			var row = _array[arr_idx];

			if (typeof row == "object") {
				for (var k = 0; k < row.length; k++) {
					var cell = row[k];

					if (typeof cell == "object") {
						str += array_to_latex_matrix(cell, level + 1);
						continue;
					}

					var is_last = (k == row.length - 1);
					if (is_last) {
						str += base_tab + "\t" + cell + "\\\\\n";
					} else {
						str += base_tab + "\t" + cell + " & ";
					}
				}
			} else {
				str += base_tab + "\t" + row + "\\\\\n";
			}
		}
	} else {
		str += base_tab + "\t" + _array + "\n";
	}

	str += base_tab + "\\end{matrix}" + (no_brackets ? "" : "\\right)") + "\n";
	return str;
}

function add_activation_function_to_latex (_af, begin_or_end="begin") {
	assert(typeof(_af) == "string" || _af === undefined || _af == null, "_af (activation function) must be a string or null or undefined");
	assert(["begin", "end"].includes(begin_or_end), `begin_or_end must be either 'begin' or 'end', nothing else is allowed. Got: ${begin_or_end}`);

	if(!_af || _af == "linear") {
		return "";
	}

	if(begin_or_end == "begin") {
		return `\t\\text{${_af}}\\left(`;
	}

	return `\\right)`;
}

function get_flatten_string (layer_idx) {
	var original_input_shape = JSON.stringify(model.layers[layer_idx].getInputAt(0).shape.filter(Number));
	var original_output_shape = JSON.stringify(model.layers[layer_idx].getOutputAt(0).shape.filter(Number));
	return _get_h(layer_idx) + " = " + _get_h(layer_idx == 0 ? 0 : layer_idx - 1) + " \\xrightarrow{\\text{Reshape}} \\text{New Shape: }" + original_output_shape;
}

function get_activation_functions_equations () {
	return {
		"sigmoid": {
			"equation": "\\mathrm{sigmoid}\\left(x\\right) = \\sigma\\left(x\\right) = \\frac{1}{1+e^{-x}}",
			"equation_no_function_name": "\\sigma\\left(REPLACEME\\right) = \\frac{1}{1+e^{-REPLACEME}}",
			"lower_limit": 0,
			"upper_limit": 1,
			"math_ml": 1
		},
		"tanh": {
			"equation": "\\mathrm{tanh}\\left(x\\right) = \\frac{e^x-e^{-x}}{e^x+e^{-x}}",
			"equation_no_function_name": "\\frac{e^REPLACEME-e^{-REPLACEME}}{e^REPLACEME+e^{-REPLACEME}}",
			"lower_limit": -1,
			"upper_limit": 1
		},
		"relu": {
			"equation": "\\mathrm{relu}\\left(x\\right) = \\mathrm{max}\\left(0, x\\right)",
			"equation_no_function_name": "\\mathrm{max}\\left(0, REPLACEME\\right)",
			"lower_limit": 0
		},
		"thresholdedReLU": {
			"equation": "\\mathrm{thresholdedReLU}\\left(x\\right) = \\begin{cases}\nx & x > \\theta \\\\ \n 0 & \\mathrm{otherwise}\n\\end{cases}\n",
			"equation_no_function_name": "\\begin{cases}\nx & x > \\theta \\\\ \n 0 & \\mathrm{otherwise}\n\\end{cases}\n"
		},
		"LeakyReLU": {
			"equation": "\\mathrm{LeakyReLU}\\left(x\\right) = \\begin{cases} \\alpha \\cdot x, & x < 0 \\\\ x, & x \\ge 0 \\end{cases}",
			"equation_no_function_name": "\\begin{cases} ALPHAREPL \\cdot REPLACEME, & REPLACEME < 0 \\\\ REPLACEME, & REPLACEME \\ge 0 \\end{cases}"
		},
		"elu": {
			"equation": "\\mathrm{elu}\\left(x\\right) = \\left\\{\n\\begin{array}{ll}\nx & x \\geq 0 \\\\\n\\alpha\\left(e^x - 1\\right)& \\, x \\lt 0 \\\\\n\\end{array}\n\\right.",
			"equation_no_function_name": "\\left\\{\n\\begin{array}{ll}\nREPLACEME & REPLACEME \\geq 0 \\\\\n\\alpha\\left(e^REPLACEME - 1\\right)& \\, x \\lt 0 \\\\\n\\end{array}\n\\right."
		},
		"softplus": {
			"equation": "\\mathrm{softplus}\\left(x\\right) = \\ln\\left(1 + e^x\\right)",
			"equation_no_function_name": "\\ln\\left(1 + e^REPLACEME\\right)",
			"lower_limit": 0
		},
		"softmax": {
			"equation": "\\mathrm{softmax}\\left(x_i\\right) = \\frac{e^{x_i}}{\\sum_{j=1}^{K} e^{x_j}}",
			"equation_no_function_name": "\\frac{e^{REPLACEME}}{\\sum_{j=1}^{K} e^{x_j}}",
			"lower_limit": 0,
			"upper_limit": 1
		},
		"softsign": {
			"equation": "\\mathrm{softsign}\\left(x\\right) = \\frac{x}{\\left(1 + \\left| x \\right| \\right)}",
			"equation_no_function_name": "\\frac{REPLACEME}{\\left(1 + \\left| REPLACEME \\right| \\right)}",
			"lower_limit": -1,
			"upper_limit": 1
		},
		"selu": {
			"equation": "\\mathrm{selu}\\left(x\\right) = \\mathrm{scale} \\cdot \\mathrm{elu}\\left(x, \\alpha\\right) = \\mathrm{scale} \\cdot \\left\\{\n\\begin{array}{ll}\nx & x \\geq 0 \\\\\n\\alpha\\left(e^x - 1\\right)& \\, x \\lt 0 \\\\\n\\end{array}\n\\right.",
			"equation_no_function_name": "\\mathrm{scale} \\cdot \\left\\{\n\\begin{array}{ll}\nREPLACEME & REPLACEME \\geq 0 \\\\\n\\alpha\\left(e^REPLACEME - 1\\right)& \\, REPLACEME \\lt 0 \\\\\n\\end{array}\n\\right."
		},
		"relu6": {
			"equation": "\\mathrm{relu6}\\left(x\\right) = \\mathrm{min}\\left(\\mathrm{max}\\left(0, x\\right),6\\right)",
			"equation_no_function_name": "\\mathrm{min}\\left(\\mathrm{max}\\left(0, REPLACEME\\right),6\\right)",
			"lower_limit": 0,
			"upper_limit": 6
		}
	}
}

function get_default_vars() {
	return {
		"g": {
			"name": "Gradient estimate"
		},
			"nabla_operator": {
				"name": "Nabla-Operator (Vector of partial derivatives), 3d example: ",
				"value": "\\begin{bmatrix} \\frac{\\partial}{\\partial x} \\\\ \\frac{\\partial}{\\partial y} \\\\ \\frac{\\partial}{\\partial z} \\end{bmatrix}"
			},
			"theta": {
				"name": "Weights"
			},
			"eta": {
				"name": "Learning rate",
				"origin": "learningRate_OPTIMIZERNAME"
			},
			"epsilon": {
				"name": "Epsilon",
				"origin": "epsilon_OPTIMIZERNAME"
			}
	}
}

function get_loss_equations() {
	return {
		"meanAbsoluteError": "\\mathrm{MAE} = \\frac{1}{n} \\sum_{i=1}^n \\left|y_i - \\hat{y}_i\\right|",
		"meanSquaredError": "\\mathrm{MSE} = \\frac{1}{n} \\sum_{i=1}^n \\left(y_i - \\hat{y}_i\\right)^2",
		"rmse": "\\mathrm{RMSE} = \\sqrt{\\mathrm{MSE}} = \\sqrt{\\frac{1}{n} \\sum_{i=1}^n \\left(y_i - \\hat{y}_i\\right)^2}",
		"categoricalCrossentropy": "\\text{Categorical Crossentropy:} -\\sum_{i=1}^n y_i \\log\\left(\\hat{y}_i\\right)",
		"binaryCrossentropy": "\\text{Binary Crossentropy:} -\\frac{1}{n} \\sum_{i=1}^n y_i \\cdot \\log\\left(\\hat{y}_i\\right) + 1\\left(-y_i\\right) \\cdot \\log\\left(1 - \\hat{y}_i\\right)",
		"meanSquaredLogarithmicError": "\\text{Mean Squared Logarithmic Error:} \\frac{1}{n} \\sum_{i=0}^n \\left(log\\left(y_i + 1\\right)- \\log\\left(\\hat{y}_i + 1\\right)\\right)^2",
		"poisson": "\\text{Poisson:} \\frac{1}{n} \\sum_{i=0}^n \\left(\\hat{x}_i - y_i\\cdot \\log\\left(\\hat{y}_i\\right)\\right)",
		"squaredHinge": "\\text{Squared Hinge:} \\sum_{i=0}^n \\left(\\mathrm{max}\\left(0, 1 - y_i \\cdot \\hat{y}_i\\right)^ 2\\right)",
		"logcosh": "\\text{logcosh:} \\sum_{i=0}^n \\log(\\cosh\\left(\\hat{y}_i - y_i\\right))",
		"meanAbsolutePercentageError": "\\text{MAPE} = \\frac{1}{n} \\sum_{t=1}^{n} \\left|\\frac{\\hat{y} - y}{\\hat{y}}\\right|"
	}
}

function get_optimizer_equations() {
	var default_vars = get_default_vars();

	var rule_width = 110;

	return {
		"sgd": {
			"equations": [
				`
					\\begin{aligned}
						& \\rule{${rule_width}mm}{0.4pt} & \\\\
						& \\textbf{input} : \\gamma \\text{ (lr)}, \\theta_0 \\text{ (params)}, f(\\theta) \\text{ (objective)}, \\lambda \\text{ (weight decay)}, & \\\\
						& \\hspace{13mm} \\mu \\text{ (momentum)}, \\tau \\text{ (dampening)}, \\text{ nesterov}, \\text{ maximize} & \\\\[-1.ex]
						& \\rule{${rule_width}mm}{0.4pt} & \\\\
						& \\textbf{for} \\: t=1 \\: \\textbf{to} \\: \\text{epochs} \\: \\textbf{do} & \\text{Loop from t=1 to epochs}\\\\
						& \\hspace{5mm}g_t \\leftarrow \\nabla_{\\theta} f_t (\\theta_{t-1}) & \\text{Compute the gradient of the objective function} \\\\
						& \\hspace{5mm}\\textbf{if} \\: \\lambda \\neq 0 & \\text{If weight decay is not zero} \\\\
						& \\hspace{10mm} g_t \\leftarrow g_t + \\lambda \\theta_{t-1} & \\text{Add weight decay term to the gradient} \\\\
						& \\hspace{5mm}\\textbf{if} \\: \\mu \\neq 0 & \\text{If momentum is used} \\\\
						& \\hspace{10mm}\\textbf{if} \\: t > 1 & \\\\
						& \\hspace{15mm} \\textbf{b}_t \\leftarrow \\mu \\textbf{b}_{t-1} + (1-\\tau) g_t & \\text{Update the buffer with momentum and dampening} \\\\
						& \\hspace{10mm}\\textbf{else} & \\\\
						& \\hspace{15mm} \\textbf{b}_t \\leftarrow g_t & \\text{Set the buffer to the gradient} \\\\
						& \\hspace{10mm}\\textbf{if} \\: \\text{nesterov} & \\text{If using Nesterov momentum} \\\\
						& \\hspace{15mm} g_t \\leftarrow g_t + \\mu \\textbf{b}_t & \\text{Update the gradient with Nesterov momentum} \\\\
						& \\hspace{10mm}\\textbf{else} & \\\\[-1.ex]
						& \\hspace{15mm} g_t \\leftarrow \\textbf{b}_t & \\text{Set the gradient to the buffer} \\\\
						& \\hspace{5mm}\\theta_t \\leftarrow \\theta_{t-1} - \\gamma g_t & \\text{Update parameters for minimization} \\\\[-1.ex]
						& \\rule{${rule_width}mm}{0.4pt} & \\\\[-1.ex]
						& \\bf{return} \\: \\theta_t & \\text{Return the updated parameters} \\\\[-1.ex]
						& \\rule{${rule_width}mm}{0.4pt} & \\\\[-1.ex]
					\\end{aligned}
				`
			],
			"dependencies": [],
			"variables": {
				"\\nabla": default_vars["nabla_operator"],
			}
		},
		"momentum": {
			"equations": [
				"\\Delta\\theta_t = -\\gamma v_{t-1} - \\eta g_t"
			],
			"dependencies": [],
			"variables": {
				"\\eta": default_vars["eta"],
				"\\theta": default_vars["theta"]
			}
		},
		"nag": {
			"equations": [
				"\\Delta\\theta_t = -\\gamma v_{t-1} - \\eta \\nabla_\\theta J(\\theta - \\gamma v_{t-1})"
			],
			"dependencies": [],
			"variables": {
				"\\theta": default_vars["theta"],
				"\\nabla": default_vars["nabla_operator"],
				"\\eta": default_vars["eta"]
			}
		},
		"adagrad": {
			"equations": [
				`
					\\begin{aligned}
						& \\rule{${rule_width}mm}{0.4pt} & \\\\
						& \\textbf{input}: \\gamma \\text{ (lr)}, \\theta_0 \\text{ (params)}, f(\\theta)
							\\text{ (objective)}, \\lambda \\text{ (weight decay)}, & \\\\
						& \\hspace{12mm} \\tau \\text{ (initial accumulator value)}, \\eta \\text{ (lr decay)} & \\\\
						& \\textbf{initialize} : \\text{state\\_sum}_0 \\leftarrow 0 & \\text{Initialize the accumulated gradient sum} \\\\[-1.ex]
						& \\rule{${rule_width}mm}{0.4pt} & \\\\
						& \\textbf{for} \\: t=1 \\: \\textbf{to} \\: \\text{epochs} \\: \\textbf{do} & \\text{Loop from t=1 to epochs} \\\\
						& \\hspace{5mm}g_t \\leftarrow \\nabla_{\\theta} f_t (\\theta_{t-1}) & \\text{Compute the gradient of the objective function} \\\\
						& \\hspace{5mm}\\tilde{\\gamma} \\leftarrow \\gamma / (1 +(t-1) \\eta) & \\text{Adjust the learning rate with decay} \\\\
						& \\hspace{5mm}\\textbf{if} \\: \\lambda \\neq 0 & \\text{If weight decay is not zero} \\\\
						& \\hspace{10mm}g_t \\leftarrow g_t + \\lambda \\theta_{t-1} & \\text{Add weight decay term to the gradient} \\\\
						& \\hspace{5mm}\\text{state\\_sum}_t \\leftarrow \\text{state\\_sum}_{t-1} + g^2_t & \\text{Update the accumulated gradient sum} \\\\
						& \\hspace{5mm}\\theta_t \\leftarrow \\theta_{t-1} - \\tilde{\\gamma} \\frac{g_t}{\\sqrt{\\text{state\\_sum}_t} + \\epsilon} & \\text{Update the parameters using Adagrad rule} \\\\
						& \\rule{${rule_width}mm}{0.4pt} & \\\\[-1.ex]
						& \\bf{return} \\: \\theta_t & \\text{Return the updated parameters} \\\\[-1.ex]
						& \\rule{${rule_width}mm}{0.4pt} & \\\\[-1.ex]
					\\end{aligned}

				`
			],
			"dependencies": [],
			"variables": {
				"\\eta": default_vars["eta"],
				"\\theta": default_vars["theta"],
			}
		},
		"adadelta": {
			"equations": [
				`
					\\begin{aligned}
						& \\rule{${rule_width}mm}{0.4pt} & \\\\
						& \\textbf{input}: \\gamma \\text{ (lr)}, \\: \\theta_0 \\text{ (params)},
							\\: f(\\theta) \\text{ (objective)}, \\: \\rho \\text{ (decay)},
							\\: \\eta \\text{ (weight decay)} & \\\\
						& \\textbf{initialize} : v_0 \\leftarrow 0 \\: \\text{ (square avg)},
							\\: u_0 \\leftarrow 0 \\: \\text{ (accumulate variables)} & \\\\[-1.ex]
						& \\rule{${rule_width}mm}{0.4pt} & \\\\
						& \\textbf{for} \\: t=1 \\: \\textbf{to} \\: \\text{epochs} \\: \\textbf{do} & \\text{Loop from t=1 to epochs} \\\\
						& \\hspace{5mm}g_t \\leftarrow \\nabla_{\\theta} f_t (\\theta_{t-1}) & \\text{Compute the gradient of the objective function at the current parameters} \\\\
						& \\hspace{5mm}\\text{if} \\: \\eta \\neq 0 & \\text{If weight decay is not zero} \\\\
						& \\hspace{10mm} g_t \\leftarrow g_t + \\eta \\theta_{t-1} & \\text{Add weight decay term to the gradient} \\\\
						& \\hspace{5mm} v_t \\leftarrow v_{t-1} \\rho + g^2_t (1 - \\rho) & \\text{Update the squared average with decay} \\\\
						& \\hspace{5mm}\\Delta x_t \\leftarrow \\frac{\\sqrt{u_{t-1} + \\epsilon }}{ \\sqrt{v_t + \\epsilon} }g_t \\hspace{21mm} & \\text{Compute the update step using squared averages and gradient} \\\\
						& \\hspace{5mm} u_t \\leftarrow u_{t-1} \\rho + \\Delta x^2_t (1 - \\rho) & \\text{Update the accumulated updates with decay} \\\\
						& \\hspace{5mm}\\theta_t \\leftarrow \\theta_{t-1} - \\gamma \\Delta x_t & \\text{Update the parameters using the computed step size} \\\\
						& \\rule{${rule_width}mm}{0.4pt} & \\\\[-1.ex]
						& \\bf{return} \\: \\theta_t & \\text{Return the updated parameters} \\\\[-1.ex]
						& \\rule{${rule_width}mm}{0.4pt} & \\\\[-1.ex]
					\\end{aligned}
				`
			],
			"variables": {
				"\\eta": default_vars["eta"],
				"\\theta": default_vars["theta"],
				"\\epsilon": default_vars["epsilon"],
				"\\rho": {
					"name": "Decay rate for the moving average of the squared gradients"
				},
			}
		},
		"adamax": {
			"equations": [
				`
					\\begin{aligned}
						& \\rule{${rule_width}mm}{0.4pt} & \\\\
						& \\textbf{input} : \\gamma \\text{ (lr)}, \\beta_1, \\beta_2 \\text{ (betas)}, \\theta_0 \\text{ (params)}, f(\\theta) \\text{ (objective)}, \\lambda \\text{ (weight decay)}, & \\\\
						& \\hspace{13mm} \\epsilon \\text{ (epsilon)} & \\\\
						& \\textbf{initialize} : m_0 \\leftarrow 0 \\text{ (first moment)}, u_0 \\leftarrow 0 \\text{ (infinity norm)} & \\text{Initialize first moment and infinity norm} \\\\[-1.ex]
						& \\rule{${rule_width}mm}{0.4pt} & \\\\
						& \\textbf{for} \\: t=1 \\: \\textbf{to} \\: \\text{epochs} \\: \\textbf{do} & \\text{Loop from t=1 to epochs} \\\\
						& \\hspace{5mm}g_t \\leftarrow \\nabla_{\\theta} f_t (\\theta_{t-1}) & \\text{Compute the gradient of the objective function} \\\\
						& \\hspace{5mm}\\textbf{if} \\: \\lambda \\neq 0 & \\text{If weight decay is not zero} \\\\
						& \\hspace{10mm}g_t \\leftarrow g_t + \\lambda \\theta_{t-1} & \\text{Add weight decay term to the gradient} \\\\
						& \\hspace{5mm}m_t \\leftarrow \\beta_1 m_{t-1} + (1 - \\beta_1) g_t & \\text{Update biased first moment estimate} \\\\
						& \\hspace{5mm}u_t \\leftarrow \\mathrm{max}(\\beta_2 u_{t-1}, |g_t| + \\epsilon) & \\text{Update the infinity norm} \\\\
						& \\hspace{5mm}\\theta_t \\leftarrow \\theta_{t-1} - \\frac{\\gamma m_t}{(1 - \\beta^t_1) u_t} & \\text{Update the parameters using the computed values} \\\\
						& \\rule{${rule_width}mm}{0.4pt} & \\\\[-1.ex]
						& \\bf{return} \\: \\theta_t & \\text{Return the updated parameters} \\\\[-1.ex]
						& \\rule{${rule_width}mm}{0.4pt} & \\\\[-1.ex]
					\\end{aligned}
`
			],
			"dependencies": [],
			"variables": {
				"\\theta": default_vars["theta"],
				"\\nabla": default_vars["nabla_operator"],
				"\\epsilon": default_vars["epsilon"],
				"g_t": {
					"name": "Gradient at time t along } \\theta^j \\text{ "
				},
				"\\alpha": {
					"name": "Learning rate",
					"origin": "learningRate_adamax"

				},
				"\\beta_1 \\in [0,1)": {
					"name": "Exponential decay rates",
					"origin": "beta1_adamax"
				},
				"\\beta_2 \\in [0,1)": {
					"name": "Exponential decay rates",
					"origin": "beta2_adamax"
				},
				"f(\\theta)": {
					"name": "Stochastic objective function"
				},
				"\\theta_0": {
					"name": "Initial parameter vector"
				}
			}
		},
		"rmsprop": {
			"equations": [
				`
					\\begin{aligned}
						& \\rule{${rule_width}mm}{0.4pt} & \\\\
						& \\textbf{input} : \\alpha \\text{ (alpha)}, \\gamma \\text{ (lr)}, \\theta_0 \\text{ (params)}, f(\\theta) \\text{ (objective)}, & \\\\
						& \\hspace{13mm} \\lambda \\text{ (weight decay)}, \\mu \\text{ (momentum)}, \\text{centered} & \\\\
						& \\textbf{initialize} : v_0 \\leftarrow 0 \\text{ (square average)}, \\textbf{b}_0 \\leftarrow 0 \\text{ (buffer)}, g^\\mathrm{ave}_0 \\leftarrow 0 & \\text{Initialize square average, buffer, and average gradient} \\\\[-1.ex]
						& \\rule{${rule_width}mm}{0.4pt} & \\\\
						& \\textbf{for} \\: t=1 \\: \\textbf{to} \\: \\text{epochs} \\: \\textbf{do} & \\text{Loop from t=1 to epochs} \\\\
						& \\hspace{5mm}g_t \\leftarrow \\nabla_{\\theta} f_t (\\theta_{t-1}) & \\text{Compute the gradient of the objective function} \\\\
						& \\hspace{5mm}\\textbf{if} \\: \\lambda \\neq 0 & \\text{If weight decay is not zero} \\\\
						& \\hspace{10mm}g_t \\leftarrow g_t + \\lambda \\theta_{t-1} & \\text{Add weight decay term to the gradient} \\\\
						& \\hspace{5mm}v_t \\leftarrow \\alpha v_{t-1} + (1 - \\alpha) g^2_t & \\text{Update the square average of gradients} \\\\
						& \\hspace{5mm}\\tilde{v_t} \\leftarrow v_t & \\text{Initialize \\(\\tilde{v_t}\\) with \\(v_t\\)} \\\\
						& \\hspace{5mm}\\textbf{if} \\: \\text{centered} & \\text{If centered RMSProp} \\\\
						& \\hspace{10mm}g^\\mathrm{ave}_t \\leftarrow g^\\mathrm{ave}_{t-1} \\alpha + (1-\\alpha) g_t & \\text{Update the moving average of gradients} \\\\
						& \\hspace{10mm}\\tilde{v_t} \\leftarrow \\tilde{v_t} - (g^\\mathrm{ave}_{t})^2 & \\text{Center the second moment estimate} \\\\
						& \\hspace{5mm}\\textbf{if} \\: \\mu > 0 & \\text{If momentum is used} \\\\
						& \\hspace{10mm}\\textbf{b}_t \\leftarrow \\mu \\textbf{b}_{t-1} + g_t / (\\sqrt{\\tilde{v_t}} + \\epsilon) & \\text{Update the buffer with momentum} \\\\
						& \\hspace{10mm}\\theta_t \\leftarrow \\theta_{t-1} - \\gamma \\textbf{b}_t & \\text{Update the parameters with momentum} \\\\
						& \\hspace{5mm}\\textbf{else} & \\text{If no momentum is used} \\\\
						& \\hspace{10mm}\\theta_t \\leftarrow \\theta_{t-1} - \\gamma g_t / (\\sqrt{\\tilde{v_t}} + \\epsilon) & \\text{Update the parameters without momentum} \\\\
						& \\rule{${rule_width}mm}{0.4pt} & \\\\[-1.ex]
						& \\bf{return} \\: \\theta_t & \\text{Return the updated parameters} \\\\[-1.ex]
						& \\rule{${rule_width}mm}{0.4pt} & \\\\[-1.ex]
					\\end{aligned}

				`
			],
			"dependencies": [],
			"variables": {
				"\\nabla": default_vars["nabla_operator"],
				"\\epsilon": default_vars["epsilon"],
			}
		},
		"adam": {
			"equations": [
				`
				\\begin{aligned}
					& \\rule{${rule_width}mm}{0.4pt} & \\\\
					& \\textbf{input} : \\gamma \\text{ (lr)}, \\beta_1, \\beta_2
					\\text{ (betas)},\\theta_0 \\text{ (params)},f(\\theta) \\text{ (objective)} & \\\\
					& \\hspace{13mm} \\lambda \\text{ (weight decay)}, \\: \\text{amsgrad},
					\\:\\text{maximize} & \\\\
					& \\textbf{initialize} : m_0 \\leftarrow 0 \\text{ (first moment)},
						v_0\\leftarrow 0 \\text{ (second moment)},\\: \\widehat{v_0}^\\mathrm{max}\\leftarrow 0 & \\text{Initialize first and second moments, and maximum second moment} \\\\[-1.ex]
					& \\rule{${rule_width}mm}{0.4pt} & \\\\
					& \\textbf{for} \\: t=1 \\: \\textbf{to} \\: \\text{epochs} \\: \\textbf{do} & \\text{Loop from t=1 to epochs} \\\\

					& \\hspace{5mm}g_t \\leftarrow \\nabla_{\\theta} f_t (\\theta_{t-1}) & \\text{Compute gradient of the objective function} \\\\
					& \\hspace{5mm}\\textbf{if} \\: \\lambda \\neq 0 & \\text{If weight decay is not zero} \\\\
					& \\hspace{10mm}g_t \\leftarrow g_t + \\lambda \\theta_{t-1} & \\text{Add weight decay term to the gradient} \\\\
					& \\hspace{5mm}m_t \\leftarrow \\beta_1 m_{t-1} + (1 - \\beta_1) g_t & \\text{Update biased first moment estimate} \\\\
					& \\hspace{5mm}v_t \\leftarrow \\beta_2 v_{t-1} + (1-\\beta_2) g^2_t & \\text{Update biased second moment estimate} \\\\
					& \\hspace{5mm}\\widehat{m_t} \\leftarrow m_t/\\big(1-\\beta_1^t \\big) & \\text{Compute bias-corrected first moment estimate} \\\\
					& \\hspace{5mm}\\widehat{v_t} \\leftarrow v_t/\\big(1-\\beta_2^t \\big) & \\text{Compute bias-corrected second moment estimate} \\\\
					& \\hspace{5mm}\\textbf{if} \\: \\text{amsgrad} & \\\\
					& \\hspace{10mm}\\widehat{v_t}^\\mathrm{max} \\leftarrow \\mathrm{max}(\\widehat{v_t}^\\mathrm{max}, \\widehat{v_t}) & \\text{Update the maximum of the second moment estimates} \\\\
					& \\hspace{10mm}\\theta_t \\leftarrow \\theta_{t-1} - \\gamma \\widehat{m_t}/\\big(\\sqrt{\\widehat{v_t}^\\mathrm{max}} + \\epsilon \\big) & \\text{Update parameters with AMSGrad correction} \\\\
					& \\hspace{5mm}\\textbf{else} & \\\\
					& \\hspace{10mm}\\theta_t \\leftarrow \\theta_{t-1} - \\gamma \\widehat{m_t}/\\big(\\sqrt{\\widehat{v_t}} + \\epsilon \\big) & \\text{Update parameters without AMSGrad correction} \\\\
					& \\rule{${rule_width}mm}{0.4pt} & \\\\[-1.ex]
					& \\bf{return} \\: \\theta_t & \\text{Return the updated parameters} \\\\[-1.ex]
					& \\rule{${rule_width}mm}{0.4pt} & \\\\[-1.ex]
				\\end{aligned}
			`
			],
			"dependencies": [],
			"variables": {
				"\\theta": {
					"name": "Weights"
				},
				"\\eta": default_vars["eta"],
				"\\epsilon": default_vars["epsilon"],
				"\\nabla": default_vars["nabla_operator"],
			}
		}
	}
}

function get_input_layer(input_shape) {
	var input_layer = [["x"]];

	return input_layer;
}

function get_y_output_shapes (output_shape) {
	var y_layer = [];

	for (var output_shape_idx = 0; output_shape_idx < output_shape[1]; output_shape_idx++) {
		y_layer.push(["y_{" + output_shape_idx + "}"]);
	}

	return y_layer;
}

function get_reshape_string (input_layer, layer_idx) {
	var str = "";
	var original_input_shape = JSON.stringify(model.layers[layer_idx].getInputAt(0).shape.filter(Number));
	var original_output_shape = JSON.stringify(model.layers[layer_idx].getOutputAt(0).shape.filter(Number));
	var general_reshape_string = "_{\\text{Shape: " + original_input_shape + "}} \\xrightarrow{\\text{Reshape}} \\text{New Shape: }" + original_output_shape;
	if(layer_idx > 1) {
		str += _get_h(layer_idx) + " = " + _get_h(layer_idx - 1) + general_reshape_string;
	} else {
		str += array_to_latex(input_layer, "Input") + " = h" + general_reshape_string;
	}

	return str;
}

function get_layer_normalization_equation(layer_idx) {
	const gamma_val = model?.layers[layer_idx]?.weights[0]?.val;
	var gamma = "\\text{Cannot be determined}";
	if (gamma_val !== undefined) {
		gamma = array_to_latex_matrix(array_sync(gamma_val));
	}

	const beta_val = model?.layers[layer_idx]?.weights[1]?.val;
	var beta = "\\text{Cannot be determined}";
	if (beta_val !== undefined) {
		beta = array_to_latex_matrix(array_sync(beta_val));
	}

	return `
	\\begin{matrix}
	    \\beta = ${beta}, \\gamma = ${gamma} \\\\
	    \\mu_{i} = \\frac{1}{N} \\sum_{j=1}^{N} x_{i,j} & \\text{(mean over features of sample i)} \\\\
	    \\sigma^2_{i} = \\frac{1}{N} \\sum_{j=1}^{N} (x_{i,j} - \\mu_i)^2 & \\text{(variance over features of sample i)} \\\\
	    \\hat{x}_{i,j} = \\frac{x_{i,j} - \\mu_i}{\\sqrt{\\sigma_i^2 + \\epsilon}} \\\\
	    ${_get_h(layer_idx + 1)} = \\gamma \\odot \\hat{x}_i + \\beta & \\text{(elementwise scaling and shift)}
	\\end{matrix}
    `;
}

function unsupported_layer_type_equation (layer_idx, this_layer_type) {
	log(`Invalid layer type for layer ${layer_idx}: ${this_layer_type}`);

	return "\\text{(The equations for this layer are not yet defined)}";
}

function model_to_latex () {
	var layers = model?.layers;
	var input_shape = get_first_layer_input_shape();
	if(!input_shape || !layers) { return ""; }

	var output_shape = model.layers[model.layers.length - 1].outputShape;
	var activation_function_equations = get_activation_functions_equations();
	var loss_equations = get_loss_equations();
	var default_vars = get_default_vars();
	var str = "";
	var layer_data = get_layer_data();
	var y_layer = get_y_output_shapes(output_shape);

	var colors = get_colors_from_old_and_new_layer_data(started_training ? prev_layer_data : [], layer_data);

	var input_layer = get_input_layer(input_shape);

	activation_string = "";
	shown_activation_equations = [];

	for (var layer_idx = 0; layer_idx < model.layers.length; layer_idx++) {
		var this_layer_type = $($(".layer_type")[layer_idx]).val();
		var layer_has_bias = Object.keys(model.layers[layer_idx]).includes("bias") && model.layers[layer_idx].bias !== null;

		if(layer_idx == 0) {
			str += "\n<h2>Layers:</h2>\n";
		}

		str += "<div class='temml_me'> \\text{Layer " + layer_idx + " (" + this_layer_type + "):} \\qquad ";

		str += single_layer_to_latex(layer_idx, this_layer_type, activation_function_equations, layer_data, colors, y_layer, input_layer, layer_has_bias);

		str += "</div><br>";
	}

	str += get_loss_equations_string(loss_equations);
	str += get_optimizer_latex_equations();

	prev_layer_data = layer_data;

	return str_or_activation_plus_str(str);
}

function single_layer_to_latex(layer_idx, this_layer_type, activation_function_equations, layer_data, colors, y_layer, input_layer, layer_has_bias) {
	var _af = get_layer_activation_function(layer_idx);

	var str = "";

	if(this_layer_type == "dense") {
		str += get_dense_latex(layer_idx, activation_function_equations, layer_data, colors, y_layer, input_layer);
	} else if (this_layer_type == "flatten") {
		str += get_flatten_string(layer_idx);
	} else if (this_layer_type == "reshape") {
		str += get_reshape_string(input_layer, layer_idx);
	} else if (["elu", "leakyReLU", "reLU", "softmax", "thresholdedReLU"].includes(this_layer_type)) {
		str += get_activation_functions_latex(this_layer_type, input_layer, layer_idx, y_layer, layer_data, activation_function_equations);
	} else if (this_layer_type == "batchNormalization") {
		str += get_batch_normalization_latex(layer_data, y_layer, layer_idx);
	} else if (this_layer_type == "dropout") {
		str += get_dropout_latex(layer_idx);
	} else if (this_layer_type == "MultiActivation") {
		str += get_multiactivation_layer_latex(layer_idx);
	} else if (this_layer_type == "Snake") {
		str += get_snake_layer_latex(layer_idx);
	} else if (this_layer_type == "DebugLayer") {
		str += get_debug_layer_latex();
	} else if (this_layer_type == "gaussianDropout") {
		str += get_gaussian_dropout_latex(layer_idx);
	} else if (this_layer_type == "alphaDropout") {
		str += get_alpha_dropout_latex(layer_idx);
	} else if (this_layer_type == "gaussianNoise") {
		str += get_gaussian_noise_latex(layer_idx);
	} else if (this_layer_type == "averagePooling1d") {
		str += get_average_pooling_1d_latex(layer_idx);
	} else if (this_layer_type == "averagePooling2d") {
		str += get_average_pooling_2d_latex(layer_idx)
	} else if (this_layer_type == "averagePooling3d") {
		str += get_average_pooling_3d_latex(layer_idx);
	} else if (this_layer_type == "conv1d") {
		str += get_conv1d_latex(layer_idx, layer_has_bias);
	} else if (this_layer_type == "conv2d") {
		str += get_conv2d_latex(layer_idx, _af, layer_has_bias);
	} else if (this_layer_type == "conv3d") {
		str += get_conv3d_latex(layer_idx, _af, layer_has_bias);
	} else if (this_layer_type == "maxPooling1d") {
		str += get_max_pooling_1d_latex(layer_idx);
	} else if (this_layer_type == "maxPooling2d") {
		str += get_max_pooling_2d_latex(layer_idx);
	} else if (this_layer_type == "maxPooling3d") {
		str += get_max_pooling_3d_latex(layer_idx);
	} else if (this_layer_type == "upSampling2d") {
		str += get_upsampling2d_latex(layer_idx);
	} else if (this_layer_type == "separableConv2d") {
		str += get_seperable_conv2d_latex(layer_idx);
	} else if (this_layer_type == "depthwiseConv2d") {
		str += get_depthwise_conv2d_latex(layer_idx);
	} else if (this_layer_type == "conv2dTranspose") {
		str += get_conv2d_transpose_latex(layer_idx);
	} else if (this_layer_type == "layerNormalization") {
		str += get_layer_normalization_equation(layer_idx);
	} else {
		str += unsupported_layer_type_equation(layer_idx, this_layer_type);
	}

	return str;
}

function get_alpha_dropout_latex (layer_idx) {
	const dropout_rate = get_item_value(layer_idx, "dropout");
	if(looks_like_number(dropout_rate)) {
		return "\\text{Adds alpha dropout to the input (only active during training), Dropout-Rate: " + dropout_rate + ".}"
	}

	return "\\text{Invalid dropout-rate-setting for this layer. Must be a number between 0 and 1}";
}

function get_gaussian_noise_latex(layer_idx) {
	const stddev = get_item_value(layer_idx, "stddev");
	if(looks_like_number(stddev)) {
		return "\\text{Adds gaussian noise to the input (only active during training), Standard-deviation: " + stddev + ".}";
	}

	return "\\text{Invalid stddev for this layer.}";
}

function get_max_pooling_1d_latex (layer_idx) {
	return _get_h(layer_idx + 1) + " = \\max_{i=1}^{N}" + _get_h(layer_idx) + "(x+i)"
}

function get_max_pooling_2d_latex (layer_idx) {
	return _get_h(layer_idx + 1) + " = \\max_{i=1}^{N} \\max_{j=1}^{M} " + _get_h(layer_idx) + "(x+i, y+j)"
}

function get_max_pooling_3d_latex (layer_idx) {
	return _get_h(layer_idx + 1) + " = \\max_{i=1}^{N} \\max_{j=1}^{M} \\max_{l=1}^{P} " + _get_h(layer_idx) + "(x+i, y+j, z+l)"
}

function get_dropout_latex (layer_idx) {
	const dropout_rate = get_item_value(layer_idx, "dropout_rate");
	if(looks_like_number(dropout_rate) && 0 <= parse_int(dropout_rate) <= 1) {
		return `\\text{Setting ${parse_float(dropout_rate) * 100}\\% of the input values to 0 randomly}`;
	}

	err(`Invalid dropout setting: ${dropout_rate}`);
	return "\\text{Invalid dropout-rate-setting for this layer. Must be a number between 0 and 1}";
}

function get_multiactivation_layer_latex(layer_idx) {
	const _h = _get_h(layer_idx);

	// nächster Layer
	let _h_next = _h;
	if ((layer_idx + 1) < get_number_of_layers()) {
		_h_next = _get_h(layer_idx + 1);
	}

	// Gewichte extrahieren
	const weights = model?.layers[layer_idx]?.weights || [];
	if (!weights || weights.length === 0) {
		return "\\text{Cannot determine weights for MultiActivation layer}";
	}

	// Hilfsfunktion um Value zu synchronisieren
	const wVal = (name) => {
		const w = weights.find(w => w.name.includes(name));
		if (!w || !w.val) return null;
		return array_sync(w.val);
	};

	const aRelu = wVal("aRelu") ?? 0;
	const aSnake = wVal("aSnake") ?? 0;
	const aElu = wVal("aElu") ?? 0;
	const aSin = wVal("aSin") ?? 0;
	const snakeAlpha = wVal("snakeAlpha") ?? 1;

	// Latex-String bauen
	const terms = [];
	if (aRelu !== 0) terms.push(`${aRelu} \\cdot \\mathrm{ReLU}(${_h})`);
	if (aSnake !== 0) terms.push(`${aSnake} \\cdot \\left(${_h} + \\frac{\\sin^2(${snakeAlpha} \\cdot ${_h})}{${snakeAlpha}}\\right)`);
	if (aElu !== 0) terms.push(`${aElu} \\cdot \\mathrm{ELU}(${_h})`);
	if (aSin !== 0) terms.push(`${aSin} \\cdot \\sin(${_h})`);

	if (terms.length === 0) return "\\text{All weights are zero}";

	return `${_h_next} = ${terms.join(" + ")}`;
}

function get_snake_layer_latex (layer_idx) {
	const _h = _get_h(layer_idx);
	var _h_next = _h;
	if((layer_idx + 1) <= get_number_of_layers()) {
		_h_next = _get_h(layer_idx + 1);
	}
	var alpha = model?.layers[layer_idx]?.weights[0]?.val;
	var beta = model?.layers[layer_idx]?.weights[1]?.val;

	if(alpha === undefined || alpha === null || alpha == "" || beta === undefined || beta === null || beta == "") {
		return "\\text{Cannot determine alpha for snake layer}";
	} else {
		alpha = array_sync(alpha);
		beta = array_sync(beta);
	}

	return `${_h_next} = ${beta} \\left(${_h} + \\frac{\\sin^2\(${alpha} \\cdot ${_h} \)}{${alpha}}\\right)`;
}

function get_debug_layer_latex() {
	return "\\text{The debug layer does nothing to the data, but just prints it out to the developers console.}"
}

function get_gaussian_dropout_latex (layer_idx) {
	const dropout_rate = get_item_value(layer_idx, "dropout");
	if(looks_like_number(dropout_rate) && 0 <= parse_int(dropout_rate) <= 1) {
		return `\\text{Drops values to 0 (dropout-rate: ${dropout_rate})}`;
	}

	return "\\text{Invalid dropout-rate-setting for this layer. Must be a number between 0 and 1}";
}

function get_average_pooling_1d_latex(layer_idx) {
	const _h = _get_h(layer_idx);
	const _h_next = _get_h(layer_idx + 1);

	var pool_size_x = get_item_value(layer_idx, "pool_size_x");

	if (!looks_like_number(pool_size_x)) {
		return `\\text{Invalid settings for this layer}`;
	}

	pool_size_x = parse_int(pool_size_x);

	return `${_h_next} = \\frac{1}{N} \\sum_{i=1}^{N = ${pool_size_x}} ${_h} \\left(x + i\\right) \\\\`;
}

function get_average_pooling_2d_latex (layer_idx) {
	const _h = _get_h(layer_idx);
	const _h_next = _get_h(layer_idx + 1);

	var pool_size_x = get_item_value(layer_idx, "pool_size_x");
	var pool_size_y = get_item_value(layer_idx, "pool_size_y");

	if(!looks_like_number(pool_size_x) || !looks_like_number(pool_size_y)) {
		return `\\text{Invalid settings for this layer}`;
	}

	pool_size_x = parse_int(pool_size_x);
	pool_size_y = parse_int(pool_size_y);

	return `${_h_next} = \\frac{1}{N \\times M} \\sum_{i=1}^{N = ${pool_size_x}} \\sum_{j=1}^{M = ${pool_size_y}} ${_h} \\left(x + i, y + j\\right) \\\\`;
}

function get_average_pooling_3d_latex(layer_idx) {
	const _h = _get_h(layer_idx);
	const _h_next = _get_h(layer_idx + 1);

	var pool_size_x = get_item_value(layer_idx, "pool_size_x");
	var pool_size_y = get_item_value(layer_idx, "pool_size_y");
	var pool_size_z = get_item_value(layer_idx, "pool_size_z");

	if (!looks_like_number(pool_size_x) || !looks_like_number(pool_size_y) || !looks_like_number(pool_size_z)) {
		return `\\text{Invalid settings for this layer}`;
	}

	pool_size_x = parse_int(pool_size_x);
	pool_size_y = parse_int(pool_size_y);
	pool_size_z = parse_int(pool_size_z);

	return `${_h_next} = \\frac{1}{D \\times H \\times W} \\sum_{d=1}^{D = ${pool_size_x}} \\sum_{h=1}^{H = ${pool_size_y}} \\sum_{w=1}^{W = ${pool_size_z}} ${_h} \\left(x + d, y + h, z + w\\right) \\\\`;
}

function get_depthwise_conv2d_latex(layer_idx) {
	const kernel = model?.layers[layer_idx]?.weights?.[0]?.val;
	const bias = model?.layers[layer_idx]?.weights?.[1]?.val;

	var kernel_latex = "";
	var bias_latex = "";

	if (kernel && !tensor_is_disposed(kernel)) {
		const synced_kernel = array_sync(kernel);
		kernel_latex = array_to_latex_matrix(synced_kernel);
	}

	if (bias && !tensor_is_disposed(bias)) {
		const synced_bias = array_sync(bias);
		bias_latex = array_to_latex_matrix(synced_bias);
	}

	return `
h^{(${layer_idx + 1})}_{i,j,c} =
\\sum_{m=0}^{k_h-1} \\sum_{n=0}^{k_w-1}
	${kernel_latex}_{m,n,c} \\cdot
h^{(${layer_idx})}_{\\frac{i+m-p_h}{s_h},\\frac{j+n-p_w}{s_w},c}
	${bias_latex ? "+ " + bias_latex : ""}
`;
}

function get_seperable_conv2d_latex(layer_idx) {
	const depthwise_kernel = model?.layers[layer_idx]?.weights?.[0]?.val;
	const pointwise_kernel = model?.layers[layer_idx]?.weights?.[1]?.val;
	const bias = model?.layers[layer_idx]?.weights?.[2]?.val;

	var depthwise_latex = "";
	var pointwise_latex = "";
	var bias_latex = "";

	if (depthwise_kernel && !tensor_is_disposed(depthwise_kernel)) {
		const synced_depthwise = array_sync(depthwise_kernel);
		depthwise_latex = array_to_latex_matrix(synced_depthwise);
	}

	if (pointwise_kernel && !tensor_is_disposed(pointwise_kernel)) {
		const synced_pointwise = array_sync(pointwise_kernel);
		pointwise_latex = array_to_latex_matrix(synced_pointwise);
	}

	if (bias && !tensor_is_disposed(bias)) {
		const synced_bias = array_sync(bias);
		bias_latex = array_to_latex_matrix(synced_bias);
	}

	return `
{${_get_h(layer_idx + 1)}} = \\begin{matrix}
z_{i,j,c} = \\sum_{m=0}^{k_h-1} \\sum_{n=0}^{k_w-1}
	${depthwise_latex}_{m,n,c} \\cdot
{${_get_h(layer_idx)}}_{\\frac{i+m-p_h}{s_h},\\frac{j+n-p_w}{s_w},c},\\\\[6pt]
{${_get_h(layer_idx + 1)}}_{i,j,d} = \\sum_{c=1}^{C_{in}}
	${pointwise_latex}_{c,d} \\cdot z_{i,j,c}
	${bias_latex ? "+ " + bias_latex : ""}
\\end{matrix}
`;
}

function get_conv2d_transpose_latex(layer_idx) {
	const kernel = model?.layers[layer_idx]?.kernel?.val;
	const bias = model?.layers[layer_idx]?.bias?.val;

	var kernel_latex = "";
	var bias_latex = "";

	if(kernel && !tensor_is_disposed(kernel)) {
		var synced_kernel = array_sync(kernel);
		kernel_latex = array_to_latex_matrix(synced_kernel);
	}

	if(bias && !tensor_is_disposed(bias)) {
		var synced_bias = array_sync(bias);
		bias_latex = array_to_latex_matrix(synced_bias);
	}

	return `
h^{(${layer_idx + 1})}_{i,j} = 
\\sum_{m=0}^{k_h-1} \\sum_{n=0}^{k_w-1} 
	${kernel_latex}_{m,n} \\cdot 
h^{(${layer_idx})}_{\\frac{i+m-p_h}{s_h}, \\frac{j+n-p_w}{s_w}}
	${bias_latex ? "+ " + bias_latex : ""}
`;
}

function get_conv3d_latex (layer_idx, _af, layer_has_bias) {
	var str = "";
	str += "\\begin{matrix}";
	str += _get_h(layer_idx + 1) + " = ";
	str += add_activation_function_to_latex (_af, "begin");
	str += "\\sum_{i=1}^{N} \\sum_{j=1}^{M} \\sum_{l=1}^{P} \\left( \\sum_{p=1}^{K} \\sum_{q=1}^{L} \\sum_{r=1}^{R} " + _get_h(layer_idx) + "(x+i, y+j, z+l, c) \\times \\text{kernel}(p, q, r, c, k) \\right)";
	str += add_activation_function_to_latex (_af, "end");

	var layer_bias_string = "";

	if(layer_has_bias) {
		str += " + \\text{bias}(k)";
		var bias_shape = get_shape_from_array(array_sync(model.layers[layer_idx].bias.val, true));
		layer_bias_string += `\\text{Bias}^{${bias_shape.join(", ")}} = ` + array_to_latex_matrix(array_sync(model.layers[layer_idx].bias.val, true));
	}

	str += " \\\\";

	const kernel_val = model?.layers[layer_idx]?.kernel?.val;

	if(!kernel_val) {
		err("Could not get kernel for conv 3d");
		return "\\text{Could not get kernel for conv 3d}";
	}

	var kernel_shape = get_shape_from_array(array_sync(kernel_val, true));
	str += `\\text{Kernel}^{${kernel_shape.join(", ")}} = ` + array_to_latex_matrix(array_sync(model.layers[layer_idx].kernel.val, true));

	if(layer_bias_string) {
		str += ` \\\\ \n${layer_bias_string}`;
	}

	str += "\\end{matrix}";

	return str;
}

function show_could_not_get_msg (name) {
	dbg(`Could not get ${name}. It may have been disposed already.`);
}

function get_conv2d_latex (layer_idx, _af, layer_has_bias) {
	var str = "";
	str += "\\begin{matrix}";
	str += _get_h(layer_idx + 1) + " = ";
	str += add_activation_function_to_latex (_af, "begin");
	str += "\\sum_{i=1}^{N} \\sum_{j=1}^{M} \\left( \\sum_{p=1}^{K} \\sum_{q=1}^{L} " + _get_h(layer_idx) + "(x+i, y+j, c) \\times \\text{kernel}(p, q, c, k) \\right)";

	var layer_bias_string = "";

	if(layer_has_bias) {
		str += " + \\text{bias}(k)";
		var bias_val = "";
		try {
			var bias_val = null;

			if (
				model &&
				Array.isArray(model.layers) &&
				model.layers[layer_idx] &&
				model.layers[layer_idx].bias &&
				typeof model.layers[layer_idx].bias.val !== "undefined" &&
				!model.layers[layer_idx].bias.disposed
			) {
				bias_val = model.layers[layer_idx].bias.val;
			}

			if (bias_val) {
				var synced_data = tidy(() => { array_sync(bias_val, true) });
				if (synced_data) {
					var bias_shape = get_shape_from_array(synced_data);
					layer_bias_string += `\\text{Bias}^{${bias_shape.join(", ")}} = ` + array_to_latex_matrix(synced_data);
				}
			} else {
				show_could_not_get_msg("bias");
			}
		} catch (e) {
			show_could_not_get_msg("bias");
		}
	}

	str += add_activation_function_to_latex(_af, "end");

	str += " \\\\";

	try {
		var this_kernel_val = null;
		if (
			model &&
			Array.isArray(model.layers) &&
			model.layers[layer_idx] &&
			model.layers[layer_idx].kernel &&
			typeof model.layers[layer_idx].kernel.val !== "undefined" &&
			!model.layers[layer_idx].kernel.disposed
		) {
			this_kernel_val = model.layers[layer_idx].kernel.val;
		}

		if (this_kernel_val) {
			var synced_data = array_sync(this_kernel_val, true);
			if (synced_data) {
				var kernel_shape = get_shape_from_array(synced_data);
				str += `\\text{Kernel}^{${kernel_shape.join(", ")}} = ` + array_to_latex_matrix(synced_data);

				if (layer_bias_string) {
					str += ` \\\\ \n${layer_bias_string}`;
				}
			} else {
				show_could_not_get_msg("kernel");
			}
		} else {
			show_could_not_get_msg("kernel");
		}
	} catch (e) {
		show_could_not_get_msg("kernel");
	}

	str += "\\end{matrix}";

	return str;
}

function get_upsampling2d_latex (layer_idx) {
	const latexFormula = `
				{${_get_h(layer_idx + 1)}}_{i,j,c} = {${_get_h(layer_idx)}}_{\\left\\lfloor \\frac{i}{s_h} \\right\\rfloor, \\left\\lfloor \\frac{j}{s_w} \\right\\rfloor, c}
			`;

	return latexFormula;
}

function str_or_activation_plus_str (str) {
	if(activation_string && str) {
		return `<h2>${language[lang]["activation_functions"]}:</h2>${activation_string}${str}`;
	} else {
		if(str) {
			return str;
		}
	}

	return "No LaTeX-equations could be generated";
}

function get_dec_points_math_mode() {
	const val = $("#decimal_points_math_mode").val();
	const n = parseInt(val, 10);
	if (isNaN(n)) return 16;
	return n;
}

function get_conv1d_latex (layer_idx, layer_has_bias) {
	var str = "";
	str += "\\begin{matrix}";
	str += _get_h(layer_idx + 1) + " = \\sum_{i=1}^{N} \\left( \\sum_{p=1}^{K} " + _get_h(layer_idx) + "(x+i, c) \\times \\text{kernel}(p, c, k) \\right) \\\\";

	var layer_bias_string = "";

	if(layer_has_bias) {
		str += " + \\text{bias}(k)";
		var bias_shape = get_shape_from_array(array_sync(model.layers[layer_idx].bias.val, true));
		layer_bias_string += `\\text{Bias}^{${bias_shape.join(", ")}} = ` + array_to_latex_matrix(array_sync(model.layers[layer_idx].bias.val, true));
	}

	str += " \\\\";

	var kernel_shape = get_shape_from_array(array_sync(model.layers[layer_idx].kernel.val, true));
	str += `\\text{Kernel}^{${kernel_shape.join(", ")}} = `+ array_to_latex_matrix(array_sync(model.layers[layer_idx].kernel.val, true));

	if(layer_bias_string) {
		str += ` \\\\ \n${layer_bias_string}`;
	}

	str += "\\end{matrix}";

	return str;
}

function get_layer_activation_name(layer_idx) {
	if (!model || typeof model !== 'object') return null;
	if (!Array.isArray(model?.layers)) return null;
	if (layer_idx < 0 || layer_idx >= model.layers.length) return null;

	const layer = model?.layers[layer_idx];
	if (!layer || typeof layer !== 'object') return null;

	const activation = layer.activation;
	if (!activation || typeof activation !== 'object') return null;

	const constructor = activation.constructor;
	if (!constructor || typeof constructor !== 'function') return null;

	// bevorzugt className, fallback auf name
	return constructor.className || constructor.name || null;
}

function format_dense_layer_equation(layer_idx, layer_data, y_layer, input_layer, activation_start) {
	var left_side = get_left_side(layer_idx, layer_data, y_layer, activation_start);
	var right_side = get_right_side(layer_idx, input_layer);
	return { left: left_side, right: right_side };
}

function get_left_side(layer_idx, layer_data, y_layer, activation_start) {
	if (layer_idx === layer_data.length - 1) {
		return array_to_latex(y_layer, "Output") + " = " + activation_start;
	}
	return _get_h(layer_idx) + " = " + activation_start;
}

function get_right_side(layer_idx, input_layer) {
	if (layer_idx === 0) {
		return array_to_latex(input_layer, "Input");
	}
	return _get_h(Math.max(0, layer_idx - 1));
}

function get_dense_latex (layer_idx, activation_function_equations, layer_data, colors, y_layer, input_layer) {
	var str = "";
	try {
		var activation_name = get_layer_activation_name(layer_idx);

		if (activation_name === null) {
			return "\\text{Problem trying to get activation name}";
		}

		if(activation_name == "linear") {
			//
		} else if(Object.keys(activation_function_equations).includes(activation_name)) {
			if(!shown_activation_equations.includes(activation_name)) {
				var this_activation_string = activation_function_equations[activation_name]["equation"];

				var this_activation_array = [];

				if(Object.keys(activation_function_equations[activation_name]).includes("lower_limit")) {
					this_activation_array.push("\\text{Lower-limit: } " + activation_function_equations[activation_name]["lower_limit"]);
				}

				if(Object.keys(activation_function_equations[activation_name]).includes("upper_limit")) {
					this_activation_array.push("\\text{Upper-limit: } " + activation_function_equations[activation_name]["upper_limit"]);
				}

				if(this_activation_array.length) {
					this_activation_string = this_activation_string + "\\qquad (" + this_activation_array.join(", ") + ")";
				}

				activation_string += "<div class='temml_me'>" + this_activation_string + "</div><br>\n";

				shown_activation_equations.push(activation_name);
			}
		} else {
			err("Activation name '" + activation_name + "' not found");
		}

		var activation_start = "";

		if(activation_name != "linear") {
			activation_start = "\\mathrm{\\underbrace{" + activation_name + "}_{\\mathrm{Activation}}}\\left(";
		}

		var this_layer_data_kernel = layer_data[layer_idx].kernel;
		if(this_layer_data_kernel.length) {
			var kernel_name = "\\text{" + language[lang]["weight_matrix"] + "}^{" + array_size(this_layer_data_kernel).join(" \\times ") + "}";

			var first_part = array_to_latex_color(this_layer_data_kernel, kernel_name, colors[layer_idx].kernel);

			var eq = format_dense_layer_equation(layer_idx, layer_data, y_layer, input_layer, activation_start);

			str += eq.left;

			str += a_times_b(first_part, eq.right);

			try {
				if("bias" in layer_data[layer_idx] && layer_data[layer_idx].bias.length) {
					str += " + " + array_to_latex_color([layer_data[layer_idx].bias], "Bias", [colors[layer_idx].bias], 1);
				}
			} catch (e) {
				err(e);
			}

			if(activation_name != "linear") {
				str += "\\right)";
			}
		} else {
			return "\\text{" + language[lang]["invalid_layer_settings_cannot_render"] + "}";
		}
	} catch (e) {
		wrn(`Caught error ${e}`);
		if (e && e.stack) {
			err("Full stack:\n" + e.stack);
		}
	}

	return str;
}

function get_activation_functions_latex(this_layer_type, input_layer, layer_idx, y_layer, layer_data, activation_function_equations) {
	var str = "";
	var activation_name = this_layer_type;
	if(activation_name == "leakyReLU") {
		activation_name = "LeakyReLU";
	} else if(activation_name == "reLU") {
		activation_name = "relu";
	}

	var prev_layer_name = "";

	if(layer_idx == 0) {
		prev_layer_name += array_to_latex(input_layer, "Input");
	} else {
		prev_layer_name += _get_h(layer_idx - 1);
	}

	if(layer_idx == layer_data.length - 1) {
		str += array_to_latex(y_layer, "Output") + " = ";
	} else {
		str += _get_h(layer_idx) + " = ";
	}

	const varnames = {
		"reLU": "max_value",
		"elu": "alpha",
		"leakyReLU": "alpha",
		"Snake": "alpha",
		"softmax": "",
		"thresholdedReLU": "theta"
	};

	if(Object.keys(activation_function_equations).includes(activation_name)) {
		var this_activation_string = activation_function_equations[activation_name]["equation_no_function_name"];

		this_activation_string = this_activation_string.replaceAll("REPLACEME", "{" + prev_layer_name + "}");

		if(!Object.keys(varnames).includes(this_layer_type)) {
			err(`Missing varname for ${this_layer_type}`);

			return `\\text{Missing value for ${this_layer_type}}`;
		}

		if(varnames[this_layer_type].length != "") {
			const varname = varnames[this_layer_type]

			var var_str = get_item_value(layer_idx, varname);

			if(looks_like_number(var_str)) {
				var var_float = parse_float(var_str);

				if(typeof(var_float) == "number") {
					this_activation_string = this_activation_string.replaceAll("ALPHAREPL", "{" + var_float + "}");
					this_activation_string = this_activation_string.replaceAll(`\\${varname}`, "\\underbrace{" + var_float + `}_{\\${varname}} \\cdot `);
				}

				var $theta = get_item_value(layer_idx, "theta");
				if(looks_like_number($theta)) {
					var theta = parse_float($theta);
					if(typeof(theta) == "number") {
						this_activation_string = this_activation_string.replaceAll("\\theta", "{\\theta = " + theta + "} \\cdot ");
					}
				}

				this_activation_string = this_activation_string.replaceAll("REPLACEME", "{" + prev_layer_name + "}");
			} else {
				this_activation_string = "\\text{Invalid layer settings detected}";
			}
		}

		var this_activation_array = [];

		if(Object.keys(activation_function_equations[activation_name]).includes("upper_limit")) {
			this_activation_array.push("\\text{Lower-limit: } " + activation_function_equations[activation_name]["lower_limit"]);
		}

		if(Object.keys(activation_function_equations[activation_name]).includes("upper_limit")) {
			this_activation_array.push("\\text{Upper-limit: } " + activation_function_equations[activation_name]["upper_limit"]);
		}

		var max_value_item = $($(".layer_setting")[layer_idx]).find(".max_value");

		if(max_value_item.length) {
			var max_value = max_value_item.val();
			if(looks_like_number(max_value)) {
				this_activation_array.push("\\text{Capped at maximally " + max_value + "}");
			}
		}

		if(this_activation_array.length) {
			this_activation_string = this_activation_string + "\\qquad (" + this_activation_array.join(", ") + ")";
		}

		str += this_activation_string + "\n";
	}

	return str;
}

function get_batch_normalization_latex (layer_data, y_layer, layer_idx) {
	var str = "";
	var prev_layer_name = "";

	var outname = "";

	if(layer_idx == layer_data.length - 1) {
		outname = array_to_latex(y_layer, "Output") + " \\longrightarrow ";
	} else {
		outname += _get_h(layer_idx) + " \\longrightarrow ";
	}

	var mini_batch_mean = "\\underbrace{\\mu_\\mathcal{B} = \\frac{1}{n} \\sum_{i=1}^n x_i}_{\\text{Batch mean}}";

	var mini_batch_variance = "\\underbrace{\\sigma_\\mathcal{B}^2 = \\frac{1}{n} \\sum_{i = 1}^n \\left(x_i - \\mu_\\mathcal{B}\\right)^2}_{\\text{Batch variance}}";

	var _epsilon = model?.layers[layer_idx]?.epsilon;

	var x_equation = '\\epsilon \\text{could not be determined}';

	if(_epsilon !== undefined) {
		x_equation = "\\overline{x_i} \\longrightarrow \\underbrace{\\frac{x_i - \\mu_\\mathcal{B}}{\\sqrt{\\sigma_\\mathcal{B}^2 + \\epsilon \\left( = " + _epsilon + "\\right)}}}_\\text{Normalize}";
	}

	var beta_string = "";
	var gamma_string = "";
	if("beta" in layer_data[layer_idx]) {
		beta_string = array_to_latex_matrix(array_to_fixed(layer_data[layer_idx].beta, get_dec_points_math_mode()));
		beta_string = "\\displaystyle " + beta_string;
	}
	if("gamma" in layer_data[layer_idx]) {
		gamma_string = array_to_latex_matrix(array_to_fixed(layer_data[layer_idx].gamma, get_dec_points_math_mode()));
		gamma_string = "\\displaystyle " + gamma_string;
	}

	var y_equation = "y_i = \\underbrace{\\underbrace{\\gamma}_{" + gamma_string + "}\\overline{x_i} + \\underbrace{\\beta}_{" + beta_string + "}}_{\\text{Scaling\\&shifting}}";

	var between_equations = ",\\qquad ";
	var skip_between_equations = ",\\\\[10pt]\\\\\n";

	str += "\\begin{array}{c}\n";
	str += "\\displaystyle " + mini_batch_mean + between_equations;
	str += "\\displaystyle " + mini_batch_variance + between_equations;
	str += "\\displaystyle " + x_equation + skip_between_equations;
	str += "\\displaystyle " + outname + y_equation;
	str += "\\end{array}\n";

	return str;
}

function get_optimizer_latex_equations () {
	var optimizer_equations = get_optimizer_equations();
	var str = "";
	var optimizer = get_optimizer();
	if(Object.keys(optimizer_equations).includes(optimizer)) {
		var this_optimizer = optimizer_equations[optimizer];

		var dependencies = this_optimizer["dependencies"];

		str += "<h2>Optimizer:</h2>\n";

		if(this_optimizer.variables) {
			var varnames = Object.keys(this_optimizer.variables);
			for (var m = 0; m < varnames.length; m++) {
				var thisvarname = varnames[m];
				if(!m) {
					str += "<h3>Variables and definitions:</h3>\n";
				}

				var origin = this_optimizer.variables[thisvarname]["origin"];

				str += "<div class='temml_me'> \\displaystyle \\text{" + this_optimizer.variables[thisvarname]["name"] + ": } " + thisvarname;
				if(Object.keys(this_optimizer.variables[thisvarname]).includes("value")) {
					str += " = " + this_optimizer.variables[thisvarname]["value"];
				} else if(origin !== undefined) {
					origin = origin.replace("OPTIMIZERNAME", optimizer);
					var valofparam = $("#" + origin).val();
					str += " = " + valofparam;
				}
				str += "</div><br>";

				if(Object.keys(this_optimizer.variables).includes("example")) {
					str += "<div class='temml_me'> \\displaystyle " + this_optimizer.variables.example + " </div><br>";
				}
			}

			str += "<h3 style='display: none' id='optimizer_variables_header'>Optimizer variables:</h3>\n";
			str += "<div style='display: none' id='optimizer_variables_div'></div>"

			str += `<h3>${language[lang]["optimizer_algorithm"]}:</h3>\n`;
			str += "<p>Taken (and slightly modified) from the <a href='https://pytorch.org/docs/stable/optim.html' target='_blank'>PyTorch-Optimizer API, where there's more info on all optimizers</a>.</p>";
		}

		if (dependencies) {
			for (var m = 0; m < dependencies.length; m++) {
				if(dependencies[m] != optimizer) {
					str += "<div class='temml_me'>\\displaystyle \\text{" + dependencies[m] + ": }" + optimizer_equations[dependencies[m]]["equations"].join(" </div><br>\n<div class='temml_me'> ") + " </div><br>";
				}
			}
		}

		str += "<div class='temml_me'> \\displaystyle \\text{" + optimizer + ": }" + this_optimizer["equations"].join(" </div><br>\n<div class='temml_me'> ") + " </div><br>";
	} else {
		log(language[lang]["unknown_optimizer"] + " " + optimizer);
	}

	return str;
}

function get_loss_equations_string(loss_equations) {
	if(Object.keys(loss_equations).includes(get_loss())) {
		return "<h2>Loss:</h2><div class='temml_me'>" + loss_equations[get_loss()] + "</div><br>";
	}

	return "";
}

function get_max_nr_cols_rows () {
	var $max_nr_vals = $("#max_nr_vals");
	if($max_nr_vals.length == 0) {
		dbg(`[get_max_nr_cols_rows] Could not find #max_nr_vals`);
		return 32;
	}

	var res = $max_nr_vals.val()

	if(!looks_like_number(res)) {
		dbg(`[get_max_nr_cols_rows] '${res}' doesn't look like a number`);
		return 32;
	}

	if(!res) {
		dbg(`[get_max_nr_cols_rows] res is either null, 0, undefined or empty`);
		return 32;
	}

	return parse_int(res);
}
