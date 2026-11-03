"use strict";

// Registers the blog service worker and makes every page the reader opens
// available offline. There is deliberately no UI: the worker caches the page
// and all same-origin assets it loaded. A page opened before the worker
// controlled it is handed to the worker once the blog registration is active.
(function () {
	var scriptEl = document.currentScript;
	var swUrl = new URL("sw.js", scriptEl ? scriptEl.src : document.baseURI).href;
	var swScope = new URL("./", swUrl).href;
	var registration = null;
	var registrationPromise = null;
	var cachePromise = null;
	var cacheAgain = false;
	var lastCacheAt = 0;

	function pageUrl() {
		return location.origin + location.pathname + location.search;
	}

	function collectAssetUrls() {
		var urls = [];
		var seen = Object.create(null);

		function add(value) {
			if (!value) {
				return;
			}
			try {
				var url = new URL(value, document.baseURI);
				if (url.origin !== location.origin) {
					return;
				}
				if (url.protocol !== "http:" && url.protocol !== "https:") {
					return;
				}
				url.hash = "";
				if (!seen[url.href]) {
					seen[url.href] = true;
					urls.push(url.href);
				}
			} catch (error) {
			}
		}

		function addSrcset(value) {
			if (!value) {
				return;
			}
			value.split(",").forEach(function (part) {
				add(part.trim().split(/\s+/)[0]);
			});
		}

		var selector = [
			"img[src]",
			"img[srcset]",
			"img[data-src]",
			"img[data-srcset]",
			"source[src]",
			"source[srcset]",
			"video[src]",
			"video[poster]",
			"audio[src]",
			"iframe[src]",
			"object[data]",
			"embed[src]",
			"script[src]",
			'link[rel="stylesheet"][href]',
			'link[rel="preload"][href]',
			'link[rel="icon"][href]',
			'link[rel="apple-touch-icon"][href]'
		].join(",");

		Array.prototype.forEach.call(document.querySelectorAll(selector), function (element) {
			add(element.getAttribute("src"));
			add(element.getAttribute("href"));
			add(element.getAttribute("poster"));
			add(element.getAttribute("data"));
			add(element.getAttribute("data-src"));
			addSrcset(element.getAttribute("srcset"));
			addSrcset(element.getAttribute("data-srcset"));
		});

		if (window.performance && performance.getEntriesByType) {
			performance.getEntriesByType("resource").forEach(function (entry) {
				add(entry.name);
			});
		}

		return urls;
	}

	// `navigator.serviceWorker.ready` can resolve to another registration on
	// the same origin (the Toolkit worker at scope "/"). Wait for the blog
	// registration itself, and post to its active worker.
	function waitForActive(reg) {
		if (reg.active) {
			return Promise.resolve(reg.active);
		}

		return new Promise(function (resolve, reject) {
			var timer = setTimeout(function () {
				if (reg.active) {
					resolve(reg.active);
				} else {
					reject(new Error("blog service worker is not active"));
				}
			}, 15000);

			function finish(worker) {
				if (!worker || worker.state !== "activated") {
					return;
				}
				clearTimeout(timer);
				resolve(worker);
			}

			function watch(worker) {
				if (!worker) {
					return;
				}
				worker.addEventListener("statechange", function () {
					if (worker.state === "redundant") {
						clearTimeout(timer);
						reject(new Error("blog service worker became redundant"));
						return;
					}
					finish(worker);
				});
			}

			watch(reg.installing || reg.waiting);
			reg.addEventListener("updatefound", function () {
				watch(reg.installing);
			});
		});
	}

	function ensureRegistration() {
		if (registrationPromise) {
			return registrationPromise;
		}

		registrationPromise = navigator.serviceWorker.register(swUrl, { scope: swScope })
			.then(function (reg) {
				registration = reg;
				return waitForActive(reg);
			})
			.catch(function (error) {
				registrationPromise = null;
				throw error;
			});

		return registrationPromise;
	}

	function pageIsCached() {
		if (!window.caches || !caches.match) {
			return Promise.resolve(false);
		}

		return caches.match(pageUrl(), { ignoreSearch: true })
			.then(function (response) {
				return Boolean(response);
			})
			.catch(function () {
				return false;
			});
	}

	function requestPageCache() {
		return ensureRegistration().then(function (worker) {
			return pageIsCached().then(function (cached) {
				return new Promise(function (resolve, reject) {
					var channel = new MessageChannel();
					var timer = setTimeout(function () {
						reject(new Error("cache timeout"));
					}, 120000);

					channel.port1.onmessage = function (event) {
						clearTimeout(timer);
						if (event.data && event.data.type === "CACHE_PAGE_DONE") {
							resolve(event.data);
						} else {
							reject(new Error("unexpected cache reply"));
						}
					};

					worker.postMessage({
						type: "CACHE_PAGE",
						// Once the page is cached, later passes only need the
						// assets that appeared as the reader interacted.
						page: cached ? null : pageUrl(),
						assets: collectAssetUrls()
					}, [channel.port2]);
				});
			});
		});
	}

	function cacheCurrentPage() {
		var now = Date.now();

		if (cachePromise) {
			cacheAgain = true;
			return;
		}

		if (lastCacheAt && now - lastCacheAt < 3000) {
			cacheAgain = true;
			return;
		}

		lastCacheAt = now;
		cachePromise = requestPageCache()
			.catch(function () {
				// Offline or a registration race: the next scheduled pass retries.
			})
			.then(function () {
				cachePromise = null;
				if (cacheAgain) {
					cacheAgain = false;
					setTimeout(cacheCurrentPage, 1500);
				}
			});
	}

	function scheduleAutoCache() {
		ensureRegistration().then(function () {
			cacheCurrentPage();
			[2000, 8000, 20000].forEach(function (delay) {
				setTimeout(cacheCurrentPage, delay);
			});
		}).catch(function () {
			// Service workers are unavailable or registration failed.
		});
	}

	if (!("serviceWorker" in navigator)) {
		return;
	}

	if (location.protocol === "file:") {
		return;
	}

	if (document.readyState === "loading") {
		document.addEventListener("DOMContentLoaded", scheduleAutoCache);
	} else {
		scheduleAutoCache();
	}

	window.addEventListener("load", function () {
		setTimeout(cacheCurrentPage, 1000);
	});

	window.addEventListener("blogPostLoadComplete", function () {
		setTimeout(cacheCurrentPage, 1500);
	});

	window.addEventListener("online", cacheCurrentPage);

	document.addEventListener("visibilitychange", function () {
		if (document.visibilityState === "hidden") {
			cacheCurrentPage();
		}
	});
})();
