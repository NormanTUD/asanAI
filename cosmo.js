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
			chose_next_manicule_target();
		}

		if(name == "eigene_webcam") {
			/*
			chose_next_manicule_target = function () {
				log("Hack to get infinite loop...");
			}
			*/
		}
	} else {
		current_skills = {};
	}

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
					if(manicule === null) {
						new ManiC(elements[i]);
					} else {
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
			console.warn("ELEMENT HAS NO REQUIRED SKILLS, YET IS IN COSMO CLASS:", elements[i]);
		}
	}

	if(Object.keys(current_skills).includes("finished_training") && current_skills["finished_training"] >= 3) {
		await fireworks_and_reload(0);
	}
}

function remove_manicule (remove=1) {
	log("Removing manicule");
	if(typeof(manicule) == "object" && manicule !== null && remove && Object.keys(manicule).includes("element")) {
		last_manually_removed_manicule_element = manicule.element;
		if(!$(manicule.element).data("keep_cosmo")) {
			$(manicule.element).removeClass("cosmo");
		}
	}
	$(".manicule").remove();
	manicule = null;
}




let checkSubset = (parentArray, subsetArray) => {
	return subsetArray.every((el) => {
		return parentArray.includes(el)
	})
}

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

class ManiC {
	constructor(e, imageUrl = "next.svg") {
		//logt("ManiC e:", e);

		remove_manicule(0);

		if(started_training) {
			log("Training started");
			return;
		}

		if(e) {
			var $e = $(e);

			if($e.data("no_manicule") == "1") {
				return;
			}

			if(is_hidden_or_has_hidden_parent($e)) {
				return;
			}

			if(is_presenting) {
				return;
			}

			manicule_element_xpath = get_element_xpath($e[0]);

			this.element = e;
			this.image = new Image();
			this.image.src = imageUrl;

			//log("Manicule Selector:", e);

			//var bottom_y = $e[0].getBoundingClientRect().top + $e[0].getBoundingClientRect().height

			this.image.style.position = 'absolute';
			this.image.style.display = 'block'; // changed to block so that the image is shown by default

			this.image.style.zIndex = 100000;

			this.hand_height = 50;
			this.hand_width = 50;

			var largest_element = findLargestElementWithCoordinates(this.element)
			var real_x = largest_element["x"];
			var real_h = largest_element["y"];
			var real_top = largest_element["top"];
			var real_bottom = largest_element["bottom"];
			var real_left = largest_element["left"];
			var real_right = largest_element["right"];

			var assertion_test = real_x !== undefined || real_h !== undefined || real_top !== undefined || real_bottom !== undefined;
			if(!assertion_test) {
				console.log("ERROR. largest_element empty:", largest_element);
			}
			assert(assertion_test, "Could not get largest element, see Logs");

			var element_bounding_box_left = $e[0].getBoundingClientRect().left; // + $e[0].getBoundingClientRect().width
			var element_width = $e.width();
			//var {element_width, real_h} = findLargestWidthAndHeight(this.element)


			if(largest_element["width"] > element_width) { element_width = largest_element["width"]; }
			//if(largest_element["height"] > element_height) { element_height = largest_element["height"]; }



			var final_left = element_bounding_box_left + real_x;

			this.image.style.width = `${this.hand_height}px`;
			if(real_top) {
				this.image.top =`${real_top}px`;
			}

			this.image.left = `${final_left}px`;

			this.image.classList.add('manicule');
			this.image.classList.add('invert_in_dark_mode');

			document.body.appendChild(this.image);

			this.moveAroundLeftRight();

			manicule = this;

			invert_elements_in_dark_mode();

			var window_width = $(window).width();
			var window_height = $(window).height();

			var x_position_manicule_centered = $(this.image).offset()["left"] - (window_width / 2);
			var y_position_manicule_centered = $(this.image).offset()["top"] - (window_height / 2);

			window.scrollTo(x_position_manicule_centered, y_position_manicule_centered)
		} else {
			log("Empty e");
		}

		cosmo_debugger();

		//console.trace();
	}

	getPos(el) {
		assert(!!el, "el is empty")
	
		//log(el);
		if(el) {
			var rect = el.getBoundingClientRect();
			return rect;
		} else {
			log(el);
			throw new Error('el was empty');
		}
	}

	moveAroundLeftRight () {
		var width = this.getPos(this.element).width;

		var largest_element = findLargestElementWithCoordinates(this.element)
		var real_x = largest_element["x"];
		var real_y = largest_element["y"];
		var real_top = largest_element["top"];
		var real_bottom = largest_element["bottom"];
		var real_left = largest_element["left"];
		var real_right = largest_element["right"];
		var real_width = largest_element["width"];

		var position_switch = $(this.element).attr("data-position");
		var correction_shift = 0;
		var position;

		if(position_switch == "fixed") {
			position = "fixed";
			if(real_width) {
				correction_shift = -real_width;
			}
		} else {
			position = "absolute";
		}

		var element_left = parseInt(real_left + correction_shift);

		assert(!isNaN(element_left), "element_left is not a number");
		assert(!isNaN(real_x) || !isNaN(real_y) || !isNaN(real_width), "neither real_x nor real_y nor real_width is not a number");

		// calculate the radius of the circle
		var radius = 20;

		// set up the animation
		$(this.image).css("pointer-events", "none");
		this.image.style.animation = 'moveAroundLeftRight 2s linear infinite';
		this.image.style.animationName = 'moveAroundLeftRight';
		// define the keyframes for the animation
		

		var keyframes = `
			0% {
				position: ${position};
				transform: translateX(0px);
			}
			25% {
				position: ${position};
				transform: translateX(${radius}px);
			}
			50 % {
				position: ${position};
				transform: translateX(-${radius}px);
			}
			100% {
				position: ${position};
				transform: translateX(0px);
			}
		`;

		log(keyframes);

		// add the keyframes to a style sheet
		var styleSheet = document.getElementById('manicule_animation_css');
		styleSheet.innerHTML = `
			@keyframes moveAroundLeftRight {
				${keyframes}
			}
		`;

		$(".manicule").css("left", element_left);

		if (!isNaN(real_bottom)) {
			$(".manicule").css("bottom", real_bottom);
		}

		if(!isNaN(real_top) && isNaN(real_top)) {
			$(".manicule").css("top", real_top);
		}
	}

	hide() {
		this.image.style.display = 'none';
		cosmo_debugger();
	}
}

function findLargestElementWithCoordinates(element) {
	// Get the bounding rectangle of the current element
	const rect = element.getBoundingClientRect();
	let maxWidth = rect.width;
	let maxHeight = rect.height;
	let x = null;
	let y = null;
	let largestElement = element;
	let left = null;
	let right = null;

	// Traverse through all child elements recursively
	for (const childElement of element.children) {
		const { width, height, largestChild } = findLargestElementWithCoordinates(childElement);

		// Update the maximum width, height, and largestElement if necessary
		if (width > maxWidth || height > maxHeight) {
			maxWidth = Math.max(maxWidth, width);
			maxHeight = Math.max(maxHeight, height);
			largestElement = largestChild;
			x = childElement.getBoundingClientRect()["x"];
			y = childElement.getBoundingClientRect()["x"];
			left = childElement.getBoundingClientRect()["left"];
			right = childElement.getBoundingClientRect()["right"];
		}
	}

	return { width: maxWidth, height: maxHeight, largestChild: largestElement, x: x, y: y, left: left, right: right };
}

function find_unclicked_items ($x, possible_items) {
	var req = $x.data("required_skills");

	var req_full = {};

	if(typeof(req) == "string") {
		req_full = parse_required_skills(req);
	}
	
	var possible = true;
	//log(">>>>>>>>>>>>>>> TESTING: ", $x);
	for (var n = 0; n < Object.keys(req_full).length; n++) {
		var current_skill = Object.keys(req_full)[n];
		var current_element_skill_level = req_full[Object.keys(req_full)[n]];
		var full_req_part_is_part_of_current_skills = Object.keys(current_skills).includes(current_skill);
		var current_user_skill = current_skills[current_skill];
		var required_nrs = req_full[current_skill];

		var allows_zero = current_element_skill_level.includes(0);

		if(!full_req_part_is_part_of_current_skills) {
			// because it has the value 0:
			var is_not_in_current_skill = !Object.keys(current_skills).includes(current_skill);
			if(is_not_in_current_skill) {
				current_user_skill = 0;	
			}
			var is_possible = (current_element_skill_level == 0 || allows_zero) || current_element_skill_level.includes(current_user_skill);

			if(!is_possible) {
				//if(get_element_xpath($x[0]).includes("start_stop_training")) {

					//log("!!!! FALSE: ", "$x:", $x, "full_req_part_is_part_of_current_skills:", full_req_part_is_part_of_current_skills, "current_user_skill:", current_user_skill, "allows_zero:", allows_zero, "current_element_skill_level:", current_element_skill_level, "is_possible:", is_possible, "<<<<<<<<<<<<<<<<<<<<<<<<<<<<");
				//}
				possible = false;
			}
		} else {
			var current_element_skill_level_matches_required_skill_number = required_nrs.every(val => current_element_skill_level.includes(val));

			if(!current_element_skill_level_matches_required_skill_number) {
				log("XXX");
				possible = false;
			}
		}

		/*
		log("===================================")
		console.log("Element with index", i);
		console.log("req_full:", req_full);
		console.log("show_again_full:", show_again_full);
		console.log("current_skills:", current_skills);
		console.log("current_skill:", current_skill);
		console.log("current_element_skill_level:", current_element_skill_level);
		console.log("current_user_skill:", current_user_skill);
		console.log("required_nrs:", required_nrs);
		console.log("allows_zero:", allows_zero);
		console.log("is_possible:", is_possible);
		log("possible:", possible);
		if(!possible) {
			log("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!");
		}
		log("===================================")
		*/
	}

	if(possible) {
		possible_items.push({"item": $x, "length": Object.keys(req_full).length});

		//log("!!!! TRUE: ", "$x:", $x, "full_req_part_is_part_of_current_skills:", full_req_part_is_part_of_current_skills, "current_user_skill:", current_user_skill, "allows_zero:", allows_zero, "current_element_skill_level:", current_element_skill_level, "is_possible:", is_possible, "<<<<<<<<<<<<<<<<<<<<<<<<<<<<");
	}

	return possible_items;
}

function chose_next_manicule_target () {
	var possible_items = [];

	var cosmo = $(".cosmo");

	cosmo.each((i, x) => {
		var $x = $(x);
		if((!manicule || !manicule.element || get_element_xpath($x[0]) != get_element_xpath(manicule.element))) {
			if(!$x.data("clicked")) {
				possible_items = find_unclicked_items($x, possible_items);
				//log("unclicked items:", possible_items);
			} else {
				possible_items = show_again_when_new_skill_acquired($x, possible_items);
				//log("unclicked + show again items:", possible_items);
			}
		}
	});

	//log("Possible indices:", possible_items);

	if(!possible_items.length) {
		//log("POSSIBLE ITEMS WERE EMPTY", possible_items, possible_items.length);
		remove_manicule(0);
		log("No possible indices found for Manicule!");
		return;
	}

	var possible_elements = [];
	for (var i = 0; i < possible_items.length; i++) {
		var _i = possible_items[i]["item"];
		var _l = possible_items[i]["length"];
		if(_i) {
			$(_i).show();
			if(!$(_i).data("no_manicule")) {
				possible_elements.push(_i[0]);
			}
		}
	}

	//log(possible_elements);

	var index_to_chose = possible_elements.length - 1;
	$(possible_elements[index_to_chose]).show();
	//log("Chosing ", possible_elements[index_to_chose]);
	remove_manicule(0);
	var chosen_element = possible_elements[index_to_chose];
	new ManiC(chosen_element);
	$(possible_elements[0]).on("click", function () {
		$(this).attr("data-clicked", 1)
	});

	set_text_for_elements_depending_on_cosmo_level();
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

function isMouseOverElement(className) {
	const elements = document.getElementsByClassName(className);

	if(mouseX == -1 || mouseY == -1) {
		if(is_cosmo_mode) {
			console.warn("No mouse movement detected yet");
		} else {
			console.warn("isMouseOverElement: not in cosmo mode, returning false.");
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

function isMouseOverElementVariables(elements) {
  if (mouseX === -1 || mouseY === -1) {
    if (is_cosmo_mode) {
      console.warn("No mouse movement detected yet");
    } else {
      console.warn("isMouseOverElementVariables: not in cosmo mode, returning false.");
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
	setCookie("cosmo_mode", "1", 365);
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
	if(!disable_alexnet) {
		$("#alexnet_tab_label").click();
	}
	//move_element_to_another_div($("#layer_visualizations_tab")[0], $("#show_visualization_here_in_cosmo")[0]);
	is_cosmo_mode = true;

	await add_cosmo_point("loaded_page");

	function timerIncrement() {
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
		idleInterval = setInterval(timerIncrement, 1000); // 1 sekunde

		// Zero the idle timer on mouse movement.
		$(this).mousemove(function (e) {
			idleTime = 0;
		});

		$(this).keypress(function (e) {
			idleTime = 0;
		});
	});


	document.addEventListener('mousemove', (event) => {
		mouseX = event.clientX;
		mouseY = event.clientY;
	});

	disable_everything_in_last_layer_enable_everyone_else_in_beginner_mode();

	$(".show_only_in_cosmo_mode").show();

	runPresentation('cosmo_presentation');

	$(".glass_box").css("border", "none");
	$(".glass_box").css("box-shadow", "none");
	$("#body").css("text-align", "center");

	const colorPickerContainer = document.querySelector("div[style*='width: 239px'][style*='height: 129px']");

	// To make the entire document unselectable
	document.documentElement.style.userSelect = 'none';

	// To make a specific element with ID "body" unselectable
	var bodyElement = document.getElementById('body');
	bodyElement.style.userSelect = 'none';

	addBackgroundGradient();

	$("#toggle_layers_button").hide();
	$("#show_webcam_button").hide()

	$("#max_activation_iterations").val(50)

	$("#show_webcam_button").css("visibility", "hidden");
	//$("#start_stop_training").show().css("display", "initial");
	$("#custom_webcam_training_data").hide();

	$("#side_by_side_container").css("padding-top", "70px");

	$("#emergency_button").show();

	window.setInterval(function () {
		if(!is_presenting && (manicule === null || manicule === undefined)) {
			chose_next_manicule_target();
		}
	}, 1000);

}

function findColorPickerContainer(element) {
	// Traverse up the DOM until a color picker container is found
	while (element && !isColorPickerContainer(element)) {
		element = element.parentElement;
	}
	return element;
}

function isColorPickerContainer(element) {
	// Modify this check based on specific properties or elements of your color picker
	// For example, you can check if the element has a specific set of child elements or CSS properties unique to the color picker.
	// This is just a simple example, and you may need to adjust it based on your actual color picker's structure.
	return element.style.zIndex === "1000" && element.style.position === "absolute";
}

function isInsideColorPicker(x, y, colorPickerContainer) {
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
	//console.log("clicked anywhere in cosmo mode!");
	if(manicule) {
		 $(manicule.element).click()
	} else {
		console.warn("No manicule element found...");
	}
}

function addBackgroundGradient() {
	var body = document.querySelector("body");
	var from = "d3e4f3";
	var to = "ffffff";
	body.style.background = `linear-gradient(to bottom, #${from} 0%, #${to} 100%)`;
}

function findColorPickerElements(node, colorPickerElements) {
	if (!node) return;

	// Check if the current node resembles the structure of the color picker base div
	if (
		node.style &&
		node.style.position === 'absolute' &&
		node.style.width === '239px' &&
		node.style.height === '129px' &&
		node.style.zIndex === '1000'
	) {
		colorPickerElements.push(node);
	}

	// Recursively check child nodes
	for (const child of node.children) {
		findColorPickerElements(child, colorPickerElements);
	}
}

function getColorPickerElements() {
	const colorPickerElements = [];
	findColorPickerElements(document.body, colorPickerElements);
	return colorPickerElements;
}

/*
// Get the list of all color picker base div elements available on the current page
var colorPickerElementsList = getColorPickerElements();
console.log(colorPickerElementsList);
*/

function switch_predict_mode () {
	add_cosmo_point("eigene_webcam");
	$("#webcam_in_cosmo").attr("data-clicked", "1");
	if($("#own_files").css("display") == "none") {
		$("#own_files").show();
		$("#own_files").css("display", "inline-block");
		$("#example_predictions").hide();

		$("#webcam_in_cosmo").html(`<span style='pointer-events: none'>Beispielbilder
			<img height=32 src='traindata/signs//warning/120px-D-W002_Warning_orange.svg.png'>
			<img height=32 src='traindata/signs//rescue/120px-DIN_4844-2_WSE001.svg.png'>
			<img height=32 src='traindata/signs//prohibition/120px-DIN_4844-2_D-P001.svg.png'>
			<img height=32 src='traindata/signs//mandatory/120px-DIN_4844-2_D-M001.svg.png'>
			<img height=32 src='traindata/signs//fire/116px-Fire_Class_B.svg.png'>
			</span>
		`);
	} else {
		$("#own_files").hide();
		$("#own_files").css("display", "none");
		$("#example_predictions").show();

		$("#webcam_in_cosmo").html("Kamera 📷");
	}

	add_cosmo_point("toggled_webcam");
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
			var values = match[2].split(',').map(Number);
			res[key] = values;
		}
	});

	return res;
}

function emergency_button () {
	window.location.href = window.location.href;
}

/*
function switch_to_lenet_example () {
	show_tab_label("training_data_tab", 1)
	add_cosmo_point("seen_lenet");
}

function switch_to_lenet_example () {
	show_tab_label("lenet_cosmo_tab", 1)
	add_cosmo_point("back_at_home");
	current_skills["back_at_home"] = 1;
}
*/

//const inputString = "bla[1,2,3]='hello',blubb[5,1]='asdf'";

function parse_text_for_item_cosmo_level (inputString) {
	// Initialize the result object
	const result = {};

	// Use regex to match the variable names and their values
	const regex = /(\w+)\[([\d,]+)\]='([^']+)'(,|$)/g;
	let match;

	while ((match = regex.exec(inputString)) !== null) {
		const varName = match[1];
		const indices = match[2].split(',').map(Number);
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

function set_text_for_elements_depending_on_cosmo_level () {
	$(".cosmo_autoset_text").each((i, e) => {
		var cosmo_level_text = $(e).attr("data-cosmo_level_text");
		if(cosmo_level_text) {
			var parsed = parse_text_for_item_cosmo_level(cosmo_level_text);

			for (var i = 0; i < Object.keys(parsed).length; i++) {
				var element_skill_name = Object.keys(parsed)[i];
				for (var j = 0; j < Object.keys(parsed[element_skill_name]).length; j++) {
					var element_skill_level = Object.keys(parsed[element_skill_name])[j];
					var element_skill_text = parsed[element_skill_name][element_skill_level];

					if(Object.keys(current_skills).includes(element_skill_name)) {
						if(parseInt(current_skills[element_skill_name]) == parseInt(element_skill_level)) {
							$(e).html(parsed[element_skill_name][element_skill_level]);
						}
					}
				}
			}
		}
	});
}
