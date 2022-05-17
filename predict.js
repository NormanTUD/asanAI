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
});

let predict_demo = async function (item, nr) {
	tf.engine().startScope();

	try {
		if(labels.length == 0) {
			await get_label_data();
		}


		let tensor_img = tf.browser.fromPixels(item).resizeNearestNeighbor([width, height]).toFloat().expandDims();
		if($("#divide_by").val() != 1) {
			var new_tensor_img = tf.div(tensor_img, parseFloat($("#divide_by").val()));
			dispose(tensor_img);
			tensor_img = new_tensor_img;
		}

		var predictions_tensor = await model.predict([tensor_img], [1, 1]);
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
				var label = labels[i];
				var probability = predictions[i];
				var str = label + ": " + probability + "<br>\n";
				if(i == max_i) {
					str = "<b style='color: green'>" + str + "</b>";
				}
				desc.append(str);
			}
		}
		$("#predict_error").hide();
		$("#predict_error").html("");
	} catch (e) {
		console.warn(e);
		$("#prediction").hide();
		$("#predict_error").show();
		$("#predict_error").html(e);
	}

	hide_unused_layer_visualization_headers();
	tf.engine().endScope();
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

	$("#prediction").show();
	$("#prediction").html("");
	$("#predict_error").hide();
	$("#predict_error").html("");
	var predictions = [];

	/*
	if(!model) {
		model = await train_neural_network();
	}
	*/

	var str = "";

	tf.engine().startScope();
	try {
		var predict_data = null;

		if(category == "image") {
			predict_data = tf.browser.fromPixels(item).resizeNearestNeighbor([width, height]).toFloat().expandDims();
		} else if(["classification", "own"].includes(category)) {
			predict_data = tf.tensor(eval(item));
		} else {
			log("Invalid category for prediction: " + category);
		}

		var divide_by = parseFloat($("#divide_by").val());

		if(divide_by != 1) {
			predict_data = tf.div(predict_data, divide_by);
		}

		var predictions_tensor = await model.predict([predict_data], [1, 1]);
		predictions = predictions_tensor.dataSync();

		dispose(predict_data);
		dispose(predictions_tensor);

		log(predictions);

		if(["classification"].includes(category) && labels.length == 0) {
			str = "[" + predictions.join(", ") + "]";
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
					var label = labels[i];
					var probability = predictions[i];
					var this_str = label + ": " + probability + "\n";
					if(i == max_i) {
						str = str + "<b class='max_prediction'>" + this_str + "</b>";
					} else {
						str = str + this_str;
					}
				}
			}
		}
		if(!dont_write_to_predict_tab) {
			$("#prediction").append(str);
		}
		$("#predict_error").hide();
		$("#predict_error").html("");
	} catch (e) {
		console.warn(e);
		$("#prediction").hide();
		$("#predict_error").show();
		$("#predict_error").html(e);
	}
	tf.engine().endScope();

	return str;
}

function show_prediction (keep_show_after_training_hidden, dont_go_to_tab) {
	if(model) {
		$(".show_when_predicting").show();

		hide_unused_layer_visualization_headers();

		if(!keep_show_after_training_hidden) {
			$(".show_after_training").show();
		}

		$("#example_predictions").html("");

		if($("#data_origin").val() == "default") {
			if($("#dataset_category").val() == "image") {
				var dataset = $("#dataset").val();
				var dataset_category = $("#dataset_category").val();
				var full_dir = "traindata/" + dataset_category + "/" + dataset + "/example/";
				$.ajax({
					url: 'traindata/index.php?dataset_category=' + dataset_category + '&dataset=' + dataset + '&examples=1',
					success: function (x) { 
						if(x) {
							var examples = x["example"];
							if(examples) {
								for (var i = 0; i < examples.length; i++) {
									$("#example_predictions").append("<img src='" + full_dir + "/" + examples[i] + "' onload='predict_demo(this, " + i + ")' /><br><div class='predict_demo_result'></div>");
								}
							}
						}
					}
				});
			} else if ($("#dataset_category").val() == "classification") {
				tf.tidy(() => {
					$("#example_predictions").append("[0, 0] = " + model.predict(tf.tensor([[0, 0]])).dataSync() + "<br>");
					$("#example_predictions").append("[0, 1] = " + model.predict(tf.tensor([[0, 1]])).dataSync() + "<br>");
					$("#example_predictions").append("[1, 0] = " + model.predict(tf.tensor([[1, 0]])).dataSync() + "<br>");
					$("#example_predictions").append("[1, 1] = " + model.predict(tf.tensor([[1, 1]])).dataSync() + "<br>");
				});
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

function _show_webcam () {
	if($("#dataset_category").val() == "image") {
		return true;
	}

	if($("#data_origin").val() == "own") {
		if($("#data_type").val() == "image") {
			return true;
		}
	}

	return false;
}

async function predict_webcam () {
	tf.engine().startScope();
	var predict_data = await cam.capture();
	predict_data = predict_data.resizeNearestNeighbor([width, height]).toFloat().expandDims()

	var divide_by = parseFloat($("#divide_by").val());

	if(divide_by != 1) {
		predict_data = tf.div(predict_data, divide_by);
	}

	var predictions_tensor = await model.predict([predict_data], [1, 1]);
	var predictions = predictions_tensor.dataSync();


	var category = _get_category();

	$("#webcam_prediction").html("").show();

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
				var label = labels[i];
				var probability = predictions[i];
				var str = label + ": " + probability + "\n";
				if(i == max_i) {
					str = "<b>" + str + "</b>";
				}
				$("#webcam_prediction").append(str);
			}
		}
	}

	tf.engine().endScope();
}

async function show_webcam () {
	if(_show_webcam()) {
		$("#show_webcam_button").html("Stop webcam");
		if(cam) {
			stop_webcam();
		} else {
			$("#webcam").hide().html("");
			var videoElement = document.createElement('video');
			videoElement.width = 256;
			videoElement.height = 256;
			$("#webcam").show().append(videoElement);

			$("#webcam").append("<br><button onclick='predict_webcam()'>&#x1F4F8; Predict webcam image</button>");
			cam = await tf.data.webcam(videoElement);
		}
	} else {
		$("#webcam").hide().html("");
		if(cam) {
			cam.stop();
		}
	}
}
