/* ════════════════════════════════════════════════════════════
   READING FLOW — progressive enhancement for the lesson devices
   defined in style.css: .mn-hook, .mn-aha, .mn-thread, .mn-psst.

   All four work with no JavaScript at all — the marks are plain
   HTML and CSS, and the detours are native <details>. The only
   thing this file adds is a gentle scroll-reveal for the hook
   and the aha card, so a payoff arrives as the reader reaches
   it rather than sitting inert above the fold.

   Kept deliberately boring: no console output, no network, and
   it does nothing under prefers-reduced-motion. The reveal class
   (.rf-anim on <html>) is only applied once the observer is
   armed, so a JS failure can never leave content invisible.
   ════════════════════════════════════════════════════════════ */

(function () {
	"use strict";

	var REVEAL = ".mn-hook, .mn-aha";

	function reduceMotion() {
		return !!(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);
	}

	function arm() {
		var nodes = document.querySelectorAll(REVEAL);
		if (!nodes.length || reduceMotion() || !("IntersectionObserver" in window)) return;

		document.documentElement.classList.add("rf-anim");

		var io = new IntersectionObserver(function (entries) {
			entries.forEach(function (entry) {
				if (!entry.isIntersecting) return;
				entry.target.classList.add("is-in");
				io.unobserve(entry.target);
			});
		}, { rootMargin: "0px 0px -6% 0px", threshold: 0.1 });

		Array.prototype.forEach.call(nodes, function (n) {
			// Anything at or above the fold — including blocks the reader
			// already scrolled past on a mid-page reload — is shown at
			// once; only the blocks still ahead of them animate in.
			if (n.getBoundingClientRect().top < window.innerHeight) {
				n.classList.add("is-in");
			} else {
				io.observe(n);
			}
		});
	}

	var armed = false;
	function boot() {
		if (armed) return;
		armed = true;
		arm();
	}

	function schedule() {
		// blogPostLoadComplete fires once the theme loader has revealed
		// #contents; the timeout is only a net for pages that never
		// emit it (direct lesson access, embedded views).
		window.addEventListener("blogPostLoadComplete", boot);
		var ready = document.documentElement.classList.contains("is-ready");
		setTimeout(boot, ready ? 1200 : 2600);
	}

	if (document.readyState === "loading") {
		document.addEventListener("DOMContentLoaded", schedule);
	} else {
		schedule();
	}
})();
