"use strict";

function close_all_popups() {
	$(".popup_body").each(function (i, e) {
		var $el = $(e);
		if ($el.is(":visible")) {
			var parentId = $el.parent().attr("id");
			if (parentId) {
				close_popup(parentId);
			} else {
				$el.find(".close_button").click();
			}
		}
	});
}

function open_popup(name) {
	assert(typeof (name) == "string", name + " is not a string but " + typeof (name));
	var el = document.getElementById(name);
	assert(typeof (el) == "object", "document.getElementById(" + name + ") is not an object");

	var visible = $($(".popup_body:visible")[0]).parent().attr("id");

	close_all_popups();

	if (visible != name) {
		_animate_popup_in(el);
	}
}

function close_popup(name) {
	assert(typeof (name) == "string", name + " is not a string but " + typeof (name));
	var el = document.getElementById(name);
	assert(typeof (el) == "object", "document.getElementById(" + name + ") is not an object");

	if (el.style.display === "none" || el.style.display === "") {
		return; // already hidden
	}

	_animate_popup_out(el);
}

function _animate_popup_in(el) {
	var $el = $(el);

	// Set initial state for animation
	$el.css({
		display: "block",
		opacity: 0,
		transform: "translateY(-10px) scale(0.98)",
		transition: "opacity 0.18s ease-out, transform 0.18s ease-out"
	});

	// Force reflow so the browser registers the initial state
	void el.offsetHeight;

	// Animate to final state
	$el.css({
		opacity: 1,
		transform: "translateY(0) scale(1)"
	});

	// Register Escape key listener for this popup
	_register_popup_escape_listener(el);
}

function _animate_popup_out(el) {
	var $el = $(el);

	$el.css({
		transition: "opacity 0.15s ease-in, transform 0.15s ease-in",
		opacity: 0,
		transform: "translateY(-8px) scale(0.97)"
	});

	// After animation completes, hide the element and clean up
	setTimeout(function () {
		$el.css({
			display: "none",
			transform: "",
			transition: "",
			opacity: ""
		});
	}, 160);
}

function _register_popup_escape_listener(el) {
	// Avoid duplicate listeners by tagging the element
	if (el.dataset.escListenerAttached === "true") return;

	el.dataset.escListenerAttached = "true";

	function _popup_esc_handler(e) {
		if (e.key === "Escape") {
			var $el = $(el);
			if ($el.is(":visible")) {
				close_popup(el.id);
			}
		}
	}

	document.addEventListener("keydown", _popup_esc_handler);

	// Store reference so it could be removed later if needed
	el._popup_esc_handler = _popup_esc_handler;
}

// Global Escape key handler: closes the topmost visible popup
(function _init_global_popup_escape() {
	document.addEventListener("keydown", function (e) {
		if (e.key !== "Escape") return;

		var visiblePopups = $(".popup_body:visible");
		if (visiblePopups.length) {
			var topPopup = visiblePopups.last().parent();
			var popupId = topPopup.attr("id");
			if (popupId) {
				close_popup(popupId);
			}
		}
	});
})();
