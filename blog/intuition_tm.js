/* Shared helpers for the interactive demos on the intuition lesson.
   Trimmed from the Ten Minutes page and adapted to the blog theme:
   the page is English-only and follows html.dark via #tm-intuition.tm-dark. */
(function () {
	"use strict";

	var TM = window.TM = window.TM || {};

	TM.lang = function () { return "en"; };
	TM.prefersReduced = function () {
		return window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
	};
	TM.clamp = function (v, a, b) { return Math.min(b, Math.max(a, v)); };
	TM.lerp = function (a, b, t) { return a + (b - a) * t; };
	TM.ease = function (t) { return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2; };

	TM.ensureECharts = function (cb, err) {
		if (window.echarts && window.echarts.init) {
			window.__tmEchartsGlReady = true;
			cb();
			return;
		}
		if (err) err();
	};

	TM.typesetMath = function (root) {
		if (!window.temml) return;
		(root || document).querySelectorAll("[data-tex]:not(math)").forEach(function (el) {
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
		var root = document.getElementById("tm-intuition") || document.documentElement;
		var css = getComputedStyle(root);
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
			dark: root.classList.contains("tm-dark")
		};
	};

	TM.initCanvas = function (canvas, draw, options) {
		options = options || {};
		var ctx = canvas.getContext("2d");
		var raf = null;
		var lastW = 0, lastH = 0, lastDpr = 0;
		var visible = false;
		var drawn = false;
		var dirty = true;
		var loading = false;
		var loaderRaf = null;
		var loaderStart = 0;
		var loaderUpdate = false;
		var pendingSpinner = true;
		var minLoader = options.minLoader == null ? 150 : options.minLoader;
		var rootMargin = options.rootMargin || "700px 0px";
		var margin = parseInt(rootMargin, 10) || 700;
		var reduce = TM.prefersReduced();
		var checkRaf = null;

		function measure() {
			var rect = canvas.getBoundingClientRect();
			if (!rect.width || !rect.height) return null;
			var dpr = Math.min(window.devicePixelRatio || 1, 2);
			if (rect.width !== lastW || rect.height !== lastH || dpr !== lastDpr) {
				canvas.width = Math.round(rect.width * dpr);
				canvas.height = Math.round(rect.height * dpr);
				lastW = rect.width;
				lastH = rect.height;
				lastDpr = dpr;
			}
			ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
			return rect;
		}
		function label() { return loaded() ? "Updating …" : "Loading …"; }
		function loaded() { return drawn; }
		function drawLoader(now) {
			var rect = measure();
			if (!rect) return;
			var c = TM.colors();
			var text = label();
			ctx.clearRect(0, 0, rect.width, rect.height);
			ctx.font = "600 11px system-ui, sans-serif";
			var tw = ctx.measureText(text).width;
			var r = 6;
			var padX = 12;
			var gap = 8;
			var pillW = padX * 2 + r * 2 + gap + tw;
			var pillH = 30;
			var x, y;
			if (loaderUpdate && drawn) {
				x = Math.max(8, rect.width - pillW - 10);
				y = 10;
			} else {
				x = Math.max(8, (rect.width - pillW) / 2);
				y = Math.max(8, (rect.height - pillH) / 2);
			}
			ctx.fillStyle = c.dark ? "rgba(15, 23, 42, 0.92)" : "rgba(253, 250, 241, 0.94)";
			ctx.strokeStyle = c.lineStrong;
			ctx.lineWidth = 1;
			TM.roundRect(ctx, x, y, pillW, pillH, 15);
			ctx.fill();
			ctx.stroke();
			var cx = x + padX + r;
			var cy = y + pillH / 2;
			var angle = (((now || performance.now()) - loaderStart) / 1000) * 5;
			ctx.strokeStyle = c.green;
			ctx.lineWidth = 2;
			ctx.beginPath();
			ctx.arc(cx, cy, r, angle, angle + Math.PI * 1.4);
			ctx.stroke();
			ctx.fillStyle = c.muted;
			ctx.textAlign = "left";
			ctx.textBaseline = "middle";
			ctx.fillText(text, cx + r + gap, cy + 0.5);
			ctx.textBaseline = "alphabetic";
		}
		function loaderLoop(now) {
			if (!loading || !visible) {
				loaderRaf = null;
				return;
			}
			drawLoader(now);
			loaderRaf = requestAnimationFrame(loaderLoop);
		}
		function paintGraphic() {
			var rect = measure();
			if (!rect) return false;
			draw(ctx, rect.width, rect.height);
			return true;
		}
		function finishLoad() {
			loading = false;
			if (loaderRaf) {
				cancelAnimationFrame(loaderRaf);
				loaderRaf = null;
			}
			if (!visible) {
				dirty = true;
				return;
			}
			if (paintGraphic()) {
				drawn = true;
				dirty = false;
			}
		}
		function startLoad(update) {
			if (!visible) {
				dirty = true;
				return;
			}
			if (loading) {
				dirty = true;
				loaderUpdate = loaderUpdate || update;
				return;
			}
			if (!drawn) update = false;
			dirty = true;
			loading = true;
			loaderUpdate = update;
			loaderStart = performance.now();
			if (reduce) {
				finishLoad();
				return;
			}
			if (!loaderRaf) loaderRaf = requestAnimationFrame(loaderLoop);
			setTimeout(finishLoad, minLoader);
		}
		function request(opts) {
			opts = opts || {};
			var show = opts.spinner === true;
			if (!visible) {
				dirty = true;
				pendingSpinner = pendingSpinner || opts.spinner !== false;
				return;
			}
			if (loading) {
				dirty = true;
				return;
			}
			if (!drawn) {
				startLoad(false);
				return;
			}
			if (show) {
				startLoad(true);
				return;
			}
			dirty = true;
			if (raf === null) {
				raf = requestAnimationFrame(function () {
					raf = null;
					if (!visible) return;
					if (paintGraphic()) {
						drawn = true;
						dirty = false;
					}
				});
			}
		}
		function layout() {
			if (!visible) {
				dirty = true;
				pendingSpinner = true;
				return;
			}
			if (!drawn) startLoad(false);
			else request({ spinner: false });
		}
		function activate() {
			if (!visible) return;
			if (!drawn || dirty) {
				if (pendingSpinner || !drawn) startLoad(drawn);
				else request({ spinner: false });
			}
			pendingSpinner = false;
		}
		function setVisible(next) {
			if (visible === next) return;
			visible = next;
			if (visible) activate();
		}
		function inView() {
			var rect = canvas.getBoundingClientRect();
			return rect.bottom >= -margin && rect.top <= window.innerHeight + margin;
		}
		function check() {
			checkRaf = null;
			setVisible(inView());
		}
		function queueCheck() {
			if (checkRaf === null) checkRaf = requestAnimationFrame(check);
		}
		if (window.ResizeObserver) {
			canvas.__tmResizeObserver = new ResizeObserver(layout);
			canvas.__tmResizeObserver.observe(canvas);
		} else {
			window.addEventListener("resize", layout);
		}
		if ("IntersectionObserver" in window && !reduce) {
			canvas.__tmViewObserver = new IntersectionObserver(function (entries) {
				setVisible(entries.some(function (entry) { return entry.isIntersecting; }));
			}, { rootMargin: rootMargin });
			canvas.__tmViewObserver.observe(canvas);
			window.addEventListener("scroll", queueCheck, { passive: true });
			window.addEventListener("resize", queueCheck);
			setTimeout(check, 0);
		} else {
			visible = true;
			startLoad(false);
		}
		return { redraw: request, ctx: ctx };
	};

	TM.numberLine = function (canvas, opts) {
		if (!canvas) return null;
		opts = opts || {};
		var state = { highlight: opts.highlight || null };
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
			ctx.strokeStyle = c.dark ? "rgba(203,213,225,.28)" : "rgba(0,75,111,.3)";
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
				ctx.strokeStyle = c.dark ? "rgba(203,213,225,.36)" : "rgba(0,75,111,.36)";
				ctx.lineWidth = 1;
				ctx.beginPath(); ctx.moveTo(x, axisY - 7); ctx.lineTo(x, axisY + 7); ctx.stroke();
				ctx.beginPath(); ctx.arc(x, axisY, 6, 0, Math.PI * 2);
				ctx.fillStyle = p.color || c.green;
				ctx.fill();
				ctx.lineWidth = 2; ctx.strokeStyle = c.paper; ctx.stroke();
				ctx.fillStyle = c.ink;
				ctx.font = "700 11px system-ui, sans-serif";
				ctx.textAlign = "center";
				ctx.fillText(p.label, x, axisY - 18);
				ctx.fillStyle = c.muted;
				ctx.font = "600 10px system-ui, sans-serif";
				ctx.fillText(String(p.value), x, axisY + 24);
			});
			ops.forEach(function (op, i) {
				var y = 20 + i * 26;
				var lo = Math.min(op.from, op.to), hi = Math.max(op.from, op.to);
				var x1 = X(lo), x2 = X(hi);
				var color = op.color || c.blue;
				var guideTop = y + 4, guideBottom = axisY - 30;
				if (guideBottom > guideTop) {
					ctx.save();
					ctx.globalAlpha = 0.45;
					ctx.setLineDash([3, 4]);
					ctx.strokeStyle = color;
					ctx.lineWidth = 1;
					ctx.beginPath(); ctx.moveTo(x1, guideTop); ctx.lineTo(x1, guideBottom); ctx.stroke();
					ctx.beginPath(); ctx.moveTo(x2, guideTop); ctx.lineTo(x2, guideBottom); ctx.stroke();
					ctx.restore();
				}
				ctx.strokeStyle = color;
				ctx.lineWidth = 1.6;
				ctx.beginPath(); ctx.moveTo(x1, y); ctx.lineTo(x2, y); ctx.stroke();
				ctx.fillStyle = color;
				ctx.beginPath();
				ctx.moveTo(x2, y); ctx.lineTo(x2 - 8, y - 4); ctx.lineTo(x2 - 8, y + 4); ctx.fill();
				ctx.font = "600 10px system-ui, sans-serif";
				ctx.textAlign = "center";
				ctx.fillText(op.label, (x1 + x2) / 2, y - 6);
			});
			if (state.highlight && state.highlight.value != null) {
				var hv = Number(state.highlight.value);
				var hx = X(hv);
				var hc = state.highlight.color || c.green;
				ctx.save();
				ctx.strokeStyle = hc;
				ctx.lineWidth = 2;
				ctx.setLineDash([4, 3]);
				ctx.beginPath(); ctx.moveTo(hx, axisY - 34); ctx.lineTo(hx, axisY + 10); ctx.stroke();
				ctx.setLineDash([]);
				ctx.beginPath(); ctx.arc(hx, axisY, 11, 0, Math.PI * 2); ctx.stroke();
				ctx.fillStyle = hc;
				ctx.font = "700 11px system-ui, sans-serif";
				ctx.textAlign = "center";
				ctx.fillText(state.highlight.label || "", hx, axisY - 44);
				ctx.fillStyle = c.muted;
				ctx.font = "600 10px system-ui, sans-serif";
				ctx.fillText(hv.toFixed(1), hx, axisY + 40);
				if (state.highlight.showVector) {
					var vx0 = X(0);
					var vy = 22;
					ctx.strokeStyle = hc;
					ctx.lineWidth = 2;
					ctx.beginPath(); ctx.moveTo(vx0, vy); ctx.lineTo(hx, vy); ctx.stroke();
					var dir = hx >= vx0 ? 1 : -1;
					ctx.beginPath(); ctx.moveTo(hx, vy); ctx.lineTo(hx - dir * 8, vy - 4); ctx.lineTo(hx - dir * 8, vy + 4); ctx.closePath();
					ctx.fillStyle = hc;
					ctx.fill();
					ctx.font = "600 10px system-ui, sans-serif";
					ctx.textAlign = "center";
					ctx.fillText(state.highlight.vectorLabel || "result", (vx0 + hx) / 2, vy - 6);
				}
				ctx.restore();
			}
		});
		api.setHighlight = function (highlight) {
			state.highlight = highlight || null;
			api.redraw();
		};
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

	function applyTheme() {
		var root = document.getElementById("tm-intuition");
		if (!root) return;
		var dark = document.documentElement.classList.contains("dark");
		if (root.classList.contains("tm-dark") === dark) return;
		root.classList.toggle("tm-dark", dark);
		window.dispatchEvent(new CustomEvent("tm:theme", { detail: { theme: dark ? "dark" : "light" } }));
	}

	function boot() {
		applyTheme();
		TM.typesetMath(document);
		if (window.__MN_DARK && window.__MN_DARK.onChange) window.__MN_DARK.onChange(applyTheme);
		if (window.MutationObserver) {
			new MutationObserver(applyTheme).observe(document.documentElement, {
				attributes: true,
				attributeFilter: ["class"]
			});
		}
		window.addEventListener("blogPostLoadComplete", applyTheme);
	}

	if (document.readyState === "loading") {
		document.addEventListener("DOMContentLoaded", boot);
	} else {
		setTimeout(boot, 0);
	}
})();
