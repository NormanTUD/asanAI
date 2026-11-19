/* Report the rendered page height to an embedding parent (same protocol as the blog). */
(function () {
	"use strict";

	function sendHeight() {
		var body = document.body,
			html = document.documentElement;

		var height = Math.max(
			body.scrollHeight,
			body.offsetHeight,
			html.clientHeight,
			html.scrollHeight,
			html.offsetHeight
		);

		if (window.parent && window.parent !== window) {
			window.parent.postMessage({
				type: "height",
				val: height
			}, "*");
		}
	}

	window.sendHeight = sendHeight;


	function sendReady() {
		if (window.parent && window.parent !== window) {
			window.parent.postMessage({ type: "lesson-ready" }, "*");
		}
	}

	window.addEventListener("load", function () {
		sendHeight();
		sendReady();
		setTimeout(sendReady, 400);
		setTimeout(sendReady, 1500);
	});
	window.addEventListener("pageshow", function () { sendReady(); });
	window.addEventListener("resize", function () { sendHeight(); });
	if (document.readyState === "complete") { sendReady(); }

	var startObserving = function () {
		if (!document.body) return;
		if (window.ResizeObserver) {
			var ro = new ResizeObserver(function () { sendHeight(); });
			ro.observe(document.body);
		} else {
			setInterval(function () { sendHeight(); }, 1000);
		}
	};

	if (document.readyState === "loading") {
		document.addEventListener("DOMContentLoaded", startObserving);
	} else {
		startObserving();
	}

	window.addEventListener("load", function () {
		setTimeout(sendHeight, 300);
		setTimeout(sendHeight, 1200);
	});
})();
