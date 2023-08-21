var divName = "";
var currentDivPresentationIndex = 0;
var divs = [];

// Function to handle keydown events
async function handleKeydown(event) {
	if (event.key === "ArrowLeft" || event.key === "Left") {
		showPreviousDiv();
	} else if (event.key === "ArrowRight" || event.key === "Right" || event.key === " ") {
		await showNextDiv();
	}
}

// Function to display a div in full screen
function showFullScreen(divs, currentDivPresentationIndex) {
	var div = divs[currentDivPresentationIndex];

	$(div).show();

	div.style.width = "100%";
	div.style.height = "100%";
	div.style.position = "fixed";
	div.style.top = "0";
	div.style.left = "0";
	div.style.zIndex = "9999";
	document.body.style.overflow = "hidden";

	addScrollButtons(currentDivPresentationIndex, divs.length);
	addEndPresentationButton();

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
function removeFullScreen(divs, currentDivPresentationIndex) {
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
async function handleScroll(event) {
	var delta = Math.sign(event.deltaY || event.wheelDelta);
	if (delta > 0) {
		await showNextDiv();
	} else if (delta < 0) {
		showPreviousDiv();
	}
}

// Function to add the "go left" button
function addScrollLeftButton() {
	$("#scroll_left").remove();
	$("#body").append("<span onclick='showPreviousDiv()' class='next_prev_buttons' id='scroll_left'>&#12296;</span>");
}

// Function to add the "go right" button
function addScrollRightButton() {
	$("#scroll_right").remove();
	$("#body").append("<span onclick='showNextDiv()' class='next_prev_buttons' id='scroll_right'>&#12297;</span>");
}

function addEndPresentationButton (force=0) {
	$("#skip_presentation_button").remove();
	if((finished_loading && is_presenting) || force) {
		var new_element = $("<span onclick='endPresentation();$(this).remove()' id='skip_presentation_button' class=TRANSLATEME_skip_presentation></span>");
		$("body").append(new_element)
		updateTranslations();
	}
}

// Function to add or remove the scroll buttons
function addScrollButtons(currentDivPresentationIndex, maxIndex) {
	if (done_presenting || !finished_loading) {
		$("#scroll_left").remove();
		$("#scroll_right").remove();
		return;
	}

	if (currentDivPresentationIndex <= 0) {
		$("#scroll_left").remove();
	} else {
		addScrollLeftButton();
	}

	if (currentDivPresentationIndex >= maxIndex - 1) {
		$("#scroll_right").remove();
	} else {
		addScrollRightButton();
	}
}

// Function to show the next div
async function showNextDiv() {
	if (currentDivPresentationIndex < divs.length - 1) {
		removeFullScreen(divs, currentDivPresentationIndex);
		currentDivPresentationIndex++;
		showFullScreen(divs, currentDivPresentationIndex);
		divs[currentDivPresentationIndex].focus(); // Focus on the current slide
	} else {
		$("#skip_presentation_button").remove();
		await endPresentation();
	}

	addEndPresentationButton();
}

// Function to show the previous div
function showPreviousDiv() {
	if (currentDivPresentationIndex > 0) {
		removeFullScreen(divs, currentDivPresentationIndex);
		currentDivPresentationIndex--;
		showFullScreen(divs, currentDivPresentationIndex);
		divs[currentDivPresentationIndex].focus(); // Focus on the current slide
	}

	addEndPresentationButton();
}

// Function to handle touch events for swiping
async function handleTouch(event) {
	var x = event.touches[0].clientX;
	var deltaX = x - startX;

	if (deltaX > 0 && currentDivPresentationIndex > 0) {
		showPreviousDiv();
	} else if (deltaX < 0 && currentDivPresentationIndex < divs.length - 1) {
		await showNextDiv();
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
async function endPresentation() {
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

	removeFullScreen(divs, currentDivPresentationIndex);
	is_presenting = false;
	done_presenting = true;

	document.removeEventListener("wheel", handleScroll);
	document.removeEventListener("touchstart", handleTouchStart);
	document.removeEventListener("touchmove", handleTouch);
	document.removeEventListener("touchend", handleTouchEnd);
	//log("removing presentation", $("#" + divName));
	$("#" + divName).remove();
	$(".next_prev_buttons").remove();
	$("#presentation_site_nr").remove();
	attach_listener_for_cosmo_outside_click();

	$("#scads_logo_cosmo_mode").show();
	$("#asanai_logo_cosmo").show();
	$("#graphs_here").css("margin-top", "30px");

	chose_next_manicule_target();

	$("#skip_presentation_button").remove();
}

function attach_listener_for_cosmo_outside_click () {
	// Attach event listener to the document or a specific parent element
	document.addEventListener("click", function (event) {
		// Get the color picker element based on its unique structure and properties
		const colorPickerContainer = findColorPickerContainer(event.target);

		var colorPickerElementsList = getColorPickerElements();

		//log("EVENT:", event);

		// Check if the clicked element does not have its own event handler
		if (
			!event.target.closest("[onclick], a, button, input[type='button'], input[type='submit'], input, [input], [canvas], canvas") &&
			!isInsideColorPicker(event.clientX, event.clientY, colorPickerContainer) &&
			!isMouseOverElement('no_autochoose_next_on_click') &&
			!isMouseOverElementVariables(colorPickerElementsList) &&
			done_presenting &&
			!is_presenting &&
			is_hidden_or_has_hidden_parent($("#sketcher")) && 
			is_hidden_or_has_hidden_parent($(".example_images")[0])
		) {
			autochoose_next();
		} else {
			//log("Do not autochose");
		}
	});

}

// Function to run the presentation
function runPresentation(dn) {
	divName = dn;
	if (done_presenting) {
		return;
	}

	is_presenting = true;

	var container = document.getElementById(divName);
	divs = container.getElementsByTagName("div");

	// Add event listeners for scrolling and touch events
	document.addEventListener("wheel", handleScroll);
	document.addEventListener("touchstart", handleTouchStart);
	document.addEventListener("touchmove", handleTouch);
	document.addEventListener("touchend", handleTouchEnd);

	// Add event listener for keydown events
	document.addEventListener("keydown", handleKeydown);

	// Start the presentation
	showFullScreen(divs, currentDivPresentationIndex);

	// Add event listener for click events
	document.addEventListener("click", handleClick);
}

// Function to handle click events during presentation
async function handleClick(event) {
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
	await showNextDiv();
}
