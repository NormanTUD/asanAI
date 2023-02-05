"use strict";

function degrees_to_radians(degrees) {
	return degrees * (Math.PI / 180);
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

	return await $.get("traindata/" + get_chosen_dataset() + "/" + filename);
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

	headerdatadebug("get_image_data()");
	if(!skip_real_image_download) {
		$("#stop_downloading").show();
	}

	var json = await _get_training_data();

	var data = [];
	var urls = [];
	var keys = {};

	var base_url = "traindata/" + get_chosen_dataset() + "/";

	for (const [key, items] of Object.entries(json)) {
		if(items.length) {
			data[key] = [];
			for (var i = 0; i < items.length; i++) {
				var value = items[i];
				var url = base_url + "/" + key + "/" + value;
				urls.push(url);
				keys[url] = key;
			}
		}
	}

	urls = shuffle(urls);

	var percentage_div = $("#percentage");

	if(!skip_real_image_download) {
		percentage_div.html("");
		percentage_div.show();
	}

	var old_percentage, eta;

	var times = [];

	$("#data_loading_progress_bar").show();
	$("#data_progressbar").css("display", "inline-block");

	var data_progressbar_div = $("#data_progressbar>div");
	var shown_stop_downloading = 0;

	for (var i = 0; i < urls.length; i++) {
		var start_time = Date.now();
		if(started_training || force_download) {

			var percentage = parseInt((i / urls.length) * 100);
			if(!stop_downloading_data) {
				if(!skip_real_image_download) {
					var percentage_text = percentage + "% (" + (i + 1) + " of " + urls.length + ") loaded...";
					document.title = "Loading data " + percentage_text;
					data_progressbar_div.css("width", percentage + "%")
					percentage_div.html(percentage_text);
					if(eta) {
						percentage_div.html(percentage_div.html() + " ETA: " + human_readable_time(eta));
					}

					if(percentage > 20 && (!old_percentage || (percentage - old_percentage) >= 10)) {
						var remaining_items = urls.length - i;
						var time_per_image = decille(times, ((100 - percentage) / 100) + 0.01);

						eta = parseInt(parseInt(remaining_items * Math.floor(time_per_image)) / 1000);
						old_percentage = percentage;
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
			} else {
				if(!shown_stop_downloading) {
					log("Stop downloading");
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

	if(!skip_real_image_download) {
		await Swal.fire({
			title: 'Generating tensors from images...',
			html: "This may take some time, but your computer is working!",
			timer: 2000,
			showConfirmButton: false
		});
	}

	document.title = original_title;

	if(!skip_real_image_download) {
		percentage_div.html("");
		percentage_div.hide();
	}

	return data;
}

async function add_tensor_as_image_to_photos (tensor) {
	// TODO
	assert(typeof(tensor) == "object", "Tensor must be an object");	
	assert(Object.keys(tensor).includes("shape"), "Tensor must be an object that contains a shape subkey");
	assert(tensor.shape.length >= 3 && tensor.shape.length <= 4, "Tensor must have 3 or 4 dimensions");	

	if(tensor.shape.length == 4) {
		if(tensor.shape[0] == 1) {
			tensor = tf.tensor(tensor.arraySync()[0]);
		} else {
			for (var i = 0; i < tensor.shape[0]; i++) {
				var this_tensor = tf.tensor(tensor.arraySync()[i]);
				add_tensor_as_image_to_photos(this_tensor);
			}
			return;
		}
	}

	var uuid = uuidv4();
	var id = "augmented_photo_" + uuid;
	//log("image-element-id: ", id);
	$("#photos").append("<canvas id='" + id + "'></canvas>");
	//log("toPixels(tensor, $('#" + id + "')");

	var min_value = 0;
	var max_value = 0;

	var min_in_tensor = tf.min(tensor).arraySync();

	if(min_in_tensor < min_value) {
		min_value = min_in_tensor;
	}


	if(min_value < 0) {
		tensor = tensor.sub(min_value);
	}

	var max_in_tensor = tf.max(tensor).arraySync();

	if(max_in_tensor > max_value) {
		max_value = max_in_tensor;
	}

	if(max_value != 0) {
		tensor = tensor.div(max_value);
	}

	try {
		await tf.browser.toPixels(tensor, $("#" + id)[0]);
	} catch (e) {
		log("Shape:", tensor.shape);
		tensor.print();
	}
}


function truncate_text (fullStr, strLen, separator) {
    if (fullStr.length <= strLen) return fullStr;

    separator = separator || '...';

    var sepLen = separator.length,
        charsToShow = strLen - sepLen,
        frontChars = Math.ceil(charsToShow/2),
        backChars = Math.floor(charsToShow/2);

    return fullStr.substr(0, frontChars) +
           separator +
           fullStr.substr(fullStr.length - backChars);
};

async function sine_ripple (img) {
	var uuid = uuidv4();
	$("<canvas style='display: none' id='" + uuid + "'></canvas>").appendTo($("body"));
	await tf.browser.toPixels(tf.tensor(img.arraySync()[0]), $("#" + uuid)[0]);
	var canvas = $("#" + uuid)[0];
	var context = canvas.getContext("2d");
	var data = context.getImageData(0,0,canvas.width, canvas.height) 
	JSManipulate.sineripple.filter(data); 
	context.putImageData(data,0,0);
	var rippled = await tf.browser.fromPixels(canvas);
	$(canvas).remove();

	return rippled;
}

async function get_xs_and_ys () {
	headerdatadebug("get_xs_and_ys()");

	$("#xy_display_data").html("").hide();
	//$("#photos").html("").hide();

	var data_origin = $("#data_origin").val();

	if($("#jump_to_interesting_tab").is(":checked")) {
		if(data_origin == "default") {
			show_tab_label("training_data_tab_label", 1);
		} else if(data_origin == "csv") {
			show_tab_label("own_csv_data_label", 0)
			show_tab_label("tfvis_tab_label", 1);
		} else if (data_origin == "image") {
			show_tab_label("own_image_data_label", 1);
		} else if (data_origin == "tensordata") {
			show_tab_label("own_tensor_data_label", 1);
		} else {
			log("Invalid option " + data_origin);
		}
	}

	var max_number_values = 0;
	if(!is_hidden_or_has_hidden_parent($("#max_number_values"))) {
		max_number_values = parseInt($("#max_number_values").val());
	}

	var loss = $("#loss").val();

	var classes = [];

	if(traindata_struct[$("#dataset option:selected").text()]["has_custom_data"]) {
		var model_id = traindata_struct[$( "#dataset option:selected" ).text()]["id"];
		xy_data = await get_json("get_training_data.php?id=" + model_id);

		var x = JSON.parse(JSON.stringify(xy_data.x));

		xy_data.x = tf.tensor(xy_data.x);
		xy_data.y = tf.tensor(xy_data.y);

		labels = xy_data.keys;

		if(xy_data.x.shape.length == 4 && xy_data.x.shape[3] == 3) {
			$("#photos").show();
			for (var i = 0; i < xy_data.x.shape[0]; i++) {
				$("#photos").append("<canvas id='custom_training_data_img_" + i + "'></canvas>");
				draw_grid($("#custom_training_data_img_" + i)[0], 1, x[i], null, null, null, parseFloat($("#divide_by").val()));
			}
		} else {
			var x_print_string = tensor_print_to_string(xy_data.x);
			var y_print_string = tensor_print_to_string(xy_data.y);

			$("#xy_display_data").html("<table border=1><tr><th>X</th><th>Y</th></tr><tr><td><pre>" + x_print_string + "</pre></td><td><pre>" + y_print_string + "</pre></td></tr></table>").show();
		}
	} else {
		if(data_origin == "default") {
			var keys = [];
			var x = tf.tensor([]);
			var y;
			var category_counter = 0;

			if(input_shape_is_image()) {
				$("#photos").html("");
				let imageData = await get_image_data(0);

				reset_labels();

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

				x = tf.ones(imgs_shape).expandDims();

				//log("this_data:", this_data);
				for (var i = 0; i < this_data.length; i++) {
					var item = this_data[i]["item"];
					var this_category_counter = this_data[i]["category_counter"];
					/*
					log("x.shape", x.shape);
					log("item.shape", item.shape);
					log("x.shape, item.shape");
					log(x.shape);
					log(item.shape);
					*/

					x = x.concat(item, 0);
					classes.push(this_category_counter);

					if($("#auto_augment").is(":checked")) {
						l("Auto augmenting images");
						if($("#augment_rotate_images").is(":checked")) {
							log("augment_rotate_images CHECKED")
							for (var degree = 0; degree < 360; degree += (360 / $("#number_of_rotations").val())) {
								if(degree = 0) {
									l("Rotating image: " + j + "°");
									var augmented_img = tf.image.rotateWithOffset(item, degrees_to_radians(degree));
									add_tensor_as_image_to_photos(augmented_img);
									x = x.concat(augmented_img);
									classes.push(this_category_counter);

									if($("#augment_invert_images").is(":checked")) {
										l("Inverted image that has been turned " + degree + "°");
										var add_value = (-255 / parseFloat($("#divide_by").val()));
										var inverted = tf.abs(tf.add(augmented_img, add_value));
										add_tensor_as_image_to_photos(inverted);
										x = x.concat(inverted);
										classes.push(this_category_counter);
									}

									if($("#augment_flip_left_right").is(":checked")) {
										l("Flip left/right image that has been turned " + degree + "°");
										var flipped = tf.image.flipLeftRight(augmented_img);
										add_tensor_as_image_to_photos(flipped);
										x = x.concat(flipped);
										classes.push(label_nr);
									}

									if($("#augment_sine_ripple").is(":checked")) {
										var rippled = await sine_ripple(augmented_img);
										x = x.concat(rippled.expandDims());
										add_tensor_as_image_to_photos(rippled);
										classes.push(label_nr);
									}
								}
							}
						}

						if($("#augment_invert_images").is(":checked")) {
							l("Inverted image");
							var add_value = (-255 / parseFloat($("#divide_by").val()));
							var inverted = tf.abs(tf.add(item, add_value));
							add_tensor_as_image_to_photos(inverted);
							x = x.concat(inverted);
							classes.push(this_category_counter);
						}

						if($("#augment_flip_left_right").is(":checked")) {
							l("Flip left/right");
							var flipped = tf.image.flipLeftRight(item);
							add_tensor_as_image_to_photos(flipped);
							x = x.concat(flipped);
							classes.push(label_nr);
						}

						if($("#augment_sine_ripple").is(":checked")) {
							var rippled = await sine_ripple(item);
							x = x.concat(rippled.expandDims());
							add_tensor_as_image_to_photos(rippled);
							classes.push(label_nr);
						}
					}
				}

				var x_arr = await x.arraySync();
				x_arr.shift();
				x = tf.tensor(x_arr);

				//log("classes:", classes);
				y = tf.tensor(classes);

				for (let [key, value] of Object.entries(imageData)) {
					for (var i = 0; i < imageData[key].length; i++) {
						var item = imageData[key][i];
						dispose(item);
					}
				}

				imageData = null;
			} else {
				var x_string, y_string;
				x_string = await _get_training_data_from_filename("x.txt");
				y_string = await _get_training_data_from_filename("y.txt");
				x = numpy_str_to_tf_tensor(x_string, max_number_values);
				y = numpy_str_to_tf_tensor(y_string, max_number_values);

				var x_print_string = tensor_print_to_string(x);
				var y_print_string = tensor_print_to_string(y);

				$("#xy_display_data").html("<table border=1><tr><th>X</th><th>Y</th></tr><tr><td><pre>" + x_print_string + "</pre></td><td><pre>" + y_print_string + "</pre></td></tr></table>").show();
			}

			xy_data = {"x": x, "y": y, "keys": keys, "number_of_categories": category_counter};
		} else if(data_origin == "image") {
			Swal.fire({
				title: 'Generating tensors from images...',
				html: "This may take some time, but your computer is working!",
				timer: 2000,
				showConfirmButton: false
			});

			l("Generating data from images");

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

							var tf_img = tf.browser.fromPixels(img_elem);
							var resized_img = tf_img.
								resizeNearestNeighbor([height, width]).
								toFloat();

							if($("#divide_by").val() != 1) {
								resized_img = tf.divNoNan(resized_img, parseFloat($("#divide_by").val()));
							}

							var this_img = await resized_img.arraySync();
							x.push(this_img);
							classes.push(label_nr);

							if($("#auto_augment").is(":checked")) {
								l("Auto augmenting images");
								if($("#augment_rotate_images").is(":checked")) {
									for (var degree = 0; degree < 360; degree += (360 / $("#number_of_rotations").val())) {
										var augmented_img = tf.image.rotateWithOffset(resized_img.expandDims(), degrees_to_radians(degree));
										x.push(await augmented_img.arraySync());
										classes.push(label_nr);

										if($("#augment_invert_images").is(":checked")) {
											l("Inverted image that has been turned " + degree + "°");
											x.push(await tf.abs(tf.add(augmented_img, (-255 / parseFloat($("#divide_by").val())))).arraySync());
											classes.push(label_nr);
										}

										if($("#augment_flip_left_right").is(":checked")) {
											l("Flip left/right image that has been turned " + degree + "°");
											x.push(await tf.image.flipLeftRight(augmented_img).arraySync()[0]);
											classes.push(label_nr);
										}
									}
								}

								if($("#augment_invert_images").is(":checked")) {
									l("Inverted image");
									x.push(await tf.abs(tf.add(resized_img.expandDims(), (-255 / parseFloat($("#divide_by").val())))).arraySync());
									classes.push(label_nr);
								}

								if($("#augment_flip_left_right").is(":checked")) {
									l("Flip left/right");
									var flipped = await tf.image.flipLeftRight(resized_img.expandDims()).arraySync()[0];
									x.push(flipped);
									classes.push(label_nr);
								}

								if($("#augment_sine_ripple").is(":checked")) {
									l("Rippling is not yet supported for custom data!");
									/*
									var uuid = uuidv4();
									$("<canvas style='display: none' id='" + uuid + "'></canvas>").appendTo($("body"));
									await tf.browser.toPixels(tf_img, $("#" + uuid)[0]);
									var canvas = $("#" + uuid)[0];
									var context = canvas.getContext("2d");
									var data = context.getImageData(0,0,canvas.width, canvas.height) 
									JSManipulate.sineripple.filter(data); 
									context.putImageData(data,0,0);
									var rippled = await tf.browser.fromPixels(canvas);
									$(canvas).remove();
									log(rippled);
									add_tensor_as_image_to_photos(rippled);
									x.push(rippled[0]);
									classes.push(label_nr);
									*/
								}
							}
						}
					}
				}


				x = tf.tensor(x);
				y = tf.tensor(classes).expandDims();
			} else {
				var maps = [];
				if($("#auto_augment").is(":checked")) {
					l("Auto-Augmentation is currently not implemented for image segmentation");;;;
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
								var tf_img = tf.browser.fromPixels(img_elem);
								var resized_img = tf_img.
									resizeNearestNeighbor([height, width]).
									toFloat();

								if($("#divide_by").val() != 1) {
									resized_img = tf.divNoNan(resized_img, parseFloat($("#divide_by").val()));
								}

								var this_img = await resized_img.arraySync();
								x.push(this_img);
								classes.push(label_nr);
								var this_map = await tf.browser.fromPixels($("#" + id + "_layer")[0]).
										resizeNearestNeighbor([model.outputShape[1], model.outputShape[2]]).
										arraySync();
								log(this_map);
								maps.push(this_map)
							}
						}
					}
				}

				x = tf.tensor(x);
				y = tf.tensor(maps);
				y.print();
			}

			//log("A", x.shape);

			if($("#shuffle_data").is(":checked")) {
				tf.util.shuffleCombo(x, y);
			}

			l("Done generating data from images");
			//log("B", x.shape);

			xy_data = {"x": x, "y": y, "keys": keys, "number_of_categories": category_counter};
		} else if (data_origin == "tensordata") {
			x = numpy_str_to_tf_tensor(x_file, max_number_values);
			y = numpy_str_to_tf_tensor(y_file, max_number_values);

			xy_data = {"x": x, "y": y};
		} else if (data_origin == "csv") {
			xy_data = await get_x_y_from_csv();

			//log("got xy_data");
			//log(xy_data);
		} else {
			alert("Unknown data type: " + data_origin);
		}

		$("#reset_data").hide();
	}

	if(["categoricalCrossentropy", "binaryCrossentropy"].includes(loss) && !traindata_struct[$("#dataset option:selected").text()]["has_custom_data"] && is_classification) {
		try {
			//log("C", xy_data.x.shape);
			xy_data.y = tf.oneHot(tf.tensor1d(classes, "int32"), xy_data["number_of_categories"]);
			//log("D", xy_data.x.shape);
		} catch (e) {
			/*
			log(e);
			log(typeof(e));
			log(Object.keys(e));
			log(e.__proto__);
			*/
			write_error(e, e.toString().includes("Error in oneHot: depth must be >=2") ? function () {
				$("#loss").val("meanSquaredError").trigger("change");
				$("#metric").val("meanSquaredError").trigger("change")
				log("Set Loss and Metric to MeanSquaredError, because we encountered the error '" + e.toString() + "'");
			} : null, e.toString().includes("Error in oneHot: depth must be >=2"));
		}
	}

	//log("X-Shape: " + xy_data.x.shape);

	// TODO:
	//assert(xy_data.x.shape[0] == xy_data.x.shape[0], "FEHLER");

	//data_debug(xy_data["x"], xy_data["y"])

	var validation_split = parseInt($("#validationSplit").val());

	var number_of_training_data = xy_data["y"].shape[0];
	var number_of_training_data_left_after_split = Math.floor((1-(validation_split/100)) * number_of_training_data);

	if(number_of_training_data_left_after_split < 1) {
		var new_validation_split = 100 - Math.floor((1/number_of_training_data) * 100);
		if(new_validation_split > 20) {
			new_validation_split = 20;
		}
		l(`The old validation Split of ${validation_split}% was too high. No data would be left to train upon if set this way. It was set to the highest possible number that still keeps at least one set of training data, being ${new_validation_split}%.`);
		$("#validationSplit").val(new_validation_split);
	}

	return xy_data;
}

function add_photo_to_gallery(url) {
	assert(typeof (url) == "string", url + " is not a string but " + typeof (url));

	var photoscontainer = $("#photoscontainer");

	if (photoscontainer.css("display") == "none") {
		photoscontainer.show();
	}

	var html = "<img class='download_img' src='" + url + "' height='90' />";
	$("#photos").show().prepend(html);
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
			dispose(tf_img);

			if($("#divide_by").val() != 1) {
				resized_img = tf.divNoNan(resized_img, parseFloat($("#divide_by").val()));
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
	if(input_shape_is_image()) {
		set_input_shape("[" + width + ", " + height + ", 3]");
	}
}

async function _get_training_data() {
	var url = "traindata/index.php?dataset=" + get_chosen_dataset() + "&max_number_of_files_per_category=" +  $("#max_number_of_files_per_category").val();
	return await get_cached_json(url);
}

function median(values){
	if(values.length ===0) throw new Error("No inputs");

	values.sort(function(a,b){
		return a-b;
	});

	var half = Math.floor(values.length / 2);

	if (values.length % 2)
		return values[half];

	return (values[half - 1] + values[half]) / 2.0;
}

function decille (arr, percentage) {
	arr.sort();
	var len = arr.length;
	var per =  Math.floor(len*percentage) - 1;

	return per;
}

function reset_data () {
	if(!xy_data === null) {
		if(Object.keys(xy_data).includes("x")) {
			dispose(xy_data["x"]);
		}
		if(Object.keys(xy_data).includes("y")) {
			dispose(xy_data["y"]);
		}
	}

	xy_data = null;
	$('#reset_data').hide();
}

function parse_dtype (val) {
	if(val.match(/^[+-]?\d+$/)) {
		return parseInt(val);
	} else if(val.match(/^[+-]?\d+\.\d+$/)) {
		return parseFloat(val);
	} else {
		return val;
	}
}

function parse_line (line, seperator) {
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

	items.push(parse_dtype(current_item));

	return items;
}

function parse_csv_file (csv_file) {
	var seperator = get_csv_seperator();

	var seperator_at_end_re = new RegExp("/" + seperator + "+$/", "gm");

	csv_file = csv_file.replace(seperator_at_end_re, "")

	csv_file = csv_file
		.split("\n")
		.filter((item, i, allItems) => {
			return i === allItems.indexOf(item);
		})
		.join("\n");

	if(typeof(seperator) == "undefined") {
		seperator = ",";
	}

	var lines = csv_file.split("\n");

	var head = parse_line(lines[0], seperator);

	var data = [];

	for (var i = 1; i < lines.length; i++) {
		if(!lines[i].match(/^\s*$/)) {
			data.push(parse_line(lines[i], seperator));
		}
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

function get_data_struct_by_header(header, parsed, skip_nr, in_goto) {
	reset_labels();
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
			var header_multiply = parseFloat($($(".header_divide_by")[col_nr + skip_nr]).val());
			var csv_element = parsed.data[line_nr][indices[header[col_nr]]];
			var to_push = undefined;
			if((!col_contains_string.includes(col_nr) && looks_like_number(csv_element)) || csv_element === undefined) {
				var ln = parseFloat(csv_element);
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
				if(!col_contains_string.includes(col_nr)) {
					col_contains_string.push(col_nr);
				}

				if(!in_goto) {
					return get_data_struct_by_header(header, parsed, skip_nr, true);
				}

				var element_id = get_or_insert_label(csv_element);
				to_push = element_id;
			}

			if(Number.isNaN(to_push) || to_push === undefined || (typeof(to_push) == "string" && to_push == "")) {
				return { "is_incomplete": true };
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
	reset_data();

	var seperator = get_csv_seperator();
	var csv = $("#csv_file").val();
	var is_one_hot_encoded = false;

	var headers = $(".header_select");

	var headers_data = get_headers(headers);
	var x_headers = headers_data["x"];
	var y_headers = headers_data["y"];

	labels = y_headers;

	var parsed = parse_csv_file(csv);

	var x_data = get_data_struct_by_header(x_headers, parsed, 0, false);
	if(x_data.is_incomplete) {
		l("X-Data is yet incomplete");
		return "incomplete";
	}
	var y_data = get_data_struct_by_header(y_headers, parsed, x_headers.length, false);
	if(y_data.is_incomplete) {
		l("Y-Data is yet incomplete");
		return "incomplete";
	}

	if($("#shuffle_data").is(":checked")) {
		tf.util.shuffleCombo(x_data["data"], y_data["data"]);
	}

	//log(y_data);
	//log(y_data);

	if($("#auto_one_hot_y").is(":checked")) {
		if(y_headers.length == 1) {
			if(labels.length > 1) {
				y_data["data"] = await tf.oneHot(tf.tensor1d(y_data["data"].flat(), "int32"), labels.length).arraySync();
				auto_adjust_number_of_neurons(labels.length);
				set_last_layer_activation_function("softmax");
				is_one_hot_encoded = true;
				l("Enough labels for oneHot-Encoding &#x2705;");
			} else {
				l("Not enough labels for oneHot-Encoding (got " + labels.length + ", need at least >= 2) &#10060;");
			}
		} else {
			if($("#auto_one_hot_y").is(":checked")) {
				l("Currently, there is a bug that only allows Auto-One-Hot-Encoding with a one-column-vector only. Therefore, Auto-One-Hot-Encoding has been disabled");
				$("#auto_one_hot_y").prop("checked", false)
			}
		}
	}

	var x = x_data["data"];
	//log("HERE");
	//log(y_data);
	var y = y_data["data"];

	var y_between_0_and_1 = y_data["y_between_0_and_1"];

	//log(y)

	x = tf.keep(tf.tensor(x));
	y = tf.keep(tf.tensor(y));

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
		l("Awaiting finishing of training");
		await delay(1000)
	}
	force_download = 1;
	var data = await get_xs_and_ys();
	force_download = 0;

	return JSON.stringify({ x: data.x.arraySync(), y: data.y.arraySync() });
}

async function get_data_from_webcam (force_restart) {
	if(!available_webcams.length) {
		alert("No webcams found");
		return;
	}

	var stopped = 0;

	if(input_shape_is_image()) {
		$("#show_webcam_button_data").html("Stop webcam");
		if(cam_data) {
			l("Stopping webcam");
			$("#webcam_start_stop").html("Enable webcam");

			$(".webcam_data_button").hide();
			$("#webcam_data").hide().html("");
			if(cam_data) {
				cam_data.stop();
				cam_data = null;
			}
			stopped = 1;
		} else {
			l("Starting webcam");
			$("#webcam_start_stop").html("Disable webcam");
			var webcam = $("#webcam_data");
			webcam.hide().html("");

			var videoElement = document.createElement('video');
			videoElement.width = Math.max(120, width);
			videoElement.height = Math.max(120, height);
			videoElement.playsInline = true;
			videoElement.playsinline = true;
			videoElement.muted = true;
			videoElement.controls = true;
			videoElement.autoplay = true;

			webcam.show().append(videoElement);

			var cam_config = {};

			if(await hasBothFrontAndBack()) {
				l("Using camera " + webcam_modes[webcam_id]);
				cam_config["facingMode"] = webcam_modes[webcam_id];
			} else {
				l("Has only one camera, no front and back camera");
			}

			if(available_webcams.length > 1) {
				cam_config["deviceId"] = available_webcams_ids[parseInt($("#which_webcam").val())];
			}

			//log(cam_config);
			cam_data = await tf.data.webcam(videoElement, cam_config);

			$(".webcam_data_button").show();
		}
	} else {
		$(".webcam_data_button").hide();
		$("#webcam_data").hide().html("");
		if(cam_data) {
			cam_data.stop();
		}
	}

	if(force_restart && stopped) {
		await get_data_from_webcam();
	}
}

async function take_image_from_webcam_n_times (elem) {
	var number = parseInt($("#number_of_series_images").val())
	var delaybetween = parseInt($("#delay_between_images_in_series").val())

	let timerInterval;
	Swal.fire({
		title: 'Soon a photo series will start!',
		html: 'First photo will be taken in  <b></b> seconds.',
		timer: 2000,
		timerProgressBar: true,
		didOpen: () => {
			Swal.showLoading()
			const b = Swal.getHtmlContainer().querySelector('b')
			timerInterval = setInterval(() => {
				var tl = Swal.getTimerLeft() / 1000;
				tl = tl.toFixed(1);
				b.textContent = tl;
			}, 100)
		},
		willClose: () => {
			clearInterval(timerInterval)
		}
	}).then(async (result) => {
		for (var i = 0; i < number; i++) {
			l("Taking image " + (i + 1) + " of " + number);
			await take_image_from_webcam(elem, 1);
			await delay(delaybetween*1000);
		}
		l("Done taking " + number + " images");
	});
}

async function take_image_from_webcam (elem, nol) {
	if(!nol) {
		l("Taking photo from webcam...");
	}

	var stream_width = cam.stream.getVideoTracks(0)[0].getSettings().width;
	var stream_height = cam.stream.getVideoTracks(0)[0].getSettings().height;

	var category = $(elem).parent();
	var cam_image = await cam_data.capture();
	cam_image = cam_image.resizeNearestNeighbor([stream_height, stream_width]).toFloat().expandDims()
	cam_image = await cam_image.arraySync()[0];

	var base_id = await md5($(category).find(".own_image_label").val());

	var i = 1;
	var id = base_id + "_" + i;;

	while ($("#" + id + "_canvas").length != 0) {
		id = base_id + "_" + i;
		i++;
	}

	$(category).find(".own_images").append(
		'<span class="own_image_span">' +
			'<canvas id="' + id + '_canvas" width="' + stream_width + '" height="' + stream_height + '"></canvas><span onclick="delete_own_image(this)">&#10060;&nbsp;&nbsp;&nbsp;</span>' +
		'</span>'
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
		l("Took photo from webcam");
	}
}

function chiSquaredTest(arr) {
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

function array_likelyhood_of_being_random (array) {
	var chi = chiSquaredTest(array);

	return 1 - chi;
}

function image_element_looks_random (imgelem) {
	var t = tf.reshape(tf.browser.fromPixels(imgelem), [-1]);
	return array_likelyhood_of_being_random(t.arraySync())
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
		log("This algorithm is useless when the network is not trained");
		return 0;
	}

	if(layer == (get_number_of_layers() - 1)) {
		log("Cannot remove last layer");
		return 0;
	}

	var layer_can_be_visualized = $($(".layer_setting")[layer]).find(".visualize_button");

	if(layer_can_be_visualized) {
		var current_model_config_hash = await get_model_config_hash()
		await draw_maximally_activated_layer(layer, get_layer_type_array()[layer]);

		var activated_neurons = maximally_activated_neurons_randomness();

		var number_of_neurons = activated_neurons[current_model_config_hash][layer].length;
		var neurons_that_learnt_something = 0;

		for (var i = 0; i < activated_neurons[current_model_config_hash][layer].length; i++) {
			// 0: etwas gelernt, 1: nix gelernt
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
		log("Cannot visualize layer " + layer);
		return null;
	}
}


async function adjust_number_of_neurons (layer) {
	var original_epochs = parseInt($("#epochs").val());

	$("#epochs").val(10);

	await train_neural_network();

	var adjust_neurons = await get_new_number_of_neurons_according_to_visualization_randomness(layer);
	if(adjusted_neurons_total === null) {
		return;
	}

	var adjusted_neurons_total = 0;

	while (adjust_neurons != 0) {
		await train_neural_network();
		adjust_neurons = await get_new_number_of_neurons_according_to_visualization_randomness(layer);

		var old_value = parseInt($($(".layer_options_internal")[layer]).find(".filters,.units").val());
		var new_value = old_value + adjust_neurons;
		adjusted_neurons_total += Math.abs(adjust_neurons);
		log("new-value", new_value);
		$($(".layer_options_internal")[layer]).find(".filters,.units").val(new_value).trigger("change");
		await delay(1000);
	}


	$("#epochs").val(original_epochs);
	return adjusted_neurons_total;
}

/*
async function start_simple () {
	while (get_number_of_layers() > 1) {
		$($(".remove_layer")[0]).click();
	}

	$($(".add_layer")[0]).click();
	await delay(200);

	$($(".add_layer")[0]).click();
	await delay(500);

	$($(".layer_type")[0]).val("conv2d").trigger("change")
	await delay(500);

	$($(".layer_type")[1]).val("flatten").trigger("change")
	await delay(500);

	
}
*/

async function optimize_all_layers_once () {
	for(var i = 0; i < (get_number_of_layers() - 1); i++) {
		if($($(".layer_options_internal")[i]).find(".filters,.units").length) {
			await adjust_number_of_neurons(i);
		}
	}
}
