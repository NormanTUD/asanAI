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
	tf.engine().startScope();
	var tensor = tf.tensor(array);
	config["inputShape"] = tensor.shape;
	var layer = null;
	eval("layer = tf.layers." + layer_type + "(config)");

	if(expand_dims) {
		tensor = tensor.expandDims();
	}

	log("image tensor before applying:", tensor.arraySync());
	var res = await layer.apply(tensor).arraySync();
	log(res);

	tf.engine().endScope();

	return res;
}

// await get_network_type_result_by_array("dense", [1, 2, 3], {units: 1, kernelInitializer: "ones" })

// simulate_layer_on_image($("#tftestimg"), $("#tftestcanvas"), "conv2d", {filters: 1, kernelSize: [2, 2], kernelInitializer: "randomUniform", activation: "relu", strides: [1, 1] })
async function simulate_layer_on_image(img_element, canvas, layer_type, config) {
	if(typeof(img_element) == "object") {
		img_element = img_element[0];
	}

	if(typeof(canvas) == "object") {
		canvas = canvas[0];
	}

	var img = tf.browser.fromPixels(img_element); 
	img = img.div(255);

	var result = await get_network_type_result_by_array(layer_type, img.arraySync(), config);

	var tensor = tf.tensor(result[0]);

	draw_grid(canvas, 1, result[0], 1, 1, "", "");
	//tf.browser.toPixels(tensor, canvas);

	return result;
}

toc();
