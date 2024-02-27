"use strict";

async function __predict (data, __model, recursion = 0) {
	if(!data) {
		err("[__predict] data undefined");
		return;
	}

	if(recursion > 2) {
		err("[__predict] too many retries for predict.");
		return;
	}

	if(!__model) {
		__model = model;
	}

	if(!__model) {
		err("[__predict] Cannot predict without a model");
		return;
	}

	var res;
	try {
		res = __model.predict(data);
	} catch (e) {
		if(Object.keys(e).includes("message")) {
			e = "" + e.message;
		}

		if(("" + e).includes("but got array with shape")) {
			var dis = data.shape.join(", ");
			if(!__model || Object.keys(__model).includes("input")) {
				var mis = __model.input.shape.join(", ");

				dbg(`Wrong input shape for prediction. Data: [${dis}], model: [${mis}]`);
			} else {
				dbg(`Wrong input shape for prediction. Data: [${dis}], model: [not determinable]`);
			}

			await dispose(data);
			return;
		} else if(("" + e).includes("is already disposed") && ("" + e).includes("LayersVariable")) {
			dbg(`Model was already disposed`);
			await dispose(data);
			return;
		} else {
			await compile_model();
			if(warn_if_tensor_is_disposed(data)) {
				res = await __predict(data, model, recursion + 1);
			} else {
				err("Cannot predict since the data about to be predicted is already disposed.");
				await dispose(data);
				return;
			}
		}
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

	return res;
}

async function switch_to_next_camera_predict () {
	webcam_id++;
	webcam_id = webcam_id % (webcam_modes.length);
	await show_webcam(1);
}

async function get_label_data () {
	if(($("#data_origin").val() == "image" || await input_shape_is_image()) && $("#data_origin").val() == "default") {
		let imageData = await get_image_data(1, 0, {
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
			`<span class='single_pred'>\n` +
				`<img width='${width}' height='${height}' src="data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs=" alt="Image" class="uploaded_file_img"\n>` +
				`<br>` +
				`<span class="uploaded_file_prediction"></span>` +
			`</span>\n`;

		var repeated_string = "";
		for (var i = 0; i < files.length; i++) {
			repeated_string += uploaded_file_pred;
		}

		$output.html(repeated_string);

		for (var i = 0; i < files.length; i++) {
			$($(".single_pred")[i]).removeAttr("src");

			var img_elem = $($(".uploaded_file_img")[i])[0];

			var async_func;

			eval(`async_func = async function() {
				var _img_elem = $($(".uploaded_file_img")[${i}])[0];
				URL.revokeObjectURL(_img_elem.src);

				var _result = await predict(_img_elem);

				var $set_this = $($(".uploaded_file_prediction")[${i}]);

				assert($set_this.length, \`.uploaded_file_prediction[${i}] not found!\`);

				//console.log("_img_elem:", _img_elem, "i:", ${i}, "$set_this:", $set_this, "_result:", _result, "_result md5:", await md5(_result));

				$set_this.html(_result).show();

				$(".only_show_when_predicting_image_file").show();
			}`);

			img_elem.src = URL.createObjectURL(files[i]);
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
	console.trace();
	$("#prediction").hide();
	$("#predict_error").html("" + e).show();
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
		log("item:", item, "width:", width, "height:", height, "error:", e);

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

async function predict_demo (item, nr, tried_again = 0) {
	if(has_zero_output_shape) {
		dbg("[predict_demo] has_zero_output_shape is true");
		return;
	}

	while ((is_hidden_or_has_hidden_parent($("#predict_tab")) && finished_loading) && !is_cosmo_mode) {
		await delay(200);
	}

	//var xpath = get_element_xpath(item);
	//tf.engine().startScope("scope_" + xpath);

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
	//log("Tensors 4: " + tf.memory()["numTensors"]);

	if(item.width == 0) {
		//log("item width is 0, not predicting:", item);
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
		wrn("[predict_demo] Does not include first layer");
		return;
	}

	while (!tf.backend()) {
		await delay(100);
	}

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
		if(Object.keys(e).includes("message")) {
			e = e.message;
		}

		l("Error (101): " + e);
		log("================================= tensor_img:", tensor_img);
		_predict_error("" + e);
		if(tried_again) {
			return;
		}

		await dispose(tensor_img);
		await dispose(new_tensor_img);

		return await predict_demo(item, nr, 1);
	}

	hide_unused_layer_visualization_headers();

	change_output_and_example_image_size();

	allow_editable_labels();

	await dispose(tensor_img);
	await dispose(new_tensor_img);

	//tf.engine().endScope("scope_" + xpath);

	await nextFrame();
};

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

	try {
		predictions_tensor = await __predict(tensor_img);
		if(!predictions_tensor) {
			dbg(`Predictions tensor was empty!`);
			return;
		}

		warn_if_tensor_is_disposed(predictions_tensor);
		await _predict_result(predictions_tensor, nr, 0);

		warn_if_tensor_is_disposed(predictions_tensor);
		await draw_heatmap(predictions_tensor, tensor_img);

		await dispose(predictions_tensor);
	} catch (e) {
		if(("" + e).includes("already disposed")) {
			dbg("[_run_predict_and_show] Tensors already disposed. Probably the model was recompiled while predicting.");
		} else if(("" + e).includes("but got array with shape")) {
			dbg("[_run_predict_and_show] Prediction got wrong tensor shape. This may be harmless when you just switched models, otherwise, it indicates a bug.");
		} else if(("" + e).includes("code is undefined")) {
			err(e + ". This may mean that the whole document was deleted!!!");
		} else if(("" + e).includes("predictions is null")) {
			err("" + e);
		} else if(("" + e).includes("Either strides or dilations must be 1")) {
			for (var i = 0; i < $("#layers_container").length; i++) {
				set_layer_background(i, "red");
				set_model_layer_warning(i, "" + e);
			}
		} else {
			err("" + e);
			console.trace();
		}
	}

	for (var i = 0; i < $("#layers_container").length; i++) {
		set_layer_background(i, "");
		set_model_layer_warning(i, "");
	}

	await dispose(predictions_tensor);

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

		for (var i = 0; i < predictions.length; i++) {
			var canvas = $("<canvas/>", {class: "layer_image"}).prop({
				width: pxsz * predictions_tensor.shape[2],
				height: pxsz * predictions_tensor.shape[1],
			});

			desc.append(canvas);

			//draw_grid (canvas, pixel_size, colors, denormalize, black_and_white, onclick, multiply_by, data_hash, _class="") {
			//log("predictions[i]:", predictions[i]);
			var res = draw_grid(canvas, pxsz, predictions[i], 1, 1);
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
		for (let i = 0; i < arr.length; i++) {
			if (Array.isArray(arr[i])) {
				scaleNested(arr[i]);
			} else {
				arr[i] = scaleValue(arr[i]);
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

			for (let i = 0; i < predictions.length; i++) {
				var probability = predictions[i];
				if(probability > max_probability) {
					max_probability = probability;
					max_i = i;
				}
			}

			var fullstr = "";

			fullstr += "<table class='predict_table'>";

			for (let i = 0; i < predictions.length; i++) {
				var label = labels[i % labels.length];
				var probability = predictions[i];
				var w = Math.floor(probability * 50);

				fullstr += _predict_table_row(label, w, max_i, probability, i);
			}

			fullstr += "</table>";
			if(desc) {
				desc.html(fullstr);
			}
		}

		$("#predict_error").hide();
		$("#predict_error").html("");

		return fullstr;
	} catch (e) {
		if(Object.keys(e).includes("message")) {
			e = e.message;
		}

		wrn("" + e);
	}
}

function _predict_table_row (label, w, max_i, probability, i) {
	var str = "";
	if(show_bars_instead_of_numbers()) {
		str = "<tr><td class='label_element'>" + label + "</td><td><span class='bar'><span style='width: " + w + "px'></span></span></td></tr>";
		if(i == max_i && get_show_green()) {
			//str = "<b class='best_result'>" + str + "</b>";
			str = "<tr><td class='label_element'>" + label + "</td><td><span class='bar'><span class='highest_bar' style='width: " + w + "px'></span></span></td></tr>";
		}
	} else {
		str = "<tr><td class='label_element'>" + label + "</td><td>" + probability + "</td></tr>";
		if(i == max_i && get_show_green()) {
			str = "<tr><td class='label_element'>" + label + "</td><td><b class='best_result label_input_element'>" + probability+ "</b></td></tr>";
		}
	}

	return str;
}

function _prepare_data(item, original_item) {
		try {
		var data = "";

		var regex_space_start = /^\s+/ig;
		var regex_space_end = /\s+$/ig;
		var regex_comma = /,?\s+/ig;

		item = item.replaceAll(regex_space_start, "");
		item = item.replaceAll(regex_space_end, "");
		item = item.replaceAll(regex_comma, ", ");

		item = item.replaceAll(/\btrue\b/ig, "1");
		item = item.replaceAll(/\bfalse\b/ig, "0");

		if(!item.startsWith("[")) {
			item = "[" + item + "]";
		}

		data = eval(item);

		if(!original_item.startsWith("[[")) {
			var data_input_shape = get_shape_from_array(data);

			var input_shape = model.layers[0].input.shape;
			if(input_shape[0] === null) {
				var original_input_shape = input_shape;
				input_shape = remove_empty(input_shape);
				if(input_shape.length != data_input_shape.length) {
					data = [data];
				}
			}
		}

		return data;
	} catch (e) {
		if(Object.keys(e).includes("message")) {
			e = e.message;
		}

		assert(false, e);
	}
}

function number_of_elements_in_tensor_shape (shape) {
	try {
		var required_elements = 1;
		for (var i = 0; i < shape.length; i++) {
			if(shape[i] !== null) {
				required_elements *= shape[i]
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

async function predict (item, force_category, dont_write_to_predict_tab, pred_tab = "prediction") {
	$("#" + pred_tab).html("").show();
	$("#predict_error").html("").hide();
	var predictions = [];

	var str = "";

	var ok = 1;

	var estr = "";

	var predict_data = null;

	try {
		var is_image_prediction = await input_shape_is_image();
		var has_html = false;

		if(is_image_prediction) {
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

				//console.log(predict_data);
			} catch (e) {
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
		} else {
			var data = "";
			if(item.startsWith("# shape:")) {
				data = [array_sync(numpy_str_to_tf_tensor(item, 0))];
			} else {
				var original_item = item;

				if(item.match(/^\s*$/)) {
					dbg("[predict] Not trying to predict empty custom item");
					return;
				}

				data = _prepare_data(item, original_item);
			}

			predict_data = tensor(data);
		}

		if(predict_data["isDisposedInternal"]) {
			err("[predict] predict_data is already disposed!");
			return;
		}

		if(!predict_data) {
			await dispose(predict_data);

			var str = "Empty predict data, not predicting";

			l(str);

			return str;
		} else if(predict_data.shape.includes("0") || predict_data.shape.includes(0)) {
			await dispose(predict_data);

			var str = "Dredict data tensor shape contains 0, not predicting";

			l(str);

			return str;
		}

		var divide_by = parse_float($("#divide_by").val());

		if(divide_by != 1) {
			predict_data = tidy(() => {
				var res = divNoNan(predict_data, divide_by);
				return res;
			});
		}

		if(predict_data["isDisposedInternal"]) {
			err("[predict] predict_data is already disposed!");
			return;
		}

		if(!model.input) {
			err("Model has no input");
			return;
		}

		var mi = model.input.shape;
		if(!mi) {
			err("Cannot get model.input.shape");
			return;
		}
		mi[0] = 1;

		var predictions_tensor = null;
		$("#predict_error").html("").hide();
		try {
			if(predict_data["isDisposedInternal"]) {
				err("[predict] predict_data is already disposed!");
				return;
			}

			var prod_pred_shape = number_of_elements_in_tensor_shape(predict_data.shape);
			var prod_mod_shape = number_of_elements_in_tensor_shape(mi);

			//log(`prod_pred_shape: ${prod_pred_shape}, prod_mod_shape: ${prod_mod_shape}`);

			if(prod_pred_shape == prod_mod_shape) {
				var model_shape_one = mi;
				if(model_shape_one[0] === null) { model_shape_one[0] = 1; }

				if(predict_data.shape.join(",") != model_shape_one) {
					predict_data = tidy(() => {
						var old_tensor = predict_data;
						//console.log("A: changing old_tensor shape [" + old_tensor.shape.join(", ") + "] to [" + model_shape_one.join(", ") + "]");
						var new_data = tf_reshape(old_tensor, model_shape_one);

						//console.debug("Predict data input shape: [" + predict_data.shape.join(",") + "]");

						return new_data;
					});
				}

				if(predict_data["isDisposedInternal"]) {
					err("[predict] predict_data is already disposed!");
					return;
				}
			} else if(Math.max(prod_pred_shape, prod_mod_shape) % Math.min(prod_mod_shape, prod_pred_shape) == 0) {
				var _max = Math.max(prod_pred_shape, prod_mod_shape);
				var _min = Math.min(prod_pred_shape, prod_mod_shape);

				var _modulo = _max % _min;

				var elements = (_max - _modulo) / _min;

				var model_shape_one = mi;
				model_shape_one[0] = elements;

				//console.log(model_shape_one);

				if(predict_data.shape.join(",") != model_shape_one) {
					predict_data = tidy(() => {
						var old_tensor = predict_data;
						//console.log("B: changing old_tensor shape [" + old_tensor.shape.join(", ") + "] to [" + model_shape_one.join(", ") + "]");
						var new_data = tf_reshape(old_tensor, model_shape_one);

						//console.debug("Predict data input shape: [" + predict_data.shape.join(",") + "]");

						return new_data;
					});
				}

				if(predict_data["isDisposedInternal"]) {
					err("[predict] predict_data is already disposed!");
					return;
				}
			} else {
				await dispose(predict_data);

				var pd_nr = number_of_elements_in_tensor_shape(predict_data.shape);
				var is_nr = number_of_elements_in_tensor_shape(mi);

				throw(`Could not reshape data for model (predict_data.shape/model.input.shape: [${pd_nr}], [${is_nr}]`);
				return;
			}

			if(predict_data["isDisposedInternal"]) {
				err("[predict] predict_data is already disposed!");
				return;
			}

			try {
				predictions_tensor = await __predict(predict_data);
			} catch (e) {
				if(Object.keys(e).includes("message")) {
					e = e.message;
				}

				err("" + e);
			}

			await dispose(predict_data);
		} catch (e) {
			dbg(`[PREDICT] Model input shape [${mi.join(", ")}], tensor shape [${predict_data.shape.join(", ")}], tensor_shape_matches_model() = ${tensor_shape_matches_model(predict_data)}`);

			if(("" + e).includes("got array with shape")) {
				err("" + e);
				$("#predict_error").html(("" + e).replace(/^(?:Error:\s*)*/, "Error:")).show();
			} else if(("" + e).includes("Could not reshape")) {
				throw new Error("" + e);
			} else {
				var err_msg = `Error 1201: ${e}, predict data shape: [${predict_data.shape.join(", ")}], model input shape: [${model.input.shape.filter(n => n).join(",")}]`;

				$("#predict_error").html(err_msg).show();
				err(err_msg);
			}

			ok = 0;
			return;
		}

		warn_if_tensor_is_disposed(predictions_tensor);
		await draw_heatmap(predictions_tensor, predict_data);

		predictions = predictions_tensor.dataSync();

		//log(predictions);

		if(!is_image_prediction && labels.length == 0) {
			str = "[" + predictions.join(", ") + "]";
			pred_tab = "prediction_non_image";
			$("#" + pred_tab).html("");
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

		if(is_image_prediction || labels.length) {
			$("#" + pred_tab).append(str).show();
		} else {
			var latex = arbitrary_array_to_latex(array_sync(predictions_tensor));
			$("#" + pred_tab).append(latex).show();
			temml.render($("#prediction_non_image").text(), $("#prediction_non_image")[0]);
		}

		$("#predict_error").html("").hide();

		await dispose(predict_data);
		await dispose(predictions_tensor);
	} catch (e) {
		if(Object.keys(e).includes("message")) {
			e = e.message;
		}

		await dispose(predict_data);
		estr = "" + e;
		if(!estr.includes("yped")) {
			if(!estr.includes("Expected input shape")) {
				_predict_error("" + e);
			} else {
				$("#prediction_non_image").html(estr);
			}
		} else {
			err(e);
		}
		ok = 0;
	}

	allow_editable_labels();

	if(ok) {
		l("Prediction done");
	} else {
		if(estr) {
			l(estr);
			$("#prediction_non_image").html("<span style='color: red'>" + estr + "</span>");
		} else {
			l("ERROR: Prediction failed");
		}
	}

	await dispose(predict_data);

	return str;
}

async function show_prediction (keep_show_after_training_hidden, dont_go_to_tab) {
	if(skip_predictions) {
		return;
	}

	if(!model) {
		err("[show_prediction] No model given for show_prediction");
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
		if($("#jump_to_interesting_tab").is(":checked") && !is_cosmo_mode) {
			$("a[href=\"#predict_tab\"]").click();
		}
	}

	//log("Tensors O: " + tf.memory()["numTensors"]);
}

function show_or_hide_predictions (count) {
	if(is_cosmo_mode) {
		return;
	}

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

		for (let i = 1; i < inputArray.length; i++) {
			if (inputArray[i] === currentElement) {
				count++;
			} else {
				if (count > 1) {
					transformedArray.push(`${currentElement}^${count}`);
				} else {
					transformedArray.push(currentElement);
				}
				currentElement = inputArray[i];
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

async function _print_predictions_text(count, example_predict_data) {
	if(!finished_loading) {
		return;
	}

	if(!model) {
		dbg("[_print_predictions_text] model not found");
		return;
	}

	if(!example_predict_data || !example_predict_data.length) {
		dbg(`[_print_predictions_text] example_predict_data was empty`);
	}

	var csh = await get_current_status_hash(1);
	if(last_status_hash_text_prediction == csh) {
		return;
	}

	last_status_hash_text_prediction = csh;

	var count = 0;
	var example_predictions = $("#example_predictions");
	var example_url = "traindata/" + $("#model_dataset").val() + "/examples.json";
	var example_predict_data = null;

	try {
		example_predict_data = await get_cached_json(example_url);
	} catch (e) {
		if(Object.keys(e).includes("message")) {
			e = e.message;
		}

		err("" + e);
		return;
	}

	var html_contents = "";

	if(!(typeof(example_predict_data) == "object" && example_predict_data.length)) {
		dbg("[_print_predictions_text] example_predict_data is not an object or empty");
	}

	if(!example_predict_data || example_predict_data.length == 0) {
		dbg("[_print_predictions_text] No example predict data found");
		return;
	}

	for (var i = 0; i < example_predict_data.length; i++) {
		var _tensor = tensor(example_predict_data[i]);
		warn_if_tensor_is_disposed(_tensor);
		var res;

		while (!model) {
			log("Waiting for model...");
			await delay(200);
		}

		while (!typeof(model) == "object" || !Object.keys(model).includes("layers")) {
			log("Waiting for model...");
			await delay(200);
		}


		if(_tensor && is_tf_tensor(_tensor)) {
			if(tensor_shape_matches_model(_tensor)) {
				warn_if_tensor_is_disposed(_tensor);
				try {
					var network_name, latex_input, latex_output;

					try {
						warn_if_tensor_is_disposed(_tensor);
					} catch (e) {
						if(Object.keys(e).includes("message")) {
							e = e.message;
						}

						err("A:" + e);
						throw new Error("A:" + e)
					}

					try {
						res = await __predict(_tensor);
					} catch (e) {
						if(Object.keys(e).includes("message")) {
							e = e.message;
						}

						err("B:" + e);
						throw new Error("B:" + e)
					}

					try {
						network_name =  create_network_name();
						latex_input = await _arbitrary_array_to_latex(example_predict_data[i]);
						if(res) {
							var res_array = tidy(() => { return array_sync(res); });
							latex_output = await _arbitrary_array_to_latex(res_array);
						}
					} catch (e) {
						if(Object.keys(e).includes("message")) {
							e = e.message;
						}

						err("C:" + e);
						throw new Error("C:" + e)
					}

					try {
						html_contents += `<span class='temml_me'>\\mathrm{${network_name}}\\left(${latex_input}\\right) = ${latex_output}</span><br>`;
					} catch (e) {
						if(Object.keys(e).includes("message")) {
							e = e.message;
						}

						err("E:" + e);
						throw new Error("E:" + e)
					}

					count++;
					$("#predict_error").html("");
				} catch (e) {
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
						wrn(`Model or layer was already disposed, not predicting.`);
					} else {
						_predict_error(e);
						await dispose(_tensor);
						await dispose(res);

						return;
					}
				}

			} else {
				log("tensor shape does not match model shape. Not predicting example text. Input shape/tensor shape:" + JSON.stringify(get_input_shape()) + ", " + JSON.stringify(_tensor.shape));
			}
		} else {
			wrn(`The tensor about to be predicted was empty.`);
		}

		await dispose(_tensor);
		await dispose(res);
	}

	if(html_contents) {
		example_predictions.html(html_contents);
	}

	show_or_hide_predictions(count);

	try {
		await _temml();
	} catch (e) {
	}

	return count;
}

async function _print_example_predictions (count) {
	if(!await input_shape_is_image()) {
		return false;
	}

	var count = 0;
	var example_predictions = $("#example_predictions");
	var dataset = $("#dataset").val();
	var full_dir = "traindata/" + dataset + "/example/";
	var dataset_url = "traindata/index.php?&dataset=" + dataset + "&examples=1";
	if(is_cosmo_mode) {
		dataset_url = dataset_url + "&cosmo=1";
	}

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
	for (var i = 0; i < examples.length; i++) {
		count++;
		var img_url = full_dir + "/" + examples[i];
		var img_elem = $("img[src$='" + img_url + "']");

		if(img_elem.length) {
			try {
				var img = img_elem;
				if(Object.keys(img).includes("0")) {
					img = img_elem[0];
				}

				await predict_demo(img, i);
			} catch (e) {
				log("Predict demo failed, error:", e);
			}
		} else {
			str += "<div class='full_example_image_prediction inline_block'><img src='" +
				img_url +
				"' class='example_images' onload='predict_demo(this, " +
				i +
				")' onclick='predict_demo(this, " +
				i +
				")' /><br><div class='predict_demo_result'></div></div>";
		}
	}

	return [str, count];
}

function get_index_of_highest_category (predictions_tensor) {
	try {
		var js = predictions_tensor.dataSync();

		var highest_index = 0;
		var highest = 0;

		for (var i = 0; i < js.length; i++) {
			if(js[i] > highest) {
				highest = js[i];
				highest_index = i;
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

async function draw_heatmap (predictions_tensor, predict_data, is_from_webcam=0) {
	if(!(
		await input_shape_is_image(is_from_webcam) &&
		$("#show_grad_cam").is(":checked") &&
		!started_training &&
		(await output_size_at_layer(get_number_of_layers())).length == 2)
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
			var res = draw_grid(canvas, pxsz, img, 1, 0);
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

async function predict_webcam () {
	try {
		if(currently_predicting_webcam) {
			return;
		}

		currently_predicting_webcam = true;

		if(!cam) {
			currently_predicting_webcam = false;
			return;
		}

		if(is_hidden_or_has_hidden_parent($("#webcam"))) {
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
		} catch (e) {
			if(("" + e).includes("already disposed")) {
				dbg("[predict_webcam] Model Tensor already disposed");
			} else if(("" + e).includes("n is undefined")) {
				dbg("[predict_webcam] Model weights probably already disposed, this is usually not harmful");
			} else if(("" + e).includes("but got array with shape")) {
				dbg("[predict_webcam] Wrong shape for predict_webcam. This may happen if you resize width and/or height while you predict the webcam. In this case, it's harmless. Restarting webcam...");
				await show_webcam(1);
			} else {
				l("[predict_webcam] Error (512): " + e);

				err(e);
			}

			currently_predicting_webcam = false;

			await dispose(predictions_tensor);
			await dispose(predict_data);

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

		assert(false, e);
	}
}

function draw_multi_channel (predictions_tensor, webcam_prediction, pxsz) {
	try {
		var transposed = array_sync(tf_transpose(predictions_tensor, [3, 1, 2, 0]));

		for (var i = 0; i < predictions_tensor.shape[3]; i++) {
			var canvas = $("<canvas/>", {class: "layer_image"}).prop({
				height: pxsz * predictions_tensor.shape[1],
				width: pxsz * predictions_tensor.shape[2]
			});

			webcam_prediction.append(canvas);

			var d = transposed[i];

			draw_grid(canvas, pxsz, d, 1, 1);
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

		draw_grid(canvas, pxsz, predictions[0], 1, 0);
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

		for (let i = 0; i < predictions.length; i++) {
			var probability = predictions[i];
			if(probability > max_probability) {
				max_probability = probability;
				max_i = i;
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

		for (let i = 0; i < predictions.length; i++) {
			str += _webcam_prediction_row(i, predictions, max_i);
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

function _webcam_prediction_row (i, predictions, max_i) {
	assert(typeof(i) == "number", "i is not a number");
	assert(typeof(max_i) == "number", "max_i is not a number");
	assert(typeof(predictions) == "object", "predictions is not an object");

	try {
		var str = "";
		var label = labels[i % labels.length];
		var probability = predictions[i];

		assert(typeof(probability) == "number", "probability is not a number");

		var w = Math.floor(probability * 50);

		if(show_bars_instead_of_numbers()) {
			if(i == max_i) {
				str += "<tr><td class='label_element'>" + label + "</td><td><span class='bar'><span class='highest_bar' style='width: " + w + "px'></span></span></td></tr>";
			} else {
				str += "<tr><td class='label_element'>" + label + "</td><td><span class='bar'><span style='width: " + w + "px'></span></span></td></tr>";
			}
		} else {
			probability = (probability * 50) + "%";
			if(i == max_i) {
				str += "<tr><td class='label_element'>" + label + "</td><td><b class='max_prediction'>" + probability + "</b></td></tr>";
			} else {
				str += "<tr><td class='label_element'>" + label + "</td><td>" + probability + "</td></tr>";
			}
		}

		return str;
	} catch (e) {
		if(Object.keys(e).includes("message")) {
			e = e.message;
		}

		assert(false, e);
	}
}

async function show_webcam (force_restart) {
	if(is_cosmo_mode) {
		return;
	}
	await init_webcams();

	try {
		var stopped = 0;

		if(await input_shape_is_image()) {
			$("#show_webcam_button").html("<span class='large_button'>&#128711;&#128247;</span>");
			if(cam) {
				if(!is_cosmo_mode) {
					stop_webcam();
					stopped = 1;
					$(".only_when_webcam_on").hide();
				}
			} else {
				var webcam = $("#webcam");
				webcam.hide().html("");
				var videoElement = document.createElement("video");

				var w = 350;
				var h = 300;
				videoElement.id = "created_video_element";
				videoElement.width = w;
				videoElement.height = h;
				videoElement.playsInline = true;
				videoElement.playsinline = true;
				videoElement.muted = true;
				videoElement.controls = true;
				videoElement.autoplay = true;
				webcam.show().append(videoElement);

				var cam_config = {};

				if(await hasBothFrontAndBack()) {
					l("Using camera " + webcam_modes[webcam_id]);
					cam_config["facingMode"] = webcam_modes[webcam_id];
				} else {
					l("Has only one camera, no front and back camera");
				}

				if(available_webcams.length > 1) {
					cam_config["deviceId"] = available_webcams_ids[parse_int($("#which_webcam").val())];
				}

				//log(cam_config);
				cam = await tf_data_webcam(videoElement, cam_config);

				auto_predict_webcam_interval = setInterval(predict_webcam, 100);
				$(".only_when_webcam_on").show();
			}
		} else {
			$("#webcam").hide().html("");
			if(cam) {
				cam.stop();
			}

			clearInterval(auto_predict_webcam_interval);
		}

		if(force_restart && stopped) {
			await show_webcam();
		}
	} catch (e) {
		err(e);
	}

	return cam;
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

		for (var i = 1; i < input_layer_shape.length; i++) {
			if(!tensor_shape[i] == input_layer_shape[i]) {
				return false;
			}
		}

		return true;
	} catch (e) {
		return false;
	}
}

function draw_bars_or_numbers (i, predictions, max) {
	try {
		var label = labels[i % labels.length];
		var val = predictions[0][i];
		var w = Math.floor(val * 50);

		var html = "";

		if(show_bars_instead_of_numbers()) {
			if(label) {
				if(val == max) {
					html = "<tr><td class='label_element'>" + label + "</td><td><span class='bar'><span class='highest_bar' style='margin-top: 2px; width: " + w + "px'></span></span></td></tr>";
				} else {
					html = "<tr><td class='label_element'>" + label + "</td><td><span class='bar'><span style='margin-top: 2px; width: " + w + "px'></span></span></td></tr>";
				}
			} else {
				if(val == max) {
					html = "<tr><td><span class='bar'><span class='highest_bar' style='width: " + w + "px'></span></span></td></tr>";
				} else {
					html = "<tr><td><span class='bar'><span style='width: " + w + "px'></span></span></td></tr>";
				}
			}
		} else {
			if(label) {
				if(val == max) {
					html = "<tr><td><b class='best_result label_element'>" + label + "</td><td>" + val + "</b></td></tr>\n";
				} else {
					html = "<tr><td class='label_element'>" + label + "</td><td>" + predictions[0][i] + "</td></tr>\n";
				}
			} else {
				if(val == max) {
					html = "<tr><td><b class='best_result label_element'>" + predictions[0][i] + "</b></td></tr>\n";
				} else {
					html = "<tr><td>" + predictions[0][i] + "</td></tr>";
				}
			}
		}

		return html;
	} catch (e) {
		if(Object.keys(e).includes("message")) {
			e = e.message;
		}

		assert(false, e);
	}
}

async function predict_handdrawn () {
	try {
		if(has_zero_output_shape) {
			return;
		}

		if(!await input_shape_is_image()) {
			return;
		}

		if(is_setting_config) {
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

		var predict_data;
		try {
			predict_data = tidy(() => {
				return expand_dims(resize_image(
					fromPixels(atrament_data.sketcher.canvas),
					[height, width]
				));
			});
		} catch (e) {
			await write_error("" + e);
			await dispose(predict_data);
			return;
		}

		if(!predict_data) {
			await dispose(predict_data);
			err("[predict_handdrawn] No predict data");
			return;
		}

		if(waiting_updated_page_uuids.length < 1) {
			var new_predict_handdrawn_hash = await get_current_status_hash();

			if(last_predict_handdrawn_hash == new_predict_handdrawn_hash) {
				var as = array_sync(predict_data);
				var stringified = JSON.stringify(as);
				var new_handdrawn_image_hash = await md5(stringified);

				if(last_handdrawn_image_hash == new_handdrawn_image_hash) {
					info("[predict_handdrawn] Handdrawn image hash or status hash has not changed. Not repredict handdrawn");

					await dispose(predict_data);

					return;
				}
			}
		}
		
		last_predict_handdrawn_hash = new_predict_handdrawn_hash;
		last_handdrawn_image_hash = new_handdrawn_image_hash;

		var divide_by = parse_float($("#divide_by").val());

		var divided_data = null;

		if(divide_by != 1) {
			warn_if_tensor_is_disposed(predict_data);
			divided_data = tidy(() => {
				return divNoNan(predict_data, divide_by);
			});

			warn_if_tensor_is_disposed(predict_data);
			await dispose(predict_data);

			predict_data = divided_data;
			warn_if_tensor_is_disposed(predict_data);
		}

		var predictions_tensor = null;
		try {
			warn_if_tensor_is_disposed(predict_data);
			predictions_tensor = await __predict(predict_data);
		} catch (e) {
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
				l("Predict data shape:", predict_data.shape);
				err(e);
				l("Error (443): " + e);
			}

			await dispose(predictions_tensor);
			await dispose(predict_data);
			await dispose(divided_data);

			return;
		}

		if(!warn_if_tensor_is_disposed(predictions_tensor)) {
			return;
		}

		await draw_heatmap(predictions_tensor, predict_data);

		await _predict_handdrawn(predictions_tensor);

		try {
			await _temml();
		} catch (e) {
			wrn(e);
		}

		await dispose(predictions_tensor);
		await dispose(predict_data);
		await dispose(divided_data);

		allow_editable_labels();
	} catch (e) {
		console.error("ERROR I AM LOOKING FOR!");
		console.error(e);
	}
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
			var latex_output = arbitrary_array_to_latex(array_sync(predictions_tensor));
			ret = latex_output;
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
		for (var i = 0; i < predictions.length; i++) {
			var canvas = $("<canvas/>", {class: "layer_image"}).prop({
				width: pxsz * predictions_tensor.shape[2],
				height: pxsz * predictions_tensor.shape[1],
			});

			$("#handdrawn_predictions").append(canvas);

			var res = draw_grid(canvas, pxsz, predictions[i], 1, 1);
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
			err("predictions_tensor not defined");
			return "";
		}

		var predictions = predictions_tensor;
		if(is_tf_tensor(predictions)) {
			predictions = array_sync(predictions_tensor);
		}

		var max = 0;

		for (var i = 0; i < predictions[0].length; i++) {
			if(max < predictions[0][i]) {
				max = predictions[0][i];
			}
		}

		var html = "<table class='predict_table'>";

		for (var i = 0; i < predictions[0].length; i++) {
			html += draw_bars_or_numbers(i, predictions, max);
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
	if(!tensor) {
		err(`Given object is not a tensor`);
		return false;
	}

	if(!Object.keys(tensor).includes("isDisposedInternal")) {
		err(`Given object is not a tensor`);
		return false;
	}

	if(tensor.isDisposedInternal) {
		err(`Tensor is already disposed, where it shouldn't be.`);
		return false;
	}

	return true;
}
