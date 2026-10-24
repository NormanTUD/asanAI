/* Full-screen presentation for the unified analytics + feedback dashboard.
   Slides are server-rendered in stats.php. This file only handles navigation,
   progress, overview, fullscreen and URL state. */
(function () {
	"use strict";

	function boot() {
		var root = document.getElementById("mn-present");
		if (!root) return;
		var slides = Array.prototype.slice.call(root.querySelectorAll(".mn-pres-slide"));
		if (!slides.length) return;
		var progress = root.querySelector(".mn-pres-progress");
		var counter = root.querySelector(".mn-pres-counter");
		var title = root.querySelector(".mn-pres-slide-title");
		var overview = root.querySelector(".mn-pres-overview");
		var overviewGrid = root.querySelector(".mn-pres-overview-grid");
		var openButton = document.getElementById("present-toggle");
		var current = 0;
		var open = false;
		var restoreScroll = 0;
		var transitionTimer = 0;
		var idleTimer = 0;

		function poke() {
			root.classList.remove("is-idle");
			clearTimeout(idleTimer);
			idleTimer = setTimeout(function () {
				if (open) root.classList.add("is-idle");
			}, 2600);
		}

		function urlFor(index) {
			try {
				var url = new URL(window.location.href);
				if (open) {
					url.searchParams.set("present", String(index + 1));
				} else {
					url.searchParams.delete("present");
				}
				return url;
			} catch (e) {
				return null;
			}
		}

		function updateUrl() {
			try {
				var url = urlFor(current);
				if (url) window.history.replaceState(null, "", url.toString());
			} catch (e) { /* ignore */ }
		}

		function update() {
			root.setAttribute("data-slide-total", String(slides.length));
			slides.forEach(function (slide, index) {
				slide.setAttribute("data-slide-number", String(index + 1));
				slide.setAttribute("data-slide-total", String(slides.length));
				slide.classList.toggle("is-active", index === current);
				slide.setAttribute("aria-hidden", index === current ? "false" : "true");
			});
			if (progress) {
				progress.style.width = ((current + 1) / slides.length * 100) + "%";
			}
			if (counter) {
				counter.textContent = (current + 1) + " / " + slides.length;
			}
			if (title) {
				title.textContent = slides[current].getAttribute("data-title") || "";
			}
			root.querySelectorAll(".mn-pres-thumb").forEach(function (thumb) {
				thumb.classList.toggle("is-current", parseInt(thumb.getAttribute("data-index"), 10) === current);
			});
			updateUrl();
		}

		function go(index) {
			current = Math.max(0, Math.min(slides.length - 1, index));
			poke();
			clearTimeout(transitionTimer);
			transitionTimer = setTimeout(update, 20);
		}

		function next() {
			go(current + 1 < slides.length ? current + 1 : current);
		}

		function prev() {
			go(current > 0 ? current - 1 : current);
		}

		function buildOverview() {
			if (!overviewGrid) return;
			overviewGrid.innerHTML = "";
			slides.forEach(function (slide, index) {
				var button = document.createElement("button");
				button.type = "button";
				button.className = "mn-pres-thumb";
				button.setAttribute("data-index", String(index));
				var small = document.createElement("span");
				small.textContent = "Slide " + (index + 1);
				var strong = document.createElement("b");
				strong.textContent = slide.getAttribute("data-title") || "Untitled";
				button.appendChild(small);
				button.appendChild(strong);
				button.addEventListener("click", function () {
					go(index);
					hideOverview();
				});
				overviewGrid.appendChild(button);
			});
		}

		function showOverview() {
			if (!overview) return;
			overview.classList.add("is-open");
		}

		function hideOverview() {
			if (!overview) return;
			overview.classList.remove("is-open");
		}

		function isOverviewOpen() {
			return overview && overview.classList.contains("is-open");
		}

		function toggleFullscreen() {
			if (!document.fullscreenElement) {
				var target = root;
				if (target.requestFullscreen) {
					target.requestFullscreen().catch(function () {});
				}
			} else if (document.exitFullscreen) {
				document.exitFullscreen().catch(function () {});
			}
		}

		function openDeck(index) {
			if (open) {
				go(index);
				return;
			}
			restoreScroll = window.scrollY || window.pageYOffset || 0;
			open = true;
			current = Math.max(0, Math.min(slides.length - 1, index));
			root.hidden = false;
			root.setAttribute("aria-hidden", "false");
			root.classList.add("is-open");
			document.body.classList.add("mn-presenting");
			buildOverview();
			update();
			poke();
			try {
				root.focus && root.focus({ preventScroll: true });
			} catch (e) { /* ignore */ }
			try {
				if (!document.fullscreenElement && root.requestFullscreen) {
					root.requestFullscreen().catch(function () {});
				}
			} catch (e) { /* ignore */ }
		}

		function closeDeck() {
			if (!open) return;
			open = false;
			root.classList.remove("is-open");
			root.hidden = true;
			root.setAttribute("aria-hidden", "true");
			document.body.classList.remove("mn-presenting");
			root.classList.remove("is-idle");
			clearTimeout(idleTimer);
			hideOverview();
			updateUrl();
			window.scrollTo(0, restoreScroll);
			try {
				if (document.fullscreenElement && document.exitFullscreen) {
					document.exitFullscreen().catch(function () {});
				}
			} catch (e) { /* ignore */ }
		}

		if (openButton) {
			openButton.addEventListener("click", function (event) {
				event.preventDefault();
				openDeck(0);
			});
		}
		root.querySelectorAll("[data-present-open]").forEach(function (button) {
			button.addEventListener("click", function (event) {
				event.preventDefault();
				openDeck(0);
			});
		});
		root.querySelectorAll("[data-present-prev]").forEach(function (button) {
			button.addEventListener("click", function (event) {
				event.preventDefault();
				prev();
			});
		});
		root.querySelectorAll("[data-present-next]").forEach(function (button) {
			button.addEventListener("click", function (event) {
				event.preventDefault();
				next();
			});
		});
		root.querySelectorAll("[data-present-exit]").forEach(function (button) {
			button.addEventListener("click", function (event) {
				event.preventDefault();
				closeDeck();
			});
		});
		root.querySelectorAll("[data-present-overview]").forEach(function (button) {
			button.addEventListener("click", function (event) {
				event.preventDefault();
				if (isOverviewOpen()) hideOverview(); else showOverview();
			});
		});
		root.querySelectorAll("[data-present-fullscreen]").forEach(function (button) {
			button.addEventListener("click", function (event) {
				event.preventDefault();
				toggleFullscreen();
			});
		});
		if (overview) {
			overview.addEventListener("click", function (event) {
				if (event.target === overview) hideOverview();
			});
		}

		document.addEventListener("keydown", function (event) {
			if (!open) return;
			poke();
			if (event.key === "Escape") {
				event.preventDefault();
				if (isOverviewOpen()) hideOverview(); else closeDeck();
				return;
			}
			if (event.key === "ArrowRight" || event.key === " " || event.key === "PageDown" || event.key === "Enter") {
				event.preventDefault();
				next();
				return;
			}
			if (event.key === "ArrowLeft" || event.key === "PageUp") {
				event.preventDefault();
				prev();
				return;
			}
			if (event.key === "Home") {
				event.preventDefault();
				go(0);
				return;
			}
			if (event.key === "End") {
				event.preventDefault();
				go(slides.length - 1);
				return;
			}
			if (event.key === "o" || event.key === "O") {
				event.preventDefault();
				if (isOverviewOpen()) hideOverview(); else showOverview();
				return;
			}
			if (event.key === "f" || event.key === "F") {
				event.preventDefault();
				toggleFullscreen();
			}
		});

		var touchStartX = 0;
		var touchStartY = 0;
		root.addEventListener("mousemove", poke);
		root.addEventListener("touchstart", function (event) {
			poke();
			if (!event.changedTouches || !event.changedTouches.length) return;
			touchStartX = event.changedTouches[0].screenX;
			touchStartY = event.changedTouches[0].screenY;
		}, { passive: true });
		root.addEventListener("touchend", function (event) {
			if (!event.changedTouches || !event.changedTouches.length) return;
			var dx = event.changedTouches[0].screenX - touchStartX;
			var dy = event.changedTouches[0].screenY - touchStartY;
			if (Math.abs(dx) < 50 || Math.abs(dx) < Math.abs(dy)) return;
			if (dx < 0) next(); else prev();
		}, { passive: true });

		var start = 0;
		try {
			var param = new URLSearchParams(window.location.search).get("present");
			if (param !== null && param !== "") {
				start = parseInt(param, 10);
				if (!isFinite(start)) start = 1;
				start = Math.max(1, Math.min(slides.length, start)) - 1;
				openDeck(start);
			}
		} catch (e) { /* ignore */ }

		window.MNAdminPresentation = {
			open: openDeck,
			close: closeDeck,
			go: go,
			next: next,
			prev: prev
		};
	}

	if (document.readyState === "loading") {
		document.addEventListener("DOMContentLoaded", boot);
	} else {
		boot();
	}
})();
