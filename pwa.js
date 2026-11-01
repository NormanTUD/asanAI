"use strict";

// Registers the service worker and asks it to cache everything this page
// loaded. Both the Toolkit and the Blog include this file.
(function () {
	if (!("serviceWorker" in navigator)) return;

	var is_secure = location.protocol === "https:" ||
		location.hostname === "localhost" ||
		location.hostname === "127.0.0.1" ||
		location.hostname === "[::1]";

	if (!is_secure) return;

	var script_element = document.currentScript;
	var service_worker_url;

	try {
		service_worker_url = new URL("sw.js", script_element ? script_element.src : location.href);
	} catch (e) {
		return;
	}

	var last_sent_at = 0;

	function collect_urls() {
		var seen = {};
		var urls = [];

		function add(raw_url) {
			try {
				var url = new URL(raw_url, location.href);

				url.pathname = url.pathname.replace(/\/{2,}/g, "/");

				if (url.origin !== location.origin) return;
				if (url.protocol !== "http:" && url.protocol !== "https:") return;
				if (seen[url.href]) return;

				seen[url.href] = true;
				urls.push(url.href);
			} catch (e) {
				// Ignore malformed performance entries.
			}
		}

		try {
			performance.getEntriesByType("resource").forEach(function (entry) {
				add(entry.name);
			});
		} catch (e) {
			// Performance API is optional.
		}

		add(location.href);

		collect_dataset_files().forEach(add);

		return urls.slice(0, 500);
	}

	function collect_dataset_files() {
		var urls = [];

		try {
			if (typeof traindata_struct !== "object" || !traindata_struct) return urls;

			Object.keys(traindata_struct).forEach(function (name) {
				var entry = traindata_struct[name] || {};
				var filename = entry.filename;

				if (typeof filename === "string" && filename && filename.indexOf("get_") !== 0) {
					urls.push(filename);
					urls.push(filename.replace(/\.json$/, "_keras.json"));
				}

				if (typeof entry.data === "string" && entry.data) urls.push(entry.data);

				if (entry.weights_file && typeof entry.weights_file === "object") {
					Object.keys(entry.weights_file).forEach(function (key) {
						if (entry.weights_file[key]) urls.push(entry.weights_file[key]);

						urls.push("traindata/" + key + "/x.txt");
						urls.push("traindata/" + key + "/y.txt");
						urls.push("traindata/" + key + "/examples.json");
						urls.push("traindata/index.php?dataset=" + encodeURIComponent(key) + "&max_number_of_files_per_category=20");
						urls.push("traindata/index.php?dataset=" + encodeURIComponent(key) + "&max_number_of_files_per_category=1");
					});
				}

				urls.push("traindata/" + name + "/x.txt");
				urls.push("traindata/" + name + "/y.txt");
				urls.push("traindata/index.php?dataset=" + encodeURIComponent(name) + "&max_number_of_files_per_category=20");
				urls.push("traindata/index.php?dataset=" + encodeURIComponent(name) + "&max_number_of_files_per_category=1");
			});

			// Architecture presets (and, xor, …) have their own small data files.
			document.querySelectorAll("#model_dataset option").forEach(function (option) {
				var model_dataset = option.value;

				if (!model_dataset) return;

				urls.push("traindata/" + model_dataset + "/x.txt");
				urls.push("traindata/" + model_dataset + "/y.txt");
				urls.push("traindata/" + model_dataset + "/examples.json");
			});
		} catch (e) {
			// The dataset registry may not exist yet; the next send retries.
		}

		return urls;
	}

	function send_urls() {
		var now = Date.now();

		if (now - last_sent_at < 1000) return;

		last_sent_at = now;

		navigator.serviceWorker.ready.then(function (registration) {
			var worker = navigator.serviceWorker.controller || registration.active;

			if (!worker) return;

			worker.postMessage({ type: "cache-urls", urls: collect_urls() });
		}).catch(function () {
			// Registration failed; the page still works online.
		});
	}

	function schedule_send() {
		// The app and datasets load assets at different times during boot. Send
		// the current resource list a few times; the service worker skips URLs
		// that are already cached.
		[600, 3000, 10000, 25000].forEach(function (delay) {
			setTimeout(send_urls, delay);
		});
	}

	document.addEventListener("visibilitychange", function () {
		if (document.visibilityState === "hidden") send_urls();
	});

	navigator.serviceWorker.register(service_worker_url.href).then(function () {
		navigator.serviceWorker.addEventListener("controllerchange", send_urls);
	}).catch(function (error) {
		if (window.console && console.debug) {
			console.debug("[pwa] service worker registration failed", error);
		}
	});

	if (document.readyState === "complete") {
		schedule_send();
	} else {
		window.addEventListener("load", schedule_send);
	}
})();
