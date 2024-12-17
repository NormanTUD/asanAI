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

var seed_two = 1;
function random_two(min, max) { // Seeded PRNG
	var x = Math.sin(seed_two++) * 10000;
	result = x - Math.floor(x);
	result = ((max - min) * result) + min;
	return result;
}

var seed = 1;
function random(min, max) { // Seeded PRNG
	var x = Math.sin(seed++) * 10000;
	result = x - Math.floor(x);
	result = ((max - min) * result) + min;
	return result;
}

function get_units_at_layer(i, use_max_layer_size) {
	var units = undefined;
	try {
		var units = get_item_value(i, "units");
		if(units) {
			units = parse_int(units);
		} else {
			if(model === null) {
				units = 0;
			} else {
				var filters = $($(".layer_setting")[i]).find(".filters");
				if(filters.length) {
					units = parse_int($(filters).val());
				} else {
					try {
						units = Math.max(0, model.layers[i].countParams());
					} catch (e) {
						wrn("Something went wrong when trying to determine get_units_at_layer");
					}
				}
			}
		}
	} catch (e) {
		log(e);
	}

	var max_neurons_fcnn = parse_int($("#max_neurons_fcnn").val());

	if(units > max_neurons_fcnn && use_max_layer_size) {
		info("FCNN-Visualization: Units is " + units + ", which is bigger than " + max_neurons_fcnn + ". " + max_neurons_fcnn + " is the maximum, it will get set to this for layer " + i);
		units = max_neurons_fcnn;
	}

	return units;
}

async function download_visualization (layer_id) {
	var content = $("<div>").append($($("#" + layer_id).html()).attr("xmlns", "http://www.w3.org/2000/svg") ).html();
	var data_url = "data:application/octet-stream;base64," + btoa(unescape(encodeURIComponent(content)));
	var a = document.createElement("a");
	a.href = data_url;
	a.download = layer_id + ".svg";
	a.click();
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
			disable_start_training_button_custom_images();
		};
		reader.readAsDataURL(f);
	});

	disable_start_training_button_custom_images();
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
