"use strict";

async function switch_to_next_camera_predict () {
	webcam_id++;
	webcam_id = webcam_id % (webcam_modes.length);
	await show_webcam(1);
}

async function get_label_data () {
	if(($("#data_origin").val() == "image" || await input_shape_is_image()) && $("#data_origin").val() == "default") {
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
	output.onload = async function() {
		URL.revokeObjectURL(output.src);
		$("#output")[0].height = $("#output")[0].naturalHeight;
		$("#output")[0].width = $("#output")[0].naturalWidth;

		await predict(output);
		
		$(".only_show_when_predicting_image_file").show();
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
				l("Error (101): " + e);
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

			var desc = $($(".predict_demo_result")[nr]);
			desc.html("");

			if(model.outputShape.length == 4) {
				var predictions_tensor_transposed = predictions_tensor.transpose([3, 1, 2, 0]);
				//predictions_tensor_transposed.print()

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
			} else {
				var predictions = predictions_tensor.dataSync();
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

						var str = "";
						if(show_bars_instead_of_numbers()) {
							str = "<tr><td class='label_element'>" + label + "</td><td><span class='bar'><span style='width: " + w + "px'></span></span></td></tr>";
							if(i == max_i && show_green) {
								//str = "<b class='best_result'>" + str + "</b>";
								str = "<tr><td class='label_element'>" + label + "</td><td><span class='bar'><span class='highest_bar' style='width: " + w + "px'></span></span></td></tr>";
							}
						} else {
							str = "<tr><td class='label_element'>" + label + "</td><td>" + probability + "</td></tr>";
							if(i == max_i && show_green) {
								str = "<tr><td class='label_element'>" + label + "</td><td><b class='best_result label_input_element'>" + probability+ "</b></td></tr>";
							}
						}
						fullstr += str;
					}

					fullstr += "</table>";
					desc.html(fullstr);
				}

				$("#predict_error").hide();
				$("#predict_error").html("");
			}
		} else {
			log("No model");
		}

		dispose(tensor_img);
		dispose(predictions_tensor);
	} catch (e) {
		_predict_error(e);
	}

	//tf.engine().endScope();

	hide_unused_layer_visualization_headers();

	change_output_and_example_image_size();

	allow_editable_labels();
}

async function predict (item, force_category, dont_write_to_predict_tab) {
	await enable_everything();

	var pred_tab = "prediction";

	$("#" + pred_tab).html("").show();
	$("#predict_error").html("").hide();
	var predictions = [];

	var str = "";

	tf.engine().startScope();
	try {
		var predict_data = null;

		if(await input_shape_is_image()) {
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
			l('Error: Expected input shape: [' + eval(JSON.stringify(expected)).join(', ') + '], but got [' + predict_data.shape.join(', ') + ']');
			throw new Error('Expected input shape: [' + eval(JSON.stringify(expected)).join(', ') + '], but got [' + predict_data.shape.join(', ') + ']');
			return;
		}

		var divide_by = parseFloat($("#divide_by").val());

		if(divide_by != 1) {
			predict_data = tf.divNoNan(predict_data, divide_by);
		}

		//log(predict_data.arraySync());
		var predictions_tensor = null;
		try {
			predictions_tensor = await model.predict([predict_data], [1, 1]);
		} catch (e) {
			l("Predict data shape:" + predict_data.shape);
			console.error(e);
			l("Error (1201): " + e);
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
			if(model.outputShape.length == 4) {
				var pxsz = 1;

				var predictions_tensor_transposed = predictions_tensor.transpose([3, 1, 2, 0]);
				//predictions_tensor_transposed.print()

				var largest = Math.max(predictions_tensor_transposed[1], predictions_tensor_transposed[2]);

				var max_height_width = Math.min(150, Math.floor(window.innerWidth / 5));
				while ((pxsz * largest) < max_height_width) {
					pxsz += 1;
				}

				predictions = predictions_tensor_transposed.arraySync();
				for (var i = 0; i < predictions.length; i++) {
					var canvas = $('<canvas/>', {class: "layer_image"}).prop({
						width: pxsz * predictions_tensor.shape[2],
						height: pxsz * predictions_tensor.shape[1],
					});

					$("#" + pred_tab).append(canvas);

					var res = draw_grid(canvas, pxsz, predictions[i], 1, 1);
					log(res);
				}
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

					str += "<table class='predict_table'>";

					for (let i = 0; i < predictions.length; i++) {
						var label = labels[i % labels.length];
						var probability = predictions[i];
						var this_str = "";
						if(label) {
							this_str = label;
						}

						var w = Math.floor(probability * 50);

						if(show_bars_instead_of_numbers()) {
							if(i == max_i && show_green) {
								str += "<tr><td class='label_element'>" + this_str + "</td><td><span class='bar'><span class='highest_bar' style='width: " + w + "px'></span></span></td></tr>";
							} else {
								str += "<tr><td class='label_element'>" + this_str + "</td><td><span class='bar'><span style='width: " + w + "px'></span></span></td></tr>";
							}
						} else {
							if(i == max_i && show_green) {
								str += "<tr><td>" + this_str + "</td><td><b class='max_prediction'>" + probability + "</b></td></tr>";
							} else {
								str += "<tr><td>" + this_str + "</td><td>" + probability + "</td></tr>";
							}
						}
					}

					str += "</table>";
				}
			}
		}

		log("attempting to add to ", $("#" + pred_tab));
		$("#" + pred_tab).append(str).show();

		$("#predict_error").html("").hide();

		dispose(predict_data);
		dispose(predictions_tensor);

		await cosmo_mode_auto_image_descriptor();
	} catch (e) {
		var estr = "" + e;
		if(!estr.includes("yped")) {
			_predict_error(e);
		} else {
			console.error(e);
		}
	}

	tf.engine().endScope();

	allow_editable_labels();

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

			if(await input_shape_is_image()) {
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
									str += "<div class='full_example_image_prediction'><img src='" + img_url + "' class='example_images' onload='predict_demo(this, " + i + ")' onclick='predict_demo(this, " + i + ")' /><br><div class='predict_demo_result'></div></div>";
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

				var html_contents = "";

				if(typeof(example_predict_data) == "object" && example_predict_data.length) {
					tf.tidy(() => {
						for (var i = 0; i < example_predict_data.length; i++) {
							var tensor = tf.tensor(example_predict_data[i]);
							if(tensor_shape_matches_model(tensor)) {
								try {
									var res = model.predict([tensor]).arraySync();

									html_contents += JSON.stringify(example_predict_data[i]) + " = " + JSON.stringify(res) + "<br>";
									count++;
									$("#predict_error").html("");
								} catch (e) {
									_predict_error(e);
								}
							}
						}
					});
				}

				if(html_contents) {
					example_predictions.html(html_contents);
				}
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
		} else {
			$(".show_when_has_examples").hide();
			$("#example_predictions").hide();
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
		$("#example_predictions").hide();
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

async function draw_heatmap (predictions_tensor, predict_data, is_from_webcam=0) {
	if(await input_shape_is_image(is_from_webcam) && $("#show_grad_cam").is(":checked") && !started_training && (await output_size_at_layer(get_number_of_layers())).length == 2) {
		tf.engine().startScope();
		var strongest_category = get_index_of_highest_category(predictions_tensor);

		var original_disable_layer_debuggers = disable_layer_debuggers;
		disable_layer_debuggers = 1;
		var heatmap = await gradClassActivationMap(model, predict_data, strongest_category);
		disable_layer_debuggers = original_disable_layer_debuggers;

		/* Workaround: for some reason the last layer apply changes the model. This will re-create the model. It's okay, because it's disabled in training anyways */
		await _create_model();

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
	predict_data = predict_data.resizeNearestNeighbor([height, width]).toFloat().expandDims()

	var divide_by = parseFloat($("#divide_by").val());

	if(divide_by != 1) {
		predict_data = tf.divNoNan(predict_data, divide_by);
	}

	var predictions_tensor = null;
	try {
		predictions_tensor = await model.predict([predict_data], [1, 1]);
	} catch (e) {
		l("Predict data shape:" + predict_data.shape);
		console.error(e);
		l("Error (512): " + e);
		return;
	}

	await draw_heatmap(predictions_tensor, predict_data, 1);

	var predictions = predictions_tensor.dataSync();

	var webcam_prediction = $("#webcam_prediction");
	webcam_prediction.html("").show();

	if(!await input_shape_is_image() && labels.length == 0) {
		var str = "[" + predictions.join(", ") + "]";
		$("#webcam_prediction").append(str);
	} else {
		if(predictions.length) {
			$("#webcam_prediction").html("");
			if(model.outputShape.length == 4) {
				//log("=== predictions/transposed shape ===")
				//log(predictions_tensor.shape);
				var predictions = predictions_tensor.arraySync();

				var pxsz = 1;

				var largest = Math.max(predictions_tensor[1], predictions_tensor[2]);

				var max_height_width = Math.min(150, Math.floor(window.innerWidth / 5));
				while ((pxsz * largest) < max_height_width) {
					pxsz += 1;
				}

				if(predictions_tensor.shape[3] == 3) {
					var canvas = $('<canvas/>', {class: "layer_image"}).prop({
						width: pxsz * predictions_tensor.shape[2],
						height: pxsz * predictions_tensor.shape[1],
					});

					$("#webcam_prediction").append(canvas);

					//        draw_grid(canvas, pixel_size, colors, denormalize, black_and_white, onclick, multiply_by, data_hash) {
					draw_grid(canvas, pxsz, predictions[0], 1, 0);
				} else {
					var transposed = predictions_tensor.transpose([3, 1, 2, 0]).arraySync();

					for (var i = 0; i < predictions_tensor.shape[3]; i++) {
						var canvas = $('<canvas/>', {class: "layer_image"}).prop({
							height: pxsz * predictions_tensor.shape[1],
							width: pxsz * predictions_tensor.shape[2]
						});

						$("#webcam_prediction").append(canvas);

						var d = transposed[i];

						//        draw_grid(canvas, pixel_size, colors, denormalize, black_and_white, onclick, multiply_by, data_hash) {
						draw_grid(canvas, pxsz, d, 1, 1);
					}
				}
			} else {
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

				str = "<table class='predict_table'>";

				for (let i = 0; i < predictions.length; i++) {
					var label = labels[i % labels.length];
					var probability = predictions[i];

					var w = Math.floor(probability * 50);

					if(show_bars_instead_of_numbers()) {
						if(i == max_i) {
							//str = "<b class='max_prediction'>" + str + "</b>";
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
				}

				str += "</table>";

				webcam_prediction.append(str);
			}
		}
	}

	tf.engine().endScope();
}

async function show_webcam (force_restart) {
	await init_webcams();

	var stopped = 0;

	if(await input_shape_is_image()) {
		$("#show_webcam_button").html("<span class='large_button'>&#128711;&#128247;</span>");
		if(cam) {
			if(!cosmo_mode) {
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

	if(!await input_shape_is_image()) {
		return;
	}

	if(!model) {
		log("ERROR: model is undefined");
		return;
	}

	if(Object.keys(atrament_data).includes("sketcher")) {
		if(sketcher_warning >= 1) {
			console.warn("Sketcher is not (yet?) defined. Not predicting handdrawn. If this occurs more than once, it may imply a bug.");
		}
		sketcher_warning++;
	}


	tf.engine().startScope();
	var predict_data;
	try {
		predict_data = tf.image.resizeNearestNeighbor(tf.browser.fromPixels(atrament_data.sketcher.canvas), [height, width]).expandDims();
	} catch (e) {
		console.error(e);
		return;
	}

	var divide_by = parseFloat($("#divide_by").val());

	if(divide_by != 1) {
		predict_data = tf.divNoNan(predict_data, divide_by);
	}

	var predictions_tensor = null;
	try {
		predictions_tensor = await model.predict([predict_data], [1, 1]);
	} catch (e) {
		l("Predict data shape:" + predict_data.shape);
		console.error(e);
		l("Error (443): " + e);
		return;
	}

	await draw_heatmap(predictions_tensor, predict_data);

	var handdrawn_predictions = $("#handdrawn_predictions");
	handdrawn_predictions.html("");

	if(model.outputShape.length == 2) {
		var predictions = predictions_tensor.arraySync();

		var max = 0;

		for (var i = 0; i < predictions[0].length; i++) {
			if(max < predictions[0][i]) {
				max = predictions[0][i];
			}
		}

		var html = "<table class='predict_table'>";

		for (var i = 0; i < predictions[0].length; i++) {
			var label = labels[i % labels.length];
			var val = predictions[0][i];
			var w = Math.floor(val * 50);

			if(show_bars_instead_of_numbers()) {
				if(label) {
					if(val == max) {
						html += "<tr><td class='label_element'>" + label + "</td><td><span class='bar'><span class='highest_bar' style='width: " + w + "px'></span></span></td></tr>";
					} else {
						html += "<tr><td class='label_element'>" + label + "</td><td><span class='bar'><span style='width: " + w + "px'></span></span></td></tr>";
					}
				} else {
					if(val == max) {
						html += "<tr><td><span class='bar'><span class='highest_bar' style='width: " + w + "px'></span></span></td></tr>";
					} else {
						html += "<tr><td><span class='bar'><span style='width: " + w + "px'></span></span></td></tr>";
					}
				}
			} else {
				if(label) {
					if(val == max) {
						html += "<tr><td><b class='best_result label_element'>" + label + "</td><td>" + val + "</b></td></tr>\n";
					} else {
						html += "<tr><td class='label_element'>" + label + "</td><td>" + predictions[0][i] + "</td></tr>\n";
					}
				} else {
					if(val == max) {
						html += "<tr><td><b class='best_result label_element'>" + predictions[0][i] + "</b></td></tr>\n";
					} else {
						html += "<tr><td>" + predictions[0][i] + "</td></tr>";
					}
				}
			}
		}

		html += "</table>";

		handdrawn_predictions.html(html);
	} else if(model.outputShape.length == 4) {
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
	} else {
		log("Different output shapes not yet supported");
	}

	tf.engine().endScope();

	allow_editable_labels();
}

async function repredict () {
	await show_prediction();
	await predict_webcam();
	await predict_handdrawn();
}
