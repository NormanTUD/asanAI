"use strict";

async function get_label_data () {
	if($("#data_origin").val() == "own") {
	} else {
		let imageData = await get_image_data(1);

		labels = [];

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
	tf.engine().startScope();

	try {
		if(labels.length == 0) {
			await get_label_data();
		}


		let tensor_img = tf.browser.fromPixels(item).resizeNearestNeighbor([width, height]).toFloat().expandDims();
		if($("#divide_by").val() != 1) {
			var new_tensor_img = tf.divNoNan(tensor_img, parseFloat($("#divide_by").val()));
			dispose(tensor_img);
			tensor_img = new_tensor_img;
		}

		if(!tensor_shape_matches_model(tensor_img)) {
			return;
		}

		if(model) {
			var show_green = ($("#data_origin").val() == "default" || ($("#data_origin").val() == "own" && $("#data_type").val() != "csv"));
			var predictions_tensor = await model.predict([tensor_img]);
			dispose(tensor_img);

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

				desc.html("");
				for (let i = 0; i < predictions.length; i++) {
					var label = labels[i % labels.length];
					var probability = predictions[i];
					var str = label + ": " + probability + "<br>\n";
					if(i == max_i && show_green) {
						str = "<b style='color: green'>" + str + "</b>";
					}
					desc.append(str);
				}
			}
			$("#predict_error").hide();
			$("#predict_error").html("");
		}
	} catch (e) {
		console.warn(e);
		$("#prediction").hide();
		$("#predict_error").show();
		$("#predict_error").html(e);
		$("#example_predictions").html("");
	}

	hide_unused_layer_visualization_headers();
	tf.engine().endScope();

	change_output_and_example_image_size();
}

function _get_category () {
	var category = $("#dataset_category").val();
	if($("#data_origin").val() != "default") {
		if($("#data_type").val() == "image") {
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

		if(category == "image" || (typeof(item) == "object" && $(item)[0].tagName == "IMG")) {
			predict_data = tf.browser.fromPixels(item).resizeNearestNeighbor([width, height]).toFloat().expandDims();
		} else if(["classification", "own"].includes(category)) {
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
		} else {
			log("Invalid category for prediction: " + category);
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
			var show_green = ($("#data_origin").val() == "default" || ($("#data_origin").val() == "own" && $("#data_type").val() != "csv"));
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
	if(model) {
		$(".show_when_predicting").show();

		hide_unused_layer_visualization_headers();

		if(!keep_show_after_training_hidden) {
			$(".show_after_training").show();
		}

		var example_predictions = $("#example_predictions");
		example_predictions.html("");

		var dataset_category = $("#dataset_category").val();

		if($("#data_origin").val() == "default") {
			if(dataset_category == "image") {
				var dataset = $("#dataset").val();
				var full_dir = "traindata/" + dataset_category + "/" + dataset + "/example/";
				$.ajax({
					url: 'traindata/index.php?dataset_category=' + dataset_category + '&dataset=' + dataset + '&examples=1',
					success: function (x) { 
						if(x) {
							var examples = x["example"];
							if(examples) {
								for (var i = 0; i < examples.length; i++) {
									example_predictions.append("<hr><img src='" + full_dir + "/" + examples[i] + "' class='example_images' onload='predict_demo(this, " + i + ")' /><br><div class='predict_demo_result'></div>");
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
				hide_annoying_tfjs_vis_overlays();
			}
		}
	}
}

async function predict_webcam () {
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
					str = "<b>" + str + "</b>";
				}
				webcam_prediction.append(str);
			}
		}
	}

	tf.engine().endScope();
}

async function show_webcam () {
	if(input_shape_is_image()) {
		$("#show_webcam_button").html("Stop webcam");
		if(cam) {
			stop_webcam();
		} else {
			var webcam = $("#webcam");
			webcam.hide().html("");
			var videoElement = document.createElement('video');
			videoElement.width = 256;
			videoElement.height = 256;
			webcam.show().append(videoElement);

			cam = await tf.data.webcam(videoElement);

			auto_predict_webcam_interval = setInterval(predict_webcam, 1000);

			//webcam.append("<br><button onclick='predict_webcam()'>&#x1F4F8; Predict webcam image</button>");
		}
	} else {
		$("#webcam").hide().html("");
		if(cam) {
			cam.stop();
		}

		clearInterval(auto_predict_webcam_interval);
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
