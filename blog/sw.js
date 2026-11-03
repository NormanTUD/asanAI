"use strict";

// Bump this whenever the cache layout or a stable-URL index changes. The
// activate handler deletes every asanai-blog-* cache with another version.
const CACHE_VERSION = "2";
const SHELL_CACHE = "asanai-blog-shell-v" + CACHE_VERSION;
const PAGES_CACHE = "asanai-blog-pages-v" + CACHE_VERSION;
const ASSETS_CACHE = "asanai-blog-assets-v" + CACHE_VERSION;
const CACHE_PREFIX = "asanai-blog-";
const MAX_PAGES = 400;
const MAX_ASSETS = 4000;
const NETWORK_TIMEOUT = 6000;
const BATCH_SIZE = 6;
const STORAGE_TRIGGER_RATIO = 0.8;
const STORAGE_TARGET_RATIO = 0.6;
const STORAGE_CHECK_DELAY = 5000;
let storageCheckTimer = null;

const SCOPE_URL = new URL(self.registration.scope);
const OFFLINE_URL = new URL("offline.html", SCOPE_URL).href;

const EXCLUDED_PREFIXES = [
	"rag_data/",
	"tools/",
	"analytics_data/",
	"darkmode-ci/",
	"tests/",
	"todo/",
	"test/",
	"api/",
	"lib/",
];

const EXCLUDED_FILES = new Set([
	"track.php",
	"feedback_track.php",
	"ask.php",
	"search.php",
	"websearch.php",
	"vectorsearch.php",
	"stats.php",
	"stats",
	"questions.php",
	"questions",
	"feedback.php",
	"feedback",
	"asanai_blog_proxy.php",
	"sw.js",
]);

const PRECACHE = [
	new URL("./", SCOPE_URL).href,
	new URL("index.php", SCOPE_URL).href,
	OFFLINE_URL,
	new URL("manifest.webmanifest", SCOPE_URL).href,
	new URL("pwa/icon-192.png", SCOPE_URL).href,
	new URL("pwa/icon-512.png", SCOPE_URL).href,
	new URL("pwa/icon-maskable-512.png", SCOPE_URL).href,
];

function relativePath(url) {
	const path = url.pathname;
	if (path.startsWith(SCOPE_URL.pathname)) {
		return path.slice(SCOPE_URL.pathname.length);
	}
	return path.replace(/^\/+/, "");
}

function pageCacheKeys(url) {
	const keys = new Set([url.href]);
	try {
		const parsed = new URL(url.href);
		const alias = new URL(parsed.href);
		if (parsed.pathname.endsWith("/")) {
			keys.add(new URL("index.php", parsed).href);
		} else if (parsed.pathname.endsWith("/index.php")) {
			keys.add(new URL("./", parsed).href);
		} else if (parsed.pathname.endsWith(".php")) {
			alias.pathname = alias.pathname.slice(0, -4);
			keys.add(alias.href);
		} else {
			alias.pathname += ".php";
			keys.add(alias.href);
		}
	} catch (error) {
	}
	return keys;
}

function isCacheable(url) {
	if (url.origin !== self.location.origin) {
		return false;
	}
	if (url.protocol !== "http:" && url.protocol !== "https:") {
		return false;
	}
	const rel = relativePath(url).toLowerCase();
	if (EXCLUDED_PREFIXES.some(function (prefix) {
		return rel.startsWith(prefix);
	})) {
		return false;
	}
	const basename = rel.split("/").pop();
	if (EXCLUDED_FILES.has(basename)) {
		return false;
	}
	return true;
}

function fetchWithTimeout(request, timeout) {
	return new Promise(function (resolve, reject) {
		const timer = setTimeout(function () {
			reject(new Error("network timeout"));
		}, timeout);
		fetch(request).then(function (response) {
			clearTimeout(timer);
			resolve(response);
		}, function (error) {
			clearTimeout(timer);
			reject(error);
		});
	});
}

async function trimCache(cache, maxEntries) {
	try {
		const keys = await cache.keys();
		const excess = keys.length - maxEntries;
		for (let i = 0; i < excess; i += 1) {
			await cache.delete(keys[i]);
		}
	} catch (error) {
	}
}

async function putIfCacheable(cache, key, response, maxEntries) {
	if (!response || response.status !== 200 || response.type !== "basic") {
		return false;
	}
	try {
		await cache.put(key, response);
		await trimCache(cache, maxEntries);
		return true;
	} catch (error) {
		return false;
	}
}

function collectHtmlAssetUrls(html, baseUrl) {
	const urls = new Set();

	function add(value) {
		if (!value) {
			return;
		}
		try {
			const url = new URL(value.replace(/&amp;/g, "&"), baseUrl);
			if (url.origin === self.location.origin && isCacheable(url)) {
				urls.add(url.href);
			}
		} catch (error) {
		}
	}

	const patterns = [
		/<script\b[^>]*\bsrc\s*=\s*["']([^"']+)["']/gi,
		/<link\b[^>]*\bhref\s*=\s*["']([^"']+)["']/gi,
		/<img\b[^>]*\bsrc\s*=\s*["']([^"']+)["']/gi,
		/<source\b[^>]*\bsrc\s*=\s*["']([^"']+)["']/gi,
	];
	patterns.forEach(function (pattern) {
		let match = pattern.exec(html);
		while (match !== null) {
			add(match[1]);
			match = pattern.exec(html);
		}
	});

	const srcsetPattern = /<(?:img|source)\b[^>]*\bsrcset\s*=\s*["']([^"']+)["']/gi;
	let srcset = srcsetPattern.exec(html);
	while (srcset !== null) {
		srcset[1].split(",").forEach(function (part) {
			add(part.trim().split(/\s+/)[0]);
		});
		srcset = srcsetPattern.exec(html);
	}

	return Array.from(urls);
}

async function cacheAssetUrls(cache, list) {
	let total = 0;
	let cached = 0;
	let failed = 0;

	for (let offset = 0; offset < list.length; offset += BATCH_SIZE) {
		const batch = list.slice(offset, offset + BATCH_SIZE);
		await Promise.all(batch.map(async function (href) {
			total += 1;
			try {
				if (await cache.match(href)) {
					cached += 1;
					return;
				}
				const response = await fetch(href);
				if (await putIfCacheable(cache, href, response, MAX_ASSETS)) {
					cached += 1;
				} else {
					failed += 1;
				}
			} catch (error) {
				failed += 1;
			}
		}));
	}

	return { total: total, cached: cached, failed: failed };
}

async function cacheNavigation(cache, request, response) {
	const keys = pageCacheKeys(new URL(request.url));
	try {
		const finalUrl = new URL(response.url);
		if (finalUrl.origin === self.location.origin) {
			pageCacheKeys(finalUrl).forEach(function (key) {
				keys.add(key);
			});
		}
	} catch (error) {
	}
	for (const key of keys) {
		await putIfCacheable(cache, key, response.clone(), MAX_PAGES);
	}
}

async function matchCachedPage(cache, request) {
	const cached = await cache.match(request, { ignoreSearch: true });
	if (cached) {
		return cached;
	}
	const anyCache = await caches.match(request, { ignoreSearch: true });
	if (anyCache) {
		return anyCache;
	}
	const url = new URL(request.url);
	const rel = relativePath(url).replace(/\/$/, "");
	if (rel === "" || rel === "index.php") {
		const home = await caches.match(new URL("./", SCOPE_URL).href);
		if (home) {
			return home;
		}
	}
	return null;
}

async function handleNavigation(event, request) {
	const cache = await caches.open(PAGES_CACHE);
	try {
		const response = await fetchWithTimeout(request, NETWORK_TIMEOUT);
		if (response && response.ok) {
			event.waitUntil(cacheNavigation(cache, request, response.clone()));
			return response;
		}
		if (response && response.status >= 500) {
			const cached = await matchCachedPage(cache, request);
			if (cached) {
				return cached;
			}
		}
		return response;
	} catch (error) {
		const cached = await matchCachedPage(cache, request);
		if (cached) {
			return cached;
		}
		const fallback = await caches.match(OFFLINE_URL);
		if (fallback) {
			return fallback;
		}
		return new Response("Offline", {
			status: 503,
			headers: { "Content-Type": "text/plain; charset=utf-8" },
		});
	}
}

async function refreshAsset(cache, request) {
	try {
		const response = await fetch(request);
		if (response && response.status === 200 && response.type === "basic") {
			await cache.put(request, response.clone());
		}
	} catch (error) {
	}
}

async function handleAsset(event, request) {
	const cache = await caches.open(ASSETS_CACHE);
	const cached = await cache.match(request);
	if (cached) {
		event.waitUntil(refreshAsset(cache, request));
		return cached;
	}
	try {
		const response = await fetch(request);
		if (response && response.status === 200 && response.type === "basic") {
			event.waitUntil(putIfCacheable(cache, request, response.clone(), MAX_ASSETS));
		}
		return response;
	} catch (error) {
		return new Response("", {
			status: 504,
			statusText: "Offline",
		});
	}
}

async function cachePage(pageUrl, assetUrls) {
	const pageCache = await caches.open(PAGES_CACHE);
	const assetCache = await caches.open(ASSETS_CACHE);
	let total = 0;
	let cached = 0;
	let failed = 0;
	let page = null;

	try {
		page = new URL(pageUrl, SCOPE_URL);
	} catch (error) {
		page = null;
	}

	if (page && isCacheable(page)) {
		total += 1;
		try {
			const response = await fetch(page.href, {
				cache: "reload",
				credentials: "same-origin",
				headers: { Purpose: "prefetch" },
			});
			const keys = pageCacheKeys(page);
			try {
				pageCacheKeys(new URL(response.url)).forEach(function (key) {
					keys.add(key);
				});
			} catch (error) {
			}
			let stored = false;
			for (const key of keys) {
				if (await putIfCacheable(pageCache, key, response.clone(), MAX_PAGES)) {
					stored = true;
				}
			}
			if (stored) {
				cached += 1;
			} else {
				failed += 1;
			}
		} catch (error) {
			failed += 1;
		}
	}

	const uniqueAssets = new Set();
	(assetUrls || []).forEach(function (raw) {
		try {
			const url = new URL(raw, page ? page.href : SCOPE_URL);
			if (page && url.href === page.href) {
				return;
			}
			if (!isCacheable(url)) {
				return;
			}
			uniqueAssets.add(url.href);
		} catch (error) {
		}
	});

	const assetResult = await cacheAssetUrls(assetCache, Array.from(uniqueAssets));
	total += assetResult.total;
	cached += assetResult.cached;
	failed += assetResult.failed;

	return { total: total, cached: cached, failed: failed };
}

self.addEventListener("install", function (event) {
	event.waitUntil((async function () {
		const cache = await caches.open(SHELL_CACHE);
		const homeUrl = new URL("./", SCOPE_URL).href;
		await Promise.all(PRECACHE.map(async function (url) {
			try {
				const response = await fetch(url, {
					cache: "reload",
					headers: { Purpose: "prefetch" },
				});
				if (!response || !response.ok) {
					return;
				}
				if (url === homeUrl) {
					const html = await response.clone().text();
					await cache.put(url, response);
					const assets = collectHtmlAssetUrls(html, url);
					const assetCache = await caches.open(ASSETS_CACHE);
					await cacheAssetUrls(assetCache, assets);
					return;
				}
				await cache.put(url, response);
			} catch (error) {
			}
		}));
		await self.skipWaiting();
	})());
});

self.addEventListener("activate", function (event) {
	event.waitUntil((async function () {
		const keys = await caches.keys();
		await Promise.all(keys.map(function (key) {
			if (key.startsWith(CACHE_PREFIX) && key !== SHELL_CACHE && key !== PAGES_CACHE && key !== ASSETS_CACHE) {
				return caches.delete(key);
			}
			return Promise.resolve(false);
		}));
		await self.clients.claim();
	})());
});

self.addEventListener("fetch", function (event) {
	const request = event.request;
	if (request.method !== "GET") {
		return;
	}
	if (request.headers.has("range")) {
		return;
	}
	let url;
	try {
		url = new URL(request.url);
	} catch (error) {
		return;
	}
	if (!isCacheable(url)) {
		return;
	}
	if (request.mode === "navigate") {
		event.respondWith(handleNavigation(event, request));
		return;
	}
	event.respondWith(handleAsset(event, request));
});

self.addEventListener("message", function (event) {
	const data = event.data || {};
	if (data.type === "SKIP_WAITING") {
		self.skipWaiting();
		return;
	}
	if (data.type !== "CACHE_PAGE") {
		return;
	}
	event.waitUntil(cachePage(data.page, data.assets).then(function (result) {
		if (event.ports && event.ports[0]) {
			event.ports[0].postMessage(Object.assign({ type: "CACHE_PAGE_DONE" }, result));
		}
	}));
});
