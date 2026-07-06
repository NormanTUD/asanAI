"use strict";

async function set_input_shape(val, force=0) {
	assert(typeof(val) == "string", "set_input_shape(" + val + "), val is not string, but " + typeof(val));

	if(force && input_shape_is_image()) {
		var new_input_shape = val;
		new_input_shape = new_input_shape.replace("[", "").replace("]", "").split(", ");

		if(new_input_shape.length == 4 && new_input_shape[0] == 1) {
			new_input_shape.shift();
		}

		var new_height = new_input_shape[0];
		var new_width = new_input_shape[1];

		if(height != new_height) {
			$("#height").val(new_height).trigger("change");
		}

		if(width != new_width) {
			$("#width").val(new_width).trigger("change");
		}
	}

	$("#inputShape").val(val);

	await write_descriptions();

	var res = get_input_shape();

	return res;
}

function get_input_shape_with_batch_size() {
	var shape = get_input_shape();
	shape.unshift(parse_int($("#batchSize").val()));
	var res = shape;
	return res;
}

function get_input_shape() {
	var code = $("#inputShape").val();
	if (!code.startsWith("[")) {
		code = "[" + code + "]";
	}
	var match = code.match(/^\s*\[\s*(?:(?:\s*\d+\s*,\s*)*\d+)?\s*\]\s*$/);
	if(match) {
		var res = eval(code);
		return res;
	} else {
		if(model && typeof(model?.input?.shape) == "object") {
			return model?.input?.shape.filter(n => n);
		} else {
			return [];
		}
	}
}

async function update_input_shape() {
	await set_input_shape("[" + get_input_shape().join() + "]");
	layer_structure_cache = null;
	await updated_page();
	if(input_shape_is_image()) {
		var this_shape = get_input_shape();
		$("#width").val(this_shape[1]);
		$("#height").val(this_shape[0]);
		await change_width();
		await change_height();
	}

	await highlight_code();

	await predict_own_data_and_repredict();
}

async function set_default_input_shape() {
	if (!changed_data_source) {
		return;
	}

	var default_config = await _get_configuration();

	if (default_config) {
		try {
			var default_input_shape = default_config["input_shape"];

			await set_input_shape(default_input_shape);

			await compile_model();

			await identify_layers();

			await write_descriptions();
		} catch (e) {
			log(e);
		}
	}

}

async function set_height(new_val) {
	if(!looks_like_number(new_val)) {
		err(`set_height(${new_val}) does not look like a number`);
		return;
	}

	if (!Number.isInteger(Number(new_val))) {
		err(`set_height(${new_val}) is not an integer`);
		return;
	}

	$("#height").val(new_val);
	await change_height();
}

async function set_width(new_val) {
	if(!looks_like_number(new_val)) {
		err(`set_width(${new_val}) does not look like a number`);
		return;
	}

	if (!Number.isInteger(Number(new_val))) {
		err(`set_width(${new_val}) is not an integer`);
		return;
	}

	$("#width").val(new_val);
	await change_width();
}

async function change_height() {
	await change_width_or_height("height", 0);
}

async function change_width() {
	await change_width_or_height("width", 1);
}

async function change_width_or_height(name, inputshape_index) {
	var is_valid_name = ["width", "height"].includes(name);

	if(!is_valid_name) {
		err(`${name} is neither 'width' nor 'height'`);
		return;
	}

	var value = $("#" + name).val();

	if(!("" + value).length) {
		err("[change_width_or_height] value is not defined");
		return;
	}

	if(!looks_like_number(value)) {
		err(`[change_width_or_height] Value "${value}" does not look like a number`);
		return;
	}

	value = parse_int(value);

	assert(typeof(value) == "number", `${value} is not a number, but ${typeof(value)}`);

	if(value == eval(name)) {
		return;
	}

	var t_start = Date.now();
	l(language[lang]["changing"] + " " + language[lang][name] + "...");

	var inputShape = get_input_shape();
	inputShape[inputshape_index] = value;
	await set_input_shape("[" + inputShape.join(", ") + "]");
	eval(name + " = " + value);
	layer_structure_cache = null;
	try {
		model = await create_model(model, undefined);
		is_setting_config = false;

	} catch (e) {
		var last_good = get_last_good_input_shape_as_string();
		l(language[lang]["input_size_too_small_restoring_last_known_good_config"] + " " + last_good);
		await set_input_shape(last_good, 1);

		var new_size = get_input_shape_as_string().replace("[", "").replace("]", "").split(", ")[inputshape_index];

		$("#" + name).val(new_size).trigger("change");
	}

	await updated_page();
	change_output_and_example_image_size();

	await restart_webcams();

	var t_end = Date.now();

	var used_time = ((t_end - t_start) / 1000).toFixed(5);

	model_is_trained = false;
	var hrt = human_readable_time(used_time);

	if(hrt) {
		l(language[lang]["done_changing"] + " " + language[lang][name] + ", " + language[lang]["took"] + " " + hrt + " (" + used_time + ")");
	}

	log("Changed width or height");
}

function change_output_and_example_image_size() {
	if($("#width").val() == "" || $("#height").val() == "") {
		return;
	}

	$("#output").width($("#width").val());
	$("#output").height($("#height").val());
}

function get_shape_from_file(file) {
	typeassert(file, string, "file");

	if (file === null) {
		return null;
	}

	var input_shape_line = file?.split("\n")[0];
	if(!input_shape_line) {
		err("input_shape_line was empty or undefined");
	}
	var shape_match = /^#\s*shape\s*:?\s*\(\d+,?\s*(.*)\)$/.exec(input_shape_line);

	assert(shape_match !== null, "shape_match is null");

	if (1 in shape_match) {
		return shape_match[1];
	}

	return null;
}

function get_full_shape_without_batch(file) {
	typeassert(file, string, "file");

	if (file === null) {
		return null;
	}

	var input_shape_line = file?.split("\n")[0];
	if(!input_shape_line) {
		err("input_shape_line was empty or undefined");
		return [];
	}
	var shape_match = /^#\s*shape\s*:?\s*\((.*)\)$/.exec(input_shape_line);

	assert(shape_match !== null, "shape_match is null");

	//shape_match[0] = null;

	var res = eval("[" + shape_match[1] + "]");

	res[0] = null;

	return res;
}

function get_shape_from_array(a) {
	if (!Array.isArray(a)) {
		throw new TypeError(`Not an array: ${typeof a}`);
	}

	const dim = [];
	let current = a;
	while (true) {
		dim.push(current.length);
		const first = current[0];
		if (!Array.isArray(first)) {
			break;
		}
		current = first;
	}
	return dim;
}

function generateOnesString(inputString) {
	typeassert(inputString, string, "inputString");
	return (inputString.toLowerCase().match(/\d+/g) || []).map(number => "1,".repeat(parse_int(number))).join("").replace(/,$/, "");
}

function getDimFromString(input) {
	if (typeof input !== "string") {
		throw new TypeError("getDimFromString expects a string.");
	}

	var regex = /(\d+)[dD]/g;
	var match = regex.exec(input);

	if (match && match[1] !== undefined) {
		var parsed = parseInt(match[1], 10);
		if (Number.isNaN(parsed)) {
			throw new Error("Error at parsing the input number.");
		}
		return parsed;
	}

	return null;
}

function safeGetDim(input) {
	try {
		return getDimFromString(input);
	} catch (err) {
		if (typeof console !== "undefined" && typeof console.error === "function") {
			console.error("safeGetDim: error:", err && err.message ? err.message : err);
		}
		return null;
	}
}
