"use strict";

async function switch_to_next_camera_predict () { var start_tensors = memory_leak_debugger();
	webcam_id++;
	webcam_id = webcam_id % (webcam_modes.length);
	await show_webcam(1);
	memory_leak_debugger("switch_to_next_camera_predict", start_tensors);
}

async function get_label_data () { var start_tensors = memory_leak_debugger();
	if(($("#data_origin").val() == "image" || await input_shape_is_image()) && $("#data_origin").val() == "default") {
		let imageData = await get_image_data(1, 0, {
			title: language[lang]["loading_images_into_memory"],
			html: language[lang]["this_may_take_a_while"]
		}, 0, 1);

		reset_labels();

		var category_counter = 0;
		var keys = [];

		for (let [key, value] of Object.entries(imageData)) {
			keys.push(key);
			for (var i = 0; i < imageData[key].length; i++) {
				var item = imageData[key][i];
			}
			labels[category_counter] = key;
			category_counter++;
		}
	}

	memory_leak_debugger("get_label_data", start_tensors);
}

var loadFile = (function(event) {
	var output = document.getElementById("output");
	$("#output").removeAttr("src");

	output.src = URL.createObjectURL(event.target.files[0]);
	output.onload = async function() {
		URL.revokeObjectURL(output.src);
		$("#output")[0].height = $("#output")[0].naturalHeight;
		$("#output")[0].width = $("#output")[0].naturalWidth;

		await predict(output);
		
		$(".only_show_when_predicting_image_file").show();
	};

	$("#output").show();
});

function _predict_error (e) { var start_tensors = memory_leak_debugger();
	console.warn(e);
	console.trace();
	l(e);
	$("#prediction").hide();
	$("#predict_error").html(e).show();
	$("#example_predictions").html("");
	$(".show_when_has_examples").hide();
	memory_leak_debugger("_predict_error", start_tensors)
}

function _divide_img_tensor (tensor_img) { var start_tensors = memory_leak_debugger();
	var divide_by = parseFloat($("#divide_by").val());
	if(divide_by == 1) {
		return tensor_img;
	}

	try {
		tensor_img = tf.tidy(() => {
			return tf.divNoNan(tensor_img, divide_by)
		});
	} catch (e) {
		_predict_error(e);
	}

	memory_leak_debugger("_divide_img_tensor", start_tensors + 1); // ein neuer tensor sollte alloziert sein

	return tensor_img;
}

async function _get_tensor_img(item) { var start_tensors = memory_leak_debugger();
	var tensor_img = null;

	try {
		tensor_img = await tf.tidy(() => {
			return _divide_img_tensor(tf.browser.fromPixels(item)
				.resizeNearestNeighbor([height, width])
				.toFloat()
				.expandDims());
		});
	} catch (e) {
		log("item:", item, "width:", width, "height:", height, "error:", e);
		_predict_error(e);
		return null;
	}

	memory_leak_debugger("_get_tensor_img", start_tensors + 1); // ein neuer tensor sollte alloziert sein

	return tensor_img;
}

function set_item_natural_width (item) { var start_tensors = memory_leak_debugger();
	try {
		var $item = $(item);
		assert($item.length > 0, "$item is empty");
		var element_vanilla_js = $item[0];
		$item.prop("width", element_vanilla_js.naturalWidth);
		$item.prop("height", element_vanilla_js.naturalHeight);
	} catch (e) {
		_predict_error(e);
		return false;
	}
	memory_leak_debugger("set_item_natural_width", start_tensors)

	return true;
}

async function predict_demo (item, nr, tried_again = 0) { var start_tensors = memory_leak_debugger();
	if(has_zero_output_shape) {
		return;
	}

	while (is_hidden_or_has_hidden_parent($("#predict_tab")) && finished_loading) {
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
		_predict_error(e);

		return;
	}

	if(!set_item_natural_width(item)) {
		console.log("Setting item to natural height failed. Returning.");
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
		console.warn("tensor_img was empty");
		await dispose(tensor_img);
		return;
	}

	if(!tensor_shape_matches_model(tensor_img)) {
		await dispose(tensor_img);
		if(new_tensor_img) {
			await dispose(new_tensor_img);
		}
		return;
	}

	while (!tf.backend()) {
		await delay(100);
	}

	if(!model) {
		if(finished_loading) {
			console.error("No model");
		}
		await dispose(tensor_img);
		return;
	}

	if(!tensor_shape_matches_model(tensor_img)) {
		console.warn("Model input shape: ", model.input.shape, "Tensor-Img-shape:", tensor_img.shape);
		await dispose(tensor_img);
		return;
	}

	try {
		//var inside_try = memory_leak_debugger();

		await _run_predict_and_show(tensor_img, nr);

		await dispose(tensor_img);

		//memory_leak_debugger("inside_try", inside_try);
	} catch (e) {
		l("Error (101): " + e);
		log("================================= tensor_img:", tensor_img);
		_predict_error(e);
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

	await tf.nextFrame();

	memory_leak_debugger("predict_demo", start_tensors);
}

async function _run_predict_and_show (tensor_img, nr) { var start_tensors = memory_leak_debugger();
	if(tensor_img.isDisposedInternal) {
		console.warn("Tensor was disposed internally", tensor_img);
		console.trace();
		return;

	}

	if(!tensor_shape_matches_model(tensor_img)) {
		console.warn("Tensor shape does not match model shape");
		return;
	}

	var predictions_tensor;

	try {
		predictions_tensor = tf.tidy(() => { return model.predict(tensor_img) });

		await _predict_result(predictions_tensor, nr);
		await draw_heatmap(predictions_tensor, tensor_img);
	} catch (e) {
		if(("" + e).includes("already disposed")) {
			console.warn("Tensors already disposed. Probably the model was recompiled while predicting.");
		} else {
			console.log(e);
			console.trace();
		}
	}

	await dispose(predictions_tensor);

	memory_leak_debugger("_run_predict_and_show", start_tensors);
}

async function _predict_result(predictions_tensor, nr) { var start_tensors = memory_leak_debugger();
	var desc = $($(".predict_demo_result")[nr]);
	desc.html("");
	if(model.outputShape.length == 3) {
		await _predict_image(predictions_tensor, desc);
	} else if(model.outputShape.length == 2) {
		await _predict_table(predictions_tensor, desc);
	} else {
		console.warn("Other input shapes than the length of 3 or 4 are currently not implemented");
	}

	await dispose(predictions_tensor);

	memory_leak_debugger("_predict_result", start_tensors);
}

async function _predict_image (predictions_tensor, desc) { var start_tensors = memory_leak_debugger();
	var predictions_tensor_transposed = predictions_tensor.transpose([3, 1, 2, 0]);

	var pxsz = 1;

	var largest = Math.max(predictions_tensor_transposed[1], predictions_tensor_transposed[2]);

	var max_height_width = Math.min(150, Math.floor(window.innerWidth / 5));
	while ((pxsz * largest) < max_height_width) {
		pxsz += 1;
	}

	var predictions = predictions_tensor_transposed.arraySync();
	for (var i = 0; i < predictions.length; i++) {
		var canvas = $('<canvas/>', {class: "layer_image"}).prop({
			width: pxsz * predictions_tensor.shape[2],
			height: pxsz * predictions_tensor.shape[1],
		});

		desc.append(canvas);

		var res = draw_grid(canvas, pxsz, predictions[i], 1, 1);
	}

	await dispose(predictions_tensor_transposed);
	memory_leak_debugger("_predict_image", start_tensors);
}

function get_show_green () { var start_tensors = memory_leak_debugger();
	var last_layer_activation = get_last_layer_activation_function();
	var show_green = last_layer_activation == "softmax" ? 1 : 0;

	memory_leak_debugger("get_show_green", start_tensors);

	return show_green;
}

async function _predict_table(predictions_tensor, desc) { var start_tensors = memory_leak_debugger();
	var predictions = tf.tidy(() => { return predictions_tensor.dataSync() });

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
		desc.html(fullstr);
	}

	$("#predict_error").hide();
	$("#predict_error").html("");

	memory_leak_debugger("_predict_table", start_tensors);
}

function _predict_table_row (label, w, max_i, probability, i) { var start_tensors = memory_leak_debugger()
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

	memory_leak_debugger("_predict_table_row", start_tensors);
	return str;
}

async function predict (item, force_category, dont_write_to_predict_tab) { var start_tensors = memory_leak_debugger();
	await enable_everything();

	var pred_tab = "prediction";

	$("#" + pred_tab).html("").show();
	$("#predict_error").html("").hide();
	var predictions = [];

	var str = "";

	var ok = 1;

	try {
		var predict_data = null;

		if(await input_shape_is_image()) {
			try {
				predict_data = tf.browser.fromPixels(item).resizeNearestNeighbor([height, width]).toFloat().expandDims();
			} catch (e) {
				if(("" + e).includes("Expected input shape")) {
					console.warn("" + e);
				} else {
					log(e);
					console.trace();
				}
			}
		} else {
			var data = "";
			if(item.startsWith("# shape:")) {
				data = numpy_str_to_tf_tensor(item, 0).arraySync();
			} else {
				var original_item = item;

				var regex_space_start = /^\s+/ig;
				var regex_space_end = /\s+$/ig;
				var regex_comma = /,?\s+/ig;

				item = item.replaceAll(regex_space_start, '');
				item = item.replaceAll(regex_space_end, '');
				item = item.replaceAll(regex_comma, ', ');

				item = item.replaceAll(/\btrue\b/ig, '1');
				item = item.replaceAll(/\bfalse\b/ig, '0');

				if(!item.startsWith("[")) {
					item = "[" + item + "]";
				}

				data = eval(item)

				if(!original_item.startsWith("[[")) {
					var data_input_shape = await get_shape_from_array(data);

					var input_shape = model.layers[0].input.shape;
					if(input_shape[0] === null) {
						var original_input_shape = input_shape;
						input_shape = remove_empty(input_shape);
						if(input_shape.length != data_input_shape.length) {
							data = [data];
						}
					}
				}
			}
			predict_data = tf.tensor(data);
		}

		if(!predict_data) {
			await dispose(predict_data);
			return;
		} else {
			if(predict_data.shape.includes(0)) {
				await dispose(predict_data);

				l("Empty predict data. Not predicting.");

				return;
			}
		}

		if(!tensor_shape_matches_model(predict_data)) {
			var expected = eval(JSON.stringify(model.layers[0].input.shape));
			expected[0] = "null";
			l('Error: Expected input shape: [' + eval(JSON.stringify(expected)).join(', ') + '], but got [' + predict_data.shape.join(', ') + ']');
			throw new Error('Expected input shape: [' + eval(JSON.stringify(expected)).join(', ') + '], but got [' + predict_data.shape.join(', ') + ']');
			return;
		}

		var divide_by = parseFloat($("#divide_by").val());

		if(divide_by != 1) {
			predict_data = tf.tidy(() => { return tf.divNoNan(predict_data, divide_by); });
		}

		//log(predict_data.arraySync());
		var predictions_tensor = null;
		try {
			predictions_tensor = await model.predict([predict_data], [1, 1]);
		} catch (e) {
			l("Predict data shape:" + predict_data.shape);
			console.error(e);
			l("Error (1201): " + e);
			ok = 0;
			return;
		}

		await draw_heatmap(predictions_tensor, predict_data);

		predictions = predictions_tensor.dataSync();

		//log(predictions);

		if(!await input_shape_is_image() && labels.length == 0) {
			str = "[" + predictions.join(", ") + "]";
			pred_tab = "prediction_non_image";
			$("#" + pred_tab).html("");
		} else {
			var desc = $("#pred_tab");
			if(desc.length == 0) {
				desc = $(item).after("<span class='predict_autogenerated_images'></span>")
			}

			if(desc.length == 0) {
				console.warn("desc is none");
			} else {
				desc = desc[0];
				desc = $(desc);
				if(model.outputShape.length == 4) {
					var pxsz = 1;
					draw_multi_channel(predictions_tensor, desc, pxsz)
				} else {
					if(predictions.length) {
						await _predict_table(predictions_tensor, desc);
					} else {
						console.warn("No predict tensor found");
					}
				}
			}
		}

		await dispose(predictions_tensor);

		$("#" + pred_tab).append(str).show();

		$("#predict_error").html("").hide();

		await dispose(predict_data);
		await dispose(predictions_tensor);

		if(is_cosmo_mode) {
			await force_redo_image_captions();
		}
	} catch (e) {
		var estr = "" + e;
		if(!estr.includes("yped")) {
			_predict_error(e);
		} else {
			console.error(e);
		}
		ok = 0;
	}

	allow_editable_labels();

	memory_leak_debugger("predict", start_tensors);

	if(ok) {
		l("Prediction done");
	} else {
		l("ERROR: Prediction failed");
	}

	return str;
}

async function show_prediction (keep_show_after_training_hidden, dont_go_to_tab) { var start_tensors = memory_leak_debugger();
	if(skip_predictions) {
		return;
	}

	if(!model) {
		l("ERROR: No model given for show_prediction");
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
			$('a[href="#predict_tab"]').click();
		}
	}

	//log("Tensors O: " + tf.memory()["numTensors"]);
	memory_leak_debugger("show_prediction", start_tensors);
}

function show_or_hide_predictions (count) { var start_tensors = memory_leak_debugger();
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
	memory_leak_debugger("show_or_hide_predictions", start_tensors);
}

async function _print_predictions_text(count, example_predict_data) { var start_tensors = memory_leak_debugger();
	if(!finished_loading) {
		memory_leak_debugger("_print_predictions_text", start_tensors);
		return;
	}

	var count = 0;
	var example_predictions = $("#example_predictions");
	example_predictions.html("");
	var example_url = "traindata/" + $("#model_dataset").val() + "/examples.json"
	var example_predict_data = await get_cached_json(example_url)

	var html_contents = "";

	if(!(typeof(example_predict_data) == "object" && example_predict_data.length)) {
		console.warn("example_predict_data is not an object or empty")
	}

	for (var i = 0; i < example_predict_data.length; i++) {
		var tensor = tf.tensor(example_predict_data[i]);
		//log("Tensors K: " + tf.memory()["numTensors"]);
		if(tensor_shape_matches_model(tensor)) {
			var res;
			try {
				res = await model.predict([tensor]);

				var res_array = res.arraySync();
				await dispose(res);

				html_contents += JSON.stringify(example_predict_data[i]) + " = " + JSON.stringify(res_array) + "<br>";

				count++;
				$("#predict_error").html("");
			} catch (e) {
				if((""+e).includes("already disposed")) {
					console.warn("Tensors were already disposed. Maybe the model was recompiled or changed while predicting. This MAY be the cause of a problem, but it may also not be.");
				} else {
					_predict_error(e);
					await dispose(res);
				}
			}
		} else {
			log_once("tensor shape does not match model shape. Not predicting example text. Input shape/tensor shape:" + JSON.stringify(get_input_shape()) + ", " + JSON.stringify(tensor.shape));
		}

		await dispose(tensor);
		await tf.nextFrame();
	}

	if(html_contents) {
		example_predictions.html(html_contents);
	}

	memory_leak_debugger("_print_predictions_text", start_tensors);

	show_or_hide_predictions(count);

	return count;
}

async function _print_example_predictions (count) { var start_tensors = memory_leak_debugger();

	var count = 0;
	var example_predictions = $("#example_predictions");
	var dataset = $("#dataset").val();
	var full_dir = "traindata/" + dataset + "/example/";
	var dataset_url = 'traindata/index.php?&dataset=' + dataset + '&examples=1';
	if(is_cosmo_mode) {
		dataset_url = dataset_url + "&cosmo=1";
	}

	var x = await get_cached_json(dataset_url);
	if(x) {
		if(Object.keys(x).includes("example")) {
			var this_examples_hash = await md5(JSON.stringify(x["example"]));
			if(this_examples_hash != predict_examples_hash) {
				predict_examples_hash = this_examples_hash;
			}
			var examples = x["example"];
			if(examples) {
				var str = "";
				[str, count] = await _get_example_string(examples, count, full_dir);

				if(str) {
					example_predictions.html(str);
				}
			}
		}
	}

	memory_leak_debugger("_print_example_predictions", start_tensors);

	show_or_hide_predictions(count);

	return count;
}

async function _get_example_string (examples, count, full_dir) { var start_tensors = memory_leak_debugger();
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
			str += "<div class='full_example_image_prediction'><img src='" + img_url + "' class='example_images' onload='predict_demo(this, " + i + ")' onclick='predict_demo(this, " + i + ")' /><br><div class='predict_demo_result'></div></div>";
		}
	}

	memory_leak_debugger("_get_example_string", start_tensors);
	return [str, count];
}

function get_index_of_highest_category (predictions_tensor) { var start_tensors = memory_leak_debugger();
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

		memory_leak_debugger("get_index_of_highest_category", start_tensors);

		return highest_index;
	} catch (e) {
		if(("" + e).includes("disposed")) {
			console.warn("Tensor, probably predictions_tensor, already disposed");
		} else {
			console.warn(e);
		}

		memory_leak_debugger("get_index_of_highest_category", start_tensors);

		return null;
	}
}

async function draw_heatmap (predictions_tensor, predict_data, is_from_webcam=0) { var start_tensors = memory_leak_debugger();
	if(!(
		await input_shape_is_image(is_from_webcam) && 
		$("#show_grad_cam").is(":checked") && 
		!started_training && 
		(await output_size_at_layer(get_number_of_layers())).length == 2)
	) {
		memory_leak_debugger("draw_heatmap", start_tensors);
		return;
	}

	var strongest_category = get_index_of_highest_category(predictions_tensor);

	var original_disable_layer_debuggers = disable_layer_debuggers;
	disable_layer_debuggers = 1;
	var heatmap = await gradClassActivationMap(model, predict_data, strongest_category);
	disable_layer_debuggers = original_disable_layer_debuggers;

	if(heatmap) {
		var canvas = $("#grad_cam_heatmap")[0];
		var img = await heatmap.arraySync()[0];

		var max_height_width = Math.min(150, Math.floor(window.innerWidth / 5));

		var shape = await get_shape_from_array(img);
		if(shape.length != 3) {
			$("#grad_cam_heatmap").hide();
		} else {
			var height = shape[0];
			var width = shape[1];

			var largest = Math.max(height, width);

			var pxsz = 1;

			while ((pxsz * largest) < max_height_width) {
				pxsz += 1;
			}

			var res = draw_grid(canvas, pxsz, img, 1, 0);
			$("#grad_cam_heatmap").show();
		}
	} else {
		$("#grad_cam_heatmap").hide();
	}

	await dispose(heatmap);

	memory_leak_debugger("draw_heatmap", start_tensors);
}

function _get_resized_webcam (predict_data, h, w) { var start_tensors = memory_leak_debugger();
	var res = tf.tidy(() => {
		var divide_by = parseFloat($("#divide_by").val());
		var r = predict_data.resizeNearestNeighbor([h, w]).toFloat().expandDims();

		if(divide_by != 1) {
			r = tf.tidy(() => { return tf.divNoNan(r, divide_by) });
		}

		return r;
	})

	memory_leak_debugger("_get_resized_webcam", start_tensors + 1);
	return res;
}

async function predict_webcam () { var start_tensors = memory_leak_debugger();
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

	var predict_data = tf.tidy(() => {
		return _get_resized_webcam(cam_img, height, width);
	});

	await dispose(cam_img);


	var predictions_tensor = null;
	try {
		predictions_tensor = tf.tidy(() => {
			return model.predict([predict_data]);
		});
	} catch (e) {
		if(("" + e).includes("already disposed")) {
			console.warn("Model Tensor already disposed");
		} else if(("" + e).includes("n is undefined")) {
			console.warn("Model weights probably already disposed, this is usually not harmful");
		} else {
			l("Error (512): " + e);

			console.error(e);
		}

		memory_leak_debugger("predict_webcam", start_tensors);
		currently_predicting_webcam = false;

		await dispose(predictions_tensor);
		await dispose(predict_data);

		return;
	}

	await draw_heatmap(predictions_tensor, predict_data, 1);

	var predictions = predictions_tensor.arraySync();

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
					draw_multi_channel(predictions_tensor, webcam_prediction, pxsz)
				}
			} else {
				await _webcam_predict_text(webcam_prediction, predictions[0]);
			}
		} else {
			console.warn("predictions is empty for predict_webcam");
		}
	}

	await dispose(predictions_tensor);
	await dispose(predict_data);

	await tf.nextFrame();

	memory_leak_debugger("predict_webcam", start_tensors);

	currently_predicting_webcam = false;
}

function draw_multi_channel (predictions_tensor, webcam_prediction, pxsz) { var start_tensors = memory_leak_debugger();
	var transposed = predictions_tensor.transpose([3, 1, 2, 0]).arraySync();

	for (var i = 0; i < predictions_tensor.shape[3]; i++) {
		var canvas = $('<canvas/>', {class: "layer_image"}).prop({
			height: pxsz * predictions_tensor.shape[1],
			width: pxsz * predictions_tensor.shape[2]
		});

		webcam_prediction.append(canvas);

		var d = transposed[i];

		draw_grid(canvas, pxsz, d, 1, 1);
	}

	memory_leak_debugger("draw_multi_channel", start_tensors);
}

function draw_rgb (predictions_tensor, predictions, pxsz, webcam_prediction) { var start_tensors = memory_leak_debugger();
	var canvas = $('<canvas/>', {class: "layer_image"}).prop({
		width: pxsz * predictions_tensor.shape[2],
		height: pxsz * predictions_tensor.shape[1],
	});

	webcam_prediction.append(canvas);

	draw_grid(canvas, pxsz, predictions[0], 1, 0);
	memory_leak_debugger("draw_rgb", start_tensors);
}

async function _webcam_predict_text (webcam_prediction, predictions) { var start_tensors = memory_leak_debugger();
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

	memory_leak_debugger("_webcam_predict_text", start_tensors);
}

async function _predict_webcam_html(predictions, webcam_prediction, max_i) { var start_tensors = memory_leak_debugger();
	var str = "<table class='predict_table'>";

	for (let i = 0; i < predictions.length; i++) {
		str += _webcam_prediction_row(i, predictions, max_i);
	}

	str += "</table>";

	webcam_prediction.append(str);

	memory_leak_debugger("_predict_webcam_html", start_tensors);
}

function _webcam_prediction_row (i, predictions, max_i) { var start_tensors = memory_leak_debugger();
	assert(typeof(i) == "number", "i is not a number");
	assert(typeof(max_i) == "number", "max_i is not a number");
	assert(typeof(predictions) == "object", "predictions is not an object");

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

	memory_leak_debugger("_webcam_prediction_row", start_tensors);
	return str;
}

async function show_webcam (force_restart) { var start_tensors = memory_leak_debugger();
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
				var videoElement = document.createElement('video');
				videoElement.width = 256;
				videoElement.height = 256;
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
					cam_config["deviceId"] = available_webcams_ids[parseInt($("#which_webcam").val())];
				}

				//log(cam_config);
				cam = await tf.data.webcam(videoElement, cam_config);

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
		console.error(e);
	}

	memory_leak_debugger("show_webcam", start_tensors);

	return cam;
}

/* This function checks to see if the shape of the tensor matches the input layer shape of the model. */

function tensor_shape_matches_model (tensor) { var start_tensors = memory_leak_debugger();
	var res = true;
	var input_layer_shape = eval(JSON.stringify(model.layers[0].input.shape));
	input_layer_shape.shift();

	var tensor_shape = eval(JSON.stringify(tensor.shape));
	tensor_shape.shift();

	if(tensor_shape.join(",") != input_layer_shape.join(",")) {
		res = false;
	}

	memory_leak_debugger("tensor_shape_matches_model", start_tensors);

	return res;
}

function draw_bars_or_numbers (i, predictions, max) { var start_tensors = memory_leak_debugger();
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

	memory_leak_debugger("draw_bars_or_numbers", start_tensors);
	return html;
}

async function predict_handdrawn () { var start_tensors = memory_leak_debugger();
	if(has_zero_output_shape) {
		return;
	}

	if(!await input_shape_is_image()) {
		return;
	}

	if(!model) {
		log("ERROR: model is undefined");
		return;
	}

	if(!Object.keys(atrament_data).includes("sketcher")) {
		if(sketcher_warning >= 1) {
			console.warn("Sketcher is not (yet?) defined. Not predicting handdrawn. If this occurs more than once, it may imply a bug.");
		}
		sketcher_warning++;

		return;
	}


	var predict_data;
	try {
		predict_data = tf.tidy(() => {
			return tf.image.resizeNearestNeighbor(
				tf.browser.fromPixels(atrament_data.sketcher.canvas),
				[height, width]
			).expandDims();
		});
	} catch (e) {
		console.error(e);
		await dispose(predict_data);
		return;
	}

	if(!predict_data) {
		await dispose(predict_data);
		console.error("no predict data");
		return;
	}

	var divide_by = parseFloat($("#divide_by").val());

	if(divide_by != 1) {
		var divided_data = tf.tidy(() => {
			return tf.divNoNan(predict_data, divide_by);
		});

		await dispose(predict_data);

		predict_data = divided_data;
	}

	var predictions_tensor = null;
	try {
		predictions_tensor = tf.tidy(() => {
			return model.predict([predict_data]);
		});
	} catch (e) {
		if(("" + e).includes("is already disposed")) {
			console.warn("weights are already disposed. Not predicting handdrawn");
		} else if(("" + e).includes("n is undefined")) {
			console.warn("Model weights probably already disposed, this is usually not harmful");
		} else {
			l("Predict data shape:", predict_data.shape);
			console.error(e);
			await dispose(predictions_tensor);
			l("Error (443): " + e);
		}

		memory_leak_debugger("predict_handdrawn", start_tensors);
		return;
	}

	await draw_heatmap(predictions_tensor, predict_data);

	await _predict_handdrawn(predictions_tensor);

	await dispose(predictions_tensor);
	await dispose(predict_data);

	allow_editable_labels();

	memory_leak_debugger("predict_handdrawn", start_tensors);
}

async function _predict_handdrawn(predictions_tensor) { var start_tensors = memory_leak_debugger();

	var handdrawn_predictions = $("#handdrawn_predictions");
	handdrawn_predictions.html("");

	var ret = null;

	if(model_output_shape_looks_like_classification()) {
		ret = await _classification_handdrawn(predictions_tensor, handdrawn_predictions);
	} else if(model.outputShape.length == 4) {
		ret = await _image_output_handdrawn(predictions_tensor);
	} else {
		console.warn("Different output shapes not yet supported:", model.outputShape);
	}

	memory_leak_debugger("_predict_handdrawn", start_tensors);

	return ret;
}

async function _image_output_handdrawn(predictions_tensor) { var start_tensors = memory_leak_debugger();
	var predictions_tensor_transposed = predictions_tensor.transpose([3, 1, 2, 0]);
	var predictions = predictions_tensor_transposed.arraySync();

	var pxsz = 1;

	var largest = Math.max(predictions_tensor_transposed[1], predictions_tensor_transposed[2]);

	var max_height_width = Math.min(150, Math.floor(window.innerWidth / 5));
	while ((pxsz * largest) < max_height_width) {
		pxsz += 1;
	}


	for (var i = 0; i < predictions.length; i++) {
		var canvas = $('<canvas/>', {class: "layer_image"}).prop({
			width: pxsz * predictions_tensor.shape[2],
			height: pxsz * predictions_tensor.shape[1],
		});

		$("#handdrawn_predictions").append(canvas);

		var res = draw_grid(canvas, pxsz, predictions[i], 1, 1);
	}

	await dispose(predictions_tensor_transposed);
	memory_leak_debugger("_image_output_handdrawn", start_tensors);
}

async function _classification_handdrawn (predictions_tensor, handdrawn_predictions) { var start_tensors = memory_leak_debugger();

	var predictions = predictions_tensor.arraySync();

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
	memory_leak_debugger("_classification_handdrawn", start_tensors);
}

async function repredict () { var start_tensors = memory_leak_debugger();
	await show_prediction(0, 1);
	await predict_webcam();
	await predict_handdrawn();
	memory_leak_debugger("repredict", start_tensors);
}
