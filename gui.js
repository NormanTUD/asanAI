"use strict";

function mark_start_stop_training() {
	var el = document.getElementById('start_stop_training');
	if (!el) return console.error('no element #start_stop_training');
	el.classList.add('mark_red_and_blink');
}

function unmark_start_stop_training() {
	var el = document.getElementById('start_stop_training');
	if (!el) return console.error('no element #start_stop_training');
	el.classList.remove('mark_red_and_blink');
}

function enable_train() {
	if(!is_custom_data_and_has_custom_data()) {
		return;
	}

	$(".train_neural_network_button").prop("disabled", false);
	$(".retrain_neural_network_button").prop("disabled", false);
}

function disable_train() {
	$(".train_neural_network_button").prop("disabled", true);
	$(".retrain_neural_network_button").prop("disabled", true);
}

function get_key_from_path(_array, keypath) {
	if (keypath.length == 0) {
		return _array;
	}

	var this_key = undefined;
	var tmp = _array;

	for (var keypath_idx = 0; keypath_idx < keypath.length; keypath_idx++) {
		this_key = keypath[keypath_idx];
		tmp = tmp[this_key];
		if(!tmp) {
			return null;
		}
	}

	return tmp;
}

async function md5 (content) {
	try {
		var res = await hashwasm.md5(content);

		return res;
	} catch (e) {
		if(Object.keys(e).includes("message")) {
			e = e.message;
		}

		err("[md5] " + e);
	}
}

async function get_current_layer_container_status_hash() {
	var html = $("#layers_container").html();

	html = html.replaceAll(" disabled=\"\"", "");

	var res = await md5(html);

	return res;
}

async function get_current_status_hash(use_weights=1) {
	var html_code = "";

	var allitems = [];
	allitems = Array.prototype.concat.apply(allitems, document.getElementsByTagName("input"));
	allitems = Array.prototype.concat.apply(allitems, document.getElementsByTagName("checkbox"));
	allitems = Array.prototype.concat.apply(allitems, document.getElementsByTagName("select"));
	allitems = Array.prototype.concat.apply(allitems, document.getElementsByTagName("textarea"));

	allitems.forEach(function (x) {
		var item = $(x);
		var id = x.id ?? "";
		var cls = x.className ?? "";
		var val = x.value ?? "";
		var chk = (typeof x.checked !== "undefined" ? x.checked : "");
		html_code += ";;;;;;;" + id + ";;;;" + cls + "=" + val + ";;;;" + chk;
	});

	if(use_weights) {
		html_code += get_weights_as_string();
	}

	var new_status_hash = await md5(html_code);

	last_status_hash = new_status_hash;

	return new_status_hash;
}

function set_last_layer_activation_function (activation_function) {
	assert(Object.keys(activations).includes(activation_function), "activation function " + activation_function + " is invalid. Must be one of these: " + Object.keys(activations).join(", "));

	var last_layer_nr = $(".layer_type").length - 1;
	var activation_item = $($(".layer_options_internal")[last_layer_nr]).find(".activation");
	if(activation_item.val() != activation_function) {
		activation_item.val(activation_function).trigger("change");
	}
}

async function get_json(url) {
	try {
		var data = await $.getJSON(url);
		return data;
	} catch (e) {
		assert(false, `${url}: ${e.statusText}`);
	}
}

async function get_cached_json(url) {
	if (Object.keys(_cached_json).includes(url)) {
		return _cached_json[url];
	}

	try {
		var worked = 1;

		// Cache-Busting: ? oder & je nach URL-Aufbau
		var separator = url.includes('?') ? '&' : '?';
		var fetchUrl = url + separator + 'cache_id=' + Math.random().toString(36).substring(2);

		var data = await $.getJSON(fetchUrl).fail(function() {
			worked = 0;
			log_once("Could not get " + url);
		});
		if (worked) {
			_cached_json[url] = data;
		}

		return data;
	} catch (e) {
		if (Object.keys(e).includes("message")) {
			e = e.message;
		}

		if (Object.keys(e).includes("statusText")) {
			e = e.statusText;
		}

		log_once("Probably harmless error getting url: " + url + ": " + e);
	}
}

function enable_disable_grad_cam() {
	if ($("#show_grad_cam").is(":checked")) {
		$("#grad_cam_heatmap").show();
	} else {
		$("#grad_cam_heatmap").hide();
	}

	if($("#show_layer_data").is(":checked")) {
		wrn("[enable_disable_grad_cam] You can either use grad CAM or the internal layer states, but not both. Disabling internal layer states.");
		$("#show_layer_data").prop("checked", false).trigger("change");
	}

	hide_empty_tabs("visualization_ribbon");
}

function enable_disable_kernel_images() {
	if ($("#show_layer_data").is(":checked")) {
$("#show_kernel_images").prop("disabled", false);
		show_data_plotter();
		show_layer_visualization_tab();
	} else {
		$("#show_kernel_images").prop("disabled", true);
		hide_data_plotter();
		hide_layer_visualization_tab();
	}

	if($("#show_grad_cam").is(":checked")) {
		wrn("[enable_disable_kernel_images] You can either use grad CAM or the internal layer states, but not both. GradCAM.");
		$("#show_grad_cam").prop("checked", false).trigger("change");
	}

	$("#grad_cam_heatmap").hide();

	hide_empty_tabs("visualization_ribbon");
}

function change_kernel_pixel_size() {
	kernel_pixel_size = parse_int($("#kernel_pixel_size").val());
}

function change_pixel_size() {
	pixel_size = parse_int($("#pixel_size").val());
}

function get_data_origin() {
	return $("#data_origin").val();
}

function show_python_container() {
	$("#pythoncontainer").show();
}

function set_code(selector, code) {
	var el = $(selector);

	if (!el.data("original")) {
		el.data("original", code);
	}

	el.text(code).show();
}

function init_highlight_observer() {
	if (_highlight_observer) return;
	_highlight_observer = new IntersectionObserver(function(entries) {
		entries.forEach(function(e) {
			if (!e.isIntersecting) return;
			var sel = e.target.getAttribute("data-highlight-sel");
			if (!_highlight_debounce[sel]) return;

			clearTimeout(_highlight_debounce[sel]);
			_highlight_debounce[sel] = setTimeout(function() {
				highlight_code().then(function() { // await not possible here
					$(sel).addClass("highlighted");
				});
			}, 100);

			_highlight_observer.unobserve(e.target);
		});
	});
}

async function highlight_if_needed(selector) {
	var el = $(selector);
	if (!el.length) return;

	if (!el.hasClass("highlighted") || el.data("original") !== el.text()) {
		init_highlight_observer();
		el[0].setAttribute("data-highlight-sel", selector);

		clearTimeout(_highlight_debounce[selector]);
		_highlight_debounce[selector] = setTimeout(function() {
			_highlight_observer.observe(el[0]);
		}, 80);
	}
}

function hide_no_conv_stuff() {
	var any_conv_visualizations = 0;

	if(model) {
		if(Object.keys(model).includes("layers")) {
			var nr_of_layer = model?.layers?.length;
			if(!nr_of_layer) {
				return null;
			}

			for (var layer_idx = 0; layer_idx < nr_of_layer; layer_idx++) {
				if (model?.layers[layer_idx].name.startsWith("conv")) {
					any_conv_visualizations++;
				}
			}
		}
	}

	if (any_conv_visualizations) {
		hide_conv_visualizations();
	} else {
		show_conv_visualizations();
		hide_data_plotter();
	}

	if(input_shape_is_image()) {
		$(".hide_when_no_image").show();
		$("[aria-labelledby='activation_atlas_tab_label']").show();
		$(".hide_when_image").hide();
	} else {
		$("a[href*=\"tf_ribbon_augmentation\"]").hide().parent().hide();
		$("[aria-labelledby='activation_atlas_tab_label']").hide();
		$("#auto_augment").prop("checked", false);
		$(".hide_when_no_image").hide();
		$(".hide_when_image").show();
	}

	$('[aria-controls="gradient_flow"]').children().show();
	$('[aria-controls="topological_data_analysis"]').children().show();

	hide_empty_tabs("visualization_ribbon");

	return any_conv_visualizations;
}

function _has_any_warning () {
	if($("#width").val() == "" || $("#height").val() == "") {
		//wrn("[_has_any_warning] Width or height is empty string, returning from updated_page");
		return true;
	}

	if (disable_show_python_and_create_model) {
		//info("[_has_any_warning] disable_show_python_and_create_model, returning from updated_page");
		return true;
	}

	if (is_setting_config) {
		//info("Currently running is_setting_config, returning from updated_page");
		return true;
	}

	if(has_missing_values) {
		l(language[lang]["not_creating_model_because_values_are_missing"]);
		return true;
	}

	return false;
}

function _reset_prev_layer_data() {
	prev_layer_data = [];
}

function _invalidate_layer_structure_cache() {
	layer_structure_cache = null;
}

async function _maybe_write_latex(no_update_initializers) {
	if (!no_update_math) {
		return await write_model_to_latex_to_page();
	}
	return Promise.resolve(1);
}

async function _write_descriptions_safe() {
	try {
		await write_descriptions();
	} catch (e) {
		wrn(e);
	}
}

function _maybe_show_prediction(no_prediction) {
	if (!no_prediction) {
		show_prediction(1, 1); // await not desired here
	}
}

async function _maybe_predict_handdrawn() {
	if (atrament_data.sketcher && input_shape_is_image()) {
		try {
			await predict_handdrawn();
		} catch (e) {
			if (("" + e).includes("but got array with shape")) {
				var _err = "This may have happened when you change the model input size while prediction. In which case, it is a harmless error.";
				wrn("[updated_page_internal] " + _err);
				l(_err);
			} else {
				throw new Error(e);
			}
		}
	}
}

async function _maybe_update_initializers(no_update_initializers) {
	if (!no_update_initializers) {
		await update_initializers();
	}
}

async function identify_layers_or_error () {
	try {
		await identify_layers();
	} catch (e) {
		var stack = e.stack;
		if(Object.keys(e).includes("message")) {
			e = e.message;
		}

		err("identify_layers() failed with: " + e + ". Stack: ");
		console.log(stack);
	}
}

function show_or_hide_beginner_or_expert_mode_stuff() {
	if(mode == "beginner") {
		$(".expert_mode_only").hide();
	} else {
		$(".expert_mode_only").show();
	}
}

function show_or_hide_download_with_data() {
	let show = true;
	let messages = [];

	try {
		if (get_loss() !== "categoricalCrossentropy") {
			messages.push(language[lang]["download_with_data_disabled_because_the_loss_is_not_categorical_cross_entropy"]);
			show = false;
		}
		if (!is_classification) {
			messages.push(language[lang]["download_with_data_disabled_because_not_classification_problem"]);
			show = false;
		}
		if (!model) {
			messages.push(language[lang]["download_with_data_disabled_because_no_model"]);
			show = false;
		}
		if (!model?.layers?.length) {
			messages.push(language[lang]["download_with_data_disabled_because_no_layers"]);
			show = false;
		}
		if (model?.layers?.[0]?.input?.shape?.length !== 4) {
			messages.push(`${language[lang]["download_with_data_disabled_input_shape_doesnt_have_four_elements"]}: ${JSON.stringify(model?.layers?.[0]?.input?.shape)}`);
			show = false;
		}
		if (model?.layers?.[model?.layers?.length - 1]?.input?.shape?.length !== 2) {
			messages.push(`${language[lang]["download_with_data_disabled_input_shape_doesnt_have_two_elements"]}: ${JSON.stringify(model?.layers?.[model?.layers?.length - 1]?.input?.shape)}`);
			show = false;
		}

		const merged_msg = messages.join("\n");

		if(merged_msg != last_show_or_hide_msg) {
			if (messages.length) dbg(merged_msg);

			last_show_or_hide_msg = merged_msg;
		}

	} catch (e) {
		wrn((e?.message || e) + ". Disabling 'download with data'-button");
		show = false;
	}

	$("#download_with_data").toggle(show);
}

function set_validation_split(val) {
	assert(typeof(val) == "number" || is_numeric(val), val + " is not an number but " + typeof(number));
	val = parse_int(val);

	l(language[lang]["set_val_split_to"] + val);
	$("#validationSplit").val(val);

	//set_get("validation_split", val);
}

function get_epochs() {
	return parse_int($("#epochs").val());
}

function get_batch_size() {
	return parse_int($("#batchSize").val());
}

function set_batch_size(val) {
	assert(typeof(val) == "number" || is_numeric(val), val + " is not numeric but " + typeof(val));
	val = parse_int(val);

	l(language[lang]["setting_batch_size_to"] + " " + val);
	$("#batchSize").val(val);

	//set_get("batch_size", val);
}

function set_epochs(val) {
	assert(typeof(val) == "number" || is_numeric(val), val + " is not numeric but " + typeof(val));
	val = parse_int(val);
	dbg(`[set_epochs] ${language[lang]["setting_epochs_to"]} ${val}`);
	document.getElementById("epochs").value = val;
	$(document.getElementById("epochs")).trigger("change");

	//set_get("epochs", val);
}

function init_epochs(val) {
	assert(typeof(val) == "number", "init_epochs(" + val + ") is not an integer but " + typeof(val));
	l(language[lang]["initializing_epochs_to"] + " " + val);
	set_epochs(val);
}

async function init_number_of_layers(val) {
	assert(typeof(val) == "number", "init_number_of_layers(" + val + ") is not an integer but " + typeof(val));

	await set_number_of_layers(val);

	await show_layers(val);

	number_of_initialized_layers = val;
	//updated_page();
}

function make_pooling_visual_explanation() { 
	make_pooling_visualizer(".maxpooling_visual_explanation", {poolingType: "max"}); 
	make_pooling_visualizer(".averagepooling_visual_explanation", { poolingType: 'avg' }); 
}

function make_layer_normalization_visual_explanation() {
	window.make_layernorm_visual_explanation('.layernorm_visual_explanation', {
		gridRows: 3,
		gridCols: 3
	});
}

function _make_upsampling_visualizer() {
	make_upsampling_visualizer('.upsampling_visual_explanation', {
		gridSize: 2,
		upFactor: 2,
		maxWidth: 200
	});
}

async function show_visual_explanations(wd) {
	make_conv_visual_explanation();
	make_flatten_visual_explanation();
	make_dense_visual_explanation();
	make_dropout_visual_explanation();
	make_pooling_visual_explanation();
	make_layer_normalization_visual_explanation();
	_make_upsampling_visualizer();
	make_activation_visual_explanation();
	make_conv_transpose_visualizer();
	make_gaussian_noise_visualizer(".gaussiannoise_visualizer");
	make_depthwise_conv_visualizer(".depthwise_conv_visualizer");
	make_separable_conv_visualizer(".separable_conv_visualizer");

	make_reshape_visualizer('.reshape_demo');

	if(wd) {
		await write_descriptions(1);
	}
}

function get_element_xpath(element) {
	assert(typeof(element) == "object", "item is not an object but " + typeof(element));

	var idx = (sib, name) => sib
		? idx(sib.previousElementSibling, name || sib.localName) + (sib.localName == name)
		: 1;
	var segs = elm => !elm || elm.nodeType !== 1
		? [""]
		: elm.id && document.getElementById(elm.id) === elm
			? [`id("${elm.id}")`]
			: [...segs(elm.parentNode), `${elm.localName.toLowerCase()}[${idx(elm)}]`];
	return segs(element).join("/");
}

function reset_photo_gallery() {
	$("#photoscontainer").hide();
	document.getElementById("photos").innerHTML = "";
}

function remove_confusion_matrix () {
	$("#confusion_matrix").remove();
	$("#confusion_matrix_training").html("");
}

async function dispose_if_exists(element) {
	if(element) {
		await dispose(element);
	}
}

function show_or_hide_photos_depending_on_if_index(index) {
	if(!index) {
		if(input_shape_is_image()) {
			$("#photos").show();
			$("#xy_display_data").hide();
		} else {
			$("#photos").hide();
			$("#xy_display_data").show();
		}
	}
}

function init_download_link() {
	let html = "";
	html = "Download the training data <a alt='Download Training Data as ZIP' href='traindata/zip.php?dataset=" + $("#dataset").val() + "'>here</a>.";
	var d = $("#download_data").html(html).show;
}

async function get_number_of_categories() {
	var training_data_info = await _get_training_data();
	var num = Object.keys(training_data_info).length;
	return num;
}

function hide_prediction_non_image () {
	$("#prediction_non_image").html("").hide();
}

function init_weight_file_list() {
	$("#model_dataset").find("option").remove();

	var chosen_dataset = $("#dataset").find(":selected").text();

	var this_struct = traindata_struct[chosen_dataset]["weights_file"];

	var weight_files = Object.keys(this_struct);

	for (var weight_idx = 0; weight_idx < weight_files.length; weight_idx++) {
		var new_option = $("<option>", { value: weight_files[weight_idx], text: weight_files[weight_idx] });
		$("#model_dataset").append(new_option);
	}

	hide_dataset_when_only_one();
}

function set_x_file (val) {
	//logt(`Setting X file to ${val}`)
	x_file = val;
}

function set_y_file (val) {
	//logt(`Setting Y file to ${val}`)
	y_file = val;
}

function toggle_items(items, visible) {
	for (var item_idx = 0; item_idx < items.length; item_idx++) {
		var item_name = items[item_idx];
		var target = item_name.endsWith(".parent")
			? $("#" + item_name.replace(/\.parent/, "")).parent()
			: $("#" + item_name);
		visible ? target.show() : target.hide();
	}
}

async function clean_gui() {
	reset_summary();
	await write_descriptions();
}

function change_favicon(path) {
	assert(typeof(path) == "string", "Path for change_favicon(" + path + ") is not a string, but " + typeof(path));

	var link = document.querySelector("link[rel~='icon']");
	if (!link) {
		link = document.createElement("link");
		link.rel = "icon";
		document.getElementsByTagName("head")[0].appendChild(link);
	}
	link.href = path;
}

function favicon_default() {
	change_favicon("favicon.ico");
}

function favicon_spinner() {
	change_favicon("_gui/loading_favicon.gif");
}

async function disable_everything() {
	document.body.style.cursor = "wait";
	$("#layers_container").sortable("disable");
	$("#ribbon,select,input,checkbox,.add_remove_layer_button").prop("disabled", true);
	$(".show_data").prop("disabled", false);
	await write_descriptions();
	await highlight_code();
}

async function enable_everything() {
	document.body.style.cursor = get_cursor_or_none("default");
	$("#layers_container").sortable("enable");
	$("#ribbon,select,input,checkbox,.add_remove_layer_button").prop("disabled", false);
	await write_descriptions();
	await highlight_code();

	disable_everything_in_last_layer_enable_everyone_else_in_beginner_mode();
}

async function set_all_activation_functions_except_last_layer() {
	var chosen_value = $("#set_all_activation_functions_except_last_layer").val();
	l(language[lang]["setting_all_activation_functions_except_last_layer_to"] + " " + chosen_value);
	var keys = Object.keys(activations);
	if (keys.includes(chosen_value)) {
		var activations_setting = $(".activation");
		for (var activations_setting_idx = 0; activations_setting_idx < activations_setting.length - 1; activations_setting_idx++) {
			$(activations_setting[activations_setting_idx]).val(chosen_value).trigger("change");
		}
	}

	$("#set_all_activation_functions_except_last_layer").val("none");

	await updated_page();
}

async function set_all_activation_functions() {
	var chosen_value = $("#set_all_activation_functions").val();
	l(language[lang]["setting_all_activation_functions_to"] + " " + chosen_value);
	var keys = Object.keys(activations);
	if (keys.includes(chosen_value)) {
		$(".activation").val(chosen_value).trigger("change");
	}

	$("#set_all_activation_functions").val("none");

	await updated_page();
}

function last_index(_array) {
	assert(typeof(_array) == "object", "last_index(" + _array + ") is not an _array but " + typeof(_array));
	return _array.length - 1;
}

function enable_symbol(name) {
	assert(typeof(name) == "string", name + " is not a string but " + typeof(name));
	var el = document.getElementById(name);

	typeassert(el, object, "el");
	assert(typeof(el) == "object", "document.getElementById(" + name + ") is not an object");

	el.classList.remove("disabled_symbol");
	el.classList.add("enabled_symbol");
}

function disable_symbol(name) {
	assert(typeof(name) == "string", name + " is not a string but " + typeof(name));

	var el = document.getElementById(name);

	typeassert(el, object, "el");
	assert(typeof(el) == "object", "document.getElementById(" + name + ") is not an object");

	el.classList.remove("enabled_symbol");
	el.classList.add("disabled_symbol");
}

function sources_popup() {
	open_popup("sources_popup");
}

async function manage_download() {
	if(!get_cookie("session_id") === null) {
		await save_model();
	} else {
		open_save_model_dialog();
	}
}

function has_network_name(elem) {
	var name = elem.value;
	$(elem).val(name.replaceAll(/\s/g, ""));
	name = elem.value;

	if(!network_name_is_empty(name)) {
		$.ajax({
			url: "php_files/get_number_of_model_names.php?name=" + name,
			success: function (data) {
				log(data["number"]);
				if(data["number"] == 0) {
					document.getElementById("save_model_msg").innerHTML = "";
				} else {
					color_msg_red("save_model_msg");
					document.getElementById("save_model_msg").innerText = "Please choose a different network name. There is already a network with this name.";
				}
			}
		});
	}
}

function color_msg_green(id) {
	document.getElementById(id).style = "background-color: green";
}

function color_msg_red(id) {
	document.getElementById(id).style = "background-color: red";
}

function network_name_is_empty(name) {
	typeassert(name, string, "name");

	if(name.match(/^ *$/) || (name == "")) {
		return true;
	} else {
		return false;
	}
}

function open_save_model_dialog() {
	open_popup("save_model_dialog");
}

function open_upload_dialog() {
	open_popup("upload_dialog");
}

async function upload_model(evt) {
	let files = evt.target.files;

	let f = files[0];

	let reader = new FileReader();

	// Closure to capture the file information.
	reader.onload = (function (theFile) {
		return async function (e) {
			await wait_for_updated_page(3);

			uploaded_model = e.target.result;

			try {
				await set_config();
			} catch (e) {
				if(Object.keys(e).includes("message")) {
					e = e.message;
				}

				err("[upload_model] " + e);
			}
			is_setting_config = false;

			remove_overlay();
		};
	})(f);

	reader.readAsText(f);
}

async function upload_weights(evt) {
	let files = evt.target.files;

	let f = files[0];

	let reader = new FileReader();

	// Closure to capture the file information.
	reader.onload = (() => function (theFile) {
		return function (e) {

		};
	})(f);

	reader.readAsText(f);

	var modelUpload = document.getElementById("upload_model");
	var weightsUpload = document.getElementById("upload_weights");

	model = await loadLayersModel(iobrowserFiles([modelUpload.files[0], weightsUpload.files[0]]));

	$("#predictcontainer").show();
	$("a[href=\"#predict_tab\"]").click();

	await repredict();
}

async function get_custom_tensor_string_x (evt) {
	if(debug_custom_tensor_x == "") {
		return evt.target.files[0].text();
	}

	return debug_custom_tensor_x;
}

async function get_custom_tensor_string_y (evt) {
	if(debug_custom_tensor_y == "") {
		return evt.target.files[0].text();
	}

	return debug_custom_tensor_y;
}

function get_chosen_dataset() {
	var val = $("#model_dataset").val();
	if (!val) {
		val = $("#dataset").val();
	}
	return val;
}

function attr_change_name(elem, attr, new_attr) {
	var data = $(elem).attr(attr);
	$(elem).attr(new_attr, data);
	$(elem).removeAttr(attr);
}

function is_hidden_or_has_hidden_parent(element) {
	if ($(element).css("display") == "none") {
		return true;
	}

	var parents = $(element).parents();

	for (var parent_idx = 0; parent_idx < parents.length; parent_idx++) {
		if ($(parents[parent_idx]).css("display") == "none") {
			return true;
		}
	}

	return false;
}

function auto_adjust_number_of_neurons(n) {
	if ($("#auto_adjust_number_of_neurons").is(":checked")) {
		var last_layer_type = $($(".layer_type")[$(".layer_type").length - 1]).val();

		if (last_layer_type == "dense") {
			var original_no_update_math = no_update_math;
			no_update_math = true;
			click_on_graphs = 0;
			if(n != $($(".layer_setting")[$(".layer_setting").length - 1]).find(".units").val()) {
				$($(".layer_setting")[$(".layer_setting").length - 1]).find(".units").val(n).trigger("change");
			}
			no_update_math = original_no_update_math;
		} else {
			log(language[lang]["last_layer_not_dense"]);
		}
	}
}

async function last_shape_layer_warning() {
	if ($("#data_origin").val() == "image") {
		if (!model) {
			log("last_layer_shape_warning is waiting for the model...");
			await wait_for_model();
		}

		if (model.outputShape.length == 2) {
			delete_custom_drawing_layer();
			$("#last_layer_shape_warning").html("");
		} else {
			if (model.outputShape.length != 4) {
				var n = $(".own_image_label").length;
				$("#last_layer_shape_warning").html("<h3>" + language[lang]["last_layer_shape_warning"].replace("{n}", n) + "</h3>");
			} else {
				$("#last_layer_shape_warning").html("");

				await ensure_custom_image_layers();

				set_loss_and_metric_if_not_already_set("meanSquaredError");

				await change_last_responsible_layer_for_image_output();

				$("#validationSplit").val(0);
			}
		}
	} else {
		$("#last_layer_shape_warning").html("");
	}

	set_is_classification();
}

function set_shown_advanced(shown) {
	for (var shown_idx = 0; shown_idx < shown.length; shown_idx++) {
		if (shown[shown_idx]) {
			$($(".layer_options_internal")[shown_idx]).css("display", "table-row-group");
		} else {
			$($(".layer_options_internal")[shown_idx]).css("display", "none");
		}
	}
}

function tensor_print_to_string(_tensor) {
	if(!debug) {
		return "Set variable debug to true to enable tensor printing";
	}

	return _tensor_print_to_string(_tensor);
}

function _tensor_print_to_string (_tensor) {
	try {
		var logBackup = console.log;
		var logMessages = [];

		console.log = function () {
			logMessages.push.apply(logMessages, arguments);
		};

		_tensor.print(1);

		console.log = logBackup;

		return logMessages.join("\n");
	} catch (e) {
		if(("" + e).includes("Error: Tensor is disposed")) {
			dbg("[_tensor_print_to_string] tensor to be printed was already disposed");
		} else {
			err("[_tensor_print_to_string] _tensor_print_to_string failed:", e);

		}
		return "<span class='error_msg'>Error getting tensor as string</span>";
	}
}

function contains_convolution() {
	var number_of_layers = get_number_of_layers();
	for (var j = 0; j < number_of_layers; j++) {
		var layer_type = $($(".layer_type")[j]).val();

		if (layer_type.includes("conv")) {
			return true;
		}
	}

	return false;
}

async function write_error(e, fn, hide_swal) {
	if (e) {
		var msg = e;

		if(Object.keys(e).includes("message")) {
			msg = e.message;
		}

		var explanation = explain_error_msg("" + msg);

		if (explanation) {
			msg = msg + "\n<br><br>\n" + explanation;
		}

		$(".train_neural_network_button").html("<span class='TRANSLATEME_start_training'></span>").removeClass("stop_training").addClass("start_training");
		$(".retrain_neural_network_button").html("<span class='TRANSLATEME_start_training_from_scratch'></span>").removeClass("stop_training").addClass("start_training");

		await update_translations();
		await write_descriptions();
		err("[write_error] "+ msg);
		console.trace();

		if(!hide_swal) {
			Swal.fire({
				icon: "error",
				title: language[lang]["oops"],
				html: msg
			});
		} else {
			l(msg);
		}

		await send_bug_report();
	} else {
		$("#error").html(language[lang]["no_error_something_wrong"]).show().parent().hide();
	}

	if(typeof(fn) == "function") {
		fn();
	}

	await enable_everything();
	await write_descriptions();
}

async function hide_error() {
	$("#error").html("").hide().parent().hide();
	await enable_everything();
	await write_descriptions();
}

function get_layer_regularizer_config(layer_nr, regularizer_type) {
	assert(valid_initializer_types.includes(regularizer_type), "insert_regularizer_trs(layer_nr, " + regularizer_type + ") is not a valid regularizer_type (2nd option)");
	assert(typeof(layer_nr) == "number", `get_layer_regularizer_config(${layer_nr}, ${regularizer_type}), layer_nr is not an integer but ${typeof(layer_nr)}`);

	var starts_with_string = regularizer_type + "_regularizer_";

	var this_regularizer_options = $($(".layer_setting")[layer_nr]).find("." + regularizer_type + "_regularizer_tr").find(".input_data");

	var option_hash = {};

	for (var regularizer_idx = 0; regularizer_idx < this_regularizer_options.length; regularizer_idx++) {
		var this_option = this_regularizer_options[regularizer_idx];
		var classList = this_option?.className?.split(/\s+/);

		if(classList) {
			for (var j = 0; j < classList.length; j++) {
				if (classList[j].startsWith(starts_with_string)) {
					var option_name = classList[j];
					option_name = option_name.replace(starts_with_string, "");
					var value = get_item_value(layer_nr, classList[j]);

					if (looks_like_number(value)) {
						value = parse_float(value);
					}

					if (value != "") {
						option_hash[option_name] = value;
					}
				}
			}
		} else {
			err(`classList was empty`);
		}
	}

	return option_hash;
}

function set_this_option_or_error (this_option) {
	if(this_option.type == "number") {
		wrn("Wrong value for element, using default = 1");
		$(this_option).val(1);
	} else {
		err("ERROR in ", this_option);
	}
}

function allow_training() {
	if (_allow_training()) {
		enable_train();
	} else {
		disable_train();
	}
}

function _allow_training() {
	if(has_missing_values) {
		return false;
	}

	if(has_zero_output_shape) {
		return false;
	}

	var data_origin = $("#data_origin").val();

	if (data_origin == "default") {
		return true;
	}

	data_origin = $("#data_origin").val();
	if (data_origin == "image") {
		var number_of_training_images = $(".own_images").children().length;
		if (number_of_training_images) {
			return true;
		} else {
			return false;
		}
	} else if (data_origin == "csv") {
		return csv_allow_training;
	} else if (data_origin == "tensordata") {
		if (special_reason_disable_training) {
			return false;
		} else {
			if (x_file && y_file) {
				return true;
			} else {
				return false;
			}
		}
	}

}

async function show_layer_view() {
	$("#layers_container_left").show();
	$(".descriptions_of_layers").show();
	await write_descriptions();
	$("#toggle_layer_view_button").html("<img class='invert_in_dark_mode' src='_gui/maximize.svg' width=20 />");
}

function hide_layer_view () {
	$("#layers_container_left").hide();
	$(".descriptions_of_layers").hide();
	$("#toggle_layer_view_button").html("<img class='invert_in_dark_mode' src='_gui/minimize.svg' width=20 />");
}

async function toggle_layer_view() {
	if (is_hidden_or_has_hidden_parent($("#layers_container_left"))) {
		await show_layer_view();
	} else {
		hide_layer_view();
	}

	await write_descriptions();

	await restart_fcnn();
}

// Returns: old parent div
function move_element_to_another_div(element, new_element_id) {
	var old_parent = $(element).parent();

	$(element).detach().appendTo(new_element_id);

	return old_parent;
}

function allow_edit_input_shape() {
	if ($("#auto_input_shape").is(":checked")) {
		dbg("[allow_edit] " + language[lang]["input_shape_is_read_only"]);
		$("#inputShape").attr("readonly", true);
	} else {
		dbg("[allow_edit] " + language[lang]["input_shape_is_writable"]);
		$("#inputShape").attr("readonly", false);
	}
}

function show_ribbon() {
	$("#ribbon").show();
	$("#ribbon_shower").hide();
	$("#status_bar").show();
}

function hide_ribbon() {
	$("#ribbon").hide();
	$("#ribbon_shower").show();
	$("#status_bar").hide();

	close_all_popups();
}

function human_readable_time(seconds, start="", end="") {
	if (!seconds) {
		return language[lang]["one_second"];
	}

	seconds = parse_int(seconds);

	if(seconds > 86400 * 365) {
		var params = [];
		if(start != "") {
			params.push("Start:");
			params.push(start);
		}

		if(end != "") {
			params.push("End:");
			params.push(end);
		}

		wrn("[human_readable_time] Seconds is very large:", seconds, "Please check the source of that", params);
		console.trace();

		return null;
	}

	var levels = [
		[Math.floor(seconds / 31536000), language[lang]["years"]],
		[Math.floor((seconds % 31536000) / 86400), language[lang]["days"]],
		[Math.floor(((seconds % 31536000) % 86400) / 3600), language[lang]["hours"]],
		[Math.floor((((seconds % 31536000) % 86400) % 3600) / 60), language[lang]["minutes"]],
		[(((seconds % 31536000) % 86400) % 3600) % 60, language[lang]["seconds"]],
	];

	var returntext = "";

	if (levels[0][0] !== 0) {
		returntext += levels[0][0] + " " + (levels[0][0] === 1 ? levels[0][1].substr(0, levels[0][1].length - 1) : levels[0][1]);
	}

	if (levels[1][0] !== 0) {
		if (returntext) {
			returntext += ", ";
		}
		returntext += levels[1][0] + " " + (levels[1][0] === 1 ? levels[1][1].substr(0, levels[1][1].length - 1) : levels[1][1]);
	}

	if (levels[2][0] !== 0) {
		if (returntext) {
			returntext += ", ";
		}
		returntext += levels[2][0] + " " + (levels[2][0] === 1 ? levels[2][1].substr(0, levels[2][1].length - 1) : levels[2][1]);
	}

	if (levels[3][0] !== 0) {
		if (returntext) {
			returntext += ", ";
		}
		returntext += levels[3][0] + " " + (levels[3][0] === 1 ? levels[3][1].substr(0, levels[3][1].length - 1) : levels[3][1]);
	}

	if (levels[4][0] !== 0) {
		if (returntext) {
			returntext += ", ";
		}
		returntext += levels[4][0] + " " + (levels[4][0] === 1 ? levels[4][1].substr(0, levels[4][1].length - 1) : levels[4][1]);
	}

	return returntext;
}

async function get_layers_container_md5() {
	await delay(1);
	var layers_container_str = "";
	$("#layers_container").find("select,input,checkbox").each(function (i, x) {
		x = $(x);
		layers_container_str += x.attr("class") + "=" + x.val() + ";;;";
	});

	var res = await md5(layers_container_str);

	return res;
}

function hide_tab_label(label) {
	assert(typeof(label) == "string", "label is not a string");

	$("#" + label).parent().hide();
	var children = $("#" + label).parent().parent().children();

	var currently_selected = null;
	var first_displayable = null;

	for (var child_idx = 0; child_idx <= children.length; child_idx++) {
		if (!currently_selected && $(children[child_idx]).attr("aria-expanded") == "true") {
			currently_selected = children[child_idx];
		}

		if (!first_displayable && $(children[child_idx]).css("display") != "none") {
			first_displayable = children[child_idx];
		}
	}

	if (first_displayable && is_hidden_or_has_hidden_parent(currently_selected)) {
		$($(first_displayable).children()[0]).click();
	}

	try {
		update_translations(); // await not possible
	} catch (e) {
		err(e);
	}
}

function tab_already_open (to_open) {
	var is_already_open = 0;

	$(".ui-state-active").each((i, e) => {
		if(is_already_open) {
			return;
		}
		var href = $(e).is(":visible") && $($(e).children()[0]).prop("href").replace(/.*#/, "");
		var id = $(e).is(":visible") && $($(e).children()[0]).prop("id");

		if(href == to_open || id == to_open) {
			is_already_open = 1;
		}

		if(!$("#" + href).is(":visible")) {
			is_already_open = 0;
		}
	});

	return is_already_open;
}

function show_specific_tab_content (label) {
	$("#right_side").find(".ui-tab").each((i, e) => {
		var href = $(e).find("a").attr("href").replace(/.*#/, "");
		var id = $(e).find("a").attr("id").replace(/.*#/, "");
		if(href == label || id == label) {
			$("#" + href).show();
		} else {
			$("#" + href).hide();
		}
	});
}

function show_tab_label(label, click=0) {
	assert(typeof(label) == "string", "label is not a string");

	var auto_skip_click = label == "math_tab_label" && tab_already_open(label);

	var $item = $("#" + label);
	assert($item && $item.length == 1, "Invalid or double $item for label " + label);

	$item.show().parent().show();

	if(click && !auto_skip_click) {
		$item.trigger("click");
	}

	update_translations(); // await not possible
}

function copy_options () {
	var selects = $(".copy_options");
	for (var select_idx = 0; select_idx < selects.length; select_idx ++) {
		var sink = $(selects[select_idx]);
		var sink_id = sink.attr("id");

		var origin = $("#" + $(selects[select_idx]).data("from_and_to"));
		var origin_id = origin.attr("id");

		sink.html("");

		var options = $("#" + origin_id + " > option").clone();
		sink.append(options);

		sink.change(function (o, s) {
			return function (e) {
				$("#" + o).val($("#" + s).val()).trigger("change");
				copy_options();
				$("#" + s).val($("#" + o).val());
			};
		}(origin_id, sink_id));
	}

}

function copy_values() {
	var inputs = $(".copy_values");
	for (var input_idx = 0; input_idx < inputs.length; input_idx++) {
		var sink = $(inputs[input_idx]);
		var origin = $("#" + $(inputs[input_idx]).data("from_and_to"));
		$(sink).val(origin.val());

		var possible_values = ["min", "max", "step"];

		for (var j = 0; j < possible_values.length; j++) {
			if(origin.attr(possible_values[j])) {
				sink.attr(possible_values[j], origin.attr(possible_values[j]));
			}
		}

		var origin_id = origin.attr("id");
		var sink_id = sink.attr("id");

		sink.change(function(o, s){
			return function(e){
				$("#" + o).val($("#" + s).val());
			};
		}(origin_id, sink_id));

	}

}

function real_width(obj) {
	try {
		var clone = obj.clone();
		clone.css("visibility","hidden");
		$("body").append(clone);
		var w = clone.outerWidth();
		clone.remove();
		return w;
	} catch (e) {
		if(Object.keys(e).includes("message")) {
			e = e.message;
		}

		assert(false, e);
	}
}

function real_height(obj) {
	try {
		var h = obj.outerHeight();
		return h;
	} catch (e) {
		if(Object.keys(e).includes("message")) {
			e = e.message;
		}

		assert(false, e);
	}
}

function l(msg) {
	msg = "" + msg;

	if(!msg) {
		dbg("[l] msg is empty");
		return;
	}

	if(msg == "[object Object]") {
		log("[object Object] found:");
		console.log(msg);
		console.trace();
	}

	try {
		if(last_l != msg) {
			var _load_time = new Date().toLocaleString();
			_load_time = _load_time.replace(/ GMT.*/, "");
			msg = ("" + msg).replace(/^(Error:\s*)+/, "Error: ");
			$("#log").prepend(_load_time + ": " + msg + "\n");
			last_l = msg;
			if(msg.toString().startsWith("ERROR:") || msg.toString().startsWith("TypeError:")) {
				err(msg);
				msg = "<span style='color: red'>" + msg + "</span>";
			}
			$("#status_bar_log").html(msg);
		}
	} catch (e) {
		err("Some thing went wrong with the `l` function: " + e);
	}
}

async function set_custom_image_training () {
	close_popups();

	labels = [];

	if($("#data_origin").val() != "image") {
		$("#data_origin").val("image").trigger("change");
	}

	await rename_labels();
}

async function toggle_layers() {
	$(".left_side").toggle();

	await write_descriptions(1);
}

async function highlight_code () {
	try {
		const codeBlocks = document.querySelectorAll('code[class*="language-"], [class*="language-"] code, [class*="lang-"] code');
		const promises = [];

		for (const block of codeBlocks) {
			// Prüfen, ob schon Tokens eingefügt wurden
			// (Prism fügt <span class="token ..."> hinzu)
			if (block.querySelector('span.token')) {
				// Schon gehighlighted → überspringen
				continue;
			}

			// Wenn kein Token vorhanden, highlight ausführen
			promises.push(new Promise(resolve => {
				try {
					Prism.highlightElement(block, false, () => {
						block.dataset.highlighted = "true";
						resolve(true);
					});
				} catch (e) {
					console.error("Highlight failed:", e);
					resolve(false);
				}
			}));
		}

		await Promise.all(promises);
		return true;
	} catch (err) {
		console.error("highlight_code_fast failed:", err);
		return false;
	}
}

function show_hide_augment_tab () {
	if($("#auto_augment").is(":checked")) {
		dbg("[show_hide_augment_tab] " + language[lang]["showing_augmentation"]);
		$("a[href*=\"tf_ribbon_augmentation\"]").show().parent().show();
	} else {
		dbg("[show_hide_augment_tab] " + language[lang]["hiding_augmentation"]);
		$("a[href*=\"tf_ribbon_augmentation\"]").hide().parent().hide();
	}
}

function get_layer_activation_function (nr) {
	var $layers_container = $("#layers_container");

	if(!$layers_container.length) {
		err(`[get_layer_activation_function] $layers_container not found!`);
		return null;
	}

	var $children = $layers_container.children();

	if(nr > $children.length) {
		dbg(`[get_layer_activation_function] nr ${nr} is larger than $children.length ${$children.length}`);
		return null;
	}

	var $activation_layer = $($children[nr]).find(".activation");

	if(!$activation_layer.length) {
		return null;
	}

	return $activation_layer.val();
}

function get_last_layer_activation_function() {
	var container = document.getElementById("layers_container");
	var children = container.children;
	if (!children.length) return null;
	var last_layer = children[children.length - 1];
	var activation = last_layer.querySelector(".activation");
	return activation ? activation.value : null;
}

function invert_elements_in_dark_mode () {
        is_dark_mode = $("#theme_choser").val() == "darkmode" ? true : false;

        if(is_dark_mode != is_already_inverted_in_dark_mode) {
                var el = $(".invert_in_dark_mode");

                el.removeClass("dark_mode_inverted");

                if(is_dark_mode) {
                        el.addClass("dark_mode_inverted");
                }

                if(is_dark_mode) {
                        $("#asanai_main_logo").attr("src", "_gui/logo_small_dark.png");
                        $("body").addClass("darkmode");
                } else {
                        $("#asanai_main_logo").attr("src", "_gui/logo_small.png");
                        $("body").removeClass("darkmode");
                }

                is_already_inverted_in_dark_mode = is_dark_mode;

                create_weight_surfaces(1);
        }
}

async function onclick_math_mode (t, e) {
	await write_model_to_latex_to_page();
	_temml();
}

async function set_all_strides () {
	var n = $("#all_strides_val").val();
	await _set_all_strides(n);
	if(looks_like_number(n)) {
		$("#all_strides_val").val("");
	}

}

async function _set_all_strides (n) {
	assert(typeof(n) == "number" || looks_like_number(n), n + " is not an integer and does not look like one");
	n = parse_int(n);

	$(".strides_z").val(n);
	$(".strides_y").val(n);
	$(".strides_x").val(n);

	$($(".strides_x")[0]).trigger("change");

}

function hide_empty_tabs (name) {
	var c = $("#" + name).children();

	for (var c_idx = 0; c_idx < c.length; c_idx++) {
		if($(c[c_idx]).css("display") != "none") {
			$("[href='#" + name + "']").parent().show();
			return;
		}
	}

	if($("[href='#" + name + "']").parent().hasClass("ui-state-active")) {
		$("[href='#home_ribbon']").click();
	}

	$("[href='#" + name + "']").parent().hide();
}

function get_canvas_blob(canvas) {
	try {
		return new Promise(function(resolve, reject) {
			try {
				canvas.toBlob(function(blob) {
					resolve(blob);
				});
			} catch (e) {
				if(Object.keys(e).includes("message")) {
					e = e.message;
				}

				assert(false, e);
			}
		});
	} catch (e) {
		if(Object.keys(e).includes("message")) {
			e = e.message;
		}

		assert(false, e);
	}
}

function get_img_blob(img) {
	return new Promise(function(resolve, reject) {
		try {
			var canvas = document.createElement("canvas");
			var ctx = canvas.getContext("2d");
			var $img = $(img);

			if (img.complete) {
				canvas.width = $img.width();
				canvas.height = $img.height();

				ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

				get_canvas_blob(canvas)
					.then(function (blob) {
						resolve(blob);
					})
					.catch(function (error) {
						reject(error);
					});
			} else {
				img.onload = function () {
					canvas.width = $img.width() * 2;
					canvas.height = $img.height() * 2;

					ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

					$("body").append(canvas);

					get_canvas_blob(canvas)
						.then(function (blob) {
							resolve(blob);
						})
						.catch(function (error) {
							reject(error);
						});
				};
			}
		} catch (e) {
			if(Object.keys(e).includes("message")) {
				e = e.message;
			}

			assert(false, e);
		}
	});
}

function show_bars_instead_of_numbers () {
	if(get_last_layer_activation_function() == "softmax") {
		if($("#show_bars_instead_of_numbers").is(":checked")) {
			return true;
		}
	}

	return false;
}

function disable_everything_in_last_layer_enable_everyone_else_in_beginner_mode () {
	try {
		if(model && !(model.isTraining || started_training)) {
			enable_every_layer();
		}

		if(mode == "beginner") {
			var last_element_nr = $(".layer_setting").length - 1;
			var last_layer_setting = $($(".layer_setting")[last_element_nr]);

			const $last_config_table = $($(".configtable")[$(".configtable").length - 1]);

			$last_config_table.find("input,select,button").prop("disabled", true);

			last_layer_setting.find("button").prop("disabled", true);
			last_layer_setting.find(".show_data").prop("disabled", false);
			last_layer_setting.find(".visualize_layer_button").prop("disabled", false);
			last_layer_setting.find(".remove_layer").prop("disabled", true);
			last_layer_setting.find(".add_layer").prop("disabled", false);

			disable_flatten_layer();

			//l("Disabling last layer in beginner mode");
		}
	} catch (e) {
		if(Object.keys(e).includes("message")) {
			e = e.message;
		}

		err("[disable_everything_in_last_layer_enable_everyone_else_in_beginner_mode] " + e);
	}

}

var load_msg_step = 0;
var load_msg_total_steps = 0;

function load_msg_set_steps(total) {
	load_msg_step = 0;
	load_msg_total_steps = total;
}

function load_msg_advance(msg) {
	load_msg_step++;

	var steps_el = $("#load_msg_steps");
	if (!steps_el.length) return;

	var html = "";

	for (var i = 1; i <= load_msg_total_steps; i++) {
		var cls = "load_step_pending";
		if (i < load_msg_step) cls = "load_step_done";
		else if (i === load_msg_step) cls = "load_step_current";

		html += '<div class="' + cls + '"><span class="load_step_dot"></span></div>';
	}

	steps_el.html(html);

	var msg_el = $("#load_msg");
	if (msg_el.length) {
		msg_el.html(msg);
	}
}

function load_msg(swal_msg_format) {
	remove_overlay();

	var _overlay = null;
	if (started_training && stop_downloading_data) {
		info(language[lang]["training_not_started_anymore_stopped_downloading"]);
		return;
	}

	if (finished_loading) {
		const overlay_msg = swal_msg_format["html"] ? swal_msg_format["html"] : "";
		const overlay_title = swal_msg_format["title"] ? swal_msg_format["title"] : "";

		const overlay_options = {
			spinner: true,
			progress: !!swal_msg_format["progress"],
			cancelable: swal_msg_format["cancelable"] !== false,
			onCancel: swal_msg_format["onCancel"] || null
		};

		_overlay = show_overlay(overlay_msg, overlay_title, overlay_options);
	} else {
		var html_msg = "";
		if (Object.keys(swal_msg_format).includes("title")) {
			html_msg = "<h1 style='font-size: 3vw;'>" + swal_msg_format["title"] + "</h1>";
		}

		if (Object.keys(swal_msg_format).includes("html")) {
			html_msg += swal_msg_format["html"];
		}

		$("#load_msg").html(html_msg);
	}

	return _overlay;
}

function is_tablet () {
	var userAgent = navigator.userAgent.toLowerCase();
	var isTablet = /(ipad|tablet|(android(?!.*mobile))|(windows(?!.*phone)(.*touch))|kindle|playbook|silk|(puffin(?!.*(IP|AP|WP))))/.test(userAgent);

	return isTablet;
}

function is_touch_device () {
	if(is_touch_device_cache !== null) {
		return is_touch_device_cache;
	}

	var res = (("ontouchstart" in window) ||
		(navigator.maxTouchPoints > 0) ||
		(navigator.msMaxTouchPoints > 0));

	if(!res) {
		res = !!window.matchMedia("(pointer: coarse)").matches;
	}

	is_touch_device_cache = res;

	return res;
}

function get_cursor_or_none (cursorname) {
	try {
		if(is_touch_device() && is_tablet()) {
			return "none";
		}
	} catch (e) {
		if(("" + e).includes("is_touch_device is not defined")) {
			return cursorname;
		}
	}

	return cursorname;
}

function _model_is_ok_check_status () {
	var green = "<img src='_gui/green.svg' height=12 />";
	var red = "<img src='_gui/red.svg' height=12 />";
	var orange = "<img src='_gui/orange.svg' height=12 />";

	var color = green;
	var msg = language[lang]["model_is_ok"];

	try {
		var model_has_input = 1;
		try {
			var x = model.input;
		} catch (e) {
			model_has_input = 0;
		}

		const nr_of_layers_in_gui = $("#layers_container").find("li").length;
		const nr_of_layers_in_model = model?.layers?.length;

		if(!model) {
			color = red;
			msg = language[lang]["model_is_not_defined"];
		} else if(model && !Object.keys(model).includes("layers")) {
			color = orange;
			msg = "Model does not have any layers.";
		} else if(model && !model_has_input) {
			color = orange;
			msg = "Model has no input.";
		} else if(layer_has_multiple_nodes()) {
			color = red;
			msg = "Model has multiple output nodes.";
		} else if(nr_of_layers_in_gui != nr_of_layers_in_model) {
			color = red;
			msg = `${language[lang]["different_number_layers_gui_model"]} (GUI: ${nr_of_layers_in_gui}, ${language[lang]["model"]}: ${nr_of_layers_in_model}).`;
		}
	} catch (e) {
		color = red;
		msg = "" + e;
		err("model_is_ok: " + msg);
	}

	return {color: color, msg: msg, green: green, red: red, orange: orange};
}

function _model_is_ok_alignment_check (_content, green) {
	var last_description_end_y = parse_int(get_last_description_of_layers_end_y());
	var last_layer_setting_end_y = parse_int(get_last_layer_setting_end_y());

	if(last_description_end_y != 0) {
		if(Math.abs(last_description_end_y - last_layer_setting_end_y) > 3) {
			_content += "&updownarrow;";
			if(finished_loading) {
				dbg(`${language[lang]["desc_boxes_and_layers_different_length"]}: ${last_layer_setting_end_y}/${last_description_end_y}`);
			}
			write_descriptions(); // await not possible
		}
	}

	return _content;
}

function model_is_ok () {
	if(!model_is_ok_icon || !finished_loading) {
		return;
	}

	if(!lang) {
		err("lang is not defined! Something is seriously wrong here...");
		return;
	}

	if(!language) {
		err("language is not defined! Something is seriously wrong here...");
		return;
	}

	var status = _model_is_ok_check_status();
	var color = status.color;
	var msg = status.msg;
	var green = status.green;
	var red = status.red;
	var orange = status.orange;

	var _content = `${color}`;

	_content = add_symbols_to_model_is_ok_content(_content, color, green);

	_content = _model_is_ok_alignment_check(_content, green);

	if(last_model_ok_status != _content) {
		if(color == red) {
			dbg("[model_is_ok] something may be wrong: " + msg);
		} else if (color == orange) {
			dbg("[model_is_ok] " + msg);
		}

		l(msg);

		var new_html = `<span title='${msg}'>${_content}</span>`;
		if(new_html != model_is_ok_icon.html()) {
			model_is_ok_icon.html(new_html);
		}

		last_model_ok_status = _content;
	}

	ribbon_shower_hack();

	set_model_is_ok_icon_color(color, red, green, orange);

	if(color == red) {
		status_model_is_ok = false;
	} else {
		status_model_is_ok = true;
	}
}

function set_model_is_ok_icon_color (color, red, green, orange) {
	if(color == red) {
		$("#model_is_ok_icon").css("color", "red");
	} else if(color == green) {
		$("#model_is_ok_icon").css("color", "green");
	} else if(color == orange) {
		$("#model_is_ok_icon").css("color", "orange");
	}
}

function add_symbols_to_model_is_ok_content (_content, color, green) {
	_content = add_started_training_symbol_to_content(_content);
	_content = add_waiting_symbol_to_content(_content);
	_content = add_model_is_trained_symbol_to_content(_content, color, green);
	return _content;
}

function add_model_is_trained_symbol_to_content (_content, color, green) {
	if(model_is_trained && color == green) {
		_content += "&#9989;";
	}
	return _content;
}

function add_waiting_symbol_to_content(_content) {
	const body = document.body;

	if (waiting_updated_page_uuids.length) {
		_content += "&#9201;";
		body.style.cursor = "wait";
	} else {
		body.style.cursor = "default";
	}

	return _content;
}

function add_started_training_symbol_to_content (_content) {
	if(started_training) {
		_content += "&#129302;&#128214;";
	}
	return _content;
}

function ribbon_shower_hack () {
	// nasty hack to prevent both, ribbon icons and ribbon at the same time
	if($("#ribbon_shower").is(":visible") && $("#ribbon").is(":visible")) {
		show_ribbon();
	}
}

function jump_to_interesting_tab () {
	return $("#jump_to_interesting_tab").is(":checked") ? 1 : 0;
}

function can_reload_js (name) {
	if(name.includes("visualization") ||
		name.includes("libs") ||
		name.includes("visualizer") ||
		name.includes("jquery") ||
		name.includes("tf") ||
		name.includes("snake_activation_layer") ||
		name.includes("multi_activation") ||
		name.includes("main.js") ||
		name.includes("debug_layer") ||
		name.includes("debug.js") ||
		name.includes("three") ||
		name.includes("bottom.js") ||
		name.includes("custom")
	) {
		return false;
	}
	return true;
}

async function reload_all_js () {
	var entries = performance.getEntriesByType("resource");
	entries.map(function(entry) {
		if (entry.initiatorType === "script") {
			if(can_reload_js(entry.name)) {
				reload_js(entry.name);
			}
		}
	});

	await create_model(model, undefined);
	await compile_model();
}

function reload_js(src) {
	$("script[src=\"" + src + "\"]").remove();
	$("<script>").attr("src", src).appendTo("head");
}

// reload_all_js();

function create_centered_window_with_text(parameter) {
	$(".math_copier").remove();

	// Create a div for the window
	var windowDiv = document.createElement("div");
	windowDiv.style.position = "fixed";
	windowDiv.style.top = "50%"; // Center vertically
	windowDiv.style.left = "50%"; // Center horizontally
	windowDiv.style.transform = "translate(-50%, -50%)"; // Center using transform
	windowDiv.style.width = "98%";
	windowDiv.style.minWidth = "300px";
	windowDiv.style.zIndex = 9;
	windowDiv.style.backgroundColor = is_dark_mode ? "black" : "white";
	windowDiv.style.border = "1px solid #ccc";
	windowDiv.style.padding = "10px";
	windowDiv.style.boxShadow = "0px 0px 10px rgba(0, 0, 0, 0.2)";
	windowDiv.style.zIndex = 999999;
	windowDiv.classList.add("math_copier");

	// Create the "x" button
	var closeButton = document.createElement("button");
	closeButton.textContent = "x";
	closeButton.style.position = "absolute";
	closeButton.style.top = "5px";
	closeButton.style.right = "5px";
	closeButton.style.border = "none";
	closeButton.style.backgroundColor = "red";
	closeButton.style.cursor = "pointer";
	closeButton.classList.add("math_copier_close_button");

	// Create the readonly textarea
	var textarea = document.createElement("textarea");
	textarea.readOnly = true;
	textarea.style.width = "100%";
	textarea.style.height = "100%";
	textarea.style.minHeight = "500px";
	textarea.style.height = "80%";
	textarea.textContent = parameter;

	// Create the "Copy to Clipboard" button
	var copyButton = document.createElement("button");
	copyButton.textContent = language[lang]["copy_to_clipboard"];
	copyButton.style.width = "100%";
	copyButton.style.marginTop = "10px";

	// Add a click event listener to copy the textarea's content to the clipboard
	copyButton.addEventListener("click", () => {
		textarea.select();
		document.execCommand("copy");
	});

	// Add the textarea, copy button, and close button to the window
	windowDiv.appendChild(closeButton);
	windowDiv.appendChild(textarea);
	windowDiv.appendChild(copyButton);

	// Add an event listener to close the window when the "x" button is clicked
	closeButton.addEventListener("click", () => {
		document.body.removeChild(windowDiv);
	});

	// Append the window to the body to display it
	document.body.appendChild(windowDiv);

	function esc_listener(e) {
		if (e.key === "Escape") {
			if (document.body.contains(windowDiv)) {
				document.body.removeChild(windowDiv);
			}
			document.removeEventListener("keydown", esc_listener);
		}
	}

        document.addEventListener("keydown", esc_listener);
}

function close_math_copiers () {
	$(".math_copier_close_button").click();
}

function get_last_element_of_class_end_y(name) {
	if(document.body === null) {
		wrn("[get_last_element_of_class_end_y] document.body is null!");
		return;
	}

	assert(typeof(name) == "string", "get_last_element_of_class_end_y(" + name + ") parameter is not a string");
	var descs = $("." + name);

	if (!descs) {
		wrn("[get_last_element_of_class_end_y] descs not defined");
		return 0;
	}

	try {
		var last_desc = descs[descs.length - 1];
		if(!last_desc) {
			return 0;
		}

		var $last_desc = $(last_desc);

		var real_height_last_desc = real_height($last_desc);
		var last_desc_offset = $last_desc.offset();

		if(last_desc_offset && Object.keys(last_desc_offset).includes("top")) {
			var _res = last_desc_offset.top + real_height_last_desc;

			return _res;
		} else {
			return 0;
		}
	} catch (e) {
		if(Object.keys(e).includes("message")) {
			e = e.message;
		}

		wrn("[get_last_element_of_class_end_y] " + e);
	}

	return 0;
}

function get_last_layer_setting_end_y () {
	return get_last_element_of_class_end_y("layer_setting");
}

function get_last_description_of_layers_end_y () {
	return get_last_element_of_class_end_y("descriptions_of_layers");
}

function set_document_title (t) {
	if(t) {
		if(t != document.title) {
			document.title = t;
		}
	} else {
		err(language[lang]["missing_title"]);
	}
}

function hide_dataset_when_only_one () {
	var num_datasets = $("#model_dataset").children().length;

	if(num_datasets > 1) {
		$("#model_dataset").parent().parent().show();
	} else {
		$("#model_dataset").parent().parent().hide();
	}
}

// get_kernel_images not yet used
function get_kernel_images (layer_nr, all=0) {
	try {
		var _k = model?.layers[layer_nr].kernel.val.shape;
		var transposed_kernel = tidy(() => { return array_sync(tf_transpose(model?.layers[layer_nr].kernel.val, [3, 0, 1, 2])); });

		var kernel_size_x = _k[0];
		var kernel_size_y = _k[1];
		var channels_per_filter = _k[2];
		var filters = _k[3];

		if(all) {
			return transposed_kernel;
		}

		return transposed_kernel[0];
	} catch (e) {
		if(Object.keys(e).includes("message")) {
			e = e.message;
		}

		assert(false, e);
	}
}

function normalizeArray(array) {
	var min = Math.min(...array);
	var max = Math.max(...array);
	return array.map(value => ((value - min) / (max - min)) * 255);
}

function get_min_max_val(n, m, this_layer_output) {
	var minVal = Infinity;
	var maxVal = -Infinity;

	for (var x = 0; x < n; x++) {
		for (var y = 0; y < m; y++) {
			var value = this_layer_output[x][y];
			if (value < minVal) minVal = value;
			if (value > maxVal) maxVal = value;
		}
	}

	return [minVal, maxVal];
}

function get_last_layer_classname() {
	return get_layer_classname_by_nr(model?.layers?.length - 1);
}

function get_layer_classname_by_nr(layer_idx) {
	if (!model || !model?.layers) {
		err("Model or model.layers is undefined!");
		return null;
	}

	var nr_of_layer = model?.layers?.length;
	if(!nr_of_layer) {
		return null;
	}

	if (layer_idx < 0 || layer_idx >= nr_of_layer) {
		wrn(`layer_idx ${layer_idx} is out of bounds. Valid range: 0-${nr_of_layer - 1}`);
		return null;
	}

	try {
		const className = model?.layers[layer_idx].getClassName();
		return className;
	} catch (e) {
		err(`Error retrieving className for layer ${layer_idx}: ${e.message}`);
		return null;
	}
}

function reset_tiny_graph(hide=0) {
	if(hide) {
		$("#tiny_graph").html("").hide();
	} else {
		$("#tiny_graph").html("");
	}
}

function format_number(n) {
	if(n === null || n === undefined) return "—";
	if(typeof n === "number") {
		if(Math.abs(n) < 0.001 || Math.abs(n) > 1e6) return n.toExponential(4);
		return n.toFixed(6);
	}
	return String(n);
}

function format_duration(ms) {
	if(!ms || ms < 0) return "—";
	var s = Math.floor(ms / 1000);
	var m = Math.floor(s / 60);
	var h = Math.floor(m / 60);
	s = s % 60;
	m = m % 60;
	if(h > 0) return h + "h " + m + "m " + s + "s";
	if(m > 0) return m + "m " + s + "s";
	return s + "s";
}

var _tiny_graph_training_info = {};

function set_tiny_graph_training_info(info) {
	_tiny_graph_training_info = Object.assign(_tiny_graph_training_info, info);
}

function update_tiny_graph_tooltip() {
	var t = _tiny_graph_training_info;
	var loss_vals = t.loss_values || [];
	var val_loss_vals = t.val_loss_values || [];

	var current_loss = loss_vals.length ? loss_vals[loss_vals.length - 1] : null;
	var best_loss = loss_vals.length ? Math.min(...loss_vals) : null;
	var current_val_loss = val_loss_vals.length ? val_loss_vals[val_loss_vals.length - 1] : null;
	var best_val_loss = val_loss_vals.length ? Math.min(...val_loss_vals) : null;

	var elapsed = t.start_time ? Date.now() - t.start_time : null;
	var epoch_time = (elapsed && t.current_epoch > 0) ? elapsed / t.current_epoch : null;
	var epochs_left = (t.total_epochs && t.current_epoch) ? t.total_epochs - t.current_epoch : null;
	var eta = (epoch_time && epochs_left) ? epoch_time * epochs_left : null;

	var loss_class = "tg_value";
	if(loss_vals.length >= 2) {
		var prev = loss_vals[loss_vals.length - 2];
		if(current_loss < prev) loss_class = "tg_value tg_good";
		else if(current_loss > prev * 1.1) loss_class = "tg_value tg_bad";
		else loss_class = "tg_value tg_warn";
	}

	var html = "";
	html += "<div><span class='tg_label'>Epoch:</span> <span class='tg_value'>" + (t.current_epoch || "—") + " / " + (t.total_epochs || "—") + "</span></div>";
	html += "<div class='tg_separator'></div>";
	html += "<div><span class='tg_label'>Loss:</span> <span class='" + loss_class + "'>" + format_number(current_loss) + "</span></div>";
	if(best_loss !== null) {
		html += "<div><span class='tg_label'>Best Loss:</span> <span class='tg_value tg_good'>" + format_number(best_loss) + "</span></div>";
	}
	if(current_val_loss !== null) {
		html += "<div><span class='tg_label'>Val Loss:</span> <span class='tg_value'>" + format_number(current_val_loss) + "</span></div>";
	}
	if(best_val_loss !== null) {
		html += "<div><span class='tg_label'>Best Val:</span> <span class='tg_value tg_good'>" + format_number(best_val_loss) + "</span></div>";
	}
	if(t.batch_size) {
		html += "<div class='tg_separator'></div>";
		html += "<div><span class='tg_label'>Batch Size:</span> <span class='tg_value'>" + t.batch_size + "</span></div>";
	}
	if(t.validation_split !== undefined && t.validation_split !== null) {
		html += "<div><span class='tg_label'>Val Split:</span> <span class='tg_value'>" + parse_int(t.validation_split * 100) + "%</span></div>";
	}
	if(t.dataset_name) {
		html += "<div class='tg_separator'></div>";
		html += "<div><span class='tg_label'>Dataset:</span> <span class='tg_value'>" + t.dataset_name + "</span></div>";
	}
	if(t.model_info) {
		html += "<div><span class='tg_label'>Model:</span> <span class='tg_value'>" + t.model_info + "</span></div>";
	}
	if(elapsed) {
		html += "<div class='tg_separator'></div>";
		html += "<div><span class='tg_label'>Elapsed:</span> <span class='tg_value'>" + format_duration(elapsed) + "</span></div>";
	}
	if(eta) {
		html += "<div><span class='tg_label'>ETA:</span> <span class='tg_value'>" + format_duration(eta) + "</span></div>";
	}
	if(t.num_runs > 1) {
		html += "<div class='tg_separator'></div>";
		html += "<div><span class='tg_label'>Run:</span> <span class='tg_value'>" + (t.current_run || 1) + " / " + t.num_runs + "</span></div>";
	}

	var $tg = $("#tiny_graph");
	var $old = $tg.find(".tiny_graph_tooltip_box");
	if($old.length) {
		$old.html(html);
	} else {
		$tg.append('<span class="tiny_graph_tooltip_box">' + html + '</span>');
	}
}

$(document).on("mouseenter", "#tiny_graph", function() {
	var $box = $(this).find(".tiny_graph_tooltip_box");
	if($box.length) {
		var rect = this.getBoundingClientRect();
		var boxW = $box.outerWidth();
		var boxH = $box.outerHeight();
		var left = rect.right - boxW;
		var top = rect.bottom + 4;
		if(left < 4) left = 4;
		if(top + boxH > window.innerHeight - 4) {
			top = rect.top - boxH - 4;
		}
		$box.css({ top: top + "px", left: left + "px" });
	}
});

function clear_tiny_graph_tooltip() {
	_tiny_graph_training_info = {};
	$("#tiny_graph .tiny_graph_tooltip_box").remove();
}

function hide_training_progress_bar () {
	$("#training_progress_bar").hide();
}

function show_training_progress_bar () {
	$("#training_progress_bar").show();
}

function set_adam_lr (lr) {
	$("#learningRate_adam").val(lr).trigger("change");
}

function set_imgcat (new_nr) {
	if(!looks_like_number(new_nr)) {
		err(`set_imgcat: ${new_nr} is does not look like a number`);
		return;
	}

	if (!Number.isInteger(Number(new_nr))) {
		err(`set_imgcat: ${new_nr} is does not look like an integer`);
		return;
	}

	$("#max_number_of_files_per_category").val(new_nr).trigger("change");
}

function get_imgcat () {
	return $("#max_number_of_files_per_category").val();
}

async function set_data_origin_and_wait(val) {
        $("#data_origin").val(val).trigger("change");
        await wait_for_updated_page(3);
}

async function set_model_dataset(val) {
	$("#model_dataset").val(val).trigger("change");

	await wait_for_updated_page(3);
}

function hide_layer_visualization_tab () {
	$("#layer_visualizations_tab").html("").hide();
}

function get_layer_visualization_tab_str() {
	return $("#layer_visualizations_tab").html();
}

function hide_data_plotter() {
	$("#data_plotter").hide();
}

function show_data_plotter() {
	$("#data_plotter").show();
}

function show_conv_visualizations() {
	$(".hide_when_no_conv_visualizations").hide();
	$(".hide_when_conv_visualizations").show();
}

function hide_conv_visualizations() {
	$(".hide_when_no_conv_visualizations").show();
	$(".hide_when_conv_visualizations").hide();
}

function enabled_saving_history () {
	return $("#save_math_history").is(":checked");
}

function any_trainable_checked() {
	try {
		var checkboxes = document.querySelectorAll('input.input_data.trainable[type="checkbox"]');
		if (!checkboxes || checkboxes.length === 0) {
			return false;
		}
		for (var i = 0; i < checkboxes.length; i++) {
			if (checkboxes[i].checked === true) {
				return true;
			}
		}
		return false;
	} catch (error) {
		return false;
	}
}

function open_help() {
	try {
		var url = 'manual.html';
		var newTab = window.open(url, '_blank');

		if (newTab === null) {
			alert('Popup blocked! Please allow popups for this site to view the manual.');
			console.error('Popup blocked by browser when trying to open: ' + url);
			return false;
		}

		newTab.focus();
		console.log('Manual opened successfully in new tab:', url);
		return true;
	} catch (error) {
		console.error('Error opening manual.html:', error);
		alert('An error occurred while trying to open the manual.');
		return false;
	}
}

function close_popups() {
	close_popup('save_model_dialog');
	close_popup('upload_dialog');
	close_popup('sources_popup');
}
