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

	return await $.get("traindata/" + $("#dataset_category").val() + "/" + get_chosen_dataset() + "/" + filename);
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
	if(!skip_real_image_download) {
		$("#stop_downloading").show();
	}

	let json = await (_get_training_data());

	let data = [];
	var urls = [];
	var keys = {};

	var base_url = "traindata/" + $("#dataset_category").val() + "/" + get_chosen_dataset() + "/";

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

	var percentage_div = $("#percentage");

	if(!skip_real_image_download) {
		percentage_div.html("");
		percentage_div.show();
	}

	var old_percentage, eta;

	var times = [];

	$("#data_loading_progress_bar").show();
	$("#data_progressbar").css("display", "inline-block");

	for (var i = 0; i < urls.length; i++) {
		var start_time = Date.now();
		if(started_training || force_download) {
			var percentage = parseInt((i / urls.length) * 100);
			if(!stop_downloading_data) {
				if(!skip_real_image_download) {
					var percentage_text = percentage + "% (" + (i + 1) + " of " + urls.length + ") loaded...";
					document.title = "Loading data " + percentage_text;
					$("#data_progressbar>div").css("width", percentage + "%")
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
		var magic_wand = '<svg id="magic_wand" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 203 148.27"> <g id="wand"> <g class="wand-cls-1"> <path d="M194.63,152.18v-7.76C194.6,147,194.6,149.59,194.63,152.18Z" transform="translate(-10 -31.06)"/> </g> <rect class="wand-cls-2" x="5.07" y="129.83" width="117.08" height="17.1" transform="translate(-77.95 30.6) rotate(-35.06)"/> <rect class="wand-cls-3" x="106.38" y="88.26" width="32.89" height="17.1" transform="translate(-43.33 57.07) rotate(-35.06)"/> <ellipse class="wand-cls-4" cx="136.21" cy="87.42" rx="3.29" ry="8.55" transform="translate(-35.5 63.06) rotate(-35.06)"/> <ellipse class="wand-cls-2" cx="15.6" cy="172.07" rx="3.29" ry="8.55" transform="translate(-106.02 9.13) rotate(-35.06)"/> <ellipse class="wand-cls-3" cx="109.5" cy="106.16" rx="3.29" ry="8.55" transform="translate(-51.12 51.12) rotate(-35.06)"/> <path class="wand-cls-5" d="M138.71,85.25s4.26,6.06,2.68,9L20.15,179.32s-3.27.49-7.53-5.57Z" transform="translate(-10 -31.06)"/> </g> <g id="stars"> <g id="star1"> <polygon class="wand-cls-6" points="142.22 4.88 138.59 13.13 147.13 17.7 137.94 19.78 139.9 28.82 132.07 23.15 125.96 29.86 125.38 20.71 115.81 20.03 122.93 14.3 117.1 6.74 126.55 8.74 128.85 0 133.51 8.22 142.22 4.88"/> <polygon class="wand-cls-7" points="142.29 4.89 136.56 13.87 144.96 17.35 136.17 18.98 138.3 26.2 131.33 20.74 125.88 29.85 132.06 23.11 139.91 28.82 137.95 19.81 147.12 17.74 138.59 13.11 142.29 4.89"/> </g> <g id="star2"> <polygon class="wand-cls-6" points="166.3 14.45 165.13 17.09 167.87 18.55 164.93 19.22 165.55 22.12 163.04 20.3 161.09 22.45 160.9 19.52 157.83 19.3 160.11 17.46 158.25 15.04 161.27 15.68 162.01 12.88 163.51 15.52 166.3 14.45"/> <polygon class="wand-cls-7" points="166.32 14.45 164.48 17.33 167.18 18.44 164.36 18.96 165.04 21.28 162.81 19.53 161.06 22.45 163.04 20.29 165.56 22.12 164.93 19.23 167.87 18.57 165.13 17.08 166.32 14.45"/> </g> <g id="star3"> <polygon class="wand-cls-6" points="202.01 38.12 194.78 46.34 203 54.75 191.61 53.79 190.56 64.97 183.57 55.54 174.05 61.06 176.73 50.27 165.91 45.98 176.24 41.95 172.26 31.08 182.46 36.84 188.33 27.58 190.71 38.8 202.01 38.12"/> <polygon class="wand-cls-7" points="202.08 38.15 192.17 46.45 200.62 53.55 189.85 52.21 189.67 61.34 183.6 52.48 173.96 61.03 183.58 55.49 190.57 64.97 191.6 53.83 202.97 54.79 194.8 46.31 202.08 38.15"/> </g> <g id="star4"> <polygon class="wand-cls-6" points="155.07 63.05 153.01 67.75 157.87 70.35 152.64 71.52 153.75 76.67 149.3 73.44 145.83 77.25 145.5 72.05 140.06 71.67 144.1 68.41 140.79 64.11 146.16 65.25 147.47 60.28 150.13 64.95 155.07 63.05"/> <polygon class="wand-cls-7" points="155.11 63.06 151.86 68.17 156.63 70.14 151.63 71.07 152.84 75.17 148.88 72.07 145.78 77.25 149.29 73.42 153.76 76.67 152.65 71.54 157.86 70.36 153.01 67.73 155.11 63.06"/> </g> </g> </svg>';

		await Swal.fire({
			title: 'Generating tensors from images...',
			html: magic_wand + "<br><br><br><br><br>This may take some time, but your computer is working!",
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

async function get_xs_and_ys () {
	headerdatadebug("get_xs_and_ys()");

	$("#xy_display_data").html("").hide();
	//$("#photos").html("").hide();

	var data_origin = $("#data_origin").val();

	if($("#jump_to_interesting_tab").is(":checked")) {
		if(data_origin == "default") {
			show_tab_label("training_data_tab_label", 1);
		} else if(data_origin == "csv") {
			show_tab_label("own_csv_data_label", 1)
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

	if(traindata_struct[$("#dataset_category option:selected").text()]["datasets"][$( "#dataset option:selected" ).text()]["has_custom_data"]) {
		var model_id = traindata_struct[$("#dataset_category option:selected").text()]["datasets"][$( "#dataset option:selected" ).text()]["id"];
		xy_data = await get_json("get_training_data.php?id=" + model_id);

		var x = xy_data.x;
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
			var category = $("#dataset_category").val();

			var keys = [];
			var x = tf.tensor([]);
			var y;
			var category_counter = 0;

			if(category == "image") {
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
				//	this_data = shuffle(this_data);
				}

				for (var i = 0; i < this_data.length; i++) {
					var item = this_data[i]["item"];
					var this_category_counter = this_data[i]["category_counter"];
					x = x.concat(item);
					classes.push(this_category_counter);

					if($("#auto_augment").is(":checked")) {
						l("Auto augmenting images");
						if($("#augment_rotate_images").is(":checked")) {
							log("augment_rotate_images CHECKED")
							for (var degree = 0; degree < 360; degree += (360 / $("#number_of_rotations").val())) {
								l("Rotating image: " + j + "°");
								var augmented_img = tf.image.rotateWithOffset(item, degrees_to_radians(degree));
								x = x.concat(augmented_img);
								classes.push(this_category_counter);

								if($("#augment_invert_images").is(":checked")) {
									l("Inverted image that has been turned " + degree + "°");
									var add_value = (-255 / parseFloat($("#divide_by").val()));
									var inverted = tf.abs(tf.add(augmented_img, add_value));
									x = x.concat(inverted);
									classes.push(this_category_counter);
								}

								if($("#augment_flip_left_right").is(":checked")) {
									l("Flip left/right image that has been turned " + degree + "°");
									x = x.concat(tf.image.flipLeftRight(augmented_img));
									classes.push(label_nr);
								}
							}
						}

						if($("#augment_invert_images").is(":checked")) {
							l("Inverted image");
							var add_value = (-255 / parseFloat($("#divide_by").val()));
							var inverted = tf.abs(tf.add(item, add_value));
							x = x.concat(inverted);
							classes.push(this_category_counter);
						}

						if($("#augment_flip_left_right").is(":checked")) {
							l("Flip left/right");
							x = x.concat(tf.image.flipLeftRight(item));
							classes.push(label_nr);
						}
					}
				}

				y = tf.tensor(classes);

				for (let [key, value] of Object.entries(imageData)) {
					for (var i = 0; i < imageData[key].length; i++) {
						var item = imageData[key][i];
						dispose(item);
					}
				}
				imageData = null;
			} else if(category == "classification") {
				var x_string, y_string;
				x_string = await _get_training_data_from_filename("x.txt");
				y_string = await _get_training_data_from_filename("y.txt");
				x = numpy_str_to_tf_tensor(x_string, max_number_values);
				y = numpy_str_to_tf_tensor(y_string, max_number_values);

				var x_print_string = tensor_print_to_string(x);
				var y_print_string = tensor_print_to_string(y);

				$("#xy_display_data").html("<table border=1><tr><th>X</th><th>Y</th></tr><tr><td><pre>" + x_print_string + "</pre></td><td><pre>" + y_print_string + "</pre></td></tr></table>").show();
			} else {
				alert("Unknown dataset category: " + category);
			}


			xy_data = {"x": x, "y": y, "keys": keys, "number_of_categories": category_counter};
		} else if(data_origin == "image") {
			var magic_wand = '<svg id="magic_wand" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 203 148.27"> <g id="wand"> <g class="wand-cls-1"> <path d="M194.63,152.18v-7.76C194.6,147,194.6,149.59,194.63,152.18Z" transform="translate(-10 -31.06)"/> </g> <rect class="wand-cls-2" x="5.07" y="129.83" width="117.08" height="17.1" transform="translate(-77.95 30.6) rotate(-35.06)"/> <rect class="wand-cls-3" x="106.38" y="88.26" width="32.89" height="17.1" transform="translate(-43.33 57.07) rotate(-35.06)"/> <ellipse class="wand-cls-4" cx="136.21" cy="87.42" rx="3.29" ry="8.55" transform="translate(-35.5 63.06) rotate(-35.06)"/> <ellipse class="wand-cls-2" cx="15.6" cy="172.07" rx="3.29" ry="8.55" transform="translate(-106.02 9.13) rotate(-35.06)"/> <ellipse class="wand-cls-3" cx="109.5" cy="106.16" rx="3.29" ry="8.55" transform="translate(-51.12 51.12) rotate(-35.06)"/> <path class="wand-cls-5" d="M138.71,85.25s4.26,6.06,2.68,9L20.15,179.32s-3.27.49-7.53-5.57Z" transform="translate(-10 -31.06)"/> </g> <g id="stars"> <g id="star1"> <polygon class="wand-cls-6" points="142.22 4.88 138.59 13.13 147.13 17.7 137.94 19.78 139.9 28.82 132.07 23.15 125.96 29.86 125.38 20.71 115.81 20.03 122.93 14.3 117.1 6.74 126.55 8.74 128.85 0 133.51 8.22 142.22 4.88"/> <polygon class="wand-cls-7" points="142.29 4.89 136.56 13.87 144.96 17.35 136.17 18.98 138.3 26.2 131.33 20.74 125.88 29.85 132.06 23.11 139.91 28.82 137.95 19.81 147.12 17.74 138.59 13.11 142.29 4.89"/> </g> <g id="star2"> <polygon class="wand-cls-6" points="166.3 14.45 165.13 17.09 167.87 18.55 164.93 19.22 165.55 22.12 163.04 20.3 161.09 22.45 160.9 19.52 157.83 19.3 160.11 17.46 158.25 15.04 161.27 15.68 162.01 12.88 163.51 15.52 166.3 14.45"/> <polygon class="wand-cls-7" points="166.32 14.45 164.48 17.33 167.18 18.44 164.36 18.96 165.04 21.28 162.81 19.53 161.06 22.45 163.04 20.29 165.56 22.12 164.93 19.23 167.87 18.57 165.13 17.08 166.32 14.45"/> </g> <g id="star3"> <polygon class="wand-cls-6" points="202.01 38.12 194.78 46.34 203 54.75 191.61 53.79 190.56 64.97 183.57 55.54 174.05 61.06 176.73 50.27 165.91 45.98 176.24 41.95 172.26 31.08 182.46 36.84 188.33 27.58 190.71 38.8 202.01 38.12"/> <polygon class="wand-cls-7" points="202.08 38.15 192.17 46.45 200.62 53.55 189.85 52.21 189.67 61.34 183.6 52.48 173.96 61.03 183.58 55.49 190.57 64.97 191.6 53.83 202.97 54.79 194.8 46.31 202.08 38.15"/> </g> <g id="star4"> <polygon class="wand-cls-6" points="155.07 63.05 153.01 67.75 157.87 70.35 152.64 71.52 153.75 76.67 149.3 73.44 145.83 77.25 145.5 72.05 140.06 71.67 144.1 68.41 140.79 64.11 146.16 65.25 147.47 60.28 150.13 64.95 155.07 63.05"/> <polygon class="wand-cls-7" points="155.11 63.06 151.86 68.17 156.63 70.14 151.63 71.07 152.84 75.17 148.88 72.07 145.78 77.25 149.29 73.42 153.76 76.67 152.65 71.54 157.86 70.36 153.01 67.73 155.11 63.06"/> </g> </g> </svg>';
			Swal.fire({
				title: 'Generating tensors from images...',
				html: magic_wand + "<br><br><br><br><br>This may take some time, but your computer is working!",
				timer: 2000,
				showConfirmButton: false
			});

			l("Generating data from images");

			var category_counter = $(".own_image_label").length;
			var keys = [];
			var x = [];
			var y = [];

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
								x.push(await tf.image.flipLeftRight(resized_img.expandDims()).arraySync()[0]);
								classes.push(label_nr);
							}
						}
					}
				}
			}

			if($("#shuffle_data").is(":checked")) {
				tf.util.shuffleCombo(x, classes);
			}

			x = tf.tensor(x);
			y = tf.tensor(classes).expandDims(); // Bleibt leer, wird in categoricalCrossentropy gefüllt

			l("Done generating data from images");

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


	if(["categoricalCrossentropy", "binaryCrossentropy"].includes(loss)) {
		try {
			xy_data.y = tf.oneHot(tf.tensor1d(classes, "int32"), xy_data["number_of_categories"]);
		} catch (e) {
			header(e);
		}
	}

	//log("X-Shape: " + xy_data.x.shape);

	// TODO:
	//assert(xy_data.x.shape[0] == xy_data.x.shape[0], "FEHLER");

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
	if($("#dataset_category").val() == "image") {
		set_input_shape("[" + width + ", " + height + ", 3]");
	}
}

async function _get_training_data() {
	var url = "traindata/index.php?dataset=" + get_chosen_dataset() + "&dataset_category=" + $("#dataset_category").val() + "&max_number_of_files_per_category=" +  $("#max_number_of_files_per_category").val();
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
			log("y_headers.length != 1 but " + y_headers.length);
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

			log(cam_config);
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
	var category = $(elem).parent();
	var cam_image = await cam_data.capture();
	cam_image = cam_image.resizeNearestNeighbor([width, height]).toFloat().expandDims()
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
			'<canvas id="' + id + '_canvas" width="' + width + '" height="' + height + '"></canvas><span onclick="delete_own_image(this)">&#10060;&nbsp;&nbsp;&nbsp;</span>' +
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
