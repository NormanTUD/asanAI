"use strict";

async function switch_to_next_camera_predict () {
	webcam_id++;
	webcam_id = webcam_id % (webcam_modes.length);
	await show_webcam(1);
}

async function get_label_data () {
	if(!$("#data_origin").val() == "own") {
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

let predict_demo = async function (item, nr) {
	//tf.engine().startScope();

	try {
		if(labels.length == 0) {
			await get_label_data();
		}


		let tensor_img = tf.tidy(() => {
			return tf.browser.fromPixels(item).resizeNearestNeighbor([width, height]).toFloat().expandDims()
		});

		if($("#divide_by").val() != 1) {
			var new_tensor_img = tf.divNoNan(tensor_img, parseFloat($("#divide_by").val()));
			dispose(tensor_img);
			tensor_img = tf.tensor(await new_tensor_img.arraySync());
			dispose(new_tensor_img);
		}

		if(!tensor_shape_matches_model(tensor_img)) {
			dispose(tensor_img);
			return;
		}

		if(model) {
			var show_green = $("#data_origin").val() != "csv";
			var predictions_tensor = await model.predict([tensor_img]);
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
						str = "<b style='color: green'>" + str + "</b>";
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
		console.warn(e);
		l(e);
		$("#prediction").hide();
		$("#predict_error").show();
		$("#predict_error").html(e);
		$("#example_predictions").html("");
	}

	//tf.engine().endScope();

	hide_unused_layer_visualization_headers();

	change_output_and_example_image_size();
}

function _get_category () {
	var category = $("#dataset_category").val();
	if($("#data_origin").val() != "default") {
		if($("#data_origin").val() == "image") {
			category = "image";
		} else {
			category = "own";
		}
	}
	return category;
}

async function predict (item, force_category, dont_write_to_predict_tab) {
	enable_everything();

	var category = "";
	if(force_category) {
		category = force_category;
	}
	category = _get_category();

	$("#prediction").html("").show();
	$("#predict_error").html("").hide();
	var predictions = [];

	var str = "";

	tf.engine().startScope();
	try {
		var predict_data = null;

		if(input_shape_is_image()) {
			predict_data = tf.browser.fromPixels(item).resizeNearestNeighbor([width, height]).toFloat().expandDims();
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

		log(predict_data.arraySync());
		var predictions_tensor = await model.predict([predict_data], [1, 1]);
		predictions = predictions_tensor.dataSync();

		dispose(predict_data);
		dispose(predictions_tensor);

		log(predictions);

		if(["classification"].includes(category) && labels.length == 0) {
			str = "[" + predictions.join(", ") + "]";
		} else {
			var show_green = $("#data_origin").val() != "csv";
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
					var this_str = label + ": " + probability + "\n";
					if(i == max_i && show_green) {
						str = str + "<b class='max_prediction'>" + this_str + "</b>";
					} else {
						str = str + this_str;
					}
					str += "<br>";
				}
			}
		}
		if(!dont_write_to_predict_tab) {
			$("#prediction").append(str);
		}
		$("#predict_error").html("").hide();
	} catch (e) {
		console.warn(e);
		$("#prediction").hide();
		$("#predict_error").html(e).show();
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

		hide_unused_layer_visualization_headers();

		if(!keep_show_after_training_hidden) {
			$(".show_after_training").show();
		}

		var example_predictions = $("#example_predictions");

		var dataset_category = $("#dataset_category").val();

		if($("#data_origin").val() == "default") {
			if(dataset_category == "image") {
				var dataset = $("#dataset").val();
				var full_dir = "traindata/" + dataset_category + "/" + dataset + "/example/";
				$.ajax({
					url: 'traindata/index.php?dataset_category=' + dataset_category + '&dataset=' + dataset + '&examples=1',
					success: async function (x) { 
						if(x) {
							var this_examples_hash = await md5(JSON.stringify(x["example"]));
							if(this_examples_hash != predict_examples_hash) {
								example_predictions.html("");
								predict_examples_hash = this_examples_hash;
							}
							var examples = x["example"];
							if(examples) {
								var str = "";
								for (var i = 0; i < examples.length; i++) {
									var img_url = full_dir + "/" + examples[i];
									var img_elem = $("img[src$='" + img_url + "']");
									if(img_elem.length) {
										predict_demo(img_elem[0], i);
									} else {
										str += "<hr><img src='" + img_url + "' class='example_images' onload='predict_demo(this, " + i + ")' /><br><div class='predict_demo_result'></div>";
									}
								}

								if(str) {
									example_predictions.html(str);
								}
							}
						}
					}
				});
			} else if (dataset_category == "classification") {
				example_predictions.html("");
				var example_url = "traindata/" + dataset_category + "/" + $("#model_dataset").val() + "/examples.json"
				var example_predict_data = await get_cached_json(example_url)
				var count = 0;

				if(typeof(example_predict_data) == "object" && example_predict_data.length) {
					tf.tidy(() => {
						for (var i = 0; i < example_predict_data.length; i++) {
							var tensor = tf.tensor(example_predict_data[i]);
							if(tensor_shape_matches_model(tensor)) {
								example_predictions.append(JSON.stringify(example_predict_data[i]) + " = " + JSON.stringify(model.predict(tensor).arraySync()) + "<br>");
								count++;
							}
						}
					});
				}

				if(count) {
					$("#show_when_predicting,#example_predictions").show();
				} else {
					$("#show_when_predicting,#example_predictions").hide();
				}
			}
		}

		if(!dont_go_to_tab) {
			if($("#jump_to_predict_tab").is(":checked")) {
				$('a[href="#predict_tab"]').click();
			}
		}
	} else {
		log("No model given for show_prediction");
	}
}

async function predict_webcam () {
	if(!cam) {
		return;
	}

	tf.engine().startScope();

	var predict_data = await cam.capture();
	predict_data = predict_data.resizeNearestNeighbor([width, height]).toFloat().expandDims()

	var divide_by = parseFloat($("#divide_by").val());

	if(divide_by != 1) {
		predict_data = tf.divNoNan(predict_data, divide_by);
	}

	var predictions_tensor = await model.predict([predict_data], [1, 1]);
	var predictions = predictions_tensor.dataSync();

	var category = _get_category();

	var webcam_prediction = $("#webcam_prediction");
	webcam_prediction.html("").show();

	if(["classification"].includes(category) && labels.length == 0) {
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

			log(cam_config);
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
	if(!input_shape_is_image()) {
		return;
	}
	tf.tidy(() => {
		var predictions = model.predict(tf.image.resizeBilinear(tf.browser.fromPixels(document.getElementById("sketcher")), [width, height]).expandDims()).arraySync();

		var handdrawn_predictions = $("#handdrawn_predictions");
		handdrawn_predictions.html("");

		var html = "<pre>";

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
					html += "<b style='color: green'>" + label + ": " + predictions[0][i] + "</b>\n";
				} else {
					html += label + ": " + predictions[0][i] + "\n";
				}
			} else {
				if(predictions[0][i] == max) {
					html += "<b style='color: green'>" + predictions[0][i] + "</b>\n";
				} else {
					html += predictions[0][i] + "<br>\n";
				}
			}
		}
		html += "</pre>";

		handdrawn_predictions.html(html);
	});
}
