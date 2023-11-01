var get_methods = (obj) => Object.getOwnPropertyNames(obj).filter(item => typeof obj[item] === "function");
var local_store = window.localStorage;
local_store.clear();

var old_mode = "beginner";

function get_mode() {
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
		l("FCNN-Visualization: Units is " + units + ", which is bigger than " + max_neurons_fcnn + ". " + max_neurons_fcnn + " is the maximum, it will get set to this for layer " + i);
		units = max_neurons_fcnn;
	}

	return units;
}

var lenet;
try {
	lenet = LeNet();
} catch (e) {
	if(Object.keys(e).includes("message")) {
		e = e.message;
	}

	err("" + e);
}

async function restart_lenet(dont_click) {
	var layer_to_lenet_arch = {};
	architecture = [];
	architecture2 = [];
	colors = [];

	var j = 0;
	if(!show_input_layer) {
		j--;
	}

	for (var i = 0; i < get_number_of_layers(); i++) {
		var layer_type = $($(".layer_type")[i]).val();
		if(typeof(layer_type) === "undefined") {
			return;
		}

		if(!model) {
			continue;
		}

		if(!model.layers) {
			continue;
		}

		if(Object.keys(model.layers).includes("0")) {
			if(layer_type in layer_options && Object.keys(layer_options[layer_type]).includes("category")) {
				var category = layer_options[layer_type]["category"];

				if((category == "Convolutional" || category == "Pooling") && layer_type.endsWith("2d") && layer_type.startsWith("conv")) {
					try {
						var this_layer_arch = {};
						this_layer_arch["op"] = layer_type;
						this_layer_arch["layer"] = ++j;

						var layer_config = model.layers[i].getConfig();
						var push = 0;
						if("filters" in layer_config) {
							this_layer_arch["filterWidth"] = get_item_value(i, "kernel_size_x");
							this_layer_arch["filterHeight"] = get_item_value(i, "kernel_size_y");
							this_layer_arch["numberOfSquares"] = layer_config["filters"];
							push = 1;
						} else if("poolSize" in layer_config) {
							var output_size_this_layer = await output_size_at_layer(get_input_shape(), i);
							this_layer_arch["filterWidth"] = get_item_value(i, "pool_size_x");
							this_layer_arch["filterHeight"] = get_item_value(i, "pool_size_y");
							this_layer_arch["numberOfSquares"] = output_size_this_layer[3];
							push = 1;
						}

						var input_layer = model.layers[i].getInputAt(0);
						this_layer_arch["squareWidth"] = input_layer["shape"][1];
						this_layer_arch["squareHeight"] = input_layer["shape"][2];

						if(push) {
							architecture.push(this_layer_arch);
							layer_to_lenet_arch[i] = {arch: "architecture", "id": architecture.length - 1};
							colors.push("#ffffff");
						}
					} catch (e) {
						err(e);
					}
				} else if (category == "Basic") {
					try {
						var units_at_layer = get_units_at_layer(i, 0);
						if(units_at_layer) {
							architecture2.push(units_at_layer);
							layer_to_lenet_arch[i] = {"arch": "architecture2", "id": architecture.length - 1};
						}
					} catch (e) {
						return;
					}
				}

			} else {
				log("Cannot get category of layer type of layer " + i);
				return;
			}
		} else {
			wrn("Model has no first layer. Returning from restart_lenet");
		}
	}

	var disable_lenet = 0;

	try {
		if(architecture.length >= 1 && architecture2.length) {
			if(show_input_layer) {
				var shown_input_layer = {};
				shown_input_layer["op"] = "Input Layer";
				shown_input_layer["layer"] = 0;
				shown_input_layer["filterWidth"] = get_input_shape()[0];
				shown_input_layer["filterHeight"] = get_input_shape()[1];
				shown_input_layer["numberOfSquares"] = 1;
				shown_input_layer["squareWidth"] = get_input_shape()[0];
				shown_input_layer["squareHeight"] = get_input_shape()[1];
				architecture.unshift(shown_input_layer);
			}

			try {
				var redraw_data = {"architecture_": architecture, "architecture2_": architecture2, "colors": colors};
				var new_hash = await md5(JSON.stringify(redraw_data));
				if(graph_hashes["lenet"] != new_hash) {
					lenet.redraw(redraw_data);
					lenet.redistribute({"betweenLayers_": []});
					graph_hashes["lenet"] = new_hash;
				}
			} catch (e) {
				log(e);
			}
		} else {
			disable_lenet = 1;
		}
	} catch (e) {
		log("ERROR: ", e);
		disable_lenet = 2;
	}

	if(disable_lenet) {
		if(!is_cosmo_mode) {
			hide_tab_label("lenet_tab_label");
			if(clicked_on_tab == 0) {
				if(!dont_click) {
					show_tab_label("fcnn_tab_label", click_on_graphs);
					clicked_on_tab = 1;
				}
			}
		}
	} else {
		if(!is_cosmo_mode) {
			show_tab_label("lenet_tab_label", 0);
			if(clicked_on_tab == 0) {
				if(!dont_click) {
					show_tab_label("lenet_tab_label", click_on_graphs);
					clicked_on_tab = 1;
				}
			}
		}
	}

	reset_view();
	conv_visualizations["lenet"] = !disable_lenet;
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
		$($("input[name='backend_chooser']")[0]).click().trigger("change")
	}

	set_mode();
});
