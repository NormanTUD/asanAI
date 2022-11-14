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

async function get_network_type_result_by_array (layer_type, array, config) {
	tf.engine().startScope();
	var tensor = tf.tensor(array);
	config["inputShape"] = tensor.shape;
	var layer = null;
	eval("layer = tf.layers." + layer_type + "(config)");

	var res = await layer.apply(tensor.expandDims()).arraySync();
	tf.engine().endScope();

	return res;
}

// await get_network_type_result_by_array("dense", [1, 2, 3], {units: 1, kernelInitializer: "ones" })

toc();
