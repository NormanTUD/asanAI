"use strict";

async function change_data_origin() {
	currently_running_change_data_origin = 1;
	dbg("[change_data_origin] " + language[lang]["changed_data_source"] + ", " + $("#data_origin").val() + " (" + $("#dataset").val() + ")");

	reset_x_and_y_file();

	enable_train();

	var new_origin = $("#data_origin").val();

	var show_images_per_category = 0;

	var show_own_images = 0;
	var show_own_tensor = 0;
	var show_own_csv = 0;

	if (new_origin == "default") {
		show_images_per_category = await new_origin_is_default(show_images_per_category);
	} else {
		[show_own_images, show_images_per_category, show_own_tensor, show_own_csv] = await new_origin_is_non_default(show_own_images, show_images_per_category, show_own_tensor, show_own_csv);
	}

	toggle_max_files_per_category_row(show_images_per_category);

	const active_tab = show_own_images ? "own_images"
		: show_own_tensor ? "own_tensor"
		: show_own_csv   ? "own_csv"
		: "training_data";

	["own_images","own_tensor","own_csv","training_data"].forEach(t =>
		t === active_tab ? show_tab_label(`${t}_tab_label`,1) : hide_tab_label(`${t}_tab_label`)
	);

	if(show_own_images){
		$("#own_images_container").html("");
		await add_new_category();
		await add_new_category();
		enable_train_if_has_custom_images();
		set_loss("categoricalCrossentropy",0);
		set_metric("categoricalCrossentropy",0);
		await rename_labels();
	} else if(show_own_csv){
		set_loss("meanSquaredError",1);
		set_metric("meanSquaredError",1);
		got_images_from_webcam = false;
	} else if(active_tab === "training_data"){
		var config = await _get_configuration();
		if("loss" in config) $("#loss").val(config["loss"]);
	}

	if(get_data_origin() == "default") {
		got_images_from_webcam = false;
	}

	show_webcam_when_needed_else_hide();
	await create_and_compile_model_or_show_error();
	await repair_output_shape_or_show_error();
	currently_running_change_data_origin = 0;

	await wait_for_updated_page(1);

	if(get_data_origin() == "default") {
		if(input_shape_is_image()) {
			await repredict();
		} else {
			await get_x_and_y_from_txt_files_and_show_when_possible();
			await predict_own_data_and_repredict();
		}
	}

	$("#canvas_grid_visualization").html("");
}

async function new_origin_is_default(show_images_per_category) {
	var _config = await _get_configuration();

	await set_input_shape_from_config_if_applicable(_config);

	sync_last_layer_units_with_output_shape(_config);

	if (input_shape_is_image()) {
		show_images_per_category = 1;
	}

	await reset_labels();
	await get_label_data();

	$(".hide_when_custom_data").show().each((i, e) => { $(e).show(); });

	changed_data_source = false;

	await set_default_input_shape();

	show_tab_label("visualization_tab_label", $("#jump_to_interesting_tab").is(":checked") ? 1 : 0);
	show_tab_label("fcnn_tab_label", $("#jump_to_interesting_tab").is(":checked") ? 1 : 0);

	await update_python_code(1);

	return show_images_per_category;
}

async function new_origin_is_non_default(show_own_images, show_images_per_category, show_own_tensor, show_own_csv) {
	disable_train();

	const data_origin = $("#data_origin").val();

	if(data_origin === "image") {
		show_own_images = 1;
		show_images_per_category = 1;
		await set_input_shape(`[${height}, ${width}, 3]`);
	} else if(data_origin === "tensordata") {
		show_own_tensor = 1;
	} else if(data_origin === "csv") {
		await show_csv_file(1);
		show_own_csv = 1;
	} else {
		alert("Unknown data_origin: " + data_origin);
	}

	$(".hide_when_custom_data").show().each((i, e) => { $(e).hide(); });

	changed_data_source = true;

	taint_privacy();

	return [show_own_images, show_images_per_category, show_own_tensor, show_own_csv];
}

async function repair_output_shape_or_show_error () {
	try {
		await repair_output_shape();
	} catch (e) {
		err("repair_output_shape_or_show_error: " + e);
	}
}

async function create_and_compile_model_or_show_error () {
	try {
		model = await _create_model();
		await compile_model();
	} catch (e) {
		err(e);
	}
}

function toggle_max_files_per_category_row(show_images_per_category) {
	if (show_images_per_category) {
		$("#max_number_of_files_per_category_tr").show();
	} else {
		$("#max_number_of_files_per_category_tr").hide();
	}
}

async function set_input_shape_from_config_if_applicable(_config) {
	if(_config && Object.keys(_config).includes("input_shape")) {
		dbg("[change_data_origin] Setting input shape to: " + _config.input_shape);

		await set_input_shape(_config.input_shape);
	}
}

function sync_last_layer_units_with_output_shape(_config) {
	if(Object.keys(_config).includes("output_shape")) {
		dbg("[change_data_origin] Output shape detect as: " + _config.output_shape);

		var output_shape = JSON.parse(_config.output_shape);

		var units = output_shape[output_shape.length - 1];

		var layer_types = $(".layer_type");
		var last_layer_nr = layer_types.length - 1;
		var last_layer_type = $(layer_types[last_layer_nr]).val();

		if(last_layer_type == "dense") {
			set_item_value(last_layer_nr, "units", units);
		} else {
			wrn(`[change_data_origin] Last layer type is ${last_layer_type}, not dense, cannot set Units.`);
		}
	}
}

function reset_x_and_y_file () {
	set_x_file(null);
	set_y_file(null);
	y_shape = null;
}

async function init_dataset() {
	$("#photos").html("").hide();
	$("#maximally_activated_content").html("");
	hide_tab_label("maximally_activated_label");

	show_tab_label("fcnn_tab_label");
	hide_tab_label("training_tab_label");

	clicked_on_tab = 0;
	init_epochs(1);

	set_batch_size(1);

	$(".training_performance_tabs").hide();

	$("#data_origin").val("default").trigger("change");
	show_tab_label("visualization_tab_label");
	show_tab_label("training_data_tab_label", $("#jump_to_interesting_tab").is(":checked") ? 1 : 0);

	init_weight_file_list();
	init_download_link();

	reset_predict_error();
	$("#prediction").html("");
}

async function init_dataset_category() {
	$("#photos").html("").hide();
	$("#maximally_activated_content").html("");
	hide_tab_label("maximally_activated_label");

	var original_is_settings_config = is_setting_config;
	is_setting_config = true;
	set_x_file(null);
	set_y_file(null);
	y_shape = null;

	status_saves = [];
	state_stack = [];
	future_state_stack = [];

	clicked_on_tab = 0;

	await reset_data();

	var show_items = {
		"image": ["imageresizecontainer", "black_and_white", "resizedimensions", "resizedimensions.parent"],
		"else": ["max_values", "max_values.parent"]
	};

	var item_names = Object.keys(show_items);

	if (input_shape_is_image()) {
		toggle_items(show_items["image"], true);
		toggle_items(show_items["else"], false);
	} else {
		toggle_items(show_items["else"], true);
		toggle_items(show_items["image"], false);
	}

	$("#input_text").hide();

	var dataset = "";

	$("#dataset").html(dataset);
	$("#upload_x").hide().parent().hide();
	$("#upload_y").hide().parent().hide();
	$("#reset_model").show();

	$("#data_origin").change(function () {
		$("#data_origin option[value=\"default\"]").prop("disabled", false);
	});

	init_download_link();
	init_categories();
	init_weight_file_list();

	number_of_initialized_layers = 0;

	state_stack = [];
	future_state_stack = [];

	hide_tab_label("training_tab_label");

	is_setting_config = original_is_settings_config;

	$("#data_origin").val("default").trigger("change");

	show_tab_label("visualization_tab_label", $("#jump_to_interesting_tab").is(":checked") ? 1 : 0);
	show_tab_label("fcnn_tab_label", $("#jump_to_interesting_tab").is(":checked") ? 1 : 0);

	await updated_page();
	init_download_link();
}

async function chose_dataset(no_set_config) {
	$("#data_origin").val("default").trigger("change");

	$("#maximally_activated_content").html("");
	hide_tab_label("maximally_activated_label");
	show_tab_label("visualization_tab_label", $("#jump_to_interesting_tab").is(":checked") ? 1 : 0);
	show_tab_label("fcnn_tab_label", $("#jump_to_interesting_tab").is(":checked") ? 1 : 0);

	init_weight_file_list();
	set_x_file(null);
	set_y_file(null);
	y_shape = null;

	status_saves = [];
	state_stack = [];
	future_state_stack = [];

	model_is_trained = false;
	if (!no_set_config) {
		await set_config();
	}
	is_setting_config = false;

	reset_predict_error();
	$("#prediction").html("");

	try {
		await identify_layers();
	} catch (e) {
		if(Object.keys(e).includes("message")) {
			e = e.message;
		}

		wrn("" + e);
	}
	init_download_link();

	await force_download_image_preview_data();

	hide_prediction_non_image();
	$(".hide_when_custom_data").show().each((i, e) => { $(e).show(); });

	model = await _create_model();
	await compile_model();

	show_prediction(1, 1); // await not needed here

	hide_dataset_when_only_one();

	remove_overlay();

	l(language[lang]["ok_chosen_dataset"]);

	create_weight_surfaces(1);
}

var handle_x_file = async function (evt) {
	set_x_file(await get_custom_tensor_string_x(evt));
	await set_input_shape("[" + get_shape_from_file(x_file) + "]");

	const layer_0_val = $($(".layer_type")[0]).val();
	const _is = get_input_shape();

	if (!_heuristic_layer_possibility_check(layer_0_val, _is, 0)) {
		Swal.fire({
			title: "X-Data and first layer have incompatible shape-requirements. Set to Dense for all layers?",
			showDenyButton: true,
			showCancelButton: false,
			confirmButtonText: "Yes",
			denyButtonText: "No",
		}).then((result) => {
			if (result.isConfirmed) {
				$(".layer_type").val("dense").trigger("change");
				Swal.fire("Set all layers to dense", "", "success");
			} else if (result.isDenied) {
				Swal.fire("The model may not work as expected", "", "warning");
			}
		});
	}
	await updated_page();

	enable_start_training_custom_tensors();
};

var handle_y_file = async function (evt) {
	set_y_file(await get_custom_tensor_string_y(evt));
	y_shape = get_shape_from_file(y_file);
	$("#y_shape_div").show();
	$("#y_shape").val(y_shape);
	await updated_page();

	enable_start_training_custom_tensors();
};

function enable_start_training_custom_tensors() {
	if (!$("#data_origin").val() == "tensordata") {
		return;
	}

	enable_train();

	if (x_file && y_file) {
		var last_layer_warning_container = $($(".warning_container")[get_number_of_layers() - 1]);
		if (eval($("#outputShape").val()).join(",") == get_full_shape_without_batch(y_file).join(",")) {
			special_reason_disable_training = false;
			last_layer_warning_container.html("").hide();
		} else {
			special_reason_disable_training = true;
			last_layer_warning_container.html(
				"The last layer's output shape does not conform with the provided Y-data's shape. " +
				"Try changing the number of neurons, so that the output becomes [null" +
				get_full_shape_without_batch(y_file).join(",") + "]"
			);

			last_layer_warning_container.show();
			disable_train();
		}
	}

	current_status_hash = "";

}

async function add_new_category(disable_init_own_image_files = 0, do_not_reset_labels = 0) {
	const n = get_current_category_count();
	const imgDiv = $(".own_images");

	const label_nr = find_free_label_index(collect_current_labels(), n);
	const k = get_upload_container_index();
	const uuid = uuidv4();

	if (should_create_category_container(imgDiv.length, n)) {
		add_upload_container_html(k);
		add_category_form(n, label_nr, uuid);
		setup_drawing_board(n, uuid, label_nr);
		create_images_div(n);
	}

	if (!disable_init_own_image_files) {
		await init_own_image_files();
	}

	await finish_category_setup(do_not_reset_labels);
	return uuid;
}

function get_current_category_count() {
	return $(".own_image_label").length;
}

function collect_current_labels() {
	const labels = [];
	$(".own_image_label").each((i, x) => labels.push($(x).val()));
	return labels;
}

function find_free_label_index(existing, start) {
	let idx = start;
	while (existing.includes("label " + idx)) idx++;
	return idx;
}

function should_create_category_container(imgDivLen, labelCount) {
	return imgDivLen == 0 || imgDivLen <= labelCount;
}

async function finish_category_setup(do_not_reset_labels) {
	auto_adjust_number_of_neurons($(".own_image_label").length);
	show_or_hide_hide_delete_category();
	await last_shape_layer_warning();
	alter_text_webcam_series();

	if (!do_not_reset_labels) {
		await rename_labels(do_not_reset_labels);
	}

	add_label_sidebar();
	await restart_webcam_if_needed();
	await rename_labels();
	disable_train();
	create_styled_upload_buttons();
}

function is_custom_data_and_has_custom_data () {
	if(get_data_origin() != "image") {
		return true;
	}

	var has_canvasses = $(".own_images").toArray().every(function(el) {
		return $(el).find("img,canvas").length > 0;
	});

	if(!has_canvasses) {
		return has_canvasses;
	}

	var has_more_than_one_category_or_is_not_classification = false;

	if(!is_classification) {
		has_more_than_one_category_or_is_not_classification = true;
	} else {
		if($(".own_image_label").length > 1) {
			has_more_than_one_category_or_is_not_classification = true;
		}
	}

	return has_more_than_one_category_or_is_not_classification;
}

function enable_train_if_has_custom_images() {
	if(get_data_origin() != "image") {
		enable_train();
		return;
	}

	var allHaveContent = is_custom_data_and_has_custom_data();

	if (allHaveContent) {
		enable_train();
	} else {
		if (!$(".train_neural_network_button").first().hasClass("stop_training")) {
			disable_train();
		}
	}
}

async function rename_labels(do_not_reset_labels=0) {
	if(!do_not_reset_labels) {
		await reset_labels();
	}
	$(".own_image_label").each(function (i, x) {
		const new_label = $(x).val();
		if(!labels.includes(new_label)) {
			labels.push(new_label);
		}
	});

	await update_python_code(1);

	add_label_sidebar();
}

async function read_zip_to_category (content) {
	var new_zip = new JSZip();
	var zip_content = await new_zip.loadAsync(content);
	var uploaded_images_to_categories = {};

	try {
		const promises = [];

		new_zip.forEach((relPath, file) => {
			var promise = (async () => {
				var category = relPath.replace(/\/.*/, "");
				var filename = relPath.replace(/.*\//, "");

				var file_contents_base64 = await file.async("base64");

				if (!Object.keys(uploaded_images_to_categories).includes(category)) {
					uploaded_images_to_categories[category] = [];
				}

				uploaded_images_to_categories[category].push(file_contents_base64);
			})();

			promises.push(promise);
		});

		// Await all promises to complete
		await Promise.all(promises);
	} catch (e) {
		if(Object.keys(e).includes("message")) {
			e = e.message;
		}

		assert(false, e);
	}

	return uploaded_images_to_categories;
}

async function read_zip (content) {
	try {
		var old_labels = labels;
		var old_labels_string = JSON.stringify(old_labels);

		if(!content) {
			err(language[lang]["no_content"]);
			return;
		}

		var uploaded_images_to_categories = await read_zip_to_category(content);

		if(Object.keys(uploaded_images_to_categories).length == 0) {
			err(language[lang]["could_not_upload_images_zip_seemed_to_be_empty"]);
			return;
		}

		dbg(language[lang]["upload_done_results_available_in_uploaded_images_to_category"]);

		$("#data_origin").val("image");
		await delay(200);
		await change_data_origin();
		await delay(200);

		var new_labels = Object.keys(uploaded_images_to_categories);
		var number_of_categories = new_labels.length;

		if(!number_of_categories) {
			err(language[lang]["no_new_labels_given"]);
			return;
		}

		await click_on_new_category_or_delete_category_until_number_is_right(number_of_categories);

		log("number_of_categories:", number_of_categories);

		await wait_for_updated_page(1);

		await set_labels(new_labels);

		for (var li = 0; li < number_of_categories; li++) {
			var this_label = new_labels[li];

			var this_category_id = labels.indexOf(this_label);

			if(this_category_id == -1) {
				err(`this_category_id could not be determined for ${this_label}, labels are: ${labels.join(", ")}, old_labels are: ${old_labels_string}`);
			} else {
				$($(".own_image_label")[this_category_id]).val(this_label);

				log(`Label: ${this_label}`);

				for (var ii = 0; ii < uploaded_images_to_categories[this_label].length; ii++) {
					var _image = uploaded_images_to_categories[this_label][ii];
					if(_image) {
						_image = "data:image/png;base64," + _image;

						//log("add_image_to_category", _image, this_category_id);
						add_image_to_category(_image, this_category_id);
					}
				}
			}
		}
	} catch (e) {
		if(Object.keys(e).includes("message")) {
			e = e.message;
		}

		assert(false, e);
	}
}

function create_overview_table_for_custom_image_categories () {
	if($("#data_origin").val() != "image") {
		wrn(language[lang]["create_overview_table_for_custom_image_categories_can_only_be_called_with_custom_images"]);
		return;
	}

	var $own_image_label = $(".own_image_label");

	var data_struct = [];

	for (var label_idx = 0; label_idx < $own_image_label.length; label_idx++) {
		var name = $($own_image_label[label_idx]).val();

		var position = $($own_image_label[label_idx]).offset();
		var _id = $own_image_label[label_idx].id;

		var _top = position.top;

		var this_data_struct = {
			name: name,
			top: _top,
			id: _id
		};

		data_struct.push(this_data_struct);
	}

	console.log(data_struct);

	var toc = "";

	for (var data_struct_idx = 0; data_struct_idx < data_struct.length; data_struct_idx++) {
		var this_tr = "<tr><td>";

		let name = data_struct[data_struct_idx]["name"];
		let _id = data_struct[data_struct_idx]["id"];

		this_tr += `<a href='#${_id}_link'>${name}</a>`;

		this_tr += "</td></tr>";

		toc += this_tr;
	}

	if (toc) {
		toc = "<table>" + toc + "</table>";
	}

	return toc;
}

function add_label_sidebar() {
	var LABEL_SIDEBAR_BTN_HTML = $(`<button class="add_category" onclick="add_new_category();">+ <span class="TRANSLATEME_add_category"></span></button>`)[0];

	var labels = document.querySelectorAll('.own_image_label');
	if (!labels.length) return;

	var bar = document.getElementById('labelSidebar');
	var table;

	if (!bar) {
		// CSS nur einmal hinzufügen
		var existingStyle = document.querySelector('#labelSidebarStyle');
		if (!existingStyle) {
			var css = '\
			#labelSidebar{position:fixed;top:50%;right:0;transform:translateY(-50%);\
				max-height:90%;overflow:auto;background:rgba(0,0,0,0.3);\
				padding:6px 8px;z-index:9999;border:1px solid rgba(255,255,255,0.2);\
				box-shadow:-2px 0 6px rgba(0,0,0,0.4)}\
			#labelSidebar table{border-collapse:collapse;width:100%}\
			#labelSidebar td{padding:3px 6px;border:none;cursor:pointer;\
				color:white;text-shadow:0 0 2px black, 1px 1px 2px black;\
				font:14px sans-serif}\
			#labelSidebar td:hover{text-decoration:underline;background:rgba(255,255,255,0.1)}\
				.flashHighlight{animation:flash 1s ease-out}\
			@keyframes flash{0%{background:#fffa8b}100%{background:transparent}}';
			var style = document.createElement('style');
			style.id = 'labelSidebarStyle';
			style.appendChild(document.createTextNode(css));
			document.head.appendChild(style);
		}

		bar = document.createElement('div');
		bar.id = 'labelSidebar';
		table = document.createElement('table');
		bar.appendChild(LABEL_SIDEBAR_BTN_HTML);
		bar.appendChild(table);
		document.body.appendChild(bar);
	} else {
		table = bar.querySelector('table');
		table.innerHTML = '';
	}

	// Einträge einfügen
	Array.prototype.forEach.call(labels, function(el, i){
		if (!el.id) el.id = 'auto_label_' + i;

		var row = document.createElement('tr');
		var cell = document.createElement('td');
		cell.textContent = (el.value || el.textContent || 'label ' + (i+1));
		cell.onclick = function(){
			el.scrollIntoView({behavior:'smooth',block:'center'});
			el.classList.add('flashHighlight');
			setTimeout(function(){ el.classList.remove('flashHighlight'); }, 1100);
		};
		row.appendChild(cell);
		table.appendChild(row);
	});

	// Sichtbarkeitsprüfung
	function update_sidebar_visibility() {
		var visibleCount = 0;
		Array.prototype.forEach.call(labels, function(el, idx){
			var hidden = is_hidden_or_has_hidden_parent(el);
			table.rows[idx].style.display = hidden ? 'none' : '';
			if (!hidden) visibleCount++;
		});
		bar.style.display = visibleCount ? '' : 'none';
	}

	update_sidebar_visibility();

	// Observer vorbereiten
	if (labelSidebarObserver) labelSidebarObserver.disconnect();

	labelSidebarObserver = new MutationObserver(update_sidebar_visibility);
	Array.prototype.forEach.call(labels, function(el){
		labelSidebarObserver.observe(el, {attributes:true, attributeFilter:['style','class','hidden']});
	});
	labelSidebarObserver.observe(document.body, {childList:true, subtree:true});
}
