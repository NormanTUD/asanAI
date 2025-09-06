"use strict";

function degrees_to_radians(degrees) {
	var res = degrees * (Math.PI / 180);

	return res;
}

function numpy_str_to_tf_tensor(numpy_str) {
	const max_values = get_max_number_values();

	assert(typeof(numpy_str) === "string", "numpy_str must be string, is " + typeof(numpy_str));
	assert(typeof(max_values) === "number", "max_values must be number, is " + typeof(max_values));

	if (!numpy_str.endsWith("\n")) {
		numpy_str += "\n";
	}

	var lines = numpy_str.split("\n");
	var tensor_type = $($(".dtype")[0]).val();
	var data = [];
	var k = -1;

	for (var line_idx = 0; line_idx < lines.length; line_idx++) {
		var line = lines[line_idx].trim();
		if (!line) continue;

		if (line.startsWith("#")) {
			if (/^#\s*New slice/i.test(line)) {
				k++;
				data[k] = [];
			}
			continue;  // skip shape comment or other comments
		}

		if (k === -1) {  // first slice
			k = 0;
			data[k] = [];
		}

		var new_items = line.split(/\s+/).filter(s => s !== "");
		if (tensor_type === "complex64" || tensor_type === "int32" || tensor_type === "float32") {
			new_items = new_items.map(Number);
		} else if (tensor_type === "string") {
			new_items = new_items.map(String);
		} else {
			wrn("[numpy_str_to_tf_tensor] Unknown tensor_type: " + tensor_type);
		}

		if (new_items.length > 0) data[k].push(new_items);
	}

	// Remove empty slices
	data = data.filter(slice => slice.length > 0);

	// Flatten each slice
	data = data.map(slice => slice.flat());

	// Parse shape from first line if present
	var shapeline = lines.find(l => /^#\s*shape:?/i.test(l));
	var shape;
	if (shapeline) {
		var shape_match = /^#\s*shape:? \((.*)\)\s*$/.exec(shapeline);
		shape = eval("[" + shape_match[1] + "]");
	} else {
		shape = [data.length, data[0].length]; // fallback
	}

	// Ensure shape[0] matches number of slices
	shape[0] = data.length;

	var x = tensor(data, shape, tensor_type);
	return x;
}

async function _get_training_data_from_filename(filename) {
	assert(typeof(filename) == "string", "filename must be string, not " + typeof(filename));

	var res = await $.get("traindata/" + get_chosen_dataset() + "/" + filename);

	return res;
}

function shuffle (_array) {
	assert(typeof(_array) == "object", "shuffle can only shuffle variables with the type object, not " + typeof(_array));

	var randomIndex;
	var currentIndex = _array.length;

	// While there remain elements to shuffle...
	while (currentIndex != 0) {
		// Pick a remaining element...
		randomIndex = Math.floor(Math.random() * currentIndex);
		currentIndex--;

		// And swap it with the current element.
		[_array[currentIndex], _array[randomIndex]] = [_array[randomIndex], _array[currentIndex]];
	}

	return _array;
}

function load_image(url) {
	assert(typeof(url) == "string", "load_image accepts only strings as url parameter, got: " + typeof(url));

	var res = new Promise((resolve, reject) => {
		const img = new Image();
		img.addEventListener("load", () => resolve(img));
		img.addEventListener("error", () => {
			reject(new Error(`Failed to load ${url}`));
		});
		img.src = url;
	});

	return res;
}

async function force_download_image_preview_data () {
	if(await input_shape_is_image()) {
		var old_img_cat = $("#max_number_of_files_per_category").val();
		$("#max_number_of_files_per_category").val(1);
		var old_force_download = force_download;
		enable_force_download();
		var data = await download_image_data(0, 0, {title: language[lang]["loading_example_images"], html: ""}, 1);
		await dispose(data);

		set_force_download(old_force_download);
		$("#max_number_of_files_per_category").val(old_img_cat);
		$("#photos").show();
	} else {
		$("#photos").html("").hide();
	}
}

async function _get_urls_and_keys () {
	var base_url = "traindata/" + get_chosen_dataset() + "/";
	var data = {};
	var urls = [];
	var keys = {};

	var json = await _get_training_data();

	for (const [key, items] of Object.entries(json)) {
		if(items.length) {
			data[key] = [];
			for (var item_idx = 0; item_idx < items.length; item_idx++) {
				var value = items[item_idx];
				var url = base_url + "/" + key + "/" + value;
				urls.push(url);
				keys[url] = key;
			}
		} else {
			//wrn("No items found");
		}
	}

	return [urls, keys, data];
}

async function _get_set_percentage_text (percentage, url_idx, urls_length, percentage_div, old_percentage, times) {
	var percentage_text = percentage + "% (" + (url_idx + 1) + "/" + urls_length + ")...";

	var eta;

	var data_progressbar_div = $("#data_progressbar>div");
	data_progressbar_div.css("width", percentage + "%");

	set_document_title(language[lang]["loading_data"] + " " + language[lang]["of"] + " " + percentage_text + " - asanAI");

	if(percentage > 20) {
		var remaining_items = urls_length - url_idx;
		var time_per_image = decille(times, ((100 - percentage) / 100) + 0.01);

		eta = parse_int(parse_int(remaining_items * Math.floor(time_per_image)) / 1000) + 10;
		old_percentage = percentage;

		percentage_text += " ca. " + human_readable_time(eta) + " " + trm("left");
	}

	percentage_div.html(percentage_text);
	await update_translations();

	return old_percentage;
}

function show_or_hide_stop_downloading_button(skip_real_image_download, dont_load_into_tf) {
	if(!skip_real_image_download) {
		if(!dont_load_into_tf) {
			$("#stop_downloading").show();
		} else {
			$("#stop_downloading").hide();
		}
	}
}

async function download_image_data(skip_real_image_download, dont_show_swal=0, ignoreme, dont_load_into_tf=0, force_no_download=0) {
	assert(["number", "boolean", "undefined"].includes(typeof(skip_real_image_download)), "skip_real_image_download must be number/boolean or undefined, but is " + typeof(skip_real_image_download));

	const divide_by = parse_float($("#divide_by").val());

	if((started_training || force_download) && !force_no_download) {
		dbg("Resetting photos element");
		$("#photos").html("");
	}

	headerdatadebug("download_image_data()");
	show_or_hide_stop_downloading_button(skip_real_image_download, dont_load_into_tf);

	var [urls, keys, data] = await _get_urls_and_keys();

	var percentage_div = $("#percentage");

	reset_percentage_div_if_not_skip_real_image_download(percentage_div, skip_real_image_download);

	var old_percentage;

	var times = [];

	$("#data_loading_progress_bar").show();
	$("#data_progressbar").css("display", "inline-block");

	var shown_stop_downloading = 0;

	urls = shuffle(urls);

	for (var url_idx = 0; url_idx < urls.length; url_idx++) {
		const url = urls[url_idx];
		const start_time = Date.now();

		if(started_training || force_download) {
			var percentage = parse_int((url_idx / urls.length) * 100);
			if(!stop_downloading_data) {
				let tf_data = null;

				if(!skip_real_image_download) {
					try {
						await _get_set_percentage_text(percentage, url_idx,  urls.length, percentage_div, old_percentage, times);

						tf_data = await url_to_tf(url, dont_load_into_tf, divide_by);
					} catch (e) {
						err(e);
					}
				} else {
					dbg("Skipping real image download because skip_real_image_download was True");
				}

				if(tf_data !== null || !skip_real_image_download) {
					const data_key = keys[url];

					data[data_key].push(tf_data);
				} else {
					var shown_msg = false;
					if(tf_data === null) {
						dbg("tf_data is null");
						shown_msg = true;
					}

					if(skip_real_image_download) {
						dbg("skip_real_image_download is set, not downloading");
						shown_msg = true;
					}

					if(!shown_msg) {
						dbg(`tf_data was empty or !skip_real_image_download (${skip_real_image_download}), but no appropriate error found`);
					}
				}
			} else {
				if(!shown_stop_downloading) {
					log(language[lang]["stopped_downloading_because_button_was_clicked"]);
					shown_stop_downloading = 1;
				}
			}
		}

		var end_time = Date.now();

		times.push(end_time - start_time);
	}

	$("#data_progressbar").css("display", "none");
	$("#data_loading_progress_bar").hide();

	stop_downloading_data = false;
	$("#stop_downloading").hide();

	set_document_title(original_title);

	reset_percentage_div_if_not_skip_real_image_download(percentage_div, skip_real_image_download);

	return data;
}

function reset_percentage_div_if_not_skip_real_image_download(percentage_div, skip_real_image_download) {
	if(!skip_real_image_download) {
		percentage_div.html("");
		percentage_div.hide();
	}
}

function add_tensor_as_image_to_photos (_tensor) {
	// TODO
	assert(typeof(_tensor) == "object", "_tensor must be an object");
	assert(Object.keys(_tensor).includes("shape"), "_tensor must be an object that contains a shape subkey");
	assert(_tensor.shape.length >= 3 && _tensor.shape.length <= 4, "_tensor must have 3 or 4 dimensions");

	if(_tensor.shape.length == 4) {
		if(_tensor.shape[0] == 1) {
			_tensor = tensor(array_sync(_tensor)[0]);
		} else {
			for (var tensor_idx = 0; tensor_idx < _tensor.shape[0]; tensor_idx++) {
				var this_tensor = tensor(array_sync(_tensor)[tensor_idx]);
				add_tensor_as_image_to_photos(this_tensor);
			}

			return;
		}
	}

	var uuid = uuidv4();
	var id = "augmented_photo_" + uuid;
	//log("image-element-id: ", id);
	$("#photos").prepend("<canvas id='" + id + "'></canvas>");
	//log("toPixels(_tensor, $('#" + id + "')");

	var min_value = 0;
	var max_value = 0;

	var min_in_tensor = array_sync(min(_tensor));

	if(min_in_tensor < min_value) {
		min_value = min_in_tensor;
	}

	if(min_value < 0) {
		_tensor = _tf_sub(tensor, min_value);
	}

	var max_in_tensor = array_sync(max(_tensor));

	if(max_in_tensor > max_value) {
		max_value = max_in_tensor;
	}

	if(max_value != 0) {
		_tensor = tidy(() => { return tf_div(_tensor, max_value); });
	}

	try {
		toPixels(_tensor, $("#" + id)[0]);
	} catch (e) {
		void(0); log("Shape:", _tensor.shape);
		_tensor.print();
	}

}

function truncate_text (fullStr, strLen, separator) {
	typeassert(fullStr, string, "fullStr");
	typeassert(strLen, int, "strLen");

	if (fullStr.length <= strLen) return fullStr;

	separator = separator || "...";

	var sepLen = separator.length,
		charsToShow = strLen - sepLen,
		frontChars = Math.ceil(charsToShow/2),
		backChars = Math.floor(charsToShow/2);

	var res = fullStr.substr(0, frontChars) +
		separator +
		fullStr.substr(fullStr.length - backChars);

	return res;
}

function augment_rotate_images_function(item, degree, this_category_counter, x, y, label_nr) {
	l(language[lang]["rotating_image"] +  ": " + degree + "°");
	var augmented_img = rotateWithOffset(item, degrees_to_radians(degree));
	add_tensor_as_image_to_photos(augmented_img);
	x = tf_concat(x, augmented_img);
	y.push(this_category_counter);

	if ($("#augment_invert_images").is(":checked")) {
		l(language[lang]["inverted_image_that_has_been_turned"] + " " + degree + "°");
		var add_value = (-255 / parse_float($("#divide_by").val()));
		var inverted = abs(add(augmented_img, add_value));
		add_tensor_as_image_to_photos(inverted);
		x = tf_concat(x, inverted);
		y.push(this_category_counter);
	}

	if ($("#augment_flip_left_right").is(":checked")) {
		l(language[lang]["flip_left_right_that_has_been_turned"] + " " + degree + "°");
		var flipped = flipLeftRight(augmented_img);
		add_tensor_as_image_to_photos(flipped);
		x = tf_concat(x, flipped);
		y.push(label_nr);
	}

	return [x, y];
}

function augment_invert_images(item, this_category_counter, x, y) {
	l(language[lang]["inverted_image"]);
	var add_value = (-255 / parse_float($("#divide_by").val()));
	var inverted = abs(add(item, add_value));
	add_tensor_as_image_to_photos(inverted);
	x = tf_concat(x, inverted);
	y.push(this_category_counter);
	return [x, y];
}

function augment_flip_left_right(item, this_category_counter, x, y) {
	l(language[lang]["flip_left_right"]);
	var flipped = flipLeftRight(item);
	add_tensor_as_image_to_photos(flipped);
	x = tf_concat(x, flipped);
	y.push(this_category_counter);
	return [x, y];
}

async function jump_to_tab_if_applicable (_data_origin) {
	if($("#jump_to_interesting_tab").is(":checked")) {
		if(_data_origin == "default") {
			await show_tab_label("training_data_tab_label", 1);
		} else if(_data_origin == "csv") {
			await show_tab_label("own_csv_tab_label", 0);
			await show_tab_label("training_tab_label", 1);
		} else if (_data_origin == "image") {
			await show_tab_label("own_images_tab_label", 1);
		} else if (_data_origin == "tensordata") {
			await show_tab_label("own_tensor_tab_label", 1);
		} else {
			log(language[lang]["invalid_option"] + " " + _data_origin);
		}
	}
}

function is_auto_augment() {
	return $("#auto_augment").is(":checked");
}

async function resize_augment_invert_flip_left_right_rotate (image_idx, unresized_image, this_img, x, y) {
	var resized_image = resize_image(unresized_image, [height, width]);

	if(resized_image === null) {
		err(`resized_image is null!`);

		return [null, null];
	} else {
		x = await get_concatted_x(x, resized_image)

		const this_category_counter = this_img["category_counter"];

		y.push(this_category_counter);

		if (is_auto_augment()) {
			l(language[lang]["auto_augmenting_images"]);
			if ($("#augment_rotate_images").is(":checked")) {
				for (var degree = 0; degree < 360; degree += (360 / $("#number_of_rotations").val())) {
					if (degree !== 0) {
						[x, y] = augment_rotate_images_function(item, degree, this_category_counter, x, y, this_category_counter);
					}
				}
			}

			[x, y] = augment_invert_flip_left_right(item, this_category_counter, x, y);
		}

		await dispose(resized_image);

		if (image_idx == 0) {
			var x_arr = array_sync(x);
			x_arr = x_arr.slice(1);
			x = tensor(x_arr)
		}

		return [x, y];
	}
}

function augment_invert_flip_left_right (item, this_category_counter, x, y) {
	if ($("#augment_invert_images").is(":checked")) {
		[x, y] = augment_invert_images(item, this_category_counter, x, y);
	}

	if ($("#augment_flip_left_right").is(":checked")) {
		[x, y] = augment_flip_left_right(item, this_category_counter, x, y);
	}

	return [x, y];
}

function show_xy_string(xy_data) {
	var x_print_string = arbitrary_array_to_latex(array_sync(xy_data.x));
	var y_print_string = arbitrary_array_to_latex(array_sync(xy_data.y));

	$("#xy_display_data").html(`<table border=1><tr><th>X=</th><th>Y=</th></tr><tr><td><pre>${x_print_string}</pre></td><td><pre>${y_print_string}</pre></td></tr></table>`).show();
}

function get_max_number_values () {
	var max_number_values = 0;
	if(!is_hidden_or_has_hidden_parent($("#max_number_values"))) {
		max_number_values = parse_int($("#max_number_values").val());
	}

	return max_number_values;
}

function load_and_augment_own_images_for_classification(keys, x, y, category_counter, divide_by) {
	for (var label_nr = 0; label_nr < category_counter; label_nr++) {
		var own_images_from_label_nr = $(".own_images")[label_nr];
		var image_elements = $(own_images_from_label_nr).children().find("img,canvas");

		if(image_elements.length) {
			var label_val = $(own_images_from_label_nr).val();
			keys.push(label_val);
			labels[label_nr] = label_val;

			for (var image_idx = 0; image_idx < image_elements.length; image_idx++) {
				var image_element = image_elements[image_idx];

				var tf_img = fromPixels(image_element);

				if(!tf_img) {
					continue;
				}

				var resized_image = tf_to_float(
					resize_image(tf_img, [height, width])
				);

				resized_image = divNoNan(resized_image, divide_by);

				var this_img = array_sync(resized_image);

				x.push(this_img);
				y.push(label_nr);

				[x, y] = augment_custom_image_data(resized_image, label_nr, divide_by, x, y);
			}
		}
	}

	x = tensor(x);
	y = expand_dims(tensor(y));

	return [x, y, keys];
}

function check_x_y_in_xy_data(xy_data) {
	if(!Object.keys(xy_data).includes("x")) {
		err(language[lang]["xy_data_does_not_contain_x"]);
		return false;
	}

	if(!Object.keys(xy_data).includes("y")) {
		err(language[lang]["xy_data_does_not_contain_y"]);
		return false;
	}

	if(!Object.keys(xy_data).includes("keys")) {
		err(language[lang]["xy_data_does_not_contain_keys"]);
		return false;
	}

	return true;
}

async function get_x_and_y_from_txt_files_and_show_when_possible () {
	var x, y;

	try {
		var x_string = await _get_training_data_from_filename("x.txt");
		var y_string = await _get_training_data_from_filename("y.txt");
		x = numpy_str_to_tf_tensor(x_string);
		y = numpy_str_to_tf_tensor(y_string);

		var x_print_string = _tensor_print_to_string(x);
		var y_print_string = _tensor_print_to_string(y);

		$("#xy_display_data").html("<table border=1><tr><th>X</th><th>Y</th></tr><tr><td><pre>" + x_print_string + "</pre></td><td><pre>" + y_print_string + "</pre></td></tr></table>").show();
	} catch (e) {
		wrn(e);
		console.trace();
		x = tensor([]);
		y = tensor([]);
	}

	return [x, y];
}

function show_data_after_loading(xy_data, x, divide_by) {
	if(xy_data.x.shape.length == 4 && xy_data.x.shape[3] == 3) {
		$("#photos").show();
		for (var xy_data_idx = 0; xy_data_idx < xy_data.x.shape[0]; xy_data_idx++) {
			$("#photos").append("<canvas id='custom_training_data_img_" + xy_data_idx + "'></canvas>");
			draw_grid($("#custom_training_data_img_" + xy_data_idx)[0], 1, x[xy_data_idx], null, null, null, divide_by);
		}
	} else {
		show_xy_string(xy_data);
	}
}

async function load_custom_data(xy_data, divide_by) {
	var x = JSON.parse(JSON.stringify(xy_data.x));

	xy_data.x = tensor(xy_data.x);
	xy_data.y = tensor(xy_data.y);

	await set_labels(xy_data.keys);

	show_data_after_loading(xy_data, x, divide_by);

	return xy_data;
}

async function get_traindata_from_model_id (this_traindata_struct) {
	const model_id = this_traindata_struct["id"];
	const xy_data = await get_json("php_files/get_training_data.php?id=" + model_id);

	return xy_data;
}

async function get_images_force_download () {
	var old_force_download = force_download;

	enable_force_download();

	var images = await download_image_data(0);

	if(images.length == 0) {
		err("Could not find image data");
	}

	set_force_download(old_force_download);

	await reset_labels();

	return images;
}

function reset_photos() {
	$("#photos").html("");
}

async function get_images_and_this_data_and_category_counter_and_x_from_images (images) {
	reset_photos();

	var images = await get_images_force_download()

	var this_data = [];
	var keys = [];
	var x = null;
	var category_counter = 0;

	for (let [key, value] of Object.entries(images)) {
		keys.push(key);
		for (var image_idx = 0; image_idx < images[key].length; image_idx++) {
			const item = images[key][image_idx];
			const this_img = {key: key, item: item, category_counter: category_counter};
			this_data.push(this_img);
		}
		labels[category_counter] = key;
		category_counter++;
	}

	if(shuffle_data_is_checked()) {
		this_data = shuffle(this_data);
	}

	return [this_data, category_counter, x, images, keys];
}

async function dispose_images (images) {
	for (let [key, value] of Object.entries(images)) {
		for (var image_idx = 0; image_idx < images[key].length; image_idx++) {
			var item = images[key][image_idx];
			await dispose(item);
		}
	}
}

async function set_global_x_y_and_dispose_images(x, y, images) {
	await set_global_x_y(x, y);

	await dispose_images(images);
}

function reset_xy_display_data () {
	$("#xy_display_data").html("").hide();
}

async function get_x_and_y () {
	await reset_data();

	const divide_by = parse_float($("#divide_by").val());
	const selected_dataset_name = $("#dataset option:selected").text();
	const this_traindata_struct = traindata_struct[selected_dataset_name];
	const has_custom_data = Object.keys(this_traindata_struct).includes("has_custom_data");
	const _data_origin = $("#data_origin").val();
	const validation_split = parse_int($("#validationSplit").val());

	reset_xy_display_data();

	await jump_to_tab_if_applicable(_data_origin);

	var x = [];
	var y = [];
	var keys = [];

	var xy_data = null;

	if(has_custom_data) {
		xy_data = await get_traindata_from_model_id(this_traindata_struct);

		if(!check_x_y_in_xy_data(xy_data)) {
			return;
		}

		xy_data = await load_custom_data(xy_data, divide_by);
	} else {
		xy_data = await get_xy_data_for_noncustom_data(_data_origin, x, y, keys, divide_by);
	}

	log(language[lang]["got_data_creating_tensors"]);

	xy_data = auto_one_hot_encode_or_error(this_traindata_struct, y, xy_data);

	if(xy_data && validation_split) {
		check_if_data_is_left_after_validation_split(xy_data, validation_split);
	} else {
		wrn(`check_if_data_is_left_after_validation_split will not be executed since either xy_data (${xy_data}) or validation_split (${validation_split}) is falsy`);
	}

	xy_data_global = xy_data;

	throw_exception_if_x_y_warning();

	return xy_data;
}

async function get_xy_data_for_noncustom_data(_data_origin, x, y, keys, divide_by) {
	var xy_data;
	if(_data_origin == "default") {
		xy_data = await get_default_image_data(x, y, keys)
	} else if(_data_origin == "image") {
		xy_data = generate_data_from_images(is_classification, x, y, keys, divide_by)
	} else if (_data_origin == "tensordata") {
		xy_data = get_xy_data_from_tensordata();
	} else if (_data_origin == "csv") {
		xy_data = await get_x_y_from_csv();
	} else {
		alert("Unknown data type: " + _data_origin);
	}

	reset_data_div()

	return xy_data;
}

function reset_data_div() {
	$("#reset_data").hide();
}

async function get_default_image_data(x, y, keys) {
	var this_data, category_counter, images;
	if(await input_shape_is_image()) {
		[this_data, category_counter, x, images, keys] = await get_images_and_this_data_and_category_counter_and_x_from_images(images);

		[x, y] = await load_and_augment_images_and_y(this_data, x, y)
		if (x === null || y === null) {
			wrn(`get_x_and_y: x or y was null`);
			return null;
		}

		await set_global_x_y_and_dispose_images(x, y, images);
	} else {
		[x, y] = await get_x_and_y_from_txt_files_and_show_when_possible()
	}

	var xy_data = {"x": x, "y": y, "keys": keys, "number_of_categories": category_counter};

	return xy_data;
}

function generate_data_from_images(is_classification, x, y, keys, divide_by) {
	l(language[lang]["generating_data_from_images"]);

	const category_counter = $(".own_image_label").length;

	if(is_classification) {
		[x, y, keys] = load_and_augment_own_images_for_classification(keys, x, y, category_counter, divide_by);
	} else {
		[x, y, keys] = get_x_and_y_from_maps(category_counter, keys, x, y, divide_by);
	}

	if(shuffle_data_is_checked()) {
		shuffleCombo(x, y);
	}

	l(language[lang]["done_generating_data_from_images"]);

	var xy_data = {"x": x, "y": y, "keys": keys, "number_of_categories": category_counter};

	return xy_data;
}

function get_x_and_y_from_maps (category_counter, keys, x, y, divide_by) {
	var maps = [];

	if(is_auto_augment()) {
		l(language[lang]["auto_augmentation_currently_not_supported_for_segmentation"]);
	}

	for (var label_nr = 0; label_nr < category_counter; label_nr++) {
		const $own_images_label = $(".own_images")[label_nr];
		var image_elements = $($own_images_label).children().find("img,canvas");
		if(image_elements.length) {
			var label_val = $($own_images_label).val();
			keys.push(label_val);
			labels[label_nr] = label_val;

			for (var image_idx = 0; image_idx < image_elements.length; image_idx++) {
				var image_element = image_elements[image_idx];
				var maps_or_false = get_maps_from_image_element(x, y, maps, image_element, divide_by)
				if (maps_or_false === false) {
					continue;
				}

				maps = maps_or_false;
			}
		}
	}

	x = tensor(x);
	y = tensor(maps);

	return [x, y, keys];
}

function get_maps_from_image_element (x, y, maps, image_element, divide_by) {
	var id = image_element.id;

	if(!id.endsWith("_layer")) {
		[x, y] = load_and_resize_image_and_add_to_x_and_class(x, y, image_element, label_nr);

		var maps_or_false = load_maps_from_id(id, maps, divide_by);

		if (maps_or_false === false) {
			return false;
		}

		maps = maps_or_false;
	}

	return maps;
}

async function load_and_augment_images_and_y(this_data, x, y) {
	x = await get_x_ones_from_image_input_shape();

	for (var image_idx = 0; image_idx < this_data.length; image_idx++) {
		const this_img = this_data[image_idx];
		const unresized_image = this_img["item"];

		if (unresized_image === null) {
			err(`unresized image is null!`);
		} else {
			[x, y] = await resize_augment_invert_flip_left_right_rotate(image_idx, unresized_image, this_img, x, y)
			if (y === null || x === null) {
				return [null, null, null];
			}
		}
	}

	return [x, y]
}

async function get_x_ones_from_image_input_shape() {
	var x = tidy(() => {
		return expand_dims(ones([height, width, 3]));
	});

	return x;
}

async function set_global_x_y(x, y) {
	await set_global_x(x);
	set_global_y(y);
}

function set_global_y(y) {
	y = tensor(y);
	global_y = y;
}

async function set_global_x(x) {
	var x_arr = array_sync(x);

	tidy(() => {
		x = tensor(x_arr);
		global_x = x;
	});
}

async function get_concatted_x (x, resized_image) {
	var await_outside = [];

	x = tidy(() => {
		var concatted = tf_concat(x, resized_image);
		await_outside.push(dispose(x));
		return concatted;
	});

	await Promise.all(await_outside);

	return x;
}

function load_maps_from_id (id, maps, divide_by) {
	try {
		var this_map_tensor = tidy(() => {
			var image_from_layer = fromPixels($("#" + id + "_layer")[0]);
			var res = resize_image(image_from_layer, [model.outputShape[1], model.outputShape[2]]);
			return res;
		});

		var this_map = tf.tidy(() => {
			var res = array_sync(divNoNan(this_map_tensor, divide_by));
			dispose(this_map_tensor); // await not possible
			return res;
		});
		maps.push(this_map);
	} catch (e) {
		err(e);
		return false;
	}

	return maps;
}

function load_and_resize_image_and_add_to_x_and_class(x, y, image_element, label_nr) {
	var tf_img = fromPixels(image_element);

	var resized_image = tf.tidy(() => {
		return tf_to_float(
			resize_image(tf_img, [height, width])
		);
	});

	resized_image = tidy(() => {
		var res = divNoNan(resized_image, divide_by);
		dispose(resized_image); // await not possible
		return res;
	});

	var this_img = array_sync(resized_image);
	x.push(this_img);
	y.push(label_nr);

	return [x, y];
}

function auto_one_hot_encode_or_error(this_traindata_struct, y, xy_data) {
	const loss = get_loss();

	if(
		["categoricalCrossentropy", "binaryCrossentropy"].includes(loss) &&
		!this_traindata_struct["has_custom_data"] &&
		is_classification &&
		y.length > 1
	) {
		try {
			xy_data.y = tidy(() => {
				return oneHot(tensor1d(y, "int32"), xy_data["number_of_categories"]);
			});
		} catch (e) {
			if(("" + e).includes("depth must be >=2, but it is 1")) {
				alert("You need at least 2 or more categories to start training with categoricalCrossentropy or binaryCrossentropy");
				return null;
			} else {
				write_error(e, e.toString().includes("Error in oneHot: depth must be >=2") ? function () { // cannot be async
					set_loss("meanSquaredError");
					set_metric("meanSquaredError");
					log(`${language[lang]["set_loss_and_metric_to_mse_because_error"]}: '${e.toString()}'`);
				} : null, e.toString().includes("Error in oneHot: depth must be >=2"));
			}
		}
	}

	return xy_data;
}

function get_xy_data_from_tensordata() {
	//log("x_file:", x_file, "y_file:", y_file);
	const x = numpy_str_to_tf_tensor(x_file);
	const y = numpy_str_to_tf_tensor(y_file);

	const xy_data = {"x": x, "y": y};

	return xy_data;
}

function check_if_data_is_left_after_validation_split(xy_data, validation_split) {
	var number_of_training_data = xy_data["y"].shape[0];
	var number_of_training_data_left_after_split = Math.floor((1-(validation_split/100)) * number_of_training_data);

	if(number_of_training_data == 0) {
		l(language[lang]["somehow_there_were_zero_training_data_consider_it_a_bug"]);
	} else if(number_of_training_data_left_after_split < 1) {
		var new_validation_split = 100 - Math.floor((1/number_of_training_data) * 100);
		if(new_validation_split > 20) {
			new_validation_split = 20;
		}
		l(sprintf(language[lang]["old_valsplit_n_was_too_high_set_to_m"], validation_split, new_validation_split));
		$("#validationSplit").val(new_validation_split);
	}
}

function throw_exception_if_x_y_warning() {
	var error_string  = _xs_xy_warning(xy_data_global);
	if(error_string) {
		throw new Error(error_string);
	}
}

function augment_custom_image_data(resized_image, label_nr, divide_by, x, y) {
	if(is_auto_augment()) {
		/*
		l(language[lang]["auto_augmenting_images"]);

		if($("#augment_rotate_images").is(":checked")) {
			for (var degree = 0; degree < 360; degree += (360 / $("#number_of_rotations").val())) {
				var augmented_img = rotateWithOffset(expand_dims(resized_image), degrees_to_radians(degree));
				x.push(array_sync(augmented_img));
				y.push(label_nr);

				if($("#augment_invert_images").is(":checked")) {
					l(language[lang]["inverted_image_that_has_been_turned"] + " " + degree + "°");
					x.push(array_sync(abs(add(augmented_img, (-255 / divide_by)))));
					y.push(label_nr);
				}

				if($("#augment_flip_left_right").is(":checked")) {
					l(language[lang]["flip_left_right_that_has_been_turned"] + " " + degree + "°");
					x.push(array_sync(flipLeftRight(augmented_img))[0]);
					y.push(label_nr);
				}
			}
		}

		if($("#augment_invert_images").is(":checked")) {
			l(language[lang]["inverted_image"]);
			x.push(array_sync(abs(add(expand_dims(resized_image), (-255 / divide_by)))));
			y.push(label_nr);
		}

		if($("#augment_flip_left_right").is(":checked")) {
			l(language[lang]["flip_left_right"]);
			var flipped = flipLeftRight(array_sync(expand_dims(resized_image)))[0];
			x.push(flipped);
			y.push(label_nr);
		}
		*/

		wrn("Augmenting custom data is disabled because it is not yet fully implemented");
	}

	return [x, y];
}

function _xs_xy_warning (xs_and_ys) {
	var error_string = "";
	if(xs_and_ys) {
		if(Object.keys(xs_and_ys).includes("x")) {
			if(xs_and_ys["x"].shape.toString() == "0") {
				error_string += "No X-data [1]! Do you have custom images loaded? ";
			}
		} else {
			error_string += "No X-data [2]! Do you have custom images loaded? ";
		}

		if(Object.keys(xs_and_ys).includes("y")) {
			if(xs_and_ys["y"].shape.toString() == "0") {
				error_string += "No Y-data [1]! Do you have custom images loaded? ";
			}
		} else {
			error_string += "No Y-data [2]! Do you have custom images loaded? ";
		}
	} else {
		error_string = "No xy_data. Maybe an error while augmenting data?";
	}

	return error_string;
}

function add_photo_to_gallery(url) {
	assert(typeof (url) == "string", url + " is not a string but " + typeof (url));

	var photoscontainer = $("#photoscontainer");

	if (photoscontainer.css("display") == "none") {
		photoscontainer.show();
	}

	var img_tag = "<img onclick=\"predict_data_img(this, 'image')\" class='class_download_img' src='" + url + "' height='" + height + "' width='" + width + "' />";
	$("#photos").show().prepend(img_tag);

}

async function url_to_tf (url, dont_load_into_tf=0) {
	assert(typeof(url) == "string", "url_to_tf accepts only strings as url parameter, got: " + typeof(url));

	headerdatadebug("url_to_tf(" + url + ")");

	const divide_by = parse_float($("#divide_by").val());

	try {
		add_photo_to_gallery(url);

		var tf_img = (async () => {
			let img = await load_image(url);

			var resized_image = [];

			if(!dont_load_into_tf) {
				resized_image = tidy(() => {
					var res = fromPixels(img);

					_custom_tensors["" + res.id] = [get_stack_trace(), res, tensor_print_to_string(res)];
					_clean_custom_tensors();

					resized_image = tf_to_float(
						expand_dims(
							resize_image(res, [height, width])
						)
					);

					_custom_tensors["" + res.id] = [get_stack_trace(), res, tensor_print_to_string(res)];
					_clean_custom_tensors();

					resized_image = divNoNan(resized_image, divide_by);

					_custom_tensors["" + resized_image.id] = [get_stack_trace(), resized_image, tensor_print_to_string(resized_image)];
					_clean_custom_tensors();

					return resized_image;
				});
			} else {
				return false;
			}

			_custom_tensors["" + resized_image.id] = [get_stack_trace(), resized_image, tensor_print_to_string(resized_image)];
			_clean_custom_tensors();

			check_if_tf_data_is_empty_when_it_should_not_be(resized_image, dont_load_into_tf);

			return resized_image;
		})();

		return tf_img;
	} catch (e) {
		header_error("url_to_tf(" + url + ") failed: " + e);
	}

	return null;
}

function check_if_tf_data_is_empty_when_it_should_not_be(resized_image, dont_load_into_tf) {
	if(!resized_image && !dont_load_into_tf) {
		wrn("[download_image_data] resized_image is empty, though it shouldn't be");
	}
}

async function determine_input_shape () {
	if(await input_shape_is_image()) {
		await set_input_shape("[" + width + ", " + height + ", 3]");
	}
}

async function _get_training_data() {
	var url = "traindata/index.php?dataset=" + get_chosen_dataset() + "&max_number_of_files_per_category=" +  $("#max_number_of_files_per_category").val();

	var res = await get_cached_json(url);

	return res;
}

function median(values) {
	if(values.length ===0) throw new Error("No inputs");

	values.sort(function(a,b){
		return a-b;
	});

	var half = Math.floor(values.length / 2);

	if (values.length % 2) {
		return values[half];
	}

	return (values[half - 1] + values[half]) / 2.0;
}

function decille (arr, percentage) {
	typeassert(arr, array, "arr");

	arr.sort();
	var len = arr.length;
	var per =  Math.floor(len*percentage) - 1;

	return per;
}

async function reset_data () {
	if(!xy_data_global === null) {
		if(Object.keys(xy_data_global).includes("x")) {
			await dispose(xy_data_global["x"]);
		}
		if(Object.keys(xy_data_global).includes("y")) {
			await dispose(xy_data_global["y"]);
		}
	}

	reset_data_div();
}

function parse_dtype (val) {
	if(val.match(/^[+-]?\d+$/)) {
		return parse_int(val);
	} else if(val.match(/^[+-]?\d+\.\d+$/)) {
		return parse_float(val);
	} else {
		return val;
	}
}

function parse_line (line, seperator) {
	typeassert(line, string, "line");
	typeassert(seperator, string, "seperator");

	var c = line.split("");

	var i = 0;

	var items = [];

	var current_item = "";

	while (i < c.length) {
		if(c[i] == seperator) {
			items.push(parse_dtype(current_item));
			current_item = "";
		} else {
			current_item += c[i];
		}
		i++;
	}

	if(current_item.length) {
		items.push(parse_dtype(current_item));
	}

	return items;
}

function findDuplicates (arr) {
	typeassert(arr, array, "arr");

	let sorted_arr = arr.slice().sort(); // You can define the comparing function here.
	// JS by default uses a crappy string compare.
	// (we use slice to clone the array so the
	// original array won't be modified)
	let results = [];
	for (let sorted_arr_idx = 0; sorted_arr_idx < sorted_arr.length - 1; sorted_arr_idx++) {
		if (sorted_arr[sorted_arr_idx + 1] == sorted_arr[sorted_arr_idx]) {
			results.push(sorted_arr[sorted_arr_idx]);
		}
	}
	return results;
}

function onlyUnique(value, index, _array) {
	typeassert(_array, array, "array");
	return _array.indexOf(value) === index;
}

function parse_csv_file (csv_file) {
	typeassert(csv_file, string, "csv_file");

	var parse_errors = [];

	var seperator = get_csv_seperator();

	assert(seperator.length == 1, "Seperator must have length of 1");

	var seperator_at_end_re = new RegExp("/" + seperator + "+$/", "gm");

	csv_file = csv_file.replace(seperator_at_end_re, "");

	var j = 0;

	csv_file = csv_file
		.split("\n")
		.map((item, i, allItems) => {
			j++;
			if (i !== allItems.indexOf(item)) {
				if(!item.match(/^\s*$/)) {
					parse_errors.push(`Line ${i} is a duplicate of an earlier line. It will be ignored.`);
				}
				return "";
			}
			return item;
		})
		.join("\n");

	if(typeof(seperator) == "undefined") {
		seperator = ",";
	}

	var lines = csv_file.split("\n");

	var head = parse_line(lines[0], seperator);

	var duplicate_headers = findDuplicates(head);

	if(duplicate_headers.length) {
		parse_errors.push(`${trm("duplicate_header_entries_found")}: ${duplicate_headers.filter(onlyUnique).join(", ")}`);
	}

	var data = [];

	for (var line_idx = 1; line_idx < lines.length; line_idx++) {
		if(!lines[line_idx].match(/^\s*$/)) {
			var parsed_line_results = parse_line(lines[line_idx], seperator);

			if(head.length != parsed_line_results.length) {
				parse_errors.push(`Line ${line_idx} ("${lines[line_idx]}") has ${parsed_line_results.length} entries, but the header has ${head.length} entries. Ignoring this line.`);
			} else {
				data.push(parsed_line_results);
			}
		}
	}

	if(!data.length) {
		parse_errors.push(trm("no_data_lines_found"));
	}

	if(!head.length) {
		parse_errors.push(trm("no_header_lines_found"));
	}

	if(parse_errors.length) {
		if(parse_errors.length > 1) {
			$("#csv_parse_errors").html("<ul><li>" + parse_errors.join("</li>\n<li>") + "</li></ul>").show();
		} else {
			$("#csv_parse_errors").html(parse_errors.join("")).show();
		}

		update_translations(); // await not possible
	} else {
		$("#csv_parse_errors").html("").hide();
	}

	return {"head": head, "data": data};
}

function get_or_insert_label (item) {
	for (var labels_idx = 0; labels_idx < labels.length; labels_idx++) {
		if(labels[labels_idx] == item) {
			return labels_idx;
		}
	}

	labels.push(item);

	return labels.length - 1;
}

async function get_data_struct_by_header(header, parsed, skip_nr, in_goto) {
	typeassert(header, array, "header");

	await reset_labels();
	var y_between_0_and_1 = true;
	var is_incomplete = false;
	var indices = {};

	for (var header_idx = 0; header_idx < header.length; header_idx++) {
		indices[header[header_idx]] = parsed.head.indexOf(header[header_idx]);
	}

	var data = [];
	if(!in_goto) {
		col_contains_string = [];
	}

	for (var line_nr = 0; line_nr < parsed.data.length; line_nr++) {
		var line = [];

		for (var col_nr = 0; col_nr < header.length; col_nr++) {
			var skip_col_nr = col_nr + skip_nr;
			var element = $($(".header_divide_by")[skip_col_nr]).val();
			if("" + element == "null" || "" + element == "undefined") {
				element = 1;
			}

			var header_multiply = parse_float(element);
			var csv_element = parsed.data[line_nr][indices[header[col_nr]]];
			var to_push = undefined;
			if((!col_contains_string.includes(col_nr) && (looks_like_number(csv_element) || csv_element)) || csv_element === undefined) {
				if(csv_element === undefined || csv_element == null || csv_element == "") {
					dbg(language[lang]["ignore_empty_csv_elements"]);
					to_push = 0;
				} else if (typeof(csv_element) == "number" || looks_like_number(csv_element)) {
					var ln = parse_float(csv_element);

					if(header_multiply) {
						ln = ln / header_multiply;
					}

					to_push = ln;

					if(y_between_0_and_1) {
						if(ln < 0 || ln > 1) {
							y_between_0_and_1 = false;
						}
					}
				} else {
					var numberPattern = /([+-]?\d+(?:\.?\d*)?)/;

					var match = csv_element.match(numberPattern);

					if(match !== null) {
						csv_element = match[1];
					}

					if(looks_like_number(csv_element)) {
						var ln = parse_float(csv_element);
						if(header_multiply) {
							ln = ln / header_multiply;
						}

						to_push = ln;

						if(y_between_0_and_1) {
							if(ln < 0 || ln > 1) {
								y_between_0_and_1 = false;
							}
						}
					} else {
						wrn(`${language[lang]["invalid_value_in_csv_detected"]}: "${csv_element}"`);
					}
				}
			} else {
				if(!col_contains_string.includes(col_nr)) {
					col_contains_string.push(col_nr);
				}

				if(!in_goto) {
					return await get_data_struct_by_header(header, parsed, skip_nr, true);
				}

				var element_id = get_or_insert_label(csv_element);
				to_push = element_id;
			}

			if(Number.isNaN(to_push) || to_push === undefined || (typeof(to_push) == "string" && to_push == "")) {
				//return { "is_incomplete": true };
			}

			line.push(to_push);
		}

		data.push(line);
	}

	return { "data": data, "y_between_0_and_1": y_between_0_and_1, "is_incomplete": is_incomplete };
}

function get_headers (headers) {
	var x_headers = [];
	var y_headers = [];

	for (var header_idx = 0; header_idx < headers.length; header_idx++) {
		const $this_header_select = $($(".header_select")[header_idx]);
		var data_name = $this_header_select.attr("name");
		var type = $this_header_select.val();

		if(type == "X") {
			x_headers.push(data_name);
		} else if(type == "Y") {
			y_headers.push(data_name);
		}
	}

	return {"x": x_headers, "y": y_headers};
}

function get_csv_seperator () {
	var seperator = $("#seperator").val() || ",";

	if(seperator == "\\t") {
		return "\t";
	}

	return seperator;
}

function shuffle_data_is_checked() {
	return $("#shuffle_data").is(":checked");
}
function auto_one_hot_is_checked() {
	return $("#auto_one_hot_y").is(":checked")
}

function disable_auto_one_hot_encoding () {
	$("#auto_one_hot_y").prop("checked", false);
}

async function get_x_y_from_csv () {
	if(csv_global_x) {
		await dispose(csv_global_x);
	}

	if(csv_global_y) {
		await dispose(csv_global_y);
	}

	var seperator = get_csv_seperator();
	var csv = $("#csv_file").val();
	var is_one_hot_encoded = false;

	var headers = $(".header_select");

	var headers_data = get_headers(headers);
	var x_headers = headers_data["x"];
	var y_headers = headers_data["y"];

	await set_labels(y_headers);

	var parsed = parse_csv_file(csv);

	var x_data = await get_data_struct_by_header(x_headers, parsed, 0, false);
	if(x_data.is_incomplete) {
		l(language[lang]["x_data_incomplete"]);
		l(language[lang]["y_data_incomplete"]);
		return "incomplete";
	}

	var y_data = await get_data_struct_by_header(y_headers, parsed, x_headers.length, false);
	if(y_data.is_incomplete) {
		l(language[lang]["y_data_incomplete"]);
		return "incomplete";
	}

	if(shuffle_data_is_checked()) {
		shuffleCombo(x_data["data"], y_data["data"]);
	}

	if(auto_one_hot_is_checked()) {
		if(y_headers.length == 1) {
			if(labels.length > 1) {
				y_data["data"] = tidy(() => { return array_sync(oneHot(tensor1d(y_data["data"].flat(), "int32"), labels.length));});
				auto_adjust_number_of_neurons(labels.length);
				set_last_layer_activation_function("softmax");
				is_one_hot_encoded = true;
				l(language[lang]["enough_labels_for_one_hot_encoding"] + " &#x2705;");
			} else {
				l(sprintf(language[lang]["not_enough_labels_for_one_hot_encoding_got_n_need_at_least_two"], labels.length) + " &#10060;");
			}
		} else {
			if(auto_one_hot_is_checked()) {
				l(language[lang]["currently_there_is_a_bug_for_one_hot_encoding_with_only_one_vector_so_its_disabled"]);
				disable_auto_one_hot_encoding();
			}
		}
	}

	var x = x_data["data"];
	var y = y_data["data"];

	var y_between_0_and_1 = y_data["y_between_0_and_1"];

	//log(y)

	x = tidy(() => { return tensor(x); });
	y = tidy(() => { return tensor(y); });

	csv_global_x = x;
	csv_global_y = y;

	if(is_one_hot_encoded) {
		set_loss_and_metric(labels.length == 2 ? "binaryCrossentropy" : "categoricalCrossentropy");
	}

	return {
		"x": x,
		"y": y,
		"keys": y_headers,
		"number_of_categories": y_headers.length,
		"y_between_0_and_1": y_between_0_and_1,
		"is_one_hot_encoded": is_one_hot_encoded
	};
}

/*
 * This function is for saving X and Y data later on to an external DB.
*/

function set_force_download(val) {
	force_download = !!val;
}

function enable_force_download() {
	set_force_download(1);
}

function disable_force_download () {
	set_force_download(0);
}

async function get_x_y_as_array () {
	while (started_training) {
		l(language[lang]["awaiting_finishing_of_training"]);
		await delay(1000);
	}

	enable_force_download();
	var data = await get_x_and_y();
	disable_force_download();

	var ret = JSON.stringify({ x: array_sync(data.x), y: array_sync(data.y) });

	await dispose(data["x"]);
	await dispose(data["y"]);

	return ret;
}

async function take_image_from_webcam_n_times (elem) {
	var number = parse_int($("#number_of_series_images").val());
	var delaybetween = parse_int($("#delay_between_images_in_series").val());

	let timerInterval;
	Swal.fire({
		title: language[lang]["soon_a_photo_series_will_start"],
		html: language[lang]["first_photo_will_be_taken_in_n_seconds"],
		timer: 2000,
		timerProgressBar: true,
		didOpen: () => {
			Swal.showLoading();
			const b = Swal.getHtmlContainer().querySelector("b");
			timerInterval = setInterval(() => {
				var tl = Swal.getTimerLeft() / 1000;
				tl = tl.toFixed(1);
				b.textContent = tl;
			}, 100);
		},
		willClose: () => {
			clearInterval(timerInterval);
		}
	}).then(async (result) => {
		for (var number_idx = 0; number_idx < number; number_idx++) {
			l(sprintf(language[lang]["taking_image_n_of_m"], number_idx + 1, number));
			await update_translations();
			await take_image_from_webcam(elem, 1, number_idx == 0);
			await delay(delaybetween*1000);
		}

		l(sprintf(language[lang]["done_taking_n_images"], number));
	});

	await last_shape_layer_warning();
}

async function take_image_from_webcam (elem, nol) {
	typeassert(elem, object, "elem");

	if(!inited_webcams) {
		await get_data_from_webcam();
	}

	if(!nol) {
		l(language[lang]["taking_photo_from_webcam"]);
	}

	if(!cam) {
		await set_custom_webcam_training_data();
		await show_webcam(1);
	}

	var stream_width = cam.stream.getVideoTracks(0)[0].getSettings().width;
	var stream_height = cam.stream.getVideoTracks(0)[0].getSettings().height;

	var category = $(elem).parent();
	var cam_image = await cam.capture();
	cam_image = tf_to_float(expand_dims(resize_image(cam_image, [stream_height, stream_width])));
	cam_image = array_sync(cam_image)[0];

	var category_name = $(category).find(".own_image_label").val()

	var base_id = await md5(category_name);

	var i = 1;
	var id = base_id + "_" + i;

	while ($("#" + id + "_canvas").length != 0) {
		id = base_id + "_" + i;
		i++;
	}

	// TODO: Cannot easily changed to span because of image map generation. The image map generator drawing canvas is, when not in a single line, not properly aligned.
	$(category).find(".own_images").prepend(
		"<div class=\"own_image_span\">" +
			`<canvas data-category="${category_name}" id="${id}_canvas" width="${stream_width}" height="${stream_height}"></canvas><span onclick="delete_own_image(this)">&#10060;&nbsp;&nbsp;&nbsp;</span>` +
		"</div><br>"
	);

	var c = document.getElementById(id + "_canvas");
	var ctx = c.getContext("2d");

	for(var img_x = 0; img_x < cam_image.length; img_x++){
		for(var img_y = 0; img_y < cam_image[0].length; img_y++){
			var r = cam_image[img_x][img_y][0];
			var g = cam_image[img_x][img_y][1];
			var b = cam_image[img_x][img_y][2];
			ctx.fillStyle = "rgba(" + r + "," + g + "," + b + ", 1)";
			ctx.fillRect(img_y, img_x, 1, 1);
		}
	}

	enable_train();
	if(!nol) {
		l(language[lang]["took_photo_from_webcam"]);
	}

	await last_shape_layer_warning();
}

function chi_squared_test(arr) {
	typeassert(arr, array, "arr");

	// Create a histogram of the data
	const histogram = {};
	for (let arr_idx = 0; arr_idx < arr.length; arr_idx++) {
		const arr_elem = arr[arr_idx];
		if (!histogram[arr_elem]) {
			histogram[arr_elem] = 1;
		} else {
			histogram[arr_elem]++;
		}
	}
	// Check if the expected frequency is zero
	if (Object.keys(histogram).length === 1) {
		return 1;
	}
	// Calculate the expected frequency of each value
	const expectedFrequency = arr.length / Object.keys(histogram).length;

	// Calculate the chi-squared value
	let chiSquared = 0;
	for (const key in histogram) {
		const observedFrequency = histogram[key];
		chiSquared += Math.pow(observedFrequency - expectedFrequency, 2) / expectedFrequency;
	}

	// Look up the chi-squared distribution table to find the probability
	const degreesOfFreedom = Object.keys(histogram).length - 1;
	const probability = jStat.chisquare.cdf(chiSquared, degreesOfFreedom);

	return probability;
}

function array_likelihood_of_being_random (_array) {
	typeassert(_array, array, "_array");

	var chi = chi_squared_test(_array);

	var res = 1 - chi;

	return res;
}

function image_element_looks_random (imgelem) {
	var t = reshape(fromPixels(imgelem), [-1]);
	var res = array_likelihood_of_being_random(array_sync(t));

	return res;
}

function maximally_activated_neurons_randomness () {
	var canvasses = $("#maximally_activated_content").find("canvas");

	var struct = {};

	for (var canvas_idx = 0; canvas_idx < canvasses.length; canvas_idx++) {
		var model_hash = $(canvasses[canvas_idx]).data("model_hash");
		var data_layer = $(canvasses[canvas_idx]).data("layer");
		var data_neuron = $(canvasses[canvas_idx]).data("neuron");

		if(typeof(struct[model_hash]) == "undefined") {
			struct[model_hash] = {};
		}

		if(typeof(struct[model_hash][data_layer]) == "undefined") {
			struct[model_hash][data_layer] = [];
		}

		var res = image_element_looks_random(canvasses[canvas_idx]);

		//log(`hash: ${model_hash}, layer: ${data_layer}, neuron: ${data_neuron}: ${res}`);

		struct[model_hash][data_layer][data_neuron - 1] = res;

		//log("Done struct", struct);
	}

	return struct;
}

/*
 * Returns 0 if the number of neurons can stay the same
 * Returns -n if n neurons are random
 * Returns 1 if the number of neurons should be increased
 */
async function get_new_number_of_neurons_according_to_visualization_randomness (layer) {
	if(!model_is_trained) {
		log(language[lang]["this_algorithm_is_useless_when_the_network_is_not_trained"]);
		return 0;
	}

	if(layer == (get_number_of_layers() - 1)) {
		log(language[lang]["cannot_remove_last_layer"]);
		return 0;
	}

	var layer_can_be_visualized = $($(".layer_setting")[layer]).find(".visualize_button");

	if(layer_can_be_visualized) {
		var current_model_config_hash = await get_model_config_hash();
		await draw_maximally_activated_layer(layer, get_layer_type_array()[layer]);

		var activated_neurons = maximally_activated_neurons_randomness();

		var number_of_neurons = activated_neurons[current_model_config_hash][layer].length;
		var neurons_that_learnt_something = 0;

		for (var activated_neuron_idx = 0; activated_neuron_idx < activated_neurons[current_model_config_hash][layer].length; activated_neuron_idx++) {
			// 0: something was learned, 1: nothing was learned
			// threshold: 0.01
			if(activated_neurons[current_model_config_hash][layer][activated_neuron_idx] > 0.02) {
				neurons_that_learnt_something++;
			}
		}

		var n = neurons_that_learnt_something - number_of_neurons;

		if (n <= 0) {
			return n;
		} else {
			return 1;
		}
	} else {
		log(language[lang]["cannot_visualize_layer"] + " " + layer);
		return null;
	}
}

async function adjust_number_of_neurons (layer) {
	var original_epochs = parse_int($("#epochs").val());

	set_epochs(10);

	await train_neural_network();

	var adjust_neurons = await get_new_number_of_neurons_according_to_visualization_randomness(layer);
	if(adjusted_neurons_total === null) {
		return;
	}

	var adjusted_neurons_total = 0;

	while (adjust_neurons != 0) {
		await train_neural_network();
		adjust_neurons = await get_new_number_of_neurons_according_to_visualization_randomness(layer);

		var old_value = parse_int($($(".layer_options_internal")[layer]).find(".filters,.units").val());
		var new_value = old_value + adjust_neurons;
		adjusted_neurons_total += Math.abs(adjust_neurons);
		void(0); log("new_value", new_value);
		$($(".layer_options_internal")[layer]).find(".filters,.units").val(new_value).trigger("change");
		await delay(1000);
	}

	set_epochs(original_epochs);
	return adjusted_neurons_total;
}

async function get_own_tensor (element) {
	assert(typeof(element) == "object", "element is not an object");

	var text = $(element).val();
	var id = $(element).attr("id");

	var msg = "";
	var latex = "";
	var tensor_array = [];

	try {
		tensor_array = JSON.parse(text);
	} catch (e) {
		msg += "" + e;
	}

	try {
		latex = arbitrary_array_to_latex(tensor_array);
	} catch (e) {
		msg += "" + e;
	}

	if(latex) {
		msg += latex;
	}

	if(msg) {
		if(id == "x_tensor") {
			$("#x_preview").html(msg).show();
		} else if (id == "y_tensor") {
			$("#y_preview").html(msg).show();
		} else {
			throw new Error("Unknown field: " + id);
		}
	}

	log([tensor_array, latex]);
	return [tensor_array, latex];
}

/*
	TODO: await get_own_tensor()
*/

async function confusion_matrix(y) {
	if(!y.length) {
		if(current_epoch < 2) {
			dbg(`[confusion_matrix] ${language[lang]["no_y "]}`);
		}
		return "";
	}

	if(!is_classification) {
		wrn("[confusion_matrix] Only works with classification");
		return "";
	}

	if(!model) {
		wrn("[confusion_matrix] model not defined. Cannot continue");
	}
	
	var imgs = $("#photos, #own_images_container").find("img,canvas");

	if(!imgs.length) {
		if(current_epoch == 1) {
			wrn("[confusion_matrix] No images found");
		}
		return "";
	}
	
	var table_data = {};
	
	var num_items = 0;

	for (var img_idx = 0; img_idx < imgs.length; img_idx++) {
		var image_element = imgs[img_idx];
		var image_element_xpath = get_element_xpath(image_element);

		var predicted_tensor = confusion_matrix_and_grid_cache[image_element_xpath];

		if(!predicted_tensor) {
			var img_tensor = tidy(() => {
				try {
					var res = cached_load_resized_image(image_element);
					return res;
				} catch (e) {
					err(e);
					return null;
				}
			});

			if(img_tensor === null) {
				wrn("[confusion_matrix] Could not load image from pixels from this element:", image_element);
				await dispose(img_tensor);
				continue;
			}

			try {
				predicted_tensor = tidy(() => {
					return model.predict(img_tensor);
				});

				predicted_tensor = tidy(() => {
					var _res = array_sync(predicted_tensor)[0];
					dispose(predicted_tensor); // await not possible
					return _res;
				});

				confusion_matrix_and_grid_cache[image_element_xpath] = predicted_tensor;
			} catch (e) {
				if(Object.keys(e).includes("message")) {
					e = e.message;
				}

				dbg(language[lang]["cannot_predict_image"] + ": " + e);

				await dispose(img_tensor);
				await dispose(predicted_tensor);

				continue;
			}
		}

		if(!predicted_tensor) {
			err("[confusion_matrix] Could not get predicted_tensor");
			continue;
		}

		if(!predicted_tensor) {
			dbg(language[lang]["predictions_tensor_was_empty"]);

			await dispose(img_tensor);
			await dispose(predicted_tensor);

			continue;
		}

		assert(Array.isArray(predicted_tensor), `predicted_tensor is not an array, but ${typeof(predicted_tensor)}, ${JSON.stringify(predicted_tensor)}`);

		if(predicted_tensor === null || predicted_tensor === undefined) {
			dbg(language[lang]["predicted_tensor_was_null_or_undefined"]);
			continue;
		}

		var predicted_index = predicted_tensor.indexOf(Math.max(...predicted_tensor));
		var predicted_category = labels[predicted_index];

		var src = image_element.src;
		var correct_category = extractCategoryFromURL(src, image_element);

		if(!Object.keys(table_data).includes(correct_category)) {
			table_data[correct_category] = {};
		}

		if(Object.keys(table_data[correct_category]).includes(predicted_category)) {
			table_data[correct_category][predicted_category]++;
		} else {
			table_data[correct_category][predicted_category] = 1;
		}

		await dispose(img_tensor);
		await dispose(predicted_tensor);

		num_items++;
	}

	if(!num_items) {
		wrn("[confusion_matrix] Could not get any items!");
		return "";
	}

	var str = "<table class=\"confusion_matrix_table\">" ;
	for (var y_idx = 0; y_idx <= y.length; y_idx++) {
		if(y_idx == 0) {
			str += "<tr>";
			str += "<th class='confusion_matrix_tx' style='text-align: right'><i>" + language[lang]["correct_category"] + "</i> &rarr;<br><i>" + language[lang]["predicted_category"] + "</i> &darr;</th>";
			for (var y_idx_2 =  0; y_idx_2 < y.length; y_idx_2++) {
				const top_header = y[y_idx_2];

				str += `<th class='confusion_matrix_tx'>${top_header}</th>`;
			}
			str += "</tr>";
		} else {
			str += "<tr>";
			for (var y_idx_2 =  0; y_idx_2 <= y.length; y_idx_2++) {
				const left_header = y[y_idx - 1];
				const second_left_header = y[y_idx_2 - 1];

				if(y_idx_2 == 0) {
					str += `<th class="confusion_matrix_tx">${left_header}</th>`;
				} else {
					var text = "0";

					if(Object.keys(table_data).includes(left_header) && Object.keys(table_data[left_header]).includes(second_left_header)) {
						text = table_data[left_header][second_left_header];
					}

					let bg_color = text === "0" ? "" : (left_header === second_left_header ? "#83F511" : "#F51137");
					str += `<td class="confusion_matrix_tx"${bg_color ? ` style="background-color: ${bg_color}"` : ""}>${text}</td>`;
				}
			}
			str += "</tr>";
		}
	}
	str += "</table>";

	return str;
}

async function confusion_matrix_to_page () {
	if(!labels && labels.length != 0) {
		return;
	}

	if(!is_classification) {
		return;
	}

	var confusion_matrix_html = await confusion_matrix(labels);

	if(confusion_matrix_html) {
		var str = "<h2>Confusion Matrix:</h2>\n" + confusion_matrix_html;
		$("#confusion_matrix").html(str);
		$("#confusion_matrix_training").html(str);
	} else {
		$("#confusion_matrix").html("");
		$("#confusion_matrix_training").html("");
	}
}

function isolateEval(code) {
	const isolatedFunction = new Function("code", `
		return (function() {
			return eval(code);
		})();
	`);

	return isolatedFunction.call(null, code);
}
