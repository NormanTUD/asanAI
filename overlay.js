"use strict";

function show_overlay(text, title="", options={}) {
	try {
		var bg_color = "white";
		var text_color = "black";

		if (is_dark_mode) {
			bg_color = "black";
			text_color = "white";
		}

		// Options with defaults
		var show_progress = options.progress || false; // default: false

		var overlay = document.createElement("div");
		overlay.style.position = "fixed";
		overlay.style.top = "0";
		overlay.style.left = "0";
		overlay.style.width = "100%";
		overlay.style.height = "100%";
		overlay.style.opacity = "0";
		overlay.style.display = "flex";
		overlay.style.flexDirection = "column";
		overlay.style.alignItems = "center";
		overlay.style.justifyContent = "center";
		overlay.style.userSelect = "none";
		overlay.style.zIndex = "9999";
		overlay.style.transition = "opacity 0.25s ease-in";
		$(overlay).addClass("overlay");

		if (bg_color.toLowerCase() === "black") {
			overlay.style.backgroundImage = "radial-gradient(circle at 12% 22%, rgba(255,255,255,0.4) 0.5px, transparent 1.5px), radial-gradient(circle at 32% 38%, rgba(255,255,255,0.3) 0.5px, transparent 1.5px), radial-gradient(circle at 68% 18%, rgba(255,255,255,0.35) 0.5px, transparent 1.5px), radial-gradient(circle at 78% 52%, rgba(255,255,255,0.25) 0.5px, transparent 1.5px), radial-gradient(circle at 52% 76%, rgba(255,255,255,0.3) 0.5px, transparent 1.5px), radial-gradient(circle at 60% 60%, rgba(255,255,255,0.04) 0%, transparent 70%), radial-gradient(circle at 20% 70%, rgba(255,255,255,0.03) 0%, transparent 80%), linear-gradient(180deg, rgba(10,15,35,1) 0%, rgba(0,0,15,1) 100%)";
		} else if (bg_color.toLowerCase() === "white") {
			overlay.style.backgroundImage = "linear-gradient( 180deg, rgba(200, 230, 255, 1) 0%, rgba(245, 250, 255, 1) 100% ), radial-gradient(circle at 20% 30%, rgba(255,255,255,0.6) 0%, transparent 60%), radial-gradient(circle at 70% 20%, rgba(255,255,255,0.5) 0%, transparent 70%), radial-gradient(circle at 40% 70%, rgba(255,255,255,0.4) 0%, transparent 65%), radial-gradient(circle at 80% 60%, rgba(255,255,255,0.5) 0%, transparent 70%)";
		} else {
			overlay.style.backgroundImage = "linear-gradient(to bottom, " + bg_color + ", #000000)";
		}

		// Content wrapper (keeps everything centered and tidy)
		var contentWrapper = document.createElement("div");
		contentWrapper.style.display = "flex";
		contentWrapper.style.flexDirection = "column";
		contentWrapper.style.alignItems = "center";
		contentWrapper.style.justifyContent = "center";
		contentWrapper.style.maxWidth = "500px";
		contentWrapper.style.padding = "40px";
		contentWrapper.style.textAlign = "center";

		// Title
		if (title) {
			var hElement = document.createElement("h1");
			hElement.innerHTML = title;
			hElement.style.fontFamily = "Arial, sans-serif";
			hElement.style.fontSize = "28px";
			hElement.style.fontWeight = "600";
			hElement.style.color = text_color;
			hElement.style.margin = "0 0 12px 0";
			contentWrapper.appendChild(hElement);
		}

		// Text
		if (text) {
			var textElement = document.createElement("p");
			textElement.innerHTML = text;
			textElement.className = "overlay-text";
			textElement.style.textAlign = "center";
			textElement.style.fontFamily = "Arial, sans-serif";
			textElement.style.fontSize = "18px";
			textElement.style.color = text_color;
			textElement.style.margin = "12px 0";
			textElement.style.opacity = "0.85";
			textElement.style.lineHeight = "1.5";
			contentWrapper.appendChild(textElement);
		}

		// Progress bar
		if (show_progress) {
			var progressWrapper = document.createElement("div");
			progressWrapper.className = "overlay-progress-wrapper";
			progressWrapper.style.width = "100%";
			progressWrapper.style.maxWidth = "320px";
			progressWrapper.style.height = "6px";
			progressWrapper.style.backgroundColor = is_dark_mode ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.08)";
			progressWrapper.style.borderRadius = "3px";
			progressWrapper.style.overflow = "hidden";
			progressWrapper.style.margin = "16px 0";

			var progressBar = document.createElement("div");
			progressBar.className = "overlay-progress-bar";
			progressBar.style.width = "0%";
			progressBar.style.height = "100%";
			progressBar.style.backgroundColor = is_dark_mode ? "#7eb8ff" : "#2196F3";
			progressBar.style.borderRadius = "3px";
			progressBar.style.transition = "width 0.3s ease";

			progressWrapper.appendChild(progressBar);
			contentWrapper.appendChild(progressWrapper);

			// Store reference on the overlay element for external updates
			overlay._progressBar = progressBar;
		}


		overlay.appendChild(contentWrapper);
		document.body.appendChild(overlay);

		// Fade in
		requestAnimationFrame(function () {
			overlay.style.opacity = "1";
		});

		assert(true, "Overlay displayed successfully.");

		return overlay;
	} catch (error) {
		log(language[lang]["an_error_occurred"], error);
		wrn("[show_overlay] Failed to display overlay.");
	}
}

function update_overlay_progress(overlay, value) {
	// value should be between 0 and 100
	if (!overlay || !overlay._progressBar) return;

	value = Math.max(0, Math.min(100, value));
	overlay._progressBar.style.width = value + "%";
}

function update_overlay_text(overlay, newText) {
	if (!overlay) return;

	var textEl = overlay.querySelector(".overlay-text");
	if (textEl) {
		textEl.innerHTML = newText;
	}
}

function remove_overlay() {
	var overlays = document.querySelectorAll(".overlay");

	for (var i = 0; i < overlays.length; i++) {
		var ov = overlays[i];
		ov.style.transition = "opacity 0.2s ease-out";
		ov.style.opacity = "0";

		(function (el) {
			setTimeout(function () {
				if (el.parentNode) {
					el.parentNode.removeChild(el);
				}
			}, 220);
		})(ov);
	}
}
