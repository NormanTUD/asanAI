"use strict";

function print_tensor_to_string (tensor) {
	var logBackup = console.log;
	var logMessages = [];

	console.log = function() {
		logMessages.push.apply(logMessages, arguments);
	};

	tensor.print(1);

	var return_str = logMessages.join("\n");

	console.log = logBackup;

	return return_str;
}

async function train_neural_network () {
	if(model.isTraining || model.model.isTraining) {
		model.stopTraining = true;
		model.model.stopTraining = true;
		$("#train_neural_network_button").html("Start training");
		enable_everything();
	} else {
		if(!loaded_tfvis) {
			var script = document.createElement("script");
			script.src = "tf/tfjs-vis.js";
			script.type = "text/javascript";
			script.onload = function () {
				loaded_tfvis = 1;
				load_tfvis();
			};
			document.getElementsByTagName("head")[0].appendChild(script);
		} else {
			load_tfvis();
		}

		$("#train_neural_network_button").html("Stop training");
		favicon_spinner();
		disable_everything();
		$(".call_counter").html("0");
		$(".reset_before_train_network").html("");
		$("#percentage").html("");
		$("#percentage").show();
		$(".input_image_grid").html("");
		$(".output_image_grid").html("");
		max_number_words = 0;
		max_number_characters = 0;
		reset_photo_gallery();
		reset_summary();
		reset_history();

		let xs_and_ys = await get_xs_and_ys();
		$("#percentage").html("");
		$("#percentage").hide();

		var result = await run_neural_network(xs_and_ys["x"], xs_and_ys["y"], xs_and_ys["keys"]);

		$("#train_neural_network_button").html("Start training");
		enable_everything();

		return result;
	}
}

function load_tfvis () {
	$("#tfvis_tab_layer").html("");
	for (var i = 0; i < get_numberoflayers(); i++) {
		$("#tfvis_tab_layer").append('<div id="tf_vis_layer_' + i + '"></div>');
		tfvis.show.layer($("#tf_vis_layer_" + i)[0], model.getLayer(null, i));
	}
}

function create_model () {
	var new_current_status_hash = get_current_status_hash();
	if(new_current_status_hash == current_status_hash) {
		return model;
	}

	current_status_hash = new_current_status_hash;

	$(".warning_container").hide();

	if(disable_show_python_and_create_model) {
		return;
	}
	if(model !== null) {
		tf.dispose(model);
		model = null;
	}
	//header("create_model()");

	model = tf.sequential();

	var first_layer = true;

	for (var i = 0; i < get_numberoflayers(); i++) {
		var layer_type = $($($(".layer_setting")[i]).find(".layer_type")[0]);
		var type = $(layer_type).val();
		if(typeof(type) !== "undefined") {
			var data = {
				"name": type + "_" + (i + 1)
			};

			if(i == 0 || first_layer) {
				data["inputShape"] = get_input_shape();
			}

			for (var j = 0; j < layer_options[type]["options"].length; j++) {
				var option_name = layer_options[type]["options"][j];
				if(option_name == "pool_size") {
					data[get_js_name(option_name)] = [parseInt(get_item_value(i, "pool_size_x")), parseInt(get_item_value(i, "pool_size_y"))];
				} else if(option_name == "kernel_size") {
					data[get_js_name(option_name)] = [parseInt(get_item_value(i, "kernel_size_x")), parseInt(get_item_value(i, "kernel_size_y"))];
				} else if(option_name == "kernel_size_1d") {
					data[get_js_name("kernel_size")] = parseInt(get_item_value(i, "kernel_size"));
				} else if(option_name == "strides_1d") {
					data[get_js_name("strides")] = parseInt(get_item_value(i, "strides"));
				} else if(option_name == "trainable") {
					data[get_js_name("trainable")] = get_item_value(i, "trainable");
				} else if(option_name == "use_bias") {
					data[get_js_name("useBias")] = get_item_value(i, "use_bias");
				} else if(option_name == "pool_size_1d") {
					data[get_js_name("pool_size")] = parseInt(get_item_value(i, "pool_size"));
				} else if(option_name == "strides") {
					data[get_js_name(option_name)] = [parseInt(get_item_value(i, "strides_x")), parseInt(get_item_value(i, "strides_y"))];
				} else if(option_name == "size") {
					data[get_js_name(option_name)] = eval("[" + get_item_value(i, "size") + "]");
				} else if(option_name == "dilation_rate") {
					data[get_js_name(option_name)] = eval("[" + get_item_value(i, "dilation_rate") + "]");
				} else if(option_name == "dropout_rate") {
					data[get_js_name(option_name)] = parseInt(get_item_value(i, "dropout_rate")) / 100;
				} else {
					var elem = $($($(".layer_setting")[i]).find("." + option_name)[0]);
					var value = $(elem).val();

					if($(elem).is(":checkbox")) {
						data[get_js_name(option_name)] = value == "on" ? true : false;
					} else {
						if(value != "") {
							data[get_js_name(option_name)] = isNumeric(value) ? parseInt(value) : value;
						}
					}
				}
			}

			try {
				model.add(tf.layers[type](data));
				first_layer = false;
			} catch (e) {
				//console.warn("Failed to add layer type ", type, ": ", e);
				//header("DATA:");
				//console.log(data);
				$($(".warning_container")[i]).show()
				$($(".warning_layer")[i]).html(e)
			}

			traindebug("tf.layers." + type + "(", data, ")");
		}
	}

	$("#datalayers").html("");
	$("#layerinfoscontainer").hide();

	$(".layer_data").hide()
	$(".layer_data").html("")

	for (var i = 0; i < model.layers.length; i++) {
		var code = "model.layers[" + i + "].original_apply = model.layers[" + i + "].apply;" +
			"model.layers[" + i +"].apply = function (inputs, kwargs) {";
				if($("#show_progress_through_layers").is(":checked")) {
					code += "(function(){ setTimeout(function(){ fcnn_fill_layer(" + i + "); },1000); })();";
				}

				code += "var z = model.layers[" + i + "].original_apply(inputs, kwargs);" +
				"$($('.call_counter')[" + i + "]).html(parseInt($($('.call_counter')[" + i + "]).html()) + 1);" +
				"return z;" +
			"}";

		eval(code);

		if($("#debug_checkbox").is(":checked")) {
			$("#layerinfoscontainer").show();
			eval("model.layers[" + i + "].original_apply = model.layers[" + i + "].apply;" +
				"model.layers[" + i +"].apply = function (inputs, kwargs) {" +
					"var z = model.layers[" + i + "].original_apply(inputs, kwargs);" +
					"$(\"#datalayers\").append(\"============> Layer " + i + " (" + model.layers[i].name + ")\\n\");" +
					"if(" + i + " == 0) {" +
						"$(\"#datalayers\").append(\"Input layer " + i + ":\\n\");" +
						"$(\"#datalayers\").append(print_tensor_to_string(inputs[0]) + \"\\n\");" +
					"}" +
					"$(\"#datalayers\").append(\"Output layer " + i + ":\\n\");" +
					"$(\"#datalayers\").append(print_tensor_to_string(z) + \"\\n\");" +
					"return z;" +
				"}"
			);
		}

		if ($("#show_layer_data").is(":checked")) {
			$(".layer_data").show();
			$(".copy_layer_data_button").show();
			var code = "model.layers[" + i + "].original_apply_real = model.layers[" + i + "].apply;\n" +
				"model.layers[" + i + "].apply = function (inputs, kwargs) {\n" +
					"var bias_string = '';\n" +

					"if ('bias' in this) {\n" +
						"bias_string = \"\\n\" + 'Bias: ' + JSON.stringify(this['bias']['val'].arraySync(), null, \"\\t\") + \"\\n\";\n" +
					"}\n" +

					"var weights_string = '';\n" +
					"if ('weights' in this) {\n" +
						"for (var j = 0; j < this['weights'].length; j++) {\n" +
							"if (j in this['weights'] && 'val' in this['weights'][j]) {\n" +
								"weights_string = weights_string + \"\\n\" + 'Weights ' + j + ': ' + JSON.stringify(this['weights'][j]['val'].arraySync(), null, \"\\t\");\n" +
							"}\n" +
						"}\n" +
					"}\n" +

					"var applied = model.layers[" + i + "].original_apply_real(inputs, kwargs);\n" +
					"var output_data = applied.arraySync()[0];\n" +
					
					"var input_data = inputs[0].arraySync()[0];\n" +

					"if (!$($(\".layer_data\")[" + i + "]).html()) {\n" +
						"var html = '';\n" +
						"if(" + i + " == 0) {\n" +
							"html = html + \"Input layer " + i + ": [\" + get_dim(input_data) + \"]\\n\";\n" +
							"html = html + JSON.stringify(input_data, null, \"\\t\") + \"\\n\";\n" +
						"} else {\n" +
							"html = html + \"Input layer " + i + ": [\" + get_dim(input_data) + \"]\\n\"\n" +
						"}\n" +

						"if(weights_string) {\n" +
							"html = html + weights_string;\n" +
						"}\n" +

						"if(bias_string) {\n" +
							"html = html + bias_string;\n" +
						"}\n" +

						"draw_images_if_possible(" + i + ", input_data, output_data);\n" +

						"$('#layer_visualizations_tab_label').show();\n" +
						"html = html + \"Output layer " + i + ": [\" + get_dim(output_data) + \"]\\n\"\n" +
						"html = html + JSON.stringify(output_data, null, \"\\t\");\n" +
						"$($(\".layer_data\")[" + i + "]).append(html);\n" +
					"}\n" +
					"return applied;\n" +
				"}\n";
			eval(code);
		}
	}

	return model;
}

function get_model_data () {
	var loss = $("#loss").val();
	var optimizer_type = $("#optimizer").val();
	var metric_type = $("#metric").val();

	var model_data = {
		loss: loss,
		optimizer: optimizer_type,
		metrics: metric_type
	};

	var optimizer_data_names = model_data_structure[optimizer_type];

	for (var i = 0; i < optimizer_data_names.length; i++) {
		model_data[optimizer_data_names[i]] = $("#" + optimizer_data_names[i] + "_" + optimizer_type).val();
	}

	return model_data;
}

function get_fit_data (show_tfvis) {
	var epochs = get_epochs();
	var batchSize = get_batchSize();
	var validationSplit = parseInt($("#validationSplit").val()) / 100;

	var callbacks = {};

	if(show_tfvis) {
		callbacks = tfvis.show.fitCallbacks(
			$("#tfvis_tab_training_performance_graph")[0],
			["loss", "acc", "val_loss", "val_acc" ],
			{ height: 200, callbacks: ["onBatchEnd", "onEpochEnd"] }
		);

		callbacks["onTrainBegin"] = function () {
			$(".training_performance_tabs").show();
			if($("#jump_to_training_tab").is(":checked")) {
				//$('#training_performance_tab_label').click();
				//$('a[href="#training_data_tab"]').click();
			}
		};

		callbacks["onTrainEnd"] = function () {
			restart_fcnn();
			favicon_default();

			show_prediction();
		}
	}

	var fit_data = {
		validationSplit: validationSplit,
		batchSize: batchSize,
		epochs: epochs,
		shuffle: true,
		verbose: 0,
		callbacks: callbacks
	};

	traindebug("fit_data:");
	traindebug(fit_data);

	return fit_data;
}

function show_info_pre_run () {
	write_model_model_summary(model);
}

function show_info_after_run (h) {
	traindebug("Showing tfvis/history/memory");
	tfvis.show.history($("#tfvis_tab_history_graphs")[0], h, Object.keys(h["history"]));
	write_history(h);
	print_memory();
}

function compile_model () {
	reset_summary();
	if(get_numberoflayers() >= 1) {
		try {
			model = create_model();

			model.compile(get_model_data());

			write_model_model_summary(model);

			$("#outputShape").val(JSON.stringify(model.outputShape));
		} catch (e) {
			enable_everything();
			console.warn("ERROR: " + e + " Resetting model");
			console.trace();
		}

	} else {
		console.warn("Need at least 1 layer. Not there yet...");
	}
}

async function run_neural_network (x, y, keys) {
	traindebug("x: ", x);
	traindebug("y: ", y);

	clean_gui();
	traindebug("x-shape: ", x.shape);

	var inputShape = set_input_shape("[" + x.shape.slice(1).join(", ") + "]");

	traindebug("inputShape: ", inputShape);

	$("#tfvis_tab_label").show();

	if($("#jump_to_training_tab").is(":checked")) {
		$('a[href="#tfvis_tab"]').click();
		$('a[href="#tfvis_tab_training_performance"]').click();
	}

	try {
		create_model();

		try {
			compile_model(0);

			try {
				show_info_pre_run();

				h = await model.fit(x, y, get_fit_data(1));

				$("#predictcontainer").show();
				$("#predict_error").hide();
				$("#predict_error").html("");

				show_info_after_run(h);

				return {"h": h, "model": model};
			} catch (e) {
				enable_everything();
				$("#errorcontainer").show();
				$("#error").html(e);
				explain_error_msg();
				header_error("ERROR:");
				header_error(e);
				console.trace();
				favicon_default();
			}
		} catch (e) {
			alert("Compiling model failed: " + e);
		}
	} catch (e) {
		alert("Creating model failed: " + e);
	}
}
