async function add_cosmo_point (name, show_manicule=1) {
	if(is_cosmo_mode) {
		if(!Object.keys(current_skills).includes(name)) {
			current_skills[name] = 1;
		} else {

			current_skills[name]++;
		}

		await show_cosmo_elements_depending_on_current_skills();

		cosmo_debugger();
	} else {
		current_skills = {};
	}


	if(is_cosmo_mode && show_manicule) {
		chose_next_manicule_target();
	}

	cosmo_debugger();
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
	constructor(e, imageUrl = "manicule.svg") {
		//logt("ManiC e:", e);

		remove_manicule(0);

		if(started_training) {
			return;
		}

		if(e) {
			var $e = $(e);

			if($e.data("no_manicule") == "1") {
				return;
			}

			manicule_element_xpath = get_element_xpath($e[0]);

			this.element = e;
			this.image = new Image();
			this.image.src = imageUrl;

			//log("Manicule Selector:", e);

			//var bottom_y = $e[0].getBoundingClientRect().y + $e[0].getBoundingClientRect().height

			this.image.style.position = 'absolute';
			this.image.style.display = 'block'; // changed to block so that the image is shown by default

			this.image.style.zIndex = 100000;

			this.hand_height = 70;
			this.hand_width = 35;

			var element_top = $e.offset()["top"];

			if($e.data("rotated")) {
				//log("$e", $e);
				var element_position_left = $e.offset()["left"] + ($e.width() / 2) - (this.hand_height / 2);
				if(element_position_left < 0) {
					element_position_left = Math.max(-parseInt(this.hand_width / 4), element_position_left);
				}

				//log("element_position_left", element_position_left);

				//log("$e.height():", $e.height());
				var element_height = $e.height();

				var final_top = element_top + element_height;
				//log(`final_top = element_top + element_height = ${final_top}`);
				//log(`final_top = ${element_top} + ${element_height} = ${final_top}`);

				this.image.style.top = `${final_top}px`;
				this.image.style.left = `${element_position_left}px`;
				this.image.style.height = `${this.hand_height}px`;
				this.image.src = "rotated_90_" + imageUrl;
			} else {
				var element_bounding_box_left = $e[0].getBoundingClientRect().x; // + $e[0].getBoundingClientRect().width
				var element_width = $e.width();

				var final_left = element_bounding_box_left + element_width;
				var final_element_top = element_top + 10;

				this.image.style.width = `${this.hand_height}px`;
				this.image.style.top =`${final_element_top}px`;
				this.image.style.left = `${final_left}px`;
			}

			this.image.classList.add('manicule');
			this.image.classList.add('invert_in_dark_mode');

			document.body.appendChild(this.image);

			if($e.data("rotated")) {
				this.moveAroundVertically();
			} else {
				this.moveAroundHorizontally();
			}

			manicule = this;

			invert_elements_in_dark_mode();

			var window_width = $(window).width();
			var window_height = $(window).height();

			var x_position_manicule_centered = $(this.image).offset()["left"] - (window_width / 2);
			var y_position_manicule_centered = $(this.image).offset()["top"] - (window_height / 2);

			window.scrollTo(x_position_manicule_centered, y_position_manicule_centered)
		} else {
			//log("Empty e");
		}

		cosmo_debugger();

		//console.trace();
	}

	moveAroundVertically () {
		// calculate the center point of the element
		var element_left = parseInt(this.image.style.left) + (parseInt(this.hand_width) / 10);
		var element_top = parseInt(this.image.style.top);

		assert(!isNaN(element_left), "element_left is not a number");
		assert(!isNaN(element_top), "element_top is not a number");

		// calculate the radius of the circle
		var radius = 20;

		// set up the animation
		this.image.style.animation = 'moveAroundVertically 2s linear infinite';
		this.image.style.animationName = 'moveAroundVertically';
		// define the keyframes for the animation
		var keyframes = `
			0% {
				left: ${element_left}px;
				top: ${element_top}px;
			}
			50% {
				left: ${element_left}px;
				top: ${element_top + radius}px;
			}
			100% {
				left: ${element_left}px;
				top: ${element_top}px;
			}
		`;

		// add the keyframes to a style sheet
		var styleSheet = document.getElementById('manicule_animation_css');
		styleSheet.innerHTML = `
			@keyframes moveAroundVertically {
				${keyframes}
			}
		`;
	}

	moveAroundHorizontally () {
		// calculate the center point of the element
		var element_left = parseInt(this.image.style.left) + parseInt(this.image.style.width) / 2;
		var element_top = parseInt(this.image.style.top);

		assert(!isNaN(element_left), "element_left is not a number");
		assert(!isNaN(element_top), "element_top is not a number");

		// calculate the radius of the circle
		var radius = 20;

		// set up the animation
		this.image.style.animation = 'moveAroundHorizontally 2s linear infinite';
		this.image.style.animationName = 'moveAroundHorizontally';
		// define the keyframes for the animation

		var keyframes = `
			0% {
				left: ${element_left}px;
				top: ${element_top}px;
			}
			50% {
				left: ${element_left + radius}px;
				top: ${element_top}px;
			}
			100% {
				left: ${element_left}px;
				top: ${element_top}px;
			}
		`;

		// add the keyframes to a style sheet
		var styleSheet = document.getElementById('manicule_animation_css');
		styleSheet.innerHTML = `
			@keyframes moveAroundHorizontally {
				${keyframes}
			}
		`;
	}

	hide() {
		this.image.style.display = 'none';
		cosmo_debugger();
	}
}



function chose_next_manicule_target () {
	var possible_indices = [];

	var cosmo = $(".cosmo");

	cosmo.each((i, x) => {
		var $x = $(x);
		if((!manicule || !manicule.element || get_element_xpath($x[0]) != get_element_xpath(manicule.element))) {
			if(!$x.data("clicked")) {
				var req = $x.data("required_skills");

				var req_full = {};

				if(typeof(req) == "string") {
					req_full = parse_required_skills(req);
				}

				var possible = true;
				for (var n = 0; n < Object.keys(req_full).length; n++) {
					var current_key = Object.keys(req_full)[n];

					var full_req_part_is_part_of_current_skills = Object.keys(current_skills).includes(current_key)
					if(!full_req_part_is_part_of_current_skills) {
						possible = false;
					} else {
						var current_skill_nr_matches_required_skill_number = current_skills[current_key] == req_full[current_key];

						if(!current_skill_nr_matches_required_skill_number) {
							possible = false;
						}
					}
				}

				if(possible) {
					possible_indices.push({"index": i, "length": Object.keys(req_full).length});
				}
			} else {
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
						possible_indices.push({"index": i, "length": Object.keys(show_again_full).length});
					}
				}
			}
		}
	});

	log("Possible indices:", possible_indices);

	if(possible_indices.length) {
		var possible_elements = [];
		for (var i = 0; i < possible_indices.length; i++) {
			var _i = possible_indices[i]["index"];
			var _l = possible_indices[i]["length"];
			if(cosmo[_i]) {
				$(cosmo[_i]).show();
				if(!$(cosmo[_i]).data("no_manicule")) {
					possible_elements.push(cosmo[_i]);
				}
			}
		}

		log(possible_elements);

		if(possible_elements.length) {
			var index_to_chose = possible_elements.length - 1;
			$(possible_elements[index_to_chose]).show();
			remove_manicule(0);
			new ManiC(possible_elements[index_to_chose]);
			$(possible_elements[0]).on("click", function () {
				$(this).attr("data-clicked", 1)
			});
		} else {
			log("No possible elements found for Manicule!");
			remove_manicule(0);
		}
	} else {
		log("No possible indices found for Manicule!");
		remove_manicule(0);
	}
}

async function cosmo_mode () {
	console.trace();
	if(is_cosmo_mode) {
		l("Exiting cosmo mode");
		setCookie("cosmo_mode", "0", 1);
		await show_layer_view();
		show_ribbon();
		//$("#show_layer_data").prop("checked", false)
		$("#show_hide_ribbon_button").show();
		$(".vis_button").show();
		$("#toggle_layer_view_button").show();
		$("#show_grad_cam").parent().show();
		$("#show_layer_data").parent().show();
		$("#navbar1").show();
		$(".navi_list").show();
		$("#hr_nav").show();
		//move_element_to_another_div($("#show_visualization_here_in_cosmo")[0], $("#layer_visualizations_tab")[0]);
		$("#upload_file").show();
		$("#repredict_examples_button").show();
		$("#download_data").show();
		is_cosmo_mode = false;

		new ManiC(null);

		await write_descriptions(1)

		if(idleInterval) {
			clearInterval(idleInterval);
			idleInterval = null;
		}

		if(manicule) {
			manicule.hide();
		}
	} else {
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

		$("#start_stop_training").show();

		add_cosmo_point("loaded_page");

		chose_next_manicule_target();

		function timerIncrement() {
			if(Object.keys(current_skills).length > 1) {
				idleTime = idleTime + 1;
				if (idleTime > reload_time) { // 10 minutes
					window.location.reload();
					location.reload();
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


		disable_everything_in_last_layer_enable_everyone_else_in_beginner_mode();

		runPresentation('cosmo_presentation');
	}

	$("#toggle_layers_button").hide();
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

var currentDivPresentationIndex = 0;

function runPresentation(divName) {
	if(done_presenting) {
		return;
	}

	is_presenting = true;

	var container = document.getElementById(divName);
	var divs = container.getElementsByTagName('div');

	// Function to display a div in full screen
	function showFullScreen(divs, currentDivPresentationIndex) {
		var div = divs[currentDivPresentationIndex];

		$(div).show();

		log("showFullScreen", div);
		div.style.width = '100%';
		div.style.height = '100%';
		div.style.position = 'fixed';
		div.style.top = '0';
		div.style.left = '0';
		div.style.zIndex = '9999';
		document.body.style.overflow = 'hidden';

		addScrollButtons(currentDivPresentationIndex, divs.length);
	}

	// Function to remove full screen styles
	function removeFullScreen(divs, currentDivPresentationIndex) {
		var div = divs[currentDivPresentationIndex];
		div.style.width = '';
		div.style.height = '';
		div.style.position = '';
		div.style.top = '';
		div.style.left = '';
		div.style.zIndex = '';
		document.body.style.overflow = '';
	}

	// Function to handle scrolling left or right
	function handleScroll(event) {
		var delta = Math.sign(event.deltaY || event.wheelDelta);
		if (delta > 0) {
			showNextDiv();
		} else if (delta < 0) {
			showPreviousDiv();
		}
	}

	function addScrollLeftButton () {
		$("#scroll_left").remove();
		$("#body").append("<span onclick='showPreviousDiv()' class='next_prev_buttons' id='scroll_left'>LEFT</span>");
	}

	function addScrollRightButton () {
		$("#scroll_right").remove();
		$("#body").append("<span onclick='showNextDiv()' class='next_prev_buttons' id='scroll_right'>RIGHT</span>");
	}

	function addScrollButtons (currentDivPresentationIndex, maxIndex) {
		if(currentDivPresentationIndex <= 0) {
			$("#scroll_left").remove();
		} else {
			addScrollLeftButton();
		}
		
		if(currentDivPresentationIndex >= maxIndex) {
			$("#scroll_right").remove();
		} else {
			addScrollRightButton();
		}
	}

	// Function to show the next div
	function showNextDiv() {
		if (currentDivPresentationIndex < divs.length - 1) {
			removeFullScreen(divs, currentDivPresentationIndex);
			currentDivPresentationIndex++;
			showFullScreen(divs, currentDivPresentationIndex);
		} else {
			endPresentation();
		}
	}

	// Function to show the previous div
	function showPreviousDiv() {
		if (currentDivPresentationIndex > 0) {
			removeFullScreen(divs, currentDivPresentationIndex);
			currentDivPresentationIndex--;
			showFullScreen(divs, currentDivPresentationIndex);
		}
	}

	// Function to handle touch events for swiping
	function handleTouch(event) {
		var x = event.touches[0].clientX;
		var deltaX = x - startX;

		if (deltaX > 0 && currentDivPresentationIndex > 0) {
			showPreviousDiv();
		} else if (deltaX < 0 && currentDivPresentationIndex < divs.length - 1) {
			showNextDiv();
		}
	}

	// Function to handle touch start event
	function handleTouchStart(event) {
		startX = event.touches[0].clientX;
	}

	// Function to handle touch end event
	function handleTouchEnd(event) {
		startX = null;
	}

	// Function to end the presentation
	function endPresentation() {
		removeFullScreen(divs, currentDivPresentationIndex);
		document.removeEventListener('wheel', handleScroll);
		document.removeEventListener('touchstart', handleTouchStart);
		document.removeEventListener('touchmove', handleTouch);
		document.removeEventListener('touchend', handleTouchEnd);
		log("removing", $("#" + divName));
		$("#" + divName).remove();
		$(".next_prev_buttons").remove();
		if(!Object.keys(current_skills).includes("watched_presentation")) {
			add_cosmo_point('watched_presentation');
		}

		done_presenting = true;
	}

	// Add event listeners for scrolling and touch events
	document.addEventListener('wheel', handleScroll);
	document.addEventListener('touchstart', handleTouchStart);
	document.addEventListener('touchmove', handleTouch);
	document.addEventListener('touchend', handleTouchEnd);

	// Function to handle keydown events
	function handleKeydown(event) {
		if(done_presenting || !is_presenting) {
			return;
		}

		switch (event.keyCode) {
			case 37: // Left arrow key
				showPreviousDiv();
				break;
			case 39: // Right arrow key
				showNextDiv();
				break;
			case 37: // LEFT key
				showPreviousDiv();
				break;
			case 39: // RIGHT key
				showNextDiv();
				break;
		}
	}

	// Add event listener for keydown events
	document.addEventListener('keydown', handleKeydown);

	// Start the presentation
	showFullScreen(divs, currentDivPresentationIndex);
}
