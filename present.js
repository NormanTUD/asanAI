var divName = "";
var currentDivPresentationIndex = 0;
var divs = [];

// Function to handle keydown events
async function handle_keydown(event) {
	if (event.key === "ArrowLeft" || event.key === "Left") {
		await show_previous_div();
	} else if (event.key === "ArrowRight" || event.key === "Right" || event.key === " ") {
		await show_next_div();
	}
}

// Function to display a div in full screen
async function show_fullscreen(divs, currentDivPresentationIndex) {
	var div = divs[currentDivPresentationIndex];

	$(div).show();

	div.style.width = "100%";
	div.style.height = "100%";
	div.style.position = "fixed";
	div.style.top = "0";
	div.style.left = "0";
	div.style.zIndex = "9999";
	document.body.style.overflow = "hidden";

	add_scroll_buttons(currentDivPresentationIndex, divs.length);
	await add_end_presentation_button();

	$($(".slide")[currentDivPresentationIndex]).focus();

	$("#presentation_site_nr").remove();

	$("#body").append(
		`<div id='presentation_site_nr' style='display: none; z-index: 1000000; position: fixed; bottom: 0; left: 50%; right: 50%;'>${currentDivPresentationIndex + 1}/${divs.length}</div>`
	);

	if(finished_loading) {
		$("#presentation_site_nr").show();
	}

	if(!is_presenting) {
		$("#presentation_site_nr").remove();
	}
}

// Function to remove full screen styles
function remove_full_screen(divs, currentDivPresentationIndex) {
	var div = divs[currentDivPresentationIndex];
	div.style.width = "";
	div.style.height = "";
	div.style.position = "";
	div.style.top = "";
	div.style.left = "";
	div.style.zIndex = "";
	document.body.style.overflow = "";

	$("#lenet_example_cosmo").show();
}

// Function to handle scrolling left or right
async function handle_scroll(event) {
	$(".remove_me_at_first_tip").remove();
	var delta = Math.sign(event.deltaY || event.wheelDelta);
	if (delta > 0) {
		await show_next_div();
	} else if (delta < 0) {
		await show_previous_div();
	}
}

// Function to add the "go left" button
function add_scroll_left_button () {
	$("#scroll_left").remove();
	$("#body").append("<span onclick='show_previous_div()' class='next_prev_buttons' id='scroll_left'>&#12296;</span>");
}

// Function to add the "go right" button
function add_scroll_right_button () {
	$("#scroll_right").remove();
	$("#body").append("<span onclick='show_next_div()' class='next_prev_buttons' id='scroll_right'>&#12297;</span>");
}

async function add_end_presentation_button (force=0) {
	$("#skip_presentation_button").remove();
	if((finished_loading && is_presenting) || force) {
		var new_element = $(`
			<span onclick='end_presentation();$(this).remove()' id='skip_presentation_button'>
				SKIP
			</span>
		`);
		$("body").append(new_element);
		await update_translations();
	}
}

// Function to add or remove the scroll buttons
function add_scroll_buttons(currentDivPresentationIndex, maxIndex) {
	if (done_presenting || !finished_loading) {
		$("#scroll_left").remove();
		$("#scroll_right").remove();
		return;
	}

	if (currentDivPresentationIndex <= 0) {
		$("#scroll_left").remove();
	} else {
		add_scroll_left_button();
	}

	if (currentDivPresentationIndex >= maxIndex - 1) {
		$("#scroll_right").remove();
	} else {
		add_scroll_right_button();
	}
}

// Function to show the next div
async function show_next_div () {
	$(".remove_me_at_first_tip").remove();
	if (currentDivPresentationIndex < divs.length - 1) {
		remove_full_screen(divs, currentDivPresentationIndex);
		currentDivPresentationIndex++;
		await show_fullscreen(divs, currentDivPresentationIndex);
		divs[currentDivPresentationIndex].focus(); // Focus on the current slide
	} else {
		$("#skip_presentation_button").remove();
		await end_presentation();
	}

	await add_end_presentation_button();
}

// Function to show the previous div
async function show_previous_div() {
	$(".remove_me_at_first_tip").remove();
	if (currentDivPresentationIndex > 0) {
		remove_full_screen(divs, currentDivPresentationIndex);
		currentDivPresentationIndex--;
		await show_fullscreen(divs, currentDivPresentationIndex);
		divs[currentDivPresentationIndex].focus(); // Focus on the current slide
	}

	await add_end_presentation_button();
}

// Function to handle touch events for swiping
async function handle_touch(event) {
	$(".remove_me_at_first_tip").remove();
	var x = event.touches[0].clientX;
	var deltaX = x - startX;

	if (deltaX > 0 && currentDivPresentationIndex > 0) {
		await show_previous_div();
	} else if (deltaX < 0 && currentDivPresentationIndex < divs.length - 1) {
		await show_next_div();
	}
}

// Function to handle touch start event
function handle_touch_start(event) {
	$(".remove_me_at_first_tip").remove();
	startX = event.touches[0].clientX;
}

// Function to handle touch end event
function handle_touch_end(event) {
	startX = null;
}

// Function to end the presentation
async function end_presentation() {
	$(".remove_me_at_first_tip").remove();
	$("#skip_presentation_button").remove();

	if (done_presenting) {
		return;
	}

	if (!is_presenting) {
		log("Not ending presentation because seemingly it has already ended");
		return;
	}

	if (!Object.keys(current_skills).includes("watched_presentation")) {
		await add_cosmo_point("watched_presentation", 1);
	}

	remove_full_screen(divs, currentDivPresentationIndex);
	is_presenting = false;
	done_presenting = true;

	document.removeEventListener("wheel", handle_scroll);
	document.removeEventListener("touchstart", handle_touch_start);
	document.removeEventListener("touchmove", handle_touch);
	document.removeEventListener("touchend", handle_touch_end);
	//log("removing presentation", $("#" + divName));
	$("#" + divName).remove();
	$(".next_prev_buttons").remove();
	$("#presentation_site_nr").remove();

	$("#scads_logo_cosmo_mode").show();
	$("#asanai_logo_cosmo").show();
	$("#graphs_here").css("margin-top", "30px");

	await chose_next_manicule_target();

	$("#skip_presentation_button").remove();

	$("#set_german_language").show();
	$("#set_english_language").show();
}

// Function to run the presentation
async function run_presentation(dn) {
	divName = dn;
	if (done_presenting) {
		return;
	}

	is_presenting = true;

	var container = document.getElementById(divName);
	divs = container.getElementsByTagName("div");

	// Add event listeners for scrolling and touch events
	document.addEventListener("wheel", handle_scroll);
	document.addEventListener("touchstart", handle_touch_start);
	document.addEventListener("touchmove", handle_touch);
	document.addEventListener("touchend", handle_touch_end);

	// Add event listener for keydown events
	document.addEventListener("keydown", handle_keydown);

	// Start the presentation
	await show_fullscreen(divs, currentDivPresentationIndex);

	// Add event listener for click events
	document.addEventListener("click", handle_click);
}

// Function to handle click events during presentation
async function handle_click(event) {
	if (event.target.id === "scroll_right") {
		return; // Do not advance to the next page
	}

	if (event.target.id === "scroll_left") {
		return; // Do not advance to the next page
	}

	if (event.target.id === "set_german_language") {
		return; // Do not advance to the next page
	}

	if (event.target.id === "set_english_language") {
		return; // Do not advance to the next page
	}

	// Clicked anywhere else, show the next slide
	await show_next_div();
}
