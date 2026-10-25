/* TEN MINUTES — shared behaviour. No dependencies. */
(function () {
	"use strict";

	var TM = window.TM = window.TM || {};
	var storage = {
		get: function (key, fallback) {
			try {
				var raw = localStorage.getItem(key);
				return raw === null ? fallback : JSON.parse(raw);
			} catch (e) { return fallback; }
		},
		set: function (key, value) {
			try { localStorage.setItem(key, JSON.stringify(value)); } catch (e) {}
		},
		remove: function (key) {
			try { localStorage.removeItem(key); } catch (e) {}
		}
	};

	TM.storage = storage;
	TM.done = function () { return storage.get("tm_done", []); };
	TM.isDone = function (slug) { return TM.done().indexOf(slug) !== -1; };
	TM.markDone = function (slug) {
		if (!slug) return;
		var list = TM.done();
		if (list.indexOf(slug) === -1) {
			list.push(slug);
			storage.set("tm_done", list);
		}
	};
	TM.markSeen = function (slug) {
		if (!slug) return;
		storage.set("tm_last", { slug: slug, title: document.title, at: Date.now() });
	};

	TM.prefersReduced = function () {
		return window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
	};

	TM.clamp = function (v, a, b) { return Math.min(b, Math.max(a, v)); };
	TM.lerp = function (a, b, t) { return a + (b - a) * t; };
	TM.ease = function (t) { return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2; };

	TM.colors = function () {
		var css = getComputedStyle(document.documentElement);
		var pick = function (name, fallback) {
			var v = css.getPropertyValue(name);
			return v ? v.trim() : fallback;
		};
		return {
			ink: pick("--tm-ink", "#12262d"),
			inkSoft: pick("--tm-ink-soft", "#2c464d"),
			muted: pick("--tm-muted", "#627476"),
			faint: pick("--tm-faint", "#8a9a99"),
			petrol: pick("--tm-petrol", "#004b6f"),
			blue: pick("--tm-blue", "#0074ac"),
			sky: pick("--tm-sky", "#39a9d6"),
			green: pick("--tm-green", "#71bd56"),
			greenDeep: pick("--tm-green-deep", "#3f8c2f"),
			lime: pick("--tm-lime", "#b9df6a"),
			gold: pick("--tm-gold", "#d4a13c"),
			coral: pick("--tm-coral", "#df785f"),
			paper: pick("--tm-paper", "#f7f3e8"),
			paper2: pick("--tm-paper-2", "#fdfbf4"),
			card: pick("--tm-card", "#fffdf7"),
			line: pick("--tm-line", "rgba(0,75,111,.15)"),
			lineStrong: pick("--tm-line-strong", "rgba(0,75,111,.28)"),
			dark: document.documentElement.getAttribute("data-theme") === "dark"
		};
	};

	TM.initCanvas = function (canvas, draw) {
		var ctx = canvas.getContext("2d");
		var raf = null;
		var lastW = 0, lastH = 0, lastDpr = 0;
		function paint() {
			raf = null;
			var rect = canvas.getBoundingClientRect();
			if (!rect.width) return;
			var dpr = Math.min(window.devicePixelRatio || 1, 2);
			if (rect.width !== lastW || rect.height !== lastH || dpr !== lastDpr) {
				canvas.width = Math.round(rect.width * dpr);
				canvas.height = Math.round(rect.height * dpr);
				lastW = rect.width;
				lastH = rect.height;
				lastDpr = dpr;
			}
			ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
			draw(ctx, rect.width, rect.height);
		}
		function request() {
			if (raf === null) raf = requestAnimationFrame(paint);
		}
		if (window.ResizeObserver) {
			new ResizeObserver(request).observe(canvas);
		} else {
			window.addEventListener("resize", request);
		}
		request();
		return { redraw: request, ctx: ctx };
	};

	TM.roundRect = function (ctx, x, y, w, h, r) {
		var rr = Math.min(r, Math.abs(w) / 2, Math.abs(h) / 2);
		ctx.beginPath();
		ctx.moveTo(x + rr, y);
		ctx.arcTo(x + w, y, x + w, y + h, rr);
		ctx.arcTo(x + w, y + h, x, y + h, rr);
		ctx.arcTo(x, y + h, x, y, rr);
		ctx.arcTo(x, y, x + w, y, rr);
		ctx.closePath();
	};

	/* ── theme ─────────────────────────────────────────────── */

	function applyTheme(theme) {
		document.documentElement.setAttribute("data-theme", theme);
		var meta = document.querySelector('meta[name="theme-color"]');
		if (meta) meta.setAttribute("content", theme === "dark" ? "#071a22" : "#f7f3e8");
		document.querySelectorAll("[data-theme-toggle]").forEach(function (btn) {
			btn.setAttribute("aria-label", theme === "dark" ? "Switch to light mode" : "Switch to dark mode");
			btn.setAttribute("title", theme === "dark" ? "Light mode" : "Dark mode");
		});
	}

	function initTheme() {
		var saved = null;
		try { saved = localStorage.getItem("tm_theme"); } catch (e) {}
		var theme = saved === "dark" ? "dark" : "light";
		applyTheme(theme);
		document.querySelectorAll("[data-theme-toggle]").forEach(function (btn) {
			btn.addEventListener("click", function () {
				var next = document.documentElement.getAttribute("data-theme") === "dark" ? "light" : "dark";
				applyTheme(next);
				try { localStorage.setItem("tm_theme", next); } catch (e) {}
				window.dispatchEvent(new CustomEvent("tm:theme", { detail: { theme: next } }));
			});
		});
	}

	/* ── reading progress ──────────────────────────────────── */

	function initReadbar() {
		var bar = document.querySelector(".readbar span");
		if (!bar) return;
		var ticking = false;
		function update() {
			ticking = false;
			var doc = document.documentElement;
			var max = doc.scrollHeight - window.innerHeight;
			var pct = max > 0 ? TM.clamp(window.scrollY / max, 0, 1) : 0;
			bar.style.width = (pct * 100).toFixed(2) + "%";
		}
		window.addEventListener("scroll", function () {
			if (!ticking) { ticking = true; requestAnimationFrame(update); }
		}, { passive: true });
		update();
	}

	/* ── reveal ────────────────────────────────────────────── */

	function initReveal() {
		var nodes = document.querySelectorAll("[data-reveal]");
		if (!nodes.length) return;
		if (TM.prefersReduced() || !("IntersectionObserver" in window)) {
			nodes.forEach(function (n) { n.classList.add("is-in"); });
			return;
		}
		var io = new IntersectionObserver(function (entries) {
			entries.forEach(function (entry) {
				if (entry.isIntersecting) {
					entry.target.classList.add("is-in");
					io.unobserve(entry.target);
				}
			});
		}, { rootMargin: "0px 0px -8% 0px", threshold: 0.08 });
		nodes.forEach(function (n) { io.observe(n); });
	}

	/* ── section rail ──────────────────────────────────────── */

	function initRail() {
		var links = Array.prototype.slice.call(document.querySelectorAll(".rail-nav a[href^='#']"));
		if (!links.length || !("IntersectionObserver" in window)) return;
		var map = {};
		links.forEach(function (a) {
			var id = a.getAttribute("href").slice(1);
			var sec = document.getElementById(id);
			if (sec) map[id] = a;
		});
		var io = new IntersectionObserver(function (entries) {
			entries.forEach(function (entry) {
				if (!entry.isIntersecting) return;
				links.forEach(function (a) { a.classList.remove("is-active"); });
				var active = map[entry.target.id];
				if (active) active.classList.add("is-active");
			});
		}, { rootMargin: "-20% 0px -65% 0px", threshold: 0 });
		Object.keys(map).forEach(function (id) { io.observe(document.getElementById(id)); });
	}

	/* ── completion ────────────────────────────────────────── */

	function initCompletion() {
		var slug = document.body.getAttribute("data-lesson");
		if (!slug) return;
		var marked = false;
		function check() {
			if (marked) return;
			var doc = document.documentElement;
			if (window.scrollY + window.innerHeight >= doc.scrollHeight - 260) {
				marked = true;
				TM.markDone(slug);
				window.removeEventListener("scroll", check);
			}
		}
		window.addEventListener("scroll", check, { passive: true });
		setTimeout(check, 400);
	}

	/* ── page chrome ───────────────────────────────────────── */

	function initPage() {
		initTheme();
		initReadbar();
		initReveal();
		initRail();
		initCompletion();

		var slug = document.body.getAttribute("data-lesson");
		if (slug) TM.markSeen(slug);

		document.querySelectorAll("[data-copy]").forEach(function (btn) {
			btn.addEventListener("click", function () {
				var target = document.querySelector(btn.getAttribute("data-copy"));
				if (!target) return;
				var text = target.value !== undefined ? target.value : target.textContent;
				if (navigator.clipboard) {
					navigator.clipboard.writeText(text).then(function () {
						var old = btn.textContent;
						btn.textContent = "Copied";
						setTimeout(function () { btn.textContent = old; }, 1400);
					});
				}
			});
		});

		var current = new URLSearchParams(location.search).get("day");
		if (current) {
			var el = document.getElementById("day-" + current);
			if (el) setTimeout(function () { el.scrollIntoView({ behavior: "smooth", block: "center" }); }, 200);
		}
	}

	if (document.readyState === "loading") {
		document.addEventListener("DOMContentLoaded", initPage);
	} else {
		initPage();
	}
})();
