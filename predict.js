"use strict";

async function switch_to_next_camera_predict () {
	webcam_id++;
	webcam_id = webcam_id % (webcam_modes.length);
	await show_webcam(1);
}

async function get_label_data () {
	if(($("#data_origin").val() == "image" || input_shape_is_image()) && $("#data_origin").val() == "default") {
		let imageData = await get_image_data(1);

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
}

var loadFile = (function(event) {
	var output = document.getElementById("output");
	$("#output").removeAttr("src");

	output.src = URL.createObjectURL(event.target.files[0]);
	output.onload = function() {
		URL.revokeObjectURL(output.src);
		$("#output")[0].height = $("#output")[0].naturalHeight;
		$("#output")[0].width = $("#output")[0].naturalWidth;

		predict(output);
	};

	$("#output").show();
});

function _predict_error (e) {
	console.warn(e);
	l(e);
	$("#prediction").hide();
	$("#predict_error").html(e).show();
	$("#example_predictions").html("");
	$(".show_when_has_examples").hide();

}

let predict_demo = async function (item, nr, tried_again = 0) {
	//tf.engine().startScope();
	
	if(has_zero_output_shape) {
		return;
	}

	while (is_hidden_or_has_hidden_parent($("#predict_tab"))) {
		await delay(200);
	}

	var tensor_img;

	try {
		if(labels.length == 0) {
			await get_label_data();
		}
	} catch (e) {
		_predict_error(e);
	}

	try {
		$(item).prop("width", $(item)[0].naturalWidth);
		$(item).prop("height", $(item)[0].naturalHeight);
	} catch (e) {
		_predict_error(e);
	}

	try {
		tensor_img = tf.tidy(() => {
			return tf.browser.fromPixels(item).resizeNearestNeighbor([height, width]).toFloat().expandDims()
		});
	} catch (e) {
		_predict_error(e);
	}

	try {

		if($("#divide_by").val() != 1) {
			var new_tensor_img = tf.divNoNan(tensor_img, parseFloat($("#divide_by").val()));
			dispose(tensor_img);
			tensor_img = tf.tensor(await new_tensor_img.arraySync());
			dispose(new_tensor_img);
		}
	} catch (e) {
		_predict_error(e);
	}

	try {
		if(!tensor_shape_matches_model(tensor_img)) {
			dispose(tensor_img);
			return;
		}
	} catch (e) {
		_predict_error(e);
	}

	try {
		while (!tf.backend()) {
			await delay(100);
		}

		if(model) {
			var last_layer_activation = get_last_layer_activation_function();
			var show_green = last_layer_activation == "softmax" ? 1 : 0;


			var model_input_shape = JSON.parse(JSON.stringify((model.input.shape)));
			model_input_shape.shift();

			var tensor_img_shape = JSON.parse(JSON.stringify(tensor_img.shape));
			tensor_img_shape.shift();

			if(JSON.stringify(model_input_shape) != JSON.stringify(tensor_img_shape)) {
				log("Model input shape: ", model_input_shape, "Tensor-Img-shape:", tensor_img_shape);
				return;
			}

			var predictions_tensor = undefined;
			try {
				predictions_tensor = await model.predict(tensor_img);


				await draw_heatmap(predictions_tensor, tensor_img);
			} catch (e) {

				log("================================= Tensor_Img");
				log(tensor_img);
				tensor_img.print();
				log("=================================");

				_predict_error(e);

				if(tried_again) {
					return;
				}

				return predict_demo(item, nr, 1);
			}

			var predictions = predictions_tensor.dataSync();
			dispose(predictions_tensor);

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

				var desc = $($(".predict_demo_result")[nr]);

				var fullstr = "";

				for (let i = 0; i < predictions.length; i++) {
					var label = labels[i % labels.length];
					var probability = predictions[i];
					var str = label + ": " + probability + "<br>\n";
					if(i == max_i && show_green) {
						str = "<b class='best_result'>" + str + "</b>";
					}
					fullstr += str;
				}
				desc.html(fullstr);
			}

			$("#predict_error").hide();
			$("#predict_error").html("");
		}

		dispose(tensor_img);
	} catch (e) {
		_predict_error(e);
	}

	//tf.engine().endScope();

	hide_unused_layer_visualization_headers();

	change_output_and_example_image_size();
}

async function predict (item, force_category, dont_write_to_predict_tab) {
	enable_everything();

	$("#prediction").html("").show();
	$("#predict_error").html("").hide();
	var predictions = [];

	var str = "";

	tf.engine().startScope();
	try {
		var predict_data = null;

		if(input_shape_is_image()) {
			predict_data = tf.browser.fromPixels(item).resizeNearestNeighbor([height, width]).toFloat().expandDims();
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

		if(!tensor_shape_matches_model(predict_data)) {
			var expected = eval(JSON.stringify(model.layers[0].input.shape));
			expected[0] = "null";
			throw new Error('Expected input shape: [' + eval(JSON.stringify(expected)).join(', ') + '], but got [' + predict_data.shape.join(', ') + ']');
			return;
		}

		var divide_by = parseFloat($("#divide_by").val());

		if(divide_by != 1) {
			predict_data = tf.divNoNan(predict_data, divide_by);
		}

		//log(predict_data.arraySync());
		var predictions_tensor = await model.predict([predict_data], [1, 1]);

		await draw_heatmap(predictions_tensor, predict_data);

		predictions = predictions_tensor.dataSync();

		dispose(predict_data);
		dispose(predictions_tensor);

		//log(predictions);

		if(!input_shape_is_image() && labels.length == 0) {
			str = "[" + predictions.join(", ") + "]";
		} else {
			var last_layer_activation = get_last_layer_activation_function();
			var show_green = last_layer_activation == "softmax" ? 1 : 0;
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

				if(labels.length == 0) {
					await get_label_data();
				}

				for (let i = 0; i < predictions.length; i++) {
					var label = labels[i % labels.length];
					var probability = predictions[i];
					var this_str = "";
					if(label) {
						this_str += label + ": ";
					}

					if(get_last_layer_activation_function() == "softmax") {
						probability = (probability * 100) + "%";
					}

					this_str += probability + "\n";
					if(i == max_i && show_green) {
						str = str + "<b class='max_prediction'>" + this_str + "</b>";
					} else {
						str = str + this_str;
					}
					str += "<br>";
					if(!((i + 1) % labels.length)) {
						str += "<hr>";
					}
				}
			}
		}
		if(!dont_write_to_predict_tab) {
			$("#prediction").append(str);
		}
		$("#predict_error").html("").hide();
	} catch (e) {
		_predict_error(e);
	}
	tf.engine().endScope();

	return str;
}

async function show_prediction (keep_show_after_training_hidden, dont_go_to_tab) {
	if(skip_predictions) {
		return;
	}

	if(model) {
		$(".show_when_predicting").show();
		$(".show_when_has_examples").hide();

		hide_unused_layer_visualization_headers();

		if(!keep_show_after_training_hidden) {
			$(".show_after_training").show();
		}

		var example_predictions = $("#example_predictions");

		if($("#data_origin").val() == "default") {
			var count = 0;

			if(input_shape_is_image()) {
				var dataset = $("#dataset").val();
				var full_dir = "traindata/" + dataset + "/example/";
				var dataset_url = 'traindata/index.php?&dataset=' + dataset + '&examples=1';

				var x = await get_cached_json(dataset_url);

				if(x) {
					if(Object.keys(x).includes("example")) {
						var this_examples_hash = await md5(JSON.stringify(x["example"]));
						if(this_examples_hash != predict_examples_hash) {
							example_predictions.html("");
							predict_examples_hash = this_examples_hash;
						}
						var examples = x["example"];
						if(examples) {
							var str = "";
							for (var i = 0; i < examples.length; i++) {
								count++;
								var img_url = full_dir + "/" + examples[i];
								var img_elem = $("img[src$='" + img_url + "']");
								if(img_elem.length) {
									predict_demo(img_elem[0], i);
								} else {
									str += "<hr><img src='" + img_url + "' class='example_images' onload='predict_demo(this, " + i + ")' onclick='predict_demo(this, " + i + ")' /><br><div class='predict_demo_result'></div>";
								}
							}

							if(str) {
								example_predictions.html(str);
							}
						}
					}
				}
			} else {
				example_predictions.html("");
				var example_url = "traindata/" + $("#model_dataset").val() + "/examples.json"
				var example_predict_data = await get_cached_json(example_url)

				if(typeof(example_predict_data) == "object" && example_predict_data.length) {
					tf.tidy(() => {
						for (var i = 0; i < example_predict_data.length; i++) {
							var tensor = tf.tensor(example_predict_data[i]);
							if(tensor_shape_matches_model(tensor)) {
								try {
									var res = model.predict([tensor]).arraySync();

									example_predictions.append(JSON.stringify(example_predict_data[i]) + " = " + JSON.stringify(res) + "<br>");
									count++;
									$("#predict_error").html("");
								} catch (e) {
									_predict_error(e);
								}
							}
						}
					});
				}
			}

			if(count) {
				$(".show_when_has_examples").show();
				$(".show_when_predicting").show();
				$(".example_predictions").show();
			} else {
				$(".show_when_has_examples").hide();
				$(".example_predictions").hide();
				$(".show_when_predicting").hide();
			}
		} else {
			$(".show_when_has_examples").hide();
			$(".example_predictions").hide();
			$(".show_when_predicting").hide();
		}

		if(!dont_go_to_tab) {
			if($("#jump_to_interesting_tab").is(":checked")) {
				$('a[href="#predict_tab"]').click();
			}
		}
	} else {
		l("ERROR: No model given for show_prediction");
		$(".show_when_has_examples").hide();
		$(".example_predictions").hide();
		$(".show_when_predicting").hide();
	}
}

function get_index_of_highest_category (predictions_tensor) {
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
}

async function draw_heatmap (predictions_tensor, predict_data) {
	if(input_shape_is_image() && $("#show_grad_cam").is(":checked")) {
		tf.engine().startScope();
		var strongest_category = get_index_of_highest_category(predictions_tensor);

		var original_disable_layer_debuggers = disable_layer_debuggers;
		disable_layer_debuggers = 1;
		var heatmap = await gradClassActivationMap(model, predict_data, strongest_category);
		disable_layer_debuggers = original_disable_layer_debuggers;

		/* Workaround: for some reason the last layer apply changes the model. This will re-create the model. It's okay, because it's disabled in training anyways */
		_create_model();

		if(heatmap) {
			/*
			log(heatmap);
			log(heatmap.shape);
			heatmap.print();
			*/

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
		tf.engine().endScope();
	}
}

async function predict_webcam () {
	if(!cam) {
		return;
	}

	if(is_hidden_or_has_hidden_parent($("#webcam"))) {
		return;
	}

	tf.engine().startScope();

	var predict_data = await cam.capture();
	predict_data = predict_data.resizeNearestNeighbor([height, height]).toFloat().expandDims()

	var divide_by = parseFloat($("#divide_by").val());

	if(divide_by != 1) {
		predict_data = tf.divNoNan(predict_data, divide_by);
	}

	var predictions_tensor = await model.predict([predict_data], [1, 1]);

	await draw_heatmap(predictions_tensor, predict_data);

	var predictions = predictions_tensor.dataSync();

	var webcam_prediction = $("#webcam_prediction");
	webcam_prediction.html("").show();

	if(!input_shape_is_image() && labels.length == 0) {
		var str = "[" + predictions.join(", ") + "]";
		$("#webcam_prediction").append(str);
	} else {
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

			if(labels.length == 0) {
				await get_label_data();
			}


			for (let i = 0; i < predictions.length; i++) {
				var label = labels[i % labels.length];
				var probability = predictions[i];
				if(get_last_layer_activation_function() == "softmax") {
					probability = (probability * 100) + "%";
				}

				var str = label + ": " + probability + "\n";
				if(i == max_i) {
					str = "<b class='max_prediction'>" + str + "</b>";
				}
				webcam_prediction.append(str);
			}
		}
	}

	tf.engine().endScope();
}

async function show_webcam (force_restart) {
	await init_webcams();

	var stopped = 0;

	if(input_shape_is_image()) {
		$("#show_webcam_button").html("Stop webcam");
		if(cam) {
			stop_webcam();
			stopped = 1;
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

			//webcam.append("<br><button onclick='predict_webcam()'>&#x1F4F8; Predict webcam image</button>");
		}
	} else {
		$("#webcam").hide().html("");
		if(cam) {
			cam.stop();
		}

		clearInterval(auto_predict_webcam_interval);
	}

	if(force_restart && stopped) {
		show_webcam();
	}
}

/* This function checks to see if the shape of the tensor matches the input layer shape of the model. */

function tensor_shape_matches_model (tensor) {
	var input_layer_shape = eval(JSON.stringify(model.layers[0].input.shape));
	input_layer_shape.shift();

	var tensor_shape = eval(JSON.stringify(tensor.shape));
	tensor_shape.shift();

	if(tensor_shape.join(",") != input_layer_shape.join(",")) {
		return false;
	}

	return true;
}

async function predict_handdrawn () {
	if(has_zero_output_shape) {
		return;
	}

	if(!input_shape_is_image()) {
		return;
	}

	if(!model) {
		log("ERROR: model is undefined");
		return;
	}

	tf.engine().startScope();
	var img = tf.image.resizeNearestNeighbor(tf.browser.fromPixels(atrament_data.sketcher.canvas), [height, width]).expandDims();

	var divide_by = parseFloat($("#divide_by").val());

	if(divide_by != 1) {
		img = tf.divNoNan(img, divide_by);
	}

	var predictions_tensor = model.predict(img);
	var predictions = predictions_tensor.arraySync();

	await draw_heatmap(predictions_tensor, img);

	var handdrawn_predictions = $("#handdrawn_predictions");
	handdrawn_predictions.html("");

	var html = "";

	var max = 0;

	for (var i = 0; i < predictions[0].length; i++) {
		if(max < predictions[0][i]) {
			max = predictions[0][i];
		}
	}

	for (var i = 0; i < predictions[0].length; i++) {
		var label = labels[i % labels.length];
		if(label) {
			if(predictions[0][i] == max) {
				html += "<b class='best_result'>" + label + ": " + predictions[0][i] + "</b><br>\n";
			} else {
				html += label + ": " + predictions[0][i] + "<br>\n";
			}
		} else {
			if(predictions[0][i] == max) {
				html += "<b class='best_result'>" + predictions[0][i] + "</b><br>\n";
			} else {
				html += predictions[0][i] + "<br>\n";
			}
		}
	}
	html += "";

	handdrawn_predictions.html(html);

	tf.engine().endScope();
}
