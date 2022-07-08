"use strict";

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

	for (var i = 0; i < urls.length; i++) {
		var start_time = Date.now();
		if(started_training || force_download) {
			var percentage = parseInt((i / urls.length) * 100);
			if(!stop_downloading_data) {
				if(!skip_real_image_download) {
					var percentage_text = percentage + "% (" + (i + 1) + " of " + urls.length + ") loaded...";
					document.title = "Loading data " + percentage_text;
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
	var data_type_val = $("#data_type").val();

	if($("#jump_to_training_tab").is(":checked")) {
		if(data_origin == "default") {
			if(data_origin == "default") {
				$("#training_data_tab_label").click();
			} else {
				log("Invalid option " + data_origin);
			}
		} else if (data_origin == "own") {
			if(data_type_val == "csv") {
				$("#own_csv_data_label").click();
			} else if (data_type_val == "image") {
				$("#own_image_data_label").click();
			} else if (data_type_val == "tensordata") {
				$("#own_tensor_data_label").click();
			} else {
				log("Invalid option " + data_type_val);
			}
		} else {
			log("INVALID OPTION " + data_origin);
		}
	}

	var max_number_values = 0;
	if(!is_hidden_or_has_hidden_parent($("#max_number_values"))) {
		max_number_values = parseInt($("#max_number_values").val());
	}

	var loss = $("#loss").val();

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
			if(xy_data === null) {
				var category = $("#dataset_category").val();

				var keys = [];
				var x = tf.tensor([]);
				var y;
				var category_counter = 0;
				var classes = [];

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

				if(["categoricalCrossentropy", "binaryCrossentropy"].includes(loss)) {
					y = tf.oneHot(tf.tensor1d(classes, "int32"), category_counter);
				}

				xy_data = {"x": x, "y": y, "keys": keys, "number_of_categories": category_counter};
			}
		} else {
			if(data_type_val == "image") {
				Swal.fire({
					title: 'Generating tensors from images...',
					html: "This may take some time, but your computer is working!",
					timer: 2000,
					showConfirmButton: false
				});

				var category_counter = $(".own_image_label").length;
				var keys = [];
				var x = [];
				var y = [];
				var classes = [];

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

							x.push(await resized_img.arraySync());
							classes.push(label_nr);
						}
					}
				}

				x = tf.tensor(x);
				y = tf.tensor(y).expandDims();

				if(shuffle_before_training()) {
					var indices = Array.from(Array(x.shape[0]).keys());
					var shuffled_indices = shuffle(indices);
					shuffled_indices = tf.tensor(shuffled_indices, null, 'int32');
					x = tf.gather(x, shuffled_indices);
					y = tf.gather(y, shuffled_indices);
				}

				if(["categoricalCrossentropy", "binaryCrossentropy"].includes(loss)) {
					try {
						y = tf.oneHot(tf.tensor1d(classes, "int32"), category_counter);
					} catch (e) {
						header(e);
					}
				}

				xy_data = {"x": x, "y": y, "keys": keys, "number_of_categories": category_counter};
			} else if (data_type_val == "tensordata") {
				x = numpy_str_to_tf_tensor(x_file, max_number_values);
				y = numpy_str_to_tf_tensor(y_file, max_number_values);

				xy_data = {"x": x, "y": y};
			} else if (data_type_val == "csv") {
				xy_data = get_x_y_from_csv();
			} else {
				alert("Unknown data type: " + data_type_val);
			}

			$("#reset_data").hide();
		}
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

function get_data_struct_by_header(header, parsed) {
	var y_between_0_and_1 = true;
	var indices = {};

	for (var i = 0; i < header.length; i++) {
		indices[header[i]] = parsed.head.indexOf(header[i]);
	}

	var data = [];

	for (var line_nr = 0; line_nr < parsed.data.length; line_nr++) {
		var line = [];
		for (var item_nr = 0; item_nr < header.length; item_nr++) {
			var ln = parseFloat(parsed.data[line_nr][indices[header[item_nr]]]);
			line.push(ln);
			if(y_between_0_and_1) {
				if(ln < 0 || ln > 1) {
					y_between_0_and_1 = false;
				}
			}
		}

		data.push(line);
	}

	return { "data": data, "y_between_0_and_1": y_between_0_and_1 };
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

function get_x_y_from_csv () {
	reset_data();

	var seperator = get_csv_seperator();
	var csv = $("#csv_file").val();

	var headers = $(".header_select");

	var headers_data = get_headers(headers);
	var x_headers = headers_data["x"];
	var y_headers = headers_data["y"];

	labels = y_headers;

	var parsed = parse_csv_file(csv);

	var x_data = get_data_struct_by_header(x_headers, parsed);
	var y_data = get_data_struct_by_header(y_headers, parsed);

	var x = x_data["data"];
	var y = y_data["data"];

	var y_between_0_and_1 = y_data["y_between_0_and_1"];

	x = tf.tensor(x);
	y = tf.tensor(y);

	if(shuffle_before_training()) {
		var indices = Array.from(Array(x.shape[0]).keys());
		var shuffled_indices = shuffle(indices);
		shuffled_indices = tf.tensor(shuffled_indices, null, 'int32');
		x = tf.gather(x, shuffled_indices);
		y = tf.gather(y, shuffled_indices);
	}

	return {
		"x": x,
		"y": y,
		"keys": y_headers,
		"number_of_categories":
		y_headers.length,
		"y_between_0_and_1": y_between_0_and_1
	};
}

/*
 * This function is for saving X and Y data later on to an external DB.
*/

async function get_x_y_as_array () {
	while (started_training) {
		log("Awaiting finishing of training");
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
			videoElement.width = width;
			videoElement.height = height;
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
				cam_config["deviceId"] = available_webcams[parseInt($("#which_webcam").val())];
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

async function take_image_from_webcam (elem) {
	l("Took photo from webcam");
	var category = $(elem).parent();
	var cam_image = await cam_data.capture();
	cam_image = cam_image.resizeNearestNeighbor([width, height]).toFloat().expandDims()
	cam_image = await cam_image.arraySync()[0];

	var base_id = md5($(category).find(".own_image_label").val());

	var i = 1;
	var id = base_id + "_" + i;;

	while ($("#" + id + "_canvas").length != 0) {
		id = base_id + "_" + i;
		i++;
	}

	$(category).find(".own_images").append('<span class="own_image_span"><canvas id="' + id + '_canvas" width="' + width + '" height="' + height + '"></canvas><span onclick="delete_own_image(this)">&#10060;&nbsp;&nbsp;&nbsp;</span></span>');

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
}
