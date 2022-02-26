"use strict";

async function get_label_data () {
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
	enable_everything();
	try {
		if(labels.length == 0) {
			await get_label_data();
		}
		let tensorImg = tf.browser.fromPixels(item).resizeNearestNeighbor([width, height]).toFloat().expandDims();
		if($("#divide_by").val() != 1) {
			tensorImg = tf.div(tensorImg, parseFloat($("#divide_by").val()));
		}

		var predictions = await model.predict([tensorImg], [1, 1]).dataSync();

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
	} catch (e) {
		console.warn(e);
		$("#prediction").hide();
		$("#predict_error").show();
		$("#predict_error").html(e);
	}

	hide_unused_layer_visualization_headers();
}

async function predict (item) {
	enable_everything();
	var category = $("#dataset_category").val();
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

	try {
		if(category == "image") {
			let tensorImg = tf.browser.fromPixels(item).resizeNearestNeighbor([width, height]).toFloat().expandDims();
			if($("#divide_by").val() != 1) {
				tensorImg = tf.div(tensorImg, parseFloat($("#divide_by").val()));
			}

			predictions = await model.predict([tensorImg], [1, 1]).dataSync();
			log(predictions);
		} else if(category == "own") {
			var own_data = tf.tensor(eval(item));
			predictions = await model.predict([own_data], [1, 1]).dataSync();
			log(predictions);
		} else {
			alert("UNKNOWN CATEGORY: ", category);
		}

		if(category == "own") {
			var str = "[" + predictions.join(", ") + "]";
			$("#prediction").append(str);
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
					$("#prediction").append(str);
				}
			}
		}
	} catch (e) {
		console.warn(e);
		$("#prediction").hide();
		$("#predict_error").show();
		$("#predict_error").html(e);
	}
}

function show_prediction (keep_show_after_training_hidden) {
	hide_unused_layer_visualization_headers();

	if(!keep_show_after_training_hidden) {
		$(".show_after_training").show();
	}

	$("#example_predictions").html("");
	$("#own_files").show();

	if($("#dataset_category").val() == "image") {
		var full_dir = "traindata/" + $("#dataset_category").val() + "/" + $("#dataset").val() + "/example/";
		$.ajax({
			url: 'traindata/index.php?dataset=' + $("#dataset").val() + '&dataset_category=' + $("#dataset_category").val() + "&examples=1",
			success: function (x) { 
				var examples = x["example"];
				for (var i = 0; i < examples.length; i++) {
					$("#example_predictions").append("<img src='" + full_dir + "/" + examples[i] + "' onload='predict_demo(this, " + i + ")' /><br><div class='predict_demo_result'></div>");
				}
			}
		});
	} else if ($("#dataset_category").val() == "logic") {
		$("#own_files").hide();
		$("#example_predictions").append("[0, 0] = " + model.predict(tf.tensor([[0, 0]])).dataSync() + "<br>");
		$("#example_predictions").append("[0, 1] = " + model.predict(tf.tensor([[0, 1]])).dataSync() + "<br>");
		$("#example_predictions").append("[1, 0] = " + model.predict(tf.tensor([[1, 0]])).dataSync() + "<br>");
		$("#example_predictions").append("[1, 1] = " + model.predict(tf.tensor([[1, 1]])).dataSync() + "<br>");
	}

	if($("#jump_to_predict_tab").is(":checked")) {
		$('a[href="#predict_tab"]').click();
	}
}
