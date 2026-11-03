"use strict";

// Offline support for the Toolkit and the Blog. Visited pages and the assets
// they loaded are cached, so the app opens without a network connection.
const CACHE_VERSION = "asanai-pwa-v2";
const STATIC_CACHE = CACHE_VERSION + "-static";
const RUNTIME_CACHE = CACHE_VERSION + "-runtime";
const OFFLINE_URL = new URL("offline.html", self.location.href).href;
const SCOPE_PATH = new URL(self.registration.scope).pathname;

const PRECACHE_URLS = [
	new URL("./", self.location.href).href,
	new URL("index.php", self.location.href).href,
	new URL("manifest.json", self.location.href).href,
	new URL("offline.html", self.location.href).href,
	new URL("favicon.ico", self.location.href).href,
	new URL("_gui/logo_small.png", self.location.href).href,
	new URL("_gui/red.svg", self.location.href).href,
	new URL("_gui/green.svg", self.location.href).href,
	new URL("_gui/orange.svg", self.location.href).href
];

// Paths relative to the service worker scope, so a deployment below a
// subdirectory (/asanai/) denies the same endpoints as a root deployment.
const DENY_PREFIXES = [
	"api/", "rag/", "stats", "feedback", "questions",
	// The course is a separate project. The Toolkit service worker must not
	// cache or offline it.
	"blog"
];

const STATIC_EXTENSIONS = [
	".js", ".css", ".png", ".jpg", ".jpeg", ".gif", ".svg", ".webp", ".ico",
	".woff", ".woff2", ".ttf", ".otf", ".wasm", ".json", ".txt", ".csv",
	".zip", ".mp3", ".mp4", ".webm", ".pdf"
];

function normalizedCacheUrl(raw_url) {
	try {
		const url = new URL(raw_url, self.location.href);

		// get_cached_json() appends a random cache_id to every JSON request.
		// Stripping it here keeps one cache entry per resource instead of one
		// per call; the fetch handler sends those requests through networkFirst.
		url.searchParams.delete("cache_id");

		if (url.pathname.indexOf("/traindata/index.php") !== -1) {
			url.searchParams.sort();
		}

		return url.href;
	} catch (e) {
		return raw_url;
	}
}

function hasCacheBuster(url) {
	return url.searchParams.has("cache_id");
}

function scopeRelativePath(pathname) {
	if (SCOPE_PATH !== "/" && pathname.indexOf(SCOPE_PATH) === 0) {
		return pathname.slice(SCOPE_PATH.length);
	}
	return pathname.replace(/^\/+/, "");
}

function isDatasetListing(url) {
	return url.pathname.indexOf("/traindata/index.php") !== -1;
}

function isDenied(url) {
	const relative = scopeRelativePath(url.pathname).toLowerCase();

	return DENY_PREFIXES.some(function (prefix) {
		return relative.indexOf(prefix) === 0;
	});
}

function isCacheableRequest(request) {
	const url = new URL(request.url);

	if (request.method !== "GET") return false;
	if (url.origin !== self.location.origin) return false;
	if (url.protocol !== "http:" && url.protocol !== "https:") return false;
	if (request.headers.get("range")) return false;
	if (isDenied(url)) return false;

	return true;
}

function isStaticAsset(url) {
	const pathname = url.pathname.toLowerCase();

	return STATIC_EXTENSIONS.some(function (extension) {
		return pathname.endsWith(extension);
	});
}

async function precache() {
	const cache = await caches.open(STATIC_CACHE);

	await Promise.allSettled(PRECACHE_URLS.map(function (url) {
		return cache.add(url);
	}));
}

async function pwaCleanup() {
	const keys = await caches.keys();

	await Promise.all(keys.filter(function (key) {
		return key.indexOf("asanai-pwa-") === 0 && key !== STATIC_CACHE && key !== RUNTIME_CACHE;
	}).map(function (key) {
		return caches.delete(key);
	}));

	await self.clients.claim();
}

async function putInCache(cache_name, request, response) {
	if (!response || !response.ok || response.type !== "basic") return;

	try {
		const cache = await caches.open(cache_name);
		await cache.put(normalizedCacheUrl(request.url), response.clone());
	} catch (e) {
		// Quota or opaque-cache errors must never break the page.
	}
}

async function cacheFirst(request) {
	const cached = await caches.match(normalizedCacheUrl(request.url));

	if (cached) return cached;

	try {
		const response = await fetch(request);
		await putInCache(RUNTIME_CACHE, request, response);

		return response;
	} catch (e) {
		// Data URLs use random cache-busting query strings (e.g. ?cache_id=…).
		// Offline, any cached variant of the same path is better than failing.
		const fallback = await caches.match(request, { ignoreSearch: true });

		if (fallback) return fallback;

		return new Response("", { status: 503, statusText: "Offline" });
	}
}

async function networkFirst(request, is_navigation) {
	try {
		const response = await fetch(request);
		await putInCache(RUNTIME_CACHE, request, response);
		maybePrefetchDataset(request, response);

		return response;
	} catch (e) {
		const url = new URL(request.url);
		let cached = await caches.match(normalizedCacheUrl(request.url));

		if (!cached && !isDatasetListing(url)) {
			cached = await caches.match(request, { ignoreSearch: true });
		}

		if (cached) return cached;

		if (is_navigation) {
			const offline = await caches.match(OFFLINE_URL);

			if (offline) return offline;

			return new Response("<h1>Offline</h1><p>This page was not cached yet.</p>", {
				headers: { "Content-Type": "text/html; charset=utf-8" },
				status: 503
			});
		}

		return new Response("", { status: 503, statusText: "Offline" });
	}
}

function maybePrefetchDataset(request, response) {
	try {
		const request_url = new URL(request.url);

		if (request_url.pathname.indexOf("/traindata/index.php") === -1) return;

		const dataset = request_url.searchParams.get("dataset");

		if (!dataset) return;

		response.clone().json().then(function (listing) {
			const urls = [];

			Object.keys(listing).forEach(function (category) {
				if (!Array.isArray(listing[category])) return;

				listing[category].forEach(function (file) {
					if (typeof file === "string" && file) {
						urls.push("traindata/" + dataset + "/" + category + "/" + file);
					}
				});
			});

			if (urls.length) cacheUrls(urls).catch(function () {}); // await not possible here
		}).catch(function () {});
	} catch (e) {
		// Dataset prefetch is best-effort.
	}
}

async function cacheUrls(urls) {
	const cache = await caches.open(RUNTIME_CACHE);
	const unique = [];

	for (const raw_url of urls) {
		try {
			const url = new URL(raw_url, self.location.href);

			if (url.origin !== self.location.origin) continue;
			if (url.protocol !== "http:" && url.protocol !== "https:") continue;
			if (isDenied(url)) continue;
			if (unique.indexOf(url.href) === -1) unique.push(url.href);
		} catch (e) {
			// Ignore malformed URLs from the page.
		}
	}

	let next_index = 0;

	async function work() {
		while (next_index < unique.length) {
			const url = unique[next_index++];

			try {
				const cache_key = normalizedCacheUrl(url);

				if (await cache.match(cache_key)) continue;

				const response = await fetch(url, { credentials: "same-origin" });

				if (response.ok) {
					await cache.put(cache_key, response.clone());
					maybePrefetchDataset({ url: url }, response);
				}
			} catch (e) {
				// A single missing asset must not abort the rest.
			}
		}
	}

	await Promise.all([work(), work(), work(), work(), work(), work()]);
}

self.addEventListener("install", function (event) {
	self.skipWaiting();
	event.waitUntil(precache()); // await not possible here
});

self.addEventListener("activate", function (event) {
	event.waitUntil(pwaCleanup()); // await not possible here
});

self.addEventListener("message", function (event) {
	const data = event.data || {};

	if (data.type === "cache-urls" && Array.isArray(data.urls)) {
		event.waitUntil(cacheUrls(data.urls)); // await not possible here
	}
});

self.addEventListener("fetch", function (event) {
	const request = event.request;

	if (!isCacheableRequest(request)) return;

	const url = new URL(request.url);

	if (request.mode === "navigate") {
		event.respondWith(networkFirst(request, true));
		return;
	}

	if (hasCacheBuster(url)) {
		event.respondWith(networkFirst(request, false));
		return;
	}

	if (isStaticAsset(url)) {
		event.respondWith(cacheFirst(request));
		return;
	}

	event.respondWith(networkFirst(request, false));
});
