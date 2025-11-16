"use strict";

var get_methods = (obj) => Object.getOwnPropertyNames(obj).filter(item => typeof obj[item] === "function");
var local_store = window.localStorage;
local_store.clear();

var old_mode = "beginner";

function get_mode() {
	if(!Object.keys(language).includes(lang)) {
		err(`${lang} is not in languages!`);
		return;
	}

	var mode = $("#mode_chooser > input[type=radio]:checked").val();
	if(mode != old_mode && (state_stack.length > 1 || future_state_stack.length)) {
		state_stack = [];
		future_state_stack = [];

		show_hide_undo_buttons();
		l(language[lang]["changed_mode_from"] + " " + language[lang][old_mode] + " " + language[lang]["to"] + " " + language[lang][mode] + ", " + language[lang]["lost_undo_redo_stack"]);
	} else {
		if(mode != old_mode) {
			l(language[lang]["changed_mode_from"] + " " + language[lang][old_mode] + " " + language[lang]["to"] + " " + language[lang][mode]);
		}
	}

	if(old_mode != mode) {
		set_cookie("mode", mode);
	}

	return mode;
}

function set_mode () {
	mode = get_mode();
	set_cookie("mode", mode);
	if(mode == "beginner") {
		$(".layer_type").children().children().each(function (t, l) {
			if(!$(l).is(":checked")) {
				$(l).attr("disabled", true);
			}
		});
		$("#auto_input_shape").prop("checked", true);
		$(".expert_mode_only").hide();
		l(language[lang]["switched_to_beginner_mode"]);
	} else {
		$(".expert_mode_only").show();
	}

	disable_everything_in_last_layer_enable_everyone_else_in_beginner_mode();
}

var clicked_on_tab = 0;

var currentLayer = 0;

function get_units_at_layer(layer_idx, use_max_layer_size = false) {
	var units;
	try {
		units = get_item_value(layer_idx, "units");

		if (units != "" && units !== null && units !== undefined) {
			units = parse_int(units);
		} else if (model === null) {
			units = 0;
		} else {
			var filters = $($(".layer_setting")[layer_idx]).find(".filters");
			const filters_val = $(filters).val();
			if (filters.length && looks_like_number(filters_val)) {
				units = parse_int(filters_val);
			} else {
				try {
					units = Math.max(0, model?.layers[layer_idx]?.countParams() || 0);
				} catch (e) {
					wrn(language[lang]["something_went_wrong_when_trying_to_determine_get_units_at_layer"]);
				}
			}
		}
	} catch (e) {
		log(e);
	}

	const max_neurons = $("#max_neurons_fcnn").val();

	var max_neurons_fcnn = 32;

	if(looks_like_number(max_neurons)) {
		var max_neurons_fcnn = parse_int(max_neurons);
	}

	if (units > max_neurons_fcnn && use_max_layer_size) {
		info(sprintf(
			language[lang]["fcnn_visualization_units_is_m_which_is_bigger_than_m_a_is_maximum_it_will_be_set_for_the_layer_x"],
			units, max_neurons_fcnn, max_neurons_fcnn, layer_idx
		));
		units = max_neurons_fcnn;
	}

	return units;
}

$(".show_after_training").hide();

favicon_default();

enable_disable_kernel_images();
enable_disable_grad_cam();

if(window.location.href.indexOf("function_debugger") > -1) {
	add_function_debugger();
}

async function init_own_image_files() {
	$(".own_image_files").unbind("change");
	$(".own_image_files").change(handle_file_select);
	await rename_labels();
}

document.addEventListener("DOMContentLoaded", init_own_image_files, false);

function get_nr_from_own_image_files (e) {
	var currentTarget = e.currentTarget;

	var nr = null;

	$(".own_image_files").each(function (x, y) {
		if (get_element_xpath(y) == get_element_xpath(currentTarget)) { nr = x; }
	});

	return nr;
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

if(window.location.href.indexOf("run_tests") > -1) {
	run_tests(); // await not possible
}

install_memory_debugger();

load_time = Date().toLocaleString();

$(document).ready(function() {
	if(force_cpu_backend) {
		$($("input[name='backend_chooser']")[0]).click().trigger("change");
	}

	set_mode();
});
