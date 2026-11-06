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
	TM.lang = function () {
		var params = new URLSearchParams(window.location.search);
		var requested = (params.get("lang") || "").toLowerCase();
		if (requested === "de" || requested === "en") return requested;
		var match = document.cookie.match(/(?:^|;\s*)tm_lang=(de|en)\b/);
		return match ? match[1] : "en";
	};
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

	function parseDateParam(raw) {
		if (!raw) return null;
		var date = null;
		var match = raw.match(/^(\d{1,2})\.(\d{1,2})\.(\d{2,4})$/);
		if (match) {
			var year = parseInt(match[3], 10);
			if (year < 100) year += 2000;
			date = new Date(year, parseInt(match[2], 10) - 1, parseInt(match[1], 10));
			if (date.getFullYear() !== year || date.getMonth() !== parseInt(match[2], 10) - 1 || date.getDate() !== parseInt(match[1], 10)) {
				return null;
			}
		} else {
			match = raw.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
			if (match) {
				date = new Date(parseInt(match[1], 10), parseInt(match[2], 10) - 1, parseInt(match[3], 10));
				if (date.getFullYear() !== parseInt(match[1], 10) || date.getMonth() !== parseInt(match[2], 10) - 1 || date.getDate() !== parseInt(match[3], 10)) {
					return null;
				}
			}
		}
		if (!date) {
			var parsed = Date.parse(raw);
			if (isNaN(parsed)) return null;
			date = new Date(parsed);
		}
		date.setHours(0, 0, 0, 0);
		return date;
	}

	TM.simDate = function () {
		var params = new URLSearchParams(window.location.search);
		var raw = params.get("date") || params.get("datum");
		return parseDateParam(raw) || new Date();
	};

	TM.prefersReduced = function () {
		return window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
	};

	TM.clamp = function (v, a, b) { return Math.min(b, Math.max(a, v)); };
	TM.lerp = function (a, b, t) { return a + (b - a) * t; };
	TM.ease = function (t) { return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2; };

	TM.typesetMath = function (root) {
		if (!window.temml) return;
		(root || document).querySelectorAll("[data-tex]").forEach(function (el) {
			if (el.getAttribute("data-tex-rendered") === "1") return;
			var tex = el.getAttribute("data-tex");
			var displayMode = el.getAttribute("data-tex-display") !== "false";
			try {
				el.innerHTML = temml.renderToString(tex, { displayMode: displayMode });
				el.setAttribute("data-tex-rendered", "1");
			} catch (e) {
				el.textContent = tex;
			}
		});
	};

	TM.colors = function () {
		var css = getComputedStyle(document.documentElement);
		var pick = function (name, fallback) {
			var v = css.getPropertyValue(name);
			return v ? v.trim() : fallback;
		};
		return {
			ink: pick("--tm-ink", "#000000"),
			inkSoft: pick("--tm-ink-soft", "#2c464d"),
			muted: pick("--tm-muted", "#627476"),
			faint: pick("--tm-faint", "#92a19a"),
			petrol: pick("--tm-petrol", "#004b6f"),
			blue: pick("--tm-blue", "#1275ac"),
			sky: pick("--tm-sky", "#5c9baf"),
			green: pick("--tm-green", "#63a44b"),
			greenDeep: pick("--tm-green-deep", "#004b6f"),
			lime: pick("--tm-lime", "#869b55"),
			gold: pick("--tm-gold", "#9f9700"),
			coral: pick("--tm-coral", "#9185be"),
			paper: pick("--tm-paper", "#ffffff"),
			paper2: pick("--tm-paper-2", "#ffffff"),
			card: pick("--tm-card", "#ffffff"),
			line: pick("--tm-line", "rgba(0,75,111,.15)"),
			lineStrong: pick("--tm-line-strong", "rgba(0,75,111,.28)"),
			dark: document.documentElement.getAttribute("data-theme") === "dark"
		};
	};

	TM.asset = function (path) {
		if (!path || /^[a-z][a-z0-9+.-]*:/i.test(path) || path.indexOf("//") === 0 || path.charAt(0) === "/" || path.charAt(0) === "#") {
			return path;
		}
		var pathname = window.location.pathname;
		var match = pathname.match(/^(.*\/)?asanai_blog_proxy(?:\.php)?$/);
		if (!match) return path;
		var logical = window.location.search.replace(/^\?/, "").split("?")[0];
		if (!logical) return path;
		try {
			var resolved = new URL(path, "http://proxy.local/" + logical);
			return (match[1] || "/") + "asanai_blog_proxy?" +
				resolved.pathname.replace(/^\/+/, "") + resolved.search + resolved.hash;
		} catch (e) {
			return path;
		}
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

	TM.numberLine = function (canvas, opts) {
		if (!canvas) return null;
		opts = opts || {};
		var api = TM.initCanvas(canvas, function (ctx, w, h) {
			var c = TM.colors();
			var points = opts.points || [];
			var ops = opts.ops || [];
			if (!points.length) return;
			var values = points.map(function (p) { return p.value; });
			var min = opts.min != null ? opts.min : Math.min.apply(null, values);
			var max = opts.max != null ? opts.max : Math.max.apply(null, values);
			if (min === max) { min -= 1; max += 1; }
			var padL = 42, padR = 42;
			var axisY = h * 0.64;
			function X(v) { return padL + (v - min) / (max - min) * (w - padL - padR); }
			ctx.clearRect(0, 0, w, h);
			ctx.strokeStyle = c.dark ? "rgba(238,247,244,.28)" : "rgba(0,75,111,.3)";
			ctx.lineWidth = 2;
			ctx.beginPath();
			ctx.moveTo(padL - 10, axisY);
			ctx.lineTo(w - padR + 10, axisY);
			ctx.stroke();
			ctx.fillStyle = ctx.strokeStyle;
			ctx.beginPath(); ctx.moveTo(padL - 14, axisY - 5); ctx.lineTo(padL - 4, axisY); ctx.lineTo(padL - 14, axisY + 5); ctx.fill();
			ctx.beginPath(); ctx.moveTo(w - padR + 14, axisY - 5); ctx.lineTo(w - padR + 4, axisY); ctx.lineTo(w - padR + 14, axisY + 5); ctx.fill();
			points.forEach(function (p) {
				var x = X(p.value);
				ctx.strokeStyle = c.dark ? "rgba(238,247,244,.36)" : "rgba(0,75,111,.36)";
				ctx.lineWidth = 1;
				ctx.beginPath(); ctx.moveTo(x, axisY - 7); ctx.lineTo(x, axisY + 7); ctx.stroke();
				ctx.beginPath(); ctx.arc(x, axisY, 6, 0, Math.PI * 2);
				ctx.fillStyle = p.color || c.green;
				ctx.fill();
				ctx.lineWidth = 2; ctx.strokeStyle = c.paper; ctx.stroke();
				ctx.fillStyle = c.ink;
				ctx.font = "700 11px Barlow, system-ui, sans-serif";
				ctx.textAlign = "center";
				ctx.fillText(p.label, x, axisY - 18);
				ctx.fillStyle = c.muted;
				ctx.font = "600 10px Barlow, system-ui, sans-serif";
				ctx.fillText(String(p.value), x, axisY + 24);
			});
			ops.forEach(function (op, i) {
				var y = 20 + i * 26;
				var x1 = X(op.from), x2 = X(op.to);
				var dir = x2 >= x1 ? 1 : -1;
				ctx.strokeStyle = op.color || c.blue;
				ctx.lineWidth = 1.6;
				ctx.beginPath(); ctx.moveTo(x1, y); ctx.lineTo(x2, y); ctx.stroke();
				ctx.fillStyle = op.color || c.blue;
				ctx.beginPath();
				ctx.moveTo(x2, y); ctx.lineTo(x2 - dir * 8, y - 4); ctx.lineTo(x2 - dir * 8, y + 4); ctx.fill();
				ctx.font = "600 10px Barlow, system-ui, sans-serif";
				ctx.textAlign = "center";
				ctx.fillText(op.label, (x1 + x2) / 2, y - 6);
			});
		});
		window.addEventListener("tm:theme", function () { api.redraw(); });
		return api;
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
		if (meta) meta.setAttribute("content", theme === "dark" ? "#071a22" : "#ffffff");
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
		document.querySelectorAll(".demo").forEach(function (n) {
			n.classList.add("is-in");
		});
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

	/* ── arrow-key navigation ──────────────────────────────── */

	function initArrowNav() {
		document.addEventListener("keydown", function (event) {
			if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
			var target = event.target;
			var tag = target && target.tagName ? target.tagName.toLowerCase() : "";
			if (tag === "input" || tag === "textarea" || tag === "select" || (target && target.isContentEditable)) return;
			var navs = Array.prototype.slice.call(document.querySelectorAll("[data-arrow-nav]"));
			if (!navs.length) return;
			var viewport = window.innerHeight || document.documentElement.clientHeight || 0;
			var best = null, bestRatio = 0, bestTop = Infinity;
			navs.forEach(function (nav) {
				var rect = nav.getBoundingClientRect();
				var visible = Math.min(rect.bottom, viewport) - Math.max(rect.top, 0);
				if (visible <= 0) return;
				var ratio = visible / Math.min(rect.height || 1, viewport || 1);
				if (ratio > bestRatio + 0.001 || (Math.abs(ratio - bestRatio) <= 0.001 && rect.top < bestTop)) {
					best = nav;
					bestRatio = ratio;
					bestTop = rect.top;
				}
			});
			if (!best) return;
			var selector = event.key === "ArrowLeft" ? "[data-arrow-prev]" : "[data-arrow-next]";
			var button = best.querySelector(selector);
			if (!button || button.disabled) return;
			event.preventDefault();
			button.click();
		});
	}

	/* ── embedded page height ──────────────────────────────── */

	function initHeightBridge() {
		if (window.parent === window) return;
		var last = -1;
		var scheduled = false;
		function send() {
			scheduled = false;
			var body = document.body;
			var html = document.documentElement;
			if (!body) return;
			var height = Math.ceil(Math.max(
				body.scrollHeight, body.offsetHeight,
				html.clientHeight, html.scrollHeight, html.offsetHeight
			));
			if (Math.abs(height - last) < 1) return;
			last = height;
			try {
				window.parent.postMessage({ type: "height", val: height }, "*");
			} catch (e) {}
		}
		function schedule() {
			if (scheduled) return;
			scheduled = true;
			requestAnimationFrame(send);
		}
		window.addEventListener("load", schedule);
		window.addEventListener("resize", schedule);
		if (window.ResizeObserver) {
			new ResizeObserver(schedule).observe(document.body);
		} else {
			setInterval(schedule, 1000);
		}
		if (document.fonts && document.fonts.ready) {
			document.fonts.ready.then(schedule);
		}
		schedule();
	}

	var DEMO_TYPES = {
		sampling: "generative", decoding: "interactive", predict: "interactive",
		linefit: "canvas", perceptron: "canvas", gradient: "plot",
		optimizer: "compare", polyfit: "plot", activation: "plot",
		datamix: "compare", filter: "stepper", convolution: "canvas",
		visionlayers: "canvas", receptive: "plot", vram: "calculator",
		budget: "calculator", retrieval: "compare", ragspace: "canvas",
		entropy: "plot", prompt: "generative", cot: "stepper",
		reasoning: "compare", timeline: "timeline", contamination: "plot",
		science: "plot", position: "canvas", trajectory: "canvas",
		bend: "canvas", headbudget: "plot", waveform: "canvas",
		align: "compare", preference: "compare", logitlens: "plot",
		residual: "plot", mary: "interactive", chinese: "interactive",
		ambiguity: "compare", verify: "calculator", citecheck: "compare",
		myths: "interactive", folds: "plot", negation: "compare"
	};
	var DEMO_TYPE_CLASS = /demo--(interactive|canvas|plot|stepper|timeline|calculator|compare|generative)/;

	function initDemoTypes() {
		document.querySelectorAll(".demo").forEach(function (n) {
			if (DEMO_TYPE_CLASS.test(n.className)) return;
			var type = n.getAttribute("data-demo-type");
			if (!type) {
				var slug = n.getAttribute("data-demo");
				if (slug && DEMO_TYPES[slug]) type = DEMO_TYPES[slug];
			}
			if (!type) {
				if (n.classList.contains("timeline-shell")) type = "timeline";
				else if (n.querySelector("canvas")) type = "canvas";
				else type = "interactive";
			}
			n.classList.add("demo--" + type);
		});
	}

	/* ── page chrome ───────────────────────────────────────── */

	function initPage() {
		initDemoTypes();
		initTheme();
		initReadbar();
		initReveal();
		initRail();
		initCompletion();
		TM.typesetMath();
		initArrowNav();
		initHeightBridge();

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
