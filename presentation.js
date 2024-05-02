function get_max_page () {
	return $(".folie").length;
}

function set_page_footer () {
	var max_page = get_max_page();

	$("#max_page_nr").html(max_page);

	$("#page_nr").html(get_current_page() + 1);
}

function get_current_page() {
	var page_id = null;
	$(".folie").each(function (i, e) { 
		if($(e).is(":visible")) {
			page_id = i;
		}
	});

	return page_id;
}

function show_folie_nr(i)  {
	$(".folie").hide();

	if(i < 0) {
		i = 0;
	}

	if(i >= get_max_page()) {
		end_presentation();
		return;
	}

	if(i === undefined) {
		return;
	}

	if($($(".folie")[i]).length) {
		$($(".folie")[i]).show()
	} else {
		console.error(`Invalid i for show_folie_nr: ${i}`);
	}
}

function show_prev_folie() {
	var current = get_current_page();

	show_folie_nr(current - 1);

	set_page_footer();
}

function show_next_folie() {
	var current = get_current_page();

	show_folie_nr(current + 1);

	set_page_footer();
}

// Funktion zur Behandlung von Tastendrücken
function handleKeyPress(event) {
	// Prüfen, welche Taste gedrückt wurde
	switch (event.key) {
		case "ArrowRight":
			show_next_folie();
			break;
		case "ArrowLeft":
			show_prev_folie();
			break;
		default:
			// Nichts tun, wenn andere Tasten gedrückt werden
			break;
	}
}

function handleMouseClick(event) {
	if(event.target.nodeName != "A") {
		show_next_folie();
	}
}

function handleMouseWheel(event) {
	// Determine the direction of the scroll
	var delta = event.deltaY;
	if (delta > 0) {
		show_next_folie();
	} else if (delta < 0) {
		show_prev_folie();
	}
}

var added_event_listeners_for_presentation = false;

function start_presentation(start_nr=0) {
	$("#mainsite").hide();
	$("#status_bar").hide();
	$("#presentation").show();
	// Funktion zur Behandlung von Mausklicks

	if(!added_event_listeners_for_presentation) {
		// Event-Listener für Tastendrücke
		document.addEventListener("keydown", handleKeyPress);

		// Event-Listener für Mausklicks
		document.addEventListener("click", handleMouseClick);

		document.addEventListener("wheel", handleMouseWheel);
		added_event_listeners_for_presentation = true;
	}

	show_folie_nr(start_nr)
	set_page_footer();
};

function end_presentation(goto_page) {
	$("#mainsite").show();
	$("#status_bar").show();
	$("#presentation").hide();

	if(goto_page !== null) {
		show_folie_nr(goto_page);
	}
}
