"use strict";

async function show_csv_file(disabled_show_head_data=false) {
	if (t_show_csv_file) clearTimeout(t_show_csv_file);
	t_show_csv_file = setTimeout(async function() {
		await _show_csv_file(disabled_show_head_data);
	}, 1000);
}

async function _show_csv_file(disabled_show_head_data=false) {
	var csv = $("#csv_file").val();

	var data = parse_csv_file(csv);

	var head = data["head"];

	reset_csv_stuff();

	if (head.length > 1 && data.data.length >= 1) {
		var header_csv_selection = get_csv_header_selections();

		var has_x_and_y = has_x_and_y_in_csv_headers(header_csv_selection);
		if(has_x_and_y || header_csv_selection.length == 0) {
			if (!disabled_show_head_data) {
				show_head_data(head);
			}

			var parsed_data = await get_x_y_from_csv();

			if(typeof parsed_data == "string" && parsed_data == "incomplete") {
				return;
			}

			set_activation_function_to_linear_when_y_not_between_0_and_1(parsed_data);

			var new_input_shape = parsed_data.x.shape.slice(1);
			await set_input_shape("[" + new_input_shape.toString() + "]");
			var auto_adjust = $("#csv_auto_adjust_number_of_neurons").is(":checked");
			if(auto_adjust) {
				if (!parsed_data.is_one_hot_encoded && parsed_data.number_of_categories) {
					auto_adjust_number_of_neurons(parsed_data.number_of_categories);
				}
			}

			var shape_preview = "X-shape: [" + parsed_data.x.shape.join(", ") + "]<br>Y-shape: [" + parsed_data.y.shape.join(", ") + "]";

			var shape_preview_color = "<div>";
			csv_allow_training = true;

			var is_same = output_shape_is_same(parsed_data.y.shape, $("#outputShape").val());
			if (is_same) {
				if (auto_adjust) {
					await updated_page(null, null, null, 1);
				}
			}

			shape_preview = shape_preview_color + shape_preview + "</div>";

			var x_str = array_to_ellipsis_latex(parsed_data.latex_array_x, 5, "Input");
			var y_str = array_to_ellipsis_latex(parsed_data.latex_array_y, 5, "Output");

			if(!x_str || x_str && x_str.includes("error_msg") && old_x_str) {
				x_str = old_x_str;
			}

			if(!y_str || y_str && y_str.includes("error_msg") && old_y_str) {
				y_str = old_y_str;
			}

			old_x_str = x_str;
			old_y_str = y_str;

			shape_preview += "<br><div class='temml_me'>" + x_str + "</div>";

			if (parsed_data.x.dtype == "string") {
				csv_allow_training = false;
			}

			shape_preview += "<br><br><div class='temml_me'>" + y_str + "</div>";

			if (parsed_data.y.dtype == "string") {
				csv_allow_training = false;
			}

			if (csv_allow_training) {
				await hide_error();
			}

			shape_preview = auto_one_hot_shape_preview(shape_preview);

			$("#x_y_shape_preview").html(shape_preview);
			$(".hide_when_no_csv").show();
		} else {
			log(language[lang]["csv_headers_must_have_x_and_y_values"]);

			$("#csv_header_overview").html("");
			csv_allow_training = false;

			$($(".header_select")[0]).val("X");
			$($(".header_select")[1]).val("Y").trigger("change");

			await show_csv_file();
		}
	} else {
		$("#csv_header_overview").html("");
		csv_allow_training = false;
	}
}

function show_head_data(head) {
	var previous_values = [];
	$(".header_select").each((x, y) => { previous_values.push($(y).val()); });

	$("#csv_header_overview").html("");

	var html = "<div class='header_container' style='display: flex; flex-direction: column; gap: 10px;'>";

	for (var head_idx = 0; head_idx < head.length; head_idx++) {
		var x_selected = "";
		var y_selected = "";
		var none_selected = "";

		if(previous_values.length) {
			if (previous_values[head_idx] == "X") {
				x_selected = "selected";
			} else if (previous_values[head_idx] == "none") {
				none_selected = "selected";
			} else if (previous_values[head_idx] == "Y") {
				y_selected = "selected";
			}
		} else {
			x_selected = "selected";
			none_selected = "";
			if (head_idx == head.length - 1) {
				x_selected = "";
				y_selected = "selected";
			}
		}

		var select = "<select name='" + head[head_idx] + "' onchange='show_csv_file(1)' class='header_select'><option " + x_selected + " value='X'>Input</option><option " + y_selected + " value='Y'>Output</option><option value='none' " + none_selected + ">Ignore</option></select>";

		if(!$("#auto_one_hot_y").is(":checked")) {
			select += `<br><span>${trm("divide_by")}: <input style='width: 50px; background-color: rgb(60, 60, 60);' value='1' type='number' onchange='show_csv_file(1)' id='header_divide_by_nr_${head_idx}' class='header_divide_by'></span>`;
		}

		html += `<div class='header_item' style='display: flex; flex-direction: column; gap: 5px;'>
		    <h3 class='header_name' style='margin: 0;'>${head[head_idx]}</h3>
		    <div class='header_controls'>${select}</div>
		 </div>`;

		if(head_idx != head.length - 1) {
			html += "<hr style='margin: 5px 0; border: 0; border-top: 1px solid #ccc;'>";
		}
	}

	html += "</div>";
	$("#csv_header_overview").html(html);
}

function get_csv_header_selections () {
	var header_elements = [];
	$(".header_select").each(function (i, e) {
		header_elements.push(($(e).val())) ;
	});

	return header_elements;
}

function has_x_and_y_in_csv_headers (headers = get_csv_header_selections()) {
	typeassert(headers, array, "headers");

	if(headers.includes("Y") && headers.includes("X")) {
		return true;
	}

	return false;
}

function reset_csv_stuff () {
	$("#x_y_shape_preview").html("");
	$(".hide_when_no_csv").hide();
}

function set_activation_function_to_linear_when_y_not_between_0_and_1 (parsed_data) {
	var y_between_0_and_1 = parsed_data["y_between_0_and_1"];

	if (!y_between_0_and_1) {
		if ($("#auto_set_last_layer_activation").is(":checked")) {
			var activations = $(".activation");
			if($(activations[activations.length - 1]).val() != "linear") {
				$(activations[activations.length - 1]).val("linear").trigger("change");
			}
		}
	}
}

function auto_one_hot_shape_preview (shape_preview) {
	if($("#auto_one_hot_y").is(":checked")) {
		if(labels.length) {
			shape_preview += "Generated encodings:<br>";
			for (var label_idx = 0; label_idx < labels.length; label_idx++) {
				shape_preview += labels[label_idx] + ": " + get_generated_encoding(label_idx, labels.length) + "<br>";
			}
			l(language[lang]["generated_encodings"]);
		} else {
			l(language[lang]["auto_generating_enables_but_no_labels_given"]);
		}
	}

	return shape_preview;
}

function replace_nullish_with_unknown_with_ok(value, opts = {}) {
	opts = opts || {};
	var token_parsing_error = opts.token_parsing_error || '\\text{Parsing Error}';
	var token_nan = opts.token_nan || '\\text{NaN}';
	var token_empty = opts.token_empty || '\\text{Empty String}';

	var all_ok = true;

	function recurse(v, path) {
		if (Array.isArray(v)) {
			var out = [];
			for (var i = 0; i < v.length; i++) {
				out.push(recurse(v[i], path + '[' + i + ']'));
			}
			return out;
		}

		if (v === null || v === undefined) {
			all_ok = false;
			return token_parsing_error;
		}

		if (typeof v === 'number') {
			if (!isFinite(v)) {
				all_ok = false;
				return token_nan;
			}
			return v;
		}

		if (typeof v === 'string') {
			if (v.trim() === '') {
				all_ok = false;
				return token_empty;
			}
			return v;
		}

		return v;
	}

	var cleaned = recurse(value, '');
	return { value: cleaned, ok: all_ok };
}

function get_example_csv () {
	return `sex(m=0;w=1),height,shoe_size
0,171,41
0,172,41
0,175,42
0,175,44
0,178,44
0,180,42
0,180,44
0,183,44
0,183,46
0,185,42
0,187,44
0,205,48
0,206,50
1,155,37
1,156,36
1,157,37
1,158,35
1,158,37
1,159,36
1,159,38
1,160,36
1,160,37
1,160,38
1,160,40
1,161,37
1,161,38
1,162,36
1,163,37
1,163,38
1,163,39
1,164,36
1,164,37
1,164,39
1,165,36
1,165,37
1,165,38
1,165,39
1,166,38
1,167,39
1,168,36
1,168,38
1,168,39
1,169,38
1,169,39
1,169,40
1,170,38
1,170,39
1,170,40
1,171,39
1,171,40
1,172,37
1,172,39
1,173,38
1,173,40
1,174,37
1,174,39
1,175,39
1,176,40
1,178,39
1,178,41
1,180,42
1,183,39
1,184,41
`;
}

async function load_shoe_example () {
	var example_shoe_str = get_example_csv();

	$("#csv_file").val(example_shoe_str).trigger("keyup");

	await show_csv_file();
}

function load_csv_custom_function () {
	var start = $("#csv_custom_start").val();

	if(!looks_like_number(start)) {
		wrn(language[lang]["start_must_be_a_number"]);
		return;
	}

	start = parse_float(start);

	var end = parse_float($("#csv_custom_end").val());

	if(!looks_like_number(end)) {
		wrn(language[lang]["end_must_be_a_number"]);
		return;
	}

	end = parse_float(end);

	if(start > end) {
		var tmp = end;
		end = start;
		start = tmp;
	}

	if(start == end) {
		wrn(language[lang]["start_and_end_number_are_equal"]);
		return;
	}

	var stepsize = $("#csv_custom_stepsize").val();

	if(!looks_like_number(stepsize)) {
		wrn(language[lang]["stepsize_is_not_a_number"]);
		return;
	}

	stepsize = Math.abs(parse_float(stepsize));

	if(stepsize == "0") {
		wrn(language[lang]["stepsize_cannot_be_zero"]);
		return;
	}

	var fn = $("#csv_custom_fn").val();

	if(!fn.length) {
		wrn(language[lang]["function_is_too_short"]);
		return;
	}

	var str = fill_get_data_between(start, end, stepsize, fn);

	$("#csv_file").val(str).trigger("keyup");
}

function get_generated_encoding(nr, max) {
	var array = [];
	for (var cur = 0; cur < max; cur++) {
		if(cur == nr) {
			array.push(1);
		} else {
			array.push(0);
		}
	}

	var res = "[" + array.join(", ") + "]";

	return res;
}

function ensure_shape_array(shape) {
	if (typeof(shape) == "string") {
		return eval(shape);
	} else if (typeof(shape) == "object") {
		return shape;
	}
	wrn("[ensure_shape_array] Is neither shape nor object: ", shape);
}

function output_shape_is_same(output_shape_data, output_shape_network) {
	output_shape_data = ensure_shape_array(output_shape_data);
	output_shape_network = ensure_shape_array(output_shape_network);

	var shape_length_difference = Math.abs(output_shape_data.length - output_shape_network.length);

	if (shape_length_difference <= 1) {
		if (!shape_length_difference == 0) {
			output_shape_data.unshift(null);
		}

		for (var output_shape_idx = 0; output_shape_idx < output_shape_network.length; output_shape_idx++) {
			var is_equal = output_shape_data[output_shape_idx] === output_shape_network[output_shape_idx] || output_shape_network[output_shape_idx] === null || output_shape_data[output_shape_idx] === null;
			if (!is_equal) {
				return false;
			}
		}

		return true;
	} else {
		return false;
	}
}

function set_custom_function_error(err_msg) {
	dbg(`[set_custom_function_error] ${err_msg}`);
	$("#custom_function_error").html("" + err_msg).show();

	return "";
}

function hide_custom_function_error() {
	$("#custom_function_error").html("").hide();
}

function fill_get_data_between(start, end, stepsize, fn) {
    if (!looks_like_number(end))
        return set_custom_function_error(language[lang]["end_number_must_be_something_other_than_zero"]);

    if (!looks_like_number(start))
        return set_custom_function_error(language[lang]["start_number_must_be_something_other_than_zero"]);

    if (!looks_like_number(stepsize) || stepsize == 0)
        return set_custom_function_error(language[lang]["stepsize_cannot_be_zero"]);

    if (stepsize < 0) stepsize = Math.abs(stepsize);

    var lines = [["x", "y"]];

    if (!fn.includes("x"))
        return set_custom_function_error(language[lang]["function_does_not_include_x"]);

    if (fn.includes("y")) {
        lines[0].push("z");
        for (var x = start; x <= end; x += stepsize) {
            for (var y = start; y <= end; y += stepsize) {
                try {
                    let result = isolateEval(`${fn}`);
                    if ((x + '').includes('e') || (y + '').includes('e') || (result + '').includes('e')) continue;
                    lines.push([x, y, result]);
                } catch (e) {
                    const matches = ("" + e).match(/ReferenceError: (.*) is not defined/);
                    if (matches && matches.length)
                        return set_custom_function_error(language[lang]["non_existing_varname"] + matches[1]);
                    return set_custom_function_error(e);
                }
            }
        }
    } else {
        for (let x = start; x <= end; x += stepsize) {
            try {
                hide_custom_function_error();
                let result = eval(`${fn}`);
                if ((x + '').includes('e') || (result + '').includes('e')) continue;
                lines.push([x, result]);
            } catch (e) {
                const matches = ("" + e).match(/ReferenceError: (.*) is not defined/);
                if (matches && matches.length)
                    return set_custom_function_error(language[lang]["non_existing_varname"] + matches[1]);
                return set_custom_function_error(e);
            }
        }
    }

    var str = lines.map(line => line.join(",")).join("\n") + "\n";
    return str;
}
