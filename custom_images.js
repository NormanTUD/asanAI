function add_category_form(n, label_nr, uuid) {
	const uuid_input_form = uuidv4();
	const this_label = get_label_or_default(label_nr);

	$(`
		<form method="post" enctype="multipart/form-data">
			<a id="${uuid_input_form}_link"></a>
			<input id="${uuid_input_form}" onkeyup="rename_labels()" class="own_image_label" value="${this_label}" />
			<button class="delete_category_button" onclick="delete_category(this, '${uuid}')">&#10060;</button></div>
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
	$(`<div class="own_images"></div>`).appendTo($(".own_image_upload_container")[n]);
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

	$($(".own_image_upload_container")[category_nr]).remove();

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
}
