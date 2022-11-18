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
	tf.engine().startScope();
	if(typeof(img_element) == "object") {
		img_element = img_element[0];
	}

	var img = tf.browser.fromPixels(img_element); 
	img = img.div(255);

	var [result, layer] = await get_network_type_result_by_array(layer_type, img.arraySync(), config, 1);
	log("layer:", layer);

	var tensor = tf.tensor(result);

	$(internal_canvas_div).html("");
	$(out_canvas_div).html("");

	var layer_kernel_tensor = layer.kernel.val;

	const indices = tf.tensor1d([3, 0, 1, 2], 'int32');

	layer_kernel_tensor = layer_kernel_tensor.transpose([3, 0, 1, 2]);

	var layer_kernel = layer_kernel_tensor.arraySync();

	log("kernel-shape:", layer_kernel_tensor.shape);
	log("kernel:", layer_kernel);

	for (var i = 0; i < layer.kernel.val.shape[0]; i++) {
		var id = uuidv4()
		$("<canvas class='kernel_images' id='" + id + "'></canvas>").appendTo(internal_canvas_div);
		draw_grid($("#" + id)[0], 10, layer_kernel[i], 1, 1, "", "");
	}

	for (var i = 0; i < tensor.shape[0]; i++) {
		var id = uuidv4()
		$("<canvas class='out_images' id='" + id + "'></canvas>").appendTo(out_canvas_div);
		draw_grid($("#" + id)[0], 1, result[i], 1, 1, "", "");
		//tf.browser.toPixels(tensor, canvas);
	}

	tf.engine().endScope();
	return result;
}

toc();
