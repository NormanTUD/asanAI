"use strict";

var current_model = null;

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

				level = parse_int(openLevel);

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
}

async function get_network_type_result_by_array (layer_type, _array, config, expand_dims=1, uuid) {
	assert(typeof(layer_type) == "string", "Layer type must be string, is " + typeof(layer_type));

	var _tensor = tensor(_array);
	config["inputShape"] = _tensor.shape;
	var layer = null;
	var reg = ["bias", "kernel", "depthwise", "pointwise"];

	for (var reg_idx = 0; reg_idx < reg.length; reg_idx++) {
		var type = reg[reg_idx];
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

		if(Object.keys(config).includes(type + "Constraint")) {
			if(config[type + "Constraint"] == "") {
				delete config[type + "Constraint"];
			}
		}
	}

	var kwargs = {};

	if($("#" + uuid + "_is_training").length && $("#" + uuid + "_is_training").is(":checked")) {
		kwargs = {
			training: true
		};
	}

	try {
		eval("layer = tf.layers." + layer_type + "(config)");
		$("#" + uuid + "_error").html("");
	} catch (e) {
		$("#" + uuid + "_error").html(e);
		wrn(e);
		output_shape = input_shape;
	}

	var input_shape, output_shape;

	if(layer) {
		if(expand_dims) {
			_tensor = _tensor.expandDims();
		}

		var res;

		try {
			input_shape = _tensor.shape;
			var tensor_res = await layer.apply(_tensor, kwargs);
			res = array_sync(tensor_res);
			output_shape = tensor_res.shape;
			$("#" + uuid + "_error").html("");
		} catch (e) {
			void(0); log(" !!! Failed applying:", e);
			$("#" + uuid + "_error").html(e);
			res = [e, e];
			output_shape = input_shape;
		}
	} else {
		err("[get_network_type_result_by_array] layer is empty");
	}

	return [res, layer, input_shape, output_shape];
}

function get_element (item) {
	if($(item).is(":checkbox")) {
		return $(item).is(":checked");
	} else if ($(item).is("input")) {
		if(
			$(item).hasClass("poolSize") ||
			$(item).hasClass("kernelSize") ||
			$(item).hasClass("dilationRate") ||
			$(item).hasClass("kernelSize") ||
			$(item).hasClass("strides") ||
			$(item).hasClass("size")
		) {
			var str = $(item).val();
			var values = str.split(/\s*,\s*/);
			values = values.map(function (x) {
				if(looks_like_number(x)) {
					return parse_int(x);
				} else {
					err(`${x} does not look like a number (type: ${typeof(x)})`);
					return null;
				}
			});

			return values;
		} else if ($(item).hasClass("rate") || $(item).hasClass("stddev")) {
			return parse_float($(item).val());
		} else {
			var new_nr = $(item).val();
			if(looks_like_number(new_nr)) {
				return parse_int(new_nr);
			} else {
				err(`${new_nr} does not look like a number (type: ${typeof(new_nr)})`);
				console.log("item:", item);
				return null;
			}
		}
	} else if ($(item).is("select")) {
		return $(item).val();
	}
}

function add_table (layer_type, config, onchange, uuid) {
	var this_layer_options = layer_options[layer_type]["options"];

	var general_options_keys = Object.keys(general_options);
	for (var layer_idx = 0; layer_idx < this_layer_options.length; layer_idx++) {
		var nr = 0;
		var layer_option = this_layer_options[layer_idx];

		var on_change = "eval_base64(\"" + onchange + "\", \"" + uuid + "\")";

		if(!["trainable", "dtype", "visualize"].includes(layer_option)) {
			if(layer_option.endsWith("regularizer")) {
				var selecter = "<select onchange='" + on_change + "' class='gui_option " + python_names_to_js_names[layer_option] + "'>";
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

				$("#" + uuid + "_layer_gui").html($("#" + uuid + "_layer_gui").html() + "<tr><td>" + python_names_to_js_names[layer_option] + "</td><td>" + selecter + "</td></tr>");
			} else if(layer_option == "strides") {
				$("#" + uuid + "_layer_gui").html($("#" + uuid + "_layer_gui").html() + "<tr><td>" + layer_option + "</td><td><input onchange='" + on_change + "' class='gui_option " + python_names_to_js_names[layer_option] + "' type='text' placeholder='2,2' value='" + config.strides.join(",") + "' /></td></tr>");
			} else if(layer_option == "pool_size") {
				$("#" + uuid + "_layer_gui").html($("#" + uuid + "_layer_gui").html() + "<tr><td>" + python_names_to_js_names[layer_option] + "</td><td><input onchange='" + on_change + "' class='gui_option " + python_names_to_js_names[layer_option] + "' type='text' placeholder='2,2' value='" + config.poolSize.join(",") + "' /></td></tr>");
			} else if(layer_option == "size") {
				$("#" + uuid + "_layer_gui").html($("#" + uuid + "_layer_gui").html() + "<tr><td>" + layer_option + "</td><td><input onchange='" + on_change + "' class='gui_option " + python_names_to_js_names[layer_option] + "' type='text' placeholder='2,2' value='" + config.size.join(",") + "' /></td></tr>");
			} else if(layer_option.endsWith("kernel_size")) {
				$("#" + uuid + "_layer_gui").html($("#" + uuid + "_layer_gui").html() + "<tr><td>" + python_names_to_js_names[layer_option] + "</td><td><input onchange='" + on_change + "' class='gui_option " + python_names_to_js_names[layer_option] + "' type='text' placeholder='3,3' value='" + config.kernelSize.join(",") + "' /></td></tr>");
			} else if(layer_option.endsWith("dilation_rate")) {
				$("#" + uuid + "_layer_gui").html($("#" + uuid + "_layer_gui").html() + "<tr><td>" + python_names_to_js_names[layer_option] + "</td><td><input onchange='" + on_change + "' class='gui_option " + python_names_to_js_names[layer_option] + "' type='text' placeholder='1,1' value='" + config.dilationRate.join(",") + "' /></td></tr>");
			} else if(layer_option.endsWith("strides")) {
				$("#" + uuid + "_layer_gui").html($("#" + uuid + "_layer_gui").html() + "<tr><td>" + layer_option + "</td><td><input onchange='" + on_change + "' class='gui_option " + python_names_to_js_names[layer_option] + "' type='text' placeholder='1,1' value='" + config.strides.join(",") + "' /></td></tr>");
			} else if(layer_option == "dropout_rate") {
				$("#" + uuid + "_layer_gui").html($("#" + uuid + "_layer_gui").html() + "<tr><td>" + python_names_to_js_names[layer_option] + "</td><td><input onchange='" + on_change + "' class='gui_option " + "rate" + "' type='number' min=0 step='0.05' max=1 value='" + config.rate + "' /></td></tr>");
			} else if(layer_option == "stddev") {
				$("#" + uuid + "_layer_gui").html($("#" + uuid + "_layer_gui").html() + "<tr><td>" + layer_option + "</td><td><input onchange='" + on_change + "' class='gui_option " + layer_option + "' type='number' min=0 step='0.05' max=1 value='" + config.stddev + "' /></td></tr>");
			} else if(layer_option == "rate") {
				$("#" + uuid + "_layer_gui").html($("#" + uuid + "_layer_gui").html() + "<tr><td>" + layer_option + "</td><td><input onchange='" + on_change + "' class='gui_option " + layer_option + "' type='number' min=0 step='0.05' max=1 value='" + config.rate + "' /></td></tr>");
			} else if(layer_option.endsWith("filters")) {
				$("#" + uuid + "_layer_gui").html($("#" + uuid + "_layer_gui").html() + "<tr><td>" + layer_option + "</td><td><input onchange='" + on_change + "' class='gui_option " + python_names_to_js_names[layer_option] + "' type='number' min=1 step=1 value='" + config.filters + "' /></td></tr>");
			} else if(layer_option.endsWith("depth_multiplier")) {
				$("#" + uuid + "_layer_gui").html($("#" + uuid + "_layer_gui").html() + "<tr><td>" + python_names_to_js_names[layer_option] + "</td><td><input onchange='" + on_change + "' class='gui_option " + python_names_to_js_names[layer_option] + "' type='number' min=0 step='0.05' max=1 value='" + config.depthMultiplier + "' /></td></tr>");
			} else if(layer_option.endsWith("use_bias")) {
				$("#" + uuid + "_layer_gui").html($("#" + uuid + "_layer_gui").html() + "<tr><td>" + python_names_to_js_names[layer_option] + "</td><td><input onchange='" + on_change + "' class='gui_option " + python_names_to_js_names[layer_option] + "' type='checkbox' " + (config.useBias ? "checked" : "") + " /></td></tr>");
			} else if(layer_option.endsWith("interpolation")) {
				var selecter = "<select onchange='" + on_change + "' class='gui_option " + python_names_to_js_names[layer_option] + "'>";
				var interpolation_keys = Object.keys(interpolation);
				for (var k = 0; k < interpolation_keys.length; k++) {
					var checked = "";
					if(config[layer_option] == interpolation_keys[k]) {
						checked = "selected";
					}
					selecter += "<option " + checked + " value='" + interpolation_keys[k] + "'>" + interpolation_keys[k] + "</option>";
				}
				selecter += "</select>";

				$("#" + uuid + "_layer_gui").html($("#" + uuid + "_layer_gui").html() + "<tr><td>" + layer_option + "</td><td>" + selecter + "</td></tr>");
			} else if(layer_option.endsWith("activation")) {
				var selecter = "<select onchange='" + on_change + "' class='gui_option " + python_names_to_js_names[layer_option] + "'>";
				var activation_keys = Object.keys(activations);
				for (var k = 0; k < activation_keys.length; k++) {
					var checked = "";
					if(config[layer_option] == activation_keys[k]) {
						checked = "selected";
					}
					selecter += "<option " + checked + " value='" + activation_keys[k] + "'>" + activation_keys[k] + "</option>";
				}
				selecter += "</select>";

				$("#" + uuid + "_layer_gui").html($("#" + uuid + "_layer_gui").html() + "<tr><td>" + layer_option + "</td><td>" + selecter + "</td></tr>");
			} else if(layer_option.endsWith("constraint")) {
				var selecter = "<select onchange='" + on_change + "' class='gui_option " + python_names_to_js_names[layer_option] + "'>";
				var constraints_keys = Object.keys(constraints);
				for (var k = 0; k < constraints_keys.length; k++) {
					var checked = "";

					if(config.constraints == constraints_keys[k]) {
						checked = "selected";
					}

					selecter += "<option " + checked + " value='" + constraints_keys[k] + "'>" + constraints_keys[k] + "</option>";
				}
				selecter += "</select>";

				$("#" + uuid + "_layer_gui").html($("#" + uuid + "_layer_gui").html() + "<tr><td>" + python_names_to_js_names[layer_option] + "</td><td>" + selecter + "</td></tr>");
			} else if(layer_option.endsWith("padding")) {
				var selecter = "<select onchange='" + on_change + "' class='gui_option " + python_names_to_js_names[layer_option] + "'>";
				var padding_keys = Object.keys(padding_options);
				for (var k = 0; k < padding_keys.length; k++) {
					var checked = "";

					if(config.padding == padding_keys[k]) {
						checked = "selected";
					}

					selecter += "<option " + checked + " value='" + padding_keys[k] + "'>" + padding_keys[k] + "</option>";
				}
				selecter += "</select>";

				$("#" + uuid + "_layer_gui").html($("#" + uuid + "_layer_gui").html() + "<tr><td>" + layer_option + "</td><td>" + selecter + "</td></tr>");
			} else if(layer_option.endsWith("initializer")) {
				var selecter = "<select onchange='" + on_change + "' class='gui_option " + python_names_to_js_names[layer_option] + "'>";
				var initializer_keys = Object.keys(initializer_options);
				for (var k = 0; k < initializer_keys.length; k++) {
					if(!["identity"].includes(initializer_keys[k])) {
						var checked = "";

						//log(config[python_names_to_js_names[layer_option]], initializer_keys[k]);

						if(config[python_names_to_js_names[layer_option]] == initializer_keys[k]) {
							checked = "selected";
						}

						selecter += "<option " + checked + " value='" + initializer_keys[k] + "'>" + initializer_keys[k] + "</option>";
					}
				}
				selecter += "</select>";

				$("#" + uuid + "_layer_gui").html($("#" + uuid + "_layer_gui").html() + "<tr><td>" + python_names_to_js_names[layer_option] + "</td><td>" + selecter + "</td></tr>");
			} else {
				log(layer_option + " does not yet exist");
				$("#" + uuid + "_layer_gui").html($("#" + uuid + "_layer_gui").html() + "<tr><td>" + layer_option + "</td><td>This layer option does not yet exist</td></tr>");
			}
		}
	}

	if(layer_type.includes("ropout") || layer_type.includes("oise")) {
		$("#" + uuid + "_layer_gui").html($("#" + uuid + "_layer_gui").html() + "<tr><td>Is Training?</td><td><input type='checkbox' onchange='" + on_change + "' id='" + uuid + "_is_training' checked='checked' /></td></tr>");
	}

	eval_base64(onchange, uuid);
}

function eval_base64 (b, uuid) {
	try {
		var code = atob(b);
		eval(code);
		$("#" + uuid + "_error").html("");
	} catch (e) {
		void(0); log("" + e);
		$("#" + uuid + "_error").html(e);
	}

}

function add_html_for_layer_types (layer_type) {
	var div_to_add_to = layer_type + "_example";
	var uuid = uuidv4();
	var base_img_id = uuid + "_" + "base_img";
	var internal_canvasses_id = uuid + "_internal_canvasses";
	var out_canvasses_id = uuid + "_out_canvasses";
	var kernel_canvasses_id = uuid + "_kernel_canvasses";
	var shapes_id = uuid + "_shapes";

	var onchange_code = btoa(`simulate_layer_on_image("${base_img_id}", "${internal_canvasses_id}", "${out_canvasses_id}", "${layer_type}", "${uuid}");`);

	$("#" + div_to_add_to).html("");

	var html = `<div class="center_vertically">
		\\( \\Bigg[ \\) <img id="${base_img_id}" src="manual/example.jpg"> <span id="${kernel_canvasses_id}" style="display: none"> \\( \\cdot \\Bigg[ \\) <span id="${internal_canvasses_id}"></span> </span>\\( \\Bigg] \\rightarrow \\Bigg[ \\)   <span id="${out_canvasses_id}"></span> \\( \\Bigg] \\)
		<br>
		<script>
			$(document).ready(function(){
				add_table("${layer_type}", default_config_${layer_type}, "${onchange_code}", "${uuid}");
			});
		</script>
	</div>
	<span id="${shapes_id}"></span>
	<div class='error_msg' id="${uuid}_error"></div>
	<table id="${uuid}_layer_gui"></table>`;

	$("#" + div_to_add_to).html(html);
}

async function simulate_layer_on_image (img_element_id, internal_canvas_div_id, out_canvas_div_id, layer_type, uuid) {
	tf.engine().startScope();

	var img_element = $("#" + img_element_id);
	var internal_canvas_div = $("#" + internal_canvas_div_id);
	var out_canvas_div = $("#" + out_canvas_div_id);

	if(typeof(img_element) == "object") {
		img_element = img_element[0];
	}

	var img = fromPixels(img_element);
	img = img.div(255);

	var config = {};

	var options = $("#" + uuid + "_layer_gui").find(".gui_option");

	for (var option_idx = 0; option_idx < options.length; option_idx++) {
		var this_option = options[option_idx];
		var classes = this_option.className.split(/\s+/);

		var element = "";

		for (var k = 0; k < classes.length; k++) {
			if(classes[k] != "gui_option") {
				element = classes[k];
			}
		}

		config[element] = get_element(this_option);
	}

	var result, layer, input_shape, output_shape;
	try {
		var res = await get_network_type_result_by_array(layer_type, array_sync(img), config, 1, uuid);

		if(res.length >= 4) {
			result = res[0];
			layer = res[1];
			input_shape = res[2].join(",");
			output_shape = res[3].join(",");
			$("#" + uuid + "_error").html("");
			$("#" + uuid + "_shapes").html(`\\( \\text{Input/Output-Shape: } [${input_shape}] \\rightarrow [${output_shape}] \\)`);

			await MathJax.typesetPromise();
		} else {
			void(0); log("RES has not enough (4) values: ", res);
		}
	} catch (e) {
		void(0); log("" + e);
		$("#" + uuid + "_error").html(e);
		return;
	}

	if(result) {
		var _tensor = tensor(result);

		try {
			_tensor = _tensor.transpose([3, 1, 2, 0]);
			$("#" + uuid + "_error").html("");
		} catch (e) {
			$("#" + uuid + "_error").html(e);
			return;
		}

		$(internal_canvas_div).html("");
		$(out_canvas_div).html("");

		/*
		if(layer_type == "separableConv2d") {
			log(layer);
		}
		*/

		if(layer) {
			if(Object.keys(layer).includes("kernel")) {
				if(!(layer.kernel === null)) {
					if(Object.keys(layer.kernel).includes("val")) {
						var layer_kernel_tensor = layer.kernel.val;
						layer_kernel_tensor = layer_kernel_tensor.transpose([3, 2, 1, 0]);
						var layer_kernel = array_sync(layer_kernel_tensor);

						for (var filter_id = 0; filter_id < layer_kernel_tensor.shape[0]; filter_id++) {
							for (var channel_id = 0; channel_id < layer_kernel_tensor.shape[1]; channel_id++) {
								var id = uuidv4();
								$("<canvas class='kernel_images' id='" + id + "'></canvas>").appendTo(internal_canvas_div);

								var grid_element = $("#" + id)[0];

								var pixel_value = layer_kernel[filter_id][channel_id];

								assert(typeof(grid_element) == "object", "grid_element is not an object, but " + typeof(grid_element));
								assert(typeof(kernel_pixel_size) == "number", "kernel_pixel_size is not a number, but " + typeof(kernel_pixel_size));
								assert(Array.isArray(pixel_value), "pixel_value is not an array, but " + typeof(pixel_value));

								draw_grid(grid_element, kernel_pixel_size, pixel_value, 1, 1);

								var kernel_canvasses_id = uuid + "_kernel_canvasses";
								$("#" + kernel_canvasses_id).show();
							}
						}
					}
				}
			}
		}

		for (var tensor_idx = 0; tensor_idx < _tensor.shape[0]; tensor_idx++) {
			var id = uuidv4();
			$("<canvas class='out_images' id='" + id + "'></canvas>").appendTo(out_canvas_div);

			var canvas = $("#" + id)[0];

			var pixels = array_sync(_tensor)[tensor_idx];

			//draw_grid(canvas, 1, pixels, 1, 1, "", "");

			var min = tf.min(_tensor);
			var max = tf.max(_tensor);
		
			var normalized_tensor = tf.div(
				tf.sub(_tensor, min),
				tf.sub(max, min)
			);

			await toPixels(tensor(array_sync(normalized_tensor)[tensor_idx]), canvas);
		}
	}

	tf.engine().endScope();
	return result;
}

toc();

["conv2d", "upSampling2d", "maxPooling2d", "averagePooling2d", "alphaDropout", "dropout", "gaussianDropout", "gaussianNoise", "conv2dTranspose", "separableConv2d", "depthwiseConv2d"].forEach(function(type) {
	add_html_for_layer_types(type);
});
