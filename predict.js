"use strict";

function _label_input_td(label, label_index) {
	var safe_label = label ? ("" + label).replaceAll(/'/g, "") : "";
	return `<td class='label_element'><input class='label_input_element' type='text' value='${safe_label}' onchange='update_label_by_nr(this, ${label_index})'></td>`;
}

function _get_placeholder_prediction_table() {
	if (labels.length === 0) return "";
	var html = "<table class='predict_table'><tbody>";
	for (var i = 0; i < labels.length; i++) {
		html += "<tr>" + _label_input_td(labels[i], i) + "<td>" + _create_bar_html(0, false, 0) + "</td></tr>";
	}
	html += "</tbody></table>";
	return html;
}

function extract_error_message(e) {
	if (e && typeof e === "object" && Object.keys(e).includes("message")) {
		return e.message;
	}
	return "" + e;
}

async function __predict (data, __model = model, recursion = 0) {
	if(!data) {
		err("[__predict] data undefined");
		return;
	}

	if(recursion > 2) {
		info("[__predict] Too many retries for predict.");
		if(data) {
			log("Data which has been tried too many times:", data);
		}
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

		renderLayerIOStats("health_status");

		return res;
	} catch (e) {
		var ret = await handle_predict_internal_errors(e, data, __model, recursion);
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
			break;
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
			var mis = __model?.input?.shape?.join(", ");

			dbg(sprintf(language[lang]["wrong_input_shape_for_prediction_data_x_model_y"], dis, mis));
		} else {
			dbg(sprintf(language[lang]["wrong_input_shape_for_prediction_data_x_model_y"], dis, "not determinable"));
		}

		await dispose(data);

		return true;
	} else if(("" + e).includes("is already disposed") && ("" + e).includes("LayersVariable")) {
		//dbg(language[lang]["model_was_already_disposed"]);
		await dispose(data);

		return true;
	} else {
		await compile_model();

		if(warn_if_tensor_is_disposed(data)) {
			return await __predict(data, model, recursion + 1);
		} else {
			dbg(language[lang]["cannot_predict_since_the_data_about_to_be_predicted_is_already_disposed"]);
			await dispose(data);
			return true;
		}
	}
}

async function get_label_data () {
	if((get_data_origin() == "image" || input_shape_is_image()) && get_data_origin() == "default") {
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

		for (let files_idx = 0; files_idx < files.length; files_idx++) {
			$($(".single_pred")[files_idx]).removeAttr("src");

			var img_elem = $($(".uploaded_file_img")[files_idx])[0];

			var async_func;

			img_elem.src = URL.createObjectURL(files[files_idx]);

			img_elem.onload = (function(filesIdx) {
				return async function() {
					var _img_elem = $($(".uploaded_file_img")[filesIdx])[0];
					URL.revokeObjectURL(_img_elem.src);
					var _result = await predict(_img_elem);
					var $set_this = $($(".uploaded_file_prediction")[filesIdx]);
					assert($set_this.length, `.uploaded_file_prediction[${filesIdx}] not found!`);
					$set_this.html(_result).show();
					$(".only_show_when_predicting_image_file").show();
				};
			})(files_idx);
		}

		$output.show();
	} catch (e) {
		assert(false, extract_error_message(e));
	}
}

function show_predict_spinner(target_selector) {
	$(target_selector).prepend("<span class='predict-spinner'>⏳ " + language[lang]["predicting"] + "</span>");
}

function hide_predict_spinner(target_selector) {
	$(target_selector).find(".predict-spinner").remove();
}

function compute_pixel_size(largest_dim, max_size = 150) {
	var max_hw = Math.min(max_size, Math.floor(window.innerWidth / 5));
	var pxsz = Math.max(1, Math.floor(max_hw / largest_dim));
	return pxsz;
}

function find_max_index(arr) {
	var max_i = 0;
	for (var i = 1; i < arr.length; i++) {
		if (arr[i] > arr[max_i]) max_i = i;
	}
	return max_i;
}

function find_max_value(arr) {
	return arr[find_max_index(arr)];
}

function _predict_error (e) {
	dbg(e);
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
		_predict_error(extract_error_message(e));
	}

	return tensor_img;
}

async function _get_tensor_img(item) {
	var tensor_img = null;

	try {
		tensor_img = await tidy(() => {
			const img_tensor = fromPixels(item);
			const divided_img = _divide_img_tensor(img_tensor);
			const resized_img = resize_image(divided_img, [height, width]);
			const expanded_img = expand_dims(resized_img);
			const float_img = tf_to_float(expanded_img);

			return float_img;
		});
	} catch (e) {
		void(0); log("item:", item, "width:", width, "height:", height, "error:", e);

		_predict_error(extract_error_message(e));
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
		_predict_error("" + extract_error_message(e));
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
		_predict_error("" + extract_error_message(e));

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

	if(!Object.keys(model?.layers).includes("0")) {
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
		dbg("[predict_demo] Model input shape: ", model?.input?.shape, "Tensor-Img-shape:", tensor_img.shape);
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
	allow_editable_labels(); // await not useful here

	await dispose_predict_demo_tensors(tensor_img, new_tensor_img);
}

async function handle_predict_demo_error(e, tensor_img, tried_again, new_tensor_img, item, nr) {
	e = extract_error_message(e);

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
	await dispose(tensor_img, new_tensor_img);

	await nextFrame();
}

async function predict_demo_batch(items, indices) {
	if(!items.length || !model) return;
	if(has_zero_output_shape) return;
	if(model.outputShape.length != 2) {
		for(var i = 0; i < items.length; i++) {
			await predict_demo(items[i], indices[i]);
		}
		return;
	}

	try {
		if(labels.length == 0) {
			await get_label_data();
		}
	} catch (e) {
		return;
	}

	var input_tensors = [];
	var valid_indices = [];

	for(var i = 0; i < items.length; i++) {
		var item = items[i];

		if(!set_item_natural_width(item)) continue;
		if(item.width == 0) continue;

		var tensor_img = await _get_tensor_img(item);

		if(!tensor_img) continue;

		if(!tensor_shape_matches_model(tensor_img)) {
			await dispose(tensor_img);
			continue;
		}

		input_tensors.push(tensor_img);
		valid_indices.push(indices[i]);
	}

	if(!input_tensors.length) return;

	await wait_for_backend_hack();

	if(!model) {
		for(var t of input_tensors) await dispose(t);
		return;
	}

	var batch_tensor = null;
	var batch_predictions = null;

	try {
		batch_tensor = tf.concat(input_tensors, 0);
		batch_predictions = await __predict(batch_tensor);
	} catch (e) {
		await dispose(batch_tensor);
		for(var t of input_tensors) await dispose(t);

		for(var i = 0; i < items.length; i++) {
			await predict_demo(items[i], indices[i]);
		}
		return;
	}

	if(!batch_predictions) {
		await dispose(batch_tensor);
		for(var t of input_tensors) await dispose(t);
		return;
	}

	var all_preds = array_sync(batch_predictions);

	for(var i = 0; i < input_tensors.length; i++) {
		var pred_tensor = tensor(all_preds[i]);
		await _predict_result(pred_tensor, valid_indices[i], 0);
		await draw_heatmap(pred_tensor, input_tensors[i]);
		await dispose(pred_tensor);
	}

	await dispose(batch_tensor, batch_predictions);

	for(var t of input_tensors) await dispose(t);

	hide_unused_layer_visualization_headers();
	change_output_and_example_image_size();
	await allow_editable_labels();

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
		assert(false, extract_error_message(e));
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
		var largest = Math.max(predictions_tensor.shape[1], predictions_tensor.shape[2]);
		assert(typeof(largest) == "number", "_predict_image: largest is not a number");

		var pxsz = compute_pixel_size(largest, 100);

		if (predictions_tensor.shape[3] == 3) {
			// Draw as single RGB image
			var predictions = array_sync(predictions_tensor);
			scaleNestedArray(predictions);

			var canvas = $("<canvas/>", {class: "layer_image"}).prop({
				width: pxsz * predictions_tensor.shape[2],
				height: pxsz * predictions_tensor.shape[1],
			});
			desc.append(canvas);
			draw_grid(canvas, pxsz, predictions[0], 1, 0, null, null, null);
		} else {
			// Original multi-channel grayscale behavior
			var predictions_tensor_transposed = tf_transpose(predictions_tensor, [3, 1, 2, 0]);
			var predictions = array_sync(predictions_tensor_transposed);
			scaleNestedArray(predictions);

			for (var predictions_idx = 0; predictions_idx < predictions.length; predictions_idx++) {
				var canvas = $("<canvas/>", {class: "layer_image"}).prop({
					width: pxsz * predictions_tensor.shape[2],
					height: pxsz * predictions_tensor.shape[1],
				});
				desc.append(canvas);
				draw_grid(canvas, pxsz, predictions[predictions_idx], 1, 1, null, null, null);
			}
			await dispose(predictions_tensor_transposed);
		}
	} catch (e) {
		assert(false, extract_error_message(e));
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
		if (max === min) return;
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
				let probability = predictions[predictions_idx];
				if(probability > max_probability) {
					max_probability = probability;
					max_i = predictions_idx;
				}
			}

			var fullstr = "";

			fullstr += "<table class='predict_table'>";

			for (let predictions_idx = 0; predictions_idx < predictions.length; predictions_idx++) {
				var label = labels[predictions_idx % labels.length];
				let probability = predictions[predictions_idx];
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
		wrn("" + extract_error_message(e));
	}
}

async function _predict_table(predictions_tensor, desc) {
	if(!predictions_tensor) {
		wrn("[_predict_table] predictions_tensor was empty");
		return;
	}

	try {
		var predictions = tidy(() => { return predictions_tensor.dataSync(); });

		if(predictions.length) {
			var max_i = find_max_index(predictions);

			var fullstr = "";

			fullstr += "<table class='predict_table'>";

			for (let predictions_idx = 0; predictions_idx < predictions.length; predictions_idx++) {
				var label = labels[predictions_idx % labels.length];
				let probability = predictions[predictions_idx];
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
		wrn("" + extract_error_message(e));
	}
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
			let input_shape = model?.layers[0].input.shape;

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
		assert(false, extract_error_message(e));
	}
}

async function handle_predict_error (e, predict_data) {
	e = extract_error_message(e);

	if(predict_data) {
		await dispose(predict_data);
	}

	if(("" + e).includes("Expected input shape")) {
		dbg("" + e);
	} else {
		l("" + e);
		console.trace();
	}
}

async function get_predict_data_or_warn_in_case_of_error(predict_data, item) {
    try {
        predict_data = await tidy(() => {
            // Benutze item direkt, wenn es eine gültige Pixel-Quelle ist
            var raw_input = _is_valid_pixels_source(item) ? item : get_predict_input_value();

            if (typeof input_shape_is_image === "function" && input_shape_is_image()) {
                if (!_is_valid_pixels_source(raw_input)) {
                    dbg("[get_predict_data_or_warn_in_case_of_error] Cannot call fromPixels: input is not a valid image source (got " + typeof raw_input + ")");
                    return null;
                }
            }

            var img_tensor = fromPixels(raw_input);
            var resized = resize_image(img_tensor, [height, width]);
            var expanded = expand_dims(resized);
            var divided = divNoNan(expanded, parse_float($("#divide_by").val()));
            return divided;
        });
    } catch (e) {
        await handle_predict_error(e, predict_data);
        console.trace();
        return null;
    }

    if (!predict_data || predict_data.isDisposed) {
        dbg("[should_abort_predict] [predict] predict_data is null or undefined");
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
		predict_data = await get_predict_data_or_warn_in_case_of_error(predict_data, item);
	} else {
		predict_data = await get_non_image_prediction_data(predict_data, item);
	}

	return predict_data;
}

async function get_predict_data_error_string_or_false (predict_data) {
	if(!predict_data) {
		await dispose(predict_data);

		let pstr = "Empty predict data, not predicting";

		l(pstr);

		return pstr;
	} else if(predict_data.shape.includes("0") || predict_data.shape.includes(0)) {
		await dispose(predict_data);

		let pstr = "Predict data tensor shape contains 0, not predicting";

		l(pstr);

		return pstr;
	}

	return false;
}

function reset_predict_error_and_predict_tab (pred_tab) {
	$("#" + pred_tab).html("").show();
	reset_predict_error();
}

function check_predict_data_and_model(predict_data) {
	if(predict_data["isDisposedInternal"]) {
		dbg("[predict] predict_data is already disposed!");
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
		var err_msg = `Error 1201: ${e}, predict data shape: [${predict_data.shape.join(", ")}], model input shape: [${model?.input?.shape?.filter(n => n)?.join(",")}]`;

		set_predict_error(err_msg);
	}
}

function set_predict_error(msg) {
	msg = msg.replaceAll(/Error: /g, "");
	$("#predict_error").html("" + msg).show();
	dbg(msg);
}

async function show_not_reshapable_error (mi, predict_data) {
	var pd_nr = number_of_elements_in_tensor_shape(predict_data.shape);
	var is_nr = number_of_elements_in_tensor_shape(mi);

	await dispose(predict_data);

	throw new Error(`Could not reshape data for model (predict_data.shape/model?.input?.shape: [${pd_nr}], [${is_nr}]`);
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
	await repredict();
}

async function _predict_validate_and_get_data(item, pred_tab) {
	var is_image_prediction = input_shape_is_image();

	var predict_data = await get_predict_data(is_image_prediction, null, item);

	if(predict_data === false) {
		hide_predict_spinner("#" + pred_tab);
		return {aborted: true};
	}

	if (should_abort_predict(predict_data)) {
		dbg("[predict] predict_data is already disposed!");
		hide_predict_spinner("#" + pred_tab);
		return {aborted: true};
	}

	var predict_data_error_string_or_false = await get_predict_data_error_string_or_false(predict_data);

	if (predict_data_error_string_or_false !== false) {
		hide_predict_spinner("#" + pred_tab);
		return {aborted: true, error: predict_data_error_string_or_false};
	}

	if (!is_image_prediction) {
		predict_data = divide_predict_data_by_divide_by(predict_data);
	}

	if(check_predict_data_and_model(predict_data)) {
		hide_predict_spinner("#" + pred_tab);
		return {aborted: true};
	}

	var mi = model?.input?.shape;
	if(!mi) {
		err(language[lang]["cannot_get_model_input_shape"]);
		hide_predict_spinner("#" + pred_tab);
		return {aborted: true};
	}
	mi[0] = 1;

	return {aborted: false, predict_data: predict_data, mi: mi, is_image_prediction: is_image_prediction};
}

async function _predict_run_prediction(predict_data, mi, pred_tab) {
	var predictions_tensor = null;
	reset_predict_error();

	try {
		if(predict_data["isDisposedInternal"]) {
			dbg(`[predict] ${language[lang]["predict_data_is_already_disposed"]}!`);
			hide_predict_spinner("#" + pred_tab);
			return {aborted: true};
		}

		var prod_pred_shape = number_of_elements_in_tensor_shape(predict_data.shape);
		var prod_mod_shape = number_of_elements_in_tensor_shape(mi);

		predict_data = await prepare_predict_data(mi, predict_data, prod_pred_shape, prod_mod_shape);

		if(predict_data["isDisposedInternal"]) {
			dbg(`[predict] ${language[lang]["predict_data_is_already_disposed"]}!`);
			hide_predict_spinner("#" + pred_tab);
			return {aborted: true};
		}

		predictions_tensor = await __predict(predict_data);
	} catch (e) {
		report_prediction_shape_mismatch(mi, predict_data, e);
		hide_predict_spinner("#" + pred_tab);
		return {aborted: true};
	}

	warn_if_tensor_is_disposed(predictions_tensor);

	return {aborted: false, predictions_tensor: predictions_tensor, predict_data: predict_data};
}

async function predict(item) {
	const pred_tab = "prediction";

	reset_predict_error_and_predict_tab(pred_tab);

	show_predict_spinner("#" + pred_tab);

	var predictions = [];
	var str = "";
	var ok = 1;
	var estr = "";
	var predict_data = null;
	var has_html = false;

	try {
		var validated = await _predict_validate_and_get_data(item, pred_tab);
		if(validated.aborted) {
			return validated.error || undefined;
		}

		predict_data = validated.predict_data;
		var mi = validated.mi;
		var is_image_prediction = validated.is_image_prediction;

		var pred_result = await _predict_run_prediction(predict_data, mi, pred_tab);
		if(pred_result.aborted) {
			return;
		}

		var predictions_tensor = pred_result.predictions_tensor;
		predict_data = pred_result.predict_data;

		await draw_heatmap(predictions_tensor, predict_data);

		predictions = predictions_tensor.dataSync();

		str = await prepare_prediction_output(is_image_prediction, predictions, pred_tab, item, predictions_tensor, str);

		await render_prediction_tab(is_image_prediction, pred_tab, predictions_tensor, str, predict_data);
	} catch (e) {
		estr = e;

		await handle_this_predict_error(e, predict_data, estr);

		ok = 0;
	}

	hide_predict_spinner("#" + pred_tab);

	allow_editable_labels(); // await not useful here

	show_predict_error_if_required(ok, estr);

	await dispose(predict_data);

	await force_restart_fcnn();

	TopologicalAnalyzer.update();

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
		dbg(`[predict] ${language[lang]["predict_data_is_already_disposed"]}!`);
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
		dbg(`[predict] ${language[lang]["predict_data_is_already_disposed"]}!`);
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

	await dispose(predict_data, predictions_tensor);

	reset_predict_error();
}

function reset_predict_error () {
	$("#predict_error").html("").hide();
}

function set_prediction_non_image(latex) {
	if(latex) {
		const $pred_non_img = $("#prediction_non_image");
		if(!latex.startsWith("<span style='color: red'>")) {
			$pred_non_img.html(latex).show();
			temml.render($pred_non_img.text(), $pred_non_img[0]);
		} else {
			$pred_non_img.hide();
		}
	} else {
		hide_prediction_non_image();
	}
}

async function handle_this_predict_error (e, predict_data, latex) {
	e = extract_error_message(e);

	await dispose(predict_data);
	latex = "" + e;
	if(!latex.includes("yped")) {
		if(!latex.includes("Expected input shape")) {
			_predict_error("" + e);
		} else {
			set_prediction_non_image(latex);
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

	if(input_shape_is_image()) {
		await _print_example_predictions();
	} else {
		await _print_predictions_text();
	}

	if(!dont_go_to_tab) {
		if($("#jump_to_interesting_tab").is(":checked")) {
			$("a[href=\"#predict_tab\"]").click();
		}
	}
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
		e = extract_error_message(e);
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
		err("" + extract_error_message(e));
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
		log_once(`[_print_predictions_text] ${language[lang]["example_predict_data_was_empty"]}`);
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

		//await wait_for_model();

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
						if(latex_output) {
							html_contents += `<span class='temml_me'>\\mathrm{${network_name}}\\left(${latex_input}\\right) = ${latex_output}</span><br>`;
						}
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

		await dispose(_tensor, res);
	}

	if(html_contents) {
		$("#example_predictions").html(html_contents);
	}

	show_or_hide_predictions(count);

	temml_or_wrn();

	return count;
}

async function wait_for_model() {
	while (!model) {
		dbg(language[lang]["waiting_for_model"] + "...");
		log(get_stack_trace(1));
		await delay(200);
	}

	while (!typeof(model) == "object" || !Object.keys(model).includes("layers")) {
		dbg(language[lang]["waiting_for_model"] + "...");
		log(get_stack_trace(1));
		await delay(200);
	}
}

async function handle_internal_predict_text_error(e, _tensor, res) {
	e = extract_error_message(e);

	if(("" + e).includes("already disposed")) {
		dbg("[_print_predictions_text] Tensors were already disposed. Maybe the model was recompiled or changed while predicting. This MAY be the cause of a problem, but it may also not be.");
	} else if(("" + e).includes("Total size of new array must be unchanged")) {
		dbg("[_print_predictions_text] Total size of new array must be unchanged. Did you use reshape somewhere?");
	} else if(("" + e).includes("to have shape")) {
		dbg("[_print_predictions_text] Wrong input shape for _print_predictions_text: " + e);
	} else if(("" + e).includes("is already disposed")) {
		wrn(language[lang]["model_or_layer_was_already_disposed_not_predicting"]);
	} else {
		_predict_error(e);
		await dispose(_tensor, res);

		return true;
	}

	return false;
}

async function _wait_for_new_images(example_predictions) {
	var new_imgs = example_predictions.find('.example_images');
	var load_promises = [];
	var new_img_data = [];

	for(var i = 0; i < new_imgs.length; i++) {
		var img = new_imgs[i];
		new_img_data.push({img: img, idx: i});

		if(!img.complete || img.naturalHeight === 0) {
			var p = new Promise((resolve) => {
				img.onload = resolve;
				img.onerror = resolve;
			});
			load_promises.push(p);
		}
	}

	if(load_promises.length) {
		await Promise.all(load_promises);
	}

	var loaded = [];
	for(var i = 0; i < new_img_data.length; i++) {
		var data = new_img_data[i];
		if(data.img.complete && data.img.naturalHeight !== 0) {
			loaded.push({img: data.img, idx: data.idx});
		}
	}

	return loaded;
}

async function _print_example_predictions () {
	if(!input_shape_is_image()) {
		return false;
	}

	var count = 0;
	var example_predictions = $("#example_predictions");
	var dataset = $("#dataset").val();
	var full_dir = "traindata/" + dataset + "/example/";
	var dataset_url = "traindata/index.php?&dataset=" + dataset + "&examples=1";

	var data_from_url = await get_cached_json(dataset_url);

	if(data_from_url && Object.keys(data_from_url).includes("example")) {
		var examples = data_from_url["example"];

		if(examples) {
			var [str, count, existing_items, existing_indices] = await _get_example_string_image(examples, 0, full_dir);

			var all_items = existing_items.slice();
			var all_indices = existing_indices.slice();

			if(str) {
				example_predictions.html(str);

				var loaded = await _wait_for_new_images(example_predictions);
				for(var i = 0; i < loaded.length; i++) {
					all_items.push(loaded[i].img);
					all_indices.push(loaded[i].idx);
				}
			}

			if(all_items.length) {
				await predict_demo_batch(all_items, all_indices);
			}
		}
	}

	if(count == 0) {
		example_predictions.html("");
	}

	show_or_hide_predictions(count);

	return count;
}

async function _get_example_string_image(examples, count, full_dir) {
	assert(typeof(examples) == "object", "examples is not an object");
	assert(typeof(count) == "number", "count is not a number");
	assert(typeof(full_dir) == "string", "full_dir is not a string");

	// Build a placeholder table so the container is pre-sized
	var placeholder_table = _get_placeholder_prediction_table();
	if (labels.length > 0) {
		placeholder_table = "<table class='predict_table'><tbody>";
		for (var lbl_idx = 0; lbl_idx < labels.length; lbl_idx++) {
			placeholder_table += "<tr>" + _label_input_td(labels[lbl_idx], lbl_idx) + "<td>" + _create_bar_html(0, false, 0) + "</td></tr>";
		}
		placeholder_table += "</tbody></table>";
	}

	var str = "";
	var existing_items = [];
	var existing_indices = [];

	for (var examples_idx = 0; examples_idx < examples.length; examples_idx++) {
		count++;
		var img_url = full_dir + "/" + examples[examples_idx];
		var img_elem = $("img[src$='" + img_url + "']");

		if (img_elem.length) {
			try {
				var img = img_elem;
				if (Object.keys(img).includes("0")) {
					img = img_elem[0];
				}

				if ($(img).is(":visible")) {
					existing_items.push(img);
					existing_indices.push(examples_idx);
				}
			} catch (e) {
				log(language[lang]["predict_demo_failed_error"], e);
			}
		} else {
			str += `
				<div class='full_example_image_prediction inline_block'>
					<img src='${img_url}'
						alt="Example Image"
						class='example_images'
						onclick='predict_demo(this, ${examples_idx})' />
					<br>
					<div class='predict_demo_result'>${placeholder_table}</div>
				</div>`;
		}
	}

	return [str, count, existing_items, existing_indices];
}

function get_index_of_highest_category (predictions_tensor) {
	try {
		var js = predictions_tensor.dataSync();

		return find_max_index(js);
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

	if (!model || !model?.layers) {
		err("Model or model.layers is undefined!");
		return null;
	}

	if (layer_idx < 0 || layer_idx >= model?.layers?.length) {
		wrn(`layer_idx ${layer_idx} is out of bounds. Valid range: 0-${model?.layers?.length - 1}`);
		return null;
	}

	try {
		const outputShape = model?.layers[layer_idx].output.shape;
		dbg(`Layer ${layer_idx} output shape: ${JSON.stringify(outputShape)}`);
		return outputShape;
	} catch (e) {
		err(`Error retrieving output shape for layer ${layer_idx}: ${e.message}`);
		return null;
	}
}

async function draw_heatmap (predictions_tensor, predict_data, is_from_webcam=0) {
	if(!(
		input_shape_is_image(is_from_webcam) &&
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

			var pxsz = compute_pixel_size(largest, max_height_width);

			scaleNestedArray(img);
			var res = draw_grid(canvas, pxsz, img, 1, 0, null, null, null);
			$("#grad_cam_heatmap").show();
		}
	} else {
		$("#grad_cam_heatmap").hide();
	}

	await dispose(heatmap);

}

function _get_resized_webcam (webcam_image) {
	if(!webcam_image) {
		wrn("[_get_resized_webcam] webcam_image is null or undefined");
		return null;
	}

	try {
		var res = tidy(() => {
			var divide_by = parse_float($("#divide_by").val());
			var r = tf_to_float(expand_dims(resize_image(webcam_image, [height, width])));

			if(divide_by != 1) {
				r = tidy(() => { return divNoNan(r, divide_by); });
			}

			return r;
		});

		return res;
	} catch (e) {
		assert(false, extract_error_message(e));
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
	} else if(("" + e).includes("Error: Tensor is disposed.")) {
		dbg("[predict_webcam] The tensor seems to have been disposed.");
	} else {
		err("[predict_webcam] Error (512): " + e);

		err(e);
	}

	currently_predicting_webcam = false;

	await dispose(predictions_tensor, predict_data);
}

function _predict_webcam_validate () {
	if(currently_predicting_webcam) {
		dbg(language[lang]["already_predicting_exiting_webcam"]);
		return true;
	}

	if(!cam) {
		return true;
	}

	if(is_hidden_or_has_hidden_parent($("#webcam")) && is_hidden_or_has_hidden_parent("#fcnn_canvas")) {
		return true;
	}

	return false;
}

async function _predict_webcam_render (predictions, predictions_tensor, webcam_prediction) {
	if(!input_shape_is_image() && labels.length == 0) {
		var str = "[" + predictions.join(", ") + "]";
		webcam_prediction.append(str);
	} else {
		if(predictions.length) {
			if(model.outputShape.length == 4) {
				webcam_prediction.html("");
				var largest = Math.max(predictions_tensor.shape[1], predictions_tensor.shape[2]);
				var pxsz = compute_pixel_size(largest);

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
}

async function predict_webcam () {
	try {
		if(_predict_webcam_validate()) {
			currently_predicting_webcam = false;
			return;
		}

		currently_predicting_webcam = true;

		var webcam_image = await cam.capture();

		if(!webcam_image) {
			dbg("[predict_webcam] webcam_image is null or undefined, skipping this frame");
			currently_predicting_webcam = false;
			return;
		}

		show_predict_spinner("#webcam_prediction");

		var wait = null;

		try {
			var predict_data = tidy(() => {
				return _get_resized_webcam(webcam_image);
			});
		} catch (e) {
			console.error(e);
			hide_predict_spinner("#webcam_prediction");
			currently_predicting_webcam = false;
			return;
		}

		await dispose(webcam_image);

		if(!predict_data) {
			dbg("[predict_webcam] predict_data is null after resize, skipping this frame");
			hide_predict_spinner("#webcam_prediction");
			currently_predicting_webcam = false;
			return;
		}

		var predictions_tensor = null;
		try {
			warn_if_tensor_is_disposed(predict_data);
			predictions_tensor = await __predict(predict_data);

			if(!predictions_tensor) {
				dbg(language[lang]["empty_predictions_tensor_in_predict_webcam"]);
				hide_predict_spinner("#webcam_prediction");
				return;
			}
		} catch (e) {
			hide_predict_spinner("#webcam_prediction");
			await handle_predict_webcam_error(e, predictions_tensor, predict_data);

			return;
		}

		warn_if_tensor_is_disposed(predictions_tensor);
		await draw_heatmap(predictions_tensor, predict_data, 1);

		var predictions = array_sync(predictions_tensor);

		var webcam_prediction = $("#webcam_prediction");
		webcam_prediction.show();

		await _predict_webcam_render(predictions, predictions_tensor, webcam_prediction);

		hide_predict_spinner("#webcam_prediction");

		await dispose(predictions_tensor, predict_data);

		await nextFrame();

		currently_predicting_webcam = false;
	} catch (e) {
		e = extract_error_message(e);

		hide_predict_spinner("#webcam_prediction");
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
		assert(false, extract_error_message(e));
	}
}

function draw_rgb (predictions_tensor, predictions, pxsz, webcam_prediction) {
	try {
		var canvas = $("<canvas/>", {class: "layer_image"}).prop({
			width: pxsz * predictions_tensor.shape[2],
			height: pxsz * predictions_tensor.shape[1],
		});

		webcam_prediction.append(canvas);

		// Scale predictions to 0-255 range before drawing
		scaleNestedArray(predictions);

		draw_grid(canvas, pxsz, predictions[0], 1, 0, null, null, null);
	} catch (e) {
		assert(false, extract_error_message(e));
	}
}

async function _webcam_predict_text (webcam_prediction, predictions) {
	try {
		var max_i = find_max_index(predictions);

		if(labels.length == 0) {
			await get_label_data();
		}

		await _predict_webcam_html(predictions, webcam_prediction, max_i);
	} catch (e) {
		assert(false, extract_error_message(e));
	}
}

function _update_webcam_bar(tr, probability, isHighest) {
	var w = Math.floor(probability * 50);
	var pctText = _format_probability_text(probability);
	var rawText = _format_raw_value(probability);
	var fillClass = _get_bar_fill_classes(isHighest);

	var bar_outer = tr.find(".bar");
	if (!bar_outer.length) return;

	bar_outer.attr("title", rawText);
	bar_outer.attr("data-value", pctText);
	bar_outer.attr("data-raw", rawText);
	var bar_inner = bar_outer.children("span").first();
	bar_inner.attr("class", fillClass);
	bar_inner.css("width", w + "px");
	var tooltip = bar_outer.find(".bar-tooltip-pct");
	if (tooltip.length) tooltip.text(pctText);
}

function _update_webcam_text(tr, probability, isHighest) {
	var second_td = tr.find("td").eq(1);
	if (!second_td.length) return;

	let prob_text = (probability * 50);
	if (get_last_layer_activation_function() == "softmax") {
		prob_text += "%";
	}
	if (isHighest) {
		second_td.html(`<b class='best_result'>${prob_text}</b>`);
	} else {
		second_td.html(prob_text);
	}
}

function _update_webcam_row(tr, idx, predictions, max_i) {
	if (idx >= predictions.length) return;

	var probability = predictions[idx];
	var isHighest = idx == max_i;

	if (show_bars_instead_of_numbers()) {
		_update_webcam_bar(tr, probability, isHighest);
	} else {
		_update_webcam_text(tr, probability, isHighest);
	}
}

async function _predict_webcam_html(predictions, webcam_prediction, max_i) {
	try {
		var existing_table = webcam_prediction.find("table.predict_table");

		if (existing_table.length && existing_table.find("tr").length == predictions.length) {
			existing_table.find("tr").each(function(idx) {
				_update_webcam_row($(this), idx, predictions, max_i);
			});
			return;
		}

		var str = "<table class='predict_table'>";

		for (let predictions_idx = 0; predictions_idx < predictions.length; predictions_idx++) {
			str += _webcam_prediction_row(predictions_idx, predictions, max_i);
		}

		str += "</table>";

		webcam_prediction.append(str);
	} catch (e) {
		assert(false, extract_error_message(e));
	}
}

function _webcam_prediction_row(predictions_idx, predictions, max_i) {
	assert(typeof(predictions_idx) == "number", "predictions_idx is not a number");
	assert(typeof(max_i) == "number", "max_i is not a number");
	assert(typeof(predictions) == "object", "predictions is not an object");

	try {
		var str = "";
		var label = labels[predictions_idx % labels.length];
		var probability = predictions[predictions_idx];

		assert(typeof(probability) == "number", "probability is not a number");

		var w = Math.floor(probability * 50);

		let content;

		if (show_bars_instead_of_numbers()) {
			var isHighest = predictions_idx == max_i;
			content = _create_bar_html(w, isHighest, probability);
		} else {
			let prob_text = (probability * 50);
			if (get_last_layer_activation_function() == "softmax") {
				prob_text += "%";
			}
			if (predictions_idx == max_i) prob_text = `<b class='best_result'>${prob_text}</b>`;
			content = prob_text;
		}

		str += `<tr>${_label_input_td(label, predictions_idx % labels.length)}<td>${content}</td></tr>`;

		return str;
	} catch (e) {
		assert(false, extract_error_message(e));
	}
}

/* This function checks to see if the shape of the tensor matches the input layer shape of the model. */

function tensor_shape_matches_model (_tensor, m = model) {
	try {
		if(!m || typeof(m) == "object" && !Object.keys(m).includes("layers") && Object.keys(m.layers).includes(0)) {
			model_is_ok();
			return false;
		}
	} catch (err) {
		dbg(err);
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

function draw_bars_or_numbers(predictions_idx, predictions, max) {
	try {
		var label = labels[predictions_idx % labels.length];
		var val = predictions[0][predictions_idx];
		var w = Math.floor(val * 50);

		var html = "";

		let cell_content;
		var isHighest = val == max;

		if (show_bars_instead_of_numbers()) {
			var bar = _create_bar_html(w, isHighest, val);
			cell_content = label ? _label_input_td(label, predictions_idx % labels.length) + `<td>${bar}</td>` : `<td>${bar}</td>`;
		} else {
			let value_text = isHighest ? `<b class='best_result'>${predictions[0][predictions_idx]}</b>` : (label ? predictions[0][predictions_idx] : predictions[0][predictions_idx]);
			cell_content = label ? _label_input_td(label, predictions_idx % labels.length) + `<td>${value_text}</td>` : `<td>${value_text}</td>`;
		}

		html = `<tr>${cell_content}</tr>`;

		return html;
	} catch (e) {
		assert(false, extract_error_message(e));
	}
}

function is_canvas_visible() {
	var c = atrament_data && atrament_data.sketcher && atrament_data.sketcher.canvas;
	if (!c) return false;
	var style = window.getComputedStyle(c);
	var rect = c.getBoundingClientRect();
	return (
		rect.width > 0 &&
		rect.height > 0 &&
		rect.bottom > 0 &&
		rect.right > 0 &&
		style.visibility !== 'hidden' &&
		style.display !== 'none'
	);
}

function start_visibility_watcher() {
	if (_predict_visibility_observer) return;
	var c = atrament_data && atrament_data.sketcher && atrament_data.sketcher.canvas;
	if (!c) return;
	_predict_visibility_observer = new IntersectionObserver(function(entries) {
		if (entries.some(function(e) { return e.isIntersecting; })) {
			run_pending_prediction();
		}
	});
	_predict_visibility_observer.observe(c);
}

function run_pending_prediction() {
	if (_predict_running) return;
	if (!_predict_pending_args) return;
	if (!is_canvas_visible()) return;
	_predict_running = true;
	var args = _predict_pending_args;
	_predict_pending_args = null;
	Promise.resolve(_predict_handdrawn_internal.apply(null, args))
		.catch(function(e) { console.error('Prediction error:', e); })
		.finally(function() { _predict_running = false; });
}

async function predict_handdrawn() {
	_predict_pending_args = arguments;
	if (is_canvas_visible()) {
		run_pending_prediction();
	} else {
		start_visibility_watcher();
	}
}

function _predict_handdrawn_validate () {
	if(has_zero_output_shape || !input_shape_is_image() || is_setting_config || !finished_loading) {
		return true;
	}

	if(!model) {
		throw new Error("[predict_handdrawn] model is undefined or null");
	}

	if(!Object.keys(atrament_data).includes("sketcher")) {
		if(sketcher_warning >= 1 && finished_loading) {
			dbg("[predict_handdrawn] Sketcher is not (yet?) defined. Not predicting handdrawn. If this occurs more than once, it may imply a bug.");
		}
		sketcher_warning++;

		return true;
	}

	if (!atrament_data || !atrament_data.sketcher || !atrament_data.sketcher.canvas) {
		err("Cannot predict handdrawn. Sketcher was not found.");
		return true;
	}

	predict_handdrawn_counter++;

	if(predict_handdrawn_counter == 1) {
		dbg("One less predict Handdrawn during loading");
		return true;
	}

	return false;
}

async function _predict_handdrawn_fetch_canvas_tensor () {
	var predict_data;
	try {
		predict_data = tidy(() => {
			const _canvas = atrament_data.sketcher.canvas;
			if(_canvas) {
				var drawn_pixels = fromPixels(_canvas);
				const resized_img = resize_image(drawn_pixels, [height, width]);
				return expand_dims(resized_img);
			}
		});
	} catch (e) {
		hide_predict_spinner("#handdrawn_predictions");
		await write_error("" + e, null, null);
		await dispose(predict_data);
		return null;
	}

	if(!predict_data) {
		hide_predict_spinner("#handdrawn_predictions");
		await dispose(predict_data);
		err("[predict_handdrawn] No predict data");
		return null;
	}

	return predict_data;
}

async function _predict_handdrawn_internal () {
	var $hp = $("#handdrawn_predictions");
	if ($hp.length && $hp.is(":empty")) {
		$hp.html(_get_placeholder_prediction_table());
	}

	if(_predict_handdrawn_validate()) {
		return;
	}

	show_predict_spinner("#handdrawn_predictions");

	var predict_data = await _predict_handdrawn_fetch_canvas_tensor();
	if(!predict_data) {
		return;
	}

	if(await dispose_predict_data_if_not_needed_anymore(predict_data)) {
		hide_predict_spinner("#handdrawn_predictions");
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
			hide_predict_spinner("#handdrawn_predictions");
			return;
		}
	} catch (e) {
		hide_predict_spinner("#handdrawn_predictions");
		await handle_handdrawn_error(e, predictions_tensor, predict_data);
		return;
	}

	if(!warn_if_tensor_is_disposed(predictions_tensor)) {
		hide_predict_spinner("#handdrawn_predictions");
		return;
	}

	await draw_heatmap(predictions_tensor, predict_data);
	await _predict_handdrawn(predictions_tensor);
	hide_predict_spinner("#handdrawn_predictions");
	temml_or_wrn();
	await dispose(predictions_tensor, predict_data);

	allow_editable_labels(); // await not useful here

	await force_restart_fcnn();
}

async function dispose_predict_data_if_not_needed_anymore(predict_data) {
	if(waiting_updated_page_uuids.length < 1) {
		var new_predict_handdrawn_hash = await get_current_status_hash();

		if(last_predict_handdrawn_hash == new_predict_handdrawn_hash) {
			var as = array_sync(predict_data);
			var stringified = JSON.stringify(as);
			new_handdrawn_image_hash = await md5(stringified);

			if(last_handdrawn_image_hash == new_handdrawn_image_hash) {
				dbg("[predict_handdrawn] Handdrawn image hash or status hash has not changed. Not repredict handdrawn");

				await dispose(predict_data);

				return true;
			}
		}
	}

	return false;
}

function temml_or_wrn() {
	try {
		_temml();
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
	e = extract_error_message(e)

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

	await dispose(predictions_tensor, predict_data);
}

async function _predict_handdrawn(predictions_tensor) {
	try {
		var handdrawn_predictions = $("#handdrawn_predictions");
		handdrawn_predictions.html(_get_placeholder_prediction_table());

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
		assert(false, extract_error_message(e));
	}
}

async function _image_output_handdrawn(predictions_tensor) {
	try {
		var predictions_tensor_transposed = tf_transpose(predictions_tensor, [3, 1, 2, 0]);
		var predictions = array_sync(predictions_tensor_transposed);

		var largest = Math.max(predictions_tensor_transposed[1], predictions_tensor_transposed[2]);
		var pxsz = compute_pixel_size(largest);

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
		assert(false, extract_error_message(e));
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

		var max = find_max_value(predictions[0]);

		var html = "<table class='predict_table'>";

		for (let predictions_idx = 0; predictions_idx < predictions[0].length; predictions_idx++) {
			html += draw_bars_or_numbers(predictions_idx, predictions, max);
		}

		html += "</table>";

		handdrawn_predictions.html(html);
	} catch (e) {
		assert(false, extract_error_message(e));
	}
}

async function repredict () {
	await show_prediction(0, 1);
	await predict_webcam();
	await predict_handdrawn();

	await force_restart_fcnn();

	await plot_model_plot(1);
}

function warn_if_tensor_is_disposed (tensor) {
	if(tensor === null) {
		info('warn_if_tensor_is_disposed: tensor was null');
		console.trace();
		return false;
	}

	if(tensor === undefined) {
		info('warn_if_tensor_is_disposed: tensor was undefined');
		console.trace();
		return false;
	}

	if(!tensor) {
		wrn(language[lang]["given_object_not_a_tensor"]);
		return false;
	}

	if(tensor.isDisposedInternal) {
		dbg(language[lang]["tensor_already_disposed_where_it_shouldnt_be"]);
		return false;
	}

	return true;
}

async function predict_data_img (item, force_category) {
	assert(typeof(item) == "object", "item is not an object");

	var results;
	try {
		results = await predict(item);
	} catch (e) {
		err(extract_error_message(e));
	}

	if(!results) {
		err(language[lang]["results_is_empty_in"] + " predict_data_img");
		return;
	}

	var $item = $(item);
	var next_item = $item.next().next();

	if(next_item.length && next_item[0].tagName.toLowerCase() == "pre") {
		next_item.remove();
	}

	$item.after("<pre class='predict_data_img'>" + results + "</pre>");

	$("#remove_predict_data_img_predictions").show();
}

function remove_predict_data_img () {
	$(".predict_data_img").remove();

	$("#remove_predict_data_img_predictions").hide();
}

/**
 * Check if a value is a valid source for tf.browser.fromPixels().
 * Valid sources: HTMLImageElement, HTMLCanvasElement, HTMLVideoElement,
 * ImageData, OffscreenCanvas, or {data: Uint32Array, width, height}.
 * Returns false for strings, null, undefined, numbers, etc.
 */
function _is_valid_pixels_source(input) {
    if (!input) return false;
    if (typeof input === "string") return false;
    if (typeof input === "number") return false;

    // Check for DOM element types
    if (typeof HTMLImageElement !== "undefined" && input instanceof HTMLImageElement) return true;
    if (typeof HTMLCanvasElement !== "undefined" && input instanceof HTMLCanvasElement) return true;
    if (typeof HTMLVideoElement !== "undefined" && input instanceof HTMLVideoElement) return true;
    if (typeof ImageData !== "undefined" && input instanceof ImageData) return true;
    if (typeof OffscreenCanvas !== "undefined" && input instanceof OffscreenCanvas) return true;

    // Check for the {data, width, height} format
    if (typeof input === "object" && input.data && typeof input.width === "number" && typeof input.height === "number") {
        return true;
    }

    return false;
}

function _format_probability_text(probability) {
	if (probability === undefined || probability === null) return "";
	var pct = (probability * 100).toFixed(2);
	return pct + "%";
}

function _format_raw_value(probability) {
	if (probability === undefined || probability === null) return "";
	return probability.toFixed(6);
}

function _get_bar_fill_classes(isHighest) {
	var classes = ["bar-fill"];
	if (isHighest) classes.push("highest_bar");
	return classes.join(" ");
}

function _create_bar_html(width, isHighest, probability) {
	var pctText = _format_probability_text(probability);
	var rawText = _format_raw_value(probability);
	var fillClass = _get_bar_fill_classes(isHighest);

	var tooltip = pctText
		? `<span class='bar-tooltip' style="width: auto; height: auto;"><span class='bar-tooltip-pct'>${pctText}</span></span>`
		: "";

	return `<span class='bar' title='${rawText}' data-value='${pctText}' data-raw='${rawText}'>`
		+ `<span class='${fillClass}' style='width: ${width}px'></span>`
		+ tooltip
		+ `</span>`;
}

function _predict_table_row(label, w, max_i, probability, predictions_idx) {
	var str = "";
	if (show_bars_instead_of_numbers()) {
		var isHighest = predictions_idx == max_i && get_show_green();
		var bar = _create_bar_html(w, isHighest, probability);
		str = `<tr>${_label_input_td(label, predictions_idx % labels.length)}<td>${bar}</td></tr>`;
	} else {
		str = `<tr>${_label_input_td(label, predictions_idx % labels.length)}<td>${probability}</td></tr>`;
		if (predictions_idx == max_i && get_show_green()) {
			str = `<tr>${_label_input_td(label, predictions_idx % labels.length)}<td><b class='best_result label_input_element'>${probability}</b></td></tr>`;
		}
	}

	return str;
}
