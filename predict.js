"use strict";

async function __predict (data, __model = model, recursion = 0) {
	if(!data) {
		err("[__predict] data undefined");
		return;
	}

	if(recursion > 2) {
		err("[__predict] Too many retries for predict.");
		if(data);
		log("Data which has been tried too many times:", data);
		return;
	}

	if(!__model) {
		__model = model;
	}

	if(!__model) {
		err("[__predict] Cannot predict without a model");
		return;
	}

	var model_predict_result = await get_model_predict(data, __model, recursion);

	if (model_predict_result === null) {
		dbg("get_model_predict returned null for data:", data);
		return;
	}

	check_for_nan_in_tensor(model_predict_result);

	return model_predict_result;
}

async function get_model_predict (data, __model = model, recursion = 0) {
	if(!is_tensor(data)) {
		err(`get_model_predict: data is not a valid tensor. ${JSON.stringify(data)}`);

		return null;
	}

	try {
		var res = await __model.predict(data);

		return res;
	} catch (e) {
		var ret = await handle_predict_internal_errors(e, data, __model, recursion)
		if(ret == true) {
			return null;
		}

		return ret;
	}
}

function check_for_nan_in_tensor(res) {
	if(res === null) {
		err(`check_for_nan_in_tensor: res is null`);
		return;
	}

	if(tensor_is_disposed(res)) {
		return;
	}

	var res_sync = array_sync(res);

	while (get_shape_from_array(res_sync).length > 1) {
		res_sync = res_sync.flat();
	}

	var output_contains_nan = false;

	for (var k = 0; k < res_sync.length; k++) {
		if(output_contains_nan) {
			continue;
		}

		if(isNaN(res_sync[k])) {
			output_contains_nan = true;
		}
	}

	if(output_contains_nan) {
		err("[__predict] Output contains NaN");
	}
}

async function handle_predict_internal_errors (e, data, __model, recursion) {
	if(Object.keys(e).includes("message")) {
		e = "" + e.message;
	}

	if(("" + e).includes("but got array with shape")) {
		var dis = data.shape.join(", ");
		if(!__model || Object.keys(__model).includes("input")) {
			var mis = __model.input.shape.join(", ");

			dbg(sprintf(language[lang]["wrong_input_shape_for_prediction_data_x_model_y"], dis, mis));
		} else {
			dbg(sprintf(language[lang]["wrong_input_shape_for_prediction_data_x_model_y"], dis, "not determinable"));
		}

		await dispose(data);

		return true;
	} else if(("" + e).includes("is already disposed") && ("" + e).includes("LayersVariable")) {
		dbg(language[lang]["model_was_already_disposed"]);
		await dispose(data);

		return true;
	} else {
		await compile_model();

		if(warn_if_tensor_is_disposed(data)) {
			return await __predict(data, model, recursion + 1);
		} else {
			err(language[lang]["cannot_predict_since_the_data_about_to_be_predicted_is_already_disposed"]);
			await dispose(data);
			return true;
		}
	}

	return false;
}

async function get_label_data () {
	if((get_data_origin() == "image" || await input_shape_is_image()) && get_data_origin() == "default") {
		let imageData = await download_image_data(1, 0, {
			title: language[lang]["loading_images_into_memory"],
			html: language[lang]["this_may_take_a_while"]
		}, 0, 1);

		await reset_labels();

		var category_counter = 0;
		var keys = [];

		var new_labels = [];

		for (let [key, value] of Object.entries(imageData)) {
			keys.push(key);
		}

		await set_labels(keys);
	}
}

function load_file (event) {
	try {
		var files = event.target.files;

		var $output = $("#uploaded_file_predictions"); 

		var uploaded_file_pred = 
			"<span class='single_pred'>\n" +
				`<img width='${width}' height='${height}' src="data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs=" alt="Image" class="uploaded_file_img"\n>` +
				"<br>" +
				"<span class=\"uploaded_file_prediction\"></span>" +
			"</span>\n";

		var repeated_string = "";
		for (var files_idx = 0; files_idx < files.length; files_idx++) {
			repeated_string += uploaded_file_pred;
		}

		$output.html(repeated_string);

		for (var files_idx = 0; files_idx < files.length; files_idx++) {
			$($(".single_pred")[files_idx]).removeAttr("src");

			var img_elem = $($(".uploaded_file_img")[files_idx])[0];

			var async_func;

			eval(`async_func = async function() {
				var _img_elem = $($(".uploaded_file_img")[${files_idx}])[0];
				URL.revokeObjectURL(_img_elem.src);

				var _result = await predict(_img_elem);

				var $set_this = $($(".uploaded_file_prediction")[${files_idx}]);

				assert($set_this.length, \`.uploaded_file_prediction[${files_idx}] not found!\`);

				//console.log("_img_elem:", _img_elem, "files_idx:", ${files_idx}, "$set_this:", $set_this, "_result:", _result, "_result md5:", await md5(_result));

				$set_this.html(_result).show();

				$(".only_show_when_predicting_image_file").show();
			}`);

			img_elem.src = URL.createObjectURL(files[files_idx]);
			img_elem.onload = async_func;
		}

		$output.show();
	} catch (e) {
		if(Object.keys(e).includes("message")) {
			e = e.message;
		}

		assert(false, e);
	}
}

function _predict_error (e) {
	err(e);
	$("#prediction").hide();
	set_predict_error(e);
	$("#example_predictions").html("");
	$(".show_when_has_examples").hide();
}

function _divide_img_tensor (tensor_img) {
	var divide_by = parse_float($("#divide_by").val());
	if(divide_by == 1) {
		return tensor_img;
	}

	try {
		tensor_img = tidy(() => {
			return divNoNan(tensor_img, divide_by);
		});
	} catch (e) {
		if(Object.keys(e).includes("message")) {
			e = e.message;
		}

		_predict_error(e);
	}

	return tensor_img;
}

async function _get_tensor_img(item) {
	var tensor_img = null;

	try {
		tensor_img = await tidy(() => {
			return tf_to_float(expand_dims(
				resize_image(_divide_img_tensor(fromPixels(item)), [height, width])
			));
		});
	} catch (e) {
		void(0); log("item:", item, "width:", width, "height:", height, "error:", e);

		if(Object.keys(e).includes("message")) {
			e = e.message;
		}

		_predict_error(e);
		return null;
	}

	return tensor_img;
}

function set_item_natural_width (item) {
	if(document.body === null) {
		wrn("[set_item_natural_width] document.body is null!");
		return;
	}

	try {
		var $item = $(item);
		assert($item.length > 0, "$item is empty");
		var element_vanilla_js = $item[0];
		$item.prop("width", element_vanilla_js.naturalWidth);
		$item.prop("height", element_vanilla_js.naturalHeight);
	} catch (e) {
		if(Object.keys(e).includes("message")) {
			e = e.message;
		}
		_predict_error("" + e);
		return false;
	}

	return true;
}

async function wait_for_backend_hack () {
	while (!backend()) {
		await delay(100);
	}
}

async function predict_demo (item, nr, tried_again = 0) {
	if(has_zero_output_shape) {
		dbg("[predict_demo] has_zero_output_shape is true");
		return;
	}

	while ((is_hidden_or_has_hidden_parent($("#predict_tab")) && finished_loading)) {
		await delay(200);
	}

	var new_tensor_img;

	try {
		if(labels.length == 0) {
			await get_label_data();
		}
	} catch (e) {
		if(Object.keys(e).includes("message")) {
			e = e.message;
		}
		_predict_error("" + e);

		return;
	}

	if(!set_item_natural_width(item)) {
		err("[predict_demo] Setting item to natural height failed. Returning.");
		return;
	}

	if(item.width == 0) {
		return;
	}

	assert(!!item, "item must at least be true");
	assert(width > 0, "width is not larger than 0");
	assert(height > 0, "height is not larger than 0");

	var tensor_img = await _get_tensor_img(item);

	if(!tensor_img) {
		err("[predict_demo] tensor_img was empty");
		await dispose(tensor_img);
		return;
	}

	if(!model) {
		wrn("[predict_demo] Model is undefined");
		return;
	}

	if(!Object.keys(model.layers).includes("0")) {
		wrn("[predict_demo] Model does not include first layer");
		return;
	}

	await wait_for_backend_hack();

	if(!model) {
		if(finished_loading) {
			err("[predict_demo] No model");
		}
		await dispose(tensor_img);
		return;
	}

	if(!tensor_shape_matches_model(tensor_img)) {
		dbg("[predict_demo] Model input shape: ", model.input.shape, "Tensor-Img-shape:", tensor_img.shape);
		await dispose(tensor_img);
		return;
	}

	try {
		await _run_predict_and_show(tensor_img, nr);
		await dispose(tensor_img);
	} catch (e) {
		return await handle_predict_demo_error(e, tensor_img, tried_again, new_tensor_img, item, nr);
	}

	hide_unused_layer_visualization_headers();
	change_output_and_example_image_size();
	allow_editable_labels();

	await dispose_predict_demo_tensors(tensor_img, new_tensor_img);
}

async function handle_predict_demo_error(e, tensor_img, tried_again, new_tensor_img, item, nr) {
	if(Object.keys(e).includes("message")) {
		e = e.message;
	}

	void(0); err("Error (101): " + e);
	log("================================= tensor_img:", tensor_img);
	_predict_error("" + e);
	if(tried_again) {
		return;
	}

	await dispose_predict_demo_tensors(tensor_img, new_tensor_img);

	return await predict_demo(item, nr, 1);

}

async function dispose_predict_demo_tensors(tensor_img, new_tensor_img) {
	await dispose(tensor_img);
	await dispose(new_tensor_img);

	await nextFrame();
}

async function _run_predict_and_show (tensor_img, nr) {
	try {
		if(tensor_img.isDisposedInternal) {
			dbg("[_run_predict_and_show] Tensor was disposed internally", tensor_img);
			console.trace();
			return;

		}
	} catch (e) {
		if(Object.keys(e).includes("message")) {
			e = e.message;
		}

		assert(false, e);
	}

	if(!tensor_shape_matches_model(tensor_img)) {
		dbg("[_run_predict_and_show] Tensor shape does not match model shape");
		return;
	}

	var predictions_tensor;

	var got_error = 0;

	try {
		predictions_tensor = await __predict(tensor_img);
		if(!predictions_tensor) {
			dbg(language[lang]["predictions_tensor_was_empty"]);
			return;
		}

		warn_if_tensor_is_disposed(predictions_tensor);
		await _predict_result(predictions_tensor, nr, 0);

		warn_if_tensor_is_disposed(predictions_tensor);
		await draw_heatmap(predictions_tensor, tensor_img);

		await dispose(predictions_tensor);
	} catch (e) {
		handle_run_predict_and_show_internal_error(e);
		got_error = 1;
	}

	if(got_error == 0) {
		for (var layer_idx = 0; layer_idx < $("#layers_container").length; layer_idx++) {
			set_layer_background(layer_idx, "");
			set_model_layer_warning(layer_idx, "");
		}
	}

	await dispose(predictions_tensor);
}

function handle_run_predict_and_show_internal_error(e) {
	if(("" + e).includes("already disposed") || ("" + e).includes("is disposed")) {
		dbg("[_run_predict_and_show] Tensors already disposed. Probably the model was recompiled while predicting.");
	} else if(("" + e).includes("but got array with shape")) {
		dbg("[_run_predict_and_show] Prediction got wrong tensor shape. This may be harmless when you just switched models, otherwise, it indicates a bug.");
	} else if(("" + e).includes("code is undefined")) {
		err(e + ". This may mean that the whole document was deleted!!!");
	} else if(("" + e).includes("predictions is null")) {
		err("" + e);
	} else if(("" + e).includes("Either strides or dilations must be 1")) {
		for (var layer_idx = 0; layer_idx < $("#layers_container").length; layer_idx++) {
			set_layer_background(layer_idx, "red");
			set_model_layer_warning(layer_idx, "" + e);
		}
	} else {
		err("" + e);
		console.trace();
	}
}

async function _predict_result(predictions_tensor, nr, _dispose = 1) {
	var desc = $($(".predict_demo_result")[nr]);
	desc.html("");
	if(model.outputShape.length == 4) {
		await _predict_image(predictions_tensor, desc);
	} else if(model.outputShape.length == 2) {
		await _predict_table(predictions_tensor, desc);
	} else {
		var latex = arbitrary_array_to_latex(array_sync(predictions_tensor));
		desc.html(latex);
	}

	if(_dispose) {
		await dispose(predictions_tensor);
	}
}

async function _predict_image (predictions_tensor, desc) {
	try {
		var predictions_tensor_transposed = tf_transpose(predictions_tensor, [3, 1, 2, 0]);
		var predictions = array_sync(predictions_tensor_transposed);

		var pxsz = 1;

		var largest = Math.max(predictions_tensor_transposed.shape[1], predictions_tensor_transposed.shape[2]);
		assert(typeof(largest) == "number", "_predict_image: largest is not a number");

		var max_height_width = Math.min(100, Math.floor(window.innerWidth / 5));
		assert(typeof(max_height_width) == "number", "_predict_image: max_height_width is not a number");

		while ((pxsz * largest) < max_height_width) {
			pxsz += 1;
		}

		scaleNestedArray(predictions);

		for (var predictions_idx = 0; predictions_idx < predictions.length; predictions_idx++) {
			var canvas = $("<canvas/>", {class: "layer_image"}).prop({
				width: pxsz * predictions_tensor.shape[2],
				height: pxsz * predictions_tensor.shape[1],
			});

			desc.append(canvas);

			var res = draw_grid(canvas, pxsz, predictions[predictions_idx], 1, 1, null, null, null);
		}

		await dispose(predictions_tensor_transposed);
	} catch (e) {
		if(Object.keys(e).includes("message")) {
			e = e.message;
		}

		assert(false, e);
	}
}

function scaleNestedArray(arr) {
	assert(Array.isArray(arr), "scaleNestedArray input parameter is not Array, but " + typeof(arr));

	// Find the minimum and maximum values in the nested array
	let min = Number.MAX_VALUE;
	let max = Number.MIN_VALUE;

	function findMinMax(arr) {
		for (let item of arr) {
			if (Array.isArray(item)) {
				findMinMax(item);
			} else {
				if (item < min) min = item;
				if (item > max) max = item;
			}
		}
	}

	findMinMax(arr);

	// Scale the values
	function scaleValue(value) {
		return (value - min) * (255 / (max - min));
	}

	function scaleNested(arr) {
		for (let arr_idx = 0; arr_idx < arr.length; arr_idx++) {
			if (Array.isArray(arr[arr_idx])) {
				scaleNested(arr[arr_idx]);
			} else {
				arr[arr_idx] = scaleValue(arr[arr_idx]);
			}
		}
	}

	scaleNested(arr);
}

function get_show_green () {
	var last_layer_activation = get_last_layer_activation_function();
	var show_green = last_layer_activation == "softmax" ? 1 : 0;

	return show_green;
}

async function _predict_table(predictions_tensor, desc) {
	if(!predictions_tensor) {
		wrn("[_predict_table] predictions_tensor was empty");
		return;
	}

	try {
		var predictions = tidy(() => { return predictions_tensor.dataSync(); });

		if(predictions.length) {
			var max_i = 0;
			var max_probability = -9999999;

			for (let predictions_idx = 0; predictions_idx < predictions.length; predictions_idx++) {
				var probability = predictions[predictions_idx];
				if(probability > max_probability) {
					max_probability = probability;
					max_i = predictions_idx;
				}
			}

			var fullstr = "";

			fullstr += "<table class='predict_table'>";

			for (let predictions_idx = 0; predictions_idx < predictions.length; predictions_idx++) {
				var label = labels[predictions_idx % labels.length];
				var probability = predictions[predictions_idx];
				var w = Math.floor(probability * 50);

				fullstr += _predict_table_row(label, w, max_i, probability, predictions_idx);
			}

			fullstr += "</table>";
			if(desc) {
				desc.html(fullstr);
			}
		}

		$("#predict_error").hide();
		reset_predict_error();

		return fullstr;
	} catch (e) {
		if(Object.keys(e).includes("message")) {
			e = e.message;
		}

		wrn("" + e);
	}
}

function _predict_table_row (label, w, max_i, probability, predictions_idx) {
	var str = "";
	if(show_bars_instead_of_numbers()) {
		str = `<tr><td class='label_element'>${label}</td><td><span class='bar'><span style='width: ${w}px'></span></span></td></tr>`;
		if(predictions_idx == max_i && get_show_green()) {
			//str = "<b class='best_result'>" + str + "</b>";
			str = `<tr><td class='label_element'>${label}</td><td><span class='bar'><span class='highest_bar' style='width: ${w}px'></span></span></td></tr>`;
		}
	} else {
		str = "<tr><td class='label_element'>" + label + "</td><td>" + probability + "</td></tr>";
		if(predictions_idx == max_i && get_show_green()) {
			str = `<tr><td class='label_element'>${label}</td><td><b class='best_result label_input_element'>${probability}</b></td></tr>`;
		}
	}

	return str;
}

function _prepare_data(item, original_item) {
	try {
		item = String(item).trim();

		item = item.replace(/\btrue\b/ig, "1");
		item = item.replace(/\bfalse\b/ig, "0");

		let matches = item.match(/-?\d+(\.\d+)?/g);

		if (!matches || matches.length === 0) {
			set_predict_error(language[lang]["no_valid_numbers_found"]);
			return false;
		}

		let result_array = matches.map(Number);

		if (!original_item.startsWith("[[")) {
			let data_input_shape = get_shape_from_array(result_array);
			let input_shape = model.layers[0].input.shape;

			if (input_shape[0] === null) {
				let original_input_shape = input_shape;
				input_shape = remove_empty(input_shape);
				if (input_shape.length !== data_input_shape.length) {
					result_array = [result_array];
				}
			}
		}

		return result_array;

	} catch (e) {
		let msg = e?.message || e;
		err(`ERROR in _prepare_data: ${msg}`);
		assert(false, msg);
	}
}

function number_of_elements_in_tensor_shape (shape) {
	try {
		var required_elements = 1;
		for (var shape_idx = 0; shape_idx < shape.length; shape_idx++) {
			if(shape[shape_idx] !== null) {
				required_elements *= shape[shape_idx];
			}
		}

		return required_elements;
	} catch (e) {
		if(Object.keys(e).includes("message")) {
			e = e.message;
		}

		assert(false, e);
	}
}

async function handle_predict_error (e, predict_data) {
	if(Object.keys(e).includes("message")) {
		e = e.message;
	}

	await dispose(predict_data);

	if(("" + e).includes("Expected input shape")) {
		dbg("" + e);
	} else {
		l("" + e);
		console.trace();
	}
}

async function get_predict_data_or_warn_in_case_of_error(predict_data, item) {
	try {
		predict_data = tf.tidy(() => {
			var res = tf_to_float(
				expand_dims(
					resize_image(
						fromPixels(item),
						[height, width]
					)
				)
			);

			return res;
		});
	} catch (e) {
		await handle_predict_error(e, predict_data);
		return null;
	}

	return predict_data;
}

function divide_predict_data_by_divide_by (predict_data) {
	var divide_by = parse_float($("#divide_by").val());

	predict_data = tidy(() => {
		var res = divNoNan(predict_data, divide_by);
		return res;
	});

	return predict_data;
}

function get_non_image_prediction_data (predict_data, item) {
	var data = "";
	if(item.startsWith("# shape:")) {
		data = [array_sync(numpy_str_to_tf_tensor(item))];
	} else {
		var original_item = item;

		if(item.match(/^\s*$/)) {
			dbg("[predict] Not trying to predict empty custom item");
			return;
		}

		data = _prepare_data(item, original_item);

		if(data === false) {
			return false;
		}
	}

	predict_data = tensor(data);

	return predict_data;
}

async function get_predict_data (is_image_prediction, predict_data, item) {
	if(is_image_prediction) {
		predict_data = await get_predict_data_or_warn_in_case_of_error(predict_data, item)
	} else {
		predict_data = await get_non_image_prediction_data(predict_data, item);
	}

	return predict_data;
}

async function get_predict_data_error_string_or_false (predict_data) {
	if(!predict_data) {
		await dispose(predict_data);

		var str = "Empty predict data, not predicting";

		l(str);

		return str;
	} else if(predict_data.shape.includes("0") || predict_data.shape.includes(0)) {
		await dispose(predict_data);

		var str = "Predict data tensor shape contains 0, not predicting";

		l(str);

		return str;
	}

	return false;
}

function reset_predict_error_and_predict_tab (pred_tab) {
	$("#" + pred_tab).html("").show();
	reset_predict_error();
}

function check_predict_data_and_model(predict_data) {
	if(predict_data["isDisposedInternal"]) {
		err("[predict] predict_data is already disposed!");
		return true;
	}

	if(!model) {
		err(language[lang]["model_not_found_or_has_no_layers"]);
		return true;
	}

	if(!model.input) {
		err(language[lang]["model_has_no_input"]);
		return true;
	}

	return false;
}

function report_prediction_shape_mismatch(mi, predict_data, e) {
	dbg(`[PREDICT] Model input shape [${mi.join(", ")}], tensor shape [${predict_data.shape.join(", ")}], tensor_shape_matches_model(predict_data) = ${tensor_shape_matches_model(predict_data)}`);

	if(("" + e).includes("got array with shape")) {
		err_msg = ("" + e).replace(/^(?:Error:\s*)*/, "Error:");
		set_predict_error(err_msg);
	} else if(("" + e).includes("Could not reshape")) {
		throw new Error("" + e);
	} else {
		var err_msg = `Error 1201: ${e}, predict data shape: [${predict_data.shape.join(", ")}], model input shape: [${model.input.shape.filter(n => n).join(",")}]`;

		set_predict_error(err_msg);
	}
}

function set_predict_error(msg) {
	$("#predict_error").html("" + msg).show();
	dbg(msg);
}

async function show_not_reshapable_error (mi, predict_data) {
	var pd_nr = number_of_elements_in_tensor_shape(predict_data.shape);
	var is_nr = number_of_elements_in_tensor_shape(mi);

	await dispose(predict_data);

	throw new Error(`Could not reshape data for model (predict_data.shape/model.input.shape: [${pd_nr}], [${is_nr}]`);
}

function is_null_or_undefined(obj) {
	return obj === null || obj === undefined;
}

function has_disposed_flag(obj) {
	return Object.keys(obj).includes("isDisposedInternal");
}

function is_disposed(obj) {
	return has_disposed_flag(obj) && obj["isDisposedInternal"];
}

function should_abort_predict(predict_data) {
	if (is_null_or_undefined(predict_data)) {
		dbg("[predict] predict_data is null or undefined");
		return true;
	}
	if (!has_disposed_flag(predict_data)) {
		dbg("[predict] predict_data has no isDisposedInternal flag");
		return false;
	}
	if (is_disposed(predict_data)) {
		dbg("[predict] predict_data is already disposed");
		return true;
	}
	return false;
}

async function predict_own_data_and_repredict () {
	const val = $('#predict_own_data').val();
	await predict(val);
	await repredict()
}

async function predict(item) {
	const pred_tab = "prediction";

	reset_predict_error_and_predict_tab(pred_tab);

	var predictions = [];
	var str = "";
	var ok = 1;
	var estr = "";
	var predict_data = null;
	var has_html = false;

	try {
		var is_image_prediction = await input_shape_is_image();

		predict_data = await get_predict_data(is_image_prediction, predict_data, item);

		if(predict_data === false) {
			return;
		}

		if (should_abort_predict(predict_data)) {
			err("[predict] predict_data is already disposed!");
			return;
		}

		var predict_data_error_string_or_false = await get_predict_data_error_string_or_false(predict_data);

		if (predict_data_error_string_or_false !== false) {
			return predict_data_error_string_or_false;
		}

		predict_data = divide_predict_data_by_divide_by(predict_data);

		if(check_predict_data_and_model(predict_data)) {
			return;
		}

		var mi = model.input.shape;
		if(!mi) {
			err(language[lang]["cannot_get_model_input_shape"]);
			return;
		}
		mi[0] = 1;

		var predictions_tensor = null;
		reset_predict_error();

		try {
			if(predict_data["isDisposedInternal"]) {
				err(`[predict] ${language[lang]["predict_data_is_already_disposed"]}!`);
				return;
			}

			var prod_pred_shape = number_of_elements_in_tensor_shape(predict_data.shape);
			var prod_mod_shape = number_of_elements_in_tensor_shape(mi);

			predict_data = await prepare_predict_data(mi, predict_data, prod_pred_shape, prod_mod_shape);

			if(predict_data["isDisposedInternal"]) {
				err(`[predict] ${language[lang]["predict_data_is_already_disposed"]}!`);
				return;
			}

			predictions_tensor = await __predict(predict_data);
		} catch (e) {
			report_prediction_shape_mismatch(mi, predict_data, e);
			ok = 0;
			return;
		}

		warn_if_tensor_is_disposed(predictions_tensor);

		await draw_heatmap(predictions_tensor, predict_data);

		predictions = predictions_tensor.dataSync();

		str = await prepare_prediction_output(is_image_prediction, predictions, pred_tab, item, predictions_tensor, str);

		await render_prediction_tab(is_image_prediction, pred_tab, predictions_tensor, str, predict_data);
	} catch (e) {
		await handle_this_predict_error(e, predict_data, estr);

		ok = 0;
	}

	allow_editable_labels();

	show_predict_error_if_required(ok, estr);

	await dispose(predict_data);

	return str;
}

async function prepare_predict_data(mi, predict_data, prod_pred_shape, prod_mod_shape) {
	const shapes_are_equal = prod_pred_shape === prod_mod_shape;
	const shapes_are_divisible = Math.max(prod_pred_shape, prod_mod_shape) % Math.min(prod_pred_shape, prod_mod_shape) === 0;

	if (shapes_are_equal) {
		predict_data = reshape_if_needed(mi, predict_data);
		if (predict_data === false) return;
		return predict_data;
	}

	if (shapes_are_divisible) {
		predict_data = reshape_predict_data(predict_data, prod_pred_shape, prod_mod_shape, mi);
		if (predict_data === false) return;
		return predict_data;
	}

	await show_not_reshapable_error(mi, predict_data);
}


function reshape_if_needed (mi, predict_data) {
	var model_shape_one = mi;
	if(model_shape_one[0] === null) {
		model_shape_one[0] = 1;
	}

	if(predict_data.shape.join(",") != model_shape_one) {
		predict_data = tidy(() => {
			var old_tensor = predict_data;
			var new_data = tf_reshape(old_tensor, model_shape_one);

			return new_data;
		});
	}

	if(predict_data["isDisposedInternal"]) {
		err(`[predict] ${language[lang]["predict_data_is_already_disposed"]}!`);
		return false;
	}

	return predict_data;
}

function reshape_predict_data(predict_data, prod_pred_shape, prod_mod_shape, mi) {
	var _max = Math.max(prod_pred_shape, prod_mod_shape);
	var _min = Math.min(prod_pred_shape, prod_mod_shape);

	var _modulo = _max % _min;

	var elements = (_max - _modulo) / _min;

	var model_shape_one = mi;
	model_shape_one[0] = elements;

	if(predict_data.shape.join(",") != model_shape_one) {
		predict_data = tidy(() => {
			var old_tensor = predict_data;
			var new_data = tf_reshape(old_tensor, model_shape_one);

			return new_data;
		});
	}

	if(predict_data["isDisposedInternal"]) {
		err(`[predict] ${language[lang]["predict_data_is_already_disposed"]}!`);
		return false;
	}

	return predict_data;
}

async function prepare_prediction_output(is_image_prediction, predictions, pred_tab, item, predictions_tensor, str) {
	if(!is_image_prediction && labels.length == 0) {
		str = "[" + predictions.join(", ") + "]";
		hide_prediction_non_image();
	} else {
		var desc = $("#pred_tab");
		if(desc.length == 0) {
			desc = $(item).after("<span class='predict_autogenerated_images'></span>");
		}

		if(desc.length == 0) {
			dbg("[predict] desc is none");
		} else {
			desc = desc[0];
			desc = $(desc);
			if(model.outputShape.length == 4) {
				var pxsz = 1;
				draw_multi_channel(predictions_tensor, desc, pxsz);
			} else {
				if(predictions.length) {
					var r = await _predict_table(predictions_tensor, desc);
					if(r) {
						str += r;
					}
				} else {
					dbg("[predict] No predict tensor found");
				}
			}
		}
	}

	return str;
}

async function render_prediction_tab(is_image_prediction, pred_tab, predictions_tensor, str, predict_data) {
	if(is_image_prediction || labels.length) {
		$("#" + pred_tab).append(str).show();
	} else {
		var synched_results = array_sync(predictions_tensor);
		var latex = arbitrary_array_to_latex(synched_results);
		set_prediction_non_image(latex);
	}

	await dispose(predict_data);
	await dispose(predictions_tensor);

	reset_predict_error();
}

function reset_predict_error () {
	$("#predict_error").html("").hide();
}

function set_prediction_non_image(str) {
	if(str) {
		const $pred_non_img = $("#prediction_non_image");
		$pred_non_img.html(str).show();
		temml.render($pred_non_img.text(), $pred_non_img[0]);
	} else {
		hide_prediction_non_image();
	}
}

async function handle_this_predict_error (e, predict_data, estr) {
	if(Object.keys(e).includes("message")) {
		e = e.message;
	}

	await dispose(predict_data);
	estr = "" + e;
	if(!estr.includes("yped")) {
		if(!estr.includes("Expected input shape")) {
			_predict_error("" + e);
		} else {
			set_prediction_non_image(estr);
		}
	} else {
		err(e);
	}
}

function show_predict_error_if_required(ok, estr) {
	if(ok) {
		l(language[lang]["prediction_done"]);
	} else {
		if(estr) {
			set_prediction_non_image("<span style='color: red'>" + estr + "</span>");
		} else {
			err(`${language[lang]["error"]}: ${language[lang]["prediction_failed"]}`);
		}
	}
}

async function show_prediction (keep_show_after_training_hidden, dont_go_to_tab) {
	if(skip_predictions) {
		return;
	}

	if(!model) {
		dbg("[show_prediction] No model given for show_prediction");
		$(".show_when_has_examples").hide();
		$("#example_predictions").hide();
		$(".show_when_predicting").hide();

		return;
	}

	$(".show_when_predicting").show();
	$(".show_when_has_examples").hide();

	hide_unused_layer_visualization_headers();

	if(!keep_show_after_training_hidden) {
		$(".show_after_training").show();
	}

	if(!$("#data_origin").val() == "default") {
		show_or_hide_predictions(0);

		return;
	}

	if(await input_shape_is_image()) {
		await _print_example_predictions();
	} else {
		await _print_predictions_text();
	}

	if(!dont_go_to_tab) {
		if($("#jump_to_interesting_tab").is(":checked")) {
			$("a[href=\"#predict_tab\"]").click();
		}
	}

	//log("Tensors O: " + tf.memory()["numTensors"]);
}

function show_or_hide_predictions (count) {
	if(count) {
		$(".show_when_has_examples").show();
		$(".show_when_predicting").show();
		$("#example_predictions").show();
	} else {
		$(".show_when_has_examples").hide();
		$("#example_predictions").hide();
		$(".show_when_predicting").hide();
	}
}

function create_network_name () {
	function transform_array(inputArray) {
		const transformedArray = [];
		let currentElement = inputArray[0];
		let count = 1;

		for (let inputArray_idx = 1; inputArray_idx < inputArray.length; inputArray_idx++) {
			if (inputArray[inputArray_idx] === currentElement) {
				count++;
			} else {
				if (count > 1) {
					transformedArray.push(`${currentElement}^${count}`);
				} else {
					transformedArray.push(currentElement);
				}
				currentElement = inputArray[inputArray_idx];
				count = 1;
			}
		}

		if (count > 1) {
			transformedArray.push(`${currentElement}^${count}`);
		} else {
			transformedArray.push(currentElement);
		}

		return transformedArray;
	}

	return transform_array(get_layer_type_array()).join(" \\rightarrow ") ;
}

async function safe_execute(label, fn, _throw = true, _warn = true) {
	try {
		return await fn();
	} catch (e) {
		if ("message" in e) e = e.message;
		if(_warn) {
			void(0); err(label + ": " + e);
		}
		if(_throw) {
			throw new Error(label + ": " + e);
		}
	}
}

async function get_example_predict_data_or_error() {
	var example_url = "traindata/" + $("#model_dataset").val() + "/examples.json";

	var example_predict_data = null;
	try {
		example_predict_data = await get_cached_json(example_url);


	} catch (e) {
		if(Object.keys(e).includes("message")) {
			e = e.message;
		}

		err("" + e);
	}

	if(!(typeof(example_predict_data) == "object" && example_predict_data.length)) {
		dbg("[_print_predictions_text] example_predict_data is not an object or empty");
	}

	return example_predict_data;
}

async function _print_predictions_text() {
	if(!finished_loading) {
		return;
	}

	if(!model) {
		dbg(`[_print_predictions_text] ${language[lang]["no_model_found"]}`);
		return;
	}

	if(!example_predict_data || !example_predict_data.length) {
		dbg(`[_print_predictions_text] ${language[lang]["example_predict_data_was_empty"]}`);
	}

	var csh = await get_current_status_hash(1);
	if(last_status_hash_text_prediction == csh) {
		return;
	}

	last_status_hash_text_prediction = csh;

	var count = 0;
	var example_predict_data = await get_example_predict_data_or_error();

	var html_contents = "";


	if(!example_predict_data || example_predict_data.length == 0) {
		dbg("[_print_predictions_text] No example predict data found");
		return;
	}

	for (var example_predict_data_idx = 0; example_predict_data_idx < example_predict_data.length; example_predict_data_idx++) {
		var _tensor = tensor(example_predict_data[example_predict_data_idx]);
		warn_if_tensor_is_disposed(_tensor);
		var res;

		await wait_for_model();

		if(_tensor && is_tf_tensor(_tensor)) {
			if(tensor_shape_matches_model(_tensor)) {
				warn_if_tensor_is_disposed(_tensor);
				try {
					var network_name, latex_input, latex_output;

					await safe_execute("_print_predictions_text -> warn_if_tensor_is_disposed", () => warn_if_tensor_is_disposed(_tensor));

					res = await safe_execute("_print_predictions_text -> _predict", () => __predict(_tensor), false, false);

					await safe_execute("_print_predictions_text -> async", async () => {
						network_name = create_network_name();
						latex_input = await _arbitrary_array_to_latex(example_predict_data[example_predict_data_idx]);
						if (res) {
							const res_array = tidy(() => array_sync(res));
							latex_output = await _arbitrary_array_to_latex(res_array);
						}
					});

					await safe_execute("_print_predictions_text -> temml", () => {
						html_contents += `<span class='temml_me'>\\mathrm{${network_name}}\\left(${latex_input}\\right) = ${latex_output}</span><br>`;
					});

					count++;
				} catch (e) {
					if(await handle_internal_predict_text_error(e, _tensor, res)) {
						return;
					}
				}
			} else {
				log(language[lang]["tensor_shape_does_not_match_model_shape_not_predicting_example"] + ":" + JSON.stringify(get_input_shape()) + ", " + JSON.stringify(_tensor.shape));
			}
		} else {
			wrn(language[lang]["the_tensor_about_to_be_predicted_was_empty"]);
		}

		await dispose(_tensor);
		await dispose(res);
	}

	if(html_contents) {
		$("#example_predictions").html(html_contents);
	}

	show_or_hide_predictions(count);

	await temml_or_wrn()

	return count;
}

async function wait_for_model() {
	while (!model) {
		log(language[lang]["waiting_for_model"] + "...");
		await delay(200);
	}

	while (!typeof(model) == "object" || !Object.keys(model).includes("layers")) {
		log(language[lang]["waiting_for_model"] + "...");
		await delay(200);
	}
}

async function handle_internal_predict_text_error(e, _tensor, res) {
	if(Object.keys(e).includes("message")) {
		e = e.message;
	}

	if(("" + e).includes("already disposed")) {
		dbg("[_print_predictions_text] Tensors were already disposed. Maybe the model was recompiled or changed while predicting. This MAY be the cause of a problem, but it may also not be.");
	} else if(("" + e).includes("Total size of new array must be unchanged")) {
		dbg("[_print_predictions_text] Total size of new array must be unchanged. Did you use reshape somewhere?");
	} else if(("" + e).includes("to have shape")) {
		dbg("[_print_predictions_text] Wrong input shape for _print_predictions_text: " + e);
	} else if(("" + e).includes("is already disposed")) {
		wrn(language[lang]["model_or_layer_was_already_disposed_not_predicitng"]);
	} else {
		_predict_error(e);
		await dispose(_tensor);
		await dispose(res);

		return true;
	}

	return false;
}

async function _print_example_predictions () {
	if(!await input_shape_is_image()) {
		return false;
	}

	var count = 0;
	var example_predictions = $("#example_predictions");
	var dataset = $("#dataset").val();
	var full_dir = "traindata/" + dataset + "/example/";
	var dataset_url = "traindata/index.php?&dataset=" + dataset + "&examples=1";

	var x = await get_cached_json(dataset_url);
	if(x) {
		if(Object.keys(x).includes("example")) {
			var examples = x["example"];
			if(examples) {
				var str = "";
				[str, count] = await _get_example_string_image(examples, count, full_dir);

				if(str) {
					example_predictions.html(str);
				}
			}
		}
	}

	if(count == 0) {
		example_predictions.html("");
	}

	show_or_hide_predictions(count);

	return count;
}

async function _get_example_string_image (examples, count, full_dir) {
	assert(typeof(examples) == "object", "examples is not an object");
	assert(typeof(count) == "number", "count is not a number");
	assert(typeof(full_dir) == "string", "full_dir is not a string");

	var str = "";
	for (var examples_idx = 0; examples_idx < examples.length; examples_idx++) {
		count++;
		var img_url = full_dir + "/" + examples[examples_idx];
		var img_elem = $("img[src$='" + img_url + "']");

		if(img_elem.length) {
			try {
				var img = img_elem;
				if(Object.keys(img).includes("0")) {
					img = img_elem[0];
				}

				await predict_demo(img, examples_idx);
			} catch (e) {
				log(language[lang]["predict_demo_failed_error"], e);
			}
		} else {
			str += `
				<div class='full_example_image_prediction inline_block'>
					<img src='${img_url}' 
						alt="Example Image"
						class='example_images' 
						onload='predict_demo(this, ${examples_idx})' 
						onclick='predict_demo(this, ${examples_idx})' />
					<br>
					<div class='predict_demo_result'></div>
				</div>`;

		}
	}

	return [str, count];
}

function get_index_of_highest_category (predictions_tensor) {
	try {
		var js = predictions_tensor.dataSync();

		var highest_index = 0;
		var highest = 0;

		for (var js_idx = 0; js_idx < js.length; js_idx++) {
			if(js[js_idx] > highest) {
				highest = js[js_idx];
				highest_index = js_idx;
			}
		}

		return highest_index;
	} catch (e) {
		if(("" + e).includes("disposed")) {
			dbg("[get_index_of_highest_category] Tensor, probably predictions_tensor, already disposed");
		} else {
			err(e);
		}

		return null;
	}
}

function get_output_size_at_layer(layer_idx) {
	dbg(`Entering get_output_size_at_layer with layer_idx=${layer_idx}`);

	if (!model || !model.layers) {
		err("Model or model.layers is undefined!");
		return null;
	}

	if (layer_idx < 0 || layer_idx >= model.layers.length) {
		wrn(`layer_idx ${layer_idx} is out of bounds. Valid range: 0-${model.layers.length - 1}`);
		return null;
	}

	try {
		const outputShape = model.layers[layer_idx].output.shape;
		dbg(`Layer ${layer_idx} output shape: ${JSON.stringify(outputShape)}`);
		return outputShape;
	} catch (e) {
		err(`Error retrieving output shape for layer ${layer_idx}: ${e.message}`);
		return null;
	}
}

async function draw_heatmap (predictions_tensor, predict_data, is_from_webcam=0) {
	if(!(
		await input_shape_is_image(is_from_webcam) &&
		$("#show_grad_cam").is(":checked") &&
		!started_training &&
		(await output_size_at_layer(get_output_size_at_layer(0), get_number_of_layers())).length == 2)
	) {
		return;
	}

	warn_if_tensor_is_disposed(predictions_tensor);
	var strongest_category = get_index_of_highest_category(predictions_tensor);

	var original_disable_layer_debuggers = disable_layer_debuggers;
	disable_layer_debuggers = 1;
	var heatmap = await grad_class_activation_map(model, predict_data, strongest_category);
	disable_layer_debuggers = original_disable_layer_debuggers;

	if(heatmap) {
		var canvas = $("#grad_cam_heatmap")[0];
		var img = array_sync(heatmap)[0];

		var max_height_width = Math.max(150, Math.min(width, Math.floor(window.innerWidth / 5)));

		var shape = get_shape_from_array(img);
		if(shape.length != 3) {
			$("#grad_cam_heatmap").hide();
		} else {
			var _height = shape[0];
			var _width = shape[1];

			var largest = Math.max(_height, _width);

			var pxsz = 1;

			while ((pxsz * largest) < max_height_width) {
				pxsz += 1;
			}

			scaleNestedArray(img);
			var res = draw_grid(canvas, pxsz, img, 1, 0, null, null, null);
			$("#grad_cam_heatmap").show();
		}
	} else {
		$("#grad_cam_heatmap").hide();
	}

	await dispose(heatmap);

}

function _get_resized_webcam (predict_data, h, w) {
	try {
		var res = tidy(() => {
			var divide_by = parse_float($("#divide_by").val());
			var r = tf_to_float(expand_dims(resize_image(predict_data, [h, w])));

			if(divide_by != 1) {
				r = tidy(() => { return divNoNan(r, divide_by); });
			}

			return r;
		});

		return res;
	} catch (e) {
		if(Object.keys(e).includes("message")) {
			e = e.message;
		}

		assert(false, e);
	}
}

async function handle_predict_webcam_error (e, predictions_tensor, predict_data) {
	if(("" + e).includes("already disposed")) {
		dbg("[predict_webcam] Model Tensor already disposed");
	} else if(("" + e).includes("n is undefined")) {
		dbg("[predict_webcam] Model weights probably already disposed, this is usually not harmful");
	} else if(("" + e).includes("but got array with shape")) {
		dbg("[predict_webcam] Wrong shape for predict_webcam. This may happen if you resize width and/or height while you predict the webcam. In this case, it's harmless. Restarting webcam...");
		await show_webcam(1);
	} else {
		err("[predict_webcam] Error (512): " + e);

		err(e);
	}

	currently_predicting_webcam = false;

	await dispose(predictions_tensor);
	await dispose(predict_data);
}

async function predict_webcam () {
	try {
		if(currently_predicting_webcam) {
			dbg(language[lang]["already_predicting_exiting_webcam"])
			return;
		}

		currently_predicting_webcam = true;

		if(!cam) {
			dbg(language[lang]["cam_not_defined_existing_webcam"]);
			currently_predicting_webcam = false;
			return;
		}

		if(is_hidden_or_has_hidden_parent($("#webcam")) && is_hidden_or_has_hidden_parent("#fcnn_canvas")) {
			currently_predicting_webcam = false;
			return;
		}

		var cam_img = await cam.capture();

		var wait = null;

		var predict_data = tidy(() => {
			return _get_resized_webcam(cam_img, height, width);
		});

		await dispose(cam_img);

		var predictions_tensor = null;
		try {
			warn_if_tensor_is_disposed(predict_data);
			predictions_tensor = await __predict(predict_data);

			if(!predictions_tensor) {
				dbg(language[lang]["empty_predictions_tensor_in_predict_webcam"])
				return;
			}
		} catch (e) {
			await handle_predict_webcam_error(e, predictions_tensor, predict_data);

			return;
		}

		warn_if_tensor_is_disposed(predictions_tensor);
		await draw_heatmap(predictions_tensor, predict_data, 1);

		var predictions = array_sync(predictions_tensor);

		var webcam_prediction = $("#webcam_prediction");
		webcam_prediction.html("").show();

		if(!await input_shape_is_image() && labels.length == 0) {
			var str = "[" + predictions.join(", ") + "]";
			webcam_prediction.append(str);
		} else {
			if(predictions.length) {
				webcam_prediction.html("");
				if(model.outputShape.length == 4) {
					var pxsz = 1;

					var largest = Math.max(predictions_tensor.shape[1], predictions_tensor.shape[2]);

					var max_height_width = Math.min(150, Math.floor(window.innerWidth / 5));
					while ((pxsz * largest) < max_height_width) {
						pxsz += 1;
					}

					if(predictions_tensor.shape[3] == 3) {
						draw_rgb(predictions_tensor, predictions, pxsz, webcam_prediction);
					} else {
						draw_multi_channel(predictions_tensor, webcam_prediction, pxsz);
					}
				} else {
					await _webcam_predict_text(webcam_prediction, predictions[0]);
				}
			} else {
				dbg("[predict_webcam] predictions is empty for predict_webcam");
			}
		}

		await dispose(predictions_tensor);
		await dispose(predict_data);

		await nextFrame();

		currently_predicting_webcam = false;
	} catch (e) {
		if(Object.keys(e).includes("message")) {
			e = e.message;
		}

		log(e);
		assert(false, e);
	}
}

function draw_multi_channel (predictions_tensor, webcam_prediction, pxsz) {
	try {
		var transposed = array_sync(tf_transpose(predictions_tensor, [3, 1, 2, 0]));

		for (var predictions_idx = 0; predictions_idx < predictions_tensor.shape[3]; predictions_idx++) {
			var canvas = $("<canvas/>", {class: "layer_image"}).prop({
				height: pxsz * predictions_tensor.shape[1],
				width: pxsz * predictions_tensor.shape[2]
			});

			webcam_prediction.append(canvas);

			var d = transposed[predictions_idx];

			draw_grid(canvas, pxsz, d, 1, 1, null, null, null);
		}
	} catch (e) {
		if(Object.keys(e).includes("message")) {
			e = e.message;
		}

		assert(false, e);
	}
}

function draw_rgb (predictions_tensor, predictions, pxsz, webcam_prediction) {
	try {
		var canvas = $("<canvas/>", {class: "layer_image"}).prop({
			width: pxsz * predictions_tensor.shape[2],
			height: pxsz * predictions_tensor.shape[1],
		});

		webcam_prediction.append(canvas);

		draw_grid(canvas, pxsz, predictions[0], 1, 0, null, null, null);
	} catch (e) {
		if(Object.keys(e).includes("message")) {
			e = e.message;
		}

		assert(false, e);
	}
}

async function _webcam_predict_text (webcam_prediction, predictions) {
	try {
		var max_i = 0;
		var max_probability = -9999999;

		for (let predictions_idx = 0; predictions_idx < predictions.length; predictions_idx++) {
			var probability = predictions[predictions_idx];
			if(probability > max_probability) {
				max_probability = probability;
				max_i = predictions_idx;
			}
		}

		if(labels.length == 0) {
			await get_label_data();
		}

		await _predict_webcam_html(predictions, webcam_prediction, max_i);
	} catch (e) {
		if(Object.keys(e).includes("message")) {
			e = e.message;
		}

		assert(false, e);
	}
}

async function _predict_webcam_html(predictions, webcam_prediction, max_i) {
	try {
		var str = "<table class='predict_table'>";

		for (let predictions_idx = 0; predictions_idx < predictions.length; predictions_idx++) {
			str += _webcam_prediction_row(predictions_idx, predictions, max_i);
		}

		str += "</table>";

		webcam_prediction.append(str);
	} catch (e) {
		if(Object.keys(e).includes("message")) {
			e = e.message;
		}

		assert(false, e);
	}
}

function _webcam_prediction_row (predictions_idx, predictions, max_i) {
	assert(typeof(predictions_idx) == "number", "predictions_idx is not a number");
	assert(typeof(max_i) == "number", "max_i is not a number");
	assert(typeof(predictions) == "object", "predictions is not an object");

	try {
		var str = "";
		var label = labels[predictions_idx % labels.length];
		var probability = predictions[predictions_idx];

		assert(typeof(probability) == "number", "probability is not a number");

		var w = Math.floor(probability * 50);

		let classes = [];
		let content;

		if(show_bars_instead_of_numbers()) {
			if(predictions_idx == max_i) {
				classes.push("highest_bar");
			}
			content = `<span class='bar'><span${classes.length ? ` class='${classes.join(" ")}'` : ""} style='width: ${w}px'></span></span>`;
		} else {
			let prob_text = (probability * 50) + "%";
			if(predictions_idx == max_i) prob_text = `<b class='max_prediction'>${prob_text}</b>`;
			content = prob_text;
		}

		str += `<tr><td class='label_element'>${label}</td><td>${content}</td></tr>`;

		return str;
	} catch (e) {
		if(Object.keys(e).includes("message")) {
			e = e.message;
		}

		assert(false, e);
	}
}

/* This function checks to see if the shape of the tensor matches the input layer shape of the model. */

function tensor_shape_matches_model (_tensor, m = model) {
	if(!m || typeof(m) == "object" && !Object.keys(m).includes("layers") && Object.keys(m.layers).includes(0)) {
		model_is_ok();
		return false;
	}

	assert(_tensor, "Tensor is not defined");
	assert(typeof(_tensor) == "object", "Tensor is not an object");
	assert(Object.keys(_tensor).includes("shape"), "Tensor has no shape key");

	if(!Object.keys(m).includes("layers")) {
		return false;
	}

	try {
		var input_layer_shape = eval(JSON.stringify(m.layers[0].input.shape.filter(n => n)));

		var tensor_shape = eval(JSON.stringify(_tensor.shape));

		if(tensor_shape.length - 1 == input_layer_shape.length) {
			input_layer_shape.unshift(null);
		}

		for (var input_layer_shape_idx = 1; input_layer_shape_idx < input_layer_shape.length; input_layer_shape_idx++) {
			if(!tensor_shape[input_layer_shape_idx] == input_layer_shape[input_layer_shape_idx]) {
				return false;
			}
		}

		return true;
	} catch (e) {
		return false;
	}
}

function draw_bars_or_numbers (predictions_idx, predictions, max) {
	try {
		var label = labels[predictions_idx % labels.length];
		var val = predictions[0][predictions_idx];
		var w = Math.floor(val * 50);

		var html = "";

		let cell_content;
		let classes = [];

		if(val == max) {
			classes.push("highest_bar");
		}

		if(show_bars_instead_of_numbers()) {
			let bar_style = `width: ${w}px`;
			let inner_span = `<span${classes.length ? ` class='${classes.join(" ")}'` : ""} style='${bar_style}'></span>`;
			let bar_span = `<span class='bar'>${inner_span}</span>`;
			cell_content = label ? `<td class='label_element'>${label}</td><td>${bar_span}</td>` : `<td>${bar_span}</td>`;
		} else {
			let value_text = val == max ? `<b class='best_result'>${predictions[0][predictions_idx]}</b>` : (label ? predictions[0][predictions_idx] : predictions[0][predictions_idx]);
			cell_content = label ? `<td class='label_element'>${label}</td><td>${value_text}</td>` : `<td>${value_text}</td>`;
		}

		html = `<tr>${cell_content}</tr>`;


		return html;
	} catch (e) {
		if(Object.keys(e).includes("message")) {
			e = e.message;
		}

		assert(false, e);
	}
}

async function predict_handdrawn () {
	if(has_zero_output_shape || !await input_shape_is_image() || is_setting_config) {
		return;
	}

	if(!model) {
		throw new Error("[predict_handdrawn] model is undefined or null");
		return;
	}

	if(!Object.keys(atrament_data).includes("sketcher")) {
		if(sketcher_warning >= 1 && finished_loading) {
			dbg("[predict_handdrawn] Sketcher is not (yet?) defined. Not predicting handdrawn. If this occurs more than once, it may imply a bug.");
		}
		sketcher_warning++;

		return;
	}

	if (!atrament_data || !atrament_data.sketcher || !atrament_data.sketcher.canvas) {
		err("Cannot predict handdrawn. Sketcher was not found.");
		return;
	}

	var predict_data;
	try {
		predict_data = tidy(() => {
			var drawn_pixels = fromPixels(atrament_data.sketcher.canvas);
			return expand_dims(resize_image(
				drawn_pixels,
				[height, width]
			));
		});
	} catch (e) {
		await write_error("" + e, null, null);
		await dispose(predict_data);
		return;
	}

	if(!predict_data) {
		await dispose(predict_data);
		err("[predict_handdrawn] No predict data");
		return;
	}

	if(await dispose_predict_data_if_not_needed_anymore(predict_data)) {
		return;
	}
	
	var new_predict_handdrawn_hash = await get_current_status_hash();
	last_predict_handdrawn_hash = new_predict_handdrawn_hash;
	last_handdrawn_image_hash = new_handdrawn_image_hash;

	predict_data = await divide_by_if_needed(predict_data);

	var predictions_tensor = null;
	try {
		if(warn_if_tensor_is_disposed(predict_data)) {
			predictions_tensor = await __predict(predict_data);
		} else {
			return;
		}
	} catch (e) {
		await handle_handdrawn_error(e, predictions_tensor, predict_data);
		return;
	}

	if(!warn_if_tensor_is_disposed(predictions_tensor)) {
		return;
	}

	await draw_heatmap(predictions_tensor, predict_data);
	await _predict_handdrawn(predictions_tensor);
	await temml_or_wrn();
	await dispose(predictions_tensor);
	await dispose(predict_data);

	allow_editable_labels();

	await restart_fcnn(1);
}

async function dispose_predict_data_if_not_needed_anymore(predict_data) {
	if(waiting_updated_page_uuids.length < 1) {
		var new_predict_handdrawn_hash = await get_current_status_hash();

		if(last_predict_handdrawn_hash == new_predict_handdrawn_hash) {
			var as = array_sync(predict_data);
			var stringified = JSON.stringify(as);
			new_handdrawn_image_hash = await md5(stringified);

			if(last_handdrawn_image_hash == new_handdrawn_image_hash) {
				info("[predict_handdrawn] Handdrawn image hash or status hash has not changed. Not repredict handdrawn");

				await dispose(predict_data);

				return true;
			}
		}
	}

	return false;
}

async function temml_or_wrn() {
	try {
		await _temml();
	} catch (e) {
		wrn(e);
	}
}

async function divide_by_if_needed (predict_data) {
	var divide_by = parse_float($("#divide_by").val());

	var divided_data = null;

	warn_if_tensor_is_disposed(predict_data);
	divided_data = tidy(() => {
		return divNoNan(predict_data, divide_by);
	});

	warn_if_tensor_is_disposed(predict_data);
	await dispose(predict_data);

	predict_data = divided_data;
	warn_if_tensor_is_disposed(predict_data);

	return predict_data;
}

async function handle_handdrawn_error(e, predictions_tensor, predict_data) {
	if(Object.keys(e).includes("message")) {
		e = e.message;
	}

	if(("" + e).includes("is already disposed")) {
		dbg("[predict_handdrawn] weights are already disposed. Not predicting handdrawn");
	} else if (("" + e).includes("float32 tensor, but got")) {
		err("[predict_handdrawn] " + e);
	} else if(("" + e).includes("Sequential model cannot be built: model is empty")) {
		err("[predict_handdrawn] " + e);
		return;
	} else if(("" + e).includes("but got array with shape")) {
		var _err = e + ". This may have happened when you change the model input size while prediction. In which case, it is a harmless error.";
		dbg("[predict_handdrawn] " + _err);
	} else if(("" + e).includes("n is undefined")) {
		dbg("[predict_handdrawn] Model weights probably already disposed, this is usually not harmful");
	} else if(("" + e).includes("Unsupported input rank by")) {
		dbg("[predict_handdrawn] Warning: " + e + ", this most probably means that a layer was being removed while you were in prediction");
	} else {
		l(language[lang]["predict_data_shape"] + ": [" + predict_data.shape.join(",") + "]");
		void(0); dbg("Debugt message 443: " + e);
	}

	await dispose(predictions_tensor);
	await dispose(predict_data);
}

async function _predict_handdrawn(predictions_tensor) {
	try {
		var handdrawn_predictions = $("#handdrawn_predictions");
		handdrawn_predictions.html("");

		var ret = null;

		if(model_output_shape_looks_like_classification()) {
			ret = await _classification_handdrawn(predictions_tensor, handdrawn_predictions);
		} else if(model.outputShape.length == 4) {
			ret = await _image_output_handdrawn(predictions_tensor);
		} else {
			var predictions_tensor_synced = array_sync(predictions_tensor, true);
			if (predictions_tensor_synced) {
				ret = arbitrary_array_to_latex(predictions_tensor_synced);
			}
		}

		handdrawn_predictions.html(ret);

		return ret;
	} catch (e) {
		if(Object.keys(e).includes("message")) {
			e = e.message;
		}

		assert(false, e);
	}
}

async function _image_output_handdrawn(predictions_tensor) {
	try {
		var predictions_tensor_transposed = tf_transpose(predictions_tensor, [3, 1, 2, 0]);
		var predictions = array_sync(predictions_tensor_transposed);

		var pxsz = 1;

		var largest = Math.max(predictions_tensor_transposed[1], predictions_tensor_transposed[2]);

		var max_height_width = Math.min(150, Math.floor(window.innerWidth / 5));
		while ((pxsz * largest) < max_height_width) {
			pxsz += 1;
		}

		scaleNestedArray(predictions);
		for (var predictions_idx = 0; predictions_idx < predictions.length; predictions_idx++) {
			var canvas = $("<canvas/>", {class: "layer_image"}).prop({
				width: pxsz * predictions_tensor.shape[2],
				height: pxsz * predictions_tensor.shape[1],
			});

			$("#handdrawn_predictions").append(canvas);

			draw_grid(canvas, pxsz, predictions[predictions_idx], 1, 1, null, null, null);
		}

		await dispose(predictions_tensor_transposed);
	} catch (e) {
		if(Object.keys(e).includes("message")) {
			e = e.message;
		}

		assert(false, e);
	}
}

async function _classification_handdrawn (predictions_tensor, handdrawn_predictions) {
	try {
		if(!predictions_tensor) {
			err(language[lang]["predictions_tensor_not_defined"]);
			return "";
		}

		var predictions = predictions_tensor;
		if(is_tf_tensor(predictions)) {
			predictions = array_sync(predictions_tensor);
		}

		var max = 0;

		for (var predictions_idx = 0; predictions_idx < predictions[0].length; predictions_idx++) {
			if(max < predictions[0][predictions_idx]) {
				max = predictions[0][predictions_idx];
			}
		}

		var html = "<table class='predict_table'>";

		for (var predictions_idx = 0; predictions_idx < predictions[0].length; predictions_idx++) {
			html += draw_bars_or_numbers(predictions_idx, predictions, max);
		}

		html += "</table>";

		handdrawn_predictions.html(html);
	} catch (e) {
		if(Object.keys(e).includes("message")) {
			e = e.message;
		}

		assert(false, e);
	}
}

async function repredict () {
	await show_prediction(0, 1);
	await predict_webcam();
	await predict_handdrawn();
}

function warn_if_tensor_is_disposed (tensor) {
	if(tensor === null) {
		info('warn_if_tensor_is_disposed: tensor was null');
		console.trace()
		return false;
	}

	if(tensor === undefined) {
		info('warn_if_tensor_is_disposed: tensor was undefined');
		console.trace()
		return false;
	}

	if(!tensor) {
		wrn(language[lang]["given_object_not_a_tensor"]);
		return false;
	}

	if(tensor.isDisposedInternal) {
		err(language[lang]["tensor_already_disposed_where_it_shouldnt_be"]);
		return false;
	}

	return true;
}
