"use strict";

function log (...args) {
	console.log(args);
}

function toc () {
	var toc = "";
	var level = 0;

	document.getElementById("contents").innerHTML =
		document.getElementById("contents").innerHTML.replace(
			/<h([\d])>([^<]+)<\/h([\d])>/gi,
			function (str, openLevel, titleText, closeLevel) {
				if (openLevel != closeLevel) {
					return str;
				}

				if (openLevel > level) {
					toc += (new Array(openLevel - level + 1)).join("<ul>");
				} else if (openLevel < level) {
					toc += (new Array(level - openLevel + 1)).join("</ul>");
				}

				level = parseInt(openLevel);

				var anchor = titleText.replace(/ /g, "_");
				toc += "<li><a href=\"#" + anchor + "\">" + titleText
					+ "</a></li>";

				return "<h" + openLevel + "><a name=\"" + anchor + "\">"
					+ titleText + "</a></h" + closeLevel + ">";
			}
		);

	if (level) {
		toc += (new Array(level + 1)).join("</ul>");
	}

	document.getElementById("toc").innerHTML += toc;
};

async function get_network_type_result_by_array (layer_type, array, config, expand_dims=1) {
	var tensor = tf.tensor(array);
	config["inputShape"] = tensor.shape;
	var layer = null;
	var reg = ["bias", "kernel"];
	for (var i = 0; i < reg.length; i++) {
		var type = reg[i];
		if(Object.keys(config).includes(type + "Regularizer")) {
			if(config[type + "Regularizer"].hasL1 && config[type + "Regularizer"].hasL2) {
				var cfg = {"className": "L1L2", config: { "l1": config[type + "Regularizer"]["l1"], "l2": config[type + "Regularizer"]["l2"], hasL1: true, hasL2: true }};
				config[type + "Regularizer"] = cfg;
			} else if(config[type + "Regularizer"].hasL1 && !config[type + "Regularizer"].hasL2) {
				var cfg = {"className": "L1", config: { "l1": config[type + "Regularizer"]["l1"], hasL1: true, hasL2: false }};
				config[type + "Regularizer"] = cfg;
			} else if(!config[type + "Regularizer"].hasL1 && config[type + "Regularizer"].hasL2) {
				var cfg = {"className": "L1L2", config: { "l1": 0.01, "l2": config[type + "Regularizer"]["l2"], hasL1: false, hasL2: true }};
				config[type + "Regularizer"] = cfg;
			} else {
				delete config[type + "Regularizer"];
			}
		}
	}

	eval("layer = tf.layers." + layer_type + "(config)");

	if(expand_dims) {
		tensor = tensor.expandDims();
	}

	log("image tensor before applying:", tensor.arraySync());
	var res = await layer.apply(tensor).arraySync();
	log("applied:", res);

	return [res, layer];
}

// await get_network_type_result_by_array("dense", [1, 2, 3], {units: 1, kernelInitializer: "ones" })

// simulate_layer_on_image($("#tftestimg"), $("#tftestcanvas"), "conv2d", {filters: 1, kernelSize: [2, 2], kernelInitializer: "randomUniform", activation: "relu", strides: [1, 1] })
async function simulate_layer_on_image(img_element, internal_canvas_div, out_canvas_div, layer_type, config) {
	var this_layer_options = layer_options[layer_type]["options"];

	var general_options_keys = Object.keys(general_options);
	for (var i = 0; i < this_layer_options.length; i++) {
		var nr = 0;
		var layer_option = this_layer_options[i];

		if(!["trainable", "dtype", "visualize"].includes(layer_option)) {
			if(layer_option.endsWith("regularizer")) {
				var selecter = "<select class='gui_option " + python_names_to_js_names[layer_option] + "'>";
				var regularizer_keys = Object.keys(regularizer_options);
				for (var k = 0; k < regularizer_keys.length; k++) {
					var checked = "";

					if(Object.keys(config).includes(python_names_to_js_names[layer_option])) {
						var cfg_itm = config[python_names_to_js_names[layer_option]];
						if(cfg_itm.hasL1 && cfg_itm.hasL2 && regularizer_keys[k] == "l1l2") {
							checked = "selected";
						} else if(cfg_itm.hasL1 && !cfg_itm.hasL2 && regularizer_keys[k] == "l1") {
							checked = "selected";
						} else if(!cfg_itm.hasL1 && cfg_itm.hasL2 && regularizer_keys[k] == "l2") {
							checked = "selected";
						}
					}

					selecter += "<option " + checked + " value='" + regularizer_keys[k] + "'>" + regularizer_keys[k] + "</option>";
				}
				selecter += "</select>";

				$("#layer_gui").html($("#layer_gui").html() + "<tr><td>" + python_names_to_js_names[layer_option] + "</td><td>" + selecter + "</td></tr>")
			} else if(layer_option.endsWith("kernel_size")) {
				$("#layer_gui").html($("#layer_gui").html() + "<tr><td>" + layer_option + "</td><td><input class='gui_option " + python_names_to_js_names[layer_option] + "' type='text' placeholder='3,3' value='" + config.kernelSize.join(',') + "' /></td></tr>")
			} else if(layer_option.endsWith("dilation_rate")) {
				$("#layer_gui").html($("#layer_gui").html() + "<tr><td>" + layer_option + "</td><td><input class='gui_option " + python_names_to_js_names[layer_option] + "' type='text' placeholder='1,1' value='" + config.dilationRate.join(',') + "' /></td></tr>")
			} else if(layer_option.endsWith("strides")) {
				$("#layer_gui").html($("#layer_gui").html() + "<tr><td>" + layer_option + "</td><td><input class='gui_option " + python_names_to_js_names[layer_option] + "' type='text' placeholder='1,1' value='" + config.strides.join(',') + "' /></td></tr>")
			} else if(layer_option.endsWith("filters")) {
				$("#layer_gui").html($("#layer_gui").html() + "<tr><td>" + layer_option + "</td><td><input class='gui_option " + python_names_to_js_names[layer_option] + "' type='number' min=0 step=1 value='" + config.filters + "' /></td></tr>")
			} else if(layer_option.endsWith("use_bias")) {
				$("#layer_gui").html($("#layer_gui").html() + "<tr><td>" + python_names_to_js_names[layer_option] + "</td><td><input class='gui_option " + python_names_to_js_names[layer_option] + "' type='checkbox' " + (config.useBias ? 'checked' : '') + " /></td></tr>")
			} else if(layer_option.endsWith("activation")) {
				var selecter = "<select class='gui_option " + python_names_to_js_names[layer_option] + ">";
				var activation_keys = Object.keys(activations);
				for (var k = 0; k < activation_keys.length; k++) {
					var checked = "";
					if(config[layer_option] == activation_keys[k]) {
						checked = "selected";
					}
					selecter += "<option " + checked + " value='" + activation_keys[k] + "'>" + activation_keys[k] + "</option>";
				}
				selecter += "</select>";

				$("#layer_gui").html($("#layer_gui").html() + "<tr><td>" + layer_option + "</td><td>" + selecter + "</td></tr>")
			} else if(layer_option.endsWith("padding")) {
				var selecter = "<select class='gui_option " + python_names_to_js_names[layer_option] + ">";
				var padding_keys = Object.keys(padding_options);
				for (var k = 0; k < padding_keys.length; k++) {
					var checked = "";

					if(config.padding == padding_keys[k]) {
						checked = "selected";
					}

					selecter += "<option " + checked + " value='" + padding_keys[k] + "'>" + padding_keys[k] + "</option>";
				}
				selecter += "</select>";

				$("#layer_gui").html($("#layer_gui").html() + "<tr><td>" + layer_option + "</td><td>" + selecter + "</td></tr>")
			} else if(layer_option.endsWith("initializer")) {
				var selecter = "<select class='gui_option " + python_names_to_js_names[layer_option] + ">";
				var initializer_keys = Object.keys(initializer_options);
				for (var k = 0; k < initializer_keys.length; k++) {
					var checked = "";

					//log(config[python_names_to_js_names[layer_option]], initializer_keys[k]);

					if(config[python_names_to_js_names[layer_option]] == initializer_keys[k]) {
						checked = "selected";
					}

					selecter += "<option " + checked + " value='" + initializer_keys[k] + "'>" + initializer_keys[k] + "</option>";
				}
				selecter += "</select>";

				$("#layer_gui").html($("#layer_gui").html() + "<tr><td>" + python_names_to_js_names[layer_option] + "</td><td>" + selecter + "</td></tr>")
			} else {
				$("#layer_gui").html($("#layer_gui").html() + "<tr><td>" + python_names_to_js_names[layer_option] + "</td><td>b</td></tr>")
			}
		}
	}

	tf.engine().startScope();
	if(typeof(img_element) == "object") {
		img_element = img_element[0];
	}

	var img = tf.browser.fromPixels(img_element); 
	img = img.div(255);

	var [result, layer] = await get_network_type_result_by_array(layer_type, img.arraySync(), config, 1);
	log("layer:", layer);

	var tensor = tf.tensor(result);
	log("tensor-shape:", tensor.shape);
	log("tensor:");

	tensor = tensor.transpose([3, 1, 2, 0]);

	$(internal_canvas_div).html("");
	$(out_canvas_div).html("");

	var layer_kernel_tensor = layer.kernel.val;
	layer_kernel_tensor = layer_kernel_tensor.transpose([3, 2, 1, 0]);
	var layer_kernel = layer_kernel_tensor.arraySync();

	log("kernel-shape:", layer_kernel_tensor.shape);
	log("kernel:", layer_kernel);

	for (var filter_id = 0; filter_id < layer_kernel_tensor.shape[0]; filter_id++) {
		for (var channel_id = 0; channel_id < layer_kernel_tensor.shape[1]; channel_id++) {
			var id = uuidv4()
			$("<canvas class='kernel_images' id='" + id + "'></canvas>").appendTo(internal_canvas_div);
			draw_grid($("#" + id)[0], kernel_pixel_size, layer_kernel[filter_id][channel_id], 1, 1);
		}
	}

	for (var i = 0; i < tensor.shape[0]; i++) {
		var id = uuidv4()
		$("<canvas class='out_images' id='" + id + "'></canvas>").appendTo(out_canvas_div);
		draw_grid($("#" + id)[0], 1, tensor.arraySync()[i], 1, 1, "", "");
		//tf.browser.toPixels(tensor, canvas);
	}

	tf.engine().endScope();
	return result;
}

toc();
