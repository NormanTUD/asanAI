"use strict";

(function () {
	var scriptEl = document.currentScript;
	var swUrl = new URL("sw.js", scriptEl ? scriptEl.src : document.baseURI).href;
	var swScope = new URL("./", swUrl).href;
	var registration = null;
	var registrationPromise = null;
	var installPrompt = null;
	var footerBox = null;
	var saveButton = null;
	var installButton = null;
	var statusEl = null;
	var autoCached = false;

	function isStandalone() {
		return (window.matchMedia && window.matchMedia("(display-mode: standalone)").matches) ||
			navigator.standalone === true;
	}

	function setStatus(text) {
		if (statusEl) {
			statusEl.textContent = text || "";
		}
	}

	window.addEventListener("beforeinstallprompt", function (event) {
		event.preventDefault();
		installPrompt = event;
		if (installButton && !isStandalone()) {
			installButton.hidden = false;
		}
	});

	window.addEventListener("appinstalled", function () {
		installPrompt = null;
		if (installButton) {
			installButton.hidden = true;
		}
		setStatus("Installed. The course now opens like an app.");
	});

	function ensureRegistration() {
		if (registrationPromise) {
			return registrationPromise;
		}
		registrationPromise = navigator.serviceWorker.register(swUrl, { scope: swScope })
			.then(function (reg) {
				registration = reg;
				return navigator.serviceWorker.ready;
			})
			.catch(function (error) {
				registrationPromise = null;
				throw error;
			});
		return registrationPromise;
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
				if (!seen[url.href]) {
					seen[url.href] = true;
					urls.push(url.href);
				}
			} catch (error) {
			}
		}

		var selector = [
			"img[src]",
			"img[srcset]",
			"source[src]",
			"source[srcset]",
			"video[src]",
			"video[poster]",
			"audio[src]",
			"iframe[src]",
			"script[src]",
			'link[rel="stylesheet"][href]',
			'link[rel="preload"][href]',
			'link[rel="icon"][href]',
		].join(",");

		Array.prototype.forEach.call(document.querySelectorAll(selector), function (element) {
			add(element.getAttribute("src"));
			add(element.getAttribute("href"));
			add(element.getAttribute("poster"));
			var srcset = element.getAttribute("srcset");
			if (srcset) {
				srcset.split(",").forEach(function (part) {
					add(part.trim().split(/\s+/)[0]);
				});
			}
		});

		if (window.performance && performance.getEntriesByType) {
			performance.getEntriesByType("resource").forEach(function (entry) {
				add(entry.name);
			});
		}

		return urls;
	}

	function requestPageCache() {
		return ensureRegistration().then(function () {
			var worker = navigator.serviceWorker.controller || (registration && registration.active);
			if (!worker) {
				throw new Error("service worker not active");
			}
			return new Promise(function (resolve, reject) {
				var channel = new MessageChannel();
				var timer = setTimeout(function () {
					reject(new Error("cache timeout"));
				}, 90000);
				channel.port1.onmessage = function (event) {
					clearTimeout(timer);
					if (event.data && event.data.type === "CACHE_PAGE_DONE") {
						resolve(event.data);
					} else {
						reject(new Error("unexpected reply"));
					}
				};
				worker.postMessage({
					type: "CACHE_PAGE",
					page: location.href,
					assets: collectAssetUrls(),
				}, [channel.port2]);
			});
		});
	}

	function pageIsCached() {
		if (!window.caches || !caches.keys) {
			return Promise.resolve(false);
		}
		return caches.keys()
			.then(function (names) {
				var pageCache = names.filter(function (name) {
					return name.indexOf("asanai-blog-pages-") === 0;
				})[0];
				if (!pageCache) {
					return false;
				}
				return caches.open(pageCache)
					.then(function (cache) {
						return cache.match(location.href, { ignoreSearch: true });
					})
					.then(function (response) {
						return Boolean(response);
					});
			})
			.catch(function () {
				return false;
			});
	}

	function cacheCurrentPage() {
		if (autoCached) {
			return;
		}
		autoCached = true;
		requestPageCache().then(function (result) {
			if (result && result.cached > 0) {
				if (saveButton) {
					saveButton.textContent = "Saved offline";
				}
				if (result.failed > 0) {
					setStatus("Partly saved for offline reading.");
				}
			}
		}).catch(function () {
		});
	}

	function updateConnectionState() {
		if (navigator.onLine === false) {
			setStatus("Offline: saved pages remain available.");
		} else if (statusEl && statusEl.textContent.indexOf("Offline:") === 0) {
			setStatus("");
		}
	}

	function mountFooter() {
		var footer = document.querySelector(".site-footer");
		if (!footer || footer.querySelector(".pwa-footer")) {
			return;
		}

		footerBox = document.createElement("div");
		footerBox.className = "pwa-footer";

		saveButton = document.createElement("button");
		saveButton.type = "button";
		saveButton.className = "pwa-footer-btn";
		saveButton.textContent = "Save page offline";
		saveButton.title = "Store this page and its images on this device";
		saveButton.hidden = true;
		footerBox.appendChild(saveButton);

		installButton = document.createElement("button");
		installButton.type = "button";
		installButton.className = "pwa-footer-btn";
		installButton.textContent = "Install app";
		installButton.title = "Install the course as an app";
		installButton.hidden = true;
		footerBox.appendChild(installButton);

		statusEl = document.createElement("span");
		statusEl.className = "pwa-footer-status";
		statusEl.setAttribute("role", "status");
		statusEl.setAttribute("aria-live", "polite");
		footerBox.appendChild(statusEl);

		footer.appendChild(footerBox);

		saveButton.addEventListener("click", function () {
			if (!saveButton || saveButton.disabled) {
				return;
			}
			saveButton.disabled = true;
			saveButton.textContent = "Saving...";
			setStatus("Caching this page and its images.");

			var persist = (navigator.storage && navigator.storage.persist)
				? navigator.storage.persist().catch(function () {})
				: Promise.resolve();

			persist.then(requestPageCache).then(function (result) {
				saveButton.disabled = false;
				saveButton.textContent = "Saved offline";
				if (result && result.failed > 0) {
					setStatus("Saved, with " + result.failed + " item(s) skipped.");
				} else {
					setStatus("This page is available offline.");
				}
			}).catch(function () {
				saveButton.disabled = false;
				saveButton.textContent = "Save page offline";
				setStatus("Could not save this page for offline use.");
			});
		});

		installButton.addEventListener("click", function () {
			if (!installPrompt) {
				return;
			}
			var promptEvent = installPrompt;
			installPrompt = null;
			installButton.hidden = true;
			promptEvent.prompt();
			promptEvent.userChoice.then(function () {
			}).catch(function () {
			});
		});

		if (isStandalone()) {
			installButton.hidden = true;
		}
	}

	function init() {
		mountFooter();
		updateConnectionState();
		window.addEventListener("online", updateConnectionState);
		window.addEventListener("offline", updateConnectionState);

		if (!("serviceWorker" in navigator) || location.protocol === "file:") {
			return;
		}

		if (saveButton) {
			saveButton.hidden = false;
		}
		if (installPrompt && installButton && !isStandalone()) {
			installButton.hidden = false;
		}

		ensureRegistration().then(function () {
			pageIsCached().then(function (cached) {
				if (!cached) {
					setTimeout(cacheCurrentPage, 2500);
				}
			});
		}).catch(function () {
		});
	}

	if (document.readyState === "loading") {
		document.addEventListener("DOMContentLoaded", init);
	} else {
		init();
	}
})();
