async function add_cosmo_point (name, show_manicule=1) {
	if(is_cosmo_mode) {
		if(!Object.keys(current_skills).includes(name)) {
			current_skills[name] = 1;
		} else {
			current_skills[name]++;
		}

		await show_cosmo_elements_depending_on_current_skills();

		cosmo_debugger();

		if(show_manicule) {
			await chose_next_manicule_target();
		}
	} else {
		current_skills = {};
	}

	await run_cosmo_milestones();

	show_hide_cosmo_stuff();

	$("#stop_downloading").hide();
}

async function show_cosmo_elements_depending_on_current_skills () {
	var elements = $(".cosmo");

	for (var i = 0; i < elements.length; i++) {
		var required_skills = $(elements[i]).data("required_skills");
		//log("!!! required_skills !!! : ", required_skills);
		if(typeof(required_skills) == "string") {
			var s = {};
			if(!required_skills == "") {
				s = parse_required_skills(required_skills);
			}

			//log("!!! s:", s);

			//log("if(checkSubset(", Object.keys(current_skills), ", ", Object.keys(s) + ")) { = ", checkSubset(Object.keys(current_skills), Object.keys(s)));

			if(checkSubset(Object.keys(current_skills), Object.keys(s)) && each_skill_level_matches(current_skills, s)) {
				//log("current_skills in required_skills", current_skills, s);
				//log("Showing ", elements[i]);
				$(elements[i]).show();
				if(last_manually_removed_manicule_element && get_element_xpath(elements[i]) == get_element_xpath(last_manually_removed_manicule_element)) {
					//log("Not reinserting recently manually removed element (xpath: " + get_element_xpath(last_manually_removed_manicule_element) + ")");
				} else {
					if(!manicule === null) {
						var last_queue_xpath = "EMPTY";
						if(manicule_queue.length) {
							last_queue_xpath = get_element_xpath(manicule_queue[manicule_queue.length - 1]);
						}
						var new_xpath = get_element_xpath(elements[i]);

						//log(`if(${manicule_queue.length} == 0 || ${last_queue_xpath} != ${new_xpath} ) {`);

						if(manicule_queue.length == 0 || last_queue_xpath != new_xpath ) {
							manicule_queue.push(elements[i]);
						}
					}
					// TODO: Queue abarbeiten
					//log("queue:", manicule_queue);
				}
			} else {
				if(!$(elements[i]).data("dont_hide_after_show")) {
					$(elements[i]).hide();
				}
			}
		} else {
			wrn("ELEMENT HAS NO REQUIRED SKILLS, YET IS IN COSMO CLASS:", elements[i]);
		}
	}

	if(Object.keys(current_skills).includes("finished_training") && current_skills["finished_training"] >= 3) {
	}
}

let checkSubset = (parentArray, subsetArray) => {
	return subsetArray.every((el) => {
		return parentArray.includes(el);
	});
};

function each_skill_level_matches (c, s) {
	var s_keys = Object.keys(s);
	for (var i = 0; i < s_keys.length; i++) {
		var keyname = s_keys[i];

		if(!Object.keys(s).includes(keyname)) {
			return false;
		}

		if(s[keyname] != c[keyname]) {
			return false;
		}
	}

	return true;
}

function find_largest_element_with_coordinates(element) {
	// Get the bounding rectangle of the current element
	const rect = element.getBoundingClientRect();
	let maxWidth = rect.width;
	let maxHeight = rect.height;
	let x = parse_int($(element).css("left"));
	let y = parse_int($(element).css("top"));
	let left = element.getBoundingClientRect()["left"];
	let right = element.getBoundingClientRect()["right"];
	let t = element.getBoundingClientRect()["top"];
	let bottom = element.getBoundingClientRect()["bottom"];

	let largestElement = element;

	// Traverse through all child elements recursively
	for (const childElement of element.children) {
		const { width, height, largestChild } = find_largest_element_with_coordinates(childElement);

		// Update the maximum width, height, and largestElement if necessary
		if (width > maxWidth || height > maxHeight) {
			maxWidth = Math.max(maxWidth, width);
			maxHeight = Math.max(maxHeight, height);
			largestElement = largestChild;
			x = parse_int($(childElement).css("left"));
			y = parse_int($(childElement).css("top"));
			left = childElement.getBoundingClientRect()["left"];
			right = childElement.getBoundingClientRect()["right"];
			t = element.getBoundingClientRect()["top"];
			bottom = element.getBoundingClientRect()["bottom"];
		}
	}

	return { width: maxWidth, height: maxHeight, largestChild: largestElement, x: x, y: y, left: left, right: right, "top": t, bottom: bottom };
}

async function chose_next_manicule_target () {
	if(in_fireworks) {
		log("Not chosing manicule because a firework is showing");
		return;
	}

	if(generating_images) {
		return;
	}

	await set_text_for_elements_depending_on_cosmo_level();

	fit_to_window(); // no await possible
}

function show_again_when_new_skill_acquired ($x, possible_items) {
	var show_again = $x.data("show_again_when_new_skill_acquired");
	if(show_again) {
		var show_again_full = {};
		var possible = true;

		// TODO!!!
		if(typeof(show_again) == "string") {
			show_again_full = parse_required_skills(show_again);
		}

		for (var k = 0; k < Object.keys(show_again_full).length; k++) {
			var key = Object.keys(show_again_full)[k];
			if(Object.keys(current_skills).includes(key)) {
				if(!current_skills[key] == show_again[key]) {
					possible = false;
				}
			} else {
				possible = false;
			}

		}

		if(possible) {
			possible_items.push({"item": $x, "length": Object.keys(show_again_full).length});
		}
	}

	return possible_items;
}

function is_mouse_over_element(className) {
	const elements = document.getElementsByClassName(className);

	if(mouseX == -1 || mouseY == -1) {
		if(is_cosmo_mode) {
			wrn("No mouse movement detected yet");
		} else {
			wrn("is_mouse_over_element: not in cosmo mode, returning false.");
		}
		return false;
	}

	// Check if any element with the specified class name is visible and mouse is over it
	for (const element of elements) {
		if (!is_hidden_or_has_hidden_parent(element)) {
			const rect = element.getBoundingClientRect();

			if (
				mouseX >= rect.left &&
				mouseX <= rect.right &&
				mouseY >= rect.top &&
				mouseY <= rect.bottom
			) {
				return true;
			}
		}
	}

	return false;
}

function is_mouse_over_element_variables (elements) {
	if (mouseX === -1 || mouseY === -1) {
		if (is_cosmo_mode) {
			wrn("No mouse movement detected yet");
		} else {
			wrn("is_mouse_over_element_variables: not in cosmo mode, returning false.");
		}
		return false;
	}

	// Check if any element in the elements array is visible and mouse is over it
	for (const element of elements) {
		if (!is_hidden_or_has_hidden_parent(element)) {
			const rect = element.getBoundingClientRect();

			if (
				mouseX >= rect.left &&
				mouseX <= rect.right &&
				mouseY >= rect.top &&
				mouseY <= rect.bottom
			) {
				return true;
			}
		}
	}

	return false;
}

async function cosmo_mode () {
	$("#status_bar").hide();
	//console.trace();
	if(is_cosmo_mode) {
		l("Is already cosmo mode, not doing anything");
		return;
	}

	l("Starting cosmo mode");
	$("#beginner").click();
	// switch to cosmo mode
	set_cookie("cosmo_mode", "1", 365);
	await hide_layer_view();
	hide_ribbon();
	//$("#show_layer_data").prop("checked", true)
	$("#show_hide_ribbon_button").hide();
	$(".vis_button").hide();
	$("#toggle_layer_view_button").hide();
	$("#show_grad_cam").parent().hide();
	$("#show_layer_data").parent().hide();
	$("#navbar1").hide();
	$(".navi_list").hide();
	$("#hr_nav").hide();
	$("#upload_file").hide();
	$("#repredict_examples_button").hide();
	$("#download_data").hide();
	//move_element_to_another_div($("#layer_visualizations_tab")[0], $("#show_visualization_here_in_cosmo")[0]);
	is_cosmo_mode = true;

	await add_cosmo_point("loaded_page");

	function timer_increment() {
		if(Object.keys(current_skills).length > 1) {
			idleTime = idleTime + 1;
			if (idleTime > reload_time) { // 10 minutes
				if(is_cosmo_mode) {
					window.location.reload();
					location.reload();
				}
			}
		}

		show_idle_time();
	}

	$(document).ready(function () {
		// Increment the idle time counter every minute.
		idleInterval = setInterval(timer_increment, 1000); // 1 sekunde

		// Zero the idle timer on mouse movement.
		$(this).mousemove(function (e) {
			idleTime = 0;
		});

		$(this).keypress(function (e) {
			idleTime = 0;
		});
	});

	document.addEventListener("mousemove", (event) => {
		mouseX = event.clientX;
		mouseY = event.clientY;
	});

	disable_everything_in_last_layer_enable_everyone_else_in_beginner_mode();

	$(".show_only_in_cosmo_mode").show();

	await run_presentation("cosmo_presentation");

	$(".glass_box").css("border", "none");
	$(".glass_box").css("box-shadow", "none");
	$("#body").css("text-align", "center");

	const colorPickerContainer = document.querySelector("div[style*='width: 239px'][style*='height: 129px']");

	// To make the entire document unselectable
	document.documentElement.style.userSelect = "none";

	// To make a specific element with ID "body" unselectable
	var bodyElement = document.getElementById("body");
	bodyElement.style.userSelect = "none";

	add_background_gradient();

	$(".graphs_here").css("margin-top", "100px");

	$("#toggle_layers_button").hide();
	$("#show_webcam_button").hide();

	$("#max_activation_iterations").val(30);

	$("#show_webcam_button").css("visibility", "hidden");
	//$("#start_stop_training").show().css("display", "initial");
	$("#custom_webcam_training_data").hide();

	$("#side_by_side_container").css("padding-top", "70px");

	$("#emergency_button").css("display", "inline-block");

	window.setInterval(async function () {
		if(!is_presenting && (manicule === null || manicule === undefined)) {
			await chose_next_manicule_target();
		}
	}, 1000);

	window.addEventListener("resize", async function(event) { await fit_to_window(); }, true);

	$(".show_in_cosmo_mode").show();

	$("#own_files").css("display", "flex").css("justify-content", "center");
	$("#theme_choser").val("lightmode").trigger("change");

	$("body").css("cursor", get_cursor_or_none("default"));

	log("Setting validation split to 0");
	set_validation_split(0);
}

function is_touch_device () {
	var res = (("ontouchstart" in window) ||
		(navigator.maxTouchPoints > 0) ||
		(navigator.msMaxTouchPoints > 0));

	if(!res) {
		res = !!window.matchMedia("(pointer: coarse)").matches;
	}
	return res;
}

function find_color_picker_container(element) {
	// Traverse up the DOM until a color picker container is found
	while (element && !is_color_picker_container(element)) {
		element = element.parentElement;
	}
	return element;
}

function is_color_picker_container(element) {
	// Modify this check based on specific properties or elements of your color picker
	// For example, you can check if the element has a specific set of child elements or CSS properties unique to the color picker.
	// This is just a simple example, and you may need to adjust it based on your actual color picker's structure.
	return element.style.zIndex === "1000" && element.style.position === "absolute";
}

function is_inside_color_picker(x, y, colorPickerContainer) {
	if (!colorPickerContainer) return false;

	const rect = colorPickerContainer.getBoundingClientRect();
	return x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom;
}

function has_special_cosmo_classes (x) {
	var s = false;
	var c = x.classList;

	for (var i = 0; i < c.length; i++) {
		if(c[i].match(/cosmo/)) {
			s = true;
			break;
		}
	}

	return s;
}

// Function to be executed
function autochoose_next () {
	//console.trace();
	//log("clicked anywhere in cosmo mode!");
	if(manicule) {
		$(manicule.element).click();
	} else {
		wrn("No manicule element found...");
	}
}

function add_background_gradient () {
	var body = document.querySelector("body");
	var from = "d3e4f3";
	var to = "ffffff";
	body.style.background = `linear-gradient(to bottom, #${from} 0px, #${to} 10vh)`;
}

function find_color_picker_elements(node, colorPickerElements) {
	if (!node) return;

	// Check if the current node resembles the structure of the color picker base div
	if (
		node.style &&
		node.style.position === "absolute" &&
		node.style.width === "239px" &&
		node.style.height === "129px" &&
		node.style.zIndex === "1000"
	) {
		colorPickerElements.push(node);
	}

	// Recursively check child nodes
	for (const child of node.children) {
		find_color_picker_elements(child, colorPickerElements);
	}
}

function get_color_picker_elements() {
	const colorPickerElements = [];
	find_color_picker_elements(document.body, colorPickerElements);
	return colorPickerElements;
}

/*
// Get the list of all color picker base div elements available on the current page
var colorPickerElementsList = get_color_picker_elements();
log(colorPickerElementsList);
*/

async function _predict_mode_examples() {
	$("#handdrawn_img").hide();

	$("#webcam_in_cosmo").html("<span class='TRANSLATEME_camera_draw_self'></span> 📷").show();

	cosmo_predict_mode = "cam";

	$("#warnschild_oder_zurueck").html("<span class='TRANSLATEME_and_try_to_draw_a_warning_sign'></span>");

	$("#own_files").css("display", "none");
	$("#example_predictions").show();

	await update_translations();
	await fit_to_window();
}

async function _predict_mode_custom () {
	$("#handdrawn_img").show().parent().show();

	$("#webcam_in_cosmo").html(`
		<span style='pointer-events: none'><span class='TRANSLATEME_example_images'></span>
			<img height=20 src='traindata/signs/fire/116px-Fire_Class_B.svg.png' />
			<img height=20 src='traindata/signs/mandatory/120px-DIN_4844-2_D-M001.svg.png' />
			<img height=20 src='traindata/signs/prohibition/120px-DIN_4844-2_D-P001.svg.png' />
			<img height=20 src='traindata/signs/rescue/120px-DIN_4844-2_WSE001.svg.png' />
			<img height=20 src='traindata/signs/warning/120px-D-W002_Warning_orange.svg.png' />
		</span>
	`).show();

	$("#warnschild_oder_zurueck").html("<span class='TRANSLATEME_go_back_to_examples'></span>");
	cosmo_predict_mode = "examples";

	$("#own_files").css("display", "flex");
	$("#example_predictions").hide();

	await update_translations();
	await fit_to_window();
}

async function switch_predict_mode () {
	await add_cosmo_point("eigene_webcam");
	$("#webcam_in_cosmo").attr("data-clicked", "1");

	$("#webcam_in_cosmo").html(`
		<span style='pointer-events: none'><span class='TRANSLATEME_example_images'></span>
			<img height=20 src='traindata/signs/fire/116px-Fire_Class_B.svg.png' />
			<img height=20 src='traindata/signs/mandatory/120px-DIN_4844-2_D-M001.svg.png' />
			<img height=20 src='traindata/signs/prohibition/120px-DIN_4844-2_D-P001.svg.png' />
			<img height=20 src='traindata/signs/rescue/120px-DIN_4844-2_WSE001.svg.png' />
			<img height=20 src='traindata/signs/warning/120px-D-W002_Warning_orange.svg.png' />
		</span>
	`).show();

	var ret = "";

	var own_files_display = $("#own_files").css("display");

	var _show_examples = (own_files_display == "none") ? false : true;

	if(_show_examples) {
		await _predict_mode_examples();
		ret = "_predict_mode_examples();";
	} else {
		await _predict_mode_custom();
		ret = "_predict_mode_custom();";
	}

	await add_cosmo_point("toggled_webcam");

	await update_translations();

	return ret;
}

function parse_required_skills(str) {
	// Step 1: Split the input string into individual key-value pairs using regex
	var keyValuePairs = str.split(/,(?=\w+\[)/);

	var res = {};

	// Step 2: Parse each key-value pair to extract the key and values
	keyValuePairs.forEach(function (pair) {
		var match = pair.match(/^(\w+)\[(.*)\]$/);
		if (match) {
			var key = match[1];
			var values = match[2].split(",").map(Number);
			res[key] = values;
		}
	});

	return res;
}

function emergency_button () {
	window.location.href = window.location.href;
}

//const inputString = "bla[1,2,3]='hello',blubb[5,1]='asdf'";

function parse_text_for_item_cosmo_level (inputString) {
	// Initialize the result object
	const result = {};

	// Use regex to match the variable names and their values
	const regex = /(\w+)\[([\d,]+)\]='([^']+)'(,|$)/g;
	let match;

	while ((match = regex.exec(inputString)) !== null) {
		const varName = match[1];
		const indices = match[2].split(",").map(Number);
		const value = match[3];

		// Create nested objects based on the indices and values
		const nestedObj = {};
		indices.forEach(index => {
			nestedObj[index] = value;
		});

		// Assign the nested object to the variable in the result
		result[varName] = nestedObj;
	}

	return result;
}

async function set_text_for_elements_depending_on_cosmo_level () {
	$(".cosmo_autoset_text").each(async (i, e) => {
		var cosmo_level_text = $(e).attr("data-cosmo_level_text");
		if(cosmo_level_text) {
			var parsed = parse_text_for_item_cosmo_level(cosmo_level_text);

			for (var i = 0; i < Object.keys(parsed).length; i++) {
				var element_skill_name = Object.keys(parsed)[i];
				for (var j = 0; j < Object.keys(parsed[element_skill_name]).length; j++) {
					var element_skill_level = Object.keys(parsed[element_skill_name])[j];
					var element_skill_text = parsed[element_skill_name][element_skill_level];

					if(Object.keys(current_skills).includes(element_skill_name)) {
						if(parse_int(current_skills[element_skill_name]) == parse_int(element_skill_level)) {
							$(e).html(parsed[element_skill_name][element_skill_level]);
							await update_translations();
						}
					}
				}
			}
		}
	});
}

async function run_cosmo_milestones () {
	var _keys = Object.keys(cosmo_functions_at_milestones);
	for (var i = 0; i < _keys.length; i++) {
		var key = _keys[i];
		if(Object.keys(current_skills).includes(key)) {
			var key_keys = Object.keys(cosmo_functions_at_milestones[key]);
			for (var j = 0; j < key_keys.length; j++) {
				var fn = cosmo_functions_at_milestones[key][key_keys[j]];
				var required_level = key_keys[j];
				if(current_skills[key] == required_level) {
					var milestone_name = key + ":" + required_level;
					if(!Object.keys(ran_milestones).includes(milestone_name)) {
						if(typeof(fn) == "function") {
							await fn();
						} else {
							err("fn is not a function", fn);
						}

						ran_milestones[milestone_name] = 1;
					}
				}
			}
		}
	}
}

async function cosmo_set_labels () {
	original_labels.push(...labels);
	if(lang == "de") {
		cosmo_categories = [
			"Brandschutz",
			"Gebot",
			"Verbot",
			"Rettung",
			"Warnung"
		];
		labels = cosmo_categories;
		label_debug("cosmo_set_labels, lang de (labels, cosmo_categories)", labels);
	} else if(lang == "en") {
		cosmo_categories = [
			"Fire prevention",
			"Mandatory",
			"Prohibition",
			"Rescue",
			"Warning"
		];
		labels = cosmo_categories;
		label_debug("cosmo_set_labels, lang en (labels, cosmo_categories)", labels);
	} else {
		err("Unknown language: " + lang);
	}

	await repredict();
}

async function fit_to_window (_parent = window, _child = $("#maindiv")) {
	$(_child).css("width", "");

	var doc_height = $(_parent)[0].innerHeight;
	var doc_width = $(_parent)[0].innerWidth;
	doc_height -= $("#scads_logo_cosmo_mode").height();
	var maindiv_height = $(_child)[0].clientHeight;
	var maindiv_width = $(_child)[0].clientWidth;

	relationScale =  Math.min(doc_width / maindiv_width, doc_height / maindiv_height);

	$(_child).css("transform", "scale(" + relationScale + ")").css("width", (doc_width * (1/relationScale)) + "px");

	$(body).css("overflow", "hidden").css("backface-visibility", "hidden").css("-webkit-font-smoothing", "subpixel-antialiased");

	show_or_hide_logo();
}

async function click_next_button () {
	await train_neural_network();
	$("#next_button").attr("data-clicked", "1");
}

function do_images_overlap (imageId1, imageId2) {
	const image1 = document.getElementById(imageId1);
	const image2 = document.getElementById(imageId2);

	const rect1 = image1.getBoundingClientRect();
	const rect2 = image2.getBoundingClientRect();

	if(!rect1 || !rect2) {
		wrn("do_images_overlap has rect1 or rect2 empty! Did you manually remove the #ribbon_shower?");
		return false;
	}

	// Check for horizontal overlap
	const horizontalOverlap = rect1.left < rect2.right && rect1.right > rect2.left;

	// Check for vertical overlap
	const verticalOverlap = rect1.top < rect2.bottom && rect1.bottom > rect2.top;

	return horizontalOverlap && verticalOverlap;
}

function show_or_hide_logo () {
	var old_display = $("#scads_logo_cosmo_mode").css("display");
	var old_visibility = $("#scads_logo_cosmo_mode").css("visibility", "none");

	if(old_display == "none") {
		$("#scads_logo_cosmo_mode").css("visibility", "none");
		$("#scads_logo_cosmo_mode").show();
	}

	var shown = 0;
	if(do_images_overlap("scads_logo_cosmo_mode", "asanai_logo_cosmo")) {
		$("#scads_logo_cosmo_mode").hide();
	} else {
		$("#scads_logo_cosmo_mode").show();
		shown++;
	}

	if(old_display == "none") {
		$("#scads_logo_cosmo_mode").css("visibility", "inherit");
		if(!shown) {
			$("#scads_logo_cosmo_mode").hide();
		}
	}
}
