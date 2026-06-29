"use strict";

async function theme_choser() {
	var theme = $("#theme_choser").val();

	if (!theme) return;

	// Add a smooth transition to the body for theme switching
	_apply_theme_transition();

	document.getElementById("css_mode").href = "css/" + theme + ".css";
	document.getElementById("css_ribbon").href = "css/" + "ribbon" + theme + ".css";

	set_cookie("theme", theme);

	// Wait for the transition to settle before doing heavy repaints
	await _wait_for_theme_transition();

	await write_descriptions();
	await write_model_to_latex_to_page();

	invert_elements_in_dark_mode();

	await restart_fcnn();

	check_number_values();
}

function _apply_theme_transition() {
	var body = document.body;

	// Prevent adding duplicate transition styles
	if (body.dataset.themeTransitioning === "true") return;

	body.dataset.themeTransitioning = "true";
	body.style.transition = "background-color 0.2s ease, color 0.2s ease";

	// Also transition common child elements for a polished feel
	var style = document.getElementById("_theme_transition_style");
	if (!style) {
		style = document.createElement("style");
		style.id = "_theme_transition_style";
		style.textContent = [
			"body *, body {",
			"  transition: background-color 0.2s ease, color 0.2s ease, border-color 0.2s ease;",
			"}"
		].join("\n");
		document.head.appendChild(style);
	}
}

function _wait_for_theme_transition() {
	return new Promise(function (resolve) {
		setTimeout(function () {
			// Remove the transition style so it doesn't interfere with normal interactions
			var style = document.getElementById("_theme_transition_style");
			if (style) {
				style.remove();
			}
			document.body.style.transition = "";
			document.body.dataset.themeTransitioning = "false";
			resolve();
		}, 220); // slightly longer than the 200ms transition
	});
}
