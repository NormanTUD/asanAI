function add_category_form(n, label_nr, uuid) {
	const uuid_input_form = uuidv4();
	const this_label = get_label_or_default(label_nr);

	$(`
		<form method="post" enctype="multipart/form-data" onkeydown="return event.key != 'Enter';">
			<a id="${uuid_input_form}_link"></a>
			<input id="${uuid_input_form}" onkeyup="rename_labels()" class="own_image_label" value="${this_label}" />
			<button type="button" class="delete_category_button" onclick="delete_category(this, '${uuid}')">&#10060;</button></div>
			<input type="file" class="own_image_files" multiple accept="image/*">
			<br/>
		</form>
	`).prependTo($(".own_image_upload_container")[n]);
}

function get_label_or_default(idx) {
	return idx < labels.length ? labels[idx] : "category " + idx;
}

function setup_drawing_board(n, uuid, label_nr) {
	const indiv = $(".own_image_upload_container")[n];
	const idname = uuid + "_sketcher";
	get_drawing_board_on_page(indiv, idname, "", uuid, label_nr);
}

function create_images_div(n) {
	$(`
		<div class="own_images_counter"
			style="
				display: inline-flex;
				align-items: center;
				gap: 6px;
				padding: 6px 14px;
				margin: 12px 0 8px 0;
				background: rgba(0, 122, 255, 0.06);
				border-radius: 20px;
				font-size: 12px;
				font-weight: 600;
				letter-spacing: 0.02em;
				color: #007AFF;
				transition: all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
			">
			<span class="TRANSLATEME_nr_of_images_in_this_category"></span>:
			<span class="own_images_count"
				style="
					background: #007AFF;
					color: white;
					border-radius: 10px;
					padding: 1px 8px;
					font-size: 11px;
					font-weight: 700;
					min-width: 20px;
					text-align: center;
					transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
				">0</span>
		</div>
		<div class="own_images"
			style="
				display: grid;
				grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
				gap: 10px;
				padding: 12px;
				border-radius: 12px;
				background: rgba(0, 0, 0, 0.02);
				min-height: 60px;
				transition: all 0.3s ease;
			">
		</div>
	`).appendTo($(".own_image_upload_container")[n]);
}

function update_image_counters() {
	$(".own_image_upload_container").each(function(i, container) {
		var count = $(container).find(".own_image_span").length;
		var $countEl = $(container).find(".own_images_count");
		var prevCount = parseInt($countEl.text()) || 0;

		if (prevCount !== count) {
			$countEl.css({
				'transform': 'scale(1.3)',
				'transition': 'transform 0.15s cubic-bezier(0.34, 1.56, 0.64, 1)'
			});
			setTimeout(function() {
				$countEl.text(count);
				$countEl.css('transform', 'scale(1)');
			}, 150);
		}
	});
}

function add_upload_container_html(k) {
	const webcam_style = cam ? "" : "display: none";
	const req = "";
	const c = "";

	$(`
		<div class="own_image_upload_container">
			<button style="${webcam_style}" class="large_button webcam_data_button" onclick="take_image_from_webcam(this)">&#128248; Webcam</button>
			<button ${req} style="${webcam_style}" class="${c} large_button webcam_data_button webcam_series_button" data-dont_hide_after_show="1" onclick="take_image_from_webcam_n_times(this)">&#128248; x 10 (10/s)</button>
		</div>
	`).appendTo("#own_images_container");
}

function get_upload_container_index() {
	const count = $(".own_image_upload_container").length;
	return count <= 2 ? count : 99999;
}

async function delete_category(item, uuid) {
	var category_nr = get_category_nr(item);
	var $container = $($(".own_image_upload_container")[category_nr]);

	// Animate out with buttery-smooth transition
	$container.css({
		'transition': 'all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
		'opacity': '0',
		'transform': 'scale(0.95) translateY(-8px)',
		'max-height': $container.outerHeight() + 'px',
		'overflow': 'hidden'
	});

	// Collapse height after fade
	setTimeout(function() {
		$container.css({
			'max-height': '0',
			'padding': '0 24px',
			'margin-bottom': '0',
			'border-color': 'transparent'
		});
	}, 200);

	// Remove after animation completes
	await new Promise(resolve => setTimeout(resolve, 500));
	$container.remove();

	auto_adjust_number_of_neurons($(".own_image_label").length);
	show_or_hide_hide_delete_category();
	enable_train_if_has_custom_images();
	await rename_labels();

	$("#save_button_" + uuid).remove();
	add_label_sidebar();
}

function get_category_nr(elem) {
	while (!$(elem).hasClass("own_image_upload_container")) {
		elem = $(elem).parent();
	}

	var nr = -1;
	var search_element_xpath = get_element_xpath(elem[0]);

	$(".own_image_upload_container").each(
		function (i, this_elem) {
			if (get_element_xpath(this_elem) == search_element_xpath) {
				nr = i;
			}
		}
	);

	return nr;
}

function get_drawing_board_on_page(indiv, idname, customfunc, uuid, label_nr) {
	if(!customfunc) {
		customfunc = "";
	}

	var eventsLog = [];
	var k = 99999;

	if($(".own_image_upload_container").length <= 2) {
		k = $(".own_image_upload_container").length;
	}

	var classes = "";

	var w = 150, h = 150;

	var save_button = "";

	if(uuid) {
		save_button = `<button id='save_button_${uuid}' style='border: 0; box-shadow: none;' class='large_button' onclick="add_image_to_category($('#${uuid}_sketcher')[0].toDataURL(), ${label_nr});event.preventDefault();clear_attrament('${uuid}_sketcher');">&#128190;</button>`;
	}

	var code = `<form class='no_mark${classes} atrament_form' onkeydown="return event.key != 'Enter';">
		<span class='atrament_settings'>
			<span class='invert_in_dark_mode'>
				<a class='atrament_buttons green_icon' onclick="atrament_set_brush(this, '${idname}');">
					<img width=32 src='_gui/icons/brush.svg' />
				</a>
			</span>
			<span class='invert_in_dark_mode'>
				<a class='atrament_buttons' onclick="atrament_set_fill(this, '${idname}');">
					<img width=32 src='_gui/fill_icon.svg'>
				</a>
			</span>
			<span onclick="clear_attrament('${idname}');${customfunc}" class='atrament_buttons'>
				<img height=32 src='_gui/delete.svg' />
			</span>
			<br>
			<span class='colorpicker_elements'>
				<img onclick='chose_nearest_color_picker(this)' src='_gui/colorwheel.svg' width=32 />
				<input type="text" name="value" id='${idname}_colorpicker' class="show_data jscolor" style='width: 50px' value="#000000" onchange="atrament_data['${idname}']['atrament'].color='#'+this.value;" />
			</span>
			<br>
			<input class="show_data pen_size_slider" type="range" min="1" oninput="atrament_data['${idname}']['atrament'].weight = parse_float(event.target.value);" value="20" step="1" max="100" autocomplete="off" />
			<br />
		</span>
		<canvas style="z-index: 2; margin: 5px; position: relative; outline: solid 5px black; width: ${w}px; height: ${h}px" width=${w} height=${h} id="${idname}"></canvas>
		${save_button}
	</form>`;

	var drawingboard = $(code);

	$(indiv).append(drawingboard);

	setup_atrament_data(idname, customfunc);
}

function get_custom_elements_from_webcam_page () {
	var imgs = [];

	$("#own_images_container").find("img").each((i, e) => {
		if($(e).prop("src").match(/data:image\/png;base64,/)) {
			imgs.push(e);
		}
	});

	$("#own_images_container").find("canvas").each((i, e) => {
		if($(e).attr("id").match(/_canvas$/)) {
			imgs.push(e);
		}
	});

	return imgs;
}

function insertCanvasIntoCategory(elem, categoryName, id, width, height) {
	let category = $(elem).parent();
	let container = $(category).find(".own_images")[0];
	let wrapper = document.createElement("div");
	wrapper.className = "own_image_span";
	wrapper.style.display = "block";
	wrapper.style.marginBottom = "8px";
	let canvas = document.createElement("canvas");
	canvas.dataset.category = categoryName;
	canvas.id = id + "_canvas";
	canvas.width = width;
	canvas.height = height;
	canvas.classList.add("webcam_series_image");
	canvas.classList.add("webcam_series_image_category_" + id);
	let del = document.createElement("span");
	del.innerHTML = "&#10060;&nbsp;&nbsp;&nbsp;";
	del.onclick = function () { delete_own_image(del); };
	wrapper.appendChild(canvas);
	wrapper.appendChild(del);
	container.insertBefore(wrapper, container.firstChild);
	update_image_counters();
	return canvas;
}

function handle_file_select(e) {
	if(!e.target.files || !window.FileReader) return;

	var upload_nr = get_nr_from_own_image_files(e);

	var imgDiv = $($(".own_images")[upload_nr]);

	var filesArr = Array.prototype.slice.call(e.target.files);
	filesArr.forEach(function(f) {
		if(!f.type.match("image.*")) {
			return;
		}
		var reader = new FileReader();
		reader.onload = function (e) {
			var html = "<span class=\"own_image_span\"><img height=\"90\" id=\"" + uuidv4() + "_image\" src=\"" + e.target.result + "\"><span onclick=\"delete_own_image(this)\">&#10060;&nbsp;&nbsp;&nbsp;</span></span>";
			imgDiv.append(html);
		};
		reader.readAsDataURL(f);

		update_image_counters();
	});
}

async function create_zip_with_custom_images () {
	var zipWriter = new zip.ZipWriter(new zip.BlobWriter("application/zip"));

	var canvasses = $(".own_image_span").find("canvas");

	for (var canvas_idx = 0; canvas_idx < canvasses.length; canvas_idx++) {
		var canvas = canvasses[canvas_idx];

		var blob = await get_canvas_blob(canvas);

		var label = $(canvas).parent().parent().parent().find(".own_image_label").val();

		var filename = canvas.id;

		if(!filename) {
			filename = uuidv4();
		}
		var path = label + "/" + filename + ".png";

		if(!blob) {
			err(language[lang]["canvas_blob_could_not_be_found"]);
		} else {
			let blob_reader = new zip.BlobReader(blob);

			try {
				await zipWriter.add(path, blob_reader);
			} catch (e) {
				if(Object.keys(e).includes("message")) {
					e = e.message;
				}

				err(`${language[lang]["trying_to_add_canvas_to"]} '${path}': ` + e);
			}
		}
	}

	var imgs = $(".own_image_span").find("img");

	for (var image_idx = 0; image_idx < imgs.length; image_idx++) {
		var img = imgs[image_idx];

		let blob = await get_img_blob(img);

		let label = $(img).parent().parent().parent().find(".own_image_label").val();

		let filename = img.id;

		if(!filename) {
			filename = uuidv4();
		}
		let path = label + "/" + filename + ".png";

		if(!blob) {
			err(language[lang]["img_blob_could_not_be_found"]);
		} else {
			let blob_reader = new zip.BlobReader(blob);

			try {
				await zipWriter.add(path, blob_reader);
			} catch (e) {
				if(Object.keys(e).includes("message")) {
					e = e.message;
				}

				err(`Trying to add img to '${path}': ` + e);
			}
		}
	}

	var res = await zipWriter.close();
	return res;
}

function add_image_to_category (img, category) {
	var imgDiv = $($(".own_images")[category]);
	var html = `<span class="own_image_span"><img data-category="${category}" height="90" src="${img}" /><span onclick="delete_own_image(this)">&#10060;&nbsp;&nbsp;&nbsp;</span></span><br>`;
	imgDiv.prepend(html);

	update_image_counters();
}

async function click_on_new_category_or_delete_category_until_number_is_right (number_of_categories) {
	while ($(".delete_category_button").length != number_of_categories) {
		if($(".delete_category_button").length > number_of_categories) {
			while ($(".delete_category_button").length != 1) {
				var $last_delete_button = $(".delete_category_button")[$(".delete_category_button").length - 1];

				$last_delete_button.click();

				await delay(1000);
			}
		} else {
			await add_new_category();
		}
	}
}

function delete_own_image(elem) {
	var $span = $(elem).parent();

	// Animate the image out
	$span.css({
		'transition': 'all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
		'opacity': '0',
		'transform': 'scale(0.8)',
		'pointer-events': 'none'
	});

	setTimeout(function() {
		// Remove the associated segmentation layer controls if they exist
		var img_or_canvas = $span.find("img,canvas").not("[id$='_layer']").first();
		if (img_or_canvas.length && img_or_canvas[0].id) {
			var layer_id = img_or_canvas[0].id + "_layer";
			$("#" + layer_id).remove();
			$("#" + layer_id + "_controls").remove();
			if (atrament_data[layer_id]) {
				delete atrament_data[layer_id];
			}
		}

		// Remove the <br> after the span if it exists
		var $next = $span.next();
		if ($next.is("br")) {
			$next.remove();
		}

		$span.remove();
		enable_train_if_has_custom_images();
		update_image_counters();
	}, 300);
}

function show_or_hide_hide_delete_category() {
	if ($(".own_image_label").length > 1) {
		$(".delete_category_button").show();
	} else {
		$(".delete_category_button").hide();
	}
}

async function create_and_download_zip () {
	var res = await create_zip_with_custom_images().then(save_custom_images_file);

	return res;
}

function save_custom_images_file (blob, filename="custom_images.zip") {
	save_file(filename, "data:application/zip", blob);
}

async function import_zip_and_replace_categories(inputElement) {
	var file = inputElement.files[0];
	if (!file) return;

	inputElement.value = "";

	var labelEl = document.getElementById("zip_upload_label");
	var inputEl = document.getElementById("zip_upload_input");

	inputEl.removeAttribute("onchange");
	inputEl.setAttribute("hidden", "true");
	inputEl.classList.add("force-hidden-input");

	labelEl.innerHTML = '<span class="zip-spinner"></span> Importing...';

	try {
		var zipReader = new zip.ZipReader(new zip.BlobReader(file));
		var entries = await zipReader.getEntries();

		if (!entries || entries.length === 0) {
			err("Zip file is empty or could not be read.");
			await zipReader.close();
			restore_zip_upload_button(labelEl, inputEl);
			return;
		}

		var categories = {};

		for (var i = 0; i < entries.length; i++) {
			var entry = entries[i];
			if (entry.directory) continue;

			var path_parts = entry.filename.split("/");
			if (path_parts.length < 2) continue;

			var cat_label = path_parts[0];
			var filename = path_parts.slice(1).join("/");

			if (!filename.match(/\.(png|jpg|jpeg|gif|bmp|webp|svg)$/i)) continue;

			var blob = await entry.getData(new zip.BlobWriter("image/png"));

			if (!categories[cat_label]) categories[cat_label] = [];
			categories[cat_label].push({ filename: filename, blob: blob });
		}

		await zipReader.close();

		var category_labels = Object.keys(categories);
		if (category_labels.length === 0) {
			err("No valid image categories found in zip.");
			restore_zip_upload_button(labelEl, inputEl);
			return;
		}

		await click_on_new_category_or_delete_category_until_number_is_right(category_labels.length);
		await delay(500);

		var label_inputs = $(".own_image_label");
		var image_containers = $(".own_images");

		for (var c = 0; c < category_labels.length; c++) {
			var this_label = category_labels[c];

			$(label_inputs[c]).val(this_label);
			$(image_containers[c]).empty();

			var images = categories[this_label];
			for (var img_idx = 0; img_idx < images.length; img_idx++) {
				var img_data = images[img_idx];
				var dataUrl = await blob_to_data_url(img_data.blob);

				var img_id = img_data.filename.replace(/\.[^.]+$/, "").replace(/[^a-zA-Z0-9_-]/g, "_") || uuidv4();

				var html = '<span class="own_image_span"><img height="90" id="' + img_id + '_image" src="' + dataUrl + '"><span onclick="delete_own_image(this)">&#10060;&nbsp;&nbsp;&nbsp;</span></span>';
				$(image_containers[c]).append(html);
			}
		}

		update_image_counters();
		await rename_labels();
		enable_train_if_has_custom_images();
		show_or_hide_hide_delete_category();

	} catch (e) {
		err("Error importing zip: " + (e.message || e));
	}

	restore_zip_upload_button(labelEl, inputEl);
}

function restore_zip_upload_button(labelEl, inputEl) {
	labelEl.innerHTML = '<img src="_gui/icons/upload.svg" height="15"> <span class="TRANSLATEME_upload_custom_zip_file" data-lang="en">Upload custom data from a .zip file</span>';
	inputEl.setAttribute("onchange", "import_zip_and_replace_categories(this)");
	inputEl.value = "";

	// Angle 3: Force hide via JS property
	inputEl.style.display = "none";
	inputEl.style.visibility = "hidden";
	inputEl.style.position = "absolute";
	inputEl.style.width = "0";
	inputEl.style.height = "0";
	inputEl.style.opacity = "0";
	inputEl.style.pointerEvents = "none";

	// Angle 4: Force hide via attribute
	inputEl.setAttribute("hidden", "true");
	inputEl.setAttribute("aria-hidden", "true");

	// Angle 5: Force hide via class
	inputEl.classList.add("force-hidden-input");
}

function blob_to_data_url(blob) {
	return new Promise(function(resolve, reject) {
		var reader = new FileReader();
		reader.onloadend = function() { resolve(reader.result); };
		reader.onerror = reject;
		reader.readAsDataURL(blob);
	});
}
