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
	log("layer_type:", layer_type);
	log("config:", config);

	tf.engine().startScope();
	var tensor = tf.tensor(array);
	config["inputShape"] = tensor.shape;
	var layer = null;
	eval("layer = tf.layers." + layer_type + "(config)");

	if(expand_dims) {
		tensor = tensor.expandDims();
	}

	log("tensor-shape:", tensor.shape);

	var res = await layer.apply(tensor).arraySync();

	tf.engine().endScope();

	return res;
}

// await get_network_type_result_by_array("dense", [1, 2, 3], {units: 1, kernelInitializer: "ones" })

async function simulate_layer_on_image(img_element, canvas, layer_type, config) {
	log("!!! config", config);

	if(typeof(img_element) == "object") {
		img_element = img_element[0];
	}

	if(typeof(canvas) == "object") {
		canvas = canvas[0];
	}

	log("img_element:", img_element);
	log("canvas:", canvas);

	var img = tf.browser.fromPixels(img_element); 

	var result = await get_network_type_result_by_array(layer_type, img.arraySync(), config);

	var tensor = tf.tensor(result[0]);

	log(tensor);

	draw_grid(canvas, 1, result[0], 1, 0, "", "");
	//tf.browser.toPixels(tensor, canvas);

	return result;
}

toc();
