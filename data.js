"use strict";

var range = n => [...Array(n).keys()];

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

	var lines = numpy_str?.split("\n");

	if(!lines) {
		return tensor([]);
	}

	var tensor_type = "float32";
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
			continue; // skip shape comment or other comments
		}

		if (k === -1) { // first slice
			k = 0;
			data[k] = [];
		}

		var new_items = line?.split(/\s+/)?.filter(s => s !== "");

		if(!new_items) {
			return tensor([]);
		}

		if (tensor_type === "complex64" || tensor_type === "int32" || tensor_type === "float32") {
			new_items = new_items.map(Number);
		} else if (tensor_type === "string") {
			new_items = new_items.map(String);
		} else {
			wrn("[numpy_str_to_tf_tensor] Unknown tensor_type: " + tensor_type);
		}

		if (new_items.length > 0) data[k].push(new_items);
	}

	data = data.filter(slice => slice.length > 0);

	data = data.map(slice => slice.flat());

	var shapeline = lines.find(l => /^#\s*shape:?/i.test(l));
	var shape;
	if (shapeline) {
		var shape_match = /^#\s*shape:? \((.*)\)\s*$/.exec(shapeline);
		shape = eval("[" + shape_match[1] + "]");
	} else {
		shape = [data.length, data[0].length]; // fallback
	}

	shape[0] = data.length;

	var x = tensor(data, shape, tensor_type);
	return x;
}

function _training_data_fetch_error_details(err) {
	if (!err) return "unknown error";

	var parts = [];
	if (err.name) parts.push(err.name + ": " + (err.message || ""));
	else parts.push("" + err);

	if (err.http_status !== undefined) parts.push("http_status=" + err.http_status);
	if (err.status_text) parts.push("status_text=" + err.status_text);
	if (err.ready_state !== undefined) parts.push("ready_state=" + err.ready_state);

	return parts.join(", ");
}

// One fetch attempt, using fetch() where available and jQuery.ajax() as the
// fallback. Both paths attach the status fields we need for the diagnostics.
async function _fetch_training_data_text(url) {
	if (typeof fetch === "function") {
		var response = await fetch(url, { cache: "no-store" });
		if (!response.ok) {
			var http_error = new Error("HTTP " + response.status + " " + response.statusText);
			http_error.http_status = response.status;
			http_error.status_text = response.statusText;
			throw http_error;
		}
		return await response.text();
	}

	return await new Promise(function(resolve, reject) {
		$.ajax({ url: url, dataType: "text", cache: false })
			.done(resolve)
			.fail(function(jqXHR, textStatus, errorThrown) {
				var e = new Error("XHR " + textStatus + (errorThrown ? ": " + errorThrown : ""));
				e.http_status = jqXHR ? jqXHR.status : 0;
				e.status_text = jqXHR ? jqXHR.statusText : "";
				e.ready_state = jqXHR ? jqXHR.readyState : -1;
				reject(e);
			});
	});
}

async function _get_training_data_from_filename(filename, max_attempts = 4) {
	assert(typeof(filename) == "string", "filename must be string, not " + typeof(filename));

	const chosen_dataset = get_chosen_dataset();
	const base_url = "traindata/" + chosen_dataset + "/" + filename;
	max_attempts = Math.max(1, parseInt(max_attempts, 10) || 4);
	const failures = [];

	for (let attempt = 1; attempt <= max_attempts; attempt++) {
		// Retries bypass the browser cache and any half-written response from
		// the previous attempt. This matters for transient transport errors such
		// as Opera's net::ERR_NO_BUFFER_SPACE, where the same URL usually loads
		// fine on the next try.
		const url = attempt === 1
			? base_url
			: base_url + "?_retry=" + attempt + "&_t=" + Date.now();

		dbg(`Trying to get ${filename} for dataset '${chosen_dataset}' (attempt ${attempt}/${max_attempts})`);

		try {
			const text = await _fetch_training_data_text(url);

			if (typeof text !== "string" || text.trim() === "") {
				throw new Error("response body is empty");
			}

			if (/^\s*</.test(text)) {
				throw new Error("response is HTML, not training data (is the traindata path being served?)");
			}

			if (attempt > 1) {
				dbg(`[get_x_and_y_from_txt_files] ${filename} succeeded on attempt ${attempt}/${max_attempts}`);
			}

			return text;
		} catch (e) {
			failures.push({
				attempt: attempt,
				url: url,
				details: _training_data_fetch_error_details(e)
			});

			if (attempt < max_attempts) {
				await new Promise(function(resolve) { setTimeout(resolve, 150 * attempt); });
			}
		}
	}

	const failure_lines = failures.map(function(f) {
		return "  " + f.attempt + ". " + f.url + "\n     " + f.details;
	}).join("\n");

	throw new Error(
		"Could not load training data file '" + filename + "' for dataset '" + chosen_dataset + "' after " +
		max_attempts + " attempts.\n" +
		"Failures:\n" + failure_lines + "\n" +
		"Checks: the file must exist at '" + base_url + "' and be served as text; the server log should show the request. " +
		"A transient browser/network failure (e.g. net::ERR_NO_BUFFER_SPACE), an empty/HTML response, or a missing file are the usual causes. " +
		"Reload the page, clear the browser cache, verify the file, then retry."
	);
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

async function load_image_with_retry (url, attempts = 3) {
	var last_error = null;

	for (var attempt = 1; attempt <= attempts; attempt++) {
		try {
			return await load_image(url);
		} catch (e) {
			last_error = e;
			if (attempt < attempts) {
				await delay(100 * attempt);
			}
		}
	}

	throw last_error;
}

async function force_download_image_preview_data () {
	if(input_shape_is_image()) {
		var old_img_cat = get_imgcat();
		set_imgcat(1);
		var old_force_download = force_download;
		enable_force_download();
		var data = await download_image_data(0, 0, {title: language[lang]["loading_example_images"], html: ""}, 1);
		await dispose(data);

		set_force_download(old_force_download);
		set_imgcat(old_img_cat);
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

	if(json === undefined || json === null) {
		err("Could not get JSON");
		return [null, null, null];
	}

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

async function _get_set_percentage_text(percentage, url_idx, urls_length, percentage_div, old_percentage, times) {
	var percentage_text = percentage + "%";

	var eta;

	var data_progressbar_div = $("#data_progressbar>div");
	data_progressbar_div.css("width", percentage + "%");

	if (finished_loading) {
		set_document_title(language[lang]["loading_data"] + " " + (url_idx + 1) + " " + language[lang]["of"] + " " + urls_length + " (" + percentage_text + ") - asanAI");

		if (percentage > 20 && times.length > 0) {
			var remaining_items = urls_length - url_idx;
			var time_per_image = decille(times, ((100 - percentage) / 100) + 0.01);

			if (time_per_image !== 0 && !isNaN(time_per_image) && time_per_image !== null && time_per_image !== undefined) {
				eta = parse_int(parse_int(remaining_items * Math.floor(time_per_image)) / 1000) + 10;
				old_percentage = percentage;

				percentage_text += " ca. " + human_readable_time(eta) + " " + language[lang]["left"];
			}
		}
	}

	percentage_div.html(percentage_text);

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

function show_skip_real_img_msg () {
	if(!shown_skipping_real_msg) {
		dbg("Skipping real image download because skip_real_image_download was True");
		shown_skipping_real_msg = true;
	}
}

function log_once_internal(flag, msg) {
	if (!download_shown_flags[flag]) {
		dbg(msg);
		download_shown_flags[flag] = true;
	}
}

// ============

if (!window._perf_helpers) window._perf_helpers = {};
window._perf_helpers.tf_task_queue = window._perf_helpers.tf_task_queue || [];
window._perf_helpers.tf_active = window._perf_helpers.tf_active || 0;
window._perf_helpers.dom_pending = window._perf_helpers.dom_pending || [];
window._perf_helpers.dom_timer = window._perf_helpers.dom_timer || null;

function assertType(value, type, msg) {
	if (typeof value !== type) throw new Error(msg);
}

function createImageElement(url, height, width) {
	const img = document.createElement("img");
	img.src = url;
	if (height) img.height = height;
	if (width) img.width = width;
	img.className = "class_download_img";
	img.onclick = () => predict_data_img(img, "image"); // await not possible here
	return img;
}

var _photos_container_visible = undefined;
function showPhotosContainer() {
	const container = $("#photoscontainer");
	if (_photos_container_visible === undefined) {
		_photos_container_visible = container.css("display") !== "none";
	}
	if (!_photos_container_visible) {
		container.show();
		_photos_container_visible = true;
	}
}

var _photo_gallery = {
	entries: [],
	expected: 0,
	canvas: null,
	sources: null,
	layout: null,
	hover_index: -1,
	hover_timer: null,
	hover_token: 0,
	hover_predicting: false,
	tooltip: null,
	resize_observer: null,
	resize_frame: null
};

var _photo_gallery_prediction_cache = {};

function _photo_gallery_container () {
	return document.getElementById("photos");
}

function _photo_gallery_thumb_size () {
	var thumb_width = parse_int(width);
	var thumb_height = parse_int(height);

	if (!(thumb_width > 0)) {
		thumb_width = 40;
	}
	if (!(thumb_height > 0)) {
		thumb_height = 40;
	}

	return [thumb_width, thumb_height];
}

function _photo_gallery_ensure_dom () {
	const container = _photo_gallery_container();

	if (!container) {
		return null;
	}

	var canvas = document.getElementById("photo_gallery_canvas");

	if (!canvas) {
		canvas = document.createElement("canvas");
		canvas.id = "photo_gallery_canvas";
		container.appendChild(canvas);
		canvas.addEventListener("mousemove", _photo_gallery_on_mousemove);
		canvas.addEventListener("mouseleave", _photo_gallery_hide_tooltip);
	}

	_photo_gallery.canvas = canvas;

	var sources = document.getElementById("photo_gallery_sources");

	if (!sources) {
		sources = document.createElement("div");
		sources.id = "photo_gallery_sources";
		container.appendChild(sources);
	}

	_photo_gallery.sources = sources;
	_photo_gallery_observe_resize(container);
	_photo_gallery_bind_window_resize();

	return canvas;
}

function _photo_gallery_observe_resize (container) {
	if (_photo_gallery.resize_observer || typeof ResizeObserver === "undefined") {
		return;
	}

	_photo_gallery.resize_observer = new ResizeObserver(function () {
		_photo_gallery_schedule_relayout();
	});

	_photo_gallery.resize_observer.observe(container);
}

function _photo_gallery_schedule_relayout () {
	if (_photo_gallery.resize_frame) {
		return;
	}

	_photo_gallery.resize_frame = requestAnimationFrame(function () {
		_photo_gallery.resize_frame = null;
		_photo_gallery_relayout();
	});
}

function _photo_gallery_compute_layout (count) {
	const container = _photo_gallery_container();
	var css_width = container ? container.clientWidth : 0;

	if (!(css_width > 0)) {
		css_width = Math.max(240, Math.min((window.innerWidth || 1200) - 80, 1200));
	}

	const thumb_size = _photo_gallery_thumb_size();
	const margin = 1;
	const cell_width = thumb_size[0] + margin * 2;
	const cell_height = thumb_size[1] + margin * 2;
	const cols = Math.max(1, Math.floor(css_width / cell_width));
	const rows = Math.max(1, Math.ceil(Math.max(count, 1) / cols));
	const css_height = rows * cell_height;
	var dpr = Math.min(window.devicePixelRatio || 1, 2);

	if (css_height * dpr > 16000) {
		dpr = 1;
	}

	return {
		css_width: css_width,
		css_height: css_height,
		cols: cols,
		rows: rows,
		cell_width: cell_width,
		cell_height: cell_height,
		thumb_width: thumb_size[0],
		thumb_height: thumb_size[1],
		margin: margin,
		dpr: dpr
	};
}

function _photo_gallery_apply_layout (count) {
	const canvas = _photo_gallery_ensure_dom();

	if (!canvas) {
		return;
	}

	const layout = _photo_gallery_compute_layout(count);
	_photo_gallery.layout = layout;

	canvas.style.width = "100%";
	canvas.style.height = layout.css_height + "px";
	canvas.width = Math.max(1, Math.round(layout.css_width * layout.dpr));
	canvas.height = Math.max(1, Math.round(layout.css_height * layout.dpr));

	const ctx = canvas.getContext("2d");

	if (ctx) {
		ctx.setTransform(layout.dpr, 0, 0, layout.dpr, 0, 0);
	}
}

function _photo_gallery_clear_canvas () {
	const canvas = _photo_gallery.canvas;
	const layout = _photo_gallery.layout;

	if (!canvas || !layout) {
		return;
	}

	const ctx = canvas.getContext("2d");

	if (ctx) {
		ctx.clearRect(0, 0, layout.css_width, layout.css_height);
	}
}

function _photo_gallery_draw_index (index) {
	const canvas = _photo_gallery.canvas;
	const layout = _photo_gallery.layout;
	const entry = _photo_gallery.entries[index];

	if (!canvas || !layout || !entry || !entry.img) {
		return;
	}

	if (!entry.img.complete || !entry.img.naturalWidth) {
		return;
	}

	const ctx = canvas.getContext("2d");

	if (!ctx) {
		return;
	}

	const col = index % layout.cols;
	const row = Math.floor(index / layout.cols);
	const x = col * layout.cell_width + layout.margin;
	const y = row * layout.cell_height + layout.margin;

	try {
		ctx.drawImage(entry.img, x, y, layout.thumb_width, layout.thumb_height);
	} catch (e) {
		dbg("[photo_gallery] drawImage failed: " + e);
	}
}

function _photo_gallery_redraw () {
	_photo_gallery_clear_canvas();

	for (var index = 0; index < _photo_gallery.entries.length; index++) {
		_photo_gallery_draw_index(index);
	}
}

function _photo_gallery_relayout () {
	if (!_photo_gallery.entries.length && !_photo_gallery.expected) {
		return;
	}

	const count = Math.max(_photo_gallery.expected, _photo_gallery.entries.length);
	const layout = _photo_gallery_compute_layout(count);
	const previous_layout = _photo_gallery.layout;

	if (previous_layout && previous_layout.css_width === layout.css_width && previous_layout.cols === layout.cols && previous_layout.css_height === layout.css_height && previous_layout.dpr === layout.dpr) {
		return;
	}

	_photo_gallery_apply_layout(count);
	_photo_gallery_redraw();
}

function _photo_gallery_bind_window_resize () {
	if (_photo_gallery.window_resize_bound || typeof window === "undefined") {
		return;
	}

	_photo_gallery.window_resize_bound = true;
	window.addEventListener("resize", _photo_gallery_schedule_relayout);
}

function _photo_gallery_reset () {
	_photo_gallery.entries = [];
	_photo_gallery.expected = 0;
	_photo_gallery.layout = null;
	_photo_gallery.hover_index = -1;
	_photo_gallery.hover_token++;

	if (_photo_gallery.hover_timer) {
		clearTimeout(_photo_gallery.hover_timer);
		_photo_gallery.hover_timer = null;
	}

	_photo_gallery_hide_tooltip();

	const container = _photo_gallery_container();

	if (container) {
		container.innerHTML = "";
	}

	_photo_gallery.canvas = null;
	_photo_gallery.sources = null;
}

function _photo_gallery_prepare (count) {
	_photo_gallery_reset();
	_photo_gallery.expected = Math.max(0, parse_int(count) || 0);
	_photo_gallery_apply_layout(_photo_gallery.expected);
}

function _photo_gallery_add_image (img, url) {
	const canvas = _photo_gallery_ensure_dom();

	if (!canvas) {
		return;
	}

	const index = _photo_gallery.entries.length;
	_photo_gallery.entries.push({img: img, url: url});

	if (!_photo_gallery.layout) {
		_photo_gallery.expected = Math.max(_photo_gallery.expected, index + 1);
		_photo_gallery_apply_layout(_photo_gallery.expected);
	} else if (index >= _photo_gallery.expected) {
		_photo_gallery.expected = Math.max(index + 1, Math.ceil((index + 1) * 1.25), 16);
		_photo_gallery_apply_layout(_photo_gallery.expected);
		_photo_gallery_redraw();
	}

	_photo_gallery_draw_index(index);

	if (!img.complete || !img.naturalWidth) {
		img.addEventListener("load", function () {
			_photo_gallery_draw_index(index);
		}, {once: true});
	}
}

function _photo_gallery_finalize () {
	if (!_photo_gallery.entries.length) {
		_photo_gallery.expected = 0;
		_photo_gallery_apply_layout(0);
		_photo_gallery_clear_canvas();
		return;
	}

	if (_photo_gallery.expected !== _photo_gallery.entries.length) {
		_photo_gallery.expected = _photo_gallery.entries.length;
		_photo_gallery_apply_layout(_photo_gallery.expected);
		_photo_gallery_redraw();
	}
}

function get_photo_gallery_images () {
	return _photo_gallery.entries.map(function (entry) {
		return entry.img;
	});
}

function get_photos_and_own_images_for_visualization () {
	const gallery_images = get_photo_gallery_images();
	const extra_photos = $("#photos").find("img,canvas").toArray().filter(function (element) {
		return element.id !== "photo_gallery_canvas" && !$(element).closest("#photo_gallery_sources").length;
	});

	return [
		...gallery_images,
		...extra_photos,
		...$(".own_images").find("img,canvas").toArray()
	];
}

function _photo_gallery_hide_tooltip () {
	_photo_gallery.hover_index = -1;
	_photo_gallery.hover_token++;

	if (_photo_gallery.hover_timer) {
		clearTimeout(_photo_gallery.hover_timer);
		_photo_gallery.hover_timer = null;
	}

	if (_photo_gallery.tooltip) {
		_photo_gallery.tooltip.style.display = "none";
	}
}

function _photo_gallery_ensure_tooltip () {
	if (_photo_gallery.tooltip && document.body.contains(_photo_gallery.tooltip)) {
		return _photo_gallery.tooltip;
	}

	const tooltip = document.createElement("div");
	tooltip.id = "photo_gallery_tooltip";
	tooltip.className = "grid_image_tooltip";
	tooltip.style.display = "none";
	document.body.appendChild(tooltip);
	_photo_gallery.tooltip = tooltip;

	return tooltip;
}

function _photo_gallery_escape (value) {
	return $("<div>").text(value === undefined || value === null ? "" : value).html();
}

function _photo_gallery_preview_node (entry) {
	if (!entry || !entry.img || entry.img.tagName !== "IMG" || !entry.img.src) {
		return null;
	}

	const preview = entry.img.cloneNode(false);
	preview.removeAttribute("width");
	preview.removeAttribute("height");
	preview.className = "grid_image_tooltip_img";

	return preview;
}

function _photo_gallery_position_tooltip (client_x, client_y) {
	const tooltip = _photo_gallery_ensure_tooltip();
	const padding = 14;
	var left = client_x + padding;
	var top = client_y + padding;

	if (left + tooltip.offsetWidth > window.innerWidth - 8) {
		left = client_x - tooltip.offsetWidth - padding;
	}
	if (top + tooltip.offsetHeight > window.innerHeight - 8) {
		top = client_y - tooltip.offsetHeight - padding;
	}

	tooltip.style.left = Math.max(8, left) + "px";
	tooltip.style.top = Math.max(8, top) + "px";
}

function _photo_gallery_prediction_summary (values) {
	if (!Array.isArray(values) || !values.length) {
		return null;
	}

	if (values.length === 1) {
		return {
			label: (typeof values[0] === "number") ? values[0].toFixed(3) : String(values[0]),
			probability: null,
			index: 0
		};
	}

	var max_index = 0;

	for (var index = 1; index < values.length; index++) {
		if (values[index] > values[max_index]) {
			max_index = index;
		}
	}

	const label = (typeof labels !== "undefined" && labels && labels[max_index] !== undefined) ? labels[max_index] : max_index;

	return {
		label: label,
		probability: values[max_index],
		index: max_index
	};
}

function _photo_gallery_probability_content (prediction_idx, probability, max_index) {
	if (typeof show_bars_instead_of_numbers === "function" && show_bars_instead_of_numbers() && typeof _create_bar_html === "function") {
		const bar_width = Math.max(0, Math.floor(probability * 50));
		const is_highest = prediction_idx === max_index && (typeof get_show_green !== "function" || get_show_green());

		return _create_bar_html(bar_width, is_highest, probability);
	}

	var content;

	if (typeof get_last_layer_activation_function === "function" && get_last_layer_activation_function() === "softmax") {
		content = (probability * 100).toFixed(1) + "%";
	} else {
		content = (typeof probability === "number") ? probability.toFixed(4) : String(probability);
	}

	if (prediction_idx === max_index) {
		content = "<b class='best_result'>" + content + "</b>";
	}

	return content;
}

function _photo_gallery_update_tooltip (index, values) {
	const entry = _photo_gallery.entries[index];

	if (!entry) {
		return;
	}

	const tooltip = _photo_gallery_ensure_tooltip();
	const summary = _photo_gallery_prediction_summary(values);
	var html = "";

	if (!summary) {
		html = "<div class='gti_row'><span class='gti_label'>" + _photo_gallery_escape(language[lang]["predicted_category"]) + ":</span> <span class='gti_value'>…</span></div>";
	} else {
		const max_index = summary.index;

		for (var prediction_idx = 0; prediction_idx < values.length; prediction_idx++) {
			const label = (typeof labels !== "undefined" && labels && labels[prediction_idx] !== undefined) ? labels[prediction_idx] : prediction_idx;
			const content = _photo_gallery_probability_content(prediction_idx, values[prediction_idx], max_index);

			html += "<div class='gti_row'><span class='gti_label'>" + _photo_gallery_escape(label) + "</span> <span class='gti_value'>" + content + "</span></div>";
		}

		if (typeof extractCategoryFromURL === "function") {
			const correct = extractCategoryFromURL(entry.url, entry.img);

			if (correct !== undefined && correct !== null && correct !== "" && String(correct) !== String(summary.label)) {
				html += "<div class='gti_sep'></div><div class='gti_row'><span class='gti_label'>" + _photo_gallery_escape(language[lang]["correct_category"]) + ":</span> " +
					"<span class='gti_bad'>" + _photo_gallery_escape(correct) + "</span></div>";
			}
		}
	}

	tooltip.innerHTML = html;

	const preview = _photo_gallery_preview_node(entry);

	if (preview) {
		tooltip.insertBefore(preview, tooltip.firstChild);
	}

	tooltip.style.display = "block";
}

function _photo_gallery_prediction_is_cached (entry) {
	const cached = _photo_gallery_prediction_cache[entry.url];

	return cached && cached.model === model && cached.generation === weights_generation ? cached.values : null;
}

function _photo_gallery_clear_prediction_cache () {
	_photo_gallery_prediction_cache = {};
}

async function _photo_gallery_predict_image (img) {
	if (!model || !model.layers || !model.layers.length) {
		return null;
	}
	if (typeof started_training !== "undefined" && started_training) {
		return null;
	}
	if (model.isTraining) {
		return null;
	}
	if (typeof _predict_full_running !== "undefined" && _predict_full_running) {
		return null;
	}

	try {
		const input = tidy(() => {
			var tensor = fromPixels(img);
			tensor = resize_image(tensor, [parse_int(height), parse_int(width)]);
			tensor = tf_to_float(tensor);
			tensor = divNoNan(tensor, parse_float($("#divide_by").val()));
			return expand_dims(tensor);
		});

		const output = model.predict(input);
		const values = array_sync(output);

		await dispose(input);
		await dispose(output);

		return values && values.length ? values[0] : null;
	} catch (e) {
		dbg("[photo_gallery] prediction failed: " + e);
		return null;
	}
}

async function _photo_gallery_predict_index (index, token) {
	if (token !== _photo_gallery.hover_token || index !== _photo_gallery.hover_index) {
		return;
	}

	const entry = _photo_gallery.entries[index];

	if (!entry) {
		return;
	}

	const cached = _photo_gallery_prediction_is_cached(entry);

	if (cached) {
		_photo_gallery_update_tooltip(index, cached);
		return;
	}

	if (_photo_gallery.hover_predicting) {
		_photo_gallery.hover_timer = setTimeout(function () {
			_photo_gallery.hover_timer = null;
			_photo_gallery_schedule_prediction(index);
		}, 80);
		return;
	}

	_photo_gallery.hover_predicting = true;

	try {
		const values = await _photo_gallery_predict_image(entry.img);

		if (token !== _photo_gallery.hover_token || index !== _photo_gallery.hover_index) {
			return;
		}

		if (values) {
			_photo_gallery_prediction_cache[entry.url] = {
				model: model,
				generation: weights_generation,
				values: values
			};
		}

		_photo_gallery_update_tooltip(index, values);
	} finally {
		_photo_gallery.hover_predicting = false;
	}
}

function _photo_gallery_schedule_prediction (index) {
	const token = ++_photo_gallery.hover_token;

	if (_photo_gallery.hover_timer) {
		clearTimeout(_photo_gallery.hover_timer);
	}

	const entry = _photo_gallery.entries[index];

	if (entry) {
		const cached = _photo_gallery_prediction_is_cached(entry);

		if (cached) {
			_photo_gallery_update_tooltip(index, cached);
			return;
		}
	}

	_photo_gallery_update_tooltip(index, null);
	_photo_gallery.hover_timer = setTimeout(function () {
		_photo_gallery.hover_timer = null;
		_photo_gallery_predict_index(index, token); // await not possible here
	}, 60);
}

function _photo_gallery_index_at (client_x, client_y) {
	const canvas = _photo_gallery.canvas;
	const layout = _photo_gallery.layout;

	if (!canvas || !layout) {
		return -1;
	}

	const rect = canvas.getBoundingClientRect();
	var x;
	var y;

	if (!rect.width || !rect.height) {
		x = client_x;
		y = client_y;
	} else {
		const scale_x = rect.width / layout.css_width;
		const scale_y = rect.height / layout.css_height;
		x = (client_x - rect.left) / scale_x;
		y = (client_y - rect.top) / scale_y;
	}

	if (x < 0 || y < 0 || x >= layout.css_width || y >= layout.css_height) {
		return -1;
	}

	const col = Math.floor(x / layout.cell_width);
	const row = Math.floor(y / layout.cell_height);
	const index = row * layout.cols + col;

	return index >= 0 && index < _photo_gallery.entries.length ? index : -1;
}

function _photo_gallery_on_mousemove (event) {
	const index = _photo_gallery_index_at(event.clientX, event.clientY);

	if (index < 0) {
		_photo_gallery_hide_tooltip();
		return;
	}

	if (index !== _photo_gallery.hover_index) {
		_photo_gallery.hover_index = index;
		_photo_gallery_schedule_prediction(index);
	}

	_photo_gallery_position_tooltip(event.clientX, event.clientY);
}

function queue_image_dom_append(img) {
	return new Promise((resolve) => {
		window._perf_helpers.dom_pending.push({ img, resolve });
		if (window._perf_helpers.dom_pending.length >= DOM_BATCH_SIZE) {
			_flush_dom_batch();
			return;
		}
		if (window._perf_helpers.dom_timer) return;
		window._perf_helpers.dom_timer = setTimeout(() => {
			_flush_dom_batch();
		}, DOM_BATCH_TIMEOUT);
	});
}

function _flush_dom_batch() {
	const pending = window._perf_helpers.dom_pending;
	if (!pending || !pending.length) {
		clearTimeout(window._perf_helpers.dom_timer);
		window._perf_helpers.dom_timer = null;
		return;
	}
	window._perf_helpers.dom_pending = [];
	clearTimeout(window._perf_helpers.dom_timer);
	window._perf_helpers.dom_timer = null;

	_photo_gallery_ensure_dom();

	if (!_photo_gallery.sources) {
		pending.forEach(p => {
			try { p.resolve(false); } catch (e) { /* ignore */ }
		});
		return;
	}

	const frag = document.createDocumentFragment();
	pending.forEach(p => frag.appendChild(p.img));
	_photo_gallery.sources.appendChild(frag);

	pending.forEach(p => {
		_photo_gallery_add_image(p.img, p.img.src);
		try { p.resolve(true); } catch (e) { /* ignore */ }
	});
}

function addPhotoToGallery(url, height, width) {
	assertType(url, "string", "add_photo_to_gallery expects a string");
	showPhotosContainer();

	const cached_img = window.imgCache ? window.imgCache[url] : null;
	const img = cached_img || createImageElement(url, height, width);

	if (height) {
		img.height = height;
	}
	if (width) {
		img.width = width;
	}

	img.className = "class_download_img";
	img.onclick = () => predict_data_img(img, "image"); // await not possible here

	return queue_image_dom_append(img);
}

function enqueue_tf_task(url, dont_load_into_tf) {
	return new Promise((resolve) => {
		window._perf_helpers.tf_task_queue.push({ url, dont_load_into_tf, resolve });
		_dequeue_tf_tasks();
	});
}

function _dequeue_tf_tasks() {
	if (!window.tf) {
		while (window._perf_helpers.tf_task_queue.length) {
			const t = window._perf_helpers.tf_task_queue.shift();
			t.resolve(false);
		}
		return;
	}

	while (window._perf_helpers.tf_active < TF_POOL_SIZE && window._perf_helpers.tf_task_queue.length) {
		const task = window._perf_helpers.tf_task_queue.shift();
		window._perf_helpers.tf_active++;
		(async () => {
			try {
				const res = await _process_image_for_tf_worker(task.url, task.dont_load_into_tf);
				task.resolve(res);
			} catch (e) {
				task.resolve(null);
			} finally {
				window._perf_helpers.tf_active--;
				setTimeout(_dequeue_tf_tasks, 0);
			}
		})();
	}
}

async function _process_image_for_tf_worker(url, dont_load_into_tf) {
	const divide_by = parse_float($("#divide_by").val());
	if (dont_load_into_tf) return false;

	if (!window.imgCache) window.imgCache = {};
	if (!window.imgCache[url]) {
		window.imgCache[url] = await load_image_with_retry(url);
	}

	const debug_keep = !!window.DEBUG_TF_TENSORS;

	await tf.ready();
	const final_tensor = tf.tidy(() => {
		const img_elem = window.imgCache[url];
		let t = fromPixels(img_elem);
		const resized = resize_image(t, [height, width]);
		let tensor = tf_to_float(expand_dims(resized));
		tensor = divNoNan(tensor, divide_by);
		return tensor.clone();
	});

	if (debug_keep && typeof _custom_tensors !== "undefined") {
		try {
			_custom_tensors["" + final_tensor.id] = [get_stack_trace(), final_tensor, tensor_print_to_string(final_tensor)];
			_clean_custom_tensors();
		} catch (e) {}
	}

	check_if_tf_data_is_empty_when_it_should_not_be(final_tensor, dont_load_into_tf);
	return final_tensor;
}

async function handleImageDownload(url, url_idx, urls, percentage, percentage_div, old_percentage, times, skip_real_image_download, dont_load_into_tf) {
	if (skip_real_image_download) {
		show_skip_real_img_msg();
		return null;
	}

	try {
		await _get_set_percentage_text(percentage, url_idx, urls.length, percentage_div, old_percentage, times);

		if (!window.imgCache) window.imgCache = {};
		if (!window.imgCache[url]) {
			window.imgCache[url] = await load_image_with_retry(url);
		}

		await addPhotoToGallery(url, height, width);

		return await enqueue_tf_task(url, dont_load_into_tf);
	} catch (e) {
		err("Failed to load training image " + url + ": " + (e && e.message ? e.message : e));
		return null;
	}
}

async function downloadSingleUrl(url, url_idx, urls, percentage_div, old_percentage, times, skip_real_image_download, dont_load_into_tf, keys, data) {
	const start_time = Date.now();

	if (!started_training && !force_download) return;

	if (stop_downloading_data) {
		log_once_internal("stop", language[lang]["stopped_downloading_because_button_was_clicked"]);
		return;
	}

	const percentage = parse_int((url_idx / urls.length) * 100);

	const tf_data = await handleImageDownload(url, url_idx, urls, percentage, percentage_div, undefined, times, skip_real_image_download, dont_load_into_tf);

	if (skip_real_image_download) {
		log_once_internal("skip_set", "skip_real_image_download is set, not downloading");
	} else if (tf_data === null) {
		// Do not push a null placeholder: it is not a usable sample and would
		// later surface as "unresized image is null" in the augment/resize
		// step. The image was already reported by handleImageDownload.
		log_once_internal("tf_null", "tf_data is null, skipping image " + url);
	} else {
		data[keys[url]].push(tf_data);
	}

	times.push(Date.now() - start_time);
}

async function download_image_data(skip_real_image_download = 0, dont_show_swal = 0, ignoreme = null, dont_load_into_tf = 0, force_no_download = 0) {
	assert(["number", "boolean", "undefined"].includes(typeof(skip_real_image_download)), "skip_real_image_download must be number/boolean or undefined");

	const divide_by = parse_float($("#divide_by").val());

	const reset_gallery = (started_training || force_download) && !force_no_download;

	if (reset_gallery) {
		dbg("Resetting photos element");
		_photo_gallery_reset();
		window._perf_helpers.dom_pending = [];
	}

	headerdatadebug("download_image_data()");
	show_or_hide_stop_downloading_button(skip_real_image_download, dont_load_into_tf);

	let [urls, keys, data] = await _get_urls_and_keys();

	if (urls === undefined || keys === undefined || data === undefined) {
		err("download_image_data failed: data is urls, keys or data is undefined");
		return {};
	}

	const percentage_div = $("#percentage");
	reset_percentage_div_if_not_skip_real_image_download(percentage_div, skip_real_image_download);

	const times = [];
	$("#data_loading_progress_bar").show();
	$("#data_progressbar").css("display", "inline-block");

	urls = shuffle(urls);

	if (reset_gallery && !skip_real_image_download) {
		_photo_gallery_prepare(urls.length);
	}

	window._perf_helpers.tf_task_queue = window._perf_helpers.tf_task_queue || [];
	window._perf_helpers.tf_active = window._perf_helpers.tf_active || 0;

	const maxParallel = 10;
	for (let i = 0; i < urls.length; i += maxParallel) {
		const batch = urls.slice(i, i + maxParallel);
		await Promise.all(batch.map((url, idx) =>
			downloadSingleUrl(url, i + idx, urls, percentage_div, undefined, times, skip_real_image_download, dont_load_into_tf, keys, data) // await not possible here
		));
		await new Promise(r => setTimeout(r, 0));
	}

	_flush_dom_batch();
	_photo_gallery_finalize();

	shown_skipping_real_msg = false;
	$("#data_progressbar").css("display", "none");
	$("#data_loading_progress_bar").hide();
	stop_downloading_data = false;
	$("#stop_downloading").hide();
	set_document_title(original_title);
	reset_percentage_div_if_not_skip_real_image_download(percentage_div, skip_real_image_download);

	return data;
}

// ============

function reset_percentage_div_if_not_skip_real_image_download(percentage_div, skip_real_image_download) {
	if(!skip_real_image_download) {
		percentage_div.html("");
		percentage_div.hide();
	}
}

function _render_placeholder_canvas(canvas) {
	try {
		canvas.width = 8;
		canvas.height = 8;
		var context = canvas.getContext("2d");
		if (!context) return null;
		context.fillStyle = "#9aa4b2";
		context.fillRect(0, 0, 8, 8);
		return canvas;
	} catch (e) {
		dbg("[augmented_preview] could not create placeholder canvas: " + e);
		return null;
	}
}

function _render_tensor_to_canvas(_tensor, canvas) {
	var values = null;

	try {
		values = array_sync(_tensor);
	} catch (e) {
		// A lost WebGL context can make even data readback fail. A neutral
		// placeholder is better than crashing the whole training/predict path.
		dbg("[augmented_preview] could not read tensor data: " + e);
		return _render_placeholder_canvas(canvas);
	}

	if (!Array.isArray(values) || values.length === 0) {
		return _render_placeholder_canvas(canvas);
	}

	var shape = _tensor.shape || [];
	var height = 0;
	var width = 0;
	var channels = 0;

	if (shape.length === 2) {
		height = shape[0];
		width = shape[1];
		channels = 1;
	} else if (shape.length === 3) {
		height = shape[0];
		width = shape[1];
		channels = shape[2];
	} else if (shape.length === 4 && shape[0] === 1) {
		height = shape[1];
		width = shape[2];
		channels = shape[3];
		values = values[0];
	}

	if (!height || !width || (channels !== 1 && channels !== 3 && channels !== 4)) {
		return _render_placeholder_canvas(canvas);
	}

	var flat = values.flat(Infinity);
	if (!Array.isArray(flat) || flat.length < height * width * channels) {
		return _render_placeholder_canvas(canvas);
	}

	var min_value = 0;
	var max_value = 0;
	for (var i = 0; i < flat.length; i++) {
		var value = Number(flat[i]) || 0;
		if (value < min_value) min_value = value;
		if (value > max_value) max_value = value;
	}

	var shift = min_value < 0 ? -min_value : 0;
	var shifted_max = max_value + shift;
	var scale = shifted_max !== 0 ? 1 / shifted_max : 1;

	var to_byte = function (value) {
		return Math.max(0, Math.min(255, Math.round(((Number(value) || 0) + shift) * scale * 255)));
	};

	try {
		canvas.width = width;
		canvas.height = height;
		var context = canvas.getContext("2d");
		if (!context) return _render_placeholder_canvas(canvas);

		var image_data = context.createImageData(width, height);
		var pixels = image_data.data;

		for (var pixel = 0; pixel < width * height; pixel++) {
			var base = pixel * channels;
			var target = pixel * 4;

			if (channels === 1) {
				var gray = to_byte(flat[base]);
				pixels[target] = gray;
				pixels[target + 1] = gray;
				pixels[target + 2] = gray;
				pixels[target + 3] = 255;
			} else {
				pixels[target] = to_byte(flat[base]);
				pixels[target + 1] = to_byte(flat[base + 1]);
				pixels[target + 2] = to_byte(flat[base + 2]);
				pixels[target + 3] = channels === 4
					? Math.max(0, Math.min(255, Math.round((Number(flat[base + 3]) || 0) * 255)))
					: 255;
			}
		}

		context.putImageData(image_data, 0, 0);
		return canvas;
	} catch (e) {
		dbg("[augmented_preview] canvas rendering failed: " + e);
		return _render_placeholder_canvas(canvas);
	}
}

function _add_augmented_canvas_to_photo_gallery(canvas, render_promise) {
	const container = _photo_gallery_container();

	// The photo gallery canvas is the normal preview surface: it draws all
	// samples (including augmented ones) in the same grid and keeps the
	// existing hover/tooltip hit-testing. Only fall back to a loose canvas if
	// there is no gallery at all.
	if (!container) {
		const photos = document.getElementById("photos");
		if (photos) photos.appendChild(canvas);
		return Promise.resolve(null);
	}

	if (render_promise === null) {
		dbg("[augmented_preview] render failed; skipping gallery entry");
		return Promise.resolve(null);
	}

	const wait_for_render = (render_promise && typeof render_promise.then === "function")
		? render_promise
		: Promise.resolve(canvas);

	return wait_for_render.catch(function (e) {
		dbg("[augmented_preview] render promise rejected: " + e);
		return null;
	}).then(function (rendered_canvas) {
		if (rendered_canvas === null) {
			dbg("[augmented_preview] render produced no canvas; skipping gallery entry");
			return null;
		}

		if (!(canvas.width > 0 && canvas.height > 0)) {
			dbg("[augmented_preview] canvas has no pixels (width=" + canvas.width + ", height=" + canvas.height + "); skipping gallery entry");
			return null;
		}

		return new Promise(function (resolve) {
			const img = new Image();
			img._source_canvas = canvas;
			let finished = false;

			const finish = function () {
				if (finished) return;
				finished = true;
				resolve(img);
			};

			// Resolve only after the data URL has decoded, so the gallery can draw
			// the preview immediately and the test sees real pixels, not a blank cell.
			img.addEventListener("load", finish, {once: true});
			img.addEventListener("error", finish, {once: true});

			try {
				img.src = canvas.toDataURL("image/png");
			} catch (e) {
				dbg("[augmented_preview] toDataURL failed: " + e);
				finish();
				return;
			}

			_photo_gallery_add_image(img, "augmented:" + uuidv4());

			// Keep augmented images with the other gallery sources so every preview
			// has a stable, unique xpath for the image cache in train.js.
			if (_photo_gallery.sources) {
				_photo_gallery.sources.appendChild(img);
			}

			// Some browsers finish decoding a data URL before the listener fires.
			if (img.complete && img.naturalWidth) {
				finish();
			}
		});
	});
}

function add_tensor_as_image_to_photos (_tensor) {
	assert(typeof(_tensor) == "object", "_tensor must be an object");
	assert(Object.keys(_tensor).includes("shape"), "_tensor must be an object that contains a shape subkey");
	assert(_tensor.shape.length >= 3 && _tensor.shape.length <= 4, "_tensor must have 3 or 4 dimensions");

	var promoted_tensor = null;

	if(_tensor.shape.length == 4) {
		if(_tensor.shape[0] == 1) {
			_tensor = tensor(array_sync(_tensor)[0]);
			promoted_tensor = _tensor;
		} else {
			const sync_data = array_sync(_tensor);
			var pending_renders = [];

			for (var tensor_idx = 0; tensor_idx < _tensor.shape[0]; tensor_idx++) {
				var this_tensor = tensor(sync_data[tensor_idx]);
				var canvas = document.createElement("canvas");
				var render_promise = _render_tensor_to_canvas(this_tensor, canvas);
				pending_renders.push(_add_augmented_canvas_to_photo_gallery(canvas, render_promise));
			}

			return Promise.all(pending_renders);
		}
	}

	var canvas = document.createElement("canvas");
	var render_promise = _render_tensor_to_canvas(_tensor, canvas);
	if (promoted_tensor) {
		dispose(promoted_tensor); // cannot be async
	}
	return _add_augmented_canvas_to_photo_gallery(canvas, render_promise);
}

function truncate_text (fullStr, strLen, separator = "...") {
	typeassert(fullStr, string, "fullStr");
	typeassert(strLen, int, "strLen");

	if (fullStr.length <= strLen) return fullStr;

	var sepLen = separator.length,
		charsToShow = strLen - sepLen,
		frontChars = Math.ceil(charsToShow/2),
		backChars = Math.floor(charsToShow/2);

	var res = fullStr.substr(0, frontChars) +
		separator +
		fullStr.substr(fullStr.length - backChars);

	return res;
}

function _concat_augmentation_batch(x, addition) {
	var concatenated = tf_concat(x, addition);
	if (x && !x.isDisposed) {
		dispose(x); // cannot be async
	}
	return concatenated;
}

function augment_rotate_images_function(image_tensor, degree, this_category_counter, x, y, label_nr) {
	l(language[lang]["rotating_image"] + ": " + degree + "°");
	var augmented_img = rotateWithOffset(image_tensor, degrees_to_radians(degree));
	add_tensor_as_image_to_photos(augmented_img);
	x = _concat_augmentation_batch(x, augmented_img);
	y.push(this_category_counter);

	if ($("#augment_invert_images").is(":checked")) {
		l(language[lang]["inverted_image_that_has_been_turned"] + " " + degree + "°");
		var add_value = (-255 / parse_float($("#divide_by").val()));
		var added = add(augmented_img, add_value);
		var inverted = abs(added);
		dispose(added); // cannot be async
		add_tensor_as_image_to_photos(inverted);
		x = _concat_augmentation_batch(x, inverted);
		dispose(inverted); // cannot be async
		y.push(this_category_counter);
	}

	if ($("#augment_flip_left_right").is(":checked")) {
		l(language[lang]["flip_left_right_that_has_been_turned"] + " " + degree + "°");
		var flipped = flipLeftRight(augmented_img);
		add_tensor_as_image_to_photos(flipped);
		x = _concat_augmentation_batch(x, flipped);
		dispose(flipped); // cannot be async
		y.push(label_nr);
	}

	dispose(augmented_img); // cannot be async
	return [x, y];
}

function augment_invert_images(image_tensor, this_category_counter, x, y) {
	l(language[lang]["inverted_image"]);
	var add_value = (-255 / parse_float($("#divide_by").val()));
	var added = add(image_tensor, add_value);
	var inverted = abs(added);
	dispose(added); // cannot be async
	add_tensor_as_image_to_photos(inverted);
	x = _concat_augmentation_batch(x, inverted);
	dispose(inverted); // cannot be async
	y.push(this_category_counter);
	return [x, y];
}

function augment_flip_left_right(image_tensor, this_category_counter, x, y) {
	l(language[lang]["flip_left_right"]);
	var flipped = flipLeftRight(image_tensor);
	add_tensor_as_image_to_photos(flipped);
	x = _concat_augmentation_batch(x, flipped);
	dispose(flipped); // cannot be async
	y.push(this_category_counter);
	return [x, y];
}

async function jump_to_tab_if_applicable () {
	const _data_origin = get_data_origin();

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

var AUGMENT_OPTION_IDS = [
	"augment_rotate_images",
	"augment_invert_images",
	"augment_flip_left_right",
	"augment_brightness",
	"augment_contrast",
	"augment_saturation",
	"augment_grayscale",
	"augment_noise"
];

function _augment_option_checked(id) {
	return $("#" + id).is(":checked");
}

function _augment_option_number(id, fallback) {
	var value = parse_float($("#" + id).val());
	return isFinite(value) ? value : fallback;
}

function has_any_augmentation_selected() {
	for (var idx = 0; idx < AUGMENT_OPTION_IDS.length; idx++) {
		if (_augment_option_checked(AUGMENT_OPTION_IDS[idx])) {
			return true;
		}
	}
	return false;
}

function is_auto_augment() {
	// The old auto-augment checkbox was removed: selecting one or more
	// augmentation options is now the switch that enables augmentation.
	return has_any_augmentation_selected();
}

function _augment_image_channels(image_tensor) {
	if (!image_tensor || !image_tensor.shape) return 0;
	return image_tensor.shape[image_tensor.shape.length - 1];
}

function _augment_brightness_tensor(image_tensor) {
	var amount = _augment_option_number("augment_brightness_amount", 0.2);
	if (amount === 0) return null;
	return tidy(() => clipByValue(tf_add(image_tensor, amount), 0, 1));
}

function _augment_contrast_tensor(image_tensor) {
	var factor = _augment_option_number("augment_contrast_amount", 1.5);
	if (!isFinite(factor) || factor < 0) factor = 1.5;
	if (factor === 1) return null;
	return tidy(() => {
		var mean = tf_mean(image_tensor);
		var adjusted = tf_add(tf_mul(tf_sub(image_tensor, mean), factor), mean);
		return clipByValue(adjusted, 0, 1);
	});
}

function _augment_grayscale_tensor(image_tensor) {
	if (_augment_image_channels(image_tensor) !== 3) return null;
	return tidy(() => {
		var gray = tf_mean(image_tensor, -1, true);
		return tf_concat(gray, [gray, gray], -1);
	});
}

function _augment_saturation_tensor(image_tensor) {
	var factor = _augment_option_number("augment_saturation_amount", 1.5);
	if (!isFinite(factor) || factor < 0) factor = 1.5;
	if (factor === 1 || _augment_image_channels(image_tensor) !== 3) return null;
	return tidy(() => {
		var gray = tf_mean(image_tensor, -1, true);
		var gray3 = tf_concat(gray, [gray, gray], -1);
		var adjusted = tf_add(gray3, tf_mul(tf_sub(image_tensor, gray3), factor));
		return clipByValue(adjusted, 0, 1);
	});
}

function _augment_noise_tensor(image_tensor) {
	var amount = _augment_option_number("augment_noise_amount", 0.05);
	amount = Math.abs(amount);
	if (amount === 0) return null;
	return tidy(() => {
		var noise = randomUniform(image_tensor.shape, -amount, amount);
		return clipByValue(tf_add(image_tensor, noise), 0, 1);
	});
}

var AUGMENT_EXTRA_OPTIONS = [
	{id: "augment_brightness", log: "brightened_image", transform: _augment_brightness_tensor},
	{id: "augment_contrast", log: "contrast_adjusted_image", transform: _augment_contrast_tensor},
	{id: "augment_saturation", log: "saturated_image", transform: _augment_saturation_tensor},
	{id: "augment_grayscale", log: "grayscale_image", transform: _augment_grayscale_tensor},
	{id: "augment_noise", log: "noisy_image", transform: _augment_noise_tensor}
];

function augment_extra_transformations(image_tensor, label, x, y) {
	for (var idx = 0; idx < AUGMENT_EXTRA_OPTIONS.length; idx++) {
		var option = AUGMENT_EXTRA_OPTIONS[idx];
		if (!_augment_option_checked(option.id)) continue;

		var augmented = option.transform(image_tensor);
		if (!augmented || tensor_is_disposed(augmented)) continue;

		l(language[lang][option.log] || option.log);
		add_tensor_as_image_to_photos(augmented);
		x = _concat_augmentation_batch(x, augmented);
		y.push(label);
		dispose(augmented); // await not possible
	}

	return [x, y];
}

async function resize_augment_invert_flip_left_right_rotate (image_idx, unresized_image, this_img, x, y) {
	var resized_image = resize_image(unresized_image, [height, width]);

	if(resized_image === null) {
		err(`resized_image is null!`);

		return [null, null];
	} else {
		x = await get_concatted_x(x, resized_image);

		const this_category_counter = this_img["category_counter"];

		y.push(this_category_counter);

		if (is_auto_augment()) {
			l(language[lang]["auto_augmenting_images"]);
			if ($("#augment_rotate_images").is(":checked")) {
				for (var degree = 0; degree < 360; degree += (360 / $("#number_of_rotations").val())) {
					if (degree !== 0) {
						[x, y] = augment_rotate_images_function(resized_image, degree, this_category_counter, x, y, this_category_counter);
					}
				}
			}

			[x, y] = augment_invert_flip_left_right(resized_image, this_category_counter, x, y);
			[x, y] = augment_extra_transformations(resized_image, this_category_counter, x, y);
		}

		await dispose(resized_image);

		if (image_idx == 0) {
			if (!tensor_is_disposed(x)) {
				var x_arr = tidy(() => {
					return array_sync(x);
				});
				x_arr = x_arr.slice(1);
				x = tensor(x_arr);
			}
		}

		return [x, y];
	}
}

function augment_invert_flip_left_right (image_tensor, this_category_counter, x, y) {
	if ($("#augment_invert_images").is(":checked")) {
		[x, y] = augment_invert_images(image_tensor, this_category_counter, x, y);
	}

	if ($("#augment_flip_left_right").is(":checked")) {
		[x, y] = augment_flip_left_right(image_tensor, this_category_counter, x, y);
	}

	return [x, y];
}

function get_max_number_values () {
	var max_number_values = 0;
	if(!is_hidden_or_has_hidden_parent($("#max_number_values"))) {
		max_number_values = parse_int($("#max_number_values").val());
	}

	return max_number_values;
}

function load_own_images_for_classification(keys, x, y, category_counter, divide_by) {
	var original_indices = [];
	var dom_image_counter = 0;

	for (var label_nr = 0; label_nr < category_counter; label_nr++) {
		var own_images_from_label_nr = $(".own_images")[label_nr];
		var image_elements = $(own_images_from_label_nr).children().find("img,canvas");

		if(image_elements.length) {
			var label_val = $(own_images_from_label_nr).parent().find(".own_image_label").val();
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
				original_indices.push(dom_image_counter);

				var x_len_before_augment = x.length;
				[x, y] = augment_custom_image_data(resized_image, label_nr, divide_by, x, y);
				var num_augmented = x.length - x_len_before_augment;
				for (var aug_i = 0; aug_i < num_augmented; aug_i++) {
					original_indices.push(dom_image_counter);
				}

				dom_image_counter++;
			}
		}
	}

	if(x.length != y.length) {
		wrn(`load_own_images_for_classification: x.length != y.length (${x.length} != ${y.length})`);
	}

	x = tensor(x);
	y = tensor(y);

	return [x, y, keys, original_indices];
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
	var x_attempted = false;
	var y_attempted = false;
	var x_loaded = false;
	var y_loaded = false;

	try {
		x_attempted = true;
		var x_string = await _get_training_data_from_filename("x.txt");
		x_loaded = true;

		y_attempted = true;
		var y_string = await _get_training_data_from_filename("y.txt");
		y_loaded = true;

		x = numpy_str_to_tf_tensor(x_string);
		y = numpy_str_to_tf_tensor(y_string);

		var x_print_string = _tensor_print_to_string(x);
		var y_print_string = _tensor_print_to_string(y);

		var xy_display_max = 8;
		var x_latex = array_to_ellipsis_latex(array_sync(x), xy_display_max, "Input");
		var y_latex = array_to_ellipsis_latex(array_sync(y), xy_display_max, "Output");

		var network_name = (get_chosen_dataset() || $("#dataset").val() || "").toUpperCase();
		var network_name_latex = network_name.split("_").join("\\_");

		$("#xy_display_data").html(`<div class='temml_me'>\\text{Neural Network}_{\\text{${network_name_latex}}}\\left(${x_latex}\\right) = ${y_latex}</div>`).show();
		_temml();

		try {
			show_xy_data_plot(x, y);
		} catch (plot_e) {
			wrn("[get_x_and_y_from_txt] data plot failed:", plot_e);
		}
	} catch (e) {
		let errorContent;

		var show_error = true;

		if (e instanceof Error) {
			errorContent = `Error Message: ${e.message}\nStack Trace:\n${e.stack}`;
			const extraProps = Object.getOwnPropertyNames(e)
				.filter(key => key !== 'message' && key !== 'stack')
				.reduce((acc, key) => {
					acc[key] = e[key];
					return acc;
				}, {});
			if (Object.keys(extraProps).length > 0) {
				errorContent += `\nExtra Properties: ${JSON.stringify(extraProps, null, 2)}`;
			}
		} else {
			try {
				if (e !== null && e !== undefined) {
					if(Object.keys(e).includes("readyState")) {
						show_error = false;
						wrn('[get_x_and_y_from_txt_files] data fetch aborted/failed (readyState) — x/y will be empty');
					}
				} else {
					errorContent = `Non-Error Object:\n${JSON.stringify(e, Object.getOwnPropertyNames(e), 2)}`;
				}
			} catch (jsonErr) {
				errorContent = `Unknown Object: ${String(e)}`;
			}
		}

		if (show_error) {
			err("" + errorContent +
				"\nTraining data load state: x.txt=" + (x_loaded ? "loaded" : (x_attempted ? "failed" : "not attempted")) +
				", y.txt=" + (y_loaded ? "loaded" : (y_attempted ? "failed" : "not attempted")));
			console.trace();
		}

		wrn('[get_x_and_y_from_txt_files] falling back to empty x/y tensors (x.txt="' +
			(x_loaded ? "loaded" : (x_attempted ? "failed" : "not attempted")) +
			'", y.txt="' + (y_loaded ? "loaded" : (y_attempted ? "failed" : "not attempted")) + '")');
		x = tensor([]);
		y = tensor([]);
	}

	return [x, y];
}

var _xy_data_plot_data = null;
var _xy_data_plot_ro = null;
var _xy_data_plot_ro_timer = null;

function _render_xy_data_plot () {
	var $plot = $("#xy_2d_plot");
	if (!$plot.length || !_xy_data_plot_data) return;
	if (typeof Plotly === "undefined") return;
	if (!$plot.is(":visible")) return;

	var d = _xy_data_plot_data;
	var is_dark = (typeof is_dark_mode !== "undefined") && is_dark_mode === true;
	var font_color = is_dark ? "#dfe4f2" : "#1a1f30";
	var grid_color = is_dark ? "rgba(255,255,255,0.045)" : "rgba(30,50,110,0.055)";
	var zero_color = is_dark ? "rgba(140,165,235,0.22)" : "rgba(60,85,160,0.22)";
	var edge_color = is_dark ? "rgba(10,13,24,0.85)" : "rgba(255,255,255,0.9)";
	var cfg = { responsive: true, displaylogo: false, displayModeBar: false };

	var trace, layout;

	if (d.ndim === 1) {
		var px = [], py = [], colors = [], text = [];
		for (var i = 0; i < d.pts.length; i++) {
			var p = d.pts[i];
			px.push(p.coords[0]);
			py.push(p.y_val);
			colors.push(p.color);
			text.push(p.label);
		}
		trace = {
			x: px, y: py, mode: "markers", type: "scatter",
			marker: { size: 7, color: colors, line: { width: 1, color: edge_color } },
			text: text,
			hovertemplate: "x: %{x}<br>z: %{y}<br>%{text}<extra></extra>",
			showlegend: false
		};
		layout = {
			margin: { l: 45, r: 20, t: 25, b: 40 },
			paper_bgcolor: "rgba(0,0,0,0)",
			plot_bgcolor: "rgba(0,0,0,0)",
			font: { color: font_color },
			xaxis: { title: "x", gridcolor: grid_color, zerolinecolor: zero_color },
			yaxis: { title: "z", gridcolor: grid_color, zerolinecolor: zero_color },
			showlegend: false
		};
	} else if (d.ndim === 2) {
		var px2 = [], py2 = [], colors2 = [], text2 = [];
		for (var j = 0; j < d.pts.length; j++) {
			var q = d.pts[j];
			px2.push(q.coords[0]);
			py2.push(q.coords[1]);
			colors2.push(q.color);
			text2.push(q.label);
		}
		trace = {
			x: px2, y: py2, mode: "markers", type: "scatter",
			marker: { size: 7, color: colors2, line: { width: 1, color: edge_color } },
			text: text2,
			hovertemplate: "x: %{x}<br>y: %{y}<br>%{text}<extra></extra>",
			showlegend: false
		};
		layout = {
			margin: { l: 45, r: 20, t: 25, b: 40 },
			paper_bgcolor: "rgba(0,0,0,0)",
			plot_bgcolor: "rgba(0,0,0,0)",
			font: { color: font_color },
			xaxis: { gridcolor: grid_color, zerolinecolor: zero_color },
			yaxis: { gridcolor: grid_color, zerolinecolor: zero_color },
			showlegend: false
		};
	} else {
		var x3 = [], y3 = [], z3 = [], colors3 = [], text3 = [];
		for (var k = 0; k < d.pts.length; k++) {
			var r = d.pts[k];
			x3.push(r.coords[0]);
			y3.push(r.coords[1]);
			z3.push(r.coords[2]);
			colors3.push(r.color);
			text3.push(r.label);
		}
		trace = {
			x: x3, y: y3, z: z3, mode: "markers", type: "scatter3d",
			marker: { size: 3, color: colors3, line: { width: 0.5, color: edge_color } },
			text: text3,
			hovertemplate: "x: %{x}<br>y: %{y}<br>z: %{z}<br>%{text}<extra></extra>",
			showlegend: false
		};
		layout = {
			margin: { l: 0, r: 0, t: 0, b: 0 },
			paper_bgcolor: "rgba(0,0,0,0)",
			font: { color: font_color },
			scene: {
				xaxis: { gridcolor: grid_color, backgroundcolor: "rgba(0,0,0,0)", zerolinecolor: zero_color },
				yaxis: { gridcolor: grid_color, backgroundcolor: "rgba(0,0,0,0)", zerolinecolor: zero_color },
				zaxis: { gridcolor: grid_color, backgroundcolor: "rgba(0,0,0,0)", zerolinecolor: zero_color }
			},
			showlegend: false
		};
	}

	Plotly.react($plot[0], [trace], layout, cfg);
}

function show_xy_data_plot (x, y) {
	var $plot = $("#xy_2d_plot");
	if (!$plot.length) return;

	var x_shape = (x && x.shape) ? x.shape : null;
	var ndim = (x_shape && x_shape.length === 2) ? x_shape[1] : 0;
	if (ndim < 1 || ndim > 3) {
		_xy_data_plot_data = null;
		$plot.hide().empty();
		return;
	}

	var x_arr = array_sync(x);
	var y_arr = (y && y.shape && y.shape[0]) ? array_sync(y) : [];
	var n = x_arr.length;
	var y_cols = (y && y.shape && y.shape.length > 1) ? y.shape[1] : 1;

	var pts = [];
	for (var i = 0; i < n; i++) {
		var cls = 0;
		var y_val = 0;
		var label = "";
		if (y_arr.length && y_arr[i]) {
			if (y_cols > 1) {
				var best = -Infinity;
				for (var c = 0; c < y_arr[i].length; c++) {
					if (y_arr[i][c] > best) { best = y_arr[i][c]; cls = c; }
				}
				y_val = cls;
				label = "z = class " + cls;
			} else {
				cls = Math.round(y_arr[i][0]);
				y_val = y_arr[i][0];
				label = "z = " + y_arr[i][0];
			}
		}

		var color = "#8a8a8a";
		if (typeof OrigamiFolds !== "undefined" && typeof OrigamiFolds.classColor === "function") {
			color = OrigamiFolds.classColor(cls);
		}

		pts.push({ coords: x_arr[i].slice(0, ndim), color: color, y_val: y_val, label: label });
	}

	_xy_data_plot_data = { pts: pts, ndim: ndim };

	if (typeof ResizeObserver !== "undefined" && !_xy_data_plot_ro) {
		_xy_data_plot_ro = new ResizeObserver(function () {
			if (_xy_data_plot_ro_timer) clearTimeout(_xy_data_plot_ro_timer);
			_xy_data_plot_ro_timer = setTimeout(_render_xy_data_plot, 60);
		});
	}
	if (_xy_data_plot_ro) {
		_xy_data_plot_ro.observe($plot[0]);
	}

	$plot.show();
	_render_xy_data_plot();
}

function show_data_after_loading(xy_data, x, divide_by) {
	if(xy_data.x.shape.length == 4 && xy_data.x.shape[3] == 3) {
		_photo_gallery_reset();
		$("#photos").show();
		const photos = document.getElementById("photos");
		const frag = document.createDocumentFragment();
		for (var xy_data_idx = 0; xy_data_idx < xy_data.x.shape[0]; xy_data_idx++) {
			const canvas = document.createElement("canvas");
			canvas.id = "custom_training_data_img_" + xy_data_idx;
			const colors = x[xy_data_idx];
			draw_grid(canvas, 1, colors, null, null, null, null, "");
			frag.appendChild(canvas);
		}
		photos.appendChild(frag);
	}
}

function get_divide_by () {
	return parse_float($("#divide_by").val());
}

async function load_custom_data(xy_data) {
	const divide_by = get_divide_by();

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
	_photo_gallery_reset();
}

async function get_images_and_this_data_and_category_counter_and_x_from_images (images) {
	reset_photos();

	images = await get_images_force_download();

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

	_xy_data_plot_data = null;

	var $plot = $("#xy_2d_plot");

	if ($plot.length) {
		if (typeof Plotly !== "undefined") {
			try {
				Plotly.purge($plot[0]);
			} catch (e) {
				dbg("[reset_xy_display_data] plot purge failed: " + e);
			}
		}

		$plot.empty().hide();
	}
}

function check_xy_for_x_and_y(xy_data) {
	var ok = 1;
	["x", "y"].forEach(key => {
		if (xy_data === undefined || xy_data === null) {
			dbg(`Error: xy_data is empty`);
			ok = 0;
		} else if(!Object.keys(xy_data).includes(key)) {
			err(`Error: ${key} could not be found in xy_data`);
			ok = 0;
		}
	});

	return ok;
}

async function get_x_and_y () {
	await reset_data();

	const selected_dataset_name = $("#dataset").val();
	const this_traindata_struct = traindata_struct[selected_dataset_name];
	const has_custom_data = Object.keys(this_traindata_struct).includes("has_custom_data");
	const validation_split = parse_int($("#validationSplit").val());

	reset_xy_display_data();

	await jump_to_tab_if_applicable();

	var xy_data = null;

	if(has_custom_data) {
		xy_data = await get_traindata_from_model_id(this_traindata_struct);

		if(!check_x_y_in_xy_data(xy_data)) {
			return;
		}

		xy_data = await load_custom_data(xy_data);
	} else {
		xy_data = await get_xy_data_for_noncustom_data();
	}

	if(!check_xy_for_x_and_y(xy_data)) {
		wrn(`check_xy_for_x_and_y failed`);
	}

	dbg(language[lang]["got_data_creating_tensors"]);

	xy_data = await auto_one_hot_encode_or_error(has_custom_data, xy_data);

	if(xy_data && validation_split) {
		check_if_data_is_left_after_validation_split(xy_data, validation_split);
	} else {
		dbg(`check_if_data_is_left_after_validation_split will not be executed since either xy_data (${xy_data}) or validation_split (${validation_split}) is falsy`);
	}

	xy_data_global = xy_data;

	// If real data mode is on, populate neuron outputs for math display
	try { if (typeof _math_show_real_data !== "undefined" && _math_show_real_data && typeof populate_neuron_outputs_from_current === "function") { populate_neuron_outputs_from_current(); } } catch(e){}
	try { if (typeof _math_show_real_data !== "undefined" && _math_show_real_data && typeof _populate_real_data_cache === "function") { _populate_real_data_cache(); } } catch(e){}

	throw_exception_if_x_y_warning();

	return xy_data;
}

async function get_xy_data_for_noncustom_data() {
	var divide_by = get_divide_by();

	const _data_origin = get_data_origin();

	var xy_data;
	if(_data_origin == "default") {
		xy_data = await get_default_data();
	} else if(_data_origin == "image") {
		xy_data = generate_data_from_images(is_classification, divide_by);
	} else if (_data_origin == "tensordata") {
		xy_data = get_xy_data_from_tensordata();
	} else if (_data_origin == "csv") {
		xy_data = await get_x_y_from_csv();
	} else {
		alert("Unknown data type: " + _data_origin);
	}

	reset_data_div();

	return xy_data;
}

function reset_data_div() {
	$("#reset_data").hide();
}

async function get_default_data() {
	var x = [], y = [], keys = [];

	var x_or_y_empty_or_null = false;

	var this_data, category_counter, images;
	var is_image = input_shape_is_image();

	dbg(`reset_data_div: input_shape_is_image: ${is_image}, input-shape: ${get_input_shape_as_string()}`);

	if(is_image) {
		[this_data, category_counter, x, images, keys] = await get_images_and_this_data_and_category_counter_and_x_from_images(images);

		[x, y] = await load_and_augment_images_and_y(this_data, x, y);

		await set_global_x_y_and_dispose_images(x, y, images);
	} else {
		[x, y] = await get_x_and_y_from_txt_files_and_show_when_possible();
	}

	if (x === null || x === undefined) {
		wrn(`get_default_data: x was null`);
		x_or_y_empty_or_null = true;
	}

	if (y === null || y === undefined) {
		wrn(`get_default_data: y was null`);
		x_or_y_empty_or_null = true;
	}

	if (x_or_y_empty_or_null) {
		return;
	}

	var xy_data = {"x": x, "y": y, "keys": keys, "number_of_categories": category_counter};

	if (x && !x.isDisposed && typeof x.shape !== "undefined") {
		xy_data["original_indices"] = Array.from({length: x.shape[0]}, (_, i) => i);
	}

	return xy_data;
}

function generate_data_from_images(is_classification, divide_by) {
	var x = [], y = [], keys = [];
	var original_indices = [];

	l(language[lang]["generating_data_from_images"]);

	const category_counter = $(".own_image_label").length;

	if(is_classification) {
		[x, y, keys, original_indices] = load_own_images_for_classification(keys, x, y, category_counter, divide_by);
	} else {
		[x, y, keys] = get_x_and_y_from_maps(category_counter, keys, x, y, divide_by);
		for (var i = 0; i < x.length; i++) {
			original_indices.push(i);
		}
	}

	if(shuffle_data_is_checked()) {
		if (original_indices.length === x.length) {
			_shuffle_with_indices(x, y, original_indices);
		} else {
			shuffleCombo(x, y);
		}
	}

	l(language[lang]["done_generating_data_from_images"]);

	var xy_data = {"x": x, "y": y, "keys": keys, "number_of_categories": category_counter, "original_indices": original_indices};

	return xy_data;
}

function _shuffle_with_indices(x, y, indices) {
	var n = x.length;
	var swap = function(arr, a, b) {
		var t = arr[a]; arr[a] = arr[b]; arr[b] = t;
	};
	var counter = n;
	while (counter > 0) {
		var index = Math.random() * counter | 0;
		counter--;
		swap(x, counter, index);
		swap(y, counter, index);
		swap(indices, counter, index);
	}
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
				var maps_or_false = get_maps_from_image_element(x, y, maps, image_element, label_nr);
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

function get_maps_from_image_element (x, y, maps, image_element, label_nr) {
	var id = image_element.id;

	if(!id.endsWith("_layer")) {
		[x, y] = load_and_resize_image_and_add_to_x_and_class(x, y, image_element, label_nr);

		// Find the corresponding drawing layer canvas
		var layer_id = id + "_layer";
		var layer_element = document.getElementById(layer_id);
		
		if(layer_element) {
			var maps_or_false = load_maps_from_image_element(layer_element, maps);
		} else {
			// Fallback to original image if no layer exists
			var maps_or_false = load_maps_from_image_element(image_element, maps);
		}

		if (maps_or_false === false) {
			return false;
		}

		maps = maps_or_false;
	}

	return maps;
}

async function load_and_augment_images_and_y(this_data, x, y) {
	if (!is_auto_augment()) {
		return await load_images_and_y_without_augmentation(this_data, y);
	}

	x = await get_x_ones_from_image_input_shape();

	for (var image_idx = 0; image_idx < this_data.length; image_idx++) {
		const this_img = this_data[image_idx];
		const unresized_image = this_img["item"];

		if (unresized_image === null) {
			err(`unresized image is null!`);
		} else {
			[x, y] = await resize_augment_invert_flip_left_right_rotate(image_idx, unresized_image, this_img, x, y);
			if (y === null || x === null) {
				return [null, null, null];
			}
		}
	}

	return [x, y];
}

async function load_images_and_y_without_augmentation(this_data, y) {
	var images = [];

	for (var image_idx = 0; image_idx < this_data.length; image_idx++) {
		const this_img = this_data[image_idx];
		const unresized_image = this_img["item"];

		if (unresized_image === null) {
			err(`unresized image is null!`);
			continue;
		}

		var resized_image = unresized_image;
		var must_dispose_resized_image = false;
		var shape = resized_image && resized_image.shape;
		var is_already_resized = shape && shape.length === 4 && shape[0] === 1 && shape[1] === height && shape[2] === width && shape[3] === 3;

		if (!is_already_resized) {
			resized_image = resize_image(unresized_image, [height, width]);
			must_dispose_resized_image = true;
		}

		if (resized_image === null) {
			err(`resized_image is null!`);
			return [null, null, null];
		}

		y.push(this_img["category_counter"]);

		var image_array = array_sync(resized_image);
		images.push(Array.isArray(image_array) && image_array.length === 1 ? image_array[0] : image_array);

		if (must_dispose_resized_image) {
			await dispose(resized_image);
		}
	}

	if (!images.length) {
		return [await get_x_ones_from_image_input_shape(), y];
	}

	return [tensor(images), y];
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

	if(tensor_is_disposed(resized_image)) {
		return x;
	}

	try {
		x = tidy(() => {
			var concatted = tf_concat(x, resized_image);
			await_outside.push(dispose(x));
			return concatted;
		});

	} catch (e) {
		dbg(`get_concatted_x: error: ${e}`);
	}

	await Promise.all(await_outside);

	return x;
}

function load_maps_from_image_element (image_element, maps) {
	try {
		var this_map_tensor = tidy(() => {
			if(image_element) {
				var image_from_layer = fromPixels(image_element);
				var res = resize_image(image_from_layer, [model.outputShape[1], model.outputShape[2]]);
				return res;
			}

			err(`load_maps_from_image_element: Could not get element from image_element ${image_element}.`);
		});

		var this_map = tf.tidy(() => {
			var res = array_sync(divNoNan(this_map_tensor, get_divide_by()));
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
		var res = divNoNan(resized_image, get_divide_by());
		dispose(resized_image); // await not possible
		return res;
	});

	var this_img = array_sync(resized_image);
	x.push(this_img);
	y.push(label_nr);

	return [x, y];
}

function requires_auto_one_hot(has_custom_data, xy_data) {
	if (has_custom_data) {
		//log("Returning false: has_custom_data is true");
		return false;
	}

	if (!is_classification) {
		//log("Returning false: is_classification is false");
		return false;
	}

	if (!["categoricalCrossentropy", "binaryCrossentropy"].includes(get_loss())) {
		//log(`Returning false: loss "${loss}" not supported`);
		return false;
	}

	if(xy_data === undefined || xy_data === null) {
		return false;
	}

	if (!("y" in xy_data)) {
		//log("Returning false: xy_data has no 'y' key");
		return false;
	}

	const y_shape = get_shape_from_array_or_tensor(xy_data["y"]);

	if (!(y_shape.length == 1)) {
		//log(`Returning false: y_shape length ${y_shape.length} <= 1`);
		return false;
	}

	const y_array_len = array_sync_if_tensor(xy_data["y"]).length;
	if (!(y_array_len > 1)) {
		//log(`Returning false: y array length ${y_array_len} <= 1`);
		return false;
	}

	//log("Returning true: all conditions satisfied");
	return true;
}

function get_shape_from_array_or_tensor (t) {
	if(is_tensor(t)) {
		return t.shape;
	}

	if(Array.isArray(t)) {
		return get_shape_from_array(t);
	}

	err(`get_shape_from_array_or_tensor: given argument t was not a tensor or an array:`, t);

	return [];
}

async function auto_one_hot_encode_or_error(has_custom_data, xy_data) {
	if(requires_auto_one_hot(has_custom_data, xy_data)) {
		try {
			const y_tensor = convert_to_tensor_if_not(xy_data["y"]);
			const flattened_1d_y_tensor = y_tensor.toInt();
			xy_data.y = oneHot(flattened_1d_y_tensor, xy_data["number_of_categories"]);
			await dispose(flattened_1d_y_tensor);
		} catch (e) {
			if(("" + e).includes("depth must be >=2, but it is 1")) {
				alert("You need at least 2 or more categories to start training with categoricalCrossentropy or binaryCrossentropy");
				return null;
			} else {
				var fn = e.toString().includes("Error in oneHot: depth must be >=2") ? function () { // cannot be async
					set_loss("meanSquaredError");
					set_metric("meanSquaredError");
					log(`${language[lang]["set_loss_and_metric_to_mse_because_error"]}: '${e.toString()}'`);
				} : null;

				await write_error(e, fn, e.toString().includes("Error in oneHot: depth must be >=2"));
			}
		}
	} else {
		dbg("No one hot encoding neccessary");
	}

	return xy_data;
}

function get_xy_data_from_tensordata() {
	const x = numpy_str_to_tf_tensor(x_file);
	const y = numpy_str_to_tf_tensor(y_file);

	const n = (x && !x.isDisposed && x.shape && x.shape[0]) ? x.shape[0] : 0;
	const xy_data = {"x": x, "y": y, "original_indices": Array.from({length: n}, (_, i) => i)};

	return xy_data;
}

function check_if_data_is_left_after_validation_split(xy_data, validation_split) {
	if ("y" in xy_data) {
		var y_data = xy_data["y"];
		var number_of_training_data = 0;

		if (Array.isArray(y_data)) {
			number_of_training_data = y_data.length;
		} else if (y_data && typeof y_data === "object" && "length" in y_data) {
			number_of_training_data = y_data.length;
		} else {
			l(language[lang]["y_data_has_invalid_format"]);
			return;
		}

		var number_of_training_data_left_after_split = Math.floor((1 - (validation_split / 100)) * number_of_training_data);

		if (number_of_training_data === 0) {
			l(language[lang]["somehow_there_were_zero_training_data_consider_it_a_bug"]);
		} else if (number_of_training_data_left_after_split < 1) {
			var new_validation_split = 100 - Math.floor((1 / number_of_training_data) * 100);
			if (new_validation_split > 20) {
				new_validation_split = 20;
			}
			l(sprintf(language[lang]["old_valsplit_n_was_too_high_set_to_m"], validation_split, new_validation_split));
			$("#validationSplit").val(new_validation_split);
		}
	}
}

function throw_exception_if_x_y_warning() {
	var error_string = x_y_warning(xy_data_global);
	if(error_string) {
		dbg(error_string);
	}
}

function augment_custom_image_data(resized_image, label_nr, divide_by, x, y) {
	if (!is_auto_augment()) {
		return [x, y];
	}

	// === GUARD: Validate resized_image ===
	if (!resized_image) {
		err("[augment_custom_image_data] resized_image is null/undefined. Cannot augment.");
		return [x, y];
	}

	if (typeof resized_image !== "object" || !resized_image.shape) {
		err("[augment_custom_image_data] resized_image is not a valid tensor (no .shape property).");
		return [x, y];
	}

	if (tensor_is_disposed(resized_image)) {
		err("[augment_custom_image_data] resized_image is already disposed. Cannot augment.");
		return [x, y];
	}

	// === GUARD: Validate label_nr ===
	if (typeof label_nr !== "number" || isNaN(label_nr) || label_nr < 0) {
		err("[augment_custom_image_data] label_nr is invalid: " + label_nr);
		return [x, y];
	}

	// === GUARD: Validate divide_by ===
	if (typeof divide_by !== "number" || isNaN(divide_by) || divide_by === 0) {
		err("[augment_custom_image_data] divide_by is invalid or zero: " + divide_by);
		return [x, y];
	}

	// === GUARD: Validate x and y are arrays ===
	if (!Array.isArray(x)) {
		err("[augment_custom_image_data] x is not an array. Type: " + typeof x);
		return [x, y];
	}

	if (!Array.isArray(y)) {
		err("[augment_custom_image_data] y is not an array. Type: " + typeof y);
		return [x, y];
	}

	try {
		// Rotation augmentation
		if ($("#augment_rotate_images").is(":checked")) {
			[x, y] = _augment_custom_rotate(resized_image, label_nr, divide_by, x, y);
		}

		// Inversion augmentation
		if ($("#augment_invert_images").is(":checked")) {
			[x, y] = _augment_custom_invert(resized_image, label_nr, divide_by, x, y);
		}

		// Flip left-right augmentation
		if ($("#augment_flip_left_right").is(":checked")) {
			[x, y] = _augment_custom_flip_lr(resized_image, label_nr, divide_by, x, y);
		}

		// Extra tensor-space augmentations (brightness, contrast, ...)
		for (var extra_idx = 0; extra_idx < AUGMENT_EXTRA_OPTIONS.length; extra_idx++) {
			var extra = AUGMENT_EXTRA_OPTIONS[extra_idx];
			if (!_augment_option_checked(extra.id)) continue;

			var extra_tensor = extra.transform(resized_image);
			if (!extra_tensor || tensor_is_disposed(extra_tensor)) continue;

			var extra_array = array_sync(extra_tensor);
			if (Array.isArray(extra_array) && extra_array.length > 0) {
				l(language[lang][extra.log] || extra.log);
				add_tensor_as_image_to_photos(extra_tensor);
				x.push(extra_array);
				y.push(label_nr);
			}
			dispose(extra_tensor); // await not possible
		}
	} catch (e) {
		err("[augment_custom_image_data] Unexpected error during augmentation: " + e);
	}

	// === FINAL ASSERTION ===
	if (x.length !== y.length) {
		err("[augment_custom_image_data] ASSERTION FAILED: x.length (" + x.length + ") !== y.length (" + y.length + ") after augmentation!");
	}

	return [x, y];
}

/**
 * Safely expands a rank-3 tensor to rank-4 for operations that require it.
 * Returns a NEW tensor (caller must dispose) or null on failure.
 */
function _safe_expand_to_4d(tensor_3d, caller_name) {
	if (!tensor_3d || tensor_is_disposed(tensor_3d)) {
		err("[" + caller_name + "] Cannot expand: tensor is null or disposed.");
		return null;
	}

	if (tensor_3d.shape.length === 4) {
		// Already rank 4, clone it so caller can safely dispose
		return tensor_3d.clone();
	}

	if (tensor_3d.shape.length === 3) {
		try {
			return expand_dims(tensor_3d);
		} catch (e) {
			err("[" + caller_name + "] expand_dims failed: " + e);
			return null;
		}
	}

	err("[" + caller_name + "] Unexpected tensor rank: " + tensor_3d.shape.length + ", shape: " + JSON.stringify(tensor_3d.shape));
	return null;
}

/**
 * Safely converts a rank-4 tensor result back to a plain JS array (rank 3).
 * Returns the JS array or null on failure. Disposes the input tensor.
 */
function _safe_4d_result_to_array(tensor_4d, caller_name) {
	if (!tensor_4d || tensor_is_disposed(tensor_4d)) {
		err("[" + caller_name + "] Result tensor is null or disposed.");
		return null;
	}

	try {
		var arr;
		if (tensor_4d.shape.length === 4 && tensor_4d.shape[0] === 1) {
			// Shape [1, H, W, C] -> get first element -> [H, W, C]
			arr = array_sync(tensor_4d)[0];
		} else if (tensor_4d.shape.length === 3) {
			arr = array_sync(tensor_4d);
		} else {
			err("[" + caller_name + "] Unexpected result shape: " + JSON.stringify(tensor_4d.shape));
			dispose(tensor_4d); // await not possible
			return null;
		}

		// Validate the array is not empty
		if (!arr || !Array.isArray(arr) || arr.length === 0) {
			err("[" + caller_name + "] array_sync produced empty/invalid result.");
			dispose(tensor_4d); // await not possible
			return null;
		}

		dispose(tensor_4d); // await not possible
		return arr;
	} catch (e) {
		err("[" + caller_name + "] Failed to convert tensor to array: " + e);
		try { dispose(tensor_4d); } catch (de) { /* ignore */ } // await not possible here
		return null;
	}
}

function _augment_custom_rotate(resized_image, label_nr, divide_by, x, y) {
	var num_rotations = parse_int($("#number_of_rotations").val());

	if (!num_rotations || num_rotations <= 0 || isNaN(num_rotations)) {
		wrn("[_augment_custom_rotate] Invalid number_of_rotations: " + num_rotations + ", defaulting to 4.");
		num_rotations = 4;
	}

	var degree_step = 360 / num_rotations;

	// We need rank 4 for rotateWithOffset
	var image_4d = _safe_expand_to_4d(resized_image, "_augment_custom_rotate");
	if (!image_4d) {
		err("[_augment_custom_rotate] Could not expand resized_image to 4D. Skipping rotation.");
		return [x, y];
	}

	for (var degree = degree_step; degree < 360; degree += degree_step) {
		try {
			l(language[lang]["rotating_image"] + ": " + degree + "°");

			var radians = degrees_to_radians(degree);
			if (isNaN(radians)) {
				err("[_augment_custom_rotate] degrees_to_radians returned NaN for degree " + degree);
				continue;
			}

			var rotated_4d = rotateWithOffset(image_4d, radians);

			if (!rotated_4d || tensor_is_disposed(rotated_4d)) {
				err("[_augment_custom_rotate] rotateWithOffset returned null/disposed at degree " + degree);
				continue;
			}

			// Convert to JS array and push
			var rotated_arr = _safe_4d_result_to_array(rotated_4d, "_augment_custom_rotate@" + degree);
			if (rotated_arr !== null) {
				x.push(rotated_arr);
				y.push(label_nr);
			}

			// Also invert the rotated image if inversion is checked
			if ($("#augment_invert_images").is(":checked")) {
				[x, y] = _augment_custom_invert_from_array(rotated_arr, label_nr, divide_by, x, y, degree);
			}

			// Also flip the rotated image if flip is checked
			if ($("#augment_flip_left_right").is(":checked")) {
				[x, y] = _augment_custom_flip_from_array(rotated_arr, label_nr, x, y, degree);
			}

		} catch (e) {
			err("[_augment_custom_rotate] Error at degree " + degree + ": " + e);
		}
	}

	// Dispose the 4D tensor we created
	try { dispose(image_4d); } catch (e) { /* ignore */ } // await not possible

	return [x, y];
}

function _augment_custom_invert(resized_image, label_nr, divide_by, x, y) {
	if (!resized_image || tensor_is_disposed(resized_image)) {
		err("[_augment_custom_invert] resized_image is null or disposed. Skipping.");
		return [x, y];
	}

	try {
		l(language[lang]["inverted_image"]);

		var add_value = (-255 / divide_by);

		// Inversion works on any rank, no need for rank 4
		var inverted = tidy(() => {
			return abs(add(resized_image, add_value));
		});

		if (!inverted || tensor_is_disposed(inverted)) {
			err("[_augment_custom_invert] Inversion produced null/disposed tensor.");
			return [x, y];
		}

		var inverted_arr = array_sync(inverted);

		if (!inverted_arr || !Array.isArray(inverted_arr) || inverted_arr.length === 0) {
			err("[_augment_custom_invert] array_sync of inverted tensor produced invalid result.");
			dispose(inverted); // await not possible
			return [x, y];
		}

		add_tensor_as_image_to_photos(inverted);
		x.push(inverted_arr);
		y.push(label_nr);

		dispose(inverted); // await not possible
	} catch (e) {
		err("[_augment_custom_invert] Error: " + e);
	}

	return [x, y];
}

/**
 * Invert from a plain JS array (used for combined augmentations like rotate+invert)
 */
function _augment_custom_invert_from_array(image_arr, label_nr, divide_by, x, y, degree) {
	if (!image_arr || !Array.isArray(image_arr) || image_arr.length === 0) {
		return [x, y];
	}

	try {
		l(language[lang]["inverted_image_that_has_been_turned"] + " " + degree + "°");

		var add_value = (-255 / divide_by);

		var inverted = tidy(() => {
			var t = tensor(image_arr);
			var result = abs(add(t, add_value));
			return result;
		});

		if (!inverted || tensor_is_disposed(inverted)) {
			err("[_augment_custom_invert_from_array] Inversion produced null/disposed tensor.");
			return [x, y];
		}

		var inverted_arr = array_sync(inverted);

		if (!inverted_arr || !Array.isArray(inverted_arr) || inverted_arr.length === 0) {
			dispose(inverted); // await not possible
			return [x, y];
		}

		add_tensor_as_image_to_photos(inverted);
		x.push(inverted_arr);
		y.push(label_nr);

		dispose(inverted); // await not possible
	} catch (e) {
		err("[_augment_custom_invert_from_array] Error: " + e);
	}

	return [x, y];
}

function _augment_custom_flip_lr(resized_image, label_nr, divide_by, x, y) {
	if (!resized_image || tensor_is_disposed(resized_image)) {
		err("[_augment_custom_flip_lr] resized_image is null or disposed. Skipping.");
		return [x, y];
	}

	try {
		l(language[lang]["flip_left_right"]);

		// flipLeftRight requires rank 4
		var image_4d = _safe_expand_to_4d(resized_image, "_augment_custom_flip_lr");
		if (!image_4d) {
			err("[_augment_custom_flip_lr] Could not expand to 4D. Skipping flip.");
			return [x, y];
		}

		var flipped_4d = flipLeftRight(image_4d);

		if (!flipped_4d || tensor_is_disposed(flipped_4d)) {
			err("[_augment_custom_flip_lr] flipLeftRight returned null/disposed.");
			try { dispose(image_4d); } catch (e) { /* ignore */ } // await not possible
			return [x, y];
		}

		var flipped_arr = _safe_4d_result_to_array(flipped_4d, "_augment_custom_flip_lr");

		if (flipped_arr !== null) {
			// Create a temporary tensor for the photo display
			try {
				var display_tensor = tensor(flipped_arr);
				add_tensor_as_image_to_photos(display_tensor);
				dispose(display_tensor); // await not possible
			} catch (e) {
				// Non-critical, just skip photo display
			}

			x.push(flipped_arr);
			y.push(label_nr);
		}

		try { dispose(image_4d); } catch (e) { /* ignore */ } // await not possible
	} catch (e) {
		err("[_augment_custom_flip_lr] Error: " + e);
	}

	return [x, y];
}

/**
 * Flip from a plain JS array (used for combined augmentations like rotate+flip)
 */
function _augment_custom_flip_from_array(image_arr, label_nr, x, y, degree) {
	if (!image_arr || !Array.isArray(image_arr) || image_arr.length === 0) {
		return [x, y];
	}

	try {
		l(language[lang]["flip_left_right_that_has_been_turned"] + " " + degree + "°");

		// Create tensor from array, expand to 4D, flip, convert back
		var flipped_arr = tidy(() => {
			var t = tensor(image_arr);
			var t_4d = expand_dims(t);
			var flipped = flipLeftRight(t_4d);

			if (!flipped) {
				return null;
			}

			// Return the [H, W, C] array (first batch element)
			return array_sync(flipped)[0];
		});

		if (!flipped_arr || !Array.isArray(flipped_arr) || flipped_arr.length === 0) {
			return [x, y];
		}

		x.push(flipped_arr);
		y.push(label_nr);
	} catch (e) {
		err("[_augment_custom_flip_from_array] Error: " + e);
	}

	return [x, y];
}

function x_y_warning(x_and_y) {
	if (!x_and_y) {
		return "XY data is missing. This might indicate a failure in data augmentation or loading.";
	}

	var error_messages = [];

	if (!("x" in x_and_y)) {
		error_messages.push("X-data is missing. Make sure your input includes features or images under 'x'.");
	} else if (x_and_y["x"] === undefined || x_and_y["x"] === null) {
		error_messages.push("x-data is null.");
	} else {
		tf.engine().startScope();
		var x_data = array_sync(x_and_y["x"]);
		tf.engine().endScope();

		var x_length = (Array.isArray(x_data) || (x_data && typeof x_data === "object" && "length" in x_data))
			? x_data.length
			: 0;
		if (x_length === 0) {
			error_messages.push("X-data is empty. Check if your data source correctly provides feature or image arrays.");
		}
	}

	if (!("y" in x_and_y)) {
		error_messages.push("Y-data is missing. Ensure that labels or target values are provided under 'y'.");
	} else if (x_and_y["y"] === undefined) {
		error_messages.push("Y-data is undefined.");
	} else if (x_and_y["y"] === null) {
		error_messages.push("Y-data is null.");
	} else {
		var y_data = array_sync_if_tensor(x_and_y["y"]);

		var y_length = 0;

		if (Array.isArray(y_data)) {
			y_length = y_data.length;
		} else if (y_data && typeof y_data === "object" && "length" in y_data) {
			y_length = y_data.length;
		} else if (y_data == null) {
			err("y_data is null or undefined");
			y_length = 0;
		} else {
			wrn("y_data has unexpected type:", typeof y_data, y_data);
			y_length = 0;
		}

		if (y_length === 0) {
			dbg("Y-data is empty. Check if your labels or target values are correctly loaded.");
			error_messages.push("Y-data is empty. Check if your labels or target values are correctly loaded.");
		}
	}

	return error_messages.join(" ");
}

function add_photo_to_gallery(url) {
	addPhotoToGallery(url, height, width); // await not possible here
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
	if(input_shape_is_image()) {
		await set_input_shape("[" + width + ", " + height + ", 3]");
	}
}

async function _get_training_data() {
	var url = "traindata/index.php?dataset=" + get_chosen_dataset() + "&max_number_of_files_per_category=" + get_imgcat();

	var res = await get_cached_json(url);

	return res;
}

function median(values) {
	if(values.length === 0) throw new Error("No inputs");

	values.sort(function(a,b){
		return a - b;
	});

	var half = Math.floor(values.length / 2);

	if (values.length % 2) {
		return values[half];
	}

	return (values[half - 1] + values[half]) / 2.0;
}

function decille(arr, percentage) {
	typeassert(arr, array, "arr");

	if (arr.length === 0) return 0;

	if (isNaN(percentage) || percentage === null || percentage === undefined) {
		return 0;
	}

	// Clone the array to avoid mutating the original
	var sorted = arr.slice().sort(function (a, b) {
		return a - b;
	});

	var len = sorted.length;
	var index = Math.floor(len * percentage) - 1;

	// Clamp the index to valid bounds
	if (index < 0) index = 0;
	if (index >= len) index = len - 1;

	// Return the value at the computed index, not the index itself
	return sorted[index];
}

async function reset_data () {
	if(xy_data_global !== null && typeof xy_data_global !== "undefined") {
		if(Object.keys(xy_data_global).includes("x")) {
			await dispose(xy_data_global["x"]);
		}
		if(Object.keys(xy_data_global).includes("y")) {
			await dispose(xy_data_global["y"]);
		}
	}

	reset_data_div();

	reset_neuron_outputs();
}

function reset_neuron_outputs () {
	neuron_outputs = {};
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

	var c = line?.split("");

	if(!c) {
		return [];
	}

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

	let sorted_arr = arr.slice().sort();
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
	var head = [];
	var data = [];

	var seperator = get_csv_seperator();

	if(seperator.length != 1) {
		parse_errors.push(`Seperator must be 1 character long`);
	} else {
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

		var lines = csv_file?.split("\n");

		if(!lines) {
			return {"head": [], "data": []};
		}

		head = parse_line(lines[0], seperator);

		var duplicate_headers = findDuplicates(head);

		if(duplicate_headers.length) {
			parse_errors.push(`${trm("duplicate_header_entries_found")}: ${duplicate_headers.filter(onlyUnique).join(", ")}`);
		}

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

function get_y_between_0_and_1_from_ln (y_between_0_and_1, ln) {
	if(y_between_0_and_1) {
		if(ln < 0 || ln > 1) {
			y_between_0_and_1 = false;
		}
	}

	return y_between_0_and_1;
}

function process_csv_number(csv_element, header_multiply, to_push, y_between_0_and_1) {
	if(looks_like_number(csv_element)) {
		var ln = parse_float(csv_element);
		if(header_multiply) {
			ln = ln / header_multiply;
		}

		to_push = ln;

		y_between_0_and_1 = get_y_between_0_and_1_from_ln(y_between_0_and_1, ln);
	} else {
		wrn(`${language[lang]["invalid_value_in_csv_detected"]}: "${csv_element}"`);
	}

	return [to_push, y_between_0_and_1];
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

					y_between_0_and_1 = get_y_between_0_and_1_from_ln(y_between_0_and_1, ln);
				} else {
					var numberPattern = /([+-]?\d+(?:\.?\d*)?)/;

					var match = csv_element.match(numberPattern);

					if(match !== null) {
						csv_element = match[1];
					}

					[to_push, y_between_0_and_1] = process_csv_number(csv_element, header_multiply, to_push, y_between_0_and_1);
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
	return $("#auto_one_hot_y").is(":checked");
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
		if (x_data["data"] && x_data["data"].length) {
			var csv_idx = Array.from({length: x_data["data"].length}, (_, i) => i);
			_shuffle_with_indices(x_data["data"], y_data["data"], csv_idx);
			csv_original_indices = csv_idx;
		} else {
			shuffleCombo(x_data["data"], y_data["data"]);
		}
	} else {
		csv_original_indices = x_data["data"] ? Array.from({length: x_data["data"].length}, (_, i) => i) : [];
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

	var array_x = JSON.parse(JSON.stringify(x_data["data"]));
	var array_y = JSON.parse(JSON.stringify(y_data["data"]));

	var cleaned_x = replace_nullish_with_unknown_with_ok(array_x);
	var cleaned_y = replace_nullish_with_unknown_with_ok(array_y);
	csv_has_unparsable_values = !(cleaned_x.ok && cleaned_y.ok);

	x = tidy(() => {
		return tensor(x);
	});
	y = tidy(() => {
		return tensor(y);
	});

	csv_global_x = x;
	csv_global_y = y;

	if(is_one_hot_encoded) {
		var new_loss = labels.length == 2 ? "binaryCrossentropy" : "categoricalCrossentropy";
		set_loss_and_metric(new_loss, new_loss);
	}

	return {
		"x": x,
		"y": y,
		"latex_array_x": cleaned_x.value,
		"latex_array_y": cleaned_y.value,
		"keys": y_headers,
		"number_of_categories": y_headers.length,
		"y_between_0_and_1": y_between_0_and_1,
		"is_one_hot_encoded": is_one_hot_encoded,
		"original_indices": csv_original_indices
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

function confusion_matrix() {
	if(!labels.length) {
		if(current_epoch < 2) {
			dbg(`[confusion_matrix] ${language[lang]["no_y"]}`);
		}
		return "";
	}

	if(!is_classification) {
		wrn("[confusion_matrix] Only works with classification");
		return "";
	}

	if(!model) {
		if (finished_loading) {
			dbg("[confusion_matrix] model not defined. Cannot continue");
		}
	}

	if(!xy_data_global || !xy_data_global["x"] || xy_data_global["x"].isDisposed) {
		if (finished_loading) {
			dbg("[confusion_matrix] xy_data_global not available");
		}
		return "";
	}

	if(!xy_data_global["y"] || xy_data_global["y"].isDisposed) {
		dbg("[confusion_matrix] xy_data_global.y not available");
		return "";
	}

	return true;
}

function _add_cm_example(cell, correct, predicted, idx) {
	var key = correct + "|" + predicted;
	if (!cell[key]) {
		cell[key] = [];
	}
	if (cell[key].indexOf(idx) === -1) {
		cell[key].push(idx);
	}
}

async function compute_confusion_table_data() {
	var x_tensor = xy_data_global["x"];
	var y_tensor = xy_data_global["y"];
	var original_indices = xy_data_global["original_indices"] || Array.from({length: x_tensor.shape[0]}, (_, i) => i);

	var predictions;
	try {
		predictions = tidy(() => {
			var pd = model.predict(x_tensor);
			var res = array_sync(pd);
			dispose(pd);
			return res;
		});
	} catch (e) {
		dbg("[confusion_matrix] model.predict failed: " + e);
		return { all: "", train: "", val: "" };
	}

	var true_labels = _y_tensor_to_labels(y_tensor);
	var pred_labels = predictions.map(function(row) {
		var max_idx = 0;
		for (var j = 1; j < row.length; j++) {
			if (row[j] > row[max_idx]) max_idx = j;
		}
		return labels[max_idx] || ("" + max_idx);
	});

	var is_image = x_tensor.shape && x_tensor.shape.length > 2;

	var total = true_labels.length;
	var all_table = {};
	var train_table = {};
	var val_table = {};
	var ex_all = {};
	var ex_train = {};
	var ex_val = {};

	var train_set = new Set(train_val_split_info ? train_val_split_info.train_indices : []);
	var val_set = new Set(train_val_split_info ? train_val_split_info.val_indices : []);
	var has_split = train_set.size > 0;

	for (var i = 0; i < total; i++) {
		var correct = true_labels[i];
		var predicted = pred_labels[i];
		var orig = original_indices[i];

		_add_to_table(all_table, correct, predicted);
		if (is_image) {
			_add_cm_example(ex_all, correct, predicted, i);
		}

		if (has_split) {
			if (train_set.has(orig)) {
				_add_to_table(train_table, correct, predicted);
				if (is_image) {
					_add_cm_example(ex_train, correct, predicted, i);
				}
			} else if (val_set.has(orig)) {
				_add_to_table(val_table, correct, predicted);
				if (is_image) {
					_add_cm_example(ex_val, correct, predicted, i);
				}
			}
		}
	}

	return {
		all: all_table,
		train: train_table,
		val: val_table,
		examples: { all: ex_all, train: ex_train, val: ex_val }
	};
}

function _add_to_table(table, correct, predicted) {
	if (!table[correct]) {
		table[correct] = {};
	}
	if (table[correct][predicted]) {
		table[correct][predicted]++;
	} else {
		table[correct][predicted] = 1;
	}
}

function _y_tensor_to_labels(y_tensor) {
	var y_arr = array_sync(y_tensor);
	if (y_tensor.shape.length === 1) {
		return y_arr.map(function(v) { return labels[v] || ("" + v); });
	}
	return y_arr.map(function(row) {
		var max_idx = 0;
		for (var j = 1; j < row.length; j++) {
			if (row[j] > row[max_idx]) max_idx = j;
		}
		return labels[max_idx] || ("" + max_idx);
	});
}

var _confusion_cell_examples = {};
var _confusion_matrix_tooltip = null;
var _cm_pointer_client_x = null;
var _cm_pointer_client_y = null;

function get_confusion_matrix_table(table_data, examples, subset_label) {
	let str = `<table class="confusion_matrix_table">`;

	let N = labels.length;

	str += `<tr><th class="confusion_matrix_tx" style="text-align:right">` +
		`<i>${language[lang]["correct_category"]}</i> &rarr;<br>` +
		`<i>${language[lang]["predicted_category"]}</i> &darr;</th>` +
		labels.map(h => `<th class="confusion_matrix_tx">${h}</th>`).join('') +
		`</tr>`;

	labels.forEach((left_header, row) => {
		str += `<tr><th class="confusion_matrix_tx">${left_header}</th>` +
			labels.map((second_left_header, col) => {
				const value = table_data[left_header]?.[second_left_header] ?? 0;
				const text = "" + value;

				let cls = "confusion_matrix_tx";
				if (value === 0 || text === "0") {
					cls += " cm-zero";
				} else if (left_header === second_left_header) {
					cls += " cm-correct";
				} else {
					cls += " cm-incorrect";
				}

				let cellConfig = "";
				if (examples) {
					var cellKey = left_header + "|" + second_left_header;
					if (examples[cellKey] && examples[cellKey].length) {
						cls += " cm-hover";
						cellConfig = ` data-cm-idx="${subset_label}:${row * N + col}"`;
						_confusion_cell_examples[subset_label + ":" + (row * N + col)] = examples[cellKey];
					}
				}

				return `<td class="${cls}"${cellConfig}>${text}</td>`;
			}).join('') +
			`</tr>`;
	});

	str += `</table>`;

	return str;
}


function _get_confusion_matrix_tooltip() {
	if (_confusion_matrix_tooltip && _confusion_matrix_tooltip.parentNode) {
		return _confusion_matrix_tooltip;
	}
	var div = document.createElement("div");
	div.id = "confusion_matrix_tooltip";
	div.style.display = "none";
	div.style.position = "fixed";
	div.style.zIndex = "99999";
	document.body.appendChild(div);
	_confusion_matrix_tooltip = div;
	return div;
}

var _cm_rendered_sample_cache = {};

function _cm_render_sample_data_url(i, x_tensor) {
	x_tensor = x_tensor || (xy_data_global && xy_data_global["x"]);
	if (!x_tensor || !x_tensor.shape || x_tensor.shape.length < 3) {
		return null;
	}
	if (i in _cm_rendered_sample_cache) {
		return _cm_rendered_sample_cache[i];
	}
	var single = tidy(function() {
		return x_tensor.slice([i], [1]).squeeze([0]);
	});
	var raw = array_sync(single);
	dispose(single);
	if (!raw || !raw.length) {
		return null;
	}
	var h = raw.length;
	var w = h > 0 ? raw[0].length : 0;
	var c = (h > 0 && w > 0) ? (raw[0][0].length || 1) : 1;
	if (!w || !h) {
		return null;
	}

	var maxv = 0;
	for (var y = 0; y < h; y++) {
		var row = raw[y];
		for (var xx = 0; xx < w; xx++) {
			var px = row[xx];
			if (c === 1) {
				if (px > maxv) maxv = px;
			} else {
				for (var cc = 0; cc < c; cc++) {
					if (px[cc] > maxv) maxv = px[cc];
				}
			}
		}
	}
	var factor = (maxv > 1) ? (255 / maxv) : 255;
	factor = factor || 1;

	var canvas = document.createElement("canvas");
	canvas.width = w;
	canvas.height = h;
	var ctx = canvas.getContext("2d");
	var imgData = ctx.createImageData(w, h);
	for (var yy = 0; yy < h; yy++) {
		var prow = raw[yy];
		for (var xx2 = 0; xx2 < w; xx2++) {
			var pxx = prow[xx2];
			var didx = (yy * w + xx2) * 4;
			if (c >= 3) {
				for (var cc2 = 0; cc2 < 3; cc2++) {
					var v2 = pxx[cc2] * factor;
					if (v2 > 255) v2 = 255;
					if (v2 < 0) v2 = 0;
					imgData.data[didx + cc2] = v2;
				}
				imgData.data[didx + 3] = 255;
			} else {
				var g = pxx * factor;
				if (g > 255) g = 255;
				if (g < 0) g = 0;
				imgData.data[didx] = g;
				imgData.data[didx + 1] = g;
				imgData.data[didx + 2] = g;
				imgData.data[didx + 3] = 255;
			}
		}
	}
	ctx.putImageData(imgData, 0, 0);
	var url = canvas.toDataURL("image/png");
	_cm_rendered_sample_cache[i] = url;
	return url;
}

function _show_confusion_matrix_tooltip(idx, clientX, clientY) {
	var examples = _confusion_cell_examples[idx];
	var x_tensor = xy_data_global && xy_data_global["x"];
	if (!examples || !examples.length) {
		_get_confusion_matrix_tooltip().style.display = "none";
		return;
	}

	var html = "<h4>" + sprintf(language[lang]["confusion_matrix_examples"], examples.length) + "</h4><div class='cm-example-grid'>";
	for (var e = 0; e < examples.length; e++) {
		html += "<div class='cm-example'><img class='cm-example-img'></div>";
	}
	html += "</div>";

	var tooltip = _get_confusion_matrix_tooltip();
	tooltip.innerHTML = html;
	tooltip.style.display = "block";

	for (var e2 = 0; e2 < examples.length; e2++) {
		(function(eventualIdx, imgEl) {
			var src = _cm_render_sample_data_url(eventualIdx, x_tensor);
			if (src) {
				imgEl.src = src;
			}
		})(examples[e2], tooltip.querySelectorAll(".cm-example-img")[e2]);
	}

	var offset = 16;
	var rect = tooltip.getBoundingClientRect();
	var left = clientX + offset;
	var top = clientY + offset;
	if (left + rect.width > window.innerWidth - 8) {
		left = clientX - rect.width - offset;
	}
	if (top + rect.height > window.innerHeight - 8) {
		top = clientY - rect.height - offset;
	}
	tooltip.style.left = left + "px";
	tooltip.style.top = top + "px";
}

function _hide_confusion_matrix_tooltip() {
	var tooltip = _get_confusion_matrix_tooltip();
	tooltip.style.display = "none";
}

function _setup_confusion_matrix_tooltip() {
	if ($(document).data("cm_tooltip_bound")) {
		return;
	}
	$(document).data("cm_tooltip_bound", true);

	$(document).on("mouseover", ".confusion_matrix_table td.cm-hover", function(e) {
		_cm_pointer_client_x = e.clientX;
		_cm_pointer_client_y = e.clientY;
		var idx = $(this).attr("data-cm-idx");
		if (idx !== undefined && idx !== "") {
			_show_confusion_matrix_tooltip(idx, e.clientX, e.clientY);
		}
	});

	$(document).on("mousemove", ".confusion_matrix_table td.cm-hover", function(e) {
		_cm_pointer_client_x = e.clientX;
		_cm_pointer_client_y = e.clientY;
		var idx = $(this).attr("data-cm-idx");
		if (idx !== undefined && idx !== "") {
			_show_confusion_matrix_tooltip(idx, e.clientX, e.clientY);
		}
	});

	$(document).on("mouseleave", ".confusion_matrix_table td.cm-hover", function() {
		_hide_confusion_matrix_tooltip();
	});

	$(document).on("mouseleave", ".confusion_matrix_table", function() {
		_cm_pointer_client_x = null;
		_cm_pointer_client_y = null;
		_hide_confusion_matrix_tooltip();
	});
}

function _cm_restore_tooltip_after_render() {
	if (_cm_pointer_client_x === null || _cm_pointer_client_y === null) {
		return;
	}
	if (typeof requestAnimationFrame !== "undefined") {
		requestAnimationFrame(function() {
			var el = document.elementFromPoint(_cm_pointer_client_x, _cm_pointer_client_y);
			if (!el) {
				return;
			}
			var td = $(el).closest("td.cm-hover")[0];
			if (!td) {
				return;
			}
			var idx = $(td).attr("data-cm-idx");
			if (idx !== undefined && idx !== "") {
				_show_confusion_matrix_tooltip(idx, _cm_pointer_client_x, _cm_pointer_client_y);
			}
		});
	}
}


async function confusion_matrix_to_page () {
	if(!labels && labels.length != 0) {
		return;
	}

	if(!is_classification) {
		return;
	}

	var status = confusion_matrix();
	if(!status) {
		$("#confusion_matrix").html("");
		$("#confusion_matrix_training").html("");
		return;
	}

	var tables = await compute_confusion_table_data();

	if(!tables.all || (typeof tables.all === "object" && Object.keys(tables.all).length === 0)) {
		$("#confusion_matrix").html("");
		$("#confusion_matrix_training").html("");
		return;
	}

	var has_split = train_val_split_info && train_val_split_info.val_count > 0;
	var str = "";

	var examples = tables.examples || { all: {}, train: {}, val: {} };
	_setup_confusion_matrix_tooltip();
	_confusion_cell_examples = {};

	if(has_split) {
		str += "<h2>" + sprintf(language[lang]["confusion_matrix_all_data"], train_val_split_info.total) + "</h2>\n";
		str += get_confusion_matrix_table(tables.all, examples.all, "all");
		str += "\n<h2>" + sprintf(language[lang]["confusion_matrix_training_data"], train_val_split_info.train_count) + "</h2>\n";
		str += get_confusion_matrix_table(tables.train, examples.train, "train");
		str += "\n<h2>" + sprintf(language[lang]["confusion_matrix_validation_data"], train_val_split_info.val_count) + "</h2>\n";
		str += get_confusion_matrix_table(tables.val, examples.val, "val");
	} else {
		str += "<h2>" + language[lang]["confusion_matrix"] + "</h2>\n";
		str += get_confusion_matrix_table(tables.all, examples.all, "all");
	}

	$("#confusion_matrix").html(str);
	$("#confusion_matrix_training").html(str);
	_cm_restore_tooltip_after_render();
}

function isolateEval(code) {
	const isolatedFunction = new Function("code", `
		return (function() {
			return eval(code);
		})();
	`);

	return isolatedFunction.call(null, code);
}

function flatten(array) {
	const result = [];
	const stack = [...array];
	let i = 0;
	while (i < stack.length) {
		const item = stack[i++];
		if (Array.isArray(item)) {
			stack.splice(i - 1, 1, ...item);
			i--;
		} else {
			result.push(item);
		}
	}
	return result;
}
