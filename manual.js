"use strict";

var current_model = null;

function toc () {
	var toc = "";
	var level = 0;

	var s = document.createElement("style");
	s.textContent = `
		#toc {
		    font-family: system-ui, sans-serif;
		    background: #fafafa;
		    padding: 14px 18px;
		    border: 1px solid #ddd;
		    border-radius: 8px;
		    margin: 20px 0;
		    line-height: 1.4;
		    box-shadow: 0 1px 3px rgba(0,0,0,0.08);
		}
		/* New GUI Table Styling */
		[id$="_layer_gui"] {
			width: 100%;
			max-width: 500px;
			border-collapse: collapse;
			margin: 15px 0;
			font-family: system-ui, sans-serif;
			font-size: 14px;
			background: #fff;
			border: 1px solid #eee;
			border-radius: 4px;
		}
		[id$="_layer_gui"] td {
			padding: 8px 12px;
			border-bottom: 1px solid #f0f0f0;
		}
		[id$="_layer_gui"] td:first-child {
			font-weight: 600;
			color: #555;
			width: 40%;
			background: #fdfdfd;
		}
		[id$="_layer_gui"] input, [id$="_layer_gui"] select {
			width: 100%;
			padding: 4px 6px;
			border: 1px solid #ccc;
			border-radius: 4px;
			box-sizing: border-box;
		}
		[id$="_layer_gui"] input[type="checkbox"] {
			width: auto;
		}
		.error_msg {
			color: white;
			font-family: monospace;
			font-size: 12px;
			margin: 5px 0;
		}
		/* Rest of original styles... */
		#toc ul { list-style: none; padding-left: 10px; margin: 6px 0; border-left: 2px solid #ccc; }
		#toc li { margin: 5px 0; padding-left: 4px; transition: all 0.15s ease-in-out; }
		#toc li::before { content: "- "; color: #888; font-size: 0.8em; position: relative; top: -1px; }
		#toc a { text-decoration: none; color: #0044aa; font-size: 0.94em; }
		#toc a:hover { color: #cc3300; text-decoration: underline; }
		#toc li:hover { transform: translateX(3px); }
	`;
	document.head.appendChild(s);

	document.getElementById("contents").innerHTML =
		document.getElementById("contents").innerHTML.replace(
			/<h([\d])>([^<]+)<\/h\1>/gi,
			function (str, openLevel, titleText) {
				openLevel = (function parse_int(x){return parseInt(x);})(openLevel);
				if (openLevel > level) {
					toc += new Array(openLevel - level + 1).join("<ul>");
				} else if (openLevel < level) {
					toc += new Array(level - openLevel + 1).join("</ul>");
				}
				level = openLevel;
				var anchor = titleText.replace(/\s+/g, "_");
				toc += "<li><a href='#" + anchor + "'>" + titleText + "</a></li>";
				return "<h" + openLevel + "><a name='" + anchor + "'>" +
					titleText + "</a></h" + openLevel + ">";
			}
		);

	if (level) toc += new Array(level + 1).join("</ul>");
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
				let cfg = {"className": "L1L2", config: { "l1": config[type + "Regularizer"]["l1"], "l2": config[type + "Regularizer"]["l2"], hasL1: true, hasL2: true }};
				config[type + "Regularizer"] = cfg;
			} else if(config[type + "Regularizer"].hasL1 && !config[type + "Regularizer"].hasL2) {
				let cfg = {"className": "L1", config: { "l1": config[type + "Regularizer"]["l1"], hasL1: true, hasL2: false }};
				config[type + "Regularizer"] = cfg;
			} else if(!config[type + "Regularizer"].hasL1 && config[type + "Regularizer"].hasL2) {
				let cfg = {"className": "L1L2", config: { "l1": 0.01, "l2": config[type + "Regularizer"]["l2"], hasL1: false, hasL2: true }};
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
	var rows = []; // Use an array for cleaner string building
	var on_change = "eval_base64(\"" + onchange + "\", \"" + uuid + "\")";

	for (var layer_option_idx = 0; layer_option_idx < this_layer_options.length; layer_option_idx++) {
		var layer_option = this_layer_options[layer_option_idx];
		if(["trainable", "dtype", "visualize"].includes(layer_option)) continue;

		let label = python_names_to_js_names[layer_option] || layer_option;
		let input_html = "";

		if(layer_option.endsWith("regularizer")) {
			input_html = "<select onchange='" + on_change + "' class='gui_option " + label + "'>";
			var regularizer_keys = Object.keys(regularizer_options);
			for (let k = 0; k < regularizer_keys.length; k++) {
				let selected = "";
				if(Object.keys(config).includes(label)) {
					var cfg_itm = config[label];
					if(cfg_itm.hasL1 && cfg_itm.hasL2 && regularizer_keys[k] == "l1l2") selected = "selected";
					else if(cfg_itm.hasL1 && !cfg_itm.hasL2 && regularizer_keys[k] == "l1") selected = "selected";
					else if(!cfg_itm.hasL1 && cfg_itm.hasL2 && regularizer_keys[k] == "l2") selected = "selected";
				}
				input_html += "<option " + selected + " value='" + regularizer_keys[k] + "'>" + regularizer_keys[k] + "</option>";
			}
			input_html += "</select>";

		} else if(["strides", "pool_size", "size", "kernel_size", "dilation_rate"].some(s => layer_option.includes(s))) {
			let val = config[label] || config[layer_option];
			if(Array.isArray(val)) val = val.join(",");
			input_html = "<input onchange='" + on_change + "' class='gui_option " + label + "' type='text' value='" + val + "' />";

		} else if(["dropout_rate", "stddev", "rate", "depth_multiplier"].some(s => layer_option.includes(s))) {
			let val = config.rate || config.stddev || config.depthMultiplier || 0.5;
			input_html = "<input onchange='" + on_change + "' class='gui_option " + (layer_option === "dropout_rate" ? "rate" : layer_option) + "' type='number' min=0 step='0.05' max=1 value='" + val + "' />";

		} else if(layer_option.endsWith("filters")) {
			input_html = "<input onchange='" + on_change + "' class='gui_option " + label + "' type='number' min=1 step=1 value='" + config.filters + "' />";

		} else if(layer_option.endsWith("use_bias")) {
			input_html = "<input onchange='" + on_change + "' class='gui_option " + label + "' type='checkbox' " + (config.useBias ? "checked" : "") + " />";

		} else if(["activation", "interpolation", "constraint", "padding", "initializer"].some(s => layer_option.endsWith(s))) {
			let options_map = { activation: activations, interpolation: interpolation, constraint: constraints, padding: padding_options, initializer: initializer_options };
			let key = Object.keys(options_map).find(k => layer_option.endsWith(k));

			input_html = "<select onchange='" + on_change + "' class='gui_option " + label + "'>";
			Object.keys(options_map[key]).forEach(opt => {
				if(key === "initializer" && opt === "identity") return;
				let selected = (config[label] == opt || config[layer_option] == opt) ? "selected" : "";
				input_html += "<option " + selected + " value='" + opt + "'>" + opt + "</option>";
			});
			input_html += "</select>";
		}

		if (input_html) {
			rows.push("<tr><td>" + label + "</td><td>" + input_html + "</td></tr>");
		}
	}

	if(layer_type.includes("ropout") || layer_type.includes("oise")) {
		rows.push("<tr><td>is_training</td><td><input type='checkbox' onchange='" + on_change + "' id='" + uuid + "_is_training' checked='checked' /></td></tr>");
	}

	$("#" + uuid + "_layer_gui").html(rows.join(''));
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

	var html = `
	<div class="layer-visual-container" style="display: flex; align-items: center; gap: 8px; min-height: 120px; overflow-x: auto; white-space: nowrap;">
	    <div class="math-group" style="display: flex; align-items: center; flex-shrink: 0;">
		<span class="bracket" style="font-size: 100px; font-family: serif; line-height: 1;">[</span>
		<img id="${base_img_id}" src="manual/example.jpg" style="height: 100px; width: auto; border-radius: 4px;">
		
		<div id="${kernel_canvasses_id}" style="display: none; align-items: center;">
		    <span style="font-size: 30px; padding: 0 10px;">&sdot;</span>
		    <span class="bracket" style="font-size: 100px; font-family: serif; line-height: 1;">[</span>
		    <div id="${internal_canvasses_id}" style="display: flex; gap: 4px; align-items: center;"></div>
		    <span class="bracket" style="font-size: 100px; font-family: serif; line-height: 1;">]</span>
		</div>
	    </div>

	    <span style="font-size: 40px; padding: 0 10px; flex-shrink: 0;">&rarr;</span>

	    <div class="math-group" style="display: flex; align-items: center; flex-shrink: 0;">
		<span class="bracket" style="font-size: 100px; font-family: serif; line-height: 1;">[</span>
		<div id="${out_canvasses_id}" style="display: flex; gap: 4px; align-items: center;">
		    </div>
		<span class="bracket" style="font-size: 100px; font-family: serif; line-height: 1;">]</span>
	    </div>
	</div>
	<div id="${shapes_id}" style="font-family: monospace; font-size: 14px; background: #f0f0f0; padding: 4px 8px; display: inline-block; border-radius: 4px;"></div>
	<div class='error_msg' id="${uuid}_error"></div>
	<table id="${uuid}_layer_gui"></table>`;

	$("#" + div_to_add_to).html(html);
	add_table(layer_type, window["default_config_" + layer_type] || {}, onchange_code, uuid);
}

async function simulate_layer_on_image (img_element_id, internal_canvas_div_id, out_canvas_div_id, layer_type, uuid) {
	tf.engine().startScope();

	var img_element = $("#" + img_element_id)[0]; // Direkt auf das DOM-Element zugreifen
	if (!img_element) return;

	// FIX: Warten, falls das Bild noch nicht geladen ist
	if (!img_element.complete || img_element.naturalWidth === 0) {
		img_element.onload = function() {
			simulate_layer_on_image(img_element_id, internal_canvas_div_id, out_canvas_div_id, layer_type, uuid); // await not possible here
		};
		return;
	}

	try {
		var img = fromPixels(img_element);
		img = img.div(255);

		var config = {};
		var options = $("#" + uuid + "_layer_gui").find(".gui_option");

		for (var option_idx = 0; option_idx < options.length; option_idx++) {
			var this_option = options[option_idx];
			var classes = this_option.className.split(/\s+/);
			var element = classes.find(c => c !== "gui_option");
			if (element) config[element] = get_element(this_option);
		}

		var res = await get_network_type_result_by_array(layer_type, array_sync(img), config, 1, uuid);

		if(res && res.length >= 4) {
			var result = res[0];
			var layer = res[1];
			if (!Array.isArray(res) || !Array.isArray(res[2]) || !Array.isArray(res[3])) {
				throw new TypeError(
					"Invalid settings detected"
				);
			}

			var input_shape = res[2].join(",");
			var output_shape = res[3].join(",");

			$("#" + uuid + "_error").html("");
			$("#" + uuid + "_shapes").html(`\\( \\text{Shape: } [${input_shape}] \\rightarrow [${output_shape}] \\)`);

			// FIX: MathJax Typeset nur für diesen Bereich triggern
			if (window.MathJax && MathJax.typesetPromise) {
				MathJax.typesetPromise([document.getElementById(uuid + "_shapes")]).catch((err) => console.log(err));
			}

			if(result) {
				var _tensor = tensor(result);
				_tensor = _tensor.transpose([3, 1, 2, 0]);

				var internal_canvas_div = $("#" + internal_canvas_div_id).html("");
				var out_canvas_div = $("#" + out_canvas_div_id).html("");

				// Kernel Visualisierung
				// Suche diesen Block und ersetze ihn:
				if(layer && layer.kernel && layer.kernel.val) {
					// Sicherstellen, dass der übergeordnete Container auf flex steht
					$("#" + uuid + "_kernel_canvasses").css("display", "flex"); 

					var layer_kernel_tensor = layer.kernel.val.transpose([3, 2, 1, 0]);
					var layer_kernel = array_sync(layer_kernel_tensor);

					// WICHTIG: Den Container leeren, bevor neu gezeichnet wird
					var internal_canvas_div = $("#" + internal_canvas_div_id).html("");

					for (var f = 0; f < layer_kernel_tensor.shape[0]; f++) {
						for (var c = 0; c < layer_kernel_tensor.shape[1]; c++) {
							let id = uuidv4();
							// Canvas mit fester Höhe, damit die Klammern stabil bleiben
							$("<canvas class='kernel_images' id='" + id + "' style='height:80px; width:auto;'></canvas>").appendTo(internal_canvas_div);
							draw_grid(document.getElementById(id), kernel_pixel_size, layer_kernel[f][c], 1, 1);
						}
					}
				}

				// Output Visualisierung
				var min = tf.min(_tensor);
				var max = tf.max(_tensor);
				var normalized = tf.div(tf.sub(_tensor, min), tf.sub(max, min).add(1e-5)); // 1e-5 verhindert div by zero
				var norm_data = array_sync(normalized);

				for (var t_idx = 0; t_idx < _tensor.shape[0]; t_idx++) {
					let id = uuidv4();
					// Höhe auf 100px (wie Input), Breite auf auto
					$("<canvas class='out_images' id='" + id + "' style='height: 100px; width: auto;'></canvas>").appendTo(out_canvas_div);
					await toPixels(tensor(norm_data[t_idx]), document.getElementById(id));
				}
			}
		}
	} catch (e) {
		console.error(e);
		$("#" + uuid + "_error").html(e.message || e);
	}

	tf.engine().endScope();
}

toc();

/**
 * Lazy-loads layer HTML only when the container is scrolled into view.
 * @param {string} layer_type - The type of layer (e.g., "conv2d")
 */
function lazy_load_layer_html(layer_type) {
	const targetId = layer_type + "_example";
	const targetElement = document.getElementById(targetId);

	if (!targetElement) return;

	const observer = new IntersectionObserver((entries, observer) => {
		entries.forEach(entry => {
			if (entry.isIntersecting) {
				// Execute the heavy function
				add_html_for_layer_types(layer_type);

				// Stop observing once loaded to prevent re-execution
				observer.unobserve(entry.target);
				console.log(`Lazy-loaded: ${layer_type}`);
			}
		});
	}, {
		rootMargin: "100px" // Start loading 100px before it enters the screen for smoothness
	});

	observer.observe(targetElement);
}

// --- Replace your bottom loop with this ---
[
	"conv2d", "upSampling2d", "maxPooling2d", "averagePooling2d", 
	"alphaDropout", "dropout", "gaussianDropout", "gaussianNoise", 
	"conv2dTranspose", "separableConv2d", "depthwiseConv2d"
].forEach(lazy_load_layer_html);
