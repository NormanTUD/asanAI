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

	// Runtime loader + nav gate. Works even if proxy sanitizers strip
	// <style>/style="" from the served HTML.
	function ensureLoader() {
		var l = document.getElementById("ls-page-loader");
		if (!l) {
			l = document.createElement("div");
			l.id = "ls-page-loader";
			var sp = document.createElement("div");
			sp.className = "ls-page-loader-spinner";
			l.appendChild(sp);
			if (document.body.firstChild) document.body.insertBefore(l, document.body.firstChild);
			else document.body.appendChild(l);
		}
		var st = l.style;
		st.setProperty("position", "fixed", "important");
		st.setProperty("inset", "0", "important");
		st.setProperty("width", "100vw", "important");
		st.setProperty("height", "100vh", "important");
		st.setProperty("z-index", "2147483647", "important");
		st.setProperty("background", "#fff", "important");
		st.setProperty("display", "flex", "important");
		st.setProperty("align-items", "center", "important");
		st.setProperty("justify-content", "center", "important");
		var spinner = l.querySelector(".ls-page-loader-spinner");
		if (spinner) {
			var ss = spinner.style;
			ss.setProperty("width", "40px", "important");
			ss.setProperty("height", "40px", "important");
			ss.setProperty("border", "3px solid #dbe3e0", "important");
			ss.setProperty("border-top-color", "#63a44b", "important");
			ss.setProperty("border-radius", "50%", "important");
			ss.setProperty("animation", "lsProxySpin .8s linear infinite", "important");
		}
		if (!document.getElementById("ls-proxy-spin-style")) {
			var k = document.createElement("style");
			k.id = "ls-proxy-spin-style";
			k.textContent = "@keyframes lsProxySpin{to{transform:rotate(360deg)}}";
			document.head.appendChild(k);
		}
	}

	function gateNav(hide) {
		var nodes = document.querySelectorAll("#ls-quick-prev,#ls-quick-next,#navfix-prev,#navfix-next,#eoy-embed-nav,.eoy-nav,.ls-bottom-nav");
		for (var i = 0; i < nodes.length; i++) {
			if (hide) nodes[i].style.setProperty("display", "none", "important");
			else nodes[i].style.removeProperty("display");
		}
	}

	function reveal() {
		window.__lsPageReady = true;
		if (document.body) document.body.classList.add("ls-loaded");
		var l = document.getElementById("ls-page-loader");
		if (l && l.parentNode) l.parentNode.removeChild(l);
		gateNav(false);
	}

	ensureLoader();
	gateNav(true);

	function sendReady() {
		if (window.parent && window.parent !== window) {
			window.parent.postMessage({ type: "lesson-ready" }, "*");
		}
	}

	window.addEventListener("load", function () {
		sendHeight();
		sendReady();
		setTimeout(reveal, 120);
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
