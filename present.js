var divName = "";
var currentDivPresentationIndex = 0;
var divs = [];

// Function to handle keydown events
function handleKeydown(event) {
	if (event.key === "ArrowLeft" || event.key === "Left") {
		showPreviousDiv();
	} else if (event.key === "ArrowRight" || event.key === "Right") {
		showNextDiv();
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

	$($(".slide")[currentDivPresentationIndex]).focus();

	$("#presentation_site_nr").remove();

	$("#body").append(
		`<div id='presentation_site_nr' style='z-index: 999999; position: fixed; bottom: 0; left: 50%; right: 50%;'>${currentDivPresentationIndex + 1}/${divs.length}</div>`
	);
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

// Function to add the "go left" button
function addScrollLeftButton() {
	$("#scroll_left").remove();
	$("#body").append(
		"<span onclick='showPreviousDiv()' class='next_prev_buttons' id='scroll_left'>&#12296;</span>"
	);
}

// Function to add the "go right" button
function addScrollRightButton() {
	$("#scroll_right").remove();
	$("#body").append(
		"<span onclick='showNextDiv()' class='next_prev_buttons' id='scroll_right'>&#12297;</span>"
	);
}

// Function to add or remove the scroll buttons
function addScrollButtons(currentDivPresentationIndex, maxIndex) {
	if (done_presenting) {
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
function showNextDiv() {
	if (currentDivPresentationIndex < divs.length - 1) {
		removeFullScreen(divs, currentDivPresentationIndex);
		currentDivPresentationIndex++;
		showFullScreen(divs, currentDivPresentationIndex);
		divs[currentDivPresentationIndex].focus(); // Focus on the current slide
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
		divs[currentDivPresentationIndex].focus(); // Focus on the current slide
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
	if (done_presenting) {
		return;
	}

	if (!is_presenting) {
		log("Not ending presentation because seemingly it has already ended");
		return;
	}

	removeFullScreen(divs, currentDivPresentationIndex);
	document.removeEventListener("wheel", handleScroll);
	document.removeEventListener("touchstart", handleTouchStart);
	document.removeEventListener("touchmove", handleTouch);
	document.removeEventListener("touchend", handleTouchEnd);
	log("removing", $("#" + divName));
	$("#" + divName).remove();
	$(".next_prev_buttons").remove();
	if (!Object.keys(current_skills).includes("watched_presentation")) {
		add_cosmo_point("watched_presentation");
	}

	done_presenting = true;

	$("#presentation_site_nr").remove();

	chose_next_manicule_target();
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
function handleClick(event) {
	if (event.target.id === "scroll_left") {
		return; // Do not advance to the next page
	}

	// Clicked anywhere else, show the next slide
	showNextDiv();
}
