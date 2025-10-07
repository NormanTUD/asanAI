async function write_model_to_latex_to_page (reset_prev_layer_data = false, force = false) {
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
					var start_scroll_position = document.getScroll();

					_temml();

					var current_scroll_position = document.getScroll(true);

					if(start_scroll_position && current_scroll_position && (start_scroll_position[0] != current_scroll_position[0] || start_scroll_position[1] != current_scroll_position[1])) {
						await _scrollTo(...start_scroll_position);
					}
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
	var colors = [];
	if(prev_layer_data.length) {
		colors = color_compare_old_and_new_layer_data(JSON.parse(JSON.stringify(prev_layer_data)), JSON.parse(JSON.stringify(layer_data)));
	} else {
		colors = color_compare_old_and_new_layer_data(JSON.parse(JSON.stringify(layer_data)), JSON.parse(JSON.stringify(layer_data)));
	}

	return colors;
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

function compare_layer_parameters_and_color_array (color_diff, layer_nr, this_key, item_nr, this_old_item, this_new_item, default_color, color_up, color_down) {
	color_diff[layer_nr][this_key][item_nr] = [];
	for (var kernel_nr = 0; kernel_nr < this_old_item.length; kernel_nr++) {
		try {
			if(this_old_item[kernel_nr] == this_new_item[kernel_nr]) {
				color_diff[layer_nr][this_key][item_nr][kernel_nr] = default_color;
			} else {
				if(this_old_item[kernel_nr] > this_new_item[kernel_nr]) {
					color_diff[layer_nr][this_key][item_nr][kernel_nr] = color_down;
				} else if(this_old_item[kernel_nr] < this_new_item[kernel_nr]) {
					color_diff[layer_nr][this_key][item_nr][kernel_nr] = color_up;
				}
			}
		} catch (e) {
			wrn(e);
			console.trace();
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

	if(model.layers[model.layers.length - 1].input.shape.length != 2) {
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
				color: #333;
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

function array_to_ellipsis_latex (x, limit) {
	var _shape = get_shape_from_array(x);

	if(_shape.length == 1) {
		return x[0];
	} else if(_shape.length == 2) {
		return array_to_latex(_array_to_ellipsis_latex(x, limit));
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
