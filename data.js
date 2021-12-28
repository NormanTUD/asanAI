"use strict";

function numpy_str_to_tf_tensor (numpy_str, max_values) {
	var lines = numpy_str.split("\n");

	var tensor_type = $("#tensor_type").val();

	var data = [];

	var k = -1;

	for (var i = 0; i < lines.length; i++) {
		if(i >= lines.length - 1 || (max_values != 0 && k + 2 > max_values)) {
			break;
		}
		var line = lines[i];
		if (line.startsWith("#")) {
			if(k > -1) {
				data[k] = data[k].flat();
			}
			k++;
			data[k] = [];
		} else {
			var new_items = line.split(" ");
			if(tensor_type == "complex64" || tensor_type == "int32" || tensor_type == "float32") {
				new_items = new_items.map(Number);
			} else if (tensor_type == "string") {
				new_items = new_items.map(String);
			}
			data[k].push(new_items);
		}
	}

	var shapeline = lines[0];
	data[k] = data[k].flat();

	var shape_match = /^#\s*shape:? \((.*)\)\s*$/.exec(shapeline);

	var shape = eval("[" + shape_match[1] + "]");
	if(max_values) {
		shape[0] = max_values;
	}

	var x = tf.tensor(data, shape, tensor_type);

	return x;
}

async function _get_training_data_scientific_y() {
	const data = await $.get("traindata/" + $("#dataset_category").val() + "/" + $("#dataset").val() + "/y.txt");
	return data;
}

async function _get_training_data_scientific_x() {
	const data = await $.get("traindata/" + $("#dataset_category").val() + "/" + $("#dataset").val() + "/x.txt");
	return data;
}

async function _get_training_data_text() {
	const data = await $.getJSON("traindata/" + $("#dataset_category").val() + "/" + $("#dataset").val() + "/examples.json");
	return data;
}

function shuffle (array) {
	let currentIndex = array.length,  randomIndex;

	// While there remain elements to shuffle...
	while (currentIndex != 0) {
		// Pick a remaining element...
		randomIndex = Math.floor(Math.random() * currentIndex);
		currentIndex--;

		// And swap it with the current element.
		[array[currentIndex], array[randomIndex]] = [array[randomIndex], array[currentIndex]];
	}

	return array;
}

async function get_logic_data() {
	header("get_logic_data()");
	let x = numpy_str_to_tf_tensor(await (_get_training_data_scientific_x()), 0);
	let y = numpy_str_to_tf_tensor(await (_get_training_data_scientific_y()), 0);

	return {"x": x, "y": y};
}

async function get_scientific_data () {
	header("get_scientific_data()");
	let x = numpy_str_to_tf_tensor(await (_get_training_data_scientific_x()), parseInt($("#max_number_values").val()));
	let y = numpy_str_to_tf_tensor(await (_get_training_data_scientific_y()), parseInt($("#max_number_values").val()));

	return {"x": x, "y": y};
}

async function get_text_data() {
	header("get_text_data()");
	let json = await (_get_training_data_text());

	let data = [];

	for (const [key, items] of Object.entries(json)) {
		if(items.length) {
			data[key] = [];
			for (let i = 0; i < items.length; i++) {
				let value = items[i];
				data[key].push(value);
			}
		}
	}

	return data;
}

function loadImage(url) {
	return new Promise((resolve, reject) => {
		const img = new Image();
		img.addEventListener("load", () => resolve(img));
		img.addEventListener("error", () => {
			reject(new Error(`Failed to load ${url}`));
		});
		img.src = url;
	});
}

async function get_image_data() {
	headerdatadebug("get_imageData()");
	let json = await (_get_training_data());

	let data = [];
	var urls = [];
	var keys = {};

	var base_url = "traindata/" + $("#dataset_category").val() + "/" + $("#dataset").val();

	for (const [key, items] of Object.entries(json)) {
		if(items.length) {
			data[key] = [];
			for (let i = 0; i < items.length; i++) {
				let value = items[i];
				var url = base_url + "/" + key + "/" + value;
				urls.push(url);
				keys[url] = key;
			}
		}
	}

	urls = shuffle(urls);

	var old_percentage = 0;
	var start_time = Math.floor(Date.now() / 1000);

	for (var i = 0; i < urls.length; i++) {
		var percentage = parseInt((i / urls.length) * 100);
		if(percentage != old_percentage) {
			$("#percentage").html(percentage + "% (" + i + ") of images (" + urls.length + ") loaded...");
			old_percentage = percentage;

			if(percentage > 20) {
				var current_time = Math.floor(Date.now() / 1000);
				var time_diff = current_time - start_time;
				var avg_time_per_image = time_diff / i;
				var remaining_items = urls.length - i;

				var eta = parseInt(remaining_items * avg_time_per_image);

				$("#percentage").html($("#percentage").html() + " ETA: " + eta + "s");
			}
		}
		var url = urls[i];
		let tf_data = await url_to_tf(url);
		if(tf_data !== null) {
			data[keys[url]].push(tf_data);
		}
	}

	return data;
}

async function get_xs_and_ys () {
	if(!loaded_tfvis) {
		var script = document.createElement("script");
		script.src = "tf/tfjs-vis.js";
		script.type = "text/javascript";
		script.onload = function () {
			loaded_tfvis = 1;
			load_tfvis();
		};
		document.getElementsByTagName("head")[0].appendChild(script);
	}
	headerdatadebug("get_xs_and_ys()");
	if(xy_data === null) {
		var category = $("#dataset_category").val();

		var keys = [];
		var x = tf.tensor([]);
		var y;
		var category_counter = 0;
		var classes = [];
		var loss = $("#loss").val();

		var tensor_classes = 1;

		if(category == "image") {
			if(1) {
				let imageData = await get_image_data();

				labels = [];

				var this_data = [];

				for (let [key, value] of Object.entries(imageData)) {
					keys.push(key);
					for (var i = 0; i < imageData[key].length; i++) {
						var item = imageData[key][i];
						this_data.push({key: key, item: item, category_counter: category_counter});
					}
					labels[category_counter] = key;
					category_counter++;
				}

				this_data = shuffle(this_data);

				for (var i = 0; i < this_data.length; i++) {
					var item = this_data[i]["item"];
					var this_category_counter = this_data[i]["category_counter"];
					x = x.concat(item);
					classes.push(this_category_counter);
				}

				datadebug(y);
			} else {
				/* Testdaten erzeugen
				 * Dieser Abschnitt erzeugt zufällige "Bilder", die zufällig zugeordnet werden,
				 * um vielleicht etwas debuggen zu können. Ich lass das mal hier drinnen... */
				header("DEBUG =================================================================>");
				var num_of_test_values = 100;
				header("x:");
				x = tf.randomUniform([num_of_test_values, width, height, 3], 0, 255);

				var test_classes = [];

				for (var i = 0; i != num_of_test_values; i++) {
					test_classes.push(Math.round(Math.random()));
				}

				y = tf.tensor(test_classes).expandDims();
				category_counter = 2;

				classes = test_classes;
			}
		} else if(category == "scientific") {
			tensor_classes = 0;
			var scientific_data = await get_scientific_data();
			x = scientific_data["x"];
			y = scientific_data["y"];
		} else if(category == "own") {
			tensor_classes = 0;
			x = numpy_str_to_tf_tensor(x_file, parseInt($("#max_number_values").val()));
			y = numpy_str_to_tf_tensor(y_file, parseInt($("#max_number_values").val()));
		} else if(category == "logic") {
			tensor_classes = 0;
			var logic_data = await get_logic_data();
			x = logic_data["x"];
			y = logic_data["y"];
		} else {
			alert("Unknown dataset category: " + category);
		}

		//datadebug("Number of tensors in RAM: " + tf.memory()["numTensors"]);
		if((loss == "categoricalCrossentropy" || loss == "binaryCrossentropy") && $("dataset_category").val() != "own") {
			y = tf.oneHot(tf.tensor1d(classes, "int32"), category_counter);
			headerdatadebug("y After oneHot");
		} else if (tensor_classes) {
			y = tf.tensor(classes);
		}
		//datadebug("Number of tensors in RAM: " + tf.memory()["numTensors"]);
		
		xy_data = {"x": x, "y": y, "keys": keys, "number_of_categories": category_counter};
	}

	//console.log(xy_data);
	return xy_data;
}

function url_to_tf (imgurl) {
	headerdatadebug("url_to_tf(" + imgurl + ")");
	try {
		add_photo_to_gallery(imgurl);
		var tf_img = (async () => {
			let img = await loadImage(imgurl);
			tf_img = tf.browser.fromPixels(img);
			var resized_img = tf_img.resizeNearestNeighbor([height, width]).toFloat().expandDims();
			return resized_img;
		})();

		return tf_img;
	} catch (e) {
		header_error("url_to_tf(" + imgurl + ") failed: " + e);
	}
	return null;
}
