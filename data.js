"use strict";

function numpy_str_to_tf_tensor (numpy_str, max_values) {
	assert(typeof(numpy_str) == "string", "numpy_str must be string, is " + typeof(numpy_str));
	assert(typeof(max_values) == "number", "max_values must be number, is " + typeof(max_values));

	var lines = numpy_str.split("\n");

	var tensor_type = $($(".dtype")[0]).val();

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
			} else {
				console.warn("Unknown tensor_type: " + tensor_type);
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

async function _get_training_data_from_filename(filename) {
	assert(typeof(filename) == "string", "filename must be string, not " + typeof(filename));

	return await $.get("traindata/" + $("#dataset_category").val() + "/" + $("#dataset").val() + "/" + filename);
}

function shuffle (array) {
	assert(typeof(array) == "object", "shuffle can only shuffle variables with the type object, not " + typeof(array));

	var randomIndex;
	var currentIndex = array.length;

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


function load_image(url) {
	assert(typeof(url) == "string", "url_to_tf accepts only strings as url parameter, got: " + typeof(url));

	return new Promise((resolve, reject) => {
		const img = new Image();
		img.addEventListener("load", () => resolve(img));
		img.addEventListener("error", () => {
			reject(new Error(`Failed to load ${url}`));
		});
		img.src = url;
	});
}

async function get_image_data(skip_real_image_download) {
	assert(["number", "boolean", "undefined"].includes(typeof(skip_real_image_download)), "skip_real_image_download must be number/boolean or undefined, but is " + typeof(skip_real_image_download));

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

	var percentage_div = $("#percentage");

	if(!skip_real_image_download) {
		percentage_div.html("");
		percentage_div.show();
	}

	for (var i = 1; i < urls.length; i++) {
		if(started_training) {
			var percentage = parseInt((i / urls.length) * 100);
			if(!skip_real_image_download) {
				percentage_div.html(percentage + "% (" + i + " of " + urls.length + ") loaded...");
				old_percentage = percentage;

				if(percentage > 20) {
					var current_time = Math.floor(Date.now() / 1000);
					var time_diff = current_time - start_time;
					var avg_time_per_image = time_diff / i;
					var remaining_items = urls.length - i;

					var eta = parseInt(remaining_items * avg_time_per_image);

					percentage_div.html(percentage_div.html() + " ETA: " + eta + "s");
				}
			}
			var url = urls[i];
			let tf_data = null;
			if(!skip_real_image_download) {
				tf_data = await url_to_tf(url);
			}
			if(tf_data !== null || skip_real_image_download) {
				data[keys[url]].push(tf_data);
			}
		}
	}

	if(!skip_real_image_download) {
		percentage_div.html("");
		percentage_div.hide();
	}

	return data;
}

async function get_xs_and_ys () {
	headerdatadebug("get_xs_and_ys()");

	$("#photos").html("");

	if($("#jump_to_training_tab").is(":checked")) {
		$('a[href="#tfvis_tab"]').click();
		$('#training_data_tab_label').show().click();
	}

	if(xy_data === null) {
		var category = $("#dataset_category").val();

		var keys = [];
		var x = tf.tensor([]);
		var y;
		var category_counter = 0;
		var classes = [];
		var loss = $("#loss").val();

		var max_number_values = parseInt($("#max_number_values").val());

		if(category == "image") {
			let imageData = await get_image_data(0);

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

			y = tf.tensor(classes);
		} else if(["logic", "own"].includes(category)) {
			var x_string, y_string;
			if(category == "own") {
				x_string = x_file;
				y_string = y_file;
			} else {
				x_string = await _get_training_data_from_filename("x.txt");
				y_string = await _get_training_data_from_filename("y.txt");
			}
			x = numpy_str_to_tf_tensor(x_string, max_number_values);
			y = numpy_str_to_tf_tensor(y_string, max_number_values);
		} else {
			alert("Unknown dataset category: " + category);
		}

		if((loss == "categoricalCrossentropy" || loss == "binaryCrossentropy") && $("dataset_category").val() != "own") {
			y = tf.oneHot(tf.tensor1d(classes, "int32"), category_counter);
			headerdatadebug("y After oneHot");
		}
		
		xy_data = {"x": x, "y": y, "keys": keys, "number_of_categories": category_counter};
	}

	return xy_data;
}

function url_to_tf (url) {
	assert(typeof(url) == "string", "url_to_tf accepts only strings as url parameter, got: " + typeof(url));

	headerdatadebug("url_to_tf(" + url + ")");
	try {
		add_photo_to_gallery(url);
		var tf_img = (async () => {
			let img = await load_image(url);
			tf_img = tf.browser.fromPixels(img);
			var resized_img = tf_img.
				resizeNearestNeighbor([height, width]).
				toFloat().
				expandDims();

			if($("#divide_by").val() != 1) {
				resized_img = tf.div(resized_img, parseFloat($("#divide_by").val()));
			}

			return resized_img;
		})();

		return tf_img;
	} catch (e) {
		header_error("url_to_tf(" + url + ") failed: " + e);
	}
	return null;
}

function determine_input_shape () {
	if($("#dataset_category").val() == "image") {
		set_input_shape("[" + width + ", " + height + ", 3]");
	}
}

async function _get_training_data() {
	const data = await $.getJSON("traindata/index.php?dataset=" + $("#dataset").val() + "&dataset_category=" + $("#dataset_category").val() + "&max_number_of_files_per_category=" +  $("#max_number_of_files_per_category").val() + "&t=" + Math.floor(Date.now() / 1000));
	return data;
}
