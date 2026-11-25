"use strict";

(function () {
	var STORAGE_KEY = "mn_vt_shared";
	var SHARED_NAME = "mn-shared-title";
	var MAX_AGE = 30000;

	function reducedMotion() {
		return !!(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);
	}

	function normalizePath(value) {
		try {
			var url = new URL(value, location.href);
			var path = url.pathname.replace(/\/index\.php$/, "/").replace(/\.php$/, "");
			if (path.length > 1) {
				path = path.replace(/\/+$/, "");
			}
			return url.origin + path + url.search;
		} catch (error) {
			return value;
		}
	}

	function clearStored() {
		try {
			sessionStorage.removeItem(STORAGE_KEY);
		} catch (error) {
		}
	}

	function readStored() {
		try {
			var raw = sessionStorage.getItem(STORAGE_KEY);
			if (!raw) {
				return null;
			}
			var data = JSON.parse(raw);
			if (!data || typeof data.to !== "string") {
				clearStored();
				return null;
			}
			if (data.at && Date.now() - data.at > MAX_AGE) {
				clearStored();
				return null;
			}
			return data;
		} catch (error) {
			clearStored();
			return null;
		}
	}

	function writeStored(data) {
		try {
			sessionStorage.setItem(STORAGE_KEY, JSON.stringify(data));
		} catch (error) {
		}
	}

	function setSharedName(element, enabled) {
		if (!element || !element.style) {
			return;
		}
		element.style.viewTransitionName = enabled ? SHARED_NAME : "";
	}

	function findSource(target) {
		if (!target || !target.closest) {
			return null;
		}
		var tile = target.closest(".course-tile");
		if (tile) {
			var tileTitle = tile.querySelector("h3") || tile;
			return { link: tile, element: tileTitle, title: tileTitle.textContent };
		}
		var drawer = target.closest(".drawer-module");
		if (drawer) {
			return { link: drawer, element: drawer, title: drawer.textContent };
		}
		var nav = target.closest(".module-nav-link");
		if (nav) {
			var navTitle = nav.querySelector(".module-nav-title") || nav;
			return { link: nav, element: navTitle, title: navTitle.textContent };
		}
		return null;
	}

	function onClick(event) {
		if (event.defaultPrevented || event.button !== 0) {
			return;
		}
		if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
			return;
		}
		var source = findSource(event.target);
		if (!source) {
			return;
		}
		var link = source.link;
		if (link.target && link.target !== "_self") {
			return;
		}
		if (link.hasAttribute && link.hasAttribute("download")) {
			return;
		}
		var href = link.getAttribute("href");
		if (!href || href.charAt(0) === "#") {
			return;
		}
		var url;
		try {
			url = new URL(link.href, location.href);
		} catch (error) {
			return;
		}
		if (url.origin !== location.origin) {
			return;
		}
		if (url.pathname === location.pathname && url.search === location.search) {
			return;
		}
		if (reducedMotion()) {
			return;
		}
		var title = (source.title || "").replace(/\s+/g, " ").trim();
		if (!title) {
			return;
		}
		setSharedName(source.element, true);
		writeStored({ to: normalizePath(url.href), title: title, at: Date.now() });
		setTimeout(function () {
			setSharedName(source.element, false);
		}, 2500);
	}

	function onPageReveal(event) {
		var data = readStored();
		if (!data) {
			return;
		}
		if (data.to !== normalizePath(location.href)) {
			clearStored();
			return;
		}
		if (!event.viewTransition || reducedMotion()) {
			clearStored();
			return;
		}
		var loader = document.getElementById("loader");
		if (!loader) {
			clearStored();
			return;
		}
		var target = document.createElement("div");
		target.id = "mn-vt-title";
		target.setAttribute("aria-hidden", "true");
		target.textContent = data.title;
		target.style.viewTransitionName = SHARED_NAME;
		loader.appendChild(target);

		var done = false;
		var cleanup = function () {
			if (done) {
				return;
			}
			done = true;
			setSharedName(target, false);
			clearStored();
			setTimeout(function () {
				if (target.parentNode) {
					target.parentNode.removeChild(target);
				}
			}, 20000);
		};
		try {
			event.viewTransition.finished.then(cleanup, cleanup);
		} catch (error) {
			setTimeout(cleanup, 800);
		}
	}

	function onPageShow(event) {
		if (!event.persisted) {
			return;
		}
		clearStored();
		Array.prototype.forEach.call(document.querySelectorAll('[style*="view-transition-name"]'), function (element) {
			setSharedName(element, false);
		});
		var stale = document.getElementById("mn-vt-title");
		if (stale && stale.parentNode) {
			stale.parentNode.removeChild(stale);
		}
	}

	document.addEventListener("click", onClick, true);
	window.addEventListener("pagereveal", onPageReveal);
	window.addEventListener("pageshow", onPageShow);

	window.MNViewTransition = {
		supported: function () {
			return typeof document.startViewTransition === "function" &&
				!reducedMotion() &&
				document.visibilityState !== "hidden";
		},
		run: function (fn) {
			if (this.supported()) {
				return document.startViewTransition(fn);
			}
			fn();
			return null;
		}
	};
})();
