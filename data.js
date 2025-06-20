"use strict";

function degrees_to_radians(degrees) {
	var res = degrees * (Math.PI / 180);

	return res;
}

function numpy_str_to_tf_tensor (numpy_str, max_values) {
	assert(typeof(numpy_str) == "string", "numpy_str must be string, is " + typeof(numpy_str));
	assert(typeof(max_values) == "number", "max_values must be number, is " + typeof(max_values));

	if(!numpy_str.endsWith("\n")) {
		numpy_str += "\n";
	}

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
				wrn("[numpy_str_to_tf_tensor] Unknown tensor_type: " + tensor_type);
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
		force_download = 1;
		var data = await get_image_data(0, 0, {title: language[lang]["loading_example_images"], html: ""}, 1);
		await dispose(data);

		force_download = old_force_download;
		$("#max_number_of_files_per_category").val(old_img_cat);
		$("#photos").show();
	} else {
		$("#photos").html("").hide();
	}
}

async function _get_urls_and_keys () {
	var base_url = "traindata/" + get_chosen_dataset() + "/";
	var data = [];
	var urls = [];
	var keys = {};

	var json = await _get_training_data();

	for (const [key, items] of Object.entries(json)) {
		if(items.length) {
			data[key] = [];
			for (var i = 0; i < items.length; i++) {
				var value = items[i];
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

async function _get_set_percentage_text (percentage, i, urls_length, percentage_div, old_percentage, times) {
	var percentage_text = percentage + "% (" + (i + 1) + "/" + urls_length + ")...";

	var eta;

	var data_progressbar_div = $("#data_progressbar>div");
	data_progressbar_div.css("width", percentage + "%");

	set_document_title(language[lang]["loading_data"] + " " + language[lang]["of"] + " " + percentage_text + " - asanAI");

	if(percentage > 20) {
		var remaining_items = urls_length - i;
		var time_per_image = decille(times, ((100 - percentage) / 100) + 0.01);

		eta = parse_int(parse_int(remaining_items * Math.floor(time_per_image)) / 1000) + 10;
		old_percentage = percentage;

		percentage_text += " ca. " + human_readable_time(eta) + " " + trm("left");
	}

	percentage_div.html(percentage_text);
	await update_translations();

	return old_percentage;
}

async function get_image_data(skip_real_image_download, dont_show_swal=0, ignoreme, dont_load_into_tf=0, force_no_download=0) {
	assert(["number", "boolean", "undefined"].includes(typeof(skip_real_image_download)), "skip_real_image_download must be number/boolean or undefined, but is " + typeof(skip_real_image_download));

	if((started_training || force_download) && !force_no_download) {
		$("#photos").html("");
	}

	headerdatadebug("get_image_data()");
	if(!skip_real_image_download) {
		if(!dont_load_into_tf) {
			$("#stop_downloading").show();
		} else {
			$("#stop_downloading").hide();
		}
	}

	var [urls, keys, data] = await _get_urls_and_keys();

	//console.log("urls, keys, data", urls, keys, data);

	var percentage_div = $("#percentage");

	if(!skip_real_image_download) {
		percentage_div.html("");
		percentage_div.show();
	}

	var old_percentage;

	var times = [];

	$("#data_loading_progress_bar").show();
	$("#data_progressbar").css("display", "inline-block");

	var shown_stop_downloading = 0;

	urls = shuffle(urls);

	for (var i = 0; i < urls.length; i++) {
		var start_time = Date.now();
		if(started_training || force_download) {
			var percentage = parse_int((i / urls.length) * 100);
			if(!stop_downloading_data) {
				var url = urls[i];
				let tf_data = null;

				if(!skip_real_image_download) {
					try {
						await _get_set_percentage_text(
							percentage, 
							i, 
							urls.length, 
							percentage_div, 
							old_percentage, 
							times
						);

						tf_data = await url_to_tf(url, dont_load_into_tf);


						_custom_tensors["" + tf_data.id] = [get_stack_trace(), tf_data, `[url_to_tf("${url}", ${dont_load_into_tf})]`];
						_clean_custom_tensors();

						//log("tf_data:", tf_data);
						if(!tf_data && !dont_load_into_tf) {
							wrn("[get_image_data] tf_data is empty, though it shouldn't be");
						}
					} catch (e) {
						err(e);
					}
				}

				if(tf_data !== null || !skip_real_image_download) {
					data[keys[url]].push(tf_data);
				} else {
					if(tf_data === null) {
						//log("tf_data is null");
					}

					if(skip_real_image_download) {
						//log("skip_real_image_download is set, not downloading");
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

	if(!skip_real_image_download) {
		percentage_div.html("");
		percentage_div.hide();
	}

	return data;
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
			for (var i = 0; i < _tensor.shape[0]; i++) {
				var this_tensor = tensor(array_sync(_tensor)[i]);
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

function augment_rotate_images_function(item, degree, this_category_counter, x, classes, label_nr) {
	l(language[lang]["rotating_image"] +  ": " + degree + "°");
	var augmented_img = rotateWithOffset(item, degrees_to_radians(degree));
	add_tensor_as_image_to_photos(augmented_img);
	x = tf_concat(x, augmented_img);
	classes.push(this_category_counter);

	if ($("#augment_invert_images").is(":checked")) {
		l(language[lang]["inverted_image_that_has_been_turned"] + " " + degree + "°");
		var add_value = (-255 / parse_float($("#divide_by").val()));
		var inverted = abs(add(augmented_img, add_value));
		add_tensor_as_image_to_photos(inverted);
		x = tf_concat(x, inverted);
		classes.push(this_category_counter);
	}

	if ($("#augment_flip_left_right").is(":checked")) {
		l(language[lang]["flip_left_right_that_has_been_turned"] + " " + degree + "°");
		var flipped = flipLeftRight(augmented_img);
		add_tensor_as_image_to_photos(flipped);
		x = tf_concat(x, flipped);
		classes.push(label_nr);
	}

	return [classes, x];
}

function augment_invert_images(item, this_category_counter, x, classes) {
	l(language[lang]["inverted_image"]);
	var add_value = (-255 / parse_float($("#divide_by").val()));
	var inverted = abs(add(item, add_value));
	add_tensor_as_image_to_photos(inverted);
	x = tf_concat(x, inverted);
	classes.push(this_category_counter);
	return [classes, x];
}

function augment_flip_left_right(item, this_category_counter, x, classes) {
	l(language[lang]["flip_left_right"]);
	var flipped = flipLeftRight(item);
	add_tensor_as_image_to_photos(flipped);
	x = tf_concat(x, flipped);
	classes.push(this_category_counter);
	return [classes, x];
}

async function get_xs_and_ys () {
	await reset_data();

	headerdatadebug("get_xs_and_ys()");

	$("#xy_display_data").html("").hide();
	//$("#photos").html("").hide();

	var _data_origin = $("#data_origin").val();

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

	var max_number_values = 0;
	if(!is_hidden_or_has_hidden_parent($("#max_number_values"))) {
		max_number_values = parse_int($("#max_number_values").val());
	}

	var loss = $("#loss").val();

	var classes = [];

	var xy_data = null;

	if(Object.keys(traindata_struct[$("#dataset option:selected").text()]).includes("has_custom_data")) {
		var model_id = traindata_struct[$("#dataset option:selected").text()]["id"];
		xy_data = await get_json("php_files/get_training_data.php?id=" + model_id);

		if(!Object.keys(xy_data).includes("x")) {
			err(language[lang]["xy_data_does_not_contain_x"]);
			return;
		}

		if(!Object.keys(xy_data).includes("y")) {
			err(language[lang]["xy_data_does_not_contain_y"]);
			return;
		}

		var x = JSON.parse(JSON.stringify(xy_data.x));

		xy_data.x = tensor(xy_data.x);
		xy_data.y = tensor(xy_data.y);

		await set_labels(xy_data.keys);

		if(xy_data.x.shape.length == 4 && xy_data.x.shape[3] == 3) {
			$("#photos").show();
			for (var i = 0; i < xy_data.x.shape[0]; i++) {
				$("#photos").append("<canvas id='custom_training_data_img_" + i + "'></canvas>");
				draw_grid($("#custom_training_data_img_" + i)[0], 1, x[i], null, null, null, parse_float($("#divide_by").val()));
			}
		} else {
			var x_print_string = arbitrary_array_to_latex(array_sync(xy_data.x));
			var y_print_string = arbitrary_array_to_latex(array_sync(xy_data.y));

			$("#xy_display_data").html("<table border=1><tr><th>X=</th><th>Y=</th></tr><tr><td><pre>" + x_print_string + "</pre></td><td><pre>" + y_print_string + "</pre></td></tr></table>").show();

		}
	} else {
		if(_data_origin == "default") {
			var keys = [];
			var x = null;
			var y;
			var category_counter = 0;

			if(await input_shape_is_image()) {
				$("#photos").html("");

				var old_force_download = force_download;
				force_download = 1;
				var imageData = await get_image_data(0);
				force_download = old_force_download;

				await reset_labels();

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

				if($("#shuffle_data").is(":checked")) {
					this_data = shuffle(this_data);
				}

				var imgs_shape = [height, width, 3];

				//log(imgs_shape);

				x = tidy(() => { return expand_dims(ones(imgs_shape)); });

				//log("this_data:", this_data);
				//log("this_data.length", this_data.length);
				for (var i = 0; i < this_data.length; i++) {
					var unresized_item = this_data[i]["item"];
					var item = resize_image(unresized_item, [height, width]);
					var this_category_counter = this_data[i]["category_counter"];

					var await_outside = [];

					x = tidy(() => {
						var concatted = tf_concat(x, item);
						await_outside.push(dispose(x));
						return concatted;
					});

					await await_outside[0];
					//await await_outside[1];

					classes.push(this_category_counter);

					if ($("#auto_augment").is(":checked")) {
						l(language[lang]["auto_augmenting_images"]);
						if ($("#augment_rotate_images").is(":checked")) {
							for (var degree = 0; degree < 360; degree += (360 / $("#number_of_rotations").val())) {
								if (degree !== 0) {
									[classes, x] = augment_rotate_images_function(item, degree, this_category_counter, x, classes, this_category_counter);
								}
							}
						}

						if ($("#augment_invert_images").is(":checked")) {
							[classes, x] = augment_invert_images(item, this_category_counter, x, classes);
						}

						if ($("#augment_flip_left_right").is(":checked")) {
							[classes, x] = augment_flip_left_right(item, this_category_counter, x, classes);
						}
					}

					await dispose(item);
				}

				var x_arr = array_sync(x);

				await dispose(x);

				x = tidy(() => {
					x_arr.shift();
					x = tensor(x_arr);
					global_x = x;

					return x;
				});

				//log("classes:", classes);
				y = tensor(classes);
				global_y = y;

				for (let [key, value] of Object.entries(imageData)) {
					for (var i = 0; i < imageData[key].length; i++) {
						var item = imageData[key][i];
						await dispose(item);
					}
				}

				imageData = null;
			} else {
				try {
					var x_string, y_string;
					x_string = await _get_training_data_from_filename("x.txt");
					y_string = await _get_training_data_from_filename("y.txt");
					x = numpy_str_to_tf_tensor(x_string, max_number_values);
					y = numpy_str_to_tf_tensor(y_string, max_number_values);

					var x_print_string = _tensor_print_to_string(x);
					var y_print_string = _tensor_print_to_string(y);

					$("#xy_display_data").html("<table border=1><tr><th>X</th><th>Y</th></tr><tr><td><pre>" + x_print_string + "</pre></td><td><pre>" + y_print_string + "</pre></td></tr></table>").show();
				} catch (e) {
					wrn(e);
					console.trace();
					x = tensor([]);
					y = tensor([]);
				}
			}

			xy_data = {"x": x, "y": y, "keys": keys, "number_of_categories": category_counter};
		} else if(_data_origin == "image") {
			l(language[lang]["generating_data_from_images"]);

			var category_counter = $(".own_image_label").length;
			var keys = [];
			var x = [];
			var y = [];

			if(is_classification) {
				for (var label_nr = 0; label_nr < category_counter; label_nr++) {
					var img_elems = $($(".own_images")[label_nr]).children().find("img,canvas");
					if(img_elems.length) {
						var label_val = $($(".own_image_label")[label_nr]).val();
						keys.push(label_val);
						labels[label_nr] = label_val;

						for (var j = 0; j < img_elems.length; j++) {
							var img_elem = img_elems[j];

							var tf_img = fromPixels(img_elem);
							if(!tf_img) {
								continue;
							}
							var resized_img = tf_to_float(
								resize_image(tf_img, [height, width])
							);

							if($("#divide_by").val() != 1) {
								resized_img = divNoNan(resized_img, parse_float($("#divide_by").val()));
							}

							var this_img = array_sync(resized_img);
							x.push(this_img);
							classes.push(label_nr);

							if($("#auto_augment").is(":checked")) {
								l(language[lang]["auto_augmenting_images"]);

								if($("#augment_rotate_images").is(":checked")) {
									for (var degree = 0; degree < 360; degree += (360 / $("#number_of_rotations").val())) {
										var augmented_img = rotateWithOffset(expand_dims(resized_img), degrees_to_radians(degree));
										x.push(array_sync(augmented_img));
										classes.push(label_nr);

										if($("#augment_invert_images").is(":checked")) {
											l(language[lang]["inverted_image_that_has_been_turned"] + " " + degree + "°");
											x.push(array_sync(abs(add(augmented_img, (-255 / parse_float($("#divide_by").val()))))));
											classes.push(label_nr);
										}

										if($("#augment_flip_left_right").is(":checked")) {
											l(language[lang]["flip_left_right_that_has_been_turned"] + " " + degree + "°");
											x.push(array_sync(flipLeftRight(augmented_img))[0]);
											classes.push(label_nr);
										}
									}
								}

								if($("#augment_invert_images").is(":checked")) {
									l(language[lang]["inverted_image"]);
									x.push(array_sync(abs(add(expand_dims(resized_img), (-255 / parse_float($("#divide_by").val()))))));
									classes.push(label_nr);
								}

								if($("#augment_flip_left_right").is(":checked")) {
									l(language[lang]["flip_left_right"]);
									var flipped = flipLeftRight(array_sync(expand_dims(resized_img)))[0];
									x.push(flipped);
									classes.push(label_nr);
								}
							}
						}
					}
				}

				x = tensor(x);
				y = expand_dims(tensor(classes));
			} else {
				var maps = [];
				if($("#auto_augment").is(":checked")) {
					l(language[lang]["auto_augmentation_currently_not_supported_for_segmentation"]);
				}

				for (var label_nr = 0; label_nr < category_counter; label_nr++) {
					var img_elems = $($(".own_images")[label_nr]).children().find("img,canvas");
					if(img_elems.length) {
						var label_val = $($(".own_image_label")[label_nr]).val();
						keys.push(label_val);
						labels[label_nr] = label_val;

						for (var j = 0; j < img_elems.length; j++) {
							var img_elem = img_elems[j];

							var id = img_elem.id;

							if(!id.endsWith("_layer")) {
								var tf_img = fromPixels(img_elem);
								var resized_img = tf.tidy(() => { return tf_to_float(resize_image(tf_img, [height, width])); });

								if($("#divide_by").val() != 1) {
									resized_img = tidy(() => {
										var res = divNoNan(resized_img, parse_float($("#divide_by").val()));
										dispose(resized_img); // await not possible
										return res;
									});
								}

								var this_img = array_sync(resized_img);
								x.push(this_img);
								classes.push(label_nr);

								try {
									var this_map_tensor = tidy(() => {
										var res = resize_image(fromPixels($("#" + id + "_layer")[0]), [model.outputShape[1], model.outputShape[2]]);
										return res;
									});

									var this_map = tf.tidy(() => {
										var res = array_sync(divNoNan(this_map_tensor, parse_float($("#divide_by").val())));
										dispose(this_map_tensor); // await not possible
										return res;
									});
									maps.push(this_map);
								} catch (e) {
									err(e);
									continue;
								}
							}
						}
					}
				}

				x = tensor(x);
				y = tensor(maps);
			}

			//log("A", x.shape);

			if($("#shuffle_data").is(":checked")) {
				shuffleCombo(x, y);
			}

			l(language[lang]["done_generating_data_from_images"]);
			//log("B", x.shape);

			xy_data = {"x": x, "y": y, "keys": keys, "number_of_categories": category_counter};
		} else if (_data_origin == "tensordata") {
			x = numpy_str_to_tf_tensor(x_file, max_number_values);
			y = numpy_str_to_tf_tensor(y_file, max_number_values);

			xy_data = {"x": x, "y": y};
		} else if (_data_origin == "csv") {
			xy_data = await get_x_y_from_csv();

			//log("got xy_data");
			//log(xy_data);
		} else {
			alert("Unknown data type: " + _data_origin);
		}

		$("#reset_data").hide();
	}

	log(language[lang]["got_data_creating_tensors"]);

	if(
		["categoricalCrossentropy", "binaryCrossentropy"].includes(loss) &&
		!traindata_struct[$("#dataset option:selected").text()]["has_custom_data"] &&
		is_classification &&
		classes.length > 1
	) {
		try {
			xy_data.y = tidy(() => { return oneHot(tensor1d(classes, "int32"), xy_data["number_of_categories"]); });
		} catch (e) {
			if(("" + e).includes("depth must be >=2, but it is 1")) {
				alert("You need at least 2 or more categories to start training with categoricalCrossentropy or binaryCrossentropy");
				return null;
			} else {
				write_error(e, e.toString().includes("Error in oneHot: depth must be >=2") ? function () { // cannot be async
					$("#loss").val("meanSquaredError").trigger("change");
					$("#metric").val("meanSquaredError").trigger("change");
					log(`${language[lang]["set_loss_and_metric_to_mse_because_error"]}: '${e.toString()}'`);
				} : null, e.toString().includes("Error in oneHot: depth must be >=2"));
			}
		}
	}

	//log("X-Shape: " + xy_data.x.shape);

	//data_debug(xy_data["x"], xy_data["y"])

	var validation_split = parse_int($("#validationSplit").val());

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

	xy_data_global = xy_data;

	var error_string  = _xs_xy_warning(xy_data);
	if(error_string) {
		throw new Error(error_string);
	}

	return xy_data;
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

	var img_tag = "<img onclick=\"predict_data_img(this, 'image')\" class='download_img' src='" + url + "' height='" + height + "' width='" + width + "' />";
	$("#photos").show().prepend(img_tag);

}

function url_to_tf (url, dont_load_into_tf=0) {
	assert(typeof(url) == "string", "url_to_tf accepts only strings as url parameter, got: " + typeof(url));

	headerdatadebug("url_to_tf(" + url + ")");
	try {
		add_photo_to_gallery(url);

		var tf_img = (async () => {
			let img = await load_image(url);

			var resized_img = [];

			if(!dont_load_into_tf) {
				resized_img = tidy(() => {
					var res = fromPixels(img);

					_custom_tensors["" + res.id] = [get_stack_trace(), res, tensor_print_to_string(res)];
					_clean_custom_tensors();

					resized_img = tidy(() => {
						var _res = tidy(() => {
							return tf_to_float(
								expand_dims(
									resize_image(res, [height, width])
								)
							);
						});


						_custom_tensors["" + _res.id] = [get_stack_trace(), _res, tensor_print_to_string(_res)];
						_clean_custom_tensors();

						dispose(res); // await not possible

						return _res;
					});

					if($("#divide_by").val() != 1) {
						resized_img = tidy(() => {
							var div_by = parse_float($("#divide_by").val());
							var _res = divNoNan(resized_img, div_by);
							dispose(resized_img); // await not possible

							_custom_tensors["" + _res.id] = [get_stack_trace(), _res, tensor_print_to_string(_res)];
							_clean_custom_tensors();

							return _res;
						});
					}

					_custom_tensors["" + resized_img.id] = [get_stack_trace(), resized_img, tensor_print_to_string(resized_img)];
					_clean_custom_tensors();

					return resized_img;
				});
			} else {
				return false;
			}

			_custom_tensors["" + resized_img.id] = [get_stack_trace(), resized_img, tensor_print_to_string(resized_img)];
			_clean_custom_tensors();

			return resized_img;
		})();

		return tf_img;
	} catch (e) {
		header_error("url_to_tf(" + url + ") failed: " + e);
	}

	return null;
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

	$("#reset_data").hide();
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
	for (let i = 0; i < sorted_arr.length - 1; i++) {
		if (sorted_arr[i + 1] == sorted_arr[i]) {
			results.push(sorted_arr[i]);
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

	for (var i = 1; i < lines.length; i++) {
		if(!lines[i].match(/^\s*$/)) {
			var parsed_line_results = parse_line(lines[i], seperator);

			if(head.length != parsed_line_results.length) {
				parse_errors.push(`Line ${i} ("${lines[i]}") has ${parsed_line_results.length} entries, but the header has ${head.length} entries. Ignoring this line.`);
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
	for (var i = 0; i < labels.length; i++) {
		if(labels[i] == item) {
			return i;
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

	for (var i = 0; i < header.length; i++) {
		indices[header[i]] = parsed.head.indexOf(header[i]);
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

	for (var i = 0; i < headers.length; i++) {
		var data_name = $($(".header_select")[i]).attr("name");
		var type = $($(".header_select")[i]).val();

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

	if($("#shuffle_data").is(":checked")) {
		shuffleCombo(x_data["data"], y_data["data"]);
	}

	//log(y_data);

	if($("#auto_one_hot_y").is(":checked")) {
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
			if($("#auto_one_hot_y").is(":checked")) {
				l(language[lang]["currently_there_is_a_bug_for_one_hot_encoding_with_only_one_vector_so_its_disabled"]);
				$("#auto_one_hot_y").prop("checked", false);
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

async function get_x_y_as_array () {
	while (started_training) {
		l(language[lang]["awaiting_finishing_of_training"]);
		await delay(1000);
	}
	force_download = 1;
	var data = await get_xs_and_ys();
	force_download = 0;

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
		for (var i = 0; i < number; i++) {
			l(sprintf(language[lang]["taking_image_n_of_m"], i + 1, number));
			await update_translations();
			await take_image_from_webcam(elem, 1, i == 0);
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

	var base_id = await md5($(category).find(".own_image_label").val());

	var i = 1;
	var id = base_id + "_" + i;

	while ($("#" + id + "_canvas").length != 0) {
		id = base_id + "_" + i;
		i++;
	}

	// TODO: Cannot easily changed to span because of image map generation. The image map generator drawing canvas is, when not in a single line, not properly aligned.
	$(category).find(".own_images").prepend(
		"<div class=\"own_image_span\">" +
			"<canvas id=\"" + id + "_canvas\" width=\"" + stream_width + "\" height=\"" + stream_height + "\"></canvas><span onclick=\"delete_own_image(this)\">&#10060;&nbsp;&nbsp;&nbsp;</span>" +
		"</div><br>"
	);

	var c = document.getElementById(id + "_canvas");
	var ctx = c.getContext("2d");

	for(var i = 0; i < cam_image.length; i++){
		for(var j = 0; j < cam_image[0].length; j++){
			var r = cam_image[i][j][0];
			var g = cam_image[i][j][1];
			var b = cam_image[i][j][2];
			ctx.fillStyle = "rgba(" + r + "," + g + "," + b + ", 1)";
			ctx.fillRect(j, i, 1, 1);
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
	for (let i = 0; i < arr.length; i++) {
		if (!histogram[arr[i]]) {
			histogram[arr[i]] = 1;
		} else {
			histogram[arr[i]]++;
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

	for (var i = 0; i < canvasses.length; i++) {
		var model_hash = $(canvasses[i]).data("model_hash");
		var data_layer = $(canvasses[i]).data("layer");
		var data_neuron = $(canvasses[i]).data("neuron");

		if(typeof(struct[model_hash]) == "undefined") {
			struct[model_hash] = {};
		}

		if(typeof(struct[model_hash][data_layer]) == "undefined") {
			struct[model_hash][data_layer] = [];
		}

		var res = image_element_looks_random(canvasses[i]);

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

		for (var i = 0; i < activated_neurons[current_model_config_hash][layer].length; i++) {
			// 0: something was learned, 1: nothing was learned
			// threshold: 0.01
			if(activated_neurons[current_model_config_hash][layer][i] > 0.02) {
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

async function confusion_matrix(classes) {
	if(!classes.length) {
		if(current_epoch < 2) {
			dbg(`[confusion_matrix] ${language[lang]["no_classes_found"]}`);
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
	
	var imgs = $("#photos").find("img,canvas");

	if(!imgs.length) {
		if(current_epoch == 1) {
			wrn("[confusion_matrix] No images found");
		}
		return "";
	}
	
	var table_data = {};
	
	var num_items = 0;

	for (var i = 0; i < imgs.length; i++) {
		var img_elem = imgs[i];
		var img_elem_xpath = get_element_xpath(img_elem);

		var predicted_tensor = confusion_matrix_and_grid_cache[img_elem_xpath];

		if(!predicted_tensor) {
			var img_tensor = tidy(() => {
				try {
					var res = cached_load_resized_image(img_elem);
					return res;
				} catch (e) {
					err(e);
					return null;
				}
			});

			if(img_tensor === null) {
				wrn("[confusion_matrix] Could not load image from pixels from this element:", img_elem);
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

				confusion_matrix_and_grid_cache[img_elem_xpath] = predicted_tensor;
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

		//console.log("cached: ", predicted_tensor);

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

		var src = img_elem.src;
		var correct_category = extractCategoryFromURL(src);

		if(!Object.keys(table_data).includes(correct_category)) {
			table_data[correct_category] = {};
		}

		if(Object.keys(table_data[correct_category]).includes(predicted_category)) {
			table_data[correct_category][predicted_category]++;
		} else {
			table_data[correct_category][predicted_category] = 1;
		}

		//console.log("xpath:", img_elem_xpath, "predicted_index:", predicted_index, "category", predicted_category);

		await dispose(img_tensor);
		await dispose(predicted_tensor);

		num_items++;
	}

	if(!num_items) {
		wrn("[confusion_matrix] Could not get any items!");
		return "";
	}

	var str = "<table class=\"confusion_matrix_table\">" ;
	for (var i = 0; i <= classes.length; i++) {
		if(i == 0) {
			str += "<tr>";
			str += "<th class='confusion_matrix_tx' style='text-align: right'><i>Correct category</i> &rarr;<br><i>Predicted category</i> &darr;</th>";
			for (var j =  0; j < classes.length; j++) {
				str += `<th class='confusion_matrix_tx'>${classes[j]}</th>`;
			}
			str += "</tr>";
		} else {
			str += "<tr>";
			for (var j =  0; j <= classes.length; j++) {
				if(j == 0) {
					str += `<th class="confusion_matrix_tx">${classes[i - 1]}</th>`;
				} else {
					var text = "0"; // `${classes[i - 1]} &mdash; ${classes[j - 1]}`;
					if(Object.keys(table_data).includes(classes[i - 1]) && Object.keys(table_data[classes[i - 1]]).includes(classes[j - 1])) {
						text = table_data[classes[i - 1]][classes[j - 1]];
					}
					if(classes[i - 1] == classes[j - 1]) {
						if(text == "0") {
							str += `<td class="confusion_matrix_tx">${text}</td>`;
						} else {
							str += `<td  class="confusion_matrix_tx" style='background-color: #83F511'>${text}</td>`;
						}
					} else {
						if(text == "0") {
							str += `<td class="confusion_matrix_tx">${text}</td>`;
						} else {
							str += `<td class="confusion_matrix_tx"style='background-color: #F51137'>${text}</td>`;
						}
					}
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
